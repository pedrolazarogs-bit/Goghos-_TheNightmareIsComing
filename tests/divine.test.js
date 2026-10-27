const assert=require('node:assert/strict');
['data/characters','data/gods','data/support_cards','data/reset_cards','core/battle','core/character_abilities','core/deck','core/support','core/roster','core/official_abilities','core/support_effects','core/divine','core/selection','core/ai','ui/card','ui/arena_ui'].forEach(f=>require('../js/'+f+'.js'));
require('./fixtures/v0_25_catalog.js'); // Regressão das regras e atributos da v0.25.0.
const G=GOGHOS;let passed=0;const test=(n,f)=>{f();passed++;console.log('OK  '+n);};
const u=(s,id)=>s.units.find(c=>c.id===id);
const battle=(p=['ddx','mike'],e=['john','sam'])=>G.createBattleState({front:p,rear:[]},{front:e,rear:[]},[],{rng:()=>.5,roll:()=>6});
function force(s,id){const a=u(s,id);s.order=[a.uid,...s.order.filter(x=>x!==a.uid)];s.acted=Object.fromEntries(s.order.map(x=>[x,x!==a.uid]));s.speedCursor=a.speed;return a;}
function give(s,id,side='player'){const i=s.deck.pile.findIndex(c=>c.id===id);assert(i>=0);const c=s.deck.pile.splice(i,1)[0];s.deck.hands[side].push(c);return c;}
function summon(s){while(s.abilityChoices.length)assert(G.AI.resolveCharacterAbility(s).ok);force(s,s.units.find(c=>c.team==='player').id);for(let i=0;i<3;i++)give(s,'fragmento_01');const r=G.performSummon(s);assert(r.ok,r.error);return u(s,'zenneriam');}
function attack(s,id,target,mode='normal',mana=0){const a=force(s,id),r=G.performBasicAttack(s,a.uid,target.uid,mana,mode);assert(r.ok,r.error);return r;}
function cards(s){return[...s.deck.pile,...s.deck.hands.player,...s.deck.hands.enemy,...s.deck.discard,...(s.deck.pendingChoice?[s.deck.pendingChoice.incoming]:[])];}

test('Deus preserva os atributos da arte, não tem raridade e não entra em montes ou seleção',()=>{
 const c=G.getCharacterById('zenneriam');assert.deepEqual([c.maxHp,c.damage,c.speed,c.stamina,c.rarity],[1700,700,7,12,null]);assert.equal(G.GODS.length,1);assert.equal(G.CHARACTERS.length,30);assert(!Object.values(G.createCharacterPiles()).flat().some(c=>c.id==='zenneriam'));assert(!G.createSelection().sel.offered.includes(c.id));assert.throws(()=>battle(['zenneriam'],['john']),/invocação/);assert(!G.cardHTML(c).includes('undefined'));
});
test('cada partida tem exatamente três fragmentos físicos únicos no monte compartilhado',()=>{
 for(let i=0;i<10;i++){const s=battle(),f=cards(s).filter(c=>c.id==='fragmento_01');assert.equal(f.length,3);assert.equal(new Set(f.map(c=>c.iid)).size,3);assert.equal(s.deck.total,57);assert.equal(s.divineReserve.length,1);}
});
test('invocação consome os três, conserva as cartas e aguarda o próximo ciclo sem compras extras',()=>{
 const s=battle(),before={turn:s.turn,round:s.round,order:[...s.order],acted:{...s.acted},resets:s.deck.resets.size};const god=summon(s);assert.equal(G.fragmentCount(s,'player'),0);assert.equal(s.deck.discard.filter(c=>c.reason==='primordial-summon').length,3);assert.equal(s.divineReserve.length,0);assert.equal(s.turn,before.turn);assert.equal(s.round,before.round);assert.equal(s.deck.resets.size,before.resets);assert(!s.order.includes(god.uid));assert.equal(god.mana,3);assert(!G.performSummon(s).ok);assert.equal(cards(s).length,s.deck.total);assert.equal(new Set(cards(s).map(c=>c.iid)).size,s.deck.total);
 G.buildTurnOrder(s);assert(s.order.includes(god.uid));
});
test('um ou dois fragmentos e fragmentos divididos entre equipes não invocam',()=>{
 for(const n of [1,2]){const s=battle();force(s,'ddx');for(let i=0;i<n;i++)give(s,'fragmento_01');assert(!G.performSummon(s).ok);assert.equal(G.fragmentCount(s,'player'),n);assert.equal(s.divineReserve.length,1);}
 const s=battle();give(s,'fragmento_01');give(s,'fragmento_01');give(s,'fragmento_01','enemy');assert(!G.canSummonFromHand(s,'player'));assert(!G.canSummonFromHand(s,'enemy'));
});
test('não invoca na vez adversária, em escolha pendente ou após o fim',()=>{
 for(const state of ['enemy','choice','ended']){const s=battle();for(let i=0;i<3;i++)give(s,'fragmento_01');force(s,state==='enemy'?'john':'ddx');if(state==='choice')s.recovery={side:'player'};if(state==='ended')s.result='defeat';assert(!G.performSummon(s).ok);assert.equal(G.fragmentCount(s,'player'),3);}
});
test('MAX permite invocar na retaguarda com a frente cheia e transitar sem esvaziar a frente',()=>{
 const s=battle(['ddx','mike','alex']);const god=summon(s);assert.equal(god.row,'rear');assert(G.canTransit(god));G.eliminateUnit(s,u(s,'alex'));force(s,'ddx');assert(G.performTransit(s,god.uid).ok);assert.equal(god.row,'front');
});
test('formação completamente cheia mantém os fragmentos até existir uma vaga',()=>{
 const s=battle(['ddx','mike','alex']);while(s.abilityChoices.length)G.AI.resolveCharacterAbility(s);for(const id of ['elysh','fonior']){const p=s.piles[G.getCharacterById(id).rarity],inst=p.splice(p.findIndex(c=>c.id===id),1)[0];assert(G.addCharacterToTeam(s,'player',inst));}force(s,'ddx');for(let i=0;i<3;i++)give(s,'fragmento_01');assert(!G.performSummon(s).ok);assert.equal(G.fragmentCount(s,'player'),3);G.eliminateUnit(s,u(s,'fonior'));assert(G.performSummon(s).ok);
});
test('fragmentos utilizáveis impedem empate prematuro sem atacantes e retomam o ciclo',()=>{
 const s=battle(['sarck'],['john']);G.eliminateUnit(s,u(s,'john'));for(let i=0;i<3;i++)give(s,'fragmento_01');s.deck.discard.push(...s.deck.pile);s.deck.pile=[];assert(G.isIdleBattle(s));assert.equal(G.checkIdleDraw(s),null);assert(G.performSummon(s).ok);assert(s.order.includes(u(s,'zenneriam').uid));assert.equal(G.getNextActor(s).id,'zenneriam');
});
test('Deus eliminado permanece excluído: os fragmentos não voltam e Morto Vivo não o obtém',()=>{
 const s=battle(),god=summon(s);G.eliminateUnit(s,god);assert(!G.performSummon(s).ok);assert(!G.supportTargets(s,'player',G.getSupportCard('morto_vivo')).includes(god));assert.equal(cards(s).filter(c=>c.id==='fragmento_01').length,3);assert.equal(s.deck.discard.filter(c=>c.reason==='primordial-summon').length,3);
});
test('Presence impede seleção por dimensão, hipnose, sono, petrificação e livro',()=>{
 for(const [id,type] of [['penxy','dimension'],['barn','hypnosis'],['rayyb','sleepPowder'],['rayvilin','petrify'],['vaglar','deathBook']]){const s=battle(['ddx'],[id]),god=summon(s),a=u(s,id);assert(!G.abilityTargets(s,a,type).includes(god),type);}
});
test('Presence atravessa armadura e bloqueia o revide de Sark',()=>{
 for(const id of ['cavaleiro','sarck']){const s=battle(['ddx'],[id]),god=summon(s),t=u(s,id);t.hp=t.maxHp=1000;attack(s,'zenneriam',t);assert.equal(t.hp,300);assert.equal(god.hp,1700);assert.equal(s.lastEvent.reactions?.length||0,0);}
});
test('Presence atravessa proteções de velocidade, Assassino e duelo do Xerife',()=>{
 for(const id of ['striker','mike','sheriff']){const s=battle(['ddx'],[id]),god=summon(s);assert(G.attackTargets(s,god).includes(u(s,id)));attack(s,'zenneriam',u(s,id));assert(u(s,id).eliminated);assert.equal(god.hp,1700);}
});
test('Presence ignora o desvio de Z-Zus e a imortalidade Oni',()=>{
 const s=battle(['ddx'],['z_zus','daztirry']),god=summon(s),t=u(s,'daztirry'),guard=u(s,'z_zus');guard.protectedUid=t.uid;t.guardianUid=guard.uid;t.hp=100;attack(s,'zenneriam',t);assert(t.eliminated);assert(!t.oniActive);assert.equal(guard.hp,guard.maxHp);assert.equal(god.hp,1700);
});
test('Presence impede a reação do tubarão e as queimaduras, inclusive após um golpe fatal',()=>{
 for(const id of ['endrik','chama']){const s=battle(['ddx'],[id]),god=summon(s);s.roll=()=>1;attack(s,'zenneriam',u(s,id));assert(u(s,id).eliminated);assert.equal(god.hp,1700);assert.equal(s.burns.length,0);}
});
test('Presence ignora área e dano periódico de habilidade sem consumir defesa ou Vida',()=>{
 const s=battle(['ddx'],['eletric']),god=summon(s),a=u(s,'eletric');const hp=god.hp;attack(s,'eletric',god);assert.equal(god.hp,hp);assert(s.lastEvent.hits.some(h=>h.targetUid===god.uid&&h.ability==='Presence'));
 for(const kind of ['book','burn-damage','pin-damage','reaction']){const h=G.dealCharacterDamage(s,a,god,500,{kind,ability:'Teste'});assert.equal(h.damage,0);assert.equal(h.ability,'Presence');}
});
test('Presence impede machado cravado, multiplicação da decapitação e quatro braços',()=>{
 for(const [id,mode,damage] of [['john','pin',75],['nully','normal',50],['ddx','double',85]]){const s=battle(['mike'],[id]),god=summon(s);attack(s,id,god,mode);assert.equal(god.hp,1700-damage,id);assert.equal(god.pinnedBy,null);}
});
test('cartas de Apoio funcionam no Deus: cura, escudo e Não Grita',()=>{
 const s=battle(),god=summon(s);force(s,'ddx');god.hp=1000;let c=give(s,'bandeide');assert(G.performHandSupport(s,c.iid,god.uid).ok);assert.equal(god.hp,1080);s.turn++;force(s,'john');c=give(s,'nao_grita','enemy');assert(G.performHandSupport(s,c.iid,god.uid,'enemy').ok);assert(!G.isPresence(god));assert(G.hasClass(god,'TANK'));assert.equal(god.parryThreshold,2);
});
test('Papakill consegue eliminar o Deus abaixo de 40 de Vida',()=>{
 const s=battle(),god=summon(s);god.hp=35;force(s,'john');const c=give(s,'papakill','enemy');assert(G.performHandSupport(s,c.iid,god.uid,'enemy').ok);assert(god.eliminated);
});
test('MAX mantém mana 3, gasta mana e recupera +1 por ação',()=>{
 const s=battle(),god=summon(s),t=u(s,'sam');t.hp=t.maxHp=2000;attack(s,'zenneriam',t,'normal',3);assert.equal(t.hp,1270);assert.equal(god.mana,1);G.regenerateMageMana(s);assert.equal(god.mana,2);G.regenerateMageMana(s);G.regenerateMageMana(s);assert.equal(god.mana,3);
});
test('MAX tem Parry e esquiva normais, além da resistência de Tanque',()=>{
 const s=battle(),god=summon(s),a=u(s,'john');s.roll=()=>1;assert.equal(G.applyCharacterHit(s,a,god,100).type,'parry');assert.equal(god.hp,1700);let rolls=[6,3];s.roll=()=>rolls.shift();assert.equal(G.applyCharacterHit(s,a,god,100).type,'dodge');s.roll=()=>6;const hit=G.applyCharacterHit(s,a,god,100);assert.equal(hit.damage,90);assert.equal(god.hp,1610);
});
test('Tanque reduz 10% de ataques; não reduz queimadura ou execução',()=>{
 const tank={class:'TANK',armorReduction:0};assert.equal(G.damageInfo(tank,100).damage,90);assert.equal(G.damageInfo(tank,65).damage,60);assert.equal(G.damageInfo(tank,100,{kind:'burn-damage'}).damage,100);
});
test('Destroyer testa 1–2 no d6, soma 25% e arredonda para múltiplos de cinco',()=>{
 for(const roll of [1,2,3,4,5,6]){const s=battle(['mike'],['ddx']);s.roll=()=>roll;const r=G.criticalDamage(s,u(s,'mike'),130);assert.equal(r.damage,roll<=2?165:130);assert.equal(r.critical,roll<=2);}
 const s=battle(['mike'],['ddx']);s.roll=()=>1;attack(s,'mike',u(s,'ddx'));assert.equal(u(s,'ddx').hp,70);assert(s.lastEvent.critical.critical);
});
test('crítico do míssil se aplica uma vez e o dano lateral continua sendo 20%',()=>{
 const s=battle(['p_ullys'],['alex','mike','ddx']);s.roll=()=>1;for(const t of s.units.filter(u=>u.team==='enemy'))t.hp=t.maxHp=2000;u(s,'ddx').parryThreshold=0;u(s,'alex').parryThreshold=0;attack(s,'p_ullys',u(s,'mike'));assert.equal(u(s,'mike').hp,1435);assert.equal(u(s,'alex').hp,1885);assert.equal(u(s,'ddx').hp,1885);assert(s.lastEvent.critical.critical);
});
test('Sortudo pode garantir crítico de Destroyer e se esgota nesse dado',()=>{
 const s=battle(['mike'],['ddx']);force(s,'mike');const c=give(s,'sortudo');assert(G.performHandSupport(s,c.iid).ok);attack(s,'mike',u(s,'ddx'));assert.equal(u(s,'ddx').hp,70);assert.equal(s.support.lucky,0);
});
test('a IA invoca com os três fragmentos antes de executar a própria ação',()=>{
 const s=battle();force(s,'john');for(let i=0;i<3;i++)give(s,'fragmento_01','enemy');const turn=s.turn,r=G.AI.takeTurn(s,u(s,'john'));assert(r.ok);assert.equal(u(s,'zenneriam').team,'enemy');assert.equal(s.turn,turn);assert.equal(G.fragmentCount(s,'enemy'),0);
});
test('Presence atravessa o isolamento de Penxy sem liberar o duelo dos outros personagens',()=>{
 const s=battle(['ddx'],['penxy','john']),god=summon(s),p=u(s,'penxy'),a=u(s,'ddx');
 assert(p.duelId);assert.equal(p.duelId,a.duelId);assert(G.attackTargets(s,god).includes(p));p.hp=p.maxHp=2000;attack(s,'zenneriam',p);assert.equal(p.hp,1300);assert(p.duelId);
});
test('MAX ignora Parry por incluir Destroyer, preservando o Escudo Volátil da carta de Apoio',()=>{
 const s=battle(),god=summon(s),t=u(s,'john');t.hp=t.maxHp=2000;s.roll=()=>{throw Error('O Parry não deve rolar contra MAX/Destroyer.');};assert.equal(G.applyCharacterHit(s,god,t,700).type,'hit');assert.equal(t.hp,1300);
 s.roll=()=>6;t.hp=t.maxHp=2000;t.shield=80;assert.equal(G.applyCharacterHit(s,god,t,700).damage,620);assert.equal(t.shield,0);
});
test('MAX testa crítico também nos ataques de Zeenneriam',()=>{
 const s=battle(),god=summon(s),t=u(s,'sam');t.hp=t.maxHp=2000;s.roll=()=>1;attack(s,'zenneriam',t);assert.equal(t.hp,1125);assert(s.lastEvent.critical.critical);assert.equal(god.hp,1700);
});
test('nova partida restaura a reserva divina e três fragmentos, sem duplicar o Deus',()=>{
 const a=battle();summon(a);const b=battle();assert.equal(b.divineReserve.length,1);assert.equal(G.fragmentCount(b,'player'),0);assert.equal(b.deck.pile.filter(c=>c.id==='fragmento_01').length,3);assert(!b.units.some(G.isGod));
});
test('40 partidas com invocação garantida terminam conservando Deus, personagens e fragmentos',()=>{
 const seeded=seed=>()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
 for(let i=0;i<40;i++){
  const rng=seeded(23000+i),{sel}=G.createSelection({rng});while(!G.selectionDone(sel)){const available=G.selectionAvailable(sel);if(G.selectionTurn(sel)==='player')assert(G.selectionPick(sel,'player',available[i%available.length]).ok);else assert(G.selectionBotPick(sel).ok);}const t=G.selectionTeams(sel),s=G.createBattleState(t.player,t.enemy,[],{rng}),side=i%2?'player':'enemy';for(let n=0;n<3;n++)give(s,'fragmento_01',side);let steps=0;
  while(!s.result&&steps++<2500){let r;
   if(s.deck.pendingChoice)r=G.resolveHandReplacement(s,null);else if(s.recovery)r=G.AI.resolveRecovery(s);else if(s.formation)r=G.AI.resolveFormation(s);else if(s.support.pending)r=G.resolveBrisa(s,null);else if(s.abilityChoices.length)r=G.AI.resolveCharacterAbility(s);
   else{const a=G.getNextActor(s);if(s.result)break;if(s.deck.pendingChoice||s.abilityChoices.length)continue;if(a)r=G.AI.takeTurn(s,a);else{for(const team of ['player','enemy']){if(G.canSummonFromHand(s,team)){r=G.performSummon(s,team);break;}if(G.hasIdleHandResources(s,team)){r=G.chooseAISupport(s,team);if(r)break;}}if(!r)r=G.advanceIdleCycle(s);}}
   assert(r?.ok,'partida divina '+i+': '+r?.error+' / '+s.log.slice(-5).join(' / '));
   const physical=[...Object.values(s.piles).flat(),...s.units,...s.divineReserve];assert.equal(physical.length,31);assert.equal(new Set(physical.map(c=>c.iid)).size,31);assert.equal(cards(s).length,57);assert.equal(new Set(cards(s).map(c=>c.iid)).size,57);assert.equal(cards(s).filter(c=>c.id==='fragmento_01').length,3);for(const team of ['player','enemy']){const board=G.getBoard(s)[team];assert(board.front.length<=G.frontLimit(s,team));assert(board.rear.length<=2);assert(board.rear.every(G.canTransit));assert(s.deck.hands[team].length<=5);}
  }
  assert(s.result,'partida divina não terminou: '+i);assert.equal(s.units.filter(G.isGod).length,1);assert.equal(s.deck.discard.filter(c=>c.reason==='primordial-summon').length,3);
 }
});
test('IA resolve invocação mesmo quando nenhuma unidade pode atacar',()=>{const s=battle(['sarck'],['john']);G.eliminateUnit(s,u(s,'john'));for(let n=0;n<3;n++)give(s,'fragmento_01','enemy');assert(G.isIdleBattle(s));assert(G.resolveIdleAI(s,'enemy').ok);assert.equal(u(s,'zenneriam').team,'enemy');assert.equal(G.getNextActor(s).id,'zenneriam');});
test('Morto Vivo pode devolver o primeiro atacante sem empate ou compra adicional',()=>{const s=battle(['sarck','mike'],['john']);G.eliminateUnit(s,u(s,'mike'));G.eliminateUnit(s,u(s,'john'));const c=give(s,'morto_vivo');s.deck.discard.push(...s.deck.pile);s.deck.pile=[];assert.equal(G.checkIdleDraw(s),null);const turn=s.turn;assert(G.performHandSupport(s,c.iid,u(s,'mike').uid).ok);assert.equal(u(s,'mike').hp,1);assert.equal(G.getNextActor(s).id,'mike');assert.equal(s.turn,turn);});
console.log(`${passed} testes de invocação, Presence e tributos passaram`);
