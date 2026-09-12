/* ==========================================================
   Fases, puntuación, niveles e insignias
   ========================================================== */
(function (global) {
  "use strict";
  var UG = global.UG = global.UG || {};

  UG.HINT_COST = 25;
  UG.RISKY_PENALTY = 50;
  UG.PROACTIVE_BONUS = 25;
  UG.FAST_TIME_MS = 26 * 60 * 1000;

  UG.PHASES = [
    { n: 1, name: "Quién hay",          desc: "Consultar cuentas, grupos y pertenencias" },
    { n: 2, name: "Altas",              desc: "Crear grupos y cuentas con su directorio personal" },
    { n: 3, name: "Pertenencias",       desc: "Meter y sacar gente de los grupos sin romper nada" },
    { n: 4, name: "Bajas y bloqueos",   desc: "Bloquear, deshabilitar y eliminar cuentas" },
    { n: 5, name: "Cuentas de servicio", desc: "Cuentas sin inicio de sesión y comprobación final" }
  ];

  UG.LEVELS = [
    { min: 0,    n: 1, name: "Consulta cuentas" },
    { min: 900,  n: 2, name: "Da de alta" },
    { min: 1750,  n: 3, name: "Reparte grupos" },
    { min: 2500, n: 4, name: "Administra identidades" }
  ];

  UG.BADGES = [
    { id: "clean",   icon: "🛡️", name: "Sin destrozos",     desc: "No sacaste a nadie de sus grupos ni borraste cuentas de más." },
    { id: "self",    icon: "🧠", name: "Autosuficiente",    desc: "Terminaste las altas y bajas sin pedir pistas." },
    { id: "rtfm",    icon: "📚", name: "Lee el manual",     desc: "Consultaste al menos una página de man." },
    { id: "nolog",   icon: "🚫", name: "Sin inicio de sesión", desc: "La cuenta de servicio quedó con /usr/sbin/nologin." },
    { id: "soft",    icon: "🔒", name: "Bloquear antes que borrar", desc: "Bloqueaste la cuenta de la baja en vez de eliminarla a la ligera." },
    { id: "fast",    icon: "⚡", name: "Buen ritmo",        desc: "Completaste la jornada en menos de 26 minutos." }
  ];
})(this);
