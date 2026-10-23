const assert=require('node:assert/strict');
['data/characters','data/support_cards','data/reset_cards','core/battle','core/character_abilities','core/deck','core/support','core/roster','core/official_abilities','core/selection','core/ai'].forEach(f=>require('../js/'+f+'.js'));
const G=globalThis.GOGHOS,seeded=seed=>()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
const seen=new Set();
for(let i=0;i<200;i++){
 const rng=seeded(i+7000),{sel}=G.createSelection({rng});G.selectionPick(sel,'player',G.selectionAvailable(sel)[Math.floor(rng()*3)]);G.selectionBotPick(sel);const teams=G.selectionTeams(sel),s=G.createBattleState(teams.player,teams.enemy,[],{rng});let steps=0;
 while(!s.result&&steps++<2500){
  let r;
  if(s.deck.pendingChoice){r=G.resolveHandReplacement(s,null);}
  else if(s.recovery){r=G.AI.resolveRecovery(s);}
  else if(s.formation){r=G.AI.resolveFormation(s);}
  else if(s.support.pending){r=G.resolveBrisa(s,null);}
  else if(s.abilityChoices.length){r=G.AI.resolveCharacterAbility(s);}
  else{
   let actor=G.getNextActor(s);if(s.result)break;if(s.deck.pendingChoice||s.recovery||s.formation||s.support.pending||s.abilityChoices.length)continue;
   if(!actor&&G.isIdleBattle(s)){
    G.AI.redeemMedals(s,'player');G.AI.redeemMedals(s,'enemy');actor=G.getNextActor(s);if(s.result)break;
    if(s.abilityChoices.length||s.deck.pendingChoice||s.recovery||s.formation||s.support.pending)continue;
    if(!actor){r=G.advanceIdleCycle(s);}else r=G.AI.takeTurn(s,actor);
   }else{assert(actor,'sem ator e sem ciclo: '+i);r=G.AI.takeTurn(s,actor);}
  }
  assert(r?.ok,'partida '+i+': '+r?.error+'; '+s.log.slice(-6).join(' / '));
  for(const u of s.units){seen.add(u.id);assert.equal(u.hp%5,0);assert.equal(u.maxHp%5,0);assert.equal(u.damage%5,0);assert(u.hp>=0&&u.hp<=u.maxHp);if(u.eliminated){assert.equal(u.row,null);assert(!s.order.includes(u.uid));}}
  for(const side of ['player','enemy']){const live=s.units.filter(u=>u.team===side&&!G.isCharacterDefeated(u));assert(live.filter(u=>u.row==='front').length<=3);assert(live.filter(u=>u.row==='rear').length<=2);assert(live.filter(u=>u.row==='rear').every(u=>u.class==='SUPPORT'));if(live.length)assert(live.some(u=>u.row==='front'));assert(s.deck.hands[side].length<=5);}
  const chars=[...Object.values(s.piles).flat(),...s.units];assert.equal(chars.length,30);assert.equal(new Set(chars.map(c=>c.iid)).size,30);
  const cards=[...s.deck.pile,...s.deck.hands.player,...s.deck.hands.enemy,...s.deck.discard,...(s.deck.pendingChoice?[s.deck.pendingChoice.incoming]:[])];assert.equal(cards.length,s.deck.total);assert.equal(new Set(cards.map(c=>c.iid)).size,s.deck.total);
 }
 if(!s.result){console.error(JSON.stringify({seed:i,round:s.round,units:s.units.filter(u=>!u.eliminated).map(u=>({id:u.id,hp:u.hp,team:u.team,row:u.row,status:G.officialStatus(s,u)})),log:s.log.slice(-15)},null,2));}
 assert(s.result,'partida oficial '+i+' não terminou');if(s.result==='draw'){assert.equal(s.deck.pile.length,0);assert(!G.hasTimedEffects(s));}else assert.equal(s.daly[s.final.loser].hp,0);
}
assert.equal(seen.size,30,'os 30 personagens devem aparecer nas partidas simuladas');
console.log('200 partidas oficiais concluídas com os 30 personagens, sem perda de cartas, ações inválidas ou formação ilegal');
