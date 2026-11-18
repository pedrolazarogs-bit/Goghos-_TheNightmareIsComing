const assert=require('node:assert/strict'),M=require('../js/lab/battle');
const s=M.create();assert.equal(M.elapsed(s,1000),0);assert.equal(M.start(s,0,{blue:[0,0,2,3],red:[0,1,2,3]}),false);assert.equal(M.start(s,0),true);assert.equal(M.start(s,10),false);assert.equal(s.cards.length,8);assert.equal(M.current(s).id,'blue-0');assert.equal(M.next(s).id,'red-0');
assert.equal(M.attack(s,'red-0','blue-0',10),null);assert.equal(M.attack(s,'blue-0','blue-1',10),null);assert.equal(M.attack(s,'blue-0','missing',10),null);
M.pause(s,true,20);assert.equal(M.attack(s,'blue-0','red-0',30),null);assert.equal(M.elapsed(s,1000),1000);M.pause(s,false,1000);
const first=M.attack(s,'blue-0','red-0',1200);assert.equal(first.damage,25);assert.equal(s.cards.find(c=>c.id==='red-0').hp,75);assert.equal(s.last,'blue-0');assert.equal(M.current(s).id,'red-0');assert.equal(M.attack(s,'blue-0','red-0',1201),null);
let time=1200,steps=1,rounds=0;
while(s.phase!=='finished'&&steps<500){
 if(s.phase==='round-end'){
  rounds++;const score={...s.score},started=s.startedAt;assert.equal(s.cards.filter(c=>c.team===M.opposite(s.roundWinner)&&c.hp>0).length,0);
  assert.equal(M.attack(s,M.current(s).id,'red-0',time),null);assert.deepEqual(s.score,score);
  assert(M.continueRound(s,time+=1000));assert.equal(s.cards.filter(c=>c.hp===100).length,8);assert.equal(s.startedAt,started);assert.equal(s.last,null);assert.deepEqual(s.score,score);
 }
 const actor=M.current(s),target=s.cards.filter(c=>c.team!==actor.team&&c.hp>0).sort((a,b)=>a.hp-b.hp||a.slot-b.slot)[0];assert(actor.hp>0);assert(target);
 const result=M.attack(s,actor.id,target.id,time+=1500);assert(result);steps++;
 for(const c of s.cards)assert(c.hp>=0&&c.hp<=c.maxHp);
 if(result.defeated&&s.phase==='active'){assert.notEqual(M.current(s).id,result.target);assert.notEqual(M.next(s).id,result.target);assert.equal(M.attack(s,M.current(s).id,result.target,time),null);}
}
assert(s.winner);assert.equal(Math.max(s.score.blue,s.score.red),3);assert(s.score.blue+s.score.red<=5);assert.equal(rounds+1,s.score.blue+s.score.red);assert.equal(M.elapsed(s,time+99999),time);const score={...s.score};assert.equal(M.continueRound(s,time+1),false);assert.equal(M.attack(s,M.current(s).id,'red-1',time+1),null);assert.deepEqual(s.score,score);assert.equal(s.supports.blue.length,3);assert.equal(s.supports.red.length,3);
console.log('PASS arena: 4×4, validação de turno/alvo, dano, eliminações, ordem sem mortos, ponto único, restauração de rodada, série até 3 e cronômetro final congelado ('+steps+' ataques).');
