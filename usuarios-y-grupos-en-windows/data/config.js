/* ==========================================================
   Escenario: la misma semana de altas y bajas, pero en el
   servidor de Windows de la oficina, con cuentas locales.
   ========================================================== */
(function (global) {
  "use strict";
  var UW = global.UW = global.UW || {};

  UW.cfg = {
    HOST: "SRV-OFICINA",
    USER: "ana",
    DRIVE: "C:",
    HOME: "C:\\Users\\ana",
    CWD: "C:\\Users\\ana",
    TEAM: "Nayra Suárez (responsable de sistemas)",
    TERM_TITLE: "Windows PowerShell (Administrador)",
    CLOCK_BASE: new Date(2026, 8, 22, 8, 50, 0),   // mar 22 sep 2026, 08:50
    ROOT_ACES: [
      { identity: "Administradores", rights: "FullControl", type: "Allow", inherited: false },
      { identity: "Usuarios", rights: "ReadAndExecute", type: "Allow", inherited: false }
    ]
  };

  var D = new Date(2026, 8, 18, 16, 0, 0).getTime();

  UW.build = function (S) {
    S.sys.load({
      groups: [
        { name: "Administradores", gid: 544, description: "Control total del equipo", system: true },
        { name: "Usuarios", gid: 545, description: "Usuarios estándar", system: true },
        { name: "Escritorio remoto", gid: 555, description: "Acceso por Escritorio remoto", system: true },
        { name: "Ventas", gid: 1000, description: "Equipo comercial" },
        { name: "Proyectos", gid: 1001, description: "Equipo de proyectos" },
        { name: "Direccion", gid: 1002, description: "Dirección" }
      ],
      users: [
        { name: "Administrador", uid: 500, group: "Administradores", home: "C:\\Users\\Administrador", comment: "Cuenta integrada de administración", system: true },
        { name: "ana", uid: 1000, group: "Usuarios", home: "C:\\Users\\ana", comment: "Ana Betancor · Sistemas" },
        { name: "bruno", uid: 1001, group: "Usuarios", home: "C:\\Users\\bruno", comment: "Bruno Medina · Ventas" },
        { name: "carla", uid: 1002, group: "Usuarios", home: "C:\\Users\\carla", comment: "Carla Ojeda · Proyectos" },
        { name: "dario", uid: 1003, group: "Usuarios", home: "C:\\Users\\dario", comment: "Dario Pena · Proyectos" },
        { name: "temporal", uid: 1004, group: "Usuarios", home: "C:\\Users\\temporal", comment: "Cuenta compartida del curso de 2023", enabled: true },
        { name: "svc-viejo", uid: 1005, group: "Usuarios", home: "C:\\Users\\svc-viejo", comment: "Servicio retirado en 2024", enabled: false }
      ],
      members: [
        ["Administradores", "ana"],
        ["Usuarios", "ana"], ["Usuarios", "bruno"], ["Usuarios", "carla"],
        ["Usuarios", "dario"], ["Usuarios", "temporal"],
        ["Ventas", "bruno"],
        ["Proyectos", "carla"], ["Proyectos", "dario"],
        ["Direccion", "ana"],
        ["Escritorio remoto", "bruno"], ["Escritorio remoto", "carla"]
      ]
    });

    S.vfs.build({
      "C:\\Users": { dir: true, owner: "Administradores" },
      "C:\\Users\\ana": {
        dir: true, owner: "ana", mtime: D,
        aces: [
          { identity: "Administradores", rights: "FullControl", type: "Allow", inherited: false },
          { identity: "ana", rights: "FullControl", type: "Allow", inherited: false }
        ]
      },
      "C:\\Users\\ana\\altas.txt": {
        owner: "ana", mtime: D,
        content: [
          "ALTAS Y BAJAS DE ESTA SEMANA",
          "",
          "ALTAS",
          "  Elena Quintana  Ventas      elena",
          "  Hugo Santana    Proyectos   hugo",
          "",
          "BAJA",
          "  Dario Pena      fin de contrato el viernes",
          "",
          "OTROS",
          "  Crear el grupo local 'Formacion' para el plan de formacion interno.",
          "  Eliminar la cuenta compartida 'temporal' (curso de 2023).",
          "  Revisar las cuentas deshabilitadas que siguen en el equipo.",
          ""
        ].join("\n")
      },
      "C:\\Users\\bruno": { dir: true, owner: "bruno", mtime: D },
      "C:\\Users\\carla": { dir: true, owner: "carla", mtime: D },
      "C:\\Users\\dario": { dir: true, owner: "dario", mtime: D },
      "C:\\Users\\temporal": { dir: true, owner: "temporal", mtime: D },
      "C:\\Windows": { dir: true, owner: "Administradores" },
      "C:\\Temp": { dir: true, owner: "Administradores" }
    });

    S.vfs.propagate(S.vfs.root);
  };
})(this);
