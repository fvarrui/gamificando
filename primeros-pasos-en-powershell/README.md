# Primeros pasos en PowerShell

> Simulador gamificado de la consola de Windows, donde todo son objetos.
> Reto digital de elaboración propia, hermano de [*Primeros pasos en Linux*](../primeros-pasos-en-linux/)
> y de [*Blindaje de la Red*](../blindaje-de-la-red/).

---

## Índice

1. [Qué es](#qué-es)
2. [Cómo abrirlo](#cómo-abrirlo)
3. [Contexto educativo](#contexto-educativo)
4. [Objetivos de aprendizaje](#objetivos-de-aprendizaje)
5. [Cómo funciona](#cómo-funciona)
6. [Las 27 tareas](#las-27-tareas)
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

*Primeros pasos en PowerShell* es un juego educativo que se ejecuta en el navegador. El
alumnado vive **su primer día en el CPD de Windows** de la empresa ficticia
**TecnoAtlántica**: le han dado una cuenta en el equipo de prácticas `WS-PRACTICAS` y, desde
ahí, tiene que orientarse en el sistema de archivos, leer registros, preparar sus entregas y
sacar conclusiones de un listado, todo escribiendo **cmdlets reales de PowerShell**:
`Get-Location`, `Get-ChildItem`, `Get-Content`, `New-Item`, `Copy-Item`, `Where-Object`,
`Sort-Object`, `Measure-Object`…

No hay botones que hagan el trabajo: la herramienta es la consola, con su ayuda integrada
(`Get-Help`), sus alias (`ls`, `cat`, `rm`) y sus mensajes de error. Las tareas **llegan de
una en una** y las firman dos personas del equipo: **Iker Alonso** (administración de
sistemas), que va soltando el vocabulario, y **Nayra Suárez** (soporte), que pide los datos
que hacen falta para los informes.

La idea que vertebra el reto es la que distingue a PowerShell de `cmd` y de `bash`: **los
cmdlets no devuelven texto, devuelven objetos con propiedades**. Por eso la tubería `|`
permite filtrar, ordenar, recortar, sumar y agrupar sin pelearse con recortes de cadenas. La
última fase está construida entera alrededor de esa idea, y empieza obligando a mirar dentro
de un objeto con `Get-Member` antes de filtrarlo.

Funciona sin conexión a Internet, sin instalar nada y sin servidor.

## Cómo abrirlo

- **En local**: doble clic en [`index.html`](index.html). Funciona en cualquier navegador
  moderno (Chrome, Edge, Firefox, Safari).
- **En el aula virtual (EVAGD/Moodle)**: subir la carpeta completa del reto **junto con la
  carpeta [`shared/`](../shared/)** (por ejemplo, en un ZIP con las dos) y enlazar
  `primeros-pasos-en-powershell/index.html`. El reto usa CSS y scripts clásicos, sin módulos
  ES ni `fetch`, así que también funciona desde el sistema de ficheros.
- **En la web**: publicar el repositorio con GitHub Pages o cualquier alojamiento estático.
  No necesita *backend*.

Una partida completa dura entre **20 y 35 minutos**. Desde la portada se puede **empezar en
cualquiera de las 5 fases**: el equipo se prepara automáticamente con las fases anteriores ya
resueltas (esas tareas no suman XP), así que el reto se puede repartir en varias sesiones o
usarse solo la última fase como práctica de la tubería de objetos.

## Contexto educativo

| | |
|---|---|
| **Temas** | Windows · PowerShell · Consola · Ficheros |
| **Encaja en** | Cualquier materia o curso en que se administre un sistema Windows, o se trabaje con la línea de órdenes y con ficheros |
| **Punto de partida** | Ninguno: es el reto de entrada. No hace falta haber abierto nunca una consola |
| **Narrativa** | Primer día de prácticas en el CPD de Windows de TecnoAtlántica, dentro de «Operación Escudo Digital» |
| **Modalidad** | Presencial, con apoyo del aula virtual. También sirve en línea, de forma autónoma |

El escenario está pensado para quitar el miedo: el equipo `WS-PRACTICAS` es una copia y el
propio fichero de bienvenida lo dice («todo lo que hay dentro es una copia, así que puedes
trastear sin miedo»). Ese permiso explícito para equivocarse es lo que permite después
enseñar de verdad qué hace `Remove-Item`.

## Objetivos de aprendizaje

Al terminar el reto, el alumnado debería ser capaz de:

1. **Identificar** la estructura **Verbo-Nombre** de los cmdlets y deducir el nombre de un
   comando que no conoce a partir de lo que quiere hacer (`Get-`, `Set-`, `New-`, `Remove-`).
2. **Orientarse** en el sistema de archivos de Windows desde la consola: saber dónde está,
   listar, entrar y salir de carpetas y escribir rutas absolutas y relativas.
3. **Consultar** el contenido de un archivo sin modificarlo, quedándose con el principio o
   con el final de un registro y buscando texto dentro de él.
4. **Aplicar** los cmdlets de gestión de archivos (crear, escribir, añadir, copiar, mover y
   borrar) sabiendo distinguir cuáles son destructivos y cuáles no.
5. **Explicar** por qué la tubería de PowerShell transporta objetos y no texto, y
   **descubrir** con `Get-Member` las propiedades por las que se puede filtrar u ordenar.
6. **Componer** tuberías de varios cmdlets para responder a una pregunta concreta: filtrar
   (`Where-Object`), ordenar (`Sort-Object`), recortar (`Select-Object`), calcular
   (`Measure-Object`) y agrupar (`Group-Object`).
7. **Resolver por su cuenta** una duda usando la ayuda integrada (`Get-Help`, `Get-Command`,
   `Get-Alias`), en lugar de buscar fuera o pedir la respuesta.

## Cómo funciona

### Las tres pantallas

1. **Portada (bienvenida)**: mensaje de Iker Alonso presentando el equipo de prácticas,
   explicación del juego, **selector de fase inicial** y guía rápida de cmdlets.
2. **Juego**: la consola ocupa casi toda la pantalla, con el aspecto y el *prompt* de Windows
   PowerShell (`PS C:\Users\practicas>`). Arriba, una barra con el progreso por fases, el
   reloj, la XP y el nivel. En el lateral, la ficha de la tarea actual y el registro de la
   jornada.
3. **Informe de la jornada**: XP, nivel alcanzado, tiempo, pistas usadas, insignias, la tabla
   de las 27 tareas con el comando que resolvió cada una y las decisiones arriesgadas.

### El desarrollo de una partida

Las tareas llegan **de una en una**. Cada una se presenta como un mensaje del equipo en la
consola y como una ficha en el lateral, con quién la envía, el objetivo y hasta **tres
pistas**: la primera orienta (qué verbo y qué nombre), la segunda añade el parámetro o el
alias, y solo la tercera da el comando literal. Cada pista cuesta 20 XP, pero nunca bloquea.

Si algo se resuelve **antes** de que llegue su tarea, la tarea aparece igualmente y se
completa sola con una bonificación: el juego premia ir por delante.

La ficha describe **síntomas y objetivos**, nunca la solución. «Muestra las 3 últimas líneas
de `Registros\sistema.log`» se puede resolver con `Get-Content -Tail 3`, con el alias `cat` o
combinando `Get-Content` con una tubería: hay varios caminos válidos y el informe final anota
cuál se usó.

### La consola

- **Cmdlets con sus parámetros de verdad**: `-Recurse`, `-Directory`, `-Filter`, `-TotalCount`,
  `-Tail`, `-ItemType`, `-Value`, `-Destination`, `-Descending`, `-First`… Se admiten
  **abreviaturas** (`-Rec`, `-Dir`) y los nombres **no distinguen mayúsculas de minúsculas**,
  igual que en un equipo real.
- **Alias**: `ls`, `dir`, `gci`, `cd`, `cat`, `type`, `rm`, `del`, `cp`, `mv`, `?`, `%`… todos
  resuelven al cmdlet correspondiente, y `Get-Alias` lo demuestra desde dentro del juego.
- **Tubería de objetos real**: por `|` viajan objetos con propiedades (`Name`, `Length`,
  `Extension`, `LastWriteTime`, `Mode`). Mientras el siguiente comando sepa tratarlos siguen
  siendo objetos; si no, se convierten en texto, como ocurre en PowerShell al llamar a un
  programa externo.
- **Ayuda integrada**: `Get-Help <cmdlet>` muestra sinopsis, sintaxis, parámetros y ejemplos
  de casi treinta cmdlets; `help` lista los comandos disponibles agrupados por tema.
- **Editor**: `notepad <archivo>` abre un Bloc de notas simulado que suspende la consola hasta
  que se cierra (con atajos y con botones).
- **Errores de PowerShell**: rutas inexistentes, parámetros mal escritos y el mensaje completo
  de «El término '…' no se reconoce como nombre de un cmdlet…» con su consejo debajo.

## Las 27 tareas

### Fase 1 · Orientación

| # | Tarea | Título | Qué se practica |
|---|-------|--------|-----------------|
| 1 | PSH-01 | ¿Dónde estás? | `Get-Location`, la forma Verbo-Nombre, el alias `pwd` |
| 2 | PSH-02 | Mira a tu alrededor | `Get-ChildItem` y sus alias `ls`, `dir`, `gci` |
| 3 | PSH-03 | Solo las carpetas | `-Directory` / `-File`: filtrar con el propio cmdlet |
| 4 | PSH-04 | Entra en Documentos | `Set-Location` con ruta relativa (`cd`) |
| 5 | PSH-05 | Vuelve sobre tus pasos | `Set-Location ..`, el árbol de carpetas |
| 6 | PSH-06 | El mapa completo | `-Recurse`; parámetros de tipo interruptor |
| 7 | PSH-07 | Pregunta a la consola | `Get-Help`, `-Examples`, los alias `help` y `man` |

### Fase 2 · Leer sin miedo

| # | Tarea | Título | Qué se practica |
|---|-------|--------|-----------------|
| 8 | PSH-08 | Lee la bienvenida | `Get-Content`: una cadena por línea (`cat`, `type`) |
| 9 | PSH-09 | Solo el principio | `-TotalCount`: parámetros con valor |
| 10 | PSH-10 | Lo último que pasó | `-Tail`: el final de un registro |
| 11 | PSH-11 | Busca los intentos fallidos | `Select-String -Pattern … -Path …` |
| 12 | PSH-12 | Comprueba antes de actuar | `Test-Path`, `True`/`False`, `-PathType Container` |

### Fase 3 · Crear y ordenar

| # | Tarea | Título | Qué se practica |
|---|-------|--------|-----------------|
| 13 | PSH-13 | Prepara las entregas | `New-Item -ItemType Directory`: un cmdlet, dos tipos |
| 14 | PSH-14 | Escribe tu parte | `Set-Content -Path … -Value …` (o `notepad`) |
| 15 | PSH-15 | Añade sin borrar | `Add-Content`: `Set-` reemplaza, `Add-` añade |
| 16 | PSH-16 | Una copia de seguridad a mano | `Copy-Item`, parámetros posicionales |
| 17 | PSH-17 | Cada cosa en su sitio | `Move-Item` a una carpeta existente |
| 18 | PSH-18 | Limpia lo que sobra | `Remove-Item`: no pregunta y no hay papelera |

### Fase 4 · Tubería de objetos

| # | Tarea | Título | Qué se practica |
|---|-------|--------|-----------------|
| 19 | PSH-19 | ¿Qué tiene dentro un objeto? | `Get-Member`: las propiedades antes de filtrar |
| 20 | PSH-20 | Filtra por nombre | `Where-Object Name -like "*.log"` |
| 21 | PSH-21 | El archivo más grande | `Sort-Object Length -Descending`: el tamaño es un número |
| 22 | PSH-22 | Solo los tres primeros | `Select-Object -First 3`; encadenar varias tuberías |
| 23 | PSH-23 | Cuánto ocupa todo | `Measure-Object -Property Length -Sum` |
| 24 | PSH-24 | Agrupa por extensión | `Group-Object Extension`: `Count` y `Name` |

### Fase 5 · Conocer la consola

| # | Tarea | Título | Qué se practica |
|---|-------|--------|-----------------|
| 25 | PSH-25 | ¿Qué comandos hay? | `Get-Command -Noun` / `-Verb`: buscar por mitades |
| 26 | PSH-26 | Nombres cortos | `Get-Alias`, `-Definition`: de dónde salen `ls` y `dir` |
| 27 | PSH-27 | Repasa la jornada | `Get-History` y las flechas del historial |

## Comandos disponibles

| Tipo | Comandos |
|---|---|
| Moverse | `Get-Location`, `Set-Location`, `Get-ChildItem` (`-Recurse -Filter -Include -Exclude -Directory -File -Name -Force`), `Get-Item` |
| Leer | `Get-Content` (`-TotalCount -Tail -Raw`), `Select-String` (`-Pattern -Path -SimpleMatch`), `Test-Path` (`-PathType`) |
| Crear y organizar | `New-Item` (`-ItemType -Value`), `Set-Content`, `Add-Content`, `Copy-Item`, `Move-Item`, `Rename-Item`, `Remove-Item` (`-Recurse -Force`), `notepad` |
| Tubería de objetos | `Where-Object`, `Select-Object` (`-First -Last -Skip -Property -ExpandProperty -Unique`), `Sort-Object` (`-Descending`), `Measure-Object` (`-Sum -Average -Maximum -Minimum`), `Group-Object`, `ForEach-Object`, `Get-Member`, `Format-Table`, `Format-List` |
| Conocer la consola | `Get-Command` (`-Verb -Noun`), `Get-Alias` (`-Definition`), `Get-Help` (`-Examples`), `Get-Date`, `Get-History`, `Clear-Host`, `Write-Output`, `Write-Host`, `help` |
| Permisos (contenido opcional) | `Get-Acl`, `Set-Acl`, `icacls`, `takeown` para quien quiera explorar más allá de las tareas |
| Alias | `ls` = `dir` = `gci` · `cd` = `sl` · `cat` = `gc` = `type` · `rm` = `del` = `ri` · `cp` = `copy` · `mv` = `move` · `ni` = `mkdir` · `?` = `where` · `%` = `foreach` · `gm`, `sort`, `select`, `measure`, `group`, `ft`, `fl`, `sls`, `gcm`, `gal` |
| Composición | Tuberías con `\|`, encadenado con `&&`, `\|\|` y `;`, redirecciones `>` y `>>`, comodines (`*.log`) y comillas simples y dobles |

Atajos: <kbd>↑</kbd>/<kbd>↓</kbd> historial, <kbd>Tab</kbd> autocompletar (cmdlets, alias y
rutas), <kbd>Ctrl</kbd>+<kbd>L</kbd> limpiar la pantalla, <kbd>Ctrl</kbd>+<kbd>C</kbd>
cancelar la línea. Con la línea vacía, <kbd>Tab</kbd> sale de la consola al resto de la
página. En el Bloc de notas: <kbd>Ctrl</kbd>+<kbd>O</kbd> guardar,
<kbd>Ctrl</kbd>+<kbd>X</kbd> cerrar, <kbd>Ctrl</kbd>+<kbd>K</kbd> cortar línea,
<kbd>Ctrl</kbd>+<kbd>U</kbd> pegar (también hay botones).

## Cómo se diseñó

### Principios que guiaron las decisiones

- **Primero el aprendizaje, después la narrativa.** El reto nació de una secuencia didáctica
  (orientarse → leer → escribir → componer tuberías → aprender a preguntar a la consola) y
  solo después se buscó la ficción que la sostuviera. El «primer día de prácticas» no es
  decorado: justifica que las tareas lleguen de una en una, que alguien explique el
  vocabulario y que el equipo sea una copia donde no se puede romper nada.
- **La idea central se enseña, no se enuncia.** Que los cmdlets devuelven objetos se repite en
  la portada, en la chuleta de `C:\Compartido\Manual-Consola.txt` y en la guía, pero quien lo
  entiende de verdad es quien escribe `Get-ChildItem | Get-Member` y ve aparecer `Length`,
  `Extension` y `LastWriteTime`. Por eso esa es la **primera** tarea de la fase 4 y no un
  apéndice: sin ella, las cinco siguientes son magia.
- **PowerShell de verdad, no un PowerShell de juguete.** El *prompt*, la cabecera
  `Directorio:` de `Get-ChildItem`, las columnas `Mode / LastWriteTime / Length / Name`, la
  salida en lista de `Measure-Object`, los alias, las abreviaturas de parámetro y los mensajes
  de error están calcados de la consola real. Si el alumnado repite después estos comandos en
  una máquina Windows, verá lo mismo.
- **El simulador no enseña cosas falsas.** `Set-Content` reemplaza y `Add-Content` añade;
  `Remove-Item` no pregunta ni manda nada a la papelera, y borrar una carpeta con contenido
  exige `-Recurse`; `Sort-Object Length` ordena números como números y no como texto;
  `Format-Table` y `Format-List` solo tienen sentido al final de la tubería; los comandos que
  tienen éxito no imprimen nada.
- **Dificultad escalonada y sin trampas.** Las cuatro primeras tareas valen 50-75 XP y se
  resuelven con una sola palabra; las de la fase 4 valen 150 XP y exigen encadenar tres
  cmdlets. Cada fase reutiliza lo anterior: la fase 4 filtra el árbol que se aprendió a listar
  en la fase 1 y mide los archivos que se crearon en la fase 3.
- **Las decisiones tienen consecuencias, pero no se bloquean.** Se puede borrar el informe de
  red original, el registro de accesos o el script de copia: el juego lo permite, lo explica,
  cuesta 40 XP y queda anotado en el informe final. El objetivo es que la frase «en la consola
  no hay papelera» se aprenda una vez y para siempre, no impedir el error.
- **Los errores orientan sin resolver.** Cuando `Where-Object` no entiende la condición, el
  mensaje muestra la forma correcta de escribirla, no la respuesta de la tarea. La ayuda
  general (`help`, `Get-Help`) nunca revela qué hay que hacer ahora.

### Evolución del diseño

| | Primera versión | Versión actual |
|---|---|---|
| Fases | Cuatro (sin «Conocer la consola») | Cinco: se añadió una fase final sobre `Get-Command`, `Get-Alias` y el historial, porque aprender a preguntarle a la consola es lo que queda cuando se olvidan los comandos |
| Tubería | Repartida entre varias fases | Agrupada en una fase propia, con `Get-Member` en primer lugar |
| Ayuda | Una sola pista por tarea | Tres pistas graduadas: verbo y nombre → parámetro o alias → comando literal |
| Comandos | Solo los que piden las tareas | Todo un subconjunto coherente de PowerShell, para que explorar tenga premio |
| Duración | Una sesión completa | 20-35 minutos y selector de fase, para poder usarlo como calentamiento o como práctica suelta |

Lo que se probó y se descartó: **sabotear al jugador** (como hacen los compañeros en
*Versionando con Git*) resultaba desconcertante en un primer día, cuando aún no se sabe
distinguir un error propio de uno ajeno; y **exigir la sintaxis con bloque de script**
(`Where-Object { $_.Name -like "*.log" }`) desde el principio añadía una barrera de llaves y
`$_` justo cuando el concepto que hay que asimilar es otro. Se admiten las dos formas, pero
las pistas enseñan primero la sencilla.

## Elementos de gamificación

Relación con los **12 componentes** vistos en el curso *La gamificación educativa* (solo se
usan los que encajan):

| Componente | ¿Se usa? | Cómo | Por qué |
|---|---|---|---|
| **Misiones** | ✅ | 27 tareas encadenadas (PSH-01…PSH-27) agrupadas en 5 fases | Se habla de tareas del equipo y de fases, nunca de ejercicios |
| **Desbloqueo de contenido** | ✅ | Cada tarea se revela al completar la anterior | Hay que avanzar para descubrir qué viene; evita el efecto «lista de ejercicios» |
| **Puntos (XP)** | ✅ | 50-150 XP por tarea, −20 por pista, −40 por decisión arriesgada, +20 por adelantarse | *Feedback* inmediato; las pistas cuestan, pero nunca bloquean |
| **Niveles** | ✅ | Primer día → Verbo-Nombre → Se defiende en la consola → Piensa en objetos | Los nombres describen lo que ya se sabe hacer, no un rango vacío |
| **Insignias** | ✅ | 6 insignias ligadas a buenas prácticas (ver abajo) | Reconocen *cómo* se ha trabajado, no solo terminar |
| **Barra de progreso** | ✅ | Progreso por fases, contador de tarea y registro lateral de la jornada | Ver el avance anima a seguir y sitúa en qué punto se está |
| **Recompensas** | ✅ | Pistas «compradas» con XP; la guía de cmdlets y `Get-Help` siempre disponibles | La ayuda existe, pero hay que decidir si compensa |
| **Sorpresa** | ❌ | — | Deliberadamente no: en un primer día, un sabotaje impide distinguir el error propio del ajeno. La tensión la aportan el registro con intentos fallidos y las consecuencias de `Remove-Item` |
| **Tablero de clasificación** | ❌ | — | El informe es individual; comparar tiempos en la primera consola de alguien desanima más de lo que motiva |
| **Cuenta atrás** | ❌ | Reloj que cuenta hacia arriba, sin límite | Una cuenta atrás invita a copiar la tercera pista y seguir sin entender |
| **Avatar** | ❌ | — | No aporta: la identidad ya está en el *prompt* (`practicas@WS-PRACTICAS`) |
| **Poder** | ❌ | — | No encaja: la cuenta de prácticas no administra nada, y ese es justo el punto |

**Insignias**: 🧯 *Sin sustos* (no se borró nada que hiciera falta), 🧠 *Autosuficiente*
(jornada terminada sin pistas), 📚 *Get-Help* (se consultó la ayuda integrada de un cmdlet),
🧩 *Todo son objetos* (se usó `Get-Member` para ver las propiedades de un objeto), 🪈
*Fontanería* (se encadenaron cmdlets con la tubería), ⚡ *Buen ritmo* (jornada completada en
menos de 22 minutos).

### Perfiles de jugador (Bartle)

- **Explorer**: hay bastante que no pide ninguna tarea: la chuleta de
  `C:\Compartido\Manual-Consola.txt`, los scripts `.ps1` de la carpeta `Scripts` (se leen y se
  comentan solos), `Get-Command` sin parámetros, `Get-Acl`, `Get-Date`, el Bloc de notas, los
  `Get-Help` de casi treinta cmdlets y todos los alias.
- **Achiever**: XP, cuatro niveles, seis insignias y un informe final con el comando exacto
  con que se resolvió cada tarea.
- **Killer**: tiempo final e insignia *Buen ritmo*, sin tablero público; se pueden comparar
  informes si el grupo quiere.
- **Socializer**: el juego es individual, pero funciona muy bien por parejas y la puesta en
  común compara caminos distintos para el mismo objetivo.

### Estado de *flow*

La curva está pensada para sostener el equilibrio entre reto y destreza: las siete primeras
tareas se resuelven con un solo cmdlet y casi sin parámetros; la dificultad sube al introducir
parámetros con valor, luego acciones que modifican el sistema y por último la composición de
tuberías. No hay tiempo límite, las pistas graduadas evitan el bloqueo (ansiedad) y el
selector de fase permite saltarse lo ya sabido (aburrimiento). Cada tarea completada da
respuesta inmediata en la consola, en la XP y en el registro lateral.

## Accesibilidad, inclusión y protección de datos

### Accesibilidad

- **Todo se maneja con teclado**, incluido el Bloc de notas. Con la línea vacía,
  <kbd>Tab</kbd> sale de la consola al resto de la página, así que el autocompletado no atrapa
  el foco.
- **Lectores de pantalla**: la salida de la consola es un `role="log"`; una región
  `role="status"` independiente anuncia solo lo importante (nueva tarea con su objetivo, tarea
  completada, pistas, ascensos de nivel, apertura del editor).
- **Nunca solo color**: los estados combinan color, icono y texto, tanto en la barra de fases
  como en la ficha de la tarea y en el informe.
- **Contraste alto** sobre fondo oscuro, foco visible y tipografía monoespaciada en la consola.
- **Movimiento reducido**: con `prefers-reduced-motion` se quitan las animaciones y se acortan
  las esperas entre tareas.
- **Editor accesible**: el Bloc de notas tiene etiqueta, se anuncia al abrirse y ofrece
  botones para quienes no usen atajos de teclado.
- **Modales accesibles**: foco atrapado, cierre con <kbd>Esc</kbd> y devolución del foco.
- **Adaptable**: por debajo de 900 px el panel lateral se coloca sobre la consola. Comprobado
  a 400 px de ancho, sin scroll horizontal.

### Inclusión

- **Cada cual a su ritmo**: sin tiempo límite; el reloj es informativo y la insignia de
  rapidez es solo una más de seis.
- **Ayuda graduada**: tres pistas por tarea, guía de cmdlets siempre disponible, `help` y
  `Get-Help` dentro del juego y una chuleta escondida en el propio sistema de archivos.
- **Se puede empezar por cualquier fase**, lo que permite repartir el reto en varias sesiones
  o adaptar el punto de partida a quien ya sepa moverse por una consola.
- **Sin castigo definitivo**: se puede reiniciar sin penalización y ningún error cierra
  caminos.
- **Punto de partida cero**: no se da por sabido nada, ni siquiera qué es una ruta relativa.
- **Tono y lenguaje**: español correcto, mensajes que orientan en lugar de culpar y nombres de
  nivel neutros.

### Protección de datos y uso responsable

- **No recoge ningún dato personal**: no se pide nombre ni correo, y el progreso vive solo en
  la memoria de la pestaña.
- **No envía nada a ningún servidor** ni usa cookies ni almacenamiento del navegador.
- **No depende de servicios externos** (ni CDN, ni fuentes web, ni analítica).
- **Es una simulación**: el equipo `WS-PRACTICAS`, sus carpetas y sus registros están dentro de
  la página; no se toca ningún sistema real.
- Los registros del escenario contienen usuarios e IP ficticios: buen momento para comentar en
  clase que un registro de accesos **sí** es un dato personal y que no se copia ni se comparte
  a la ligera.

## Uso en el aula

**Antes**
- Preguntar quién ha abierto alguna vez una consola y para qué. Enseñar el patrón
  **Verbo-Nombre** en la pizarra: con `Get`, `Set`, `New` y `Remove` ya se adivinan muchos
  comandos.
- Dejar claro el mensaje del reto: en PowerShell la tubería lleva **objetos**, no texto.

**Durante**
- Individual o **en parejas** (una persona teclea y la otra consulta la guía y los
  `Get-Help`; se cambia de rol en cada fase).
- Sugerencia de reparto: fases 1-3 como primera toma de contacto y fases 4-5 en otra sesión,
  usando el **selector de fase** de la portada.
- El docente circula y pregunta en lugar de resolver: «¿qué verbo necesitas?», «¿cómo
  averiguas el nombre de esa propiedad?», «¿qué crees que pasará si ejecutas `Set-Content` dos
  veces?».
- Insistir en usar `Get-Help` **antes** de pedir la pista: la insignia 📚 *Get-Help* está ahí
  precisamente para eso.

**Después**
- **Puesta en común**: ¿quién resolvió alguna tarea de otra forma? ¿Por qué
  `Sort-Object Length` ordena bien y un `sort` de texto no? ¿Qué diferencia hay entre
  `Set-Content` y `Add-Content`? ¿Qué habría pasado con `Remove-Item` en el equipo de
  producción?
- **Evidencia para el aula virtual**: captura del informe de la jornada.
- **Ampliación**: repetir las tuberías de la fase 4 en una consola real de Windows y comprobar
  que se comportan igual; después, saltar al reto hermano de Linux y comparar
  `Get-ChildItem | Where-Object` con `ls | grep`.

## Detalles técnicos

HTML semántico, CSS y JavaScript *vanilla* (sin *frameworks*, sin dependencias, sin *build* y
sin módulos ES, para que funcione también con `file://`). Prácticamente toda la maquinaria
viene de la biblioteca [`shared/`](../shared/) (espacio de nombres `RG`): el reto solo aporta
**datos**.

| Fichero | Contenido |
|---|---|
| `index.html` | Solo el marcado de las tres pantallas, el Bloc de notas y la guía de cmdlets |
| `css/reto.css` | Los pocos retoques propios sobre los estilos comunes |
| `data/config.js` | El escenario: equipo, usuario, grupos y árbol de carpetas inicial con su contenido |
| `data/gamification.js` | Las 5 fases, los 4 niveles, las 6 insignias y el coste de pistas y penalizaciones |
| `data/missions.js` | El contenido de las 27 tareas (textos, objetivos y pistas), sin lógica |
| `js/missions.js` | Cómo se comprueba cada tarea, la `solution` de cada una y los archivos que no conviene borrar |
| `js/main.js` | Monta `RG.Sandbox` con todo lo anterior: textos, arranque, insignias propias e informe final |

Claves del diseño:

- **`RG.Sandbox`** (en `shared/js/sandbox.js`) monta de una vez el sistema de archivos
  simulado, la terminal, el intérprete, el editor, el motor de tareas, la barra de fases, la
  secuencia de arranque, el selector de fase y el informe final. Este reto se declara con
  `shell: "pwsh"` y `admin: false` (en un primer día no se administra nada).
- **Sistema de archivos virtual** (`shared/js/vfs.js`) en modo Windows: unidad `C:`,
  separador `\`, propietarios y ACE heredadas desde la raíz, de modo que los tamaños, las
  fechas y los permisos que muestra `Get-ChildItem` salen de un modelo real y no de un texto
  escrito a mano.
- **Intérprete de PowerShell** (`shared/js/cmd-pwsh.js`): analizador de parámetros al estilo
  de PowerShell (nombres abreviables, interruptores, posicionales), tabla de alias, resolución
  de nombres sin distinguir mayúsculas y **tubería de objetos** de verdad: cada cmdlet emite
  una lista de objetos y los filtros (`Where-Object`, `Sort-Object`, `Select-Object`,
  `Measure-Object`, `Group-Object`, `ForEach-Object`, `Get-Member`, `Format-*`) los
  transforman antes de que la terminal los pinte como tabla o como lista.
- **Motor de tareas**: cada tarea declara `check(evento, datos)` —unas comprueban el estado
  del sistema (que exista la carpeta, que el archivo tenga dos líneas) y otras el evento que
  emite el cmdlet (que se haya listado con `-Recurse`, que se haya ordenado por `Length` en
  descendente)— y una `solution` con los comandos que la resuelven. Esa `solution` es la que
  el **selector de fase** ejecuta en silencio para preparar el equipo.
- **Contenido separado de la lógica**: los textos viven en `data/missions.js` (datos puros,
  editables por el profesorado) y la lógica en `js/missions.js`, emparejados por el código
  `PSH-xx` según su posición.
- **Añadir o cambiar una tarea**: editar `data/missions.js` (y `data/gamification.js` si se
  añade una fase) y su `check`/`solution` en `js/missions.js`. Toda la interfaz (progreso,
  ficha, registro, informe) se genera a partir de esos datos.

## Verificación

Se ha probado en **Chrome real en modo *headless***, manejado por el protocolo DevTools (CDP)
desde Node.js, con un guion que simula a una persona jugando: **41 comprobaciones, todas
superadas y sin ningún error de JavaScript**. Se ejecuta con:

```bash
node .claude/skills/verificar-reto/scripts/run.mjs test-pwsh-basico
```

Cubre:

- la **partida completa**, resolviendo las 27 tareas con los comandos que propone cada ficha y
  comprobando que cada una se da por completada;
- el **comportamiento propio de PowerShell**: que el alias `ls` hace lo mismo que
  `Get-ChildItem`, que los cmdlets no distinguen mayúsculas de minúsculas, que se admiten
  abreviaturas de parámetro y `-Filter`, que la tubería filtra y proyecta objetos, que
  `Measure-Object` suma de verdad la propiedad `Length`, y que los errores (ruta inexistente,
  comando desconocido) son los de PowerShell;
- el **informe final**: XP por encima de 2000 puntos, las 27 filas de la tabla y al menos 5
  insignias conseguidas jugando sin pistas;
- **empezar por una fase**: que la portada ofrece las 5, que al arrancar en la fase 4 el
  equipo aparece con las carpetas y los archivos de las fases anteriores ya creados y que esas
  tareas no suman XP.

La portada del repositorio y la vista con `prefers-reduced-motion` se comprueban aparte, con
los guiones comunes del mismo directorio.

## Limitaciones conocidas

- El simulador reconoce **un subconjunto de PowerShell**, el suficiente para las tareas y para
  explorar alrededor: no hay variables, ni estructuras de control, ni ejecución de scripts, así
  que los `.ps1` de la carpeta `Scripts` se pueden leer y comentar, pero no lanzar.
- **No hay bloques de script arbitrarios**: `Where-Object` admite las dos formas habituales
  (`Where-Object Name -like "*.log"` y `Where-Object { $_.Length -gt 100 }`, encadenando
  condiciones con `-and`) y `ForEach-Object` acepta `{ $_.Propiedad }`, pero no cualquier
  expresión.
- En los retos de administración que comparten esta consola, algunos parámetros aceptan **texto
  plano donde un equipo real exige otro tipo**: `-Password`, por ejemplo, recibe una cadena en
  lugar de un `SecureString`. Conviene advertirlo al dar el salto a una máquina de verdad.
- `Get-Help` cubre los casi treinta cmdlets del reto; para cualquier otro responde que no
  encuentra la ayuda del tema. Solo cambia la salida con `-Examples`: `-Full`, `-Detailed` y
  `-Online` se aceptan, pero no hacen nada, y no existe `Update-Help`.
- No están `-WhatIf` ni `-Confirm`, ni la unidad `Env:`, ni los proveedores de registro
  (`HKLM:`), ni los cmdlets de red o de procesos.
- El progreso **no se guarda**: al recargar se empieza de cero (intencionado, para no almacenar
  datos). El selector de fase permite retomar el reto por donde se quedó.

## Archivos

| Archivo | Contenido |
|---|---|
| [`index.html`](index.html) | Marcado de las tres pantallas, el Bloc de notas y la guía de cmdlets |
| [`css/`](css/) · [`data/`](data/) · [`js/`](js/) | Estilos propios · escenario, gamificación y textos de las tareas · lógica de las tareas y arranque |
| [`../shared/`](../shared/) | Biblioteca común: terminal, intérprete, consola de PowerShell, sistema de archivos, editor, manuales, modales y motor de tareas |
| [`README.md`](README.md) | Este documento |

## Créditos

Made with 💖 by [@fvarrui](https://github.com/fvarrui) & [Claude](https://claude.ai).

Diseñado como reto digital de elaboración propia para el curso *La gamificación educativa*,
dentro de la propuesta «Operación Escudo Digital».
