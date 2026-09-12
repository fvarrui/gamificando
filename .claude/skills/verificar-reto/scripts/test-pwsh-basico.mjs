/* Recorrido completo de «Primeros pasos en PowerShell»: resuelve las 27
   tareas y comprueba la tubería de objetos y el informe final. */
import { launch, fileUrl } from './cdp.mjs';
import { checker, game } from './helpers.mjs';

const t = checker();
const b = await launch(fileUrl('primeros-pasos-en-powershell/index.html'), { port: 9403 });
const g = game(b);
const check = t.check;

const PASOS = [
  ['PSH-01', ['Get-Location']],
  ['PSH-02', ['Get-ChildItem']],
  ['PSH-03', ['Get-ChildItem -Directory']],
  ['PSH-04', ['Set-Location Documentos']],
  ['PSH-05', ['Set-Location ..']],
  ['PSH-06', ['Get-ChildItem -Recurse']],
  ['PSH-07', ['Get-Help Get-ChildItem']],
  ['PSH-08', ['Get-Content Bienvenida.txt']],
  ['PSH-09', ['Get-Content Registros\\acceso.log -TotalCount 3']],
  ['PSH-10', ['Get-Content Registros\\sistema.log -Tail 3']],
  ['PSH-11', ['Select-String -Pattern WARN -Path Registros\\acceso.log']],
  ['PSH-12', ['Test-Path C:\\Compartido']],
  ['PSH-13', ['New-Item -Path Tareas\\Entregas -ItemType Directory']],
  ['PSH-14', ['Set-Content -Path Tareas\\Entregas\\Parte.txt -Value "Punto de acceso de planta 2 averiado"']],
  ['PSH-15', ['Add-Content -Path Tareas\\Entregas\\Parte.txt -Value "Enlace de respaldo cortado"']],
  ['PSH-16', ['Copy-Item -Path Documentos\\Informe-Red.txt -Destination Documentos\\Informe-Red.bak']],
  ['PSH-17', ['Move-Item -Path Tareas\\Pendientes.txt -Destination Tareas\\Entregas']],
  ['PSH-18', ['Remove-Item Documentos\\Informe-Red.bak']],
  ['PSH-19', ['Get-ChildItem | Get-Member']],
  ['PSH-20', ['Get-ChildItem -Recurse | Where-Object Name -like "*.log"']],
  ['PSH-21', ['Get-ChildItem Documentos | Sort-Object Length -Descending']],
  ['PSH-22', ['Get-ChildItem Documentos | Sort-Object Length -Descending | Select-Object -First 3']],
  ['PSH-23', ['Get-ChildItem Documentos | Measure-Object -Property Length -Sum']],
  ['PSH-24', ['Get-ChildItem -Recurse | Group-Object Extension']],
  ['PSH-25', ['Get-Command -Noun Item']],
  ['PSH-26', ['Get-Alias ls']],
  ['PSH-27', ['Get-History']]
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

  t.section('Comportamiento propio de PowerShell');
  const alias = await g.run('ls');
  check(alias.includes('Directorio:') && alias.includes('Documentos'), 'el alias ls hace lo mismo que Get-ChildItem', alias);
  const mayus = await g.run('get-childitem -directory');
  check(mayus.includes('Registros'), 'los cmdlets no distinguen mayúsculas de minúsculas', mayus);
  const abrev = await g.run('Get-ChildItem -Rec -Filter *.log');
  check(abrev.includes('acceso.log') && !abrev.includes('Notas.md'), 'admite abreviaturas de parámetro y -Filter', abrev);
  const objetos = await g.run('Get-ChildItem Documentos | Where-Object Name -like "*.csv" | Select-Object Name');
  check(objetos.includes('Presupuesto.csv') && !objetos.includes('Notas.md'), 'la tubería de objetos filtra y proyecta', objetos);
  const suma = await g.run('Get-ChildItem Documentos | Measure-Object -Property Length -Sum');
  check(/Sum\s+:\s+\d{3,}/.test(suma), 'Measure-Object suma la propiedad Length', suma);
  const noExiste = await g.run('Get-Content no-existe.txt');
  check(noExiste.includes('No se encuentra la ruta de acceso'), 'los errores son los de PowerShell', noExiste);
  const desconocido = await g.run('ipconfig');
  check(desconocido.includes('no se reconoce como nombre de un cmdlet'), 'el comando desconocido responde como PowerShell', desconocido);

  t.section('Informe final');
  await b.eval(`document.getElementById('reportBtn').click()`);
  await b.waitFor(`!document.getElementById('screenDebrief').hidden`, { label: 'informe final' });
  const xp = Number(await b.eval(`document.getElementById('dXp').textContent.replace(/\\D/g,'')`));
  check(xp > 2000, 'el XP final supera los 2000 puntos (' + xp + ')');
  check((await b.eval(`document.getElementById('reportBody').querySelectorAll('tr:not(.ph)').length`)) === 27,
    'el informe lista las 27 tareas');
  check((await b.eval(`document.querySelectorAll('#badgeGrid .badge.earned').length`)) >= 5,
    'se consiguen al menos 5 insignias sin pistas');

  t.section('Empezar por una fase');
  await g.home();
  await g.start(3);
  await g.waitMission('PSH-19');
  const preparado = await g.run('Get-ChildItem Tareas\\Entregas');
  check(preparado.includes('Parte.txt') && preparado.includes('Pendientes.txt'),
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
