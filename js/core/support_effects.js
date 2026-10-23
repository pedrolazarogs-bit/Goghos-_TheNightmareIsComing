// Kit oficial de Apoio: mesmas regras para as duas equipes, sem gastar a ação do personagem.
(function(G){
const fail=error=>({ok:false,error}),alive=u=>u&&!G.isCharacterDefeated(u),unit=(s,uid)=>G.getUnit(s,uid);
const foe=side=>side==='player'?'enemy':'player';
G.SUPPORT_RULES={reviveHp:1,recruitRow:'front',luckyPermanent:false,extraPerRound:false,comboAnyKill:true};
const oldState=G.createSupportState;
G.createSupportState=ids=>({...oldState(ids),enemy:{usedTurn:0,nextAttackBonus:0,brisa:0,lucky:0,recruited:false},lucky:0,recruited:false});
G.teamSupport=(s,side)=>side==='player'?s.support:s.support.enemy;
G.attackBonusFor=(s,side)=>G.teamSupport(s,side).nextAttackBonus;
G.takeAttackBonus=(s,side='player')=>{const sp=G.teamSupport(s,side),value=sp.nextAttackBonus;sp.nextAttackBonus=0;return value;};
G.frontLimit=(s,side)=>3+(G.teamSupport(s,side).recruited&&G.SUPPORT_RULES.recruitRow==='front'?1:0);
G.rearLimit=()=>2;
const oldInit=G.initializeCharacterAbility;
G.initializeCharacterAbility=(s,u,c)=>{oldInit(s,u,c);Object.assign(u,{silenceRemaining:0,silenceStarted:0,revivedNoAbility:false,shield:0,enduranceArmed:false,invulnerable:0,invulnerableStarted:0,comboKill:false,extraCredits:0,extraEveryRound:false,lastChance:false,healthCopied:false});};
const oldAbility=G.getMainAbility;
G.abilityDisabled=u=>!!(u?.revivedNoAbility||u?.silenceRemaining>0);
G.getMainAbility=u=>G.abilityDisabled(u)?null:oldAbility(u);
G.refreshSupportStats=s=>s.units.forEach(u=>{if(!u.lastChance)return;const active=alive(u)&&u.hp<100;if(active&&!u.lastChanceApplied){u.damage+=50;u.lastChanceApplied=true;}else if(!active&&u.lastChanceApplied){u.damage-=50;u.lastChanceApplied=false;}});
const oldArmor=G.damageInfo;
G.damageInfo=(target,raw,options={})=>{
 const info=oldArmor((G.abilityDisabled(target)||options.ignoreMainAbilities)?{...target,armorReduction:0}:target,raw,options),shield=Math.min(target?.shield||0,info.damage);
 return{...info,damage:Math.max(0,info.damage-shield),blocked:info.blocked+shield,...(shield?{shield}: {})};
};
const oldDamage=G.dealCharacterDamage;
G.dealCharacterDamage=(s,source,target,raw,options={})=>{
 // A proteção de Z-Zus define quem recebe o efeito; a área não é desviada.
 let actual=target,visited=new Set([target.uid]);
 while(!options.area&&!options.ignoreMainAbilities){const g=unit(s,actual.guardianUid);if(!alive(g)||G.abilityDisabled(g)||g.protectedUid!==actual.uid||visited.has(g.uid))break;visited.add(g.uid);actual=g;}
 if(actual.invulnerable>0&&alive(actual))return{type:'immune',actorUid:source?.uid,actorName:source?.name||options.ability||'Efeito',targetUid:actual.uid,targetName:actual.name,targetTeam:actual.team,targetRow:actual.row,targetSlot:actual.slot,beforeHp:actual.hp,afterHp:actual.hp,damage:0,amount:0,ability:'Fôlego',instant:false};
 const hit=oldDamage(s,source,target,raw,options),received=unit(s,hit.targetUid);
 if(received?.shield>0&&!options.instant&&hit.type!=='immune'&&G.damageInfo({...received,shield:0},raw).damage>0){hit.shield=received.shield;received.shield=0;s.log.push(received.name+' gastou Escudo Volátil · bloqueio de até 80');}
 G.refreshSupportStats(s);return hit;
};
G.rollDie=(s,{side,best=1,reason='Dado'})=>{
 const sp=G.teamSupport(s,side);if(!sp?.lucky)return s.roll(6);
 if(!G.SUPPORT_RULES.luckyPermanent)sp.lucky=0;
 s.log.push('Sortudo · '+reason+' · melhor resultado para '+(side==='player'?'você':'o adversário')+': '+best);return best;
};
const oldRefresh=G.refreshAbilityAvailability;
G.refreshAbilityAvailability=s=>{oldRefresh(s);s.units.forEach(u=>{if(u.revivedNoAbility&&u.damage===0)u.abilityDormant=true;});};
const oldLocked=G.isActionLocked;
G.isActionLocked=u=>oldLocked(u)||!!(G.abilityDisabled(u)&&u.damage===0&&!u.passiveOnly);
const oldMeaning=G.hasMeaningfulAction;
G.hasMeaningfulAction=(s,a)=>a.revivedNoAbility&&a.damage===0?false:a.silenceRemaining>0&&a.damage===0?true:oldMeaning(s,a);
const oldTimed=G.hasTimedEffects;
G.hasTimedEffects=s=>oldTimed(s)||s.units.some(u=>alive(u)&&(u.silenceRemaining>0||u.invulnerable>0));
const oldStatus=G.officialStatus;
G.officialStatus=(s,u)=>[oldStatus(s,u),u.revivedNoAbility?'Ressuscitado · sem habilidade':'',u.silenceRemaining?'Sem habilidade · '+u.silenceRemaining+' ações':'',u.shield?'Escudo · −'+u.shield+' no próximo dano':'',u.enduranceArmed?'Fôlego preparado':'',u.invulnerable?'Invencível · Fôlego':'',u.comboKill?'Combokill':'',u.extraEveryRound?'Uma ação extra por rodada':'',u.lastChance?'Última Chance · +50 ataque':''].filter(Boolean).join(' · ');
function impact(s,source,t,beforeHp,healed,ability){const hit={type:'heal',actorName:source,sourceName:source,targetUid:t.uid,targetName:t.name,targetTeam:t.team,targetRow:t.row,beforeHp,afterHp:t.hp,healed,damage:0,ability};(s.lastEvent.hits??=[]).push(hit);return hit;}
function heal(s,t,value,name){const before=t.hp;t.hp=Math.min(t.maxHp,G.roundUpToFive(t.hp+value));G.refreshSupportStats(s);impact(s,name,t,before,t.hp-before,name);s.log.push(name+' · '+t.name+' recuperou +'+(t.hp-before)+' de Vida');}
function cancelAbility(s,t){
 if(t.pinning||t.pinnedBy)G.releasePinLink(s,t);
 if(t.duelId)G.releaseDimension(s,t);
 if(t.hypnosisTarget)G.releaseHypnosis(s,t);
 s.units.forEach(u=>{if(u.petrifiedBy===t.uid)u.petrifiedBy=null;if(u.guardianUid===t.uid)u.guardianUid=null;});
 s.abilityChoices=s.abilityChoices.filter(p=>p.actorUid!==t.uid);
 if(t.oniActive){t.oniActive=false;t.hp=0;}
}
function reusable(u){
 const type=G.getMainAbility(u)?.trigger;
 return type==='oni'&&u.oniActive||type==='doubleAttack'&&u.doubleUsed||type==='fullHeal'&&u.fullHealUsed||type==='sleepPowder'&&u.sleepUsed||type==='starGift'&&u.entryAbilityUsed||type==='fright'&&u.frightResolved||type==='petrify'&&u.petrifyPrecision<3;
}
G.supportTargets=(s,side,def)=>{
 const own=s.units.filter(u=>u.team===side&&alive(u)),enemies=s.units.filter(u=>u.team!==side&&alive(u));
 if(def.target==='deadAlly')return s.units.filter(u=>u.team===side&&u.eliminated&&!G.getCharacterById(u.id).summonOnly);
 let list=def.target==='enemy'?enemies:def.target==='ally'?own:[];
 if(def.effect==='heal')list=list.filter(u=>u.hp<u.maxHp&&!u.oniActive);
 if(def.effect==='executeLow')list=list.filter(u=>u.hp<40);
 if(def.effect==='silence')list=list.filter(u=>!u.revivedNoAbility&&oldAbility(u));
 if(def.effect==='shield')list=list.filter(u=>!u.shield);
 if(def.effect==='endurance')list=list.filter(u=>!u.enduranceArmed&&!u.invulnerable);
 if(def.effect==='lastChance')list=list.filter(u=>u.hp<100&&!u.lastChance&&!u.passiveOnly&&!u.abilityOnly);
 if(def.effect==='comboKill')list=list.filter(u=>!u.comboKill&&!u.passiveOnly&&!u.abilityOnly);
 if(def.effect==='extraAction')list=list.filter(u=>G.canAct(u)&&!u.extraEveryRound&&!u.extraCredits);
 if(def.effect==='recharge')list=list.filter(u=>!G.abilityDisabled(u)&&reusable(u));
 return list;
};
G.handSupportBlockReason=(s,side,inst,targetUid=null)=>{
 if(!G.canUseHand(s,side))return 'Use a carta na vez da sua equipe, após resolver as escolhas pendentes.';
 const sp=G.teamSupport(s,side),def=G.getSupportCard(inst?.id);
 if(!def||!s.deck.hands[side].some(c=>c.iid===inst.iid))return 'A carta não está na sua mão.';
 if(sp.usedTurn===s.turn)return 'Você já usou uma carta de Apoio neste turno.';
 if(def.target!=='none'&&!G.supportTargets(s,side,def).some(u=>u.uid===targetUid))return def.effect==='revive'?'Escolha um aliado eliminado.':'Escolha um alvo válido para '+def.name+'.';
 if(['discardSupport','stealSupport'].includes(def.effect)&&!s.deck.hands[foe(side)].some(c=>G.getResetCard(c.id).type==='SUPPORT'))return 'O adversário não tem Apoios na mão.';
 if(def.effect==='onAllyDefeatedHeal'&&sp.brisa)return 'Brisa já está ativa.';
 if(def.effect==='recruit'&&sp.recruited)return 'Recruta já liberou a vaga extra desta equipe.';
 if(def.effect==='lucky'&&sp.lucky)return 'Sortudo já está ativo.';
 if(def.effect==='copyHealth'&&!s.units.some(u=>alive(u)&&u.team===side&&!u.healthCopied&&!u.oniActive))return 'Nenhum aliado pode receber Uma Mãozinha.';
 if(def.effect==='revive'){const c=G.getCharacterById(unit(s,targetUid).id),b=G.getBoard(s)[side];if(b.front.length>=G.frontLimit(s,side)&&(c.class!=='SUPPORT'||b.rear.length>=G.rearLimit(s,side)))return 'Não há vaga para ressuscitar esse aliado.';}
 return '';
};
G.reviveSupportAlly=(s,t)=>{
 const wasIdle=G.isIdleBattle(s),c=G.getCharacterById(t.id),b=G.getBoard(s)[t.team],row=b.front.length<G.frontLimit(s,t.team)?'front':'rear';
 const count=(t.reviveCount||0)+1;G.initializeCharacterAbility(s,t,c);
 Object.assign(t,{eliminated:false,row,slot:1+Math.max(-1,...b[row].map(u=>u.slot)),hp:G.SUPPORT_RULES.reviveHp,maxHp:c.maxHp,damage:c.damage,speed:c.speed,stamina:c.stamina,mana:G.manaFor(c),maxMana:G.manaFor(c),armorReduction:0,revivedNoAbility:true,lastChanceApplied:false,entryQueued:true,reviveCount:count,enteredRound:s.round,recoverySpeed:null});
 s.eliminated=s.eliminated.filter(e=>e.uid!==t.uid);s.revivals??=[];s.revivals.push({uid:t.uid,round:s.round});
 if(wasIdle&&G.canAct(t)&&t.damage>0&&!s.order.includes(t.uid))s.order.push(t.uid);
 G.refreshAbilityAvailability(s);G.refreshDaly(s,t.team);s.log.push('Morto Vivo · '+t.name+' voltou com exatamente '+t.hp+' de Vida e sem habilidade');
};
G.performHandSupport=(s,iid,targetUid,side='player')=>{
 const hand=s.deck.hands[side],inst=hand.find(c=>c.iid===iid),why=G.handSupportBlockReason(s,side,inst,targetUid);if(why)return fail(why);
 const def=G.getSupportCard(inst.id),sp=G.teamSupport(s,side),t=unit(s,targetUid);
 // Descarta a carta usada antes de Furto: abre a vaga e mantém a mão em no máximo cinco.
 hand.splice(hand.indexOf(inst),1);s.deck.discard.push({...inst,side,reason:'played-support'});sp.usedTurn=s.turn;
 G.recordBattleEvent(s,{type:'support',actorName:def.name,ability:def.name,hits:[]});
 switch(def.effect){
  case 'heal':heal(s,t,def.value,def.name);break;
  case 'nextAttackBonus':sp.nextAttackBonus+=def.value;s.log.push('BÔNUS · '+def.name+': próximo ataque causa +'+def.value+' de dano');break;
  case 'onAllyDefeatedHeal':sp.brisa=def.value;s.log.push('BRISA · efeito ativo: quando um aliado for eliminado, outro pode curar +'+def.value+' de Vida');break;
  case 'discardSupport':case 'stealSupport':{
   const enemy=s.deck.hands[foe(side)],cards=enemy.filter(c=>G.getResetCard(c.id).type==='SUPPORT'),chosen=cards[Math.floor(s.rng()*cards.length)];enemy.splice(enemy.indexOf(chosen),1);
   if(def.effect==='stealSupport')hand.push(chosen);else s.deck.discard.push({...chosen,side:foe(side),reason:'zap'});
   s.log.push(def.name+' · '+(def.effect==='stealSupport'?'roubou ':'descartou ')+G.getResetCard(chosen.id).name+' da mão adversária');break;
  }
  case 'silence':cancelAbility(s,t);t.silenceRemaining=4;t.silenceStarted=s.turn;G.settleCasualties(s);s.log.push('Não Grita · '+t.name+' sem habilidade por quatro ações');break;
  case 'executeLow':{const hit=G.dealCharacterDamage(s,null,t,0,{instant:true,ability:'Papakill',kind:'support'});const actual=unit(s,hit.targetUid);if(actual)actual.lastAttackerUid=null;s.lastEvent.hits.push(hit);G.settleCasualties(s);s.log.push('Papakill · '+hit.targetName+(hit.instant?' eliminado instantaneamente':' resistiu'));break;}
  case 'shield':t.shield=80;s.log.push('Escudo Volátil · '+t.name+' bloqueará até 80 no próximo dano');break;
  case 'endurance':t.enduranceArmed=true;s.log.push('Fôlego preparado em '+t.name);break;
  case 'lastChance':t.lastChance=true;t.lastChanceApplied=false;G.refreshSupportStats(s);s.log.push('Última Chance · '+t.name+' ganhou +50 de dano enquanto estiver abaixo de 100 de Vida');break;
  case 'comboKill':t.comboKill=true;s.log.push('Combokill preparado em '+t.name);break;
  case 'extraAction':if(G.SUPPORT_RULES.extraPerRound)t.extraEveryRound=true;G.grantSupportExtra(s,t);s.log.push('Eu Denovo · '+t.name+' ganhou uma ação extra');break;
  case 'lucky':sp.lucky=1;s.log.push('Sortudo ativado para '+(side==='player'?'sua equipe':'a equipe adversária'));break;
  case 'recruit':sp.recruited=true;s.log.push('Recruta · quarta vaga da linha de frente liberada');break;
  case 'revive':G.reviveSupportAlly(s,t);break;
  case 'copyHealth':{
   const weak=s.units.filter(u=>alive(u)&&u.team===side&&!u.oniActive&&!u.healthCopied).sort((a,b)=>a.hp-b.hp||a.maxHp-b.maxHp)[0],max=Math.max(...s.units.filter(alive).map(u=>u.maxHp)),before=weak.hp;
   weak.maxHp=Math.max(weak.maxHp,max);weak.hp=weak.maxHp;weak.healthCopied=true;impact(s,def.name,weak,before,weak.hp-before,def.name);s.log.push('Uma Mãozinha · '+weak.name+' copiou '+weak.maxHp+' de Vida máxima e atual');break;
  }
  case 'recharge':{
   const type=G.getMainAbility(t).trigger;
   if(type==='oni')t.oniExtraUses=(t.oniExtraUses||0)+1;
   if(type==='doubleAttack')t.doubleUsed=false;if(type==='fullHeal')t.fullHealUsed=false;if(type==='sleepPowder')t.sleepUsed=false;
   if(type==='starGift'){t.entryAbilityUsed=false;G.queueOfficialChoice(s,t,'starGift','support');}
   if(type==='fright'){t.frightResolved=false;G.queueOfficialChoice(s,t,'fright','support');}
   if(type==='petrify'){t.petrifyPrecision=Math.min(3,t.petrifyPrecision+1);t.petrifyAttemptRound=0;}
   s.log.push('Poder Adicional · '+t.name+' recebeu mais um uso de '+G.getMainAbility(t).name);break;
  }
 }
 G.refreshSupportStats(s);return{ok:true,showFeedback:true};
};
for(const method of ['performSupport','resolveBrisa']){const old=G[method];G[method]=(...args)=>{const r=old(...args);G.refreshSupportStats(args[0]);return r;};}
const oldEliminated=G.onAllyDefeated;
G.onAllyDefeated=(s,t)=>{
 if(t.team==='player')return oldEliminated(s,t);
 const sp=G.teamSupport(s,'enemy'),target=s.units.filter(u=>alive(u)&&u.team==='enemy'&&u.hp<u.maxHp&&!u.oniActive).sort((a,b)=>a.hp-b.hp)[0];
 if(sp.brisa&&target){const before=target.hp;target.hp=Math.min(target.maxHp,G.roundUpToFive(target.hp+sp.brisa));s.log.push('Brisa adversária · '+target.name+' recuperou '+(target.hp-before)+' de Vida');}
};

G.grantSupportExtra=(s,u)=>{
 if(!alive(u)||!G.canAct(u))return false;s.supportExtra??=[];
 if(s.supportExtra.some(x=>x.uid===u.uid))return false;
 if(!s.acted[u.uid]&&s.order.includes(u.uid)){u.extraCredits=1;return true;}
 s.supportExtra.push({uid:u.uid,resumeSpeed:s.speedCursor});return true;
};
G.pendingSupportExtra=s=>{
 s.supportExtra??=[];while(s.supportExtra.length&&(!alive(unit(s,s.supportExtra[0].uid))||!G.canAct(unit(s,s.supportExtra[0].uid))))s.supportExtra.shift();
 return s.supportExtra.length?unit(s,s.supportExtra[0].uid):null;
};
G.isSupportExtra=(s,uid)=>G.pendingSupportExtra(s)?.uid===uid;
G.supportActionCompleted=(s,a)=>{
 const queued=s.supportExtra?.[0];s.supportAction={uid:a.uid,bonus:queued?.uid===a.uid?queued:null};
 if(s.supportAction.bonus){s.supportExtra.shift();s.speedCursor=queued.resumeSpeed;}
};
const oldAfter=G.officialAfterAction;
G.officialAfterAction=s=>{
 oldAfter(s);G.refreshSupportStats(s);
 for(const u of s.units.filter(alive)){
  if(u.silenceRemaining>0&&u.silenceStarted<s.turn){u.silenceRemaining--;if(!u.silenceRemaining){const protectedUnit=unit(s,u.protectedUid);if(alive(protectedUnit))protectedUnit.guardianUid=u.uid;s.log.push(u.name+' recuperou sua habilidade');}}
  if(u.invulnerable>0&&u.invulnerableStarted<s.turn){u.invulnerable--;if(!u.invulnerable)s.log.push('Fôlego · invencibilidade de '+u.name+' terminou');}
 }
 const e=s.lastEvent,a=unit(s,s.supportAction?.uid);
 if(alive(a)){
  const attack=['attack','area','combo','hit','defeat','parry','dodge','duel-miss','miss'].includes(e?.type)&&!e.book;
  const kill=attack&&(e.hits||[e]).some(h=>h.type==='defeat'&&h.targetTeam!==a.team&&unit(s,h.targetUid)?.eliminated);
  if(a.comboKill&&kill){G.grantSupportExtra(s,a);s.log.push('Combokill · '+a.name+' ganhou outro ataque após eliminar');}
  else if(a.extraCredits){a.extraCredits=0;G.grantSupportExtra(s,a);}
 }
 s.supportAction=null;G.reorderCurrentOrder(s);
};
const oldResponses=G.resolveAttackResponses;
G.resolveAttackResponses=(s,a,t,hit,options={})=>{
 const responses=oldResponses(s,a,t,hit,options),actual=unit(s,hit.targetUid);
 if(alive(actual)&&actual.enduranceArmed){actual.enduranceArmed=false;actual.invulnerable=1;actual.invulnerableStarted=s.turn;s.log.push('Fôlego · '+actual.name+' ficou invencível por uma ação após ser atacado');}
 return responses;
};
G.supportRoundStarted=()=>{};
G.createSupportTestState=id=>{
 const s=G.createBattleState({front:['ddx','mike','alex'],rear:['elysh']},{front:['john','sam','cavaleiro'],rear:[]});
 const pick=(name,side)=>{const i=s.deck.pile.findIndex(c=>c.id===name);if(i>=0)s.deck.hands[side].push(s.deck.pile.splice(i,1)[0]);};
 pick(id,'player');pick(G.MEDAL_ID.RARE,'player');pick('na_moloeira','enemy');pick('brisa','enemy');
 s.units.find(u=>u.id==='mike').hp=35;s.units.find(u=>u.id==='ddx').doubleUsed=true;s.units.find(u=>u.id==='john').hp=30;
 if(id==='morto_vivo')G.eliminateUnit(s,s.units.find(u=>u.id==='elysh'));
 s.log.push('Teste de '+G.getSupportCard(id).name+' · use o Apoio da mão e confira o resultado');return s;
};
G.chooseAISupport=(s,side)=>{
 if(G.CONFIG.aiSupport===false||!G.canUseHand(s,side)||G.teamSupport(s,side).usedTurn===s.turn)return null;
 for(const inst of s.deck.hands[side]){
  const def=G.getSupportCard(inst.id);if(!def)continue;
  const targets=G.supportTargets(s,side,def).sort((a,b)=>def.effect==='silence'?b.damage-a.damage:a.hp-b.hp);
  const target=targets[0];if(G.handSupportBlockReason(s,side,inst,target?.uid))continue;
  // A carta ainda pode ser guardada quando não há proveito no efeito.
  if(def.effect==='copyHealth'&&!s.units.some(u=>alive(u)&&u.team===side&&u.hp<u.maxHp))continue;
  if(def.effect==='extraAction'&&!targets.some(u=>!G.isActionLocked(u)))continue;
  return G.performHandSupport(s,inst.iid,target?.uid,side);
 }
 return null;
};
})(globalThis.GOGHOS);
