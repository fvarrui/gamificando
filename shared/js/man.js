/* ==========================================================
   RG.man · Páginas de manual
   Formato de cada página:
     [nombre, [sinopsis...], descripción, [[opción, texto]...], [ejemplos...]]
   ========================================================== */
(function (global) {
  "use strict";
  var RG = global.RG, util = RG.util;

  RG.man = {
    usage: function (page) { return "uso: " + page[1].join("\n   o: "); },
    render: function (term, key, page) {
      var title = key.toUpperCase() + "(1)";
      var lines = [util.pad(title, 26) + util.pad(/^git/.test(key) ? "Manual de Git" : "Manual del sistema", 30) + title,
        "", "NOMBRE", "       " + page[0], "", "SINOPSIS"];
      page[1].forEach(function (s) { lines.push("       " + s); });
      lines.push("", "DESCRIPCIÓN");
      util.wrapText(page[2], 70).forEach(function (l) { lines.push("       " + l); });
      if (page[3] && page[3].length) {
        lines.push("", "OPCIONES");
        page[3].forEach(function (o) {
          lines.push("       " + o[0]);
          util.wrapText(o[1], 62).forEach(function (l) { lines.push("           " + l); });
        });
      }
      if (page[4] && page[4].length) {
        lines.push("", "EJEMPLOS");
        page[4].forEach(function (e) { lines.push("       $ " + e); });
      }
      term.pre(lines.join("\n"));
    }
  };
})(this);
