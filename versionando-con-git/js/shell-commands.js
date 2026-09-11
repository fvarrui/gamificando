/* ==========================================================
   Órdenes del shell: ls, cat, echo, nano, sed, grep, cd…
   y el autocompletado con Tab.
   ========================================================== */
(function (global) {
  "use strict";
  var RG = global.RG, VG = global.VG, util = RG.util, cfg = VG.cfg;
  var state = VG.state, term = VG.term, C = VG.commands;
  var has = util.has, sortedKeys = util.sortedKeys, lpad = util.lpad, linesOf = util.linesOf;
  var parseArgs = RG.parseArgs, last = RG.lastOf;
  var pre = term.pre, rich = term.rich, fail = term.fail, sys = term.sys, note = term.note;
  var optError = VG.optError;

  C.git = function (args) { VG.cmdGit(args); };

  C.ls = function (args) {
    var o = parseArgs(args, { short: { a: "all", A: "all", l: "long", h: "x", R: "x", t: "x", r: "x", F: "x", "1": "x" }, long: { all: "all" } });
    if (o.bad || o.missing) { optError(o, "ls"); return; }
    var target = o._[0] ? VG.normPath(o._[0]) : null;
    if (target && state.cwd === "repo" && target !== ".git" && target !== "." && !has(state.work, target) && target.indexOf(".git/") !== 0) {
      fail("ls: no se puede acceder a '" + o._[0] + "': No existe el archivo o el directorio");
      term.status.code = 2;
      return;
    }
    if (target && has(state.work, target)) { pre(target); return; }
    var d = VG.listDir(target === "." ? null : target);
    var dirs = d.dirs.slice(), files = d.files.slice();
    if (!o.all) {
      dirs = dirs.filter(function (n) { return n.charAt(0) !== "."; });
      files = files.filter(function (n) { return n.charAt(0) !== "."; });
    }
    if (o.long) {
      var now = VG.fakeNow().getTime();
      if (o.all) { pre("total " + (dirs.length + files.length) * 4); }
      dirs.forEach(function (n) { pre("drwxr-xr-x 2 " + cfg.USER + " " + cfg.USER + " " + lpad(4096, 5) + " " + VG.fmtLsDate(now) + " " + n); });
      files.forEach(function (n) {
        var content = VG.readFile(n) || "";
        pre("-rw-r--r-- 1 " + cfg.USER + " " + cfg.USER + " " + lpad(content.length, 5) + " " + VG.fmtLsDate(now) + " " + n);
      });
      return;
    }
    var names = dirs.map(function (n) { return n + "/"; }).concat(files);
    if (names.length) {
      rich(names.map(function (n, i) { return [/\/$/.test(n) ? "bl" : "", n + (i < names.length - 1 ? "  " : "")]; }));
    }
  };

  C.cat = function (args) {
    if (!args.length) { fail("cat: (simulador) indica un fichero: cat <fichero>"); return; }
    args.forEach(function (a) {
      var c = VG.readFile(a);
      if (c === null || c === undefined) { fail("cat: " + a + ": No existe el archivo o el directorio"); return; }
      pre(c.replace(/\n$/, ""));
    });
  };

  C.echo = function (args) { pre(args.join(" ")); };

  C.touch = function (args) {
    args.forEach(function (a) {
      var p = VG.normPath(a);
      if (!has(state.work, p)) { VG.writeFile(p, ""); }
    });
  };

  C.rm = function (args) {
    var o = parseArgs(args, { short: { r: "rec", R: "rec", f: "force", i: "x", v: "verbose" }, long: { recursive: "rec", force: "force" } });
    if (o.bad || o.missing) { optError(o, "rm"); return; }
    o._.forEach(function (a) {
      var p = VG.normPath(a);
      if (p === ".git" || p.indexOf(".git/") === 0) {
        sys("warn", "⚠ (simulador) Borrar .git destruiría todo el historial del repositorio. En este reto no está permitido.");
        term.status.code = 1;
        return;
      }
      if (!has(state.work, p)) {
        if (!o.force) { fail("rm: no se puede borrar '" + a + "': No existe el archivo o el directorio"); }
        return;
      }
      delete state.work[p];
      if (o.verbose) { pre("eliminado '" + p + "'"); }
    });
  };

  function mvcp(args, cmd) {
    var o = parseArgs(args, { short: { r: "x", f: "x", v: "verbose", i: "x" }, long: {} });
    if (o.bad || o.missing) { optError(o, cmd); return; }
    if (o._.length !== 2) { fail(cmd + ": (simulador) usa: " + cmd + " <origen> <destino>"); return; }
    var a = VG.normPath(o._[0]), b = VG.normPath(o._[1]);
    if (!has(state.work, a)) { fail(cmd + ": no se puede evaluar '" + o._[0] + "': No existe el archivo o el directorio"); return; }
    state.work[b] = state.work[a];
    if (cmd === "mv") { delete state.work[a]; }
  }
  C.mv = function (args) { mvcp(args, "mv"); };
  C.cp = function (args) { mvcp(args, "cp"); };

  C.mkdir = function () {
    sys("info", "ℹ (simulador) Este proyecto no usa subdirectorios: todos los ficheros están en la raíz del repositorio.");
    term.status.code = 1;
  };

  C.nano = function (args, name) {
    if (name !== "nano") { sys("info", "ℹ (simulador) Se abre nano, el editor configurado en EDITOR."); }
    var o = parseArgs(args, { short: { w: "x", l: "x" }, long: {} });
    var target = o._[0];
    if (!target) { fail("Uso: nano [OPCIONES] [[+LÍNEA[,COLUMNA]] ARCHIVO]..."); term.status.code = 1; return; }
    var p = VG.normPath(target);
    if (p.indexOf(".git/") === 0 && p !== ".git/config") {
      sys("info", "ℹ (simulador) Los ficheros internos de .git no se editan a mano.");
      term.status.code = 1;
      return;
    }
    var content = VG.readFile(target);
    VG.openEditor(state.cwd === "home" ? cfg.HOME + "/" + VG.homeName(p) : cfg.REPO_DIR + "/" + p,
      content === null || content === undefined ? "" : content,
      function (text, saved) { if (saved) { VG.writeFile(target, text); } });
  };
  C.vi = C.vim = C.emacs = C.gedit = C.code = C.nano;

  /* ----- sed: s/patrón/sustituto/[g] y /patrón/d ----- */
  function sedParse(script) {
    var cmds = [];
    String(script).split(";").forEach(function (raw) {
      var part = raw.trim();
      if (!part) { return; }
      var m = /^s(.)/.exec(part);
      if (m) {
        var d = m[1], fields = [], cur = "", i = 2;
        while (i < part.length && fields.length < 2) {
          var ch = part.charAt(i);
          if (ch === "\\" && part.charAt(i + 1) === d) { cur += d; i += 2; continue; }
          if (ch === d) { fields.push(cur); cur = ""; i++; continue; }
          cur += ch;
          i++;
        }
        var flags = part.slice(i);
        if (fields.length < 2) { return; }
        cmds.push({ t: "s", pat: fields[0], rep: fields[1], g: flags.indexOf("g") !== -1, i: flags.indexOf("i") !== -1 });
        return;
      }
      m = /^\/((?:\\.|[^\/])*)\/([dp])$/.exec(part);
      if (m) { cmds.push({ t: m[2], pat: m[1] }); return; }
      m = /^(\d+)d$/.exec(part);
      if (m) { cmds.push({ t: "dline", n: parseInt(m[1], 10) }); return; }
      cmds.push({ t: "?", raw: part });
    });
    return cmds;
  }
  C.sed = function (args) {
    var o = parseArgs(args, { short: { i: "inplace", n: "quiet", e: "=expr", E: "x", r: "x" },
      long: { "in-place": "inplace", expression: "=expr", quiet: "quiet" } });
    if (o.bad || o.missing) { optError(o, "sed"); return; }
    var rest = o._.slice();
    var script = o.expr ? o.expr.join(";") : rest.shift();
    if (script === undefined) { fail("Uso: sed [OPCIÓN]... {guion} [ARCHIVO]..."); term.status.code = 1; return; }
    var cmds = sedParse(script);
    var bad = cmds.filter(function (c) { return c.t === "?"; })[0];
    if (bad) { fail("sed: -e expresión #1, carácter 1: orden desconocida: `" + bad.raw.charAt(0) + "'"); term.status.code = 1; return; }
    if (!rest.length) { fail("sed: (simulador) indica un fichero: sed -i 's/viejo/nuevo/' fichero"); term.status.code = 1; return; }
    rest.forEach(function (f) {
      var content = VG.readFile(f);
      if (content === null || content === undefined) { fail("sed: no se puede leer " + f + ": No existe el archivo o el directorio"); term.status.code = 2; return; }
      var outL = [];
      linesOf(content).forEach(function (l, idx) {
        var drop = false;
        cmds.forEach(function (c) {
          if (drop) { return; }
          if (c.t === "s") {
            var re;
            try { re = new RegExp(c.pat, c.g ? (c.i ? "gi" : "g") : (c.i ? "i" : "")); } catch (e) { re = null; }
            if (re) { l = l.replace(re, c.rep.replace(/\\n/g, "\n")); }
          } else if (c.t === "d") {
            var rd;
            try { rd = new RegExp(c.pat); } catch (e2) { rd = null; }
            if (rd && rd.test(l)) { drop = true; }
          } else if (c.t === "dline" && c.n === idx + 1) { drop = true; }
        });
        if (!drop) { outL.push(l); }
      });
      var result = outL.length ? outL.join("\n") + "\n" : "";
      if (o.inplace) { VG.writeFile(f, result); }
      else if (!o.quiet) { pre(result.replace(/\n$/, "")); }
    });
  };

  C.grep = function (args) {
    var o = parseArgs(args, { short: { i: "ic", v: "inv", n: "num", c: "count", r: "x", E: "x", w: "word" },
      long: { "ignore-case": "ic", "invert-match": "inv", count: "count" } });
    if (o.bad || o.missing) { optError(o, "grep"); return; }
    var pat = o._[0], files = o._.slice(1);
    if (pat === undefined || !files.length) { fail("Modo de empleo: grep [OPCIÓN]... PATRONES [ARCHIVO]..."); term.status.code = 2; return; }
    var re;
    try { re = new RegExp(pat, o.ic ? "i" : ""); } catch (e) { re = null; }
    var found = false;
    files.forEach(function (f) {
      var c = VG.readFile(f);
      if (c === null || c === undefined) { fail("grep: " + f + ": No existe el archivo o el directorio"); return; }
      linesOf(c).forEach(function (l, i) {
        var hit = re ? re.test(l) : l.indexOf(pat) !== -1;
        if (o.inv ? hit : !hit) { return; }
        found = true;
        rich([["m", (files.length > 1 ? f + ":" : "") + (o.num ? (i + 1) + ":" : "")], ["", l]]);
      });
    });
    if (!found) { term.status.code = 1; }
  };

  function headTail(args, cmd) {
    var o = parseArgs(args, { short: { n: "=n", l: "lines", c: "x", w: "x" }, long: { lines: "=n" }, numeric: true });
    if (o.bad || o.missing) { optError(o, cmd); return; }
    var n = o.n ? parseInt(last(o.n), 10) : 10;
    o._.forEach(function (f) {
      var c = VG.readFile(f);
      if (c === null || c === undefined) { fail(cmd + ": no se puede abrir '" + f + "' para lectura: No existe el archivo o el directorio"); return; }
      var ls = linesOf(c);
      if (cmd === "wc") { pre(lpad(ls.length, 6) + " " + f); return; }
      pre((cmd === "head" ? ls.slice(0, n) : ls.slice(-n)).join("\n"));
    });
  }
  C.head = function (args) { headTail(args, "head"); };
  C.tail = function (args) { headTail(args, "tail"); };
  C.wc = function (args) { headTail(args, "wc"); };

  C.cd = function (args) {
    var t = args[0] ? VG.normPath(args[0]).replace(/\/$/, "") : "~";
    if (t === "~" || t === cfg.HOME || t === "" || t === "..") { state.cwd = "home"; term.renderPrompt(); return; }
    if (t === ".") { return; }
    if (t === cfg.REPO_NAME || t === cfg.REPO_DIR || t === "~/" + cfg.REPO_NAME) { state.cwd = "repo"; term.renderPrompt(); return; }
    if (state.cwd === "repo" && t === "-") { state.cwd = "home"; term.renderPrompt(); return; }
    fail("bash: cd: " + args[0] + ": No existe el archivo o el directorio");
  };

  C.pwd = function () { pre(state.cwd === "repo" ? cfg.REPO_DIR : cfg.HOME); };
  C.whoami = function () { pre(cfg.USER); };
  C.id = function () { pre("uid=1000(" + cfg.USER + ") gid=1000(" + cfg.USER + ") grupos=1000(" + cfg.USER + "),27(sudo)"); };
  C.hostname = function () { pre(cfg.HOST); };
  C.uname = function (args) {
    pre(args.indexOf("-a") !== -1
      ? "Linux " + cfg.HOST + " 6.8.0-45-generic #45-Ubuntu SMP PREEMPT_DYNAMIC Fri Aug 30 12:02:04 UTC 2024 x86_64 x86_64 x86_64 GNU/Linux"
      : "Linux");
  };
  C.date = function () { pre(VG.fmtSysDate(VG.fakeNow())); };
  C.clear = function () { term.clear(); };
  C.history = function () { term.history.forEach(function (h, i) { pre(lpad(i + 1, 5) + "  " + h); }); };
  C.chmod = C.chown = function () {};
  C.which = function (args) { pre("/usr/bin/" + (args[0] || "")); };
  C.tree = function () { C.ls(["-a"]); };

  C.man = function (args) {
    if (!args.length) { fail("¿Qué página de manual desea?"); term.status.code = 1; return; }
    var t = args[args.length - 1];
    var key = VG.MAN[t] ? t : VG.MAN["git-" + t] ? "git-" + t : VG.MAN_ALIASES[t];
    if (!key || !VG.MAN[key]) { fail("No hay entrada de manual para " + t); term.status.code = 16; return; }
    state.flags.usedMan = true;
    RG.man.render(term, key, VG.MAN[key]);
  };

  C.help = C.ayuda = function () {
    state.flags.usedMan = true;
    pre("Órdenes disponibles en este simulador\n");
    rich([["gb", "  Git — empezar:        "], ["", "git init [-b main] · git config --global user.name \"…\" · git status"]]);
    rich([["gb", "  Git — ciclo básico:   "], ["", "git add · git commit [-a] [-m] [--amend] · git diff [--staged] · git log [--oneline --graph --all] · git show"]]);
    rich([["gb", "  Git — ficheros:       "], ["", "git rm · git mv · git restore [--staged] · git clean -n|-f · git check-ignore -v"]]);
    rich([["gb", "  Git — deshacer:       "], ["", "git reset [--soft|--mixed|--hard] · git revert · git reflog · git stash [list|pop]"]]);
    rich([["gb", "  Git — ramas:          "], ["", "git branch [-v|-a|-d] · git switch [-c] · git checkout · git merge [--abort] · git rebase · git cherry-pick · git tag [-a]"]]);
    rich([["gb", "  Git — remoto:         "], ["", "git remote [-v|add] · git push [-u] · git fetch · git pull [--rebase]"]]);
    rich([["gb", "  Shell:                "], ["", "ls [-la] · cat · echo texto > fichero (>> añade) · touch · rm · mv · cp · sed -i · grep · nano · cd · pwd · history · clear · exit"]]);
    rich([["gb", "  Ayuda:                "], ["", "man <orden> (p. ej. man git-commit) · git help <orden> · git <orden> --help"]]);
    pre("");
    pre("Encadena órdenes con && (si la anterior funciona), || (si falla) o ; y filtra con | grep, | head, | tail, | wc -l, | sort.");
    pre("Atajos: ↑/↓ historial · Tab autocompletar · Ctrl+L limpiar · Ctrl+C cancelar la línea.");
  };

  C.exit = C.logout = function () {
    pre("exit");
    state.reopening = true;
    term.setLocked(true);
    VG.timers.later(function () {
      term.clear();
      term.line("dim", "Sesión cerrada. Abriendo una terminal nueva…");
      term.line("dim", "(el repositorio y tu progreso se conservan)");
      term.line("text", "");
      state.reopening = false;
      term.setLocked(false);
    }, 900);
  };

  C.sudo = function (args) {
    if (!args.length) { fail("uso: sudo <orden>"); return; }
    sys("info", "ℹ No necesitas sudo: trabajas con tus propios ficheros.");
    var fn = VG.commands[args[0]];
    if (fn) { fn(args.slice(1), args[0]); } else { fail("sudo: " + args[0] + ": orden no encontrada"); }
  };

  /* ---------------- Autocompletado ---------------- */
  function fileNames() {
    if (state.cwd === "home") { return sortedKeys(state.homeFiles).concat([".gitconfig"]); }
    return sortedKeys(state.work).concat(state.git ? [".git/"] : []);
  }
  function refNames() {
    var g = state.git;
    if (!g) { return []; }
    var names = sortedKeys(g.branches).concat(sortedKeys(g.tags));
    sortedKeys(g.remoteRefs).forEach(function (r) { sortedKeys(g.remoteRefs[r]).forEach(function (b) { names.push(r + "/" + b); }); });
    return names.concat(["HEAD", "HEAD~1", "ORIG_HEAD"]);
  }
  VG.completion = function (parts) {
    if (parts.length === 1) { return VG.COMMANDS; }
    var c = parts[0];
    if (c === "git") {
      if (parts.length === 2) { return VG.GIT_COMMANDS; }
      var sub = parts[1];
      if (["switch", "checkout", "merge", "rebase", "branch", "cherry-pick", "revert", "show", "log", "reset"].indexOf(sub) !== -1) {
        return refNames().concat(fileNames());
      }
      if (["add", "rm", "restore", "diff", "mv", "blame", "check-ignore"].indexOf(sub) !== -1) { return fileNames(); }
      if (["push", "pull", "fetch", "remote"].indexOf(sub) !== -1) {
        return sortedKeys(state.git ? state.git.remotes : {})
          .concat(sortedKeys(state.git ? state.git.branches : {}), ["add", "-v", "-u", "--tags"]);
      }
      if (sub === "config") { return ["--global", "--list", "user.name", "user.email", "init.defaultBranch", "pull.rebase", "alias.lg"]; }
      if (sub === "stash") { return ["push", "pop", "list", "apply", "drop", "show"]; }
      if (sub === "tag") { return ["-a", "-d", "-m"].concat(sortedKeys(state.git ? state.git.tags : {})); }
      return [];
    }
    if (["cat", "nano", "rm", "sed", "grep", "head", "tail", "wc", "mv", "cp", "touch", "vi", "vim", "less"].indexOf(c) !== -1) { return fileNames(); }
    if (c === "man") { return Object.keys(VG.MAN); }
    if (c === "cd") { return state.cwd === "home" ? [cfg.REPO_NAME] : ["..", "~"]; }
    return [];
  };
})(this);
