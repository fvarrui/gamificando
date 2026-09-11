/* ==========================================================
   Arranque del reto: motor de misiones, indicadores de alerta,
   secuencia SSH, pantallas e informe de misión.
   ========================================================== */
(function (global) {
  "use strict";
  var RG = global.RG, BD = global.BD, util = RG.util, cfg = BD.cfg;
  var state = BD.state, term = BD.term, esc = util.esc;

  /* ---------------- Motor de misiones ---------------- */
  var game = BD.game = RG.Game({
    missions: BD.MISSIONS,
    levels: BD.LEVELS,
    badges: BD.BADGES,
    hintCost: BD.HINT_COST,
    riskyPenalty: BD.RISKY_PENALTY,
    proactiveBonus: BD.PROACTIVE_BONUS,
    term: term,
    timers: BD.timers,
    nextDelay: 2600,
    currentCommand: function () { return BD.shell.currentText; },
    labels: {
      strip: function (m) { return [m.kind === "threat" ? "⚠ ALERTA ENTRANTE" : "ℹ ORDEN DEL BLUE TEAM", m.code]; },
      meta: function (m) { return m.sevLabel + " · " + m.source; },
      wait: "En curso: actúa desde la terminal.",
      done: function (m, ms) {
        return m.kind === "recon" ? "✓ Reconocimiento completado"
          : m.kind === "verify" ? "✓ Verificación enviada al SOC"
          : "✓ Amenaza neutralizada" + (ms.proactive ? " de forma proactiva" : "");
      },
      next: "Esperando la siguiente alerta del SOC…",
      report: "📋 Ver informe de misión",
      announce: function (m) {
        return (m.kind === "threat" ? "Nueva alerta, " + m.sevLabel + ": " : "Nueva orden: ") + m.title;
      },
      alreadyDone: "",
      emptyLog: "Aún no hay alertas.",
      idleIcon: "📡"
    },
    on: {
      broadcast: function (m) {
        var head = "Broadcast message from soc@tecnoatlantica (pts/1) (" + BD.fmtDate(BD.fakeNow()) + "):";
        var body = m.kind === "threat"
          ? "*** ALERTA " + m.code + " · " + m.sevLabel.toUpperCase() + " · " + m.title + " ***"
          : "*** " + m.code + " · " + m.title + " ***";
        term.sys("bcast", head + "\n\n" + body + "\nConsulta la ficha de misión en el panel lateral.");
        if (m.kind === "threat") { term.flash(); }
      },
      complete: function (i, m, ms) {
        // Si la amenaza se contuvo antes de llegar la alerta, se anota con qué comando
        if (ms.proactive && m.port && state.securedBy[m.port]) { ms.method = state.securedBy[m.port]; }
        term.sys("soc", socDoneText(m, ms));
      },
      levelUp: function (l) { term.sys("soc", "[SOC] ⬆ Ascenso: ahora eres " + game.levelLabel(l) + "."); },
      finish: function () {
        BD.clock.finish();
        RG.$("tbId").classList.add("secure");
        term.sys("ok", "El informe de misión está listo. Pulsa «📋 Ver informe de misión» en la ficha lateral.");
      },
      render: function () { renderPips(); },
      report: function () { showDebrief(); }
    }
  });

  function socDoneText(m, ms) {
    if (m.kind === "recon") {
      return "[SOC] ✓ Reconocimiento registrado: ya tienes el mapa de servicios del servidor. +" + ms.earned + " XP";
    }
    if (m.kind === "verify") {
      var listening = 0, filtered = 0;
      state.ports.forEach(function (p) {
        if (p.state !== "stopped") { listening++; }
        if (p.state === "filtered") { filtered++; }
      });
      return "[SOC] ✓ Verificación recibida: " + listening + " servicios siguen en escucha" +
        (filtered ? " (" + filtered + " de ellos, bloqueados por el cortafuegos)" : "") +
        ". Incidente cerrado. +" + ms.earned + " XP";
    }
    if (ms.proactive) {
      return "[SOC] ✓ Alerta " + m.code + " ya estaba contenida: cerraste " + m.port +
        "/tcp antes de que llegara. +" + ms.earned + " XP (incluye bonus proactivo)";
    }
    return "[SOC] ✓ Alerta " + m.code + " cerrada: " + m.port + "/tcp ya no es accesible desde el exterior. +" + ms.earned + " XP";
  }

  BD.afterCommand = function () {
    var evs = BD.events.slice();
    BD.events.length = 0;
    game.check(evs);
  };
  BD.afterLine = function () {
    game.render();
    if (!BD.shell.suspended && !state.reopening) { term.setLocked(false); }
  };

  /* ---------------- Indicadores de alerta ---------------- */
  function renderPips() {
    var el = RG.$("pips");
    el.innerHTML = "";
    BD.MISSIONS.forEach(function (m, i) {
      var ms = game.ms[i];
      var li = document.createElement("li");
      var status = ms.done ? "done" : ms.revealed ? "active" : "locked";
      li.className = "pip " + status;
      li.innerHTML = '<span aria-hidden="true">' + (ms.done ? "✓" : ms.revealed ? "!" : "?") + "</span>" +
        '<span class="sr-only">Alerta ' + (i + 1) + ": " +
        (ms.done ? "resuelta, " + esc(m.title) : ms.revealed ? "en curso, " + esc(m.title) : "sin revelar") + "</span>";
      li.title = ms.revealed ? m.title : "Alerta sin revelar";
      el.appendChild(li);
    });
  }

  /* ---------------- Secuencia de conexión y arranque ---------------- */
  function bootSequence() {
    var steps = [
      [0,    function () { BD.echoLocal("ssh -i ~/.ssh/blueteam_ed25519 root@" + cfg.IP); }],
      [500,  function () { term.line("dim", "Connecting to " + cfg.IP + " port 22..."); }],
      [900,  function () { term.line("ok", "Authenticated to " + cfg.IP + " using \"publickey\"."); }],
      [1250, function () { term.line("text", "Welcome to Ubuntu 24.04.1 LTS (GNU/Linux 6.8.0-45-generic x86_64)"); }],
      [1450, function () { term.line("text", ""); }],
      [1550, function () { term.line("text", "Last login: Wed Sep  9 23:41:02 2026 from 192.168.10.5"); }],
      [1850, function () { term.line("warn", "*** AVISO: incidente de seguridad en curso. Toda la actividad de esta sesión queda registrada. ***"); }],
      [2100, function () { term.line("dim", "Escribe 'help' para ver los comandos disponibles."); }],
      [2250, function () { BD.clock.start(); term.setLocked(false); }],
      [3000, function () { game.activate(0); }]
    ];
    steps.forEach(function (s) { BD.timers.later(s[1], s[0]); });
  }

  BD.startGame = function () {
    BD.timers.clear();
    BD.clock.reset();
    BD.resetState();
    game.reset();
    BD.shell.reset();
    term.reset();
    RG.$("tbId").classList.remove("secure");
    renderPips();
    game.renderLog();
    game.renderIdle("Estableciendo conexión segura con el servidor…");
    RG.showScreen("game");
    term.setLocked(true);
    term.renderPrompt();
    bootSequence();
  };

  function inProgress() { return !RG.$("screenGame").hidden && !game.finished; }
  function goHome() {
    BD.timers.clear();
    BD.clock.stop();
    RG.showScreen("intro");
    RG.$("introTitle").focus();
  }

  /* ---------------- Informe de misión ---------------- */
  function showDebrief() {
    var xp = Math.max(0, game.xp), lvl = game.levelFor(xp), hints = game.totalHints();
    var proactive = game.ms.some(function (ms) { return ms.proactive; });
    var got = {
      clean: game.risky.length === 0,
      self: hints === 0,
      tools: Object.keys(state.families).length >= 3,
      fast: BD.clock.elapsed() < BD.FAST_TIME_MS,
      proact: proactive,
      rtfm: state.usedMan
    };
    var stillRunning = state.ports.filter(function (p) { return !p.legitimate && p.state === "filtered"; })
      .map(function (p) { return p.process; });

    RG.$("debriefTitle").textContent = got.clean ? "Red asegurada sin daños colaterales" : "Amenaza contenida… con daños colaterales";
    var msg;
    if (got.clean && got.self) {
      msg = "Impecable: has contenido las cinco amenazas sin pedir ayuda y sin afectar a ningún servicio legítimo. TecnoAtlántica vuelve a estar operativa.";
    } else if (got.clean) {
      msg = "Las cinco amenazas están contenidas y los servicios del negocio siguen en pie. Buen trabajo de Blue Team.";
    } else {
      msg = "Las cinco amenazas están contenidas, pero por el camino se detuvo algún servicio que la empresa necesitaba. En un incidente real eso también es una caída: revisa las decisiones arriesgadas.";
    }
    if (stillRunning.length === 1) {
      msg += " Ojo: " + stillRunning[0] + " sigue en marcha detrás del cortafuegos. Está contenido, " +
        "pero lo ideal es además detenerlo y deshabilitarlo (systemctl disable --now).";
    } else if (stillRunning.length > 1) {
      msg += " Ojo: " + stillRunning.slice(0, -1).join(", ") + " y " + stillRunning[stillRunning.length - 1] +
        " siguen en marcha detrás del cortafuegos. Están contenidos, pero lo ideal es además detenerlos y " +
        "deshabilitarlos (systemctl disable --now).";
    }
    RG.$("debriefMsg").textContent = msg;
    RG.$("dXp").textContent = xp + " XP";
    RG.$("dLevel").textContent = game.levelLabel(lvl);
    RG.$("dTime").textContent = util.fmtElapsed(BD.clock.elapsed());
    RG.$("dHints").textContent = String(hints);

    game.renderBadges(RG.$("badgeGrid"), got);

    var body = RG.$("reportBody");
    body.innerHTML = "";
    BD.MISSIONS.forEach(function (m, i) {
      var ms = game.ms[i];
      var tr = document.createElement("tr");
      tr.innerHTML =
        "<td>" + esc(m.code) + "</td>" +
        "<td>" + esc(m.title) + (m.port ? ' <span class="tag">(' + m.port + "/tcp)</span>" : "") + "</td>" +
        "<td>" + (ms.method ? "<code>" + esc(ms.method) + "</code>" : "—") +
          (ms.proactive ? ' <span class="tag">proactivo</span>' : "") +
          (ms.hintsUsed ? ' <span class="tag">· ' + ms.hintsUsed + " pista" + (ms.hintsUsed > 1 ? "s" : "") + "</span>" : "") + "</td>" +
        '<td class="xp">+' + ms.earned + "</td>";
      body.appendChild(tr);
    });

    game.renderRisky(RG.$("riskyList"), "Ninguna. Todos los servicios legítimos siguieron funcionando.");

    RG.showScreen("debrief");
    RG.$("debriefTitle").focus();
  }

  /* ---------------- Botones e inicialización ---------------- */
  RG.$("startBtn").addEventListener("click", BD.startGame);
  RG.$("againBtn").addEventListener("click", BD.startGame);
  RG.$("homeBtn").addEventListener("click", goHome);
  RG.$("resetBtn").addEventListener("click", function () {
    if (inProgress() && BD.clock.started() && !global.confirm("¿Reiniciar la operación? Perderás el progreso actual.")) { return; }
    BD.startGame();
  });
  RG.$("quitBtn").addEventListener("click", function () {
    if (inProgress() && BD.clock.started() && !global.confirm("¿Volver a la portada? Perderás el progreso actual.")) { return; }
    goHome();
  });

  RG.Modal.bind();
  game.renderStats();
  renderPips();
  game.renderLog();
  term.renderPrompt();
  RG.showScreen("intro");
})(this);
