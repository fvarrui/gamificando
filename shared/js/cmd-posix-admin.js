/* ==========================================================
   RG.PosixAdminCommands · Administración en Linux
   Usuarios y grupos (useradd, usermod, groupadd, gpasswd…),
   servicios (systemctl, journalctl) y procesos.
   ========================================================== */
(function (global) {
  "use strict";
  var RG = global.RG, util = RG.util;

  RG.PosixAdminCommands = function (ctx) {
    var term = ctx.term, sys = ctx.sys, vfs = ctx.vfs;
    var pre = term.pre, rich = term.rich, fail = term.fail;
    var parseArgs = RG.parseArgs, last = RG.lastOf;
    var C = {};

    function user() { return ctx.user(); }
    function emit(ev) { if (ctx.emit) { ctx.emit(ev); } }
    function needRoot(cmd) {
      if (user().uid === 0) { return false; }
      fail(cmd + ": Permission denied.");
      fail(cmd + ": cannot lock /etc/passwd; try again later.");
      term.status.code = 1;
      return true;
    }
    function fmtSince(ts) {
      var d = new Date(ts);
      return util.DAYS_EN[d.getDay()] + " " + d.getFullYear() + "-" + util.pad2(d.getMonth() + 1) + "-" + util.pad2(d.getDate()) +
        " " + util.fmtTime(d) + " " + (ctx.tz || "CEST");
    }

    /* ---------------- Usuarios ---------------- */
    C.useradd = function (args) {
      var o = parseArgs(args, { short: { m: "home", M: "noHome", s: "=shell", G: "=groups", g: "=group", c: "=comment", u: "=uid", d: "=dir", r: "system" },
        long: { "create-home": "home", shell: "=shell", groups: "=groups", gid: "=group", comment: "=comment", system: "system" } });
      if (o.bad || o.missing) { fail("Modo de empleo: useradd [opciones] LOGIN"); return; }
      var name = o._[0];
      if (!name) { fail("Modo de empleo: useradd [opciones] LOGIN"); return; }
      if (needRoot("useradd")) { return; }
      if (sys.user(name)) { fail("useradd: el usuario «" + name + "» ya existe"); return; }
      var extra = o.groups ? last(o.groups).split(",") : [];
      var bad = extra.filter(function (g) { return !sys.group(g); });
      if (bad.length) { fail("useradd: el grupo «" + bad[0] + "» no existe"); return; }
      if (o.group && !sys.group(last(o.group))) { fail("useradd: el grupo «" + last(o.group) + "» no existe"); return; }
      var u = sys.addUser({
        name: name,
        uid: o.uid ? parseInt(last(o.uid), 10) : undefined,
        group: o.group ? last(o.group) : name,
        shell: o.shell ? last(o.shell) : "/bin/bash",
        comment: o.comment ? last(o.comment) : "",
        home: o.dir ? last(o.dir) : undefined,
        system: !!o.system
      });
      extra.forEach(function (g) { sys.addMember(g, name); });
      if (o.home && vfs) {
        var h = vfs.mkdir(u.home, [], { parents: true, owner: name, group: u.group, mode: 0o750 });
        if (h) { h.mtime = ctx.now ? ctx.now() : Date.now(); }
      }
      emit({ type: "useradd", name: name, home: !!o.home, groups: extra });
    };
    C.adduser = function (args) {
      term.sys("info", "ℹ En este servidor usa useradd (adduser es el guion interactivo de Debian).");
      C.useradd(args);
    };
    C.usermod = function (args) {
      var o = parseArgs(args, { short: { a: "append", G: "=groups", g: "=group", s: "=shell", d: "=dir", L: "lock", U: "unlock", c: "=comment", l: "=login", m: "move" },
        long: { append: "append", groups: "=groups", shell: "=shell", lock: "lock", unlock: "unlock", comment: "=comment" } });
      var name = o._[0];
      if (!name) { fail("Modo de empleo: usermod [opciones] LOGIN"); return; }
      if (needRoot("usermod")) { return; }
      var u = sys.user(name);
      if (!u) { fail("usermod: el usuario «" + name + "» no existe"); return; }
      if (o.groups) {
        var list = last(o.groups).split(",").filter(Boolean);
        var bad = list.filter(function (g) { return !sys.group(g); });
        if (bad.length) { fail("usermod: el grupo «" + bad[0] + "» no existe"); return; }
        if (!o.append) {
          Object.keys(sys.groups).forEach(function (g) { if (g !== u.group) { sys.removeMember(g, name); } });
        }
        list.forEach(function (g) { sys.addMember(g, name); });
      }
      if (o.group) {
        if (!sys.group(last(o.group))) { fail("usermod: el grupo «" + last(o.group) + "» no existe"); return; }
        u.group = last(o.group);
      }
      if (o.shell) { u.shell = last(o.shell); }
      if (o.comment) { u.comment = last(o.comment); }
      if (o.dir) { u.home = last(o.dir); }
      if (o.lock) { u.locked = true; }
      if (o.unlock) { u.locked = false; }
      emit({ type: "usermod", name: name, locked: u.locked, groups: o.groups ? last(o.groups).split(",") : null, append: !!o.append });
    };
    C.userdel = function (args) {
      var o = parseArgs(args, { short: { r: "removeHome", f: "force" }, long: { remove: "removeHome", force: "force" } });
      var name = o._[0];
      if (!name) { fail("Modo de empleo: userdel [opciones] LOGIN"); return; }
      if (needRoot("userdel")) { return; }
      var u = sys.user(name);
      if (!u) { fail("userdel: el usuario «" + name + "» no existe"); return; }
      if (o.removeHome && vfs) { vfs.remove(u.home, []); }
      sys.delUser(name);
      emit({ type: "userdel", name: name, removedHome: !!o.removeHome });
    };
    C.passwd = function (args) {
      var o = parseArgs(args, { short: { l: "lock", u: "unlock", d: "delete", e: "expire", S: "status" }, long: { lock: "lock", unlock: "unlock", status: "status" } });
      var name = o._[0] || user().name;
      var u = sys.user(name);
      if (!u) { fail("passwd: el usuario «" + name + "» no existe"); return; }
      if (name !== user().name && needRoot("passwd")) { return; }
      if (o.status) {
        pre(name + " " + (u.locked ? "L" : u.password ? "P" : "NP") + " " + new Date(ctx.now ? ctx.now() : Date.now()).toISOString().slice(0, 10) + " 0 99999 7 -1");
        emit({ type: "passwd", name: name, status: true, locked: !!u.locked });
        return;
      }
      if (o.lock) { u.locked = true; pre("passwd: contraseña cambiada."); emit({ type: "passwd", name: name, locked: true }); return; }
      if (o.unlock) { u.locked = false; pre("passwd: contraseña cambiada."); emit({ type: "passwd", name: name, locked: false }); return; }
      u.password = "set";
      pre("Cambiando la contraseña del usuario " + name + ".");
      pre("Nueva contraseña: ********");
      pre("Vuelva a escribir la nueva contraseña: ********");
      pre("passwd: contraseña actualizada correctamente");
      emit({ type: "passwd", name: name, set: true });
    };

    /* ---------------- Grupos ---------------- */
    C.groupadd = function (args) {
      var o = parseArgs(args, { short: { g: "=gid", r: "system", f: "force" }, long: { gid: "=gid", system: "system" } });
      var name = o._[0];
      if (!name) { fail("Modo de empleo: groupadd [opciones] GRUPO"); return; }
      if (needRoot("groupadd")) { return; }
      if (sys.group(name)) { fail("groupadd: el grupo «" + name + "» ya existe"); return; }
      sys.addGroup({ name: name, gid: o.gid ? parseInt(last(o.gid), 10) : undefined, system: !!o.system });
      emit({ type: "groupadd", name: name });
    };
    C.groupdel = function (args) {
      var name = args[0];
      if (!name) { fail("Modo de empleo: groupdel GRUPO"); return; }
      if (needRoot("groupdel")) { return; }
      if (!sys.group(name)) { fail("groupdel: el grupo «" + name + "» no existe"); return; }
      var primary = Object.keys(sys.users).filter(function (u) { return sys.users[u].group === name; });
      if (primary.length) { fail("groupdel: no se puede eliminar el grupo primario del usuario «" + primary[0] + "»"); return; }
      sys.delGroup(name);
      emit({ type: "groupdel", name: name });
    };
    C.gpasswd = function (args) {
      var o = parseArgs(args, { short: { a: "=add", d: "=del", M: "=members", A: "=admins" }, long: {} });
      var group = o._[0];
      if (!group) { fail("Modo de empleo: gpasswd [opción] GRUPO"); return; }
      if (needRoot("gpasswd")) { return; }
      if (!sys.group(group)) { fail("gpasswd: el grupo «" + group + "» no existe"); return; }
      (o.add || []).forEach(function (u) {
        if (!sys.user(u)) { fail("gpasswd: el usuario «" + u + "» no existe"); return; }
        sys.addMember(group, u);
        pre("Agregando al usuario " + u + " al grupo " + group);
        emit({ type: "gpasswd", group: group, add: u });
      });
      (o.del || []).forEach(function (u) {
        sys.removeMember(group, u);
        pre("Eliminando al usuario " + u + " del grupo " + group);
        emit({ type: "gpasswd", group: group, del: u });
      });
      (o.members || []).forEach(function (listStr) {
        var g = sys.group(group);
        g.members = listStr.split(",").filter(function (u) { return sys.user(u); });
        emit({ type: "gpasswd", group: group, set: g.members });
      });
    };
    C.getent = function (args) {
      var db = args[0], key = args[1];
      if (db === "passwd") {
        var users = key ? [sys.user(key)].filter(Boolean) : util.sortedKeys(sys.users).map(function (n) { return sys.users[n]; });
        if (!users.length) { term.status.code = 2; return; }
        users.forEach(function (u) {
          var g = sys.group(u.group);
          pre(u.name + ":x:" + u.uid + ":" + (g ? g.gid : 0) + ":" + u.comment + ":" + u.home + ":" + u.shell);
        });
        emit({ type: "getent", db: "passwd", key: key || null, count: users.length });
        return;
      }
      if (db === "group") {
        var groups = key ? [sys.group(key)].filter(Boolean) : util.sortedKeys(sys.groups).map(function (n) { return sys.groups[n]; });
        if (!groups.length) { term.status.code = 2; return; }
        groups.forEach(function (g) { pre(g.name + ":x:" + g.gid + ":" + g.members.join(",")); });
        emit({ type: "getent", db: "group", key: key || null, count: groups.length });
        return;
      }
      fail("getent: base de datos no admitida en el simulador: " + db);
    };

    /* ---------------- Servicios ---------------- */
    function statusBlock(s) {
      var running = s.state === "running";
      var dot = running ? "●" : s.state === "failed" ? "×" : "○";
      var rows = [
        dot + " " + s.unit + " - " + s.display,
        "     Loaded: loaded (/lib/systemd/system/" + s.unit + "; " + (s.startup === "auto" ? "enabled" : "disabled") + "; preset: enabled)",
        "     Active: " + (running ? "active (running) since " + fmtSince(s.since || (ctx.now ? ctx.now() : Date.now())) + "; 2min ago"
          : s.state === "failed" ? "failed (Result: exit-code) since " + fmtSince(ctx.now ? ctx.now() : Date.now()) + "; 1min ago"
          : "inactive (dead)")
      ];
      if (running) { rows.push("   Main PID: " + s.pid + " (" + s.name + ")"); }
      if (s.description) { rows.push("       Docs: man:" + s.name + "(8)"); }
      (s.log || []).slice(-3).forEach(function (l) { rows.push("             " + l); });
      return rows.join("\n");
    }
    C.systemctl = function (args) {
      var o = parseArgs(args, { short: { q: "quiet", a: "all", l: "x", n: "=lines" },
        long: { now: "now", quiet: "quiet", all: "all", type: "=type", "no-pager": "x", failed: "failed" } });
      var sub = (o._[0] || "").toLowerCase();
      var name = o._[1];
      if (!sub || sub === "status" && !name) {
        listUnits(o);
        return;
      }
      if (["list-units", "list-unit-files"].indexOf(sub) !== -1) { listUnits(o); return; }
      if (sub === "daemon-reload" || sub === "daemon-reexec") { emit({ type: "systemctl", sub: sub }); return; }
      if (!name) { fail("Too few arguments."); return; }
      var s = sys.service(name);
      if (!s) {
        if (sub === "status") { fail("Unit " + name.replace(/\.service$/, "") + ".service could not be found."); term.status.code = 4; }
        else { fail("Failed to " + sub + " " + name + ".service: Unit " + name.replace(/\.service$/, "") + ".service not found."); }
        return;
      }
      if (sub === "status") {
        pre(statusBlock(s));
        term.status.code = s.state === "running" ? 0 : 3;
        emit({ type: "systemctl", sub: "status", service: s.name });
        return;
      }
      if (sub === "is-active") {
        pre(s.state === "running" ? "active" : s.state === "failed" ? "failed" : "inactive");
        term.status.code = s.state === "running" ? 0 : 3;
        emit({ type: "systemctl", sub: "is-active", service: s.name, state: s.state });
        return;
      }
      if (sub === "is-enabled") {
        pre(s.startup === "auto" ? "enabled" : "disabled");
        term.status.code = s.startup === "auto" ? 0 : 1;
        emit({ type: "systemctl", sub: "is-enabled", service: s.name, startup: s.startup });
        return;
      }
      if (["start", "stop", "restart", "reload", "enable", "disable", "mask", "unmask"].indexOf(sub) === -1) {
        fail("Unknown command verb " + sub + ".");
        return;
      }
      if (needRootSvc()) { return; }
      /* mask deja la unidad enlazada a /dev/null: ni arranca ni se puede arrancar */
      if (sub === "mask" || sub === "unmask") {
        s.startup = sub === "mask" ? "disabled" : "manual";
        s.masked = sub === "mask";
        pre(sub === "mask"
          ? "Created symlink /etc/systemd/system/" + s.unit + " → /dev/null."
          : "Removed \"/etc/systemd/system/" + s.unit + "\".");
        if (sub === "mask" && o.now) { sys.stop(s.name); }
        emit({ type: "systemctl", sub: sub, service: s.name, startup: s.startup });
        return;
      }
      if (sub === "reload") {
        if (s.state !== "running") {
          fail("Failed to reload " + s.unit + ": Job type reload is not applicable for unit " + s.unit + ".");
          return;
        }
        emit({ type: "systemctl", sub: "reload", service: s.name, state: s.state });
        return;
      }
      if (s.masked && (sub === "start" || sub === "restart")) {
        fail("Failed to start " + s.unit + ": Unit " + s.unit + " is masked.");
        term.status.code = 1;
        return;
      }
      if (sub === "enable" || sub === "disable") {
        s.startup = sub === "enable" ? "auto" : "manual";
        pre(sub === "enable"
          ? "Created symlink /etc/systemd/system/multi-user.target.wants/" + s.unit + " → /lib/systemd/system/" + s.unit + "."
          : "Removed \"/etc/systemd/system/multi-user.target.wants/" + s.unit + "\".");
        if (o.now) { applyState(s, sub === "enable" ? "start" : "stop"); }
        emit({ type: "systemctl", sub: sub, service: s.name, startup: s.startup, now: !!o.now });
        return;
      }
      applyState(s, sub);
      emit({ type: "systemctl", sub: sub, service: s.name, state: s.state });
    };
    function needRootSvc() {
      if (user().uid === 0) { return false; }
      fail("Failed to start unit: Access denied");
      term.sys("info", "ℹ Para gestionar servicios necesitas privilegios: usa sudo.");
      term.status.code = 1;
      return true;
    }
    function applyState(s, sub) {
      if (sub === "stop") { sys.stop(s.name); return; }
      sys.start(s.name);
      if (s.state === "failed") {
        fail("Job for " + s.unit + " failed because the control process exited with error code.");
        fail("See \"systemctl status " + s.unit + "\" and \"journalctl -xeu " + s.unit + "\" for details.");
        term.status.code = 1;
      }
    }
    function listUnits(o) {
      var wanted = o.type ? last(o.type).replace(/^service$/, "service") : null;
      rich([["", util.pad("UNIT", 26) + util.pad("LOAD", 7) + util.pad("ACTIVE", 9) + util.pad("SUB", 9) + "DESCRIPTION"]]);
      util.sortedKeys(sys.services).forEach(function (n) {
        var s = sys.services[n];
        if (o.failed && s.state !== "failed") { return; }
        if (!o.all && !o.failed && s.state === "stopped") { return; }
        rich([[s.state === "failed" ? "r" : s.state === "running" ? "g" : "", util.pad(s.unit, 26)],
          ["", util.pad("loaded", 7) + util.pad(s.state === "running" ? "active" : s.state === "failed" ? "failed" : "inactive", 9) +
            util.pad(s.state === "running" ? "running" : s.state === "failed" ? "failed" : "dead", 9) + s.display]]);
      });
      emit({ type: "systemctl", sub: "list-units" });
    }
    C.service = function (args) {
      var name = args[0], sub = args[1];
      if (!name || !sub) { fail("Usage: service < option > | --status-all | [ service_name [ command ] ]"); return; }
      C.systemctl([sub, name]);
    };
    C.journalctl = function (args) {
      var o = parseArgs(args, { short: { u: "=unit", n: "=lines", f: "x", e: "x", x: "x" }, long: { unit: "=unit", lines: "=lines", "no-pager": "x" } });
      var unit = o.unit ? last(o.unit) : null;
      var n = o.lines ? parseInt(last(o.lines), 10) : 20;
      var names = unit ? [unit.replace(/\.service$/, "")] : util.sortedKeys(sys.services);
      var lines = [];
      names.forEach(function (name) {
        var s = sys.service(name);
        if (!s) { return; }
        (s.log || []).forEach(function (l) { lines.push(l); });
      });
      if (!lines.length) { pre("-- No entries --"); return; }
      pre(lines.slice(-n).join("\n"));
      emit({ type: "journalctl", unit: unit, lines: o.lines ? n : null });
    };

    /* ---------------- Procesos ---------------- */
    C.ps = function (args) {
      var procs = sys.processList();
      rich([["", util.pad("USER", 9) + util.lpad("PID", 6) + " %CPU %MEM " + util.pad(" TTY", 8) + util.pad("STAT", 6) + "COMMAND"]]);
      procs.forEach(function (p) {
        pre(util.pad(p.user, 9) + util.lpad(p.pid, 6) + "  0.0  " + ((p.pid % 7) / 10 + 0.1).toFixed(1) + " " +
          util.pad(" ?", 8) + util.pad("Ss", 6) + p.cmd);
      });
      emit({ type: "ps" });
    };
    C.kill = function (args) {
      var pid = parseInt(args.filter(function (a) { return /^\d+$/.test(a); })[0], 10);
      if (!pid) { fail("kill: uso: kill [-s señal | -n numseñal | -señal] pid"); return; }
      var svc = null;
      Object.keys(sys.services).forEach(function (n) { if (sys.services[n].pid === pid) { svc = sys.services[n]; } });
      if (!svc) { fail("bash: kill: (" + pid + ") - No existe el proceso"); return; }
      sys.stop(svc.name);
      emit({ type: "kill", pid: pid, service: svc.name });
    };
    return C;
  };
})(this);
