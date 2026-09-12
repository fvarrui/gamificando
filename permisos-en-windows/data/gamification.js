/* ==========================================================
   Fases, puntuación, niveles e insignias
   ========================================================== */
(function (global) {
  "use strict";
  var PW = global.PW = global.PW || {};

  PW.HINT_COST = 25;
  PW.RISKY_PENALTY = 50;
  PW.PROACTIVE_BONUS = 25;
  PW.FAST_TIME_MS = 16 * 60 * 1000;

  PW.PHASES = [
    { n: 1, name: "Radiografía",   desc: "Ver quién tiene qué con Get-Acl e icacls" },
    { n: 2, name: "Conceder",      desc: "Quitar el «Todos» y dar a cada grupo lo suyo" },
    { n: 3, name: "Herencia",      desc: "Romperla donde estorba y restaurarla donde falta" },
    { n: 4, name: "Denegar",       desc: "Denegaciones explícitas y cambio de propietario" },
    { n: 5, name: "Comprobación",  desc: "Verificar el resultado y dejarlo documentado" }
  ];

  PW.LEVELS = [
    { min: 0,    n: 1, name: "Lee una ACL" },
    { min: 450,  n: 2, name: "Maneja icacls" },
    { min: 900,  n: 3, name: "Controla la herencia" },
    { min: 1400, n: 4, name: "Administra NTFS" }
  ];

  PW.BADGES = [
    { id: "clean",   icon: "🛡️", name: "Sin agujeros",      desc: "No dejaste ningún «Todos» ni control total de más." },
    { id: "self",    icon: "🧠", name: "Autosuficiente",    desc: "Terminaste el bastionado sin pedir pistas." },
    { id: "rtfm",    icon: "📚", name: "Get-Help",          desc: "Consultaste la ayuda integrada de un comando." },
    { id: "minimal", icon: "🎯", name: "Mínimo privilegio", desc: "Cada grupo acabó solo con los permisos que necesitaba." },
    { id: "inherit", icon: "🧬", name: "Herencia bajo control", desc: "Rompiste la herencia en Privado y la restauraste en Ventas." },
    { id: "fast",    icon: "⚡", name: "Buen ritmo",        desc: "Completaste el bastionado en menos de 16 minutos." }
  ];
})(this);
