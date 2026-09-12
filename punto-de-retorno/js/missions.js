/* ==========================================================
   Lógica de las misiones: cómo se comprueba cada una, qué
   hacen los compañeros al llegar el ticket y la secuencia de
   órdenes que la resuelve (se usa para empezar por una fase).
   El contenido (textos y pistas) está en data/missions.js.
   ========================================================== */
(function (global) {
  "use strict";
  var RG = global.RG, VG = global.VG, util = RG.util, cfg = VG.cfg;
  var state = VG.state, term = VG.term;
  var has = util.has, copy = util.copy, linesOf = util.linesOf;

  /* ---------------- Compañeros de equipo ---------------- */
  function bcastFrom(who, text) {
    term.sys("bcast", "Broadcast message from " + who + "@" + cfg.HOST + " (pts/2) (" + VG.fmtSysDate(VG.fakeNow()) + "):\n\n" + text);
    term.flash();
  }
  function insertBefore(text, needle, newLine) {
    var ls = linesOf(text), idx = -1;
    ls.forEach(function (l, i) { if (idx === -1 && l.indexOf(needle) !== -1) { idx = i; } });
    if (idx === -1) { ls.push(newLine); } else { ls.splice(idx, 0, newLine); }
    return ls.join("\n") + "\n";
  }
  function ikerWipCommits() {
    var g = state.git, base = VG.headHash();
    if (!g || !base) { return; }
    state.mem.wipBase = base;
    var baseTree = VG.treeOf(base);
    var t1 = copy(baseTree);
    t1["firewall.sh"] = insertBefore(t1["firewall.sh"] || "", "ufw --force enable", "ufw limit 22/tcp     # frena la fuerza bruta contra SSH");
    var c1 = VG.makeCommit(t1, [base], "wip", cfg.IKER);
    var t2 = copy(t1);
    t2["firewall.sh"] = insertBefore(t2["firewall.sh"], "ufw --force enable", "ufw logging on");
    var c2 = VG.makeCommit(t2, [c1], "wip 2", cfg.IKER);
    VG.applyTree(baseTree, t2);
    VG.setHead(c1, "commit: wip");
    VG.setHead(c2, "commit: wip 2");
    bcastFrom("arnold", "He hecho dos commits «wip» en tu main con cosas que me pediste (el límite de SSH y el registro).\nNo he subido nada al servidor. ¿Los dejo así?");
  }
  function nayraBranch() {
    var g = state.git, main = VG.branchTip("main") || VG.headHash();
    if (!g || !main) { return; }
    var base = null, h = main;
    while (h) {
      if (/ftp=activo/.test(state.commits[h].tree["servicios.conf"] || "")) { base = h; break; }
      h = state.commits[h].parents[0];
    }
    if (!base) { base = main; }
    var t = copy(VG.treeOf(base));
    t["servicios.conf"] = (t["servicios.conf"] || "").replace(/ftp=activo.*/, "ftp=eliminado       # vsftpd desinstalado");
    if (!/rdp=/.test(t["servicios.conf"])) { t["servicios.conf"] += "rdp=desactivado\n"; }
    var c = VG.makeCommit(t, [base], "Marca el FTP como eliminado y desactiva el RDP", cfg.NAYRA);
    g.branches["weaver/puertos"] = c;
    state.mem.nayraTip = c;
    bcastFrom("weaver", "Os dejo mi trabajo en la rama weaver/puertos: he desinstalado vsftpd del servidor, así que en servicios.conf\nel FTP ya no está «desactivado», está «eliminado». Fusionadla cuando podáis.");
  }
  function nayraPushAudit() {
    var tip = state.server.refs.main;
    if (!tip) { return; }
    var t = copy(VG.treeOf(tip));
    t["auditoria.md"] = "# Informe de auditoría · TecnoAtlántica\n\n- Telnet (23/tcp): cerrado\n- FTP anónimo (21/tcp): desactivado\n- SSH (22/tcp): sin acceso de root\n\nPendiente: escritorio remoto (3389/tcp).\n";
    var c = VG.makeCommit(t, [tip], "Añade el resumen del informe de auditoría", cfg.NAYRA);
    state.server.refs.main = c;
    state.mem.auditTip = c;
    bcastFrom("weaver", "He subido al servidor el resumen del informe de auditoría. Actualizaos antes de seguir tocando los scripts.");
  }
  function nayraPushSilent() {
    var tip = state.server.refs.main;
    if (!tip) { return; }
    var t = copy(VG.treeOf(tip));
    t["auditoria.md"] = (t["auditoria.md"] || "# Informe de auditoría\n") + "\n- Revisión de la semana 38: firmada por Sigourney.\n";
    var c = VG.makeCommit(t, [tip], "Anota la revisión de la semana 38", cfg.NAYRA);
    state.server.refs.main = c;
    state.mem.nayra2 = c;
  }
  function ikerPushTelnet() {
    var tip = state.server.refs.main;
    if (!tip) { return; }
    var t = copy(VG.treeOf(tip));
    t["firewall.sh"] = insertBefore(t["firewall.sh"] || "", "ufw --force enable", "ufw allow 23/tcp     # el switch del almacén lo necesita");
    var c = VG.makeCommit(t, [tip], "Reabre Telnet para el switch del almacén", cfg.IKER);
    state.server.refs.main = c;
    state.mem.ikerTip = c;
    bcastFrom("arnold", "He reabierto Telnet porque el switch del almacén solo habla ese protocolo, y ya lo he subido al servidor.\n¿Está bien así? Me han dicho que Telnet era malo, pero funcionaba…");
  }

  /* ---------------- Lógica por ticket ---------------- */
  var LOGIC = {
    "GIT-01": {
      check: function () { return !!(VG.cfgGet("user.name") && VG.cfgGet("user.email")); },
      solution: ["git config --global user.name \"Linda Pérez\"", "git config --global user.email \"hamilton.perez@tecnoatlantica.local\""]
    },
    "GIT-02": {
      check: function () { return !!state.git && VG.headBranch() === "main"; },
      solution: ["git init -b main"]
    },
    "GIT-03": {
      check: function (ev) { return !!ev && ev.type === "status"; },
      solution: ["git status"]
    },
    "GIT-04": {
      check: function () { return !!state.git && VG.isIgnored("secretos.env") && VG.isIgnored("debug.log") && VG.isIgnored("otro-registro.log"); },
      solution: ["echo \"secretos.env\" > .gitignore", "echo \"*.log\" >> .gitignore"]
    },
    "GIT-05": {
      check: function () {
        if (!state.git) { return false; }
        var need = ["README.md", "firewall.sh", "servicios.conf", "backup_2019.sh", ".gitignore"];
        for (var i = 0; i < need.length; i++) { if (!has(state.git.index, need[i])) { return false; } }
        return !has(state.git.index, "secretos.env") && !has(state.git.index, "debug.log");
      },
      solution: ["git add ."]
    },
    "GIT-06": {
      check: function () { return !!VG.headHash(); },
      solution: ["git commit -m \"Versión inicial de los scripts de bastionado\""]
    },
    "GIT-07": {
      check: function (ev) { return !!ev && ev.type === "log"; },
      solution: ["git log --oneline"]
    },
    "GIT-08": {
      check: function (ev) {
        var head = VG.headTree();
        if (head && head["firewall.sh"] && !/allow\s+23\b/.test(head["firewall.sh"])) { return true; }
        return !!ev && ev.type === "diff" && ev.files.indexOf("firewall.sh") !== -1 &&
          has(state.work, "firewall.sh") && !/allow\s+23\b/.test(state.work["firewall.sh"]);
      },
      solution: ["sed -i '/allow 23/d' firewall.sh", "git diff"]
    },
    "GIT-09": {
      check: function () {
        var head = VG.headTree();
        return !!(head && head["firewall.sh"] && !/allow\s+23\b/.test(head["firewall.sh"]));
      },
      solution: ["git add firewall.sh", "git diff --staged", "git commit -m \"Elimina la regla que permitía Telnet\""]
    },
    "GIT-10": {
      check: function () { var head = VG.headTree(); return !!head && !has(head, "backup_2019.sh"); },
      solution: ["git rm backup_2019.sh", "git commit -m \"Elimina el script de copias obsoleto\""]
    },
    "GIT-11": {
      onActivate: function () {
        state.work["servicios.conf"] = "# Servicios del servidor srv-tecnoatlantica-01\nssh=activo\nhtt\n";
        bcastFrom("arnold", "¡Perdona! He abierto tu servicios.conf para mirar una cosa y le he dado a guardar sin querer. No he hecho commit, lo juro.");
      },
      check: function () {
        var head = VG.headTree();
        return !!head && state.work["servicios.conf"] === head["servicios.conf"] && state.git.index["servicios.conf"] === head["servicios.conf"];
      },
      solution: ["git restore servicios.conf"]
    },
    "GIT-12": {
      onActivate: function () {
        var dump = "-- Volcado de la tabla clientes (2026-09-14)\nINSERT INTO clientes VALUES (1, 'María Déniz', 'maria.deniz@example.com', '600123456');\nINSERT INTO clientes VALUES (2, 'Juan Rodríguez', 'juan.rodriguez@example.com', '600654321');\n";
        state.work["volcado.sql"] = dump;
        if (state.git) { state.git.index["volcado.sql"] = dump; }
        bcastFrom("arnold", "He hecho un git add . en tu terminal para adelantarte trabajo. Creo que se ha colado un volcado de la base de datos, ¿eso es malo?");
      },
      check: function () {
        var head = VG.headTree();
        return !!state.git && !has(state.git.index, "volcado.sql") && !!head && !has(head, "volcado.sql");
      },
      solution: ["git restore --staged volcado.sql", "rm volcado.sql"]
    },
    "GIT-13": {
      check: function (ev) { return !!ev && ev.type === "commit" && ev.amend && /^\[GIT-10\]/.test(VG.commitMsg(VG.headHash())); },
      react: function (ev) {
        if (ev.type === "commit" && ev.amend && !/^\[GIT-10\]/.test(VG.commitMsg(VG.headHash()))) {
          term.sys("info", "ℹ El commit se ha rehecho, pero el mensaje no empieza por [GIT-10]. Puedes volver a usar --amend.");
        }
      },
      solution: ["git commit --amend -m \"[GIT-10] Elimina el script de copias obsoleto\""]
    },
    "GIT-14": {
      onActivate: ikerWipCommits,
      check: function () {
        var f = state.work["firewall.sh"] || "";
        return VG.headHash() === state.mem.wipBase && /ufw limit 22/.test(f) && /ufw logging on/.test(f);
      },
      react: function (ev) {
        if (ev.type === "reset" && ev.mode === "hard" && VG.headHash() === state.mem.wipBase) {
          term.sys("warn", "⚠ Con --hard has descartado también los cambios de Arnold. Tranquilidad: los commits siguen en el reflog. " +
            "Mira git reflog, vuelve con git reset --hard HEAD@{1} y repite el reset sin --hard.");
        }
      },
      solution: ["git reset HEAD~2"]
    },
    "GIT-15": {
      check: function () {
        var h = VG.headHash(), c = h && state.commits[h];
        if (!c || c.parents.length !== 1 || c.parents[0] !== state.mem.wipBase) { return false; }
        var f = c.tree["firewall.sh"] || "";
        return /ufw limit 22/.test(f) && /ufw logging on/.test(f) && /^\[GIT-15\]/.test(c.msg);
      },
      solution: ["git commit -am \"[GIT-15] Limita SSH y activa el registro del cortafuegos\""]
    },
    "GIT-16": {
      check: function () { return VG.headBranch() === "endurecer-ssh"; },
      solution: ["git switch -c endurecer-ssh"]
    },
    "GIT-17": {
      check: function () {
        var t = VG.treeOf(VG.branchTip("endurecer-ssh")), m = VG.treeOf(VG.branchTip("main"));
        return !!t && /PermitRootLogin\s+no/.test(t["sshd_config"] || "") && !!m && !has(m, "sshd_config");
      },
      solution: ["echo \"PermitRootLogin no\" > sshd_config", "git add sshd_config", "git commit -m \"[GIT-17] Prohíbe el acceso de root por SSH\""]
    },
    "GIT-18": {
      onActivate: function () { state.mem.sshTip = VG.branchTip("endurecer-ssh"); },
      check: function () {
        var t = VG.treeOf(VG.branchTip("main")), s = (t && t["servicios.conf"]) || "";
        return /ftp=desactivado/.test(s) && !/ftp=activo/.test(s);
      },
      solution: ["git switch main", "sed -i 's/ftp=activo/ftp=desactivado/' servicios.conf", "git commit -am \"[GIT-18] Desactiva el FTP\""]
    },
    "GIT-19": {
      check: function (ev) { return !!ev && ev.type === "log" && ev.graph && ev.all; },
      solution: ["git log --oneline --graph --all"]
    },
    "GIT-20": {
      onActivate: function () { state.mem.sshTip = VG.branchTip("endurecer-ssh") || state.mem.sshTip; },
      check: function () {
        var m = VG.branchTip("main");
        return !!m && !!state.mem.sshTip && VG.isAncestor(state.mem.sshTip, m) && !state.git.op;
      },
      solution: ["git merge endurecer-ssh --no-edit"]
    },
    "GIT-21": {
      check: function () { return !!state.git && !has(state.git.branches, "endurecer-ssh"); },
      solution: ["git branch -d endurecer-ssh"]
    },
    "GIT-22": {
      onActivate: nayraBranch,
      check: function () {
        var m = VG.branchTip("main"), t = VG.treeOf(m);
        return !!m && !!state.mem.nayraTip && VG.isAncestor(state.mem.nayraTip, m) && !state.git.op &&
          !!t && !VG.hasMarkers(t["servicios.conf"] || "");
      },
      react: function (ev) {
        if (ev.type === "commit" && ev.merge && VG.hasMarkers((VG.treeOf(VG.headHash()) || {})["servicios.conf"] || "")) {
          term.sys("warn", "⚠ Has confirmado servicios.conf con las marcas de conflicto dentro. Edita el fichero, quita las marcas y haz un nuevo commit.");
        }
      },
      solution: [
        "git merge weaver/puertos",
        "sed -i '/^<<<<<<< /d' servicios.conf",
        "sed -i '/^=======/d' servicios.conf",
        "sed -i '/^>>>>>>> /d' servicios.conf",
        "sed -i '/ftp=desactivado/d' servicios.conf",
        "git add servicios.conf",
        "git commit --no-edit"
      ]
    },
    "GIT-23": {
      check: function () {
        return !!state.git && has(state.git.remotes, "origin") && cfg.REMOTE_URLS.indexOf(state.git.remotes.origin.url) !== -1;
      },
      solution: ["git remote add origin git@git.tecnoatlantica.local:blueteam/scripts-blindaje.git"]
    },
    "GIT-24": {
      check: function () {
        var up = state.git && state.git.upstream.main;
        return !!up && state.server.refs.main === VG.branchTip("main");
      },
      solution: ["git push -u origin main"]
    },
    "GIT-25": {
      onActivate: nayraPushAudit,
      check: function () { var m = VG.branchTip("main"); return !!m && VG.isAncestor(state.mem.auditTip, m); },
      solution: ["git fetch", "git status", "git pull"]
    },
    "GIT-26": {
      onActivate: nayraPushSilent,
      check: function () {
        var s = state.server.refs.main;
        return !!s && s === VG.branchTip("main") && VG.isAncestor(state.mem.nayra2, s) &&
          /deny\s+3389/.test(VG.treeOf(s)["firewall.sh"] || "");
      },
      react: function (ev) {
        if (ev.type === "push" && ev.rejected) {
          term.sys("info", "ℹ El servidor ha rechazado el push: tiene commits que tú no tienes (Sigourney acaba de subir algo). Intégralos primero con git pull.");
        }
      },
      solution: ["echo \"ufw deny 3389/tcp\" >> firewall.sh", "git commit -am \"[GIT-26] Bloquea el escritorio remoto\"", "git pull --rebase", "git push"]
    },
    "GIT-27": {
      onActivate: ikerPushTelnet,
      check: function () {
        var s = state.server.refs.main;
        return !!s && s === VG.branchTip("main") && VG.isAncestor(state.mem.ikerTip, s) &&
          !/allow\s+23\b/.test(VG.treeOf(s)["firewall.sh"] || "");
      },
      react: function (ev) {
        if (ev.type === "reset" && state.mem.ikerTip && VG.headHash() && !VG.isAncestor(state.mem.ikerTip, VG.headHash()) &&
            state.server.refs.main && VG.isAncestor(state.mem.ikerTip, state.server.refs.main)) {
          term.sys("info", "ℹ Has sacado el commit de Arnold de tu rama con reset, pero sigue en el servidor: al hacer push serías rechazado " +
            "(o, con --force, borrarías historia compartida). Recupéralo con git pull o git reset --hard ORIG_HEAD y usa git revert.");
        }
      },
      solution: ["git pull", "git revert HEAD --no-edit", "git push"]
    },
    "GIT-28": {
      check: function (ev, d) {
        if (!ev) { return false; }
        if (ev.type === "stash-push") { d.pushed = true; return false; }
        return ev.type === "stash-pop" && ev.ok && !!d.pushed;
      },
      solution: ["echo \"Mantenido por el Blue Team de TecnoAtlántica.\" >> README.md", "git stash", "git status", "git stash pop"]
    },
    "GIT-29": {
      check: function () { return has(state.server.tags, "v1.0"); },
      solution: ["git tag -a v1.0 -m \"Configuración aprobada tras la auditoría\"", "git push origin v1.0"]
    },
    "GIT-30": {
      check: function (ev) {
        if (!ev || ev.type !== "status") { return false; }
        var st = VG.computeStatus(), m = VG.branchTip("main");
        return VG.headBranch() === "main" && st.clean && m === state.server.refs.main && m === VG.remoteRef("origin", "main");
      },
      solution: ["git commit -am \"[GIT-30] Indica quién mantiene el repositorio\"", "git push", "git status"]
    }
  };

  /* Contenido + lógica = misiones del juego */
  VG.MISSIONS = VG.MISSION_CONTENT.map(function (m) {
    var logic = LOGIC[m.code] || {};
    var full = util.copy(m);
    full.check = logic.check || function () { return false; };
    full.onActivate = logic.onActivate;
    full.react = logic.react;
    full.solution = logic.solution || [];
    return full;
  });
})(this);
