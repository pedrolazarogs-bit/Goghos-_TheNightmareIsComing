const assert=require('node:assert/strict');
['data/characters','data/gods','data/support_cards','data/reset_cards','core/battle','core/character_abilities','core/deck','core/support','core/roster','core/official_abilities','core/support_effects','core/divine','core/selection','core/ai'].forEach(f=>require('../js/'+f+'.js'));
const G=GOGHOS;let passed=0;
const test=(name,fn)=>{fn();passed++;console.log('OK  '+name);};
const unit=(s,id)=>s.units.find(u=>u.id===id);
function battle(p=['mike'],e=['john']){
 const s=G.createBattleState({front:p,rear:[]},{front:e,rear:[]},[],{rng:()=>.5,roll:()=>6});
 let guard=0;while(s.abilityChoices.length){assert(guard++<40);assert(G.AI.resolveCharacterAbility(s).ok);}return s;
}
function force(s,a){s.order=[a.uid,...s.order.filter(uid=>uid!==a.uid)];s.acted={};s.speedCursor=a.speed;}
function mustNotRoll(s){s.roll=()=>{throw Error('Parry não deve consumir um dado contra Destruidor.');};}

test('Destruidores ignoram o Parry de qualquer Fighter e raridade, sem rolar sua defesa',()=>{
 for(const attacker of G.CHARACTERS.filter(c=>c.class==='DESTROYER'))for(const targetId of G.CHARACTERS.filter(c=>c.class==='FIGHTER').map(c=>c.id)){
  const s=battle([attacker.id],[targetId]),a=unit(s,attacker.id),t=unit(s,targetId);t.parryThreshold=6;t.hp=t.maxHp=2000;mustNotRoll(s);
  assert.equal(G.parryInfo(a,t),null,attacker.id+' contra '+targetId);
  const hit=G.applyCharacterHit(s,a,t,50);assert.equal(hit.type,'hit');assert.equal(hit.damage,50);assert.equal(t.hp,1950);assert(!hit.parry);
 }
});
test('ataque básico real conserva o crítico do Destruidor e não gasta Sortudo do defensor',()=>{
 const s=battle(),a=unit(s,'mike'),t=unit(s,'john');let calls=0;s.roll=()=>{calls++;return 1;};G.teamSupport(s,'enemy').lucky=1;force(s,a);
 assert(G.performBasicAttack(s,a.uid,t.uid).ok);assert.equal(calls,1,'apenas o d6 de crítico do atacante');
 assert.equal(s.lastEvent.type,'hit');assert.equal(s.lastEvent.critical.critical,true);assert.equal(s.lastEvent.parry,undefined);assert(t.hp<t.maxHp);
 assert.equal(G.teamSupport(s,'enemy').lucky,1);assert(!s.log.some(line=>line.includes('defendeu com Parry')));
});
test('sequências de dois e quatro golpes de Destruidor verificam o bypass em cada golpe',()=>{
 for(const count of [2,4]){
  const s=battle(),a=unit(s,'mike'),t=unit(s,'john');a.damage=45;a.attackCount=count;t.hp=t.maxHp=1000;t.parryThreshold=6;let calls=0;s.roll=()=>{calls++;return 6;};force(s,a);
  const result=G.performBasicAttack(s,a.uid,t.uid);assert(result.ok,result.error);
  assert.equal(calls,count,'cada golpe tem crítico, nenhum tem dado de Parry');assert.equal(s.lastEvent.sequence.resolved,count);
  assert.deepEqual(s.lastEvent.hits.map(h=>h.amount),Array(count).fill(45));assert(s.lastEvent.hits.every(h=>h.type==='hit'&&!h.parry));assert.equal(t.hp,1000-count*45);
 }
});
test('míssil do P. Ullys e sua área lateral também ignoram Parry sem mudar as parcelas',()=>{
 const s=battle(['p_ullys'],['alex','john','stally']),a=unit(s,'p_ullys');a.damage=100;let calls=0;s.roll=()=>{calls++;return 6;};
 for(const t of s.units.filter(u=>u.team==='enemy')){t.hp=t.maxHp=1000;t.parryThreshold=6;}force(s,a);
 assert(G.performBasicAttack(s,a.uid,unit(s,'john').uid).ok);assert.equal(calls,1);
 assert.deepEqual(s.lastEvent.hits.map(h=>[h.targetUid,h.amount]),[[unit(s,'john').uid,100],[unit(s,'alex').uid,20],[unit(s,'stally').uid,20]]);
 assert(s.lastEvent.hits.every(h=>h.type==='hit'&&!h.parry));
});
test('origem de revide Destruidor segue a mesma regra; Sortudo sem rolagem continua guardado',()=>{
 const s=battle(),a=unit(s,'mike'),t=unit(s,'john');G.teamSupport(s,'enemy').lucky=1;mustNotRoll(s);
 const hit=G.applyCharacterHit(s,a,t,50,{kind:'reaction'});assert.equal(hit.type,'hit');assert.equal(hit.damage,50);assert.equal(G.teamSupport(s,'enemy').lucky,1);
});
test('classes sem Destroyer continuam sujeitas ao Parry, inclusive nos quatro braços do DD-X',()=>{
 for(const attackerId of ['eletric','john','elysh','cavaleiro','penxy']){
  const s=battle([attackerId],['stally']),a=unit(s,attackerId),t=unit(s,'stally');let calls=0;s.roll=()=>{calls++;return 1;};
  assert(G.parryInfo(a,t));assert.equal(G.applyCharacterHit(s,a,t,50).type,'parry');assert.equal(t.hp,t.maxHp);assert.equal(calls,1);
 }
 const s=battle(['ddx'],['john']),a=unit(s,'ddx'),t=unit(s,'john');let calls=0;s.roll=()=>{calls++;return 1;};force(s,a);
 assert(G.performBasicAttack(s,a.uid,t.uid,0,'double').ok);assert.equal(calls,4);assert.deepEqual(s.lastEvent.hits.map(h=>h.type),['parry','parry','parry','parry']);assert.equal(t.hp,t.maxHp);
});
test('silenciar o atacante não remove seu tributo de classe e MAX inclui Destroyer',()=>{
 const s=battle(),a=unit(s,'mike'),t=unit(s,'john');a.silenceRemaining=3;assert.equal(G.parryInfo(a,t),null);
 const god={...G.getCharacterById('zenneriam'),team:'player'};assert(G.hasClass(god,'DESTROYER'));assert.equal(G.parryInfo(god,t),null);
});
test('escudo, invulnerabilidade e esquiva permanecem: a exceção remove somente Parry',()=>{
 let s=battle(),a=unit(s,'mike'),t=unit(s,'john');t.shield=80;mustNotRoll(s);assert.equal(G.applyCharacterHit(s,a,t,100).damage,20);assert.equal(t.shield,0);
 s=battle();a=unit(s,'mike');t=unit(s,'john');t.invulnerable=2;mustNotRoll(s);assert.equal(G.applyCharacterHit(s,a,t,100).type,'immune');assert.equal(t.hp,t.maxHp);
 s=battle(['mike'],['trucc']);a=unit(s,'mike');t=unit(s,'trucc');s.roll=()=>6;assert.equal(G.applyCharacterHit(s,a,t,100).type,'dodge');assert.equal(t.hp,t.maxHp);
});
test('a resolução legada também ignora Parry, mantendo o caminho histórico coerente',()=>{
 const s=battle(),a=unit(s,'mike'),t=unit(s,'john'),official=G.officialApplyHit;mustNotRoll(s);
 try{G.officialApplyHit=null;const hit=G.applyCharacterHit(s,a,t,50);assert.equal(hit.type,'hit');assert.equal(hit.damage,50);assert(!hit.parry);}finally{G.officialApplyHit=official;}
});
console.log(`${passed} testes de Destruidor contra Parry passaram`);
