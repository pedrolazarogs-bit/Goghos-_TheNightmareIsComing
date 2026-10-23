const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
['data/characters','data/gods','data/support_cards','data/reset_cards','core/battle','core/character_abilities','core/deck','core/support','core/roster','core/official_abilities','core/support_effects','core/divine','core/selection','core/ai','ui/card','ui/match_ui','ui/arena_ui'].forEach(f=>require('../js/'+f+'.js'));
require('./fixtures/legacy_catalog.js');
const G=globalThis.GOGHOS;let passed=0;
const test=(name,run)=>{run();passed++;console.log('OK  '+name);};
const state=(front=['john'],enemy=['char_03'],rear=[],enemyRear=[],roll=6)=>G.createBattleState({front,rear},{front:enemy,rear:enemyRear},[],{rng:()=>.5,roll:()=>roll});
const byId=(s,id)=>s.units.find(u=>u.id===id);
function pin(s){const john=byId(s,'john'),target=G.getBoard(s).enemy.front.find(u=>u.id!=='john');assert.equal(G.getNextActor(s).uid,john.uid);const result=G.performBasicAttack(s,john.uid,target.uid,0,'pin');assert(result.ok,result.error);return{john,target,result};}

test('Elétrica e John preservam bases, atributos oficiais e John tem Parry 2/6',()=>{
 const e=G.getCharacterById('eletric'),j=G.getCharacterById('john');
 assert.equal(e.name,'Elétrica');assert.deepEqual([e.speed,e.stamina,G.manaFor(e),e.damage,e.maxHp],[3,4,3,130,220]);
 assert.deepEqual([j.class,j.speed,j.stamina,j.damage,j.maxHp,j.parryThreshold],['FIGHTER',2,3,80,270,2]);assert.equal(j.rarity,'RARE');
 for(const c of [e,j]){const html=G.cardHTML(c);assert.equal((html.match(/<img /g)||[]).length,1);assert(html.includes(c.cardBase.src));assert(!html.includes('clip-path'));assert(!html.includes('mask-image'));assert(!html.includes('undefined'));for(const p of [c.cardBase.src,c.abilityArt,c.portraitBanner.src])assert(fs.existsSync(path.join(__dirname,'..',p)));}
 assert(G.cardHTML(j).includes('JOHN'));assert(G.cardHTML(e).includes('data-value="mana"'));
});

test('3000W acerta todos os inimigos da frente e preserva aliados, retaguardas e Daly protegida',()=>{
 const s=state(['eletric','sam'],['john','char_03','char_08'],['char_05'],['char_07']),e=byId(s,'eletric');
 const untouched=s.units.filter(u=>u.team==='player'||u.row==='rear').map(u=>[u,u.hp]);const enemies=G.getBoard(s).enemy.front.map(u=>[u,u.hp]),turn=s.turn,round=s.round;
 s.support.nextAttackBonus=20;const r=G.performBasicAttack(s,e.uid,byId(s,'sam').uid,2);assert(r.ok);assert.equal(r.hits.length,3);
 for(const [u,hp] of enemies)assert.equal(u.hp,hp-170);
 for(const [u,hp] of untouched)assert.equal(u.hp,hp);
 assert.equal(e.mana,2);assert.equal(s.support.nextAttackBonus,0);assert.equal(s.turn,turn+1);assert.equal(s.round,round);assert.equal(s.daly.enemy.hp,3);
 assert.equal(s.lastEvent.type,'area');assert.equal(G.eventImpacts(s.lastEvent).length,3);
 assert(!G.performAreaAttack(s,e.uid).ok,'não repete o ataque na mesma rodada');
});

test('Parry na área protege apenas John, com uma única rolagem por alvo',()=>{
 for(const roll of [1,2]){
  const s=state(['eletric'],['john','char_03'],[],[],roll),j=byId(s,'john'),tank=byId(s,'char_03'),hp=tank.hp;let rolls=0;s.roll=n=>{assert.equal(n,6);rolls++;return roll;};
  const r=G.performAreaAttack(s,byId(s,'eletric').uid);assert(r.ok);assert.equal(j.hp,270);assert.equal(tank.hp,hp-130);assert.equal(rolls,1);assert.equal(r.hits.find(x=>x.targetUid===j.uid).type,'parry');
 }
});

test('área resolve todos os impactos antes da reação de Sark e não atinge novos Suportes promovidos',()=>{
 const s=state(['eletric'],['sarck','char_03'],[],['char_05','char_07']),e=byId(s,'eletric'),sarck=byId(s,'sarck'),tank=byId(s,'char_03');tank.hp=1;
 const r=G.performAreaAttack(s,e.uid);assert(r.ok);assert(e.eliminated);assert.equal(sarck.hp,400);assert(tank.eliminated);assert.equal(r.hits.length,2);
 assert(!r.hits.some(h=>h.targetUid===byId(s,'char_05').uid));assert.equal(byId(s,'char_05').hp,byId(s,'char_05').maxHp);
 const other=state(['eletric'],['char_03','char_08'],[],['char_05','char_07']);G.getBoard(other).enemy.front.forEach(u=>u.hp=1);
 assert(G.performAreaAttack(other,byId(other,'eletric').uid).ok);assert.equal(other.lastEvent.hits.length,2);assert(other.formation);assert.equal(byId(other,'char_05').hp,byId(other,'char_05').maxHp);
});

test('área não reseta rodada por alvo, respeita decisão pendente e Daly exposta perde só uma vida',()=>{
 const s=state(['eletric'],['char_03']),e=byId(s,'eletric');s.support.pending={candidates:[],value:30};const before=JSON.stringify(s);
 assert(!G.performAreaAttack(s,e.uid).ok);assert.equal(JSON.stringify(s),before);s.support.pending=null;
 G.eliminateUnit(s,byId(s,'char_03'));const mana=e.mana;assert(G.performAreaAttack(s,e.uid,2).ok);assert.equal(s.daly.enemy.hp,2);assert.equal(e.mana,mana);assert(s.recovery);
});

test('Parry defende com 1 ou 2 e recebe dano normal com 3, 4, 5 ou 6',()=>{
 for(let roll=1;roll<=6;roll++){
  const s=state(['char_06'],['john'],[],[],roll),a=byId(s,'char_06'),j=byId(s,'john'),turn=s.turn;
  const r=G.performBasicAttack(s,a.uid,j.uid);assert(r.ok);assert.equal(j.hp,roll<=2?270:270-a.damage);assert.equal(r.parried,roll<=2);assert.equal(s.lastEvent.parry.roll,roll);assert.equal(s.turn,turn+1);assert(s.acted[a.uid]);
 }
});

test('ataque normal de John causa 80 sem criar vínculo',()=>{
 const s=state(),j=byId(s,'john'),t=byId(s,'char_03'),hp=t.hp;assert(G.performBasicAttack(s,j.uid,t.uid).ok);assert.equal(t.hp,hp-80);assert.equal(j.pinning,null);assert.equal(t.pinnedBy,null);
});

test('cravar causa 80 e os 20 começam na próxima ação, nunca em consultas da fila',()=>{
 const s=state(),hp=byId(s,'char_03').hp,{john,target}=pin(s);
 assert.equal(target.hp,hp-80);assert.equal(john.pinning,target.uid);assert.equal(target.pinnedBy,john.uid);assert.equal(s.lastEvent.ticks,undefined);
 for(let n=0;n<5;n++)assert.equal(G.getNextActor(s).uid,target.uid);assert.equal(target.hp,hp-80);
 assert(!G.performBasicAttack(s,target.uid,john.uid).ok);assert(!G.canManageTeam(s,'enemy'));
 assert(G.performPinnedTurn(s,target.uid).ok);assert.equal(target.hp,hp-100);assert.equal(s.lastEvent.ticks.length,1);
 assert.equal(G.getNextActor(s).uid,john.uid);assert(!G.canManageTeam(s,'player'));assert(G.keepPin(s,john.uid).ok);assert.equal(target.hp,hp-120);
 assert(!G.keepPin(s,john.uid).ok,'manter duas vezes não aplica outro tick');
});

test('cada ação de qualquer equipe aplica um tick, sem multiplicar por alvo de área',()=>{
 const s=state(['john','char_03'],['char_08','char_04']),{john,target}=pin(s),hp=target.hp;
 const a=G.getNextActor(s);assert.equal(a.id,'char_04');assert(G.performBasicAttack(s,a.uid,john.uid).ok);assert.equal(target.hp,hp-20);assert.equal(s.lastEvent.ticks.length,1);
 const next=G.getNextActor(s);assert.equal(next.id,'char_03');assert(G.performBasicAttack(s,next.uid,a.uid).ok);assert.equal(target.hp,hp-40);
 // Introduz Elétrica na frente, aguardando sua faixa na próxima rodada.
 const e=G.addCharacterToTeam(s,'player',G.claimCharacter(s,'eletric'));s.order.forEach(uid=>s.acted[uid]=true);assert.equal(G.getNextActor(s).uid,e.uid);
 target.maxHp=target.hp=1000;const before=target.hp;assert(G.performAreaAttack(s,e.uid).ok);
 assert.equal(target.hp,before-130-20);assert.equal((s.lastEvent.ticks||[]).filter(t=>t.targetUid===target.uid).length,1);
});

test('retirar na vez de John libera ambos sem gastar ação, permitindo novo ataque',()=>{
 const s=state(),{john,target}=pin(s);assert(G.performPinnedTurn(s,target.uid).ok);assert.equal(G.getNextActor(s).uid,john.uid);
 const turn=s.turn,hp=target.hp;assert(G.withdrawPin(s,john.uid).ok);assert.equal(s.turn,turn);assert.equal(target.hp,hp);assert.equal(john.pinning,null);assert.equal(target.pinnedBy,null);assert.equal(G.getNextActor(s).uid,john.uid);
 assert(G.performBasicAttack(s,john.uid,target.uid).ok);assert.equal(target.hp,Math.max(0,hp-80));
});

test('John mantém a vulnerabilidade sem Parry e morte de John libera o alvo antes de outro tick',()=>{
 const s=state(['john'],['char_08','char_04'],[],[],1),{john,target}=pin(s),hp=target.hp;john.hp=1;
 const foe=G.getNextActor(s);assert.equal(foe.id,'char_04');assert.equal(G.parryInfo(foe,john),null);
 assert(G.performBasicAttack(s,foe.uid,john.uid).ok);assert(john.eliminated);assert.equal(target.pinnedBy,null);assert.equal(target.hp,hp);assert.equal(john.pinning,null);
 assert(G.performBasicAttack(s,target.uid,foe.uid).ok===false,'não pode atacar um aliado');
});

test('morte do alvo por machado encerra o vínculo e promove a defesa sem ressuscitar',()=>{
 const s=state(['john'],['char_03'],[],['char_05']),{john,target}=pin(s);target.hp=20;
 assert(G.performPinnedTurn(s,target.uid).ok);assert(target.eliminated);assert.equal(target.hp,0);assert.equal(john.pinning,null);assert.equal(target.pinnedBy,null);
 assert.equal(G.getBoard(s).enemy.front[0].id,'char_05');assert(!G.RARITIES.flatMap(r=>s.piles[r]).some(c=>c.iid===target.iid));
 assert.equal(s.lastEvent.ticks[0].type,'defeat');
});

test('cravada bloqueada, esquivada ou fatal não prende, e Sark reage antes de criar o vínculo',()=>{
 const s=state(['john'],['john'],[],[],1),a=G.getNextActor(s),t=G.getBoard(s).enemy.front[0];assert(G.performBasicAttack(s,a.uid,t.uid,0,'pin').parried);assert.equal(a.pinning,null);assert.equal(t.pinnedBy,null);
 const dodge=state(['john'],['char_02'],[],[],1),j=byId(dodge,'john'),assassin=byId(dodge,'char_02');dodge.acted[assassin.uid]=true;
 assert(G.performBasicAttack(dodge,j.uid,assassin.uid,0,'pin').dodged);assert.equal(j.pinning,null);
 const fatal=state();byId(fatal,'char_03').hp=1;const p=pin(fatal);assert(p.target.eliminated);assert.equal(p.john.pinning,null);
 const reaction=state(['john'],['sarck']),r=pin(reaction);assert(r.john.eliminated);assert.equal(r.target.pinnedBy,null);assert.equal(r.john.pinning,null);
});

test('imobilizado não pode mover, trocar ou esquivar; a mão continua disponível sem desfazer o vínculo',()=>{
 const s=state(['john'],['char_05','char_03'],[],['char_07']);s.acted[byId(s,'char_05').uid]=true;const {john,target}=pin(s);assert.equal(target.id,'char_05');
 assert(!G.performTransit(s,target.uid).ok);assert(!G.performSwap(s,target.uid,byId(s,'char_07').uid).ok);assert.equal(G.dodgeInfo(john,target),null);
 assert(!G.withdrawPin(s,john.uid).ok,'só retira na vez de John');assert.equal(john.pinning,target.uid);
 s.deck.hands.enemy.push({iid:'support',id:'bandeide'});s.order.forEach(uid=>s.acted[uid]=uid!==target.uid);assert.equal(G.getNextActor(s).uid,target.uid);assert(!G.canManageTeam(s,'enemy'));assert(G.canUseHand(s,'enemy'));
});

test('IA usa área, crava e passa ações imobilizadas pelas mesmas regras',()=>{
 const a=state(['eletric'],['char_03','char_08']);assert(G.AI.takeTurn(a,G.getNextActor(a)).ok);assert.equal(a.lastEvent.type,'area');assert.equal(a.lastEvent.hits.length,2);
 const b=state(),j=G.getNextActor(b);assert(G.AI.takeTurn(b,j).ok);assert(j.pinning);const target=G.getNextActor(b);assert(G.AI.takeTurn(b,target).ok);assert.equal(b.lastEvent.type,'pin-skip');assert(G.AI.takeTurn(b,G.getNextActor(b)).ok);assert.equal(b.lastEvent.type,'pin-keep');
});

test('bases e estados dos testes de habilidade não vazam para partidas normais',()=>{
 const data=JSON.stringify(G.CHARACTERS);for(const id of ['eletric','john']){const s=G.createAbilityTestState(id);assert(s.units.some(u=>u.id===id));assert(s.units.every(u=>!u.pinning&&!u.pinnedBy));}
 assert.equal(JSON.stringify(G.CHARACTERS),data);assert(!G.createSelection().sel.offered.includes('john'));assert(!G.createSelection().sel.offered.includes('eletric'));
});

test('machado causa 20 sem rolar Parry ou esquiva do alvo imobilizado',()=>{
 const s=state(['john'],['john']),a=G.getBoard(s).player.front[0],t=G.getBoard(s).enemy.front[0];
 assert(G.performBasicAttack(s,a.uid,t.uid,0,'pin').ok);assert.equal(t.hp,190);
 s.roll=()=>{throw new Error('Dano contínuo não rola defesa');};
 assert(G.performPinnedTurn(s,t.uid).ok);assert.equal(t.hp,170);assert.equal(s.lastEvent.ticks.length,1);
});

test('eliminação de vários aliados em área preserva cada escolha de Brisa sem curar derrotados',()=>{
 const s=state(['sam','char_03','char_08'],['eletric']),sam=byId(s,'sam');s.acted[sam.uid]=true;sam.hp=400;
 byId(s,'char_03').hp=1;byId(s,'char_08').hp=1;s.support.brisa=30;
 assert(G.performAreaAttack(s,byId(s,'eletric').uid).ok);assert.equal(s.eliminated.length,2);assert.equal(sam.hp,270);assert(s.support.pending);assert.equal(s.support.pendingQueue.length,1);
 assert.deepEqual(s.support.pending.candidates,[sam.uid]);assert(G.resolveBrisa(s,sam.uid).ok);assert(s.support.pending);assert(G.resolveBrisa(s,sam.uid).ok);assert.equal(sam.hp,330);assert.equal(s.support.pending,null);
 assert(s.units.filter(u=>u.id==='char_03'||u.id==='char_08').every(u=>u.hp===0&&u.eliminated));
});
console.log(`${passed} testes de Elétrica e John passaram`);
