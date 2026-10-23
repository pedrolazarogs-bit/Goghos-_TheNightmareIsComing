// Componentes visuais da arena. Só consultam o estado: não avançam rodadas nem alteram regras.
(function(G){
const safe=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
G.ARENA_ART={
  trophy:{src:'assets/arena/trophy.png',size:[2048,2048],bounds:[558,567,1540,1395]},
  back:{src:'assets/arena/card_back.png',size:[1536,2048],bounds:[267,236,1269,1812]},
  unknown:{src:'assets/arena/unknown_portrait.png',size:[2048,2048],bounds:[0,127,1945,1484]},
  daly:{src:'assets/arena/daly_mae.png',size:[2048,2048],bounds:[834,236,1214,875]}
};
// Recorta apenas na exibição, mantendo os PNGs originais intactos e suas proporções.
function artHTML(a,cls=''){
  const [x,y,right,bottom]=a.bounds,w=right-x,h=bottom-y;
  const style=`width:${a.size[0]/w*100}%;height:${a.size[1]/h*100}%;left:${-x/w*100}%;top:${-y/h*100}%`;
  return `<span class="asset-window ${cls}" style="aspect-ratio:${w}/${h}"><img src="${a.src}" style="${style}" alt="" decoding="sync"></span>`;
}
G.arenaArtHTML=(id,cls='')=>artHTML(G.ARENA_ART[id],cls);
G.CLASS_LABEL={ASSASSIN:'Assassino',SUPPORT:'Suporte',FIGHTER:'Lutador',TANK:'Tanque',DESTROYER:'Destruidor',MAGO:'Mago'};
G.CLASS_SIGIL={ASSASSIN:'✧',SUPPORT:'✚',FIGHTER:'✦',TANK:'⬟',DESTROYER:'✹',MAGO:'ϟ'};
G.actorPortraitHTML=(u,cls='')=>{
  const base=u&&(G.getCharacterById(u.id)||u);
  if(base?.portraitBanner&&(!cls.includes('stats-portrait')||!base.artLayout))return `<span class="actor-portrait illustrated banner ${cls}">${artHTML(base.portraitBanner)}</span>`;
  if(!base?.art||!base.artLayout)return `<span class="actor-portrait unillustrated ${cls}">${G.arenaArtHTML('unknown')}${base?`<i>${G.CLASS_SIGIL[base.class]||'✦'}</i>`:''}</span>`;
  const banner=base.id==='sam'&&!cls.includes('stats-portrait');
  const bounds=banner?[0,127,1945,1484]:base.artLayout.focus;
  return `<span class="actor-portrait illustrated${banner?' banner':''} ${cls}">${artHTML({src:base.art,size:base.artLayout.size,bounds})}</span>`;
};
const deckBack=()=>`<div class="pile-card" aria-hidden="true"><div class="pile-card-face">${G.arenaArtHTML('back')}</div></div>`;
G.characterPilesHTML=s=>`<section class="rarity-piles"><h3>Montes de personagens</h3><div class="rarity-display">${deckBack()}<div class="piles-grid">${G.RARITIES.map(r=>`<div class="deck-pile ${r.toLowerCase()}" style="--pile:${G.MEDAL_COLORS[r].color}" aria-label="Monte ${G.RARITY_LABEL[r]}: ${s.piles[r].length} cartas" title="${G.MEDAL_COLORS[r].name} · ${G.RARITY_LABEL[r]}"><i class="rarity-dot" aria-hidden="true"></i><strong>${G.RARITY_LABEL[r]}</strong><b>${s.piles[r].length}</b></div>`).join('')}</div></div><p>Cada cor tem seu próprio monte.</p></section>`;
G.mainPileHTML=s=>`<section class="main-deck"><div class="main-deck-copy"><h3>Monte principal <span>»</span></h3><strong>${s.deck.pile.length}<small> cartas</small></strong><p>Compra no reset</p></div><div class="deck-pile main-pile" aria-label="Monte principal: ${s.deck.pile.length} cartas">${deckBack()}</div><p class="deck-meta">Mão adversária <b>${s.deck.hands.enemy.length}/5</b><span>Descarte <b>${s.deck.discard.length}</b></span></p></section>`;
G.pilesHTML=s=>G.characterPilesHTML(s)+G.mainPileHTML(s);
// A prévia lê a fila existente; jamais chama getNextActor, que pode disparar uma compra.
G.turnPreview=(s,actor,busy=false)=>{
  const waiting=!!(s.recovery||s.formation||s.deck.pendingChoice||s.support.pending||s.abilityChoices?.length);
  const current=actor||(busy&&s.lastEvent?G.getUnit(s,s.lastEvent.actorUid):null);
  const upcoming=waiting||s.result?null:s.order.map(uid=>G.getUnit(s,uid)).find(u=>u&&G.canAct(u)&&!s.acted[u.uid]&&u.uid!==current?.uid)||null;
  const decisionSide=s.recovery?.side||s.formation?.side||s.deck.pendingChoice?.side||(s.support.pending?'player':null)||s.abilityChoices?.[0]?.side;
  return{current,upcoming,waiting,decisionSide};
};
G.turnPanelHTML=(s,actor,busy=false)=>{
  const {current,upcoming,waiting,decisionSide}=G.turnPreview(s,actor,busy);
  const preview=(u,next)=>`<div class="turn-preview ${next?'upcoming':'now'}"><div class="turn-preview-copy"><span>${next?'A seguir':'Vez de'}</span><strong>${u?safe(u.name):waiting?(next?'Aguardando':decisionSide==='enemy'?'Bot escolhendo':'Sua escolha'):next?'Novo ciclo':'Aguardando'}</strong><small>${u?`${u.team==='player'?'Você':'Adversário'} · Vel. ${u.speed}${u.pinnedBy?' · imobilizado':u.pinning?' · decidir machado':''}`:waiting?'A ordem continua após a escolha':next?'Após o reset de velocidade':''}</small></div>${G.actorPortraitHTML(u,next?'next-portrait':'current-portrait')}</div>`;
  const queue=s.order.map(uid=>{const u=G.getUnit(s,uid);return `<span class="${s.acted[uid]?'done':current?.uid===uid?'current':''}" title="${safe(u.name)} · ${u.speed} de velocidade${u.pinnedBy?' · imobilizado':u.pinning?' · mantém machado':''}"><b>${u.speed}</b> ${safe(u.name)}${u.pinnedBy?' ⛓':''}</span>`;}).join('');
  return `<section class="turn-panel">${preview(current,false)}${preview(upcoming,true)}<div class="speed-order"><h4>Hierarquia de velocidade</h4><div class="order">${queue||'<span>Aguardando a próxima rodada</span>'}</div></div></section>`;
};
G.actorInfoHTML=(s,actor,busy=false)=>{
  const {current}=G.turnPreview(s,actor,busy);
  if(!current)return `<section class="actor-info idle"><h3>Quem vai atacar</h3>${G.actorPortraitHTML(null)}<p>As informações aparecem quando a batalha retomar.</p></section>`;
  const u=current,base=G.getCharacterById(u.id);
  const ability=G.getMainAbility(u);
  const status=u.pinnedBy?'Imobilizado · não pode agir':u.pinning?'Mantendo machado · vulnerável, sem Parry':u.duelId?'Duelo dimensional · só pode atingir seu oponente':u.bookTarget?'Livro marcado: '+G.getUnit(s,u.bookTarget)?.name:u.armorReduction?'Armadura · bloqueia 80% do dano':G.getMainAbility(u)?.trigger==='doubleAttack'?'Quatro braços · '+(u.doubleUsed?'já utilizado':'disponível'):u.frightResolved?'Susto · +'+u.frightBonus+' ataque / +'+u.frightSpeedBonus+' velocidade':u.parryThreshold?'Parry · defende com 1–'+u.parryThreshold+' no d6':'';
  return `<section class="actor-info"><h3>${u.passiveOnly?'Habilidade reativa':u.pinnedBy?'Vez imobilizada':u.pinning?'Decisão do machado':'Quem vai atacar'}</h3><div class="actor-identity">${G.actorPortraitHTML(u,'stats-portrait')}<div><strong>${safe(u.name)}</strong><small>${G.CLASS_LABEL[u.class]} · ${G.RARITY_LABEL[u.rarity]}</small></div></div><div class="actor-stats"><div><img src="assets/arena/heart.png" alt=""><b>${u.hp}<small>/${u.maxHp}</small></b><span>Vida</span></div><div><img src="assets/arena/attack.png" alt=""><b>${u.passiveOnly||u.abilityOnly?'—':u.damage}</b><span>Ataque</span></div><div><i aria-hidden="true">»</i><b>${u.speed??'—'}</b><span>Velocidade</span></div><div><i aria-hidden="true">✦</i><b>${u.stamina}</b><span>Fôlego</span></div></div>${status?`<p class="actor-status">${status}</p>`:''}${u.class==='MAGO'?`<p class="actor-mana">Mana <b>${u.mana}/${u.maxMana}</b></p>`:''}${base.mainAbility?`<p class="actor-ability">${safe(base.mainAbility)} <small>${ability?safe(ability.description):'Habilidade em desenvolvimento'}</small></p>`:''}</section>`;
};
G.characterAbilityChoiceHTML=(s,selectedUid)=>{
  const p=G.pendingCharacterAbility(s);if(!p||p.side!=='player')return '';
  const u=G.getUnit(s,p.actorUid),title=p.type==='dimension'?'Duelo dimensional':p.type==='deathBook'?'Marcar nome no livro':'Susto de entrada';
  const description=p.type==='dimension'?'Escolha um adversário da frente ou retaguarda. Só ele e Penxy poderão se atacar até um deles morrer.':p.type==='deathBook'?'Escolha um adversário para marcar. O livro será usado apenas na vez de Vaglar.':'Um d6 por adversário. Resultados 1 e 2 assustam: +20 de ataque por alvo; todos assustados também dão +1 de velocidade.';
  const targets=p.type==='fright'?'':`<div class="entry-targets">${G.abilityTargets(s,u,p.type).map(t=>`<button data-ability-target="${t.uid}" aria-pressed="${selectedUid===t.uid}" class="${selectedUid===t.uid?'selected':''}">${G.cardHTML(t)}<strong>${safe(t.name)}</strong><small>${G.RARITY_LABEL[t.rarity]} · ${t.row==='rear'?'Retaguarda':'Frente'}</small></button>`).join('')}</div>`;
  return `<div class="choice-overlay"><section class="choice-dialog entry-choice" role="dialog" aria-modal="true" aria-labelledby="entry-title"><small>${p.reason==='entry'?'Pré-batalha · habilidade de entrada':'Escolha de habilidade'}</small><h3 id="entry-title">${safe(u.name)} · ${title}</h3><p>${description}</p>${targets}<button data-act="resolve-entry"${p.type!=='fright'&&!G.abilityTargets(s,u,p.type).some(t=>t.uid===selectedUid)?' disabled':''}>${p.type==='fright'?'Rolar os dados do susto':'Confirmar escolha'}</button></section></div>`;
};
})(globalThis.GOGHOS);
