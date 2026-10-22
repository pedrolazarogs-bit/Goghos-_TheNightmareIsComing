// Cartas de Apoio (só o jogador usa). Regras: 1 carta por turno do jogador, na vez dele; não gasta ação nem fôlego; quantidade limitada.
// "Turno" = o intervalo até o próximo ataque (s.turn avança a cada ataque, de qualquer lado).
(function(G){
const fail=error=>({ok:false,error});
G.getSupportCard=id=>G.SUPPORT_CARDS.find(c=>c.id===id)||null;
G.defaultSupportLoadout=()=>G.SUPPORT_CARDS.slice(0,G.CONFIG.supportMax).map(c=>c.id);
G.createSupportState=ids=>{
  if(ids.length>G.CONFIG.supportMax||new Set(ids).size!==ids.length||ids.some(i=>!G.getSupportCard(i)))throw new Error('Cartas de apoio inválidas.');
  return{slots:ids.map(id=>({id,uses:G.getSupportCard(id).uses,maxUses:G.getSupportCard(id).uses})),usedTurn:0,nextAttackBonus:0,brisa:0,pending:null};
};
G.takeAttackBonus=s=>{const b=s.support.nextAttackBonus;s.support.nextAttackBonus=0;return b;};
// Motivo pelo qual a carta não pode ser usada agora ('' = pode).
function supportBlockReason(s,idx){
  const sp=s.support,sl=sp.slots[idx];
  if(s.result)return 'Batalha encerrada.';
  if(!sl)return 'Carta inexistente.';
  if(s.recovery)return 'Escolha a recuperação antes de continuar.';
  if(sp.pending)return 'Resolva a Brisa antes de continuar.';
  const n=G.getNextActor(s);if(!n||n.team!=='player')return 'Cartas de apoio só podem ser usadas na sua vez.';
  if(sp.usedTurn===s.turn)return 'Você já usou uma carta de apoio neste turno.';
  if(sl.uses<=0)return 'Carta esgotada.';
  const d=G.getSupportCard(sl.id);
  if(d.effect==='onAllyDefeatedHeal'&&sp.brisa)return 'Brisa já está ativa.';
  if(d.effect==='heal'&&!s.units.some(u=>u.team==='player'&&u.hp>0&&u.hp<u.maxHp))return 'Nenhum aliado precisa de cura.';
  return '';
}
function performSupport(s,idx,targetUid){
  const why=supportBlockReason(s,idx);if(why)return fail(why);
  const sp=s.support,slot=sp.slots[idx],d=G.getSupportCard(slot.id);
  if(d.effect==='heal'){
    const t=G.getUnit(s,targetUid);
    if(!t||t.team!=='player')return fail('Escolha um aliado.');
    if(t.hp<=0)return fail('Aliado derrotado não pode ser curado.');
    if(t.hp>=t.maxHp)return fail('Esse aliado já está com a Vida cheia.');
    const b=t.hp;t.hp=Math.min(t.maxHp,t.hp+d.value);s.log.push('Apoio · '+d.name+': '+t.name+' recuperou '+(t.hp-b)+' de Vida');
  }else if(d.effect==='nextAttackBonus'){sp.nextAttackBonus+=d.value;s.log.push('Apoio · '+d.name+': o próximo ataque causa +'+d.value+' de dano');}
  else if(d.effect==='onAllyDefeatedHeal'){sp.brisa=d.value;s.log.push('Apoio · '+d.name+': ativa até o fim da batalha');}
  slot.uses--;sp.usedTurn=s.turn;return{ok:true};
}
// Usa uma carta de Apoio que foi comprada do monte principal e está na mão.
G.performHandSupport=(s,iid,targetUid)=>{
  if(s.result)return fail('Batalha encerrada.');
  if(s.recovery)return fail('Escolha a recuperação antes de continuar.');
  if(s.deck.pendingChoice)return fail('Resolva a substituição da mão antes de continuar.');
  if(s.support.pending)return fail('Resolva a Brisa antes de continuar.');
  const actor=G.getNextActor(s);if(!actor||actor.team!=='player')return fail('Cartas de Apoio só podem ser usadas na sua vez.');
  if(s.support.usedTurn===s.turn)return fail('Você já usou uma carta de apoio neste turno.');
  const hand=s.deck.hands.player,i=hand.findIndex(c=>c.iid===iid),inst=hand[i];if(i<0)return fail('A carta não está na sua mão.');
  const rd=G.getResetCard(inst.id),d=G.getSupportCard(inst.id);if(!rd||rd.type!=='SUPPORT'||!d)return fail('Esta carta não é uma carta de Apoio utilizável.');
  if(d.effect==='heal'){
    const t=G.getUnit(s,targetUid);if(!t||t.team!=='player')return fail('Escolha um aliado.');
    if(t.hp<=0)return fail('Aliado derrotado não pode ser curado.');if(t.hp>=t.maxHp)return fail('Esse aliado já está com a Vida cheia.');
    const b=t.hp;t.hp=Math.min(t.maxHp,t.hp+d.value);s.log.push('CURA · '+d.name+': '+t.name+' recuperou +'+(t.hp-b)+' de Vida');
  }else if(d.effect==='nextAttackBonus'){s.support.nextAttackBonus+=d.value;s.log.push('BÔNUS · '+d.name+': próximo ataque causa +'+d.value+' de dano');}
  else if(d.effect==='onAllyDefeatedHeal'){if(s.support.brisa)return fail('Brisa já está ativa.');s.support.brisa=d.value;s.log.push('BRISA · efeito ativo: quando um aliado for eliminado, outro pode curar +'+d.value+' de Vida');}
  else return fail('Efeito de Apoio ainda não implementado.');
  const used=hand.splice(i,1)[0];s.deck.discard.push({...used,side:'player',reason:'played-support'});s.support.usedTurn=s.turn;return{ok:true};
};

// Brisa ativa: ao eliminar um aliado, abre uma escolha (cura em outro aliado ferido, ou dispensar).
function onAllyDefeated(s,t){
  const sp=s.support;if(t.team!=='player'||!sp.brisa)return;
  const c=s.units.filter(u=>u.team==='player'&&u.hp>0&&u.hp<u.maxHp).map(u=>u.uid);
  if(c.length)sp.pending={type:'brisa',value:sp.brisa,candidates:c};
  else s.log.push('Brisa: nenhum aliado ferido para curar');
}
function resolveBrisa(s,targetUid){
  const p=s.support.pending;if(!p)return fail('Nada a resolver.');
  if(targetUid===null){s.support.pending=null;s.log.push('Brisa: cura dispensada');return{ok:true};}
  if(!p.candidates.includes(targetUid))return fail('Escolha um aliado ferido.');
  const u=G.getUnit(s,targetUid),b=u.hp;u.hp=Math.min(u.maxHp,u.hp+p.value);s.support.pending=null;
  s.log.push('Brisa: '+u.name+' recuperou '+(u.hp-b)+' de Vida');return{ok:true};
}
Object.assign(G,{supportBlockReason,performSupport,onAllyDefeated,resolveBrisa});
})(globalThis.GOGHOS);
