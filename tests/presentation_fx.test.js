const assert=require('node:assert/strict');
['data/characters','data/gods','data/support_cards','data/reset_cards','core/battle','core/character_abilities','core/deck','core/support','core/roster','core/official_abilities','core/support_effects','core/divine','core/selection','core/ai','ui/battle_feedback','ui/presentation_fx'].forEach(f=>require('../js/'+f+'.js'));
const G=GOGHOS,F=G.PresentationFX;let passed=0;const test=(name,run)=>{run();passed++;console.log('OK  '+name);};
const u=(s,id)=>s.units.find(x=>x.id===id),battle=(p=['ddx'],e=['john'])=>G.createBattleState({front:p,rear:[]},{front:e,rear:[]},[],{rng:()=>.5,roll:()=>6});
function force(s,id){while(s.abilityChoices.length)assert(G.AI.resolveCharacterAbility(s).ok);const a=u(s,id);s.order=[a.uid,...s.order.filter(uid=>uid!==a.uid)];s.acted={};return a;}

test('efeitos não exigem DOM, áudio ou armazenamento para carregar e não alteram uma batalha',()=>{
 const s=battle(),before=JSON.stringify(s);assert.equal(F.init(),false);assert.equal(F.playEvent(s,{id:1,type:'attack',actorUid:u(s,'ddx').uid,targetUid:u(s,'john').uid}),false);assert.deepEqual(F.planEvent(s,{type:'wait'}),[]);assert.equal(JSON.stringify(s),before);assert.equal(F.getDebugState().initialized,false);F.stop();F.destroy();
});
test('quatro braços produzem quatro efeitos de soco, um por golpe, na ordem original',()=>{
 const s=battle(),a=force(s,'ddx');assert(G.performBasicAttack(s,a.uid,u(s,'john').uid,0,'double').ok);const before=JSON.stringify(s),plan=F.planEvent(s,s.lastEvent,{duration:G.feedbackDuration(s.lastEvent)});assert.equal(plan.length,4);assert(plan.every(x=>x.profile==='punch'));assert.deepEqual(plan.map(x=>x.amount),[45,45,45,45]);assert.deepEqual(plan.map(x=>x.delay),[0,880,1760,2640]);assert.equal(JSON.stringify(s),before);
});
test('Parry alterna com os golpes sem transformar ataques defendidos em impactos',()=>{
 const s=battle(),a=force(s,'ddx');let rolls=[1,6,2,6];s.roll=()=>rolls.shift();assert(G.performBasicAttack(s,a.uid,u(s,'john').uid,0,'double').ok);const plan=F.planEvent(s,s.lastEvent);assert.deepEqual(plan.map(x=>x.profile),['parry','punch','parry','punch']);assert.deepEqual(plan.map(x=>x.amount),[0,45,0,45]);
});
test('socos e revides de Sark recebem perfis próprios, intercalados entre os golpes',()=>{
 const s=battle(['sam'],['sarck']),a=force(s,'sam');u(s,'sarck').maxHp=u(s,'sarck').hp=1000;let rolls=[1,2];s.roll=()=>rolls.shift();assert(G.performBasicAttack(s,a.uid,u(s,'sarck').uid).ok);const plan=F.planEvent(s,s.lastEvent);assert.deepEqual(plan.map(x=>x.profile),['punch','teeth','punch','teeth']);assert.deepEqual(plan.map(x=>x.reaction),[false,true,false,true]);assert.equal(s.lastEvent.hits.length,2);
});
test('elétrica em área preserva todos os alvos e aplica escudo visual ao alvo que defende',()=>{
 const s=battle(['eletric'],['john','mike']),a=force(s,'eletric');s.roll=()=>1;assert(G.performAreaAttack(s,a.uid,0).ok);const before=JSON.stringify(s),plan=F.planEvent(s,s.lastEvent);assert.deepEqual(plan.map(x=>x.profile),['parry','electric']);assert.deepEqual(plan.map(x=>x.targetUid),[u(s,'john').uid,u(s,'mike').uid]);assert.equal(JSON.stringify(s),before);
});
test('cura, queimadura e machado periódico usam efeitos coerentes, separados do ataque principal',()=>{
 const s=battle(['elysh','john'],['chama']),a=force(s,'elysh'),t=u(s,'john');t.hp=100;assert(G.performHealingAttack(s,a.uid,t.uid).ok);assert.equal(F.planEvent(s,s.lastEvent)[0].profile,'heal');assert.equal(F.profileFor(s,{actorUid:a.uid},{kind:'burn-damage'}),'flame');assert.equal(F.profileFor(s,{actorUid:a.uid},{kind:'pin-damage'}),'axe');assert.equal(F.profileFor(s,{actorUid:a.uid},{type:'dodge'}),'dodge');assert.equal(F.profileFor(s,{actorUid:a.uid},{type:'immune'}),'immune');
});
test('escolha de entrada sem UID de alvo pode ser apresentada pelo nome sem mudar o estado',()=>{
 const s=battle(['rayvilin'],['john']),a=u(s,'rayvilin'),t=u(s,'john'),e={id:99,type:'ability',actorUid:a.uid,targetName:t.name,ability:'Petrificação',hits:[]},before=JSON.stringify(s);const plan=F.planEvent(s,e);assert.equal(plan[0].targetUid,t.uid);assert.equal(plan[0].profile,'petrify');assert.equal(JSON.stringify(s),before);assert.equal(F.profileFor(s,{presentationAbility:'dimension'}),'dimension');
});
test('ataque básico de um controlador não simula falsamente sua habilidade de controle ou cura',()=>{
 const s=battle(['rayyb'],['john']),a=force(s,'rayyb'),t=u(s,'john');assert(G.performBasicAttack(s,a.uid,t.uid).ok);assert.equal(F.planEvent(s,s.lastEvent)[0].profile,'star');assert.equal(F.profileFor(s,{type:'ability',actorUid:a.uid,targetUid:t.uid}),'sleep');
 const penxy=battle(['penxy'],['john']),p=u(penxy,'penxy');assert.equal(F.profileFor(penxy,{type:'attack',actorUid:p.uid}),'slash');assert.equal(F.profileFor(penxy,{type:'ability',actorUid:p.uid}),'dimension');
});
test('invocação e ataque à Daly Mãe têm efeitos próprios e não criam impactos extras',()=>{
 const s=battle();const summon=F.planEvent(s,{type:'summon',actorUid:'god_0',hits:[]});assert.equal(summon.length,1);assert.equal(summon[0].profile,'divine');assert.equal(summon[0].targetUid,'god_0');const daly=F.planEvent(s,{type:'daly-hit',targetUid:'daly_enemy',damage:1});assert.equal(daly.length,1);assert.equal(daly[0].profile,'crystal');assert.equal(daly[0].amount,1);
});
test('susto usa os resultados reais do motor e preserva os adversários que resistiram',()=>{
 const s=battle(['zikssy'],['john','mike']),a=u(s,'zikssy');let rolls=[1,6];s.roll=()=>rolls.shift();assert(G.resolveCharacterAbility(s,a.uid).ok);const before=JSON.stringify(s),plan=F.planEvent(s,s.lastEvent);assert.deepEqual(plan.map(x=>x.profile),['fright','miss']);assert.deepEqual(plan.map(x=>x.targetUid),[u(s,'john').uid,u(s,'mike').uid]);assert.equal(JSON.stringify(s),before);
});
test('preferências de áudio e movimento são limitadas, reversíveis e não tocam dados do jogo',()=>{
 const before=JSON.stringify(G.CHARACTERS);assert.equal(F.setPreferences({muted:true,volume:5,motion:false}).volume,1);assert.equal(F.getPreferences().muted,true);assert.equal(F.getPreferences().reducedMotion,true);assert.equal(F.setPreferences({volume:-2,motion:true}).volume,0);assert.equal(F.getPreferences().motion,'full');F.setPreferences({muted:false,volume:.38,motion:'auto'});assert.equal(JSON.stringify(G.CHARACTERS),before);
});
console.log(`${passed} testes de apresentação, efeitos e áudio passaram`);
