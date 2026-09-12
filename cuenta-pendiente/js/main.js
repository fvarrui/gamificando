/* ==========================================================
   Arranque del reto: se apoya entero en RG.Sandbox.
   ========================================================== */
(function (global) {
  "use strict";
  var RG = global.RG, UW = global.UW;

  UW.S = RG.Sandbox({
    shell: "pwsh",
    cfg: UW.cfg,
    build: UW.build,
    missions: UW.MISSIONS,
    phases: UW.PHASES,
    levels: UW.LEVELS,
    badges: UW.BADGES,
    hintCost: UW.HINT_COST,
    riskyPenalty: UW.RISKY_PENALTY,
    proactiveBonus: UW.PROACTIVE_BONUS,
    fastTimeMs: UW.FAST_TIME_MS,
    watch: UW.watch,

    man: RG.helpPages("Get-LocalUser", "New-LocalUser", "Set-LocalUser", "Remove-LocalUser",
      "Enable-LocalUser", "Disable-LocalUser", "Get-LocalGroup", "New-LocalGroup",
      "Get-LocalGroupMember", "Add-LocalGroupMember", "Remove-LocalGroupMember", "net",
      "Get-ChildItem", "Get-Content", "Set-Content", "Remove-Item", "Where-Object",
      "Select-Object", "Sort-Object", "Format-Table", "Format-List", "Get-Member",
      "Get-Command", "Get-Help", "Get-History"),

    helpTitle: "Comandos disponibles en esta consola",
    helpGroups: [
      ["Consultar", ["Get-LocalUser", "Get-LocalGroup", "Get-LocalGroupMember", "net user", "net localgroup"]],
      ["Cuentas", ["New-LocalUser", "Set-LocalUser", "Enable-LocalUser", "Disable-LocalUser", "Remove-LocalUser"]],
      ["Grupos", ["New-LocalGroup", "Add-LocalGroupMember", "Remove-LocalGroupMember", "Remove-LocalGroup"]],
      ["Tubería de objetos", ["Where-Object", "Select-Object", "Sort-Object", "Format-Table", "Format-List", "Get-Member"]],
      ["Archivos", ["Get-ChildItem", "Get-Content", "Set-Content", "Remove-Item"]],
      ["Ayuda", ["Get-Help <comando>", "Get-Command", "help", "Clear-Host"]]
    ],

    labels: {
      stripIcon: "👥 TAREA",
      wait: "En curso: resuélvelo desde la consola.",
      next: "Esperando la siguiente petición…",
      report: "📋 Ver informe de la semana",
      emptyLog: "Aún no hay tareas.",
      idle: "Abriendo PowerShell como administrador…",
      idleIcon: "👥",
      done: function () { return "✓ Hecho"; },
      msgHead: function (m) { return "Mensaje de " + m.source + ":"; }
    },

    boot: [
      [0, "dim", "Windows PowerShell 7.4.0 · sesión con privilegios elevados"],
      [400, "text", "SRV-OFICINA · hamilton · equipo fuera de dominio: todas las cuentas son locales"],
      [800, "text", ""],
      [900, "ok", "Semana de altas y bajas. El parte está en C:\\Users\\hamilton\\altas.txt."]
    ],

    badgesOf: function (S, got) {
      var vandamme = S.sys.user("vandamme");
      got.soft = !!vandamme && !vandamme.enabled;
      got.audit = !!S.state.flags.auditoria;
    },

    onComplete: function (S, i, m) {
      if (m.code === "CTA-05" || m.code === "CTA-24") { S.state.flags.auditoria = true; }
    },

    debriefText: function (S, got, doneCount) {
      var t = {};
      var temporal = S.sys.user("temporal");
      t.title = got.clean ? "Altas y bajas cerradas" : "Altas y bajas… con algún destrozo";
      if (got.clean && got.self) {
        t.msg = "Impecable: dos altas con su grupo, la baja deshabilitada en lugar de eliminada, la cuenta compartida fuera con su perfil, " +
          "y una auditoría de cuentas inactivas hecha con la tubería de objetos. Sin pedir una sola pista.";
      } else if (got.clean) {
        t.msg = "La semana queda cerrada: Carrie-Anne y Jackie tienen cuenta y grupo, Jean-Claude está deshabilitado, la cuenta del curso de 2023 ha desaparecido " +
          "y hay un listado escrito para el parte.";
      } else {
        t.msg = "El trabajo está hecho, pero por el camino hubo movimientos que en un equipo real cuestan caros: " +
          "revisa abajo qué pasó y por qué importa.";
      }
      if (temporal) {
        t.msg += " Ojo: la cuenta compartida «temporal» sigue existiendo, y con ella la imposibilidad de saber quién hace qué.";
      }
      t.noRisky = "Ninguna: " + doneCount + " tareas resueltas sin eliminar cuentas en activo ni repartir privilegios de más.";
      return t;
    }
  }).init();
})(this);
