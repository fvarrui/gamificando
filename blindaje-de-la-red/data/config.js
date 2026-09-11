/* ==========================================================
   Datos del escenario: el servidor comprometido, sus servicios
   en escucha y los ficheros que se pueden leer.
   ========================================================== */
(function (global) {
  "use strict";
  var BD = global.BD = global.BD || {};

  BD.cfg = {
    HOSTNAME: "srv-tecnoatlantica-01",
    IP: "192.168.30.15",
    LOCAL_PROMPT: "blueteam@soc-console:~$ ",
    SHELL_PID: 2051,
    CLOCK_BASE: new Date(2026, 8, 10, 3, 22, 41),   // jue 10 sep 2026, 03:22:41
    TZ_NAME: "UTC"
  };

  /* Los 8 servicios en escucha. "legitimate" = necesario para el negocio:
     cerrarlo es una decisión arriesgada. "svc" es el nombre que muestran
     netstat/ss sin -n. "aliases" son los nombres válidos para systemctl. */
  BD.PORTS_TEMPLATE = [
    { id: 22,   addr: "0.0.0.0",   pid: 812,  process: "sshd",       svc: "ssh",           user: "root",  cmd: "sshd: /usr/sbin/sshd -D [listener] 0 of 10-100 startups", legitimate: true,  aliases: ["ssh", "sshd"] },
    { id: 23,   addr: "0.0.0.0",   pid: 1044, process: "in.telnetd", svc: "telnet",        user: "root",  cmd: "/usr/sbin/in.telnetd",                                   legitimate: false, aliases: ["inetd", "openbsd-inetd", "telnet", "in.telnetd", "telnetd"] },
    { id: 21,   addr: "0.0.0.0",   pid: 1050, process: "vsftpd",     svc: "ftp",           user: "root",  cmd: "/usr/sbin/vsftpd /etc/vsftpd.conf",                      legitimate: false, aliases: ["vsftpd", "ftp"] },
    { id: 80,   addr: "0.0.0.0",   pid: 1102, process: "apache2",    svc: "http",          user: "root",  cmd: "/usr/sbin/apache2 -k start",                             legitimate: false, aliases: ["apache2", "apache", "httpd"] },
    { id: 443,  addr: "0.0.0.0",   pid: 1105, process: "nginx",      svc: "https",         user: "root",  cmd: "nginx: master process /usr/sbin/nginx",                  legitimate: true,  aliases: ["nginx"] },
    { id: 445,  addr: "0.0.0.0",   pid: 1180, process: "smbd",       svc: "microsoft-ds",  user: "root",  cmd: "/usr/sbin/smbd --foreground --no-process-group",         legitimate: false, aliases: ["smbd", "smb", "samba"] },
    { id: 3389, addr: "0.0.0.0",   pid: 1210, process: "xrdp",       svc: "ms-wbt-server", user: "xrdp",  cmd: "/usr/sbin/xrdp",                                         legitimate: false, aliases: ["xrdp", "rdp"] },
    { id: 3306, addr: "127.0.0.1", pid: 940,  process: "mysqld",     svc: "mysql",         user: "mysql", cmd: "/usr/sbin/mysqld",                                       legitimate: true,  aliases: ["mysql", "mysqld", "mariadb"] }
  ];

  /* Procesos del sistema que aparecen en «ps» pero no abren puertos */
  BD.SYSTEM_PROCS = [
    { user: "root", pid: 1,     cmd: "/sbin/init" },
    { user: "root", pid: 402,   cmd: "/usr/lib/systemd/systemd-journald" },
    { user: "root", pid: 655,   cmd: "/usr/sbin/cron -f" },
    { user: "syslog", pid: 671, cmd: "/usr/sbin/rsyslogd -n" }
  ];

  BD.FILES = {
    "informe_incidente.txt": [
      "INFORME PRELIMINAR DE INCIDENTE — SOC TecnoAtlántica",
      "",
      "[2026-09-08 03:14:07] ALERTA: tráfico anómalo detectado en la interfaz eth0.",
      "[2026-09-08 03:14:12] IP externa sospechosa: 185.220.101.47 (nodo de salida Tor).",
      "[2026-09-08 03:15:44] Aumento repentino de conexiones entrantes a puertos de administración.",
      "[2026-09-08 03:16:02] Blue Team notificado. Iniciar protocolo de contención.",
      "",
      "Estado: ABIERTO · Prioridad: ALTA · Responsable: Blue Team"
    ].join("\n"),
    ".bash_history": [
      "apt install vsftpd",
      "nano /etc/vsftpd.conf        # anonymous_enable=YES (temporal, para las pruebas)",
      "systemctl restart vsftpd",
      "apt install xrdp",
      "systemctl enable --now xrdp",
      "apt install telnetd         # para el switch antiguo del almacén",
      "systemctl status apache2",
      "exit"
    ].join("\n")
  };

  BD.LS_LA = [
    "total 36",
    "drwx------  5 root root 4096 sep 10 02:58 .",
    "drwxr-xr-x 20 root root 4096 ago 22 09:10 ..",
    "-rw-------  1 root root  412 sep 10 03:05 .bash_history",
    "-rw-r--r--  1 root root 3106 abr 22  2024 .bashrc",
    "drwx------  2 root root 4096 mar 14 11:02 .ssh",
    "-rw-r--r--  1 root root  548 sep 10 03:16 informe_incidente.txt"
  ].join("\n");

  BD.COMMANDS = ["cat", "clear", "date", "echo", "exit", "help", "history", "hostname", "id", "iptables",
    "kill", "logout", "ls", "man", "netstat", "ps", "pwd", "service", "ss", "sudo", "systemctl",
    "ufw", "uname", "uptime", "whoami"];
})(this);
