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

console.log('Capturas guardadas en ' + destino);
