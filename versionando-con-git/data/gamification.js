/* ==========================================================
   Fases, niveles e insignias
   ========================================================== */
(function (global) {
  "use strict";
  var VG = global.VG = global.VG || {};

  VG.PHASES = [
    { n: 1, name: "Primeros pasos", desc: "config, init, status, .gitignore, add, commit, log" },
    { n: 2, name: "El ciclo de trabajo", desc: "editar, diff, diff --staged, rm" },
    { n: 3, name: "Deshacer sin miedo", desc: "restore, restore --staged, amend, reset" },
    { n: 4, name: "Ramas y fusiones", desc: "switch, merge, conflictos, branch -d" },
    { n: 5, name: "Trabajo en equipo", desc: "remote, push, fetch, pull, revert, stash, tag" }
  ];

  VG.HINT_COST = 25;
  VG.RISKY_PENALTY = 50;

  VG.LEVELS = [
    { min: 0,    n: 1, name: "Aprendiz" },
    { min: 700,  n: 2, name: "Analista junior" },
    { min: 1400, n: 3, name: "Analista senior" },
    { min: 2200, n: 4, name: "Maestría Git" }
  ];

  VG.BADGES = [
    { id: "clean",  icon: "🛡️", name: "Sin daños colaterales", desc: "Ninguna decisión arriesgada: ni secretos en el historial, ni push forzado, ni trabajo perdido." },
    { id: "secret", icon: "🔐", name: "Sin secretos",          desc: "Ni secretos.env ni volcado.sql llegaron nunca a un commit." },
    { id: "self",   icon: "🧠", name: "Autosuficiente",        desc: "Completaste las misiones sin pedir pistas." },
    { id: "review", icon: "🔍", name: "Revisor",               desc: "Revisaste lo preparado con git diff --staged antes de hacer commit." },
    { id: "msgs",   icon: "✍️", name: "Buenos mensajes",       desc: "Todos tus commits tienen un mensaje de al menos tres palabras." },
    { id: "map",    icon: "🌿", name: "Cartografía",           desc: "Consultaste el grafo en la pestaña Repositorio." },
    { id: "reflog", icon: "⏪", name: "Máquina del tiempo",    desc: "Consultaste el reflog, la red de seguridad de Git." },
    { id: "rtfm",   icon: "📚", name: "Lee el manual",         desc: "Consultaste la ayuda con man, git help o --help." }
  ];
})(this);
