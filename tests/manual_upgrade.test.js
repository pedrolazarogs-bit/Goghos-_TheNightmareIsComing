const assert=require('node:assert/strict'),fs=require('node:fs'),crypto=require('node:crypto');
['data/characters','data/gods','data/support_cards','data/reset_cards','core/battle','core/character_abilities','core/deck','core/support','core/roster','core/official_abilities','core/support_effects','core/divine','core/selection','core/ai','ui/card','ui/arena_ui','ui/battle_feedback'].forEach(f=>require('../js/'+f+'.js'));
require('./fixtures/v0_25_catalog.js'); // Regressão das regras e atributos da v0.25.0.
const G=GOGHOS;let passed=0;const test=(name,run)=>{run();passed++;console.log('OK  '+name);};
const unit=(s,id)=>s.units.find(u=>u.id===id);
const battle=(front=['sarck'],enemy=['john'],rear=['elysh'])=>G.createBattleState({front,rear},{front:enemy,rear:[]},[],{rng:()=>.5,roll:()=>6});
function choices(s){while(s.abilityChoices.length)assert(G.AI.resolveCharacterAbility(s).ok);}
function force(s,id){choices(s);const a=unit(s,id);s.order=[a.uid,...s.order.filter(x=>x!==a.uid)];s.acted={};s.speedCursor=null;assert.equal(G.getNextActor(s)?.uid,a.uid);return a;}

test('cinco personagens usam exatamente os dados manuais reconfirmados',()=>{
 for(const [id,hp,damage,speed,stamina,rarity,cls,parry] of [
 ['elysh',240,80,4,3,'COMMON','SUPPORT',0],['stally',230,90,2,4,'COMMON','FIGHTER',5],['mike',130,170,5,6,'COMMON','DESTROYER',0],['alex',200,170,3,2,'COMMON','FIGHTER',1],['cavaleiro',920,130,2,8,'LEGENDARY','TANK',0]]){
  const c=G.getCharacterById(id);assert.deepEqual([c.maxHp,c.damage,c.speed,c.stamina,c.rarity,c.class,c.parryThreshold||0],[hp,damage,speed,stamina,rarity,cls,parry],id);assert(c.manualBalance);assert(c.cardBase.src.includes('/rebalance/'));
 }
 assert.equal(G.getCharacterById('stally').name,'Stally');assert(G.cardHTML(G.getCharacterById('stally')).includes('STALLY'));
});

test('29 imagens preservam os hashes e Elysh duplicada tem uma única referência ativa',()=>{
 const m=JSON.parse(fs.readFileSync('assets/rebalance/kit-master-upgrade/manifest.json'));assert.equal(m.archiveFileCount,30);assert.equal(m.cards.length,29);assert.equal(new Set(m.cards.map(c=>c.sha256)).size,29);
 for(const c of m.cards)assert.equal(crypto.createHash('sha256').update(fs.readFileSync(c.asset)).digest('hex'),c.sha256,c.key);
 assert.equal(m.cards.find(c=>c.key==='elysh').sources.length,2);assert.equal(m.updatedCharacters.length,29);
 assert.equal(m.cards.find(c=>c.key==='linx').candidateCharacterId,'linx');assert.equal(m.cards.find(c=>c.key==='sheriff_epic').candidateCharacterId,'striker');
});

test('a seleção exige quatro Comuns e somente eles entram, em escolhas alternadas sem Raros',()=>{
 for(const seed of [0,.2,.5,.999]){const r=G.createSelection({rng:()=>seed});assert(r.ok);const s=r.sel;assert.deepEqual(new Set(s.offered),new Set(['elysh','stally','mike','alex']));assert.equal(G.selectionTeams(s),null);
  for(const side of ['player','enemy','player','enemy']){assert.equal(G.selectionTurn(s),side);assert(!G.selectionPick(s,side==='player'?'enemy':'player',G.selectionAvailable(s)[0]).ok);assert(side==='player'?G.selectionPick(s,side,G.selectionAvailable(s)[0]).ok:G.selectionBotPick(s).ok);}
  assert(G.selectionDone(s));assert.deepEqual(s.autoRares,{});const teams=G.selectionTeams(s);assert.equal(new Set([...teams.player.front,...teams.enemy.front]).size,4);
 }
 const original=G.CHARACTERS;try{G.CHARACTERS=original.filter(c=>c.id!=='stally');assert(!G.createSelection().ok);}finally{G.CHARACTERS=original;}
});

test('Elysh na retaguarda recebe sua vez por velocidade e cura 80 consumindo uma ação',()=>{
 const s=battle(),a=unit(s,'elysh'),t=unit(s,'sarck');t.hp=100;assert(s.order.includes(a.uid));assert.equal(G.getNextActor(s).uid,a.uid);const turn=s.turn,round=s.round,deck=s.deck.pile.length;assert(G.performHealingAttack(s,a.uid,t.uid).ok);assert.equal(t.hp,180);assert.equal(a.row,'rear');assert(s.acted[a.uid]);assert.equal(s.turn,turn+1);assert.equal(s.round,round);assert.equal(s.deck.pile.length,deck);assert.equal(s.lastEvent.healed,80);assert.equal(G.eventTitle(s.lastEvent),'Elysh curou');
});

test('cura da retaguarda respeita o máximo, não cura a própria Elysh nem restaura mortos',()=>{
 const s=battle(),a=force(s,'elysh'),t=unit(s,'sarck');t.hp=500;assert(G.performHealingAttack(s,a.uid,t.uid).ok);assert.equal(t.hp,530);assert.equal(s.lastEvent.healed,30);force(s,'elysh');a.hp=10;assert(!G.performHealingAttack(s,a.uid,a.uid).ok);G.eliminateUnit(s,t);assert(!G.performHealingAttack(s,a.uid,t.uid).ok);
});

test('Elysh da retaguarda não ataca personagens, Daly Mãe ou aliado petrificado',()=>{
 const s=battle(),a=force(s,'elysh'),t=unit(s,'sarck'),before=JSON.stringify(s);assert.deepEqual(G.attackTargets(s,a),[]);assert(!G.performBasicAttack(s,a.uid,unit(s,'john').uid).ok);assert.equal(JSON.stringify(s),before);t.petrifiedBy='source';assert.deepEqual(G.breakCurseTargets(s,a),[]);assert(!G.performBreakCurse(s,a.uid,t.uid).ok);G.eliminateUnit(s,unit(s,'john'));assert(G.isDalyExposed(s,'enemy'));assert(!G.performBasicAttack(s,a.uid,'daly_enemy').ok);assert.equal(s.daly.enemy.hp,3);
});

test('outros Suportes na retaguarda continuam fora da hierarquia',()=>{
 const s=battle(['mike'],['john'],['elysh','fonior']);assert(s.order.includes(unit(s,'elysh').uid));assert(!s.order.includes(unit(s,'fonior').uid));assert(!G.canAct(unit(s,'fonior')));
});

test('impedimentos e silêncio bloqueiam a cura; Apoio da mão continua disponível',()=>{
 for(const [key,value] of [['sleep',true],['paralysis',2],['petrifiedBy','source'],['hypnotizedBy','source'],['pinnedBy','source'],['pinning','source']]){
  const s=battle(),a=force(s,'elysh');a[key]=value;unit(s,'sarck').hp=100;const turn=s.turn;assert(!G.performHealingAttack(s,a.uid,unit(s,'sarck').uid).ok,key);assert(G.canUseHand(s,'player'));assert.equal(s.turn,turn);
 }
 const s=battle(),a=unit(s,'elysh');a.silenceRemaining=4;assert(!G.canAct(a));assert(!G.canHealFromRear(a));a.silenceRemaining=0;assert(G.canAct(a));
});

test('Elysh pode passar sem aliados feridos, ou avançar e atacar sem uma ação extra',()=>{
 const s=battle(),a=force(s,'elysh');assert(!G.hasActionTarget(s,a));assert(G.hasMeaningfulAction(s,a));const turn=s.turn;assert(G.performWait(s,a.uid).ok);assert.equal(s.turn,turn+1);force(s,'elysh');const n=s.turn;assert(G.performTransit(s,a.uid).ok);assert.equal(a.row,'front');assert.equal(s.turn,n);assert(G.performBasicAttack(s,a.uid,unit(s,'john').uid).ok);assert.equal(s.turn,n+1);
});

test('IA cura da retaguarda quando necessário e avança para atacar quando todos estão bem',()=>{
 let s=battle(),a=force(s,'elysh');unit(s,'sarck').hp=100;assert(G.AI.takeTurn(s,a).ok);assert.equal(unit(s,'sarck').hp,180);assert.equal(a.row,'rear');assert.equal(s.lastEvent.type,'heal');
 s=battle();a=force(s,'elysh');const turn=s.turn;assert(G.AI.takeTurn(s,a).ok);assert.equal(a.row,'front');assert.equal(s.turn,turn+1);assert.equal(s.lastEvent.actorUid,a.uid);
});

test('sem alvos de cura, Elysh com vaga para avançar impede empate prematuro',()=>{
 const s=battle();G.eliminateUnit(s,unit(s,'john'));s.deck.discard.push(...s.deck.pile);s.deck.pile=[];assert(!G.isIdleBattle(s));assert.equal(G.checkIdleDraw(s),null);const a=force(s,'elysh');assert(G.AI.takeTurn(s,a).ok);assert.equal(a.row,'front');
});

test('Cavaleiro bloqueia somente 80%, sem somar o tributo natural de Tank',()=>{
 const s=battle(['cavaleiro'],['john'],[]),c=unit(s,'cavaleiro');assert.equal(c.tankResistance,0);assert.equal(G.tankResistanceFor(c),0);assert.equal(G.damageInfo(c,500).damage,100);assert.equal(G.damageInfo(c,100).damage,20);c.silenceRemaining=4;assert.equal(G.damageInfo(c,500).damage,500);assert(G.actorInfoHTML(s,c).includes('Sem resistência natural'));
});

test('Stally usa Parry 1–5; Alex usa Parry 1; Magos continuam sujeitos ao Parry',()=>{
 for(const [id,limit] of [['stally',5],['alex',1]])for(let roll=1;roll<=6;roll++){
  const s=battle([id],['eletric'],[]);s.roll=()=>roll;const a=unit(s,'eletric'),t=unit(s,id),hit=G.applyCharacterHit(s,a,t,50);assert.equal(hit.type,roll<=limit?'parry':'hit',id+' / '+roll);assert.equal(hit.damage,roll<=limit?0:50);
 }
});

test('laboratórios continuam disponíveis com seleção sem Raros automáticos',()=>{
 for(const c of G.CHARACTERS){const s=G.createAbilityTestState(c.id);assert(s.units.some(u=>u.id===c.id));choices(s);assert(!s.result);}
 for(const side of ['player','enemy']){const s=G.createSarkTestState(side);assert.deepEqual(new Set(s.units.filter(u=>u.id!=='sarck').map(u=>u.rarity)),new Set(['COMMON','RARE','LEGENDARY']));}
});

test('mover Elysh para trás mantém sua vez e a cura não permite agir uma segunda vez',()=>{
 const s=battle(['elysh','mike'],['john'],[]),a=force(s,'elysh'),t=unit(s,'mike');t.hp=10;const turn=s.turn;assert(G.performTransit(s,a.uid).ok);assert.equal(a.row,'rear');assert.equal(G.getNextActor(s).uid,a.uid);assert(G.performHealingAttack(s,a.uid,t.uid).ok);assert.equal(t.hp,90);assert.equal(s.turn,turn+1);const snapshot=JSON.stringify(s);assert(!G.performHealingAttack(s,a.uid,t.uid).ok);assert.equal(JSON.stringify(s),snapshot);
});

test('Morto Vivo mantém Elysh sem habilidade e sem vez de cura na retaguarda',()=>{
 const s=battle(['sarck','mike','ddx'],['john']),a=unit(s,'elysh');G.eliminateUnit(s,a);force(s,'mike');const pile=s.deck.pile,i=pile.findIndex(c=>c.id==='morto_vivo'),card=pile.splice(i,1)[0];s.deck.hands.player.push(card);assert(G.performHandSupport(s,card.iid,a.uid).ok);assert.equal(a.hp,1);assert.equal(a.row,'rear');assert(a.revivedNoAbility);assert(!G.canHealFromRear(a));assert(!G.canAct(a));
});

console.log(`${passed} testes dos kits e do balanceamento manual passaram`);
