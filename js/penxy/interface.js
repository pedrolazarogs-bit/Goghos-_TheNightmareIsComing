(function(){
'use strict';
const M=GoghosBattleLab,$=id=>document.getElementById(id),stage=$('battle-stage'),dialog=$('battle-dialog');
if(new URLSearchParams(location.search).get('from')==='menu'){
 const back=document.querySelector('.lab-back');back.href='index.html';back.textContent='← Menu';
}
let state=M.create(),selected=null,busy=false,aiTimer=null,finishTimer=null,generation=0,dialogKind='',manualPause=false,hiddenPause=false;
let activeAction=null;
const FX=window.PenxyFX, ZFX=window.ZzusFX;
const canvasReady=!!document.createElement('canvas').getContext('2d');
const auras=new Map();
const cardElement=id=>stage.querySelector('[data-battle-card="'+id+'"]');
const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
function fullEffects(){return !reduced&&!matchMedia('(prefers-reduced-motion: reduce)').matches&&canvasReady;}
function zzusMove(action){
 const hero=state.cards.find(c=>c.skill==='protect'&&c.hp>0);
 const oldLink=hero?.link;
 const move=M.resolveHits(state,action);
 if(!hero)return move;
 move.hero=hero;
 move.received=move.hits.filter(h=>h.recipient===hero.id);
 move.fallen=!hero.hp;
 move.bound=hero.link&&hero.link!==oldLink;
 move.changed=move.fallen||hero.link!==oldLink||move.received.length>0;
 if(move.fallen&&fullEffects())cardElement(hero.id).classList.add('falling');
 return move;
}
function syncBond(){
 const hero=state.phase==='active'&&state.cards.find(c=>c.skill==='protect'&&c.hp&&c.link);
 const bond=ZFX.hero.current;
 if(!fullEffects()||!hero){
  if(bond)bond.release({silent:true});
 }else if(!bond||bond.allyEl!==cardElement(hero.link)){
  ZFX.hero.bind(cardElement(hero.id),cardElement(hero.link),{instant:true,label:'♥'});
 }
}
async function presentZzus(move,signal){
 if(!move.changed||!fullEffects()||signal.aborted)return;
 const el=cardElement(move.hero.id);
 try{
  if(move.bound)await ZFX.hero.bind(el,cardElement(move.hero.link),{label:'♥'});
  for(const hit of move.received){
   if(signal.aborted||!fullEffects())return;
   const bond=ZFX.hero.current;
   if(hit.target!==hit.recipient&&bond?.allyEl===cardElement(hit.target))await bond.protect(hit.damage);
   else await ZFX.damage(el,hit.damage);
  }
  if(move.fallen&&!signal.aborted&&fullEffects())await ZFX.death(el,{hide:false});
 }finally{
  if(!signal.aborted&&move.fallen){el.style.clipPath='';el.classList.remove('falling');}
 }
}
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
let inspectedId=null;
function inform(c){inspectedId=c.id;drawInfo();}
function drawInfo(){
 const c=state.cards.find(c=>c.id===inspectedId),box=$('card-info');
 box.hidden=!c||state.phase!=='active';if(box.hidden)return;
 box.querySelector('strong').textContent=c.name+' · '+teamName(c.team);
 box.querySelector('p').textContent=c.hp+'/'+c.maxHp+' PV · '+(M.attackPower(state,c)??'—')+' ATQ · '+(c.speed===null?'—':c.speed+(c.status.find(x=>x.type==='slow')?.speedDelta||0))+' VEL';
 box.querySelector('small').textContent=[c.hp?'':'Eliminado',...c.status.map(e=>e.name),c.secondForm?'Player 2 ativo':'',c.reserveHp!==undefined?'Forma em reserva: '+c.reserveHp+' PV':'',abilityText(c)].filter(Boolean).join(' · ');
}
function closeInfo(){inspectedId=null;drawInfo();}
$('close-info').onclick=closeInfo;
let reduced=matchMedia('(prefers-reduced-motion:reduce)').matches;
const now=()=>performance.now(),art=c=>(c.name==='Penxy'?'assets/arena/penxy.webp':M.deck[c.art].portrait||M.deck[c.art].image),teamName=t=>t==='blue'?'Azul':'Vermelho';
const player=()=>state.cards.find(c=>c.id===state.playerId);
const alive=t=>state.cards.filter(c=>c.team===t&&c.hp>0),isAutomatic=()=>M.current(state)?.controller==='bot';
const format=ms=>{const seconds=Math.floor(ms/1000);return String(Math.floor(seconds/60)).padStart(2,'0')+':'+String(seconds%60).padStart(2,'0');};
const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function fit(){hideTip();stage.style.setProperty('--battle-scale',String(Math.min(innerWidth/1600,innerHeight/900)));CardTouch.close();}
function cancelTimers(){clearTimeout(aiTimer);clearTimeout(finishTimer);aiTimer=finishTimer=null;generation++;busy=false;activeAction?.abort();activeAction=null;FX.haunt.exit(true);FX.clear();ZFX.clear();for(const aura of auras.values())aura.stop();auras.clear();}
function say(text){$('battle-message').textContent=text;}
function closeDialog(){
 dialog.close();dialogKind='';
 if(compact&&dialogOwner?.isConnected)(dialogOwner.closest('#arena-menu')?.querySelector('summary')||dialogOwner).focus({preventScroll:true});
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
  const options=M.roster.map((name,i)=>'<option value="'+i+'">'+escape(name)+(M.speed[i]===null?' · reação ao dano':'')+'</option>').join('');
  openDialog('setup','Escolha seu personagem','<label class="character-pick">Seu personagem<select id="owned-character">'+options+'</select></label><p>Você joga pela equipe azul. Três aliados e quatro adversários agem por conta própria.</p>',[{label:'Iniciar batalha',primary:true,run:()=>{
   if(!M.start(state,now(),Number($('owned-character').value)))return;
   window.Efeitos?.prepararSom();FX.unlock();if(state.cards.some(c=>c.skill==='protect'))ZFX.unlock();
   selected=state.playerId;closeDialog();render();schedule();
  }}]);
  const requested=M.roster.indexOf(new URLSearchParams(location.search).get('personagem'));
  if(requested>=0)$('owned-character').value=String(requested);
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
  button.disabled=!c.hp;
  ArenaArt.updateHealth(button,c);
  const speedLabel=button.querySelector('.placeholder-speed');if(speedLabel)speedLabel.textContent=c.speed+' VEL';
  const power=M.attackPower(state,c);
  button.querySelector('.printed-attack').textContent=power===null?'—':c.hits>1&&power===c.atk?c.baseAtk+'×'+c.hits:power;
 });
}
const supportById=id=>M.supportCards.find(card=>card.id===id);
let receiptUid=0,receiptTimer;
function finishOffer(){
 render();schedule();
}
function openSupport(index){
 const pending=M.pendingSupportReward(state);
 if(pending){if(M.claimSupportReward(state,pending.uid,now(),index))finishOffer();return;}
 const slot=state.supports.blue[index],card=slot&&supportById(slot.id);
 if(!card){note(supportSlots[index],'Espaço livre · você recebe um apoio ao completar a volta da fila.');return;}
 if(busy)return;
 const targets=M.supportTargets(state,index).filter(c=>!state.haunt||[state.haunt.owner,state.haunt.target].includes(c.id));
 const actions=targets.filter(c=>!M.supportReason(state,index,c.id)).map(c=>({
  label:'Usar em '+c.name,run:()=>{
   if(!checkTime())return;
   const move=zzusMove(()=>M.activateSupport(state,index,c.id,now())),result=move.result;if(!result)return;
   if(result.defeated&&state.haunt?.target===c.id){M.leaveHaunt(state,now());FX.haunt.exit(true);}
   closeDialog();finishMove(result.text,move);
  }
 }));
 const reason=actions.length?'':M.supportReason(state,index,targets[0]?.id)||'Nenhum alvo disponível.';
 openDialog('support',card.name,'<img class="support-preview" alt="" src="'+card.card+'"><p>'+escape(card.description)+'</p><p>'+escape(reason)+'</p>',actions);
}
const supportSlots=Array.from({length:M.SUPPORT_LIMIT},(_,index)=>{
 const button=document.createElement('button'),icon=document.createElement('img');
 icon.alt='';button.append(icon);button.type='button';button.onclick=()=>openSupport(index);
 $('support-hand').append(button);return button;
});
$('discard-support').onclick=()=>{
 const reward=M.pendingSupportReward(state);
 if(reward&&M.discardSupportReward(state,reward.uid,now()))finishOffer();
};
function renderHand(){
 const hand=state.supports.blue,offer=$('support-offer'),pending=M.pendingSupportReward(state);
 $('support-free').textContent=hand.filter(slot=>!slot||slot.status==='spent').length+'/'+M.SUPPORT_LIMIT;
 supportSlots.forEach((button,index)=>{
  const slot=hand[index],card=slot&&supportById(slot.id),src=card?.icon||'assets/arena/mao-vazia.png';
  if(button.firstChild.getAttribute('src')!==src)button.firstChild.src=src;
  button.dataset.status=slot?.status||'empty';
  button.setAttribute('aria-label',(pending?'Trocar ':'Apoio ')+(index+1)+' · '+(card?.name||'vazio'));
 });
 $('discard-support').hidden=!pending;
 const latest=state.supportRewards.at(-1);
 if(!latest){offer.hidden=true;receiptUid=0;clearTimeout(receiptTimer);return;}
 if(pending){
  offer.hidden=false;offer.firstElementChild.textContent=supportById(pending.id).name+' · Mão cheia. Clique no apoio que deseja trocar.';
 }else if(latest.claimed&&receiptUid!==latest.uid){
  receiptUid=latest.uid;clearTimeout(receiptTimer);offer.hidden=false;
  offer.firstElementChild.textContent='+ '+supportById(latest.id).name;
  receiptTimer=setTimeout(()=>{if(!M.pendingSupportReward(state))offer.hidden=true;},5000);
 }else if(latest.discarded)offer.hidden=true;
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
  face.innerHTML=(card&&ArenaArt.ribbon(card)?'<img class="q-art" src="'+ArenaArt.ribbon(card)+'" alt="">':card?'?':'')+'<span><small>'+labels[index]+'</small>'+(card?escape(card.name):'—')+'</span>';
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
function render(){hideTip();drawInfo();
 renderHand();
 for(const team of ['blue','red']){renderTeam(team);$('score-'+team).textContent=state.score[team];$('pips-'+team).innerHTML=Array.from({length:3},(_,i)=>'<i class="'+(i<state.score[team]?'filled':'')+'"></i>').join('');}
 syncTurnClock();
 $('red-alive').textContent=alive('red').length+'/4';
 $('round').textContent='RODADA '+state.round;$('pause').disabled=state.phase!=='active';$('pause').textContent=state.paused?'Retomar':'Pausar';document.body.classList.toggle('paused',state.paused);
 const current=M.current(state);
 renderQueue();syncAuras();
 const owner=player();
 $('owned-name').textContent=owner?.name||'—';
 $('action-hint').textContent=state.phase==='finished'?'Série encerrada.':state.paused?'Ações pausadas. O relógio continua.':busy?'Resolvendo ataque…':state.blockedTurn?state.blockedTurn:isAutomatic()?'O computador está escolhendo o alvo.':'Clique no oponente para escolher o alvo.';
 updateInspector();CardTouch.refresh();
 if(state.phase==='active')say(state.paused?'Ações pausadas.':state.blockedTurn?current.name+' · '+state.blockedTurn:busy?'Ataque em andamento…':(current.controller==='bot'?current.name+' · bot da equipe '+teamName(current.team):'Sua vez · '+current.name));
}
function abilityText(c){
 const p=M.deck[c.art];if(p.title)return p.title+' · '+p.description;
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
  portrait.classList.toggle('penxy-portrait',c.name==='Penxy'||!M.deck[c.art].portrait);
  portrait.innerHTML=art(c)?'<img src="'+art(c)+'" alt="'+escape(c.name)+'">':'<strong>?</strong>';
  panel.innerHTML='<h2>'+escape(c.name)+'</h2><div class="stat-life"><span class="damage-trail" aria-hidden="true"></span><i></i><strong></strong><small>PV</small><img src="'+('assets/player-panel-v048/heart.png')+'" alt="Vida"></div><div class="stat-def" aria-hidden="true"></div><div class="stat-detail"><b></b><img src="'+('assets/player-panel-v048/damage.png')+'" alt="Dano"><span>ATK</span></div><button id="inspect-selected">Detalhes</button>';
  $('inspect-selected').addEventListener('click',()=>inspect(player().id));
  ability.innerHTML=ArenaArt.emblem(c)+'<span>HABILIDADE</span>';
  ability.setAttribute('aria-label','Habilidade de '+c.name);
  ability.querySelector('span').textContent=M.deck[c.art].title||'HABILIDADE';
 }
 if(c.name==='Penxy'){
  const inside=state.haunt?.owner===c.id;
  ability.querySelector('span').textContent=inside?'SAIR DA MENTE':'ASSOMBRAÇÃO';
  ability.setAttribute('aria-label',inside?'Sair da mente':'Usar Assombração');
 }
 const life=panel.querySelector('.stat-life');
 if(ArenaArt.setMeterState(life,c))life.style.setProperty('--missing-hp',(100*ArenaArt.missingFraction(c))+'%');
 panel.querySelector('.stat-life strong').textContent=c.hp;
 panel.querySelector('.stat-detail b').textContent=M.attackPower(state,c)??'—';
 for(const el of document.querySelectorAll('[data-battle-card]'))el.classList.toggle('is-selected',el.dataset.battleCard===selected);
}
function inspect(id){
 const c=state.cards.find(c=>c.id===id);if(!c)return;
 selected=id;updateInspector();
 inform(c);
}
function lockAction(){
 CardTouch.close();clearTimeout(aiTimer);busy=true;syncTurnClock();
 activeAction=new AbortController();
 return activeAction.signal;
}
function finishAction(signal){
 if(signal.aborted)return;
 activeAction=null;busy=false;selected=state.playerId;render();syncBond();
 if(state.phase==='round-end'||state.phase==='finished')showResult();else schedule();
}
async function whenPlaying(signal){
 while(!signal.aborted&&(state.paused||dialog.open||document.hidden))await wait(60);
 return !signal.aborted;
}
async function changeHaunt(actor,target,controller){
 if(!checkTime()||busy||state.paused||dialog.open||state.phase!=='active'||actor!==M.current(state)||actor.controller!==controller)return;
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
 if(!checkTime()||busy||state.paused||dialog.open||state.phase!=='active')return false;
 const actor=M.current(state),victim=M.attackTarget(state,actor?.id,targetId,controller);
 if(!victim)return false;
 const target=cardElement(targetId),source=cardElement(actor.id),signal=lockAction();
 const visuals=fullEffects(),wasHaunted=!!state.haunt;
 let result=null,damageFx=Promise.resolve();
 target.classList.remove('tc-hit');
 function impact(){
  if(result||signal.aborted)return;
  const move=zzusMove(()=>M.attack(state,actor.id,targetId,now(),controller));
  result=move.result;
  if(!result)return;
  if(state.haunt&&state.haunt.owner===actor.id)state.haunt.exchanged=true;
  if(result.defeated)target.classList.add('falling');
  render();
  const transferred=move.received?.find(h=>h.target===targetId&&h.recipient!==targetId);
  const special=transferred||victim.skill==='protect';
  const effects=[presentZzus(move,signal)];
  if(visuals&&!special&&actor.skill!=='protect')effects.push(FX.damage(target,result.damage,{sound:actor.name!=='Penxy'}));
  damageFx=Promise.all(effects);
  say(transferred?'Meu Herói · Z-Zus recebeu '+transferred.damage+' de dano por '+victim.name:
      (result.defeated?'Eliminado! ':'')+'−'+result.damage+' PV em '+victim.name);
  return special?undefined:result.damage;
 }
 async function resolveAttack(){
  try{
   if(visuals&&actor.skill==='protect'){
    say('Pedrinha · Z-Zus → '+victim.name);
    await ZFX.pebble(source,target,{signal,beforeImpact:()=>whenPlaying(signal),onImpact:impact});
   }else if(visuals&&actor.name==='Penxy'){
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
    if(visuals&&victim.skill!=='protect')await FX.death(target);
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
function finishMove(text,move){
 if(move?.changed&&fullEffects()){
  const signal=lockAction();
  render();if(text)say(text);
  presentZzus(move,signal).catch(error=>console.warn('Efeito do Z-Zus',error)).finally(()=>finishAction(signal));
  return;
 }
 syncBond();
 CardTouch.close();render();if(text)say(text);
 if(state.phase==='active')schedule();else showResult();
}
function cast(actor,choice){
 if(!checkTime()||busy)return;
 const move=zzusMove(()=>M.useSkill(state,actor.id,choice.action,choice.target,now(),actor.controller));if(!move.result)return;
 if(!state.haunt&&FX.haunt.active)FX.haunt.exit(true);
 finishMove(choice.label,move);
}
function skillMenu(c){
 const choices=M.options(state,c,'player');
 if(!choices.length){inform(c);return;}
 openDialog('ability',M.deck[c.art].title||'Ações', '<p>'+escape(abilityText(c))+'</p>',choices.map(o=>({label:o.label,run:()=>{closeDialog();cast(c,o);}})));
}
function schedule(){
 clearTimeout(aiTimer);aiTimer=null;
 if(state.phase!=='active'||state.paused||busy||dialog.open||document.hidden||M.pendingSupportReward(state)||(!isAutomatic()&&!state.blockedTurn))return;
 const revision=state.revision,ticket=generation;
 aiTimer=setTimeout(()=>{
 if(ticket!==generation||revision!==state.revision||busy||state.paused||dialog.open||document.hidden)return;
 const actor=M.current(state),targets=alive(M.opposite(actor.team)).filter(c=>M.attackTarget(state,actor.id,c.id,'bot')).sort((a,b)=>a.hp-b.hp||a.slot-b.slot);
 const choices=M.options(state,actor,'bot');
 const choice=choices.find(o=>o.action==='rescue'&&state.cards.find(t=>t.id===o.target).team===actor.team)||choices.find(o=>o.action==='protect')

  ||choices.find(o=>o.action!=='heal'&&o.action!=='release'&&o.action!=='rescue'&&(!actor.link)&&(!actor.secondForm)&&(actor.skill!=='kick'||state.turnNumber%2))
  ||(!targets.length&&choices.find(o=>o.action==='release'));
 if(choice){cast(actor,choice);return;}
 if(!targets.length){const move=zzusMove(()=>M.pass(state,now()));if(move.result)finishMove(null,move);return;}
 // A bot uses the mind for one exchange, then returns to the normal turn queue.
 if(actor.name==='Penxy'&&state.haunt?.owner===actor.id&&state.last!==null&&state.haunt.exchanged){
  changeHaunt(actor,null,'bot');return;
 }
 const hauntTarget=targets.find(c=>c.skill!=='immune'&&c.speed!==null);
 if(actor.name==='Penxy'&&!state.haunt&&hauntTarget&&actor.hauntUsedOnTurn!==state.sequence){
  changeHaunt(actor,hauntTarget,'bot');return;
 }
 perform(targets[0].id,'bot');},3200);
}
function showResult(){const finished=state.phase==='finished',winner=state.roundWinner;openDialog('result',finished?'Equipe '+teamName(winner)+' vence a série!':state.draw?'Rodada empatada':'Ponto para a equipe '+teamName(winner),'<img class="match-emblem" src="'+('assets/menu-v036/trophy.webp')+'" alt=""><div class="result-score"><b>'+state.score.blue+'</b><span>×</span><b>'+state.score.red+'</b></div><p>'+ (finished?'Três vitórias conquistadas. Tempo final: <b>'+format(M.elapsed(state,now()))+'</b>.':state.draw?'As equipes voltam para a próxima rodada.':'Os quatro adversários foram eliminados. As duas equipes voltam com vida cheia na próxima rodada; o cronômetro continua.')+'</p>',[{label:finished?'Nova série':'Próxima rodada',primary:true,run:()=>{if(finished){restart();return;}dialog.close();dialogKind='';ZFX.clear();M.continueRound(state,now());manualPause=hiddenPause=false;selected=state.playerId||M.current(state).id;render();schedule();}},{label:'Exportar registro',run:exportState}]);say(finished?'Vitória final da equipe '+teamName(winner):'Rodada encerrada.');}
function exportState(){const data={version:'0.61.2',mode:'single-player',elapsedMs:M.elapsed(state,now()),...state};const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='goghos-batalha-0.61.2.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
function restart(){cancelTimers();CardTouch.close();dialog.close();state=M.create();inspectedId=null;manualPause=hiddenPause=false;selected=null;render();showSetup();}
function setPaused(){const value=manualPause||hiddenPause;if(state.phase==='active'){M.pause(state,value,now());CardTouch.close();clearTimeout(aiTimer);render();schedule();}}
CardTouch.init({inlineDetails:inform,selector:'[data-battle-card]',assets:'assets/card-touch-v044/',labels:{attack:'ATACAR'},getCard:el=>{const c=state.cards.find(c=>c.id===el.dataset.battleCard);return c&&{...c,ability:{name:'Habilidade de '+c.name,text:abilityText(c)}};},isAttackTurn:c=>state.phase==='active'&&!state.paused&&!busy&&!dialog.open&&!isAutomatic()&&!!M.attackTarget(state,M.current(state)?.id,c.id,'player'),canUseAbility:c=>player()?.name==='Penxy'?c.skill!=='immune'&&c.speed!==null&&(!state.haunt||state.haunt.owner===state.playerId):M.options(state,player(),'player').some(o=>o.target===c.id),abilityLabel:()=>state.haunt?.owner===state.playerId?'Sair da mente':'Habilidade',onAbility:c=>{if(player().name==='Penxy')changeHaunt(player(),c,'player');else {const chosen=M.options(state,player(),'player').filter(o=>o.target===c.id);if(chosen.length===1)cast(player(),chosen[0]);else skillMenu(player());}},onAttack:c=>perform(c.id)});
$('battle-field').addEventListener('click',e=>{const el=e.target.closest('[data-battle-card]');if(el){inspect(el.dataset.battleCard);}});
$('queue').addEventListener('click',e=>{const el=e.target.closest('[data-inspect]');if(el)inspect(el.dataset.inspect);});
document.querySelectorAll('[data-slot]').forEach(el=>el.addEventListener('click',()=>{
 const ability=el.dataset.slot==='ability',c=player();
 if(ability&&!c)return;
 if(ability&&c.name==='Penxy'&&M.current(state)===c&&!state.paused&&!busy&&state.phase==='active'){
  if(state.haunt?.owner===c.id){changeHaunt(c,null,'player');return;}
  if(!state.haunt){
   openDialog('ability','Assombração','<p>Escolha quem Penxy vai levar à mente. Para voltar à arena, toque em Sair da mente na sua vez.</p>',
    alive(M.opposite(c.team)).filter(t=>t.skill!=='immune'&&t.speed!==null&&M.attackTarget(state,c.id,t.id,'player')).map(target=>({label:target.name+' · '+target.hp+' PV',run:()=>{
     closeDialog();changeHaunt(c,target,'player');
    }})));return;
  }
 }
 if(ability&&M.options(state,c,'player').length){skillMenu(c);return;}
 const title=ability?'Habilidade de '+c.name:'Espaço de item';
 const text=ability?abilityText(c):'Nenhum item equipado.';
 if(compact){note(el,title+' · '+text);return;}
 openDialog('info',title,(ability?ArenaArt.emblem(c):'')+'<p>'+escape(text)+'</p>',
  [{label:'Voltar ao campo',run:closeDialog}]);
}));
$('pause').addEventListener('click',()=>{manualPause=!manualPause;setPaused();});
$('restart').addEventListener('click',()=>{openDialog('confirm','Reiniciar a série?','<p>O placar, as equipes e o cronômetro desta sessão serão restaurados.</p>',[{label:'Continuar jogando',run:closeDialog},{label:'Reiniciar',primary:true,run:restart}]);});
$('motion').addEventListener('click',()=>{reduced=!reduced;FX.setReducedMotion(reduced);ZFX.setReducedMotion(reduced);if(reduced)ZFX.clear();syncBond();syncAuras();if(reduced)FX.haunt.exit(true);document.body.classList.toggle('reduced',reduced);$('motion').setAttribute('aria-pressed',String(reduced));$('motion').textContent=reduced?'Efeitos reduzidos':'Efeitos';});
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
const turnTimer=document.createElement('span');
turnTimer.id='turn-time';
turnTimer.setAttribute('role','timer');
let clockTurn=-1,remaining=25000,lastTick=0,ticking=false;
function syncTurnClock(){
 const t=now();
 if(clockTurn!==state.turnNumber){clockTurn=state.turnNumber;remaining=25000;}
 else if(ticking)remaining=Math.max(0,remaining-(t-lastTick));
 lastTick=t;ticking=state.phase==='active'&&!state.paused&&!busy&&!document.hidden&&!M.pendingSupportReward(state);
 const actor=state.phase==='active'&&!busy&&M.current(state);
 const card=actor?.hp?cardElement(actor.id):null;
 if(turnTimer.parentElement!==card){
  turnTimer.parentElement?.removeAttribute('aria-describedby');
  if(card){
   card.append(turnTimer);
   card.setAttribute('aria-describedby',turnTimer.id);
  }else turnTimer.remove();
 }
 if(card){
  const label=Math.ceil(remaining/1000)+' s';
  if(turnTimer.textContent!==label)turnTimer.textContent=label;
  const description='Tempo para '+actor.name+' agir: '+label;
  if(turnTimer.getAttribute('aria-label')!==description)turnTimer.setAttribute('aria-label',description);
  turnTimer.classList.toggle('urgent',remaining<=5000);
 }
}
function checkTime(){
 syncTurnClock();
 if(!ticking||remaining>0)return true;
 const move=zzusMove(()=>M.pass(state,now()));
 if(move.result){
  CardTouch.close();if(dialog.open)closeDialog();finishMove(null,move);
 }
 return false;
}
setInterval(()=>{$('clock').textContent=format(M.elapsed(state,now()));checkTime();},150);
const menu=$('arena-menu');
document.addEventListener('pointerdown',e=>{if(!menu.contains(e.target))menu.open=false;});
menu.addEventListener('click',e=>{if(e.target.closest('button'))menu.open=false;});
document.addEventListener('keydown',e=>{if(e.key==='Escape'){if(menu.open)menu.querySelector('summary').focus();menu.open=false;closeInfo();}});
window.GoghosBattle=Object.freeze({snapshot:()=>JSON.parse(JSON.stringify({...state,elapsedMs:M.elapsed(state,now()),control:'single-player',busy})),destroy(){cancelTimers();CardTouch.destroy();}});
fit();document.body.classList.toggle('reduced',reduced);$('motion').setAttribute('aria-pressed',String(reduced));render();showSetup();
})();
