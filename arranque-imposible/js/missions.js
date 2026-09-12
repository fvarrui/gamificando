/* ==========================================================
   Lógica de las tareas: cómo se comprueba cada una y con qué
   secuencia de comandos se resuelve.
   Los textos están en data/missions.js.
   ========================================================== */
(function (global) {
  "use strict";
  var RG = global.RG, SW = global.SW, util = RG.util;

  function S() { return SW.S; }
  function svc(n) { return SW.S.sys.service(n); }
  function running(n) {
    var s = svc(n);
    return !!s && s.state === "running";
  }
  function startup(n) {
    var s = svc(n);
    return s ? s.startup : null;
  }
  function node(p) { return S().vfs.get(p, []); }
  function ends(p, name) { return new RegExp(name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "$", "i").test(String(p || "")); }
  function eq(a, b) { return String(a || "").toLowerCase() === String(b || "").toLowerCase(); }

  var LOGIC = {
    /* ---------------- FASE 1 · DIAGNÓSTICO ---------------- */
    "WSV-01": {
      check: function (ev) { return !!ev && ev.type === "cat" && ends(ev.path, "guardia.txt"); },
      solution: ["Get-Content guardia.txt"]
    },
    "WSV-02": {
      check: function (ev) { return !!ev && ev.type === "service-list" && !ev.name; },
      solution: ["Get-Service"]
    },
    "WSV-03": {
      check: function (ev) { return !!ev && ev.type === "service-list" && eq(ev.name, "AtlanteApp"); },
      solution: ["Get-Service -Name AtlanteApp"]
    },
    "WSV-04": {
      check: function (ev) { return !!ev && ev.type === "where" && /status/i.test(ev.expr) && /stopped/i.test(ev.expr); },
      solution: ["Get-Service | Where-Object Status -eq Stopped"]
    },
    "WSV-05": {
      check: function (ev) { return !!ev && ev.type === "ps" && !ev.name; },
      solution: ["Get-Process"]
    },

    /* ---------------- FASE 2 · DESHABILITADO ---------------- */
    "WSV-06": {
      check: function (ev) {
        return !!ev && ev.type === "service-start" && eq(ev.name, "AtlanteApp") && ev.refused;
      },
      solution: ["Start-Service -Name AtlanteApp"]
    },
    "WSV-07": {
      check: function (ev) { return !!ev && ev.type === "service-config" && eq(ev.name, "AtlanteApp"); },
      solution: ["sc.exe qc AtlanteApp"]
    },
    "WSV-08": {
      check: function () { return startup("AtlanteApp") === "auto"; },
      solution: ["Set-Service -Name AtlanteApp -StartupType Automatic"]
    },
    "WSV-09": {
      check: function () { return running("AtlanteApp"); },
      solution: ["Start-Service -Name AtlanteApp"]
    },
    "WSV-10": {
      check: function (ev) {
        return !!ev && ev.type === "service-list" && eq(ev.name, "AtlanteApp") && running("AtlanteApp");
      },
      solution: ["Get-Service -Name AtlanteApp"]
    },

    /* ---------------- FASE 3 · TIPOS DE INICIO ---------------- */
    "WSV-11": {
      check: function (ev) { return !!ev && ev.type === "where" && /starttype/i.test(ev.expr) && /automatic/i.test(ev.expr); },
      solution: ["Get-Service | Where-Object StartType -eq Automatic"]
    },
    "WSV-12": {
      check: function () { return startup("Spooler") === "disabled"; },
      solution: ["Set-Service -Name Spooler -StartupType Disabled"]
    },
    "WSV-13": {
      check: function () { return !running("Spooler"); },
      solution: ["Stop-Service -Name Spooler"]
    },
    "WSV-14": {
      check: function (ev) {
        return !!ev && ev.type === "service-list" && eq(ev.name, "Spooler") &&
          !running("Spooler") && startup("Spooler") === "disabled";
      },
      solution: ["Get-Service -Name Spooler"]
    },
    "WSV-15": {
      check: function () { return startup("WinRM") === "auto" && running("WinRM"); },
      solution: ["Set-Service -Name WinRM -StartupType Automatic", "Start-Service -Name WinRM"]
    },

    /* ---------------- FASE 4 · HERRAMIENTAS ---------------- */
    "WSV-16": {
      check: function (ev) { return !!ev && ev.type === "service-status" && ev.tool === "sc" && eq(ev.name, "AtlanteApp"); },
      solution: ["sc.exe query AtlanteApp"]
    },
    "WSV-17": {
      check: function (ev) { return !!ev && ev.type === "service-stop" && ev.tool === "net" && eq(ev.name, "Spooler"); },
      solution: ["net stop Spooler"]
    },
    "WSV-18": {
      check: function (ev) {
        return !!ev && ev.type === "service-restart" && eq(ev.name, "MSSQLSERVER") && running("MSSQLSERVER");
      },
      solution: ["Restart-Service -Name MSSQLSERVER"]
    },
    "WSV-19": {
      check: function (ev) { return !!ev && ev.type === "ps" && /atlante/i.test(ev.name || ""); },
      solution: ["Get-Process -Name Atlante*"]
    },
    "WSV-20": {
      check: function (ev) { return !!ev && ev.type === "cat" && ends(ev.path, "LEEME.txt"); },
      solution: ["Get-Content C:\\Atlante\\LEEME.txt"]
    },

    /* ---------------- FASE 5 · CIERRE ---------------- */
    "WSV-21": {
      check: function (ev) {
        return !!ev && ev.type === "service-list" && eq(ev.name, "TermService") && running("TermService");
      },
      solution: ["Get-Service -Name TermService"]
    },
    "WSV-22": {
      check: function (ev, d) {
        if (ev && ev.type === "where" && /status/i.test(ev.expr) && /running/i.test(ev.expr)) { d.filtro = true; }
        if (ev && ev.type === "sort" && /name/i.test(ev.property || "")) { d.orden = true; }
        return !!d.filtro && !!d.orden;
      },
      solution: ["Get-Service | Where-Object Status -eq Running | Sort-Object Name"]
    },
    "WSV-23": {
      check: function () {
        var n = node("C:\\Users\\hamilton\\estado-final.txt");
        return !!n && /AtlanteApp/i.test(n.content || "");
      },
      solution: ["Get-Service | Format-Table Name,Status,StartType > estado-final.txt"]
    },
    "WSV-24": {
      /* El parte original no menciona «Deshabilitado»: si aparece, se ha anotado la causa */
      check: function () {
        var n = node("C:\\Users\\hamilton\\guardia.txt");
        return !!n && /deshabilitado/i.test(n.content || "");
      },
      solution: ["Add-Content -Path guardia.txt -Value \"08:10 Causa: AtlanteApp estaba en tipo de inicio Deshabilitado. Cambiado a Automatico e iniciado.\""]
    }
  };

  /* Vigilancia global: servicios que la empresa necesita */
  SW.watch = function (S, ev) {
    if (ev.type === "service-stop" || (ev.type === "service-startup" && ev.startup === "disabled")) {
      if (/termservice/i.test(ev.name || "")) {
        S.game.addRisky("stop:rdp",
          "has tocado el servicio de Escritorio remoto: es la vía por la que estás administrando este servidor.");
      }
      if (/mssqlserver/i.test(ev.name || "") && !running("MSSQLSERVER")) {
        S.game.addRisky("stop:sql",
          "has dejado la base de datos parada: la aplicación de nóminas arranca, pero sin datos que mostrar.");
      }
      if (/atlanteapp/i.test(ev.name || "") && !running("AtlanteApp")) {
        S.game.addRisky("stop:app",
          "has vuelto a dejar parada la aplicación de nóminas, que es justo la incidencia que veníamos a resolver.");
      }
    }
    if (ev.type === "kill" && /termservice/i.test(ev.name || "")) {
      S.game.addRisky("kill:rdp", "has matado el proceso del Escritorio remoto.");
    }
  };

  /* Contenido + lógica = tareas del juego */
  SW.MISSIONS = SW.MISSION_CONTENT.map(function (m, i) {
    var code = "WSV-" + util.pad2(i + 1);
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
