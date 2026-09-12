/* ==========================================================
   RG.PosixCommands · Órdenes de una shell tipo bash sobre el
   sistema de ficheros virtual: navegación, lectura, edición,
   permisos y ACL. Cada reto elige cuáles activa.
   ctx: { term, vfs, sys, user(), cwd(), setCwd(), emit(), now(),
          editor, umask, man }
   ========================================================== */
(function (global) {
  "use strict";
  var RG = global.RG, util = RG.util;

  RG.PosixCommands = function (ctx) {
    var term = ctx.term, vfs = ctx.vfs;
    var pre = term.pre, line = term.line, rich = term.rich, fail = term.fail;
    var parseArgs = RG.parseArgs, last = RG.lastOf;
    var C = {};
    var MESES = util.MONTHS_ES;

    function user() { return ctx.user(); }
    function emit(ev) { if (ctx.emit) { ctx.emit(ev); } }
    function now() { return ctx.now ? ctx.now() : Date.now(); }

    /* ---------------- Ayudas ---------------- */
    function locate(p) { return vfs.locate(p, ctx.cwd()); }
    /* Comprueba permiso sobre un nodo y avisa como bash */
    function can(n, perm) { return vfs.can(user(), n, perm); }
    function reach(segs) { return vfs.canReach(user(), segs); }
    function noSuch(cmd, p) { fail(cmd + ": no se puede acceder a '" + p + "': No existe el fichero o el directorio"); }
    function denied(cmd, p) { fail(cmd + ": " + p + ": Permiso denegado"); }

    function fmtDate(ts) {
      var d = new Date(ts);
      return MESES[d.getMonth()] + " " + util.lpad(d.getDate(), 2) + " " + util.pad2(d.getHours()) + ":" + util.pad2(d.getMinutes());
    }
    function colorOf(n) { return n.type === "dir" ? "bl" : (n.mode & 0o111) ? "g" : ""; }

    /* ---------------- Navegación ---------------- */
    C.pwd = function () {
      pre(vfs.join(ctx.cwd()));
      emit({ type: "pwd", path: vfs.join(ctx.cwd()) });
    };

    C.cd = function (args) {
      var target = args[0] || (ctx.home ? ctx.home() : "/");
      var loc = locate(target);
      if (!loc.node) { fail("bash: cd: " + target + ": No existe el fichero o el directorio"); return; }
      if (loc.node.type !== "dir") { fail("bash: cd: " + target + ": No es un directorio"); return; }
      if (!can(loc.node, "x") || !reach(loc.segs)) { fail("bash: cd: " + target + ": Permiso denegado"); return; }
      ctx.setCwd(loc.segs);
      term.renderPrompt();
      emit({ type: "cd", path: vfs.join(loc.segs) });
    };

    C.ls = function (args) {
      var o = parseArgs(args, { short: { a: "all", A: "all", l: "long", h: "human", R: "rec", d: "dirOnly", t: "x", r: "x", "1": "one", F: "classify" },
        long: { all: "all", human: "human", recursive: "rec" } });
      if (o.bad || o.missing) { fail("ls: opción no válida"); return; }
      var targets = o._.length ? o._ : ["."];
      targets.forEach(function (t, i) {
        var loc = locate(t);
        if (!loc.node) { noSuch("ls", t); return; }
        if (!reach(loc.segs)) { denied("ls", t); return; }
        if (loc.node.type !== "dir" || o.dirOnly) {
          showEntries([loc.node], o, loc.segs.slice(0, -1));
          emit({ type: "ls", path: vfs.join(loc.segs), long: !!o.long, all: !!o.all, single: true });
          return;
        }
        if (!can(loc.node, "r")) { denied("ls", t); return; }
        if (targets.length > 1) { if (i) { pre(""); } pre(t + ":"); }
        var entries = vfs.list(vfs.join(loc.segs), []);
        if (o.all) {
          entries = [util.copy(loc.node), util.copy(loc.node)].map(function (n, k) { n.name = k ? ".." : "."; return n; }).concat(entries);
        } else {
          entries = entries.filter(function (n) { return n.name.charAt(0) !== "."; });
        }
        showEntries(entries, o, loc.segs);
        emit({ type: "ls", path: vfs.join(loc.segs), long: !!o.long, all: !!o.all });
      });
    };
    function showEntries(entries, o, segs) {
      if (o.long) {
        if (entries.length) { pre("total " + entries.length * 4); }
        var w = { u: 0, g: 0, s: 0 };
        entries.forEach(function (n) {
          w.u = Math.max(w.u, n.owner.length);
          w.g = Math.max(w.g, n.group.length);
          w.s = Math.max(w.s, String(vfs.size(n)).length);
        });
        entries.forEach(function (n) {
          rich([["", vfs.modeString(n) + " " + (n.type === "dir" ? 2 : 1) + " " +
            util.pad(n.owner, w.u) + " " + util.pad(n.group, w.g) + " " +
            util.lpad(vfs.size(n), w.s) + " " + fmtDate(n.mtime) + " "], [colorOf(n), n.name + (o.classify && n.type === "dir" ? "/" : "")]]);
        });
        return;
      }
      if (o.one) { entries.forEach(function (n) { rich([[colorOf(n), n.name]]); }); return; }
      if (entries.length) {
        rich(entries.map(function (n, i) {
          return [colorOf(n), n.name + (o.classify && n.type === "dir" ? "/" : "") + (i < entries.length - 1 ? "  " : "")];
        }));
      }
    }

    C.tree = function (args) {
      var base = locate(args[0] || ".");
      if (!base.node) { noSuch("tree", args[0] || "."); return; }
      pre(args[0] || ".");
      var dirs = 0, files = 0;
      (function rec(n, prefix) {
        var kids = util.sortedKeys(n.children).filter(function (k) { return k.charAt(0) !== "."; });
        kids.forEach(function (name, i) {
          var child = n.children[name];
          var lastOne = i === kids.length - 1;
          rich([["", prefix + (lastOne ? "└── " : "├── ")], [colorOf(child), name]]);
          if (child.type === "dir") { dirs++; rec(child, prefix + (lastOne ? "    " : "│   ")); }
          else { files++; }
        });
      })(base.node, "");
      pre("\n" + dirs + " directorios, " + files + " ficheros");
      emit({ type: "tree", path: vfs.join(base.segs) });
    };

    /* ---------------- Lectura de ficheros ---------------- */
    function readOrFail(cmd, p) {
      var loc = locate(p);
      if (!loc.node) { fail(cmd + ": " + p + ": No existe el fichero o el directorio"); return null; }
      if (loc.node.type === "dir") { fail(cmd + ": " + p + ": Es un directorio"); return null; }
      if (!can(loc.node, "r") || !reach(loc.segs)) { denied(cmd, p); return null; }
      return loc.node;
    }
    C.cat = function (args) {
      if (!args.length) { fail("cat: falta un operando"); return; }
      args.forEach(function (p) {
        var n = readOrFail("cat", p);
        if (n) { pre(String(n.content).replace(/\n$/, "")); emit({ type: "cat", path: p }); }
      });
    };
    C.less = C.more = function (args) { C.cat(args); };
    C.head = function (args) { headTail(args, "head"); };
    C.tail = function (args) { headTail(args, "tail"); };
    function headTail(args, cmd) {
      var o = parseArgs(args, { short: { n: "=n" }, long: { lines: "=n" }, numeric: true });
      var n = o.n ? parseInt(last(o.n), 10) : 10;
      o._.forEach(function (p) {
        var node = readOrFail(cmd, p);
        if (!node) { return; }
        var ls = util.linesOf(node.content);
        pre((cmd === "head" ? ls.slice(0, n) : ls.slice(-n)).join("\n"));
        emit({ type: cmd, path: p, lines: n });
      });
    }
    C.wc = function (args) {
      var o = parseArgs(args, { short: { l: "lines", w: "words", c: "chars" }, long: {} });
      o._.forEach(function (p) {
        var n = readOrFail("wc", p);
        if (!n) { return; }
        var ls = util.linesOf(n.content);
        var words = n.content.split(/\s+/).filter(Boolean).length;
        if (o.lines) { pre(util.lpad(ls.length, 6) + " " + p); }
        else if (o.words) { pre(util.lpad(words, 6) + " " + p); }
        else if (o.chars) { pre(util.lpad(n.content.length, 6) + " " + p); }
        else { pre(util.lpad(ls.length, 6) + util.lpad(words, 7) + util.lpad(n.content.length, 7) + " " + p); }
        emit({ type: "wc", path: p, lines: ls.length, onlyLines: !!o.lines });
      });
    };
    C.file = function (args) {
      args.forEach(function (p) {
        var loc = locate(p);
        if (!loc.node) { fail("file: no se puede abrir '" + p + "' (No existe el fichero o el directorio)"); return; }
        if (loc.node.type === "dir") { pre(p + ": directory"); }
        else if (/^#!/.test(loc.node.content)) { pre(p + ": Bourne-Again shell script, ASCII text executable"); }
        else { pre(p + ": ASCII text"); }
        emit({ type: "file", path: p });
      });
    };
    C.stat = function (args) {
      args.forEach(function (p) {
        var loc = locate(p);
        if (!loc.node) { fail("stat: no se puede efectuar `stat' sobre '" + p + "': No existe el fichero o el directorio"); return; }
        var n = loc.node, u = ctx.sys && ctx.sys.user(n.owner), g = ctx.sys && ctx.sys.group(n.group);
        pre("  Fichero: " + p + "\n" +
          "  Tamaño: " + util.pad(vfs.size(n), 10) + " Bloques: 8          Bloque E/S: 4096   " + (n.type === "dir" ? "directorio" : "fichero regular") + "\n" +
          "  Acceso: (" + util.lpad((n.mode & 0o7777).toString(8), 4).replace(/ /g, "0") + "/" + vfs.modeString(n) + ")  " +
          "Uid: (" + util.lpad(u ? u.uid : 0, 5) + "/" + util.lpad(n.owner, 8) + ")   " +
          "Gid: (" + util.lpad(g ? g.gid : 0, 5) + "/" + util.lpad(n.group, 8) + ")\n" +
          "Modificación: " + new Date(n.mtime).toISOString().replace("T", " ").slice(0, 19));
        emit({ type: "stat", path: p });
      });
    };

    /* ---------------- Buscar ---------------- */
    C.grep = function (args) {
      var o = parseArgs(args, { short: { i: "ic", n: "num", v: "inv", r: "rec", R: "rec", l: "listOnly", c: "count", E: "x", w: "word" },
        long: { "ignore-case": "ic", "invert-match": "inv", recursive: "rec", count: "count" } });
      var pat = o._[0], targets = o._.slice(1);
      if (pat === undefined) { fail("Modo de empleo: grep [OPCIÓN]... PATRONES [ARCHIVO]..."); return; }
      if (!targets.length) { fail("grep: (simulador) indica al menos un fichero o directorio"); return; }
      var re;
      try { re = new RegExp(o.word ? "\\b" + pat + "\\b" : pat, o.ic ? "i" : ""); } catch (e) { re = null; }
      var found = false, files = [];
      targets.forEach(function (t) {
        var loc = locate(t);
        if (!loc.node) { fail("grep: " + t + ": No existe el fichero o el directorio"); return; }
        if (loc.node.type === "dir") {
          if (!o.rec) { fail("grep: " + t + ": Es un directorio"); return; }
          vfs.walk(loc.segs, function (n, segs) { if (n.type === "file") { files.push({ node: n, path: vfs.join(segs) }); } });
        } else { files.push({ node: loc.node, path: t }); }
      });
      files.forEach(function (f) {
        if (!can(f.node, "r")) { return; }
        var hits = util.linesOf(f.node.content).map(function (l, i) { return { l: l, i: i }; })
          .filter(function (x) { var hit = re ? re.test(x.l) : x.l.indexOf(pat) !== -1; return o.inv ? !hit : hit; });
        if (!hits.length) { return; }
        found = true;
        if (o.listOnly) { pre(f.path); return; }
        if (o.count) { pre(f.path + ":" + hits.length); return; }
        hits.forEach(function (x) {
          rich([["m", (files.length > 1 ? f.path + ":" : "") + (o.num ? (x.i + 1) + ":" : "")], ["", x.l]]);
        });
      });
      if (!found) { term.status.code = 1; }
      emit({ type: "grep", pattern: pat, targets: targets, files: files.length, rec: !!o.rec, found: found });
    };

    C.find = function (args) {
      var startRaw = args[0] && args[0].charAt(0) !== "-" ? args[0] : ".";
      var rest = args.slice(args[0] === startRaw ? 1 : 0);
      var loc = locate(startRaw);
      if (!loc.node) { fail("find: '" + startRaw + "': No existe el fichero o el directorio"); return; }
      var opts = {};
      for (var i = 0; i < rest.length; i++) {
        var a = rest[i];
        if (a === "-name" || a === "-iname") { opts.name = rest[++i]; opts.iname = a === "-iname"; }
        else if (a === "-type") { opts.type = rest[++i]; }
        else if (a === "-user") { opts.user = rest[++i]; }
        else if (a === "-group") { opts.group = rest[++i]; }
        else if (a === "-perm") { opts.perm = rest[++i]; }
        else if (a === "-maxdepth") { opts.maxdepth = parseInt(rest[++i], 10); }
        else if (a === "-size" || a === "-mtime") { i++; }
      }
      var re = opts.name ? util.globToRe(opts.iname ? opts.name.toLowerCase() : opts.name) : null;
      var base = loc.segs.length;
      var results = [];
      vfs.walk(loc.segs, function (n, segs) {
        if (opts.maxdepth !== undefined && segs.length - base > opts.maxdepth) { return; }
        if (re && !re.test(opts.iname ? (n.name || "").toLowerCase() : (n.name || ""))) { return; }
        if (opts.type === "f" && n.type !== "file") { return; }
        if (opts.type === "d" && n.type !== "dir") { return; }
        if (opts.user && n.owner !== opts.user) { return; }
        if (opts.group && n.group !== opts.group) { return; }
        if (opts.perm && (n.mode & 0o777) !== parseInt(opts.perm.replace(/^-/, ""), 8)) { return; }
        results.push(segs.length === base ? startRaw : (startRaw === "." ? "./" : vfs.join(segs.slice(0, base)) + "/") +
          segs.slice(base).join("/"));
      });
      results.forEach(function (r) { pre(r); });
      emit({ type: "find", results: results, opts: opts });
    };

    /* ---------------- Crear, copiar, borrar ---------------- */
    function parentOf(loc) { return vfs.get(vfs.join(loc.segs.slice(0, -1)), []); }
    function canWriteIn(loc, cmd, p) {
      var parent = parentOf(loc);
      if (!parent) { fail(cmd + ": no se puede crear '" + p + "': No existe el fichero o el directorio"); return false; }
      if (!can(parent, "w") || !can(parent, "x")) { denied(cmd, p); return false; }
      return true;
    }
    C.mkdir = function (args) {
      var o = parseArgs(args, { short: { p: "parents", v: "verbose", m: "=mode" }, long: { parents: "parents", verbose: "verbose", mode: "=mode" } });
      if (!o._.length) { fail("mkdir: falta un operando"); return; }
      o._.forEach(function (p) {
        var loc = locate(p);
        if (loc.node) { if (!o.parents) { fail("mkdir: no se puede crear el directorio «" + p + "»: El fichero ya existe"); } return; }
        if (!o.parents && !canWriteIn(loc, "mkdir", p)) { return; }
        var n = vfs.mkdir(p, ctx.cwd(), {
          parents: !!o.parents, owner: user().name, group: user().group,
          mode: o.mode ? parseInt(last(o.mode), 8) : (0o777 & ~ctx.umask())
        });
        if (!n) { fail("mkdir: no se puede crear el directorio «" + p + "»: No existe el fichero o el directorio"); return; }
        n.mtime = now();
        if (o.verbose) { pre("mkdir: se ha creado el directorio '" + p + "'"); }
        emit({ type: "mkdir", path: vfs.join(locate(p).segs) });
      });
    };
    C.rmdir = function (args) {
      args.forEach(function (p) {
        var loc = locate(p);
        if (!loc.node) { fail("rmdir: fallo al borrar '" + p + "': No existe el fichero o el directorio"); return; }
        if (loc.node.type !== "dir") { fail("rmdir: fallo al borrar '" + p + "': No es un directorio"); return; }
        if (Object.keys(loc.node.children).length) { fail("rmdir: fallo al borrar '" + p + "': El directorio no está vacío"); return; }
        if (!canWriteIn(loc, "rmdir", p)) { return; }
        vfs.remove(p, ctx.cwd());
        emit({ type: "rmdir", path: p });
      });
    };
    C.touch = function (args) {
      args.forEach(function (p) {
        var loc = locate(p);
        if (loc.node) { loc.node.mtime = now(); return; }
        if (!canWriteIn(loc, "touch", p)) { return; }
        var f = vfs.writeFile(p, "", ctx.cwd(), { owner: user().name, group: user().group, mode: 0o666 & ~ctx.umask() });
        if (f) { f.mtime = now(); emit({ type: "touch", path: p }); }
      });
    };
    C.rm = function (args) {
      var o = parseArgs(args, { short: { r: "rec", R: "rec", f: "force", i: "x", v: "verbose", d: "dir" }, long: { recursive: "rec", force: "force", verbose: "verbose" } });
      if (!o._.length && !o.force) { fail("rm: falta un operando"); return; }
      o._.forEach(function (p) {
        var loc = locate(p);
        if (!loc.node) { if (!o.force) { fail("rm: no se puede borrar '" + p + "': No existe el fichero o el directorio"); } return; }
        if (loc.node.type === "dir" && !o.rec) { fail("rm: no se puede borrar '" + p + "': Es un directorio"); return; }
        if (!canWriteIn(loc, "rm", p)) { return; }
        vfs.remove(p, ctx.cwd());
        if (o.verbose) { pre("rm: se ha borrado '" + p + "'"); }
        emit({ type: "rm", path: p });
      });
    };
    C.cp = function (args) {
      var o = parseArgs(args, { short: { r: "rec", R: "rec", v: "verbose", p: "preserve", f: "x", i: "x", a: "rec" }, long: { recursive: "rec", verbose: "verbose", preserve: "preserve" } });
      if (o._.length < 2) { fail("cp: falta un operando de fichero destino"); return; }
      var dest = o._[o._.length - 1];
      o._.slice(0, -1).forEach(function (src) {
        var s = locate(src);
        if (!s.node) { fail("cp: no se puede efectuar `stat' sobre '" + src + "': No existe el fichero o el directorio"); return; }
        if (s.node.type === "dir" && !o.rec) { fail("cp: se omite el directorio '" + src + "'"); return; }
        if (!can(s.node, "r")) { denied("cp", src); return; }
        var d = locate(dest);
        var targetLoc = d.node && d.node.type === "dir" ? { segs: d.segs.concat([s.segs[s.segs.length - 1]]) } : d;
        if (!canWriteIn(targetLoc, "cp", dest)) { return; }
        var copy = vfs.copy(src, dest, ctx.cwd());
        if (!copy) { fail("cp: no se puede crear el fichero regular '" + dest + "'"); return; }
        if (!o.preserve) { copy.owner = user().name; copy.group = user().group; copy.mtime = now(); }
        if (o.verbose) { pre("'" + src + "' -> '" + dest + "'"); }
        emit({ type: "cp", from: src, to: dest });
      });
    };
    C.mv = function (args) {
      var o = parseArgs(args, { short: { v: "verbose", f: "x", i: "x", n: "x" }, long: { verbose: "verbose" } });
      if (o._.length < 2) { fail("mv: falta un operando de fichero destino"); return; }
      var dest = o._[o._.length - 1];
      o._.slice(0, -1).forEach(function (src) {
        var s = locate(src);
        if (!s.node) { fail("mv: no se puede efectuar `stat' sobre '" + src + "': No existe el fichero o el directorio"); return; }
        if (!canWriteIn(s, "mv", src)) { return; }
        var d = locate(dest);
        var targetLoc = d.node && d.node.type === "dir" ? { segs: d.segs.concat([s.segs[s.segs.length - 1]]) } : d;
        if (!canWriteIn(targetLoc, "mv", dest)) { return; }
        if (!vfs.move(src, dest, ctx.cwd())) { fail("mv: no se puede mover '" + src + "' a '" + dest + "'"); return; }
        if (o.verbose) { pre("'" + src + "' -> '" + dest + "'"); }
        emit({ type: "mv", from: src, to: dest });
      });
    };

    /* ---------------- Permisos ---------------- */
    function eachTarget(paths, cmd, rec, fn) {
      paths.forEach(function (p) {
        var loc = locate(p);
        if (!loc.node) { fail(cmd + ": no se puede acceder a '" + p + "': No existe el fichero o el directorio"); return; }
        var nodes = [{ n: loc.node, path: p }];
        if (rec) { vfs.walk(loc.segs, function (n, segs) { if (n !== loc.node) { nodes.push({ n: n, path: vfs.join(segs) }); } }); }
        nodes.forEach(function (x) { fn(x.n, x.path); });
      });
    }
    C.chmod = function (args) {
      var o = parseArgs(args, { short: { R: "rec", v: "verbose", c: "x" }, long: { recursive: "rec", verbose: "verbose" } });
      var spec = o._[0], paths = o._.slice(1);
      if (!spec || !paths.length) { fail("chmod: falta un operando"); return; }
      eachTarget(paths, "chmod", o.rec, function (n, p) {
        if (n.owner !== user().name && user().uid !== 0) { fail("chmod: cambiando los permisos de '" + p + "': Operación no permitida"); return; }
        var before = n.mode;
        var m = vfs.parseMode(spec, n.mode, n.type === "dir");
        if (m === null) { fail("chmod: modo erróneo: «" + spec + "»"); return; }
        n.mode = m;
        if (o.verbose) { pre("el modo de '" + p + "' cambiado a " + m.toString(8) + " (" + vfs.modeString(n) + ")"); }
        emit({ type: "chmod", path: p, mode: m, before: before });
      });
    };
    C.chown = function (args) {
      var o = parseArgs(args, { short: { R: "rec", v: "verbose" }, long: { recursive: "rec", verbose: "verbose" } });
      var spec = o._[0], paths = o._.slice(1);
      if (!spec || !paths.length) { fail("chown: falta un operando"); return; }
      var parts = spec.split(":");
      var newOwner = parts[0], newGroup = parts.length > 1 ? parts[1] : null;
      if (user().uid !== 0) { fail("chown: cambiando el propietario de '" + paths[0] + "': Operación no permitida"); return; }
      if (newOwner && ctx.sys && !ctx.sys.user(newOwner)) { fail("chown: usuario no válido: «" + spec + "»"); return; }
      if (newGroup && ctx.sys && !ctx.sys.group(newGroup)) { fail("chown: grupo no válido: «" + spec + "»"); return; }
      eachTarget(paths, "chown", o.rec, function (n, p) {
        if (newOwner) { n.owner = newOwner; }
        if (newGroup) { n.group = newGroup; }
        if (o.verbose) { pre("el propietario de '" + p + "' cambiado a " + n.owner + ":" + n.group); }
        emit({ type: "chown", path: p, owner: n.owner, group: n.group });
      });
    };
    C.chgrp = function (args) {
      var o = parseArgs(args, { short: { R: "rec", v: "verbose" }, long: { recursive: "rec", verbose: "verbose" } });
      var g = o._[0], paths = o._.slice(1);
      if (!g || !paths.length) { fail("chgrp: falta un operando"); return; }
      if (ctx.sys && !ctx.sys.group(g)) { fail("chgrp: grupo no válido: «" + g + "»"); return; }
      eachTarget(paths, "chgrp", o.rec, function (n, p) {
        if (n.owner !== user().name && user().uid !== 0) { fail("chgrp: cambiando el grupo de '" + p + "': Operación no permitida"); return; }
        n.group = g;
        emit({ type: "chgrp", path: p, group: g });
      });
    };
    C.umask = function (args) {
      if (!args.length) {
        pre("0" + ctx.umask().toString(8));
        emit({ type: "umask", value: ctx.umask(), shown: true });
        return;
      }
      if (!/^[0-7]{3,4}$/.test(args[0])) { fail("umask: " + args[0] + ": octal number out of range"); return; }
      ctx.setUmask(parseInt(args[0], 8) & 0o777);
      emit({ type: "umask", value: ctx.umask() });
    };

    /* ---------------- ACL ---------------- */
    function aclLines(n, path) {
      var out = ["# file: " + path.replace(/^\//, ""), "# owner: " + n.owner, "# group: " + n.group];
      var acl = n.acl || [];
      out.push("user::" + permStr((n.mode >> 6) & 7));
      acl.filter(function (e) { return e.kind === "user"; }).forEach(function (e) {
        out.push("user:" + e.name + ":" + fill(e.perms) + effSuffix(e.perms, n));
      });
      out.push("group::" + permStr((n.mode >> 3) & 7));
      acl.filter(function (e) { return e.kind === "group"; }).forEach(function (e) {
        out.push("group:" + e.name + ":" + fill(e.perms) + effSuffix(e.perms, n));
      });
      var mask = acl.filter(function (e) { return e.kind === "mask"; })[0];
      if (mask) { out.push("mask::" + fill(mask.perms)); }
      out.push("other::" + permStr(n.mode & 7));
      /* ACL por omisión: la que heredará todo lo que se cree dentro */
      if (n.dacl && n.dacl.length) {
        out.push("default:user::" + permStr((n.mode >> 6) & 7));
        n.dacl.filter(function (e) { return e.kind === "user"; }).forEach(function (e) {
          out.push("default:user:" + e.name + ":" + fill(e.perms));
        });
        out.push("default:group::" + permStr((n.mode >> 3) & 7));
        n.dacl.filter(function (e) { return e.kind === "group"; }).forEach(function (e) {
          out.push("default:group:" + e.name + ":" + fill(e.perms));
        });
        var dmask = n.dacl.filter(function (e) { return e.kind === "mask"; })[0];
        if (dmask) { out.push("default:mask::" + fill(dmask.perms)); }
        out.push("default:other::" + permStr(n.mode & 7));
      }
      return out.join("\n");
    }
    function permStr(b) { return (b & 4 ? "r" : "-") + (b & 2 ? "w" : "-") + (b & 1 ? "x" : "-"); }
    function fill(p) { return (p.indexOf("r") !== -1 ? "r" : "-") + (p.indexOf("w") !== -1 ? "w" : "-") + (p.indexOf("x") !== -1 ? "x" : "-"); }
    function effSuffix(perms, n) {
      var mask = (n.acl || []).filter(function (e) { return e.kind === "mask"; })[0];
      if (!mask) { return ""; }
      var eff = "rwx".split("").filter(function (c) { return perms.indexOf(c) !== -1 && mask.perms.indexOf(c) !== -1; }).join("");
      return eff === perms ? "" : "\t#effective:" + fill(eff);
    }
    C.getfacl = function (args) {
      var o = parseArgs(args, { short: { R: "rec" }, long: { recursive: "rec" } });
      if (!o._.length) { fail("getfacl: falta un operando"); return; }
      o._.forEach(function (p, i) {
        var loc = locate(p);
        if (!loc.node) { fail("getfacl: " + p + ": No existe el fichero o el directorio"); return; }
        if (i) { pre(""); }
        pre(aclLines(loc.node, p));
        emit({ type: "getfacl", path: p });
      });
    };
    C.setfacl = function (args) {
      var o = parseArgs(args, { short: { m: "=mod", x: "=del", b: "removeAll", R: "rec", d: "def", k: "removeDef" },
        long: { modify: "=mod", remove: "=del", "remove-all": "removeAll", recursive: "rec" } });
      var paths = o._;
      if (!paths.length) { fail("setfacl: falta un operando"); return; }
      eachTarget(paths, "setfacl", o.rec, function (n, p) {
        if (n.owner !== user().name && user().uid !== 0) { fail("setfacl: " + p + ": Operación no permitida"); return; }
        if (o.removeAll) { n.acl = null; n.dacl = null; emit({ type: "setfacl", path: p, cleared: true }); return; }
        if (o.removeDef) { vfs.clearDefaultAcl(n); emit({ type: "setfacl", path: p, clearedDefault: true }); return; }
        (o.mod || []).forEach(function (spec) {
          spec.split(",").forEach(function (part) {
            var raw = part.trim();
            /* La entrada puede ser por omisión con -d o con el prefijo d: */
            var isDefault = !!o.def;
            if (/^(d|default):/.test(raw)) { isDefault = true; raw = raw.replace(/^(d|default):/, ""); }
            var m = /^(u|user|g|group|m|mask|o|other):([^:]*):?([rwx-]*)$/.exec(raw);
            if (!m) { fail("setfacl: Opción -m: Entrada ACL no válida"); return; }
            var kind = m[1].charAt(0) === "u" ? "user" : m[1].charAt(0) === "g" ? "group" : m[1].charAt(0) === "m" ? "mask" : "other";
            var name = m[2], perms = (m[3] || "").replace(/-/g, "");
            if (isDefault && n.type !== "dir") {
              fail("setfacl: " + p + ": Solo los directorios pueden tener ACL por omisión");
              return;
            }
            if (ctx.sys && kind === "user" && name && !ctx.sys.user(name)) { fail("setfacl: Opción -m: Usuario desconocido: " + name); return; }
            if (ctx.sys && kind === "group" && name && !ctx.sys.group(name)) { fail("setfacl: Opción -m: Grupo desconocido: " + name); return; }
            if (isDefault) {
              vfs.setDefaultAcl(n, kind, name, perms);
              emit({ type: "setfacl", path: p, kind: kind, name: name, perms: perms, isDefault: true });
              return;
            }
            if (kind === "other") { n.mode = (n.mode & ~7) | bits(perms); return; }
            if (kind === "mask") { vfs.setAcl(n, "mask", "", perms); return; }
            if (!name) { n.mode = kind === "user" ? (n.mode & ~(7 << 6)) | (bits(perms) << 6) : (n.mode & ~(7 << 3)) | (bits(perms) << 3); return; }
            vfs.setAcl(n, kind, name, perms);
            emit({ type: "setfacl", path: p, kind: kind, name: name, perms: perms });
          });
        });
        (o.del || []).forEach(function (spec) {
          var raw = spec.trim(), isDefault = !!o.def;
          if (/^(d|default):/.test(raw)) { isDefault = true; raw = raw.replace(/^(d|default):/, ""); }
          var m = /^(u|user|g|group):([^:]*)$/.exec(raw);
          if (!m) { fail("setfacl: Opción -x: Entrada ACL no válida"); return; }
          var kind = m[1].charAt(0) === "u" ? "user" : "group";
          if (isDefault) {
            if (n.dacl) { n.dacl = n.dacl.filter(function (x) { return !(x.kind === kind && x.name === m[2]); }); }
          } else { vfs.removeAcl(n, kind, m[2]); }
          emit({ type: "setfacl", path: p, removed: m[2], isDefault: isDefault });
        });
      });
    };
    function bits(p) { return (p.indexOf("r") !== -1 ? 4 : 0) | (p.indexOf("w") !== -1 ? 2 : 0) | (p.indexOf("x") !== -1 ? 1 : 0); }

    /* ---------------- Escritura rápida y editor ---------------- */
    C.echo = function (args) { pre(args.join(" ")); };
    C.nano = function (args, name) {
      if (name && name !== "nano") { term.sys("info", "ℹ (simulador) Se abre nano, el editor configurado en EDITOR."); }
      var p = args.filter(function (a) { return a.charAt(0) !== "-"; })[0];
      if (!p) { fail("Uso: nano [FICHERO]"); return; }
      var loc = locate(p);
      if (loc.node && loc.node.type === "dir") { fail("nano: " + p + " es un directorio"); return; }
      if (loc.node && !can(loc.node, "r")) { denied("nano", p); return; }
      if (!loc.node && !canWriteIn(loc, "nano", p)) { return; }
      ctx.editor.open(vfs.join(loc.segs), loc.node ? loc.node.content : "", function (text, saved) {
        if (!saved) { return; }
        if (loc.node) {
          if (!can(loc.node, "w")) { denied("nano", p); return; }
          loc.node.content = text;
          loc.node.mtime = now();
        } else {
          var f = vfs.writeFile(p, text, ctx.cwd(), { owner: user().name, group: user().group, mode: 0o666 & ~ctx.umask() });
          if (f) { f.mtime = now(); }
        }
        emit({ type: "edit", path: p });
      });
    };
    C.vi = C.vim = C.nano;

    /* ---------------- Identidad y varios ---------------- */
    C.whoami = function () {
      pre(user().name);
      emit({ type: "whoami", user: user().name });
    };
    C.id = function (args) {
      var name = args.filter(function (a) { return a.charAt(0) !== "-"; })[0] || user().name;
      var u = ctx.sys && ctx.sys.user(name);
      if (!u) { fail("id: «" + name + "»: no existe ese usuario"); return; }
      var groups = ctx.sys.userGroups(name).map(function (g) {
        var gr = ctx.sys.group(g);
        return (gr ? gr.gid : 0) + "(" + g + ")";
      });
      var primary = ctx.sys.group(u.group);
      pre("uid=" + u.uid + "(" + u.name + ") gid=" + (primary ? primary.gid : 0) + "(" + u.group + ") grupos=" + groups.join(","));
      emit({ type: "id", user: name });
    };
    C.groups = function (args) {
      var name = args[0] || user().name;
      if (!ctx.sys.user(name)) { fail("groups: «" + name + "»: no existe ese usuario"); return; }
      pre(name + " : " + ctx.sys.userGroups(name).join(" "));
      emit({ type: "groups", user: name });
    };
    C.date = function () {
      pre(util.fmtDateEs(new Date(now()), ctx.tz || "CEST"));
      emit({ type: "date" });
    };
    C.clear = function () { term.clear(); };
    C.history = function () {
      term.history.forEach(function (h, i) { pre(util.lpad(i + 1, 5) + "  " + h); });
      emit({ type: "history" });
    };
    C.which = function (args) {
      pre("/usr/bin/" + (args[0] || ""));
      emit({ type: "which", name: args[0] || "" });
    };
    C.man = function (args) {
      var t = (args[args.length - 1] || "").toLowerCase();
      if (!t) { fail("¿Qué página de manual desea?"); return; }
      var pages = ctx.man || {};
      if (!pages[t]) { fail("No hay entrada de manual para " + t); term.status.code = 16; return; }
      if (ctx.onMan) { ctx.onMan(t); }
      RG.man.render(term, t, pages[t]);
      emit({ type: "man", name: t });
    };
    C.sudo = function (args) {
      if (!args.length) { fail("uso: sudo <orden>"); return; }
      if (ctx.sudo === false) { fail(user().name + " no está en el fichero sudoers. Este incidente será reportado."); return; }
      var prev = ctx.asRoot(true);
      try { ctx.run(args); } finally { ctx.asRoot(prev); }
    };
    return C;
  };
})(this);
