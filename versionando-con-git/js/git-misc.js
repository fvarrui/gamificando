/* ==========================================================
   Utilidades de git para explorar el repositorio:
   reflog · blame · clean · ls-files · check-ignore ·
   cat-file · rev-parse · help
   ========================================================== */
(function (global) {
  "use strict";
  var RG = global.RG, VG = global.VG, util = RG.util, cfg = VG.cfg;
  var state = VG.state, term = VG.term, GIT = VG.GIT;
  var has = util.has, sortedKeys = util.sortedKeys, pad = util.pad, lpad = util.lpad, linesOf = util.linesOf;
  var parseArgs = RG.parseArgs, last = RG.lastOf;
  var pre = term.pre, rich = term.rich, note = term.note, fail = term.fail;
  var optError = VG.optError;

  GIT.reflog = function (args) {
    var o = parseArgs(args, { short: { n: "=n" }, long: { all: "all", "max-count": "=n" }, numeric: true });
    if (o.bad || o.missing) { optError(o, "reflog"); return; }
    var g = state.git, refs = VG.refsByCommit();
    var list = g.reflog.slice().reverse();
    if (o.n) { list = list.slice(0, parseInt(last(o.n), 10) || 0); }
    list.forEach(function (e, i) {
      rich([["y", VG.short(e.hash)]].concat(VG.decoSegs(e.hash, refs), [["", " HEAD@{" + i + "}: " + e.msg]]));
    });
    state.flags.usedReflog = true;
    VG.emit({ type: "reflog" });
  };

  GIT.blame = function (args) {
    var o = parseArgs(args, { short: {}, long: {} });
    var p = VG.normPath(o._[0] || "");
    if (!p) { note("uso: git blame <archivo>"); term.status.code = 129; return; }
    var head = VG.headTree() || {};
    if (!has(head, p)) { fail("fatal: no hay tal ruta " + p + " en HEAD"); term.status.code = 128; return; }
    var lines = linesOf(head[p]);
    // Atribución: el commit más antiguo (por primer padre) que ya contenía la línea
    var hist = VG.walk([VG.headHash()], []).filter(function (c) { return c.parents.length < 2; });
    lines.forEach(function (l, i) {
      var owner = VG.headHash();
      for (var k = 0; k < hist.length; k++) {
        var t = hist[k].tree[p];
        if (t !== undefined && linesOf(t).indexOf(l) !== -1) { owner = hist[k].hash; }
      }
      var c = state.commits[owner];
      rich([["y", VG.short(owner) + " "], ["", "(" + pad(c.author.name, 14) + " " + VG.fmtIsoDate(c.date) + " " + lpad(i + 1, 2) + ") " + l]]);
    });
    VG.emit({ type: "blame" });
  };

  GIT.clean = function (args) {
    var o = parseArgs(args, { short: { n: "dry", f: "force", d: "dirs", x: "all", i: "interactive", q: "quiet" },
      long: { "dry-run": "dry", force: "force", "no-ignored": "x" } });
    if (o.bad || o.missing) { optError(o, "clean"); return; }
    if (!o.dry && !o.force) {
      fail("fatal: clean.requireForce por defecto en true y ninguno de -i, -n, ni -f entregado; rehusando el clean");
      term.status.code = 128;
      return;
    }
    var st = VG.computeStatus();
    var targets = st.untracked.concat(o.all ? st.ignored : []);
    targets.sort().forEach(function (p) {
      pre((o.dry ? "Será borrado " : "Borrando ") + p);
      if (!o.dry) { delete state.work[p]; }
    });
    VG.emit({ type: "clean", paths: targets });
  };

  GIT["ls-files"] = function (args) {
    var o = parseArgs(args, { short: { s: "stage", m: "modified", o: "others" }, long: { stage: "stage", modified: "modified", others: "others" } });
    if (o.bad || o.missing) { optError(o, "ls-files"); return; }
    var g = state.git;
    if (o.others) { VG.computeStatus().untracked.forEach(function (p) { pre(p); }); return; }
    sortedKeys(g.index).forEach(function (p) {
      if (o.modified && state.work[p] === g.index[p]) { return; }
      pre(o.stage ? "100644 " + VG.sha("blob " + g.index[p]) + " 0\t" + p : p);
    });
  };

  GIT["check-ignore"] = function (args) {
    var o = parseArgs(args, { short: { v: "verbose", q: "quiet" }, long: { verbose: "verbose", quiet: "quiet" } });
    if (o.bad || o.missing) { optError(o, "check-ignore"); return; }
    if (!o._.length) { note("uso: git check-ignore [<opciones>] <ruta>..."); term.status.code = 129; return; }
    var any = false;
    o._.forEach(function (p) {
      var r = VG.ignoreMatch(VG.normPath(p));
      if (r && !r.neg) {
        any = true;
        if (!o.quiet) { pre(o.verbose ? ".gitignore:" + r.line + ":" + r.src + "\t" + VG.normPath(p) : VG.normPath(p)); }
      }
    });
    if (!any) { term.status.code = 1; }
  };

  GIT["cat-file"] = function (args) {
    var o = parseArgs(args, { short: { p: "pretty", t: "type", s: "size" }, long: {} });
    if (o.bad || o.missing) { optError(o, "cat-file"); return; }
    var h = VG.resolveRev(o._[0]);
    if (!h) { fail("fatal: Not a valid object name " + o._[0]); term.status.code = 128; return; }
    var c = state.commits[h];
    if (o.type) { pre("commit"); return; }
    if (o.size) { pre(String(JSON.stringify(c).length)); return; }
    pre("tree " + VG.sha("tree " + JSON.stringify(sortedKeys(c.tree))) + "\n" +
      c.parents.map(function (p) { return "parent " + p; }).join("\n") + (c.parents.length ? "\n" : "") +
      "author " + VG.sig(c.author) + " " + Math.floor(c.date / 1000) + " " + cfg.TZ + "\n" +
      "committer " + VG.sig(c.author) + " " + Math.floor(c.date / 1000) + " " + cfg.TZ + "\n\n" + c.msg);
  };

  GIT["rev-parse"] = function (args) {
    var o = parseArgs(args, { short: {}, long: { short: "short", "abbrev-ref": "abbrevRef", "show-toplevel": "toplevel",
      "git-dir": "gitDir", "is-inside-work-tree": "inside" } });
    if (o.bad || o.missing) { optError(o, "rev-parse"); return; }
    if (o.toplevel) { pre(cfg.REPO_DIR); return; }
    if (o.gitDir) { pre(".git"); return; }
    if (o.inside) { pre("true"); return; }
    (o._.length ? o._ : ["HEAD"]).forEach(function (spec) {
      if (o.abbrevRef) {
        pre(spec === "HEAD" || spec === "@" ? (VG.headBranch() || "HEAD") : spec);
        return;
      }
      var h = VG.resolveRev(spec);
      if (!h) {
        fail(spec);
        fail("fatal: argumento ambiguo '" + spec + "': revisión desconocida o ruta fuera del árbol de trabajo.");
        term.status.code = 128;
        return;
      }
      pre(o.short ? VG.short(h) : h);
    });
  };

  GIT.help = function (args) { VG.gitHelp(args[0]); };
})(this);
