// Enquadramento e movimentos pontuais exclusivos do computador.
(function(G){
'use strict';
function mount(menu,initialId){
 const button=menu.querySelector('.cosmos-favorite'),image=button.querySelector('img');
 const media=matchMedia('(hover: hover) and (pointer: fine)');
 let id=initialId,enabled=false,animation=null,generation=0,destroyed=false;
 const reduced=()=>G.PresentationFX?.getPreferences?.().reducedMotion||matchMedia('(prefers-reduced-motion: reduce)').matches;
 function stop(){generation++;animation?.cancel();animation=null;}
 function fit(){
  const next=media.matches&&innerWidth>=900&&innerWidth>=innerHeight;
  if(enabled===next)return;stop();enabled=next;
  if(next)menu.dataset.desktopCharacter='true';
  else delete menu.dataset.desktopCharacter;
 }
 async function play(kind){
  stop();if(!enabled||destroyed||reduced()||document.hidden)return;
  const current=generation;
  try{await image.decode();}catch{return;}
  if(current!==generation||!enabled||destroyed||document.hidden||reduced())return;
  // Preserve the accepted size: fade and a short slide, without zoom.
  animation=image.animate([
   {opacity:0,transform:kind==='entry'?'translateX(-24px)':'translateY(12px)'},
   {opacity:1,transform:'translate(0,0)'}
  ],{duration:kind==='entry'?650:420,easing:'cubic-bezier(.2,.8,.2,1)',iterations:1});
  animation.id='favorite-'+kind;
  const running=animation;
  running.onfinish=()=>{if(animation===running)animation=null;running.cancel();};
 }
 function select(next){if(next===id)return;id=next;if(enabled)play('choice');}
 const preferences=()=>{if(reduced())stop();};
 const visibility=()=>{if(document.hidden)stop();};
 media.addEventListener('change',fit);
 globalThis.addEventListener('goghos:presentation-preferences',preferences);
 document.addEventListener('visibilitychange',visibility);
 fit();
 return {fit,select,enter:()=>play('entry'),destroy(){destroyed=true;stop();media.removeEventListener('change',fit);globalThis.removeEventListener('goghos:presentation-preferences',preferences);document.removeEventListener('visibilitychange',visibility);}};
}
G.DesktopCharacter=Object.freeze({mount});
})(globalThis.GOGHOS);
