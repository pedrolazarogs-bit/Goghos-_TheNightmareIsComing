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
// Não dá ataque extra nem muda a ordem da rodada (age a partir da rodada seguinte).
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

// ---------- Daly: obter um personagem durante a partida ----------
// A cor/tipo da Daly define QUEM é elegível; a raridade sai do sorteio ponderado (G.CONFIG.dalleRarityWeights), sem depender de quantos personagens há em cada monte.
// Raridade sem elegível sai do sorteio e os pesos são recalculados. Se a carta Daly tem color, só personagens com o mesmo color; sem color, todos os disponíveis.
G.pickDalleRarity=(weights,available,rng=Math.random)=>{
  const list=available.map(r=>[r,weights[r]||0]).filter(([,w])=>w>0),total=list.reduce((a,[,w])=>a+w,0);
  if(!list.length)return null;let x=rng()*total;
  for(const [r,w] of list){if(x<w)return r;x-=w;}return list[list.length-1][0];
};
G.resolveDalle=(s,side,handCard)=>{
  if(s.result)return fail('Batalha encerrada.');
  const hand=s.deck.hands[side],hi=hand.findIndex(c=>c.iid===handCard.iid),def=G.getResetCard(handCard.id);
  if(hi<0)return fail('A Daly não está na mão deste participante.'); // já resolvida (ou nunca comprada): nunca resolve duas vezes
  if(!def||def.type!=='DALY')return fail('Não é uma carta Daly.');
  const elig=r=>s.piles[r].filter(i=>{const c=G.getCharacterById(i.id);return c&&(def.color==null||c.color===def.color);});
  const rars=G.RARITIES.filter(r=>elig(r).length);
  const rar=G.pickDalleRarity(G.CONFIG.dalleRarityWeights,rars,s.rng);
  if(!rar){if(hand.length>(s.deck.handLimit||5)){hand.splice(hi,1);s.deck.discard.push({...handCard,side,reason:'daly-no-character'});}s.log.push('Daly '+def.name+': nenhum personagem elegível disponível');return{ok:true,obtained:null,reason:'none'};}
  const cands=elig(rar),inst=cands[Math.floor(s.rng()*cands.length)];
  const teamLive=liveOf(s,side),char=G.getCharacterById(inst.id);
  const canFront=teamLive.filter(u=>u.row==='front').length<3;
  const canRear=char.class==='SUPPORT'&&teamLive.filter(u=>u.row==='rear').length<2;
  if(!canFront&&!canRear){if(hand.length>(s.deck.handLimit||5)){hand.splice(hi,1);s.deck.discard.push({...handCard,side,reason:'daly-team-full'});}s.log.push('Daly '+def.name+': equipe cheia; nenhum personagem foi adicionado');return{ok:true,obtained:null,reason:'team-full'};}
  s.piles[rar].splice(s.piles[rar].indexOf(inst),1);       // sai do monte de origem
  hand.splice(hi,1);s.deck.discard.push({...handCard,side}); // a Daly resolvida vai para o descarte de cartas (nunca para os eliminados)
  const u=G.addCharacterToTeam(s,side,inst);
  return{ok:true,obtained:u.uid,name:u.name,rarity:rar};
};

// ---------- Recuperação: a Daly Mãe perdeu uma vida e ainda tem vida ----------
// Escolher UMA raridade: até 3 Comuns, 2 Raros ou 1 Épico. Se restarem menos cartas, recebe as restantes.
// Não mistura raridades; só vem dos montes de personagens e nunca ressuscita eliminados.
function recoveryEligiblePile(s,side,rarity){
  const live=liveOf(s,side),frontSlots=Math.max(0,3-live.filter(u=>u.row==='front').length),rearSlots=Math.max(0,2-live.filter(u=>u.row==='rear').length);
  const pile=s.piles[rarity]||[];if(frontSlots>0)return pile;
  return pile.filter(inst=>rearSlots>0&&G.getCharacterById(inst.id)?.class==='SUPPORT');
}
G.recoveryOptions=(s,side=s.recovery?.side||'player')=>G.CONFIG.recoveryOptions.map(o=>{
  const live=liveOf(s,side),frontSlots=Math.max(0,3-live.filter(u=>u.row==='front').length),rearSlots=Math.max(0,2-live.filter(u=>u.row==='rear').length);
  const supportCount=(s.piles[o.rarity]||[]).filter(inst=>G.getCharacterById(inst.id)?.class==='SUPPORT').length;
  const have=recoveryEligiblePile(s,side,o.rarity).length,drawCount=Math.min(o.count,have),needRear=Math.max(0,drawCount-frontSlots);
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
  const pile=s.piles[o.rarity],live=liveOf(s,r.side),frontSlots=Math.max(0,3-live.filter(u=>u.row==='front').length),rearSlots=Math.max(0,2-live.filter(u=>u.row==='rear').length);
  const needRear=Math.max(0,o.drawCount-frontSlots),supportIdx=shuffle(pile.map((inst,i)=>G.getCharacterById(inst.id)?.class==='SUPPORT'?i:-1).filter(i=>i>=0),s.rng).slice(0,needRear);
  const chosen=new Set(supportIdx),rest=shuffle(pile.map((_,i)=>i).filter(i=>!chosen.has(i)),s.rng).slice(0,o.drawCount-supportIdx.length);
  const orderedIdx=[...rest,...supportIdx],idx=[...orderedIdx].sort((a,b)=>b-a);
  if(orderedIdx.length!==o.drawCount||needRear>rearSlots){r.status='open';return fail('Não há espaço suficiente na formação para essa recuperação.');}
  const byIndex=new Map(orderedIdx.map(i=>[i,pile[i]]));idx.forEach(i=>pile.splice(i,1));const taken=orderedIdx.map(i=>byIndex.get(i));
  const units=taken.map(inst=>G.addCharacterToTeam(s,r.side,inst)).filter(Boolean);
  s.recovery=null;s.phase='battle';
  s.log.push(who(r.side,'Recuperação','Recuperação do adversário')+' '+o.id+': '+units.length+' personagem(ns) adicionado(s) · '+G.RARITY_LABEL[o.rarity]);
  return{ok:true,option:o.id,side:r.side,units:units.map(u=>u.uid)};
};
})(globalThis.GOGHOS=globalThis.GOGHOS||{});
