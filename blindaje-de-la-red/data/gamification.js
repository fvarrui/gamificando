/* ==========================================================
   Puntuación, niveles e insignias
   ========================================================== */
(function (global) {
  "use strict";
  var BD = global.BD = global.BD || {};

  BD.HINT_COST = 25;
  BD.RISKY_PENALTY = 50;
  BD.PROACTIVE_BONUS = 25;
  BD.FAST_TIME_MS = 8 * 60 * 1000;

  BD.LEVELS = [
    { min: 0,   n: 1, name: "Aprendiz" },
    { min: 300, n: 2, name: "Analista junior" },
    { min: 450, n: 3, name: "Analista senior" },
    { min: 575, n: 4, name: "Escudo digital" }
  ];

  BD.BADGES = [
    { id: "clean",  icon: "🛡️", name: "Sin daños colaterales", desc: "No detuviste ningún servicio legítimo." },
    { id: "self",   icon: "🧠", name: "Autosuficiente",        desc: "Completaste la operación sin pedir pistas." },
    { id: "tools",  icon: "🧰", name: "Multiherramienta",      desc: "Neutralizaste amenazas con al menos 3 técnicas distintas." },
    { id: "fast",   icon: "⚡", name: "Respuesta rápida",      desc: "Cerraste el incidente en menos de 8 minutos." },
    { id: "proact", icon: "🔭", name: "Proactivo",             desc: "Neutralizaste una amenaza antes de que llegara su alerta." },
    { id: "rtfm",   icon: "📚", name: "Lee el manual",         desc: "Consultaste al menos una página de man." }
  ];
})(this);
