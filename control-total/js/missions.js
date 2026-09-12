/* ==========================================================
   Lógica de las tareas: cómo se comprueba cada una y con qué
   secuencia de comandos se resuelve.
   Los textos están en data/missions.js.
   ========================================================== */
(function (global) {
  "use strict";
  var RG = global.RG, PW = global.PW, util = RG.util;
  var DATOS = "C:\\Datos";

  function S() { return PW.S; }
  function node(p) { return S().vfs.get(p, []); }
  /* ¿Tiene el nodo una ACE con esa identidad, derechos y tipo? */
  function ace(p, identity, rights, type) {
    var n = node(p);
    if (!n || !n.aces) { return false; }
    return n.aces.some(function (a) {
      return a.identity.toLowerCase() === identity.toLowerCase() &&
        (!rights || a.rights === rights) &&
        (!type || a.type === type);
    });
  }
  function ownAce(p, identity, rights, type) {
    var n = node(p);
    if (!n || !n.aces) { return false; }
    return n.aces.some(function (a) {
      return !a.inherited && a.identity.toLowerCase() === identity.toLowerCase() &&
        (!rights || a.rights === rights) && (!type || a.type === type);
    });
  }
  function noAce(p, identity) {
    var n = node(p);
    if (!n || !n.aces) { return true; }
    return !n.aces.some(function (a) { return a.identity.toLowerCase() === identity.toLowerCase(); });
  }
  function inherits(p) {
    var n = node(p);
    return !!n && n.inherit;
  }
  function eq(a, b) { return String(a || "").toLowerCase() === String(b || "").toLowerCase(); }

  var LOGIC = {
    /* ---------------- FASE 1 · RADIOGRAFÍA ---------------- */
    "NTF-01": {
      check: function (ev) { return !!ev && ev.type === "ls" && eq(ev.path, DATOS); },
      solution: ["Get-ChildItem"]
    },
    "NTF-02": {
      check: function (ev, d) {
        if (ev && ev.type === "getacl" && eq(ev.path, DATOS)) { d.acl = true; }
        if (ev && ev.type === "format" && ev.kind === "list") { d.list = true; }
        return !!d.acl && !!d.list;
      },
      solution: ["Get-Acl C:\\Datos | Format-List"]
    },
    "NTF-03": {
      check: function (ev) { return !!ev && ev.type === "getacl" && ev.tool === "icacls" && eq(ev.path, DATOS); },
      solution: ["icacls C:\\Datos"]
    },
    "NTF-04": {
      check: function (ev) { return !!ev && ev.type === "getacl" && ev.tool === "icacls" && eq(ev.path, DATOS + "\\Privado"); },
      solution: ["icacls C:\\Datos\\Privado"]
    },
    "NTF-05": {
      check: function (ev) { return !!ev && ev.type === "cat" && /credenciales\.txt$/i.test(ev.path || ""); },
      solution: ["Get-Content C:\\Datos\\Privado\\credenciales.txt"]
    },

    /* ---------------- FASE 2 · CONCEDER ---------------- */
    "NTF-06": {
      check: function () { return noAce(DATOS, "Todos"); },
      solution: ["icacls C:\\Datos /remove Todos"]
    },
    "NTF-07": {
      check: function () { return ownAce(DATOS, "Usuarios", "ReadAndExecute", "Allow"); },
      solution: ["icacls C:\\Datos /grant Usuarios:(RX)"]
    },
    "NTF-08": {
      check: function () { return ownAce(DATOS + "\\Proyectos", "Proyectos", "Modify", "Allow"); },
      solution: ["icacls C:\\Datos\\Proyectos /grant Proyectos:(M)"]
    },
    "NTF-09": {
      check: function () { return ownAce(DATOS + "\\Ventas", "Ventas", "Modify", "Allow"); },
      solution: ["icacls C:\\Datos\\Ventas /grant Ventas:(M)"]
    },
    "NTF-10": {
      check: function () { return ownAce(DATOS + "\\Direccion", "Direccion", "Read", "Allow"); },
      solution: ["icacls C:\\Datos\\Direccion /grant Direccion:(R)"]
    },

    /* ---------------- FASE 3 · HERENCIA ---------------- */
    "NTF-11": {
      check: function (ev) { return !!ev && ev.type === "getacl" && eq(ev.path, DATOS + "\\Privado"); },
      solution: ["icacls C:\\Datos\\Privado"]
    },
    "NTF-12": {
      check: function () {
        var n = node(DATOS + "\\Privado");
        return !!n && !n.inherit && !(n.aces || []).some(function (a) { return a.inherited; });
      },
      solution: ["icacls C:\\Datos\\Privado /inheritance:r"]
    },
    "NTF-13": {
      check: function () { return ownAce(DATOS + "\\Privado", "Administradores", "FullControl", "Allow"); },
      solution: ["icacls C:\\Datos\\Privado /grant Administradores:(F)"]
    },
    "NTF-14": {
      check: function (ev) {
        var n = node(DATOS + "\\Privado");
        return !!ev && ev.type === "getacl" && eq(ev.path, DATOS + "\\Privado") &&
          !!n && !(n.aces || []).some(function (a) { return a.inherited; });
      },
      solution: ["icacls C:\\Datos\\Privado"]
    },
    "NTF-15": {
      check: function () { return inherits(DATOS + "\\Ventas"); },
      solution: ["icacls C:\\Datos\\Ventas /inheritance:e"]
    },
    "NTF-16": {
      check: function () { return noAce(DATOS + "\\Ventas", "Todos"); },
      solution: ["icacls C:\\Datos\\Ventas /remove Todos"]
    },

    /* ---------------- FASE 4 · DENEGAR Y PROPIETARIO ---------------- */
    "NTF-17": {
      check: function () { return ownAce(DATOS + "\\Direccion", "Ventas", "ReadAndExecute", "Deny"); },
      solution: ["icacls C:\\Datos\\Direccion /deny Ventas:(RX)"]
    },
    "NTF-18": {
      check: function (ev) {
        return !!ev && ev.type === "getacl" && eq(ev.path, DATOS + "\\Direccion") &&
          ace(DATOS + "\\Direccion", "Ventas", null, "Deny");
      },
      solution: ["icacls C:\\Datos\\Direccion"]
    },
    "NTF-19": {
      check: function (ev) { return !!ev && ev.type === "getacl" && /plan-2027\.txt$/i.test(ev.path || ""); },
      solution: ["Get-Acl C:\\Datos\\Proyectos\\plan-2027.txt | Format-List"]
    },
    "NTF-20": {
      check: function () {
        var n = node(DATOS + "\\Proyectos\\plan-2027.txt");
        return !!n && n.owner !== "nielsen";
      },
      solution: ["takeown /F C:\\Datos\\Proyectos\\plan-2027.txt"]
    },
    "NTF-21": {
      check: function () {
        var n = node(DATOS + "\\Proyectos\\plan-2027.txt");
        return !!n && eq(n.owner, "Administradores");
      },
      solution: ["icacls C:\\Datos\\Proyectos\\plan-2027.txt /setowner Administradores"]
    },

    /* ---------------- FASE 5 · COMPROBACIÓN ---------------- */
    "NTF-22": {
      check: function (ev, d) {
        if (ev && ev.type === "getacl" && eq(ev.path, DATOS + "\\Proyectos")) { d.acl = true; }
        if (ev && ev.type === "format" && ev.kind === "list") { d.list = true; }
        return !!d.acl && !!d.list;
      },
      solution: ["Get-Acl C:\\Datos\\Proyectos | Format-List"]
    },
    "NTF-23": {
      check: function () {
        var n = node(DATOS + "\\permisos.txt");
        return !!n && /Datos/.test(n.content || "");
      },
      solution: ["icacls C:\\Datos > C:\\Datos\\permisos.txt"]
    },
    "NTF-24": {
      check: function () {
        var n = node(DATOS + "\\permisos.txt");
        return !!n && util.linesOf(n.content).length > 1 && /minimo|mínimo|criterio/i.test(n.content);
      },
      solution: ["Add-Content -Path C:\\Datos\\permisos.txt -Value \"Criterio: minimo privilegio por grupo; Privado sin herencia.\""]
    },
    "NTF-25": {
      check: function (ev) {
        return !!ev && ev.type === "getacl" && ev.tool === "icacls" && eq(ev.path, DATOS) && noAce(DATOS, "Todos");
      },
      solution: ["icacls C:\\Datos"]
    }
  };

  /* Vigilancia global: permisos de más y credenciales expuestas */
  PW.watch = function (S, ev) {
    if (ev.type === "setacl" && ev.rights === "FullControl" &&
        !/administradores/i.test(ev.identity || "")) {
      S.game.addRisky("acl:control-total",
        "has concedido Control total a «" + ev.identity + "» sobre " + ev.path +
        "; con Modificar le bastaba, y así no puede reescribir la propia ACL.");
    }
    if (ev.type === "setacl" && /^todos$/i.test(ev.identity || "")) {
      S.game.addRisky("acl:todos",
        "has vuelto a conceder permisos a la identidad «Todos», que es justo lo que veníamos a quitar.");
    }
    if (ev.type === "setacl" && /privado/i.test(ev.path || "") &&
        !/administradores/i.test(ev.identity || "")) {
      S.game.addRisky("acl:privado",
        "has dado acceso a la carpeta de credenciales a «" + ev.identity + "», que no la necesita.");
    }
    if (ev.type === "rm" && /credenciales\.txt$/i.test(ev.path || "")) {
      S.game.addRisky("rm:credenciales", "has borrado el fichero de credenciales en vez de protegerlo.");
    }
  };

  /* Contenido + lógica = tareas del juego */
  PW.MISSIONS = PW.MISSION_CONTENT.map(function (m, i) {
    var code = "NTF-" + util.pad2(i + 1);
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
