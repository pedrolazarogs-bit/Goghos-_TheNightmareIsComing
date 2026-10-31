// O menu recebido usa as imagens originais, com navegação e progresso do jogo real.
(function(G){
'use strict';
const BASE='assets/menu-v036/',FAVORITE_KEY='goghos.menu-favorite.v036';
const FAVORITES=Object.freeze([
 {id:'unicorn',name:'Unicorn',index:0},{id:'sam',name:'Sam',index:1},
 {id:'sarck',name:'Sark',index:2},{id:'nully',name:'Nully',index:3},{id:'mike',name:'Mike',index:4}
]);
const safe=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const art=(name,extra='')=>`<img src="${BASE+name}.webp" alt="" draggable="false" ${extra}>`;
const count=value=>Number.isFinite(Number(value))?Math.max(0,Math.floor(Number(value))):0;
const format=value=>count(value).toLocaleString('pt-BR');
let active=null;
function favorite(){
 let id;try{id=localStorage.getItem(FAVORITE_KEY);}catch{}
 return FAVORITES.find(item=>item.id===id)||FAVORITES[0];
}
function data(){
 let state={coins:0,matches:0,owned:[],equipped:{}};
 try{state=G.Sanctuary?.read?.()||state;}catch{}
 const title=G.Sanctuary?.cosmetics?.find(item=>item.id===state.equipped?.title)?.name||'Vigilante';
 const mode=G.VisualShell?.getMode?.()||{name:'Arena',tag:'Você × Bot'};
 return {state,title,mode};
}
function flame(){return '<svg viewBox="0 0 64 80" aria-hidden="true"><defs><linearGradient id="cosmos-flame" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#8ff0ff"/><stop offset="1" stop-color="#2a50ff"/></linearGradient></defs><path d="M33 3C36 20 56 30 56 52C56 68 45 77 32 77C18 77 8 67 8 52C8 40 15 33 19 24C22 33 26 35 28 32C30 22 28 11 33 3Z" fill="url(#cosmos-flame)" stroke="#000" stroke-width="4" stroke-linejoin="round"/><ellipse cx="32" cy="56" rx="11" ry="12" fill="#37d3ff" stroke="#000" stroke-width="3"/><circle cx="32" cy="58" r="4.5" fill="#ff3a63"/></svg>';}
function html(){
 const {state,title,mode}=data(),fav=favorite(),owned=Array.isArray(state.owned)?state.owned.length:0;
 const modeLabel=({arena:'Arena',champions:'Treino',support:'Apoios',divine:'Invocação'})[mode.id]||mode.name;
 const particles=Array.from({length:16},(_,index)=>`<i style="--x:${12+(index*67)%83}%;--y:${10+(index*37)%83}%;--size:${7+index%4*4}px;--delay:${-index*.71}s;--duration:${5+index%5*1.5}s"></i>`).join('');
 return `<section class="cosmos-menu" aria-label="Menu principal de GOGHOS — The Nightmare Is Coming"><div class="cosmos-stage">
 <img class="cosmos-bg" src="${BASE}bg.jpg" alt="" draggable="false"><div class="cosmos-rays" aria-hidden="true"></div><div class="cosmos-glow" aria-hidden="true"></div><div class="cosmos-sun" aria-hidden="true"></div>
 <svg class="cosmos-panel" width="1920" height="1080" viewBox="0 0 1920 1080" aria-hidden="true"><defs><linearGradient id="cosmos-panel-fill" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#36363d"/><stop offset="1" stop-color="#1d1d22"/></linearGradient></defs><polygon points="830,185 1150,155 1000,330" fill="#000"/><polygon points="0,0 985,0 420,1080 0,1080" fill="url(#cosmos-panel-fill)" stroke="#000" stroke-width="18" stroke-linejoin="round"/><path d="M1012-6 446 1086" stroke="#ffffff22" stroke-width="5"/></svg>
 <div class="cosmos-favorite" aria-hidden="true"><div class="cosmos-float">${art('character-'+fav.index,'class="cosmos-favorite-image"')}</div></div>
 <button class="cosmos-favorite-hit" type="button" data-cosmos-favorite aria-label="Trocar personagem favorito. Atual: ${safe(fav.name)}" title="Trocar personagem favorito"></button>
 <div class="cosmos-favorite-label cosmos-pop" style="--delay:1s"><strong>${safe(fav.name)}</strong><span>Favorito</span><small>toque para trocar</small></div>
 <button class="cosmos-profile cosmos-pop" data-act="sanctuary-collection" style="--delay:.7s" aria-label="Coleção e perfil: ${safe(title)}">${art('frame')}<span class="cosmos-profile-initial" aria-hidden="true">G</span><strong>${safe(title)}</strong></button>
 <div class="cosmos-stat cosmos-stat-visuais cosmos-pop" style="--delay:.8s" aria-label="${owned} visuais na coleção">${art('star')}<b>${owned}</b><span>Visuais</span></div>
 <div class="cosmos-stat cosmos-stat-matches cosmos-pop" style="--delay:.85s" aria-label="${count(state.matches)} partidas concluídas">${flame()}<b>${format(state.matches)}</b><span>Partidas</span></div>
 <button class="cosmos-coins cosmos-pop" data-act="shop" style="--delay:.6s" aria-label="${count(state.coins)} moedas. Abrir loja">${art('coins')}<b>${format(state.coins)}</b></button>
 <button class="cosmos-settings cosmos-pop cosmos-button" data-act="settings" style="--delay:.6s" aria-label="Configurações" title="Configurações">${art('dots')}<i></i><i></i><i></i></button>
 <div class="cosmos-logo cosmos-pop" style="--delay:.5s"><div class="cosmos-float"><img src="${BASE}logo.webp" alt="GOGHOS — The Nightmare Is Coming" draggable="false"><i class="cosmos-shine" aria-hidden="true"></i></div></div>
 <nav class="cosmos-shortcuts" aria-label="Explore o jogo"><button class="cosmos-shortcut cosmos-shop cosmos-pop cosmos-button" data-act="shop" style="--delay:.9s">${art('shop')}<span>Loja</span></button><button class="cosmos-shortcut cosmos-deck cosmos-pop cosmos-button" data-act="characters" style="--delay:1s">${art('deck')}<span>Deck</span></button><button class="cosmos-shortcut cosmos-ranked cosmos-pop cosmos-button" data-act="ranked-preview" style="--delay:1.1s">${art('trophy')}<span>Ranked</span></button></nav>
 <button class="cosmos-mode cosmos-pop cosmos-button" data-act="mode-open" style="--delay:1.2s" aria-label="Escolher modo. Atual: ${safe(mode.name)}" title="Escolher modo"><small>${safe(mode.tag)}</small><strong>${safe(modeLabel)}</strong><span>trocar modo</span></button>
 <button class="cosmos-play cosmos-pop cosmos-button" data-act="play" style="--delay:1.3s" aria-label="Jogar ${safe(mode.name)}"><span class="cosmos-float">${art('play')}<b>Play</b></span></button>
 <div class="cosmos-stars" aria-hidden="true">${particles}</div>
 <footer class="cosmos-footer"><button data-act="sanctuary-lore">Crônicas</button><button data-act="shell-intro">Rever abertura</button><small>v${safe(G.CONFIG?.version||'')} · Beta</small></footer>
 <span class="cosmos-announcement" role="status" aria-live="polite"></span>
 </div></section>`;
}
function reduced(){
 const prefs=G.PresentationFX?.getPreferences?.();
 if(typeof prefs?.reducedMotion==='boolean')return prefs.reducedMotion;
 return prefs?.motion==='reduced'||prefs?.motion!=='full'&&!!globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
}
function animate(s,element,keyframes,options,onfinish){
 if(!element?.animate||reduced()){onfinish?.();return;}
 const animation=element.animate(keyframes,options);s.animations.add(animation);
 animation.onfinish=()=>{s.animations.delete(animation);if(active===s)onfinish?.();};
 animation.oncancel=()=>s.animations.delete(animation);
}
function updateFavorite(s,next){
 const image=s.menu.querySelector('.cosmos-favorite-image'),label=s.menu.querySelector('.cosmos-favorite-label strong'),button=s.menu.querySelector('[data-cosmos-favorite]');
 s.favorite=next;image.src=BASE+'character-'+next.index+'.webp';label.textContent=next.name;
 button.setAttribute('aria-label','Trocar personagem favorito. Atual: '+next.name);
 s.menu.querySelector('.cosmos-announcement').textContent='Favorito: '+next.name;
 try{localStorage.setItem(FAVORITE_KEY,next.id);}catch{}
}
function swap(s){
 if(s.busy||active!==s)return;s.busy=true;
 const next=FAVORITES[(s.favorite.index+1)%FAVORITES.length],image=s.menu.querySelector('.cosmos-favorite-image');
 G.PresentationFX?.interaction?.('card');
 animate(s,image,[{transform:'none',opacity:1},{transform:'translateX(-140px)',opacity:0}],{duration:170,easing:'ease-in'},()=>{
  updateFavorite(s,next);
  animate(s,image,[{transform:'translateX(160px) scale(1.05)',opacity:0,filter:'brightness(2.4)'},{transform:'none',opacity:1,filter:'brightness(1)'}],{duration:380,easing:'cubic-bezier(.2,1.4,.4,1)'},()=>{s.busy=false;});
 });
}
function mount(host){
 const menu=host?.matches?.('.cosmos-menu')?host:host?.querySelector?.('.cosmos-menu');
 if(!menu)return false;
 if(active?.menu===menu)return true;
 detach();
 const s={menu,host,favorite:favorite(),busy:false,raf:null,animations:new Set(),listeners:[],observer:null,layout:'landscape'};active=s;
 const listen=(target,type,handler,options)=>{target?.addEventListener?.(type,handler,options);s.listeners.push(()=>target?.removeEventListener?.(type,handler,options));};
 const fit=()=>{
  if(active!==s)return;
  const rect=menu.getBoundingClientRect(),width=rect.width||globalThis.innerWidth||1920,height=rect.height||globalThis.innerHeight||1080;
  s.layout=width<height?'portrait':'landscape';menu.dataset.layout=s.layout;
  menu.style.setProperty('--cosmos-scale',String(Math.min(width/1920,height/1080)));
 };
 const preferences=()=>{
  const value=reduced();menu.classList.toggle('cosmos-reduced',value);
  if(value){for(const animation of [...s.animations])animation.cancel();s.animations.clear();s.busy=false;}
 };
 const visibility=()=>{
  const hidden=!!globalThis.document?.hidden;menu.classList.toggle('cosmos-paused',hidden);
  for(const animation of s.animations)animation[hidden?'pause':'play']?.();
 };
 listen(menu,'click',event=>{if(event.target.closest?.('[data-cosmos-favorite]'))swap(s);});
 listen(menu,'pointerover',event=>{if(event.pointerType==='touch')return;const button=event.target.closest?.('.cosmos-button');if(button&&button!==s.hovered){s.hovered=button;G.PresentationFX?.interaction?.('hover');}});
 listen(menu,'pointerleave',()=>{s.hovered=null;});
 listen(globalThis,'goghos:presentation-preferences',preferences);
 listen(globalThis.document,'visibilitychange',visibility);
 if(typeof ResizeObserver==='function'){s.observer=new ResizeObserver(fit);s.observer.observe(menu);}else listen(globalThis,'resize',fit);
 fit();preferences();visibility();
 const enter=()=>{if(active===s){s.raf=null;menu.classList.add('cosmos-ready');}};
 if(typeof requestAnimationFrame==='function')s.raf=requestAnimationFrame(enter);else enter();
 return true;
}
function detach(){
 const s=active;if(!s)return;
 active=null;if(s.raf!==null)globalThis.cancelAnimationFrame?.(s.raf);s.observer?.disconnect();
 for(const remove of s.listeners)remove();for(const animation of [...s.animations])animation.cancel();s.animations.clear();
 s.menu.classList.remove('cosmos-ready');s.menu.classList.add('cosmos-paused');
}
G.CosmosMenu=Object.freeze({html,mount,detach,getDebugState:()=>({active:!!active,favorite:active?.favorite.id||favorite().id,layout:active?.layout||null,animations:active?.animations.size||0,listeners:active?.listeners.length||0,observer:!!active?.observer})});
})(globalThis.GOGHOS);
