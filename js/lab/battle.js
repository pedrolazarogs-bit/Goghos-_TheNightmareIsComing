// Isolated 4x4 series model. No DOM, game imports, persistence or character skills.
(function(root){
'use strict';
const characters=typeof module!=='undefined'&&module.exports?require('./characters'):root.GoghosCharacters;
const supportCards=typeof module!=='undefined'&&module.exports?require('./supports'):root.GoghosSupports;
const roster=Object.freeze(characters.map(c=>c.name));
const opposite=team=>team==='blue'?'red':'blue';
function record(s,type,text,now){s.events.unshift({index:++s.sequence,type,text,ms:elapsed(s,now)});s.events.length=Math.min(s.events.length,1000);}
function elapsed(s,now){return s.startedAt===null?0:Math.max(0,(s.endedAt??now)-s.startedAt);}
function current(s){return s.cards.find(c=>c.id===s.order[s.cursor])||null;}
function next(s){if(s.phase!=='active')return null;for(let n=1;n<=s.order.length;n++){const c=s.cards.find(c=>c.id===s.order[(s.cursor+n)%s.order.length]);if(c?.hp>0)return c;}return null;}
function setupRound(s){
 s.cards=['blue','red'].flatMap(team=>s.lineups[team].map((art,i)=>{const c=characters[art];return {id:team+'-'+i,characterId:c.id,team,slot:i,art,controller:team+'-'+i===s.playerId?'player':'bot',name:c.name,hp:c.maxHp,maxHp:c.maxHp,breath:c.breath,maxBreath:c.breath,baseAtk:c.baseAtk,hits:c.hits,atk:c.baseAtk===null?null:c.baseAtk*c.hits,attackName:c.attackName,status:[],ability:null};}));
 const first=s.round%2?'blue':'red',second=opposite(first);
 s.order=Array.from({length:4},(_,i)=>[first+'-'+i,second+'-'+i]).flat();s.cursor=0;s.last=null;s.roundWinner=null;s.phase='active';s.paused=false;s.revision++;
}
function create(){return {phase:'ready',playerId:null,playerArt:null,round:1,score:{blue:0,red:0},lineups:{blue:[0,1,2,3],red:[3,2,1,4]},cards:[],order:[],cursor:0,last:null,roundWinner:null,winner:null,startedAt:null,endedAt:null,paused:false,revision:0,sequence:0,events:[],supports:{blue:[null,null,null],red:[null,null,null]}};}
function player(s){return s.cards.find(c=>c.id===s.playerId)||null;}
function isPlayerTurn(s){return s.phase==='active'&&!s.paused&&current(s)?.id===s.playerId&&player(s)?.hp>0;}
function canPlayerAct(s){return isPlayerTurn(s)&&player(s).atk!==null;}
function advance(s){for(let n=1;n<=s.order.length;n++){const i=(s.cursor+n)%s.order.length;if(s.cards.find(c=>c.id===s.order[i]).hp>0){s.cursor=i;break;}}}
function start(s,now,playerArt=0){
 if(s.phase!=='ready'||!Number.isFinite(now)||!Number.isInteger(playerArt)||playerArt<0||playerArt>=roster.length)return false;
 s.playerArt=playerArt;s.playerId='blue-0';
 s.lineups={blue:Array.from({length:4},(_,i)=>(playerArt+i)%roster.length),red:Array.from({length:4},(_,i)=>(playerArt+4+i)%roster.length)};
 s.startedAt=now;setupRound(s);record(s,'início',roster[playerArt]+': seu personagem. Três aliados e quatro adversários controlados por bots.',now);return true;
}
function settle(s,team,target,now,result,advanceTurn){
 if(s.cards.filter(c=>c.team===target.team).every(c=>c.hp===0)){
  s.roundWinner=team;s.score[team]++;result.roundWinner=team;s.phase='round-end';
  record(s,'ponto',(team==='blue'?'Azul':'Vermelho')+' vence a rodada '+s.round+'. Placar '+s.score.blue+' × '+s.score.red+'.',now);
  if(s.score[team]===3){s.winner=team;s.endedAt=now;s.phase='finished';result.winner=team;record(s,'fim','Série encerrada.',now);}
 }else if(s.cards.filter(c=>c.hp>0).every(c=>c.atk===null)){s.phase='blocked';s.endedAt=now;record(s,'regras pendentes','Restam somente cartas sem ataque definido. Série interrompida sem conceder ponto.',now);}else if(advanceTurn)advance(s);
}
function armedSupport(s,effect,targetId){return Object.values(s.supports).flat().find(slot=>slot?.status==='armed'&&slot.targetId===targetId&&supportCards.find(c=>c.id===slot.id)?.effect===effect);}
function attack(s,actorId,targetId,now){
 const actor=current(s),target=s.cards.find(c=>c.id===targetId);
 if(s.phase!=='active'||s.paused||!actor||actor.id!==actorId||actor.hp<=0||actor.atk===null||!target||target.hp<=0||target.team===actor.team||!Number.isFinite(now))return null;
 const boost=armedSupport(s,'boost',actor.id),guard=armedSupport(s,'guard',target.id),total=actor.atk+(boost?50:0),blocked=guard?Math.min(80,total):0;
 const damage=Math.min(Math.max(0,total-blocked),target.hp);target.hp-=damage;s.last=actor.id;s.revision++;
 if(boost)boost.status='spent';if(guard)guard.status='spent';
 const result={actor:actor.id,target:target.id,damage,bonus:boost?50:0,blocked,defeated:target.hp===0,roundWinner:null,winner:null};
 record(s,'ataque',actor.name+' ('+actor.team+') → '+target.name+': −'+damage+' PV'+(boost?' · +50 de apoio':'')+(blocked?' · '+blocked+' bloqueados':'')+(result.defeated?' · eliminado':''),now);
 settle(s,actor.team,target,now,result,true);
 return result;
}
function equipSupport(s,id){
 if(s.phase!=='ready'||!supportCards.some(c=>c.id===id)||s.supports.blue.some(c=>c?.id===id))return false;
 const i=s.supports.blue.indexOf(null);if(i===-1)return false;s.supports.blue[i]={id,status:'ready',targetId:null};s.revision++;return true;
}
function removeSupport(s,index){if(s.phase!=='ready'||!Number.isInteger(index)||index<0||index>2||!s.supports.blue[index])return false;s.supports.blue[index]=null;s.revision++;return true;}
function supportTargets(s,index){
 const slot=s.supports.blue[index],definition=slot&&supportCards.find(c=>c.id===slot.id),owned=player(s);if(!definition?.effect||!owned)return [];
 if(definition.effect==='heal')return s.cards.filter(c=>c.team===owned.team&&c.hp>0&&c.hp<c.maxHp);
 if(definition.effect==='execute')return s.cards.filter(c=>c.team!==owned.team&&c.hp>0&&c.hp<40);
 return owned.hp>0&&(definition.effect!=='boost'||owned.atk!==null)?[owned]:[];
}
function supportReason(s,index,targetId){
 if(!Number.isInteger(index)||index<0||index>2)return 'Espaço de apoio inválido.';
 const slot=s.supports.blue[index],definition=slot&&supportCards.find(c=>c.id===slot.id);
 if(!definition)return 'Nenhum apoio equipado.';
 if(!definition.effect)return definition.pending;
 if(slot.status!=='ready')return 'Este apoio já foi ativado nesta série.';
 if(s.phase!=='active')return 'A série precisa estar em andamento.';
 if(s.paused)return 'Retome a batalha antes de ativar um apoio.';
 if(!player(s)?.hp)return 'Seu personagem foi eliminado nesta rodada.';
 if(!isPlayerTurn(s))return 'Aguarde a vez do seu personagem.';
 if(!supportTargets(s,index).some(c=>c.id===targetId))return definition.effect==='execute'?'Escolha um oponente vivo com menos de 40 PV.':definition.effect==='heal'?'Escolha um aliado vivo com vida abaixo do máximo.':'Este apoio precisa do seu personagem vivo e de um ataque definido quando houver bônus de dano.';
 return '';
}
function activateSupport(s,index,targetId,now){
 if(!Number.isFinite(now)||supportReason(s,index,targetId))return null;
 const slot=s.supports.blue[index],definition=supportCards.find(c=>c.id===slot.id),target=s.cards.find(c=>c.id===targetId),owned=player(s);
 const result={supportId:slot.id,actor:owned.id,target:target.id,damage:0,healed:0,defeated:false,roundWinner:null,winner:null};
 slot.targetId=target.id;slot.status=['boost','guard'].includes(definition.effect)?'armed':'spent';slot.activatedRound=s.round;s.revision++;
 let detail='';
 if(definition.effect==='heal'){result.healed=Math.min(70,target.maxHp-target.hp);target.hp+=result.healed;detail='+'+result.healed+' PV em '+target.name;}
 if(definition.effect==='boost')detail=target.name+': +50 de dano no próximo ataque, uma vez no total';
 if(definition.effect==='guard')detail=target.name+': bloqueio de até 80 no próximo ataque recebido';
 if(definition.effect==='execute'){result.damage=target.hp;target.hp=0;result.defeated=true;detail=target.name+' eliminado com menos de 40 PV';}
 result.text=definition.name+' · '+detail;record(s,'apoio',result.text,now);
 if(result.defeated)settle(s,owned.team,target,now,result,false);
 return result;
}
function playerAttack(s,targetId,now){if(!canPlayerAct(s))return null;return attack(s,s.playerId,targetId,now);}
function botAttack(s,actorId,targetId,now){if(current(s)?.controller!=='bot')return null;return attack(s,actorId,targetId,now);}
function pass(s,actorId,now){const actor=current(s);if(s.phase!=='active'||s.paused||!actor||actor.id!==actorId||actor.atk!==null||!Number.isFinite(now))return false;s.revision++;record(s,'vez passada',actor.name+': ataque impresso como —; aguardando regras.',now);if(s.cards.filter(c=>c.hp>0).every(c=>c.atk===null)){s.phase='blocked';s.endedAt=now;record(s,'regras pendentes','Restam somente cartas sem ataque definido. Série interrompida sem conceder ponto.',now);}else advance(s);return true;}
function playerPass(s,now){return isPlayerTurn(s)&&pass(s,s.playerId,now);}
function botPass(s,actorId,now){return current(s)?.controller==='bot'&&pass(s,actorId,now);}
function continueRound(s,now){if(s.phase!=='round-end')return false;s.round++;setupRound(s);record(s,'rodada','Rodada '+s.round+' iniciada. Equipes restauradas.',now);return true;}
function pause(s,value,now){if(s.phase!=='active')return false;s.paused=!!value;s.revision++;record(s,'pausa',value?'Ações pausadas; cronômetro continua.':'Ações retomadas.',now);return true;}
const api=Object.freeze({characters,roster,supportCards,create,start,current,next,player,isPlayerTurn,canPlayerAct,playerAttack,botAttack,playerPass,botPass,continueRound,pause,elapsed,opposite,equipSupport,removeSupport,supportTargets,supportReason,activateSupport});
if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.GoghosBattleLab=api;
})(globalThis);
