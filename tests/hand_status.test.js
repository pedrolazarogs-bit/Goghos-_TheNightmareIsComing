const assert=require('node:assert/strict');
['data/characters','data/gods','data/support_cards','data/reset_cards','core/battle','core/character_abilities','core/deck','core/support','core/roster','core/official_abilities','core/support_effects','core/divine','core/selection','core/ai','ui/card'].forEach(f=>require('../js/'+f+'.js'));
const G=GOGHOS;let passed=0;const test=(name,f)=>{f();passed++;console.log('OK  '+name);};
const battle=(p=['elysh','mike'],e=['john'])=>G.createBattleState({front:p,rear:[]},{front:e,rear:[]},[],{rng:()=>.5,roll:()=>6});
const u=(s,id)=>s.units.find(c=>c.id===id);
function force(s,id){const a=u(s,id);s.order=[a.uid,...s.order.filter(x=>x!==a.uid)];s.acted=Object.fromEntries(s.order.map(x=>[x,x!==a.uid]));s.speedCursor=a.speed;assert.equal(G.getNextActor(s)?.uid,a.uid);return a;}
function hand(s,id,side='player'){const i=s.deck.pile.findIndex(c=>c.id===id);assert(i>=0);const c=s.deck.pile.splice(i,1)[0];s.deck.hands[side].push(c);return c;}
const clock=s=>JSON.stringify({turn:s.turn,round:s.round,acted:s.acted,order:s.order,speed:s.speedCursor});
const states=[['paralysis',2],['sleep',true],['petrifiedBy','source'],['hypnotizedBy','source'],['pinnedBy','source'],['pinning','source']];

test('Bandeide funciona em todos os impedimentos sem gastar ação, curar o estado ou permitir ataque',()=>{
 for(const [key,value] of states){const s=battle(),a=force(s,'elysh');a[key]=value;a.hp=300;const c=hand(s,'bandeide'),before=clock(s);assert(!G.canManageTeam(s,'player'));assert(G.canUseHand(s,'player'));assert(G.performHandSupport(s,c.iid,a.uid).ok);assert.equal(a.hp,380);assert.equal(a[key],value);assert.equal(clock(s),before);assert(!G.performBasicAttack(s,a.uid,u(s,'john').uid).ok);assert(!s.deck.hands.player.includes(c));assert(s.deck.discard.some(d=>d.iid===c.iid));}
});
test('Apoio pode curar outro aliado durante sono e continua limitado a um por turno',()=>{
 const s=battle(),a=force(s,'elysh');a.sleep=true;u(s,'mike').hp=30;const heal=hand(s,'bandeide'),bonus=hand(s,'na_moloeira');assert(G.performHandSupport(s,heal.iid,u(s,'mike').uid).ok);assert.equal(u(s,'mike').hp,110);assert(!G.performHandSupport(s,bonus.iid).ok);assert(s.deck.hands.player.includes(bonus));assert(a.sleep);
});
test('Na Moloeira e Brisa podem ser ativadas durante impedimentos sem avançar os efeitos periódicos',()=>{
 for(const id of ['na_moloeira','brisa']){const s=battle(),a=force(s,'elysh');a.paralysis=2;const c=hand(s,id),before=clock(s);assert(G.performHandSupport(s,c.iid).ok);assert.equal(clock(s),before);assert.equal(a.paralysis,2);assert.equal(id==='brisa'?s.support.brisa:s.support.nextAttackBonus,id==='brisa'?30:20);}
});
test('medalhas resgatam personagens enquanto a unidade da vez está impedida, sem ataque extra',()=>{
 for(const [key,value] of states){const s=battle(),a=force(s,'elysh');a[key]=value;const c=hand(s,G.MEDAL_ID.COMMON),pile=s.piles.COMMON;const chosen=pile.splice(pile.findIndex(c=>c.id==='cavaleiro'),1)[0];pile.push(chosen);const before=clock(s),r=G.resolveDalle(s,'player',c);assert(r.ok,r.error);assert.equal(clock(s),before);assert.equal(a[key],value);assert.equal(s.units.filter(c=>c.team==='player').length,3);assert.equal(u(s,'cavaleiro').enteredRound,s.round);assert(!s.order.includes(u(s,'cavaleiro').uid));assert(!s.deck.hands.player.includes(c));}
});
test('mão permanece bloqueada na vez adversária e durante escolhas pendentes ou fim da partida',()=>{
 for(const kind of ['enemy','recovery','formation','pending','pendingChoice','abilityChoices','result']){const s=battle(),a=force(s,'elysh');a.sleep=true;a.hp=300;const c=hand(s,'bandeide');if(kind==='enemy')force(s,'john');else if(kind==='pending')s.support.pending={candidates:[a.uid],value:30};else if(kind==='pendingChoice')s.deck.pendingChoice={incoming:{iid:'temp',id:'bandeide'}};else if(kind==='abilityChoices')s.abilityChoices=[{actorUid:a.uid,type:'healingAttack',side:'player'}];else s[kind]=kind==='result'?'draw':{side:'player',candidates:[a.uid]};assert(!G.canUseHand(s,'player'),kind);assert(!G.performHandSupport(s,c.iid,a.uid).ok,kind);assert.equal(a.hp,300);assert(s.deck.hands.player.includes(c));}
});
test('IA resgata medalha antes de passar a vez por sono',()=>{
 const s=battle(['mike'],['john']),a=force(s,'john');a.sleep=true;const c=hand(s,G.MEDAL_ID.COMMON,'enemy'),before=s.turn;const r=G.AI.takeTurn(s,a);assert(r.ok,r.error);assert.equal(s.turn,before+1);assert(a.sleep);assert.equal(s.lastEvent.type,'status-skip');assert.equal(s.units.filter(c=>c.team==='enemy').length,2);assert(!s.deck.hands.enemy.includes(c));
});
test('cura da mão não remove o machado real nem dispara os 20 periódicos antes de passar',()=>{
 const s=battle(),j=force(s,'john'),a=u(s,'elysh');assert(G.performBasicAttack(s,j.uid,a.uid,0,'pin').ok);force(s,'elysh');const c=hand(s,'bandeide'),before=clock(s);assert.equal(a.hp,400);assert(G.performHandSupport(s,c.iid,a.uid).ok);assert.equal(a.hp,480);assert.equal(a.pinnedBy,j.uid);assert.equal(j.pinning,a.uid);assert.equal(clock(s),before);assert(G.performPinnedTurn(s,a.uid).ok);assert.equal(a.hp,460);
});
test('Mago começa com três e recupera um por ataque ou passagem impedida, nunca por uso gratuito da mão',()=>{
 const s=battle(['eletric','mike'],['ddx']),m=u(s,'eletric');assert.equal(m.mana,3);m.mana=1;force(s,'ddx');assert(G.performBasicAttack(s,u(s,'ddx').uid,u(s,'mike').uid).ok);assert.equal(m.mana,2);const a=force(s,'mike');a.sleep=true;assert(G.performStatusTurn(s,a.uid).ok);assert.equal(m.mana,3);force(s,'eletric');m.sleep=true;m.mana=1;const c=hand(s,'na_moloeira');assert(G.performHandSupport(s,c.iid).ok);assert.equal(m.mana,1);
});
test('balanceamento mantém seis raridades, Vida nas faixas e exceções numéricas justificadas pelas habilidades',()=>{
 assert.deepEqual(G.RARITIES,['COMMON','RARE','EPIC','MYTHIC','LEGENDARY','SECRET']);assert.equal(Object.keys(G.CHARACTER_BALANCE).length,30);const low=[];
 for(const c of G.CHARACTERS){const hp=G.RARITY_HP[c.rarity],d=G.RARITY_DAMAGE[c.rarity];assert(c.reason);assert.equal(c.maxHp%5,0);assert.equal(c.damage%5,0);assert(c.maxHp>=hp.min&&c.maxHp<=hp.max||c.id==='sarck'&&c.maxHp===530);assert(c.damage<=d.max);if(c.damage<d.min)low.push(c.id);}
 assert.deepEqual(low.sort(),['barn','chama','nully','sam','sarck','sheriff','vaglar']);assert.equal(G.getCharacterById('alex').damage,120);assert.equal(G.getCharacterById('sam').damage,100);assert.equal(G.getCharacterById('barn').damage,90);
});
test('Burn que acorda resolve uma nova hipnose antes de agir, sem perder a própria vez',()=>{
 const s=battle(['barn'],['mike','rayyb']),a=u(s,'barn');assert(G.resolveCharacterAbility(s,a.uid,u(s,'mike').uid).ok);G.eliminateUnit(s,u(s,'mike'));a.sleep=true;s.roll=()=>1;force(s,'barn');const before=s.turn,r=G.AI.takeTurn(s,a);assert(r.ok&&r.pending);assert(!a.sleep);assert.equal(s.turn,before);assert.equal(s.abilityChoices[0].type,'hypnosis');assert(G.AI.resolveCharacterAbility(s).ok);assert(G.AI.takeTurn(s,a).ok);assert.equal(s.turn,before+1);assert.equal(u(s,'rayyb').hp,785);
});
console.log(`${passed} testes de mão, mana e balanceamento passaram`);
