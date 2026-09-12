/* ==========================================================
   Datos del escenario: equipo, rutas, servidor y ficheros
   iniciales del proyecto ~/scripts-blindaje.
   ========================================================== */
(function (global) {
  "use strict";
  var VG = global.VG = global.VG || {};

  VG.cfg = {
    HOST: "dev-tecnoatlantica",
    USER: "hamilton",
    HOME: "/home/hamilton",
    REPO_NAME: "scripts-blindaje",
    REPO_DIR: "/home/hamilton/scripts-blindaje",
    REMOTE_URLS: [
      "git@git.tecnoatlantica.local:blueteam/scripts-blindaje.git",
      "https://git.tecnoatlantica.local/blueteam/scripts-blindaje.git"
    ],
    REMOTE_HOST: "git.tecnoatlantica.local",
    GIT_VERSION: "2.43.0",
    CLOCK_BASE: new Date(2026, 8, 14, 9, 0, 0),   // lun 14 sep 2026, 09:00:00
    TZ: "+0100",                                   // hora de Canarias en septiembre
    TZ_NAME: "WEST",
    IKER: { name: "Arnold Schwarzenegger", email: "arnold.alonso@tecnoatlantica.local" },
    NAYRA: { name: "Sigourney Weaver", email: "weaver.suarez@tecnoatlantica.local" }
  };

  /* Contenido inicial de ~/scripts-blindaje (sistema de ficheros plano) */
  VG.INITIAL_FILES = {
    "README.md": [
      "# scripts-blindaje",
      "",
      "Scripts de bastionado del servidor srv-tecnoatlantica-01 (Blue Team).",
      "",
      "- firewall.sh: reglas del cortafuegos (ufw)",
      "- servicios.conf: servicios permitidos en el servidor",
      ""
    ].join("\n"),
    "firewall.sh": [
      "#!/bin/bash",
      "# Reglas de cortafuegos de srv-tecnoatlantica-01",
      "ufw default deny incoming",
      "ufw default allow outgoing",
      "ufw allow 22/tcp     # SSH (administración)",
      "ufw allow 443/tcp    # HTTPS (web corporativa)",
      "ufw allow 23/tcp     # Telnet (¿quién sigue usando esto?)",
      "ufw --force enable",
      ""
    ].join("\n"),
    "servicios.conf": [
      "# Servicios del servidor srv-tecnoatlantica-01",
      "ssh=activo",
      "https=activo",
      "mysql=activo",
      "ftp=activo",
      "telnet=activo",
      ""
    ].join("\n"),
    "secretos.env": [
      "DB_USER=admin",
      "DB_PASSWORD=Atl4nt1c@2019",
      "API_TOKEN=tk_live_8f2a91c4e7d05b36",
      ""
    ].join("\n"),
    "debug.log": [
      "[2026-09-13 22:14:03] firewall.sh ejecutado por root",
      "[2026-09-13 22:14:03] AVISO: la regla 23/tcp ya existe",
      "[2026-09-13 22:14:04] Cortafuegos activo",
      ""
    ].join("\n"),
    "backup_2019.sh": [
      "#!/bin/bash",
      "# Copia de seguridad antigua (sustituida por el sistema de backup central)",
      "tar czf /tmp/backup-$(date +%F).tgz /etc",
      ""
    ].join("\n")
  };

  VG.HOME_FILES = {
    ".bashrc": "# ~/.bashrc: ejecutado por bash para shells interactivos\nexport EDITOR=nano\nalias ll='ls -la'\n",
    ".profile": "# ~/.profile\nif [ -f ~/.bashrc ]; then . ~/.bashrc; fi\n"
  };

  VG.COMMANDS = ["cat", "cd", "clear", "cp", "date", "echo", "exit", "git", "grep", "head", "help", "history", "ls",
    "man", "mv", "nano", "pwd", "rm", "sed", "tail", "touch", "wc", "whoami"];
  VG.GIT_COMMANDS = ["add", "blame", "branch", "cat-file", "check-ignore", "checkout", "cherry-pick", "clean", "commit",
    "config", "diff", "fetch", "help", "init", "log", "ls-files", "merge", "mv", "pull", "push", "rebase", "reflog",
    "remote", "reset", "restore", "rev-parse", "revert", "rm", "show", "stash", "status", "switch", "tag"];
})(this);
