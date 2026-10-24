const assert=require('node:assert/strict'),fs=require('node:fs');
['data/characters','data/gods','data/support_cards','data/reset_cards','core/battle','core/character_abilities','core/deck','core/support','core/roster','core/official_abilities','core/support_effects','core/divine','core/selection','core/ai','ui/card'].forEach(f=>require('../js/'+f+'.js'));
const G=globalThis.GOGHOS;let passed=0;const test=(name,run)=>{run();passed++;console.log('OK  '+name);};
test('catálogo tem 31 personagens oficiais, com bases recebidas e sem Petra ou personagens provisórios',()=>{
 assert.equal(G.CHARACTERS.length,31);assert.equal(new Set(G.CHARACTERS.map(c=>c.id)).size,31);assert.equal(G.getCharacterById('petra'),null);
 for(const c of G.CHARACTERS){assert(c.official);assert(!c.id.startsWith('char_'));assert(c.cardBase);assert(G.getMainAbility(c));assert(fs.existsSync(c.cardBase.src));assert.equal(c.maxHp%5,0);assert.equal(c.damage%5,0);if(c.cardBase.cleanup)assert(fs.existsSync(c.cardBase.cleanup.src));assert(!G.cardHTML(c).includes('undefined'));}
 for(const c of G.CHARACTERS.filter(c=>c.cardBase.outline&&!c.manualBalance))assert(fs.readFileSync(c.cardBase.src).equals(fs.readFileSync('assets/references/characters/'+c.id+'.png')));
 assert.equal(G.getCharacterById('sam').damage,70);assert.equal(G.getCharacterById('chama').damage,55);assert.equal(G.getCharacterById('nully').damage,80);assert.equal(G.getCharacterById('alex').damage,170);
 assert.equal(G.getCharacterById('sarck').maxHp,530);assert.equal(G.getCharacterById('eletric').damage,100);assert.equal(G.getCharacterById('john').damage,80);
});
test('seleção alterna quatro Comuns, dois por equipe, sem Raros automáticos ou repetição',()=>{
 for(let seed=1;seed<=20;seed++){
  let state=seed;const rng=()=>((state=(Math.imul(state,1664525)+1013904223)>>>0)/4294967296);const {sel}=G.createSelection({rng});assert.deepEqual(new Set(sel.offered),new Set(['elysh','stally','mike','alex']));assert.equal(sel.rareAuto,false);
  while(!G.selectionDone(sel)){const side=G.selectionTurn(sel);assert(side==='player'?G.selectionPick(sel,'player',G.selectionAvailable(sel)[0]).ok:G.selectionBotPick(sel).ok);}assert.deepEqual(sel.autoRares,{});
  const teams=G.selectionTeams(sel),ids=[...teams.player.front,...teams.enemy.front];assert.equal(new Set(ids).size,4);
  for(const t of Object.values(teams)){assert.equal(t.front.length,2);assert.equal(G.getCharacterById(t.front[0]).rarity,'COMMON');assert.equal(G.getCharacterById(t.front[1]).rarity,'COMMON');}
  const s=G.createBattleState(teams.player,teams.enemy,[],{rng});assert.equal(Object.values(s.piles).flat().length+s.units.length,31);
  assert(s.units.every(u=>u.row==='front'));assert(!Object.values(s.piles).flat().some(c=>c.id.startsWith('char_')));
 }
});
console.log(`${passed} testes do catálogo oficial passaram`);
