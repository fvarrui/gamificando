/* ==========================================================
   Contenido de las tareas (solo textos: sin lógica).
   La comprobación de cada una está en js/missions.js,
   emparejada por el código LNX-xx que se asigna por posición.
   ========================================================== */
(function (global) {
  "use strict";
  var LX = global.LX = global.LX || {};

  var WEAVER = "Sigourney Weaver · Sistemas";
  var ARNOLD = "Arnold Schwarzenegger · Soporte";

  LX.MISSION_CONTENT = [
    /* ---------------- FASE 1 · ORIENTACIÓN ---------------- */
    {
      phase: 0, severity: "info", source: WEAVER, xp: 50,
      title: "¿Dónde estás?",
      text: "Acabas de entrar por primera vez en el servidor de prácticas. En una consola nunca hay un icono que te diga dónde estás: hay que preguntarlo.",
      objective: "Muestra la ruta de la carpeta en la que te encuentras ahora mismo.",
      hints: [
        "La orden son tres letras y significa «print working directory».",
        "No lleva ninguna opción: se escribe sola y responde con una ruta absoluta.",
        "Escribe: pwd"
      ]
    },
    {
      phase: 0, severity: "info", source: WEAVER, xp: 50,
      title: "Mira a tu alrededor",
      text: "Ya sabes dónde estás. Ahora hay que ver qué hay: en tu carpeta personal te hemos dejado varias subcarpetas y un fichero de bienvenida.",
      objective: "Lista el contenido de tu carpeta personal.",
      hints: [
        "La orden para listar es ls, de «list».",
        "Sin argumentos lista la carpeta actual.",
        "Escribe: ls"
      ]
    },
    {
      phase: 0, severity: "info", source: WEAVER, xp: 75,
      title: "Con detalle",
      text: "El listado simple solo da nombres. Para trabajar de verdad necesitas saber si algo es una carpeta o un fichero, de quién es, cuánto ocupa y cuándo se modificó.",
      objective: "Lista tu carpeta personal en formato largo (una línea por elemento, con permisos, dueño, tamaño y fecha).",
      hints: [
        "La opción de «formato largo» es una sola letra: -l.",
        "La primera letra de cada línea indica el tipo: d es directorio, - es fichero normal.",
        "Escribe: ls -l"
      ]
    },
    {
      phase: 0, severity: "info", source: WEAVER, xp: 75,
      title: "Lo que no se ve",
      text: "En Linux, todo lo que empieza por un punto está oculto: la configuración personal suele vivir ahí. Que no se vea no significa que no exista.",
      objective: "Lista tu carpeta personal incluyendo los elementos ocultos, en formato largo.",
      hints: [
        "La opción para mostrar «todo», incluidos los ocultos, es -a.",
        "Las opciones cortas se pueden juntar: -l y -a se escriben -la.",
        "Escribe: ls -la"
      ]
    },
    {
      phase: 0, severity: "info", source: WEAVER, xp: 75,
      title: "Entra en documentos",
      text: "Para trabajar con los informes hay que colocarse dentro de la carpeta documentos. Moverse por el árbol de directorios es el 80 % del trabajo en consola.",
      objective: "Sitúate dentro de la carpeta documentos de tu directorio personal.",
      hints: [
        "La orden para cambiar de directorio es cd, de «change directory».",
        "Puedes usar una ruta relativa (documentos) porque ya estás en tu carpeta personal.",
        "Escribe: cd documentos"
      ]
    },
    {
      phase: 0, severity: "info", source: WEAVER, xp: 75,
      title: "Vuelve sobre tus pasos",
      text: "Bajar es fácil; lo que despista al principio es subir. Cada carpeta tiene dos entradas especiales: . (ella misma) y .. (la de encima).",
      objective: "Sube al directorio superior, es decir, vuelve a tu carpeta personal.",
      hints: [
        "Se usa la misma orden que para entrar, pero con los dos puntos.",
        "cd ~ y cd a secas también te llevan a tu carpeta personal, desde donde estés.",
        "Escribe: cd .."
      ]
    },
    {
      phase: 0, severity: "info", source: ARNOLD, xp: 100,
      title: "El mapa completo",
      text: "Antes de tocar nada conviene tener una foto del árbol entero: qué carpetas hay y qué contienen. Así no te pierdes.",
      objective: "Muestra el árbol de carpetas y ficheros de tu directorio personal.",
      hints: [
        "Hay una orden que dibuja el árbol con líneas: se llama igual que un árbol en inglés.",
        "Sin argumentos dibuja el árbol desde el directorio actual.",
        "Escribe: tree"
      ]
    },

    /* ---------------- FASE 2 · LEER SIN MIEDO ---------------- */
    {
      phase: 1, severity: "info", source: WEAVER, xp: 75,
      title: "Lee la bienvenida",
      text: "En tu carpeta personal hay un bienvenida.txt con las normas de la casa. Empieza por ahí.",
      objective: "Muestra por pantalla el contenido completo de bienvenida.txt.",
      hints: [
        "La orden clásica para volcar un fichero entero es cat (de «concatenate»).",
        "Se le pasa el nombre del fichero como argumento.",
        "Escribe: cat bienvenida.txt"
      ]
    },
    {
      phase: 1, severity: "info", source: WEAVER, xp: 100,
      title: "Solo el principio",
      text: "Los registros son largos y volcarlos enteros llena la pantalla. Cuando solo quieres comprobar el formato, basta con asomarte a las primeras líneas.",
      objective: "Muestra únicamente las 3 primeras líneas de registros/acceso.log.",
      hints: [
        "La orden que muestra el principio de un fichero es head («cabeza»).",
        "El número de líneas se indica con la opción -n.",
        "Escribe: head -n 3 registros/acceso.log"
      ]
    },
    {
      phase: 1, severity: "warn", source: ARNOLD, xp: 100,
      title: "Lo último que pasó",
      text: "Cuando algo acaba de fallar, lo interesante siempre está al final del registro: lo más reciente se escribe abajo.",
      objective: "Muestra las 3 últimas líneas de registros/sistema.log.",
      hints: [
        "Si el principio es head, el final es tail («cola»).",
        "Usa también la opción -n para indicar cuántas líneas quieres.",
        "Escribe: tail -n 3 registros/sistema.log"
      ]
    },
    {
      phase: 1, severity: "info", source: WEAVER, xp: 100,
      title: "¿Cuánto hay aquí?",
      text: "Para el parte de incidencias hay que decir cuántas líneas tiene el registro de accesos. Contarlas a ojo no es una opción.",
      objective: "Cuenta cuántas líneas tiene registros/acceso.log.",
      hints: [
        "La orden que cuenta es wc, de «word count»: cuenta líneas, palabras y caracteres.",
        "Para quedarte solo con el número de líneas, usa la opción -l.",
        "Escribe: wc -l registros/acceso.log"
      ]
    },
    {
      phase: 1, severity: "warn", source: ARNOLD, xp: 125,
      title: "Busca los fallos",
      text: "Alguien ha estado intentando entrar con usuarios que no existen. En el registro de accesos, esos intentos aparecen marcados como WARN.",
      objective: "Muestra solo las líneas de registros/acceso.log que contienen WARN.",
      hints: [
        "La orden para buscar texto dentro de ficheros es grep.",
        "El orden es: grep PATRÓN FICHERO. Si el patrón lleva espacios, entrecomíllalo.",
        "Escribe: grep WARN registros/acceso.log"
      ]
    },
    {
      phase: 1, severity: "info", source: WEAVER, xp: 100,
      title: "¿Y esto qué es?",
      text: "En la carpeta scripts hay ficheros sin extensión clara. Antes de abrir nada conviene preguntarle al sistema qué tipo de fichero es.",
      objective: "Averigua de qué tipo es el fichero scripts/copia.sh.",
      hints: [
        "La orden se llama igual que «fichero» en inglés y responde con el tipo de contenido.",
        "En Linux la extensión no decide nada: el tipo se deduce del contenido.",
        "Escribe: file scripts/copia.sh"
      ]
    },

    /* ---------------- FASE 3 · CREAR Y ORDENAR ---------------- */
    {
      phase: 2, severity: "info", source: WEAVER, xp: 100,
      title: "Prepara las entregas",
      text: "A partir de hoy todo lo que termines lo dejarás en una carpeta propia, para que el equipo sepa dónde mirar.",
      objective: "Crea una carpeta llamada entregas dentro de tareas.",
      hints: [
        "La orden para crear directorios es mkdir, de «make directory».",
        "Puedes darle una ruta relativa: tareas/entregas.",
        "Escribe: mkdir tareas/entregas"
      ]
    },
    {
      phase: 2, severity: "info", source: WEAVER, xp: 100,
      title: "Una copia de seguridad a mano",
      text: "Vas a tocar el informe de red. Antes de modificar cualquier cosa, la costumbre sana es dejar una copia con el original intacto.",
      objective: "Copia documentos/informe-red.txt a documentos/informe-red.txt.bak.",
      hints: [
        "La orden para copiar es cp: cp ORIGEN DESTINO.",
        "Si el destino no existe, se crea con ese nombre; si es una carpeta, la copia se guarda dentro.",
        "Escribe: cp documentos/informe-red.txt documentos/informe-red.txt.bak"
      ]
    },
    {
      phase: 2, severity: "info", source: ARNOLD, xp: 125,
      title: "Escribe tu parte",
      text: "El parte diario es un fichero de texto con una línea por incidencia. Puedes crearlo con el editor o directamente desde la consola redirigiendo la salida.",
      objective: "Crea el fichero tareas/entregas/parte.txt con al menos una línea de texto dentro.",
      hints: [
        "Con nano tareas/entregas/parte.txt abres el editor: Ctrl+O guarda y Ctrl+X sale.",
        "También puedes redirigir: echo \"texto\" > fichero crea el fichero (o lo vacía), y >> añade al final.",
        "Escribe: echo \"Punto de acceso de planta 2 averiado\" > tareas/entregas/parte.txt"
      ]
    },
    {
      phase: 2, severity: "info", source: ARNOLD, xp: 100,
      title: "Añade sin borrar",
      text: "Ojo con las redirecciones: > machaca el fichero entero. Si quieres conservar lo que ya había, tienes que añadir al final.",
      objective: "Añade una segunda línea a tareas/entregas/parte.txt sin perder la primera.",
      hints: [
        "El operador que añade al final son dos símbolos de mayor que: >>.",
        "Comprueba el resultado con cat tareas/entregas/parte.txt: deben verse las dos líneas.",
        "Escribe: echo \"Enlace de respaldo de Santa Cruz cortado\" >> tareas/entregas/parte.txt"
      ]
    },
    {
      phase: 2, severity: "info", source: WEAVER, xp: 100,
      title: "Cada cosa en su sitio",
      text: "El fichero pendientes.txt está suelto en tareas y ya está resuelto. Muévelo a la carpeta de entregas para dejar el directorio limpio.",
      objective: "Mueve tareas/pendientes.txt dentro de tareas/entregas.",
      hints: [
        "La orden para mover es mv, de «move». También sirve para renombrar.",
        "Si el destino es una carpeta que existe, el fichero se mete dentro con el mismo nombre.",
        "Escribe: mv tareas/pendientes.txt tareas/entregas/"
      ]
    },
    {
      phase: 2, severity: "high", source: WEAVER, xp: 125,
      title: "Limpia lo que sobra",
      text: "La copia de seguridad del informe ya no hace falta: el original está revisado. Borra solo el .bak y nada más: en consola no hay papelera, lo que se borra no vuelve.",
      objective: "Borra el fichero documentos/informe-red.txt.bak.",
      hints: [
        "La orden para borrar es rm, de «remove».",
        "Escribe el nombre completo con cuidado: rm no pide confirmación salvo que uses -i.",
        "Escribe: rm documentos/informe-red.txt.bak"
      ]
    },

    /* ---------------- FASE 4 · BUSCAR Y FILTRAR ---------------- */
    {
      phase: 3, severity: "info", source: ARNOLD, xp: 125,
      title: "¿Dónde está ese fichero?",
      text: "Sigourney pregunta por «notas.md» y nadie recuerda en qué carpeta quedó. Con el árbol lleno de subcarpetas, buscar a mano es perder la mañana.",
      objective: "Busca, desde tu carpeta personal, todos los ficheros que se llamen notas.md.",
      hints: [
        "La orden para buscar ficheros es find: find DÓNDE CRITERIO.",
        "El criterio por nombre es -name y admite comodines entrecomillados: find . -name \"*.md\".",
        "Escribe: find . -name notas.md"
      ]
    },
    {
      phase: 3, severity: "warn", source: ARNOLD, xp: 150,
      title: "Errores en todos los registros",
      text: "Quieren un repaso de todos los ERROR que haya en la carpeta de registros, sin ir fichero por fichero.",
      objective: "Busca la palabra ERROR en todos los ficheros de la carpeta registros de una sola vez.",
      hints: [
        "grep acepta varios ficheros a la vez: grep ERROR registros/*.log",
        "También puede bajar por las subcarpetas con la opción -r (recursivo): grep -r ERROR registros",
        "Escribe: grep -r ERROR registros"
      ]
    },
    {
      phase: 3, severity: "info", source: WEAVER, xp: 150,
      title: "Enchufa una orden a otra",
      text: "Aquí está la idea más potente de la consola: la salida de una orden puede entrar directamente en otra. Se encadenan con una barra vertical, la tubería.",
      objective: "Cuenta cuántas líneas de registros/acceso.log contienen WARN, encadenando grep con wc.",
      hints: [
        "La tubería es el carácter | y va entre las dos órdenes.",
        "La segunda orden recibe el texto de la primera, así que no lleva nombre de fichero.",
        "Escribe: grep WARN registros/acceso.log | wc -l"
      ]
    },
    {
      phase: 3, severity: "info", source: WEAVER, xp: 150,
      title: "Deja el resultado por escrito",
      text: "El recuento hay que entregarlo, no solo verlo. Une las dos ideas: filtra, cuenta y guarda el resultado en un fichero.",
      objective: "Guarda en tareas/entregas/resumen.txt el resultado de filtrar y contar los WARN del registro de accesos.",
      hints: [
        "Puedes encadenar tubería y redirección en la misma línea: orden | filtro > fichero.",
        "El fichero se crea aunque no exista. Compruébalo después con cat.",
        "Escribe: grep WARN registros/acceso.log | wc -l > tareas/entregas/resumen.txt"
      ]
    },

    /* ---------------- FASE 5 · CONOCER EL SISTEMA ---------------- */
    {
      phase: 4, severity: "info", source: WEAVER, xp: 100,
      title: "¿Quién eres aquí?",
      text: "En un servidor compartido, saber con qué cuenta estás trabajando evita muchos disgustos: no es lo mismo tocar algo como hamilton que como root.",
      objective: "Muestra el usuario con el que has iniciado sesión.",
      hints: [
        "Es una sola palabra en inglés: «quién soy».",
        "Si además quieres ver tu identificador y tus grupos, prueba después con id.",
        "Escribe: whoami"
      ]
    },
    {
      phase: 4, severity: "info", source: WEAVER, xp: 100,
      title: "Tus grupos",
      text: "Los permisos en Linux no dependen solo de tu usuario, también de los grupos a los que perteneces. Conviene saber en cuáles estás.",
      objective: "Muestra tu identificador de usuario y los grupos a los que perteneces.",
      hints: [
        "Son dos letras: la orden que muestra uid, gid y grupos.",
        "La orden groups muestra solo los nombres de los grupos; id muestra los números y los nombres.",
        "Escribe: id"
      ]
    },
    {
      phase: 4, severity: "info", source: ARNOLD, xp: 125,
      title: "Pregunta al manual",
      text: "Nadie se aprende todas las opciones. Lo que sí hay que saber es dónde están escritas: cada orden trae su manual instalado en el propio sistema.",
      objective: "Abre la página de manual de la orden ls.",
      hints: [
        "La orden para leer manuales se llama man.",
        "Se usa como man ORDEN. Dentro verás secciones: NOMBRE, SINOPSIS, DESCRIPCIÓN, OPCIONES.",
        "Escribe: man ls"
      ]
    },
    {
      phase: 4, severity: "info", source: WEAVER, xp: 125,
      title: "Repasa la jornada",
      text: "Antes de cerrar, deja constancia de lo que has hecho. La consola guarda todas las órdenes que has escrito durante la sesión.",
      objective: "Muestra el historial de órdenes de la sesión.",
      hints: [
        "La orden se llama igual que «historial» en inglés.",
        "Con las flechas ↑ y ↓ también puedes recuperar órdenes anteriores sin volver a escribirlas.",
        "Escribe: history"
      ]
    }
  ];
})(this);
