/* ==========================================================
   Contenido de las tareas (solo textos: sin lógica).
   La comprobación de cada una está en js/missions.js,
   emparejada por el código USR-xx que se asigna por posición.
   ========================================================== */
(function (global) {
  "use strict";
  var UG = global.UG = global.UG || {};

  var WEAVER = "Sigourney Weaver · Sistemas";
  var RRHH = "Personas y Talento";
  var YEOH = "Michelle Yeoh · Proyectos";

  UG.MISSION_CONTENT = [
    /* ---------------- FASE 1 · QUIÉN HAY ---------------- */
    {
      phase: 0, severity: "info", source: WEAVER, xp: 75,
      title: "El parte de la semana",
      text: "Entran dos personas, se va otra y hay que limpiar una cuenta compartida que lleva años dando vueltas. Todo está en tu carpeta personal, en altas.txt.",
      objective: "Lee el fichero altas.txt de tu carpeta personal.",
      hints: [
        "Estás en /home/hamilton y el fichero está ahí mismo.",
        "La orden que vuelca un fichero de texto es cat.",
        "Escribe: cat altas.txt"
      ]
    },
    {
      phase: 0, severity: "info", source: WEAVER, xp: 100,
      title: "¿Qué cuentas hay en el sistema?",
      text: "Antes de crear nada, mira qué hay. El fichero /etc/passwd es la base, pero la forma correcta de consultarlo es con getent: así funciona igual si las cuentas vienen de un directorio remoto.",
      objective: "Muestra todas las cuentas de usuario del sistema.",
      hints: [
        "La orden es getent, y la base de datos de cuentas se llama passwd.",
        "Cada línea lleva: usuario, x, uid, gid, comentario, directorio personal y shell.",
        "Escribe: getent passwd"
      ]
    },
    {
      phase: 0, severity: "info", source: WEAVER, xp: 100,
      title: "¿Y los grupos?",
      text: "Los permisos se reparten por grupos, no por personas. Mira cuáles hay y quién está en cada uno.",
      objective: "Muestra todos los grupos del sistema con sus miembros.",
      hints: [
        "Misma orden, cambiando la base de datos: la de grupos se llama group.",
        "La última columna de cada línea son los miembros secundarios del grupo.",
        "Escribe: getent group"
      ]
    },
    {
      phase: 0, severity: "info", source: YEOH, xp: 100,
      title: "La ficha de Michelle",
      text: "Michelle pregunta en qué grupos está, porque no puede escribir en una carpeta compartida. Compruébalo.",
      objective: "Muestra el identificador y los grupos del usuario yeoh.",
      hints: [
        "La orden id acepta un nombre de usuario: id USUARIO.",
        "También puedes usar groups yeoh, que muestra solo los nombres.",
        "Escribe: id yeoh"
      ]
    },
    {
      phase: 0, severity: "warn", source: WEAVER, xp: 100,
      title: "La cuenta que usa todo el mundo",
      text: "Hay una cuenta llamada «visitas» que se creó para un curso hace años y que sigue ahí, con su carpeta abierta de par en par. Míralo antes de tocar nada.",
      objective: "Consulta la ficha de la cuenta visitas en la base de datos de usuarios.",
      hints: [
        "getent admite una clave detrás de la base de datos: getent passwd USUARIO.",
        "Una cuenta compartida es un problema de seguridad: si alguien hace algo, no hay forma de saber quién fue.",
        "Escribe: getent passwd visitas"
      ]
    },

    /* ---------------- FASE 2 · ALTAS ---------------- */
    {
      phase: 1, severity: "info", source: RRHH, xp: 125,
      title: "Un grupo para el plan de formación",
      text: "Este trimestre arranca el plan de formación interno y hará falta un grupo propio para dar acceso a sus materiales.",
      objective: "Crea el grupo formacion.",
      hints: [
        "La orden es groupadd seguida del nombre del grupo.",
        "Crear grupos requiere privilegios de administración: usa sudo.",
        "Escribe: sudo groupadd formacion"
      ]
    },
    {
      phase: 1, severity: "info", source: RRHH, xp: 150,
      title: "Alta de Carrie-Anne",
      text: "Carrie-Anne Moss entra en el equipo comercial. Necesita cuenta, directorio personal y un intérprete de órdenes normal, porque va a trabajar por consola.",
      objective: "Crea la cuenta moss con directorio personal, shell /bin/bash y el comentario «Carrie-Anne Moss».",
      hints: [
        "La orden es useradd. Por omisión NO crea el directorio personal: hay que pedirlo con -m.",
        "El intérprete se indica con -s y el comentario (nombre completo) con -c, entrecomillado si lleva espacios.",
        "Escribe: sudo useradd -m -s /bin/bash -c \"Carrie-Anne Moss\" moss"
      ]
    },
    {
      phase: 1, severity: "info", source: WEAVER, xp: 100,
      title: "Comprueba su carpeta",
      text: "Si te olvidas del -m, la cuenta existe pero no tiene dónde vivir y el primer inicio de sesión falla. Compruébalo.",
      objective: "Lista en formato largo el contenido de /home para ver el directorio personal de moss.",
      hints: [
        "Es un listado normal en formato largo sobre /home.",
        "Fíjate también en el dueño y el grupo de la carpeta: son de la propia usuaria.",
        "Escribe: ls -l /home"
      ]
    },
    {
      phase: 1, severity: "warn", source: WEAVER, xp: 125,
      title: "Ponle contraseña",
      text: "Una cuenta recién creada no tiene contraseña y no puede iniciar sesión. Asígnasela antes de que la reclame.",
      objective: "Establece la contraseña de la cuenta moss.",
      hints: [
        "La orden es passwd seguida del nombre de usuario.",
        "Cambiar la contraseña de otra persona requiere privilegios: usa sudo.",
        "Escribe: sudo passwd moss"
      ]
    },
    {
      phase: 1, severity: "info", source: RRHH, xp: 150,
      title: "Alta de Jackie, ya en su equipo",
      text: "Jackie Chan entra en proyectos. Esta vez hazlo de una sola vez: cuenta, carpeta, comentario y grupo secundario en la misma orden.",
      objective: "Crea la cuenta chan con directorio personal, comentario «Jackie Chan» y el grupo secundario proyectos.",
      hints: [
        "Los grupos secundarios se indican con -G, separados por comas si son varios.",
        "No confundas -g (grupo principal) con -G (grupos secundarios): es un error clásico.",
        "Escribe: sudo useradd -m -c \"Jackie Chan\" -G proyectos chan"
      ]
    },

    /* ---------------- FASE 3 · PERTENENCIAS ---------------- */
    {
      phase: 2, severity: "high", source: RRHH, xp: 175,
      title: "Carrie-Anne entra en ventas",
      text: "Se nos pasó: Carrie-Anne necesita estar en el grupo ventas. Mucho cuidado aquí, porque hay una forma de hacerlo que le quitaría todos los demás grupos.",
      objective: "Añade a moss al grupo secundario ventas sin sacarla de ningún otro.",
      hints: [
        "La orden es usermod con la opción -G para grupos secundarios.",
        "-G a secas SUSTITUYE la lista completa. Para añadir sin borrar hay que acompañarla de -a: usermod -aG.",
        "Escribe: sudo usermod -aG ventas moss"
      ]
    },
    {
      phase: 2, severity: "info", source: WEAVER, xp: 100,
      title: "Compruébalo",
      text: "Después de tocar grupos, siempre se comprueba. Es la forma de detectar al instante si te has llevado por delante una pertenencia.",
      objective: "Muestra los grupos de moss.",
      hints: [
        "id moss muestra el uid, el gid y todos sus grupos.",
        "También sirve groups moss.",
        "Escribe: id moss"
      ]
    },
    {
      phase: 2, severity: "info", source: RRHH, xp: 125,
      title: "Jackie, al plan de formación",
      text: "Jackie se apunta al plan de formación. Para mover gente entre grupos existe una orden más directa que usermod.",
      objective: "Añade a chan al grupo formacion usando gpasswd.",
      hints: [
        "gpasswd administra la pertenencia a un grupo: gpasswd -a USUARIO GRUPO.",
        "Ojo al orden de los argumentos: primero el usuario, después el grupo.",
        "Escribe: sudo gpasswd -a chan formacion"
      ]
    },
    {
      phase: 2, severity: "info", source: YEOH, xp: 125,
      title: "Jean-Claude sale del proyecto",
      text: "Jean-Claude deja de participar en el proyecto Atlante esta semana, antes incluso de su baja. Sácalo del grupo.",
      objective: "Quita a vandamme del grupo proyectos.",
      hints: [
        "La opción de gpasswd para quitar a alguien es -d.",
        "Se escribe igual que para añadir: gpasswd -d USUARIO GRUPO.",
        "Escribe: sudo gpasswd -d vandamme proyectos"
      ]
    },
    {
      phase: 2, severity: "info", source: YEOH, xp: 125,
      title: "¿Quién queda en proyectos?",
      text: "Confirma a Michelle quién sigue en el grupo después del cambio.",
      objective: "Muestra la entrada del grupo proyectos con sus miembros.",
      hints: [
        "getent acepta el nombre del grupo como clave: getent group GRUPO.",
        "Recuerda que el grupo PRINCIPAL de un usuario no aparece en esa lista de miembros: para eso está id.",
        "Escribe: getent group proyectos"
      ]
    },

    /* ---------------- FASE 4 · BAJAS Y BLOQUEOS ---------------- */
    {
      phase: 3, severity: "warn", source: WEAVER, xp: 125,
      title: "El estado de la cuenta de Jean-Claude",
      text: "Jean-Claude se va el viernes. Antes de decidir nada, mira en qué estado está su cuenta.",
      objective: "Consulta el estado de la cuenta vandamme.",
      hints: [
        "passwd tiene una opción para mostrar el estado: -S (mayúscula).",
        "La segunda columna dice P si tiene contraseña, L si está bloqueada y NP si no tiene ninguna.",
        "Escribe: sudo passwd -S vandamme"
      ]
    },
    {
      phase: 3, severity: "high", source: WEAVER, xp: 175,
      title: "Bloquear, no borrar",
      text: "La norma de la casa: cuando alguien se va, la cuenta se bloquea, no se borra. Sus ficheros pueden hacer falta, y borrar una cuenta deja huérfano todo lo suyo.",
      objective: "Bloquea la cuenta de vandamme para que no pueda iniciar sesión.",
      hints: [
        "usermod tiene la opción -L (lock) para bloquear una cuenta, y -U para desbloquearla.",
        "También vale passwd -l vandamme. Lo importante es que la cuenta siga existiendo.",
        "Escribe: sudo usermod -L vandamme"
      ]
    },
    {
      phase: 3, severity: "info", source: WEAVER, xp: 100,
      title: "Confirma el bloqueo",
      text: "Vuelve a mirar el estado: ahora la cuenta debe aparecer como bloqueada.",
      objective: "Consulta otra vez el estado de la cuenta vandamme y comprueba que aparece como L.",
      hints: [
        "Es la misma consulta de antes.",
        "Una cuenta bloqueada sigue siendo dueña de sus ficheros: por eso no se pierde nada.",
        "Escribe: sudo passwd -S vandamme"
      ]
    },
    {
      phase: 3, severity: "high", source: WEAVER, xp: 175,
      title: "Adiós a la cuenta compartida",
      text: "La cuenta «visitas» sí se elimina, y con su carpeta: es una cuenta genérica que usa medio mundo, con una contraseña que conoce todo el edificio.",
      objective: "Elimina la cuenta visitas junto con su directorio personal.",
      hints: [
        "La orden es userdel. Por omisión conserva el directorio personal.",
        "Para borrar también la carpeta hay que añadir la opción -r.",
        "Escribe: sudo userdel -r visitas"
      ]
    },
    {
      phase: 3, severity: "info", source: WEAVER, xp: 100,
      title: "Comprueba que no queda rastro",
      text: "Si borras la cuenta sin -r, la carpeta se queda ahí sin dueño: en el listado aparecería un número en vez de un nombre. Comprueba que no ha pasado.",
      objective: "Lista /home en formato largo y comprueba que la carpeta de visitas ya no está.",
      hints: [
        "Es el mismo listado que hiciste al dar de alta a Carrie-Anne.",
        "Compara: ahora deben estar moss y chan, y no debe estar visitas.",
        "Escribe: ls -l /home"
      ]
    },

    /* ---------------- FASE 5 · CUENTAS DE SERVICIO ---------------- */
    {
      phase: 4, severity: "warn", source: WEAVER, xp: 175,
      title: "Una cuenta para las copias",
      text: "El servicio de copias de seguridad necesita su propia identidad. Pero una cuenta de servicio no es una persona: nadie debe poder iniciar sesión con ella.",
      objective: "Crea la cuenta de sistema svc-backup sin directorio personal y con el intérprete /usr/sbin/nologin.",
      hints: [
        "useradd tiene -r para cuentas de sistema (uid bajo) y -s para el intérprete.",
        "El intérprete /usr/sbin/nologin rechaza cualquier inicio de sesión: es lo que convierte una cuenta en «de servicio».",
        "Escribe: sudo useradd -r -s /usr/sbin/nologin svc-backup"
      ]
    },
    {
      phase: 4, severity: "info", source: WEAVER, xp: 125,
      title: "Comprueba que no puede entrar",
      text: "Mira su ficha: el último campo es el intérprete, y ahí está la diferencia entre una cuenta de persona y una de servicio.",
      objective: "Consulta la ficha de la cuenta svc-backup.",
      hints: [
        "getent passwd acepta el nombre de la cuenta como clave.",
        "Si el último campo es /usr/sbin/nologin o /bin/false, esa cuenta no inicia sesión.",
        "Escribe: getent passwd svc-backup"
      ]
    },
    {
      phase: 4, severity: "warn", source: WEAVER, xp: 150,
      title: "Y remata la baja",
      text: "A la cuenta bloqueada de Jean-Claude le falta un detalle: aunque no pueda autenticarse con contraseña, conviene quitarle también el intérprete de órdenes.",
      objective: "Cambia el intérprete de la cuenta vandamme a /usr/sbin/nologin.",
      hints: [
        "usermod con la opción -s cambia el intérprete de una cuenta existente.",
        "Defensa en profundidad: bloquear la contraseña y quitar la shell son dos barreras distintas.",
        "Escribe: sudo usermod -s /usr/sbin/nologin vandamme"
      ]
    },
    {
      phase: 4, severity: "info", source: RRHH, xp: 125,
      title: "El grupo de formación, cerrado",
      text: "Personas y Talento quiere confirmar quién ha quedado apuntado al plan de formación.",
      objective: "Muestra la entrada del grupo formacion con sus miembros.",
      hints: [
        "getent group acepta el nombre del grupo.",
        "Debe aparecer chan entre sus miembros.",
        "Escribe: getent group formacion"
      ]
    },
    {
      phase: 4, severity: "info", source: WEAVER, xp: 150,
      title: "Deja el listado por escrito",
      text: "Última tarea: guarda el listado de cuentas del sistema para adjuntarlo al parte de la semana.",
      objective: "Guarda la salida de getent passwd en el fichero /home/hamilton/cuentas.txt.",
      hints: [
        "Puedes redirigir la salida de cualquier orden a un fichero con >.",
        "El fichero se crea aunque no exista, y si existía se sobrescribe. Compruébalo después con cat.",
        "Escribe: getent passwd > cuentas.txt"
      ]
    }
  ];
})(this);
