// Abertura obrigatória: o menu só é liberado após a conclusão da apresentação.
(function(G){
'use strict';
const BASE='assets/intro-v036/';
const ESSENTIALS=['bg.jpg','logo.webp','coins.webp','deck.webp','shop.webp','star.webp','frame.webp','trophy.webp','dots.webp','play.webp',...Array.from({length:5},(_,i)=>'character-'+i+'.webp')].map(file=>'assets/menu-v036/'+file).concat(['assets/realms-v035/relic-icons.png','assets/realms-v035/navigation-icons.png']);
let active=null,serial=0;
const preferences=()=>G.PresentationFX?.getPreferences?.()||{muted:true,volume:.38,musicMuted:false,musicVolume:.55,reducedMotion:false};
const current=s=>active===s&&!s.closed;
function focus(s,selector){if(current(s))(selector?s.el.querySelector(selector):s.el)?.focus?.({preventScroll:true});}
function announce(s,text){if(current(s))s.el.querySelector('.intro-status').textContent=text;}
function clearAttempt(s){
 clearTimeout(s.timeout);
 for(const image of s.images){image.onload=null;image.onerror=null;}
 s.images=[];s.loader?.destroy();
}
function finish(s){
 if(!current(s)||!s.completed)return false;
 active=null;s.closed=true;clearAttempt(s);s.el.remove();
 if(s.app){s.app.inert=s.inert;if(s.hidden===null)s.app.removeAttribute('aria-hidden');else s.app.setAttribute('aria-hidden',s.hidden);}
 G.Soundtrack?.setContext('menu');s.onClose?.();
 const target=s.previous?.isConnected&&s.previous!==document.body?s.previous:document.querySelector('[data-act="play"]');
 target?.focus?.({preventScroll:true});return true;
}
function fallback(s,message){
 if(!current(s))return;
 s.phase='retry';s.el.classList.remove('intro-running');s.el.classList.add('intro-fallback');s.el.querySelector('[data-act="shell-retry"]').hidden=false;
 announce(s,message);focus(s,'[data-act="shell-retry"]');
}
function failAttempt(s){
 if(!current(s))return;
 s.failed=true;clearAttempt(s);
 fallback(s,'Não foi possível carregar a abertura. Tente novamente para continuar.');
}
function start(s){
 if(!current(s)||!s.loaded||s.started||s.failed)return;
 const attempt=s.attempt;
 s.started=true;s.phase='run';s.el.classList.add('intro-running');s.el.querySelector('.intro-start-prompt').hidden=true;focus(s);
 announce(s,'Carregando a arena.');
 try{Promise.resolve(s.loader.start()).catch(()=>{if(current(s)&&s.attempt===attempt)failAttempt(s);});}catch{failAttempt(s);}
}
function load(s){
 const attempt=++s.attempt;clearAttempt(s);
 s.loader=null;s.loaded=false;s.started=false;s.failed=false;s.completed=false;s.progress=0;s.phase='loading';
 const el=s.el,p=preferences(),valid=()=>current(s)&&s.attempt===attempt;
 el.classList.remove('intro-running','intro-fallback','intro-loaded');el.querySelector('.intro-start-prompt').hidden=false;
 el.querySelector('[data-act="shell-start"]').disabled=true;el.querySelector('[data-act="shell-retry"]').hidden=true;el.querySelector('progress').value=0;
 announce(s,'Preparando a abertura…');focus(s);
 try{
  s.loader=new G.LoadingScreen({parent:el.querySelector('.duel-intro-scene'),base:BASE,assets:{bg:'bg.webp',logoTop:'logo_top.webp',logoBottom:'logo_bottom.webp',font:'german_beauty.ttf',music:'ready_to_duel.mp3'},version:'Versão '+G.CONFIG.version,text:'Carregando...',readyText:'Pronto para duelar!',background:'#ffffff',music:!p.muted&&!p.musicMuted,volume:p.volume*p.musicVolume,sfx:!p.muted,sfxVolume:p.volume,reducedMotion:p.reducedMotion,zIndex:0,
   onProgress:(value,phase)=>{
    if(!valid()||s.failed)return;s.progress=Math.max(0,Math.min(1,value));s.phase=phase;el.querySelector('progress').value=Math.round(s.progress*100);
    if(phase==='ready')announce(s,'Pronto para duelar!');
   },
   onDone:()=>{if(valid()&&s.loaded&&s.started&&!s.failed){s.completed=true;finish(s);}}
  });
  const loader=s.loader;let done=0;
  const loaded=()=>{if(valid()&&!s.failed)loader.setProgress(++done/(ESSENTIALS.length+1));};
  const images=ESSENTIALS.map(src=>new Promise((resolve,reject)=>{
   const image=new Image();s.images.push(image);
   image.onload=()=>{image.onload=image.onerror=null;loaded();resolve();};
   image.onerror=()=>{image.onload=image.onerror=null;reject(new Error('Recurso da abertura indisponível.'));};image.src=src;
  }));
  const canvas=loader.load().then(()=>{loaded();return loader;});
  Promise.all([canvas,...images]).then(()=>{
   if(!valid()||s.failed)return;clearTimeout(s.timeout);s.loaded=true;s.phase='waiting';el.classList.remove('intro-fallback');el.classList.add('intro-loaded');
   el.querySelector('[data-act="shell-retry"]').hidden=true;el.querySelector('[data-act="shell-start"]').disabled=false;announce(s,'Toque para iniciar a abertura.');focus(s,'[data-act="shell-start"]');
  }).catch(()=>{if(valid())failAttempt(s);});
  s.timeout=setTimeout(()=>{if(valid())fallback(s,'O carregamento está demorando. Você pode tentar novamente.');},8000);
 }catch{failAttempt(s);}
}
function open(options={}){
 if(typeof document==='undefined'||!document.body||typeof Image==='undefined')return false;
 if(active)return true;
 const app=document.getElementById('app'),el=document.createElement('div');
 const s={id:++serial,el,app,inert:app?.inert||false,hidden:app?.getAttribute('aria-hidden')??null,previous:document.activeElement,onClose:options.onClose,images:[],attempt:0,closed:false,completed:false};active=s;
 el.className='world-intro duel-intro';el.setAttribute('role','dialog');el.setAttribute('aria-modal','true');el.setAttribute('tabindex','-1');el.setAttribute('aria-label','Abertura de GOGHOS — The Nightmare Is Coming');
 el.innerHTML='<div class="duel-intro-scene" aria-hidden="true"></div><div class="intro-start-prompt"><p class="intro-kicker">GOGHOS · The Nightmare Is Coming</p><button class="intro-start" data-act="shell-start" disabled>Toque para iniciar</button></div><div class="intro-loading" role="status"><span class="intro-status">Preparando a abertura…</span><progress max="100" value="0" aria-label="Carregamento da arena"></progress></div><button class="intro-retry" data-act="shell-retry" hidden>Tentar novamente</button>';
 document.body.append(el);if(app){app.inert=true;app.setAttribute('aria-hidden','true');}
 G.CosmosMenu?.detach();G.DuelMotion?.detach();G.Soundtrack?.setContext('silent',{immediate:true});
 el.addEventListener('click',event=>{const button=event.target.closest('[data-act]');if(!button||button.disabled)return;if(button.dataset.act==='shell-start')start(s);else if(button.dataset.act==='shell-retry')load(s);});
 el.addEventListener('keydown',event=>{
  if(event.key==='Escape'){event.preventDefault();return;}
  if(event.key==='Tab'){
   const buttons=[...el.querySelectorAll('button')].filter(b=>!b.closest('[hidden]')&&!b.disabled),first=buttons[0],last=buttons.at(-1);
   if(!buttons.length){event.preventDefault();focus(s);}else if(event.shiftKey&&event.target===first){event.preventDefault();last.focus();}else if(!event.shiftKey&&event.target===last){event.preventDefault();first.focus();}
  }
 });
 load(s);return true;
}
// A API não oferece um atalho para dispensar uma apresentação em andamento.
G.IntroPresenter=Object.freeze({open,close:()=>false,isActive:()=>!!active,getDebugState:()=>({active:!!active,started:!!active?.started,loaded:!!active?.loaded,phase:active?.phase||'closed',progress:active?.progress||0,session:active?.id||serial})});
})(globalThis.GOGHOS);
