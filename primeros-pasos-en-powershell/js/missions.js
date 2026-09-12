/* ==========================================================
   Lógica de las tareas: cómo se comprueba cada una y con qué
   secuencia de comandos se resuelve (se usa para empezar por
   una fase y en las pruebas automáticas).
   Los textos están en data/missions.js.
   ========================================================== */
(function (global) {
  "use strict";
  var RG = global.RG, PS = global.PS, util = RG.util;
  var HOME = "C:\\Users\\practicas";

  function S() { return PS.S; }
  function node(p) { return S().vfs.get(p, []); }
  function text(p) {
    var n = node(p);
    return n && n.type === "file" ? n.content : null;
  }
  function isDir(p) {
    var n = node(p);
    return !!n && n.type === "dir";
  }
  function cwd() { return S().vfs.join(S().state.cwd); }
  function ends(p, name) { return new RegExp(name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "$", "i").test(String(p || "")); }

  var LOGIC = {
    /* ---------------- FASE 1 · ORIENTACIÓN ---------------- */
    "PSH-01": {
      check: function (ev) { return !!ev && ev.type === "pwd"; },
      solution: ["Get-Location"]
    },
    "PSH-02": {
      check: function (ev) { return !!ev && ev.type === "ls" && ev.path === HOME && !ev.only; },
      solution: ["Get-ChildItem"]
    },
    "PSH-03": {
      check: function (ev) { return !!ev && ev.type === "ls" && ev.only === "dir"; },
      solution: ["Get-ChildItem -Directory"]
    },
    "PSH-04": {
      check: function () { return cwd() === HOME + "\\Documentos"; },
      solution: ["Set-Location Documentos"]
    },
    "PSH-05": {
      check: function () { return cwd() === HOME; },
      solution: ["Set-Location .."]
    },
    "PSH-06": {
      check: function (ev) { return !!ev && ev.type === "ls" && ev.recurse; },
      solution: ["Get-ChildItem -Recurse"]
    },
    "PSH-07": {
      check: function (ev) { return !!ev && ev.type === "get-help" && ev.name === "Get-ChildItem"; },
      solution: ["Get-Help Get-ChildItem"]
    },

    /* ---------------- FASE 2 · LEER SIN MIEDO ---------------- */
    "PSH-08": {
      check: function (ev) { return !!ev && ev.type === "cat" && ends(ev.path, "Bienvenida.txt") && !ev.head && !ev.tail; },
      solution: ["Get-Content Bienvenida.txt"]
    },
    "PSH-09": {
      check: function (ev) { return !!ev && ev.type === "cat" && ev.head === 3 && ends(ev.path, "acceso.log"); },
      solution: ["Get-Content Registros\\acceso.log -TotalCount 3"]
    },
    "PSH-10": {
      check: function (ev) { return !!ev && ev.type === "cat" && ev.tail === 3 && ends(ev.path, "sistema.log"); },
      solution: ["Get-Content Registros\\sistema.log -Tail 3"]
    },
    "PSH-11": {
      check: function (ev) { return !!ev && ev.type === "grep" && /warn/i.test(ev.pattern); },
      solution: ["Select-String -Pattern WARN -Path Registros\\acceso.log"]
    },
    "PSH-12": {
      check: function (ev) { return !!ev && ev.type === "test-path" && ev.result && /compartido/i.test(ev.path); },
      solution: ["Test-Path C:\\Compartido"]
    },

    /* ---------------- FASE 3 · CREAR Y ORDENAR ---------------- */
    "PSH-13": {
      check: function () { return isDir(HOME + "\\Tareas\\Entregas"); },
      solution: ["New-Item -Path Tareas\\Entregas -ItemType Directory"]
    },
    "PSH-14": {
      check: function () {
        var t = text(HOME + "\\Tareas\\Entregas\\Parte.txt");
        return !!t && t.trim().length > 0;
      },
      solution: ["Set-Content -Path Tareas\\Entregas\\Parte.txt -Value \"Punto de acceso de planta 2 averiado\""]
    },
    "PSH-15": {
      check: function () {
        var t = text(HOME + "\\Tareas\\Entregas\\Parte.txt");
        return !!t && util.linesOf(t).filter(function (l) { return l.trim(); }).length >= 2;
      },
      solution: ["Add-Content -Path Tareas\\Entregas\\Parte.txt -Value \"Enlace de respaldo de Santa Cruz cortado\""]
    },
    "PSH-16": {
      check: function () {
        var orig = text(HOME + "\\Documentos\\Informe-Red.txt");
        var copia = text(HOME + "\\Documentos\\Informe-Red.bak");
        return !!copia && copia === orig;
      },
      solution: ["Copy-Item -Path Documentos\\Informe-Red.txt -Destination Documentos\\Informe-Red.bak"]
    },
    "PSH-17": {
      check: function () {
        return !!text(HOME + "\\Tareas\\Entregas\\Pendientes.txt") && !node(HOME + "\\Tareas\\Pendientes.txt");
      },
      solution: ["Move-Item -Path Tareas\\Pendientes.txt -Destination Tareas\\Entregas"]
    },
    "PSH-18": {
      check: function () { return !node(HOME + "\\Documentos\\Informe-Red.bak"); },
      solution: ["Remove-Item Documentos\\Informe-Red.bak"]
    },

    /* ---------------- FASE 4 · TUBERÍA DE OBJETOS ---------------- */
    "PSH-19": {
      check: function (ev) { return !!ev && ev.type === "get-member" && ev.count > 0; },
      solution: ["Get-ChildItem | Get-Member"]
    },
    "PSH-20": {
      check: function (ev) { return !!ev && ev.type === "where" && /\.log/i.test(ev.expr); },
      solution: ["Get-ChildItem -Recurse | Where-Object Name -like \"*.log\""]
    },
    "PSH-21": {
      check: function (ev) { return !!ev && ev.type === "sort" && /length/i.test(ev.property || "") && ev.desc; },
      solution: ["Get-ChildItem Documentos | Sort-Object Length -Descending"]
    },
    "PSH-22": {
      check: function (ev) { return !!ev && ev.type === "select" && String(ev.first) === "3"; },
      solution: ["Get-ChildItem Documentos | Sort-Object Length -Descending | Select-Object -First 3"]
    },
    "PSH-23": {
      check: function (ev) { return !!ev && ev.type === "measure" && /length/i.test(ev.property || "") && ev.sum; },
      solution: ["Get-ChildItem Documentos | Measure-Object -Property Length -Sum"]
    },
    "PSH-24": {
      check: function (ev) { return !!ev && ev.type === "group" && /extension/i.test(ev.property || ""); },
      solution: ["Get-ChildItem -Recurse | Group-Object Extension"]
    },

    /* ---------------- FASE 5 · CONOCER LA CONSOLA ---------------- */
    "PSH-25": {
      check: function (ev) { return !!ev && ev.type === "get-command" && /^item$/i.test(ev.noun || ""); },
      solution: ["Get-Command -Noun Item"]
    },
    "PSH-26": {
      check: function (ev) { return !!ev && ev.type === "get-alias" && /^ls$/i.test(ev.name || ""); },
      solution: ["Get-Alias ls"]
    },
    "PSH-27": {
      check: function (ev) { return !!ev && ev.type === "history"; },
      solution: ["Get-History"]
    }
  };

  /* Archivos que no se deben perder: borrarlos es una decisión arriesgada */
  var PRECIOUS = [
    [HOME + "\\Bienvenida.txt", "has borrado el archivo de bienvenida del equipo."],
    [HOME + "\\Documentos\\Informe-Red.txt", "has borrado el informe de red original, que no tiene copia."],
    [HOME + "\\Documentos\\Notas.md", "has borrado las notas del equipo."],
    [HOME + "\\Registros\\acceso.log", "has borrado el registro de accesos, que es la prueba de los intentos fallidos."],
    [HOME + "\\Scripts\\copia.ps1", "has borrado el script de copia de seguridad."]
  ];

  PS.watch = function (S, ev) {
    if (ev.type !== "rm") { return; }
    PRECIOUS.forEach(function (p) {
      if (S.vfs.get(p[0], [])) { return; }
      S.game.addRisky("rm:" + p[0], p[1]);
    });
  };

  /* Contenido + lógica = tareas del juego */
  PS.MISSIONS = PS.MISSION_CONTENT.map(function (m, i) {
    var code = "PSH-" + util.pad2(i + 1);
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
