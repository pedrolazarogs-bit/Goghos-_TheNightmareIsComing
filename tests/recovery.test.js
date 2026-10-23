const assert=require('node:assert/strict');
['data/characters','data/support_cards','data/reset_cards','core/battle','core/character_abilities','core/deck','core/support','core/roster','core/ai','ui/match_ui'].forEach(f=>require('../js/'+f+'.js'));
const G=globalThis.GOGHOS;
let passed=0;
const test=(name,run)=>{run();passed++;console.log('OK  '+name);};
// Estado após a eliminação da equipe, com montes controlados e ataque real à Daly Mãe.
function exposed(side='player',counts={COMMON:2,RARE:1,EPIC:0}){
  const s=G.createBattleState({front:['char_02','char_03'],rear:[]},{front:['char_04','char_05'],rear:[]},[],{rng:()=>.5});
  s.units.filter(u=>u.team===side).forEach(u=>G.eliminateUnit(s,u));
  for(const r of G.RARITIES)s.piles[r]=s.piles[r].slice(0,counts[r]||0);
  const a=G.getNextActor(s);
  assert(G.performBasicAttack(s,a.uid,G.dalyTargetId(side)).ok);
  return s;
}

test('2 Comuns, 1 Raro e 0 Épicos permitem receber 2 ou 1; só o monte vazio fica bloqueado',()=>{
  for(const [option,rarity,amount] of [['A','COMMON',2],['B','RARE',1]]){
    const s=exposed(),before=G.RARITIES.flatMap(r=>s.piles[r]).map(c=>c.iid).sort();
    const options=G.recoveryOptions(s);
    assert.deepEqual(options.map(o=>[o.drawCount,o.available]),[[2,true],[1,true],[0,false]]);
    const html=G.recoveryHTML(s);
    assert(html.includes('A · 2 Comuns'));assert(html.includes('B · 1 Raro'));
    assert(html.includes('data-act="recover-C" disabled'));
    assert.equal(G.getNextActor(s),null);assert.equal(s.daly.player.hp,2);
    const recovered=G.performRecovery(s,option);
    assert(recovered.ok);assert.equal(recovered.units.length,amount);assert.equal(s.piles[rarity].length,0);
    assert(recovered.units.every(uid=>{const u=G.getUnit(s,uid);return u.team==='player'&&u.rarity===rarity&&u.row==='front';}));
    const after=[...G.RARITIES.flatMap(r=>s.piles[r]).map(c=>c.iid),...recovered.units.map(uid=>G.getUnit(s,uid).iid)].sort();
    assert.deepEqual(after,before,'recuperação não perde nem duplica cartas');
    assert(!s.recovery);assert(!G.isDalyExposed(s,'player'));assert.equal(s.daly.player.hp,2);
    assert(!G.performRecovery(s,option).ok,'clique repetido não compra novamente');
  }
});

test('recuperação respeita o máximo de cada raridade e aceita até uma única carta restante',()=>{
  for(const [option,rarity,max] of [['A','COMMON',3],['B','RARE',2],['C','EPIC',1]]){
    for(let have=1;have<=max;have++){
      const s=exposed('player',{[rarity]:have});
      const recovered=G.performRecovery(s,option);
      assert(recovered.ok);assert.equal(recovered.units.length,have);
      assert(G.getBoard(s).player.front.length<=3);
    }
  }
});

test('montes vazios não prendem a partida e a última vida encerra sem recuperação',()=>{
  const s=exposed('player',{});
  assert(!s.recovery);assert(G.getNextActor(s));assert(G.isDalyExposed(s,'player'));
  s.daly.player.hp=1;
  const a=G.getNextActor(s);assert(G.performBasicAttack(s,a.uid,'daly_player').ok);
  assert.equal(s.result,'defeat');assert.equal(s.daly.player.hp,0);assert(!s.recovery);
  assert.equal(G.getNextActor(s),null);
});

test('opção vazia preserva a escolha e a IA também recupera lotes incompletos',()=>{
  const s=exposed();assert(!G.performRecovery(s,'C').ok);
  assert.equal(s.recovery.status,'open');assert.equal(s.piles.COMMON.length,2);
  const bot=exposed('enemy',{COMMON:1});
  const r=G.AI.resolveRecovery(bot);assert(r.ok);assert.equal(r.units.length,1);assert(!bot.recovery);
  assert.equal(G.getUnit(bot,r.units[0]).team,'enemy');
});

test('mão cheia após recuperar pausa a rodada e retoma sem compra duplicada',()=>{
  const s=exposed('player',{RARE:1});assert(G.performRecovery(s,'B').ok);
  s.order.forEach(uid=>s.acted[uid]=true);
  const d=s.deck;d.hands.player=Array.from({length:5},(_,i)=>({iid:'old'+i,id:'item_01'}));
  d.pile=[{iid:'incoming',id:'bandeide'}];
  const round=s.round;
  assert.equal(G.getNextActor(s),null,'o reset deve aguardar a escolha que acabou de abrir');
  assert(d.pendingChoice);assert.equal(s.round,round+1);
  assert.equal(G.getNextActor(s),null);assert.equal(s.round,round+1);
  assert(G.resolveHandReplacement(s,'old0').ok);
  assert(G.getNextActor(s));assert.equal(s.round,round+1);assert.equal(d.hands.player.length,5);
  assert.equal(d.hands.player.filter(c=>c.iid==='incoming').length,1);
});

test('Brisa pendente também pausa a ordem antes de comprar cartas',()=>{
  const s=G.createBattleState({front:['char_02','char_03'],rear:[]},{front:['char_04','char_05'],rear:[]});
  s.order.forEach(uid=>s.acted[uid]=true);
  const round=s.round,count=s.deck.pile.length;
  s.support.pending={candidates:[s.units[0].uid],value:30};
  assert.equal(G.getNextActor(s),null);assert.equal(s.round,round);assert.equal(s.deck.pile.length,count);
  assert(G.resolveBrisa(s,null).ok);assert(G.getNextActor(s));assert.equal(s.round,round+1);
});
test('recuperação retira o topo do monte embaralhado e preserva a ordem das cartas restantes',()=>{
  const s=G.createBattleState({front:['sam'],rear:[]},{front:['eletric'],rear:[]});
  G.eliminateUnit(s,G.getBoard(s).player.front[0]);
  const actor=G.getNextActor(s);assert(G.performBasicAttack(s,actor.uid,'daly_player').ok);
  const pile=s.piles.COMMON,before=[...pile],top=before.slice(-3).map(c=>c.iid);
  const r=G.performRecovery(s,'A');assert(r.ok);
  assert.deepEqual(new Set(r.units.map(uid=>G.getUnit(s,uid).iid)),new Set(top));
  assert.deepEqual(pile,before.slice(0,-3));
});
console.log(`${passed} testes da recuperação passaram`);
