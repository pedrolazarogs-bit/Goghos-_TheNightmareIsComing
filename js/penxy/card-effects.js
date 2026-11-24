// Bind the supplied effects to the real artwork and to confirmed combat events.
const ArenaCardEffects=(()=>{
 const E=window.Efeitos,layers=new Map();
 const sound=()=>{const p=GOGHOS.PresentationFX.getPreferences();return {som:!p.muted&&p.volume>0,volume:p.volume};};
 const fallback='data:image/svg+xml,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1536 2048"><path fill="#241e32" d="M768 60 1290 365V1570L768 1980 246 1570V365Z"/></svg>');
 function remove(button){
  const layer=layers.get(button);if(!layer)return;
  E.queimar.remover(layer.art);E.desgaste.remover(layer.art);
  layer.frame.remove();layers.delete(button);
 }
 function sync(card,button,visible){
  const turns=card.status.find(effect=>effect.type==='burn')?.turns||0;
  const level=card.skill==='wear'?GoghosBattleLab.wearLevel(card.hp):0;
  if(!visible||!card.hp||(!turns&&!level)){remove(button);return;}
  let layer=layers.get(button);
  if(!layer){
   const frame=document.createElement('span'),art=document.createElement('span'),img=new Image();
   frame.className='card-fx-frame'+(button.querySelector('.revised-face')?' cropped':'');
   frame.setAttribute('aria-hidden','true');art.className='card-fx-art';img.alt='';
   img.src=GoghosBattleLab.deck[card.art].image||fallback;
   art.append(img);frame.append(art);button.append(frame);
   layer={frame,art,turns:0,level:0};layers.set(button,layer);
  }
  if(level!==layer.level){layer.level=level;E.desgaste(layer.art,level,sound());}
  if(turns!==layer.turns){
   layer.turns=turns;
   if(turns)E.queimar(layer.art,{...sound(),turnos:turns});
   else E.queimar.remover(layer.art);
  }
 }
 function pulse(hit,button){
  const layer=layers.get(button);
  if(!layer)return;
  if(hit.burn&&layer.turns){
   layer.turns--;E.queimar.tick(layer.art,{...sound(),dano:hit.damage,numero:hit.target===hit.recipient});
  }
  if(hit.damage&&layer.level)E.desgaste.golpe(layer.art,sound());
 }
 function clear(){for(const button of layers.keys())remove(button);}
 return {sound,sync,pulse,clear};
})();
