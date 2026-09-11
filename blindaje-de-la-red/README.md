# Blindaje de la Red

> Simulador gamificado de respuesta a incidentes en una terminal Linux.
> Reto digital de elaboración propia de la mini experiencia gamificada **«Operación Escudo Digital»**.

---

## Índice

1. [Qué es](#qué-es)
2. [Cómo abrirlo](#cómo-abrirlo)
3. [Contexto educativo](#contexto-educativo)
4. [Objetivos de aprendizaje](#objetivos-de-aprendizaje)
5. [Cómo funciona](#cómo-funciona)
6. [Cómo se diseñó](#cómo-se-diseñó)
7. [Elementos de gamificación](#elementos-de-gamificación)
8. [Accesibilidad, inclusión y protección de datos](#accesibilidad-inclusión-y-protección-de-datos)
9. [Uso en el aula](#uso-en-el-aula)
10. [Detalles técnicos](#detalles-técnicos)
11. [Verificación](#verificación)
12. [Limitaciones conocidas](#limitaciones-conocidas)
13. [Archivos](#archivos)
14. [Créditos](#créditos)

---

## Qué es

*Blindaje de la Red* es un juego educativo que se ejecuta en el navegador. El alumnado se
conecta por SSH (simulado) al servidor comprometido de una empresa ficticia,
**TecnoAtlántica**, y debe contener un ciberataque **escribiendo comandos reales de
administración de sistemas Linux**: `ss`, `netstat`, `ps`, `systemctl`, `kill`, `ufw`,
`iptables`…

No hay botones que digan qué hacer: la herramienta es la terminal. Las amenazas llegan
**de una en una y por sorpresa**, como alertas del centro de operaciones de seguridad
(SOC). Cada alerta describe un **síntoma** («el IDS ha capturado contraseñas viajando sin
cifrar»), no la solución: hay que investigar, deducir qué servicio es el responsable y
contenerlo **sin tumbar los servicios que la empresa necesita**.

Funciona sin conexión a Internet, sin instalar nada y sin servidor.

## Cómo abrirlo

- **En local**: doble clic en [`index.html`](index.html). Funciona en cualquier navegador
  moderno (Chrome, Edge, Firefox, Safari).
- **En el aula virtual (EVAGD/Moodle)**: subir la carpeta completa del reto **junto con la
  carpeta [`shared/`](../shared/)** (por ejemplo, en un ZIP con las dos) y enlazar
  `blindaje-de-la-red/index.html`. El reto usa CSS y scripts clásicos, sin módulos ES ni
  `fetch`, así que también funciona desde el sistema de ficheros.
- **En la web**: publicar el repositorio con GitHub Pages o cualquier alojamiento estático.
  No necesita *backend*.

Una partida dura entre 10 y 20 minutos.

## Contexto educativo

| | |
|---|---|
| **Temas** | Redes · Servicios · Seguridad · Linux |
| **Encaja en** | Cualquier materia o curso que trabaje administración de sistemas, servicios de red o seguridad informática |
| **Punto de partida** | Saber moverse por una terminal; no hace falta experiencia previa en seguridad |
| **Experiencia** | «Operación Escudo Digital»: el alumnado, como *Blue Team*, recupera el control de los sistemas de TecnoAtlántica en 4 misiones |
| **Este reto** | Prototipo digital de la **Misión 3 · Blindaje de la red** (identificar y cerrar servicios y puertos inseguros) |
| **Modalidad** | Presencial, con apoyo del aula virtual. También sirve en línea, de forma autónoma |

Se desarrolló como evidencia del punto 9 de la tarea final del curso *La gamificación
educativa* («un ejemplo de un reto digital de elaboración propia»).

## Objetivos de aprendizaje

Al terminar el reto, el alumnado debería ser capaz de:

1. **Identificar** los servicios en escucha de un servidor y relacionar cada **puerto**
   con su **servicio** y su **proceso** (PID), usando `ss`/`netstat` y `ps`.
2. **Evaluar** qué servicios suponen un riesgo (protocolos sin cifrar, accesos anónimos,
   software sin parches, servicios expuestos innecesariamente) y cuáles son legítimos.
3. **Aplicar** distintas técnicas de contención y **distinguir sus efectos**:
   detener un servicio (`systemctl stop`, `kill`), impedir que arranque
   (`systemctl disable`) o filtrar su tráfico con un cortafuegos (`ufw`, `iptables`).
4. **Actuar con criterio profesional**: observar antes de actuar, minimizar el impacto
   sobre el negocio y **verificar** el resultado final.

## Cómo funciona

### Las tres pantallas

1. **Portada (briefing)**: comunicado urgente de la dirección de seguridad, reglas del
   juego en cuatro tarjetas y botón «Conectar al servidor». También da acceso a la guía
   de comandos.
2. **Juego**: la terminal ocupa casi toda la pantalla. Arriba, una barra compacta con
   los indicadores de alertas (`?` hasta que se revelan), el reloj, la XP y el nivel. En
   el lateral, la **ficha de la misión actual** y el registro de alertas ya resueltas.
3. **Informe de misión**: resultado, XP, rango, tiempo, pistas usadas, insignias, tabla
   con el comando con que se resolvió cada alerta y decisiones arriesgadas.

### El desarrollo de una partida

Al conectar se reproduce una secuencia SSH realista. A partir de ahí, las misiones
llegan **de una en una**. Al completar una, a los pocos segundos:

- aparece en la terminal un mensaje del SOC (`Broadcast message from soc@tecnoatlantica…`),
- el borde de la terminal parpadea en rojo,
- y la nueva ficha **entra de golpe** en el lateral.

| # | Código | Misión | Síntoma que describe la ficha | Qué hay que hacer |
|---|--------|--------|-------------------------------|-------------------|
| 0 | BT-00 | Reconocimiento inicial | Orden del Blue Team: no actuar a ciegas | Listar los puertos en escucha |
| 1 | SOC-1041 | Credenciales en texto plano | El IDS captura contraseñas sin cifrar | Contener Telnet (23/tcp) |
| 2 | SOC-1042 | Descargas sin identificarse | Un auditor descarga ficheros como «anonymous» | Contener FTP (21/tcp) |
| 3 | SOC-1043 | El portal olvidado | Portal de 2019 sin parches y bots en /admin | Contener HTTP (80/tcp) **sin tocar** HTTPS (443) |
| 4 | SOC-1044 | Campaña de ransomware | El CERT avisa de un ataque tipo WannaCry | Contener SMB (445/tcp) |
| 5 | SOC-1045 | Fuerza bruta en curso | 4000 intentos de acceso al escritorio remoto | Contener RDP (3389/tcp) |
| 6 | BT-99 | Verificación final | La dirección pide una prueba del estado final | Volver a listar los puertos |

El servidor tiene además tres servicios **legítimos** que no deben tocarse: SSH (22),
la web corporativa HTTPS (443) y MySQL (3306, solo en *localhost*).

### Mecánicas clave

- **Observar antes de actuar**: cualquier acción de contención antes de hacer el
  reconocimiento (`ss`/`netstat`) se rechaza con un mensaje que lo explica.
- **Varias soluciones válidas**: cada amenaza puede contenerse con cualquier técnica real
  (`systemctl stop`, `systemctl disable --now`, `service … stop`, `kill <PID>`,
  `ufw deny`, `iptables … -j DROP`). El informe final recoge cuál se usó.
- **Pistas progresivas**: cada ficha tiene tres pistas, de más general a casi la
  solución. Cada una reduce 25 XP la recompensa de esa misión.
- **Consecuencias**: detener o bloquear un servicio legítimo se permite (como en la
  vida real), pero avisa, resta 50 XP y queda anotado como «decisión arriesgada».
- **Resolución proactiva**: si alguien contiene una amenaza antes de que llegue su
  alerta, la alerta aparece igualmente, pero se resuelve sola con un bonus.
- **`exit`** cierra la sesión y reconecta automáticamente, sin perder el progreso.

### Comandos disponibles

| Tipo | Comandos |
|---|---|
| Diagnóstico | `ss`, `netstat` (con `-t -u -l -p -n`), `ps aux`, `systemctl status`, `systemctl is-active` |
| Contención | `systemctl stop`, `systemctl disable [--now]`, `service <servicio> stop`, `kill [-9] <PID>`, `ufw deny\|reject <puerto>`, `iptables -A INPUT -p tcp --dport <puerto> -j DROP` |
| Consulta | `ufw status`, `iptables -L -n`, `man <comando>`, `history`, `help` |
| Ambientación | `ls [-la]`, `cat informe_incidente.txt`, `cat .bash_history`, `whoami`, `id`, `uname -a`, `hostname`, `pwd`, `date`, `uptime`, `echo`, `clear`, `exit`, `sudo` |
| Composición | Encadenado con `&&` y `;`; tuberías con `\| grep [-i] [-v]`, `\| head`, `\| tail`, `\| wc`, `\| sort` |

Atajos: <kbd>↑</kbd>/<kbd>↓</kbd> historial, <kbd>Tab</kbd> autocompletar,
<kbd>Ctrl</kbd>+<kbd>L</kbd> limpiar, <kbd>Ctrl</kbd>+<kbd>C</kbd> cancelar la línea.

## Cómo se diseñó

### Punto de partida: el canvas de gamificación

Siguiendo el canvas del curso, el orden de decisiones fue:

1. **Primero los aprendizajes**: los objetivos son los de la gestión de servicios y la
   seguridad básica de red. El juego se construyó alrededor de ellos, no al revés.
2. **Perfil del alumnado y narrativa, a la vez**: alumnado que empieza en administración de
   sistemas, con interés por la ciberseguridad y los *hackers*. De ahí la narrativa de Blue
   Team defendiendo una empresa, con un antagonista difuso («alguien lleva días buscando una
   puerta abierta»).
3. **Estética coherente con la narrativa**: todo es una consola. Fondo casi negro,
   tipografía monoespaciada, colores de terminal (verde, ámbar, rojo) y un comunicado
   con sello «URGENTE» en la portada. La ficha de alerta toma el color de su gravedad.

### Principios que guiaron las decisiones

- **La terminal es la protagonista.** Ocupa casi toda la pantalla y es la única forma de
  actuar. Todo lo demás (ficha, XP, nivel) es contexto. La salida de la terminal y la
  línea de órdenes comparten **un único scroll**, como en una terminal de verdad.
- **Descubrir, no elegir.** La primera versión mostraba la lista de puertos y había que
  pulsar «mantener» o «cerrar». Ahora el alumnado no sabe qué problemas hay: tiene que
  descubrirlos. Las fichas dan síntomas y el puerto hay que deducirlo.
- **Sorpresa dosificada.** Las alertas llegan de una en una. Mantiene la tensión
  narrativa, evita abrumar con todo el problema de golpe y deja trabajar cada concepto
  por separado.
- **Realismo técnico, porque se aprende lo que se practica.** Las salidas imitan las
  reales (formatos de `ss` y `netstat`, mensajes de `systemctl`, `kill` y `iptables`
  silenciosos cuando tienen éxito…). Y, sobre todo, el simulador **no enseña cosas
  falsas**:
  - un cortafuegos **no detiene** el servicio: el proceso sigue vivo y en LISTEN, solo
    se descarta el tráfico entrante;
  - `systemctl disable` **no detiene** el servicio, solo evita que arranque al reiniciar;
  - bloquear con el cortafuegos un puerto que solo escucha en `localhost` no cambia nada.

  En los tres casos, el juego lo explica en el momento.
- **El error es parte del aprendizaje.** Los mensajes de error no dan la respuesta, pero
  orientan («un Blue Team no actúa a ciegas: ejecuta antes `ss -tulpn`…»). Se puede
  reiniciar en cualquier momento sin penalización.
- **Varias soluciones correctas.** No hay un único comando válido: se premia la
  variedad (insignia *Multiherramienta*) y el informe final permite comparar enfoques en
  clase.
- **Las decisiones tienen consecuencias.** En la vida real nadie impide apagar SSH. Aquí
  tampoco: se permite, pero cuesta XP y queda en el informe. El objetivo es desarrollar
  criterio, no memorizar qué botón pulsar.

### Evolución del diseño (proceso en espiral)

Como propone el curso, el diseño fue iterativo:

| Versión | Qué era | Qué se aprendió |
|---|---|---|
| **v1** | Tarjetas de 8 puertos con botones «Mantener abierto / Cerrar» y *feedback* inmediato | Funciona, pero es un test: el alumnado ve toda la información de golpe y no practica ningún comando |
| **v2** | Emulador de terminal con comandos reales; 5 retos visibles en un panel lateral | Mucho más auténtico, pero el panel revelaba todos los problemas desde el principio, y el cortafuegos «hacía desaparecer» los servicios (técnicamente incorrecto) |
| **v3** (actual) | Tres pantallas, alertas de una en una por sorpresa, fichas con síntomas, XP, niveles, pistas e insignias, y la terminal con todo el protagonismo | — |

## Elementos de gamificación

Relación con los **12 componentes** vistos en el curso (solo se usan los que encajan):

| Componente | ¿Se usa? | Cómo | Por qué |
|---|---|---|---|
| **Misiones** | ✅ | 7 misiones encadenadas con código de alerta (BT-00, SOC-1041…) | Se habla de misiones y alertas, nunca de ejercicios |
| **Sorpresa** | ✅ | Las alertas llegan sin aviso, con mensaje del SOC, parpadeo y animación | Mantiene la tensión y la curiosidad |
| **Desbloqueo de contenido** | ✅ | Cada misión solo se revela al completar la anterior; los indicadores muestran `?` | No se sabe qué viene después: hay que avanzar para descubrirlo |
| **Puntos (XP)** | ✅ | 50 / 100 por misión, bonus por proactividad, penalización por daños | *Feedback* cuantitativo inmediato. Las pistas y los errores tienen coste, pero nunca bloquean |
| **Niveles** | ✅ | Aprendiz → Analista junior → Analista senior → Escudo digital | Niveles **vinculados a la narrativa**, no numerados sin más |
| **Insignias** | ✅ | 6 insignias ligadas a buenas prácticas (ver abajo) | Reconocen cómo se ha jugado, no solo si se ha terminado |
| **Barra de progreso** | ✅ | Indicadores de alertas en la barra superior y registro lateral | Ver el avance anima a seguir |
| **Recompensas** | ✅ | Pistas «compradas» con XP de la recompensa; bonus proactivo | La ayuda existe, pero hay que decidir si merece la pena |
| **Tablero de clasificación** | ❌ | — | Deliberadamente no: puede desmotivar a quien va más lento. El informe es individual |
| **Cuenta atrás** | ❌ | Hay un reloj que cuenta hacia arriba, sin límite | Una cuenta atrás invita a ir con prisa y de forma superficial. La insignia *Respuesta rápida* es opcional y no penaliza |
| **Avatar** | ❌ | — | No aporta en un reto tan corto |
| **Poder** | ❌ | — | No encaja en esta misión |

**Insignias**: 🛡️ *Sin daños colaterales* (ningún servicio legítimo afectado),
🧠 *Autosuficiente* (sin pistas), 🧰 *Multiherramienta* (≥3 técnicas distintas),
⚡ *Respuesta rápida* (<8 min), 🔭 *Proactivo* (contener una amenaza antes de su alerta),
📚 *Lee el manual* (consultar `man`).

### Perfiles de jugador (Bartle)

- **Explorer (explorador)**: el diseño gira en torno a descubrir. Hay contenido oculto
  que se va desvelando, comandos de ambientación, un `.bash_history` con pistas de la
  mala configuración, páginas de `man` y la posibilidad de adelantarse a las alertas.
- **Achiever (conseguidor)**: XP, niveles, insignias y un informe con todos los logros.
- **Killer (competitivo)**: rango final, tiempo e insignia de rapidez, sin tablero
  público. Si el grupo lo pide, se pueden comparar los informes en clase.
- **Socializer (sociable)**: se trabaja fuera del juego, jugando en parejas (piloto y
  copiloto) y con la puesta en común final (ver [Uso en el aula](#uso-en-el-aula)).

### Estado de *flow*

- **Dificultad creciente**: primero reconocer, luego amenazas cada vez más graves y
  ambiguas. Por ejemplo, en el portal hay dos servidores web y solo uno es el problema.
- **Objetivos claros**: la ficha siempre muestra un objetivo concreto.
- ***Feedback* inmediato**: mensajes del SOC, XP y cambios en la ficha.
- **Pistas a demanda**, para que nadie se atasque ni se frustre.

## Accesibilidad, inclusión y protección de datos

### Accesibilidad

- **Todo se maneja con teclado.** Con la línea vacía, <kbd>Tab</kbd> sale de la terminal
  al resto de la página, así que el autocompletado no atrapa el foco.
- **Lectores de pantalla**: la salida de la terminal es un `role="log"`, y una región
  `role="status"` independiente anuncia solo lo importante (nueva alerta con su
  objetivo, misión completada, pistas, ascensos) para no saturar. Los indicadores de
  alerta llevan texto oculto (`Alerta 3: sin revelar`).
- **Nunca solo color**: los estados combinan color, icono (✓, ⚠, ▶, ?) y texto.
- **Contraste alto** sobre fondo oscuro, foco visible en todos los elementos
  interactivos y tipografía monoespaciada legible.
- **Movimiento reducido**: si el sistema tiene activado `prefers-reduced-motion`, se
  quitan las animaciones y se acortan las esperas.
- **Modal de ayuda** accesible: foco atrapado, cierre con <kbd>Esc</kbd> y devolución del
  foco al elemento de origen.
- **Adaptable**: en pantallas estrechas la ficha se coloca sobre la terminal. Se ha
  comprobado a 400 px de ancho.

### Inclusión

- **Cada cual a su ritmo**: no hay tiempo límite, y el reloj es solo informativo.
- **Ayuda graduada**: tres niveles de pista por misión, además de la guía de comandos
  (siempre disponible) y `man`.
- **Sin castigo definitivo**: se puede reiniciar sin penalización y `exit` no hace
  perder el progreso.
- **Tono y lenguaje**: textos en español correcto, mensajes que orientan en lugar de
  culpar y rangos con nombres neutros («Aprendiz», «Analista», «Escudo digital»).

### Protección de datos y uso responsable

- **No recoge ningún dato personal**: no hay registro, ni nombre, ni correo.
- **No envía nada a ningún servidor** ni usa cookies ni almacenamiento del navegador.
  Todo ocurre en memoria y desaparece al cerrar la pestaña.
- **No depende de servicios externos** (ni CDN, ni fuentes web, ni analítica). Los
  únicos enlaces externos son los créditos de la portada.
- **Es una simulación**: no escanea ni modifica ningún sistema real, y así se indica en
  la portada y en el pie. Conviene recordar en clase que estas técnicas solo se aplican
  a sistemas propios o con autorización.

## Uso en el aula

**Antes**
- Repaso breve de conceptos: puerto, servicio, proceso, PID, TCP/UDP, estado LISTEN.
- Presentar la narrativa de «Operación Escudo Digital» y leer juntos el comunicado de la
  portada.

**Durante**
- Individual o **en parejas** (una persona teclea y la otra consulta la ayuda y los
  `man`; se cambia de rol en cada alerta).
- El docente circula y hace preguntas en lugar de dar soluciones: «¿qué te dice la
  columna PID?», «¿el cortafuegos ha parado el proceso?».

**Después**
- **Puesta en común de los informes**: ¿quién resolvió la misma alerta con técnicas
  distintas? ¿Qué diferencia hay entre `ufw deny 80` y `systemctl stop apache2`? ¿Por
  qué cerrar SSH es un problema aunque «sea más seguro»?
- **Evidencia para el aula virtual**: captura del informe final, o reflexión breve sobre
  qué decisión cambiarían.
- **Ampliación**: repetir el ejercicio en una máquina virtual real (Ubuntu Server) con
  los mismos comandos, y contrastar lo que se ve en el simulador con la realidad.

## Detalles técnicos

HTML semántico, CSS y JavaScript *vanilla* (sin *frameworks*, sin dependencias, sin *build*
y sin módulos ES, para que funcione también con `file://`). El reto comparte con el resto del
repositorio la biblioteca [`shared/`](../shared/) (espacio de nombres `RG`): terminal,
intérprete de órdenes, páginas de manual, modales accesibles y motor de misiones.

| Fichero | Contenido |
|---|---|
| `index.html` | Solo el marcado de las tres pantallas y la guía de ayuda |
| `css/reto.css` | Lo específico del reto: los indicadores de alerta |
| `data/config.js` | El escenario: `PORTS_TEMPLATE` (los 8 servicios: puerto, PID, proceso, si es legítimo y sus alias para `systemctl`), procesos del sistema y ficheros legibles |
| `data/missions.js` | El contenido de las 7 misiones (textos, gravedad, objetivos y pistas), sin lógica |
| `data/man.js` · `data/gamification.js` | Páginas de manual · niveles, insignias y puntuación |
| `js/state.js` | Estado del servidor y montaje de terminal y shell |
| `js/missions.js` | `secure()` y las comprobaciones de cada misión |
| `js/commands.js` | Los comandos: `ss`, `netstat`, `ps`, `systemctl`, `service`, `kill`, `ufw`, `iptables`, `ls`, `cat`, `man`… |
| `js/main.js` | Motor de misiones, secuencia SSH, pantallas e informe final |

Claves del diseño:

- **Estado de cada servicio**: `open` (abierto), `filtered` (sigue en escucha, pero con el
  tráfico bloqueado) o `stopped` (detenido). Así las salidas de `ss`, `ps` y
  `systemctl status` son siempre coherentes con lo que se ha hecho.
- **`BD.secure(puerto, método, estado)`**: punto único por el que pasa toda acción de
  contención, sea cual sea el comando. Registra la técnica usada (para la insignia
  *Multiherramienta*) y anota las decisiones arriesgadas.
- **Misiones declarativas**: cada misión tiene un `check()` sobre el estado (las amenazas)
  o sobre el último evento (el reconocimiento y la verificación). Si una amenaza se contiene
  antes de que llegue su alerta, la misión se completa sola con bonus.
- **Añadir o cambiar una misión**: basta con editar `data/missions.js` (y `data/config.js`
  si se añade un servicio nuevo). El resto de la interfaz se genera a partir de esos datos.

## Verificación

Se ha probado en **Chrome real en modo *headless***, manejado por el protocolo
DevTools (CDP) desde Node.js. El guion simula a una persona jugando una partida completa
y hace **44 comprobaciones**, todas superadas y sin ningún error de JavaScript. Se ejecuta con:

```bash
node .claude/skills/verificar-reto/scripts/test-blindaje.mjs
```

Cubren:

- el paso entre las tres pantallas y el bloqueo de la entrada durante la conexión;
- que solo se vea la misión actual y que cada alerta llegue con su mensaje y animación;
- el rechazo de acciones antes del reconocimiento, las órdenes inexistentes y el aviso
  de `ss` sin `-p`;
- cada técnica de contención (`kill`, `systemctl`, `service`, `ufw`, `iptables`),
  `disable` sin `--now`, las pistas, la resolución proactiva y la penalización por
  daños colaterales;
- la verificación final y el informe (insignias, tabla, avisos);
- el scroll único de la terminal (ningún bloque tiene barra propia y la página no se
  desplaza en escritorio), la ayuda con el teclado y la vista a 400 px.

También se ha comprobado con `prefers-reduced-motion` activado.

## Limitaciones conocidas

- El intérprete no es una *shell* real: no hay variables, redirecciones (`>`), ni
  sistema de ficheros navegable. Solo acepta los comandos de la tabla anterior, con
  variantes razonables de opciones.
- `systemctl start`/`restart`/`enable` no reabren servicios: el juego solo evalúa
  acciones de contención.
- Las reglas de `ufw` e `iptables` se simplifican: no hay orden de reglas ni políticas
  por defecto.
- El progreso no se guarda: al recargar la página se empieza de cero. Es intencionado,
  para no almacenar datos.

## Archivos

| Archivo | Contenido |
|---|---|
| [`index.html`](index.html) | Marcado de las tres pantallas |
| [`css/`](css/) · [`data/`](data/) · [`js/`](js/) | Estilos propios · datos del escenario y de las misiones · lógica del reto |
| [`../shared/`](../shared/) | Biblioteca común: terminal, intérprete, manuales, modales y motor de misiones |
| [`README.md`](README.md) | Este documento |

## Créditos

Made with 💖 by [@fvarrui](https://github.com/fvarrui) & [Claude](https://claude.ai).

Diseñado para el curso *La gamificación educativa*, como parte de la propuesta
«Operación Escudo Digital».
