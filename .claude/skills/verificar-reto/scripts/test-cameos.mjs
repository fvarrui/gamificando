/* Los cameos: pulsar el nombre de un personaje abre su Wikipedia, pero
   no debe verse ni comportarse como un enlace. */
import { launch, fileUrl, sleep } from './cdp.mjs';
import { checker, game } from './helpers.mjs';

const t = checker();
const b = await launch(fileUrl('los-intocables/index.html'), { port: 9412 });
const g = game(b);
const check = t.check;

try {
  t.section('En la portada');
  check(await b.eval(`document.querySelectorAll('.cameo').length > 0`),
    'los nombres del reparto quedan marcados en la portada',
    await b.eval(`document.querySelectorAll('.cameo').length`));
  check(await b.eval(`[...document.querySelectorAll('.cameo')].every(c => c.tagName === 'SPAN')`),
    'son <span>, no <a>: el lector de pantalla no los anuncia como enlaces');
  check(await b.eval(`!document.querySelector('.cameo[tabindex]') && !document.querySelector('a.cameo')`),
    'no entran en el orden de tabulación');
  check(await b.eval(`(() => { const c = document.querySelector('.cameo'); const s = getComputedStyle(c);
      const p = getComputedStyle(c.parentElement);
      return s.textDecorationLine === p.textDecorationLine && s.color === p.color && s.cursor === p.cursor; })()`),
    'no se ven como enlaces: mismo color, subrayado y cursor que el texto de alrededor');
  check(await b.eval(`document.querySelector('.cameo').getAttribute('data-wiki').startsWith('https://es.wikipedia.org/wiki/')`),
    'apuntan a la Wikipedia en español',
    await b.eval(`document.querySelector('.cameo').getAttribute('data-wiki')`));
  check(await b.eval(`[...document.querySelectorAll('.cameo')].every(c => c.getAttribute('data-wiki').includes(c.textContent.replace(/ /g,'_')))`),
    'cada nombre apunta a su propia página');

  t.section('Al pulsar');
  const abierto = await b.eval(`(() => { window.__abierto = null; window.open = (u) => { window.__abierto = u; return null; };
      document.querySelector('.cameo').click(); return window.__abierto; })()`);
  check(String(abierto).startsWith('https://es.wikipedia.org/wiki/'), 'pulsar un nombre abre su Wikipedia', abierto);

  t.section('En la ficha de tarea y en el informe');
  await g.start();
  await g.waitMission('ACL-01');
  check(await b.eval(`document.querySelectorAll('#missionSlot .cameo').length > 0`),
    'la ficha de la tarea marca el nombre de quien la envía');
  await g.type('ls -l');
  await g.waitDone();
  await sleep(300);
  check(await b.eval(`document.querySelectorAll('#missionSlot .cameo').length > 0`),
    'siguen marcados después de repintar la ficha');

  t.section('La terminal se queda fuera');
  await g.run('cat lectura.txt');
  check(await b.eval(`document.querySelectorAll('#terminalOutput .cameo').length === 0`),
    'la salida de la terminal no se toca');

  check(b.errors.length === 0, 'sin errores de JavaScript', b.errors.join(' | '));
} catch (e) {
  t.error(e);
} finally {
  t.summary();
  b.close();
  process.exit(t.fail ? 1 : 0);
}
