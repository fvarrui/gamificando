/* ==========================================================
   Estado del servidor simulado y montaje de terminal y shell.
   Cada servicio tiene un estado:
     open      en escucha y accesible
     filtered  sigue en escucha, pero el cortafuegos descarta el tráfico
     stopped   detenido
   ========================================================== */
(function (global) {
  "use strict";
  var RG = global.RG, BD = global.BD, util = RG.util, cfg = BD.cfg;

  var state = BD.state = {};
  BD.events = [];

  BD.resetState = function () {
    Object.keys(state).forEach(function (k) { delete state[k]; });
    state.ports = BD.PORTS_TEMPLATE.map(function (p) {
      var c = util.copy(p);
      c.state = "open";
      c.disabled = false;
      return c;
    });
    state.reconDone = false;
    state.fwRules = [];
    state.families = {};
    state.securedBy = {};
    state.usedMan = false;
    state.reopening = false;
    BD.events.length = 0;
  };
  BD.resetState();

  BD.emit = function (ev) { BD.events.push(ev); };

  /* ---------------- Reloj y fechas del sistema simulado ---------------- */
  BD.clock = RG.Clock(RG.$("clock"));
  BD.fakeNow = function () { return new Date(cfg.CLOCK_BASE.getTime() + BD.clock.elapsed()); };
  BD.fmtDate = function (d) { return util.fmtDateEs(d, cfg.TZ_NAME); };
  BD.fmtTime = function (d) { return util.fmtTime(d); };

  /* ---------------- Consultas sobre los servicios ---------------- */
  BD.findPort = function (id) {
    for (var i = 0; i < state.ports.length; i++) { if (state.ports[i].id === id) { return state.ports[i]; } }
    return null;
  };
  BD.findPortByAlias = function (name) {
    name = String(name || "").toLowerCase();
    for (var i = 0; i < state.ports.length; i++) {
      if (state.ports[i].aliases.indexOf(name) !== -1) { return state.ports[i]; }
    }
    return null;
  };
  BD.findLivePortByPid = function (pid) {
    for (var i = 0; i < state.ports.length; i++) {
      if (state.ports[i].pid === pid && state.ports[i].state !== "stopped") { return state.ports[i]; }
    }
    return null;
  };

  /* ---------------- Terminal y shell ---------------- */
  BD.timers = RG.Timers();
  BD.commands = {};   // lo rellena js/commands.js

  BD.promptHtml = function () {
    return '<span class="p-user">root@' + cfg.HOSTNAME + '</span>:<span class="p-path">~</span># ';
  };

  BD.term = RG.Terminal({
    promptHtml: BD.promptHtml,
    titleText: function () { return "root@" + cfg.HOSTNAME + ": ~ — ssh"; },
    completion: function (parts) { return BD.completion(parts); },
    canFocus: function () { return !RG.Modal.isOpen(); },
    onCommand: function (raw) {
      BD.term.setLocked(true);
      BD.shell.runLine(raw);
    }
  });

  BD.shell = RG.Shell(BD.term, {
    commands: BD.commands,
    fs: {
      list: function () { return Object.keys(BD.FILES); },
      read: function (p) { return util.has(BD.FILES, p) ? BD.FILES[p] : null; },
      write: function () { return false; }   // el sistema de ficheros es de solo lectura
    },
    afterCommand: function () { if (BD.afterCommand) { BD.afterCommand(); } },
    afterLine: function () { if (BD.afterLine) { BD.afterLine(); } }
  });

  /* La consola local (antes de conectar por SSH) para la secuencia de arranque */
  BD.echoLocal = function (typed) {
    var out = RG.$("terminalOutput");
    var div = document.createElement("div");
    div.className = "ln pre";
    div.innerHTML = '<span class="p-local">' + util.esc(cfg.LOCAL_PROMPT) + "</span>";
    div.appendChild(document.createTextNode(typed));
    out.appendChild(div);
    BD.term.scrollEnd();
  };
})(this);
