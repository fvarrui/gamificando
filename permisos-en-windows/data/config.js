/* ==========================================================
   Escenario: el servidor de archivos de Windows recién puesto
   en marcha. La carpeta C:\Datos quedó con «Todos · Control
   total» y la herencia rota donde no tocaba.
   ========================================================== */
(function (global) {
  "use strict";
  var PW = global.PW = global.PW || {};

  PW.cfg = {
    HOST: "SRV-DATOS",
    USER: "ana",
    DRIVE: "C:",
    HOME: "C:\\Users\\ana",
    CWD: "C:\\Datos",
    TEAM: "Nayra Suárez (responsable de sistemas)",
    TERM_TITLE: "Windows PowerShell (Administrador)",
    CLOCK_BASE: new Date(2026, 9, 6, 9, 0, 0),   // mar 6 oct 2026, 09:00
    ROOT_ACES: [
      { identity: "Administradores", rights: "FullControl", type: "Allow", inherited: false },
      { identity: "Usuarios", rights: "ReadAndExecute", type: "Allow", inherited: false }
    ]
  };

  var D = new Date(2026, 9, 2, 11, 20, 0).getTime();

  function ace(identity, rights, type) {
    return { identity: identity, rights: rights, type: type || "Allow", inherited: false };
  }

  PW.build = function (S) {
    S.sys.load({
      groups: [
        { name: "Administradores", gid: 544, description: "Control total del equipo", system: true },
        { name: "Usuarios", gid: 545, description: "Usuarios estándar", system: true },
        { name: "Ventas", gid: 1000, description: "Equipo comercial" },
        { name: "Proyectos", gid: 1001, description: "Equipo de proyectos" },
        { name: "Direccion", gid: 1002, description: "Dirección" }
      ],
      users: [
        { name: "Administrador", uid: 500, group: "Administradores", home: "C:\\Users\\Administrador", system: true },
        { name: "ana", uid: 1000, group: "Usuarios", home: "C:\\Users\\ana", comment: "Ana Betancor · Sistemas" },
        { name: "bruno", uid: 1001, group: "Usuarios", home: "C:\\Users\\bruno", comment: "Bruno Medina · Ventas" },
        { name: "carla", uid: 1002, group: "Usuarios", home: "C:\\Users\\carla", comment: "Carla Ojeda · Proyectos" },
        { name: "dario", uid: 1003, group: "Usuarios", home: "C:\\Users\\dario", comment: "Darío Peña · Dirección" },
        { name: "lucia", uid: 1004, group: "Usuarios", home: "C:\\Users\\lucia", comment: "Lucía Ramos · baja el 30/09", enabled: false }
      ],
      members: [
        ["Administradores", "ana"],
        ["Usuarios", "ana"], ["Usuarios", "bruno"], ["Usuarios", "carla"], ["Usuarios", "dario"],
        ["Ventas", "bruno"], ["Proyectos", "carla"], ["Direccion", "dario"]
      ]
    });

    S.vfs.build({
      "C:\\Users": { dir: true, owner: "Administradores" },
      "C:\\Users\\ana": { dir: true, owner: "ana", aces: [ace("Administradores", "FullControl"), ace("ana", "FullControl")], inherit: false },

      /* El desastre: la carpeta compartida abierta a todo el mundo */
      "C:\\Datos": {
        dir: true, owner: "Administradores", mtime: D,
        aces: [ace("Todos", "FullControl")]
      },
      "C:\\Datos\\LEEME.txt": {
        owner: "Administradores", mtime: D,
        content: [
          "CARPETA DE DATOS · TecnoAtlantica",
          "",
          "La monto Insular Sistemas S.L. y la dejo con Todos - Control total,",
          "asi que cualquiera puede leer, cambiar y borrar cualquier cosa.",
          "",
          "Lo que tiene que quedar al terminar:",
          "  - Nadie con Control total salvo Administradores.",
          "  - Cada departamento con permisos solo en SU carpeta.",
          "  - Privado sin heredar nada: solo Administradores.",
          "  - Ventas no puede ni leer la carpeta de Direccion.",
          "  - La carpeta de Ventas vuelve a heredar de C:\\Datos.",
          ""
        ].join("\n")
      },

      "C:\\Datos\\Proyectos": { dir: true, owner: "Administradores", mtime: D },
      "C:\\Datos\\Proyectos\\memoria-atlante.txt": {
        owner: "carla", mtime: D,
        content: "MEMORIA DEL PROYECTO ATLANTE\n\nFase 1 completada. Fase 2 en curso.\n"
      },
      "C:\\Datos\\Proyectos\\plan-2027.txt": {
        owner: "lucia", mtime: D,
        content: "PLAN DE PROYECTOS 2027\n\nBorrador dejado por Lucia antes de su baja.\n"
      },

      "C:\\Datos\\Ventas": { dir: true, owner: "Administradores", mtime: D, inherit: false, aces: [ace("Todos", "FullControl")] },
      "C:\\Datos\\Ventas\\presupuesto.csv": {
        owner: "bruno", mtime: D,
        content: "partida;importe\nServidor de archivos;4200\nLicencias;1800\n"
      },

      "C:\\Datos\\Direccion": { dir: true, owner: "Administradores", mtime: D },
      "C:\\Datos\\Direccion\\acta.txt": {
        owner: "dario", mtime: D,
        content: "ACTA DE DIRECCION · 2 de octubre de 2026\n\nSe aprueba la segunda fase del proyecto Atlante.\n"
      },

      "C:\\Datos\\Privado": { dir: true, owner: "Administradores", mtime: D },
      "C:\\Datos\\Privado\\credenciales.txt": {
        owner: "Administradores", mtime: D,
        content: [
          "# Credenciales de servicio",
          "usuario=svc-atlante",
          "clave=Atl4nte-2026!",
          ""
        ].join("\n")
      },

      "C:\\Windows": { dir: true, owner: "Administradores" },
      "C:\\Temp": { dir: true, owner: "Administradores" }
    });

    S.vfs.propagate(S.vfs.root);
  };
})(this);
