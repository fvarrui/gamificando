/* ==========================================================
   RG.VFS · Sistema de ficheros virtual
   Sirve para los retos de Linux (rutas POSIX, permisos rwx y
   ACL POSIX) y para los de Windows (rutas C:\…, ACE y herencia).
   ========================================================== */
(function (global) {
  "use strict";
  var RG = global.RG, util = RG.util;

  var RIGHTS = { FullControl: "rwx", Modify: "rwx", Write: "w", ReadAndExecute: "rx", Read: "r", ListDirectory: "rx" };

  RG.VFS = function (cfg) {
    cfg = cfg || {};
    var sep = cfg.sep || "/";
    var drive = cfg.drive || "";        // "C:" en Windows, "" en POSIX
    var win = cfg.model === "win";
    var vfs = { sep: sep, drive: drive, win: win };

    /* ---------------- Nodos ---------------- */
    function node(type, extra) {
      var n = {
        type: type,
        children: type === "dir" ? {} : null,
        content: type === "file" ? "" : null,
        owner: cfg.defaultOwner || "root",
        group: cfg.defaultGroup || "root",
        mode: type === "dir" ? 0o755 : 0o644,
        acl: null,                      // ACL POSIX: [{kind:'user'|'group', name, perms}]
        dacl: null,                     // ACL por omisión de un directorio: la heredan sus hijos
        aces: null,                     // ACE de Windows: [{identity, rights, type, inherited}]
        inherit: true,                  // herencia de permisos (Windows)
        mtime: cfg.now ? cfg.now() : Date.now()
      };
      /* Solo se copian los valores definidos: así un mode ausente no
         deja el nodo sin permisos */
      for (var k in extra) { if (util.has(extra, k) && extra[k] !== undefined) { n[k] = extra[k]; } }
      return n;
    }
    vfs.newNode = node;
    vfs.root = node("dir", { owner: cfg.defaultOwner || "root", group: cfg.defaultGroup || "root", mode: 0o755 });

    /* ---------------- Rutas ---------------- */
    vfs.isAbsolute = function (p) {
      return win ? /^[a-zA-Z]:[\\/]/.test(p) || /^[\\/]/.test(p) : p.charAt(0) === "/";
    };
    vfs.split = function (p) {
      return String(p).split(/[\\/]+/).filter(function (s) { return s !== "" && s !== "."; });
    };
    vfs.join = function (segs) {
      if (!segs.length) { return win ? drive + "\\" : "/"; }
      return win ? drive + "\\" + segs.join("\\") : "/" + segs.join("/");
    };
    /* Convierte una ruta (absoluta o relativa a cwd) en segmentos normalizados */
    vfs.norm = function (p, cwd) {
      p = String(p == null ? "" : p).trim().replace(/^"(.*)"$/, "$1");
      if (p === "~" || p.indexOf("~" + sep) === 0 || p.indexOf("~/") === 0) {
        p = (cfg.home ? cfg.home() : "/") + p.slice(1);
      }
      var segs;
      if (vfs.isAbsolute(p)) { segs = vfs.split(p.replace(/^[a-zA-Z]:/, "")); }
      else { segs = (cwd || []).slice().concat(vfs.split(p)); }
      var out = [];
      segs.forEach(function (s) {
        if (s === "..") { out.pop(); } else { out.push(s); }
      });
      return out;
    };
    /* Busca un nodo: devuelve {node, parent, name, segs, path} (node = null si no existe) */
    vfs.locate = function (p, cwd) {
      var segs = vfs.norm(p, cwd);
      var cur = vfs.root, parent = null;
      for (var i = 0; i < segs.length; i++) {
        if (!cur || cur.type !== "dir" || !util.has(cur.children, segs[i])) {
          return { node: null, parent: i === segs.length - 1 ? cur : null, name: segs[i], segs: segs, path: vfs.join(segs) };
        }
        parent = cur;
        cur = cur.children[segs[i]];
      }
      return { node: cur, parent: parent, name: segs[segs.length - 1] || vfs.join([]), segs: segs, path: vfs.join(segs) };
    };
    vfs.get = function (p, cwd) { return vfs.locate(p, cwd).node; };
    vfs.exists = function (p, cwd) { return !!vfs.get(p, cwd); };

    /* ---------------- Creación y modificación ---------------- */
    /* Un directorio con ACL por omisión se la pasa a lo que se cree dentro:
       es la forma de que todo el equipo siga teniendo acceso a los ficheros
       nuevos de una carpeta compartida. */
    vfs.applyDefaults = function (parent, n) {
      if (!parent || !n) { return; }
      /* SGID en el directorio: lo que se crea dentro hereda su grupo */
      if (parent.mode & 0o2000) {
        n.group = parent.group;
        if (n.type === "dir") { n.mode |= 0o2000; }
      }
      if (!parent.dacl || !parent.dacl.length) { return; }
      n.acl = parent.dacl.map(function (e) { return { kind: e.kind, name: e.name, perms: e.perms }; });
      if (n.type === "dir") {
        n.dacl = parent.dacl.map(function (e) { return { kind: e.kind, name: e.name, perms: e.perms }; });
      }
    };
    vfs.mkdir = function (p, cwd, opts) {
      opts = opts || {};
      var segs = vfs.norm(p, cwd), cur = vfs.root;
      for (var i = 0; i < segs.length; i++) {
        if (!util.has(cur.children, segs[i])) {
          if (!opts.parents && i < segs.length - 1) { return null; }
          cur.children[segs[i]] = node("dir", { owner: opts.owner, group: opts.group, mode: opts.mode });
          cur.children[segs[i]].name = segs[i];
          vfs.applyDefaults(cur, cur.children[segs[i]]);
        } else if (cur.children[segs[i]].type !== "dir") { return null; }
        cur = cur.children[segs[i]];
      }
      return cur;
    };
    vfs.writeFile = function (p, content, cwd, opts) {
      opts = opts || {};
      var loc = vfs.locate(p, cwd);
      if (loc.node) {
        if (loc.node.type !== "file") { return null; }
        loc.node.content = content;
        loc.node.mtime = cfg.now ? cfg.now() : Date.now();
        return loc.node;
      }
      var parentSegs = loc.segs.slice(0, -1);
      var parent = vfs.get(vfs.join(parentSegs), []);
      if (!parent || parent.type !== "dir") { return null; }
      var f = node("file", { content: content, owner: opts.owner, group: opts.group, mode: opts.mode });
      f.name = loc.segs[loc.segs.length - 1];
      parent.children[f.name] = f;
      vfs.applyDefaults(parent, f);
      return f;
    };
    vfs.readFile = function (p, cwd) {
      var n = vfs.get(p, cwd);
      return n && n.type === "file" ? n.content : null;
    };
    vfs.remove = function (p, cwd) {
      var loc = vfs.locate(p, cwd);
      if (!loc.node || !loc.parent) { return false; }
      delete loc.parent.children[loc.segs[loc.segs.length - 1]];
      return true;
    };
    vfs.copy = function (from, to, cwd) {
      var src = vfs.locate(from, cwd);
      if (!src.node) { return null; }
      var clone = JSON.parse(JSON.stringify(src.node));
      return vfs.place(clone, to, cwd, src.segs[src.segs.length - 1]);
    };
    vfs.move = function (from, to, cwd) {
      var src = vfs.locate(from, cwd);
      if (!src.node) { return null; }
      var placed = vfs.place(src.node, to, cwd, src.segs[src.segs.length - 1]);
      if (placed) { delete src.parent.children[src.segs[src.segs.length - 1]]; }
      return placed;
    };
    /* Coloca un nodo en destino: si el destino es un directorio, dentro de él */
    vfs.place = function (n, to, cwd, defaultName) {
      var dst = vfs.locate(to, cwd);
      if (dst.node && dst.node.type === "dir") {
        n.name = defaultName;
        dst.node.children[defaultName] = n;
        return n;
      }
      var parent = vfs.get(vfs.join(dst.segs.slice(0, -1)), []);
      if (!parent || parent.type !== "dir") { return null; }
      n.name = dst.segs[dst.segs.length - 1];
      parent.children[n.name] = n;
      return n;
    };
    vfs.list = function (p, cwd) {
      var n = vfs.get(p, cwd);
      if (!n || n.type !== "dir") { return null; }
      return util.sortedKeys(n.children).map(function (name) {
        var c = n.children[name];
        c.name = name;
        return c;
      });
    };
    /* Recorre el árbol entero: fn(nodo, rutaSegmentos) */
    vfs.walk = function (startSegs, fn) {
      var start = vfs.get(vfs.join(startSegs || []), []);
      (function rec(n, segs) {
        if (!n) { return; }
        fn(n, segs);
        if (n.type === "dir") {
          util.sortedKeys(n.children).forEach(function (name) {
            n.children[name].name = name;
            rec(n.children[name], segs.concat([name]));
          });
        }
      })(start, (startSegs || []).slice());
    };

    /* ---------------- Permisos ---------------- */
    /* Los bits especiales se ven en el lugar de la x: s (SUID/SGID) y t (sticky) */
    vfs.modeString = function (n) {
      var m = n.mode, s = n.type === "dir" ? "d" : "-";
      var special = [m & 0o4000, m & 0o2000, m & 0o1000];
      [(m >> 6) & 7, (m >> 3) & 7, m & 7].forEach(function (bits, i) {
        s += (bits & 4 ? "r" : "-") + (bits & 2 ? "w" : "-");
        var letra = i === 2 ? "t" : "s";
        if (special[i]) { s += bits & 1 ? letra : letra.toUpperCase(); }
        else { s += bits & 1 ? "x" : "-"; }
      });
      return s + ((n.acl && n.acl.length) || (n.dacl && n.dacl.length) ? "+" : "");
    };
    vfs.parseMode = function (spec, current, isDir) {
      if (/^[0-7]{3,4}$/.test(spec)) { return parseInt(spec, 8) & 0o7777; }
      var m = current;
      var ok = false;
      String(spec).split(",").forEach(function (part) {
        var mm = /^([ugoa]*)([+\-=])([rwxXst]*)$/.exec(part.trim());
        if (!mm) { return; }
        ok = true;
        var who = mm[1] || "a", op = mm[2], perms = mm[3];
        /* Bits especiales: u+s (SUID), g+s (SGID) y +t (sticky) */
        if (perms.indexOf("s") !== -1) {
          var suid = (who.indexOf("u") !== -1 || who.indexOf("a") !== -1) ? 0o4000 : 0;
          var sgid = (who.indexOf("g") !== -1 || who.indexOf("a") !== -1) ? 0o2000 : 0;
          if (op === "-") { m &= ~(suid | sgid); } else { m |= suid | sgid; }
        }
        if (perms.indexOf("t") !== -1) {
          if (op === "-") { m &= ~0o1000; } else { m |= 0o1000; }
        }
        var bits = 0;
        if (perms.indexOf("r") !== -1) { bits |= 4; }
        if (perms.indexOf("w") !== -1) { bits |= 2; }
        if (perms.indexOf("x") !== -1 || (perms.indexOf("X") !== -1 && isDir)) { bits |= 1; }
        if (!/[rwxX]/.test(perms)) { return; }
        var targets = [];
        if (who.indexOf("a") !== -1) { targets = [6, 3, 0]; }
        else {
          if (who.indexOf("u") !== -1) { targets.push(6); }
          if (who.indexOf("g") !== -1) { targets.push(3); }
          if (who.indexOf("o") !== -1) { targets.push(0); }
        }
        targets.forEach(function (shift) {
          if (op === "+") { m |= bits << shift; }
          else if (op === "-") { m &= ~(bits << shift); }
          else { m = (m & ~(7 << shift)) | (bits << shift); }
        });
      });
      return ok ? m & 0o7777 : null;
    };

    /* Permisos efectivos de un usuario sobre un nodo: cadena con r, w y/o x */
    vfs.effective = function (user, n) {
      if (!user) { return ""; }
      if (win) { return winEffective(user, n); }
      if (user.uid === 0 || user.name === "root") { return "rwx"; }
      var perms;
      if (n.owner === user.name) { perms = bitsToStr((n.mode >> 6) & 7); }
      else {
        var entry = (n.acl || []).filter(function (e) { return e.kind === "user" && e.name === user.name; })[0];
        var groups = [user.group].concat(user.groups || []);
        if (entry) { perms = maskAnd(entry.perms, n); }
        else {
          var gEntries = (n.acl || []).filter(function (e) { return e.kind === "group" && groups.indexOf(e.name) !== -1; });
          if (groups.indexOf(n.group) !== -1 || gEntries.length) {
            var best = groups.indexOf(n.group) !== -1 ? bitsToStr((n.mode >> 3) & 7) : "";
            gEntries.forEach(function (e) { best = union(best, maskAnd(e.perms, n)); });
            perms = n.acl && n.acl.length ? maskAnd(best, n) : best;
          } else { perms = bitsToStr(n.mode & 7); }
        }
      }
      return perms;
    };
    function bitsToStr(b) { return (b & 4 ? "r" : "") + (b & 2 ? "w" : "") + (b & 1 ? "x" : ""); }
    function union(a, b) { return "rwx".split("").filter(function (c) { return a.indexOf(c) !== -1 || b.indexOf(c) !== -1; }).join(""); }
    function maskAnd(perms, n) {
      var mask = (n.acl || []).filter(function (e) { return e.kind === "mask"; })[0];
      if (!mask) { return perms; }
      return "rwx".split("").filter(function (c) { return perms.indexOf(c) !== -1 && mask.perms.indexOf(c) !== -1; }).join("");
    }

    function winEffective(user, n) {
      var ids = [user.name].concat(user.groups || []);
      if (ids.indexOf("Administradores") !== -1 || user.name === "SYSTEM") { return "rwx"; }
      var allow = "", deny = "";
      (n.aces || []).forEach(function (ace) {
        if (ids.indexOf(ace.identity) === -1 && ace.identity !== "Todos") { return; }
        var r = RIGHTS[ace.rights] || "";
        if (ace.type === "Deny") { deny = union(deny, r); } else { allow = union(allow, r); }
      });
      return "rwx".split("").filter(function (c) { return allow.indexOf(c) !== -1 && deny.indexOf(c) === -1; }).join("");
    }

    vfs.can = function (user, n, perm) { return vfs.effective(user, n).indexOf(perm) !== -1; };
    /* ¿Puede el usuario atravesar todos los directorios hasta esa ruta? */
    vfs.canReach = function (user, segs) {
      var cur = vfs.root;
      if (!vfs.can(user, cur, "x")) { return false; }
      for (var i = 0; i < segs.length - 1; i++) {
        cur = cur.children[segs[i]];
        if (!cur || !vfs.can(user, cur, "x")) { return false; }
      }
      return true;
    };

    /* ---------------- ACL ---------------- */
    vfs.setAcl = function (n, kind, name, perms) {
      n.acl = n.acl || [];
      var e = n.acl.filter(function (x) { return x.kind === kind && x.name === name; })[0];
      if (e) { e.perms = perms; } else { n.acl.push({ kind: kind, name: name, perms: perms }); }
      if (!n.acl.filter(function (x) { return x.kind === "mask"; }).length) {
        n.acl.push({ kind: "mask", name: "", perms: "rwx" });
      }
      return n.acl;
    };
    vfs.removeAcl = function (n, kind, name) {
      if (!n.acl) { return; }
      n.acl = n.acl.filter(function (x) { return !(x.kind === kind && x.name === name); });
      if (!n.acl.filter(function (x) { return x.kind !== "mask"; }).length) { n.acl = null; }
    };
    /* ACL por omisión (solo tiene sentido en directorios) */
    vfs.setDefaultAcl = function (n, kind, name, perms) {
      n.dacl = n.dacl || [];
      var e = n.dacl.filter(function (x) { return x.kind === kind && x.name === name; })[0];
      if (e) { e.perms = perms; } else { n.dacl.push({ kind: kind, name: name, perms: perms }); }
      if (!n.dacl.filter(function (x) { return x.kind === "mask"; }).length) {
        n.dacl.push({ kind: "mask", name: "", perms: "rwx" });
      }
      return n.dacl;
    };
    vfs.clearDefaultAcl = function (n) { n.dacl = null; };
    vfs.setAce = function (n, identity, rights, type) {
      n.aces = n.aces || [];
      var e = n.aces.filter(function (a) { return a.identity === identity && a.type === (type || "Allow") && !a.inherited; })[0];
      if (e) { e.rights = rights; } else { n.aces.push({ identity: identity, rights: rights, type: type || "Allow", inherited: false }); }
      return n.aces;
    };
    vfs.removeAce = function (n, identity) {
      if (!n.aces) { return; }
      n.aces = n.aces.filter(function (a) { return a.identity !== identity || a.inherited; });
    };
    /* Propaga a los hijos los permisos heredables (Windows) */
    vfs.propagate = function (n) {
      if (!n || n.type !== "dir") { return; }
      util.sortedKeys(n.children).forEach(function (name) {
        var c = n.children[name];
        if (c.inherit) {
          c.aces = (n.aces || []).map(function (a) {
            return { identity: a.identity, rights: a.rights, type: a.type, inherited: true };
          }).concat((c.aces || []).filter(function (a) { return !a.inherited; }));
          vfs.propagate(c);
        }
      });
    };

    /* ---------------- Utilidades ---------------- */
    vfs.size = function (n) { return n.type === "dir" ? 4096 : (n.content || "").length; };
    vfs.count = function (n) {
      var total = 0;
      if (n.type !== "dir") { return 0; }
      util.sortedKeys(n.children).forEach(function () { total++; });
      return total;
    };
    /* Crea un árbol a partir de una descripción compacta:
       { "/srv/datos": {dir:true, owner:"root", mode:0o755},
         "/srv/datos/nota.txt": {content:"…", owner:"ana"} } */
    vfs.build = function (spec) {
      Object.keys(spec).forEach(function (p) {
        var d = spec[p];
        var n = d.dir
          ? vfs.mkdir(p, [], { parents: true, owner: d.owner, group: d.group, mode: d.mode })
          : vfs.writeFile(p, d.content || "", [], { owner: d.owner, group: d.group, mode: d.mode });
        if (!n) { return; }
        if (d.acl) { n.acl = d.acl; }
        if (d.aces) { n.aces = d.aces; }
        if (d.inherit === false) { n.inherit = false; }
        if (d.mtime) { n.mtime = d.mtime; }
      });
      return vfs;
    };
    return vfs;
  };
})(this);
