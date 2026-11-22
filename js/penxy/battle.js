// Isolated 4x4 series model. No DOM, game imports, persistence or character skills.
(function(root){
'use strict';
const roster=Object.freeze(['Unicorn','Sam','Sarck','Nully','Mike','Penxy']);
const SUPPORT_LIMIT=3;
const opposite=team=>team==='blue'?'red':'blue';
function record(s,type,text,now){s.events.unshift({index:++s.sequence,type,text,ms:elapsed(s,now)});s.events.length=Math.min(s.events.length,1000);}
function elapsed(s,now){return s.startedAt===null?0:Math.max(0,(s.endedAt??now)-s.startedAt);}
function current(s){return s.cards.find(c=>c.id===s.order[s.cursor])||null;}
function next(s){if(s.phase!=='active')return null;
 if(s.haunt){const {owner,target}=s.haunt;return s.cards.find(c=>c.id===(current(s).id===owner?target:owner));}
 for(let n=1;n<=s.order.length;n++){const c=s.cards.find(c=>c.id===s.order[(s.cursor+n)%s.order.length]);if(c?.hp>0)return c;}return null;}
function setupRound(s){
 s.haunt=null;
 s.cards=['blue','red'].flatMap(team=>s.lineups[team].map((art,i)=>({id:team+'-'+i,team,slot:i,art,controller:s.singlePlayer?(team+'-'+i===s.playerId?'player':'bot'):null,name:roster[art],hp:roster[art]==='Penxy'?500:100,maxHp:roster[art]==='Penxy'?500:100,atk:roster[art]==='Penxy'?140:25,status:[],ability:null})));
 const first=s.round%2?'blue':'red',second=opposite(first);
 s.order=Array.from({length:4},(_,i)=>[first+'-'+i,second+'-'+i]).flat();s.cursor=0;s.last=null;s.roundWinner=null;s.phase='active';s.paused=false;s.revision++;
}
function create(singlePlayer=true){return {singlePlayer,playerId:null,phase:'ready',round:1,score:{blue:0,red:0},lineups:{blue:[0,1,2,3],red:[3,2,1,4]},cards:[],order:[],cursor:0,last:null,roundWinner:null,winner:null,startedAt:null,endedAt:null,paused:false,revision:0,sequence:0,events:[],supports:{blue:Object.seal(Array(SUPPORT_LIMIT).fill(null)),red:Object.seal(Array(SUPPORT_LIMIT).fill(null))}};}
function start(s,now,choice){
 if(s.phase!=='ready'||!Number.isFinite(now))return false;
 let lineups=choice||s.lineups;
 if(s.singlePlayer){
  if(!Number.isInteger(choice)||choice<0||choice>=roster.length)return false;
  const teamFrom=offset=>Array.from({length:4},(_,i)=>(choice+offset+i)%roster.length);
  lineups={blue:teamFrom(0),red:teamFrom(1)};
  s.playerId='blue-0';
 }
 for(const team of ['blue','red'])if(!Array.isArray(lineups[team])||lineups[team].length!==4||new Set(lineups[team]).size!==4||lineups[team].some(n=>!Number.isInteger(n)||n<0||n>=roster.length))return false;
 s.lineups={blue:[...lineups.blue],red:[...lineups.red]};s.startedAt=now;setupRound(s);record(s,'início','Série iniciada: vence quem alcançar 3 pontos.',now);return true;
}
function attackTarget(s,actorId,targetId,controller){
 const actor=current(s),target=s.cards.find(c=>c.id===targetId);
 if(s.phase!=='active'||s.paused||!actor||actor.id!==actorId||actor.hp<=0||!target||target.hp<=0||target.team===actor.team)return null;
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
 const damage=Math.min(actor.atk,target.hp);target.hp-=damage;s.last=actor.id;s.revision++;
 const result={actor:actor.id,target:target.id,damage,defeated:target.hp===0,roundWinner:null,winner:null};
 record(s,'ataque',actor.name+' ('+actor.team+') → '+target.name+': −'+damage+' PV'+(result.defeated?' · eliminado':''),now);
 if(result.defeated&&s.haunt)leaveHaunt(s,now);
 if(s.cards.filter(c=>c.team===target.team).every(c=>c.hp===0)){
  s.roundWinner=actor.team;s.score[actor.team]++;result.roundWinner=actor.team;s.phase='round-end';
  record(s,'ponto',(actor.team==='blue'?'Azul':'Vermelho')+' vence a rodada '+s.round+'. Placar '+s.score.blue+' × '+s.score.red+'.',now);
  if(s.score[actor.team]===3){s.winner=actor.team;s.endedAt=now;s.phase='finished';result.winner=actor.team;record(s,'fim','Série encerrada.',now);}
 }else{s.cursor=s.order.indexOf(next(s).id);}
 return result;
}
function continueRound(s,now){if(s.phase!=='round-end')return false;s.round++;setupRound(s);record(s,'rodada','Rodada '+s.round+' iniciada. Equipes restauradas.',now);return true;}
function pause(s,value,now){if(s.phase!=='active')return false;s.paused=!!value;s.revision++;record(s,'pausa',value?'Ações pausadas; cronômetro continua.':'Ações retomadas.',now);return true;}
const api=Object.freeze({roster,SUPPORT_LIMIT,create,start,current,next,attackTarget,enterHaunt,leaveHaunt,attack,continueRound,pause,elapsed,opposite});
if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.GoghosBattleLab=api;
})(globalThis);
