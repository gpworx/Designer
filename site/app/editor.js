// =====================================================================
// GPworx Stand Editor · EDITOR
// © GPworx — Diseños y elementos de autoría propia.
// ---------------------------------------------------------------------
// Secciones:
//   · proyecto          → formato JSON, guardado automático, abrir/guardar archivo
//   · escena            → luces, pabellón, suelo del stand, cuadrícula
//   · elementos         → construir/reconstruir desde la biblioteca
//   · cámara y gestos   → un dedo gira, pellizco = zoom, dos dedos = desplazar
//   · selección y arrastre
//   · deshacer / rehacer
//   · hojas: biblioteca, propiedades, menú
//   · captura + envío (send.php, espera de 3 min)
//   · protección       → marca de agua, bloqueos
// Modo solo visor: ?view=1 en la dirección o window.GP_VIEW_ONLY=true
// Cargar un proyecto: ?p=projects/option-a.json
// =====================================================================
(function(){
const T=THREE,L=window.GPLibrary,$=id=>document.getElementById(id),cm=v=>v/100;
const Q=new URLSearchParams(location.search);
const VIEW=!!window.GP_VIEW_ONLY||Q.get('view')==='1';
if(VIEW)document.documentElement.classList.add('view-only');
$('yr').textContent=new Date().getFullYear();

// ---------- proyecto ----------
const STORE='gp-editor-project-v1';
const blank=()=>({format:'gpworx-stand',version:1,title:'Stand - Event 2027',option:'Option A',client:'',stand:{w:1200,d:800,floor:'#f3f4f6'},elements:[]});
let P=blank();
function loadLocal(){try{const s=localStorage.getItem(STORE);if(s){const o=JSON.parse(s);if(o&&o.format==='gpworx-stand')return o;}}catch(_){}return null;}
function saveLocal(){if(VIEW)return;try{localStorage.setItem(STORE,JSON.stringify(P));}catch(_){}}

// ---------- escena ----------
const canvas=$('c'),stage=$('stage');
const renderer=new T.WebGLRenderer({canvas,antialias:true,preserveDrawingBuffer:true});
renderer.setPixelRatio(Math.min(devicePixelRatio||1,2));renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;renderer.outputEncoding=T.sRGBEncoding;
const scene=new T.Scene();scene.background=new T.Color(0x2a2b2e);scene.fog=new T.Fog(0x2a2b2e,40,110);
const camera=new T.PerspectiveCamera(40,1,0.1,250);
scene.add(new T.HemisphereLight(0xffffff,0x5d626b,0.6));
const sun=new T.DirectionalLight(0xffffff,0.75);sun.position.set(-10,20,12);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);sun.shadow.bias=-0.0006;sun.shadow.normalBias=0.03;scene.add(sun);
const hall=new T.Mesh(new T.PlaneGeometry(120,120),new T.MeshStandardMaterial({color:0x5f646d,roughness:.9}));hall.rotation.x=-Math.PI/2;hall.receiveShadow=true;scene.add(hall);
let floor=null,grid=null;
function buildStand(){if(floor){scene.remove(floor);floor.geometry.dispose();}if(grid)scene.remove(grid);
  const w=cm(P.stand.w),d=cm(P.stand.d);
  floor=new T.Mesh(new T.BoxGeometry(w,0.1,d),new T.MeshStandardMaterial({color:P.stand.floor||'#f3f4f6',roughness:.5}));floor.position.y=0.05;floor.receiveShadow=true;scene.add(floor);
  const s=Math.max(w,d);grid=new T.GridHelper(s,Math.round(s),0x9aa0a8,0xc4c8ce);grid.position.y=0.102;grid.material.opacity=.45;grid.material.transparent=true;grid.visible=snap;
  grid.scale.set(w/s,1,d/s);scene.add(grid);
  sun.shadow.camera.left=-w;sun.shadow.camera.right=w;sun.shadow.camera.top=d;sun.shadow.camera.bottom=-d;sun.shadow.camera.updateProjectionMatrix();
  target.set(0,1.4,0);fitViews();}

// ---------- elementos ----------
const G=new T.Group();scene.add(G);const OBJ={};
function rebuild(e){if(OBJ[e.id]){G.remove(OBJ[e.id]);disposeObj(OBJ[e.id]);}const o=L.build(e);o.position.y=0.1;G.add(o);OBJ[e.id]=o;if(sel===e.id)highlight();}
function disposeObj(o){o.traverse(m=>{if(m.geometry)m.geometry.dispose();});}
function rebuildAll(){Object.keys(OBJ).forEach(k=>{G.remove(OBJ[k]);disposeObj(OBJ[k]);delete OBJ[k];});P.elements.forEach(rebuild);renderList();}
const byId=id=>P.elements.find(e=>e.id===id);

// ---------- cámara y gestos ----------
const target=new T.Vector3(0,1.4,0);
let VIEWS={},th=-0.6,ph=1.05,rad=20,anim=null;
function fitViews(){const r=Math.max(cm(P.stand.w),cm(P.stand.d))*1.45+4;VIEWS={main:[-0.6,1.05,r],top:[0,0.04,r],front:[0,1.36,r*0.85],side:[-Math.PI/2,1.32,r*0.85]};[th,ph,rad]=VIEWS.main;}
function setView(k){anim={from:[th,ph,rad],to:VIEWS[k],t:0};document.querySelectorAll('.views button').forEach(b=>b.classList.toggle('on',b.dataset.v===k));}
document.querySelectorAll('.views button').forEach(b=>b.onclick=()=>setView(b.dataset.v));
function resize(){const w=stage.clientWidth,h=stage.clientHeight;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();}
addEventListener('resize',resize);

const ray=new T.Raycaster(),ndc=new T.Vector2(),plane=new T.Plane(new T.Vector3(0,1,0),-0.1),hit=new T.Vector3();
function setNdc(x,y){const r=canvas.getBoundingClientRect();ndc.set((x-r.left)/r.width*2-1,-((y-r.top)/r.height)*2+1);ray.setFromCamera(ndc,camera);}
function pick(x,y){setNdc(x,y);const hs=ray.intersectObjects(G.children,true);for(const h of hs){let o=h.object;while(o&&o.parent!==G)o=o.parent;if(o&&o.userData.id)return o.userData.id;}return null;}

const ptrs=new Map();let drag=null,pinch=null,downInfo=null;
canvas.addEventListener('pointerdown',e=>{canvas.setPointerCapture(e.pointerId);ptrs.set(e.pointerId,{x:e.clientX,y:e.clientY});anim=null;
  if(ptrs.size===2){drag=null;const [a,b]=[...ptrs.values()];pinch={d:Math.hypot(a.x-b.x,a.y-b.y),mx:(a.x+b.x)/2,my:(a.y+b.y)/2,rad};return;}
  downInfo={x:e.clientX,y:e.clientY,t:Date.now(),moved:false};
  const id=VIEW?null:pick(e.clientX,e.clientY);
  if(id){select(id,false);setNdc(e.clientX,e.clientY);if(ray.ray.intersectPlane(plane,hit)){const el=byId(id);drag={kind:'item',id,dx:cm(el.x)-hit.x,dz:cm(el.z)-hit.z,moved:false};}}
  else drag={kind:'orbit',x:e.clientX,y:e.clientY};});
canvas.addEventListener('pointermove',e=>{if(!ptrs.has(e.pointerId))return;ptrs.set(e.pointerId,{x:e.clientX,y:e.clientY});
  if(downInfo&&Math.hypot(e.clientX-downInfo.x,e.clientY-downInfo.y)>6)downInfo.moved=true;
  if(pinch&&ptrs.size===2){const [a,b]=[...ptrs.values()],d=Math.hypot(a.x-b.x,a.y-b.y),mx=(a.x+b.x)/2,my=(a.y+b.y)/2;
    rad=Math.min(60,Math.max(4,pinch.rad*pinch.d/Math.max(d,1)));
    const k=rad*0.0016,fx=Math.cos(th),fz=-Math.sin(th);target.x-=(mx-pinch.mx)*k*fx;target.z-=(mx-pinch.mx)*k*fz;
    const bx=Math.sin(th),bz=Math.cos(th);target.x-=(my-pinch.my)*k*bx;target.z-=(my-pinch.my)*k*bz;pinch.mx=mx;pinch.my=my;clampTarget();return;}
  if(!drag)return;
  if(drag.kind==='orbit'){th-=(e.clientX-drag.x)*0.006;ph=Math.min(1.52,Math.max(0.04,ph-(e.clientY-drag.y)*0.005));drag.x=e.clientX;drag.y=e.clientY;}
  else if(drag.kind==='item'&&downInfo.moved){setNdc(e.clientX,e.clientY);if(ray.ray.intersectPlane(plane,hit)){const el=byId(drag.id);
    let x=(hit.x+drag.dx)*100,z=(hit.z+drag.dz)*100;if(snap){x=Math.round(x/10)*10;z=Math.round(z/10)*10;}
    const mw=P.stand.w/2+150,md=P.stand.d/2+150;el.x=Math.max(-mw,Math.min(mw,x));el.z=Math.max(-md,Math.min(md,z));
    OBJ[el.id].position.x=cm(el.x);OBJ[el.id].position.z=cm(el.z);highlight();drag.moved=true;}}});
function up(e){ptrs.delete(e.pointerId);if(ptrs.size<2)pinch=null;
  if(drag&&drag.kind==='item'){if(drag.moved){commit();renderProps();}else if(!downInfo.moved)openProps();}
  else if(drag&&drag.kind==='orbit'&&downInfo&&!downInfo.moved&&Date.now()-downInfo.t<400&&!VIEW){select(null);}
  drag=null;}
canvas.addEventListener('pointerup',up);canvas.addEventListener('pointercancel',up);
canvas.addEventListener('wheel',e=>{e.preventDefault();rad=Math.min(60,Math.max(4,rad*(1+Math.sign(e.deltaY)*0.08)));},{passive:false});
function clampTarget(){const w=cm(P.stand.w),d=cm(P.stand.d);target.x=Math.max(-w,Math.min(w,target.x));target.z=Math.max(-d,Math.min(d,target.z));}

// ---------- selección ----------
let sel=null,box=null,snap=true;
function highlight(){if(box){scene.remove(box);box=null;}if(!sel||!OBJ[sel])return;box=new T.BoxHelper(OBJ[sel],0xffb020);scene.add(box);}
function select(id,open=true){sel=id;highlight();renderList();if(!id){closeSheet('propSheet');return;}if(open)openProps();else if(!$('propSheet').hidden)renderProps();}
$('gridBtn').onclick=e=>{snap=!snap;e.currentTarget.classList.toggle('on',snap);if(grid)grid.visible=snap;};

// ---------- deshacer / rehacer ----------
const UNDO=[],REDO=[];let last=null;
function commit(){const s=JSON.stringify(P);if(s===last)return;if(last)UNDO.push(last);if(UNDO.length>60)UNDO.shift();REDO.length=0;last=s;saveLocal();updUndo();renderList();}
function restore(s){P=JSON.parse(s);last=s;buildStand();rebuildAll();if(sel&&!byId(sel))select(null);else{highlight();if(!$('propSheet').hidden)renderProps();}header();saveLocal();updUndo();}
$('undoBtn').onclick=()=>{if(!UNDO.length)return;REDO.push(last);restore(UNDO.pop());};
$('redoBtn').onclick=()=>{if(!REDO.length)return;UNDO.push(last);restore(REDO.pop());};
function updUndo(){$('undoBtn').disabled=!UNDO.length;$('redoBtn').disabled=!REDO.length;}
let commitT=null;const commitSoon=()=>{clearTimeout(commitT);commitT=setTimeout(commit,350);};

// ---------- cabecera y lista ----------
function header(){$('pTitle').textContent=P.title+(P.stand?` (Isla ${P.stand.w/100}×${P.stand.d/100} m)`:'');$('pSub').textContent=[P.client,P.option].filter(Boolean).join(' · ');$('optTag').textContent=(P.option||'').toUpperCase();$('optTag').hidden=!P.option;}
function renderList(){$('elist').innerHTML='';P.elements.forEach((e,i)=>{const li=document.createElement('li');li.className=e.id===sel?'on':'';
  const d=L.def(e.type)||{params:[]};const dims=d.params.slice(0,3).map(q=>e.p[q.k]).join('×');
  li.innerHTML='<b></b><span></span><i></i>';li.querySelector('b').textContent=i+1;li.querySelector('span').textContent=e.name;li.querySelector('i').textContent=dims;
  li.onclick=()=>{if(VIEW)return;select(e.id);};$('elist').appendChild(li);});}

// ---------- hojas ----------
function openSheet(id){['libSheet','propSheet','menuSheet'].forEach(s=>{if(s!==id)$(s).hidden=true;});$(id).hidden=false;}
function closeSheet(id){$(id).hidden=true;if(id==='propSheet'&&sel){sel=null;highlight();renderList();}}
document.querySelectorAll('.sheet [data-close]').forEach(b=>b.onclick=()=>closeSheet(b.closest('.sheet').id));
addEventListener('keydown',e=>{if(e.key==='Escape')['libSheet','propSheet','menuSheet'].forEach(s=>{if(!$(s).hidden)closeSheet(s);});
  if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='z'&&!/INPUT/.test(e.target.tagName)){e.preventDefault();(e.shiftKey?$('redoBtn'):$('undoBtn')).click();}
  if((e.key==='Delete'||e.key==='Backspace')&&sel&&!/INPUT/.test(e.target.tagName)){removeSel();}});

// biblioteca
function renderLib(){const cats={};L.LIBRARY.forEach(d=>(cats[d.cat]=cats[d.cat]||[]).push(d));$('libList').innerHTML='';
  Object.keys(cats).forEach(c=>{const h=document.createElement('div');h.className='cat';h.textContent=c;$('libList').appendChild(h);
    const box=document.createElement('div');box.className='cards';cats[c].forEach(d=>{const b=document.createElement('button');b.innerHTML='<b></b><span></span>';b.querySelector('b').textContent=d.icon||'□';b.querySelector('span').textContent=d.name;
      b.onclick=()=>{const e=L.create(d.type,{x:Math.round(target.x*10)*10,z:Math.round(target.z*10)*10});P.elements.push(e);rebuild(e);commit();closeSheet('libSheet');select(e.id);};box.appendChild(b);});
    $('libList').appendChild(box);});}
$('addBtn').onclick=()=>{renderLib();openSheet('libSheet');};

// propiedades
function numRow(label,val,unit,min,max,step,on){const r=document.createElement('div');r.className='row';r.innerHTML='<label></label><div class="num"><button type="button">−</button><input type="number" inputmode="decimal"><button type="button">+</button><small></small></div>';
  r.querySelector('label').textContent=label;r.querySelector('small').textContent=unit;const inp=r.querySelector('input');inp.value=val;inp.min=min;inp.max=max;inp.step=step;
  const set=v=>{v=Math.max(min,Math.min(max,Math.round(v/step)*step));inp.value=v;on(v);};
  const [m,p]=r.querySelectorAll('button');m.onclick=()=>set(+inp.value-step);p.onclick=()=>set(+inp.value+step);inp.onchange=()=>set(+inp.value||0);return r;}
function openProps(){if(!sel)return;renderProps();openSheet('propSheet');focusOn(byId(sel));}
// centra la cámara en el elemento (en móvil la hoja tapa la parte de abajo del visor)
let focusAnim=null;function focusOn(e){if(!e)return;focusAnim={from:target.clone(),to:new T.Vector3(cm(e.x),innerWidth<1000?0.4:1.4,cm(e.z)),t:0};}
function renderProps(){const e=byId(sel);if(!e)return;const d=L.def(e.type),b=$('propBody');$('propTitle').textContent=e.name.toUpperCase();b.innerHTML='';
  const nm=document.createElement('div');nm.className='row';nm.innerHTML='<label>Nombre</label><input type="text">';const ni=nm.querySelector('input');ni.value=e.name;ni.oninput=()=>{e.name=ni.value;$('propTitle').textContent=e.name.toUpperCase();renderList();commitSoon();};b.appendChild(nm);
  d.params.forEach(q=>b.appendChild(numRow(q.label,e.p[q.k],q.unit||'cm',q.min,q.max,q.step,v=>{e.p[q.k]=v;rebuild(e);commitSoon();})));
  b.appendChild(numRow('Posición X',Math.round(e.x),'cm',-5000,5000,10,v=>{e.x=v;rebuild(e);commitSoon();}));
  b.appendChild(numRow('Posición Y',Math.round(e.z),'cm',-5000,5000,10,v=>{e.z=v;rebuild(e);commitSoon();}));
  b.appendChild(numRow('Giro',((e.rot||0)%360+360)%360,'°',0,359,15,v=>{e.rot=v;rebuild(e);commitSoon();}));
  (d.colors||[]).forEach(q=>{const r=document.createElement('div');r.className='row';r.innerHTML='<label></label><input type="color">';r.querySelector('label').textContent=q.label;const c=r.querySelector('input');c.value=e.c[q.k];c.oninput=()=>{e.c[q.k]=c.value;rebuild(e);commitSoon();};b.appendChild(r);});
  if(d.graphic){const r=document.createElement('div');r.className='row';r.innerHTML='<label>Texto / marca</label><input type="text" placeholder="p. ej. SONY">';const t=r.querySelector('input');t.value=e.text||'';t.oninput=()=>{e.text=t.value;rebuild(e);commitSoon();};b.appendChild(r);
    const r2=document.createElement('div');r2.className='row';r2.innerHTML='<label>Imagen / logo</label><div class="acts" style="margin:0"><button type="button">Subir</button><button type="button">Quitar</button></div><input type="file" accept="image/*" hidden>';
    const [up,rm]=r2.querySelectorAll('button'),fi=r2.querySelector('input');rm.disabled=!e.img;up.onclick=()=>fi.click();rm.onclick=()=>{delete e.img;rebuild(e);commit();renderProps();};
    fi.onchange=()=>{const f=fi.files[0];if(!f)return;const rd=new FileReader();rd.onload=()=>{const im=new Image();im.onload=()=>{const s=Math.min(1,1600/Math.max(im.width,im.height)),c=document.createElement('canvas');c.width=Math.round(im.width*s);c.height=Math.round(im.height*s);c.getContext('2d').drawImage(im,0,0,c.width,c.height);
      e.img=c.toDataURL(f.type==='image/png'?'image/png':'image/jpeg',0.85);rebuild(e);commit();renderProps();};im.src=rd.result;};rd.readAsDataURL(f);};b.appendChild(r2);}
  const a=document.createElement('div');a.className='acts';a.innerHTML='<button type="button">⟲ 15°</button><button type="button">⟳ 15°</button><button type="button">⟳ 90°</button><button type="button">＋ Duplicar</button><button type="button" class="del">Eliminar</button>';
  const [r1,r2b,r3,dup,del]=a.querySelectorAll('button');
  const rot=dv=>{e.rot=(((e.rot||0)+dv)%360+360)%360;rebuild(e);commit();renderProps();};r1.onclick=()=>rot(-15);r2b.onclick=()=>rot(15);r3.onclick=()=>rot(90);
  dup.onclick=()=>{const n=JSON.parse(JSON.stringify(e));n.id='e'+Math.random().toString(36).slice(2,9);n.x+=50;n.z+=50;P.elements.push(n);rebuild(n);commit();select(n.id);};
  del.onclick=removeSel;b.appendChild(a);}
function removeSel(){if(!sel)return;const i=P.elements.findIndex(e=>e.id===sel);if(i<0)return;G.remove(OBJ[sel]);disposeObj(OBJ[sel]);delete OBJ[sel];P.elements.splice(i,1);select(null);commit();}

// menú del proyecto
function renderMenu(){const f=$('standForm');f.innerHTML='';
  [['Título','title'],['Cliente','client'],['Opción','option']].forEach(([l,k])=>{const r=document.createElement('div');r.className='row';r.innerHTML='<label></label><input type="text">';r.querySelector('label').textContent=l;const i=r.querySelector('input');i.value=P[k]||'';i.oninput=()=>{P[k]=i.value;header();commitSoon();};f.appendChild(r);});
  f.appendChild(numRow('Ancho del stand',P.stand.w,'cm',200,4000,50,v=>{P.stand.w=v;buildStand();header();commitSoon();}));
  f.appendChild(numRow('Fondo del stand',P.stand.d,'cm',200,4000,50,v=>{P.stand.d=v;buildStand();header();commitSoon();}));
  const r=document.createElement('div');r.className='row';r.innerHTML='<label>Color del suelo</label><input type="color">';const c=r.querySelector('input');c.value=P.stand.floor||'#f3f4f6';c.oninput=()=>{P.stand.floor=c.value;buildStand();commitSoon();};f.appendChild(r);}
$('menuBtn').onclick=()=>{renderMenu();openSheet('menuSheet');};
function loadProject(o){if(!o||o.format!=='gpworx-stand')throw new Error('Archivo no válido');P=o;last=null;UNDO.length=0;REDO.length=0;select(null);buildStand();rebuildAll();header();commit();setView('main');}
$('mNew').onclick=()=>{if(!confirmTap($('mNew')))return;loadProject(blank());closeSheet('menuSheet');};
$('mExample').onclick=()=>fetch('projects/option-a.json?v=1').then(r=>r.json()).then(o=>{loadProject(o);closeSheet('menuSheet');});
$('mOpen').onclick=()=>$('fileIn').click();
$('fileIn').onchange=()=>{const f=$('fileIn').files[0];if(!f)return;f.text().then(t=>{try{loadProject(JSON.parse(t));closeSheet('menuSheet');}catch(err){alertIn('menuSheet','No se pudo abrir: '+err.message);}});$('fileIn').value='';};
$('mSave').onclick=()=>{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(P,null,1)],{type:'application/json'}));a.download=(P.title||'proyecto').replace(/[^\w\- ]+/g,'').trim().replace(/\s+/g,'-')+'.json';document.body.appendChild(a);a.click();a.remove();};
function confirmTap(b){if(b.dataset.ok){delete b.dataset.ok;b.textContent=b.dataset.t;return true;}b.dataset.t=b.textContent;b.dataset.ok=1;b.textContent='¿Seguro? Toca otra vez';setTimeout(()=>{if(b.dataset.ok){delete b.dataset.ok;b.textContent=b.dataset.t;}},3000);return false;}
function alertIn(s,msg){const p=document.createElement('p');p.className='muted';p.style.color='#ff9b91';p.textContent=msg;$(s).appendChild(p);setTimeout(()=>p.remove(),5000);}

// ---------- captura + envío ----------
const shotBtn=$('shotBtn'),CD=window.GPCooldown;if(CD)CD.bind(shotBtn);let sending=false;
function capture(){const hb=box&&box.visible;if(box)box.visible=false;renderer.render(scene,camera);const W=canvas.width,H=canvas.height,sc=W/stage.clientWidth,foot=Math.round(56*sc);
  const c=document.createElement('canvas');c.width=W;c.height=H+foot;const g=c.getContext('2d');g.drawImage(canvas,0,0);if(box)box.visible=hb;
  g.fillStyle='#5d729e';g.fillRect(0,H,W,foot);g.fillStyle='#fff';g.textBaseline='middle';g.font=`bold ${16*sc}px Helvetica,Arial`;g.fillText([P.title,P.client,P.option].filter(Boolean).join(' · '),16*sc,H+foot/2);
  g.textAlign='right';g.font=`${13*sc}px Helvetica,Arial`;g.fillText('© GPworx · '+new Date().toLocaleString('es-ES',{dateStyle:'short',timeStyle:'short'}),W-16*sc,H+foot/2);
  return new Promise(r=>c.toBlob(r,'image/png'));}
shotBtn.onclick=async()=>{if(sending||(CD&&CD.active()))return;sending=true;if(CD)CD.busy(true);
  try{const blob=await capture();$('shotImg').src=URL.createObjectURL(blob);$('shotBox').hidden=false;$('shotMsg').textContent='Enviando captura a gregor@gpworx.com…';
    const body=[P.title,P.client,P.option,`Stand ${P.stand.w/100}×${P.stand.d/100} m`].filter(Boolean).join(' · ')+'\n\n'+P.elements.map((e,i)=>`${i+1}. ${e.name}: X ${e.x} cm, Y ${e.z} cm, giro ${e.rot||0}° · `+Object.entries(e.p).map(([k,v])=>k+' '+v).join(', ')).join('\n');
    const fd=new FormData();fd.append('subject',[P.title,P.option,'configuración'].filter(Boolean).join(' · '));fd.append('body',body);fd.append('image',blob,'stand.png');
    const r=await fetch(window.GP_SEND_ENDPOINT||'../send.php',{method:'POST',body:fd});const j=await r.json().catch(()=>({}));
    if(r.status===429){if(j.wait&&CD)CD.start(j.wait*1000);$('shotMsg').textContent='Ya se envió una captura hace poco. Podrás enviar otra cuando termine la espera.';return;}
    if(!r.ok||!j.ok)throw new Error(j.error||('HTTP '+r.status));$('shotMsg').textContent='✓ Captura enviada a gregor@gpworx.com.';if(CD)CD.start();
  }catch(err){$('shotMsg').textContent='No se pudo enviar la captura ('+(err.message||err)+'). Inténtalo de nuevo.';}
  finally{sending=false;if(CD)CD.busy(false);}};
$('shotX').onclick=()=>{$('shotBox').hidden=true;};

// ---------- protección ----------
document.addEventListener('contextmenu',e=>{if(!/INPUT/.test(e.target.tagName))e.preventDefault();});
document.addEventListener('dragstart',e=>e.preventDefault());
(function(){const im=new Image();im.onload=()=>{const w=200,h=Math.round(w*im.height/im.width),cw=360,ch=h+150,c=document.createElement('canvas');c.width=cw*2;c.height=ch*2;const g=c.getContext('2d');g.scale(2,2);g.shadowColor='rgba(0,0,0,.55)';g.shadowBlur=3;g.drawImage(im,(cw-w)/2,(ch-h)/2,w,h);
  $('wmTile').style.backgroundImage='url("'+c.toDataURL()+'")';$('wmTile').style.backgroundSize=cw+'px '+ch+'px';};im.src='../logo-gpworx.svg';})();

// ---------- arranque ----------
let dirty=true;window.GPEditor={redraw:()=>{dirty=true;}};
const v=new T.Vector3();
(function loop(){requestAnimationFrame(loop);
  if(anim){anim.t=Math.min(1,anim.t+0.05);const k=anim.t<.5?2*anim.t*anim.t:1-Math.pow(-2*anim.t+2,2)/2;[th,ph,rad]=anim.from.map((a,i)=>a+(anim.to[i]-a)*k);if(anim.t>=1)anim=null;}
  if(focusAnim){focusAnim.t=Math.min(1,focusAnim.t+0.06);target.lerpVectors(focusAnim.from,focusAnim.to,focusAnim.t);if(focusAnim.t>=1)focusAnim=null;}
  camera.position.set(target.x+rad*Math.sin(ph)*Math.sin(th),target.y+rad*Math.cos(ph),target.z+rad*Math.sin(ph)*Math.cos(th));camera.lookAt(target);
  if(box)box.update();renderer.render(scene,camera);})();
async function start(){
  const src=Q.get('p');let o=null;
  if(src){try{o=await (await fetch(src)).json();}catch(_){}}
  if(!o&&!VIEW)o=loadLocal();
  if(!o){try{o=await (await fetch('projects/option-a.json?v=1')).json();}catch(_){o=blank();}}
  P=o;buildStand();rebuildAll();header();resize();last=JSON.stringify(P);updUndo();
  if(VIEW)$('hint').textContent='Arrastra para girar · pellizca para zoom';}
start();
})();
