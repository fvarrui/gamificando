# Asalto al puerto 80

> Simulador gamificado de administración de servicios con `systemd` en una terminal Linux.
> Guardia nocturna en la empresa ficticia TecnoAtlántica: son las 3:12 de la madrugada y la
> intranet no responde.

---

## Índice

1. [Qué es](#qué-es)
2. [Cómo abrirlo](#cómo-abrirlo)
3. [Contexto educativo](#contexto-educativo)
4. [Objetivos de aprendizaje](#objetivos-de-aprendizaje)
5. [Cómo funciona](#cómo-funciona)
6. [Las 24 tareas](#las-24-tareas)
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

*Asalto al puerto 80* es un juego educativo que se ejecuta en el navegador. El alumnado asume
el papel de **Linda**, la persona que está de guardia esa noche en la empresa ficticia
**TecnoAtlántica**. A las 3:12 de la madrugada del 14 de octubre la avisan de que la intranet
no responde; entra por SSH en el servidor `srv-web` con su cuenta (que pertenece al grupo
`sudo`) y tiene que averiguar qué pasa, arreglarlo y dejar el servidor en condiciones antes de
volver a la cama.

Lo que pasa es un clásico de cualquier sala de máquinas: **`nginx` no arranca porque el puerto
80 ya está ocupado**. Lo ocupa un `apache2` que alguien instaló hace meses «para una prueba» y
nadie retiró. De paso hay un `cups` (servicio de impresión) corriendo en un servidor sin
impresoras y un `fail2ban` parado y deshabilitado justo cuando más falta hace. No hay botones
que hagan el trabajo: la herramienta es la terminal, con `systemctl`, `journalctl`, `ps` y sus
mensajes de error reales.

La idea que vertebra el reto es **la diferencia entre «activo» y «habilitado»**, probablemente
la confusión más extendida entre quien empieza a administrar servicios: `is-active` responde
por el estado de ahora mismo; `is-enabled`, por si el servicio volverá a arrancar en el
próximo reinicio. Son dos ejes independientes, y casi todos los «pero si ayer funcionaba»
nacen de mezclarlos.

Funciona sin conexión a Internet, sin instalar nada y sin servidor.

## Cómo abrirlo

- **En local**: doble clic en [`index.html`](index.html). Funciona en cualquier navegador
  moderno (Chrome, Edge, Firefox, Safari).
- **En el aula virtual (EVAGD/Moodle)**: subir la carpeta completa del reto **junto con la
  carpeta [`shared/`](../shared/)** (por ejemplo, en un ZIP con las dos) y enlazar
  `asalto-al-puerto-80/index.html`. El reto usa CSS y scripts clásicos, sin módulos ES ni
  `fetch`, así que también funciona desde el sistema de ficheros.
- **En la web**: publicar el repositorio con GitHub Pages o cualquier alojamiento estático.
  No necesita *backend*.

Una partida completa dura entre **20 y 35 minutos**. Desde la portada se puede **empezar en
cualquiera de las 5 fases**: el servidor se prepara automáticamente con las fases anteriores
ya resueltas (esas tareas no suman XP), así que el reto se puede repartir en varias sesiones o
usar solo la parte que interese.

## Contexto educativo

| | |
|---|---|
| **Temas** | Linux · systemd · Servicios · Administración de sistemas |
| **Encaja en** | Cualquier materia o curso en que se administren servidores Linux o se trabaje con servicios del sistema |
| **Punto de partida** | Saber moverse por una terminal (`cd`, `ls`, `cat`); no hace falta haber usado `systemctl` nunca |
| **Narrativa** | Guardia nocturna en TecnoAtlántica: incidencia 4471, la intranet caída y un servidor con servicios que nadie ha revisado en meses |
| **Modalidad** | Presencial, con apoyo del aula virtual. También sirve en línea, de forma autónoma |

El gancho narrativo es deliberadamente banal y muy reconocible: nadie ha atacado el servidor,
nadie ha borrado nada. Simplemente **quedó instalado algo que ya no hacía falta** y el día que
otro servicio necesitó ese puerto, todo se cayó. Es el tipo de incidencia que se resuelve en
cinco minutos cuando se sabe mirar, y que puede durar horas cuando se resuelve a base de
reintentar.

## Objetivos de aprendizaje

Al terminar el reto, el alumnado debería ser capaz de:

1. **Identificar** el estado de un servicio con `systemctl status` y leer sus tres datos
   clave: si está cargado, si está activo y si está habilitado.
2. **Localizar la causa** de un fallo de arranque leyendo el registro de la unidad con
   `journalctl -u`, en lugar de deducirla o de reintentar a ciegas.
3. **Distinguir** los dos ejes independientes de un servicio —«activo ahora» frente a
   «arrancará al reiniciar»— y comprobar cada uno con `is-active` e `is-enabled`.
4. **Aplicar** las órdenes de gobierno del ciclo de vida de un servicio (`start`, `stop`,
   `restart`, `enable`, `disable`, `enable --now`, `disable --now`) sabiendo exactamente qué
   cambia cada una y qué no.
5. **Diagnosticar un conflicto de puertos**: relacionar el mensaje *Address already in use*
   con otro proceso escuchando, e identificarlo cruzando `systemctl list-units` con `ps aux`.
6. **Evaluar** qué servicios deben estar corriendo en un servidor y cuáles sobran, entendiendo
   que cada servicio innecesario es superficie expuesta.
7. **Decidir con criterio** antes de detener nada: valorar el impacto de parar la base de
   datos, la intranet o el propio SSH por el que se está conectado en remoto.
8. **Dejar constancia escrita** del incidente y del estado final del sistema con redirecciones
   (`>` y `>>`), como se hace en un parte de guardia real.

## Cómo funciona

### Las tres pantallas

1. **Portada (*briefing*)**: el aviso del centro de guardia (incidencia 4471), la explicación
   del juego, el **selector de fase inicial** y una **guía rápida de systemd** siempre
   accesible.
2. **Juego**: la terminal SSH ocupa casi toda la pantalla. Arriba, una barra con el progreso
   por fases, el reloj, la XP y el nivel. En el lateral, la **ficha de la tarea actual** (con
   su origen, su objetivo y hasta tres pistas) y el **parte de guardia**, que va registrando
   lo resuelto.
3. **Parte de guardia final**: XP, nivel, tiempo, pistas usadas, tareas resueltas, insignias,
   la tabla de las 24 tareas con la orden exacta que resolvió cada una y las decisiones
   arriesgadas anotadas.

### El desarrollo de una partida

La sesión empieza con una secuencia de conexión SSH real en apariencia (autenticación por
clave pública, banner de Ubuntu 24.04 LTS y el aviso de incidencia abierta). A partir de ahí,
las tareas llegan **de una en una**: al completar una, a los pocos segundos aparece la
siguiente con un mensaje en la terminal y la ficha entrando desde el lateral. Cada tarea viene
firmada por quien la pide —el **centro de guardia**, **Sigourney Weaver** (compañera de sistemas)
o la **dirección**—, lo que cambia el tono de lo que se pide y recuerda que en una guardia las
prioridades llegan de sitios distintos.

Si se resuelve algo **antes** de que llegue su tarea, la tarea aparece igualmente y se completa
sola con una bonificación: el juego premia ir por delante.

### Las mecánicas clave

- **El conflicto de puertos es real, no una comprobación de texto.** Mientras uno de los dos
  servidores web tenga el puerto 80, el otro **falla de verdad** al arrancar y el registro
  recoge el `Address already in use`. Al liberar el puerto, arranca. Y funciona en los dos
  sentidos: una vez levantado `nginx`, es `apache2` el que ya no puede arrancar.
- **Los privilegios importan**: consultar el estado no requiere nada especial, pero gobernar
  servicios sí. Sin `sudo`, `systemctl stop` responde `Access denied` (y el juego recuerda
  discretamente por qué).
- **Las decisiones tienen consecuencias**: tocar el SSH por el que se ha entrado, dejar la
  base de datos parada o deshabilitar la intranet se permiten, cuestan 50 XP y quedan anotados
  en el parte de guardia.
- **Pistas graduadas**: tres por tarea, de menos a más concretas. Solo la tercera da la orden
  literal, y cada una cuesta 25 XP.

## Las 24 tareas

### Fase 1 · Diagnóstico — *ver qué está corriendo y por qué falla lo que falla*

| # | Código | Tarea | Qué se practica |
|---|--------|-------|-----------------|
| 1 | SVC-01 | El parte de la noche | `cat` sobre el parte que dejó el turno anterior |
| 2 | SVC-02 | ¿Qué le pasa a la intranet? | `systemctl status nginx`: leer un servicio en estado `failed` |
| 3 | SVC-03 | El porqué está en el registro | `journalctl -u nginx`: del *qué* al *por qué* |
| 4 | SVC-04 | ¿Qué más hay corriendo? | `systemctl list-units --type=service`, `--all`, `--failed` |
| 5 | SVC-05 | Y los procesos, por si acaso | `ps aux` como comprobación cruzada (y con tubería a `grep`) |

### Fase 2 · El conflicto — *encontrar quién ocupa el puerto y liberarlo*

| # | Código | Tarea | Qué se practica |
|---|--------|-------|-----------------|
| 6 | SVC-06 | Ahí está el culpable | `systemctl status apache2`: leer a la vez «active» y «enabled» |
| 7 | SVC-07 | Libera el puerto | `sudo systemctl stop`: privilegios y silencio al tener éxito |
| 8 | SVC-08 | Y que no vuelva en el próximo reinicio | `sudo systemctl disable`: **no detiene nada**, solo cambia el arranque |
| 9 | SVC-09 | Ahora sí: arranca la intranet | `sudo systemctl start nginx` con el puerto ya libre |
| 10 | SVC-10 | Confírmalo | Volver a `status`: `active (running)` y `Main PID` |

### Fase 3 · Arranque — *«activo» no es lo mismo que «habilitado»*

| # | Código | Tarea | Qué se practica |
|---|--------|-------|-----------------|
| 11 | SVC-11 | ¿Arrancará solo mañana? | `systemctl is-enabled`: la pregunta del futuro |
| 12 | SVC-12 | Que arranque solo | `sudo systemctl enable` y el enlace en `multi-user.target.wants` |
| 13 | SVC-13 | Compruébalo | Verificar `enabled`; los dos ejes son independientes |
| 14 | SVC-14 | El escudo contra la fuerza bruta | `sudo systemctl enable --now fail2ban`: las dos cosas a la vez |
| 15 | SVC-15 | Confirma el escudo | `systemctl is-active`: la pregunta del presente |

### Fase 4 · Superficie — *apagar lo que no debería estar corriendo*

| # | Código | Tarea | Qué se practica |
|---|--------|-------|-----------------|
| 16 | SVC-16 | ¿Qué hace un servicio de impresión aquí? | `systemctl status cups`; superficie expuesta |
| 17 | SVC-17 | Fuera el servicio de impresión | `sudo systemctl disable --now cups`: el contrario de `enable --now` |
| 18 | SVC-18 | Comprueba que ya no está | Releer la lista de unidades activas y contrastarla con la inicial |
| 19 | SVC-19 | La base de datos, tras el susto | `sudo systemctl restart mariadb`: reiniciar sí, dejar parado no |
| 20 | SVC-20 | Y el registro, por si acaso | `journalctl -u nginx -n 5`: limitar el número de líneas |

### Fase 5 · Cierre — *verificación y parte de guardia*

| # | Código | Tarea | Qué se practica |
|---|--------|-------|-----------------|
| 21 | SVC-21 | El acceso remoto, intacto | `systemctl is-active ssh`: verificar lo que nunca hay que tocar |
| 22 | SVC-22 | Repasa lo que arrancará solo | `systemctl is-enabled apache2`: confirmar también lo negativo |
| 23 | SVC-23 | Guarda el estado final | Redirección `>` a `estado-final.txt` |
| 24 | SVC-24 | Cierra el parte | Añadir al parte con `>>` (o editarlo con `nano`) |

## Órdenes disponibles

| Tipo | Órdenes |
|---|---|
| Consultar servicios | `systemctl` (sin argumentos), `systemctl status <svc>`, `is-active`, `is-enabled`, `list-units [--type=service] [--all] [--failed]`, `list-unit-files` |
| Gobernar el estado actual | `systemctl start\|stop\|restart\|reload <svc>`, `service <svc> <orden>` (sintaxis clásica, redirige a `systemctl`) |
| Gobernar el arranque | `systemctl enable\|disable <svc>`, con `--now` para hacer las dos cosas; `systemctl daemon-reload` |
| Registros | `journalctl -u <svc>`, `-n <n>`, `--no-pager` |
| Procesos | `ps aux`, `kill <pid>` |
| Privilegios e identidad | `sudo <orden>`, `whoami`, `id`, `groups` |
| Ficheros y texto | `ls [-la]`, `cd`, `pwd`, `cat`, `head`, `tail`, `wc`, `grep`, `find`, `file`, `stat`, `touch`, `cp`, `mv`, `rm`, `mkdir`, `echo`, `nano` |
| Ayuda y sesión | `man <orden>`, `help`, `history`, `clear`, `date`, `which`, `exit` |
| Composición | Encadenado con `&&`, `\|\|` y `;`; tuberías con `\| grep [-i] [-v] [-n] [-c]`, `\| head`, `\| tail`, `\| wc`; redirecciones `>` y `>>`; comodines (`*.txt`); comillas simples y dobles |

Hay páginas de `man` reales (resumidas) para `systemctl`, `journalctl`, `service`, `ps`,
`kill`, `sudo`, `ls`, `cd`, `cat`, `grep`, `find`, `man`, `echo`, `nano`, `head`, `tail`,
`wc`, `history`, `id` y `whoami`.

Atajos: <kbd>↑</kbd>/<kbd>↓</kbd> historial, <kbd>Tab</kbd> autocompletar (órdenes y
ficheros), <kbd>Ctrl</kbd>+<kbd>L</kbd> limpiar la pantalla, <kbd>Ctrl</kbd>+<kbd>C</kbd>
cancelar la línea. En `nano`: <kbd>Ctrl</kbd>+<kbd>O</kbd> guardar,
<kbd>Ctrl</kbd>+<kbd>X</kbd> salir, <kbd>Ctrl</kbd>+<kbd>K</kbd> cortar línea,
<kbd>Ctrl</kbd>+<kbd>U</kbd> pegar (también hay botones).

## Cómo se diseñó

### Primero el aprendizaje, después la narrativa

El punto de partida no fue la historia, sino una lista muy corta de cosas que se entienden mal
una y otra vez al empezar con servicios:

1. que «funciona ahora» y «funcionará tras reiniciar» son dos preguntas distintas;
2. que `disable` no detiene nada y `stop` no cambia el arranque;
3. que cuando un servicio no arranca, la respuesta está en el registro, no en el reintento;
4. que un servidor acumula servicios que nadie necesita y cada uno es superficie expuesta.

La narrativa vino después, elegida por ser el envoltorio más económico para esas cuatro ideas:
una **guardia nocturna** justifica que haya que arreglarlo ya, que se trabaje en remoto por
SSH (lo que convierte «no toques el SSH» en una amenaza concreta y no en una regla abstracta)
y que al final haya que **dejar algo escrito** para quien llegue por la mañana.

### El conflicto de puertos tenía que ser real

Es la decisión de diseño más importante del reto. Habría sido mucho más sencillo comprobar si
el alumnado ha escrito `systemctl stop apache2` y darlo por bueno. En vez de eso, el simulador
mantiene una regla viva: **el puerto 80 solo lo puede tener uno**. Mientras `apache2` esté
corriendo, `nginx` falla al arrancar con el mensaje real de *nginx*
(`bind() to 0.0.0.0:80 failed (98: Address already in use)`); en cuanto se libera, arranca. Y
funciona en el otro sentido: con `nginx` levantado, es `apache2` el que ya no puede arrancar,
con el mensaje real de *Apache* (`AH00072: make_sock: could not bind to address 0.0.0.0:80`).

La consecuencia pedagógica es la que se buscaba: **reintentar no sirve de nada**. Quien pruebe
`start` tres veces seguidas verá tres veces el mismo fallo, y no tendrá más remedio que ir al
registro a averiguar por qué. La mecánica del juego obliga al método correcto sin necesidad de
explicarlo. Si aun así se insiste, una nota en la terminal orienta —«comprueba que `apache2`
está realmente detenido»— sin dar la orden.

### Principios que guiaron el resto de decisiones

- **El simulador no enseña cosas falsas.** `disable` sin `--now` deja el servicio corriendo;
  `enable` responde creando el enlace simbólico en `multi-user.target.wants`, que es
  literalmente lo que significa «habilitar» en systemd; `stop` y `start` no imprimen nada
  cuando tienen éxito; `status` devuelve código de salida 3 si el servicio no está activo e
  `is-enabled` devuelve 1 si está deshabilitado; un servicio inexistente responde
  `Unit …could not be found.`; gestionar servicios sin privilegios da `Access denied`.
- **Las fichas describen síntomas y objetivos, nunca la solución.** «La intranet no responde»,
  «averigua por qué no arranca», «que no vuelva en el próximo reinicio». La orden literal solo
  aparece en la tercera pista, y la guía de systemd de la portada explica el modelo sin
  resolver ninguna tarea concreta.
- **Varias soluciones válidas por tarea.** Muchas comprobaciones miran el **estado del
  sistema**, no la orden tecleada: para detener Apache vale `systemctl stop`, `service apache2
  stop` o incluso `kill` sobre su PID; para habilitar y arrancar `fail2ban` vale
  `enable --now` o las dos órdenes por separado. Así se puede explorar sin quedarse atascado
  en una sintaxis concreta.
- **Las acciones dañinas se permiten, no se bloquean.** Se puede detener el SSH por el que se
  ha entrado, dejar la base de datos parada o deshabilitar la intranet. El juego lo permite,
  lo explica, cuesta 50 XP (una sola vez por tipo) y lo anota en el parte final. El objetivo
  es desarrollar criterio, no impedir errores.
- **El cierre es la parte que casi nunca se practica.** Las cuatro últimas tareas no arreglan
  nada: verifican que el SSH sigue en pie, que lo deshabilitado sigue deshabilitado, guardan
  el estado final en un fichero y escriben en el parte la causa del incidente. Cerrar bien una
  incidencia es tan parte del trabajo como resolverla.

### Qué se descartó por el camino

- **Bloquear las órdenes peligrosas.** Se probó impedir `stop ssh`. Elimina el dilema, que es
  justo lo que se quiere provocar: se sustituyó por la penalización con aviso.
- **Dar pistas automáticas tras varios intentos fallidos.** Convierte el juego en un tutorial
  guiado y anula el valor de leer el registro. Solo queda una nota puntual cuando se insiste
  en arrancar `nginx` con el puerto ocupado, y no dice qué hacer.
- **Un panel gráfico con el estado de los servicios**, como el del reto de Git. Aquí sería
  contraproducente: el objetivo es precisamente que la información se lea en la salida de
  `systemctl` y `journalctl`, que es lo que habrá en un servidor real. La única concesión es
  el color en la lista de unidades (verde activo, rojo fallido), que **acompaña** al texto sin
  sustituirlo.
- **Una cuenta atrás** acorde con la urgencia de la guardia. Se descartó: presionar con el
  reloj empuja a teclear sin leer, que es exactamente el hábito que el reto combate. El reloj
  cuenta hacia arriba y solo se usa para una insignia opcional.

## Elementos de gamificación

Relación con los **12 componentes** vistos en el curso *La gamificación educativa* (solo se
usan los que encajan):

| Componente | ¿Se usa? | Cómo | Por qué |
|---|---|---|---|
| **Misiones** | ✅ | 24 tareas encadenadas (SVC-01…SVC-24) agrupadas en 5 fases | Se habla de tareas de guardia y de fases, nunca de ejercicios |
| **Sorpresa** | ✅ | La causa real del fallo no se anuncia: aparece al leer el registro. Y al final, Apache ya no puede arrancar | El descubrimiento es la recompensa del método correcto |
| **Desbloqueo de contenido** | ✅ | Cada tarea se revela al completar la anterior | Hay que avanzar para saber qué viene |
| **Puntos (XP)** | ✅ | 75-175 XP por tarea, +25 por adelantarse, −25 por pista, −50 por decisión arriesgada | *Feedback* inmediato; las pistas cuestan, pero nunca bloquean |
| **Niveles** | ✅ | Mira el estado → Arranca y detiene → Controla el arranque → Cierra la guardia | Los nombres describen la competencia que se acaba de adquirir, no un rango vacío |
| **Insignias** | ✅ | 6 insignias ligadas a buenas prácticas (ver abajo) | Reconocen *cómo* se ha trabajado, no solo terminar |
| **Barra de progreso** | ✅ | Progreso por fases, contador de tareas y parte de guardia lateral | Ver el avance anima a seguir y ordena una sesión de 30 minutos |
| **Recompensas** | ✅ | Pistas «compradas» con XP y guía de systemd siempre disponible | La ayuda existe, pero hay que decidir si compensa |
| **Tablero de clasificación** | ❌ | — | Deliberadamente no: el parte de guardia es individual |
| **Cuenta atrás** | ❌ | Reloj que cuenta hacia arriba, sin límite | Una cuenta atrás invita a teclear con prisa y sin leer el registro |
| **Avatar** | ❌ | — | No aporta; la identidad ya la da el papel de Linda y el `prompt` `hamilton@srv-web` |
| **Poder** | ❌ | — | No encaja en una guardia de una sola persona |

**Insignias**: 🛡️ *Sin daños colaterales* (no se detuvo ningún servicio que la empresa
necesitaba), 🧠 *Autosuficiente* (guardia cerrada sin pedir pistas), 📚 *Lee el manual*
(consultar al menos una página de `man`), 🪵 *Lee los registros* (averiguar la causa con
`journalctl` antes de tocar nada), 🔁 *Sobrevive al reinicio* (`nginx`, `fail2ban`, `mariadb` y
`ssh` habilitados y `apache2` y `cups` deshabilitados al terminar) y ⚡ *Guardia corta*
(resolver el incidente en menos de 22 minutos).

Las dos últimas merecen un comentario. **Sobrevive al reinicio** es la única insignia que no
se consigue haciendo las tareas en orden: comprueba el estado del arranque de *todos* los
servicios al cerrar, de modo que premia exactamente la idea central del reto. Y **Guardia
corta** está calibrada por debajo de la duración estimada: no se alcanza en una primera
partida, sino en una segunda vuelta en la que ya se sabe qué mirar. Es una invitación a
repetir, no una presión.

### Perfiles de jugador (Bartle)

- **Explorer**: hay mucho que mirar que ninguna tarea pide: `journalctl` sin `-u` (el registro
  completo del sistema), `systemctl list-units --all` y `--failed`, `systemctl status` de cada
  servicio, `cat /etc/nginx/nginx.conf` para ver el `listen 80` que provoca el conflicto,
  `ps aux | grep`, `id`, `man` de casi todo.
- **Achiever**: XP, cuatro niveles, seis insignias y un parte de guardia final con la orden
  exacta que resolvió cada tarea.
- **Killer**: tiempo final e insignia de rapidez, sin tablero público; se pueden comparar
  partes de guardia.
- **Socializer**: se trabaja fuera del juego, en parejas y en la puesta en común; los mensajes
  vienen firmados por personas concretas del equipo.

### Estado de *flow*

La curva está pensada para mantener el equilibrio entre reto y destreza:

- **Fases 1 y 2** (diagnóstico y conflicto): dificultad creciente pero muy guiada, con una
  recompensa emocional clara —la intranet vuelve— justo a la mitad de la partida.
- **Fase 3** (arranque): el punto conceptualmente más exigente, colocado cuando ya hay
  soltura con `systemctl` y la tensión narrativa ha bajado.
- **Fases 4 y 5** (superficie y cierre): vuelta a una dificultad moderada, aplicando lo
  aprendido a servicios nuevos y cerrando la incidencia por escrito.

Las pistas graduadas, el selector de fase y la ausencia de límite de tiempo permiten ajustar
la dificultad a cada persona sin romper la experiencia.

## Accesibilidad, inclusión y protección de datos

### Accesibilidad

- **Todo se maneja con teclado**, incluido el editor. Con la línea vacía, <kbd>Tab</kbd> sale
  de la terminal al resto de la página, así que el autocompletado no atrapa el foco.
- **Lectores de pantalla**: la salida de la terminal es un `role="log"`; una región
  `role="status"` independiente anuncia solo lo importante (nueva tarea con su objetivo, tarea
  completada, pistas, ascensos de nivel).
- **Nunca solo color**: en la lista de unidades el color acompaña siempre al texto (`active` /
  `failed` / `inactive`), que es el que lleva la información; los estados de las fases
  combinan símbolo, color y texto oculto para lectores de pantalla.
- **Contraste alto** sobre fondo oscuro, foco visible y tipografía monoespaciada.
- **Movimiento reducido**: con `prefers-reduced-motion` se quitan las animaciones y se acortan
  las esperas entre tareas.
- **Editor accesible**: `nano` tiene etiqueta, anuncio al abrirse y botones para quienes no
  usen atajos de teclado.
- **Modales accesibles**: foco atrapado, cierre con <kbd>Esc</kbd> y devolución del foco.
- **Adaptable**: por debajo de 900 px el panel lateral se coloca sobre la terminal. Comprobado
  a 400 px de ancho, sin scroll horizontal.

### Inclusión

- **Cada cual a su ritmo**: sin tiempo límite; el reloj es informativo y solo afecta a una
  insignia opcional.
- **Ayuda graduada**: tres pistas por tarea, guía de systemd siempre disponible desde la
  portada y desde el juego, `man` dentro del propio juego y una orden `help` con las órdenes
  agrupadas por para qué sirven.
- **Se puede empezar por cualquier fase**, lo que permite repartir el reto en varias sesiones
  o adaptar el punto de partida a cada persona.
- **Sin castigo definitivo**: se puede reiniciar sin penalización y `exit` no cierra la
  sesión.
- **Tono y lenguaje**: español correcto, mensajes que orientan en lugar de culpar y nombres de
  nivel descriptivos y neutros.

### Protección de datos y uso responsable

- **No recoge ningún dato personal**: no pide nombre, ni correo, ni identificación alguna.
- **No envía nada a ningún servidor** ni usa cookies ni almacenamiento del navegador; el
  progreso vive en memoria y desaparece al cerrar la pestaña.
- **No depende de servicios externos** (ni CDN, ni fuentes web, ni analítica).
- **Es una simulación**: el servidor `srv-web`, sus servicios y su registro están dentro de la
  página. Ningún sistema real es modificado, y conviene decirlo en voz alta antes de empezar,
  porque las órdenes son exactamente las mismas que en una máquina de producción.

## Uso en el aula

**Antes**

- Plantear la pregunta en frío, antes de abrir nada: *«un servicio está funcionando ahora
  mismo; ¿seguirá funcionando después de reiniciar el servidor?»*. Recoger las respuestas y
  volver a ellas al terminar.
- Presentar el vocabulario mínimo: servicio, unidad, `systemd`, registro, puerto.
- Recordar que las órdenes del juego son reales y que en un servidor de verdad tienen efecto.

**Durante**

- Individual o **en parejas** (una persona teclea y la otra consulta la guía y los `man`; se
  cambia de rol en cada fase).
- Sugerencia de reparto si hay poco tiempo: fases 1 y 2 en una sesión y fases 3 a 5 en otra,
  usando el **selector de fase** de la portada.
- El docente circula y pregunta en lugar de resolver: «¿qué te dice exactamente el registro?»,
  «¿esto cambia el estado de ahora o el del próximo arranque?», «¿qué pasaría si reiniciamos
  el servidor en este momento?».
- Insistir en la disciplina del método: `status` → `journalctl -u` → arreglar la causa →
  `start` → volver a comprobar.

**Después**

- **Puesta en común**: ¿quién detuvo Apache de otra forma? ¿Alguien usó `kill` en vez de
  `stop`, y qué diferencia hay? ¿Por qué `restart` en la base de datos y no `stop`? ¿Qué
  habría pasado si se hubiese ejecutado `disable` sin `stop` y el servidor no se reiniciara en
  seis meses?
- **La pregunta de cierre**: repasar el estado final con `is-enabled` de cada servicio y
  preguntar cómo despertaría el servidor tras un corte de luz.
- **Evidencia para el aula virtual**: captura del parte de guardia final, o el contenido de
  `estado-final.txt` y del `guardia.txt` cerrado.
- **Ampliación**: repetir el diagnóstico en una máquina virtual real con dos servicios que
  compitan por el mismo puerto, y comprobar que se comporta igual.

## Detalles técnicos

HTML semántico, CSS y JavaScript *vanilla* (sin *frameworks*, sin dependencias, sin *build* y
sin módulos ES, para que funcione también con `file://`). El reto se apoya casi por completo
en la biblioteca [`shared/`](../shared/) (espacio de nombres `RG`) y solo aporta **datos y una
regla propia**:

| Fichero | Contenido |
|---|---|
| `index.html` | Marcado de las tres pantallas, el editor `nano` y la guía de systemd |
| `css/reto.css` | Los pocos estilos propios del reto sobre la hoja compartida |
| `data/config.js` | El escenario: equipo `srv-web`, usuarios y grupos, los 6 servicios con su estado, tipo de arranque, PID y registro, y el sistema de ficheros inicial |
| `data/gamification.js` | Las 5 fases, los 4 niveles, las 6 insignias y el coste de pistas y decisiones arriesgadas |
| `data/missions.js` | El contenido de las 24 tareas (título, texto, objetivo y tres pistas), sin nada de lógica |
| `js/missions.js` | La comprobación y la solución de cada tarea, la regla del puerto 80 y la vigilancia de decisiones arriesgadas |
| `js/main.js` | Crea el `RG.Sandbox` con los datos anteriores, los textos de la interfaz, las insignias calculadas y el texto del parte final |

De la biblioteca compartida, este reto usa en particular:

- **`shared/js/sysmodel.js`** (`RG.System`): el modelo de usuarios, grupos, **servicios** y
  procesos. Cada servicio tiene nombre, unidad (`x.service`), estado (`running` / `stopped` /
  `failed`), tipo de arranque (`auto` / `manual`), PID, usuario, descripción, **registro** y un
  `failReason` opcional, el motivo por el que fallaría al arrancar. La lista de procesos de
  `ps` se **deriva** de los servicios que están corriendo, así que nunca puede contradecir a
  `systemctl`.
- **`shared/js/cmd-posix-admin.js`** (`RG.PosixAdminCommands`): la implementación de
  `systemctl` (con `status`, `is-active`, `is-enabled`, `list-units`, `start`, `stop`,
  `restart`, `enable`, `disable` y `--now`), `journalctl`, `service`, `ps` y `kill`, con sus
  formatos de salida y sus códigos de salida.
- **`shared/js/sandbox.js`** (`RG.Sandbox`): el arranque común de los retos de consola. Monta
  el sistema de ficheros virtual, el modelo de sistema, la terminal, el intérprete, el editor,
  el motor de misiones, la barra de fases, la secuencia de conexión y el informe final. El
  reto no toca nada de esto: solo le pasa datos.
- **`shared/js/core.js`, `terminal.js`, `shell.js`, `editor.js`, `man.js`, `modal.js`,
  `game.js`, `vfs.js`, `cmd-posix.js`** y las páginas de manual de
  `shared/data/man-linux.js`.

Claves del diseño:

- **La regla del puerto compartido** es lo único específico del reto en materia de simulación,
  y cabe en una función: tras cada orden que cambie servicios, `nginx.failReason` se pone si
  `apache2` está corriendo y `apache2.failReason` se pone si lo está `nginx`. Todo lo demás
  (el `status` que muestra `failed`, el mensaje de error de `start`, el registro que explica
  la causa) sale solo del modelo compartido.
- **Contenido separado de la lógica**: los textos de las tareas viven en `data/missions.js`
  (datos puros, editables por el profesorado) y su lógica en `js/missions.js`, emparejadas por
  el código `SVC-xx`, que se asigna por posición.
- **Comprobaciones por estado siempre que sea posible**: `check(evento)` puede mirar el evento
  del comando (para las tareas de consulta, donde lo que importa es *haber mirado*) o el
  estado del sistema (para las de acción, donde lo que importa es *el resultado*). De ahí que
  haya varias soluciones válidas.
- **Cada tarea declara su `solution`**: la secuencia de órdenes que la resuelve. Es la que
  ejecuta en silencio el **selector de fase** para preparar el servidor, y la que usa el guion
  de pruebas automáticas.
- **Añadir o cambiar una tarea**: editar `data/missions.js` (y `data/gamification.js` si se
  añade una fase) y su `check`/`solution` en `js/missions.js`. Toda la interfaz —progreso,
  ficha, parte lateral, informe final— se genera a partir de esos datos.

## Verificación

Se ha probado en **Chrome real en modo *headless***, manejado por el protocolo DevTools (CDP)
desde Node.js, con un guion que simula a una persona jugando: **37 comprobaciones, todas
superadas y sin ningún error de JavaScript**. Se ejecuta con:

```bash
node .claude/skills/verificar-reto/scripts/run.mjs test-asalto-al-puerto-80
```

Cubre:

- la **partida completa**, resolviendo las 24 tareas con las órdenes que propone cada ficha;
- el **conflicto de puertos en los dos sentidos**: que `nginx` falla mientras `apache2` tiene
  el 80 y que, una vez levantado `nginx`, es `apache2` el que ya no puede arrancar;
- que **sin `sudo`** no se pueden gestionar servicios (`Access denied`);
- el **estado final correcto**: `nginx` activo y habilitado, `apache2` parado y deshabilitado,
  `cups` fuera de la lista de unidades activas;
- los **mensajes reales de systemd** ante un servicio inexistente;
- el **parte de guardia final**: XP por encima de 2500, las 24 filas de la tabla y al menos 5
  insignias conseguidas sin pistas;
- las **salvaguardas**: que detener la base de datos queda anotado como decisión arriesgada;
- la **portada**: que ofrece las 5 fases y que empezar en una fase posterior prepara el
  servidor correctamente.

Al tratarse de un reto construido sobre la biblioteca compartida, cualquier cambio en
`shared/` obliga a volver a pasar también las pruebas del resto de retos
(`node .claude/skills/verificar-reto/scripts/run.mjs`).

## Limitaciones conocidas

- **Solo hay 6 servicios** en el servidor simulado. Un `systemctl list-units` real devuelve
  decenas de unidades, y aquí la lista cabe en pantalla: se ha preferido la legibilidad al
  realismo.
- **Solo unidades de tipo servicio**: no hay *targets*, *timers*, *sockets*, *mounts* ni
  dependencias entre unidades (`Requires`, `After`). `list-unit-files` se comporta como
  `list-units`.
- **No se pueden editar unidades**: no hay ficheros `.service` editables, ni
  `systemctl edit`, ni `systemctl cat`. `daemon-reload` se acepta, pero no tiene nada que
  recargar.
- **El registro no es un `journal` de verdad**: `journalctl` muestra las líneas guardadas en
  cada servicio, sin filtros por fecha (`--since`), sin prioridades (`-p`), sin seguimiento en
  vivo (`-f`) y sin arranques anteriores (`-b`).
- **No hay reinicio del servidor**: la insignia *Sobrevive al reinicio* se comprueba mirando
  el estado del arranque, no reiniciando de verdad. Sería una ampliación natural del reto.
- **No hay órdenes de red** (`ss`, `netstat`, `lsof`): el conflicto de puertos se descubre por
  el registro y por `ps`, no inspeccionando los sockets. Quien quiera trabajar eso tiene el
  reto [*Blindaje de la Red*](../blindaje-de-la-red/).
- **El intérprete no es un shell real**: no hay variables, sustitución de órdenes, `2>` ni
  ejecución en segundo plano.
- El progreso **no se guarda**: al recargar se empieza de cero (intencionado, para no
  almacenar datos). El selector de fase permite retomar el reto por donde se quedó.

## Archivos

| Archivo | Contenido |
|---|---|
| [`index.html`](index.html) | Marcado de las tres pantallas, el editor y la guía de systemd |
| [`css/`](css/) · [`data/`](data/) · [`js/`](js/) | Estilos propios · escenario, gamificación y textos de las tareas · lógica de las tareas y arranque |
| [`../shared/`](../shared/) | Biblioteca común: terminal, intérprete, editor, manuales, modales, sistema simulado y motor de misiones |
| [`README.md`](README.md) | Este documento |

## Créditos

Made with 💖 by [@fvarrui](https://github.com/fvarrui) & [Claude](https://claude.ai).

Diseñado como reto digital de elaboración propia para el curso *La gamificación educativa*.
