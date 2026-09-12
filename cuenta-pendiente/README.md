# Cuenta pendiente

> Simulador gamificado de administración de cuentas locales en una consola de PowerShell elevada.
> Reto digital de elaboración propia, hermano de
> [*Cuenta atrás*](../cuenta-atras/): la misma semana de altas y
> bajas, resuelta en un servidor Windows fuera de dominio.

---

## Índice

1. [Qué es](#qué-es)
2. [Cómo abrirlo](#cómo-abrirlo)
3. [Contexto educativo](#contexto-educativo)
4. [Objetivos de aprendizaje](#objetivos-de-aprendizaje)
5. [Cómo funciona](#cómo-funciona)
6. [Las 25 tareas](#las-25-tareas)
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

*Cuenta pendiente* es un juego educativo que se ejecuta en el navegador. Quien
juega es **Linda Hamilton**, del equipo de sistemas de la empresa ficticia **TecnoAtlántica**, y
tiene por delante una semana corriente de administración en `SRV-OFICINA`: entran dos personas
nuevas, se va otra, hay que crear un grupo para el plan de formación y hay que hacer algo con
esa cuenta compartida que se creó «para el curso» en 2023 y que sigue ahí.

El servidor **no está en dominio**, así que todas sus cuentas son **locales** y se administran
desde una consola de **PowerShell con privilegios elevados**, escribiendo comandos reales:
`Get-LocalUser`, `New-LocalUser`, `Add-LocalGroupMember`, `Disable-LocalUser`,
`Remove-LocalUser`, `net user`, `net localgroup`… No hay botones que hagan el trabajo: se
escribe, y el sistema simulado responde con las salidas y los errores que daría uno real.

Lo que distingue al reto de un test es que **el sistema tiene estado y las decisiones se
notan**. Si se elimina la cuenta de la baja en lugar de deshabilitarla, la cuenta desaparece de
verdad: se puede volver a crear con el mismo nombre, pero será otra identidad, y la consecuencia
queda anotada en el informe final. La última fase, además, cambia de registro: ya no se trata de
ejecutar una orden, sino de **preguntarle cosas al sistema** encadenando cmdlets con la tubería
de objetos.

Funciona sin conexión a Internet, sin instalar nada y sin servidor.

## Cómo abrirlo

- **En local**: doble clic en [`index.html`](index.html). Funciona en cualquier navegador
  moderno (Chrome, Edge, Firefox, Safari).
- **En el aula virtual (EVAGD/Moodle)**: subir la carpeta completa del reto **junto con la
  carpeta [`shared/`](../shared/)** (por ejemplo, en un ZIP con las dos) y enlazar
  `cuenta-pendiente/index.html`. El reto usa CSS y scripts clásicos, sin módulos ES
  ni `fetch`, así que también funciona desde el sistema de ficheros.
- **En la web**: publicar el repositorio con GitHub Pages o cualquier alojamiento estático. No
  necesita *backend*.

Una partida completa dura entre **25 y 40 minutos**. Desde la portada se puede **empezar en
cualquiera de las 5 fases**: el equipo se prepara automáticamente con las fases anteriores ya
resueltas (esas tareas no suman XP), de modo que el reto se puede repartir en varias sesiones o
usar solo la parte que interese.

## Contexto educativo

| | |
|---|---|
| **Temas** | Windows · Cuentas locales · Grupos · Administración de sistemas |
| **Encaja en** | Cualquier materia o curso en que se administren equipos Windows: altas y bajas de personas usuarias, reparto de permisos por grupos e higiene de cuentas |
| **Punto de partida** | Saber que existe una consola y escribir en ella; no hace falta haber usado PowerShell nunca |
| **Narrativa** | «Operación Escudo Digital»: la semana de altas y bajas en `SRV-OFICINA`, el servidor de la oficina, que no está en dominio |
| **Modalidad** | Presencial, con apoyo del aula virtual. También sirve en línea, de forma autónoma |

El reto es el **espejo en Windows** de *Cuenta atrás*: mismo escenario, mismas
personas y mismas decisiones, resueltos con otra herramienta. Jugar los dos (en el orden que
sea) hace evidente qué es propio de cada sistema y qué es común a la administración de
identidades: que los permisos se reparten por grupos, que una baja no se borra y que una cuenta
compartida destruye la trazabilidad.

## Objetivos de aprendizaje

Al terminar el reto, el alumnado debería ser capaz de:

1. **Distinguir** una cuenta local de una de dominio, y explicar por qué en un equipo fuera de
   dominio toda la administración se hace con los cmdlets `*-LocalUser` y `*-LocalGroup`.
2. **Consultar** el estado de un equipo: qué cuentas existen, cuáles están habilitadas, qué
   grupos hay y quién pertenece a cada uno, en particular a **Administradores**.
3. **Dar de alta** cuentas y grupos locales con `New-LocalUser` y `New-LocalGroup`, poniendo
   descripciones útiles y sabiendo que la contraseña hay que decidirla explícitamente.
4. **Aplicar** el modelo de pertenencias de Windows: añadir y quitar miembros con
   `Add-LocalGroupMember` y `Remove-LocalGroupMember`, entendiendo que **añadir a un grupo nunca
   saca a nadie de los demás** (a diferencia de `usermod -G` en Linux) y que los permisos se
   suman.
5. **Explicar qué es un SID** y por qué es el SID, y no el nombre, el que figura en los permisos
   de archivos y carpetas: de ahí que eliminar una cuenta sea **irreversible**.
6. **Decidir** con criterio ante una baja: deshabilitar (`Disable-LocalUser`) para conservar
   identidad, permisos y archivos, y reservar `Remove-LocalUser` para los casos en que eliminar
   es lo correcto, recordando que **borrar la cuenta no borra su carpeta de perfil**.
7. **Auditar filtrando**: aprovechar que los cmdlets devuelven **objetos** para responder en una
   línea con `Get-LocalUser | Where-Object … | Select-Object …`, y contrastarlo con la salida de
   **texto** de las herramientas clásicas `net user` y `net localgroup`.
8. **Dejar constancia** del trabajo por escrito redirigiendo la salida a un archivo.

## Cómo funciona

### Las tres pantallas

1. **Portada (encargo)**: el mensaje de Sigourney Weaver, responsable de sistemas, con el encargo de
   la semana y las dos condiciones que quiere ver cumplidas; la explicación del juego; el
   **selector de fase inicial**; y la **guía rápida de cuentas y grupos**, accesible también
   durante la partida.
2. **Juego**: la consola de PowerShell ocupa casi toda la pantalla. Arriba, una barra con el
   progreso por fases, el reloj, la XP y el nivel. En el lateral, la **ficha de la tarea actual**
   (origen, situación, objetivo y pistas) y el **registro de la semana** con lo ya resuelto.
3. **Informe de la semana**: XP, nivel alcanzado, tiempo, pistas usadas, tareas resueltas,
   insignias, la tabla de las 25 tareas con el comando exacto que resolvió cada una y la lista de
   decisiones arriesgadas.

### El desarrollo de una partida

Las tareas llegan **de una en una**, como peticiones con remitente: Sigourney (sistemas), Personas y
Talento, o Michelle Yeoh (proyectos). Al completar una, a los pocos segundos entra la siguiente con
un aviso en la consola y la ficha renovada en el lateral.

Cada tarea se da por resuelta mirando **el estado real del sistema simulado** o **el evento que
ha emitido el comando**, no comparando cadenas de texto:

- las tareas de consulta (ver cuentas, grupos o miembros) se validan con el evento del cmdlet, de
  modo que valen tanto el cmdlet moderno como su alias;
- las tareas que cambian algo (crear, añadir, quitar, deshabilitar, eliminar) se validan mirando
  el modelo: existe el grupo `Formacion`, `chan` está en `Proyectos`, `vandamme` ya no tiene la
  cuenta habilitada, la carpeta `C:\Users\temporal` ha desaparecido… Da igual con qué comando se
  haya conseguido.

Si algo se resuelve **antes** de que llegue su petición, la petición aparece igualmente y se
completa sola, con un **bonus de +25 XP** por ir por delante.

### Las mecánicas clave

- **Pistas graduadas**: tres por tarea, a 25 XP cada una. La primera orienta, la segunda explica
  el mecanismo y solo **la tercera da el comando literal**. Nunca bloquean el avance.
- **Decisiones arriesgadas**: las acciones dañinas **se permiten**. Eliminar la cuenta de Jean-Claude
  en vez de deshabilitarla, eliminar una cuenta en activo o meter a alguien recién llegado en
  **Administradores** cuestan 50 XP (una sola vez por tipo), se explican en la consola en el
  momento y quedan escritas en el informe final.
- **Consola con privilegios**: la sesión está elevada porque `hamilton` pertenece a Administradores.
  Si no lo estuviera, los cmdlets de administración responderían «Acceso denegado» y recordarían
  que hay que abrir PowerShell como administrador.
- **Errores que enseñan**: crear dos veces la misma cuenta, añadir a alguien a un grupo
  inexistente o repetir una pertenencia devuelven los mensajes que devolvería Windows, con la
  información justa para corregir sin dar la respuesta.

## Las 25 tareas

### Fase 1 · Quién hay

| # | Tarea | Título | Qué se practica |
|---|-------|--------|-----------------|
| 1 | CTA-01 | El parte de la semana | `Get-Content` (alias `cat`, `type`) sobre `altas.txt` |
| 2 | CTA-02 | ¿Qué cuentas hay en el equipo? | `Get-LocalUser`: `Name`, `Enabled`, `Description` |
| 3 | CTA-03 | ¿Y los grupos? | `Get-LocalGroup`: grupos integrados y grupos de la empresa |
| 4 | CTA-04 | ¿Quién es administrador aquí? | `Get-LocalGroupMember -Group Administradores` |
| 5 | CTA-05 | Cuentas olvidadas | `Where-Object Enabled -eq $false`: la primera tubería |

### Fase 2 · Altas

| # | Tarea | Título | Qué se practica |
|---|-------|--------|-----------------|
| 6 | CTA-06 | Un grupo para el plan de formación | `New-LocalGroup -Name -Description` |
| 7 | CTA-07 | Alta de Carrie-Anne | `New-LocalUser -NoPassword -Description` (y el `SecureString` de `-Password`) |
| 8 | CTA-08 | Comprueba la cuenta | `Get-LocalUser <cuenta>`, `Format-List` |
| 9 | CTA-09 | Alta de Jackie | Repetir el alta con otro perfil y otra descripción |
| 10 | CTA-10 | Y a su equipo | `Add-LocalGroupMember -Group Proyectos -Member chan` |

### Fase 3 · Pertenencias

| # | Tarea | Título | Qué se practica |
|---|-------|--------|-----------------|
| 11 | CTA-11 | Carrie-Anne, al equipo comercial | Añadir a un grupo sin salir de los demás |
| 12 | CTA-12 | Compruébalo | Verificar la pertenencia justo después de tocarla |
| 13 | CTA-13 | Jackie, al plan de formación | Pertenencia múltiple: los permisos se suman |
| 14 | CTA-14 | Jean-Claude sale del proyecto | `Remove-LocalGroupMember` sin tocar la cuenta |
| 15 | CTA-15 | ¿Quién queda en el proyecto? | Comprobar el resultado del cambio |

### Fase 4 · Bajas

| # | Tarea | Título | Qué se practica |
|---|-------|--------|-----------------|
| 16 | CTA-16 | La ficha de Jean-Claude | Mirar el estado antes de decidir: `Enabled` en `True` |
| 17 | CTA-17 | Deshabilitar, no eliminar | `Disable-LocalUser` (y `Enable-LocalUser` para revertirlo) |
| 18 | CTA-18 | Confirma el estado | `Enabled` en `False`: la cuenta conserva SID, permisos y archivos |
| 19 | CTA-19 | La cuenta compartida del curso | `Remove-LocalUser`: cuándo sí, y por qué una cuenta compartida es un problema |
| 20 | CTA-20 | Y su perfil, que sigue ahí | `Remove-Item … -Recurse`: eliminar la cuenta no borra el perfil |

### Fase 5 · Auditoría

| # | Tarea | Título | Qué se practica |
|---|-------|--------|-----------------|
| 21 | CTA-21 | La herramienta de siempre | `net user`: la salida de texto de siempre |
| 22 | CTA-22 | Y los administradores, a la vieja usanza | `net localgroup <grupo>` |
| 23 | CTA-23 | Corrige la ficha de Carrie-Anne | `Set-LocalUser -Description`: modificar sin recrear |
| 24 | CTA-24 | Revisión de cuentas inactivas | `Get-LocalUser \| Where-Object \| Select-Object Name,Description` |
| 25 | CTA-25 | Deja el listado por escrito | `Format-Table` y redirección con `>` |

## Comandos disponibles

| Tipo | Comandos |
|---|---|
| Consultar cuentas y grupos | `Get-LocalUser [-Name]`, `Get-LocalGroup [-Name]`, `Get-LocalGroupMember -Group` |
| Cuentas | `New-LocalUser -Name [-Password\|-NoPassword] [-Description] [-FullName]`, `Set-LocalUser`, `Enable-LocalUser`, `Disable-LocalUser`, `Remove-LocalUser` |
| Grupos | `New-LocalGroup -Name [-Description]`, `Remove-LocalGroup`, `Add-LocalGroupMember -Group -Member`, `Remove-LocalGroupMember -Group -Member` |
| Herramientas clásicas | `net user [<cuenta>] [/add] [/delete]`, `net localgroup [<grupo>] [<cuenta> /add\|/delete]` |
| Tubería de objetos | `Where-Object`, `Select-Object [-Property] [-First] [-Last] [-Unique]`, `Sort-Object [-Descending]`, `Measure-Object`, `Group-Object`, `ForEach-Object`, `Format-Table`, `Format-List`, `Get-Member` |
| Archivos y carpetas | `Get-ChildItem`, `Get-Item`, `Get-Content`, `Set-Content`, `Add-Content`, `New-Item`, `Remove-Item [-Recurse]`, `Copy-Item`, `Move-Item`, `Rename-Item`, `Test-Path`, `Select-String`, `notepad` (editor) |
| Sesión y ayuda | `Get-Location`, `Set-Location`, `Get-Date`, `Get-History`, `Get-Command`, `Get-Alias`, `Get-Help <comando> [-Examples]`, `help`, `Clear-Host` |
| Composición | Tuberías con `\|`, redirección con `>` y `>>`, encadenado con `;`, comodines (`Get-LocalUser a*`), comillas simples y dobles |
| Alias reconocidos | `ls`, `dir`, `cd`, `cat`, `type`, `rm`, `del`, `cls`, `clear`, `echo`, `where`/`?`, `select`, `sort`, `ft`, `fl`, `gm`, `man`, `help`… (`Get-Alias` los lista todos) |

Los nombres de comando, los alias y los parámetros **no distinguen mayúsculas de minúsculas**,
igual que en PowerShell.

Atajos: <kbd>↑</kbd>/<kbd>↓</kbd> historial, <kbd>Tab</kbd> autocompletar (comandos, alias y
rutas), <kbd>Ctrl</kbd>+<kbd>L</kbd> limpiar la pantalla, <kbd>Ctrl</kbd>+<kbd>C</kbd> cancelar
la línea. En el editor: <kbd>Ctrl</kbd>+<kbd>O</kbd> guardar, <kbd>Ctrl</kbd>+<kbd>X</kbd>
cerrar, <kbd>Ctrl</kbd>+<kbd>K</kbd> cortar línea, <kbd>Ctrl</kbd>+<kbd>U</kbd> pegar (también
hay botones).

## Cómo se diseñó

### Primero los aprendizajes

El punto de partida no fue la historia, sino cuatro ideas que cuesta transmitir en una
explicación y que se entienden muy bien equivocándose:

1. **La identidad no es el nombre, es el SID.** Cada cuenta tiene un identificador de seguridad
   único, y es ese identificador el que aparece en los permisos de archivos y carpetas. Por eso
   eliminar una cuenta es irreversible: crear otra con el mismo nombre produce una identidad
   distinta que no hereda ningún permiso. De ahí la norma de la casa: **en una baja, la cuenta se
   deshabilita**. Deshabilitada, no inicia sesión, pero conserva identidad, permisos y archivos,
   y se puede revertir con un solo comando.
2. **Añadir a un grupo no quita de los demás.** Quien viene de Linux arrastra la cicatriz de
   `usermod -G` sin `-a`, que reemplaza la lista de grupos secundarios. En Windows,
   `Add-LocalGroupMember` **solo añade**, y los permisos de los distintos grupos se suman. El
   juego lo dice en una pista y lo demuestra dejando a Jackie en `Usuarios`, `Proyectos` y
   `Formacion` a la vez.
3. **Eliminar la cuenta no borra el perfil.** La carpeta de `C:\Users` sigue ahí, ocupando
   espacio y con datos dentro. Por eso la baja definitiva son **dos tareas** (CTA-19 y CTA-20),
   no una.
4. **Auditar es filtrar.** Como los cmdlets devuelven objetos y no texto, una auditoría no es
   leer una lista con la vista: es una tubería.
   `Get-LocalUser | Where-Object Enabled -eq $false | Select-Object Name,Description` responde en
   una línea lo que a ojo lleva diez minutos y sale mal. Para que el contraste sea visible, la
   quinta fase obliga antes a usar `net user` y `net localgroup`: hacen lo mismo, devuelven texto
   y por eso no se pueden filtrar.

### Después la narrativa y la estética

La semana elegida es deliberadamente **corriente**: dos altas, una baja, un grupo nuevo y una
cuenta vieja. No hay incidente ni urgencia, porque el objetivo no es reaccionar sino **hacer bien
un procedimiento**. Las peticiones vienen de tres remitentes distintos (sistemas, Personas y
Talento, y el equipo de proyectos), que es de donde llegan de verdad.

La estética es la de una consola elevada: título de ventana con «(Administrador)», *prompt* `PS
C:\Users\hamilton>` y las salidas tabulares de PowerShell. Los nombres de cuentas y grupos del sistema
van **sin tildes** (`vandamme`, `Formacion`, `Direccion`), como se nombran en la práctica para
evitar problemas con rutas y perfiles; los textos de la interfaz, en cambio, están en español
correcto y sí las llevan.

### Decisiones de diseño

- **El simulador no enseña cosas falsas.** `New-LocalUser` exige decidir la contraseña
  (`-Password` o `-NoPassword`), no la inventa; `Remove-LocalUser` no borra el perfil;
  `Disable-LocalUser` no elimina nada; recrear una cuenta eliminada produce una identidad nueva;
  `net` devuelve texto, así que no se puede encadenar con `Where-Object`; y los cmdlets de
  administración requieren una consola elevada.
- **Varias soluciones válidas por tarea.** Las comprobaciones miran el estado del sistema, no la
  cadena escrita: el alta se puede hacer con `New-LocalUser` o con `net user … /add`, la
  pertenencia con `Add-LocalGroupMember` o con `net localgroup … /add`, y la consulta con el
  cmdlet o con su alias.
- **Las decisiones dañinas se permiten, no se bloquean.** Se puede eliminar la cuenta de Jean-Claude en
  lugar de deshabilitarla. El juego no lo impide: lo explica, lo cobra y lo anota. Y la tarea
  sigue pendiente, así que hay que **recrear la cuenta y deshabilitarla**, que es exactamente lo
  que pasaría en la realidad… salvo que en la realidad los permisos perdidos no vuelven.
- **Las fichas describen síntomas y objetivos, nunca la solución.** El comando literal aparece
  solo en la tercera pista, y la guía rápida de la portada explica el modelo sin resolver la
  tarea en curso.
- **Contenido separado de la lógica.** Los textos de las 25 tareas viven en
  [`data/missions.js`](data/missions.js) y son editables sin tocar una sola línea de lógica; las
  comprobaciones y la secuencia que resuelve cada tarea están en [`js/missions.js`](js/missions.js),
  emparejadas por el código `CTA-xx`.

### Evolución respecto a los retos anteriores

| | Retos anteriores | *Cuenta pendiente* |
|---|---|---|
| Sistema | Terminal Linux (`bash`) | Consola de PowerShell elevada, con sus alias y sus parámetros con `-` |
| Salida | Texto que se filtra con `grep` | **Objetos** que se filtran con `Where-Object` y se proyectan con `Select-Object` |
| Escenario | Incidente o proyecto | Procedimiento rutinario bien hecho: altas, bajas y auditoría |
| Código | Reto con simulador propio | El reto **solo aporta datos**: el modelo de cuentas y los cmdlets viven en `shared/` |
| Paralelo | — | Espejo exacto de *Cuenta atrás*, para comparar dos formas de hacer lo mismo |

## Elementos de gamificación

Relación con los **12 componentes** vistos en el curso *La gamificación educativa* (solo se usan
los que encajan):

| Componente | ¿Se usa? | Cómo | Por qué |
|---|---|---|---|
| **Misiones** | ✅ | 25 peticiones encadenadas (CTA-01…CTA-25) en 5 fases | Se habla de tareas y de peticiones con remitente, nunca de ejercicios |
| **Sorpresa** | ✅ | Las peticiones llegan de tres departamentos distintos y sin avisar; la cuenta `temporal` y la cuenta de servicio `svc-viejo` aparecen al consultar el equipo | Reproduce la realidad de una semana de administración |
| **Desbloqueo de contenido** | ✅ | Cada petición se revela al completar la anterior | Hay que avanzar para descubrir qué viene |
| **Puntos (XP)** | ✅ | 75-175 XP por tarea (≈3200 en total), −25 por pista, −50 por decisión arriesgada, +25 por adelantarse | *Feedback* inmediato; las pistas cuestan, pero nunca bloquean |
| **Niveles** | ✅ | Consulta cuentas → Da de alta → Reparte grupos → Administra identidades | Los nombres describen competencias, no rangos militares |
| **Insignias** | ✅ | 6 insignias ligadas a buenas prácticas (ver abajo) | Reconocen *cómo* se ha trabajado, no solo haber terminado |
| **Barra de progreso** | ✅ | Progreso por fases, contador de tarea y registro lateral de la semana | Ver el avance anima a seguir |
| **Recompensas** | ✅ | Pistas «compradas» con XP; guía de cuentas y grupos y `Get-Help` siempre disponibles | La ayuda existe, pero hay que decidir si compensa |
| **Tablero de clasificación** | ❌ | — | Deliberadamente no: el informe es individual y no se comparte |
| **Cuenta atrás** | ❌ | Reloj que cuenta hacia arriba, sin límite | Una cuenta atrás invita a teclear sin pensar, justo lo contrario de lo que se busca |
| **Avatar** | ❌ | — | No aporta: la identidad aquí son las cuentas del sistema, que es el tema del reto |
| **Poder** | ❌ | — | No encaja en un procedimiento profesional |

**Insignias**: 🛡️ *Sin destrozos* (ninguna decisión arriesgada), 🧠 *Autosuficiente* (sin pedir
pistas), 📚 *Get-Help* (consultar la ayuda integrada de un comando), 🔒 *Deshabilitar antes que
borrar* (la baja queda deshabilitada, no eliminada), 🔎 *Auditoría* (filtrar las cuentas
deshabilitadas con la tubería de objetos), ⚡ *Buen ritmo* (jornada completa en menos de 15
minutos).

### Perfiles de jugador (Bartle)

- **Explorer**: hay mucho que mirar que ninguna tarea pide. `Get-Member` enseña de qué está hecho
  un objeto de cuenta; `Get-Alias` revela por qué `ls`, `cat` y `where` funcionan aquí;
  `Get-Help <comando> -Examples` trae ejemplos; y quedan por investigar la cuenta `svc-viejo`
  (deshabilitada desde 2024), los grupos integrados y las carpetas de `C:\Users`.
- **Achiever**: XP, cuatro niveles, seis insignias y un informe final que lista las 25 tareas con
  el comando exacto con que se resolvió cada una.
- **Killer**: tiempo y XP finales, y la insignia de ritmo, sin tablero público; se pueden comparar
  informes entre quienes quieran.
- **Socializer**: el trabajo por parejas y la puesta en común posterior, sobre todo comparando la
  partida con la versión en Linux.

### Estado de *flow*

La dificultad sube de forma escalonada y en el orden en que sube la responsabilidad: primero solo
se **consulta** (fase 1, nada se puede romper), después se **crea** (fase 2, acciones nuevas pero
inofensivas), luego se **modifica** lo existente (fase 3), después se **decide** ante una baja
(fase 4, la única fase con acciones irreversibles) y por último se **compone** (fase 5, encadenar
cmdlets). Las tareas de comprobación intercaladas (CTA-08, CTA-12, CTA-15, CTA-18) son pausas
deliberadas: bajan la tensión justo después de un cambio y enseñan el hábito de verificar.

Contra el aburrimiento juegan la variedad de remitentes y el cambio de registro de la última
fase; contra la ansiedad, las tres pistas, la ausencia de límite de tiempo, el hecho de que
ningún error impida seguir y la posibilidad de reiniciar o empezar en la fase que se quiera.

## Accesibilidad, inclusión y protección de datos

### Accesibilidad

- **Todo se maneja con teclado**, incluido el editor. Con la línea vacía, <kbd>Tab</kbd> saca el
  foco de la consola al resto de la página, así que el autocompletado no lo atrapa.
- **Lectores de pantalla**: la salida de la consola es un `role="log"`; una región `role="status"`
  independiente anuncia solo lo importante (nueva tarea con su objetivo, tarea completada, pistas
  y ascensos de nivel). La barra de fases lleva texto oculto («Fase 3, Pertenencias: 2 de 5
  tareas»).
- **Nunca solo color**: los estados combinan color, icono y texto, tanto en la ficha de la tarea
  como en el informe final.
- **Contraste alto** sobre fondo oscuro, foco visible y tipografía monoespaciada en la consola.
- **Movimiento reducido**: con `prefers-reduced-motion` se quitan las animaciones y se acortan las
  esperas entre tareas.
- **Modales accesibles**: la guía de cuentas y grupos atrapa el foco, se cierra con <kbd>Esc</kbd>
  o pulsando fuera y devuelve el foco al botón de origen.
- **Adaptable**: el panel lateral se coloca sobre la consola en pantallas estrechas. Comprobado a
  400 px de ancho, sin scroll horizontal.

### Inclusión

- **Cada cual a su ritmo**: sin tiempo límite; el reloj es informativo y la insignia de ritmo,
  opcional.
- **Ayuda graduada**: tres pistas por tarea, guía rápida siempre disponible, `Get-Help` dentro del
  juego y `help` con la lista de comandos por familias.
- **Se puede empezar por cualquier fase**, lo que permite repartir el reto en varias sesiones,
  repetir solo la parte que costó o ajustar el punto de partida a cada persona.
- **Sin castigo definitivo**: ningún error bloquea; se puede reiniciar sin penalización y los
  mensajes orientan en vez de culpar.
- **Vocabulario cuidado**: nombres de personas variados y neutros, y niveles que describen lo que
  se sabe hacer.

### Protección de datos y uso responsable

- **No recoge ningún dato personal**: no pide nombre, ni correo, ni identificación.
- **No envía nada a ningún servidor** ni usa cookies ni almacenamiento del navegador: el progreso
  vive en la memoria de la pestaña y desaparece al cerrarla.
- **No depende de servicios externos** (ni CDN, ni fuentes web, ni analítica).
- **Es una simulación**: ningún sistema real se modifica; todas las cuentas son ficticias.
- El contenido da pie a hablar de protección de datos en clase: qué queda en el perfil de una
  persona que se va, por qué una **cuenta compartida** hace imposible saber quién hizo qué, y por
  qué conviene revisar periódicamente las cuentas inactivas.

## Uso en el aula

**Antes**

- Preguntar qué creen que pasa cuando alguien se va de una empresa: ¿se borra su cuenta? ¿Y sus
  archivos? ¿Y las carpetas a las que tenía acceso?
- Presentar el vocabulario mínimo: cuenta local frente a cuenta de dominio, grupo, pertenencia,
  SID y perfil.
- Si ya se ha jugado la versión en Linux, anunciar que es la **misma semana** con otra
  herramienta y pedir que vayan anotando las diferencias.

**Durante**

- Individual o **en parejas** (una persona teclea y la otra consulta la guía y `Get-Help`; se
  cambia de rol en cada fase).
- Reparto sugerido: fases 1-3 en una sesión y 4-5 en otra, usando el **selector de fase** de la
  portada.
- El profesorado circula y pregunta en lugar de resolver: «¿qué pasa con sus permisos si eliminas
  esa cuenta?», «¿se ha salido Jackie de `Usuarios` al meterlo en `Proyectos`?», «¿por qué esta
  lista no se puede filtrar con `Where-Object`?».
- Animar a probar `Get-Member` sobre una cuenta: es el momento en que se entiende que la consola
  devuelve objetos.

**Después**

- **Puesta en común**: ¿quién eliminó la cuenta de Jean-Claude y qué pasó? ¿Qué diferencia hay entre
  deshabilitar y eliminar? ¿Por qué la cuenta `temporal` sí se elimina? ¿Qué habría pasado si se
  hubiera borrado la cuenta pero no el perfil?
- **Comparación con Linux**: `New-LocalUser` frente a `useradd`, `Add-LocalGroupMember` frente a
  `usermod -aG`, `Disable-LocalUser` frente a bloquear la contraseña, objetos frente a texto.
- **Evidencia para el aula virtual**: captura del informe de la semana, o el archivo `cuentas.txt`
  que genera la última tarea.
- **Ampliación**: repetir el procedimiento en una máquina virtual Windows real y comprobar que los
  comandos y los mensajes son los mismos; mirar además el SID auténtico con
  `Get-LocalUser | Select-Object Name,SID`.

## Detalles técnicos

HTML semántico, CSS y JavaScript *vanilla* (sin *frameworks*, sin dependencias, sin *build* y sin
módulos ES, para que funcione también con `file://`). El reto comparte con el resto del
repositorio la biblioteca [`shared/`](../shared/) (espacio de nombres `RG`) y **solo aporta
datos**: escenario, tareas, fases, niveles e insignias.

| Fichero | Contenido |
|---|---|
| `index.html` | Marcado de las tres pantallas, el editor y la guía de cuentas y grupos |
| `css/reto.css` | Los pocos estilos propios del reto, sobre los tokens compartidos |
| `data/config.js` | El escenario: equipo, usuaria, cuentas y grupos iniciales, y los archivos de `C:\Users` |
| `data/gamification.js` | Las 5 fases, la puntuación, los 4 niveles y las 6 insignias |
| `data/missions.js` | El contenido de las 25 tareas (títulos, situación, objetivo y pistas), sin lógica |
| `js/missions.js` | Cómo se comprueba cada tarea, la secuencia que la resuelve y la vigilancia de decisiones arriesgadas |
| `js/main.js` | Arranque: llama a `RG.Sandbox` con los datos del reto y define textos, ayuda, insignias e informe |

De la biblioteca compartida, este reto usa sobre todo:

| Módulo de `shared/` | Qué aporta |
|---|---|
| `js/sysmodel.js` | El modelo de cuentas, grupos y pertenencias: altas, bajas, miembros y consulta de los grupos de una persona |
| `js/cmd-pwsh-admin.js` | Los cmdlets `*-LocalUser` y `*-LocalGroup` y las herramientas clásicas `net` y `sc`, con sus mensajes de error y la exigencia de consola elevada |
| `js/cmd-pwsh.js` | El resto de PowerShell: archivos, la tubería de objetos (`Where-Object`, `Select-Object`, `Format-Table`…), alias y `Get-Help` |
| `js/vfs.js` | El sistema de archivos simulado con propietario y ACE, donde viven `altas.txt` y las carpetas de perfil |
| `js/sandbox.js` | El arranque común: consola, intérprete, editor, motor de tareas, fases, selector de fase inicial e informe final |
| `js/terminal.js` · `js/shell.js` · `js/game.js` | Consola con historial y autocompletado · análisis de la línea, tuberías y redirecciones · XP, niveles, pistas, insignias y decisiones arriesgadas |

Claves del diseño:

- **Las comprobaciones miran el estado o el evento**, nunca la cadena escrita, lo que permite
  varias soluciones válidas por tarea.
- **La `solution` de cada tarea** (la secuencia de comandos que la resuelve) es la que ejecuta en
  silencio el **selector de fase** para dejar el equipo tal y como estaría si se hubieran hecho
  las fases anteriores.
- **El objeto de estado no se sustituye nunca**: al reiniciar se vacía y se vuelve a llenar,
  porque los comandos guardan una referencia a él.
- **Añadir o cambiar una tarea**: editar [`data/missions.js`](data/missions.js) (y
  [`data/gamification.js`](data/gamification.js) si cambia una fase) y su comprobación en
  [`js/missions.js`](js/missions.js). Toda la interfaz (progreso, ficha, registro e informe) se
  genera a partir de esos datos.

## Verificación

Se ha probado en **Chrome real en modo *headless***, manejado por el protocolo DevTools (CDP)
desde Node.js, con un guion que simula a una persona jugando: **39 comprobaciones, todas
superadas y sin ningún error de JavaScript**. Se ejecuta con:

```bash
node .claude/skills/verificar-reto/scripts/run.mjs test-cuenta-pendiente
```

Cubre:

- que la portada ofrece **las 5 fases** para empezar;
- la **partida completa**: las 25 tareas resueltas una a una con los comandos que propone cada
  ficha;
- que **el modelo de cuentas funciona de verdad**: Carrie-Anne queda habilitada y con la descripción
  corregida, `Ventas` tiene a sus dos miembros, la baja de Jean-Claude queda **deshabilitada y no
  eliminada**, la cuenta `temporal` ya no existe y su carpeta de perfil tampoco;
- los **errores propios de Windows**: crear dos veces la misma cuenta, añadir a un grupo
  inexistente y repetir una pertenencia;
- el **informe final**: XP por encima de 2800, las 25 filas de la tabla y ninguna decisión
  arriesgada anotada en una partida limpia;
- que **eliminar la cuenta de la baja en lugar de deshabilitarla** se detecta y se anota como
  decisión arriesgada, empezando la partida directamente en la fase 4.

Como el reto se apoya entero en [`shared/`](../shared/), cualquier cambio en la biblioteca obliga
a volver a pasar las pruebas de **todos** los retos.

## Limitaciones conocidas

- **No hay dominio ni Active Directory**: todas las cuentas son locales. No existen
  `Get-ADUser`, las unidades organizativas, las directivas de grupo ni la pertenencia a grupos de
  dominio. Es una decisión de alcance, y el escenario lo justifica desde la primera línea.
- **El SID se explica, pero no se muestra.** El modelo asigna un identificador interno distinto a
  cada cuenta (y por eso recrear una cuenta eliminada no recupera nada), pero la salida de
  `Get-LocalUser` no incluye la columna `SID`, y el parámetro `-SID` se acepta sin filtrar. En un
  equipo real, `Get-LocalUser | Select-Object Name,SID` enseña el identificador completo.
- **`-Password` acepta texto plano.** En PowerShell real espera un `SecureString`, que se
  construye con `ConvertTo-SecureString "…" -AsPlainText -Force`. El juego lo advierte en la guía
  y en una pista, pero no obliga a escribirlo así.
- **No se modelan las directivas de contraseñas** (complejidad, longitud mínima, historial) ni la
  **caducidad** de contraseñas o cuentas: `-AccountNeverExpires` y `-PasswordNeverExpires` se
  aceptan, pero no tienen efecto porque no hay reloj de caducidad.
- **No hay permisos efectivos sobre archivos derivados de los grupos que se tocan**: el sistema de
  archivos simulado sí tiene propietario y ACE, pero el reto no pide comprobar el acceso real de
  una persona a una carpeta tras cambiarla de grupo.
- **No hay perfiles de usuario reales**: la carpeta de `C:\Users` existe como carpeta, sin el
  contenido ni el registro de un perfil de verdad, y una cuenta recién creada no estrena carpeta
  hasta que inicia sesión (algo que aquí no ocurre).
- **El progreso no se guarda**: al recargar se empieza de cero (intencionado, para no almacenar
  datos). El selector de fase permite retomar el reto por donde se quedó.

## Archivos

| Archivo | Contenido |
|---|---|
| [`index.html`](index.html) | Marcado de las tres pantallas, el editor y la guía de cuentas y grupos |
| [`css/`](css/) · [`data/`](data/) · [`js/`](js/) | Estilos propios · escenario, tareas y gamificación · lógica de las tareas y arranque |
| [`../shared/`](../shared/) | Biblioteca común: consola, intérprete, modelo de cuentas y grupos, cmdlets de PowerShell, motor de tareas e informe |
| [`../cuenta-atras/`](../cuenta-atras/) | El mismo escenario resuelto en Linux |
| [`README.md`](README.md) | Este documento |

## Créditos

Made with 💖 by [@fvarrui](https://github.com/fvarrui) & [Claude](https://claude.ai).

Diseñado como reto digital de elaboración propia para el curso *La gamificación educativa*,
dentro de la propuesta «Operación Escudo Digital».
