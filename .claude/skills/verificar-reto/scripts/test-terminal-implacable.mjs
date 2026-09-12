/* Recorrido completo de «Terminal implacable»: resuelve las 27
   tareas con la solución canónica y comprueba el informe final. */
import { launch, fileUrl } from './cdp.mjs';
import { checker, game } from './helpers.mjs';

const t = checker();
const b = await launch(fileUrl('terminal-implacable/index.html'), { port: 9401 });
const g = game(b);
const check = t.check;

/* Cada paso: [código de tarea, órdenes que la resuelven] */
const PASOS = [
  ['LNX-01', ['pwd']],
  ['LNX-02', ['ls']],
  ['LNX-03', ['ls -l']],
  ['LNX-04', ['ls -la']],
  ['LNX-05', ['cd documentos']],
  ['LNX-06', ['cd ..']],
  ['LNX-07', ['tree']],
  ['LNX-08', ['cat bienvenida.txt']],
  ['LNX-09', ['head -n 3 registros/acceso.log']],
  ['LNX-10', ['tail -n 3 registros/sistema.log']],
  ['LNX-11', ['wc -l registros/acceso.log']],
  ['LNX-12', ['grep WARN registros/acceso.log']],
  ['LNX-13', ['file scripts/copia.sh']],
  ['LNX-14', ['mkdir tareas/entregas']],
  ['LNX-15', ['cp documentos/informe-red.txt documentos/informe-red.txt.bak']],
  ['LNX-16', ['echo "Punto de acceso de planta 2 averiado" > tareas/entregas/parte.txt']],
  ['LNX-17', ['echo "Enlace de respaldo de Santa Cruz cortado" >> tareas/entregas/parte.txt']],
  ['LNX-18', ['mv tareas/pendientes.txt tareas/entregas/']],
  ['LNX-19', ['rm documentos/informe-red.txt.bak']],
  ['LNX-20', ['find . -name notas.md']],
  ['LNX-21', ['grep -r ERROR registros']],
  ['LNX-22', ['grep WARN registros/acceso.log | wc -l']],
  ['LNX-23', ['grep WARN registros/acceso.log | wc -l > tareas/entregas/resumen.txt']],
  ['LNX-24', ['whoami']],
  ['LNX-25', ['id']],
  ['LNX-26', ['man ls']],
  ['LNX-27', ['history']]
];

try {
  t.section('Portada');
  check((await b.eval(`document.getElementById('phaseOptions').children.length`)) === 5, 'la portada ofrece las 5 fases');

  await g.start();
  t.section('Recorrido completo');
  for (const [code, cmds] of PASOS) {
    await g.waitMission(code);
    for (const c of cmds) { await g.type(c); }
    await g.waitDone();
    check(true, code + ' resuelta con: ' + cmds.join(' ; '));
  }

  t.section('Comprobaciones del sistema simulado');
  const salida = await g.run('cat tareas/entregas/resumen.txt');
  check(/\b3\b/.test(salida), 'el resumen guardado contiene el recuento de WARN (3)', salida);
  const ls = await g.run('ls tareas/entregas');
  check(ls.includes('parte.txt') && ls.includes('pendientes.txt') && ls.includes('resumen.txt'),
    'la carpeta de entregas tiene los tres ficheros', ls);
  const err = await g.run('cat no-existe.txt');
  check(err.includes('No existe el fichero o el directorio'), 'los errores son los de bash', err);
  const denegado = await g.run('cd /root');
  check(denegado.includes('Permiso denegado'), 'los permisos se respetan (no se entra en /root)', denegado);

  t.section('Informe final');
  await b.eval(`document.getElementById('reportBtn').click()`);
  await b.waitFor(`!document.getElementById('screenDebrief').hidden`, { label: 'informe final' });
  const xp = Number(await b.eval(`document.getElementById('dXp').textContent.replace(/\\D/g,'')`));
  check(xp > 2000, 'el XP final supera los 2000 puntos (' + xp + ')');
  check((await b.eval(`document.getElementById('reportBody').querySelectorAll('tr:not(.ph)').length`)) === 27,
    'el informe lista las 27 tareas');
  check((await b.eval(`document.querySelectorAll('#badgeGrid .badge.earned').length`)) >= 4,
    'se consiguen al menos 4 insignias sin pistas');
  check((await b.eval(`document.getElementById('riskyList').className`)).includes('good'),
    'no hay decisiones arriesgadas anotadas');

  t.section('Empezar por una fase');
  await g.home();
  await g.start(3);
  await g.waitMission('LNX-20');
  const preparado = await g.run('ls tareas/entregas');
  check(preparado.includes('parte.txt') && preparado.includes('pendientes.txt'),
    'al empezar en la fase 4, las fases anteriores están preparadas', preparado);
  check(Number(await g.xp()) === 0, 'las tareas preparadas no suman XP');

  check(b.errors.length === 0, 'sin errores de JavaScript', b.errors.join(' | '));
} catch (e) {
  t.error(e);
} finally {
  t.summary();
  b.close();
  process.exit(t.fail ? 1 : 0);
}
