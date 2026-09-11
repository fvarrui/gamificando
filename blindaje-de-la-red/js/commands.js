/* ==========================================================
   Órdenes de la terminal: diagnóstico (ss, netstat, ps,
   systemctl status), contención (stop, kill, ufw, iptables)
   y ambientación (ls, cat, man…).
   ========================================================== */
(function (global) {
  "use strict";
  var RG = global.RG, BD = global.BD, util = RG.util, cfg = BD.cfg;
  var state = BD.state, term = BD.term, C = BD.commands;
  var has = util.has, pad = util.pad, lpad = util.lpad;
  var pre = term.pre, line = term.line, fail = term.fail, sys = term.sys;

  function flagsOf(args) {
    var f = "";
    args.forEach(function (a) { if (/^-[a-zA-Z]+$/.test(a)) { f += a.slice(1); } });
    return f;
  }

  /* ---------------- Diagnóstico ---------------- */
  function localAddr(p, numeric) {
    var host = numeric ? p.addr : (p.addr === "127.0.0.1" ? "localhost" : "0.0.0.0");
    return host + ":" + (numeric ? p.id : p.svc);
  }
  function netstatTable(showP, numeric) {
    var rows = [
      "Active Internet connections (only servers)",
      pad("Proto", 6) + "Recv-Q Send-Q " + pad("Local Address", 24) + pad("Foreign Address", 24) +
        pad("State", 12) + (showP ? "PID/Program name" : "")
    ];
    state.ports.forEach(function (p) {
      if (p.state === "stopped") { return; }
      rows.push(pad("tcp", 6) + lpad("0", 6) + " " + lpad("0", 6) + " " + pad(localAddr(p, numeric), 24) +
        pad("0.0.0.0:*", 24) + pad("LISTEN", 12) + (showP ? p.pid + "/" + p.process : ""));
    });
    return rows.join("\n");
  }
  function ssTable(showP, numeric) {
    var rows = [
      pad("Netid", 6) + pad("State", 8) + pad("Recv-Q", 7) + pad("Send-Q", 7) +
        pad("Local Address:Port", 24) + pad("Peer Address:Port", 20) + (showP ? "Process" : "")
    ];
    state.ports.forEach(function (p) {
      if (p.state === "stopped") { return; }
      rows.push(pad("tcp", 6) + pad("LISTEN", 8) + pad("0", 7) + pad("128", 7) + pad(localAddr(p, numeric), 24) +
        pad("0.0.0.0:*", 20) + (showP ? 'users:(("' + p.process + '",pid=' + p.pid + ",fd=3))" : ""));
    });
    return rows.join("\n");
  }
  function sockets(args, name) {
    var f = flagsOf(args);
    var showP = f.indexOf("p") !== -1, numeric = f.indexOf("n") !== -1;
    pre(name === "ss" ? ssTable(showP, numeric) : netstatTable(showP, numeric));
    if (!showP) { sys("dim", "ℹ Sin la opción -p no ves qué proceso (ni qué PID) ocupa cada puerto."); }
    var filtered = state.ports.filter(function (p) { return p.state === "filtered"; })
      .map(function (p) { return p.id + "/tcp"; });
    if (filtered.length) {
      sys("dim", "ℹ Nota: " + filtered.join(", ") + " siguen en LISTEN porque el proceso sigue vivo, pero el " +
        "cortafuegos descarta el tráfico entrante (compruébalo con 'ufw status' o 'iptables -L -n').");
    }
    state.reconDone = true;
    BD.emit({ type: "sockets", cmd: name });
  }
  C.ss = function (args) { sockets(args, "ss"); };
  C.netstat = function (args) { sockets(args, "netstat"); };

  C.ps = function (args) {
    var procs = BD.SYSTEM_PROCS.map(function (s) {
      return { user: s.user, pid: s.pid, cmd: s.cmd, tty: "?", stat: "Ss", start: "sep08" };
    });
    state.ports.forEach(function (p) {
      if (p.state !== "stopped") { procs.push({ user: p.user, pid: p.pid, cmd: p.cmd, tty: "?", stat: "Ss", start: "sep08" }); }
    });
    procs.push({ user: "root", pid: cfg.SHELL_PID, cmd: "-bash", tty: "pts/0", stat: "Ss", start: "03:21" });
    procs.push({ user: "root", pid: 2107 + term.history.length, cmd: "ps " + args.join(" "), tty: "pts/0", stat: "R+",
      start: BD.fmtTime(BD.fakeNow()).slice(0, 5) });
    procs.sort(function (a, b) { return a.pid - b.pid; });
    var rows = [pad("USER", 9) + lpad("PID", 6) + " %CPU %MEM " + pad("TTY", 7) + pad("STAT", 5) + pad("START", 6) + "COMMAND"];
    procs.forEach(function (p) {
      var mem = ((p.pid % 7) / 10 + 0.1).toFixed(1);
      rows.push(pad(p.user, 9) + lpad(p.pid, 6) + "  0.0 " + lpad(mem, 4) + " " + pad(p.tty, 7) + pad(p.stat, 5) + pad(p.start, 6) + p.cmd);
    });
    pre(rows.join("\n"));
    if (!state.reconDone) {
      sys("info", "ℹ ps muestra procesos, pero no puertos. Para saber qué escucha en la red usa 'ss -tulpn' o 'netstat -tulpn'.");
    }
  };

  /* ---------------- Contención ---------------- */
  function statusBlock(p, unit) {
    var running = p.state !== "stopped";
    var rows = [
      (running ? "● " : "○ ") + unit + ".service - " + p.process,
      "     Loaded: loaded (/usr/lib/systemd/system/" + unit + ".service; " + (p.disabled ? "disabled" : "enabled") + "; preset: enabled)",
      "     Active: " + (running
        ? "active (running) since mar 2026-09-08 20:41:12 UTC; 1 day 6h ago"
        : "inactive (dead) since " + BD.fmtDate(BD.fakeNow()))
    ];
    if (running) { rows.push("   Main PID: " + p.pid + " (" + p.process + ")"); }
    return rows.join("\n");
  }

  C.systemctl = function (args) {
    var sub = (args[0] || "").toLowerCase();
    var now = args.indexOf("--now") !== -1;
    var names = args.slice(1).filter(function (a) { return a.charAt(0) !== "-"; });
    var unit = (names[0] || "").replace(/\.(service|socket)$/i, "").toLowerCase();
    var verbs = ["stop", "disable", "status", "start", "restart", "enable", "is-active"];

    if (!sub) { fail("systemctl: falta la orden. Uso: systemctl stop|disable|status <servicio>"); return; }
    if (verbs.indexOf(sub) === -1) { fail("Unknown command verb '" + sub + "'."); return; }
    if (!unit) { fail("Too few arguments."); return; }

    var p = BD.findPortByAlias(unit);
    if (sub === "status" || sub === "is-active") {
      if (!p) { fail("Unit " + unit + ".service could not be found."); return; }
      if (sub === "status") { pre(statusBlock(p, unit)); }
      else { line("text", p.state === "stopped" ? "inactive" : "active"); }
      return;
    }
    if (BD.needsRecon()) { return; }
    if (!p) { fail("Failed to " + sub + " " + unit + ".service: Unit " + unit + ".service not loaded."); return; }

    if (sub === "start" || sub === "restart" || sub === "enable") {
      line("info", "ℹ En esta operación solo se evalúan acciones de contención; '" + sub + "' no se aplica.");
      return;
    }
    if (sub === "disable") {
      var wasDisabled = p.disabled;
      p.disabled = true;
      line("text", "Synchronizing state of " + unit + ".service with SysV service script with /usr/lib/systemd/systemd-sysv-install.");
      if (!wasDisabled) { line("text", "Removed \"/etc/systemd/system/multi-user.target.wants/" + unit + ".service\"."); }
      if (now) { BD.secure(p, { label: "systemctl disable --now " + unit, family: "systemctl" }, "stopped"); }
      else if (p.state !== "stopped") {
        sys("info", "ℹ disable solo evita que " + unit + " arranque en el próximo reinicio: ahora mismo sigue en marcha. " +
          "Usa 'systemctl stop " + unit + "' o 'systemctl disable --now " + unit + "'.");
      }
      return;
    }
    // stop: como en un systemd real, no imprime nada si tiene éxito
    BD.secure(p, { label: "systemctl stop " + unit, family: "systemctl" }, "stopped");
  };

  C.service = function (args) {
    var unit = (args[0] || "").toLowerCase(), sub = (args[1] || "").toLowerCase();
    if (!unit || !sub) { fail("Usage: service < option > | --status-all | [ service_name [ command | --full-restart ] ]"); return; }
    var p = BD.findPortByAlias(unit);
    if (!p) { fail(unit + ": unrecognized service"); return; }
    if (sub === "status") { pre(statusBlock(p, unit)); return; }
    if (sub !== "stop") { line("info", "ℹ En esta operación solo 'stop' tiene efecto."); return; }
    if (BD.needsRecon()) { return; }
    BD.secure(p, { label: "service " + unit + " stop", family: "service" }, "stopped");
  };

  C.kill = function (args) {
    var pidTok = null, sig = "";
    args.forEach(function (a) {
      if (/^\d+$/.test(a)) { pidTok = a; } else if (a.charAt(0) === "-") { sig = a; }
    });
    if (pidTok === null) { fail("kill: uso: kill [-s señal | -n numseñal | -señal] pid"); return; }
    if (BD.needsRecon()) { return; }
    var pid = parseInt(pidTok, 10);
    var p = BD.findLivePortByPid(pid);
    if (p) {
      BD.secure(p, { label: "kill " + (sig ? sig + " " : "") + pid, family: "kill" }, "stopped");
      return;   // kill no imprime nada cuando tiene éxito
    }
    if (pid === cfg.SHELL_PID) {
      line("warn", "⚠ Ese PID es tu propia sesión de bash. Mejor no te desconectes en mitad del incidente.");
      return;
    }
    for (var i = 0; i < BD.SYSTEM_PROCS.length; i++) {
      if (BD.SYSTEM_PROCS[i].pid === pid) {
        line("warn", "⚠ " + BD.SYSTEM_PROCS[i].cmd + " es un proceso del sistema operativo y no abre ningún puerto: no tiene que ver con el incidente.");
        return;
      }
    }
    fail("bash: kill: (" + pid + ") - No existe el proceso");
  };

  function ufwStatus() {
    var rows = ["Status: active"];
    if (state.fwRules.some(function (r) { return r.tool === "ufw"; })) {
      rows.push("", pad("To", 27) + pad("Action", 12) + "From", pad("--", 27) + pad("------", 12) + "----");
      var v6 = [];
      state.fwRules.forEach(function (r) {
        if (r.tool !== "ufw") { return; }
        rows.push(pad(r.spec, 27) + pad(r.action.toUpperCase(), 12) + "Anywhere");
        v6.push(pad(r.spec + " (v6)", 27) + pad(r.action.toUpperCase(), 12) + "Anywhere (v6)");
      });
      rows = rows.concat(v6);
    }
    pre(rows.join("\n"));
  }

  C.ufw = function (args) {
    var sub = (args[0] || "").toLowerCase();
    if (sub === "status") { ufwStatus(); return; }
    if (sub === "enable") { line("text", "Firewall is active and enabled on system startup"); return; }
    if (sub === "disable") {
      line("info", "ℹ Desactivar el cortafuegos en mitad de un incidente no es buena idea: la orden no se aplica.");
      return;
    }
    if (["deny", "reject", "allow", "limit"].indexOf(sub) === -1) {
      fail("ERROR: Invalid syntax");
      line("dim", "Uso: ufw deny <puerto>[/tcp] · ufw status");
      return;
    }
    var spec = args[1] || "";
    var m = /^(\d+)(\/(tcp|udp))?$/i.exec(spec);
    if (!m) { fail("ERROR: Bad port"); return; }
    var blocking = sub === "deny" || sub === "reject";
    if (blocking && BD.needsRecon()) { return; }
    var portNum = parseInt(m[1], 10);
    var exists = state.fwRules.some(function (r) { return r.tool === "ufw" && r.spec === spec && r.action === sub; });
    if (exists) {
      line("text", "Skipping adding existing rule");
      line("text", "Skipping adding existing rule (v6)");
      return;
    }
    state.fwRules.push({ tool: "ufw", spec: spec, port: portNum, action: sub });
    line("text", "Rule added");
    line("text", "Rule added (v6)");
    if (blocking) {
      var p = BD.findPort(portNum);
      if (p) { BD.secure(p, { label: "ufw " + sub + " " + spec, family: "ufw" }, "filtered"); }
    }
  };

  function iptablesList() {
    var rows = ["Chain INPUT (policy ACCEPT)", pad("target", 11) + pad("prot", 5) + pad("opt", 4) + pad("source", 21) + "destination"];
    state.fwRules.forEach(function (r) {
      if (r.tool !== "iptables") { return; }
      rows.push(pad(r.action, 11) + pad("tcp", 5) + pad("--", 4) + pad("0.0.0.0/0", 21) + pad("0.0.0.0/0", 21) + "tcp dpt:" + r.port);
    });
    rows.push("", "Chain FORWARD (policy ACCEPT)", pad("target", 11) + pad("prot", 5) + pad("opt", 4) + pad("source", 21) + "destination");
    rows.push("", "Chain OUTPUT (policy ACCEPT)", pad("target", 11) + pad("prot", 5) + pad("opt", 4) + pad("source", 21) + "destination");
    pre(rows.join("\n"));
  }

  C.iptables = function (args) {
    var joined = args.join(" ");
    if (/(^|\s)-[a-zA-Z]*L[a-zA-Z]*(\s|$)|--list/.test(joined)) { iptablesList(); return; }
    var dport = /--dport\s+(\d+)/i.exec(joined);
    var jump = /-j\s+(DROP|REJECT|ACCEPT)/i.exec(joined);
    var chain = /-(A|I)\s+INPUT/i.test(joined);
    if (!dport || !jump || !chain) {
      fail("iptables: sintaxis no reconocida en esta simulación.");
      line("dim", "Uso: iptables -A INPUT -p tcp --dport <puerto> -j DROP · iptables -L -n");
      return;
    }
    var action = jump[1].toUpperCase();
    if (action !== "ACCEPT" && BD.needsRecon()) { return; }
    var portNum = parseInt(dport[1], 10);
    state.fwRules.push({ tool: "iptables", port: portNum, action: action });
    if (action !== "ACCEPT") {
      var p = BD.findPort(portNum);
      if (p) { BD.secure(p, { label: "iptables --dport " + portNum + " -j " + action, family: "iptables" }, "filtered"); }
    }
    // iptables no imprime nada cuando tiene éxito
  };

  /* ---------------- Ambientación ---------------- */
  C.ls = function (args) {
    var f = flagsOf(args);
    var all = f.indexOf("a") !== -1, long = f.indexOf("l") !== -1;
    if (long && all) { pre(BD.LS_LA); }
    else if (all) { line("text", ".  ..  .bash_history  .bashrc  .ssh  informe_incidente.txt"); }
    else if (long) { pre("total 4\n-rw-r--r-- 1 root root 548 sep 10 03:16 informe_incidente.txt"); }
    else { line("text", "informe_incidente.txt"); }
  };

  C.cat = function (args) {
    if (!args.length) { fail("cat: falta un operando"); return; }
    args.forEach(function (a) {
      var name = a.replace(/^\.\//, "").replace(/^\/root\//, "").replace(/^~\//, "");
      if (has(BD.FILES, name)) { pre(BD.FILES[name]); }
      else if (name === ".ssh") { fail("cat: .ssh: Es un directorio"); }
      else { fail("cat: " + a + ": No existe el fichero o el directorio"); }
    });
  };

  C.man = function (args) {
    var topic = (args[0] || "").toLowerCase();
    if (!topic) { fail("¿Qué página de manual desea? Por ejemplo: man ss"); return; }
    if (!BD.MAN[topic]) { fail("No existe entrada de manual para " + topic); return; }
    state.usedMan = true;
    RG.man.render(term, topic, BD.MAN[topic]);
  };

  C.history = function () {
    pre(term.history.map(function (c, i) { return lpad(i + 1, 5) + "  " + c; }).join("\n"));
  };

  C.help = C.ayuda = function () {
    pre([
      "Comandos disponibles en esta sesión:",
      "",
      "  Diagnóstico   ss, netstat, ps, systemctl status <servicio>",
      "  Contención    systemctl stop|disable --now <servicio>, service <servicio> stop,",
      "                kill [-9] <PID>, ufw deny <puerto>, iptables -A INPUT ... -j DROP",
      "  Consulta      ufw status, iptables -L -n, man <comando>, history",
      "  Sistema       ls, cat, whoami, id, uname, hostname, pwd, date, uptime, clear, exit",
      "",
      "Encadena con && o ; y filtra con | grep <patrón>.",
      "Pulsa «❓ Ayuda» en la barra superior para ver la guía completa."
    ].join("\n"));
  };

  C.exit = C.logout = function () {
    line("text", "logout");
    line("text", "Connection to " + cfg.IP + " closed.");
    state.reopening = true;
    term.setLocked(true);
    BD.timers.later(function () { BD.echoLocal("ssh root@" + cfg.IP); }, 700);
    BD.timers.later(function () { line("warn", "El SOC necesita que sigas conectado mientras dure el incidente. Reconectando…"); }, 1300);
    BD.timers.later(function () {
      line("ok", "Autenticación por clave pública aceptada. Sesión restaurada.");
      state.reopening = false;
      term.setLocked(false);
    }, 2100);
  };

  C.whoami = function () { line("text", "root"); };
  C.id = function () { line("text", "uid=0(root) gid=0(root) grupos=0(root)"); };
  C.hostname = function (args) { line("text", args[0] === "-I" ? cfg.IP : cfg.HOSTNAME); };
  C.pwd = function () { line("text", "/root"); };
  C.cd = function () {};
  C.echo = function (args) { line("text", args.join(" ")); };
  C.date = function () { line("text", BD.fmtDate(BD.fakeNow())); };
  C.uptime = function () {
    line("text", " " + BD.fmtTime(BD.fakeNow()) + " up 2 days,  6:41,  1 user,  load average: 0.18, 0.25, 0.31");
  };
  C.uname = function (args) {
    line("text", flagsOf(args).indexOf("a") !== -1
      ? "Linux " + cfg.HOSTNAME + " 6.8.0-45-generic #45-Ubuntu SMP PREEMPT_DYNAMIC Fri Aug 30 12:02:04 UTC 2024 x86_64 x86_64 x86_64 GNU/Linux"
      : "Linux");
  };
  C.clear = function () { term.clear(); };
  C.grep = function () { fail("grep: úsalo detrás de una tubería, por ejemplo: ss -tulpn | grep 80"); };
  C.sudo = function (args) {
    if (!args.length) { fail("uso: sudo <orden>"); return; }
    var fn = BD.commands[args[0]];
    if (fn) { fn(args.slice(1), args[0]); } else { fail("bash: " + args[0] + ": orden no encontrada"); }
  };

  /* ---------------- Autocompletado ---------------- */
  BD.completion = function (parts) {
    if (parts.length === 1) { return BD.COMMANDS; }
    var c = parts[0].toLowerCase();
    if (c === "cat") { return Object.keys(BD.FILES); }
    if (c === "man") { return Object.keys(BD.MAN); }
    if (c === "ufw" && parts.length === 2) { return ["deny", "reject", "status"]; }
    if (c === "systemctl" && parts.length === 2) { return ["stop", "disable", "status", "is-active"]; }
    if ((c === "systemctl" && parts.length >= 3) || (c === "service" && parts.length === 2)) {
      return state.ports.map(function (p) { return p.aliases[0]; });
    }
    return [];
  };
})(this);
