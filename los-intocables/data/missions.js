/* ==========================================================
   Contenido de las tareas (solo textos: sin lógica).
   La comprobación de cada una está en js/missions.js,
   emparejada por el código ACL-xx que se asigna por posición.
   ========================================================== */
(function (global) {
  "use strict";
  var PL = global.PL = global.PL || {};

  var WEAVER = "Sigourney Weaver · Sistemas";
  var YEOH = "Michelle Yeoh · Proyectos";
  var DIR = "Dirección";

  PL.MISSION_CONTENT = [
    /* ---------------- FASE 1 · LEER PERMISOS ---------------- */
    {
      phase: 0, severity: "high", source: WEAVER, xp: 75,
      title: "Mira cómo quedó la carpeta",
      text: "La empresa que instaló el servidor de archivos terminó ayer y se fue. Antes de tocar nada, quiero que veas con tus ojos cómo dejaron /srv/proyectos.",
      objective: "Lista en formato largo el contenido de /srv/proyectos, para ver permisos, dueño y grupo de cada elemento.",
      hints: [
        "Ya estás dentro de la carpeta: basta con listar el directorio actual en formato largo.",
        "La primera columna son los permisos: tipo + tres bloques de rwx (dueño, grupo y resto).",
        "Escribe: ls -l"
      ]
    },
    {
      phase: 0, severity: "high", source: WEAVER, xp: 100,
      title: "Los permisos en números",
      text: "rwxrwxrwx es 777: cualquiera del sistema puede leer, escribir y borrar. Quiero que lo confirmes sobre la propia carpeta, con los permisos en octal.",
      objective: "Muestra los metadatos de /srv/proyectos, con sus permisos en octal.",
      hints: [
        "La orden que muestra los metadatos completos de un fichero o carpeta se llama stat.",
        "En su salida verás «Acceso: (0777/drwxrwxrwx)»: el mismo dato en las dos notaciones.",
        "Escribe: stat /srv/proyectos"
      ]
    },
    {
      phase: 0, severity: "info", source: WEAVER, xp: 100,
      title: "¿Quién eres tú aquí?",
      text: "Los permisos se resuelven comparando tu usuario y tus grupos con el dueño y el grupo del fichero. Comprueba en qué grupos estás.",
      objective: "Muestra tu usuario, tu grupo principal y todos tus grupos secundarios.",
      hints: [
        "Son dos letras: la orden que muestra uid, gid y grupos.",
        "Fíjate en que estás en sistemas y en proyectos: eso te permitirá probar los permisos después.",
        "Escribe: id"
      ]
    },
    {
      phase: 0, severity: "warn", source: WEAVER, xp: 125,
      title: "Busca todo lo que está abierto",
      text: "Antes de arreglar hay que medir. Quiero saber exactamente cuántas cosas quedaron con permisos 777 dentro de la carpeta.",
      objective: "Busca dentro de /srv/proyectos todos los elementos cuyos permisos sean exactamente 777.",
      hints: [
        "La orden que busca por características del fichero es find.",
        "El criterio por permisos es -perm seguido del modo: find /srv/proyectos -perm 777",
        "Escribe: find /srv/proyectos -perm 777"
      ]
    },
    {
      phase: 0, severity: "high", source: WEAVER, xp: 125,
      title: "Lo más grave",
      text: "Hay una subcarpeta «privado» con un fichero de credenciales de servicio. Míralo: ese fichero es el motivo por el que esto es urgente.",
      objective: "Muestra el contenido de privado/claves.txt.",
      hints: [
        "Es un fichero de texto normal: basta con volcarlo.",
        "Fíjate en que has podido leerlo sin ser su dueño ni estar en su grupo: eso es lo que hay que cortar.",
        "Escribe: cat privado/claves.txt"
      ]
    },

    /* ---------------- FASE 2 · DUEÑOS Y GRUPOS ----------------
       Primero el dueño y el grupo, después los permisos: si se
       cierra la carpeta antes de arreglar el grupo, el equipo
       (y tú misma) os quedáis fuera. */
    {
      phase: 1, severity: "high", source: WEAVER, xp: 150,
      title: "La carpeta es del equipo",
      text: "Antes de cerrar nada hay que arreglar de quién es. De nada sirve dar permisos al grupo si el grupo de la carpeta es root: no hay nadie del equipo de proyectos ahí dentro. Y si cierras primero, te quedas fuera tú también.",
      objective: "Cambia el grupo de /srv/proyectos y de todo su contenido al grupo proyectos.",
      hints: [
        "Puedes usar chgrp GRUPO RUTA, o chown :GRUPO RUTA. Ambos admiten -R para aplicarlo a todo el árbol.",
        "Cambiar dueños requiere privilegios de administración: usa sudo.",
        "Escribe: sudo chgrp -R proyectos /srv/proyectos"
      ]
    },
    {
      phase: 1, severity: "info", source: WEAVER, xp: 150,
      title: "Y su responsable, Michelle",
      text: "Michelle coordina el proyecto Atlante: que los documentos sean suyos, no de root. Así podrá ajustar permisos sin pedírnoslo cada vez.",
      objective: "Haz que yeoh sea la propietaria de memoria.txt, presupuesto.csv y acta-direccion.txt.",
      hints: [
        "La orden para cambiar el propietario es chown USUARIO FICHERO, y acepta varios ficheros a la vez.",
        "Con chown usuario:grupo cambias las dos cosas de golpe.",
        "Escribe: sudo chown yeoh memoria.txt presupuesto.csv acta-direccion.txt"
      ]
    },
    {
      phase: 1, severity: "warn", source: YEOH, xp: 175,
      title: "El problema de los ficheros nuevos",
      text: "Michelle avisa: «cuando creo un fichero aquí, se queda con MI grupo, no con el del proyecto, y mis compañeros no pueden tocarlo». Hay un bit pensado exactamente para eso.",
      objective: "Activa el bit SGID en /srv/proyectos, para que todo lo que se cree dentro herede el grupo proyectos.",
      hints: [
        "Es el «set group id». En notación simbólica se activa con g+s sobre el directorio.",
        "En octal es un 2 delante del modo: 2770. Al listar verás una s en el lugar de la x del grupo.",
        "Escribe: sudo chmod g+s /srv/proyectos"
      ]
    },
    {
      phase: 1, severity: "info", source: YEOH, xp: 150,
      title: "Compruébalo tú misma",
      text: "No te fíes de la teoría: crea un fichero de prueba dentro de la carpeta y mira qué grupo le toca.",
      objective: "Crea el fichero prueba.txt dentro de /srv/proyectos y comprueba con ls -l que su grupo es proyectos.",
      hints: [
        "touch crea un fichero vacío; después lista en formato largo para ver su grupo.",
        "Si el SGID está bien puesto, el grupo será proyectos aunque tu grupo principal sea otro.",
        "Escribe: touch prueba.txt && ls -l prueba.txt"
      ]
    },

    /* ---------------- FASE 3 · CHMOD ---------------- */
    {
      phase: 2, severity: "high", source: WEAVER, xp: 125,
      title: "Cierra la puerta principal",
      text: "Empezamos por la carpeta. Queremos que el dueño tenga todo, que el grupo pueda entrar y trabajar, y que el resto de la empresa no pueda ni asomarse.",
      objective: "Pon los permisos de /srv/proyectos en 770 (rwxrwx---), conservando el bit SGID.",
      hints: [
        "La orden es chmod, y admite el modo en octal: chmod MODO RUTA.",
        "Recuerda: 4 lectura, 2 escritura, 1 ejecución. En una carpeta, la x significa «poder entrar».",
        "Escribe: sudo chmod 2770 /srv/proyectos (el 2 delante conserva el SGID que acabas de poner)"
      ]
    },
    {
      phase: 2, severity: "high", source: WEAVER, xp: 125,
      title: "Los documentos del proyecto",
      text: "Los ficheros no necesitan permiso de ejecución: eso solo tiene sentido en programas y scripts. Ajusta la memoria del proyecto a lo justo.",
      objective: "Pon memoria.txt en 660: lectura y escritura para el dueño y para el grupo, nada para el resto.",
      hints: [
        "En un fichero de texto, la x no aporta nada y conviene quitarla.",
        "660 es rw-rw----: 6 es 4+2, es decir, lectura y escritura.",
        "Escribe: sudo chmod 660 memoria.txt"
      ]
    },
    {
      phase: 2, severity: "info", source: YEOH, xp: 125,
      title: "El script sí se ejecuta",
      text: "despliegue.sh es un script y ahora mismo no se puede ejecutar. Dale permiso de ejecución al dueño y al grupo, pero sin tocar el resto de permisos.",
      objective: "Añade permiso de ejecución al dueño y al grupo de despliegue.sh usando la notación simbólica.",
      hints: [
        "chmod también admite notación simbólica: quién (u, g, o, a), qué operación (+, -, =) y qué permiso (r, w, x).",
        "Con + añades sin tocar lo demás; con = fijas exactamente esos permisos.",
        "Escribe: sudo chmod ug+x despliegue.sh"
      ]
    },
    {
      phase: 2, severity: "high", source: WEAVER, xp: 150,
      title: "Fuera el resto del mundo",
      text: "Dentro de la carpeta siguen quedando ficheros abiertos al resto de la empresa. Quítaselo a todos de una vez, sin ir uno por uno.",
      objective: "Quita todos los permisos a «otros» en /srv/proyectos y en todo su contenido.",
      hints: [
        "chmod tiene una opción para aplicar el cambio a todo el árbol: -R (recursivo).",
        "En notación simbólica, quitar a «otros» todos los permisos es o-rwx (o también o=).",
        "Escribe: sudo chmod -R o-rwx /srv/proyectos"
      ]
    },
    {
      phase: 2, severity: "high", source: WEAVER, xp: 150,
      title: "La carpeta privada, solo para su dueño",
      text: "La subcarpeta privado no la debe abrir ni el equipo de proyectos: ahí están las credenciales del servicio. Solo su dueño.",
      objective: "Pon privado en 700 y privado/claves.txt en 600.",
      hints: [
        "Son dos órdenes, o una sola encadenando con && si te apetece.",
        "700 es rwx------ y 600 es rw-------: el grupo y el resto se quedan sin nada.",
        "Escribe: sudo chmod 700 privado && sudo chmod 600 privado/claves.txt"
      ]
    },

    /* ---------------- FASE 4 · ACL ---------------- */
    {
      phase: 3, severity: "warn", source: DIR, xp: 150,
      title: "Ventas necesita el presupuesto",
      text: "Dirección pregunta: Dolph, de ventas, necesita LEER el presupuesto. Pero Dolph no está en proyectos, y no vamos a meterlo: solo necesita ese fichero.",
      objective: "Antes de decidir nada, muestra la lista de control de acceso actual de presupuesto.csv.",
      hints: [
        "La orden que muestra las ACL se llama getfacl.",
        "Verás las entradas user::, group:: y other::, que son los permisos clásicos vistos como ACL.",
        "Escribe: getfacl presupuesto.csv"
      ]
    },
    {
      phase: 3, severity: "warn", source: DIR, xp: 175,
      title: "Solo lectura para ventas",
      text: "Con chmod no se puede: los permisos clásicos solo distinguen dueño, grupo y resto. Para dar acceso a un grupo más hacen falta las ACL.",
      objective: "Concede al grupo ventas permiso de solo lectura sobre presupuesto.csv mediante una ACL.",
      hints: [
        "La orden es setfacl, y la opción para añadir o modificar entradas es -m.",
        "El formato de la entrada es tipo:nombre:permisos, por ejemplo g:ventas:r para un grupo.",
        "Escribe: sudo setfacl -m g:ventas:r presupuesto.csv"
      ]
    },
    {
      phase: 3, severity: "info", source: DIR, xp: 150,
      title: "Comprueba que la ACL está puesta",
      text: "Vuelve a mirar la ACL del fichero: ahora debe aparecer la entrada del grupo ventas, y en ls -l verás un + al final de los permisos.",
      objective: "Muestra de nuevo la ACL de presupuesto.csv y comprueba que aparece group:ventas:r--.",
      hints: [
        "Es la misma orden que usaste antes para consultar las ACL.",
        "El signo + en ls -l es la pista visual de que un fichero tiene ACL: sin él, pasa desapercibido.",
        "Escribe: getfacl presupuesto.csv"
      ]
    },
    {
      phase: 3, severity: "warn", source: DIR, xp: 175,
      title: "Jean-Claude solo necesita el acta",
      text: "Jean-Claude está de prácticas en dirección. Necesita leer el acta y nada más: ni el presupuesto, ni la memoria, ni la carpeta privada.",
      objective: "Concede al usuario vandamme permiso de solo lectura sobre acta-direccion.txt.",
      hints: [
        "Igual que antes, pero la entrada es de usuario: u:nombre:permisos.",
        "Dar el mínimo imprescindible se llama principio de mínimo privilegio, y es la regla de oro.",
        "Escribe: sudo setfacl -m u:vandamme:r acta-direccion.txt"
      ]
    },
    {
      phase: 3, severity: "warn", source: WEAVER, xp: 175,
      title: "Jean-Claude también necesita entrar",
      text: "Ojo con un detalle que despista a todo el mundo: puedes tener permiso sobre un fichero y aun así no llegar a él, porque para atravesar una carpeta hace falta la x sobre ella.",
      objective: "Concede al usuario vandamme permiso de ejecución (atravesar) sobre la carpeta /srv/proyectos, sin darle lectura del listado.",
      hints: [
        "En un directorio, x significa «puedo atravesarlo si sé el nombre exacto» y r significa «puedo listar su contenido».",
        "Como solo tiene que llegar al acta, con x basta: u:vandamme:x",
        "Escribe: sudo setfacl -m u:vandamme:x /srv/proyectos"
      ]
    },
    {
      phase: 3, severity: "high", source: WEAVER, xp: 175,
      title: "Se acabó el contrato",
      text: "La consultora que instaló el servidor ya no trabaja con nosotros: el usuario lundgren tenía una ACL de prueba sobre la memoria del proyecto y hay que retirarla.",
      objective: "Elimina la entrada ACL del usuario lundgren en memoria.txt.",
      hints: [
        "La opción de setfacl para eliminar una entrada concreta es -x.",
        "Se indica el tipo y el nombre, sin permisos: -x u:lundgren",
        "Escribe: sudo setfacl -x u:lundgren memoria.txt"
      ]
    },

    /* ---------------- FASE 5 · FICHEROS NUEVOS ---------------- */
    {
      phase: 4, severity: "warn", source: YEOH, xp: 175,
      title: "Lo que se cree mañana",
      text: "Las ACL que has puesto valen para los ficheros que ya existen. Los que se creen mañana nacerán sin ellas. Hay una ACL «por omisión» pensada justo para eso.",
      objective: "Establece en /srv/proyectos una ACL por omisión que dé al grupo proyectos permisos rwx sobre todo lo que se cree dentro.",
      hints: [
        "La opción de setfacl para la ACL por omisión de un directorio es -d.",
        "Se combina con -m: setfacl -d -m g:grupo:rwx DIRECTORIO",
        "Escribe: sudo setfacl -d -m g:proyectos:rwx /srv/proyectos"
      ]
    },
    {
      phase: 4, severity: "info", source: YEOH, xp: 150,
      title: "Compruébalo con un fichero nuevo",
      text: "Otra vez: no te fíes, compruébalo. Crea un fichero nuevo y mira su ACL.",
      objective: "Crea el fichero nuevo.txt en /srv/proyectos y muestra su ACL para ver que ha heredado la entrada del grupo proyectos.",
      hints: [
        "Primero créalo (touch) y después consulta su ACL (getfacl).",
        "Si la ACL por omisión está bien puesta, el fichero nuevo ya trae la entrada group:proyectos.",
        "Escribe: touch nuevo.txt && getfacl nuevo.txt"
      ]
    },
    {
      phase: 4, severity: "info", source: WEAVER, xp: 150,
      title: "La máscara de creación",
      text: "Hay otra pieza que decide los permisos de lo que creas: la umask de tu sesión. Es lo que se RESTA a los permisos por omisión. Mírala.",
      objective: "Muestra la máscara de creación de ficheros de tu sesión.",
      hints: [
        "La orden se llama igual que el concepto: umask.",
        "Sin argumentos muestra el valor actual; con un valor octal lo cambia.",
        "Escribe: umask"
      ]
    },
    {
      phase: 4, severity: "warn", source: WEAVER, xp: 175,
      title: "Que no se escape nada al resto",
      text: "Con umask 022, un fichero nuevo nace con 644: el resto de la empresa puede leerlo. En este servidor no queremos eso ni por accidente.",
      objective: "Cambia la umask de la sesión a 007, para que lo que crees no dé ningún permiso a «otros».",
      hints: [
        "umask resta permisos: 007 quita rwx a «otros» y no toca al dueño ni al grupo.",
        "Con umask 007 un fichero nuevo nace 660 y un directorio nuevo, 770.",
        "Escribe: umask 007"
      ]
    },
    {
      phase: 4, severity: "info", source: WEAVER, xp: 175,
      title: "Informe final del bastionado",
      text: "Última comprobación antes de cerrar el parte: que no quede nada abierto a todo el mundo dentro de la carpeta.",
      objective: "Vuelve a buscar en /srv/proyectos elementos con permisos 777 y comprueba que no queda ninguno.",
      hints: [
        "Es la misma búsqueda de la primera fase.",
        "Si la salida no muestra nada, es que ya no queda ningún elemento abierto de par en par.",
        "Escribe: find /srv/proyectos -perm 777"
      ]
    },
    {
      phase: 4, severity: "info", source: WEAVER, xp: 150,
      title: "Deja constancia",
      text: "El bastionado hay que documentarlo: si nadie sabe qué se cambió, dentro de seis meses alguien lo deshará «porque no funcionaba».",
      objective: "Guarda en /srv/proyectos/permisos.txt el listado largo de la carpeta, para dejar constancia del estado final.",
      hints: [
        "Puedes redirigir la salida de una orden a un fichero con >.",
        "ls -l genera el listado; la redirección lo guarda en vez de mostrarlo.",
        "Escribe: ls -l > permisos.txt"
      ]
    }
  ];
})(this);
