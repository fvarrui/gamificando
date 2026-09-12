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
node .claude/skills/verificar-reto/scripts/run.mjs             # toda la batería (~15 min)
node .claude/skills/verificar-reto/scripts/run.mjs git         # solo las que lleven «git» en el nombre
node .claude/skills/verificar-reto/scripts/run.mjs test-carga-critica # un reto concreto
node .claude/skills/verificar-reto/scripts/capturas.mjs docs/capturas
```

Si Chrome no está en la ruta habitual, indícalo con la variable de entorno `CHROME`.
Cada guion devuelve código de salida 1 si falla alguna comprobación e imprime
`--- Resumen: N correctas, M fallidas ---`.

| Guion | Qué cubre |
|---|---|
| `test-blindaje.mjs` | Partida completa de Blindaje: SSH, reconocimiento obligatorio, las 5 amenazas (incluida una resolución proactiva), daño colateral, informe, exploración y 400 px |
| `test-punto-de-retorno.mjs` | Partida completa de las 30 misiones de Git, arranque desde cada una de las 5 fases, panel visual, informe y accesibilidad |
| `test-punto-de-retorno-avanzado.mjs` | Caminos alternativos: errores típicos, stash, HEAD desacoplada, rebase con conflicto y `--abort`, cherry-pick, revert, `branch -D`, `push --force`, `reset --hard`, alias y ayuda |
| `test-terminal-implacable.mjs` | Las 27 tareas de Terminal implacable, permisos respetados, errores de bash y arranque por fase |
| `test-jungla-de-objetos.mjs` | Las 27 tareas de La jungla de objetos, alias, abreviaturas de parámetro y tubería de objetos |
| `test-los-intocables.mjs` | Las 26 tareas de permisos y ACL: SGID, ACL por omisión heredada, credenciales protegidas |
| `test-control-total.mjs` | Las 25 tareas de NTFS: herencia cortada y restaurada, denegación explícita, propietario |
| `test-cuenta-atras.mjs` | Las 25 tareas de cuentas y grupos, y que `usermod -G` sin `-a` se anota como riesgo |
| `test-cuenta-pendiente.mjs` | Las 25 tareas de cuentas locales y la auditoría por objetos |
| `test-asalto-al-puerto-80.mjs` | Las 24 tareas de systemd y el conflicto de puertos en los dos sentidos |
| `test-arranque-imposible.mjs` | Las 24 tareas de servicios y que *Disabled* impide arrancar incluso a mano |
| `test-carga-critica.mjs` | Las 26 tareas de contenedores: volúmenes, puertos ocupados, `build` y Compose |
| `test-reducido.mjs` | `prefers-reduced-motion` activado y la pregunta de guardado de nano |
| `test-cameos.mjs` | Los nombres del reparto abren su Wikipedia sin parecer enlaces, y la terminal se queda fuera |
| `test-responsive.mjs` | Ningún reto hace scroll horizontal a 360 ni a 400 px, en portada, guía de ayuda, partida e informe |
| `test-portada.mjs` | La portada de GitHub Pages: que estén todos los retos y que cada uno cargue con rutas relativas |
| `capturas.mjs` | Capturas de portada, juego y vista móvil de todos los retos |

Al añadir un reto hay que **registrar su guion en `SUITES`, dentro de `run.mjs`**, y añadirlo a
`RETOS` en `test-portada.mjs` y a `SANDBOX` en `capturas.mjs`. Cada guion usa un puerto de
depuración distinto: mira el último usado antes de elegir uno.

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

- **`shared/`** → **todos** los retos (`run.mjs` entero). Un cambio en la terminal, el intérprete,
  el sistema de ficheros virtual o el motor de tareas afecta a casi una docena de juegos.
- **Un comando nuevo o cambiado** → añade comprobaciones en el guion del reto correspondiente:
  salida correcta, mensaje de error, y que el comando no rompe la tarea en curso.
- **Una tarea nueva o cambiada** → añade su código y su solución a `PASOS` (o `SOLUCIONES`, en Git)
  del guion del reto, y comprueba que la fase siguiente sigue preparándose bien.
- **CSS o maquetación** → `test-responsive.mjs` entero, y si dudas saca una captura con
  `capturas.mjs` y míralas. Lo que se salta con más facilidad: un contenedor `flex` **sin
  `flex-wrap`** cuyo contenido no cabe (la barra superior, la tira de fases, los indicadores)
  empuja toda la rejilla más allá del ancho de la ventana, y en el navegador solo se nota si
  reduces de verdad la ventana. Solo pueden scrollar en horizontal la terminal, `.table-wrap`,
  `.final-graph` y `.help-table`.

## Antes de dar algo por bueno

- Toda la batería en verde y sin errores de consola.
- Si has cambiado el número de comprobaciones, **actualiza el apartado «Verificación» del README**
  del reto afectado.
