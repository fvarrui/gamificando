/* ==========================================================
   Arranque del reto: se apoya entero en RG.Sandbox.
   ========================================================== */
(function (global) {
  "use strict";
  var RG = global.RG, PL = global.PL;

  PL.S = RG.Sandbox({
    shell: "bash",
    cfg: PL.cfg,
    build: PL.build,
    missions: PL.MISSIONS,
    phases: PL.PHASES,
    levels: PL.LEVELS,
    badges: PL.BADGES,
    hintCost: PL.HINT_COST,
    riskyPenalty: PL.RISKY_PENALTY,
    proactiveBonus: PL.PROACTIVE_BONUS,
    fastTimeMs: PL.FAST_TIME_MS,
    admin: false,
    sudo: true,
    watch: PL.watch,

    man: RG.manPages("ls", "cd", "pwd", "stat", "file", "cat", "less", "head", "tail", "find", "grep",
      "mkdir", "touch", "cp", "mv", "rm", "echo", "nano", "man", "id", "groups", "whoami",
      "chmod", "chown", "chgrp", "umask", "getfacl", "setfacl", "sudo", "tree", "wc"),

    helpTitle: "Órdenes disponibles en esta consola",
    helpGroups: [
      ["Mirar", ["ls -l", "stat", "find -perm", "getfacl", "id", "groups", "tree"]],
      ["Permisos clásicos", ["chmod", "chown", "chgrp", "umask"]],
      ["Listas de control de acceso", ["getfacl", "setfacl -m", "setfacl -x", "setfacl -d -m", "setfacl -b"]],
      ["Ficheros", ["cat", "less", "head", "tail", "touch", "mkdir", "cp", "mv", "rm", "nano"]],
      ["Privilegios", ["sudo <orden>"]],
      ["Ayuda", ["man <orden>", "help", "history", "clear"]]
    ],

    labels: {
      stripIcon: "🔐 TAREA",
      wait: "En curso: resuélvelo desde la consola.",
      next: "Esperando la siguiente petición…",
      report: "📋 Ver informe del bastionado",
      emptyLog: "Aún no hay tareas.",
      idle: "Conectando con srv-datos…",
      idleIcon: "🔐",
      done: function () { return "✓ Permisos ajustados"; },
      msgHead: function (m) { return "Mensaje de " + m.source + ":"; }
    },

    boot: [
      [0, "dim", "Ubuntu 24.04.1 LTS  srv-datos  tty1"],
      [400, "text", "ana@srv-datos · servidor de archivos · instalado el 2 de octubre por Insular Sistemas S.L."],
      [800, "text", ""],
      [900, "warn", "*** AVISO: auditoría de permisos pendiente. La carpeta /srv/proyectos está abierta a todo el mundo. ***"]
    ],

    badgesOf: function (S, got) {
      var dir = S.vfs.get("/srv/proyectos", []);
      var pres = S.vfs.get("/srv/proyectos/presupuesto.csv", []);
      /* Mínimo privilegio: ventas solo lee y Darío solo atraviesa */
      var ventasSoloLectura = !!pres && !!pres.acl && pres.acl.some(function (e) {
        return e.kind === "group" && e.name === "ventas" && e.perms === "r";
      });
      var darioSoloPaso = !!dir && !!dir.acl && dir.acl.some(function (e) {
        return e.kind === "user" && e.name === "dario" && e.perms === "x";
      });
      got.minimal = ventasSoloLectura && darioSoloPaso && S.game.risky.length === 0;
      got.inherit = !!dir && !!dir.dacl && dir.dacl.some(function (e) {
        return e.kind === "group" && e.name === "proyectos";
      });
    },

    debriefText: function (S, got, doneCount) {
      var t = {};
      var claves = S.vfs.get("/srv/proyectos/privado/claves.txt", []);
      t.title = got.clean ? "Carpeta compartida bajo control" : "Carpeta bastionada… con algún agujero";
      if (got.clean && got.self) {
        t.msg = "Impecable: la carpeta pertenece al equipo, el SGID mantiene el grupo en lo que se cree, ventas lee el presupuesto sin poder tocarlo " +
          "y Darío llega al acta sin ver nada más. Y todo sin pedir una sola pista.";
      } else if (got.clean) {
        t.msg = "La carpeta de proyectos ya no está abierta de par en par: dueños y grupos correctos, permisos ajustados, ACL a medida para quien las necesitaba " +
          "y una ACL por omisión para lo que se cree mañana.";
      } else {
        t.msg = "El bastionado está hecho, pero por el camino se concedieron permisos de más. En seguridad, cada permiso que sobra es una puerta abierta: " +
          "revisa abajo qué pasó.";
      }
      if (claves && (claves.mode & 0o077) !== 0) {
        t.msg += " Ojo: el fichero de credenciales sigue siendo accesible para el grupo o para el resto del sistema.";
      }
      if (!got.inherit) {
        t.msg += " Y no olvides la ACL por omisión: sin ella, los ficheros que se creen mañana volverán a nacer sin permisos para el equipo.";
      }
      t.noRisky = "Ninguna: " + doneCount + " tareas resueltas dando a cada cual solo lo que necesitaba.";
      return t;
    }
  }).init();
})(this);
