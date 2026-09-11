/* ==========================================================
   Lógica de las misiones y punto único de contención.
   Toda acción de contención (systemctl, service, kill, ufw,
   iptables) pasa por secure().
   ========================================================== */
(function (global) {
  "use strict";
  var RG = global.RG, BD = global.BD, util = RG.util;
  var state = BD.state, term = BD.term;

  /* Tras el reconocimiento: exige haber observado antes de actuar */
  BD.needsRecon = function () {
    if (state.reconDone) { return false; }
    term.fail("bash: ¿sobre qué servicio vas a actuar? Un Blue Team no actúa a ciegas: " +
      "ejecuta antes 'ss -tulpn' o 'netstat -tulpn' para ver qué está en escucha.");
    return true;
  };

  /* Punto único por el que pasa TODA acción de contención */
  BD.secure = function (p, method, newState) {
    if (newState === "filtered" && p.addr === "127.0.0.1") {
      term.sys("info", "ℹ " + p.process + " solo escucha en 127.0.0.1 (localhost): desde fuera ya no era " +
        "accesible, así que la regla no cambia nada.");
      return;
    }
    var wasSecured = p.state !== "open";
    if (newState === "stopped") { p.state = "stopped"; }
    else if (p.state === "open") { p.state = "filtered"; }
    if (wasSecured) { return; }
    state.families[method.family] = true;
    state.securedBy[p.id] = BD.shell.currentText || method.label;
    if (p.legitimate) {
      BD.game.addRisky("port" + p.id, p.process + " (" + p.id + "/tcp) es un servicio legítimo que la empresa " +
        "necesita, y lo has detenido o bloqueado con «" + state.securedBy[p.id] + "»");
      return;
    }
    BD.emit({ type: "secure", port: p.id, method: method });
  };

  /* Contenido + lógica = misiones del juego */
  BD.MISSIONS = BD.MISSION_CONTENT.map(function (m) {
    var full = util.copy(m);
    if (m.kind === "threat") {
      full.check = function () {
        var p = BD.findPort(m.port);
        return !!p && p.state !== "open";
      };
    } else {
      full.check = function (ev) { return !!ev && ev.type === "sockets"; };
    }
    return full;
  });
})(this);
