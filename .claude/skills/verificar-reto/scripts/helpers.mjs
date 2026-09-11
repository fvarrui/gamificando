/* ==========================================================
   Ayudas comunes a todas las pruebas: contador de
   comprobaciones y control del juego desde la terminal.
   ========================================================== */
import { sleep } from './cdp.mjs';

const q = s => JSON.stringify(s);

/* Contador de comprobaciones con resumen final */
export function checker(titulo) {
  const failures = [];
  let pass = 0, fail = 0;
  if (titulo) { console.log('\n### ' + titulo); }
  return {
    check(ok, label, extra) {
      if (ok) { pass++; console.log('  ✔ ' + label); }
      else {
        fail++;
        failures.push(label);
        console.log('  ✘ ' + label + (extra ? '\n      ' + String(extra).slice(0, 400).replace(/\n/g, '\n      ') : ''));
      }
    },
    section(name) { console.log('\n=== ' + name + ' ==='); },
    error(e) {
      fail++;
      failures.push('EXCEPCIÓN: ' + e.message);
      console.log('\n  ✘ EXCEPCIÓN: ' + e.message);
    },
    summary() {
      console.log('\n--- Resumen: ' + pass + ' correctas, ' + fail + ' fallidas ---');
      if (failures.length) { console.log('Fallos:\n- ' + failures.join('\n- ')); }
      return { pass, fail };
    },
    get fail() { return fail; }
  };
}

/* Manejo del juego: escribir órdenes, leer la terminal y esperar misiones */
export function game(b) {
  const api = {
    term: () => b.eval(`document.getElementById('terminalOutput').innerText`),
    clear: () => b.eval(`document.getElementById('terminalOutput').innerHTML=''`),
    xp: () => b.eval(`document.getElementById('xpValue').textContent`),
    cardCode: () => b.eval(`(document.querySelector('.mcard-strip span:last-child')||{}).textContent||''`),
    cardDone: () => b.eval(`!!document.querySelector('.mcard.is-done')`),

    /* Escribe una orden y espera a que la terminal vuelva a estar libre */
    async type(cmd) {
      await b.waitFor(`!document.getElementById('terminalInput').disabled`, { label: 'terminal libre para: ' + cmd, timeout: 20000 });
      await b.eval(`(()=>{const i=document.getElementById('terminalInput');i.value=${q(cmd)};` +
        `document.getElementById('terminalForm').dispatchEvent(new Event('submit',{cancelable:true,bubbles:true}));})()`);
      await sleep(110);
    },
    /* Limpia la terminal ANTES de escribir: imprescindible para que una
       comprobación no encuentre texto de órdenes anteriores. */
    async run(cmd) {
      await api.clear();
      await api.type(cmd);
      return api.term();
    },

    /* Espera a que llegue la misión con ese código (nunca esperar por tiempo) */
    waitMission(code, timeout = 25000) {
      return b.waitFor(`(document.querySelector('.mcard-strip span:last-child')||{}).textContent===${q(code)}`,
        { label: 'misión ' + code, timeout: timeout });
    },
    waitDone(timeout = 25000) {
      return b.waitFor(`document.querySelector('.mcard.is-done')!==null`, { label: 'misión completada', timeout: timeout });
    },

    /* Editor nano */
    nanoOpen: () => b.waitFor(`!document.getElementById('nano').hidden`, { label: 'editor nano abierto' }),
    nanoValue: () => b.eval(`document.getElementById('nanoText').value`),
    setNano: text => b.eval(`document.getElementById('nanoText').value=${q(text)}`),
    async nanoKey(key, ctrl = true) {
      await b.eval(`document.getElementById('nanoText').dispatchEvent(new KeyboardEvent('keydown',` +
        `{key:${q(key)},ctrlKey:${ctrl},bubbles:true,cancelable:true}))`);
      await sleep(80);
    },
    /* Escribe el contenido, guarda (^O) y sale (^X) */
    async nanoWrite(text) {
      await api.nanoOpen();
      await api.setNano(text);
      await api.nanoKey('o');
      await api.nanoKey('x');
      await sleep(150);
    },

    /* Arranca la partida (opcionalmente desde una fase) */
    async start(phaseIndex) {
      if (phaseIndex) { await b.eval(`document.getElementById('phase${phaseIndex}').click()`); }
      await b.eval(`document.getElementById('startBtn').click()`);
      await b.waitFor(`!document.getElementById('screenGame').hidden`, { label: 'pantalla de juego' });
    },
    /* Vuelve a la portada desde el juego o desde el informe */
    async home() {
      await b.eval(`window.confirm = () => true; true`);
      await b.eval(`document.getElementById('screenDebrief').hidden ? document.getElementById('quitBtn').click() : document.getElementById('homeBtn').click()`);
      await b.waitFor(`!document.getElementById('screenIntro').hidden`, { label: 'portada' });
    }
  };
  return api;
}
