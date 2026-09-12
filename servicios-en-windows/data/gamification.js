/* ==========================================================
   Fases, puntuación, niveles e insignias
   ========================================================== */
(function (global) {
  "use strict";
  var SW = global.SW = global.SW || {};

  SW.HINT_COST = 25;
  SW.RISKY_PENALTY = 50;
  SW.PROACTIVE_BONUS = 25;
  SW.FAST_TIME_MS = 22 * 60 * 1000;

  SW.PHASES = [
    { n: 1, name: "Diagnóstico",     desc: "Ver qué servicios hay y en qué estado están" },
    { n: 2, name: "Deshabilitado",   desc: "Por qué un servicio no arranca ni a mano" },
    { n: 3, name: "Tipos de inicio", desc: "Automático, Manual y Deshabilitado" },
    { n: 4, name: "Herramientas",    desc: "sc, net y procesos" },
    { n: 5, name: "Cierre",          desc: "Verificación y parte de guardia" }
  ];

  SW.LEVELS = [
    { min: 0,    n: 1, name: "Mira el estado" },
    { min: 900,  n: 2, name: "Arranca y detiene" },
    { min: 1750,  n: 3, name: "Controla el inicio" },
    { min: 2500, n: 4, name: "Cierra la guardia" }
  ];

  SW.BADGES = [
    { id: "clean",   icon: "🛡️", name: "Sin daños colaterales", desc: "No detuviste ningún servicio que la empresa necesitaba." },
    { id: "self",    icon: "🧠", name: "Autosuficiente",   desc: "Cerraste la guardia sin pedir pistas." },
    { id: "rtfm",    icon: "📚", name: "Get-Help",         desc: "Consultaste la ayuda integrada de un comando." },
    { id: "startup", icon: "🔁", name: "Inicio bajo control", desc: "Cada servicio quedó con el tipo de inicio que le corresponde." },
    { id: "objects", icon: "🧩", name: "Filtrar servicios", desc: "Usaste la tubería de objetos para filtrar por estado o tipo de inicio." },
    { id: "fast",    icon: "⚡", name: "Guardia corta",    desc: "Resolviste el incidente en menos de 22 minutos." }
  ];
})(this);
