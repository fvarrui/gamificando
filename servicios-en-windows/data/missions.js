/* ==========================================================
   Contenido de las tareas (solo textos: sin lógica).
   La comprobación de cada una está en js/missions.js,
   emparejada por el código WSV-xx que se asigna por posición.
   ========================================================== */
(function (global) {
  "use strict";
  var SW = global.SW = global.SW || {};

  var GUARDIA = "Centro de guardia";
  var NAYRA = "Nayra Suárez · Sistemas";
  var RRHH = "Personas y Talento";

  SW.MISSION_CONTENT = [
    /* ---------------- FASE 1 · DIAGNÓSTICO ---------------- */
    {
      phase: 0, severity: "high", source: GUARDIA, xp: 75,
      title: "El parte de la mañana",
      text: "Son las 7:40 y la aplicación de nóminas no arranca: nadie puede fichar. Empieza por leer lo que te han dejado apuntado.",
      objective: "Lee el archivo guardia.txt de tu carpeta personal.",
      hints: [
        "Estás en C:\\Users\\ana y el archivo está ahí mismo.",
        "El cmdlet que lee un archivo de texto es Get-Content (alias cat, type).",
        "Escribe: Get-Content guardia.txt"
      ]
    },
    {
      phase: 0, severity: "info", source: GUARDIA, xp: 100,
      title: "¿Qué servicios hay?",
      text: "Lo primero en cualquier incidencia de servicios: la foto completa. Estado, nombre corto, nombre para mostrar y tipo de inicio.",
      objective: "Lista todos los servicios del equipo.",
      hints: [
        "Verbo Get y el sustantivo es el servicio: Service.",
        "Devuelve objetos con Status, Name, DisplayName y StartType.",
        "Escribe: Get-Service"
      ]
    },
    {
      phase: 0, severity: "high", source: GUARDIA, xp: 100,
      title: "El servicio de nóminas",
      text: "El servicio de la aplicación se llama AtlanteApp. Mira su ficha concreta.",
      objective: "Muestra el servicio AtlanteApp.",
      hints: [
        "Get-Service acepta el nombre como primer parámetro, o con -Name.",
        "Fíjate en dos columnas distintas: Status (ahora) y StartType (al arrancar Windows).",
        "Escribe: Get-Service -Name AtlanteApp"
      ]
    },
    {
      phase: 0, severity: "info", source: NAYRA, xp: 125,
      title: "¿Qué más está parado?",
      text: "Como los servicios son objetos, no hace falta revisar la lista a ojo: se filtra por la propiedad que interesa.",
      objective: "Lista solo los servicios que están detenidos.",
      hints: [
        "El cmdlet que filtra objetos es Where-Object.",
        "La propiedad es Status y el valor a comparar, Stopped: Where-Object Status -eq Stopped",
        "Escribe: Get-Service | Where-Object Status -eq Stopped"
      ]
    },
    {
      phase: 0, severity: "info", source: NAYRA, xp: 100,
      title: "Y los procesos, por si acaso",
      text: "Una comprobación cruzada: mira los procesos en ejecución para confirmar qué está realmente vivo en el servidor.",
      objective: "Muestra los procesos en ejecución.",
      hints: [
        "Verbo Get y sustantivo Process. Sus alias son gps y ps.",
        "Cada proceso trae su Id, que es lo que necesitarías para detenerlo con Stop-Process.",
        "Escribe: Get-Process"
      ]
    },

    /* ---------------- FASE 2 · DESHABILITADO ---------------- */
    {
      phase: 1, severity: "high", source: GUARDIA, xp: 125,
      title: "Intenta arrancarlo",
      text: "Lo evidente primero: arráncalo. Y fíjate muy bien en lo que responde la consola, porque ahí está la lección de hoy.",
      objective: "Intenta iniciar el servicio AtlanteApp.",
      hints: [
        "El verbo para iniciar es Start: Start-Service.",
        "Se escribe: Start-Service -Name <servicio>. Si falla, lee el mensaje completo antes de seguir.",
        "Escribe: Start-Service -Name AtlanteApp"
      ]
    },
    {
      phase: 1, severity: "warn", source: NAYRA, xp: 125,
      title: "Mira su configuración",
      text: "No arranca porque su tipo de inicio está en Deshabilitado: en Windows eso no significa «no arranca solo», significa «no arranca, y punto». Compruébalo con la herramienta clásica.",
      objective: "Consulta la configuración del servicio AtlanteApp con sc.exe.",
      hints: [
        "La herramienta es sc, y el subcomando que muestra la configuración es qc (query config).",
        "Ojo con una trampa clásica: en PowerShell, sc a secas es el alias de Set-Content. Hay que escribir sc.exe para llamar a la herramienta de servicios.",
        "Escribe: sc.exe qc AtlanteApp"
      ]
    },
    {
      phase: 1, severity: "high", source: NAYRA, xp: 175,
      title: "Habilítalo",
      text: "Mientras esté en Deshabilitado no hay forma de arrancarlo. Cámbialo a Automático: es un servicio que la empresa necesita en cuanto el servidor se enciende.",
      objective: "Cambia el tipo de inicio de AtlanteApp a Automatic.",
      hints: [
        "El verbo para cambiar la configuración es Set: Set-Service.",
        "El parámetro es -StartupType, y admite Automatic, Manual o Disabled.",
        "Escribe: Set-Service -Name AtlanteApp -StartupType Automatic"
      ]
    },
    {
      phase: 1, severity: "high", source: GUARDIA, xp: 175,
      title: "Ahora sí, arráncalo",
      text: "Con el tipo de inicio corregido, el servicio ya puede ponerse en marcha.",
      objective: "Inicia el servicio AtlanteApp.",
      hints: [
        "La misma orden que intentaste al principio de la fase.",
        "Cambiar el tipo de inicio no arranca el servicio: son dos acciones distintas.",
        "Escribe: Start-Service -Name AtlanteApp"
      ]
    },
    {
      phase: 1, severity: "info", source: GUARDIA, xp: 100,
      title: "Confírmalo",
      text: "Nunca des por hecho que ha funcionado. Compruébalo y avisa a Personas y Talento de que ya se puede fichar.",
      objective: "Muestra otra vez el servicio AtlanteApp y comprueba que está en ejecución.",
      hints: [
        "La misma consulta de la primera fase.",
        "Status debe ser Running y StartType, Automatic.",
        "Escribe: Get-Service -Name AtlanteApp"
      ]
    },

    /* ---------------- FASE 3 · TIPOS DE INICIO ---------------- */
    {
      phase: 2, severity: "info", source: NAYRA, xp: 125,
      title: "¿Qué arranca solo en este servidor?",
      text: "Ya que estás dentro, repasa la configuración de arranque. Filtra los servicios que se ponen en marcha solos con el sistema.",
      objective: "Lista los servicios cuyo tipo de inicio sea Automatic.",
      hints: [
        "Filtra con Where-Object por la propiedad StartType.",
        "Se escribe: Get-Service | Where-Object StartType -eq Automatic",
        "Escribe: Get-Service | Where-Object StartType -eq Automatic"
      ]
    },
    {
      phase: 2, severity: "warn", source: NAYRA, xp: 150,
      title: "¿Una cola de impresión aquí?",
      text: "Este servidor no tiene ni una impresora, y la cola de impresión arranca sola con el sistema. Es un servicio de más y, además, con un historial de vulnerabilidades conocido.",
      objective: "Cambia el tipo de inicio del servicio Spooler a Disabled.",
      hints: [
        "Set-Service con -StartupType Disabled.",
        "Cambiar el tipo de inicio no detiene el servicio: seguirá corriendo hasta que lo pares.",
        "Escribe: Set-Service -Name Spooler -StartupType Disabled"
      ]
    },
    {
      phase: 2, severity: "high", source: NAYRA, xp: 150,
      title: "Y párala ahora",
      text: "Ahí lo tienes: deshabilitado pero todavía corriendo. Hay que detenerlo también.",
      objective: "Detén el servicio Spooler.",
      hints: [
        "El verbo para detener es Stop: Stop-Service.",
        "Se escribe: Stop-Service -Name <servicio>.",
        "Escribe: Stop-Service -Name Spooler"
      ]
    },
    {
      phase: 2, severity: "info", source: NAYRA, xp: 100,
      title: "Comprueba la cola de impresión",
      text: "Confirma que ha quedado detenida y deshabilitada, que son las dos cosas.",
      objective: "Muestra el servicio Spooler y comprueba su estado y su tipo de inicio.",
      hints: [
        "Get-Service con el nombre del servicio.",
        "Debe aparecer Stopped y Disabled.",
        "Escribe: Get-Service -Name Spooler"
      ]
    },
    {
      phase: 2, severity: "warn", source: NAYRA, xp: 175,
      title: "La administración remota",
      text: "WinRM está en Manual y parado, y es lo que permite administrar este servidor por PowerShell sin Escritorio remoto. Déjalo en automático y arráncalo.",
      objective: "Pon WinRM en tipo de inicio Automatic y ponlo en marcha.",
      hints: [
        "Son dos pasos: Set-Service -StartupType Automatic y después Start-Service.",
        "También puedes encadenarlos en la misma línea separándolos con punto y coma.",
        "Escribe: Set-Service -Name WinRM -StartupType Automatic ; Start-Service -Name WinRM"
      ]
    },

    /* ---------------- FASE 4 · HERRAMIENTAS ---------------- */
    {
      phase: 3, severity: "info", source: NAYRA, xp: 125,
      title: "La consulta a la vieja usanza",
      text: "Antes de los cmdlets estaba sc, y sigue en todos los Windows. Conviene reconocerla porque aparece en media documentación.",
      objective: "Consulta el estado del servicio AtlanteApp con sc.exe.",
      hints: [
        "El subcomando que consulta el estado es query.",
        "Recuerda escribir sc.exe: qc muestra la configuración y query, el estado.",
        "Escribe: sc.exe query AtlanteApp"
      ]
    },
    {
      phase: 3, severity: "info", source: NAYRA, xp: 125,
      title: "Detener con net",
      text: "Y la otra herramienta clásica: net start y net stop. Pruébala con la cola de impresión, que ya está parada, para ver cómo responde.",
      objective: "Intenta detener el servicio Spooler con la herramienta net.",
      hints: [
        "La orden es net stop seguida del nombre del servicio.",
        "Admite tanto el nombre corto como el nombre para mostrar entre comillas.",
        "Escribe: net stop Spooler"
      ]
    },
    {
      phase: 3, severity: "warn", source: RRHH, xp: 175,
      title: "La aplicación va lenta",
      text: "Personas y Talento avisa de que la aplicación responde con retraso. Reinicia la base de datos para que suelte las conexiones que quedaron colgadas.",
      objective: "Reinicia el servicio MSSQLSERVER.",
      hints: [
        "El verbo que lo detiene y lo vuelve a arrancar es Restart: Restart-Service.",
        "Cuidado: es la base de datos de la aplicación. Reiniciarla es correcto; dejarla parada, no.",
        "Escribe: Restart-Service -Name MSSQLSERVER"
      ]
    },
    {
      phase: 3, severity: "info", source: NAYRA, xp: 125,
      title: "¿Y el proceso?",
      text: "Cada servicio en marcha tiene detrás un proceso. Localiza el de la aplicación de nóminas.",
      objective: "Muestra los procesos y localiza el de la aplicación Atlante.",
      hints: [
        "Get-Process acepta el nombre del proceso con comodines: Get-Process -Name Atlante*",
        "Con servicios es preferible Stop-Service a Stop-Process: el primero los detiene de forma ordenada.",
        "Escribe: Get-Process -Name Atlante*"
      ]
    },
    {
      phase: 3, severity: "info", source: NAYRA, xp: 125,
      title: "El registro del servicio",
      text: "Antes de cerrar la fase, mira qué se había apuntado sobre el servicio de nóminas: ahí está quién lo dejó deshabilitado.",
      objective: "Muestra el contenido de C:\\Atlante\\LEEME.txt.",
      hints: [
        "Get-Content con la ruta completa del archivo.",
        "En un Windows real, el registro de servicios se consulta con Get-WinEvent o el Visor de eventos.",
        "Escribe: Get-Content C:\\Atlante\\LEEME.txt"
      ]
    },

    /* ---------------- FASE 5 · CIERRE ---------------- */
    {
      phase: 4, severity: "info", source: GUARDIA, xp: 125,
      title: "El Escritorio remoto, intacto",
      text: "Antes de colgar: confirma que el servicio de Escritorio remoto sigue en marcha. Si lo hubieras tocado, te quedarías fuera del servidor.",
      objective: "Comprueba que el servicio TermService está en ejecución.",
      hints: [
        "Get-Service con el nombre del servicio.",
        "Detener TermService en un servidor remoto es la forma más rápida de convertir una incidencia en un viaje al centro de datos.",
        "Escribe: Get-Service -Name TermService"
      ]
    },
    {
      phase: 4, severity: "info", source: GUARDIA, xp: 150,
      title: "Repasa lo que queda en marcha",
      text: "El repaso final: los servicios en ejecución, ordenados por nombre para que el parte se lea bien.",
      objective: "Lista los servicios en ejecución ordenados por nombre.",
      hints: [
        "Encadena tres cmdlets: obtener, filtrar por Status y ordenar.",
        "Se escribe: Get-Service | Where-Object Status -eq Running | Sort-Object Name",
        "Escribe: Get-Service | Where-Object Status -eq Running | Sort-Object Name"
      ]
    },
    {
      phase: 4, severity: "info", source: GUARDIA, xp: 150,
      title: "Guarda el estado final",
      text: "Para el parte hace falta el listado de servicios tal y como queda el servidor al cerrar la guardia.",
      objective: "Guarda en C:\\Users\\ana\\estado-final.txt el listado de servicios con su nombre, estado y tipo de inicio.",
      hints: [
        "La consola admite redirección con >, igual que en Linux.",
        "Encadena Get-Service con Format-Table Name,Status,StartType y redirige el resultado.",
        "Escribe: Get-Service | Format-Table Name,Status,StartType > estado-final.txt"
      ]
    },
    {
      phase: 4, severity: "info", source: GUARDIA, xp: 150,
      title: "Cierra el parte",
      text: "Y lo último: añade al parte la línea que explica la causa y la solución. Quien lo lea mañana tiene que entenderlo sin llamarte.",
      objective: "Añade al final de guardia.txt una línea explicando la causa del incidente.",
      hints: [
        "El cmdlet que añade al final sin borrar lo anterior es Add-Content.",
        "Se escribe: Add-Content -Path guardia.txt -Value \"texto\"",
        "Escribe: Add-Content -Path guardia.txt -Value \"08:10 Causa: AtlanteApp estaba en tipo de inicio Deshabilitado. Cambiado a Automatico e iniciado.\""
      ]
    }
  ];
})(this);
