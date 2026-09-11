/* ==========================================================
   Arnés mínimo para manejar Chrome headless por el protocolo
   DevTools (CDP). Sin dependencias: solo Node (>= 22).
   ========================================================== */
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

/* Raíz del repositorio: .claude/skills/verificar-reto/scripts → cuatro niveles arriba */
export const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../..');

/* URL file:// de una página del repositorio, p. ej. fileUrl('versionando-con-git/index.html') */
export function fileUrl(relative) {
  return pathToFileURL(path.join(REPO, relative)).href;
}

const CHROME_CANDIDATES = [
  process.env.CHROME,
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  path.join(os.homedir(), 'AppData\\Local\\Google\\Chrome\\Application\\chrome.exe'),
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser'
].filter(Boolean);

function findChrome() {
  const found = CHROME_CANDIDATES.find(p => existsSync(p));
  if (!found) {
    throw new Error('No se ha encontrado Chrome. Indica su ruta con la variable de entorno CHROME.');
  }
  return found;
}

export const sleep = ms => new Promise(r => setTimeout(r, ms));

export async function launch(url, { width = 1440, height = 900, port = 9333, extraArgs = [] } = {}) {
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'retos-profile-'));
  const proc = spawn(findChrome(), [
    '--headless=new',
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${profile}`,
    '--no-first-run', '--no-default-browser-check', '--disable-gpu',
    `--window-size=${width},${height}`,
    ...extraArgs,
    url
  ], { stdio: 'ignore' });

  let target = null;
  for (let i = 0; i < 80; i++) {
    await sleep(250);
    try {
      const res = await fetch(`http://127.0.0.1:${port}/json`);
      target = (await res.json()).find(t => t.type === 'page' && t.url.startsWith('file:'));
      if (target) break;
    } catch { /* aún no ha arrancado */ }
  }
  if (!target) { proc.kill(); throw new Error('Chrome no arrancó'); }

  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });

  let id = 0;
  const pending = new Map();
  const errors = [];
  const logs = [];
  ws.onmessage = ev => {
    const msg = JSON.parse(ev.data);
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      if (msg.error) reject(new Error(JSON.stringify(msg.error))); else resolve(msg.result);
    } else if (msg.method === 'Runtime.exceptionThrown') {
      const d = msg.params.exceptionDetails;
      errors.push((d.exception && (d.exception.description || d.exception.value)) || d.text);
    } else if (msg.method === 'Runtime.consoleAPICalled') {
      const text = msg.params.args.map(a => a.value ?? a.description ?? '').join(' ');
      logs.push(msg.params.type + ': ' + text);
      if (msg.params.type === 'error' || msg.params.type === 'warning') {
        errors.push('console.' + msg.params.type + ': ' + text);
      }
    }
  };
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const mid = ++id;
    pending.set(mid, { resolve, reject });
    ws.send(JSON.stringify({ id: mid, method, params }));
  });

  await send('Runtime.enable');
  await send('Page.enable');

  // Espera a que la página y TODOS sus scripts estén cargados
  for (let i = 0; i < 100; i++) {
    const r = await send('Runtime.evaluate', { expression: `document.readyState === 'complete'`, returnByValue: true });
    if (r.result.value) break;
    await sleep(100);
  }

  const b = {
    errors, logs, send,
    async eval(expr) {
      const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true });
      if (r.exceptionDetails) {
        const d = r.exceptionDetails;
        throw new Error('Excepción al evaluar: ' + ((d.exception && d.exception.description) || d.text) + '\n' + expr.slice(0, 200));
      }
      return r.result.value;
    },
    async waitFor(expr, { timeout = 15000, label = expr } = {}) {
      const t0 = Date.now();
      for (;;) {
        if (await b.eval(`!!(${expr})`)) return true;
        if (Date.now() - t0 > timeout) throw new Error('Tiempo agotado esperando: ' + label);
        await sleep(120);
      }
    },
    async setViewport(w, h) {
      await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile: false });
    },
    async screenshot(file) {
      const r = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
      fs.mkdirSync(path.dirname(file), { recursive: true });
      fs.writeFileSync(file, Buffer.from(r.data, 'base64'));
    },
    close() { try { ws.close(); } catch { /* ya cerrado */ } proc.kill(); }
  };
  return b;
}
