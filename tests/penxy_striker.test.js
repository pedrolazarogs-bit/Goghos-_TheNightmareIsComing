const assert=require('node:assert/strict');
['data/characters','data/gods','data/support_cards','data/reset_cards','core/battle','core/character_abilities','core/deck','core/support','core/roster','core/official_abilities','core/support_effects','core/divine','core/selection','core/ai','ui/card','ui/arena_ui'].forEach(f=>require('../js/'+f+'.js'));
const G=GOGHOS;let passed=0;const test=(name,run)=>{run();passed++;console.log('OK  '+name);};
const u=(s,id)=>s.units.find(c=>c.id===id),battle=(p=['penxy','john'],e=['striker','alex'],pr=[],er=[])=>G.createBattleState({front:p,rear:pr},{front:e,rear:er},[],{rng:()=>.5,roll:()=>6});
function resolve(s,target){return G.resolveCharacterAbility(s,u(s,'penxy').uid,u(s,target).uid);}

test('Penxy mais rápido não escolhe Striker na pré-batalha, para nenhuma equipe',()=>{
 for(const side of ['player','enemy']){
  const s=side==='player'?battle():battle(['striker','alex'],['penxy','john']),p=u(s,'penxy'),t=u(s,'striker');assert(p.speed>t.speed);assert(!G.abilityTargets(s,p,'dimension').includes(t));assert(G.abilityTargets(s,p,'dimension').includes(u(s,'alex')));const before=JSON.stringify(s),r=resolve(s,'striker');assert(!r.ok);assert(r.error.includes('protegido'));assert.equal(JSON.stringify(s),before);assert.equal(s.duels.length,0);
 }
});
test('proteção compara a velocidade atual: igual ou menor permite a dimensão',()=>{
 for(const speed of [1,2,3]){const s=battle(),p=u(s,'penxy'),t=u(s,'striker');p.speed=speed;assert(G.abilityTargets(s,p,'dimension').includes(t));assert(resolve(s,'striker').ok);assert(p.duelId);assert.equal(p.duelId,t.duelId);assert(G.attackTargets(s,p).includes(t));}
});
test('silêncio ou ressurreição sem habilidade permite escolher Striker',()=>{
 for(const key of ['silenceRemaining','revivedNoAbility']){const s=battle(),p=u(s,'penxy'),t=u(s,'striker');t[key]=key==='silenceRemaining'?4:true;assert(G.abilityTargets(s,p,'dimension').includes(t));assert(resolve(s,'striker').ok);assert.equal(p.duelId,t.duelId);}
});
test('velocidade e proteção são revalidadas ao confirmar uma escolha já aberta',()=>{
 const s=battle(),p=u(s,'penxy'),t=u(s,'striker');t.speed=p.speed;assert(G.characterAbilityChoiceHTML(s,t.uid).includes('data-ability-target="'+t.uid+'"'));t.speed=3;const before=JSON.stringify(s);assert(!resolve(s,'striker').ok);assert.equal(JSON.stringify(s),before);assert(!G.characterAbilityChoiceHTML(s,t.uid).includes('data-ability-target="'+t.uid+'"'));
});
test('sem outro alvo a pré-batalha segue e Penxy aguarda uma oportunidade válida',()=>{
 const s=battle(['penxy'],['striker']),p=u(s,'penxy');assert.equal(s.abilityChoices.length,0);assert.equal(s.phase,'battle');assert(!s.openingAbilities);assert(p.needsDuel);assert.equal(s.duels.length,0);assert(s.units.every(x=>!x.duelId));const round=s.round,turn=s.turn,deck=s.deck.pile.length;for(let n=0;n<5;n++)assert.equal(G.getNextActor(s),null);assert.equal(s.round,round);assert.equal(s.turn,turn);assert.equal(s.deck.pile.length,deck);assert(G.advanceIdleCycle(s).ok);assert.equal(s.deck.pile.length,deck-2);assert.equal(s.duels.length,0);
});
test('sem duelo indevido os aliados de fora continuam podendo atacar Striker',()=>{
 const s=battle(['penxy','john'],['striker']),p=u(s,'penxy'),j=u(s,'john'),t=u(s,'striker');assert.equal(s.abilityChoices.length,0);assert.equal(G.getNextActor(s).uid,p.uid);assert(G.performWait(s,p.uid).ok);assert.equal(G.getNextActor(s).uid,t.uid);assert(G.performBasicAttack(s,t.uid,j.uid).ok);assert.equal(G.getNextActor(s).uid,j.uid);assert(G.attackTargets(s,j).includes(t));assert(G.performBasicAttack(s,j.uid,t.uid).ok);assert.equal(t.hp,130);assert(!p.duelId&&!t.duelId);assert.equal(G.getNextActor(s).uid,p.uid);
});
test('novo adversário permitido reabre a escolha sem ação ou compra extra',()=>{
 const s=battle(['penxy'],['striker']),p=u(s,'penxy'),round=s.round,turn=s.turn,deck=s.deck.pile.length;const t=G.addCharacterToTeam(s,'enemy',G.claimCharacter(s,'eletric'));assert(t);assert.equal(G.getNextActor(s),null);assert.equal(s.abilityChoices[0].actorUid,p.uid);assert.deepEqual(G.abilityTargets(s,p,'dimension').map(x=>x.id),['eletric']);assert(resolve(s,'eletric').ok);assert.equal(p.duelId,t.duelId);assert(!u(s,'striker').duelId);assert.equal(s.round,round);assert.equal(s.turn,turn);assert.equal(s.deck.pile.length,deck);
});
test('ao encerrar um duelo, Striker protegido não entra no duelo seguinte',()=>{
 const s=battle(),p=u(s,'penxy');assert(resolve(s,'alex').ok);G.eliminateUnit(s,u(s,'alex'));assert(p.needsDuel);assert.equal(p.duelId,null);assert.equal(G.getNextActor(s).uid,p.uid);assert.equal(s.abilityChoices.length,0);assert(G.performWait(s,p.uid).ok);assert(!u(s,'striker').duelId);assert.equal(s.duels.filter(d=>d.active).length,0);
});
test('IA ignora Striker protegido mesmo quando ele é o adversário de menor Vida',()=>{
 for(const side of ['player','enemy']){const s=side==='player'?battle():battle(['striker','alex'],['penxy','john']);u(s,'striker').hp=5;assert(G.AI.resolveCharacterAbility(s).ok);assert.equal(u(s,'penxy').duelId,u(s,'alex').duelId);assert(!u(s,'striker').duelId);}
});
test('alvos permitidos na retaguarda continuam disponíveis, com isolamento normal',()=>{
 const s=battle(['penxy','john'],['striker'],[],['elysh']),p=u(s,'penxy'),t=u(s,'elysh');assert.deepEqual(G.abilityTargets(s,p,'dimension').map(x=>x.id),['elysh']);assert(resolve(s,'elysh').ok);assert.equal(t.row,'rear');assert.equal(p.duelId,t.duelId);assert(G.attackTargets(s,p).includes(t));assert(!G.attackTargets(s,u(s,'john')).includes(t));assert(G.getNextActor(s));
});
test('um bônus de entrada pode invalidar a escolha sem perder a futura habilidade de Penxy',()=>{
 const s=battle(['unicorn','penxy'],['striker','alex']),p=u(s,'penxy'),t=u(s,'striker');G.eliminateUnit(s,u(s,'alex'));t.speed=p.speed;assert(s.abilityChoices.some(c=>c.type==='dimension'));const unicorn=u(s,'unicorn');assert.equal(s.abilityChoices[0].actorUid,unicorn.uid);assert(G.resolveCharacterAbility(s,unicorn.uid,p.uid).ok);assert(p.speed>t.speed);assert.equal(s.abilityChoices.length,0);assert(p.needsDuel);assert(!p.duelId&&!t.duelId);const newcomer=G.addCharacterToTeam(s,'enemy',G.claimCharacter(s,'eletric'));assert(newcomer);assert.equal(G.getNextActor(s),null);assert.equal(s.abilityChoices[0].type,'dimension');assert(resolve(s,'eletric').ok);
});
test('correção mantém a esquiva atual e não estende a proteção de Striker a outros personagens',()=>{
 for(let roll=1;roll<=6;roll++){const s=battle(['striker'],['penxy','john']),a=u(s,'striker'),p=u(s,'penxy');assert.equal(G.dodgeInfo(a,p).diff,6);s.roll=()=>roll;assert.equal(G.applyCharacterHit(s,a,p,220).type,'dodge');assert.equal(p.hp,500);}
 const s=battle(['penxy'],['mike']);assert(G.abilityTargets(s,u(s,'penxy'),'dimension').includes(u(s,'mike')));assert(resolve(s,'mike').ok);
});

test('Velocidade 3 na carta e na arena permite ataques de 3, mas protege contra 4',()=>{
 const c=G.getCharacterById('striker');assert.equal(c.speed,3);assert.equal(G.MASTER_UPGRADE.find(x=>x.id==='striker').speed,3);
 assert.match(G.cardHTML(c),/data-value="speed"[^>]*>3<\/div>/);
 for(const speed of [2,3,4]){
  const s=battle(['john'],['striker']),a=u(s,'john'),t=u(s,'striker');a.speed=speed;assert.equal(t.speed,3);
  assert.equal(G.attackTargets(s,a).includes(t),speed<=3);const before=t.hp,hit=G.applyCharacterHit(s,a,t,50);
  assert.equal(hit.type,speed<=3?'hit':'miss');assert.equal(t.hp,speed<=3?before-50:before);
 }
});
test('Penxy com 3 pode iniciar o duelo; com 4 a proteção impede sem consumir estado',()=>{
 for(const speed of [3,4]){
  const s=battle(),p=u(s,'penxy'),t=u(s,'striker');p.speed=speed;assert.equal(t.speed,3);
  assert.equal(G.abilityTargets(s,p,'dimension').includes(t),speed===3);
  const before=JSON.stringify(s),r=resolve(s,'striker');assert.equal(r.ok,speed===3);
  if(speed===3)assert.equal(p.duelId,t.duelId);else assert.equal(JSON.stringify(s),before);
 }
});
console.log(`${passed} testes de Penxy e Striker passaram`);
