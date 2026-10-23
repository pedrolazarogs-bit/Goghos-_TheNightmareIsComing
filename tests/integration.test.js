// Fluxo completo com as regras atuais: seleção, partida, compras e vitória.
const assert = require('node:assert/strict');
['data/characters','data/support_cards','data/reset_cards','core/battle','core/character_abilities','core/deck','core/support','core/roster','core/official_abilities','core/selection','core/ai'].forEach(f=>require('../js/'+f+'.js'));
require('./fixtures/legacy_catalog.js');
const G = globalThis.GOGHOS;
const seeded = seed => () => {seed|=0;seed=seed+0x6D2B79F5|0;let x=Math.imul(seed^seed>>>15,1|seed);x=x+Math.imul(x^x>>>7,61|x)^x;return((x^x>>>14)>>>0)/4294967296;};
let passed = 0;
function test(name, fn){fn();passed++;console.log('OK  '+name);}

test('seleção mantém quatro escolhas distintas e retaguardas vazias',()=>{
  const choice=G.createSelection({rng:seeded(12)});
  assert(choice.ok);assert.deepEqual(choice.sel.offered,G.CHARACTERS.filter(c=>c.rarity==='COMMON').map(c=>c.id));
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

test('100 partidas de IA terminam em vitória ou empate válido, sem perder cartas ou ultrapassar limites',()=>{
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
      if(s.formation){assert(G.AI.resolveFormation(s).ok);continue;}
      if(s.support.pending){assert(G.resolveBrisa(s,null).ok);continue;}
      if(s.abilityChoices.length){assert(G.AI.resolveCharacterAbility(s).ok);continue;}
      let actor=G.getNextActor(s);
      if(s.result)break;
      if(s.deck.pendingChoice)continue;
      if(s.recovery||s.abilityChoices.length)continue;
      if(!actor&&G.isIdleBattle(s)){
        G.AI.redeemMedals(s,'player');G.AI.redeemMedals(s,'enemy');actor=G.getNextActor(s);
        if(s.result)break;
        if(s.abilityChoices.length||s.deck.pendingChoice||s.recovery||s.formation||s.support.pending)continue;
        if(!actor){const advance=G.advanceIdleCycle(s);assert(advance.ok,`partida ${i}: ${advance.error}; fase ${s.phase}; escolhas ${s.abilityChoices.length}; mão pendente ${!!s.deck.pendingChoice}`);continue;}
      }
      assert(actor,`sem ator na partida ${i}`);
      const result=G.AI.takeTurn(s,actor);
      assert(result.ok,`partida ${i}: ${result.error}`);
      for(const u of s.units){assert.equal(u.maxHp%5,0);assert.equal(u.hp%5,0);assert.equal(u.damage%5,0);}
      for(const hit of G.eventImpacts(s.lastEvent).filter(h=>h.type!=='daly-hit')){
        assert.equal(hit.damage%5,0);assert.equal(hit.beforeHp%5,0);assert.equal(hit.afterHp%5,0);
      }
      for(const side of ['player','enemy']){
        const live=s.units.filter(u=>u.team===side&&u.hp>0&&!u.eliminated);
        assert(live.filter(u=>u.row==='front').length<=3);
        assert(live.filter(u=>u.row==='rear').length<=2);
        assert(live.filter(u=>u.row==='rear').every(u=>u.class==='SUPPORT'));
        if(live.length)assert(live.some(u=>u.row==='front'));
        assert(s.deck.hands[side].length<=5);
        assert(s.daly[side].hp>=0&&s.daly[side].hp<=3);
      }
      for(const e of s.eliminated){
        const dead=G.getUnit(s,e.uid);assert(dead.eliminated&&dead.hp===0&&dead.row===null);
        assert(!s.order.includes(e.uid));assert(!G.RARITIES.flatMap(r=>s.piles[r]).some(c=>c.iid===e.iid));
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
    if(s.result==='draw'){
      assert.equal(s.final.reason,'no-attackers');assert.equal(s.deck.pile.length,0);
      assert(s.daly.player.hp>0&&s.daly.enemy.hp>0);assert(!s.units.some(G.canAct));
      for(const side of ['player','enemy'])assert(!s.deck.hands[side].some(c=>G.getResetCard(c.id).type==='DALY'&&!G.medalBlockReason({...s,result:null},side,c)));
    }else{assert.equal(s.daly[s.final.loser].hp,0);assert(s.daly[s.final.winner].hp>0);}
  }
});
console.log(`${passed} testes de integração passaram`);
