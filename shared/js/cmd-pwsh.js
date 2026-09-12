/* ==========================================================
   RG.PwshCommands · Cmdlets de PowerShell sobre el sistema de
   ficheros virtual, con tubería de OBJETOS (Where-Object,
   Select-Object, Sort-Object…), formato de tabla, ACL e icacls.
   ========================================================== */
(function (global) {
  "use strict";
  var RG = global.RG, util = RG.util;

  /* Derechos de Windows admitidos y su abreviatura en icacls */
  var RIGHTS = ["FullControl", "Modify", "ReadAndExecute", "Read", "Write", "ListDirectory"];
  var SHORT = { FullControl: "F", Modify: "M", ReadAndExecute: "RX", Read: "R", Write: "W", ListDirectory: "RD" };
  var LONG = { F: "FullControl", M: "Modify", RX: "ReadAndExecute", R: "Read", W: "Write", RD: "ListDirectory" };

  /* ---------------- Parámetros al estilo de PowerShell ----------------
     -Path C:\Datos  ·  -Rec (abreviatura)  ·  -Force:$false  ·  posicionales */
  function resolveParam(raw, names) {
    var low = String(raw).toLowerCase(), exact = null, pref = [];
    names.forEach(function (n) {
      if (n.toLowerCase() === low) { exact = n; }
      else if (n.toLowerCase().indexOf(low) === 0) { pref.push(n); }
    });
    return exact || (pref.length === 1 ? pref[0] : null);
  }
  /* spec: {Nombre: "v" (lleva valor) | "s" (modificador)}; pos: orden posicional */
  function P(args, spec, pos) {
    var res = { _: [] }, names = Object.keys(spec);
    for (var i = 0; i < args.length; i++) {
      var a = args[i];
      if (a.charAt(0) === "-" && a.length > 1 && !/^-\d/.test(a)) {
        var raw = a.slice(1), val = null, colon = raw.indexOf(":");
        if (colon > 0) { val = raw.slice(colon + 1); raw = raw.slice(0, colon); }
        var key = resolveParam(raw, names);
        if (!key) { res.bad = a; continue; }
        if (spec[key] === "v") { res[key] = val !== null ? val : args[++i]; }
        else { res[key] = val === null ? true : /^\$?true$/i.test(val); }
      } else { res._.push(a); }
    }
    (pos || []).forEach(function (k, idx) {
      if (res[k] === undefined && res._[idx] !== undefined) { res[k] = res._[idx]; }
    });
    return res;
  }
  RG.psArgs = P;

  RG.PwshCommands = function (ctx) {
    var term = ctx.term, vfs = ctx.vfs;
    var pre = term.pre, rich = term.rich, fail = term.fail;
    var C = {}, F = {};

    function user() { return ctx.user(); }
    function emit(ev) { if (ctx.emit) { ctx.emit(ev); } }
    function now() { return ctx.now ? ctx.now() : Date.now(); }
    function out(objects) { ctx.shell.emit(objects); }
    function locate(p) { return vfs.locate(p, ctx.cwd()); }
    function can(n, perm) { return vfs.can(user(), n, perm); }
    function isAdmin() {
      var u = user();
      return (u.groups || []).indexOf("Administradores") !== -1 || u.name === "Administrador";
    }

    function errParam(cmd, o) {
      if (!o.bad) { return false; }
      fail(cmd + " : No se encuentra ningún parámetro que coincida con el nombre del parámetro '" + o.bad.slice(1) + "'.");
      return true;
    }
    function errNotFound(cmd, p) {
      fail(cmd + " : No se encuentra la ruta de acceso '" + p + "' porque no existe.");
    }
    function errDenied(cmd, p) {
      fail(cmd + " : Acceso denegado a la ruta de acceso '" + p + "'.");
    }
    function errAdmin(cmd) {
      fail(cmd + " : Acceso denegado. Abre PowerShell como administrador para ejecutar esta operación.");
    }

    /* ==========================================================
       Formato de salida
       ========================================================== */
    function fmtDate(ts) {
      var d = new Date(ts);
      return util.pad2(d.getDate()) + "/" + util.pad2(d.getMonth() + 1) + "/" + d.getFullYear() +
        "     " + util.pad2(d.getHours()) + ":" + util.pad2(d.getMinutes());
    }
    function modeWin(n) { return (n.type === "dir" ? "d" : "-") + "a---"; }
    /* Objeto FileInfo / DirectoryInfo */
    function fsObject(n, segs) {
      var name = n.name || segs[segs.length - 1] || vfs.join([]);
      return {
        Mode: modeWin(n),
        LastWriteTime: fmtDate(n.mtime),
        Length: n.type === "dir" ? "" : (n.content || "").length,
        Name: name,
        FullName: vfs.join(segs),
        Directory: vfs.join(segs.slice(0, -1)),
        Extension: /\.[^.\\]+$/.test(name) ? /\.[^.\\]+$/.exec(name)[0] : "",
        PSIsContainer: n.type === "dir",
        __kind: n.type,
        __node: n
      };
    }
    ctx.fsObject = fsObject;

    function visibleKeys(o) {
      return Object.keys(o).filter(function (k) { return k.indexOf("__") !== 0; });
    }
    function fmtValue(v) {
      if (v === undefined || v === null) { return ""; }
      if (typeof v === "boolean") { return v ? "True" : "False"; }
      if (Array.isArray(v)) { return v.map(fmtValue).join(", "); }
      if (typeof v === "object") { return v.Name || v.IdentityReference || "{…}"; }
      return String(v);
    }
    function renderTable(objects) {
      var keys = visibleKeys(objects[0]);
      if (!keys.length) { return; }
      var w = {};
      keys.forEach(function (k) {
        w[k] = k.length;
        objects.forEach(function (o) { w[k] = Math.max(w[k], fmtValue(o[k]).length); });
      });
      function row(cells) { return cells.join(" ").replace(/\s+$/, ""); }
      pre("");
      rich([["b", row(keys.map(function (k) { return util.pad(k, w[k]); }))]]);
      rich([["b", row(keys.map(function (k) { return util.pad("-".repeat(k.length), w[k]); }))]]);
      objects.forEach(function (o) {
        pre(row(keys.map(function (k) { return util.pad(fmtValue(o[k]), w[k]); })));
      });
      pre("");
    }
    function renderList(objects) {
      objects.forEach(function (o) {
        var keys = visibleKeys(o), w = 0;
        keys.forEach(function (k) { w = Math.max(w, k.length); });
        pre("");
        keys.forEach(function (k) {
          var v = o[k];
          if (Array.isArray(v) && v.length && typeof v[0] === "object") {
            v.forEach(function (x, i) {
              pre(util.pad(i ? "" : k, w) + " : " + fmtValue(x.IdentityReference || x.Name) +
                (x.FileSystemRights ? " " + x.AccessControlType + " " + x.FileSystemRights + (x.IsInherited ? " (heredado)" : "") : ""));
            });
          } else { pre(util.pad(k, w) + " : " + fmtValue(v)); }
        });
      });
      pre("");
    }
    /* Listados de ficheros: agrupados por directorio, como Get-ChildItem */
    function renderFs(objects) {
      var order = [], groups = {};
      objects.forEach(function (o) {
        if (!util.has(groups, o.Directory)) { groups[o.Directory] = []; order.push(o.Directory); }
        groups[o.Directory].push(o);
      });
      order.forEach(function (dir) {
        pre("");
        pre("    Directorio: " + dir);
        pre("");
        rich([["b", util.pad("Mode", 8) + util.pad("LastWriteTime", 22) + util.lpad("Length", 8) + " Name"]]);
        rich([["b", util.pad("----", 8) + util.pad("-------------", 22) + util.lpad("------", 8) + " ----"]]);
        groups[dir].forEach(function (o) {
          rich([["", util.pad(o.Mode, 8) + util.pad(o.LastWriteTime, 22) + util.lpad(o.Length, 8) + " "],
            [o.__kind === "dir" ? "bl" : "", o.Name]]);
        });
      });
      pre("");
    }
    /* Lo que queda sin consumir al final de la tubería se formatea aquí */
    function renderObjects(objects) {
      if (!objects || !objects.length) { return; }
      var first = objects[0];
      if (first === null || first === undefined) { return; }
      if (typeof first !== "object") {
        objects.forEach(function (o) { pre(fmtValue(o)); });
        return;
      }
      if (first.__list) { renderList(objects); return; }
      if (first.__kind) { renderFs(objects); return; }
      renderTable(objects);
    }
    ctx.renderObjects = renderObjects;
    ctx.objectsToRows = function (objects) {
      return term.collect(function () { renderObjects(objects); });
    };

    /* ==========================================================
       Comparaciones y filtros de la tubería de objetos
       ========================================================== */
    function compare(value, op, target) {
      var a = value === undefined || value === null ? "" : value;
      /* $true y $false son literales de PowerShell */
      if (/^\$(true|false)$/i.test(String(target))) { target = String(target).slice(1).toLowerCase(); }
      var numA = parseFloat(a), numB = parseFloat(target);
      var bothNum = !isNaN(numA) && !isNaN(numB) && String(a).trim() !== "" && String(target).trim() !== "";
      switch (String(op).toLowerCase()) {
        case "-eq": return bothNum ? numA === numB : String(a).toLowerCase() === String(target).toLowerCase();
        case "-ne": return !compare(value, "-eq", target);
        case "-gt": return bothNum ? numA > numB : String(a) > String(target);
        case "-ge": return bothNum ? numA >= numB : String(a) >= String(target);
        case "-lt": return bothNum ? numA < numB : String(a) < String(target);
        case "-le": return bothNum ? numA <= numB : String(a) <= String(target);
        case "-like": return util.globToRe(String(target).toLowerCase()).test(String(a).toLowerCase());
        case "-notlike": return !compare(value, "-like", target);
        case "-match":
          try { return new RegExp(String(target), "i").test(String(a)); } catch (e) { return false; }
        case "-notmatch": return !compare(value, "-match", target);
        case "-contains": return Array.isArray(value) && value.map(String).indexOf(String(target)) !== -1;
        default: return null;
      }
    }
    function propOf(obj, path) {
      if (obj === null || obj === undefined) { return undefined; }
      if (!path) { return obj; }
      return String(path).split(".").reduce(function (o, k) {
        return o === undefined || o === null ? o : o[k];
      }, obj);
    }
    /* Admite  Where-Object Name -like '*.log'  ·  Where-Object { $_.Length -gt 100 } */
    function buildFilter(args) {
      var joined = args.join(" ").trim();
      var block = /^\{([\s\S]*)\}$/.exec(joined);
      var expr = (block ? block[1] : joined).trim();
      var parts = expr.split(/\s+-and\s+/i), tests = [];
      for (var i = 0; i < parts.length; i++) {
        var m = /^\$_\.([A-Za-z0-9_.]+)\s+(-\w+)\s+(.+)$/.exec(parts[i].trim()) ||
                /^(?:-Property\s+)?([A-Za-z0-9_.]+)\s+(-\w+)\s+(.+)$/i.exec(parts[i].trim());
        if (!m) { return null; }
        if (compare("", m[2], "") === null) { return null; }
        tests.push({ prop: m[1], op: m[2], target: m[3].trim().replace(/^['"]|['"]$/g, "") });
      }
      if (!tests.length) { return null; }
      return function (o) {
        return tests.every(function (t) { return compare(propOf(o, t.prop), t.op, t.target); });
      };
    }

    F["Where-Object"] = function (args, objects) {
      var f = buildFilter(args);
      if (!f) {
        fail("Where-Object : (simulador) usa por ejemplo  Where-Object Name -like '*.log'  o  Where-Object { $_.Length -gt 100 }");
        return [];
      }
      emit({ type: "where", expr: args.join(" ") });
      return objects.filter(f);
    };
    F["Select-Object"] = function (args, objects) {
      var o = P(args, { First: "v", Last: "v", Skip: "v", Property: "v", ExpandProperty: "v", Unique: "s" }, ["Property"]);
      if (errParam("Select-Object", o)) { return []; }
      var res = objects.slice();
      var props = o.Property ? String(o.Property).split(",") : null;
      if (o.Skip) { res = res.slice(parseInt(o.Skip, 10) || 0); }
      if (o.First) { res = res.slice(0, parseInt(o.First, 10) || 0); }
      if (o.Last) { res = res.slice(-(parseInt(o.Last, 10) || 0)); }
      if (o.ExpandProperty) { res = res.map(function (x) { return propOf(x, o.ExpandProperty); }); }
      else if (props) {
        res = res.map(function (x) {
          var n = {};
          props.forEach(function (p) { n[p.trim()] = propOf(x, p.trim()); });
          return n;
        });
      }
      if (o.Unique) {
        var seen = {};
        res = res.filter(function (x) {
          var k = JSON.stringify(x);
          if (util.has(seen, k)) { return false; }
          seen[k] = true;
          return true;
        });
      }
      emit({ type: "select", property: o.Property || null, first: o.First || null });
      return res;
    };
    F["Sort-Object"] = function (args, objects) {
      var o = P(args, { Property: "v", Descending: "s", Unique: "s" }, ["Property"]);
      if (errParam("Sort-Object", o)) { return []; }
      var prop = o.Property;
      var res = objects.slice().sort(function (a, b) {
        var x = prop ? propOf(a, prop) : a, y = prop ? propOf(b, prop) : b;
        var nx = parseFloat(x), ny = parseFloat(y);
        if (!isNaN(nx) && !isNaN(ny) && String(x).trim() !== "" && String(y).trim() !== "") { return nx - ny; }
        return String(x).localeCompare(String(y), "es");
      });
      if (o.Descending) { res.reverse(); }
      emit({ type: "sort", property: prop || null, desc: !!o.Descending });
      return res;
    };
    F["Measure-Object"] = function (args, objects) {
      var o = P(args, { Property: "v", Sum: "s", Average: "s", Maximum: "s", Minimum: "s", Line: "s", Character: "s", Word: "s" }, ["Property"]);
      if (errParam("Measure-Object", o)) { return []; }
      var prop = o.Property;
      var vals = prop ? objects.map(function (x) { return parseFloat(propOf(x, prop)) || 0; }) : [];
      var res = { Count: objects.length, Average: "", Sum: "", Maximum: "", Minimum: "", Property: prop || "", __list: true };
      if (prop) {
        if (o.Sum) { res.Sum = vals.reduce(function (a, b) { return a + b; }, 0); }
        if (o.Average) { res.Average = vals.length ? Math.round(vals.reduce(function (a, b) { return a + b; }, 0) / vals.length * 100) / 100 : 0; }
        if (o.Maximum) { res.Maximum = Math.max.apply(null, vals); }
        if (o.Minimum) { res.Minimum = Math.min.apply(null, vals); }
      }
      emit({ type: "measure", property: prop || null, sum: !!o.Sum, average: !!o.Average, count: objects.length });
      return [res];
    };
    F["ForEach-Object"] = function (args, objects) {
      var m = /^\{\s*\$_\.?([A-Za-z0-9_.]*)\s*\}$/.exec(args.join(" ").trim());
      if (!m) {
        fail("ForEach-Object : (simulador) usa por ejemplo  ForEach-Object { $_.Name }");
        return [];
      }
      return objects.map(function (o) { return m[1] ? propOf(o, m[1]) : o; });
    };
    F["Group-Object"] = function (args, objects) {
      var o = P(args, { Property: "v", NoElement: "s" }, ["Property"]);
      if (errParam("Group-Object", o)) { return []; }
      var groups = {}, order = [];
      objects.forEach(function (x) {
        var k = fmtValue(propOf(x, o.Property));
        if (!util.has(groups, k)) { groups[k] = []; order.push(k); }
        groups[k].push(x);
      });
      emit({ type: "group", property: o.Property || null });
      return order.sort().map(function (k) { return { Count: groups[k].length, Name: k }; });
    };
    F["Format-Table"] = function (args, objects) {
      var o = P(args, { Property: "v", AutoSize: "s", Wrap: "s" }, ["Property"]);
      emit({ type: "format", kind: "table", property: o.Property || null });
      if (!o.Property) { return objects; }
      var props = String(o.Property).split(",");
      return objects.map(function (x) {
        var n = {};
        props.forEach(function (p) { n[p.trim()] = propOf(x, p.trim()); });
        return n;
      });
    };
    F["Format-List"] = function (args, objects) {
      var o = P(args, { Property: "v" }, ["Property"]);
      emit({ type: "format", kind: "list", property: o.Property || null });
      var props = o.Property ? String(o.Property).split(",") : null;
      return objects.map(function (x) {
        var n = {};
        (props || visibleKeys(x)).forEach(function (p) { n[String(p).trim()] = propOf(x, String(p).trim()); });
        n.__list = true;
        return n;
      });
    };
    F["Get-Member"] = function (args, objects) {
      emit({ type: "get-member", count: objects.length });
      if (!objects.length) { return []; }
      return visibleKeys(objects[0]).map(function (k) {
        return { Name: k, MemberType: "Property", Definition: (typeof objects[0][k]) + " " + k };
      });
    };
    ctx.objectFilters = F;

    /* ==========================================================
       Cmdlets del sistema de ficheros
       ========================================================== */
    C["Get-Location"] = function () {
      out([{ Path: vfs.join(ctx.cwd()) }]);
      emit({ type: "pwd", path: vfs.join(ctx.cwd()) });
    };

    C["Set-Location"] = function (args) {
      var o = P(args, { Path: "v", LiteralPath: "v" }, ["Path"]);
      if (errParam("Set-Location", o)) { return; }
      var target = o.Path || o.LiteralPath || (ctx.home ? ctx.home() : vfs.join([]));
      var loc = locate(target);
      if (!loc.node) { errNotFound("Set-Location", target); return; }
      if (loc.node.type !== "dir") { fail("Set-Location : La ruta de acceso '" + target + "' no es un directorio."); return; }
      if (!can(loc.node, "x") || !vfs.canReach(user(), loc.segs)) { errDenied("Set-Location", target); return; }
      ctx.setCwd(loc.segs);
      term.renderPrompt();
      emit({ type: "cd", path: vfs.join(loc.segs) });
    };

    C["Get-ChildItem"] = function (args) {
      var o = P(args, {
        Path: "v", Filter: "v", Include: "v", Exclude: "v",
        Recurse: "s", Force: "s", Directory: "s", File: "s", Name: "s", Hidden: "s"
      }, ["Path"]);
      if (errParam("Get-ChildItem", o)) { return; }
      var target = o.Path || ".";
      var loc = locate(target);
      var pattern = o.Filter || o.Include || null;
      /* Ruta con comodines: el último tramo filtra por nombre */
      if (!loc.node && /[*?]/.test(target)) {
        pattern = target.split(/[\\/]/).pop();
        loc = locate(target.replace(/[\\/][^\\/]*$/, "") || ".");
      }
      if (!loc.node) { errNotFound("Get-ChildItem", target); return; }
      if (!can(loc.node, "r")) { errDenied("Get-ChildItem", target); return; }
      var items = [];
      if (loc.node.type === "file") { items.push(fsObject(loc.node, loc.segs)); }
      else if (o.Recurse) {
        vfs.walk(loc.segs, function (n, segs) {
          if (segs.length !== loc.segs.length) { items.push(fsObject(n, segs)); }
        });
      } else {
        (vfs.list(vfs.join(loc.segs), []) || []).forEach(function (n) {
          items.push(fsObject(n, loc.segs.concat([n.name])));
        });
      }
      if (pattern) {
        var re = util.globToRe(String(pattern).toLowerCase());
        items = items.filter(function (i) { return re.test(i.Name.toLowerCase()); });
      }
      if (o.Exclude) {
        var rex = util.globToRe(String(o.Exclude).toLowerCase());
        items = items.filter(function (i) { return !rex.test(i.Name.toLowerCase()); });
      }
      if (o.Directory) { items = items.filter(function (i) { return i.__kind === "dir"; }); }
      if (o.File) { items = items.filter(function (i) { return i.__kind === "file"; }); }
      out(o.Name ? items.map(function (i) { return i.Name; }) : items);
      emit({
        type: "ls", path: vfs.join(loc.segs), recurse: !!o.Recurse,
        only: o.Directory ? "dir" : o.File ? "file" : null,
        filter: pattern || null, count: items.length
      });
    };

    C["Get-Item"] = function (args) {
      var o = P(args, { Path: "v" }, ["Path"]);
      if (errParam("Get-Item", o)) { return; }
      var loc = locate(o.Path || ".");
      if (!loc.node) { errNotFound("Get-Item", o.Path); return; }
      out([fsObject(loc.node, loc.segs)]);
      emit({ type: "get-item", path: vfs.join(loc.segs) });
    };

    C["Get-Content"] = function (args) {
      var o = P(args, { Path: "v", TotalCount: "v", Tail: "v", Head: "v", Raw: "s" }, ["Path"]);
      if (errParam("Get-Content", o)) { return; }
      if (!o.Path) { fail("Get-Content : Falta el parámetro obligatorio -Path."); return; }
      var loc = locate(o.Path);
      if (!loc.node) { errNotFound("Get-Content", o.Path); return; }
      if (loc.node.type === "dir") { fail("Get-Content : No se puede leer '" + o.Path + "' porque es un directorio."); return; }
      if (!can(loc.node, "r")) { errDenied("Get-Content", o.Path); return; }
      var lines = util.linesOf(loc.node.content);
      var head = o.TotalCount || o.Head;
      if (head) { lines = lines.slice(0, parseInt(head, 10) || 0); }
      if (o.Tail) { lines = lines.slice(-(parseInt(o.Tail, 10) || 0)); }
      out(lines);
      emit({
        type: "cat", path: vfs.join(loc.segs),
        head: head ? parseInt(head, 10) : null,
        tail: o.Tail ? parseInt(o.Tail, 10) : null
      });
    };

    function inheritFrom(parent, n) {
      if (!parent || !n || !n.inherit) { return; }
      n.aces = (parent.aces || []).map(function (a) {
        return { identity: a.identity, rights: a.rights, type: a.type, inherited: true };
      });
    }
    function writeContent(cmd, args, append) {
      var o = P(args, { Path: "v", Value: "v", Encoding: "v", Force: "s" }, ["Path", "Value"]);
      if (errParam(cmd, o)) { return; }
      if (!o.Path) { fail(cmd + " : Falta el parámetro obligatorio -Path."); return; }
      var loc = locate(o.Path);
      if (loc.node && loc.node.type === "dir") { fail(cmd + " : '" + o.Path + "' es un directorio."); return; }
      if (loc.node && !can(loc.node, "w")) { errDenied(cmd, o.Path); return; }
      var parent = vfs.get(vfs.join(loc.segs.slice(0, -1)), []);
      if (!parent) { errNotFound(cmd, o.Path); return; }
      if (!loc.node && !can(parent, "w")) { errDenied(cmd, o.Path); return; }
      var text = (append && loc.node ? loc.node.content : "") + (o.Value === undefined ? "" : o.Value) + "\n";
      var f = vfs.writeFile(o.Path, text, ctx.cwd(), { owner: user().name, group: user().group });
      if (!f) { errNotFound(cmd, o.Path); return; }
      f.mtime = now();
      if (!loc.node) { inheritFrom(parent, f); }
      emit({ type: "write", path: vfs.join(loc.segs), append: !!append });
    }
    C["Set-Content"] = function (args) { writeContent("Set-Content", args, false); };
    C["Add-Content"] = function (args) { writeContent("Add-Content", args, true); };

    C["New-Item"] = function (args) {
      var o = P(args, { Path: "v", ItemType: "v", Value: "v", Name: "v", Force: "s" }, ["Path"]);
      if (errParam("New-Item", o)) { return; }
      var target = o.Path;
      if (o.Name) { target = (target || ".") + "\\" + o.Name; }
      if (!target) { fail("New-Item : Falta el parámetro obligatorio -Path."); return; }
      var type = String(o.ItemType || "File").toLowerCase();
      if (type === "dir") { type = "directory"; }
      if (type !== "file" && type !== "directory") {
        fail("New-Item : No se admite el tipo de elemento '" + o.ItemType + "'. Usa File o Directory.");
        return;
      }
      var loc = locate(target);
      if (loc.node && !o.Force) {
        fail("New-Item : Ya existe un elemento con el nombre especificado '" + vfs.join(loc.segs) + "'.");
        return;
      }
      var parentSegs = loc.segs.slice(0, -1);
      var parent = vfs.get(vfs.join(parentSegs), []);
      if (!parent && type === "file") { errNotFound("New-Item", target); return; }
      if (parent && !can(parent, "w")) { errDenied("New-Item", target); return; }
      var n = type === "file"
        ? vfs.writeFile(target, o.Value ? o.Value + "\n" : "", ctx.cwd(), { owner: user().name, group: user().group })
        : vfs.mkdir(target, ctx.cwd(), { parents: true, owner: user().name, group: user().group });
      if (!n) { errNotFound("New-Item", target); return; }
      n.name = loc.segs[loc.segs.length - 1];
      n.mtime = now();
      inheritFrom(vfs.get(vfs.join(parentSegs), []), n);
      out([fsObject(n, loc.segs)]);
      emit({ type: type === "file" ? "touch" : "mkdir", path: vfs.join(loc.segs) });
    };

    C["Remove-Item"] = function (args) {
      var o = P(args, { Path: "v", Recurse: "s", Force: "s", Confirm: "s" }, ["Path"]);
      if (errParam("Remove-Item", o)) { return; }
      var targets = o.Path ? [o.Path].concat(o._.slice(1)) : o._;
      if (!targets.length) { fail("Remove-Item : Falta el parámetro obligatorio -Path."); return; }
      targets.forEach(function (t) {
        var loc = locate(t);
        if (!loc.node) { errNotFound("Remove-Item", t); return; }
        if (loc.node.type === "dir" && Object.keys(loc.node.children).length && !o.Recurse) {
          fail("Remove-Item : El elemento '" + vfs.join(loc.segs) + "' tiene elementos secundarios y no se especificó el parámetro Recurse.");
          return;
        }
        var parent = vfs.get(vfs.join(loc.segs.slice(0, -1)), []);
        if (parent && !can(parent, "w")) { errDenied("Remove-Item", t); return; }
        vfs.remove(t, ctx.cwd());
        emit({ type: "rm", path: vfs.join(loc.segs), recurse: !!o.Recurse });
      });
    };

    function copyMove(cmd, args) {
      var o = P(args, { Path: "v", Destination: "v", Recurse: "s", Force: "s" }, ["Path", "Destination"]);
      if (errParam(cmd, o)) { return; }
      if (!o.Path || !o.Destination) { fail(cmd + " : Faltan los parámetros -Path y -Destination."); return; }
      var s = locate(o.Path);
      if (!s.node) { errNotFound(cmd, o.Path); return; }
      if (!can(s.node, "r")) { errDenied(cmd, o.Path); return; }
      if (cmd === "Copy-Item" && s.node.type === "dir" && !o.Recurse && Object.keys(s.node.children).length) {
        fail("Copy-Item : '" + o.Path + "' es un directorio con contenido; añade -Recurse.");
        return;
      }
      var d = locate(o.Destination);
      var dParent = d.node && d.node.type === "dir" ? d.node : vfs.get(vfs.join(d.segs.slice(0, -1)), []);
      if (!dParent) { errNotFound(cmd, o.Destination); return; }
      if (!can(dParent, "w")) { errDenied(cmd, o.Destination); return; }
      var res = cmd === "Copy-Item" ? vfs.copy(o.Path, o.Destination, ctx.cwd()) : vfs.move(o.Path, o.Destination, ctx.cwd());
      if (!res) { errNotFound(cmd, o.Destination); return; }
      res.mtime = now();
      if (res.inherit) { inheritFrom(dParent, res); vfs.propagate(dParent); }
      emit({ type: cmd === "Copy-Item" ? "cp" : "mv", from: vfs.join(s.segs), to: vfs.join(d.segs) });
    }
    C["Copy-Item"] = function (args) { copyMove("Copy-Item", args); };
    C["Move-Item"] = function (args) { copyMove("Move-Item", args); };

    C["Rename-Item"] = function (args) {
      var o = P(args, { Path: "v", NewName: "v" }, ["Path", "NewName"]);
      if (errParam("Rename-Item", o)) { return; }
      if (!o.Path || !o.NewName) { fail("Rename-Item : Faltan los parámetros -Path y -NewName."); return; }
      var loc = locate(o.Path);
      if (!loc.node) { errNotFound("Rename-Item", o.Path); return; }
      var parent = vfs.get(vfs.join(loc.segs.slice(0, -1)), []);
      if (parent && !can(parent, "w")) { errDenied("Rename-Item", o.Path); return; }
      vfs.move(o.Path, vfs.join(loc.segs.slice(0, -1).concat([o.NewName])), ctx.cwd());
      emit({ type: "mv", from: vfs.join(loc.segs), to: o.NewName });
    };

    C["Test-Path"] = function (args) {
      var o = P(args, { Path: "v", PathType: "v" }, ["Path"]);
      if (errParam("Test-Path", o)) { return; }
      var n = vfs.get(o.Path, ctx.cwd());
      var ok = !!n;
      if (ok && o.PathType) {
        var want = String(o.PathType).toLowerCase();
        if (want === "container") { ok = n.type === "dir"; }
        if (want === "leaf") { ok = n.type === "file"; }
      }
      out([ok]);
      emit({ type: "test-path", path: o.Path, result: ok });
    };

    C["Select-String"] = function (args) {
      var o = P(args, { Pattern: "v", Path: "v", CaseSensitive: "s", SimpleMatch: "s", List: "s" }, ["Pattern", "Path"]);
      if (errParam("Select-String", o)) { return; }
      if (!o.Pattern) { fail("Select-String : Falta el parámetro obligatorio -Pattern."); return; }
      var paths = o.Path ? [o.Path].concat(o._.slice(2)) : [];
      if (!paths.length) { fail("Select-String : Falta el parámetro obligatorio -Path."); return; }
      var re = null;
      if (!o.SimpleMatch) { try { re = new RegExp(o.Pattern, o.CaseSensitive ? "" : "i"); } catch (e) { re = null; } }
      var res = [];
      function scan(n) {
        util.linesOf(n.content).forEach(function (l, i) {
          var hit = re ? re.test(l) : l.toLowerCase().indexOf(String(o.Pattern).toLowerCase()) !== -1;
          if (hit) { res.push({ Filename: n.name, LineNumber: i + 1, Line: l.trim() }); }
        });
      }
      paths.forEach(function (p) {
        var loc = locate(p);
        if (!loc.node) {
          if (/[*?]/.test(p)) {
            var dir = locate(p.replace(/[\\/][^\\/]*$/, "") || ".");
            var re2 = util.globToRe(p.split(/[\\/]/).pop().toLowerCase());
            (vfs.list(vfs.join(dir.segs), []) || []).forEach(function (n) {
              if (n.type === "file" && re2.test(n.name.toLowerCase())) { scan(n); }
            });
            return;
          }
          errNotFound("Select-String", p);
          return;
        }
        if (loc.node.type === "dir") { return; }
        if (!can(loc.node, "r")) { errDenied("Select-String", p); return; }
        scan(loc.node);
      });
      if (o.List) {
        var seen = {};
        res = res.filter(function (r) {
          if (util.has(seen, r.Filename)) { return false; }
          seen[r.Filename] = true;
          return true;
        });
      }
      out(res);
      emit({ type: "grep", pattern: o.Pattern });
    };

    /* ==========================================================
       Listas de control de acceso
       ========================================================== */
    function aclObject(n, path) {
      return {
        Path: path,
        Owner: n.owner,
        Herencia: n.inherit ? "Habilitada" : "Deshabilitada",
        Access: (n.aces || []).map(function (a) {
          return {
            IdentityReference: a.identity,
            FileSystemRights: a.rights,
            AccessControlType: a.type,
            IsInherited: !!a.inherited,
            Name: a.identity
          };
        }),
        __node: n,
        __list: true
      };
    }
    C["Get-Acl"] = function (args) {
      var o = P(args, { Path: "v" }, ["Path"]);
      if (errParam("Get-Acl", o)) { return; }
      var loc = locate(o.Path || ".");
      if (!loc.node) { errNotFound("Get-Acl", o.Path); return; }
      out([aclObject(loc.node, vfs.join(loc.segs))]);
      emit({ type: "getacl", path: vfs.join(loc.segs) });
    };
    /* En PowerShell real se construye un FileSystemAccessRule y se usa SetAccessRule;
       aquí se admite la forma abreviada, y para el día a día está icacls. */
    C["Set-Acl"] = function (args) {
      var o = P(args, {
        Path: "v", Identity: "v", Rights: "v", Type: "v", Remove: "v", Owner: "v",
        DisableInheritance: "s", EnableInheritance: "s"
      }, ["Path"]);
      if (errParam("Set-Acl", o)) { return; }
      if (!o.Path) { fail("Set-Acl : Falta el parámetro obligatorio -Path."); return; }
      var loc = locate(o.Path);
      if (!loc.node) { errNotFound("Set-Acl", o.Path); return; }
      if (!isAdmin() && loc.node.owner !== user().name) { errDenied("Set-Acl", o.Path); return; }
      if (o.DisableInheritance) {
        loc.node.inherit = false;
        (loc.node.aces || []).forEach(function (a) { a.inherited = false; });
        emit({ type: "inheritance", path: vfs.join(loc.segs), enabled: false });
      }
      if (o.EnableInheritance) {
        loc.node.inherit = true;
        vfs.propagate(vfs.get(vfs.join(loc.segs.slice(0, -1)), []));
        emit({ type: "inheritance", path: vfs.join(loc.segs), enabled: true });
      }
      if (o.Owner) { loc.node.owner = o.Owner; emit({ type: "owner", path: vfs.join(loc.segs), owner: o.Owner }); }
      if (o.Remove) { vfs.removeAce(loc.node, o.Remove); emit({ type: "removeacl", path: vfs.join(loc.segs), identity: o.Remove }); }
      if (o.Identity) {
        var rights = o.Rights || "Read";
        if (RIGHTS.indexOf(rights) === -1) {
          fail("Set-Acl : Derechos no válidos: '" + rights + "'. Valores admitidos: " + RIGHTS.join(", ") + ".");
          return;
        }
        vfs.setAce(loc.node, o.Identity, rights, o.Type === "Deny" ? "Deny" : "Allow");
        emit({ type: "setacl", path: vfs.join(loc.segs), identity: o.Identity, rights: rights, deny: o.Type === "Deny", tool: "Set-Acl" });
      }
      vfs.propagate(loc.node);
    };
    /* icacls ruta [/grant[:r] Usuario:(F|M|RX|R|W)] [/deny …] [/remove Usuario]
              [/inheritance:d|e|r] [/setowner Usuario] [/T] */
    C.icacls = function (args) {
      var target = args[0];
      if (!target) {
        fail("icacls : sintaxis: icacls <ruta> [/grant Usuario:(permisos)] [/deny …] [/remove Usuario] [/inheritance:d|e] [/T]");
        return;
      }
      var loc = locate(target);
      if (!loc.node) {
        fail(target + ": No se encuentra la ruta de acceso especificada.");
        fail("Se procesaron correctamente 0 archivos; error al procesar 1 archivos");
        return;
      }
      var path = vfs.join(loc.segs);
      if (args.length === 1) {
        var aces = loc.node.aces || [];
        if (!aces.length) { pre(path); }
        aces.forEach(function (a, i) {
          var label = (a.type === "Deny" ? "(DENY)" : "") + (a.inherited ? "(I)" : "") + "(" + (SHORT[a.rights] || a.rights) + ")";
          pre((i === 0 ? path + " " : " ".repeat(path.length + 1)) + a.identity + ":" + label);
        });
        pre("");
        pre("Se procesaron correctamente 1 archivos; error al procesar 0 archivos");
        emit({ type: "getacl", path: path, tool: "icacls" });
        return;
      }
      if (!isAdmin() && loc.node.owner !== user().name) {
        fail(path + ": Acceso denegado.");
        fail("Se procesaron correctamente 0 archivos; error al procesar 1 archivos");
        return;
      }
      for (var i = 1; i < args.length; i++) {
        var a = args[i], m;
        if (/^\/grant(:r)?$/i.test(a) || /^\/deny$/i.test(a)) {
          var deny = /^\/deny$/i.test(a);
          var reset = /:r$/i.test(a);
          var spec = args[++i] || "";
          m = /^([^:]+):\(?([^)]*)\)?$/.exec(spec);
          if (!m) { fail("Parámetro no válido \"" + spec + "\""); return; }
          var rights = LONG[String(m[2]).toUpperCase()] || m[2];
          if (RIGHTS.indexOf(rights) === -1) {
            fail("Parámetro no válido \"" + spec + "\": los permisos admitidos son F, M, RX, R y W");
            return;
          }
          if (reset) { vfs.removeAce(loc.node, m[1]); }
          vfs.setAce(loc.node, m[1], rights, deny ? "Deny" : "Allow");
          emit({ type: "setacl", path: path, identity: m[1], rights: rights, deny: deny, tool: "icacls" });
        } else if (/^\/remove(:[gd])?$/i.test(a)) {
          var who = args[++i];
          vfs.removeAce(loc.node, who);
          emit({ type: "removeacl", path: path, identity: who, tool: "icacls" });
        } else if (/^\/inheritance:d$/i.test(a)) {
          loc.node.inherit = false;
          (loc.node.aces || []).forEach(function (ace) { ace.inherited = false; });
          emit({ type: "inheritance", path: path, enabled: false });
        } else if (/^\/inheritance:r$/i.test(a)) {
          loc.node.inherit = false;
          loc.node.aces = (loc.node.aces || []).filter(function (ace) { return !ace.inherited; });
          emit({ type: "inheritance", path: path, enabled: false, removed: true });
        } else if (/^\/inheritance:e$/i.test(a)) {
          loc.node.inherit = true;
          vfs.propagate(vfs.get(vfs.join(loc.segs.slice(0, -1)), []));
          emit({ type: "inheritance", path: path, enabled: true });
        } else if (/^\/setowner$/i.test(a)) {
          loc.node.owner = args[++i];
          emit({ type: "owner", path: path, owner: loc.node.owner });
        } else if (!/^\/(t|c|q|l)$/i.test(a)) {
          fail("Parámetro no válido \"" + a + "\"");
          return;
        }
      }
      vfs.propagate(loc.node);
      pre("archivo procesado: " + path);
      pre("Se procesaron correctamente 1 archivos; error al procesar 0 archivos");
    };
    /* takeown usa la sintaxis clásica con barra: /F ruta [/R] [/A] */
    C.takeown = function (args) {
      var target = null, alGrupo = false, rec = false;
      for (var i = 0; i < args.length; i++) {
        if (/^\/f$/i.test(args[i])) { target = args[++i]; }
        else if (/^\/a$/i.test(args[i])) { alGrupo = true; }
        else if (/^\/r$/i.test(args[i])) { rec = true; }
        else if (args[i].charAt(0) !== "/" && !target) { target = args[i]; }
      }
      if (!target) { fail("takeown : sintaxis: takeown /F <ruta> [/R] [/A]"); return; }
      if (!isAdmin()) { errAdmin("takeown"); return; }
      var loc = locate(target);
      if (!loc.node) { fail("ERROR: no se encuentra el archivo \"" + target + "\"."); return; }
      loc.node.owner = alGrupo ? "Administradores" : user().name;
      if (rec && loc.node.type === "dir") {
        vfs.walk(loc.segs, function (n) { n.owner = loc.node.owner; });
      }
      pre("CORRECTO: el archivo (o carpeta) \"" + vfs.join(loc.segs) + "\" pertenece ahora al usuario \"" + loc.node.owner + "\".");
      emit({ type: "owner", path: vfs.join(loc.segs), owner: loc.node.owner, tool: "takeown" });
    };

    /* ==========================================================
       Utilidades, ayuda y edición
       ========================================================== */
    C["Write-Output"] = function (args) { out([args.join(" ")]); };
    C["Write-Host"] = function (args) {
      var o = P(args, { Object: "v", ForegroundColor: "v", NoNewline: "s" }, []);
      pre(o._.join(" ") || String(o.Object || ""));
    };
    C["Clear-Host"] = function () { term.clear(); };
    C["Get-Date"] = function (args) {
      var o = P(args, { Format: "v", UFormat: "v" }, ["Format"]);
      var d = new Date(now());
      if (o.Format) {
        out([String(o.Format)
          .replace(/yyyy/g, d.getFullYear())
          .replace(/MM/g, util.pad2(d.getMonth() + 1))
          .replace(/dd/g, util.pad2(d.getDate()))
          .replace(/HH/g, util.pad2(d.getHours()))
          .replace(/mm/g, util.pad2(d.getMinutes()))
          .replace(/ss/g, util.pad2(d.getSeconds()))]);
        return;
      }
      out([{ DateTime: util.fmtDateEs(d, ""), __list: true }]);
      emit({ type: "date" });
    };
    C["Get-History"] = function () {
      out(term.history.map(function (h, i) { return { Id: i + 1, CommandLine: h }; }));
      emit({ type: "history" });
    };
    C["Get-Command"] = function (args) {
      var o = P(args, { Name: "v", Verb: "v", Noun: "v", Module: "v" }, ["Name"]);
      if (errParam("Get-Command", o)) { return; }
      var re = o.Name ? util.globToRe(String(o.Name).toLowerCase()) : null;
      var names = Object.keys(C).filter(function (n) { return n.indexOf("-") !== -1; }).concat(Object.keys(F));
      if (ctx.extra) { names = names.concat(Object.keys(ctx.extra).filter(function (n) { return n.indexOf("-") !== -1; })); }
      var res = names.sort().filter(function (n) {
        if (re && !re.test(n.toLowerCase())) { return false; }
        if (o.Verb && n.split("-")[0].toLowerCase() !== String(o.Verb).toLowerCase()) { return false; }
        if (o.Noun && n.split("-")[1].toLowerCase() !== String(o.Noun).toLowerCase()) { return false; }
        return true;
      }).map(function (n) { return { CommandType: "Cmdlet", Name: n, Version: "7.4.0.0", Source: "Microsoft.PowerShell" }; });
      out(res);
      emit({ type: "get-command", pattern: o.Name || null, verb: o.Verb || null, noun: o.Noun || null, count: res.length });
    };
    C["Get-Alias"] = function (args) {
      var o = P(args, { Name: "v", Definition: "v" }, ["Name"]);
      var res = Object.keys(ALIAS).sort().filter(function (a) {
        if (o.Name && a.toLowerCase() !== String(o.Name).toLowerCase()) { return false; }
        if (o.Definition && ALIAS[a].toLowerCase() !== String(o.Definition).toLowerCase()) { return false; }
        return true;
      }).map(function (a) { return { CommandType: "Alias", Name: a + " -> " + ALIAS[a], Definition: ALIAS[a] }; });
      if (!res.length) { fail("Get-Alias : No se encuentra ningún elemento con el nombre '" + (o.Name || o.Definition) + "'."); return; }
      out(res);
      emit({ type: "get-alias", name: o.Name || null });
    };
    C["Get-Help"] = function (args) {
      var o = P(args, { Name: "v", Examples: "s", Full: "s", Detailed: "s", Online: "s" }, ["Name"]);
      /* Sin nombre, Get-Help (y su alias help) muestra una visión general */
      if (!o.Name) {
        if (ctx.onHelpOverview) { ctx.onHelpOverview(); }
        else { fail("Get-Help : Indica el nombre del comando del que quieres ayuda."); }
        return;
      }
      var key = canonical(o.Name);
      var page = (ctx.man || {})[key] || (ctx.man || {})[o.Name];
      if (!page) { fail("Get-Help : No se encuentra la Ayuda para el tema '" + o.Name + "'."); return; }
      RG.man.renderPs(term, key, page, { examples: !!o.Examples });
      if (ctx.onMan) { ctx.onMan(key); }
      emit({ type: "get-help", name: key });
    };
    C.notepad = function (args) {
      var p = args[0];
      if (!p) { fail("notepad : indica el archivo que quieres editar."); return; }
      var loc = locate(p);
      if (loc.node && loc.node.type === "dir") { fail("notepad : '" + p + "' es un directorio."); return; }
      if (loc.node && !can(loc.node, "r")) { errDenied("notepad", p); return; }
      var parent = vfs.get(vfs.join(loc.segs.slice(0, -1)), []);
      if (!loc.node && !parent) { errNotFound("notepad", p); return; }
      ctx.editor.open(vfs.join(loc.segs), loc.node ? loc.node.content : "", function (text, saved) {
        if (!saved) { return; }
        if (loc.node && !can(loc.node, "w")) { errDenied("notepad", p); return; }
        if (!loc.node && !can(parent, "w")) { errDenied("notepad", p); return; }
        var f = vfs.writeFile(p, text, ctx.cwd(), { owner: user().name, group: user().group });
        if (!f) { errNotFound("notepad", p); return; }
        f.mtime = now();
        if (!loc.node) { inheritFrom(parent, f); }
        emit({ type: "edit", path: vfs.join(loc.segs) });
      });
    };

    /* ==========================================================
       Alias y resolución de nombres
       ========================================================== */
    var ALIAS = {
      ls: "Get-ChildItem", dir: "Get-ChildItem", gci: "Get-ChildItem",
      cd: "Set-Location", sl: "Set-Location", chdir: "Set-Location",
      pwd: "Get-Location", gl: "Get-Location", gi: "Get-Item",
      cat: "Get-Content", gc: "Get-Content", type: "Get-Content",
      sc: "Set-Content", ac: "Add-Content",
      ni: "New-Item", md: "New-Item", mkdir: "New-Item",
      rm: "Remove-Item", del: "Remove-Item", erase: "Remove-Item", rd: "Remove-Item", ri: "Remove-Item",
      cp: "Copy-Item", copy: "Copy-Item", cpi: "Copy-Item",
      mv: "Move-Item", move: "Move-Item", mi: "Move-Item",
      ren: "Rename-Item", rni: "Rename-Item",
      echo: "Write-Output", write: "Write-Output",
      cls: "Clear-Host", clear: "Clear-Host",
      sls: "Select-String", findstr: "Select-String",
      where: "Where-Object", "?": "Where-Object",
      select: "Select-Object", sort: "Sort-Object", measure: "Measure-Object",
      foreach: "ForEach-Object", "%": "ForEach-Object", group: "Group-Object",
      ft: "Format-Table", fl: "Format-List", gm: "Get-Member",
      man: "Get-Help", help: "Get-Help", gcm: "Get-Command", gal: "Get-Alias",
      history: "Get-History", h: "Get-History", date: "Get-Date"
    };
    var canonicalMap = null;
    function buildMap() {
      canonicalMap = {};
      Object.keys(C).forEach(function (n) { canonicalMap[n.toLowerCase()] = n; });
      Object.keys(F).forEach(function (n) { canonicalMap[n.toLowerCase()] = n; });
      if (ctx.extra) { Object.keys(ctx.extra).forEach(function (n) { canonicalMap[n.toLowerCase()] = n; }); }
      Object.keys(ALIAS).forEach(function (a) { canonicalMap[a.toLowerCase()] = ALIAS[a]; });
    }
    /* Nombre real de un comando a partir de un alias o de otra caja */
    function canonical(name) {
      if (!canonicalMap) { buildMap(); }
      return util.has(canonicalMap, String(name).toLowerCase()) ? canonicalMap[String(name).toLowerCase()] : name;
    }
    ctx.canonical = canonical;
    ctx.aliases = ALIAS;
    ctx.rebuildNames = function () { canonicalMap = null; };
    /* Nombres para autocompletar con el tabulador */
    ctx.commandNames = function () {
      var names = Object.keys(C).concat(Object.keys(F)).concat(Object.keys(ALIAS));
      if (ctx.extra) { names = names.concat(Object.keys(ctx.extra)); }
      return names.filter(function (n) { return n.indexOf("__") !== 0; }).sort();
    };
    /* Resolución para el shell: alias y mayúsculas indiferentes */
    ctx.resolve = function (name) {
      var real = canonical(name);
      if (util.has(C, real) && real.indexOf("__") !== 0) { return C[real]; }
      if (ctx.extra && util.has(ctx.extra, real)) { return ctx.extra[real]; }
      if (util.has(F, real)) {
        /* Un filtro usado como primera orden trabaja sobre una lista vacía */
        return function (args) { out(F[real](args, ctx.shell.objects || [])); };
      }
      return null;
    };
    /* Resolución de los filtros de la tubería de objetos */
    ctx.resolveFilter = function (name) {
      var real = canonical(name);
      return util.has(F, real) ? F[real] : null;
    };
    /* Mensaje propio de PowerShell cuando el comando no existe */
    ctx.notFound = function (name) {
      fail(name + " : El término '" + name + "' no se reconoce como nombre de un cmdlet, función, archivo de script o programa ejecutable.");
      term.note("Compruebe si escribió correctamente el nombre o, si incluyó una ruta de acceso, compruebe que dicha ruta es correcta e inténtelo de nuevo.");
    };
    ctx.filters = F;
    return C;
  };
})(this);
