/* ==========================================================
   Escenario: migración de la intranet a contenedores.
   Un servidor recién instalado con Docker, un registro con
   unas pocas imágenes y el proyecto de la intranet en casa.
   ========================================================== */
(function (global) {
  "use strict";
  var RG = global.RG, DK = global.DK = global.DK || {};

  DK.cfg = {
    HOST: "srv-docker",
    USER: "ana",
    HOME: "/home/ana",
    CWD: "/home/ana",
    TEAM: "Nayra Suárez (responsable de sistemas)",
    TERM_TITLE: "bash",
    TZ_NAME: "WEST",
    UMASK: 0o022,
    CLOCK_BASE: new Date(2026, 10, 3, 9, 15, 0),   // mar 3 nov 2026, 09:15
    BASE_PROCESSES: [
      { user: "root", pid: 1, cmd: "/sbin/init", name: "systemd" },
      { user: "root", pid: 740, cmd: "/usr/bin/dockerd", name: "dockerd" },
      { user: "ana", pid: 2401, cmd: "-bash", name: "bash" }
    ]
  };

  var D = new Date(2026, 10, 2, 18, 0, 0).getTime();

  /* Imágenes disponibles en el registro (Docker Hub simulado) */
  DK.REGISTRY = [
    {
      name: "nginx:1.27", id: "a72860cb95fd", created: "3 weeks ago", size: "188MB",
      cmd: "nginx -g 'daemon off;'", expose: 80,
      layers: ["a2abf6c4d29d", "c3b1ad2005ec", "2a4a1f2f1bd0", "8f3a0fdbb07e"],
      logs: [
        "/docker-entrypoint.sh: Configuration complete; ready for start up",
        "2026/11/03 09:16:02 [notice] 1#1: using the \"epoll\" event method",
        "2026/11/03 09:16:02 [notice] 1#1: nginx/1.27.2",
        "2026/11/03 09:16:02 [notice] 1#1: start worker processes"
      ],
      exec: {
        "nginx -v": ["nginx version: nginx/1.27.2"],
        "ls /usr/share/nginx/html": ["50x.html", "index.html"],
        "cat /usr/share/nginx/html/index.html": [
          "<html><body><h1>Bienvenido a la intranet de TecnoAtlantica</h1></body></html>"
        ]
      }
    },
    {
      name: "mariadb:11", id: "5e3f2a1bd9c4", created: "2 weeks ago", size: "404MB",
      cmd: "mariadbd", expose: 3306,
      layers: ["9b1c4dd6f2ee", "77aa0d3eb84f", "b2d4e6a1c803"],
      requiredEnv: ["MARIADB_ROOT_PASSWORD"],
      errorLogs: [
        "2026-11-03 09:20:11+00:00 [ERROR] [Entrypoint]: Database is uninitialized and password option is not specified",
        "    You need to specify one of MARIADB_ROOT_PASSWORD, MARIADB_ALLOW_EMPTY_ROOT_PASSWORD and MARIADB_RANDOM_ROOT_PASSWORD"
      ],
      logs: [
        "2026-11-03 09:22:03+00:00 [Note] [Entrypoint]: Initializing database files",
        "2026-11-03 09:22:09 0 [Note] mariadbd: ready for connections.",
        "Version: '11.4.3-MariaDB'  socket: '/run/mysqld/mysqld.sock'  port: 3306"
      ],
      exec: {
        "ls /var/lib/mysql": ["ib_logfile0", "ibdata1", "intranet", "mysql", "performance_schema"],
        "mariadb --version": ["mariadb from 11.4.3-MariaDB, client 15.2 for debian-linux-gnu"]
      }
    },
    {
      name: "redis:7", id: "c4b1a7e05f38", created: "1 month ago", size: "117MB",
      cmd: "redis-server", expose: 6379,
      layers: ["3f2b0a9d7c11", "d51a8e0b3f27"],
      logs: ["1:M 03 Nov 2026 09:30:00.112 * Ready to accept connections tcp"]
    },
    {
      name: "alpine:3.20", id: "b0c9f31a6d52", created: "2 months ago", size: "7.8MB",
      cmd: "/bin/sh",
      layers: ["31e352740f53"],
      logs: [],
      exec: { "cat /etc/os-release": ["NAME=\"Alpine Linux\"", "VERSION_ID=3.20.3"] }
    }
  ];

  DK.build = function (S) {
    S.sys.load({
      groups: [
        { name: "root", gid: 0, system: true },
        { name: "sudo", gid: 27, system: true },
        { name: "docker", gid: 999, description: "Puede hablar con el demonio de Docker" },
        { name: "ana", gid: 1100 }
      ],
      users: [
        { name: "root", uid: 0, group: "root", home: "/root", system: true },
        { name: "ana", uid: 1100, group: "ana", home: "/home/ana", comment: "Ana Betancor · Sistemas" }
      ],
      members: [["sudo", "ana"], ["docker", "ana"]]
    });

    /* Estado del motor de contenedores */
    S.state.docker = RG.DockerState({
      registry: DK.REGISTRY,
      images: [],
      volumes: []
    });

    S.vfs.build({
      "/home": { dir: true, owner: "root", group: "root" },
      "/home/ana": { dir: true, owner: "ana", group: "ana", mode: 0o750, mtime: D },
      "/home/ana/encargo.txt": {
        owner: "ana", group: "ana", mtime: D,
        content: [
          "MIGRACION DE LA INTRANET A CONTENEDORES",
          "",
          "Objetivo: que la intranet deje de depender de como este instalado",
          "el servidor. Todo en contenedores, y que se pueda levantar igual",
          "en cualquier maquina.",
          "",
          "Pasos:",
          "  1. Probar una imagen oficial de nginx y entender el ciclo de vida.",
          "  2. Levantar la base de datos SIN perder los datos al recrearla.",
          "  3. Construir nuestra propia imagen a partir del Dockerfile.",
          "  4. Levantar toda la pila de una vez con Docker Compose.",
          "",
          "El proyecto esta en ~/intranet y la pila, en ~/pila.",
          ""
        ].join("\n")
      },

      "/home/ana/intranet": { dir: true, owner: "ana", group: "ana", mtime: D },
      "/home/ana/intranet/Dockerfile": {
        owner: "ana", group: "ana", mtime: D,
        content: [
          "# Imagen de la intranet de TecnoAtlantica",
          "FROM nginx:1.27",
          "COPY index.html /usr/share/nginx/html/index.html",
          "EXPOSE 80",
          "CMD [\"nginx\", \"-g\", \"daemon off;\"]",
          ""
        ].join("\n")
      },
      "/home/ana/intranet/index.html": {
        owner: "ana", group: "ana", mtime: D,
        content: [
          "<!DOCTYPE html>",
          "<html lang=\"es\">",
          "<head><meta charset=\"utf-8\"><title>Intranet TecnoAtlantica</title></head>",
          "<body><h1>Intranet de TecnoAtlantica</h1></body>",
          "</html>",
          ""
        ].join("\n")
      },

      "/home/ana/pila": { dir: true, owner: "ana", group: "ana", mtime: D },
      "/home/ana/pila/compose.yaml": {
        owner: "ana", group: "ana", mtime: D,
        content: [
          "services:",
          "  web:",
          "    image: nginx:1.27",
          "    ports:",
          "      - \"8000:80\"",
          "  cache:",
          "    image: redis:7",
          "  base:",
          "    image: mariadb:11",
          "    environment:",
          "      - MARIADB_ROOT_PASSWORD=Atl4nte",
          "    volumes:",
          "      - datos-pila:/var/lib/mysql",
          "",
          "volumes:",
          "  datos-pila:",
          ""
        ].join("\n")
      },

      "/etc": { dir: true, owner: "root", group: "root" },
      "/etc/hostname": { owner: "root", group: "root", content: "srv-docker\n" },
      "/var": { dir: true, owner: "root", group: "root" },
      "/var/lib": { dir: true, owner: "root", group: "root" },
      "/tmp": { dir: true, owner: "root", group: "root", mode: 0o1777 },
      "/root": { dir: true, owner: "root", group: "root", mode: 0o700 }
    });
  };
})(this);
