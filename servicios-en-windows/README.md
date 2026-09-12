# Servicios en Windows

> Simulador gamificado de administración de servicios en una consola de PowerShell elevada.
> Reto digital de elaboración propia, hermano de [*Servicios en Linux*](../servicios-en-linux/),
> dentro de la experiencia «Operación Escudo Digital» de la empresa ficticia TecnoAtlántica.

---

## Índice

1. [Qué es](#qué-es)
2. [Cómo abrirlo](#cómo-abrirlo)
3. [Contexto educativo](#contexto-educativo)
4. [Objetivos de aprendizaje](#objetivos-de-aprendizaje)
5. [Cómo funciona](#cómo-funciona)
6. [Las 24 tareas](#las-24-tareas)
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

*Servicios en Windows* es un juego educativo que se ejecuta en el navegador. El alumnado hace
la **guardia de mañana** de TecnoAtlántica: son las 7:40 del 20 de octubre, la aplicación de
nóminas no arranca y **nadie puede fichar**. Con la cuenta `ana` (del grupo Administradores),
entra por Escritorio remoto en el servidor `SRV-APP` y abre una consola de PowerShell elevada.

Toda la partida se juega **escribiendo comandos reales**: `Get-Service`, `Start-Service`,
`Set-Service -StartupType`, `Restart-Service`, `sc.exe qc`, `net stop`, `Get-Process` y la
tubería de objetos para filtrar y ordenar. No hay botones que resuelvan la incidencia ni
respuestas de opción múltiple: hay una consola que responde como la de verdad, con sus
mensajes de error en español.

La causa del incidente es el concepto que vertebra el reto: el servicio `AtlanteApp` tiene el
**tipo de inicio en Deshabilitado**, y en Windows eso no significa «no arranca solo», significa
**«no arranca, ni a mano»**. Quien intente la solución evidente (`Start-Service`) se topará con
un rechazo, y tendrá que descubrir que antes hay que cambiar la configuración con
`Set-Service -StartupType`. De paso, el servidor esconde dos incoherencias más: la cola de
impresión (`Spooler`) arranca sola en una máquina sin impresoras, y la administración remota
(`WinRM`) está parada y en Manual.

Funciona sin conexión a Internet, sin instalar nada y sin servidor.

## Cómo abrirlo

- **En local**: doble clic en [`index.html`](index.html). Funciona en cualquier navegador
  moderno (Chrome, Edge, Firefox, Safari).
- **En el aula virtual (EVAGD/Moodle)**: subir la carpeta completa del reto **junto con la
  carpeta [`shared/`](../shared/)** (por ejemplo, en un ZIP con las dos) y enlazar
  `servicios-en-windows/index.html`. El reto usa CSS y scripts clásicos, sin módulos ES ni
  `fetch`, así que también funciona desde el sistema de ficheros.
- **En la web**: publicar el repositorio con GitHub Pages o cualquier alojamiento estático.
  No necesita *backend*.

Una partida completa dura entre **20 y 35 minutos**. Desde la portada se puede **empezar en
cualquiera de las 5 fases**: el servidor se prepara automáticamente con las tareas anteriores
ya resueltas (y sin sumar XP), así que el reto se puede repartir o retomar por donde se quedó.

## Contexto educativo

| | |
|---|---|
| **Temas** | Windows · Servicios · Tipos de inicio · Administración de sistemas |
| **Encaja en** | Cualquier materia en la que se administren servidores Windows, se trabaje con PowerShell o se atiendan incidencias de sistemas |
| **Punto de partida** | Haber escrito alguna vez en una consola; no hace falta saber PowerShell ni haber administrado un Windows Server |
| **Narrativa** | Guardia de mañana en TecnoAtlántica: incidencia 4503, la aplicación de nóminas no arranca y la plantilla no puede fichar |
| **Modalidad** | Presencial, con apoyo del aula virtual. También sirve en línea, de forma autónoma |

El reto es el **gemelo Windows** de *Servicios en Linux*: misma duración, mismas fases y misma
estructura de tareas, pero con el sistema de servicios de Windows y sus dos ejes de
configuración. Jugar los dos, en el orden que sea, hace evidente por comparación lo que cada
sistema resuelve de una manera distinta; en particular, que `systemctl disable` y
`Set-Service -StartupType Disabled` **no significan lo mismo**.

## Objetivos de aprendizaje

Al terminar el reto, el alumnado debería ser capaz de:

1. **Identificar** los servicios de un equipo Windows y leer su ficha: nombre corto, nombre
   para mostrar, estado y tipo de inicio (`Get-Service`, `sc.exe query`, `sc.exe qc`).
2. **Distinguir los dos ejes independientes** de un servicio: el **estado** (`Status`:
   *Running* / *Stopped*, lo que pasa ahora mismo) y el **tipo de inicio** (`StartType`:
   *Automatic* / *Manual* / *Disabled*, lo que pasará en el próximo arranque).
3. **Explicar por qué un servicio deshabilitado no arranca ni a mano**, y **aplicar** la
   secuencia correcta: comprobar la configuración → `Set-Service -StartupType` →
   `Start-Service` → verificar.
4. **Gobernar el estado** de un servicio con los tres verbos (`Start-`, `Stop-`,
   `Restart-Service`) y reconocer sus equivalentes clásicos (`net start`, `net stop`,
   `sc.exe`), sabiendo que `sc` a secas es el alias de `Set-Content`.
5. **Manejar la tubería de objetos** de PowerShell para responder preguntas reales:
   qué está parado, qué arranca solo, qué queda en marcha al cerrar la guardia
   (`Where-Object`, `Sort-Object`, `Format-Table`, redirección a un archivo).
6. **Evaluar y decidir** qué debe arrancar solo en un servidor y qué no, reduciendo la
   superficie expuesta (la cola de impresión) sin tumbar nada que la empresa necesite
   (la base de datos, el Escritorio remoto por el que se administra la máquina).
7. **Documentar la intervención**: dejar el estado final guardado y anotar en el parte de
   guardia la causa y la solución, de modo que otra persona lo entienda sin llamar.

## Cómo funciona

### Las tres pantallas

1. **Portada (aviso de guardia)**: el mensaje del centro de guardia con la incidencia 4503,
   un resumen de las mecánicas, el **selector de fase inicial** y la **guía rápida de
   servicios** (un modal con la tabla de `Status` frente a `StartType`, los cmdlets por
   familias y la trampa de `sc`).
2. **Juego**: la consola de PowerShell ocupa casi toda la pantalla. Arriba, una barra con el
   progreso por fases, el reloj, la XP y el nivel. En el lateral, la **ficha de la tarea**
   en curso y el **parte de guardia**, que va registrando lo resuelto.
3. **Parte de guardia (informe final)**: XP, nivel alcanzado, tiempo, pistas usadas, tareas
   resueltas, insignias, la tabla de las 24 tareas con el comando que resolvió cada una y la
   lista de decisiones arriesgadas.

### El desarrollo de una partida

Las tareas llegan **de una en una**, con su código (`WSV-01`…`WSV-24`), su origen (el centro
de guardia, Nayra Suárez de Sistemas o el departamento de Personas y Talento), sus síntomas y
un objetivo. Al completar una, a los pocos segundos entra la siguiente con un aviso en la
consola. Cada ficha ofrece **tres pistas graduadas**: la primera orienta, la segunda concreta
el cmdlet o el parámetro y solo la tercera da el comando literal; cada una cuesta 25 XP, pero
nunca bloquea el avance.

Si algo se resuelve **antes** de que llegue su tarea (por ejemplo, ver el `LEEME.txt` por
curiosidad), la tarea aparece igualmente y se completa sola con un **bonus de 25 XP**: el
juego premia ir por delante.

### Las mecánicas clave

- **El servidor es un modelo, no un guion.** Seis servicios con estado, tipo de inicio, PID,
  cuenta con la que se ejecutan y registro propio. Todas las salidas (`Get-Service`,
  `sc.exe qc`, `Get-Process`, `net`) se calculan a partir de ese modelo, así que cualquier
  cambio se ve reflejado en todas partes a la vez.
- **Las comprobaciones miran el estado, no la cadena tecleada.** Una tarea se da por resuelta
  cuando el servidor queda como debe (por ejemplo, `WinRM` en automático y en marcha), no
  cuando se escribe un comando concreto. Por eso casi todas admiten **varios caminos**:
  `Set-Service -StartupType` o `sc.exe config … start=`, `Stop-Service` o `net stop`.
- **Las decisiones tienen consecuencias.** Nada está bloqueado: se puede detener la base de
  datos, dejar parada otra vez la aplicación de nóminas o incluso apagar el Escritorio remoto
  por el que se ha entrado. El juego lo permite, lo explica, resta 50 XP (una sola vez por
  tipo) y lo anota en el parte de guardia.
- **El informe se adapta al final real.** Si `AtlanteApp` no queda en Automático, el parte
  avisa de que no arrancará sola en el próximo reinicio; si el `Spooler` sigue en Automático,
  avisa de que volverá a arrancar.

## Las 24 tareas

### Fase 1 · Diagnóstico

| # | Código | Tarea | Qué se practica |
|---|--------|-------|-----------------|
| 1 | WSV-01 | El parte de la mañana | `Get-Content` (alias `cat`, `type`), leer el contexto antes de tocar |
| 2 | WSV-02 | ¿Qué servicios hay? | `Get-Service`: `Status`, `Name`, `DisplayName` y `StartType` |
| 3 | WSV-03 | El servicio de nóminas | `Get-Service -Name`, leer una ficha concreta |
| 4 | WSV-04 | ¿Qué más está parado? | `Where-Object Status -eq Stopped`: filtrar objetos, no leer a ojo |
| 5 | WSV-05 | Y los procesos, por si acaso | `Get-Process`, comprobación cruzada de lo que está vivo |

### Fase 2 · Deshabilitado

| # | Código | Tarea | Qué se practica |
|---|--------|-------|-----------------|
| 6 | WSV-06 | Intenta arrancarlo | `Start-Service` **rechazado**: leer el mensaje de error completo |
| 7 | WSV-07 | Mira su configuración | `sc.exe qc` y la trampa del alias `sc` = `Set-Content` |
| 8 | WSV-08 | Habilítalo | `Set-Service -StartupType Automatic` |
| 9 | WSV-09 | Ahora sí, arráncalo | `Start-Service`: cambiar el inicio no arranca nada |
| 10 | WSV-10 | Confírmalo | `Get-Service`: verificar siempre antes de dar por cerrado |

### Fase 3 · Tipos de inicio

| # | Código | Tarea | Qué se practica |
|---|--------|-------|-----------------|
| 11 | WSV-11 | ¿Qué arranca solo en este servidor? | `Where-Object StartType -eq Automatic` |
| 12 | WSV-12 | ¿Una cola de impresión aquí? | `Set-Service -StartupType Disabled`: reducir superficie expuesta |
| 13 | WSV-13 | Y párala ahora | `Stop-Service`: deshabilitar no detiene lo que ya corre |
| 14 | WSV-14 | Comprueba la cola de impresión | Verificar **las dos** propiedades: *Stopped* y *Disabled* |
| 15 | WSV-15 | La administración remota | `Set-Service` + `Start-Service` encadenados con `;` |

### Fase 4 · Herramientas

| # | Código | Tarea | Qué se practica |
|---|--------|-------|-----------------|
| 16 | WSV-16 | La consulta a la vieja usanza | `sc.exe query` frente a `sc.exe qc` |
| 17 | WSV-17 | Detener con net | `net stop`, que admite el nombre corto y el nombre para mostrar |
| 18 | WSV-18 | La aplicación va lenta | `Restart-Service` sobre la base de datos… sin dejarla parada |
| 19 | WSV-19 | ¿Y el proceso? | `Get-Process -Name` con comodines; `Stop-Service` antes que `Stop-Process` |
| 20 | WSV-20 | El registro del servicio | `Get-Content` con ruta completa: quién dejó el servicio deshabilitado |

### Fase 5 · Cierre

| # | Código | Tarea | Qué se practica |
|---|--------|-------|-----------------|
| 21 | WSV-21 | El Escritorio remoto, intacto | Comprobar `TermService`: no serrar la rama en la que estás sentado |
| 22 | WSV-22 | Repasa lo que queda en marcha | Tubería de tres pasos: obtener → filtrar → ordenar |
| 23 | WSV-23 | Guarda el estado final | `Format-Table` y redirección `>` a un archivo |
| 24 | WSV-24 | Cierra el parte | `Add-Content`: documentar causa y solución |

## Comandos disponibles

| Tipo | Comandos |
|---|---|
| Consultar servicios | `Get-Service [-Name] [-DisplayName]` (admite comodines), `sc.exe query <svc>`, `sc.exe qc <svc>` |
| Gobernar el estado | `Start-Service`, `Stop-Service [-Force]`, `Restart-Service`, `[-PassThru]`, `net start <svc>`, `net stop <svc>` |
| Gobernar el inicio | `Set-Service -Name <svc> -StartupType Automatic\|Manual\|Disabled [-Status] [-Description] [-DisplayName]`, `sc.exe config <svc> start= auto\|demand\|disabled` |
| Procesos | `Get-Process [-Name] [-Id]`, `Stop-Process -Id <id>` |
| Tubería de objetos | `Where-Object`, `Select-Object`, `Sort-Object`, `Measure-Object`, `ForEach-Object`, `Group-Object`, `Format-Table`, `Format-List`, `Get-Member` |
| Archivos y texto | `Get-Content`, `Set-Content`, `Add-Content`, `Get-ChildItem`, `New-Item`, `Copy-Item`, `Move-Item`, `Rename-Item`, `Remove-Item`, `Test-Path`, `Select-String`, `notepad` (Bloc de notas simulado) |
| Sesión y ayuda | `Get-Help <comando> [-Examples]`, `Get-Command`, `Get-Alias`, `Get-History`, `Get-Date`, `Get-Location`, `Set-Location`, `Clear-Host`, `Write-Output`, `Write-Host` |
| Alias clásicos | `ls`, `dir`, `cd`, `cat`, `type`, `echo`, `cls`, `ps`, `gsv`, `sasv`, `spsv`, `kill`, `man`, `sort`, `select`, `ft`, `where`, `?`… |
| Composición | Encadenado con `;`, `&&` y `\|\|`; tubería de objetos con `\|`; redirección `>` y `>>`; comodines (`Atlante*`); comillas simples y dobles |

Atajos: <kbd>↑</kbd>/<kbd>↓</kbd> historial, <kbd>Tab</kbd> autocompletar (comandos, alias,
rutas y nombres de servicio), <kbd>Ctrl</kbd>+<kbd>L</kbd> limpiar la pantalla,
<kbd>Ctrl</kbd>+<kbd>C</kbd> cancelar la línea. Con la línea vacía, <kbd>Tab</kbd> saca el foco
de la consola al resto de la página.

La ayuda integrada (`Get-Help`) cubre una veintena de comandos del reto con sinopsis, sintaxis,
parámetros y ejemplos, y consultarla otorga una insignia. La **guía rápida de servicios**
(botón ❓) está disponible desde la portada y durante toda la partida.

## Cómo se diseñó

### Principios que guiaron las decisiones

- **Primero el aprendizaje, después la narrativa.** La secuencia de tareas es la secuencia
  real de diagnóstico de una incidencia de servicios: mirar antes de tocar, probar lo
  evidente, leer el error, corregir la causa, verificar, repasar el resto del servidor y
  documentar. La historia (las nóminas, el fichaje, la guardia de las 7:40) se montó encima
  para dar urgencia y sentido, no al revés.
- **Un concepto central, repetido desde cinco ángulos.** Todo el reto gira alrededor de la
  independencia entre **estado** y **tipo de inicio**. Aparece en el fallo inicial
  (*Disabled* impide arrancar), en la tarea 13 (deshabilitar el `Spooler` **no** lo detiene),
  en la 15 (poner `WinRM` en automático **no** lo arranca), en la verificación de la 14 (hay
  que comprobar las dos columnas) y en el informe final (avisa si algo queda mal configurado
  para el próximo reinicio). Un solo malentendido, atacado media docena de veces.
- **El simulador no enseña cosas falsas.** `Start-Service` sobre un servicio deshabilitado
  falla con el mensaje real («No se puede iniciar el servicio…») y una nota que orienta sin
  dar el comando. `Set-Service -StartupType` no arranca ni detiene nada. `sc.exe qc` muestra
  `AUTO_START`, `DEMAND_START` o `DISABLED`, con los códigos numéricos de la herramienta de
  verdad. Un servicio inexistente responde «No se encuentra ningún servicio con el nombre de
  servicio…». Y la administración requiere consola elevada: sin ella, «Acceso denegado».
- **La trampa de `sc` se enseña haciéndola.** En PowerShell, `sc` es el alias de
  `Set-Content`, así que `sc query AtlanteApp` no consulta nada: **crea silenciosamente un
  archivo llamado `query`** con el texto `AtlanteApp` dentro. El simulador reproduce
  exactamente ese comportamiento, y un `Get-ChildItem` posterior deja el desconcierto a la
  vista. Es el tipo de error que cuesta media hora la primera vez que se comete en un
  servidor real, y aquí cuesta veinte segundos.
- **Varias soluciones válidas por tarea.** Casi todas las comprobaciones miran el estado del
  servidor, no el texto tecleado: cambiar el tipo de inicio con `Set-Service` o con
  `sc.exe config`, detener con `Stop-Service` o con `net stop`, listar con `Get-Service` o
  con su alias `gsv`. Solo las tareas cuyo objetivo **es** conocer una herramienta concreta
  (`sc.exe qc`, `sc.exe query`, `net stop`) exigen esa herramienta.
- **Las acciones peligrosas se permiten, no se bloquean.** Se puede parar `TermService`,
  `MSSQLSERVER` o volver a parar `AtlanteApp`. El juego avisa con un mensaje que explica la
  consecuencia («es la vía por la que estás administrando este servidor»), resta 50 XP una
  sola vez por tipo y lo anota en el informe. El objetivo es desarrollar criterio, no impedir
  errores; y un servidor administrado en remoto es justo donde ese criterio hace falta.
- **Los errores orientan sin resolver.** Los mensajes dicen qué ha pasado y en qué dirección
  mirar («El servicio está deshabilitado. Cambia su tipo de inicio con Set-Service
  -StartupType Manual|Automatic»), pero la ficha de la tarea nunca contiene la solución
  literal: esa solo aparece en la tercera pista, que cuesta XP.

### Evolución del diseño

| Decisión | Qué se probó | Por qué quedó así |
|---|---|---|
| El fallo inicial | Primero se pensó en un servicio simplemente parado | Un servicio parado se arranca a la primera y no enseña nada; **Deshabilitado** obliga a diagnosticar y es un error real y frecuente |
| El orden de las fases | Empezar directamente por arreglar las nóminas | Se antepuso una fase de **diagnóstico** completa: en una guardia, mirar antes de tocar es la mitad del oficio |
| La herramienta `sc` | Descartar las herramientas clásicas por «antiguas» | Siguen en todos los Windows y llenan la documentación; se les dio una fase propia, y de paso sirven para enseñar el alias de `Set-Content` |
| El repaso del servidor | Terminar cuando la aplicación arranca | La incidencia se resuelve en la fase 2, pero el trabajo de sistemas no: las fases 3 a 5 añaden la reducción de superficie, las herramientas y la documentación |
| La base de datos | Impedir que se pueda detener | Se permite, con aviso y penalización: la tarea 18 pide **reiniciarla**, y quien confunda `Restart-Service` con `Stop-Service` aprende la diferencia en el informe |
| El panel lateral | Reproducir la consola gráfica de Servicios (`services.msc`) | Se descartó: habría dado la respuesta de un vistazo. El lateral muestra la ficha de la tarea y el parte; el estado se consulta **con comandos** |

### Comparación con *Servicios en Linux*

| | *Servicios en Linux* | *Servicios en Windows* |
|---|---|---|
| Consola | Bash sobre systemd (`systemctl`, `journalctl`) | PowerShell elevado (cmdlets, `sc.exe`, `net`) |
| Concepto central | «Activo ahora» frente a «habilitado para el arranque» | `Status` frente a `StartType`, con **Disabled** que impide arrancar incluso a mano |
| Diagnóstico | Registros del sistema con `journalctl` | Ficha del servicio y herramientas clásicas (`sc.exe qc`) |
| Salida de los comandos | Texto que se filtra con `grep` | **Objetos** que se filtran con `Where-Object` y se ordenan con `Sort-Object` |
| Incidente | Conflicto de puertos | Tipo de inicio en Deshabilitado |

## Elementos de gamificación

Relación con los **12 componentes** vistos en el curso *La gamificación educativa* (solo se
usan los que encajan):

| Componente | ¿Se usa? | Cómo | Por qué |
|---|---|---|---|
| **Misiones** | ✅ | 24 tareas encadenadas (WSV-01…WSV-24) agrupadas en 5 fases, con código, origen y objetivo | Se habla de tareas de guardia y de incidencias, nunca de ejercicios |
| **Sorpresa** | ✅ | El `Start-Service` que falla, la cola de impresión que nadie esperaba, la llamada de Personas y Talento en plena fase 4 | Mantiene la tensión y reproduce cómo llega el trabajo en una guardia real |
| **Desbloqueo de contenido** | ✅ | Cada tarea se revela al completar la anterior; las fases se abren en orden | Hay que avanzar para descubrir qué más hay mal en el servidor |
| **Puntos (XP)** | ✅ | 75-175 XP por tarea (3150 en total), −25 por pista, −50 por decisión arriesgada, +25 por adelantarse | *Feedback* inmediato; las pistas cuestan, pero nunca bloquean |
| **Niveles** | ✅ | 4 niveles: *Mira el estado* → *Arranca y detiene* → *Controla el inicio* → *Cierra la guardia* | Los nombres describen la competencia adquirida, no un rango vacío |
| **Insignias** | ✅ | 6 insignias ligadas a buenas prácticas (ver abajo) | Reconocen *cómo* se ha trabajado, no solo terminar |
| **Barra de progreso** | ✅ | Progreso por fases, contador de tareas y parte de guardia lateral | Ver el avance anima a seguir y ordena el trabajo |
| **Recompensas** | ✅ | Pistas graduadas «compradas» con XP y guía rápida siempre accesible | La ayuda existe, pero hay que decidir si compensa |
| **Tablero de clasificación** | ❌ | — | Deliberadamente no: el parte de guardia es individual y no se comparte |
| **Cuenta atrás** | ❌ | Reloj que cuenta hacia arriba, sin límite | Una cuenta atrás invita a teclear sin entender; la prisa ya la pone la narrativa |
| **Avatar** | ❌ | — | No aporta: la identidad es la cuenta `ana` y sus privilegios, que sí importan |
| **Poder** | ❌ | — | No encaja; el único «poder» es la consola elevada, que ya forma parte del contenido |

**Insignias**: 🛡️ *Sin daños colaterales* (ninguna decisión arriesgada), 🧠 *Autosuficiente*
(cerrar la guardia sin pistas), 📚 *Get-Help* (consultar la ayuda integrada de un comando),
🔁 *Inicio bajo control* (cada servicio queda con el tipo de inicio que le corresponde:
`AtlanteApp`, `WinRM`, `MSSQLSERVER` y `TermService` en automático y `Spooler` deshabilitado),
🧩 *Filtrar servicios* (usar la tubería de objetos para filtrar por estado o por tipo de
inicio), ⚡ *Guardia corta* (resolver el incidente en menos de 22 minutos).

La insignia *Inicio bajo control* se comprueba **al cerrar la guardia**, no tarea a tarea: es
la que obliga a pensar en el servidor como un conjunto y no como una lista de encargos.

### Perfiles de jugador (Bartle)

- **Explorer**: la consola es un simulador de PowerShell completo, con mucho más de lo que
  las tareas piden: `Get-Alias` (para descubrir qué es realmente `sc`), `Get-Member` para ver
  las propiedades de un objeto de servicio, `Get-Command`, `Group-Object`, `Select-String`,
  el Bloc de notas simulado, el árbol de carpetas `C:\` y los registros de cada servicio.
- **Achiever**: XP, 4 niveles, 6 insignias y un parte de guardia final con las 24 tareas y el
  comando con el que se resolvió cada una.
- **Killer**: el tiempo final y la insignia *Guardia corta*, sin tablero público; los partes
  se pueden comparar en la puesta en común.
- **Socializer**: el trabajo en parejas y la puesta en común posterior, donde se comparan los
  caminos elegidos (¿`Set-Service` o `sc.exe config`? ¿`Stop-Service` o `net stop`?).

### Estado de *flow*

La dificultad sube por tramos y siempre por delante de la habilidad, pero al alcance: la fase
1 solo pide **leer** (ningún comando modifica nada), la fase 2 introduce el fallo conceptual
con el andamiaje de la ficha y las pistas, la fase 3 pide aplicar lo aprendido a dos servicios
distintos **sin que nadie lo indique paso a paso**, la fase 4 cambia de herramientas y la 5
pide componer tuberías y documentar. El reloj no limita, las pistas evitan el bloqueo y el
selector de fase permite entrar al nivel adecuado, de modo que ni el aburrimiento ni la
ansiedad rompen el estado de *flow*.

## Accesibilidad, inclusión y protección de datos

### Accesibilidad

- **Todo se maneja con teclado.** Con la línea vacía, <kbd>Tab</kbd> saca el foco de la
  consola hacia el resto de la página, así que el autocompletado no lo atrapa.
- **Lectores de pantalla**: la salida de la consola es un `role="log"`; una región
  `role="status"` independiente anuncia solo lo importante (nueva tarea con su objetivo,
  tarea resuelta, pistas, subidas de nivel, decisiones arriesgadas).
- **Nunca solo color**: los estados combinan color, icono y texto, tanto en la barra de fases
  como en la ficha de la tarea y en el informe final.
- **Contraste alto** sobre fondo oscuro, foco visible y tipografía monoespaciada en la
  consola.
- **Movimiento reducido**: con `prefers-reduced-motion` se quitan las animaciones y se acortan
  las esperas entre tareas.
- **Modales accesibles**: la guía rápida atrapa el foco, se cierra con <kbd>Esc</kbd> o
  pulsando fuera, y devuelve el foco al botón que la abrió.
- **Adaptable**: en pantallas estrechas el panel lateral se coloca sobre la consola.
  Comprobado a 400 px de ancho, sin scroll horizontal; en escritorio solo hace scroll la
  consola.

### Inclusión

- **Cada cual a su ritmo**: sin tiempo límite; el reloj es informativo y solo condiciona una
  insignia opcional.
- **Ayuda graduada**: tres pistas por tarea, guía rápida de servicios siempre disponible y
  `Get-Help` dentro del juego para cada comando.
- **Se puede empezar por cualquier fase**, lo que permite repartir el reto en varias sesiones,
  repetir solo la parte que costó o ajustar el punto de entrada a cada persona.
- **Sin castigo definitivo**: se puede reiniciar sin penalización y ninguna acción deja la
  partida en un estado sin salida.
- **Tono y lenguaje**: español correcto, mensajes que orientan en lugar de culpar y nombres de
  nivel que describen lo aprendido.

### Protección de datos y uso responsable

- **No recoge ningún dato personal**: no pide nombre, ni correo, ni identificación de ningún
  tipo.
- **No usa cookies, ni `localStorage`, ni almacenamiento del navegador**: el progreso vive en
  la memoria de la pestaña y desaparece al cerrarla.
- **No envía nada a ningún servidor** ni depende de servicios externos (ni CDN, ni fuentes
  web, ni analítica).
- **Es una simulación**: ningún sistema real se consulta ni se modifica. El servidor `SRV-APP`
  y sus servicios están en la propia página.
- Buen momento para hablar de **uso responsable de privilegios**: la cuenta con la que se
  juega es administradora, y el reto muestra que con esa cuenta se puede dejar sin fichar a
  toda la plantilla o quedarse fuera del servidor con un solo comando.

## Uso en el aula

**Antes**

- Pregunta de arranque, sin tocar el teclado: «un servicio no arranca y al pedirlo a mano
  tampoco; ¿qué puede estar pasando?». Recoger las hipótesis en la pizarra y volver a ellas al
  final.
- Presentar el vocabulario mínimo: servicio, nombre corto y nombre para mostrar, estado y tipo
  de inicio. Nada más: el resto lo descubren jugando.
- Si ya se jugó *Servicios en Linux*, recordar qué hacía `systemctl enable`/`disable` y
  anunciar que en Windows **no significa lo mismo**.

**Durante**

- Individual o **en parejas** (una persona teclea y la otra consulta la guía rápida y
  `Get-Help`; se cambia de rol al terminar cada fase).
- Sugerencia de reparto: fases 1 y 2 en la primera sesión (el incidente queda resuelto, que es
  un buen punto de corte narrativo) y fases 3 a 5 en la segunda, usando el **selector de
  fase** de la portada.
- El profesorado circula y pregunta en lugar de resolver: «¿qué dice exactamente el error?»,
  «¿qué columna estás mirando, `Status` o `StartType`?», «si reiniciáramos el servidor ahora
  mismo, ¿qué arrancaría?».
- Cuando alguien escriba `sc query`, no avisar: dejar que aparezca el archivo `query` con
  `Get-ChildItem`. Se recuerda para siempre.

**Después**

- **Puesta en común**: ¿por qué no arrancaba el servicio? ¿Qué diferencia hay entre detener y
  deshabilitar? ¿Quién usó `sc.exe config` en vez de `Set-Service`? ¿Alguien tumbó la base de
  datos o el Escritorio remoto, y qué habría pasado en un servidor real? ¿Qué servicios de un
  servidor conviene dejar en Manual y por qué?
- **Comparación con Linux** (si se han jugado los dos): tabla a dos columnas en la pizarra con
  `systemctl` frente a los cmdlets, y la diferencia de significado de «deshabilitado».
- **Evidencia para el aula virtual**: captura del parte de guardia final, o el texto de la
  línea que cada cual añadió a `guardia.txt` explicando la causa.
- **Ampliación**: repetir la secuencia en una máquina virtual Windows real (o en
  `services.msc`) y comprobar que responde igual; buscar en un equipo propio qué servicios
  están en Automático sin hacer falta.

## Detalles técnicos

HTML semántico, CSS y JavaScript *vanilla* (sin *frameworks*, sin dependencias, sin *build* y
sin módulos ES, para que funcione también con `file://`). El reto **apenas aporta código**: se
monta entero sobre la biblioteca [`shared/`](../shared/) (espacio de nombres `RG`) y solo
añade los datos del escenario, el contenido de las tareas y sus comprobaciones.

| Fichero | Contenido |
|---|---|
| `index.html` | Solo el marcado de las tres pantallas y de la guía rápida de servicios |
| `css/reto.css` | Los pocos estilos propios del reto, sobre los de la biblioteca común |
| `data/config.js` | El escenario: el equipo `SRV-APP`, la cuenta `ana`, la fecha y hora del incidente, los **6 servicios** con su estado, tipo de inicio, PID y registro, y los archivos del disco |
| `data/gamification.js` | Las 5 fases, los 4 niveles, las 6 insignias y las constantes de puntuación |
| `data/missions.js` | El contenido de las 24 tareas (textos, objetivos y pistas), sin nada de lógica |
| `js/missions.js` | La lógica: el `check` y la `solution` de cada tarea, y la vigilancia de los servicios críticos |
| `js/main.js` | Arranque: crea el sandbox con las fases, los niveles, la ayuda y los textos del informe |

De la biblioteca compartida, este reto usa:

| Módulo de `shared/` | Qué aporta |
|---|---|
| `js/sandbox.js` | El arranque común: pantallas, motor de tareas, progreso por fases, selector de fase inicial, informe final y montaje de consola e intérprete |
| `js/sysmodel.js` | El modelo del sistema: usuarios, grupos, **servicios** (estado, tipo de inicio, PID, cuenta, registro) y la lista de procesos derivada de ellos |
| `js/cmd-pwsh-admin.js` | Los cmdlets de servicios (`Get-`/`Start-`/`Stop-`/`Restart-`/`Set-Service`), los procesos y las herramientas clásicas `sc.exe` y `net` |
| `js/cmd-pwsh.js` | El resto de PowerShell: archivos, texto, tubería de objetos, alias, `Get-Help` y el mensaje de comando no reconocido |
| `js/vfs.js` | El sistema de archivos simulado con permisos NTFS |
| `js/terminal.js` · `js/shell.js` | La consola (salida coloreada, historial, autocompletado) y el intérprete (comillas, comodines, `;`, tuberías y redirecciones) |
| `js/game.js` | Estado de las tareas, XP, niveles, pistas, insignias y decisiones arriesgadas |
| `js/man.js` · `data/help-pwsh.js` | Las páginas de `Get-Help` de los comandos del reto |
| `js/modal.js` · `js/editor.js` · `js/core.js` | Diálogos accesibles, editor simulado, utilidades, reloj y anuncios |
| `css/*` | Variables, base, pantallas, barra de progreso, fases, consola, editor y modales |

Claves del diseño:

- **Un modelo de servicios, muchas salidas.** Cada servicio es un objeto con `state`,
  `startup`, `pid`, cuenta y registro. `Get-Service`, `sc.exe query`, `sc.exe qc`, `net` y
  `Get-Process` leen ese mismo objeto, así que es imposible que se contradigan.
- **Tubería de objetos de verdad.** Los cmdlets no imprimen texto: emiten objetos con sus
  propiedades (`Status`, `Name`, `DisplayName`, `StartType`) que los filtros
  (`Where-Object`, `Sort-Object`, `Format-Table`…) reciben y transforman. Solo al final se
  renderiza la tabla. Por eso `Where-Object StartType -eq Automatic` funciona igual que en
  PowerShell.
- **Contenido separado de la lógica.** Los textos de las tareas viven en `data/missions.js`
  (datos puros, editables por el profesorado sin tocar código) y sus comprobaciones en
  `js/missions.js`, emparejados por el código `WSV-xx` que se asigna por posición.
- **Cada tarea declara su `solution`**, la secuencia de comandos que la resuelve. Es la que
  ejecuta en silencio el **selector de fase** para dejar el servidor en el punto de partida
  correcto, sin sumar XP.
- **Vigilancia global** (`SW.watch`): un observador aparte de las tareas que detecta cuándo se
  detiene o se deshabilita un servicio crítico y anota la decisión arriesgada.
- **Añadir o cambiar una tarea**: editar `data/missions.js` (y `data/gamification.js` si se
  toca una fase, un nivel o una insignia) y añadir su `check`/`solution` en `js/missions.js`.
  Toda la interfaz (progreso, ficha, parte y informe) se genera a partir de esos datos.

## Verificación

Se ha probado en **Chrome real en modo *headless***, manejado por el protocolo DevTools (CDP)
desde Node.js, con un guion que simula a una persona jugando: **37 comprobaciones, todas
superadas y sin ningún error de JavaScript**. Se ejecuta con:

```bash
node .claude/skills/verificar-reto/scripts/run.mjs test-servicios-windows
```

Cubre:

- que la portada ofrece las **5 fases** como punto de partida;
- que un servicio en *Disabled* **no arranca ni a mano**, y que la consola explica por qué;
- la **partida completa**: las 24 tareas, resueltas con los comandos que propone cada ficha;
- el **estado final del servidor**: `AtlanteApp` en marcha y en automático, la cola de
  impresión parada y deshabilitada, la administración remota disponible y `sc.exe qc`
  reflejando el tipo de inicio cambiado;
- que **`sc` es el alias de `Set-Content`** (`Get-Alias sc`), que es la razón de escribir
  `sc.exe`, y que un servicio inexistente responde con el mensaje de PowerShell;
- el **informe final**: XP total (3150 en un recorrido sin pistas ni penalizaciones), las 24
  filas de la tabla y al menos 5 insignias;
- que **parar la base de datos queda anotado** como decisión arriesgada, entrando además
  directamente por la fase 4 para comprobar que el selector de fase prepara bien el servidor.

Además, el guion de **movimiento reducido** y el de la **portada del repositorio** se ejecutan
sobre todos los retos con `node .claude/skills/verificar-reto/scripts/run.mjs`.

## Limitaciones conocidas

- **No se modelan las dependencias entre servicios.** `AtlanteApp` «depende» de
  `MSSQLSERVER` en la ficha y en el `LEEME.txt`, pero detener la base de datos no impide que
  la aplicación arranque: la consecuencia es narrativa (una decisión arriesgada anotada en el
  informe), no técnica. En un Windows real, el Administrador de control de servicios lo
  impediría.
- **No hay Visor de eventos ni `Get-WinEvent`.** El registro de cada servicio es una simple
  lista de líneas dentro de los datos del escenario; en el juego, la pista sobre quién
  deshabilitó el servicio se lee en un archivo de texto. El manejo de registros de Windows
  queda fuera del reto.
- **No existe la consola gráfica** (`services.msc`), deliberadamente: el reto se juega
  escribiendo comandos.
- `sc.exe` implementa solo `query`, `qc` y `config start=`; no hay `sc create`, `sc delete`,
  `sc description` ni consultas remotas (`\\equipo`).
- No se simulan las **cuentas de servicio** (aparecen en los datos, pero no se pueden cambiar
  con `-Credential`), ni las opciones de recuperación, ni los tiempos de espera al detener un
  servicio: los cambios son instantáneos.
- El intérprete **no es un PowerShell real**: no hay variables, expresiones, `ForEach-Object`
  con bloques de script arbitrarios, scripts `.ps1` ni ejecución en segundo plano.
- El progreso **no se guarda**: al recargar la página se empieza de cero (intencionado, para
  no almacenar ningún dato). El selector de fase permite retomar el reto por donde se quedó.

## Archivos

| Archivo | Contenido |
|---|---|
| [`index.html`](index.html) | Marcado de las tres pantallas y de la guía rápida de servicios |
| [`css/`](css/) · [`data/`](data/) · [`js/`](js/) | Estilos propios · escenario, gamificación y textos de las tareas · lógica de las tareas y arranque |
| [`../shared/`](../shared/) | Biblioteca común: consola, intérprete, modelo del sistema, comandos de PowerShell, motor de tareas y sandbox |
| [`README.md`](README.md) | Este documento |

## Créditos

Made with 💖 by [@fvarrui](https://github.com/fvarrui) & [Claude](https://claude.ai).

Diseñado como reto digital de elaboración propia para el curso *La gamificación educativa*,
dentro de la propuesta «Operación Escudo Digital».
