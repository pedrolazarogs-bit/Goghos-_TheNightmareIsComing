// Habilidades próprias, escolhas de entrada e isolamento dimensional. Não há estado global entre partidas.
(function(G){
const fail=error=>({ok:false,error});
const alive=u=>u&&!G.isCharacterDefeated(u);
const sameDimension=(a,t)=>(a.duelId||null)===(t.duelId||null);
const entryTypes=['dimension','deathBook','fright'];
G.sameDimension=sameDimension;
G.damageInfo=(target,raw)=>{
  const incoming=G.roundUpToFive(raw),reduction=target?.armorReduction||0;
  // Multiplicar por 20/100 evita resíduos de ponto flutuante em 1 - 0.8.
  const damage=G.roundUpToFive(incoming*(reduction?20:100)/100);
  return{incoming,damage,blocked:incoming-damage};
};
G.attackTargets=(s,a)=>s.units.filter(t=>alive(t)&&t.team!==a.team&&sameDimension(a,t)&&(t.row==='front'||!!a.duelId));
G.abilityTargets=(s,a,type=G.getMainAbility(a)?.trigger)=>s.units.filter(t=>alive(t)&&t.team!==a.team&&(type==='dimension'?!a.duelId&&!t.duelId:sameDimension(a,t)));
G.healingTargets=(s,a)=>s.units.filter(t=>alive(t)&&t.uid!==a.uid&&t.team===a.team&&t.hp<t.maxHp&&sameDimension(a,t));
G.initializeCharacterAbility=(s,u,c)=>Object.assign(u,{abilityOnly:!!c.abilityOnly,armorReduction:G.getMainAbility(c)?.reduction||0,doubleUsed:false,duelId:null,bookTarget:null,entryQueued:false,frightResolved:false,needsDuel:false,abilityDormant:false});
G.refreshAbilityAvailability=s=>s.units.forEach(u=>{if(u.abilityOnly)u.abilityDormant=!G.abilityTargets(s,u).length;});
function reorder(s){
  const done=s.order.filter(uid=>s.acted[uid]),remaining=s.order.filter(uid=>!s.acted[uid]).map(uid=>G.getUnit(s,uid)).filter(alive);
  // O bônus de velocidade não faz um recuperado voltar a uma faixa já ultrapassada.
  const eligible=remaining.filter(u=>u.recoverySpeed==null||u.enteredRound!==s.round||u.speed<=u.recoverySpeed);
  eligible.sort((a,b)=>b.speed-a.speed||(a.team===b.team?0:a.team==='player'?-1:1)||a.slot-b.slot);
  s.order=done.concat(eligible.map(u=>u.uid));
}
function queue(s,u,type,reason){
  if(!alive(u)||s.abilityChoices.some(p=>p.actorUid===u.uid))return;
  if(type!=='fright'&&!G.abilityTargets(s,u,type).length)return;
  s.abilityChoices.push({type,actorUid:u.uid,side:u.team,reason});
  if(!s.recovery)s.phase='prebattle';
}
G.queueEntryAbility=(s,u)=>{
  if(u.entryQueued)return;u.entryQueued=true;const type=G.getMainAbility(u)?.trigger;
  if(entryTypes.includes(type))queue(s,u,type,'entry');
};
G.prepareInitialAbilities=s=>{s.units.forEach(u=>G.queueEntryAbility(s,u));G.refreshAbilityAvailability(s);if(!s.abilityChoices.length)s.openingAbilities=false;};
G.prepareActorAbility=(s,u)=>{
  if(u.pinnedBy||u.pinning)return;
  const type=G.getMainAbility(u)?.trigger;
  if(type==='dimension'&&u.needsDuel&&!u.duelId)queue(s,u,type,'turn');
  if(type==='deathBook'){
    const target=G.getUnit(s,u.bookTarget);
    if(!alive(target)||!sameDimension(u,target)){u.bookTarget=null;queue(s,u,type,'turn');}
  }
};
G.pendingCharacterAbility=s=>s.abilityChoices[0]||null;
function finishChoice(s){
  s.abilityChoices=s.abilityChoices.filter(p=>{
    const actor=G.getUnit(s,p.actorUid);if(!alive(actor))return false;
    if(p.type==='fright'||G.abilityTargets(s,actor,p.type).length)return true;
    if(p.type==='dimension')actor.needsDuel=true;
    s.log.push(actor.name+' · habilidade aguarda: não há adversário acessível nesta dimensão');return false;
  });
  G.refreshAbilityAvailability(s);reorder(s);
  if(!s.abilityChoices.length){s.phase=s.recovery?'recovery':'battle';if(s.openingAbilities){s.openingAbilities=false;s.log.push('Pré-batalha concluída · começa a hierarquia de velocidade');}}
}
G.resolveCharacterAbility=(s,actorUid,targetUid=null)=>{
  const p=G.pendingCharacterAbility(s),u=G.getUnit(s,actorUid);
  if(s.result||!p||p.actorUid!==actorUid||!alive(u))return fail('Habilidade de entrada indisponível.');
  if(s.recovery||s.formation||s.support.pending||s.deck.pendingChoice)return fail('Resolva a escolha da batalha antes da habilidade de entrada.');
  if(p.type==='fright'){
    if(u.frightResolved)return fail('O susto já foi resolvido.');
    const foes=s.units.filter(t=>alive(t)&&t.team!==u.team),results=foes.map(t=>{const roll=s.roll(6);return{uid:t.uid,name:t.name,roll,scared:roll<=2};});
    const scared=results.filter(r=>r.scared).length,bonus=scared*20,speedBonus=results.length>0&&scared===results.length?1:0;
    u.damage+=bonus;u.speed+=speedBonus;u.frightResolved=true;u.frightBonus=bonus;u.frightSpeedBonus=speedBonus;
    s.log.push(u.name+' · susto de entrada: '+results.map(r=>r.name+' d6='+r.roll+' '+(r.scared?'assustado':'resistiu')).join(' · '));
    s.log.push(u.name+' ganhou +'+bonus+' de ataque'+(speedBonus?' e +1 de velocidade':'')+' até ser eliminado');
    G.recordBattleEvent(s,{type:'fright',actorUid:u.uid,actorName:u.name,results,bonus,speedBonus,hits:[]});
  }else{
    const t=G.getUnit(s,targetUid);if(!G.abilityTargets(s,u,p.type).includes(t))return fail('Escolha um personagem adversário disponível.');
    if(p.type==='dimension'){
      // O machado não mantém um vínculo atravessando dimensões.
      for(const unit of [u,t])if(unit.pinning||unit.pinnedBy)G.releasePinLink(s,unit);
      const id='duel_'+s.duelSeq++;s.duels.push({id,sourceUid:u.uid,targetUid:t.uid,active:true});u.duelId=t.duelId=id;u.needsDuel=false;
      // Um Suporte da retaguarda participa do 1×1 sem ocupar uma quarta vaga na frente.
      if(!s.order.includes(t.uid)&&G.canAct(t)&&((p.reason==='entry'&&s.round===1)||s.speedCursor===null||t.speed<=s.speedCursor))s.order.push(t.uid);
      s.log.push('Ghost Claw · '+u.name+' levou '+t.name+' para o duelo dimensional · só os dois podem se atacar');
    }else{
      u.bookTarget=t.uid;s.log.push('Charm · '+u.name+' anotou '+t.name+' no livro');
    }
  }
  s.abilityChoices.shift();finishChoice(s);return{ok:true,type:p.type};
};
G.releaseDimension=(s,u)=>{
  const duel=s.duels.find(d=>d.active&&d.id===u.duelId);if(!duel)return;
  duel.active=false;const source=G.getUnit(s,duel.sourceUid),target=G.getUnit(s,duel.targetUid);
  for(const unit of [source,target])if(unit)unit.duelId=null;
  for(const unit of [source,target])if(alive(unit)&&G.getMainAbility(unit)?.trigger==='dimension')unit.needsDuel=true;
  const survivor=[source,target].find(alive);s.log.push('Duelo dimensional encerrado · '+(survivor?survivor.name+' voltou ao campo':'ambos foram eliminados'));
};
G.onCharacterEliminated=(s,u)=>{
  if(u.duelId)G.releaseDimension(s,u);
  s.abilityChoices=s.abilityChoices.filter(p=>p.actorUid!==u.uid);
  G.refreshAbilityAvailability(s);
};
G.hasActionTarget=(s,a)=>G.getMainAbility(a)?.trigger==='deathBook'?G.abilityTargets(s,a).length>0:G.attackTargets(s,a).length>0||(!a.duelId&&G.isDalyExposed(s,a.team==='player'?'enemy':'player'))||G.getMainAbility(a)?.trigger==='healingAttack'&&G.healingTargets(s,a).length>0;
G.performWait=(s,uid)=>{
  const v=G.validateActor(s,uid);if(!v.ok)return v;const a=v.actor;
  if(a.pinnedBy||a.pinning||G.hasActionTarget(s,a))return fail('Há uma ação disponível para este personagem.');
  G.completeAction(s,a);G.recordBattleEvent(s,{type:'wait',actorUid:a.uid,actorName:a.name,hits:[]});s.log.push(a.name+' passou a vez · não há alvo acessível nesta dimensão');G.finishResolvedAction(s);return{ok:true};
};
G.performHealingAttack=(s,uid,targetUid)=>{
  const v=G.validateActor(s,uid);if(!v.ok)return v;const a=v.actor,t=G.getUnit(s,targetUid);
  if(G.getMainAbility(a)?.trigger!=='healingAttack'||a.pinnedBy||a.pinning||G.isActionLocked?.(a))return fail('Cura por ataque indisponível.');
  if(!G.healingTargets(s,a).includes(t))return fail('Escolha outro aliado ferido na mesma dimensão.');
  const beforeHp=t.hp;t.hp=Math.min(t.maxHp,G.roundUpToFive(t.hp+a.damage));
  const healed=t.hp-beforeHp;
  G.completeAction(s,a);G.recordBattleEvent(s,{type:'heal',actorUid:a.uid,actorName:a.name,targetUid:t.uid,targetName:t.name,targetTeam:t.team,targetRow:t.row,targetSlot:t.slot,beforeHp,afterHp:t.hp,damage:0,healed});
  s.log.push(a.name+' curou '+healed+' de Vida de '+t.name+' · ação utilizada');G.finishResolvedAction(s);return{ok:true,healed};
};
G.performBookAttack=(s,uid)=>{
  const v=G.validateActor(s,uid);if(!v.ok)return v;const a=v.actor,t=G.getUnit(s,a.bookTarget);
  if(G.getMainAbility(a)?.trigger!=='deathBook'||a.pinnedBy||a.pinning)return fail('O livro está indisponível.');
  if(!G.abilityTargets(s,a).includes(t))return fail('Marque um nome disponível antes de usar o livro.');
  const beforeHp=t.hp,instant=G.RARITIES.indexOf(t.rarity)<G.RARITIES.indexOf(a.rarity),armor=G.damageInfo(t,G.getMainAbility(a).damage);
  t.hp=instant?0:G.roundUpToFive(t.hp-armor.damage);G.completeAction(s,a);
  G.recordBattleEvent(s,{type:t.hp<=0?'defeat':'hit',actorUid:a.uid,actorName:a.name,targetUid:t.uid,targetName:t.name,targetTeam:t.team,targetRow:t.row,targetSlot:t.slot,beforeHp,afterHp:t.hp,damage:beforeHp-t.hp,instant,ability:'Charm',book:true,...(!instant&&armor.blocked?{armor}: {})});
  s.log.push(a.name+' · Charm: '+(instant?t.name+' eliminado instantaneamente pelo livro':t.name+' recebeu '+armor.damage+' de dano do livro')+(armor.blocked&&!instant?' · armadura 80%':''));
  if(!alive(t))a.bookTarget=null;
  G.finishResolvedAction(s);
  if(alive(a)&&!s.result&&!a.bookTarget)queue(s,a,'deathBook','retarget');
  return{ok:true,instant,damage:s.lastEvent.damage};
};
})(globalThis.GOGHOS);
