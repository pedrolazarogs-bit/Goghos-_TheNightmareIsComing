const assert=require('node:assert/strict');
['data/characters','data/gods','data/support_cards','data/reset_cards','core/battle','core/character_abilities','core/deck','core/support','core/roster','core/official_abilities','core/support_effects','core/divine','core/ai','ui/card','ui/arena_ui','ui/battle_feedback'].forEach(f=>require('../js/'+f+'.js'));
require('./fixtures/v0_25_catalog.js'); // Regressão das regras e atributos da v0.25.0.
const G=GOGHOS;let passed=0;const test=(n,f)=>{f();passed++;console.log('OK  '+n);};
const battle=(p,e)=>G.createBattleState({front:p,rear:[]},{front:e,rear:[]},[],{rng:()=>.5,roll:()=>6});
const u=(s,id)=>s.units.find(c=>c.id===id);
function force(s,id){const a=u(s,id);s.order=[a.uid,...s.order.filter(x=>x!==a.uid)];s.acted={};return a;}

test('combo real continua com socos separados no motor, mas exibe o total de impactos por alvo',()=>{
 const s=battle(['sam'],['mike']),a=force(s,'sam'),t=u(s,'mike');t.hp=t.maxHp=1000;let rolls=[2,6,5,5];s.roll=()=>rolls.shift();assert(G.performBasicAttack(s,a.uid,t.uid).ok);
 assert.equal(s.lastEvent.hits.length,3);const before=JSON.stringify(s),groups=G.compactImpacts(s.lastEvent);assert.equal(groups.length,1);assert.equal(groups[0].count,3);assert.equal(groups[0].total,300);assert.equal(groups[0].beforeHp,1000);assert.equal(groups[0].afterHp,700);assert(G.eventFeedbackHTML(s).includes('3 impactos'));assert(G.eventFeedbackHTML(s).includes('−300'));assert.equal(JSON.stringify(s),before);
});
test('o revide fatal de Sark permanece separado e aparece no resumo direto',()=>{
 const s=battle(['ddx'],['sarck']),a=force(s,'ddx');assert(G.performBasicAttack(s,a.uid,u(s,'sarck').uid).ok);const groups=G.compactImpacts(s.lastEvent);assert.equal(groups.length,2);assert.equal(groups[0].targetName,'Sark');assert.equal(groups[1].targetName,'DD-X');assert(groups[1].instant);assert(G.eventBrief(s.lastEvent).includes('Revide: DD-X ELIMINADO'));assert(G.eventFeedbackHTML(s).includes('Revide de Sark'));
});
test('área mostra cada alvo, Parry e dano sem misturar os resultados',()=>{
 const s=battle(['eletric'],['john','mike']),a=force(s,'eletric');s.roll=()=>1;assert(G.performAreaAttack(s,a.uid,0).ok);const groups=G.compactImpacts(s.lastEvent);assert.equal(groups.length,2);assert.equal(groups[0].type,'parry');assert.equal(G.impactText(groups[0]),'DEFENDEU');assert.equal(groups[1].total,130);assert.equal(G.impactText(groups[1]),'−130');assert(G.eventFeedbackHTML(s).includes('John'));assert(G.eventFeedbackHTML(s).includes('Mike'));
});
test('cartas deixam as passivas na ficha e destacam impedimentos temporários',()=>{
 const s=battle(['cavaleiro'],['john']),a=u(s,'cavaleiro');assert.deepEqual(G.unitBadges(s,a),[]);a.sleep=true;a.shield=80;assert.deepEqual(G.unitBadges(s,a),['Dormindo','Escudo · 80']);assert(G.actorInfoHTML(s,a).includes('Armadura'));assert(G.actorInfoHTML(s,a).includes('<details class="ability-details"'));
 const pin=battle(['john'],['cavaleiro']),john=force(pin,'john'),target=u(pin,'cavaleiro');assert(G.performBasicAttack(pin,john.uid,target.uid,0,'pin').ok);const before=JSON.stringify(pin);assert(G.actorInfoHTML(pin,john).includes('Mantém o machado em Cavaleiro'));assert(G.actorInfoHTML(pin,target).includes('Cravado por John'));assert.equal(JSON.stringify(pin),before);
});
test('prévia direta preserva o alerta de revide e a cura não altera o personagem',()=>{
 const s=battle(['ddx'],['sarck']),a=u(s,'ddx'),before=JSON.stringify(s);const prompt=G.actionPrompt(s,a,{target:u(s,'sarck').uid,mode:'normal'});assert(prompt.includes('90 de dano previsto'));assert(prompt.includes('elimina seu atacante'));assert.equal(G.actionPrompt(s,a,{mode:'heal'}),'Toque em um aliado ferido.');assert.equal(JSON.stringify(s),before);
});
test('desenhar ficha, resumo, ordem e estados não consulta o próximo ator nem compra cartas',()=>{
 const s=battle(['john'],['mike']),a=u(s,'john'),before=JSON.stringify(s),old=G.getNextActor;G.getNextActor=()=>{throw Error('Renderização não avança a batalha');};
 try{for(let i=0;i<4;i++){G.turnPanelHTML(s,a);G.actorInfoHTML(s,a);G.eventFeedbackHTML(s);G.unitBadges(s,a);G.actionPrompt(s,a,{});}assert.equal(JSON.stringify(s),before);}finally{G.getNextActor=old;}
});
test('escapar nomes e registros mantém caracteres de texto sem interpretar marcação',()=>{assert.equal(G.escapeUI('<Sark & John>'),'&lt;Sark &amp; John&gt;');assert(G.eventFeedbackHTML({lastEvent:{type:'support',ability:'<Nome>',hits:[]},log:['<Registro>']} ).includes('&lt;Registro&gt;'));});
test('Apoio gratuito mantém o personagem atual também como próximo, sem anunciar uma troca de vez',()=>{const s=G.createSupportTestState('bandeide'),a=force(s,'ddx'),card=s.deck.hands.player.find(c=>c.id==='bandeide');a.hp=100;assert(G.performHandSupport(s,card.iid,a.uid).ok);const before=JSON.stringify(s),preview=G.turnPreview(s,a,true);assert.equal(preview.current.uid,a.uid);assert.equal(preview.upcoming.uid,a.uid);assert.equal(JSON.stringify(s),before);});
console.log(`${passed} testes da apresentação direta da batalha passaram`);
