/* ==========================================================
   Arranque del reto: se apoya entero en RG.Sandbox.
   ========================================================== */
(function (global) {
  "use strict";
  var RG = global.RG, UG = global.UG;

  UG.S = RG.Sandbox({
    shell: "bash",
    cfg: UG.cfg,
    build: UG.build,
    missions: UG.MISSIONS,
    phases: UG.PHASES,
    levels: UG.LEVELS,
    badges: UG.BADGES,
    hintCost: UG.HINT_COST,
    riskyPenalty: UG.RISKY_PENALTY,
    proactiveBonus: UG.PROACTIVE_BONUS,
    fastTimeMs: UG.FAST_TIME_MS,
    sudo: true,
    watch: UG.watch,

    man: RG.manPages("useradd", "usermod", "userdel", "passwd", "groupadd", "groupdel", "gpasswd",
      "getent", "id", "groups", "whoami", "sudo", "ls", "cd", "cat", "grep", "find", "man",
      "echo", "nano", "chmod", "chown", "chgrp", "history", "tree", "stat"),

    helpTitle: "Órdenes disponibles en esta consola",
    helpGroups: [
      ["Consultar", ["getent passwd", "getent group", "id", "groups", "passwd -S"]],
      ["Cuentas", ["useradd -m -s -c -G", "usermod -aG -s -L -U", "userdel -r", "passwd"]],
      ["Grupos", ["groupadd", "groupdel", "gpasswd -a", "gpasswd -d"]],
      ["Ficheros", ["ls -l", "cat", "grep", "find", "chown", "chgrp", "nano"]],
      ["Privilegios", ["sudo <orden>"]],
      ["Ayuda", ["man <orden>", "help", "history", "clear"]]
    ],

    labels: {
      stripIcon: "👥 TAREA",
      wait: "En curso: resuélvelo desde la consola.",
      next: "Esperando la siguiente petición…",
      report: "📋 Ver informe de la semana",
      emptyLog: "Aún no hay tareas.",
      idle: "Conectando con srv-datos…",
      idleIcon: "👥",
      done: function () { return "✓ Hecho" ; },
      msgHead: function (m) { return "Mensaje de " + m.source + ":"; }
    },

    boot: [
      [0, "dim", "Ubuntu 24.04.1 LTS  srv-datos  tty1"],
      [400, "text", "ana@srv-datos · miembro de sudo, sistemas y direccion"],
      [800, "text", ""],
      [900, "ok", "Semana de altas y bajas. El parte está en ~/altas.txt."]
    ],

    badgesOf: function (S, got) {
      var svc = S.sys.user("svc-backup");
      var dario = S.sys.user("dario");
      got.nolog = !!svc && /nologin|false/.test(svc.shell);
      got.soft = !!dario && !!dario.locked;
    },

    debriefText: function (S, got, doneCount) {
      var t = {};
      var visitas = S.sys.user("visitas");
      t.title = got.clean ? "Altas y bajas cerradas" : "Altas y bajas… con algún destrozo";
      if (got.clean && got.self) {
        t.msg = "Impecable: dos altas con su carpeta y su contraseña, los grupos repartidos sin llevarte por delante ninguna pertenencia, " +
          "la baja bloqueada en vez de borrada y una cuenta de servicio que no puede iniciar sesión. Sin pedir una sola pista.";
      } else if (got.clean) {
        t.msg = "La semana queda cerrada: Elena y Hugo tienen cuenta y grupos, la cuenta compartida ha desaparecido, la baja está bloqueada " +
          "y el servicio de copias tiene su propia identidad sin inicio de sesión.";
      } else {
        t.msg = "El trabajo está hecho, pero por el camino hubo movimientos que en un sistema real cuestan caros: " +
          "revisa abajo qué pasó y por qué importa.";
      }
      if (visitas) {
        t.msg += " Ojo: la cuenta compartida «visitas» sigue existiendo, con la misma contraseña que conoce todo el edificio.";
      }
      if (!got.nolog) {
        t.msg += " Y recuerda: una cuenta de servicio con shell de verdad es una puerta de entrada más.";
      }
      t.noRisky = "Ninguna: " + doneCount + " tareas resueltas sin perder pertenencias ni borrar de más.";
      return t;
    }
  }).init();
})(this);
