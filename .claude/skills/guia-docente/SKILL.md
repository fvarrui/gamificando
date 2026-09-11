---
name: guia-docente
description: Escribe o actualiza el README de un reto de este repositorio, que hace de guía docente (contexto educativo, objetivos, misiones, gamificación, accesibilidad y uso en el aula). Úsala cuando el usuario pida documentar un reto, actualizar su README o preparar la memoria o la evidencia de una tarea.
---

# Escribir la guía docente de un reto

El `README.md` de cada reto no es documentación técnica: es la **guía para el profesorado** y la
evidencia de diseño del reto (curso *La gamificación educativa*). Los dos existentes siguen la
misma estructura; mantenla para que se puedan comparar.

## Estructura canónica

1. **Título y lema** (cita en `>`: qué es y de qué experiencia forma parte).
2. **Índice** con enlaces a los apartados.
3. **Qué es** — en 2-3 párrafos: quién juega, qué hace, con qué herramientas y qué lo hace
   distinto de un test.
4. **Cómo abrirlo** — en local (doble clic), en el aula virtual (**recordar que hay que subir
   también `shared/`**) y en la web (GitHub Pages). Duración estimada.
5. **Contexto educativo** — tabla: **temas** (etiquetas del tipo Redes, Servicios, Seguridad,
   Linux, Git, Trabajo en equipo…), «encaja en» (descrito por lo que se trabaja), punto de partida,
   experiencia y modalidad. **No se cita ninguna etapa, ciclo ni módulo concretos** (ni «Formación
   Profesional», ni «1.º DAM», ni nombres de módulos): así el reto sirve en cualquier contexto que
   trabaje esos temas.
6. **Objetivos de aprendizaje** — lista numerada con verbos de nivel cognitivo creciente
   (identificar, evaluar, aplicar, decidir…), redactados como «al terminar, el alumnado será capaz de».
7. **Cómo funciona** — las tres pantallas, el desarrollo de una partida y las mecánicas clave.
8. **Las misiones** — tabla con código, título y qué se practica (agrupada por fases si las hay).
9. **Comandos disponibles** — tabla por tipos, más los atajos de teclado.
10. **Cómo se diseñó** — principios que guiaron las decisiones y evolución del diseño (qué se
    probó, qué no funcionó y por qué). Es la parte que más valor tiene como evidencia.
11. **Elementos de gamificación** — tabla con los **12 componentes** del curso y, en cada uno, si
    se usa, cómo y **por qué** (incluidos los que se descartan, con su motivo); insignias;
    perfiles de **Bartle**; estado de ***flow***.
12. **Accesibilidad, inclusión y protección de datos** — tres subapartados.
13. **Uso en el aula** — antes / durante / después, con preguntas concretas para la puesta en común.
14. **Detalles técnicos** — tabla de ficheros y claves del diseño; menciona la biblioteca `shared/`.
15. **Verificación** — cómo se ha probado y **cuántas comprobaciones** pasan.
16. **Limitaciones conocidas** — honestas y concretas.
17. **Archivos** y **Créditos** (`Made with 💖 by @fvarrui y Claude`).

## Cómo escribirlo

- **Español correcto**, con tildes y signos de apertura; tono claro y profesional, sin marketing.
- Comillas angulares («») para citas cortas dentro del texto; `código` para comandos y ficheros.
- Explica **por qué** cada decisión, no solo qué hace: esa es la diferencia entre un manual y una
  memoria de diseño.
- Tablas para lo enumerable (misiones, comandos, componentes de gamificación); prosa para los
  principios.
- Nada de promesas vagas: si algo no está implementado, va en «Limitaciones conocidas».

## Errores que ya hemos cometido (no repetir)

- **Enlazar ficheros que no existen** (capturas, notas de implementación, carpetas hermanas).
  Comprueba cada enlace y cada imagen antes de dar por bueno el README.
- **Dejar el número de comprobaciones desactualizado** en «Verificación» tras cambiar las pruebas.
- **Decir que basta con subir `index.html`**: desde la modularización hay que subir la carpeta del
  reto junto con `shared/`.
- Olvidar actualizar la **portada del repositorio** (`index.html`) y el **README raíz** cuando
  cambian el número de misiones, la duración o los temas.
- **Citar un ciclo o un módulo concretos** (o el curso al que va dirigido): los retos se etiquetan
  por temas para que valgan en cualquier módulo que los trabaje.
- Escribir el pie de créditos con «y» en vez de «&»: es `Made with 💖 by @fvarrui & Claude`.

## Si el README es para una entrega o memoria

Los apartados 10 y 11 (diseño y gamificación) son los que evalúan: deben poder leerse solos y
justificar el canvas del curso (primero los aprendizajes, después la narrativa y la estética;
componentes elegidos y descartados; Bartle; *flow*).
