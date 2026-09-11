# Gamificando

> Juegos para desarrollar tus habilidades digitales, dentro de la experiencia gamificada
> **«Operación Escudo Digital»** de la empresa ficticia TecnoAtlántica.

Simuladores que se ejecutan en el navegador, sin instalar nada, sin conexión y sin enviar
ningún dato: el alumnado trabaja en una terminal Linux con **comandos reales** resolviendo
misiones que llegan de una en una.

| Reto | De qué va | Temas | Duración |
|---|---|---|---|
| 🛡️ [Blindaje de la Red](blindaje-de-la-red/) | Respuesta a incidentes: descubrir qué servicios sobran en un servidor comprometido y contenerlos (`ss`, `ps`, `systemctl`, `kill`, `ufw`, `iptables`) sin tumbar los que la empresa necesita | Redes · Servicios · Seguridad · Linux | 7 misiones · 10-20 min |
| 🌿 [Versionando con Git](versionando-con-git/) | Control de versiones: llevar una carpeta de scripts a un repositorio compartido con Git de verdad (`add`, `commit`, `branch`, `merge`, `push`, `pull`, `revert`…), con conflictos reales y un panel que dibuja el grafo de ramas | Git · Control de versiones · Trabajo en equipo | 30 misiones en 5 fases · 45-70 min |

Cada reto tiene su propio `README.md` con la guía docente: objetivos de aprendizaje, misiones,
elementos de gamificación, accesibilidad y propuestas de uso en el aula.

## Cómo se usa

- **En local**: abre [`index.html`](index.html) (o el `index.html` de cada reto) con doble clic.
  No hace falta servidor: los retos usan CSS y scripts clásicos, sin módulos ES ni `fetch`.
- **En la web**: publica el repositorio con **GitHub Pages** (rama principal, carpeta raíz). La
  portada del repositorio enlaza los dos retos.
- **En el aula virtual (EVAGD/Moodle)**: sube la carpeta completa (o un ZIP con `shared/` incluido)
  y enlaza el `index.html` del reto. Ojo: los retos necesitan la carpeta `shared/`, que está un
  nivel por encima de cada uno.

## Estructura

```
index.html              portada del repositorio (GitHub Pages)
.claude/skills/         instrucciones y pruebas automatizadas (ver más abajo)
shared/                 biblioteca común de los retos
  css/                  tokens de diseño, base, pantallas, terminal, editor, modales
  js/                   core, terminal, shell, editor, man, modal y motor de misiones (RG.*)
blindaje-de-la-red/
  index.html            solo marcado; enlaza shared/ y sus propios css/, data/ y js/
  css/reto.css          lo específico del reto (indicadores de alerta)
  data/                 datos puros: escenario, misiones, manuales, niveles e insignias
  js/                   estado, comandos, lógica de misiones y arranque
versionando-con-git/    misma estructura (además: simulador de Git y panel del repositorio)
```

La biblioteca `shared/` expone un único espacio de nombres global, `RG`:

| Módulo | Qué aporta |
|---|---|
| `core.js` | utilidades, temporizadores cancelables, anuncios accesibles, avisos, pantallas y reloj |
| `terminal.js` | la ventana de terminal: salida por filas con segmentos de color, historial, autocompletado, atajos y captura de salida |
| `shell.js` | intérprete: comillas, comodines, `&&`/`\|\|`/`;`, tuberías, redirecciones y análisis de opciones |
| `editor.js` | el editor `nano` simulado, que suspende la línea de órdenes hasta cerrarse |
| `man.js` | páginas de manual a partir de datos |
| `modal.js` | diálogos accesibles con foco atrapado |
| `game.js` | motor de misiones: estado, XP, niveles, pistas, insignias, decisiones arriesgadas, ficha y registro |

Cada reto aporta sus **datos** (`data/*.js`, contenido puro separado de la lógica) y sus
**comandos** y **comprobaciones de misión** (`js/*.js`).

## Pruebas

Los retos se verifican **jugándolos** en un Chrome sin interfaz, con guiones que no necesitan
dependencias (solo Node ≥ 22 y Chrome o Edge):

```bash
node .claude/skills/verificar-reto/scripts/run.mjs        # 215 comprobaciones, ~4 min
node .claude/skills/verificar-reto/scripts/capturas.mjs   # capturas de pantalla
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
