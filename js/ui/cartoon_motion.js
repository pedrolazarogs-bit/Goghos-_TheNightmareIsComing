// Ambiência do menu. A API só desenha decoração; nunca consulta ou altera a partida.
// attach(host,{intro}) exige um host já inserido no documento e devolve sua limpeza.
// Só há uma cena ativa. detach(), remoção do host e preferências encerram o movimento.
(function(G){
'use strict';
let active=null,serial=0;
const COLORS=['#ff6adc','#83dcff','#ffe994','#9df2d1','#ece2ff'];
const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
function random(seed){return()=>{seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
function hidden(){return typeof document==='undefined'||document.hidden===true;}
function reduced(media){
 let p={};try{p=G.PresentationFX?.getPreferences()||{};}catch{}
 if(p.motion==='full')return false;
 if(p.motion==='reduced')return true;
 return typeof p.reducedMotion==='boolean'?p.reducedMotion:!!media?.matches;
}
function detach(){active?.cleanup();}
function attach(host,options={}){
 detach();
 if(!host?.appendChild||typeof document==='undefined'||!document.createElement||host.isConnected===false)return()=>{};
 const s={id:++serial,host,scene:null,canvas:null,ctx:null,raf:0,last:0,start:0,width:0,height:0,ratio:1,tx:0,ty:0,cx:0,cy:0,lastPointer:-Infinity,reduced:false,dead:false,media:null,observer:null,layers:[],stars:[],bursts:[],soft:new Set(),listeners:[]};
 const rnd=random(20261024),range=(a,b)=>a+(b-a)*rnd();
 const scene=document.createElement('div');scene.className='ct-motion-scene'+(options.intro?' ct-motion-intro':'');scene.setAttribute('aria-hidden','true');
 scene.innerHTML='<div class="ct-motion-wash"></div><div class="ct-motion-depth ct-motion-rays-depth" data-toon-depth="5"><div class="ct-motion-rays"></div></div><div class="ct-motion-halftone"></div><div class="ct-motion-depth ct-motion-far" data-toon-depth="9"></div><div class="ct-motion-depth ct-motion-mid" data-toon-depth="18"></div><canvas class="ct-motion-canvas"></canvas><div class="ct-motion-depth ct-motion-near" data-toon-depth="29"></div><div class="ct-motion-shade"></div>';
 host.appendChild(scene);host.setAttribute('aria-hidden','true');s.scene=scene;s.canvas=scene.querySelector('.ct-motion-canvas');
 try{s.ctx=s.canvas?.getContext('2d',{alpha:true})||null;}catch{}
 const palettes={far:[['#2e0a5d','#441575'],['#35125f','#55277c']],mid:[['#cb3bbe','#8b24a6'],['#7c45d8','#572995'],['#3ea2ce','#3b579b']],near:[['#ffe180','#c18a4a'],['#80f1d0','#3aaf9a'],['#e650cc','#a836aa'],['#75d8ff','#3e8fc7']]};
 for(const [name,count,min,max] of [['far',8,17,31],['mid',7,8,16],['near',6,3,7]]){
  const layer=scene.querySelector('.ct-motion-'+name);if(!layer)continue;
  for(let i=0;i<count;i++){
   const node=document.createElement('i'),palette=palettes[name][Math.floor(rnd()*palettes[name].length)],left=name==='far'?range(-12,100):(i%2?range(86,103):range(-7,8));
   node.className='ct-motion-shard';
   node.style.cssText='--shard-x:'+left.toFixed(1)+'%;--shard-y:'+range(-8,98).toFixed(1)+'%;--shard-size:'+range(min,max).toFixed(1)+'vmin;--shard-a:'+palette[0]+';--shard-b:'+palette[1]+';--shard-angle:'+range(-160,160).toFixed(1)+'deg;--shard-time:'+range(5,9).toFixed(1)+'s;--shard-delay:-'+range(0,8).toFixed(1)+'s;--shard-opacity:'+(name==='far'?.29:name==='mid'?.48:.8)+';--shard-shape:'+(i%3?'22% 0,100% 25%,75% 100%,0 70%':'50% 0,100% 100%,0 72%');
   layer.appendChild(node);
  }
 }
 s.layers=Array.from(scene.querySelectorAll('[data-toon-depth]')).map(el=>({el,depth:Number(el.dataset.toonDepth)||0}));
 function listen(target,event,fn,opts){if(!target?.addEventListener)return;target.addEventListener(event,fn,opts);s.listeners.push(()=>target.removeEventListener(event,fn,opts));}
 function clearSoft(){for(const job of s.soft){try{job.animation?.cancel();}catch{}job.node.remove();}s.soft.clear();}
 function stopFrame(){if(s.raf&&typeof cancelAnimationFrame==='function')cancelAnimationFrame(s.raf);s.raf=0;s.last=0;}
 function resetParallax(){s.tx=s.ty=s.cx=s.cy=0;for(const layer of s.layers)layer.el.style.transform='';}
 function resize(){
  if(s.dead)return;const box=host.getBoundingClientRect();s.width=Math.max(1,box.width||globalThis.innerWidth||1);s.height=Math.max(1,box.height||globalThis.innerHeight||1);s.ratio=Math.min(1.5,globalThis.devicePixelRatio||1);
  if(s.canvas){s.canvas.width=Math.round(s.width*s.ratio);s.canvas.height=Math.round(s.height*s.ratio);s.ctx?.setTransform(s.ratio,0,0,s.ratio,0,0);}
  const count=Math.round(clamp(s.width*s.height/32000,17,36));
  while(s.stars.length<count)s.stars.push({x:rnd(),y:rnd(),size:range(1.5,3.6),speed:range(3,10),phase:range(0,Math.PI*2),color:COLORS[Math.floor(rnd()*COLORS.length)],shape:rnd()>.4?'star':'diamond'});
  s.stars.length=count;draw(0,0);
 }
 function shape(x,y,size,kind,angle,color,opacity){
  const c=s.ctx;if(!c)return;c.save();c.translate(x,y);c.rotate(angle);c.globalAlpha=opacity;c.fillStyle=color;c.beginPath();
  if(kind==='star'){for(let i=0;i<8;i++){const a=i*Math.PI/4-Math.PI/2,r=i%2?size*.24:size;c[i?'lineTo':'moveTo'](Math.cos(a)*r,Math.sin(a)*r);}}
  else{c.moveTo(0,-size);c.lineTo(size*.6,0);c.lineTo(0,size);c.lineTo(-size*.6,0);}
  c.closePath();c.fill();c.restore();
 }
 function draw(t,dt){
  if(!s.ctx)return;s.ctx.clearRect(0,0,s.width,s.height);
  for(const star of s.stars){
   if(dt){star.y-=star.speed*dt/s.height;if(star.y<-.03)star.y=1.03;}
   shape(star.x*s.width,star.y*s.height,star.size,star.shape,star.phase*.25,star.color,s.reduced?.33:.23+.19*(.5+.5*Math.sin(t*.0008+star.phase)));
  }
  for(let i=s.bursts.length-1;i>=0;i--){
   const b=s.bursts[i];b.life-=dt;if(b.life<=0){s.bursts.splice(i,1);continue;}
   b.x+=b.vx*dt;b.y+=b.vy*dt;b.vx*=Math.pow(.04,dt);b.vy*=Math.pow(.04,dt);b.angle+=dt*b.spin;
   shape(b.x,b.y,b.size,b.shape,b.angle,b.color,clamp(b.life/b.max,0,1));
  }
 }
 function frame(t){
  s.raf=0;if(s.dead)return;if(host.isConnected===false){cleanup();return;}if(hidden()||s.reduced)return;
  const dt=Math.min(.04,s.last?(t-s.last)/1000:0);s.last=t;if(!s.start)s.start=t;
  const idle=t-s.lastPointer>2800,ax=idle?Math.sin((t-s.start)/5000)*.28:s.tx,ay=idle?Math.cos((t-s.start)/6300)*.2:s.ty;
  s.cx+=(ax-s.cx)*.045;s.cy+=(ay-s.cy)*.045;
  for(const layer of s.layers)layer.el.style.transform='translate3d('+(-s.cx*layer.depth).toFixed(2)+'px,'+(-s.cy*layer.depth).toFixed(2)+'px,0)';
  draw(t,dt);if(typeof requestAnimationFrame==='function')s.raf=requestAnimationFrame(frame);
 }
 function sync(){
  if(s.dead)return;if(host.isConnected===false){cleanup();return;}
  s.reduced=reduced(s.media);stopFrame();s.bursts.length=0;clearSoft();
  host.dataset.toonMotion=s.reduced?'reduced':hidden()?'paused':'running';
  if(s.reduced){resetParallax();draw(0,0);}else if(!hidden()&&typeof requestAnimationFrame==='function')s.raf=requestAnimationFrame(frame);
 }
 function onPointer(e){if(s.dead||s.reduced||hidden()||e.pointerType==='touch')return;const box=host.getBoundingClientRect();s.tx=clamp(((e.clientX-box.left)/Math.max(1,box.width)-.5)*2,-1,1);s.ty=clamp(((e.clientY-box.top)/Math.max(1,box.height)-.5)*2,-1,1);s.lastPointer=globalThis.performance?.now?.()||0;}
 function cleanup(){
  if(s.dead)return;s.dead=true;stopFrame();s.observer?.disconnect();s.observer=null;for(const fn of s.listeners.splice(0))fn();clearSoft();s.bursts.length=0;s.stars.length=0;s.layers.length=0;scene.remove();delete host.dataset.toonMotion;if(active===s)active=null;
 }
 s.cleanup=cleanup;s.sync=sync;s.draw=draw;s.range=range;s.rnd=rnd;
 try{s.media=globalThis.matchMedia?.('(prefers-reduced-motion: reduce)')||null;}catch{}
 listen(globalThis,'pointermove',onPointer,{passive:true});listen(globalThis,'resize',resize,{passive:true});listen(globalThis,'goghos:presentation-preferences',sync);listen(document,'visibilitychange',sync);
 if(s.media?.addEventListener)listen(s.media,'change',sync);else if(s.media?.addListener){s.media.addListener(sync);s.listeners.push(()=>s.media.removeListener(sync));}
 if(typeof MutationObserver==='function'&&document.body){s.observer=new MutationObserver(()=>{if(host.isConnected===false)cleanup();});s.observer.observe(document.body,{childList:true,subtree:true});}
 active=s;resize();sync();return cleanup;
}
function burst(element){
 const s=active;if(!s||s.dead||hidden()||s.host.isConnected===false||!element?.getBoundingClientRect)return false;
 const box=element.getBoundingClientRect(),area=s.host.getBoundingClientRect();if(box.width<=0||box.height<=0||box.right<area.left||box.left>area.right||box.bottom<area.top||box.top>area.bottom)return false;
 const x=clamp(box.left+box.width*.5-area.left,0,s.width),y=clamp(box.top+box.height*.5-area.top,0,s.height);
 if(s.reduced){
  const node=document.createElement('span');node.className='ct-motion-soft-burst';node.style.cssText='left:'+x+'px;top:'+y+'px';s.scene.appendChild(node);
  if(typeof node.animate!=='function'){node.remove();return true;}
  const job={node,animation:null};job.animation=node.animate([{opacity:.35},{opacity:0}],{duration:160,easing:'ease-out'});s.soft.add(job);job.animation.onfinish=()=>{node.remove();s.soft.delete(job);};return true;
 }
 const count=10;for(let i=0;i<count;i++){const angle=i/count*Math.PI*2+s.range(-.15,.15),speed=s.range(75,190),life=s.range(.35,.65);s.bursts.push({x,y,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,life,max:life,size:s.range(2.5,6),shape:i%2?'diamond':'star',angle,spin:s.range(-2,2),color:COLORS[i%COLORS.length]});}
 if(s.bursts.length>40)s.bursts.splice(0,s.bursts.length-40);return true;
}
function refresh(){active?.sync();}
function getDebugState(){return{active:!!active,raf:!!active?.raf,reducedMotion:!!active?.reduced,hidden:hidden(),particles:active?.stars.length||0,bursts:active?.bursts.length||0,listeners:active?.listeners.length||0,observer:!!active?.observer};}
G.CartoonMotion=Object.freeze({attach,detach,burst,refresh,getDebugState});
})(globalThis.GOGHOS=globalThis.GOGHOS||{});
