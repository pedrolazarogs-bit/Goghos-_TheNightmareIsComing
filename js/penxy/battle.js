// Desktop 4×4 battle model.
(function(root){
'use strict';
const rules=typeof module!=='undefined'&&module.exports?require('../lab/battle'):root.GoghosBattleLab;
const buildDeck=typeof module!=='undefined'&&module.exports?require('./profiles'):root.GoghosProfileDeck;
const deck=buildDeck(rules.characters),roster=deck.map(c=>c.name),speed=deck.map(c=>c.speed);
const SUPPORT_LIMIT=3;
const opposite=team=>team==='blue'?'red':'blue';
function record(s,type,text,now){s.events.unshift({index:++s.sequence,type,text,ms:elapsed(s,now)});s.events.length=Math.min(s.events.length,1000);}
function elapsed(s,now){return s.startedAt===null?0:Math.max(0,(s.endedAt??now)-s.startedAt);}
function current(s){return s.cards.find(c=>c.id===s.order[s.cursor])||null;}
function next(s){if(s.phase!=='active')return null;
 if(s.haunt){const {owner,target}=s.haunt;return s.cards.find(c=>c.id===(current(s).id===owner?target:owner));}
 const living=s.order.filter(id=>s.cards.find(c=>c.id===id).hp>0);
 const id=living.find(id=>id!==current(s).id&&!s.speedActed.includes(id))||living[0];
 return s.cards.find(c=>c.id===id)||null;
}
function advance(s,now){
 const actor=current(s);
 tickEffects(s,now);
 if(settleRound(s,now))return;
 s.turnNumber++;
 if(s.haunt){
  if(!s.speedActed.includes(actor.id))s.speedActed.push(actor.id);
  s.cursor=s.order.indexOf(next(s).id);
 }else{
  sortQueue(s,actor.id);
  rules.advance(s,now);
 }
 beginTurn(s,now);
}
function pass(s,now){
 if(s.phase!=='active'||s.paused||rules.pendingSupportReward(s)||!Number.isFinite(now))return false;
 record(s,'tempo',current(s).name+' passou a vez.',now);
 advance(s,now);s.revision++;return true;
}
function sortQueue(s,keep){
 const first=s.round%2?'blue':'red';
 const sorted=s.cards.filter(c=>c.speed!==null).sort((a,b)=>effectiveSpeed(b)-effectiveSpeed(a)||
   Number(a.team!==first)-Number(b.team!==first)||a.slot-b.slot);
 for(const hunter of sorted.filter(c=>c.hp&&c.skill==='hunt'&&c.link)){
  const target=sorted.findIndex(c=>c.id===hunter.link&&c.hp);
  const from=sorted.indexOf(hunter);
  if(target>=0&&target<from){sorted.splice(from,1);sorted.splice(target,0,hunter);}
 }
 s.order=sorted.map(c=>c.id);s.cursor=Math.max(0,s.order.indexOf(keep));
}
function setupRound(s){
 s.haunt=null;
 s.cards=['blue','red'].flatMap(team=>s.lineups[team].map((art,i)=>{
  const c=deck[art],id=team+'-'+i;
  const baseAtk=c.baseAtk??(c.skill==='sharpen'?120:null);
  return {id,team,slot:i,art,name:c.name,role:c.role,skill:c.skill,speed:c.speed,hp:c.maxHp,maxHp:c.maxHp,
   baseAtk,hits:c.hits,atk:baseAtk===null?null:baseAtk*c.hits,status:[],souls:0,
   controller:s.singlePlayer?(id===s.playerId?'player':'bot'):null};
 }));
 sortQueue(s);s.lastStrike=[];s.blockedTurn='';s.draw=false;
 s.speedActed=[];s.speedCycle=1;s.turnNumber++;s.cursor=0;s.last=null;s.roundWinner=null;s.phase='active';s.paused=false;s.revision++;
}
function create(singlePlayer=true){return {...rules.create({seed:Math.floor(Math.random()*4294967296)}),singlePlayer,turnNumber:0,haunt:null};}
function start(s,now,choice){
 if(s.phase!=='ready'||!Number.isFinite(now))return false;
 let lineups=choice||s.lineups;
 if(s.singlePlayer){
  if(!Number.isInteger(choice)||choice<0||choice>=roster.length)return false;
  const pool=roster.map((_,index)=>index).filter(index=>index!==choice);
  const bots=Array.from({length:7},()=>{
   const index=Math.floor(Math.random()*pool.length);
   return pool.splice(index,1)[0];
  });
  lineups={blue:[choice,...bots.slice(0,3)],red:bots.slice(3)};
  s.playerId='blue-0';
 }
 for(const team of ['blue','red'])if(!Array.isArray(lineups[team])||lineups[team].length!==4||new Set(lineups[team]).size!==4||lineups[team].some(n=>!Number.isInteger(n)||n<0||n>=roster.length))return false;
 s.lineups={blue:[...lineups.blue],red:[...lineups.red]};s.startedAt=now;setupRound(s);beginTurn(s,now);record(s,'início','Série iniciada: vence quem alcançar 3 pontos.',now);return true;
}
function participant(s,c){return !!c&&(!s.haunt||[s.haunt.owner,s.haunt.target].includes(c.id));}
function canAct(s,actor,id,controller){
 return s.phase==='active'&&!s.paused&&!rules.pendingSupportReward(s)&&actor&&actor.id===id&&actor.hp>0&&
  !s.blockedTurn&&(!s.singlePlayer||actor.controller===controller);
}
function effectiveSpeed(c){return c.speed===null?null:Math.min(9,c.speed+(c.starSpeed||0))+(c.status.find(e=>e.type==='slow')?.speedDelta||0);}
function visibleTo(actor,target){return target.skill!=='aim'||actor.skill==='immune'||effectiveSpeed(actor)<=effectiveSpeed(target);}
function attackTarget(s,actorId,targetId,controller){
 const actor=current(s),target=byId(s,targetId);
 if(!canAct(s,actor,actorId,controller)||!target?.hp||target.team===actor.team||!participant(s,target))return null;
 if(actor.link&&['hypnosis','guitar'].includes(actor.skill))return null;
 if(actor.atk===null)return null;
 return visibleTo(actor,target)?target:null;
}
function hauntTarget(s,actorId,targetId,controller){
 const target=attackTarget(s,actorId,targetId,controller);
 return !s.haunt&&current(s)?.name==='Penxy'&&target&&target.skill!=='immune'&&target.speed!==null?target:null;
}
function enterHaunt(s,actorId,targetId,controller,now){
 const actor=current(s),target=hauntTarget(s,actorId,targetId,controller);
 if(!target)return false;
 s.haunt={owner:actor.id,target:target.id};
 target.status.push({type:'slow',name:'Assombração',value:'−1 VEL',speedDelta:-1});s.revision++;
 record(s,'habilidade',actor.name+' levou '+target.name+' à mente (−1 VEL).',now);
 return true;
}
function leaveHaunt(s,now){
 if(!s.haunt)return false;
 const target=s.cards.find(c=>c.id===s.haunt.target);
 target.status=target.status.filter(status=>status.name!=='Assombração');
 s.haunt=null;s.revision++;record(s,'habilidade','Fim da Assombração.',now);
 return true;
}
const byId=(s,id)=>s.cards.find(c=>c.id===id);
const living=s=>s.cards.filter(c=>c.hp>0);
const die=()=>1+Math.floor(Math.random()*6);
function roll(s,c,now,n=die()){record(s,'dado',c.name+' tirou '+n+' no d6.',now);return n;}
function setStatus(c,type,source,name,turns,value){
 c.status=c.status.filter(e=>e.type!==type||e.source!==source);
 c.status.push({type,source,name,turns,value});
}
function allyWith(s,c,skill){return living(s).find(a=>a!==c&&a.team===c.team&&a.skill===skill);}
function attackPower(s,c){
 const base=rules.attackPower(s,c);
 return base===null?null:base+(c.starDamage||0)+(allyWith(s,c,'oni')&&c.skill!=='immune'?20:0);
}
function wearLevel(hp){return hp>=180?1:hp>=100?2:3;}
function updateWear(c){
 if(c.skill==='wear'){const level=wearLevel(c.hp);c.speed=[7,4,2][level-1];c.atk=[300,190,70][level-1];}
}
function heal(c,n){if(c.hp){c.hp=Math.min(c.maxHp,c.hp+n);updateWear(c);}}
function settleRound(s,now){
 if(s.phase!=='active')return true;
 const blue=living(s).some(c=>c.team==='blue'),red=living(s).some(c=>c.team==='red');
 if(blue&&red&&living(s).some(c=>c.speed!==null))return false;
 s.draw=blue===red;s.roundWinner=s.draw?null:(blue?'blue':'red');
 s.phase='round-end';
 if(s.haunt)leaveHaunt(s,now);
 if(s.draw){record(s,'empate','Rodada empatada.',now);return true;}
 const team=s.roundWinner;s.score[team]++;record(s,'ponto','Ponto para '+team+'.',now);
 if(s.score[team]===3){s.winner=team;s.endedAt=now;s.phase='finished';record(s,'fim','Série encerrada.',now);}
 return true;
}
function survivesFatal(s,c){
 return c.skill!=='immune'&&(c.lease||allyWith(s,c,'immortal')||allyWith(s,c,'oni'));
}
function eliminate(s,victim,source,now,expiry=false){
 if(!victim.hp)return;
 if(!expiry&&survivesFatal(s,victim)){
  if(!victim.lease&&!allyWith(s,victim,'immortal'))victim.lease=s.turnNumber+2;
  victim.hp=1;return;
 }
 victim.hp=0;victim.link=null;
 if(s.haunt&&participant(s,victim))leaveHaunt(s,now);
 for(const c of living(s)){
  if(c.link===victim.id)c.link=null;
  if(c.skill==='soul'&&c.souls<5){c.souls++;c.maxHp+=30;heal(c,30);}
  c.status=c.status.filter(e=>!(e.source===victim.id&&['stone','guitar','hypnosis','book'].includes(e.type)));
 }
 record(s,'eliminação',victim.name+' foi eliminado.',now);
 if(victim.skill==='shark'&&source?.hp&&source.team!==victim.team&&source.skill!=='immune'&&roll(s,victim,now)<=2)
  eliminate(s,source,victim,now);
}
// Capture resolved recipients only for the action being presented, including area and end-of-turn damage.
const hitCollectors=new WeakMap();
function resolveHits(s,action){
 const hits=[];hitCollectors.set(s,hits);
 try{return {result:action(),hits};}finally{hitCollectors.delete(s);}
}
function recipient(s,target){
 return (target.skill!=='immune'&&living(s).find(c=>c.skill==='protect'&&c.link===target.id&&participant(s,c)))||target;
}
// Roll before playback so the katana animation and the impact share one result.
function prepareKatana(s,actor,target){
 if(actor.skill!=='katana'||target.skill==='immune')return null;
 const face=die(),victim=recipient(s,target);
 return {face,recipient:victim.id,brutal:face===6&&!survivesFatal(s,victim)};
}
function finishStrike(s,recipients,now){
 for(const id of recipients){
  const c=byId(s,id);
  if(c.skill==='book'&&c.hp&&s.lastStrike.includes(id))eliminate(s,c,c,now);
 }
 s.lastStrike=[...recipients];
}
function hit(s,source,target,amount,now,{basic=false,execution=false,react=true,burn=false,strike}={}){
 if(!target.hp)return 0;
 const victim=recipient(s,target);
 const before=victim.hp;
 let damage=execution?before:Math.max(0,amount);
 if(basic){
  const strike={...source,atk:amount+(source.starDamage||0)+(allyWith(s,source,'oni')&&source.skill!=='immune'?20:0)};
  damage=rules.resolveDamage(s,strike,victim).damage;
 }
 if(damage>=before)eliminate(s,victim,source,now);
 else victim.hp-=damage;
 const lost=before-victim.hp;
 if(damage>0)strike?.add(victim.id);
 const event={target:target.id,recipient:victim.id,damage:lost,source:source?.id,burn};
 hitCollectors.get(s)?.push(event);
 updateWear(victim);
 if(react&&damage>0&&source?.team!==victim.team&&source?.hp&&source.skill!=='immune'){
  if(victim.skill==='scare'&&victim.hp){event.reaction='jumpscare';eliminate(s,source,victim,now);event.shattered=!source.hp;}
  if(victim.skill==='fire'&&basic&&!burn){
   event.reaction='revide';setStatus(source,'burn',victim.id,'Queimadura',3,35);
   source.status.at(-1).start=s.turnNumber;
  }
 }
 return before-victim.hp;
}
function tickEffects(s,now){
 for(const c of living(s)){
  if(c.reserveHp!==undefined)c.reserveHp=Math.min(c.maxHp,c.reserveHp+15);
  for(const e of [...c.status]){
   if(!c.hp)break;
   if(e.start!==s.turnNumber&&(e.type==='guitar'||e.type==='burn')){
    const strike=e.firstAttack?new Set():null;
    hit(s,byId(s,e.source),c,e.value,now,{burn:e.type==='burn',basic:!!e.firstAttack,strike});
    if(strike)finishStrike(s,strike,now);
    e.firstAttack=false;
   }
   if(Number.isInteger(e.turns)&&e.start!==s.turnNumber&&--e.turns===0)c.status=c.status.filter(x=>x!==e);
  }
  if(c.hp&&c.lease&&s.turnNumber>=c.lease){delete c.lease;if(!allyWith(s,c,'immortal'))eliminate(s,c,null,now,true);}
 }
}
function beginTurn(s,now){
 let c=current(s);s.blockedTurn='';
 for(const target of living(s)){
  const e=target.status.find(e=>['book','stone'].includes(e.type)&&e.source===c.id);
  if(e){target.status=target.status.filter(x=>x!==e);hit(s,c,target,target.hp,now,{execution:true});}
 }
 if(settleRound(s,now))return;
 if(!c.hp){advance(s,now);return;}
 const sleep=c.status.find(e=>e.type==='sleep');
 if(sleep&&roll(s,c,now)<=2)c.status=c.status.filter(e=>e!==sleep);
 const blocked=c.status.find(e=>['stone','hypnosis','sleep','stun'].includes(e.type));
 if(blocked){s.blockedTurn=blocked.name;record(s,'controle',c.name+' · '+blocked.name,now);}
}
const sharpenFraction=0.45;
function prepareCombo(actor,target){
 if(actor.skill!=='combo'||target.skill==='immune')return null;
 const faces=[],seen=new Set();
 while(true){
  const face=die();faces.push(face);
  if(seen.has(face))return faces;
  seen.add(face);
 }
}
function attack(s,actorId,targetId,now,controller='player',katana,combo){
 const actor=current(s),target=attackTarget(s,actorId,targetId,controller);
 if(!target||!Number.isFinite(now))return null;
 const before=target.hp,strike=new Set();
 let total=actor.atk;
 const immune=target.skill==='immune';
 if(actor.skill==='combo'){
  total=actor.baseAtk;
  if(!immune){
   const faces=combo||prepareCombo(actor,target);
   for(const face of faces)roll(s,actor,now,face);
   const hits=faces.length-1;
   total*=hits;record(s,'combo',hits+' de 6 golpes.',now);
  }
 }
 let execute=false;
 if(!immune&&actor.skill==='katana'){
  const n=roll(s,actor,now,katana?.face);execute=n===6;total=execute?target.hp:Math.round(45+(n-1)*175/4);
 }
 if(!immune&&actor.skill==='sharpen')total=Math.round(target.maxHp*sharpenFraction);
 if(!immune&&actor.skill==='hunt'&&actor.link===target.id)total=220;
 if(actor.skill==='fire'&&!immune){
  setStatus(target,'burn',actor.id,'Queimadura',6,actor.baseAtk);
  Object.assign(target.status.at(-1),{start:s.turnNumber,firstAttack:true});
 }
 else if(total>0)hit(s,actor,target,total,now,{basic:!execute,execution:execute,strike});
 if(actor.skill==='electric'||actor.skill==='air'){
  const line=living(s).filter(c=>c.team===target.team&&participant(s,c)).sort((a,b)=>a.slot-b.slot);
  const neighbors=[line.filter(c=>c.slot<target.slot).at(-1),line.find(c=>c.slot>target.slot)];
  const others=actor.skill==='air'?neighbors:line;
  for(const other of others)if(other&&other!==target&&other.skill!=='immune'&&visibleTo(actor,other))hit(s,actor,other,actor.skill==='air'?50:actor.atk,now,{basic:true,strike});
 }
 const fireball=actor.skill==='fire'&&!immune;
 if(!fireball)finishStrike(s,strike,now);
 s.last=actor.id;s.revision++;
 const damage=Math.max(0,before-target.hp);
 const outcome=fireball?'Queimadura: 6 pulsos de '+actor.baseAtk+'.':damage+' PV.';
 record(s,'ataque',actor.name+' → '+target.name+' · '+outcome,now);
 if(!settleRound(s,now))advance(s,now);
 return {actor:actor.id,target:target.id,damage,defeated:!target.hp,roundWinner:s.roundWinner,winner:s.winner};
}
function options(s,c,controller){
 if(!canAct(s,current(s),c?.id,controller))return [];
 const out=[],available=living(s).filter(t=>participant(s,t)),foes=available.filter(t=>t.team!==c.team&&t.skill!=='immune'&&visibleTo(c,t));
 const add=(action,t,label)=>out.push({action,target:t.id,label});
 for(const t of available.filter(t=>!(c.skill==='hypnosis'&&c.link)&&t.id!==c.id&&t.status.some(e=>e.type==='stone'&&(t.team===c.team||byId(s,e.source)?.team===c.team&&e.source!==c.id))))add('rescue',t,'Libertar '+t.name);
 const self=(action,label)=>add(action,c,label);
 if(c.skill==='celestial')for(const t of available.filter(t=>t.team===c.team&&t!==c&&t.skill!=='immune'))add('celestial',t,'Estrela Celeste em '+t.name);
 if(c.skill==='protect'&&!c.link)for(const t of available.filter(t=>t.team===c.team&&t!==c&&t.skill!=='immune'))add('protect',t,'Proteger '+t.name);
 if(c.skill==='switch')self('switch',c.secondForm?'Voltar à primeira forma':'Ativar Player 2');
 if(c.link&&['hypnosis','guitar','hunt'].includes(c.skill))self('release',c.skill==='guitar'?'Recuperar guitarra':'Encerrar '+deck[c.art].title);
 if(c.skill==='heal')for(const t of foes.filter(t=>t.hp<t.maxHp))add('heal',t,'Curar '+t.name);
 const labels={stone:'Petrificar',book:'Marcar',hunt:'Caçar',sleep:'Adormecer',guitar:'Cravar guitarra em',hypnosis:'Hipnotizar',kick:'Voadora em',fish:'Cardume em'};
 if(labels[c.skill]&&!(c.link&&['book','guitar','stone'].includes(c.skill)))for(const t of foes.filter(t=>t.id!==c.link))add(c.skill,t,labels[c.skill]+' '+t.name);
 return out;
}
function unlink(s,c){
 for(const t of s.cards)t.status=t.status.filter(e=>!(e.source===c.id&&['hypnosis','guitar'].includes(e.type)));
 c.link=null;
}
function useSkill(s,id,action,targetId,now,controller='player'){
 const c=current(s);
 if(c?.id!==id||!Number.isFinite(now)||!options(s,c,controller).some(o=>o.action===action&&o.target===targetId))return false;
 const t=byId(s,targetId);
 switch(action){
 case 'rescue': if(roll(s,c,now)<=3)t.status=t.status.filter(e=>e.type!=='stone');break;
 case 'celestial':
  t.maxHp+=90;heal(t,90);
  if(t.atk!==null)t.starDamage=(t.starDamage||0)+35;
  if(t.speed!==null&&effectiveSpeed(t)<9)t.starSpeed=(t.starSpeed||0)+1;
  setStatus(t,'celestial',id,'Estrela Celeste');break;
 case 'heal': heal(t,c.baseAtk);break;
 case 'switch': {
  const outgoing=c.hp;
  c.hp=c.reserveHp??outgoing;
  c.reserveHp=outgoing;c.secondForm=!c.secondForm;
  break;
 }
 case 'release': unlink(s,c);break;
 case 'protect': case 'hunt': c.link=t.id;break;
 case 'book': setStatus(t,'book',id,'Escrita Mortal');break;
 case 'stone': if(roll(s,c,now)<=3)setStatus(t,'stone',id,'Petrificado');break;
 case 'sleep': setStatus(t,'sleep',id,'Dormindo');break;
 case 'hypnosis': unlink(s,c);c.link=t.id;setStatus(t,'hypnosis',id,'Hipnotizado');break;
 case 'guitar': c.link=t.id;setStatus(t,'guitar',id,'Guitarra',null,40);break;
 case 'kick': case 'fish': {
  const strike=new Set();
  hit(s,c,t,c.atk+(action==='kick'?40:0),now,{basic:true,strike});
  finishStrike(s,strike,now);
  if(action==='kick'&&t.hp&&roll(s,c,now)<=2){
   setStatus(t,'stun',id,'Atordoado',2);t.status.at(-1).start=s.turnNumber;
  }
  break;
 }
 default:return false;
 }
 s.revision++;record(s,'habilidade',c.name+' · '+(action==='rescue'?'Libertar aliado':deck[c.art].title)+' · '+t.name,now);
 if(!settleRound(s,now))advance(s,now);return true;
}
function supportReason(s,i,id){
 if(id&&!participant(s,byId(s,id)))return 'O alvo está fora do duelo.';
 return s.blockedTurn||((current(s)?.skill==='hypnosis'&&current(s).link)?'Hipnose ativa.':'')||rules.supportReason(s,i,id);}
function activateSupport(s,i,id,now){
 if(supportReason(s,i,id)||!participant(s,byId(s,id)))return null;
 const result=rules.activateSupport(s,i,id,now,(target,owner,result)=>{
  if(target.skill==='immune'){result.damage=0;result.defeated=false;}
  else{result.damage=hit(s,owner,target,target.hp,now,{execution:true});result.defeated=!target.hp;}
  settleRound(s,now);result.roundWinner=s.roundWinner;result.winner=s.winner;
 });
 if(result){updateWear(byId(s,id));if(!current(s)?.hp&&s.phase==='active')advance(s,now);}
 return result;
}
function continueRound(s,now){if(s.phase!=='round-end')return false;s.round++;setupRound(s);beginTurn(s,now);record(s,'rodada','Rodada '+s.round+' iniciada. Equipes restauradas.',now);return true;}
function pause(s,value,now){if(s.phase!=='active')return false;s.paused=!!value;s.revision++;record(s,'pausa',value?'Ações pausadas; cronômetro continua.':'Ações retomadas.',now);return true;}
const api=Object.freeze({...rules,deck,roster,speed,effectiveSpeed,hauntTarget,prepareKatana,prepareCombo,sharpenFraction,wearLevel,resolveHits,attackPower,activateSupport,supportReason,options,useSkill,pass,SUPPORT_LIMIT,create,start,current,next,attackTarget,enterHaunt,leaveHaunt,attack,continueRound,pause,elapsed,opposite});
if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.GoghosBattleLab=api;
})(globalThis);
