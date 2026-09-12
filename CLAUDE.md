# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Qué hay aquí

Juegos educativos para desarrollar habilidades digitales, dentro de la experiencia gamificada «Operación Escudo Digital» de la empresa ficticia TecnoAtlántica. El repositorio se publica con **GitHub Pages**: [index.html](index.html) es la portada que enlaza todos los retos.

| Carpeta | De qué va | Intérprete |
|---|---|---|
| [terminal-implacable/](terminal-implacable/) (`LX`) | Consola básica: orientarse, leer, crear, buscar, tuberías. 27 tareas | bash |
| [la-jungla-de-objetos/](la-jungla-de-objetos/) (`PS`) | Cmdlets y **tubería de objetos**. 27 tareas | PowerShell |
| [los-intocables/](los-intocables/) (`PL`) | `chmod`, `chown`, SGID, `umask`, ACL y ACL por omisión. 26 tareas | bash |
| [control-total/](control-total/) (`PW`) | `Get-Acl`, `icacls`, herencia, denegaciones, `takeown`. 25 tareas | PowerShell |
| [cuenta-atras/](cuenta-atras/) (`UG`) | `useradd`, `usermod -aG`, `gpasswd`, `getent`, bloqueo frente a borrado. 25 tareas | bash |
| [cuenta-pendiente/](cuenta-pendiente/) (`UW`) | `*-LocalUser`, `*-LocalGroup`, `net`, auditoría por objetos. 25 tareas | PowerShell |
| [asalto-al-puerto-80/](asalto-al-puerto-80/) (`SL`) | `systemctl`, `journalctl`, conflicto de puertos, activo≠habilitado. 24 tareas | bash |
| [arranque-imposible/](arranque-imposible/) (`SW`) | `Get-Service`, `Set-Service -StartupType`, `sc.exe`, *Disabled*. 24 tareas | PowerShell |
| [carga-critica/](carga-critica/) (`DK`) | Imágenes, contenedores, volúmenes, `build` y Compose. 26 tareas | bash + docker |
| [blindaje-de-la-red/](blindaje-de-la-red/) (`BD`) | Respuesta a incidentes: `ss`, `systemctl`, `kill`, `ufw`, `iptables`. 7 misiones | simulador propio |
| [punto-de-retorno/](punto-de-retorno/) (`VG`) | Git de verdad con grafo de ramas. 30 misiones | simulador propio |
| [shared/](shared/) | Biblioteca común: CSS, JS y datos | — |

## Nomenclatura: títulos épicos y reparto de acción

Los juegos llevan **título de película de acción** (no descriptivo), y el **subtítulo** y las
**etiquetas de tema** son los que dicen qué se aprende. El nombre de la carpeta es el título en
minúsculas y con guiones. Los **personajes son siempre los mismos**, con el mismo papel en todos
los retos, y se llaman como actores y actrices de acción de los 80 y 90. Sus **logins** son el
apellido.

| Personaje | Papel | Login |
|---|---|---|
| Linda Hamilton | La protagonista: quien juega | `hamilton` |
| Sigourney Weaver | Responsable de sistemas; firma los encargos | `weaver` |
| Arnold Schwarzenegger | Soporte; el que instaló Apache «para una prueba» | `arnold` |
| Michelle Yeoh | Coordina proyectos | `yeoh` |
| Wesley Snipes | Desarrollo | `snipes` |
| Dolph Lundgren | Ventas | `lundgren` |
| Milla Jovovich | Dirección | `jovovich` |
| Jean-Claude Van Damme | La baja de la semana | `vandamme` |
| Carrie-Anne Moss · Jackie Chan | Las dos altas | `moss`, `chan` |
| Brigitte Nielsen | La que se fue y dejó ficheros huérfanos | `nielsen` |

**Huevo de pascua:** pulsar el nombre de un personaje abre su página de Wikipedia, pero **no debe
parecer un enlace** (sin subrayado, sin color propio y sin cambio de cursor). Lo resuelve
`shared/js/cameos.js` envolviendo los nombres en un `<span class="cameo" data-wiki="…">` con un
único escuchador delegado, **nunca un `<a>`**: así es decoración y no navegación, el lector de
pantalla lee el nombre como texto y no entra en el orden de tabulación. `#terminalOutput` queda
excluido a propósito, para no romper la ilusión de consola. Como la ficha de tarea y el informe se
pintan con `innerHTML`, hay que volver a llamar a `RG.cameos.apply()` después de cada repintado.

No se cita ninguna etapa, ciclo ni módulo concretos (ni «Formación Profesional», ni «1.º DAM», ni nombres de módulos): los retos se etiquetan por **temas** (Linux, Windows, PowerShell, Consola, Ficheros, Permisos, ACL, Usuarios, Grupos, Servicios, systemd, Docker, Redes, Seguridad, Git, Trabajo en equipo) para que sirvan en cualquier contexto que los trabaje.

Todo el texto de la interfaz, los comentarios y la documentación están en español, con tildes y signos correctos.

## Desarrollo

- No hay *build*, dependencias, *linter* ni *tests* en el repositorio. Todo se abre con doble clic (`file://`) o servido por GitHub Pages.
- **Restricción clave: nada de módulos ES ni `fetch`.** Para que los retos sigan funcionando con `file://`, el CSS va en `<link>`, el JS en `<script src>` clásicos (un espacio de nombres global por reto) y los datos en ficheros `.js` que asignan objetos, no en `.json`. Tampoco CDN, fuentes web, analítica, `localStorage` ni cookies: el progreso vive en memoria y desaparece al cerrar la pestaña (protección de datos).
- El JS está escrito en estilo ES5 (`var`, `function`, cada fichero dentro de una IIFE con `"use strict"`); conviene respetarlo.
- Orden de carga (importa): `shared/js/*` → `shared/data/*` → `data/*` → `js/missions.js` → `js/main.js`. Cada módulo captura en locales lo que necesita de los espacios de nombres al cargarse, así que un módulo solo puede usar lo que definieron los anteriores. El objeto de estado **nunca se sustituye**: se vacía y se rellena (`resetState`), porque los módulos guardan una referencia a él. Por eso el VFS y el modelo de sistema se crean una vez y se vacían al reiniciar, en lugar de construirse de nuevo.
- En las comprobaciones de las tareas, el estado se consulta siempre a través de una función perezosa (`function S() { return LX.S; }`), porque `js/missions.js` se carga antes de que exista el `Sandbox`.
- **Verificación**: `node .claude/skills/verificar-reto/scripts/run.mjs` juega partidas completas en Chrome *headless* (CDP). Ejecútalo después de tocar cualquier cosa; si tocas `shared/`, afecta a **todos** los retos. Para uno solo: `run.mjs test-carga-critica`.

## Skills del proyecto (`.claude/skills/`)

| Skill | Cuándo usarla |
|---|---|
| `verificar-reto` | Tras tocar `shared/` o un reto, y antes de publicar. Incluye los guiones de prueba y de capturas |
| `nueva-mision` | Añadir, cambiar o reordenar misiones, tareas o fases |
| `nuevo-reto` | Crear un reto nuevo sobre la biblioteca compartida |
| `comando-simulado` | Añadir o cambiar comandos del simulador manteniendo el realismo |
| `guia-docente` | Escribir o actualizar el README de un reto (guía docente y evidencia de diseño) |
| `publicar` | Repaso previo a GitHub Pages o al aula virtual |

## Biblioteca compartida (`shared/`, espacio de nombres `RG`)

| Módulo | Qué aporta |
|---|---|
| `js/core.js` | `RG.util` (esc, pad, linesOf, globToRe, fechas…), `RG.Timers` (esperas cancelables, acortadas si hay movimiento reducido), `RG.announce`, `RG.toast`, `RG.showScreen`, `RG.Clock` |
| `js/terminal.js` | `RG.Terminal(cfg)`: salida por **filas con segmentos** `[[clase, texto], …]`, `line/pre/rich/note/fail/sys`, captura (`beginCapture`/`endCapture`/`collect`), prompt, historial, autocompletado y atajos |
| `js/shell.js` | `RG.Shell(term, cfg)`: léxico y análisis (comillas, comodines, `&&`/`\|\|`/`;`, tuberías, `>`/`>>`), filtros de tubería de texto, **canal de objetos** para PowerShell (`sh.emit`, `cfg.resolveFilter`, `cfg.renderObjects`), `cfg.winPaths` (la barra invertida es separador, no escape), `suspend()`/`resume()` y `runSilent()`. También `RG.parseArgs` (getopt) |
| `js/editor.js` | `RG.Editor`: editor simulado que suspende la línea de órdenes hasta cerrarse |
| `js/man.js` | `RG.man.render` (estilo `man`) y `RG.man.renderPs` (estilo `Get-Help`) desde `[nombre, [sinopsis], descripción, [[opción, texto]], [ejemplos]]` |
| `js/modal.js` | Diálogos accesibles (foco atrapado, Escape, clic fuera) con `.js-open-modal[data-modal]` |
| `js/game.js` | `RG.Game(cfg)`: estado de las misiones, XP, niveles, pistas, insignias, `addRisky`, ficha y registro |
| `js/vfs.js` | `RG.VFS(cfg)`: sistema de ficheros virtual. POSIX (modo de 4 cifras con SGID y sticky, ACL con máscara, **ACL por omisión** heredada por lo que se cree dentro) y Windows (ACE con `Allow`/`Deny`, herencia y `propagate`) |
| `js/sysmodel.js` | `RG.System(cfg)`: usuarios, grupos, servicios (estado, tipo de arranque, PID, registro, `failReason`) y procesos |
| `js/cmd-posix.js` · `js/cmd-posix-admin.js` | Órdenes de bash y de administración (usuarios, grupos, `systemctl`, `journalctl`, `ps`, `kill`) |
| `js/cmd-pwsh.js` · `js/cmd-pwsh-admin.js` | Cmdlets de PowerShell con tubería de objetos, alias y mayúsculas indiferentes, `Get-Acl`/`icacls`/`takeown`, `*-LocalUser`, `*-Service`, `net` y `sc.exe` |
| `js/docker.js` | `RG.Docker(ctx)` y `RG.DockerState(spec)`: imágenes, contenedores, puertos publicados, volúmenes, redes, `build` desde Dockerfile y Compose |
| `js/sandbox.js` | `RG.Sandbox(spec)`: **arranque común** de los retos de consola (sistema simulado, terminal, intérprete, editor, motor de tareas, fases, informe final y botones). Cada reto solo aporta datos |
| `data/man-linux.js` · `data/help-pwsh.js` | Manuales compartidos; se eligen con `RG.manPages(...)` y `RG.helpPages(...)` |
| `css/*` | `tokens`, `base`, `screens`, `game`, `terminal`, `editor`, `modal`, `phases` (progreso por fases) |

Reglas al tocar la biblioteca: la salida coloreada se emite con `term.rich([[clase, texto], …])`; los mensajes del juego van por `term.sys()` (nunca los filtra `grep` ni acaban en un fichero redirigido); los errores por `term.fail()` (no los captura una tubería y ponen el código de salida a 1). Si se cambia algo en `shared/`, **hay que probar todos los retos**.

## Cómo se monta un reto de consola

`js/main.js` llama a `RG.Sandbox({...}).init()` con:

- `shell`: `"bash"` o `"pwsh"` (decide intérprete, prompt, rutas y comandos base).
- `cfg`: equipo, usuario, rutas, reloj y, en Windows, las ACE de la raíz.
- `build(S)`: rellena `S.sys` (usuarios, grupos, servicios) y `S.vfs` (árbol de ficheros).
- `missions`, `phases`, `levels`, `badges` y los ajustes de puntuación.
- `man`: páginas elegidas de los manuales compartidos.
- `watch(S, ev)`: vigilancia global de eventos para las decisiones arriesgadas.
- `badgesOf`, `onComplete`, `debriefText`: insignias propias e informe final.
- `commands(S)`: órdenes extra (así se enchufa el motor de Docker).

Los dos retos antiguos (`blindaje-de-la-red` y `punto-de-retorno`) tienen simulador propio y **no** usan `sandbox.js`.

- **blindaje-de-la-red** (`BD`): `data/config.js` define `PORTS_TEMPLATE` (8 servicios con puerto, PID, proceso, `legitimate` y `aliases`). Cada servicio tiene estado `open` | `filtered` | `stopped`. Toda acción de contención pasa por `BD.secure(puerto, método, estado)`.
- **punto-de-retorno** (`VG`): simulador de Git completo. `js/git-core.js` (objetos, refs, `resolveRev`, `.gitignore`, `computeStatus`, `diffLines`/LCS, `merge3`/`mergeTrees`), los comandos repartidos en `git-commands/log/branch/remote/misc.js`, `js/repo-view.js` (grafo SVG) y `js/missions.js`.

## Principios de diseño que condicionan los cambios

- **Los simuladores no deben enseñar cosas falsas.** Ejemplos que ya están modelados: un cortafuegos no detiene el servicio; `systemctl disable` sin `--now` no lo detiene; en Windows, un servicio en *Disabled* no arranca ni a mano; `sc` es el alias de `Set-Content`, por eso hace falta `sc.exe`; `usermod -G` sin `-a` saca a la persona de sus otros grupos; una denegación NTFS gana a cualquier permiso concedido; un puerto del anfitrión solo lo puede publicar un contenedor; `docker compose down` no borra los volúmenes con nombre.
- Las fichas describen **síntomas y objetivos**, nunca la solución literal; esta solo aparece en la tercera pista.
- Debe haber **varias soluciones válidas** por tarea, y las acciones dañinas se permiten (con coste y aviso) en lugar de bloquearse: `game.addRisky()` penaliza una vez por tipo y lo anota en el informe.
- Los mensajes de error orientan sin dar la respuesta.
- Accesibilidad: la salida es `role="log"` y hay una región `role="status"` aparte (`RG.announce`); los estados combinan color, icono y texto; todo funciona con teclado (con la línea vacía, <kbd>Tab</kbd> sale de la terminal); hay que respetar `RG.reducedMotion`.
- **Pantallas estrechas**: la página no debe hacer scroll horizontal a 360 ni a 400 px; solo pueden scrollar en horizontal la terminal, `.table-wrap`, `.final-graph` y `.help-table`. Lo responsive vive en la biblioteca compartida (`game.css` para la rejilla y la barra superior, `phases.css` para el progreso por fases, `terminal.css` para la línea de órdenes), **no** en el `reto.css` de cada juego: si se deja ahí, los retos nuevos nacen rotos. El fallo típico es un contenedor `flex` sin `flex-wrap` cuyo contenido no cabe. Lo vigila `test-responsive.mjs`.
