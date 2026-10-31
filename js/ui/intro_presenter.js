// Integra a abertura recebida ao jogo real. Nenhuma operação de combate é chamada aqui.
(function(G){
'use strict';
const SEEN_KEY='goghos-intro-v036',BASE='assets/intro-v036/';
const ESSENTIALS=['bg.jpg','logo.webp','coins.webp','deck.webp','shop.webp','star.webp','frame.webp','trophy.webp','dots.webp','play.webp',...Array.from({length:5},(_,i)=>'character-'+i+'.webp')].map(file=>'assets/menu-v036/'+file).concat(['assets/realms-v035/relic-icons.png','assets/realms-v035/navigation-icons.png']);
let active=null,serial=0;
const preferences=()=>G.PresentationFX?.getPreferences?.()||{muted:true,volume:.38,musicMuted:false,musicVolume:.55,reducedMotion:false};
const current=s=>active===s&&!s.closed;
function focus(s,selector){if(current(s))s.el.querySelector(selector)?.focus?.({preventScroll:true});}
function announce(s,text){if(current(s))s.el.querySelector('.intro-status').textContent=text;}
function close(){
 const s=active;if(!s)return false;
 active=null;s.closed=true;clearTimeout(s.timeout);
 for(const image of s.images){image.onload=null;image.onerror=null;}
 s.loader?.destroy();s.el.remove();
 if(s.app){s.app.inert=s.inert;if(s.hidden===null)s.app.removeAttribute('aria-hidden');else s.app.setAttribute('aria-hidden',s.hidden);}
 try{localStorage.setItem(SEEN_KEY,'seen');}catch{}
 G.Soundtrack?.setContext('menu');s.onClose?.();
 const target=s.previous?.isConnected&&s.previous!==document.body?s.previous:document.querySelector('[data-act="play"]');
 target?.focus?.({preventScroll:true});
 return true;
}
function fallback(s){
 if(!current(s))return;
 s.el.classList.add('intro-fallback');s.el.querySelector('[data-act="shell-enter"]').hidden=false;
 announce(s,'Você pode entrar no jogo ou pular a abertura.');
}
function start(s){
 if(!current(s)||!s.loaded||s.started)return;
 s.started=true;s.el.classList.add('intro-running');s.el.querySelector('.intro-start-prompt').hidden=true;focus(s,'[data-act="shell-skip"]');
 announce(s,'Carregando a arena.');
 try{s.loader.start();}catch{fallback(s);}
}
function open(options={}){
 if(typeof document==='undefined'||!document.body||typeof Image==='undefined'||typeof G.LoadingScreen!=='function')return false;
 if(active){if(!options.force)return true;close();}
 try{if(!options.force&&localStorage.getItem(SEEN_KEY)==='seen')return false;}catch{}
 const p=preferences(),app=document.getElementById('app'),el=document.createElement('div');
 const s={id:++serial,el,app,inert:app?.inert||false,hidden:app?.getAttribute('aria-hidden')??null,previous:document.activeElement,onClose:options.onClose,images:[],closed:false,started:false,loaded:false,progress:0,phase:'loading'};active=s;
 el.className='world-intro duel-intro';el.setAttribute('role','dialog');el.setAttribute('aria-modal','true');el.setAttribute('aria-label','Abertura de GOGHOS — The Nightmare Is Coming');
 el.innerHTML='<div class="duel-intro-scene" aria-hidden="true"></div><button class="intro-skip" data-act="shell-skip">Pular abertura</button><div class="intro-start-prompt"><p class="intro-kicker">GOGHOS · The Nightmare Is Coming</p><button class="intro-start" data-act="shell-start" disabled>Toque para iniciar</button></div><div class="intro-loading" role="status"><span class="intro-status">Preparando a abertura…</span><progress max="100" value="0" aria-label="Carregamento da arena"></progress></div><button class="intro-enter" data-act="shell-enter" hidden>Entrar no jogo</button>';
 document.body.append(el);if(app){app.inert=true;app.setAttribute('aria-hidden','true');}
 G.CosmosMenu?.detach();G.DuelMotion?.detach();
 G.Soundtrack?.setContext('silent',{immediate:true});
 el.addEventListener('click',event=>{const button=event.target.closest('[data-act]');if(!button||button.disabled)return;const act=button.dataset.act;if(act==='shell-start')start(s);else if(act==='shell-skip'||act==='shell-enter')close();});
 el.addEventListener('keydown',event=>{
  if(event.key==='Escape'){event.preventDefault();close();return;}
  if(event.key==='Tab'){const buttons=[...el.querySelectorAll('button')].filter(b=>!b.closest('[hidden]')&&!b.disabled),first=buttons[0],last=buttons.at(-1);if(event.shiftKey&&event.target===first){event.preventDefault();last?.focus();}else if(!event.shiftKey&&event.target===last){event.preventDefault();first?.focus();}}
 });
 focus(s,'[data-act="shell-skip"]');
 const onProgress=(value,phase)=>{
  if(!current(s))return;s.progress=Math.max(0,Math.min(1,value));s.phase=phase;
  el.querySelector('progress').value=Math.round(s.progress*100);
  if(phase==='ready')announce(s,'Pronto para duelar!');
 };
 try{
  s.loader=new G.LoadingScreen({parent:el.querySelector('.duel-intro-scene'),base:BASE,assets:{bg:'bg.webp',logoTop:'logo_top.webp',logoBottom:'logo_bottom.webp',font:'german_beauty.ttf',music:'ready_to_duel.mp3'},version:'Versão '+G.CONFIG.version,text:'Carregando...',readyText:'Pronto para duelar!',background:'#ffffff',music:!p.muted&&!p.musicMuted,volume:p.volume*p.musicVolume,sfx:!p.muted,sfxVolume:p.volume,reducedMotion:p.reducedMotion,zIndex:0,onProgress,onDone:()=>{if(current(s))close();}});
  let done=0;const count=ESSENTIALS.length+1,loaded=()=>{if(current(s))s.loader.setProgress(++done/count);};
  const images=ESSENTIALS.map(src=>new Promise(resolve=>{const image=new Image();s.images.push(image);image.onload=image.onerror=()=>{loaded();resolve();};image.src=src;}));
  const canvas=s.loader.load().then(()=>{loaded();return s.loader;});
  Promise.all([canvas,...images]).then(()=>{
   if(!current(s))return;clearTimeout(s.timeout);s.loaded=true;s.phase='waiting';el.classList.add('intro-loaded');el.querySelector('[data-act="shell-start"]').disabled=false;announce(s,'Toque para iniciar a abertura.');focus(s,'[data-act="shell-start"]');
  }).catch(()=>{if(current(s)){clearTimeout(s.timeout);s.failed=true;s.loader.destroy();fallback(s);}});
  s.loader.finished.then(()=>{if(current(s)&&s.started&&!s.failed)close();});
 }catch{fallback(s);}
 s.timeout=setTimeout(()=>fallback(s),8000);
 return true;
}
G.IntroPresenter=Object.freeze({open,close,isActive:()=>!!active,getDebugState:()=>({active:!!active,started:!!active?.started,loaded:!!active?.loaded,phase:active?.phase||'closed',progress:active?.progress||0,session:active?.id||serial})});
})(globalThis.GOGHOS);
