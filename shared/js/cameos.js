/* ==========================================================
   RG.cameos · Huevos de pascua del reparto
   Los nombres de los personajes abren su página de Wikipedia
   al pulsarlos, pero no se ven como enlaces: son <span> con un
   único escuchador delegado, así que el lector de pantalla los
   lee como texto normal y no entran en el orden de tabulación.
   La terminal se deja fuera a propósito.
   ========================================================== */
(function (global) {
  "use strict";
  var RG = global.RG;

  RG.CAMEOS = {
    "Linda Hamilton": "https://es.wikipedia.org/wiki/Linda_Hamilton",
    "Sigourney Weaver": "https://es.wikipedia.org/wiki/Sigourney_Weaver",
    "Arnold Schwarzenegger": "https://es.wikipedia.org/wiki/Arnold_Schwarzenegger",
    "Michelle Yeoh": "https://es.wikipedia.org/wiki/Michelle_Yeoh",
    "Wesley Snipes": "https://es.wikipedia.org/wiki/Wesley_Snipes",
    "Cynthia Rothrock": "https://es.wikipedia.org/wiki/Cynthia_Rothrock",
    "Dolph Lundgren": "https://es.wikipedia.org/wiki/Dolph_Lundgren",
    "Milla Jovovich": "https://es.wikipedia.org/wiki/Milla_Jovovich",
    "Jean-Claude Van Damme": "https://es.wikipedia.org/wiki/Jean-Claude_Van_Damme",
    "Carrie-Anne Moss": "https://es.wikipedia.org/wiki/Carrie-Anne_Moss",
    "Jackie Chan": "https://es.wikipedia.org/wiki/Jackie_Chan",
    "Brigitte Nielsen": "https://es.wikipedia.org/wiki/Brigitte_Nielsen"
  };

  /* Los nombres más largos van primero, para que «Jean-Claude Van Damme»
     gane a cualquier coincidencia más corta */
  var PATRON = Object.keys(RG.CAMEOS)
    .sort(function (a, b) { return b.length - a.length; })
    .map(function (n) { return n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); })
    .join("|");
  var HAY_ALGUNO = new RegExp(PATRON);

  /* Lo que nunca se toca: la terminal, los campos de texto y lo ya marcado */
  function fuera(nodo, raiz) {
    var p = nodo.parentNode;
    while (p && p !== raiz.parentNode) {
      if (p.nodeType === 1) {
        var tag = p.tagName;
        if (tag === "SCRIPT" || tag === "STYLE" || tag === "TEXTAREA" || tag === "INPUT") { return true; }
        if (p.id === "terminalOutput" || p.id === "nano") { return true; }
        if (p.classList && p.classList.contains("cameo")) { return true; }
      }
      p = p.parentNode;
    }
    return false;
  }

  function envuelve(nodo) {
    var texto = nodo.nodeValue;
    var re = new RegExp(PATRON, "g");
    var frag = document.createDocumentFragment();
    var ultimo = 0, m;
    while ((m = re.exec(texto)) !== null) {
      if (m.index > ultimo) { frag.appendChild(document.createTextNode(texto.slice(ultimo, m.index))); }
      var span = document.createElement("span");
      span.className = "cameo";
      span.setAttribute("data-wiki", RG.CAMEOS[m[0]]);
      span.textContent = m[0];
      frag.appendChild(span);
      ultimo = m.index + m[0].length;
    }
    if (ultimo < texto.length) { frag.appendChild(document.createTextNode(texto.slice(ultimo))); }
    nodo.parentNode.replaceChild(frag, nodo);
  }

  RG.cameos = {
    /* Marca los nombres que haya dentro de un elemento (por omisión, toda la página) */
    apply: function (raiz) {
      raiz = raiz || document.body;
      if (!raiz || !document.createTreeWalker) { return; }
      var walker = document.createTreeWalker(raiz, NodeFilter.SHOW_TEXT, null);
      var pendientes = [], nodo;
      while ((nodo = walker.nextNode()) !== null) {
        if (!nodo.nodeValue || !HAY_ALGUNO.test(nodo.nodeValue)) { continue; }
        if (fuera(nodo, raiz)) { continue; }
        pendientes.push(nodo);
      }
      pendientes.forEach(envuelve);
    },
    /* Un único escuchador para toda la página */
    bind: function () {
      if (RG.cameos.atado) { return; }
      RG.cameos.atado = true;
      document.addEventListener("click", function (e) {
        var el = e.target;
        while (el && el !== document.body) {
          if (el.classList && el.classList.contains("cameo")) {
            var url = el.getAttribute("data-wiki");
            if (url) { global.open(url, "_blank", "noopener,noreferrer"); }
            return;
          }
          el = el.parentNode;
        }
      });
    }
  };
})(this);
