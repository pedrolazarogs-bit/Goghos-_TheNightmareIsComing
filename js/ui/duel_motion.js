// A mesma linguagem da abertura: antecipação, impacto curto e assentamento.
// Apenas apresentação de controles existentes; não lê cartas, regras ou a partida.
(function(G){
'use strict';

let active=null,lastPick=null;
const clock=()=>globalThis.performance?.now?.()??Date.now();
const hidden=()=>typeof document==='undefined'||document.hidden===true;
const clickable='button,[role="button"]';

function reduced(media){
 let prefs={};try{prefs=G.PresentationFX?.getPreferences?.()||{};}catch{}
 if(prefs.motion==='full')return false;
 if(prefs.motion==='reduced')return true;
 return typeof prefs.reducedMotion==='boolean'?prefs.reducedMotion:!!media?.matches;
}

function detach(){active?.cleanup();}

function mount(host,options={}){
 detach();
 if(!host?.querySelectorAll||!host?.addEventListener||host.isConnected===false||typeof document==='undefined')return()=>{};
 const s={host,mode:options.mode||'',dead:false,reduced:false,media:null,jobs:new Set(),listeners:[],pressed:null};
 const listen=(target,type,fn,config)=>{
  if(!target?.addEventListener)return;
  target.addEventListener(type,fn,config);
  s.listeners.push(()=>target.removeEventListener(type,fn,config));
 };

 function cancel(job){
  if(!job||!s.jobs.has(job))return;
  s.jobs.delete(job);try{job.animation.cancel();}catch{}
  job.remove?.();
 }
 function stop(){
  s.pressed=null;
  for(const job of [...s.jobs])cancel(job);
 }
 function animate(element,frames,settings={},remove=null){
  if(s.dead||s.reduced||hidden()||element?.isConnected===false||typeof element?.animate!=='function'){remove?.();return null;}
  if(s.jobs.size>=24)cancel(s.jobs.values().next().value);
  let animation;try{animation=element.animate(frames,{duration:240,easing:'cubic-bezier(.18,.8,.22,1)',fill:'none',...settings});}catch{remove?.();return null;}
  const job={animation,remove};s.jobs.add(job);
  const done=()=>{if(!s.jobs.delete(job))return;remove?.();};
  // Observe both outcomes: cancelling a Web Animation rejects its finished promise.
  // A held press keeps its filled effect registered until release. Otherwise a
  // long press could leave an untracked, permanently compressed icon behind.
  const finished=()=>{if(settings.fill!=='forwards')done();};
  if(animation.finished?.then)animation.finished.then(finished,done);
  else animation.onfinish=finished;
  return job;
 }
 function targetOf(event){return event.target?.closest?event.target:event.target?.parentElement;}
 function controlOf(event){
  const element=targetOf(event)?.closest?.(clickable);
  return element&&host.contains?.(element)!==false&&!element.disabled&&element.getAttribute?.('aria-disabled')!=='true'?element:null;
 }
 function press(event){
  if(event.type==='keydown'&&!['Enter',' '].includes(event.key)||event.repeat||s.reduced||hidden())return;
  const element=controlOf(event);if(!element)return;
  if(s.pressed)cancel(s.pressed.job);
  // Individual scale composes with the card's rotation and the button's hover
  // translation. Battle cards themselves remain owned by PresentationFX.
  const icon=(element.closest?.('.cosmos-menu')?element.querySelector?.('img')||element.querySelector?.('strong'):null)||element.querySelector?.('.realm-icon,.toon-icon,.ui-icon')||element;
  if(element.matches?.('.cell')||element.matches?.('.cosmos-favorite-hit'))return;
  const job=animate(icon,[{scale:'1'},{scale:'.92 .88'}],{duration:90,easing:'ease-out',fill:'forwards'});
  if(job)s.pressed={element:icon,job};
 }
 function release(event){
  if(event?.type==='keyup'&&!['Enter',' '].includes(event.key))return;
  const pressed=s.pressed;if(!pressed)return;s.pressed=null;cancel(pressed.job);
  animate(pressed.element,[{scale:'.92 .88'},{scale:'1.045 1.025',offset:.58},{scale:'1'}],{duration:220});
 }
 function rememberPick(event){
  const target=targetOf(event),cell=target?.closest?.('.cell[data-unit]');
  // The existing rarity effects already cover the draft and card previews.
  // Only a deliberate battlefield target receives this tiny selection glint.
  if(s.mode==='battle'&&cell&&!target.closest?.('[data-act]'))lastPick={host,uid:cell.dataset.unit,at:clock()};
  else lastPick=null;
 }
 function selectionGlint(){
  const pick=lastPick;lastPick=null;
  if(!pick||pick.host!==host||clock()-pick.at>400||s.reduced||hidden())return;
  const cell=Array.from(host.querySelectorAll('.cell.is-target[data-unit]')).find(element=>element.dataset.unit===pick.uid);
  if(!cell||typeof document.createElement!=='function')return;
  for(let i=0;i<2;i++){
   const flare=document.createElement('i');flare.className='duel-selection-flare'+(i?' duel-selection-flare-small':'');flare.setAttribute('aria-hidden','true');cell.appendChild(flare);
   animate(flare,[{opacity:0,scale:'.25',rotate:'-35deg'},{opacity:.9,scale:'1',rotate:'0deg',offset:.3},{opacity:0,scale:'.5',rotate:'25deg'}],{duration:330,delay:i*55},()=>flare.remove());
  }
 }
 function entrance(){
  if(!options.changed||s.reduced||hidden())return;
  const selectors=s.mode==='battle'?'.arena-header,.rarity-piles,.main-deck,.mao,.turn-guide':
   s.mode==='menu'?'.realm-champions,.toon-brand,.toon-mode,.toon-button':
   s.mode==='select'?'.selection-pick,.start-battle':
   '.fg-screen-header,.mode-header,.fg-archive-toolbar,.mode-tile,.fg-archive-item,.fg-result-card,.shop-header,.shop-chest-stage,.settings-content';
  const elements=Array.from(host.querySelectorAll(selectors)).filter(element=>{
   const box=element.getBoundingClientRect?.();return !box||box.width>0&&box.height>0;
  }).slice(0,10);
  elements.forEach((element,index)=>{
   // No battle unit is animated here. Its movement, entry and death belong to
   // resolved combat events; routine battle renders never replay this entrance.
   const frames=s.mode==='battle'?[{opacity:0},{opacity:1}]:
    [{opacity:0,translate:'0 13px'},{opacity:1,translate:'0 -1px',offset:.8},{opacity:1,translate:'0 0'}];
   animate(element,frames,{duration:s.mode==='battle'?260:380,delay:Math.min(index*35,210)});
  });
 }
 function sync(){
  if(s.dead)return;
  s.reduced=reduced(s.media);
  host.dataset.duelMotion=hidden()?'paused':s.reduced?'reduced':'ready';
  if(s.reduced||hidden()){lastPick=null;stop();}
 }
 function cleanup(){
  if(s.dead)return;s.dead=true;stop();for(const unbind of s.listeners.splice(0))unbind();
  host.classList?.remove('duel-motion-ready');delete host.dataset.duelMotion;
  if(active===s)active=null;
 }
 s.cleanup=cleanup;
 try{s.media=globalThis.matchMedia?.('(prefers-reduced-motion: reduce)')||null;}catch{}
 host.classList?.add('duel-motion-ready');active=s;
 listen(host,'pointerdown',press,{capture:true,passive:true});
 listen(globalThis,'pointerup',release,{capture:true,passive:true});
 listen(globalThis,'pointercancel',()=>{if(s.pressed){cancel(s.pressed.job);s.pressed=null;}},{capture:true,passive:true});
 listen(host,'keydown',press,true);listen(globalThis,'keyup',release,true);
 listen(host,'click',rememberPick,true);
 listen(document,'visibilitychange',sync);
 listen(globalThis,'goghos:presentation-preferences',sync);
 if(s.media?.addEventListener)listen(s.media,'change',sync);
 else if(s.media?.addListener){s.media.addListener(sync);s.listeners.push(()=>s.media.removeListener(sync));}
 sync();
 if(options.changed)lastPick=null;else selectionGlint();
 entrance();
 return cleanup;
}

function destroy(){detach();lastPick=null;}
function getDebugState(){return{active:!!active,mode:active?.mode||null,reducedMotion:!!active?.reduced,animations:active?.jobs.size||0,listeners:active?.listeners.length||0,pressed:!!active?.pressed,hidden:hidden()};}
G.DuelMotion=Object.freeze({mount,detach,destroy,getDebugState});
})(globalThis.GOGHOS=globalThis.GOGHOS||{});
