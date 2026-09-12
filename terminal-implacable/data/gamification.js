/* ==========================================================
   Fases, puntuación, niveles e insignias
   ========================================================== */
(function (global) {
  "use strict";
  var LX = global.LX = global.LX || {};

  LX.HINT_COST = 20;
  LX.RISKY_PENALTY = 40;
  LX.PROACTIVE_BONUS = 20;
  LX.FAST_TIME_MS = 22 * 60 * 1000;

  LX.PHASES = [
    { n: 1, name: "Orientación",      desc: "Dónde estás y qué hay a tu alrededor" },
    { n: 2, name: "Leer sin miedo",   desc: "Ver el contenido de los ficheros sin modificarlos" },
    { n: 3, name: "Crear y ordenar",  desc: "Carpetas, copias, movimientos y borrados" },
    { n: 4, name: "Buscar y filtrar", desc: "Encontrar cosas y encadenar órdenes con tuberías" },
    { n: 5, name: "Conocer el sistema", desc: "Identidad, ayuda y cierre de la jornada" }
  ];

  LX.LEVELS = [
    { min: 0,    n: 1, name: "Primer día" },
    { min: 800,  n: 2, name: "Manos en el teclado" },
    { min: 1500,  n: 3, name: "Se defiende en consola" },
    { min: 2200, n: 4, name: "Ya no pregunta dónde está" }
  ];

  LX.BADGES = [
    { id: "clean",  icon: "🧯", name: "Sin sustos",        desc: "No borraste nada que hiciera falta." },
    { id: "self",   icon: "🧠", name: "Autosuficiente",    desc: "Terminaste la jornada sin pedir pistas." },
    { id: "rtfm",   icon: "📚", name: "Lee el manual",     desc: "Consultaste al menos una página de man." },
    { id: "pipes",  icon: "🪈", name: "Fontanería",        desc: "Encadenaste órdenes con una tubería." },
    { id: "fast",   icon: "⚡", name: "Buen ritmo",        desc: "Completaste la jornada en menos de 22 minutos." },
    { id: "tab",    icon: "↹",  name: "Manos vagas",       desc: "Usaste el tabulador para autocompletar." }
  ];
})(this);
