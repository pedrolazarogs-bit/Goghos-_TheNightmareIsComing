// Seleção visual do favorito. Não abre catálogo, loja ou partida.
(function(G){
'use strict';
let active=null;
const safe=value=>String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
function close({restoreFocus=true}={}){
 const s=active;if(!s)return;active=null;
 s.dialog.close();s.dialog.remove();
 s.trigger?.setAttribute('aria-expanded','false');
 if(restoreFocus&&s.trigger?.isConnected)s.trigger.focus({preventScroll:true});
}
async function open({choices,selected,onSelect,trigger}={}){
 if(active||!choices?.length)return false;
 const dialog=document.createElement('dialog');
 dialog.className='favorite-picker';dialog.setAttribute('aria-labelledby','favorite-picker-title');dialog.setAttribute('aria-describedby','favorite-picker-description');
 dialog.innerHTML=`<header class="favorite-picker-header"><div><p class="favorite-picker-kicker">Seu lugar no menu</p><h2 id="favorite-picker-title">Personagem favorito</h2><p id="favorite-picker-description">Escolha quem vai aparecer na sua tela inicial.</p></div><button class="favorite-picker-close" type="button" aria-label="Fechar seleção de personagem">×</button></header><div class="favorite-picker-grid" role="group" aria-label="Personagens disponíveis">${choices.map(choice=>`<button type="button" class="favorite-choice" data-favorite-choice="${safe(choice.id)}" aria-pressed="${choice.id===selected}"><span class="favorite-choice-art"><img src="assets/menu-v036/character-${choice.index}.webp" alt="" draggable="false"></span><strong>${safe(choice.name)}</strong><small>${choice.id===selected?'Favorito atual':'Selecionar'}</small></button>`).join('')}</div><p class="favorite-picker-note">Seu favorito acompanha você na próxima visita.</p>`;
 const s={dialog,trigger};active=s;document.body.append(dialog);
 trigger?.setAttribute('aria-expanded','true');
 dialog.addEventListener('cancel',event=>{event.preventDefault();close();});
 dialog.addEventListener('close',()=>{if(active===s)close();});
 dialog.addEventListener('keydown',event=>{
  if(event.key!=='Tab')return;
  const buttons=[...dialog.querySelectorAll('button')],first=buttons[0],last=buttons.at(-1);
  if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
  else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
 });
 dialog.addEventListener('click',event=>{
  if(active!==s)return;
  const choice=event.target.closest('[data-favorite-choice]');
  if(choice){
   const item=choices.find(item=>item.id===choice.dataset.favoriteChoice);
   if(!item)return;onSelect?.(item.id);G.PresentationFX?.interaction?.('select');close();return;
  }
  const rect=dialog.getBoundingClientRect();
  if(event.target.closest('.favorite-picker-close')||event.target===dialog&&(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom))close();
 });
 // Decode before opening so all five thumbnails appear together on mobile too.
 await Promise.all([...dialog.querySelectorAll('img')].map(image=>image.decode().catch(()=>{})));
 if(active!==s)return false;
 dialog.showModal();
 dialog.querySelector('[aria-pressed="true"]')?.focus();
 return true;
}
G.FavoritePicker=Object.freeze({open,close,isActive:()=>!!active});
})(globalThis.GOGHOS);
