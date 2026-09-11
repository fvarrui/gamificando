/* Recorrido completo de «Versionando con Git»: las 30 misiones
   resolviéndolas con los comandos que propone cada ficha, más el
   arranque desde cada una de las 5 fases. */
import { launch, fileUrl, sleep } from './cdp.mjs';
import { checker, game } from './helpers.mjs';

/* Solución de cada ticket (debe coincidir con js/missions.js).
   Los marcadores __X__ ejercitan caminos especiales. */
const SOLUCIONES = [
  ['GIT-01', ['git config --global user.name "Ana Pérez"', 'git config --global user.email "ana.perez@tecnoatlantica.local"']],
  ['GIT-02', ['git init -b main']],
  ['GIT-03', ['git status']],
  ['GIT-04', ['echo "secretos.env" > .gitignore', 'echo "*.log" >> .gitignore']],
  ['GIT-05', ['__IGNORADO__', 'git add .']],
  ['GIT-06', ['git commit -m "Versión inicial de los scripts de bastionado"']],
  ['GIT-07', ['git log --oneline']],
  ['GIT-08', ["sed -i '/allow 23/d' firewall.sh", 'git diff']],
  ['GIT-09', ['git add firewall.sh', 'git diff --staged', 'git commit -m "Elimina la regla que permitía Telnet"']],
  ['GIT-10', ['git rm backup_2019.sh', 'git commit -m "Elimina el script de copias obsoleto"']],
  ['GIT-11', ['git restore servicios.conf']],
  ['GIT-12', ['git restore --staged volcado.sql', 'rm volcado.sql']],
  ['GIT-13', ['git commit --amend -m "[GIT-10] Elimina el script de copias obsoleto"']],
  ['GIT-14', ['git reset HEAD~2']],
  ['GIT-15', ['git commit -am "[GIT-15] Limita SSH y activa el registro del cortafuegos"']],
  ['GIT-16', ['git switch -c endurecer-ssh']],
  ['GIT-17', ['__NANO__', 'git add sshd_config', '__COMMIT_EDITOR__']],
  ['GIT-18', ['git switch main', "sed -i 's/ftp=activo/ftp=desactivado/' servicios.conf", 'git commit -am "[GIT-18] Desactiva el FTP"']],
  ['GIT-19', ['git log --oneline --graph --all']],
  ['GIT-20', ['git merge endurecer-ssh --no-edit']],
  ['GIT-21', ['git branch -d endurecer-ssh']],
  ['GIT-22', ['git merge nayra/puertos', '__CONFLICTO__']],
  ['GIT-23', ['git remote add origin git@git.tecnoatlantica.local:blueteam/scripts-blindaje.git']],
  ['GIT-24', ['git push -u origin main']],
  ['GIT-25', ['git fetch', 'git status', 'git pull']],
  ['GIT-26', ['echo "ufw deny 3389/tcp" >> firewall.sh', 'git commit -am "[GIT-26] Bloquea el escritorio remoto"', 'git push', 'git pull --rebase', 'git push']],
  ['GIT-27', ['git pull', 'git revert HEAD --no-edit', 'git push']],
  ['GIT-28', ['echo "Mantenido por el Blue Team de TecnoAtlántica." >> README.md', 'git stash', 'git status', 'git stash pop']],
  ['GIT-29', ['git tag -a v1.0 -m "Configuración aprobada tras la auditoría"', 'git push origin v1.0']],
  ['GIT-30', ['git commit -am "[GIT-30] Indica quién mantiene el repositorio"', 'git push', 'git status']]
];

/* Comprobaciones del repositorio preparado al empezar por cada fase */
const FASES = [
  [1, 'GIT-08', async (g, check) => {
    check((await g.run('git log --oneline')).split('\n').filter(l => l.trim()).length === 2, 'fase 2: hay exactamente un commit inicial');
    check((await g.run('git check-ignore -v debug.log')).includes('*.log'), 'fase 2: el .gitignore preparado ignora los .log');
  }],
  [2, 'GIT-11', async (g, check) => {
    check(!(await g.run('cat firewall.sh')).includes('allow 23/tcp'), 'fase 3: la regla de Telnet ya está eliminada');
    check(!(await g.run('ls')).includes('backup_2019.sh'), 'fase 3: el script obsoleto ya no está');
  }],
  [3, 'GIT-16', async (g, check) => {
    check((await g.run('git log --oneline')).includes('[GIT-15]'), 'fase 4: el commit limpio de la fase 3 está hecho');
    check((await g.run('git status')).includes('nada para hacer commit'), 'fase 4: el repositorio preparado queda limpio');
  }],
  [4, 'GIT-23', async (g, check) => {
    const out = await g.run('git log --oneline --graph --all');
    check(out.includes('Merge') && /\|\\/.test(out), 'fase 5: las fusiones de la fase 4 están hechas');
    check((await g.run('cat servicios.conf')).includes('ftp=eliminado'), 'fase 5: el conflicto de Nayra quedó resuelto');
    check(!(await g.run('git branch')).includes('endurecer-ssh'), 'fase 5: la rama fusionada ya se borró');
  }]
];

const t = checker();
const b = await launch(fileUrl('versionando-con-git/index.html'), { port: 9392 });
const g = game(b);
const check = t.check;

try {
  let out;
  t.section('1. Portada y arranque');
  check(await b.eval(`document.getElementById('screenIntro').hidden===false`), 'la portada se muestra al abrir');
  check((await b.eval(`document.title`)).includes('Versionando'), 'el título de la página es correcto');
  check(await b.eval(`document.querySelectorAll('#phaseOptions input').length===5`), 'el selector de fases ofrece 5 fases');
  await g.start();
  check(true, 'el botón «Abrir la terminal» entra al juego');
  await b.waitFor(`!document.getElementById('terminalInput').disabled`, { label: 'terminal desbloqueada' });
  check(!(await b.eval(`document.getElementById('promptLabel').textContent.includes('(')`)), 'el prompt no muestra rama antes de git init');
  await g.waitMission('GIT-01');
  check(true, 'llega el primer ticket (GIT-01)');

  t.section('2. Errores y avisos antes de configurar');
  out = await g.run('git status');
  check(out.includes('no es un repositorio git'), 'git status sin repositorio avisa de que no lo es');
  out = await g.run('git comit -m "hola"');
  check(out.includes("'comit' no es un comando de git") && out.includes('commit'), 'una orden mal escrita sugiere el comando correcto');
  out = await g.run('git init -b main');
  check(out.includes('Inicializado repositorio Git vacío'), 'git init -b main crea el repositorio');
  check(await b.eval(`document.getElementById('promptLabel').textContent.includes('(main)')`), 'el prompt pasa a mostrar (main)');
  out = await g.run('git status');
  check(out.includes('No hay commits todavía') && out.includes('Archivos sin seguimiento') && out.includes('secretos.env'),
    'git status recién inicializado lista los ficheros sin seguimiento');
  await g.run('git add README.md');
  out = await g.run('git commit -m "prueba sin identidad"');
  check(out.includes('Por favor cuéntame quién eres'), 'git commit sin user.name/user.email da el error real de identidad');
  out = await g.run('git init');
  check(out.includes('Reinicializado el repositorio Git existente'), 'un segundo git init reinicializa');

  t.section('3. Fases 1 a 5: recorrido completo');
  for (const [code, cmds] of SOLUCIONES) {
    await g.waitMission(code);
    for (const cmd of cmds) {
      if (cmd === '__IGNORADO__') {
        out = await g.run('git add secretos.env');
        check(out.includes('Las siguientes rutas son ignoradas') && out.includes('Usa -f si realmente quieres agregarlos'),
          'git add de un fichero ignorado se rechaza y explica por qué');
        check((await g.run('git status --short')).includes('?? '), 'git status --short usa el formato corto');
      } else if (cmd === '__NANO__') {
        await g.type('nano sshd_config');
        await g.nanoWrite('PermitRootLogin no\n');
        check((await g.run('cat sshd_config')).includes('PermitRootLogin no'), 'nano crea y guarda el fichero');
      } else if (cmd === '__COMMIT_EDITOR__') {
        await g.type('git commit');
        await g.nanoOpen();
        const tpl = await g.nanoValue();
        check(tpl.includes('# Por favor ingresa el mensaje del commit'), 'git commit sin -m abre el editor con la plantilla');
        await g.setNano('[GIT-17] Prohíbe el acceso de root por SSH\n' + tpl);
        await g.nanoKey('o');
        await g.nanoKey('x');
        await sleep(200);
      } else if (cmd === '__CONFLICTO__') {
        out = await g.term();
        check(out.includes('CONFLICTO (contenido): Conflicto de fusión en servicios.conf'), 'la fusión con nayra/puertos da conflicto');
        check(out.includes('Fusión automática falló'), 'git explica que hay que resolver y hacer commit');
        check((await g.run('git status')).includes('ambos modificados:'), 'git status marca el fichero como «ambos modificados»');
        check((await g.run('git diff')).includes('diff --cc servicios.conf'), 'git diff muestra el diff combinado del conflicto');
        await g.run('git merge --abort');
        check((await g.run('git status')).includes('nada para hacer commit, el árbol de trabajo está limpio'),
          'git merge --abort deja el repositorio limpio');
        await g.run('git merge nayra/puertos');
        await g.type('nano servicios.conf');
        await g.nanoOpen();
        const conflicted = await g.nanoValue();
        check(conflicted.includes('<<<<<<< HEAD') && conflicted.includes('>>>>>>> nayra/puertos'),
          'el fichero en conflicto lleva las marcas de Git');
        const resolved = conflicted.split('\n')
          .filter(l => !/^(<<<<<<< |=======|>>>>>>> )/.test(l) && !/ftp=desactivado/.test(l)).join('\n');
        await g.setNano(resolved);
        await g.nanoKey('o');
        await g.nanoKey('x');
        await sleep(150);
        await g.run('git add servicios.conf');
        await g.run('git commit --no-edit');
      } else {
        await g.type(cmd);
        if (cmd === 'git push' && code === 'GIT-26') {
          out = await g.term();
          check(out.includes('[rechazado]') && out.includes('fetch first'),
            'el servidor rechaza el push cuando hay commits nuevos de otra persona');
        }
      }
    }
    await g.waitDone();
    check(await g.cardDone(), 'misión ' + code + ' completada');
  }

  t.section('4. Comprobaciones del estado final');
  out = await g.run('git log --oneline --graph --all');
  check(/\*\s/.test(out) && out.includes('|'), 'git log --graph dibuja el grafo con * y |');
  check(/\|\\|\|\//.test(out), 'el grafo dibuja la bifurcación y la fusión de la rama');
  out = await g.run('git status');
  check(out.includes("Tu rama está actualizada con 'origin/main'"), 'la rama queda sincronizada con origin/main');
  check(out.includes('nada para hacer commit, el árbol de trabajo está limpio'), 'el árbol de trabajo queda limpio');
  out = await g.run('cat firewall.sh');
  check(!out.includes('ufw allow 23/tcp'), 'Telnet ya no está permitido en firewall.sh');
  check(out.includes('ufw deny 3389/tcp'), 'la regla del escritorio remoto está aplicada');
  check(!(await g.run('git log --all --stat')).includes('secreto'), 'ningún commit de ninguna rama contiene secretos.env');
  check((await g.run('ls -a')).includes('secretos.env'), 'secretos.env sigue en el disco, solo que sin versionar');
  check((await g.run('git tag')).includes('v1.0'), 'la etiqueta v1.0 existe');
  check((await g.run('git reflog -5')).includes('HEAD@{0}'), 'git reflog muestra el historial de HEAD');
  check((await g.run('git blame servicios.conf')).includes('ftp=eliminado'), 'git blame atribuye las líneas');
  check((await g.run('git show HEAD~1 --stat')).includes('archivo'), 'git show --stat resume los cambios');
  check((await g.run('git branch -vv')).includes('origin/main'), 'git branch -vv muestra la rama remota asociada');
  check((await g.run('man git-commit')).includes('SINOPSIS'), 'man git-commit muestra la página de manual');
  check((await g.run('git check-ignore -v secretos.env')).includes('.gitignore:1:secretos.env'),
    'git check-ignore explica qué regla ignora secretos.env');
  check((await g.run('cat .git/HEAD')).includes('ref: refs/heads/main'), 'cat .git/HEAD muestra la referencia real');
  check((await g.run('git log --oneline | head -3 | wc -l')).trim().endsWith('3'), 'las tuberías funcionan sobre la salida de git');
  check((await g.run('git status | grep rama')).includes('rama'), 'grep filtra la salida de git status');
  out = await g.run('cd .. && ls && git status');
  check(out.includes('scripts-blindaje') && out.includes('no es un repositorio git'), 'fuera de la carpeta del proyecto no hay repositorio');
  check((await g.run('cd scripts-blindaje && git status -sb')).includes('## main...origin/main'),
    'se vuelve a la carpeta del proyecto y el estado corto muestra el upstream');

  t.section('5. Panel visual del repositorio');
  await b.eval(`document.getElementById('tabRepo').click()`);
  check(await b.eval(`!document.getElementById('panelRepo').hidden`), 'la pestaña Repositorio se abre');
  check(await b.eval(`document.querySelectorAll('#panelRepo .g-row').length > 5`), 'el grafo del panel lista los commits');
  check(await b.eval(`document.querySelector('#panelRepo .ref-head') && document.querySelector('#panelRepo .ref-head').textContent.includes('HEAD → main')`),
    'el panel marca HEAD → main');
  check(await b.eval(`document.querySelectorAll('#panelRepo .graph-svg circle').length > 5`), 'el grafo SVG dibuja los nodos de commit');
  check(await b.eval(`document.querySelectorAll('#panelRepo .ref-remote').length > 0`), 'el panel muestra la rama remota origin/main');
  check(await b.eval(`document.querySelectorAll('#panelRepo .areas-table tbody tr').length > 3`), 'la tabla de las tres áreas lista los ficheros');
  await b.eval(`document.getElementById('repoBigBtn') && document.getElementById('repoBigBtn').click()`);
  check(await b.eval(`!document.getElementById('repoModal').hidden`), 'el botón Ampliar abre el repositorio a pantalla completa');
  await b.eval(`document.querySelector('#repoModal .js-close-modal').click()`);
  check(await b.eval(`document.getElementById('repoModal').hidden`), 'el modal del repositorio se cierra');

  t.section('6. Informe final');
  await b.waitFor(`document.getElementById('reportBtn')!==null`, { label: 'botón de informe' });
  await b.eval(`document.getElementById('reportBtn').click()`);
  await b.waitFor(`!document.getElementById('screenDebrief').hidden`, { label: 'pantalla de informe' });
  const xp = await b.eval(`document.getElementById('dXp').textContent`);
  check(parseInt(xp, 10) > 2000, 'el informe muestra la XP acumulada (' + xp + ')');
  check(await b.eval(`document.querySelectorAll('#reportBody tr').length >= 30`), 'el informe lista las 30 misiones');
  check(await b.eval(`document.querySelectorAll('#badgeGrid .badge').length===8`), 'el informe muestra las 8 insignias');
  check(await b.eval(`document.querySelectorAll('#badgeGrid .badge.earned').length >= 4`), 'se han conseguido insignias');
  check(await b.eval(`document.getElementById('riskyList').textContent.includes('Ninguna')`), 'no hay decisiones arriesgadas en un recorrido limpio');
  check(await b.eval(`document.querySelectorAll('#finalGraph .g-row').length > 5`), 'el informe incluye el grafo final del repositorio');

  t.section('7. Empezar desde cada fase posterior');
  for (const [idx, code, comprobaciones] of FASES) {
    await g.home();
    await g.start(idx);
    await g.waitMission(code);
    check(true, 'empezar en la fase ' + (idx + 1) + ' arranca en el ticket ' + code);
    check(await g.xp() === '0', 'fase ' + (idx + 1) + ': las misiones preparadas no suman XP');
    await comprobaciones(g, check);
  }

  t.section('8. Accesibilidad y pantallas estrechas');
  check(await b.eval(`document.getElementById('terminalOutput').getAttribute('role')==='log'`), 'la salida de la terminal es role="log"');
  check(await b.eval(`document.getElementById('announcer').getAttribute('role')==='status'`), 'hay una región de anuncios independiente');
  check(await b.eval(`document.querySelectorAll('#nanoKeys button').length===4`), 'el editor ofrece botones para quien no use atajos');
  await b.setViewport(400, 800);
  await sleep(400);
  check(await b.eval(`document.documentElement.scrollWidth <= 401`), 'a 400 px no hay scroll horizontal de página');
  check(await b.eval(`document.getElementById('tabRepo').getBoundingClientRect().width > 50`), 'las pestañas siguen usables a 400 px');
  await b.setViewport(1440, 900);
  await sleep(300);
  check(await b.eval(`document.documentElement.scrollHeight <= window.innerHeight + 2`), 'en escritorio la página del juego no hace scroll');

  t.section('9. Errores de JavaScript');
  check(b.errors.length === 0, 'ninguna excepción ni aviso de consola', b.errors.join(' | '));
} catch (e) {
  t.error(e);
} finally {
  t.summary();
  b.close();
  process.exit(t.fail ? 1 : 0);
}
