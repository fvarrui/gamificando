/* ==========================================================
   Fases, puntuación, niveles e insignias
   ========================================================== */
(function (global) {
  "use strict";
  var UW = global.UW = global.UW || {};

  UW.HINT_COST = 25;
  UW.RISKY_PENALTY = 50;
  UW.PROACTIVE_BONUS = 25;
  UW.FAST_TIME_MS = 15 * 60 * 1000;

  UW.PHASES = [
    { n: 1, name: "Quién hay",        desc: "Consultar cuentas y grupos locales" },
    { n: 2, name: "Altas",            desc: "Crear grupos y cuentas nuevas" },
    { n: 3, name: "Pertenencias",     desc: "Añadir y quitar miembros de los grupos" },
    { n: 4, name: "Bajas",            desc: "Deshabilitar antes que eliminar" },
    { n: 5, name: "Auditoría",        desc: "Herramientas clásicas, revisión y parte final" }
  ];

  UW.LEVELS = [
    { min: 0,    n: 1, name: "Consulta cuentas" },
    { min: 400,  n: 2, name: "Da de alta" },
    { min: 850,  n: 3, name: "Reparte grupos" },
    { min: 1300, n: 4, name: "Administra identidades" }
  ];

  UW.BADGES = [
    { id: "clean",   icon: "🛡️", name: "Sin destrozos",     desc: "No eliminaste cuentas en activo ni diste privilegios de más." },
    { id: "self",    icon: "🧠", name: "Autosuficiente",    desc: "Terminaste las altas y bajas sin pedir pistas." },
    { id: "rtfm",    icon: "📚", name: "Get-Help",          desc: "Consultaste la ayuda integrada de un comando." },
    { id: "soft",    icon: "🔒", name: "Deshabilitar antes que borrar", desc: "La baja quedó deshabilitada, no eliminada." },
    { id: "audit",   icon: "🔎", name: "Auditoría",         desc: "Filtraste las cuentas deshabilitadas con la tubería de objetos." },
    { id: "fast",    icon: "⚡", name: "Buen ritmo",        desc: "Completaste la jornada en menos de 15 minutos." }
  ];
})(this);
