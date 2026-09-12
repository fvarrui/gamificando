/* ==========================================================
   Arranque del reto: se apoya entero en RG.Sandbox, que monta
   el sistema simulado, la consola, el motor de tareas, las
   fases y el informe final.
   ========================================================== */
(function (global) {
  "use strict";
  var RG = global.RG, PS = global.PS;

  PS.S = RG.Sandbox({
    shell: "pwsh",
    cfg: PS.cfg,
    build: PS.build,
    missions: PS.MISSIONS,
    phases: PS.PHASES,
    levels: PS.LEVELS,
    badges: PS.BADGES,
    hintCost: PS.HINT_COST,
    riskyPenalty: PS.RISKY_PENALTY,
    proactiveBonus: PS.PROACTIVE_BONUS,
    fastTimeMs: PS.FAST_TIME_MS,
    admin: false,                 // en el primer día no se administra nada
    watch: PS.watch,

    man: RG.helpPages("Get-Location", "Set-Location", "Get-ChildItem", "Get-Item", "Get-Content",
      "Set-Content", "Add-Content", "New-Item", "Remove-Item", "Copy-Item", "Move-Item", "Rename-Item",
      "Test-Path", "Select-String", "Where-Object", "Select-Object", "Sort-Object", "Measure-Object",
      "Group-Object", "ForEach-Object", "Format-Table", "Format-List", "Get-Member", "Get-Command",
      "Get-Alias", "Get-Help", "Get-Date", "Get-History", "Write-Output"),

    helpTitle: "Comandos disponibles en esta consola",
    helpGroups: [
      ["Moverse", ["Get-Location", "Get-ChildItem", "Set-Location", "Get-Item"]],
      ["Leer", ["Get-Content", "Select-String", "Test-Path"]],
      ["Crear y organizar", ["New-Item", "Set-Content", "Add-Content", "Copy-Item", "Move-Item", "Rename-Item", "Remove-Item", "notepad"]],
      ["Tubería de objetos", ["Where-Object", "Select-Object", "Sort-Object", "Measure-Object", "Group-Object", "ForEach-Object", "Get-Member", "Format-Table", "Format-List"]],
      ["Conocer la consola", ["Get-Command", "Get-Alias", "Get-Help", "Get-Date", "Get-History", "Clear-Host", "help"]],
      ["Alias habituales", ["ls = dir = gci", "cd = sl", "cat = gc = type", "rm = del", "cp = copy", "mv = move", "? = where", "% = foreach"]]
    ],

    labels: {
      stripIcon: "📋 TAREA",
      wait: "En curso: resuélvelo desde la consola.",
      next: "Esperando la siguiente tarea del equipo…",
      report: "📋 Ver informe de la jornada",
      emptyLog: "Aún no hay tareas.",
      idle: "Abriendo Windows PowerShell…",
      idleIcon: "🪟",
      done: function () { return "✓ Tarea resuelta"; },
      msgHead: function () { return "Mensaje de Arnold (Sistemas):"; }
    },

    boot: [
      [0, "dim", "Windows PowerShell 7.4.0"],
      [400, "dim", "Copyright (c) Microsoft Corporation. Todos los derechos reservados."],
      [700, "text", ""],
      [800, "text", "WS-PRACTICAS · hamilton · último inicio de sesión: lun 14 sep 2026 08:01"],
      [1000, "ok", "Sesión iniciada. Este es el equipo de prácticas: aquí no hay nada en producción."]
    ],

    badgesOf: function (S, got) {
      got.pipes = !!S.state.flags.usedPipe;
      got.objects = !!S.state.flags.usedMember;
    },

    onComplete: function (S, i, m) {
      if (m.code === "PSH-19") { S.state.flags.usedMember = true; }
    },

    debriefText: function (S, got, doneCount) {
      var t = {};
      t.title = got.clean ? "Primera jornada superada" : "Primera jornada… con algún borrado de más";
      if (got.clean && got.self) {
        t.msg = "Impecable: te has movido por el equipo, leído los registros, creado tus entregas y construido tuberías de objetos sin pedir una sola pista. " +
          "Ya sabes que en PowerShell todo son objetos, y eso es lo que lo cambia todo.";
      } else if (got.clean) {
        t.msg = "Jornada completa: sabes orientarte, leer archivos sin modificarlos, crear y ordenar carpetas, y filtrar, ordenar y contar objetos encadenando cmdlets. " +
          "Eso es exactamente lo que se espera de alguien en su primera semana.";
      } else {
        t.msg = "Has terminado las tareas, pero por el camino se perdió algún archivo que hacía falta. Remove-Item no pregunta ni manda nada a la papelera: " +
          "conviene comprobar antes con Get-ChildItem qué se va a borrar.";
      }
      if (!got.objects) {
        t.msg += " Para la próxima, acostúmbrate a Get-Member: es la forma de descubrir por qué propiedad se puede filtrar cualquier objeto.";
      }
      t.noRisky = "Ninguna: " + doneCount + " tareas resueltas sin perder ni un archivo.";
      return t;
    }
  }).init();
})(this);
