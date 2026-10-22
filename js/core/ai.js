// IA simples (não usa a troca voluntária de Suportes nesta versão): ataca o adversário vivo da linha de frente com menor Vida atual (empate: menor slot); se não houver, a Daly Mãe exposta. Usa as mesmas regras do jogador.
(function(G){
function chooseTarget(s,actor){
  return s.units.filter(u=>u.team!==actor.team&&G.isTargetable(u)).sort((a,b)=>a.hp-b.hp||a.slot-b.slot)[0]||null;
}
// Mago: gasta o mínimo de mana que elimina o alvo; se não der, gasta 1 (se tiver).
function manaPlan(s,a,t){if(a.class!=='MAGO'||a.mana<=0)return 0;const per=G.CONFIG.manaDamagePerPoint,need=Math.max(0,Math.ceil((t.hp-a.damage)/per));return need<=a.mana?need:1;}
// Sem alvo vivo na linha de frente adversária, a Daly Mãe exposta é o alvo (o ataque normal a atinge; não precisa de ação especial).
function redeemMedals(s,side){
  const obtained=[];
  for(const inst of [...s.deck.hands[side]]){
    if(G.getResetCard(inst.id).type!=='DALY')continue;
    const r=G.resolveDalle(s,side,inst);if(r.ok)obtained.push(r);
  }
  return obtained;
}
function takeTurn(s,actor){redeemMedals(s,actor.team);const t=chooseTarget(s,actor);if(t)return G.performBasicAttack(s,actor.uid,t.uid,manaPlan(s,actor,t));
  const foe=actor.team==='player'?'enemy':'player';
  return G.isDalyExposed(s,foe)?G.performBasicAttack(s,actor.uid,G.dalyTargetId(foe),0):{ok:false,error:'Sem alvo.'};}
// Recuperação do bot: escolhe ao acaso entre as opções que podem ser completadas (não há lógica de decisão própria no projeto).
function resolveRecovery(s){const r=s.recovery;if(!r)return{ok:false,error:'Nenhuma recuperação pendente.'};
  const av=G.recoveryOptions(s).filter(o=>o.available);if(!av.length)return{ok:false,error:'Nenhuma opção disponível.'};
  return G.performRecovery(s,av[Math.floor(s.rng()*av.length)].id);}
function resolveFormation(s){return s.formation?G.resolveFrontLine(s,[...s.formation.candidates]):{ok:false,error:'Nenhum avanço pendente.'};}
G.AI={chooseTarget,takeTurn,manaPlan,resolveRecovery,redeemMedals,resolveFormation};
})(globalThis.GOGHOS=globalThis.GOGHOS||{});
