/* Recorrido completo de «Contenedores con Docker»: resuelve las 26 tareas
   y comprueba imágenes, volúmenes, puertos y Compose. */
import { launch, fileUrl } from './cdp.mjs';
import { checker, game } from './helpers.mjs';

const t = checker();
const b = await launch(fileUrl('contenedores-con-docker/index.html'), { port: 9410 });
const g = game(b);
const check = t.check;

const PASOS = [
  ['DKR-01', ['cat encargo.txt']],
  ['DKR-02', ['docker version']],
  ['DKR-03', ['docker images']],
  ['DKR-04', ['docker pull nginx:1.27']],
  ['DKR-05', ['docker images']],
  ['DKR-06', ['docker run -d --name web -p 8080:80 nginx:1.27']],
  ['DKR-07', ['docker ps']],
  ['DKR-08', ['docker logs web']],
  ['DKR-09', ['docker stop web']],
  ['DKR-10', ['docker ps -a']],
  ['DKR-11', ['docker rm web']],
  ['DKR-12', ['docker run -d --name base mariadb:11']],
  ['DKR-13', ['docker logs base']],
  ['DKR-14', ['docker rm base']],
  ['DKR-15', ['docker volume create datos-intranet']],
  ['DKR-16', ['docker run -d --name base -e MARIADB_ROOT_PASSWORD=Atl4nte -v datos-intranet:/var/lib/mysql mariadb:11']],
  ['DKR-17', ['docker exec base ls /var/lib/mysql']],
  ['DKR-18', ['cat intranet/Dockerfile']],
  ['DKR-19', ['cd intranet', 'docker build -t tecnoatlantica/intranet:1.0 .']],
  ['DKR-20', ['docker images']],
  ['DKR-21', ['docker run -d --name intranet -p 8080:80 tecnoatlantica/intranet:1.0']],
  ['DKR-22', ['docker run -d --name web2 -p 8080:80 nginx:1.27']],
  ['DKR-23', ['cd ~/pila', 'cat compose.yaml']],
  ['DKR-24', ['docker compose up -d']],
  ['DKR-25', ['docker compose ps']],
  ['DKR-26', ['docker compose down']]
];

try {
  t.section('Portada');
  check((await b.eval(`document.getElementById('phaseOptions').children.length`)) === 5, 'la portada ofrece las 5 fases');

  await g.start();
  await g.waitMission('DKR-01');

  t.section('El motor se comporta como Docker');
  const vacio = await g.run('docker images');
  check(vacio.includes('REPOSITORY') && !vacio.includes('nginx'), 'el servidor empieza sin imágenes', vacio);
  const noExiste = await g.run('docker pull inventada:1.0');
  check(noExiste.includes('pull access denied'), 'una imagen inexistente responde como el registro real', noExiste);
  const malSub = await g.run('docker inventar');
  check(malSub.includes("is not a docker command"), 'un subcomando inexistente responde como docker', malSub);

  t.section('Recorrido completo');
  for (const [code, cmds] of PASOS) {
    await g.waitMission(code);
    for (const c of cmds) { await g.type(c); }
    await g.waitDone();
    check(true, code + ' resuelta con: ' + cmds.join(' ; '));
  }

  t.section('El estado final es el correcto');
  const imagenes = await g.run('docker images');
  check(imagenes.includes('tecnoatlantica/intranet') && imagenes.includes('nginx') && imagenes.includes('mariadb'),
    'están las tres imágenes: la propia y las dos oficiales', imagenes);
  const volumenes = await g.run('docker volume ls');
  check(volumenes.includes('datos-intranet'), 'el volumen con los datos sigue ahí tras el compose down', volumenes);
  const ps = await g.run('docker ps');
  check(ps.includes('intranet') && ps.includes('base') && !ps.includes('cache'),
    'siguen en marcha los contenedores sueltos y la pila se ha recogido', ps);
  const enUso = await g.run('docker volume rm datos-intranet');
  check(enUso.includes('volume is in use'), 'no deja borrar un volumen que un contenedor está usando', enUso);
  const rmVivo = await g.run('docker rm intranet');
  check(rmVivo.includes('container is running'), 'no deja borrar un contenedor en marcha sin forzar', rmVivo);
  const rmiUsada = await g.run('docker rmi nginx:1.27');
  check(rmiUsada.includes('is using its referenced image') || rmiUsada.includes('Untagged'),
    'controla las imágenes en uso al borrarlas', rmiUsada);

  t.section('Informe final');
  await b.eval(`document.getElementById('reportBtn').click()`);
  await b.waitFor(`!document.getElementById('screenDebrief').hidden`, { label: 'informe final' });
  const xp = Number(await b.eval(`document.getElementById('dXp').textContent.replace(/\\D/g,'')`));
  check(xp > 2800, 'el XP final supera los 2800 puntos (' + xp + ')');
  check((await b.eval(`document.getElementById('reportBody').querySelectorAll('tr:not(.ph)').length`)) === 26,
    'el informe lista las 26 tareas');
  check((await b.eval(`document.getElementById('riskyList').className`)).includes('good'),
    'no hay decisiones arriesgadas anotadas');
  check((await b.eval(`document.querySelectorAll('#badgeGrid .badge.earned').length`)) >= 5,
    'se consiguen al menos 5 insignias sin pistas');

  t.section('Borrar el volumen de datos queda anotado');
  await g.home();
  await g.start(4);
  await g.waitMission('DKR-23');
  await g.type('docker stop base');
  await g.type('docker rm base');
  await g.type('docker volume rm datos-intranet');
  const aviso = await g.term();
  check(aviso.includes('Decisión arriesgada'), 'borrar el volumen con los datos se anota como decisión arriesgada', aviso);

  check(b.errors.length === 0, 'sin errores de JavaScript', b.errors.join(' | '));
} catch (e) {
  t.error(e);
} finally {
  t.summary();
  b.close();
  process.exit(t.fail ? 1 : 0);
}
