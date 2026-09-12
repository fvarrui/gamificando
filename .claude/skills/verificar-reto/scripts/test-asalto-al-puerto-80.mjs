/* Recorrido completo de «Asalto al puerto 80»: resuelve las 24 tareas y
   comprueba el conflicto de puertos, el arranque y las salvaguardas. */
import { launch, fileUrl } from './cdp.mjs';
import { checker, game } from './helpers.mjs';

const t = checker();
const b = await launch(fileUrl('asalto-al-puerto-80/index.html'), { port: 9408 });
const g = game(b);
const check = t.check;

const PASOS = [
  ['SVC-01', ['cat guardia.txt']],
  ['SVC-02', ['systemctl status nginx']],
  ['SVC-03', ['journalctl -u nginx']],
  ['SVC-04', ['systemctl list-units --type=service']],
  ['SVC-05', ['ps aux']],
  ['SVC-06', ['systemctl status apache2']],
  ['SVC-07', ['sudo systemctl stop apache2']],
  ['SVC-08', ['sudo systemctl disable apache2']],
  ['SVC-09', ['sudo systemctl start nginx']],
  ['SVC-10', ['systemctl status nginx']],
  ['SVC-11', ['systemctl is-enabled nginx']],
  ['SVC-12', ['sudo systemctl enable nginx']],
  ['SVC-13', ['systemctl is-enabled nginx']],
  ['SVC-14', ['sudo systemctl enable --now fail2ban']],
  ['SVC-15', ['systemctl is-active fail2ban']],
  ['SVC-16', ['systemctl status cups']],
  ['SVC-17', ['sudo systemctl disable --now cups']],
  ['SVC-18', ['systemctl list-units --type=service']],
  ['SVC-19', ['sudo systemctl restart mariadb']],
  ['SVC-20', ['journalctl -u nginx -n 5']],
  ['SVC-21', ['systemctl is-active ssh']],
  ['SVC-22', ['systemctl is-enabled apache2']],
  ['SVC-23', ['systemctl list-units --type=service > estado-final.txt']],
  ['SVC-24', ['echo "03:40 Causa: apache2 ocupaba el puerto 80." >> guardia.txt']]
];

try {
  t.section('Portada');
  check((await b.eval(`document.getElementById('phaseOptions').children.length`)) === 5, 'la portada ofrece las 5 fases');

  await g.start();
  await g.waitMission('SVC-01');

  t.section('El conflicto de puertos es real');
  const falla = await g.run('sudo systemctl start nginx');
  check(falla.includes('failed'), 'nginx no arranca mientras apache2 ocupa el puerto 80', falla);
  const sinSudo = await g.run('systemctl stop apache2');
  check(sinSudo.includes('Access denied'), 'sin sudo no se pueden gestionar servicios', sinSudo);

  t.section('Recorrido completo');
  for (const [code, cmds] of PASOS) {
    await g.waitMission(code);
    for (const c of cmds) { await g.type(c); }
    await g.waitDone();
    check(true, code + ' resuelta con: ' + cmds.join(' ; '));
  }

  t.section('El estado final es el correcto');
  const nginx = await g.run('systemctl status nginx');
  check(nginx.includes('active (running)') && nginx.includes('enabled'),
    'nginx queda activo y habilitado', nginx);
  const apache = await g.run('systemctl status apache2');
  check(apache.includes('inactive (dead)') && apache.includes('disabled'),
    'apache2 queda parado y deshabilitado', apache);
  const lista = await g.run('systemctl list-units --type=service');
  check(lista.includes('nginx') && lista.includes('fail2ban') && !lista.includes('cups'),
    'la lista de servicios activos refleja el trabajo hecho', lista);
  const volver = await g.run('sudo systemctl start apache2');
  check(volver.includes('failed'), 'ahora es apache2 el que no puede arrancar: el puerto lo tiene nginx', volver);
  const inexistente = await g.run('systemctl status inventado');
  check(inexistente.includes('could not be found'), 'un servicio inexistente responde como systemd', inexistente);

  t.section('Informe final');
  await b.eval(`document.getElementById('reportBtn').click()`);
  await b.waitFor(`!document.getElementById('screenDebrief').hidden`, { label: 'parte de guardia' });
  const xp = Number(await b.eval(`document.getElementById('dXp').textContent.replace(/\\D/g,'')`));
  check(xp > 2500, 'el XP final supera los 2500 puntos (' + xp + ')');
  check((await b.eval(`document.getElementById('reportBody').querySelectorAll('tr:not(.ph)').length`)) === 24,
    'el informe lista las 24 tareas');
  check((await b.eval(`document.querySelectorAll('#badgeGrid .badge.earned').length`)) >= 5,
    'se consiguen al menos 5 insignias sin pistas');

  t.section('Tumbar la base de datos queda anotado');
  await g.home();
  await g.start(3);
  await g.waitMission('SVC-16');
  await g.type('sudo systemctl stop mariadb');
  const aviso = await g.term();
  check(aviso.includes('Decisión arriesgada'), 'parar la base de datos se anota como decisión arriesgada', aviso);

  check(b.errors.length === 0, 'sin errores de JavaScript', b.errors.join(' | '));
} catch (e) {
  t.error(e);
} finally {
  t.summary();
  b.close();
  process.exit(t.fail ? 1 : 0);
}
