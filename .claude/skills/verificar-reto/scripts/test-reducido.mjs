/* Con prefers-reduced-motion activado: sin animaciones, con esperas
   más cortas, y el editor respondiendo a la pregunta de guardado. */
import { launch, fileUrl, sleep } from './cdp.mjs';
import { checker, game } from './helpers.mjs';

const t = checker();
const b = await launch(fileUrl('punto-de-retorno/index.html'), { port: 9394, extraArgs: ['--force-prefers-reduced-motion'] });
const g = game(b);
const check = t.check;

try {
  check(await b.eval(`matchMedia('(prefers-reduced-motion: reduce)').matches`), 'el navegador declara movimiento reducido');
  await g.start();
  await g.waitMission('GIT-01', 10000);
  check(true, 'el primer ticket llega igualmente (con esperas más cortas)');
  await g.type('git config --global user.name "Linda"');
  await g.type('git config --global user.email "hamilton@x.local"');
  await g.waitMission('GIT-02', 10000);
  check(true, 'las misiones encadenan sin animaciones');
  await g.type('git init -b main');
  await g.type('nano prueba.txt');
  await g.nanoOpen();
  await g.setNano('hola');
  await g.nanoKey('x');
  check((await b.eval(`document.getElementById('nanoMsg').textContent`)).includes('Guardar el búfer modificado'),
    'nano pregunta antes de salir con cambios sin guardar');
  await g.nanoKey('s', false);
  await sleep(200);
  check(await b.eval(`document.getElementById('nano').hidden`), 'al responder «S» se guarda y se cierra el editor');
  check((await g.run('cat prueba.txt')).includes('hola'), 'el fichero se guardó con el contenido escrito');
  check(b.errors.length === 0, 'sin errores de JavaScript', b.errors.join(' | '));
} catch (e) {
  t.error(e);
} finally {
  t.summary();
  b.close();
  process.exit(t.fail ? 1 : 0);
}
