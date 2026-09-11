/* ==========================================================
   RG.Terminal · Ventana de terminal reutilizable
   Un único contenedor con scroll. La salida son «filas» con
   segmentos [clase, texto] para poder colorearla como una
   terminal real, y se puede capturar (tuberías y redirecciones).
   ========================================================== */
(function (global) {
  "use strict";
  var RG = global.RG;

  RG.Terminal = function (cfg) {
    var t = {};
    var els = {
      win: cfg.window || RG.$("termWindow"),
      term: cfg.terminal || RG.$("terminal"),
      out: cfg.output || RG.$("terminalOutput"),
      form: cfg.form || RG.$("terminalForm"),
      input: cfg.input || RG.$("terminalInput"),
      prompt: cfg.prompt || RG.$("promptLabel"),
      title: cfg.title || RG.$("termTitle")
    };
    t.els = els;
    t.status = { code: 0 };   // código de salida de la orden en curso
    t.silent = false;         // ejecución sin pintar (preparar una fase)
    t.locked = true;
    t.history = [];

    var capture = null, deferred = null, historyIndex = 0;

    /* ---------------- Salida ---------------- */
    function renderRow(row) {
      var div = document.createElement("div");
      div.className = "ln" + (row.pre ? " pre" : "") + (row.cls ? " ln-" + row.cls : "");
      row.segs.forEach(function (s) {
        if (s[0]) {
          var sp = document.createElement("span");
          sp.className = "c-" + s[0];
          sp.textContent = s[1];
          div.appendChild(sp);
        } else {
          div.appendChild(document.createTextNode(s[1]));
        }
      });
      return div;
    }
    t.scrollEnd = function () {
      els.term.scrollTop = els.term.scrollHeight;
      els.term.scrollLeft = 0;
    };
    /* toStderr: lo que va por «error estándar» no lo capturan ni las
       tuberías ni las redirecciones */
    t.pushRows = function (rows, toStderr) {
      if (capture && !toStderr) { Array.prototype.push.apply(capture, rows); return; }
      if (t.silent) { return; }
      rows.forEach(function (r) { els.out.appendChild(renderRow(r)); });
      t.scrollEnd();
    };
    t.rowsFromText = function (cls, text, isPre) {
      return String(text).split("\n").map(function (line) {
        return { cls: cls || "", pre: !!isPre, segs: [["", line]] };
      });
    };
    t.rowText = function (r) { return r.segs.map(function (s) { return s[1]; }).join(""); };

    t.line = function (cls, text) { t.pushRows(t.rowsFromText(cls, text, false)); };
    t.pre = function (text, cls) { t.pushRows(t.rowsFromText(cls || "", text, true)); };
    t.rich = function (segs) { t.pushRows([{ cls: "", pre: true, segs: segs }]); };
    t.note = function (text, cls) { t.pushRows(t.rowsFromText(cls || "text", text, true), true); };
    t.fail = function (text) { t.pushRows(t.rowsFromText("err", text, true), true); t.status.code = 1; };
    /* Mensajes del juego: nunca se filtran con grep ni acaban en un fichero */
    t.sys = function (cls, text) {
      if (t.silent) { return; }
      if (capture) { deferred.push({ cls: cls, text: text }); return; }
      t.pushRows(t.rowsFromText(cls, text, false), true);
    };

    /* ---------------- Captura (tuberías y redirecciones) ---------------- */
    t.beginCapture = function () { capture = []; deferred = []; };
    t.endCapture = function () {
      var r = { rows: capture, deferred: deferred };
      capture = null;
      deferred = null;
      return r;
    };
    t.capturing = function () { return !!capture; };
    /* Recoge en filas la salida de una función (para anteponerle un grafo, por ejemplo) */
    t.collect = function (fn) {
      var savedC = capture, savedD = deferred;
      capture = [];
      deferred = savedD || [];
      try { fn(); } finally {
        var rows = capture;
        capture = savedC;
        deferred = savedD;
      }
      return rows;
    };

    /* ---------------- Prompt, limpieza y bloqueo ---------------- */
    t.renderPrompt = function () {
      if (els.prompt && cfg.promptHtml) { els.prompt.innerHTML = cfg.promptHtml(); }
      if (els.title && cfg.titleText) { els.title.textContent = cfg.titleText(); }
    };
    t.echoPrompt = function (typed) {
      if (t.silent) { return; }
      var div = document.createElement("div");
      div.className = "ln pre";
      div.innerHTML = cfg.promptHtml ? cfg.promptHtml() : "$ ";
      div.appendChild(document.createTextNode(typed));
      els.out.appendChild(div);
      t.scrollEnd();
    };
    t.clear = function () {
      while (els.out.firstChild) { els.out.removeChild(els.out.firstChild); }
    };
    t.setLocked = function (locked) {
      t.locked = locked;
      els.input.disabled = locked;
      els.form.classList.toggle("disabled", locked);
      if (!locked && (!cfg.canFocus || cfg.canFocus())) { els.input.focus({ preventScroll: true }); }
    };
    t.focus = function () { if (!els.input.disabled) { els.input.focus({ preventScroll: true }); } };
    t.flash = function () {
      if (t.silent) { return; }
      els.win.classList.remove("alert-flash");
      void els.win.offsetWidth;   // reinicia la animación
      els.win.classList.add("alert-flash");
    };

    /* ---------------- Autocompletado ---------------- */
    function complete() {
      var v = els.input.value;
      var parts = v.split(/\s+/);
      var lastPart = parts[parts.length - 1];
      var matches = (cfg.completion ? cfg.completion(parts) : []).filter(function (x) { return x.indexOf(lastPart) === 0; });
      matches = matches.filter(function (x, i) { return matches.indexOf(x) === i; });
      if (matches.length === 1) {
        parts[parts.length - 1] = matches[0];
        els.input.value = parts.join(" ") + (/\/$/.test(matches[0]) ? "" : " ");
        return;
      }
      if (matches.length > 1) {
        var prefix = matches[0];
        matches.forEach(function (m) { while (m.indexOf(prefix) !== 0) { prefix = prefix.slice(0, -1); } });
        if (prefix.length > lastPart.length) {
          parts[parts.length - 1] = prefix;
          els.input.value = parts.join(" ");
        } else {
          t.echoPrompt(v);
          t.pre(matches.join("   "));
        }
      }
    }

    /* ---------------- Teclado ---------------- */
    els.input.addEventListener("keydown", function (e) {
      if (e.key === "ArrowUp") {
        e.preventDefault();
        if (!t.history.length) { return; }
        historyIndex = Math.max(0, historyIndex - 1);
        els.input.value = t.history[historyIndex] || "";
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        historyIndex = Math.min(t.history.length, historyIndex + 1);
        els.input.value = t.history[historyIndex] || "";
      } else if (e.key === "Tab" && !e.shiftKey && els.input.value.length > 0) {
        e.preventDefault();   // con la línea vacía, Tab mueve el foco con normalidad
        complete();
      } else if (e.ctrlKey && (e.key === "l" || e.key === "L")) {
        e.preventDefault();
        t.clear();
      } else if (e.ctrlKey && (e.key === "c" || e.key === "C") && els.input.selectionStart === els.input.selectionEnd) {
        e.preventDefault();
        t.echoPrompt(els.input.value + "^C");
        els.input.value = "";
        historyIndex = t.history.length;
      }
    });

    els.form.addEventListener("submit", function (e) {
      e.preventDefault();
      var v = els.input.value;
      els.input.value = "";
      if (t.locked) { return; }
      var trimmed = v.trim();
      t.echoPrompt(v);
      if (trimmed) { t.history.push(trimmed); }
      historyIndex = t.history.length;
      if (trimmed && cfg.onCommand) { cfg.onCommand(trimmed); }
    });

    // Clic en cualquier punto de la terminal = foco en la línea de órdenes
    // (salvo que se esté seleccionando texto para copiarlo)
    els.term.addEventListener("mouseup", function () {
      var sel = global.getSelection ? String(global.getSelection()) : "";
      if (!sel) { t.focus(); }
    });

    t.reset = function () {
      t.history = [];
      historyIndex = 0;
      capture = null;
      deferred = null;
      t.clear();
      els.input.value = "";
    };

    return t;
  };
})(this);
