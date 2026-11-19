const assert=require('node:assert/strict'),M=require('../js/lab/battle');
const speeds=[4,7,null,9,5,2,7,3,9,3,5,6,7,9,6,3,4,4,5,2,5,2,3,5,4,3,6,2,5,4,6,7];
assert.deepEqual(M.characters.map(c=>c.speed),speeds);
const make=(art=0,options={})=>{const s=M.create(options);assert(M.start(s,0,art));return s;};
const harmless=s=>s.cards.forEach(c=>{if(c.atk!==null)c.atk=0;});
const step=(s,t)=>{const c=M.current(s),target=s.cards.find(x=>x.team!==c.team&&x.hp>0);return c.atk===null?(c.controller==='player'?M.playerPass(s,t):M.botPass(s,c.id,t)):(c.controller==='player'?M.playerAttack(s,target.id,t):M.botAttack(s,c.id,target.id,t));};
const pending=M.create();assert.equal(M.start(pending,0,2),false);assert.equal(pending.phase,'ready');assert(M.start(M.create({speedOrder:false}),0,2));
for(let art=0;art<32;art++){
 if(speeds[art]===null)continue;const s=make(art);assert.equal(s.cards.length,8);assert.equal(new Set(s.cards.map(c=>c.art)).size,8);assert(s.cards.every(c=>c.speed!==null));
 const ordered=s.order.map(id=>s.cards.find(c=>c.id===id).speed);assert.deepEqual(ordered,[...ordered].sort((a,b)=>b-a));assert.equal(M.current(s).speed,Math.max(...ordered));
 harmless(s);const expected=[...s.order];for(let i=0;i<8;i++){assert.equal(M.current(s).id,expected[i]);assert(step(s,i+1));assert.equal(s.supportRewards.length,i===7?1:0);}
 assert.equal(s.speedCycle,2);assert.equal(s.completedCycles,1);assert.equal(M.current(s).id,expected[0]);assert.deepEqual(s.speedActed,[]);assert(M.supportCards.find(c=>c.id===s.supportRewards[0].id).effect);
 for(let i=0;i<8;i++)assert(step(s,100+i));assert.equal(s.supportRewards.length,2);assert.equal(s.completedCycles,2);assert.notEqual(s.supportRewards[0].uid,s.supportRewards[1].uid);
}
const dead=make();harmless(dead);step(dead,1);dead.cards.find(c=>c.id==='red-0').hp=0;for(let i=0;i<6;i++)step(dead,2+i);assert.equal(dead.completedCycles,1);assert.equal(dead.supportRewards.length,1);assert.equal(M.current(dead).speed,9);
const pause=make();harmless(pause);M.pause(pause,true,1);assert.equal(step(pause,2),null);assert.equal(pause.supportRewards.length,0);M.pause(pause,false,3);assert.equal(pause.supportRewards.length,0);
const won=make(3);won.cards.filter(c=>c.team==='red').forEach(c=>c.hp=0);won.cards.find(c=>c.id==='red-0').hp=1;assert(M.playerAttack(won,'red-0',10));assert.equal(won.phase,'round-end');assert.equal(won.supportRewards.length,0);M.continueRound(won,20);assert.equal(won.supportRewards.length,0);assert.equal(M.current(won).team,'red','Empate de velocidade alterna prioridade de equipe a cada rodada.');
const legacy=make(0,{speedOrder:false});assert.deepEqual(legacy.order,['blue-0','red-0','blue-1','red-1','blue-2','red-2','blue-3','red-3']);harmless(legacy);for(let i=0;i<16;i++)step(legacy,i);assert.equal(legacy.supportRewards.length,0);assert.equal(legacy.completedCycles,0);
let actions=0;for(let art=0;art<32;art++){if(speeds[art]===null)continue;const s=make(art);let t=0;for(let n=0;n<2000&&!['finished','blocked'].includes(s.phase);n++){if(s.phase==='round-end')M.continueRound(s,t+=100);const offer=M.pendingSupportReward(s);if(offer)assert(M.discardSupportReward(s,offer.uid,t));assert(step(s,t+=4000));actions++;assert.equal(s.completedCycles,s.supportRewards.length);assert.equal(new Set(s.supportRewards.map(r=>r.uid)).size,s.supportRewards.length);}assert(['finished','blocked'].includes(s.phase));if(s.phase==='finished')assert.equal(Math.max(s.score.blue,s.score.red),3);const final=s.supportRewards.length;assert.equal(M.playerAttack(s,'red-0',t+1),null);assert.equal(s.supportRewards.length,final);}
console.log('PASS velocidade: 31 personagens, valores impressos, Sarck pendente, empates, eliminados, passes, resets únicos,  celular anterior e séries completas ('+actions+' ações).');
