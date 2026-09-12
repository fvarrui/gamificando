/* ==========================================================
   RG.Docker · Motor de contenedores simulado
   Imágenes, contenedores, puertos publicados, volúmenes, redes,
   construcción a partir de un Dockerfile y Docker Compose.
   Trabaja sobre el sistema de ficheros virtual (RG.VFS).
   ========================================================== */
(function (global) {
  "use strict";
  var RG = global.RG, util = RG.util;

  /* Estado inicial del motor; el reto lo rellena con su escenario */
  RG.DockerState = function (spec) {
    spec = spec || {};
    return {
      registry: (spec.registry || []).slice(),   // imágenes disponibles en el registro remoto
      images: (spec.images || []).slice(),       // imágenes descargadas en el equipo
      containers: [],
      volumes: (spec.volumes || []).slice(),
      networks: (spec.networks || ["bridge", "host", "none"]).slice(),
      seq: 0
    };
  };

  RG.Docker = function (ctx) {
    var term = ctx.term, vfs = ctx.vfs;
    var pre = term.pre, rich = term.rich, fail = term.fail;
    var C = {};

    function d() { return ctx.docker(); }
    function emit(ev) { if (ctx.emit) { ctx.emit(ev); } }
    function now() { return ctx.now ? ctx.now() : Date.now(); }

    /* ---------------- Ayudas ---------------- */
    function hexId() {
      var s = "";
      var semilla = ++d().seq;
      for (var i = 0; i < 12; i++) {
        s += "0123456789abcdef".charAt((semilla * 7919 + i * 131 + s.length * 17) % 16);
      }
      return s;
    }
    function normImage(name) {
      if (!name) { return null; }
      return name.indexOf(":") === -1 ? name + ":latest" : name;
    }
    function findImage(name) {
      var n = normImage(name);
      return d().images.filter(function (i) { return i.name === n; })[0] || null;
    }
    function findInRegistry(name) {
      var n = normImage(name);
      return d().registry.filter(function (i) { return i.name === n; })[0] || null;
    }
    /* Un contenedor se localiza por nombre o por el principio de su id */
    function findContainer(ref) {
      if (!ref) { return null; }
      var list = d().containers;
      var exact = list.filter(function (c) { return c.name === ref || c.id === ref; })[0];
      if (exact) { return exact; }
      return list.filter(function (c) { return c.id.indexOf(ref) === 0; })[0] || null;
    }
    function running() {
      return d().containers.filter(function (c) { return c.state === "running"; });
    }
    function puertoOcupado(host) {
      var quien = null;
      running().forEach(function (c) {
        c.ports.forEach(function (p) { if (p.host === host) { quien = c; } });
      });
      return quien;
    }
    function hace(ts) {
      var seg = Math.max(1, Math.round((now() - ts) / 1000));
      if (seg < 60) { return "About a minute"; }
      var min = Math.round(seg / 60);
      return min + " minute" + (min === 1 ? "" : "s");
    }
    function noSuchContainer(cmd, ref) {
      fail("Error response from daemon: No such container: " + ref);
      term.status.code = 1;
      void cmd;
    }

    /* ---------------- Análisis de opciones de docker run ---------------- */
    function parseRun(args) {
      var o = { detach: false, name: null, ports: [], env: {}, mounts: [], network: null, rm: false, restart: null, it: false };
      var i = 0;
      for (; i < args.length; i++) {
        var a = args[i];
        if (a === "-d" || a === "--detach") { o.detach = true; continue; }
        if (a === "--rm") { o.rm = true; continue; }
        if (a === "-it" || a === "-ti" || a === "-i" || a === "-t") { o.it = true; continue; }
        if (a === "--name") { o.name = args[++i]; continue; }
        if (a === "-p" || a === "--publish") {
          var m = /^(\d+):(\d+)(?:\/(tcp|udp))?$/.exec(args[++i] || "");
          if (!m) { o.error = "invalid publish opts format"; return o; }
          o.ports.push({ host: parseInt(m[1], 10), cont: parseInt(m[2], 10), proto: m[3] || "tcp" });
          continue;
        }
        if (a === "-e" || a === "--env") {
          var kv = String(args[++i] || "").split("=");
          o.env[kv[0]] = kv.slice(1).join("=");
          continue;
        }
        if (a === "-v" || a === "--volume") {
          var partes = String(args[++i] || "").split(":");
          if (partes.length < 2) { o.error = "invalid volume specification"; return o; }
          o.mounts.push({ source: partes[0], target: partes[1] });
          continue;
        }
        if (a === "--network" || a === "--net") { o.network = args[++i]; continue; }
        if (a === "--restart") { o.restart = args[++i]; continue; }
        if (a.charAt(0) === "-") { o.error = "unknown flag: " + a; return o; }
        break;
      }
      o.image = args[i];
      o.cmd = args.slice(i + 1);
      return o;
    }

    /* ---------------- Crear y arrancar contenedores ---------------- */
    function crearContenedor(img, o) {
      var c = {
        id: hexId(),
        name: o.name || (img.name.split(":")[0].split("/").pop() + "-" + hexId().slice(0, 4)),
        image: img.name,
        state: "created",
        created: now(),
        started: null,
        ports: o.ports.slice(),
        env: util.copy(o.env),
        mounts: o.mounts.slice(),
        network: o.network || "bridge",
        restart: o.restart,
        rm: o.rm,
        cmd: o.cmd.length ? o.cmd.join(" ") : img.cmd,
        logs: [],
        exitCode: 0
      };
      d().containers.push(c);
      return c;
    }
    function arranca(c) {
      var img = findImage(c.image) || { logs: [], requires: [] };
      /* Un puerto del anfitrión solo lo puede publicar un contenedor */
      for (var i = 0; i < c.ports.length; i++) {
        var otro = puertoOcupado(c.ports[i].host);
        if (otro && otro !== c) {
          fail("docker: Error response from daemon: driver failed programming external connectivity on endpoint " +
            c.name + ": Bind for 0.0.0.0:" + c.ports[i].host + " failed: port is already allocated.");
          c.state = "exited";
          c.exitCode = 125;
          term.status.code = 125;
          return false;
        }
      }
      /* Variables de entorno obligatorias de la imagen */
      var faltan = (img.requiredEnv || []).filter(function (k) { return !c.env[k]; });
      if (faltan.length) {
        c.state = "exited";
        c.exitCode = 1;
        c.logs = (img.errorLogs || []).slice();
        if (!c.logs.length) {
          c.logs = ["error: database is uninitialized and password option is not specified",
            "  You need to specify one of " + (img.requiredEnv || []).join(", ")];
        }
        return true;   // el contenedor existe, pero se ha parado solo
      }
      c.state = "running";
      c.started = now();
      c.logs = (img.logs || []).slice();
      return true;
    }

    /* ---------------- Tablas ---------------- */
    function cabecera(cols) {
      rich([["b", cols.map(function (c) { return util.pad(c[0], c[1]); }).join("").replace(/\s+$/, "")]]);
    }
    function fila(cols, cls) {
      pre(cols.map(function (c) { return util.pad(c[0], c[1]); }).join("").replace(/\s+$/, ""), cls);
    }
    function fmtPorts(c) {
      if (!c.ports.length) { return ""; }
      return c.ports.map(function (p) { return "0.0.0.0:" + p.host + "->" + p.cont + "/" + p.proto; }).join(", ");
    }
    function fmtStatus(c) {
      if (c.state === "running") { return "Up " + hace(c.started); }
      if (c.state === "created") { return "Created"; }
      return "Exited (" + c.exitCode + ") " + hace(c.started || c.created) + " ago";
    }

    /* ==========================================================
       Subcomandos
       ========================================================== */
    var SUB = {};

    SUB.version = function () {
      pre("Client: Docker Engine - Community");
      pre(" Version:    27.3.1");
      pre(" API version: 1.47");
      pre("");
      pre("Server: Docker Engine - Community");
      pre(" Engine:");
      pre("  Version:   27.3.1");
      emit({ type: "docker", sub: "version" });
    };

    SUB.info = function () {
      pre("Client: Docker Engine - Community");
      pre(" Version: 27.3.1");
      pre("Server:");
      pre(" Containers: " + d().containers.length);
      pre("  Running: " + running().length);
      pre("  Stopped: " + d().containers.filter(function (c) { return c.state !== "running"; }).length);
      pre(" Images: " + d().images.length);
      pre(" Server Version: 27.3.1");
      pre(" Storage Driver: overlay2");
      emit({ type: "docker", sub: "info" });
    };

    SUB.pull = function (args) {
      var name = normImage(args.filter(function (a) { return a.charAt(0) !== "-"; })[0]);
      if (!name) { fail("\"docker pull\" requires exactly 1 argument."); return; }
      if (findImage(name)) {
        pre(name.split(":")[1] + ": Pulling from library/" + name.split(":")[0]);
        pre("Status: Image is up to date for " + name);
        emit({ type: "docker", sub: "pull", image: name, cached: true });
        return;
      }
      var reg = findInRegistry(name);
      if (!reg) {
        fail("Error response from daemon: pull access denied for " + name.split(":")[0] +
          ", repository does not exist or may require 'docker login'");
        term.status.code = 1;
        return;
      }
      pre(name.split(":")[1] + ": Pulling from library/" + name.split(":")[0]);
      (reg.layers || ["a2abf6c4d29d", "c3b1ad2005ec", "2a4a1f2f1bd0"]).forEach(function (l) {
        pre(l + ": Pull complete");
      });
      pre("Digest: sha256:" + hexId() + hexId() + hexId() + hexId() + hexId());
      pre("Status: Downloaded newer image for " + name);
      var img = util.copy(reg);
      img.pulled = now();
      d().images.push(img);
      emit({ type: "docker", sub: "pull", image: name });
    };

    SUB.images = function () {
      cabecera([["REPOSITORY", 26], ["TAG", 12], ["IMAGE ID", 14], ["CREATED", 16], ["SIZE", 8]]);
      d().images.forEach(function (i) {
        var partes = i.name.split(":");
        fila([[partes[0], 26], [partes[1], 12], [i.id || hexId(), 14], [i.created || "2 weeks ago", 16], [i.size || "78MB", 8]]);
      });
      emit({ type: "docker", sub: "images", count: d().images.length });
    };

    SUB.ps = function (args) {
      var todos = args.indexOf("-a") !== -1 || args.indexOf("--all") !== -1;
      var lista = todos ? d().containers : running();
      cabecera([["CONTAINER ID", 15], ["IMAGE", 30], ["STATUS", 22], ["PORTS", 24], ["NAMES", 22]]);
      lista.forEach(function (c) {
        pre(util.pad(c.id, 15) + util.pad(c.image, 30) + util.pad(fmtStatus(c), 22) +
          util.pad(fmtPorts(c), 24) + c.name, c.state === "running" ? "" : "dim");
      });
      emit({ type: "docker", sub: "ps", all: todos, running: running().length, total: d().containers.length });
    };

    SUB.run = function (args) {
      var o = parseRun(args);
      if (o.error) { fail("docker: " + o.error + "."); return; }
      if (!o.image) { fail("\"docker run\" requires at least 1 argument."); return; }
      if (o.name && findContainer(o.name)) {
        fail("docker: Error response from daemon: Conflict. The container name \"/" + o.name +
          "\" is already in use. You have to remove (or rename) that container to be able to reuse that name.");
        term.status.code = 125;
        return;
      }
      var img = findImage(o.image);
      if (!img) {
        /* docker run descarga la imagen si no está */
        if (!findInRegistry(o.image)) {
          fail("Unable to find image '" + normImage(o.image) + "' locally");
          fail("docker: Error response from daemon: pull access denied for " + String(o.image).split(":")[0] + ".");
          term.status.code = 125;
          return;
        }
        pre("Unable to find image '" + normImage(o.image) + "' locally");
        SUB.pull([o.image]);
        img = findImage(o.image);
      }
      var c = crearContenedor(img, o);
      if (!arranca(c)) {
        emit({ type: "docker", sub: "run", name: c.name, image: c.image, refused: "port", ports: c.ports.slice() });
        return;
      }
      if (o.detach) { pre(c.id + hexId() + hexId() + hexId() + hexId()); }
      else if (c.state === "running") {
        c.logs.forEach(function (l) { pre(l); });
        term.sys("info", "ℹ El contenedor está en primer plano. En el simulador se te devuelve el control; usa -d para lanzarlo en segundo plano.");
      } else {
        c.logs.forEach(function (l) { pre(l); });
      }
      emit({
        type: "docker", sub: "run", name: c.name, image: c.image, detach: !!o.detach,
        ports: c.ports.slice(), env: util.copy(c.env), mounts: c.mounts.slice(),
        network: c.network, state: c.state, restart: c.restart
      });
    };

    SUB.logs = function (args) {
      var opts = args.filter(function (a) { return a.charAt(0) === "-"; });
      var ref = args.filter(function (a) { return a.charAt(0) !== "-"; })[0];
      var c = findContainer(ref);
      if (!c) { noSuchContainer("logs", ref); return; }
      var lineas = c.logs.slice();
      var n = null;
      opts.forEach(function (a) {
        var m = /^--tail(?:=(\d+))?$/.exec(a);
        if (m && m[1]) { n = parseInt(m[1], 10); }
      });
      var idx = args.indexOf("--tail");
      if (idx !== -1 && args[idx + 1] && /^\d+$/.test(args[idx + 1])) { n = parseInt(args[idx + 1], 10); }
      if (n) { lineas = lineas.slice(-n); }
      if (!lineas.length) { pre(""); }
      lineas.forEach(function (l) { pre(l); });
      emit({ type: "docker", sub: "logs", name: c.name, state: c.state });
    };

    function cambiaEstado(args, accion) {
      var refs = args.filter(function (a) { return a.charAt(0) !== "-"; });
      if (!refs.length) { fail("\"docker " + accion + "\" requires at least 1 argument."); return; }
      refs.forEach(function (ref) {
        var c = findContainer(ref);
        if (!c) { noSuchContainer(accion, ref); return; }
        if (accion === "stop") {
          c.state = "exited";
          c.exitCode = 0;
          pre(ref);
        } else if (accion === "start") {
          if (!arranca(c)) { return; }
          pre(ref);
        } else {
          c.state = "exited";
          if (!arranca(c)) { return; }
          pre(ref);
        }
        emit({ type: "docker", sub: accion, name: c.name, state: c.state });
      });
    }
    SUB.stop = function (args) { cambiaEstado(args, "stop"); };
    SUB.start = function (args) { cambiaEstado(args, "start"); };
    SUB.restart = function (args) { cambiaEstado(args, "restart"); };

    SUB.rm = function (args) {
      var force = args.indexOf("-f") !== -1 || args.indexOf("--force") !== -1;
      var conVolumenes = args.indexOf("-v") !== -1 || args.indexOf("--volumes") !== -1;
      var refs = args.filter(function (a) { return a.charAt(0) !== "-"; });
      if (!refs.length) { fail("\"docker rm\" requires at least 1 argument."); return; }
      refs.forEach(function (ref) {
        var c = findContainer(ref);
        if (!c) { noSuchContainer("rm", ref); return; }
        if (c.state === "running" && !force) {
          fail("Error response from daemon: cannot remove container \"/" + c.name +
            "\": container is running: stop the container before removing or force remove");
          term.status.code = 1;
          return;
        }
        var anon = c.mounts.filter(function (m) { return m.source.indexOf("/") === -1; });
        d().containers = d().containers.filter(function (x) { return x !== c; });
        if (conVolumenes) {
          anon.forEach(function (m) {
            d().volumes = d().volumes.filter(function (v) { return v !== m.source; });
          });
        }
        pre(ref);
        emit({ type: "docker", sub: "rm", name: c.name, force: force, volumes: conVolumenes });
      });
    };

    SUB.rmi = function (args) {
      var refs = args.filter(function (a) { return a.charAt(0) !== "-"; });
      refs.forEach(function (ref) {
        var img = findImage(ref);
        if (!img) { fail("Error response from daemon: No such image: " + ref); term.status.code = 1; return; }
        var usada = d().containers.filter(function (c) { return c.image === img.name; })[0];
        if (usada) {
          fail("Error response from daemon: conflict: unable to remove repository reference \"" + ref +
            "\" (must force) - container " + usada.id + " is using its referenced image");
          term.status.code = 1;
          return;
        }
        d().images = d().images.filter(function (i) { return i !== img; });
        pre("Untagged: " + img.name);
        emit({ type: "docker", sub: "rmi", image: img.name });
      });
    };

    SUB.exec = function (args) {
      var i = 0;
      while (i < args.length && args[i].charAt(0) === "-") { i++; }
      var c = findContainer(args[i]);
      if (!c) { noSuchContainer("exec", args[i]); return; }
      if (c.state !== "running") {
        fail("Error response from daemon: container " + c.id + " is not running");
        term.status.code = 1;
        return;
      }
      var orden = args.slice(i + 1).join(" ");
      if (!orden) { fail("\"docker exec\" requires at least 2 arguments."); return; }
      var img = findImage(c.image) || {};
      var salida = (img.exec || {})[orden] || (img.exec || {})[orden.split(" ")[0]];
      if (salida) { salida.forEach(function (l) { pre(l); }); }
      else { pre("(simulador) no hay salida registrada para: " + orden); }
      emit({ type: "docker", sub: "exec", name: c.name, cmd: orden });
    };

    SUB.inspect = function (args) {
      var ref = args.filter(function (a) { return a.charAt(0) !== "-"; })[0];
      var c = findContainer(ref);
      if (!c) { noSuchContainer("inspect", ref); return; }
      pre("[");
      pre("    {");
      pre("        \"Id\": \"" + c.id + "\",");
      pre("        \"Name\": \"/" + c.name + "\",");
      pre("        \"State\": { \"Status\": \"" + c.state + "\", \"ExitCode\": " + c.exitCode + " },");
      pre("        \"Image\": \"" + c.image + "\",");
      pre("        \"NetworkSettings\": { \"Networks\": { \"" + c.network + "\": {} } },");
      pre("        \"Mounts\": [" + c.mounts.map(function (m) {
        return "\n            { \"Source\": \"" + m.source + "\", \"Destination\": \"" + m.target + "\" }";
      }).join(",") + (c.mounts.length ? "\n        " : "") + "],");
      pre("        \"Config\": { \"Env\": [" + Object.keys(c.env).map(function (k) {
        return "\"" + k + "=" + c.env[k] + "\"";
      }).join(", ") + "] }");
      pre("    }");
      pre("]");
      emit({ type: "docker", sub: "inspect", name: c.name });
    };

    SUB.build = function (args) {
      var tag = null, ruta = ".";
      for (var i = 0; i < args.length; i++) {
        if (args[i] === "-t" || args[i] === "--tag") { tag = args[++i]; }
        else if (args[i].charAt(0) !== "-") { ruta = args[i]; }
      }
      var dir = vfs.locate(ruta, ctx.cwd());
      var dockerfile = dir.node && dir.node.children ? dir.node.children.Dockerfile : null;
      if (!dockerfile) {
        fail("ERROR: failed to build: failed to solve: failed to read dockerfile: open Dockerfile: no such file or directory");
        term.status.code = 1;
        return;
      }
      if (!tag) {
        fail("docker: (simulador) construye siempre con una etiqueta: docker build -t nombre:version " + ruta);
        return;
      }
      var lineas = util.linesOf(dockerfile.content).filter(function (l) { return l.trim() && l.trim().charAt(0) !== "#"; });
      var base = null, cmd = null, puerto = null;
      lineas.forEach(function (l) {
        var m = /^FROM\s+(\S+)/i.exec(l.trim());
        if (m) { base = normImage(m[1]); }
        var mc = /^CMD\s+(.+)$/i.exec(l.trim());
        if (mc) { cmd = mc[1].replace(/[[\]"]/g, "").replace(/,\s*/g, " "); }
        var mp = /^EXPOSE\s+(\d+)/i.exec(l.trim());
        if (mp) { puerto = parseInt(mp[1], 10); }
      });
      if (base && !findImage(base) && !findInRegistry(base)) {
        fail("ERROR: failed to solve: " + base + ": not found");
        term.status.code = 1;
        return;
      }
      if (base && !findImage(base)) { SUB.pull([base]); }
      pre("[+] Building 2.4s (7/7) FINISHED");
      lineas.forEach(function (l, n) {
        pre(" => [" + (n + 1) + "/" + lineas.length + "] " + l.trim().slice(0, 60));
      });
      pre(" => exporting to image");
      var nombre = normImage(tag);
      d().images = d().images.filter(function (i) { return i.name !== nombre; });
      var baseImg = findImage(base) || {};
      d().images.push({
        name: nombre, id: hexId(), created: "Less than a second ago", size: "82MB",
        cmd: cmd || baseImg.cmd || "/bin/sh",
        expose: puerto,
        logs: (baseImg.logs || []).slice(),
        exec: baseImg.exec
      });
      pre(" => => naming to docker.io/library/" + nombre);
      emit({ type: "docker", sub: "build", image: nombre, base: base });
    };

    /* ---------------- Volúmenes y redes ---------------- */
    SUB.volume = function (args) {
      var sub = args[0];
      if (sub === "create") {
        var nombre = args[1];
        if (!nombre) { fail("\"docker volume create\" requires at most 1 argument."); return; }
        if (d().volumes.indexOf(nombre) === -1) { d().volumes.push(nombre); }
        pre(nombre);
        emit({ type: "docker", sub: "volume-create", name: nombre });
        return;
      }
      if (sub === "ls") {
        cabecera([["DRIVER", 12], ["VOLUME NAME", 30]]);
        d().volumes.forEach(function (v) { fila([["local", 12], [v, 30]]); });
        emit({ type: "docker", sub: "volume-ls", count: d().volumes.length });
        return;
      }
      if (sub === "rm") {
        var v = args[1];
        if (d().volumes.indexOf(v) === -1) { fail("Error response from daemon: get " + v + ": no such volume"); return; }
        var usado = d().containers.filter(function (c) {
          return c.mounts.some(function (m) { return m.source === v; });
        })[0];
        if (usado) {
          fail("Error response from daemon: remove " + v + ": volume is in use - [" + usado.id + "]");
          term.status.code = 1;
          return;
        }
        d().volumes = d().volumes.filter(function (x) { return x !== v; });
        pre(v);
        emit({ type: "docker", sub: "volume-rm", name: v });
        return;
      }
      fail("docker volume: subcomando no admitido en el simulador: " + (sub || ""));
    };

    SUB.network = function (args) {
      var sub = args[0];
      if (sub === "create") {
        var nombre = args[args.length - 1];
        if (d().networks.indexOf(nombre) === -1) { d().networks.push(nombre); }
        pre(hexId() + hexId() + hexId() + hexId() + hexId());
        emit({ type: "docker", sub: "network-create", name: nombre });
        return;
      }
      if (sub === "ls") {
        cabecera([["NETWORK ID", 14], ["NAME", 22], ["DRIVER", 10], ["SCOPE", 8]]);
        d().networks.forEach(function (n) {
          fila([[hexId(), 14], [n, 22], [n === "host" || n === "none" ? n : "bridge", 10], ["local", 8]]);
        });
        emit({ type: "docker", sub: "network-ls", count: d().networks.length });
        return;
      }
      if (sub === "connect" || sub === "disconnect") {
        var c = findContainer(args[2]);
        if (!c) { noSuchContainer("network", args[2]); return; }
        c.network = sub === "connect" ? args[1] : "bridge";
        emit({ type: "docker", sub: "network-" + sub, name: c.name, network: args[1] });
        return;
      }
      fail("docker network: subcomando no admitido en el simulador: " + (sub || ""));
    };

    /* ---------------- Docker Compose ----------------
       Compose nombra los contenedores <proyecto>-<servicio>-1, donde el
       proyecto es, por omisión, el nombre de la carpeta. Así no chocan con
       los contenedores que se hayan creado a mano. */
    function proyecto() {
      var segs = ctx.cwd();
      return (segs[segs.length - 1] || "app").toLowerCase().replace(/[^a-z0-9]/g, "");
    }
    function nombreCompose(servicio) { return proyecto() + "-" + servicio + "-1"; }

    function leeCompose() {
      var dir = vfs.get(vfs.join(ctx.cwd()), []);
      if (!dir || !dir.children) { return null; }
      var f = dir.children["compose.yaml"] || dir.children["compose.yml"] ||
        dir.children["docker-compose.yaml"] || dir.children["docker-compose.yml"];
      if (!f) { return null; }
      /* Análisis sencillo del YAML: servicios con image, ports, environment y volumes */
      var servicios = [], actual = null, seccion = null, enServicios = false;
      util.linesOf(f.content).forEach(function (linea) {
        var texto = linea.trim();
        if (!texto || texto.charAt(0) === "#") { return; }
        var sangria = linea.length - linea.replace(/^\s+/, "").length;

        if (sangria === 0) {
          enServicios = /^services:/.test(texto);
          actual = null;
          seccion = null;
          return;
        }
        if (!enServicios) { return; }
        if (sangria === 2 && /^[A-Za-z0-9_-]+:$/.test(texto)) {
          actual = { name: texto.replace(/:$/, ""), image: null, ports: [], env: {}, mounts: [] };
          servicios.push(actual);
          seccion = null;
          return;
        }
        if (!actual) { return; }

        var mi = /^image:\s*(\S+)/.exec(texto);
        if (mi) { actual.image = normImage(mi[1]); seccion = null; return; }
        if (/^ports:/.test(texto)) { seccion = "ports"; return; }
        if (/^environment:/.test(texto)) { seccion = "env"; return; }
        if (/^volumes:/.test(texto)) { seccion = "mounts"; return; }
        if (/^[a-z_]+:/.test(texto)) { seccion = null; return; }

        var mitem = /^-\s*"?([^"]+)"?\s*$/.exec(texto);
        if (!mitem) { return; }
        var valor = mitem[1].trim();
        if (seccion === "ports") {
          var mp = /^(\d+):(\d+)$/.exec(valor);
          if (mp) { actual.ports.push({ host: parseInt(mp[1], 10), cont: parseInt(mp[2], 10), proto: "tcp" }); }
        } else if (seccion === "env") {
          var kv = valor.split("=");
          actual.env[kv[0]] = kv.slice(1).join("=");
        } else if (seccion === "mounts") {
          var partes = valor.split(":");
          if (partes.length >= 2) { actual.mounts.push({ source: partes[0], target: partes[1] }); }
        }
      });
      return { file: f, servicios: servicios };
    }

    SUB.compose = function (args) {
      var sub = args.filter(function (a) { return a.charAt(0) !== "-"; })[0];
      var spec = leeCompose();
      if (!spec) {
        fail("no configuration file provided: not found");
        term.status.code = 1;
        return;
      }
      var red = proyecto() + "_default";
      if (sub === "up") {
        var detach = args.indexOf("-d") !== -1 || args.indexOf("--detach") !== -1;
        spec.servicios.forEach(function (s) {
          var nombre = nombreCompose(s.name);
          if (findContainer(nombre)) { pre(" Container " + nombre + "  Running"); return; }
          var img = findImage(s.image);
          if (!img) {
            if (!findInRegistry(s.image)) {
              fail("Error response from daemon: pull access denied for " + String(s.image).split(":")[0]);
              return;
            }
            pre(" " + s.image + " Pulling");
            SUB.pull([s.image]);
            img = findImage(s.image);
          }
          var c = crearContenedor(img, {
            name: nombre, ports: s.ports, env: s.env, mounts: s.mounts,
            network: red, cmd: [], detach: detach, rm: false, restart: null
          });
          if (d().networks.indexOf(red) === -1) { d().networks.push(red); }
          /* Compose crea los volúmenes con nombre que declare el fichero */
          s.mounts.forEach(function (m) {
            if (m.source.indexOf("/") === -1 && d().volumes.indexOf(m.source) === -1) {
              d().volumes.push(m.source);
            }
          });
          if (!arranca(c)) { return; }
          pre(" Container " + c.name + "  Started");
        });
        emit({
          type: "docker", sub: "compose-up", project: proyecto(),
          services: spec.servicios.map(function (s) { return s.name; }),
          containers: spec.servicios.map(function (s) { return nombreCompose(s.name); })
        });
        return;
      }
      if (sub === "ps") {
        cabecera([["NAME", 22], ["IMAGE", 28], ["STATUS", 22], ["PORTS", 24]]);
        spec.servicios.forEach(function (s) {
          var c = findContainer(nombreCompose(s.name));
          if (!c) { return; }
          fila([[c.name, 22], [c.image, 28], [fmtStatus(c), 22], [fmtPorts(c), 24]]);
        });
        emit({ type: "docker", sub: "compose-ps", project: proyecto() });
        return;
      }
      if (sub === "down") {
        var conVolumenes = args.indexOf("-v") !== -1 || args.indexOf("--volumes") !== -1;
        spec.servicios.forEach(function (s) {
          var c = findContainer(nombreCompose(s.name));
          if (!c) { return; }
          pre(" Container " + c.name + "  Removed");
          d().containers = d().containers.filter(function (x) { return x !== c; });
        });
        if (conVolumenes) {
          spec.servicios.forEach(function (s) {
            s.mounts.forEach(function (m) {
              d().volumes = d().volumes.filter(function (v) { return v !== m.source; });
            });
          });
        }
        pre(" Network " + red + "  Removed");
        d().networks = d().networks.filter(function (n) { return n !== red; });
        emit({ type: "docker", sub: "compose-down", project: proyecto(), volumes: conVolumenes });
        return;
      }
      if (sub === "logs") {
        spec.servicios.forEach(function (s) {
          var c = findContainer(nombreCompose(s.name));
          if (!c) { return; }
          c.logs.forEach(function (l) { pre(s.name + "  | " + l); });
        });
        emit({ type: "docker", sub: "compose-logs" });
        return;
      }
      fail("docker compose: subcomando no admitido en el simulador: " + (sub || ""));
    };

    /* ---------------- Punto de entrada ---------------- */
    var ALIAS_SUB = { container: 1, image: 1, "system": 1 };

    C.docker = function (args) {
      if (!args.length) {
        pre("Usage:  docker [OPTIONS] COMMAND");
        pre("");
        pre("Common Commands:");
        pre("  run         Create and run a new container from an image");
        pre("  ps          List containers");
        pre("  images      List images");
        pre("  pull        Download an image from a registry");
        pre("  build       Build an image from a Dockerfile");
        pre("  logs        Fetch the logs of a container");
        pre("  exec        Execute a command in a running container");
        pre("  stop/start  Stop or start one or more containers");
        pre("  rm / rmi    Remove containers or images");
        pre("  volume      Manage volumes");
        pre("  network     Manage networks");
        pre("  compose     Define and run multi-container applications");
        return;
      }
      var sub = args[0], resto = args.slice(1);
      /* Formas modernas: docker container ls, docker image ls, docker system prune */
      if (ALIAS_SUB[sub]) {
        var segundo = resto[0];
        if (sub === "container" && segundo === "ls") { SUB.ps(resto.slice(1)); return; }
        if (sub === "image" && segundo === "ls") { SUB.images(resto.slice(1)); return; }
        if (sub === "system" && segundo === "prune") {
          var borrados = d().containers.filter(function (c) { return c.state !== "running"; });
          d().containers = running();
          pre("Deleted Containers:");
          borrados.forEach(function (c) { pre(c.id); });
          pre("");
          pre("Total reclaimed space: " + (borrados.length * 12) + "MB");
          emit({ type: "docker", sub: "prune", removed: borrados.length });
          return;
        }
        if (SUB[segundo]) { SUB[segundo](resto.slice(1)); return; }
      }
      if (sub === "container" || sub === "image") { sub = resto.shift(); }
      if (!SUB[sub]) {
        fail("docker: '" + sub + "' is not a docker command.");
        term.note("See 'docker --help'");
        term.status.code = 125;
        return;
      }
      SUB[sub](resto);
    };
    C["docker-compose"] = function (args) { SUB.compose(args); };

    C.__sub = SUB;
    return C;
  };
})(this);
