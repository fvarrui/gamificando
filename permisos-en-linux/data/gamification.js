/* ==========================================================
   Fases, puntuación, niveles e insignias
   ========================================================== */
(function (global) {
  "use strict";
  var PL = global.PL = global.PL || {};

  PL.HINT_COST = 25;
  PL.RISKY_PENALTY = 50;
  PL.PROACTIVE_BONUS = 25;
  PL.FAST_TIME_MS = 16 * 60 * 1000;

  PL.PHASES = [
    { n: 1, name: "Leer permisos",     desc: "Entender qué dice cada letra de ls -l" },
    { n: 2, name: "Dueños y grupos",   desc: "chown, chgrp y el bit SGID de las carpetas compartidas" },
    { n: 3, name: "chmod",             desc: "Cerrar la carpeta con permisos octales y simbólicos" },
    { n: 4, name: "ACL",               desc: "Permisos a medida para un usuario o un grupo concreto" },
    { n: 5, name: "Ficheros nuevos",   desc: "umask, ACL por omisión y comprobación final" }
  ];

  PL.LEVELS = [
    { min: 0,    n: 1, name: "Lee los permisos" },
    { min: 450,  n: 2, name: "Maneja chmod" },
    { min: 900,  n: 3, name: "Reparte por grupos" },
    { min: 1400, n: 4, name: "Domina las ACL" }
  ];

  PL.BADGES = [
    { id: "clean",   icon: "🛡️", name: "Sin agujeros",       desc: "No dejaste nada abierto a todo el mundo ni expusiste las credenciales." },
    { id: "self",    icon: "🧠", name: "Autosuficiente",     desc: "Terminaste el bastionado sin pedir pistas." },
    { id: "rtfm",    icon: "📚", name: "Lee el manual",      desc: "Consultaste al menos una página de man." },
    { id: "minimal", icon: "🎯", name: "Mínimo privilegio",  desc: "Diste a cada grupo solo los permisos que necesitaba." },
    { id: "inherit", icon: "🧬", name: "Pensando en el futuro", desc: "Dejaste una ACL por omisión para los ficheros que se creen después." },
    { id: "fast",    icon: "⚡", name: "Buen ritmo",         desc: "Completaste el bastionado en menos de 16 minutos." }
  ];
})(this);
