/* Portada del repositorio (la que publica GitHub Pages): que estén todos los
   retos, que los enlaces sean relativos y que cada reto cargue de verdad. */
import { launch, fileUrl, sleep } from './cdp.mjs';
import { checker } from './helpers.mjs';

const t = checker();
const b = await launch(fileUrl('index.html'), { port: 9395 });
const check = t.check;

/* Carpeta del reto → parte del <title> que debe aparecer al abrirlo */
const RETOS = [
  ['terminal-implacable', 'Terminal implacable'],
  ['la-jungla-de-objetos', 'La jungla de objetos'],
  ['los-intocables', 'Los intocables'],
  ['control-total', 'Control total'],
  ['cuenta-atras', 'Cuenta atrás'],
  ['cuenta-pendiente', 'Cuenta pendiente'],
  ['asalto-al-puerto-80', 'Asalto al puerto 80'],
  ['arranque-imposible', 'Arranque imposible'],
  ['blindaje-de-la-red', 'Blindaje de la Red'],
  ['punto-de-retorno', 'Punto de retorno'],
  ['carga-critica', 'Carga crítica']
];

const q = s => JSON.stringify(s);

try {
  t.section('Portada');
  check((await b.eval(`document.title`)).includes('Gamificando'), 'la portada del repositorio carga');
  check(await b.eval(`document.querySelectorAll('.reto').length === ${RETOS.length}`),
    'muestra los ' + RETOS.length + ' retos',
    await b.eval(`document.querySelectorAll('.reto').length`));
  check(await b.eval(`getComputedStyle(document.body).backgroundColor === 'rgb(7, 10, 15)'`),
    'el CSS compartido se aplica (fondo de consola)');
  check(await b.eval(`!document.querySelector('a[href^="/"]')`), 'ningún enlace usa rutas absolutas');
  check(await b.eval(`document.querySelectorAll('.reto .acciones a[href*="README.md"]').length === ${RETOS.length}`),
    'cada reto enlaza su guía docente');

  t.section('Enlaces a los retos');
  for (const [carpeta] of RETOS) {
    check(await b.eval(`!!document.querySelector('a[href="${carpeta}/index.html"]')`),
      'la portada enlaza ' + carpeta);
  }

  t.section('Cada reto carga desde su enlace');
  for (const [carpeta, titulo] of RETOS) {
    await b.eval(`location.href = ${q(fileUrl('index.html'))}`);
    await sleep(400);
    await b.eval(`document.querySelector('a[href="${carpeta}/index.html"]').click()`);
    await sleep(1100);
    const title = await b.eval(`document.title`);
    const ok = await b.eval(`typeof RG === 'object' && !!document.getElementById('startBtn')`);
    check(title.includes(titulo) && ok, carpeta + ' abre y carga sus scripts con rutas relativas', title);
  }

  t.section('Vuelta a la portada');
  await b.eval(`document.querySelector('.intro-actions a.btn').click()`);
  await sleep(1000);
  check((await b.eval(`document.title`)).includes('Gamificando'), 'el botón «Otros juegos» vuelve a la portada');

  check(b.errors.length === 0, 'sin errores de JavaScript', b.errors.join(' | '));
} catch (e) {
  t.error(e);
} finally {
  t.summary();
  b.close();
  process.exit(t.fail ? 1 : 0);
}
