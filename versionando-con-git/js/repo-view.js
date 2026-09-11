/* ==========================================================
   Panel «Repositorio»: grafo de commits en SVG y estado de
   las tres áreas. Se redibuja tras cada orden.
   ========================================================== */
(function (global) {
  "use strict";
  var RG = global.RG, VG = global.VG, util = RG.util, cfg = VG.cfg;
  var state = VG.state;
  var has = util.has, esc = util.esc, sortedKeys = util.sortedKeys, unionKeys = util.unionKeys, firstLine = util.firstLine;

  var LANE_COLORS = ["#3ddc84", "#6ec1ff", "#ff7ad1", "#ffcb6b", "#ffa05a", "#b69cff"];
  var ROW_H = 28;

  function graphCommits(limit) {
    var g = state.git;
    if (!g) { return []; }
    var tips = [];
    Object.keys(g.branches).forEach(function (b) { tips.push(g.branches[b]); });
    Object.keys(g.tags).forEach(function (t) { tips.push(g.tags[t].target); });
    Object.keys(g.remoteRefs).forEach(function (r) { Object.keys(g.remoteRefs[r]).forEach(function (b) { tips.push(g.remoteRefs[r][b]); }); });
    if (VG.headHash()) { tips.push(VG.headHash()); }
    if (g.op && g.op.theirs) { tips.push(g.op.theirs); }
    return VG.walk(tips.filter(Boolean), []).slice(0, limit || 40);
  }

  function graphLayout(commits) {
    var cols = [], rows = [], known = {}, maxLane = 0;
    commits.forEach(function (c) { known[c.hash] = true; });
    commits.forEach(function (c) {
      var ci = cols.indexOf(c.hash);
      if (ci === -1) { cols.push(c.hash); ci = cols.length - 1; }
      maxLane = Math.max(maxLane, ci);
      var parents = c.parents.filter(function (p) { return known[p]; });
      var next = cols.slice();
      if (!parents.length) { next.splice(ci, 1); }
      else {
        next[ci] = parents[0];
        var ins = 0;
        for (var p = 1; p < parents.length; p++) {
          if (next.indexOf(parents[p]) === -1) { next.splice(ci + 1 + ins, 0, parents[p]); ins++; }
        }
      }
      for (var j = next.length - 1; j > 0; j--) { if (next.indexOf(next[j]) < j) { next.splice(j, 1); } }
      rows.push({ commit: c, lane: ci, after: next.slice() });
      cols = next;
      maxLane = Math.max(maxLane, cols.length - 1);
    });
    return { rows: rows, lanes: maxLane + 1 };
  }

  function graphSvg(layout) {
    var rows = layout.rows;
    function X(l) { return 10 + l * 15; }
    function Y(r) { return ROW_H / 2 + r * ROW_H; }
    var index = {};
    rows.forEach(function (r, i) { index[r.commit.hash] = i; });
    var paths = [], circles = [];
    rows.forEach(function (row, r) {
      row.commit.parents.forEach(function (p) {
        var rp = index[p], pts = [[row.lane, r]];
        if (rp === undefined) {
          var l0 = row.after.indexOf(p);
          if (l0 === -1) { return; }
          pts.push([l0, r + 1]);
        } else {
          for (var k = r + 1; k < rp; k++) {
            var lk = rows[k - 1].after.indexOf(p);
            if (lk !== -1) { pts.push([lk, k]); }
          }
          pts.push([rows[rp].lane, rp]);
        }
        var d = "M" + X(pts[0][0]) + "," + Y(pts[0][1]);
        for (var i2 = 1; i2 < pts.length; i2++) {
          var x0 = X(pts[i2 - 1][0]), y0 = Y(pts[i2 - 1][1]), x1 = X(pts[i2][0]), y1 = Y(pts[i2][1]);
          if (x0 === x1) { d += "L" + x1 + "," + y1; }
          else { d += "C" + x0 + "," + ((y0 + y1) / 2) + " " + x1 + "," + ((y0 + y1) / 2) + " " + x1 + "," + y1; }
        }
        var color = LANE_COLORS[(rp === undefined ? row.lane : rows[rp].lane) % LANE_COLORS.length];
        paths.push('<path d="' + d + '" fill="none" stroke="' + color + '" stroke-width="2" opacity="0.8"/>');
      });
      var isHead = row.commit.hash === VG.headHash();
      var col = LANE_COLORS[row.lane % LANE_COLORS.length];
      circles.push('<circle cx="' + X(row.lane) + '" cy="' + Y(r) + '" r="' + (row.commit.parents.length > 1 ? 4 : 5) + '" fill="' +
        (row.commit.parents.length > 1 ? "#04060a" : col) + '" stroke="' + col + '" stroke-width="2"/>' +
        (isHead ? '<circle cx="' + X(row.lane) + '" cy="' + Y(r) + '" r="8" fill="none" stroke="' + col + '" stroke-width="1" opacity="0.6"/>' : ""));
    });
    var w = X(layout.lanes - 1) + 14;
    return {
      svg: '<svg class="graph-svg" width="' + w + '" height="' + (rows.length * ROW_H) + '" aria-hidden="true">' + paths.join("") + circles.join("") + "</svg>",
      width: w
    };
  }

  function refPillsHtml(hash, refs) {
    return (refs[hash] || []).map(function (r) {
      if (r.t === "headbranch") { return '<span class="ref-pill ref-head">HEAD → ' + esc(r.name) + "</span>"; }
      if (r.t === "head") { return '<span class="ref-pill ref-head">HEAD</span>'; }
      if (r.t === "branch") { return '<span class="ref-pill ref-branch">' + esc(r.name) + "</span>"; }
      if (r.t === "remote") { return '<span class="ref-pill ref-remote">' + esc(r.name) + "</span>"; }
      return '<span class="ref-pill ref-tag">🏷 ' + esc(r.name) + "</span>";
    }).join("");
  }

  function areasTableHtml() {
    var g = state.git, head = VG.headTree() || {}, idx = g.index, work = state.work;
    var rows = unionKeys(work, idx, head, g.unmerged).map(function (p) {
      var inWork = has(work, p), inIdx = has(idx, p), inHead = has(head, p), conf = has(g.unmerged, p);
      var w, wc, wt;
      if (conf) { w = "⚠"; wc = "st-conf"; wt = "en conflicto"; }
      else if (!inWork) { w = "—"; wc = "st-del"; wt = "borrado del directorio"; }
      else if (!inIdx) {
        if (VG.isIgnored(p)) { w = "ign"; wc = "st-ign"; wt = "ignorado por .gitignore"; }
        else { w = "??"; wc = "st-unt"; wt = "sin seguimiento"; }
      } else if (work[p] !== idx[p]) { w = "M"; wc = "st-mod"; wt = "modificado sin preparar"; }
      else { w = "✓"; wc = "st-same"; wt = "igual que lo preparado"; }
      var s, sc, stt;
      if (conf) { s = "⚠"; sc = "st-conf"; stt = "sin resolver"; }
      else if (!inIdx) { s = inHead ? "D" : "·"; sc = inHead ? "st-del" : "st-same"; stt = inHead ? "borrado preparado" : "no está"; }
      else if (!inHead) { s = "A"; sc = "st-new"; stt = "nuevo, preparado"; }
      else if (idx[p] !== head[p]) { s = "M"; sc = "st-new"; stt = "modificado y preparado"; }
      else { s = "✓"; sc = "st-same"; stt = "igual que el último commit"; }
      return "<tr><td>" + esc(p) + "</td>" +
        '<td class="st ' + wc + '" title="' + wt + '">' + w + '<span class="sr-only">' + wt + "</span></td>" +
        '<td class="st ' + sc + '" title="' + stt + '">' + s + '<span class="sr-only">' + stt + "</span></td>" +
        '<td class="st st-same">' + (inHead ? "✓" : "·") +
        '<span class="sr-only">' + (inHead ? "está en el último commit" : "no está en el último commit") + "</span></td></tr>";
    });
    if (!rows.length) { return '<p class="repo-empty">No hay ficheros.</p>'; }
    return '<table class="areas-table"><thead><tr><th scope="col">Fichero</th><th scope="col">Trabajo</th><th scope="col">Preparado</th><th scope="col">Commit</th></tr></thead>' +
      "<tbody>" + rows.join("") + "</tbody></table>" +
      '<p class="areas-note">✓ igual · <span class="st-mod">M</span> modificado · <span class="st-new">A</span> nuevo preparado · ' +
      '<span class="st-unt">??</span> sin seguimiento · <span class="st-del">D/—</span> borrado · <span class="st-conf">⚠</span> conflicto</p>';
  }

  VG.buildRepoHtml = function (big) {
    var g = state.git;
    if (!g) {
      return '<section class="repo-card"><h2>Repositorio</h2><p class="repo-empty">La carpeta ~/' + cfg.REPO_NAME +
        ' todavía no es un repositorio Git. Créalo con <code>git init -b main</code> y aquí verás el grafo de ramas y el estado de las tres áreas.</p></section>';
    }
    var refs = VG.refsByCommit(), commits = graphCommits(big ? 80 : 40), head = VG.headHash(), summary;
    if (!head) {
      summary = "En la rama <b>" + esc(VG.headBranch()) + "</b>, todavía sin commits.";
    } else {
      summary = (VG.headBranch() ? "HEAD → <b>" + esc(VG.headBranch()) + "</b>" : "HEAD desacoplada en <b>" + VG.short(head) + "</b>") +
        " · " + Object.keys(VG.ancestors(head)).length + " commits";
      var up = VG.headBranch() && g.upstream[VG.headBranch()];
      if (up) {
        var r = VG.remoteRef(up.remote, up.branch);
        var ab = r ? VG.aheadBehind(head, r) : null;
        summary += " · " + (!r ? "sin copia de " + up.remote + "/" + up.branch
          : (!ab.ahead && !ab.behind) ? "sincronizada con " + up.remote + "/" + up.branch
          : (ab.ahead ? "↑" + ab.ahead + " " : "") + (ab.behind ? "↓" + ab.behind + " " : "") + "respecto a " + up.remote + "/" + up.branch);
      }
    }
    var opText = "";
    if (g.op) {
      var names = { merge: "fusión", "cherry-pick": "cherry-pick", revert: "revert", rebase: "rebase" };
      var conf = Object.keys(g.unmerged).length;
      opText = '<span class="rs-op">⚙ ' + names[g.op.type] + " en curso" +
        (conf ? " · " + conf + " fichero" + (conf > 1 ? "s" : "") + " en conflicto" : " · sin conflictos") +
        " · <code>git " + g.op.type + " --abort</code> lo cancela</span>";
    }
    var graphHtml;
    if (!commits.length) {
      graphHtml = '<p class="repo-empty">Todavía no hay commits. Prepara ficheros con <code>git add</code> y confirma con <code>git commit</code>.</p>';
    } else {
      var layout = graphLayout(commits), svg = graphSvg(layout);
      graphHtml = '<div class="graph-wrap" style="min-height:' + (commits.length * ROW_H) + 'px">' + svg.svg +
        '<ol class="graph-rows" style="padding-left:' + svg.width + 'px">' +
        layout.rows.map(function (row) {
          var c = row.commit;
          return '<li class="g-row' + (c.hash === head ? " is-head" : "") + '">' + refPillsHtml(c.hash, refs) +
            '<span class="g-hash">' + VG.short(c.hash) + '</span><span class="g-msg" title="' + esc(firstLine(c.msg) + " — " + c.author.name) + '">' +
            esc(firstLine(c.msg)) + "</span></li>";
        }).join("") + "</ol></div>" +
        '<p class="legend"><span><b style="color:var(--cyan)">HEAD</b> dónde estás</span><span><b style="color:var(--green)">rama</b> local</span>' +
        '<span><b style="color:var(--red)">origin/…</b> copia del servidor</span><span><b style="color:var(--amber)">🏷 etiqueta</b></span></p>';
    }
    var tagList = sortedKeys(g.tags).map(function (t) { return t + " → " + VG.short(g.tags[t].target); }).join(", ");
    var remoteList = sortedKeys(g.remotes).map(function (r) { return r + " → " + g.remotes[r].url; }).join("<br>");
    var stashList = g.stash.length ? g.stash.map(function (e, i) { return "stash@{" + i + "}: " + esc(e.msg); }).join("<br>") : "vacía";
    return '<section class="repo-card"><div class="repo-head"><h2>Estado del repositorio</h2>' +
        (big ? "" : '<button type="button" class="btn btn-sm" id="repoBigBtn">⤢ Ampliar</button>') + "</div>" +
        '<p class="repo-summary">' + summary + opText + "</p></section>" +
      '<section class="repo-card"><h2>Grafo de commits (más reciente arriba)</h2>' + graphHtml + "</section>" +
      '<section class="repo-card"><h2>Las tres áreas</h2>' + areasTableHtml() + "</section>" +
      '<section class="repo-card"><h2>Remotos, etiquetas y stash</h2><dl class="kv">' +
        "<div><dt>Remotos</dt><dd>" + (remoteList || "ninguno (<code>git remote add origin …</code>)") + "</dd></div>" +
        "<div><dt>Etiquetas</dt><dd>" + (tagList || "ninguna") + "</dd></div>" +
        "<div><dt>Pila de stash</dt><dd>" + stashList + "</dd></div>" +
      "</dl></section>";
  };

  VG.openRepoModal = function () {
    RG.$("repoBig").innerHTML = VG.buildRepoHtml(true);
    state.flags.viewedMap = true;
    RG.Modal.open(RG.$("repoModal"));
  };

  VG.renderRepo = function () {
    var view = RG.$("repoView");
    var html = VG.buildRepoHtml(false);
    if (view.getAttribute("data-html") === html) { return; }
    view.setAttribute("data-html", html);
    view.innerHTML = html;
    var bigBtn = RG.$("repoBigBtn");
    if (bigBtn) { bigBtn.addEventListener("click", VG.openRepoModal); }
    if (RG.$("panelRepo").hidden) { RG.$("repoDot").hidden = false; }
    if (!RG.$("repoModal").hidden) { RG.$("repoBig").innerHTML = VG.buildRepoHtml(true); }
  };
})(this);
