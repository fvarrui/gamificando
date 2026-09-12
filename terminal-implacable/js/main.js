/* ==========================================================
   Arranque del reto: se apoya entero en RG.Sandbox, que monta
   el sistema simulado, la terminal, el motor de tareas, las
   fases y el informe final.
   ========================================================== */
(function (global) {
  "use strict";
  var RG = global.RG, LX = global.LX;

  LX.S = RG.Sandbox({
    shell: "bash",
    cfg: LX.cfg,
    build: LX.build,
    missions: LX.MISSIONS,
    phases: LX.PHASES,
    levels: LX.LEVELS,
    badges: LX.BADGES,
    hintCost: LX.HINT_COST,
    riskyPenalty: LX.RISKY_PENALTY,
    proactiveBonus: LX.PROACTIVE_BONUS,
    fastTimeMs: LX.FAST_TIME_MS,
    admin: false,                 // en el primer día no se administra nada
    sudo: false,
    watch: LX.watch,

    man: RG.manPages("pwd", "ls", "cd", "tree", "cat", "less", "head", "tail", "wc", "file", "stat",
      "grep", "find", "mkdir", "rmdir", "touch", "cp", "mv", "rm", "echo", "nano", "man",
      "whoami", "id", "groups", "date", "history", "which", "sort", "uniq"),

    helpTitle: "Órdenes disponibles en esta consola",
    helpGroups: [
      ["Moverse", ["pwd", "ls", "cd", "tree"]],
      ["Leer", ["cat", "less", "head", "tail", "wc", "file", "stat"]],
      ["Buscar", ["grep", "find"]],
      ["Crear y organizar", ["mkdir", "rmdir", "touch", "cp", "mv", "rm", "echo", "nano"]],
      ["Saber quién eres", ["whoami", "id", "groups", "date"]],
      ["Ayuda y sesión", ["man", "history", "which", "clear", "help"]],
      ["Encadenar", ["orden | grep texto", "orden | wc -l", "orden > fichero", "orden >> fichero", "orden1 && orden2"]]
    ],

    labels: {
      stripIcon: "📋 TAREA",
      wait: "En curso: resuélvelo desde la consola.",
      next: "Esperando la siguiente tarea del equipo…",
      report: "📋 Ver informe de la jornada",
      emptyLog: "Aún no hay tareas.",
      idle: "Iniciando sesión en el servidor de prácticas…",
      idleIcon: "🐧",
      done: function () { return "✓ Tarea resuelta"; },
      msgHead: function () { return "Mensaje de Sigourney (Sistemas):"; }
    },

    boot: [
      [0, "dim", "Ubuntu 24.04.1 LTS  srv-practicas  tty1"],
      [400, "text", "hamilton@srv-practicas · último acceso: dom 13 sep 2026 08:01:44 desde 192.168.10.31"],
      [800, "text", ""],
      [900, "ok", "Sesión iniciada. Este es el servidor de prácticas: aquí no hay nada en producción."]
    ],

    badgesOf: function (S, got) {
      got.pipes = !!S.state.flags.usedPipe;
      got.tab = !!S.state.flags.usedTab;
    },

    debriefText: function (S, got, doneCount) {
      var t = {};
      t.title = got.clean ? "Primera jornada superada" : "Primera jornada… con algún borrado de más";
      if (got.clean && got.self) {
        t.msg = "Impecable: has recorrido el servidor, leído los registros, creado tus entregas y encadenado órdenes sin pedir una sola pista. " +
          "Ya sabes moverte por una consola de Linux sin depender del ratón.";
      } else if (got.clean) {
        t.msg = "Jornada completa: sabes orientarte, leer ficheros sin modificarlos, crear y ordenar carpetas, y filtrar información con tuberías. " +
          "Eso es exactamente lo que se espera de alguien en su primera semana.";
      } else {
        t.msg = "Has terminado las tareas, pero por el camino se perdió algún fichero que hacía falta. En consola no hay papelera: " +
          "antes de un rm conviene comprobar con ls qué se va a borrar.";
      }
      if (!got.pipes) {
        t.msg += " Para la próxima, practica las tuberías: encadenar órdenes es lo que convierte la consola en una herramienta de verdad.";
      }
      t.noRisky = "Ninguna: " + doneCount + " tareas resueltas sin perder ni un fichero.";
      return t;
    }
  }).init();
})(this);
