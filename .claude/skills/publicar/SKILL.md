---
name: publicar
description: Repasa el repositorio antes de publicarlo en GitHub Pages o de subirlo al aula virtual, comprobando que no se han colado dependencias externas, módulos ES, fetch o rutas absolutas que romperían el uso con file:// o en Pages. Úsala cuando el usuario hable de publicar, desplegar, subir a Moodle o entregar el trabajo.
---

# Antes de publicar

Estos retos se publican con **GitHub Pages** y también se usan **sin servidor** (doble clic o
Moodle). Ese doble uso impone restricciones que es fácil romper sin darse cuenta.

## Comprobaciones automáticas

Desde la raíz del repositorio (ripgrep o el buscador que uses):

```bash
rg -n "type=\"module\"|\bimport |\bexport |fetch\(|localStorage|sessionStorage" --glob '!.claude/**' .
rg -n "https?://(?!git\.tecnoatlantica|github\.com/fvarrui|claude\.ai)" --glob '*.html' --glob '*.css' --glob '*.js' .
rg -n "src=\"/|href=\"/" --glob '*.html' .
```

Qué esperar:

| Búsqueda | Resultado correcto |
|---|---|
| `type="module"`, `import`, `export`, `fetch(` | **ninguna coincidencia** en los juegos: romperían `file://` (los guiones de `.claude/skills/` sí son módulos ES, pero se ejecutan con Node) |
| `localStorage` / `sessionStorage` | **ninguna**: el progreso vive en memoria, por protección de datos |
| URLs externas | solo las de los créditos, la del servidor Git ficticio y las de `es.wikipedia.org` de los cameos del reparto; **sin CDN, sin fuentes web, sin analítica** |
| Rutas que empiezan por `/` | **ninguna**: todas relativas (`../shared/…`), o se romperán en Pages bajo `/usuario/repo/` |

## Comprobaciones manuales

1. **Abrir con doble clic** `index.html` de la raíz y de cada reto, y jugar un par de misiones.
2. **Abrir por HTTP** (`npx serve`, `python -m http.server` o la propia Pages) y repetir.
3. Ejecutar la skill `verificar-reto` completa: **toda la batería en verde**, sin errores de consola.
4. Comprobar que **`.nojekyll` sigue existiendo** en la raíz (sin él, Pages pasa el sitio por
   Jekyll y puede alterar lo que se sirve).
5. Revisar los enlaces de la portada y de los README: que apunten a ficheros que existen.
6. Mirar la web en móvil (o a 400 px): sin scroll horizontal.

## Publicar en GitHub Pages

- Ajustes del repositorio → Pages → *Deploy from a branch* → rama principal, carpeta `/ (root)`.
- La portada es `index.html` de la raíz; cada reto cuelga de su carpeta.
- Los `.md` se sirven tal cual (por el `.nojekyll`): el navegador los muestra como texto plano.
  Si quieres que la guía docente se vea con formato, enlaza el README de GitHub, no el del sitio.

## Llevarlo al aula virtual (EVAGD/Moodle)

- **No basta con `index.html`**: hay que subir la carpeta del reto **y la carpeta `shared/`**,
  conservando la estructura (lo más cómodo es un ZIP con las dos y desplegarlo como recurso
  *Carpeta*, enlazando después `<reto>/index.html`).
- Alternativa recomendada: enlazar directamente a la URL de GitHub Pages.

## Antes de cerrar

- Actualiza el README raíz y la portada si ha cambiado el número de retos, misiones o duraciones.
- Si el trabajo es una entrega, revisa la skill `guia-docente`: los apartados de diseño y
  gamificación son los que se evalúan.
