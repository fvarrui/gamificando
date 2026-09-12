# Permisos y ACL en Linux

> Simulador gamificado de permisos POSIX y listas de control de acceso en una terminal Linux.
> Reto digital de elaboración propia, dentro de la experiencia «Operación Escudo Digital».

---

## Índice

1. [Qué es](#qué-es)
2. [Cómo abrirlo](#cómo-abrirlo)
3. [Contexto educativo](#contexto-educativo)
4. [Objetivos de aprendizaje](#objetivos-de-aprendizaje)
5. [Cómo funciona](#cómo-funciona)
6. [Las 26 tareas](#las-26-tareas)
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

*Permisos y ACL en Linux* es un juego educativo que se ejecuta en el navegador. Quien juega
es **Ana Betancor**, de sistemas de la empresa ficticia **TecnoAtlántica**: una consultora
externa acaba de instalar el servidor de archivos `srv-datos`, se ha ido, y ha dejado la
carpeta compartida `/srv/proyectos` **casi toda a 777 y con dueño `root`**. Dentro hay un
`privado/claves.txt` con las credenciales de un servicio que **cualquier usuario del sistema
puede leer**. Hay una mañana para cerrarlo.

No hay botones que hagan el trabajo: la herramienta es una terminal `bash` con órdenes reales
—`ls -l`, `stat`, `find -perm`, `chmod`, `chown`, `chgrp`, `umask`, `getfacl`, `setfacl`—
sobre un sistema de ficheros simulado que **aplica los permisos de verdad**. Si se cierra una
carpeta, deja de poder entrarse en ella; si se borra la `x` de un directorio, no se atraviesa;
si se pone el SGID, lo que se cree dentro hereda el grupo; si la máscara de una ACL es `r--`,
una entrada con `rw-` concede solo lectura. Nada está pintado: todo se calcula.

Lo que lo distingue de un test no es solo que haya que escribir las órdenes, sino que **el
objetivo no es cerrar, sino repartir**. Ventas necesita *leer* el presupuesto; Dirección
necesita llegar al acta y a nada más; el equipo de proyectos tiene que poder seguir trabajando
**con los ficheros que cree mañana**. Conceder de más no está prohibido: resta XP y queda
anotado en el informe final.

Funciona sin conexión a Internet, sin instalar nada y sin servidor.

## Cómo abrirlo

- **En local**: doble clic en [`index.html`](index.html). Funciona en cualquier navegador
  moderno (Chrome, Edge, Firefox, Safari).
- **En el aula virtual (EVAGD/Moodle)**: subir la carpeta completa del reto **junto con la
  carpeta [`shared/`](../shared/)** (por ejemplo, en un ZIP con las dos) y enlazar
  `permisos-en-linux/index.html`. El reto usa CSS y scripts clásicos, sin módulos ES ni
  `fetch`, así que también funciona desde el sistema de ficheros.
- **En la web**: publicar el repositorio con GitHub Pages o cualquier alojamiento estático.
  No necesita *backend*.

Una partida completa dura entre **25 y 40 minutos**. Desde la portada se puede **empezar en
cualquiera de las 5 fases**: el servidor se prepara automáticamente con las fases anteriores ya
resueltas (esas tareas no suman XP), así que el reto se puede repartir en varias sesiones o
usarse solo la parte de ACL.

## Contexto educativo

| | |
|---|---|
| **Temas** | Linux · Permisos · ACL · Seguridad · Sistemas |
| **Encaja en** | Cualquier materia o curso en que se administren sistemas o se comparta información entre equipos con distintos niveles de acceso |
| **Punto de partida** | Saber moverse por una terminal (`cd`, `ls`, `cat`); no hace falta haber usado `chmod` nunca |
| **Narrativa** | Continuación de «Operación Escudo Digital»: tras el incidente de red, la auditoría llega al servidor de archivos que instaló una consultora externa |
| **Modalidad** | Presencial, con apoyo del aula virtual. También sirve en línea, de forma autónoma |

El gancho es un problema que se repite en cualquier organización: **la carpeta compartida que
funciona porque está abierta**. La consultora la dejó a 777 «para que no diera problemas», y
funciona: hasta que alguien lee las credenciales de servicio, o borra el trabajo de otro, o se
cierra a lo bruto y el equipo entero se queda fuera.

## Objetivos de aprendizaje

Al terminar el reto, el alumnado debería ser capaz de:

1. **Leer** una salida de `ls -l` e **interpretar** cada carácter: tipo, los tres bloques
   `rwx` (dueño, grupo y resto), la `s` del SGID, la `t` del *sticky* y el `+` que delata una
   ACL.
2. **Traducir** entre notación octal y simbólica (`750` ↔ `rwxr-x---`) y **explicar** qué
   significan `r`, `w` y `x` **en un fichero y en un directorio**, donde `x` es atravesar y
   `r` es listar.
3. **Identificar** al sujeto de los permisos antes que a los permisos: comprobar con `id` y
   `stat` quién es el dueño y cuál es el grupo, y **razonar** por qué dar permisos al grupo no
   sirve de nada si el grupo es `root`.
4. **Aplicar** `chown`, `chgrp` y `chmod` (octal, simbólico y recursivo) para reorganizar una
   carpeta compartida sin cortar el trabajo de nadie.
5. **Explicar y usar** el bit **SGID** (`2770`) y la **umask** para controlar los permisos de
   lo que *todavía no existe*, comprobándolo empíricamente con un fichero de prueba.
6. **Decidir** cuándo los tres bloques clásicos no bastan y **resolverlo con ACL**:
   `getfacl`, `setfacl -m` para un usuario o un grupo, `setfacl -x` para retirar un acceso
   caducado, la **máscara** como techo de lo concedido y `setfacl -d` para la **ACL por
   omisión** de los ficheros futuros.
7. **Evaluar** una petición de acceso aplicando el **principio de mínimo privilegio**:
   distinguir entre «necesita leer» y «necesita escribir», y entre «necesita entrar» y
   «necesita ver qué hay dentro».
8. **Justificar** el orden de las operaciones de un bastionado y **documentar** el estado
   final para quien venga después.

## Cómo funciona

### Las tres pantallas

1. **Portada (encargo)**: el correo urgente de Nayra Suárez, responsable de sistemas,
   explicando qué se ha encontrado en `/srv/proyectos`; el resumen de cómo funciona el juego;
   el **selector de fase inicial** y la **guía rápida de permisos** (cómo se lee `ls -l`,
   `chmod`, dueños y bits especiales, ACL, `umask` y las órdenes de comprobación).
2. **Juego**: la terminal ocupa casi toda la pantalla. Arriba, una barra con el progreso por
   fases, el contador de tareas, el reloj, la XP y el nivel. En el lateral, la **ficha de la
   tarea** en curso (origen, síntomas, objetivo, pistas y recompensa) y el **registro de la
   auditoría** con lo ya resuelto.
3. **Informe del bastionado**: XP, nivel alcanzado, tiempo, pistas usadas, tareas resueltas,
   insignias, la tabla de las 26 tareas **con la orden exacta que resolvió cada una** y la
   lista de decisiones arriesgadas.

### El desarrollo de una partida

Las tareas llegan **de una en una**, como peticiones: casi todas de Nayra (sistemas), algunas
de Carla Ojeda (coordinadora del proyecto) y otras de Dirección. Al completar una, a los pocos
segundos llega la siguiente con un aviso en la terminal y la ficha entrando desde el lateral.

Si algo se resuelve **antes** de que llegue su petición, la ficha aparece igualmente y se
completa sola con un **bonus de proactividad** (+25 XP): el juego premia ir por delante.

Cada ficha ofrece hasta **tres pistas**, cada una a −25 XP. Las dos primeras orientan; **solo
la tercera da la orden literal**.

### Las mecánicas clave

- **Los permisos se aplican de verdad.** Después de cada orden, el sistema recalcula los
  permisos efectivos: leer, escribir, atravesar directorios, crear ficheros… todo pasa por
  ellos. Por eso una tarea mal ordenada se nota enseguida.
- **`sudo` está disponible, pero no eres `root`.** Ana pertenece a `sistemas`, `proyectos` y
  `direccion`, y puede elevar privilegios orden a orden. Sin `sudo`, `chown` responde
  «Operación no permitida» y `chmod` sobre un fichero ajeno también.
- **Comprobar forma parte del trabajo.** Cuatro tareas no cambian nada: miran (`ls -l`,
  `stat`, `id`, `find -perm 777`, `getfacl`). Otras dos piden **verificar empíricamente** lo
  que se acaba de configurar creando un fichero nuevo.
- **Los errores frecuentes se avisan sin resolverse.** Por ejemplo, al poner `chmod 770` en
  vez de `2770` sobre la carpeta, el simulador advierte de que se ha perdido el bit SGID y
  recuerda las dos formas de recuperarlo, pero no lo hace por ti.

## Las 26 tareas

### Fase 1 · Leer permisos

| # | Código | Tarea | Qué se practica |
|---|--------|-------|-----------------|
| 1 | ACL-01 | Mira cómo quedó la carpeta | `ls -l`: tipo, tres bloques `rwx`, dueño y grupo |
| 2 | ACL-02 | Los permisos en números | `stat`: el mismo dato en octal y en simbólico |
| 3 | ACL-03 | ¿Quién eres tú aquí? | `id`: uid, gid y grupos secundarios |
| 4 | ACL-04 | Busca todo lo que está abierto | `find -perm 777`: medir antes de arreglar |
| 5 | ACL-05 | Lo más grave | `cat` de las credenciales: leer lo que no deberías poder leer |

### Fase 2 · Dueños y grupos

| # | Código | Tarea | Qué se practica |
|---|--------|-------|-----------------|
| 6 | ACL-06 | La carpeta es del equipo | `chgrp -R` (o `chown :grupo -R`) y `sudo` |
| 7 | ACL-07 | Y su responsable, Carla | `chown` sobre varios ficheros a la vez |
| 8 | ACL-08 | El problema de los ficheros nuevos | **SGID** con `chmod g+s`: heredar el grupo del directorio |
| 9 | ACL-09 | Compruébalo tú misma | `touch` + `ls -l`: verificar el efecto del SGID |

### Fase 3 · chmod

| # | Código | Tarea | Qué se practica |
|---|--------|-------|-----------------|
| 10 | ACL-10 | Cierra la puerta principal | `chmod 2770`: octal de cuatro cifras, conservar el SGID |
| 11 | ACL-11 | Los documentos del proyecto | `chmod 660`: la `x` no pinta nada en un fichero de texto |
| 12 | ACL-12 | El script sí se ejecuta | `chmod ug+x`: notación simbólica, añadir sin tocar lo demás |
| 13 | ACL-13 | Fuera el resto del mundo | `chmod -R o-rwx`: recursividad sobre todo el árbol |
| 14 | ACL-14 | La carpeta privada, solo para su dueño | `700` y `600`; encadenar órdenes con `&&` |

### Fase 4 · ACL

| # | Código | Tarea | Qué se practica |
|---|--------|-------|-----------------|
| 15 | ACL-15 | Ventas necesita el presupuesto | `getfacl`: `user::`, `group::` y `other::` como ACL |
| 16 | ACL-16 | Solo lectura para ventas | `setfacl -m g:ventas:r`: un segundo grupo, que `chmod` no puede expresar |
| 17 | ACL-17 | Comprueba que la ACL está puesta | `getfacl` y el `+` de `ls -l` |
| 18 | ACL-18 | Darío solo necesita el acta | `setfacl -m u:dario:r`: ACL de usuario y mínimo privilegio |
| 19 | ACL-19 | Darío también necesita entrar | `setfacl -m u:dario:x` sobre el directorio: `x` atraviesa, `r` lista |
| 20 | ACL-20 | Se acabó el contrato | `setfacl -x u:bruno`: retirar un acceso caducado |

### Fase 5 · Ficheros nuevos

| # | Código | Tarea | Qué se practica |
|---|--------|-------|-----------------|
| 21 | ACL-21 | Lo que se cree mañana | `setfacl -d -m g:proyectos:rwx`: **ACL por omisión** |
| 22 | ACL-22 | Compruébalo con un fichero nuevo | `touch` + `getfacl`: la herencia, vista funcionando |
| 23 | ACL-23 | La máscara de creación | `umask`: qué se **resta** a `666` y a `777` |
| 24 | ACL-24 | Que no se escape nada al resto | `umask 007`: ficheros nuevos a `660`, directorios a `770` |
| 25 | ACL-25 | Informe final del bastionado | `find -perm 777` otra vez: medir el resultado |
| 26 | ACL-26 | Deja constancia | `ls -l > permisos.txt`: redirección y documentación |

Resolver las 26 sin pistas y sin decisiones arriesgadas suma **3.800 XP** (más los bonus de
proactividad), suficiente para llegar al nivel 4.

## Órdenes disponibles

| Tipo | Órdenes |
|---|---|
| Mirar | `ls [-l] [-a] [-d] [-R] [-h] [-1] [-F]`, `stat`, `file`, `tree`, `id`, `groups`, `whoami`, `find` (`-name`, `-type`, `-user`, `-group`, `-perm`, `-maxdepth`), `grep [-i] [-n] [-v] [-r] [-l] [-c] [-w]`, `wc [-l] [-w] [-c]` |
| Permisos clásicos | `chmod [-R] [-v]` (octal de 3 o 4 cifras y simbólico `ugoa` `+-=` `rwxXst`), `chown [-R] [-v]` (`usuario`, `usuario:grupo`, `:grupo`), `chgrp [-R]`, `umask [valor]` |
| Listas de control de acceso | `getfacl [-R]`, `setfacl -m` (`u:`, `g:`, `m:`, `o:`), `setfacl -x`, `setfacl -d -m` (ACL por omisión), `setfacl -k`, `setfacl -b`, `setfacl -R` |
| Ficheros y navegación | `cd`, `pwd`, `cat`, `less`/`more`, `head [-n]`, `tail [-n]`, `touch`, `mkdir [-p] [-m]`, `rmdir`, `cp [-r] [-p]`, `mv`, `rm [-r] [-f]`, `echo`, `nano` |
| Privilegios | `sudo <orden>` (eleva solo esa orden) |
| Ayuda y entorno | `man <orden>` (31 páginas de manual en español), `help`, `history`, `which`, `date`, `clear` |
| Composición | Encadenado con `&&`, `\|\|` y `;`; tuberías con `\| grep`, `\| head`, `\| tail`, `\| wc`, `\| sort`, `\| uniq`, `\| nl`; redirecciones `>` y `>>`; comodines (`*.txt`); comillas simples y dobles |

Atajos: <kbd>↑</kbd>/<kbd>↓</kbd> historial, <kbd>Tab</kbd> autocompletar (órdenes y rutas),
<kbd>Ctrl</kbd>+<kbd>L</kbd> limpiar la pantalla, <kbd>Ctrl</kbd>+<kbd>C</kbd> cancelar la
línea. En `nano`: <kbd>Ctrl</kbd>+<kbd>O</kbd> guardar, <kbd>Ctrl</kbd>+<kbd>X</kbd> salir,
<kbd>Ctrl</kbd>+<kbd>K</kbd> cortar línea, <kbd>Ctrl</kbd>+<kbd>U</kbd> pegar (también hay
botones).

## Cómo se diseñó

### Primero el dueño y el grupo, después los permisos

Es la decisión de diseño que ordena el reto entero, y va deliberadamente **en contra del orden
en que se suele enseñar** (`chmod` primero, porque es lo más vistoso). Las fases son: *leer* →
*dueños y grupos* → *chmod* → *ACL* → *ficheros nuevos*.

El motivo es que el orden inverso **no funciona**, y en el simulador se puede comprobar: si se
hace `chmod -R 770 /srv/proyectos` cuando la carpeta todavía pertenece a `root:root`, el
resultado es una carpeta cerrada cuyo grupo no contiene a nadie del equipo. Nadie entra: ni
Carla, ni Ana, ni quien está administrando. Para arreglarlo hace falta `sudo`, y en un servidor
real ese paso en falso significa media plantilla parada.

Así que la fase 2 obliga a hacerse primero la pregunta correcta —**¿de quién es esto y quién
tiene que trabajar aquí?**— y solo después la fase 3 reparte permisos. Los textos de las
fichas lo dicen con todas las letras («de nada sirve dar permisos al grupo si el grupo de la
carpeta es `root`»), porque el objetivo no es que el alumnado caiga en la trampa, sino que
interiorice el orden: **sujeto, luego permiso**.

La misma lógica se repite en pequeño dentro de cada fase: antes de tocar, mirar (`ls -l`,
`stat`, `getfacl`); después de tocar, comprobar (`touch` + `ls -l`, `touch` + `getfacl`,
`find -perm 777`).

### Otros principios que guiaron las decisiones

- **El simulador no enseña cosas falsas.** El sistema de ficheros implementa permisos POSIX
  reales: `chmod 770` sobre un directorio con SGID **pierde** el bit (por eso hay que escribir
  `2770`); en un directorio, `x` permite atravesar y `r` permite listar, y son independientes;
  una ACL de usuario gana a la del grupo, y la **máscara** recorta lo que cualquier entrada
  concede; `getfacl` marca con `#effective:` lo que la máscara deja fuera; una ACL por omisión
  solo afecta a lo que se cree **después**; `chown` exige ser `root`; `umask` resta sobre `666`
  para ficheros y `777` para directorios. Si alguien repite estas órdenes en una máquina real,
  verá lo mismo.
- **Hacer visible lo invisible.** Dos tareas (ACL-09 y ACL-22) no configuran nada: crean un
  fichero y miran qué le pasa. Es la única forma de que «el SGID hace que se herede el grupo»
  y «la ACL por omisión se aplica a lo nuevo» dejen de ser frases que se memorizan.
- **Mínimo privilegio como mecánica, no como consejo.** El escenario está construido para que
  siempre haya una respuesta cómoda y otra correcta: meter a Bruno en `proyectos` sería más
  fácil que ponerle una ACL de lectura; darle `r` a Darío sobre la carpeta sería más fácil que
  darle solo `x`. El juego permite las dos y **penaliza la cómoda**, explicando por qué.
- **Las decisiones tienen consecuencias.** Ampliar los permisos de «otros» sobre cualquier
  cosa, dar escritura a ventas sobre el presupuesto, dar a Darío lectura de toda la carpeta,
  abrir las credenciales a quien no las necesita o **borrar** el fichero de credenciales en vez
  de protegerlo: todo está permitido, cuesta 50 XP (una sola vez por tipo) y queda escrito en
  el informe final. El objetivo es desarrollar criterio, no impedir errores.
- **Las fichas describen síntomas y objetivos, nunca la solución.** «Cuando creo un fichero
  aquí, se queda con MI grupo y mis compañeros no pueden tocarlo» es un síntoma; la orden
  `chmod g+s` solo aparece en la tercera pista. La guía de permisos de la portada explica los
  conceptos sin decir qué hacer en la tarea en curso.
- **Los mensajes de error orientan sin resolver.** «Operación no permitida» invita a pensar en
  `sudo`; «Permiso denegado» al intentar entrar en una carpeta sin `x` es exactamente la
  lección de la tarea; el aviso del SGID perdido señala el problema y da dos caminos.

### Evolución respecto a los retos anteriores

| | *Blindaje de la Red* | *Versionando con Git* | *Permisos y ACL en Linux* |
|---|---|---|---|
| Reto | 7 misiones, 10-20 min | 30 misiones en 5 fases, 45-70 min | 26 tareas en 5 fases, 25-40 min |
| Modelo simulado | Puertos, servicios y procesos | Objetos, ramas y remoto de Git | Sistema de ficheros con permisos POSIX, SGID, *sticky* y ACL |
| Código propio del reto | Comandos + misiones | Simulador de Git completo | **Solo datos**: escenario, tareas y textos |
| Progreso | Indicadores de alerta | Progreso por fases + selector | Progreso por fases + selector |
| Decisiones arriesgadas | Tumbar un servicio necesario | `push --force`, secretos en commits | Conceder más permisos de los pedidos |

El salto de este reto es de **arquitectura**: todo lo que hace falta para simular una consola
Linux con permisos vive ya en `shared/` (sistema de ficheros, modelo de usuarios y grupos,
órdenes POSIX y arranque común), así que el reto se define con tres ficheros de datos y una
tabla de comprobaciones. La consecuencia práctica es que crear un reto hermano —o cambiar el
escenario de este— es cuestión de editar datos, no de escribir un simulador.

## Elementos de gamificación

Relación con los **12 componentes** vistos en el curso *La gamificación educativa* (solo se
usan los que encajan):

| Componente | ¿Se usa? | Cómo | Por qué |
|---|---|---|---|
| **Misiones** | ✅ | 26 tareas encadenadas (ACL-01…ACL-26) agrupadas en 5 fases | Se habla de peticiones y de auditoría, nunca de ejercicios |
| **Sorpresa** | ✅ | Las peticiones llegan sin avisar y cambian el plan: Ventas quiere el presupuesto, Dirección quiere que entre Darío, la consultora conserva una ACL olvidada | Reproduce cómo llegan de verdad las peticiones de acceso |
| **Desbloqueo de contenido** | ✅ | Cada ficha se revela al completar la anterior | Hay que avanzar para descubrir qué se pide después |
| **Puntos (XP)** | ✅ | 75-175 XP por tarea, −25 por pista, −50 por decisión arriesgada, +25 por adelantarse | *Feedback* inmediato; las pistas cuestan, pero nunca bloquean |
| **Niveles** | ✅ | Lee los permisos → Maneja chmod → Reparte por grupos → Domina las ACL | Los nombres describen una competencia creciente, no un rango militar |
| **Insignias** | ✅ | 6 insignias ligadas a buenas prácticas (ver abajo) | Reconocen *cómo* se ha trabajado, no solo terminar |
| **Barra de progreso** | ✅ | Progreso por fases, contador de tareas y registro lateral | Ver el avance anima a seguir, y las fases dan sensación de tramo |
| **Recompensas** | ✅ | Pistas graduadas «compradas» con XP; guía de permisos y `man` siempre disponibles | La ayuda existe, pero hay que decidir si compensa |
| **Tablero de clasificación** | ❌ | — | Deliberadamente no: el informe es individual y se compara en la puesta en común |
| **Cuenta atrás** | ❌ | Reloj que cuenta hacia arriba, sin límite | Con prisa se copia la orden de la pista y no se entiende nada |
| **Avatar** | ❌ | — | No aporta: la identidad que importa es `ana` y sus grupos, y se consulta con `id` |
| **Poder** | ❌ | — | El único «poder» es `sudo`, y forma parte del contenido, no de la gamificación |

**Insignias**: 🛡️ *Sin agujeros* (ninguna decisión arriesgada), 🧠 *Autosuficiente* (sin
pistas), 📚 *Lee el manual* (consultar al menos una página de `man`), 🎯 *Mínimo privilegio*
(ventas solo lee y Darío solo atraviesa, sin conceder nada de más), 🧬 *Pensando en el futuro*
(dejar una ACL por omisión para el equipo), ⚡ *Buen ritmo* (terminar en menos de 26 minutos).

Las dos últimas son propias de este reto: no se ganan por terminar, sino por **cómo** queda el
servidor, y se calculan leyendo el estado final del sistema de ficheros.

### Perfiles de jugador (Bartle)

- **Explorer**: hay mucho que curiosear que ninguna tarea pide: `tree`, `stat` de cualquier
  cosa, `find -user` y `-group`, `getfacl -R`, el *sticky bit* de `/tmp`, `man` de treinta y
  una órdenes, intentar entrar en `/root`, comprobar qué pasa al quitarse a uno mismo el
  permiso.
- **Achiever**: XP, cuatro niveles, seis insignias y un informe con la orden exacta que
  resolvió cada tarea.
- **Killer**: tiempo final e insignia de ritmo, sin tablero público; los informes se comparan.
- **Socializer**: el trabajo en parejas y la puesta en común, donde casi siempre aparecen dos
  formas válidas de resolver lo mismo (`chgrp` frente a `chown :grupo`, octal frente a
  simbólico).

### Estado de *flow*

La dificultad sube de forma escalonada y cada fase apoya a la siguiente: leer antes de tocar,
dueños antes que permisos, permisos clásicos antes que ACL, y lo existente antes que lo
futuro. Las tareas de comprobación funcionan como **descansos activos** entre las de
configuración, y las pistas graduadas permiten a quien se atasca recuperar el ritmo sin
abandonar. El selector de fase evita el aburrimiento de repetir lo ya dominado y la ansiedad
de empezar por lo difícil.

## Accesibilidad, inclusión y protección de datos

### Accesibilidad

- **Todo se maneja con teclado**, incluido el editor. Con la línea vacía, <kbd>Tab</kbd> sale
  de la terminal al resto de la página, así que el autocompletado no atrapa el foco.
- **Lectores de pantalla**: la salida de la terminal es un `role="log"`; una región
  `role="status"` independiente anuncia solo lo importante (nueva tarea con su objetivo, tarea
  completada, pistas, ascensos de nivel). La barra de fases lleva texto oculto («Fase 3,
  chmod: 2 de 5 tareas») además del indicador visual.
- **Nunca solo color**: los estados combinan color, símbolo y texto (`✓`, `⚠`, `ℹ`), y la
  información de permisos es texto por naturaleza.
- **Contraste alto** sobre fondo oscuro, foco visible y tipografía monoespaciada.
- **Movimiento reducido**: con `prefers-reduced-motion` se quitan las animaciones y se acortan
  las esperas entre tareas.
- **Modales accesibles**: la guía de permisos tiene foco atrapado, cierre con <kbd>Esc</kbd> y
  devolución del foco al botón que la abrió.
- **Adaptable**: por debajo de 900 px el panel lateral se coloca sobre la terminal. Comprobado
  a 400 px de ancho, sin scroll horizontal; en escritorio solo hace scroll la terminal.

### Inclusión

- **Cada cual a su ritmo**: sin tiempo límite; el reloj es informativo y la insignia de ritmo,
  opcional.
- **Ayuda graduada**: tres pistas por tarea (las dos primeras orientan, la tercera resuelve),
  guía de permisos siempre accesible desde la portada y desde el juego, y 31 páginas de `man`
  en español dentro del propio juego.
- **Se puede empezar por cualquier fase**, lo que permite repartir el reto en varias sesiones,
  reforzar solo las ACL o adaptar el punto de partida a cada persona.
- **Sin castigo definitivo**: se puede reiniciar sin penalización y no hay forma de dejar el
  sistema irrecuperable; con `sudo` siempre se puede volver atrás.
- **Tono y lenguaje**: español correcto, mensajes que orientan en lugar de culpar, nombres de
  nivel descriptivos y personajes con papeles profesionales, sin estereotipos.

### Protección de datos y uso responsable

- **No recoge ningún dato personal**: no pide nombre ni correo, y todo el progreso vive en la
  memoria de la pestaña y desaparece al cerrarla.
- **No envía nada a ningún servidor** ni usa cookies ni almacenamiento del navegador.
- **No depende de servicios externos** (ni CDN, ni fuentes web, ni analítica).
- **Es una simulación**: el servidor `srv-datos`, sus usuarios y sus ficheros están dentro de
  la página; ningún sistema real se modifica.
- El contenido del reto es, en sí mismo, una lección de protección de datos: un fichero de
  credenciales legible por todo el sistema y una carpeta compartida a 777 son exactamente el
  tipo de descuido que convierte un incidente menor en una brecha. Buen momento para hablar
  del **principio de mínimo privilegio** y del RGPD.

## Uso en el aula

**Antes**
- Repaso breve del vocabulario: usuario, grupo, propietario, permiso, octal.
- Pregunta de arranque, antes de abrir nada: «¿qué creéis que pasa si cerráis una carpeta
  compartida antes de arreglar a quién pertenece?». Conviene apuntar las respuestas para
  contrastarlas al final de la fase 2.

**Durante**
- Individual o **en parejas** (una persona teclea y la otra consulta la guía y los `man`; se
  cambia de rol en cada fase).
- Sugerencia de reparto: fases 1-3 en una sesión y 4-5 en otra, usando el **selector de fase**
  de la portada.
- El docente circula y pregunta en lugar de resolver: «¿qué significa esa `s`?», «¿por qué
  Darío no llega al acta si tiene permiso de lectura sobre ella?», «¿esto se arregla con
  `chmod` o hace falta una ACL?».
- Insistir en **comprobar después de cada cambio** con `ls -l`, `getfacl` o creando un fichero
  de prueba: es el hábito que se quiere instalar.

**Después**
- **Puesta en común**: ¿quién usó `chgrp` y quién `chown :proyectos`? ¿Octal o simbólico?
  ¿Alguien dio a Darío `r` en vez de `x`, y qué consecuencia tuvo? ¿Por qué no basta con
  arreglar los ficheros que ya existen?
- **Pregunta de cierre**: «un compañero pide acceso a una carpeta. ¿Qué tres preguntas le
  haces antes de tocar nada?».
- **Evidencia para el aula virtual**: captura del informe final, o el contenido de
  `permisos.txt` que genera la última tarea.
- **Ampliación**: repetir el bastionado en una máquina real o en una máquina virtual con los
  mismos comandos y comprobar que se comporta igual; o resolver el reto hermano de
  [permisos NTFS en Windows](../permisos-en-windows/) y comparar los dos modelos.

## Detalles técnicos

HTML semántico, CSS y JavaScript *vanilla* (sin *frameworks*, sin dependencias, sin *build* y
sin módulos ES, para que funcione también con `file://`). El reto **no tiene simulador propio**:
todo lo aporta la biblioteca [`shared/`](../shared/) (espacio de nombres `RG`), y el reto se
limita a los datos del escenario, las tareas y sus comprobaciones.

| Fichero | Contenido |
|---|---|
| `index.html` | Solo el marcado de las tres pantallas, el editor y la guía rápida de permisos |
| `css/reto.css` | Lo específico del reto: ancho del panel, color del aviso y etiquetas de la guía |
| `data/config.js` | El escenario: usuarios, grupos, pertenencias y el árbol de `/srv/proyectos` con sus permisos iniciales |
| `data/gamification.js` | Fases, niveles, insignias y valores de XP (coste de pista, penalización, bonus, tiempo de la insignia de ritmo) |
| `data/missions.js` | El contenido de las 26 tareas (título, texto, objetivo y tres pistas), sin lógica |
| `js/missions.js` | La comprobación (`check`) y la solución (`solution`) de cada tarea, los avisos (`react`) y la vigilancia global (`watch`) |
| `js/main.js` | Llama a `RG.Sandbox` con todo lo anterior: órdenes, manuales, textos de la interfaz, insignias calculadas e informe final |

De la biblioteca compartida, las piezas que sostienen este reto son:

- **`shared/js/vfs.js`** — el sistema de ficheros virtual. Implementa permisos POSIX de
  verdad: `modeString()` dibuja `drwxrws---` con la `s` del SUID/SGID y la `t` del *sticky*;
  `parseMode()` entiende el octal de tres y cuatro cifras y el simbólico completo
  (`ugoa` · `+-=` · `rwxXst`); `effective()` calcula los permisos de un usuario sobre un nodo
  aplicando la precedencia real (dueño → ACL de usuario → grupo propietario y ACL de grupo →
  otros) y recortando con la **máscara**; `canReach()` comprueba la `x` de cada directorio del
  camino; y `applyDefaults()` es la herencia: el grupo del directorio si tiene **SGID** y una
  copia de su **ACL por omisión** para lo que se cree dentro.
- **`shared/js/cmd-posix.js`** — las órdenes. Todas consultan permisos antes de actuar y
  fallan con el mensaje real de la orden (`Permiso denegado`, `Operación no permitida`), y
  todas emiten un evento (`{type:"chmod", path, mode, before}`, `{type:"setfacl", kind, name,
  perms, isDefault}`…) que es lo que leen las comprobaciones de las tareas. `getfacl` genera la
  salida completa, con el bloque `default:` y las marcas `#effective:`.
- **`shared/js/sandbox.js`** — el arranque común: monta terminal, intérprete, editor, modelo de
  usuarios, motor de misiones, barra de fases, secuencia de encendido, selector de fase e
  informe final. También es quien **prepara una fase**: ejecuta en silencio la `solution` de
  todas las tareas anteriores y pone la XP a cero.

Claves del diseño:

- **Contenido separado de la lógica**: los textos viven en `data/missions.js` (editables por el
  profesorado sin tocar código) y las comprobaciones en `js/missions.js`, emparejados por
  posición mediante el código `ACL-xx`.
- **Comprobaciones de dos tipos**: unas leen el **estado** del sistema de ficheros (`¿el modo
  de la carpeta es 770?`, `¿existe la entrada ACL de ventas?`) y otras esperan un **evento**
  concreto (`ls -l`, `stat`, `getfacl`, `find -perm 777` sin resultados). Las primeras hacen
  que cualquier camino válido sirva; las segundas son las tareas de observación, que exigen
  mirar de verdad.
- **Añadir o cambiar una tarea**: editar `data/missions.js` (y `data/gamification.js` si se
  añade una fase) y escribir su `check` y su `solution` en `js/missions.js`. Toda la interfaz
  —progreso, ficha, registro, informe— se genera a partir de esos datos.

## Verificación

Se ha probado en **Chrome real en modo *headless***, manejado por el protocolo DevTools (CDP)
desde Node.js, con un guion que simula a una persona jugando: **42 comprobaciones, todas
superadas y sin ningún error de JavaScript**. Se ejecuta con:

```bash
node .claude/skills/verificar-reto/scripts/run.mjs test-permisos-linux
```

Cubre:

- la **partida completa**, resolviendo las 26 tareas con las órdenes que propone cada ficha y
  esperando a que el juego dé cada una por completada;
- el **estado inicial**: la carpeta empieza en `rwxrwxrwx` y perteneciendo a `root`;
- que **el sistema de permisos funciona de verdad** al terminar: la carpeta queda en
  `drwxrws---` (770 con SGID); `getfacl` muestra `group:ventas:r--` y
  `default:group:proyectos:rwx`; un fichero creado después hereda la ACL por omisión **y** el
  grupo por el SGID; las credenciales ya responden `Permiso denegado`; y sin `sudo` no se
  pueden cambiar los permisos de un fichero ajeno;
- el **informe final**: más de 3.000 XP, 26 filas en la tabla, ninguna decisión arriesgada y al
  menos 5 insignias conseguidas sin usar pistas;
- **empezar por una fase** (la 4): que los permisos de las fases anteriores están puestos y que
  las tareas preparadas no suman XP;
- la **portada**: que ofrece las 5 fases.

Como el reto se apoya entero en `shared/`, cualquier cambio en la biblioteca obliga a pasar
también las pruebas de los demás retos (`run.mjs` sin argumentos las ejecuta todas).

## Limitaciones conocidas

- **No hay administración de usuarios**: `useradd`, `groupadd`, `usermod` y compañía están
  desactivados en este reto. Los usuarios y los grupos vienen dados por el escenario; quien
  quiera trabajarlos tiene un reto hermano dedicado a ello.
- **No se cambia de usuario**: no hay `su` ni inicio de sesión como Carla o Darío, así que el
  efecto de los permisos sobre los demás se razona y se comprueba con `getfacl`, no se vive en
  primera persona. `sudo` sí eleva privilegios orden a orden.
- **Algunas comprobaciones exigen permisos exactos**, no equivalentes: por ejemplo, la tarea de
  ventas se da por buena con `g:ventas:r` y no con `g:ventas:rw` (que además cuenta como
  decisión arriesgada, a propósito). Es una restricción pedagógica, pero puede sorprender a
  quien concede de más «por si acaso».
- **No hay enlaces simbólicos, ni cuotas, ni atributos extendidos** más allá de las ACL, ni
  `SELinux`/`AppArmor`, ni `chattr`.
- El intérprete **no es un shell real**: no hay variables, sustitución de órdenes, `2>` ni
  ejecución en segundo plano.
- `find` admite `-name`, `-type`, `-user`, `-group`, `-perm` y `-maxdepth`, pero **no**
  `-exec`, ni los modos `-perm -220` o `/220` (solo la coincidencia exacta).
- El **progreso no se guarda**: al recargar se empieza de cero (intencionado, para no almacenar
  datos). El selector de fase permite retomar el reto donde se dejó.

## Archivos

| Archivo | Contenido |
|---|---|
| [`index.html`](index.html) | Marcado de las tres pantallas, el editor y la guía rápida de permisos |
| [`css/`](css/) · [`data/`](data/) · [`js/`](js/) | Estilos propios · escenario, gamificación y textos de las tareas · comprobaciones y arranque |
| [`../shared/`](../shared/) | Biblioteca común: sistema de ficheros con permisos y ACL, órdenes POSIX, terminal, intérprete, editor, manuales, modales y motor de misiones |
| [`README.md`](README.md) | Este documento |

## Créditos

Made with 💖 by [@fvarrui](https://github.com/fvarrui) & [Claude](https://claude.ai).

Diseñado como reto digital de elaboración propia para el curso *La gamificación educativa*,
dentro de la propuesta «Operación Escudo Digital».
