// Functional regression of the balance choices authorized for v0.32.0.
const assert=require('node:assert/strict');
['data/characters','data/gods','data/support_cards','data/reset_cards','core/battle','core/character_abilities','core/deck','core/support','core/roster','core/official_abilities','core/support_effects','core/divine','core/selection','core/ai'].forEach(f=>require('../js/'+f+'.js'));
const G=GOGHOS;let passed=0;
const test=(name,fn)=>{fn();passed++;console.log('OK  '+name);};
const battle=(player,enemy,options={})=>G.createBattleState({front:player,rear:options.rear||[]},{front:enemy,rear:options.enemyRear||[]},[],{rng:()=>.5,roll:options.roll||(()=>6)});
const unit=(s,id)=>s.units.find(u=>u.id===id);
function choices(s){let guard=0;while(s.abilityChoices.length){assert(guard++<60);const r=G.AI.resolveCharacterAbility(s);assert(r.ok,r.error);}}
function force(s,id){const a=unit(s,id);s.order=[a.uid,...s.order.filter(uid=>uid!==a.uid)];s.acted={};s.speedCursor=a.speed;assert.equal(G.getNextActor(s)?.uid,a.uid);return a;}
function tick(s,id){const a=unit(s,id)||s.units.find(u=>!G.isCharacterDefeated(u));G.completeAction(s,a);G.recordBattleEvent(s,{type:'wait',actorUid:a.uid,hits:[]});G.finishResolvedAction(s);}
function petrify(s,a,t){assert(G.requestOfficialChoice(s,a.uid,'petrify').ok);const before=s.turn,count=a.actionsTaken;s.roll=()=>1;assert(G.resolveCharacterAbility(s,a.uid,t.uid).ok);assert.equal(s.turn,before);assert.equal(a.actionsTaken,count);}
function prepareTurnPetrify(){const s=battle(['rayvilin','mike'],['alex','john']);choices(s);const a=force(s,'rayvilin'),t=unit(s,'alex');t.hp=t.maxHp=1000;petrify(s,a,t);return{s,a,t};}

test('petrificação de entrada permite execução na primeira vez própria',()=>{
 const s=battle(['rayvilin'],['alex'],{roll:()=>1}),a=unit(s,'rayvilin'),t=unit(s,'alex');t.hp=t.maxHp=1000;
 assert(G.resolveCharacterAbility(s,a.uid,t.uid).ok);force(s,'rayvilin');assert(G.canExecutePetrified(s,a,t));
 const before=JSON.stringify(s);for(let i=0;i<5;i++)assert(G.canExecutePetrified(s,a,t));assert.equal(JSON.stringify(s),before);
 assert(G.performBasicAttack(s,a.uid,t.uid).ok);assert(s.lastEvent.hits[0].instant);assert(t.eliminated);
});
test('petrificar gratuitamente na própria vez dá ataque normal e só a próxima ação própria executa',()=>{
 const {s,a,t}=prepareTurnPetrify();assert(!G.canExecutePetrified(s,a,t));assert.equal(G.previewDamage(s,a,0,t),180);
 assert(G.performBasicAttack(s,a.uid,t.uid).ok);assert.equal(s.lastEvent.hits[0].instant,false);assert.equal(t.hp,820);assert.equal(a.actionsTaken,1);
 assert(!G.performBasicAttack(s,a.uid,t.uid).ok);G.grantSupportExtra(s,a);assert.equal(G.getNextActor(s).uid,a.uid);assert(G.canExecutePetrified(s,a,t));
 assert(G.performBasicAttack(s,a.uid,t.uid).ok);assert(s.lastEvent.hits[0].instant);assert(t.eliminated);
});
test('ações de outros personagens e reordenação gratuita não antecipam a execução de Rayvilin',()=>{
 const {s,a,t}=prepareTurnPetrify(),ally=unit(s,'mike');const count=a.actionsTaken;tick(s,'mike');G.reorderCurrentOrder(s);
 assert.equal(a.actionsTaken,count);assert.equal(ally.actionsTaken,1);assert(!G.canExecutePetrified(s,a,t));
 force(s,'rayvilin');assert(G.performBasicAttack(s,a.uid,t.uid).ok);assert.equal(t.hp,820);
});
test('quebrar a maldição limpa sua marca e uma nova petrificação espera uma nova ação própria',()=>{
 const {s,a,t}=prepareTurnPetrify();assert(G.performBasicAttack(s,a.uid,t.uid).ok);assert(G.canExecutePetrified(s,a,t));
 const j=force(s,'john');assert(G.performBreakCurse(s,j.uid,t.uid).ok);assert.equal(t.hp,790);assert.equal(t.petrifiedBy,null);assert.equal(t.petrifiedAtActionCount,null);assert(!G.canExecutePetrified(s,a,t));
 G.buildTurnOrder(s);force(s,'rayvilin');petrify(s,a,t);assert.equal(t.petrifiedAtActionCount,1);assert(!G.canExecutePetrified(s,a,t));
});
test('eliminar o alvo limpa a marca; eliminar Rayvilin preserva a maldição existente',()=>{
 let x=prepareTurnPetrify();G.eliminateUnit(x.s,x.t);assert.equal(x.t.petrifiedBy,null);assert.equal(x.t.petrifiedAtActionCount,null);
 x=prepareTurnPetrify();const source=x.a.uid;G.eliminateUnit(x.s,x.a);assert.equal(x.t.petrifiedBy,source);assert(!G.canExecutePetrified(x.s,x.a,x.t));
});
test('estrela dá exatamente +150 de Vida, +50 de dano e +1 de velocidade, mesmo após Unicorn morrer',()=>{
 const s=battle(['unicorn','mike'],['alex']),a=unit(s,'unicorn'),m=unit(s,'mike');m.hp=30;
 assert(G.resolveCharacterAbility(s,a.uid,m.uid).ok);assert.deepEqual([m.hp,m.maxHp,m.damage,m.speed],[180,280,220,6]);assert(a.entryAbilityUsed);
 G.eliminateUnit(s,a);assert.deepEqual([m.hp,m.maxHp,m.damage,m.speed],[180,280,220,6]);assert(G.officialStatus(s,m).includes('+1 velocidade'));
});
test('Oni dura quatro ações globais e Poder Adicional renova por mais quatro',()=>{
 const s=battle(['daztirry'],['mike','john']),a=unit(s,'daztirry');a.hp=10;const before=a.damage;
 G.dealCharacterDamage(s,unit(s,'mike'),a,100);assert(a.oniActive);assert.equal(a.oniRemaining,4);assert.equal(a.damage,before+30);
 a.oniExtraUses=1;for(let n=0;n<3;n++)tick(s,'john');assert.equal(a.oniRemaining,1);assert(!a.eliminated);tick(s,'john');assert.equal(a.oniRemaining,4);assert.equal(a.oniExtraUses,0);
 for(let n=0;n<3;n++)tick(s,'john');assert(!a.eliminated);tick(s,'john');assert(a.eliminated);assert(!a.oniActive);assert(s.log.some(x=>x.includes('mais 4 ações globais')));
});
test('Linx usa 35% da Vida máxima e a prévia acompanha arredondamento e defesas',()=>{
 const s=battle(['linx'],['ddx']),a=force(s,'linx'),t=unit(s,'ddx');t.maxHp=1010;t.hp=400;t.parryThreshold=0;
 assert.equal(G.previewDamage(s,a,0,t),355);assert(G.performBasicAttack(s,a.uid,t.uid).ok);assert.equal(t.hp,45);assert.equal(s.lastEvent.hits[0].amount,355);
 const q=battle(['linx'],['cavaleiro']),l=force(q,'linx'),c=unit(q,'cavaleiro');assert.equal(G.previewDamage(q,l,0,c),65);assert(G.performBasicAttack(q,l.uid,c.uid).ok);assert.equal(c.hp,855);
});
test('Chama conserva golpe 55 e revide 35×3, mas sua queimadura ofensiva é 40×5',()=>{
 const s=battle(['chama'],['fonior']),a=force(s,'chama'),t=unit(s,'fonior');t.hp=t.maxHp=2000;
 assert(G.performBasicAttack(s,a.uid,t.uid).ok);assert.equal(t.hp,1945);assert.deepEqual([s.burns[0].damage,s.burns[0].remaining],[40,5]);
 for(let n=0;n<5;n++)tick(s,'fonior');assert.equal(t.hp,1745);assert.equal(s.burns.length,0);
 const q=battle(['chama'],['mike','john']),c=unit(q,'chama'),m=force(q,'mike');c.hp=10;
 assert(G.performBasicAttack(q,m.uid,c.uid).ok);assert(c.eliminated);const b=q.burns.find(x=>x.kind==='defense');assert.deepEqual([b.damage,b.remaining],[35,3]);
 for(let n=0;n<3;n++)tick(q,'john');assert.equal(m.hp,25);
});
test('Zuri cura da retaguarda uma vez, usa a ação e não ganha ataque traseiro',()=>{
 const s=battle(['mike'],['john'],{rear:['zuri']}),a=unit(s,'zuri'),m=unit(s,'mike');a.hp=800;m.hp=30;force(s,'zuri');
 assert(G.canUseRearAbility(a));assert(G.hasActionTarget(s,a));assert(G.hasMeaningfulAction(s,a));const before=s.turn;
 assert(!G.performBasicAttack(s,a.uid,unit(s,'john').uid).ok);assert(G.performFullHeal(s,a.uid).ok);assert.equal(s.turn,before+1);assert.equal(a.actionsTaken,1);assert.equal(m.hp,m.maxHp);assert.equal(a.hp,800);assert(a.fullHealUsed);assert.equal(a.row,'rear');assert(!G.canAct(a));assert(!G.performFullHeal(s,a.uid).ok);
});
test('Zuri traseira sem aliados feridos pode esperar e a IA usa a cura quando há feridos',()=>{
 let s=battle(['mike'],['john'],{rear:['zuri']}),a=force(s,'zuri');assert(!G.hasActionTarget(s,a));assert(G.performWait(s,a.uid).ok);assert(!a.fullHealUsed);
 s=battle(['mike'],['john'],{rear:['zuri']});a=force(s,'zuri');unit(s,'mike').hp=100;assert(G.officialAITurn(s,a).ok);assert(a.fullHealUsed);assert.equal(unit(s,'mike').hp,130);
});
test('IA preserva Zuri atrás com combatentes ativos e pode avançá-la para resolver uma frente somente passiva',()=>{
 let s=battle(['mike'],['cavaleiro'],{rear:['zuri']}),a=force(s,'zuri');s.deck.hands.player=[];s.deck.hands.enemy=[];
 assert(G.AI.takeTurn(s,a).ok);assert.equal(a.row,'rear');assert(!a.fullHealUsed);assert.equal(a.actionsTaken,1);
 s=battle(['sarck'],['cavaleiro'],{rear:['zuri']});a=force(s,'zuri');s.deck.hands.player=[];s.deck.hands.enemy=[];
 assert(G.hasMeaningfulAction(s,a));assert(G.AI.takeTurn(s,a).ok);assert.equal(a.row,'front');assert(!a.fullHealUsed);assert.equal(a.actionsTaken,1);assert.equal(unit(s,'cavaleiro').hp,885);
});
test('esquiva natural permite acerto com 6 mesmo com diferença de nove; Trucc e Magos preservam suas regras',()=>{
 const s=battle(['alex'],['nully']),a=unit(s,'alex'),t=unit(s,'nully');a.speed=1;t.speed=10;t.hp=t.maxHp=1000;
 s.roll=()=>5;assert.equal(G.officialApplyHit(s,a,t,100).type,'dodge');s.roll=()=>6;const h=G.officialApplyHit(s,a,t,100);assert.equal(h.damage,100);assert.equal(h.dodge.threshold,5);assert.equal(h.dodge.diff,9);assert(G.hittableTargets(s,a).includes(t));
 const q=battle(['alex','eletric'],['trucc']);const tr=unit(q,'trucc');q.roll=()=>6;assert.equal(G.officialApplyHit(q,unit(q,'alex'),tr,100).type,'dodge');const old=tr.hitWindow;assert.equal(G.officialApplyHit(q,unit(q,'eletric'),tr,100).damage,100);assert.equal(tr.hitWindow,old+1);
});
test('Burn mantém hipnose garantida e dano fixo 90, sem introduzir teste de fuga',()=>{
 const s=battle(['barn'],['alex','john']),a=unit(s,'barn'),t=unit(s,'alex');assert(G.resolveCharacterAbility(s,a.uid,t.uid).ok);force(s,'alex');s.roll=()=>{throw Error('Hipnose não deve rolar fuga');};assert(G.performStatusTurn(s,t.uid).spent);assert.equal(t.hypnotizedBy,a.uid);
 force(s,'barn');const hp=t.hp;assert(G.performHypnosisTurn(s,a.uid).ok);assert.equal(t.hp,hp-90);assert.equal(t.hypnotizedBy,a.uid);
});
console.log(`${passed} testes das habilidades do balanceamento v0.32 passaram`);
