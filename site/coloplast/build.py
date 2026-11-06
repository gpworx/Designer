# Genera index.html (repo, carga ../js/three.min.js) y una versión autocontenida para el artifact
import base64,sys
t=open('template.html').read();css=open('styles.css').read()
r=t.replace('<!--CSS-->','<link rel="stylesheet" href="styles.css">').replace('<!--LOGO-->','../logo-gpworx.svg').replace('<!--SCRIPTS-->','<script src="../js/three.min.js"></script>\n<script src="images.js"></script>\n<script src="app.js"></script>')
open('index.html','w').write('<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">\n'+r.replace('<div class="printblock">','</head><body>\n<div class="printblock">',1)+'\n</body></html>\n')
logo='data:image/svg+xml;base64,'+base64.b64encode(open('../logo-gpworx.svg','rb').read()).decode()
a=t.replace('<!--CSS-->','<style>'+css+'</style>').replace('<!--LOGO-->',logo).replace('<!--SCRIPTS-->','<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>\n<script>'+open('images.js').read()+'</script>\n<script>'+open('app.js').read()+'</script>')
open(sys.argv[1],'w').write(a)
