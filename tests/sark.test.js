const assert=require('node:assert/strict');
const fs=require('node:fs');
['data/characters','data/support_cards','data/reset_cards','core/battle','core/deck','core/support','core/roster','core/selection','core/ai','ui/card','ui/match_ui','ui/arena_ui'].forEach(f=>require('../js/'+f+'.js'));
const G=globalThis.GOGHOS;
let passed=0;
const test=(name,run)=>{run();passed++;console.log('OK  '+name);};
function battle(id='char_06',side='enemy'){
  const sark={front:['sarck'],rear:[]},attackers={front:[id],rear:[]};
  const s=G.createBattleState(side==='player'?sark:attackers,side==='player'?attackers:sark,[],{rng:()=>.5,roll:()=>1});
  return{s,sark:s.units.find(u=>u.id==='sarck'),attacker:s.units.find(u=>u.id===id)};
}

test('Sark é Lendário Assassino, tem 530 de Vida, 5 de fôlego e só habilidade reativa',()=>{
  const c=G.getCharacterById('sarck');
  assert.equal(c.name,'Sark');assert.equal(c.class,'ASSASSIN');assert.equal(c.rarity,'LEGENDARY');
  assert.equal(c.maxHp,530);assert.equal(c.stamina,5);assert.equal(c.damage,0);assert.equal(c.speed,null);
  assert(c.passiveOnly);assert.equal(G.getMainAbility(c).damage,390);
  const {s,sark,attacker}=battle();
  assert(!G.canAct(sark));assert(G.isTargetable(sark));assert(!s.order.includes(sark.uid));
  assert.equal(G.getNextActor(s).uid,attacker.uid);assert(!G.performBasicAttack(s,sark.uid,attacker.uid).ok);
  assert(!G.isDalyExposed(s,'enemy'));assert.equal(G.dodgeInfo(attacker,sark),null);
});

test('Comum, Raro e Épico causam dano mas são eliminados instantaneamente nas duas equipes',()=>{
  for(const side of ['player','enemy'])for(const id of ['char_06','eletric','char_09']){
    const {s,sark,attacker}=battle(id,side),hp=sark.hp,turn=s.turn,round=s.round;
    attacker.hp=9999;attacker.maxHp=9999;const result=G.performBasicAttack(s,attacker.uid,sark.uid);
    assert(result.ok);assert.equal(sark.hp,hp-attacker.damage);assert.equal(attacker.hp,0);
    assert(attacker.eliminated);assert.equal(attacker.row,null);assert.equal(s.eliminated.length,1);
    assert(result.reaction.instant);assert.equal(result.reaction.damage,9999);
    assert.equal(s.lastEvent.reaction.targetUid,attacker.uid);assert(!s.order.includes(attacker.uid));
    assert.equal(s.turn,turn+1);assert.equal(s.round,round);assert(s.acted[attacker.uid]);
    assert(!G.RARITIES.flatMap(r=>s.piles[r]).some(c=>c.iid===attacker.iid));
    assert(!G.performBasicAttack(s,attacker.uid,sark.uid).ok,'morto pela reação não pode repetir');
  }
});

test('Lendário e Secreto recebem exatamente 390, sem esquiva da reação',()=>{
  for(const rarity of ['LEGENDARY','SECRET']){
    const {s,sark,attacker}=battle('sam');attacker.rarity=rarity;attacker.class='ASSASSIN';attacker.speed=9;
    const hp=attacker.hp;
    const result=G.performBasicAttack(s,attacker.uid,sark.uid);
    assert(result.ok);assert.equal(attacker.hp,hp-390);assert.equal(result.reaction.amount,390);
    assert(!result.reaction.instant);assert(!attacker.eliminated);
    assert.equal(sark.hp,530-attacker.damage);assert.equal(s.turn,2);
  }
});

test('reação de 390 elimina quando a Vida acaba e continua em golpes fatais contra Sark',()=>{
  for(const id of ['char_06','sam']){
    const {s,sark,attacker}=battle(id);sark.hp=1;attacker.hp=200;
    const result=G.performBasicAttack(s,attacker.uid,sark.uid);
    assert(result.ok);assert(sark.eliminated);assert(attacker.eliminated);
    assert.equal(s.eliminated.length,2);assert.equal(new Set(s.eliminated.map(u=>u.uid)).size,2);
    assert.equal(s.lastEvent.type,'defeat');assert.equal(s.lastEvent.reaction.type,'defeat');
    assert(G.isDalyExposed(s,'player'));assert(G.isDalyExposed(s,'enemy'));
    assert.equal(s.daly.player.hp,3);assert.equal(s.daly.enemy.hp,3,'reação nunca transfere excedente à Daly');
    assert(!s.result);assert(!s.recovery);
    assert.equal(G.getNextActor(s),null);assert(G.isIdleBattle(s));
  }
});

test('ataque em outro personagem não ativa Steel Jaw e tentativas inválidas não geram reação',()=>{
  const s=G.createBattleState({front:['char_02'],rear:[]},{front:['sarck','char_03'],rear:[]});
  const a=G.getNextActor(s),sark=s.units.find(u=>u.id==='sarck'),tank=s.units.find(u=>u.id==='char_03');
  assert(!G.performBasicAttack(s,a.uid,'daly_enemy').ok);assert.equal(s.lastEvent,null);
  const hp=a.hp;assert(G.performBasicAttack(s,a.uid,tank.uid).ok);assert.equal(a.hp,hp);
  assert.equal(sark.hp,530);assert(!s.lastEvent.reaction);
});

test('bônus e mana alteram o ataque recebido, não o valor da reação; curas usam a Vida real',()=>{
  const {s,sark,attacker}=battle('char_10');sark.hp=200;s.support.nextAttackBonus=20;
  const result=G.performBasicAttack(s,attacker.uid,sark.uid,2);assert(result.ok);
  assert.equal(sark.hp,Math.max(0,200-attacker.damage-20-20));assert(result.reaction.instant);
  assert.equal(s.support.nextAttackBonus,0);assert.equal(attacker.mana,1,'mago eliminado não regenera');
  const allied=battle('sam','player');allied.sark.hp=80;
  allied.s.units.filter(u=>u!==allied.sark).forEach(u=>G.eliminateUnit(allied.s,u));
  allied.s.deck.hands.player.push({iid:'heal',id:'bandeide'});
  assert(G.performHandSupport(allied.s,'heal',allied.sark.uid).ok);assert.equal(allied.sark.hp,160);
});

test('duas eliminações promovem as duas defesas e preservam ambas as escolhas de Suportes',()=>{
  const s=G.createBattleState({front:['sam'],rear:['char_05','char_07']},{front:['sarck'],rear:['char_09','char_05']},[],{rng:()=>.5});
  const a=G.getNextActor(s),sark=s.units.find(u=>u.id==='sarck');a.hp=100;sark.hp=1;
  assert(G.performBasicAttack(s,a.uid,sark.uid).ok);
  assert.equal(s.eliminated.length,2);assert.equal(s.formation.side,'enemy');assert.equal(s.formationQueue.length,1);
  assert.equal(G.getNextActor(s),null);
  assert(G.AI.resolveFormation(s).ok);assert.equal(s.formation.side,'player');
  assert(G.resolveFrontLine(s,[...s.formation.candidates]).ok);assert.equal(s.formation,null);
  assert.equal(G.getBoard(s).player.front.length,2);assert.equal(G.getBoard(s).enemy.front.length,2);
  assert(!G.isDalyExposed(s,'player'));assert(!G.isDalyExposed(s,'enemy'));
});

test('eliminação pela reação abre Brisa para outro aliado vivo e ferido',()=>{
  const s=G.createBattleState({front:['char_02','sam'],rear:[]},{front:['sarck'],rear:[]});
  const a=G.getNextActor(s),sam=s.units.find(u=>u.id==='sam'),sark=s.units.find(u=>u.id==='sarck');sam.hp=100;s.support.brisa=30;
  assert(G.performBasicAttack(s,a.uid,sark.uid).ok);assert(a.eliminated);assert(s.support.pending);
  assert(!s.support.pending.candidates.includes(a.uid));assert.equal(G.getNextActor(s),null);
  assert(G.resolveBrisa(s,sam.uid).ok);assert.equal(sam.hp,130);
});

test('sem atacante, consultas não compram; avanço explícito compra uma vez e respeita mão cheia',()=>{
  const {s,attacker}=battle();G.eliminateUnit(s,attacker);
  const round=s.round,count=s.deck.pile.length;
  for(let i=0;i<5;i++)assert.equal(G.getNextActor(s),null);
  assert.equal(s.round,round);assert.equal(s.deck.pile.length,count);
  s.deck.hands.player=Array.from({length:5},(_,i)=>({iid:'old-'+i,id:'item_01'}));
  s.deck.pile=[{iid:'enemy-buy',id:'item_01'},{iid:'new-medal',id:'daly_01'}];
  assert(G.advanceIdleCycle(s).ok);assert.equal(s.round,round+1);assert.equal(s.deck.hands.enemy.length,1);
  assert(s.deck.pendingChoice);assert(!G.advanceIdleCycle(s).ok);assert.equal(s.round,round+1);
  assert(G.resolveHandReplacement(s,'old-0').ok);
  const before=s.round;assert(G.resolveDalle(s,'player',s.deck.hands.player.find(c=>c.iid==='new-medal')).ok);
  assert(G.getNextActor(s));assert.equal(s.round,before,'retomar não gera outra compra');
  assert(!G.advanceIdleCycle(s).ok,'não permite saltar ataques quando há atacante');
});

test('IA pode usar medalha no ciclo sem atacante e Sark entra pelo monte Lendário',()=>{
  const {s,attacker}=battle();G.eliminateUnit(s,attacker);
  const inst=G.claimCharacter(s,'char_07');s.piles.COMMON=[inst];
  s.deck.hands.enemy=[{iid:'bot-medal',id:'daly_01'}];
  assert.equal(G.AI.redeemMedals(s,'enemy').length,1);assert.equal(G.getNextActor(s).id,'char_07');
  const other=G.createBattleState({front:['char_02'],rear:[]},{front:['char_03'],rear:[]});
  assert(other.piles.LEGENDARY.some(c=>c.id==='sarck'));assert(!other.piles.EPIC.some(c=>c.id==='sarck'));
});

test('carta exibe a base integral recebida e acrescenta somente Vida e fôlego dinâmicos',()=>{
  const c=G.getCharacterById('sarck'),html=G.cardHTML({...c,hp:140});
  assert(html.includes('assets/cards/card_base_sark.png'));assert(!html.includes('assets/characters/sarck.png'));
  assert(html.includes('140'));assert(!html.includes('null'));assert(!html.includes('undefined'));
  assert.equal((html.match(/<img /g)||[]).length,1);assert(!html.includes('mask-image'));assert(!html.includes('clip-path'));
  assert.deepEqual([...html.matchAll(/data-value="([^"]+)"/g)].map(m=>m[1]),['hp','stamina']);
  assert(!html.includes('Rank'));assert(!html.includes('assets/references/'));
  assert(G.actorPortraitHTML(c).includes('assets/characters/sark_banner.png'));
  assert(G.actorInfoHTML(battle().s,c).includes('elimina o atacante'));
  for(const path of [c.art,c.cardBase.src,c.abilityArt,c.portraitBanner.src])assert(fs.existsSync(require('node:path').join(__dirname,'..',path)));
  const official=fs.readFileSync(require('node:path').join(__dirname,'..',c.cardBase.src));
  assert.notDeepEqual(official,fs.readFileSync(require('node:path').join(__dirname,'..','assets/references/characters/sarck.png')));
});

test('formações de teste não alteram catálogo, seleção comum ou partidas normais',()=>{
  const catalog=JSON.stringify(G.CHARACTERS);
  for(const side of ['player','enemy']){
    const s=G.createSarkTestState(side),sark=s.units.find(u=>u.id==='sarck');
    assert.equal(sark.team,side);assert(!s.order.includes(sark.uid));assert.equal(sark.hp,530);
    assert.equal(s.units.filter(u=>u.team!==side).length,3);
  }
  assert.equal(JSON.stringify(G.CHARACTERS),catalog);
  assert(!G.createSelection().sel.offered.includes('sarck'));
});

test('empate exige monte vazio, ausência de atacantes e nenhuma medalha utilizável nas duas mãos',()=>{
  for(const side of ['player','enemy']){
    const {s,attacker}=battle();G.eliminateUnit(s,attacker);s.deck.pile=[];
    s.deck.hands[side].push({iid:'usable-medal',id:'daly_01'});
    assert.equal(G.getNextActor(s),null);assert.equal(s.result,null,'medalha utilizável evita empate');
    s.piles.COMMON=[];
    assert.equal(G.getNextActor(s),null);assert.equal(s.result,'draw');
    assert.equal(s.final.winner,null);assert.equal(s.final.loser,null);
    assert.equal(s.daly.player.hp,3);assert.equal(s.daly.enemy.hp,3);
    const before=JSON.stringify(s);assert.equal(G.getNextActor(s),null);assert.equal(JSON.stringify(s),before);
    assert(!G.advanceIdleCycle(s).ok);
  }
});

test('última compra com mão cheia aguarda decisão antes de verificar empate',()=>{
  const {s,attacker}=battle();G.eliminateUnit(s,attacker);
  s.deck.hands.player=Array.from({length:5},(_,i)=>({iid:'full-'+i,id:'item_01'}));
  s.deck.pile=[{iid:'last',id:'daly_01'}];assert(G.advanceIdleCycle(s).ok);
  assert.equal(G.getNextActor(s),null);assert.equal(s.result,null);assert(s.deck.pendingChoice);
  assert(G.resolveHandReplacement(s,'full-0').ok);assert.equal(G.getNextActor(s),null);assert.equal(s.result,null);
  assert(G.resolveDalle(s,'player',s.deck.hands.player.find(c=>c.iid==='last')).ok);assert(G.getNextActor(s));
});
console.log(`${passed} testes de Sark passaram`);
