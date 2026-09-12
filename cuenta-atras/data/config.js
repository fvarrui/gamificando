/* ==========================================================
   Escenario: semana de altas y bajas en TecnoAtlántica.
   Entran dos personas nuevas, alguien se va, y hay una cuenta
   genérica compartida que lleva años sin dueño.
   ========================================================== */
(function (global) {
  "use strict";
  var UG = global.UG = global.UG || {};

  UG.cfg = {
    HOST: "srv-datos",
    USER: "hamilton",
    HOME: "/home/hamilton",
    CWD: "/home/hamilton",
    TEAM: "Sigourney Weaver (responsable de sistemas)",
    TERM_TITLE: "bash",
    TZ_NAME: "WEST",
    UMASK: 0o022,
    CLOCK_BASE: new Date(2026, 8, 21, 8, 45, 0),   // lun 21 sep 2026, 08:45
    BASE_PROCESSES: [
      { user: "root", pid: 1, cmd: "/sbin/init", name: "systemd" },
      { user: "hamilton", pid: 2310, cmd: "-bash", name: "bash" }
    ]
  };

  var D = new Date(2026, 8, 18, 16, 0, 0).getTime();

  UG.build = function (S) {
    S.sys.load({
      groups: [
        { name: "root", gid: 0, system: true },
        { name: "sudo", gid: 27, description: "Administración delegada", system: true },
        { name: "sistemas", gid: 1000, description: "Administración de sistemas" },
        { name: "ventas", gid: 1001, description: "Equipo comercial" },
        { name: "proyectos", gid: 1002, description: "Equipo de proyectos" },
        { name: "direccion", gid: 1003, description: "Dirección" },
        { name: "hamilton", gid: 1100 }, { name: "lundgren", gid: 1101 },
        { name: "yeoh", gid: 1102 }, { name: "vandamme", gid: 1103 },
        { name: "visitas", gid: 1104 }
      ],
      users: [
        { name: "root", uid: 0, group: "root", home: "/root", system: true },
        { name: "hamilton", uid: 1100, group: "hamilton", home: "/home/hamilton", comment: "Linda Hamilton" },
        { name: "lundgren", uid: 1101, group: "lundgren", home: "/home/lundgren", comment: "Dolph Lundgren" },
        { name: "yeoh", uid: 1102, group: "yeoh", home: "/home/yeoh", comment: "Michelle Yeoh" },
        { name: "vandamme", uid: 1103, group: "vandamme", home: "/home/vandamme", comment: "Jean-Claude Van Damme" },
        /* La cuenta genérica que usa medio mundo: la mala práctica de partida */
        { name: "visitas", uid: 1104, group: "visitas", home: "/home/visitas", comment: "Cuenta compartida de visitas", password: "visitas" }
      ],
      members: [
        ["sudo", "hamilton"], ["sistemas", "hamilton"],
        ["ventas", "lundgren"],
        ["proyectos", "yeoh"], ["proyectos", "vandamme"],
        ["direccion", "hamilton"]
      ]
    });

    S.vfs.build({
      "/home": { dir: true, owner: "root", group: "root", mode: 0o755 },
      "/home/hamilton": { dir: true, owner: "hamilton", group: "hamilton", mode: 0o750, mtime: D },
      "/home/lundgren": { dir: true, owner: "lundgren", group: "lundgren", mode: 0o750, mtime: D },
      "/home/yeoh": { dir: true, owner: "yeoh", group: "yeoh", mode: 0o750, mtime: D },
      "/home/vandamme": { dir: true, owner: "vandamme", group: "vandamme", mode: 0o750, mtime: D },
      "/home/visitas": { dir: true, owner: "visitas", group: "visitas", mode: 0o777, mtime: D },
      "/home/visitas/notas.txt": {
        owner: "visitas", group: "visitas", mode: 0o666, mtime: D,
        content: "Clave del wifi de invitados: Atl4ntica-Guest\nTelefono de soporte: 928 00 00 00\n"
      },

      "/home/hamilton/altas.txt": {
        owner: "hamilton", group: "hamilton", mtime: D,
        content: [
          "ALTAS Y BAJAS DE ESTA SEMANA",
          "",
          "ALTAS",
          "  Carrie-Anne Moss  ventas         moss",
          "  Jackie Chan    proyectos      chan",
          "",
          "BAJA",
          "  Jean-Claude Van Damme      fin de contrato el viernes",
          "",
          "OTROS",
          "  Crear el grupo 'formacion' para el plan de formacion interno.",
          "  Eliminar la cuenta compartida 'visitas' (la usa todo el mundo).",
          "  Crear una cuenta de servicio para las copias: svc-backup.",
          ""
        ].join("\n")
      },

      "/etc": { dir: true, owner: "root", group: "root" },
      "/etc/hostname": { owner: "root", group: "root", content: "srv-datos\n" },
      "/etc/skel": { dir: true, owner: "root", group: "root" },
      "/srv": { dir: true, owner: "root", group: "root" },
      "/srv/proyectos": { dir: true, owner: "root", group: "proyectos", mode: 0o2770, mtime: D },
      "/tmp": { dir: true, owner: "root", group: "root", mode: 0o1777 },
      "/root": { dir: true, owner: "root", group: "root", mode: 0o700 }
    });
  };
})(this);
