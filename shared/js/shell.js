/* ==========================================================
   RG.Shell · Intérprete de línea de órdenes
   Comillas, comodines, encadenado (&& || ;), tuberías y
   redirecciones (> y >>). Los comandos los aporta cada reto.
   ========================================================== */
(function (global) {
  "use strict";
  var RG = global.RG, util = RG.util;

  /* ---------------- Analizador léxico ----------------
     winPaths: en PowerShell la barra invertida es separador de rutas
     (C:\Datos), no un carácter de escape. */
  function lex(str, winPaths) {
    var toks = [], cur = null, i = 0;
    function ensure() { if (!cur) { cur = { w: true, v: "", q: false, glob: false }; } return cur; }
    function push() { if (cur) { toks.push(cur); cur = null; } }
    while (i < str.length) {
      var ch = str.charAt(i);
      if (/\s/.test(ch)) { push(); i++; continue; }
      if (ch === "#" && !cur) { break; }
      if (ch === "'") {
        var j = str.indexOf("'", i + 1);
        if (j < 0) { j = str.length; }
        ensure().v += str.slice(i + 1, j);
        cur.q = true;
        i = j + 1;
        continue;
      }
      if (ch === '"') {
        ensure().q = true;
        i++;
        while (i < str.length && str.charAt(i) !== '"') {
          if (!winPaths && str.charAt(i) === "\\" && "\"\\$`".indexOf(str.charAt(i + 1)) >= 0) { cur.v += str.charAt(i + 1); i += 2; }
          else { cur.v += str.charAt(i); i++; }
        }
        i++;
        continue;
      }
      if (ch === "\\" && !winPaths) { ensure(); if (i + 1 < str.length) { cur.v += str.charAt(i + 1); i += 2; } else { i++; } continue; }
      if ("|&;><".indexOf(ch) >= 0) {
        push();
        var two = str.substr(i, 2);
        if (two === "&&" || two === "||" || two === ">>") { toks.push({ op: two }); i += 2; }
        else { toks.push({ op: ch }); i++; }
        continue;
      }
      ensure();
      if (ch === "*" || ch === "?") { cur.glob = true; }
      cur.v += ch;
      i++;
    }
    push();
    return toks;
  }
  RG.lex = lex;

  RG.Shell = function (term, cfg) {
    var sh = {};
    var queue = null;
    sh.suspended = false;
    sh.currentText = "";

    function parseLine(raw) {
      var toks = lex(raw, cfg.winPaths);
      var items = [], pipeline = [], cur = { words: [], redir: null }, prevSep = null, text = "";
      function endPipeline() {
        if (cur.words.length) { pipeline.push(cur); }
        if (pipeline.length) { items.push({ pipeline: pipeline, prevSep: prevSep, text: text.trim() }); }
        pipeline = [];
        cur = { words: [], redir: null };
        text = "";
      }
      for (var i = 0; i < toks.length; i++) {
        var tk = toks[i];
        if (tk.w) { cur.words.push(tk); text += (text ? " " : "") + tk.v; continue; }
        if (tk.op === "|") {
          if (!cur.words.length) { term.fail("bash: error sintáctico cerca del elemento inesperado `|'"); return null; }
          pipeline.push(cur);
          cur = { words: [], redir: null };
          text += " | ";
          continue;
        }
        if (tk.op === ">" || tk.op === ">>") {
          var f = toks[++i];
          if (!f || !f.w) { term.fail("bash: error sintáctico cerca del elemento inesperado `newline'"); return null; }
          cur.redir = { append: tk.op === ">>", file: f.v };
          text += " " + tk.op + " " + f.v;
          continue;
        }
        if (tk.op === "&") { term.fail("bash: (simulador) no se admite ejecutar órdenes en segundo plano con &"); return null; }
        endPipeline();
        prevSep = tk.op;
      }
      endPipeline();
      return items;
    }

    function expandGlobs(words) {
      var out = [];
      words.forEach(function (w) {
        if (!w.glob || !cfg.fs || !cfg.fs.list) { out.push(w.v); return; }
        var re = util.globToRe(w.v);
        var m = cfg.fs.list().filter(function (n) { return re.test(n) && (n.charAt(0) !== "." || w.v.charAt(0) === "."); });
        if (m.length) { Array.prototype.push.apply(out, m); } else { out.push(w.v); }
      });
      return out;
    }

    /* ---------------- Filtros de las tuberías ---------------- */
    var FILTERS = {
      grep: function (args, rows, o) {
        var pat = o._[0];
        if (pat === undefined) { term.fail("Modo de empleo: grep [OPCIÓN]... PATRONES [ARCHIVO]..."); return []; }
        var re;
        try { re = new RegExp(o.word ? "\\b" + pat + "\\b" : pat, o.ic ? "i" : ""); } catch (e) { re = null; }
        var res = rows.filter(function (r) {
          var text = term.rowText(r);
          var hit = re ? re.test(text) : text.indexOf(pat) !== -1;
          return o.inv ? !hit : hit;
        });
        if (o.count) { return [{ cls: "", pre: true, segs: [["", String(res.length)]] }]; }
        if (o.num) {
          return res.map(function (r) {
            return { cls: r.cls, pre: true, segs: [["m", (rows.indexOf(r) + 1) + ":"]].concat(r.segs) };
          });
        }
        if (!res.length) { term.status.code = 1; }
        return res;
      },
      head: function (args, rows) { return rows.slice(0, countArg(args)); },
      tail: function (args, rows) { return rows.slice(-countArg(args)); },
      wc: function (args, rows) {
        if (args.indexOf("-l") !== -1 || !args.length) { return [{ cls: "", pre: true, segs: [["", String(rows.length)]] }]; }
        var chars = rows.map(term.rowText).join("\n").length;
        return [{ cls: "", pre: true, segs: [["", String(chars)]] }];
      },
      sort: function (args, rows) {
        var sorted = rows.slice().sort(function (a, b) {
          var x = term.rowText(a), y = term.rowText(b);
          return x < y ? -1 : x > y ? 1 : 0;
        });
        if (args.indexOf("-r") !== -1) { sorted.reverse(); }
        return sorted;
      },
      uniq: function (args, rows) {
        var seen = null, res = [];
        rows.forEach(function (r) {
          var text = term.rowText(r);
          if (text !== seen) { res.push(r); }
          seen = text;
        });
        return res;
      },
      nl: function (args, rows) {
        return rows.map(function (r, i) { return { cls: r.cls, pre: true, segs: [["", util.lpad(i + 1, 6) + "\t"]].concat(r.segs) }; });
      },
      cat: function (args, rows) { return rows; },
      less: function (args, rows) { return rows; },
      more: function (args, rows) { return rows; },
      tee: function (args, rows) { return rows; }
    };
    function countArg(args) {
      var n = 10;
      var m = /^-n?(\d+)$/.exec(args[0] || "");
      if (args[0] === "-n" && args[1]) { n = parseInt(args[1], 10); }
      else if (m) { n = parseInt(m[1], 10); }
      return n;
    }
    function applyFilter(words, rows) {
      var cmd = words[0], args = words.slice(1);
      var fn = (cfg.filters && cfg.filters[cmd]) || FILTERS[cmd];
      if (!fn) { notFound(cmd); return []; }
      var o = RG.parseArgs(args, {
        short: { i: "ic", v: "inv", n: "num", c: "count", w: "word", E: "x", r: "x", l: "x" },
        long: { "ignore-case": "ic", "invert-match": "inv", count: "count" }
      });
      return fn(args, rows, o);
    }

    /* ---------------- Ejecución ---------------- */
    /* cfg.notFound permite el mensaje propio de cada intérprete */
    function notFound(name) {
      if (cfg.notFound) { cfg.notFound(name); return; }
      term.fail("bash: " + name + ": orden no encontrada");
    }
    function execCommand(words) {
      if (!words.length) { return; }
      var name = words[0], args = words.slice(1);
      /* cfg.resolve permite alias y nombres sin distinguir mayúsculas (PowerShell) */
      var fn = cfg.resolve ? cfg.resolve(name) : cfg.commands[name];
      if (fn) { fn(args, name); return; }
      if (cfg.unknown) { cfg.unknown(name, args); return; }
      notFound(name);
    }

    /* ---------------- Canal de objetos (pipeline de PowerShell) ----------------
       Una orden puede emitir objetos en vez de texto con sh.emit(objetos). Si la
       siguiente etapa es un filtro de objetos (Where-Object, Select-Object…) los
       recibe tal cual; si no, se convierten a texto. Lo que quede sin consumir al
       final del pipeline se formatea como hace PowerShell. */
    sh.objects = null;
    sh.emit = function (objects) { sh.objects = objects; };
    function objectsToRows(objects) {
      if (cfg.objectsToRows) { return cfg.objectsToRows(objects); }
      return objects.map(function (o) { return { cls: "", pre: true, segs: [["", String(o)]] }; });
    }

    function runPipeline(item) {
      term.status.code = 0;
      sh.currentText = item.text;
      sh.objects = null;
      var cmds = item.pipeline;
      var redir = cmds[cmds.length - 1].redir;
      if (cmds.length === 1 && !redir) {
        execCommand(expandGlobs(cmds[0].words));
        if (sh.objects && cfg.renderObjects) { cfg.renderObjects(sh.objects); }
        sh.objects = null;
        return;
      }
      var rows, pending;
      term.beginCapture();
      try { execCommand(expandGlobs(cmds[0].words)); }
      finally {
        var res = term.endCapture();
        rows = res.rows;
        pending = res.deferred;
      }
      var objects = sh.objects;
      sh.objects = null;
      for (var k = 1; k < cmds.length; k++) {
        var words = expandGlobs(cmds[k].words);
        var objFilter = objects && (cfg.resolveFilter ? cfg.resolveFilter(words[0])
          : (cfg.objectFilters && cfg.objectFilters[words[0]]));
        if (objFilter) {
          var out = objFilter(words.slice(1), objects, term);
          if (out && out.rows) { rows = out.rows; objects = null; }
          else { objects = out || []; }
          continue;
        }
        if (objects) { rows = objectsToRows(objects); objects = null; }
        rows = applyFilter(words, rows) || [];
      }
      if (objects) {
        if (redir) { rows = objectsToRows(objects); }
        else {
          if (cfg.renderObjects) { cfg.renderObjects(objects); }
          pending.forEach(function (d) { term.sys(d.cls, d.text); });
          return;
        }
      }
      if (redir) {
        var text = rows.map(term.rowText).join("\n");
        if (text) { text += "\n"; }
        var prev = redir.append && cfg.fs && cfg.fs.read ? (cfg.fs.read(redir.file) || "") : "";
        if (!cfg.fs || !cfg.fs.write || !cfg.fs.write(redir.file, prev + text)) {
          term.fail("bash: " + redir.file + ": Permiso denegado");
        }
      } else {
        term.pushRows(rows);
      }
      pending.forEach(function (d) { term.sys(d.cls, d.text); });
    }

    sh.runLine = function (raw) {
      var items = parseLine(raw);
      if (!items) { if (cfg.afterLine) { cfg.afterLine(); } return; }
      queue = { items: items, i: 0, status: 0 };
      sh.pump();
    };
    sh.pump = function () {
      while (queue && queue.i < queue.items.length) {
        var it = queue.items[queue.i++];
        if (it.prevSep === "&&" && queue.status !== 0) { continue; }
        if (it.prevSep === "||" && queue.status === 0) { continue; }
        runPipeline(it);
        if (sh.suspended) { return; }
        queue.status = term.status.code;
        if (cfg.afterCommand) { cfg.afterCommand(); }
      }
      queue = null;
      if (cfg.afterLine) { cfg.afterLine(); }
    };
    /* El editor suspende la línea en curso y la reanuda al cerrarse */
    sh.suspend = function () { sh.suspended = true; };
    sh.resume = function () {
      sh.suspended = false;
      if (cfg.afterCommand) { cfg.afterCommand(); }
      if (queue) { queue.status = term.status.code; sh.pump(); }
      else if (cfg.afterLine) { cfg.afterLine(); }
    };
    /* Ejecuta una línea sin interacción (preparar una fase, pruebas) */
    sh.runSilent = function (raw) {
      var items = parseLine(raw);
      if (!items) { return; }
      items.forEach(function (it) {
        if (it.prevSep === "&&" && term.status.code !== 0) { return; }
        if (it.prevSep === "||" && term.status.code === 0) { return; }
        runPipeline(it);
      });
    };
    sh.reset = function () { queue = null; sh.suspended = false; };

    return sh;
  };

  /* ==========================================================
     RG.parseArgs · opciones cortas y largas estilo getopt
     def.short / def.long: nombre → clave; con "=" delante, lleva valor
     ========================================================== */
  RG.parseArgs = function (args, def) {
    var res = { _: [], __: null, bad: null };
    function put(k, v) { (res[k] = res[k] || []).push(v); }
    for (var i = 0; i < args.length; i++) {
      var a = args[i];
      if (res.__) { res.__.push(a); continue; }
      if (a === "--") { res.__ = []; continue; }
      if (a.slice(0, 2) === "--" && a.length > 2) {
        var eq = a.indexOf("=");
        var name = eq > 0 ? a.slice(2, eq) : a.slice(2);
        var val = eq > 0 ? a.slice(eq + 1) : undefined;
        var d = def.long && def.long[name];
        if (!d) { res.bad = a; return res; }
        if (d.charAt(0) === "=") {
          if (val === undefined) { val = args[++i]; }
          if (val === undefined) { res.missing = a; return res; }
          put(d.slice(1), val);
        } else { res[d] = true; }
      } else if (a.charAt(0) === "-" && a.length > 1) {
        if (def.numeric && /^-\d+$/.test(a)) { put("n", a.slice(1)); continue; }
        for (var j = 1; j < a.length; j++) {
          var ch = a.charAt(j);
          var ds = def.short && def.short[ch];
          if (!ds) { res.bad = "-" + ch; return res; }
          if (ds.charAt(0) === "=") {
            var v = a.slice(j + 1);
            if (!v) { v = args[++i]; }
            if (v === undefined) { res.missing = "-" + ch; return res; }
            put(ds.slice(1), v);
            break;
          }
          res[ds] = res[ds] === true ? 2 : (typeof res[ds] === "number" ? res[ds] + 1 : true);
        }
      } else { res._.push(a); }
    }
    return res;
  };
  RG.lastOf = function (arr) { return arr ? arr[arr.length - 1] : undefined; };
})(this);
