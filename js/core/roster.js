// Personagens durante a partida: 5 montes por raridade, equipe (linha de frente + retaguarda), eliminação permanente,
// Daly Mãe (proteção final, 3 vidas), resolução de Daly (obter personagem) e recuperação após a Daly Mãe perder uma vida.
// O estado (battle.js → createBattleState) é a única fonte de verdade; a UI só lê e chama estas funções.
(function(G){
const fail=error=>({ok:false,error});
const SIDES=['player','enemy'];
const shuffle=(a,rng)=>{for(let i=a.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};
const who=(side,you,foe)=>side==='player'?you:foe;
const liveOf=(s,side)=>s.units.filter(u=>u.team===side&&!G.isCharacterDefeated(u));

// ---------- 5 montes de personagens (um por raridade; independentes entre si e do monte principal) ----------
// Cada carta física é uma instância {iid,id} (iid único): cópias legítimas da mesma carta não se confundem. Compartilhados pelas duas equipes (como o monte principal).
// Personagem sem raridade válida não entra em nenhum monte (não pode ser obtido por Daly nem por recuperação).
G.createCharacterPiles=(rng=Math.random)=>{
  const piles={};G.RARITIES.forEach(r=>{piles[r]=[];});let n=0;
  G.CHARACTERS.forEach(c=>{if(!piles[c.rarity])return;for(let i=0;i<(c.copies||1);i++)piles[c.rarity].push({iid:'p'+n++,id:c.id});});
  G.RARITIES.forEach(r=>shuffle(piles[r],rng));return piles;
};
G.pileCounts=s=>Object.fromEntries(G.RARITIES.map(r=>[r,s.piles[r].length]));
// Retira do monte de origem a carta do personagem inicial (sem raridade/sem cópia disponível: instância avulsa, só para equipes montadas à mão).
G.claimCharacter=(s,id)=>{
  const c=G.getCharacterById(id),p=c&&s.piles[c.rarity],i=p?p.findIndex(x=>x.id===id):-1;
  return i>=0?p.splice(i,1)[0]:{iid:'f_'+id+'_'+s.units.length,id};
};

// ---------- Equipe: linha de frente e retaguarda ----------
// Novo personagem ocupa uma das 3 vagas da frente; com a frente cheia, só Suportes podem ocupar as 2 vagas da retaguarda.
// A inclusão por medalha espera a próxima rodada; a recuperação ajusta a fila após colocar todas as cartas.
G.addCharacterToTeam=(s,side,inst)=>{
  const live=liveOf(s,side),c=G.getCharacterById(inst.id);
  let row='front';
  if(live.filter(u=>u.row==='front').length<3)row='front';
  else if(c&&c.class==='SUPPORT'&&live.filter(u=>u.row==='rear').length<2)row='rear';
  else return null;
  const u=G.makeUnit(s,side,inst,row);
  s.log.push(who(side,'Você obteve ','O adversário obteve ')+u.name+' ('+(G.RARITY_LABEL[u.rarity]||'sem raridade')+') · '+(row==='front'?'linha de frente':'retaguarda'));
  G.refreshDaly(s,side);return u;
};

// ---------- Eliminação permanente ----------
// O personagem sai da equipe e da fila de ações, vai para s.eliminated (área "Personagens Eliminados", separada dos montes e dos descartes) e NUNCA volta durante a partida.
G.eliminateUnit=(s,u)=>{
  if(!u||u.eliminated)return false; // idempotente: eliminar duas vezes não registra duas vezes
  const from=u.row;u.hp=0;u.eliminated=true;u.row=null;
  s.order=s.order.filter(id=>id!==u.uid);
  s.eliminated.push({uid:u.uid,iid:u.iid,id:u.id,name:u.name,class:u.class,team:u.team,from,round:s.round});
  s.log.push(u.name+' foi eliminado');
  G.enforceFrontLine(s,u.team); // promove alguém da retaguarda antes de qualquer outra ação
  G.refreshDaly(s,u.team);      // sem nenhum vivo → Daly Mãe exposta
  return true;
};
G.getEliminated=(s,side)=>s.eliminated.filter(e=>!side||e.team===side);

// ---------- Daly Mãe (esmeralda, a força do mundo): uma por lado, 3 vidas, independente dos personagens ----------
G.createDalyMae=()=>Object.fromEntries(SIDES.map(side=>[side,{hp:G.CONFIG.dalyMaeLives,max:G.CONFIG.dalyMaeLives,exposed:false}]));
G.hasLiveCharacters=(s,side)=>liveOf(s,side).length>0;
// Protegida enquanto houver QUALQUER personagem vivo na equipe (frente ou retaguarda). Exposta só com a equipe inteira eliminada.
G.isDalyExposed=(s,side)=>!s.result&&s.daly[side].hp>0&&!G.hasLiveCharacters(s,side);
G.refreshDaly=(s,side)=>{const d=s.daly[side],was=d.exposed;d.exposed=G.isDalyExposed(s,side);
  if(d.exposed&&!was)s.log.push(who(side,'Sua Daly Mãe está exposta!','A Daly Mãe adversária está exposta!'));
  if(!d.exposed&&was)s.log.push(who(side,'Sua Daly Mãe está protegida de novo','A Daly Mãe adversária está protegida de novo'));};
G.dalyTargetId=side=>'daly_'+side; // alvo de ataque: a Daly Mãe daquele lado

// ---------- Medalha Daly: a cor determina um dos cinco montes ----------
// O topo é o último elemento, como no monte principal (pop). Não escolhe outra carta nem sorteia outra raridade.
G.medalBlockReason=(s,side,handCard)=>{
  if(s.result)return 'Batalha encerrada.';
  if(!s.deck.hands[side]?.some(c=>c.iid===handCard?.iid))return 'A medalha não está na mão deste participante.';
  const def=G.getResetCard(handCard.id);
  if(!def||def.type!=='DALY'||!G.RARITIES.includes(def.rarity))return 'Esta carta não é uma medalha válida.';
  if(s.recovery||s.formation||s.support.pending||s.deck.pendingChoice)return 'Resolva a escolha pendente antes do resgate.';
  const pile=s.piles[def.rarity],inst=pile[pile.length-1];
  if(!inst)return 'O monte '+G.RARITY_LABEL[def.rarity]+' está vazio. Guarde a medalha ou substitua-a em uma compra futura.';
  const live=liveOf(s,side),char=G.getCharacterById(inst.id);
  if(live.filter(u=>u.row==='front').length>=3&&(char.class!=='SUPPORT'||live.filter(u=>u.row==='rear').length>=2))return 'Não há vaga válida para o personagem do topo. Libere espaço na formação.';
  return '';
};
G.resolveDalle=(s,side,handCard)=>{
  const why=G.medalBlockReason(s,side,handCard);if(why)return fail(why);
  const actor=G.getNextActor(s);if(!actor||actor.team!==side)return fail('Resgate medalhas apenas na vez da sua equipe.');
  const def=G.getResetCard(handCard.id),pile=s.piles[def.rarity],inst=pile[pile.length-1];
  const u=G.addCharacterToTeam(s,side,inst);if(!u)return fail('A formação está cheia.');
  pile.pop();
  const hand=s.deck.hands[side],hi=hand.findIndex(c=>c.iid===handCard.iid);
  hand.splice(hi,1);s.deck.discard.push({...handCard,side,reason:'medal-redeemed'});
  s.log.push(who(side,'Você resgatou ','O adversário resgatou ')+u.name+' com '+def.name+' · topo do monte '+G.RARITY_LABEL[def.rarity]);
  return{ok:true,obtained:u.uid,name:u.name,rarity:def.rarity};
};

// ---------- Recuperação: a Daly Mãe perdeu uma vida e ainda tem vida ----------
// Escolher UMA raridade: até 3 Comuns, 2 Raros ou 1 Épico. Se restarem menos cartas, recebe as restantes.
// Não mistura raridades; só vem dos montes de personagens e nunca ressuscita eliminados.
G.recoveryOptions=(s,side=s.recovery?.side||'player')=>G.CONFIG.recoveryOptions.map(o=>{
  const live=liveOf(s,side),frontSlots=Math.max(0,3-live.filter(u=>u.row==='front').length),rearSlots=Math.max(0,2-live.filter(u=>u.row==='rear').length);
  const pile=s.piles[o.rarity]||[],have=pile.length,drawCount=Math.min(o.count,have),needRear=Math.max(0,drawCount-frontSlots);
  const supportCount=(drawCount?pile.slice(-drawCount):[]).filter(inst=>G.getCharacterById(inst.id)?.class==='SUPPORT').length;
  const fits=frontSlots+Math.min(rearSlots,supportCount)>=drawCount&&needRear<=rearSlots&&supportCount>=needRear;
  return{...o,have,drawCount,available:drawCount>0&&fits};
});
G.openRecovery=(s,side)=>{
  if(s.result||s.recovery)return null;
  const options=G.recoveryOptions(s,side);
  if(!options.some(o=>o.available)){s.log.push(who(side,'Sua Daly Mãe perdeu uma vida, mas nenhuma recuperação está disponível','A Daly Mãe adversária perdeu uma vida, mas nenhuma recuperação estava disponível'));return null;}
  s.recovery={side,options,status:'open'};s.phase='recovery';
  s.log.push(who(side,'Sua Daly Mãe perdeu uma vida · escolha uma recuperação','A Daly Mãe adversária perdeu uma vida · o adversário escolhe uma recuperação'));
  return s.recovery;
};
G.performRecovery=(s,optionId)=>{
  if(s.result)return fail('Batalha encerrada.');
  const r=s.recovery;if(!r||r.status!=='open')return fail('Nenhuma recuperação disponível.'); // já processada ou em processamento: não repete
  const o=G.recoveryOptions(s,r.side).find(x=>x.id===optionId);
  if(!o)return fail('Opção de recuperação inválida.');
  if(!o.available)return fail(o.have===0?'O monte '+G.RARITY_LABEL[o.rarity]+' está vazio.':'Não há espaço na formação para essa recuperação.');
  r.status='processing';
  const pile=s.piles[o.rarity],taken=pile.slice(-o.drawCount).reverse();
  // Retira exatamente o topo. Em formações parciais, reserva as vagas traseiras para os Suportes.
  const ordered=[...taken.filter(inst=>G.getCharacterById(inst.id).class!=='SUPPORT'),...taken.filter(inst=>G.getCharacterById(inst.id).class==='SUPPORT')];
  pile.splice(pile.length-o.drawCount,o.drawCount);
  const units=ordered.map(inst=>G.addCharacterToTeam(s,r.side,inst));
  G.resumeRecoveryOrder(s,units);
  s.recovery=null;s.phase='battle';
  s.log.push(who(r.side,'Recuperação','Recuperação do adversário')+' '+o.id+': '+units.length+' personagem(ns) adicionado(s) · '+G.RARITY_LABEL[o.rarity]+(s.speedCursor===null?'':' · hierarquia continua da velocidade '+s.speedCursor));
  return{ok:true,option:o.id,side:r.side,units:units.map(u=>u.uid)};
};
})(globalThis.GOGHOS=globalThis.GOGHOS||{});
