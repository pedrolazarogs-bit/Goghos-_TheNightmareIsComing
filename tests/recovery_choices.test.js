const assert=require('node:assert/strict');
['data/characters','data/gods','data/support_cards','data/reset_cards','core/battle','core/character_abilities','core/deck','core/support','core/roster','core/official_abilities','core/support_effects','core/divine','core/selection','core/ai','ui/match_ui','ui/arena_ui'].forEach(f=>require('../js/'+f+'.js'));
require('./fixtures/v0_25_catalog.js'); // Regressão das regras e atributos da v0.25.0.
const G=GOGHOS;let passed=0;const test=(name,run)=>{run();passed++;console.log('OK  '+name);};
function hit(side='player',counts=null,lives=3){
 const s=G.createBattleState({front:['cavaleiro'],rear:[]},{front:['sam'],rear:[]},[],{rng:()=>.5,roll:()=>6});
 for(const u of G.getBoard(s)[side].front)G.eliminateUnit(s,u);
 if(counts)for(const rarity of ['COMMON','RARE','EPIC'])s.piles[rarity]=s.piles[rarity].slice(0,counts[rarity]??s.piles[rarity].length);
 s.daly[side].hp=lives;const a=G.getNextActor(s);assert(G.performBasicAttack(s,a.uid,G.dalyTargetId(side)).ok);return s;
}
const physical=s=>[...Object.values(s.piles).flat(),...s.units,...s.divineReserve].map(c=>c.iid).sort();

test('golpe na Daly Mãe oferece somente 2 Épicos ou 3 Raros na interface atual',()=>{
 const s=hit(),options=G.recoveryOptions(s);assert.deepEqual(options.map(o=>[o.id,o.rarity,o.count,o.drawCount,o.available]),[['A','EPIC',2,2,true],['B','RARE',3,3,true]]);
 const html=G.recoveryHTML(s);assert(html.includes('A · 2 Épicos'));assert(html.includes('B · 3 Raros'));assert.equal((html.match(/data-act="recover-/g)||[]).length,2);assert(!html.includes('Comuns'));assert.equal(s.daly.player.hp,2);
});
test('cada opção retira exatamente o topo da raridade escolhida, sem duplicar cartas ou gastar ações',()=>{
 for(const [id,rarity,count] of [['A','EPIC',2],['B','RARE',3]]){
  const s=hit(),all=physical(s),pile=[...s.piles[rarity]],common=[...s.piles.COMMON],clock=JSON.stringify([s.round,s.turn,s.speedCursor,s.acted,s.deck]);
  const r=G.performRecovery(s,id);assert(r.ok,r.error);assert.equal(r.units.length,count);assert(r.units.every(uid=>G.getUnit(s,uid).rarity===rarity));assert.deepEqual(new Set(r.units.map(uid=>G.getUnit(s,uid).iid)),new Set(pile.slice(-count).map(c=>c.iid)));assert.deepEqual(s.piles[rarity],pile.slice(0,-count));assert.deepEqual(s.piles.COMMON,common);assert.deepEqual(physical(s),all);assert.equal(JSON.stringify([s.round,s.turn,s.speedCursor,s.acted,s.deck]),clock);assert(!s.recovery);assert(!G.isDalyExposed(s,'player'));
  const snapshot=JSON.stringify(s);assert(!G.performRecovery(s,id).ok);assert.equal(JSON.stringify(s),snapshot);
 }
});
test('recuperação parcial entrega o que restar e opção vazia não encerra a escolha',()=>{
 for(const [id,rarity,other] of [['A','EPIC','RARE'],['B','RARE','EPIC']]){
  const s=hit('player',{[rarity]:1,[other]:0}),common=[...s.piles.COMMON],options=G.recoveryOptions(s);assert(options.find(o=>o.rarity===rarity).available);assert(!options.find(o=>o.rarity===other).available);const invalid=other==='EPIC'?'A':'B';assert(!G.performRecovery(s,invalid).ok);assert(s.recovery);const r=G.performRecovery(s,id);assert(r.ok);assert.equal(r.units.length,1);assert.equal(s.piles[rarity].length,0);assert.deepEqual(s.piles.COMMON,common);
 }
});
test('Comuns restantes não abrem recuperação e a última vida nunca recupera personagens',()=>{
 const empty=hit('player',{RARE:0,EPIC:0});assert(empty.piles.COMMON.length>0);assert(!empty.recovery);assert(G.isDalyExposed(empty,'player'));assert(!G.performRecovery(empty,'A').ok);
 const ended=hit('player',null,1);assert.equal(ended.result,'defeat');assert.equal(ended.daly.player.hp,0);assert(!ended.recovery);assert.equal(ended.piles.EPIC.length,3);assert.equal(ended.piles.RARE.length,4);
});
test('bot usa as mesmas duas opções e pode receber lotes completos ou parciais',()=>{
 for(const [rng,rarity,count] of [[()=>0,'EPIC',2],[()=>.999,'RARE',3]]){const s=hit('enemy');s.rng=rng;const r=G.AI.resolveRecovery(s);assert(r.ok);assert.equal(r.units.length,count);assert(r.units.every(uid=>{const u=G.getUnit(s,uid);return u.team==='enemy'&&u.rarity===rarity;}));}
 const s=hit('enemy',{EPIC:0,RARE:1}),r=G.AI.resolveRecovery(s);assert(r.ok);assert.equal(r.units.length,1);assert.equal(G.getUnit(s,r.units[0]).rarity,'RARE');
});
test('dois Épicos retomam a faixa de velocidade restante sem repetir o atacante ou comprar cartas',()=>{
 const s=G.createBattleState({front:['cavaleiro'],rear:[]},{front:['sam','ddx'],rear:[]},[],{rng:()=>.5,roll:()=>6}),attacker=s.units.find(u=>u.id==='sam');attacker.speed=9;G.buildTurnOrder(s);G.eliminateUnit(s,s.units.find(u=>u.id==='cavaleiro'));
 const pile=s.piles.EPIC,chosen=['fonior','trucc'].map(id=>pile.splice(pile.findIndex(c=>c.id===id),1)[0]);pile.push(...chosen);assert(G.performBasicAttack(s,attacker.uid,'daly_player').ok);const round=s.round,turn=s.turn,deck=JSON.stringify(s.deck);assert(G.performRecovery(s,'A').ok);
 const order=s.order.filter(uid=>!s.acted[uid]).map(uid=>G.getUnit(s,uid));assert.deepEqual(order.map(u=>[u.id,u.speed]),[['trucc',8],['ddx',4],['fonior',3]]);assert.equal(G.getNextActor(s).id,'trucc');assert(s.acted[attacker.uid]);assert.equal(s.round,round);assert.equal(s.turn,turn);assert.equal(JSON.stringify(s.deck),deck);
});
console.log(`${passed} testes das opções atuais de recuperação passaram`);
