// Natural dodge and the one-use rear support action use the live 0.32 rules.
const assert=require('node:assert/strict');
['data/characters','data/gods','data/support_cards','data/reset_cards','core/battle','core/character_abilities','core/deck','core/support','core/roster','core/official_abilities','core/support_effects','core/divine','core/selection','core/ai'].forEach(f=>require('../js/'+f+'.js'));
const G=GOGHOS;let passed=0;const test=(name,run)=>{run();passed++;console.log('OK  '+name);};
const u=(s,id)=>s.units.find(x=>x.id===id);
const battle=(p=['striker'],e=['nully'],pr=[],er=[])=>G.createBattleState({front:p,rear:pr},{front:e,rear:er},[],{rng:()=>.5,roll:()=>6});
function choices(s){let tries=0;while(s.abilityChoices.length){assert(tries++<40);assert(G.AI.resolveCharacterAbility(s).ok);}}
function force(s,id){choices(s);const a=u(s,id);s.order=[a.uid,...s.order.filter(x=>x!==a.uid)];s.acted={};s.speedCursor=null;assert.equal(G.getNextActor(s)?.uid,a.uid);return a;}

test('diferenças naturais de 6 ou mais mantêm cinco faces de esquiva e deixam o 6 acertar',()=>{
 for(const difference of [6,9,20])for(let roll=1;roll<=6;roll++){
  const s=battle(),a=u(s,'striker'),t=u(s,'nully');t.speed=a.speed+difference;s.roll=()=>roll;
  const info=G.dodgeInfo(a,t);assert.equal(info.diff,5);assert.equal(info.threshold,5);assert.equal(info.speedDifference,difference);
  const before=t.hp,hit=G.applyCharacterHit(s,a,t,25);
  assert.equal(hit.type,roll<=5?'dodge':'hit');assert.equal(t.hp,roll<=5?before:before-25);
 }
});
test('diferenças menores continuam proporcionais; empates, Magos e impedimentos não ganham esquiva',()=>{
 for(const difference of [0,1,3,5]){
  const s=battle(),a=u(s,'striker'),t=u(s,'nully');t.speed=a.speed+difference;
  assert.equal(G.dodgeInfo(a,t)?.diff||0,difference);
 }
 const s=battle(['eletric'],['nully']),a=u(s,'eletric'),t=u(s,'nully');
 assert.equal(G.dodgeInfo(a,t),null);s.roll=()=>{throw Error('Mago não deve rolar esquiva natural.');};
 assert.equal(G.applyCharacterHit(s,a,t,25).type,'hit');
 const p=battle(),attacker=u(p,'striker'),target=u(p,'nully');target.paralysis=2;
 assert.equal(G.dodgeInfo(attacker,target),null);p.roll=()=>{throw Error('Alvo impedido não reage.');};assert.equal(G.applyCharacterHit(p,attacker,target,25).type,'hit');
});
test('o caminho legado aplica o mesmo teto e a proteção própria de Striker permanece',()=>{
 const official=G.officialApplyHit;
 try{
  G.officialApplyHit=null;
  for(let roll=1;roll<=6;roll++){
   const s=battle(),a=u(s,'striker'),t=u(s,'nully');s.roll=()=>roll;
   const hit=G.applyCharacterHit(s,a,t,25);assert.equal(hit.type,roll<=5?'dodge':'hit');assert.equal(hit.roll,roll);assert.equal(G.dodgeInfo(a,t).diff,5);
  }
 }finally{G.officialApplyHit=official;}
 const s=battle(['nully'],['striker']),a=u(s,'nully'),t=u(s,'striker');assert(!G.attackTargets(s,a).includes(t));
});
test('Sortudo continua pertencendo ao dado do defensor e só é gasto quando há teste de esquiva',()=>{
 const s=battle(),a=u(s,'striker'),t=u(s,'nully');G.teamSupport(s,'enemy').lucky=1;
 s.roll=()=>{throw Error('Sortudo deve resolver o próximo dado sem rolar aleatoriamente.');};
 assert.equal(G.applyCharacterHit(s,a,t,25).type,'dodge');assert.equal(G.teamSupport(s,'enemy').lucky,0);
 G.teamSupport(s,'player').lucky=1;s.roll=()=>6;assert.equal(G.applyCharacterHit(s,a,t,25).type,'hit');assert.equal(G.teamSupport(s,'player').lucky,1);
 const mage=battle(['eletric'],['nully']);G.teamSupport(mage,'enemy').lucky=1;mage.roll=()=>{throw Error('Mago não exige dado de esquiva.');};
 assert.equal(G.applyCharacterHit(mage,u(mage,'eletric'),u(mage,'nully'),25).type,'hit');assert.equal(G.teamSupport(mage,'enemy').lucky,1);
});
test('Trucc conserva o teste próprio de acerto 1 e Magos continuam ignorando esse teste',()=>{
 for(let roll=1;roll<=6;roll++){
  const s=battle(['striker'],['trucc']),a=u(s,'striker'),t=u(s,'trucc');s.roll=()=>roll;
  assert.equal(G.dodgeInfo(a,t).special,true);
  assert.equal(G.applyCharacterHit(s,a,t,25).type,roll===1?'hit':'dodge');
 }
 const s=battle(['eletric'],['trucc']),a=u(s,'eletric'),t=u(s,'trucc');s.roll=()=>{throw Error('Mago ignora o teste de Trucc.');};
 assert.equal(G.applyCharacterHit(s,a,t,25).type,'hit');
});
test('Zuri entra na ordem da retaguarda e sua cura única gasta uma ação sem curar a si mesma',()=>{
 const s=battle(['mike'],['cavaleiro'],['zuri','elysh']),a=u(s,'zuri'),front=u(s,'mike'),rear=u(s,'elysh');
 assert(s.order.includes(a.uid));assert(G.canUseRearAbility(a));assert(G.canAct(a));assert.equal(G.canAttackFrom(a),false);
 a.hp=300;front.hp=20;rear.hp=30;force(s,'zuri');const turn=s.turn,round=s.round,deck=s.deck.pile.length;
 assert(G.performFullHeal(s,a.uid).ok);assert.equal(front.hp,front.maxHp);assert.equal(rear.hp,rear.maxHp);assert.equal(a.hp,300);assert.equal(a.row,'rear');
 assert.equal(s.turn,turn+1);assert.equal(s.round,round);assert.equal(s.deck.pile.length,deck);assert.equal(a.actionsTaken,1);assert(a.fullHealUsed);assert(!G.canUseRearAbility(a));assert(!G.canAct(a));
 assert(!G.performFullHeal(s,a.uid).ok);G.buildTurnOrder(s);assert(!s.order.includes(a.uid));
});
test('a oportunidade traseira de Zuri não permite ataques, quebra de maldição ou dano na Daly Mãe',()=>{
 const s=battle(['mike'],['cavaleiro'],['zuri']),a=force(s,'zuri'),t=u(s,'cavaleiro'),ally=u(s,'mike');
 assert.deepEqual(G.attackTargets(s,a),[]);const turn=s.turn;
 assert(!G.performBasicAttack(s,a.uid,t.uid).ok);assert.equal(s.turn,turn);
 ally.petrifiedBy='test';assert.deepEqual(G.breakCurseTargets(s,a),[]);assert(!G.performBreakCurse(s,a.uid,ally.uid).ok);assert.equal(s.turn,turn);
 G.eliminateUnit(s,t);assert(G.isDalyExposed(s,'enemy'));assert(!G.performBasicAttack(s,a.uid,'daly_enemy').ok);assert.equal(s.daly.enemy.hp,3);
});
test('silêncio, reviver sem habilidade e dormência impedem a cura traseira; estados conservam sua ação de resolução',()=>{
 const s=battle(['mike'],['cavaleiro'],['zuri']),a=u(s,'zuri');
 for(const key of ['silenceRemaining','revivedNoAbility','abilityDormant']){
  a[key]=key==='silenceRemaining'?4:true;assert(!G.canUseRearAbility(a),key);assert(!G.canAct(a),key);a[key]=key==='silenceRemaining'?0:false;
 }
 for(const [key,value] of [['sleep',true],['paralysis',2],['petrifiedBy','test'],['hypnotizedBy','test'],['pinnedBy','test'],['pinning','test']]){
  a[key]=value;assert(G.canAct(a),key+' deve conservar a vez para resolver o impedimento.');force(s,'zuri');u(s,'mike').hp=20;const turn=s.turn;
  assert(!G.performFullHeal(s,a.uid).ok,key);assert.equal(s.turn,turn);a[key]=typeof value==='boolean'?false:typeof value==='number'?0:null;
 }
 assert(G.canUseRearAbility(a));assert(G.canAct(a));
});
test('Elysh mantém a cura normal traseira, outros Suportes não recebem uma ação nova e as ações gratuitas não avançam o contador',()=>{
 const s=battle(['mike'],['cavaleiro'],['elysh','unicorn']);choices(s);const a=u(s,'elysh'),other=u(s,'unicorn');
 assert(G.canHealFromRear(a));assert(G.canAct(a));assert(!G.canUseRearAbility(a));assert(!G.canAct(other));assert(!G.canUseRearAbility(other));
 for(const unit of s.units)assert.equal(unit.actionsTaken,0);
 force(s,'elysh');const before=s.turn;assert(G.performTransit(s,a.uid).ok);assert.equal(a.actionsTaken,0);assert.equal(s.turn,before);
 assert(G.performBasicAttack(s,a.uid,u(s,'cavaleiro').uid).ok);assert.equal(a.actionsTaken,1);assert.equal(s.turn,before+1);
});
console.log(`${passed} testes da esquiva e retaguarda da v0.32 passaram`);
