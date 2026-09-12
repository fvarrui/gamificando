/* Recorrido completo de «Permisos y ACL en Linux»: resuelve las 26 tareas
   y comprueba que los permisos, el SGID y las ACL se aplican de verdad. */
import { launch, fileUrl } from './cdp.mjs';
import { checker, game } from './helpers.mjs';

const t = checker();
const b = await launch(fileUrl('permisos-en-linux/index.html'), { port: 9404 });
const g = game(b);
const check = t.check;

const PASOS = [
  ['ACL-01', ['ls -l']],
  ['ACL-02', ['stat /srv/proyectos']],
  ['ACL-03', ['id']],
  ['ACL-04', ['find /srv/proyectos -perm 777']],
  ['ACL-05', ['cat privado/claves.txt']],
  ['ACL-06', ['sudo chgrp -R proyectos /srv/proyectos']],
  ['ACL-07', ['sudo chown carla memoria.txt presupuesto.csv acta-direccion.txt']],
  ['ACL-08', ['sudo chmod g+s /srv/proyectos']],
  ['ACL-09', ['touch prueba.txt', 'ls -l prueba.txt']],
  ['ACL-10', ['sudo chmod 2770 /srv/proyectos']],
  ['ACL-11', ['sudo chmod 660 memoria.txt']],
  ['ACL-12', ['sudo chmod ug+x despliegue.sh']],
  ['ACL-13', ['sudo chmod -R o-rwx /srv/proyectos']],
  ['ACL-14', ['sudo chmod 700 privado', 'sudo chmod 600 privado/claves.txt']],
  ['ACL-15', ['getfacl presupuesto.csv']],
  ['ACL-16', ['sudo setfacl -m g:ventas:r presupuesto.csv']],
  ['ACL-17', ['getfacl presupuesto.csv']],
  ['ACL-18', ['sudo setfacl -m u:dario:r acta-direccion.txt']],
  ['ACL-19', ['sudo setfacl -m u:dario:x /srv/proyectos']],
  ['ACL-20', ['sudo setfacl -x u:bruno memoria.txt']],
  ['ACL-21', ['sudo setfacl -d -m g:proyectos:rwx /srv/proyectos']],
  ['ACL-22', ['touch nuevo.txt', 'getfacl nuevo.txt']],
  ['ACL-23', ['umask']],
  ['ACL-24', ['umask 007']],
  ['ACL-25', ['find /srv/proyectos -perm 777']],
  ['ACL-26', ['ls -l > permisos.txt']]
];

try {
  t.section('Portada');
  check((await b.eval(`document.getElementById('phaseOptions').children.length`)) === 5, 'la portada ofrece las 5 fases');

  await g.start();

  t.section('Estado inicial');
  const inicial = await g.run('ls -l');
  check(inicial.includes('rwxrwxrwx') && inicial.includes('root'), 'la carpeta empieza a 777 y de root', inicial);

  t.section('Recorrido completo');
  for (const [code, cmds] of PASOS) {
    await g.waitMission(code);
    for (const c of cmds) { await g.type(c); }
    await g.waitDone();
    check(true, code + ' resuelta con: ' + cmds.join(' ; '));
  }

  t.section('El sistema de permisos funciona de verdad');
  const sgid = await g.run('ls -ld /srv/proyectos');
  check(/drwxrws---/.test(sgid), 'la carpeta queda en drwxrws--- (770 con SGID)', sgid);
  const facl = await g.run('getfacl presupuesto.csv');
  check(facl.includes('group:ventas:r--'), 'la ACL de ventas concede solo lectura', facl);
  const dfacl = await g.run('getfacl /srv/proyectos');
  check(dfacl.includes('default:group:proyectos:rwx'), 'la carpeta tiene ACL por omisión para el equipo', dfacl);
  const nuevoFacl = await g.run('getfacl nuevo.txt');
  check(nuevoFacl.includes('group:proyectos'), 'los ficheros nuevos heredan la ACL por omisión', nuevoFacl);
  const grupoNuevo = await g.run('ls -l nuevo.txt');
  check(grupoNuevo.includes('proyectos'), 'los ficheros nuevos heredan el grupo por el SGID', grupoNuevo);
  const denegado = await g.run('cat privado/claves.txt');
  check(denegado.includes('Permiso denegado'), 'las credenciales ya no son legibles por el equipo', denegado);
  const sinRoot = await g.run('chmod 777 memoria.txt');
  check(denegado.includes('Permiso denegado') || sinRoot.includes('Operación no permitida'),
    'sin sudo no se pueden cambiar permisos de ficheros ajenos', sinRoot);

  t.section('Informe final');
  await b.eval(`document.getElementById('reportBtn').click()`);
  await b.waitFor(`!document.getElementById('screenDebrief').hidden`, { label: 'informe final' });
  const xp = Number(await b.eval(`document.getElementById('dXp').textContent.replace(/\\D/g,'')`));
  check(xp > 3000, 'el XP final supera los 3000 puntos (' + xp + ')');
  check((await b.eval(`document.getElementById('reportBody').querySelectorAll('tr:not(.ph)').length`)) === 26,
    'el informe lista las 26 tareas');
  check((await b.eval(`document.getElementById('riskyList').className`)).includes('good'),
    'no hay decisiones arriesgadas anotadas');
  check((await b.eval(`document.querySelectorAll('#badgeGrid .badge.earned').length`)) >= 5,
    'se consiguen al menos 5 insignias sin pistas');

  t.section('Empezar por una fase');
  await g.home();
  await g.start(3);
  await g.waitMission('ACL-15');
  const preparado = await g.run('ls -ld /srv/proyectos');
  check(/drwxrws---/.test(preparado), 'al empezar en la fase 4 los permisos anteriores están puestos', preparado);
  check(Number(await g.xp()) === 0, 'las tareas preparadas no suman XP');

  check(b.errors.length === 0, 'sin errores de JavaScript', b.errors.join(' | '));
} catch (e) {
  t.error(e);
} finally {
  t.summary();
  b.close();
  process.exit(t.fail ? 1 : 0);
}
