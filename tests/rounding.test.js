const assert=require('node:assert/strict');
['data/characters','data/support_cards','data/reset_cards','core/battle','core/deck','core/support','core/roster','core/selection','core/ai','ui/card','ui/arena_ui'].forEach(f=>require('../js/'+f+'.js'));
const G=globalThis.GOGHOS;let passed=0;
const test=(name,run)=>{run();passed++;console.log('OK  '+name);};
const battle=(player=['char_06'],enemy=['char_03'],supports=[])=>G.createBattleState({front:player,rear:[]},{front:enemy,rear:[]},supports,{rng:()=>.5,roll:()=>6});
const unit=(s,id)=>s.units.find(u=>u.id===id);

test('Vida e dano do catálogo sobem até o múltiplo de 5, preservando valores já redondos e demais atributos',()=>{
 const cases=[[0,0],[1,5],[2,5],[3,5],[4,5],[5,5],[6,10],[7,10],[8,10],[9,10],[10,10],[210.1,215],[211,215],[215,215],[216,220],[219,220],[220,220],[-1,0]];
 for(const [value,expected] of cases)assert.equal(G.roundUpToFive(value),expected);
 for(const c of G.CHARACTERS){assert.equal(c.maxHp%5,0);assert.equal(c.damage%5,0);}
 assert.deepEqual([G.getCharacterById('char_03').maxHp,G.getCharacterById('char_03').damage],[220,100]);
 assert.deepEqual([G.getCharacterById('char_06').maxHp,G.getCharacterById('char_06').damage],[180,75]);
 const e=G.getCharacterById('eletric'),j=G.getCharacterById('john'),s=G.getCharacterById('sarck');
 assert.deepEqual([e.maxHp,e.damage,e.speed,e.stamina,G.manaFor(e)],[220,130,3,4,3]);
 assert.deepEqual([j.maxHp,j.damage,j.speed,j.stamina,j.parryThreshold],[270,80,2,3,2]);
 assert.deepEqual([s.maxHp,s.damage,s.speed,s.stamina],[530,0,null,5]);
});

test('previsão, ataque, Vida restante e registro usam o mesmo dano arredondado para cima',()=>{
 for(const [bonus,damage] of [[0,75],[1,80],[2,80],[3,80],[4,80],[5,80],[6,85],[7,85],[8,85],[9,85],[10,85]]){
  const s=battle(),a=unit(s,'char_06'),t=unit(s,'char_03');s.support.nextAttackBonus=bonus;
  assert.equal(G.previewDamage(s,a),damage);const r=G.performBasicAttack(s,a.uid,t.uid);assert(r.ok);
  assert.equal(r.damage,damage);assert.equal(t.hp,220-damage);assert.equal(s.lastEvent.damage,damage);
  assert.equal(s.lastEvent.afterHp,t.hp);assert(s.log.some(line=>line.includes('causou '+damage+' em')));
  assert(G.cardHTML(t).includes(String(t.hp)));assert(G.actorInfoHTML(s,t).includes(t.hp+'<small>/220'));
 }
});

test('área com mana e bônus arredonda uma vez por alvo, sem alterar quantidade de ações',()=>{
 const s=battle(['eletric'],['john','char_03']),a=unit(s,'eletric');s.support.nextAttackBonus=1;
 assert.equal(G.previewDamage(s,a,1),145);assert(G.performAreaAttack(s,a.uid,1).ok);
 assert.equal(unit(s,'john').hp,125);assert.equal(unit(s,'char_03').hp,75);
 assert(s.lastEvent.hits.every(h=>h.damage===145));assert.equal(s.turn,2);assert.equal(a.mana,3);
});

test('Bandeide na mão e no apoio arredonda a soma para cima e respeita a Vida máxima',()=>{
 const card=G.getSupportCard('bandeide'),original=card.value;card.value=81;
 try{for(const hand of [true,false])for(const hp of [100,575]){
  const s=battle(['sam'],['char_03'],hand?[]:['bandeide']),t=unit(s,'sam');t.hp=hp;
  if(hand)s.deck.hands.player.push({iid:'heal',id:'bandeide'});
  const result=hand?G.performHandSupport(s,'heal',t.uid):G.performSupport(s,0,t.uid);assert(result.ok);
  assert.equal(t.hp,hp===100?185:580);assert.equal(t.hp%5,0);assert(t.hp<=t.maxHp);
  assert(s.log.some(line=>line.includes('recuperou '+(hand?'+':'')+(hp===100?85:5)+' de Vida')));
 }}finally{card.value=original;}
});

test('Brisa arredonda a cura para cima, limita a Vida máxima e não ressuscita',()=>{
 const s=battle(['sam'],['char_03']),t=unit(s,'sam');t.hp=100;
 s.support.pending={type:'brisa',value:31,candidates:[t.uid]};assert(G.resolveBrisa(s,t.uid).ok);assert.equal(t.hp,135);
 t.hp=575;s.support.pending={type:'brisa',value:31,candidates:[t.uid]};assert(G.resolveBrisa(s,t.uid).ok);assert.equal(t.hp,580);
 G.eliminateUnit(s,t);s.support.pending={type:'brisa',value:31,candidates:[t.uid]};assert(!G.resolveBrisa(s,t.uid).ok);assert.equal(t.hp,0);
});

test('reações e dano periódico seguem múltiplos de 5, com eliminação ao chegar a zero',()=>{
 const jaw=G.MAIN_ABILITIES.steel_jaw,axe=G.MAIN_ABILITIES.sharp_guitar,oldJaw=jaw.damage,oldAxe=axe.damage;
 try{
  jaw.damage=391;const s=battle(['sam'],['sarck']),a=unit(s,'sam');
  assert.equal(G.reactionPreview(a,unit(s,'sarck')).damage,395);assert(G.performBasicAttack(s,a.uid,unit(s,'sarck').uid).ok);
  assert.equal(a.hp,185);assert.equal(s.lastEvent.reaction.amount,395);assert.equal(s.lastEvent.reaction.damage,395);
  axe.damage=21;const p=battle(['john'],['char_03']),j=unit(p,'john'),t=unit(p,'char_03');
  assert(G.performBasicAttack(p,j.uid,t.uid,0,'pin').ok);assert.equal(t.hp,140);
  assert(G.performPinnedTurn(p,t.uid).ok);assert.equal(t.hp,115);assert.equal(p.lastEvent.ticks[0].amount,25);
  t.hp=25;assert.equal(G.getNextActor(p).uid,j.uid);assert(G.keepPin(p,j.uid).ok);assert.equal(t.hp,0);assert(t.eliminated);assert.equal(j.pinning,null);
 }finally{jaw.damage=oldJaw;axe.damage=oldAxe;}
});

test('golpes fatais continuam em zero e a Daly Mãe mantém três vidas, perdendo uma por ataque',()=>{
 const s=battle(),a=unit(s,'char_06'),t=unit(s,'char_03');t.hp=75;
 assert(G.performBasicAttack(s,a.uid,t.uid).ok);assert.equal(t.hp,0);assert(t.eliminated);assert.equal(s.daly.enemy.hp,3);
 const next=G.getNextActor(s);assert(G.performBasicAttack(s,next.uid,'daly_enemy').ok);assert.equal(s.daly.enemy.hp,2);
 assert.equal(s.lastEvent.damage,1);assert.equal(s.daly.enemy.max,3);
});
console.log(`${passed} testes de arredondamento passaram`);
