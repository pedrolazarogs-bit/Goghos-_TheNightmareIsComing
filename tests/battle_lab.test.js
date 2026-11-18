const assert=require('node:assert/strict'),M=require('../js/lab/battle');
const runAttack=(s,target,now)=>M.current(s).controller==='player'?M.playerAttack(s,target,now):M.botAttack(s,M.current(s).id,target,now);
for(let chosen=0;chosen<M.roster.length;chosen++){
 const s=M.create();assert(M.start(s,0,chosen));assert.equal(M.player(s).name,M.roster[chosen]);assert.equal(s.cards.filter(c=>c.controller==='player').length,1);assert.equal(s.cards.filter(c=>c.controller==='bot').length,7);assert.equal(s.cards.filter(c=>c.team==='blue'&&c.controller==='bot').length,3);assert.equal(new Set(s.lineups.blue).size,4);assert.equal(new Set(s.lineups.red).size,4);
}
const s=M.create();assert.equal(M.elapsed(s,1000),0);for(const invalid of [-1,5,1.5,NaN,'1',{blue:[0,1,2,3]}])assert.equal(M.start(s,0,invalid),false);
assert(M.start(s,0,3));assert.equal(M.player(s).name,'Nully');assert.equal(M.start(s,10),false);assert.equal(M.next(s).id,'red-0');
assert.equal(M.botAttack(s,s.playerId,'red-0',10),null);assert.equal(M.botAttack(s,'red-0',s.playerId,10),null);assert.equal(M.playerAttack(s,'blue-1',10),null);assert.equal(M.playerAttack(s,'missing',10),null);
M.pause(s,true,20);assert.equal(M.playerAttack(s,'red-0',30),null);assert.equal(M.elapsed(s,1000),1000);M.pause(s,false,1000);
const first=M.playerAttack(s,'red-0',1200);assert.equal(first.damage,25);assert.equal(s.last,s.playerId);assert.equal(M.current(s).id,'red-0');assert.equal(M.canPlayerAct(s),false);assert.equal(M.playerAttack(s,'red-0',1201),null);assert.equal(M.botAttack(s,'blue-1','red-0',1201),null);
let time=1200,steps=1,rounds=0,deadPlayerObserved=false,allyBotObserved=false;
while(s.phase!=='finished'&&steps<500){
 if(s.phase==='round-end'){
  rounds++;const score={...s.score},started=s.startedAt;assert.equal(s.cards.filter(c=>c.team===M.opposite(s.roundWinner)&&c.hp>0).length,0);
  assert.equal(runAttack(s,'red-0',time),null);assert.deepEqual(s.score,score);
  assert(M.continueRound(s,time+=1000));assert.equal(s.cards.filter(c=>c.hp===100).length,8);assert.equal(s.startedAt,started);assert.equal(s.last,null);assert.deepEqual(s.score,score);assert.equal(M.player(s).name,'Nully');assert.equal(s.cards.filter(c=>c.controller==='player').length,1);
 }
 const actor=M.current(s),target=s.cards.filter(c=>c.team!==actor.team&&c.hp>0).sort((a,b)=>a.hp-b.hp||a.slot-b.slot)[0];assert(actor.hp>0);assert(target);
 if(actor.team==='blue'&&actor.id!==s.playerId){allyBotObserved=true;assert.equal(actor.controller,'bot');assert.equal(M.playerAttack(s,target.id,time),null);}
 if(M.player(s).hp===0){deadPlayerObserved=true;assert.equal(M.canPlayerAct(s),false);assert.equal(M.playerAttack(s,target.id,time),null);}
 const result=runAttack(s,target.id,time+=4000);assert(result);steps++;for(const c of s.cards)assert(c.hp>=0&&c.hp<=c.maxHp);
 if(result.defeated&&s.phase==='active'){assert.notEqual(M.current(s).id,result.target);assert.notEqual(M.next(s).id,result.target);assert.equal(runAttack(s,result.target,time),null);}
}
assert(allyBotObserved);assert(deadPlayerObserved);assert(s.winner);assert.equal(Math.max(s.score.blue,s.score.red),3);assert(s.score.blue+s.score.red<=5);assert.equal(rounds+1,s.score.blue+s.score.red);assert.equal(M.elapsed(s,time+99999),time);const score={...s.score};assert.equal(M.continueRound(s,time+1),false);assert.equal(runAttack(s,'red-1',time+1),null);assert.deepEqual(s.score,score);assert.equal(s.supports.blue.length,3);assert.equal(s.supports.red.length,3);
console.log('PASS arena: escolha única, 1 jogador + 7 bots, bloqueio de controle de aliados/adversários, continuidade após morte do jogador, rodadas, vitória até 3 e relógio final ('+steps+' ataques).');
