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
| `library/index.html` | Página de la biblioteca con pestañas **Elementos / Texturas** (botón *Library* del simulador) |
| `library/elementos.json` | Catálogo de la biblioteca de elementos 3D (ver abajo) |
| `library/egger-textures.json` | 32 decorativos de tablero melamínico EGGER: código, acabado, color e imágenes públicas de egger.com |

Textos a cambiar para un nuevo cliente/evento: título y descripción en `index.html`
(cabecera), normativa y pie en `index.html`, y en `js/app.js` las secciones
`data` (leyenda y normativa) y `captura + envío directo` (asunto y pie de la captura).

## Versión solo visor: gpworx.com/design

`site-view/index.html` se publica en `design/` y carga los `css/` y `js/` de
`designer/`, así que comparte diseño con la versión editable. Activa
`GP_VIEW_ONLY`: no se pueden mover, girar, duplicar, añadir ni quitar elementos.

## Biblioteca de elementos 3D

Cada elemento móvil del stand es una pieza independiente de la biblioteca, con un
tipo (`id`), categoría, descripción y medidas. La sección `biblioteca de elementos`
de `js/app.js` la construye a partir de los elementos de la escena, y la API
`window.GPLIB` permite consultarla e incorporar piezas (base para el modo editor):

```js
GPLIB.list()                         // todos los elementos, con cuántos hay en escena
GPLIB.list('vegetacion')             // por categoría (ver GPLIB.categorias)
GPLIB.get('cesp')                    // un elemento
GPLIB.add('cesp')                    // añade uno junto al último del mismo tipo
GPLIB.add('cesp', {x: 1, z: 0.5, r: 0}) // en metros desde el centro del stand, r en radianes
GPLIB.remove('cesp')                 // quita el seleccionado o el último de ese tipo
GPLIB.toJSON()                       // catálogo en JSON (es lo que hay en library/elementos.json)
GPLIB.thumb('cesp', {w: 640, h: 480}) // miniatura 3D (webp) con las luces y el ángulo de la vista principal
```

| id | Elemento | Categoría |
|---|---|---|
| `rec` | Mostrador de recepción (curvo) | Mostradores y barras |
| `demo` | Demo NEXT · mostrador con maqueta | Mostradores y barras |
| `bar` | Barra curva | Mostradores y barras |
| `alm` | Almacén con pantalla | Estructuras y salas |
| `sala` | Sala de reunión de cristal | Estructuras y salas |
| `totem` | Tótem Challenge Selector | Señalética |
| `mesa` | Mesa alta | Mobiliario |
| `jard` | Jardinera de lirios | Vegetación |
| `cesp` | Planta de césped | Vegetación |

Las medidas (m) son la caja envolvente en planta de la pieza tal como está colocada
en el diseño original; en piezas giradas (tótems) no coinciden con su ancho frontal.

Para añadir una pieza nueva a la biblioteca: créala con `mov('clave','Nombre',()=>…)`,
añade su tipo en `TYPEOF` y `TYPES`, su línea en la leyenda (`DATA.C.m`) y su
categoría y descripción en `LIB_META`. Después regenera `library/elementos.json`
con la salida de `GPLIB.toJSON()`.

Las miniaturas de `library/thumbs/` se generan con `GPLIB.thumb(id, {w: 640, h: 480})`:
abre el simulador, ejecútalo en la consola para cada pieza y guarda la imagen como
`library/thumbs/<id>.webp`. Hay que regenerarlas si cambia el aspecto de una pieza.

Las dos plantas de césped (`g1`, `g2`) iban antes dentro del mostrador de recepción.
Los montajes guardados en el navegador antes del cambio las recolocan solas junto
a su mostrador, con el mismo giro.
