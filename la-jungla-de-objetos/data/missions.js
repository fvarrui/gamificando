/* ==========================================================
   Contenido de las tareas (solo textos: sin lógica).
   La comprobación de cada una está en js/missions.js,
   emparejada por el código PSH-xx que se asigna por posición.
   ========================================================== */
(function (global) {
  "use strict";
  var PS = global.PS = global.PS || {};

  var ARNOLD = "Arnold Schwarzenegger · Soporte";
  var WEAVER = "Sigourney Weaver · Sistemas";

  PS.MISSION_CONTENT = [
    /* ---------------- FASE 1 · ORIENTACIÓN ---------------- */
    {
      phase: 0, severity: "info", source: ARNOLD, xp: 50,
      title: "¿Dónde estás?",
      text: "Primera sesión en la consola del CPD. En PowerShell todos los comandos (se llaman cmdlets) tienen la forma Verbo-Nombre: en cuanto lo interiorizas, adivinas la mitad de ellos.",
      objective: "Muestra la ruta de la carpeta en la que se encuentra la consola.",
      hints: [
        "El verbo para consultar siempre es Get. El nombre, en este caso, es la ubicación: Location.",
        "Los cmdlets no distinguen mayúsculas de minúsculas, y este además tiene el alias pwd.",
        "Escribe: Get-Location"
      ]
    },
    {
      phase: 0, severity: "info", source: ARNOLD, xp: 50,
      title: "Mira a tu alrededor",
      text: "Tu carpeta personal tiene varias subcarpetas preparadas. Verás que la salida no es texto plano: es una tabla generada a partir de objetos.",
      objective: "Lista el contenido de tu carpeta personal.",
      hints: [
        "Verbo Get, y el nombre son «los elementos hijos»: ChildItem.",
        "Tiene tres alias famosos: gci, dir y ls. Los tres hacen exactamente lo mismo.",
        "Escribe: Get-ChildItem"
      ]
    },
    {
      phase: 0, severity: "info", source: ARNOLD, xp: 75,
      title: "Solo las carpetas",
      text: "Cuando una carpeta tiene muchas cosas, conviene quedarse solo con lo que interesa. Los cmdlets traen parámetros para eso, sin necesidad de filtrar después.",
      objective: "Lista únicamente las carpetas (no los archivos) de tu carpeta personal.",
      hints: [
        "Get-ChildItem tiene dos parámetros complementarios: -File y -Directory.",
        "Los parámetros se escriben con un solo guion delante y admiten abreviaturas: -Dir también vale.",
        "Escribe: Get-ChildItem -Directory"
      ]
    },
    {
      phase: 0, severity: "info", source: ARNOLD, xp: 75,
      title: "Entra en Documentos",
      text: "Para trabajar con los informes hay que colocarse dentro de la carpeta. Moverse por el árbol es exactamente igual que en Linux, solo cambia el nombre del cmdlet.",
      objective: "Sitúate dentro de la carpeta Documentos.",
      hints: [
        "Verbo Set (establecer) y nombre Location: Set-Location.",
        "Su alias es cd, y admite rutas relativas: no hace falta escribir C:\\Users\\hamilton\\Documentos.",
        "Escribe: Set-Location Documentos"
      ]
    },
    {
      phase: 0, severity: "info", source: ARNOLD, xp: 75,
      title: "Vuelve sobre tus pasos",
      text: "Los dos puntos significan lo mismo que en cualquier otra consola: la carpeta de encima.",
      objective: "Sube al directorio superior, de vuelta a tu carpeta personal.",
      hints: [
        "Se usa el mismo cmdlet que para entrar, con .. como ruta.",
        "Set-Location sin ruta también te devuelve a tu carpeta personal.",
        "Escribe: Set-Location .."
      ]
    },
    {
      phase: 0, severity: "info", source: WEAVER, xp: 100,
      title: "El mapa completo",
      text: "Antes de tocar nada, hazte una foto del árbol entero: qué carpetas hay y qué contienen, bajando también por las subcarpetas.",
      objective: "Lista de forma recursiva todo el contenido de tu carpeta personal.",
      hints: [
        "El parámetro que baja por las subcarpetas se llama -Recurse.",
        "Es un parámetro de tipo interruptor: no lleva valor detrás, basta con nombrarlo.",
        "Escribe: Get-ChildItem -Recurse"
      ]
    },
    {
      phase: 0, severity: "info", source: WEAVER, xp: 100,
      title: "Pregunta a la consola",
      text: "PowerShell trae la documentación dentro: sinopsis, sintaxis, parámetros y ejemplos de cada cmdlet. Es lo primero que hay que aprender a usar.",
      objective: "Muestra la ayuda del cmdlet Get-ChildItem.",
      hints: [
        "El cmdlet de ayuda es Get-Help, y sus alias son help y man.",
        "Se le pasa el nombre del comando: Get-Help <comando>. Con -Examples ves solo los ejemplos.",
        "Escribe: Get-Help Get-ChildItem"
      ]
    },

    /* ---------------- FASE 2 · LEER SIN MIEDO ---------------- */
    {
      phase: 1, severity: "info", source: ARNOLD, xp: 75,
      title: "Lee la bienvenida",
      text: "En tu carpeta personal hay un Bienvenida.txt con las normas de la casa. Empieza por ahí.",
      objective: "Muestra el contenido completo de Bienvenida.txt.",
      hints: [
        "Verbo Get y nombre Content: el contenido de un archivo.",
        "Sus alias son gc, cat y type. Devuelve una cadena de texto por cada línea del archivo.",
        "Escribe: Get-Content Bienvenida.txt"
      ]
    },
    {
      phase: 1, severity: "info", source: ARNOLD, xp: 100,
      title: "Solo el principio",
      text: "Los registros son largos. Para comprobar el formato basta con asomarse a las primeras líneas.",
      objective: "Muestra únicamente las 3 primeras líneas de Registros\\acceso.log.",
      hints: [
        "Get-Content tiene un parámetro para quedarse con las primeras líneas: -TotalCount.",
        "Los parámetros con valor se escriben -Nombre valor: -TotalCount 3.",
        "Escribe: Get-Content Registros\\acceso.log -TotalCount 3"
      ]
    },
    {
      phase: 1, severity: "warn", source: WEAVER, xp: 100,
      title: "Lo último que pasó",
      text: "Cuando algo acaba de fallar, lo interesante está al final del registro: lo más reciente se escribe abajo.",
      objective: "Muestra las 3 últimas líneas de Registros\\sistema.log.",
      hints: [
        "Si el principio es -TotalCount, el final es -Tail.",
        "Es el equivalente al tail -n 3 de Linux.",
        "Escribe: Get-Content Registros\\sistema.log -Tail 3"
      ]
    },
    {
      phase: 1, severity: "warn", source: WEAVER, xp: 125,
      title: "Busca los intentos fallidos",
      text: "Alguien ha estado probando usuarios que no existen. En el registro de accesos esos intentos aparecen marcados como WARN.",
      objective: "Busca las líneas que contienen WARN dentro de Registros\\acceso.log.",
      hints: [
        "El cmdlet que busca texto dentro de archivos es Select-String, el «grep» de PowerShell.",
        "Necesita dos parámetros: -Pattern con lo que buscas y -Path con dónde buscarlo.",
        "Escribe: Select-String -Pattern WARN -Path Registros\\acceso.log"
      ]
    },
    {
      phase: 1, severity: "info", source: ARNOLD, xp: 100,
      title: "Comprueba antes de actuar",
      text: "En cualquier script, antes de trabajar con una ruta se comprueba que exista. Así se evita la mitad de los errores.",
      objective: "Comprueba si existe la carpeta C:\\Compartido.",
      hints: [
        "El cmdlet devuelve True o False: Test-Path.",
        "Se le pasa la ruta: Test-Path C:\\Compartido. Con -PathType Container exiges además que sea una carpeta.",
        "Escribe: Test-Path C:\\Compartido"
      ]
    },

    /* ---------------- FASE 3 · CREAR Y ORDENAR ---------------- */
    {
      phase: 2, severity: "info", source: ARNOLD, xp: 100,
      title: "Prepara las entregas",
      text: "A partir de hoy dejarás lo que termines en una carpeta propia. En PowerShell no hay un mkdir aparte: crear carpetas y crear archivos es el mismo cmdlet con distinto tipo.",
      objective: "Crea una carpeta llamada Entregas dentro de Tareas.",
      hints: [
        "El cmdlet es New-Item. Su alias ni, y también responde a mkdir.",
        "Hay que indicarle el tipo con -ItemType Directory; si no, crea un archivo.",
        "Escribe: New-Item -Path Tareas\\Entregas -ItemType Directory"
      ]
    },
    {
      phase: 2, severity: "info", source: ARNOLD, xp: 125,
      title: "Escribe tu parte",
      text: "El parte diario es un archivo de texto con una línea por incidencia. Puedes crearlo y escribir dentro en un solo paso.",
      objective: "Crea el archivo Tareas\\Entregas\\Parte.txt con una línea de texto dentro.",
      hints: [
        "Set-Content escribe (y crea si hace falta) el contenido de un archivo: -Path y -Value.",
        "También vale New-Item -Path … -ItemType File -Value \"texto\", o el editor con notepad.",
        "Escribe: Set-Content -Path Tareas\\Entregas\\Parte.txt -Value \"Punto de acceso de planta 2 averiado\""
      ]
    },
    {
      phase: 2, severity: "warn", source: ARNOLD, xp: 100,
      title: "Añade sin borrar",
      text: "Cuidado: Set-Content reemplaza todo el contenido. Para conservar lo que ya había hay que añadir al final.",
      objective: "Añade una segunda línea a Tareas\\Entregas\\Parte.txt sin perder la primera.",
      hints: [
        "El verbo que añade es Add: Add-Content.",
        "Usa los mismos parámetros: -Path y -Value. Compruébalo después con Get-Content.",
        "Escribe: Add-Content -Path Tareas\\Entregas\\Parte.txt -Value \"Enlace de respaldo de Santa Cruz cortado\""
      ]
    },
    {
      phase: 2, severity: "info", source: WEAVER, xp: 100,
      title: "Una copia de seguridad a mano",
      text: "Vas a tocar el informe de red. Antes de modificar nada, deja una copia con el original intacto.",
      objective: "Copia Documentos\\Informe-Red.txt como Documentos\\Informe-Red.bak.",
      hints: [
        "El cmdlet es Copy-Item, con -Path (origen) y -Destination (destino).",
        "Ambos son posicionales: Copy-Item origen destino también funciona.",
        "Escribe: Copy-Item -Path Documentos\\Informe-Red.txt -Destination Documentos\\Informe-Red.bak"
      ]
    },
    {
      phase: 2, severity: "info", source: WEAVER, xp: 100,
      title: "Cada cosa en su sitio",
      text: "El archivo Pendientes.txt ya está resuelto. Muévelo a la carpeta de entregas para dejar Tareas limpia.",
      objective: "Mueve Tareas\\Pendientes.txt dentro de Tareas\\Entregas.",
      hints: [
        "El cmdlet es Move-Item, con los mismos parámetros que Copy-Item.",
        "Si el destino es una carpeta que existe, el archivo se guarda dentro con su nombre.",
        "Escribe: Move-Item -Path Tareas\\Pendientes.txt -Destination Tareas\\Entregas"
      ]
    },
    {
      phase: 2, severity: "high", source: WEAVER, xp: 125,
      title: "Limpia lo que sobra",
      text: "La copia del informe ya no hace falta. Borra solo ese archivo: en la consola no hay papelera, y Remove-Item no pregunta.",
      objective: "Borra el archivo Documentos\\Informe-Red.bak.",
      hints: [
        "El verbo para borrar es Remove: Remove-Item.",
        "Sus alias son rm, del y ri. Para borrar una carpeta con contenido hace falta -Recurse.",
        "Escribe: Remove-Item Documentos\\Informe-Red.bak"
      ]
    },

    /* ---------------- FASE 4 · TUBERÍA DE OBJETOS ---------------- */
    {
      phase: 3, severity: "info", source: ARNOLD, xp: 125,
      title: "¿Qué tiene dentro un objeto?",
      text: "Aquí está la diferencia con las consolas clásicas: los cmdlets no devuelven texto, devuelven objetos con propiedades. Antes de filtrar por una propiedad hay que saber cómo se llama.",
      objective: "Muestra las propiedades de los objetos que devuelve Get-ChildItem.",
      hints: [
        "El cmdlet que enseña las propiedades y métodos de un objeto es Get-Member, con alias gm.",
        "Se usa siempre detrás de una tubería: <comando> | Get-Member",
        "Escribe: Get-ChildItem | Get-Member"
      ]
    },
    {
      phase: 3, severity: "info", source: ARNOLD, xp: 150,
      title: "Filtra por nombre",
      text: "Ya sabes que cada archivo tiene una propiedad Name. Ahora quédate solo con los registros, que son los .log.",
      objective: "Lista de forma recursiva tu carpeta personal y deja pasar solo los elementos cuyo nombre acabe en .log.",
      hints: [
        "El cmdlet que filtra objetos es Where-Object, con alias where y ?.",
        "Para comparar con comodines se usa el operador -like: Where-Object Name -like \"*.log\"",
        "Escribe: Get-ChildItem -Recurse | Where-Object Name -like \"*.log\""
      ]
    },
    {
      phase: 3, severity: "info", source: WEAVER, xp: 150,
      title: "El archivo más grande",
      text: "Para el informe de ocupación hace falta saber cuál es el archivo más grande. Como trabajas con objetos, el tamaño se ordena como número, no como texto.",
      objective: "Ordena los archivos de Documentos por tamaño, de mayor a menor.",
      hints: [
        "El cmdlet es Sort-Object, con alias sort. La propiedad del tamaño se llama Length.",
        "Para invertir el orden se usa el interruptor -Descending.",
        "Escribe: Get-ChildItem Documentos | Sort-Object Length -Descending"
      ]
    },
    {
      phase: 3, severity: "info", source: WEAVER, xp: 150,
      title: "Solo los tres primeros",
      text: "En el informe solo caben tres líneas. Encadena el orden anterior con una selección de los primeros elementos.",
      objective: "Quédate con los 3 primeros elementos de un listado ordenado por tamaño.",
      hints: [
        "El cmdlet que recorta la lista es Select-Object, con alias select.",
        "El parámetro es -First 3. Puedes encadenar tantas tuberías como necesites.",
        "Escribe: Get-ChildItem Documentos | Sort-Object Length -Descending | Select-Object -First 3"
      ]
    },
    {
      phase: 3, severity: "info", source: ARNOLD, xp: 150,
      title: "Cuánto ocupa todo",
      text: "Dirección quiere el total ocupado por tus documentos. Con objetos no hay que sumar a mano: hay un cmdlet que calcula.",
      objective: "Calcula la suma del tamaño (Length) de los archivos de Documentos.",
      hints: [
        "El cmdlet que cuenta y calcula es Measure-Object, con alias measure.",
        "Hay que indicarle sobre qué propiedad calcular y qué cálculo: -Property Length -Sum.",
        "Escribe: Get-ChildItem Documentos | Measure-Object -Property Length -Sum"
      ]
    },
    {
      phase: 3, severity: "info", source: ARNOLD, xp: 150,
      title: "Agrupa por extensión",
      text: "Última pieza de la tubería: agrupar. Sirve para responder preguntas del tipo «¿cuántos archivos hay de cada tipo?» sin contar nada a mano.",
      objective: "Agrupa todos los elementos de tu carpeta personal (incluidas las subcarpetas) por su extensión.",
      hints: [
        "El cmdlet es Group-Object, con alias group. La propiedad se llama Extension.",
        "Devuelve una tabla con Count y Name: cuántos hay de cada valor.",
        "Escribe: Get-ChildItem -Recurse | Group-Object Extension"
      ]
    },

    /* ---------------- FASE 5 · CONOCER LA CONSOLA ---------------- */
    {
      phase: 4, severity: "info", source: WEAVER, xp: 125,
      title: "¿Qué comandos hay?",
      text: "No hace falta memorizar los cmdlets: como todos siguen el patrón Verbo-Nombre, se pueden buscar por una de las dos mitades.",
      objective: "Lista todos los cmdlets cuyo sustantivo sea Item.",
      hints: [
        "El cmdlet que busca comandos es Get-Command, con alias gcm.",
        "Tiene los parámetros -Verb y -Noun para buscar por cada mitad del nombre.",
        "Escribe: Get-Command -Noun Item"
      ]
    },
    {
      phase: 4, severity: "info", source: WEAVER, xp: 125,
      title: "Nombres cortos",
      text: "Muchos alias existen a propósito para que quien viene de Linux o de cmd no se pierda: ls, dir, cat, type, rm, del… todos apuntan a cmdlets.",
      objective: "Averigua a qué cmdlet corresponde el alias ls.",
      hints: [
        "El cmdlet es Get-Alias, con alias gal.",
        "Se le pasa el nombre del alias: Get-Alias ls. Con -Definition haces la consulta al revés.",
        "Escribe: Get-Alias ls"
      ]
    },
    {
      phase: 4, severity: "info", source: ARNOLD, xp: 100,
      title: "Repasa la jornada",
      text: "Antes de cerrar, deja constancia de lo que has hecho. La consola guarda todos los comandos de la sesión.",
      objective: "Muestra el historial de comandos de la sesión.",
      hints: [
        "Verbo Get y nombre History.",
        "Con las flechas ↑ y ↓ también recuperas comandos anteriores sin volver a escribirlos.",
        "Escribe: Get-History"
      ]
    }
  ];
})(this);
