# Terminal implacable

> Tu primer día delante de una terminal, sin ratón y sin miedo.
> Reto digital de elaboración propia, dentro de la experiencia «Operación Escudo Digital»
> de la empresa ficticia TecnoAtlántica.

---

## Índice

1. [Qué es](#qué-es)
2. [Cómo abrirlo](#cómo-abrirlo)
3. [Contexto educativo](#contexto-educativo)
4. [Objetivos de aprendizaje](#objetivos-de-aprendizaje)
5. [Cómo funciona](#cómo-funciona)
6. [Las 27 tareas](#las-27-tareas)
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

*Terminal implacable* es un juego educativo que se ejecuta en el navegador y está pensado
para quien **nunca ha escrito una orden en una consola**. El alumnado es la nueva
incorporación de la empresa ficticia **TecnoAtlántica** y pasa su primer día en
`srv-practicas`, un servidor de pruebas sin escritorio: solo hay una terminal parpadeando y
una carpeta personal, `/home/hamilton`, que hay que aprender a recorrer.

Las tareas llegan **de una en una**, firmadas por dos personas del equipo: **Sigourney Weaver**
(administración de sistemas), que enseña lo básico, e **Arnold Schwarzenegger** (soporte), que aparece
cuando hay que buscar algo con prisa. Son **27 tareas repartidas en 5 fases**, y van desde
«¿dónde estoy?» hasta encadenar órdenes con tuberías y guardar el resultado en un fichero.

No hay botones que hagan el trabajo ni respuestas de opción múltiple: se escriben **órdenes
reales de bash** (`pwd`, `ls`, `cd`, `tree`, `cat`, `head`, `tail`, `wc`, `grep`, `find`,
`mkdir`, `cp`, `mv`, `rm`, `echo`, `nano`, `man`…) sobre un sistema de ficheros simulado con
**permisos POSIX de verdad**, y los mensajes de error son los que devolvería una máquina
real. Lo que se aprende aquí se puede repetir esa misma tarde en un Ubuntu y funciona igual.

Funciona sin conexión a Internet, sin instalar nada y sin servidor.

## Cómo abrirlo

- **En local**: doble clic en [`index.html`](index.html). Funciona en cualquier navegador
  moderno (Chrome, Edge, Firefox, Safari).
- **En el aula virtual (EVAGD/Moodle)**: subir la carpeta completa del reto **junto con la
  carpeta [`shared/`](../shared/)** (por ejemplo, en un ZIP con las dos) y enlazar
  `terminal-implacable/index.html`. El reto usa CSS y scripts clásicos, sin módulos ES ni
  `fetch`, así que también funciona desde el sistema de ficheros.
- **En la web**: publicar el repositorio con GitHub Pages o cualquier alojamiento estático.
  No necesita *backend*.

Una partida completa dura entre **20 y 35 minutos**. Desde la portada se puede **empezar en
cualquiera de las 5 fases**: el sistema se prepara automáticamente con las fases anteriores
ya resueltas (esas tareas no suman XP), de modo que el reto se puede repartir en varias
sesiones o usar solo la parte que interese.

## Contexto educativo

| | |
|---|---|
| **Temas** | Linux · Consola · Ficheros · Sistemas |
| **Encaja en** | Cualquier materia o curso en que haya que trabajar con una consola: administración de sistemas, programación, redes, ciencia de datos o el primer contacto con un servidor |
| **Punto de partida** | Ninguno. No hace falta haber usado nunca una terminal ni conocer Linux |
| **Narrativa** | Primer día de prácticas en TecnoAtlántica: te dan una cuenta en `srv-practicas` y el equipo te va mandando tareas por mensaje |
| **Modalidad** | Presencial, con apoyo del aula virtual. También sirve en línea, de forma autónoma |

Es el reto **de entrada** de la colección: prepara el terreno para los que vienen después
([*Blindaje de la Red*](../blindaje-de-la-red/), [*Versionando con
Git*](../punto-de-retorno/) y los de permisos, usuarios o servicios), que dan por sabido
moverse por una terminal. Tiene un gemelo para el otro mundo,
[*La jungla de objetos*](../la-jungla-de-objetos/), con las mismas 27 tareas
resueltas con *cmdlets*: se pueden hacer los dos y comparar.

El escenario está elegido para quitar miedo: **todo lo que hay en el servidor es una copia**,
y el propio mensaje de bienvenida lo dice. Esa es la condición para que alguien se atreva a
escribir `rm`.

## Objetivos de aprendizaje

Al terminar el reto, el alumnado debería ser capaz de:

1. **Identificar** los elementos de una sesión de consola: el indicador (*prompt*), el
   usuario, el equipo, el directorio actual y la diferencia entre una orden, sus opciones y
   sus argumentos.
2. **Orientarse** en el árbol de directorios: saber dónde está (`pwd`), qué hay (`ls`, `ls -l`,
   `ls -la`, `tree`) y moverse con rutas absolutas y relativas (`cd`, `..`, `~`).
3. **Consultar ficheros sin modificarlos**, eligiendo la herramienta adecuada al tamaño y a
   la pregunta: `cat` para el fichero entero, `head`/`tail` para asomarse, `wc -l` para
   contar, `file` y `stat` para saber qué es y de quién.
4. **Crear y organizar** su propio espacio de trabajo con `mkdir`, `touch`, `cp`, `mv`, `nano`
   y las redirecciones `>` y `>>`, distinguiendo cuándo una redirección **añade** y cuándo
   **machaca** lo que había.
5. **Aplicar** las órdenes de búsqueda con criterio: `find` busca ficheros **por su nombre**
   y `grep` busca texto **dentro** de los ficheros; combinarlas con opciones (`-n`, `-i`,
   `-r`) para acotar el resultado.
6. **Componer** soluciones encadenando órdenes con tuberías (`|`) y redirecciones, entendiendo
   que la salida de una orden es la entrada de la siguiente: la idea que convierte la consola
   en una herramienta y no en una lista de recetas.
7. **Valorar** las consecuencias de sus actos en un sistema compartido: que `rm` no tiene
   papelera, que hay ficheros ajenos que no se pueden leer y que el manual (`man`) está
   instalado en la propia máquina para no depender de la memoria.

## Cómo funciona

### Las tres pantallas

1. **Portada**: mensaje de bienvenida de Sigourney, explicación breve del juego, **selector de
   fase inicial**, datos del equipo (`srv-practicas`, usuario `hamilton`, `/home/hamilton`,
   Ubuntu 24.04 LTS) y acceso a la guía rápida de órdenes.
2. **Juego**: la terminal ocupa casi toda la pantalla, con su barra de título imitando una
   ventana real. Arriba, una barra con el progreso por fases, el contador de tareas, el reloj,
   la XP y el nivel. En el lateral, la **ficha de la tarea actual** y el **registro de la
   jornada**.
3. **Informe de la jornada**: XP, nivel alcanzado, tiempo, pistas usadas, tareas resueltas,
   insignias, la tabla de las 27 tareas con la orden exacta que resolvió cada una y la lista
   de decisiones arriesgadas.

### El desarrollo de una partida

La sesión arranca con una secuencia de inicio (versión de Ubuntu, último acceso, aviso de que
nada es de producción) y, a los pocos segundos, llega la primera tarea como **mensaje del
equipo** en la terminal, mientras la ficha entra por el lateral.

Cada ficha tiene tres partes: el **contexto** (por qué hace falta), el **objetivo** (qué hay
que conseguir, nunca la orden literal) y un botón de **pista**. Hay **tres pistas por tarea**,
cada vez más concretas: la primera orienta («la orden son tres letras y significa *print
working directory*»), la segunda explica la opción que hace falta, y solo la tercera da la
orden escrita. Cada pista cuesta **20 XP** de la recompensa de esa tarea.

Al resolverla, la terminal lo confirma, se suma la XP y a los pocos segundos llega la
siguiente. Si algo se resuelve **antes** de que llegue su tarea (pasa a menudo con `ls -l`
o con `cd ..`), la tarea aparece igualmente y se completa sola, con **+20 XP de bonificación
por ir por delante**.

### Las mecánicas clave

- **Comprobación por estado o por evento.** Unas tareas miran el **sistema de ficheros**
  (¿existe ya `tareas/entregas`?, ¿tiene `parte.txt` dos líneas?, ¿ha desaparecido el `.bak`?)
  y otras miran el **evento** que emite cada orden (¿se ha ejecutado un `ls` largo?, ¿un
  `head` de 3 líneas sobre `acceso.log`?). Por eso casi todas admiten **varios caminos**: da
  igual llegar con ruta relativa o absoluta, con `nano` o con `echo >`, con `grep -r` o con
  `grep ERROR registros/*.log`.
- **Se puede romper.** No hay bloqueos: se puede borrar el informe de red, las notas del
  equipo o el registro de accesos. Si se borra algo que hacía falta, el juego lo anota como
  **decisión arriesgada** (−40 XP, una sola vez por fichero) y aparece con nombre y apellido
  en el informe final.
- **Los permisos son de verdad.** El sistema simulado tiene usuarios, grupos y modos POSIX:
  `/home/weaver` es `750` y no deja entrar, `/root` es `700` y responde «Permiso denegado», y
  `sudo` contesta lo mismo que una máquina real cuando no estás en el fichero *sudoers*.
- **El reloj cuenta hacia arriba**, sin límite de tiempo.

## Las 27 tareas

### Fase 1 · Orientación

*Dónde estás y qué hay a tu alrededor.*

| # | Código | Tarea | Qué se practica |
|---|--------|-------|-----------------|
| 1 | LNX-01 | ¿Dónde estás? | `pwd` y el concepto de directorio actual |
| 2 | LNX-02 | Mira a tu alrededor | `ls` sin argumentos |
| 3 | LNX-03 | Con detalle | `ls -l`: permisos, dueño, tamaño y fecha |
| 4 | LNX-04 | Lo que no se ve | `ls -la`, ficheros ocultos y opciones agrupadas |
| 5 | LNX-05 | Entra en documentos | `cd` con ruta relativa |
| 6 | LNX-06 | Vuelve sobre tus pasos | `cd ..`, `cd ~`, las entradas `.` y `..` |
| 7 | LNX-07 | El mapa completo | `tree`: ver el árbol entero de un vistazo |

### Fase 2 · Leer sin miedo

*Ver el contenido de los ficheros sin modificarlos.*

| # | Código | Tarea | Qué se practica |
|---|--------|-------|-----------------|
| 8 | LNX-08 | Lee la bienvenida | `cat` sobre un fichero de texto |
| 9 | LNX-09 | Solo el principio | `head -n 3`: asomarse a un registro largo |
| 10 | LNX-10 | Lo último que pasó | `tail -n 3`: lo reciente está al final |
| 11 | LNX-11 | ¿Cuánto hay aquí? | `wc -l` para contar líneas |
| 12 | LNX-12 | Busca los fallos | `grep PATRÓN FICHERO` sobre el registro de accesos |
| 13 | LNX-13 | ¿Y esto qué es? | `file`: en Linux la extensión no decide el tipo |

### Fase 3 · Crear y ordenar

*Carpetas, copias, movimientos y borrados.*

| # | Código | Tarea | Qué se practica |
|---|--------|-------|-----------------|
| 14 | LNX-14 | Prepara las entregas | `mkdir` con ruta relativa |
| 15 | LNX-15 | Una copia de seguridad a mano | `cp origen destino` antes de tocar nada |
| 16 | LNX-16 | Escribe tu parte | `nano` o `echo "…" > fichero` |
| 17 | LNX-17 | Añade sin borrar | `>>` frente a `>`: añadir o machacar |
| 18 | LNX-18 | Cada cosa en su sitio | `mv` a una carpeta existente |
| 19 | LNX-19 | Limpia lo que sobra | `rm` con puntería: no hay papelera |

### Fase 4 · Buscar y filtrar

*Encontrar cosas y encadenar órdenes con tuberías.*

| # | Código | Tarea | Qué se practica |
|---|--------|-------|-----------------|
| 20 | LNX-20 | ¿Dónde está ese fichero? | `find . -name`: buscar **por nombre** |
| 21 | LNX-21 | Errores en todos los registros | `grep -r` o `grep` con comodines sobre varios ficheros |
| 22 | LNX-22 | Enchufa una orden a otra | la tubería: `grep … \| wc -l` |
| 23 | LNX-23 | Deja el resultado por escrito | tubería **y** redirección en la misma línea |

### Fase 5 · Conocer el sistema

*Identidad, ayuda y cierre de la jornada.*

| # | Código | Tarea | Qué se practica |
|---|--------|-------|-----------------|
| 24 | LNX-24 | ¿Quién eres aquí? | `whoami` y por qué importa la cuenta |
| 25 | LNX-25 | Tus grupos | `id` y `groups`: usuario, uid, gid y grupos |
| 26 | LNX-26 | Pregunta al manual | `man ls` y las secciones de una página de manual |
| 27 | LNX-27 | Repasa la jornada | `history` y las flechas ↑ ↓ |

La numeración `LNX-01`…`LNX-27` se genera por posición, así que reordenar el contenido
reordena también los códigos.

## Órdenes disponibles

| Tipo | Órdenes |
|---|---|
| Moverse | `pwd`, `ls [-l] [-a] [-h] [-R]`, `cd` (`..`, `~`, sin argumentos, rutas absolutas y relativas), `tree` |
| Leer | `cat`, `less` / `more`, `head [-n N]`, `tail [-n N]`, `wc [-l] [-w] [-c]`, `file`, `stat` |
| Buscar | `grep [-i] [-n] [-v] [-c] [-r]` (con varios ficheros y comodines), `find <ruta> -name -type -user -perm` |
| Crear y organizar | `mkdir [-p] [-v]`, `rmdir`, `touch`, `cp [-r] [-v]`, `mv`, `rm [-r] [-f] [-v]`, `echo`, `nano` (también `vi`/`vim`) |
| Identidad y sistema | `whoami`, `id`, `groups`, `date`, `which`, `history`, `clear`, `sudo` (responde que no estás en *sudoers*) |
| Permisos | `chmod`, `chown`, `chgrp`, `umask`, `getfacl`, `setfacl` (no los pide ninguna tarea; están para quien quiera explorar) |
| Ayuda | `help` (lista de órdenes por grupos), `man <orden>` con página completa de 30 órdenes |
| Composición | Tuberías (`\| grep`, `\| head`, `\| tail`, `\| wc`, `\| sort`, `\| uniq`), redirecciones `>` y `>>`, encadenado con `&&`, `\|\|` y `;`, comodines (`*.log`), comillas simples y dobles |

Atajos de teclado: <kbd>↑</kbd>/<kbd>↓</kbd> historial, <kbd>Tab</kbd> autocompletar (órdenes,
rutas y ficheros), <kbd>Ctrl</kbd>+<kbd>L</kbd> limpiar la pantalla,
<kbd>Ctrl</kbd>+<kbd>C</kbd> cancelar la línea. Con la línea vacía, <kbd>Tab</kbd> **sale de
la terminal** al resto de la página.
En `nano`: <kbd>Ctrl</kbd>+<kbd>O</kbd> guardar, <kbd>Ctrl</kbd>+<kbd>X</kbd> salir,
<kbd>Ctrl</kbd>+<kbd>K</kbd> cortar línea, <kbd>Ctrl</kbd>+<kbd>U</kbd> pegar (también hay
botones, para quien no use atajos).

## Cómo se diseñó

### Primero los aprendizajes, después la narrativa

El punto de partida no fue la historia, sino una lista: lo que hay que saber hacer para no
quedarse bloqueado delante de una consola. De ahí salieron las **cinco fases**, que son cinco
preguntas en orden de dependencia: *¿dónde estoy?* → *¿qué dice esto?* → *¿cómo creo lo mío?*
→ *¿cómo encuentro algo?* → *¿quién soy y dónde está la ayuda?*. Solo después se buscó una
situación que justificara ese orden de forma natural, y el primer día de prácticas encaja sin
forzar nada: nadie te explica el servidor entero de golpe, te van mandando cosas.

### Principios que guiaron las decisiones

- **Una consola de verdad, no un simulador de tres órdenes.** El sistema de ficheros virtual
  tiene propietarios, grupos y modos POSIX; `ls -l` calcula la cadena de permisos a partir del
  modo real; `cat` de un fichero inexistente contesta «No existe el fichero o el directorio» y
  `cd /root` contesta «Permiso denegado». Si alguien repite estas órdenes en un Ubuntu, ve lo
  mismo.
- **Quitar el miedo antes que enseñar la orden.** El primer texto que se lee —tanto en la
  portada como en `bienvenida.txt` dentro del juego— dice que todo es una copia. Sin esa
  autorización explícita, el alumnado novato no escribe `rm` ni `mv`: se queda mirando.
- **El objetivo nunca es la solución.** Las fichas describen **qué hay que conseguir**, no qué
  hay que teclear: «muestra las 3 últimas líneas de `registros/sistema.log`», no «escribe
  `tail -n 3 …`». La orden literal solo aparece en la **tercera** pista. Así se puede llegar
  por caminos distintos, y quien la pida paga por ella.
- **Varias soluciones válidas por tarea.** Las comprobaciones miran el resultado o el evento,
  no la cadena escrita: `ls -la` vale igual que `ls -l -a`; el parte se puede escribir con
  `nano` o redirigiendo con `echo`; los `ERROR` se pueden buscar con `grep -r ERROR registros`
  o con `grep ERROR registros/*.log`.
- **Los errores son contenido, no castigo.** Se permite borrar ficheros importantes. Cuesta
  40 XP, se avisa en el informe con una frase que explica qué se ha perdido («has borrado el
  registro de accesos, que es la prueba de los intentos fallidos») y no impide terminar. El
  objetivo es que la lección de «`rm` no tiene papelera» se aprenda aquí y no en producción.
- **Datos con sentido.** Los ficheros del escenario no son de relleno: el informe de red tiene
  dos averías coherentes con el parte que hay que escribir después, el registro de accesos
  tiene exactamente **3 líneas `WARN`** (el número que la tarea 23 acaba guardando en un
  fichero) y las notas del equipo mencionan el informe que hay que revisar. Cada dato que se
  descubre leyendo sirve para una tarea posterior.

### Evolución del diseño

Este reto nació **después** de [*Blindaje de la Red*](../blindaje-de-la-red/) y
[*Punto de retorno*](../punto-de-retorno/), al comprobar en el aula un problema muy
concreto: **esos dos daban por sabida la terminal**. Quien no sabía qué era una ruta relativa
se atascaba en la primera misión por un motivo que no tenía nada que ver con lo que el reto
quería enseñar.

Lo que se probó y se descartó por el camino:

| Se probó | Por qué no se quedó |
|---|---|
| Una sola fase larga de 27 tareas | Sin hitos intermedios no se ve el avance ni se puede repartir en sesiones; las 5 fases dan puntos de parada naturales |
| Comprobar la cadena escrita (comparar con la solución) | Rechazaba respuestas correctas escritas de otra forma y empujaba a copiar la pista en vez de pensar; ahora se comprueba el **estado del sistema** o el **evento** de la orden |
| Bloquear el borrado de ficheros importantes | Convertía el juego en un carril: si nada se puede romper, no se aprende a tener cuidado. Se sustituyó por permitir, penalizar y **anotarlo en el informe** |
| Dar los objetivos con la orden dentro | Se resolvía copiando, sin leer. La orden bajó a la tercera pista |
| Enseñar `chmod` y los permisos aquí | Demasiado para un primer día, y ya hay un reto entero dedicado a ello. Los permisos **existen** en el sistema simulado (se chocan con ellos en `/root`), pero ninguna tarea los pide |

El cambio técnico más importante fue **extraer el motor a la biblioteca compartida**. Los dos
primeros retos tenían cada uno su propio arranque, su terminal y su motor de misiones
duplicados. Al escribir este se creó [`shared/js/sandbox.js`](../shared/js/sandbox.js)
(`RG.Sandbox`), que monta el sistema simulado, la terminal, el intérprete, el editor, el motor
de tareas, las fases, la secuencia de arranque y el informe final. Este reto **no tiene motor
propio**: solo aporta datos. Esa decisión es la que ha permitido que después existan la
docena de retos de consola del repositorio, y también su gemelo de PowerShell, que reutiliza
las mismas 27 tareas cambiando solo la consola.

## Elementos de gamificación

Relación con los **12 componentes** vistos en el curso *La gamificación educativa* (solo se
usan los que encajan):

| Componente | ¿Se usa? | Cómo | Por qué |
|---|---|---|---|
| **Misiones** | ✅ | 27 tareas encadenadas (LNX-01…LNX-27) agrupadas en 5 fases, firmadas por Sigourney (sistemas) o por Arnold (soporte) | Se habla de «tareas del equipo», nunca de ejercicios: cada encargo tiene remitente y motivo, así que no se hace `wc -l` «para practicar», sino para el parte de incidencias |
| **Desbloqueo de contenido** | ✅ | Cada tarea se revela al completar la anterior | Evita la parálisis de ver 27 cosas pendientes el primer día |
| **Puntos (XP)** | ✅ | 50-150 XP por tarea, −20 por pista, −40 por decisión arriesgada, +20 por adelantarse | *Feedback* inmediato; las pistas cuestan, pero nunca bloquean ni se agotan |
| **Niveles** | ✅ | Primer día (0) → Manos en el teclado (400) → Se defiende en consola (800) → Ya no pregunta dónde está (1200) | Los nombres describen una **competencia**, no un rango militar: se lee el nivel y se sabe qué se sabe hacer |
| **Insignias** | ✅ | 6 insignias ligadas a la forma de trabajar (ver abajo) | Reconocen *cómo* se ha trabajado, no solo haber terminado |
| **Barra de progreso** | ✅ | Progreso por fases (F1 ✓, F2 3/6…), contador «Tarea 12/27» y registro lateral de la jornada | En un reto de iniciación, ver el avance es lo que sostiene el esfuerzo |
| **Recompensas** | ✅ | Pistas «compradas» con XP, guía rápida siempre disponible y `man` dentro del juego | La ayuda existe siempre; lo que se decide es si compensa pagarla |
| **Sorpresa** | ✅ | Muy dosificada: tareas que se completan solas al adelantarse y avisos cuando se borra algo importante | Deliberadamente baja: en un primer contacto, la sorpresa se vive como error propio. La tensión se reserva para los retos siguientes |
| **Tablero de clasificación** | ❌ | — | Deliberadamente no: en un grupo con niveles de partida muy distintos, comparar públicamente desanima justo a quien más necesita empezar |
| **Cuenta atrás** | ❌ | Reloj que cuenta hacia arriba, sin límite | Una cuenta atrás invita a copiar la tercera pista y seguir |
| **Avatar** | ❌ | — | No aporta: la identidad ya está en el indicador (`hamilton@srv-practicas`) y se descubre con `whoami` e `id` |
| **Poder** | ❌ | — | No encaja: precisamente no se administra nada. `sudo` contesta que no estás en *sudoers*, igual que una cuenta real de prácticas |

**Insignias**: 🧯 *Sin sustos* (no borraste nada que hiciera falta), 🧠 *Autosuficiente*
(ninguna pista), 📚 *Lee el manual* (al menos una página de `man`), 🪈 *Fontanería*
(encadenaste órdenes con una tubería), ⚡ *Buen ritmo* (jornada completa en menos de 14
minutos), ↹ *Manos vagas* (usaste el tabulador para autocompletar).

Las dos últimas son intencionadamente «de segunda vuelta»: nadie termina en menos de 14
minutos ni descubre el tabulador la primera vez, y **eso es lo que se busca** —que al ver el
informe quede algo pendiente que invite a repetir, esta vez con soltura.

### Perfiles de jugador (Bartle)

- **Explorer**: hay mucho más sistema del que piden las tareas. `/srv/compartido` tiene una
  chuleta de consola escrita por Sigourney, `/etc/os-release` y `/etc/hostname` se pueden leer,
  `/home/weaver` y `/root` están cerrados a propósito, existen `chmod`, `stat`, `getfacl` y
  `umask` aunque ninguna tarea los pida, y hay páginas de `man` para 30 órdenes.
- **Achiever**: XP, cuatro niveles, seis insignias y un informe final con la orden exacta que
  resolvió cada tarea.
- **Killer**: tiempo final e insignia de rapidez, sin tablero público; se pueden comparar
  informes entre quien quiera.
- **Socializer**: el trabajo por parejas y la puesta en común posterior, que es donde aparecen
  los caminos alternativos («yo lo hice con `nano`», «yo con `echo`»).

### Estado de *flow*

El equilibrio entre reto y destreza se cuida con cuatro palancas:

- **Dificultad escalonada**: las siete primeras tareas se resuelven con órdenes de dos o tres
  letras sin opciones; las opciones llegan en la fase 2, las rutas compuestas en la 3 y la
  composición de órdenes en la 4. Nunca se pide combinar dos ideas nuevas a la vez.
- **Objetivos inequívocos**: cada ficha dice exactamente qué tiene que pasar para darla por
  buena, y la terminal responde al instante.
- **Sin ansiedad**: no hay tiempo límite, no hay forma de perder y las pistas están a un clic.
- **Sin aburrimiento**: en cuanto una mecánica está dominada aparece la siguiente, y la última
  fase introduce la idea potente (tuberías y redirección combinadas) justo cuando ya hay
  soltura suficiente para disfrutarla.

## Accesibilidad, inclusión y protección de datos

### Accesibilidad

- **Todo se maneja con teclado**, incluido el editor. Con la línea vacía, <kbd>Tab</kbd> sale
  de la terminal al resto de la página, así que el autocompletado no atrapa el foco.
- **Lectores de pantalla**: la salida de la terminal es un `role="log"`; una región
  `role="status"` independiente anuncia solo lo importante (nueva tarea con su objetivo, tarea
  completada, pistas, ascensos de nivel, apertura del editor). El progreso por fases lleva
  texto oculto («Fase 2, Leer sin miedo: 3 de 6 tareas»).
- **Nunca solo color**: los estados combinan color, símbolo y texto.
- **Contraste alto** sobre fondo oscuro, foco visible y tipografía monoespaciada.
- **Movimiento reducido**: con `prefers-reduced-motion` se quitan las animaciones y se acortan
  las esperas entre tareas.
- **Editor accesible**: `nano` tiene etiqueta, anuncio al abrirse y botones para quienes no
  usen atajos de teclado.
- **Modales accesibles**: foco atrapado, cierre con <kbd>Esc</kbd> y devolución del foco.
- **Adaptable**: por debajo de 900 px el panel lateral se coloca sobre la terminal. Comprobado
  a 400 px de ancho, sin scroll horizontal.

### Inclusión

- **Sin conocimientos previos**: es el punto de entrada de la colección y no da nada por
  sabido.
- **Cada cual a su ritmo**: sin tiempo límite; el reloj es informativo.
- **Ayuda graduada**: tres pistas por tarea, guía rápida de órdenes siempre disponible desde
  la portada y desde el juego, `help` con las órdenes agrupadas por finalidad y `man` completo
  dentro de la propia consola.
- **Se puede empezar por cualquier fase**, lo que permite repartir el reto en sesiones o
  ajustar el punto de partida de quien ya sabe moverse.
- **Sin castigo definitivo**: se puede reiniciar sin penalización y no hay forma de dejar el
  sistema en un estado sin salida.
- **Tono y lenguaje**: español correcto, mensajes que orientan en lugar de culpar y nombres de
  nivel neutros.

### Protección de datos y uso responsable

- **No recoge ningún dato personal**: no pide nombre, ni correo, ni identificación de ningún
  tipo.
- **No envía nada a ningún servidor** ni usa cookies, `localStorage` ni ningún otro
  almacenamiento del navegador: el progreso vive en memoria y desaparece al cerrar la pestaña.
- **No depende de servicios externos** (ni CDN, ni fuentes web, ni analítica).
- **Es una simulación**: el servidor `srv-practicas`, sus usuarios y sus ficheros están dentro
  de la propia página; no se conecta a ninguna máquina real ni se puede dañar nada.
- Los datos del escenario (personas, direcciones IP, registros) son **ficticios**: buen momento
  para comentar que un registro de accesos real sí contiene datos personales y qué implica eso.

## Uso en el aula

**Antes**

- Situar la escena en dos minutos: qué es un servidor sin escritorio y por qué casi todo lo
  que se administra en el mundo real se administra así.
- Dejar claro, antes de empezar, que **nada se puede romper de verdad**. Es el mensaje que
  desbloquea a quien nunca ha tocado una consola.
- Vocabulario mínimo: ruta, directorio, fichero, orden, opción y argumento.

**Durante**

- Individual o **en parejas** (una persona teclea y la otra consulta la guía y los `man`;
  se cambia de rol en cada fase).
- Sugerencia de reparto: fases 1-3 en una sesión y 4-5 en otra, usando el **selector de fase**
  de la portada para retomar.
- El profesorado circula y pregunta en lugar de resolver: «¿en qué carpeta estás ahora?»,
  «¿cómo lo comprobarías?», «¿qué crees que hará `>` si el fichero ya existe?».
- Insistir en dos hábitos desde el principio: **mirar antes de actuar** (`ls` antes de `rm`) y
  **usar el tabulador** en vez de escribir rutas enteras.

**Después**

- **Puesta en común**: ¿quién escribió el parte con `nano` y quién con `echo`? ¿Qué pasa si en
  la tarea 17 se usa `>` en vez de `>>`? ¿Por qué `find` no sirve para buscar los `ERROR` y
  `grep` no sirve para encontrar `notas.md`?
- **Comparar informes**: XP, tiempo, pistas e insignias. Preguntar quién consiguió *Sin
  sustos* y quién perdió un fichero, y qué se aprende de ello.
- **Evidencia para el aula virtual**: captura del informe de la jornada.
- **Ampliación**: repetir lo mismo en una máquina real o en una máquina virtual con Ubuntu, y
  comprobar que las órdenes se comportan igual; o continuar con *La jungla de objetos*
  para ver las mismas 27 tareas resueltas con objetos en lugar de texto.

## Detalles técnicos

HTML semántico, CSS y JavaScript *vanilla* (sin *frameworks*, sin dependencias, sin *build* y
sin módulos ES, para que funcione también con `file://`). El reto **no tiene motor propio**:
todo el comportamiento viene de la biblioteca [`shared/`](../shared/) (espacio de nombres
`RG`), y estos cinco ficheros son solo datos y comprobaciones.

| Fichero del reto | Contenido |
|---|---|
| `index.html` | Solo el marcado de las tres pantallas, el editor `nano` y la guía rápida de órdenes |
| `css/reto.css` | Los pocos ajustes visuales propios; el resto del estilo viene de `shared/css/` |
| `data/config.js` | El escenario: equipo, cuentas, grupos y el **árbol de ficheros inicial** con sus dueños, modos y contenidos |
| `data/gamification.js` | Las 5 fases, los 4 niveles, las 6 insignias y las constantes de puntuación |
| `data/missions.js` | El contenido de las 27 tareas (título, contexto, objetivo, remitente, XP y 3 pistas), sin lógica |
| `js/missions.js` | La lógica: `check` y `solution` de cada tarea, y la lista de ficheros «que no se deben perder» |
| `js/main.js` | Una sola llamada a `RG.Sandbox({…}).init()` con los datos anteriores, los textos y el informe |

| Módulo compartido | Qué aporta a este reto |
|---|---|
| [`shared/js/sandbox.js`](../shared/js/sandbox.js) | `RG.Sandbox`: monta el sistema, la terminal, el intérprete, el editor, el motor de tareas, las fases, el arranque, el selector de fase y el informe final |
| [`shared/js/vfs.js`](../shared/js/vfs.js) | Sistema de ficheros virtual con dueño, grupo, modo POSIX, ACL, fechas y comprobación de permisos |
| [`shared/js/sysmodel.js`](../shared/js/sysmodel.js) | Usuarios, grupos y procesos del sistema simulado |
| [`shared/js/cmd-posix.js`](../shared/js/cmd-posix.js) | Las órdenes de bash con sus opciones y sus mensajes de error reales |
| [`shared/js/shell.js`](../shared/js/shell.js) | Análisis de la línea: comillas, comodines, `&&`/`\|\|`/`;`, tuberías y redirecciones |
| [`shared/js/terminal.js`](../shared/js/terminal.js) · [`editor.js`](../shared/js/editor.js) · [`man.js`](../shared/js/man.js) · [`modal.js`](../shared/js/modal.js) · [`game.js`](../shared/js/game.js) | Terminal, `nano`, páginas de manual, diálogos accesibles y motor de tareas, XP, pistas e insignias |
| [`shared/data/man-linux.js`](../shared/data/man-linux.js) | El contenido de las páginas de manual |

Claves del diseño:

- **Contenido separado de la lógica**: los textos viven en `data/missions.js` (datos puros,
  editables por el profesorado sin tocar nada más) y las comprobaciones en `js/missions.js`,
  emparejados por posición mediante el código `LNX-xx`.
- **Cada tarea declara `check(evento)` y `solution`**. La `solution` es la secuencia de
  órdenes que la resuelve y tiene dos usos: preparar el sistema cuando se **empieza por una
  fase posterior** (se ejecutan en silencio) y servir de guion a las pruebas automáticas.
- **Órdenes que emiten eventos**: cada orden publica lo que ha hecho (`{type:"ls", long:true,
  path:…}`, `{type:"grep", pattern:…, files:…}`), de modo que las comprobaciones no dependen
  del texto escrito.
- **El estado nunca se sustituye**: al reiniciar se vacía y se vuelve a llenar, porque los
  módulos guardan una referencia a él.
- **Añadir o cambiar una tarea**: editar `data/missions.js` (y `data/gamification.js` si se
  añade una fase) y su `check`/`solution` en `js/missions.js`. Toda la interfaz (progreso,
  ficha, registro, informe) se genera a partir de esos datos.

## Verificación

Se ha probado en **Chrome real en modo *headless***, manejado por el protocolo DevTools (CDP)
desde Node.js, con un guion que simula a una persona jugando: **39 comprobaciones, todas
superadas y sin ningún error de JavaScript**. Se ejecuta con:

```bash
node .claude/skills/verificar-reto/scripts/run.mjs test-terminal-implacable
```

Cubren:

- que la portada ofrece las **5 fases** como punto de partida;
- la **partida completa**: las 27 tareas resueltas una a una con la orden canónica,
  comprobando que cada una se da por completada antes de pasar a la siguiente;
- el **estado final del sistema simulado**: que `tareas/entregas` contiene los tres ficheros
  esperados y que `resumen.txt` guarda el recuento correcto de líneas `WARN` (3);
- los **mensajes reales de bash**: «No existe el fichero o el directorio» al leer un fichero
  inexistente y «Permiso denegado» al intentar entrar en `/root`;
- el **informe final**: más de 2000 XP, las 27 filas de la tabla y al menos 4 insignias
  conseguidas sin pistas, con la lista de decisiones arriesgadas vacía;
- **empezar por una fase posterior**: al arrancar en la fase 4, las tareas anteriores están
  preparadas en el sistema de ficheros y **no suman XP**.

El mismo guion se ejecuta junto con el de los demás retos (`node
.claude/skills/verificar-reto/scripts/run.mjs`, sin argumentos) cada vez que se toca la
biblioteca [`shared/`](../shared/), porque un cambio ahí afecta a todos.

## Limitaciones conocidas

- **`less` y `more` no paginan**: se comportan igual que `cat` y vuelcan el fichero entero.
  Con los ficheros del escenario (ninguno pasa de 15 líneas) no se nota, pero conviene decirlo
  si alguien pregunta.
- **`rm -i` no pregunta**: la opción se acepta sin dar error, pero el borrado se hace igual.
  La confirmación interactiva no está implementada.
- **`sort` y `uniq` solo existen como filtros de tubería** (`… | sort`), no como órdenes
  sueltas sobre un fichero, aunque sí tengan página de manual.
- El intérprete **no es un shell real**: no hay variables, ni sustitución de órdenes, ni `2>`,
  ni ejecución en segundo plano, ni *scripts*. Los ficheros `.sh` del escenario se pueden leer,
  pero no ejecutar.
- **No hay enlaces simbólicos**, ni montajes, ni dispositivos: el árbol es un árbol de
  carpetas y ficheros y poco más.
- **Los permisos existen pero no se enseñan**: se choca con ellos (`/root`, `/home/weaver`) y
  se pueden trastear con `chmod`, pero ninguna tarea los trabaja. Para eso está el reto
  dedicado a permisos.
- **La insignia ⚡ *Buen ritmo* (menos de 22 minutos) queda por debajo de la duración
  estimada** de una primera partida: es deliberadamente una recompensa de segunda vuelta.
- El progreso **no se guarda**: al recargar se empieza de cero (intencionado, para no
  almacenar ningún dato). El selector de fase permite retomar por donde se quedó.

## Archivos

| Archivo | Contenido |
|---|---|
| [`index.html`](index.html) | Marcado de las tres pantallas, el editor y la guía rápida de órdenes |
| [`css/`](css/) · [`data/`](data/) · [`js/`](js/) | Estilos propios · escenario, gamificación y textos de las tareas · lógica de las tareas y arranque |
| [`../shared/`](../shared/) | Biblioteca común: sistema de ficheros virtual, órdenes, terminal, intérprete, editor, manuales, modales y motor de tareas |
| [`README.md`](README.md) | Este documento |

## Créditos

Made with 💖 by [@fvarrui](https://github.com/fvarrui) & [Claude](https://claude.ai).

Diseñado como reto digital de elaboración propia para el curso *La gamificación educativa*,
dentro de la propuesta «Operación Escudo Digital».
