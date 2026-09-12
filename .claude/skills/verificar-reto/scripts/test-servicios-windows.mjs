/* Recorrido completo de «Servicios en Windows»: resuelve las 24 tareas y
   comprueba el tipo de inicio Deshabilitado y las salvaguardas. */
import { launch, fileUrl } from './cdp.mjs';
import { checker, game } from './helpers.mjs';

const t = checker();
const b = await launch(fileUrl('servicios-en-windows/index.html'), { port: 9409 });
const g = game(b);
const check = t.check;

const PASOS = [
  ['WSV-01', ['Get-Content guardia.txt']],
  ['WSV-02', ['Get-Service']],
  ['WSV-03', ['Get-Service -Name AtlanteApp']],
  ['WSV-04', ['Get-Service | Where-Object Status -eq Stopped']],
  ['WSV-05', ['Get-Process']],
  ['WSV-06', ['Start-Service -Name AtlanteApp']],
  ['WSV-07', ['sc.exe qc AtlanteApp']],
  ['WSV-08', ['Set-Service -Name AtlanteApp -StartupType Automatic']],
  ['WSV-09', ['Start-Service -Name AtlanteApp']],
  ['WSV-10', ['Get-Service -Name AtlanteApp']],
  ['WSV-11', ['Get-Service | Where-Object StartType -eq Automatic']],
  ['WSV-12', ['Set-Service -Name Spooler -StartupType Disabled']],
  ['WSV-13', ['Stop-Service -Name Spooler']],
  ['WSV-14', ['Get-Service -Name Spooler']],
  ['WSV-15', ['Set-Service -Name WinRM -StartupType Automatic', 'Start-Service -Name WinRM']],
  ['WSV-16', ['sc.exe query AtlanteApp']],
  ['WSV-17', ['net stop Spooler']],
  ['WSV-18', ['Restart-Service -Name MSSQLSERVER']],
  ['WSV-19', ['Get-Process -Name Atlante*']],
  ['WSV-20', ['Get-Content C:\\Atlante\\LEEME.txt']],
  ['WSV-21', ['Get-Service -Name TermService']],
  ['WSV-22', ['Get-Service | Where-Object Status -eq Running | Sort-Object Name']],
  ['WSV-23', ['Get-Service | Format-Table Name,Status,StartType > estado-final.txt']],
  ['WSV-24', ['Add-Content -Path guardia.txt -Value "08:10 Causa: estaba en tipo de inicio Deshabilitado."']]
];

try {
  t.section('Portada');
  check((await b.eval(`document.getElementById('phaseOptions').children.length`)) === 5, 'la portada ofrece las 5 fases');

  await g.start();
  await g.waitMission('WSV-01');

  t.section('Deshabilitado significa deshabilitado');
  const falla = await g.run('Start-Service -Name AtlanteApp');
  check(falla.includes('No se puede iniciar') && falla.includes('deshabilitado'),
    'un servicio en Disabled no arranca ni a mano, y la consola dice por qué', falla);

  t.section('Recorrido completo');
  for (const [code, cmds] of PASOS) {
    await g.waitMission(code);
    for (const c of cmds) { await g.type(c); }
    await g.waitDone();
    check(true, code + ' resuelta con: ' + cmds.join(' ; '));
  }

  t.section('El estado final es el correcto');
  const app = await g.run('Get-Service -Name AtlanteApp');
  check(app.includes('Running') && app.includes('Automatic'), 'AtlanteApp queda en marcha y en automático', app);
  const spooler = await g.run('Get-Service -Name Spooler');
  check(spooler.includes('Stopped') && spooler.includes('Disabled'), 'la cola de impresión queda parada y deshabilitada', spooler);
  const winrm = await g.run('Get-Service -Name WinRM');
  check(winrm.includes('Running') && winrm.includes('Automatic'), 'la administración remota queda disponible', winrm);
  const config = await g.run('sc.exe qc AtlanteApp');
  check(config.includes('AUTO_START'), 'sc.exe qc refleja el tipo de inicio cambiado', config);
  const alias = await g.run('Get-Alias sc');
  check(alias.includes('Set-Content'), 'sc es el alias de Set-Content: por eso hace falta sc.exe', alias);
  const inexistente = await g.run('Get-Service -Name Inventado');
  check(inexistente.includes('No se encuentra'), 'un servicio inexistente responde como PowerShell', inexistente);

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
  await g.waitMission('WSV-16');
  await g.type('Stop-Service -Name MSSQLSERVER');
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
