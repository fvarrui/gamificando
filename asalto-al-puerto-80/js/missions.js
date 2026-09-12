/* ==========================================================
   Lógica de las tareas: cómo se comprueba cada una y con qué
   secuencia de órdenes se resuelve.
   Los textos están en data/missions.js.
   ========================================================== */
(function (global) {
  "use strict";
  var RG = global.RG, SL = global.SL, util = RG.util;

  var PUERTO_80 = "nginx: [emerg] bind() to 0.0.0.0:80 failed (98: Address already in use)";
  var PUERTO_80_AP = "(98)Address already in use: AH00072: make_sock: could not bind to address 0.0.0.0:80";

  function S() { return SL.S; }
  function svc(n) { return SL.S.sys.service(n); }
  function running(n) {
    var s = svc(n);
    return !!s && s.state === "running";
  }
  function enabled(n) {
    var s = svc(n);
    return !!s && s.startup === "auto";
  }
  function node(p) { return S().vfs.get(p, []); }
  function ends(p, name) { return new RegExp(name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "$").test(String(p || "")); }
  function esSvc(ev, sub, name) {
    return !!ev && ev.type === "systemctl" && (!sub || ev.sub === sub) && (!name || ev.service === name);
  }

  var LOGIC = {
    /* ---------------- FASE 1 · DIAGNÓSTICO ---------------- */
    "SVC-01": {
      check: function (ev) { return !!ev && ev.type === "cat" && ends(ev.path, "guardia.txt"); },
      solution: ["cat guardia.txt"]
    },
    "SVC-02": {
      check: function (ev) { return esSvc(ev, "status", "nginx"); },
      solution: ["systemctl status nginx"]
    },
    "SVC-03": {
      check: function (ev) { return !!ev && ev.type === "journalctl" && /nginx/.test(ev.unit || ""); },
      solution: ["journalctl -u nginx"]
    },
    "SVC-04": {
      check: function (ev) { return esSvc(ev, "list-units"); },
      solution: ["systemctl list-units --type=service"]
    },
    "SVC-05": {
      check: function (ev) { return !!ev && ev.type === "ps"; },
      solution: ["ps aux"]
    },

    /* ---------------- FASE 2 · EL CONFLICTO ---------------- */
    "SVC-06": {
      check: function (ev) { return esSvc(ev, "status", "apache2"); },
      solution: ["systemctl status apache2"]
    },
    "SVC-07": {
      check: function () { return !running("apache2"); },
      solution: ["sudo systemctl stop apache2"]
    },
    "SVC-08": {
      check: function () { return !enabled("apache2"); },
      solution: ["sudo systemctl disable apache2"]
    },
    "SVC-09": {
      check: function () { return running("nginx"); },
      react: function (ev, d) {
        if (esSvc(ev, "start", "nginx") && !running("nginx") && !d.avisado) {
          d.avisado = true;
          S().term.sys("info", "ℹ nginx sigue sin poder abrir el puerto 80: comprueba con systemctl status apache2 que de verdad está detenido.");
        }
      },
      solution: ["sudo systemctl start nginx"]
    },
    "SVC-10": {
      check: function (ev) { return esSvc(ev, "status", "nginx") && running("nginx"); },
      solution: ["systemctl status nginx"]
    },

    /* ---------------- FASE 3 · ARRANQUE ---------------- */
    "SVC-11": {
      check: function (ev) { return esSvc(ev, "is-enabled", "nginx"); },
      solution: ["systemctl is-enabled nginx"]
    },
    "SVC-12": {
      check: function () { return enabled("nginx"); },
      solution: ["sudo systemctl enable nginx"]
    },
    "SVC-13": {
      check: function (ev) { return esSvc(ev, "is-enabled", "nginx") && enabled("nginx"); },
      solution: ["systemctl is-enabled nginx"]
    },
    "SVC-14": {
      check: function () { return running("fail2ban") && enabled("fail2ban"); },
      solution: ["sudo systemctl enable --now fail2ban"]
    },
    "SVC-15": {
      check: function (ev) { return esSvc(ev, "is-active", "fail2ban") && running("fail2ban"); },
      solution: ["systemctl is-active fail2ban"]
    },

    /* ---------------- FASE 4 · SUPERFICIE ---------------- */
    "SVC-16": {
      check: function (ev) { return esSvc(ev, "status", "cups"); },
      solution: ["systemctl status cups"]
    },
    "SVC-17": {
      check: function () { return !running("cups") && !enabled("cups"); },
      solution: ["sudo systemctl disable --now cups"]
    },
    "SVC-18": {
      check: function (ev) { return esSvc(ev, "list-units") && !running("cups") && !running("apache2"); },
      solution: ["systemctl list-units --type=service"]
    },
    "SVC-19": {
      check: function (ev) { return esSvc(ev, "restart", "mariadb") && running("mariadb"); },
      solution: ["sudo systemctl restart mariadb"]
    },
    "SVC-20": {
      check: function (ev) {
        return !!ev && ev.type === "journalctl" && /nginx/.test(ev.unit || "") && ev.lines === 5;
      },
      solution: ["journalctl -u nginx -n 5"]
    },

    /* ---------------- FASE 5 · CIERRE ---------------- */
    "SVC-21": {
      check: function (ev) { return esSvc(ev, "is-active", "ssh") && running("ssh"); },
      solution: ["systemctl is-active ssh"]
    },
    "SVC-22": {
      check: function (ev) { return esSvc(ev, "is-enabled", "apache2") && !enabled("apache2"); },
      solution: ["systemctl is-enabled apache2"]
    },
    "SVC-23": {
      check: function () {
        var n = node("/home/hamilton/estado-final.txt");
        return !!n && /nginx/.test(n.content || "");
      },
      solution: ["systemctl list-units --type=service > estado-final.txt"]
    },
    "SVC-24": {
      check: function () {
        /* El parte original no menciona a apache2: si aparece, es que se ha anotado la causa */
        var n = node("/home/hamilton/guardia.txt");
        return !!n && /apache/i.test(n.content || "");
      },
      solution: ["echo \"03:40 Causa: apache2 ocupaba el puerto 80. Detenido y deshabilitado; nginx arrancado y habilitado.\" >> guardia.txt"]
    }
  };

  /* ==========================================================
     El puerto 80 solo lo puede tener uno: quien lo tenga hace
     que el otro falle al arrancar. Se recalcula tras cada orden.
     ========================================================== */
  function sincronizaPuerto80(S) {
    var nginx = S.sys.service("nginx"), apache = S.sys.service("apache2");
    if (!nginx || !apache) { return; }
    nginx.failReason = apache.state === "running" ? PUERTO_80 : null;
    apache.failReason = nginx.state === "running" ? PUERTO_80_AP : null;
  }

  SL.watch = function (S, ev) {
    if (ev.type !== "systemctl" && ev.type !== "kill") { return; }
    var nginx = S.sys.service("nginx");
    var arrancado = ev.type === "systemctl" && ["start", "restart"].indexOf(ev.sub) !== -1;

    /* Deja constancia en el registro de la unidad, como haría systemd */
    if (arrancado && ev.service === "nginx" && nginx.state === "running") {
      nginx.log.push("oct 14 " + util.fmtTime(new Date(S.fakeNow())) +
        " srv-web systemd[1]: Started nginx - high performance web server.");
    }
    sincronizaPuerto80(S);

    /* Servicios que la empresa necesita: pararlos es una decisión arriesgada */
    if (ev.type === "systemctl" && ["stop", "disable"].indexOf(ev.sub) !== -1) {
      if (ev.service === "ssh") {
        S.game.addRisky("stop:ssh",
          "has tocado el servicio SSH del servidor: si lo detienes estando conectada en remoto, te quedas fuera.");
      }
      if (ev.service === "mariadb" && !running("mariadb")) {
        S.game.addRisky("stop:mariadb",
          "has dejado la base de datos parada: la intranet arranca, pero sin datos que mostrar.");
      }
      if (ev.service === "nginx" && ev.sub === "disable") {
        S.game.addRisky("disable:nginx",
          "has deshabilitado la intranet: no volverá a arrancar sola en el próximo reinicio.");
      }
    }
    if (ev.type === "kill" && ev.service === "ssh") {
      S.game.addRisky("kill:ssh", "has matado el proceso del SSH del servidor.");
    }
  };

  /* Contenido + lógica = tareas del juego */
  SL.MISSIONS = SL.MISSION_CONTENT.map(function (m, i) {
    var code = "SVC-" + util.pad2(i + 1);
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
