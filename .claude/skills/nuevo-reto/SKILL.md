---
name: nuevo-reto
description: Crea un reto gamificado nuevo en este repositorio (Docker, SQL, redes, scripting…) reutilizando la biblioteca compartida shared/. Úsala cuando el usuario pida otro juego, otro simulador de terminal o un reto sobre un tema nuevo con la misma estética y mecánica.
---

# Crear un reto nuevo

Un reto es una carpeta con `index.html` (solo marcado), `css/reto.css`, `data/*.js` (datos puros)
y `js/*.js` (lógica), montada sobre la biblioteca `shared/` (espacio de nombres `RG`). Copia la
estructura de `blindaje-de-la-red/`, que es el más pequeño, y adapta.

**Restricción innegociable**: nada de módulos ES ni `fetch`, para que siga funcionando con doble
clic (`file://`). CSS con `<link>`, JS con `<script src>` clásicos y datos en `.js`.

## 1. Estructura y espacio de nombres

```
mi-reto/
  index.html        marcado de las 3 pantallas + guía de ayuda
  css/reto.css      solo lo que no esté ya en shared/css
  data/config.js       escenario (constantes, ficheros, listas de comandos)
  data/gamification.js niveles, insignias, coste de pista, penalización
  data/man.js          páginas de manual
  data/missions.js     contenido de las misiones (sin lógica)
  js/state.js       estado + montaje de terminal y shell
  js/commands.js    los comandos del simulador
  js/missions.js    lógica de las misiones (check, onActivate, solution)
  js/main.js        RG.Game, arranque, pantallas e informe
  README.md         guía docente (usa la skill «guia-docente»)
```

Elige un espacio de nombres corto de dos letras (`BD`, `VG`, …) y declara todo en él:
`var XX = global.XX = global.XX || {};` dentro de una IIFE con `"use strict"`, estilo ES5 (`var`,
`function`), igual que el resto del repositorio.

## 2. IDs obligatorios del `index.html`

La biblioteca los busca por `id`; si falta alguno, algo dejará de funcionar en silencio:

- Pantallas: `screenIntro`, `screenGame`, `screenDebrief`.
- Terminal: `termWindow`, `terminal`, `terminalOutput` (`role="log"`), `terminalForm`,
  `terminalInput`, `promptLabel`, `termTitle`.
- Misión: `missionSlot`, `missionLog`; barra: `clock`, `xpValue`, `levelName`, `tbId`.
- Globales: `toasts`, `announcer` (`role="status"`), y los botones `startBtn`, `resetBtn`,
  `quitBtn`, `againBtn`, `homeBtn`.
- Informe: `debriefTitle`, `debriefMsg`, `dXp`, `dLevel`, `dTime`, `dHints`, `badgeGrid`,
  `reportBody`, `riskyList`.
- Si usas editor: el bloque `nano` completo (`nano`, `nanoFile`, `nanoMod`, `nanoText`, `nanoMsg`,
  `nanoKeys`) y carga `shared/css/editor.css` y `shared/js/editor.js`.
- Modales: `.modal-overlay` con `.js-close-modal`, y botones `.js-open-modal[data-modal="…"]`.

Orden de los `<script>`: `shared/js/core.js`, `terminal.js`, `shell.js`, (`editor.js`), `man.js`,
`modal.js`, `game.js` → `data/*.js` → `js/*.js` → `js/main.js`.

## 3. Montaje mínimo

```js
// js/state.js
XX.state = {};                       // el objeto NUNCA se sustituye: se vacía y se rellena
XX.resetState = function () { Object.keys(XX.state).forEach(k => delete XX.state[k]); /* … */ };
XX.timers = RG.Timers();
XX.clock  = RG.Clock(RG.$("clock"));
XX.commands = {};                    // lo rellena js/commands.js
XX.term = RG.Terminal({ promptHtml, titleText, completion, canFocus, onCommand });
XX.shell = RG.Shell(XX.term, { commands: XX.commands, fs: { list, read, write },
                               afterCommand: () => XX.afterCommand(), afterLine: () => XX.afterLine() });

// js/main.js
var game = XX.game = RG.Game({ missions, levels, badges, hintCost, riskyPenalty, term, timers,
                               currentCommand, labels: {…}, on: {…} });
XX.afterCommand = function () { var evs = XX.events.slice(); XX.events.length = 0; game.check(evs); };
XX.afterLine    = function () { game.render(); XX.term.setLocked(false); };
```

`labels` son los textos de la ficha (franja, metadatos, estado) y `on` los enganches:
`broadcast` (el mensaje que anuncia la misión), `complete`, `levelUp`, `finish`, `render` y
`report`. Mira `blindaje-de-la-red/js/main.js` como ejemplo corto y
`versionando-con-git/js/main.js` como ejemplo con fases.

## 4. Diseño del reto (lo que hace que funcione en el aula)

- **7-10 misiones** para 15-20 min, o agrúpalas en **fases** (con selector de fase en la portada)
  si pasa de 20. Con fases, cada misión necesita `solution` para poder preparar el repositorio.
- Cada misión: un síntoma, un objetivo y tres pistas (skill `nueva-mision`).
- Los comandos deben ser **reales** y sus mensajes también (skill `comando-simulado`).
- Las acciones peligrosas se permiten, se explican y cuestan XP (`game.addRisky`).
- Insignias ligadas a **buenas prácticas**, no a terminar.
- Accesibilidad desde el principio: `role="log"`, anuncios con `RG.announce`, todo con teclado,
  nada que dependa solo del color, y prueba a 400 px.

## 5. Al terminar

1. Añade el reto a la portada `index.html` del repositorio y a la tabla del `README.md` raíz.
2. Escribe su `README.md` con la skill `guia-docente`.
3. Crea su guion de pruebas y ejecútalo con la skill `verificar-reto`.
4. Repasa la skill `publicar` antes de subirlo.
