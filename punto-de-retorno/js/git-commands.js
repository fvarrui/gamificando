/* ==========================================================
   git: despachador y comandos básicos
   init · config · status · add · rm · mv · commit
   ========================================================== */
(function (global) {
  "use strict";
  var RG = global.RG, VG = global.VG, util = RG.util, cfg = VG.cfg;
  var state = VG.state, term = VG.term;
  var has = util.has, copy = util.copy, sortedKeys = util.sortedKeys, unionKeys = util.unionKeys;
  var pad = util.pad, linesOf = util.linesOf, firstLine = util.firstLine;
  var parseArgs = RG.parseArgs, last = RG.lastOf;
  var pre = term.pre, rich = term.rich, note = term.note, fail = term.fail, sys = term.sys, hint = term.hint;
  var GIT = VG.GIT = {};

  VG.optError = function (o, sub) {
    if (o.bad) { fail("error: opción desconocida '" + o.bad.replace(/^-+/, "") + "'"); }
    else { fail("error: la opción '" + o.missing.replace(/^-+/, "") + "' requiere un valor"); }
    var page = VG.MAN["git-" + sub];
    if (page) { note(RG.man.usage(page)); }
    term.status.code = 129;
    return true;
  };
  var optError = VG.optError;

  /* ---------------- Despachador ---------------- */
  VG.cmdGit = function (args) {
    if (!args.length) {
      pre("uso: git [-v | --version] [-h | --help] <comando> [<args>]\n\n" +
        "Estos son comandos comunes de Git usados en varias situaciones:\n\n" +
        "comenzar un área de trabajo\n   init       Crea un repositorio de Git vacío o reinicia uno existente\n\n" +
        "trabajar en los cambios actuales\n   add        Agrega contenido de archivos al índice\n   mv         Mueve o cambia el nombre a archivos\n" +
        "   restore    Restaurar archivos de árboles de trabajo\n   rm         Borra archivos del árbol de trabajo y del índice\n\n" +
        "examinar el historial y el estado\n   diff       Muestra los cambios entre commits, commit y árbol de trabajo, etc\n" +
        "   log        Muestra los logs de los commits\n   show       Muestra varios tipos de objetos\n   status     Muestra el estado del árbol de trabajo\n\n" +
        "hacer crecer, marcar y ajustar tu historial común\n   branch     Lista, crea o borra ramas\n   commit     Graba los cambios en el repositorio\n" +
        "   merge      Junta dos o más historiales de desarrollo juntos\n   rebase     Vuelve a aplicar commits en la punta de otra rama\n" +
        "   reset      Reinicia el HEAD actual a un estado específico\n   switch     Cambiar branches\n   tag        Crea, lista, borra o verifica un tag\n\n" +
        "colaborar\n   fetch      Descarga objetos y referencias de otro repositorio\n   pull       Obtiene e integra con otro repositorio o rama local\n" +
        "   push       Actualiza referencias remotas junto con sus objetos asociados\n\n" +
        "'git help <comando>' o 'git help <concepto>' para leer sobre un subcomando o concepto específico.");
      term.status.code = 1;
      return;
    }
    var sub = args[0];
    if (sub === "--version" || sub === "-v" || sub === "version") { pre("git version " + cfg.GIT_VERSION); return; }
    if (sub === "--help" || sub === "-h" || sub === "help") { VG.gitHelp(args[1]); return; }
    // alias definidos con git config alias.<nombre>
    var alias = VG.GIT_COMMANDS.indexOf(sub) === -1 ? VG.cfgGet("alias." + sub) : null;
    if (alias) {
      var exp = RG.lex(alias).filter(function (t) { return t.w; }).map(function (t) { return t.v; });
      args = exp.concat(args.slice(1));
      sub = args[0];
    }
    var rest = args.slice(1);
    if (rest.indexOf("--help") !== -1) { VG.gitHelp(sub); return; }
    var fn = GIT[sub];
    if (!fn) {
      fail("git: '" + sub + "' no es un comando de git. Mira 'git --help'.");
      var sim = VG.GIT_COMMANDS.filter(function (c) { return util.lev(c, sub) <= 2; });
      if (sim.length) { note("\nEl comando más similar es\n" + sim.map(function (s) { return "\t" + s; }).join("\n")); }
      term.status.code = 1;
      return;
    }
    if (rest[0] === "-h" && VG.MAN["git-" + sub]) { note(RG.man.usage(VG.MAN["git-" + sub])); term.status.code = 129; return; }
    var noRepo = { init: true, config: true, help: true, clone: true };
    if (!noRepo[sub] && (!state.git || state.cwd !== "repo")) {
      fail("fatal: no es un repositorio git (ni ninguno de los directorios superiores): .git");
      term.status.code = 128;
      return;
    }
    fn(rest);
  };

  VG.gitHelp = function (topic) {
    state.flags.usedMan = true;
    if (!topic) { VG.cmdGit([]); term.status.code = 0; return; }
    var key = VG.MAN[topic] ? topic : "git-" + topic;
    if (!VG.MAN[key]) { fail("No hay entrada de manual para git-" + topic); return; }
    RG.man.render(term, key, VG.MAN[key]);
  };

  /* ---------------- git init ---------------- */
  GIT.init = function (args) {
    var o = parseArgs(args, { short: { b: "=branch", q: "quiet" }, long: { "initial-branch": "=branch", quiet: "quiet", bare: "bare" } });
    if (o.bad || o.missing) { optError(o, "init"); return; }
    if (o.bare) { sys("info", "ℹ (simulador) Los repositorios --bare son los del servidor; aquí trabajas con un repositorio normal."); term.status.code = 1; return; }
    if (o._.length && VG.normPath(o._[0]) !== "." && o._[0] !== cfg.REPO_DIR) {
      sys("info", "ℹ (simulador) En este reto el repositorio se crea en ~/" + cfg.REPO_NAME + ". Entra en la carpeta y usa git init sin directorio.");
      term.status.code = 1;
      return;
    }
    if (state.cwd !== "repo") {
      sys("info", "ℹ Estás en tu carpeta personal (~). El proyecto está en ~/" + cfg.REPO_NAME + ": entra con cd " + cfg.REPO_NAME + " antes de crear el repositorio.");
      term.status.code = 1;
      return;
    }
    if (state.git) {
      if (o.branch) { note("advertencia: re-init: ignorado --initial-branch=" + last(o.branch)); }
      pre("Reinicializado el repositorio Git existente en " + cfg.REPO_DIR + "/.git/");
      return;
    }
    var br = o.branch ? last(o.branch) : VG.cfgGet("init.defaultbranch");
    if (br && !VG.validRef(br)) { fail("fatal: '" + br + "' no es un nombre de rama válido"); term.status.code = 128; return; }
    if (!br) {
      br = "master";
      hint("Usando 'master' como el nombre de la rama inicial. Este nombre de rama predeterminado\n" +
        "está sujeto a cambios. Para configurar el nombre de la rama inicial para usar en todos\n" +
        "de sus nuevos repositorios, reprimiendo esta advertencia, llama a:\n\n" +
        "\tgit config --global init.defaultBranch <nombre>\n\n" +
        "Los nombres comúnmente elegidos en lugar de 'master' son 'main', 'trunk' y\n" +
        "'development'. Se puede cambiar el nombre de la rama recién creada mediante\n" +
        "este comando:\n\n\tgit branch -m <nombre>");
    }
    state.git = VG.newRepo(br);
    state.git.config = {
      "core.repositoryformatversion": "0", "core.filemode": "true", "core.bare": "false", "core.logallrefupdates": "true"
    };
    pre("Inicializado repositorio Git vacío en " + cfg.REPO_DIR + "/.git/");
    VG.emit({ type: "init" });
  };

  /* ---------------- git config ---------------- */
  GIT.config = function (args) {
    var o = parseArgs(args, {
      short: { l: "list", e: "edit" },
      long: { global: "global", local: "local", system: "system", list: "list", unset: "unset", "unset-all": "unset", get: "get",
        edit: "edit", "show-origin": "origin", add: "add", "replace-all": "add", "name-only": "nameOnly" }
    });
    if (o.bad || o.missing) { optError(o, "config"); return; }
    var inRepo = !!state.git && state.cwd === "repo";
    if (o.system) { fail("error: no se pudo bloquear el archivo de configuración /etc/gitconfig: Permiso denegado"); return; }
    var scope = o.global ? "global" : (o.local || inRepo) ? "local" : "global";
    var isWrite = o.unset || o.edit || (o._.length >= 2 && !o.get);
    if (scope === "local" && !inRepo) { fail("fatal: --local solo puede ser usado dentro de un repositorio git"); term.status.code = 128; return; }
    if (!o.global && !o.local && !inRepo && isWrite) { fail("fatal: no en un directorio git"); term.status.code = 128; return; }

    if (o.list) {
      var globals = o.local ? [] : VG.configEntries("global");
      var locals = o.global || !inRepo ? [] : VG.configEntries("local");
      globals.forEach(function (e) { pre((o.origin ? pad("file:" + cfg.HOME + "/.gitconfig", 34) + "\t" : "") + e[0] + (o.nameOnly ? "" : "=" + e[1])); });
      locals.forEach(function (e) { pre((o.origin ? pad("file:.git/config", 34) + "\t" : "") + e[0] + (o.nameOnly ? "" : "=" + e[1])); });
      return;
    }
    if (o.edit) {
      var file = scope === "global" ? cfg.HOME + "/.gitconfig" : cfg.REPO_DIR + "/.git/config";
      VG.openEditor(file, VG.iniRender(VG.configEntries(scope)), function (text, saved) {
        if (!saved) { return; }
        if (scope === "global") { state.global = VG.iniParse(text); } else { VG.applyLocalConfig(VG.iniParse(text)); }
      });
      return;
    }
    var key = o._[0];
    if (!key) { note("uso: git config [<opciones>]"); term.status.code = 129; return; }
    if (key.indexOf(".") <= 0 || /\.$/.test(key)) { fail("error: la clave no contiene una sección: " + key); term.status.code = 1; return; }
    var lk = key.toLowerCase();
    var store = scope === "global" ? state.global : state.git.config;
    if (o.unset) {
      if (scope === "local" && /^remote\.|^branch\./.test(lk)) {
        var conf = {};
        VG.configEntries("local").forEach(function (e) { if (e[0] !== lk) { conf[e[0]] = e[1]; } });
        VG.applyLocalConfig(conf);
      } else if (has(store, lk)) { delete store[lk]; } else { term.status.code = 5; }
      return;
    }
    if (o._.length === 1 || o.get) {
      var localVal = inRepo ? VG.configEntries("local").filter(function (e) { return e[0] === lk; }).map(function (e) { return e[1]; })[0] : undefined;
      var val = o.global ? (has(state.global, lk) ? state.global[lk] : null)
        : o.local ? (localVal === undefined ? null : localVal)
        : (VG.cfgGet(lk) !== null && VG.cfgGet(lk) !== undefined ? VG.cfgGet(lk) : (localVal === undefined ? null : localVal));
      if (val === null || val === undefined) { term.status.code = 1; return; }
      pre(val);
      return;
    }
    var value = o._[1];
    if (scope === "local" && /^(remote|branch)\./.test(lk)) {
      var all = {};
      VG.configEntries("local").forEach(function (e) { all[e[0]] = e[1]; });
      all[lk] = value;
      VG.applyLocalConfig(all);
    } else {
      store[lk] = value;
    }
    if (o._.length > 2) {
      sys("info", "ℹ Solo se ha guardado «" + value + "». Si el valor tiene espacios, escríbelo entre comillas: git config " +
        (o.global ? "--global " : "") + key + " \"" + o._.slice(1).join(" ") + "\"");
    }
    VG.emit({ type: "config", key: lk, value: value, scope: scope });
  };

  /* ---------------- git status ---------------- */
  var ST_LABEL = VG.ST_LABEL = { "new": "nuevos archivos:", mod: "modificados:", del: "borrados:", ren: "renombrados:" };

  var trackingLines = VG.trackingLines = function (branch) {
    var g = state.git, up = g.upstream[branch];
    if (!up) { return []; }
    var name = up.remote + "/" + up.branch, r = VG.remoteRef(up.remote, up.branch);
    if (!r) { return ["Tu rama está basada en '" + name + "', pero upstream ha desaparecido.", "  (usa \"git branch --unset-upstream\" para arreglar)"]; }
    var tip = VG.branchTip(branch);
    if (!tip) { return []; }
    var ab = VG.aheadBehind(tip, r);
    if (!ab.ahead && !ab.behind) { return ["Tu rama está actualizada con '" + name + "'."]; }
    if (ab.ahead && !ab.behind) {
      return ["Tu rama está adelantada a '" + name + "' por " + util.plural(ab.ahead, "commit", "commits") + ".",
        "  (usa \"git push\" para publicar tus commits locales)"];
    }
    if (!ab.ahead) {
      return ["Tu rama está detrás de '" + name + "' por " + util.plural(ab.behind, "commit", "commits") + ", y puede ser avanzada rápido.",
        "  (usa \"git pull\" para actualizar tu rama local)"];
    }
    return ["Tu rama y '" + name + "' han divergido,",
      "y tienen " + ab.ahead + " y " + ab.behind + " commits diferentes cada una respectivamente.",
      "  (usa \"git pull\" si quieres integrar la rama remota con la tuya)"];
  };

  var printLongStatus = VG.printLongStatus = function (st) {
    var g = state.git;
    if (g.op && g.op.type === "rebase") {
      rich([["r", "rebase en progreso; sobre " + VG.short(g.op.onto)]]);
      pre("Estás rebasando la rama '" + g.op.branch + "' sobre '" + VG.short(g.op.onto) + "'.");
      pre(st.unmerged.length ? "  (arregla los conflictos y luego ejecuta \"git rebase --continue\")" : "  (todos los conflictos resueltos: ejecuta \"git rebase --continue\")");
      pre("  (usa \"git rebase --skip\" para omitir este parche)\n  (usa \"git rebase --abort\" para volver a tu rama original)");
    } else if (g.HEAD.branch) {
      pre("En la rama " + g.HEAD.branch);
      trackingLines(g.HEAD.branch).forEach(function (l) { pre(l); });
    } else {
      rich([["r", "HEAD desacoplada en " + VG.short(g.HEAD.detached)]]);
    }
    if (g.op && g.op.type === "merge") {
      pre(st.unmerged.length
        ? "Tienes rutas no fusionadas.\n  (arregla los conflictos y ejecuta \"git commit\")\n  (usa \"git merge --abort\" para abortar la fusion)"
        : "Todos los conflictos resueltos pero sigues fusionando.\n  (usa \"git commit\" para concluir la fusión)");
    } else if (g.op && (g.op.type === "cherry-pick" || g.op.type === "revert")) {
      var cp = g.op.type === "cherry-pick";
      pre((cp ? "Estás aplicando cherry-pick del commit " : "Estás revirtiendo el commit ") + VG.short(g.op.commit) + ".");
      pre(st.unmerged.length ? "  (arregla los conflictos y ejecuta \"git " + g.op.type + " --continue\")" : "  (todos los conflictos resueltos: ejecuta \"git " + g.op.type + " --continue\")");
      pre("  (usa \"git " + g.op.type + " --abort\" para cancelar la operación)");
    }
    if (!VG.headHash()) { pre(""); pre("No hay commits todavía"); }
    if (st.staged.length) {
      pre("");
      pre("Cambios a ser confirmados:");
      pre(VG.headHash() ? "  (usa \"git restore --staged <archivo>...\" para sacar del área de stage)" : "  (usa \"git rm --cached <archivo>...\" para sacar del área de stage)");
      st.staged.forEach(function (e) {
        rich([["", "\t"], ["g", pad(ST_LABEL[e.type], 17) + (e.type === "ren" ? e.from + " -> " + e.path : e.path)]]);
      });
    }
    if (st.unmerged.length) {
      pre("");
      pre("Rutas no fusionadas:");
      pre("  (usa \"git add <archivo>...\" para marcar una resolución)");
      st.unmerged.forEach(function (p) {
        var u = g.unmerged[p];
        var label = u.ours === undefined ? "borrados por nosotros:" : u.theirs === undefined ? "borrados por ellos:" : u.base === undefined ? "agregados por ambos:" : "ambos modificados:";
        rich([["", "\t"], ["r", pad(label, 22) + p]]);
      });
    }
    if (st.unstaged.length) {
      pre("");
      pre("Cambios no rastreados para el commit:");
      var anyDel = st.unstaged.some(function (e) { return e.type === "del"; });
      pre(anyDel ? "  (usa \"git add/rm <archivo>...\" para actualizar a lo que se le va a hacer commit)" : "  (usa \"git add <archivo>...\" para actualizar lo que será confirmado)");
      pre("  (usa \"git restore <archivo>...\" para descartar los cambios en el directorio de trabajo)");
      st.unstaged.forEach(function (e) { rich([["", "\t"], ["r", pad(ST_LABEL[e.type], 17) + e.path]]); });
    }
    if (st.untracked.length) {
      pre("");
      pre("Archivos sin seguimiento:");
      pre("  (usa \"git add <archivo>...\" para incluirlo a lo que será confirmado)");
      st.untracked.forEach(function (p) { rich([["", "\t"], ["r", p]]); });
    }
    pre("");
    if (st.staged.length || st.unmerged.length) { return; }
    if (st.unstaged.length) { pre("sin cambios agregados al commit (usa \"git add\" y/o \"git commit -a\")"); }
    else if (st.untracked.length) { pre("no hay nada agregado al commit pero hay archivos sin seguimiento presentes (usa \"git add\" para hacerles seguimiento)"); }
    else if (!VG.headHash()) { pre("no hay nada para confirmar (crea/copia archivos y usa \"git add\" para hacerles seguimiento)"); }
    else if (!(g.op && g.op.type === "merge")) { pre("nada para hacer commit, el árbol de trabajo está limpio"); }
  };

  GIT.status = function (args) {
    var o = parseArgs(args, { short: { s: "short", b: "branch", u: "=untracked", v: "verbose" },
      long: { short: "short", branch: "branch", long: "long", porcelain: "short", verbose: "verbose" } });
    if (o.bad || o.missing) { optError(o, "status"); return; }
    var st = VG.computeStatus(), g = state.git;
    if (o.short) {
      if (o.branch) {
        var b = g.HEAD.branch, segs = [["", "## "]];
        if (!b) { segs.push(["r", "HEAD (sin rama)"]); }
        else if (!VG.headHash()) { segs.push(["", "No hay commits todavía en "], ["g", b]); }
        else {
          segs.push(["g", b]);
          var up = g.upstream[b];
          if (up && VG.remoteRef(up.remote, up.branch)) {
            segs.push(["", "..."], ["r", up.remote + "/" + up.branch]);
            var ab = VG.aheadBehind(VG.branchTip(b), VG.remoteRef(up.remote, up.branch));
            var parts = [];
            if (ab.ahead) { parts.push("adelante " + ab.ahead); }
            if (ab.behind) { parts.push("detrás " + ab.behind); }
            if (parts.length) { segs.push(["", " ["], ["g", parts.join(", ")], ["", "]"]); }
          }
        }
        rich(segs);
      }
      var map = {};
      st.staged.forEach(function (e) {
        map[e.path] = map[e.path] || [" ", " "];
        map[e.path][0] = { "new": "A", mod: "M", del: "D", ren: "R" }[e.type];
        if (e.type === "ren") { map[e.path].from = e.from; }
      });
      st.unstaged.forEach(function (e) { map[e.path] = map[e.path] || [" ", " "]; map[e.path][1] = e.type === "del" ? "D" : "M"; });
      st.unmerged.forEach(function (p) { map[p] = ["U", "U"]; });
      sortedKeys(map).forEach(function (p) {
        var x = map[p];
        rich([[x[0] === "U" ? "r" : "g", x[0]], ["r", x[1]], ["", " " + (x.from ? x.from + " -> " : "") + p]]);
      });
      st.untracked.forEach(function (p) { rich([["r", "??"], ["", " " + p]]); });
    } else {
      printLongStatus(st);
    }
    VG.emit({ type: "status", clean: st.clean });
  };

  /* ---------------- git add · rm · mv ---------------- */
  GIT.add = function (args) {
    var o = parseArgs(args, { short: { A: "all", u: "update", f: "force", n: "dry", v: "verbose", p: "patch", i: "patch" },
      long: { all: "all", update: "update", force: "force", "dry-run": "dry", verbose: "verbose", patch: "patch", interactive: "patch" } });
    if (o.bad || o.missing) { optError(o, "add"); return; }
    if (o.patch) { sys("info", "ℹ (simulador) El modo interactivo (-p) no está disponible: prepara ficheros completos."); term.status.code = 1; return; }
    var specs = o._.concat(o.__ || []);
    if (!specs.length && !o.all && !o.update) {
      note("Nada especificado, nada agregado.");
      hint("Tal vez quisiste decir 'git add .'?\nDesactiva este mensaje ejecutando\n\"git config advice.addEmptyPathspec false\"");
      return;
    }
    if (!specs.length) { specs = ["."]; }
    var g = state.git, work = state.work, idx = g.index;
    var candidates = unionKeys(work, idx, g.unmerged);
    var ignoredNamed = [], targets = {};
    for (var s = 0; s < specs.length; s++) {
      var spec = specs[s];
      var matched = VG.matchPathspec(spec, candidates);
      if (!matched.length) {
        if (VG.normPath(spec) === ".git" || VG.normPath(spec).indexOf(".git/") === 0) { continue; }
        fail("fatal: pathspec '" + spec + "' no concordó con ningún archivo");
        term.status.code = 128;
        return;
      }
      /* jshint loopfunc:true */
      matched.forEach(function (p) {
        var tracked = has(idx, p) || has(g.unmerged, p);
        if (!tracked && VG.isIgnored(p) && !o.force) {
          if (VG.normPath(spec) === p) { ignoredNamed.push(p); }
          return;
        }
        if (o.update && !tracked) { return; }
        targets[p] = true;
      });
    }
    var paths = Object.keys(targets).sort();
    paths.forEach(function (p) {
      if (o.dry || o.verbose) { pre((has(work, p) ? "add '" : "remove '") + p + "'"); }
      if (o.dry) { return; }
      if (has(work, p)) { idx[p] = work[p]; } else { delete idx[p]; }
      if (has(g.unmerged, p)) {
        delete g.unmerged[p];
        if (has(work, p) && VG.hasMarkers(work[p])) {
          sys("warn", "⚠ " + p + " todavía contiene marcas de conflicto (<<<<<<<, =======, >>>>>>>). Git no lo comprueba: edítalo antes de hacer commit.");
        }
      }
    });
    if (ignoredNamed.length) {
      fail("Las siguientes rutas son ignoradas por uno de tus archivos .gitignore:\n" + ignoredNamed.join("\n"));
      hint("Usa -f si realmente quieres agregarlos.\nDesactiva este mensaje ejecutando\n\"git config advice.addIgnoredFile false\"");
    }
    if (!o.dry) {
      if (targets["secretos.env"]) {
        sys("warn", "⚠ Acabas de preparar secretos.env, que contiene contraseñas. Si haces commit, quedarán en el historial para siempre. " +
          "Sácalo con git restore --staged secretos.env.");
      }
      VG.emit({ type: "add", paths: paths });
    }
  };

  GIT.rm = function (args) {
    var o = parseArgs(args, { short: { r: "recursive", f: "force", q: "quiet", n: "dry" },
      long: { cached: "cached", force: "force", quiet: "quiet", "dry-run": "dry", recursive: "recursive" } });
    if (o.bad || o.missing) { optError(o, "rm"); return; }
    var specs = o._.concat(o.__ || []);
    if (!specs.length) { fail("fatal: No se especificó una ruta. ¿Qué archivos deberían ser borrados?"); term.status.code = 128; return; }
    var g = state.git, idx = g.index, work = state.work, head = VG.headTree() || {};
    var targets = [];
    for (var s = 0; s < specs.length; s++) {
      var matched = VG.matchPathspec(specs[s], unionKeys(idx, g.unmerged));
      if (!matched.length) { fail("fatal: pathspec '" + specs[s] + "' no concordó con ningún archivo"); term.status.code = 128; return; }
      Array.prototype.push.apply(targets, matched);
    }
    if (!o.force) {
      var staged = [], local = [];
      targets.forEach(function (p) {
        var stagedCh = idx[p] !== head[p];
        var localCh = has(work, p) && work[p] !== idx[p];
        if (o.cached) { if (stagedCh && localCh) { staged.push(p); } }
        else if (stagedCh && localCh) { staged.push(p); }
        else if (localCh) { local.push(p); }
        else if (stagedCh && has(head, p)) { staged.push(p); }
      });
      if (staged.length) {
        fail("error: el siguiente archivo tiene cambios preparados en el índice:\n" + staged.map(function (p) { return "    " + p; }).join("\n") +
          "\n(usa --cached para conservar el archivo, o -f para forzar su eliminación)");
        return;
      }
      if (local.length) {
        fail("error: el siguiente archivo tiene modificaciones locales:\n" + local.map(function (p) { return "    " + p; }).join("\n") +
          "\n(usa --cached para conservar el archivo, o -f para forzar su eliminación)");
        return;
      }
    }
    targets.forEach(function (p) {
      if (!o.quiet) { pre("rm '" + p + "'"); }
      if (o.dry) { return; }
      delete idx[p];
      delete g.unmerged[p];
      if (!o.cached) { delete work[p]; }
    });
    if (!o.dry) { VG.emit({ type: "rm", paths: targets, cached: !!o.cached }); }
  };

  GIT.mv = function (args) {
    var o = parseArgs(args, { short: { f: "force", n: "dry", v: "verbose" }, long: { force: "force", "dry-run": "dry", verbose: "verbose" } });
    if (o.bad || o.missing) { optError(o, "mv"); return; }
    var pos = o._.concat(o.__ || []);
    if (pos.length !== 2) { note("uso: git mv [<opciones>] <fuente>... <destino>"); term.status.code = 129; return; }
    var src = VG.normPath(pos[0]), dst = VG.normPath(pos[1]), g = state.git;
    if (!has(state.work, src) && !has(g.index, src)) { fail("fatal: mala fuente, fuente=" + src + ", destino=" + dst); term.status.code = 128; return; }
    if (!has(g.index, src)) { fail("fatal: no está bajo control de versiones, fuente=" + src + ", destino=" + dst); term.status.code = 128; return; }
    if (has(state.work, dst) && !o.force) { fail("fatal: destino existe, fuente=" + src + ", destino=" + dst); term.status.code = 128; return; }
    if (o.dry) { pre("Renombrando " + src + " a " + dst); return; }
    g.index[dst] = g.index[src];
    delete g.index[src];
    state.work[dst] = state.work[src];
    delete state.work[src];
    VG.emit({ type: "mv", from: src, to: dst });
  };

  /* ---------------- git commit ---------------- */
  var cleanMsg = VG.cleanMsg = function (text) {
    var lines = String(text).split("\n").filter(function (l) { return l.charAt(0) !== "#"; })
      .map(function (l) { return l.replace(/\s+$/, ""); });
    var outL = [];
    lines.forEach(function (l) { if (l === "" && (outL.length === 0 || outL[outL.length - 1] === "")) { return; } outL.push(l); });
    while (outL.length && outL[outL.length - 1] === "") { outL.pop(); }
    return outL.join("\n");
  };
  var commitTemplate = VG.commitTemplate = function (initial, extra) {
    var st = VG.computeStatus(), g = state.git;
    var t = (initial ? initial + "\n" : "\n") + (extra || "") +
      "# Por favor ingresa el mensaje del commit para tus cambios. Las\n" +
      "#  líneas que comiencen con '#' serán ignoradas, y un mensaje\n" +
      "#  vacío aborta el commit.\n#\n" +
      (g.HEAD.branch ? "# En la rama " + g.HEAD.branch + "\n" : "# HEAD desacoplada en " + VG.short(g.HEAD.detached) + "\n");
    if (st.staged.length) {
      t += "# Cambios a ser confirmados:\n" + st.staged.map(function (e) {
        return "#\t" + pad(ST_LABEL[e.type], 17) + (e.type === "ren" ? e.from + " -> " + e.path : e.path);
      }).join("\n") + "\n#\n";
    }
    if (st.untracked.length) {
      t += "# Archivos sin seguimiento:\n" + st.untracked.map(function (p) { return "#\t" + p; }).join("\n") + "\n#\n";
    }
    return t;
  };
  VG.identityError = function () {
    note("Autor desconocido\n\n*** Por favor cuéntame quién eres.\n\nCorre\n\n" +
      "  git config --global user.email \"you@example.com\"\n  git config --global user.name \"Tu Nombre\"\n\n" +
      "para configurar la identidad por defecto de tu cuenta.\nOmite --global para configurar tu identidad solo en este repositorio.\n");
    fail("fatal: incapaz de auto-detectar la dirección de correo (se obtuvo '" + cfg.USER + "@" + cfg.HOST + ".(none)')");
    term.status.code = 128;
  };
  VG.checkSecrets = function (tree) {
    if (has(tree, "secretos.env")) {
      VG.risky("secret", "secretos.env (contraseñas) ha entrado en un commit. Aunque lo borres después, seguirá en el historial.");
    }
    if (has(tree, "volcado.sql")) {
      VG.risky("personal", "volcado.sql (datos personales de clientes) ha entrado en un commit.");
    }
  };

  GIT.commit = function (args) {
    var o = parseArgs(args, {
      short: { a: "all", m: "=message", q: "quiet", v: "verbose", s: "signoff", n: "noverify", F: "=file", e: "edit" },
      long: { all: "all", message: "=message", amend: "amend", "no-edit": "noEdit", edit: "edit", "allow-empty": "allowEmpty",
        quiet: "quiet", verbose: "verbose", signoff: "signoff", "no-verify": "noverify", file: "=file" }
    });
    if (o.bad || o.missing) { optError(o, "commit"); return; }
    var g = state.git;
    if (o._.length || o.__ || o.file) {
      sys("info", "ℹ (simulador) Esta forma de git commit no está disponible: prepara los ficheros con git add y usa git commit -m \"mensaje\".");
      term.status.code = 1;
      return;
    }
    var who = VG.identity();
    if (!who.name || !who.email) { VG.identityError(); return; }
    if (o.all) {
      Object.keys(g.index).concat(Object.keys(g.unmerged)).forEach(function (p) {
        if (has(state.work, p)) { g.index[p] = state.work[p]; } else { delete g.index[p]; }
        delete g.unmerged[p];
      });
    }
    if (Object.keys(g.unmerged).length) {
      fail("error: No es posible hacer commit porque tienes archivos sin fusionar.");
      hint("Corrígelos en el árbol de trabajo y entonces usa 'git add/rm <archivo>'\ncomo sea apropiado para marcar la resolución y realizar un commit.");
      fail("fatal: Saliendo porque existe un conflicto no resuelto.");
      term.status.code = 128;
      return;
    }
    var parent = VG.headHash();
    if (o.amend && !parent) { fail("fatal: tienes una rama por nacer, no puedes aplicar un amend."); term.status.code = 128; return; }
    var inOp = g.op && (g.op.type === "merge" || g.op.type === "cherry-pick" || g.op.type === "revert");
    if (!o.amend && !o.allowEmpty && !inOp && VG.sameTree(g.index, VG.headTree() || {})) {
      printLongStatus(VG.computeStatus());
      term.status.code = 1;
      return;
    }
    function finish(msg) {
      var parents = o.amend ? state.commits[parent].parents.slice() : (parent ? [parent] : []);
      if (g.op && g.op.type === "merge") { parents.push(g.op.theirs); }
      var author = g.op && g.op.type === "cherry-pick" ? g.op.author : null;
      var h = VG.makeCommit(g.index, parents, msg, author);
      var kind = o.amend ? "commit (amend)" : (g.op && g.op.type === "merge") ? "commit (merge)" : !parent ? "commit (initial)" : "commit";
      VG.setHead(h, kind + ": " + firstLine(msg));
      var wasMerge = parents.length > 1;
      if (g.op && g.op.type !== "rebase") { g.op = null; }
      state.myCommits.push(h);
      if (!o.quiet) {
        pre("[" + (g.HEAD.branch || "HEAD desacoplada") + (parents.length ? "" : " (commit-raíz)") + " " + VG.short(h) + "] " + firstLine(msg));
        if (o.amend) { pre(" Date: " + VG.fmtGitDate(state.commits[parent].date)); }
        var changes = VG.treeChanges(VG.treeOf(parents[0]) || {}, state.commits[h].tree);
        pre(VG.summaryLine(changes));
        VG.printModeLines(changes);
      }
      VG.checkSecrets(state.commits[h].tree);
      VG.emit({ type: "commit", hash: h, amend: !!o.amend, merge: wasMerge, msg: msg });
    }
    if (o.message) { finish(o.message.join("\n\n")); return; }
    if (o.noEdit && o.amend) { finish(VG.commitMsg(parent)); return; }
    if (o.noEdit && g.op && g.op.msg) { finish(cleanMsg(g.op.msg)); return; }
    var initial = o.amend ? VG.commitMsg(parent) : (g.op && g.op.msg) || "";
    var extra = g.op && g.op.type === "merge"
      ? "# Parece que estás haciendo un commit de una fusión.\n# Si esto no es correcto, elimina el archivo\n#\t.git/MERGE_HEAD\n# e intenta de nuevo.\n\n"
      : "";
    VG.openEditor(cfg.REPO_DIR + "/.git/COMMIT_EDITMSG", commitTemplate(initial, extra), function (text) {
      var msg = cleanMsg(text);
      if (!msg) { fail("Abortando commit debido a que el mensaje de commit está vacío."); return; }
      finish(msg);
    });
  };
})(this);
