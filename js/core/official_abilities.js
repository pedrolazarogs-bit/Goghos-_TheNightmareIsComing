// Personagens oficiais: estados, escolhas, dano e reações. A UI usa as mesmas operações que a IA.
(function(G){
const fail=error=>({ok:false,error}),alive=u=>u&&!G.isCharacterDefeated(u),ability=u=>G.getMainAbility(u||{})?.trigger;
const unit=(s,id)=>G.getUnit(s,id),rank=u=>G.isGod(u)?Infinity:G.RARITIES.indexOf(u.rarity),same=(a,b)=>G.sameDimension(a,b);
const entryTypes=['hypnosis','starGift','petrify','guardian','friendship'];
const oldInit=G.initializeCharacterAbility,oldTargets=G.abilityTargets,oldEntry=G.queueEntryAbility,oldResolve=G.resolveCharacterAbility,oldPrepare=G.prepareActorAbility,oldEliminated=G.onCharacterEliminated,oldHealing=G.healingTargets,oldHasTarget=G.hasActionTarget;
G.initializeCharacterAbility=(s,u,c)=>{oldInit(s,u,c);s.burns??=[];Object.assign(u,{hypnosisTarget:null,hypnotizedBy:null,petrifiedBy:null,petrifyPrecision:3,petrifyAttemptRound:0,paralysis:0,paralysisStarted:0,sleep:false,sleepUsed:false,sleepCheckRound:0,fullHealUsed:false,entryAbilityUsed:false,guardianUid:null,protectedUid:null,friendUid:null,huntUid:null,souls:0,oniUsed:false,oniActive:false,oniRemaining:0,hitWindow:1});};
G.isReactionBlocked=u=>!u||!!(u.pinnedBy||u.pinning||u.hypnotizedBy||u.petrifiedBy||u.paralysis||u.sleep);
G.isActionLocked=u=>!!(u?.hypnotizedBy||u?.petrifiedBy||u?.paralysis||u?.sleep);
G.healingTargets=(s,a)=>oldHealing(s,a).filter(t=>!t.oniActive);
G.canAttackCharacter=(s,a,t)=>!(ability(t)==='speedWard'&&a.speed>t.speed)&&!(ability(t)==='assassinWard'&&a.class==='ASSASSIN');
G.attackTargets=(s,a)=>G.canAttackFrom(a)?s.units.filter(t=>alive(t)&&t.team!==a.team&&same(a,t)&&(t.row==='front'||!!a.duelId)&&G.canAttackCharacter(s,a,t)):[];
G.abilityTargets=(s,a,type=ability(a))=>{
 if(['starGift','guardian','friendship'].includes(type))return s.units.filter(t=>alive(t)&&!t.oniActive&&t.team===a.team&&same(a,t)&&(type==='starGift'||t.uid!==a.uid));
 let targets=oldTargets(s,a,type);
 if(type==='petrify')targets=targets.filter(t=>rank(t)<=rank(a)&&!t.petrifiedBy);
 if(type==='hypnosis')targets=targets.filter(t=>!t.hypnotizedBy||t.hypnotizedBy===a.uid);
 return targets;
};
G.reorderCurrentOrder=s=>{
 const done=s.order.filter(id=>s.acted[id]),remaining=s.order.filter(id=>!s.acted[id]).map(id=>unit(s,id)).filter(alive).filter(u=>u.recoverySpeed==null||u.enteredRound!==s.round||u.speed<=u.recoverySpeed);
 remaining.sort((a,b)=>b.speed-a.speed||(a.team===b.team?0:a.team==='player'?-1:1)||a.slot-b.slot);s.order=done.concat(remaining.map(u=>u.uid));
};
G.queueOfficialChoice=(s,u,type,reason='turn')=>{
 if(!alive(u)||s.abilityChoices.some(p=>p.actorUid===u.uid)||!G.abilityTargets(s,u,type).length)return false;
 s.abilityChoices.push({type,actorUid:u.uid,side:u.team,reason});if(!s.recovery)s.phase='prebattle';return true;
};
G.queueEntryAbility=(s,u)=>{
 const type=ability(u);
 if(!entryTypes.includes(type)&&type!=='hunt'){oldEntry(s,u);return;}
 if(u.entryQueued)return;u.entryQueued=true;
 if(type==='hunt'){
  const targets=G.abilityTargets(s,u,type);if(targets.length){const t=targets[Math.floor(s.rng()*targets.length)];u.huntUid=t.uid;s.log.push(u.name+' recebeu por sorteio a caça '+t.name+' · dano triplo contra ela');}return;
 }
 G.queueOfficialChoice(s,u,type,'entry');
};
G.requestOfficialChoice=(s,uid,type)=>{
 const v=G.validateActor(s,uid);if(!v.ok)return v;const a=v.actor;
 if(G.isActionLocked(a)||a.pinnedBy||a.pinning)return fail('Resolva o impedimento do personagem antes da habilidade.');
 if(type==='hypnosis'&&a.hypnosisChangeRound===s.round)return fail('A troca de hipnose desta vez já foi escolhida.');
 if(type!==ability(a)||!['hypnosis','petrify','sleepPowder'].includes(type))return fail('Habilidade indisponível.');
 if(type==='sleepPowder'&&a.sleepUsed)return fail('O pó mágico já foi usado.');
 if(type==='petrify'&&(a.petrifyPrecision<=0||a.petrifyAttemptRound===s.round||s.units.some(t=>alive(t)&&t.petrifiedBy===a.uid)))return fail('A petrificação está indisponível nesta vez.');
 return G.queueOfficialChoice(s,a,type)?{ok:true}:fail('Não há alvo disponível para essa habilidade.');
};
function finishChoice(s){
 s.abilityChoices=s.abilityChoices.filter(p=>alive(unit(s,p.actorUid))&&(p.type==='fright'||G.abilityTargets(s,unit(s,p.actorUid),p.type).length));
 G.refreshAbilityAvailability(s);G.reorderCurrentOrder(s);
 if(!s.abilityChoices.length){s.phase=s.recovery?'recovery':'battle';if(s.openingAbilities){s.openingAbilities=false;s.log.push('Pré-batalha concluída · começa a hierarquia de velocidade');}}
}
G.cancelCharacterAbility=s=>{const p=G.pendingCharacterAbility(s);if(!p||p.reason!=='turn'||!['hypnosis','petrify','sleepPowder'].includes(p.type))return fail('Essa habilidade de entrada deve ser resolvida.');s.abilityChoices.shift();finishChoice(s);return{ok:true};};
G.releaseHypnosis=(s,a)=>{const t=unit(s,a.hypnosisTarget);if(t?.hypnotizedBy===a.uid)t.hypnotizedBy=null;a.hypnosisTarget=null;};
G.resolveCharacterAbility=(s,uid,targetUid=null)=>{
 const p=G.pendingCharacterAbility(s);if(!p||!entryTypes.concat('sleepPowder').includes(p.type))return oldResolve(s,uid,targetUid);
 const a=unit(s,uid),t=unit(s,targetUid);
 if(s.result||p.actorUid!==uid||!alive(a)||s.recovery||s.formation||s.support.pending||s.deck.pendingChoice)return fail('Resolva a escolha pendente da batalha.');
 if(!G.abilityTargets(s,a,p.type).includes(t))return fail('Escolha um personagem permitido pela habilidade.');
 if(p.type==='hypnosis'){
  if(p.reason==='turn')a.hypnosisChangeRound=s.round;
  G.releaseHypnosis(s,a);if(t.pinnedBy||t.pinning)G.releasePinLink(s,t);a.hypnosisTarget=t.uid;t.hypnotizedBy=a.uid;
  s.log.push(a.name+' hipnotizou '+t.name+' · ambos sem atacar; o alvo não pode reagir');
 }else if(p.type==='starGift'){
  if(a.entryAbilityUsed)return fail('A estrela já foi concedida.');
  t.maxHp+=150;t.hp+=150;t.damage+=50;t.speed+=2;t.starFrom=a.uid;a.entryAbilityUsed=true;
  s.log.push(a.name+' concedeu a estrela a '+t.name+' · +150 de Vida máxima e atual, +50 de dano, +2 de velocidade');
 }else if(p.type==='guardian'){
  if(a.entryAbilityUsed||a.uid===t.uid)return fail('Proteção indisponível.');a.protectedUid=t.uid;t.guardianUid=a.uid;a.entryAbilityUsed=true;
  s.log.push(a.name+' protege '+t.name+' · dano direcionado e eliminações são transferidos; área não é transferida');
 }else if(p.type==='friendship'){
  if(a.entryAbilityUsed||a.uid===t.uid)return fail('Amizade indisponível.');a.friendUid=t.uid;a.entryAbilityUsed=true;s.log.push(a.name+' escolheu '+t.name+' como melhor amigo');
 }else if(p.type==='sleepPowder'){
  if(a.sleepUsed)return fail('O pó mágico já foi usado.');a.sleepUsed=true;t.sleep=true;t.sleepCheckRound=0;s.log.push(a.name+' adormeceu '+t.name+' · na vez do alvo, d6 1–2 acorda');
 }else if(p.type==='petrify'){
  if(a.petrifyPrecision<=0)return fail('A precisão de petrificação acabou.');
  const roll=G.rollDie?G.rollDie(s,{side:a.team,best:1,reason:'Petrificação'}):s.roll(6),threshold=a.petrifyPrecision;a.petrifyAttemptRound=p.reason==='entry'?0:s.round;
  if(roll<=threshold){t.petrifiedBy=a.uid;if(t.pinnedBy||t.pinning)G.releasePinLink(s,t);s.log.push(a.name+' petrificou '+t.name+' · d6='+roll+' (1–'+threshold+') · um aliado pode quebrar a maldição por 30');}
  else {a.petrifyPrecision--;s.log.push(a.name+' falhou ao petrificar '+t.name+' · d6='+roll+' · '+(a.petrifyPrecision?'próximo acerto: 1–'+a.petrifyPrecision:'não consegue mais petrificar'));}
 }
 G.recordBattleEvent(s,{type:'ability',actorUid:a.uid,actorName:a.name,targetName:t.name,ability:G.getMainAbility(a).name,hits:[]});
 s.abilityChoices.shift();finishChoice(s);return{ok:true,free:true};
};
G.prepareActorAbility=(s,a)=>{if(a.hypnosisTarget&&(!alive(unit(s,a.hypnosisTarget))||!same(a,unit(s,a.hypnosisTarget))))G.releaseHypnosis(s,a);if(!G.isActionLocked(a))oldPrepare(s,a);if(ability(a)==='hypnosis'&&!alive(unit(s,a.hypnosisTarget))&&!G.isActionLocked(a)&&!a.pinnedBy)G.queueOfficialChoice(s,a,'hypnosis');};
function guardFor(s,t,options){if(options.area||options.ignoreMainAbilities)return null;const g=unit(s,t.guardianUid);return alive(g)&&!G.abilityDisabled?.(g)&&g.uid!==t.uid&&g.protectedUid===t.uid?g:null;}
G.dealCharacterDamage=(s,source,intended,raw,options={})=>{
 // Uma cadeia de protetores é percorrida no máximo uma vez por unidade.
 let target=intended;const seen=new Set([target.uid]);let guard=guardFor(s,target,options);
 while(guard&&!seen.has(guard.uid)){seen.add(guard.uid);target=guard;guard=guardFor(s,target,options);}
 const beforeHp=target.hp,armor=G.damageInfo(target,raw,options),instant=!!options.instant;
 if(!alive(target))return{type:'miss',damage:0,targetUid:target.uid,targetName:target.name,beforeHp,afterHp:beforeHp};
 if(source)target.lastAttackerUid=source.uid;
 if(!target.oniActive||options.ignoreMainAbilities)target.hp=instant?0:armor.damage>0?G.roundUpToFive(target.hp-armor.damage):target.hp;
 if(options.ignoreMainAbilities&&target.oniActive){target.oniActive=false;target.oniRemaining=0;}
 let becameOni=false;
 if(target.hp<=0&&!target.oniActive&&ability(target)==='oni'&&!target.oniUsed&&!options.ignoreMainAbilities){target.oniUsed=true;target.oniActive=true;target.oniRemaining=3;target.oniStarted=s.turn;target.damage+=30;becameOni=true;s.log.push(target.name+' entrou em Oni · imortal por três ações · +30 de dano');}
 const impact={type:target.oniActive?(becameOni?'oni':'immune'):target.hp<=0?'defeat':'hit',actorUid:source?.uid,actorName:source?.name||options.ability||'Efeito',targetUid:target.uid,targetName:target.name,targetTeam:target.team,targetRow:target.row,targetSlot:target.slot,beforeHp,afterHp:target.hp,damage:Math.max(0,beforeHp-target.hp),amount:instant?null:target.oniActive&&!becameOni?0:armor.damage,instant:instant&&!target.oniActive,ability:options.ability,kind:options.kind};
 if(armor.blocked&&!instant)impact.armor=armor;
 if(target!==intended){impact.redirectedFrom=intended.uid;impact.protectedName=intended.name;s.log.push(target.name+' recebeu no lugar de '+intended.name+(impact.instant?' uma eliminação instantânea':' · '+impact.damage+' de dano'));}
 return impact;
};
G.hitLanded=hit=>['hit','defeat','oni','immune'].includes(hit.type);
function noHit(a,t,type,extra={}){return{type,actorUid:a.uid,actorName:a.name,targetUid:t.uid,targetName:t.name,targetTeam:t.team,targetRow:t.row,targetSlot:t.slot,beforeHp:t.hp,afterHp:t.hp,damage:0,...extra};}
G.officialApplyHit=(s,a,t,damage,options={})=>{
 if(!G.canAttackCharacter(s,a,t))return noHit(a,t,'miss');
 if(G.isPresence(t)&&(options.area||options.followup||options.kind==='reaction'))return G.dealCharacterDamage(s,a,t,damage,options);
 const targetAbility=G.isPresence(a)?null:ability(t);
 let parryResult=null,dodgeResult=null;
 if(!options.noDefense&&!G.isReactionBlocked(t)){
  if(targetAbility==='duelist'){
   const roll=G.rollDie?G.rollDie(s,{side:a.team,best:1,reason:'Duelo defensivo'}):s.roll(6);s.log.push(t.name+' desafiou '+a.name+' · dado do atacante '+roll+'/6');
   if(roll>3){const response=G.dealCharacterDamage(s,t,a,200,{instant:rank(a)<=rank(t),ability:'Duelo',kind:'reaction'});s.log.push(t.name+' venceu o duelo defensivo · '+(response.instant?'eliminação instantânea':response.amount+' de dano'));return noHit(a,t,'duel-miss',{roll,responses:[response]});}
  }
  const parry=targetAbility==='duelist'?null:G.parryInfo(a,t);if(parry){const roll=G.rollDie?G.rollDie(s,{side:t.team,best:1,reason:'Parry'}):s.roll(6);parryResult={roll,threshold:parry.threshold,sides:6,blocked:roll<=parry.threshold};if(roll<=parry.threshold){s.log.push(t.name+' defendeu com Parry · dado '+roll+'/6');return noHit(a,t,'parry',{parry:{roll,threshold:parry.threshold,sides:6,blocked:true}});}}
  if(!G.hasClass(a,'MAGO')&&targetAbility!=='duelist'){
   const special=targetAbility==='fadingDodge',diff=G.hasClass(t,'ASSASSIN')?t.speed-a.speed:0;
   if(special||diff>0){const roll=G.rollDie?G.rollDie(s,{side:special?a.team:t.team,best:1,reason:special?'Acertar Trucc':'Esquiva'}):s.roll(6),dodged=special?roll>(t.hitWindow||1):roll<=diff;dodgeResult={roll,dodged,special,diff,hitWindow:t.hitWindow};if(dodged){s.log.push(t.name+' esquivou de '+a.name+' · dado '+roll+(special?' · precisa 1–'+t.hitWindow:' ≤ '+diff));return noHit(a,t,'dodge',{roll});}}
  }
 }
 const hit=G.dealCharacterDamage(s,a,t,damage,options);if(parryResult)hit.parry=parryResult;if(dodgeResult){hit.roll=dodgeResult.roll;hit.dodge=dodgeResult;}
 if(targetAbility==='fadingDodge'&&hit.targetUid===t.uid&&G.hitLanded(hit)){
  t.hitWindow=Math.min(6,t.hitWindow+1);t.speed=Math.max(1,t.speed-1);G.reorderCurrentOrder(s);s.log.push(t.name+' perdeu 1 de velocidade · agora '+t.speed+' · acerta com 1–'+t.hitWindow);
 }
 if(dodgeResult)s.log.push(t.name+' · teste de esquiva d6='+dodgeResult.roll+' · o ataque acertou');
 s.log.push(hit.instant?a.name+' eliminou instantaneamente '+hit.targetName:hit.type==='immune'?hit.targetName+' está invencível · '+(hit.ability||'Oni'):a.name+' causou '+(hit.amount??hit.damage)+' em '+hit.targetName+(hit.type==='oni'?' · entrou em Oni':'')+(hit.armor?' · defesa: '+hit.armor.incoming+' → '+hit.armor.damage:''));return hit;
};
function addBurn(s,source,target,damage,remaining,kind){
 if(!alive(target)||G.isPresence(target))return;
 let burn=s.burns.find(b=>b.sourceUid===source.uid&&b.targetUid===target.uid&&b.kind===kind);
 if(!burn){burn={sourceUid:source.uid,targetUid:target.uid,kind};s.burns.push(burn);}Object.assign(burn,{damage,remaining,started:s.turn});
 s.log.push(target.name+' ficou queimando · '+damage+' por ação, '+remaining+' aplicações');
}
function shark(s,dead){
 const killer=unit(s,dead.lastAttackerUid);if(G.isPresence(killer)||dead.sharkUsed||ability(dead)!=='deathShark'||!alive(killer)||rank(killer)>=rank(dead))return null;
 dead.sharkUsed=true;const roll=G.rollDie?G.rollDie(s,{side:dead.team,best:1,reason:'Tubarão'}):s.roll(6);s.log.push(dead.name+' · tubarão contra '+killer.name+' · d6='+roll+' (1–2 elimina)');
 return roll<=2?G.dealCharacterDamage(s,dead,killer,0,{instant:true,ability:'Tubarão',kind:'reaction'}):null;
}
G.resolveAttackResponses=(s,a,t,hit,options={})=>{
 if(G.isPresence(a))return[];
 const responses=[...(hit.responses||[])],landed=G.hitLanded(hit),actual=unit(s,hit.targetUid);
 if(landed&&actual===t&&!G.isReactionBlocked(t)){const native=G.resolveNativeReaction(s,a,t);if(native)responses.push(native);}
 if(ability(t)==='flames'&&landed&&!G.isReactionBlocked(t)&&alive(a))addBurn(s,t,a,35,3,'defense');
 if(landed&&actual?.hp<=0&&!actual.oniActive){const response=shark(s,actual);if(response)responses.push(response);}
 for(const friend of s.units.filter(k=>alive(k)&&ability(k)==='friendship'&&k.friendUid===t.uid&&!G.isReactionBlocked(k)&&same(k,a))){
  if(!alive(a))break;
  const response=G.officialApplyHit(s,friend,a,friend.damage,{ability:'Melhor amigo',kind:'reaction'});response.sourceName=friend.name;response.sourceUid=friend.uid;response.ability='Melhor amigo';responses.push(response,...(response.responses||[]));
  s.log.push(friend.name+' revidou pelo melhor amigo '+t.name);
 }
 return responses;
};
G.onCharacterEliminated=(s,u)=>{
 oldEliminated(s,u);
 if(u.hypnosisTarget)G.releaseHypnosis(s,u);
 s.units.forEach(t=>{if(t.hypnotizedBy===u.uid)t.hypnotizedBy=null;if(t.hypnosisTarget===u.uid)G.releaseHypnosis(s,t);if(t.guardianUid===u.uid)t.guardianUid=null;});
 for(const collector of s.units.filter(t=>alive(t)&&ability(t)==='souls')){collector.souls++;collector.maxHp+=20;s.log.push(collector.name+' recolheu a alma de '+u.name+' · '+collector.souls+' almas · Vida máxima '+collector.maxHp+'; Vida atual '+collector.hp);}
 const response=shark(s,u);if(response){s.lastEvent??={type:'ability',hits:[]};(s.lastEvent.reactions??=[]).push(response);if(s.lastEvent.timeline)s.lastEvent.timeline.push(response);}
};
G.settleCasualties=s=>{
 let n=0,dead;
 while((dead=s.units.find(u=>u.hp<=0&&!u.oniActive&&!u.eliminated))){if(++n>100)throw Error('Ciclo inválido de eliminações');G.eliminateUnit(s,dead);if(!s.result)G.onAllyDefeated(s,dead);}
};
G.officialAfterAction=s=>{
 G.settleCasualties(s);s.lastEvent??={type:'wait',hits:[]};
 const tick=(source,target,damage,abilityName)=>{const hit=G.dealCharacterDamage(s,source,target,damage,{ability:abilityName,kind:abilityName==='Sharp Guitar'?'pin-damage':'burn-damage'});(s.lastEvent.ticks??=[]).push(hit);s.log.push(abilityName+' · '+hit.targetName+' recebeu '+hit.damage+' ('+hit.beforeHp+' → '+hit.afterHp+')');G.settleCasualties(s);};
 for(const source of s.units.filter(u=>alive(u)&&u.pinning&&u.pinStartedTurn<s.turn)){const target=unit(s,source.pinning);if(alive(target))tick(source,target,(G.getMainAbility(source)?.damage||20),'Sharp Guitar');else G.releasePinLink(s,source);}
 for(const burn of [...s.burns])if(burn.remaining>0&&burn.started<s.turn){const target=unit(s,burn.targetUid);if(alive(target)){tick(unit(s,burn.sourceUid),target,burn.damage,'Queimadura');burn.remaining--;}else burn.remaining=0;}
 s.burns=s.burns.filter(b=>b.remaining>0&&alive(unit(s,b.targetUid)));
 for(const target of s.units.filter(alive)){
  if(target.paralysis>0&&target.paralysisStarted<s.turn){target.paralysis--;if(!target.paralysis)s.log.push(target.name+' recuperou os movimentos');}
  if(target.oniActive&&target.oniStarted<s.turn){target.oniRemaining--;if(!target.oniRemaining&&target.oniExtraUses>0){target.oniExtraUses--;target.oniRemaining=3;s.log.push('Poder Adicional · '+target.name+' iniciou mais três ações em Oni');}
   if(!target.oniRemaining){target.oniActive=false;target.hp=0;const impact={...noHit(target,target,'defeat'),afterHp:0,ability:'Fim do Oni'};(s.lastEvent.ticks??=[]).push(impact);s.log.push(target.name+' terminou o estado Oni e foi eliminado');}}
 }
 G.settleCasualties(s);G.regenerateMageMana(s);G.reorderCurrentOrder(s);
};
G.hasTimedEffects=s=>!!(s.burns?.length||s.units.some(t=>alive(t)&&(t.oniActive||t.paralysis)));
G.hasHittableTarget=(s,a)=>G.attackTargets(s,a).some(t=>G.hasClass(a,'MAGO')||G.isReactionBlocked(t)||ability(t)!=='fadingDodge'&&!G.hasClass(t,'ASSASSIN')||ability(t)==='fadingDodge'||t.speed-a.speed<6||['duelist','diceExecution'].includes(ability(a))||ability(a)==='petrify'&&t.petrifiedBy===a.uid);
G.hasMeaningfulAction=(s,a)=>{
 if(a.oniActive||a.sleep||a.paralysis||a.pinnedBy||a.pinning)return true;
 if(G.isActionLocked(a))return false;
 const type=ability(a);
 if(type==='deathBook')return G.abilityTargets(s,a).length>0;
 if(alive(unit(s,a.hypnosisTarget))&&same(a,unit(s,a.hypnosisTarget)))return true;
 if(G.breakCurseTargets(s,a).length)return true;
 if(['healingAttack','fullHeal'].includes(type)&&!a.fullHealUsed&&G.healingTargets(s,a).length)return true;
 if(G.canHealFromRear(a)&&G.getBoard(s)[a.team].front.length<G.frontLimit(s,a.team))return G.hasHittableTarget(s,{...a,row:'front'})||G.isDalyExposed(s,a.team==='player'?'enemy':'player');
 if(type==='sleepPowder'&&!a.sleepUsed&&G.abilityTargets(s,a).length)return true;
 if(type==='petrify'&&a.petrifyPrecision>0&&!s.units.some(t=>alive(t)&&t.petrifiedBy===a.uid)&&G.abilityTargets(s,a).length)return true;
 return G.hasHittableTarget(s,a)||(G.canAttackFrom(a)&&!a.duelId&&G.isDalyExposed(s,a.team==='player'?'enemy':'player'));
};
G.breakCurseTargets=(s,a)=>G.canAttackFrom(a)?s.units.filter(t=>alive(t)&&t.uid!==a.uid&&t.team===a.team&&t.petrifiedBy&&same(a,t)):[];
G.hasActionTarget=(s,a)=>!!(alive(unit(s,a.hypnosisTarget))||oldHasTarget(s,a)||G.breakCurseTargets(s,a).length);
G.performStatusTurn=(s,uid)=>{
 const v=G.validateActor(s,uid);if(!v.ok)return v;const a=v.actor;
 if(!G.isActionLocked(a))return fail('O personagem pode agir normalmente.');
 if(a.sleep){if(a.sleepCheckRound===s.round)return fail('O teste de sono desta vez já foi feito.');a.sleepCheckRound=s.round;const roll=G.rollDie?G.rollDie(s,{side:a.team,best:1,reason:'Acordar'}):s.roll(6);s.log.push(a.name+' tentou acordar · d6='+roll);if(roll<=2){a.sleep=false;return{ok:true,awake:true,spent:false};}}
 G.completeAction(s,a);G.recordBattleEvent(s,{type:'status-skip',actorUid:a.uid,actorName:a.name,hits:[]});s.log.push(a.name+' perdeu a ação · '+G.officialStatus(s,a));G.finishResolvedAction(s);return{ok:true,spent:true};
};
G.performFullHeal=(s,uid)=>{
 const v=G.validateActor(s,uid);if(!v.ok)return v;const a=v.actor;
 if(ability(a)!=='fullHeal'||a.fullHealUsed||G.isActionLocked(a)||a.pinnedBy)return fail('A cura total está indisponível.');
 const targets=G.healingTargets(s,a);if(!targets.length)return fail('Não há outro aliado ferido para curar.');
 a.fullHealUsed=true;G.completeAction(s,a);const hits=targets.map(t=>{const beforeHp=t.hp;t.hp=t.maxHp;return{...noHit(a,t,'heal'),beforeHp,afterHp:t.hp,healed:t.hp-beforeHp};});
 G.recordBattleEvent(s,{type:'full-heal',actorUid:a.uid,actorName:a.name,hits});s.log.push(a.name+' usou sua única cura total · '+targets.map(t=>t.name).join(', '));G.finishResolvedAction(s);return{ok:true};
};
G.performBreakCurse=(s,uid,targetUid)=>{
 const v=G.validateActor(s,uid);if(!v.ok)return v;const a=v.actor,t=unit(s,targetUid);
 if(G.isActionLocked(a)||a.pinnedBy||a.pinning||alive(unit(s,a.hypnosisTarget))||!G.breakCurseTargets(s,a).includes(t))return fail('Escolha outro aliado petrificado na mesma dimensão.');
 t.petrifiedBy=null;G.completeAction(s,a);const hit=G.dealCharacterDamage(s,a,t,30,{ability:'Quebrar maldição'});G.recordBattleEvent(s,{...hit});s.log.push(a.name+' quebrou a maldição de '+t.name+' · ataque substituído por 30 de dano');G.finishResolvedAction(s);return{ok:true};
};
G.performHypnosisTurn=(s,uid)=>{
 const v=G.validateActor(s,uid);if(!v.ok)return v;const a=v.actor,t=unit(s,a.hypnosisTarget);
 if(ability(a)!=='hypnosis'||G.isActionLocked(a)||a.pinnedBy||!alive(t)||!same(a,t))return fail('Escolha um alvo acessível para a hipnose.');
 G.completeAction(s,a);const hit=G.dealCharacterDamage(s,a,t,90,{ability:'Hipnose',kind:'hypnosis'});G.recordBattleEvent(s,{...hit});s.log.push(a.name+' manteve a hipnose · '+hit.targetName+' recebeu '+hit.damage);G.finishResolvedAction(s);return{ok:true};
};
G.officialStatus=(s,u)=>{
 const states=[];
 if(ability(u)==='assassinWard')states.push('Protegido contra ataques de Assassinos');if(ability(u)==='speedWard')states.push('Só pode ser atacado por velocidade até '+u.speed);if(ability(u)==='armor')states.push('Armadura · bloqueia 80%');
 const friend=s.units.find(k=>alive(k)&&k.friendUid===u.uid);if(friend)states.push('Melhor amigo de '+friend.name);
 if(ability(u)==='fullHeal')states.push(u.fullHealUsed?'Cura total já usada':'Cura total disponível');if(ability(u)==='sleepPowder')states.push(u.sleepUsed?'Pó mágico já usado':'Pó mágico disponível');
 if(u.oniActive)states.push('Oni imortal · '+u.oniRemaining+' ações');if(u.paralysis)states.push('Paralisia · '+u.paralysis+' ações');if(u.sleep)states.push('Dormindo · acorda com 1–2');if(u.petrifiedBy)states.push('Petrificado · aliado pode libertar por 30');if(u.hypnotizedBy)states.push('Hipnotizado · sem reações');if(u.hypnosisTarget&&alive(unit(s,u.hypnosisTarget)))states.push('Hipnotiza '+unit(s,u.hypnosisTarget).name);
 if(u.souls)states.push(u.souls+' almas · +'+u.souls*20+' Vida máxima');if(u.starFrom)states.push('Estrela · +150 Vida / +50 dano / +2 velocidade');if(u.huntUid&&alive(unit(s,u.huntUid)))states.push('Caça: '+unit(s,u.huntUid).name+' · triplo');if(u.guardianUid&&alive(unit(s,u.guardianUid)))states.push('Protegido por '+unit(s,u.guardianUid).name);if(u.protectedUid)states.push('Protege '+unit(s,u.protectedUid)?.name+' · exceto área');if(u.friendUid)states.push('Melhor amigo: '+unit(s,u.friendUid)?.name);if(ability(u)==='fadingDodge')states.push('Acerta com 1–'+u.hitWindow+' · Magos acertam');if(ability(u)==='petrify')states.push(u.petrifyPrecision?'Petrificação: 1–'+u.petrifyPrecision:'Petrificação esgotada');
 for(const b of s.burns.filter(b=>b.targetUid===u.uid))states.push('Fogo: '+b.damage+' × '+b.remaining);
 return states.join(' · ');
};
const activeAttacks=['missile','paralyzingKick','duelist','hypnosis','punchCombo','flames','hunt','diceExecution','petrify','swarm'];
G.usesOfficialAttack=a=>activeAttacks.includes(ability(a));
G.performOfficialAttack=(s,uid,targetUid,mana=0,mode='normal')=>{
 const v=G.validateActor(s,uid);if(!v.ok)return v;const a=v.actor,type=ability(a),t=unit(s,targetUid),dSide=typeof targetUid==='string'&&targetUid.startsWith('daly_')?targetUid.slice(5):null;
 if(G.isActionLocked(a)||a.pinnedBy||a.pinning)return fail('O personagem está impedido de atacar.');
 if(type==='hypnosis'&&alive(unit(s,a.hypnosisTarget)))return G.performHypnosisTurn(s,uid);
 const modes=type==='paralyzingKick'?['normal','stun']:type==='swarm'?['normal','area']:['normal'];if(!modes.includes(mode))return fail('Modo de ataque indisponível.');
 if(!Number.isInteger(mana)||mana<0||mana>a.mana||mana>0&&!G.hasClass(a,'MAGO'))return fail('Mana inválida.');
 if(type==='swarm'&&mode==='area'&&!a.duelId&&G.isDalyExposed(s,a.team==='player'?'enemy':'player'))return G.attackDaly(s,a,a.team==='player'?'enemy':'player');
 if(dSide){if(a.duelId||dSide===a.team||!s.daly[dSide]||!G.isDalyExposed(s,dSide))return fail('A Daly Mãe está protegida.');return G.attackDaly(s,a,dSide);}
 let targets=G.attackTargets(s,a);
 const area=type==='swarm'&&mode==='area';
 if(!area&&(!t||!targets.includes(t)))return fail('Escolha um adversário acessível para o ataque.');
 if(area&&!targets.length)return fail('Não há adversários acessíveis para o Swarm.');
 const bonus=G.takeAttackBonus(s,a.team),extra=bonus+mana*G.CONFIG.manaDamagePerPoint;a.mana-=mana;G.completeAction(s,a);
 const event={type:area?'area':type==='punchCombo'?'combo':'attack',actorUid:a.uid,actorName:a.name,ability:G.getMainAbility(a).name,hits:[],reactions:[],timeline:[],rolls:[],damage:0,manaSpent:mana,bonus};G.recordBattleEvent(s,event);
 const e=s.lastEvent;
 const strike=(target,damage,options={})=>{
  const hit=options.direct?G.dealCharacterDamage(s,a,target,damage,options):G.applyCharacterHit(s,a,target,damage,options);
  e.hits.push(hit);e.timeline.push(hit);const responses=G.resolveAttackResponses(s,a,target,hit,options);e.reactions.push(...responses);e.timeline.push(...responses);return hit;
 };
 if(type==='punchCombo'){
  const seen=new Set();for(let i=0;i<6&&alive(a)&&alive(t);i++){
   const roll=G.rollDie?G.rollDie(s,{side:a.team,best:[1,2,3,4,5,6].filter(n=>!seen.has(n)).at(-1),reason:'Combo de Sam'}):s.roll(6),repeated=seen.has(roll);e.rolls.push({roll,repeated});s.log.push(a.name+' · combo, dado '+roll+(repeated?' repetido: combo encerrado':' · soco '+(i+1)));
   if(repeated)break;seen.add(roll);const hit=strike(t,G.attackBaseDamage(a,t)+(i===0?extra:0),{followup:i>0});hit.punch=i+1;G.settleCasualties(s);
  }
 }else if(type==='diceExecution'){
  const roll=G.rollDie?G.rollDie(s,{side:a.team,best:6,reason:'Decapitação'}):s.roll(6);e.rolls.push({roll});s.log.push(a.name+' · d6='+roll+' · '+(roll===6&&rank(t)<=rank(a)?'decapitação':a.damage*roll+' de dano básico'));
  strike(t,G.attackBaseDamage(a,t)*(G.isPresence(t)?1:roll)+extra,{instant:!G.isPresence(t)&&roll===6&&rank(t)<=rank(a),direct:!G.isPresence(t)&&roll===6,ability:'Decapitação'});
 }else if(type==='duelist'){
  const roll=G.rollDie?G.rollDie(s,{side:a.team,best:1,reason:'Duelo ofensivo'}):s.roll(6);e.rolls.push({roll});s.log.push(a.name+' · duelo ofensivo · d6='+roll+' (1–3 vence)');
  if(roll<=3)strike(t,200,{instant:rank(t)<=rank(a),direct:true,ability:'Duelo'});
  else {const miss=noHit(a,t,'duel-miss',{roll});e.hits.push(miss);e.timeline.push(miss);const response=G.dealCharacterDamage(s,t,a,t.damage,{ability:'Duelo perdido',kind:'reaction'});e.reactions.push(response);e.timeline.push(response);const more=G.resolveAttackResponses(s,a,t,miss);e.reactions.push(...more);e.timeline.push(...more);}
 }else if(type==='paralyzingKick'&&mode==='stun'){
  const roll=G.rollDie?G.rollDie(s,{side:a.team,best:1,reason:'Golpe paralisante'}):s.roll(6);e.rolls.push({roll});s.log.push(a.name+' · golpe paralisante · d6='+roll+' (1–3 acerta)');
  if(roll<=3){const hit=strike(t,G.roundUpToFive((G.attackBaseDamage(a,t)+extra)*(G.isPresence(t)?1:1.3)));if(G.hitLanded(hit)&&alive(t)&&!G.isPresence(t)){t.paralysis=2;t.paralysisStarted=s.turn;s.log.push(t.name+' paralisado por duas ações');}}
  else {const miss=noHit(a,t,'miss',{roll});e.hits.push(miss);e.timeline.push(miss);const responses=G.resolveAttackResponses(s,a,t,miss);e.reactions.push(...responses);e.timeline.push(...responses);}
 }else if(area){
  const damage=G.roundUpToFive((a.damage+extra)/targets.length),hits=targets.map(target=>G.applyCharacterHit(s,a,target,damage,{area:true,ability:'Swarm'}));
  e.hits.push(...hits);e.timeline.push(...hits);targets.forEach((target,i)=>{const r=G.resolveAttackResponses(s,a,target,hits[i],{area:true});e.reactions.push(...r);e.timeline.push(...r);});s.log.push('Swarm · '+(a.damage+extra)+' dividido entre '+targets.length+' · '+damage+' por alvo antes das defesas');
 }else if(type==='petrify'&&t.petrifiedBy===a.uid){strike(t,0,{instant:true,direct:true,ability:'Execução da petrificação'});}
 else{
  const neighbors=type==='missile'?s.units.filter(x=>alive(x)&&x.team===t.team&&x.row===t.row&&same(a,x)).sort((a,b)=>a.slot-b.slot):[],index=neighbors.indexOf(t),adjacent=[neighbors[index-1],neighbors[index+1]].filter(Boolean);
  const critical=G.criticalDamage(s,a,G.attackBaseDamage(a,t)*(type==='hunt'&&a.huntUid===t.uid&&!G.isPresence(t)?3:1)+extra);e.critical=critical;
  const hit=strike(t,critical.damage);
  if(type==='flames'&&G.hitLanded(hit)&&alive(t))addBurn(s,a,t,65,5,'attack');
  if(type==='missile'&&G.hitLanded(hit)&&(hit.amount??hit.damage)>0){const splash=G.roundUpToFive((hit.amount??hit.damage)*.2);for(const target of adjacent)if(alive(target))strike(target,splash,{area:true,ability:'Explosão do míssil'});s.log.push('Míssil · dano recebido pelo principal '+(hit.amount??hit.damage)+' · vizinhos recebem '+splash+' antes das defesas');}
 }
 e.damage=e.hits.reduce((n,h)=>n+h.damage,0);if(e.reactions.length)e.reaction=e.reactions[0];G.finishResolvedAction(s);return{ok:true,damage:e.damage,hits:e.hits,reactions:e.reactions};
};
G.officialPreviewDamage=(s,a,mana,target,mode)=>{
 const type=ability(a);if(!activeAttacks.includes(type))return null;
 if(G.isPresence(target)&&(type==='swarm'&&mode==='area'||['duelist','hypnosis','deathBook'].includes(type)))return 0;
 let raw=G.attackBaseDamage(a,target)+(G.attackBonusFor?G.attackBonusFor(s,a.team):a.team==='player'?s.support.nextAttackBonus:0)+mana*G.CONFIG.manaDamagePerPoint;
 if(type==='paralyzingKick'&&mode==='stun'&&!G.isPresence(target))raw*=1.3;
 if(type==='swarm'&&mode==='area')raw/=Math.max(1,G.attackTargets(s,a).length);
 if(type==='hunt'&&target?.uid===a.huntUid&&!G.isPresence(target))raw+=a.damage*2;
 if(type==='duelist')raw=target&&rank(target)<=rank(a)?0:200;
 if(type==='hypnosis')raw=90;
 raw=G.roundUpToFive(raw);return target?G.damageInfo(target,raw,{ignoreMainAbilities:G.isPresence(a),kind:type==='hypnosis'?'hypnosis':undefined}).damage:raw;
};
const oldImpacts=G.eventImpacts;
G.eventImpacts=e=>e?.timeline?[...e.timeline,...(e.ticks||[])]:oldImpacts(e);
// O livro usa o mesmo caminho de dano e proteção que os demais efeitos.
G.performBookAttack=(s,uid)=>{
 const v=G.validateActor(s,uid);if(!v.ok)return v;const a=v.actor,t=unit(s,a.bookTarget);
 if(ability(a)!=='deathBook'||G.isActionLocked(a)||a.pinnedBy||a.pinning||!G.abilityTargets(s,a).includes(t))return fail('O livro precisa de um nome acessível.');
 G.completeAction(s,a);const hit=G.dealCharacterDamage(s,a,t,200,{instant:rank(t)<rank(a),ability:'Charm',kind:'book'});G.recordBattleEvent(s,{...hit,actorUid:a.uid,actorName:a.name,book:true});s.log.push(a.name+' · Charm: '+hit.targetName+' · '+(hit.instant?'eliminação instantânea':hit.damage+' de dano'));
 G.finishResolvedAction(s);if(!alive(t))a.bookTarget=null;if(alive(a)&&!s.result&&!a.bookTarget)G.queueOfficialChoice(s,a,'deathBook','retarget');return{ok:true,instant:hit.instant,damage:hit.damage};
};
G.officialAITurn=(s,a)=>{
 const type=ability(a);
 if(type==='sleepPowder'&&!a.sleepUsed&&G.abilityTargets(s,a).length){const r=G.requestOfficialChoice(s,a.uid,type);if(r.ok)return{ok:true,pending:true};}
 if(type==='petrify'&&a.petrifyPrecision>0&&a.petrifyAttemptRound!==s.round&&!s.units.some(t=>alive(t)&&t.petrifiedBy===a.uid)&&G.abilityTargets(s,a).length){const r=G.requestOfficialChoice(s,a.uid,type);if(r.ok)return{ok:true,pending:true};}
 const cursed=G.breakCurseTargets(s,a).sort((x,y)=>y.damage-x.damage)[0];if(cursed&&cursed.hp>30&&!alive(unit(s,a.hypnosisTarget)))return G.performBreakCurse(s,a.uid,cursed.uid);
 if(type==='healingAttack'&&!G.hasHittableTarget(s,a)&&G.healingTargets(s,a).length)return G.performHealingAttack(s,a.uid,G.healingTargets(s,a)[0].uid);
 if(type==='fullHeal'&&!a.fullHealUsed&&G.healingTargets(s,a).some(t=>t.hp<=t.maxHp*.65||!G.hasHittableTarget(s,a)))return G.performFullHeal(s,a.uid);
 if(type==='hypnosis'&&alive(unit(s,a.hypnosisTarget)))return G.performHypnosisTurn(s,a.uid);
 if(type==='swarm'&&G.attackTargets(s,a).length>1)return G.performOfficialAttack(s,a.uid,null,0,'area');
 if(type==='paralyzingKick'){const t=G.AI.chooseTarget(s,a);if(t)return G.performOfficialAttack(s,a.uid,t.uid,0,t.paralysis?'normal':'stun');}
 return null;
};
})(globalThis.GOGHOS);
