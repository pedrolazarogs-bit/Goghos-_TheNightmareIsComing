// Regras da batalha. O estado (createBattleState) é a única fonte de verdade; a UI só lê e chama estas funções.
// Equipe: linha de frente (luta, pode ser atacada) + retaguarda (não ataca; Elysh pode receber sua vez para curar).
// Cada lado começa com 2 na frente e a retaguarda vazia; a equipe cresce por Daly e pela recuperação da Daly Mãe (js/core/roster.js).
// A batalha só termina quando uma Daly Mãe chega a 0 vida; quem tem a Daly Mãe viva vence.
(function(G){
const isCharacterDefeated=u=>!!u.eliminated||(u.hp<=0&&!u.oniActive);
const getUnit=(s,uid)=>s.units.find(u=>u.uid===uid)||null;
const canAttackFrom=u=>!!u&&(u.row==='front'||!!u.duelId);
const canHealFromRear=u=>!!u?.rearHealing&&u.row==='rear'&&!u.duelId&&G.getMainAbility(u)?.trigger==='healingAttack';
const canAct=u=>!isCharacterDefeated(u)&&(canAttackFrom(u)||canHealFromRear(u))&&!u.passiveOnly&&!u.abilityDormant;
const isTargetable=u=>!isCharacterDefeated(u)&&u.row==='front'; // retaguarda não pode ser atacada
const canTransit=u=>G.hasClass(u,'SUPPORT');                        // troca voluntária (inalterada): somente Suportes
const fail=error=>({ok:false,error});
function validateTeam(team){
  const ids=[...team.front,...team.rear];
  if(!team.front.length)return fail('A linha de frente não pode ficar vazia.');
  if(team.front.length>3)return fail('A linha de frente permite no máximo 3 personagens.');
  if(team.rear.length>2)return fail('A retaguarda permite no máximo 2 personagens.');
  if(team.rear.some(id=>G.getCharacterById(id)?.class!=='SUPPORT'))return fail('Somente personagens da classe SUPPORT podem ficar na retaguarda.');
  if(new Set(ids).size!==ids.length)return fail('Personagem repetido na equipe.');
  if(ids.some(id=>G.getCharacterById(id)?.summonOnly))return fail('Este personagem só pode entrar por invocação primordial.');
  if(ids.some(id=>!G.getCharacterById(id)))return fail('Personagem inexistente.');
  return{ok:true};
}
const cp=t=>({front:[...t.front],rear:[...t.rear]});
const nextSlot=(s,side,row)=>1+Math.max(-1,...s.units.filter(u=>u.team===side&&u.row===row&&!isCharacterDefeated(u)).map(u=>u.slot));
// Cria a unidade de uma carta de personagem (instância {iid,id}) na linha indicada. uid = lado_n (n cresce a cada personagem que entra).
function makeUnit(s,side,inst,row){
  const c=G.getCharacterById(inst.id),k=s.uidSeq[side]++;
  const u={uid:side+'_'+k,iid:inst.iid,id:c.id,team:side,row,slot:nextSlot(s,side,row),name:c.name,class:c.class,rarity:c.rarity,maxHp:G.roundUpToFive(c.maxHp),hp:G.roundUpToFive(c.maxHp),damage:G.roundUpToFive(c.damage),speed:c.speed,stamina:c.stamina,mana:G.manaFor(c),maxMana:G.manaFor(c),art:c.art,abilityId:c.abilityId||null,passiveOnly:!!c.passiveOnly,parryThreshold:c.parryThreshold||0,pinnedBy:null,pinning:null,pinStartedTurn:null,eliminated:false};
  u.rearHealing=!!c.rearHealing;u.tankResistance=c.tankResistance;s.units.push(u);G.initializeCharacterAbility?.(s,u,c);return u;
}
function createBattleState(playerTeam,enemyTeam,supportIds=[],opts={}){
  const rng=opts.rng||Math.random,teams={player:playerTeam,enemy:enemyTeam};
  ['player','enemy'].forEach(side=>{const v=validateTeam(teams[side]);if(!v.ok)throw new Error(side+': '+v.error);});
  const s={config:{playerTeam:cp(playerTeam),enemyTeam:cp(enemyTeam),supportIds:[...supportIds]},units:[],uidSeq:{player:0,enemy:0},round:0,turn:1,phase:'battle',
    support:G.createSupportState(supportIds),order:[],acted:{},speedCursor:null,result:null,final:null,log:[],rng,eventSeq:0,lastEvent:null,
    divineReserve:G.createGodReserve(),deck:G.createDeckState(rng),piles:G.createCharacterPiles(rng),eliminated:[],daly:G.createDalyMae(),recovery:null,formation:null,formationQueue:[],abilityChoices:[],duels:[],duelSeq:0,openingAbilities:true,
    roll:opts.roll||(n=>1+Math.floor(rng()*n))}; // roll(n): dado de n lados (injetável nos testes). Tudo aqui é novo a cada partida: nada vaza da anterior.
  ['player','enemy'].forEach(side=>{const t=teams[side];
    t.front.forEach(id=>makeUnit(s,side,G.claimCharacter(s,id),'front'));t.rear.forEach(id=>makeUnit(s,side,G.claimCharacter(s,id),'rear'));});
  G.prepareInitialAbilities?.(s);buildTurnOrder(s);if(G.CONFIG.resetDraw.onBattleStart)G.onSpeedReset(s);return s;
}
function createSarkTestState(side='enemy'){
  const sark={front:['sarck'],rear:[]},attackers={front:['john','sam','stally'],rear:[]};
  const s=createBattleState(side==='player'?sark:attackers,side==='player'?attackers:sark);
  s.log.push('Teste de Steel Jaw · ataque Sark com Raro, Lendário ou Comum para comparar a reação.');
  return s;
}
function createAbilityTestState(id){
  if(!G.getCharacterById(id))throw new Error('Personagem indisponível.');
  const allies=['starGift','guardian','friendship','fullHeal','healingAttack','souls'].includes(G.getMainAbility(G.getCharacterById(id))?.trigger)?[id,'mike']:[id];
  const foes=(id==='mike'?['sheriff','cavaleiro','ddx']:id==='trucc'?['eletric','john','ddx']:['cavaleiro','john','ddx','mike']).filter(c=>!allies.includes(c)).slice(0,3);
  const rear=id==='elysh'?[]:['elysh'];const s=createBattleState({front:allies,rear:[]},{front:foes,rear});
  if(['zuri','elysh'].includes(id)){const target=s.units.find(u=>u.id==='mike');if(target)target.hp=35;}
  return s;
}
// Ordem: personagens capazes de agir, incluindo a cura de Elysh na retaguarda, por Velocidade.
// DESEMPATE: equipe do jogador antes da adversária; depois posição (slot).
// Medalhas e avanços esperam a próxima rodada; recuperação da Daly pode entrar na faixa de velocidade restante.
const compareSpeed=(a,b)=>b.speed-a.speed||(a.team===b.team?0:a.team==='player'?-1:1)||a.slot-b.slot;
function buildTurnOrder(s){
  const list=s.units.filter(canAct);
  list.sort(compareSpeed);
  s.order=list.map(u=>u.uid);s.acted={};s.speedCursor=null;s.round++;G.supportRoundStarted?.(s);return s.order;
}
// Inclui apenas os recuperados cuja velocidade ainda não passou, sem resetar rodada, compras ou ações gastas.
function resumeRecoveryOrder(s,units){
  const eligible=units.filter(u=>canAct(u)&&s.speedCursor!==null&&u.speed<=s.speedCursor&&!s.acted[u.uid]&&!s.order.includes(u.uid));
  const done=s.order.filter(uid=>s.acted[uid]);
  const remaining=s.order.filter(uid=>!s.acted[uid]).map(uid=>getUnit(s,uid)).concat(eligible).sort(compareSpeed);
  s.order=done.concat(remaining.map(u=>u.uid));
  units.forEach(u=>s.log.push(u.name+(u.passiveOnly?' · habilidade reativa ativa; não entra na hierarquia':' · velocidade '+u.speed+' · '+(eligible.includes(u)?'entra na hierarquia desta rodada':'aguarda o próximo reset de velocidade'))));
}
function getNextActor(s){
  G.refreshAbilityAvailability?.(s);
  const paused=()=>s.result||s.recovery||s.formation||s.support.pending||(s.deck&&s.deck.pendingChoice)||s.abilityChoices?.length;
  if(paused())return null; // decisões pendentes pausam a ordem, sem avançar a rodada
  if(checkIdleDraw(s))return null;
  if(G.hasMeaningfulAction&&isIdleBattle(s))return null;
  const find=()=>G.pendingSupportExtra?.(s)||s.order.map(id=>getUnit(s,id)).find(u=>u&&canAct(u)&&!s.acted[u.uid]);
  let a=find();if(!a&&s.units.some(canAct)){buildTurnOrder(s);G.onSpeedReset(s);if(paused())return null;a=find();} // sem atacante, consultas não iniciam ciclos infinitos
  if(a){G.prepareActorAbility?.(s,a);if(paused())return null;}
  return a||null;
}
const isIdleBattle=s=>{G.refreshAbilityAvailability?.(s);return !s.result&&!s.units.some(u=>canAct(u)&&(!G.hasMeaningfulAction||G.hasMeaningfulAction(s,u)));};
function checkIdleDraw(s){
  if(!isIdleBattle(s)||G.hasTimedEffects?.(s)||s.deck.pile.length||s.recovery||s.formation||s.support.pending||s.deck.pendingChoice||s.abilityChoices?.length)return null;
  const canRedeem=['player','enemy'].some(side=>s.deck.hands[side].some(c=>G.getResetCard(c.id)?.type==='DALY'&&!G.medalBlockReason(s,side,c)));
  if(canRedeem||['player','enemy'].some(side=>G.canSummonFromHand?.(s,side)||G.hasIdleHandResources?.(s,side)))return null;
  s.result='draw';s.phase='ended';s.order=[];
  s.final={winner:null,loser:null,reason:'no-attackers',daly:{player:s.daly.player.hp,enemy:s.daly.enemy.hp},round:s.round};
  s.log.push('Empate · nenhum personagem pode atacar, o monte principal acabou e não há medalhas utilizáveis nas mãos.');
  return s.result;
}
function canManageTeam(s,side){
  if(s.result||s.recovery||s.formation||s.support.pending||s.deck.pendingChoice||s.abilityChoices?.length)return false;
  const actor=getNextActor(s);
  return isIdleBattle(s)||(actor?.team===side&&!actor.pinnedBy&&!actor.pinning&&!G.isActionLocked?.(actor));
}
// A mão pertence à equipe. Impedimentos do personagem não bloqueiam o uso das cartas.
function canUseHand(s,side){
  const pending=()=>s.result||s.recovery||s.formation||s.support.pending||s.deck.pendingChoice||s.abilityChoices?.length;
  if(!['player','enemy'].includes(side)||pending())return false;
  const actor=getNextActor(s);
  return !pending()&&(isIdleBattle(s)||actor?.team===side);
}
function advanceIdleCycle(s){
  if(!isIdleBattle(s))return fail('Há personagens capazes de atacar. Continue a hierarquia.');
  if(!canManageTeam(s,'player'))return fail('Resolva a escolha pendente antes de avançar o ciclo.');
  if(!s.deck.pile.length&&!G.hasTimedEffects?.(s)&&!['player','enemy'].some(side=>G.hasIdleHandResources?.(s,side)))return fail('O monte principal está vazio. Resgate uma medalha disponível na mão.');
  buildTurnOrder(s);s.turn++;G.onSpeedReset(s);if(G.hasTimedEffects?.(s)){event(s,{type:'wait',actorName:'Ciclo',hits:[]});finishResolvedAction(s);}
  return{ok:true};
}
// Promove um Suporte na hora. Com dois disponíveis, pausa para escolher qual deles (ou ambos) defenderá a frente.
function enforceFrontLine(s,side){
  const mine=s.units.filter(u=>u.team===side&&!isCharacterDefeated(u));
  if(!mine.length||mine.some(u=>u.row==='front'))return[];
  const rear=mine.filter(x=>x.row==='rear').sort((a,b)=>a.slot-b.slot),u=rear[0];if(!u)return[];
  u.row='front';u.slot=nextSlot(s,side,'front');s.log.push(u.name+' avançou para a linha de frente');
  if(rear.length>1){const choice={side,candidates:rear.map(x=>x.uid)};if(s.formation)s.formationQueue.push(choice);else s.formation=choice;}
  return[u];
}
function resolveFrontLine(s,uids){
  const p=s.formation;if(s.result||!p)return fail('Nenhum avanço pendente.');
  if(!Array.isArray(uids)||!uids.length||new Set(uids).size!==uids.length||uids.some(uid=>!p.candidates.includes(uid)))return fail('Escolha ao menos um dos Suportes disponíveis.');
  const candidates=p.candidates.map(uid=>getUnit(s,uid));
  if(candidates.some(u=>!u||isCharacterDefeated(u)||!canTransit(u)))return fail('Suporte indisponível.');
  candidates.forEach(u=>{u.row=uids.includes(u.uid)?'front':'rear';u.slot=nextSlot(s,p.side,u.row);});
  s.formation=s.formationQueue.shift()||null;s.log.push((p.side==='player'?'Sua defesa':'Defesa adversária')+': '+candidates.filter(u=>u.row==='front').map(u=>u.name).join(' e ')+' na linha de frente');
  return{ok:true};
}
function performTransit(s,uid){
  if(s.result||s.recovery||s.formation||s.support.pending||s.deck.pendingChoice)return fail('Resolva a escolha pendente antes de mover Suportes.');
  const u=getUnit(s,uid);if(!u||isCharacterDefeated(u)||!canTransit(u))return fail('Somente Suportes vivos podem transitar.');
  if(G.isActionLocked?.(u))return fail('O impedimento do Suporte bloqueia a movimentação.');
  if(u.pinnedBy||u.pinning)return fail('O vínculo do machado impede a movimentação.');
  if(u.duelId)return fail('Personagens no duelo dimensional não podem mudar de linha.');
  const actor=getNextActor(s);if(!actor||actor.team!==u.team)return fail('Mova Suportes apenas na vez da sua equipe.');
  if(G.isActionLocked?.(actor))return fail('Resolva o impedimento do personagem da vez antes de mover Suportes.');
  if(actor.pinnedBy||actor.pinning)return fail('Resolva o vínculo do personagem da vez antes de mover Suportes.');
  const board=getBoard(s)[u.team],to=u.row==='front'?'rear':'front';
  if(u.row==='front'&&board.front.length<=1)return fail('A linha de frente precisa manter pelo menos um personagem.');
  if(board[to].length>=(to==='front'?(G.frontLimit?.(s,u.team)||3):2))return fail('Essa linha está cheia. Escolha um Suporte da outra linha para trocar.');
  u.row=to;u.slot=nextSlot(s,u.team,to);s.log.push(u.name+' foi para '+(to==='front'?'a linha de frente':'a retaguarda'));
  return{ok:true};
}
// Encerra a partida (uma vez só): registra vencedor/perdedor e bloqueia tudo que dependa de a batalha continuar.
function finishMatch(s,loser){
  if(s.result)return s.result;
  const winner=loser==='player'?'enemy':'player';
  s.result=winner==='player'?'victory':'defeat';s.phase='ended';s.recovery=null;s.formation=null;s.formationQueue=[];s.support.pending=null;s.support.pendingQueue=[];s.abilityChoices=[];s.order=[];
  s.daly.player.exposed=s.daly.enemy.exposed=false; // nada mais pode ser atacado: a Daly Mãe a 0 aparece como derrotada, não como exposta
  s.final={winner,loser,dalyDefeated:loser,daly:{player:s.daly.player.hp,enemy:s.daly.enemy.hp},round:s.round};
  s.log.push((loser==='player'?'Sua Daly Mãe':'A Daly Mãe adversária')+' chegou a 0 de vida · '+(winner==='player'?'você venceu':'o adversário venceu'));
  return s.result;
}
// Usa os valores reais de vida das duas Daly Mães: vence quem ainda tem a sua viva quando a outra chega a 0.
function checkBattleResult(s){
  if(s.result)return s.result;
  const p=s.daly.player.hp,e=s.daly.enemy.hp;
  if(p<=0&&e>0)finishMatch(s,'player');else if(e<=0&&p>0)finishMatch(s,'enemy');
  return s.result;
}
// Esquivar (Tributo do Assassin): só esquiva quem é MAIS rápido que o atacante; tira-se um dado e esquiva se sair de 1 até a diferença
// de velocidade (ex.: 5 − 3 = 2 → 1 ou 2). Velocidade igual ou maior do atacante: não esquiva. Magos sempre acertam. Esquivar = nenhum dano.
function dodgeInfo(a,t){if(!t||G.isReactionBlocked?.(t)||G.getMainAbility(t)?.trigger==='duelist')return null;if(G.getMainAbility(t)?.trigger==='fadingDodge')return G.hasClass(a,'MAGO')?null:{diff:6-(t.hitWindow||1),sides:6,special:true};if(t.pinnedBy||t.pinning||!G.hasClass(t,'ASSASSIN')||G.hasClass(a,'MAGO'))return null;const diff=t.speed-a.speed;return diff>0?{diff,sides:G.CONFIG.dodgeDie}:null;}
function rollDodge(s,a,t){const i=dodgeInfo(a,t);if(!i)return null;const roll=s.roll(i.sides);return{diff:i.diff,sides:i.sides,roll,dodged:roll<=i.diff};}
// Ataque à Daly Mãe exposta: retira EXATAMENTE 1 vida, qualquer que seja o Dano do atacante (sem excedente, sem esquiva).
// Bônus de apoio e mana não são gastos (não teriam efeito). Cada ataque é processado uma vez (o atacante só age uma vez por rodada).
function regenerateMageMana(s){
  const recovered=[];s.units.forEach(u=>{if(G.hasClass(u,'MAGO')&&!isCharacterDefeated(u)&&u.mana<(u.maxMana||G.MAGE_MAX_MANA)){u.mana=Math.min(u.maxMana||G.MAGE_MAX_MANA,u.mana+1);recovered.push(u.name+' +1 ('+u.mana+'/'+u.maxMana+')');}});
  if(recovered.length)s.log.push('Mana · '+recovered.join(', '));
}
function event(s,data){s.eventSeq=(s.eventSeq||0)+1;s.lastEvent={id:s.eventSeq,...data};}
function completeAction(s,a){const resume=s.speedCursor;s.acted[a.uid]=true;s.speedCursor=a.speed;s.turn++;G.supportActionCompleted?.(s,a,resume);}
function validateActor(s,uid){
  if(s.result)return fail('Batalha encerrada.');
  if(s.recovery||s.formation||s.support.pending||s.deck.pendingChoice||s.abilityChoices?.length)return fail('Resolva a escolha pendente antes de continuar.');
  const a=getUnit(s,uid);
  if(!a||!canAct(a))return fail('Personagem indisponível para agir.');
  if(s.acted[uid]&&!G.isSupportExtra?.(s,uid))return fail('Já agiu nesta rodada.');
  if(getNextActor(s)?.uid!==uid)return fail('Não é a vez deste personagem.');
  return{ok:true,actor:a};
}
function releasePinLink(s,u){
  const source=u.pinning?u:getUnit(s,u.pinnedBy);if(!source?.pinning)return false;
  const target=getUnit(s,source.pinning);
  s.log.push('Sharp Guitar · vínculo encerrado: '+source.name+' soltou '+(target?.name||'o alvo'));
  if(target)target.pinnedBy=null;
  source.pinning=null;source.pinStartedTurn=null;source.pinLastKeptHp=null;return true;
}
function parryInfo(a,t){
  if(G.isReactionBlocked?.(t))return null;
  return t&&t.team!==a.team&&G.hasClass(t,'FIGHTER')&&t.parryThreshold>0&&!t.pinnedBy&&!t.pinning?{threshold:t.parryThreshold,sides:6}:null;
}
function applyHit(s,a,t,damage,options={}){
  if(G.officialApplyHit)return G.officialApplyHit(s,a,t,damage,options);
  const beforeHp=t.hp,info=parryInfo(a,t),roll=info?s.roll(6):null,parried=!!info&&roll<=info.threshold;
  const dodge=parried?null:rollDodge(s,a,t),dodged=!!dodge?.dodged;
  const armor=G.damageInfo(t,damage);
  if(!parried&&!dodged)t.hp=G.roundUpToFive(t.hp-armor.damage);
  const hit={type:parried?'parry':dodged?'dodge':t.hp<=0?'defeat':'hit',actorUid:a.uid,actorName:a.name,targetUid:t.uid,targetName:t.name,targetTeam:t.team,targetRow:t.row,targetSlot:t.slot,beforeHp,afterHp:t.hp,damage:beforeHp-t.hp};
  if(!parried&&!dodged&&armor.blocked)hit.armor=armor;
  if(info)hit.parry={roll,threshold:info.threshold,sides:6,blocked:parried};
  if(dodge)hit.roll=dodge.roll;
  s.log.push(parried?t.name+' defendeu com Parry · dado '+roll+'/6 (precisa 1–'+info.threshold+') · nenhum dano':dodged?a.name+' atacou '+t.name+', mas '+t.name+' esquivou! (dado '+dodge.roll+' ≤ '+dodge.diff+')':a.name+' causou '+armor.damage+' em '+t.name+(armor.blocked?' · defesa: '+damage+' → '+armor.damage:'')+(t.hp<=0?' (derrotado)':'')+(info?' · Parry falhou: dado '+roll+'/6':'')+(dodge?' [esquiva falhou: dado '+dodge.roll+' > '+dodge.diff+']':''));
  return hit;
}
function finishResolvedAction(s){
  if(G.officialAfterAction)return G.officialAfterAction(s);
  const defeated=s.units.filter(u=>u.hp<=0&&!u.eliminated);
  defeated.forEach(u=>G.eliminateUnit(s,u));
  if(!s.result)for(const source of s.units.filter(u=>u.pinning&&!isCharacterDefeated(u)&&u.pinStartedTurn<s.turn)){
    const target=getUnit(s,source.pinning);if(!target||isCharacterDefeated(target)){releasePinLink(s,source);continue;}
    const beforeHp=target.hp,armor=G.damageInfo(target,G.getMainAbility(source).damage),amount=armor.damage;target.hp=G.roundUpToFive(target.hp-amount);
    const tick={type:target.hp<=0?'defeat':'hit',kind:'pin-damage',sourceUid:source.uid,sourceName:source.name,actorName:source.name,ability:'Sharp Guitar',targetUid:target.uid,targetName:target.name,targetTeam:target.team,targetRow:target.row,targetSlot:target.slot,beforeHp,afterHp:target.hp,damage:beforeHp-target.hp,amount};
    if(armor.blocked)tick.armor=armor;
    (s.lastEvent.ticks||(s.lastEvent.ticks=[])).push(tick);
    s.log.push('Sharp Guitar · '+target.name+' sofreu '+amount+' de dano do machado ('+beforeHp+' → '+target.hp+')');
    if(target.hp<=0){defeated.push(target);G.eliminateUnit(s,target);}
  }
  if(!s.result)defeated.forEach(u=>G.onAllyDefeated(s,u));
  regenerateMageMana(s);
}
function eventImpacts(e){return e?[...(e.hits||(['pin-keep','pin-skip','wait','fright'].includes(e.type)?[]:[e])),...(e.reactions||(e.reaction?[e.reaction]:[])),...(e.ticks||[])]:[];}
function performPinnedTurn(s,uid){
  const v=validateActor(s,uid);if(!v.ok)return v;const a=v.actor;
  if(!a.pinnedBy)return fail('Este personagem não está imobilizado.');
  completeAction(s,a);event(s,{type:'pin-skip',actorUid:a.uid,actorName:a.name});
  s.log.push(a.name+' perdeu a ação: está imobilizado por Sharp Guitar');finishResolvedAction(s);return{ok:true};
}
function keepPin(s,uid){
  const v=validateActor(s,uid);if(!v.ok)return v;const a=v.actor;
  if(!a.pinning||a.pinnedBy)return fail('John não está mantendo um machado disponível.');
  completeAction(s,a);event(s,{type:'pin-keep',actorUid:a.uid,actorName:a.name});
  s.log.push(a.name+' manteve o machado cravado · ação encerrada');finishResolvedAction(s);return{ok:true};
}
function withdrawPin(s,uid){
  const v=validateActor(s,uid);if(!v.ok)return v;
  if(!v.actor.pinning||v.actor.pinnedBy)return fail('Não há machado disponível para retirar.');
  releasePinLink(s,v.actor);s.log.push(v.actor.name+' retirou o machado e pode escolher um novo ataque');return{ok:true};
}
function reactionPreview(attacker,target,incomingDamage=null){
  if(G.isPresence(attacker)||G.isPresence(target))return null;
  if(!target||G.isReactionBlocked?.(target)||target.team===attacker.team||target.pinnedBy||target.pinning||isCharacterDefeated(target)||(incomingDamage!==null&&G.roundUpToFive(incomingDamage)>=target.hp))return null;
  const ability=target&&G.getMainAbility(target);if(ability?.trigger!=='onAttacked')return null;
  return{ability:ability.name,instant:ability.instantRarities.includes(attacker.rarity),damage:G.roundUpToFive(ability.damage)};
}
// Uma reação pertence ao ataque original: não é outro ataque, não esquiva, não consome ação e não gera outra reação.
function resolveReaction(s,a,t){
  if(isCharacterDefeated(a))return null;
  if(isCharacterDefeated(t)){
    const ability=G.getMainAbility(t);
    if(ability?.trigger==='onAttacked')s.log.push(t.name+' foi derrotado pelo ataque · '+ability.name+' não ativou: não sobreviveu para revidar');
    return null;
  }
  const p=reactionPreview(a,t);if(!p)return null;
  const beforeHp=a.hp,armor=G.damageInfo(a,p.damage);
  const applied=G.dealCharacterDamage?.(s,t,a,p.damage,{instant:p.instant,ability:p.ability,kind:'reaction'});
  if(!applied)a.hp=p.instant?0:G.roundUpToFive(a.hp-armor.damage);
  if(applied){s.log.push(t.name+' · '+p.ability+': '+(applied.instant?applied.targetName+' foi eliminado instantaneamente':applied.targetName+' recebeu '+applied.amount+' de dano ('+applied.beforeHp+' → '+applied.afterHp+')'+(applied.armor?' · defesa':'')));return{...applied,sourceUid:t.uid,sourceName:t.name};}
  const r={type:a.hp<=0?'defeat':'hit',sourceUid:t.uid,sourceName:t.name,targetUid:a.uid,targetName:a.name,targetTeam:a.team,targetRow:a.row,targetSlot:a.slot,beforeHp,afterHp:a.hp,damage:beforeHp-a.hp,amount:p.instant?null:p.damage,instant:p.instant,ability:p.ability};
  if(!p.instant&&armor.blocked){r.armor=armor;r.amount=armor.damage;}
  s.log.push(t.name+' · '+p.ability+': '+(p.instant?a.name+' foi eliminado instantaneamente':a.name+' recebeu '+r.amount+' de dano ('+beforeHp+' → '+a.hp+')'+(r.armor?' · defesa':'')));
  return r;
}
function attackDaly(s,a,side){
  const d=s.daly[side],before=d.hp;d.hp=Math.max(0,d.hp-1);completeAction(s,a);event(s,{type:'daly-hit',actorUid:a.uid,targetUid:'daly_'+side,damage:before-d.hp});
  Object.assign(s.lastEvent,{actorName:a.name,targetName:side==='player'?'Sua Daly Mãe':'Daly Mãe adversária',beforeHp:before,afterHp:d.hp});
  s.log.push(a.name+' atacou '+(side==='player'?'a sua Daly Mãe':'a Daly Mãe adversária')+' · −1 vida ('+d.hp+'/'+d.max+')');
  checkBattleResult(s);
  if(!s.result)finishResolvedAction(s);
  if(!s.result)G.openRecovery(s,side); // ainda tem vida: o dono escolhe a recuperação
  return{ok:true,damage:0,defeated:false,daly:side,dalyHp:d.hp,dalyDefeated:d.hp<=0};
}
function performAreaAttack(s,attackerUid,mana=0){
  const v=validateActor(s,attackerUid);if(!v.ok)return v;const a=v.actor;
  if(G.getMainAbility(a)?.trigger!=='areaAttack')return fail('Este personagem não tem ataque em área.');
  if(a.pinnedBy||a.pinning||G.isActionLocked?.(a))return fail('O personagem está impedido de atacar.');
  if(!Number.isInteger(mana)||mana<0||mana>a.mana)return fail('Quantidade de mana inválida.');
  const side=a.team==='player'?'enemy':'player',targets=G.attackTargets(s,a);
  if(!targets.length)return !a.duelId&&G.isDalyExposed(s,side)?attackDaly(s,a,side):fail('Não há adversários acessíveis para este ataque.');
  const bonus=G.takeAttackBonus(s,a.team),damage=G.roundUpToFive(a.damage+bonus+mana*G.CONFIG.manaDamagePerPoint);
  a.mana-=mana;completeAction(s,a);
  const hits=targets.map(t=>applyHit(s,a,t,damage,{area:true}));
  event(s,{type:'area',actorUid:a.uid,actorName:a.name,targetName:'Linha de frente adversária',hits,damage:hits.reduce((n,h)=>n+h.damage,0),manaSpent:mana,bonus});
  s.lastEvent.reactions=targets.flatMap((t,i)=>G.resolveAttackResponses?G.resolveAttackResponses(s,a,t,hits[i],{area:true}):['hit','defeat'].includes(hits[i].type)?[resolveReaction(s,a,t)].filter(Boolean):[]);
  if(s.lastEvent.reactions.length)s.lastEvent.reaction=s.lastEvent.reactions[0];
  finishResolvedAction(s);return{ok:true,damage,hits,reactions:s.lastEvent.reactions,reaction:s.lastEvent.reactions[0]||null};
}
function performBasicAttack(s,attackerUid,targetUid,mana=0,mode='normal'){
  if(G.usesOfficialAttack?.(getUnit(s,attackerUid)))return G.performOfficialAttack(s,attackerUid,targetUid,mana,mode);
  if(G.getMainAbility(getUnit(s,attackerUid)||{})?.trigger==='areaAttack')return performAreaAttack(s,attackerUid,mana);
  if(G.getMainAbility(getUnit(s,attackerUid)||{})?.trigger==='deathBook')return G.performBookAttack(s,attackerUid);
  if(s.result)return fail('Batalha encerrada.');
  if(s.recovery)return fail('Escolha a recuperação antes de continuar.');
  if(s.formation)return fail('Escolha os Suportes que avançam antes de continuar.');
  if(s.support.pending)return fail('Resolva a Brisa antes de continuar.');
  if(s.abilityChoices?.length)return fail('Resolva a habilidade de entrada antes de continuar.');
  const dSide=typeof targetUid==='string'&&targetUid.startsWith('daly_')?targetUid.slice(5):null; // alvo = Daly Mãe ('daly_player' | 'daly_enemy')
  const a=getUnit(s,attackerUid),t=dSide?null:getUnit(s,targetUid);
  if(!a||(!dSide&&!t))return fail('Personagem inexistente.');
  if(isCharacterDefeated(a))return fail('Atacante derrotado.');
  if(a.row!=='front'&&!a.duelId)return fail('A retaguarda não pode atacar.');
  if(G.isActionLocked?.(a))return fail('O personagem está impedido de agir.');
  if(a.passiveOnly)return fail(a.name+' não tem ataque básico: sua habilidade reage automaticamente ao ser atacado.');
  if(a.pinnedBy)return fail('Este personagem está cravado e não pode atacar.');
  if(a.pinning)return fail('Escolha manter ou retirar o machado antes de atacar.');
  if(!['normal','pin','double'].includes(mode)||mode==='pin'&&G.getMainAbility(a)?.trigger!=='pinAttack'||mode==='double'&&(G.getMainAbility(a)?.trigger!=='doubleAttack'||a.doubleUsed))return fail('Tipo de ataque indisponível ou já utilizado.');
  if(s.acted[a.uid]&&!G.isSupportExtra?.(s,a.uid))return fail('Já agiu nesta rodada.');
  const next=getNextActor(s);if(!next||next.uid!==a.uid)return fail('Não é a vez deste personagem.');
  if(dSide){
    if(a.duelId)return fail('O duelo permite atacar somente seu adversário dimensional.');
    if(mode==='pin')return fail('O machado não pode ser cravado na Daly Mãe.');
    if(!s.daly[dSide])return fail('Alvo inválido.');
    if(dSide===a.team)return fail('O alvo deve ser adversário.');
    if(!G.isDalyExposed(s,dSide))return fail('A Daly Mãe está protegida enquanto houver personagens vivos.');
    if(!Number.isInteger(mana)||mana<0)return fail('Quantidade de mana inválida.');
    if(mana>0&&!G.hasClass(a,'MAGO'))return fail('Somente Magos usam mana.');
    if(mana>a.mana)return fail('Mana insuficiente.');
    return attackDaly(s,a,dSide);
  }
  if(a.team===t.team)return fail('O alvo deve ser adversário.');
  if(isCharacterDefeated(t))return fail('Alvo já derrotado.');
  if(!G.attackTargets(s,a).includes(t))return fail('Este alvo está protegido pela retaguarda ou por outra dimensão.');
  if(mode==='pin'&&(t.pinnedBy||t.pinning))return fail('Este personagem já participa de um vínculo. Use o ataque normal.');
  if(!Number.isInteger(mana)||mana<0)return fail('Quantidade de mana inválida.');
  if(mana>0&&!G.hasClass(a,'MAGO'))return fail('Somente Magos usam mana.');
  if(mana>a.mana)return fail('Mana insuficiente.');
  const per=G.CONFIG.manaDamagePerPoint,bonus=G.takeAttackBonus(s,a.team),dmg=G.roundUpToFive((G.attackBaseDamage(a,t)+bonus+mana*per)*(mode==='double'&&!G.isPresence(t)?2:1)),critical=G.criticalDamage(s,a,dmg),resolvedDamage=critical.damage;
  if(mode==='double')a.doubleUsed=true;
  a.mana-=mana; // Mana gasta é parcialmente recuperada ao fim de cada ação/turno que passa
  completeAction(s,a);const hit=applyHit(s,a,t,resolvedDamage);event(s,{...hit,critical,manaSpent:mana,bonus,...(mode==='double'?{doubleAttack:true}:{})});
  const landed=G.hitLanded?G.hitLanded(hit):['hit','defeat'].includes(hit.type),responses=G.resolveAttackResponses?G.resolveAttackResponses(s,a,t,hit):landed?[resolveReaction(s,a,t)].filter(Boolean):[],reaction=responses[0]||null;
  if(responses.length){s.lastEvent.reactions=responses;s.lastEvent.reaction=reaction;}
  if(mode==='pin'&&!G.isPresence(t)&&landed&&!isCharacterDefeated(a)&&!isCharacterDefeated(t)){
    a.pinning=t.uid;a.pinStartedTurn=s.turn;a.pinLastKeptHp=null;t.pinnedBy=a.uid;
    s.lastEvent.pin={sourceUid:a.uid,targetUid:t.uid};s.log.push('Sharp Guitar · '+a.name+' cravou o machado em '+t.name+' · ambos presos ao vínculo');
  }
  finishResolvedAction(s);
  return{ok:true,damage:landed?resolvedDamage:0,defeated:t.hp<=0,reaction,dodged:hit.type==='dodge',parried:hit.type==='parry',roll:hit.roll};
}
// Troca voluntária (somente na vez da própria equipe): um Suporte da retaguarda e um da linha de frente trocam de lugar.
// Não consome a ação nem dá ataque extra. Quem estava na retaguarda entra na ordem da rodada seguinte.
function performSwap(s,aUid,bUid){
  if(s.result)return fail('Batalha encerrada.');
  if(s.recovery)return fail('Escolha a recuperação antes de continuar.');
  if(s.formation)return fail('Resolva o avanço obrigatório antes de trocar.');
  if(s.support.pending)return fail('Resolva a Brisa antes de continuar.');
  const a=getUnit(s,aUid),b=getUnit(s,bUid);
  if(!a||!b)return fail('Personagem inexistente.');
  if(a.team!==b.team)return fail('A troca é entre aliados.');
  const next=getNextActor(s);if(!next||next.team!==a.team)return fail('Só é possível trocar na vez da sua equipe.');
  if([next,a,b].some(u=>G.isActionLocked?.(u)))return fail('Resolva os impedimentos antes de trocar Suportes.');
  if(next.pinnedBy||next.pinning)return fail('Resolva o vínculo do personagem da vez antes de trocar Suportes.');
  if(isCharacterDefeated(a)||isCharacterDefeated(b))return fail('Personagem derrotado.');
  if(a.pinnedBy||a.pinning||b.pinnedBy||b.pinning)return fail('O vínculo do machado impede a troca.');
  if(a.duelId||b.duelId)return fail('O duelo dimensional impede a troca de linhas.');
  if(!canTransit(a)||!canTransit(b))return fail('Somente Suportes podem trocar de posição.');
  if(a.row===b.row)return fail('A troca é entre retaguarda e linha de frente.');
  [a.row,b.row]=[b.row,a.row];[a.slot,b.slot]=[b.slot,a.slot];
  s.log.push(a.name+' e '+b.name+' trocaram de posição');return{ok:true};
}
function getSwapPairs(s,side){
  const ok=u=>u.team===side&&!isCharacterDefeated(u)&&canTransit(u);
  const rear=s.units.filter(u=>ok(u)&&u.row==='rear'),front=s.units.filter(u=>ok(u)&&u.row==='front');
  return rear.flatMap(r=>front.map(f=>[r.uid,f.uid]));
}
function previewDamage(s,a,mana=0,target=null,mode='normal'){if(G.officialPreviewDamage){const result=G.officialPreviewDamage(s,a,mana,target,mode);if(result!==null)return result;}if(G.isPresence(target)&&G.getMainAbility(a)?.trigger==='areaAttack')return 0;const damage=G.roundUpToFive((G.attackBaseDamage(a,target)+(G.attackBonusFor?G.attackBonusFor(s,a.team):a.team==='player'?s.support.nextAttackBonus:0)+mana*G.CONFIG.manaDamagePerPoint)*(mode==='double'&&!G.isPresence(target)?2:1));return target?G.damageInfo(target,damage,{ignoreMainAbilities:G.isPresence(a)}).damage:damage;}
const resetBattle=s=>createBattleState(s.config.playerTeam,s.config.enemyTeam,s.config.supportIds); // recomeça com as mesmas equipes iniciais; montes, mãos, Daly Mães e eliminados voltam do zero
// Tabuleiro para a UI: por lado, os vivos de cada linha (ordenados pela posição). Eliminados não aparecem: ficam em s.eliminated.
function getBoard(s){
  const rows=(side,row)=>s.units.filter(u=>u.team===side&&u.row===row&&!isCharacterDefeated(u)).sort((a,b)=>a.slot-b.slot);
  return{player:{front:rows('player','front'),rear:rows('player','rear')},enemy:{front:rows('enemy','front'),rear:rows('enemy','rear')}};
}
Object.assign(G,{isCharacterDefeated,getUnit,canAct,canAttackFrom,canHealFromRear,isTargetable,canTransit,validateTeam,makeUnit,createBattleState,createSarkTestState,createAbilityTestState,buildTurnOrder,resumeRecoveryOrder,getNextActor,isIdleBattle,checkIdleDraw,canManageTeam,canUseHand,advanceIdleCycle,enforceFrontLine,resolveFrontLine,performTransit,checkBattleResult,finishMatch,performBasicAttack,performAreaAttack,performPinnedTurn,keepPin,withdrawPin,releasePinLink,parryInfo,eventImpacts,performSwap,getSwapPairs,previewDamage,dodgeInfo,reactionPreview,resetBattle,getBoard});
Object.assign(G,{validateActor,completeAction,finishResolvedAction,recordBattleEvent:event,applyCharacterHit:applyHit,resolveNativeReaction:resolveReaction,attackDaly,regenerateMageMana});
})(globalThis.GOGHOS=globalThis.GOGHOS||{});
