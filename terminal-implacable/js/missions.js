/* ==========================================================
   Lógica de las tareas: cómo se comprueba cada una y con qué
   secuencia de órdenes se resuelve (se usa para empezar por
   una fase y en las pruebas automáticas).
   Los textos están en data/missions.js.
   ========================================================== */
(function (global) {
  "use strict";
  var RG = global.RG, LX = global.LX, util = RG.util;
  var HOME = "/home/hamilton";

  function S() { return LX.S; }
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
  function typed() { return S().shell.currentText || ""; }
  function ends(p, name) { return new RegExp(name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "$").test(String(p || "")); }

  var LOGIC = {
    /* ---------------- FASE 1 · ORIENTACIÓN ---------------- */
    "LNX-01": {
      check: function (ev) { return !!ev && ev.type === "pwd"; },
      solution: ["pwd"]
    },
    "LNX-02": {
      check: function (ev) { return !!ev && ev.type === "ls" && ev.path === HOME; },
      solution: ["ls"]
    },
    "LNX-03": {
      check: function (ev) { return !!ev && ev.type === "ls" && ev.long && ev.path === HOME; },
      solution: ["ls -l"]
    },
    "LNX-04": {
      check: function (ev) { return !!ev && ev.type === "ls" && ev.long && ev.all; },
      solution: ["ls -la"]
    },
    "LNX-05": {
      check: function () { return cwd() === HOME + "/documentos"; },
      solution: ["cd documentos"]
    },
    "LNX-06": {
      check: function () { return cwd() === HOME; },
      solution: ["cd .."]
    },
    "LNX-07": {
      check: function (ev) { return !!ev && ev.type === "tree"; },
      solution: ["tree"]
    },

    /* ---------------- FASE 2 · LEER SIN MIEDO ---------------- */
    "LNX-08": {
      check: function (ev) { return !!ev && ev.type === "cat" && ends(ev.path, "bienvenida.txt"); },
      solution: ["cat bienvenida.txt"]
    },
    "LNX-09": {
      check: function (ev) { return !!ev && ev.type === "head" && ev.lines === 3 && ends(ev.path, "acceso.log"); },
      solution: ["head -n 3 registros/acceso.log"]
    },
    "LNX-10": {
      check: function (ev) { return !!ev && ev.type === "tail" && ev.lines === 3 && ends(ev.path, "sistema.log"); },
      solution: ["tail -n 3 registros/sistema.log"]
    },
    "LNX-11": {
      check: function (ev) { return !!ev && ev.type === "wc" && ev.onlyLines && ends(ev.path, "acceso.log"); },
      solution: ["wc -l registros/acceso.log"]
    },
    "LNX-12": {
      check: function (ev) {
        return !!ev && ev.type === "grep" && /warn/i.test(ev.pattern) &&
          ev.targets.some(function (t) { return ends(t, "acceso.log"); });
      },
      solution: ["grep WARN registros/acceso.log"]
    },
    "LNX-13": {
      check: function (ev) { return !!ev && ev.type === "file" && ends(ev.path, "copia.sh"); },
      solution: ["file scripts/copia.sh"]
    },

    /* ---------------- FASE 3 · CREAR Y ORDENAR ---------------- */
    "LNX-14": {
      check: function () { return isDir(HOME + "/tareas/entregas"); },
      solution: ["mkdir tareas/entregas"]
    },
    "LNX-15": {
      check: function () {
        var orig = text(HOME + "/documentos/informe-red.txt");
        var copia = text(HOME + "/documentos/informe-red.txt.bak");
        return !!copia && copia === orig;
      },
      solution: ["cp documentos/informe-red.txt documentos/informe-red.txt.bak"]
    },
    "LNX-16": {
      check: function () {
        var t = text(HOME + "/tareas/entregas/parte.txt");
        return !!t && t.trim().length > 0;
      },
      solution: ["echo \"Punto de acceso de planta 2 averiado\" > tareas/entregas/parte.txt"]
    },
    "LNX-17": {
      check: function () {
        var t = text(HOME + "/tareas/entregas/parte.txt");
        return !!t && util.linesOf(t).filter(function (l) { return l.trim(); }).length >= 2;
      },
      react: function (ev, d) {
        if (ev.type === "write" && ends(ev.path, "parte.txt") && !ev.append && !d.warned) {
          d.warned = true;
        }
      },
      solution: ["echo \"Enlace de respaldo de Santa Cruz cortado\" >> tareas/entregas/parte.txt"]
    },
    "LNX-18": {
      check: function () {
        return !!text(HOME + "/tareas/entregas/pendientes.txt") && !node(HOME + "/tareas/pendientes.txt");
      },
      solution: ["mv tareas/pendientes.txt tareas/entregas/"]
    },
    "LNX-19": {
      check: function () { return !node(HOME + "/documentos/informe-red.txt.bak"); },
      solution: ["rm documentos/informe-red.txt.bak"]
    },

    /* ---------------- FASE 4 · BUSCAR Y FILTRAR ---------------- */
    "LNX-20": {
      check: function (ev) {
        return !!ev && ev.type === "find" && !!ev.opts.name && /notas\.md/.test(ev.opts.name) &&
          ev.results.some(function (r) { return ends(r, "notas.md"); });
      },
      solution: ["find . -name notas.md"]
    },
    "LNX-21": {
      check: function (ev) {
        if (!ev || ev.type !== "grep" || !/error/i.test(ev.pattern)) { return false; }
        return ev.files >= 3 && ev.found;
      },
      solution: ["grep -r ERROR registros"]
    },
    "LNX-22": {
      check: function (ev) {
        return !!ev && ev.type === "grep" && /warn/i.test(ev.pattern) && /\|\s*wc\b/.test(typed());
      },
      solution: ["grep WARN registros/acceso.log | wc -l"]
    },
    "LNX-23": {
      check: function () {
        var t = text(HOME + "/tareas/entregas/resumen.txt");
        return !!t && /^\s*\d+\s*$/.test(t);
      },
      solution: ["grep WARN registros/acceso.log | wc -l > tareas/entregas/resumen.txt"]
    },

    /* ---------------- FASE 5 · CONOCER EL SISTEMA ---------------- */
    "LNX-24": {
      check: function (ev) { return !!ev && ev.type === "whoami"; },
      solution: ["whoami"]
    },
    "LNX-25": {
      check: function (ev) { return !!ev && (ev.type === "id" || ev.type === "groups"); },
      solution: ["id"]
    },
    "LNX-26": {
      check: function (ev) { return !!ev && ev.type === "man" && ev.name === "ls"; },
      solution: ["man ls"]
    },
    "LNX-27": {
      check: function (ev) { return !!ev && ev.type === "history"; },
      solution: ["history"]
    }
  };

  /* Ficheros que no se deben perder: borrarlos es una decisión arriesgada */
  var PRECIOUS = [
    [HOME + "/bienvenida.txt", "has borrado el fichero de bienvenida del servidor."],
    [HOME + "/documentos/informe-red.txt", "has borrado el informe de red original, que no tiene copia."],
    [HOME + "/documentos/notas.md", "has borrado las notas del equipo."],
    [HOME + "/registros/acceso.log", "has borrado el registro de accesos, que es la prueba de los intentos fallidos."],
    [HOME + "/scripts/copia.sh", "has borrado el script de copia de seguridad."]
  ];

  LX.watch = function (S, ev) {
    if (ev.type !== "rm") { return; }
    PRECIOUS.forEach(function (p) {
      if (S.vfs.get(p[0], [])) { return; }
      S.game.addRisky("rm:" + p[0], p[1]);
    });
  };

  /* Contenido + lógica = tareas del juego */
  LX.MISSIONS = LX.MISSION_CONTENT.map(function (m, i) {
    var code = "LNX-" + util.pad2(i + 1);
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
