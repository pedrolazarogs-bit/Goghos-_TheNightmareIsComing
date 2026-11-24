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
 function prepare(card,button){
  let layer=layers.get(button);
  if(!layer){
   const frame=document.createElement('span'),art=document.createElement('span'),img=new Image();
   frame.className='card-fx-frame'+(button.querySelector('.revised-face')?' cropped':'');
   frame.setAttribute('aria-hidden','true');art.className='card-fx-art';img.alt='';
   img.src=GoghosBattleLab.deck[card.art].image||fallback;
   art.append(img);frame.append(art);button.append(frame);
   layer={frame,art,turns:0,level:0};layers.set(button,layer);
  }
  return layer;
 }
 function fireball(source,target,victim,options){
  return E.bolaDeFogo(source,target,{
   ...options,ponto:{x:0.72,y:0.42},mira:{x:0.5,y:0.42},
   arteOrigem:source.querySelector('.revised-face image'),
   arteAlvo:target.querySelector('.original-card image:not(.card-health image)')||target,
   alvoQueima(turns){
    const layer=prepare(victim,target);
    layer.turns=turns;
    return layer.art;
   }
  });
 }
 function sync(card,button,visible,busy){
  if(!visible||!card.hp){remove(button);return;}
  const turns=card.status.find(effect=>effect.type==='burn')?.turns||0;
  const level=card.skill==='wear'?GoghosBattleLab.wearLevel(card.hp):0;
  if(!level&&!turns&&!layers.has(button))return;
  const layer=prepare(card,button);
  if(level!==layer.level){layer.level=level;E.desgaste(layer.art,level,sound());}
  if(!busy&&turns!==layer.turns){
   layer.turns=turns;
   if(turns)E.queimar(layer.art,{...sound(),turnos:turns});
   else E.queimar.apagar(layer.art);
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
 return {sound,fireball,sync,pulse,clear};
})();
