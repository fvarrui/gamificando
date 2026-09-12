/* ==========================================================
   Lógica de las tareas: cómo se comprueba cada una y con qué
   secuencia de órdenes se resuelve.
   Los textos están en data/missions.js.
   ========================================================== */
(function (global) {
  "use strict";
  var RG = global.RG, UG = global.UG, util = RG.util;

  function S() { return UG.S; }
  function sys() { return UG.S.sys; }
  function user(n) { return sys().user(n); }
  function group(n) { return sys().group(n); }
  function inGroup(u, g) { return sys().inGroup(u, g); }
  function node(p) { return S().vfs.get(p, []); }
  function ends(p, name) { return new RegExp(name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "$").test(String(p || "")); }

  var LOGIC = {
    /* ---------------- FASE 1 · QUIÉN HAY ---------------- */
    "USR-01": {
      check: function (ev) { return !!ev && ev.type === "cat" && ends(ev.path, "altas.txt"); },
      solution: ["cat altas.txt"]
    },
    "USR-02": {
      check: function (ev) { return !!ev && ev.type === "getent" && ev.db === "passwd" && !ev.key; },
      solution: ["getent passwd"]
    },
    "USR-03": {
      check: function (ev) { return !!ev && ev.type === "getent" && ev.db === "group" && !ev.key; },
      solution: ["getent group"]
    },
    "USR-04": {
      check: function (ev) { return !!ev && (ev.type === "id" || ev.type === "groups") && ev.user === "yeoh"; },
      solution: ["id yeoh"]
    },
    "USR-05": {
      check: function (ev) { return !!ev && ev.type === "getent" && ev.db === "passwd" && ev.key === "visitas"; },
      solution: ["getent passwd visitas"]
    },

    /* ---------------- FASE 2 · ALTAS ---------------- */
    "USR-06": {
      check: function () { return !!group("formacion"); },
      solution: ["sudo groupadd formacion"]
    },
    "USR-07": {
      check: function () {
        var u = user("moss");
        return !!u && u.shell === "/bin/bash" && /Carrie-Anne/i.test(u.comment) && !!node("/home/moss");
      },
      solution: ["sudo useradd -m -s /bin/bash -c \"Carrie-Anne Moss\" moss"]
    },
    "USR-08": {
      check: function (ev) { return !!ev && ev.type === "ls" && ev.long && ev.path === "/home"; },
      solution: ["ls -l /home"]
    },
    "USR-09": {
      check: function (ev) { return !!ev && ev.type === "passwd" && ev.name === "moss" && ev.set; },
      solution: ["sudo passwd moss"]
    },
    "USR-10": {
      check: function () {
        var u = user("chan");
        return !!u && /Jackie/i.test(u.comment) && !!node("/home/chan") && inGroup("chan", "proyectos");
      },
      solution: ["sudo useradd -m -c \"Jackie Chan\" -G proyectos chan"]
    },

    /* ---------------- FASE 3 · PERTENENCIAS ---------------- */
    "USR-11": {
      check: function () { return inGroup("moss", "ventas"); },
      solution: ["sudo usermod -aG ventas moss"]
    },
    "USR-12": {
      check: function (ev) { return !!ev && (ev.type === "id" || ev.type === "groups") && ev.user === "moss"; },
      solution: ["id moss"]
    },
    "USR-13": {
      check: function () { return inGroup("chan", "formacion"); },
      solution: ["sudo gpasswd -a chan formacion"]
    },
    "USR-14": {
      check: function () { return !!user("vandamme") && !inGroup("vandamme", "proyectos"); },
      solution: ["sudo gpasswd -d vandamme proyectos"]
    },
    "USR-15": {
      check: function (ev) { return !!ev && ev.type === "getent" && ev.db === "group" && ev.key === "proyectos"; },
      solution: ["getent group proyectos"]
    },

    /* ---------------- FASE 4 · BAJAS Y BLOQUEOS ---------------- */
    "USR-16": {
      check: function (ev) { return !!ev && ev.type === "passwd" && ev.name === "vandamme" && ev.status; },
      solution: ["sudo passwd -S vandamme"]
    },
    "USR-17": {
      check: function () {
        var u = user("vandamme");
        return !!u && u.locked;
      },
      solution: ["sudo usermod -L vandamme"]
    },
    "USR-18": {
      check: function (ev) {
        return !!ev && ev.type === "passwd" && ev.name === "vandamme" && ev.status && ev.locked;
      },
      solution: ["sudo passwd -S vandamme"]
    },
    "USR-19": {
      check: function () { return !user("visitas") && !node("/home/visitas"); },
      solution: ["sudo userdel -r visitas"]
    },
    "USR-20": {
      check: function (ev) { return !!ev && ev.type === "ls" && ev.long && ev.path === "/home" && !node("/home/visitas"); },
      solution: ["ls -l /home"]
    },

    /* ---------------- FASE 5 · CUENTAS DE SERVICIO ---------------- */
    "USR-21": {
      check: function () {
        var u = user("svc-backup");
        return !!u && /nologin|false/.test(u.shell);
      },
      solution: ["sudo useradd -r -s /usr/sbin/nologin svc-backup"]
    },
    "USR-22": {
      check: function (ev) { return !!ev && ev.type === "getent" && ev.db === "passwd" && ev.key === "svc-backup"; },
      solution: ["getent passwd svc-backup"]
    },
    "USR-23": {
      check: function () {
        var u = user("vandamme");
        return !!u && /nologin|false/.test(u.shell);
      },
      solution: ["sudo usermod -s /usr/sbin/nologin vandamme"]
    },
    "USR-24": {
      check: function (ev) { return !!ev && ev.type === "getent" && ev.db === "group" && ev.key === "formacion"; },
      solution: ["getent group formacion"]
    },
    "USR-25": {
      check: function () {
        var n = node("/home/hamilton/cuentas.txt");
        return !!n && /root:x:0/.test(n.content || "");
      },
      solution: ["getent passwd > cuentas.txt"]
    }
  };

  /* Vigilancia global: los errores que de verdad hacen daño */
  UG.watch = function (S, ev) {
    /* usermod -G sin -a saca a la persona de todos sus demás grupos */
    if (ev.type === "usermod" && ev.groups && !ev.append) {
      S.game.addRisky("usermod:sin-a",
        "has usado usermod -G sin -a: eso sustituye TODOS los grupos secundarios de " + ev.name +
        " y lo saca de los que no aparecían en la lista.");
    }
    if (ev.type === "userdel" && ev.name === "vandamme") {
      S.game.addRisky("userdel:vandamme",
        "has eliminado la cuenta de Jean-Claude en vez de bloquearla: sus ficheros se quedan sin dueño y no hay vuelta atrás.");
    }
    if (ev.type === "userdel" && ["hamilton", "lundgren", "yeoh", "root"].indexOf(ev.name) !== -1) {
      S.game.addRisky("userdel:activa", "has eliminado la cuenta de " + ev.name + ", que sigue en activo.");
    }
    if (ev.type === "useradd" && /^svc-/.test(ev.name || "") && ev.home) {
      S.game.addRisky("svc:home",
        "has creado la cuenta de servicio con directorio personal: una cuenta de servicio no lo necesita.");
    }
  };

  /* Contenido + lógica = tareas del juego */
  UG.MISSIONS = UG.MISSION_CONTENT.map(function (m, i) {
    var code = "USR-" + util.pad2(i + 1);
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
