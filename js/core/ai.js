// IA simples (não usa a troca voluntária de Suportes nesta versão): ataca o adversário vivo da linha de frente com menor Vida atual (empate: menor slot); se não houver, a Daly Mãe exposta. Usa as mesmas regras do jogador.
(function(G){
function chooseTarget(s,actor){
  return G.attackTargets(s,actor).sort((a,b)=>a.hp-b.hp||a.slot-b.slot)[0]||null;
}
// Mago: gasta o mínimo de mana que elimina o alvo; se não der, gasta 1 (se tiver).
function manaPlan(s,a,t){if(!G.hasClass(a,'MAGO')||a.mana<=0)return 0;const per=G.CONFIG.manaDamagePerPoint,need=Math.max(0,Math.ceil((t.hp-a.damage)/per));return need<=a.mana?need:1;}
// Sem alvo vivo na linha de frente adversária, a Daly Mãe exposta é o alvo (o ataque normal a atinge; não precisa de ação especial).
function redeemMedals(s,side){
  const obtained=[];
  for(const inst of [...s.deck.hands[side]]){
    if(G.getResetCard(inst.id).type!=='DALY')continue;
    const r=G.resolveDalle(s,side,inst);if(r.ok)obtained.push(r);
  }
  return obtained;
}
function takeTurn(s,actor){
  if(G.canSummonFromHand(s,actor.team)&&G.canUseHand(s,actor.team))return{...G.performSummon(s,actor.team),supportPlayed:true};
  const played=G.chooseAISupport?.(s,actor.team);if(played)return{...played,pending:!!s.abilityChoices.length,supportPlayed:true};
  redeemMedals(s,actor.team);
  const readyAfterCards=G.getNextActor(s);
  if(s.abilityChoices.length||readyAfterCards?.uid!==actor.uid)return{ok:true,pending:true};
  if(G.isActionLocked?.(actor)){
    const r=G.performStatusTurn(s,actor.uid);if(!r.ok||r.spent)return r;
    // Acordar pode liberar uma escolha de habilidade antes do ataque, como uma nova hipnose.
    const ready=G.getNextActor(s);if(s.result)return{ok:true};
    if(s.abilityChoices.length||ready?.uid!==actor.uid)return{ok:true,pending:true};
  }
  if(actor.pinnedBy)return G.performPinnedTurn(s,actor.uid);
  if(actor.pinning){
    const target=G.getUnit(s,actor.pinning),progressing=actor.pinLastKeptHp==null||target.hp<actor.pinLastKeptHp;
    if(actor.hp>=80&&progressing){actor.pinLastKeptHp=target.hp;return G.keepPin(s,actor.uid);}
    G.withdrawPin(s,actor.uid); // Evita manter para sempre um alvo que está recuperando todo o dano.
  }
  const official=G.officialAITurn?.(s,actor);if(official)return official;
  if(G.getMainAbility(actor)?.trigger==='deathBook')return G.performBookAttack(s,actor.uid);
  if(G.getMainAbility(actor)?.trigger==='healingAttack'){
    const ally=G.healingTargets(s,actor).filter(u=>u.hp<=u.maxHp/2).sort((a,b)=>a.hp-b.hp)[0];
    if(ally)return G.performHealingAttack(s,actor.uid,ally.uid);
  }
  if(!G.hasActionTarget(s,actor))return G.performWait(s,actor.uid);
  if(G.getMainAbility(actor)?.trigger==='areaAttack')return G.performAreaAttack(s,actor.uid,actor.mana>0?1:0);
  const t=chooseTarget(s,actor);if(t)return G.performBasicAttack(s,actor.uid,t.uid,manaPlan(s,actor,t),G.getMainAbility(actor)?.trigger==='pinAttack'&&t.hp>actor.damage?'pin':G.getMainAbility(actor)?.trigger==='doubleAttack'&&!actor.doubleUsed?'double':'normal');
  const foe=actor.team==='player'?'enemy':'player';
  return G.isDalyExposed(s,foe)?G.performBasicAttack(s,actor.uid,G.dalyTargetId(foe),0):{ok:false,error:'Sem alvo.'};}
// Recuperação do bot: escolhe ao acaso entre as opções que podem ser completadas (não há lógica de decisão própria no projeto).
function resolveRecovery(s){const r=s.recovery;if(!r)return{ok:false,error:'Nenhuma recuperação pendente.'};
  const av=G.recoveryOptions(s).filter(o=>o.available);if(!av.length)return{ok:false,error:'Nenhuma opção disponível.'};
  return G.performRecovery(s,av[Math.floor(s.rng()*av.length)].id);}
function resolveFormation(s){return s.formation?G.resolveFrontLine(s,[...s.formation.candidates]):{ok:false,error:'Nenhum avanço pendente.'};}
function resolveCharacterAbility(s){const p=G.pendingCharacterAbility(s);if(!p)return{ok:false,error:'Nenhuma habilidade pendente.'};const u=G.getUnit(s,p.actorUid),targets=G.abilityTargets(s,u,p.type).sort((a,b)=>['starGift','guardian','friendship'].includes(p.type)?b.damage-a.damage||b.hp-a.hp:a.hp-b.hp);return G.resolveCharacterAbility(s,u.uid,targets[0]?.uid);}
G.AI={chooseTarget,takeTurn,manaPlan,resolveRecovery,redeemMedals,resolveFormation,resolveCharacterAbility};
})(globalThis.GOGHOS=globalThis.GOGHOS||{});
