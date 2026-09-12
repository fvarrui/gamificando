/* ==========================================================
   Lógica de las tareas: cómo se comprueba cada una y con qué
   secuencia de órdenes se resuelve.
   Los textos están en data/missions.js.
   ========================================================== */
(function (global) {
  "use strict";
  var RG = global.RG, DK = global.DK, util = RG.util;

  function S() { return DK.S; }
  function d() { return DK.S.state.docker; }
  function img(name) {
    return d().images.filter(function (i) { return i.name === name; })[0] || null;
  }
  function cont(name) {
    return d().containers.filter(function (c) { return c.name === name; })[0] || null;
  }
  function vol(name) { return d().volumes.indexOf(name) !== -1; }
  function node(p) { return S().vfs.get(p, []); }
  function ends(p, name) { return new RegExp(name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "$").test(String(p || "")); }
  function esDocker(ev, sub) { return !!ev && ev.type === "docker" && ev.sub === sub; }
  function publica(c, host, contenedor) {
    return !!c && c.ports.some(function (p) { return p.host === host && p.cont === contenedor; });
  }

  var LOGIC = {
    /* ---------------- FASE 1 · IMÁGENES ---------------- */
    "DKR-01": {
      check: function (ev) { return !!ev && ev.type === "cat" && ends(ev.path, "encargo.txt"); },
      solution: ["cat encargo.txt"]
    },
    "DKR-02": {
      check: function (ev) { return esDocker(ev, "version"); },
      solution: ["docker version"]
    },
    "DKR-03": {
      check: function (ev) { return esDocker(ev, "images"); },
      solution: ["docker images"]
    },
    "DKR-04": {
      check: function () { return !!img("nginx:1.27"); },
      solution: ["docker pull nginx:1.27"]
    },
    "DKR-05": {
      check: function (ev) { return esDocker(ev, "images") && !!img("nginx:1.27"); },
      solution: ["docker images"]
    },
    "DKR-06": {
      check: function () {
        var c = cont("web");
        return !!c && c.state === "running" && c.image === "nginx:1.27" && publica(c, 8080, 80);
      },
      solution: ["docker run -d --name web -p 8080:80 nginx:1.27"]
    },

    /* ---------------- FASE 2 · CICLO DE VIDA ---------------- */
    "DKR-07": {
      check: function (ev) { return esDocker(ev, "ps") && !ev.all; },
      solution: ["docker ps"]
    },
    "DKR-08": {
      check: function (ev) { return esDocker(ev, "logs") && ev.name === "web"; },
      solution: ["docker logs web"]
    },
    "DKR-09": {
      check: function () {
        var c = cont("web");
        return !!c && c.state !== "running";
      },
      solution: ["docker stop web"]
    },
    "DKR-10": {
      check: function (ev) { return esDocker(ev, "ps") && ev.all; },
      solution: ["docker ps -a"]
    },
    "DKR-11": {
      check: function () { return !cont("web"); },
      solution: ["docker rm web"]
    },

    /* ---------------- FASE 3 · DATOS ---------------- */
    "DKR-12": {
      check: function () {
        var c = cont("base");
        return !!c && c.state !== "running" && !c.env.MARIADB_ROOT_PASSWORD;
      },
      solution: ["docker run -d --name base mariadb:11"]
    },
    "DKR-13": {
      check: function (ev) { return esDocker(ev, "logs") && ev.name === "base"; },
      solution: ["docker logs base"]
    },
    "DKR-14": {
      check: function () { return !cont("base"); },
      solution: ["docker rm base"]
    },
    "DKR-15": {
      check: function () { return vol("datos-intranet"); },
      solution: ["docker volume create datos-intranet"]
    },
    "DKR-16": {
      check: function () {
        var c = cont("base");
        return !!c && c.state === "running" && !!c.env.MARIADB_ROOT_PASSWORD &&
          c.mounts.some(function (m) { return m.source === "datos-intranet" && m.target === "/var/lib/mysql"; });
      },
      solution: ["docker run -d --name base -e MARIADB_ROOT_PASSWORD=Atl4nte -v datos-intranet:/var/lib/mysql mariadb:11"]
    },
    "DKR-17": {
      check: function (ev) { return esDocker(ev, "exec") && ev.name === "base" && /var\/lib\/mysql/.test(ev.cmd || ""); },
      solution: ["docker exec base ls /var/lib/mysql"]
    },

    /* ---------------- FASE 4 · IMAGEN PROPIA ---------------- */
    "DKR-18": {
      check: function (ev) { return !!ev && ev.type === "cat" && ends(ev.path, "Dockerfile"); },
      solution: ["cat intranet/Dockerfile"]
    },
    "DKR-19": {
      check: function () { return !!img("tecnoatlantica/intranet:1.0"); },
      solution: ["cd intranet", "docker build -t tecnoatlantica/intranet:1.0 ."]
    },
    "DKR-20": {
      check: function (ev) { return esDocker(ev, "images") && !!img("tecnoatlantica/intranet:1.0"); },
      solution: ["docker images"]
    },
    "DKR-21": {
      check: function () {
        var c = cont("intranet");
        return !!c && c.state === "running" && c.image === "tecnoatlantica/intranet:1.0" && publica(c, 8080, 80);
      },
      solution: ["docker run -d --name intranet -p 8080:80 tecnoatlantica/intranet:1.0"]
    },
    "DKR-22": {
      check: function (ev) { return esDocker(ev, "run") && ev.refused === "port"; },
      solution: ["docker run -d --name web2 -p 8080:80 nginx:1.27"]
    },

    /* ---------------- FASE 5 · COMPOSE ---------------- */
    "DKR-23": {
      check: function (ev) { return !!ev && ev.type === "cat" && /compose\.ya?ml$/.test(ev.path || ""); },
      solution: ["cd ~/pila", "cat compose.yaml"]
    },
    "DKR-24": {
      check: function (ev) {
        /* Compose nombra los contenedores <proyecto>-<servicio>-1 */
        return esDocker(ev, "compose-up") && (ev.containers || []).length === 3 &&
          ev.containers.every(function (n) {
            var c = cont(n);
            return !!c && c.state === "running";
          });
      },
      solution: ["docker compose up -d"]
    },
    "DKR-25": {
      check: function (ev) { return esDocker(ev, "compose-ps"); },
      solution: ["docker compose ps"]
    },
    "DKR-26": {
      check: function (ev) {
        return esDocker(ev, "compose-down") && !cont("pila-web-1") && !cont("pila-cache-1");
      },
      solution: ["docker compose down"]
    }
  };

  /* Vigilancia global: lo que de verdad hace daño con contenedores */
  DK.watch = function (S, ev) {
    if (ev.type !== "docker") { return; }
    if (ev.sub === "volume-rm" && /datos/.test(ev.name || "")) {
      S.game.addRisky("volume:rm",
        "has borrado el volumen «" + ev.name + "»: con él se van todos los datos de la base de datos, y eso no tiene vuelta atrás.");
    }
    if (ev.sub === "rm" && ev.volumes) {
      S.game.addRisky("rm:volumenes",
        "has eliminado el contenedor con -v: eso borra también sus volúmenes anónimos y los datos que hubiera dentro.");
    }
    if (ev.sub === "run" && /mariadb/.test(ev.image || "") && ev.state === "running" &&
        !(ev.mounts || []).length) {
      S.game.addRisky("db:sin-volumen",
        "has levantado la base de datos sin volumen: todo lo que escriba desaparecerá en cuanto se elimine el contenedor.");
    }
    if (ev.sub === "run" && /latest/.test(ev.image || "")) {
      S.game.addRisky("img:latest",
        "has usado la etiqueta latest: dentro de seis meses nadie sabrá qué versión se desplegó.");
    }
  };

  /* Contenido + lógica = tareas del juego */
  DK.MISSIONS = DK.MISSION_CONTENT.map(function (m, i) {
    var code = "DKR-" + util.pad2(i + 1);
    var logic = LOGIC[code] || {};
    var full = util.copy(m);
    full.code = code;
    full.check = logic.check || function () { return false; };
    full.onActivate = logic.onActivate;
    full.react = logic.react;
    full.solution = logic.solution || [];
    return full;
  });
})(this);
