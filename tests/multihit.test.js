const assert=require('node:assert/strict');
['data/characters','data/gods','data/support_cards','data/reset_cards','core/battle','core/character_abilities','core/deck','core/support','core/roster','core/official_abilities','core/support_effects','core/divine','core/selection','core/ai','ui/card','ui/arena_ui','ui/battle_feedback'].forEach(f=>require('../js/'+f+'.js'));
const G=GOGHOS;let passed=0;const test=(name,fn)=>{fn();passed++;console.log('OK  '+name);};
const u=(s,id)=>s.units.find(x=>x.id===id);
function battle(p=['ddx'],e=['john']){const s=G.createBattleState({front:p,rear:[]},{front:e,rear:[]},[],{rng:()=>.5,roll:()=>6});let guard=0;while(s.abilityChoices.length){assert(guard++<30);assert(G.AI.resolveCharacterAbility(s).ok);}return s;}
function force(s,id){const a=u(s,id);s.order=[a.uid,...s.order.filter(x=>x!==a.uid)];s.acted={};return a;}
function dice(s,values){let i=0;s.roll=()=>{assert(i<values.length,'rolagem extra inesperada');return values[i++];};return()=>i;}
function attack(s,id,target,mode='normal'){const a=force(s,id),r=G.performBasicAttack(s,a.uid,u(s,target).uid,0,mode);assert(r.ok,r.error);return r;}

test('55×2 são dois golpes de 55 no mesmo alvo; qualquer multiplicador usa a quantidade de golpes',()=>{
 const s=battle(['ddx'],['eletric']);attack(s,'ddx','eletric');assert.equal(u(s,'eletric').hp,110);assert.deepEqual(s.lastEvent.hits.map(h=>h.amount),[55,55]);assert.deepEqual(s.lastEvent.hits.map(h=>[h.beforeHp,h.afterHp]),[[220,165],[165,110]]);
 const next=battle(['ddx'],['eletric']);u(next,'ddx').attackCount=3;attack(next,'ddx','eletric');assert.deepEqual(next.lastEvent.hits.map(h=>h.amount),[55,55,55]);
});
test('cada golpe repete o Parry e aumenta a chance de pelo menos um acerto',()=>{
 let successes=0;for(let first=1;first<=6;first++)for(let second=1;second<=6;second++){
  const s=battle(),calls=dice(s,[first,second]);attack(s,'ddx','john');assert.equal(calls(),2);assert.deepEqual(s.lastEvent.hits.map(h=>h.type),[first<=2?'parry':'hit',second<=2?'parry':'hit']);if(u(s,'john').hp<250)successes++;
 }assert.equal(successes,32); // 32/36, contra 24/36 de um único ataque com Parry 1–2.
});
test('cada golpe repete a esquiva, mesmo depois de o primeiro errar',()=>{
 let successes=0;for(let first=1;first<=6;first++)for(let second=1;second<=6;second++){
  const s=battle(['ddx'],['zikssy']),calls=dice(s,[first,second]);attack(s,'ddx','zikssy');assert.equal(calls(),2);assert.deepEqual(s.lastEvent.hits.map(h=>h.type),[first<=2?'dodge':'hit',second<=2?'dodge':'hit']);if(u(s,'zikssy').hp<160)successes++;
 }assert.equal(successes,32);
});
test('quatro braços de DD-X fazem 55×4, com quatro defesas e uma única ativação',()=>{
 const s=battle(),t=u(s,'john');t.hp=t.maxHp=1000;const calls=dice(s,[1,6,2,6]);attack(s,'ddx','john','double');assert.equal(calls(),4);assert.deepEqual(s.lastEvent.hits.map(h=>h.type),['parry','hit','parry','hit']);assert.deepEqual(s.lastEvent.hits.map(h=>h.amount||0),[0,55,0,55]);assert.equal(t.hp,890);assert(u(s,'ddx').doubleUsed);assert.equal(s.lastEvent.sequence.planned,4);
 G.buildTurnOrder(s);const a=force(s,'ddx'),before=JSON.stringify(s);assert(!G.performBasicAttack(s,a.uid,t.uid,0,'double').ok);assert.equal(JSON.stringify(s),before);s.roll=()=>6;attack(s,'ddx','john');assert.equal(s.lastEvent.hits.length,2);
});
test('Draktar faz 90×2 e aplica o bônus da caça em cada golpe',()=>{
 const s=battle(['draktar'],['eletric','john']),a=u(s,'draktar'),t=u(s,'eletric');a.huntUid=u(s,'john').uid;attack(s,'draktar','eletric');assert.deepEqual(s.lastEvent.hits.map(h=>h.amount),[90,90]);assert.equal(t.hp,40);
 const hunt=battle(['draktar'],['eletric']),victim=u(hunt,'eletric');victim.hp=victim.maxHp=1000;attack(hunt,'draktar','eletric');assert.deepEqual(hunt.lastEvent.hits.map(h=>h.amount),[270,270]);assert.equal(victim.hp,460);
});
test('Sam testa cada soco e cada defesa; repetir dado encerra após os socos anteriores',()=>{
 const s=battle(['sam'],['john']),calls=dice(s,[2,1,6,6,5,2,5]);attack(s,'sam','john');assert.equal(calls(),7);assert.deepEqual(s.lastEvent.hits.map(h=>h.type),['parry','hit','parry']);assert.deepEqual(s.lastEvent.hits.map(h=>h.amount||0),[0,70,0]);assert.equal(u(s,'john').hp,180);assert.equal(s.lastEvent.sequence.resolved,3);assert(s.lastEvent.rolls.at(-1).repeated);
});
test('Sam consegue seis socos separados de 70, nunca um golpe de 420',()=>{
 const s=battle(['sam'],['john']),t=u(s,'john');t.hp=t.maxHp=1000;const calls=dice(s,[1,6,2,6,3,6,4,6,5,6,6,6]);attack(s,'sam','john');assert.equal(calls(),12);assert.deepEqual(s.lastEvent.hits.map(h=>h.amount),[70,70,70,70,70,70]);assert.equal(t.hp,580);assert.deepEqual(s.lastEvent.hits.map(h=>h.strike),[1,2,3,4,5,6]);
});
test('Sark reage ao primeiro golpe sobrevivido e interrompe DD-X antes do segundo',()=>{
 const s=battle(['ddx'],['sarck']);u(s,'sarck').hp=80;attack(s,'ddx','sarck');assert.equal(u(s,'sarck').hp,25);assert(u(s,'ddx').eliminated);assert.equal(s.lastEvent.hits.length,1);assert(s.lastEvent.reactions[0].instant);assert.equal(s.lastEvent.sequence.resolved,1);
});
test('Sam também para quando o revide de Sark o elimina entre os socos',()=>{
 const s=battle(['sam'],['sarck']);u(s,'sarck').hp=u(s,'sarck').maxHp=1000;const calls=dice(s,[1,2]);attack(s,'sam','sarck');assert.equal(calls(),2);assert.equal(s.lastEvent.hits.length,2);assert.deepEqual(s.lastEvent.reactions.map(h=>h.amount),[390,390]);assert(u(s,'sam').eliminated);assert.equal(u(s,'sarck').hp,860);
});
test('morte do alvo encerra os golpes sem atingir outro personagem ou a Daly Mãe',()=>{
 const s=battle(['ddx'],['eletric','mike']);u(s,'eletric').hp=45;attack(s,'ddx','eletric','double');assert(u(s,'eletric').eliminated);assert.equal(s.lastEvent.hits.length,1);assert.equal(u(s,'mike').hp,130);assert.equal(s.daly.enemy.hp,3);assert(u(s,'ddx').doubleUsed);
});
test('armadura, resistência e arredondamento são aplicados em cada golpe',()=>{
 let s=battle(['ddx'],['cavaleiro']);assert.equal(G.previewDamage(s,u(s,'ddx'),0,u(s,'cavaleiro')),30);attack(s,'ddx','cavaleiro');assert.deepEqual(s.lastEvent.hits.map(h=>h.amount),[15,15]);
 s=battle(['ddx'],['z_zus']);assert.equal(G.previewDamage(s,u(s,'ddx'),0,u(s,'z_zus')),90);attack(s,'ddx','z_zus');assert.deepEqual(s.lastEvent.hits.map(h=>h.amount),[45,45]);assert.equal(u(s,'z_zus').hp,1110);
});
test('Escudo Volátil protege um golpe e a prévia da sequência não consome o escudo',()=>{
 const s=battle(['ddx'],['eletric']),a=u(s,'ddx'),t=u(s,'eletric');t.shield=80;const before=JSON.stringify(s),p=G.previewAttackSequence(s,a,0,t);assert.deepEqual(p.hits.map(h=>h.damage),[0,55]);assert.equal(G.previewDamage(s,a,0,t),55);assert.equal(JSON.stringify(s),before);attack(s,'ddx','eletric');assert.deepEqual(s.lastEvent.hits.map(h=>h.amount),[0,55]);assert.equal(t.hp,165);assert.equal(t.shield,0);
});
test('a proteção é verificada novamente: morto Z-Zus, o golpe seguinte atinge o protegido',()=>{
 const s=battle(['ddx'],['z_zus','john']),t=u(s,'john'),g=u(s,'z_zus');t.parryThreshold=0;g.hp=40;assert.equal(g.protectedUid,t.uid);attack(s,'ddx','john');assert.deepEqual(s.lastEvent.hits.map(h=>h.targetUid),[g.uid,t.uid]);assert.deepEqual(s.lastEvent.hits.map(h=>h.amount),[45,55]);assert(g.eliminated);assert.equal(t.hp,195);
});
test('quatro golpes contam como uma ação para mana, queimaduras e hierarquia',()=>{
 const s=battle(['ddx'],['eletric','chama']),a=u(s,'ddx'),t=u(s,'eletric');t.hp=t.maxHp=1000;t.mana=0;s.burns.push({sourceUid:u(s,'chama').uid,targetUid:a.uid,damage:35,remaining:5,started:0,kind:'defense'});const turn=s.turn,round=s.round,pile=s.deck.pile.length;attack(s,'ddx','eletric','double');assert.equal(s.turn,turn+1);assert.equal(s.round,round);assert.equal(s.burns[0].remaining,4);assert.equal(a.hp,225);assert.equal(t.mana,1);assert.equal(s.deck.pile.length,pile);assert.equal(s.lastEvent.ticks.length,1);
});
test('bônus do próximo ataque é gasto uma vez; bônus permanente vale em cada golpe',()=>{
 const s=battle(['ddx'],['eletric']);G.teamSupport(s,'player').nextAttackBonus=20;attack(s,'ddx','eletric');assert.deepEqual(s.lastEvent.hits.map(h=>h.amount),[75,55]);assert.equal(G.attackBonusFor(s,'player'),0);
 const buff=battle(['ddx'],['eletric']);u(buff,'ddx').damage+=50;attack(buff,'ddx','eletric');assert.deepEqual(buff.lastEvent.hits.map(h=>h.amount),[105,105]);
});
test('Oni permanece imortal entre golpes e não perde uma duração por golpe',()=>{
 const s=battle(['ddx'],['daztirry']);u(s,'daztirry').hp=40;attack(s,'ddx','daztirry');assert.deepEqual(s.lastEvent.hits.map(h=>h.type),['oni','immune']);assert.equal(u(s,'daztirry').oniRemaining,4);assert(!u(s,'daztirry').eliminated);
});
test('silêncio conserva os dois golpes básicos, mas impede ativar quatro braços',()=>{
 const s=battle(['ddx'],['eletric']),a=force(s,'ddx'),t=u(s,'eletric');a.silenceRemaining=4;assert(!G.performBasicAttack(s,a.uid,t.uid,0,'double').ok);attack(s,'ddx','eletric');assert.deepEqual(s.lastEvent.hits.map(h=>h.amount),[55,55]);assert.equal(a.doubleUsed,false);
});
test('Presença ignora quatro braços, mas não os dois golpes básicos da carta',()=>{
 const s=battle(['ddx'],['eletric']);force(s,'eletric');for(let n=0;n<3;n++){const i=s.deck.pile.findIndex(c=>c.id==='fragmento_01');s.deck.hands.enemy.push(s.deck.pile.splice(i,1)[0]);}assert(G.performSummon(s,'enemy').ok);const god=s.units.find(G.isGod);attack(s,'ddx',god.id,'double');assert.equal(s.lastEvent.hits.length,2);assert.deepEqual(s.lastEvent.hits.map(h=>h.amount),[50,50]);assert.equal(god.hp,1600);
});
test('Daly Mãe perde uma vida por ação e não consome quatro braços',()=>{
 const s=battle(['ddx'],['eletric']);G.eliminateUnit(s,u(s,'eletric'));const a=force(s,'ddx');assert(G.performBasicAttack(s,a.uid,'daly_enemy',0,'double').ok);assert.equal(s.daly.enemy.hp,2);assert.equal(a.doubleUsed,false);assert(!s.lastEvent.sequence);
});
test('IA usa quatro braços com os mesmos quatro golpes separados',()=>{
 const s=battle(['ddx'],['eletric']),a=force(s,'ddx');assert(G.AI.takeTurn(s,a).ok);assert.deepEqual(s.lastEvent.hits.map(h=>h.amount),[55,55,55,55]);assert.equal(u(s,'eletric').hp,0);
});
test('prévia e registro apresentam cada golpe separado, incluindo os socos de Sam',()=>{
 const s=battle(),a=force(s,'ddx'),t=u(s,'john');assert(G.actionPrompt(s,a,{target:t.uid}).includes('2 golpes em sequência de 55'));assert(G.actionPrompt(s,a,{target:t.uid,mode:'double'}).includes('4 golpes em sequência de 55'));assert(G.actorInfoHTML(s,a).includes('55×2'));assert(G.cardHTML(a).includes('>55×2</div>'));dice(s,[1,6]);assert(G.performBasicAttack(s,a.uid,t.uid).ok);const before=JSON.stringify(s),html=G.eventFeedbackHTML(s);assert(html.includes('Golpe 1/2'));assert(html.includes('Golpe 2/2'));assert(html.includes('DEFENDEU'));assert(html.includes('−55'));assert.equal(JSON.stringify(s),before);
 const combo=battle(['sam'],['eletric']);dice(combo,[1,2,2]);attack(combo,'sam','eletric');const feedback=G.eventFeedbackHTML(combo);assert(feedback.includes('Golpe 1/6'));assert(feedback.includes('Golpe 2/6'));assert(!feedback.includes('−140'));assert(G.actionPrompt(combo,u(combo,'sam'),{target:u(combo,'eletric').uid}).includes('até 6 socos de 70'));
});
console.log(`${passed} testes de golpes em sequência passaram`);
