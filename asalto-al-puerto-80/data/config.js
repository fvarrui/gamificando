/* ==========================================================
   Escenario: guardia nocturna. La web corporativa no responde
   y hay un servicio que no debería estar ahí ocupándole el
   puerto 80.
   ========================================================== */
(function (global) {
  "use strict";
  var SL = global.SL = global.SL || {};

  SL.cfg = {
    HOST: "srv-web",
    USER: "hamilton",
    HOME: "/home/hamilton",
    CWD: "/home/hamilton",
    TEAM: "Guardia de sistemas",
    TERM_TITLE: "ssh",
    TZ_NAME: "WEST",
    UMASK: 0o022,
    CLOCK_BASE: new Date(2026, 9, 14, 3, 12, 0),   // mié 14 oct 2026, 03:12
    BASE_PROCESSES: [
      { user: "root", pid: 1, cmd: "/sbin/init", name: "systemd" },
      { user: "hamilton", pid: 3120, cmd: "-bash", name: "bash" }
    ]
  };

  var D = new Date(2026, 9, 13, 20, 0, 0).getTime();

  SL.build = function (S) {
    S.sys.load({
      groups: [
        { name: "root", gid: 0, system: true },
        { name: "sudo", gid: 27, system: true },
        { name: "sistemas", gid: 1000, description: "Administración de sistemas" },
        { name: "hamilton", gid: 1100 }
      ],
      users: [
        { name: "root", uid: 0, group: "root", home: "/root", system: true },
        { name: "hamilton", uid: 1100, group: "hamilton", home: "/home/hamilton", comment: "Linda Hamilton · Guardia" },
        { name: "www-data", uid: 33, group: "www-data", home: "/var/www", shell: "/usr/sbin/nologin", system: true }
      ],
      members: [["sudo", "hamilton"], ["sistemas", "hamilton"]],
      services: [
        {
          name: "ssh", display: "OpenBSD Secure Shell server", state: "running", startup: "auto",
          pid: 812, user: "root", cmd: "/usr/sbin/sshd -D",
          description: "Acceso remoto por SSH",
          log: [
            "oct 13 20:01:02 srv-web sshd[812]: Server listening on 0.0.0.0 port 22.",
            "oct 14 03:10:41 srv-web sshd[812]: Accepted publickey for hamilton from 192.168.10.5"
          ]
        },
        {
          /* Instalado «para una prueba» hace meses: ocupa el puerto 80 */
          name: "apache2", display: "The Apache HTTP Server", state: "running", startup: "auto",
          pid: 1044, user: "www-data", cmd: "/usr/sbin/apache2 -k start",
          description: "Servidor web Apache (instalado para una prueba)",
          log: [
            "oct 13 19:58:11 srv-web systemd[1]: Started The Apache HTTP Server.",
            "oct 13 19:58:11 srv-web apache2[1044]: Server configured, listening on 0.0.0.0:80"
          ]
        },
        {
          /* La web corporativa: no arranca porque el 80 está ocupado */
          name: "nginx", display: "nginx - high performance web server", state: "stopped", startup: "manual",
          pid: null, user: "root", cmd: "/usr/sbin/nginx -g daemon off;",
          description: "Servidor web de la intranet corporativa",
          failReason: "nginx: [emerg] bind() to 0.0.0.0:80 failed (98: Address already in use)",
          log: [
            "oct 14 03:05:22 srv-web systemd[1]: Starting nginx - high performance web server...",
            "oct 14 03:05:22 srv-web nginx[2871]: nginx: [emerg] bind() to 0.0.0.0:80 failed (98: Address already in use)",
            "oct 14 03:05:22 srv-web systemd[1]: nginx.service: Failed with result 'exit-code'.",
            "oct 14 03:05:22 srv-web systemd[1]: Failed to start nginx - high performance web server."
          ]
        },
        {
          name: "mariadb", display: "MariaDB 10.11 database server", state: "running", startup: "auto",
          pid: 950, user: "mysql", cmd: "/usr/sbin/mariadbd",
          description: "Base de datos de la intranet",
          log: ["oct 13 19:57:40 srv-web mariadbd[950]: ready for connections."]
        },
        {
          /* Servicio de impresión en un servidor sin impresoras */
          name: "cups", display: "CUPS Scheduler", state: "running", startup: "auto",
          pid: 1120, user: "root", cmd: "/usr/sbin/cupsd -l",
          description: "Servicio de impresión (no hay impresoras en este servidor)",
          log: ["oct 13 19:58:30 srv-web cupsd[1120]: Listening to 0.0.0.0:631"]
        },
        {
          name: "fail2ban", display: "Fail2Ban Service", state: "stopped", startup: "disabled",
          pid: null, user: "root", cmd: "/usr/bin/fail2ban-server",
          description: "Bloqueo automático de intentos de acceso por fuerza bruta",
          log: ["oct 10 09:00:00 srv-web systemd[1]: fail2ban.service: Deactivated successfully."]
        }
      ]
    });

    S.vfs.build({
      "/home": { dir: true, owner: "root", group: "root" },
      "/home/hamilton": { dir: true, owner: "hamilton", group: "hamilton", mode: 0o750, mtime: D },
      "/home/hamilton/guardia.txt": {
        owner: "hamilton", group: "hamilton", mtime: D,
        content: [
          "PARTE DE GUARDIA · noche del 13 al 14 de octubre",
          "",
          "03:05  Aviso: la intranet (https://intranet.tecnoatlantica.local) no responde.",
          "03:10  Conectada por SSH a srv-web.",
          "",
          "Pendiente:",
          "  - Averiguar por que no arranca nginx.",
          "  - Revisar que servicios estan corriendo y si deben estarlo.",
          "  - Dejar el arranque automatico bien configurado antes de terminar.",
          ""
        ].join("\n")
      },
      "/etc": { dir: true, owner: "root", group: "root" },
      "/etc/hostname": { owner: "root", group: "root", content: "srv-web\n" },
      "/etc/nginx": { dir: true, owner: "root", group: "root" },
      "/etc/nginx/nginx.conf": {
        owner: "root", group: "root", mtime: D,
        content: [
          "server {",
          "    listen 80;",
          "    server_name intranet.tecnoatlantica.local;",
          "    root /var/www/intranet;",
          "}",
          ""
        ].join("\n")
      },
      "/var": { dir: true, owner: "root", group: "root" },
      "/var/www": { dir: true, owner: "www-data", group: "www-data" },
      "/var/log": { dir: true, owner: "root", group: "root" },
      "/tmp": { dir: true, owner: "root", group: "root", mode: 0o1777 },
      "/root": { dir: true, owner: "root", group: "root", mode: 0o700 }
    });
  };
})(this);
