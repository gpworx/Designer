// =====================================================================
// GPworx Stand Configurator · LÓGICA DEL SIMULADOR
// ---------------------------------------------------------------------
// Secciones (busca la línea "// ---------- nombre ----------"):
//   · lights / materials / canvas textures   → escena 3D, materiales y gráficos
//   · common environment / people & furniture → pabellón y stands vecinos
//   · Proposal B · Dintel curvo                → elementos del stand (Option A)
//   · RAI 2 m zone overlay                     → zona de 2 m
//   · data                                     → textos de leyenda, normativa y fichas
//   · camera control                           → vistas Main/Top/Front/Side/Pavillon
//   · cuadrícula 1×1 m / medición               → herramientas Grid y Measure
//   · UI                                       → botones, selección, Reset
//   · captura + envío directo                  → botón "Enviar captura a GPworx" (send.php)
//   · protección                               → marca de agua y bloqueos anti-captura
// =====================================================================
// ---------- modo solo lectura (versión design/) ----------
// En design/index.html se define window.GP_VIEW_ONLY=true: no se pueden mover, girar,
// añadir ni quitar elementos, y no se leen ni guardan cambios del navegador.
const VIEW_ONLY=!!window.GP_VIEW_ONLY;
if(VIEW_ONLY)document.documentElement.classList.add('view-only');

function main(IM){
const T=THREE;
const canvas=document.getElementById('c'), stage=document.getElementById('stage');
const renderer=new T.WebGLRenderer({canvas,antialias:true});
renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2));
renderer.shadowMap.enabled=true; renderer.shadowMap.type=T.PCFSoftShadowMap;
renderer.outputEncoding=T.sRGBEncoding;
const scene=new T.Scene();
scene.background=new T.Color(0x222222);
scene.fog=new T.Fog(0x222222,45,130);
const camera=new T.PerspectiveCamera(42,1,0.1,200);

// ---------- lights ----------
scene.add(new T.HemisphereLight(0xdfe9ff,0x1a2233,0.75));
const sun=new T.DirectionalLight(0xffffff,0.75);
sun.position.set(8,18,10); sun.castShadow=true;
sun.shadow.mapSize.set(4096,4096);
Object.assign(sun.shadow.camera,{left:-30,right:30,top:30,bottom:-30,near:1,far:80});
sun.shadow.bias=-0.0005;
scene.add(sun);
const fill=new T.DirectionalLight(0x9cc4ff,0.25); fill.position.set(-10,8,-6); scene.add(fill);

// ---------- materials ----------
const M={
  white:new T.MeshStandardMaterial({color:0xf3f5f9,roughness:.35}),
  floor:new T.MeshStandardMaterial({color:0xf7f9fc,roughness:.12,metalness:.05}),
  hall:new T.MeshStandardMaterial({color:0x2a2a2c,roughness:.85}),
  navy:new T.MeshStandardMaterial({color:0x0b1f3a,roughness:.45}),
  led:new T.MeshBasicMaterial({color:0x5aaeff}),
  red:new T.MeshBasicMaterial({color:0x5d729e}),
  person:new T.MeshStandardMaterial({color:0x1e2533,roughness:.7}),
  person2:new T.MeshStandardMaterial({color:0x3a4252,roughness:.7}),
  skin:new T.MeshStandardMaterial({color:0xc9a184,roughness:.8}),
  chair:new T.MeshStandardMaterial({color:0xdfe3ea,roughness:.5}),
  stool:new T.MeshStandardMaterial({color:0xcfd5de,roughness:.4,metalness:.3}),
  plant:new T.MeshStandardMaterial({color:0x3f8f4e,roughness:.9}),
  glass:new T.MeshStandardMaterial({color:0xbfdcff,roughness:.05,transparent:true,opacity:.35}),
};
const W=(x,y,z)=>new T.Vector3(x-6,y,z-4);
function add(mesh,parent){mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;}
function box(p,x0,z0,x1,z1,y0,y1,mat){const m=new T.Mesh(new T.BoxGeometry(x1-x0,y1-y0,z1-z0),mat);m.position.copy(W((x0+x1)/2,(y0+y1)/2,(z0+z1)/2));return add(m,p);}
function cyl(p,x,z,r,y0,y1,mat,seg){const m=new T.Mesh(new T.CylinderGeometry(r,r,y1-y0,seg||24),mat);m.position.copy(W(x,(y0+y1)/2,z));return add(m,p);}
function plane(p,w,h,mat,pos,rotY){const m=new T.Mesh(new T.PlaneGeometry(w,h),mat);m.position.copy(pos);m.rotation.y=rotY||0;p.add(m);return m;}

// ---------- canvas textures ----------
const countdowns=[];
function tex(w,h,draw,live){
  const c=document.createElement('canvas');c.width=w;c.height=h;const g=c.getContext('2d');
  draw(g,w,h);const t=new T.CanvasTexture(c);t.encoding=T.sRGBEncoding;t.anisotropy=4;
  if(live)countdowns.push({g,w,h,draw,t});
  return t;
}
function bgFlow(g,w,h,seed){
  const gr=g.createLinearGradient(0,0,w,h);gr.addColorStop(0,'#04122b');gr.addColorStop(.6,'#0a2a5c');gr.addColorStop(1,'#0b3f8c');
  g.fillStyle=gr;g.fillRect(0,0,w,h);
  g.globalCompositeOperation='lighter';
  for(let k=0;k<26;k++){
    g.beginPath();const a=(k+seed)*0.37;
    for(let x=0;x<=w;x+=8){const y=h*0.68+Math.sin(x/w*6+a)*h*0.08+Math.sin(x/w*2.3+a*2)*h*0.07+k*h*0.006;x?g.lineTo(x,y):g.moveTo(x,y);}
    g.strokeStyle=`rgba(${80+k*4},${160+k*3},255,${0.05+k*0.008})`;g.lineWidth=1.4;g.stroke();
  }
  let s=seed*999+1;const rnd=()=>{s=(s*16807)%2147483647;return s/2147483647;};
  for(let i=0;i<260;i++){g.fillStyle=`rgba(170,215,255,${rnd()*0.7})`;const r=rnd()*2.2;g.beginPath();g.arc(rnd()*w,h*0.45+rnd()*h*0.5,r,0,7);g.fill();}
  g.globalCompositeOperation='source-over';
}
let redLogo=null;function getRed(){if(redLogo)return redLogo;const L=IM.logo;if(!L||!L.naturalWidth)return null;const c=document.createElement('canvas');c.width=L.naturalWidth;c.height=L.naturalHeight;const q=c.getContext('2d');q.drawImage(L,0,0);q.globalCompositeOperation='source-in';q.fillStyle='#5d729e';q.fillRect(0,0,c.width,c.height);return redLogo=c;}
function brandW(g,x,y,size,align){const L=IM.logo;if(!L||!L.naturalWidth)return;const h=size*1.05,w=h*L.naturalWidth/L.naturalHeight;g.drawImage(L,align==='center'?x-w/2:x,y-h*0.85,w,h);}
function brand(g,x,y,size,align){const L=getRed();if(!L){g.save();g.font=`900 ${size}px Helvetica,Arial`;g.textAlign=align||'left';g.fillStyle='#5d729e';g.fillText('DuPont',x,y);g.restore();return;}const h=size*1.05,w=h*L.width/L.height;const x0=align==='center'?x-w/2:x;g.drawImage(L,x0,y-h*0.85,w,h);}
function remaining(){
  const target=Date.UTC(2027,2,10,10,0,0);let d=Math.max(0,target-Date.now());
  const D=Math.floor(d/864e5);d-=D*864e5;const H=Math.floor(d/36e5);d-=H*36e5;const Mi=Math.floor(d/6e4);d-=Mi*6e4;const S=Math.floor(d/1e3);
  const p=n=>String(n).padStart(2,'0');return [String(D),p(H),p(Mi),p(S)];
}
function countdownDraw(g,w,h){
  bgFlow(g,w,h,3);brandW(g,w*0.06,h*0.12,h*0.07);
  g.textAlign='center';g.fillStyle='#fff';
  g.font=`bold ${Math.min(h*0.075,w*0.075)}px Helvetica,Arial`;g.fillText('THE NEW ERA OF RO',w/2,h*0.3);
  const r=remaining(),txt=r.join(' : ');let fs=h*0.17;g.font=`bold ${fs}px Helvetica,Arial`;while(g.measureText(txt).width>w*0.88){fs*=0.94;g.font=`bold ${fs}px Helvetica,Arial`;}
  g.shadowColor='#5ab0ff';g.shadowBlur=24;g.fillText(txt,w/2,h*0.53);g.shadowBlur=0;
  g.font=`${Math.min(h*0.035,w*0.04)}px Helvetica,Arial`;g.fillStyle='#b9d4ff';
  g.fillText('DÍAS · HORAS · MIN · SEG',w/2,h*0.61);
  g.font=`bold ${Math.min(h*0.045,w*0.045)}px Helvetica,Arial`;g.fillStyle='#fff';g.fillText('THE REVEAL · 10 MARCH 2027 · 11:00',w/2,h*0.75);
}
function membraneDraw(g,w,h){
  const gr=g.createRadialGradient(w/2,h/2,10,w/2,h/2,w*0.75);gr.addColorStop(0,'#3fb2ff');gr.addColorStop(.55,'#0d4fa3');gr.addColorStop(1,'#03122e');
  g.fillStyle=gr;g.fillRect(0,0,w,h);
  // fake inner-box perspective (anamorphic)
  g.strokeStyle='rgba(220,240,255,.55)';g.lineWidth=3;
  const i=w*0.14;g.strokeRect(i,i,w-2*i,h-2*i);
  [[0,0,i,i],[w,0,w-i,i],[0,h,i,h-i],[w,h,w-i,h-i]].forEach(a=>{g.beginPath();g.moveTo(a[0],a[1]);g.lineTo(a[2],a[3]);g.stroke();});
  // membrane element
  const cx=w/2,cy=h*0.52;
  g.save();g.translate(cx,cy);g.rotate(-0.35);
  const body=g.createLinearGradient(0,-h*0.12,0,h*0.12);body.addColorStop(0,'#e8f4ff');body.addColorStop(.5,'#8fb9e6');body.addColorStop(1,'#2d5f9c');
  g.fillStyle=body;g.fillRect(-w*0.27,-h*0.11,w*0.5,h*0.22);
  g.fillStyle='#dbefff';g.beginPath();g.ellipse(w*0.23,0,w*0.06,h*0.11,0,0,7);g.fill();
  g.strokeStyle='#3f7fc6';g.lineWidth=2;for(let k=1;k<8;k++){g.beginPath();g.ellipse(w*0.23,0,w*0.06*k/8,h*0.11*k/8,0,0,7);g.stroke();}
  g.restore();
  g.textAlign='center';g.fillStyle='#fff';g.font=`bold ${h*0.075}px Helvetica,Arial`;g.fillText('NEXT',w/2,h*0.22);
  g.font=`${h*0.035}px Helvetica,Arial`;g.fillText('THE NEXT GENERATION OF REVERSE OSMOSIS',w/2,h*0.83);
}
function revealDraw(g,w,h){
  bgFlow(g,w,h,7);brandW(g,w*0.05,h*0.14,h*0.08);
  g.fillStyle='#fff';g.font=`bold ${Math.min(h*0.09,w*0.07)}px Helvetica,Arial`;g.fillText('THE NEW ERA OF RO',w*0.05,h*0.32);
  g.font=`${h*0.05}px Helvetica,Arial`;g.fillStyle='#cfe3ff';g.fillText('Designed for what’s next',w*0.05,h*0.42);
  // membrane hero
  const cx=w*0.72,cy=h*0.48;g.save();g.translate(cx,cy);g.rotate(-0.25);
  const body=g.createLinearGradient(0,-h*.16,0,h*.16);body.addColorStop(0,'#f1f8ff');body.addColorStop(.5,'#9cc3ee');body.addColorStop(1,'#2a5a96');
  g.fillStyle=body;g.fillRect(-w*.2,-h*.16,w*.34,h*.32);
  g.fillStyle='#e3f2ff';g.beginPath();g.ellipse(w*.14,0,w*.045,h*.16,0,0,7);g.fill();
  g.strokeStyle='#4a86c9';g.lineWidth=2;for(let k=1;k<9;k++){g.beginPath();g.ellipse(w*.14,0,w*.045*k/9,h*.16*k/9,0,0,7);g.stroke();}
  g.restore();
}
function pillarDraw(name,seed){return (g,w,h)=>{
  bgFlow(g,w,h,seed);
  g.fillStyle='rgba(255,255,255,.08)';g.fillRect(0,0,w,h*0.2);
  g.fillStyle='#fff';g.textAlign='center';g.font=`bold ${w*0.13}px Helvetica,Arial`;g.fillText(name,w/2,h*0.12);
  g.font=`${w*0.07}px Helvetica,Arial`;g.fillStyle='#b9d4ff';g.fillText('DuPont Water Solutions',w/2,h*0.17);
};}
function bannerDraw(word,seed){return (g,w,h)=>{
  const gr=g.createLinearGradient(0,0,0,h);gr.addColorStop(0,'#f4f8ff');gr.addColorStop(.55,'#cfe2fb');gr.addColorStop(1,'#2d6fd1');
  g.fillStyle=gr;g.fillRect(0,0,w,h);
  g.globalAlpha=.55;g.strokeStyle='#2f8cff';for(let k=0;k<14;k++){g.beginPath();for(let x=0;x<=w;x+=6){const y=h*.72+Math.sin(x/w*5+k*.4+seed)*h*.05+k*4;x?g.lineTo(x,y):g.moveTo(x,y);}g.stroke();}
  g.globalAlpha=1;g.fillStyle='#0b2a5c';g.textAlign='center';g.font=`bold ${w*0.12}px Helvetica,Arial`;
  word.split(' ').forEach((s,i)=>g.fillText(s,w/2,h*0.14+i*w*0.14));
};}
function totemDraw(g,w,h){g.fillStyle='#071a3a';g.fillRect(0,0,w,h);cover(g,IM.globe,w,h*0.42,0.22);const gr=g.createLinearGradient(0,h*.25,0,h*.42);gr.addColorStop(0,'rgba(7,26,58,0)');gr.addColorStop(1,'#071a3a');g.fillStyle=gr;g.fillRect(0,h*.25,w,h*.18);g.fillStyle='#fff';g.textAlign='center';g.font=`bold ${w*0.11}px Helvetica,Arial`;g.fillText('¿CUÁL ES',w/2,h*0.48);g.fillText('TU RETO?',w/2,h*0.55);
  ['Salinidad','Reutilización','Salmuera','Pretratamiento','Eficiencia'].forEach((s,i)=>{g.fillStyle='rgba(255,255,255,.14)';g.fillRect(w*.1,h*(.6+i*.075),w*.8,h*.058);g.fillStyle='#fff';g.font=`${w*0.07}px Helvetica,Arial`;g.fillText(s,w/2,h*(.637+i*.075));});}
function wallDraw(g,w,h){g.fillStyle='#f6f8fc';g.fillRect(0,0,w,h);g.fillStyle='#0b2a5c';g.font=`bold ${h*0.075}px Helvetica,Arial`;g.fillText('The power of',w*.08,h*.3);g.fillText('partnership.',w*.08,h*.4);g.fillStyle='#2f8cff';g.fillText('The promise of',w*.08,h*.5);g.fillText('possibility.',w*.08,h*.6);}
function counterDraw(g,w,h){g.fillStyle='#f6f8fc';g.fillRect(0,0,w,h);brand(g,w/2,h*0.55,h*0.36,'center');g.fillStyle='#0b2a5c';g.textAlign='center';g.font=`bold ${h*0.13}px Helvetica,Arial`;g.fillText('WATER SOLUTIONS',w/2,h*0.78);}
function ringDraw(g,w,h){g.fillStyle='#f6f8fc';g.fillRect(0,0,w,h);for(let k=0;k<3;k++){brand(g,w*(k+.5)/3,h*.62,h*.45,'center');g.fillStyle='#0b2a5c';g.font=`bold ${h*.16}px Helvetica,Arial`;g.textAlign='left';g.fillText('WATER SOLUTIONS',w*(k+.5)/3+h*0.85,h*.6);}}
const basic=t=>new T.MeshBasicMaterial({map:t,side:T.DoubleSide});
function cover(g,img,w,h,fx,fy,z){if(!img||!img.naturalWidth){g.fillStyle='#0b2a5c';g.fillRect(0,0,w,h);return;}fy=fy==null?0.5:fy;z=z||1;const iw=img.naturalWidth,ih=img.naturalHeight,a=w/h;let sw,sh;if(iw/ih>a){sh=ih;sw=ih*a;}else{sw=iw;sh=iw/a;}sw/=z;sh/=z;const sx=Math.min(iw-sw,Math.max(0,fx*iw-sw/2)),sy=Math.min(ih-sh,Math.max(0,fy*ih-sh/2));g.drawImage(img,sx,sy,sw,sh,0,0,w,h);}
function photoDraw(key,fx,lines,sub,fy,z){return (g,w,h)=>{cover(g,IM[key],w,h,fx,fy,z);const gr=g.createLinearGradient(0,0,0,h);gr.addColorStop(0,'rgba(5,18,43,.7)');gr.addColorStop(.38,'rgba(5,18,43,0)');gr.addColorStop(.72,'rgba(5,18,43,0)');gr.addColorStop(1,'rgba(5,18,43,.8)');g.fillStyle=gr;g.fillRect(0,0,w,h);
  const fs=Math.min(w*0.13,h*0.075);g.fillStyle='#fff';g.textAlign='left';g.font=`300 ${fs}px Helvetica,Arial`;const x=w*0.08;lines.forEach((l,i)=>g.fillText(l,x,h*0.05+fs*(1+i*1.1)));const ly=h*0.05+fs*(lines.length*1.1)+fs*0.35;g.fillRect(x,ly,w*0.62,Math.max(2,fs*0.05));
  if(sub){g.font=`bold ${fs*0.5}px Helvetica,Arial`;g.fillText(sub,x,h*0.95);}};}
function logoBand(g,w,h,n){g.fillStyle='#5d729e';g.fillRect(0,0,w,h);const L=IM.logo;if(!L||!L.naturalWidth)return;const lh=h*0.62,lw=lh*L.naturalWidth/L.naturalHeight;for(let k=0;k<n;k++)g.drawImage(L,w*(k+.5)/n-lw/2,(h-lh)/2,lw,lh);}
const PIL=[['sci',0.72,['Science &','Innovation']],['sus',0.7,['Sustainability']],['lead',0.75,['Our','Leadership']],['val',0.6,['Our Core','Values']],['bold',0.9,['Bold ideas']],['globe',0.78,['Global','reach']]];

// ---------- common environment ----------
const common=new T.Group();scene.add(common);
const hall=new T.Mesh(new T.PlaneGeometry(200,200),M.hall);hall.rotation.x=-Math.PI/2;hall.receiveShadow=true;common.add(hall);
const floorM=box(common,0,0,12,8,0,0.1,M.floor);
// LED perimeter strip
[[0,-0.03,12,0.03],[0,7.97,12,8.03],[-0.03,0,0.03,8],[11.97,0,12.03,8]].forEach(a=>{const m=new T.Mesh(new T.BoxGeometry(a[2]-a[0],0.04,a[3]-a[1]),M.led);m.position.copy(W((a[0]+a[2])/2,0.04,(a[1]+a[3])/2));common.add(m);});
// hall context from the official floor plan (px → m, DuPont 12×8 m = 93×58 px)
const PX=7.75,PY=7.25,OX=517,OY=73;
const mx=px=>(px-OX)/PX, mz=py=>(py-OY)/PY;
const EXH=[['Nijhuis SAUR Industries',414,73,498,223,4],['Fileder Filter Systems',626,73,711,131,3.5],['Fluytec, S.A.',518,165,610,193,3],['Lenntech',518,193,610,223,3],
 ['VentilAQUA, S.A.',626,160,711,193,3],['Toro Equipment S.L.',626,193,711,223,3],['Polifil S.r.l.',314,160,387,223,3],['Energy Recovery Inc.',314,73,387,131,3],
 ['Acqua Brevetti srl',223,73,295,160,3],['NX Filtration B.V.',470,252,541,300,3],['Royal Eijkelkamp B.V.',470,300,541,375,2.6],['Danfoss A/S',555,252,627,300,3],
 ['MEGA a.s.',555,300,627,375,2.6],['Chemviron S.A.',641,252,712,292,3],['RSE',641,292,712,375,2.8],['Netherlands Water Partnership',365,252,445,295,2.6],
 ['LANXESS Deutschland',251,252,333,300,3],['Dryden Aqua Ltd.',223,180,295,223,3],['OSMO SISTEMI',672,31,735,45,2.5],['HifilM INC.',733,95,765,128,2.5],
 ['Protec Arisawa Europe',733,140,765,190,2.5],['Puregen Activated Carbon',733,50,765,90,2.5],['GVB GmbH',152,31,210,50,2.5]];
const exhMat=new T.MeshStandardMaterial({color:0x3b3e45,roughness:.75});
const exhFloor=new T.MeshStandardMaterial({color:0x4a4d55,roughness:.6}),exhLight=new T.MeshStandardMaterial({color:0xe9ebef,roughness:.6});
function fascia(name,len){return tex(Math.max(256,Math.round(len*110)),64,(g,w,h)=>{g.fillStyle='#e9ebef';g.fillRect(0,0,w,h);g.fillStyle='#2a2c31';g.textAlign='center';let fs=h*0.55;g.font=`bold ${fs}px Helvetica,Arial`;while(g.measureText(name).width>w*0.92){fs*=0.92;g.font=`bold ${fs}px Helvetica,Arial`;}g.fillText(name,w/2,h*0.68);});}
function label4(n,x0,z0,x1,z1,y){const lx=x1-x0,lz=z1-z0,fx=basic(fascia(n,lx)),fz=basic(fascia(n,lz));
  plane(common,lx,0.5,fx,W((x0+x1)/2,y,z1+0.012),0);plane(common,lx,0.5,fx,W((x0+x1)/2,y,z0-0.012),Math.PI);
  plane(common,lz,0.5,fz,W(x1+0.012,y,(z0+z1)/2),Math.PI/2);plane(common,lz,0.5,fz,W(x0-0.012,y,(z0+z1)/2),-Math.PI/2);}
// neighbours modelled to the same RAI rules: open island stands with a core ≤1/3 of each side and ≤3,5 m,
// counters <1,30 m; stands against the hall wall with a back wall up to 4 m (RAI 6b)
const WALLSTANDS={'OSMO SISTEMI':'n','GVB GmbH':'n','HifilM INC.':'e','Protec Arisawa Europe':'e','Puregen Activated Carbon':'e'};
EXH.forEach(e=>{const [n,a,b,c,d]=e;const x0=mx(a)+0.25,x1=mx(c)-0.25,z0=mz(b)+0.25,z1=mz(d)-0.25,w=x1-x0,dd=z1-z0;
  box(common,x0,z0,x1,z1,0,0.08,exhFloor);
  const side=WALLSTANDS[n];
  if(side){ // against the RAI building wall
    if(side==='n'){box(common,x0,z0,x1,z0+0.2,0.08,4.0,exhMat);plane(common,w,0.5,basic(fascia(n,w)),W((x0+x1)/2,3.6,z0+0.212),0);box(common,(x0+x1)/2-0.9,z1-0.6,(x0+x1)/2+0.9,z1-0.15,0.08,1.1,exhLight);}
    else{box(common,x1-0.2,z0,x1,z1,0.08,4.0,exhMat);plane(common,dd,0.5,basic(fascia(n,dd)),W(x1-0.212,3.6,(z0+z1)/2),-Math.PI/2);box(common,x0+0.15,(z0+z1)/2-0.8,x0+0.6,(z0+z1)/2+0.8,0.08,1.1,exhLight);}
    return;}
  // island: central core ≤1/3 of each side
  const cw=Math.max(0.8,w/3*0.95),cd=Math.max(0.8,dd/3*0.95),cx=(x0+x1)/2,cz=(z0+z1)/2;
  const big=w>=6&&dd>=6,hc=big?3.5:2.5;
  box(common,cx-cw/2,cz-cd/2,cx+cw/2,cz+cd/2,0.08,hc,exhMat);
  box(common,cx-cw/2-0.02,cz-cd/2-0.02,cx+cw/2+0.02,cz+cd/2+0.02,hc-0.55,hc-0.05,exhLight);
  label4(n,cx-cw/2-0.03,cz-cd/2-0.03,cx+cw/2+0.03,cz+cd/2+0.03,hc-0.3);
  // counter and a couple of tables (<1,30 m)
  const cl=Math.min(2.2,w*0.4);box(common,cx-cl/2,z1-0.75,cx+cl/2,z1-0.3,0.08,1.1,exhLight);
  if(w>4&&dd>4){[[x0+0.9,z0+0.9],[x1-0.9,z0+0.9]].forEach(q=>{cyl(common,q[0],q[1],0.3,1.0,1.04,exhLight);cyl(common,q[0],q[1],0.04,0.08,1.0,exhMat,8);});}
});
// hall walls
const wallM=new T.MeshStandardMaterial({color:0x303136,roughness:.9});
box(common,mx(85),mz(30)-0.3,mx(765),mz(30),0,7,wallM);
box(common,mx(765),mz(30),mx(765)+0.3,mz(700),0,7,wallM);
// hall entrance (red arrow on plan)
{const x0=mx(220),x1=mx(290),z=mz(30);box(common,x0,z-0.05,x1,z+0.15,0,4.2,M.red);
 const st=tex(1024,256,(g,w,h)=>{g.fillStyle='#5d729e';g.fillRect(0,0,w,h);g.fillStyle='#fff';g.textAlign='center';g.font='bold 92px Helvetica,Arial';g.fillText('ACCESO PABELLÓN',w/2,h*0.62);});
 plane(common,6,1.5,basic(st),W((x0+x1)/2,5.2,z+0.2),0);
 const sh=new T.Shape();sh.moveTo(0,-0.6);sh.lineTo(2.2,-0.6);sh.lineTo(2.2,-1.2);sh.lineTo(3.6,0);sh.lineTo(2.2,1.2);sh.lineTo(2.2,0.6);sh.lineTo(0,0.6);
 const ar=new T.Mesh(new T.ShapeGeometry(sh),M.red);ar.rotation.x=-Math.PI/2;ar.position.copy(W(x0+1.5,0.03,z+2.4));common.add(ar);}

// ---------- people & shared furniture ----------
function person(){}
function personOld(p,x,z,ry,alt){const g=new T.Group();const b=new T.Mesh(new T.CylinderGeometry(0.19,0.17,1.25,12),alt?M.person2:M.person);b.position.y=0.73;b.castShadow=true;g.add(b);
  const sh=new T.Mesh(new T.SphereGeometry(0.19,12,8),alt?M.person2:M.person);sh.scale.set(1,0.45,0.75);sh.position.y=1.35;g.add(sh);
  const hd=new T.Mesh(new T.SphereGeometry(0.11,12,10),M.skin);hd.position.y=1.6;hd.castShadow=true;g.add(hd);
  g.position.copy(W(x,0.1,z));g.rotation.y=ry||0;p.add(g);return g;}
function plant(){}
function plantOld(p,x,z,s){cyl(p,x,z,0.22*s,0.1,0.55*s,M.white);const b=new T.Mesh(new T.SphereGeometry(0.42*s,12,10),M.plant);b.position.copy(W(x,0.55*s+0.35*s,z));add(b,p);}
function reception(p,x0,z0){ // counter front faces the hall wall (-z)
  box(p,x0,z0,x0+2,z0+0.45,0.1,1.1,M.white);
  plane(p,2.0,0.95,basic(tex(512,244,counterDraw)),W(x0+1,0.6,z0-0.006),Math.PI);
  const l=new T.Mesh(new T.BoxGeometry(2,0.03,0.03),M.led);l.position.copy(W(x0+1,0.13,z0-0.02));p.add(l);}
function bar(p,x0,x1,z0,sz){box(p,x0,z0,x1,z0+0.55,0.1,1.12,M.navy);box(p,x0-.05,z0-.05,x1+.05,z0+.6,1.12,1.16,M.white);
  const l=new T.Mesh(new T.BoxGeometry(x1-x0,0.03,0.04),M.led);l.position.copy(W((x0+x1)/2,0.14,sz>z0?z0+0.57:z0-0.02));p.add(l);
  const n=Math.floor((x1-x0)/0.6);for(let i=0;i<n;i++){const x=x0+0.3+i*0.6;cyl(p,x,sz,0.03,0.1,0.75,M.stool,8);cyl(p,x,sz,0.2,0.75,0.8,M.stool);}}
const glassW=new T.MeshStandardMaterial({color:0xe3f0fc,roughness:.05,metalness:.1,transparent:true,opacity:.26,depthWrite:false,side:T.DoubleSide});
const whiteF=new T.MeshStandardMaterial({color:0xffffff,roughness:.35});
let logoGlassTex=null;
function glassLogo(){if(logoGlassTex)return logoGlassTex;logoGlassTex=tex(1024,300,(g,w,h)=>{g.clearRect(0,0,w,h);const L=getRed();if(!L)return;const lh=h*0.8,lw=lh*L.width/L.height;g.drawImage(L,(w-lw)/2,(h-lh)/2,lw,lh);});return logoGlassTex;}
function glassWall(p,x0,z0,x1,z1){const alongX=(x1-x0)>=(z1-z0);const len=alongX?x1-x0:z1-z0;const c=alongX?(z0+z1)/2:(x0+x1)/2;
  const B=(a0,a1,b0,b1,y0,y1,m)=>alongX?box(p,a0,b0,a1,b1,y0,y1,m):box(p,b0,a0,b1,a1,y0,y1,m);
  const a0=alongX?x0:z0,a1=alongX?x1:z1;
  B(a0,a1,c-0.02,c+0.02,0.18,2.5,glassW);
  B(a0,a1,c-0.06,c+0.06,2.5,2.62,redM);B(a0,a1,c-0.06,c+0.06,0.1,0.18,redM);   // red top & bottom rails
  B(a0,a1,c-0.065,c+0.065,2.44,2.5,whiteF);                                    // white inner line
  const n=Math.max(1,Math.round(len/1.2));for(let i=0;i<=n;i++){const a=a0+(a1-a0)*i/n;B(Math.max(a0,a-0.04),Math.min(a1,a+0.04),c-0.05,c+0.05,0.18,2.5,whiteF);}
  const mat=new T.MeshBasicMaterial({map:glassLogo(),transparent:true,depthWrite:false});
  const fr=new T.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.55,depthWrite:false,side:T.DoubleSide});
  const mid=(a0+a1)/2,lw=Math.min(len-0.3,1.7),lh=lw*300/1024;
  [1,-1].forEach(sg=>{const pos=alongX?W(mid,1.55,c+sg*0.03):W(c+sg*0.03,1.55,mid);const rot=alongX?(sg>0?0:Math.PI):(sg>0?Math.PI/2:-Math.PI/2);plane(p,lw,lh,mat,pos,rot);});
  const fb=alongX?W(mid,1.05,c):W(c,1.05,mid);plane(p,len-0.1,0.12,fr,fb,alongX?0:Math.PI/2);}
function meeting(p,walls,tx,tz,award){walls.forEach(w=>glassWall(p,w[0],w[1],w[2],w[3]));
  box(p,tx-0.65,tz-0.38,tx+0.65,tz+0.38,0.82,0.86,M.white);cyl(p,tx,tz,0.08,0.1,0.82,M.white);
  [[-0.4,-0.62],[0.4,-0.62],[-0.4,0.62],[0.4,0.62],[-0.9,0],[0.9,0]].forEach(c=>box(p,tx+c[0]-.22,tz+c[1]-.22,tx+c[0]+.22,tz+c[1]+.22,0.1,0.55,M.chair));}
function semiMeeting(p,cx,cz,R,md){ // glass half-cylinder; md = plan direction of the closed (glass) side, opening faces md+π
  md=md==null?3*Math.PI/4:md;const ts=-md,tl=Math.PI;
  const g=new T.Mesh(new T.CylinderGeometry(R,R,2.32,64,1,true,ts,tl),glassW);g.position.copy(W(cx,1.34,cz));p.add(g);
  const arc=(r,tube,y,m)=>{const geo=new T.TorusGeometry(r,tube,8,64,Math.PI);geo.rotateX(Math.PI/2);geo.rotateY(Math.PI/2-md);const t=new T.Mesh(geo,m);t.position.copy(W(cx,y,cz));t.castShadow=true;p.add(t);};
  arc(R,0.06,2.56,redM);arc(R,0.05,0.15,redM);arc(R-0.01,0.03,2.45,whiteF);
  for(let k=0;k<=6;k++){const a=md-Math.PI/2+Math.PI*k/6;cyl(p,cx+R*Math.cos(a),cz+R*Math.sin(a),0.035,0.18,2.5,whiteF,8);}
  const span=1.6/R,mid=Math.PI/2-md;
  const lo=glassLogo();const li=lo.clone();li.needsUpdate=true;li.wrapS=T.RepeatWrapping;li.repeat.x=-1;li.offset.x=1;
  const mk=(r,t)=>{const m=new T.Mesh(new T.CylinderGeometry(r,r,1.6*300/1024,48,1,true,mid-span/2,span),new T.MeshBasicMaterial({map:t,transparent:true,depthWrite:false,side:r>R?T.FrontSide:T.BackSide}));m.position.copy(W(cx,1.6,cz));p.add(m);};
  mk(R+0.012,lo);mk(R-0.012,li);
  const fb=new T.Mesh(new T.CylinderGeometry(R+0.006,R+0.006,0.12,64,1,true,ts,tl),new T.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.5,depthWrite:false,side:T.DoubleSide}));fb.position.copy(W(cx,1.05,cz));p.add(fb);
  const tx=cx+0.35*Math.cos(md),tz=cz+0.35*Math.sin(md);cyl(p,tx,tz,0.55,0.8,0.84,M.white,32);cyl(p,tx,tz,0.07,0.1,0.8,M.white);
  [0,1,2,3].forEach(k=>{const a=md+Math.PI/4+k*Math.PI/2;const x=tx+0.9*Math.cos(a),z=tz+0.9*Math.sin(a);cyl(p,x,z,0.24,0.1,0.5,M.chair,16);});}
function hightable(p,x,z){cyl(p,x,z,0.32,1.02,1.06,M.white);cyl(p,x,z,0.04,0.1,1.02,M.stool,8);cyl(p,x,z,0.22,0.1,0.13,M.stool);
  for(let k=0;k<3;k++){const a=k*2*Math.PI/3+Math.PI/6,sx=x+0.62*Math.cos(a),sz=z+0.62*Math.sin(a);cyl(p,sx,sz,0.03,0.1,0.75,M.stool,8);cyl(p,sx,sz,0.17,0.1,0.12,M.stool,16);cyl(p,sx,sz,0.19,0.75,0.8,M.white,20);}}
function pillar(p,x,z,name,i,rot){const P=PIL[Math.max(0,NAMES.indexOf(name))];const t=tex(240,1300,photoDraw(P[0],P[1],P[2],name));const g=new T.Group();
  const b=new T.Mesh(new T.BoxGeometry(0.62,3.3,0.14),M.navy);b.position.y=1.75;b.castShadow=true;g.add(b);
  const f=new T.Mesh(new T.PlaneGeometry(0.6,3.25),basic(t));f.position.set(0,1.75,0.075);g.add(f);
  const f2=f.clone();f2.position.z=-0.075;f2.rotation.y=Math.PI;g.add(f2);
  const base=new T.Mesh(new T.BoxGeometry(0.7,0.06,0.3),M.led);base.position.y=0.12;g.add(base);
  g.position.copy(W(x,0,z));g.rotation.y=rot||0;p.add(g);}
const NAMES=['FILMTEC™','AMBERLITE™','INTEGRATEC™','MEMPULSE™','OXYMEM™','DIGITAL'];
function column(p,x,z,h,nA,nB,axis){ // 0.5×0.5 m brand column
  const dA=typeof nA==='function'?nA:(()=>{const P=PIL[NAMES.indexOf(nA)];return photoDraw(P[0],P[1],P[2],nA);})(),dB=typeof nB==='function'?nB:(()=>{const P=PIL[NAMES.indexOf(nB)];return photoDraw(P[0],P[1],P[2],nB);})();
  box(p,x-0.25,z-0.25,x+0.25,z+0.25,0.1,0.1+h,M.navy);box(p,x-0.27,z-0.27,x+0.27,z+0.27,0.1,0.16,M.led);box(p,x-0.27,z-0.27,x+0.27,z+0.27,0.04+h,0.1+h,M.led);
  const tA=tex(300,2700,dA),tB=tex(300,2700,dB);
  const y=0.1+h/2,ph=h-0.16,e=0.257;
  if(axis==='x'){plane(p,0.48,ph,basic(tA),W(x+e,y,z),Math.PI/2);plane(p,0.48,ph,basic(tB),W(x-e,y,z),-Math.PI/2);}
  else{plane(p,0.48,ph,basic(tA),W(x,y,z-e),Math.PI);plane(p,0.48,ph,basic(tB),W(x,y,z+e),0);}}
function revealButton(p,x,z){cyl(p,x,z,0.32,0.1,1.0,M.glass);cyl(p,x,z,0.33,0.1,0.16,M.led);cyl(p,x,z,0.3,1.0,1.06,M.white);const b=new T.Mesh(new T.SphereGeometry(0.14,16,10,0,Math.PI*2,0,Math.PI/2),M.red);b.position.copy(W(x,1.06,z));p.add(b);}
function maquetaTable(p,x0,z0,x1,z1){box(p,x0,z0,x1,z1,0.1,0.9,M.white);box(p,x0-.03,z0-.03,x1+.03,z1+.03,0.9,0.93,M.glass);
  const n=4,len=x1-x0;for(let i=0;i<n;i++){const t=new T.Mesh(new T.CylinderGeometry(0.07,0.07,len*0.8,16),new T.MeshStandardMaterial({color:0xdde9f8,metalness:.4,roughness:.25}));t.rotation.z=Math.PI/2;t.position.copy(W((x0+x1)/2,1.02,z0+(z1-z0)*(i+.5)/n));add(t,p);
    const g=new T.Mesh(new T.CylinderGeometry(0.02,0.02,len*0.8,8),M.led);g.rotation.z=Math.PI/2;g.position.copy(W((x0+x1)/2,0.96,z0+(z1-z0)*(i+.5)/n));p.add(g);}
  const lb=new T.Mesh(new T.BoxGeometry(len,0.03,0.03),M.led);lb.position.copy(W((x0+x1)/2,0.13,z1+.02));p.add(lb);}
function totem(p,x,z,rot){const t=tex(256,640,totemDraw);const g=new T.Group();const b=new T.Mesh(new T.BoxGeometry(0.55,1.75,0.12),M.white);b.position.y=0.98;b.castShadow=true;g.add(b);
  const f=new T.Mesh(new T.PlaneGeometry(0.47,1.2),basic(t));f.position.set(0,1.15,0.065);g.add(f);g.position.copy(W(x,0,z));g.rotation.y=rot||0;p.add(g);}
function panels(list){return (g,w,h)=>{const pw=w/list.length;list.forEach((fn,i)=>{g.save();g.translate(i*pw,0);g.beginPath();g.rect(0,0,pw,h);g.clip();g.textAlign='left';fn(g,pw,h);g.restore();});};}
function wideReveal(g,w,h){bgFlow(g,w,h,7);brandW(g,w*0.05,h*0.13,h*0.08);g.textAlign='left';g.fillStyle='#fff';g.font=`bold ${h*0.085}px Helvetica,Arial`;g.fillText('THE NEW ERA OF RO',w*0.05,h*0.3);
  g.font=`${h*0.045}px Helvetica,Arial`;g.fillStyle='#cfe3ff';g.fillText('The next generation of reverse osmosis',w*0.05,h*0.38);
  const r=remaining(),txt=r.join(' : ');let fs=h*0.13;g.font=`bold ${fs}px Helvetica,Arial`;while(g.measureText(txt).width>w*0.42){fs*=0.94;g.font=`bold ${fs}px Helvetica,Arial`;}
  g.fillStyle='#fff';g.shadowColor='#5ab0ff';g.shadowBlur=20;g.fillText(txt,w*0.05,h*0.58);g.shadowBlur=0;g.font=`${h*0.035}px Helvetica,Arial`;g.fillStyle='#b9d4ff';g.fillText('DÍAS · HORAS · MIN · SEG',w*0.05,h*0.65);g.font=`bold ${h*0.04}px Helvetica,Arial`;g.fillStyle='#fff';g.fillText('THE REVEAL · 10 MARCH 2027 · 11:00',w*0.05,h*0.74);
  const cx=w*0.74,cy=h*0.5;g.save();g.translate(cx,cy);g.rotate(-0.25);const body=g.createLinearGradient(0,-h*.16,0,h*.16);body.addColorStop(0,'#f1f8ff');body.addColorStop(.5,'#9cc3ee');body.addColorStop(1,'#2a5a96');
  g.fillStyle=body;g.fillRect(-w*.16,-h*.16,w*.27,h*.32);g.fillStyle='#e3f2ff';g.beginPath();g.ellipse(w*.11,0,w*.035,h*.16,0,0,7);g.fill();g.strokeStyle='#4a86c9';g.lineWidth=2;for(let k=1;k<9;k++){g.beginPath();g.ellipse(w*.11,0,w*.035*k/9,h*.16*k/9,0,0,7);g.stroke();}g.restore();}
const redM=new T.MeshStandardMaterial({color:0x5d729e,roughness:.5});
// maqueta NEXT sobre el cilindro: vitrina de cristal con membranas de ósmosis inversa
function nextTop(p,x,z){cyl(p,x,z,0.56,1.4,1.43,M.white,48);cyl(p,x,z,0.57,1.38,1.41,M.led,48);
  const v=new T.Mesh(new T.CylinderGeometry(0.48,0.48,0.55,48,1,true),M.glass);v.position.copy(W(x,1.71,z));p.add(v);cyl(p,x,z,0.49,1.98,2.0,M.white,48);
  const mm=new T.MeshStandardMaterial({color:0xdde9f8,metalness:.4,roughness:.25});
  [[-0.18,1.56],[0.18,1.56],[0,1.75]].forEach(q=>{const t=new T.Mesh(new T.CylinderGeometry(0.11,0.11,0.62,24),mm);t.rotation.z=Math.PI/2;t.rotation.y=Math.PI/4;t.position.copy(W(x+q[0]*0.707,q[1],z-q[0]*0.707));add(t,p);});}
function launchZoneA(p,ox,oz){ // curved counter convex toward the reception corner, tangent end pieces + 2 totems
  const R=2.4,w=0.2,a0=Math.PI*195/180,a1=Math.PI*255/180,X=ox-6,Z=oz-4;
  const rg=(r0,r1,y0,y1,mat)=>{const sh=new T.Shape();sh.moveTo(X+r1*Math.cos(a0),Z+r1*Math.sin(a0));sh.absarc(X,Z,r1,a0,a1,false);sh.lineTo(X+r0*Math.cos(a1),Z+r0*Math.sin(a1));sh.absarc(X,Z,r0,a1,a0,true);const m=new T.Mesh(new T.ExtrudeGeometry(sh,{depth:y1-y0,bevelEnabled:false,curveSegments:48}),mat);m.rotation.x=Math.PI/2;m.position.y=y1;add(m,p);};
  rg(R-w,R+w,0.1,1.04,whiteF);rg(R-w-0.03,R+w+0.03,1.04,1.1,whiteF);
  const seg=(x,z,dx,dz,len,wd,y0,y1)=>{const m=new T.Mesh(new T.BoxGeometry(len,y1-y0,wd),whiteF);m.rotation.y=-Math.atan2(dz,dx);m.position.copy(W(x+dx*len/2,(y0+y1)/2,z+dz*len/2));return add(m,p);};
  [[a0,-1],[a1,1]].forEach(([a,sg])=>{const x=ox+R*Math.cos(a),z=oz+R*Math.sin(a),dx=-sg*Math.sin(a),dz=sg*Math.cos(a),L=0.6;
    seg(x,z,dx,dz,L,2*w,0.1,1.04);seg(x,z,dx,dz,L+0.03,2*w+0.06,1.04,1.1);
    const nx=Math.cos(a),nz=Math.sin(a);totem(p,x+dx*L*0.55+nx*0.42,z+dz*L*0.55+nz*0.42,Math.atan2(nx,nz));});
  const am=(a0+a1)/2,cx=ox+R*Math.cos(am),cz=oz+R*Math.sin(am);cyl(p,cx,cz,0.55,0.1,1.4,redM,64);nextTop(p,cx,cz);}
function launchZone(p,cx,cz){const X=cx-6,Z=cz-4,a0=-Math.PI/4,a1=3*Math.PI/4;
  const rg=(r0,r1,y0,y1,mat)=>{const sh=new T.Shape();sh.moveTo(X+r1*Math.cos(a0),Z+r1*Math.sin(a0));sh.absarc(X,Z,r1,a0,a1,false);sh.lineTo(X+r0*Math.cos(a1),Z+r0*Math.sin(a1));sh.absarc(X,Z,r0,a1,a0,true);const m=new T.Mesh(new T.ExtrudeGeometry(sh,{depth:y1-y0,bevelEnabled:false,curveSegments:48}),mat);m.rotation.x=Math.PI/2;m.position.y=y1;add(m,p);};
  rg(1.35,1.7,0.1,1.04,whiteF);rg(1.32,1.73,1.04,1.1,whiteF);
  const x=cx+1.525*Math.cos(Math.PI/4),z=cz+1.525*Math.sin(Math.PI/4);cyl(p,x,z,0.55,0.1,1.4,redM,64);nextTop(p,x,z);}

// ---------- Proposal B · Dintel curvo (según render de referencia) ----------
const B=new T.Group();scene.add(B);let TG=B;const MG={},MOV=[],TEMPL={},ORIG=[];
const TYPEOF={rec:'rec',demo:'demo',alm:'alm',bar:'bar',s1:'sala',s2:'sala',t1:'totem',t2:'totem',m1:'mesa',m2:'mesa',m3:'mesa',j1:'jard',j2:'jard',g1:'cesp',g2:'cesp'};
const TYPES={rec:'Mostrador de recepción',demo:'Demo NEXT',alm:'Almacén con pantalla',bar:'Barra curva',sala:'Sala de reunión',totem:'Tótem Challenge Selector',mesa:'Mesa alta',jard:'Jardinera',cesp:'Planta de césped'};
function mov(key,name,fn){const G=new T.Group();B.add(G);TG=G;fn();TG=B;G.updateMatrixWorld(true);
  const bb=new T.Box3().setFromObject(G),c=bb.getCenter(new T.Vector3());
  G.children.forEach(ch=>{ch.position.x-=c.x;ch.position.z-=c.z;});G.position.set(c.x,0,c.z);G.updateMatrixWorld(true);
  G.userData={key,src:key,type:TYPEOF[key],name,home:{x:c.x,z:c.z,r:0}};MG[key]=G;TEMPL[key]=G;ORIG.push(G);MOV.push(G);return G;}

{
  const blackM=new T.MeshStandardMaterial({color:0x141518,roughness:.45});
  const woodM=new T.MeshStandardMaterial({color:0xb48c5c,roughness:.8});
  const grassM=new T.MeshStandardMaterial({color:0x557f3c,roughness:.9});
  const leafM=new T.MeshStandardMaterial({color:0x3d6b35,roughness:.9});
  const lilyM=new T.MeshStandardMaterial({color:0xffffff,roughness:.5});
  const solid=(s,y0,y1,mat)=>{const m=new T.Mesh(new T.ExtrudeGeometry(s,{depth:y1-y0,bevelEnabled:false,curveSegments:64}),mat);m.rotation.x=Math.PI/2;m.position.y=y1;return add(m,TG);};
  // curved solid between two concentric circles (plan angles a0→a1)
  const ring=(cx,cz,r0,r1,a0,a1,y0,y1,mat)=>{const s=new T.Shape(),X=cx-6,Z=cz-4;s.moveTo(X+r1*Math.cos(a0),Z+r1*Math.sin(a0));s.absarc(X,Z,r1,a0,a1,false);s.lineTo(X+r0*Math.cos(a1),Z+r0*Math.sin(a1));s.absarc(X,Z,r0,a1,a0,true);return solid(s,y0,y1,mat);};
  // curved solid between two concentric ellipses
  const ering=(cx,cz,ai,bi,ao,bo,t0,t1,y0,y1,mat)=>{const s=new T.Shape(),X=cx-6,Z=cz-4;s.moveTo(X+ao*Math.cos(t0),Z+bo*Math.sin(t0));s.absellipse(X,Z,ao,bo,t0,t1,false);s.lineTo(X+ai*Math.cos(t1),Z+bi*Math.sin(t1));s.absellipse(X,Z,ai,bi,t1,t0,true);return solid(s,y0,y1,mat);};
  // vertical textured band following a plan polyline
  const ribbon=(pts,y0,y1,mat,flip)=>{const L=[0];for(let i=1;i<pts.length;i++)L.push(L[i-1]+Math.hypot(pts[i][0]-pts[i-1][0],pts[i][1]-pts[i-1][1]));const tot=L[L.length-1];
    const pos=[],uv=[],idx=[];pts.forEach((q,i)=>{const v=W(q[0],0,q[1]);pos.push(v.x,y0,v.z,v.x,y1,v.z);const u=flip?1-L[i]/tot:L[i]/tot;uv.push(u,0,u,1);if(i<pts.length-1){const a=i*2;idx.push(a,a+2,a+1,a+1,a+2,a+3);}});
    const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(idx);const m=new T.Mesh(g,mat);TG.add(m);return tot;};
  const grassPot=(x,z)=>{box(TG,x-0.2,z-0.2,x+0.2,z+0.2,0.1,0.5,woodM);let s=(x*31+z*17)|0;const r=()=>{s=(s*16807+7)%2147483647;return (s%1000)/1000;};
    for(let k=0;k<16;k++){const hgt=0.55+r()*0.45;const c=new T.Mesh(new T.ConeGeometry(0.025,hgt,4),grassM);c.position.copy(W(x+(r()-.5)*0.25,0.5+hgt/2,z+(r()-.5)*0.25));c.rotation.set((r()-.5)*0.7,0,(r()-.5)*0.7);TG.add(c);}};
  const lilyBox=(x0,z0,x1,z1)=>{box(TG,x0,z0,x1,z1,0.1,0.55,woodM);const n=Math.max(2,Math.round(Math.max(x1-x0,z1-z0)/0.3));
    for(let i=0;i<n;i++){const t=(i+.5)/n,x=x0+(x1-x0)*((x1-x0)>(z1-z0)?t:.5),z=z0+(z1-z0)*((x1-x0)>(z1-z0)?.5:t);const l=new T.Mesh(new T.SphereGeometry(0.17,10,8),leafM);l.scale.set(1,0.8,1);l.position.copy(W(x,0.68,z));add(l,TG);
      const f=new T.Mesh(new T.ConeGeometry(0.07,0.12,6),lilyM);f.rotation.x=Math.PI;f.position.copy(W(x+0.05,0.88,z-0.04));TG.add(f);const f2=f.clone();f2.position.copy(W(x-0.06,0.83,z+0.05));TG.add(f2);}};

  // ===== Dintel en L con esquina redonda: 80 cm, base a 4,0 m (RAI 7a) =====
  const xl=0.6,zt=0.6,R=2.0,CX=xl+R,CZ=zt+R,h=0.175,LY0=4.0,LY1=4.8;
  const C=[],N=[];
  for(let i=0;i<=12;i++){C.push([11.85-(11.85-CX)*i/12,zt]);N.push([0,-1]);}
  for(let i=1;i<=32;i++){const a=-Math.PI/2-(Math.PI/2)*i/32;C.push([CX+R*Math.cos(a),CZ+R*Math.sin(a)]);N.push([Math.cos(a),Math.sin(a)]);}
  for(let i=1;i<=12;i++){C.push([xl,CZ+(7.85-CZ)*i/12]);N.push([-1,0]);}
  {const s=new T.Shape();C.forEach((c,i)=>{const x=c[0]+h*N[i][0]-6,z=c[1]+h*N[i][1]-4;i?s.lineTo(x,z):s.moveTo(x,z);});
   for(let i=C.length-1;i>=0;i--)s.lineTo(C[i][0]-h*N[i][0]-6,C[i][1]-h*N[i][1]-4);solid(s,LY0,LY1,redM);}
  const outer=C.map((c,i)=>[c[0]+(h+0.006)*N[i][0],c[1]+(h+0.006)*N[i][1]]),inner=C.map((c,i)=>[c[0]-(h+0.006)*N[i][0],c[1]-(h+0.006)*N[i][1]]);
  const tot=9.25+Math.PI*R/2+(7.85-CZ),logoAt=[4.6,9.25+Math.PI*R/4,9.25+Math.PI*R/2+2.6];
  const band=(bg,rev)=>tex(6000,272,(g,w,hh)=>{g.fillStyle=bg;g.fillRect(0,0,w,hh);const L=IM.logo;if(!L||!L.naturalWidth)return;const lh=hh*0.6,lw=lh*L.naturalWidth/L.naturalHeight;logoAt.forEach(m=>{const u=(rev?tot-m:m)/tot*w;g.drawImage(L,u-lw/2,(hh-lh)/2,lw,lh);});});
  ribbon(outer,LY0,LY1,basic(band('#5d729e',false)),false);
  ribbon(inner,LY0,LY1,basic(band('#141518',true)),true);

  // 7 columnas negras 50×50 cm con imagen, h 4,0 m, ≥ 2 m libres entre ellas (RAI 4b)
  const colB=(x,z,draw,axis)=>{box(TG,x-0.25,z-0.25,x+0.25,z+0.25,0.1,LY0,blackM);const t=tex(300,2700,draw),ph=LY0-0.4,y=0.1+(LY0-0.1)/2,e=0.257;
    if(axis==='x'){plane(TG,0.44,ph,basic(t),W(x+e,y,z),Math.PI/2);plane(TG,0.44,ph,basic(t),W(x-e,y,z),-Math.PI/2);}
    else{plane(TG,0.44,ph,basic(t),W(x,y,z-e),Math.PI);plane(TG,0.44,ph,basic(t),W(x,y,z+e),0);}};
  const PD=[['val',0.6,['Our Core','Values']],['lead',0.72,['Our','Leadership']],['sus',0.32,['Sustain-','ability']],['sci',0.5,['Science &','Innovation']],['bold',0.58,['Bold ideas']],['globe',0.5,['Global','reach']],['award',0.86,['R&D 100','Award']]];
  const ph=i=>photoDraw(PD[i][0],PD[i][1],PD[i][2],i<6?NAMES[i]:'DUPONT WATER SOLUTIONS');
  [11.6,8.6,5.6,CX].forEach((x,i)=>colB(x,zt,ph(i),'z'));
  [CZ,7.6].forEach((z,i)=>colB(xl,z,ph(4+i),'x'));

  // columna roja Ø 1,1 m en el centro de la curva + mostrador curvo (abre hacia la esquina)
  mov('demo','Demo NEXT · mostrador con maqueta',()=>{{const a=Math.PI/4,rm=1.525;cyl(TG,CX+rm*Math.cos(a),CZ+rm*Math.sin(a),0.55,0.1,1.4,redM,64);nextTop(TG,CX+rm*Math.cos(a),CZ+rm*Math.sin(a));}
  ring(CX,CZ,1.35,1.7,-Math.PI/4,3*Math.PI/4,0.1,1.04,whiteF);ring(CX,CZ,1.32,1.73,-Math.PI/4,3*Math.PI/4,1.04,1.1,whiteF);});
  mov('t1','Tótem Challenge Selector 1',()=>totem(TG,4.23,0.97,-3*Math.PI/4));mov('t2','Tótem Challenge Selector 2',()=>totem(TG,0.97,4.23,-3*Math.PI/4));

  // recepción curva en la esquina, bajo el dintel; las dos plantas de césped van como elementos aparte (g1, g2)
  const ra0=Math.PI*207/180,ra1=Math.PI*243/180;
  mov('rec','Mostrador de recepción',()=>{ring(CX,CZ,2.3,2.85,ra0,ra1,0.1,1.04,whiteF);{const pts=[];for(let i=0;i<=32;i++){const a=ra0+(ra1-ra0)*i/32;pts.push([CX+2.862*Math.cos(a),CZ+2.862*Math.sin(a)]);}
    ribbon(pts,0.16,1.0,new T.MeshBasicMaterial({map:tex(1400,660,(g,w,hh)=>{g.fillStyle='#ffffff';g.fillRect(0,0,w,hh);const L=IM.gp;if(!L||!L.naturalWidth)return;const lh=hh*0.8,lw=lh*L.naturalWidth/L.naturalHeight;g.drawImage(L,(w-lw)/2,(hh-lh)/2,lw,lh);}),side:T.DoubleSide}),true);}ring(CX,CZ,2.27,2.88,ra0,ra1,1.04,1.1,whiteF);});
  mov('g1','Planta de césped 1',()=>grassPot(0.35,1.95));
  mov('g2','Planta de césped 2',()=>grassPot(1.95,0.35));

  // almacén curvo h 3,5 m en la esquina opuesta (≤ 1/3 de cada lado, RAI 4a) con pantalla
  const SX=11.9,SZ=7.9,SA=3.5,SB=2.6,SH=3.5;
  mov('alm','Almacén con pantalla',()=>{{const s=new T.Shape();s.moveTo(SX-6,SZ-4);s.lineTo(SX-SA-6,SZ-4);s.absellipse(SX-6,SZ-4,SA,SB,Math.PI,1.5*Math.PI,false);s.lineTo(SX-6,SZ-4);solid(s,0.1,SH+0.1,blackM);}
  const sp=[];for(let i=0;i<=48;i++){const t=Math.PI+(Math.PI/2)*i/48;sp.push([SX+(SA+0.012)*Math.cos(t),SZ+(SB+0.012)*Math.sin(t)]);}
  ribbon(sp,0.1,SH+0.1,basic(tex(2400,1760,(g,w,hh)=>{cover(g,IM.gp3d,w,hh,0.5,0.5);})),true);
  plane(TG,SA,SH,basic(tex(1100,1100,photoDraw('bold',0.58,['Bringing bold ideas','to complex challenges'],'DUPONT WATER SOLUTIONS',0.75,2))),W(SX-SA/2,SH/2+0.1,SZ+0.012),0);
  plane(TG,SB,SH,basic(tex(830,1100,photoDraw('lead',0.68,['Our','Leadership'],'POSSIBILITY FLOWS WITH US'))),W(SX+0.012,SH/2+0.1,SZ-SB/2),Math.PI/2);});

  // barra curva concéntrica al almacén, con taburetes hacia el stand
  const bt0=Math.PI*200/180,bt1=Math.PI*240/180;
  mov('bar','Barra curva',()=>{ering(SX,SZ,4.3,3.4,4.85,3.95,bt0,bt1,0.1,1.04,whiteF);ering(SX,SZ,4.27,3.37,4.9,4.0,bt0,bt1,1.04,1.1,whiteF);
  for(let k=0;k<4;k++){const t=Math.PI*(205+k*10)/180,x=SX+5.35*Math.cos(t),z=SZ+4.45*Math.sin(t);cyl(TG,x,z,0.03,0.1,0.75,M.stool,8);cyl(TG,x,z,0.2,0.75,0.8,M.stool);}});

  // 2 salas de reunión circulares de cristal (aros azules abiertos hacia el stand)
  const room=(cx,cz,Rr,od)=>{const gap=1.9,a0=od+gap/2,len=2*Math.PI-gap;
    const g=new T.Mesh(new T.CylinderGeometry(Rr,Rr,2.32,72,1,true,Math.PI/2-(a0+len),len),glassW);g.position.copy(W(cx,1.34,cz));TG.add(g);
    const arc=(r,tube,y,m)=>{const geo=new T.TorusGeometry(r,tube,8,72,len);geo.rotateX(Math.PI/2);geo.rotateY(-a0);const t=new T.Mesh(geo,m);t.position.copy(W(cx,y,cz));t.castShadow=true;TG.add(t);};
    arc(Rr,0.06,2.56,redM);arc(Rr,0.05,0.15,redM);arc(Rr-0.01,0.03,2.45,whiteF);
    for(let k=0;k<=6;k++){const a=a0+len*k/6;cyl(TG,cx+Rr*Math.cos(a),cz+Rr*Math.sin(a),0.03,0.18,2.5,whiteF,8);}
    const bd=od+Math.PI,span=1.6/Rr,mid=Math.PI/2-bd;const lo=glassLogo(),li=lo.clone();li.needsUpdate=true;li.wrapS=T.RepeatWrapping;li.repeat.x=-1;li.offset.x=1;
    const mk=(r,t,side)=>{const m=new T.Mesh(new T.CylinderGeometry(r,r,1.6*300/1024,48,1,true,mid-span/2,span),new T.MeshBasicMaterial({map:t,transparent:true,depthWrite:false,side}));m.position.copy(W(cx,1.6,cz));TG.add(m);};
    mk(Rr+0.012,lo,T.FrontSide);mk(Rr-0.012,li,T.BackSide);
    const tx=cx+0.2*Math.cos(bd),tz=cz+0.2*Math.sin(bd);cyl(TG,tx,tz,0.5,0.8,0.84,M.white,32);cyl(TG,tx,tz,0.06,0.1,0.8,M.white);
    box(TG,tx-0.16,tz-0.11,tx+0.16,tz+0.11,0.84,0.86,blackM);
    [0,1,2,3].forEach(k=>{const a=bd+Math.PI/4+k*Math.PI/2,x=tx+0.85*Math.cos(a),z=tz+0.85*Math.sin(a);cyl(TG,x,z,0.24,0.1,0.5,M.chair,16);cyl(TG,x,z,0.03,0.1,0.48,M.stool,6);});};
  mov('s1','Sala de reunión 1',()=>room(2.2,6.3,1.5,Math.atan2(4-6.3,6-2.2)));
  mov('s2','Sala de reunión 2',()=>room(9.9,2.2,1.5,Math.atan2(4-2.2,6-9.9)));
  mov('j1','Jardinera 1',()=>lilyBox(3.9,6.6,4.3,7.6));mov('j2','Jardinera 2',()=>lilyBox(7.7,1.5,8.1,2.6));

  // mesas altas
  [[5.2,3.6],[6.5,1.8],[5.4,6.9]].forEach((c,i)=>mov('m'+(i+1),'Mesa alta '+(i+1),()=>hightable(TG,c[0],c[1])));
}

// ---------- biblioteca de elementos ----------
// Catálogo de los elementos móviles del stand, uno por tipo, para reutilizarlos (modo editor).
// Las medidas se toman de la plantilla en su posición original, antes de que el usuario la mueva.
// Consulta desde la consola o desde el editor: GPLIB.list(), GPLIB.get('cesp'), GPLIB.add('cesp',{x:1,z:0.5,r:0}).
const LIB_CAT={mostrador:'Mostradores y barras',estructura:'Estructuras y salas',senal:'Señalética',mobiliario:'Mobiliario',vegetacion:'Vegetación'};
const LIB_META={
  rec:{cat:'mostrador',desc:'Mostrador curvo de recepción con logo GPworx en el frontal, altura 1,00 m'},
  demo:{cat:'mostrador',desc:'Mostrador curvo con cilindro Ø 1,1 m y maqueta NEXT'},
  bar:{cat:'mostrador',desc:'Barra curva elíptica, altura 1,00 m, con 4 taburetes'},
  alm:{cat:'estructura',desc:'Almacén curvo h 3,5 m con pantalla e imágenes'},
  sala:{cat:'estructura',desc:'Sala de reunión circular de cristal Ø 3 m con mesa y 4 sillas'},
  totem:{cat:'senal',desc:'Tótem Challenge Selector 55 cm de ancho con gráfica'},
  mesa:{cat:'mobiliario',desc:'Mesa alta Ø 64 cm con 3 taburetes'},
  jard:{cat:'vegetacion',desc:'Jardinera de madera con lirios'},
  cesp:{cat:'vegetacion',desc:'Maceta de madera 40×40 cm con césped ornamental (gramíneas)'},
};
const LIB={};
ORIG.forEach(G=>{const t=G.userData.type;if(LIB[t])return;
  const bb=new T.Box3().setFromObject(G),s=bb.getSize(new T.Vector3()),r2=v=>Math.round(v*100)/100,meta=LIB_META[t]||{};
  LIB[t]={id:t,nombre:TYPES[t],categoria:meta.cat||'otros',descripcion:meta.desc||'',plantilla:G.userData.key,
    medidas:{ancho:r2(s.x),fondo:r2(s.z),alto:r2(bb.max.y-0.1)},origen:'Option A · Dintel a Entrada'};});


// ---------- RAI 2 m zone overlay ----------
const zoneG=new T.Group();scene.add(zoneG);zoneG.visible=false;
{const band=new T.MeshBasicMaterial({color:0xffb020,transparent:true,opacity:.28,depthWrite:false});
 [[0,0,12,2],[0,6,12,8],[0,2,2,6],[10,2,12,6]].forEach(a=>{const m=new T.Mesh(new T.PlaneGeometry(a[2]-a[0],a[3]-a[1]),band);m.rotation.x=-Math.PI/2;m.position.copy(W((a[0]+a[2])/2,0.115,(a[1]+a[3])/2));zoneG.add(m);});
 const g=new T.BufferGeometry().setFromPoints([W(2,0.12,2),W(10,0.12,2),W(10,0.12,6),W(2,0.12,6),W(2,0.12,2)]);const l=new T.Line(g,new T.LineDashedMaterial({color:0xffb020,dashSize:0.3,gapSize:0.2}));l.computeLineDistances();zoneG.add(l);}
// ---------- data ----------
const DATA={
 C:{t:'Dintel a Entrada',s:'Dintel azul en L con esquina redonda, almacén curvo y 2 salas de cristal',g:B,
  m:[[1,'Dintel azul 80 cm en L, base a 4,0 m, esquina redonda',W(7.2,5.2,0.6)],[2,'Recepción curva en la esquina',W(1.0,1.6,1.0),'rec','rec'],[3,'Zona lanzamiento NEXT · maqueta sobre cilindro',W(3.68,2.4,3.68),'demo','demo'],[4,'6 columnas negras 50×50 cm · 4 en el lado largo y 2 en el corto',W(0.6,2.6,7.6)],[5,'Almacén curvo h 3,5 m con pantalla',W(10.6,3.9,6.8),'alm','alm'],[6,'Barra curva respaldada por el almacén',W(8.7,1.6,5.4),'bar','bar'],[7,'Salas de reunión de cristal',W(2.2,2.9,6.3),'sala','s1'],[8,'Tótems Challenge Selector',W(4.23,2.3,0.97),'totem','t1'],[9,'Mesas altas',W(5.2,1.4,3.6),'mesa','m1'],[10,'Jardineras de lirios',W(4.1,1.2,7.1),'jard','j1'],[11,'Plantas de césped junto a la recepción',W(0.35,1.15,1.95),'cesp','g1']],
  d:'Un dintel azul de 80 cm en L, con la esquina redondeada sobre la recepción, recorre el pasillo del muro y el lateral izquierdo apoyado en 6 columnas negras con imágenes. Detrás, la zona de lanzamiento NEXT (mostrador curvo con la maqueta sobre un cilindro azul incrustado) y dos tótems en sus extremos marcan la entrada. Al fondo, el almacén curvo con pantalla respalda una barra curva y queda flanqueado por dos salas de reunión circulares de cristal.',
  n:[['Dintel 80 cm a 4,0 m','Elemento ≤ 100 cm con base ≥ 4,0 m: anchura libre (7a); altura total 4,8 m.'],['6 columnas 50×50 cm','4 en el lado largo (frente) y 2 en el corto (lateral), separadas ≥ 2 m libres, h 4,0 m (4b).'],['Almacén h 3,5 m','Ocupa 3,5 m del lado de 12 m (≤ 4 m) y 2,6 m del de 8 m (≤ 2,67 m) (4a).'],['Lados abiertos','Salas en cristal (cuentan como abierto); recepción, barra y mostradores < 1,30 m; cilindro azul 1,4 m integrado en el mostrador.']],
  f:[['DINTEL CURVO','Esquina redonda sobre la recepción'],['ZONA LANZAMIENTO NEXT','Maqueta sobre cilindro azul'],['BARRA CURVA','Respaldada por el almacén con pantalla'],['2 SALAS DE CRISTAL','Reuniones privadas y visibles']]}
};
// marcadores ligados a elementos móviles: guardar posición local
DATA.C.m.forEach(m=>{if(m[3]){const G=TEMPL[m[4]];m[5]=G.worldToLocal(m[2].clone());}});
// ---------- camera control ----------
const target=new T.Vector3(0,1.4,0);
let th=-2.45,ph=1.08,rad=19,auto=false;
const VIEWS={main:[-2.45,1.08,19],aerial:[0.0,0.18,20],front:[Math.PI,1.32,15],side:[-Math.PI/2,1.3,16],entry:[-2.6,1.4,9],hall:[-2.25,0.82,52],arrive:[-1.75,1.36,26]};
let anim=null;
function setView(k){const v=VIEWS[k];anim={from:[th,ph,rad],to:v,t:0};}
function upd(){camera.position.set(target.x+rad*Math.sin(ph)*Math.sin(th),target.y+rad*Math.cos(ph),target.z+rad*Math.sin(ph)*Math.cos(th));camera.lookAt(target);}
let drag=null,itemDrag=null,sel=null,downAt=null;
const ray=new T.Raycaster(),ndc=new T.Vector2(),ground=new T.Plane(new T.Vector3(0,1,0),-0.1),hitP=new T.Vector3();
let selBox=null;
function setNdc(e){const r=canvas.getBoundingClientRect();ndc.set((e.clientX-r.left)/r.width*2-1,-((e.clientY-r.top)/r.height)*2+1);ray.setFromCamera(ndc,camera);}
function pick(e){setNdc(e);const h=ray.intersectObjects(B.children,true);for(const x of h){if(!x.object.visible)continue;let o=x.object;while(o&&o.parent!==B)o=o.parent;return o&&MOV.includes(o)?o:null;}return null;}
const LS='dupontC-config-v1';
// window.GP_LS_KEY permite que una copia de prueba (p. ej. designer/bib) guarde aparte y no toque los montajes de la principal
const LS2=window.GP_LS_KEY||'dupontC-config-v2';let uid=0;
function save(){if(VIEW_ONLY)return;try{localStorage.setItem(LS2,JSON.stringify(MOV.map(G=>({k:G.userData.key,s:G.userData.src,x:+G.position.x.toFixed(3),z:+G.position.z.toFixed(3),r:+G.rotation.y.toFixed(4)}))));}catch(_){}}
function cloneOf(srcG,key){const G=srcG.clone(true);G.userData={key,src:srcG.userData.src,type:srcG.userData.type,name:'',home:{x:srcG.position.x,z:srcG.position.z,r:0}};return G;}
function place(G,x,z,r){G.position.x=x;G.position.z=z;G.rotation.y=r||0;if(!B.children.includes(G))B.add(G);if(!MOV.includes(G))MOV.push(G);}
function unplace(G){B.remove(G);const i=MOV.indexOf(G);if(i>=0)MOV.splice(i,1);}
// coloca g1/g2 respecto a cada mostrador de recepción, con el mismo desfase y giro que en el diseño original
function placeGrassWithReception(){const R0=TEMPL.rec.userData.home;
  MOV.filter(G=>G.userData.type==='rec').forEach((R,n)=>{const th=R.rotation.y,c=Math.cos(th),s=Math.sin(th);
    ['g1','g2'].forEach(k=>{const T0=TEMPL[k],h=T0.userData.home,dx=h.x-R0.x,dz=h.z-R0.z;
      const G=n===0&&!MOV.includes(T0)?T0:cloneOf(T0,'n'+Date.now().toString(36)+(uid++));
      place(G,R.position.x+dx*c+dz*s,R.position.z-dx*s+dz*c,th);});});}
function renameAll(){Object.keys(TYPES).forEach(t=>{const L=MOV.filter(G=>G.userData.type===t);L.forEach((G,i)=>G.userData.name=TYPES[t]+(L.length>1?' '+(i+1):''));});}
function load(){try{const a=JSON.parse(localStorage.getItem(LS2)||'null');
    if(Array.isArray(a)){ORIG.forEach(unplace);a.forEach(e=>{const T0=TEMPL[e.s];if(!T0)return;let G=TEMPL[e.k];if(!G||MOV.includes(G)){G=cloneOf(T0,e.k||('n'+(uid++)));}place(G,e.x,e.z,e.r);});
      // montajes guardados antes de separar las plantas de césped del mostrador: colocarlas junto a cada recepción
      if(!a.some(e=>e.s==='g1'||e.s==='g2'))placeGrassWithReception();}
    else{const o=JSON.parse(localStorage.getItem(LS)||'null');if(o)MOV.forEach(G=>{const v=o[G.userData.key];if(v){G.position.x=v[0];G.position.z=v[1];G.rotation.y=v[2];}});}
  }catch(_){}renameAll();}
function addOf(type,from){const L=MOV.filter(G=>G.userData.type===type);const src=from||L[L.length-1];
  const T0=src||ORIG.find(G=>G.userData.type===type);const key='n'+Date.now().toString(36)+(uid++);const G=cloneOf(T0,key);
  if(src){place(G,src.position.x+0.9,src.position.z+0.9,src.rotation.y);}else{place(G,T0.userData.home.x,T0.userData.home.z,0);}
  clampPos(G);G.userData.home={x:G.position.x,z:G.position.z,r:0};renameAll();save();refresh();select(G);}
function removeOf(type,G){if(!G){const L=MOV.filter(o=>o.userData.type===type);G=(sel&&sel.userData.type===type)?sel:L[L.length-1];}if(!G)return;
  if(sel===G)select(null);unplace(G);renameAll();save();refresh();}
const fmt=n=>n.toFixed(2).replace('.',',');
function selInfo(){if(!sel)return;let d=Math.round(((-sel.rotation.y*180/Math.PI)%360+360)%360);
  document.getElementById('selP').textContent=`X ${fmt(sel.position.x+6)} m · Y ${fmt(sel.position.z+4)} m · giro ${d}°`;}
function select(G){sel=G;if(selBox){scene.remove(selBox);selBox=null;}
  const p=document.getElementById('sel');stage.classList.toggle('editing',!!G);p.hidden=!G;
  document.querySelectorAll('#legend li').forEach(li=>li.classList.toggle('on',!!(G&&li.dataset.t===G.userData.type)));
  if(!G)return;selBox=new T.BoxHelper(G,0xffb020);selBox.material.depthTest=false;selBox.renderOrder=9;scene.add(selBox);
  document.getElementById('selN').textContent=G.userData.name;selInfo();}
function clampPos(G){G.position.x=Math.min(5.9,Math.max(-5.9,Math.round(G.position.x/0.05)*0.05));G.position.z=Math.min(3.9,Math.max(-3.9,Math.round(G.position.z/0.05)*0.05));}
// ---------- cuadrícula 1×1 m ----------
const gridG=new T.Group();gridG.visible=false;scene.add(gridG);
{const pts=[];for(let x=0;x<=12;x++)pts.push(W(x,0.104,0),W(x,0.104,8));for(let z=0;z<=8;z++)pts.push(W(0,0.104,z),W(12,0.104,z));
 const g=new T.BufferGeometry().setFromPoints(pts);const l=new T.LineSegments(g,new T.LineBasicMaterial({color:0x8a8d94,transparent:true,opacity:.9}));gridG.add(l);}
document.getElementById('gridBtn').onclick=e=>{gridG.visible=!gridG.visible;e.currentTarget.classList.toggle('on',gridG.visible);e.currentTarget.setAttribute('aria-pressed',gridG.visible);};
// ---------- medición ----------
const measG=new T.Group();scene.add(measG);const mlWrap=document.getElementById('mlabels');
const mMat=new T.LineBasicMaterial({color:0xffb020,depthTest:false,transparent:true}),dGeo=new T.SphereGeometry(0.045,14,10),dMat=new T.MeshBasicMaterial({color:0xffb020,depthTest:false,transparent:true});
let measOn=false,MEAS=[],pend=null;
function mHit(e){setNdc(e);const h=ray.intersectObjects([B,common],true).find(x=>x.object.isMesh&&x.object.visible);if(h)return h.point.clone();const p=new T.Vector3();return ray.ray.intersectPlane(ground,p)?p:null;}
function mDot(p){const d=new T.Mesh(dGeo,dMat);d.position.copy(p);d.renderOrder=11;measG.add(d);return d;}
function mLine(a,b){const l=new T.Line(new T.BufferGeometry().setFromPoints([a,b]),mMat);l.renderOrder=11;measG.add(l);return l;}
function mLabel(pv){const el=document.createElement('div');el.className='ml'+(pv?' pv':'');mlWrap.appendChild(el);return el;}
const cm=(a,b)=>Math.round(a.distanceTo(b)*100).toLocaleString('es-ES')+' cm';
function mSet(o,b){o.b=b;o.line.geometry.setFromPoints([o.a,b]);o.el.textContent=cm(o.a,b);}
function measClick(e){const p=mHit(e);if(!p)return;
  if(!pend){pend={a:p,da:mDot(p),line:mLine(p,p),el:mLabel(true),b:p};pend.el.textContent='0 cm';return;}
  mSet(pend,p);pend.db=mDot(p);pend.el.classList.remove('pv');MEAS.push(pend);pend=null;document.getElementById('measClr').hidden=false;}
function measHover(e){if(!pend)return;const p=mHit(e);if(p)mSet(pend,p);}
function measClear(){measG.clear();mlWrap.innerHTML='';MEAS=[];pend=null;document.getElementById('measClr').hidden=true;}
function measMode(on){measOn=on;if(on)select(null);if(!on&&pend){measG.remove(pend.da,pend.line);pend.el.remove();pend=null;}
  const b=document.getElementById('measBtn');b.classList.toggle('on',on);b.setAttribute('aria-pressed',on);stage.classList.toggle('measuring',on);document.getElementById('mhint').hidden=!on;}
document.getElementById('measBtn').onclick=()=>measMode(!measOn);
document.getElementById('measClr').onclick=measClear;
window.addEventListener('keydown',e=>{if(e.key==='Escape'&&measOn)measMode(false);});
canvas.addEventListener('pointerdown',e=>{if(pinch)return;anim=null;canvas.setPointerCapture(e.pointerId);downAt={x:e.clientX,y:e.clientY};
  if(measOn){drag={x:e.clientX,y:e.clientY};return;}
  const G=VIEW_ONLY?null:pick(e);
  if(G){select(G);if(ray.ray.intersectPlane(ground,hitP)){itemDrag={G,dx:G.position.x-hitP.x,dz:G.position.z-hitP.z,moved:false};auto=false;stage.classList.add('dragging');}return;}
  drag={x:e.clientX,y:e.clientY};});
canvas.addEventListener('pointermove',e=>{
  if(measOn&&!drag&&e.pointerType==='mouse')measHover(e);
  if(itemDrag){if(pinch){itemDrag=null;return;}setNdc(e);if(ray.ray.intersectPlane(ground,hitP)){const G=itemDrag.G;G.position.x=hitP.x+itemDrag.dx;G.position.z=hitP.z+itemDrag.dz;clampPos(G);itemDrag.moved=true;selInfo();}return;}
  if(!drag||pinch)return;th-=(e.clientX-drag.x)*0.006;ph=Math.min(1.5,Math.max(0.12,ph-(e.clientY-drag.y)*0.005));drag={x:e.clientX,y:e.clientY};});
canvas.addEventListener('pointerup',e=>{
  if(itemDrag){if(itemDrag.moved)save();itemDrag=null;stage.classList.remove('dragging');return;}
  if(drag&&downAt&&Math.hypot(e.clientX-downAt.x,e.clientY-downAt.y)<6){if(measOn)measClick(e);else select(null);}
  drag=null;});
canvas.addEventListener('pointercancel',()=>{drag=null;if(itemDrag){save();itemDrag=null;}stage.classList.remove('dragging');});
document.querySelectorAll('#sel button[data-r]').forEach(b=>b.onclick=()=>{if(!sel)return;sel.rotation.y-=(+b.dataset.r)*Math.PI/180;save();selInfo();});
document.getElementById('selHome').onclick=()=>{if(!sel)return;const h=sel.userData.home;sel.position.x=h.x;sel.position.z=h.z;sel.rotation.y=0;save();selInfo();};
document.getElementById('selX').onclick=()=>select(null);
document.getElementById('selDup').onclick=()=>{if(sel)addOf(sel.userData.type,sel);};
document.getElementById('selDel').onclick=()=>{if(sel)removeOf(sel.userData.type,sel);};
window.addEventListener('keydown',e=>{if(!sel||/INPUT|TEXTAREA/.test(document.activeElement.tagName))return;if(e.key==='Delete'||e.key==='Backspace'){e.preventDefault();removeOf(sel.userData.type,sel);}});
let rT=null;document.getElementById('resetAll').onclick=e=>{const b=e.currentTarget;if(!rT){b.textContent='Sure? Tap again';b.classList.add('on');rT=setTimeout(()=>{rT=null;b.textContent='Reset';b.classList.remove('on');},3000);return;}clearTimeout(rT);rT=null;b.textContent='Reset';b.classList.remove('on');select(null);MOV.slice().forEach(unplace);ORIG.forEach(G=>{const h=G.userData.home;place(G,h.x,h.z,0);});renameAll();save();refresh();};
if(!VIEW_ONLY)load();
canvas.addEventListener('wheel',e=>{e.preventDefault();rad=Math.min(90,Math.max(6,rad*(1+e.deltaY*0.001)));},{passive:false});
let pinch=null;
canvas.addEventListener('touchstart',e=>{if(e.touches.length===2){pinch=Math.hypot(e.touches[0].clientX-e.touches[1].clientX,e.touches[0].clientY-e.touches[1].clientY);}},{passive:true});
canvas.addEventListener('touchmove',e=>{if(pinch&&e.touches.length===2){const d=Math.hypot(e.touches[0].clientX-e.touches[1].clientX,e.touches[0].clientY-e.touches[1].clientY);rad=Math.min(90,Math.max(6,rad*pinch/d));pinch=d;}},{passive:true});
canvas.addEventListener('touchend',()=>{pinch=null;});
canvas.style.touchAction='none';

// ---------- UI ----------
const mkWrap=document.getElementById('markers');let cur='C',mkEls=[];
let MKS=[];
function renderLegend(){const d=DATA[cur];
  document.getElementById('legend').innerHTML=d.m.map(m=>{if(!m[3]||VIEW_ONLY)return `<li><b>${m[0]}</b><span>${m[1]}</span></li>`;
    const n=MOV.filter(G=>G.userData.type===m[3]).length;
    return `<li class="mv" data-t="${m[3]}"><span class="pm"><button type="button" data-a="-" aria-label="Quitar ${m[1]}"${n?'':' disabled'}>−</button><b>${m[0]}</b><button type="button" data-a="+" aria-label="Añadir ${m[1]}">+</button></span><span class="nm">${m[1]}</span><i class="ct">×${n}</i></li>`;}).join('');
  document.querySelectorAll('#legend li.mv').forEach(li=>{const t=li.dataset.t;
    li.querySelector('[data-a="+"]').onclick=e=>{e.stopPropagation();addOf(t);};
    li.querySelector('[data-a="-"]').onclick=e=>{e.stopPropagation();removeOf(t);};
    li.onclick=()=>{const L=MOV.filter(G=>G.userData.type===t);if(!L.length)return;const i=sel?L.indexOf(sel):-1;select(L[(i+1)%L.length]);stage.scrollIntoView({behavior:'smooth',block:'center'});};});
  if(sel)select(sel);}
function rebuildMarkers(){const d=DATA[cur];mkWrap.innerHTML='';MKS=[];
  d.m.forEach(m=>{const Gs=m[3]?MOV.filter(G=>G.userData.type===m[3]):[null];
    Gs.forEach(G=>{const e=document.createElement('div');e.className='mk'+(m[3]&&!VIEW_ONLY?' mv':'');e.textContent=m[0];mkWrap.appendChild(e);
      MKS.push({e,m,G,loc:G?(G.userData.src===m[4]?m[5].clone():new T.Vector3(0,m[2].y,0)):null});});});
  mkEls=MKS.map(o=>o.e);}
function refresh(){renderLegend();rebuildMarkers();}
function show(k){cur=k;const d=DATA[k];
  document.getElementById('tk').textContent='OPTION A';document.getElementById('tt').textContent='';document.getElementById('ts').textContent='';document.querySelector('.title-ov .sep').style.display='none';
  document.getElementById('desc').textContent=d.d;
  document.getElementById('strip').innerHTML=d.f.map(f=>`<div><b>${f[0]}</b><span>${f[1]}</span></div>`).join('');
  document.getElementById('norm').innerHTML=d.n.map(f=>`<div><b>✓ ${f[0]}</b><span>${f[1]}</span></div>`).join('');
  refresh();
}
document.querySelectorAll('.views button[data-v]').forEach(b=>b.onclick=()=>{auto=false;setView(b.dataset.v);});
document.getElementById('rot').onclick=()=>{auto=!auto;anim=null;};
document.getElementById('zone').onclick=e=>{zoneG.visible=!zoneG.visible;e.currentTarget.classList.toggle('on',zoneG.visible);};
show('C');

// API pública de la biblioteca (para el futuro modo editor)
window.GPLIB={
  categorias:LIB_CAT,
  list:cat=>Object.values(LIB).filter(e=>!cat||e.categoria===cat).map(e=>({...e,enEscena:MOV.filter(G=>G.userData.type===e.id).length})),
  get:id=>LIB[id]?{...LIB[id],enEscena:MOV.filter(G=>G.userData.type===id).length}:null,
  // incorpora un elemento: sin posición, se coloca junto al último del mismo tipo o en su sitio original (metros, origen en el centro del stand)
  add(id,pos){if(VIEW_ONLY||!LIB[id])return null;const src=TEMPL[LIB[id].plantilla];
    if(!pos){addOf(id);return sel?sel.userData.key:null;}
    const G=cloneOf(src,'n'+Date.now().toString(36)+(uid++));place(G,pos.x||0,pos.z||0,pos.r||0);clampPos(G);
    G.userData.home={x:G.position.x,z:G.position.z,r:0};renameAll();save();refresh();select(G);return G.userData.key;},
  remove(id){if(!VIEW_ONLY&&LIB[id])removeOf(id);},
  toJSON:()=>JSON.stringify({version:1,elementos:Object.values(LIB)},null,2),
};


// ---------- captura + envío directo ----------
const SEND_ENDPOINT=window.GP_SEND_ENDPOINT||'send.php',SEND_TO='gregor@gpworx.com';
const shotBtn=document.getElementById('shotBtn'),shotBox=document.getElementById('shotBox'),shotImg=document.getElementById('shotImg'),shotMsg=document.getElementById('shotMsg');
let shotBlob=null,shotURL=null,sending=false;
function capture(){const hadSel=selBox&&selBox.visible;if(selBox)selBox.visible=false;renderer.render(scene,camera);
  const src=canvas,W0=src.width,H0=src.height,sc=W0/stage.clientWidth,foot=Math.round(64*sc);
  const c=document.createElement('canvas');c.width=W0;c.height=H0+foot;const g=c.getContext('2d');
  g.drawImage(src,0,0);if(selBox)selBox.visible=!!hadSel;
  mkEls.forEach(e=>{if(e.style.display==='none')return;const x=parseFloat(e.style.left)*sc,y=parseFloat(e.style.top)*sc,r=12*sc;
    g.beginPath();g.arc(x,y,r,0,Math.PI*2);g.fillStyle=e.classList.contains('mv')?'#ffb020':'#3d9bff';g.fill();g.lineWidth=2*sc;g.strokeStyle='#fff';g.stroke();
    g.fillStyle=e.classList.contains('mv')?'#222':'#fff';g.font=`bold ${12*sc}px Helvetica,Arial`;g.textAlign='center';g.textBaseline='middle';g.fillText(e.textContent,x,y+0.5*sc);});
  document.querySelectorAll('#mlabels .ml').forEach(e=>{if(e.style.display==='none'||!e.textContent)return;const x=parseFloat(e.style.left)*sc,y=parseFloat(e.style.top)*sc;
    g.font=`bold ${13*sc}px Helvetica,Arial`;const tw=g.measureText(e.textContent).width+16*sc,th2=22*sc;g.fillStyle='#ffb020';g.fillRect(x-tw/2,y-th2/2,tw,th2);g.fillStyle='#222';g.textAlign='center';g.textBaseline='middle';g.fillText(e.textContent,x,y+0.5*sc);});
  g.fillStyle='#5d729e';g.fillRect(0,H0,W0,foot);g.fillStyle='#fff';g.textBaseline='middle';g.textAlign='left';g.font=`bold ${18*sc}px Helvetica,Arial`;
  g.fillText('Stand - Event 2027 · Option A',20*sc,H0+foot/2);
  g.textAlign='right';g.font=`${15*sc}px Helvetica,Arial`;g.fillText(new Date().toLocaleString('es-ES',{dateStyle:'short',timeStyle:'short'}),W0-20*sc,H0+foot/2);
  return new Promise(r=>c.toBlob(r,'image/png'));}
function layoutText(){return MOV.map(G=>{const d=Math.round(((-G.rotation.y*180/Math.PI)%360+360)%360);return `· ${G.userData.name}: X ${fmt(G.position.x+6)} m, Y ${fmt(G.position.z+4)} m, giro ${d}°`;}).join('\n');}
const fname=()=>'stand-event-option-A-'+new Date().toISOString().slice(0,16).replace(/[:T]/g,'-')+'.png';
const subj='Stand - Event 2027 · Option A · configuración';
const bodyTxt=()=>'Captura de la configuración del stand (Option A).\n\nPosiciones (X sobre el lado de 12 m, Y sobre el de 8 m, desde la esquina de la recepción):\n'+layoutText()+'\n';
shotBtn.onclick=async()=>{if(sending)return;sending=true;shotBtn.disabled=true;
  try{shotBlob=await capture();if(shotURL)URL.revokeObjectURL(shotURL);shotURL=URL.createObjectURL(shotBlob);shotImg.src=shotURL;shotBox.hidden=false;
    shotMsg.textContent='Enviando captura a '+SEND_TO+'…';
    const fd=new FormData();fd.append('subject',subj);fd.append('body',bodyTxt());fd.append('image',shotBlob,fname());
    const r=await fetch(SEND_ENDPOINT,{method:'POST',body:fd});const j=await r.json().catch(()=>({}));
    if(!r.ok||!j.ok)throw new Error(j.error||('HTTP '+r.status));
    shotMsg.innerHTML='✓ Captura enviada a <b></b>.';shotMsg.querySelector('b').textContent=SEND_TO;
  }catch(e){
    shotMsg.textContent='No se pudo enviar la captura ('+String(e.message||e)+'). Inténtalo de nuevo en un momento.';
  }finally{sending=false;shotBtn.disabled=false;}};
document.getElementById('shotCancel').onclick=()=>{shotBox.hidden=true;shotMsg.textContent='';};
// ---------- protección ----------
(function(){
  const logo=document.querySelector('header img.gp');const WM_SRC=logo?logo.src:'';
  const tile=document.getElementById('wmTile');
  if(tile&&WM_SRC){const im=new Image();im.onload=()=>{const w=200,h=Math.round(w*im.height/im.width),cw=360,ch=h+150,c=document.createElement('canvas');
    c.width=cw*2;c.height=ch*2;const g=c.getContext('2d');g.scale(2,2);g.shadowColor='rgba(0,0,0,.55)';g.shadowBlur=3;g.drawImage(im,(cw-w)/2,(ch-h)/2,w,h);
    tile.style.backgroundImage='url("'+c.toDataURL('image/png')+'")';tile.style.backgroundSize=cw+'px '+ch+'px';};im.src=WM_SRC;}
  const block=e=>{e.preventDefault();};
  document.addEventListener('contextmenu',block);
  document.addEventListener('dragstart',block);
  document.addEventListener('selectstart',e=>{if(!/INPUT|TEXTAREA/.test(e.target.tagName))e.preventDefault();});
  document.addEventListener('copy',block);
  const shield=on=>document.body.classList.toggle('shield',on);
  window.addEventListener('blur',()=>shield(true));
  window.addEventListener('focus',()=>shield(false));
  document.addEventListener('visibilitychange',()=>shield(document.hidden));
  document.addEventListener('keydown',e=>{
    const k=(e.key||'').toLowerCase();
    if((e.ctrlKey||e.metaKey)&&(k==='s'||k==='p'||(e.shiftKey&&(k==='3'||k==='4'||k==='5'||k==='s')))){e.preventDefault();shield(true);setTimeout(()=>shield(false),1500);}
    if(k==='printscreen'){shield(true);setTimeout(()=>shield(false),1500);}
  });
  document.addEventListener('keyup',e=>{if((e.key||'').toLowerCase()==='printscreen'){try{navigator.clipboard&&navigator.clipboard.writeText('');}catch(_){}shield(true);setTimeout(()=>shield(false),1500);}});
  window.addEventListener('beforeprint',()=>shield(true));window.addEventListener('afterprint',()=>shield(false));
})();
function resize(){const w=stage.clientWidth,h=stage.clientHeight;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();}
window.addEventListener('resize',resize);resize();
setInterval(()=>countdowns.forEach(c=>{c.draw(c.g,c.w,c.h);c.t.needsUpdate=true;}),1000);
const v=new T.Vector3();
function loop(){requestAnimationFrame(loop);
  if(anim){anim.t=Math.min(1,anim.t+0.035);const e=1-Math.pow(1-anim.t,3);
    let dt=anim.to[0]-anim.from[0];dt=Math.atan2(Math.sin(dt),Math.cos(dt));
    th=anim.from[0]+dt*e;ph=anim.from[1]+(anim.to[1]-anim.from[1])*e;rad=anim.from[2]+(anim.to[2]-anim.from[2])*e;if(anim.t>=1)anim=null;}
  if(auto)th+=0.003;
  upd();renderer.render(scene,camera);
  const w=stage.clientWidth,h=stage.clientHeight,d=DATA[cur];
  if(selBox)selBox.update();
  MEAS.concat(pend?[pend]:[]).forEach(o=>{v.copy(o.a).add(o.b).multiplyScalar(.5).project(camera);if(v.z>1||v.z<-1){o.el.style.display='none';return;}o.el.style.display='';o.el.style.left=((v.x+1)/2*w)+'px';o.el.style.top=((1-v.y)/2*h)+'px';});
  MKS.forEach(o=>{const e=o.e;if(o.G)v.copy(o.loc).applyMatrix4(o.G.matrixWorld);else v.copy(o.m[2]);v.project(camera);
    if(v.z>1||v.z<-1){e.style.display='none';return;}e.style.display='flex';e.style.left=((v.x+1)/2*w)+'px';e.style.top=((1-v.y)/2*h)+'px';});
}
loop();
}
(function(){const IM={};const ks=Object.keys(IMGSRC);let n=0;ks.forEach(k=>{const i=new Image();i.onload=i.onerror=()=>{IM[k]=i;if(++n===ks.length)main(IM);};i.src=IMGSRC[k];});})();
