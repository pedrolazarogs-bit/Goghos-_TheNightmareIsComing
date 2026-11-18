// Isolated 4x4 series model. No DOM, game imports, persistence or character skills.
(function(root){
'use strict';
const roster=Object.freeze(['Unicorn','Sam','Sark','Nully','Mike']);
const opposite=team=>team==='blue'?'red':'blue';
function record(s,type,text,now){s.events.unshift({index:++s.sequence,type,text,ms:elapsed(s,now)});s.events.length=Math.min(s.events.length,1000);}
function elapsed(s,now){return s.startedAt===null?0:Math.max(0,(s.endedAt??now)-s.startedAt);}
function current(s){return s.cards.find(c=>c.id===s.order[s.cursor])||null;}
function next(s){if(s.phase!=='active')return null;for(let n=1;n<=s.order.length;n++){const c=s.cards.find(c=>c.id===s.order[(s.cursor+n)%s.order.length]);if(c?.hp>0)return c;}return null;}
function setupRound(s){
 s.cards=['blue','red'].flatMap(team=>s.lineups[team].map((art,i)=>({id:team+'-'+i,team,slot:i,art,controller:team+'-'+i===s.playerId?'player':'bot',name:roster[art],hp:100,maxHp:100,atk:25,status:[],ability:null})));
 const first=s.round%2?'blue':'red',second=opposite(first);
 s.order=Array.from({length:4},(_,i)=>[first+'-'+i,second+'-'+i]).flat();s.cursor=0;s.last=null;s.roundWinner=null;s.phase='active';s.paused=false;s.revision++;
}
function create(){return {phase:'ready',playerId:null,playerArt:null,round:1,score:{blue:0,red:0},lineups:{blue:[0,1,2,3],red:[3,2,1,4]},cards:[],order:[],cursor:0,last:null,roundWinner:null,winner:null,startedAt:null,endedAt:null,paused:false,revision:0,sequence:0,events:[],supports:{blue:[null,null,null],red:[null,null,null]}};}
function player(s){return s.cards.find(c=>c.id===s.playerId)||null;}
function canPlayerAct(s){return s.phase==='active'&&!s.paused&&current(s)?.id===s.playerId&&player(s)?.hp>0;}
function start(s,now,playerArt=0){
 if(s.phase!=='ready'||!Number.isFinite(now)||!Number.isInteger(playerArt)||playerArt<0||playerArt>=roster.length)return false;
 s.playerArt=playerArt;s.playerId='blue-0';
 s.lineups={blue:Array.from({length:4},(_,i)=>(playerArt+i)%roster.length),red:Array.from({length:4},(_,i)=>(playerArt+4-i+roster.length)%roster.length)};
 s.startedAt=now;setupRound(s);record(s,'início',roster[playerArt]+': seu personagem. Três aliados e quatro adversários controlados por bots.',now);return true;
}
function attack(s,actorId,targetId,now){
 const actor=current(s),target=s.cards.find(c=>c.id===targetId);
 if(s.phase!=='active'||s.paused||!actor||actor.id!==actorId||actor.hp<=0||!target||target.hp<=0||target.team===actor.team||!Number.isFinite(now))return null;
 const damage=Math.min(actor.atk,target.hp);target.hp-=damage;s.last=actor.id;s.revision++;
 const result={actor:actor.id,target:target.id,damage,defeated:target.hp===0,roundWinner:null,winner:null};
 record(s,'ataque',actor.name+' ('+actor.team+') → '+target.name+': −'+damage+' PV'+(result.defeated?' · eliminado':''),now);
 if(s.cards.filter(c=>c.team===target.team).every(c=>c.hp===0)){
  s.roundWinner=actor.team;s.score[actor.team]++;result.roundWinner=actor.team;s.phase='round-end';
  record(s,'ponto',(actor.team==='blue'?'Azul':'Vermelho')+' vence a rodada '+s.round+'. Placar '+s.score.blue+' × '+s.score.red+'.',now);
  if(s.score[actor.team]===3){s.winner=actor.team;s.endedAt=now;s.phase='finished';result.winner=actor.team;record(s,'fim','Série encerrada.',now);}
 }else{for(let n=1;n<=s.order.length;n++){const i=(s.cursor+n)%s.order.length;if(s.cards.find(c=>c.id===s.order[i]).hp>0){s.cursor=i;break;}}}
 return result;
}
function playerAttack(s,targetId,now){if(!canPlayerAct(s))return null;return attack(s,s.playerId,targetId,now);}
function botAttack(s,actorId,targetId,now){if(current(s)?.controller!=='bot')return null;return attack(s,actorId,targetId,now);}
function continueRound(s,now){if(s.phase!=='round-end')return false;s.round++;setupRound(s);record(s,'rodada','Rodada '+s.round+' iniciada. Equipes restauradas.',now);return true;}
function pause(s,value,now){if(s.phase!=='active')return false;s.paused=!!value;s.revision++;record(s,'pausa',value?'Ações pausadas; cronômetro continua.':'Ações retomadas.',now);return true;}
const api=Object.freeze({roster,create,start,current,next,player,canPlayerAct,playerAttack,botAttack,continueRound,pause,elapsed,opposite});
if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.GoghosBattleLab=api;
})(globalThis);
