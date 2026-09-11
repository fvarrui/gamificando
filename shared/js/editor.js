/* ==========================================================
   RG.Editor · Editor «nano» simulado
   Suspende la línea de órdenes en curso hasta que se cierra.
   ========================================================== */
(function (global) {
  "use strict";
  var RG = global.RG, util = RG.util;

  RG.Editor = function (term, shell, cfg) {
    cfg = cfg || {};
    var els = {
      nano: RG.$("nano"), text: RG.$("nanoText"), file: RG.$("nanoFile"),
      mod: RG.$("nanoMod"), msg: RG.$("nanoMsg"), keys: RG.$("nanoKeys")
    };
    var st = null;
    var ed = { els: els };

    function message(text, ask) {
      els.msg.className = "nano-msg" + (ask ? " ask" : "");
      els.msg.innerHTML = "";
      if (text) {
        var sp = document.createElement("span");
        sp.textContent = text;
        els.msg.appendChild(sp);
      }
    }

    ed.isOpen = function () { return !!st; };

    ed.open = function (file, content, onDone) {
      if (term.silent) { onDone(content, true); return; }
      st = { file: file, onDone: onDone, original: content, savedText: null, cut: "", asking: false };
      els.file.textContent = cfg.displayPath ? cfg.displayPath(file) : file;
      els.mod.textContent = "";
      els.text.value = content;
      els.nano.hidden = false;
      shell.suspend();
      term.setLocked(true);
      message("");
      els.text.focus();
      els.text.setSelectionRange(0, 0);
      RG.announce("Editor nano abierto con " + (cfg.displayPath ? cfg.displayPath(file) : file) + ". Control O guarda, Control X sale.");
    };

    function finish(text, saved) {
      var cur = st;
      st = null;
      els.nano.hidden = true;
      var final = text;
      if (final && !/\n$/.test(final)) { final += "\n"; }
      cur.onDone(final, saved);
      shell.resume();
    }

    function save() {
      st.savedText = els.text.value;
      var n = util.linesOf(els.text.value + (/\n$/.test(els.text.value) || !els.text.value ? "" : "\n")).length;
      message("[ " + n + " líneas escritas ]");
      els.mod.textContent = "";
    }
    function exit() {
      var currentSaved = st.savedText !== null ? st.savedText : st.original;
      if (els.text.value === currentSaved) { finish(currentSaved, st.savedText !== null); return; }
      st.asking = true;
      message("¿Guardar el búfer modificado?  (Respondiendo \"No\" ¡DESCARTARÁ LOS CAMBIOS!)   S Sí   N No   ^C Cancelar", true);
    }
    function answer(key) {
      if (key === "s" || key === "y") { st.asking = false; finish(els.text.value, true); return true; }
      if (key === "n") { st.asking = false; finish(st.savedText !== null ? st.savedText : st.original, st.savedText !== null); return true; }
      if (key === "c" || key === "escape") { st.asking = false; message("Cancelado"); return true; }
      return false;
    }

    els.text.addEventListener("keydown", function (e) {
      if (!st) { return; }
      if (st.asking) {
        if (answer(e.key.toLowerCase())) { e.preventDefault(); }
        return;
      }
      var k = e.key.toLowerCase();
      if (e.ctrlKey && (k === "o" || k === "s")) { e.preventDefault(); save(); return; }
      if (e.ctrlKey && k === "x") { e.preventDefault(); exit(); return; }
      if (e.ctrlKey && k === "k") {
        e.preventDefault();
        var v = els.text.value, pos = els.text.selectionStart;
        var start = v.lastIndexOf("\n", pos - 1) + 1;
        var end = v.indexOf("\n", pos);
        if (end === -1) { end = v.length; } else { end++; }
        st.cut = v.slice(start, end);
        els.text.value = v.slice(0, start) + v.slice(end);
        els.text.setSelectionRange(start, start);
        els.mod.textContent = "Modificado";
        return;
      }
      if (e.ctrlKey && k === "u") {
        e.preventDefault();
        var v2 = els.text.value, p2 = els.text.selectionStart;
        var s2 = v2.lastIndexOf("\n", p2 - 1) + 1;
        els.text.value = v2.slice(0, s2) + st.cut + v2.slice(s2);
        els.text.setSelectionRange(s2 + st.cut.length, s2 + st.cut.length);
        els.mod.textContent = "Modificado";
        return;
      }
      if (e.ctrlKey && k === "c") {
        e.preventDefault();
        message("línea " + els.text.value.slice(0, els.text.selectionStart).split("\n").length);
      }
    });

    els.text.addEventListener("input", function () {
      if (!st) { return; }
      var cur = st.savedText !== null ? st.savedText : st.original;
      els.mod.textContent = els.text.value === cur ? "" : "Modificado";
    });

    els.keys.addEventListener("click", function (e) {
      var b = e.target.closest ? e.target.closest("button") : null;
      if (!b || !st) { return; }
      var act = b.getAttribute("data-nano");
      els.text.focus();
      if (act === "save") { save(); }
      else if (act === "exit") { exit(); }
      else if (act === "cut" || act === "paste") {
        els.text.dispatchEvent(new KeyboardEvent("keydown", { key: act === "cut" ? "k" : "u", ctrlKey: true, bubbles: true, cancelable: true }));
      }
    });

    ed.close = function () { if (st) { st = null; els.nano.hidden = true; } };
    return ed;
  };
})(this);
