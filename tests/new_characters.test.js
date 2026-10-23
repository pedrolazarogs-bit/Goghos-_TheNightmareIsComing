const assert=require('node:assert/strict'),fs=require('node:fs');
['data/characters','data/support_cards','data/reset_cards','core/battle','core/character_abilities','core/deck','core/support','core/roster','core/official_abilities','core/selection','core/ai','ui/card','ui/match_ui','ui/arena_ui'].forEach(f=>require('../js/'+f+'.js'));
require('./fixtures/legacy_catalog.js');
const G=globalThis.GOGHOS;let passed=0;const test=(name,run)=>{run();passed++;console.log('OK  '+name);};
const battle=(front,enemy,rear=[],enemyRear=[],roll=6)=>G.createBattleState({front,rear},{front:enemy,rear:enemyRear},[],{rng:()=>.5,roll:()=>roll});
const unit=(s,id)=>s.units.find(u=>u.id===id);
const resolve=(s,id,target)=>G.resolveCharacterAbility(s,unit(s,id).uid,target?unit(s,target).uid:null);
function choices(s){let n=0;while(s.abilityChoices.length){assert(n++<20);const r=G.AI.resolveCharacterAbility(s);assert(r.ok,r.error);}}

test('seis raridades, faixas transferidas e seis personagens com números atuais e arte original preservada',()=>{
 assert.deepEqual(G.RARITIES,['COMMON','RARE','EPIC','MYTHIC','LEGENDARY','SECRET']);
 assert.deepEqual(G.RARITY_HP.MYTHIC,{min:430,max:700});assert.deepEqual(G.RARITY_DAMAGE.MYTHIC,{min:90,max:430});
 assert.deepEqual(G.RARITY_HP.LEGENDARY,{min:550,max:1200});assert.deepEqual(G.RARITY_DAMAGE.LEGENDARY,{min:150,max:670});
 assert(G.RARITY_HP.SECRET.max>1200);assert.equal(G.MEDAL_ID.LEGENDARY,'daly_04');assert.equal(G.MEDAL_ID.SECRET,'daly_05');assert.equal(G.MEDAL_ID.MYTHIC,'daly_06');
 const expected={penxy:['ASSASSIN','LEGENDARY',875,360,7],cavaleiro:['FIGHTER','COMMON',180,75,3],zikssy:['ASSASSIN','EPIC',425,120,7],elysh:['SUPPORT','EPIC',480,60,4],ddx:['FIGHTER','RARE',285,90,4],vaglar:['FIGHTER','MYTHIC',580,0,4]};
 for(const [id,values]of Object.entries(expected)){const c=G.getCharacterById(id);assert.deepEqual([c.class,c.rarity,c.maxHp,c.damage,c.speed],values);assert(fs.readFileSync(c.cardBase.src).equals(fs.readFileSync('assets/references/characters/'+id+'.png')));assert(fs.existsSync(c.cardBase.cleanup.src));const html=G.cardHTML(c);assert(html.includes('numeric-cleanup'));assert(!html.includes('undefined'));}
});

test('pré-batalha bloqueia ações, mão e compras e rejeita alvos inválidos sem consumir turno',()=>{
 const s=battle(['penxy'],['char_03']),p=unit(s,'penxy'),t=unit(s,'char_03'),turn=s.turn,round=s.round,deck=s.deck.pile.length;
 assert.equal(s.phase,'prebattle');assert.equal(G.getNextActor(s),null);assert(!G.canManageTeam(s,'player'));
 assert(!G.performBasicAttack(s,p.uid,t.uid).ok);assert(!resolve(s,'penxy','penxy').ok);assert(!G.resolveCharacterAbility(s,p.uid,'daly_enemy').ok);
 for(let i=0;i<5;i++)G.getNextActor(s);assert.equal(s.turn,turn);assert.equal(s.round,round);assert.equal(s.deck.pile.length,deck);
 assert(resolve(s,'penxy','char_03').ok);assert.equal(s.phase,'battle');assert.equal(s.turn,turn);assert.equal(G.getNextActor(s).uid,p.uid);
});

test('Penxy pode chamar a retaguarda e só os dois duelistas podem se atacar',()=>{
 const s=battle(['penxy','char_06'],['cavaleiro'],[],['char_07']),p=unit(s,'penxy'),t=unit(s,'char_07'),ally=unit(s,'char_06'),foe=unit(s,'cavaleiro');
 assert(resolve(s,'penxy','char_07').ok);assert(p.duelId&&p.duelId===t.duelId);assert.equal(t.row,'rear');assert(s.order.includes(t.uid));
 assert.deepEqual(G.attackTargets(s,p),[t]);assert.deepEqual(G.attackTargets(s,t),[p]);assert(!G.attackTargets(s,ally).includes(t));assert(!G.attackTargets(s,foe).includes(p));
 assert(!G.performBasicAttack(s,p.uid,foe.uid).ok);assert(!G.performBasicAttack(s,p.uid,'daly_enemy').ok);
 assert(!G.isDalyExposed(s,'player'));assert(!G.isDalyExposed(s,'enemy'));assert(G.performBasicAttack(s,p.uid,t.uid).ok);assert(t.eliminated);
});

test('área fora da dimensão não atinge os duelistas e os demais continuam na hierarquia',()=>{
 const s=battle(['penxy','eletric'],['char_03','char_08']),p=unit(s,'penxy'),e=unit(s,'eletric'),t=unit(s,'char_03'),outside=unit(s,'char_08');
 assert(resolve(s,'penxy','char_03').ok);p.damage=5;assert(G.performBasicAttack(s,p.uid,t.uid).ok);const hp=t.hp;
 assert.equal(G.getNextActor(s).uid,e.uid);assert(G.performAreaAttack(s,e.uid).ok);assert.equal(t.hp,hp);assert.equal(outside.hp,90);assert.equal(s.lastEvent.hits.length,1);
});

test('morte do alvo encerra o duelo e Penxy só chama outro na próxima vez dele',()=>{
 const s=battle(['penxy'],['char_03','cavaleiro']),p=unit(s,'penxy'),t=unit(s,'char_03');t.hp=5;
 assert(resolve(s,'penxy','char_03').ok);assert(G.performBasicAttack(s,p.uid,t.uid).ok);assert.equal(p.duelId,null);assert(p.needsDuel);assert.equal(s.abilityChoices.length,0);
 const foe=G.getNextActor(s);assert.equal(foe.id,'cavaleiro');assert(G.AI.takeTurn(s,foe).ok);const turn=s.turn;
 assert.equal(G.getNextActor(s),null);assert.equal(s.abilityChoices[0].type,'dimension');assert.equal(s.turn,turn);assert(resolve(s,'penxy','cavaleiro').ok);assert.equal(G.getNextActor(s).uid,p.uid);
});

test('morte de Penxy devolve o sobrevivente à retaguarda e não o ressuscita nem força ataque extra',()=>{
 const s=battle(['penxy','char_06'],['cavaleiro'],[],['char_07']),p=unit(s,'penxy'),t=unit(s,'char_07');
 assert(resolve(s,'penxy','char_07').ok);G.eliminateUnit(s,p);assert.equal(t.duelId,null);assert.equal(t.row,'rear');assert(!G.canAct(t));assert.equal(p.hp,0);assert(!s.duels[0].active);
 assert(G.attackTargets(s,unit(s,'char_06')).includes(unit(s,'cavaleiro')));assert(!G.performTransit(s,p.uid).ok);
});

test('várias habilidades de entrada não travam quando o último alvo entra em outra dimensão',()=>{
 const s=battle(['penxy','vaglar'],['char_03']),p=unit(s,'penxy'),v=unit(s,'vaglar');assert.equal(s.abilityChoices.length,2);
 assert(resolve(s,'penxy','char_03').ok);assert.equal(s.abilityChoices.length,0);assert.equal(s.phase,'battle');assert.equal(G.getNextActor(s).uid,p.uid);assert(v.abilityDormant);
 G.eliminateUnit(s,p);assert(!v.abilityDormant);assert.equal(G.getNextActor(s),null);assert.equal(s.abilityChoices[0].actorUid,v.uid);assert(resolve(s,'vaglar','char_03').ok);
});

test('sem alvo fora da dimensão é possível passar a vez sem atingir o duelo ou a Daly protegida',()=>{
 const s=battle(['penxy','char_06'],['char_03']),p=unit(s,'penxy'),a=unit(s,'char_06'),t=unit(s,'char_03');
 assert(resolve(s,'penxy','char_03').ok);p.damage=5;assert(G.performBasicAttack(s,p.uid,t.uid).ok);assert.equal(G.getNextActor(s).uid,a.uid);
 assert(!G.hasActionTarget(s,a));const hp=t.hp;assert(G.performWait(s,a.uid).ok);assert.equal(t.hp,hp);assert.equal(s.lastEvent.type,'wait');assert.equal(s.daly.enemy.hp,3);
});

test('Cavaleiro bloqueia 80% de ataques simples e de área, com previsão e arredondamento coerentes',()=>{
 for(const [id,incoming,damage]of [['char_06',75,15],['eletric',130,30]]){
  const s=battle([id],['cavaleiro']),a=unit(s,id),t=unit(s,'cavaleiro');assert.equal(G.previewDamage(s,a,0,t),damage);
  assert(G.performBasicAttack(s,a.uid,t.uid).ok);assert.equal(t.hp,180-damage);const hit=G.eventImpacts(s.lastEvent)[0];assert.equal(hit.armor.incoming,incoming);assert.equal(hit.armor.damage,damage);assert.equal(hit.damage,damage);
 }
 assert.equal(G.damageInfo({armorReduction:.8},25).damage,5);assert.equal(G.damageInfo({armorReduction:.8},0).damage,0);
});

test('armadura também reduz o dano do machado: 80 vira 20 e o dano periódico 20 vira 5',()=>{
 const s=battle(['john'],['cavaleiro']),j=unit(s,'john'),t=unit(s,'cavaleiro');s.acted[t.uid]=true;
 assert(G.performBasicAttack(s,j.uid,t.uid,0,'pin').ok);assert.equal(t.hp,160);assert.equal(G.getNextActor(s).uid,t.uid);
 assert(G.performPinnedTurn(s,t.uid).ok);assert.equal(t.hp,155);assert.equal(s.lastEvent.ticks[0].amount,5);assert.equal(s.lastEvent.ticks[0].armor.incoming,20);
});

test('Zikssy rola um d6 por oponente incluindo retaguarda, ganha +20 por resultado 1 ou 2 e não repete',()=>{
 const s=battle(['zikssy'],['cavaleiro','char_03','char_08'],[],['char_05','char_07']),z=unit(s,'zikssy');const rolls=[1,2,3,4,6];let count=0;s.roll=n=>{assert.equal(n,6);return rolls[count++];};
 assert(resolve(s,'zikssy').ok);assert.equal(count,5);assert.equal(z.damage,160);assert.equal(z.speed,7);assert.equal(s.lastEvent.results.length,5);assert.equal(s.lastEvent.bonus,40);
 assert(!resolve(s,'zikssy').ok);G.queueEntryAbility(s,z);assert.equal(s.abilityChoices.length,0);
 G.eliminateUnit(s,unit(s,'cavaleiro'));assert.equal(z.damage,160);assert.equal(z.speed,7);
});

test('assustar todos dá também +1 de velocidade e o resultado 2 ainda é sucesso',()=>{
 for(const roll of [1,2,3,4,5,6]){const s=battle(['zikssy'],['char_03','char_08'],[],[],roll),z=unit(s,'zikssy');assert(resolve(s,'zikssy').ok);assert.equal(z.damage,roll<=2?160:120);assert.equal(z.speed,roll<=2?8:7);assert.equal(s.order[0],z.uid);assert.equal(s.turn,1);}
 const empty=battle(['zikssy'],['char_03']);G.eliminateUnit(empty,unit(empty,'char_03'));assert(resolve(empty,'zikssy').ok);assert.equal(unit(empty,'zikssy').speed,7);
});

test('entrada por recuperação pausa a hierarquia e o susto não volta para uma velocidade já passada',()=>{
 const s=battle(['char_02'],['char_03'],[],[],1);G.eliminateUnit(s,unit(s,'char_02'));s.speedCursor=7;s.turn=2;
 s.piles.EPIC=[{iid:'recover-zikssy',id:'zikssy'}];G.openRecovery(s,'player');assert(G.performRecovery(s,'C').ok);
 const z=unit(s,'zikssy'),turn=s.turn,round=s.round,deck=s.deck.pile.length;assert(s.order.includes(z.uid));assert.equal(G.getNextActor(s),null);
 assert(resolve(s,'zikssy').ok);assert.equal(z.speed,8);assert(!s.order.includes(z.uid));assert.equal(s.turn,turn);assert.equal(s.round,round);assert.equal(s.deck.pile.length,deck);
});

test('Elysh escolhe cura com o ataque atual, gasta uma ação e ignora armadura no aliado',()=>{
 for(const hp of [80,150]){const s=battle(['elysh','cavaleiro'],['char_03']),e=unit(s,'elysh'),t=unit(s,'cavaleiro');t.hp=hp;
  assert.equal(G.getNextActor(s).uid,e.uid);assert(G.performHealingAttack(s,e.uid,t.uid).ok);assert.equal(t.hp,hp===80?140:180);assert(s.acted[e.uid]);assert.equal(s.turn,2);assert.equal(s.lastEvent.healed,hp===80?60:30);assert.equal(s.lastEvent.type,'heal');
  assert(!G.performBasicAttack(s,e.uid,unit(s,'char_03').uid).ok);
 }
});

test('cura da Elysh alcança aliados da retaguarda, mas rejeita inimigos, si própria e mortos',()=>{
 const s=battle(['elysh'],['char_03'],['char_05']),e=unit(s,'elysh'),t=unit(s,'char_05');t.hp=50;
 assert(!G.performHealingAttack(s,e.uid,e.uid).ok);assert(!G.performHealingAttack(s,e.uid,unit(s,'char_03').uid).ok);assert.equal(s.turn,1);
 assert(G.performHealingAttack(s,e.uid,t.uid).ok);assert.equal(t.hp,110);
});

test('DD-X dobra o ataque somente uma vez por vida e o uso continua gasto após reset',()=>{
 const s=battle(['ddx'],['char_03']),d=unit(s,'ddx'),t=unit(s,'char_03');assert.equal(G.previewDamage(s,d,0,t,'double'),180);
 assert(G.performBasicAttack(s,d.uid,t.uid,0,'double').ok);assert.equal(t.hp,40);assert(d.doubleUsed);assert(s.lastEvent.doubleAttack);
 s.order.forEach(uid=>s.acted[uid]=true);assert.equal(G.getNextActor(s).uid,d.uid);assert(!G.performBasicAttack(s,d.uid,t.uid,0,'double').ok);assert.equal(t.hp,40);
 assert(G.performBasicAttack(s,d.uid,t.uid).ok);assert(t.eliminated);
});

test('quatro braços só é gasto em uma ação válida, inclusive quando Parry defende',()=>{
 const s=battle(['ddx'],['john'],[],[],1),d=unit(s,'ddx'),j=unit(s,'john');
 assert(!G.performBasicAttack(s,d.uid,d.uid,0,'double').ok);assert(!d.doubleUsed);assert(!G.performBasicAttack(s,d.uid,'daly_enemy',0,'double').ok);assert(!d.doubleUsed);
 assert(G.performBasicAttack(s,d.uid,j.uid,0,'double').ok);assert(d.doubleUsed);assert.equal(j.hp,270);assert.equal(s.lastEvent.type,'parry');
});

test('Vaglar marca na entrada e só executa na sua velocidade, ignorando a armadura em execução',()=>{
 for(const rarity of ['COMMON','RARE','EPIC']){const s=battle(['vaglar'],['cavaleiro']),v=unit(s,'vaglar'),t=unit(s,'cavaleiro');t.rarity=rarity;
  assert(resolve(s,'vaglar','cavaleiro').ok);assert.equal(t.hp,180);assert.equal(s.turn,1);assert.equal(G.getNextActor(s).uid,v.uid);assert.equal(v.damage,0);
  assert(G.performBasicAttack(s,v.uid,t.uid).ok);assert(t.eliminated);assert(s.lastEvent.instant);assert.equal(s.turn,2);
 }
});

test('livro causa 200 a Mítico, Lendário e Secreto e mantém o nome até a eliminação',()=>{
 for(const rarity of ['MYTHIC','LEGENDARY','SECRET']){const s=battle(['vaglar'],['sam']),v=unit(s,'vaglar'),t=unit(s,'sam');t.rarity=rarity;
  assert(resolve(s,'vaglar','sam').ok);assert(G.performBookAttack(s,v.uid).ok);assert.equal(t.hp,710);assert.equal(s.lastEvent.damage,200);assert(!s.lastEvent.instant);assert.equal(v.bookTarget,t.uid);assert.equal(s.abilityChoices.length,0);
 }
 const armor=battle(['vaglar'],['cavaleiro']),v=unit(armor,'vaglar'),t=unit(armor,'cavaleiro');t.rarity='MYTHIC';assert(resolve(armor,'vaglar','cavaleiro').ok);assert(G.performBookAttack(armor,v.uid).ok);assert.equal(t.hp,140);assert.equal(armor.lastEvent.armor.damage,40);
});

test('livro é habilidade e não rola Parry, Esquiva ou reação de Sark; alvos podem estar atrás',()=>{
 const s=battle(['vaglar'],['sarck'],[],['char_07']),v=unit(s,'vaglar'),t=unit(s,'sarck');assert(resolve(s,'vaglar','sarck').ok);
 s.roll=()=>{throw Error('O livro não rola defesa de ataque');};assert(G.performBookAttack(s,v.uid).ok);assert.equal(t.hp,330);assert.equal(v.hp,v.maxHp);assert(!s.lastEvent.reaction);
 const rear=battle(['vaglar'],['char_03'],[],['char_07']);assert(resolve(rear,'vaglar','char_07').ok);assert(G.performBookAttack(rear,unit(rear,'vaglar').uid).ok);assert(unit(rear,'char_07').eliminated);
});

test('após execução marca outro nome sem ganhar ação extra; nome morto por outro ataque é substituído na vez dele',()=>{
 const s=battle(['vaglar'],['char_03','char_08']),v=unit(s,'vaglar');assert(resolve(s,'vaglar','char_03').ok);assert(G.performBookAttack(s,v.uid).ok);const turn=s.turn;
 assert.equal(s.abilityChoices[0].type,'deathBook');assert(resolve(s,'vaglar','char_08').ok);assert.equal(s.turn,turn);assert(!G.performBookAttack(s,v.uid).ok);
 const other=battle(['vaglar','char_06'],['char_03','char_08']);assert(resolve(other,'vaglar','char_03').ok);G.eliminateUnit(other,unit(other,'char_03'));
 assert.equal(G.getNextActor(other),null);assert.equal(other.abilityChoices[0].type,'deathBook');assert(resolve(other,'vaglar','char_08').ok);
});

test('Vaglar sem personagens inimigos não ataca a Daly: ciclo compra cartas até chegar atacante',()=>{
 const s=battle(['vaglar'],['char_03']);assert(resolve(s,'vaglar','char_03').ok);assert(G.performBookAttack(s,unit(s,'vaglar').uid).ok);assert(G.isIdleBattle(s));assert.equal(G.getNextActor(s),null);assert.equal(s.daly.enemy.hp,3);
 const count=s.deck.pile.length;assert(G.advanceIdleCycle(s).ok);assert.equal(s.deck.pile.length,count-2);assert.equal(s.deck.hands.player.length,1);
 s.deck.pile=[];s.deck.hands.player=[];s.deck.hands.enemy=[];assert.equal(G.getNextActor(s),null);assert.equal(s.result,'draw');
});

test('IA não mantém um ciclo infinito de machado quando Elysh recupera todo o dano',()=>{
 const s=battle(['john'],['elysh','ddx']),j=unit(s,'john'),d=unit(s,'ddx');s.deck.pile=[];s.acted[unit(s,'elysh').uid]=true;s.acted[d.uid]=true;
 assert(G.performBasicAttack(s,j.uid,d.uid,0,'pin').ok);
 let actions=0;while(!d.eliminated&&actions++<40){if(s.deck.pendingChoice){assert(G.resolveHandReplacement(s,null).ok);continue;}const a=G.getNextActor(s);if(s.deck.pendingChoice)continue;assert(a);assert(G.AI.takeTurn(s,a).ok);}
 assert(d.eliminated);assert(actions<40);assert(s.log.some(line=>line.includes('retirou o machado')));
});

test('testes prontos e reinício não vazam bônus, livro, duelo ou quatro braços para outra partida',()=>{
 const data=JSON.stringify(G.CHARACTERS);for(const id of ['penxy','cavaleiro','zikssy','elysh','ddx','vaglar']){const s=G.createAbilityTestState(id);choices(s);assert(s.units.some(u=>u.id===id));const fresh=G.resetBattle(s);assert(fresh.units.every(u=>!u.doubleUsed&&!u.frightResolved&&!u.duelId&&!u.bookTarget));}
 assert.equal(JSON.stringify(G.CHARACTERS),data);assert(G.createSelection().sel.offered.includes('cavaleiro'));assert(!G.createSelection().sel.offered.includes('penxy'));
});
console.log(`${passed} testes dos novos personagens e da pré-batalha passaram`);
