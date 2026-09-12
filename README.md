# Gamificando

> Juegos para desarrollar tus habilidades digitales, dentro de la experiencia gamificada
> **«Operación Escudo Digital»** de la empresa ficticia TecnoAtlántica.

Simuladores que se ejecutan en el navegador, sin instalar nada, sin conexión y sin enviar ningún
dato: se trabaja en una terminal de Linux o en una consola de PowerShell con **comandos reales**,
resolviendo tareas que llegan de una en una. Los errores son los de verdad, los permisos se
aplican de verdad y las decisiones arriesgadas quedan anotadas en el informe final.

## Retos disponibles

### Primeros pasos

| Reto | De qué va | Temas | Duración |
|---|---|---|---|
| 🐧 [Primeros pasos en Linux](primeros-pasos-en-linux/) | El primer día ante una terminal: orientarse, leer ficheros sin estropearlos, crear y ordenar, buscar y encadenar órdenes con tuberías (`pwd`, `ls`, `cd`, `cat`, `grep`, `find`, `cp`, `mv`, `rm`, `>`, `\|`) | Linux · Consola · Ficheros | 27 tareas en 5 fases · 20-35 min |
| 🪟 [Primeros pasos en PowerShell](primeros-pasos-en-powershell/) | El mismo primer día en Windows, donde los cmdlets devuelven **objetos** y no texto: `Get-ChildItem`, `Get-Content`, `New-Item`, `Where-Object`, `Sort-Object`, `Measure-Object`, `Get-Member` | Windows · PowerShell · Ficheros | 27 tareas en 5 fases · 20-35 min |

### Permisos

| Reto | De qué va | Temas | Duración |
|---|---|---|---|
| 🔐 [Permisos y ACL en Linux](permisos-en-linux/) | Bastionar una carpeta compartida que quedó a 777: `chmod`, `chown`, `chgrp`, `umask`, SGID, `getfacl` y `setfacl`, incluidas las ACL por omisión para los ficheros que aún no existen | Linux · Permisos · ACL · Seguridad | 26 tareas en 5 fases · 25-40 min |
| 🔒 [Permisos NTFS en Windows](permisos-en-windows/) | Quitar el «Todos · Control total» de la carpeta de toda la empresa: `Get-Acl`, `icacls` con `/grant`, `/deny`, `/remove` y `/inheritance`, y `takeown` | Windows · NTFS · ACL · Seguridad | 25 tareas en 5 fases · 25-40 min |

### Identidades

| Reto | De qué va | Temas | Duración |
|---|---|---|---|
| 👥 [Usuarios y grupos en Linux](usuarios-y-grupos-en-linux/) | Una semana de altas y bajas: `useradd`, `usermod`, `userdel`, `passwd`, `groupadd`, `gpasswd`, `getent`, con la trampa de `-G` sin `-a` y la norma de bloquear en vez de borrar | Linux · Usuarios · Grupos | 25 tareas en 5 fases · 25-40 min |
| 🧑‍💼 [Usuarios y grupos en Windows](usuarios-y-grupos-en-windows/) | La misma semana con cuentas locales y SID: cmdlets `*-LocalUser` y `*-LocalGroup`, `net user`, y una auditoría de cuentas inactivas resuelta con la tubería de objetos | Windows · Cuentas locales · Grupos | 25 tareas en 5 fases · 25-40 min |

### Servicios y seguridad

| Reto | De qué va | Temas | Duración |
|---|---|---|---|
| 🌙 [Servicios en Linux](servicios-en-linux/) | Guardia nocturna con la intranet caída: `systemctl` y `journalctl` con un conflicto de puertos real, y la diferencia entre «activo ahora» y «arrancará al reiniciar» | Linux · systemd · Servicios | 24 tareas en 5 fases · 20-35 min |
| 🛠 [Servicios en Windows](servicios-en-windows/) | Un servicio que «no arranca ni a mano»: `Get-Service`, `Set-Service -StartupType`, `sc.exe` y `net`, con la lección de por qué *Disabled* no es lo mismo que parado | Windows · Servicios · Tipos de inicio | 24 tareas en 5 fases · 20-35 min |
| 🛡️ [Blindaje de la Red](blindaje-de-la-red/) | Respuesta a incidentes: descubrir qué servicios sobran en un servidor comprometido y contenerlos (`ss`, `ps`, `systemctl`, `kill`, `ufw`, `iptables`) sin tumbar los que la empresa necesita | Redes · Servicios · Seguridad · Linux | 7 misiones · 10-20 min |

### Herramientas del oficio

| Reto | De qué va | Temas | Duración |
|---|---|---|---|
| 🌿 [Versionando con Git](versionando-con-git/) | Llevar una carpeta de scripts a un repositorio compartido con Git de verdad (`add`, `commit`, `branch`, `merge`, `push`, `pull`, `revert`…), con conflictos reales y un panel que dibuja el grafo de ramas | Git · Control de versiones · Trabajo en equipo | 30 misiones en 5 fases · 45-70 min |
| 🐳 [Contenedores con Docker](contenedores-con-docker/) | Migrar la intranet a contenedores: `pull`, `run`, `ps`, `logs`, `exec`, volúmenes, `build` desde un Dockerfile y toda la pila con `docker compose` | Docker · Contenedores · Despliegue | 26 tareas en 5 fases · 30-45 min |

Cada reto tiene su propio `README.md` con la guía docente: objetivos de aprendizaje, tareas,
elementos de gamificación, accesibilidad y propuestas de uso en el aula.

## Cómo se usa

- **En local**: abre [`index.html`](index.html) (o el `index.html` de cada reto) con doble clic.
  No hace falta servidor: los retos usan CSS y scripts clásicos, sin módulos ES ni `fetch`.
- **En la web**: publica el repositorio con **GitHub Pages** (rama principal, carpeta raíz). La
  portada del repositorio enlaza todos los retos.
- **En el aula virtual (EVAGD/Moodle)**: sube la carpeta completa (o un ZIP con `shared/` incluido)
  y enlaza el `index.html` del reto. Ojo: los retos necesitan la carpeta `shared/`, que está un
  nivel por encima de cada uno.

## Estructura

```
index.html              portada del repositorio (GitHub Pages)
.claude/skills/         instrucciones y pruebas automatizadas (ver más abajo)
shared/                 biblioteca común de los retos
  css/                  tokens de diseño, base, pantallas, terminal, editor, modales, fases
  js/                   núcleo, terminal, intérprete, editor, sistema simulado y motores (RG.*)
  data/                 manuales de Linux y ayuda de PowerShell, compartidos entre retos
<reto>/
  index.html            solo marcado; enlaza shared/ y sus propios css/, data/ y js/
  css/reto.css          lo específico del reto
  data/                 datos puros: escenario, tareas, niveles e insignias
  js/                   lógica de las tareas y arranque
```

La biblioteca `shared/` expone un único espacio de nombres global, `RG`:

| Módulo | Qué aporta |
|---|---|
| `core.js` | utilidades, temporizadores cancelables, anuncios accesibles, avisos, pantallas y reloj |
| `terminal.js` | la ventana de terminal: salida por filas con segmentos de color, historial, autocompletado, atajos y captura de salida |
| `shell.js` | intérprete: comillas, comodines, `&&`/`\|\|`/`;`, tuberías (de texto y de objetos), redirecciones y análisis de opciones |
| `editor.js` | el editor simulado, que suspende la línea de órdenes hasta cerrarse |
| `man.js` | páginas de manual y de `Get-Help` a partir de datos |
| `modal.js` | diálogos accesibles con foco atrapado |
| `game.js` | motor de tareas: estado, XP, niveles, pistas, insignias, decisiones arriesgadas, ficha y registro |
| `vfs.js` | sistema de ficheros virtual con permisos POSIX (incluidos SGID y sticky), ACL con máscara y ACL por omisión, y ACE de Windows con herencia |
| `sysmodel.js` | usuarios, grupos, servicios y procesos del sistema simulado |
| `cmd-posix.js` · `cmd-posix-admin.js` | órdenes de bash y de administración de Linux |
| `cmd-pwsh.js` · `cmd-pwsh-admin.js` | cmdlets de PowerShell, con tubería de objetos, ACL e `icacls` |
| `docker.js` | motor de contenedores: imágenes, contenedores, puertos, volúmenes, redes, `build` y Compose |
| `sandbox.js` | arranque común de los retos de consola: sistema simulado, terminal, motor de tareas, fases e informe final |

Cada reto aporta sus **datos** (`data/*.js`, contenido puro separado de la lógica) y las
**comprobaciones de sus tareas** (`js/missions.js`).

## Pruebas

Los retos se verifican **jugándolos** en un Chrome sin interfaz, con guiones que no necesitan
dependencias (solo Node ≥ 22 y Chrome o Edge):

```bash
node .claude/skills/verificar-reto/scripts/run.mjs               # toda la batería
node .claude/skills/verificar-reto/scripts/run.mjs test-docker   # solo un reto
node .claude/skills/verificar-reto/scripts/capturas.mjs          # capturas de pantalla
```

En `.claude/skills/` hay además instrucciones de proyecto que Claude Code carga solo cuando hacen
falta (crear un reto, añadir una misión, añadir un comando al simulador, escribir la guía docente
o repasar antes de publicar).

## Principios comunes

- Sin dependencias, sin CDN, sin *build* y sin almacenamiento en el navegador: el progreso vive
  solo en memoria y desaparece al cerrar la pestaña (protección de datos).
- Los simuladores **no enseñan cosas falsas**: reproducen el comportamiento y los mensajes reales
  de las herramientas, incluidos sus errores y sus consejos.
- Las decisiones peligrosas se permiten, se explican y cuestan XP, en lugar de bloquearse.
- Accesibilidad: uso completo con teclado, `role="log"` y región de anuncios para lectores de
  pantalla, contraste alto, `prefers-reduced-motion` y adaptación a pantallas de 400 px.

## Créditos

Made with 💖 by [@fvarrui](https://github.com/fvarrui) & [Claude](https://claude.ai).
