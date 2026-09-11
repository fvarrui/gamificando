/* ==========================================================
   RG.Game · Motor de misiones
   Estado de las misiones, XP, niveles, pistas, insignias,
   decisiones arriesgadas y pintado de la ficha y el registro.
   Cada reto aporta los textos (labels) y los enganches (on).
   ========================================================== */
(function (global) {
  "use strict";
  var RG = global.RG, util = RG.util;

  RG.Game = function (cfg) {
    var g = {};
    var M = cfg.missions;
    var labels = cfg.labels || {};
    var on = cfg.on || {};
    var els = {
      slot: RG.$(cfg.els && cfg.els.slot || "missionSlot"),
      log: RG.$(cfg.els && cfg.els.log || "missionLog"),
      xp: RG.$(cfg.els && cfg.els.xp || "xpValue"),
      level: RG.$(cfg.els && cfg.els.level || "levelName")
    };
    g.missions = M;
    g.hintCost = cfg.hintCost || 25;
    g.riskyPenalty = cfg.riskyPenalty || 50;
    g.proactiveBonus = cfg.proactiveBonus || 0;
    g.timers = cfg.timers;
    g.term = cfg.term;

    /* ---------------- Estado ---------------- */
    g.reset = function () {
      g.ms = M.map(function () {
        return { revealed: false, done: false, hintsUsed: 0, method: "", earned: 0, skipped: false, proactive: false, data: {} };
      });
      g.current = -1;
      g.xp = 0;
      g.maxLevel = 1;
      g.risky = [];
      g.riskyKinds = {};
      g.finished = false;
      g.renderStats();
    };

    /* ---------------- XP, niveles y riesgos ---------------- */
    g.levelFor = function (xp) {
      var lvl = cfg.levels[0];
      cfg.levels.forEach(function (l) { if (xp >= l.min) { lvl = l; } });
      return lvl;
    };
    g.levelLabel = function (l) { return "Nivel " + l.n + " · " + l.name; };
    g.renderStats = function () {
      if (els.xp) { els.xp.textContent = String(Math.max(0, g.xp)); }
      if (els.level) { els.level.textContent = g.levelLabel(g.levelFor(Math.max(0, g.xp))); }
    };
    g.addXp = function (delta, reason) {
      var before = g.levelFor(Math.max(0, g.xp));
      g.xp += delta;
      g.renderStats();
      RG.toast((delta > 0 ? "+" : "−") + Math.abs(delta) + " XP · " + reason, delta < 0 ? "bad" : "");
      var after = g.levelFor(Math.max(0, g.xp));
      // Solo se celebra la primera vez que se alcanza cada nivel
      if (after.n > before.n && after.n > g.maxLevel) {
        g.maxLevel = after.n;
        g.timers.later(function () { RG.toast("⬆ ¡Asciendes! " + g.levelLabel(after), "level"); }, 500);
        if (on.levelUp) { on.levelUp(after); }
        RG.announce("Has subido a " + g.levelLabel(after));
      }
    };
    /* Cada tipo de decisión arriesgada penaliza una sola vez */
    g.addRisky = function (kind, text) {
      if (g.term.silent || g.riskyKinds[kind]) { return; }
      g.riskyKinds[kind] = true;
      g.risky.push(text);
      g.term.sys("warn", "⚠ Decisión arriesgada: " + text + " Queda anotado en el informe final.");
      g.addXp(-g.riskyPenalty, "Decisión arriesgada");
    };

    g.rewardFor = function (i) {
      var min = M[i].minXp || 25;
      return Math.max(min, M[i].xp - g.hintCost * g.ms[i].hintsUsed);
    };

    /* ---------------- Ciclo de vida de las misiones ---------------- */
    g.activate = function (i) {
      var m = M[i], ms = g.ms[i];
      g.current = i;
      ms.revealed = true;
      if (m.onActivate) { m.onActivate(ms.data); }
      if (on.broadcast) { on.broadcast(m); }
      g.render(true);
      RG.announce((labels.announce ? labels.announce(m) : "Nueva misión: " + m.title) + ". Objetivo: " + m.objective);
      // Por si ya estaba resuelto antes de que llegara la misión
      if (m.check && m.check(null, ms.data)) {
        g.timers.later(function () {
          if (!ms.done) { g.complete(i, { method: labels.alreadyDone || "(ya estaba hecho)", proactive: true }); }
        }, 1200);
      }
      if (on.activate) { on.activate(i, m); }
    };

    g.complete = function (i, opts) {
      opts = opts || {};
      var m = M[i], ms = g.ms[i];
      if (ms.done) { return; }
      ms.done = true;
      ms.method = opts.method !== undefined ? opts.method : (cfg.currentCommand ? cfg.currentCommand() : "");
      ms.proactive = !!opts.proactive;
      ms.earned = g.rewardFor(i) + (opts.proactive ? g.proactiveBonus : 0) + (opts.bonus || 0);
      if (on.complete) { on.complete(i, m, ms); }
      g.addXp(ms.earned, m.code || m.title);
      RG.announce(m.title + ": completada. " + ms.earned + " puntos de experiencia.");
      g.render();
      if (i < M.length - 1) {
        g.timers.later(function () { g.activate(i + 1); }, cfg.nextDelay || 1900);
      } else {
        g.finish();
      }
    };

    g.finish = function () {
      g.finished = true;
      if (on.finish) { on.finish(); }
      g.render();
      g.timers.later(function () {
        var btn = RG.$("reportBtn");
        if (btn) { btn.focus(); }
      }, 400);
    };

    /* Comprueba la misión en curso con los eventos de la última orden */
    g.check = function (events) {
      var i = g.current;
      if (g.finished || i < 0) { g.render(); return; }
      var m = M[i], ms = g.ms[i];
      if (ms.done) { g.render(); return; }
      var ok = false;
      (events || []).forEach(function (ev) {
        if (m.react) { m.react(ev, ms.data); }
        if (!ok && m.check && m.check(ev, ms.data)) { ok = true; }
      });
      if (!ok && m.check && m.check(null, ms.data)) { ok = true; }
      if (ok) { g.complete(i); } else { g.render(); }
    };

    /* Marca como resueltas (sin XP) las misiones anteriores a una fase */
    g.markSkipped = function (upTo) {
      for (var i = 0; i < upTo; i++) {
        g.ms[i].revealed = true;
        g.ms[i].done = true;
        g.ms[i].skipped = true;
        g.ms[i].earned = 0;
      }
      g.current = upTo - 1;
    };

    /* ---------------- Ficha de misión ---------------- */
    g.renderIdle = function (text) {
      els.slot.innerHTML = '<div class="mcard-idle">' + (labels.idleIcon || "📋") + " " + util.esc(text) + "</div>";
    };

    g.renderCard = function (animate) {
      var i = g.current;
      if (i < 0) { return; }
      var m = M[i], ms = g.ms[i];
      var isLast = i === M.length - 1;

      var hintsHtml = "";
      if (ms.hintsUsed > 0) {
        hintsHtml = '<ol class="hints" aria-label="Pistas">' +
          m.hints.slice(0, ms.hintsUsed).map(function (h) { return "<li>" + util.esc(h) + "</li>"; }).join("") + "</ol>";
      }
      var hintRow = "";
      if (!ms.done) {
        var left = m.hints.length - ms.hintsUsed;
        hintRow = '<div class="hint-row"><span class="reward">Recompensa: <b>' + g.rewardFor(i) + " XP</b></span>" +
          (left > 0
            ? '<button type="button" class="btn btn-sm" id="hintBtn">💡 Pista (' + (ms.hintsUsed + 1) + "/" + m.hints.length + ") · −" + g.hintCost + " XP</button>"
            : "<span>Sin más pistas</span>") + "</div>";
      }
      var status;
      if (!ms.done) {
        status = '<div class="mcard-status wait"><span class="dot" aria-hidden="true">●</span> ' +
          util.esc(labels.wait || "En curso: actúa desde la terminal.") + "</div>";
      } else {
        status = '<div class="mcard-status ok">' + (labels.done ? labels.done(m, ms) : "✓ Completado") +
          (ms.method ? " con <code>" + util.esc(ms.method) + "</code>" : "") + " · +" + ms.earned + " XP" +
          (isLast
            ? '<button type="button" class="btn btn-primary" id="reportBtn">' + (labels.report || "📋 Ver informe final") + "</button>"
            : '<span class="next">' + util.esc(labels.next || "Esperando la siguiente misión…") + "</span>") + "</div>";
      }
      var strip = labels.strip ? labels.strip(m) : ["📋 MISIÓN", m.code || ""];
      els.slot.innerHTML =
        '<article class="mcard sev-' + m.severity + (ms.done ? " is-done" : "") + (animate ? " is-new" : "") + '" aria-labelledby="mcardTitle">' +
          '<div class="mcard-strip"><span>' + util.esc(strip[0]) + "</span><span>" + util.esc(strip[1]) + "</span></div>" +
          '<div class="mcard-body">' +
            '<p class="mcard-meta">' + util.esc(labels.meta ? labels.meta(m) : m.source) + "</p>" +
            '<h2 class="mcard-title" id="mcardTitle">' + util.esc(m.title) + "</h2>" +
            '<p class="mcard-text">' + util.esc(m.text) + "</p>" +
            '<div class="mcard-obj"><span class="lbl">🎯 Objetivo</span><p>' + util.esc(m.objective) + "</p></div>" +
            hintsHtml + hintRow + status +
          "</div></article>";

      var hintBtn = RG.$("hintBtn");
      if (hintBtn) {
        hintBtn.addEventListener("click", function () {
          if (ms.done || ms.hintsUsed >= m.hints.length) { return; }
          ms.hintsUsed++;
          g.renderCard(false);
          RG.announce("Pista " + ms.hintsUsed + ": " + m.hints[ms.hintsUsed - 1]);
          var again = RG.$("hintBtn");
          if (again) { again.focus(); } else { g.term.focus(); }
        });
      }
      var reportBtn = RG.$("reportBtn");
      if (reportBtn && on.report) { reportBtn.addEventListener("click", on.report); }
    };

    /* ---------------- Registro de misiones ---------------- */
    g.renderLog = function () {
      els.log.innerHTML = "";
      var any = false;
      function item(i) {
        var ms = g.ms[i], m = M[i];
        var li = document.createElement("li");
        li.className = ms.done ? "done" : "current";
        li.innerHTML = '<span class="ic" aria-hidden="true">' + (ms.done ? "✓" : "▶") + "</span>" +
          '<span><span class="t">' + util.esc((m.code ? m.code + " · " : "") + m.title) + "</span>" +
          '<span class="m">' + (ms.done
            ? util.esc((ms.skipped ? (labels.skipped || "preparada automáticamente") : ms.method || "") +
              (ms.proactive && !ms.skipped ? " (proactivo)" : "") + " · +" + ms.earned + " XP")
            : util.esc(labels.inProgress || "En curso")) + "</span></span>";
        els.log.appendChild(li);
      }
      if (cfg.phases) {
        var curPhase = g.current >= 0 ? M[g.current].phase : 0;
        cfg.phases.forEach(function (p, pi) {
          var list = g.missionsOfPhase(pi);
          var revealed = list.filter(function (i) { return g.ms[i].revealed; });
          if (!revealed.length) { return; }
          any = true;
          if (pi < curPhase) {
            var doneCount = list.filter(function (i) { return g.ms[i].done; }).length;
            var li = document.createElement("li");
            li.className = "phase-sum";
            li.innerHTML = '<span class="ic" aria-hidden="true">✓</span><span><span class="t">Fase ' + p.n + " · " + util.esc(p.name) + "</span>" +
              '<span class="m">' + doneCount + "/" + list.length + " misiones completadas</span></span>";
            els.log.appendChild(li);
            return;
          }
          revealed.forEach(item);
        });
      } else {
        M.forEach(function (m, i) {
          if (!g.ms[i].revealed) { return; }
          any = true;
          item(i);
        });
      }
      if (!any) {
        var empty = document.createElement("li");
        empty.className = "empty";
        empty.textContent = labels.emptyLog || "Aún no hay misiones.";
        els.log.appendChild(empty);
      }
    };

    g.missionsOfPhase = function (p) {
      var list = [];
      M.forEach(function (m, i) { if (m.phase === p) { list.push(i); } });
      return list;
    };

    g.render = function (animate) {
      if (g.term.silent) { return; }
      if (g.current >= 0) { g.renderCard(!!animate); }
      g.renderLog();
      if (on.render) { on.render(); }
    };

    /* ---------------- Informe final ---------------- */
    g.totalHints = function () {
      var n = 0;
      g.ms.forEach(function (ms) { n += ms.hintsUsed; });
      return n;
    };
    g.renderBadges = function (el, got) {
      el.innerHTML = "";
      cfg.badges.forEach(function (b) {
        var li = document.createElement("li");
        li.className = "badge " + (got[b.id] ? "earned" : "locked");
        li.innerHTML = '<span class="bi" aria-hidden="true">' + b.icon + "</span><span>" +
          '<span class="bn">' + util.esc(b.name) + "</span>" +
          '<span class="bd">' + util.esc(b.desc) + "</span>" +
          '<span class="bs">' + (got[b.id] ? "✓ Conseguida" : "🔒 No conseguida") + "</span></span>";
        el.appendChild(li);
      });
    };
    g.renderRisky = function (el, okText) {
      el.innerHTML = "";
      el.className = "risky-list " + (g.risky.length ? "bad" : "good");
      if (!g.risky.length) {
        var ok = document.createElement("li");
        ok.textContent = okText;
        el.appendChild(ok);
        return;
      }
      g.risky.forEach(function (r) {
        var li = document.createElement("li");
        li.textContent = "⚠ " + r + " · −" + g.riskyPenalty + " XP";
        el.appendChild(li);
      });
    };

    g.reset();
    return g;
  };
})(this);
