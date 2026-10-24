const assert=require('node:assert/strict');
['data/characters','data/gods','data/support_cards','data/reset_cards','core/battle','core/character_abilities','core/deck','core/support','core/roster','core/official_abilities','core/support_effects','core/divine','core/selection','core/ai','ui/card','ui/arena_ui'].forEach(f=>require('../js/'+f+'.js'));
const G=globalThis.GOGHOS;let passed=0;
const test=(name,run)=>{run();passed++;console.log('OK  '+name);};
const battle=(p,e,opts={})=>G.createBattleState({front:p,rear:opts.rear||[]},{front:e,rear:opts.enemyRear||[]},[],{rng:opts.rng||(()=>.5),roll:opts.roll||(()=>6)});
const u=(s,id)=>s.units.find(x=>x.id===id);
const choices=s=>{let n=0;while(s.abilityChoices.length){assert(n++<50,'escolhas não terminam');const r=G.AI.resolveCharacterAbility(s);assert(r.ok,r.error);}};
const resolve=(s,id,target)=>{const r=G.resolveCharacterAbility(s,u(s,id).uid,u(s,target)?.uid);assert(r.ok,r.error);};
function force(s,id){const a=u(s,id);s.order=[a.uid,...s.order.filter(x=>x!==a.uid)];s.acted=Object.fromEntries(s.order.map(x=>[x,x!==a.uid]));s.speedCursor=a.speed;assert.equal(G.getNextActor(s)?.uid,a.uid);return a;}
function tick(s){const a=s.units.find(x=>!G.isCharacterDefeated(x));G.completeAction(s,a);G.recordBattleEvent(s,{type:'wait',actorUid:a.uid,actorName:a.name,hits:[]});G.finishResolvedAction(s);}
function attack(s,a,t,mode='normal'){const actor=force(s,a),r=G.performBasicAttack(s,actor.uid,u(s,t).uid,0,mode);assert(r.ok,r.error);return r;}

test('P. Ullys usa dano recebido no principal e atinge somente os vizinhos da frente',()=>{
 const s=battle(['p_ullys'],['alex','mike','cavaleiro'],{enemyRear:['elysh']});for(const t of s.units.filter(t=>t.team==='enemy'))t.hp=t.maxHp=1000;
 attack(s,'p_ullys','mike');assert.equal(u(s,'mike').hp,550);assert.equal(u(s,'alex').hp,910);assert.equal(u(s,'cavaleiro').hp,980);assert.equal(u(s,'elysh').hp,1000);assert.equal(s.lastEvent.hits.length,3);
 const blocked=battle(['p_ullys'],['alex','striker','mike']);u(blocked,'p_ullys').speed=10;u(blocked,'mike').hp=u(blocked,'mike').maxHp=1000;attack(blocked,'p_ullys','mike');assert.equal(u(blocked,'alex').hp,200);assert.equal(u(blocked,'striker').hp,445);
});
test('Stally testa d6, arredonda +30% e paralisa por duas ações globais, sem aplicar efeito quando erra',()=>{
 for(const roll of [1,2,3,4,5,6]){const s=battle(['stally'],['mike'],{roll:()=>roll});u(s,'mike').hp=u(s,'mike').maxHp=1000;const before=s.turn;attack(s,'stally','mike','stun');assert.equal(s.turn,before+1);assert.equal(u(s,'mike').hp,roll<=3?880:1000);assert.equal(u(s,'mike').paralysis,roll<=3?2:0);if(roll<=3){force(s,'mike');assert(!G.performBasicAttack(s,u(s,'mike').uid,u(s,'stally').uid).ok);assert(G.performStatusTurn(s,u(s,'mike').uid).ok);assert.equal(u(s,'mike').paralysis,1);tick(s);assert.equal(u(s,'mike').paralysis,0);}}
});
test('Endrik só executa o responsável de raridade inferior e exige 1 ou 2 no d6',()=>{
 for(const roll of [1,2,3,6]){const s=battle(['endrik'],['alex'],{roll:()=>roll});u(s,'endrik').hp=50;attack(s,'alex','endrik');assert(u(s,'endrik').eliminated);assert.equal(!!u(s,'alex').eliminated,roll<=2);}
 const s=battle(['endrik'],['p_ullys'],{roll:()=>1});u(s,'endrik').hp=50;attack(s,'p_ullys','endrik');assert(!u(s,'p_ullys').eliminated);
});
test('Striker rejeita atacantes mais rápidos sem consumir ação e permite velocidades iguais ou menores',()=>{
 const s=battle(['alex','mike'],['striker']);u(s,'alex').speed=5;u(s,'mike').speed=4;const a=force(s,'alex'),turn=s.turn;assert(!G.attackTargets(s,a).includes(u(s,'striker')));assert(!G.performBasicAttack(s,a.uid,u(s,'striker').uid).ok);assert.equal(s.turn,turn);assert(G.attackTargets(s,u(s,'mike')).includes(u(s,'striker')));
});
test('Xerife resolve o duelo defensivo sem uma segunda esquiva e pune falha por raridade',()=>{
 for(const roll of [1,2,3,4,5,6]){const s=battle(['stally'],['sheriff'],{roll:()=>roll});attack(s,'stally','sheriff');assert.equal(u(s,'sheriff').hp,roll<=3?360:450);assert.equal(!!u(s,'stally').eliminated,roll>3);}
 const s=battle(['endrik'],['sheriff'],{roll:()=>6});attack(s,'endrik','sheriff');assert.equal(u(s,'endrik').hp,u(s,'endrik').maxHp-200);assert.equal(u(s,'sheriff').hp,450);
});
test('Xerife no ataque executa até sua raridade, causa 200 acima e recebe o dano se perder',()=>{
 let s=battle(['sheriff'],['alex'],{roll:()=>1});attack(s,'sheriff','alex');assert(u(s,'alex').eliminated);
 s=battle(['sheriff'],['endrik'],{roll:()=>1});attack(s,'sheriff','endrik');assert.equal(u(s,'endrik').hp,385);
 s=battle(['sheriff'],['alex'],{roll:()=>4});attack(s,'sheriff','alex');assert.equal(u(s,'sheriff').hp,280);assert.equal(u(s,'alex').hp,200);
});
test('Burn hipnotiza na entrada, troca gratuitamente e aplica 90 no novo alvo; sua morte liberta',()=>{
 const s=battle(['barn'],['mike','alex']);resolve(s,'barn','mike');assert.equal(u(s,'mike').hypnotizedBy,u(s,'barn').uid);force(s,'mike');assert(G.performStatusTurn(s,u(s,'mike').uid).spent);
 force(s,'barn');const turn=s.turn;assert(G.requestOfficialChoice(s,u(s,'barn').uid,'hypnosis').ok);resolve(s,'barn','alex');assert.equal(s.turn,turn);assert.equal(u(s,'mike').hypnotizedBy,null);assert(G.performHypnosisTurn(s,u(s,'barn').uid).ok);assert.equal(u(s,'alex').hp,110);assert.equal(u(s,'mike').hp,130);G.eliminateUnit(s,u(s,'barn'));assert.equal(u(s,'alex').hypnotizedBy,null);
});
test('Fonior coleta aliados e inimigos sem curar e cresce acima da faixa de raridade',()=>{
 const s=battle(['fonior','mike'],['alex','cavaleiro','john']),f=u(s,'fonior');for(const id of ['mike','alex','cavaleiro','john'])G.eliminateUnit(s,u(s,id));assert.equal(f.souls,4);assert.equal(f.maxHp,560);assert.equal(f.hp,480);assert(f.maxHp>G.RARITY_HP.EPIC.max);
});
test('Sam faz 2,6,5,5 resultar em três golpes separados de 100 numa única ação',()=>{
 const rolls=[2,6,5,5],s=battle(['sam'],['mike'],{roll:()=>rolls.shift()});u(s,'mike').hp=u(s,'mike').maxHp=1000;const before=s.turn;attack(s,'sam','mike');assert.equal(u(s,'mike').hp,700);assert.equal(s.lastEvent.hits.length,3);assert.equal(s.lastEvent.rolls.length,4);assert.equal(s.turn,before+1);
});
test('reação durante um soco encerra o combo se Sam morrer antes do próximo',()=>{
 const s=battle(['sam'],['sarck'],{roll:()=>2});u(s,'sam').hp=300;attack(s,'sam','sarck');assert(u(s,'sam').eliminated);assert.equal(u(s,'sarck').hp,430);assert.equal(s.lastEvent.hits.length,1);assert.equal(s.lastEvent.rolls.length,1);
});
test('Chama causa 65 e depois cinco aplicações de 65, começando na próxima ação',()=>{
 const s=battle(['chama'],['mike']);u(s,'mike').hp=u(s,'mike').maxHp=1000;attack(s,'chama','mike');assert.equal(u(s,'mike').hp,935);assert.equal(s.burns[0].remaining,5);for(let i=0;i<5;i++)tick(s);assert.equal(u(s,'mike').hp,610);assert.equal(s.burns.length,0);
});
test('quem mata Chama ainda sofre três queimaduras de 35 depois de sua morte',()=>{
 const s=battle(['chama'],['mike']);u(s,'chama').hp=50;u(s,'mike').hp=u(s,'mike').maxHp=1000;attack(s,'mike','chama');assert(u(s,'chama').eliminated);assert.equal(u(s,'mike').hp,1000);for(let i=0;i<3;i++)tick(s);assert.equal(u(s,'mike').hp,895);assert.equal(s.burns.length,0);
});
test('Zuri cura os outros aliados, incluindo retaguarda, consome ação e não restaura o próprio uso',()=>{
 const s=battle(['zuri','mike'],['alex'],{rear:['elysh']});u(s,'zuri').hp=200;u(s,'mike').hp=35;u(s,'elysh').hp=100;force(s,'zuri');const turn=s.turn;assert(G.performFullHeal(s,u(s,'zuri').uid).ok);assert.equal(u(s,'zuri').hp,200);assert.equal(u(s,'mike').hp,130);assert.equal(u(s,'elysh').hp,240);assert.equal(s.turn,turn+1);force(s,'zuri');assert(!G.performFullHeal(s,u(s,'zuri').uid).ok);
});
test('Draktar recebe caça sorteada e causa triplo nela em ataques repetidos',()=>{
 const s=battle(['draktar'],['cavaleiro','alex']);assert.equal(u(s,'draktar').huntUid,u(s,'alex').uid);u(s,'alex').hp=u(s,'alex').maxHp=4000;attack(s,'draktar','alex');assert.equal(u(s,'alex').hp,3205);attack(s,'draktar','alex');assert.equal(u(s,'alex').hp,2410);assert.equal(G.previewDamage(s,u(s,'draktar'),0,u(s,'cavaleiro')),55);
});
test('Oni mantém Daztirry vivo em zero por três ações, soma 30, bloqueia execução e termina em eliminação',()=>{
 const s=battle(['daztirry'],['mike']);u(s,'daztirry').hp=50;attack(s,'mike','daztirry');const d=u(s,'daztirry');assert(d.oniActive);assert.equal(d.oniRemaining,3);assert.equal(d.damage,450);assert(!G.isCharacterDefeated(d));assert(!G.isDalyExposed(s,'player'));G.dealCharacterDamage(s,u(s,'mike'),d,0,{instant:true});assert(d.oniActive);tick(s);tick(s);assert(!d.eliminated);tick(s);assert(d.eliminated);assert(G.isDalyExposed(s,'player'));
});
test('Mike bloqueia toda a classe Assassino, preservando os outros alvos e classes',()=>{
 const s=battle(['trucc','eletric'],['mike','cavaleiro']);assert(!G.attackTargets(s,u(s,'trucc')).includes(u(s,'mike')));assert(G.attackTargets(s,u(s,'trucc')).includes(u(s,'cavaleiro')));assert(G.attackTargets(s,u(s,'eletric')).includes(u(s,'mike')));
});
test('estrela aumenta Vida atual e máxima e todos os atributos; permanece após Unicorn morrer',()=>{
 const s=battle(['unicorn','mike'],['alex']);u(s,'mike').hp=30;resolve(s,'unicorn','mike');const m=u(s,'mike');assert.deepEqual([m.hp,m.maxHp,m.damage,m.speed],[180,280,220,7]);assert(u(s,'unicorn').entryAbilityUsed);G.eliminateUnit(s,u(s,'unicorn'));assert.deepEqual([m.hp,m.maxHp,m.damage,m.speed],[180,280,220,7]);
 const other=battle(['unicorn'],['alex']);resolve(other,'unicorn','unicorn');assert.deepEqual([u(other,'unicorn').hp,u(other,'unicorn').damage,u(other,'unicorn').speed],[420,85,5]);
});
test('Nully multiplica 55 com 1–5 e com 6 executa até Mítico ou causa 330 acima',()=>{
 for(let roll=1;roll<=6;roll++){const s=battle(['nully'],['alex'],{roll:()=>roll});u(s,'alex').hp=u(s,'alex').maxHp=1000;u(s,'alex').parryThreshold=0;attack(s,'nully','alex');assert.equal(u(s,'alex').hp,roll===6?0:1000-55*roll);}
 const s=battle(['nully'],['endrik'],{roll:()=>6});u(s,'endrik').hp=u(s,'endrik').maxHp=1000;attack(s,'nully','endrik');assert.equal(u(s,'endrik').hp,670);
});
test('pó mágico é gratuito e único; falha perde ação, 1–2 acorda e permite agir na mesma vez',()=>{
 const s=battle(['rayyb'],['alex']);force(s,'rayyb');const before=s.turn;assert(G.requestOfficialChoice(s,u(s,'rayyb').uid,'sleepPowder').ok);resolve(s,'rayyb','alex');assert.equal(s.turn,before);force(s,'alex');assert(G.performStatusTurn(s,u(s,'alex').uid).spent);assert(u(s,'alex').sleep);G.buildTurnOrder(s);force(s,'alex');s.roll=()=>1;const r=G.performStatusTurn(s,u(s,'alex').uid);assert(r.awake&&!r.spent);assert(!u(s,'alex').sleep);assert(G.performBasicAttack(s,u(s,'alex').uid,u(s,'rayyb').uid).ok);force(s,'rayyb');assert(!G.requestOfficialChoice(s,u(s,'rayyb').uid,'sleepPowder').ok);
});
test('petrificação só aceita raridade até a própria e executa na mesma vez sem gastar tentativa',()=>{
 const s=battle(['rayvilin'],['mike','draktar'],{roll:()=>1});assert(!G.abilityTargets(s,u(s,'rayvilin'),'petrify').includes(u(s,'draktar')));resolve(s,'rayvilin','mike');force(s,'rayvilin');attack(s,'rayvilin','mike');assert(u(s,'mike').eliminated);
 const t=battle(['rayvilin'],['alex']);resolve(t,'rayvilin','alex');assert.equal(u(t,'rayvilin').petrifyPrecision,2);force(t,'rayvilin');t.roll=()=>1;const before=t.turn;assert(G.requestOfficialChoice(t,u(t,'rayvilin').uid,'petrify').ok);resolve(t,'rayvilin','alex');assert.equal(t.turn,before);assert(G.performBasicAttack(t,u(t,'rayvilin').uid,u(t,'alex').uid).ok);assert(u(t,'alex').eliminated);
});
test('cada falha permanente reduz petrificação até esgotar, sem repetir tentativa na mesma vez',()=>{
 const s=battle(['rayvilin'],['alex']);resolve(s,'rayvilin','alex');assert.equal(u(s,'rayvilin').petrifyPrecision,2);force(s,'rayvilin');assert(G.requestOfficialChoice(s,u(s,'rayvilin').uid,'petrify').ok);resolve(s,'rayvilin','alex');assert.equal(u(s,'rayvilin').petrifyPrecision,1);assert(!G.requestOfficialChoice(s,u(s,'rayvilin').uid,'petrify').ok);G.buildTurnOrder(s);force(s,'rayvilin');assert(G.requestOfficialChoice(s,u(s,'rayvilin').uid,'petrify').ok);resolve(s,'rayvilin','alex');assert.equal(u(s,'rayvilin').petrifyPrecision,0);G.buildTurnOrder(s);force(s,'rayvilin');assert(!G.requestOfficialChoice(s,u(s,'rayvilin').uid,'petrify').ok);
});
test('aliado quebra petrificação com somente 30, usando uma ação',()=>{
 const s=battle(['alex','cavaleiro'],['rayvilin'],{roll:()=>1});resolve(s,'rayvilin','alex');u(s,'alex').hp=100;force(s,'cavaleiro');const before=s.turn;assert(G.performBreakCurse(s,u(s,'cavaleiro').uid,u(s,'alex').uid).ok);assert.equal(u(s,'alex').hp,70);assert.equal(u(s,'alex').petrifiedBy,null);assert.equal(s.turn,before+1);
});
test('Z-Zus transfere dano e execução instantânea, inclusive de atacante de raridade menor que a dele',()=>{
 let s=battle(['z_zus','alex'],['john']);resolve(s,'z_zus','alex');attack(s,'john','alex');assert.equal(u(s,'alex').hp,200);assert.equal(u(s,'z_zus').hp,965);
 s=battle(['z_zus','alex'],['nully'],{roll:()=>6});resolve(s,'z_zus','alex');attack(s,'nully','alex');assert(u(s,'z_zus').eliminated);assert.equal(u(s,'alex').hp,200);assert.equal(u(s,'alex').guardianUid,null);
});
test('Z-Zus não transfere área e sua morte encerra a proteção sem repetir dano excedente',()=>{
 let s=battle(['z_zus','mike'],['alex']);resolve(s,'z_zus','mike');attack(s,'alex','mike','area');assert.equal(u(s,'z_zus').hp,960);assert.equal(u(s,'mike').hp,45);
 s=battle(['z_zus','alex'],['john']);resolve(s,'z_zus','alex');u(s,'z_zus').hp=35;attack(s,'john','alex');assert.equal(u(s,'alex').hp,200);attack(s,'john','alex');assert.equal(u(s,'alex').hp,120);
});
test('Swarm divide 170 entre inimigos da frente e arredonda, ou concentra 170 em um alvo',()=>{
 const s=battle(['alex'],['sam','ddx','elysh'],{enemyRear:['unicorn']});choices(s);for(const t of s.units.filter(t=>t.team==='enemy')){t.hp=t.maxHp=1000;t.armorReduction=0;}
 attack(s,'alex','sam','area');assert.deepEqual(['sam','ddx','elysh'].map(id=>u(s,id).hp),[940,940,940]);assert.equal(u(s,'unicorn').hp,1000);attack(s,'alex','sam');assert.equal(u(s,'sam').hp,770);
});
test('Karma revida por uma esquiva do amigo e também por seu golpe fatal',()=>{
 let s=battle(['karma','trucc'],['alex'],{roll:()=>6});resolve(s,'karma','trucc');u(s,'alex').hp=u(s,'alex').maxHp=1000;attack(s,'alex','trucc');assert.equal(u(s,'trucc').hp,340);assert.equal(u(s,'alex').hp,770);
 s=battle(['karma','mike'],['alex']);resolve(s,'karma','mike');u(s,'mike').hp=100;u(s,'alex').hp=u(s,'alex').maxHp=1000;attack(s,'alex','mike');assert(u(s,'mike').eliminated);assert.equal(u(s,'alex').hp,770);
});
test('o revide de Karma permite a esquiva especial de Trucc, sem gerar cadeia infinita',()=>{
 const s=battle(['karma','cavaleiro'],['trucc']);resolve(s,'karma','cavaleiro');attack(s,'trucc','cavaleiro');assert.equal(u(s,'trucc').hp,340);assert.equal(s.lastEvent.reactions.length,1);assert.equal(s.lastEvent.reactions[0].type,'dodge');
});
test('Trucc perde 1 de velocidade e amplia a faixa por acerto; erros não alteram e Magos ignoram teste',()=>{
 const s=battle(['trucc'],['alex']);u(s,'trucc').hp=u(s,'trucc').maxHp=3000;attack(s,'alex','trucc');assert.equal(u(s,'trucc').speed,8);assert.equal(u(s,'trucc').hitWindow,1);
 for(let n=1;n<=5;n++){s.roll=()=>n;attack(s,'alex','trucc');assert.equal(u(s,'trucc').hitWindow,n+1);assert.equal(u(s,'trucc').speed,8-n);}s.roll=()=>6;attack(s,'alex','trucc');assert.equal(u(s,'trucc').hp,1980);
 const m=battle(['trucc'],['eletric'],{roll:()=>6});attack(m,'eletric','trucc');assert.equal(u(m,'trucc').hp,210);assert.equal(u(m,'trucc').speed,7);assert.equal(u(m,'trucc').hitWindow,2);
});
test('reiniciar apaga estrelas, almas, maldições, proteção, precisão e usos únicos',()=>{
 const s=battle(['unicorn','fonior'],['alex']);resolve(s,'unicorn','fonior');G.eliminateUnit(s,u(s,'alex'));assert(u(s,'fonior').souls);const fresh=G.resetBattle(s);assert.equal(u(fresh,'fonior').souls,0);assert.equal(u(fresh,'fonior').maxHp,480);assert(!u(fresh,'unicorn').entryAbilityUsed);assert.equal(fresh.burns.length,0);
});

test('Burn sem alvo de hipnose ainda pode atacar a Daly Mãe após a morte do último adversário',()=>{
 const s=battle(['barn'],['alex']);resolve(s,'barn','alex');G.eliminateUnit(s,u(s,'alex'));assert.equal(u(s,'barn').hypnosisTarget,null);force(s,'barn');assert(G.performBasicAttack(s,u(s,'barn').uid,'daly_enemy').ok);assert.equal(s.daly.enemy.hp,2);
});
test('combo de Sam conta como uma ação para queimaduras e não como uma ação por soco',()=>{
 const s=battle(['chama','sam'],['mike']);u(s,'mike').hp=u(s,'mike').maxHp=2000;attack(s,'chama','mike');const rolls=[2,6,5,5];s.roll=()=>rolls.shift();const turn=s.turn;attack(s,'sam','mike');assert.equal(s.turn,turn+1);assert.equal(u(s,'mike').hp,1570);assert.equal(s.burns[0].remaining,4);
});
test('estrela de recuperação não faz Unicorn saltar para uma velocidade que já passou',()=>{
 const s=battle(['cavaleiro'],['sam']);G.eliminateUnit(s,u(s,'cavaleiro'));s.piles.RARE=[{id:'john',iid:'recover-john'},{id:'unicorn',iid:'recover-unicorn'}];force(s,'sam');assert(G.performBasicAttack(s,u(s,'sam').uid,'daly_player').ok);assert(s.recovery);const round=s.round,deck=s.deck.pile.length;assert(G.performRecovery(s,'B').ok);resolve(s,'unicorn','unicorn');assert.equal(s.round,round);assert.equal(s.speedCursor,3);assert.equal(s.deck.pile.length,deck);assert.equal(u(s,'unicorn').speed,5);assert(!s.order.includes(u(s,'unicorn').uid));assert(s.order.includes(u(s,'john').uid));
});
test('bloqueios sem ataque possível permitem empate após esgotar recursos, sem repetir ciclos infinitos',()=>{
 const s=battle(['penxy'],['mike']);resolve(s,'penxy','mike');u(s,'penxy').speed=11;assert(!G.hasMeaningfulAction(s,u(s,'penxy')));assert(!G.hasMeaningfulAction(s,u(s,'mike')));s.deck.pile=[];s.deck.hands.player=[];s.deck.hands.enemy=[];assert.equal(G.getNextActor(s),null);assert.equal(s.result,'draw');
});

test('petrificação e sono impedem movimentar ou trocar Suportes, sem consumir a ação',()=>{
 const s=battle(['rayvilin'],['zuri'],{enemyRear:['elysh'],roll:()=>1});resolve(s,'rayvilin','elysh');force(s,'zuri');const before=s.turn;
 assert(!G.performTransit(s,u(s,'elysh').uid).ok);assert(!G.performSwap(s,u(s,'zuri').uid,u(s,'elysh').uid).ok);assert.equal(u(s,'elysh').row,'rear');assert.equal(s.turn,before);
 u(s,'elysh').petrifiedBy=null;u(s,'zuri').sleep=true;assert(!G.performTransit(s,u(s,'elysh').uid).ok);assert(!G.performSwap(s,u(s,'zuri').uid,u(s,'elysh').uid).ok);assert.equal(s.turn,before);
});

console.log(`${passed} testes das 21 habilidades oficiais passaram`);
