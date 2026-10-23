const assert=require('node:assert/strict');
['data/characters','data/support_cards','data/reset_cards','core/battle','core/character_abilities','core/deck','core/support','core/roster','core/selection','core/ai'].forEach(f=>require('../js/'+f+'.js'));
const G=globalThis.GOGHOS;
let passed=0;
const test=(name,run)=>{run();passed++;console.log('OK  '+name);};
const battle=()=>G.createBattleState({front:['char_02'],rear:[]},{front:['char_03'],rear:[]},[],{rng:()=>.25});
function medal(s,id='daly_01',side='player'){const c={iid:'medal-'+id,id};s.deck.hands[side].push(c);return c;}

test('todos os Comuns participam da seleção, em quatro escolhas alternadas e distintas',()=>{
  const {sel}=G.createSelection({rng:()=>.9});
  assert.deepEqual(sel.offered,G.CHARACTERS.filter(c=>c.rarity==='COMMON').map(c=>c.id));
  assert.equal(G.selectionTeams(sel),null);
  assert(!G.selectionPick(sel,'enemy',sel.offered[0]).ok);
  for(const side of ['player','enemy','player','enemy']){
    assert.equal(G.selectionTurn(sel),side);
    assert(G.selectionPick(sel,side,G.selectionAvailable(sel).at(-1)).ok);
  }
  assert(!G.selectionPick(sel,'player',G.selectionAvailable(sel)[0]).ok);
  const teams=G.selectionTeams(sel);
  assert.equal(new Set([...teams.player.front,...teams.enemy.front]).size,4);
  assert.equal(teams.player.front.length,2);assert.equal(teams.enemy.front.length,2);
  assert.equal(teams.player.rear.length+teams.enemy.rear.length,0);
});

test('a velocidade desce e cada reset compra uma carta por equipe, uma única vez',()=>{
  const s=G.createBattleState({front:['char_02','char_06'],rear:[]},{front:['char_04','char_03'],rear:[]});
  const speeds=s.order.map(uid=>G.getUnit(s,uid).speed);assert.deepEqual(speeds,[5,3,2,1]);
  assert.equal(s.deck.hands.player.length+s.deck.hands.enemy.length,0);
  s.deck.pile=[{iid:'bot-item',id:'item_01'},{iid:'player-medal',id:'daly_03'}];
  s.order.forEach(uid=>s.acted[uid]=true);const units=s.units.length;
  const a=G.getNextActor(s);assert(a);assert.equal(s.round,2);
  assert.equal(s.deck.hands.player[0].id,'daly_03');assert.equal(s.deck.hands.enemy[0].id,'item_01');
  assert.equal(s.units.length,units,'medalha comprada permanece na mão');
  for(let i=0;i<5;i++){G.getNextActor(s);G.onSpeedReset(s);}
  assert.equal(s.deck.hands.player.length,1);assert.equal(s.deck.hands.enemy.length,1);assert.equal(s.round,2);
  assert.deepEqual(new Set(G.RESET_CARDS.filter(c=>G.CONFIG.mainDeckTypes.includes(c.type)).map(c=>c.type)),new Set(['SUPPORT','DALY','SPECIAL','ITEM']));
});

test('as seis cores resgatam exatamente o topo de sua raridade, sem ataque extra',()=>{
  const original=G.CHARACTERS;
  const secret=id=>({...G.getCharacterById('sam'),id,rarity:'SECRET',...G.getCharacterStats({rarity:'SECRET',class:'FIGHTER'})});
  G.CHARACTERS=[...original,...['mythic-test-1','mythic-test-2'].map(id=>({...secret(id),rarity:'MYTHIC'})),secret('secret-test-1'),secret('secret-test-2'),{...G.getCharacterById('char_09'),id:'epic-test'}];
  try{
    const ids={COMMON:['char_04','char_06'],RARE:['char_10','eletric'],EPIC:['char_09','epic-test'],MYTHIC:['mythic-test-1','mythic-test-2'],LEGENDARY:['char_11','sam'],SECRET:['secret-test-1','secret-test-2']};
    const colors=['Azul','Verde','Roxa','Vermelha','Holográfica','Preta'];
    for(const [i,rarity] of G.RARITIES.entries()){
      const s=battle(),c=medal(s,G.MEDAL_ID[rarity]);
      const pile=s.piles[rarity]=ids[rarity].map((id,n)=>({iid:rarity+'-'+n,id}));
      const top=pile.at(-1),bottom=pile[0],order=[...s.order],turn=s.turn;
      const before=G.RARITIES.filter(r=>r!==rarity).map(r=>[r,JSON.stringify(s.piles[r])]);
      assert.equal(G.MEDAL_COLORS[rarity].name,colors[i]);
      const r=G.resolveDalle(s,'player',c);assert(r.ok,r.error);
      assert.equal(G.getUnit(s,r.obtained).iid,top.iid);assert.deepEqual(s.piles[rarity],[bottom]);
      assert.deepEqual(s.order,order);assert.equal(s.turn,turn);assert(!s.order.includes(r.obtained));
      assert(s.deck.discard.some(x=>x.iid===c.iid));assert(!s.deck.hands.player.some(x=>x.iid===c.iid));
      assert(!G.resolveDalle(s,'player',c).ok);
      for(const [other,json] of before)assert.equal(JSON.stringify(s.piles[other]),json);
    }
  }finally{G.CHARACTERS=original;}
});

test('medalhas respeitam a mão cheia: substituir ou descartar a nova não resgata automaticamente',()=>{
  for(const replace of [null,'old-0']){
    const s=battle(),d=s.deck,unitCount=s.units.length;
    d.hands.player=Array.from({length:5},(_,i)=>({iid:'old-'+i,id:'item_01'}));
    d.pile=[{iid:'new-medal',id:'daly_03'}];G.onSpeedReset(s);
    assert.equal(d.hands.player.length,5);assert.equal(d.pendingChoice.incoming.id,'daly_03');assert.equal(s.units.length,unitCount);
    assert.equal(G.getNextActor(s),null);
    assert(G.resolveHandReplacement(s,replace).ok);
    assert.equal(d.hands.player.length,5);assert.equal(s.units.length,unitCount);
    assert.equal(d.hands.player.some(c=>c.iid==='new-medal'),replace!==null);
    assert.equal(d.discard.some(c=>c.iid==='new-medal'),replace===null);
  }
});

test('monte vazio ou topo sem vaga preservam medalha e personagens; só Suportes ocupam a retaguarda',()=>{
  const s=G.createBattleState({front:['char_02','char_06','char_08'],rear:[]},{front:['char_03'],rear:[]});
  const c=medal(s,'daly_02');s.piles.RARE=[];
  assert(!G.resolveDalle(s,'player',c).ok);assert(s.deck.hands.player.includes(c));
  s.piles.RARE=[{iid:'top-mage',id:'eletric'}];
  assert(!G.resolveDalle(s,'player',c).ok);assert.equal(s.piles.RARE[0].iid,'top-mage');assert(s.deck.hands.player.includes(c));
  const common=medal(s);s.piles.COMMON=[{iid:'top-support',id:'char_05'}];
  const r=G.resolveDalle(s,'player',common);assert(r.ok);assert.equal(G.getUnit(s,r.obtained).row,'rear');
  assert.equal(G.getBoard(s).player.front.length,3);assert.equal(G.getBoard(s).player.rear.length,1);
});

function emptyFront(rear=['char_05','char_07']){
  const s=G.createBattleState({front:['char_06'],rear},{front:['char_03'],rear:[]});
  G.eliminateUnit(s,s.units.find(u=>u.team==='player'&&u.row==='front'));return s;
}
test('um único Suporte avança automaticamente, protege a Daly Mãe e não ganha ataque na rodada',()=>{
  const s=emptyFront(['char_05']),u=G.getBoard(s).player.front[0];
  assert(u);assert.equal(u.id,'char_05');assert.equal(s.formation,null);assert(!G.isDalyExposed(s,'player'));
  assert(!s.order.includes(u.uid));assert.equal(G.getNextActor(s).team,'enemy');
});

test('com dois Suportes, o jogador escolhe qualquer um ou ambos e a frente nunca fica vazia',()=>{
  for(const selection of [[0],[1],[0,1]]){
    const s=emptyFront(),p=s.formation;assert(p);assert.equal(G.getBoard(s).player.front.length,1);
    const ids=selection.map(i=>p.candidates[i]);
    assert.equal(G.getNextActor(s),null);assert(!G.resolveFrontLine(s,[]).ok);assert(s.formation);
    const turn=s.turn,round=s.round;
    assert(G.resolveFrontLine(s,ids).ok);assert.equal(s.turn,turn);assert.equal(s.round,round);
    assert.deepEqual(new Set(G.getBoard(s).player.front.map(u=>u.uid)),new Set(ids));
    assert.equal(G.getBoard(s).player.rear.length,2-ids.length);assert(!G.isDalyExposed(s,'player'));
    assert(!s.formation);assert(!G.resolveFrontLine(s,ids).ok);
  }
});

test('um Suporte pode voltar à retaguarda após receber um defensor; outras classes não transitam',()=>{
  const s=G.createBattleState({front:['char_05'],rear:[]},{front:['char_03'],rear:[]});
  const support=G.getBoard(s).player.front[0];assert(!G.performTransit(s,support.uid).ok,'último defensor não pode sair');
  s.piles.COMMON=[{iid:'new-fighter',id:'char_06'}];assert(G.resolveDalle(s,'player',medal(s)).ok);
  assert(G.performTransit(s,support.uid).ok);assert.equal(support.row,'rear');
  assert.equal(G.getBoard(s).player.front.length,1);assert(!G.isDalyExposed(s,'player'));
  const fighter=G.getBoard(s).player.front[0];assert(!G.performTransit(s,fighter.uid).ok);
});

test('troca entre Suportes preserva ações e não deixa a frente vazia',()=>{
  const s=G.createBattleState({front:['char_05','char_02'],rear:['char_07']},{front:['char_03'],rear:[]});
  const a=s.units.find(u=>u.id==='char_05'),b=s.units.find(u=>u.id==='char_07');
  s.acted[a.uid]=true;const acted={...s.acted},order=[...s.order];
  assert(G.performSwap(s,a.uid,b.uid).ok);assert.equal(a.row,'rear');assert.equal(b.row,'front');
  assert.deepEqual(s.acted,acted);assert.deepEqual(s.order,order);assert(!s.order.includes(b.uid));
});

test('personagens eliminados não voltam aos montes, à mão ou à recuperação',()=>{
  const s=battle(),u=G.getBoard(s).player.front[0];
  G.eliminateUnit(s,u);assert(G.openRecovery(s,'player'));
  const r=G.performRecovery(s,'A');assert(r.ok);
  assert(s.eliminated.some(x=>x.iid===u.iid));assert(u.eliminated&&u.hp===0&&u.row===null);
  assert(!G.RARITIES.flatMap(r=>s.piles[r]).some(x=>x.iid===u.iid));assert(!s.order.includes(u.uid));
  assert(!G.getBoard(s).player.front.some(x=>x.iid===u.iid));
});
console.log(`${passed} testes da estrutura base passaram`);
