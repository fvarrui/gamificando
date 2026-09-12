/* ==========================================================
   Contenido de las tareas (solo textos: sin lógica).
   La comprobación de cada una está en js/missions.js,
   emparejada por el código NTF-xx que se asigna por posición.
   ========================================================== */
(function (global) {
  "use strict";
  var PW = global.PW = global.PW || {};

  var NAYRA = "Nayra Suárez · Sistemas";
  var DIR = "Dirección";
  var CARLA = "Carla Ojeda · Proyectos";

  PW.MISSION_CONTENT = [
    /* ---------------- FASE 1 · RADIOGRAFÍA ---------------- */
    {
      phase: 0, severity: "high", source: NAYRA, xp: 75,
      title: "Mira qué hay en C:\\Datos",
      text: "La consultora que montó el servidor de archivos terminó ayer. Antes de tocar nada, quiero que veas la estructura de carpetas que dejaron.",
      objective: "Lista el contenido de C:\\Datos.",
      hints: [
        "El cmdlet que lista el contenido de una carpeta es Get-ChildItem (alias ls, dir).",
        "Ya estás dentro de C:\\Datos: puedes llamarlo sin parámetros.",
        "Escribe: Get-ChildItem"
      ]
    },
    {
      phase: 0, severity: "high", source: NAYRA, xp: 100,
      title: "¿Quién tiene permisos aquí?",
      text: "En Windows los permisos no son tres bloques como en Linux: son una lista de entradas (ACE), cada una con una identidad, unos derechos y si permite o deniega.",
      objective: "Muestra la lista de control de acceso de C:\\Datos en formato de lista.",
      hints: [
        "El cmdlet es Get-Acl. Devuelve un objeto con Owner y Access.",
        "Para verlo cómodamente, encadénalo con Format-List: Get-Acl <ruta> | Format-List",
        "Escribe: Get-Acl C:\\Datos | Format-List"
      ]
    },
    {
      phase: 0, severity: "high", source: NAYRA, xp: 100,
      title: "Lo mismo, con la herramienta clásica",
      text: "Get-Acl está muy bien para leer, pero para cambiar permisos casi todo el mundo usa icacls: es más corta y es la que verás en toda la documentación.",
      objective: "Muestra los permisos de C:\\Datos con icacls.",
      hints: [
        "icacls se usa sin parámetros para consultar: icacls <ruta>",
        "Verás abreviaturas: (F) control total, (M) modificar, (RX) leer y ejecutar, (R) leer, (W) escribir.",
        "Escribe: icacls C:\\Datos"
      ]
    },
    {
      phase: 0, severity: "warn", source: NAYRA, xp: 125,
      title: "La herencia lo reparte todo",
      text: "El «Todos: Control total» de la carpeta raíz no se queda ahí: baja a todo lo que hay dentro. Compruébalo en la carpeta que guarda las credenciales.",
      objective: "Muestra los permisos de C:\\Datos\\Privado con icacls y fíjate en la marca (I) de los permisos heredados.",
      hints: [
        "Es la misma orden, cambiando la ruta.",
        "La (I) delante de los derechos significa «heredado de la carpeta superior»: no está puesto ahí, viene de arriba.",
        "Escribe: icacls C:\\Datos\\Privado"
      ]
    },
    {
      phase: 0, severity: "high", source: NAYRA, xp: 100,
      title: "Y por eso esto es urgente",
      text: "Dentro de Privado hay un fichero con las credenciales del servicio. Ábrelo y entiende el problema: con la ACL actual, cualquier persona de la empresa puede hacer exactamente esto.",
      objective: "Muestra el contenido de C:\\Datos\\Privado\\credenciales.txt.",
      hints: [
        "El cmdlet que lee un archivo es Get-Content (alias cat, type).",
        "Fíjate en que no ha hecho falta ningún permiso especial: lo concede la ACE «Todos».",
        "Escribe: Get-Content C:\\Datos\\Privado\\credenciales.txt"
      ]
    },

    /* ---------------- FASE 2 · CONCEDER ---------------- */
    {
      phase: 1, severity: "high", source: NAYRA, xp: 150,
      title: "Fuera el «Todos»",
      text: "Primera decisión y la más importante: la identidad «Todos» con control total no pinta nada en una carpeta corporativa. Quítala de la raíz.",
      objective: "Elimina la entrada de la identidad Todos en C:\\Datos.",
      hints: [
        "La opción de icacls para quitar una identidad de la lista es /remove.",
        "Se escribe: icacls <ruta> /remove <identidad>. Al quitarla de la raíz, la herencia la retira también de lo que hay debajo.",
        "Escribe: icacls C:\\Datos /remove Todos"
      ]
    },
    {
      phase: 1, severity: "info", source: NAYRA, xp: 150,
      title: "Que la gente pueda llegar",
      text: "Si nadie tiene permisos, nadie entra: la carpeta raíz necesita un permiso mínimo para que el personal pueda atravesarla hasta la suya.",
      objective: "Concede al grupo Usuarios permiso de lectura y ejecución sobre C:\\Datos.",
      hints: [
        "La opción para conceder es /grant, con el formato identidad:(permisos).",
        "«Leer y ejecutar» se abrevia RX: icacls <ruta> /grant Usuarios:(RX)",
        "Escribe: icacls C:\\Datos /grant Usuarios:(RX)"
      ]
    },
    {
      phase: 1, severity: "info", source: CARLA, xp: 150,
      title: "El equipo de proyectos trabaja aquí",
      text: "Carla y su equipo tienen que crear, cambiar y borrar documentos en su carpeta. Eso no es control total: es «modificar».",
      objective: "Concede al grupo Proyectos permiso de modificación sobre C:\\Datos\\Proyectos.",
      hints: [
        "«Modificar» se abrevia M: incluye leer, escribir, cambiar y borrar, pero no cambiar permisos ni el propietario.",
        "Control total (F) permitiría además reasignar permisos: eso se queda para Administradores.",
        "Escribe: icacls C:\\Datos\\Proyectos /grant Proyectos:(M)"
      ]
    },
    {
      phase: 1, severity: "info", source: NAYRA, xp: 150,
      title: "Y ventas en la suya",
      text: "Lo mismo para el equipo comercial: su carpeta, sus permisos.",
      objective: "Concede al grupo Ventas permiso de modificación sobre C:\\Datos\\Ventas.",
      hints: [
        "Misma orden, cambiando la ruta y la identidad.",
        "Si te preguntas por qué se conceden a un grupo y no a cada persona: porque las altas y bajas cambian, y los grupos no.",
        "Escribe: icacls C:\\Datos\\Ventas /grant Ventas:(M)"
      ]
    },
    {
      phase: 1, severity: "info", source: DIR, xp: 150,
      title: "Dirección solo lee",
      text: "Las actas de dirección se firman fuera y aquí solo se consultan: no hace falta que nadie las modifique desde el recurso compartido.",
      objective: "Concede al grupo Direccion permiso de solo lectura sobre C:\\Datos\\Direccion.",
      hints: [
        "«Leer» se abrevia R. Si además tuvieran que abrir carpetas dentro, sería RX.",
        "Dar menos de lo necesario se arregla en un minuto; dar de más puede tardar años en descubrirse.",
        "Escribe: icacls C:\\Datos\\Direccion /grant Direccion:(R)"
      ]
    },

    /* ---------------- FASE 3 · HERENCIA ---------------- */
    {
      phase: 2, severity: "warn", source: NAYRA, xp: 125,
      title: "¿De dónde le vienen los permisos a Privado?",
      text: "Antes de romper nada, mira otra vez la carpeta de credenciales: todo lo que tiene lo hereda de C:\\Datos, así que cualquier permiso que concedas arriba baja hasta ahí.",
      objective: "Vuelve a mostrar los permisos de C:\\Datos\\Privado con icacls.",
      hints: [
        "Es la misma consulta de la primera fase.",
        "Ahora verás Usuarios con (I)(RX): lo que acabas de conceder arriba ya ha llegado abajo.",
        "Escribe: icacls C:\\Datos\\Privado"
      ]
    },
    {
      phase: 2, severity: "high", source: NAYRA, xp: 175,
      title: "Corta la herencia en Privado",
      text: "Esta carpeta no debe recibir nada de arriba. Rompe la herencia y elimina de paso los permisos heredados que tenía: queremos empezar de cero.",
      objective: "Deshabilita la herencia en C:\\Datos\\Privado eliminando los permisos heredados.",
      hints: [
        "La opción es /inheritance: con tres variantes: d deshabilita conservando lo heredado como propio, r deshabilita y lo elimina, e vuelve a habilitarla.",
        "Aquí queremos eliminarlos, así que es la variante r.",
        "Escribe: icacls C:\\Datos\\Privado /inheritance:r"
      ]
    },
    {
      phase: 2, severity: "high", source: NAYRA, xp: 150,
      title: "Y deja solo a quien debe entrar",
      text: "Con la herencia cortada, la carpeta se ha quedado sin permisos explícitos. Dale control total al grupo de administración, y a nadie más.",
      objective: "Concede al grupo Administradores control total sobre C:\\Datos\\Privado.",
      hints: [
        "«Control total» se abrevia F.",
        "Es el único sitio del reto donde el control total está justificado: quien administra tiene que poder gestionar la propia ACL.",
        "Escribe: icacls C:\\Datos\\Privado /grant Administradores:(F)"
      ]
    },
    {
      phase: 2, severity: "info", source: NAYRA, xp: 125,
      title: "Comprueba que ya no hereda",
      text: "Vuelve a mirar la carpeta: no debe quedar ni una sola entrada marcada como heredada.",
      objective: "Muestra los permisos de C:\\Datos\\Privado y comprueba que no aparece ninguna (I).",
      hints: [
        "Misma consulta que antes.",
        "Si la herencia se hubiera roto con /inheritance:d, las entradas seguirían ahí pero ya sin la (I).",
        "Escribe: icacls C:\\Datos\\Privado"
      ]
    },
    {
      phase: 2, severity: "warn", source: NAYRA, xp: 175,
      title: "La herencia rota donde no tocaba",
      text: "La consultora también rompió la herencia en la carpeta de Ventas «para probar», y ahí sigue con su «Todos» propio. Esa carpeta sí tiene que recibir los permisos de arriba.",
      objective: "Vuelve a habilitar la herencia en C:\\Datos\\Ventas.",
      hints: [
        "La variante de /inheritance que vuelve a habilitarla es e.",
        "Al habilitarla, las entradas de C:\\Datos bajan otra vez a la carpeta.",
        "Escribe: icacls C:\\Datos\\Ventas /inheritance:e"
      ]
    },
    {
      phase: 2, severity: "high", source: NAYRA, xp: 150,
      title: "Y el «Todos» que se quedó dentro",
      text: "Al restaurar la herencia no desaparece lo que estaba puesto a mano: la carpeta de Ventas conserva su propia entrada «Todos». Quítala.",
      objective: "Elimina la entrada de la identidad Todos en C:\\Datos\\Ventas.",
      hints: [
        "Es la misma opción que usaste en la raíz: /remove.",
        "Esta es la razón por la que una ACL hay que revisarla carpeta por carpeta: lo heredado y lo explícito conviven.",
        "Escribe: icacls C:\\Datos\\Ventas /remove Todos"
      ]
    },

    /* ---------------- FASE 4 · DENEGAR Y PROPIETARIO ---------------- */
    {
      phase: 3, severity: "warn", source: DIR, xp: 175,
      title: "Ventas no entra en Dirección",
      text: "Dirección pide algo concreto: que el equipo comercial no pueda ni leer sus actas. Como Ventas está dentro de Usuarios, y Usuarios lee desde arriba, no basta con no concederles nada.",
      objective: "Deniega explícitamente al grupo Ventas la lectura y ejecución de C:\\Datos\\Direccion.",
      hints: [
        "La opción de icacls para denegar es /deny, con el mismo formato identidad:(permisos).",
        "Una denegación explícita gana siempre a cualquier permiso concedido, venga de donde venga.",
        "Escribe: icacls C:\\Datos\\Direccion /deny Ventas:(RX)"
      ]
    },
    {
      phase: 3, severity: "info", source: DIR, xp: 125,
      title: "Comprueba la denegación",
      text: "Míralo en la lista: la denegación aparece marcada, y conviene saber leerla porque es la causa habitual de los «a mí no me deja y debería».",
      objective: "Muestra los permisos de C:\\Datos\\Direccion y localiza la entrada de denegación.",
      hints: [
        "Misma consulta de siempre.",
        "Usa las denegaciones con cuidado: son la excepción, no la herramienta habitual. Lo normal es simplemente no conceder.",
        "Escribe: icacls C:\\Datos\\Direccion"
      ]
    },
    {
      phase: 3, severity: "warn", source: CARLA, xp: 150,
      title: "El fichero de la compañera que se fue",
      text: "Lucía dejó la empresa el 30 de septiembre y su borrador del plan 2027 sigue siendo suyo. Mira quién figura como propietario.",
      objective: "Muestra la ACL de C:\\Datos\\Proyectos\\plan-2027.txt en formato de lista para ver su propietario.",
      hints: [
        "Get-Acl devuelve también la propiedad Owner.",
        "El propietario de un objeto siempre puede cambiar sus permisos, aunque la ACL se los niegue.",
        "Escribe: Get-Acl C:\\Datos\\Proyectos\\plan-2027.txt | Format-List"
      ]
    },
    {
      phase: 3, severity: "warn", source: NAYRA, xp: 175,
      title: "Toma posesión",
      text: "Con la cuenta de Lucía deshabilitada, nadie puede gestionar ese fichero. Para eso existe takeown: tomar posesión de algo cuyo propietario ya no está.",
      objective: "Toma posesión del fichero C:\\Datos\\Proyectos\\plan-2027.txt.",
      hints: [
        "La herramienta es takeown, y el parámetro del fichero es /F.",
        "Se escribe: takeown /F <ruta>. Requiere privilegios de administración.",
        "Escribe: takeown /F C:\\Datos\\Proyectos\\plan-2027.txt"
      ]
    },
    {
      phase: 3, severity: "info", source: NAYRA, xp: 150,
      title: "Que sea del grupo, no tuyo",
      text: "Que un fichero corporativo pertenezca a una persona concreta es un problema el día que esa persona se va. Pásaselo al grupo de administración.",
      objective: "Pon a Administradores como propietario de C:\\Datos\\Proyectos\\plan-2027.txt.",
      hints: [
        "icacls tiene la opción /setowner <identidad>.",
        "También vale takeown con /A, que asigna la propiedad al grupo Administradores en vez de a tu cuenta.",
        "Escribe: icacls C:\\Datos\\Proyectos\\plan-2027.txt /setowner Administradores"
      ]
    },

    /* ---------------- FASE 5 · COMPROBACIÓN ---------------- */
    {
      phase: 4, severity: "info", source: NAYRA, xp: 150,
      title: "Repasa la carpeta de proyectos",
      text: "Antes de cerrar el parte, revisa una carpeta completa con el cmdlet: quién tiene acceso, con qué derechos y si los hereda.",
      objective: "Muestra la ACL de C:\\Datos\\Proyectos en formato de lista.",
      hints: [
        "Get-Acl encadenado con Format-List, como en la primera fase.",
        "Comprueba que Proyectos tiene Modify propio y que Usuarios solo trae lo heredado.",
        "Escribe: Get-Acl C:\\Datos\\Proyectos | Format-List"
      ]
    },
    {
      phase: 4, severity: "info", source: NAYRA, xp: 150,
      title: "Deja constancia por escrito",
      text: "Un bastionado sin documentar se deshace solo: dentro de seis meses alguien «arreglará» los permisos porque no sabrá por qué están así.",
      objective: "Guarda la salida de icacls sobre C:\\Datos en el fichero C:\\Datos\\permisos.txt.",
      hints: [
        "La consola admite redirección con >, igual que en Linux.",
        "Se escribe: icacls C:\\Datos > C:\\Datos\\permisos.txt",
        "Escribe: icacls C:\\Datos > C:\\Datos\\permisos.txt"
      ]
    },
    {
      phase: 4, severity: "info", source: NAYRA, xp: 150,
      title: "Añade la conclusión",
      text: "Al informe le falta una línea que explique el criterio: quien lo lea dentro de un año tiene que entender por qué está así.",
      objective: "Añade al final de C:\\Datos\\permisos.txt una línea con la conclusión del bastionado.",
      hints: [
        "El cmdlet que añade al final sin borrar lo anterior es Add-Content.",
        "Se escribe: Add-Content -Path <ruta> -Value \"texto\"",
        "Escribe: Add-Content -Path C:\\Datos\\permisos.txt -Value \"Criterio: minimo privilegio por grupo; Privado sin herencia.\""
      ]
    },
    {
      phase: 4, severity: "info", source: NAYRA, xp: 175,
      title: "Última comprobación",
      text: "Cierre del parte: que en la raíz de la carpeta compartida no quede rastro de la identidad «Todos» ni de ningún control total que no sea el de administración.",
      objective: "Muestra por última vez los permisos de C:\\Datos con icacls y comprueba que no aparece Todos.",
      hints: [
        "La misma consulta con la que empezaste el reto.",
        "Comparar el antes y el después es la mejor forma de explicar un bastionado a quien no es técnico.",
        "Escribe: icacls C:\\Datos"
      ]
    }
  ];
})(this);
