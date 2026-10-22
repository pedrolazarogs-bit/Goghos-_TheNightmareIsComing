const assert = require('assert');
[
  'data/characters','data/support_cards','data/reset_cards','core/battle','core/deck','core/support','core/roster','core/selection','core/ai'
].forEach(f => require('../js/' + f + '.js'));
const G = globalThis.GOGHOS;
let passed = 0;
function test(name, fn) { fn(); passed++; console.log('OK  ' + name); }
const P = { front: ['char_10','char_06'], rear: [] };
const E = { front: ['char_03','char_08'], rear: [] };

test('vida e dano de todos os personagens respeitam as faixas da raridade', () => {
  for (const c of G.CHARACTERS) {
    const hp = G.RARITY_HP[c.rarity];
    const dmg = G.RARITY_DAMAGE[c.rarity];
    assert(c.maxHp >= hp.min && c.maxHp <= hp.max, `${c.id} Vida ${c.maxHp} fora de ${c.rarity}`);
    assert(c.damage >= dmg.min && c.damage <= dmg.max, `${c.id} Dano ${c.damage} fora de ${c.rarity}`);
  }
});

test('perfil de classe ajusta dano dentro da faixa e respeita a ordem de dano', () => {
  const stats = cls => G.getCharacterStats({class: cls, rarity:'COMMON'}).damage;
  assert(stats('SUPPORT') < stats('ASSASSIN'));
  assert(stats('ASSASSIN') < stats('FIGHTER'));
  assert(stats('FIGHTER') < stats('TANK'));
  assert(stats('TANK') < stats('MAGO'));
  assert.strictEqual(stats('MAGO'), stats('DESTROYER'));
});

test('todo Mago começa com 3/3 de mana e outras classes não têm mana', () => {
  assert.strictEqual(G.manaFor({class:'MAGO',rarity:'COMMON'}), 3);
  assert.strictEqual(G.manaFor({class:'MAGO',rarity:'SECRET'}), 3);
  assert.strictEqual(G.manaFor({class:'FIGHTER',rarity:'LEGENDARY'}), 0);
  const s = G.createBattleState(P,E,[]);
  const mage = s.units.find(u => u.class === 'MAGO');
  assert.strictEqual(mage.mana, 3); assert.strictEqual(mage.maxMana, 3);
});

test('Mago gasta mana no ataque e recupera +1 no fim da ação, nunca passando de 3', () => {
  const s = G.createBattleState(P,E,[]), actor = G.getNextActor(s), target = s.units.find(u=>u.team==='enemy'&&u.row==='front');
  assert.strictEqual(actor.class, 'MAGO');
  const before = target.hp;
  const r = G.performBasicAttack(s, actor.uid, target.uid, 2);
  assert(r.ok); assert.strictEqual(target.hp, Math.max(0,before-(actor.damage+2*G.CONFIG.manaDamagePerPoint)));
  assert.strictEqual(actor.mana, 2); assert(actor.mana <= 3);
  assert(s.log.some(line=>line.includes('Mana ·')));
});

test('mão limita a 5 e compra com mão cheia permite substituir uma carta', () => {
  const s = G.createBattleState(P,E,[]), d=s.deck;
  d.hands.player = ['item_01','item_02','habilidade_01','habilidade_02','na_moloeira'].map((id,i)=>({iid:'old'+i,id}));
  d.pile = [{iid:'incoming-1',id:'bandeide'}]; d.total = 1; d.resets.clear();
  G.onSpeedReset(s);
  assert.strictEqual(d.hands.player.length,5); assert(d.pendingChoice);
  assert.strictEqual(d.pendingChoice.incoming.id,'bandeide');
  assert.strictEqual(G.getNextActor(s),null,'a ação deve pausar enquanto a substituição está pendente');
  const r=G.resolveHandReplacement(s,'old1');
  assert(r.ok&&r.replaced); assert.strictEqual(d.hands.player.length,5);
  assert(d.hands.player.some(c=>c.id==='bandeide')); assert(d.discard.some(c=>c.iid==='old1'));
});

test('mão cheia também permite descartar a nova compra sem perder cartas antigas', () => {
  const s = G.createBattleState(P,E,[]), d=s.deck;
  d.hands.player = ['item_01','item_02','habilidade_01','habilidade_02','na_moloeira'].map((id,i)=>({iid:'full'+i,id}));
  d.pile = [{iid:'incoming-2',id:'brisa'}]; d.total=1; d.resets.clear(); G.onSpeedReset(s);
  assert(G.resolveHandReplacement(s,null).ok); assert.strictEqual(d.hands.player.length,5);
  assert(!d.hands.player.some(c=>c.iid==='incoming-2')); assert(d.discard.some(c=>c.iid==='incoming-2'));
});

test('cartas de Apoio fazem parte do monte principal e podem ser usadas da mão', () => {
  const support = G.RESET_CARDS.filter(c=>c.type==='SUPPORT');
  const allInMain = G.RESET_CARDS.filter(c=>G.CONFIG.mainDeckTypes.includes(c.type));
  assert(support.length>0); assert(support.every(c=>allInMain.some(x=>x.id===c.id)));
  const s=G.createBattleState(P,E,[]); s.deck.hands.player.push({iid:'played-support',id:'na_moloeira'});
  assert(G.performHandSupport(s,'played-support').ok);
  assert.strictEqual(s.support.nextAttackBonus,20);
  assert(!s.deck.hands.player.some(c=>c.iid==='played-support'));
  assert(s.deck.discard.some(c=>c.iid==='played-support'));
});

test('formação limita linha de frente a 3 e retaguarda a 2 Supports', () => {
  const badFront={front:['sam','char_02','char_03','char_04'],rear:[]};
  assert.throws(()=>G.createBattleState(badFront,E,[]),/no máximo 3/i);
  const badRear={front:['sam'],rear:['char_05','char_07','char_09']};
  assert.throws(()=>G.createBattleState(badRear,E,[]),/no máximo 2/i);
  const nonSupportRear={front:['sam'],rear:['char_02']};
  assert.throws(()=>G.createBattleState(nonSupportRear,E,[]),/SUPPORT/i);
});

console.log(`${passed} testes da v0.14.0 passaram`);
