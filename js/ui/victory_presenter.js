// Real end-of-match rewards; all navigation stays inside the project.
(function(G){
'use strict';
let active=null;
function close(){if(!active)return;const s=active;active=null;s.view?.destroy({stopMusic:true});globalThis.removeEventListener('resize',s.layout);s.el.remove();s.app.inert=s.inert;if(s.arena)s.arena.inert=s.arenaInert;s.resolve();}
function open(options={}){
 close();
 return new Promise(resolve=>{
  const el=document.createElement('div'),app=document.getElementById('app'),p=G.PresentationFX?.getPreferences?.()||{};
  el.className='victory-overlay';el.setAttribute('role','dialog');el.setAttribute('aria-modal','true');el.setAttribute('aria-label','Vitória');
  el.innerHTML='<div class="victory-canvas"></div><p class="victory-status" role="status">Preparando sua vitória…</p><button data-victory="menu" disabled aria-label="Voltar ao menu">MENU</button><button data-victory="play" disabled aria-label="Jogar novamente">JOGAR</button>';
  const arena=document.getElementById('five-root');const s={el,app,inert:app.inert,arena,arenaInert:arena?.inert,resolve,layout:()=>{}};if(arena)arena.inert=true;active=s;app.inert=true;document.body.append(el);
  const current=()=>active===s;
  const finish=choice=>{if(!current())return;close();options.onChoice?.(choice);};
  const view=s.view=new G.GoghosVictory({container:el.querySelector('.victory-canvas'),assets:{"fundo": "assets/victory-v037/fundo.jpg", "trofeu": "assets/victory-v037/trofeu.png", "fonte": "assets/victory-v037/fonte.ttf", "musica": "assets/victory-v037/musica.mp3"},baseUrl:'',music:null,gate:false,sfx:!p.muted,sfxVolume:p.volume??.38,reducedMotion:p.reducedMotion,
   rewards:[{id:'dalycoin',label:'Moedas',value:options.coins||0}],
   onReady:()=>{if(!current())return;el.classList.add('victory-ready');el.querySelector('.victory-status').textContent='Vitória! +'+(options.coins||0)+' moedas.';el.querySelectorAll('button').forEach(b=>b.disabled=false);s.layout();el.querySelector('[data-victory="play"]').focus();},
   onFinished:choice=>finish(choice)});
  s.layout=()=>{if(!current()||!view.L)return;view._resize();view.L.buttons.forEach(b=>{const e=el.querySelector('[data-victory="'+b.id+'"]');Object.assign(e.style,{left:b.x+'px',top:b.y+'px',width:b.w+'px',height:b.h+'px'});});};
  globalThis.addEventListener('resize',s.layout);
  el.addEventListener('click',event=>{const button=event.target.closest('[data-victory]');if(!button||button.disabled)return;if(el.classList.contains('victory-failed'))finish(button.dataset.victory);else view.select(button.dataset.victory);});
  view.start().catch(()=>{if(!current())return;view.destroy({stopMusic:true});el.classList.add('victory-failed');el.querySelector('.victory-status').textContent='Vitória! +'+(options.coins||0)+' moedas.';el.querySelectorAll('button').forEach(b=>b.disabled=false);});
 });
}
G.VictoryPresenter=Object.freeze({open,close,getDebugState:()=>({active:!!active,ready:!!active?.view?._ready,state:active?.view?.state||'closed'})});
})(globalThis.GOGHOS);
