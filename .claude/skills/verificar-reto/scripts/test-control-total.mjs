/* Recorrido completo de «Control total»: resuelve las 25 tareas
   y comprueba que las ACE, la herencia y las denegaciones se aplican. */
import { launch, fileUrl } from './cdp.mjs';
import { checker, game } from './helpers.mjs';

const t = checker();
const b = await launch(fileUrl('control-total/index.html'), { port: 9405 });
const g = game(b);
const check = t.check;

const PASOS = [
  ['NTF-01', ['Get-ChildItem']],
  ['NTF-02', ['Get-Acl C:\\Datos | Format-List']],
  ['NTF-03', ['icacls C:\\Datos']],
  ['NTF-04', ['icacls C:\\Datos\\Privado']],
  ['NTF-05', ['Get-Content C:\\Datos\\Privado\\credenciales.txt']],
  ['NTF-06', ['icacls C:\\Datos /remove Todos']],
  ['NTF-07', ['icacls C:\\Datos /grant Usuarios:(RX)']],
  ['NTF-08', ['icacls C:\\Datos\\Proyectos /grant Proyectos:(M)']],
  ['NTF-09', ['icacls C:\\Datos\\Ventas /grant Ventas:(M)']],
  ['NTF-10', ['icacls C:\\Datos\\Direccion /grant Direccion:(R)']],
  ['NTF-11', ['icacls C:\\Datos\\Privado']],
  ['NTF-12', ['icacls C:\\Datos\\Privado /inheritance:r']],
  ['NTF-13', ['icacls C:\\Datos\\Privado /grant Administradores:(F)']],
  ['NTF-14', ['icacls C:\\Datos\\Privado']],
  ['NTF-15', ['icacls C:\\Datos\\Ventas /inheritance:e']],
  ['NTF-16', ['icacls C:\\Datos\\Ventas /remove Todos']],
  ['NTF-17', ['icacls C:\\Datos\\Direccion /deny Ventas:(RX)']],
  ['NTF-18', ['icacls C:\\Datos\\Direccion']],
  ['NTF-19', ['Get-Acl C:\\Datos\\Proyectos\\plan-2027.txt | Format-List']],
  ['NTF-20', ['takeown /F C:\\Datos\\Proyectos\\plan-2027.txt']],
  ['NTF-21', ['icacls C:\\Datos\\Proyectos\\plan-2027.txt /setowner Administradores']],
  ['NTF-22', ['Get-Acl C:\\Datos\\Proyectos | Format-List']],
  ['NTF-23', ['icacls C:\\Datos > C:\\Datos\\permisos.txt']],
  ['NTF-24', ['Add-Content -Path C:\\Datos\\permisos.txt -Value "Criterio: minimo privilegio por grupo; Privado sin herencia."']],
  ['NTF-25', ['icacls C:\\Datos']]
];

try {
  t.section('Portada');
  check((await b.eval(`document.getElementById('phaseOptions').children.length`)) === 5, 'la portada ofrece las 5 fases');

  await g.start();

  t.section('Estado inicial');
  const inicial = await g.run('icacls C:\\Datos');
  check(inicial.includes('Todos:(F)'), 'la carpeta empieza con «Todos» y control total', inicial);
  const heredado = await g.run('icacls C:\\Datos\\Privado');
  check(heredado.includes('(I)'), 'las subcarpetas lo reciben por herencia', heredado);

  t.section('Recorrido completo');
  for (const [code, cmds] of PASOS) {
    await g.waitMission(code);
    for (const c of cmds) { await g.type(c); }
    await g.waitDone();
    check(true, code + ' resuelta con: ' + cmds.join(' ; '));
  }

  t.section('Las ACL funcionan de verdad');
  const raiz = await g.run('icacls C:\\Datos');
  check(!raiz.includes('Todos') && raiz.includes('Usuarios:(RX)'), 'la raíz queda sin «Todos» y con Usuarios en solo lectura', raiz);
  const privado = await g.run('icacls C:\\Datos\\Privado');
  check(!privado.includes('(I)') && privado.includes('Administradores:(F)'),
    'Privado no hereda nada y solo lo ve Administradores', privado);
  const ventas = await g.run('icacls C:\\Datos\\Ventas');
  check(ventas.includes('(I)') && ventas.includes('Ventas:(M)'), 'Ventas vuelve a heredar y conserva su permiso propio', ventas);
  const direccion = await g.run('icacls C:\\Datos\\Direccion');
  check(direccion.includes('(DENY)'), 'la denegación explícita aparece marcada', direccion);
  const dueno = await g.run('Get-Acl C:\\Datos\\Proyectos\\plan-2027.txt | Format-List');
  check(/Owner\s*:\s*Administradores/.test(dueno), 'el fichero de la ex-compañera ya es del grupo Administradores', dueno);
  const informe = await g.run('Get-Content C:\\Datos\\permisos.txt');
  check(informe.includes('Criterio'), 'el informe escrito conserva la conclusión añadida', informe);
  const malParam = await g.run('icacls C:\\Datos /grant Ventas:(Z)');
  check(malParam.includes('Parámetro no válido'), 'icacls rechaza permisos inventados', malParam);

  t.section('Informe final');
  await b.eval(`document.getElementById('reportBtn').click()`);
  await b.waitFor(`!document.getElementById('screenDebrief').hidden`, { label: 'informe final' });
  const xp = Number(await b.eval(`document.getElementById('dXp').textContent.replace(/\\D/g,'')`));
  check(xp > 3000, 'el XP final supera los 3000 puntos (' + xp + ')');
  check((await b.eval(`document.getElementById('reportBody').querySelectorAll('tr:not(.ph)').length`)) === 25,
    'el informe lista las 25 tareas');
  check((await b.eval(`document.getElementById('riskyList').className`)).includes('good'),
    'no hay decisiones arriesgadas anotadas');
  check((await b.eval(`document.querySelectorAll('#badgeGrid .badge.earned').length`)) >= 5,
    'se consiguen al menos 5 insignias sin pistas');

  t.section('Empezar por una fase');
  await g.home();
  await g.start(3);
  await g.waitMission('NTF-17');
  const preparado = await g.run('icacls C:\\Datos\\Privado');
  check(!preparado.includes('(I)'), 'al empezar en la fase 4 la herencia ya está cortada en Privado', preparado);
  check(Number(await g.xp()) === 0, 'las tareas preparadas no suman XP');

  check(b.errors.length === 0, 'sin errores de JavaScript', b.errors.join(' | '));
} catch (e) {
  t.error(e);
} finally {
  t.summary();
  b.close();
  process.exit(t.fail ? 1 : 0);
}
