/* ==========================================================
   Contenido de las tareas (solo textos: sin lógica).
   La comprobación de cada una está en js/missions.js,
   emparejada por el código SVC-xx que se asigna por posición.
   ========================================================== */
(function (global) {
  "use strict";
  var SL = global.SL = global.SL || {};

  var GUARDIA = "Centro de guardia";
  var WEAVER = "Sigourney Weaver · Sistemas";
  var DIR = "Dirección";

  SL.MISSION_CONTENT = [
    /* ---------------- FASE 1 · DIAGNÓSTICO ---------------- */
    {
      phase: 0, severity: "high", source: GUARDIA, xp: 75,
      title: "El parte de la noche",
      text: "Son las 3:12 de la madrugada. La intranet no responde y te acaban de despertar. Empieza por leer lo que te han dejado apuntado.",
      objective: "Lee el fichero guardia.txt de tu carpeta personal.",
      hints: [
        "Estás en /home/hamilton y el fichero está ahí mismo.",
        "La orden que vuelca un fichero de texto es cat.",
        "Escribe: cat guardia.txt"
      ]
    },
    {
      phase: 0, severity: "high", source: GUARDIA, xp: 100,
      title: "¿Qué le pasa a la intranet?",
      text: "La intranet la sirve nginx. Lo primero, siempre, es preguntarle a systemd en qué estado está esa unidad.",
      objective: "Muestra el estado del servicio nginx.",
      hints: [
        "La orden que gobierna los servicios es systemctl, y la consulta de estado es status.",
        "Se escribe: systemctl status <servicio>. No hace falta sudo para consultar.",
        "Escribe: systemctl status nginx"
      ]
    },
    {
      phase: 0, severity: "warn", source: GUARDIA, xp: 125,
      title: "El porqué está en el registro",
      text: "El status te dice QUE ha fallado. Para saber POR QUÉ hay que leer el registro de esa unidad: ahí está la línea que lo explica todo.",
      objective: "Consulta el registro del servicio nginx.",
      hints: [
        "La orden que lee el registro de systemd es journalctl.",
        "Para filtrar por unidad se usa -u: journalctl -u <servicio>",
        "Escribe: journalctl -u nginx"
      ]
    },
    {
      phase: 0, severity: "info", source: GUARDIA, xp: 100,
      title: "¿Qué más hay corriendo?",
      text: "El registro dice que el puerto 80 ya está ocupado. Así que alguien más lo está usando. Mira la lista completa de servicios activos.",
      objective: "Lista las unidades de servicio cargadas en el sistema.",
      hints: [
        "systemctl sin argumentos, o con list-units, muestra las unidades cargadas.",
        "Con --type=service te quedas solo con los servicios; con --all se ven también los detenidos.",
        "Escribe: systemctl list-units --type=service"
      ]
    },
    {
      phase: 0, severity: "info", source: GUARDIA, xp: 100,
      title: "Y los procesos, por si acaso",
      text: "Una comprobación cruzada nunca sobra: mira los procesos en ejecución y localiza el que está escuchando en el puerto de la web.",
      objective: "Muestra los procesos en ejecución del sistema.",
      hints: [
        "La orden clásica es ps, y la combinación más usada es ps aux.",
        "Puedes filtrarla con una tubería: ps aux | grep apache",
        "Escribe: ps aux"
      ]
    },

    /* ---------------- FASE 2 · EL CONFLICTO ---------------- */
    {
      phase: 1, severity: "high", source: WEAVER, xp: 125,
      title: "Ahí está el culpable",
      text: "Apache está corriendo en este servidor. Se instaló hace meses «para una prueba» y nadie lo quitó. Mira su estado antes de tocarlo.",
      objective: "Muestra el estado del servicio apache2.",
      hints: [
        "La misma consulta que hiciste con nginx, cambiando el nombre.",
        "Fíjate en dos cosas distintas: si está «active» y si está «enabled».",
        "Escribe: systemctl status apache2"
      ]
    },
    {
      phase: 1, severity: "high", source: WEAVER, xp: 150,
      title: "Libera el puerto",
      text: "Para que nginx pueda escuchar en el 80, Apache tiene que soltarlo. Deténlo ahora mismo.",
      objective: "Detén el servicio apache2.",
      hints: [
        "El subcomando es stop: systemctl stop <servicio>.",
        "Gestionar servicios sí requiere privilegios: usa sudo.",
        "Escribe: sudo systemctl stop apache2"
      ]
    },
    {
      phase: 1, severity: "high", source: WEAVER, xp: 150,
      title: "Y que no vuelva en el próximo reinicio",
      text: "Detenerlo no basta: Apache está habilitado, así que volverá a arrancar solo la próxima vez que se reinicie el servidor, y volveremos a estar igual.",
      objective: "Deshabilita el arranque automático del servicio apache2.",
      hints: [
        "El subcomando es disable: systemctl disable <servicio>.",
        "Ojo: disable NO detiene el servicio; solo evita que arranque al iniciar el sistema. Son dos cosas distintas.",
        "Escribe: sudo systemctl disable apache2"
      ]
    },
    {
      phase: 1, severity: "high", source: GUARDIA, xp: 175,
      title: "Ahora sí: arranca la intranet",
      text: "Con el puerto libre, nginx debería levantar sin problema. Es el momento de la verdad.",
      objective: "Arranca el servicio nginx.",
      hints: [
        "El subcomando es start: systemctl start <servicio>.",
        "Si vuelve a fallar, es que el puerto sigue ocupado: comprueba que apache2 está realmente detenido.",
        "Escribe: sudo systemctl start nginx"
      ]
    },
    {
      phase: 1, severity: "info", source: GUARDIA, xp: 100,
      title: "Confírmalo",
      text: "Nunca des por hecho que ha funcionado: compruébalo y anota la hora en el parte.",
      objective: "Muestra otra vez el estado de nginx y comprueba que está activo.",
      hints: [
        "La misma consulta de estado de la primera fase.",
        "Debe aparecer «active (running)» y un Main PID.",
        "Escribe: systemctl status nginx"
      ]
    },

    /* ---------------- FASE 3 · ARRANQUE ---------------- */
    {
      phase: 2, severity: "warn", source: WEAVER, xp: 125,
      title: "¿Arrancará solo mañana?",
      text: "Aquí está la confusión más frecuente de todas: «activo» es el estado de AHORA; «habilitado» es si arrancará solo la próxima vez. Pregúntaselo a systemd.",
      objective: "Comprueba si el servicio nginx está habilitado para arrancar con el sistema.",
      hints: [
        "El subcomando responde con una sola palabra: is-enabled.",
        "Existe el equivalente para el estado actual: is-active.",
        "Escribe: systemctl is-enabled nginx"
      ]
    },
    {
      phase: 2, severity: "high", source: WEAVER, xp: 175,
      title: "Que arranque solo",
      text: "Está en «disabled»: si el servidor se reinicia esta madrugada, la intranet se queda caída otra vez y nadie lo sabrá hasta las ocho.",
      objective: "Habilita el arranque automático del servicio nginx.",
      hints: [
        "El subcomando es enable: systemctl enable <servicio>.",
        "Crea un enlace simbólico en multi-user.target.wants: eso es literalmente «habilitar» en systemd.",
        "Escribe: sudo systemctl enable nginx"
      ]
    },
    {
      phase: 2, severity: "info", source: WEAVER, xp: 100,
      title: "Compruébalo",
      text: "Confirma que ahora sí arrancará solo.",
      objective: "Vuelve a comprobar si nginx está habilitado y verifica que responde «enabled».",
      hints: [
        "Es la misma consulta de hace dos tareas.",
        "Un servicio puede estar habilitado y detenido, o deshabilitado y corriendo: son dos ejes independientes.",
        "Escribe: systemctl is-enabled nginx"
      ]
    },
    {
      phase: 2, severity: "warn", source: WEAVER, xp: 175,
      title: "El escudo contra la fuerza bruta",
      text: "Con los intentos de acceso que llevamos, fail2ban debería estar corriendo. Está parado y deshabilitado: arráncalo y habilítalo en una sola orden.",
      objective: "Habilita e inicia el servicio fail2ban con una sola orden.",
      hints: [
        "enable acepta un modificador que además lo arranca en ese momento: --now.",
        "Se escribe: systemctl enable --now <servicio>. Su contrario es disable --now.",
        "Escribe: sudo systemctl enable --now fail2ban"
      ]
    },
    {
      phase: 2, severity: "info", source: WEAVER, xp: 100,
      title: "Confirma el escudo",
      text: "Comprueba que fail2ban está efectivamente activo.",
      objective: "Comprueba que el servicio fail2ban está activo ahora mismo.",
      hints: [
        "El subcomando que responde por el estado actual es is-active.",
        "Debe responder «active».",
        "Escribe: systemctl is-active fail2ban"
      ]
    },

    /* ---------------- FASE 4 · SUPERFICIE ---------------- */
    {
      phase: 3, severity: "warn", source: DIR, xp: 150,
      title: "¿Qué hace un servicio de impresión aquí?",
      text: "Dirección pide reducir la superficie expuesta del servidor. En la lista hay un CUPS corriendo, y aquí no hay ni una impresora. Mira su estado.",
      objective: "Muestra el estado del servicio cups.",
      hints: [
        "La misma consulta de estado, cambiando el nombre del servicio.",
        "Cada servicio que corre sin necesidad es un puerto abierto y una vulnerabilidad potencial más.",
        "Escribe: systemctl status cups"
      ]
    },
    {
      phase: 3, severity: "high", source: DIR, xp: 175,
      title: "Fuera el servicio de impresión",
      text: "Detenlo y deshabilítalo de una sola vez: no queremos que vuelva en el próximo reinicio.",
      objective: "Detén y deshabilita el servicio cups con una sola orden.",
      hints: [
        "Es el contrario de lo que hiciste con fail2ban: disable con el modificador --now.",
        "Se escribe: systemctl disable --now <servicio>.",
        "Escribe: sudo systemctl disable --now cups"
      ]
    },
    {
      phase: 3, severity: "info", source: DIR, xp: 125,
      title: "Comprueba que ya no está",
      text: "Vuelve a listar los servicios activos: cups y apache2 no deben aparecer, y la base de datos y el SSH sí.",
      objective: "Lista otra vez las unidades de servicio activas.",
      hints: [
        "La misma lista de la primera fase.",
        "Sin --all solo se ven las unidades activas: justo lo que necesitas para comprobarlo de un vistazo.",
        "Escribe: systemctl list-units --type=service"
      ]
    },
    {
      phase: 3, severity: "warn", source: WEAVER, xp: 150,
      title: "La base de datos, tras el susto",
      text: "La intranet volvió a arrancar, pero conviene reiniciar la base de datos para que suelte las conexiones que quedaron colgadas durante la caída.",
      objective: "Reinicia el servicio mariadb.",
      hints: [
        "El subcomando que lo detiene y lo vuelve a arrancar es restart.",
        "Cuidado: mariadb es un servicio que la empresa necesita. Reiniciarlo es correcto; detenerlo y dejarlo parado, no.",
        "Escribe: sudo systemctl restart mariadb"
      ]
    },
    {
      phase: 3, severity: "info", source: WEAVER, xp: 125,
      title: "Y el registro, por si acaso",
      text: "Última revisión de registros antes de cerrar: mira las últimas líneas del registro de la intranet para confirmar que no ha vuelto a quejarse.",
      objective: "Muestra las últimas 5 líneas del registro del servicio nginx.",
      hints: [
        "journalctl admite limitar el número de líneas con -n.",
        "Se escribe: journalctl -u <servicio> -n 5",
        "Escribe: journalctl -u nginx -n 5"
      ]
    },

    /* ---------------- FASE 5 · CIERRE ---------------- */
    {
      phase: 4, severity: "info", source: GUARDIA, xp: 125,
      title: "El acceso remoto, intacto",
      text: "Antes de colgar: confirma que el SSH sigue activo. Si por un descuido lo hubieras tocado, te quedarías fuera del servidor a las tres de la mañana.",
      objective: "Comprueba que el servicio ssh está activo.",
      hints: [
        "El subcomando que responde por el estado actual es is-active.",
        "Detener el SSH en un servidor remoto es la forma más rápida de convertir una incidencia en un viaje al centro de datos.",
        "Escribe: systemctl is-active ssh"
      ]
    },
    {
      phase: 4, severity: "info", source: GUARDIA, xp: 150,
      title: "Repasa lo que arrancará solo",
      text: "El repaso que de verdad importa: qué unidades quedan habilitadas. Eso es lo que decidirá cómo despierta el servidor el día que se reinicie.",
      objective: "Comprueba que apache2 ha quedado deshabilitado.",
      hints: [
        "El subcomando is-enabled también sirve para confirmar lo contrario.",
        "Debe responder «disabled».",
        "Escribe: systemctl is-enabled apache2"
      ]
    },
    {
      phase: 4, severity: "info", source: GUARDIA, xp: 150,
      title: "Guarda el estado final",
      text: "Para el parte hace falta el listado de servicios tal y como queda el sistema al cerrar la guardia.",
      objective: "Guarda el listado de unidades de servicio en el fichero /home/hamilton/estado-final.txt.",
      hints: [
        "Puedes redirigir la salida de cualquier orden a un fichero con >.",
        "Se escribe: systemctl list-units --type=service > estado-final.txt",
        "Escribe: systemctl list-units --type=service > estado-final.txt"
      ]
    },
    {
      phase: 4, severity: "info", source: GUARDIA, xp: 150,
      title: "Cierra el parte",
      text: "Y lo último: añade al parte de guardia la línea que explica la causa y la solución. Quien lea esto mañana tiene que entender qué pasó sin llamarte.",
      objective: "Añade al final de guardia.txt una línea explicando la causa del incidente.",
      hints: [
        "El operador que añade al final de un fichero sin borrar lo anterior son dos símbolos de mayor que: >>.",
        "También puedes editarlo con nano guardia.txt.",
        "Escribe: echo \"03:40 Causa: apache2 ocupaba el puerto 80. Detenido y deshabilitado; nginx arrancado y habilitado.\" >> guardia.txt"
      ]
    }
  ];
})(this);
