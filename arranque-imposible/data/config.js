/* ==========================================================
   Escenario: guardia en el servidor de aplicaciones Windows.
   La aplicación de nóminas no arranca y nadie sabe por qué.
   ========================================================== */
(function (global) {
  "use strict";
  var SW = global.SW = global.SW || {};

  SW.cfg = {
    HOST: "SRV-APP",
    USER: "hamilton",
    DRIVE: "C:",
    HOME: "C:\\Users\\hamilton",
    CWD: "C:\\Users\\hamilton",
    TEAM: "Guardia de sistemas",
    TERM_TITLE: "Windows PowerShell (Administrador)",
    CLOCK_BASE: new Date(2026, 9, 20, 7, 40, 0),   // mar 20 oct 2026, 07:40
    ROOT_ACES: [
      { identity: "Administradores", rights: "FullControl", type: "Allow", inherited: false },
      { identity: "Usuarios", rights: "ReadAndExecute", type: "Allow", inherited: false }
    ]
  };

  var D = new Date(2026, 9, 19, 18, 0, 0).getTime();

  SW.build = function (S) {
    S.sys.load({
      groups: [
        { name: "Administradores", gid: 544, description: "Control total del equipo", system: true },
        { name: "Usuarios", gid: 545, description: "Usuarios estándar", system: true },
        { name: "Sistemas", gid: 1000, description: "Equipo de sistemas" }
      ],
      users: [
        { name: "Administrador", uid: 500, group: "Administradores", home: "C:\\Users\\Administrador", system: true },
        { name: "hamilton", uid: 1000, group: "Usuarios", home: "C:\\Users\\hamilton", comment: "Linda Hamilton · Guardia" }
      ],
      members: [["Administradores", "hamilton"], ["Usuarios", "hamilton"], ["Sistemas", "hamilton"]],
      services: [
        {
          /* El servicio de la aplicación: deshabilitado «para una prueba» */
          name: "AtlanteApp", display: "Atlante · Servicio de nóminas", state: "stopped", startup: "disabled",
          pid: null, user: "svc-atlante", cmd: "C:\\Atlante\\AtlanteApp.exe",
          description: "Servicio de la aplicación de nóminas",
          log: [
            "19/10/2026 18:02  El servicio Atlante · Servicio de nóminas se detuvo correctamente.",
            "19/10/2026 18:02  Tipo de inicio cambiado a Deshabilitado por ADMINISTRADOR."
          ]
        },
        {
          name: "MSSQLSERVER", display: "SQL Server (MSSQLSERVER)", state: "running", startup: "auto",
          pid: 1480, user: "NT Service\\MSSQLSERVER", cmd: "sqlservr.exe",
          description: "Motor de base de datos de la aplicación",
          log: ["20/10/2026 06:00  Recovery is complete. Base de datos lista."]
        },
        {
          name: "W3SVC", display: "Servicio de publicación World Wide Web", state: "running", startup: "auto",
          pid: 2140, user: "LocalSystem", cmd: "svchost.exe -k iissvcs",
          description: "Servidor web IIS que publica el portal",
          log: ["20/10/2026 06:01  El servicio se inició correctamente."]
        },
        {
          name: "Spooler", display: "Cola de impresión", state: "running", startup: "auto",
          pid: 1620, user: "LocalSystem", cmd: "spoolsv.exe",
          description: "Cola de impresión (no hay impresoras en este servidor)",
          log: ["20/10/2026 06:00  El servicio se inició correctamente."]
        },
        {
          name: "WinRM", display: "Administración remota de Windows (WS-Management)", state: "stopped", startup: "manual",
          pid: null, user: "NetworkService", cmd: "svchost.exe -k NetworkService",
          description: "Administración remota por PowerShell",
          log: ["19/10/2026 17:44  El servicio se detuvo correctamente."]
        },
        {
          name: "TermService", display: "Servicios de Escritorio remoto", state: "running", startup: "auto",
          pid: 1180, user: "NetworkService", cmd: "svchost.exe -k termsvcs",
          description: "Acceso por Escritorio remoto (así has entrado tú)",
          log: ["20/10/2026 07:38  Sesión iniciada por hamilton desde 192.168.10.5"]
        }
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
      "C:\\Users\\hamilton\\guardia.txt": {
        owner: "hamilton", mtime: D,
        content: [
          "PARTE DE GUARDIA · manana del 20 de octubre",
          "",
          "07:35  Aviso: la aplicacion de nominas no arranca. Nadie puede fichar.",
          "07:38  Conectada por Escritorio remoto a SRV-APP.",
          "",
          "Pendiente:",
          "  - Averiguar por que no arranca AtlanteApp.",
          "  - Revisar que servicios estan corriendo y si deben estarlo.",
          "  - Dejar los tipos de inicio bien configurados antes de terminar.",
          ""
        ].join("\n")
      },
      "C:\\Atlante": { dir: true, owner: "Administradores", mtime: D },
      "C:\\Atlante\\LEEME.txt": {
        owner: "Administradores", mtime: D,
        content: [
          "APLICACION ATLANTE · nominas",
          "",
          "El servicio se llama AtlanteApp y depende de SQL Server.",
          "Si el tipo de inicio esta en Deshabilitado, no arranca ni a mano:",
          "hay que cambiarlo antes con Set-Service -StartupType.",
          ""
        ].join("\n")
      },
      "C:\\Windows": { dir: true, owner: "Administradores" },
      "C:\\Temp": { dir: true, owner: "Administradores" }
    });

    S.vfs.propagate(S.vfs.root);
  };
})(this);
