/* ==========================================================
   Escenario: el equipo de prácticas del CPD de Windows.
   Cuentas, grupos y árbol de carpetas inicial.
   ========================================================== */
(function (global) {
  "use strict";
  var PS = global.PS = global.PS || {};

  PS.cfg = {
    HOST: "WS-PRACTICAS",
    USER: "practicas",
    DRIVE: "C:",
    HOME: "C:\\Users\\practicas",
    CWD: "C:\\Users\\practicas",
    TEAM: "Iker Alonso (administrador de sistemas)",
    TERM_TITLE: "Windows PowerShell",
    CLOCK_BASE: new Date(2026, 8, 15, 9, 10, 0),   // mar 15 sep 2026, 09:10
    /* Permisos de la raíz de C: que heredan las carpetas de debajo */
    ROOT_ACES: [
      { identity: "Administradores", rights: "FullControl", type: "Allow", inherited: false },
      { identity: "Todos", rights: "ReadAndExecute", type: "Allow", inherited: false }
    ]
  };

  var D = new Date(2026, 8, 11, 17, 12, 0).getTime();
  var D2 = new Date(2026, 8, 14, 8, 30, 0).getTime();

  function own(quien) {
    return [
      { identity: "Administradores", rights: "FullControl", type: "Allow", inherited: false },
      { identity: quien, rights: "FullControl", type: "Allow", inherited: false }
    ];
  }

  PS.build = function (S) {
    S.sys.load({
      groups: [
        { name: "Administradores", gid: 544, description: "Control total del equipo", system: true },
        { name: "Usuarios", gid: 545, description: "Usuarios estándar", system: true },
        { name: "Soporte", gid: 1000, description: "Equipo de soporte de TecnoAtlántica" }
      ],
      users: [
        { name: "Administrador", uid: 500, group: "Administradores", home: "C:\\Users\\Administrador", shell: "powershell", system: true },
        { name: "iker", uid: 1000, group: "Usuarios", home: "C:\\Users\\iker", comment: "Iker Alonso" },
        { name: "practicas", uid: 1001, group: "Usuarios", home: "C:\\Users\\practicas", comment: "Cuenta de prácticas" }
      ],
      members: [["Administradores", "iker"], ["Soporte", "iker"], ["Usuarios", "practicas"]]
    });

    S.vfs.build({
      "C:\\Users": { dir: true, owner: "Administradores" },
      "C:\\Users\\iker": { dir: true, owner: "iker", aces: own("iker"), inherit: false },
      "C:\\Users\\practicas": { dir: true, owner: "practicas", aces: own("practicas"), mtime: D2 },

      "C:\\Users\\practicas\\Bienvenida.txt": {
        owner: "practicas", mtime: D2,
        content: [
          "Bienvenida a TecnoAtlantica",
          "===========================",
          "",
          "Este equipo es el de practicas del CPD: todo lo que hay dentro es",
          "una copia, asi que puedes trastear sin miedo.",
          "",
          "Tu carpeta personal es C:\\Users\\practicas. Dentro tienes:",
          "  Documentos   informes y notas del equipo",
          "  Registros    copias de los registros del servidor",
          "  Scripts      pequenos scripts de mantenimiento",
          "  Tareas       lo que te vaya encargando el equipo",
          "",
          "Recuerda: en PowerShell los comandos se llaman cmdlets y siempre",
          "tienen la forma Verbo-Nombre (Get-ChildItem, New-Item, Set-Acl).",
          "",
          "Iker Alonso, administracion de sistemas",
          ""
        ].join("\n")
      },

      "C:\\Users\\practicas\\Documentos": { dir: true, owner: "practicas", mtime: D },
      "C:\\Users\\practicas\\Documentos\\Informe-Red.txt": {
        owner: "practicas", mtime: D,
        content: [
          "INFORME DE RED · TecnoAtlantica · septiembre 2026",
          "",
          "Sede de Las Palmas",
          "  Switch principal .......... operativo",
          "  Punto de acceso planta 1 .. operativo",
          "  Punto de acceso planta 2 .. AVERIA (pendiente de RMA)",
          "",
          "Sede de Santa Cruz",
          "  Switch principal .......... operativo",
          "  Enlace de respaldo ........ AVERIA (fibra cortada en obra)",
          "",
          "Resumen: 2 incidencias abiertas, 3 elementos operativos.",
          ""
        ].join("\n")
      },
      "C:\\Users\\practicas\\Documentos\\Notas.md": {
        owner: "practicas", mtime: D,
        content: [
          "# Notas del equipo",
          "",
          "- La copia de seguridad se lanza cada noche a las 03:00.",
          "- Los registros se rotan los domingos.",
          "- TODO: revisar el informe de red antes del viernes.",
          "- TODO: pedir el RMA del punto de acceso averiado.",
          ""
        ].join("\n")
      },
      "C:\\Users\\practicas\\Documentos\\Presupuesto.csv": {
        owner: "practicas", mtime: D,
        content: [
          "concepto;unidades;euros",
          "Switch 24 puertos;2;540",
          "Punto de acceso wifi;4;360",
          "Latiguillos cat6;40;120",
          "Horas de instalacion;16;640",
          ""
        ].join("\n")
      },

      "C:\\Users\\practicas\\Registros": { dir: true, owner: "practicas", mtime: D2 },
      "C:\\Users\\practicas\\Registros\\acceso.log": {
        owner: "practicas", mtime: D2,
        content: [
          "2026-09-14 07:58:02 INFO  sesion iniciada usuario=iker origen=192.168.10.5",
          "2026-09-14 08:01:44 INFO  sesion iniciada usuario=practicas origen=192.168.10.31",
          "2026-09-14 08:14:09 WARN  intento fallido usuario=admin origen=10.20.30.40",
          "2026-09-14 08:14:12 WARN  intento fallido usuario=admin origen=10.20.30.40",
          "2026-09-14 08:14:15 ERROR bloqueo temporal origen=10.20.30.40",
          "2026-09-14 09:02:27 INFO  sesion cerrada usuario=iker",
          "2026-09-14 11:41:03 WARN  intento fallido usuario=Administrador origen=10.20.30.40",
          "2026-09-14 12:00:00 INFO  rotacion de registros completada",
          ""
        ].join("\n")
      },
      "C:\\Users\\practicas\\Registros\\sistema.log": {
        owner: "practicas", mtime: D2,
        content: [
          "2026-09-14 03:00:01 INFO  copia de seguridad iniciada",
          "2026-09-14 03:18:44 INFO  copia de seguridad completada (18 min)",
          "2026-09-14 06:30:00 INFO  actualizaciones disponibles",
          "2026-09-14 07:00:12 ERROR disco D: al 91% de ocupacion",
          "2026-09-14 10:22:31 INFO  servicio de impresion reiniciado",
          ""
        ].join("\n")
      },
      "C:\\Users\\practicas\\Registros\\errores.log": {
        owner: "practicas", mtime: D2,
        content: [
          "2026-09-13 22:10:05 ERROR no se pudo montar la unidad de copias",
          "2026-09-14 07:00:12 ERROR disco D: al 91% de ocupacion",
          "2026-09-14 08:14:15 ERROR bloqueo temporal origen=10.20.30.40",
          ""
        ].join("\n")
      },

      "C:\\Users\\practicas\\Scripts": { dir: true, owner: "practicas", mtime: D },
      "C:\\Users\\practicas\\Scripts\\copia.ps1": {
        owner: "practicas", mtime: D,
        content: [
          "# Copia los documentos a la unidad de copias",
          "Copy-Item -Path C:\\Users\\practicas\\Documentos -Destination D:\\Copias -Recurse -Force",
          ""
        ].join("\n")
      },
      "C:\\Users\\practicas\\Scripts\\limpiar.ps1": {
        owner: "practicas", mtime: D,
        content: [
          "# Borra los registros de mas de 30 dias",
          "Get-ChildItem C:\\Registros -Filter *.log |",
          "  Where-Object { $_.LastWriteTime -lt (Get-Date).AddDays(-30) } |",
          "  Remove-Item",
          ""
        ].join("\n")
      },

      "C:\\Users\\practicas\\Tareas": { dir: true, owner: "practicas", mtime: D2 },
      "C:\\Users\\practicas\\Tareas\\Pendientes.txt": {
        owner: "practicas", mtime: D2,
        content: [
          "1. Leer el fichero de bienvenida",
          "2. Revisar el informe de red",
          "3. Preparar la carpeta de entregas",
          ""
        ].join("\n")
      },

      "C:\\Compartido": { dir: true, owner: "Administradores" },
      "C:\\Compartido\\Manual-Consola.txt": {
        owner: "iker", mtime: D,
        content: [
          "CHULETA DE POWERSHELL · TecnoAtlantica",
          "",
          "Get-Location                donde estoy          (alias pwd)",
          "Get-ChildItem               que hay aqui         (alias ls, dir)",
          "Set-Location carpeta        entrar en una carpeta (alias cd)",
          "Get-Content fichero         ver un fichero       (alias cat, type)",
          "Select-String -Pattern x    buscar texto dentro  (alias sls)",
          "New-Item -ItemType File     crear un fichero     (alias ni)",
          "Get-Help comando            ayuda de un comando  (alias help)",
          "",
          "Y lo mas importante: los cmdlets devuelven OBJETOS, no texto.",
          "Por eso se pueden encadenar con | y filtrar con Where-Object.",
          ""
        ].join("\n")
      },
      "C:\\Windows": { dir: true, owner: "Administradores" },
      "C:\\Temp": { dir: true, owner: "Administradores" }
    });

    /* Los permisos de C: bajan por herencia a todo lo que no la haya roto */
    S.vfs.propagate(S.vfs.root);
  };
})(this);
