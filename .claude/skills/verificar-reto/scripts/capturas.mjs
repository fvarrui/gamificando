/* Capturas de pantalla de los retos (portada, juego, panel, editor y
   vista móvil). Se guardan en la carpeta que se indique, por defecto
   ./capturas dentro de la carpeta desde la que se ejecuta.
     node capturas.mjs [carpeta-destino]
   ========================================================== */
import { launch, fileUrl, sleep } from './cdp.mjs';
import { game } from './helpers.mjs';
import path from 'node:path';

const destino = path.resolve(process.argv[2] || 'capturas');
const shot = (b, name) => b.screenshot(path.join(destino, name));

/* ---- Versionando con Git ---- */
let b = await launch(fileUrl('versionando-con-git/index.html'), { port: 9396 });
let g = game(b);
try {
  await sleep(400);
  await shot(b, 'git-01-portada.png');
  await g.start(4);                       // fase 5: repositorio con historia
  await g.waitMission('GIT-23');
  await g.type('git log --oneline --graph --all');
  await g.type('git status');
  await sleep(400);
  await shot(b, 'git-02-juego.png');
  await b.eval(`document.getElementById('tabRepo').click()`);
  await sleep(400);
  await shot(b, 'git-03-repositorio.png');
  await b.eval(`document.getElementById('tabMission').click()`);
  await g.type('nano README.md');
  await g.nanoOpen();
  await sleep(300);
  await shot(b, 'git-04-nano.png');
  await g.nanoKey('x');
  await b.setViewport(400, 820);
  await sleep(400);
  await shot(b, 'git-05-movil.png');
} finally { b.close(); }

/* ---- Blindaje de la Red ---- */
b = await launch(fileUrl('blindaje-de-la-red/index.html'), { port: 9397 });
g = game(b);
try {
  await sleep(400);
  await shot(b, 'blindaje-01-portada.png');
  await g.start();
  await g.waitMission('BT-00');
  await g.type('ss -tulpn');
  await g.waitMission('SOC-1041');
  await g.type('systemctl status inetd');
  await sleep(400);
  await shot(b, 'blindaje-02-juego.png');
  await b.setViewport(400, 820);
  await sleep(400);
  await shot(b, 'blindaje-03-movil.png');
} finally { b.close(); }

/* ---- Retos de consola montados sobre shared/js/sandbox.js ----
   Para cada uno: portada, una partida empezada por la última fase y
   la vista móvil. */
const SANDBOX = [
  ['primeros-pasos-en-linux', 'linux', 4, 'LNX-24', ['ls -la', 'grep WARN registros/acceso.log | wc -l']],
  ['primeros-pasos-en-powershell', 'pwsh', 3, 'PSH-19', ['Get-ChildItem -Recurse | Where-Object Name -like "*.log"']],
  ['permisos-en-linux', 'permisos-linux', 3, 'ACL-15', ['ls -l', 'getfacl presupuesto.csv']],
  ['permisos-en-windows', 'permisos-windows', 2, 'NTF-11', ['icacls C:\\Datos', 'Get-Acl C:\\Datos | Format-List']],
  ['usuarios-y-grupos-en-linux', 'usuarios-linux', 3, 'USR-16', ['getent passwd', 'id elena']],
  ['usuarios-y-grupos-en-windows', 'usuarios-windows', 3, 'CTA-16', ['Get-LocalUser', 'Get-LocalGroupMember -Group Ventas']],
  ['servicios-en-linux', 'servicios-linux', 2, 'SVC-11', ['systemctl status nginx', 'systemctl list-units --type=service']],
  ['servicios-en-windows', 'servicios-windows', 2, 'WSV-11', ['Get-Service', 'sc.exe qc AtlanteApp']],
  ['contenedores-con-docker', 'docker', 3, 'DKR-18', ['docker ps', 'docker images']]
];

let puerto = 9411;
for (const [carpeta, prefijo, fase, tarea, ordenes] of SANDBOX) {
  b = await launch(fileUrl(carpeta + '/index.html'), { port: puerto++ });
  g = game(b);
  try {
    await sleep(400);
    await shot(b, prefijo + '-01-portada.png');
    await g.start(fase);
    await g.waitMission(tarea);
    for (const orden of ordenes) { await g.type(orden); }
    await sleep(400);
    await shot(b, prefijo + '-02-juego.png');
    await b.setViewport(400, 820);
    await sleep(400);
    await shot(b, prefijo + '-03-movil.png');
  } finally { b.close(); }
}

console.log('Capturas guardadas en ' + destino);
