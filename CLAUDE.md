# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Qué hay aquí

Juegos educativos para desarrollar habilidades digitales, dentro de la experiencia gamificada «Operación Escudo Digital» de la empresa ficticia TecnoAtlántica. El repositorio se publica con **GitHub Pages**: [index.html](index.html) es la portada que enlaza los dos retos.

- [blindaje-de-la-red/](blindaje-de-la-red/): respuesta a incidentes en una terminal Linux (`ss`, `systemctl`, `kill`, `ufw`, `iptables`…). Redes, servicios y seguridad. 7 misiones, 10-20 min.
- [versionando-con-git/](versionando-con-git/): control de versiones con comandos reales de Git y un panel que dibuja el grafo de ramas y las tres áreas. Git y trabajo en equipo. 30 misiones en 5 fases, 45-70 min.

No se cita ninguna etapa, ciclo ni módulo concretos (ni «Formación Profesional», ni «1.º DAM», ni nombres de módulos): los retos se etiquetan por **temas** (Redes, Servicios, Seguridad, Linux, Git, Control de versiones, Trabajo en equipo) para que sirvan en cualquier contexto que los trabaje.
- [shared/](shared/): biblioteca común de ambos (CSS y JS).

Todo el texto de la interfaz, los comentarios y la documentación están en español, con tildes y signos correctos.

## Desarrollo

- No hay *build*, dependencias, *linter* ni *tests* en el repositorio. Todo se abre con doble clic (`file://`) o servido por GitHub Pages.
- **Restricción clave: nada de módulos ES ni `fetch`.** Para que los retos sigan funcionando con `file://`, el CSS va en `<link>`, el JS en `<script src>` clásicos (un espacio de nombres global por reto) y los datos en ficheros `.js` que asignan objetos, no en `.json`. Tampoco CDN, fuentes web, analítica, `localStorage` ni cookies: el progreso vive en memoria y desaparece al cerrar la pestaña (protección de datos).
- El JS está escrito en estilo ES5 (`var`, `function`, cada fichero dentro de una IIFE con `"use strict"`); conviene respetarlo.
- Orden de carga (importa): `shared/js/*` → `data/*` → `js/*` → `js/main.js`. Cada módulo captura en locales lo que necesita de los espacios de nombres al cargarse, así que un módulo solo puede usar lo que definieron los anteriores. El objeto de estado (`VG.state`, `BD.state`) **nunca se sustituye**: se vacía y se rellena (`resetState`), porque los módulos guardan una referencia a él.
- **Verificación**: `node .claude/skills/verificar-reto/scripts/run.mjs` juega partidas completas en Chrome *headless* (CDP) y hace 215 comprobaciones. Ejecútalo después de tocar cualquier cosa; si tocas `shared/`, afecta a los dos retos.

## Skills del proyecto (`.claude/skills/`)

| Skill | Cuándo usarla |
|---|---|
| `verificar-reto` | Tras tocar `shared/` o un reto, y antes de publicar. Incluye los guiones de prueba y de capturas |
| `nueva-mision` | Añadir, cambiar o reordenar misiones, tickets, alertas o fases |
| `nuevo-reto` | Crear un reto nuevo sobre la biblioteca compartida |
| `comando-simulado` | Añadir o cambiar comandos del simulador manteniendo el realismo |
| `guia-docente` | Escribir o actualizar el README de un reto (guía docente y evidencia de diseño) |
| `publicar` | Repaso previo a GitHub Pages o al aula virtual |

## Biblioteca compartida (`shared/`, espacio de nombres `RG`)

| Módulo | Qué aporta |
|---|---|
| `js/core.js` | `RG.util` (esc, pad, linesOf, globToRe, fechas…), `RG.Timers` (esperas cancelables, acortadas si hay movimiento reducido), `RG.announce`, `RG.toast`, `RG.showScreen`, `RG.Clock` |
| `js/terminal.js` | `RG.Terminal(cfg)`: salida por **filas con segmentos** `[[clase, texto], …]` para colorear, `line/pre/rich/note/fail/sys`, captura (`beginCapture`/`endCapture`/`collect`), prompt, historial, autocompletado y atajos |
| `js/shell.js` | `RG.Shell(term, cfg)`: léxico y análisis (comillas, comodines, `&&`/`\|\|`/`;`, tuberías, `>`/`>>`), filtros de tubería, `suspend()`/`resume()` para el editor y `runSilent()`. También `RG.parseArgs` (opciones estilo getopt) |
| `js/editor.js` | `RG.Editor`: el `nano` simulado; suspende la línea de órdenes hasta cerrarse |
| `js/man.js` | Renderiza páginas de manual desde `[nombre, [sinopsis], descripción, [[opción, texto]], [ejemplos]]` |
| `js/modal.js` | Diálogos accesibles (foco atrapado, Escape, clic fuera) con `.js-open-modal[data-modal]` |
| `js/game.js` | `RG.Game(cfg)`: estado de las misiones, XP, niveles, pistas, insignias, decisiones arriesgadas (`addRisky`), ficha y registro. Cada reto aporta `labels` (textos) y `on` (enganches: broadcast, complete, finish, render, report) |
| `css/*` | `tokens` (variables), `base`, `screens` (portada e informe), `game` (barra, rejilla, ficha, registro, avisos), `terminal`, `editor`, `modal` |

Reglas al tocar la biblioteca: la salida coloreada se emite con `term.rich([[clase, texto], …])`; los mensajes del juego van por `term.sys()` (nunca los filtra `grep` ni acaban en un fichero redirigido); los errores por `term.fail()` (no los captura una tubería y ponen el código de salida a 1). Si se cambia algo en `shared/`, **hay que probar los dos retos**.

## Cada reto

Estructura común: `index.html` (solo marcado) + `css/reto.css` + `data/*.js` (datos puros, contenido separado de la lógica) + `js/*.js` + `js/main.js` (crea `RG.Game`, arranca y pinta el informe).

- **blindaje-de-la-red** (`BD`): `data/config.js` define `PORTS_TEMPLATE` (8 servicios con puerto, PID, proceso, `legitimate` y `aliases`). Cada servicio tiene estado `open` | `filtered` (cortafuegos: sigue vivo y en LISTEN) | `stopped`, y todas las salidas se calculan a partir de él. Toda acción de contención pasa por `BD.secure(puerto, método, estado)`. Las misiones de amenaza comprueban el estado del puerto (por eso contener algo antes de su alerta la resuelve con bonus); las de reconocimiento y verificación comprueban el evento `sockets`.
- **versionando-con-git** (`VG`): simulador de Git completo. `js/git-core.js` (objetos, refs, `resolveRev`, `.gitignore`, `computeStatus`, `diffLines`/LCS, `merge3`/`mergeTrees`, `applyTree`), los comandos repartidos en `git-commands/log/branch/remote/misc.js`, `js/shell-commands.js`, `js/repo-view.js` (grafo SVG + tres áreas) y `js/missions.js` (comprobaciones, compañeros de equipo y `solution` de cada ticket, que el selector de fase reproduce en silencio).

## Principios de diseño que condicionan los cambios

- **Los simuladores no deben enseñar cosas falsas.** En *Blindaje*: un cortafuegos no detiene el servicio (pasa a `filtered`, no desaparece de `ss`/`ps`), `systemctl disable` sin `--now` no lo detiene y filtrar un puerto que solo escucha en `127.0.0.1` no cambia nada; `stop`, `kill` e `iptables` no imprimen nada al tener éxito. En *Versionando*: `.gitignore` no deja de seguir lo ya versionado, `--amend`/`rebase` cambian los hashes, `fetch` no toca tu rama, un push no avanzable se rechaza y `pull` con ramas divergentes obliga a elegir. Los mensajes imitan a Git 2.43 en español (incluidas las líneas `ayuda:`).
- Las fichas describen **síntomas y objetivos**, nunca la solución literal; esta solo aparece en la tercera pista. La ayuda general no debe revelar la respuesta de la misión en curso.
- Debe haber **varias soluciones válidas** por misión, y las acciones dañinas se permiten (con coste y aviso) en lugar de bloquearse: `game.addRisky()` penaliza una vez por tipo y lo anota en el informe.
- Los mensajes de error orientan sin dar la respuesta.
- Accesibilidad: la salida es `role="log"` y hay una región `role="status"` aparte (`RG.announce`) solo para los eventos importantes; los estados combinan siempre color, icono y texto; todo funciona con teclado (con la línea vacía, <kbd>Tab</kbd> sale de la terminal); hay que respetar `RG.reducedMotion`; la página no debe hacer scroll horizontal a 400 px, y en escritorio solo hace scroll la terminal.
