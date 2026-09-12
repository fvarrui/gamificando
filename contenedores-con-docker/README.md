# Contenedores con Docker

> Simulador gamificado de contenedores en una terminal Linux.
> Reto digital de elaboración propia, hermano de [*Blindaje de la Red*](../blindaje-de-la-red/)
> y de [*Versionando con Git*](../versionando-con-git/).

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

*Contenedores con Docker* es un juego educativo que se ejecuta en el navegador. El
alumnado se pone en la piel de **Ana Betancor**, del equipo de sistemas de la empresa
ficticia **TecnoAtlántica**, y recibe un encargo concreto: la intranet funciona, pero está
montada a mano sobre un servidor, con paquetes instalados en su día y configuración
retocada por tres personas distintas. **Nadie sabría reproducirla** si mañana hubiera que
moverla. Hay que llevarla a contenedores.

Se trabaja en `srv-docker`, un servidor recién instalado y sin una sola imagen descargada,
escribiendo **órdenes reales de Docker**: `pull`, `run`, `ps`, `logs`, `exec`, `stop`,
`rm`, `volume`, `build` y `compose`. La usuaria pertenece al grupo `docker`, así que habla
con el demonio sin `sudo`. El proyecto de la intranet está en `~/intranet` (con su
`Dockerfile`) y la pila completa, en `~/pila` (con su `compose.yaml`).

Lo que lo separa de un cuestionario es que **los errores están puestos a propósito porque
son los que enseñan**: la base de datos que se cae al instante y solo confiesa por qué en
`docker logs`, el segundo contenedor que no arranca porque un puerto del anfitrión solo lo
puede publicar uno, y la lección grande de todas, la de que lo que un contenedor escribe
dentro de sí mismo desaparece con él. No hay botones que hagan el trabajo: la herramienta
es la terminal, con su historial, sus tuberías y sus mensajes de error.

Funciona sin conexión a Internet, sin instalar nada y sin servidor.

## Cómo abrirlo

- **En local**: doble clic en [`index.html`](index.html). Funciona en cualquier navegador
  moderno (Chrome, Edge, Firefox, Safari).
- **En el aula virtual (EVAGD/Moodle)**: subir la carpeta completa del reto **junto con la
  carpeta [`shared/`](../shared/)** (por ejemplo, en un ZIP con las dos) y enlazar
  `contenedores-con-docker/index.html`. El reto usa CSS y scripts clásicos, sin módulos ES
  ni `fetch`, así que también funciona desde el sistema de ficheros.
- **En la web**: publicar el repositorio con GitHub Pages o cualquier alojamiento estático.
  No necesita *backend*.

Una partida completa dura entre **30 y 45 minutos**. Desde la portada se puede **empezar en
cualquiera de las 5 fases**: el servidor se prepara automáticamente con las fases anteriores
ya resueltas (esas tareas no suman XP), así que el reto se puede repartir en varias sesiones
de clase.

## Contexto educativo

| | |
|---|---|
| **Temas** | Docker · Contenedores · Despliegue · Administración de sistemas |
| **Encaja en** | Cualquier materia en la que se despliegue software o se administren servidores, y en cualquier asignatura que necesite que un montaje sea reproducible |
| **Punto de partida** | Saber moverse por una terminal Linux (`cd`, `ls`, `cat`); no hace falta haber usado Docker nunca |
| **Narrativa** | Continuación de «Operación Escudo Digital»: blindado el servidor y puestos los scripts bajo control de versiones, ahora toca que la intranet deje de depender de cómo esté instalada la máquina |
| **Modalidad** | Presencial, con apoyo del aula virtual. También sirve en línea, de forma autónoma |

El gancho narrativo es el mismo problema que aparece en cuanto una persona se va de vacaciones
o cambia de puesto: **el servicio funciona, pero nadie sabe reproducirlo**. La respuesta del
reto no es «aprende doce órdenes», sino «describe el montaje en ficheros y hazlo repetible».

## Objetivos de aprendizaje

Al terminar el reto, el alumnado debería ser capaz de:

1. **Distinguir imagen, contenedor y volumen**: la plantilla de solo lectura, la instancia
   efímera que se crea a partir de ella y el almacenamiento que sobrevive al borrado.
2. **Descargar y listar imágenes** con `pull` e `images`, **citando siempre la etiqueta de
   versión** y explicando por qué `latest` no es una versión, sino una ruleta.
3. **Manejar el ciclo de vida completo** de un contenedor (`run`, `ps`, `stop`, `start`,
   `rm`) y explicar por qué **un contenedor parado sigue existiendo** aunque no salga en
   `docker ps`.
4. **Diagnosticar un contenedor que no arranca** leyendo su registro con `docker logs`, y
   corregir la causa: una variable de entorno obligatoria que falta o un puerto del
   anfitrión ya ocupado.
5. **Decidir qué datos deben sobrevivir** al contenedor y protegerlos con un volumen con
   nombre (`-v`), reconociendo que sin él todo lo que escriba el servicio se pierde.
6. **Construir una imagen propia** a partir de un `Dockerfile`, interpretando `FROM`,
   `COPY`, `EXPOSE` y `CMD`, y entendiendo qué es el **contexto** de construcción.
7. **Desplegar una pila de varios servicios** con un `compose.yaml` y **valorar** por qué un
   despliegue descrito en un fichero es reproducible y uno hecho a mano no lo es.

## Cómo funciona

### Las tres pantallas

1. **Portada (encargo)**: el correo de Nayra Suárez, responsable de sistemas, explicando la
   migración; un resumen de cómo funciona el reto; el **selector de fase inicial** y la
   **guía rápida de Docker** (conceptos, imágenes, contenedores, datos y redes, `Dockerfile`
   y Compose), accesible también durante la partida.
2. **Juego**: la terminal ocupa casi toda la pantalla. Arriba, una barra con el progreso por
   fases, el reloj, la XP y el nivel. En el lateral, la **ficha de la tarea** actual (origen,
   situación, objetivo y botón de pista) y el **registro de la migración** con lo ya resuelto.
3. **Informe final**: XP, nivel alcanzado, tiempo, pistas usadas, tareas resueltas,
   insignias, la tabla de las 26 tareas **con la orden exacta que resolvió cada una** y la
   lista de decisiones arriesgadas.

### El desarrollo de una partida

Las tareas llegan **de una en una**, con un mensaje en la terminal y la ficha entrando por
el lateral. Vienen firmadas: unas las manda Nayra (sistemas) y otras Carla Ojeda
(desarrollo), que es quien necesita la base de datos y la intranet levantadas.

Cada ficha describe **la situación y el objetivo**, nunca la orden literal. Si hace falta,
hay **tres pistas** por tarea, cada vez más concretas: la primera orienta, la segunda
explica la opción que se necesita y solo la tercera escribe la orden completa. Cada pista
cuesta **25 XP**, pero nunca bloquea nada.

Si se resuelve algo **antes** de que llegue su tarea, la tarea aparece igualmente y se
completa sola, con un **bonus de 25 XP**: el juego premia ir por delante.

### Las mecánicas clave

- **Tres errores puestos a propósito.** MariaDB no arranca sin `MARIADB_ROOT_PASSWORD` y hay
  que descubrirlo leyendo `docker logs`; el segundo contenedor que intenta publicar el 8080
  falla con «port is already allocated»; y lo que se escribe dentro de un contenedor
  desaparece con él, que es justo lo que motiva el volumen.
- **Decisiones arriesgadas.** Nada se bloquea: se puede borrar un volumen con datos dentro,
  eliminar contenedores con `-v`, levantar la base de datos sin volumen o tirar de la
  etiqueta `latest`. Se permite, se explica por qué es mala idea, **cuesta 50 XP** (una vez
  por tipo) y queda anotado en el informe final.
- **El estado manda.** Casi todas las comprobaciones miran el **estado real del motor** (si
  el contenedor existe, en qué estado está, qué puertos publica, qué variables y qué montajes
  tiene), no el texto que se ha tecleado. Por eso hay **varias soluciones válidas**: da igual
  usar `docker ps -a` o `docker ps --all`, `docker images` o `docker image ls`, o llegar al
  resultado por otro camino.
- **Selector de fase.** Cada tarea guarda la secuencia de órdenes que la resuelve, y el
  selector la ejecuta **en silencio** para dejar el servidor exactamente como estaría al
  empezar esa fase.

## Las 26 tareas

### Fase 1 · Imágenes

| # | Código | Tarea | Qué se practica |
|---|--------|-------|-----------------|
| 1 | DKR-01 | El encargo | Leer `~/encargo.txt` con `cat`; situarse en el escenario |
| 2 | DKR-02 | ¿Está Docker en marcha? | `docker version`: cliente y demonio son dos cosas distintas |
| 3 | DKR-03 | ¿Qué imágenes hay? | `docker images` en un servidor recién instalado (la lista está vacía) |
| 4 | DKR-04 | Descarga la imagen de nginx | `docker pull nginx:1.27`, las capas y la **etiqueta de versión** |
| 5 | DKR-05 | Comprueba que está | `docker images`: repositorio, etiqueta, `IMAGE ID` y tamaño |
| 6 | DKR-06 | Tu primer contenedor | `docker run -d --name web -p 8080:80`; las opciones van antes de la imagen |

### Fase 2 · Ciclo de vida

| # | Código | Tarea | Qué se practica |
|---|--------|-------|-----------------|
| 7 | DKR-07 | ¿Qué está corriendo? | `docker ps` y la columna `PORTS` (`0.0.0.0:8080->80/tcp`) |
| 8 | DKR-08 | Mira lo que dice por dentro | `docker logs`: la salida estándar del contenedor **es** su registro |
| 9 | DKR-09 | Párale | `docker stop`; parar no es borrar |
| 10 | DKR-10 | Sigue ahí | `docker ps -a` y el estado `Exited (0)`: un contenedor parado sigue existiendo |
| 11 | DKR-11 | Y ahora sí, elimínalo | `docker rm`; al borrarlo se libera también el nombre |

### Fase 3 · Datos

| # | Código | Tarea | Qué se practica |
|---|--------|-------|-----------------|
| 12 | DKR-12 | La base de datos, a la primera | `docker run` sin variables: el contenedor arranca y muere al instante |
| 13 | DKR-13 | ¿Por qué se ha caído? | `docker logs`: diagnosticar en lugar de adivinar |
| 14 | DKR-14 | Quita el contenedor muerto | `docker rm`; el nombre estaba ocupado por el contenedor caído |
| 15 | DKR-15 | Un sitio donde guardar los datos | `docker volume create` y `docker volume ls` |
| 16 | DKR-16 | La base de datos, bien puesta | `-e CLAVE=valor` y `-v volumen:/ruta` en la misma orden |
| 17 | DKR-17 | Mira dentro del contenedor | `docker exec` para ejecutar algo dentro sin entrar |

### Fase 4 · Imagen propia

| # | Código | Tarea | Qué se practica |
|---|--------|-------|-----------------|
| 18 | DKR-18 | La receta de nuestra imagen | Leer un `Dockerfile`: `FROM`, `COPY`, `EXPOSE` y `CMD` |
| 19 | DKR-19 | Construye la imagen | `docker build -t nombre:versión .` y el **contexto** (ese punto final) |
| 20 | DKR-20 | Ahí está tu imagen | `docker images`: la propia junto a las oficiales; hereda las capas de su base |
| 21 | DKR-21 | Levanta la intranet | `docker run` con la imagen construida por ti |
| 22 | DKR-22 | Dos contenedores, un puerto | «port is already allocated»: un puerto del anfitrión, un solo contenedor |

### Fase 5 · Compose

| # | Código | Tarea | Qué se practica |
|---|--------|-------|-----------------|
| 23 | DKR-23 | Toda la pila en un fichero | Leer `compose.yaml`: servicios, imágenes, puertos, variables y volúmenes |
| 24 | DKR-24 | Levanta la pila | `docker compose up -d`: tres servicios, una red propia y nombres `pila-web-1` |
| 25 | DKR-25 | Comprueba la pila | `docker compose ps`: la vista del proyecto, no la del servidor entero |
| 26 | DKR-26 | Y recógela | `docker compose down`: **los volúmenes con nombre no se borran** |

## Órdenes disponibles

| Tipo | Órdenes |
|---|---|
| Imágenes | `docker images` · `docker image ls`, `docker pull <img>[:<tag>]`, `docker build -t <nombre>:<versión> <contexto>`, `docker rmi <img>` |
| Contenedores | `docker run [-d] [--name] [-p h:c] [-e K=V] [-v vol:/ruta] [--rm] [-it] [--network] [--restart] <img> [orden]`, `docker ps [-a]` · `docker container ls`, `docker logs [--tail N] <c>`, `docker exec <c> <orden>`, `docker stop\|start\|restart <c>`, `docker rm [-f] [-v] <c>`, `docker inspect <c>` |
| Datos y redes | `docker volume create\|ls\|rm`, `docker network create\|ls\|connect\|disconnect` |
| Pilas | `docker compose up [-d]`, `docker compose ps`, `docker compose logs`, `docker compose down [-v]` (también la forma antigua `docker-compose`) |
| Sistema | `docker version`, `docker info`, `docker system prune`, `docker` sin argumentos (la ayuda del cliente) |
| Ficheros | `ls [-la]`, `cd`, `pwd`, `cat`, `less`, `head`, `tail`, `wc`, `file`, `stat`, `tree`, `find`, `grep`, `mkdir`, `rmdir`, `touch`, `cp`, `mv`, `rm`, `echo`, `nano` |
| Sistema y ayuda | `id`, `whoami`, `groups`, `chmod`, `chown`, `umask`, `date`, `which`, `sudo`, `history`, `clear`, `man <orden>`, `help` |
| Composición | Encadenado con `&&`, `\|\|` y `;`; tuberías con `\| grep [-i] [-v] [-n] [-c]`, `\| head`, `\| tail`, `\| wc`, `\| sort`, `\| uniq`; redirecciones `>` y `>>`; comodines (`*.yaml`); comillas simples y dobles |

Atajos: <kbd>↑</kbd>/<kbd>↓</kbd> historial, <kbd>Tab</kbd> autocompletar (órdenes y
ficheros), <kbd>Ctrl</kbd>+<kbd>L</kbd> limpiar, <kbd>Ctrl</kbd>+<kbd>C</kbd> cancelar la
línea. Con la línea vacía, <kbd>Tab</kbd> sale de la terminal al resto de la página.
En `nano`: <kbd>Ctrl</kbd>+<kbd>O</kbd> guardar, <kbd>Ctrl</kbd>+<kbd>X</kbd> salir,
<kbd>Ctrl</kbd>+<kbd>K</kbd> cortar línea, <kbd>Ctrl</kbd>+<kbd>U</kbd> pegar (también hay
botones).

## Cómo se diseñó

### Principios que guiaron las decisiones

- **Docker de verdad, no un Docker de juguete.** Las tablas de `docker ps` y `docker images`
  tienen las columnas y los anchos reales; `pull` baja las capas una a una y termina con su
  `Digest`; `run -d` devuelve el identificador largo; los errores son los del motor
  («Error response from daemon: …», «port is already allocated», «container is running:
  stop the container before removing or force remove», «pull access denied»). Si el alumnado
  repite después estas órdenes en una máquina real, verá lo mismo.
- **El simulador no enseña cosas falsas.** `docker stop` no borra el contenedor y `docker ps`
  deja de mostrarlo, pero `docker ps -a` lo encuentra; el nombre sigue ocupado hasta que se
  hace `rm`; `docker rm` se niega con un contenedor en marcha si no se fuerza; `docker rmi`
  se niega si una imagen está en uso; `docker volume rm` se niega si un contenedor la tiene
  montada; `docker run` descarga sola la imagen que falta; una imagen sin etiqueta es
  `:latest`; y `docker compose down` **no** borra los volúmenes con nombre.
- **Los errores son el contenido, no un accidente.** Tres tareas consisten exactamente en
  provocar un fallo y entenderlo: la base de datos sin contraseña (DKR-12 y DKR-13), el
  puerto ya ocupado (DKR-22) y, de fondo, la pérdida de datos que motiva el volumen
  (DKR-15 y DKR-16). Un contenedor que muere sin explicación es la experiencia real de
  cualquiera que empieza; aquí se convierte en un método: **cuando algo se cae, se leen sus
  registros**.
- **Primero el problema, después la herramienta.** Compose no aparece como «lo siguiente del
  temario», sino después de haber levantado tres contenedores a mano y haber comprobado que
  eso no es forma de trabajar. El `Dockerfile` llega cuando la imagen oficial ya no basta.
- **Las decisiones tienen consecuencias.** Borrar el volumen de datos, eliminar contenedores
  con `-v`, levantar una base de datos sin volumen o desplegar con `latest` no están
  prohibidos: están permitidos, explicados, penalizados y anotados. El objetivo es
  desarrollar criterio, no impedir errores.
- **Las fichas no dan la respuesta.** Describen la situación y el objetivo en lenguaje
  profesional; la orden literal solo aparece en la tercera pista. La guía de Docker explica
  los conceptos y las opciones, pero nunca resuelve la tarea en curso.

### Qué se decidió no hacer, y por qué

| Decisión | Motivo |
|---|---|
| **Sin panel visual de contenedores**, a diferencia del grafo de *Versionando con Git* | Ahí el panel era imprescindible porque el modelo de Git es invisible; aquí la vista canónica ya existe y es `docker ps`. Dibujarla aparte enseñaría a mirar el dibujo en vez de a leer la salida real |
| **Sin `-it` interactivo dentro del contenedor** | Una sesión `sh` dentro del contenedor exigiría un segundo sistema de ficheros simulado por imagen; `docker exec <c> <orden>` transmite la misma idea (ejecutar algo *dentro*) sin ese coste |
| **Registro de imágenes cerrado** (`nginx`, `mariadb`, `redis`, `alpine`) | Son las suficientes para la pila y para trastear. Un registro abierto obligaría a inventar salidas para cualquier imagen y abriría la puerta a callejones sin salida |
| **Sin cuenta atrás** | Con contenedores, la prisa lleva a `-f`, a `--force` y a borrar volúmenes. El reloj cuenta hacia arriba y es informativo |
| **Progreso no persistente** | No se usa `localStorage` ni cookies; a cambio, el **selector de fase** permite retomar el reto por donde se quedó |

### Evolución respecto a los retos anteriores

| | *Blindaje de la Red* | *Versionando con Git* | *Contenedores con Docker* |
|---|---|---|---|
| Reto | 7 misiones, 10-20 min | 30 misiones en 5 fases, 45-70 min | 26 tareas en 5 fases, 30-45 min |
| Simulador propio | Servicios, puertos y cortafuegos | Objetos, ramas, fusiones y remoto | Imágenes, contenedores, puertos, volúmenes, redes, `build` y Compose |
| Base común | Terminal y motor de misiones | Terminal, `nano` e intérprete completo | **`RG.Sandbox`**: sistema de ficheros, usuarios, órdenes POSIX y arranque comunes |
| Errores provocados | El servicio legítimo que no hay que tumbar | El *push* rechazado y el conflicto | La base de datos sin variable y el puerto ocupado |
| Personajes | El SOC | Iker y Nayra | Nayra (sistemas) y Carla (desarrollo) |

## Elementos de gamificación

Relación con los **12 componentes** vistos en el curso *La gamificación educativa* (solo se
usan los que encajan):

| Componente | ¿Se usa? | Cómo | Por qué |
|---|---|---|---|
| **Misiones** | ✅ | 26 tareas encadenadas (DKR-01…DKR-26) agrupadas en 5 fases | Se habla de tareas de una migración, nunca de ejercicios |
| **Sorpresa** | ✅ | Contenedores que mueren al instante, puertos que ya están ocupados, avisos por decisiones peligrosas | El desconcierto es el punto de partida del diagnóstico |
| **Desbloqueo de contenido** | ✅ | Cada tarea se revela al completar la anterior | Hay que avanzar para descubrir qué viene |
| **Puntos (XP)** | ✅ | 75-200 XP por tarea, −25 por pista, −50 por decisión arriesgada, +25 por adelantarse | *Feedback* inmediato; las pistas cuestan, pero nunca bloquean |
| **Niveles** | ✅ | Primer contenedor → Maneja el ciclo de vida → No pierde los datos → Despliega la pila | Los nombres describen **lo que ya sabes hacer**, no un rango honorífico |
| **Insignias** | ✅ | 6 insignias ligadas a buenas prácticas (ver abajo) | Reconocen *cómo* se ha trabajado, no solo terminar |
| **Barra de progreso** | ✅ | Progreso por fases, contador de tarea y registro lateral | Ver el avance anima a seguir |
| **Recompensas** | ✅ | Pistas «compradas» con XP y guía de Docker siempre disponible | La ayuda existe, pero hay que decidir si compensa |
| **Tablero de clasificación** | ❌ | — | Deliberadamente no: el informe es individual y no se envía a ninguna parte |
| **Cuenta atrás** | ❌ | Reloj que cuenta hacia arriba, sin límite | Con contenedores, la prisa se paga borrando datos |
| **Avatar** | ❌ | — | No aporta; la identidad es la de Ana, con su grupo `docker` y sus permisos |
| **Poder** | ❌ | — | No encaja: aquí no se compite ni se afecta a nadie más |

**Insignias**: 🛡️ *Sin pérdidas* (ninguna decisión arriesgada), 🧠 *Autosuficiente* (sin
pistas), 📚 *Lee el manual* (consultar al menos una página de `man`), 🪵 *Lee los registros*
(diagnosticar el contenedor caído con `docker logs`), 💾 *Datos a salvo* (montar un volumen
con nombre para la base de datos), ⚡ *Buen ritmo* (terminar en menos de 32 minutos).

### Perfiles de jugador (Bartle)

- **Explorer**: hay mucho que no pide ninguna tarea y funciona igual: `docker inspect`,
  `docker info`, `docker system prune`, `docker network create`/`ls`, `docker compose logs`,
  las imágenes `redis:7` y `alpine:3.20` del registro, `docker exec` con otras órdenes,
  `man` de casi todo y el sistema de ficheros entero.
- **Achiever**: XP, cuatro niveles, seis insignias y un informe final con la orden exacta
  que resolvió cada tarea.
- **Killer**: tiempo y nivel final, sin tablero público; se pueden comparar informes.
- **Socializer**: el trabajo en parejas y la puesta en común, fuera del juego.

### Estado de *flow*

La dificultad sube en escalones cortos y siempre sobre lo ya conocido: primero una orden
suelta (`version`, `images`), después la primera con opciones (`run -d --name -p`), después
el ciclo completo sobre un contenedor que ya existe, y solo entonces los dos conceptos
difíciles (variables de entorno y volúmenes), la imagen propia y la pila. Las **fases**
marcan mesetas donde consolidar, y el **selector de fase** permite entrar en el nivel de
reto adecuado a cada persona. Para evitar la frustración: tres pistas graduadas, ningún
límite de tiempo, ninguna acción bloqueada y ningún estado sin salida (siempre se puede
parar, borrar y volver a empezar el contenedor que sea).

## Accesibilidad, inclusión y protección de datos

### Accesibilidad

- **Todo se maneja con teclado**, incluido el editor. Con la línea vacía, <kbd>Tab</kbd>
  sale de la terminal al resto de la página, así que el autocompletado no atrapa el foco.
- **Lectores de pantalla**: la salida de la terminal es un `role="log"`; una región
  `role="status"` independiente anuncia solo lo importante (nueva tarea con su objetivo,
  tarea completada, pistas y ascensos de nivel).
- **Nunca solo color**: los estados combinan color, icono y texto, tanto en la barra de
  fases como en el registro lateral y en el informe.
- **Contraste alto** sobre fondo oscuro, foco visible y tipografía monoespaciada.
- **Movimiento reducido**: con `prefers-reduced-motion` se quitan las animaciones y se
  acortan las esperas entre tareas.
- **Modales accesibles**: la guía de Docker atrapa el foco, se cierra con <kbd>Esc</kbd> y
  devuelve el foco al botón que la abrió.
- **Adaptable**: en pantallas estrechas el panel se coloca sobre la terminal. Comprobado a
  400 px de ancho, sin scroll horizontal.

### Inclusión

- **Cada cual a su ritmo**: sin tiempo límite; el reloj es informativo.
- **Ayuda graduada**: tres pistas por tarea, guía de Docker siempre disponible, `help` con
  las órdenes agrupadas por tipo y `man` dentro del juego.
- **Se puede empezar por cualquier fase**, lo que permite repartir el reto en varias
  sesiones o adaptar el punto de partida a cada persona.
- **Sin castigo definitivo**: se puede reiniciar sin penalización y ninguna acción deja el
  servidor en un estado del que no se pueda salir.
- **Tono y lenguaje**: español correcto, mensajes que orientan en lugar de culpar y nombres
  de nivel que describen destrezas.

### Protección de datos y uso responsable

- **No recoge ningún dato personal**: no hay registro, ni nombre, ni correo.
- **No envía nada a ningún servidor** ni usa cookies ni almacenamiento del navegador: el
  progreso vive en memoria y desaparece al cerrar la pestaña.
- **No depende de servicios externos** (ni CDN, ni fuentes web, ni analítica).
- **Es una simulación**: el «registro de imágenes», el demonio y los contenedores están en
  la propia página; no se descarga nada ni se contacta con Docker Hub.
- La contraseña `Atl4nte` que se escribe en `-e MARIADB_ROOT_PASSWORD=…` es un buen momento
  para hablar de que **las credenciales acaban en el historial del shell y en `docker
  inspect`**, y de por qué en producción se usan ficheros de entorno o secretos.

## Uso en el aula

**Antes**
- Pregunta de arranque: «si mañana hay que mover este servicio a otra máquina, ¿quién sabría
  reproducirlo?». Es exactamente el encargo del reto.
- Presentar el vocabulario mínimo: imagen, contenedor, volumen, registro y puerto publicado.
- Dejar claro desde el principio que **imagen ≠ contenedor**: es la confusión que más cuesta
  deshacer después.

**Durante**
- Individual o **en parejas** (una persona teclea y la otra consulta la guía y los `man`; se
  cambia de rol en cada fase).
- Sugerencia de reparto: fases 1 y 2 en una sesión, 3 y 4 en otra y la 5 en una tercera,
  usando el **selector de fase** de la portada.
- El docente circula y pregunta en lugar de resolver: «¿por qué no sale en `docker ps`?»,
  «¿dónde está escribiendo ahora mismo esa base de datos?», «¿qué pasa si borro este
  contenedor?».
- Insistir en la rutina: **si algo se cae, `docker logs` antes que nada**.

**Después**
- **Puesta en común**: ¿qué pasó exactamente en DKR-12 y por qué? ¿Qué se pierde y qué se
  salva al hacer `docker rm`? ¿Y al hacer `docker compose down`? ¿Por qué `nginx:1.27` y no
  `nginx`? ¿Quién resolvió el conflicto de puerto de otra forma?
- **Evidencia para el aula virtual**: captura del informe final.
- **Ampliación**: repetir la pila en una máquina real con Docker instalado, y comprobar que
  las mismas órdenes producen las mismas salidas; añadir un servicio al `compose.yaml`;
  escribir un `Dockerfile` propio para un proyecto de clase.

## Detalles técnicos

HTML semántico, CSS y JavaScript *vanilla* (sin *frameworks*, sin dependencias, sin *build*
y sin módulos ES, para que funcione también con `file://`). El reto comparte con el resto del
repositorio la biblioteca [`shared/`](../shared/) (espacio de nombres `RG`): terminal,
intérprete de órdenes, editor `nano`, páginas de manual, modales accesibles, sistema de
ficheros virtual, órdenes POSIX y motor de misiones.

| Fichero | Contenido |
|---|---|
| `index.html` | Solo el marcado de las tres pantallas, el editor y la guía rápida de Docker |
| `css/reto.css` | Lo específico del reto sobre los estilos comunes |
| `data/config.js` | El escenario: `srv-docker`, la usuaria `ana` y su grupo `docker`, el registro de imágenes, `~/encargo.txt`, `~/intranet` (con el `Dockerfile`) y `~/pila` (con el `compose.yaml`) |
| `data/gamification.js` | Las 5 fases, el coste de las pistas, la penalización, los 4 niveles y las 6 insignias |
| `data/missions.js` | El contenido de las 26 tareas (situación, objetivo y tres pistas), sin lógica |
| `js/missions.js` | La comprobación (`check`) y la `solution` de cada tarea, y la vigilancia de las decisiones arriesgadas |
| `js/main.js` | Monta `RG.Sandbox` con el motor de contenedores, la ayuda, la secuencia de arranque, las insignias propias y el texto del informe |
| `../shared/js/docker.js` | **El motor de contenedores**, que este reto aporta a la biblioteca común |

Claves del diseño:

- **Motor de contenedores en memoria** (`RG.Docker` y `RG.DockerState`), montado sobre el
  sistema de ficheros virtual. Modela el registro remoto, las imágenes descargadas (con sus
  capas, su identificador, su tamaño y sus registros), los contenedores (estado, código de
  salida, puertos publicados, variables, montajes, red y orden), los volúmenes y las redes.
  Los identificadores hexadecimales son deterministas, así que las partidas son reproducibles.
- **Las reglas del motor son las que enseñan**: un puerto del anfitrión solo lo puede publicar
  un contenedor a la vez; una imagen puede declarar variables de entorno obligatorias
  (`requiredEnv`) y, si faltan, el contenedor arranca, escribe sus `errorLogs` y sale con
  código 1; un contenedor en marcha no se borra sin `-f`; una imagen en uso no se borra; un
  volumen montado no se borra.
- **Construcción real desde el `Dockerfile`**: `docker build` lee el fichero del contexto,
  interpreta `FROM`, `EXPOSE` y `CMD`, descarga la imagen base si falta y registra la imagen
  resultante heredando de ella.
- **Docker Compose**: analiza `compose.yaml` (`image`, `ports`, `environment` y `volumes`),
  crea la red `<proyecto>_default` y nombra los contenedores **`<proyecto>-<servicio>-1`**,
  igual que la herramienta real, de modo que no chocan con los creados a mano.
- **Comprobaciones por eventos y por estado**: cada orden emite un evento
  (`{type:"docker", sub:"run", …}`) que el motor de misiones contrasta; las tareas que piden
  *consultar* algo miran el evento, y las que piden *conseguir* algo miran el estado del
  motor. De ahí que haya varias formas válidas de resolverlas.
- **Contenido separado de la lógica**: los textos viven en `data/missions.js` (datos puros,
  editables por el profesorado) y su lógica en `js/missions.js`, emparejados por el código
  `DKR-xx` que se asigna por posición.
- **Añadir o cambiar una tarea**: editar `data/missions.js` (y `data/gamification.js` si se
  añade una fase) y su `check`/`solution` en `js/missions.js`. Toda la interfaz (progreso,
  ficha, registro e informe) se genera a partir de esos datos.

## Verificación

Se ha probado en **Chrome real en modo *headless***, manejado por el protocolo DevTools
(CDP) desde Node.js, con un guion que simula a una persona jugando: **42 comprobaciones,
todas superadas y sin ningún error de JavaScript**. Se ejecuta con:

```bash
node .claude/skills/verificar-reto/scripts/run.mjs test-docker
```

Cubre:

- la **partida completa**, resolviendo las 26 tareas con las órdenes que propone cada ficha;
- el **comportamiento del motor**: servidor sin imágenes al empezar, imagen inexistente
  rechazada como en el registro real y subcomando inventado respondido como lo hace `docker`;
- el **estado final**: las tres imágenes (las dos oficiales y la propia), el volumen de datos
  intacto después de `docker compose down`, los contenedores sueltos en marcha y la pila
  recogida;
- las **negativas del motor**: no deja borrar un volumen en uso, ni un contenedor en marcha
  sin forzar, ni una imagen que un contenedor está usando;
- el **informe final**: XP por encima de 2800, las 26 filas, ninguna decisión arriesgada y al
  menos 5 insignias cuando se juega sin pistas;
- **empezar en una fase posterior**, comprobando que el servidor queda preparado, y que
  borrar el volumen con los datos se anota como **decisión arriesgada**.

El guion forma parte de la batería común del repositorio, que se lanza entera con
`node .claude/skills/verificar-reto/scripts/run.mjs`.

## Limitaciones conocidas

- **No hay red de verdad**: los puertos se publican, se reservan y chocan entre sí, pero no
  se puede abrir la intranet en el navegador ni hacer `curl` contra `localhost:8080`. Tampoco
  se comunican entre sí los contenedores de una misma red.
- **No hay procesos reales dentro de los contenedores**: `docker exec` responde con las
  salidas registradas en cada imagen, y con cualquier otra orden avisa de que no hay salida
  registrada. Por el mismo motivo no hay sesión interactiva (`-it … sh`) ni `docker logs -f`
  siguiendo el registro en tiempo real.
- **El análisis del `compose.yaml` es parcial**: cubre `image`, `ports`, `environment` y
  `volumes` de cada servicio, pero **no** `depends_on`, `build`, `healthcheck`, `networks` ni
  `restart`. Un fichero con esas claves se lee, pero se ignoran. La sección `volumes:` de primer
  nivel se declara en el escenario, como exige Compose, aunque el simulador crea los volúmenes a
  partir de los montajes de cada servicio.
- **El registro de imágenes es una lista cerrada**: `nginx:1.27`, `mariadb:11`, `redis:7` y
  `alpine:3.20`. Cualquier otra responde con `pull access denied`, igual que una imagen que
  no existe de verdad.
- **El `Dockerfile` se interpreta, no se ejecuta**: se leen `FROM`, `EXPOSE` y `CMD`; `RUN` y
  `COPY` se muestran como pasos de la construcción, pero no modifican el contenido de la
  imagen resultante. Tampoco hay caché de capas ni construcciones multietapa.
- No están `docker cp`, `docker stats`, `docker top`, `docker tag`, `docker push`,
  `docker login` ni los modos interactivos.
- El progreso **no se guarda**: al recargar se empieza de cero (intencionado, para no
  almacenar datos). El selector de fase permite retomar el reto por donde se quedó.

## Archivos

| Archivo | Contenido |
|---|---|
| [`index.html`](index.html) | Marcado de las tres pantallas, el editor y la guía rápida de Docker |
| [`css/`](css/) · [`data/`](data/) · [`js/`](js/) | Estilos propios · escenario, gamificación y textos de las tareas · lógica de las tareas y arranque |
| [`../shared/`](../shared/) | Biblioteca común: terminal, intérprete, editor, manuales, modales, sistema de ficheros, órdenes POSIX, motor de misiones y **motor de contenedores** |
| [`README.md`](README.md) | Este documento |

## Créditos

Made with 💖 by [@fvarrui](https://github.com/fvarrui) & [Claude](https://claude.ai).

Diseñado como reto digital de elaboración propia para el curso *La gamificación educativa*,
dentro de la propuesta «Operación Escudo Digital».
