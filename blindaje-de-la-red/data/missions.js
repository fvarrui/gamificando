/* ==========================================================
   Contenido de las 7 misiones (solo textos: sin lógica).
   La lógica está en js/missions.js.
   kind: recon (reconocimiento) | threat (amenaza) | verify
   ========================================================== */
(function (global) {
  "use strict";
  var BD = global.BD = global.BD || {};

  BD.MISSION_CONTENT = [
    {
      kind: "recon", code: "BT-00", severity: "info", sevLabel: "Orden del Blue Team",
      source: "Coordinación", xp: 50, minXp: 10,
      title: "Reconocimiento inicial",
      text: "Antes de tocar nada necesitas saber qué está escuchando en este servidor. Un Blue Team nunca actúa a ciegas: primero se observa y después se actúa.",
      objective: "Lista los puertos en escucha y los procesos que los ocupan.",
      hints: [
        "Hay dos herramientas clásicas para listar sockets: netstat (la veterana) y ss (su sustituta moderna).",
        "Combina opciones: -t (TCP), -u (UDP), -l (solo en escucha), -p (proceso y PID) y -n (puertos en número).",
        "Escribe: ss -tulpn"
      ]
    },
    {
      kind: "threat", port: 23, code: "SOC-1041", severity: "high", sevLabel: "Prioridad alta",
      source: "IDS · Suricata", xp: 100,
      title: "Credenciales en texto plano",
      text: "El IDS ha capturado un usuario y una contraseña de administración viajando sin cifrar hacia este servidor. Cualquiera que escuche la red puede leerlos tal cual.",
      objective: "Identifica qué servicio acepta sesiones remotas sin cifrado y deja de exponerlo.",
      hints: [
        "Es el antepasado de SSH: servía para administrar equipos en remoto, pero no cifra absolutamente nada.",
        "Busca el puerto 23/tcp en la salida de ss o netstat.",
        "Por ejemplo: systemctl stop inetd · kill <PID de in.telnetd> · ufw deny 23"
      ]
    },
    {
      kind: "threat", port: 21, code: "SOC-1042", severity: "high", sevLabel: "Prioridad alta",
      source: "Auditoría externa", xp: 100,
      title: "Descargas sin identificarse",
      text: "Un auditor ha descargado documentos internos de TecnoAtlántica sin usuario ni contraseña: le bastó con entrar como «anonymous». Además, los ficheros viajaron sin cifrar.",
      objective: "Localiza el servicio de transferencia de ficheros con acceso anónimo y ciérralo.",
      hints: [
        "Es el protocolo clásico de transferencia de ficheros, anterior a SFTP.",
        "Busca el puerto 21/tcp. El proceso es un demonio muy habitual en Linux (su nombre empieza por «vs»).",
        "Por ejemplo: systemctl stop vsftpd · service vsftpd stop · ufw deny 21"
      ]
    },
    {
      kind: "threat", port: 80, code: "SOC-1043", severity: "medium", sevLabel: "Prioridad media",
      source: "Escáner de vulnerabilidades", xp: 100,
      title: "El portal olvidado",
      text: "El escáner semanal ha encontrado un portal de gestión de 2019 que nadie actualiza. Tiene vulnerabilidades públicas y hay bots probando la ruta /admin cada pocos segundos.",
      objective: "Deja fuera de servicio el portal web sin cifrar. La web corporativa segura debe seguir funcionando.",
      hints: [
        "Ojo: en la máquina hay dos servidores web distintos. Uno cifra el tráfico y el otro no.",
        "El portal vulnerable escucha en el puerto 80/tcp y lo sirve apache2.",
        "Por ejemplo: systemctl stop apache2 · service apache2 stop · ufw deny 80"
      ]
    },
    {
      kind: "threat", port: 445, code: "SOC-1044", severity: "critical", sevLabel: "Prioridad crítica",
      source: "CERT · Inteligencia de amenazas", xp: 100,
      title: "Campaña de ransomware",
      text: "El CERT avisa de una campaña de ransomware al estilo WannaCry que rastrea Internet buscando carpetas compartidas expuestas. Nuestro servidor aparece en su lista de objetivos.",
      objective: "Encuentra el servicio de recursos compartidos accesible desde fuera y córtale el acceso.",
      hints: [
        "Es el protocolo de las carpetas compartidas de Windows; en Linux lo implementa Samba.",
        "Puerto 445/tcp (microsoft-ds), proceso smbd.",
        "Por ejemplo: systemctl stop smbd · ufw deny 445 · iptables -A INPUT -p tcp --dport 445 -j DROP"
      ]
    },
    {
      kind: "threat", port: 3389, code: "SOC-1045", severity: "critical", sevLabel: "Prioridad crítica",
      source: "SIEM · Correlación de eventos", xp: 100,
      title: "Fuerza bruta en curso",
      text: "La IP 185.220.101.47 lleva más de 4000 intentos de inicio de sesión en la última hora contra el escritorio remoto del servidor. No hay VPN ni doble factor por delante.",
      objective: "Bloquea el servicio de escritorio remoto expuesto antes de que acierten la contraseña.",
      hints: [
        "Es un escritorio gráfico remoto: el mismo protocolo que usa Windows (RDP).",
        "Puerto 3389/tcp (ms-wbt-server), proceso xrdp.",
        "Por ejemplo: systemctl stop xrdp · kill <PID de xrdp> · ufw deny 3389"
      ]
    },
    {
      kind: "verify", code: "BT-99", severity: "info", sevLabel: "Cierre del incidente",
      source: "Coordinación", xp: 50, minXp: 10,
      title: "Verificación final",
      text: "Las alertas han cesado. Antes de dar el incidente por cerrado, la dirección necesita una prueba de cómo queda el servidor.",
      objective: "Vuelve a listar los puertos en escucha para comprobar el estado final.",
      hints: [
        "Es la misma herramienta que usaste al principio de la operación.",
        "ss o netstat, con las opciones -tulpn.",
        "Escribe: ss -tulpn"
      ]
    }
  ];
})(this);
