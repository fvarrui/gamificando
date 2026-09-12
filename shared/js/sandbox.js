/* ==========================================================
   RG.Sandbox · Arranque común de los retos de consola
   Monta el sistema simulado (ficheros, usuarios, servicios), la
   terminal, el intérprete, el editor, el motor de misiones, las
   fases, la secuencia de arranque y el informe final.
   Cada reto solo aporta datos: escenario, misiones y textos.
   ========================================================== */
(function (global) {
  "use strict";
  var RG = global.RG, util = RG.util;

  RG.Sandbox = function (spec) {
    var S = { cfg: spec.cfg, spec: spec, events: [], state: {} };
    var cfg = spec.cfg;
    var esc = util.esc;
    var win = spec.shell === "pwsh";
    var state = S.state;

    S.timers = RG.Timers();
    S.clock = RG.Clock(RG.$("clock"));
    S.emit = function (ev) { S.events.push(ev); };
    S.fakeNow = function () { return cfg.CLOCK_BASE.getTime() + S.clock.elapsed(); };

    /* ---------------- Sistema simulado ----------------
       El VFS y el modelo de usuarios se crean una sola vez: al
       reiniciar se vacían y se vuelven a llenar, para que los
       comandos (que guardan la referencia) sigan siendo válidos. */
    S.vfs = RG.VFS({
      sep: win ? "\\" : "/",
      drive: win ? (cfg.DRIVE || "C:") : "",
      model: win ? "win" : "posix",
      defaultOwner: win ? "Administradores" : "root",
      defaultGroup: win ? "Administradores" : "root",
      home: function () { return cfg.HOME; },
      now: function () { return S.fakeNow(); }
    });
    S.sys = RG.System({
      homeBase: win ? "C:\\Users\\" : "/home/",
      baseProcesses: cfg.BASE_PROCESSES || [],
      now: function () { return S.fakeNow(); }
    });

    S.resetState = function () {
      Object.keys(state).forEach(function (k) { delete state[k]; });
      S.vfs.root.children = {};
      S.vfs.root.owner = win ? "Administradores" : "root";
      S.vfs.root.group = win ? "Administradores" : "root";
      S.vfs.root.mode = 0o755;
      S.vfs.root.acl = null;
      S.vfs.root.aces = cfg.ROOT_ACES ? cfg.ROOT_ACES.slice() : null;
      S.sys.users = {};
      S.sys.groups = {};
      S.sys.services = {};
      S.sys.processes = [];
      state.flags = {};
      state.startPhase = 0;
      state.root = false;                 // sesión elevada (sudo / administrador)
      state.umask = cfg.UMASK === undefined ? 0o022 : cfg.UMASK;
      state.userName = cfg.USER;
      S.events.length = 0;
      if (spec.build) { spec.build(S); }
      state.cwd = S.vfs.norm(cfg.CWD || cfg.HOME || (win ? cfg.DRIVE + "\\" : "/"), []);
    };

    /* ---------------- Usuario en curso ---------------- */
    S.user = function () {
      var name = state.root ? (win ? "Administrador" : "root") : state.userName;
      var p = S.sys.principal(name);
      if (p) { return p; }
      return { name: name, uid: state.root ? 0 : 1000, group: name, groups: [name] };
    };
    S.isRoot = function () {
      var u = S.user();
      return win ? (u.groups || []).indexOf("Administradores") !== -1 : u.uid === 0;
    };

    /* ---------------- Terminal ---------------- */
    S.displayPath = function (segs) {
      var p = S.vfs.join(segs || state.cwd);
      if (!win && cfg.HOME && p.indexOf(cfg.HOME) === 0) { return "~" + p.slice(cfg.HOME.length); }
      return p;
    };
    S.promptHtml = function () {
      if (win) {
        return '<span class="p-user">PS</span> <span class="p-path">' + esc(S.vfs.join(state.cwd)) + "</span>&gt; ";
      }
      var u = S.user();
      return '<span class="p-user">' + esc(u.name) + "@" + esc(cfg.HOST) + '</span>:<span class="p-path">' +
        esc(S.displayPath()) + "</span>" + (u.uid === 0 ? "# " : "$ ");
    };

    S.term = RG.Terminal({
      promptHtml: S.promptHtml,
      titleText: function () {
        return win ? (cfg.TERM_TITLE || "Windows PowerShell") + "  —  " + S.vfs.join(state.cwd)
          : S.user().name + "@" + cfg.HOST + ": " + S.displayPath() + (cfg.TERM_TITLE ? " — " + cfg.TERM_TITLE : "");
      },
      completion: function (parts) { return S.completion(parts); },
      onComplete: function () { state.flags.usedTab = true; },
      canFocus: function () { return !RG.Modal.isOpen(); },
      onCommand: function (raw) {
        if (raw.indexOf("|") !== -1) { state.flags.usedPipe = true; }
        if (raw.indexOf(">") !== -1) { state.flags.usedRedir = true; }
        S.term.setLocked(true);
        S.shell.runLine(raw);
      }
    });
    var term = S.term;

    /* ---------------- Intérprete y comandos ---------------- */
    S.ctx = {
      term: term,
      vfs: S.vfs,
      sys: S.sys,
      man: spec.man || {},
      user: S.user,
      cwd: function () { return state.cwd; },
      setCwd: function (segs) { state.cwd = segs; },
      home: function () { return cfg.HOME; },
      host: function () { return cfg.HOST; },
      tz: cfg.TZ_NAME,
      emit: function (ev) { S.emit(ev); },
      now: function () { return S.fakeNow(); },
      umask: function () { return state.umask; },
      setUmask: function (m) { state.umask = m; },
      sudo: spec.sudo !== false,
      asRoot: function (v) {
        var prev = state.root;
        state.root = v;
        return prev;
      },
      run: function (words) { S.exec(words); },
      onMan: function (name) {
        state.flags.usedMan = true;
        if (spec.onMan) { spec.onMan(S, name); }
      }
    };

    S.commands = {};
    var base = win ? RG.PwshCommands(S.ctx) : RG.PosixCommands(S.ctx);
    Object.keys(base).forEach(function (k) { S.commands[k] = base[k]; });
    if (spec.admin !== false) {
      var adm = win ? RG.PwshAdminCommands(S.ctx) : RG.PosixAdminCommands(S.ctx);
      Object.keys(adm).forEach(function (k) {
        if (k === "__aliases") {
          if (S.ctx.aliases) {
            Object.keys(adm.__aliases).forEach(function (a) { S.ctx.aliases[a] = adm.__aliases[a]; });
          }
          return;
        }
        S.commands[k] = adm[k];
      });
    }
    if (spec.commands) {
      var extra = spec.commands(S);
      Object.keys(extra).forEach(function (k) { S.commands[k] = extra[k]; });
    }
    if (win) {
      S.ctx.extra = S.commands;
      S.ctx.rebuildNames();
    }

    /* Ayuda propia del reto: lista de órdenes disponibles */
    S.commands.help = function () {
      term.pre("");
      term.rich([["b", spec.helpTitle || "Órdenes disponibles en esta consola"]]);
      (spec.helpGroups || []).forEach(function (g) {
        term.pre("");
        term.rich([["m", "  " + g[0]]]);
        util.wrapText(g[1].join("  ·  "), 72).forEach(function (l) { term.pre("    " + l); });
      });
      term.pre("");
      term.pre(win
        ? "Ayuda de un comando:  Get-Help <comando>   ·   Limpiar la pantalla:  Clear-Host"
        : "Manual de una orden:  man <orden>   ·   Limpiar la pantalla:  clear");
      term.pre("");
    };
    S.commands.exit = function () {
      term.sys("warn", win ? "No se puede cerrar esta consola durante la práctica." : "No puedes cerrar la sesión durante la práctica.");
    };

    S.exec = function (words) {
      var name = words[0], args = words.slice(1);
      var fn = win ? S.ctx.resolve(name) : S.commands[name];
      if (!fn) {
        if (win) { S.ctx.notFound(name); } else { term.fail("bash: " + name + ": orden no encontrada"); }
        return;
      }
      fn(args, name);
    };

    S.shell = RG.Shell(term, {
      commands: S.commands,
      winPaths: win,
      resolve: win ? function (n) { return S.ctx.resolve(n); } : null,
      resolveFilter: win ? function (n) { return S.ctx.resolveFilter(n); } : null,
      renderObjects: win ? function (o) { S.ctx.renderObjects(o); } : null,
      objectsToRows: win ? function (o) { return S.ctx.objectsToRows(o); } : null,
      notFound: win ? function (n) { S.ctx.notFound(n); } : null,
      fs: {
        /* Redirecciones (> y >>) sobre el sistema de ficheros virtual */
        read: function (p) { return S.vfs.readFile(p, state.cwd); },
        write: function (p, text) {
          var loc = S.vfs.locate(p, state.cwd);
          var parent = S.vfs.get(S.vfs.join(loc.segs.slice(0, -1)), []);
          if (!parent) { return false; }
          if (loc.node && !S.vfs.can(S.user(), loc.node, "w")) { return false; }
          if (!loc.node && !S.vfs.can(S.user(), parent, "w")) { return false; }
          var f = S.vfs.writeFile(p, text, state.cwd, { owner: S.user().name, group: S.user().group, mode: 0o666 & ~state.umask });
          if (!f) { return false; }
          f.mtime = S.fakeNow();
          S.emit({ type: "write", path: S.vfs.join(loc.segs) });
          return true;
        }
      },
      unknown: spec.unknown ? function (n, a) { spec.unknown(S, n, a); } : null,
      afterCommand: function () {
        var evs = S.events.slice();
        S.events.length = 0;
        /* Vigilancia global: decisiones arriesgadas, insignias, avisos */
        if (spec.watch) { evs.forEach(function (ev) { spec.watch(S, ev); }); }
        S.game.check(evs);
      },
      afterLine: function () {
        S.game.render();
        if (!S.shell.suspended) { term.setLocked(false); }
      }
    });
    S.ctx.shell = S.shell;

    /* ---------------- Editor ---------------- */
    S.editor = RG.Editor(term, S.shell, {
      displayPath: function (p) { return p; }
    });
    S.ctx.editor = S.editor;

    /* ---------------- Autocompletado ---------------- */
    S.completion = function (parts) {
      if (parts.length <= 1) {
        return win ? S.ctx.commandNames() : util.sortedKeys(S.commands);
      }
      var partial = parts[parts.length - 1];
      var slash = Math.max(partial.lastIndexOf("/"), partial.lastIndexOf("\\"));
      var dir = slash === -1 ? "." : partial.slice(0, slash + 1);
      var prefix = slash === -1 ? "" : dir;
      var entries = S.vfs.list(dir === "" ? (win ? cfg.DRIVE + "\\" : "/") : dir, state.cwd) || [];
      return entries.map(function (n) { return prefix + n.name + (n.type === "dir" ? (win ? "\\" : "/") : ""); });
    };

    /* ---------------- Motor de misiones ---------------- */
    var labels = spec.labels || {};
    S.game = RG.Game({
      missions: spec.missions,
      phases: spec.phases,
      levels: spec.levels,
      badges: spec.badges,
      hintCost: spec.hintCost || 25,
      riskyPenalty: spec.riskyPenalty || 50,
      proactiveBonus: spec.proactiveBonus || 25,
      term: term,
      timers: S.timers,
      nextDelay: spec.nextDelay || 2200,
      currentCommand: function () { return S.shell.currentText; },
      labels: {
        strip: function (m) { return [(labels.stripIcon || "📋 TAREA") + " · FASE " + spec.phases[m.phase].n, m.code]; },
        meta: function (m) { return spec.phases[m.phase].name + " · " + m.source; },
        wait: labels.wait || "En curso: actúa desde la consola.",
        done: labels.done || function () { return "✓ Completada"; },
        next: labels.next || "Esperando la siguiente tarea…",
        report: labels.report || "📋 Ver informe final",
        announce: function (m) { return "Nueva tarea: " + m.title; },
        alreadyDone: "",
        emptyLog: labels.emptyLog || "Aún no hay tareas.",
        skipped: "preparada automáticamente",
        idleIcon: labels.idleIcon || "📋"
      },
      on: {
        broadcast: function (m) {
          var from = labels.from || (cfg.TEAM || "coordinación");
          term.sys("bcast", (labels.msgHead ? labels.msgHead(m) : "Mensaje de " + from + " (" + util.fmtTime(new Date(S.fakeNow())) + "):") +
            "\n\n*** " + m.code + " · " + m.title + " ***\nTienes la ficha completa en el panel lateral.");
          term.flash();
        },
        complete: function (i, m, ms) {
          term.sys("ok", "✓ " + m.code + " completada. +" + ms.earned + " XP");
          if (spec.onComplete) { spec.onComplete(S, i, m, ms); }
        },
        levelUp: function (l) { term.sys("info", "⬆ Ascenso: ahora eres " + S.game.levelLabel(l) + "."); },
        finish: function () {
          S.clock.finish();
          var id = RG.$("tbId");
          if (id) { id.classList.add("secure"); }
          term.sys("ok", "El informe final está listo. Pulsa «" + (labels.report || "📋 Ver informe final") + "» en la ficha lateral.");
        },
        render: function () { renderPhases(); },
        report: function () { S.showDebrief(); }
      }
    });
    var game = S.game;

    /* ---------------- Barra de fases ---------------- */
    function renderPhases() {
      var el = RG.$("phases");
      if (!el) { return; }
      el.innerHTML = "";
      var curPhase = game.current >= 0 ? spec.missions[game.current].phase : 0;
      spec.phases.forEach(function (p, pi) {
        var list = game.missionsOfPhase(pi);
        var doneCount = list.filter(function (i) { return game.ms[i].done; }).length;
        var li = document.createElement("li");
        var status = doneCount === list.length ? "done" : (pi === curPhase && game.current >= 0 ? "active" : "");
        li.className = "phase " + status;
        li.innerHTML = '<span aria-hidden="true">F' + p.n + " " + (status === "done" ? "✓" : doneCount + "/" + list.length) + "</span>" +
          '<span class="sr-only">Fase ' + p.n + ", " + esc(p.name) + ": " + doneCount + " de " + list.length + " tareas</span>";
        li.title = "Fase " + p.n + " · " + p.name + " (" + p.desc + ")";
        el.appendChild(li);
      });
      var done = game.ms.filter(function (ms) { return ms.done; }).length;
      var fill = RG.$("mbarFill");
      if (fill) { fill.style.width = Math.round(done / spec.missions.length * 100) + "%"; }
      var count = RG.$("mcount");
      if (count) { count.innerHTML = "Tarea <b>" + Math.min(game.current + 1, spec.missions.length) + "</b>/" + spec.missions.length; }
    }
    S.renderPhases = renderPhases;

    /* ---------------- Preparar una fase ---------------- */
    function prepareUpTo(phase) {
      var firstIdx = game.missionsOfPhase(phase)[0];
      term.silent = true;
      try {
        for (var i = 0; i < firstIdx; i++) {
          var m = spec.missions[i];
          game.current = i;
          game.ms[i].revealed = true;
          if (m.onActivate) { m.onActivate(game.ms[i].data); }
          (m.solution || []).forEach(function (cmd) { S.shell.runSilent(cmd); });
          S.events.length = 0;
        }
      } finally { term.silent = false; }
      game.markSkipped(firstIdx);
      game.xp = 0;
      game.risky = [];
      game.riskyKinds = {};
      state.flags = {};
      term.history = [];
      game.renderStats();
    }
    S.prepareUpTo = prepareUpTo;

    /* ---------------- Arranque ---------------- */
    function bootSequence() {
      var firstIdx = state.startPhase ? game.missionsOfPhase(state.startPhase)[0] : 0;
      var lines = spec.boot || [];
      lines.forEach(function (l) {
        S.timers.later(function () { term.line(l[1], typeof l[2] === "function" ? l[2](S) : l[2]); }, l[0]);
      });
      var last = lines.length ? lines[lines.length - 1][0] : 0;
      S.timers.later(function () {
        if (state.startPhase) {
          term.line("ok", "✔ Preparado el sistema con las fases anteriores ya resueltas (fase " +
            spec.phases[state.startPhase].n + ": " + spec.phases[state.startPhase].name + ").");
        }
        term.line("dim", win
          ? "Escribe 'help' para ver los comandos disponibles, o 'Get-Help Get-ChildItem' para leer su ayuda."
          : "Escribe 'help' para ver las órdenes disponibles, o 'man ls' para leer un manual.");
        term.line("text", "");
      }, last + 200);
      S.timers.later(function () {
        S.clock.start();
        term.setLocked(false);
        game.render();
      }, last + 400);
      S.timers.later(function () { game.activate(firstIdx); }, last + 1000);
    }

    S.startGame = function (startPhase) {
      S.timers.clear();
      S.clock.reset();
      S.resetState();
      game.reset();
      S.shell.reset();
      if (S.editor.close) { S.editor.close(); }
      state.startPhase = startPhase || 0;
      term.reset();
      var id = RG.$("tbId");
      if (id) { id.classList.remove("secure"); }
      renderPhases();
      game.renderLog();
      game.renderIdle(labels.idle || "Abriendo la consola…");
      RG.showScreen("game");
      term.setLocked(true);
      if (state.startPhase) { prepareUpTo(state.startPhase); }
      if (spec.onStart) { spec.onStart(S); }
      term.renderPrompt();
      bootSequence();
    };

    function inProgress() { return !RG.$("screenGame").hidden && !game.finished; }
    function goHome() {
      S.timers.clear();
      S.clock.stop();
      if (S.editor.close) { S.editor.close(); }
      RG.showScreen("intro");
      RG.$("introTitle").focus();
    }

    /* ---------------- Informe final ---------------- */
    S.showDebrief = function () {
      var xp = Math.max(0, game.xp), lvl = game.levelFor(xp), hints = game.totalHints();
      var doneCount = game.ms.filter(function (ms) { return ms.done && !ms.skipped; }).length;
      var got = {
        clean: game.risky.length === 0,
        self: hints === 0,
        fast: S.clock.elapsed() < (spec.fastTimeMs || 12 * 60 * 1000),
        rtfm: !!state.flags.usedMan,
        proact: game.ms.some(function (ms) { return ms.proactive; })
      };
      if (spec.badgesOf) { spec.badgesOf(S, got); }
      var texts = spec.debriefText ? spec.debriefText(S, got, doneCount) : {};

      RG.$("debriefTitle").textContent = texts.title || (got.clean ? "Trabajo terminado" : "Trabajo terminado… con algún susto");
      RG.$("debriefMsg").textContent = texts.msg || "";
      RG.$("dXp").textContent = xp + " XP";
      RG.$("dLevel").textContent = game.levelLabel(lvl);
      RG.$("dTime").textContent = util.fmtElapsed(S.clock.elapsed());
      RG.$("dHints").textContent = String(hints);
      var dDone = RG.$("dDone");
      if (dDone) { dDone.textContent = String(doneCount); }

      game.renderBadges(RG.$("badgeGrid"), got);

      var body = RG.$("reportBody");
      body.innerHTML = "";
      spec.phases.forEach(function (p, pi) {
        var list = game.missionsOfPhase(pi).filter(function (i) { return game.ms[i].revealed; });
        if (!list.length) { return; }
        var tr0 = document.createElement("tr");
        tr0.className = "ph";
        tr0.innerHTML = '<td colspan="4">Fase ' + p.n + " · " + esc(p.name) + "</td>";
        body.appendChild(tr0);
        list.forEach(function (i) {
          var ms = game.ms[i], m = spec.missions[i];
          var tr = document.createElement("tr");
          tr.innerHTML = "<td>" + esc(m.code) + "</td><td>" + esc(m.title) + "</td>" +
            "<td>" + (ms.skipped ? '<span class="tag">preparada automáticamente</span>'
              : ms.method ? "<code>" + esc(ms.method) + "</code>" : "—") +
              (ms.hintsUsed ? ' <span class="tag">· ' + ms.hintsUsed + " pista" + (ms.hintsUsed > 1 ? "s" : "") + "</span>" : "") + "</td>" +
            '<td class="xp">' + (ms.done ? "+" + ms.earned : "—") + "</td>";
          body.appendChild(tr);
        });
      });

      game.renderRisky(RG.$("riskyList"), texts.noRisky || ("Ninguna. " + doneCount + " tareas resueltas por ti, sin romper nada."));
      RG.showScreen("debrief");
      RG.$("debriefTitle").focus();
    };

    /* ---------------- Portada y botones ---------------- */
    function buildPhaseOptions() {
      var box = RG.$("phaseOptions");
      if (!box) { return; }
      box.innerHTML = "";
      spec.phases.forEach(function (p, i) {
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

    S.init = function () {
      RG.$("startBtn").addEventListener("click", function () { S.startGame(selectedPhase()); });
      RG.$("againBtn").addEventListener("click", function () { S.startGame(state.startPhase); });
      RG.$("homeBtn").addEventListener("click", goHome);
      RG.$("resetBtn").addEventListener("click", function () {
        if (inProgress() && S.clock.started() && !global.confirm("¿Reiniciar? Perderás el progreso actual.")) { return; }
        S.startGame(state.startPhase);
      });
      RG.$("quitBtn").addEventListener("click", function () {
        if (inProgress() && S.clock.started() && !global.confirm("¿Volver a la portada? Perderás el progreso actual.")) { return; }
        goHome();
      });
      RG.Modal.bind();
      buildPhaseOptions();
      S.resetState();
      game.renderStats();
      renderPhases();
      game.renderLog();
      term.renderPrompt();
      RG.showScreen("intro");
      return S;
    };

    return S;
  };
})(this);
