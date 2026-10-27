const assert=require('node:assert/strict');
['data/characters','data/gods','data/support_cards','data/reset_cards','core/battle','core/character_abilities','core/deck','core/support','core/roster','core/official_abilities','core/support_effects','core/divine','core/selection','core/ai','ui/card','ui/arena_ui'].forEach(f=>require('../js/'+f+'.js'));
require('./fixtures/v0_25_catalog.js'); // Regressão das regras e atributos da v0.25.0.
const G=GOGHOS;let passed=0;const test=(name,run)=>{run();passed++;console.log('OK  '+name);};
// Conferência visual dos símbolos INFERIORES nas 30 bases recebidas, conforme a legenda do criador.
// Os pequenos símbolos próximos ao nome nas cartas antigas não substituem essa identificação.
const reviewed={
 ASSASSIN:['sarck','penxy','zikssy','sheriff','draktar','nully','karma','trucc'],
 FIGHTER:['john','ddx','stally','barn','sam','daztirry','alex','vaglar'],
 TANK:['z_zus','cavaleiro'],SUPPORT:['elysh','fonior','zuri','unicorn','rayyb','rayvilin'],
 MAGO:['eletric'],DESTROYER:['p_ullys','endrik','striker','chama','mike']
};
const unit=(s,id)=>s.units.find(u=>u.id===id);
const battle=(p,e)=>G.createBattleState({front:p,rear:[]},{front:e,rear:[]},[],{rng:()=>.5,roll:()=>6});
function choices(s){let n=0;while(s.abilityChoices.length){assert(n++<40);const r=G.AI.resolveCharacterAbility(s);assert(r.ok,r.error);}}
function force(s,id){choices(s);const a=unit(s,id);s.order=[a.uid,...s.order.filter(x=>x!==a.uid)];s.acted=Object.fromEntries(s.order.map(x=>[x,x!==a.uid]));s.speedCursor=a.speed;return a;}
function attack(s,id,target,mana=0){const a=force(s,id),r=G.performBasicAttack(s,a.uid,unit(s,target).uid,mana);assert(r.ok,r.error);return r;}
function give(s,id){const i=s.deck.pile.findIndex(c=>c.id===id);assert(i>=0);const card=s.deck.pile.splice(i,1)[0];s.deck.hands.player.push(card);return card;}

test('as 30 classes correspondem aos símbolos inferiores; MAX continua reunindo as seis',()=>{
 assert.equal(Object.values(reviewed).flat().length,30);assert.equal(new Set(Object.values(reviewed).flat()).size,30);
 for(const [cls,ids] of Object.entries(reviewed))for(const id of ids)assert.equal(G.getCharacterById(id).class,cls,id);
 const god=G.getCharacterById('zenneriam');assert.equal(god.class,'DEUS');assert.equal(god.rarity,null);for(const cls of Object.keys(reviewed))assert(G.hasClass(god,cls));
 assert.equal(G.CLASS_SIGIL.MAGO,'☾');assert.equal(G.CLASS_SIGIL.TANK,'ϟ');
});

test('Z-Zus é Tank sem rebalancear seus números, e não ocupa nem transita pela retaguarda',()=>{
 const c=G.getCharacterById('z_zus');assert.deepEqual([c.maxHp,c.damage,c.speed,c.stamina,c.rarity],[1040,150,1,10,'LEGENDARY']);assert(!G.canTransit(c));
 assert(!G.validateTeam({front:['mike'],rear:['z_zus']}).ok);
 const s=battle(['mike','ddx','alex'],['john']);assert.equal(G.addCharacterToTeam(s,'player',{id:c.id,iid:'tank'}),null);
 const t=battle(['z_zus','mike'],['john']);force(t,'mike');assert(!G.performTransit(t,unit(t,'z_zus').uid).ok);
});

test('resistência de Z-Zus vale para ataque direto, área e revide, com arredondamento',()=>{
 for(const options of [{},{area:true},{kind:'reaction'}]){const s=battle(['john'],['z_zus']),a=unit(s,'john'),t=unit(s,'z_zus');choices(s);const hit=G.applyCharacterHit(s,a,t,100,options);assert.equal(hit.damage,90);assert.equal(hit.armor.blocked,10);assert.equal(t.hp,950);}
 const s=battle(['john'],['z_zus']);assert.equal(G.damageInfo(unit(s,'z_zus'),65).damage,60);
});

test('proteção recebe a mitigação do próprio Tank, e área continua no aliado original',()=>{
 const s=battle(['z_zus','mike'],['john']);assert(G.resolveCharacterAbility(s,unit(s,'z_zus').uid,unit(s,'mike').uid).ok);
 const a=unit(s,'john'),tank=unit(s,'z_zus'),friend=unit(s,'mike');let hit=G.applyCharacterHit(s,a,friend,100);assert.equal(hit.targetUid,tank.uid);assert.equal(hit.damage,90);assert.equal(friend.hp,130);
 hit=G.applyCharacterHit(s,a,friend,100,{area:true});assert.equal(hit.targetUid,friend.uid);assert.equal(hit.damage,100);assert.equal(friend.hp,30);
});

test('silêncio, imobilização e ressurreição não removem a resistência natural de Tank',()=>{
 const s=battle(['mike'],['z_zus']),tank=unit(s,'z_zus');choices(s);
 for(const state of ['silenceRemaining','paralysis','sleep','revivedNoAbility']){tank[state]=state==='sleep'||state==='revivedNoAbility'?true:2;assert.equal(G.damageInfo(tank,100).damage,90,state);tank[state]=0;}
 tank.hp=50;const hit=G.dealCharacterDamage(s,unit(s,'mike'),tank,0,{instant:true});assert(hit.instant);assert.equal(tank.hp,0);
});

test('livro, queimadura e machado não recebem a resistência de ataque do Tank',()=>{
 const s=battle(['vaglar'],['z_zus']);choices(s);const tank=unit(s,'z_zus');for(const kind of ['book','burn-damage','pin-damage','support'])assert.equal(G.damageInfo(tank,100,{kind}).damage,100,kind);
 attack(s,'vaglar','z_zus');assert.equal(tank.hp,840);
});

test('hipnose é efeito fixo de 90, não ataque mitigado, tanto na previsão quanto na ação',()=>{
 const s=battle(['barn'],['z_zus']);choices(s);const a=unit(s,'barn'),t=unit(s,'z_zus');assert.equal(a.hypnosisTarget,t.uid);assert.equal(G.previewDamage(s,a,0,t),90);
 attack(s,'barn','z_zus');assert.equal(t.hp,950);assert.equal(s.lastEvent.amount,90);assert.equal(s.lastEvent.kind,'hypnosis');
});

test('somente Mago e MAX iniciam com três de mana; demais classes começam sem mana',()=>{
 for(const c of [...G.CHARACTERS,...G.GODS])assert.equal(G.manaFor(c),c.id==='eletric'||c.id==='zenneriam'?3:0,c.name);
});

test('Mago gasta uma vez por área e recupera +1 por ação global, mesmo impedido e até o máximo',()=>{
 const s=battle(['eletric'],['z_zus']);choices(s);const mage=unit(s,'eletric');attack(s,'eletric','z_zus',3);assert.equal(mage.mana,1);assert.equal(unit(s,'z_zus').hp,895);
 mage.sleep=true;attack(s,'z_zus','eletric');assert.equal(mage.mana,2);G.regenerateMageMana(s);G.regenerateMageMana(s);assert.equal(mage.mana,3);
 const other=battle(['eletric'],['john']);force(other,'eletric');unit(other,'eletric').mana=0;const card=give(other,'sortudo'),turn=other.turn;assert(G.performHandSupport(other,card.iid).ok);assert.equal(other.turn,turn);assert.equal(unit(other,'eletric').mana,0);
});

test('Assassinos comuns usam diferença de velocidade e Magos ignoram sua esquiva',()=>{
 for(const id of ['penxy','zikssy','draktar','nully','karma'])for(const roll of [1,2,6]){
  const s=battle(['john','eletric'],[id]);choices(s);const a=unit(s,'john'),t=unit(s,id);a.speed=3;t.speed=5;s.roll=()=>roll;assert.equal(G.dodgeInfo(a,t).diff,2);const hit=G.applyCharacterHit(s,a,t,50);assert.equal(hit.type,roll<=2?'dodge':'hit',id+' / '+roll);assert.equal(hit.damage,roll<=2?0:50);
  const mage=unit(s,'eletric');assert.equal(G.dodgeInfo(mage,t),null);assert.equal(G.applyCharacterHit(s,mage,t,50).type,'hit');
 }
 const s=battle(['john'],['sarck']);assert.equal(G.dodgeInfo(unit(s,'john'),unit(s,'sarck')),null);
});

test('previsão e defesa de Assassino concordam durante seis impedimentos, inclusive Trucc',()=>{
 for(const id of ['karma','trucc'])for(const [key,value] of [['sleep',true],['paralysis',2],['petrifiedBy','source'],['hypnotizedBy','source'],['pinnedBy','source'],['pinning','source']]){
  const s=battle(['john'],[id]);choices(s);const a=unit(s,'john'),t=unit(s,id);t[key]=value;s.roll=()=>1;assert.equal(G.dodgeInfo(a,t),null,id+' / '+key);assert.equal(G.applyCharacterHit(s,a,t,50).type,'hit');
 }
});

test('duelo do Xerife substitui esquiva comum; Trucc mantém o teste próprio e a exceção de Mago',()=>{
 let s=battle(['john'],['sheriff']);s.roll=()=>1;assert.equal(G.dodgeInfo(unit(s,'john'),unit(s,'sheriff')),null);assert.equal(G.applyCharacterHit(s,unit(s,'john'),unit(s,'sheriff'),50).type,'hit');
 s=battle(['john','eletric'],['trucc']);const a=unit(s,'john'),t=unit(s,'trucc');s.roll=()=>2;assert(G.dodgeInfo(a,t).special);assert.equal(G.applyCharacterHit(s,a,t,50).type,'dodge');s.roll=()=>1;assert.equal(G.applyCharacterHit(s,a,t,50).type,'hit');assert.equal(t.hitWindow,2);assert.equal(t.speed,7);const mage=unit(s,'eletric');assert.equal(G.dodgeInfo(mage,t),null);assert.equal(G.applyCharacterHit(s,mage,t,50).type,'hit');
});

test('John mantém Parry 1–2 e os Fighters ainda não revisados aguardam as novas cartas',()=>{
 for(const roll of [1,2,3,4,5,6]){const s=battle(['eletric'],['john']);s.roll=()=>roll;const t=unit(s,'john'),hit=G.applyCharacterHit(s,unit(s,'eletric'),t,50);assert.equal(hit.type,roll<=2?'parry':'hit');assert.equal(hit.damage,roll<=2?0:50);}
 for(const id of reviewed.FIGHTER.filter(id=>!['john','alex','stally'].includes(id))){const s=battle(['eletric'],[id]);choices(s);assert.equal(unit(s,id).parryThreshold,0,id);assert.equal(G.parryInfo(unit(s,'eletric'),unit(s,id)),null);}
 const s=battle(['eletric'],['john']),t=unit(s,'john');t.silenceRemaining=4;assert.equal(G.parryInfo(unit(s,'eletric'),t).threshold,2);t.pinning='target';assert.equal(G.parryInfo(unit(s,'eletric'),t),null);
});

test('todos os cinco Destroyers testam crítico de 25% em 1–2, em ataques reais',()=>{
 for(const id of reviewed.DESTROYER)for(const roll of [1,2,3,4,5,6]){
  const s=battle([id],['z_zus']),a=unit(s,id),tank=unit(s,'z_zus');tank.hp=tank.maxHp=3000;s.roll=()=>roll;attack(s,id,'z_zus');const critical=s.lastEvent.critical;assert.equal(critical.critical,roll<=2,id+' / '+roll);assert.equal(critical.roll,roll);
  const expected=G.roundUpToFive(G.roundUpToFive(a.damage*(roll<=2?1.25:1))*.9);assert.equal(s.lastEvent.hits?.[0]?.damage??s.lastEvent.damage,expected,id+' / '+roll);
 }
});

test('crítico de Chama só multiplica o golpe inicial; a queimadura mantém os 65 fixos',()=>{
 const s=battle(['chama'],['z_zus']);s.roll=()=>1;attack(s,'chama','z_zus');assert.equal(s.lastEvent.critical.damage,85);assert.equal(unit(s,'z_zus').hp,960);assert.equal(s.burns[0].damage,65);assert.equal(s.burns[0].remaining,5);
 attack(s,'z_zus','chama');assert.equal(s.lastEvent.ticks.find(t=>t.targetUid===unit(s,'z_zus').uid).damage,65);assert.equal(unit(s,'z_zus').hp,895);
});

test('os seis Supports transitam sem ação extra e preservam um defensor na frente',()=>{
 for(const id of reviewed.SUPPORT){const s=battle([id,'mike'],['john']),support=unit(s,id);force(s,'mike');const before={turn:s.turn,round:s.round,order:[...s.order],acted:{...s.acted}};assert(G.performTransit(s,support.uid).ok,id);assert.equal(support.row,'rear');assert(G.performTransit(s,support.uid).ok);assert.equal(support.row,'front');assert.deepEqual({turn:s.turn,round:s.round,order:s.order,acted:s.acted},before);G.eliminateUnit(s,unit(s,'mike'));force(s,id);assert(!G.performTransit(s,support.uid).ok);}
 for(const c of G.CHARACTERS.filter(c=>c.class!=='SUPPORT'))assert(!G.canTransit(c),c.name);
});

console.log(`${passed} testes da auditoria de classes e tributos passaram`);
