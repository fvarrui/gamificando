# Punto de retorno

> Simulador gamificado de control de versiones en una terminal Linux.
> Reto digital de elaboración propia, hermano de [*Blindaje de la Red*](../blindaje-de-la-red/).

---

## Índice

1. [Qué es](#qué-es)
2. [Cómo abrirlo](#cómo-abrirlo)
3. [Contexto educativo](#contexto-educativo)
4. [Objetivos de aprendizaje](#objetivos-de-aprendizaje)
5. [Cómo funciona](#cómo-funciona)
6. [Las 30 misiones](#las-30-misiones)
7. [Comandos disponibles](#comandos-disponibles)
8. [Cómo se diseñó](#cómo-se-diseñó)
9. [Elementos de gamificación](#elementos-de-gamificación)
10. [Accesibilidad, inclusión y protección de datos](#accesibilidad-inclusión-y-protección-de-datos)
11. [Uso en el aula](#uso-en-el-aula)
12. [Detalles técnicos](#detalles-técnicos)
13. [Verificación](#verificación)
14. [Limitaciones conocidas](#limitaciones-conocidas)
15. [Archivos](#archivos)
16. [Créditos](#créditos)

---

## Qué es

*Punto de retorno* es un juego educativo que se ejecuta en el navegador. El alumnado
trabaja en el equipo de desarrollo de la empresa ficticia **TecnoAtlántica** y lleva una
carpeta de scripts sin historial hasta convertirla en un **repositorio compartido** con el
resto del equipo, escribiendo **comandos reales de Git**: `init`, `add`, `commit`, `diff`,
`branch`, `merge`, `rebase`, `push`, `pull`, `stash`, `revert`…

No hay botones que hagan el trabajo: la herramienta es la terminal, con su editor `nano`,
sus tuberías y sus mensajes de error. Los **tickets llegan de uno en uno** y algunos los
provocan los compañeros de equipo: Arnold (en prácticas) rompe cosas y Sigourney sube trabajo al
servidor justo cuando ibas a subir el tuyo.

Como Git es difícil de ver, el panel lateral tiene una pestaña **🌿 Repositorio** que
dibuja, en tiempo real, el **grafo de ramas y commits** y el estado de las **tres áreas**
(directorio de trabajo, área de preparación y repositorio).

Funciona sin conexión a Internet, sin instalar nada y sin servidor.

## Cómo abrirlo

- **En local**: doble clic en [`index.html`](index.html). Funciona en cualquier navegador
  moderno (Chrome, Edge, Firefox, Safari).
- **En el aula virtual (EVAGD/Moodle)**: subir la carpeta completa del reto **junto con la
  carpeta [`shared/`](../shared/)** (por ejemplo, en un ZIP con las dos) y enlazar
  `punto-de-retorno/index.html`. El reto usa CSS y scripts clásicos, sin módulos ES ni
  `fetch`, así que también funciona desde el sistema de ficheros.
- **En la web**: publicar el repositorio con GitHub Pages o cualquier alojamiento estático.
  No necesita *backend*.

Una partida completa dura entre 45 y 70 minutos. Desde la portada se puede **empezar en
cualquiera de las 5 fases**: el repositorio se prepara automáticamente con las fases
anteriores ya resueltas, así que el reto se puede repartir en varias sesiones de clase.

## Contexto educativo

| | |
|---|---|
| **Temas** | Git · Control de versiones · Trabajo en equipo |
| **Encaja en** | Cualquier materia o curso en que se trabaje con código o con ficheros de configuración en equipo |
| **Punto de partida** | Saber moverse por una terminal; no hace falta haber usado Git nunca |
| **Narrativa** | Continuación de «Operación Escudo Digital»: tras el incidente, la dirección exige que los scripts de bastionado estén bajo control de versiones |
| **Modalidad** | Presencial, con apoyo del aula virtual. También sirve en línea, de forma autónoma |

El punto de partida narrativo es un problema real del reto anterior: alguien activó el FTP
anónimo «temporalmente, para las pruebas» y **nadie sabe quién fue, ni cuándo, ni cómo era
la configuración anterior**. Justo el problema que resuelve un control de versiones.

## Objetivos de aprendizaje

Al terminar el reto, el alumnado debería ser capaz de:

1. **Explicar el modelo de Git**: las tres áreas (trabajo, preparación e historial), qué es
   un commit, un hash, una rama, `HEAD` y una rama remota.
2. **Aplicar el ciclo de trabajo** con soltura: `status` → editar → `diff` → `add` →
   `diff --staged` → `commit`, escribiendo mensajes útiles.
3. **Decidir qué NO se versiona** y protegerlo con `.gitignore` (secretos, registros,
   volcados con datos personales), entendiendo que el historial es prácticamente
   indeleble.
4. **Deshacer con criterio**, eligiendo la herramienta adecuada a cada situación:
   `restore`, `restore --staged`, `commit --amend`, `reset` (`--soft`/`--mixed`/`--hard`),
   `revert` y `reflog`, y distinguiendo **qué se puede reescribir y qué no**.
5. **Trabajar con ramas**: crear, cambiar, fusionar (avance rápido y commit de fusión),
   **resolver un conflicto a mano** y limpiar las ramas ya integradas.
6. **Colaborar con un repositorio remoto**: `remote`, `push -u`, `fetch` frente a `pull`,
   entender un **push rechazado** y reconciliar ramas divergentes con `merge` o `rebase`.

## Cómo funciona

### Las tres pantallas

1. **Portada (briefing)**: comunicado de la dirección de seguridad, explicación del juego,
   **selector de fase inicial** y acceso a la guía de Git.
2. **Juego**: la terminal ocupa casi toda la pantalla. Arriba, una barra con el progreso
   por fases, el reloj, la XP y el nivel. En el lateral, dos pestañas: **🎯 Misión** (ficha
   del ticket actual + registro) y **🌿 Repositorio** (grafo y tres áreas).
3. **Informe final**: XP, rango, tiempo, pistas, commits propios, insignias, el grafo final
   del repositorio, la tabla de las 30 misiones con el comando que resolvió cada una y las
   decisiones arriesgadas.

### El desarrollo de una partida

Los tickets llegan **de uno en uno**. Al completar uno, a los pocos segundos aparece el
siguiente con un mensaje en la terminal y la ficha entrando desde el lateral. Algunos
tickets vienen precedidos de un `Broadcast message` de un compañero que acaba de hacer
algo… en tu repositorio o en el servidor.

Si resuelves algo **antes** de que llegue su ticket, el ticket aparece igualmente y se
completa solo: el juego premia ir por delante.

### El panel visual del repositorio

La pestaña **🌿 Repositorio** (y su botón **⤢ Ampliar**) muestra:

- el **grafo de commits** en SVG, de más reciente a más antiguo, con una calle por rama,
  las curvas de bifurcación y fusión, y etiquetas de color: `HEAD → rama` (cian), ramas
  locales (verde), ramas remotas `origin/…` (rojo) y etiquetas (ámbar);
- la tabla de **las tres áreas**, fichero a fichero: si está igual o modificado en el
  directorio de trabajo, si está preparado (nuevo/modificado/borrado), si está en el último
  commit, si está ignorado o en conflicto;
- el estado de sincronización con `origin` (↑ commits por subir, ↓ por traer), la
  **operación en curso** (fusión, rebase…), los remotos, las etiquetas y la pila de *stash*.

Todo se actualiza después de cada comando, de modo que se puede ver el efecto exacto de
`git add`, `git commit`, `git switch` o `git merge` sobre el repositorio.

## Las 30 misiones

### Fase 1 · Primeros pasos

| # | Ticket | Misión | Qué se practica |
|---|--------|--------|-----------------|
| 1 | GIT-01 | Preséntate a Git | `git config --global user.name` / `user.email` |
| 2 | GIT-02 | Crea el repositorio | `git init -b main`, `init.defaultBranch` |
| 3 | GIT-03 | ¿Qué ve Git? | `git status`, ficheros sin seguimiento |
| 4 | GIT-04 | Secretos fuera del repositorio | `.gitignore`, comodines, `echo … >` |
| 5 | GIT-05 | Al área de preparación | `git add`, ficheros ignorados |
| 6 | GIT-06 | El primer commit | `git commit -m`, buenos mensajes |
| 7 | GIT-07 | Consulta el historial | `git log`, `--oneline`, hashes |

### Fase 2 · El ciclo de trabajo

| # | Ticket | Misión | Qué se practica |
|---|--------|--------|-----------------|
| 8 | GIT-08 | Cierra Telnet | editar con `nano`/`sed`, `git diff` |
| 9 | GIT-09 | Revisa y confirma | `git add`, `git diff --staged`, `git commit` |
| 10 | GIT-10 | Adiós al script obsoleto | `git rm` y confirmación del borrado |

### Fase 3 · Deshacer sin miedo

| # | Ticket | Misión | Qué se practica |
|---|--------|--------|-----------------|
| 11 | GIT-11 | ¡Arnold ha roto servicios.conf! | `git restore <fichero>` |
| 12 | GIT-12 | Un fichero que no debía estar | `git restore --staged` |
| 13 | GIT-13 | Corrige el último commit | `git commit --amend` |
| 14 | GIT-14 | Commits a medias | `git reset HEAD~2` (y el peligro de `--hard`) |
| 15 | GIT-15 | Un commit limpio | `git commit -am`, mensajes con código de ticket |

### Fase 4 · Ramas y fusiones

| # | Ticket | Misión | Qué se practica |
|---|--------|--------|-----------------|
| 16 | GIT-16 | Una rama para experimentar | `git switch -c` |
| 17 | GIT-17 | Trabaja en la rama | commits en una rama; la otra no se entera |
| 18 | GIT-18 | Mientras tanto, en main | urgencia en `main`: ramas que divergen |
| 19 | GIT-19 | El mapa de ramas | `git log --oneline --graph --all` |
| 20 | GIT-20 | Fusiona la rama | `git merge`, commit de fusión, editor del mensaje |
| 21 | GIT-21 | Limpia las ramas fusionadas | `git branch -d` (y por qué no `-D`) |
| 22 | GIT-22 | Conflicto a la vista | resolver marcas `<<<<<<<`, `git add` + `git commit`, `--abort` |

### Fase 5 · Trabajo en equipo

| # | Ticket | Misión | Qué se practica |
|---|--------|--------|-----------------|
| 23 | GIT-23 | Conecta con el servidor | `git remote add origin` |
| 24 | GIT-24 | El primer push | `git push -u`, *upstream* |
| 25 | GIT-25 | Novedades en el servidor | `git fetch` frente a `git pull` |
| 26 | GIT-26 | Push rechazado | *non-fast-forward*, `git pull --rebase` / `--no-rebase` |
| 27 | GIT-27 | Revierte sin reescribir | `git revert` en historia compartida |
| 28 | GIT-28 | Trabajo a medias | `git stash`, `stash list`, `stash pop` |
| 29 | GIT-29 | Versión 1.0 | `git tag -a`, `git push origin v1.0` |
| 30 | GIT-30 | Verificación final | árbol limpio y rama sincronizada |

## Comandos disponibles

| Tipo | Comandos |
|---|---|
| Configuración | `git config [--global] [--list] [--unset] [-e]` (incluye **alias**), `git init [-b]` |
| Estado e historial | `git status [-s] [-b]`, `git log` (`--oneline --graph --all -n -p --stat --author --grep --pretty=format:…`), `git show`, `git diff [--staged] [--stat] [--name-only]`, `git blame`, `git reflog`, `git ls-files`, `git cat-file`, `git rev-parse`, `git check-ignore -v` |
| Cambios | `git add [-A] [-u] [-f] [-n]`, `git rm [--cached]`, `git mv`, `git commit [-a] [-m] [--amend] [--no-edit] [--allow-empty]`, `git restore [--staged] [--source] [--ours/--theirs]`, `git clean [-n] [-f] [-x]` |
| Deshacer | `git reset [--soft\|--mixed\|--hard]`, `git revert`, `git cherry-pick`, `git stash [push\|list\|pop\|apply\|drop\|show]` |
| Ramas | `git branch [-a] [-r] [-v] [-vv] [-d] [-D] [-m] [-u] [--merged]`, `git switch [-c] [-] [--detach]`, `git checkout [-b] [--] [--ours/--theirs]`, `git merge [--no-ff] [--ff-only] [--abort] [--continue]`, `git rebase [--continue] [--skip] [--abort]`, `git tag [-a] [-m] [-d]` |
| Remoto | `git remote [add\|remove\|rename\|set-url\|show] [-v]`, `git push [-u] [--tags] [--force] [--force-with-lease] [--delete]`, `git fetch [--prune]`, `git pull [--rebase\|--no-rebase\|--ff-only]` |
| Shell | `ls [-la]`, `cat`, `echo` con `>` y `>>`, `touch`, `rm`, `mv`, `cp`, `sed -i` (`s///` y `/…/d`), `grep`, `head`, `tail`, `wc`, `nano`, `cd`, `pwd`, `history`, `clear`, `exit`, `man`, `help` |
| Composición | Encadenado con `&&`, `\|\|` y `;`; tuberías con `\| grep [-i] [-v] [-n] [-c]`, `\| head`, `\| tail`, `\| wc`, `\| sort`, `\| uniq`; redirecciones `>` y `>>`; comodines (`*.sh`); comillas simples y dobles |

Atajos: <kbd>↑</kbd>/<kbd>↓</kbd> historial, <kbd>Tab</kbd> autocompletar (órdenes,
subcomandos de git, ficheros, ramas y páginas de manual), <kbd>Ctrl</kbd>+<kbd>L</kbd>
limpiar, <kbd>Ctrl</kbd>+<kbd>C</kbd> cancelar la línea.
En `nano`: <kbd>Ctrl</kbd>+<kbd>O</kbd> guardar, <kbd>Ctrl</kbd>+<kbd>X</kbd> salir,
<kbd>Ctrl</kbd>+<kbd>K</kbd> cortar línea, <kbd>Ctrl</kbd>+<kbd>U</kbd> pegar (también hay
botones).

## Cómo se diseñó

### Principios que guiaron las decisiones

- **Git de verdad, no un Git de juguete.** Los mensajes, el formato de `git status`, los
  parches de `git diff`, el grafo ASCII de `git log --graph`, la salida de `push`/`fetch` y
  hasta los consejos (`ayuda: …`) imitan a Git 2.43 en español. Si el alumnado repite
  después estos comandos en una máquina real, verá lo mismo.
- **El simulador no enseña cosas falsas.** `git commit` exige identidad configurada;
  `.gitignore` **no** deja de seguir un fichero ya versionado; `--amend` y `rebase` cambian
  los hashes; un `push` no avanzable se rechaza; `git pull` con ramas divergentes obliga a
  decidir entre fusionar y rebasar; `git fetch` no toca tu rama.
- **Hacer visible lo invisible.** El panel del repositorio es la respuesta a la pregunta
  «¿pero dónde están mis cambios ahora mismo?»: se ve el fichero moviéndose entre las tres
  áreas y la rama avanzando commit a commit.
- **Sorpresa dosificada y contexto profesional.** Cada misión es un ticket con su código,
  su origen (auditoría, dirección, un compañero) y un objetivo. Los problemas llegan como
  llegan en la vida real: alguien guarda un fichero a medias, alguien sube justo antes que
  tú, alguien reabre Telnet «porque funcionaba».
- **Las decisiones tienen consecuencias.** Se permite hacer commit de `secretos.env`, un
  `push --force` que borra el trabajo de otros o un `git branch -D` sin fusionar. Se
  permite, se explica, cuesta 50 XP y queda en el informe final. El objetivo es desarrollar
  criterio, no impedir errores.
- **El error es parte del aprendizaje.** Los mensajes de error orientan («el remoto contiene
  trabajo que no tienes localmente…») sin dar la solución, y siempre hay salida: `--abort`,
  `git reflog`, reiniciar sin penalización.

### Evolución respecto a *Blindaje de la Red*

| | *Blindaje de la Red* | *Punto de retorno* |
|---|---|---|
| Reto | 7 misiones, 10-20 min | 30 misiones en 5 fases, 45-70 min |
| Progreso | Indicadores de alerta | Progreso por fases + selector de fase inicial |
| Panel lateral | Ficha de misión | Pestañas: ficha **y** repositorio visual (grafo SVG + tres áreas) |
| Editor | — | `nano` simulado (también para los mensajes de commit y la resolución de conflictos) |
| Intérprete | `&&`, `;`, tuberías simples | Analizador con comillas, comodines, `&&`/`\|\|`/`;`, tuberías y redirecciones |
| Personajes | El SOC | Arnold y Sigourney, que trabajan (y meten la pata) en tu repositorio |

## Elementos de gamificación

Relación con los **12 componentes** vistos en el curso *La gamificación educativa* (solo se
usan los que encajan):

| Componente | ¿Se usa? | Cómo | Por qué |
|---|---|---|---|
| **Misiones** | ✅ | 30 tickets encadenados (GIT-01…GIT-30) agrupados en 5 fases | Se habla de tickets y de fases, nunca de ejercicios |
| **Sorpresa** | ✅ | Los compañeros rompen ficheros, suben commits y provocan conflictos sin avisar | Mantiene la tensión y reproduce la realidad de un equipo |
| **Desbloqueo de contenido** | ✅ | Cada ticket se revela al completar el anterior | Hay que avanzar para descubrir qué viene |
| **Puntos (XP)** | ✅ | 50-150 XP por misión, −25 por pista, −50 por decisión arriesgada | *Feedback* inmediato; las pistas cuestan, pero nunca bloquean |
| **Niveles** | ✅ | Aprendiz → Analista junior → Analista senior → Maestría Git | Niveles vinculados a la narrativa profesional |
| **Insignias** | ✅ | 8 insignias ligadas a buenas prácticas (ver abajo) | Reconocen *cómo* se ha trabajado, no solo terminar |
| **Barra de progreso** | ✅ | Progreso por fases + contador de misión + registro lateral | Ver el avance anima a seguir |
| **Recompensas** | ✅ | Pistas «compradas» con XP; ver el grafo como ayuda permanente | La ayuda existe, pero hay que decidir si compensa |
| **Tablero de clasificación** | ❌ | — | Deliberadamente no: el informe es individual |
| **Cuenta atrás** | ❌ | Reloj que cuenta hacia arriba, sin límite | Una cuenta atrás invita a ir con prisa y sin entender |
| **Avatar** | ❌ | — | No aporta; la identidad se configura con `git config` (¡y aparece en cada commit!) |
| **Poder** | ❌ | — | No encaja |

**Insignias**: 🛡️ *Sin daños colaterales* (ninguna decisión arriesgada), 🔐 *Sin secretos*
(ni `secretos.env` ni `volcado.sql` llegaron a un commit), 🧠 *Autosuficiente* (sin pistas),
🔍 *Revisor* (usar `git diff --staged` antes de confirmar), ✍️ *Buenos mensajes* (todos los
commits propios con mensajes descriptivos), 🌿 *Cartografía* (consultar el grafo del panel),
⏪ *Máquina del tiempo* (usar `git reflog`), 📚 *Lee el manual* (`man`, `git help` o
`--help`).

### Perfiles de jugador (Bartle)

- **Explorer**: hay mucho contenido oculto que no pide ninguna misión: `git cat-file -p`,
  `cat .git/HEAD`, `git blame`, `git reflog`, alias de git, `man` de casi todo, el
  `~/.gitconfig` editable con `nano`…
- **Achiever**: XP, niveles, 8 insignias y un informe final con el historial dibujado.
- **Killer**: rango y tiempo final, sin tablero público; se pueden comparar informes.
- **Socializer**: se trabaja fuera del juego, en parejas y en la puesta en común.

## Accesibilidad, inclusión y protección de datos

### Accesibilidad

- **Todo se maneja con teclado**, incluido el editor. Con la línea vacía, <kbd>Tab</kbd>
  sale de la terminal al resto de la página, así que el autocompletado no atrapa el foco.
- **Lectores de pantalla**: la salida de la terminal es un `role="log"`; una región
  `role="status"` independiente anuncia solo lo importante (nuevo ticket con su objetivo,
  misión completada, pistas, ascensos, apertura del editor). Los símbolos de la tabla de
  las tres áreas llevan texto oculto («modificado sin preparar», «sin seguimiento»…).
- **Nunca solo color**: los estados combinan color, símbolo y texto; el grafo se puede leer
  como lista (hash + etiquetas + mensaje) aunque no se vea el SVG, que es decorativo.
- **Contraste alto** sobre fondo oscuro, foco visible y tipografía monoespaciada.
- **Movimiento reducido**: con `prefers-reduced-motion` se quitan las animaciones y se
  acortan las esperas entre tickets.
- **Editor accesible**: `nano` tiene etiqueta, anuncio al abrirse y botones para quienes no
  usen atajos de teclado.
- **Modales accesibles**: foco atrapado, cierre con <kbd>Esc</kbd> y devolución del foco.
- **Adaptable**: por debajo de 900 px el panel se coloca sobre la terminal. Comprobado a
  400 px de ancho, sin scroll horizontal.

### Inclusión

- **Cada cual a su ritmo**: sin tiempo límite; el reloj es informativo.
- **Ayuda graduada**: tres pistas por ticket, guía de Git siempre disponible, `man` y
  `git help` dentro del juego, y el panel visual como apoyo permanente.
- **Se puede empezar por cualquier fase**, lo que permite repartir el reto en varias
  sesiones o adaptar el punto de partida a cada persona.
- **Sin castigo definitivo**: se puede reiniciar sin penalización y `exit` no pierde el
  progreso.
- **Tono y lenguaje**: español correcto, mensajes que orientan en lugar de culpar y rangos
  con nombres neutros.

### Protección de datos y uso responsable

- **No recoge ningún dato personal**: el nombre y el correo que se escriben en
  `git config` viven solo en la memoria de la pestaña y desaparecen al cerrarla.
- **No envía nada a ningún servidor** ni usa cookies ni almacenamiento del navegador.
- **No depende de servicios externos** (ni CDN, ni fuentes web, ni analítica).
- **Es una simulación**: el «servidor Git» también está en la página; no se conecta a
  ningún repositorio real.
- De hecho, una de las misiones trata precisamente de **no** subir secretos ni datos
  personales a un repositorio: buen momento para hablar del RGPD y de qué pasa cuando algo
  así acaba en un repositorio público.

## Uso en el aula

**Antes**
- Repaso breve: qué problema resuelve un control de versiones (la anécdota del FTP anónimo
  del reto anterior funciona muy bien como gancho).
- Presentar el vocabulario mínimo: repositorio, commit, rama, remoto.

**Durante**
- Individual o **en parejas** (una persona teclea y la otra consulta la guía y los `man`;
  se cambia de rol en cada fase).
- Sugerencia de reparto: fases 1-2 en una sesión, 3-4 en otra y la 5 en una tercera,
  usando el **selector de fase** de la portada.
- El docente circula y pregunta en lugar de resolver: «¿en qué área está ahora ese
  cambio?», «¿qué crees que hará `reset --hard`?», «¿por qué ha rechazado el push?».
- Insistir en mirar la pestaña 🌿 **Repositorio** después de cada comando.

**Después**
- **Puesta en común**: ¿quién resolvió el conflicto de otra forma? ¿`merge` o `rebase` al
  reconciliar? ¿Por qué `revert` y no `reset` en una rama compartida?
- **Evidencia para el aula virtual**: captura del informe final o del grafo.
- **Ampliación**: repetir el flujo en un repositorio real (GitHub/GitLab), con los mismos
  comandos, y comprobar que se comporta igual.

## Detalles técnicos

HTML semántico, CSS y JavaScript *vanilla* (sin *frameworks*, sin dependencias, sin *build*
y sin módulos ES, para que funcione también con `file://`). El reto comparte con el resto del
repositorio la biblioteca [`shared/`](../shared/) (espacio de nombres `RG`): terminal,
intérprete de órdenes, editor `nano`, páginas de manual, modales accesibles y motor de misiones.

| Fichero | Contenido |
|---|---|
| `index.html` | Solo el marcado de las tres pantallas, el editor y la guía de Git |
| `css/reto.css` | Progreso por fases, pestañas y panel del repositorio |
| `data/config.js` | El escenario: equipo, rutas, servidor remoto y ficheros iniciales del proyecto |
| `data/missions.js` | El contenido de las 30 misiones (textos, objetivos y pistas), sin lógica |
| `data/man.js` · `data/gamification.js` | Páginas de manual · fases, niveles e insignias |
| `js/state.js` | Estado del simulador y montaje de terminal, shell y editor |
| `js/git-core.js` | Objetos, referencias, `.gitignore`, estado, diferencias y fusión a tres bandas |
| `js/git-commands.js` · `js/git-log.js` · `js/git-branch.js` · `js/git-remote.js` · `js/git-misc.js` | Los comandos de Git, por familias |
| `js/shell-commands.js` | `ls`, `cat`, `echo`, `nano`, `sed`, `grep`, `cd`… y el autocompletado |
| `js/repo-view.js` | El panel visual: grafo en SVG y tabla de las tres áreas |
| `js/missions.js` | Comprobaciones de cada misión, lo que hacen Arnold y Sigourney, y la solución de cada ticket |
| `js/main.js` | Motor de misiones, progreso por fases, selector de fase e informe final |

Claves del diseño:

- **Simulador de Git en memoria**, con almacén de objetos propio:
  - `makeCommit()` crea commits con árbol completo, padres, autor, fecha y **hash** de 40
    caracteres calculado a partir del contenido;
  - índice (área de preparación), ramas, etiquetas anotadas, ramas remotas, *upstream*,
    `HEAD` (adjunta o desacoplada), *reflog*, pila de *stash* y operación en curso
    (fusión, cherry-pick, revert o rebase);
  - **diff** por LCS con *hunks* y contexto, **fusión a tres bandas** (diff3) con marcas de
    conflicto, detección de renombrados y `diff --cc` para los ficheros en conflicto;
  - un **servidor remoto simulado** con sus propias referencias, que rechaza los `push` no
    avanzables.
- **Intérprete de shell** con analizador léxico propio (en `shared/js/shell.js`): comillas
  simples y dobles, escapes, comodines, `&&`/`||`/`;`, tuberías y redirecciones `>`/`>>`, más
  un editor `nano` que suspende la ejecución de la línea hasta que se cierra.
- **Motor de misiones**: cada misión declara `check(evento, datos)` (estado del repositorio
  o evento de un comando), `onActivate()` (lo que hacen los compañeros), `react(evento)`
  (consejos ante errores típicos) y `solution` (la secuencia de comandos que la resuelve).
  Esa `solution` es la que usa el **selector de fase** para preparar el repositorio.
- **Contenido separado de la lógica**: los textos de las misiones viven en
  `data/missions.js` (datos puros, editables por el profesorado) y su lógica en
  `js/missions.js`, emparejadas por el código del ticket.
- **Añadir o cambiar una misión**: editar `data/missions.js` (y `data/gamification.js` si se
  añade una fase), y su `check`/`solution` en `js/missions.js`. Toda la interfaz (progreso,
  ficha, registro, informe) se genera a partir de esos datos.

## Verificación

Se ha probado en **Chrome real en modo *headless***, manejado por el protocolo DevTools
(CDP) desde Node.js, con tres guiones que simulan a una persona jugando: **162
comprobaciones, todas superadas y sin ningún error de JavaScript**. Se ejecutan con:

```bash
node .claude/skills/verificar-reto/scripts/run.mjs git
```

Cubren:

- la **partida completa** (las 30 misiones, resolviéndolas con los comandos que propone
  cada ficha), incluidas la creación de un fichero con `nano`, el mensaje de commit escrito
  en el editor y la resolución manual del conflicto quitando las marcas;
- los **mensajes reales de Git**: repositorio inexistente, orden mal escrita con
  sugerencia, identidad sin configurar, fichero ignorado, push rechazado, ramas divergentes;
- **empezar en cada una de las 5 fases**, comprobando que el repositorio preparado tiene la
  historia, las ramas y los ficheros correctos y que no suma XP;
- **caminos alternativos**: `stash`, `HEAD` desacoplada, `switch -`, `rebase` con conflicto
  y `--abort`, `cherry-pick`, `revert`, `branch -D`, `push --force`, `reset --hard`, alias,
  `cat-file`, `rev-parse`, `check-ignore`, redirecciones y tuberías;
- el **panel visual**: número de commits del grafo, nodos SVG, etiquetas `HEAD → main` y
  `origin/main`, tabla de las tres áreas y vista ampliada;
- el **informe final**: XP, 30 filas, 8 insignias y grafo final;
- **accesibilidad**: `role="log"`, región de anuncios, botones del editor, vista a 400 px
  sin scroll horizontal y página sin scroll en escritorio;
- una pasada completa con **`prefers-reduced-motion`** activado.

## Limitaciones conocidas

- El sistema de ficheros es **plano**: no hay subdirectorios (`mkdir` lo avisa).
- No hay `git clone` (el repositorio se crea con `init`) ni repositorios `--bare`.
- `git rebase -i`, `git add -p` y `git stash -p` (modos interactivos) no están disponibles.
- Las fusiones usan una estrategia propia equivalente a diff3; no hay estrategias
  alternativas ni `--squash`.
- El intérprete no es un shell real: no hay variables, sustitución de órdenes, `2>` ni
  ejecución en segundo plano.
- El progreso **no se guarda**: al recargar se empieza de cero (intencionado, para no
  almacenar datos). El selector de fase permite retomar el reto por donde se quedó.

## Archivos

| Archivo | Contenido |
|---|---|
| [`index.html`](index.html) | Marcado de las tres pantallas, el editor y la guía de Git |
| [`css/`](css/) · [`data/`](data/) · [`js/`](js/) | Estilos propios · datos del escenario y de las misiones · simulador de Git, panel del repositorio y arranque |
| [`../shared/`](../shared/) | Biblioteca común: terminal, intérprete, editor, manuales, modales y motor de misiones |
| [`README.md`](README.md) | Este documento |

## Créditos

Made with 💖 by [@fvarrui](https://github.com/fvarrui) & [Claude](https://claude.ai).

Diseñado como reto digital de elaboración propia para el curso *La gamificación educativa*,
dentro de la propuesta «Operación Escudo Digital».
