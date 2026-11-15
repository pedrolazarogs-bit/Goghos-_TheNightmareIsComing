// Menu de apresentação: arte e animações originais, sem acessos a telas internas.
(function(G){
'use strict';
const BASE='assets/menu-v036/',FAVORITE_KEY='goghos.menu-favorite.v036';
const PANEL_POINTS='0,0 985,0 420,1080 0,1080';
const FAVORITES=Object.freeze([
 {id:'unicorn',name:'Unicorn',index:0,faceX:.66,faceY:.4},{id:'sam',name:'Sam',index:1,faceX:.6,faceY:.47},
 {id:'sarck',name:'Sark',index:2,faceX:.53,faceY:.36},{id:'nully',name:'Nully',index:3,faceX:.47,faceY:.22,size:.8,portraitSize:.72},{id:'mike',name:'Mike',index:4,faceX:.41,faceY:.4}
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
 let state={coins:180,matches:0,owned:[]};
 // Apenas consulta os contadores antigos; esta edição não altera progresso nem moedas.
 try{const saved=JSON.parse(localStorage.getItem('goghos.sanctuary.v1')||'null');if(saved&&typeof saved==='object')state={...state,...saved};}catch{}
 return {state,title:'Vigilante',mode:{name:'5×5',tag:'GOGHOS'}};
}
function flame(){return '<svg viewBox="0 0 64 80" aria-hidden="true"><defs><linearGradient id="cosmos-flame" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#8ff0ff"/><stop offset="1" stop-color="#2a50ff"/></linearGradient></defs><path d="M33 3C36 20 56 30 56 52C56 68 45 77 32 77C18 77 8 67 8 52C8 40 15 33 19 24C22 33 26 35 28 32C30 22 28 11 33 3Z" fill="url(#cosmos-flame)" stroke="#000" stroke-width="4" stroke-linejoin="round"/><ellipse cx="32" cy="56" rx="11" ry="12" fill="#37d3ff" stroke="#000" stroke-width="3"/><circle cx="32" cy="58" r="4.5" fill="#ff3a63"/></svg>';}
function html(){
 const {state,title,mode}=data(),fav=favorite(),owned=Array.isArray(state.owned)?state.owned.length:0;
 const modeLabel=mode.name;
 const particles=Array.from({length:16},(_,index)=>`<i style="--x:${12+(index*67)%83}%;--y:${10+(index*37)%83}%;--size:${7+index%4*4}px;--delay:${-index*.71}s;--duration:${5+index%5*1.5}s"></i>`).join('');
 return `<section class="cosmos-menu" tabindex="-1" aria-label="Menu principal de GOGHOS — The Nightmare Is Coming"><div class="cosmos-stage">
 <img class="cosmos-bg" src="${BASE}bg.jpg" alt="" draggable="false"><div class="cosmos-rays" aria-hidden="true"></div><div class="cosmos-glow" aria-hidden="true"></div><div class="cosmos-sun" aria-hidden="true"></div>
 <svg class="cosmos-panel" width="1920" height="1080" viewBox="0 0 1920 1080" aria-hidden="true"><defs><linearGradient id="cosmos-panel-fill" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#36363d"/><stop offset="1" stop-color="#1d1d22"/></linearGradient></defs><polygon class="cosmos-panel-accent" points="830,185 1150,155 1000,330" fill="#000"/><polygon class="cosmos-panel-boundary" points="${PANEL_POINTS}" fill="url(#cosmos-panel-fill)" stroke="#000" stroke-width="18" stroke-linejoin="round"/><path d="M1012-6 446 1086" stroke="#ffffff22" stroke-width="5"/></svg>
 <div class="cosmos-character-layer"><button type="button" class="cosmos-favorite" data-cosmos-favorite aria-haspopup="dialog" aria-expanded="false" aria-label="Trocar personagem favorito. Atual: ${safe(fav.name)}" style="--face-x:${fav.faceX};--face-y:${fav.faceY};--favorite-size:${fav.size||1};--favorite-portrait-size:${fav.portraitSize||1}">${art('character-'+fav.index,'class="cosmos-favorite-image"')}</button></div>
 <svg class="cosmos-divider" width="1920" height="1080" viewBox="0 0 1920 1080" aria-hidden="true"><polygon points="${PANEL_POINTS}" fill="none" stroke="#000" stroke-width="18" stroke-linejoin="round"/></svg>
 <div class="cosmos-favorite-label cosmos-pop" style="--delay:1s"><strong>${safe(fav.name)}</strong><span>Favorito</span><small>Toque ou clique para trocar</small></div>
 <span class="cosmos-decor cosmos-profile cosmos-pop" style="--delay:.7s">${art('frame')}<span class="cosmos-profile-initial" aria-hidden="true">G</span><strong>${safe(title)}</strong></span>
 <div class="cosmos-stat cosmos-stat-visuais cosmos-pop" style="--delay:.8s" aria-label="${owned} visuais na coleção">${art('star')}<b>${owned}</b><span>Visuais</span></div>
 <div class="cosmos-stat cosmos-stat-matches cosmos-pop" style="--delay:.85s" aria-label="${count(state.matches)} partidas concluídas">${flame()}<b>${format(state.matches)}</b><span>Partidas</span></div>
 <span class="cosmos-decor cosmos-coins cosmos-pop" style="--delay:.6s">${art('coins')}<b>${format(state.coins)}</b></span>
 <span class="cosmos-decor cosmos-settings cosmos-pop cosmos-button" style="--delay:.6s">${art('dots')}<i></i><i></i><i></i></span>
 <div class="cosmos-logo cosmos-pop" style="--delay:.5s"><div class="cosmos-float"><img src="${BASE}logo.webp" alt="GOGHOS — The Nightmare Is Coming" draggable="false"><i class="cosmos-shine" aria-hidden="true"></i></div></div>
 <div class="cosmos-shortcuts"><span class="cosmos-decor cosmos-shortcut cosmos-shop cosmos-pop cosmos-button" style="--delay:.9s">${art('shop')}<span>Loja</span></span><span class="cosmos-decor cosmos-shortcut cosmos-deck cosmos-pop cosmos-button" style="--delay:1s">${art('deck')}<span>Deck</span></span><span class="cosmos-decor cosmos-shortcut cosmos-ranked cosmos-pop cosmos-button" style="--delay:1.1s">${art('trophy')}<span>Ranked</span></span></div>
 <span class="cosmos-decor cosmos-mode cosmos-pop cosmos-button" style="--delay:1.2s"><small>${safe(mode.tag)}</small><strong>${safe(modeLabel)}</strong></span>
 <span class="cosmos-decor cosmos-play cosmos-pop cosmos-button" style="--delay:1.3s"><span class="cosmos-float">${art('play')}<b>Play</b></span></span>
 <div class="cosmos-stars" aria-hidden="true">${particles}</div>
 <footer class="cosmos-footer"><span class="cosmos-decor">Crônicas</span><span class="cosmos-decor">The Nightmare Is Coming</span><small>v${safe(G.CONFIG?.version||'')} · Beta</small></footer>
 <span class="cosmos-announcement" role="status" aria-live="polite"></span>
 </div></section>`;
}
function reduced(){
 const prefs=G.PresentationFX?.getPreferences?.();
 if(typeof prefs?.reducedMotion==='boolean')return prefs.reducedMotion;
 return prefs?.motion==='reduced'||prefs?.motion!=='full'&&!!globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
}
function selectFavorite(s,id){
 if(active!==s)return false;
 const next=FAVORITES.find(item=>item.id===id);if(!next)return false;
 const trigger=s.menu.querySelector('[data-cosmos-favorite]');
 s.favorite=next;
 trigger.style.setProperty('--face-x',next.faceX);trigger.style.setProperty('--face-y',next.faceY);
 trigger.style.setProperty('--favorite-size',next.size||1);trigger.style.setProperty('--favorite-portrait-size',next.portraitSize||1);
 trigger.setAttribute('aria-label','Trocar personagem favorito. Atual: '+next.name);
 s.menu.querySelector('.cosmos-favorite-image').src=BASE+'character-'+next.index+'.webp';
 s.desktop?.select(next.id);
 s.menu.querySelector('.cosmos-favorite-label strong').textContent=next.name;
 let saved=true;try{localStorage.setItem(FAVORITE_KEY,next.id);}catch{saved=false;}
 s.menu.querySelector('.cosmos-announcement').textContent='Favorito selecionado: '+next.name+(saved?'.':' nesta sessão.');
 return true;
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
  s.desktop?.fit();
  // Use the rendered SVG edge, including its portrait letterboxing and stage scale.
  const stage=menu.querySelector('.cosmos-stage'),boundary=menu.querySelector('.cosmos-panel-boundary');
  const matrix=boundary.getScreenCTM(),bounds=stage.getBoundingClientRect();
  if(matrix&&bounds.width&&bounds.height){
   const points=Array.from(boundary.points,point=>{
    const x=(matrix.a*point.x+matrix.c*point.y+matrix.e-bounds.left)*stage.clientWidth/bounds.width;
    const y=(matrix.b*point.x+matrix.d*point.y+matrix.f-bounds.top)*stage.clientHeight/bounds.height;
    return x+'px '+y+'px';
   });
   menu.querySelector('.cosmos-character-layer').style.clipPath='polygon('+points.join(',')+')';
  }
 };
 const preferences=()=>{
  const value=reduced();menu.classList.toggle('cosmos-reduced',value);
  if(value){for(const animation of [...s.animations])animation.cancel();s.animations.clear();s.busy=false;}
 };
 const visibility=()=>{
  const hidden=!!globalThis.document?.hidden;menu.classList.toggle('cosmos-paused',hidden);
  for(const animation of s.animations)animation[hidden?'pause':'play']?.();
 };
 listen(menu,'click',event=>{
  const trigger=event.target.closest?.('[data-cosmos-favorite]');
  if(trigger)G.FavoritePicker?.open({choices:FAVORITES,selected:s.favorite.id,trigger,onSelect:id=>selectFavorite(s,id)});
 });
 listen(menu,'pointerdown',event=>{if(event.target.closest?.('.cosmos-decor'))G.PresentationFX?.interaction?.('click');});
 listen(menu,'pointerover',event=>{if(event.pointerType==='touch')return;const button=event.target.closest?.('.cosmos-button');if(button&&button!==s.hovered){s.hovered=button;G.PresentationFX?.interaction?.('hover');}});
 listen(menu,'pointerleave',()=>{s.hovered=null;});
 listen(globalThis,'goghos:presentation-preferences',preferences);
 listen(globalThis.document,'visibilitychange',visibility);
 if(typeof ResizeObserver==='function'){s.observer=new ResizeObserver(fit);s.observer.observe(menu);}else listen(globalThis,'resize',fit);
 fit();preferences();visibility();
 s.desktop=G.DesktopCharacter?.mount(menu,s.favorite.id);
 const enter=()=>{if(active===s){s.raf=null;menu.classList.add('cosmos-ready');s.desktop?.enter();}};
 if(typeof requestAnimationFrame==='function')s.raf=requestAnimationFrame(enter);else enter();
 return true;
}
function detach(){
 const s=active;if(!s)return;
 s.desktop?.destroy();G.FavoritePicker?.close({restoreFocus:false});active=null;if(s.raf!==null)globalThis.cancelAnimationFrame?.(s.raf);s.observer?.disconnect();
 for(const remove of s.listeners)remove();for(const animation of [...s.animations])animation.cancel();s.animations.clear();
 s.menu.classList.remove('cosmos-ready');s.menu.classList.add('cosmos-paused');
}
G.CosmosMenu=Object.freeze({html,mount,detach,getDebugState:()=>({active:!!active,favorite:active?.favorite.id||favorite().id,layout:active?.layout||null,animations:active?.animations.size||0,listeners:active?.listeners.length||0,observer:!!active?.observer})});
})(globalThis.GOGHOS);
