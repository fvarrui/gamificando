/* «Punto de retorno»: caminos alternativos, errores típicos del
   alumnado y decisiones arriesgadas. Empieza en la fase 5, que ya
   trae un repositorio con historia, ramas y fusiones. */
import { launch, fileUrl, sleep } from './cdp.mjs';
import { checker, game } from './helpers.mjs';

const t = checker();
const b = await launch(fileUrl('punto-de-retorno/index.html'), { port: 9393 });
const g = game(b);
const check = t.check;

try {
  let out;
  await b.waitFor(`!document.getElementById('screenIntro').hidden`);
  await g.start(4);
  await g.waitMission('GIT-23');

  t.section('Errores típicos y mensajes de ayuda');
  out = await g.run('git add fichero-que-no-existe');
  check(out.includes("pathspec 'fichero-que-no-existe' no concordó"), 'git add de una ruta inexistente da el error real');
  out = await g.run('git commit -m "sin cambios"');
  check(out.includes('nada para hacer commit'), 'git commit sin cambios muestra el estado y no crea nada');
  out = await g.run('git checkout rama-inventada');
  check(out.includes("pathspec 'rama-inventada' no concordó"), 'cambiar a una rama inexistente falla con el mensaje de git');
  out = await g.run('git branch main');
  check(out.includes("una rama llamada 'main' ya existe"), 'crear una rama repetida avisa');
  out = await g.run('git branch > ramas.txt && cat ramas.txt && rm ramas.txt');
  check(out.includes('main'), 'la redirección de la salida a un fichero funciona');
  out = await g.run('git log --invento');
  check(out.includes('opción desconocida'), 'una opción inexistente da error de opción');
  out = await g.run('git push');
  check(out.includes('No hay destino configurado para push') || out.includes('no tiene una rama upstream'),
    'push sin remoto configurado explica qué hacer');
  out = await g.run('git remote add origin git@github.com:otro/proyecto.git');
  check(out.includes('El remoto se ha guardado, pero esa dirección no responde'), 'una URL equivocada avisa al configurar el remoto');
  out = await g.run('git push -u origin main');
  check(out.includes('Could not resolve hostname') && out.includes('No se pudo leer del repositorio remoto'),
    'push a un host inexistente falla como en la realidad');
  await g.run('git remote set-url origin git@git.tecnoatlantica.local:blueteam/scripts-blindaje.git');
  out = await g.run('git push -u origin main');
  check(out.includes('[nueva rama]') && out.includes("configurada para rastrear 'origin/main'"),
    'con la URL correcta el push funciona y enlaza el upstream');

  t.section('Deshacer, ramas y viajes en el tiempo');
  await g.run('echo "prueba" >> README.md');
  check((await g.run('git stash')).includes('Directorio de trabajo guardado'), 'git stash guarda los cambios');
  check((await g.run('git stash list')).includes('stash@{0}: WIP on main'), 'git stash list muestra la pila');
  out = await g.run('git stash pop');
  check(out.includes('Cambios no rastreados para el commit') && out.includes('Descartado'), 'git stash pop devuelve los cambios');
  await g.run('git restore README.md');
  out = await g.run('git checkout HEAD~2');
  check(out.includes("Te encuentras en estado 'HEAD desacoplada'"), 'checkout de un commit explica el estado HEAD desacoplada');
  check(await b.eval(`document.getElementById('promptLabel').textContent.includes('...')`), 'el prompt refleja la HEAD desacoplada');
  check((await g.run('git switch -')).includes("Cambiado a rama 'main'"), 'git switch - vuelve a la rama anterior');
  check((await g.run('git reflog -3')).includes('checkout: moving from'), 'el reflog registra los cambios de rama');
  await g.run('git branch experimento HEAD~1');
  await g.run('git switch experimento');
  await g.run('echo "experimento" >> servicios.conf');
  await g.run('git commit -am "Prueba de experimento"');
  await g.run('git switch main');
  check((await g.run('git branch -d experimento')).includes('no ha sido fusionada completamente'), 'borrar una rama sin fusionar se rechaza');
  check((await g.run('git branch -D experimento')).includes('Eliminada la rama experimento'), 'con -D se borra igualmente');
  check(await g.xp() !== '0', 'la XP refleja la penalización por decisión arriesgada');

  t.section('Cherry-pick, revert y rebase con conflicto');
  await g.run('git switch -c tema');
  await g.run("sed -i 's/^ssh=activo/ssh=activo   # revisado/' servicios.conf");
  await g.run('git commit -am "Anota la revisión de SSH"');
  await g.run('git switch main');
  await g.run("sed -i 's/^ssh=activo/ssh=activo   # auditado/' servicios.conf");
  await g.run('git commit -am "Anota la auditoría de SSH"');
  await g.run('git switch tema');
  out = await g.run('git rebase main');
  check(out.includes('CONFLICTO') && out.includes('git rebase --continue'), 'un rebase con conflicto se detiene y explica cómo seguir');
  check(await b.eval(`document.getElementById('promptLabel').textContent.includes('REBASE')`), 'el prompt muestra que hay un rebase en curso');
  await g.run('git rebase --abort');
  out = await g.run('git status');
  check(out.includes('En la rama tema') && out.includes('nada para hacer commit'), 'git rebase --abort deja todo como estaba');
  await g.run('git switch main');
  out = await g.run('git cherry-pick tema');
  check(out.includes('CONFLICTO') || out.includes('Auto-fusionando'), 'cherry-pick aplica o avisa del conflicto');
  await g.run('git cherry-pick --abort');
  check((await g.run('git revert HEAD --no-edit')).includes('Revert'), 'git revert crea el commit inverso');
  check((await g.run('git log --oneline -2')).includes('Revert'), 'el revert aparece en el historial');

  t.section('Decisiones arriesgadas');
  await g.run('git add -f secretos.env');
  await g.run('git commit -m "Añade configuración"');
  check((await g.term()).length > 0, 'se puede (como en la vida real) confirmar un secreto');
  check(await b.eval(`document.getElementById('riskyList') !== null`), 'el juego anota el secreto en el historial');
  await g.run('git push --force');
  check((await g.run('git log --oneline -1')).length > 0, 'un push forzado no rompe nada');
  await g.run('git reset --hard HEAD~1');
  check((await g.run('git status')).includes('En la rama main'), 'reset --hard funciona y deja un estado coherente');

  t.section('Ayuda y exploración');
  check((await g.run('help')).includes('Git — ciclo básico'), 'help lista las órdenes disponibles');
  check((await g.run('git help')).includes('Estos son comandos comunes de Git'), 'git help muestra el resumen de git');
  out = await g.run('git commit --help');
  check(out.includes('OPCIONES') && out.includes('--amend'), 'git commit --help abre la página de manual');
  check((await g.run('man gitignore')).includes('gitignore'), 'man gitignore existe');
  out = await g.run('git config --list');
  check(out.includes('user.name=') && out.includes('remote.origin.url='), 'git config --list muestra la configuración efectiva');
  check((await g.run('cat ~/.gitconfig')).includes('[user]'), 'el ~/.gitconfig se puede leer como fichero INI');
  out = await g.run('git cat-file -p HEAD');
  check(out.includes('tree ') && out.includes('author '), 'git cat-file -p muestra el objeto commit');
  out = await g.run('git rev-parse --short HEAD');
  check(/^[0-9a-f]{7}$/m.test(out.split('\n').pop().trim() || out), 'git rev-parse --short devuelve el hash corto');
  check((await g.run('git config --global alias.lg "log --oneline --graph --all" && git lg | head -2')).includes('*'),
    'los alias de git configurados funcionan');
  out = await g.run('ls -la');
  check(out.includes('.git') && out.includes('drwx'), 'ls -la muestra el directorio .git');
  await g.type('exit');
  await sleep(1200);
  check((await g.term()).includes('Abriendo una terminal nueva'), 'exit cierra y reabre la sesión sin perder el progreso');

  t.section('Errores de JavaScript');
  check(b.errors.length === 0, 'ninguna excepción ni aviso de consola', b.errors.join(' | '));
} catch (e) {
  t.error(e);
} finally {
  t.summary();
  b.close();
  process.exit(t.fail ? 1 : 0);
}
