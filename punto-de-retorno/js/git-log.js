/* ==========================================================
   git log (con grafo ASCII), git diff y git show
   ========================================================== */
(function (global) {
  "use strict";
  var RG = global.RG, VG = global.VG, util = RG.util;
  var state = VG.state, term = VG.term, GIT = VG.GIT;
  var has = util.has, unionKeys = util.unionKeys, pad = util.pad, firstLine = util.firstLine, linesOf = util.linesOf;
  var parseArgs = RG.parseArgs, last = RG.lastOf;
  var pre = term.pre, rich = term.rich, fail = term.fail;
  var optError = VG.optError;

  /* ---------------- Grafo ASCII ---------------- */
  var LANE_CLS = ["r", "g", "y", "bl", "m", "c"];
  function graphSegs(prefix) {
    var segs = [];
    for (var i = 0; i < prefix.length; i++) {
      var ch = prefix.charAt(i);
      if (ch === "|" || ch === "/" || ch === "\\") { segs.push([LANE_CLS[Math.floor(i / 2) % LANE_CLS.length], ch]); }
      else { segs.push(["", ch]); }
    }
    return segs;
  }
  function renderGraph(items) {
    var cols = [], known = {};
    items.forEach(function (it) { known[it.commit.hash] = true; });
    items.forEach(function (it) {
      var c = it.commit;
      var ci = cols.indexOf(c.hash);
      if (ci === -1) { cols.push(c.hash); ci = cols.length - 1; }
      var parents = c.parents.filter(function (p) { return known[p]; });
      var commitPrefix = cols.map(function (h, k) { return k === ci ? "*" : "|"; }).join(" ");
      var next = cols.slice(), trans = [];
      if (!parents.length) {
        next.splice(ci, 1);
      } else {
        next[ci] = parents[0];
        var ins = 0;
        for (var p = 1; p < parents.length; p++) {
          if (next.indexOf(parents[p]) === -1) { next.splice(ci + 1 + ins, 0, parents[p]); ins++; }
        }
        if (parents.length > 1) {
          var s = "";
          for (var k = 0; k < cols.length; k++) {
            if (k < ci) { s += "| "; }
            else if (k === ci) { s += "|\\"; }
            else { s += ins ? " \\" : " |"; }
          }
          trans.push(s);
          if (ins) { commitPrefix = commitPrefix.slice(0, 2 * ci + 1) + "  " + commitPrefix.slice(2 * ci + 1); }
        }
      }
      for (var j = next.length - 1; j > 0; j--) {
        if (next.indexOf(next[j]) < j) {
          var row = "";
          for (var k2 = 0; k2 < next.length; k2++) {
            if (k2 < j) { row += (k2 ? " " : "") + "|"; }
            else { row += "/" + (k2 < next.length - 1 ? " " : ""); }
          }
          trans.push(row.replace(/\s+$/, ""));
          next.splice(j, 1);
        }
      }
      var cont = next.map(function () { return "|"; }).join(" ");
      var width = Math.max(commitPrefix.length, cont.length);
      trans.forEach(function (t) { width = Math.max(width, t.length); });
      it.rows.forEach(function (segs, r) {
        var pf = r === 0 ? commitPrefix : (r - 1 < trans.length ? trans[r - 1] : cont);
        rich(graphSegs(pad(pf, width) + " ").concat(segs));
      });
      for (var t2 = it.rows.length - 1; t2 < trans.length; t2++) { rich(graphSegs(trans[t2])); }
      cols = next;
    });
  }

  /* ---------------- Formatos ---------------- */
  function relTime(ts) {
    var s = Math.max(0, Math.round((VG.fakeNow().getTime() - ts) / 1000));
    if (s < 60) { return "hace " + util.plural(s, "segundo", "segundos"); }
    var m = Math.round(s / 60);
    if (m < 60) { return "hace " + util.plural(m, "minuto", "minutos"); }
    return "hace " + util.plural(Math.round(m / 60), "hora", "horas");
  }
  function fmtPretty(fmt, c, refs) {
    var segs = [], re = /%(H|h|s|an|ae|ad|ar|d|n|cn|ce|cd|b|P|p|%)|%C\((\w+)\)|%C(red|green|yellow|blue|reset)/g;
    var lastI = 0, m, cls = "";
    while ((m = re.exec(fmt))) {
      if (m.index > lastI) { segs.push([cls, fmt.slice(lastI, m.index)]); }
      lastI = re.lastIndex;
      var color = m[2] || m[3];
      if (color) { cls = { red: "r", green: "g", yellow: "y", blue: "bl", magenta: "m", cyan: "c", reset: "", bold: "b" }[color] || ""; continue; }
      var v;
      switch (m[1]) {
        case "H": v = c.hash; break;
        case "h": v = VG.short(c.hash); break;
        case "s": v = firstLine(c.msg); break;
        case "an": case "cn": v = c.author.name; break;
        case "ae": case "ce": v = c.author.email; break;
        case "ad": case "cd": v = VG.fmtGitDate(c.date); break;
        case "ar": v = relTime(c.date); break;
        case "d": Array.prototype.push.apply(segs, VG.decoSegs(c.hash, refs)); continue;
        case "n": v = "\n"; break;
        case "P": v = c.parents.join(" "); break;
        case "p": v = c.parents.map(VG.short).join(" "); break;
        case "b": v = c.msg.split("\n").slice(2).join("\n"); break;
        default: v = "%";
      }
      segs.push([cls, v]);
    }
    if (lastI < fmt.length) { segs.push([cls, fmt.slice(lastI)]); }
    var rows = [[]];
    segs.forEach(function (s) {
      String(s[1]).split("\n").forEach(function (pt, i) {
        if (i) { rows.push([]); }
        if (pt) { rows[rows.length - 1].push([s[0], pt]); }
      });
    });
    return rows;
  }

  /* Filas de texto de un commit según el formato elegido */
  var commitRows = VG.commitRows = function (c, o, refs) {
    var rows;
    var deco = o.noDeco ? [] : VG.decoSegs(c.hash, refs);
    if (o.oneline) {
      rows = [[["y", o.fullHash ? c.hash : VG.short(c.hash)]].concat(deco, [["", " " + firstLine(c.msg)]])];
    } else if (o.pretty) {
      rows = fmtPretty(o.pretty, c, refs);
    } else {
      rows = [[["y", "commit " + c.hash]].concat(deco)];
      if (c.parents.length > 1) { rows.push([["", "Merge: " + c.parents.map(VG.short).join(" ")]]); }
      rows.push([["", "Author: " + VG.sig(c.author)]]);
      rows.push([["", "Date:   " + VG.fmtGitDate(c.date)]]);
      rows.push([["", ""]]);
      c.msg.split("\n").forEach(function (l) { rows.push([["", "    " + l]]); });
    }
    if (o.stat || o.patch || o.nameOnly) {
      var before = VG.treeOf(c.parents[0]) || {};
      var extra = term.collect(function () {
        if (c.parents.length > 1) { return; }
        if (!o.oneline && !o.pretty) { pre(""); }
        if (o.nameOnly) { VG.treeChanges(before, c.tree).forEach(function (ch) { pre(ch.path); }); }
        if (o.stat) { VG.printStat(VG.treeChanges(before, c.tree)); }
        if (o.patch) { if (o.stat) { pre(""); } VG.printTreeDiff(before, c.tree, o.paths); }
      });
      extra.forEach(function (r) { rows.push(r.segs); });
    }
    return rows;
  };

  var splitRevsAndPaths = VG.splitRevsAndPaths = function (list, dd) {
    var revs = [], paths = (dd || []).map(VG.normPath);
    for (var i = 0; i < list.length; i++) {
      var a = list[i];
      var ranged = /\.\./.test(a) ? a.split(/\.\.\.?/) : null;
      var isRev = ranged ? ranged.every(function (x) { return x === "" || VG.resolveRev(x); })
        : a.charAt(0) === "^" ? !!VG.resolveRev(a.slice(1)) : !!VG.resolveRev(a);
      if (isRev) { revs.push(a); continue; }
      var p = VG.normPath(a);
      var inAnyTree = has(state.work, p) || has(state.git.index, p) ||
        Object.keys(state.commits).some(function (h) { return has(state.commits[h].tree, p); });
      if (inAnyTree && !dd) { paths.push(p); continue; }
      VG.badRev(a);
      term.status.code = 128;
      return null;
    }
    return { revs: revs, paths: paths };
  };

  /* ---------------- git log ---------------- */
  GIT.log = function (args) {
    var o = parseArgs(args, {
      short: { n: "=n", p: "patch", u: "patch" },
      long: { oneline: "oneline", graph: "graph", all: "all", decorate: "decorate", "no-decorate": "noDeco", stat: "stat", patch: "patch",
        "max-count": "=n", author: "=author", grep: "=grep", pretty: "=pretty", format: "=format", reverse: "reverse",
        "first-parent": "firstParent", "abbrev-commit": "abbrev", "name-only": "nameOnly", merges: "merges", "no-merges": "noMerges",
        "date-order": "x", "topo-order": "x", follow: "x", color: "x", "no-color": "x" },
      numeric: true
    });
    if (o.bad || o.missing) { optError(o, "log"); return; }
    var sp = splitRevsAndPaths(o._, o.__);
    if (!sp) { return; }
    var include = [], exclude = [], g = state.git;
    sp.revs.forEach(function (r) {
      if (/\.\./.test(r)) {
        var ab = r.split(/\.\.\.?/);
        exclude.push(VG.resolveRev(ab[0] || "HEAD"));
        include.push(VG.resolveRev(ab[1] || "HEAD"));
      } else if (r.charAt(0) === "^") { exclude.push(VG.resolveRev(r.slice(1))); }
      else { include.push(VG.resolveRev(r)); }
    });
    if (o.all) {
      Object.keys(g.branches).forEach(function (b) { include.push(g.branches[b]); });
      Object.keys(g.tags).forEach(function (t) { include.push(g.tags[t].target); });
      Object.keys(g.remoteRefs).forEach(function (r) { Object.keys(g.remoteRefs[r]).forEach(function (b) { include.push(g.remoteRefs[r][b]); }); });
      if (VG.headHash()) { include.push(VG.headHash()); }
    }
    if (!sp.revs.some(function (r) { return r.charAt(0) !== "^"; }) && !o.all) {
      if (!VG.headHash()) { fail("fatal: tu rama actual '" + VG.headBranch() + "' no tiene ningún commit todavía"); term.status.code = 128; return; }
      include.push(VG.headHash());
    }
    var list;
    if (o.firstParent) {
      list = [];
      var h = include[0], ex = {};
      exclude.forEach(function (x) { var a = VG.ancestors(x); for (var k in a) { ex[k] = true; } });
      while (h && !ex[h]) { list.push(state.commits[h]); h = state.commits[h].parents[0]; }
    } else {
      list = VG.walk(include.filter(Boolean), exclude.filter(Boolean));
    }
    if (o.author) { var ra = new RegExp(util.escRe(last(o.author)), "i"); list = list.filter(function (c) { return ra.test(VG.sig(c.author)); }); }
    if (o.grep) { var rg = new RegExp(util.escRe(last(o.grep)), "i"); list = list.filter(function (c) { return rg.test(c.msg); }); }
    if (o.merges) { list = list.filter(function (c) { return c.parents.length > 1; }); }
    if (o.noMerges) { list = list.filter(function (c) { return c.parents.length < 2; }); }
    if (sp.paths.length) {
      list = list.filter(function (c) {
        var before = VG.treeOf(c.parents[0]) || {};
        return sp.paths.some(function (p) { return before[p] !== c.tree[p]; });
      });
    }
    if (o.n) { list = list.slice(0, parseInt(last(o.n), 10) || 0); }
    if (o.reverse) { list.reverse(); }
    var fmt = o.format ? last(o.format) : o.pretty ? last(o.pretty) : null;
    var opts = {
      oneline: !!o.oneline || fmt === "oneline", fullHash: fmt === "oneline" && !o.abbrev, noDeco: !!o.noDeco,
      pretty: fmt && fmt !== "oneline" && fmt !== "medium" ? fmt.replace(/^(format|tformat):/, "") : null,
      stat: !!o.stat, patch: !!o.patch, nameOnly: !!o.nameOnly, paths: sp.paths.length ? sp.paths : null
    };
    if (opts.pretty === "short" || opts.pretty === "full") { opts.pretty = null; }
    var refs = VG.refsByCommit();
    var multi = !opts.oneline && !opts.pretty;
    var items = list.map(function (c, i) {
      var rows = commitRows(c, opts, refs);
      if (multi && i < list.length - 1) { rows.push([["", ""]]); }
      return { commit: c, rows: rows };
    });
    if (o.graph) { renderGraph(items); }
    else { items.forEach(function (it) { it.rows.forEach(function (r) { rich(r); }); }); }
    VG.emit({ type: "log", graph: !!o.graph, all: !!o.all, oneline: !!o.oneline });
  };

  /* ---------------- git diff ---------------- */
  function printCombinedDiff(p) {
    var u = state.git.unmerged[p];
    var lines = linesOf(state.work[p]);
    rich([["b", "diff --cc " + p]]);
    rich([["b", "index " + VG.blobId(u.ours || "") + "," + VG.blobId(u.theirs || "") + "..0000000"]]);
    rich([["b", "--- a/" + p]]);
    rich([["b", "+++ b/" + p]]);
    rich([["c", "@@@ -1," + linesOf(u.ours).length + " -1," + linesOf(u.theirs).length + " +1," + lines.length + " @@@"]]);
    var zone = 0;
    lines.forEach(function (l) {
      if (/^<{7}/.test(l)) { rich([["g", "++" + l]]); zone = 1; }
      else if (/^={7}$/.test(l)) { rich([["g", "++" + l]]); zone = 2; }
      else if (/^>{7}/.test(l)) { rich([["g", "++" + l]]); zone = 0; }
      else if (zone === 1) { rich([["g", " +" + l]]); }
      else if (zone === 2) { rich([["g", "+ " + l]]); }
      else { rich([["", "  " + l]]); }
    });
  }

  GIT.diff = function (args) {
    var o = parseArgs(args, { short: {}, long: { staged: "staged", cached: "staged", stat: "stat", "name-only": "nameOnly",
      "name-status": "nameStatus", color: "x", "no-color": "x", "word-diff": "x", "ignore-all-space": "x" } });
    if (o.bad || o.missing) { optError(o, "diff"); return; }
    var sp = splitRevsAndPaths(o._, o.__);
    if (!sp) { return; }
    var g = state.git, work = state.work, revs = sp.revs;
    if (revs.length === 1 && /\.\./.test(revs[0])) { var ab = revs[0].split(/\.\.\.?/); revs = [ab[0] || "HEAD", ab[1] || "HEAD"]; }
    var a, b, unmergedShown = [];
    function tracked(from) {
      var t = {};
      unionKeys(from, g.index).forEach(function (p) { if (has(work, p) && !has(g.unmerged, p)) { t[p] = work[p]; } });
      return t;
    }
    if (o.staged) {
      a = revs[0] ? VG.treeOf(VG.resolveRev(revs[0])) : (VG.headTree() || {});
      b = {};
      Object.keys(g.index).forEach(function (p) { if (!has(g.unmerged, p)) { b[p] = g.index[p]; } });
      Object.keys(g.unmerged).forEach(function (p) { if (has(a, p)) { b[p] = a[p]; } });
    } else if (!revs.length) {
      a = {};
      Object.keys(g.index).forEach(function (p) { if (!has(g.unmerged, p)) { a[p] = g.index[p]; } });
      b = tracked({});
      unmergedShown = util.sortedKeys(g.unmerged).filter(function (p) {
        return has(work, p) && (!sp.paths.length || sp.paths.indexOf(p) !== -1);
      });
    } else if (revs.length === 1) {
      a = VG.treeOf(VG.resolveRev(revs[0]));
      b = tracked(a);
    } else {
      a = VG.treeOf(VG.resolveRev(revs[0]));
      b = VG.treeOf(VG.resolveRev(revs[1]));
    }
    var paths = sp.paths.length ? sp.paths : null;
    var shown = [];
    if (o.stat || o.nameOnly || o.nameStatus) {
      var ch = VG.treeChanges(a, b).filter(function (c) { return !paths || paths.indexOf(c.path) !== -1; });
      shown = ch.map(function (c) { return c.path; });
      if (o.stat) { if (ch.length) { VG.printStat(ch); } }
      else if (o.nameOnly) { ch.forEach(function (c) { pre(c.path); }); }
      else { ch.forEach(function (c) { pre((c.created ? "A" : c.deleted ? "D" : c.renamedFrom ? "R100" : "M") + "\t" + (c.renamedFrom ? c.renamedFrom + "\t" : "") + c.path); }); }
    } else {
      unmergedShown.forEach(printCombinedDiff);
      shown = VG.printTreeDiff(a, b, paths);
    }
    if (o.staged) { state.flags.reviewed = true; }
    VG.emit({ type: "diff", staged: !!o.staged, revs: revs.length, files: shown.concat(unmergedShown) });
  };

  /* ---------------- git show ---------------- */
  GIT.show = function (args) {
    var o = parseArgs(args, { short: { s: "noPatch" }, long: { stat: "stat", oneline: "oneline", "name-only": "nameOnly",
      pretty: "=pretty", format: "=format", "no-patch": "noPatch", color: "x" } });
    if (o.bad || o.missing) { optError(o, "show"); return; }
    var g = state.git, specs = o._.length ? o._ : ["HEAD"], refs = VG.refsByCommit();
    for (var i = 0; i < specs.length; i++) {
      var spec = specs[i];
      var m = /^([^:]*):(.+)$/.exec(spec);
      if (m) {
        var p = VG.normPath(m[2]), t;
        if (m[1] === "") { t = g.index; }
        else {
          var hh = VG.resolveRev(m[1]);
          if (!hh) { VG.badRev(m[1]); term.status.code = 128; return; }
          t = VG.treeOf(hh);
        }
        if (!has(t, p)) { fail("fatal: la ruta '" + p + "' no existe en '" + (m[1] || "el índice") + "'"); term.status.code = 128; return; }
        pre(t[p].replace(/\n$/, ""));
        continue;
      }
      var h = VG.resolveRev(spec);
      if (!h) {
        if (!VG.headHash() && (spec === "HEAD" || spec === "@")) { fail("fatal: tu rama actual '" + VG.headBranch() + "' no tiene ningún commit todavía"); }
        else { VG.badRev(spec); }
        term.status.code = 128;
        return;
      }
      if (has(g.tags, spec) && g.tags[spec].annotated) {
        var tg = g.tags[spec];
        rich([["y", "tag " + spec]]);
        pre("Tagger: " + VG.sig(tg.tagger));
        pre("Date:   " + VG.fmtGitDate(tg.date));
        pre("");
        pre(tg.message);
        pre("");
      }
      var c = state.commits[h];
      var fmt = o.format ? last(o.format) : o.pretty ? last(o.pretty) : null;
      commitRows(c, { oneline: !!o.oneline || fmt === "oneline", pretty: fmt && fmt !== "oneline" ? fmt.replace(/^(format|tformat):/, "") : null }, refs)
        .forEach(function (r) { rich(r); });
      if (!o.noPatch && c.parents.length < 2) {
        var before = VG.treeOf(c.parents[0]) || {};
        if (!o.oneline && !fmt) { pre(""); }
        if (o.stat) { VG.printStat(VG.treeChanges(before, c.tree)); }
        else if (o.nameOnly) { VG.treeChanges(before, c.tree).forEach(function (x) { pre(x.path); }); }
        else { VG.printTreeDiff(before, c.tree); }
      }
    }
    VG.emit({ type: "show" });
  };
})(this);
