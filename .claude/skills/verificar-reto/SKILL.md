---
name: verificar-reto
description: Verifica los retos del repositorio ejecutando partidas reales en Chrome headless (CDP). Úsala siempre después de tocar shared/ o cualquier reto, antes de publicar, o cuando el usuario pida probar, verificar, comprobar que algo sigue funcionando o hacer capturas de pantalla de los juegos.
---

# Verificar los retos

Los retos no tienen *tests* unitarios: se verifican **jugándolos** en un Chrome real en modo
*headless*, manejado por el protocolo DevTools (CDP) desde Node. Los guiones están en
`scripts/` (junto a este fichero) y no necesitan dependencias: solo Node ≥ 22 y Chrome (o Edge).

## Cómo ejecutarlas

```bash
node .claude/skills/verificar-reto/scripts/run.mjs          # todas (≈ 215 comprobaciones, ~4 min)
node .claude/skills/verificar-reto/scripts/run.mjs git      # solo las de Versionando con Git
node .claude/skills/verificar-reto/scripts/test-blindaje.mjs
node .claude/skills/verificar-reto/scripts/capturas.mjs docs/capturas
```

Si Chrome no está en la ruta habitual, indícalo con la variable de entorno `CHROME`.
Cada guion devuelve código de salida 1 si falla alguna comprobación e imprime
`--- Resumen: N correctas, M fallidas ---`.

| Guion | Qué cubre |
|---|---|
| `test-blindaje.mjs` | Partida completa de Blindaje: SSH, reconocimiento obligatorio, las 5 amenazas (incluida una resolución proactiva), daño colateral, informe, exploración y 400 px |
| `test-git.mjs` | Partida completa de las 30 misiones de Git, arranque desde cada una de las 5 fases, panel visual, informe y accesibilidad |
| `test-git-avanzado.mjs` | Caminos alternativos: errores típicos, stash, HEAD desacoplada, rebase con conflicto y `--abort`, cherry-pick, revert, `branch -D`, `push --force`, `reset --hard`, alias y ayuda |
| `test-reducido.mjs` | `prefers-reduced-motion` activado y la pregunta de guardado de nano |
| `test-portada.mjs` | La portada de GitHub Pages y la navegación con rutas relativas |
| `capturas.mjs` | Capturas de portada, juego, panel del repositorio, editor y vista móvil |

## Reglas al escribir o ampliar pruebas

Usa siempre `scripts/helpers.mjs` (`checker()` y `game(b)`), que ya resuelven lo delicado:

1. **Espera a que la página cargue**: `launch()` ya espera a `document.readyState === 'complete'`.
   Sin eso, las primeras comprobaciones fallan porque los `<script>` aún no se han ejecutado.
2. **Limpia la terminal antes de cada comprobación**: usa `g.run(cmd)` (limpia + escribe + devuelve
   el texto), no `g.type(cmd)` + leer. Si no, una aserción puede encontrar texto de órdenes
   anteriores y dar un falso positivo… o un falso fallo (nos ha pasado dos veces).
3. **Nunca esperes por tiempo a que llegue una misión**: `g.waitMission('GIT-18')` y `g.waitDone()`
   esperan por el DOM. Los tickets llegan con retardo y el retardo cambia con `prefers-reduced-motion`.
4. **Escribe órdenes como una persona**: `g.type()` pone el valor en `#terminalInput` y dispara
   `submit` en `#terminalForm`; antes espera a que la terminal no esté bloqueada.
5. **Comprueba siempre los errores de JavaScript** al final: `b.errors` recoge
   `Runtime.exceptionThrown` y los `console.error`/`console.warn`.
6. **Afirma sobre mensajes reales**, no sobre implementación: el texto que ve el alumnado
   («Fusión automática falló», «Un Blue Team no actúa a ciegas») es justamente lo que no debe
   romperse.

## Qué probar según lo que hayas tocado

- **`shared/`** → los **dos** retos (`run.mjs` entero). Un cambio en la terminal, el shell o el
  motor de misiones afecta a ambos.
- **Un comando nuevo o cambiado** → añade comprobaciones en el guion del reto correspondiente:
  salida correcta, mensaje de error, y que el comando no rompe la misión en curso.
- **Una misión nueva o cambiada** → añade su código y su solución a `SOLUCIONES` en `test-git.mjs`
  (o el paso equivalente en `test-blindaje.mjs`) y comprueba que la fase siguiente sigue
  preparándose bien (`FASES`).
- **CSS o maquetación** → las comprobaciones de 400 px y de que en escritorio la página no hace
  scroll; si dudas, saca una captura con `capturas.mjs` y míralas.

## Antes de dar algo por bueno

- Las cinco suites en verde y sin errores de consola.
- Si has cambiado el número de comprobaciones, **actualiza el apartado «Verificación» del README**
  del reto afectado.
