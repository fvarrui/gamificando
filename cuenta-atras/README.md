# Cuenta atrás

> Simulador gamificado de administración de cuentas: una semana de altas, bajas y grupos
> en el servidor de una empresa ficticia.
> Reto digital de elaboración propia, dentro de la experiencia «Operación Escudo Digital».

---

## Índice

1. [Qué es](#qué-es)
2. [Cómo abrirlo](#cómo-abrirlo)
3. [Contexto educativo](#contexto-educativo)
4. [Objetivos de aprendizaje](#objetivos-de-aprendizaje)
5. [Cómo funciona](#cómo-funciona)
6. [Las 25 tareas](#las-25-tareas)
7. [Órdenes disponibles](#órdenes-disponibles)
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

*Cuenta atrás* es un juego educativo que se ejecuta en el navegador. Quien
juega se pone en la piel de **Linda Hamilton**, que administra el servidor `srv-datos` de la
empresa ficticia **TecnoAtlántica**, y tiene por delante una semana corriente de trabajo:
entran dos personas, se va otra, hay que crear un grupo nuevo, hay que quitar de en medio
una cuenta compartida que lleva años dando vueltas y hay que dar identidad propia al
servicio de copias de seguridad. Todo el parte está en `~/altas.txt`, el primer fichero que
se lee.

No hay botones que hagan el trabajo: la herramienta es una **terminal de Linux** con las
órdenes reales de administración de cuentas —`getent`, `id`, `groups`, `useradd`,
`usermod`, `userdel`, `passwd`, `groupadd`, `gpasswd`— con sus opciones, sus mensajes de
error y sus trampas. Debajo hay un modelo de sistema de verdad: usuarios con su *uid*,
grupos con su *gid*, grupo principal y grupos secundarios, intérprete de órdenes,
directorios personales en un sistema de ficheros virtual y estado de bloqueo de cada
cuenta. Cada orden lo modifica, y cualquier consulta posterior refleja el cambio.

Lo que lo diferencia de un cuestionario es que **las tareas se resuelven haciendo, y los
errores se pueden cometer**. La trampa clásica de `usermod -G` sin `-a` no está bloqueada:
si se escribe, la persona sale de todos sus otros grupos, el juego lo explica, resta
puntos y lo anota en el informe final. Lo mismo con borrar una cuenta en lugar de
bloquearla o con dar directorio personal a una cuenta de servicio. El objetivo es
desarrollar criterio, no impedir equivocaciones.

Funciona sin conexión a Internet, sin instalar nada y sin servidor.

## Cómo abrirlo

- **En local**: doble clic en [`index.html`](index.html). Funciona en cualquier navegador
  moderno (Chrome, Edge, Firefox, Safari).
- **En el aula virtual (EVAGD/Moodle)**: subir la carpeta completa del reto **junto con la
  carpeta [`shared/`](../shared/)** (por ejemplo, en un ZIP con las dos) y enlazar
  `cuenta-atras/index.html`. El reto usa CSS y scripts clásicos, sin módulos
  ES ni `fetch`, así que también funciona desde el sistema de ficheros.
- **En la web**: publicar el repositorio con GitHub Pages o cualquier alojamiento estático.
  No necesita *backend*.

Una partida completa dura entre **25 y 40 minutos**. Desde la portada se puede **empezar en
cualquiera de las 5 fases**: el sistema se prepara automáticamente con las fases anteriores
ya resueltas (esas tareas no suman XP), así que el reto se puede repartir en varias
sesiones o ajustar al punto de partida de cada persona.

## Contexto educativo

| | |
|---|---|
| **Temas** | Linux · Usuarios · Grupos · Administración de sistemas |
| **Encaja en** | Cualquier materia o curso en que se administren sistemas multiusuario, se trabaje con permisos o se gestionen identidades |
| **Punto de partida** | Saber moverse por una terminal (`ls`, `cd`, `cat`); no hace falta haber creado nunca una cuenta |
| **Narrativa** | Continuación de «Operación Escudo Digital»: cerrado el incidente, toca el trabajo que nunca se acaba, dar de alta y de baja a la gente |
| **Modalidad** | Presencial, con apoyo del aula virtual. También sirve en línea, de forma autónoma |

El gancho narrativo es un problema que se reconoce enseguida: la cuenta genérica `visitas`,
creada «para un curso, temporalmente», con una contraseña que conoce medio edificio y una
carpeta abierta de par en par. Si alguien hace algo con ella, **no hay forma de saber quién
fue**. Ese es exactamente el motivo por el que existen las cuentas personales.

Hay una versión hermana del mismo escenario para sistemas Windows, en
[`cuenta-pendiente/`](../cuenta-pendiente/), con cuentas locales,
SID y los cmdlets `*-LocalUser` y `*-LocalGroup`: las dos se pueden jugar en paralelo o
comparar en la puesta en común.

## Objetivos de aprendizaje

Al terminar el reto, el alumnado debería ser capaz de:

1. **Identificar** los elementos con los que Linux representa a una persona y a un equipo:
   *uid*, *gid*, grupo principal, grupos secundarios, comentario, directorio personal e
   intérprete de órdenes, y saber en qué bases de datos viven (`passwd` y `group`).
2. **Consultar** el estado de las cuentas y las pertenencias con la orden adecuada a cada
   pregunta: `getent passwd`, `getent group`, `id`, `groups` y `passwd -S`, entendiendo
   por qué el **grupo principal no aparece** en la lista de miembros de `getent group`.
3. **Aplicar** el alta completa de una persona: crear la cuenta con su directorio personal
   (`-m`), su intérprete (`-s`), su nombre real (`-c`) y sus grupos (`-G`), y asignarle
   contraseña, sabiendo que sin ella la cuenta existe pero no entra.
4. **Distinguir** `-g` de `-G` y, sobre todo, `usermod -G` de `usermod -aG`, explicando qué
   se pierde exactamente al olvidar la `-a` y cómo se comprueba inmediatamente después.
5. **Evaluar** cuándo se bloquea una cuenta y cuándo se elimina: argumentar por qué en una
   baja se bloquea (`usermod -L`, `passwd -l`) y por qué borrar (`userdel -r`) deja
   ficheros sin dueño y no tiene vuelta atrás.
6. **Decidir** cómo se configura una **cuenta de servicio**, que no representa a una
   persona: cuenta de sistema (`-r`), sin directorio personal y con `/usr/sbin/nologin`,
   y justificar por qué eso reduce la superficie de ataque.
7. **Justificar** por qué una cuenta compartida es una mala práctica, relacionándola con la
   trazabilidad y con la imposibilidad de atribuir responsabilidades.
8. **Trabajar con privilegios de forma consciente**: reconocer qué órdenes requieren `sudo`
   y por qué no se trabaja siempre como `root`.

## Cómo funciona

### Las tres pantallas

1. **Portada (encargo)**: el correo de Sigourney Weaver, responsable de sistemas, con las dos
   reglas de la casa (se bloquea, no se borra; cuidado con `usermod -G` sin `-a`), la
   explicación del juego, el **selector de fase inicial** y la **guía rápida de cuentas y
   grupos**, accesible también durante la partida.
2. **Juego**: la terminal ocupa casi toda la pantalla. Arriba, una barra con el progreso
   por fases, el reloj, la XP y el nivel. En el lateral, la **ficha de la tarea actual**
   (origen, síntomas, objetivo, recompensa y botón de pista) y el **registro de la semana**
   con lo ya resuelto.
3. **Informe final**: XP, nivel alcanzado, tiempo, pistas usadas, tareas resueltas,
   insignias, la tabla de las 25 tareas con la orden exacta que resolvió cada una y la
   lista de decisiones arriesgadas.

### El desarrollo de una partida

Las tareas llegan **de una en una**, como peticiones internas con su código (`USR-01` …
`USR-25`) y su origen: Sistemas, Personas y Talento, o un compañero de proyectos. Al
completar una, a los pocos segundos aparece la siguiente con un aviso en la terminal y la
ficha entrando desde el lateral.

Cada ficha describe **el síntoma y el objetivo**, nunca la solución literal. Si hace falta
ayuda, hay **tres pistas por tarea**, que van de lo general a lo concreto: la primera
orienta, la segunda explica el matiz importante y **solo la tercera contiene la orden
exacta**. Cada pista cuesta 25 XP, pero nunca bloquea: siempre se puede seguir.

Si se resuelve algo **antes** de que llegue su petición, la petición aparece igualmente y
se completa sola con un **bono de +25 XP**: el juego premia ir por delante.

### Las mecánicas clave

- **Todo pasa por el modelo del sistema.** No hay respuestas «correctas» memorizadas: la
  comprobación de cada tarea mira el estado real del sistema simulado (¿existe el grupo
  `formacion`?, ¿está `moss` en `ventas`?, ¿tiene `vandamme` la cuenta bloqueada?) o el
  evento que emitió la orden (una consulta con `getent`, un `ls -l /home`). Por eso casi
  todas las tareas admiten **varias soluciones válidas**: `usermod -aG` o `gpasswd -a`,
  `usermod -L` o `passwd -l`, `id` o `groups`.
- **Las decisiones arriesgadas cuestan, pero se permiten.** Un vigilante global observa
  todas las órdenes y anota cuatro errores que en un sistema real duelen: `usermod -G` sin
  `-a`, borrar la cuenta de la baja en vez de bloquearla, borrar una cuenta que sigue en
  activo y crear una cuenta de servicio con directorio personal. Cada tipo penaliza **una
  sola vez** (−50 XP), se explica en la terminal en el momento y aparece en el informe
  final.
- **Los privilegios importan.** La sesión es de `hamilton`, no de `root`. Toda orden de
  administración que se intente sin `sudo` falla con el mismo mensaje que en un sistema
  real (`Permission denied` y `cannot lock /etc/passwd`), y `sudo` eleva solo esa orden.
- **El manual está dentro.** 26 páginas de `man` (`useradd`, `usermod`, `userdel`,
  `passwd`, `groupadd`, `groupdel`, `gpasswd`, `getent`, `id`, `groups`, `sudo`, `ls`,
  `chown`…) con sinopsis, opciones y ejemplos. Consultar al menos una da insignia.

## Las 25 tareas

### Fase 1 · Quién hay

| # | Código | Tarea | Qué se practica |
|---|--------|-------|-----------------|
| 1 | USR-01 | El parte de la semana | `cat`, leer el encargo antes de tocar nada |
| 2 | USR-02 | ¿Qué cuentas hay en el sistema? | `getent passwd` y los siete campos de cada línea |
| 3 | USR-03 | ¿Y los grupos? | `getent group`, miembros secundarios |
| 4 | USR-04 | La ficha de Michelle | `id` / `groups`: *uid*, *gid* y todos los grupos |
| 5 | USR-05 | La cuenta que usa todo el mundo | `getent passwd <clave>`; por qué una cuenta compartida es un problema |

### Fase 2 · Altas

| # | Código | Tarea | Qué se practica |
|---|--------|-------|-----------------|
| 6 | USR-06 | Un grupo para el plan de formación | `groupadd` y la necesidad de `sudo` |
| 7 | USR-07 | Alta de Carrie-Anne | `useradd -m -s -c`: sin `-m` no hay directorio personal |
| 8 | USR-08 | Comprueba su carpeta | `ls -l /home`: dueño y grupo del directorio personal |
| 9 | USR-09 | Ponle contraseña | `passwd <usuario>`: sin contraseña la cuenta no entra |
| 10 | USR-10 | Alta de Jackie, ya en su equipo | `useradd -G`: `-g` (principal) frente a `-G` (secundarios) |

### Fase 3 · Pertenencias

| # | Código | Tarea | Qué se practica |
|---|--------|-------|-----------------|
| 11 | USR-11 | Carrie-Anne entra en ventas | **`usermod -aG`**: sin la `-a`, `-G` sustituye toda la lista |
| 12 | USR-12 | Compruébalo | `id`: comprobar siempre después de tocar grupos |
| 13 | USR-13 | Jackie, al plan de formación | `gpasswd -a usuario grupo` (ojo al orden de los argumentos) |
| 14 | USR-14 | Jean-Claude sale del proyecto | `gpasswd -d` para quitar una pertenencia |
| 15 | USR-15 | ¿Quién queda en proyectos? | `getent group <grupo>`; el grupo principal **no** sale ahí |

### Fase 4 · Bajas y bloqueos

| # | Código | Tarea | Qué se practica |
|---|--------|-------|-----------------|
| 16 | USR-16 | El estado de la cuenta de Jean-Claude | `passwd -S`: `P`, `L` o `NP` |
| 17 | USR-17 | Bloquear, no borrar | `usermod -L` / `passwd -l`: la cuenta sigue existiendo |
| 18 | USR-18 | Confirma el bloqueo | Verificar el cambio: la cuenta aparece como `L` |
| 19 | USR-19 | Adiós a la cuenta compartida | `userdel -r`: cuándo sí se elimina, y con su carpeta |
| 20 | USR-20 | Comprueba que no queda rastro | `ls -l /home`: ficheros huérfanos si se borra sin `-r` |

### Fase 5 · Cuentas de servicio

| # | Código | Tarea | Qué se practica |
|---|--------|-------|-----------------|
| 21 | USR-21 | Una cuenta para las copias | `useradd -r -s /usr/sbin/nologin`: una cuenta de servicio no es una persona |
| 22 | USR-22 | Comprueba que no puede entrar | `getent passwd`: el último campo es el intérprete |
| 23 | USR-23 | Y remata la baja | `usermod -s`: defensa en profundidad sobre la cuenta bloqueada |
| 24 | USR-24 | El grupo de formación, cerrado | `getent group formacion`: confirmar el resultado |
| 25 | USR-25 | Deja el listado por escrito | Redirección `>` para dejar constancia por escrito |

## Órdenes disponibles

| Tipo | Órdenes |
|---|---|
| Consultar identidades | `getent passwd [clave]`, `getent group [clave]`, `id [usuario]`, `groups [usuario]`, `whoami`, `passwd -S` |
| Cuentas | `useradd [-m] [-M] [-s] [-c] [-g] [-G] [-u] [-d] [-r]`, `usermod [-a] [-G] [-g] [-s] [-d] [-c] [-L] [-U]`, `userdel [-r] [-f]`, `passwd [-l] [-u] [-S]` |
| Grupos | `groupadd [-g] [-r]`, `groupdel`, `gpasswd [-a] [-d] [-M]` |
| Ficheros y carpetas | `ls [-la]`, `tree`, `cat`, `head`, `tail`, `wc`, `file`, `stat`, `grep`, `find`, `mkdir`, `rmdir`, `touch`, `cp`, `mv`, `rm`, `nano`, `echo` |
| Permisos | `chmod`, `chown`, `chgrp`, `umask`, `getfacl`, `setfacl` |
| Privilegios | `sudo <orden>` |
| Sesión y ayuda | `pwd`, `cd`, `date`, `which`, `history`, `clear`, `man <orden>`, `help` |
| Composición | Encadenado con `&&`, `\|\|` y `;`; tuberías con `\| grep [-i] [-v] [-n] [-c]`, `\| head`, `\| tail`, `\| wc`, `\| sort`, `\| uniq`; redirecciones `>` y `>>`; comodines (`*.txt`); comillas simples y dobles |

Atajos: <kbd>↑</kbd>/<kbd>↓</kbd> historial, <kbd>Tab</kbd> autocompletar (órdenes y
ficheros), <kbd>Ctrl</kbd>+<kbd>L</kbd> limpiar la pantalla,
<kbd>Ctrl</kbd>+<kbd>C</kbd> cancelar la línea. Con la línea vacía, <kbd>Tab</kbd> saca el
foco de la terminal hacia el resto de la página.
En `nano`: <kbd>Ctrl</kbd>+<kbd>O</kbd> guardar, <kbd>Ctrl</kbd>+<kbd>X</kbd> salir,
<kbd>Ctrl</kbd>+<kbd>K</kbd> cortar línea, <kbd>Ctrl</kbd>+<kbd>U</kbd> pegar (también hay
botones).

## Cómo se diseñó

### Principios que guiaron las decisiones

- **Primero los aprendizajes, después la narrativa.** El reto nació de cinco ideas que
  cuesta transmitir con una explicación y que se entienden a la primera cuando se sufren:
  (1) `usermod -G` sin `-a` saca a la persona de todos sus demás grupos; (2) en una baja se
  bloquea, no se borra, porque al borrar los ficheros quedan sin dueño; (3) una cuenta de
  servicio no es una persona y no debe poder iniciar sesión; (4) una cuenta compartida hace
  imposible saber quién hizo qué; (5) el grupo principal no aparece entre los miembros de
  `getent group`, y por eso existe `id`. La semana de altas y bajas se construyó **después**,
  como el escenario más natural para que esas cinco ideas aparezcan en orden y con motivo.
- **El simulador no enseña cosas falsas.** `useradd` sin `-m` **no** crea el directorio
  personal; `usermod -G` sin `-a` sustituye de verdad la lista de grupos secundarios y se
  nota en el siguiente `id`; `userdel` sin `-r` deja la carpeta atrás; `groupdel` se niega a
  borrar el grupo principal de una cuenta existente; `useradd` rechaza un grupo que no
  existe y una cuenta que ya existe; el grupo principal no figura en `getent group`, pero sí
  en `id`; y ninguna orden de administración funciona sin `sudo`. Si el alumnado repite
  después estas órdenes en una máquina real, verá lo mismo.
- **La ficha describe el problema, nunca la solución.** Los objetivos están escritos en
  términos del resultado («añade a `moss` al grupo secundario `ventas` sin sacarla de
  ningún otro»), no de la orden. La orden literal solo aparece en la **tercera** pista, y la
  guía de ayuda general explica la mecánica sin resolver la tarea en curso.
- **Varias soluciones válidas por tarea.** Las comprobaciones miran el estado del sistema,
  no la cadena tecleada. Añadir a alguien a un grupo vale con `usermod -aG` y con
  `gpasswd -a`; bloquear vale con `usermod -L` y con `passwd -l`; consultar grupos vale con
  `id` y con `groups`. El informe final recoge **la orden que realmente se usó**, lo que
  hace muy visible en la puesta en común que había más de un camino.
- **Los errores importantes se permiten, se explican y se anotan.** Se podría haber
  bloqueado `usermod -G` sin `-a`, pero entonces nadie aprendería por qué es peligroso. Se
  ejecuta, el sistema queda como quedaría de verdad, aparece un aviso explicando qué se ha
  perdido, cuesta 50 XP y queda en el informe. La tarea siguiente (USR-12, «Compruébalo»)
  está puesta justo ahí para que se descubra el destrozo con `id`.
- **Comprobar después de cada cambio es parte del contenido.** Nueve de las veinticinco
  tareas son consultas de verificación (USR-08, USR-12, USR-15, USR-16, USR-18, USR-20,
  USR-22, USR-24, USR-25). No son relleno: instalan el hábito profesional de no dar por
  hecho que una orden hizo lo que se pretendía.
- **Los mensajes de error orientan sin dar la respuesta.** «El grupo *inventado* no existe»,
  «el usuario *moss* ya existe», «no se puede eliminar el grupo primario del usuario
  *hamilton*»: cada fallo dice qué está mal, no qué escribir.

### Evolución del diseño

| Se probó | Qué pasó | Cómo quedó |
|---|---|---|
| Un panel lateral que dibujase usuarios y grupos, al estilo del grafo de *Punto de retorno* | Quitaba sentido al contenido: si el panel muestra las pertenencias, nadie escribe `id` ni `getent group`, que es justo lo que hay que aprender | Sin panel visual. La verificación se hace con órdenes, y hay tareas dedicadas a ello |
| Impedir `usermod -G` sin `-a` con un aviso de confirmación | El error dejaba de doler y, por tanto, de enseñar | Se permite, se ejecuta con todas sus consecuencias, se explica y se penaliza una vez |
| Empezar directamente por el alta de Carrie-Anne | Sin ver antes el sistema, las tareas se resolvían copiando la orden sin entender el contexto | Fase 1 entera de solo lectura: quién hay, qué grupos hay, cómo se consulta |
| Una única tarea «da de baja a Jean-Claude» | Mezclaba dos decisiones distintas (bloquear la contraseña y quitar el intérprete) y ocultaba la idea central | Tres tareas separadas: ver el estado, bloquear, confirmar; y en la fase 5, quitar la shell como segunda barrera |
| Que `visitas` también se bloquease | Confundía la regla: no todo se bloquea, y las cuentas compartidas sí hay que eliminarlas | La baja de una persona se bloquea; la cuenta compartida se elimina con `-r`. El contraste es la lección |

### Relación con los retos hermanos

Este reto comparte biblioteca, estética y mecánicas con el resto de la colección, pero es
**más corto y más monotemático** que *Punto de retorno*: 25 tareas de una sola familia
de órdenes frente a 30 de un sistema completo. Está pensado para caber en una sesión.
Su versión para Windows recorre exactamente el mismo escenario con cuentas locales, lo que
permite comparar los dos modelos de identidad sin cambiar de historia.

## Elementos de gamificación

Relación con los **12 componentes** vistos en el curso *La gamificación educativa* (solo se
usan los que encajan):

| Componente | ¿Se usa? | Cómo | Por qué |
|---|---|---|---|
| **Misiones** | ✅ | 25 peticiones encadenadas (USR-01…USR-25) agrupadas en 5 fases | Se habla de tareas y de peticiones internas, nunca de ejercicios |
| **Sorpresa** | ✅ | Las peticiones llegan de tres orígenes distintos (Sistemas, Personas y Talento, Proyectos) y alguna corrige lo anterior («se nos pasó: Carrie-Anne necesita ventas») | Reproduce cómo llega el trabajo de verdad: a trozos y con rectificaciones |
| **Desbloqueo de contenido** | ✅ | Cada tarea se revela al completar la anterior | Hay que avanzar para descubrir qué viene |
| **Puntos (XP)** | ✅ | 75-175 XP por tarea, −25 por pista, −50 por decisión arriesgada, +25 por adelantarse | *Feedback* inmediato; las pistas cuestan, pero nunca bloquean |
| **Niveles** | ✅ | Consulta cuentas → Da de alta (400 XP) → Reparte grupos (850 XP) → Administra identidades (1300 XP) | Los nombres describen competencias, no rangos vacíos |
| **Insignias** | ✅ | 6 insignias ligadas a buenas prácticas (ver abajo) | Reconocen *cómo* se ha trabajado, no solo terminar |
| **Barra de progreso** | ✅ | Progreso por fases en la barra superior, contador de tarea y registro lateral de la semana | Ver el avance anima a seguir y sitúa en qué bloque se está |
| **Recompensas** | ✅ | Pistas graduadas «compradas» con XP; guía de cuentas y grupos y páginas de `man` siempre disponibles y gratuitas | La ayuda existe siempre; solo cuesta la que da la respuesta |
| **Tablero de clasificación** | ❌ | — | Deliberadamente no: el informe es individual y no se guarda ningún dato |
| **Cuenta atrás** | ❌ | Reloj que cuenta hacia arriba, sin límite | Una cuenta atrás invita a teclear sin entender; la insignia de ritmo premia la soltura sin presionar |
| **Avatar** | ❌ | — | No aporta: la identidad del juego es la cuenta `hamilton`, que además condiciona qué se puede hacer sin `sudo` |
| **Poder** | ❌ | — | No encaja en un escenario de administración corriente |

**Insignias**: 🛡️ *Sin destrozos* (ninguna decisión arriesgada), 🧠 *Autosuficiente* (sin
pistas), 📚 *Lee el manual* (consultar al menos una página de `man`), 🚫 *Sin inicio de
sesión* (la cuenta de servicio quedó con `/usr/sbin/nologin`), 🔒 *Bloquear antes que
borrar* (la cuenta de la baja quedó bloqueada, no eliminada), ⚡ *Buen ritmo* (jornada
completada en menos de 26 minutos).

Las tres del medio son deliberadamente **de resultado, no de procedimiento**: se obtienen
mirando cómo quedó el sistema al final, no qué orden se escribió. Se puede llegar a ellas
por caminos distintos.

### Perfiles de jugador (Bartle)

- **Explorer**: hay mucho que curiosear que no pide ninguna tarea: `getent passwd root`,
  `ls -l /home/visitas` y la contraseña del wifi que hay dentro, `/srv/proyectos` con su
  bit *setgid*, `stat`, `getfacl`, `umask`, `find`, el `man` de casi todo y el `nano` para
  abrir cualquier fichero.
- **Achiever**: XP, 4 niveles, 6 insignias y un informe final con la orden exacta que
  resolvió cada tarea.
- **Killer**: tiempo final e insignia de ritmo, sin tablero público; se pueden comparar
  informes entre compañeros.
- **Socializer**: el trabajo por parejas y la puesta en común, donde se comparan los
  caminos elegidos (`usermod` frente a `gpasswd`, `usermod -L` frente a `passwd -l`).

### Estado de *flow*

La curva de dificultad está repartida por fases: la 1 es solo lectura (consultar, sin
riesgo), la 2 introduce la creación con opciones, la 3 pone la trampa principal justo
cuando ya hay confianza, la 4 exige decidir entre bloquear y borrar, y la 5 cierra con un
caso distinto (una identidad que no es una persona). Las recompensas suben con la
dificultad (de 75 a 175 XP) y las tareas de verificación, más sencillas, actúan de
descanso entre las difíciles. Las tres pistas graduadas evitan el atasco y la ausencia de
límite de tiempo evita la ansiedad; el selector de fase permite entrar directamente al
nivel de reto adecuado.

## Accesibilidad, inclusión y protección de datos

### Accesibilidad

- **Todo se maneja con teclado**, incluido el editor. Con la línea vacía, <kbd>Tab</kbd>
  sale de la terminal al resto de la página, así que el autocompletado no atrapa el foco.
- **Lectores de pantalla**: la salida de la terminal es un `role="log"`; una región
  `role="status"` independiente anuncia solo lo importante (nueva tarea con su objetivo,
  tarea completada, pistas, ascensos de nivel).
- **Nunca solo color**: los estados de la barra de fases y del registro combinan color,
  símbolo y texto; los iconos decorativos llevan `aria-hidden` y el progreso por fases
  tiene su versión en texto para lectores de pantalla («Fase 3, Pertenencias: 2 de 5
  tareas»).
- **Contraste alto** sobre fondo oscuro, foco visible y tipografía monoespaciada.
- **Movimiento reducido**: con `prefers-reduced-motion` se quitan las animaciones y se
  acortan las esperas entre tareas.
- **Modales accesibles**: la guía de cuentas y grupos atrapa el foco, se cierra con
  <kbd>Esc</kbd> o con clic fuera y devuelve el foco al botón que la abrió.
- **Adaptable**: por debajo de 900 px el panel lateral se coloca sobre la terminal.
  Comprobado a 400 px de ancho, sin scroll horizontal.

### Inclusión

- **Cada cual a su ritmo**: sin tiempo límite; el reloj es informativo y la insignia de
  ritmo es opcional.
- **Ayuda graduada**: tres pistas por tarea, guía rápida siempre disponible desde la barra
  superior y `man` completo dentro del propio juego.
- **Se puede empezar por cualquier fase**, lo que permite repartir el reto en varias
  sesiones, repetir solo la parte que costó o ajustar el punto de partida.
- **Sin castigo definitivo**: se puede reiniciar sin penalización, ningún error cierra un
  camino y ninguna decisión arriesgada impide terminar.
- **Tono y lenguaje**: español correcto, mensajes que orientan en lugar de culpar, nombres
  de personas variados y niveles con nombres neutros que describen lo que se sabe hacer.

### Protección de datos y uso responsable

- **No recoge ningún dato personal**: no se pide nombre ni correo en ningún momento.
- **No guarda nada**: el progreso vive en la memoria de la pestaña y desaparece al
  cerrarla. No usa cookies, ni `localStorage`, ni almacenamiento del navegador.
- **No envía nada a ningún servidor** ni depende de servicios externos (ni CDN, ni fuentes
  web, ni analítica).
- **Es una simulación**: no se modifica ningún sistema real. Las contraseñas nunca se
  escriben de verdad (`passwd` muestra asteriscos y no las almacena).
- Las personas del escenario son **ficticias**, pero el reto es un buen momento para hablar
  de cuentas nominales, del principio de mínimo privilegio y de por qué una cuenta
  compartida es, además de una mala práctica técnica, un problema de trazabilidad y de
  responsabilidad.

## Uso en el aula

**Antes**

- Pregunta de arranque: «en clase usáis todos el mismo equipo, ¿cómo sabría el centro quién
  borró un fichero?». De ahí sale sola la idea de cuenta personal.
- Vocabulario mínimo: usuario, *uid*, grupo, grupo principal y grupo secundario,
  directorio personal, intérprete de órdenes.
- Dejar claro que casi todo necesita `sudo` y por qué no se trabaja siempre como `root`.

**Durante**

- Individual o **en parejas** (una persona teclea y la otra consulta la guía y los `man`;
  se cambia de rol en cada fase).
- Sugerencia de reparto: fases 1-3 en una sesión y 4-5 en otra, usando el **selector de
  fase** de la portada.
- El docente circula y pregunta en lugar de resolver: «¿en qué grupos está ahora Carrie-Anne?»,
  «¿qué crees que pasará si quitas la `-a`?», «¿por qué esta cuenta se borra y la de Jean-Claude
  no?».
- Insistir en **comprobar después de cada cambio**: ninguna orden se da por buena sin un
  `id`, un `getent` o un `ls -l`.

**Después**

- **Puesta en común** a partir del informe final, comparando la columna «Cómo se resolvió»:
  - ¿Quién usó `usermod -aG` y quién `gpasswd -a`? ¿Hay alguna diferencia práctica?
  - ¿Por qué la cuenta de Jean-Claude se bloquea y la de `visitas` se elimina? ¿Qué habría pasado
    con los ficheros de Jean-Claude si la hubiéramos borrado?
  - ¿Por qué `getent group proyectos` no muestra a todo el mundo que «está» en proyectos?
  - ¿Qué gana el sistema con que `svc-backup` tenga `/usr/sbin/nologin`?
  - Para quien perdió XP con `usermod -G`: ¿cómo lo descubriste? ¿cómo lo arreglarías?
- **Evidencia para el aula virtual**: captura del informe final (XP, insignias y tabla de
  las 25 tareas).
- **Ampliación**: repetir el alta completa de una persona en una máquina virtual real o en
  un contenedor, con las mismas órdenes, y comprobar que se comporta igual; o jugar la
  versión de Windows y comparar los dos modelos de identidad.

## Detalles técnicos

HTML semántico, CSS y JavaScript *vanilla* (sin *frameworks*, sin dependencias, sin *build*
y sin módulos ES, para que funcione también con `file://`). El reto comparte con el resto
del repositorio la biblioteca [`shared/`](../shared/) (espacio de nombres `RG`) y **solo
aporta datos**: escenario, tareas, fases, niveles e insignias.

| Fichero | Contenido |
|---|---|
| `index.html` | Solo el marcado de las tres pantallas, el editor `nano` y la guía de cuentas y grupos |
| `css/reto.css` | Los dos ajustes propios: ancho del panel lateral y color del aviso de la terminal |
| `data/config.js` | El escenario: servidor, usuarios, grupos, pertenencias iniciales y sistema de ficheros (incluido `~/altas.txt`) |
| `data/gamification.js` | Fases, niveles, insignias y constantes de puntuación |
| `data/missions.js` | El contenido de las 25 tareas (textos, objetivos y pistas), sin lógica |
| `js/missions.js` | La comprobación (`check`) y la solución (`solution`) de cada tarea, y el vigilante de decisiones arriesgadas |
| `js/main.js` | Crea el entorno con `RG.Sandbox`: páginas de `man`, ayuda, textos, secuencia de arranque, insignias finales e informe |

De la biblioteca compartida, este reto usa sobre todo:

| Módulo de `shared/` | Qué aporta |
|---|---|
| `js/sysmodel.js` | El modelo de sistema: usuarios (*uid*, grupo principal, intérprete, bloqueo), grupos (*gid*, miembros) y el cálculo de pertenencias `userGroups()` |
| `js/cmd-posix-admin.js` | Las órdenes de administración: `useradd`, `usermod`, `userdel`, `passwd`, `groupadd`, `groupdel`, `gpasswd`, `getent`… con sus opciones y sus mensajes |
| `js/cmd-posix.js` | Las órdenes de siempre: `ls`, `cat`, `grep`, `find`, `chown`, `id`, `groups`, `sudo`, `man`… |
| `js/vfs.js` | El sistema de ficheros virtual, con dueño, grupo y permisos por nodo |
| `js/sandbox.js` | El arranque común: terminal, intérprete, editor, motor de tareas, fases, selector de fase inicial e informe final |
| `js/terminal.js` · `js/shell.js` · `js/editor.js` · `js/man.js` · `js/modal.js` · `js/game.js` | Terminal, intérprete (tuberías y redirecciones), `nano`, manuales, modales accesibles y motor de gamificación |

Claves del diseño:

- **El estado es el sistema, no una lista de respuestas.** Cada tarea declara
  `check(evento)`, que consulta el modelo (`sys.user()`, `sys.group()`, `sys.inGroup()`, el
  VFS) o el evento emitido por la orden. Las órdenes emiten eventos tipados (`useradd`,
  `usermod`, `getent`, `passwd`…) que sirven tanto para las comprobaciones como para el
  vigilante global.
- **Contenido separado de la lógica**: los textos viven en `data/missions.js` (datos puros,
  editables por el profesorado) y su lógica en `js/missions.js`, emparejados por posición a
  través del código `USR-xx`.
- **La solución de cada tarea es ejecutable**: el campo `solution` contiene las órdenes que
  la resuelven, y el **selector de fase inicial** las ejecuta en silencio para dejar el
  sistema en el estado correcto antes de empezar.
- **Añadir o cambiar una tarea**: editar `data/missions.js` (y `data/gamification.js` si se
  añade una fase) y su `check`/`solution` en `js/missions.js`. Toda la interfaz (progreso,
  ficha, registro, informe) se genera a partir de esos datos.

## Verificación

Se ha probado en **Chrome real en modo *headless***, manejado por el protocolo DevTools
(CDP) desde Node.js, con un guion que simula a una persona jugando: **39 comprobaciones,
todas superadas y sin ningún error de JavaScript**. Se ejecuta con:

```bash
node .claude/skills/verificar-reto/scripts/run.mjs test-cuenta-atras
```

Cubren:

- que la **portada** ofrece las 5 fases;
- que **sin `sudo` no se administra**: `useradd` falla con el mensaje real del sistema;
- la **partida completa**, resolviendo las 25 tareas con las órdenes que propone cada ficha;
- que el **modelo de usuarios funciona de verdad**: Carrie-Anne conserva su grupo principal y el
  secundario, la cuenta de servicio queda con `/usr/sbin/nologin`, la cuenta de la baja
  aparece como bloqueada (`L`) y no borrada, la cuenta compartida ya no existe y los
  directorios de `/home` reflejan las altas y la baja;
- los **errores realistas**: no se puede crear dos veces la misma cuenta ni añadir a alguien
  a un grupo inexistente;
- el **informe final**: XP por encima de 2800, las 25 filas de la tabla y ninguna decisión
  arriesgada anotada en una partida limpia;
- que el **error clásico queda anotado**: empezando en la fase 3 y escribiendo
  `usermod -G ventas moss`, aparece el aviso de decisión arriesgada.

Como el reto se apoya entero en la biblioteca compartida, cualquier cambio en `shared/`
obliga a volver a pasar también las pruebas del resto de los retos:

```bash
node .claude/skills/verificar-reto/scripts/run.mjs
```

## Limitaciones conocidas

- **No se puede iniciar sesión con otra cuenta**: no hay `su`, `login` ni `newgrp`, así que
  el bloqueo se comprueba con `passwd -S` y no «intentando entrar».
- **`passwd` no pide una contraseña real**: muestra el diálogo con asteriscos y marca la
  cuenta como «con contraseña». No hay política de complejidad, ni caducidad, ni `chage`,
  ni `/etc/shadow` consultable.
- **`useradd -r` no reserva un *uid* de sistema bajo** (menor que 1000) como haría
  `shadow-utils`: la cuenta se crea correctamente como cuenta de sistema y sin inicio de
  sesión, pero el número que recibe sigue la secuencia normal.
- **`/etc/skel` está vacío y no se copia**: el directorio personal se crea, pero sin los
  ficheros de plantilla (`.bashrc`, `.profile`) que aparecerían en un sistema real.
- **Los cambios de grupo son inmediatos**: en un sistema real hay que cerrar y volver a
  abrir la sesión (o usar `newgrp`) para que una nueva pertenencia surta efecto.
- **Faltan órdenes de la familia**: no hay `groupmod`, `chage`, `usermod -e`, `vipw`,
  `pwck` ni gestión de cuotas. `id` ignora sus opciones (`-u`, `-g`, `-n`) y siempre imprime
  la línea completa.
- **El intérprete no es un shell real**: no hay variables, sustitución de órdenes, `2>` ni
  ejecución en segundo plano.
- **No hay panel visual de usuarios y grupos**: es una decisión de diseño (ver «Cómo se
  diseñó»), pero significa que quien se pierde entre pertenencias debe apoyarse en `id` y
  `getent`, no en un esquema.
- **El progreso no se guarda**: al recargar se empieza de cero (intencionado, para no
  almacenar datos). El selector de fase permite retomar el reto por donde se quedó.

## Archivos

| Archivo | Contenido |
|---|---|
| [`index.html`](index.html) | Marcado de las tres pantallas, el editor y la guía de cuentas y grupos |
| [`css/`](css/) · [`data/`](data/) · [`js/`](js/) | Estilos propios · escenario, gamificación y textos de las tareas · comprobaciones y arranque |
| [`../shared/`](../shared/) | Biblioteca común: terminal, intérprete, editor, manuales, modales, modelo de sistema y motor de tareas |
| [`../index.html`](../index.html) | Portada del repositorio, con el resto de los juegos |
| [`README.md`](README.md) | Este documento |

## Créditos

Made with 💖 by [@fvarrui](https://github.com/fvarrui) & [Claude](https://claude.ai).

Diseñado como reto digital de elaboración propia para el curso *La gamificación educativa*,
dentro de la propuesta «Operación Escudo Digital».
