/* ==========================================================
   Trabajo en equipo: remote · fetch · push · pull · stash · tag
   El «servidor» es state.server: sus propias referencias sobre
   el mismo almacén de objetos.
   ========================================================== */
(function (global) {
  "use strict";
  var RG = global.RG, VG = global.VG, util = RG.util, cfg = VG.cfg;
  var state = VG.state, term = VG.term, GIT = VG.GIT;
  var has = util.has, copy = util.copy, sortedKeys = util.sortedKeys, unionKeys = util.unionKeys, pad = util.pad, firstLine = util.firstLine;
  var parseArgs = RG.parseArgs, last = RG.lastOf;
  var pre = term.pre, note = term.note, fail = term.fail, sys = term.sys, hint = term.hint;
  var optError = VG.optError;

  function hostOf(url) {
    var m = /^https?:\/\/([^\/]+)/.exec(url);
    if (m) { return m[1]; }
    m = /^(?:[^@]+@)?([^:\/]+)[:\/]/.exec(url);
    return m ? m[1] : url;
  }
  function urlOk(url) { return cfg.REMOTE_URLS.indexOf(url) !== -1; }
  function urlFail(url) {
    if (hostOf(url) === cfg.REMOTE_HOST) {
      fail("ERROR: El repositorio solicitado no existe en " + cfg.REMOTE_HOST + ".");
      fail("fatal: No se pudo leer del repositorio remoto.\n\nPor favor asegúrate de que tengas los permisos de acceso correctos\ny que el repositorio exista.");
    } else if (/^https?:/.test(url)) {
      fail("fatal: no es posible acceder a '" + url + "': Could not resolve host: " + hostOf(url));
    } else {
      fail("ssh: Could not resolve hostname " + hostOf(url) + ": Name or service not known");
      fail("fatal: No se pudo leer del repositorio remoto.\n\nPor favor asegúrate de que tengas los permisos de acceso correctos\ny que el repositorio exista.");
    }
    term.status.code = 128;
  }
  function shortUrl(url) { return url.replace(/^https?:\/\//, "").replace(/^[^@]+@/, "").replace(/\.git$/, ""); }
  function resolveRemote(name) {
    var g = state.git;
    if (has(g.remotes, name)) { return { name: name, url: g.remotes[name].url }; }
    if (/[:\/]/.test(name)) { return { name: name, url: name }; }
    fail("fatal: '" + name + "' no parece ser un repositorio git");
    fail("fatal: No se pudo leer del repositorio remoto.\n\nPor favor asegúrate de que tengas los permisos de acceso correctos\ny que el repositorio exista.");
    term.status.code = 128;
    return null;
  }
  function transferLines(n, remoteSide) {
    var objs = Math.max(1, n * 3);
    if (remoteSide) {
      note("remote: Enumerating objects: " + objs + ", done.");
      note("remote: Counting objects: 100% (" + objs + "/" + objs + "), done.");
      note("remote: Compressing objects: 100% (" + n + "/" + n + "), done.");
      note("remote: Total " + objs + " (delta " + Math.max(0, n - 1) + "), reused 0 (delta 0), pack-reused 0");
      note("Desempaquetando objetos: 100% (" + objs + "/" + objs + "), " + (objs * 97) + " bytes | " + (objs * 97) + ".00 KiB/s, listo.");
    } else {
      note("Enumerando objetos: " + objs + ", listo.");
      note("Contando objetos: 100% (" + objs + "/" + objs + "), listo.");
      note("Compresión delta usando hasta 8 hilos");
      note("Comprimiendo objetos: 100% (" + n + "/" + n + "), listo.");
      note("Escribiendo objetos: 100% (" + objs + "/" + objs + "), " + (objs * 103) + " bytes | " + (objs * 103) + ".00 KiB/s, listo.");
      note("Total " + objs + " (delta " + Math.max(0, n - 1) + "), reusados 0 (delta 0), pack-reusados 0");
    }
  }

  /* ---------------- git remote ---------------- */
  GIT.remote = function (args) {
    var o = parseArgs(args, { short: { v: "verbose" }, long: { verbose: "verbose" } });
    if (o.bad || o.missing) { optError(o, "remote"); return; }
    var g = state.git, sub = o._[0] || "list";
    if (sub === "list" || !o._.length) {
      sortedKeys(g.remotes).forEach(function (r) {
        if (o.verbose) {
          pre(r + "\t" + g.remotes[r].url + " (fetch)");
          pre(r + "\t" + g.remotes[r].url + " (push)");
        } else { pre(r); }
      });
      return;
    }
    var name = o._[1], url = o._[2];
    if (sub === "add") {
      if (!name || !url) { note("uso: git remote add [<opciones>] <nombre> <url>"); term.status.code = 129; return; }
      if (has(g.remotes, name)) { fail("error: remoto " + name + " ya existe."); term.status.code = 3; return; }
      g.remotes[name] = { url: url };
      g.remoteRefs[name] = g.remoteRefs[name] || {};
      VG.emit({ type: "remote-add", name: name, url: url });
      if (!urlOk(url)) {
        sys("info", "ℹ El remoto se ha guardado, pero esa dirección no responde. La del servidor de TecnoAtlántica es " +
          cfg.REMOTE_URLS[0] + " (puedes corregirla con git remote set-url origin <url>).");
      }
      return;
    }
    if (sub === "remove" || sub === "rm") {
      if (!has(g.remotes, name)) { fail("error: No existe el remoto '" + name + "'."); term.status.code = 2; return; }
      delete g.remotes[name];
      delete g.remoteRefs[name];
      Object.keys(g.upstream).forEach(function (b) { if (g.upstream[b].remote === name) { delete g.upstream[b]; } });
      return;
    }
    if (sub === "rename") {
      if (!has(g.remotes, name)) { fail("error: No existe el remoto '" + name + "'."); term.status.code = 2; return; }
      g.remotes[url] = g.remotes[name];
      g.remoteRefs[url] = g.remoteRefs[name] || {};
      delete g.remotes[name];
      delete g.remoteRefs[name];
      Object.keys(g.upstream).forEach(function (b) { if (g.upstream[b].remote === name) { g.upstream[b].remote = url; } });
      return;
    }
    if (sub === "set-url") {
      if (!has(g.remotes, name)) { fail("error: No existe el remoto '" + name + "'."); term.status.code = 2; return; }
      g.remotes[name].url = url;
      return;
    }
    if (sub === "get-url") {
      if (!has(g.remotes, name)) { fail("error: No existe el remoto '" + name + "'."); term.status.code = 2; return; }
      pre(g.remotes[name].url);
      return;
    }
    if (sub === "show") {
      var rn = name || "origin";
      if (!has(g.remotes, rn)) { fail("error: No existe el remoto '" + rn + "'."); term.status.code = 2; return; }
      if (!urlOk(g.remotes[rn].url)) { urlFail(g.remotes[rn].url); return; }
      pre("* remoto " + rn);
      pre("  URL para obtener: " + g.remotes[rn].url);
      pre("  URL para publicar: " + g.remotes[rn].url);
      pre("  Rama HEAD: " + (has(state.server.refs, "main") ? "main" : "(desconocido)"));
      if (sortedKeys(state.server.refs).length) {
        pre("  Ramas remotas:");
        sortedKeys(state.server.refs).forEach(function (b) { pre("    " + b + " rastreada"); });
      }
      sortedKeys(g.upstream).forEach(function (b) {
        if (g.upstream[b].remote === rn) {
          pre("  Rama local configurada para 'git pull':");
          pre("    " + b + " fusiona con remoto " + g.upstream[b].branch);
        }
      });
      return;
    }
    fail("error: Subcomando desconocido: " + sub);
    term.status.code = 129;
  };

  /* ---------------- git fetch ---------------- */
  GIT.fetch = function (args) {
    var o = parseArgs(args, { short: { p: "prune", v: "verbose", q: "quiet", a: "x" },
      long: { prune: "prune", all: "all", tags: "tags", verbose: "verbose", quiet: "quiet", "dry-run": "dry" } });
    if (o.bad || o.missing) { optError(o, "fetch"); return; }
    var g = state.git;
    if (!Object.keys(g.remotes).length) { fail("fatal: No se ha configurado un repositorio remoto."); term.status.code = 128; return; }
    var rname = o._[0] || (VG.headBranch() && g.upstream[VG.headBranch()] && g.upstream[VG.headBranch()].remote) || "origin";
    var rem = resolveRemote(rname);
    if (!rem) { return; }
    if (!urlOk(rem.url)) { urlFail(rem.url); return; }
    var tracking = g.remoteRefs[rem.name] = g.remoteRefs[rem.name] || {};
    var lines = [], newCommits = 0;
    sortedKeys(state.server.refs).forEach(function (b) {
      var to = state.server.refs[b], from = tracking[b];
      if (from === to) { return; }
      newCommits += VG.aheadBehind(to, from || null).ahead;
      if (!from) { lines.push(" * [nueva rama]      " + pad(b, 11) + "-> " + rem.name + "/" + b); }
      else if (VG.isAncestor(from, to)) { lines.push("   " + VG.short(from) + ".." + VG.short(to) + "  " + pad(b, 11) + "-> " + rem.name + "/" + b); }
      else { lines.push(" + " + VG.short(from) + "..." + VG.short(to) + " " + pad(b, 11) + "-> " + rem.name + "/" + b + "  (actualización forzada)"); }
      if (!o.dry) { tracking[b] = to; }
    });
    sortedKeys(state.server.tags).forEach(function (t) {
      if (has(g.tags, t)) { return; }
      lines.push(" * [nueva etiqueta]  " + pad(t, 11) + "-> " + t);
      if (!o.dry) { g.tags[t] = copy(state.server.tags[t]); }
    });
    if (o.prune) {
      sortedKeys(tracking).forEach(function (b) {
        if (!has(state.server.refs, b)) {
          lines.push(" - [eliminado]       " + pad("(nada)", 11) + "-> " + rem.name + "/" + b);
          if (!o.dry) { delete tracking[b]; }
        }
      });
    }
    if (lines.length) {
      transferLines(Math.max(1, newCommits), true);
      note("Desde " + shortUrl(rem.url));
      lines.forEach(function (l) { note(l); });
    }
    var up = VG.headBranch() && g.upstream[VG.headBranch()];
    if (up) { g.fetchHead = VG.remoteRef(up.remote, up.branch); }
    VG.emit({ type: "fetch", updates: lines.length });
  };

  /* ---------------- git push ---------------- */
  GIT.push = function (args) {
    var o = parseArgs(args, { short: { u: "setUpstream", f: "force", d: "delete", n: "dry", q: "quiet", v: "verbose" },
      long: { "set-upstream": "setUpstream", force: "force", "force-with-lease": "lease", tags: "tags", all: "allBranches",
        "delete": "delete", "dry-run": "dry", quiet: "quiet", verbose: "verbose", atomic: "x", "no-verify": "x", "follow-tags": "x" } });
    if (o.bad || o.missing) { optError(o, "push"); return; }
    var g = state.git, server = state.server;
    var rname = o._[0], specs = o._.slice(1), br = VG.headBranch();
    if (!rname) {
      if (!Object.keys(g.remotes).length) {
        fail("fatal: No hay destino configurado para push.\nEspecifica la URL desde la línea de comandos o configura un repositorio remoto usando\n\n" +
          "    git remote add <nombre> <url>\n\ny luego haz push usando el nombre del remoto\n\n    git push <nombre>\n");
        term.status.code = 128;
        return;
      }
      if (!br) { fail("fatal: Estás actualmente en una HEAD desacoplada."); term.status.code = 128; return; }
      var up = g.upstream[br];
      if (!up) {
        fail("fatal: La rama actual " + br + " no tiene una rama upstream.\n" +
          "Para realizar un push de la rama actual y configurar el remoto como upstream, usa\n\n" +
          "    git push --set-upstream origin " + br + "\n\n" +
          "Para que esto ocurra automáticamente para ramas sin rastreo de upstream,\nmira 'push.autoSetupRemote' en 'git help config'.\n");
        term.status.code = 128;
        return;
      }
      rname = up.remote;
      specs = [br + ":" + up.branch];
    }
    var rem = resolveRemote(rname);
    if (!rem) { return; }
    if (!urlOk(rem.url)) { urlFail(rem.url); return; }
    var updates = [];
    if (o["delete"]) { specs.forEach(function (s) { updates.push({ kind: "delete", name: s }); }); specs = []; }
    if (o.tags) { sortedKeys(g.tags).forEach(function (t) { updates.push({ kind: "tag", name: t }); }); }
    if (o.allBranches) { sortedKeys(g.branches).forEach(function (b) { updates.push({ kind: "branch", local: b, name: b, to: g.branches[b] }); }); }
    for (var i = 0; i < specs.length; i++) {
      var spec = specs[i];
      if (spec.charAt(0) === ":") { updates.push({ kind: "delete", name: spec.slice(1) }); continue; }
      var parts = spec.split(":");
      var src = parts[0], dst = (parts[1] || parts[0]).replace(/^refs\/(heads|tags)\//, "");
      if (has(g.tags, src)) { updates.push({ kind: "tag", name: src }); continue; }
      var h = VG.resolveRev(src);
      if (!h) {
        fail("error: la referencia de origen '" + src + "' no coincide con ninguna");
        fail("error: falló el push de algunas referencias a '" + rem.url + "'");
        term.status.code = 1;
        return;
      }
      updates.push({ kind: "branch", local: has(g.branches, src) ? src : (br || src), name: src === "HEAD" ? (br || dst) : dst, to: h });
    }
    if (!updates.length) {
      if (!br) { fail("fatal: Estás actualmente en una HEAD desacoplada."); term.status.code = 128; return; }
      var upd = g.upstream[br];
      updates.push({ kind: "branch", local: br, name: (upd && upd.branch) || br, to: VG.branchTip(br) });
    }
    var results = [], errors = [], rejected = false, changed = 0, newCommits = 0;
    updates.forEach(function (u) {
      if (u.kind === "delete") {
        if (!has(server.refs, u.name)) { errors.push(" ! [remoto rechazado] " + u.name + " (la referencia remota no existe)"); rejected = true; return; }
        if (!o.dry) { delete server.refs[u.name]; delete g.remoteRefs[rem.name][u.name]; }
        results.push(" - [eliminado]         " + u.name);
        changed++;
        return;
      }
      if (u.kind === "tag") {
        if (has(server.tags, u.name)) { return; }
        if (!o.dry) { server.tags[u.name] = copy(g.tags[u.name]); }
        results.push(" * [nueva etiqueta]    " + u.name + " -> " + u.name);
        changed++;
        return;
      }
      var R = server.refs[u.name];
      if (R === u.to) { return; }
      if (!R) {
        if (!o.dry) { server.refs[u.name] = u.to; }
        newCommits += Object.keys(VG.ancestors(u.to)).length;
        results.push(" * [nueva rama]        " + u.local + " -> " + u.name);
        changed++;
      } else if (VG.isAncestor(R, u.to)) {
        if (!o.dry) { server.refs[u.name] = u.to; }
        newCommits += VG.aheadBehind(u.to, R).ahead;
        results.push("   " + VG.short(R) + ".." + VG.short(u.to) + "  " + u.local + " -> " + u.name);
        changed++;
      } else if (o.force || o.lease) {
        if (o.lease && VG.remoteRef(rem.name, u.name) !== R) {
          errors.push(" ! [rechazado]        " + u.local + " -> " + u.name + " (stale info)");
          rejected = true;
          return;
        }
        if (!o.dry) { server.refs[u.name] = u.to; }
        results.push(" + " + VG.short(R) + "..." + VG.short(u.to) + " " + u.local + " -> " + u.name + " (actualización forzada)");
        changed++;
        VG.risky("force", "Un push forzado sobrescribió la rama " + u.name + " del servidor: los commits que allí había y tú no tenías se han perdido para el equipo.");
      } else {
        errors.push(" ! [rechazado]        " + u.local + " -> " + u.name +
          (VG.remoteRef(rem.name, u.name) === R ? " (non-fast-forward)" : " (fetch first)"));
        rejected = true;
      }
      if (!o.dry && !rejected && u.kind === "branch" && has(server.refs, u.name)) {
        g.remoteRefs[rem.name] = g.remoteRefs[rem.name] || {};
        g.remoteRefs[rem.name][u.name] = server.refs[u.name];
      }
    });
    if (o.setUpstream && !o.dry) {
      updates.filter(function (u) { return u.kind === "branch"; }).forEach(function (u) {
        if (has(g.branches, u.local)) {
          g.upstream[u.local] = { remote: rem.name, branch: u.name };
          pre("rama '" + u.local + "' configurada para rastrear '" + rem.name + "/" + u.name + "'.");
        }
      });
    }
    if (!changed && !errors.length) { note("Todo actualizado"); VG.emit({ type: "push", nothing: true }); return; }
    if (changed) { transferLines(Math.max(1, Math.min(newCommits, 20)), false); }
    note("To " + rem.url);
    results.forEach(function (l) { note(l); });
    errors.forEach(function (l) { term.pushRows(term.rowsFromText("err", l, true), true); });
    if (rejected) {
      fail("error: falló el push de algunas referencias a '" + rem.url + "'");
      if (errors.join(" ").indexOf("fetch first") !== -1) {
        hint("Las actualizaciones fueron rechazadas porque el remoto contiene trabajo que\n" +
          "no tienes localmente. Esto es causado usualmente por otro repositorio haciendo\n" +
          "push a la misma referencia. Quizás quieras integrar primero los cambios remotos\n" +
          "(ej. 'git pull ...') antes de volver a hacer push.\n" +
          "Mira la 'Nota sobre fast-forwards' en 'git push --help' para más detalles.");
      } else {
        hint("Las actualizaciones fueron rechazadas porque la punta de tu rama actual está\n" +
          "detrás de su contraparte remota. Integra los cambios remotos (ej.\n'git pull ...') antes de volver a hacer push.\n" +
          "Mira la 'Nota sobre fast-forwards' en 'git push --help' para más detalles.");
      }
      term.status.code = 1;
    }
    VG.emit({ type: "push", rejected: rejected, changed: changed });
  };

  /* ---------------- git pull ---------------- */
  GIT.pull = function (args) {
    var o = parseArgs(args, { short: { m: "=message", q: "quiet", v: "verbose", r: "rebase" },
      long: { rebase: "rebase", "no-rebase": "noRebase", "ff-only": "ffOnly", ff: "ff", "no-ff": "noFf", "no-edit": "noEdit",
        edit: "edit", message: "=message", quiet: "quiet", verbose: "verbose", all: "x", prune: "prune", tags: "x",
        "allow-unrelated-histories": "unrelated" } });
    if (o.bad || o.missing) { optError(o, "pull"); return; }
    var g = state.git, br = VG.headBranch();
    var rname = o._[0], bname = o._[1];
    if (!rname) {
      var up = br && g.upstream[br];
      if (!up) {
        note("No hay información de rastreo para la rama actual.\nPor favor especifica a qué rama quieres fusionar.\n" +
          "Mira git-pull(1) para detalles.\n\n    git pull <remoto> <rama>\n\n" +
          "Si deseas configurar el rastreo de información para esta rama, puedes hacerlo con:\n\n" +
          "    git branch --set-upstream-to=origin/<rama> " + (br || "<rama>") + "\n");
        term.status.code = 1;
        return;
      }
      rname = up.remote;
      bname = up.branch;
    }
    if (!bname) { bname = (g.upstream[br] && g.upstream[br].branch) || br; }
    GIT.fetch([rname].concat(o.prune ? ["-p"] : []));
    if (term.status.code !== 0) { return; }
    var target = VG.remoteRef(rname, bname);
    if (!target) { fail("fatal: no se pudo encontrar la referencia remota " + bname); term.status.code = 1; return; }
    g.fetchHead = target;
    var head = VG.headHash();
    if (!head) {
      VG.applyTree({}, VG.treeOf(target));
      VG.setHead(target, "pull: Fast-forward");
      VG.emit({ type: "pull", ff: true });
      return;
    }
    var ab = VG.aheadBehind(head, target);
    if (!ab.behind) { pre("Ya está actualizado."); VG.emit({ type: "pull", upToDate: true }); return; }
    var cfgRebase = VG.cfgGet("pull.rebase");
    var rebase = o.rebase || (!o.noRebase && cfgRebase === "true");
    var ffOnly = o.ffOnly || VG.cfgGet("pull.ff") === "only";
    if (ab.ahead && ab.behind && !rebase && !o.noRebase && !ffOnly && cfgRebase === null && VG.cfgGet("pull.ff") === null && !o.noFf) {
      hint("Tienes ramas divergentes y necesitas especificar cómo reconciliarlas.\n" +
        "Puedes hacerlo ejecutando uno de los siguientes comandos antes de\nhacer el siguiente pull:\n\n" +
        "  git config pull.rebase false  # fusionar\n  git config pull.rebase true   # rebasar\n  git config pull.ff only       # solo avance rápido\n\n" +
        "Puedes reemplazar \"git config\" con \"git config --global\" para aplicar\nla preferencia en todos los repositorios. Puedes también pasar --rebase,\n" +
        "--no-rebase, o --ff-only en la línea de comando para sobrescribir el valor\npor defecto configurado en cada invocación.\n");
      fail("fatal: Necesita especificar cómo reconciliar las ramas divergentes.");
      term.status.code = 128;
      return;
    }
    if (rebase) {
      VG.startRebase(target, rname + "/" + bname);
      VG.emit({ type: "pull", rebase: true });
      return;
    }
    VG.doMerge(target, rname + "/" + bname, o, "pull",
      "Merge branch '" + bname + "' of " + shortUrl(g.remotes[rname] ? g.remotes[rname].url : rname));
    VG.emit({ type: "pull" });
  };

  /* ---------------- git stash ---------------- */
  GIT.stash = function (args) {
    var g = state.git;
    var sub = args.length && args[0].charAt(0) !== "-" ? args[0] : "push";
    var rest = args.length && args[0].charAt(0) !== "-" ? args.slice(1) : args;
    var o = parseArgs(rest, { short: { u: "untracked", m: "=message", q: "quiet", p: "patch", S: "x", k: "keepIndex" },
      long: { "include-untracked": "untracked", message: "=message", quiet: "quiet", patch: "patch", "keep-index": "keepIndex", index: "index" } });
    if (o.bad || o.missing) { optError(o, "stash"); return; }
    function stashRef(spec) {
      var m = /^stash@\{(\d+)\}$/.exec(spec || "stash@{0}");
      return m ? parseInt(m[1], 10) : (spec ? -1 : 0);
    }
    if (sub === "list") {
      g.stash.forEach(function (e, i) { pre("stash@{" + i + "}: " + e.msg); });
      return;
    }
    if (sub === "show") {
      var si = stashRef(o._[0]);
      if (!g.stash[si]) { fail("fatal: entrada de stash inválida"); term.status.code = 128; return; }
      var e = g.stash[si], baseT = VG.treeOf(e.base) || {}, after = copy(baseT);
      Object.keys(e.work).forEach(function (p) { if (e.work[p] === null) { delete after[p]; } else { after[p] = e.work[p]; } });
      if (o.patch) { VG.printTreeDiff(baseT, after); } else { VG.printStat(VG.treeChanges(baseT, after)); }
      return;
    }
    if (sub === "drop" || sub === "clear") {
      if (sub === "clear") { g.stash = []; return; }
      var di = stashRef(o._[0]);
      if (!g.stash[di]) { fail("fatal: entrada de stash inválida"); term.status.code = 128; return; }
      pre("Descartado " + (o._[0] || "refs/stash@{0}") + " (" + g.stash[di].hash + ")");
      g.stash.splice(di, 1);
      return;
    }
    if (sub === "pop" || sub === "apply") {
      if (!g.stash.length) { fail("fatal: No hay entradas en el stash."); term.status.code = 1; return; }
      var pi = stashRef(o._[0]);
      if (pi < 0 || !g.stash[pi]) { fail("fatal: entrada de stash inválida: " + o._[0]); term.status.code = 128; return; }
      var entry = g.stash[pi], baseTree = VG.treeOf(entry.base) || {}, conflicts = false;
      Object.keys(entry.work).forEach(function (p) {
        var stashed = entry.work[p], cur = has(state.work, p) ? state.work[p] : undefined, b = baseTree[p];
        if (stashed === null) { stashed = undefined; }
        if (cur === stashed) { return; }
        if (cur === b) {
          if (stashed === undefined) { delete state.work[p]; delete g.index[p]; } else { state.work[p] = stashed; }
          return;
        }
        if (stashed === undefined || cur === undefined) {
          conflicts = true;
          g.unmerged[p] = { base: b, ours: cur, theirs: stashed };
          pre("CONFLICTO (modificar/borrar): " + p + " en conflicto al aplicar el stash");
          return;
        }
        pre("Auto-fusionando " + p);
        var r = VG.merge3(b === undefined ? "" : b, cur, stashed, "Actualizado upstream", "Cambios guardados");
        state.work[p] = r.text;
        if (r.conflict) {
          conflicts = true;
          g.unmerged[p] = { base: b, ours: cur, theirs: stashed };
          pre("CONFLICTO (contenido): Conflicto de fusión en " + p);
        }
      });
      if (conflicts) {
        fail("La aplicación del stash ha fallado por conflictos.");
        note("La entrada del stash se conserva por si la necesitas de nuevo.");
        term.status.code = 1;
        VG.emit({ type: "stash-pop", ok: false });
        return;
      }
      VG.printLongStatus(VG.computeStatus());
      if (sub === "pop") {
        pre("Descartado " + (o._[0] || "refs/stash@{0}") + " (" + entry.hash + ")");
        g.stash.splice(pi, 1);
      }
      VG.emit({ type: "stash-pop", ok: true, applied: sub });
      return;
    }
    if (sub !== "push" && sub !== "save") { fail("error: subcomando desconocido: " + sub); term.status.code = 129; return; }
    if (o.patch) { sys("info", "ℹ (simulador) git stash -p no está disponible."); term.status.code = 1; return; }
    var st = VG.computeStatus();
    if (!st.staged.length && !st.unstaged.length && !(o.untracked && st.untracked.length)) {
      pre("No hay cambios locales para guardar");
      return;
    }
    if (!VG.headHash()) { fail("Todavía no tienes el commit inicial"); term.status.code = 1; return; }
    var head = VG.headHash(), headT = VG.headTree();
    var entry2 = { index: copy(g.index), work: {}, base: head, hash: VG.sha("stash" + state.seq + head), untracked: [] };
    unionKeys(headT, g.index).forEach(function (p) {
      var w = has(state.work, p) ? state.work[p] : null;
      if (w !== headT[p]) { entry2.work[p] = w; }
    });
    if (o.untracked) {
      st.untracked.forEach(function (p) { entry2.work[p] = state.work[p]; entry2.untracked.push(p); });
    }
    entry2.msg = o.message ? "On " + (VG.headBranch() || "HEAD") + ": " + last(o.message)
      : "WIP on " + (VG.headBranch() || "HEAD") + ": " + VG.short(head) + " " + firstLine(VG.commitMsg(head));
    state.seq++;
    g.stash.unshift(entry2);
    g.index = copy(headT);
    unionKeys(headT, entry2.work).forEach(function (p) {
      if (has(headT, p)) { state.work[p] = headT[p]; }
      else if (entry2.untracked.indexOf(p) !== -1 || has(entry2.work, p)) { delete state.work[p]; }
    });
    pre("Directorio de trabajo guardado y estado de índice " + entry2.msg);
    VG.emit({ type: "stash-push" });
  };

  /* ---------------- git tag ---------------- */
  GIT.tag = function (args) {
    var o = parseArgs(args, { short: { a: "annotate", m: "=message", d: "delete", l: "list", f: "force", n: "n" },
      long: { annotate: "annotate", message: "=message", "delete": "delete", list: "list", force: "force" } });
    if (o.bad || o.missing) { optError(o, "tag"); return; }
    var g = state.git;
    if (o["delete"]) {
      o._.forEach(function (n) {
        if (!has(g.tags, n)) { fail("error: etiqueta '" + n + "' no encontrada."); term.status.code = 1; return; }
        pre("Etiqueta '" + n + "' eliminada (era " + VG.short(g.tags[n].target) + ")");
        delete g.tags[n];
      });
      return;
    }
    if (!o._.length || o.list) {
      sortedKeys(g.tags).forEach(function (t) {
        if (o.n) { pre(pad(t, 16) + firstLine(g.tags[t].annotated ? g.tags[t].message : VG.commitMsg(g.tags[t].target))); }
        else { pre(t); }
      });
      return;
    }
    var name = o._[0];
    if (!VG.validRef(name)) { fail("fatal: '" + name + "' no es un nombre de etiqueta válido"); term.status.code = 128; return; }
    var target = o._[1] ? VG.resolveRev(o._[1]) : VG.headHash();
    if (!target) { fail("fatal: Falló al resolver '" + (o._[1] || "HEAD") + "' como una referencia válida."); term.status.code = 128; return; }
    if (has(g.tags, name) && !o.force) { fail("fatal: la etiqueta '" + name + "' ya existe"); term.status.code = 128; return; }
    var annotated = !!(o.annotate || o.message), who = VG.identity();
    if (annotated && (!who.name || !who.email)) { VG.identityError(); return; }
    function create(message) {
      g.tags[name] = { target: target, annotated: annotated, message: message, tagger: who, date: VG.fakeNow().getTime() };
      VG.emit({ type: "tag", name: name, annotated: annotated });
    }
    if (!annotated || o.message) { create(o.message ? o.message.join("\n\n") : ""); return; }
    VG.openEditor(cfg.REPO_DIR + "/.git/TAG_EDITMSG",
      "\n# Escribe un mensaje para la etiqueta:\n#   " + name + "\n# Las líneas que comienzan con '#' serán ignoradas.\n",
      function (text) {
        var m = VG.cleanMsg(text);
        if (!m) { fail("\nNo se ha proporcionado un mensaje para la etiqueta, abortando."); return; }
        create(m);
      });
  };
})(this);
