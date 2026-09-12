/* ==========================================================
   RG.System · Usuarios, grupos, servicios y procesos
   Un único modelo con dos caras: Linux (uid, gid, /etc/passwd,
   systemd) y Windows (cuentas locales, servicios, sc).
   ========================================================== */
(function (global) {
  "use strict";
  var RG = global.RG, util = RG.util;

  RG.System = function (cfg) {
    cfg = cfg || {};
    var sys = { users: {}, groups: {}, services: {}, processes: [] };

    /* ---------------- Usuarios ---------------- */
    sys.addUser = function (u) {
      var user = {
        name: u.name,
        uid: u.uid !== undefined ? u.uid : sys.nextUid(),
        group: u.group || u.name,
        groups: (u.groups || []).slice(),
        home: u.home !== undefined ? u.home : (cfg.homeBase || "/home/") + u.name,
        shell: u.shell || "/bin/bash",
        comment: u.comment || "",
        locked: !!u.locked,
        enabled: u.enabled !== false,
        password: u.password || null,
        system: !!u.system,
        lastLogon: u.lastLogon || null
      };
      sys.users[user.name] = user;
      if (!sys.groups[user.group]) { sys.addGroup({ name: user.group, gid: user.uid }); }
      return user;
    };
    sys.nextUid = function () {
      var max = 1000;
      Object.keys(sys.users).forEach(function (n) {
        if (!sys.users[n].system && sys.users[n].uid >= max) { max = sys.users[n].uid + 1; }
      });
      return max;
    };
    sys.user = function (name) { return util.has(sys.users, name) ? sys.users[name] : null; };
    sys.delUser = function (name) {
      if (!util.has(sys.users, name)) { return false; }
      delete sys.users[name];
      Object.keys(sys.groups).forEach(function (g) {
        sys.groups[g].members = sys.groups[g].members.filter(function (m) { return m !== name; });
      });
      return true;
    };
    /* Grupos a los que pertenece: el principal y los secundarios */
    sys.userGroups = function (name) {
      var u = sys.user(name);
      if (!u) { return []; }
      var list = [u.group];
      Object.keys(sys.groups).sort().forEach(function (g) {
        if (sys.groups[g].members.indexOf(name) !== -1 && list.indexOf(g) === -1) { list.push(g); }
      });
      u.groups.forEach(function (g) { if (list.indexOf(g) === -1) { list.push(g); } });
      return list;
    };
    /* Objeto listo para comprobar permisos en el VFS */
    sys.principal = function (name) {
      var u = sys.user(name);
      if (!u) { return null; }
      return { name: u.name, uid: u.uid, group: u.group, groups: sys.userGroups(name) };
    };

    /* ---------------- Grupos ---------------- */
    sys.addGroup = function (g) {
      var group = {
        name: g.name,
        gid: g.gid !== undefined ? g.gid : sys.nextGid(),
        members: (g.members || []).slice(),
        description: g.description || "",
        system: !!g.system
      };
      sys.groups[group.name] = group;
      return group;
    };
    sys.nextGid = function () {
      var max = 1000;
      Object.keys(sys.groups).forEach(function (n) {
        if (!sys.groups[n].system && sys.groups[n].gid >= max) { max = sys.groups[n].gid + 1; }
      });
      return max;
    };
    sys.group = function (name) { return util.has(sys.groups, name) ? sys.groups[name] : null; };
    sys.delGroup = function (name) {
      if (!util.has(sys.groups, name)) { return false; }
      delete sys.groups[name];
      return true;
    };
    sys.addMember = function (groupName, userName) {
      var g = sys.group(groupName);
      if (!g || g.members.indexOf(userName) !== -1) { return false; }
      g.members.push(userName);
      return true;
    };
    sys.removeMember = function (groupName, userName) {
      var g = sys.group(groupName);
      if (!g) { return false; }
      var before = g.members.length;
      g.members = g.members.filter(function (m) { return m !== userName; });
      return g.members.length !== before;
    };
    sys.inGroup = function (userName, groupName) { return sys.userGroups(userName).indexOf(groupName) !== -1; };

    /* ---------------- Servicios ---------------- */
    sys.addService = function (s) {
      var svc = {
        name: s.name,
        display: s.display || s.name,
        description: s.description || "",
        state: s.state || "stopped",          // running | stopped | failed
        startup: s.startup || "manual",       // auto (enabled) | manual (disabled) | disabled
        pid: s.pid || null,
        user: s.user || "root",
        unit: s.unit || (s.name + ".service"),
        log: (s.log || []).slice(),
        failReason: s.failReason || null,     // motivo por el que falla al arrancar
        since: s.since || null
      };
      sys.services[svc.name] = svc;
      return svc;
    };
    /* Acepta el nombre corto, la unidad (x.service) y los alias */
    sys.service = function (name) {
      if (!name) { return null; }
      var key = String(name).replace(/\.service$/i, "");
      if (util.has(sys.services, key)) { return sys.services[key]; }
      var found = null;
      Object.keys(sys.services).forEach(function (n) {
        var s = sys.services[n];
        if (!found && (s.display.toLowerCase() === String(name).toLowerCase() ||
            (s.aliases || []).indexOf(key) !== -1)) { found = s; }
      });
      return found;
    };
    sys.start = function (name) {
      var s = sys.service(name);
      if (!s) { return null; }
      if (s.failReason) { s.state = "failed"; return s; }
      s.state = "running";
      s.pid = s.pid || 1000 + Math.floor(Math.random() * 8000);
      s.since = cfg.now ? cfg.now() : Date.now();
      return s;
    };
    sys.stop = function (name) {
      var s = sys.service(name);
      if (!s) { return null; }
      s.state = "stopped";
      s.pid = null;
      return s;
    };

    /* ---------------- Procesos ---------------- */
    sys.processList = function () {
      var list = (cfg.baseProcesses || []).slice();
      Object.keys(sys.services).sort().forEach(function (n) {
        var s = sys.services[n];
        if (s.state === "running") {
          list.push({ user: s.user, pid: s.pid, cmd: s.cmd || ("/usr/sbin/" + s.name), name: s.display });
        }
      });
      return list.sort(function (a, b) { return a.pid - b.pid; });
    };

    /* ---------------- Carga inicial ---------------- */
    sys.load = function (spec) {
      (spec.groups || []).forEach(sys.addGroup);
      (spec.users || []).forEach(sys.addUser);
      (spec.services || []).forEach(sys.addService);
      (spec.members || []).forEach(function (m) { sys.addMember(m[0], m[1]); });
      return sys;
    };
    return sys;
  };
})(this);
