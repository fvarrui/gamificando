/* ==========================================================
   Escenario: el servidor de archivos recién instalado.
   La empresa que lo montó dejó casi todo a 777 y con dueños
   equivocados: hay que ponerlo en orden sin cortar el trabajo.
   ========================================================== */
(function (global) {
  "use strict";
  var PL = global.PL = global.PL || {};

  PL.cfg = {
    HOST: "srv-datos",
    USER: "ana",
    HOME: "/home/ana",
    CWD: "/srv/proyectos",
    TEAM: "Nayra Suárez (responsable de sistemas)",
    TERM_TITLE: "bash",
    TZ_NAME: "WEST",
    UMASK: 0o022,
    CLOCK_BASE: new Date(2026, 9, 5, 8, 40, 0),   // lun 5 oct 2026, 08:40
    BASE_PROCESSES: [
      { user: "root", pid: 1, cmd: "/sbin/init", name: "systemd" },
      { user: "ana", pid: 2210, cmd: "-bash", name: "bash" }
    ]
  };

  var D = new Date(2026, 9, 2, 12, 5, 0).getTime();

  PL.build = function (S) {
    S.sys.load({
      groups: [
        { name: "root", gid: 0, system: true },
        { name: "sistemas", gid: 1000, description: "Administración de sistemas" },
        { name: "proyectos", gid: 1001, description: "Equipo de proyectos" },
        { name: "ventas", gid: 1002, description: "Equipo comercial" },
        { name: "direccion", gid: 1003, description: "Dirección" },
        { name: "ana", gid: 1100 },
        { name: "bruno", gid: 1101 },
        { name: "carla", gid: 1102 },
        { name: "dario", gid: 1103 }
      ],
      users: [
        { name: "root", uid: 0, group: "root", home: "/root", system: true },
        { name: "ana", uid: 1100, group: "ana", home: "/home/ana", comment: "Ana Betancor · Sistemas" },
        { name: "bruno", uid: 1101, group: "bruno", home: "/home/bruno", comment: "Bruno Medina · Ventas" },
        { name: "carla", uid: 1102, group: "carla", home: "/home/carla", comment: "Carla Ojeda · Proyectos" },
        { name: "dario", uid: 1103, group: "dario", home: "/home/dario", comment: "Darío Peña · Becario" }
      ],
      members: [
        ["sistemas", "ana"],
        ["proyectos", "carla"], ["proyectos", "ana"],
        ["ventas", "bruno"],
        ["direccion", "ana"]
      ]
    });

    S.vfs.build({
      "/home": { dir: true, owner: "root", group: "root" },
      "/home/ana": { dir: true, owner: "ana", group: "ana", mode: 0o750 },
      "/home/bruno": { dir: true, owner: "bruno", group: "bruno", mode: 0o750 },
      "/home/carla": { dir: true, owner: "carla", group: "carla", mode: 0o750 },
      "/home/dario": { dir: true, owner: "dario", group: "dario", mode: 0o750 },

      /* La carpeta compartida: instalada de cualquier manera */
      "/srv": { dir: true, owner: "root", group: "root", mode: 0o755 },
      "/srv/proyectos": { dir: true, owner: "root", group: "root", mode: 0o777, mtime: D },

      "/srv/proyectos/lectura.txt": {
        owner: "root", group: "root", mode: 0o777, mtime: D,
        content: [
          "CARPETA DE PROYECTOS · TecnoAtlantica",
          "",
          "Esta carpeta la instalo una empresa externa y la dejo abierta de par",
          "en par: todo el mundo puede leer, escribir y borrar cualquier cosa.",
          "",
          "Lo que tiene que quedar al terminar:",
          "  - La carpeta pertenece al grupo proyectos y solo el equipo entra.",
          "  - Los ficheros del proyecto los edita el equipo, nadie mas los ve.",
          "  - Ventas necesita LEER el presupuesto, pero no tocarlo.",
          "  - Direccion (Dario) necesita leer el acta, y nada mas.",
          "  - Lo que se cree nuevo debe seguir siendo accesible para el equipo.",
          ""
        ].join("\n")
      },
      /* La consultora se dejó puesta una ACL de prueba para bruno */
      "/srv/proyectos/memoria.txt": {
        owner: "root", group: "root", mode: 0o777, mtime: D,
        acl: [
          { kind: "user", name: "bruno", perms: "rw" },
          { kind: "mask", name: "", perms: "rwx" }
        ],
        content: [
          "MEMORIA DEL PROYECTO ATLANTE",
          "",
          "Fase 1: despliegue de la red en la sede de Las Palmas .. completada",
          "Fase 2: servidor de archivos ........................... en curso",
          "Fase 3: copias de seguridad ............................ pendiente",
          ""
        ].join("\n")
      },
      "/srv/proyectos/presupuesto.csv": {
        owner: "root", group: "root", mode: 0o777, mtime: D,
        content: [
          "partida;importe",
          "Servidor de archivos;4200",
          "Licencias;1800",
          "Horas de consultoria;5600",
          ""
        ].join("\n")
      },
      "/srv/proyectos/acta-direccion.txt": {
        owner: "root", group: "root", mode: 0o777, mtime: D,
        content: [
          "ACTA DE DIRECCION · 2 de octubre de 2026",
          "",
          "Se aprueba la segunda fase del proyecto Atlante.",
          "Se acuerda revisar los permisos del servidor de archivos.",
          ""
        ].join("\n")
      },
      "/srv/proyectos/despliegue.sh": {
        owner: "root", group: "root", mode: 0o644, mtime: D,
        content: [
          "#!/bin/bash",
          "# Despliega la configuracion del servidor de archivos",
          "echo \"Desplegando configuracion...\"",
          "rsync -a /srv/proyectos/config/ /etc/atlante/",
          ""
        ].join("\n")
      },
      "/srv/proyectos/privado": { dir: true, owner: "root", group: "root", mode: 0o777, mtime: D },
      "/srv/proyectos/privado/claves.txt": {
        owner: "root", group: "root", mode: 0o666, mtime: D,
        content: [
          "# Credenciales de servicio del proyecto Atlante",
          "usuario=svc-atlante",
          "clave=Atl4nte-2026!",
          ""
        ].join("\n")
      },

      "/etc": { dir: true, owner: "root", group: "root" },
      "/etc/hostname": { owner: "root", group: "root", content: "srv-datos\n" },
      "/tmp": { dir: true, owner: "root", group: "root", mode: 0o777 },
      "/root": { dir: true, owner: "root", group: "root", mode: 0o700 }
    });
  };
})(this);
