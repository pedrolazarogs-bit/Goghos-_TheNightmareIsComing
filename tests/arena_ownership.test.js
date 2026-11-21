const assert=require('node:assert/strict');
const arena=require('../js/arena/battle');
for(let character=0;character<arena.roster.length;character++){
 const s=arena.create();
 assert(!arena.start(s,0,{blue:[0,1,2,3],red:[3,2,1,4]}));
 assert(arena.start(s,0,character));
 let time=0,sawElimination=false;
 while(s.phase!=='finished'){
  const human=s.cards.find(c=>c.id===s.playerId);
  assert.equal(human.art,character);
  assert.equal(s.cards.filter(c=>c.controller==='player').length,1);
  assert.equal(s.cards.filter(c=>c.controller==='bot').length,7);
  if(s.phase==='round-end'){
   arena.continueRound(s,++time);
   assert(s.cards.every(c=>c.hp===c.maxHp));
   continue;
  }
  const actor=arena.current(s);
  if(!human.hp){sawElimination=true;assert.equal(actor.controller,'bot');}
  const enemies=s.cards.filter(c=>c.team!==actor.team&&c.hp>0);
  // Red focuses on the player, blue spreads attacks to exercise player elimination.
  const target=actor.team==='red'?enemies[0]:enemies.sort((a,b)=>b.hp-a.hp)[0];
  const wrong=actor.controller==='bot'?'player':'bot';
  const before=JSON.stringify(s);
  assert.equal(arena.attack(s,actor.id,target.id,time,wrong),null);
  assert.equal(JSON.stringify(s),before);
  assert(arena.attack(s,actor.id,target.id,++time,actor.controller));
  assert(time<600);
 }
 assert(sawElimination);
 assert.equal(Math.max(s.score.blue,s.score.red),3);
}
console.log('PASS arena: cinco escolhas, um jogador e sete bots, comandos indevidos rejeitados, eliminação, retorno com a mesma carta e vitória da série.');
