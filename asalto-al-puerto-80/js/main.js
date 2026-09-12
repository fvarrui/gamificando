/* ==========================================================
   Arranque del reto: se apoya entero en RG.Sandbox.
   ========================================================== */
(function (global) {
  "use strict";
  var RG = global.RG, SL = global.SL;

  SL.S = RG.Sandbox({
    shell: "bash",
    cfg: SL.cfg,
    build: SL.build,
    missions: SL.MISSIONS,
    phases: SL.PHASES,
    levels: SL.LEVELS,
    badges: SL.BADGES,
    hintCost: SL.HINT_COST,
    riskyPenalty: SL.RISKY_PENALTY,
    proactiveBonus: SL.PROACTIVE_BONUS,
    fastTimeMs: SL.FAST_TIME_MS,
    sudo: true,
    watch: SL.watch,

    man: RG.manPages("systemctl", "journalctl", "service", "ps", "kill", "sudo", "ls", "cd", "cat",
      "grep", "find", "man", "echo", "nano", "head", "tail", "wc", "history", "id", "whoami"),

    helpTitle: "Órdenes disponibles en esta consola",
    helpGroups: [
      ["Consultar", ["systemctl status <svc>", "systemctl is-active <svc>", "systemctl is-enabled <svc>", "systemctl list-units --type=service"]],
      ["Gobernar ahora", ["systemctl start <svc>", "systemctl stop <svc>", "systemctl restart <svc>"]],
      ["Gobernar el arranque", ["systemctl enable <svc>", "systemctl disable <svc>", "--now"]],
      ["Registros", ["journalctl -u <svc>", "journalctl -u <svc> -n 20"]],
      ["Procesos", ["ps aux", "kill <pid>"]],
      ["Ficheros y ayuda", ["cat", "grep", "echo >>", "nano", "man <orden>", "help", "clear"]]
    ],

    labels: {
      stripIcon: "🛠 TAREA",
      wait: "En curso: resuélvelo desde la consola.",
      next: "Esperando la siguiente indicación…",
      report: "📋 Ver parte de guardia",
      emptyLog: "Aún no hay tareas.",
      idle: "Conectando con srv-web por SSH…",
      idleIcon: "🌙",
      done: function () { return "✓ Resuelto"; },
      msgHead: function (m) { return "Mensaje de " + m.source + ":"; }
    },

    boot: [
      [0, "dim", "Connecting to srv-web.tecnoatlantica.local port 22..."],
      [500, "ok", "Authenticated to 192.168.30.22 using \"publickey\"."],
      [900, "text", "Ubuntu 24.04.1 LTS (GNU/Linux 6.8.0-45-generic x86_64)"],
      [1200, "text", ""],
      [1300, "warn", "*** INCIDENCIA ABIERTA 03:05 · la intranet no responde. Toda la sesión queda registrada. ***"]
    ],

    badgesOf: function (S, got) {
      got.logs = !!S.state.flags.leyoRegistro;
      /* Sobrevive al reinicio: lo que debe arrancar solo, habilitado; lo que no, deshabilitado */
      function enab(n) {
        var s = S.sys.service(n);
        return !!s && s.startup === "auto";
      }
      got.boot = enab("nginx") && enab("fail2ban") && enab("mariadb") && enab("ssh") &&
        !enab("apache2") && !enab("cups");
    },

    onComplete: function (S, i, m) {
      if (m.code === "SVC-03") { S.state.flags.leyoRegistro = true; }
    },

    debriefText: function (S, got, doneCount) {
      var t = {};
      var nginx = S.sys.service("nginx");
      var apache = S.sys.service("apache2");
      t.title = got.clean ? "Guardia cerrada, intranet en pie" : "Intranet en pie… con daños colaterales";
      if (got.clean && got.self) {
        t.msg = "Impecable: diagnosticaste el conflicto de puertos leyendo el registro, liberaste el 80, levantaste la intranet y dejaste " +
          "el arranque configurado para que el servidor despierte bien solo. Y sin pedir una sola pista.";
      } else if (got.clean) {
        t.msg = "Incidencia cerrada: la intranet responde, Apache ya no volverá a robarle el puerto, fail2ban vigila los accesos y el servicio " +
          "de impresión ha dejado de exponer un puerto que nadie usaba.";
      } else {
        t.msg = "La intranet volvió, pero por el camino se detuvo algo que la empresa necesitaba. En una guardia, eso también es una caída: " +
          "revisa abajo las decisiones anotadas.";
      }
      if (nginx && nginx.startup !== "auto") {
        t.msg += " Ojo: nginx sigue sin estar habilitado, así que la intranet no arrancará sola en el próximo reinicio.";
      }
      if (apache && apache.startup === "auto") {
        t.msg += " Y Apache sigue habilitado: volverá a arrancar y a ocupar el puerto 80 en cuanto el servidor se reinicie.";
      }
      t.noRisky = "Ninguna: " + doneCount + " tareas resueltas sin tumbar ningún servicio necesario.";
      return t;
    }
  }).init();
})(this);
