/* Portada del repositorio (la que publica GitHub Pages) y navegación
   entre la portada y los retos con rutas relativas. */
import { launch, fileUrl, sleep } from './cdp.mjs';
import { checker } from './helpers.mjs';

const t = checker();
const b = await launch(fileUrl('index.html'), { port: 9395 });
const check = t.check;

try {
  check((await b.eval(`document.title`)).includes('Gamificando'), 'la portada del repositorio carga');
  check(await b.eval(`document.querySelectorAll('.reto').length >= 2`), 'muestra los retos disponibles');
  check(await b.eval(`getComputedStyle(document.body).backgroundColor === 'rgb(7, 10, 15)'`),
    'el CSS compartido se aplica (fondo de consola)');

  await b.eval(`document.querySelector('.reto:nth-child(2) a.btn-primary').click()`);
  await sleep(1500);
  check((await b.eval(`document.title`)).includes('Versionando'), 'el enlace abre el reto de Git');
  check(await b.eval(`!!document.getElementById('phaseOptions').children.length`), 'el reto carga sus scripts con rutas relativas');
  await b.eval(`document.querySelector('.intro-actions a.btn').click()`);
  await sleep(1200);
  check((await b.eval(`document.title`)).includes('Gamificando'), 'el botón «Otros retos» vuelve a la portada');

  await b.eval(`document.querySelector('.reto:nth-child(1) a.btn-primary').click()`);
  await sleep(1500);
  check((await b.eval(`document.title`)).includes('Blindaje'), 'el enlace abre el reto de blindaje');
  check(await b.eval(`typeof RG === 'object' && typeof BD === 'object'`), 'la biblioteca compartida y el reto se han cargado');

  check(b.errors.length === 0, 'sin errores de JavaScript', b.errors.join(' | '));
} catch (e) {
  t.error(e);
} finally {
  t.summary();
  b.close();
  process.exit(t.fail ? 1 : 0);
}
