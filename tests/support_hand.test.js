const assert=require('node:assert/strict'),M=require('../js/lab/battle');
const defaults=['bandeide','na-moleira','escudo-volatil'];
function make(ids=defaults,options={}){const s=M.create(options);ids.forEach(id=>assert(M.equipSupport(s,id)));assert(M.start(s,0,0));s.cards.forEach(c=>{c.atk=0;});return s;}
function step(s,t=1){const c=M.current(s),target=s.cards.find(x=>x.team!==c.team&&x.hp>0);return c.controller==='player'?M.playerAttack(s,target.id,t):M.botAttack(s,c.id,target.id,t);}
function cycle(s){const before=s.completedCycles;for(let i=0;i<8&&s.completedCycles===before;i++)assert(step(s));assert.equal(s.completedCycles,before+1);return s.supportRewards.at(-1);}
function turn(s,id=s.playerId){s.cursor=s.order.indexOf(id);}
const free=make([]);for(let i=0;i<3;i++){const reward=cycle(free);assert(reward.claimed);assert.equal(M.pendingSupportReward(free),null);assert.equal(free.supports.blue.filter(Boolean).length,i+1);}
const fourth=cycle(free);assert.equal(fourth.claimed,false);assert.equal(M.pendingSupportReward(free).uid,fourth.uid);assert.equal(free.supports.blue.length,3);
const frozen=JSON.stringify(free);assert.equal(step(free),null);assert.equal(M.playerPass(free,3),false);assert.equal(JSON.stringify(free),frozen,'A decisão impede acumular novas cartas sem escolher.');
assert(M.discardSupportReward(free,fourth.uid,4));assert.equal(M.pendingSupportReward(free),null);assert.equal(free.supports.blue.filter(Boolean).length,3);assert.equal(M.discardSupportReward(free,fourth.uid,4),false);assert.equal(M.claimSupportReward(free,fourth.uid,4,0),false);
const replace=make(),offer=cycle(replace),old=replace.supports.blue.map(c=>({...c}));
for(const index of [-1,3,1.5,null,NaN])assert.equal(M.claimSupportReward(replace,offer.uid,2,index),false);
for(const time of [NaN,Infinity,undefined]){assert.equal(M.claimSupportReward(replace,offer.uid,time,1),false);assert.equal(M.discardSupportReward(replace,offer.uid,time),false);}
assert.equal(M.claimSupportReward(replace,offer.uid,2),false);assert.deepEqual(replace.supports.blue,old);assert.equal(M.activateSupport(replace,1,replace.playerId,2),null);
assert(M.claimSupportReward(replace,offer.uid,3,1));assert.equal(replace.supports.blue[0].id,old[0].id);assert.equal(replace.supports.blue[2].id,old[2].id);assert.equal(replace.supports.blue[1].id,offer.id);assert.equal(replace.supports.blue[1].instanceId,'reward-'+offer.uid);assert.equal(replace.supports.blue.length,3);assert.equal(M.claimSupportReward(replace,offer.uid,4,2),false);
// Repeated artwork is a different received copy, still subject to the three-card hand.
turn(replace);M.player(replace).hp=100;assert(M.activateSupport(replace,0,replace.playerId,5));assert(M.activateSupport(replace,1,replace.playerId,6));assert.equal(M.player(replace).hp,240);assert.equal(M.activateSupport(replace,1,replace.playerId,7),null);
const used=replace.supports.blue[0];const next=cycle(replace);assert(next.claimed);assert.equal(used.status,'spent');assert.equal(replace.supports.blue[0].instanceId,'reward-'+next.uid);
// Discard keeps the hand, life, order and point totals; a later cycle gives a new choice.
const discard=make(),d=cycle(discard),hand=JSON.stringify(discard.supports),hp=discard.cards.map(c=>c.hp),cursor=discard.cursor;assert(M.discardSupportReward(discard,d.uid,10));assert.equal(JSON.stringify(discard.supports),hand);assert.deepEqual(discard.cards.map(c=>c.hp),hp);assert.equal(discard.cursor,cursor);assert.deepEqual(discard.score,{blue:0,red:0});const another=cycle(discard);assert.notEqual(another.uid,d.uid);assert.equal(discard.supportRewards.filter(r=>!r.claimed&&!r.discarded).length,1);
// Replacing an activated card preserves its already granted effect exactly once.
for(const id of ['escudo-volatil','na-moleira']){
 const s=make([id,'papakill','brisa']);turn(s);assert(M.activateSupport(s,0,s.playerId,1));
 turn(s,'blue-1');s.speedActed=s.order.filter(x=>x!=='blue-1');assert(step(s,2));const reward=M.pendingSupportReward(s);assert(reward);assert(M.claimSupportReward(s,reward.uid,3,0));assert.equal(s.supportEffects.length,1);
 s.phase='round-end';assert(M.continueRound(s,4));
 if(id==='escudo-volatil'){turn(s,'red-0');s.cards.find(c=>c.id==='red-0').atk=100;const hit=M.botAttack(s,'red-0',s.playerId,5);assert.equal(hit.blocked,80);assert.equal(hit.damage,20);turn(s,'red-0');assert.equal(M.botAttack(s,'red-0',s.playerId,6).blocked,0);}
 else{turn(s);assert.equal(M.playerAttack(s,'red-1',5).bonus,50);turn(s);assert.equal(M.playerAttack(s,'red-1',6).bonus,0);}
 assert.equal(s.supportEffects.length,0);
}
const duplicate=make(['escudo-volatil','papakill','brisa'],{seed:1000});turn(duplicate);assert(M.activateSupport(duplicate,0,duplicate.playerId,1));turn(duplicate,'blue-1');duplicate.speedActed=duplicate.order.filter(id=>id!=='blue-1');assert(step(duplicate,2));const shieldOffer=M.pendingSupportReward(duplicate);assert.equal(shieldOffer.id,'escudo-volatil');assert(M.claimSupportReward(duplicate,shieldOffer.uid,3,0));turn(duplicate);assert.equal(M.activateSupport(duplicate,0,duplicate.playerId,4),null,'Cópias não empilham efeitos ativos.');turn(duplicate,'red-0');duplicate.cards.find(c=>c.id==='red-0').atk=100;assert.equal(M.botAttack(duplicate,'red-0',duplicate.playerId,5).blocked,80);turn(duplicate);assert(M.activateSupport(duplicate,0,duplicate.playerId,6));turn(duplicate,'red-0');assert.equal(M.botAttack(duplicate,'red-0',duplicate.playerId,7).blocked,80);
const ended=make(),e=cycle(ended);ended.phase='finished';assert.equal(M.claimSupportReward(ended,e.uid,10,0),false);assert.equal(M.discardSupportReward(ended,e.uid,10),false);
console.log('PASS mão de apoios: limite de três, entrada automática com vaga, uma oferta sem reserva, troca exata, descarte, cópias independentes, ações bloqueadas durante escolha, efeito ativado preservado e callbacks inválidos rejeitados.');
