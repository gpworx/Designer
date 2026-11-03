# Designer
Space configurator

## Publicación

Todo lo que esté en la carpeta `site/` se publica automáticamente en
**https://gpworx.com/designer** cada vez que se hace push o merge a `main`
(flujo `.github/workflows/deploy.yml`, subida por FTP a `httpdocs/designer/`
en Hostalia).

Requiere estos secretos en Settings → Secrets and variables → Actions:
`FTP_SERVER`, `FTP_USERNAME`, `FTP_PASSWORD`.

El simulador debe generarse o guardarse dentro de `site/` para que se publique.
