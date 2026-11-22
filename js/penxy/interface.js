(function(){
'use strict';
const M=GoghosBattleLab,$=id=>document.getElementById(id),stage=$('battle-stage'),dialog=$('battle-dialog');
if(new URLSearchParams(location.search).get('from')==='menu'){
 const back=document.querySelector('.lab-back');back.href='index.html';back.textContent='← Menu';
}
let state=M.create(),selected=null,busy=false,aiTimer=null,finishTimer=null,generation=0,dialogKind='',manualPause=false,hiddenPause=false;
let activeAction=null;
const FX=window.PenxyFX;
const canvasReady=!!document.createElement('canvas').getContext('2d');
const auras=new Map();
const cardElement=id=>stage.querySelector('[data-battle-card="'+id+'"]');
const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
function fullEffects(){return !reduced&&!matchMedia('(prefers-reduced-motion: reduce)').matches&&canvasReady;}
function syncAuras(){
 const visible=fullEffects()&&state.phase==='active'&&!state.paused&&!document.hidden;
 const ids=new Set(visible?state.cards.filter(c=>c.name==='Penxy'&&c.hp>0).map(c=>c.id):[]);
 for(const [id,aura] of auras)if(!ids.has(id)){aura.stop();auras.delete(id);}
 for(const id of ids)if(!auras.has(id)){
  const card=cardElement(id);
  if(card.dataset.auraRound!==String(state.round)){
   card.dataset.auraRound=String(state.round);FX.passive(card);
  }
  auras.set(id,FX.aura(card,{sound:false}));
 }
}
const compact=matchMedia('(pointer:fine) and (min-width:900px)').matches;
document.body.classList.toggle('compact-arena',compact);
const tip=$('arena-tip');
let tipOwner=null,dialogOwner=null;
function hideTip(){
 if(tipOwner)tipOwner.removeAttribute('aria-describedby');
 tipOwner=null;tip.hidden=true;
}
function note(owner,text){
 hideTip();
 tip.textContent=text;tip.hidden=false;tipOwner=owner;
 owner.setAttribute('aria-describedby',tip.id);
 const r=owner.getBoundingClientRect(),box=tip.getBoundingClientRect();
 tip.style.left=Math.max(8,Math.min(innerWidth-box.width-8,r.left+(r.width-box.width)/2))+'px';
 tip.style.top=(r.top>=box.height+16?r.top-box.height-8:Math.min(innerHeight-box.height-8,r.bottom+8))+'px';
}
function inform(c){say(c.name+' · '+c.hp+'/'+c.maxHp+' PV · '+c.atk+' de dano'+(c.hp?'':' · eliminado'));}
let reduced=matchMedia('(prefers-reduced-motion:reduce)').matches;
const now=()=>performance.now(),art=c=>(c.name==='Penxy'?'assets/arena/penxy.webp':'assets/menu-v036/character-'+c.art+'.webp'),teamName=t=>t==='blue'?'Azul':'Vermelho';
const player=()=>state.cards.find(c=>c.id===state.playerId);
const alive=t=>state.cards.filter(c=>c.team===t&&c.hp>0),isAutomatic=()=>M.current(state)?.controller==='bot';
const format=ms=>{const seconds=Math.floor(ms/1000);return String(Math.floor(seconds/60)).padStart(2,'0')+':'+String(seconds%60).padStart(2,'0');};
const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function fit(){hideTip();stage.style.setProperty('--battle-scale',String(Math.min(innerWidth/1600,innerHeight/900)));CardTouch.close();}
function cancelTimers(){clearTimeout(aiTimer);clearTimeout(finishTimer);aiTimer=finishTimer=null;generation++;busy=false;activeAction?.abort();activeAction=null;FX.haunt.exit(true);FX.clear();for(const aura of auras.values())aura.stop();auras.clear();}
function say(text){$('battle-message').textContent=text;}
function closeDialog(){
 dialog.close();dialogKind='';
 if(compact&&dialogOwner?.isConnected)dialogOwner.focus({preventScroll:true});
 dialogOwner=null;schedule();
}
function openDialog(kind,title,body,actions=[]){
 CardTouch.close();clearTimeout(aiTimer);aiTimer=null;
 hideTip();
 dialogOwner=document.activeElement;
 dialog.dataset.kind=kind;
 dialogKind=kind;$('dialog-title').textContent=title;$('dialog-body').innerHTML=body;$('dialog-actions').replaceChildren();
 $('dialog-close').hidden=kind==='setup'||kind==='result';
 for(const action of actions){if(compact&&kind==='info'&&action.run===closeDialog)continue;const b=document.createElement('button');b.textContent=action.label;b.className=action.primary?'primary':'';b.addEventListener('click',action.run);$('dialog-actions').append(b);}
 if(!dialog.open){
  if(compact && kind!=='setup' && kind!=='result')dialog.show();
  else dialog.showModal();
 }
 if(compact && kind==='info')$('dialog-close').focus({preventScroll:true});
}
function showSetup(){
  const options=M.roster.map((name,i)=>'<option value="'+i+'">'+escape(name)+'</option>').join('');
  openDialog('setup','Escolha seu personagem','<label class="character-pick">Seu personagem<select id="owned-character">'+options+'</select></label><p>Você joga pela equipe azul. Três aliados e quatro adversários agem por conta própria.</p>',[{label:'Iniciar batalha',primary:true,run:()=>{
   if(!M.start(state,now(),Number($('owned-character').value)))return;
   window.Efeitos?.prepararSom();FX.unlock();
   selected=state.playerId;closeDialog();render();schedule();
  }}]);
}
function renderTeam(team){
 const row=$('team-'+team);
 const cards=state.cards.filter(c=>c.team===team);
 // Stable elements let a damage transition finish and a critical pulse continue across turns.
 if(row.children.length!==cards.length){
  row.replaceChildren(...cards.map(c=>{
   const button=document.createElement('button');
   button.type='button';
   button.className='combat-card a'+c.art;
   button.dataset.battleCard=c.id;
   button.dataset.controller=c.controller;
   button.innerHTML=ArenaArt.card(c,true);
   return button;
  }));
 }
 cards.forEach((c,i)=>{
  const button=row.children[i],active=state.phase==='active'&&M.current(state)?.id===c.id;
  button.classList.toggle('is-current',active);
  button.classList.toggle('is-selected',selected===c.id);
  button.classList.toggle('dead',c.hp===0);
  if(c.hp>0&&button.style.visibility==='hidden')FX.restore(button);
  button.classList.toggle('haunt-opponent',state.haunt?.target===c.id);
  if(c.hp>0)button.classList.remove('falling');
  button.setAttribute('aria-label',c.name+', equipe '+teamName(c.team)+', '+c.hp+' de '+c.maxHp+' PV'+(c.id===state.playerId?', seu personagem':', bot')+(active?', vez atual':''));
  ArenaArt.updateHealth(button,c);
 });
}
const supportSlots=Array.from({length:M.SUPPORT_LIMIT},(_,index)=>{
 const button=document.createElement('button');
 button.type='button';
 const icon=document.createElement('img');
 icon.alt='';
 button.append(icon);
 button.addEventListener('click',()=>{
  const card=state.supports.blue[index];
  const text='Espaço '+(index+1)+' de '+M.SUPPORT_LIMIT+' · '+(card?.name||'vazio');
  if(compact){note(button,text);return;}
  openDialog('info','Mão de apoios','<p>'+escape(text)+'</p>',[{label:'Voltar ao campo',run:closeDialog}]);
 });
 $('support-hand').append(button);
 return button;
});
function renderHand(){
 const hand=state.supports.blue;
 $('support-free').textContent=hand.filter(card=>!card).length+'/'+M.SUPPORT_LIMIT;
 supportSlots.forEach((button,index)=>{
  const card=hand[index];
  const src=(card?.icon||'assets/arena/mao-vazia.png');
  const icon=button.firstElementChild;
  if(icon.getAttribute('src')!==src)icon.setAttribute('src',src);
  button.setAttribute('aria-label','Apoio '+(index+1)+' de '+M.SUPPORT_LIMIT+' · '+(card?.name||'vazio'));
 });
}
const queueSlots=['next','current','last'].map(role=>{
 const button=document.createElement('button');
 button.type='button';
 button.className='queue-card '+role;
 $('queue').append(button);
 return button;
});
function renderQueue(){
 const entries=[M.next(state),M.current(state),state.cards.find(c=>c.id===state.last)];
 const labels=['PRÓXIMO','VEZ ATUAL','ÚLTIMO ATAQUE'];
 entries.forEach((card,index)=>{
  const button=queueSlots[index];
  const key=card?.id||'';
  if(button.dataset.key===key)return;
  const previous=button.lastElementChild;
  button.dataset.key=key;
  button.disabled=!card;
  button.classList.toggle('blue',card?.team==='blue');
  button.classList.toggle('red',card?.team==='red');
  if(card)button.dataset.inspect=card.id;else delete button.dataset.inspect;
  button.setAttribute('aria-label',labels[index]+' · '+(card?card.name+' · '+teamName(card.team):'—'));
  const face=document.createElement('div');
  face.className='queue-face';
  face.setAttribute('aria-hidden','true');
  face.innerHTML=(card?'<img class="q-art" src="'+ArenaArt.ribbon(card)+'" alt="">':'')+'<span><small>'+labels[index]+'</small>'+(card?escape(card.name):'—')+'</span>';
  // Only a change of occupant animates. Pauses and redraws retain the same buttons.
  button.replaceChildren(face);
  if(!previous||!card||reduced||matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  button.prepend(previous);
  const timing={duration:360,easing:'ease-in-out'};
  const exit=previous.animate([{opacity:1},{opacity:0,transform:'translateY(7px)'}],timing);
  exit.onfinish=()=>previous.remove();
  face.animate([{opacity:0,transform:'translateY(-7px)'},{opacity:1,transform:'none'}],timing);
 });
}
function render(){hideTip();
 renderHand();
 for(const team of ['blue','red']){renderTeam(team);$('score-'+team).textContent=state.score[team];$('pips-'+team).innerHTML=Array.from({length:3},(_,i)=>'<i class="'+(i<state.score[team]?'filled':'')+'"></i>').join('');}
 $('red-alive').textContent=alive('red').length+'/4';
 $('round').textContent='RODADA '+state.round;$('pause').disabled=state.phase!=='active';$('pause').textContent=state.paused?'Retomar':'Pausar';document.body.classList.toggle('paused',state.paused);
 const current=M.current(state);
 renderQueue();syncAuras();
 const owner=player();
 $('owned-name').textContent=owner?.name||'—';
 $('action-hint').textContent=state.phase==='finished'?'Série encerrada.':state.paused?'Ações pausadas. O relógio continua.':busy?'Resolvendo ataque…':isAutomatic()?'O computador está escolhendo o alvo.':'Clique no oponente para escolher o alvo.';
 updateInspector();CardTouch.refresh();
 if(state.phase==='active')say(state.paused?'Ações pausadas.':busy?'Ataque em andamento…':(current.controller==='bot'?current.name+' · bot da equipe '+teamName(current.team):'Sua vez · '+current.name));
}
function abilityText(c){
 if(c.name==='Penxy')return 'Garra Fantasma · 140 de ataque. Assombração leva um rival à mente de Penxy. Os dois alternam ataques e o rival recebe −1 VEL até a saída.';
 return 'Ataque impresso: '+ArenaArt.printedAttack(c)+'. As regras de ativação da habilidade ainda aguardam definição.';
}
function updateInspector(){
 const c=player(),panel=$('inspector'),portrait=$('portrait');
 const ability=document.querySelector('[data-slot=ability]');
 ability.disabled=!c;
 if(!c){
  panel.replaceChildren();portrait.replaceChildren();delete panel.dataset.owner;
  ability.replaceChildren();return;
 }
 if(panel.dataset.owner!==c.name){
  panel.dataset.owner=c.name;
  portrait.classList.toggle('penxy-portrait',c.name==='Penxy');
  portrait.innerHTML='<img src="'+art(c)+'" alt="'+escape(c.name)+'">';
  panel.innerHTML='<h2>'+escape(c.name)+'</h2><div class="stat-life"><span class="damage-trail" aria-hidden="true"></span><i></i><strong></strong><small>PV</small><img src="'+('assets/player-panel-v048/heart.png')+'" alt="Vida"></div><div class="stat-def" aria-hidden="true"></div><div class="stat-detail"><b></b><img src="'+('assets/player-panel-v048/damage.png')+'" alt="Dano"><span>ATK</span></div><button id="inspect-selected">Detalhes</button>';
  $('inspect-selected').addEventListener('click',()=>inspect(player().id));
  ability.innerHTML=ArenaArt.emblem(c)+'<span>HABILIDADE</span>';
  ability.setAttribute('aria-label','Habilidade de '+c.name);
 }
 if(c.name==='Penxy'){
  const inside=state.haunt?.owner===c.id;
  ability.querySelector('span').textContent=inside?'SAIR DA MENTE':'ASSOMBRAÇÃO';
  ability.setAttribute('aria-label',inside?'Sair da mente':'Usar Assombração');
 }
 const life=panel.querySelector('.stat-life');
 if(ArenaArt.setMeterState(life,c))life.style.setProperty('--missing-hp',(100*ArenaArt.missingFraction(c))+'%');
 panel.querySelector('.stat-life strong').textContent=c.hp;
 panel.querySelector('.stat-detail b').textContent=c.atk;
 for(const el of document.querySelectorAll('[data-battle-card]'))el.classList.toggle('is-selected',el.dataset.battleCard===selected);
}
function inspect(id){
 const c=state.cards.find(c=>c.id===id);if(!c)return;
 selected=id;updateInspector();
 if(compact&&document.activeElement?.id!=='inspect-selected'){inform(c);return;}
 openDialog('info',c.name+' · equipe '+teamName(c.team),'<p>Vida: '+c.hp+' / '+c.maxHp+' PV<br>Dano básico: '+c.atk+'<br>Estado: '+(c.hp?['em campo',...c.status.map(x=>x.name+' '+x.value)].join(' · '):'eliminado')+'</p><p>'+escape(abilityText(c))+'</p>',[{label:'Voltar ao campo',run:closeDialog}]);
}
function lockAction(){
 CardTouch.close();clearTimeout(aiTimer);busy=true;
 activeAction=new AbortController();
 return activeAction.signal;
}
function finishAction(signal){
 if(signal.aborted)return;
 activeAction=null;busy=false;selected=state.playerId;render();
 if(state.phase==='round-end'||state.phase==='finished')showResult();else schedule();
}
async function whenPlaying(signal){
 while(!signal.aborted&&(state.paused||dialog.open||document.hidden))await wait(60);
 return !signal.aborted;
}
async function changeHaunt(actor,target,controller){
 if(busy||state.paused||dialog.open||state.phase!=='active'||actor!==M.current(state)||actor.controller!==controller)return;
 const entering=!state.haunt;
 if(entering){
  if(!M.enterHaunt(state,actor.id,target?.id,controller,now()))return;
 }else{
  if(state.haunt.owner!==actor.id)return;
  M.leaveHaunt(state,now());
  if(controller==='bot')actor.hauntUsedOnTurn=state.sequence;
 }
 const signal=lockAction();
 render();say(entering?'Assombração · '+target.name+' entrou na mente de Penxy.':'Penxy saiu da mente.');
 try{
  if(entering&&fullEffects())await FX.haunt.enter(cardElement(actor.id),cardElement(target.id),{signal});
  if(!entering)await FX.haunt.exit();
 }finally{finishAction(signal);}
}
function perform(targetId,controller='player'){
 if(busy||state.paused||dialog.open||state.phase!=='active')return false;
 const actor=M.current(state),victim=M.attackTarget(state,actor?.id,targetId,controller);
 if(!victim)return false;
 const target=cardElement(targetId),source=cardElement(actor.id),signal=lockAction();
 const visuals=fullEffects(),wasHaunted=!!state.haunt;
 let result=null,damageFx=Promise.resolve();
 target.classList.remove('tc-hit');
 function impact(){
  if(result||signal.aborted)return;
  result=M.attack(state,actor.id,targetId,now(),controller);
  if(!result)return;
  if(state.haunt&&state.haunt.owner===actor.id)state.haunt.exchanged=true;
  if(result.defeated)target.classList.add('falling');
  render();
  if(visuals)damageFx=FX.damage(target,result.damage,{sound:actor.name!=='Penxy'});
  say((result.defeated?'Eliminado! ':'')+'−'+result.damage+' PV em '+victim.name);
 }
 async function resolveAttack(){
  try{
   if(visuals&&actor.name==='Penxy'){
    say('Garra Fantasma · '+actor.name+' → '+victim.name);
    await FX.attack(source,target,{signal,beforeImpact:()=>whenPlaying(signal),onImpact:impact});
   }else if(visuals&&actor.name==='Nully'&&window.Efeitos?.katana){
    say('Katana · '+actor.name+' → '+victim.name);
    await window.Efeitos.katana(target,{tipo:victim.hp<=actor.atk?'brutal':'normal',inverter:actor.team==='red',
     signal,pausado:()=>state.paused||dialog.open||document.hidden,onImpacto:impact});
   }else{
    if(visuals)source.animate([{translate:'0 0'},{translate:'0 -20px'},{translate:'0 0'}],{duration:420,easing:'ease-out'});
    impact();
   }
  }catch(error){console.warn('Animação de ataque',error);}
  try{
   if(!result&&await whenPlaying(signal))impact();
   if(!result||signal.aborted)return;
   await damageFx;
   if(signal.aborted)return;
   if(wasHaunted&&!state.haunt)await FX.haunt.exit();
   if(signal.aborted)return;
   if(result.defeated){
    if(visuals)await FX.death(target);
    target.style.visibility='hidden';target.classList.remove('falling');
   }else if(!visuals)await wait(200);
  }finally{
   if(result?.defeated&&!signal.aborted)target.style.visibility='hidden';
   finishAction(signal);
  }
 }
 resolveAttack().catch(error=>console.warn('Efeito de combate',error));
 return true;
}
function schedule(){clearTimeout(aiTimer);aiTimer=null;if(state.phase!=='active'||state.paused||busy||dialog.open||document.hidden||!isAutomatic())return;
 const revision=state.revision,ticket=generation;
 aiTimer=setTimeout(()=>{if(ticket!==generation||revision!==state.revision||busy||state.paused||dialog.open||document.hidden)return;const actor=M.current(state),targets=alive(M.opposite(actor.team)).filter(c=>M.attackTarget(state,actor.id,c.id,'bot')).sort((a,b)=>a.hp-b.hp||a.slot-b.slot);if(!targets[0])return;
 // A bot uses the mind for one exchange, then returns to the normal turn queue.
 if(actor.name==='Penxy'&&state.haunt?.owner===actor.id&&state.last!==null&&state.haunt.exchanged){
  changeHaunt(actor,null,'bot');return;
 }
 if(actor.name==='Penxy'&&!state.haunt&&actor.hauntUsedOnTurn!==state.sequence){
  changeHaunt(actor,targets[0],'bot');return;
 }
 perform(targets[0].id,'bot');},3200);
}
function showResult(){const finished=state.phase==='finished',winner=state.roundWinner;openDialog('result',finished?'Equipe '+teamName(winner)+' vence a série!':'Ponto para a equipe '+teamName(winner),'<img class="match-emblem" src="'+('assets/menu-v036/trophy.webp')+'" alt=""><div class="result-score"><b>'+state.score.blue+'</b><span>×</span><b>'+state.score.red+'</b></div><p>'+ (finished?'Três vitórias conquistadas. Tempo final: <b>'+format(M.elapsed(state,now()))+'</b>.':'Os quatro adversários foram eliminados. As duas equipes voltam com vida cheia na próxima rodada; o cronômetro continua.')+'</p>',[{label:finished?'Nova série':'Próxima rodada',primary:true,run:()=>{if(finished){restart();return;}dialog.close();dialogKind='';M.continueRound(state,now());manualPause=hiddenPause=false;selected=state.playerId||M.current(state).id;render();schedule();}},{label:'Exportar registro',run:exportState}]);say(finished?'Vitória final da equipe '+teamName(winner):'Rodada encerrada.');}
function exportState(){const data={version:'0.59.0',mode:'single-player',elapsedMs:M.elapsed(state,now()),...state};const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='goghos-batalha-0.59.0.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
function restart(){cancelTimers();CardTouch.close();dialog.close();state=M.create();manualPause=hiddenPause=false;selected=null;render();showSetup();}
function setPaused(){const value=manualPause||hiddenPause;if(state.phase==='active'){M.pause(state,value,now());CardTouch.close();clearTimeout(aiTimer);render();schedule();}}
CardTouch.init({inlineDetails:compact?inform:null,selector:'[data-battle-card]',assets:'assets/card-touch-v044/',labels:{attack:'ATACAR'},getCard:el=>{const c=state.cards.find(c=>c.id===el.dataset.battleCard);return c&&{...c,ability:{name:'Habilidade de '+c.name,text:abilityText(c)}};},isAttackTurn:c=>state.phase==='active'&&!state.paused&&!busy&&!dialog.open&&!isAutomatic()&&!!M.attackTarget(state,M.current(state)?.id,c.id,'player'),onAttack:c=>perform(c.id)});
$('battle-field').addEventListener('click',e=>{const el=e.target.closest('[data-battle-card]');if(el){selected=el.dataset.battleCard;updateInspector();}});
$('queue').addEventListener('click',e=>{const el=e.target.closest('[data-inspect]');if(el)inspect(el.dataset.inspect);});
document.querySelectorAll('[data-slot]').forEach(el=>el.addEventListener('click',()=>{
 const ability=el.dataset.slot==='ability',c=player();
 if(ability&&!c)return;
 if(ability&&c.name==='Penxy'&&M.current(state)===c&&!state.paused&&!busy&&state.phase==='active'){
  if(state.haunt?.owner===c.id){changeHaunt(c,null,'player');return;}
  if(!state.haunt){
   openDialog('ability','Assombração','<p>Escolha quem Penxy vai levar à mente. Para voltar à arena, toque em Sair da mente na sua vez.</p>',
    alive(M.opposite(c.team)).map(target=>({label:target.name+' · '+target.hp+' PV',run:()=>{
     closeDialog();changeHaunt(c,target,'player');
    }})));return;
  }
 }
 const title=ability?'Habilidade de '+c.name:'Espaço de item';
 const text=ability?abilityText(c):'Nenhum item equipado.';
 if(compact){note(el,title+' · '+text);return;}
 openDialog('info',title,(ability?ArenaArt.emblem(c):'')+'<p>'+escape(text)+'</p>',
  [{label:'Voltar ao campo',run:closeDialog}]);
}));
$('pause').addEventListener('click',()=>{manualPause=!manualPause;setPaused();});
$('restart').addEventListener('click',()=>{openDialog('confirm','Reiniciar a série?','<p>O placar, as equipes e o cronômetro desta sessão serão restaurados.</p>',[{label:'Continuar jogando',run:closeDialog},{label:'Reiniciar',primary:true,run:restart}]);});
$('motion').addEventListener('click',()=>{reduced=!reduced;FX.setReducedMotion(reduced);syncAuras();if(reduced)FX.haunt.exit(true);document.body.classList.toggle('reduced',reduced);$('motion').setAttribute('aria-pressed',String(reduced));$('motion').textContent=reduced?'Efeitos reduzidos':'Efeitos';});
$('history').addEventListener('click',()=>openDialog('info','Registro da série','<ul class="dialog-log">'+state.events.map(e=>'<li><small>'+format(e.ms)+' · '+escape(e.type)+'</small>'+escape(e.text)+'</li>').join('')+'</ul>',[{label:'Voltar ao campo',run:closeDialog}]));
$('export-battle').addEventListener('click',exportState);
$('help').addEventListener('click',()=>openDialog('info','Como jogar','<p>Na sua vez, selecione um inimigo e use <b>Atacar</b>. Os outros sete personagens são bots. Se o seu personagem for eliminado, seus aliados continuam até o fim da rodada.</p><p>A primeira equipe com três pontos vence.</p>',[{label:'Entendi',run:closeDialog}]));
if(compact){
 const dismissOutside=e=>{
  if(!tip.hidden&&!tipOwner?.contains(e.target))hideTip();
  if(dialog.open&&!dialog.matches(':modal')&&!dialog.contains(e.target)&&e.target!==dialogOwner)closeDialog();
 };
 document.addEventListener('pointerdown',dismissOutside,true);
 document.addEventListener('click',e=>{if(e.detail===0)dismissOutside(e);},true);
 document.addEventListener('focusin',e=>{
  if(!tip.hidden&&!tipOwner?.contains(e.target))hideTip();
 });
 document.addEventListener('keydown',e=>{
  if(e.key==='Escape'){
   hideTip();
   if(dialog.open&&!dialog.matches(':modal')){e.preventDefault();closeDialog();}
  }
 });
}
$('dialog-close').addEventListener('click',closeDialog);dialog.addEventListener('cancel',e=>{if(dialogKind==='setup'||dialogKind==='result')e.preventDefault();});dialog.addEventListener('close',schedule);
document.addEventListener('visibilitychange',()=>{hiddenPause=document.hidden;setPaused();});window.addEventListener('resize',fit);
setInterval(()=>$('clock').textContent=format(M.elapsed(state,now())),200);
window.GoghosBattle=Object.freeze({snapshot:()=>JSON.parse(JSON.stringify({...state,elapsedMs:M.elapsed(state,now()),control:'single-player',busy})),destroy(){cancelTimers();CardTouch.destroy();}});
fit();document.body.classList.toggle('reduced',reduced);$('motion').setAttribute('aria-pressed',String(reduced));render();showSetup();
})();
