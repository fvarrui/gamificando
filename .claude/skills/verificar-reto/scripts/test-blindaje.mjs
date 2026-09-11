/* Recorrido completo de «Blindaje de la Red». */
import { launch, fileUrl, sleep } from './cdp.mjs';
import { checker, game } from './helpers.mjs';

const t = checker();
const b = await launch(fileUrl('blindaje-de-la-red/index.html'), { port: 9391 });
const g = game(b);
const check = t.check;

try {
  let out;
  t.section('1. Portada y conexión');
  check(await b.eval(`document.getElementById('screenIntro').hidden===false`), 'la portada se muestra');
  check((await b.eval(`document.title`)).includes('Blindaje'), 'el título es correcto');
  await g.start();
  await g.waitMission('BT-00');
  out = await g.term();
  check(out.includes('Authenticated to 192.168.30.15') && out.includes('Welcome to Ubuntu') &&
    out.includes('incidente de seguridad en curso'), 'la secuencia SSH se reproduce al conectar');
  check(true, 'llega la primera orden del Blue Team (BT-00)');
  check(await b.eval(`document.querySelectorAll('#pips .pip').length===7`), 'hay 7 indicadores de alerta');
  check(await b.eval(`document.querySelectorAll('#pips .pip.locked').length===6`), 'las alertas futuras están sin revelar');

  t.section('2. Observar antes de actuar');
  out = await g.run('systemctl stop inetd');
  check(out.includes('Un Blue Team no actúa a ciegas'), 'actuar antes del reconocimiento se rechaza con una explicación');
  out = await g.run('ss -tul');
  check(out.includes('Sin la opción -p no ves qué proceso'), 'ss sin -p avisa de que falta el PID');
  out = await g.run('ss -tulpn');
  check(out.includes('in.telnetd') && out.includes('LISTEN') && out.includes('users:(("sshd",pid=812'),
    'ss -tulpn lista los servicios con su PID');
  await g.waitDone();
  check(await g.cardDone(), 'el reconocimiento completa la misión BT-00');

  t.section('3. Contención de las amenazas');
  await g.waitMission('SOC-1041');
  out = await g.run('kill 1044');
  check(out.trim().split('\n').length <= 2, 'kill no imprime nada cuando tiene éxito');
  await g.waitDone();
  check(true, 'Telnet contenido con kill');

  await g.waitMission('SOC-1042');
  out = await g.run('systemctl disable vsftpd');
  check(out.includes('disable solo evita que vsftpd arranque'), 'disable sin --now explica que no detiene el servicio');
  await g.run('systemctl stop vsftpd');
  await g.waitDone();
  check(true, 'FTP contenido con systemctl stop');

  await g.waitMission('SOC-1043');
  // contención proactiva del puerto 445, antes de que llegue su alerta
  await g.run('iptables -A INPUT -p tcp --dport 445 -j DROP');
  out = await g.run('ufw deny 80');
  check(out.includes('Rule added'), 'ufw deny añade la regla');
  await g.waitDone();
  out = await g.run('ss -tulpn');
  check(out.includes('siguen en LISTEN porque el proceso sigue vivo'),
    'el cortafuegos no detiene el servicio, y el juego lo explica');
  check(out.includes('apache2'), 'apache2 sigue vivo tras el bloqueo del cortafuegos');

  await g.waitMission('SOC-1044');
  await g.waitDone(15000);
  out = await g.term();
  check(out.includes('ya estaba contenida') && out.includes('bonus proactivo'),
    'contener una amenaza antes de su alerta da bonus proactivo');

  await g.waitMission('SOC-1045');
  out = await g.run('kill 812');
  check(out.includes('Decisión arriesgada') && out.includes('sshd'), 'detener un servicio legítimo avisa y penaliza');
  out = await g.run('ufw deny 3306');
  check(out.includes('solo escucha en 127.0.0.1'), 'bloquear un puerto que solo escucha en localhost no cambia nada');
  await g.run('systemctl stop xrdp');
  await g.waitDone();
  check(true, 'RDP contenido con systemctl stop');

  t.section('4. Verificación final e informe');
  await g.waitMission('BT-99');
  out = await g.run('netstat -tulpn');
  check(!out.includes('in.telnetd') && !out.includes('vsftpd') && !out.includes('xrdp'),
    'los servicios detenidos ya no aparecen');
  check(out.includes('smbd') && out.includes('apache2'),
    'los bloqueados por el cortafuegos siguen en LISTEN (proceso vivo, tráfico descartado)');
  await b.waitFor(`document.getElementById('reportBtn')!==null`, { label: 'botón de informe' });
  check(true, 'la verificación final cierra el incidente');
  await b.eval(`document.getElementById('reportBtn').click()`);
  await b.waitFor(`!document.getElementById('screenDebrief').hidden`, { label: 'informe' });
  const xp = await b.eval(`document.getElementById('dXp').textContent`);
  check(parseInt(xp, 10) > 300, 'el informe muestra la XP acumulada (' + xp + ')');
  check(await b.eval(`document.querySelectorAll('#reportBody tr').length===7`), 'el informe lista las 7 alertas');
  check(await b.eval(`document.querySelectorAll('#badgeGrid .badge').length===6`), 'el informe muestra las 6 insignias');
  check(await b.eval(`document.querySelector('#badgeGrid .badge.earned') !== null`), 'se consiguen insignias');
  check(await b.eval(`document.getElementById('riskyList').textContent.includes('sshd')`), 'la decisión arriesgada queda anotada');
  check(await b.eval(`document.getElementById('debriefMsg').textContent.includes('cortafuegos')`),
    'el informe recuerda los servicios que siguen tras el cortafuegos');

  t.section('5. Exploración y ambientación');
  await b.eval(`document.getElementById('againBtn').click()`);
  await b.waitFor(`!document.getElementById('screenGame').hidden`, { label: 'nueva partida' });
  await g.waitMission('BT-00');
  check(await g.xp() === '0', 'jugar de nuevo reinicia la XP');
  out = await g.run('man ss');
  check(out.includes('SINOPSIS') && out.includes('ss -tulpn'), 'man ss muestra la página de manual');
  out = await g.run('cat .bash_history');
  check(out.includes('anonymous_enable=YES'), 'el .bash_history da pistas de la mala configuración');
  out = await g.run('ls -la');
  check(out.includes('informe_incidente.txt'), 'ls -la lista los ficheros del servidor');
  out = await g.run('ss -tulpn | grep 3389');
  check(out.includes('xrdp') && !out.includes('sshd'), 'las tuberías con grep filtran la salida');
  out = await g.run('ps aux | grep smbd');
  check(out.includes('smbd'), 'ps aux funciona con grep');
  out = await g.run('systemctl status apache2');
  check(out.includes('active (running)'), 'systemctl status muestra el estado del servicio');
  out = await g.run('kill 1');
  check(out.includes('proceso del sistema operativo'), 'matar un proceso del sistema se explica');
  out = await g.run('vim algo');
  check(out.includes('orden no encontrada'), 'una orden inexistente da el error de bash');
  out = await g.run('history');
  check(out.includes('man ss'), 'history recuerda las órdenes escritas');
  await g.type('exit');
  await sleep(2600);
  check((await g.term()).includes('Sesión restaurada'), 'exit cierra la sesión y reconecta');

  t.section('6. Accesibilidad y errores');
  check(await b.eval(`document.getElementById('terminalOutput').getAttribute('role')==='log'`), 'la salida es role="log"');
  await b.setViewport(400, 800);
  await sleep(400);
  check(await b.eval(`document.documentElement.scrollWidth <= 401`), 'a 400 px no hay scroll horizontal');
  await b.setViewport(1440, 900);
  await sleep(300);
  check(b.errors.length === 0, 'ninguna excepción ni aviso de consola', b.errors.join(' | '));
} catch (e) {
  t.error(e);
} finally {
  t.summary();
  b.close();
  process.exit(t.fail ? 1 : 0);
}
