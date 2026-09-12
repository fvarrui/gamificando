/* ==========================================================
   Escenario: la misma semana de altas y bajas, pero en el
   servidor de Windows de la oficina, con cuentas locales.
   ========================================================== */
(function (global) {
  "use strict";
  var UW = global.UW = global.UW || {};

  UW.cfg = {
    HOST: "SRV-OFICINA",
    USER: "hamilton",
    DRIVE: "C:",
    HOME: "C:\\Users\\hamilton",
    CWD: "C:\\Users\\hamilton",
    TEAM: "Sigourney Weaver (responsable de sistemas)",
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
        { name: "hamilton", uid: 1000, group: "Usuarios", home: "C:\\Users\\hamilton", comment: "Linda Hamilton · Sistemas" },
        { name: "lundgren", uid: 1001, group: "Usuarios", home: "C:\\Users\\lundgren", comment: "Dolph Lundgren · Ventas" },
        { name: "yeoh", uid: 1002, group: "Usuarios", home: "C:\\Users\\yeoh", comment: "Michelle Yeoh · Proyectos" },
        { name: "vandamme", uid: 1003, group: "Usuarios", home: "C:\\Users\\vandamme", comment: "Jean-Claude Van Damme · Proyectos" },
        { name: "temporal", uid: 1004, group: "Usuarios", home: "C:\\Users\\temporal", comment: "Cuenta compartida del curso de 2023", enabled: true },
        { name: "svc-viejo", uid: 1005, group: "Usuarios", home: "C:\\Users\\svc-viejo", comment: "Servicio retirado en 2024", enabled: false }
      ],
      members: [
        ["Administradores", "hamilton"],
        ["Usuarios", "hamilton"], ["Usuarios", "lundgren"], ["Usuarios", "yeoh"],
        ["Usuarios", "vandamme"], ["Usuarios", "temporal"],
        ["Ventas", "lundgren"],
        ["Proyectos", "yeoh"], ["Proyectos", "vandamme"],
        ["Direccion", "hamilton"],
        ["Escritorio remoto", "lundgren"], ["Escritorio remoto", "yeoh"]
      ]
    });

    S.vfs.build({
      "C:\\Users": { dir: true, owner: "Administradores" },
      "C:\\Users\\hamilton": {
        dir: true, owner: "hamilton", mtime: D,
        aces: [
          { identity: "Administradores", rights: "FullControl", type: "Allow", inherited: false },
          { identity: "hamilton", rights: "FullControl", type: "Allow", inherited: false }
        ]
      },
      "C:\\Users\\hamilton\\altas.txt": {
        owner: "hamilton", mtime: D,
        content: [
          "ALTAS Y BAJAS DE ESTA SEMANA",
          "",
          "ALTAS",
          "  Carrie-Anne Moss  Ventas      moss",
          "  Jackie Chan    Proyectos   chan",
          "",
          "BAJA",
          "  Jean-Claude Van Damme      fin de contrato el viernes",
          "",
          "OTROS",
          "  Crear el grupo local 'Formacion' para el plan de formacion interno.",
          "  Eliminar la cuenta compartida 'temporal' (curso de 2023).",
          "  Revisar las cuentas deshabilitadas que siguen en el equipo.",
          ""
        ].join("\n")
      },
      "C:\\Users\\lundgren": { dir: true, owner: "lundgren", mtime: D },
      "C:\\Users\\yeoh": { dir: true, owner: "yeoh", mtime: D },
      "C:\\Users\\vandamme": { dir: true, owner: "vandamme", mtime: D },
      "C:\\Users\\temporal": { dir: true, owner: "temporal", mtime: D },
      "C:\\Windows": { dir: true, owner: "Administradores" },
      "C:\\Temp": { dir: true, owner: "Administradores" }
    });

    S.vfs.propagate(S.vfs.root);
  };
})(this);
