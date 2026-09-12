---
name: nueva-mision
description: Añade, cambia o reordena misiones (tickets, alertas o fases) en los retos gamificados de este repositorio. Úsala cuando el usuario pida una misión nueva, modificar sus textos o pistas, cambiar cómo se comprueba que está resuelta, o añadir una fase.
---

# Añadir o cambiar una misión

En los dos retos el **contenido** de las misiones y su **lógica** viven separados y se emparejan
por el código del ticket. Para añadir una misión hay que tocar los dos sitios.

| | Punto de retorno | Blindaje de la Red |
|---|---|---|
| Contenido | `punto-de-retorno/data/missions.js` (`VG.MISSION_CONTENT`) | `blindaje-de-la-red/data/missions.js` (`BD.MISSION_CONTENT`) |
| Lógica | `punto-de-retorno/js/missions.js` (objeto `LOGIC`, por código) | `blindaje-de-la-red/js/missions.js` (se deriva de `kind` y `port`) |
| Fases | `punto-de-retorno/data/gamification.js` (`VG.PHASES`) | — (no hay fases) |

El código (`GIT-07`, `SOC-1043`…) se asigna solo por la posición, así que **insertar una misión
en medio renumera las siguientes**: revisa las referencias cruzadas (por ejemplo, el ticket que
pide un mensaje de commit que empiece por `[GIT-10]`) y las soluciones de las pruebas.

## 1. El contenido (datos puros, sin lógica)

```js
{
  phase: 1,                       // solo en Versionando: índice dentro de VG.PHASES
  severity: "high",               // info | medium | high | critical (color de la ficha)
  source: "Auditoría interna",    // quién envía el ticket
  xp: 100,                        // 50 rutina · 100 normal · 150 difícil
  title: "Cierra Telnet",
  text: "…el síntoma o el encargo, en 2-3 frases…",
  objective: "…qué hay que conseguir, en una frase…",
  hints: [ "…general…", "…concreta…", "…casi la solución, con el comando…" ]
}
```

Reglas de escritura (son las que hacen que el reto enseñe):

- La ficha describe **un síntoma o un encargo**, nunca el comando. La solución solo aparece en la
  **tercera** pista; la primera orienta y la segunda concreta.
- Cada pista cuesta 25 XP, así que deben aportar algo distinto entre sí.
- Tono profesional y en español correcto; el objetivo es una sola frase y es lo que se anuncia a
  los lectores de pantalla.
- Si la misión la provoca un compañero (Arnold o Sigourney), el `source` es esa persona.

## 2. La lógica

En `js/missions.js`, dentro de `LOGIC`, con el código como clave:

```js
"GIT-08": {
  onActivate: function (datos) { … },        // opcional: lo que pasa al llegar el ticket
  check: function (ev, datos) { … },         // ¿está resuelta?
  react: function (ev, datos) { … },         // opcional: consejo ante un error típico
  solution: ["sed -i '/allow 23/d' firewall.sh", "git diff"]
}
```

- **`check(ev, datos)`** se llama con cada evento de la última orden y, además, una vez con `ev = null`
  para comprobar solo el estado. Elige:
  - **por estado** (preferible) si la misión consiste en dejar el sistema de una forma:
    `return !/allow\s+23\b/.test(VG.headTree()["firewall.sh"]);`
    Así se completa sola si el alumnado se adelanta (en Blindaje eso da bonus proactivo).
  - **por evento** si lo que se practica es *mirar*: `return !!ev && ev.type === "status";`
    (eventos disponibles: `status`, `log`, `diff`, `show`, `commit`, `add`, `rm`, `restore`, `reset`,
    `switch`, `merge`, `push`, `fetch`, `pull`, `stash-push`, `stash-pop`, `tag`, `reflog`, `blame`,
    `init`, `config`, `remote-add`, `branch-*`, `rebase`, `sockets` y `secure` en Blindaje).
  - `datos` es un objeto propio de la misión para guardar estado entre eventos (por ejemplo, «ya hizo
    `git stash`, falta el `pop`»).
- **`onActivate`** es para los eventos sorpresa: crea commits o ramas de los compañeros, ensucia un
  fichero, sube algo al servidor… Usa `VG.makeCommit`, `VG.applyTree`, `state.mem` para recordar
  hashes, y avisa con un `Broadcast message` (`bcastFrom`).
- **`react`** no completa nada: sirve para explicar un error frecuente («has usado `--hard` y has
  perdido los cambios; recupéralos con `git reflog`»).
- **`solution`** es obligatoria y tiene que funcionar: la reproduce el **selector de fase** de la
  portada para preparar el repositorio, y la usan las pruebas. No puede abrir el editor: usa `-m`,
  `--no-edit` o `sed`.

## 3. Después de tocar una misión

1. Comprueba que la `solution` deja la misión en verde: si empiezas el juego en la fase siguiente y
   el repositorio no queda como esperas, la solución está mal.
2. Añade o ajusta la misión en las pruebas (`SOLUCIONES` de `test-punto-de-retorno.mjs`) y ejecuta la *skill*
   `verificar-reto`.
3. Actualiza la **tabla de misiones del README** del reto (y el número de misiones si ha cambiado:
   aparece también en la portada del repositorio y en el `index.html` del reto).
