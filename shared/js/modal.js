/* ==========================================================
   RG.Modal · Diálogos accesibles
   Foco atrapado, cierre con Escape o clic fuera y devolución
   del foco al elemento que lo abrió.
   ========================================================== */
(function (global) {
  "use strict";
  var RG = global.RG;

  var current = null, lastFocus = null;

  function focusables(modal) {
    return Array.prototype.slice.call(modal.querySelectorAll("button:not([disabled]), a[href], [tabindex]:not([tabindex='-1'])"));
  }
  function onKey(e) {
    if (!current) { return; }
    if (e.key === "Escape") { e.preventDefault(); RG.Modal.close(); return; }
    if (e.key !== "Tab") { return; }
    var f = focusables(current);
    if (!f.length) { return; }
    if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
    else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
  }

  RG.Modal = {
    open: function (modal) {
      lastFocus = document.activeElement;
      current = modal;
      modal.hidden = false;
      var closeBtn = modal.querySelector(".js-close-modal");
      if (closeBtn) { closeBtn.focus(); }
      document.addEventListener("keydown", onKey, true);
    },
    close: function () {
      if (!current) { return; }
      current.hidden = true;
      current = null;
      document.removeEventListener("keydown", onKey, true);
      if (lastFocus && lastFocus.focus) { lastFocus.focus(); }
    },
    isOpen: function () { return !!current; },
    /* Enlaza los botones .js-open-modal[data-modal], .js-close-modal y el clic fuera */
    bind: function () {
      Array.prototype.forEach.call(document.querySelectorAll(".js-open-modal"), function (b) {
        b.addEventListener("click", function () {
          var target = RG.$(b.getAttribute("data-modal"));
          if (target) { RG.Modal.open(target); }
        });
      });
      Array.prototype.forEach.call(document.querySelectorAll(".js-close-modal"), function (b) {
        b.addEventListener("click", RG.Modal.close);
      });
      Array.prototype.forEach.call(document.querySelectorAll(".modal-overlay"), function (m) {
        m.addEventListener("click", function (e) { if (e.target === m) { RG.Modal.close(); } });
      });
    }
  };
})(this);
