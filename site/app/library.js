// =====================================================================
// GPworx Stand Editor · BIBLIOTECA DE ELEMENTOS
// © GPworx — Diseños y elementos de autoría propia. Uso exclusivo dentro de la app.
// ---------------------------------------------------------------------
// Cada elemento es paramétrico: sus medidas (en cm), colores, imagen y texto
// se guardan en el proyecto (JSON) y la función build() genera el 3D.
//   params : medidas editables  {k, label, min, max, step, def}
//   colors : colores editables  {k, label, def}
//   graphic: true si admite imagen / texto (logo) en sus caras gráficas
// Para añadir un elemento nuevo basta con añadir una entrada a LIBRARY.
// =====================================================================
(function(){
const T=THREE, cm=v=>v/100;

// ---------- materiales y texturas compartidos ----------
const MAT={};
function mat(color,o={}){const key=color+JSON.stringify(o);if(!MAT[key])MAT[key]=new T.MeshStandardMaterial(Object.assign({color,roughness:.6,metalness:.05},o));return MAT[key];}
const glass=()=>new T.MeshPhysicalMaterial({color:0xd8ecff,roughness:.05,metalness:0,transparent:true,opacity:.28,side:T.DoubleSide,depthWrite:false});
const TEX={};
// Textura gráfica: imagen subida (dataURL) y/o texto (p. ej. nombre de marca) sobre un color de fondo
function graphicMat(e,bg,fg,aspect,o={}){
  const img=e.img||'',txt=e.text||'',key=[img.length,img.slice(-40),txt,bg,fg,aspect.toFixed(2),o.repeat||1].join('|');
  if(!img&&!txt)return mat(bg,o.mat);
  if(TEX[key])return TEX[key];
  const H=512,W=Math.max(64,Math.min(4096,Math.round(H*aspect/(o.repeat||1))));
  const c=document.createElement('canvas');c.width=W;c.height=H;const g=c.getContext('2d');
  const tex=new T.CanvasTexture(c);tex.encoding=T.sRGBEncoding;tex.anisotropy=8;
  if(o.repeat){tex.wrapS=T.RepeatWrapping;tex.repeat.set(o.repeat,1);}
  const draw=im=>{g.fillStyle=bg;g.fillRect(0,0,W,H);
    if(im){const s=Math.max(W/im.width,H/im.height),iw=im.width*s,ih=im.height*s;
      if(o.fit==='contain'){const s2=Math.min(W/im.width,H/im.height)*0.8;g.drawImage(im,(W-im.width*s2)/2,(H-im.height*s2)/2,im.width*s2,im.height*s2);}
      else g.drawImage(im,(W-iw)/2,(H-ih)/2,iw,ih);}
    if(txt){const fs=Math.min(H*0.32,W/(txt.length*0.75));g.font=`bold ${fs}px Helvetica,Arial,sans-serif`;g.fillStyle=fg;g.textAlign='center';g.textBaseline='middle';
      if('letterSpacing' in g)g.letterSpacing=Math.round(fs*0.08)+'px';g.fillText(txt,W/2,im?H*0.82:H/2);}
    tex.needsUpdate=true;};
  draw(null);
  if(img){const im=new Image();im.onload=()=>{draw(im);if(window.GPEditor)window.GPEditor.redraw();};im.src=img;}
  const m=new T.MeshStandardMaterial(Object.assign({map:tex,roughness:.5},o.mat||{}));TEX[key]=m;return m;}

function mesh(geo,m,x=0,y=0,z=0){const o=new T.Mesh(geo,m);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;return o;}
// Arco (mostrador curvo) extruido: ángulos desde +z hacia +x
function arcShape(ri,ro,a0,a1){const s=new T.Shape(),P=(r,a)=>[r*Math.sin(a),r*Math.cos(a)],n=48;let p=P(ro,a0);s.moveTo(p[0],p[1]);
  for(let i=1;i<=n;i++){p=P(ro,a0+(a1-a0)*i/n);s.lineTo(p[0],p[1]);}for(let i=n;i>=0;i--){p=P(ri,a0+(a1-a0)*i/n);s.lineTo(p[0],p[1]);}return s;}

// ---------- catálogo ----------
const C={main:{k:'main',label:'Color principal'},acc:{k:'acc',label:'Color secundario'}};
const LIBRARY=[
 // ---- Mostradores y barras
 {type:'counter',name:'Mostrador recto',cat:'Mostradores',icon:'▭',graphic:true,
  params:[{k:'w',label:'Ancho',min:60,max:600,step:5,def:200},{k:'d',label:'Fondo',min:30,max:150,step:5,def:60},{k:'h',label:'Alto',min:70,max:130,step:5,def:110}],
  colors:[{...C.main,def:'#f4f4f4'},{...C.acc,label:'Encimera',def:'#1d1f24'}],
  build(e){const p=e.p,g=new T.Group(),w=cm(p.w),d=cm(p.d),h=cm(p.h);
   g.add(mesh(new T.BoxGeometry(w,h-0.04,d),[mat(e.c.main),mat(e.c.main),mat(e.c.main),mat(e.c.main),graphicMat(e,e.c.main,'#101114',w/(h-0.04)),mat(e.c.main)],0,(h-0.04)/2,0));
   g.add(mesh(new T.BoxGeometry(w+0.04,0.04,d+0.04),mat(e.c.acc),0,h-0.02,0));return g;}},
 {type:'counter_curved',name:'Mostrador curvo',cat:'Mostradores',icon:'◠',graphic:true,
  params:[{k:'r',label:'Radio interior',min:50,max:500,step:5,def:150},{k:'ang',label:'Ángulo',unit:'°',min:20,max:360,step:5,def:90},{k:'d',label:'Fondo',min:30,max:120,step:5,def:55},{k:'h',label:'Alto',min:70,max:130,step:5,def:110}],
  colors:[{...C.main,def:'#f4f4f4'},{...C.acc,label:'Encimera',def:'#1d1f24'}],
  build(e){const p=e.p,g=new T.Group(),ri=cm(p.r),ro=ri+cm(p.d),h=cm(p.h),a=p.ang*Math.PI/180;
   const body=new T.ExtrudeGeometry(arcShape(ri,ro,-a/2,a/2),{depth:h-0.04,bevelEnabled:false,curveSegments:48});body.rotateX(Math.PI/2);body.translate(0,h-0.04,-ri-cm(p.d)/2);
   g.add(mesh(body,mat(e.c.main)));
   const top=new T.ExtrudeGeometry(arcShape(ri-0.02,ro+0.02,-a/2,a/2),{depth:0.04,bevelEnabled:false,curveSegments:48});top.rotateX(Math.PI/2);top.translate(0,h,-ri-cm(p.d)/2);
   g.add(mesh(top,mat(e.c.acc)));
   if(e.img||e.text){const la=Math.min(a,0.9),fr=new T.Mesh(new T.CylinderGeometry(ro+0.006,ro+0.006,(h-0.04)*0.7,32,1,true,-la/2,la),graphicMat(e,e.c.main,'#101114',ro*la/((h-0.04)*0.7),{mat:{side:T.DoubleSide}}));
     fr.position.set(0,(h-0.04)/2,-ri-cm(p.d)/2);g.add(fr);}
   return g;}},
 // ---- Almacenes y estructuras
 {type:'storage',name:'Almacén rectangular',cat:'Estructuras',icon:'▣',graphic:true,
  params:[{k:'w',label:'Ancho',min:100,max:600,step:5,def:200},{k:'d',label:'Fondo',min:100,max:500,step:5,def:150},{k:'h',label:'Alto',min:200,max:500,step:5,def:300}],
  colors:[{...C.main,def:'#f4f4f4'},{...C.acc,label:'Puerta',def:'#1d1f24'}],
  build(e){const p=e.p,g=new T.Group(),w=cm(p.w),d=cm(p.d),h=cm(p.h);
   g.add(mesh(new T.BoxGeometry(w,h,d),[mat(e.c.main),mat(e.c.main),mat(e.c.main),mat(e.c.main),graphicMat(e,e.c.main,'#101114',w/h),mat(e.c.main)],0,h/2,0));
   g.add(mesh(new T.BoxGeometry(0.9,2.1,0.02),mat(e.c.acc),w/2-0.6,1.05,-d/2-0.011));return g;}},
 {type:'storage_cyl',name:'Almacén cilíndrico',cat:'Estructuras',icon:'◉',graphic:true,
  params:[{k:'diam',label:'Diámetro',min:100,max:600,step:5,def:300},{k:'h',label:'Alto',min:200,max:500,step:5,def:300}],
  colors:[{...C.main,def:'#16192a'},{...C.acc,label:'Tapa',def:'#101114'}],
  build(e){const p=e.p,g=new T.Group(),r=cm(p.diam)/2,h=cm(p.h);
   g.add(mesh(new T.CylinderGeometry(r,r,h,64),[graphicMat(e,e.c.main,'#ffffff',2*Math.PI*r/h),mat(e.c.acc),mat(e.c.acc)],0,h/2,0));return g;}},
 {type:'column',name:'Columna',cat:'Estructuras',icon:'▮',graphic:true,
  params:[{k:'w',label:'Ancho',min:10,max:120,step:5,def:50},{k:'d',label:'Fondo',min:10,max:120,step:5,def:50},{k:'h',label:'Alto',min:100,max:600,step:5,def:400}],
  colors:[{...C.main,def:'#1d1f24'}],
  build(e){const p=e.p,w=cm(p.w),d=cm(p.d),h=cm(p.h),gm=graphicMat(e,e.c.main,'#ffffff',w/h),m=mat(e.c.main);
   const g=new T.Group();g.add(mesh(new T.BoxGeometry(w,h,d),[m,m,m,m,gm,gm],0,h/2,0));return g;}},
 {type:'lintel',name:'Dintel / banner recto',cat:'Estructuras',icon:'▬',graphic:true,
  params:[{k:'w',label:'Largo',min:100,max:1200,step:10,def:400},{k:'band',label:'Alto banda',min:30,max:250,step:5,def:80},{k:'d',label:'Grosor',min:5,max:60,step:5,def:20},{k:'base',label:'Altura base',min:200,max:600,step:10,def:400}],
  colors:[{...C.main,def:'#5d729e'}],
  build(e){const p=e.p,w=cm(p.w),b=cm(p.band),d=cm(p.d),y=cm(p.base),gm=graphicMat(e,e.c.main,'#ffffff',w/b),m=mat(e.c.main);
   const g=new T.Group();g.add(mesh(new T.BoxGeometry(w,b,d),[m,m,m,m,gm,gm],0,y+b/2,0));return g;}},
 {type:'ring',name:'Anillo colgado',cat:'Estructuras',icon:'◯',graphic:true,
  params:[{k:'diam',label:'Diámetro',min:150,max:1200,step:10,def:550},{k:'band',label:'Alto banda',min:40,max:300,step:5,def:150},{k:'base',label:'Altura base',min:200,max:700,step:10,def:400}],
  colors:[{...C.main,def:'#101114'}],
  build(e){const p=e.p,r=cm(p.diam)/2,b=cm(p.band),y=cm(p.base),rep=Math.max(1,Math.round(2*Math.PI*r/(b*4)));
   const g=new T.Group(),ring=mesh(new T.CylinderGeometry(r,r,b,96,1,true),graphicMat(e,e.c.main,'#ffffff',2*Math.PI*r/b,{repeat:rep,mat:{side:T.DoubleSide}}),0,y+b/2,0);
   ring.material.map&&ring.material.map.offset.set(0.5,0);g.add(ring);return g;}},
 {type:'wall',name:'Pared / trasera',cat:'Estructuras',icon:'▯',graphic:true,
  params:[{k:'w',label:'Ancho',min:50,max:1200,step:10,def:300},{k:'h',label:'Alto',min:100,max:600,step:10,def:250},{k:'d',label:'Grosor',min:5,max:40,step:1,def:10}],
  colors:[{...C.main,def:'#f4f4f4'}],
  build(e){const p=e.p,w=cm(p.w),h=cm(p.h),d=cm(p.d),m=mat(e.c.main),gm=graphicMat(e,e.c.main,'#101114',w/h);
   const g=new T.Group();g.add(mesh(new T.BoxGeometry(w,h,d),[m,m,m,m,gm,m],0,h/2,0));return g;}},
 {type:'glass_room',name:'Sala de cristal',cat:'Estructuras',icon:'◌',graphic:false,
  params:[{k:'diam',label:'Diámetro',min:150,max:600,step:10,def:300},{k:'h',label:'Alto',min:200,max:350,step:5,def:250}],
  colors:[{...C.main,label:'Perfiles',def:'#5d729e'}],
  build(e){const p=e.p,r=cm(p.diam)/2,h=cm(p.h),g=new T.Group(),gap=0.9/r;
   const gl=new T.Mesh(new T.CylinderGeometry(r,r,h,64,1,true,gap/2,Math.PI*2-gap),glass());gl.position.y=h/2;g.add(gl);
   [0.03,h-0.03].forEach(y=>{const t=new T.Mesh(new T.TorusGeometry(r,0.03,8,96),mat(e.c.main));t.rotation.x=Math.PI/2;t.position.y=y;g.add(t);});
   const t1=new T.Mesh(new T.CylinderGeometry(0.4,0.4,0.03,32),mat('#f4f4f4'));t1.position.y=0.74;g.add(t1);
   const leg=new T.Mesh(new T.CylinderGeometry(0.03,0.03,0.72,10),mat('#9aa0a8',{metalness:.6}));leg.position.y=0.37;g.add(leg);return g;}},
 // ---- Mobiliario
 {type:'high_table',name:'Mesa alta',cat:'Mobiliario',icon:'⊤',
  params:[{k:'diam',label:'Diámetro',min:50,max:120,step:5,def:80},{k:'h',label:'Alto',min:90,max:120,step:5,def:110}],
  colors:[{...C.main,label:'Tablero',def:'#f4f4f4'}],
  build(e){const p=e.p,r=cm(p.diam)/2,h=cm(p.h),s=mat('#b9bec6',{metalness:.6,roughness:.3}),g=new T.Group();
   g.add(mesh(new T.CylinderGeometry(r,r,0.03,32),mat(e.c.main),0,h,0));g.add(mesh(new T.CylinderGeometry(0.03,0.03,h-0.02,12),s,0,h/2,0));g.add(mesh(new T.CylinderGeometry(0.22,0.22,0.02,24),s,0,0.01,0));return g;}},
 {type:'low_table',name:'Mesa baja',cat:'Mobiliario',icon:'⊥',
  params:[{k:'diam',label:'Diámetro',min:40,max:120,step:5,def:60},{k:'h',label:'Alto',min:30,max:80,step:5,def:45}],
  colors:[{...C.main,label:'Tablero',def:'#f4f4f4'}],
  build(e){const p=e.p,r=cm(p.diam)/2,h=cm(p.h),s=mat('#b9bec6',{metalness:.6,roughness:.3}),g=new T.Group();
   g.add(mesh(new T.CylinderGeometry(r,r,0.04,32),mat(e.c.main),0,h,0));g.add(mesh(new T.CylinderGeometry(0.03,0.03,h,12),s,0,h/2,0));g.add(mesh(new T.CylinderGeometry(0.18,0.18,0.02,24),s,0,0.01,0));return g;}},
 {type:'stool',name:'Taburete alto',cat:'Mobiliario',icon:'⌶',
  params:[{k:'h',label:'Alto asiento',min:60,max:85,step:5,def:75}],
  colors:[{...C.main,label:'Asiento',def:'#1d1f24'}],
  build(e){const h=cm(e.p.h),s=mat('#b9bec6',{metalness:.6,roughness:.3}),g=new T.Group();
   g.add(mesh(new T.CylinderGeometry(0.19,0.19,0.06,24),mat(e.c.main),0,h,0));g.add(mesh(new T.CylinderGeometry(0.02,0.02,h,10),s,0,h/2,0));g.add(mesh(new T.CylinderGeometry(0.16,0.16,0.02,20),s,0,0.01,0));return g;}},
 {type:'chair',name:'Silla',cat:'Mobiliario',icon:'⑁',
  params:[{k:'h',label:'Alto asiento',min:40,max:50,step:1,def:45}],
  colors:[{...C.main,def:'#f4f4f4'}],
  build(e){const h=cm(e.p.h),m=mat(e.c.main),s=mat('#9aa0a8',{metalness:.5}),g=new T.Group();
   g.add(mesh(new T.BoxGeometry(0.45,0.04,0.45),m,0,h,0));g.add(mesh(new T.BoxGeometry(0.45,0.42,0.04),m,0,h+0.23,-0.21));
   [[-0.2,-0.2],[0.2,-0.2],[-0.2,0.2],[0.2,0.2]].forEach(([x,z])=>g.add(mesh(new T.CylinderGeometry(0.012,0.012,h,8),s,x,h/2,z)));return g;}},
 {type:'planter',name:'Jardinera',cat:'Mobiliario',icon:'✿',
  params:[{k:'w',label:'Ancho',min:30,max:200,step:5,def:70},{k:'h',label:'Alto maceta',min:20,max:100,step:5,def:55},{k:'plant',label:'Alto planta',min:30,max:250,step:5,def:120}],
  colors:[{...C.main,label:'Maceta',def:'#c9a978'}],
  build(e){const p=e.p,w=cm(p.w),h=cm(p.h),ph=cm(p.plant),g=new T.Group(),gr=mat('#6f9a4a');
   g.add(mesh(new T.BoxGeometry(w,h,w),mat(e.c.main),0,h/2,0));
   let s=7;const rnd=()=>{s=(s*9301+49297)%233280;return s/233280;};
   for(let i=0;i<Math.round(18*w/0.7);i++){const hh=ph*(0.6+0.4*rnd()),b=new T.Mesh(new T.ConeGeometry(0.025,hh,4),gr);b.position.set((rnd()-.5)*w*0.7,h+hh/2,(rnd()-.5)*w*0.7);b.rotation.set((rnd()-.5)*0.5,0,(rnd()-.5)*0.5);b.castShadow=true;g.add(b);}
   return g;}},
 // ---- Pantallas y gráficos
 {type:'totem',name:'Tótem',cat:'Pantallas',icon:'▯',graphic:true,
  params:[{k:'w',label:'Ancho',min:30,max:120,step:5,def:60},{k:'d',label:'Fondo',min:10,max:60,step:5,def:35},{k:'h',label:'Alto',min:100,max:300,step:5,def:200}],
  colors:[{...C.main,def:'#1d1f24'},{...C.acc,label:'Pantalla',def:'#3d6fb3'}],
  build(e){const p=e.p,w=cm(p.w),d=cm(p.d),h=cm(p.h),g=new T.Group();
   g.add(mesh(new T.BoxGeometry(w,h,d),mat(e.c.main),0,h/2,0));
   const sc=new T.Mesh(new T.PlaneGeometry(w*0.84,h*0.45),new T.MeshStandardMaterial({color:e.c.acc,emissive:e.c.acc,emissiveIntensity:.35,roughness:.3}));sc.position.set(0,h*0.66,d/2+0.003);g.add(sc);
   if(e.img||e.text){const gp=new T.Mesh(new T.PlaneGeometry(w*0.84,h*0.25),graphicMat(e,e.c.main,'#ffffff',w*0.84/(h*0.25),{fit:'contain'}));gp.position.set(0,h*0.25,d/2+0.003);g.add(gp);}
   return g;}},
 {type:'screen',name:'Pantalla / videowall',cat:'Pantallas',icon:'▭',graphic:true,
  params:[{k:'w',label:'Ancho',min:50,max:800,step:10,def:300},{k:'h',label:'Alto',min:50,max:400,step:10,def:170},{k:'base',label:'Altura base',min:0,max:300,step:5,def:90}],
  colors:[{...C.main,label:'Marco',def:'#101114'},{...C.acc,label:'Pantalla',def:'#3d6fb3'}],
  build(e){const p=e.p,w=cm(p.w),h=cm(p.h),y=cm(p.base),g=new T.Group();
   g.add(mesh(new T.BoxGeometry(w+0.06,h+0.06,0.1),mat(e.c.main),0,y+h/2,0));
   const sc=new T.Mesh(new T.PlaneGeometry(w,h),(e.img||e.text)?graphicMat(e,e.c.acc,'#ffffff',w/h):new T.MeshStandardMaterial({color:e.c.acc,emissive:e.c.acc,emissiveIntensity:.35}));sc.position.set(0,y+h/2,0.051);g.add(sc);
   if(y>0.05)g.add(mesh(new T.BoxGeometry(0.1,y,0.1),mat(e.c.main),0,y/2,-0.02));return g;}},
];

// valores por defecto de un elemento nuevo
function create(type,extra={}){const d=LIBRARY.find(l=>l.type===type);if(!d)throw new Error('Elemento desconocido: '+type);
  const p={};d.params.forEach(q=>p[q.k]=q.def);const c={};(d.colors||[]).forEach(q=>c[q.k]=q.def);
  return Object.assign({id:'e'+Math.random().toString(36).slice(2,9),type,name:d.name,x:0,z:0,rot:0,p,c},extra,{p:Object.assign(p,extra.p||{}),c:Object.assign(c,extra.c||{})});}
// construye el 3D de un elemento del proyecto
function build(e){const d=LIBRARY.find(l=>l.type===e.type);if(!d)return new T.Group();
  d.params.forEach(q=>{if(e.p[q.k]==null)e.p[q.k]=q.def;});(d.colors||[]).forEach(q=>{if(e.c[q.k]==null)e.c[q.k]=q.def;});
  const g=d.build(e);g.position.set(cm(e.x),0,cm(e.z));g.rotation.y=-(e.rot||0)*Math.PI/180;g.userData.id=e.id;return g;}

window.GPLibrary={LIBRARY,create,build,def:t=>LIBRARY.find(l=>l.type===t)};
})();
