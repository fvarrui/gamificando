# Permisos NTFS en Windows

> Simulador gamificado de listas de control de acceso (ACL) en una consola de PowerShell.
> Reto digital de elaboración propia, hermano de [*Permisos y ACL en Linux*](../permisos-en-linux/)
> y de [*Blindaje de la Red*](../blindaje-de-la-red/).

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

*Permisos NTFS en Windows* es un juego educativo que se ejecuta en el navegador. El
alumnado se pone en la piel de **Ana**, de sistemas, en el servidor de archivos
`SRV-DATOS` de la empresa ficticia **TecnoAtlántica**: la consultora que lo montó terminó
ayer y dejó la carpeta compartida `C:\Datos` con **«Todos · Control total»**, heredado
hasta el último rincón. Dentro hay un `Privado\credenciales.txt` que puede abrir
cualquiera, una carpeta `Ventas` con la herencia rota «para probar» y un fichero que
pertenece a una cuenta deshabilitada.

El trabajo se hace **desde una consola de PowerShell elevada**, escribiendo los comandos
reales: `Get-Acl | Format-List` para leer una ACL, `icacls` con `/grant`, `/deny`,
`/remove`, `/inheritance:d|r|e` y `/setowner` para cambiarla, y `takeown /F` para tomar
posesión de lo que ya no tiene dueño. No hay botones que arreglen la carpeta: hay 25
tareas, y cada una se resuelve con una orden que funciona igual en un servidor de verdad.

Lo que se practica no es una receta, sino un modelo: una ACL es una **lista de entradas**
(ACE), cada una con su identidad, sus derechos, su tipo (permitir o denegar) y su marca de
heredada. De ahí salen las dos reglas que explican casi todos los «a mí no me deja y
debería»: **la denegación explícita gana** y **los permisos se acumulan**. Y una regla
práctica que atraviesa todo el reto: **Modify para quien trabaja, FullControl solo para
administración.**

Funciona sin conexión a Internet, sin instalar nada y sin servidor.

## Cómo abrirlo

- **En local**: doble clic en [`index.html`](index.html). Funciona en cualquier navegador
  moderno (Chrome, Edge, Firefox, Safari).
- **En el aula virtual (EVAGD/Moodle)**: subir la carpeta completa del reto **junto con la
  carpeta [`shared/`](../shared/)** (por ejemplo, en un ZIP con las dos) y enlazar
  `permisos-en-windows/index.html`. El reto usa CSS y scripts clásicos, sin módulos ES ni
  `fetch`, así que también funciona desde el sistema de ficheros.
- **En la web**: publicar el repositorio con GitHub Pages o cualquier alojamiento
  estático. No necesita *backend*.

Una partida completa dura entre **25 y 40 minutos**. Desde la portada se puede **empezar
en cualquiera de las 5 fases**: el servidor se prepara automáticamente con las fases
anteriores ya resueltas (esas tareas no suman XP), así que el reto se puede repartir en
varias sesiones o usar solo la parte que interese.

## Contexto educativo

| | |
|---|---|
| **Temas** | Windows · NTFS · ACL · Seguridad · Sistemas |
| **Encaja en** | Cualquier materia o curso en que se administren carpetas compartidas, servidores de archivos o permisos de un sistema Windows |
| **Punto de partida** | Saber qué es un usuario y un grupo y haber escrito alguna orden en una consola; no hace falta haber usado PowerShell ni `icacls` nunca |
| **Narrativa** | «Operación Escudo Digital»: auditoría de permisos del servidor de archivos que acaba de entregar una consultora externa |
| **Modalidad** | Presencial, con apoyo del aula virtual. También sirve en línea, de forma autónoma |

El punto de partida es el problema más común (y más caro) de un servidor de archivos real:
una carpeta compartida que alguien abrió «para que funcione ya» y que nadie volvió a
revisar. Es un escenario reconocible incluso para quien no ha administrado nunca un
sistema, porque todo el mundo ha visto una carpeta de red donde se puede borrar lo de los
demás.

## Objetivos de aprendizaje

Al terminar el reto, el alumnado debería ser capaz de:

1. **Identificar** las partes de una entrada de control de acceso (ACE): identidad,
   derechos, permitir o denegar, y heredada o explícita, y localizarlas tanto en la salida
   de `Get-Acl | Format-List` como en la de `icacls`.
2. **Interpretar** las abreviaturas de `icacls` (`F`, `M`, `RX`, `R`, `W`) y las marcas
   `(I)` y `(DENY)`, explicando qué permite exactamente cada derecho.
3. **Explicar** cómo funciona la herencia en NTFS: qué baja de una carpeta a sus
   contenidos, qué diferencia hay entre un permiso heredado y uno explícito, y por qué
   ambos conviven en la misma lista.
4. **Aplicar** los cambios con la herramienta adecuada: conceder con `/grant`, retirar con
   `/remove`, deshabilitar o restaurar la herencia con `/inheritance:d`, `:r` y `:e`, y
   reasignar el propietario con `takeown /F` o `/setowner`.
5. **Evaluar** una petición de permisos según el principio de **mínimo privilegio**,
   decidiendo entre `Modify` y `FullControl` y justificando por qué el control total se
   reserva a la administración.
6. **Decidir** cuándo una **denegación explícita** es la única solución (porque la
   identidad recibe el permiso por otra vía) y cuándo basta con no conceder nada,
   anticipando el efecto de las dos reglas: deniega gana y los permisos se acumulan.
7. **Documentar** el resultado de un bastionado de forma que otra persona pueda entender
   el criterio meses después.

## Cómo funciona

### Las tres pantallas

1. **Portada (encargo)**: el correo de Nayra Suárez, responsable de sistemas, con el
   estado de `C:\Datos`; explicación del juego, **selector de fase inicial** y acceso a la
   **guía rápida de permisos NTFS** (ACE, derechos y sus abreviaturas, consultar, conceder,
   denegar, herencia y propietario).
2. **Juego**: la consola ocupa casi toda la pantalla. Arriba, una barra con el progreso por
   fases, el contador de tareas, el reloj, la XP y el nivel. En el lateral, la ficha de la
   tarea actual y el registro de la auditoría.
3. **Informe final**: XP, nivel alcanzado, tiempo, pistas usadas, insignias, la tabla de
   las 25 tareas con el comando que resolvió cada una y la lista de decisiones arriesgadas.

### El desarrollo de una partida

Las tareas llegan **de una en una**, como peticiones con remitente: la responsable de
sistemas, dirección o la responsable del equipo de proyectos. Cada ficha describe el
**síntoma y el objetivo**, nunca la orden literal; esa solo aparece en la **tercera
pista**, y cada pista cuesta 25 XP.

Al completar una tarea se anuncia en la consola, se suma la XP y a los pocos segundos
llega la siguiente. Si algo se resuelve **antes** de que llegue su petición, la tarea se
da por completada en cuanto aparece y suma un **bonus por adelantarse**.

### Los permisos se aplican de verdad

No hay comprobación de texto: cada orden modifica el sistema de ficheros simulado y las
tareas miran **el estado resultante**, no lo que se escribió. Por eso hay varias
soluciones válidas para casi todas: `icacls … /grant` o `Set-Acl -Identity … -Rights …`;
`takeown /F` seguido de `/setowner`, o directamente `takeown /A`.

Y por eso la herencia se ve trabajar: al conceder `Usuarios:(RX)` en `C:\Datos`, la marca
`(I)` aparece sola en todo lo que hay debajo; al cortarla con `/inheritance:r`, desaparece;
al restaurarla con `/inheritance:e`, vuelve. La propia `C:\Datos` hereda a su vez de `C:\`,
así que Administradores nunca se queda fuera.

### Las decisiones cuentan

Conceder `FullControl` a quien no es administración, volver a dar permisos a «Todos», abrir
la carpeta de credenciales a alguien que no la necesita o borrar el fichero de credenciales
en lugar de protegerlo **se permite**: cuesta 50 XP una vez por tipo, se explica en el
momento y queda anotado en el informe final.

## Las 25 tareas

### Fase 1 · Radiografía — ver quién tiene qué

| # | Código | Tarea | Qué se practica |
|---|--------|-------|-----------------|
| 1 | NTF-01 | Mira qué hay en `C:\Datos` | `Get-ChildItem` (alias `ls`, `dir`) |
| 2 | NTF-02 | ¿Quién tiene permisos aquí? | `Get-Acl <ruta> \| Format-List`: propietario y lista de ACE |
| 3 | NTF-03 | Lo mismo, con la herramienta clásica | `icacls <ruta>` y las abreviaturas `F`, `M`, `RX`, `R`, `W` |
| 4 | NTF-04 | La herencia lo reparte todo | La marca `(I)`: lo que no está puesto ahí, sino que viene de arriba |
| 5 | NTF-05 | Y por eso esto es urgente | `Get-Content`: leer las credenciales que hoy puede leer cualquiera |

### Fase 2 · Conceder — quitar el «Todos» y dar a cada grupo lo suyo

| # | Código | Tarea | Qué se practica |
|---|--------|-------|-----------------|
| 6 | NTF-06 | Fuera el «Todos» | `icacls … /remove`, y cómo la retirada baja por herencia |
| 7 | NTF-07 | Que la gente pueda llegar | `/grant Usuarios:(RX)`: el permiso mínimo para atravesar la carpeta |
| 8 | NTF-08 | El equipo de proyectos trabaja aquí | `/grant Proyectos:(M)`: `Modify` frente a `FullControl` |
| 9 | NTF-09 | Y ventas en la suya | `/grant Ventas:(M)`; por qué se concede a grupos y no a personas |
| 10 | NTF-10 | Dirección solo lee | `/grant Direccion:(R)`: dar de menos se arregla; dar de más, no siempre |

### Fase 3 · Herencia — romperla donde estorba y restaurarla donde falta

| # | Código | Tarea | Qué se practica |
|---|--------|-------|-----------------|
| 11 | NTF-11 | ¿De dónde le vienen los permisos a `Privado`? | Comprobar que lo concedido arriba ya ha bajado |
| 12 | NTF-12 | Corta la herencia en `Privado` | `/inheritance:r` frente a `/inheritance:d` |
| 13 | NTF-13 | Y deja solo a quien debe entrar | `/grant Administradores:(F)`: el único control total justificado |
| 14 | NTF-14 | Comprueba que ya no hereda | Leer una ACL sin ninguna `(I)` |
| 15 | NTF-15 | La herencia rota donde no tocaba | `/inheritance:e`: volver a habilitarla en `Ventas` |
| 16 | NTF-16 | Y el «Todos» que se quedó dentro | Lo heredado y lo explícito conviven: hay que revisar carpeta a carpeta |

### Fase 4 · Denegar — denegaciones explícitas y cambio de propietario

| # | Código | Tarea | Qué se practica |
|---|--------|-------|-----------------|
| 17 | NTF-17 | Ventas no entra en Dirección | `/deny Ventas:(RX)`: cuando no basta con «no conceder» |
| 18 | NTF-18 | Comprueba la denegación | Localizar `(DENY)` en la lista y saber leerlo |
| 19 | NTF-19 | El fichero de la compañera que se fue | La propiedad `Owner` de `Get-Acl`; el propietario siempre manda sobre la ACL |
| 20 | NTF-20 | Toma posesión | `takeown /F`: recuperar algo cuyo dueño ya no está |
| 21 | NTF-21 | Que sea del grupo, no tuyo | `icacls … /setowner Administradores` (o `takeown /A`) |

### Fase 5 · Comprobación — verificar el resultado y documentarlo

| # | Código | Tarea | Qué se practica |
|---|--------|-------|-----------------|
| 22 | NTF-22 | Repasa la carpeta de proyectos | `Get-Acl \| Format-List`: distinguir lo propio de lo heredado |
| 23 | NTF-23 | Deja constancia por escrito | Redirección `>` de la salida de `icacls` a un fichero |
| 24 | NTF-24 | Añade la conclusión | `Add-Content -Path … -Value …` frente a `Set-Content` |
| 25 | NTF-25 | Última comprobación | Cerrar el parte: ni «Todos» ni control total de más |

## Comandos disponibles

| Tipo | Comandos |
|---|---|
| Mirar | `Get-ChildItem` (`ls`, `dir`, `gci`), `Get-Item`, `Get-Content` (`cat`, `type`), `Test-Path`, `Select-String` (`sls`, `findstr`), `Get-Location` (`pwd`), `Set-Location` (`cd`) |
| Permisos | `Get-Acl`, `Set-Acl` (`-Identity`, `-Rights`, `-Type`, `-Remove`, `-Owner`, `-DisableInheritance`, `-EnableInheritance`), `icacls <ruta>` para consultar y con `/grant[:r]`, `/deny`, `/remove`, `/inheritance:d\|r\|e`, `/setowner` |
| Propietario | `takeown /F <ruta>` con `/A` (al grupo Administradores) y `/R` (recursivo), `icacls <ruta> /setowner <identidad>` |
| Ficheros | `New-Item` (`ni`, `md`), `Set-Content`, `Add-Content`, `Copy-Item`, `Move-Item`, `Rename-Item`, `Remove-Item` (`rm`, `del`), `notepad` |
| Tubería de objetos | `Where-Object` (`where`, `?`), `Select-Object`, `Sort-Object`, `Measure-Object`, `Group-Object`, `ForEach-Object` (`%`), `Format-List` (`fl`), `Format-Table` (`ft`), `Get-Member` (`gm`) |
| Sesión y ayuda | `Get-Help` (`help`, `man`), `Get-Command`, `Get-Alias`, `Get-History`, `Get-Date`, `Write-Output` (`echo`), `Write-Host`, `Clear-Host` (`cls`, `clear`), `help` (guía del reto), `exit` |
| Composición | Tuberías con `\|`, redirecciones `>` y `>>`, encadenado con `&&`, `\|\|` y `;`, comillas simples y dobles, comodines |

Atajos: <kbd>↑</kbd>/<kbd>↓</kbd> historial, <kbd>Tab</kbd> autocompletar (comandos, alias y
rutas), <kbd>Ctrl</kbd>+<kbd>L</kbd> limpiar la pantalla, <kbd>Ctrl</kbd>+<kbd>C</kbd>
cancelar la línea.
En el bloc de notas simulado (`notepad`): <kbd>Ctrl</kbd>+<kbd>O</kbd> guardar,
<kbd>Ctrl</kbd>+<kbd>X</kbd> cerrar, <kbd>Ctrl</kbd>+<kbd>K</kbd> cortar línea,
<kbd>Ctrl</kbd>+<kbd>U</kbd> pegar (también hay botones).

## Cómo se diseñó

### Principios que guiaron las decisiones

- **Primero leer, después escribir.** La fase 1 entera se dedica a mirar: ninguna tarea
  cambia nada hasta la sexta. Se decidió así porque el error típico con `icacls` no es
  teclear mal la orden, sino no entender qué se está mirando: quien no distingue una
  entrada heredada de una explícita acaba «arreglando» la carpeta equivocada.
- **Las dos herramientas, y para qué sirve cada una.** `Get-Acl | Format-List` se enseña
  como la forma cómoda de **leer** (identidad, derechos, tipo y herencia, con sus nombres
  completos) e `icacls` como la de **cambiar**, porque es la que aparece en toda la
  documentación y en todos los guiones de administración. No se elige una y se esconde la
  otra: se usan las dos sobre la misma carpeta para que se vea que dicen lo mismo.
- **El simulador no enseña cosas falsas.** Lo que se concede arriba baja solo a lo de
  abajo; `/inheritance:d` conserva los permisos heredados como propios y `/inheritance:r`
  los elimina; restaurar la herencia **no** borra las entradas explícitas que alguien puso
  a mano (de ahí la tarea NTF-16); una denegación explícita gana a cualquier permiso
  concedido; los permisos de varios grupos se acumulan; el propietario siempre puede
  cambiar la ACL aunque la ACL se lo niegue; `icacls` rechaza los permisos inventados con
  el mensaje de siempre.
- **Mínimo privilegio como hilo conductor, no como eslogan.** Cada tarea de concesión
  obliga a elegir derecho: `RX` para poder atravesar, `M` para quien trabaja, `R` para
  quien solo consulta y `F` una única vez, en la carpeta que administra la propia
  administración. La insignia *Mínimo privilegio* recorre el árbol entero al final y solo
  se concede si no queda ni un `FullControl` de más ni rastro de «Todos».
- **Las decisiones tienen consecuencias, pero no se bloquean.** Se puede volver a conceder
  control total a «Todos» o abrir la carpeta de credenciales: cuesta 50 XP, se explica por
  qué es mala idea y queda en el informe. El objetivo es desarrollar criterio, no impedir
  errores.
- **La denegación, como excepción.** Solo hay una tarea de `/deny`, y llega tarde a
  propósito: después de haber concedido correctamente. Además, el propio juego avisa en la
  pista de que lo normal es **no conceder**, porque una ACL llena de denegaciones es
  imposible de mantener. El caso elegido es justo el que las justifica: Ventas hereda la
  lectura por pertenecer a Usuarios, así que no concederle nada no sirve de nada.
- **Terminar documentando.** Las tres últimas tareas no cambian ningún permiso: revisan,
  escriben el estado a un fichero y añaden el criterio. Un bastionado sin documentar se
  deshace solo en cuanto alguien «arregla» lo que no entiende.

### Decisiones de escenario

| Elemento del escenario | Qué enseña |
|---|---|
| `Todos · Control total` heredado en todo el árbol | Que una sola ACE mal puesta arriba lo abre todo abajo |
| `Privado\credenciales.txt` legible por cualquiera | Da urgencia real a la fase 2 y justifica romper la herencia en la 3 |
| La herencia rota en `Ventas` «para probar» | La herencia también falla **por defecto**, no solo por exceso |
| `Ventas` conserva su «Todos» propio tras restaurar la herencia | Que lo heredado y lo explícito son dos cosas distintas |
| `plan-2027.txt`, de una cuenta deshabilitada | Introduce al propietario como tercera pieza, junto a identidad y derechos |
| Ventas dentro de Usuarios, y Usuarios con lectura desde arriba | Hace inevitable la denegación explícita: los permisos se acumulan |

### Evolución respecto a los retos anteriores

| | *Permisos y ACL en Linux* | *Permisos NTFS en Windows* |
|---|---|---|
| Modelo | Tres bloques `rwx` + ACL POSIX + máscara | Lista de ACE con tipo (permitir/denegar) y herencia |
| Herramientas | `chmod`, `chown`, `getfacl`, `setfacl`, `umask` | `Get-Acl`, `Set-Acl`, `icacls`, `takeown` |
| Herencia | ACL por omisión y SGID: afectan a lo que se cree **después** | Herencia viva: se propaga al instante a lo ya existente |
| Denegar | No existe: se quita el permiso | Existe y gana a todo lo demás |
| Consola | Shell POSIX, texto | PowerShell, con **objetos** en la tubería (`Format-List`, `Where-Object`…) |

Ambos comparten el mismo sistema de ficheros simulado ([`shared/js/vfs.js`](../shared/js/vfs.js)),
lo que hace que la comparación entre los dos modelos en clase sea directa: mismo árbol,
mismos grupos, dos formas distintas de proteger lo mismo.

## Elementos de gamificación

Relación con los **12 componentes** vistos en el curso *La gamificación educativa* (solo se
usan los que encajan):

| Componente | ¿Se usa? | Cómo | Por qué |
|---|---|---|---|
| **Misiones** | ✅ | 25 tareas encadenadas (NTF-01…NTF-25) agrupadas en 5 fases | Se habla de tareas y de peticiones, nunca de ejercicios; cada una tiene remitente y motivo |
| **Sorpresa** | ◐ | No hay sabotajes en marcha: las sorpresas están en el escenario (la herencia rota en `Ventas`, el «Todos» que sobrevive a la restauración, el fichero sin dueño) | Una auditoría es un trabajo ordenado; la tensión viene de lo que se va descubriendo, no de interrupciones |
| **Desbloqueo de contenido** | ✅ | Cada tarea se revela al completar la anterior | Hay que avanzar para descubrir qué viene, y el orden importa: no se puede denegar bien sin haber concedido antes |
| **Puntos (XP)** | ✅ | 75-175 XP por tarea, −25 por pista, −50 por decisión arriesgada, +25 por adelantarse | *Feedback* inmediato; las pistas cuestan, pero nunca bloquean |
| **Niveles** | ✅ | Lee una ACL → Maneja `icacls` (450) → Controla la herencia (900) → Administra NTFS (1400) | Los nombres describen una competencia real, no un rango inventado |
| **Insignias** | ✅ | 6 insignias ligadas a buenas prácticas (ver abajo) | Reconocen *cómo* se ha trabajado, no solo haber terminado |
| **Barra de progreso** | ✅ | Progreso por fases, contador de tarea y registro lateral de la auditoría | Ver el avance anima a seguir y ordena el trabajo |
| **Recompensas** | ✅ | Pistas graduadas «compradas» con XP y guía de permisos NTFS siempre disponible | La ayuda existe, pero hay que decidir si compensa |
| **Tablero de clasificación** | ❌ | — | Deliberadamente no: el informe es individual y el tiempo no debe premiar la prisa |
| **Cuenta atrás** | ❌ | Reloj que cuenta hacia arriba, sin límite | Con permisos, la prisa es justo lo que provoca los «Todos · Control total» |
| **Avatar** | ❌ | — | No aporta: la identidad del reto es la cuenta con la que se trabaja, y ya viene dada |
| **Poder** | ❌ | — | La sesión ya es elevada desde el primer minuto; el reto no va de conseguir poder, sino de repartirlo bien |

**Insignias**: 🛡️ *Sin agujeros* (ni un «Todos» ni un control total de más, y ninguna
decisión arriesgada), 🧠 *Autosuficiente* (sin pistas), 📚 *Get-Help* (consultar la ayuda
integrada de un comando), 🎯 *Mínimo privilegio* (cada grupo acaba solo con lo que
necesita), 🧬 *Herencia bajo control* (cortada en `Privado` y restaurada en `Ventas`),
⚡ *Buen ritmo* (menos de 26 minutos).

### Perfiles de jugador (Bartle)

- **Explorer**: hay mucho que probar que ninguna tarea pide: `Get-Member` sobre el objeto
  de `Get-Acl`, `Get-Alias`, `Get-Command`, `Get-Help` de cualquier comando, `Set-Acl` como
  alternativa a `icacls`, `/inheritance:d` para ver en qué se diferencia de `:r`, recorrer
  `C:\Users`, o editar el `LEEME.txt` con `notepad`.
- **Achiever**: XP, cuatro niveles, seis insignias y un informe final con las 25 tareas y
  el comando exacto con que se resolvió cada una.
- **Killer**: tiempo final e insignia *Buen ritmo*, sin tablero público; los informes se
  pueden comparar en clase.
- **Socializer**: el trabajo por parejas y la puesta en común, donde casi siempre aparecen
  soluciones distintas para la misma tarea.

### Estado de *flow*

La dificultad sube de forma sostenida: **leer** (fase 1), **conceder** (fase 2, la misma
orden repetida cambiando el derecho: se automatiza el gesto), **herencia** (fase 3, donde
aparece el primer concepto que hay que razonar), **denegar y propietario** (fase 4, las
excepciones) y **comprobar** (fase 5, que baja la tensión y cierra). El reloj sin límite,
las tres pistas por tarea y el selector de fase permiten ajustar el reto a cada ritmo sin
romper la progresión.

## Accesibilidad, inclusión y protección de datos

### Accesibilidad

- **Todo se maneja con teclado**. Con la línea vacía, <kbd>Tab</kbd> sale de la consola al
  resto de la página, así que el autocompletado no atrapa el foco.
- **Lectores de pantalla**: la salida de la consola es un `role="log"`; una región
  `role="status"` independiente anuncia solo lo importante (nueva tarea con su objetivo,
  tarea completada, pistas y ascensos de nivel).
- **Nunca solo color**: los estados combinan color, símbolo y texto, y las marcas que hay
  que leer en una ACL (`(I)`, `(DENY)`, `F`, `M`, `RX`) son texto, no iconos.
- **Contraste alto** sobre el fondo azul oscuro de la consola, foco visible y tipografía
  monoespaciada.
- **Movimiento reducido**: con `prefers-reduced-motion` se quitan las animaciones y se
  acortan las esperas entre tareas.
- **Modales accesibles**: foco atrapado, cierre con <kbd>Esc</kbd> y devolución del foco.
- **Editor accesible**: el bloc de notas simulado tiene etiqueta, anuncio al abrirse y
  botones para quienes no usen atajos de teclado.
- **Adaptable**: por debajo de 900 px el panel lateral se coloca sobre la consola.
  Comprobado a 400 px de ancho, sin scroll horizontal.

### Inclusión

- **Cada cual a su ritmo**: sin tiempo límite; el reloj es informativo.
- **Ayuda graduada**: tres pistas por tarea (la primera nombra la herramienta, la segunda
  explica la sintaxis y solo la tercera da la orden completa), guía de permisos NTFS
  siempre accesible y `Get-Help` dentro del propio juego.
- **Se puede empezar por cualquier fase**, lo que permite repartir el reto en varias
  sesiones o adaptar el punto de partida a cada persona.
- **Sin castigo definitivo**: se puede reiniciar sin penalización y ninguna acción deja el
  reto sin salida.
- **Tono y lenguaje**: español correcto, mensajes de error que orientan en lugar de culpar,
  y un reparto de personajes equilibrado con nombres y apellidos del entorno cercano.

### Protección de datos y uso responsable

- **No recoge ningún dato personal**: no pide nombre, ni correo, ni nada identificativo.
- **No guarda nada**: el progreso vive en la memoria de la pestaña y desaparece al
  cerrarla. No usa cookies ni almacenamiento del navegador.
- **No envía nada a ningún servidor** ni depende de servicios externos (ni CDN, ni fuentes
  web, ni analítica).
- **Es una simulación**: ningún permiso de la máquina real se consulta ni se modifica. Las
  credenciales del fichero `credenciales.txt` son inventadas.
- El propio escenario es una buena excusa para hablar de **RGPD**: una carpeta compartida
  con «Todos · Control total» donde hay datos de personas es, literalmente, una brecha de
  seguridad esperando a ocurrir.

## Uso en el aula

**Antes**
- Pregunta de arranque: «¿alguien ha visto una carpeta de red donde se pueda borrar el
  trabajo de otro?». Suele salir solo.
- Vocabulario mínimo: identidad, grupo, permiso, heredar, propietario.
- Si ya se ha hecho el reto de permisos en Linux, recordar el modelo `rwx` para poder
  comparar después.

**Durante**
- Individual o **en parejas** (una persona teclea y la otra consulta la guía y los
  `Get-Help`; se cambia de rol en cada fase).
- Sugerencia de reparto: fases 1-2 en una sesión y 3-5 en otra, usando el **selector de
  fase** de la portada.
- El docente circula y pregunta en lugar de resolver: «¿esa entrada está puesta ahí o viene
  de arriba?», «¿por qué `M` y no `F`?», «si Ventas está dentro de Usuarios, ¿qué pasa si
  simplemente no le concedes nada?».
- Pedir que, antes de teclear cada cambio, se diga en voz alta qué se espera ver después en
  `icacls`.

**Después**
- **Puesta en común**: ¿quién usó `Set-Acl` en vez de `icacls`? ¿`takeown /A` o `takeown`
  más `/setowner`? ¿Alguien usó `/inheritance:d` en lugar de `:r` y qué pasó?
- **Pregunta de cierre**: ¿en qué casos es legítimo usar `/deny` y en cuáles es señal de
  que la estructura de grupos está mal pensada?
- **Comparación con Linux**: mismo problema, dos modelos. ¿Qué resuelve mejor cada uno?
- **Evidencia para el aula virtual**: captura del informe final, o el contenido del fichero
  `C:\Datos\permisos.txt` que se genera en la fase 5.
- **Ampliación**: repetir el bastionado en una máquina real o en una virtual, con los
  mismos comandos, y comprobar que se comportan igual.

## Detalles técnicos

HTML semántico, CSS y JavaScript *vanilla* (sin *frameworks*, sin dependencias, sin *build*
y sin módulos ES, para que funcione también con `file://`). Casi todo el motor está en la
biblioteca compartida [`shared/`](../shared/) (espacio de nombres `RG`): el reto solo aporta
**datos**.

| Fichero | Contenido |
|---|---|
| `index.html` | Marcado de las tres pantallas, el bloc de notas y la guía de permisos NTFS |
| `css/reto.css` | Los pocos estilos propios: ancho del panel y el azul de la consola de Windows |
| `data/config.js` | El escenario: equipo, usuarios y grupos, árbol de carpetas y ACE iniciales |
| `data/gamification.js` | Fases, niveles, insignias y costes (pista, penalización, bonus) |
| `data/missions.js` | El contenido de las 25 tareas (textos, objetivos y pistas), sin lógica |
| `js/missions.js` | La comprobación y la `solution` de cada tarea, y la vigilancia de decisiones arriesgadas |
| `js/main.js` | Arranque: monta `RG.Sandbox` con los datos del reto, los textos y el informe |

De la biblioteca compartida, las piezas que sostienen este reto:

| Módulo compartido | Qué aporta aquí |
|---|---|
| `shared/js/vfs.js` | El sistema de ficheros con **ACE de Windows**: `aces` (identidad, derechos, tipo, heredada), el conmutador `inherit`, `propagate()` (la herencia viva) y el cálculo de acceso efectivo, donde **deniega gana** y los permisos **se acumulan** |
| `shared/js/cmd-pwsh.js` | La consola de PowerShell: cmdlets de ficheros, tubería de objetos, `Get-Acl`/`Set-Acl`, `icacls` y `takeown` con sus mensajes y sus códigos de salida |
| `shared/js/sandbox.js` | El arranque común: terminal, intérprete, editor, motor de tareas, barra de fases, selector de fase inicial e informe final |
| `shared/js/game.js` | XP, niveles, pistas, insignias, decisiones arriesgadas, ficha lateral y registro |
| `shared/js/sysmodel.js` | Usuarios y grupos del dominio simulado (quién pertenece a qué) |

Claves del diseño:

- **La herencia es real, no cosmética.** Cada cambio de ACL llama a `propagate()`, que
  reescribe las entradas heredadas de todo lo que hay debajo conservando las explícitas.
  Por eso `/inheritance:e` devuelve los permisos de arriba sin borrar lo que se puso a
  mano, y por eso hace falta la tarea NTF-16.
- **Las tareas miran el estado, no el texto tecleado.** Las de lectura comprueban el evento
  (`getacl` con su herramienta y su ruta); las de cambio, la ACL resultante (que exista una
  ACE **propia**, no heredada, con esa identidad, esos derechos y ese tipo). De ahí que
  haya varias soluciones válidas.
- **Contenido separado de la lógica**: los textos viven en `data/missions.js` (datos puros,
  editables por el profesorado) y la lógica en `js/missions.js`, emparejados por posición
  mediante el código `NTF-xx`.
- **La `solution` de cada tarea** se reproduce en silencio cuando se empieza por una fase
  posterior, de modo que el servidor queda exactamente como lo habría dejado quien hubiera
  jugado las fases anteriores.
- **Añadir o cambiar una tarea**: editar `data/missions.js` (y `data/gamification.js` si se
  toca una fase) y su `check`/`solution` en `js/missions.js`. Toda la interfaz (progreso,
  ficha, registro, informe) se genera a partir de esos datos.

## Verificación

Se ha probado en **Chrome real en modo *headless***, manejado por el protocolo DevTools
(CDP) desde Node.js, con un guion que simula a una persona jugando: **42 comprobaciones,
todas superadas y sin ningún error de JavaScript**. Se ejecuta con:

```bash
node .claude/skills/verificar-reto/scripts/run.mjs test-permisos-windows
```

Cubre:

- la **partida completa**, resolviendo las 25 tareas con los comandos que propone cada
  ficha;
- el **estado inicial**: que `C:\Datos` empieza con `Todos:(F)` y que las subcarpetas lo
  reciben marcado con `(I)`;
- que **las ACL funcionan de verdad** al terminar: la raíz sin «Todos» y con
  `Usuarios:(RX)`, `Privado` sin ninguna `(I)` y solo con `Administradores:(F)`, `Ventas`
  heredando otra vez y conservando su `(M)` propio, la denegación marcada como `(DENY)` en
  `Direccion` y el fichero de la cuenta deshabilitada ya a nombre de `Administradores`;
- el **informe escrito** en la fase 5, con la conclusión añadida al final;
- que **`icacls` rechaza permisos inventados** con el mensaje real;
- el **informe final**: XP por encima de 3000, las 25 filas, ninguna decisión arriesgada y
  al menos 5 insignias cuando se juega sin pistas;
- **empezar por una fase posterior**: el servidor aparece preparado (la herencia ya cortada
  en `Privado`) y esas tareas no suman XP;
- la **portada**, que ofrece las 5 fases.

El reto comparte biblioteca con los demás, así que cualquier cambio en `shared/` obliga a
pasar también las pruebas del resto: `node .claude/skills/verificar-reto/scripts/run.mjs`
las ejecuta todas.

## Limitaciones conocidas

- **`Set-Acl` está simplificado.** Aquí admite una forma abreviada
  (`Set-Acl -Path … -Identity … -Rights … [-Type Deny]`, con `-Remove`, `-Owner`,
  `-DisableInheritance` y `-EnableInheritance`). En un equipo real hay que construir un
  objeto `FileSystemAccessRule` y pasarlo por `SetAccessRule`/`AddAccessRule` sobre el
  descriptor devuelto por `Get-Acl`. Es la única concesión deliberada del reto, y por eso
  todas las tareas de cambio se plantean con `icacls`.
- **Los derechos son un subconjunto**: `FullControl`, `Modify`, `ReadAndExecute`, `Read`,
  `Write` y `ListDirectory` (`F`, `M`, `RX`, `R`, `W`, `RD`). No existen los **permisos
  especiales** (los 14 derechos avanzados: `WriteData`, `Delete`, `ChangePermissions`,
  `TakeOwnership`…) ni sus combinaciones a medida.
- **No se modela la auditoría** (SACL, la pestaña «Auditoría» de Windows), ni los permisos
  de **recurso compartido** de SMB, que en un servidor real se combinan con los de NTFS.
- **No hay marcas de propagación** `(OI)`, `(CI)`, `(IO)` ni `(NP)`: la herencia es «todo o
  nada» hacia los descendientes. Tampoco hay SID, ni orden canónico de las ACE, ni
  identidades especiales más allá de «Todos», «Usuarios» y «Administradores».
- **`icacls` acepta `/T`, `/C`, `/Q` y `/L` pero no hacen nada**: no hay operaciones
  recursivas sobre un árbol. Los cambios se aplican carpeta a carpeta (lo que, dicho sea de
  paso, es la práctica recomendable en una auditoría).
- **El acceso efectivo está simplificado**: internamente los derechos se traducen a
  lectura, escritura y recorrido, así que `Modify` y `FullControl` dan el mismo acceso
  práctico a los ficheros; la diferencia entre ambos (poder cambiar la ACL y el
  propietario) se explica y se evalúa, pero no se puede *sufrir* dentro del juego.
- **No se cambia de identidad**: no hay «Ejecutar como» ni forma de iniciar sesión como
  Bruno para comprobar en primera persona que la denegación le afecta. El efecto se razona
  leyendo la ACL, no se experimenta. Administración siempre tiene acceso.
- **El progreso no se guarda**: al recargar se empieza de cero (intencionado, para no
  almacenar datos). El selector de fase permite retomar el reto por donde se quedó.

## Archivos

| Archivo | Contenido |
|---|---|
| [`index.html`](index.html) | Marcado de las tres pantallas, el bloc de notas y la guía de permisos NTFS |
| [`css/`](css/) · [`data/`](data/) · [`js/`](js/) | Estilos propios · escenario, gamificación y textos de las tareas · lógica de las tareas y arranque |
| [`../shared/`](../shared/) | Biblioteca común: sistema de ficheros con ACE, consola de PowerShell, terminal, editor, modales y motor de tareas |
| [`README.md`](README.md) | Este documento |

## Créditos

Made with 💖 by [@fvarrui](https://github.com/fvarrui) & [Claude](https://claude.ai).

Diseñado como reto digital de elaboración propia para el curso *La gamificación educativa*,
dentro de la propuesta «Operación Escudo Digital».
