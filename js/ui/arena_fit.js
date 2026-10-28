// Enquadra as cartas usando somente as medidas da interface. Não consulta a partida.
(function(G){
'use strict';
let active=null;
const finite=(value,fallback)=>{
 try{const number=Number(value);return Number.isFinite(number)?number:fallback;}catch{return fallback;}
};
const tenth=value=>Math.floor(value*10)/10;

function computeSizing(options={}){
 options=options&&typeof options==='object'?options:{};
 const width=Math.max(0,finite(options.sideWidth,0)),height=Math.max(0,finite(options.sideHeight,0));
 const cap=Math.max(1,Math.floor(finite(options.frontCap,3))||3),gap=options.portrait?4:6;
 const heightLimit=(height-80)/1.67;
 const widthLimit=(width-24-(cap-1)*gap)/(cap+(options.hasRear?1.2:0));
 // Não impõe um mínimo que pudesse empurrar unidades para fora de uma janela pequena.
 const frontSize=Math.max(1,tenth(Math.min(156,heightLimit,widthLimit)));
 return{frontSize,rearSize:Math.max(1,tenth(frontSize*.6))};
}

function detach(){active?.cleanup();}
function mount(arena){
 detach();
 if(!arena?.querySelectorAll||!arena.style?.setProperty||arena.isConnected===false||typeof document==='undefined')return()=>{};
 const s={arena,dead:false,queued:0,timer:false,resizeObserver:null,mutationObserver:null,listeners:[],frontSize:0,rearSize:0,measurements:0,writes:0};
 function measure(){
  if(s.dead)return;
  if(arena.isConnected===false){cleanup();return;}
  const sides=Array.from(arena.querySelectorAll('.side')).map(side=>side.getBoundingClientRect?.()).filter(box=>box&&box.width>0&&box.height>0);
  if(!sides.length)return;
  const viewportWidth=finite(globalThis.innerWidth,0)||arena.getBoundingClientRect?.()?.width||0;
  const size=computeSizing({
   sideWidth:Math.min(...sides.map(box=>box.width)),sideHeight:Math.min(...sides.map(box=>box.height)),
   frontCap:arena.dataset?.frontcap,hasRear:!!arena.querySelector?.('.rear .cell'),portrait:viewportWidth<=760
  });
  s.measurements++;
  if(Math.abs(s.frontSize-size.frontSize)<.05&&Math.abs(s.rearSize-size.rearSize)<.05)return;
  s.frontSize=size.frontSize;s.rearSize=size.rearSize;s.writes++;
  arena.style.setProperty('--fit-front-size',size.frontSize+'px');
  arena.style.setProperty('--fit-rear-size',size.rearSize+'px');
 }
 function cancelQueued(){
  if(!s.queued)return;
  if(s.timer)globalThis.clearTimeout?.(s.queued);else globalThis.cancelAnimationFrame?.(s.queued);
  s.queued=0;
 }
 function schedule(){
  if(s.dead||s.queued)return;
  const run=()=>{s.queued=0;measure();};
  if(typeof globalThis.requestAnimationFrame==='function'){s.timer=false;s.queued=globalThis.requestAnimationFrame(run);}
  else if(typeof globalThis.setTimeout==='function'){s.timer=true;s.queued=globalThis.setTimeout(run,16);}
  else measure();
 }
 function listen(target,type,fn){
  if(!target?.addEventListener)return;
  target.addEventListener(type,fn,{passive:true});s.listeners.push(()=>target.removeEventListener(type,fn));
 }
 function cleanup(){
  if(s.dead)return;s.dead=true;cancelQueued();
  s.resizeObserver?.disconnect();s.mutationObserver?.disconnect();s.resizeObserver=s.mutationObserver=null;
  for(const remove of s.listeners.splice(0))remove();
  if(active===s)active=null;
 }
 s.cleanup=cleanup;s.schedule=schedule;active=s;
 measure();
 if(typeof globalThis.ResizeObserver==='function'){
  s.resizeObserver=new globalThis.ResizeObserver(schedule);
  const targets=new Set([arena,...arena.querySelectorAll('.side,.turn-panel,.turn-guide,.arena-header,.mao')]);
  for(const target of targets)s.resizeObserver.observe(target);
 }
 listen(globalThis,'resize',schedule);listen(globalThis.visualViewport,'resize',schedule);
 if(typeof globalThis.MutationObserver==='function'&&document.body){
  s.mutationObserver=new globalThis.MutationObserver(()=>{if(arena.isConnected===false)cleanup();});
  s.mutationObserver.observe(document.body,{childList:true,subtree:true});
 }
 try{document.fonts?.ready?.then(()=>{if(!s.dead)schedule();}).catch(()=>{});}catch{}
 return cleanup;
}
function refresh(){active?.schedule();}
function getDebugState(){
 return{active:!!active,queued:!!active?.queued,observers:Number(!!active?.resizeObserver)+Number(!!active?.mutationObserver),listeners:active?.listeners.length||0,frontSize:active?.frontSize||0,rearSize:active?.rearSize||0,measurements:active?.measurements||0,writes:active?.writes||0};
}
G.ArenaFit=Object.freeze({computeSizing,mount,detach,refresh,getDebugState});
})(globalThis.GOGHOS=globalThis.GOGHOS||{});
