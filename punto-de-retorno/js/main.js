/* ==========================================================
   Arranque del reto: motor de misiones, pantallas, progreso
   por fases, informe final y pestañas del panel lateral.
   ========================================================== */
(function (global) {
  "use strict";
  var RG = global.RG, VG = global.VG, util = RG.util, cfg = VG.cfg;
  var state = VG.state, term = VG.term, esc = util.esc;

  /* ---------------- Motor de misiones ---------------- */
  var game = VG.game = RG.Game({
    missions: VG.MISSIONS,
    phases: VG.PHASES,
    levels: VG.LEVELS,
    badges: VG.BADGES,
    hintCost: VG.HINT_COST,
    riskyPenalty: VG.RISKY_PENALTY,
    term: term,
    timers: VG.timers,
    nextDelay: 1900,
    currentCommand: function () { return VG.shell.currentText; },
    labels: {
      strip: function (m) { return ["📋 TICKET · FASE " + VG.PHASES[m.phase].n, m.code]; },
      meta: function (m) { return VG.PHASES[m.phase].name + " · " + m.source; },
      wait: "Ticket abierto: trabaja en la terminal.",
      done: function () { return "✓ Completado"; },
      next: "Esperando el siguiente ticket…",
      report: "📋 Ver informe final",
      announce: function (m) { return "Nuevo ticket " + m.code + ": " + m.title; },
      alreadyDone: "(ya estaba hecho)",
      skipped: "preparada automáticamente",
      emptyLog: "Aún no hay tickets.",
      idleIcon: "📋"
    },
    on: {
      broadcast: function (m) {
        term.sys("bcast", "Nuevo ticket asignado (" + VG.fmtSysDate(VG.fakeNow()) + "):\n\n*** " + m.code + " · " + m.title.toUpperCase() + " ***\n" +
          "De: " + m.source + "\nConsulta la ficha completa en el panel lateral (pestaña 🎯 Misión).");
        if (m.severity === "high" || m.severity === "critical") { term.flash(); }
      },
      complete: function (i, m, ms) {
        term.sys("soc", "[TICKET " + m.code + "] ✓ " + m.title + " · completado. +" + ms.earned + " XP");
      },
      levelUp: function (l) { term.sys("soc", "[BLUE TEAM] ⬆ Ascenso: ahora eres " + game.levelLabel(l) + "."); },
      finish: function () {
        VG.clock.finish();
        RG.$("tbId").classList.add("secure");
        term.sys("ok", "Todos los tickets están cerrados. Pulsa «📋 Ver informe final» en la ficha lateral.");
      },
      render: function () {
        renderPhases();
        VG.renderRepo();
        term.renderPrompt();
        /* La ficha se repinta con innerHTML: hay que volver a marcar los cameos */
        if (RG.cameos) { RG.cameos.apply(RG.$("missionSlot")); }
      },
      report: function () { showDebrief(); }
    }
  });

  VG.afterCommand = function () {
    var evs = VG.events.slice();
    VG.events.length = 0;
    game.check(evs);
  };
  VG.afterLine = function () {
    game.render();
    if (!VG.shell.suspended && !state.reopening) { term.setLocked(false); }
  };

  /* ---------------- Progreso por fases ---------------- */
  function renderPhases() {
    var el = RG.$("phases");
    el.innerHTML = "";
    var curPhase = game.current >= 0 ? VG.MISSIONS[game.current].phase : 0;
    VG.PHASES.forEach(function (p, pi) {
      var list = game.missionsOfPhase(pi);
      var doneCount = list.filter(function (i) { return game.ms[i].done; }).length;
      var li = document.createElement("li");
      var status = doneCount === list.length ? "done" : (pi === curPhase && game.current >= 0 ? "active" : "");
      li.className = "phase " + status;
      li.innerHTML = '<span aria-hidden="true">F' + p.n + " " + (status === "done" ? "✓" : doneCount + "/" + list.length) + "</span>" +
        '<span class="sr-only">Fase ' + p.n + ", " + esc(p.name) + ": " + doneCount + " de " + list.length + " misiones</span>";
      li.title = "Fase " + p.n + " · " + p.name + " (" + p.desc + ")";
      el.appendChild(li);
    });
    var done = game.ms.filter(function (ms) { return ms.done; }).length;
    RG.$("mbarFill").style.width = Math.round(done / VG.MISSIONS.length * 100) + "%";
    RG.$("mcount").innerHTML = "Misión <b>" + Math.min(game.current + 1, VG.MISSIONS.length) + "</b>/" + VG.MISSIONS.length;
  }

  /* ---------------- Pestañas del panel lateral ---------------- */
  function selectTab(which) {
    var isRepo = which === "repo";
    RG.$("tabMission").setAttribute("aria-selected", String(!isRepo));
    RG.$("tabRepo").setAttribute("aria-selected", String(isRepo));
    RG.$("tabMission").tabIndex = isRepo ? -1 : 0;
    RG.$("tabRepo").tabIndex = isRepo ? 0 : -1;
    RG.$("panelMission").hidden = isRepo;
    RG.$("panelRepo").hidden = !isRepo;
    if (isRepo) {
      state.flags.viewedMap = true;
      RG.$("repoDot").hidden = true;
    }
  }
  RG.$("tabMission").addEventListener("click", function () { selectTab("mission"); });
  RG.$("tabRepo").addEventListener("click", function () { selectTab("repo"); });
  [RG.$("tabMission"), RG.$("tabRepo")].forEach(function (tab) {
    tab.addEventListener("keydown", function (e) {
      if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
        e.preventDefault();
        var toRepo = tab.id === "tabMission";
        selectTab(toRepo ? "repo" : "mission");
        RG.$(toRepo ? "tabRepo" : "tabMission").focus();
      }
    });
  });

  /* ---------------- Preparar una fase y arrancar ---------------- */
  function prepareUpTo(phase) {
    var firstIdx = game.missionsOfPhase(phase)[0];
    term.silent = true;
    try {
      for (var i = 0; i < firstIdx; i++) {
        var m = VG.MISSIONS[i];
        game.current = i;
        game.ms[i].revealed = true;
        if (m.onActivate) { m.onActivate(game.ms[i].data); }
        m.solution.forEach(function (cmd) { VG.shell.runSilent(cmd); });
        VG.events.length = 0;
      }
    } finally { term.silent = false; }
    game.markSkipped(firstIdx);
    game.xp = 0;
    game.risky = [];
    game.riskyKinds = {};
    state.myCommits = [];
    state.flags = { usedMan: false, usedReflog: false, reviewed: false, viewedMap: false };
    term.history = [];
    game.renderStats();
  }

  function bootSequence() {
    var firstIdx = state.startPhase ? game.missionsOfPhase(state.startPhase)[0] : 0;
    var steps = [
      [0, function () { term.line("dim", "Ubuntu 24.04.1 LTS  " + cfg.HOST + "  tty1"); }],
      [400, function () { term.line("text", cfg.USER + "@" + cfg.HOST + " · último acceso: " + VG.fmtSysDate(new Date(cfg.CLOCK_BASE.getTime() - 86400000))); }],
      [800, function () { term.line("text", ""); }],
      [900, function () {
        if (state.startPhase) {
          term.line("ok", "✔ Preparado el repositorio con las fases anteriores ya resueltas (fase " + VG.PHASES[state.startPhase].n + ": " + VG.PHASES[state.startPhase].name + ").");
        }
        term.line("dim", "Escribe 'help' para ver las órdenes disponibles, o 'man git-commit' para leer un manual.");
        term.line("dim", "Abre la pestaña 🌿 Repositorio del panel lateral para ver el grafo de ramas en tiempo real.");
        term.line("text", "");
      }],
      [1100, function () { VG.clock.start(); term.setLocked(false); game.render(); }],
      [1700, function () { game.activate(firstIdx); }]
    ];
    steps.forEach(function (s) { VG.timers.later(s[1], s[0]); });
  }

  VG.startGame = function (startPhase) {
    VG.timers.clear();
    VG.clock.reset();
    VG.resetState();
    game.reset();
    VG.shell.reset();
    VG.editor.close();
    state.startPhase = startPhase || 0;
    term.reset();
    RG.$("tbId").classList.remove("secure");
    RG.$("repoView").removeAttribute("data-html");
    selectTab("mission");
    renderPhases();
    game.renderLog();
    game.renderIdle("Abriendo la terminal…");
    RG.showScreen("game");
    term.setLocked(true);
    if (state.startPhase) { prepareUpTo(state.startPhase); }
    VG.renderRepo();
    term.renderPrompt();
    bootSequence();
  };

  function inProgress() { return !RG.$("screenGame").hidden && !game.finished; }
  function goHome() {
    VG.timers.clear();
    VG.clock.stop();
    VG.editor.close();
    RG.showScreen("intro");
    RG.$("introTitle").focus();
  }

  /* ---------------- Informe final ---------------- */
  function goodMessage(msg) {
    var first = util.firstLine(msg);
    return first.length >= 12 && first.split(/\s+/).filter(Boolean).length >= 3 &&
      !/^(wip|test|prueba|cambios|asdf|update|fix)$/i.test(first);
  }
  function showDebrief() {
    var xp = Math.max(0, game.xp), lvl = game.levelFor(xp), hints = game.totalHints();
    var mine = state.myCommits.filter(function (h) { return state.commits[h]; });
    var got = {
      clean: game.risky.length === 0,
      secret: !game.riskyKinds.secret && !game.riskyKinds.personal,
      self: hints === 0,
      review: state.flags.reviewed,
      msgs: mine.length > 0 && mine.every(function (h) { return goodMessage(state.commits[h].msg); }),
      map: state.flags.viewedMap,
      reflog: state.flags.usedReflog,
      rtfm: state.flags.usedMan
    };
    var doneCount = game.ms.filter(function (ms) { return ms.done && !ms.skipped; }).length;

    RG.$("debriefTitle").textContent = got.clean ? "Repositorio en orden" : "Trabajo terminado… con algún susto";
    var msg;
    if (got.clean && got.self) {
      msg = "Impecable: has llevado el proyecto de una carpeta sin historial a un repositorio compartido, sin pedir pistas y sin ninguna decisión arriesgada. " +
        "Ahora cualquiera puede saber quién cambió qué, cuándo y por qué.";
    } else if (got.clean) {
      msg = "Los scripts de bastionado ya están versionados y sincronizados con el servidor, sin secretos en el historial ni historia reescrita. Buen trabajo.";
    } else {
      msg = "El repositorio está en orden, pero por el camino hubo decisiones que en un equipo real dan problemas: revisa abajo qué pasó y por qué importa.";
    }
    if (state.git && state.git.stash.length) { msg += " Ojo: te has dejado cambios guardados en el stash."; }
    RG.$("debriefMsg").textContent = msg;
    RG.$("dXp").textContent = xp + " XP";
    RG.$("dLevel").textContent = game.levelLabel(lvl);
    RG.$("dTime").textContent = util.fmtElapsed(VG.clock.elapsed());
    RG.$("dHints").textContent = String(hints);
    RG.$("dCommits").textContent = String(mine.length);

    game.renderBadges(RG.$("badgeGrid"), got);
    RG.$("finalGraph").innerHTML = VG.buildRepoHtml(true);

    var body = RG.$("reportBody");
    body.innerHTML = "";
    VG.PHASES.forEach(function (p, pi) {
      var list = game.missionsOfPhase(pi).filter(function (i) { return game.ms[i].revealed; });
      if (!list.length) { return; }
      var tr0 = document.createElement("tr");
      tr0.className = "ph";
      tr0.innerHTML = '<td colspan="4">Fase ' + p.n + " · " + esc(p.name) + "</td>";
      body.appendChild(tr0);
      list.forEach(function (i) {
        var ms = game.ms[i], m = VG.MISSIONS[i];
        var tr = document.createElement("tr");
        tr.innerHTML = "<td>" + esc(m.code) + "</td><td>" + esc(m.title) + "</td>" +
          "<td>" + (ms.skipped ? '<span class="tag">preparada automáticamente</span>'
            : ms.method ? "<code>" + esc(ms.method) + "</code>" : "—") +
            (ms.hintsUsed ? ' <span class="tag">· ' + ms.hintsUsed + " pista" + (ms.hintsUsed > 1 ? "s" : "") + "</span>" : "") + "</td>" +
          '<td class="xp">' + (ms.done ? "+" + ms.earned : "—") + "</td>";
        body.appendChild(tr);
      });
    });

    game.renderRisky(RG.$("riskyList"),
      "Ninguna: ni secretos en el historial, ni push forzado, ni trabajo perdido. " + doneCount + " misiones resueltas por ti.");

    if (RG.cameos) { RG.cameos.apply(RG.$("screenDebrief")); }
    RG.showScreen("debrief");
    RG.$("debriefTitle").focus();
  }

  /* ---------------- Portada y botones ---------------- */
  function buildPhaseOptions() {
    var box = RG.$("phaseOptions");
    box.innerHTML = "";
    VG.PHASES.forEach(function (p, i) {
      var id = "phase" + i;
      var lab = document.createElement("label");
      lab.setAttribute("for", id);
      lab.innerHTML = '<input type="radio" name="startPhase" id="' + id + '" value="' + i + '"' + (i === 0 ? " checked" : "") + ">" +
        "<span><b>Fase " + p.n + " · " + esc(p.name) + "</b><span>" + esc(p.desc) + "</span></span>";
      box.appendChild(lab);
    });
  }
  function selectedPhase() {
    var r = document.querySelector('input[name="startPhase"]:checked');
    return r ? parseInt(r.value, 10) : 0;
  }

  RG.$("startBtn").addEventListener("click", function () { VG.startGame(selectedPhase()); });
  RG.$("againBtn").addEventListener("click", function () { VG.startGame(state.startPhase); });
  RG.$("homeBtn").addEventListener("click", goHome);
  RG.$("resetBtn").addEventListener("click", function () {
    if (inProgress() && VG.clock.started() && !global.confirm("¿Reiniciar? Perderás el progreso actual.")) { return; }
    VG.startGame(state.startPhase);
  });
  RG.$("quitBtn").addEventListener("click", function () {
    if (inProgress() && VG.clock.started() && !global.confirm("¿Volver a la portada? Perderás el progreso actual.")) { return; }
    goHome();
  });

  RG.Modal.bind();
  if (RG.cameos) { RG.cameos.bind(); RG.cameos.apply(document.body); }
  buildPhaseOptions();
  game.renderStats();
  renderPhases();
  game.renderLog();
  term.renderPrompt();
  VG.renderRepo();
  RG.showScreen("intro");
})(this);
