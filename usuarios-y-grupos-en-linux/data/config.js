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
    USER: "ana",
    HOME: "/home/ana",
    CWD: "/home/ana",
    TEAM: "Nayra Suárez (responsable de sistemas)",
    TERM_TITLE: "bash",
    TZ_NAME: "WEST",
    UMASK: 0o022,
    CLOCK_BASE: new Date(2026, 8, 21, 8, 45, 0),   // lun 21 sep 2026, 08:45
    BASE_PROCESSES: [
      { user: "root", pid: 1, cmd: "/sbin/init", name: "systemd" },
      { user: "ana", pid: 2310, cmd: "-bash", name: "bash" }
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
        { name: "ana", gid: 1100 }, { name: "bruno", gid: 1101 },
        { name: "carla", gid: 1102 }, { name: "dario", gid: 1103 },
        { name: "visitas", gid: 1104 }
      ],
      users: [
        { name: "root", uid: 0, group: "root", home: "/root", system: true },
        { name: "ana", uid: 1100, group: "ana", home: "/home/ana", comment: "Ana Betancor" },
        { name: "bruno", uid: 1101, group: "bruno", home: "/home/bruno", comment: "Bruno Medina" },
        { name: "carla", uid: 1102, group: "carla", home: "/home/carla", comment: "Carla Ojeda" },
        { name: "dario", uid: 1103, group: "dario", home: "/home/dario", comment: "Dario Pena" },
        /* La cuenta genérica que usa medio mundo: la mala práctica de partida */
        { name: "visitas", uid: 1104, group: "visitas", home: "/home/visitas", comment: "Cuenta compartida de visitas", password: "visitas" }
      ],
      members: [
        ["sudo", "ana"], ["sistemas", "ana"],
        ["ventas", "bruno"],
        ["proyectos", "carla"], ["proyectos", "dario"],
        ["direccion", "ana"]
      ]
    });

    S.vfs.build({
      "/home": { dir: true, owner: "root", group: "root", mode: 0o755 },
      "/home/ana": { dir: true, owner: "ana", group: "ana", mode: 0o750, mtime: D },
      "/home/bruno": { dir: true, owner: "bruno", group: "bruno", mode: 0o750, mtime: D },
      "/home/carla": { dir: true, owner: "carla", group: "carla", mode: 0o750, mtime: D },
      "/home/dario": { dir: true, owner: "dario", group: "dario", mode: 0o750, mtime: D },
      "/home/visitas": { dir: true, owner: "visitas", group: "visitas", mode: 0o777, mtime: D },
      "/home/visitas/notas.txt": {
        owner: "visitas", group: "visitas", mode: 0o666, mtime: D,
        content: "Clave del wifi de invitados: Atl4ntica-Guest\nTelefono de soporte: 928 00 00 00\n"
      },

      "/home/ana/altas.txt": {
        owner: "ana", group: "ana", mtime: D,
        content: [
          "ALTAS Y BAJAS DE ESTA SEMANA",
          "",
          "ALTAS",
          "  Elena Quintana  ventas         elena",
          "  Hugo Santana    proyectos      hugo",
          "",
          "BAJA",
          "  Dario Pena      fin de contrato el viernes",
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
