// Fluxo completo com as regras atuais: seleção, partida, compras e vitória.
const assert = require('node:assert/strict');
['data/characters','data/support_cards','data/reset_cards','core/battle','core/deck','core/support','core/roster','core/selection','core/ai'].forEach(f=>require('../js/'+f+'.js'));
const G = globalThis.GOGHOS;
const seeded = seed => () => {seed|=0;seed=seed+0x6D2B79F5|0;let x=Math.imul(seed^seed>>>15,1|seed);x=x+Math.imul(x^x>>>7,61|x)^x;return((x^x>>>14)>>>0)/4294967296;};
let passed = 0;
function test(name, fn){fn();passed++;console.log('OK  '+name);}

test('seleção mantém quatro escolhas distintas e retaguardas vazias',()=>{
  const choice=G.createSelection({rng:seeded(12)});
  assert(choice.ok);assert.equal(choice.sel.offered.length,5);
  const sel=choice.sel;
  while(!G.selectionDone(sel)){
    if(G.selectionTurn(sel)==='player')assert(G.selectionPick(sel,'player',G.selectionAvailable(sel)[0]).ok);
    else assert(G.selectionBotPick(sel).ok);
  }
  const teams=G.selectionTeams(sel);
  assert.equal(new Set([...teams.player.front,...teams.enemy.front]).size,4);
  assert.equal(teams.player.front.length,2);assert.equal(teams.enemy.front.length,2);
  assert.equal(teams.player.rear.length+teams.enemy.rear.length,0);
});

test('Daly Mãe perde uma vida por ataque e permite recuperação antes do golpe final',()=>{
  const s=G.createBattleState({front:['sam','char_05'],rear:[]},{front:['char_02','char_06'],rear:[]},[],{rng:seeded(21)});
  s.units.filter(u=>u.team==='enemy').forEach(u=>G.eliminateUnit(s,u));
  const a=G.getNextActor(s);
  assert.equal(a.team,'player');
  const r=G.performBasicAttack(s,a.uid,G.dalyTargetId('enemy'));
  assert(r.ok);assert.equal(s.daly.enemy.hp,2);
  assert.equal(r.damage,0);assert(!G.performBasicAttack(s,a.uid,G.dalyTargetId('enemy')).ok);
  if(s.recovery){
    const available=s.recovery.options.find(o=>o.available);
    assert(available);const recovered=G.performRecovery(s,available.id);
    assert(recovered.ok);assert.equal(recovered.units.length,available.drawCount);
    assert(recovered.units.every(id=>G.getUnit(s,id).row==='front'));
  }
});

test('100 partidas de IA terminam sem perder cartas ou ultrapassar os limites da formação e da mão',()=>{
  for(let i=0;i<100;i++){
    const selection=G.createSelection({rng:seeded(i+1000)}).sel;
    while(!G.selectionDone(selection)){
      if(G.selectionTurn(selection)==='player')G.selectionPick(selection,'player',G.selectionAvailable(selection)[0]);
      else G.selectionBotPick(selection);
    }
    const teams=G.selectionTeams(selection);
    const s=G.createBattleState(teams.player,teams.enemy,[],{rng:seeded(i+5000)});
    let steps=0;
    while(!s.result&&steps++<3000){
      if(s.deck.pendingChoice){assert(G.resolveHandReplacement(s,null).ok);continue;}
      if(s.recovery){assert(G.AI.resolveRecovery(s).ok);continue;}
      if(s.support.pending){assert(G.resolveBrisa(s,null).ok);continue;}
      const actor=G.getNextActor(s);
      if(s.deck.pendingChoice)continue;
      if(s.recovery)continue;
      assert(actor,`sem ator na partida ${i}`);
      const result=G.AI.takeTurn(s,actor);
      assert(result.ok,`partida ${i}: ${result.error}`);
      for(const side of ['player','enemy']){
        const live=s.units.filter(u=>u.team===side&&u.hp>0&&!u.eliminated);
        assert(live.filter(u=>u.row==='front').length<=3);
        assert(live.filter(u=>u.row==='rear').length<=2);
        assert(live.filter(u=>u.row==='rear').every(u=>u.class==='SUPPORT'));
        if(live.length)assert(live.some(u=>u.row==='front'));
        assert(s.deck.hands[side].length<=5);
        assert(s.daly[side].hp>=0&&s.daly[side].hp<=3);
      }
      const characters=[...G.RARITIES.flatMap(r=>s.piles[r]),...s.units];
      assert.equal(characters.length,G.CHARACTERS.reduce((sum,c)=>sum+(c.copies||1),0));
      assert.equal(new Set(characters.map(c=>c.iid)).size,characters.length);
      const cards=[...s.deck.pile,...s.deck.hands.player,...s.deck.hands.enemy,...s.deck.discard,...(s.deck.pendingChoice?[s.deck.pendingChoice.incoming]:[])];
      assert.equal(cards.length,s.deck.total);
      assert.equal(new Set(cards.map(c=>c.iid)).size,s.deck.total);
    }
    assert(s.result,`partida ${i} não terminou`);
    assert(steps<3000);
    assert.equal(s.daly[s.final.loser].hp,0);
    assert(s.daly[s.final.winner].hp>0);
  }
});
console.log(`${passed} testes de integração passaram`);
