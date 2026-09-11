/* ==========================================================
   Estado del simulador y montaje de terminal, shell y editor.
   El repositorio vive entero en memoria:
     state.work      directorio de trabajo (plano)
     state.git       el .git (índice, ramas, HEAD, reflog, stash…)
     state.commits   almacén de objetos
     state.server    referencias del servidor remoto simulado
   ========================================================== */
(function (global) {
  "use strict";
  var RG = global.RG, VG = global.VG, util = RG.util, cfg = VG.cfg;

  /* El objeto de estado NO se sustituye nunca (los módulos guardan
     una referencia a él): se vacía y se vuelve a rellenar. */
  var state = VG.state = {};
  VG.events = [];

  VG.resetState = function () {
    Object.keys(state).forEach(function (k) { delete state[k]; });
    state.work = util.copy(VG.INITIAL_FILES);
    state.homeFiles = util.copy(VG.HOME_FILES);
    state.cwd = "repo";
    state.global = {};
    state.git = null;
    state.commits = {};
    state.seq = 0;
    state.server = { refs: {}, tags: {} };
    state.flags = { usedMan: false, usedReflog: false, reviewed: false, viewedMap: false };
    state.myCommits = [];
    state.mem = {};
    state.startPhase = 0;
    state.reopening = false;
    VG.events.length = 0;
  };
  VG.resetState();

  VG.emit = function (ev) { VG.events.push(ev); };
  VG.risky = function (kind, text) { if (VG.game) { VG.game.addRisky(kind, text); } };

  /* ---------------- Reloj y fechas ---------------- */
  VG.clock = RG.Clock(RG.$("clock"));
  VG.fakeNow = function () {
    return new Date(cfg.CLOCK_BASE.getTime() + VG.clock.elapsed() + state.seq * 7000);
  };
  /* «Mon Sep 14 09:03:12 2026 +0100» (git no traduce las fechas) */
  VG.fmtGitDate = function (ts) {
    var d = new Date(ts);
    return util.DAYS_EN[d.getDay()] + " " + util.MONTHS_EN[d.getMonth()] + " " + d.getDate() + " " +
      util.fmtTime(d) + " " + d.getFullYear() + " " + cfg.TZ;
  };
  VG.fmtIsoDate = function (ts) {
    var d = new Date(ts);
    return d.getFullYear() + "-" + util.pad2(d.getMonth() + 1) + "-" + util.pad2(d.getDate()) + " " + util.fmtTime(d) + " " + cfg.TZ;
  };
  VG.fmtSysDate = function (d) { return util.fmtDateEs(d, cfg.TZ_NAME); };
  VG.fmtLsDate = function (ts) {
    var d = new Date(ts);
    return util.MONTHS_ES[d.getMonth()] + " " + util.lpad(d.getDate(), 2) + " " + util.pad2(d.getHours()) + ":" + util.pad2(d.getMinutes());
  };

  /* ---------------- Rutas y ficheros ---------------- */
  VG.displayPath = function (p) {
    return String(p).replace(cfg.REPO_DIR, "~/" + cfg.REPO_NAME).replace(cfg.HOME + "/", "~/");
  };
  VG.isHomePath = function (p) { return /^~\//.test(p) || p.indexOf(cfg.HOME + "/") === 0; };
  VG.homeName = function (p) { return p.replace(/^~\//, "").replace(cfg.HOME + "/", ""); };
  VG.normPath = function (p) {
    p = String(p);
    if (p.indexOf(cfg.REPO_DIR + "/") === 0) { p = p.slice(cfg.REPO_DIR.length + 1); }
    if (p.indexOf("~/" + cfg.REPO_NAME + "/") === 0) { p = p.slice(cfg.REPO_NAME.length + 3); }
    while (p.indexOf("./") === 0) { p = p.slice(2); }
    return p;
  };

  /* Ficheros internos de .git que se pueden leer con cat */
  VG.gitVirtual = function (p) {
    var g = state.git;
    if (!g || p.indexOf(".git/") !== 0) { return undefined; }
    var rest = p.slice(5);
    if (rest === "HEAD") { return g.HEAD.branch ? "ref: refs/heads/" + g.HEAD.branch + "\n" : g.HEAD.detached + "\n"; }
    if (rest === "config") { return VG.iniRender(VG.configEntries("local")); }
    if (rest === "ORIG_HEAD") { return g.origHead ? g.origHead + "\n" : null; }
    if (rest === "MERGE_HEAD") { return g.op && g.op.type === "merge" ? g.op.theirs + "\n" : null; }
    if (rest === "FETCH_HEAD") { return g.fetchHead ? g.fetchHead + "\thttps\n" : null; }
    if (rest === "description") { return "Unnamed repository; edit this file 'description' to name the repository.\n"; }
    var m = /^refs\/heads\/(.+)$/.exec(rest);
    if (m) { return util.has(g.branches, m[1]) ? g.branches[m[1]] + "\n" : null; }
    m = /^refs\/tags\/(.+)$/.exec(rest);
    if (m) { return util.has(g.tags, m[1]) ? g.tags[m[1]].target + "\n" : null; }
    m = /^refs\/remotes\/([^\/]+)\/(.+)$/.exec(rest);
    if (m) { return VG.remoteRef(m[1], m[2]) ? VG.remoteRef(m[1], m[2]) + "\n" : null; }
    return null;
  };

  VG.readFile = function (p) {
    p = String(p);
    if (VG.isHomePath(p) || state.cwd === "home") {
      var n = VG.homeName(VG.normPath(p));
      if (n === ".gitconfig") { return VG.iniRender(VG.configEntries("global")); }
      return util.has(state.homeFiles, n) ? state.homeFiles[n] : null;
    }
    p = VG.normPath(p);
    var v = VG.gitVirtual(p);
    if (v !== undefined) { return v; }
    return util.has(state.work, p) ? state.work[p] : null;
  };
  VG.writeFile = function (p, text) {
    if (VG.isHomePath(p) || state.cwd === "home") {
      var n = VG.homeName(VG.normPath(p));
      if (n === ".gitconfig") { state.global = VG.iniParse(text); return true; }
      state.homeFiles[n] = text;
      return true;
    }
    p = VG.normPath(p);
    if (p.indexOf(".git/") === 0) {
      if (p === ".git/config" && state.git) { VG.applyLocalConfig(VG.iniParse(text)); return true; }
      return false;
    }
    state.work[p] = text;
    return true;
  };
  VG.listDir = function (target) {
    if (state.cwd === "home") {
      return { dirs: [cfg.REPO_NAME], files: util.sortedKeys(state.homeFiles).concat([".gitconfig"]).sort() };
    }
    if (target === ".git") {
      return { dirs: ["branches", "hooks", "info", "logs", "objects", "refs"], files: ["config", "description", "HEAD", "index"] };
    }
    return { dirs: state.git ? [".git"] : [], files: util.sortedKeys(state.work) };
  };

  /* ---------------- Prompt ---------------- */
  VG.gitPromptInfo = function () {
    var g = state.git;
    if (!g) { return ""; }
    var s = g.HEAD.branch ? g.HEAD.branch : "(" + VG.short(g.HEAD.detached) + "...)";
    if (g.op) {
      if (g.op.type === "merge") { s += "|MERGING"; }
      else if (g.op.type === "cherry-pick") { s += "|CHERRY-PICKING"; }
      else if (g.op.type === "revert") { s += "|REVERTING"; }
      else if (g.op.type === "rebase") { s = g.op.branch + "|REBASE " + (g.op.done.length + 1) + "/" + g.op.total; }
    }
    return s;
  };
  VG.cwdPath = function () { return state.cwd === "repo" ? "~/" + cfg.REPO_NAME : "~"; };
  VG.promptHtml = function () {
    var branch = state.cwd === "repo" ? VG.gitPromptInfo() : "";
    return '<span class="p-user">' + cfg.USER + "@" + cfg.HOST + '</span>:<span class="p-path">' + util.esc(VG.cwdPath()) + "</span>" +
      (branch ? '<span class="p-branch"> (' + util.esc(branch) + ")</span>" : "") + "$ ";
  };

  /* ---------------- Terminal, shell y editor ---------------- */
  VG.timers = RG.Timers();
  VG.commands = {};   // lo rellena js/shell-commands.js

  VG.term = RG.Terminal({
    promptHtml: VG.promptHtml,
    titleText: function () { return cfg.USER + "@" + cfg.HOST + ": " + VG.cwdPath() + " — bash"; },
    completion: function (parts) { return VG.completion(parts); },
    canFocus: function () { return !RG.Modal.isOpen() && !VG.editor.isOpen(); },
    onCommand: function (raw) {
      VG.term.setLocked(true);
      VG.shell.runLine(raw);
    }
  });

  VG.shell = RG.Shell(VG.term, {
    commands: VG.commands,
    fs: {
      list: function () { return state.cwd === "home" ? VG.listDir().files.concat(VG.listDir().dirs) : util.sortedKeys(state.work); },
      read: VG.readFile,
      write: VG.writeFile
    },
    afterCommand: function () { if (VG.afterCommand) { VG.afterCommand(); } },
    afterLine: function () { if (VG.afterLine) { VG.afterLine(); } }
  });

  VG.editor = RG.Editor(VG.term, VG.shell, { displayPath: VG.displayPath });
  VG.openEditor = function (file, content, onDone) { VG.editor.open(file, content, onDone); };

  /* Atajos usados por el resto de módulos */
  VG.term.hint = function (text) {
    VG.term.pushRows(VG.term.rowsFromText("warn", text.split("\n").map(function (l) { return "ayuda: " + l; }).join("\n"), true), true);
  };
})(this);
