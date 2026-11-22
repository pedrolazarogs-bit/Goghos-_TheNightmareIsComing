// Isolated 4x4 series model. No DOM, game imports, persistence or character skills.
(function(root){
'use strict';
const roster=Object.freeze(['Unicorn','Sam','Sarck','Nully','Mike','Penxy']);
const rules=typeof module!=='undefined'&&module.exports?require('../lab/battle'):root.GoghosBattleLab;
const speed=roster.map(name=>rules.characters.find(c=>c.name.toLowerCase()===name.toLowerCase()).speed);
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
 s.turnNumber++;
 if(s.haunt){
  if(!s.speedActed.includes(current(s).id))s.speedActed.push(current(s).id);
  s.cursor=s.order.indexOf(next(s).id);
 }else rules.advance(s,now);
}
function pass(s,now){
 if(s.phase!=='active'||s.paused||rules.pendingSupportReward(s))return false;
 record(s,'tempo',current(s).name+' passou a vez ao esgotar 25 s.',now);
 advance(s,now);s.revision++;return true;
}
function setupRound(s){
 s.haunt=null;
 s.cards=['blue','red'].flatMap(team=>s.lineups[team].map((art,i)=>({id:team+'-'+i,team,slot:i,art,controller:s.singlePlayer?(team+'-'+i===s.playerId?'player':'bot'):null,name:roster[art],speed:speed[art],hp:roster[art]==='Penxy'?500:100,maxHp:roster[art]==='Penxy'?500:100,atk:roster[art]==='Penxy'?140:25,status:[],ability:null})));
 const first=s.round%2?'blue':'red',second=opposite(first);
 s.order=Array.from({length:4},(_,i)=>[first+'-'+i,second+'-'+i]).flat();s.order.sort((a,b)=>s.cards.find(c=>c.id===b).speed-s.cards.find(c=>c.id===a).speed ||
  Number(!a.startsWith(first))-Number(!b.startsWith(first)));
 s.speedActed=[];s.speedCycle=1;s.turnNumber++;s.cursor=0;s.last=null;s.roundWinner=null;s.phase='active';s.paused=false;s.revision++;
}
function create(singlePlayer=true){return {...rules.create({seed:Math.floor(Math.random()*4294967296)}),singlePlayer,turnNumber:0,haunt:null};}
function start(s,now,choice){
 if(s.phase!=='ready'||!Number.isFinite(now))return false;
 let lineups=choice||s.lineups;
 if(s.singlePlayer){
  if(!Number.isInteger(choice)||choice<0||choice>=roster.length||speed[choice]===null)return false;
  const eligible=roster.map((_,i)=>(choice+i)%roster.length).filter(i=>speed[i]!==null);
  const teamFrom=offset=>Array.from({length:4},(_,i)=>eligible[(offset+i)%eligible.length]);
  lineups={blue:teamFrom(0),red:teamFrom(1)};
  s.playerId='blue-0';
 }
 for(const team of ['blue','red'])if(!Array.isArray(lineups[team])||lineups[team].length!==4||new Set(lineups[team]).size!==4||lineups[team].some(n=>!Number.isInteger(n)||n<0||n>=roster.length))return false;
 s.lineups={blue:[...lineups.blue],red:[...lineups.red]};s.startedAt=now;setupRound(s);record(s,'início','Série iniciada: vence quem alcançar 3 pontos.',now);return true;
}
function attackTarget(s,actorId,targetId,controller){
 const actor=current(s),target=s.cards.find(c=>c.id===targetId);
 if(s.phase!=='active'||s.paused||rules.pendingSupportReward(s)||!actor||actor.id!==actorId||actor.hp<=0||!target||target.hp<=0||target.team===actor.team)return null;
 if(s.haunt && ![s.haunt.owner,s.haunt.target].includes(target.id))return null;
 return s.singlePlayer&&actor.controller!==controller?null:target;
}
function enterHaunt(s,actorId,targetId,controller,now){
 const actor=current(s),target=attackTarget(s,actorId,targetId,controller);
 if(s.haunt||!target||actor.name!=='Penxy')return false;
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
function attack(s,actorId,targetId,now,controller='player'){
 const actor=current(s),target=attackTarget(s,actorId,targetId,controller);
 if(!target||!Number.isFinite(now))return null;
 const {damage}=rules.resolveDamage(s,actor,target);target.hp-=damage;s.last=actor.id;s.revision++;
 const result={actor:actor.id,target:target.id,damage,defeated:target.hp===0,roundWinner:null,winner:null};
 record(s,'ataque',actor.name+' ('+actor.team+') → '+target.name+': −'+damage+' PV'+(result.defeated?' · eliminado':''),now);
 if(result.defeated&&s.haunt)leaveHaunt(s,now);
 if(s.cards.filter(c=>c.team===target.team).every(c=>c.hp===0)){
  s.roundWinner=actor.team;s.score[actor.team]++;result.roundWinner=actor.team;s.phase='round-end';
  record(s,'ponto',(actor.team==='blue'?'Azul':'Vermelho')+' vence a rodada '+s.round+'. Placar '+s.score.blue+' × '+s.score.red+'.',now);
  if(s.score[actor.team]===3){s.winner=actor.team;s.endedAt=now;s.phase='finished';result.winner=actor.team;record(s,'fim','Série encerrada.',now);}
 }else advance(s,now);
 return result;
}
function continueRound(s,now){if(s.phase!=='round-end')return false;s.round++;setupRound(s);record(s,'rodada','Rodada '+s.round+' iniciada. Equipes restauradas.',now);return true;}
function pause(s,value,now){if(s.phase!=='active')return false;s.paused=!!value;s.revision++;record(s,'pausa',value?'Ações pausadas; cronômetro continua.':'Ações retomadas.',now);return true;}
const api=Object.freeze({...rules,roster,speed,pass,SUPPORT_LIMIT,create,start,current,next,attackTarget,enterHaunt,leaveHaunt,attack,continueRound,pause,elapsed,opposite});
if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.GoghosBattleLab=api;
})(globalThis);
