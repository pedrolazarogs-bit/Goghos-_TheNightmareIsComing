// Enquadramento e movimentos pontuais exclusivos do computador.
(function(G){
'use strict';
function mount(menu){
 const image=menu.querySelector('.cosmos-favorite-image');
 const media=matchMedia('(hover: hover) and (pointer: fine)');
 let enabled=false,animation=null,generation=0,destroyed=false;
 const reduced=()=>G.PresentationFX?.getPreferences?.().reducedMotion||matchMedia('(prefers-reduced-motion: reduce)').matches;
 function stop(){generation++;animation?.cancel();animation=null;}
 function fit(){
  const next=media.matches&&innerWidth>=900&&innerWidth>=innerHeight;
  if(enabled===next)return;stop();enabled=next;
  if(next)menu.dataset.desktopCharacter='true';
  else delete menu.dataset.desktopCharacter;
 }
 async function play(){
  stop();if(!enabled||destroyed||reduced()||document.hidden)return;
  const current=generation;
  try{await image.decode();}catch{return;}
  if(current!==generation||!enabled||destroyed||document.hidden||reduced())return;
  // Preserve the accepted size: fade and a short slide, without zoom.
  animation=image.animate([
   {opacity:0,transform:'translateX(-24px)'},
   {opacity:1,transform:'translate(0,0)'}
  ],{duration:650,easing:'cubic-bezier(.2,.8,.2,1)',iterations:1});
  animation.id='character-entry';
  const running=animation;
  running.onfinish=()=>{if(animation===running)animation=null;running.cancel();};
 }
 const preferences=()=>{if(reduced())stop();};
 const visibility=()=>{if(document.hidden)stop();};
 media.addEventListener('change',fit);
 globalThis.addEventListener('goghos:presentation-preferences',preferences);
 document.addEventListener('visibilitychange',visibility);
 fit();
 return {fit,enter:()=>play(),destroy(){destroyed=true;stop();media.removeEventListener('change',fit);globalThis.removeEventListener('goghos:presentation-preferences',preferences);document.removeEventListener('visibilitychange',visibility);}};
}
G.DesktopCharacter=Object.freeze({mount});
})(globalThis.GOGHOS);
