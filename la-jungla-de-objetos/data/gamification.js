/* ==========================================================
   Fases, puntuación, niveles e insignias
   ========================================================== */
(function (global) {
  "use strict";
  var PS = global.PS = global.PS || {};

  PS.HINT_COST = 20;
  PS.RISKY_PENALTY = 40;
  PS.PROACTIVE_BONUS = 20;
  PS.FAST_TIME_MS = 22 * 60 * 1000;

  PS.PHASES = [
    { n: 1, name: "Orientación",       desc: "Dónde estás y qué hay a tu alrededor" },
    { n: 2, name: "Leer sin miedo",    desc: "Ver el contenido de los archivos sin modificarlos" },
    { n: 3, name: "Crear y ordenar",   desc: "Carpetas, copias, movimientos y borrados" },
    { n: 4, name: "Tubería de objetos", desc: "Filtrar, ordenar y contar objetos encadenando cmdlets" },
    { n: 5, name: "Conocer la consola", desc: "Comandos, alias y ayuda integrada" }
  ];

  PS.LEVELS = [
    { min: 0,    n: 1, name: "Primer día" },
    { min: 850,  n: 2, name: "Verbo-Nombre" },
    { min: 1600,  n: 3, name: "Se defiende en la consola" },
    { min: 2300, n: 4, name: "Piensa en objetos" }
  ];

  PS.BADGES = [
    { id: "clean",   icon: "🧯", name: "Sin sustos",        desc: "No borraste nada que hiciera falta." },
    { id: "self",    icon: "🧠", name: "Autosuficiente",    desc: "Terminaste la jornada sin pedir pistas." },
    { id: "rtfm",    icon: "📚", name: "Get-Help",          desc: "Consultaste la ayuda integrada de un cmdlet." },
    { id: "objects", icon: "🧩", name: "Todo son objetos",  desc: "Usaste Get-Member para ver las propiedades de un objeto." },
    { id: "pipes",   icon: "🪈", name: "Fontanería",        desc: "Encadenaste cmdlets con la tubería." },
    { id: "fast",    icon: "⚡", name: "Buen ritmo",        desc: "Completaste la jornada en menos de 22 minutos." }
  ];
})(this);
