const assert=require('node:assert/strict'),fs=require('node:fs'),crypto=require('node:crypto');
['data/characters','data/gods','data/support_cards','data/reset_cards','core/battle','core/character_abilities','core/deck','core/support','core/roster','core/official_abilities','core/support_effects','core/divine','core/selection','core/ai','ui/card','ui/arena_ui','ui/battle_feedback'].forEach(f=>require('../js/'+f+'.js'));
const G=GOGHOS;let passed=0;const test=(name,run)=>{run();passed++;console.log('OK  '+name);};
const u=(s,id)=>s.units.find(x=>x.id===id),battle=(p=['linx'],e=['ddx'],opts={})=>G.createBattleState({front:p,rear:[]},{front:e,rear:[]},[],{rng:()=>.5,roll:()=>6,...opts});
function choices(s){let n=0;while(s.abilityChoices.length){assert(n++<50);assert(G.AI.resolveCharacterAbility(s).ok);}}
function force(s,id){choices(s);const a=u(s,id);s.order=[a.uid,...s.order.filter(x=>x!==a.uid)];s.acted={};return a;}
function attack(s,id,target,mana=0){const a=force(s,id),r=G.performBasicAttack(s,a.uid,target.uid,mana);assert(r.ok,r.error);return r;}
function give(s,id,side='player'){const i=s.deck.pile.findIndex(c=>c.id===id);assert(i>=0);const c=s.deck.pile.splice(i,1)[0];s.deck.hands[side].push(c);return c;}

test('as 29 cartas únicas estão ativas com todos os atributos manuais e correções explícitas',()=>{
 const m=JSON.parse(fs.readFileSync('assets/rebalance/kit-master-upgrade/manifest.json'));assert.equal(m.cards.length,29);assert.equal(new Set(m.updatedCharacters).size,29);assert.equal(G.MASTER_UPGRADE.length,29);assert.equal(G.CHARACTERS.length,31);
 for(const x of m.cards){const c=G.getCharacterById(x.candidateCharacterId),o=x.observed;assert(c,x.key);assert.equal(c.cardBase.src,x.asset);assert.equal(c.maxHp,o.hp);assert.equal(c.speed,c.id==='striker'?3:o.speed);assert.equal(c.stamina,o.stamina);assert.equal(c.rarity,x.key==='vaglar_epic'?'COMMON':o.rarity);assert.equal(c.class,x.key==='sam'?'FIGHTER':o.class);assert.equal(x.status,'active');assert.equal(crypto.createHash('sha256').update(fs.readFileSync(x.asset)).digest('hex'),x.sha256);}
 assert.equal(G.getCharacterById('striker').name,'Striker');assert(G.cardHTML(G.getCharacterById('striker')).includes('STRIKER'));assert.match(G.cardHTML(G.getCharacterById('striker')),/data-value="speed"[^>]*>3<\/div>/);assert.equal(G.getCharacterById('john').maxHp,250);assert.equal(G.getCharacterById('sarck').maxHp,530);
});

test('dano impresso com multiplicação mantém seu significado e Sam recebe apenas o remendo do ícone',()=>{
 for(const [id,damage,display] of [['sam',70,'70×6'],['chama',55,'55×6'],['ddx',45,'45×2'],['draktar',90,'90×2']]){const c=G.getCharacterById(id);assert.equal(c.damage,damage);assert(G.cardHTML(c).includes('>'+display+'</div>'));}
 const sam=G.getCharacterById('sam');assert.equal(sam.class,'FIGHTER');assert.equal(sam.parryThreshold,5);assert(G.cardHTML(sam).includes('class-correction'));assert.equal(sam.cardBase.patches[0].src,'assets/cards/card_base_sam.png');
});

test('Linx calcula 30% da Vida máxima, não da Vida atual, e arredonda para cinco',()=>{
 const s=battle(),t=u(s,'ddx');t.maxHp=1010;t.hp=400;const a=force(s,'linx');assert.equal(G.previewDamage(s,a,0,t),305);attack(s,'linx',t);assert.equal(t.hp,95);assert.equal(s.lastEvent.hits[0].amount,305);assert.equal(G.getMainAbility(a).trigger,'maxHpStrike');assert(G.actorInfoHTML(s,a).includes('30%'));
});

test('percentual de Linx respeita Parry, armadura e a transferência ao protetor',()=>{
 let s=battle(),a=force(s,'linx'),t=u(s,'ddx');s.roll=()=>1;attack(s,'linx',t);assert.equal(s.lastEvent.hits[0].type,'parry');assert.equal(t.hp,260);
 s=battle(['linx'],['cavaleiro']);t=u(s,'cavaleiro');assert.equal(G.previewDamage(s,u(s,'linx'),0,t),60);attack(s,'linx',t);assert.equal(t.hp,860);
 s=battle(['linx'],['z_zus','john']);assert(G.resolveCharacterAbility(s,u(s,'z_zus').uid,u(s,'john').uid).ok);t=u(s,'john');t.maxHp=t.hp=1000;attack(s,'linx',t);assert.equal(t.hp,1000);assert.equal(u(s,'z_zus').hp,960);
});

test('Linx ataca Daly exposta por uma vida e silêncio bloqueia sua habilidade sem ataque básico',()=>{
 const s=battle();G.eliminateUnit(s,u(s,'ddx'));const a=force(s,'linx');assert(G.performBasicAttack(s,a.uid,'daly_enemy').ok);assert.equal(s.daly.enemy.hp,2);
 const t=battle(),l=u(t,'linx');l.silenceRemaining=4;assert(G.isActionLocked(l));assert(!G.performBasicAttack(t,l.uid,u(t,'ddx').uid).ok);
});

test('classes atualizadas fornecem mana, Parry e resistência individual corretos',()=>{
 for(const c of G.CHARACTERS)assert.equal(G.manaFor(c),c.class==='MAGO'?3:0,c.name);
 for(const [id,limit] of [['sam',5],['daztirry',3],['rayvilin',2],['ddx',3],['linx',1],['stally',5],['alex',1]]){const s=battle([id],['eletric']);choices(s);assert.equal(u(s,id).parryThreshold,limit);for(let n=1;n<=6;n++){s.roll=()=>n;const target=u(s,id);target.hp=target.maxHp;assert.equal(G.applyCharacterHit(s,u(s,'eletric'),target,10).type,n<=limit?'parry':'hit');}}
 const s=battle(['z_zus'],['john']);assert.equal(G.damageInfo(u(s,'z_zus'),100).damage,80);assert.equal(G.damageInfo({...u(s,'z_zus'),tankResistance:0},100).damage,100);
});

test('Karma Destroyer testa crítico em cada revide e o Fighter não rola Parry',()=>{
 const s=battle(['karma','mike'],['ddx']);assert(G.resolveCharacterAbility(s,u(s,'karma').uid,u(s,'mike').uid).ok);let rolls=[1,1];s.roll=()=>{assert(rolls.length,'Somente o crítico de cada revide deve rolar.');return rolls.shift();};attack(s,'ddx',u(s,'mike'));assert.deepEqual(s.lastEvent.reactions.map(h=>h.amount),[150,150]);assert(s.lastEvent.reactions.every(h=>h.critical.critical));assert.equal(u(s,'ddx').hp,0);
});

test('Chama usa 55 inicial e cinco queimaduras de 55; Nully multiplica 80 e Elétrica usa 100',()=>{
 let s=battle(['chama'],['fonior']),t=u(s,'fonior');t.maxHp=t.hp=2000;attack(s,'chama',t,2);assert.equal(t.hp,1925);assert.equal(s.burns[0].damage,55);assert.equal(u(s,'chama').mana,2);G.completeAction(s,t);G.recordBattleEvent(s,{type:'wait',hits:[]});G.finishResolvedAction(s);assert.equal(t.hp,1870);
 s=battle(['nully'],['ddx']);u(s,'ddx').hp=u(s,'ddx').maxHp=2000;u(s,'ddx').parryThreshold=0;s.roll=()=>4;attack(s,'nully',u(s,'ddx'));assert.equal(u(s,'ddx').hp,1680);
 s=battle(['eletric'],['mike']);u(s,'mike').hp=130;attack(s,'eletric',u(s,'mike'));assert.equal(u(s,'mike').hp,30);
});

test('IA evita escolher um Assassino com esquiva garantida quando pode atingir outro alvo',()=>{
 const s=battle(['striker'],['nully','zuri']);choices(s);const a=u(s,'striker');assert.equal(a.speed,3);assert.equal(u(s,'nully').speed,9);assert.equal(G.AI.chooseTarget(s,a).id,'zuri');attack(s,'striker',u(s,'zuri'));assert.equal(u(s,'zuri').hp,830);
});

test('todos os 31 laboratórios montam formações válidas sem personagens provisórios',()=>{
 for(const c of G.CHARACTERS){const s=G.createAbilityTestState(c.id);choices(s);assert(s.units.some(x=>x.id===c.id));for(const side of ['player','enemy'])assert(G.getBoard(s)[side].rear.every(G.canTransit));assert(!G.cardHTML(c).includes('undefined'));}
});

test('40 partidas atuais com MAX terminam conservando os 32 personagens e 57 cartas',()=>{
 const seeded=seed=>()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
 for(let i=0;i<40;i++){const rng=seeded(26000+i),{sel}=G.createSelection({rng});while(!G.selectionDone(sel)){const av=G.selectionAvailable(sel);if(G.selectionTurn(sel)==='player')G.selectionPick(sel,'player',av[i%av.length]);else G.selectionBotPick(sel);}const teams=G.selectionTeams(sel),s=G.createBattleState(teams.player,teams.enemy,[],{rng}),side=i%2?'player':'enemy';for(let n=0;n<3;n++)give(s,'fragmento_01',side);let steps=0;
  while(!s.result&&steps++<2500){let r;if(s.deck.pendingChoice)r=G.resolveHandReplacement(s,null);else if(s.recovery)r=G.AI.resolveRecovery(s);else if(s.formation)r=G.AI.resolveFormation(s);else if(s.support.pending)r=G.resolveBrisa(s,null);else if(s.abilityChoices.length)r=G.AI.resolveCharacterAbility(s);else{const a=G.getNextActor(s);if(s.result)break;if(s.deck.pendingChoice||s.abilityChoices.length)continue;if(a)r=G.AI.takeTurn(s,a);else r=G.resolveIdleAI(s,'player')||G.resolveIdleAI(s,'enemy')||G.advanceIdleCycle(s);}assert(r?.ok,i+': '+r?.error);const physical=[...Object.values(s.piles).flat(),...s.units,...s.divineReserve];assert.equal(physical.length,32);assert.equal(new Set(physical.map(c=>c.iid)).size,32);const cards=[...s.deck.pile,...s.deck.hands.player,...s.deck.hands.enemy,...s.deck.discard,...(s.deck.pendingChoice?[s.deck.pendingChoice.incoming]:[])];assert.equal(cards.length,57);for(const team of ['player','enemy']){assert(G.getBoard(s)[team].front.length<=G.frontLimit(s,team));assert(s.deck.hands[team].length<=5);}}
  assert(s.result,'partida atual MAX não terminou '+i);assert.equal(s.units.filter(G.isGod).length,1);
 }
});
test('IA que acorda ainda resolve outro impedimento antes de tentar atacar',()=>{
 const s=battle(['stally'],['john']),a=force(s,'stally');a.sleep=true;a.paralysis=2;a.paralysisStarted=0;s.roll=()=>1;const turn=s.turn;assert(G.AI.takeTurn(s,a).ok);assert(!a.sleep);assert.equal(a.paralysis,1);assert.equal(s.turn,turn+1);assert.equal(s.lastEvent.type,'status-skip');
});
test('ação extra na mesma rodada permite um novo teste para acordar',()=>{
 const s=battle(['stally'],['john']),a=force(s,'stally');a.sleep=true;s.roll=()=>6;assert(G.grantSupportExtra(s,a));const round=s.round,turn=s.turn;assert(G.AI.takeTurn(s,a).ok);assert(a.sleep);assert.equal(s.turn,turn+1);assert.equal(s.round,round);assert.equal(G.getNextActor(s).uid,a.uid);assert(G.isSupportExtra(s,a.uid));s.roll=()=>1;assert(G.AI.takeTurn(s,a).ok);assert(!a.sleep);assert.equal(s.turn,turn+2);assert.equal(s.round,round);assert.equal(s.lastEvent.type,'attack');
});
console.log(`${passed} testes da integração completa do KitMasterUpgrade passaram`);
