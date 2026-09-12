/* ==========================================================
   Fases, puntuación, niveles e insignias
   ========================================================== */
(function (global) {
  "use strict";
  var SL = global.SL = global.SL || {};

  SL.HINT_COST = 25;
  SL.RISKY_PENALTY = 50;
  SL.PROACTIVE_BONUS = 25;
  SL.FAST_TIME_MS = 22 * 60 * 1000;

  SL.PHASES = [
    { n: 1, name: "Diagnóstico",     desc: "Ver qué está corriendo y por qué falla lo que falla" },
    { n: 2, name: "El conflicto",    desc: "Encontrar quién ocupa el puerto y liberarlo" },
    { n: 3, name: "Arranque",        desc: "Activo ahora no es lo mismo que habilitado" },
    { n: 4, name: "Superficie",      desc: "Apagar lo que no debería estar corriendo" },
    { n: 5, name: "Cierre",          desc: "Verificación y parte de guardia" }
  ];

  SL.LEVELS = [
    { min: 0,    n: 1, name: "Mira el estado" },
    { min: 900,  n: 2, name: "Arranca y detiene" },
    { min: 1750,  n: 3, name: "Controla el arranque" },
    { min: 2500, n: 4, name: "Cierra la guardia" }
  ];

  SL.BADGES = [
    { id: "clean",   icon: "🛡️", name: "Sin daños colaterales", desc: "No detuviste ningún servicio que la empresa necesitaba." },
    { id: "self",    icon: "🧠", name: "Autosuficiente",   desc: "Cerraste la guardia sin pedir pistas." },
    { id: "rtfm",    icon: "📚", name: "Lee el manual",    desc: "Consultaste al menos una página de man." },
    { id: "logs",    icon: "🪵", name: "Lee los registros", desc: "Averiguaste la causa del fallo con journalctl antes de tocar nada." },
    { id: "boot",    icon: "🔁", name: "Sobrevive al reinicio", desc: "Todo lo que debe arrancar solo quedó habilitado, y lo que no, deshabilitado." },
    { id: "fast",    icon: "⚡", name: "Guardia corta",    desc: "Resolviste el incidente en menos de 22 minutos." }
  ];
})(this);
