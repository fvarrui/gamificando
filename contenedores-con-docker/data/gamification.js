/* ==========================================================
   Fases, puntuación, niveles e insignias
   ========================================================== */
(function (global) {
  "use strict";
  var DK = global.DK = global.DK || {};

  DK.HINT_COST = 25;
  DK.RISKY_PENALTY = 50;
  DK.PROACTIVE_BONUS = 25;
  DK.FAST_TIME_MS = 32 * 60 * 1000;

  DK.PHASES = [
    { n: 1, name: "Imágenes",       desc: "Descargar una imagen y levantar el primer contenedor" },
    { n: 2, name: "Ciclo de vida",  desc: "Listar, leer registros, parar y eliminar" },
    { n: 3, name: "Datos",          desc: "Variables de entorno y volúmenes que sobreviven" },
    { n: 4, name: "Imagen propia",  desc: "Construir a partir de un Dockerfile" },
    { n: 5, name: "Compose",        desc: "Levantar toda la pila con un solo fichero" }
  ];

  DK.LEVELS = [
    { min: 0,    n: 1, name: "Primer contenedor" },
    { min: 1000,  n: 2, name: "Maneja el ciclo de vida" },
    { min: 1900,  n: 3, name: "No pierde los datos" },
    { min: 2750, n: 4, name: "Despliega la pila" }
  ];

  DK.BADGES = [
    { id: "clean",   icon: "🛡️", name: "Sin pérdidas",     desc: "No borraste ningún volumen con datos dentro." },
    { id: "self",    icon: "🧠", name: "Autosuficiente",   desc: "Completaste la migración sin pedir pistas." },
    { id: "rtfm",    icon: "📚", name: "Lee el manual",    desc: "Consultaste al menos una página de man." },
    { id: "logs",    icon: "🪵", name: "Lee los registros", desc: "Diagnosticaste un contenedor caído con docker logs." },
    { id: "volume",  icon: "💾", name: "Datos a salvo",    desc: "Montaste un volumen con nombre para la base de datos." },
    { id: "fast",    icon: "⚡", name: "Buen ritmo",       desc: "Completaste la migración en menos de 32 minutos." }
  ];
})(this);
