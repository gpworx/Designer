// =====================================================================
// GPworx · espera de 3 minutos entre capturas (botón "Enviar captura")
// Compartido por todos los simuladores. Tras un envío correcto el botón
// queda bloqueado con un indicador de carga y una barra que se llena en 3 min.
// El servidor (send.php) aplica el mismo límite por si se salta desde el navegador.
// =====================================================================
(function(){
  const KEY='gp-shot-until', MS=180000;
  let btn=null, orig='', timer=null, total=MS;
  const until=()=>{try{return +localStorage.getItem(KEY)||0;}catch(_){return window.__gpShotUntil||0;}};
  const set=t=>{window.__gpShotUntil=t;try{localStorage.setItem(KEY,String(t));}catch(_){}};
  const mmss=s=>Math.floor(s/60)+':'+String(s%60).padStart(2,'0');
  function paint(label,p){btn.classList.add('cooling');btn.disabled=true;
    btn.innerHTML='<span class="spin" aria-hidden="true"></span><span class="lbl"></span>';btn.querySelector('.lbl').textContent=label;
    btn.style.setProperty('--p',p==null?'0%':p.toFixed(1)+'%');}
  function reset(){clearInterval(timer);timer=null;btn.classList.remove('cooling');btn.disabled=false;btn.innerHTML=orig;btn.style.removeProperty('--p');}
  function tick(){const left=until()-Date.now();if(left<=0){reset();return;}
    paint('Enviada · nueva captura en '+mmss(Math.ceil(left/1000)),100*(1-left/total));}
  window.GPCooldown={
    MS,
    active:()=>until()>Date.now(),
    busy(on){if(!btn)return;if(on)paint('Enviando captura…',null);else if(!this.active())reset();},
    start(ms){total=ms||MS;set(Date.now()+total);if(!btn)return;if(!timer)timer=setInterval(tick,1000);tick();},
    bind(b){btn=b;orig=b.innerHTML;const left=until()-Date.now();if(left>0){total=Math.max(left,MS);timer=setInterval(tick,1000);tick();}}
  };
})();
