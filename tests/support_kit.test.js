const assert=require('node:assert/strict');
['data/characters','data/gods','data/support_cards','data/reset_cards','core/battle','core/character_abilities','core/deck','core/support','core/roster','core/official_abilities','core/support_effects','core/divine','core/selection','core/ai','ui/card'].forEach(f=>require('../js/'+f+'.js'));
require('./fixtures/v0_25_catalog.js'); // Regressão das regras e atributos da v0.25.0.
const G=GOGHOS;let passed=0;const test=(n,f)=>{f();passed++;console.log('OK  '+n);};
const u=(s,id)=>s.units.find(c=>c.id===id);
const battle=(p=['ddx','mike'],e=['john','sam'])=>G.createBattleState({front:p,rear:[]},{front:e,rear:[]},[],{rng:()=>.5,roll:()=>6});
function force(s,id){const a=u(s,id);s.order=[a.uid,...s.order.filter(x=>x!==a.uid)];s.acted=Object.fromEntries(s.order.map(x=>[x,x!==a.uid]));s.speedCursor=a.speed;return a;}
function hand(s,id,side='player'){const i=s.deck.pile.findIndex(c=>c.id===id);assert(i>=0,id);const c=s.deck.pile.splice(i,1)[0];s.deck.hands[side].push(c);return c;}
function use(s,id,target,side='player'){const c=hand(s,id,side),r=G.performHandSupport(s,c.iid,target?.uid,side);assert(r.ok,r.error);return c;}
const clock=s=>JSON.stringify({turn:s.turn,round:s.round,order:s.order,acted:s.acted,cursor:s.speedCursor,resets:[...s.deck.resets]});
function tick(s,a){G.completeAction(s,a);G.recordBattleEvent(s,{type:'wait',actorUid:a.uid,hits:[]});G.finishResolvedAction(s);}

test('kit tem 17 Apoios oficiais sem IDs duplicados e originais existentes',()=>{
 const fs=require('node:fs');assert.equal(G.SUPPORT_CARDS.length,17);assert.equal(new Set(G.SUPPORT_CARDS.map(c=>c.id)).size,17);
 for(const c of G.SUPPORT_CARDS){assert(fs.existsSync(c.art));assert.equal(G.RESET_CARDS.filter(r=>r.id===c.id).length,1);}
});
test('Bandeide cura e respeita o máximo sem avançar a hierarquia',()=>{
 const s=battle(),a=force(s,'ddx');a.hp=250;const before=clock(s);use(s,'bandeide',a);assert.equal(a.hp,a.maxHp);assert.equal(clock(s),before);assert.equal(s.lastEvent.hits[0].healed,35);
});
test('Zap descarta somente um Apoio, preservando medalhas e conservação de cartas',()=>{
 const s=battle();force(s,'ddx');const target=hand(s,'brisa','enemy'),medal=hand(s,G.MEDAL_ID.RARE,'enemy');use(s,'zap');assert.deepEqual(s.deck.hands.enemy,[medal]);assert(s.deck.discard.some(c=>c.iid===target.iid&&c.reason==='zap'));
});
test('Furto abre vaga antes de roubar e nunca ultrapassa cinco na mão',()=>{
 const s=battle();force(s,'ddx');const stolen=hand(s,'brisa','enemy');for(const id of ['item_01','item_02',G.MEDAL_ID.RARE,'habilidade_01'])hand(s,id);use(s,'furto');assert.equal(s.deck.hands.player.length,5);assert(s.deck.hands.player.some(c=>c.iid===stolen.iid));assert.equal(s.deck.hands.enemy.length,0);
});
test('Zap sem alvo e Papakill em Vida 40 não consomem a carta',()=>{
 for(const id of ['zap','papakill']){const s=battle();force(s,'ddx');const a=u(s,'john');a.hp=40;const c=hand(s,id),before=clock(s);assert(!G.performHandSupport(s,c.iid,a.uid).ok);assert(s.deck.hands.player.includes(c));assert.equal(clock(s),before);assert.equal(a.hp,40);}
});
test('Papakill executa abaixo de 40 e remove a unidade para os excluídos',()=>{
 const s=battle();force(s,'ddx');const a=u(s,'john');a.hp=35;use(s,'papakill',a);assert(a.eliminated);assert(s.eliminated.some(c=>c.uid===a.uid));assert(!Object.values(s.piles).flat().some(c=>c.iid===a.iid));
});
test('Não Grita desliga a armadura por quatro ações, sem bloquear o ataque normal',()=>{
 const s=battle(['ddx'],['cavaleiro']),a=force(s,'ddx'),t=u(s,'cavaleiro');use(s,'nao_grita',t);assert.equal(t.silenceRemaining,4);assert.equal(G.damageInfo(t,100).damage,100);assert(!G.isActionLocked(t));
 for(let i=0;i<3;i++){tick(s,a);assert.equal(t.silenceRemaining,3-i);}tick(s,a);assert.equal(t.silenceRemaining,0);assert.equal(G.damageInfo(t,100).damage,20);
});
test('Não Grita libera hipnose e impede uma nova hipnose enquanto estiver ativa',()=>{
 const s=battle(['ddx'],['barn']);const a=u(s,'barn'),t=u(s,'ddx');assert(G.resolveCharacterAbility(s,a.uid,t.uid).ok);force(s,'ddx');use(s,'nao_grita',a);assert.equal(a.hypnosisTarget,null);assert.equal(t.hypnotizedBy,null);assert.equal(G.getMainAbility(a),null);
});
test('Sortudo altera somente o próximo dado da equipe proprietária',()=>{
 const s=battle();force(s,'ddx');use(s,'sortudo');assert.equal(G.rollDie(s,{side:'enemy',best:1}),6);assert.equal(G.rollDie(s,{side:'player',best:2}),2);assert.equal(G.rollDie(s,{side:'player',best:1}),6);
});
test('Sortudo garante o 6 da decapitação do Nully e depois se esgota',()=>{
 const s=battle(['nully'],['john']);force(s,'nully');use(s,'sortudo');assert(G.performBasicAttack(s,u(s,'nully').uid,u(s,'john').uid).ok);assert(u(s,'john').eliminated);assert.equal(s.lastEvent.rolls[0].roll,6);assert.equal(s.support.lucky,0);
});
test('Escudo Volátil absorve até 80 depois da armadura e é consumido uma vez',()=>{
 const s=battle(['ddx'],['cavaleiro']);force(s,'cavaleiro');const t=u(s,'cavaleiro');use(s,'escudo_volatil',t,'enemy');const hp=t.hp,h=G.dealCharacterDamage(s,u(s,'ddx'),t,100);assert.equal(t.hp,hp);assert.equal(t.shield,0);assert.equal(h.damage,0);G.dealCharacterDamage(s,u(s,'ddx'),t,100);assert.equal(t.hp,hp-20);
});
test('Escudo não é gasto por Parry e não bloqueia execução',()=>{
 const s=battle();force(s,'ddx');const t=u(s,'john');t.shield=80;s.roll=()=>1;assert.equal(G.applyCharacterHit(s,u(s,'ddx'),t,90).type,'parry');assert.equal(t.shield,80);G.dealCharacterDamage(s,u(s,'ddx'),t,0,{instant:true});assert.equal(t.hp,0);
});
test('Fôlego protege após o ataque sobrevivido e termina na próxima ação',()=>{
 const s=battle(),t=force(s,'ddx'),a=u(s,'john');use(s,'folego',t);const h=G.applyCharacterHit(s,a,t,80);G.resolveAttackResponses(s,a,t,h);assert.equal(t.hp,t.maxHp-80);assert.equal(t.invulnerable,1);assert.equal(G.dealCharacterDamage(s,a,t,0,{instant:true}).type,'immune');tick(s,a);assert.equal(t.invulnerable,0);
});
test('Fôlego não ressuscita quem sofreu dano fatal',()=>{
 const s=battle(),t=force(s,'ddx'),a=u(s,'john');t.hp=20;use(s,'folego',t);const h=G.applyCharacterHit(s,a,t,80);G.resolveAttackResponses(s,a,t,h);G.settleCasualties(s);assert(t.eliminated);assert.equal(t.invulnerable,0);
});
test('Na Moloeira funciona também para o adversário e só no próximo ataque',()=>{
 const s=battle(),a=force(s,'john'),t=u(s,'ddx');use(s,'na_moloeira',null,'enemy');const hp=t.hp;assert(G.performBasicAttack(s,a.uid,t.uid).ok);assert.equal(t.hp,hp-100);assert.equal(G.teamSupport(s,'enemy').nextAttackBonus,0);
});
test('Brisa adversária cura outro aliado quando ocorre uma eliminação',()=>{
 const s=battle();force(s,'john');const friend=u(s,'sam');friend.hp=300;use(s,'brisa',null,'enemy');u(s,'john').hp=0;G.settleCasualties(s);assert.equal(friend.hp,330);
});
test('Eu Denovo preserva a rodada e a velocidade restante após a única ação extra',()=>{
 const s=battle(),a=force(s,'ddx'),t=u(s,'sam');use(s,'eu_denovo',a);const round=s.round,buys=s.deck.resets.size,turn=s.turn;
 assert(G.performBasicAttack(s,a.uid,t.uid).ok);assert.equal(G.getNextActor(s).uid,a.uid);assert(G.performBasicAttack(s,a.uid,t.uid).ok);assert.equal(s.turn,turn+2);assert.equal(s.round,round);assert.equal(s.deck.resets.size,buys);assert.equal(a.extraCredits,0);assert.equal(s.supportExtra.length,0);assert(!G.performBasicAttack(s,a.uid,t.uid).ok);
});
test('Combokill concede novo ataque depois de uma eliminação por dano normal',()=>{
 const s=battle(),a=force(s,'ddx'),t=u(s,'john');t.hp=30;t.parryThreshold=0;use(s,'combokill',a);const round=s.round;assert(G.performBasicAttack(s,a.uid,t.uid).ok);assert(t.eliminated);assert.equal(G.getNextActor(s).uid,a.uid);assert.equal(s.round,round);assert(G.performBasicAttack(s,a.uid,u(s,'sam').uid).ok);assert.equal(s.supportExtra.length,0);
});
test('Combokill não concede ação após um golpe não fatal nem após perder a própria Vida',()=>{
 const s=battle(),a=force(s,'ddx');use(s,'combokill',a);assert(G.performBasicAttack(s,a.uid,u(s,'sam').uid).ok);assert.equal(s.supportExtra.length,0);
 const v=battle(['ddx'],['sarck']);force(v,'ddx');use(v,'combokill',u(v,'ddx'));assert(G.performBasicAttack(v,u(v,'ddx').uid,u(v,'sarck').uid).ok);assert(u(v,'ddx').eliminated);assert.equal(v.supportExtra.length,0);
});
test('Recruta libera exatamente a quarta vaga frontal e uma medalha a ocupa',()=>{
 const s=battle(['ddx','mike','alex'],['john']);force(s,'ddx');use(s,'recruta');assert.equal(G.frontLimit(s,'player'),4);assert.equal(G.frontLimit(s,'enemy'),3);const c=hand(s,G.MEDAL_ID.RARE);assert(G.resolveDalle(s,'player',c).ok);assert.equal(G.getBoard(s).player.front.length,4);s.turn++;force(s,'ddx');const second=hand(s,'recruta');assert(!G.performHandSupport(s,second.iid).ok);assert.equal(G.frontLimit(s,'player'),4);
});
test('Morto Vivo conserva a carta física, volta com 1 e não ativa habilidade de entrada',()=>{
 const s=battle(['ddx','unicorn'],['john']);assert(G.resolveCharacterAbility(s,u(s,'unicorn').uid,u(s,'ddx').uid).ok);const t=u(s,'unicorn'),iid=t.iid,uid=t.uid;G.eliminateUnit(s,t);force(s,'ddx');use(s,'morto_vivo',t);assert.equal(t.hp,1);assert.equal(t.iid,iid);assert.equal(t.uid,uid);assert(t.revivedNoAbility);assert.equal(G.getMainAbility(t),null);assert.equal(s.abilityChoices.length,0);assert(!s.eliminated.some(e=>e.uid===uid));assert.equal(s.units.filter(e=>e.iid===iid).length,1);
});
test('ressuscitado com 1 não recupera Vida ao receber um dano totalmente bloqueado',()=>{
 const s=battle(),a=force(s,'ddx'),t=u(s,'mike');G.eliminateUnit(s,t);use(s,'morto_vivo',t);t.shield=80;G.dealCharacterDamage(s,u(s,'john'),t,50);assert.equal(t.hp,1);
});
test('Poder Adicional recarrega o uso de quatro braços sem conceder ação',()=>{
 const s=battle(),a=force(s,'ddx');a.doubleUsed=true;const before=clock(s);use(s,'poder_adicional',a);assert(!a.doubleUsed);assert.equal(clock(s),before);assert(G.performBasicAttack(s,a.uid,u(s,'sam').uid,0,'double').ok);assert(a.doubleUsed);
});
test('Uma Mãozinha transfere a maior Vida máxima da arena ao aliado mais ferido',()=>{
 const s=battle();force(s,'ddx');u(s,'mike').hp=10;use(s,'uma_maozinha');assert.equal(u(s,'mike').hp,u(s,'sam').maxHp);assert.equal(u(s,'mike').maxHp,u(s,'sam').maxHp);assert(u(s,'mike').healthCopied);
});
test('Última Chance acompanha o limiar de 100 e não acumula +50 ao oscilar',()=>{
 const s=battle(),a=force(s,'ddx');a.hp=95;use(s,'ultima_chance',a);assert.equal(a.damage,140);a.hp=100;G.refreshSupportStats(s);assert.equal(a.damage,90);a.hp=90;G.refreshSupportStats(s);G.refreshSupportStats(s);assert.equal(a.damage,140);
});
test('Apoios funcionam durante imobilização e continuam limitados a um por ação da equipe',()=>{
 const s=battle(),a=force(s,'ddx');a.sleep=true;use(s,'escudo_volatil',a);assert(a.sleep);const c=hand(s,'sortudo');assert(!G.performHandSupport(s,c.iid).ok);assert.equal(s.turn,1);
});
test('testes de todas as cartas montam arena válida e conservam cada carta física',()=>{
 for(const c of G.SUPPORT_CARDS){const s=G.createSupportTestState(c.id);assert(s.deck.hands.player.some(h=>h.id===c.id));const all=[...s.deck.pile,...s.deck.hands.player,...s.deck.hands.enemy,...s.deck.discard];assert.equal(all.length,s.deck.total);assert.equal(new Set(all.map(c=>c.iid)).size,s.deck.total);}
});
test('Poder Adicional prepara outra duração de Oni sem duplicar o bônus de dano',()=>{const s=battle(['daztirry','mike'],['john']),a=force(s,'daztirry');G.dealCharacterDamage(s,u(s,'john'),a,2000);assert(a.oniActive);assert.equal(a.damage,450);use(s,'poder_adicional',a);for(let i=0;i<3;i++)tick(s,u(s,'john'));assert(a.oniActive);assert.equal(a.oniRemaining,3);assert.equal(a.damage,450);for(let i=0;i<3;i++)tick(s,u(s,'john'));assert(a.eliminated);});
console.log(`${passed} testes do kit de Apoio passaram`);
