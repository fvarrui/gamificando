---
name: comando-simulado
description: Añade o modifica comandos en los simuladores de terminal de este repositorio (git, ss, systemctl, ufw, sed, nano…) manteniendo el realismo de sus mensajes y su integración con las misiones. Úsala cuando el usuario pida soportar una orden nueva, una opción que falta o corregir la salida de un comando.
---

# Añadir o cambiar un comando del simulador

El valor didáctico de estos retos depende de una regla: **lo que se practica aquí tiene que
comportarse como fuera**. Si un comando miente, el reto enseña algo falso.

## Dónde va cada cosa

| Reto | Fichero |
|---|---|
| Blindaje | `blindaje-de-la-red/js/commands.js` (objeto `BD.commands`) |
| Versionando | `versionando-con-git/js/shell-commands.js` (shell) y `js/git-*.js` (objeto `VG.GIT`, por familias: `commands` básicos, `log`, `branch`, `remote`, `misc`) |

Firma: `function (args, name) { … }`, donde `args` ya viene sin el nombre del comando, con las
comillas resueltas y los comodines expandidos.

## Salida: usa el canal correcto

| Llamada | Para qué | ¿La captura una tubería o `>`? |
|---|---|---|
| `term.pre(texto)` | salida normal sin ajuste de línea (tablas, parches) | sí |
| `term.line(cls, texto)` | salida normal con ajuste (`text`, `dim`, `info`, `warn`, `ok`) | sí |
| `term.rich([[clase, texto], …])` | salida coloreada por segmentos (`g`, `r`, `y`, `c`, `b`…) | sí |
| `term.note(texto)` | informativos que van por *stderr* (como «Cambiado a rama…») | no |
| `term.fail(texto)` | errores; además pone el código de salida a 1 | no |
| `term.hint(texto)` | consejos `ayuda:` de git | no |
| `term.sys(cls, texto)` | **mensajes del juego** (avisos pedagógicos, SOC, compañeros) | no |

Códigos de salida: `term.status.code = 128` para los `fatal:` de git, `129` para uso incorrecto,
`1` para el resto. El encadenado `&&` / `||` depende de ellos.

## Realismo: lo que no se negocia

1. **Mensajes literales**, en el idioma del sistema simulado: git 2.43 en español (incluidas las
   líneas `ayuda:` y los textos largos de consejo), y los mensajes de las herramientas de red en
   inglés, como en Ubuntu.
2. **Silencio cuando la orden funciona**, si así es en la realidad: `systemctl stop`, `kill`,
   `iptables`, `git add` o `git switch -c` no imprimen nada (o casi nada).
3. **Las opciones importan**: `-p`, `-n`, `--staged`, `--now`, `--oneline`… Si una opción cambia el
   resultado de verdad, impleméntala; si no, decláralo con `sys("info", "ℹ (simulador) …")` en vez
   de fingir que hace algo.
4. **No enseñar cosas falsas.** Ejemplos que ya están resueltos así y hay que respetar:
   - el cortafuegos **no** detiene el servicio (pasa a `filtered`: sigue en `ss` y en `ps`);
   - `systemctl disable` sin `--now` no lo detiene;
   - bloquear un puerto que solo escucha en `127.0.0.1` no cambia nada;
   - `.gitignore` no deja de seguir lo ya versionado;
   - `--amend` y `rebase` cambian los hashes;
   - `fetch` no toca tu rama; un push no avanzable se rechaza; `pull` con ramas divergentes obliga
     a elegir entre fusionar y rebasar.
5. **Errores que orientan sin resolver**: el mensaje explica qué falta o qué hacer después
   («ejecuta antes `ss -tulpn`…», «integra primero los cambios remotos»), nunca el comando exacto
   de la misión en curso.

## Integración con el resto del reto

- **Emite el evento** si el comando puede completar una misión:
  `VG.emit({ type: "status", clean: st.clean })`. Los `check()` de las misiones se apoyan en ellos.
- **Registra las decisiones peligrosas** con `VG.risky(tipo, texto)` / `game.addRisky()`: se permiten,
  se explican, cuestan 50 XP y salen en el informe.
- **Da de alta el comando en los tres sitios**: la ayuda (`help`), el manual (`data/man.js`) y el
  autocompletado (`VG.completion` / `BD.completion`). Un comando que no se puede descubrir no existe.
- Si es de git, añádelo también a `VG.GIT_COMMANDS` (para el autocompletado y para la sugerencia
  «El comando más similar es…»).

## Analizar los argumentos

Usa `RG.parseArgs(args, def)` en vez de recorrer `args` a mano:

```js
var o = RG.parseArgs(args, {
  short: { a: "all", m: "=message", f: "force" },   // "=" ⇒ la opción lleva valor
  long:  { all: "all", message: "=message", "no-edit": "noEdit" },
  numeric: true                                      // admite -5 como número (git log -5)
});
if (o.bad || o.missing) { VG.optError(o, "commit"); return; }   // error + «uso:» del manual
```

`o._` son los argumentos posicionales y `o.__` lo que va tras `--`. Los valores llegan como array
(`RG.lastOf(o.message)` para el último).

## Antes de darlo por hecho

Prueba con la skill `verificar-reto` y añade al guion del reto una comprobación del mensaje nuevo:
si el texto que ve el alumnado cambia, es justo lo que debe detectar la prueba.
