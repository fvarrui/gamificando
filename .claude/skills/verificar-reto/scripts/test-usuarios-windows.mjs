/* Recorrido completo de «Usuarios y grupos en Windows»: resuelve las 25
   tareas y comprueba cuentas locales, grupos y auditoría por objetos. */
import { launch, fileUrl } from './cdp.mjs';
import { checker, game } from './helpers.mjs';

const t = checker();
const b = await launch(fileUrl('usuarios-y-grupos-en-windows/index.html'), { port: 9407 });
const g = game(b);
const check = t.check;

const PASOS = [
  ['CTA-01', ['Get-Content altas.txt']],
  ['CTA-02', ['Get-LocalUser']],
  ['CTA-03', ['Get-LocalGroup']],
  ['CTA-04', ['Get-LocalGroupMember -Group Administradores']],
  ['CTA-05', ['Get-LocalUser | Where-Object Enabled -eq $false']],
  ['CTA-06', ['New-LocalGroup -Name Formacion -Description "Plan de formacion interno"']],
  ['CTA-07', ['New-LocalUser -Name elena -NoPassword -Description "Ventas"']],
  ['CTA-08', ['Get-LocalUser elena']],
  ['CTA-09', ['New-LocalUser -Name hugo -NoPassword -Description "Proyectos"']],
  ['CTA-10', ['Add-LocalGroupMember -Group Proyectos -Member hugo']],
  ['CTA-11', ['Add-LocalGroupMember -Group Ventas -Member elena']],
  ['CTA-12', ['Get-LocalGroupMember -Group Ventas']],
  ['CTA-13', ['Add-LocalGroupMember -Group Formacion -Member hugo']],
  ['CTA-14', ['Remove-LocalGroupMember -Group Proyectos -Member dario']],
  ['CTA-15', ['Get-LocalGroupMember -Group Proyectos']],
  ['CTA-16', ['Get-LocalUser dario']],
  ['CTA-17', ['Disable-LocalUser -Name dario']],
  ['CTA-18', ['Get-LocalUser dario']],
  ['CTA-19', ['Remove-LocalUser -Name temporal']],
  ['CTA-20', ['Remove-Item C:\\Users\\temporal -Recurse']],
  ['CTA-21', ['net user']],
  ['CTA-22', ['net localgroup Administradores']],
  ['CTA-23', ['Set-LocalUser -Name elena -Description "Ventas · Las Palmas"']],
  ['CTA-24', ['Get-LocalUser | Where-Object Enabled -eq $false | Select-Object Name,Description']],
  ['CTA-25', ['Get-LocalUser | Format-Table Name,Enabled > cuentas.txt']]
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

  t.section('El modelo de cuentas funciona de verdad');
  const elena = await g.run('Get-LocalUser elena');
  check(elena.includes('Las Palmas') && elena.includes('True'), 'Elena está habilitada y con su descripción corregida', elena);
  const ventas = await g.run('Get-LocalGroupMember -Group Ventas');
  check(ventas.includes('bruno') && ventas.includes('elena'), 'el grupo Ventas tiene a sus dos miembros', ventas);
  const dario = await g.run('Get-LocalUser dario');
  check(/dario\s+False/.test(dario), 'la baja queda deshabilitada, no eliminada', dario);
  const temporal = await g.run('Get-LocalUser temporal');
  check(temporal.includes('No se encontró'), 'la cuenta compartida ya no existe', temporal);
  const perfil = await g.run('Get-ChildItem C:\\Users');
  check(!perfil.includes('temporal'), 'su carpeta de perfil también se ha borrado', perfil);
  const dup = await g.run('New-LocalUser -Name elena -NoPassword');
  check(dup.includes('ya existe'), 'no se puede crear dos veces la misma cuenta', dup);
  const malGrupo = await g.run('Add-LocalGroupMember -Group Inventado -Member hugo');
  check(malGrupo.includes('No se encontró'), 'no se puede añadir a un grupo inexistente', malGrupo);
  const repetido = await g.run('Add-LocalGroupMember -Group Ventas -Member elena');
  check(repetido.includes('ya es miembro'), 'avisa si la persona ya está en el grupo', repetido);

  t.section('Informe final');
  await b.eval(`document.getElementById('reportBtn').click()`);
  await b.waitFor(`!document.getElementById('screenDebrief').hidden`, { label: 'informe final' });
  const xp = Number(await b.eval(`document.getElementById('dXp').textContent.replace(/\\D/g,'')`));
  check(xp > 2800, 'el XP final supera los 2800 puntos (' + xp + ')');
  check((await b.eval(`document.getElementById('reportBody').querySelectorAll('tr:not(.ph)').length`)) === 25,
    'el informe lista las 25 tareas');
  check((await b.eval(`document.getElementById('riskyList').className`)).includes('good'),
    'no hay decisiones arriesgadas anotadas');

  t.section('Eliminar en vez de deshabilitar queda anotado');
  await g.home();
  await g.start(3);
  await g.waitMission('CTA-16');
  await g.type('Remove-LocalUser -Name dario');
  const aviso = await g.term();
  check(aviso.includes('Decisión arriesgada'), 'eliminar la cuenta de la baja se anota como decisión arriesgada', aviso);

  check(b.errors.length === 0, 'sin errores de JavaScript', b.errors.join(' | '));
} catch (e) {
  t.error(e);
} finally {
  t.summary();
  b.close();
  process.exit(t.fail ? 1 : 0);
}
