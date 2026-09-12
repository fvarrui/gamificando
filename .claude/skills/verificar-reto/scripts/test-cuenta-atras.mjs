/* Recorrido completo de «Cuenta atrás»: resuelve las 25
   tareas y comprueba las cuentas, los grupos y los bloqueos. */
import { launch, fileUrl } from './cdp.mjs';
import { checker, game } from './helpers.mjs';

const t = checker();
const b = await launch(fileUrl('cuenta-atras/index.html'), { port: 9406 });
const g = game(b);
const check = t.check;

const PASOS = [
  ['USR-01', ['cat altas.txt']],
  ['USR-02', ['getent passwd']],
  ['USR-03', ['getent group']],
  ['USR-04', ['id yeoh']],
  ['USR-05', ['getent passwd visitas']],
  ['USR-06', ['sudo groupadd formacion']],
  ['USR-07', ['sudo useradd -m -s /bin/bash -c "Carrie-Anne Moss" moss']],
  ['USR-08', ['ls -l /home']],
  ['USR-09', ['sudo passwd moss']],
  ['USR-10', ['sudo useradd -m -c "Jackie Chan" -G proyectos chan']],
  ['USR-11', ['sudo usermod -aG ventas moss']],
  ['USR-12', ['id moss']],
  ['USR-13', ['sudo gpasswd -a chan formacion']],
  ['USR-14', ['sudo gpasswd -d vandamme proyectos']],
  ['USR-15', ['getent group proyectos']],
  ['USR-16', ['sudo passwd -S vandamme']],
  ['USR-17', ['sudo usermod -L vandamme']],
  ['USR-18', ['sudo passwd -S vandamme']],
  ['USR-19', ['sudo userdel -r visitas']],
  ['USR-20', ['ls -l /home']],
  ['USR-21', ['sudo useradd -r -s /usr/sbin/nologin svc-backup']],
  ['USR-22', ['getent passwd svc-backup']],
  ['USR-23', ['sudo usermod -s /usr/sbin/nologin vandamme']],
  ['USR-24', ['getent group formacion']],
  ['USR-25', ['getent passwd > cuentas.txt']]
];

try {
  t.section('Portada');
  check((await b.eval(`document.getElementById('phaseOptions').children.length`)) === 5, 'la portada ofrece las 5 fases');

  await g.start();

  t.section('Sin privilegios no se administra');
  await g.waitMission('USR-01');
  const sinSudo = await g.run('useradd -m prueba');
  check(sinSudo.includes('Permission denied'), 'useradd sin sudo falla como en un sistema real', sinSudo);

  t.section('Recorrido completo');
  for (const [code, cmds] of PASOS) {
    await g.waitMission(code);
    for (const c of cmds) { await g.type(c); }
    await g.waitDone();
    check(true, code + ' resuelta con: ' + cmds.join(' ; '));
  }

  t.section('El modelo de usuarios funciona de verdad');
  const moss = await g.run('id moss');
  check(moss.includes('ventas') && moss.includes('moss'), 'Carrie-Anne conserva su grupo principal y el secundario', moss);
  const svc = await g.run('getent passwd svc-backup');
  check(svc.includes('/usr/sbin/nologin'), 'la cuenta de servicio no puede iniciar sesión', svc);
  const vandamme = await g.run('sudo passwd -S vandamme');
  check(/vandamme L/.test(vandamme), 'la cuenta de la baja queda bloqueada, no borrada', vandamme);
  const visitas = await g.run('getent passwd visitas');
  check(!visitas.includes('visitas:x'), 'la cuenta compartida ya no existe', visitas);
  const home = await g.run('ls -l /home');
  check(home.includes('moss') && home.includes('chan') && !home.includes('visitas'),
    'los directorios personales reflejan las altas y la baja', home);
  const dup = await g.run('sudo useradd -m moss');
  check(dup.includes('ya existe'), 'no se puede crear dos veces la misma cuenta', dup);
  const malGrupo = await g.run('sudo usermod -aG inventado chan');
  check(malGrupo.includes('no existe'), 'no se puede añadir a un grupo inexistente', malGrupo);

  t.section('Informe final');
  await b.eval(`document.getElementById('reportBtn').click()`);
  await b.waitFor(`!document.getElementById('screenDebrief').hidden`, { label: 'informe final' });
  const xp = Number(await b.eval(`document.getElementById('dXp').textContent.replace(/\\D/g,'')`));
  check(xp > 2800, 'el XP final supera los 2800 puntos (' + xp + ')');
  check((await b.eval(`document.getElementById('reportBody').querySelectorAll('tr:not(.ph)').length`)) === 25,
    'el informe lista las 25 tareas');
  check((await b.eval(`document.getElementById('riskyList').className`)).includes('good'),
    'no hay decisiones arriesgadas anotadas');

  t.section('El error clásico queda anotado');
  await g.home();
  await g.start(2);
  await g.waitMission('USR-11');
  await g.type('sudo usermod -G ventas moss');
  const aviso = await g.term();
  check(aviso.includes('Decisión arriesgada'), 'usermod -G sin -a se anota como decisión arriesgada', aviso);

  check(b.errors.length === 0, 'sin errores de JavaScript', b.errors.join(' | '));
} catch (e) {
  t.error(e);
} finally {
  t.summary();
  b.close();
  process.exit(t.fail ? 1 : 0);
}
