/* ==========================================================
   Contenido de las tareas (solo textos: sin lógica).
   La comprobación de cada una está en js/missions.js,
   emparejada por el código CTA-xx que se asigna por posición.
   ========================================================== */
(function (global) {
  "use strict";
  var UW = global.UW = global.UW || {};

  var NAYRA = "Nayra Suárez · Sistemas";
  var RRHH = "Personas y Talento";
  var CARLA = "Carla Ojeda · Proyectos";

  UW.MISSION_CONTENT = [
    /* ---------------- FASE 1 · QUIÉN HAY ---------------- */
    {
      phase: 0, severity: "info", source: NAYRA, xp: 75,
      title: "El parte de la semana",
      text: "Dos altas, una baja y limpieza de cuentas viejas. Tienes el parte completo en tu carpeta personal.",
      objective: "Lee el archivo altas.txt de tu carpeta personal.",
      hints: [
        "Estás en C:\\Users\\ana y el archivo está ahí mismo.",
        "El cmdlet que lee un archivo de texto es Get-Content (alias cat, type).",
        "Escribe: Get-Content altas.txt"
      ]
    },
    {
      phase: 0, severity: "info", source: NAYRA, xp: 100,
      title: "¿Qué cuentas hay en el equipo?",
      text: "Este servidor no está en dominio: todas sus cuentas son locales. Mira cuáles hay antes de crear nada.",
      objective: "Lista todas las cuentas de usuario locales del equipo.",
      hints: [
        "Verbo Get y el sustantivo son las cuentas locales: LocalUser.",
        "Devuelve objetos con Name, Enabled y Description.",
        "Escribe: Get-LocalUser"
      ]
    },
    {
      phase: 0, severity: "info", source: NAYRA, xp: 100,
      title: "¿Y los grupos?",
      text: "En Windows los permisos también se reparten por grupos. Hay grupos integrados (Administradores, Usuarios) y los que crea la empresa.",
      objective: "Lista todos los grupos locales del equipo.",
      hints: [
        "Mismo verbo, cambiando el sustantivo: LocalGroup.",
        "Fíjate en la descripción de cada uno: ahí se ve para qué se creó.",
        "Escribe: Get-LocalGroup"
      ]
    },
    {
      phase: 0, severity: "warn", source: NAYRA, xp: 125,
      title: "¿Quién es administrador aquí?",
      text: "La primera pregunta de cualquier auditoría: quién tiene control total del equipo. Debería ser una lista muy corta.",
      objective: "Muestra los miembros del grupo local Administradores.",
      hints: [
        "El cmdlet es Get-LocalGroupMember y el parámetro del grupo es -Group.",
        "Se escribe: Get-LocalGroupMember -Group <grupo>",
        "Escribe: Get-LocalGroupMember -Group Administradores"
      ]
    },
    {
      phase: 0, severity: "warn", source: NAYRA, xp: 125,
      title: "Cuentas olvidadas",
      text: "Aquí es donde la tubería de objetos se gana el sueldo: en vez de mirar la lista a ojo, pídele a la consola las cuentas que están deshabilitadas.",
      objective: "Lista solo las cuentas locales que estén deshabilitadas.",
      hints: [
        "Get-LocalUser devuelve objetos con la propiedad Enabled, que vale True o False.",
        "Fíltralos con Where-Object y el operador -eq, usando el literal $false.",
        "Escribe: Get-LocalUser | Where-Object Enabled -eq $false"
      ]
    },

    /* ---------------- FASE 2 · ALTAS ---------------- */
    {
      phase: 1, severity: "info", source: RRHH, xp: 125,
      title: "Un grupo para el plan de formación",
      text: "Arranca el plan de formación interno y hará falta un grupo local propio para dar acceso a sus materiales.",
      objective: "Crea el grupo local Formacion con una descripción.",
      hints: [
        "El verbo para crear es New: New-LocalGroup.",
        "Tiene los parámetros -Name y -Description.",
        "Escribe: New-LocalGroup -Name Formacion -Description \"Plan de formacion interno\""
      ]
    },
    {
      phase: 1, severity: "info", source: RRHH, xp: 150,
      title: "Alta de Elena",
      text: "Elena Quintana entra en el equipo comercial. Crea su cuenta con su nombre completo y su descripción.",
      objective: "Crea la cuenta local elena, sin contraseña inicial, con la descripción «Ventas».",
      hints: [
        "El cmdlet es New-LocalUser. Hay que indicar contraseña o declarar que no la tendrá.",
        "Aquí usamos -NoPassword. En un equipo real, -Password recibe un SecureString, no texto plano: se construye con ConvertTo-SecureString.",
        "Escribe: New-LocalUser -Name elena -NoPassword -Description \"Ventas\""
      ]
    },
    {
      phase: 1, severity: "info", source: NAYRA, xp: 100,
      title: "Comprueba la cuenta",
      text: "Después de crear una cuenta, míralo: nombre correcto, habilitada y con su descripción.",
      objective: "Muestra la ficha de la cuenta elena.",
      hints: [
        "Get-LocalUser acepta el nombre de la cuenta como primer parámetro.",
        "Si quieres verlo todo en vertical, encadénalo con Format-List.",
        "Escribe: Get-LocalUser elena"
      ]
    },
    {
      phase: 1, severity: "info", source: RRHH, xp: 150,
      title: "Alta de Hugo",
      text: "Hugo Santana entra en proyectos. Crea su cuenta igual que la anterior.",
      objective: "Crea la cuenta local hugo, sin contraseña inicial, con la descripción «Proyectos».",
      hints: [
        "Misma orden que con Elena, cambiando el nombre y la descripción.",
        "A diferencia de Linux, aquí la cuenta ya nace con su perfil pendiente de crearse en el primer inicio de sesión.",
        "Escribe: New-LocalUser -Name hugo -NoPassword -Description \"Proyectos\""
      ]
    },
    {
      phase: 1, severity: "info", source: CARLA, xp: 150,
      title: "Y a su equipo",
      text: "Una cuenta recién creada solo está en Usuarios: hay que meterla en el grupo de su departamento para que herede sus permisos.",
      objective: "Añade a hugo al grupo local Proyectos.",
      hints: [
        "El cmdlet es Add-LocalGroupMember, con los parámetros -Group y -Member.",
        "Se escribe: Add-LocalGroupMember -Group <grupo> -Member <cuenta>",
        "Escribe: Add-LocalGroupMember -Group Proyectos -Member hugo"
      ]
    },

    /* ---------------- FASE 3 · PERTENENCIAS ---------------- */
    {
      phase: 2, severity: "info", source: RRHH, xp: 125,
      title: "Elena, al equipo comercial",
      text: "Lo mismo para Elena: su carpeta departamental cuelga de los permisos del grupo Ventas.",
      objective: "Añade a elena al grupo local Ventas.",
      hints: [
        "Es el mismo cmdlet de la tarea anterior.",
        "A diferencia de usermod en Linux, aquí añadir a un grupo nunca saca a la persona de los demás.",
        "Escribe: Add-LocalGroupMember -Group Ventas -Member elena"
      ]
    },
    {
      phase: 2, severity: "info", source: NAYRA, xp: 100,
      title: "Compruébalo",
      text: "Después de tocar grupos, siempre se comprueba: es la forma de detectar al instante un error de dedo.",
      objective: "Muestra los miembros del grupo local Ventas.",
      hints: [
        "Get-LocalGroupMember con el parámetro -Group.",
        "Deben aparecer bruno y elena.",
        "Escribe: Get-LocalGroupMember -Group Ventas"
      ]
    },
    {
      phase: 2, severity: "info", source: RRHH, xp: 125,
      title: "Hugo, al plan de formación",
      text: "Hugo se apunta al plan de formación de este trimestre.",
      objective: "Añade a hugo al grupo local Formacion.",
      hints: [
        "Mismo cmdlet, cambiando el grupo.",
        "Una persona puede estar en tantos grupos como haga falta: los permisos se suman.",
        "Escribe: Add-LocalGroupMember -Group Formacion -Member hugo"
      ]
    },
    {
      phase: 2, severity: "info", source: CARLA, xp: 150,
      title: "Darío sale del proyecto",
      text: "Darío deja de participar en el proyecto Atlante antes incluso de su baja. Sácalo del grupo, pero no toques su cuenta todavía.",
      objective: "Quita a dario del grupo local Proyectos.",
      hints: [
        "El verbo para quitar es Remove: Remove-LocalGroupMember.",
        "Usa los mismos parámetros: -Group y -Member.",
        "Escribe: Remove-LocalGroupMember -Group Proyectos -Member dario"
      ]
    },
    {
      phase: 2, severity: "info", source: CARLA, xp: 100,
      title: "¿Quién queda en el proyecto?",
      text: "Confirma a Carla quién sigue en el grupo después del cambio.",
      objective: "Muestra los miembros del grupo local Proyectos.",
      hints: [
        "La misma consulta de antes, cambiando el grupo.",
        "Deben quedar carla y hugo.",
        "Escribe: Get-LocalGroupMember -Group Proyectos"
      ]
    },

    /* ---------------- FASE 4 · BAJAS ---------------- */
    {
      phase: 3, severity: "warn", source: NAYRA, xp: 125,
      title: "La ficha de Darío",
      text: "Darío se va el viernes. Antes de decidir nada, mira el estado de su cuenta.",
      objective: "Muestra la ficha de la cuenta dario.",
      hints: [
        "Get-LocalUser con el nombre de la cuenta.",
        "Fíjate en la columna Enabled: ahora mismo está en True.",
        "Escribe: Get-LocalUser dario"
      ]
    },
    {
      phase: 3, severity: "high", source: NAYRA, xp: 175,
      title: "Deshabilitar, no eliminar",
      text: "La norma de la casa: cuando alguien se va, la cuenta se deshabilita. Sus archivos y sus permisos siguen atados a su identificador de seguridad, y si eliminas la cuenta ese identificador no vuelve.",
      objective: "Deshabilita la cuenta de dario.",
      hints: [
        "El verbo es Disable: Disable-LocalUser.",
        "El cmdlet contrario es Enable-LocalUser, por si hubiera que reactivarla.",
        "Escribe: Disable-LocalUser -Name dario"
      ]
    },
    {
      phase: 3, severity: "info", source: NAYRA, xp: 100,
      title: "Confirma el estado",
      text: "Vuelve a mirar su ficha: Enabled debe estar ahora en False.",
      objective: "Muestra otra vez la ficha de la cuenta dario y comprueba que está deshabilitada.",
      hints: [
        "Es la misma consulta de antes.",
        "Una cuenta deshabilitada no puede iniciar sesión, pero conserva su SID, sus permisos y sus archivos.",
        "Escribe: Get-LocalUser dario"
      ]
    },
    {
      phase: 3, severity: "high", source: NAYRA, xp: 175,
      title: "La cuenta compartida del curso",
      text: "La cuenta «temporal» se creó para un curso en 2023 y la sigue usando quien pasa por la oficina. Esa sí se elimina: una cuenta compartida hace imposible saber quién hizo qué.",
      objective: "Elimina la cuenta local temporal.",
      hints: [
        "El verbo es Remove: Remove-LocalUser.",
        "Se escribe: Remove-LocalUser -Name <cuenta>. Su carpeta de perfil en C:\\Users no se borra sola.",
        "Escribe: Remove-LocalUser -Name temporal"
      ]
    },
    {
      phase: 3, severity: "info", source: NAYRA, xp: 125,
      title: "Y su perfil, que sigue ahí",
      text: "Eliminar la cuenta no borra su carpeta de perfil: queda ocupando espacio y con datos dentro. Quítala tú.",
      objective: "Elimina la carpeta C:\\Users\\temporal con todo su contenido.",
      hints: [
        "El cmdlet para borrar es Remove-Item.",
        "Una carpeta con contenido exige el parámetro -Recurse.",
        "Escribe: Remove-Item C:\\Users\\temporal -Recurse"
      ]
    },

    /* ---------------- FASE 5 · AUDITORÍA ---------------- */
    {
      phase: 4, severity: "info", source: NAYRA, xp: 125,
      title: "La herramienta de siempre",
      text: "Antes de los cmdlets estaba net, y sigue en todos los Windows. Conviene reconocerla porque aparece en media documentación y en muchos scripts antiguos.",
      objective: "Lista las cuentas del equipo con la herramienta clásica net.",
      hints: [
        "La orden es net user, sin más argumentos.",
        "Hace lo mismo que Get-LocalUser, pero devuelve texto en vez de objetos: por eso no se puede filtrar con Where-Object.",
        "Escribe: net user"
      ]
    },
    {
      phase: 4, severity: "info", source: NAYRA, xp: 125,
      title: "Y los administradores, a la vieja usanza",
      text: "Lo mismo con los grupos: net localgroup enseña los miembros de un grupo local.",
      objective: "Muestra los miembros del grupo Administradores con la herramienta net.",
      hints: [
        "La orden es net localgroup seguida del nombre del grupo.",
        "Si el nombre llevara espacios, habría que entrecomillarlo.",
        "Escribe: net localgroup Administradores"
      ]
    },
    {
      phase: 4, severity: "info", source: RRHH, xp: 125,
      title: "Corrige la ficha de Elena",
      text: "Personas y Talento avisa: la descripción de Elena tiene que incluir su sede, que trabaja desde Las Palmas.",
      objective: "Cambia la descripción de la cuenta elena a «Ventas · Las Palmas».",
      hints: [
        "El verbo para modificar es Set: Set-LocalUser.",
        "Usa -Name para indicar la cuenta y -Description para el texto nuevo.",
        "Escribe: Set-LocalUser -Name elena -Description \"Ventas · Las Palmas\""
      ]
    },
    {
      phase: 4, severity: "warn", source: NAYRA, xp: 175,
      title: "Revisión de cuentas inactivas",
      text: "Cierre de la auditoría: quiero la lista de cuentas deshabilitadas con su descripción, para decidir cuáles se eliminan el mes que viene.",
      objective: "Lista las cuentas deshabilitadas mostrando solo su nombre y su descripción.",
      hints: [
        "Encadena tres cmdlets: obtener, filtrar por Enabled y quedarte con dos propiedades.",
        "Select-Object acepta una lista de propiedades separadas por comas: Name,Description.",
        "Escribe: Get-LocalUser | Where-Object Enabled -eq $false | Select-Object Name,Description"
      ]
    },
    {
      phase: 4, severity: "info", source: NAYRA, xp: 150,
      title: "Deja el listado por escrito",
      text: "Última tarea: guarda el listado de cuentas para adjuntarlo al parte de la semana.",
      objective: "Guarda en C:\\Users\\ana\\cuentas.txt el listado de cuentas con su nombre y su estado.",
      hints: [
        "La consola admite redirección con >, igual que en Linux.",
        "Encadena Get-LocalUser con Format-Table Name,Enabled y redirige el resultado.",
        "Escribe: Get-LocalUser | Format-Table Name,Enabled > cuentas.txt"
      ]
    }
  ];
})(this);
