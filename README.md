# Designer
Space configurator

## Publicación

Todo lo que esté en la carpeta `site/` se publica automáticamente en
**https://gpworx.com/designer** cada vez que se hace push o merge a `main`
(flujo `.github/workflows/deploy.yml`, subida por FTP a la carpeta `designer/`
en Hostalia).

Requiere estos secretos en Settings → Secrets and variables → Actions:
`FTP_SERVER`, `FTP_USERNAME`, `FTP_PASSWORD`.

El simulador debe generarse o guardarse dentro de `site/` para que se publique.

## Estructura de archivos (`site/`)

| Archivo | Qué contiene |
|---|---|
| `index.html` | Versión **editable**. Estructura de la página por bloques: cabecera, visor 3D, botones, panel lateral, normativa y pie (cada bloque va marcado con un comentario) |
| `css/styles.css` | Todos los estilos, incluidos los de móvil y la protección (marca de agua, bloqueos) |
| `js/app.js` | Lógica del simulador, dividida en secciones (ver el índice al principio del archivo) |
| `js/images.js` | Imágenes de los gráficos del stand (base64) |
| `js/three.min.js` | Librería 3D Three.js (no se toca) |
| `logo-gpworx.svg` | Logo de la cabecera y de la marca de agua |
| `send.php` | Envío de la captura a gregor@gpworx.com con el buzón info@ |

Textos a cambiar para un nuevo cliente/evento: título y descripción en `index.html`
(cabecera), normativa y pie en `index.html`, y en `js/app.js` las secciones
`data` (leyenda y normativa) y `captura + envío directo` (asunto y pie de la captura).

## Versión solo visor: gpworx.com/design

`site-view/index.html` se publica en `design/` y carga los `css/` y `js/` de
`designer/`, así que comparte diseño con la versión editable. Activa
`GP_VIEW_ONLY`: no se pueden mover, girar, duplicar, añadir ni quitar elementos.
