/* ==========================================================
   Arranque del reto: se apoya entero en RG.Sandbox.
   ========================================================== */
(function (global) {
  "use strict";
  var RG = global.RG, PW = global.PW;

  PW.S = RG.Sandbox({
    shell: "pwsh",
    cfg: PW.cfg,
    build: PW.build,
    missions: PW.MISSIONS,
    phases: PW.PHASES,
    levels: PW.LEVELS,
    badges: PW.BADGES,
    hintCost: PW.HINT_COST,
    riskyPenalty: PW.RISKY_PENALTY,
    proactiveBonus: PW.PROACTIVE_BONUS,
    fastTimeMs: PW.FAST_TIME_MS,
    admin: false,
    watch: PW.watch,

    man: RG.helpPages("Get-ChildItem", "Set-Location", "Get-Location", "Get-Content", "Set-Content",
      "Add-Content", "New-Item", "Remove-Item", "Copy-Item", "Move-Item", "Test-Path", "Select-String",
      "Get-Acl", "Set-Acl", "icacls", "takeown", "Where-Object", "Select-Object", "Sort-Object",
      "Format-List", "Format-Table", "Get-Member", "Get-Command", "Get-Help", "Get-History"),

    helpTitle: "Comandos disponibles en esta consola",
    helpGroups: [
      ["Mirar", ["Get-ChildItem", "Get-Content", "Get-Acl", "icacls <ruta>", "Format-List"]],
      ["Conceder y quitar", ["icacls <ruta> /grant Id:(F|M|RX|R|W)", "icacls <ruta> /deny Id:(…)", "icacls <ruta> /remove Id", "Set-Acl"]],
      ["Herencia", ["icacls <ruta> /inheritance:d", "/inheritance:r", "/inheritance:e"]],
      ["Propietario", ["takeown /F <ruta>", "icacls <ruta> /setowner Id"]],
      ["Ficheros", ["New-Item", "Set-Content", "Add-Content", "Copy-Item", "Move-Item", "Remove-Item", "notepad"]],
      ["Ayuda", ["Get-Help <comando>", "Get-Command", "help", "Clear-Host"]]
    ],

    labels: {
      stripIcon: "🔐 TAREA",
      wait: "En curso: resuélvelo desde la consola.",
      next: "Esperando la siguiente petición…",
      report: "📋 Ver informe del bastionado",
      emptyLog: "Aún no hay tareas.",
      idle: "Abriendo PowerShell como administrador…",
      idleIcon: "🔐",
      done: function () { return "✓ Permisos ajustados"; },
      msgHead: function (m) { return "Mensaje de " + m.source + ":"; }
    },

    boot: [
      [0, "dim", "Windows PowerShell 7.4.0 · sesión con privilegios elevados"],
      [400, "text", "SRV-DATOS · hamilton · servidor de archivos instalado el 2 de octubre por Insular Sistemas S.L."],
      [800, "text", ""],
      [900, "warn", "*** AVISO: auditoría de permisos pendiente. C:\\Datos tiene «Todos · Control total». ***"]
    ],

    badgesOf: function (S, got) {
      var privado = S.vfs.get("C:\\Datos\\Privado", []);
      var ventas = S.vfs.get("C:\\Datos\\Ventas", []);
      var datos = S.vfs.get("C:\\Datos", []);
      got.inherit = !!privado && !privado.inherit && !!ventas && ventas.inherit;
      /* Mínimo privilegio: nadie con control total salvo administración */
      var excesos = false;
      S.vfs.walk(S.vfs.norm("C:\\Datos", []), function (n) {
        (n.aces || []).forEach(function (a) {
          if (a.type === "Allow" && a.rights === "FullControl" && !/administradores/i.test(a.identity)) { excesos = true; }
          if (/^todos$/i.test(a.identity)) { excesos = true; }
        });
      });
      got.minimal = !excesos && S.game.risky.length === 0;
      got.clean = S.game.risky.length === 0 && !!datos && !(datos.aces || []).some(function (a) {
        return /^todos$/i.test(a.identity);
      });
    },

    debriefText: function (S, got, doneCount) {
      var t = {};
      var privado = S.vfs.get("C:\\Datos\\Privado", []);
      t.title = got.clean ? "Servidor de archivos bajo control" : "Servidor bastionado… con algún permiso de más";
      if (got.clean && got.self) {
        t.msg = "Impecable: fuera el «Todos», cada departamento con permisos solo en su carpeta, la herencia cortada donde guarda credenciales " +
          "y restaurada donde hacía falta. Y todo sin pedir una sola pista.";
      } else if (got.clean) {
        t.msg = "C:\\Datos ya no está abierta de par en par: permisos por grupo, denegación explícita para lo que no debe verse, propietarios corporativos " +
          "y un informe escrito para quien venga detrás.";
      } else {
        t.msg = "El bastionado está hecho, pero por el camino se concedieron permisos de más. En NTFS, cada ACE que sobra es una puerta: " +
          "revisa abajo qué pasó y por qué importa.";
      }
      if (privado && privado.inherit) {
        t.msg += " Ojo: la carpeta de credenciales sigue heredando permisos de C:\\Datos, así que cualquier cambio de arriba vuelve a bajar hasta ella.";
      }
      t.noRisky = "Ninguna: " + doneCount + " tareas resueltas dando a cada grupo solo lo que necesitaba.";
      return t;
    }
  }).init();
})(this);
