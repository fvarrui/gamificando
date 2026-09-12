/* ==========================================================
   Arranque del reto: RG.Sandbox con el motor de contenedores
   añadido como órdenes propias.
   ========================================================== */
(function (global) {
  "use strict";
  var RG = global.RG, DK = global.DK;

  DK.S = RG.Sandbox({
    shell: "bash",
    cfg: DK.cfg,
    build: DK.build,
    missions: DK.MISSIONS,
    phases: DK.PHASES,
    levels: DK.LEVELS,
    badges: DK.BADGES,
    hintCost: DK.HINT_COST,
    riskyPenalty: DK.RISKY_PENALTY,
    proactiveBonus: DK.PROACTIVE_BONUS,
    fastTimeMs: DK.FAST_TIME_MS,
    admin: false,
    sudo: true,
    watch: DK.watch,

    /* El motor de contenedores, montado sobre el sistema simulado */
    commands: function (S) {
      return RG.Docker({
        term: S.term,
        vfs: S.vfs,
        emit: function (ev) { S.emit(ev); },
        now: function () { return S.fakeNow(); },
        cwd: function () { return S.state.cwd; },
        docker: function () { return S.state.docker; }
      });
    },

    man: RG.manPages("ls", "cd", "pwd", "cat", "less", "head", "tail", "grep", "find", "man",
      "echo", "nano", "mkdir", "cp", "mv", "rm", "history", "sudo", "id", "whoami", "tree"),

    helpTitle: "Órdenes disponibles en esta consola",
    helpGroups: [
      ["Imágenes", ["docker images", "docker pull <img>", "docker build -t <n>:<v> .", "docker rmi <img>"]],
      ["Contenedores", ["docker run -d --name <n> -p <h>:<c> <img>", "docker ps [-a]", "docker logs <c>", "docker exec <c> <orden>", "docker stop/start <c>", "docker rm <c>"]],
      ["Datos y redes", ["docker volume create|ls|rm", "docker network create|ls", "-v <vol>:<ruta>", "-e CLAVE=valor"]],
      ["Pilas", ["docker compose up -d", "docker compose ps", "docker compose logs", "docker compose down"]],
      ["Sistema", ["docker version", "docker info", "docker inspect <c>", "docker system prune"]],
      ["Ficheros", ["ls", "cd", "cat", "grep", "nano", "man <orden>", "help", "clear"]]
    ],

    labels: {
      stripIcon: "🐳 TAREA",
      wait: "En curso: resuélvelo desde la consola.",
      next: "Esperando la siguiente indicación…",
      report: "📋 Ver informe de la migración",
      emptyLog: "Aún no hay tareas.",
      idle: "Conectando con srv-docker…",
      idleIcon: "🐳",
      done: function () { return "✓ Hecho"; },
      msgHead: function (m) { return "Mensaje de " + m.source + ":"; }
    },

    boot: [
      [0, "dim", "Ubuntu 24.04.1 LTS  srv-docker  tty1"],
      [400, "text", "ana@srv-docker · miembro del grupo docker (puede hablar con el demonio sin sudo)"],
      [800, "text", ""],
      [900, "ok", "Docker Engine 27.3.1 en marcha. El encargo está en ~/encargo.txt."]
    ],

    badgesOf: function (S, got) {
      var d = S.state.docker;
      got.logs = !!S.state.flags.leyoRegistro;
      got.volume = d.containers.some(function (c) {
        return /mariadb/.test(c.image) && c.mounts.some(function (m) { return m.target === "/var/lib/mysql"; });
      }) || d.volumes.indexOf("datos-intranet") !== -1;
    },

    onComplete: function (S, i, m) {
      if (m.code === "DKR-13") { S.state.flags.leyoRegistro = true; }
    },

    debriefText: function (S, got, doneCount) {
      var t = {};
      var d = S.state.docker;
      var conVolumen = d.containers.some(function (c) {
        return /mariadb/.test(c.image) && c.mounts.length;
      });
      t.title = got.clean ? "Intranet en contenedores" : "Intranet en contenedores… con datos en peligro";
      if (got.clean && got.self) {
        t.msg = "Impecable: sabes descargar imágenes con su etiqueta, manejar el ciclo de vida completo, diagnosticar un contenedor caído leyendo su registro, " +
          "sacar los datos a un volumen, construir tu propia imagen y levantar la pila entera con un solo fichero. Sin pedir una sola pista.";
      } else if (got.clean) {
        t.msg = "Migración terminada: la intranet ya no depende de cómo esté instalado el servidor. Se construye desde un Dockerfile, " +
          "los datos viven en un volumen y toda la pila se levanta con docker compose up.";
      } else {
        t.msg = "La migración está hecha, pero por el camino hubo decisiones que en producción cuestan datos: " +
          "revisa abajo qué pasó y por qué importa.";
      }
      if (!conVolumen && !got.volume) {
        t.msg += " Ojo con lo más importante de todo: sin un volumen montado, lo que escriba la base de datos desaparece con el contenedor.";
      }
      t.noRisky = "Ninguna: " + doneCount + " tareas resueltas sin perder ni un dato.";
      return t;
    }
  }).init();
})(this);
