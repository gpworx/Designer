// =====================================================================
// GPworx Stand Configurator · COLOPLAST · EAU 2027 · Stand E01 (isla 10 × 6,5 m)
// ---------------------------------------------------------------------
// Secciones (busca "// ---------- nombre ----------"):
//   · materials / textures      → materiales y gráficos (images.js)
//   · library                   → mobiliario reutilizable (macetas del configurador GPworx)
//   · stand                     → elementos del stand según planta y alzados (cuadrícula 10 cm)
//   · hall                      → pabellón y stands vecinos según el plano de feria
//   · compliance                → cálculo en vivo de la normativa (70 % abierto · 50 % transparencia · > 4 m)
//   · camera / UI / measure     → vistas, selección, medición, cuadrícula
// Coordenadas del stand = planta: x 0→10 m (izquierda→derecha), z 0→6,5 m (arriba→abajo).
// En el plano de feria: x=0 es el lado NORTE (pasillo E), x=10 el SUR (pasillo D),
// z=0 el ESTE (hacia Medac E19) y z=6,5 el OESTE (pasillo junto al muro / Auditorium).
// =====================================================================
const VIEW_ONLY=!!window.GP_VIEW_ONLY;
if(VIEW_ONLY)document.documentElement.classList.add('view-only');
function main(IM){
const T=THREE;
const canvas=document.getElementById('c'),stage=document.getElementById('stage');
const renderer=new T.WebGLRenderer({canvas,antialias:true,preserveDrawingBuffer:true});
renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2));
renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;renderer.outputEncoding=T.sRGBEncoding;
const scene=new T.Scene();scene.background=new T.Color(0x1d1e21);scene.fog=new T.Fog(0x1d1e21,40,140);
const camera=new T.PerspectiveCamera(40,1,0.1,300);
const SX=10,SZ=6.5,FL=0.05; // medidas del stand y altura de moqueta
const W=(x,y,z)=>new T.Vector3(x-SX/2,y,z-SZ/2);

// ---------- lights ----------
scene.add(new T.HemisphereLight(0xf2f5ff,0x22252c,0.62));
const sun=new T.DirectionalLight(0xffffff,0.7);sun.position.set(-7,16,9);sun.castShadow=true;sun.shadow.mapSize.set(4096,4096);
Object.assign(sun.shadow.camera,{left:-14,right:14,top:14,bottom:-14,near:1,far:60});sun.shadow.bias=-0.0006;scene.add(sun);
const fill=new T.DirectionalLight(0xbfd6ff,0.3);fill.position.set(10,8,-8);scene.add(fill);

// ---------- materials / textures ----------
function tex(w,h,draw){const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);const t=new T.CanvasTexture(c);t.encoding=T.sRGBEncoding;t.anisotropy=8;return t;}
function cover(g,img,w,h,fx,fy){if(!img||!img.naturalWidth)return;fx=fx==null?.5:fx;fy=fy==null?.5:fy;const iw=img.naturalWidth,ih=img.naturalHeight,a=w/h;let sw,sh;if(iw/ih>a){sh=ih;sw=ih*a;}else{sw=iw;sh=iw/a;}g.drawImage(img,(iw-sw)*fx,(ih-sh)*fy,sw,sh,0,0,w,h);}
let seed=7;const rnd=()=>{seed=(seed*16807)%2147483647;return seed/2147483647;};
const woodTex=tex(512,512,(g,w,h)=>{g.fillStyle='#d3c1a6';g.fillRect(0,0,w,h);for(let i=0;i<90;i++){const x=rnd()*w,a=0.04+rnd()*0.09;g.strokeStyle=`rgba(${120+rnd()*40|0},${95+rnd()*30|0},70,${a})`;g.lineWidth=1+rnd()*3;g.beginPath();g.moveTo(x,0);for(let y=0;y<=h;y+=16)g.lineTo(x+Math.sin(y/70+i)*4,y);g.stroke();}});
const carpetTex=tex(256,256,(g,w,h)=>{g.fillStyle='#8a8e93';g.fillRect(0,0,w,h);for(let i=0;i<5000;i++){const v=110+rnd()*70|0;g.fillStyle=`rgba(${v},${v+2},${v+6},.45)`;g.fillRect(rnd()*w,rnd()*h,1+rnd()*2,1);}});
carpetTex.wrapS=carpetTex.wrapT=T.RepeatWrapping;carpetTex.repeat.set(10,6.5);
const M={
  wood:new T.MeshStandardMaterial({map:woodTex,roughness:.75}),
  teal:new T.MeshStandardMaterial({color:0x3c6878,roughness:.45}),
  white:new T.MeshStandardMaterial({color:0xf1f3f4,roughness:.35}),
  black:new T.MeshStandardMaterial({color:0x1a1b1e,roughness:.5}),
  carpet:new T.MeshStandardMaterial({map:carpetTex,roughness:.95}),
  fabric:new T.MeshStandardMaterial({color:0xcfd2d5,roughness:.9}),
  legs:new T.MeshStandardMaterial({color:0xc9ab82,roughness:.7}),
  hall:new T.MeshStandardMaterial({color:0x1f2023,roughness:.85}),
  glass:new T.MeshStandardMaterial({color:0xdcecf5,roughness:.05,transparent:true,opacity:.25,depthWrite:false,side:T.DoubleSide}),
  screen:new T.MeshBasicMaterial({color:0x2d7fd6}),
  light:new T.MeshBasicMaterial({color:0xffffff}),
};
const basic=t=>new T.MeshBasicMaterial({map:t,side:T.DoubleSide});
function logoMark(g,cx,cy,r,col){g.save();g.beginPath();g.arc(cx,cy,r,0,Math.PI*2);g.clip();g.fillStyle=col;g.fillRect(cx-r,cy,2*r,r);for(let k=0;k<5;k++){g.fillRect(cx-r,cy-r+k*r*0.2,2*r,r*0.11);}g.restore();}
function brandText(g,x,y,fs,col,align){g.save();g.fillStyle=col;g.font=`600 ${fs}px Helvetica,Arial`;g.textAlign=align||'left';g.textBaseline='middle';g.fillText('Coloplast',x,y);g.restore();}
const ringTex=tex(1024,1024,(g,w,h)=>{g.fillStyle='#ffffff';g.fillRect(0,0,w,h);logoMark(g,w*0.5,h*0.3,h*0.08,'#173f4d');g.save();g.translate(w/2,h*0.58);brandText(g,0,0,h*0.13,'#173f4d','center');g.restore();});
const graphic=(key,draw)=>tex(900,1200,(g,w,h)=>{g.fillStyle='#ffffff';g.fillRect(0,0,w,h);draw(g,w,h,IM[key]);});
const posterTex=graphic('poster',(g,w,h,im)=>{if(im&&im.naturalWidth){const s=w/im.naturalWidth;g.drawImage(im,0,0,w,im.naturalHeight*s);}});
// frente del almacén (125 × 297): gráfico de bosque recompuesto a partir de la imagen de 215 cm (marco de madera, puerta a la izquierda, logo arriba)
const frontTex=tex(505,1200,(g,w,h)=>{const im=IM.front,k=h/982;
  if(!im||!im.naturalWidth)return;const fx=Math.round(30*k);g.fillStyle='#c9b79d';g.fillRect(0,0,w,h);
  g.drawImage(im,380,40,300,915,fx,fx,w-2*fx,h-2*fx);            // bosque (zona derecha, sin puerta)
  const dw=w*0.5;g.drawImage(im,52,318,286,664,fx-2,318*k,dw,h-318*k); // puerta con su marco
  const lw=w-2*fx-30,lh=lw*110/478;g.drawImage(im,138,95,478,110,fx+15,100*k,lw,lh);}); // logo Coloplast
const totemTex=tex(400,1000,(g,w,h)=>{g.fillStyle='#f4f5f6';g.fillRect(0,0,w,h);const im=IM.totem;if(im&&im.naturalWidth){const s=w/im.naturalWidth;g.drawImage(im,0,0,w,im.naturalHeight*s);}});
const woodLogoTex=tex(864,208,(g,w,h)=>{const im=IM.woodlogo;if(im&&im.naturalWidth)g.drawImage(im,0,0,w,h);else{g.fillStyle='#d3c1a6';g.fillRect(0,0,w,h);}});

// ---------- helpers ----------
function add(m,p){m.castShadow=true;m.receiveShadow=true;p.add(m);return m;}
function box(p,x0,z0,x1,z1,y0,y1,mat){const m=new T.Mesh(new T.BoxGeometry(x1-x0,y1-y0,z1-z0),mat);m.position.copy(W((x0+x1)/2,(y0+y1)/2,(z0+z1)/2));return add(m,p);}
function cyl(p,x,z,r,y0,y1,mat,seg){const m=new T.Mesh(new T.CylinderGeometry(r,r,y1-y0,seg||24),mat);m.position.copy(W(x,(y0+y1)/2,z));return add(m,p);}
function plane(p,w,h,mat,pos,rotY){const m=new T.Mesh(new T.PlaneGeometry(w,h),mat);m.position.copy(pos);m.rotation.y=rotY||0;p.add(m);return m;}
function solid(p,s,y0,y1,mat){const m=new T.Mesh(new T.ExtrudeGeometry(s,{depth:y1-y0,bevelEnabled:false,curveSegments:32}),mat);m.rotation.x=Math.PI/2;m.position.y=y1;return add(m,p);}
function rr(x0,z0,x1,z1,r){const s=new T.Shape(),X0=x0-SX/2,X1=x1-SX/2,Z0=z0-SZ/2,Z1=z1-SZ/2;s.moveTo(X0+r,Z0);s.lineTo(X1-r,Z0);s.quadraticCurveTo(X1,Z0,X1,Z0+r);s.lineTo(X1,Z1-r);s.quadraticCurveTo(X1,Z1,X1-r,Z1);s.lineTo(X0+r,Z1);s.quadraticCurveTo(X0,Z1,X0,Z1-r);s.lineTo(X0,Z0+r);s.quadraticCurveTo(X0,Z0,X0+r,Z0);return s;}
function pillShape(x0,z0,x1,z1){const r=Math.min(x1-x0,z1-z0)/2;const s=new T.Shape(),X0=x0-SX/2,X1=x1-SX/2,Z0=z0-SZ/2,Z1=z1-SZ/2;
  if(x1-x0>=z1-z0){s.moveTo(X0+r,Z0);s.lineTo(X1-r,Z0);s.absarc(X1-r,(Z0+Z1)/2,r,-Math.PI/2,Math.PI/2,false);s.lineTo(X0+r,Z1);s.absarc(X0+r,(Z0+Z1)/2,r,Math.PI/2,3*Math.PI/2,false);}
  else{s.moveTo(X1,Z0+r);s.lineTo(X1,Z1-r);s.absarc((X0+X1)/2,Z1-r,r,0,Math.PI,false);s.lineTo(X0,Z0+r);s.absarc((X0+X1)/2,Z0+r,r,Math.PI,2*Math.PI,false);}return s;}
// marcar mallas que no cuentan como obstáculo de vista (cristal, suelo, plantas)
const tag=(m,k)=>{m.traverse(o=>{o.userData.kind=k;});return m;};

// ---------- library (biblioteca GPworx: macetas y mobiliario) ----------
const grassM=new T.MeshStandardMaterial({color:0x5f8a3e,roughness:.9}),leafM=new T.MeshStandardMaterial({color:0x2f6a31,roughness:.85}),leafM2=new T.MeshStandardMaterial({color:0x4b8a3a,roughness:.85});
function grassPot(p,x,z){box(p,x-0.15,z-0.15,x+0.15,z+0.15,FL,FL+0.32,M.wood);let s=(x*31+z*17)|0||5;const r=()=>{s=(s*16807+7)%2147483647;return (s%1000)/1000;};
  for(let k=0;k<22;k++){const hg=0.5+r()*0.55;const c=new T.Mesh(new T.ConeGeometry(0.022,hg,4),grassM);c.position.copy(W(x+(r()-.5)*0.2,FL+0.32+hg/2,z+(r()-.5)*0.2));c.rotation.set((r()-.5)*0.6,0,(r()-.5)*0.6);c.userData.kind='plant';p.add(c);}}
function lilyBox(p,x0,z0,x1,z1){box(p,x0,z0,x1,z1,FL,FL+0.55,M.wood);const along=(x1-x0)<(z1-z0),n=Math.max(2,Math.round(Math.max(x1-x0,z1-z0)/0.28));let s=((x0+z0)*97)|0||3;const r=()=>{s=(s*16807+11)%2147483647;return (s%1000)/1000;};
  for(let i=0;i<n;i++){const t=(i+.5)/n,x=along?(x0+x1)/2:x0+(x1-x0)*t,z=along?z0+(z1-z0)*t:(z0+z1)/2;
    for(let k=0;k<7;k++){const l=new T.Mesh(new T.SphereGeometry(0.13,10,6),k%2?leafM:leafM2);l.scale.set(1.5,0.08,0.55);l.position.copy(W(x+(r()-.5)*0.22,FL+0.62+r()*0.4,z+(r()-.5)*0.22));l.rotation.set((r()-.5)*1.6,r()*6,0.3+(r()-.5)*1.4);l.userData.kind='plant';add(l,p);}}}
function orchid(p,x,z){cyl(p,x,z,0.1,FL,FL+0.16,M.white,16);const l=new T.Mesh(new T.SphereGeometry(0.12,8,6),leafM);l.scale.set(1,0.4,1);l.position.copy(W(x,FL+0.2,z));l.userData.kind='plant';p.add(l);}
function armchair(p,x,z,face){const g=new T.Group();
  const seat=new T.Mesh(new T.CylinderGeometry(0.36,0.32,0.14,24),M.fabric);seat.position.y=0.45;g.add(seat);
  const back=new T.Mesh(new T.CylinderGeometry(0.37,0.34,0.42,24,1,true,Math.PI/2+0.35,Math.PI-0.7),M.fabric);back.material=M.fabric;back.position.y=0.68;g.add(back);
  const bk=new T.Mesh(new T.CylinderGeometry(0.37,0.34,0.42,24,1,true,Math.PI/2+0.35,Math.PI-0.7),new T.MeshStandardMaterial({color:0xcfd2d5,roughness:.9,side:T.BackSide}));bk.position.y=0.68;g.add(bk);
  [[.22,.22],[-.22,.22],[.22,-.22],[-.22,-.22]].forEach(q=>{const l=new T.Mesh(new T.CylinderGeometry(0.018,0.014,0.4,6),M.legs);l.position.set(q[0],0.2,q[1]);l.rotation.set(q[1]*0.6,0,-q[0]*0.6);g.add(l);});
  g.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}});g.position.copy(W(x,FL,z));g.rotation.y=face;p.add(g);return g;}
function sofa(p,x,z,face){const g=new T.Group();const B=(w,h,d,px,py,pz,m)=>{const b=new T.Mesh(new T.BoxGeometry(w,h,d),m);b.position.set(px,py,pz);b.castShadow=b.receiveShadow=true;g.add(b);};
  B(1.5,0.16,0.7,0,0.42,0,M.fabric);B(1.5,0.36,0.14,0,0.66,-0.3,M.fabric);B(0.14,0.24,0.7,-0.75,0.56,0,M.fabric);B(0.14,0.24,0.7,0.75,0.56,0,M.fabric);
  [[.65,.28],[-.65,.28],[.65,-.28],[-.65,-.28]].forEach(q=>{const l=new T.Mesh(new T.CylinderGeometry(0.018,0.014,0.36,6),M.legs);l.position.set(q[0],0.18,q[1]);g.add(l);});
  g.position.copy(W(x,FL,z));g.rotation.y=face;p.add(g);return g;}
function lowTable(p,x,z){cyl(p,x,z,0.25,FL+0.48,FL+0.51,M.white,32);[0,1,2].forEach(k=>{const a=k*2.1;cyl(p,x+0.14*Math.cos(a),z+0.14*Math.sin(a),0.014,FL,FL+0.48,M.legs,6);});
  box(p,x-0.09,z-0.06,x+0.09,z+0.06,FL+0.51,FL+0.52,M.black);}
function stool(p,x,z){cyl(p,x,z,0.21,FL+0.74,FL+0.79,M.white,24);[[.13,.13],[-.13,.13],[.13,-.13],[-.13,-.13]].forEach(q=>cyl(p,x+q[0],z+q[1],0.015,FL,FL+0.74,M.legs,6));cyl(p,x,z,0.17,FL+0.3,FL+0.32,M.legs,20);}
function highTable(p,x,z){cyl(p,x,z,0.32,FL+1.02,FL+1.05,M.white,32);cyl(p,x,z,0.035,FL,FL+1.02,M.white,10);cyl(p,x,z,0.24,FL,FL+0.03,M.white,24);
  for(let k=0;k<3;k++){const a=k*2*Math.PI/3+0.5,sx=x+0.6*Math.cos(a),sz=z+0.6*Math.sin(a);cyl(p,sx,sz,0.19,FL+0.74,FL+0.78,M.white,20);
    [[.12,.12],[-.12,.12],[.12,-.12],[-.12,-.12]].forEach(q=>cyl(p,sx+q[0],sz+q[1],0.014,FL,FL+0.74,M.legs,6));}}

// ---------- stand ----------
// Numeración y medidas según los planos de presentación (FLOOR PLAN · ELEVATIONS · ELEMENTS, cm)
const B=new T.Group();scene.add(B);let TG=B;const MOV=[],TEMPL={},ORIG=[];
const TYPES={pill:'Mostrador demo trasero',vit:'Mostrador demo lateral',fc:'Mostrador demo frontal',disp:'Expositor LED',ring:'Banner circular',trol:'Máquina cliente',tot:'Tótem demo retroiluminado',kio:'Mostrador de máquina',rec:'Barra en L',cab:'Almacén',lng:'Zona lounge',lily:'Jardinera larga',grass:'Jardinera cuadrada',ch:'Silla'};
function mov(key,type,fn){const G=new T.Group();B.add(G);TG=G;fn(G);TG=B;G.updateMatrixWorld(true);
  const bb=new T.Box3().setFromObject(G),c=bb.getCenter(new T.Vector3());
  G.children.forEach(ch=>{ch.position.x-=c.x;ch.position.z-=c.z;});G.position.set(c.x,0,c.z);
  G.userData={key,src:key,type,name:'',home:{x:c.x,z:c.z,r:0}};TEMPL[key]=G;ORIG.push(G);MOV.push(G);return G;}

// 1 · tarima 1000 × 650 × 5, moqueta gris · 5 · vinilo turquesa en cuarto de círculo R 150 (esquina frontal izquierda)
const floorM=box(B,0,0,SX,SZ,0,FL,M.carpet);tag(floorM,'floor');
{const s=new T.Shape(),X=-SX/2,Z=SZ/2;s.moveTo(X,Z);s.lineTo(X+1.5,Z);s.absarc(X,Z,1.5,0,-Math.PI/2,true);s.lineTo(X,Z);tag(solid(B,s,FL,FL+0.006,new T.MeshStandardMaterial({color:0x8fc3cc,roughness:.5})),'floor');}
// 14 · acceso 100 cm en el borde frontal (entre el mostrador de máquina y la barra)
{const pts=[[5.01,6.0],[6.02,6.0],[6.02,SZ-0.02],[5.01,SZ-0.02],[5.01,6.0]].map(q=>W(q[0],FL+0.01,q[1]));const l=new T.Line(new T.BufferGeometry().setFromPoints(pts),new T.LineDashedMaterial({color:0xffffff,dashSize:0.12,gapSize:0.08}));l.computeLineDistances();B.add(l);}

// 2 · mostradores demo (4): 200 × 50 (×2) atrás, 50 × 245 en el lateral izquierdo, 65 × 120 delante con poste de madera h 250
const pill=(x0,z0,x1,z1,logoAt,H)=>{const g=TG;H=H||1.05;solid(g,pillShape(x0+0.03,z0+0.03,x1-0.03,z1-0.03),FL,FL+0.08,M.white);solid(g,pillShape(x0,z0,x1,z1),FL+0.08,FL+H-0.05,M.wood);solid(g,pillShape(x0-0.02,z0-0.02,x1+0.02,z1+0.02),FL+H-0.05,FL+H,M.teal);
  const lm=new T.MeshBasicMaterial({map:woodLogoTex});
  if(logoAt==='z0')plane(g,0.9,0.22,lm,W((x0+x1)/2,FL+0.72,z0-0.004),Math.PI);
  if(logoAt==='x0')plane(g,0.9,0.22,lm,W(x0-0.004,FL+0.72,(z0+z1)/2),-Math.PI/2);};
mov('p1','pill',()=>pill(0.1,0.03,2.1,0.53,'z0'));
mov('p2','pill',()=>pill(2.76,0.03,4.76,0.53,'z0'));
mov('p3','vit',g=>{pill(0.13,1.89,0.63,4.34,'x0');tag(box(g,0.17,2.05,0.59,3.25,FL+1.05,FL+1.42,M.glass),'glass');});
mov('fc','fc',g=>{box(g,2.12,5.08,2.58,6.27,FL,FL+0.96,M.white);box(g,2.1,5.06,2.58,6.29,FL+0.96,FL+1.0,M.teal);box(g,2.58,5.08,2.76,6.27,FL,FL+2.5,M.wood);});
// 3 · expositor LED 30 × 155 × 210, blanco
mov('disp','disp',g=>{const x0=1.59,x1=1.89,z0=2.45,z1=4.0,H=FL+2.1;box(g,x0,z0,x1,z0+0.16,FL,H,M.white);box(g,x0,z1-0.16,x1,z1,FL,H,M.white);box(g,x0,z0,x1,z1,H-0.18,H,M.white);box(g,x0,z0,x1,z1,FL,FL+0.25,M.white);
  box(g,x0,z0+0.03,x0+0.02,z1-0.03,H-0.2,H-0.17,M.screen);box(g,x1-0.02,z0,x1,z0+0.16,FL,H,M.wood);box(g,x1-0.02,z1-0.16,x1,z1,FL,H,M.wood);
  tag(box(g,1.735,z0+0.16,1.745,z1-0.16,FL+0.25,H-0.18,M.glass),'glass');
  [0.7,1.1,1.5].forEach(y=>box(g,1.62,z0+0.16,1.86,z1-0.16,FL+y,FL+y+0.025,M.white));});
// 4 · banner circular Ø 300 × 30, textil ligero impreso, colgado de 500 a 530 cm
const RING={y0:5.0,y1:5.3};
mov('ring','ring',g=>{const cx=3.47,cz=3.21,R=1.5,h=RING.y1-RING.y0,ym=(RING.y0+RING.y1)/2;
  const o=new T.Mesh(new T.CylinderGeometry(R,R,h,72,1,true),new T.MeshStandardMaterial({color:0x3c6878,roughness:.6,side:T.DoubleSide}));o.position.copy(W(cx,ym,cz));add(o,g);
  const d=new T.Mesh(new T.CircleGeometry(R-0.02,72),new T.MeshBasicMaterial({map:ringTex}));d.rotation.x=-Math.PI/2;d.rotation.z=Math.PI/2;d.position.copy(W(cx,RING.y1-0.01,cz));g.add(d);
  const d2=new T.Mesh(new T.CircleGeometry(R-0.02,72),new T.MeshBasicMaterial({map:ringTex}));d2.rotation.x=Math.PI/2;d2.rotation.z=-Math.PI/2;d2.position.copy(W(cx,RING.y0+0.01,cz));g.add(d2);
  const cm=new T.LineBasicMaterial({color:0x8a8d94});[0,1,2,3].forEach(k=>{const a=k*Math.PI/2+Math.PI/4;const p=W(cx+R*0.95*Math.cos(a),RING.y1,cz+R*0.95*Math.sin(a));g.add(new T.Line(new T.BufferGeometry().setFromPoints([p,p.clone().setY(9)]),cm));});});
// 5 · máquina cliente ≈ 90 × 50 × 110 sobre el vinilo
mov('trol','trol',g=>{const s=new T.Group();g.add(s);s.position.copy(W(0.68,0,5.85));s.rotation.y=0.7;
  const b=(w,h,d,y,m,x)=>{const q=new T.Mesh(new T.BoxGeometry(w,h,d),m);q.position.set(x||0,y,0);q.castShadow=q.receiveShadow=true;s.add(q);};
  b(0.9,0.85,0.48,FL+0.16+0.425,M.white);b(0.3,0.8,0.5,FL+0.18+0.4,M.black,-0.32);b(0.92,0.05,0.5,FL+0.13,M.black);
  const sc=new T.Mesh(new T.BoxGeometry(0.3,0.03,0.22),M.black);sc.position.set(-0.3,FL+1.07,0);sc.rotation.z=0.5;s.add(sc);
  [[.37,.2],[-.37,.2],[.37,-.2],[-.37,-.2]].forEach(q=>{const w=new T.Mesh(new T.CylinderGeometry(0.05,0.05,0.04,12),M.black);w.rotation.x=Math.PI/2;w.position.set(q[0],FL+0.06,q[1]);s.add(w);});});
// 6 · tótem demo retroiluminado 115 × 65 × 240 con pantalla, en la cara del poste de madera
mov('tot','tot',g=>{plane(g,1.15,2.4,basic(totemTex),W(2.575,FL+1.2,5.675),-Math.PI/2);box(g,2.56,5.1,2.58,6.25,FL+2.36,FL+2.4,M.light);});
// 7 · mostrador de máquina 105 × 65 × 105
mov('kio','kio',g=>{box(g,3.42,5.85,4.32,6.38,FL,FL+0.4,M.teal);box(g,3.34,5.78,4.39,6.43,FL+0.4,FL+1.01,M.white);box(g,3.32,5.76,4.41,6.45,FL+1.01,FL+1.05,M.white);
  const mo=new T.Mesh(new T.BoxGeometry(0.48,0.3,0.03),M.black);mo.position.copy(W(3.87,FL+1.24,6.1));mo.rotation.x=-0.5;add(mo,g);cyl(g,3.87,6.16,0.03,FL+1.05,FL+1.16,M.black,8);});
// 8 · barra en L 120 × 215 × 100, acabado madera, cafetera
mov('rec','rec',g=>{const s=new T.Shape(),o=(x,z)=>[x-SX/2,z-SZ/2],r=0.25,P=[[6.3,2.15],[6.8,2.15],[6.8,3.81],[7.5,3.81],[7.5,4.3]];
  s.moveTo(...o(6.3,2.15));P.slice(1).forEach(q=>s.lineTo(...o(q[0],q[1])));s.lineTo(...o(6.3+r,4.3));s.quadraticCurveTo(...o(6.3,4.3),...o(6.3,4.3-r));s.lineTo(...o(6.3,2.15));
  solid(g,s,FL,FL+0.96,M.wood);const s2=new T.Shape();s2.moveTo(...o(6.28,2.15));[[6.82,2.15],[6.82,3.79],[7.5,3.79],[7.5,4.32]].forEach(q=>s2.lineTo(...o(q[0],q[1])));s2.lineTo(...o(6.3+r,4.32));s2.quadraticCurveTo(...o(6.28,4.32),...o(6.28,4.3-r));s2.lineTo(...o(6.28,2.15));solid(g,s2,FL+0.96,FL+1.0,M.teal);
  plane(g,0.9,0.22,new T.MeshBasicMaterial({map:woodLogoTex}),W(6.296,FL+0.7,3.1),-Math.PI/2);
  box(g,7.0,3.88,7.35,4.18,FL+1.0,FL+1.37,M.black);box(g,7.12,3.9,7.33,4.16,FL+1.0,FL+1.33,M.white);});
// 9 · almacén 245 × 125 × 297 (reducido de 215 para que el lado sur cumpla el 70 % abierto) con nevera dentro; frente: panel de madera + gráfico Coloplast (bosque y puerta)
// 12 · pared gráfica verde h 297 con logo en el frente del almacén
mov('cab','cab',g=>{const x0=7.55,x1=SX,z0=3.05,z1=4.3,Hh=2.97,H=FL+Hh;box(g,x0,z0,x1,z1,FL,H,M.wood);
  plane(g,z1-z0,Hh,basic(frontTex),W(x0-0.006,FL+Hh/2,(z0+z1)/2),-Math.PI/2);
  plane(g,1.58,Hh-0.05,basic(posterTex),W(9.12,FL+Hh/2,z1+0.006),0);
  plane(g,1.1,Hh-0.05,basic(posterTex),W(x1+0.006,FL+Hh/2,(z0+z1)/2),Math.PI/2);
  [[7.9,z1+0.25],[9.6,z1+0.25],[x0-0.25,3.35],[x0-0.25,4.0],[x1+0.25,3.35],[x1+0.25,4.0]].forEach(q=>{box(g,q[0]-0.12,q[1]-0.06,q[0]+0.12,q[1]+0.06,H+0.02,H+0.06,M.light);});});
// 10 · zonas lounge (2): sofá 150 + 2 butacas + mesa auxiliar Ø 50
mov('l1','lng',g=>{armchair(g,7.98,0.45,0.5);armchair(g,9.21,0.45,-0.5);lowTable(g,8.59,0.9);sofa(g,8.61,1.65,Math.PI);});
mov('l2','lng',g=>{sofa(g,8.6,4.82,0);lowTable(g,8.63,5.58);armchair(g,8.01,6.05,Math.PI-0.5);armchair(g,9.24,6.05,Math.PI+0.5);});
// 11 · jardineras: 30 × 150 (×2) en el borde derecho · 30 × 30 (×4) alrededor de los lounges (biblioteca GPworx)
mov('j1','lily',()=>lilyBox(TG,9.7,0.25,10.0,1.75));mov('j2','lily',()=>lilyBox(TG,9.7,4.75,10.0,6.25));
[[7.3,0.2],[7.62,1.65],[7.62,4.79],[7.3,6.18]].forEach((q,i)=>mov('g'+(i+1),'grass',()=>grassPot(TG,q[0],q[1])));
// 13 · sillas (2)
[[3.12,3.21],[3.82,3.21]].forEach((q,i)=>mov('c'+(i+1),'ch',()=>stool(TG,q[0],q[1]))); // centradas bajo el banner

// ---------- hall ----------
const common=new T.Group();scene.add(common);
const hallF=new T.Mesh(new T.PlaneGeometry(300,300),M.hall);hallF.rotation.x=-Math.PI/2;hallF.receiveShadow=true;common.add(hallF);
// plano de feria → coordenadas del stand. E01 = (390,492)-(495,655) px, 16,2 px/m
const PXM=16.2,OX=390,OY=492;
const fx=px=>(px-OX)/PXM,fy=py=>(py-OY)/PXM;           // este, sur (m) desde la esquina NO de E01
const toPlan=(a,b,c,d)=>({x0:fy(b),x1:fy(d),z0:SZ-fx(c),z1:SZ-fx(a)}); // norte→x=0, este→z=0
function fascia(name,len){return tex(Math.max(256,Math.round(len*110)),64,(g,w,h)=>{g.fillStyle='#e9ebef';g.fillRect(0,0,w,h);g.fillStyle='#2a2c31';g.textAlign='center';let fs=h*0.55;g.font=`bold ${fs}px Helvetica,Arial`;while(g.measureText(name).width>w*0.92){fs*=0.92;g.font=`bold ${fs}px Helvetica,Arial`;}g.fillText(name,w/2,h*0.68);});}
const exhMat=new T.MeshStandardMaterial({color:0x3d4047,roughness:.75}),exhFloor=new T.MeshStandardMaterial({color:0x4a4d55,roughness:.6}),exhLight=new T.MeshStandardMaterial({color:0xe6e8ec,roughness:.6});
const terraceM=new T.MeshStandardMaterial({color:0x8a6a52,roughness:.8}),plazaM=new T.MeshStandardMaterial({color:0x6b6e75,roughness:.8});
// [nombre, código, px x0,y0,x1,y1, tipo]  i = isla · t = terraza · p = plaza/sociedad
const EXH=[['MSD','G01',390,10,510,187,'i'],['BAYER','G19',566,10,832,187,'i'],['COOK','G31',897,27,1040,187,'i'],['INNOVEX','G37',1114,27,1186,187,'i'],['IPSEN','G41',1258,27,1355,187,'i'],
 ['ASTRAZENECA','F01',390,252,510,428,'i'],['JANSSEN','F19',566,252,832,428,'i'],['IMMUNITYBIO','F31',897,252,1027,414,'i'],['IBSA','F37',1098,252,1194,412,'i'],['EMS','F41',1267,252,1355,412,'i'],
 ['MEDAC','E19',566,494,639,654,'i'],['PFIZER','E25',687,494,832,654,'i'],['ACCORD','E31',897,494,1042,638,'i'],['PHOTOCURE','E37',1098,477,1194,589,'i'],['RED PINE','E41',1258,477,1355,589,'i'],
 ['MMS','D01',390,712,463,871,'i'],['RECORDATI','D19',519,712,639,871,'i'],['PROCEPT BIOROBOTICS','D25',688,712,832,871,'i'],['OLYMPUS','D31',897,703,1042,847,'i'],['POTENT','D37',1104,657,1194,831,'i'],['TERRACE','D41',1258,657,1355,1007,'t'],
 ['TERRACE','C01',390,928,600,1072,'t'],['QUANTA','C23',655,928,832,1072,'i'],['EUROPEAN UROLOGY','C31',898,928,960,1200,'p'],['INTUITIVE','C33',960,928,1009,1200,'i'],['MACROLUX','C37',1074,896,1186,1023,'i'],
 ['PIERRE FABRE','B01',390,1121,566,1265,'i'],['KARL STORZ','B23',639,1121,832,1265,'i'],['PATIENT ADVOCACY PLAZA','B37',1114,1072,1339,1265,'p']];
function label4(n,x0,z0,x1,z1,y){const lx=x1-x0,lz=z1-z0,fX=basic(fascia(n,lx)),fZ=basic(fascia(n,lz));
  plane(common,lx,0.45,fX,W((x0+x1)/2,y,z1+0.012),0);plane(common,lx,0.45,fX,W((x0+x1)/2,y,z0-0.012),Math.PI);
  plane(common,lz,0.45,fZ,W(x1+0.012,y,(z0+z1)/2),Math.PI/2);plane(common,lz,0.45,fZ,W(x0-0.012,y,(z0+z1)/2),-Math.PI/2);}
const NEIGH=[];
EXH.forEach(e=>{const [n,code,a,b,c,d,k]=e;const P=toPlan(a,b,c,d),x0=P.x0+0.15,x1=P.x1-0.15,z0=P.z0+0.15,z1=P.z1-0.15,w=x1-x0,dd=z1-z0,cx=(x0+x1)/2,cz=(z0+z1)/2;
  NEIGH.push({n,code,x0,x1,z0,z1});
  if(k==='t'){box(common,x0,z0,x1,z1,0,0.05,terraceM);for(let i=0;i<Math.floor(w/2.2);i++)for(let j=0;j<Math.floor(dd/2.2);j++){const tx=x0+1.1+i*2.2,tz=z0+1.1+j*2.2;cyl(common,tx,tz,0.4,0.72,0.75,exhLight);cyl(common,tx,tz,0.04,0.05,0.72,exhMat,8);}label4(n,cx-0.6,cz-0.6,cx+0.6,cz+0.6,0.4);return;}
  box(common,x0,z0,x1,z1,0,0.06,k==='p'?plazaM:exhFloor);
  // vecino conforme: núcleo ≤ 30 % de cada lado (≥ 70 % abierto) y h ≤ 3,5 m; mostradores < 1,2 m
  const cw=Math.max(0.6,w*0.28),cd=Math.max(0.6,dd*0.28),big=w*dd>=90,hc=k==='p'?2.5:(big?3.5:3.0);
  box(common,cx-cw/2,cz-cd/2,cx+cw/2,cz+cd/2,0.06,hc,exhMat);box(common,cx-cw/2-0.02,cz-cd/2-0.02,cx+cw/2+0.02,cz+cd/2+0.02,hc-0.55,hc-0.05,exhLight);
  label4(n,cx-cw/2-0.03,cz-cd/2-0.03,cx+cw/2+0.03,cz+cd/2+0.03,hc-0.3);
  const cl=Math.min(2.0,w*0.35);box(common,cx-cl/2,z0+0.3,cx+cl/2,z0+0.75,0.06,1.1,exhLight);box(common,cx-cl/2,z1-0.75,cx+cl/2,z1-0.3,0.06,1.1,exhLight);
  if(w>4&&dd>4)[[x0+0.9,z0+0.9],[x1-0.9,z1-0.9]].forEach(q=>{cyl(common,q[0],q[1],0.3,1.0,1.04,exhLight);cyl(common,q[0],q[1],0.04,0.06,1.0,exhMat,8);});
  // código del stand en el suelo
  const st=tex(256,128,(g,w2,h2)=>{g.fillStyle='rgba(0,0,0,0)';g.clearRect(0,0,w2,h2);g.fillStyle='#9fb6d6';g.font='bold 80px Helvetica,Arial';g.textAlign='center';g.fillText(code,w2/2,95);});
  const sp=new T.Mesh(new T.PlaneGeometry(1.6,0.8),new T.MeshBasicMaterial({map:st,transparent:true,depthWrite:false}));sp.rotation.x=-Math.PI/2;sp.rotation.z=Math.PI/2;sp.position.copy(W(x0+0.7,0.07,z1-0.6));common.add(sp);});
// muros del pabellón (líneas negras gruesas del plano) y bandas de catering
const wallM=new T.MeshStandardMaterial({color:0x34353a,roughness:.9});
{const zl=SZ-fx(321),zr=SZ-fx(1416),y0=fy(0)-2,y1=fy(1270)+2;
 // accesos al pabellón (flechas del plano): 3 desde el eURO Auditorium 1 (oeste) y 2 desde EGPT / Session Rooms / Green Area (este)
 const ACC={w:[113,230,352],e:[230,352]},AW=4.0; // ancho libre de cada acceso (m)
 const wallSegs=(list,z0,z1)=>{let a=y0;list.map(py=>fy(py)).forEach(c=>{box(common,a,z0,c-AW/2,z1,0,6,wallM);box(common,c-AW/2,z0,c+AW/2,z1,3.2,6,wallM);a=c+AW/2;});box(common,a,z0,y1,z1,0,6,wallM);};
 wallSegs(ACC.w,zl,zl+0.35);wallSegs(ACC.e,zr-0.35,zr);
 const arrow=(x,z,toPlusZ,col)=>{const sh=new T.Shape();sh.moveTo(-0.35,0);sh.lineTo(0.35,0);sh.lineTo(0.35,1.3);sh.lineTo(0.75,1.3);sh.lineTo(0,2.3);sh.lineTo(-0.75,1.3);sh.lineTo(-0.35,1.3);sh.lineTo(-0.35,0);
   const m=new T.Mesh(new T.ShapeGeometry(sh),new T.MeshBasicMaterial({color:col}));m.rotation.x=-Math.PI/2;if(toPlusZ)m.rotation.z=Math.PI;const g=new T.Group();g.add(m);g.position.copy(W(x,0.03,z));common.add(g);};
 const accTex=(txt,col)=>tex(1024,200,(g,w,h)=>{g.fillStyle=col;g.fillRect(0,0,w,h);g.fillStyle='#fff';let fs=74;g.font=`bold ${fs}px Helvetica,Arial`;while(g.measureText(txt).width>w*0.9){fs-=2;g.font=`bold ${fs}px Helvetica,Arial`;}g.textAlign='center';g.fillText(txt,w/2,h*0.62);});
 const tW=accTex('ACCESO · eURO AUDITORIUM 1','#e07b39'),tE=accTex('ACCESO · EGPT · SESSION ROOMS','#1f8f55');
 ACC.w.forEach(py=>{const x=fy(py);arrow(x-0.6,zl-2.8,true,0xe07b39);arrow(x+0.6,zl-0.5,false,0x1f5fa8);plane(common,AW,0.78,basic(tW),W(x,3.65,zl-0.01),Math.PI);plane(common,AW,0.78,basic(tW),W(x,3.65,zl+0.36),0);});
 ACC.e.forEach(py=>{const x=fy(py);arrow(x-0.6,zr+0.5,true,0x1f5fa8);arrow(x+0.6,zr+2.8,false,0x1f8f55);plane(common,AW,0.78,basic(tE),W(x,3.65,zr+0.01),0);plane(common,AW,0.78,basic(tE),W(x,3.65,zr-0.36),Math.PI);});
 // rótulos de las zonas exteriores
 const sign=(txt,col,x,z,rot)=>{const t=tex(1024,256,(g,w,h)=>{g.fillStyle=col;g.fillRect(0,0,w,h);g.fillStyle='#fff';g.font='bold 86px Helvetica,Arial';g.textAlign='center';g.fillText(txt,w/2,h*0.64);});plane(common,6,1.5,basic(t),W(x,4.8,z),rot);};
 sign('eURO AUDITORIUM 1','#e07b39',fy(230),zl+3,0);sign('EGPT · SESSION ROOMS · GREEN AREA','#1f8f55',fy(290),zr-3,Math.PI);
 const cat=new T.MeshStandardMaterial({color:0x8a5a3c,roughness:.8});box(common,fy(780),zl+0.35,fy(1250),SZ-fx(205),0,0.04,cat);box(common,fy(0),SZ-fx(1530),fy(165),zr-0.35,0,0.04,cat);box(common,fy(655),SZ-fx(1530),fy(1010),zr-0.35,0,0.04,cat);
 // letras de pasillo
 [['F',214],['E',460],['D',676],['C',890],['B',1100]].forEach(([L,py])=>{const t=tex(256,256,(g,w,h)=>{g.clearRect(0,0,w,h);g.fillStyle='#b23b3b';g.font='bold 210px Helvetica,Arial';g.textAlign='center';g.fillText(L,w/2,205);});
   const m=new T.Mesh(new T.PlaneGeometry(2.4,2.4),new T.MeshBasicMaterial({map:t,transparent:true,depthWrite:false}));m.rotation.x=-Math.PI/2;m.rotation.z=Math.PI/2;m.position.copy(W(fy(py),0.03,SZ-fx(866)));common.add(m);});
}

// ---------- compliance ----------
// Lados del stand (planta): N x=0 · S x=10 · E z=0 · O z=6,5. Todos dan a pasillo (isla).
const SIDES=[
 {id:'N',name:'Norte',aisle:'Pasillo E · frente a AstraZeneca (F01)',len:SZ,o:(t,y)=>W(-0.05,y,t),d:new T.Vector3(1,0,0),depth:SX},
 {id:'S',name:'Sur',aisle:'Pasillo D · frente a MMS (D01)',len:SZ,o:(t,y)=>W(SX+0.05,y,SZ-t),d:new T.Vector3(-1,0,0),depth:SX},
 {id:'E',name:'Este',aisle:'Pasillo hacia Medac (E19)',len:SX,o:(t,y)=>W(SX-t,y,-0.05),d:new T.Vector3(0,0,1),depth:SZ},
 {id:'O',name:'Oeste',aisle:'Pasillo junto al muro · Auditorium',len:SX,o:(t,y)=>W(t,y,SZ+0.05),d:new T.Vector3(0,0,-1),depth:SZ}];
const RULE={h0:1.2,h1:3.0,band:1.0,step:0.05,dy:0.1,open:70,see:50,tall:4.0};
let countPlants=false;
const rc=new T.Raycaster();
function obstacles(){const L=[];B.updateMatrixWorld(true);B.traverse(o=>{if(!o.isMesh||!o.visible)return;const k=o.userData.kind;if(k==='floor'||k==='glass')return;if(k==='plant'&&!countPlants)return;
  if(o.material&&o.material.transparent&&o.material.opacity<0.5)return;
  if(!o.geometry.boundingBox)o.geometry.computeBoundingBox();const bb=o.geometry.boundingBox.clone().applyMatrix4(o.matrixWorld);if(bb.max.y<=RULE.h0||bb.min.y>=RULE.h1)return;L.push(o);});return L;}
function compute(){const L=obstacles(),R={};
  SIDES.forEach(s=>{const nc=Math.round(s.len/RULE.step),nh=Math.round((RULE.h1-RULE.h0)/RULE.dy);const near=new Uint8Array(nc*nh),far=new Uint8Array(nc*nh);let colsClosed=0,cellsBlocked=0;
    rc.far=s.depth+0.1;
    for(let i=0;i<nc;i++){const t=(i+.5)*RULE.step;let cl=false;
      for(let j=0;j<nh;j++){const y=RULE.h0+(j+.5)*RULE.dy;rc.set(s.o(t,y),s.d);const h=rc.intersectObjects(L,false);
        if(h.length){cellsBlocked++;if(h[0].distance<=RULE.band+0.05){near[i*nh+j]=1;cl=true;}else far[i*nh+j]=1;}}
      if(cl)colsClosed++;}
    R[s.id]={nc,nh,near,far,open:100*(1-colsClosed/nc),see:100*(1-cellsBlocked/(nc*nh)),closedLen:colsClosed*RULE.step};});
  return R;}
function tallItems(){const out=[];MOV.forEach(G=>{G.updateMatrixWorld(true);const bb=new T.Box3();G.traverse(o=>{if(o.isMesh){if(!o.geometry.boundingBox)o.geometry.computeBoundingBox();bb.union(o.geometry.boundingBox.clone().applyMatrix4(o.matrixWorld));}});if(bb.max.y>RULE.tall)out.push({G,h:bb.max.y,y0:bb.min.y});});return out;}
// bandas de color en el borde: verde abierto · rojo cerrado (elemento > 1,2 m a ≤ 1 m del borde)
const edgeG=new T.Group();scene.add(edgeG);
const okM=new T.MeshBasicMaterial({color:0x2fbf71}),koM=new T.MeshBasicMaterial({color:0xe0483e}),bandM=new T.MeshBasicMaterial({color:0xffb020,transparent:true,opacity:.14,depthWrite:false});
const bandG=new T.Group();scene.add(bandG);bandG.visible=false;
[[0,0,RULE.band,SZ],[SX-RULE.band,0,SX,SZ],[RULE.band,0,SX-RULE.band,RULE.band],[RULE.band,SZ-RULE.band,SX-RULE.band,SZ]].forEach(a=>{const m=new T.Mesh(new T.PlaneGeometry(a[2]-a[0],a[3]-a[1]),bandM);m.rotation.x=-Math.PI/2;m.position.copy(W((a[0]+a[2])/2,FL+0.012,(a[1]+a[3])/2));bandG.add(m);});
function drawEdges(R){edgeG.clear();SIDES.forEach(s=>{const r=R[s.id];let st=0,cur=null;
  const closedAt=i=>{for(let j=0;j<r.nh;j++)if(r.near[i*r.nh+j])return true;return false;};
  const flush=(a,b,cl)=>{const t0=a*RULE.step,t1=b*RULE.step,p0=s.o(t0,FL+0.03),p1=s.o(t1,FL+0.03);const len=t1-t0;const m=new T.Mesh(new T.BoxGeometry(1,0.05,1),cl?koM:okM);
    m.position.copy(p0).add(p1).multiplyScalar(.5);if(Math.abs(s.d.x)>0){m.scale.set(0.1,1,len);}else{m.scale.set(len,1,0.1);}edgeG.add(m);};
  for(let i=0;i<=r.nc;i++){const c=i<r.nc?closedAt(i):null;if(i===0){cur=c;st=0;continue;}if(c!==cur){flush(st,i,cur);st=i;cur=c;}}});}

// ---------- camera ----------
const target=new T.Vector3(0,1.3,0);let th=-0.85,ph=1.05,rad=19,auto=false,anim=null;
const VIEWS={main:[-0.85,1.05,19],top:[Math.PI/2,0.02,17],N:[-Math.PI/2,1.5,13],S:[Math.PI/2,1.5,13],E:[Math.PI,1.5,17],O:[0,1.5,17],hall:[-0.6,0.75,62],acc:[Math.PI+0.35,1.08,26,-21.2,6.2]};
let clipK=null;const HALF={N:SX/2,S:SX/2,E:SZ/2,O:SZ/2};
const T0=new T.Vector3(0,1.3,0);
function setView(k){const v=VIEWS[k];anim={from:[th,ph,rad],to:v,t:0,fT:target.clone(),tT:v.length>3?new T.Vector3(v[3],1.3,v[4]):T0.clone()};clipK=HALF[k]!=null?k:null;if(!clipK){camera.near=0.1;camera.updateProjectionMatrix();}}
function upd(){camera.position.set(target.x+rad*Math.sin(ph)*Math.sin(th),target.y+rad*Math.cos(ph),target.z+rad*Math.sin(ph)*Math.cos(th));camera.lookAt(target);}

// ---------- selection & edit ----------
let drag=null,itemDrag=null,sel=null,downAt=null,selBox=null,pinch=null;
const ray=new T.Raycaster(),ndc=new T.Vector2(),ground=new T.Plane(new T.Vector3(0,1,0),-FL),hitP=new T.Vector3();
function setNdc(e){const r=canvas.getBoundingClientRect();ndc.set((e.clientX-r.left)/r.width*2-1,-((e.clientY-r.top)/r.height)*2+1);ray.setFromCamera(ndc,camera);}
function pick(e){setNdc(e);const h=ray.intersectObjects(B.children,true);for(const x of h){if(!x.object.visible||x.object===floorM)continue;let o=x.object;while(o&&o.parent!==B)o=o.parent;if(o&&MOV.includes(o))return o;}return null;}
const LS='coloplast-eau27-v2';let uid=0;
function save(){if(VIEW_ONLY)return;try{localStorage.setItem(LS,JSON.stringify(MOV.map(G=>({k:G.userData.key,s:G.userData.src,x:+G.position.x.toFixed(3),z:+G.position.z.toFixed(3),r:+G.rotation.y.toFixed(4)}))));}catch(_){}}
function cloneOf(src,key){const G=src.clone(true);G.userData={key,src:src.userData.src,type:src.userData.type,name:'',home:{x:src.position.x,z:src.position.z,r:0}};return G;}
function place(G,x,z,r){G.position.x=x;G.position.z=z;G.rotation.y=r||0;if(!B.children.includes(G))B.add(G);if(!MOV.includes(G))MOV.push(G);}
function unplace(G){B.remove(G);const i=MOV.indexOf(G);if(i>=0)MOV.splice(i,1);}
function renameAll(){Object.keys(TYPES).forEach(t=>{const L=MOV.filter(G=>G.userData.type===t);L.forEach((G,i)=>G.userData.name=TYPES[t]+(L.length>1?' '+(i+1):''));});}
function load(){try{const a=JSON.parse(localStorage.getItem(LS)||'null');if(Array.isArray(a)){ORIG.forEach(unplace);a.forEach(e=>{const T0=TEMPL[e.s];if(!T0)return;let G=TEMPL[e.k];if(!G||MOV.includes(G))G=cloneOf(T0,e.k||('n'+(uid++)));place(G,e.x,e.z,e.r);});}}catch(_){}renameAll();}
function clampPos(G){G.position.x=Math.min(SX/2,Math.max(-SX/2,Math.round(G.position.x/0.05)*0.05));G.position.z=Math.min(SZ/2,Math.max(-SZ/2,Math.round(G.position.z/0.05)*0.05));}
function addOf(type,from){const L=MOV.filter(G=>G.userData.type===type);const src=from||L[L.length-1]||ORIG.find(G=>G.userData.type===type);const G=cloneOf(src,'n'+Date.now().toString(36)+(uid++));
  place(G,src.position.x+0.6,src.position.z+0.6,src.rotation.y);clampPos(G);G.userData.home={x:G.position.x,z:G.position.z,r:0};renameAll();changed();select(G);}
function removeOf(type,G){if(!G){const L=MOV.filter(o=>o.userData.type===type);G=(sel&&sel.userData.type===type)?sel:L[L.length-1];}if(!G)return;if(sel===G)select(null);unplace(G);renameAll();changed();}
const fmt=n=>n.toFixed(2).replace('.',',');
function selInfo(){if(!sel)return;const d=Math.round(((-sel.rotation.y*180/Math.PI)%360+360)%360);document.getElementById('selP').textContent=`X ${fmt(sel.position.x+SX/2)} m · Y ${fmt(sel.position.z+SZ/2)} m · giro ${d}°`;}
function select(G){sel=G;if(selBox){scene.remove(selBox);selBox=null;}const p=document.getElementById('sel');stage.classList.toggle('editing',!!G);p.hidden=!G;
  document.querySelectorAll('#legend li').forEach(li=>li.classList.toggle('on',!!(G&&li.dataset.t===G.userData.type)));
  if(!G)return;selBox=new T.BoxHelper(G,0xffb020);selBox.material.depthTest=false;selBox.renderOrder=9;scene.add(selBox);document.getElementById('selN').textContent=G.userData.name;selInfo();}

// ---------- grid & measure ----------
const gridG=new T.Group();gridG.visible=false;scene.add(gridG);
{const pts=[];for(let x=0;x<=SX;x++)pts.push(W(x,FL+0.004,0),W(x,FL+0.004,SZ));for(let z=0;z<=6;z++)pts.push(W(0,FL+0.004,z),W(SX,FL+0.004,z));pts.push(W(0,FL+0.004,SZ),W(SX,FL+0.004,SZ));gridG.add(new T.LineSegments(new T.BufferGeometry().setFromPoints(pts),new T.LineBasicMaterial({color:0xd9dbe0})));}
document.getElementById('gridBtn').onclick=e=>{gridG.visible=!gridG.visible;e.currentTarget.classList.toggle('on',gridG.visible);e.currentTarget.setAttribute('aria-pressed',gridG.visible);};
const measG=new T.Group();scene.add(measG);const mlWrap=document.getElementById('mlabels');
const mMat=new T.LineBasicMaterial({color:0xffb020,depthTest:false,transparent:true}),dGeo=new T.SphereGeometry(0.045,14,10),dMat=new T.MeshBasicMaterial({color:0xffb020,depthTest:false,transparent:true});
let measOn=false,MEAS=[],pend=null;
function mHit(e){setNdc(e);const h=ray.intersectObjects([B,common],true).find(x=>x.object.isMesh&&x.object.visible);if(h)return h.point.clone();const p=new T.Vector3();return ray.ray.intersectPlane(ground,p)?p:null;}
function mDot(p){const d=new T.Mesh(dGeo,dMat);d.position.copy(p);d.renderOrder=11;measG.add(d);return d;}
function mLine(a,b){const l=new T.Line(new T.BufferGeometry().setFromPoints([a,b]),mMat);l.renderOrder=11;measG.add(l);return l;}
function mLabel(pv){const el=document.createElement('div');el.className='ml'+(pv?' pv':'');mlWrap.appendChild(el);return el;}
const cm=(a,b)=>Math.round(a.distanceTo(b)*100).toLocaleString('es-ES')+' cm';
function mSet(o,b){o.b=b;o.line.geometry.setFromPoints([o.a,b]);o.el.textContent=cm(o.a,b);}
function measClick(e){const p=mHit(e);if(!p)return;if(!pend){pend={a:p,da:mDot(p),line:mLine(p,p),el:mLabel(true),b:p};pend.el.textContent='0 cm';return;}
  mSet(pend,p);pend.db=mDot(p);pend.el.classList.remove('pv');MEAS.push(pend);pend=null;document.getElementById('measClr').hidden=false;}
function measHover(e){if(!pend)return;const p=mHit(e);if(p)mSet(pend,p);}
function measClear(){measG.clear();mlWrap.innerHTML='';MEAS=[];pend=null;document.getElementById('measClr').hidden=true;}
function measMode(on){measOn=on;if(on)select(null);if(!on&&pend){measG.remove(pend.da,pend.line);pend.el.remove();pend=null;}
  const b=document.getElementById('measBtn');b.classList.toggle('on',on);b.setAttribute('aria-pressed',on);stage.classList.toggle('measuring',on);document.getElementById('mhint').hidden=!on;}
document.getElementById('measBtn').onclick=()=>measMode(!measOn);document.getElementById('measClr').onclick=measClear;
window.addEventListener('keydown',e=>{if(e.key==='Escape'&&measOn)measMode(false);});

// ---------- pointer ----------
let lastCalc=0;
canvas.addEventListener('pointerdown',e=>{if(pinch)return;anim=null;canvas.setPointerCapture(e.pointerId);downAt={x:e.clientX,y:e.clientY};
  if(measOn){drag={x:e.clientX,y:e.clientY};return;}const G=VIEW_ONLY?null:pick(e);
  if(G){select(G);if(ray.ray.intersectPlane(ground,hitP)){itemDrag={G,dx:G.position.x-hitP.x,dz:G.position.z-hitP.z,moved:false};auto=false;stage.classList.add('dragging');}return;}
  drag={x:e.clientX,y:e.clientY};});
canvas.addEventListener('pointermove',e=>{if(measOn&&!drag&&e.pointerType==='mouse')measHover(e);
  if(itemDrag){if(pinch){itemDrag=null;return;}setNdc(e);if(ray.ray.intersectPlane(ground,hitP)){const G=itemDrag.G;G.position.x=hitP.x+itemDrag.dx;G.position.z=hitP.z+itemDrag.dz;clampPos(G);itemDrag.moved=true;selInfo();
      const now=performance.now();if(now-lastCalc>140){lastCalc=now;runCheck();}}return;}
  if(!drag||pinch)return;if(clipK){clipK=null;camera.near=0.1;camera.updateProjectionMatrix();}th-=(e.clientX-drag.x)*0.006;ph=Math.min(1.55,Math.max(0.02,ph-(e.clientY-drag.y)*0.005));drag={x:e.clientX,y:e.clientY};});
canvas.addEventListener('pointerup',e=>{if(itemDrag){if(itemDrag.moved)changed();itemDrag=null;stage.classList.remove('dragging');return;}
  if(drag&&downAt&&Math.hypot(e.clientX-downAt.x,e.clientY-downAt.y)<6){if(measOn)measClick(e);else select(null);}drag=null;});
canvas.addEventListener('pointercancel',()=>{drag=null;if(itemDrag){changed();itemDrag=null;}stage.classList.remove('dragging');});
canvas.addEventListener('wheel',e=>{e.preventDefault();rad=Math.min(120,Math.max(5,rad*(1+e.deltaY*0.001)));},{passive:false});
canvas.addEventListener('touchstart',e=>{if(e.touches.length===2)pinch=Math.hypot(e.touches[0].clientX-e.touches[1].clientX,e.touches[0].clientY-e.touches[1].clientY);},{passive:true});
canvas.addEventListener('touchmove',e=>{if(pinch&&e.touches.length===2){const d=Math.hypot(e.touches[0].clientX-e.touches[1].clientX,e.touches[0].clientY-e.touches[1].clientY);rad=Math.min(120,Math.max(5,rad*pinch/d));pinch=d;}},{passive:true});
canvas.addEventListener('touchend',()=>{pinch=null;});canvas.style.touchAction='none';
document.querySelectorAll('#sel button[data-r]').forEach(b=>b.onclick=()=>{if(!sel)return;sel.rotation.y-=(+b.dataset.r)*Math.PI/180;changed();selInfo();});
document.getElementById('selHome').onclick=()=>{if(!sel)return;const h=sel.userData.home;sel.position.x=h.x;sel.position.z=h.z;sel.rotation.y=0;changed();selInfo();};
document.getElementById('selX').onclick=()=>select(null);
document.getElementById('selDup').onclick=()=>{if(sel)addOf(sel.userData.type,sel);};
document.getElementById('selDel').onclick=()=>{if(sel)removeOf(sel.userData.type,sel);};
window.addEventListener('keydown',e=>{if(!sel||/INPUT|TEXTAREA/.test(document.activeElement.tagName))return;if(e.key==='Delete'||e.key==='Backspace'){e.preventDefault();removeOf(sel.userData.type,sel);}});
let rT=null;document.getElementById('resetAll').onclick=e=>{const b=e.currentTarget;if(!rT){b.textContent='¿Seguro? Pulsa otra vez';b.classList.add('on');rT=setTimeout(()=>{rT=null;b.textContent='Reset';b.classList.remove('on');},3000);return;}
  clearTimeout(rT);rT=null;b.textContent='Reset';b.classList.remove('on');select(null);MOV.slice().forEach(unplace);ORIG.forEach(G=>{const h=G.userData.home;place(G,h.x,h.z,0);});renameAll();changed();};

// ---------- UI ----------
// leyenda = tabla ELEMENTS de la presentación: [tipo|null, nº, descripción, medidas (cm) · nota, punto del marcador, plantilla]
const LEG=[
 [null,'1','Tarima','1000 × 650 × 5 · moqueta gris',W(5.4,FL+0.05,5.6)],
 ['pill','2','Mostrador demo trasero','200 × 50 (×2) · extremos redondeados',W(1.1,1.35,0.28),'p1'],
 ['vit','2','Mostrador demo lateral','50 × 245 · con vitrina',W(0.38,1.7,3.1),'p3'],
 ['fc','2','Mostrador demo frontal','65 × 120 · poste de madera h 250',W(2.35,1.3,5.67),'fc'],
 ['disp','3','Expositor LED','30 × 155 × 210 · blanco',W(1.74,2.4,3.22),'disp'],
 ['ring','4','Banner circular','Ø 300 × 30 · textil · colgado de 500 a 530',W(3.47,4.7,3.21),'ring'],
 ['trol','5','Máquina cliente','≈ 90 × 50 × 110 · vinilo R 150',W(0.7,1.45,5.85),'trol'],
 ['tot','6','Tótem demo retroiluminado','115 × 65 × 240 · con pantalla',W(2.57,2.75,5.67),'tot'],
 ['kio','7','Mostrador de máquina','105 × 65 × 105',W(3.87,1.6,6.1),'kio'],
 ['rec','8','Barra en L','120 × 215 × 100 · madera · cafetera',W(6.55,1.35,2.6),'rec'],
 ['cab','9','Almacén','245 × 125 × 297 · nevera dentro · frente madera + gráfico',W(8.8,3.35,3.68),'cab'],
 ['lng','10','Zona lounge','sofá 150 + 2 butacas + mesa Ø 50',W(8.6,1.2,1.4),'l1'],
 ['lily','11','Jardinera larga','30 × 150 (×2)',W(9.85,1.25,1.0),'j1'],
 ['grass','11','Jardinera cuadrada','30 × 30 (×4)',W(7.3,1.5,0.2),'g1'],
 [null,'12','Pared gráfica verde con logo','h 297 · frente del almacén (125) · baldas blancas 245 × 50 × 100',W(7.5,2.4,3.9)],
 ['ch','13','Silla','centradas bajo el banner',W(3.12,1.1,3.21),'c1'],
 [null,'14','Acceso','100 · borde frontal',W(5.5,FL+0.05,6.25)]];
LEG.forEach(m=>{if(!m[0])return;const G=TEMPL[m[5]];G.updateMatrixWorld(true);m[6]=G.worldToLocal(m[4].clone());});
const mkWrap=document.getElementById('markers');let MKS=[];
function renderLegend(){document.getElementById('legend').innerHTML=LEG.map(m=>{const lab=`<span class="nm">${m[2]}<small>${m[3]}</small></span>`;
    if(!m[0]||VIEW_ONLY)return `<li class="st"><span class="pm"><b>${m[1]}</b></span>${lab}</li>`;
    const n=MOV.filter(G=>G.userData.type===m[0]).length;
    return `<li class="mv" data-t="${m[0]}"><span class="pm"><button type="button" data-a="-" aria-label="Quitar ${m[2]}"${n?'':' disabled'}>−</button><b>${m[1]}</b><button type="button" data-a="+" aria-label="Añadir ${m[2]}">+</button></span>${lab}<i class="ct">×${n}</i></li>`;}).join('');
  document.querySelectorAll('#legend li.mv').forEach(li=>{const t=li.dataset.t;li.querySelector('[data-a="+"]').onclick=e=>{e.stopPropagation();addOf(t);};li.querySelector('[data-a="-"]').onclick=e=>{e.stopPropagation();removeOf(t);};
    li.onclick=()=>{const L=MOV.filter(G=>G.userData.type===t);if(!L.length)return;const i=sel?L.indexOf(sel):-1;select(L[(i+1)%L.length]);};});if(sel)select(sel);}
function rebuildMarkers(){mkWrap.innerHTML='';MKS=[];LEG.forEach(m=>{const mk=(G,loc)=>{const e=document.createElement('div');e.className='mk'+(G&&!VIEW_ONLY?' mv':'');e.textContent=m[1];e.title=m[2];mkWrap.appendChild(e);MKS.push({e,G,loc});};
  if(!m[0]){mk(null,m[4].clone());return;}
  MOV.filter(G=>G.userData.type===m[0]).forEach(G=>mk(G,G.userData.src===m[5]?m[6].clone():new T.Vector3(0,m[4].y,0)));});}
document.getElementById('mkBtn').onclick=e=>{const on=mkWrap.hidden;mkWrap.hidden=!on;e.currentTarget.classList.toggle('on',on);e.currentTarget.setAttribute('aria-pressed',on);};
document.querySelectorAll('.views button[data-v]').forEach(b=>b.onclick=()=>{auto=false;setView(b.dataset.v);});
document.getElementById('rot').onclick=e=>{auto=!auto;anim=null;e.currentTarget.classList.toggle('on',auto);};
document.getElementById('bandBtn').onclick=e=>{bandG.visible=!bandG.visible;e.currentTarget.classList.toggle('on',bandG.visible);e.currentTarget.setAttribute('aria-pressed',bandG.visible);};
document.getElementById('plantsChk').onchange=e=>{countPlants=e.target.checked;runCheck();};

// panel de normativa
const pct=n=>Math.round(n).toLocaleString('es-ES')+' %';
function elevCanvas(cv,r,s){const w=cv.width=r.nc*2,h=cv.height=Math.round((RULE.h1-0)/RULE.dy)*4;const g=cv.getContext('2d');g.clearRect(0,0,w,h);
  const cellH=4,base=h-Math.round(RULE.h0/RULE.dy)*cellH;g.fillStyle='rgba(255,255,255,.05)';g.fillRect(0,base,w,h-base);
  for(let i=0;i<r.nc;i++)for(let j=0;j<r.nh;j++){const k=i*r.nh+j;if(r.near[k])g.fillStyle='#e0483e';else if(r.far[k])g.fillStyle='#d98c3a';else continue;g.fillRect(i*2,base-(j+1)*cellH,2,cellH);}
  g.strokeStyle='rgba(255,255,255,.35)';g.setLineDash([4,3]);g.beginPath();g.moveTo(0,base+0.5);g.lineTo(w,base+0.5);g.stroke();}
let LAST=null;
function renderCheck(R){const box=document.getElementById('check');let allOk=true;
  box.innerHTML=SIDES.map(s=>{const r=R[s.id],oOk=r.open>=RULE.open,sOk=r.see>=RULE.see;allOk=allOk&&oOk&&sOk;
    const maxClosed=s.len*(1-RULE.open/100);
    return `<div class="cs ${oOk&&sOk?'ok':'ko'}"><div class="csh"><b>${s.name}</b><span>${s.aisle} · ${fmt(s.len)} m</span></div>
      <div class="bar"><label>Abierto</label><div class="trk"><i style="width:${Math.max(0,Math.min(100,r.open))}%"></i><em style="left:${RULE.open}%"></em></div><strong class="${oOk?'ok':'ko'}">${pct(r.open)}</strong></div>
      <div class="bar"><label>Transparencia</label><div class="trk"><i style="width:${Math.max(0,Math.min(100,r.see))}%"></i><em style="left:${RULE.see}%"></em></div><strong class="${sOk?'ok':'ko'}">${pct(r.see)}</strong></div>
      <canvas class="elev" data-s="${s.id}" aria-label="Alzado del lado ${s.name}: elementos por encima de 1,2 m"></canvas>
      ${oOk?'':`<p class="fix">Cerrado ${fmt(r.closedLen)} m de ${fmt(s.len)} m; máximo ${fmt(maxClosed)} m. Recorta ${fmt(r.closedLen-maxClosed)} m o retrasa el elemento más de ${fmt(RULE.band)} m del borde.</p>`}
      ${sOk?'':`<p class="fix">Falta ${pct(RULE.see-r.see)} de transparencia: baja o estrecha los elementos marcados en rojo y naranja.</p>`}</div>`;}).join('');
  box.querySelectorAll('canvas.elev').forEach(cv=>elevCanvas(cv,R[cv.dataset.s]));
  const tall=tallItems();document.getElementById('tall').innerHTML=tall.length?tall.map(t=>`<li><b>${t.G.userData.name}</b><span>${fmt(t.y0)}–${fmt(t.h)} m · revisión obligatoria por la organización (posible obstáculo para vecinos)</span></li>`).join(''):'<li><span>Ningún elemento supera 4 m.</span></li>';
  const st=document.getElementById('status');st.className='status '+(allOk?'ok':'ko');st.textContent=allOk?'Cumple 70 % abierto y 50 % de transparencia en los 4 lados':'No cumple en algún lado: revisa el panel';
  document.querySelectorAll('.views button[data-v]').forEach(b=>{const r=R[b.dataset.v];b.classList.toggle('warn',!!(r&&(r.open<RULE.open||r.see<RULE.see)));});}
function runCheck(){LAST=compute();drawEdges(LAST);renderCheck(LAST);}
function changed(){save();renderLegend();rebuildMarkers();runCheck();}
if(!VIEW_ONLY)load();renameAll();renderLegend();rebuildMarkers();runCheck();

// ---------- captura (solo en gpworx.com: send.php) ----------
const SEND=window.GP_SEND_ENDPOINT||'../send.php',onGP=/gpworx\.com$/.test(location.hostname);
const shotBtn=document.getElementById('shotBtn'),shotBox=document.getElementById('shotBox'),shotImg=document.getElementById('shotImg'),shotMsg=document.getElementById('shotMsg');
if(!onGP)shotBtn.hidden=true;
shotBtn.onclick=async()=>{shotBtn.disabled=true;try{if(selBox)selBox.visible=false;renderer.render(scene,camera);if(selBox)selBox.visible=true;
  const blob=await new Promise(r=>canvas.toBlob(r,'image/png'));shotImg.src=URL.createObjectURL(blob);shotBox.hidden=false;shotMsg.textContent='Enviando captura…';
  const R=LAST,body='Coloplast · EAU 2027 · Stand E01\n\n'+SIDES.map(s=>`${s.name}: abierto ${pct(R[s.id].open)} · transparencia ${pct(R[s.id].see)}`).join('\n')+'\n\n'+MOV.map(G=>`· ${G.userData.name}: X ${fmt(G.position.x+SX/2)} m, Y ${fmt(G.position.z+SZ/2)} m`).join('\n');
  const fd=new FormData();fd.append('subject','Coloplast EAU 2027 · E01 · configuración');fd.append('body',body);fd.append('image',blob,'coloplast-eau27-e01.png');
  const r=await fetch(SEND,{method:'POST',body:fd});const j=await r.json().catch(()=>({}));if(!r.ok||!j.ok)throw new Error(j.error||('HTTP '+r.status));shotMsg.textContent='Captura enviada a gregor@gpworx.com.';
 }catch(e){shotMsg.textContent='No se pudo enviar la captura ('+(e.message||e)+'). Inténtalo de nuevo.';}finally{shotBtn.disabled=false;}};
document.getElementById('shotCancel').onclick=()=>{shotBox.hidden=true;};

// ---------- loop ----------
function resize(){const w=stage.clientWidth,h=stage.clientHeight;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();}
window.addEventListener('resize',resize);resize();
const v=new T.Vector3();
function loop(){requestAnimationFrame(loop);
  if(anim){anim.t=Math.min(1,anim.t+0.035);const e=1-Math.pow(1-anim.t,3);let dt=anim.to[0]-anim.from[0];dt=Math.atan2(Math.sin(dt),Math.cos(dt));th=anim.from[0]+dt*e;ph=anim.from[1]+(anim.to[1]-anim.from[1])*e;rad=anim.from[2]+(anim.to[2]-anim.from[2])*e;target.lerpVectors(anim.fT,anim.tT,e);if(anim.t>=1)anim=null;}
  if(auto)th+=0.003;upd();
  if(clipK){camera.near=Math.max(0.1,rad-HALF[clipK]-0.6);camera.updateProjectionMatrix();}renderer.render(scene,camera);if(selBox)selBox.update();
  const w=stage.clientWidth,h=stage.clientHeight;
  MEAS.concat(pend?[pend]:[]).forEach(o=>{v.copy(o.a).add(o.b).multiplyScalar(.5).project(camera);if(v.z>1||v.z<-1){o.el.style.display='none';return;}o.el.style.display='';o.el.style.left=((v.x+1)/2*w)+'px';o.el.style.top=((1-v.y)/2*h)+'px';});
  const showMk=!mkWrap.hidden&&rad<32;mkWrap.style.visibility=showMk?'visible':'hidden';if(showMk)MKS.forEach(o=>{v.copy(o.loc);if(o.G)v.applyMatrix4(o.G.matrixWorld);v.project(camera);if(v.z>1||v.z<-1){o.e.style.display='none';return;}o.e.style.display='flex';o.e.style.left=((v.x+1)/2*w)+'px';o.e.style.top=((1-v.y)/2*h)+'px';});}
loop();
window.__CHECK=()=>LAST;
}
(function(){const IM={};const ks=Object.keys(IMGSRC);let n=0;const go=()=>{if(++n===ks.length)main(IM);};ks.forEach(k=>{const i=new Image();i.onload=i.onerror=()=>{IM[k]=i;go();};i.src=IMGSRC[k];});})();
