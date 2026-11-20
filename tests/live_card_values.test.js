const assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const M=require('../js/lab/battle');
const context={GoghosBattleLab:M};vm.runInNewContext(fs.readFileSync(require.resolve('../js/ui/card_values.js'),'utf8'),context);
const V=context.GoghosCardValues;
for(let art=0;art<M.characters.length;art++){
 const s=M.create({speedOrder:false});M.start(s,0,art);const c=M.player(s),original=JSON.stringify(s);
 assert.equal(V.values(s,c).hp,c.maxHp);assert.equal(V.values(s,c).total,c.atk);assert(V.overlay(s,c).includes('data-card-value="hp"'));assert.equal(JSON.stringify(s),original,'Rendering must not mutate combat.');
 c.hp=0;assert.equal(V.values(s,c).hp,0);
}
const s=M.create({speedOrder:false});M.equipSupport(s,'na-moleira');M.equipSupport(s,'bandeide');M.start(s,0,1);const sam=M.player(s),target=s.cards.find(c=>c.team==='red');
assert.equal(V.values(s,sam).attack,'70×6');assert(M.activateSupport(s,0,sam.id,1));assert.equal(V.values(s,sam).total,470);assert.equal(V.values(s,sam).attack,'470');assert.equal(sam.atk,420);
// A card exchanged after activation keeps its already-armed bonus.
s.supportEffects.push({...s.supports.blue[0]});s.supports.blue[0]=null;
assert.equal(V.values(s,sam).total,470);const hit=M.playerAttack(s,target.id,2);assert.equal(hit.bonus,50);assert.equal(V.values(s,sam).total,420);assert.equal(V.values(s,target).hp,target.maxHp-hit.damage);
s.cursor=s.order.indexOf(sam.id);sam.hp=500;assert(M.activateSupport(s,1,sam.id,3));assert.equal(V.values(s,sam).hp,530,'Healing clamps to printed maximum.');
s.phase='round-end';M.continueRound(s,4);assert(s.cards.every(c=>V.values(s,c).hp===c.maxHp));
const pending=s.cards.find(c=>c.atk===null);if(pending)assert.equal(V.values(s,pending).attack,'—');
console.log('PASS valores nas artes: 32 cartas, vida atual/zero, cura limitada, multiplicador + bônus único, efeito preservado após troca, consumo, rodada restaurada e renderização sem mutação.');
