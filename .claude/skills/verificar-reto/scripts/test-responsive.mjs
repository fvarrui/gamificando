/* Ningún reto debe hacer scroll horizontal en pantallas estrechas.
   Se comprueban las tres pantallas y el modal de ayuda a 360 y 400 px.
   Las únicas excepciones permitidas son los contenedores que scrollan
   por sí mismos: la terminal y .table-wrap del informe. */
import { launch, fileUrl, sleep } from './cdp.mjs';
import { checker, game } from './helpers.mjs';

const t = checker();
const check = t.check;

/* carpeta, primera tarea de la fase final, órdenes que la cierran */
const RETOS = [
  ['terminal-implacable', 4, [['LNX-24', ['whoami']], ['LNX-25', ['id']], ['LNX-26', ['man ls']], ['LNX-27', ['history']]]],
  ['la-jungla-de-objetos', 0, null],
  ['los-intocables', 0, null],
  ['control-total', 0, null],
  ['cuenta-atras', 0, null],
  ['cuenta-pendiente', 0, null],
  ['asalto-al-puerto-80', 0, null],
  ['arranque-imposible', 0, null],
  ['carga-critica', 0, null],
  ['punto-de-retorno', 0, null],
  ['blindaje-de-la-red', 0, null]
];

const ANCHOS = [360, 400];
const MEDIDA = `(() => {
  const w = document.documentElement.clientWidth;
  const malos = [];
  document.querySelectorAll('body *').forEach(el => {
    const r = el.getBoundingClientRect();
    if (r.width === 0 && r.height === 0) return;
    if (r.right <= w + 1) return;
    if (el.closest('#terminalOutput, .input-line, .table-wrap, .final-graph, .help-table')) return;
    if (malos.some(m => m.el.contains(el))) return;
    malos.push({ el, s: el.tagName.toLowerCase() + (el.id ? '#' + el.id : '') +
      (typeof el.className === 'string' && el.className ? '.' + el.className.trim().split(/\\s+/)[0] : '') });
  });
  return { pagina: document.documentElement.scrollWidth, ventana: w, malos: malos.slice(0, 4).map(m => m.s) };
})()`;

async function mide(b, etiqueta) {
  for (const ancho of ANCHOS) {
    await b.setViewport(ancho, 780);
    await sleep(320);
    const r = await b.eval(MEDIDA);
    check(r.pagina <= r.ventana + 1 && r.malos.length === 0,
      etiqueta + ' a ' + ancho + ' px no hace scroll horizontal',
      'página ' + r.pagina + ' / ventana ' + r.ventana + (r.malos.length ? ' · se salen: ' + r.malos.join(', ') : ''));
  }
}

let puerto = 9420;
try {
  for (const [carpeta, fase, pasos] of RETOS) {
    const b = await launch(fileUrl(carpeta + '/index.html'), { port: puerto++ });
    const g = game(b);
    t.section(carpeta);
    try {
      await mide(b, 'la portada');
      await b.eval(`document.querySelector('.js-open-modal').click()`);
      await sleep(250);
      await mide(b, 'la guía de ayuda');
      await b.eval(`document.querySelector('.js-close-modal').click()`);
      await sleep(200);

      await g.start(fase);
      await sleep(2600);
      await mide(b, 'la partida');

      if (pasos) {
        for (const [code, ordenes] of pasos) {
          await g.waitMission(code);
          for (const o of ordenes) { await g.type(o); }
          await g.waitDone();
        }
        await b.waitFor(`!!document.getElementById('reportBtn')`, { label: 'botón de informe' });
        await b.eval(`document.getElementById('reportBtn').click()`);
        await b.waitFor(`!document.getElementById('screenDebrief').hidden`, { label: 'informe final' });
        await mide(b, 'el informe final');
      }
      check(b.errors.length === 0, carpeta + ': sin errores de JavaScript', b.errors.join(' | '));
    } finally { b.close(); }
  }
} catch (e) {
  t.error(e);
} finally {
  t.summary();
  process.exit(t.fail ? 1 : 0);
}
