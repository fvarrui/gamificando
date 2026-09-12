/* ==========================================================
   Lógica de las tareas: cómo se comprueba cada una y con qué
   secuencia de comandos se resuelve.
   Los textos están en data/missions.js.
   ========================================================== */
(function (global) {
  "use strict";
  var RG = global.RG, UW = global.UW, util = RG.util;

  function S() { return UW.S; }
  function sys() { return UW.S.sys; }
  function user(n) { return sys().user(n); }
  function group(n) { return sys().group(n); }
  function inGroup(u, g) { return sys().inGroup(u, g); }
  function node(p) { return S().vfs.get(p, []); }
  function eq(a, b) { return String(a || "").toLowerCase() === String(b || "").toLowerCase(); }

  var LOGIC = {
    /* ---------------- FASE 1 · QUIÉN HAY ---------------- */
    "CTA-01": {
      check: function (ev) { return !!ev && ev.type === "cat" && /altas\.txt$/i.test(ev.path || ""); },
      solution: ["Get-Content altas.txt"]
    },
    "CTA-02": {
      check: function (ev) { return !!ev && ev.type === "get-user" && !ev.name; },
      solution: ["Get-LocalUser"]
    },
    "CTA-03": {
      check: function (ev) { return !!ev && ev.type === "get-group" && !ev.name; },
      solution: ["Get-LocalGroup"]
    },
    "CTA-04": {
      check: function (ev) { return !!ev && ev.type === "group-members" && eq(ev.group, "Administradores"); },
      solution: ["Get-LocalGroupMember -Group Administradores"]
    },
    "CTA-05": {
      check: function (ev, d) {
        if (ev && ev.type === "get-user") { d.users = true; }
        if (ev && ev.type === "where" && /enabled/i.test(ev.expr) && /false/i.test(ev.expr)) { d.filtro = true; }
        return !!d.users && !!d.filtro;
      },
      solution: ["Get-LocalUser | Where-Object Enabled -eq $false"]
    },

    /* ---------------- FASE 2 · ALTAS ---------------- */
    "CTA-06": {
      check: function () { return !!group("Formacion"); },
      solution: ["New-LocalGroup -Name Formacion -Description \"Plan de formacion interno\""]
    },
    "CTA-07": {
      check: function () {
        var u = user("moss");
        return !!u && /ventas/i.test(u.comment || "");
      },
      solution: ["New-LocalUser -Name moss -NoPassword -Description \"Ventas\""]
    },
    "CTA-08": {
      check: function (ev) { return !!ev && ev.type === "get-user" && eq(ev.name, "moss"); },
      solution: ["Get-LocalUser moss"]
    },
    "CTA-09": {
      check: function () {
        var u = user("chan");
        return !!u && /proyectos/i.test(u.comment || "");
      },
      solution: ["New-LocalUser -Name chan -NoPassword -Description \"Proyectos\""]
    },
    "CTA-10": {
      check: function () { return inGroup("chan", "Proyectos"); },
      solution: ["Add-LocalGroupMember -Group Proyectos -Member chan"]
    },

    /* ---------------- FASE 3 · PERTENENCIAS ---------------- */
    "CTA-11": {
      check: function () { return inGroup("moss", "Ventas"); },
      solution: ["Add-LocalGroupMember -Group Ventas -Member moss"]
    },
    "CTA-12": {
      check: function (ev) { return !!ev && ev.type === "group-members" && eq(ev.group, "Ventas"); },
      solution: ["Get-LocalGroupMember -Group Ventas"]
    },
    "CTA-13": {
      check: function () { return inGroup("chan", "Formacion"); },
      solution: ["Add-LocalGroupMember -Group Formacion -Member chan"]
    },
    "CTA-14": {
      check: function () { return !!user("vandamme") && !inGroup("vandamme", "Proyectos"); },
      solution: ["Remove-LocalGroupMember -Group Proyectos -Member vandamme"]
    },
    "CTA-15": {
      check: function (ev) { return !!ev && ev.type === "group-members" && eq(ev.group, "Proyectos"); },
      solution: ["Get-LocalGroupMember -Group Proyectos"]
    },

    /* ---------------- FASE 4 · BAJAS ---------------- */
    "CTA-16": {
      check: function (ev) { return !!ev && ev.type === "get-user" && eq(ev.name, "vandamme"); },
      solution: ["Get-LocalUser vandamme"]
    },
    "CTA-17": {
      check: function () {
        var u = user("vandamme");
        return !!u && !u.enabled;
      },
      solution: ["Disable-LocalUser -Name vandamme"]
    },
    "CTA-18": {
      check: function (ev) {
        var u = user("vandamme");
        return !!ev && ev.type === "get-user" && eq(ev.name, "vandamme") && !!u && !u.enabled;
      },
      solution: ["Get-LocalUser vandamme"]
    },
    "CTA-19": {
      check: function () { return !user("temporal"); },
      solution: ["Remove-LocalUser -Name temporal"]
    },
    "CTA-20": {
      check: function () { return !node("C:\\Users\\temporal"); },
      solution: ["Remove-Item C:\\Users\\temporal -Recurse"]
    },

    /* ---------------- FASE 5 · AUDITORÍA ---------------- */
    "CTA-21": {
      check: function (ev) { return !!ev && ev.type === "get-user" && ev.tool === "net"; },
      solution: ["net user"]
    },
    "CTA-22": {
      check: function (ev) {
        return !!ev && ev.type === "group-members" && ev.tool === "net" && eq(ev.group, "Administradores");
      },
      solution: ["net localgroup Administradores"]
    },
    "CTA-23": {
      check: function () {
        var u = user("moss");
        return !!u && /las palmas/i.test(u.comment || "");
      },
      solution: ["Set-LocalUser -Name moss -Description \"Ventas · Las Palmas\""]
    },
    "CTA-24": {
      check: function (ev, d) {
        if (ev && ev.type === "where" && /enabled/i.test(ev.expr) && /false/i.test(ev.expr)) { d.filtro = true; }
        if (ev && ev.type === "select" && /description/i.test(ev.property || "")) { d.select = true; }
        return !!d.filtro && !!d.select;
      },
      solution: ["Get-LocalUser | Where-Object Enabled -eq $false | Select-Object Name,Description"]
    },
    "CTA-25": {
      check: function () {
        var n = node("C:\\Users\\hamilton\\cuentas.txt");
        return !!n && /hamilton/i.test(n.content || "") && /moss/i.test(n.content || "");
      },
      solution: ["Get-LocalUser | Format-Table Name,Enabled > cuentas.txt"]
    }
  };

  /* Vigilancia global: los errores que de verdad hacen daño */
  UW.watch = function (S, ev) {
    if (ev.type === "userdel" && ev.name === "vandamme") {
      S.game.addRisky("remove:vandamme",
        "has eliminado la cuenta de Jean-Claude en vez de deshabilitarla: su identificador de seguridad no vuelve, " +
        "y con él se pierden sus permisos sobre los archivos.");
    }
    /* Eliminar cualquier cuenta que siga en activo se anota: su SID no vuelve */
    if (ev.type === "userdel" && ["temporal", "svc-viejo", "vandamme"].indexOf(ev.name) === -1) {
      S.game.addRisky("remove:activa",
        "has eliminado la cuenta de " + ev.name + ", que sigue en activo: su identificador de seguridad no vuelve.");
    }
    if (ev.type === "group-add" && /administradores/i.test(ev.group || "") &&
        ["moss", "chan", "vandamme", "temporal"].indexOf(ev.user) !== -1) {
      S.game.addRisky("admin:de-mas",
        "has metido a " + ev.user + " en Administradores: control total del equipo para alguien que no lo necesita.");
    }
  };

  /* Contenido + lógica = tareas del juego */
  UW.MISSIONS = UW.MISSION_CONTENT.map(function (m, i) {
    var code = "CTA-" + util.pad2(i + 1);
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
