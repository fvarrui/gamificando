/* ==========================================================
   Núcleo de Git: objetos, referencias, .gitignore, estado,
   diferencias (LCS) y fusión a tres bandas (diff3).
   ========================================================== */
(function (global) {
  "use strict";
  var RG = global.RG, VG = global.VG, util = RG.util, cfg = VG.cfg;
  var state = VG.state, term = VG.term;
  var has = util.has, copy = util.copy, sortedKeys = util.sortedKeys, unionKeys = util.unionKeys;
  var pad = util.pad, lpad = util.lpad, plural = util.plural, linesOf = util.linesOf, firstLine = util.firstLine;

  /* ---------------- Hashes ---------------- */
  function h32(str, seed) {
    var h = (0x811c9dc5 ^ Math.imul(seed, 0x9e3779b1)) >>> 0;
    for (var i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    h ^= h >>> 13; h = Math.imul(h, 0x5bd1e995); h ^= h >>> 15;
    return ("0000000" + (h >>> 0).toString(16)).slice(-8);
  }
  var sha = VG.sha = function (str) { return h32(str, 1) + h32(str, 2) + h32(str, 3) + h32(str, 4) + h32(str, 5); };
  var blobId = VG.blobId = function (content) { return sha("blob " + content).slice(0, 7); };
  var short = VG.short = function (h) { return h ? h.slice(0, 7) : "0000000"; };

  VG.newRepo = function (branch) {
    return {
      HEAD: { branch: branch }, branches: {}, tags: {}, index: {}, unmerged: {}, config: {},
      remotes: {}, remoteRefs: {}, upstream: {}, stash: [], reflog: [],
      origHead: null, fetchHead: null, op: null, prevBranch: null
    };
  };

  /* ---------------- Configuración ---------------- */
  var cfgGet = VG.cfgGet = function (key) {
    key = String(key).toLowerCase();
    if (state.git && has(state.git.config, key)) { return state.git.config[key]; }
    return has(state.global, key) ? state.global[key] : null;
  };
  var identity = VG.identity = function () { return { name: cfgGet("user.name"), email: cfgGet("user.email") }; };
  var sig = VG.sig = function (who) { return who.name + " <" + who.email + ">"; };

  VG.configEntries = function (scope) {
    var list = [];
    if (scope === "global") {
      sortedKeys(state.global).forEach(function (k) { list.push([k, state.global[k]]); });
      return list;
    }
    var g = state.git;
    if (!g) { return list; }
    Object.keys(g.config).forEach(function (k) { list.push([k, g.config[k]]); });
    sortedKeys(g.remotes).forEach(function (r) {
      list.push(["remote." + r + ".url", g.remotes[r].url]);
      list.push(["remote." + r + ".fetch", "+refs/heads/*:refs/remotes/" + r + "/*"]);
    });
    sortedKeys(g.upstream).forEach(function (b) {
      list.push(["branch." + b + ".remote", g.upstream[b].remote]);
      list.push(["branch." + b + ".merge", "refs/heads/" + g.upstream[b].branch]);
    });
    return list;
  };
  VG.iniRender = function (entries) {
    var sections = {}, order = [];
    entries.forEach(function (e) {
      var parts = e[0].split(".");
      var key = parts.pop();
      var sec = parts.length > 1 ? parts[0] + " \"" + parts.slice(1).join(".") + "\"" : parts[0];
      if (!sections[sec]) { sections[sec] = []; order.push(sec); }
      sections[sec].push([key, e[1]]);
    });
    return order.map(function (s) {
      return "[" + s + "]\n" + sections[s].map(function (kv) {
        return "\t" + kv[0] + " = " + (/[\s#;]/.test(kv[1]) ? "\"" + String(kv[1]).replace(/"/g, "\\\"") + "\"" : kv[1]);
      }).join("\n");
    }).join("\n") + (order.length ? "\n" : "");
  };
  VG.iniParse = function (text) {
    var cfgOut = {}, sec = null;
    linesOf(text).forEach(function (raw) {
      var l = raw.trim();
      if (!l || l.charAt(0) === "#" || l.charAt(0) === ";") { return; }
      var m = /^\[\s*([A-Za-z0-9.-]+)(?:\s+"(.*)")?\s*\]$/.exec(l);
      if (m) { sec = m[1].toLowerCase() + (m[2] !== undefined ? "." + m[2] : ""); return; }
      m = /^([A-Za-z][A-Za-z0-9-]*)\s*(?:=\s*(.*))?$/.exec(l);
      if (m && sec) {
        var v = m[2] === undefined ? "true" : m[2].replace(/\s+[#;].*$/, "");
        if (/^".*"$/.test(v)) { v = v.slice(1, -1).replace(/\\"/g, "\""); }
        cfgOut[(sec + "." + m[1]).toLowerCase()] = v;
      }
    });
    return cfgOut;
  };
  VG.applyLocalConfig = function (conf) {
    var g = state.git;
    g.config = {};
    g.remotes = {};
    g.upstream = {};
    Object.keys(conf).forEach(function (k) {
      var m = /^remote\.(.+)\.(url|fetch)$/.exec(k);
      if (m) {
        if (m[2] === "url") { g.remotes[m[1]] = { url: conf[k] }; g.remoteRefs[m[1]] = g.remoteRefs[m[1]] || {}; }
        return;
      }
      m = /^branch\.(.+)\.(remote|merge)$/.exec(k);
      if (m) {
        g.upstream[m[1]] = g.upstream[m[1]] || { remote: "origin", branch: m[1] };
        if (m[2] === "remote") { g.upstream[m[1]].remote = conf[k]; }
        else { g.upstream[m[1]].branch = conf[k].replace(/^refs\/heads\//, ""); }
        return;
      }
      g.config[k] = conf[k];
    });
  };

  /* ---------------- Commits y referencias ---------------- */
  VG.makeCommit = function (tree, parents, msg, author) {
    state.seq++;
    var who = author || identity();
    var ts = VG.fakeNow().getTime();
    var body = JSON.stringify([sortedKeys(tree).map(function (k) { return [k, tree[k]]; }), parents, msg, who.name, who.email, ts, state.seq]);
    var hash = sha("commit " + body);
    state.commits[hash] = {
      hash: hash, tree: copy(tree), parents: parents.slice(), msg: msg,
      author: { name: who.name, email: who.email }, date: ts, seq: state.seq
    };
    return hash;
  };

  var headHash = VG.headHash = function () {
    var g = state.git;
    if (!g) { return null; }
    return g.HEAD.detached || g.branches[g.HEAD.branch] || null;
  };
  var headBranch = VG.headBranch = function () { return state.git && state.git.HEAD.branch ? state.git.HEAD.branch : null; };
  var branchTip = VG.branchTip = function (name) { return state.git && has(state.git.branches, name) ? state.git.branches[name] : null; };
  var remoteRef = VG.remoteRef = function (remote, branch) {
    var r = state.git && state.git.remoteRefs[remote];
    return r && has(r, branch) ? r[branch] : null;
  };
  var treeOf = VG.treeOf = function (hash) { return hash && state.commits[hash] ? state.commits[hash].tree : null; };
  var headTree = VG.headTree = function () { return treeOf(headHash()); };
  var commitMsg = VG.commitMsg = function (hash) { return hash && state.commits[hash] ? state.commits[hash].msg : ""; };

  VG.setHead = function (hash, reflogMsg) {
    var g = state.git;
    if (g.HEAD.branch) { g.branches[g.HEAD.branch] = hash; } else { g.HEAD.detached = hash; }
    g.reflog.push({ hash: hash, msg: reflogMsg });
  };
  VG.attachHead = function (branch, reflogMsg) {
    var g = state.git;
    var from = g.HEAD.branch || short(g.HEAD.detached);
    if (g.HEAD.branch && g.HEAD.branch !== branch) { g.prevBranch = g.HEAD.branch; }
    g.HEAD = { branch: branch };
    g.reflog.push({ hash: g.branches[branch], msg: reflogMsg || "checkout: moving from " + from + " to " + branch });
  };
  VG.detachHead = function (hash, reflogMsg) {
    var g = state.git;
    if (g.HEAD.branch) { g.prevBranch = g.HEAD.branch; }
    var from = g.HEAD.branch || short(g.HEAD.detached);
    g.HEAD = { detached: hash };
    g.reflog.push({ hash: hash, msg: reflogMsg || "checkout: moving from " + from + " to " + short(hash) });
  };

  var ancestors = VG.ancestors = function (hash) {
    var seen = {}, stack = hash ? [hash] : [];
    while (stack.length) {
      var h = stack.pop();
      if (seen[h] || !state.commits[h]) { continue; }
      seen[h] = true;
      Array.prototype.push.apply(stack, state.commits[h].parents);
    }
    return seen;
  };
  var isAncestor = VG.isAncestor = function (a, b) { return !!a && !!b && !!ancestors(b)[a]; };
  VG.mergeBase = function (a, b) {
    var A = ancestors(a), B = ancestors(b), best = null;
    Object.keys(A).forEach(function (h) {
      if (B[h] && (!best || state.commits[h].seq > state.commits[best].seq)) { best = h; }
    });
    return best;
  };
  var aheadBehind = VG.aheadBehind = function (a, b) {
    var A = ancestors(a), B = ancestors(b), ahead = 0, behind = 0;
    Object.keys(A).forEach(function (h) { if (!B[h]) { ahead++; } });
    Object.keys(B).forEach(function (h) { if (!A[h]) { behind++; } });
    return { ahead: ahead, behind: behind };
  };
  /* Commits alcanzables desde varias puntas, del más nuevo al más viejo */
  VG.walk = function (tips, exclude) {
    var seen = {};
    tips.forEach(function (t) { var a = ancestors(t); for (var h in a) { seen[h] = true; } });
    var ex = {};
    (exclude || []).forEach(function (t) { var a = ancestors(t); for (var h in a) { ex[h] = true; } });
    return Object.keys(seen).filter(function (h) { return !ex[h]; })
      .map(function (h) { return state.commits[h]; })
      .sort(function (x, y) { return y.seq - x.seq; });
  };

  /* ---------------- Revisiones: HEAD~2, origin/main, HEAD@{1}, @{u}… ---------------- */
  var resolveBase = VG.resolveBase = function (b) {
    var g = state.git;
    if (b === "HEAD" || b === "@" || b === "") { return headHash(); }
    if (b === "ORIG_HEAD") { return g.origHead; }
    if (b === "MERGE_HEAD") { return g.op && g.op.type === "merge" ? g.op.theirs : null; }
    if (b === "FETCH_HEAD") { return g.fetchHead; }
    var m = /^(?:HEAD)?@\{(\d+)\}$/.exec(b);
    if (m) { var e = g.reflog[g.reflog.length - 1 - parseInt(m[1], 10)]; return e ? e.hash : null; }
    m = /^(.*)@\{(?:u|upstream)\}$/.exec(b);
    if (m) {
      var up = g.upstream[m[1] || headBranch()];
      return up ? remoteRef(up.remote, up.branch) : null;
    }
    b = b.replace(/^refs\/heads\//, "").replace(/^refs\/tags\//, "").replace(/^refs\/remotes\//, "").replace(/^remotes\//, "");
    if (has(g.branches, b)) { return g.branches[b]; }
    var slash = b.indexOf("/");
    if (slash > 0 && has(g.remoteRefs, b.slice(0, slash)) && has(g.remoteRefs[b.slice(0, slash)], b.slice(slash + 1))) {
      return g.remoteRefs[b.slice(0, slash)][b.slice(slash + 1)];
    }
    if (has(g.tags, b)) { return g.tags[b].target; }
    if (/^[0-9a-f]{4,40}$/.test(b)) {
      var found = Object.keys(state.commits).filter(function (h) { return h.indexOf(b) === 0; });
      if (found.length === 1) { return found[0]; }
    }
    return null;
  };
  VG.resolveRev = function (spec) {
    if (!state.git || spec === undefined || spec === null) { return null; }
    var m = /^(.*?)((?:[~^]\d*)*)$/.exec(String(spec));
    var h = resolveBase(m[1]);
    var suf = m[2].match(/[~^]\d*/g) || [];
    for (var i = 0; i < suf.length && h; i++) {
      var op = suf[i].charAt(0);
      var n = suf[i].length > 1 ? parseInt(suf[i].slice(1), 10) : 1;
      var c = state.commits[h];
      if (op === "~") {
        for (var k = 0; k < n && h; k++) { h = state.commits[h].parents[0] || null; }
      } else if (n !== 0) {
        h = c.parents[n - 1] || null;
      }
    }
    return h || null;
  };
  VG.badRev = function (spec) {
    term.fail("fatal: argumento ambiguo '" + spec + "': revisión desconocida o ruta fuera del árbol de trabajo.\n" +
      "Usa '--' para separar las rutas de las revisiones, de esta manera:\n'git <comando> [<revisión>...] -- [<archivo>...]'");
  };

  /* ---------------- Decoradores (ramas y etiquetas de cada commit) ---------------- */
  var refsByCommit = VG.refsByCommit = function () {
    var g = state.git, map = {};
    function add(h, r) { if (!h) { return; } (map[h] = map[h] || []).push(r); }
    if (!g) { return map; }
    if (g.HEAD.detached) { add(g.HEAD.detached, { t: "head", name: "HEAD" }); }
    sortedKeys(g.branches).forEach(function (b) { add(g.branches[b], { t: g.HEAD.branch === b ? "headbranch" : "branch", name: b }); });
    sortedKeys(g.tags).forEach(function (t) { add(g.tags[t].target, { t: "tag", name: t }); });
    sortedKeys(g.remoteRefs).forEach(function (r) {
      sortedKeys(g.remoteRefs[r]).forEach(function (b) { add(g.remoteRefs[r][b], { t: "remote", name: r + "/" + b }); });
    });
    var order = { head: 0, headbranch: 0, tag: 1, remote: 2, branch: 3 };
    Object.keys(map).forEach(function (h) { map[h].sort(function (a, b) { return order[a.t] - order[b.t]; }); });
    return map;
  };
  VG.decoSegs = function (hash, refs) {
    var list = (refs || refsByCommit())[hash];
    if (!list || !list.length) { return []; }
    var segs = [["y", " ("]];
    list.forEach(function (r, i) {
      if (i) { segs.push(["y", ", "]); }
      if (r.t === "head") { segs.push(["cb", "HEAD"]); }
      else if (r.t === "headbranch") { segs.push(["cb", "HEAD -> "]); segs.push(["gb", r.name]); }
      else if (r.t === "branch") { segs.push(["gb", r.name]); }
      else if (r.t === "remote") { segs.push(["rb", r.name]); }
      else { segs.push(["yb", "tag: " + r.name]); }
    });
    segs.push(["y", ")"]);
    return segs;
  };

  /* ---------------- .gitignore ---------------- */
  VG.ignoreRules = function () {
    var src = state.work[".gitignore"], rules = [];
    linesOf(src).forEach(function (raw, i) {
      var l = raw.replace(/\s+$/, "");
      if (!l || l.charAt(0) === "#") { return; }
      var neg = l.charAt(0) === "!";
      if (neg) { l = l.slice(1); }
      var dirOnly = /\/$/.test(l);
      l = l.replace(/^\//, "").replace(/\/$/, "");
      rules.push({ re: util.globToRe(l), neg: neg, dirOnly: dirOnly, src: raw, line: i + 1 });
    });
    return rules;
  };
  var ignoreMatch = VG.ignoreMatch = function (path) {
    var hit = null;
    VG.ignoreRules().forEach(function (r) { if (!r.dirOnly && r.re.test(path)) { hit = r; } });
    return hit;
  };
  VG.isIgnored = function (path) { var r = ignoreMatch(path); return !!r && !r.neg; };

  /* ---------------- Estado del repositorio ---------------- */
  VG.computeStatus = function () {
    var g = state.git, head = headTree() || {}, idx = g.index, work = state.work;
    var st = { staged: [], unstaged: [], untracked: [], ignored: [], unmerged: sortedKeys(g.unmerged), clean: false };
    var added = [], deleted = [], all = {};
    Object.keys(head).forEach(function (p) { all[p] = true; });
    Object.keys(idx).forEach(function (p) { all[p] = true; });
    Object.keys(all).sort().forEach(function (p) {
      if (has(g.unmerged, p)) { return; }
      if (!has(head, p) && has(idx, p)) { added.push(p); }
      else if (has(head, p) && !has(idx, p)) { deleted.push(p); }
      else if (head[p] !== idx[p]) { st.staged.push({ type: "mod", path: p }); }
    });
    deleted.forEach(function (d) {
      for (var i = 0; i < added.length; i++) {
        if (idx[added[i]] === head[d]) {
          st.staged.push({ type: "ren", path: added[i], from: d });
          added.splice(i, 1);
          return;
        }
      }
      st.staged.push({ type: "del", path: d });
    });
    added.forEach(function (a) { st.staged.push({ type: "new", path: a }); });
    st.staged.sort(function (x, y) { return x.path < y.path ? -1 : 1; });
    sortedKeys(idx).forEach(function (p) {
      if (has(g.unmerged, p)) { return; }
      if (!has(work, p)) { st.unstaged.push({ type: "del", path: p }); }
      else if (work[p] !== idx[p]) { st.unstaged.push({ type: "mod", path: p }); }
    });
    sortedKeys(work).forEach(function (p) {
      if (has(idx, p) || has(g.unmerged, p)) { return; }
      if (VG.isIgnored(p)) { st.ignored.push(p); } else { st.untracked.push(p); }
    });
    st.clean = !st.staged.length && !st.unstaged.length && !st.untracked.length && !st.unmerged.length;
    return st;
  };
  VG.dirtyPaths = function () {
    var head = headTree() || {}, idx = state.git.index, work = state.work, d = {};
    Object.keys(idx).forEach(function (p) { if (idx[p] !== head[p] || work[p] !== idx[p]) { d[p] = true; } });
    Object.keys(head).forEach(function (p) { if (!has(idx, p)) { d[p] = true; } });
    return d;
  };
  VG.sameTree = function (a, b) {
    var ka = Object.keys(a), kb = Object.keys(b);
    if (ka.length !== kb.length) { return false; }
    return ka.every(function (k) { return has(b, k) && a[k] === b[k]; });
  };
  /* Pathspecs: ficheros, «.» o patrones con comodines */
  VG.matchPathspec = function (spec, candidates) {
    spec = VG.normPath(spec);
    if (spec === null) { return []; }
    if (spec === "." || spec === ":/" || spec === "") { return candidates.slice(); }
    if (/[*?[]/.test(spec)) {
      var re = util.globToRe(spec.replace(/\*/g, "**"));
      return candidates.filter(function (p) { return re.test(p); });
    }
    return candidates.filter(function (p) { return p === spec; });
  };

  /* ---------------- Diferencias ---------------- */
  var diffLines = VG.diffLines = function (a, b) {
    var n = a.length, m = b.length, W = m + 1;
    var dp = new Int32Array((n + 1) * W);
    for (var i = n - 1; i >= 0; i--) {
      for (var j = m - 1; j >= 0; j--) {
        dp[i * W + j] = a[i] === b[j] ? dp[(i + 1) * W + j + 1] + 1 : Math.max(dp[(i + 1) * W + j], dp[i * W + j + 1]);
      }
    }
    var ops = [];
    i = 0; j = 0;
    while (i < n || j < m) {
      if (i < n && j < m && a[i] === b[j]) { ops.push({ t: " ", s: a[i], ai: i, bi: j }); i++; j++; }
      else if (j < m && (i >= n || dp[i * W + j + 1] >= dp[(i + 1) * W + j])) { ops.push({ t: "+", s: b[j], bi: j }); j++; }
      else { ops.push({ t: "-", s: a[i], ai: i }); i++; }
    }
    return ops;
  };
  var matchMap = VG.matchMap = function (a, b) {
    var map = {};
    diffLines(a, b).forEach(function (o) { if (o.t === " ") { map[o.ai] = o.bi; } });
    return map;
  };
  function makeHunks(ops, ctx) {
    var changes = [];
    ops.forEach(function (o, k) { if (o.t !== " ") { changes.push(k); } });
    if (!changes.length) { return []; }
    var groups = [], start = Math.max(0, changes[0] - ctx), end = Math.min(ops.length - 1, changes[0] + ctx);
    for (var c = 1; c < changes.length; c++) {
      if (changes[c] - ctx <= end + 1) { end = Math.min(ops.length - 1, changes[c] + ctx); }
      else { groups.push([start, end]); start = Math.max(0, changes[c] - ctx); end = Math.min(ops.length - 1, changes[c] + ctx); }
    }
    groups.push([start, end]);
    var oldNo = [], newNo = [], on = 0, nn = 0;
    ops.forEach(function (o, k) {
      oldNo[k] = on; newNo[k] = nn;
      if (o.t !== "+") { on++; }
      if (o.t !== "-") { nn++; }
    });
    return groups.map(function (gr) {
      var oc = 0, ncount = 0;
      for (var k = gr[0]; k <= gr[1]; k++) {
        if (ops[k].t !== "+") { oc++; }
        if (ops[k].t !== "-") { ncount++; }
      }
      return {
        oldStart: oc ? oldNo[gr[0]] + 1 : oldNo[gr[0]], oldCount: oc,
        newStart: ncount ? newNo[gr[0]] + 1 : newNo[gr[0]], newCount: ncount,
        ops: ops.slice(gr[0], gr[1] + 1)
      };
    });
  }
  function fmtRange(start, count) { return count === 1 ? String(start) : start + "," + count; }

  VG.printFileDiff = function (path, oldC, newC) {
    if (oldC === newC) { return; }
    term.rich([["b", "diff --git a/" + path + " b/" + path]]);
    if (oldC === undefined) {
      term.rich([["b", "new file mode 100644"]]);
      term.rich([["b", "index 0000000.." + blobId(newC)]]);
      term.rich([["b", "--- /dev/null"]]);
      term.rich([["b", "+++ b/" + path]]);
    } else if (newC === undefined) {
      term.rich([["b", "deleted file mode 100644"]]);
      term.rich([["b", "index " + blobId(oldC) + "..0000000"]]);
      term.rich([["b", "--- a/" + path]]);
      term.rich([["b", "+++ /dev/null"]]);
    } else {
      term.rich([["b", "index " + blobId(oldC) + ".." + blobId(newC) + " 100644"]]);
      term.rich([["b", "--- a/" + path]]);
      term.rich([["b", "+++ b/" + path]]);
    }
    makeHunks(diffLines(linesOf(oldC), linesOf(newC)), 3).forEach(function (h) {
      term.rich([["c", "@@ -" + fmtRange(h.oldStart, h.oldCount) + " +" + fmtRange(h.newStart, h.newCount) + " @@"]]);
      h.ops.forEach(function (o) {
        if (o.t === " ") { term.rich([["", " " + o.s]]); }
        else if (o.t === "-") { term.rich([["r", "-" + o.s]]); }
        else { term.rich([["g", "+" + o.s]]); }
      });
    });
  };
  VG.printTreeDiff = function (a, b, paths) {
    var all = {}, shown = [];
    Object.keys(a).forEach(function (p) { all[p] = true; });
    Object.keys(b).forEach(function (p) { all[p] = true; });
    Object.keys(all).sort().forEach(function (p) {
      if (paths && paths.indexOf(p) === -1) { return; }
      if (a[p] !== b[p]) { VG.printFileDiff(p, a[p], b[p]); shown.push(p); }
    });
    return shown;
  };

  var treeChanges = VG.treeChanges = function (a, b) {
    var all = {}, list = [];
    Object.keys(a).forEach(function (p) { all[p] = true; });
    Object.keys(b).forEach(function (p) { all[p] = true; });
    Object.keys(all).sort().forEach(function (p) {
      if (a[p] === b[p]) { return; }
      var ins = 0, del = 0;
      diffLines(linesOf(a[p]), linesOf(b[p])).forEach(function (o) { if (o.t === "+") { ins++; } else if (o.t === "-") { del++; } });
      list.push({ path: p, ins: ins, del: del, created: !has(a, p), deleted: !has(b, p), content: has(b, p) ? b[p] : a[p] });
    });
    list.filter(function (x) { return x.deleted; }).forEach(function (d) {
      var c = list.filter(function (x) { return x.created && !x.renamedFrom && x.content === d.content; })[0];
      if (c) { c.renamedFrom = d.path; c.ins = 0; c.del = 0; d.gone = true; }
    });
    return list.filter(function (x) { return !x.gone; });
  };
  var summaryLine = VG.summaryLine = function (changes) {
    var ins = 0, del = 0;
    changes.forEach(function (c) { ins += c.ins; del += c.del; });
    return " " + plural(changes.length, "archivo cambiado", "archivos cambiados") +
      (ins || !del ? ", " + plural(ins, "inserción(+)", "inserciones(+)") : "") +
      (del ? ", " + plural(del, "eliminación(-)", "eliminaciones(-)") : "");
  };
  VG.printModeLines = function (changes) {
    changes.forEach(function (c) {
      if (c.renamedFrom) { term.pre(" rename " + c.renamedFrom + " => " + c.path + " (100%)"); }
      else if (c.created) { term.pre(" create mode 100644 " + c.path); }
      else if (c.deleted) { term.pre(" delete mode 100644 " + c.path); }
    });
  };
  VG.printStat = function (changes) {
    var w = 0;
    changes.forEach(function (c) {
      c.label = c.renamedFrom ? c.renamedFrom + " => " + c.path : c.path;
      w = Math.max(w, c.label.length);
    });
    changes.forEach(function (c) {
      var n = c.ins + c.del;
      var scale = n > 40 ? 40 / n : 1;
      term.rich([["", " " + pad(c.label, w) + " | " + lpad(n, 2) + (n ? " " : "")],
        ["g", "+".repeat(Math.round(c.ins * scale))], ["r", "-".repeat(Math.round(c.del * scale))]]);
    });
    term.pre(summaryLine(changes));
  };

  /* ---------------- Fusión a tres bandas (diff3) ---------------- */
  VG.merge3 = function (base, ours, theirs, labelOurs, labelTheirs) {
    var B = linesOf(base), O = linesOf(ours), T = linesOf(theirs);
    var mo = matchMap(B, O), mt = matchMap(B, T);
    var outL = [], conflict = false, i = 0, a = 0, b = 0;
    function eq(x, y) { return x.length === y.length && x.every(function (v, k) { return v === y[k]; }); }
    while (i < B.length || a < O.length || b < T.length) {
      if (i < B.length && mo[i] === a && mt[i] === b) { outL.push(B[i]); i++; a++; b++; continue; }
      var k = i;
      while (k < B.length && !(has(mo, k) && has(mt, k) && mo[k] >= a && mt[k] >= b)) { k++; }
      var ka = k < B.length ? mo[k] : O.length, kb = k < B.length ? mt[k] : T.length;
      var cb = B.slice(i, k), co = O.slice(a, ka), ct = T.slice(b, kb);
      if (eq(co, cb)) { Array.prototype.push.apply(outL, ct); }
      else if (eq(ct, cb) || eq(co, ct)) { Array.prototype.push.apply(outL, co); }
      else {
        conflict = true;
        outL.push("<<<<<<< " + labelOurs);
        Array.prototype.push.apply(outL, co);
        outL.push("=======");
        Array.prototype.push.apply(outL, ct);
        outL.push(">>>>>>> " + labelTheirs);
      }
      i = k; a = ka; b = kb;
    }
    return { text: outL.length ? outL.join("\n") + "\n" : "", conflict: conflict };
  };

  VG.mergeTrees = function (base, ours, theirs, labelOurs, labelTheirs) {
    var all = {}, tree = {}, conflicts = {}, merged = [], messages = [];
    [base, ours, theirs].forEach(function (t) { Object.keys(t).forEach(function (p) { all[p] = true; }); });
    Object.keys(all).sort().forEach(function (p) {
      var b = base[p], o = ours[p], t = theirs[p];
      if (o === t) { if (o !== undefined) { tree[p] = o; } return; }
      if (b === o) { if (t !== undefined) { tree[p] = t; } return; }
      if (b === t) { if (o !== undefined) { tree[p] = o; } return; }
      if (o === undefined || t === undefined) {
        var kept = o === undefined ? t : o;
        conflicts[p] = { base: b, ours: o, theirs: t, text: kept };
        messages.push("CONFLICTO (modificar/borrar): " + p + " borrado en " + (o === undefined ? labelOurs : labelTheirs) +
          " y modificado en " + (o === undefined ? labelTheirs : labelOurs) + ". Versión " +
          (o === undefined ? labelTheirs : labelOurs) + " de " + p + " dejada en el árbol.");
        return;
      }
      messages.push("Auto-fusionando " + p);
      var r = VG.merge3(b === undefined ? "" : b, o, t, labelOurs, labelTheirs);
      if (r.conflict) {
        conflicts[p] = { base: b, ours: o, theirs: t, text: r.text };
        messages.push("CONFLICTO (" + (b === undefined ? "agregar/agregar" : "contenido") + "): Conflicto de fusión en " + p);
      } else {
        tree[p] = r.text;
        merged.push(p);
      }
    });
    return { tree: tree, conflicts: conflicts, merged: merged, messages: messages };
  };

  /* Comprueba que una operación que cambia el árbol no pisa cambios locales */
  VG.wouldOverwrite = function (fromTree, toTree, extraPaths, verb) {
    var idx = state.git.index, work = state.work, dirty = VG.dirtyPaths();
    var local = [], untracked = [], all = {};
    Object.keys(fromTree).forEach(function (p) { all[p] = true; });
    Object.keys(toTree).forEach(function (p) { all[p] = true; });
    (extraPaths || []).forEach(function (p) { all[p] = true; });
    Object.keys(all).sort().forEach(function (p) {
      var changes = fromTree[p] !== toTree[p] || (extraPaths && extraPaths.indexOf(p) !== -1);
      if (!changes) { return; }
      if (dirty[p] && work[p] !== toTree[p]) { local.push(p); }
      else if (!has(fromTree, p) && !has(idx, p) && has(work, p) && work[p] !== toTree[p]) { untracked.push(p); }
    });
    var after = verb === "hacer checkout" ? "cambiar de rama" : verb;
    if (local.length) {
      term.fail("error: Los cambios locales de los siguientes archivos serán sobrescritos al " + verb + ":\n" +
        local.map(function (p) { return "\t" + p; }).join("\n") + "\n" +
        "Por favor, confirma tus cambios o guárdalos antes de " + after + ".\nAbortando");
      return true;
    }
    if (untracked.length) {
      term.fail("error: Los siguientes archivos sin seguimiento en el árbol de trabajo serán sobrescritos al " + verb + ":\n" +
        untracked.map(function (p) { return "\t" + p; }).join("\n") + "\n" +
        "Por favor, muévelos o elimínalos antes de " + after + ".\nAbortando");
      return true;
    }
    return false;
  };
  VG.applyTree = function (fromTree, toTree) {
    var idx = state.git.index, work = state.work, all = {};
    Object.keys(fromTree).forEach(function (p) { all[p] = true; });
    Object.keys(toTree).forEach(function (p) { all[p] = true; });
    Object.keys(all).forEach(function (p) {
      if (fromTree[p] === toTree[p]) { return; }
      if (has(toTree, p)) { idx[p] = toTree[p]; work[p] = toTree[p]; }
      else { delete idx[p]; delete work[p]; }
    });
  };
  VG.applyMerge = function (fromTree, res) {
    VG.applyTree(fromTree, res.tree);
    var g = state.git;
    Object.keys(res.conflicts).forEach(function (p) {
      var c = res.conflicts[p];
      g.unmerged[p] = { base: c.base, ours: c.ours, theirs: c.theirs };
      if (c.ours !== undefined) { g.index[p] = c.ours; } else { delete g.index[p]; }
      state.work[p] = c.text;
    });
  };

  VG.validRef = function (name) {
    return !!name && !/[\s~^:?*\[\\]/.test(name) && !/\.\./.test(name) &&
      !/^[-\/.]|[\/.]$|\/\/|@\{|\.lock$/.test(name) && name !== "@" && name !== "HEAD";
  };
  VG.hasMarkers = function (text) { return /^(<{7}|={7}|>{7})( |$)/m.test(text); };
})(this);
