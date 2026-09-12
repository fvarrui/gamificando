/* ==========================================================
   Arranque del reto: se apoya entero en RG.Sandbox.
   ========================================================== */
(function (global) {
  "use strict";
  var RG = global.RG, SW = global.SW;

  SW.S = RG.Sandbox({
    shell: "pwsh",
    cfg: SW.cfg,
    build: SW.build,
    missions: SW.MISSIONS,
    phases: SW.PHASES,
    levels: SW.LEVELS,
    badges: SW.BADGES,
    hintCost: SW.HINT_COST,
    riskyPenalty: SW.RISKY_PENALTY,
    proactiveBonus: SW.PROACTIVE_BONUS,
    fastTimeMs: SW.FAST_TIME_MS,
    watch: SW.watch,

    man: RG.helpPages("Get-Service", "Start-Service", "Stop-Service", "Restart-Service", "Set-Service",
      "Get-Process", "Stop-Process", "sc", "net", "Where-Object", "Select-Object", "Sort-Object",
      "Format-Table", "Format-List", "Get-Member", "Get-Content", "Add-Content", "Get-ChildItem",
      "Get-Command", "Get-Help", "Get-History"),

    helpTitle: "Comandos disponibles en esta consola",
    helpGroups: [
      ["Consultar", ["Get-Service", "Get-Service -Name <svc>", "Get-Process", "sc.exe query <svc>", "sc.exe qc <svc>"]],
      ["Gobernar ahora", ["Start-Service", "Stop-Service", "Restart-Service", "net start <svc>", "net stop <svc>"]],
      ["Gobernar el inicio", ["Set-Service -StartupType Automatic|Manual|Disabled"]],
      ["Filtrar", ["Where-Object Status -eq Running", "Where-Object StartType -eq Automatic", "Sort-Object Name"]],
      ["Archivos", ["Get-Content", "Add-Content", "Get-ChildItem", "> archivo"]],
      ["Ayuda", ["Get-Help <comando>", "Get-Command", "help", "Clear-Host"]]
    ],

    labels: {
      stripIcon: "🛠 TAREA",
      wait: "En curso: resuélvelo desde la consola.",
      next: "Esperando la siguiente indicación…",
      report: "📋 Ver parte de guardia",
      emptyLog: "Aún no hay tareas.",
      idle: "Abriendo PowerShell como administrador…",
      idleIcon: "🛠",
      done: function () { return "✓ Resuelto"; },
      msgHead: function (m) { return "Mensaje de " + m.source + ":"; }
    },

    boot: [
      [0, "dim", "Windows PowerShell 7.4.0 · sesión con privilegios elevados"],
      [400, "text", "SRV-APP · ana · conectada por Escritorio remoto desde 192.168.10.5"],
      [800, "text", ""],
      [900, "warn", "*** INCIDENCIA ABIERTA 07:35 · la aplicación de nóminas no arranca. ***"]
    ],

    badgesOf: function (S, got) {
      function tipo(n) {
        var s = S.sys.service(n);
        return s ? s.startup : null;
      }
      got.startup = tipo("AtlanteApp") === "auto" && tipo("WinRM") === "auto" &&
        tipo("Spooler") === "disabled" && tipo("MSSQLSERVER") === "auto" && tipo("TermService") === "auto";
      got.objects = !!S.state.flags.usedPipe;
    },

    debriefText: function (S, got, doneCount) {
      var t = {};
      var app = S.sys.service("AtlanteApp");
      var spooler = S.sys.service("Spooler");
      t.title = got.clean ? "Guardia cerrada, nóminas en marcha" : "Nóminas en marcha… con daños colaterales";
      if (got.clean && got.self) {
        t.msg = "Impecable: diste con la causa (un tipo de inicio en Deshabilitado, que impide arrancar el servicio incluso a mano), " +
          "lo corregiste, dejaste fuera la cola de impresión y pusiste la administración remota en marcha. Sin pedir una sola pista.";
      } else if (got.clean) {
        t.msg = "Incidencia cerrada: la aplicación de nóminas arranca y seguirá arrancando sola, el servidor expone un servicio menos " +
          "y la administración remota está disponible para la próxima.";
      } else {
        t.msg = "La aplicación volvió, pero por el camino se detuvo algo que la empresa necesitaba. En una guardia, eso también es una caída: " +
          "revisa abajo las decisiones anotadas.";
      }
      if (app && app.startup !== "auto") {
        t.msg += " Ojo: AtlanteApp sigue sin estar en Automático, así que no arrancará sola en el próximo reinicio del servidor.";
      }
      if (spooler && spooler.startup === "auto") {
        t.msg += " Y la cola de impresión sigue en Automático: volverá a arrancar y a exponer su puerto en cuanto se reinicie.";
      }
      t.noRisky = "Ninguna: " + doneCount + " tareas resueltas sin tumbar ningún servicio necesario.";
      return t;
    }
  }).init();
})(this);
