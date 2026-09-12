/* ==========================================================
   Deshacer y ramas:
   restore · reset · branch · switch · checkout · merge ·
   cherry-pick · revert · rebase
   ========================================================== */
(function (global) {
  "use strict";
  var RG = global.RG, VG = global.VG, util = RG.util, cfg = VG.cfg;
  var state = VG.state, term = VG.term, GIT = VG.GIT;
  var has = util.has, copy = util.copy, sortedKeys = util.sortedKeys, unionKeys = util.unionKeys, pad = util.pad, firstLine = util.firstLine;
  var parseArgs = RG.parseArgs, last = RG.lastOf;
  var pre = term.pre, rich = term.rich, note = term.note, fail = term.fail, sys = term.sys, hint = term.hint;
  var optError = VG.optError;

  /* ---------------- git restore ---------------- */
  GIT.restore = function (args) {
    var o = parseArgs(args, { short: { S: "staged", W: "worktree", s: "=source", q: "quiet", p: "patch" },
      long: { staged: "staged", worktree: "worktree", source: "=source", ours: "ours", theirs: "theirs", quiet: "quiet", patch: "patch" } });
    if (o.bad || o.missing) { optError(o, "restore"); return; }
    var specs = o._.concat(o.__ || []);
    if (!specs.length) { fail("fatal: debes especificar la(s) ruta(s) a restaurar"); term.status.code = 128; return; }
    var g = state.git, idx = g.index, work = state.work;
    var staged = !!o.staged, worktree = !!o.worktree || !staged;
    var src = null;
    if (o.source) {
      var sh = VG.resolveRev(last(o.source));
      if (!sh) { fail("fatal: no se pudo resolver '" + last(o.source) + "'"); term.status.code = 128; return; }
      src = VG.treeOf(sh);
    }
    var head = VG.headTree() || {}, targets = [];
    for (var s = 0; s < specs.length; s++) {
      var cands = staged ? unionKeys(idx, head, src || {}, g.unmerged) : unionKeys(idx, g.unmerged, src || {});
      var matched = VG.matchPathspec(specs[s], cands);
      if (!matched.length) { fail("error: pathspec '" + specs[s] + "' no concordó con ningún archivo conocido por git"); return; }
      Array.prototype.push.apply(targets, matched);
    }
    var paths = [];
    targets.forEach(function (p) {
      if (o.ours || o.theirs) {
        var u = g.unmerged[p];
        if (!u) { fail("error: la ruta '" + p + "' no tiene " + (o.ours ? "nuestra" : "su") + " versión"); return; }
        var v = o.ours ? u.ours : u.theirs;
        if (v === undefined) { delete work[p]; } else { work[p] = v; }
        paths.push(p);
        return;
      }
      if (has(g.unmerged, p) && !staged && !src) { fail("error: la ruta '" + p + "' no está fusionada"); return; }
      if (staged) {
        var from = src || head;
        if (has(from, p)) { idx[p] = from[p]; } else { delete idx[p]; }
        delete g.unmerged[p];
      }
      if (worktree) {
        var from2 = src || (staged ? head : idx);
        if (has(from2, p)) { work[p] = from2[p]; }
        else if (has(head, p) || has(idx, p) || staged || src) { delete work[p]; }
      }
      paths.push(p);
    });
    VG.emit({ type: "restore", staged: staged, worktree: worktree, paths: paths });
  };

  /* ---------------- git reset ---------------- */
  GIT.reset = function (args) {
    var o = parseArgs(args, { short: { q: "quiet", p: "patch" },
      long: { soft: "soft", mixed: "mixed", hard: "hard", merge: "merge", keep: "keep", quiet: "quiet", patch: "patch" } });
    if (o.bad || o.missing) { optError(o, "reset"); return; }
    var g = state.git, work = state.work;
    var pos = o._.slice(), rev = null;
    if (pos.length && (VG.resolveRev(pos[0]) || /^(HEAD|@)$/.test(pos[0]))) { rev = pos.shift(); }
    var paths = pos.concat(o.__ || []).map(VG.normPath);
    if (paths.length) {
      if (o.soft || o.hard) { fail("fatal: No se puede hacer un reset --" + (o.soft ? "soft" : "hard") + " con rutas."); term.status.code = 128; return; }
      var src = rev && VG.resolveRev(rev) ? VG.treeOf(VG.resolveRev(rev)) : (VG.headTree() || {});
      for (var i = 0; i < paths.length; i++) {
        if (!has(g.index, paths[i]) && !has(src, paths[i]) && !has(g.unmerged, paths[i]) && !has(work, paths[i])) {
          VG.badRev(paths[i]);
          term.status.code = 128;
          return;
        }
      }
      paths.forEach(function (p) {
        if (has(src, p)) { g.index[p] = src[p]; } else { delete g.index[p]; }
        delete g.unmerged[p];
      });
      var st0 = VG.computeStatus();
      if (st0.unstaged.length && !o.quiet) {
        pre("Cambios fuera del área de stage tras el reset:");
        st0.unstaged.forEach(function (e) { pre((e.type === "del" ? "D" : "M") + "\t" + e.path); });
      }
      VG.emit({ type: "reset", paths: paths });
      return;
    }
    if (!VG.headHash() && !rev) { g.index = {}; g.unmerged = {}; VG.emit({ type: "reset", mode: "mixed" }); return; }
    var target = VG.resolveRev(rev || "HEAD");
    if (!target) { VG.badRev(rev); term.status.code = 128; return; }
    var mode = o.soft ? "soft" : (o.hard || o.merge || o.keep) ? "hard" : "mixed";
    if (mode === "soft" && g.op && g.op.type === "merge") { fail("fatal: No se puede hacer un reset --soft en medio de una fusión."); term.status.code = 128; return; }
    var oldHead = VG.headHash(), oldTree = VG.headTree() || {}, oldIndex = copy(g.index), oldUnmerged = copy(g.unmerged);
    var newTree = VG.treeOf(target), lost = [];
    if (mode === "hard") {
      var dirty = VG.dirtyPaths();
      Object.keys(dirty).forEach(function (p) {
        if ((work[p] !== newTree[p] && work[p] !== oldTree[p]) || (g.index[p] !== oldTree[p] && g.index[p] !== newTree[p])) { lost.push(p); }
      });
      Object.keys(g.unmerged).forEach(function (p) { if (lost.indexOf(p) === -1) { lost.push(p); } });
    }
    g.origHead = oldHead;
    VG.setHead(target, "reset: moving to " + (rev || "HEAD"));
    if (mode !== "soft") { g.index = copy(newTree); g.unmerged = {}; }
    if (g.op && g.op.type !== "rebase" && mode !== "soft") { g.op = null; }
    if (mode === "hard") {
      unionKeys(oldIndex, oldTree, newTree, oldUnmerged).forEach(function (p) {
        if (has(newTree, p)) { work[p] = newTree[p]; } else { delete work[p]; }
      });
      if (!o.quiet) { pre("HEAD está ahora en " + VG.short(target) + " " + firstLine(VG.commitMsg(target))); }
      if (lost.length) {
        VG.risky("hard", "git reset --hard descartó cambios sin confirmar (" + lost.join(", ") + "). Esos cambios no se pueden recuperar.");
      }
    } else if (mode === "mixed" && !o.quiet) {
      var st = VG.computeStatus();
      if (st.unstaged.length) {
        pre("Cambios fuera del área de stage tras el reset:");
        st.unstaged.forEach(function (e) { pre((e.type === "del" ? "D" : "M") + "\t" + e.path); });
      }
    }
    VG.emit({ type: "reset", mode: mode, from: oldHead, to: target });
  };

  /* ---------------- git branch ---------------- */
  function trackShort(branch, withName) {
    var g = state.git, up = g.upstream[branch];
    if (!up) { return null; }
    var r = VG.remoteRef(up.remote, up.branch), name = up.remote + "/" + up.branch;
    if (!r) { return withName ? [["bl", name], ["", ": desaparecido"]] : [["", "desaparecido"]]; }
    var ab = VG.aheadBehind(VG.branchTip(branch), r), parts = [];
    if (ab.ahead) { parts.push("adelante " + ab.ahead); }
    if (ab.behind) { parts.push("detrás " + ab.behind); }
    if (!withName) { return parts.length ? [["", parts.join(", ")]] : null; }
    return [["bl", name]].concat(parts.length ? [["", ": " + parts.join(", ")]] : []);
  }

  GIT.branch = function (args) {
    var o = parseArgs(args, {
      short: { a: "all", r: "remotes", v: "verbose", d: "delete", D: "forceDelete", m: "move", M: "forceMove", u: "=upstream", f: "force", l: "list", q: "quiet", c: "copy" },
      long: { all: "all", remotes: "remotes", verbose: "verbose", "delete": "delete", move: "move", "set-upstream-to": "=upstream",
        "unset-upstream": "unsetUpstream", merged: "merged", "no-merged": "noMerged", "show-current": "showCurrent", force: "force",
        list: "list", quiet: "quiet", copy: "copy", "no-color": "x", color: "x" }
    });
    if (o.bad || o.missing) { optError(o, "branch"); return; }
    var g = state.git, cur = VG.headBranch();
    if (o.showCurrent) { if (cur) { pre(cur); } return; }

    if (o["delete"] || o.forceDelete) {
      if (!o._.length) { fail("fatal: se necesita el nombre de una rama"); term.status.code = 128; return; }
      o._.forEach(function (n) {
        if (o.remotes) {
          var sl = n.indexOf("/");
          var rr = sl > 0 && g.remoteRefs[n.slice(0, sl)];
          if (!rr || !has(rr, n.slice(sl + 1))) { fail("error: rama de rastreo remoto '" + n + "' no encontrada."); return; }
          pre("Eliminada la rama de rastreo remota " + n + " (era " + VG.short(rr[n.slice(sl + 1)]) + ").");
          delete rr[n.slice(sl + 1)];
          return;
        }
        if (!has(g.branches, n)) { fail("error: rama '" + n + "' no encontrada."); return; }
        if (n === cur) { fail("error: no se puede borrar la rama '" + n + "' que está siendo usada por el árbol de trabajo en '" + cfg.REPO_DIR + "'"); return; }
        var tip = g.branches[n], up = g.upstream[n];
        var merged = VG.isAncestor(tip, VG.headHash()) || (up && VG.isAncestor(tip, VG.remoteRef(up.remote, up.branch)));
        if (!merged && !o.forceDelete && !(o["delete"] && o.force)) {
          fail("error: la rama '" + n + "' no ha sido fusionada completamente.");
          hint("Si estás seguro de que quieres borrarla, ejecuta 'git branch -D " + n + "'\nDesactiva este mensaje ejecutando\n\"git config advice.forceDeleteBranch false\"");
          return;
        }
        delete g.branches[n];
        delete g.upstream[n];
        pre("Eliminada la rama " + n + " (era " + VG.short(tip) + ").");
        if (!merged) { VG.risky("branchD", "Borraste la rama " + n + " sin fusionarla: sus commits solo se pueden recuperar ya con el reflog."); }
        VG.emit({ type: "branch-delete", name: n, merged: merged });
      });
      return;
    }

    if (o.move || o.forceMove) {
      var oldN = o._.length > 1 ? o._[0] : cur, newN = o._.length > 1 ? o._[1] : o._[0];
      if (!newN) { fail("fatal: se necesita un nuevo nombre de rama"); term.status.code = 128; return; }
      if (!VG.validRef(newN)) { fail("fatal: '" + newN + "' no es un nombre de rama válido"); term.status.code = 128; return; }
      if (has(g.branches, newN) && !o.forceMove && newN !== oldN) { fail("fatal: una rama llamada '" + newN + "' ya existe"); term.status.code = 128; return; }
      if (!has(g.branches, oldN)) {
        if (oldN === cur && !VG.headHash()) { g.HEAD = { branch: newN }; VG.emit({ type: "branch-rename", from: oldN, to: newN }); return; }
        fail("error: no existe una rama llamada '" + oldN + "'");
        term.status.code = 1;
        return;
      }
      g.branches[newN] = g.branches[oldN];
      if (newN !== oldN) { delete g.branches[oldN]; }
      if (g.upstream[oldN]) { g.upstream[newN] = g.upstream[oldN]; if (newN !== oldN) { delete g.upstream[oldN]; } }
      if (cur === oldN) { g.HEAD = { branch: newN }; }
      VG.emit({ type: "branch-rename", from: oldN, to: newN });
      return;
    }

    if (o.upstream) {
      var upSpec = last(o.upstream), b = o._[0] || cur, sl2 = upSpec.indexOf("/");
      if (sl2 < 0 || !has(g.remoteRefs, upSpec.slice(0, sl2)) || !has(g.remoteRefs[upSpec.slice(0, sl2)], upSpec.slice(sl2 + 1))) {
        fail("error: la rama upstream solicitada '" + upSpec + "' no existe");
        hint("Si estás planeando basar tu trabajo en una rama upstream que ya existe en el\nremoto, puede que necesites ejecutar \"git fetch\" para obtenerla.");
        term.status.code = 128;
        return;
      }
      if (!b || !has(g.branches, b)) { fail("fatal: la rama '" + b + "' no existe"); term.status.code = 128; return; }
      g.upstream[b] = { remote: upSpec.slice(0, sl2), branch: upSpec.slice(sl2 + 1) };
      pre("rama '" + b + "' configurada para rastrear '" + upSpec + "'.");
      return;
    }
    if (o.unsetUpstream) { delete g.upstream[o._[0] || cur]; return; }

    if (o._.length && !o.list) {
      var name = o._[0];
      if (!VG.validRef(name)) { fail("fatal: '" + name + "' no es un nombre de rama válido"); term.status.code = 128; return; }
      if (has(g.branches, name) && !o.force) { fail("fatal: una rama llamada '" + name + "' ya existe"); term.status.code = 128; return; }
      var start = o._[1] ? VG.resolveRev(o._[1]) : VG.headHash();
      if (!start) { fail("fatal: no es un nombre de objeto válido: '" + (o._[1] || cur || "HEAD") + "'."); term.status.code = 128; return; }
      g.branches[name] = start;
      var rs = o._[1] && o._[1].indexOf("/") > 0 ? o._[1] : null;
      if (rs && has(g.remoteRefs, rs.split("/")[0]) && has(g.remoteRefs[rs.split("/")[0]], rs.slice(rs.indexOf("/") + 1))) {
        g.upstream[name] = { remote: rs.split("/")[0], branch: rs.slice(rs.indexOf("/") + 1) };
        pre("rama '" + name + "' configurada para rastrear '" + rs + "'.");
      }
      VG.emit({ type: "branch-create", name: name });
      return;
    }

    var names = sortedKeys(g.branches);
    if (o.merged) { names = names.filter(function (n) { return VG.isAncestor(g.branches[n], VG.headHash()); }); }
    if (o.noMerged) { names = names.filter(function (n) { return !VG.isAncestor(g.branches[n], VG.headHash()); }); }
    var remotes = [];
    sortedKeys(g.remoteRefs).forEach(function (r) { sortedKeys(g.remoteRefs[r]).forEach(function (bb) { remotes.push(r + "/" + bb); }); });
    var width = 0;
    if (!o.remotes) { names.forEach(function (n) { width = Math.max(width, n.length); }); }
    if (o.remotes || o.all) { remotes.forEach(function (r) { width = Math.max(width, (o.all ? "remotes/" : "").length + r.length); }); }
    function vInfo(hash, branch) {
      if (!o.verbose) { return []; }
      var segs = [["", " "], ["", VG.short(hash)], ["", " "]];
      var tr = branch ? trackShort(branch, o.verbose > 1) : null;
      if (tr) { segs.push(["", "["]); Array.prototype.push.apply(segs, tr); segs.push(["", "] "]); }
      segs.push(["", firstLine(VG.commitMsg(hash))]);
      return segs;
    }
    if (!o.remotes) {
      if (!cur && g.HEAD.detached) {
        var label = g.op && g.op.type === "rebase" ? "(no hay rama, rebasando " + g.op.branch + ")" : "(HEAD desacoplada en " + VG.short(g.HEAD.detached) + ")";
        width = Math.max(width, label.length);
        rich([["g", "* " + pad(label, o.verbose ? width : 0)]].concat(vInfo(g.HEAD.detached, null)));
      }
      names.forEach(function (n) {
        var isCur = n === cur;
        rich([[isCur ? "g" : "", (isCur ? "* " : "  ") + pad(n, o.verbose ? width : 0)]].concat(vInfo(g.branches[n], n)));
      });
    }
    if (o.remotes || o.all) {
      remotes.forEach(function (r) {
        var sl3 = r.indexOf("/");
        rich([["r", "  " + pad((o.all ? "remotes/" : "") + r, o.verbose ? width : 0)]].concat(vInfo(g.remoteRefs[r.slice(0, sl3)][r.slice(sl3 + 1)], null)));
      });
    }
    VG.emit({ type: "branch-list" });
  };

  /* ---------------- git switch · git checkout ---------------- */
  function carriedChanges() {
    var st = VG.computeStatus(), seen = {};
    st.staged.concat(st.unstaged).forEach(function (e) {
      if (seen[e.path]) { return; }
      seen[e.path] = true;
      pre({ "new": "A", mod: "M", del: "D", ren: "R" }[e.type] + "\t" + e.path);
    });
  }
  function switchTo(hash, force) {
    var g = state.git, from = VG.headTree() || {}, to = VG.treeOf(hash);
    if (force) {
      unionKeys(g.index, from, to).forEach(function (p) {
        if (has(to, p)) { state.work[p] = to[p]; }
        else if (has(g.index, p) || has(from, p)) { delete state.work[p]; }
      });
      g.index = copy(to);
      g.unmerged = {};
      return true;
    }
    if (VG.wouldOverwrite(from, to, null, "hacer checkout")) { return false; }
    VG.applyTree(from, to);
    carriedChanges();
    return true;
  }
  function opBlocksSwitch() {
    var g = state.git;
    if (!g.op) { return false; }
    if (g.op.type === "rebase") { fail("fatal: no puedes cambiar de rama mientras rebasas\nConsidera usar \"git rebase --quit\" o \"git worktree add\"."); }
    else if (g.op.type === "merge") { fail("fatal: no puedes cambiar de rama en medio de una fusión\nConsidera usar \"git merge --quit\" o \"git worktree add\"."); }
    else { fail("fatal: no puedes cambiar de rama en medio de un " + g.op.type + "\nConsidera usar \"git " + g.op.type + " --quit\" o \"git worktree add\"."); }
    term.status.code = 128;
    return true;
  }
  function remoteBranchFor(name) {
    var g = state.git;
    var found = Object.keys(g.remoteRefs).filter(function (r) { return has(g.remoteRefs[r], name); });
    return found.length === 1 ? found[0] : null;
  }

  GIT.switch = function (args) {
    var o = parseArgs(args, { short: { c: "=create", C: "=forceCreate", d: "detach", f: "force", q: "quiet", t: "track" },
      long: { create: "=create", "force-create": "=forceCreate", detach: "detach", force: "force", "discard-changes": "force",
        quiet: "quiet", track: "track", "no-track": "x", guess: "x", "no-guess": "x" } });
    if (o.bad || o.missing) { optError(o, "switch"); return; }
    var g = state.git;
    if (opBlocksSwitch()) { return; }
    var newName = o.create ? last(o.create) : o.forceCreate ? last(o.forceCreate) : null;
    if (newName) {
      if (!VG.validRef(newName)) { fail("fatal: '" + newName + "' no es un nombre de rama válido"); term.status.code = 128; return; }
      if (has(g.branches, newName) && !o.forceCreate) { fail("fatal: una rama llamada '" + newName + "' ya existe"); term.status.code = 128; return; }
      var startSpec = o._[0];
      var start = startSpec ? VG.resolveRev(startSpec) : VG.headHash();
      if (startSpec && !start) { fail("fatal: referencia inválida: " + startSpec); term.status.code = 128; return; }
      if (!start) {
        g.HEAD = { branch: newName };
        note("Cambiado a nueva rama '" + newName + "'");
        VG.emit({ type: "switch", branch: newName, created: true });
        return;
      }
      if (!switchTo(start, o.force)) { return; }
      g.branches[newName] = start;
      if (startSpec && startSpec.indexOf("/") > 0 && VG.resolveBase(startSpec) && !has(g.branches, startSpec)) {
        var sl = startSpec.indexOf("/");
        if (has(g.remoteRefs, startSpec.slice(0, sl))) {
          g.upstream[newName] = { remote: startSpec.slice(0, sl), branch: startSpec.slice(sl + 1) };
          pre("rama '" + newName + "' configurada para rastrear '" + startSpec + "'.");
        }
      }
      VG.attachHead(newName);
      note("Cambiado a nueva rama '" + newName + "'");
      VG.emit({ type: "switch", branch: newName, created: true });
      return;
    }
    var target = o._[0];
    if (!target) { fail("fatal: falta el argumento de rama o commit"); term.status.code = 128; return; }
    if (target === "-") {
      target = g.prevBranch;
      if (!target || !has(g.branches, target)) { fail("fatal: referencia inválida: @{-1}"); term.status.code = 128; return; }
    }
    if (o.detach) {
      var dh = VG.resolveRev(target);
      if (!dh) { fail("fatal: referencia inválida: " + target); term.status.code = 128; return; }
      if (!switchTo(dh, o.force)) { return; }
      VG.detachHead(dh);
      note("HEAD está ahora en " + VG.short(dh) + " " + firstLine(VG.commitMsg(dh)));
      VG.emit({ type: "switch", detached: dh });
      return;
    }
    if (has(g.branches, target)) {
      if (target === VG.headBranch()) {
        note("Ya en '" + target + "'");
        VG.trackingLines(target).forEach(function (l) { pre(l); });
        return;
      }
      if (!switchTo(g.branches[target], o.force)) { return; }
      VG.attachHead(target);
      note("Cambiado a rama '" + target + "'");
      VG.trackingLines(target).forEach(function (l) { pre(l); });
      VG.emit({ type: "switch", branch: target });
      return;
    }
    var rem = remoteBranchFor(target);
    if (rem) {
      var rh = g.remoteRefs[rem][target];
      if (!switchTo(rh, o.force)) { return; }
      g.branches[target] = rh;
      g.upstream[target] = { remote: rem, branch: target };
      VG.attachHead(target);
      pre("rama '" + target + "' configurada para rastrear '" + rem + "/" + target + "'.");
      note("Cambiado a nueva rama '" + target + "'");
      VG.emit({ type: "switch", branch: target, created: true });
      return;
    }
    if (VG.resolveRev(target)) {
      if (has(g.tags, target)) { fail("fatal: se esperaba una rama, se obtuvo la etiqueta '" + target + "'"); }
      else if (target.indexOf("/") > 0 && VG.resolveBase(target)) { fail("fatal: se esperaba una rama, se obtuvo la rama remota '" + target + "'"); }
      else { fail("fatal: se esperaba una rama, se obtuvo el commit '" + target + "'"); }
      hint("Si quieres desacoplar HEAD en el commit, prueba de nuevo con la opción --detach.");
      term.status.code = 128;
      return;
    }
    fail("fatal: referencia inválida: " + target);
    term.status.code = 128;
  };

  function checkoutPaths(specs, srcHash, o) {
    var g = state.git, idx = g.index, work = state.work;
    var src = srcHash ? VG.treeOf(srcHash) : null, targets = [];
    for (var s = 0; s < specs.length; s++) {
      var matched = VG.matchPathspec(specs[s], src ? Object.keys(src).sort() : unionKeys(idx, g.unmerged));
      if (!matched.length) { fail("error: pathspec '" + specs[s] + "' no concordó con ningún archivo conocido por git"); return; }
      Array.prototype.push.apply(targets, matched);
    }
    var n = 0;
    for (var i = 0; i < targets.length; i++) {
      var p = targets[i];
      if (o.ours || o.theirs) {
        var u = g.unmerged[p];
        if (!u) { continue; }
        var v = o.ours ? u.ours : u.theirs;
        if (v === undefined) { fail("error: la ruta '" + p + "' no tiene " + (o.ours ? "nuestra" : "su") + " versión"); return; }
        work[p] = v;
      } else if (src) {
        idx[p] = src[p];
        work[p] = src[p];
        delete g.unmerged[p];
      } else {
        if (has(g.unmerged, p)) { fail("error: la ruta '" + p + "' no está fusionada"); return; }
        work[p] = idx[p];
      }
      n++;
    }
    note((n === 1 ? "Actualizada 1 ruta desde " : "Actualizadas " + n + " rutas desde ") + (src ? VG.short(srcHash) : "el índice"));
    VG.emit({ type: "restore", staged: !!src, worktree: true, paths: targets });
  }

  GIT.checkout = function (args) {
    var o = parseArgs(args, { short: { b: "=create", B: "=forceCreate", f: "force", q: "quiet", t: "track", p: "patch" },
      long: { ours: "ours", theirs: "theirs", detach: "detach", force: "force", quiet: "quiet", track: "track", patch: "patch" } });
    if (o.bad || o.missing) { optError(o, "checkout"); return; }
    var g = state.git;
    if (o.create || o.forceCreate) {
      GIT.switch([o.create ? "-c" : "-C", last(o.create || o.forceCreate)].concat(o._).concat(o.force ? ["-f"] : []));
      return;
    }
    if (o.__) { checkoutPaths(o.__, o._[0] ? VG.resolveRev(o._[0]) : null, o); return; }
    if (o.ours || o.theirs) { checkoutPaths(o._, null, o); return; }
    if (!o._.length) { if (VG.headBranch()) { VG.trackingLines(VG.headBranch()).forEach(function (l) { pre(l); }); } return; }
    var t = o._[0];
    if (t === "-" || has(g.branches, t) || (!VG.resolveRev(t) && remoteBranchFor(t))) {
      GIT.switch([t].concat(o.force ? ["-f"] : []));
      return;
    }
    var h = VG.resolveRev(t);
    if (h) {
      if (o._.length > 1) { checkoutPaths(o._.slice(1), h, o); return; }
      if (opBlocksSwitch()) { return; }
      if (!switchTo(h, o.force)) { return; }
      VG.detachHead(h);
      note("Nota: cambiando a '" + t + "'.\n\n" +
        "Te encuentras en estado 'HEAD desacoplada'. Puedes revisar por aquí, hacer\n" +
        "cambios experimentales y hacer commits, y puedes descartar cualquier\n" +
        "commit que hayas hecho en este estado sin impactar a tu rama realizando\notro checkout.\n\n" +
        "Si quieres crear una nueva rama para mantener los commits que has creado,\n" +
        "puedes hacerlo (ahora o después) usando -c con el comando switch. Por ejemplo:\n\n" +
        "  git switch -c <nombre-de-nueva-rama>\n\nO deshacer la operación con:\n\n  git switch -\n\n" +
        "Desactiva este aviso poniendo la variable de config advice.detachedHead en false\n\n" +
        "HEAD está ahora en " + VG.short(h) + " " + firstLine(VG.commitMsg(h)));
      VG.emit({ type: "switch", detached: h });
      return;
    }
    if (VG.matchPathspec(t, unionKeys(g.index, g.unmerged)).length) { checkoutPaths(o._, null, o); return; }
    fail("error: pathspec '" + t + "' no concordó con ningún archivo conocido por git");
    term.status.code = 1;
  };

  /* ---------------- git merge ---------------- */
  function mergeName(spec) {
    var g = state.git;
    if (has(g.branches, spec)) { return "branch '" + spec + "'"; }
    if (has(g.tags, spec)) { return "tag '" + spec + "'"; }
    if (spec.indexOf("/") > 0 && VG.resolveBase(spec)) { return "remote-tracking branch '" + spec + "'"; }
    return "commit '" + spec + "'";
  }
  var abortOp = VG.abortOp = function () {
    var g = state.git, op = g.op, head = VG.headTree() || {};
    var touched = (op && op.touched) || [];
    unionKeys(g.index, head, g.unmerged).forEach(function (p) {
      if (touched.indexOf(p) === -1 && !has(g.unmerged, p)) { return; }
      if (has(head, p)) { g.index[p] = head[p]; state.work[p] = head[p]; }
      else { delete g.index[p]; delete state.work[p]; }
    });
    g.unmerged = {};
    g.op = null;
  };

  var doMerge = VG.doMerge = function (theirs, spec, o, via, forcedMsg) {
    var g = state.git, ours = VG.headHash();
    if (!ours) {
      var to0 = VG.treeOf(theirs);
      if (VG.wouldOverwrite({}, to0, null, "fusionar")) { return false; }
      VG.applyTree({}, to0);
      VG.setHead(theirs, "merge " + spec + ": Fast-forward");
      pre("Actualizando 0000000.." + VG.short(theirs));
      pre("Avance rápido");
      VG.emit({ type: "merge", ff: true, theirs: theirs });
      return true;
    }
    if (VG.isAncestor(theirs, ours)) { pre("Ya está actualizado."); VG.emit({ type: "merge", upToDate: true, theirs: theirs }); return true; }
    var ff = VG.isAncestor(ours, theirs);
    if (ff && !o.noFf && VG.cfgGet("merge.ff") !== "false") {
      var from = VG.headTree(), to = VG.treeOf(theirs);
      if (VG.wouldOverwrite(from, to, null, "fusionar")) { return false; }
      VG.applyTree(from, to);
      g.origHead = ours;
      VG.setHead(theirs, (via === "pull" ? "pull" : "merge " + spec) + ": Fast-forward");
      pre("Actualizando " + VG.short(ours) + ".." + VG.short(theirs));
      pre("Avance rápido");
      var chf = VG.treeChanges(from, to);
      VG.printStat(chf);
      VG.printModeLines(chf);
      VG.emit({ type: "merge", ff: true, theirs: theirs });
      return true;
    }
    if (o.ffOnly) { fail("fatal: No es posible hacer fast-forward, abortando."); term.status.code = 128; return false; }
    var base = VG.mergeBase(ours, theirs);
    if (!base && !o.unrelated) { fail("fatal: rehusando fusionar historias no relacionadas"); term.status.code = 128; return false; }
    var res = VG.mergeTrees(VG.treeOf(base) || {}, VG.headTree(), VG.treeOf(theirs), "HEAD", spec);
    if (VG.wouldOverwrite(VG.headTree(), res.tree, Object.keys(res.conflicts), "fusionar")) { return false; }
    g.origHead = ours;
    res.messages.forEach(function (m) { pre(m); });
    var defMsg = forcedMsg || ("Merge " + mergeName(spec) +
      (VG.headBranch() && VG.headBranch() !== "main" && VG.headBranch() !== "master" ? " into " + VG.headBranch() : ""));
    var msg = o.message ? o.message.join("\n\n") : defMsg;
    var touched = unionKeys(VG.headTree(), res.tree).filter(function (p) { return VG.headTree()[p] !== res.tree[p]; })
      .concat(Object.keys(res.conflicts));
    if (Object.keys(res.conflicts).length) {
      VG.applyMerge(VG.headTree(), res);
      g.op = { type: "merge", theirs: theirs, label: spec, touched: touched,
        msg: msg + "\n\n# Conflicts:\n" + sortedKeys(res.conflicts).map(function (p) { return "#\t" + p; }).join("\n") };
      pre("Fusión automática falló; arregle los conflictos y luego realice un commit con el resultado.");
      term.status.code = 1;
      VG.emit({ type: "merge", conflict: true, theirs: theirs });
      return false;
    }
    var before = VG.headTree();
    VG.applyTree(before, res.tree);
    function commitMerge(finalMsg) {
      var h = VG.makeCommit(res.tree, [ours, theirs], finalMsg);
      VG.setHead(h, (via === "pull" ? "pull" : "merge " + spec) + ": Merge made by the 'ort' strategy.");
      state.myCommits.push(h);
      pre("Merge hecho por la estrategia 'ort'.");
      var ch = VG.treeChanges(VG.treeOf(ours), res.tree);
      VG.printStat(ch);
      VG.printModeLines(ch);
      VG.checkSecrets(res.tree);
      VG.emit({ type: "merge", commit: h, theirs: theirs });
      VG.emit({ type: "commit", hash: h, merge: true, msg: finalMsg });
    }
    if (o.message || o.noEdit) { commitMerge(msg); return true; }
    g.op = { type: "merge", theirs: theirs, label: spec, touched: touched, msg: msg };
    VG.openEditor(cfg.REPO_DIR + "/.git/MERGE_MSG", msg + "\n\n" +
      "# Por favor ingresa un mensaje de commit que explique por qué es necesaria esta fusión,\n" +
      "# especialmente si esta fusiona un upstream actualizado en una rama de tópico.\n#\n" +
      "# Las líneas que comienzan con '#' serán ignoradas, y un mensaje vacío aborta\n# el commit.\n",
      function (text) {
        var m = VG.cleanMsg(text);
        if (!m) {
          note("No se realiza commit de la fusión; usa 'git commit' para completar la fusión.");
          term.status.code = 1;
          return;
        }
        g.op = null;
        commitMerge(m);
      });
    return true;
  };

  GIT.merge = function (args) {
    var o = parseArgs(args, { short: { m: "=message", q: "quiet", v: "verbose", e: "edit", n: "x", S: "x" },
      long: { "no-ff": "noFf", "ff-only": "ffOnly", ff: "ff", "no-edit": "noEdit", edit: "edit", abort: "abort", "continue": "cont",
        quit: "quit", message: "=message", squash: "squash", "no-commit": "noCommit", stat: "x", "no-stat": "x", quiet: "quiet",
        "allow-unrelated-histories": "unrelated", verbose: "verbose", log: "x", strategy: "=x" } });
    if (o.bad || o.missing) { optError(o, "merge"); return; }
    var g = state.git;
    if (o.abort) {
      if (!g.op || g.op.type !== "merge") { fail("fatal: No hay una fusión en progreso (MERGE_HEAD no existe)."); term.status.code = 128; return; }
      abortOp();
      VG.emit({ type: "merge-abort" });
      return;
    }
    if (o.quit) {
      if (!g.op) { fail("fatal: No hay una fusión en progreso (MERGE_HEAD no existe)."); term.status.code = 128; return; }
      g.op = null;
      return;
    }
    if (o.cont) {
      if (!g.op || g.op.type !== "merge") { fail("fatal: No hay una fusión en progreso (MERGE_HEAD no existe)."); term.status.code = 128; return; }
      GIT.commit(o.noEdit ? ["--no-edit"] : []);
      return;
    }
    if (g.op) {
      if (Object.keys(g.unmerged).length) {
        fail("error: Fusionar no es posible porque tienes archivos sin fusionar.");
        hint("Corrígelos en el árbol de trabajo y entonces usa 'git add/rm <archivo>'\ncomo sea apropiado para marcar la resolución y realizar un commit.");
        fail("fatal: Saliendo porque existe un conflicto no resuelto.");
      } else {
        fail("fatal: No has concluido tu fusión (MERGE_HEAD existe).");
        hint("Por favor, realiza un commit con los cambios antes de fusionar.");
        fail("fatal: Saliendo por fusión sin terminar.");
      }
      term.status.code = 128;
      return;
    }
    if (o.squash || o.noCommit) { sys("info", "ℹ (simulador) --squash y --no-commit no están disponibles."); term.status.code = 1; return; }
    var spec = o._[0];
    if (!spec) {
      var up = VG.headBranch() && g.upstream[VG.headBranch()];
      if (!up) { fail("fatal: No hay rama upstream por defecto definida para la rama actual."); term.status.code = 128; return; }
      spec = up.remote + "/" + up.branch;
    }
    var theirs = VG.resolveRev(spec);
    if (!theirs) { fail("merge: " + spec + " - no se puede fusionar algo que no existe"); term.status.code = 1; return; }
    doMerge(theirs, spec, o, "merge");
  };

  /* ---------------- git cherry-pick · git revert ---------------- */
  function applyCommitAs(type, spec, o) {
    var g = state.git;
    var h = VG.resolveRev(spec);
    if (!h) { fail("fatal: revisión incorrecta '" + spec + "'"); term.status.code = 128; return; }
    var c = state.commits[h];
    if (c.parents.length > 1 && !o.mainline) {
      fail("error: el commit " + h + " es una fusión pero no se dio la opción -m.");
      fail("fatal: " + (type === "revert" ? "revertir" : "cherry-pick") + " falló");
      term.status.code = 128;
      return;
    }
    var parentTree = VG.treeOf(c.parents[o.mainline ? parseInt(last(o.mainline), 10) - 1 : 0]) || {};
    var base = type === "revert" ? c.tree : parentTree;
    var theirsTree = type === "revert" ? parentTree : c.tree;
    var ours = VG.headTree() || {};
    var label = VG.short(h) + " (" + firstLine(c.msg) + ")";
    var res = VG.mergeTrees(base, ours, theirsTree, "HEAD", (type === "revert" ? "padre de " : "") + label);
    if (VG.wouldOverwrite(ours, res.tree, Object.keys(res.conflicts), type === "revert" ? "revertir" : "hacer cherry-pick")) { return; }
    var msg = type === "revert"
      ? "Revert \"" + firstLine(c.msg) + "\"\n\nThis reverts commit " + h + "."
      : c.msg;
    var touched = unionKeys(ours, res.tree).filter(function (p) { return ours[p] !== res.tree[p]; }).concat(Object.keys(res.conflicts));
    if (Object.keys(res.conflicts).length) {
      VG.applyMerge(ours, res);
      g.op = { type: type, commit: h, msg: msg, author: c.author, touched: touched };
      res.messages.forEach(function (m) { pre(m); });
      fail("error: no se pudo " + (type === "revert" ? "revertir" : "aplicar") + " " + VG.short(h) + "... " + firstLine(c.msg));
      hint("Después de resolver los conflictos, marca las rutas corregidas\ncon 'git add <rutas>' o 'git rm <rutas>'\ny haz un commit con 'git " + type + " --continue'.\n" +
        "Puedes en su lugar saltar este commit con 'git " + type + " --skip'.\n" +
        "Para abortar y regresar al estado anterior a \"git " + type + "\",\nejecuta \"git " + type + " --abort\".");
      term.status.code = 1;
      VG.emit({ type: type, conflict: true, commit: h });
      return;
    }
    if (VG.sameTree(res.tree, ours)) {
      fail("El " + (type === "revert" ? "revert" : "cherry-pick") + " anterior ahora está vacío, posiblemente por resolución de conflictos.");
      hint("Si de todas formas deseas hacer commit, usa:\n\n    git commit --allow-empty\n");
      term.status.code = 1;
      return;
    }
    VG.applyTree(ours, res.tree);
    function done(finalMsg) {
      var nh = VG.makeCommit(res.tree, [VG.headHash()], finalMsg, type === "cherry-pick" ? c.author : null);
      VG.setHead(nh, type + ": " + firstLine(finalMsg));
      if (type === "revert") { state.myCommits.push(nh); }
      g.op = null;
      pre("[" + (VG.headBranch() || "HEAD desacoplada") + " " + VG.short(nh) + "] " + firstLine(finalMsg));
      if (type === "cherry-pick") { pre(" Date: " + VG.fmtGitDate(c.date)); }
      var ch = VG.treeChanges(ours, res.tree);
      pre(VG.summaryLine(ch));
      VG.printModeLines(ch);
      VG.checkSecrets(res.tree);
      VG.emit({ type: "commit", hash: nh, msg: finalMsg });
      VG.emit({ type: type, commit: nh, of: h });
    }
    if (type === "cherry-pick" || o.noEdit) { done(msg); return; }
    g.op = { type: type, commit: h, msg: msg, author: c.author, touched: touched };
    VG.openEditor(cfg.REPO_DIR + "/.git/COMMIT_EDITMSG", VG.commitTemplate(msg, ""), function (text) {
      var m = VG.cleanMsg(text);
      if (!m) { fail("Abortando commit debido a que el mensaje de commit está vacío."); return; }
      done(m);
    });
  }
  function continueOp(type, o) {
    var g = state.git;
    if (!g.op || g.op.type !== type) { fail("error: no hay " + type + " en progreso"); fail("fatal: " + type + " falló"); term.status.code = 128; return; }
    if (Object.keys(g.unmerged).length) {
      fail("error: No es posible hacer commit porque tienes archivos sin fusionar.");
      hint("Corrígelos en el árbol de trabajo y entonces usa 'git add/rm <archivo>'\ncomo sea apropiado para marcar la resolución y realizar un commit.");
      term.status.code = 128;
      return;
    }
    GIT.commit(["--no-edit"]);
  }
  GIT["cherry-pick"] = function (args) {
    var o = parseArgs(args, { short: { e: "edit", n: "x", x: "x", m: "=mainline", s: "x" },
      long: { "continue": "cont", abort: "abort", skip: "skip", "no-edit": "noEdit", edit: "edit", mainline: "=mainline", "no-commit": "x" } });
    if (o.bad || o.missing) { optError(o, "cherry-pick"); return; }
    o.noEdit = true;   // cherry-pick reutiliza el mensaje original
    if (o.abort) {
      if (!state.git.op || state.git.op.type !== "cherry-pick") { fail("error: no hay cherry-pick o revert en progreso"); fail("fatal: cherry-pick falló"); term.status.code = 128; return; }
      abortOp();
      return;
    }
    if (o.cont) { continueOp("cherry-pick", o); return; }
    if (o.skip) { abortOp(); return; }
    if (!o._.length) { note("uso: git cherry-pick [<opciones>] <commit>..."); term.status.code = 129; return; }
    applyCommitAs("cherry-pick", o._[0], o);
  };
  GIT.revert = function (args) {
    var o = parseArgs(args, { short: { e: "edit", n: "x", m: "=mainline", s: "x" },
      long: { "continue": "cont", abort: "abort", skip: "skip", "no-edit": "noEdit", edit: "edit", mainline: "=mainline", "no-commit": "x" } });
    if (o.bad || o.missing) { optError(o, "revert"); return; }
    if (o.abort) {
      if (!state.git.op || state.git.op.type !== "revert") { fail("error: no hay cherry-pick o revert en progreso"); fail("fatal: revert falló"); term.status.code = 128; return; }
      abortOp();
      return;
    }
    if (o.cont) { continueOp("revert", o); return; }
    if (o.skip) { abortOp(); return; }
    if (!o._.length) { note("uso: git revert [<opciones>] <commit>..."); term.status.code = 129; return; }
    applyCommitAs("revert", o._[0], o);
  };

  /* ---------------- git rebase ---------------- */
  function rebaseNext() {
    var g = state.git, op = g.op;
    while (op.todo.length) {
      var h = op.todo.shift();
      op.current = h;
      var c = state.commits[h];
      var ours = VG.headTree() || {};
      var base = VG.treeOf(c.parents[0]) || {};
      var res = VG.mergeTrees(base, ours, c.tree, "HEAD", VG.short(h) + " (" + firstLine(c.msg) + ")");
      if (Object.keys(res.conflicts).length) {
        VG.applyMerge(ours, res);
        op.touched = unionKeys(ours, res.tree).filter(function (p) { return ours[p] !== res.tree[p]; }).concat(Object.keys(res.conflicts));
        res.messages.forEach(function (m) { pre(m); });
        fail("error: no se pudo aplicar " + VG.short(h) + "... " + firstLine(c.msg));
        hint("Resuelve todos los conflictos manualmente, márcalos como resueltos con\n" +
          "\"git add/rm <archivos_en_conflicto>\", luego ejecuta \"git rebase --continue\".\n" +
          "Puedes en su lugar saltar este commit: ejecuta \"git rebase --skip\".\n" +
          "Para abortar y regresar al estado previo al \"git rebase\", ejecuta \"git rebase --abort\".");
        note("No se pudo aplicar " + VG.short(h) + "... " + firstLine(c.msg));
        term.status.code = 1;
        VG.emit({ type: "rebase", conflict: true });
        return false;
      }
      if (VG.sameTree(res.tree, ours)) { op.done.push(h); continue; }
      VG.applyTree(ours, res.tree);
      var nh = VG.makeCommit(res.tree, [VG.headHash()], c.msg, c.author);
      g.HEAD.detached = nh;
      g.reflog.push({ hash: nh, msg: "rebase (pick): " + firstLine(c.msg) });
      if (state.myCommits.indexOf(h) !== -1) { state.myCommits.push(nh); }
      op.done.push(h);
    }
    var newTip = VG.headHash();
    g.branches[op.branch] = newTip;
    g.HEAD = { branch: op.branch };
    g.reflog.push({ hash: newTip, msg: "rebase (finish): returning to refs/heads/" + op.branch });
    g.op = null;
    note("Rebase aplicado satisfactoriamente y actualizado refs/heads/" + op.branch + ".");
    VG.emit({ type: "rebase", done: true });
    return true;
  }
  VG.startRebase = function (onto, spec) {
    var g = state.git, branch = VG.headBranch(), head = VG.headHash();
    if (!branch) { sys("info", "ℹ (simulador) El rebase con HEAD desacoplada no está disponible."); term.status.code = 1; return false; }
    var st = VG.computeStatus();
    if (st.staged.length || st.unstaged.length) {
      fail("error: no se puede aplicar rebase: tienes cambios sin confirmar.\nerror: Por favor, haz commit de tus cambios o guárdalos con git stash.");
      term.status.code = 1;
      return false;
    }
    if (VG.isAncestor(head, onto)) {
      VG.applyTree(VG.headTree(), VG.treeOf(onto));
      g.origHead = head;
      VG.setHead(onto, "rebase finish: refs/heads/" + branch + " onto " + VG.short(onto));
      note("Rebase aplicado satisfactoriamente y actualizado refs/heads/" + branch + ".");
      VG.emit({ type: "rebase", done: true, ff: true });
      return true;
    }
    if (VG.isAncestor(onto, head)) { note("La rama actual " + branch + " está actualizada."); VG.emit({ type: "rebase", upToDate: true }); return true; }
    var todo = VG.walk([head], [onto]).filter(function (c) { return c.parents.length < 2; }).reverse().map(function (c) { return c.hash; });
    g.origHead = head;
    g.op = { type: "rebase", branch: branch, onto: onto, orig: head, todo: todo, done: [], total: todo.length, current: null, touched: [] };
    VG.applyTree(VG.headTree(), VG.treeOf(onto));
    g.HEAD = { detached: onto };
    g.reflog.push({ hash: onto, msg: "rebase (start): checkout " + spec });
    return rebaseNext();
  };
  function rebaseAbort() {
    var g = state.git, op = g.op, origTree = VG.treeOf(op.orig) || {};
    unionKeys(g.index, VG.headTree() || {}, g.unmerged, origTree).forEach(function (p) {
      if (has(origTree, p)) { state.work[p] = origTree[p]; } else { delete state.work[p]; }
    });
    g.index = copy(origTree);
    g.unmerged = {};
    g.branches[op.branch] = op.orig;
    g.HEAD = { branch: op.branch };
    g.reflog.push({ hash: op.orig, msg: "rebase (abort): returning to refs/heads/" + op.branch });
    g.op = null;
    VG.emit({ type: "rebase", aborted: true });
  }
  GIT.rebase = function (args) {
    var o = parseArgs(args, { short: { i: "interactive", q: "quiet", S: "x" },
      long: { "continue": "cont", abort: "abort", skip: "skip", interactive: "interactive", onto: "=onto", quiet: "quiet",
        "no-edit": "x", autostash: "x", quit: "quit", "rebase-merges": "x" } });
    if (o.bad || o.missing) { optError(o, "rebase"); return; }
    var g = state.git;
    if (o.interactive) { sys("info", "ℹ (simulador) El rebase interactivo (-i) no está disponible en este simulador."); term.status.code = 1; return; }
    if (o.abort) {
      if (!g.op || g.op.type !== "rebase") { fail("fatal: No hay un rebase en progreso?"); term.status.code = 128; return; }
      rebaseAbort();
      return;
    }
    if (o.quit) {
      if (!g.op || g.op.type !== "rebase") { fail("fatal: No hay un rebase en progreso?"); term.status.code = 128; return; }
      g.branches[g.op.branch] = VG.headHash();
      g.HEAD = { branch: g.op.branch };
      g.op = null;
      return;
    }
    if (o.cont) {
      if (!g.op || g.op.type !== "rebase") { fail("fatal: No hay un rebase en progreso?"); term.status.code = 128; return; }
      if (Object.keys(g.unmerged).length) {
        fail("error: No es posible continuar: tienes archivos sin fusionar.");
        hint("Resuelve los conflictos, márcalos con \"git add <archivo>\" y ejecuta de nuevo \"git rebase --continue\".");
        term.status.code = 128;
        return;
      }
      var c = state.commits[g.op.current];
      if (!VG.sameTree(g.index, VG.headTree() || {})) {
        var nh = VG.makeCommit(g.index, [VG.headHash()], c.msg, c.author);
        g.HEAD.detached = nh;
        g.reflog.push({ hash: nh, msg: "rebase (continue): " + firstLine(c.msg) });
        pre("[HEAD desacoplada " + VG.short(nh) + "] " + firstLine(c.msg));
        var ch = VG.treeChanges(VG.treeOf(c.parents[0]) || {}, state.commits[nh].tree);
        pre(VG.summaryLine(ch));
        VG.printModeLines(ch);
      }
      g.op.done.push(g.op.current);
      rebaseNext();
      return;
    }
    if (o.skip) {
      if (!g.op || g.op.type !== "rebase") { fail("fatal: No hay un rebase en progreso?"); term.status.code = 128; return; }
      var head2 = VG.headTree() || {};
      Object.keys(g.unmerged).forEach(function (p) {
        if (has(head2, p)) { g.index[p] = head2[p]; state.work[p] = head2[p]; }
        else { delete g.index[p]; delete state.work[p]; }
      });
      g.unmerged = {};
      g.op.done.push(g.op.current);
      rebaseNext();
      return;
    }
    if (g.op) { fail("fatal: Ya hay una operación en curso (" + g.op.type + ")."); term.status.code = 128; return; }
    var spec = o._[0];
    if (!spec) {
      var up = VG.headBranch() && g.upstream[VG.headBranch()];
      if (!up) { fail("fatal: No hay rama upstream por defecto definida para la rama actual."); term.status.code = 128; return; }
      spec = up.remote + "/" + up.branch;
    }
    var onto = VG.resolveRev(o.onto ? last(o.onto) : spec);
    if (!onto) { fail("fatal: upstream inválido '" + spec + "'"); term.status.code = 128; return; }
    VG.startRebase(onto, spec);
  };
})(this);
