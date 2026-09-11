/* ==========================================================
   RG · Núcleo común de los retos gamificados
   Utilidades, temporizadores, anuncios accesibles y pantallas.
   Se carga como script clásico (funciona también con file://).
   ========================================================== */
(function (global) {
  "use strict";

  var RG = global.RG = global.RG || {};

  /* ---------------- Utilidades ---------------- */
  var util = RG.util = {
    has: function (o, k) { return !!o && Object.prototype.hasOwnProperty.call(o, k); },
    copy: function (o) {
      var c = {};
      for (var k in o) { if (util.has(o, k)) { c[k] = o[k]; } }
      return c;
    },
    sortedKeys: function (o) { return Object.keys(o || {}).sort(); },
    unionKeys: function () {
      var all = {};
      for (var i = 0; i < arguments.length; i++) {
        Object.keys(arguments[i] || {}).forEach(function (k) { all[k] = true; });
      }
      return Object.keys(all).sort();
    },
    esc: function (s) {
      return String(s).replace(/[&<>"']/g, function (c) {
        return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
      });
    },
    pad: function (s, n) { s = String(s); return s.length >= n ? s : s + " ".repeat(n - s.length); },
    lpad: function (s, n) { s = String(s); return s.length >= n ? s : " ".repeat(n - s.length) + s; },
    pad2: function (n) { return (n < 10 ? "0" : "") + n; },
    plural: function (n, one, many) { return n + " " + (n === 1 ? one : many); },
    /* Líneas de un texto, sin la línea vacía final */
    linesOf: function (text) {
      if (!text) { return []; }
      var l = String(text).split("\n");
      if (l[l.length - 1] === "") { l.pop(); }
      return l;
    },
    firstLine: function (msg) { return String(msg || "").split("\n")[0]; },
    wrapText: function (text, width) {
      var words = String(text).split(" "), lines = [], cur = "";
      words.forEach(function (w) {
        if (cur && (cur + " " + w).length > width) { lines.push(cur); cur = w; }
        else { cur = cur ? cur + " " + w : w; }
      });
      if (cur) { lines.push(cur); }
      return lines;
    },
    escRe: function (s) { return String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); },
    /* Comodines de shell y de .gitignore a expresión regular */
    globToRe: function (p) {
      var re = "";
      for (var i = 0; i < p.length; i++) {
        var c = p.charAt(i);
        if (c === "*") {
          if (p.charAt(i + 1) === "*") { re += ".*"; i++; } else { re += "[^/]*"; }
        } else if (c === "?") { re += "[^/]"; }
        else if (c === "[") {
          var j = p.indexOf("]", i + 1);
          if (j === -1) { re += "\\["; }
          else { re += "[" + p.slice(i + 1, j).replace(/^!/, "^").replace(/\\/g, "\\\\") + "]"; i = j; }
        } else if ("\\^$.|+(){}".indexOf(c) !== -1) { re += "\\" + c; }
        else { re += c; }
      }
      return new RegExp("^" + re + "$");
    },
    /* Distancia de edición, para sugerir órdenes parecidas */
    lev: function (a, b) {
      var d = [], i, j;
      for (i = 0; i <= a.length; i++) { d[i] = [i]; }
      for (j = 0; j <= b.length; j++) { d[0][j] = j; }
      for (i = 1; i <= a.length; i++) {
        for (j = 1; j <= b.length; j++) {
          d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a.charAt(i - 1) === b.charAt(j - 1) ? 0 : 1));
        }
      }
      return d[a.length][b.length];
    },

    DAYS_ES: ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"],
    MONTHS_ES: ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"],
    DAYS_EN: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
    MONTHS_EN: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
    fmtTime: function (d) { return util.pad2(d.getHours()) + ":" + util.pad2(d.getMinutes()) + ":" + util.pad2(d.getSeconds()); },
    /* «lun 14 sep 2026 09:01:24 WEST» */
    fmtDateEs: function (d, tz) {
      return util.DAYS_ES[d.getDay()] + " " + d.getDate() + " " + util.MONTHS_ES[d.getMonth()] + " " + d.getFullYear() +
        " " + util.fmtTime(d) + (tz ? " " + tz : "");
    },
    fmtElapsed: function (ms) {
      var s = Math.floor(ms / 1000);
      return util.pad2(Math.floor(s / 60)) + ":" + util.pad2(s % 60);
    }
  };

  RG.$ = function (id) { return document.getElementById(id); };
  RG.reducedMotion = !!(global.matchMedia && global.matchMedia("(prefers-reduced-motion: reduce)").matches);

  /* ---------------- Temporizadores cancelables ----------------
     Todas las esperas del juego pasan por aquí para poder
     cancelarlas al reiniciar. */
  RG.Timers = function () {
    var list = [];
    return {
      later: function (fn, ms) {
        var t = setTimeout(function () {
          var i = list.indexOf(t);
          if (i !== -1) { list.splice(i, 1); }
          fn();
        }, RG.reducedMotion ? Math.min(ms, Math.max(120, Math.round(ms / 3))) : ms);
        list.push(t);
        return t;
      },
      clear: function () {
        list.forEach(function (t) { clearTimeout(t); });
        list = [];
      }
    };
  };

  /* ---------------- Anuncios para lectores de pantalla ---------------- */
  RG.announce = function (text) {
    var el = RG.$("announcer");
    if (!el) { return; }
    el.textContent = "";
    setTimeout(function () { el.textContent = text; }, 30);
  };

  /* ---------------- Avisos flotantes ---------------- */
  RG.toast = function (text, kind) {
    var box = RG.$("toasts");
    if (!box) { return; }
    var el = document.createElement("div");
    el.className = "toast" + (kind ? " " + kind : "");
    el.textContent = text;
    box.appendChild(el);
    setTimeout(function () { if (el.parentNode) { el.parentNode.removeChild(el); } }, 3000);
  };
  RG.clearToasts = function () {
    var box = RG.$("toasts");
    if (box) { box.innerHTML = ""; }
  };

  /* ---------------- Pantallas ---------------- */
  RG.showScreen = function (which) {
    RG.clearToasts();
    ["intro", "game", "debrief"].forEach(function (name) {
      var el = RG.$("screen" + name.charAt(0).toUpperCase() + name.slice(1));
      if (el) { el.hidden = name !== which; }
    });
    global.scrollTo(0, 0);
  };

  /* ---------------- Reloj de la partida ---------------- */
  RG.Clock = function (el) {
    var startMs = 0, endMs = 0, interval = null;
    var c = {
      start: function () {
        startMs = Date.now();
        endMs = 0;
        c.stop();
        interval = setInterval(c.tick, 1000);
        c.tick();
      },
      stop: function () { if (interval) { clearInterval(interval); interval = null; } },
      finish: function () { endMs = Date.now(); c.stop(); c.tick(); },
      reset: function () { c.stop(); startMs = 0; endMs = 0; if (el) { el.textContent = "00:00"; } },
      elapsed: function () { return startMs ? (endMs || Date.now()) - startMs : 0; },
      started: function () { return !!startMs; },
      tick: function () { if (el) { el.textContent = util.fmtElapsed(c.elapsed()); } }
    };
    return c;
  };
})(this);
