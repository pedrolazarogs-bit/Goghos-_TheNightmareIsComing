const assert=require('node:assert/strict');
['data/characters','data/support_cards','data/reset_cards','core/battle','core/character_abilities','core/deck','core/support','core/roster','core/ai','ui/match_ui','ui/arena_ui'].forEach(f=>require('../js/'+f+'.js'));
const G=globalThis.GOGHOS;
let passed=0;
const test=(name,run)=>{run();passed++;console.log('OK  '+name);};
function setup(side='player',opponents=['char_02','char_12','char_04'],rescued=['char_05','char_07','char_06']){
  const teams={player:{front:['char_03'],rear:[]},enemy:{front:opponents,rear:[]}};
  if(side==='enemy')[teams.player,teams.enemy]=[teams.enemy,teams.player];
  const s=G.createBattleState(teams.player,teams.enemy,[],{rng:()=>.5,roll:()=>6});
  const cards=rescued.map(id=>G.claimCharacter(s,id));
  for(const r of G.RARITIES)s.piles[r]=[];
  s.piles.COMMON=cards;
  G.getBoard(s)[side].front.forEach(u=>G.eliminateUnit(s,u));
  return s;
}
function hitDaly(s,side='player'){
  const actor=G.getNextActor(s);
  assert(G.performBasicAttack(s,actor.uid,'daly_'+side).ok);
  assert(s.recovery);assert.equal(G.getNextActor(s),null);
  return actor;
}
function remaining(s){return s.order.map(uid=>G.getUnit(s,uid)).filter(u=>G.canAct(u)&&!s.acted[u.uid]).map(u=>[u.team,u.speed]);}

test('resgate após velocidade 5 continua no 5, depois intercala os 4 e os demais sem reset',()=>{
  for(const side of ['player','enemy']){
    const s=setup(side),attacker=hitDaly(s,side),round=s.round,turn=s.turn,deck=JSON.stringify(s.deck),acted={...s.acted};
    const r=side==='player'?G.performRecovery(s,'A'):G.AI.resolveRecovery(s);assert(r.ok);
    assert.equal(s.round,round);assert.equal(s.turn,turn);assert.deepEqual(s.acted,acted);assert.equal(JSON.stringify(s.deck),deck);
    assert.deepEqual(remaining(s),[[side,5],['player',4],['enemy',4],[side,3],[side==='player'?'enemy':'player',2]]);
    const next=G.getNextActor(s);assert.equal(next.team,side);assert.equal(next.speed,5);
    assert.equal(G.turnPreview(s,next).upcoming.speed,4);
    assert(!G.performBasicAttack(s,attacker.uid,next.uid).ok,'o atacante da Daly não repete a ação');
    const target=G.AI.chooseTarget(s,next);assert(G.performBasicAttack(s,next.uid,target.uid).ok);
    assert(!G.performBasicAttack(s,next.uid,target.uid).ok,'o resgatado só age uma vez');
    assert.equal(G.getNextActor(s).team,'player');assert.equal(G.getNextActor(s).speed,4);
    for(const [team,speed] of [['player',4],['enemy',4],[side,3],[side==='player'?'enemy':'player',2]]){
      const a=G.getNextActor(s);assert.equal(a.team,team);assert.equal(a.speed,speed);a.damage=0;
      assert(G.performBasicAttack(s,a.uid,G.AI.chooseTarget(s,a).uid).ok);
      assert.equal(s.round,round);
    }
    assert(G.getNextActor(s));assert.equal(s.round,round+1);
  }
});

test('resgatado de velocidade 4 age antes do adversário de 4 e 2 após ataque de 5',()=>{
  const s=setup('player',undefined,['char_07']);hitDaly(s);
  const r=G.performRecovery(s,'A');assert(r.ok);
  assert.equal(G.getNextActor(s).uid,r.units[0]);
  assert.deepEqual(remaining(s),[['player',4],['enemy',4],['enemy',2]]);
  assert(G.recoveryHTML({...s,recovery:{side:'player'}}).includes('velocidade 5'));
});

test('velocidade já ultrapassada espera o próximo ciclo, sem atrasar quem ainda pode agir',()=>{
  const s=setup('player',['char_12','char_04']);hitDaly(s);
  const r=G.performRecovery(s,'A');assert(r.ok);
  const fast=G.getUnit(s,r.units.find(uid=>G.getUnit(s,uid).speed===5));
  assert(!s.order.includes(fast.uid));
  assert.deepEqual(remaining(s),[['player',4],['player',3],['enemy',2]]);
  s.order.forEach(uid=>s.acted[uid]=true);
  const round=s.round;assert.equal(G.getNextActor(s).uid,fast.uid);assert.equal(s.round,round+1);
});

test('último atacante não dispara reset enquanto houver resgatado elegível na rodada',()=>{
  const s=setup('player',['char_02'],['char_07']);hitDaly(s);
  const round=s.round,deck=JSON.stringify(s.deck);assert(G.performRecovery(s,'A').ok);
  for(let i=0;i<4;i++){assert.equal(G.getNextActor(s).speed,4);assert.equal(s.round,round);}
  assert.equal(JSON.stringify(s.deck),deck);
});

test('quando todos os resgatados são mais rápidos, o reset compra uma vez e limpa a velocidade anterior',()=>{
  const s=setup('player',['char_08'],['char_07']);hitDaly(s);
  const round=s.round;assert(G.performRecovery(s,'A').ok);
  s.deck.pile=[{iid:'enemy-draw',id:'item_01'},{iid:'player-draw',id:'item_02'}];
  const actor=G.getNextActor(s);assert.equal(actor.speed,4);assert.equal(s.round,round+1);assert.equal(s.speedCursor,null);
  assert.equal(s.deck.hands.player.length,1);assert.equal(s.deck.hands.enemy.length,1);
  for(let i=0;i<4;i++)assert.equal(G.getNextActor(s).uid,actor.uid);
  assert.equal(s.round,round+1);assert.equal(s.deck.pile.length,0);
});

test('resgate repetido ou inválido não duplica a fila nem consome ações',()=>{
  const s=setup();hitDaly(s);const before=JSON.stringify(s.order);
  assert(!G.performRecovery(s,'C').ok);assert.equal(JSON.stringify(s.order),before);
  assert(G.performRecovery(s,'A').ok);const snapshot=JSON.stringify(s);
  assert(!G.performRecovery(s,'A').ok);assert.equal(JSON.stringify(s),snapshot);
  assert.equal(new Set(s.order).size,s.order.length);
});

test('a velocidade salva acompanha ataques reais e consultas da interface não a alteram',()=>{
  const s=G.createBattleState({front:['char_03'],rear:[]},{front:['char_10','char_12','char_04'],rear:[]},[],{rng:()=>.5});
  const target=G.getBoard(s).player.front[0],fast=G.getNextActor(s);
  assert.equal(s.speedCursor,null);assert.equal(fast.speed,6);
  assert(G.performBasicAttack(s,fast.uid,target.uid).ok);assert.equal(s.speedCursor,6);
  const next=G.getNextActor(s);assert.equal(next.speed,4);
  G.turnPreview(s,next);assert.equal(s.speedCursor,6);
  G.eliminateUnit(s,target);hitDaly(s);assert.equal(s.speedCursor,4);
  assert(G.performRecovery(s,'A').ok);
  assert(remaining(s).every(([,speed])=>speed<=4));
});
console.log(`${passed} testes da hierarquia após recuperação passaram`);
