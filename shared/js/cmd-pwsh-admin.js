/* ==========================================================
   RG.PwshAdminCommands · Administración con PowerShell
   Cuentas y grupos locales, servicios y procesos. Se apoya en
   RG.System y emite objetos, como los cmdlets de verdad.
   ========================================================== */
(function (global) {
  "use strict";
  var RG = global.RG, util = RG.util;
  var P = RG.psArgs;

  var STATE = { running: "Running", stopped: "Stopped", failed: "Stopped" };
  var STARTUP = { auto: "Automatic", manual: "Manual", disabled: "Disabled" };
  var STARTUP_IN = { automatic: "auto", auto: "auto", manual: "manual", disabled: "disabled" };

  RG.PwshAdminCommands = function (ctx) {
    var term = ctx.term, sys = ctx.sys;
    var pre = term.pre, fail = term.fail;
    var C = {};

    function user() { return ctx.user(); }
    function emit(ev) { if (ctx.emit) { ctx.emit(ev); } }
    function out(objects) { ctx.shell.emit(objects); }
    function isAdmin() {
      var u = user();
      return (u.groups || []).indexOf("Administradores") !== -1 || u.name === "Administrador";
    }
    /* Casi todo lo de administración necesita una consola con privilegios */
    function needAdmin(cmd) {
      if (isAdmin()) { return false; }
      fail(cmd + " : Acceso denegado.");
      term.note("Esta operación requiere elevación: abre PowerShell como administrador.");
      return true;
    }
    function findUser(name) {
      if (!name) { return null; }
      var key = Object.keys(sys.users).filter(function (n) { return n.toLowerCase() === String(name).toLowerCase(); })[0];
      return key ? sys.users[key] : null;
    }
    function findGroup(name) {
      if (!name) { return null; }
      var key = Object.keys(sys.groups).filter(function (n) { return n.toLowerCase() === String(name).toLowerCase(); })[0];
      return key ? sys.groups[key] : null;
    }
    function userObject(u) {
      return {
        Name: u.name,
        Enabled: u.enabled && !u.locked,
        Description: u.comment || "",
        __user: u
      };
    }
    function groupObject(g) {
      return { Name: g.name, Description: g.description || "", __group: g };
    }
    function serviceObject(s) {
      return {
        Status: STATE[s.state] || "Stopped",
        Name: s.name,
        DisplayName: s.display,
        StartType: STARTUP[s.startup] || "Manual",
        __service: s
      };
    }

    /* ==========================================================
       Cuentas locales
       ========================================================== */
    C["Get-LocalUser"] = function (args) {
      var o = P(args, { Name: "v" }, ["Name"]);
      var names = util.sortedKeys(sys.users);
      if (o.Name) {
        var re = util.globToRe(String(o.Name).toLowerCase());
        names = names.filter(function (n) { return re.test(n.toLowerCase()); });
        if (!names.length) {
          fail("Get-LocalUser : No se encontró un usuario con el nombre '" + o.Name + "'.");
          return;
        }
      }
      out(names.map(function (n) { return userObject(sys.users[n]); }));
      emit({ type: "get-user", name: o.Name || null });
    };
    C["New-LocalUser"] = function (args) {
      var o = P(args, {
        Name: "v", Description: "v", FullName: "v", Password: "v",
        NoPassword: "s", AccountNeverExpires: "s", PasswordNeverExpires: "s", UserMayNotChangePassword: "s"
      }, ["Name"]);
      if (o.bad) { fail("New-LocalUser : No se encuentra ningún parámetro que coincida con '" + o.bad.slice(1) + "'."); return; }
      if (needAdmin("New-LocalUser")) { return; }
      if (!o.Name) { fail("New-LocalUser : Falta el parámetro obligatorio -Name."); return; }
      if (findUser(o.Name)) { fail("New-LocalUser : La cuenta '" + o.Name + "' ya existe."); return; }
      if (!o.Password && !o.NoPassword) {
        fail("New-LocalUser : Indica una contraseña con -Password o usa -NoPassword.");
        return;
      }
      var u = sys.addUser({
        name: o.Name,
        comment: o.Description || o.FullName || "",
        home: "C:\\Users\\" + o.Name,
        shell: "powershell",
        password: o.NoPassword ? null : (o.Password || "*"),
        group: "Usuarios"
      });
      sys.addMember("Usuarios", u.name);
      out([userObject(u)]);
      emit({ type: "useradd", name: u.name });
    };
    C["Set-LocalUser"] = function (args) {
      var o = P(args, { Name: "v", Description: "v", Password: "v", FullName: "v" }, ["Name"]);
      if (needAdmin("Set-LocalUser")) { return; }
      var u = findUser(o.Name);
      if (!u) { fail("Set-LocalUser : No se encontró un usuario con el nombre '" + o.Name + "'."); return; }
      if (o.Description !== undefined) { u.comment = o.Description; }
      if (o.Password !== undefined) { u.password = o.Password; }
      emit({ type: "usermod", name: u.name, description: o.Description });
    };
    function setEnabled(cmd, args, enabled) {
      var o = P(args, { Name: "v" }, ["Name"]);
      if (needAdmin(cmd)) { return; }
      var u = findUser(o.Name);
      if (!u) { fail(cmd + " : No se encontró un usuario con el nombre '" + o.Name + "'."); return; }
      u.enabled = enabled;
      u.locked = !enabled;
      emit({ type: enabled ? "user-enable" : "user-disable", name: u.name });
    }
    C["Enable-LocalUser"] = function (args) { setEnabled("Enable-LocalUser", args, true); };
    C["Disable-LocalUser"] = function (args) { setEnabled("Disable-LocalUser", args, false); };
    C["Remove-LocalUser"] = function (args) {
      var o = P(args, { Name: "v" }, ["Name"]);
      if (needAdmin("Remove-LocalUser")) { return; }
      var u = findUser(o.Name);
      if (!u) { fail("Remove-LocalUser : No se encontró un usuario con el nombre '" + o.Name + "'."); return; }
      if (u.name === user().name) { fail("Remove-LocalUser : No puedes eliminar la cuenta con la que has iniciado sesión."); return; }
      sys.delUser(u.name);
      emit({ type: "userdel", name: u.name });
    };

    /* ==========================================================
       Grupos locales
       ========================================================== */
    C["Get-LocalGroup"] = function (args) {
      var o = P(args, { Name: "v" }, ["Name"]);
      var names = util.sortedKeys(sys.groups);
      if (o.Name) {
        var re = util.globToRe(String(o.Name).toLowerCase());
        names = names.filter(function (n) { return re.test(n.toLowerCase()); });
        if (!names.length) { fail("Get-LocalGroup : No se encontró un grupo con el nombre '" + o.Name + "'."); return; }
      }
      out(names.map(function (n) { return groupObject(sys.groups[n]); }));
      emit({ type: "get-group", name: o.Name || null });
    };
    C["New-LocalGroup"] = function (args) {
      var o = P(args, { Name: "v", Description: "v" }, ["Name"]);
      if (needAdmin("New-LocalGroup")) { return; }
      if (!o.Name) { fail("New-LocalGroup : Falta el parámetro obligatorio -Name."); return; }
      if (findGroup(o.Name)) { fail("New-LocalGroup : El grupo '" + o.Name + "' ya existe."); return; }
      var g = sys.addGroup({ name: o.Name, description: o.Description || "" });
      out([groupObject(g)]);
      emit({ type: "groupadd", name: g.name });
    };
    C["Remove-LocalGroup"] = function (args) {
      var o = P(args, { Name: "v" }, ["Name"]);
      if (needAdmin("Remove-LocalGroup")) { return; }
      var g = findGroup(o.Name);
      if (!g) { fail("Remove-LocalGroup : No se encontró un grupo con el nombre '" + o.Name + "'."); return; }
      sys.delGroup(g.name);
      emit({ type: "groupdel", name: g.name });
    };
    C["Get-LocalGroupMember"] = function (args) {
      var o = P(args, { Group: "v", Member: "v" }, ["Group"]);
      var g = findGroup(o.Group);
      if (!g) { fail("Get-LocalGroupMember : No se encontró un grupo con el nombre '" + o.Group + "'."); return; }
      out(g.members.slice().sort().map(function (m) {
        return { ObjectClass: "Usuario", Name: (ctx.host ? ctx.host() + "\\" : "") + m, PrincipalSource: "Local" };
      }));
      emit({ type: "group-members", group: g.name });
    };
    C["Add-LocalGroupMember"] = function (args) {
      var o = P(args, { Group: "v", Member: "v" }, ["Group", "Member"]);
      if (needAdmin("Add-LocalGroupMember")) { return; }
      var g = findGroup(o.Group);
      if (!g) { fail("Add-LocalGroupMember : No se encontró un grupo con el nombre '" + o.Group + "'."); return; }
      var members = String(o.Member || "").split(",").map(function (m) { return m.trim(); }).filter(Boolean);
      if (!members.length) { fail("Add-LocalGroupMember : Falta el parámetro obligatorio -Member."); return; }
      members.forEach(function (name) {
        var u = findUser(name.replace(/^.*\\/, ""));
        if (!u) { fail("Add-LocalGroupMember : No se encontró un usuario con el nombre '" + name + "'."); return; }
        if (sys.inGroup(u.name, g.name)) {
          fail("Add-LocalGroupMember : El usuario '" + u.name + "' ya es miembro del grupo '" + g.name + "'.");
          return;
        }
        sys.addMember(g.name, u.name);
        emit({ type: "group-add", group: g.name, user: u.name });
      });
    };
    C["Remove-LocalGroupMember"] = function (args) {
      var o = P(args, { Group: "v", Member: "v" }, ["Group", "Member"]);
      if (needAdmin("Remove-LocalGroupMember")) { return; }
      var g = findGroup(o.Group);
      if (!g) { fail("Remove-LocalGroupMember : No se encontró un grupo con el nombre '" + o.Group + "'."); return; }
      var name = String(o.Member || "").replace(/^.*\\/, "");
      if (!sys.removeMember(g.name, name)) {
        fail("Remove-LocalGroupMember : '" + name + "' no es miembro del grupo '" + g.name + "'.");
        return;
      }
      emit({ type: "group-remove", group: g.name, user: name });
    };

    /* ==========================================================
       Servicios
       ========================================================== */
    function findService(name) {
      if (!name) { return null; }
      var s = sys.service(name);
      if (s) { return s; }
      var key = Object.keys(sys.services).filter(function (n) { return n.toLowerCase() === String(name).toLowerCase(); })[0];
      return key ? sys.services[key] : null;
    }
    C["Get-Service"] = function (args) {
      var o = P(args, { Name: "v", DisplayName: "v", Include: "v", Exclude: "v" }, ["Name"]);
      if (o.bad) { fail("Get-Service : No se encuentra ningún parámetro que coincida con '" + o.bad.slice(1) + "'."); return; }
      var names = util.sortedKeys(sys.services);
      if (o.Name) {
        var re = util.globToRe(String(o.Name).toLowerCase());
        names = names.filter(function (n) {
          return re.test(n.toLowerCase()) || re.test(sys.services[n].display.toLowerCase());
        });
        if (!names.length) {
          fail("Get-Service : No se encuentra ningún servicio con el nombre de servicio '" + o.Name + "'.");
          return;
        }
      }
      if (o.DisplayName) {
        var red = util.globToRe(String(o.DisplayName).toLowerCase());
        names = names.filter(function (n) { return red.test(sys.services[n].display.toLowerCase()); });
      }
      out(names.map(function (n) { return serviceObject(sys.services[n]); }));
      emit({ type: "service-list", name: o.Name || null });
    };
    C["Start-Service"] = function (args) {
      var o = P(args, { Name: "v", PassThru: "s" }, ["Name"]);
      if (needAdmin("Start-Service")) { return; }
      var s = findService(o.Name);
      if (!s) { fail("Start-Service : No se encuentra ningún servicio con el nombre de servicio '" + o.Name + "'."); return; }
      if (s.startup === "disabled") {
        fail("Start-Service : No se puede iniciar el servicio '" + s.display + "' en el equipo '.'.");
        term.note("El servicio está deshabilitado. Cambia su tipo de inicio con Set-Service -StartupType Manual|Automatic.");
        emit({ type: "service-start", name: s.name, refused: true, reason: "disabled" });
        return;
      }
      if (s.state === "running") { emit({ type: "service-start", name: s.name, already: true }); return; }
      sys.start(s.name);
      if (s.state === "failed") {
        fail("Start-Service : No se puede iniciar el servicio '" + s.display + "' en el equipo '.'.");
        if (s.failReason) { term.note(s.failReason); }
        return;
      }
      if (o.PassThru) { out([serviceObject(s)]); }
      emit({ type: "service-start", name: s.name });
    };
    C["Stop-Service"] = function (args) {
      var o = P(args, { Name: "v", Force: "s", PassThru: "s" }, ["Name"]);
      if (needAdmin("Stop-Service")) { return; }
      var s = findService(o.Name);
      if (!s) { fail("Stop-Service : No se encuentra ningún servicio con el nombre de servicio '" + o.Name + "'."); return; }
      sys.stop(s.name);
      if (o.PassThru) { out([serviceObject(s)]); }
      emit({ type: "service-stop", name: s.name });
    };
    C["Restart-Service"] = function (args) {
      var o = P(args, { Name: "v", Force: "s", PassThru: "s" }, ["Name"]);
      if (needAdmin("Restart-Service")) { return; }
      var s = findService(o.Name);
      if (!s) { fail("Restart-Service : No se encuentra ningún servicio con el nombre de servicio '" + o.Name + "'."); return; }
      sys.stop(s.name);
      sys.start(s.name);
      if (s.state === "failed") {
        fail("Restart-Service : No se puede iniciar el servicio '" + s.display + "' en el equipo '.'.");
        if (s.failReason) { term.note(s.failReason); }
        return;
      }
      if (o.PassThru) { out([serviceObject(s)]); }
      emit({ type: "service-restart", name: s.name });
    };
    C["Set-Service"] = function (args) {
      var o = P(args, { Name: "v", StartupType: "v", Status: "v", Description: "v", DisplayName: "v" }, ["Name"]);
      if (o.bad) { fail("Set-Service : No se encuentra ningún parámetro que coincida con '" + o.bad.slice(1) + "'."); return; }
      if (needAdmin("Set-Service")) { return; }
      var s = findService(o.Name);
      if (!s) { fail("Set-Service : No se encuentra ningún servicio con el nombre de servicio '" + o.Name + "'."); return; }
      if (o.StartupType) {
        var v = STARTUP_IN[String(o.StartupType).toLowerCase()];
        if (!v) {
          fail("Set-Service : No se puede convertir '" + o.StartupType + "' en un tipo de inicio. Usa Automatic, Manual o Disabled.");
          return;
        }
        s.startup = v;
        emit({ type: "service-startup", name: s.name, startup: v });
      }
      if (o.Description) { s.description = o.Description; }
      if (o.DisplayName) { s.display = o.DisplayName; }
      if (o.Status) {
        var st = String(o.Status).toLowerCase();
        if (st === "running") { C["Start-Service"]([s.name]); }
        else if (st === "stopped") { C["Stop-Service"]([s.name]); }
      }
    };

    /* ==========================================================
       Procesos
       ========================================================== */
    C["Get-Process"] = function (args) {
      var o = P(args, { Name: "v", Id: "v" }, ["Name"]);
      /* El nombre del proceso es el del ejecutable, no el del servicio */
      var list = sys.processList().map(function (p) {
        var exe = String(p.cmd || "").split(/\s+/)[0].split(/[\\/]/).pop().replace(/\.exe$/i, "");
        return { Id: p.pid, ProcessName: exe || p.name, WS: (p.pid * 7 % 900 + 100) * 1024, __proc: p };
      });
      if (o.Name) {
        var re = util.globToRe(String(o.Name).toLowerCase());
        list = list.filter(function (p) { return re.test(String(p.ProcessName).toLowerCase()); });
        if (!list.length) { fail("Get-Process : No se encuentra ningún proceso con el nombre '" + o.Name + "'."); return; }
      }
      if (o.Id) { list = list.filter(function (p) { return String(p.Id) === String(o.Id); }); }
      out(list);
      emit({ type: "ps", name: o.Name || null });
    };
    C["Stop-Process"] = function (args) {
      var o = P(args, { Id: "v", Name: "v", Force: "s" }, ["Id"]);
      if (needAdmin("Stop-Process")) { return; }
      var target = null;
      Object.keys(sys.services).forEach(function (n) {
        var s = sys.services[n];
        if (s.state !== "running") { return; }
        if (o.Id && String(s.pid) === String(o.Id)) { target = s; }
        if (o.Name && s.name.toLowerCase() === String(o.Name).toLowerCase()) { target = s; }
      });
      if (!target) { fail("Stop-Process : No se encuentra ningún proceso con el identificador '" + (o.Id || o.Name) + "'."); return; }
      sys.stop(target.name);
      emit({ type: "kill", name: target.name });
    };

    /* ==========================================================
       Herramientas clásicas: net y sc
       ========================================================== */
    C.net = function (args) {
      var sub = String(args[0] || "").toLowerCase();
      if (sub === "user") { return netUser(args.slice(1)); }
      if (sub === "localgroup") { return netLocalGroup(args.slice(1)); }
      if (sub === "start" || sub === "stop") { return netService(sub, args.slice(1)); }
      fail("Sintaxis de este comando:\n\nNET [ USER | LOCALGROUP | START | STOP ]");
    };
    function netUser(args) {
      if (!args.length) {
        pre("");
        pre("Cuentas de usuario de " + (ctx.host ? "\\\\" + ctx.host() : "\\\\EQUIPO"));
        pre("");
        pre("-------------------------------------------------------------------------------");
        pre(util.sortedKeys(sys.users).join("  "));
        pre("Se ha completado el comando correctamente.");
        pre("");
        emit({ type: "get-user", tool: "net" });
        return;
      }
      var name = args[0];
      var u = findUser(name);
      if (args.indexOf("/delete") !== -1 || args.indexOf("/DELETE") !== -1) {
        if (needAdmin("net user")) { return; }
        if (!u) { fail("No se ha encontrado el nombre de usuario."); return; }
        sys.delUser(u.name);
        pre("Se ha completado el comando correctamente.");
        emit({ type: "userdel", name: u.name, tool: "net" });
        return;
      }
      if (args.indexOf("/add") !== -1 || args.indexOf("/ADD") !== -1) {
        if (needAdmin("net user")) { return; }
        if (u) { fail("La cuenta de usuario ya existe."); return; }
        var nu = sys.addUser({ name: name, home: "C:\\Users\\" + name, shell: "powershell", group: "Usuarios", password: args[1] || "*" });
        sys.addMember("Usuarios", nu.name);
        pre("Se ha completado el comando correctamente.");
        emit({ type: "useradd", name: nu.name, tool: "net" });
        return;
      }
      if (!u) { fail("No se ha encontrado el nombre de usuario."); return; }
      pre("Nombre de usuario                    " + u.name);
      pre("Nombre completo                      " + (u.comment || ""));
      pre("Cuenta activa                        " + (u.enabled && !u.locked ? "Sí" : "No"));
      pre("Miembros de grupos locales           " + sys.userGroups(u.name).map(function (g) { return "*" + g; }).join("  "));
      pre("Se ha completado el comando correctamente.");
      emit({ type: "get-user", name: u.name, tool: "net" });
    }
    function netLocalGroup(args) {
      if (!args.length) {
        pre("");
        pre("Alias de " + (ctx.host ? "\\\\" + ctx.host() : "\\\\EQUIPO"));
        pre("");
        pre("-------------------------------------------------------------------------------");
        util.sortedKeys(sys.groups).forEach(function (g) { pre("*" + g); });
        pre("Se ha completado el comando correctamente.");
        pre("");
        emit({ type: "get-group", tool: "net" });
        return;
      }
      var g = findGroup(args[0]);
      var add = args.indexOf("/add") !== -1 || args.indexOf("/ADD") !== -1;
      var del = args.indexOf("/delete") !== -1 || args.indexOf("/DELETE") !== -1;
      if (!g && add && args.length === 2) {
        if (needAdmin("net localgroup")) { return; }
        sys.addGroup({ name: args[0] });
        pre("Se ha completado el comando correctamente.");
        emit({ type: "groupadd", name: args[0], tool: "net" });
        return;
      }
      if (!g) { fail("No existe el grupo local especificado."); return; }
      if (args.length >= 3 && (add || del)) {
        if (needAdmin("net localgroup")) { return; }
        var member = args[1].replace(/^.*\\/, "");
        if (add) {
          if (!findUser(member)) { fail("No se ha encontrado el nombre de usuario."); return; }
          sys.addMember(g.name, member);
          emit({ type: "group-add", group: g.name, user: member, tool: "net" });
        } else {
          sys.removeMember(g.name, member);
          emit({ type: "group-remove", group: g.name, user: member, tool: "net" });
        }
        pre("Se ha completado el comando correctamente.");
        return;
      }
      pre("Nombre del alias     " + g.name);
      pre("Comentario           " + (g.description || ""));
      pre("");
      pre("Miembros");
      pre("");
      pre("-------------------------------------------------------------------------------");
      g.members.slice().sort().forEach(function (m) { pre(m); });
      pre("Se ha completado el comando correctamente.");
      emit({ type: "group-members", group: g.name, tool: "net" });
    }
    function netService(sub, args) {
      var s = findService(args.join(" "));
      if (!s) { fail("No se ha iniciado el servicio.\n\nEl nombre de servicio no es válido."); return; }
      if (needAdmin("net " + sub)) { return; }
      if (sub === "start") {
        if (s.state === "running") {
          fail("Se ha producido un error del sistema 1056.");
          fail("");
          fail("Ya hay una instancia del servicio en ejecución.");
          return;
        }
        if (s.startup === "disabled") {
          fail("Se ha producido un error del sistema 1058.");
          fail("");
          fail("No se puede iniciar el servicio porque está deshabilitado o porque no tiene dispositivos habilitados asociados.");
          emit({ type: "service-start", name: s.name, refused: true, reason: "disabled", tool: "net" });
          return;
        }
        sys.start(s.name);
        if (s.state === "failed") { fail("El servicio " + s.display + " no se ha podido iniciar."); return; }
        pre("El servicio " + s.display + " se ha iniciado correctamente.");
        emit({ type: "service-start", name: s.name, tool: "net" });
      } else {
        if (s.state !== "running") {
          fail("Se ha producido un error del sistema 3521.");
          fail("");
          fail("El servicio " + s.display + " no se ha iniciado.");
          emit({ type: "service-stop", name: s.name, tool: "net", already: true });
          return;
        }
        sys.stop(s.name);
        pre("El servicio " + s.display + " se ha detenido correctamente.");
        emit({ type: "service-stop", name: s.name, tool: "net" });
      }
    }
    C.sc = function (args) {
      var sub = String(args[0] || "").toLowerCase();
      var s = findService(args[1]);
      if (sub === "query") {
        if (!s) { fail("[SC] EnumQueryServicesStatus:OpenService ERROR 1060:\n\nEl servicio especificado no existe como servicio instalado."); return; }
        pre("SERVICE_NAME: " + s.name);
        pre("        TYPE               : 10  WIN32_OWN_PROCESS");
        pre("        STATE              : " + (s.state === "running" ? "4  RUNNING" : "1  STOPPED"));
        pre("        WIN32_EXIT_CODE    : 0  (0x0)");
        pre("        PID                : " + (s.pid || 0));
        emit({ type: "service-status", name: s.name, tool: "sc" });
        return;
      }
      if (sub === "qc") {
        if (!s) { fail("[SC] OpenService ERROR 1060:\n\nEl servicio especificado no existe como servicio instalado."); return; }
        pre("SERVICE_NAME: " + s.name);
        pre("        TYPE               : 10  WIN32_OWN_PROCESS");
        pre("        START_TYPE         : " + (s.startup === "auto" ? "2   AUTO_START" : s.startup === "disabled" ? "4   DISABLED" : "3   DEMAND_START"));
        pre("        DISPLAY_NAME       : " + s.display);
        emit({ type: "service-config", name: s.name, tool: "sc" });
        return;
      }
      if (sub === "config") {
        if (needAdmin("sc config")) { return; }
        if (!s) { fail("[SC] OpenService ERROR 1060:\n\nEl servicio especificado no existe como servicio instalado."); return; }
        var m = /start=\s*(\w+)/i.exec(args.join(" "));
        if (m) {
          var v = { auto: "auto", demand: "manual", disabled: "disabled" }[m[1].toLowerCase()];
          if (!v) { fail("[SC] ChangeServiceConfig ERROR 87: parámetro start= no válido (auto, demand o disabled)."); return; }
          s.startup = v;
          emit({ type: "service-startup", name: s.name, startup: v, tool: "sc" });
        }
        pre("[SC] ChangeServiceConfig CORRECTO");
        return;
      }
      fail("DESCRIPCIÓN:\n        SC es un programa de línea de comandos para comunicarse\n        con el Administrador de control de servicios.\nUSO:\n        sc [query|qc|config] <nombre del servicio>");
    };
    C["sc.exe"] = C.sc;

    /* Alias añadidos al mapa de nombres del intérprete de PowerShell */
    C.__aliases = {
      gsv: "Get-Service", sasv: "Start-Service", spsv: "Stop-Service",
      gps: "Get-Process", ps: "Get-Process", kill: "Stop-Process"
    };
    return C;
  };
})(this);
