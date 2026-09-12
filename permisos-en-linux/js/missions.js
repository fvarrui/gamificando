/* ==========================================================
   Lógica de las tareas: cómo se comprueba cada una y con qué
   secuencia de órdenes se resuelve.
   Los textos están en data/missions.js.
   ========================================================== */
(function (global) {
  "use strict";
  var RG = global.RG, PL = global.PL, util = RG.util;
  var DIR = "/srv/proyectos";

  function S() { return PL.S; }
  function node(p) { return S().vfs.get(p, []); }
  function mode(p) {
    var n = node(p);
    return n ? n.mode : -1;
  }
  /* ¿Tiene el nodo una entrada ACL para ese usuario o grupo con esos permisos? */
  function acl(p, kind, name, perms) {
    var n = node(p);
    if (!n || !n.acl) { return false; }
    var e = n.acl.filter(function (x) { return x.kind === kind && x.name === name; })[0];
    if (!e) { return false; }
    return perms === undefined || e.perms === perms;
  }
  function noAcl(p, kind, name) {
    var n = node(p);
    if (!n || !n.acl) { return true; }
    return !n.acl.filter(function (x) { return x.kind === kind && x.name === name; }).length;
  }
  function defAcl(p, kind, name, perms) {
    var n = node(p);
    if (!n || !n.dacl) { return false; }
    var e = n.dacl.filter(function (x) { return x.kind === kind && x.name === name; })[0];
    if (!e) { return false; }
    return perms === undefined || e.perms === perms;
  }
  function ends(p, name) { return new RegExp(name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "$").test(String(p || "")); }
  /* Todo el árbol cumple una condición */
  function all(fn) {
    var ok = true;
    S().vfs.walk(S().vfs.norm(DIR, []), function (n, segs) {
      if (!fn(n, S().vfs.join(segs))) { ok = false; }
    });
    return ok;
  }

  var LOGIC = {
    /* ---------------- FASE 1 · LEER PERMISOS ---------------- */
    "ACL-01": {
      check: function (ev) { return !!ev && ev.type === "ls" && ev.long && ev.path === DIR; },
      solution: ["ls -l"]
    },
    "ACL-02": {
      check: function (ev) { return !!ev && ev.type === "stat" && /proyectos$/.test(ev.path); },
      solution: ["stat /srv/proyectos"]
    },
    "ACL-03": {
      check: function (ev) { return !!ev && (ev.type === "id" || ev.type === "groups"); },
      solution: ["id"]
    },
    "ACL-04": {
      check: function (ev) { return !!ev && ev.type === "find" && ev.opts.perm === "777" && ev.results.length > 0; },
      solution: ["find /srv/proyectos -perm 777"]
    },
    "ACL-05": {
      check: function (ev) { return !!ev && ev.type === "cat" && ends(ev.path, "claves.txt"); },
      solution: ["cat privado/claves.txt"]
    },

    /* ---------------- FASE 2 · DUEÑOS Y GRUPOS ---------------- */
    "ACL-06": {
      check: function () { return all(function (n) { return n.group === "proyectos"; }); },
      solution: ["sudo chgrp -R proyectos /srv/proyectos"]
    },
    "ACL-07": {
      check: function () {
        return ["memoria.txt", "presupuesto.csv", "acta-direccion.txt"].every(function (f) {
          var n = node(DIR + "/" + f);
          return !!n && n.owner === "carla";
        });
      },
      solution: ["sudo chown carla memoria.txt presupuesto.csv acta-direccion.txt"]
    },
    "ACL-08": {
      check: function () { return (mode(DIR) & 0o2000) !== 0; },
      solution: ["sudo chmod g+s /srv/proyectos"]
    },
    "ACL-09": {
      check: function (ev) {
        var n = node(DIR + "/prueba.txt");
        return !!n && n.group === "proyectos" && !!ev && ev.type === "ls" && ev.long;
      },
      solution: ["touch prueba.txt", "ls -l prueba.txt"]
    },

    /* ---------------- FASE 3 · CHMOD ---------------- */
    "ACL-10": {
      check: function () { return (mode(DIR) & 0o777) === 0o770; },
      react: function (ev, d) {
        if (ev.type === "chmod" && ends(ev.path, "proyectos") && (ev.mode & 0o2000) === 0 && !d.avisado) {
          d.avisado = true;
          S().term.sys("info", "ℹ Ojo: al dar el modo en octal con tres cifras se ha perdido el bit SGID. " +
            "Vuelve a ponerlo con chmod g+s, o usa cuatro cifras: 2770.");
        }
      },
      solution: ["sudo chmod 2770 /srv/proyectos"]
    },
    "ACL-11": {
      check: function () { return (mode(DIR + "/memoria.txt") & 0o777) === 0o660; },
      solution: ["sudo chmod 660 memoria.txt"]
    },
    "ACL-12": {
      check: function () {
        var m = mode(DIR + "/despliegue.sh");
        return (m & 0o100) !== 0 && (m & 0o010) !== 0;
      },
      solution: ["sudo chmod ug+x despliegue.sh"]
    },
    "ACL-13": {
      check: function () { return all(function (n) { return (n.mode & 7) === 0; }); },
      solution: ["sudo chmod -R o-rwx /srv/proyectos"]
    },
    "ACL-14": {
      check: function () {
        return (mode(DIR + "/privado") & 0o777) === 0o700 &&
          (mode(DIR + "/privado/claves.txt") & 0o777) === 0o600;
      },
      solution: ["sudo chmod 700 privado", "sudo chmod 600 privado/claves.txt"]
    },

    /* ---------------- FASE 4 · ACL ---------------- */
    "ACL-15": {
      check: function (ev) { return !!ev && ev.type === "getfacl" && ends(ev.path, "presupuesto.csv"); },
      solution: ["getfacl presupuesto.csv"]
    },
    "ACL-16": {
      check: function () { return acl(DIR + "/presupuesto.csv", "group", "ventas", "r"); },
      react: function (ev) {
        if (ev.type === "setfacl" && ev.kind === "group" && ev.name === "ventas" && /w/.test(ev.perms || "")) {
          S().game.addRisky("acl:ventas-escritura",
            "has dado permiso de escritura a ventas sobre el presupuesto, cuando solo necesitaban leerlo.");
        }
      },
      solution: ["sudo setfacl -m g:ventas:r presupuesto.csv"]
    },
    "ACL-17": {
      check: function (ev) {
        return !!ev && ev.type === "getfacl" && ends(ev.path, "presupuesto.csv") &&
          acl(DIR + "/presupuesto.csv", "group", "ventas");
      },
      solution: ["getfacl presupuesto.csv"]
    },
    "ACL-18": {
      check: function () { return acl(DIR + "/acta-direccion.txt", "user", "dario", "r"); },
      solution: ["sudo setfacl -m u:dario:r acta-direccion.txt"]
    },
    "ACL-19": {
      check: function () { return acl(DIR, "user", "dario", "x"); },
      react: function (ev) {
        if (ev.type === "setfacl" && ev.kind === "user" && ev.name === "dario" && /r/.test(ev.perms || "") &&
            ev.path && /proyectos$/.test(ev.path)) {
          S().game.addRisky("acl:dario-lectura",
            "le has dado a Darío permiso para listar toda la carpeta de proyectos, cuando solo necesitaba llegar al acta.");
        }
      },
      solution: ["sudo setfacl -m u:dario:x /srv/proyectos"]
    },
    "ACL-20": {
      check: function () { return noAcl(DIR + "/memoria.txt", "user", "bruno"); },
      solution: ["sudo setfacl -x u:bruno memoria.txt"]
    },

    /* ---------------- FASE 5 · FICHEROS NUEVOS ---------------- */
    "ACL-21": {
      check: function () { return defAcl(DIR, "group", "proyectos", "rwx"); },
      solution: ["sudo setfacl -d -m g:proyectos:rwx /srv/proyectos"]
    },
    "ACL-22": {
      check: function (ev) {
        return !!ev && ev.type === "getfacl" && ends(ev.path, "nuevo.txt") &&
          acl(DIR + "/nuevo.txt", "group", "proyectos");
      },
      solution: ["touch nuevo.txt", "getfacl nuevo.txt"]
    },
    "ACL-23": {
      check: function (ev) { return !!ev && ev.type === "umask" && ev.shown; },
      solution: ["umask"]
    },
    "ACL-24": {
      check: function () { return S().state.umask === 0o007; },
      solution: ["umask 007"]
    },
    "ACL-25": {
      check: function (ev) {
        return !!ev && ev.type === "find" && ev.opts.perm === "777" && ev.results.length === 0;
      },
      solution: ["find /srv/proyectos -perm 777"]
    },
    "ACL-26": {
      check: function () {
        var n = node(DIR + "/permisos.txt");
        return !!n && /rw/.test(n.content || "");
      },
      solution: ["ls -l > permisos.txt"]
    }
  };

  /* Vigilancia global: lo que nunca debería quedar abierto */
  PL.watch = function (S, ev) {
    /* Solo se penaliza abrir más de lo que ya estaba, no arrastrar lo que había */
    if (ev.type === "chmod" && (ev.mode & 7) > (ev.before & 7)) {
      S.game.addRisky("chmod:otros",
        "has ampliado los permisos del resto del sistema sobre " + ev.path + ", que es justo lo que veníamos a cerrar.");
    }
    /* Las credenciales de servicio no las necesita nadie más */
    if (ev.type === "setfacl" && ev.name && /claves|privado/.test(ev.path || "")) {
      S.game.addRisky("acl:claves",
        "has dado acceso a las credenciales de servicio a «" + ev.name + "», que no las necesita.");
    }
    if (ev.type === "rm" && /claves\.txt$/.test(ev.path || "")) {
      S.game.addRisky("rm:claves", "has borrado el fichero de credenciales en vez de protegerlo.");
    }
  };

  /* Contenido + lógica = tareas del juego */
  PL.MISSIONS = PL.MISSION_CONTENT.map(function (m, i) {
    var code = "ACL-" + util.pad2(i + 1);
    var logic = LOGIC[code] || {};
    var full = util.copy(m);
    full.code = code;
    full.check = logic.check || function () { return false; };
    full.onActivate = logic.onActivate;
    full.react = logic.react;
    full.solution = logic.solution || [];
    return full;
  });
})(this);
