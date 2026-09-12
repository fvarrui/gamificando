/* ==========================================================
   Escenario: el servidor de prácticas de TecnoAtlántica.
   Aquí se define el equipo, las cuentas y el árbol de ficheros
   con el que empieza la partida.
   ========================================================== */
(function (global) {
  "use strict";
  var LX = global.LX = global.LX || {};

  LX.cfg = {
    HOST: "srv-practicas",
    USER: "practicas",
    HOME: "/home/practicas",
    CWD: "/home/practicas",
    TEAM: "Nayra Suárez (administradora de sistemas)",
    TERM_TITLE: "bash",
    TZ_NAME: "WEST",
    UMASK: 0o022,
    CLOCK_BASE: new Date(2026, 8, 14, 9, 5, 0),   // lun 14 sep 2026, 09:05
    BASE_PROCESSES: [
      { user: "root", pid: 1, cmd: "/sbin/init", name: "systemd" },
      { user: "practicas", pid: 1841, cmd: "-bash", name: "bash" }
    ]
  };

  var D = new Date(2026, 8, 11, 17, 12, 0).getTime();   // vie 11 sep 2026
  var D2 = new Date(2026, 8, 13, 8, 30, 0).getTime();   // dom 13 sep 2026

  /* Construye el sistema simulado al empezar cada partida */
  LX.build = function (S) {
    S.sys.load({
      groups: [
        { name: "root", gid: 0, system: true },
        { name: "sistemas", gid: 1000, description: "Equipo de sistemas" },
        { name: "practicas", gid: 1001 },
        { name: "alumnado", gid: 1002, description: "Personas en prácticas" }
      ],
      users: [
        { name: "root", uid: 0, group: "root", home: "/root", shell: "/bin/bash", system: true },
        { name: "nayra", uid: 1000, group: "sistemas", home: "/home/nayra", comment: "Nayra Suárez" },
        { name: "practicas", uid: 1001, group: "practicas", home: "/home/practicas", comment: "Cuenta de prácticas" }
      ],
      members: [["alumnado", "practicas"], ["sistemas", "nayra"]]
    });

    S.vfs.build({
      "/home": { dir: true, owner: "root", group: "root" },
      "/home/nayra": { dir: true, owner: "nayra", group: "sistemas", mode: 0o750 },
      "/home/practicas": { dir: true, owner: "practicas", group: "practicas", mode: 0o755, mtime: D2 },

      "/home/practicas/bienvenida.txt": {
        owner: "practicas", group: "practicas", mtime: D2,
        content: [
          "Bienvenida a TecnoAtlántica",
          "===========================",
          "",
          "Este es el servidor de prácticas. Todo lo que hay aquí es una copia:",
          "puedes trastear sin miedo a romper nada de producción.",
          "",
          "Tu carpeta personal es /home/practicas. Dentro tienes:",
          "  documentos/  informes y notas del equipo",
          "  registros/   copias de los registros del servidor",
          "  scripts/     pequeños scripts de mantenimiento",
          "  tareas/      lo que te vaya encargando el equipo",
          "",
          "Nayra Suárez, administradora de sistemas",
          ""
        ].join("\n")
      },

      "/home/practicas/documentos": { dir: true, owner: "practicas", group: "practicas", mtime: D },
      "/home/practicas/documentos/informe-red.txt": {
        owner: "practicas", group: "practicas", mtime: D,
        content: [
          "INFORME DE RED · TecnoAtlántica · septiembre 2026",
          "",
          "Sede de Las Palmas",
          "  Switch principal .......... operativo",
          "  Punto de acceso planta 1 .. operativo",
          "  Punto de acceso planta 2 .. AVERIA (pendiente de RMA)",
          "",
          "Sede de Santa Cruz",
          "  Switch principal .......... operativo",
          "  Enlace de respaldo ........ AVERIA (fibra cortada en obra)",
          "",
          "Resumen: 2 incidencias abiertas, 3 elementos operativos.",
          ""
        ].join("\n")
      },
      "/home/practicas/documentos/notas.md": {
        owner: "practicas", group: "practicas", mtime: D,
        content: [
          "# Notas del equipo",
          "",
          "- La copia de seguridad se lanza cada noche a las 03:00.",
          "- Los registros se rotan los domingos.",
          "- TODO: revisar el informe de red antes del viernes.",
          "- TODO: pedir el RMA del punto de acceso averiado.",
          ""
        ].join("\n")
      },
      "/home/practicas/documentos/presupuesto.csv": {
        owner: "practicas", group: "practicas", mtime: D,
        content: [
          "concepto;unidades;euros",
          "Switch 24 puertos;2;540",
          "Punto de acceso wifi;4;360",
          "Latiguillos cat6;40;120",
          "Horas de instalacion;16;640",
          ""
        ].join("\n")
      },

      "/home/practicas/registros": { dir: true, owner: "practicas", group: "practicas", mtime: D2 },
      "/home/practicas/registros/acceso.log": {
        owner: "practicas", group: "practicas", mtime: D2,
        content: [
          "2026-09-13 07:58:02 INFO  sesion iniciada usuario=nayra origen=192.168.10.5",
          "2026-09-13 08:01:44 INFO  sesion iniciada usuario=practicas origen=192.168.10.31",
          "2026-09-13 08:14:09 WARN  intento fallido usuario=admin origen=10.20.30.40",
          "2026-09-13 08:14:12 WARN  intento fallido usuario=admin origen=10.20.30.40",
          "2026-09-13 08:14:15 ERROR bloqueo temporal origen=10.20.30.40",
          "2026-09-13 09:02:27 INFO  sesion cerrada usuario=nayra",
          "2026-09-13 11:41:03 WARN  intento fallido usuario=root origen=10.20.30.40",
          "2026-09-13 12:00:00 INFO  rotacion de registros completada",
          ""
        ].join("\n")
      },
      "/home/practicas/registros/sistema.log": {
        owner: "practicas", group: "practicas", mtime: D2,
        content: [
          "2026-09-13 03:00:01 INFO  copia de seguridad iniciada",
          "2026-09-13 03:18:44 INFO  copia de seguridad completada (18 min)",
          "2026-09-13 06:30:00 INFO  actualizacion de paquetes disponible",
          "2026-09-13 07:00:12 ERROR disco /dev/sdb al 91% de ocupacion",
          "2026-09-13 10:22:31 INFO  servicio web reiniciado",
          ""
        ].join("\n")
      },
      "/home/practicas/registros/errores.log": {
        owner: "practicas", group: "practicas", mtime: D2,
        content: [
          "2026-09-12 22:10:05 ERROR no se pudo montar /mnt/copias",
          "2026-09-13 07:00:12 ERROR disco /dev/sdb al 91% de ocupacion",
          "2026-09-13 08:14:15 ERROR bloqueo temporal origen=10.20.30.40",
          ""
        ].join("\n")
      },

      "/home/practicas/scripts": { dir: true, owner: "practicas", group: "practicas", mtime: D },
      "/home/practicas/scripts/copia.sh": {
        owner: "practicas", group: "practicas", mode: 0o755, mtime: D,
        content: [
          "#!/bin/bash",
          "# Copia los documentos a /mnt/copias",
          "rsync -a /home/practicas/documentos/ /mnt/copias/documentos/",
          ""
        ].join("\n")
      },
      "/home/practicas/scripts/limpiar.sh": {
        owner: "practicas", group: "practicas", mode: 0o755, mtime: D,
        content: [
          "#!/bin/bash",
          "# Borra los registros de más de 30 dias",
          "find /var/log -name '*.log' -mtime +30 -delete",
          ""
        ].join("\n")
      },

      "/home/practicas/tareas": { dir: true, owner: "practicas", group: "practicas", mtime: D2 },
      "/home/practicas/tareas/pendientes.txt": {
        owner: "practicas", group: "practicas", mtime: D2,
        content: [
          "1. Leer el fichero de bienvenida",
          "2. Revisar el informe de red",
          "3. Preparar la carpeta de entregas",
          ""
        ].join("\n")
      },

      "/srv": { dir: true, owner: "root", group: "root" },
      "/srv/compartido": { dir: true, owner: "root", group: "sistemas", mode: 0o775 },
      "/srv/compartido/manual-consola.txt": {
        owner: "nayra", group: "sistemas", mtime: D,
        content: [
          "CHULETA DE CONSOLA · TecnoAtlántica",
          "",
          "pwd            dónde estoy",
          "ls -l          qué hay aquí, con detalle",
          "cd carpeta     entrar en una carpeta",
          "cd ..          subir un nivel",
          "cat fichero    ver un fichero entero",
          "less fichero   verlo por partes",
          "grep texto f   buscar texto dentro de un fichero",
          "find . -name   buscar ficheros por nombre",
          "man orden      manual completo de una orden",
          ""
        ].join("\n")
      },

      "/etc": { dir: true, owner: "root", group: "root" },
      "/etc/hostname": { owner: "root", group: "root", content: "srv-practicas\n" },
      "/etc/os-release": {
        owner: "root", group: "root",
        content: "PRETTY_NAME=\"Ubuntu 24.04.1 LTS\"\nNAME=\"Ubuntu\"\nVERSION_ID=\"24.04\"\n"
      },
      "/tmp": { dir: true, owner: "root", group: "root", mode: 0o777 },
      "/var": { dir: true, owner: "root", group: "root" },
      "/var/log": { dir: true, owner: "root", group: "root", mode: 0o755 },
      "/root": { dir: true, owner: "root", group: "root", mode: 0o700 }
    });
  };
})(this);
