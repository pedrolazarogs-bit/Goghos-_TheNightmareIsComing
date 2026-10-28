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
G.CLASS_LABEL={ASSASSIN:'Assassino',SUPPORT:'Suporte',FIGHTER:'Lutador',TANK:'Tanque',DESTROYER:'Destruidor',MAGO:'Mago',DEUS:'Deus'};
G.CLASS_SIGIL={ASSASSIN:'××',SUPPORT:'+',FIGHTER:'⚔',TANK:'ϟ',DESTROYER:'⌖',MAGO:'☾',DEUS:'MAX'};
G.actorPortraitHTML=(u,cls='')=>{
  const base=u&&(G.getCharacterById(u.id)||u);
  if(base?.portraitBanner&&(!cls.includes('stats-portrait')||!base.artLayout))return `<span class="actor-portrait illustrated banner ${cls}">${artHTML(base.portraitBanner)}</span>`;
  if(!base?.art||!base.artLayout)return `<span class="actor-portrait unillustrated ${cls}">${G.arenaArtHTML('unknown')}${base?`<i>${G.CLASS_SIGIL[base.class]||'✦'}</i>`:''}</span>`;
  const banner=base.id==='sam'&&!cls.includes('stats-portrait');
  const bounds=banner?[0,127,1945,1484]:base.artLayout.focus;
  return `<span class="actor-portrait illustrated${banner?' banner':''} ${cls}">${artHTML({src:base.art,size:base.artLayout.size,bounds})}</span>`;
};
const uiIcon=name=>name==='target'?`<svg class="fg-arena-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><circle cx="12" cy="12" r="7"/><circle cx="12" cy="12" r="2"/><path d="M12 1v5m0 12v5M1 12h5m12 0h5"/></svg>`:G.VisualShell?.artIcon?.(name)?.replace('class="toon-icon"','class="toon-icon fg-arena-icon"')||`<img class="fg-arena-icon" src="assets/visual-v0.28/icons/${({speed:'mode'})[name]||name}.svg" alt="" aria-hidden="true">`;
const deckBack=()=>`<div class="pile-card" aria-hidden="true"><div class="pile-card-face">${G.arenaArtHTML('back')}</div></div>`;
G.characterPilesHTML=s=>`<section class="rarity-piles"><h3 class="fg-panel-heading">${uiIcon('cards')}<span>Personagens <small>Montes por raridade</small></span></h3><div class="piles-grid">${G.RARITIES.map(r=>`<div class="deck-pile ${r.toLowerCase()}" style="--pile:${G.MEDAL_COLORS[r].color}" aria-label="Monte ${G.RARITY_LABEL[r]}: ${s.piles[r].length} cartas" title="${G.MEDAL_COLORS[r].name} · ${G.RARITY_LABEL[r]}"><i class="rarity-dot" aria-hidden="true"></i><strong>${G.RARITY_LABEL[r]}</strong><b>${s.piles[r].length}</b></div>`).join('')}</div></section>`;
G.mainPileHTML=s=>`<section class="main-deck"><div class="deck-pile main-pile" aria-label="Monte principal: ${s.deck.pile.length} cartas">${deckBack()}</div><div class="main-deck-copy"><h3 class="fg-panel-heading">${uiIcon('cards')}<span>Monte principal</span></h3><strong>${s.deck.pile.length}<small> cartas</small></strong><p>+1 por equipe no reset</p></div><p class="deck-meta">Mão adversária <b>${s.deck.hands.enemy.length}/5</b><span>Descarte <b>${s.deck.discard.length}</b></span></p></section>`;
G.pilesHTML=s=>G.characterPilesHTML(s)+G.mainPileHTML(s);
// A prévia lê a fila existente; jamais chama getNextActor, que pode disparar uma compra.
G.turnPreview=(s,actor,busy=false)=>{
  const waiting=!!(s.recovery||s.formation||s.deck.pendingChoice||s.support.pending||s.abilityChoices?.length);
  const current=actor||(busy&&s.lastEvent?G.getUnit(s,s.lastEvent.actorUid):null);
  const bonus=(s.supportExtra||[]).map(x=>G.getUnit(s,x.uid)).find(u=>u&&G.canAct(u)&&(busy||u.uid!==current?.uid));
  const freeCard=busy&&current&&['support','summon'].includes(s.lastEvent?.type)&&!s.acted[current.uid];
  const upcoming=waiting||s.result?null:freeCard?current:bonus||s.order.map(uid=>G.getUnit(s,uid)).find(u=>u&&G.canAct(u)&&!s.acted[u.uid]&&u.uid!==current?.uid)||null;
  const decisionSide=s.recovery?.side||s.formation?.side||s.deck.pendingChoice?.side||(s.support.pending?'player':null)||s.abilityChoices?.[0]?.side;
  return{current,upcoming,waiting,decisionSide};
};
G.turnPanelHTML=(s,actor,busy=false)=>{
  const {current,upcoming,waiting,decisionSide}=G.turnPreview(s,actor,busy);
  const preview=(u,next)=>`<div class="turn-preview ${next?'upcoming':'now'}">${G.actorPortraitHTML(u,next?'next-portrait':'current-portrait')}<div class="turn-preview-copy"><span>${next?'A seguir':waiting?'Escolha':busy?(['support','summon'].includes(s.lastEvent?.type)?'Carta em jogo':'Em ação'):u?.team==='player'?'Sua vez':'Vez do bot'}</span><strong>${u?safe(u.name):waiting?(next?'Aguardando':decisionSide==='enemy'?'Bot escolhendo':'Sua escolha'):next?'Novo ciclo':'Aguardando'}</strong><small>${u?'Vel. '+(u.speed??'—'):waiting?'A batalha espera por você':'Reset de velocidade'}</small></div></div>`;
  const queue=s.order.map(uid=>{const u=G.getUnit(s,uid);return `<span class="${s.acted[uid]?'done':current?.uid===uid?'current':''}" title="${safe(u.name)} · ${u.speed} de velocidade"><b>${u.speed??'—'}</b> ${safe(u.name)}</span>`;}).join('');
  return `<section class="turn-panel ${current?.team||''}" aria-label="Vez atual e próximo personagem">${preview(current,false)}<span class="turn-arrow" aria-hidden="true">${uiIcon('play')}</span>${preview(upcoming,true)}<details class="speed-order" data-ui-panel="order"><summary aria-label="Ver hierarquia de velocidade">${uiIcon('mode')}Ordem <span>⌄</span></summary><div class="order"><h4>Hierarquia de velocidade</h4>${queue||'<span>Próximo ciclo</span>'}</div></details></section>`;
};
G.actorInfoHTML=(s,actor,busy=false)=>{
  const {current}=G.turnPreview(s,actor,busy);
  if(!current)return `<section class="actor-info idle"><h3 class="fg-panel-heading">${uiIcon('cards')}<span>Ficha da carta</span></h3><div class="inspect-empty">✧</div><p>Toque em um personagem para ver os detalhes.</p></section>`;
  const u=current,base=G.getCharacterById(u.id),ability=G.getMainAbility(u);
  const status=[G.officialStatus?.(s,u),u.pinnedBy?'Cravado por '+G.getUnit(s,u.pinnedBy)?.name+' · sem ações ou reações':'',u.pinning?'Mantém o machado em '+G.getUnit(s,u.pinning)?.name+' · vulnerável, sem Parry':'',u.duelId?'Duelo dimensional com '+s.units.find(t=>t.uid!==u.uid&&t.duelId===u.duelId)?.name+' · combate isolado':'',u.bookTarget?'Nome no livro: '+G.getUnit(s,u.bookTarget)?.name:'',ability?.trigger==='doubleAttack'?'Quatro braços · '+(u.doubleUsed?'já utilizados':'disponíveis'):'',u.frightResolved?'Susto · +'+u.frightBonus+' ataque / +'+u.frightSpeedBonus+' velocidade':''].filter(Boolean).join(' · ');
  const tribute=[G.hasClass(u,'MAGO')?'Mana até 3 · +1 por ação':'',G.hasClass(u,'ASSASSIN')?(ability?.trigger==='fadingDodge'?'Esquiva especial: acerta com 1–'+u.hitWindow+' · Magos ignoram':ability?.trigger==='duelist'?'O duelo substitui a esquiva natural':'Esquiva quando mais rápido · até 1–'+(G.CONFIG.dodgeMaxFaces??5)+' no d6 · 6 permite o acerto'):'',u.parryThreshold?(G.isReactionBlocked(u)?'Parry indisponível durante o impedimento':'Parry: 1–'+u.parryThreshold+' no d6 · não funciona contra Destruidores'):'',G.CONFIG.classTributes&&G.hasClass(u,'TANK')?(G.tankResistanceFor(u)?'Resistência: −'+G.tankResistanceFor(u)*100+'% de dano de ataques':'Sem resistência natural'):'',G.CONFIG.classTributes&&G.hasClass(u,'DESTROYER')?'Crítico: d6 1–2 dá +25% de dano':'',G.canTransit(u)?'Pode transitar entre as linhas':''].filter(Boolean);
  return `<section class="actor-info" data-inspected="${u.uid}"><h3 class="fg-panel-heading">${uiIcon('cards')}<span>Ficha da carta</span></h3><div class="actor-identity">${G.actorPortraitHTML(u,'stats-portrait')}<div><strong>${safe(u.name)}</strong><small>${G.CLASS_LABEL[u.class]} · ${G.rarityLabel(u)}</small></div></div><div class="actor-stats fg-statboard"><div class="fg-stat-hp"><img src="assets/arena/heart.png" alt=""><b>${u.hp}<small>/${u.maxHp}</small></b><span>Vida</span></div><div class="fg-stat-attack"><img src="assets/arena/attack.png" alt=""><b>${G.getMainAbility(u)?.trigger==='maxHpStrike'?Math.round((G.getMainAbility(u).ratio??.35)*100)+'%':G.baseAttackCount(u)>1?u.damage+'×'+G.baseAttackCount(u):u.passiveOnly||u.abilityOnly||G.getMainAbility(u)?.trigger==='duelist'?'—':u.damage}</b><span>Ataque</span></div><div class="fg-stat-speed">${uiIcon('speed')}<b>${u.speed??'—'}</b><span>Velocidade</span></div><div class="fg-stat-stamina">${uiIcon('star')}<b>${u.stamina}</b><span>Fôlego</span></div></div>${G.hasClass(u,'MAGO')?`<p class="actor-mana">Mana <b>${u.mana}/${u.maxMana}</b></p>`:''}<details class="ability-details" data-ui-panel="ability"><summary><span>${uiIcon('star')} ${safe(base.mainAbility||'Tributos')}</span><b>⌄</b></summary><div>${base.mainAbility?`<p class="actor-ability">${ability?safe(ability.description):'Habilidade indisponível enquanto durar este efeito.'}</p>`:''}${tribute.map(t=>'<p class="actor-tribute">'+safe(t)+'</p>').join('')}${status?'<p class="actor-status">'+safe(status)+'</p>':''}</div></details></section>`;
};
G.characterAbilityChoiceHTML=(s,selectedUid)=>{
  const p=G.pendingCharacterAbility(s);if(!p||p.side!=='player')return '';
  const u=G.getUnit(s,p.actorUid),copy={
    dimension:['Duelo dimensional','Escolha um adversário da frente ou retaguarda. Striker não pode ser escolhido enquanto sua proteção estiver ativa e Penxy for mais rápido. Só o alvo escolhido e Penxy poderão se atacar até um morrer.'],
    deathBook:['Marcar nome no livro','Escolha um adversário. O livro será usado apenas na vez de Vaglar.'],
    fright:['Susto de entrada','Um d6 por adversário. 1 e 2 assustam: +20 de ataque por alvo; todos assustados dão +1 de velocidade.'],
    hypnosis:['Hipnose','Escolha quem ficará sem atacar e sem reações. Burn também não ataca. Na vez de Burn, confirme manter a hipnose para causar 90 ao alvo atual.'],
    starGift:['Conceder estrela','Uma única vez: +150 de Vida máxima e atual, +50 de dano e +1 de velocidade. Pode escolher a própria Unicorn.'],
    guardian:['Escolher protegido','Escolha um aliado fixo: Z-Zus recebe o dano direcionado e as eliminações instantâneas em seu lugar. Dano em área atinge o aliado normalmente.'],
    friendship:['Escolher melhor amigo','Karma revida contra quem atacar esse aliado, mesmo se ele defender, esquivar ou morrer. O atacante pode defender ou esquivar do revide.'],
    petrify:['Petrificação','Apenas raridade igual ou inferior. Acerta com 1–'+u.petrifyPrecision+' no d6. Cada falha reduz a precisão. Um aliado liberta o alvo com um ataque de 30.'+(p.reason==='entry'?' A execução fica disponível quando chegar a próxima vez de Rayvilin.':' A tentativa permite um ataque normal nesta vez. A execução fica disponível somente na próxima vez de Rayvilin.')],
    sleepPowder:['Pó mágico','Uso único, sem gastar a ação: o alvo dorme e tenta acordar com 1 ou 2 no d6 em cada vez dele.']
  }[p.type]||['Habilidade','Escolha um alvo.'];
  const targets=p.type==='fright'?'':`<div class="entry-targets">${G.abilityTargets(s,u,p.type).map(t=>`<button data-ability-target="${t.uid}" aria-pressed="${selectedUid===t.uid}" class="${selectedUid===t.uid?'selected':''}">${G.cardHTML(t)}<strong>${safe(t.name)}</strong><small>${G.rarityLabel(t)} · ${t.row==='rear'?'Retaguarda':'Frente'}</small></button>`).join('')}</div>`;
  return `<div class="choice-overlay"><section class="choice-dialog entry-choice" role="dialog" aria-modal="true" aria-labelledby="entry-title"><small>${p.reason==='entry'?'Pré-batalha · habilidade de entrada':'Escolha de habilidade'}</small><h3 id="entry-title">${safe(u.name)} · ${copy[0]}</h3><p>${copy[1]}</p>${targets}<button data-act="resolve-entry"${p.type!=='fright'&&!G.abilityTargets(s,u,p.type).some(t=>t.uid===selectedUid)?' disabled':''}>${p.type==='fright'?'Rolar os dados do susto':p.type==='petrify'?'Tentar petrificar · d6':'Confirmar escolha'}</button>${p.reason==='turn'&&['hypnosis','petrify','sleepPowder'].includes(p.type)?'<button data-act="cancel-entry">Voltar sem usar</button>':''}</section></div>`;
};
// Command view: previews and grouping only; never asks the core to advance a turn.
G.commandActionKind=act=>act.startsWith('power-')||['mode-pin','mode-heal','mode-double','mode-stun','mode-area','mode-break','full-heal'].includes(act)?'ability':['attack','mode-normal','hypnosis-keep','pin-keep','pin-release','mana+','mana-','wait','move','status-turn','pinned-wait','idle-cycle'].includes(act)?'shared':'attack';
G.commandActionsHTML=html=>String(html||'').replace(/<button\b([^>]*data-act="([^"]+)"[^>]*)>/g,(_,attrs,act)=>'<button data-command-kind="'+G.commandActionKind(act)+'"'+attrs+'>');
G.commandTabsHTML=(tab,count=0)=>`<div class="command-tabs" role="tablist" aria-label="Tipo de ação">${[['attack','Ataque','attack'],['ability','Habilidade','star'],['support','Apoio','hand']].map(([id,label,icon])=>`<button role="tab" tabindex="${tab===id?0:-1}" aria-controls="command-action-panel" aria-selected="${tab===id}" data-act="command-tab-${id}" class="command-tab ${tab===id?'selected':''}">${uiIcon(icon)}<span>${label}</span>${id==='support'?'<b>'+count+'</b>':''}</button>`).join('')}</div>`;
G.commandRelations=(s,u)=>{
 if(!u)return[];
 const rel=[],alive=x=>x&&!G.isCharacterDefeated(x),add=(type,text)=>rel.push({type,text});
 const hunter=s.units.find(x=>alive(x)&&x.huntUid===u.uid);if(hunter)add('hunt','Caça de '+hunter.name+' · dano ×3');
 const book=s.units.find(x=>alive(x)&&x.bookTarget===u.uid);if(book)add('book','Marcado por '+book.name);
 if(u.guardianUid&&alive(G.getUnit(s,u.guardianUid)))add('guardian','Protegido por '+G.getUnit(s,u.guardianUid).name);
 const friend=s.units.find(x=>alive(x)&&x.friendUid===u.uid);if(friend)add('friend','Melhor amigo de '+friend.name);
 if(u.pinnedBy)add('pin','Cravado por '+(G.getUnit(s,u.pinnedBy)?.name||'John'));
 if(u.pinning)add('pin','Machado em '+(G.getUnit(s,u.pinning)?.name||'oponente'));
 if(u.hypnotizedBy)add('hypnosis','Hipnotizado por '+(G.getUnit(s,u.hypnotizedBy)?.name||'Burn'));
 if(u.petrifiedBy)add('stone','Petrificado por '+(G.getUnit(s,u.petrifiedBy)?.name||'Rayvilin'));
 if(u.duelId){const rival=s.units.find(x=>x.uid!==u.uid&&x.duelId===u.duelId);add('dimension','Duelo com '+(rival?.name||'Penxy'));}
 const badges=G.unitBadges?.(s,u)||[];for(const badge of badges)if(!rel.some(r=>r.text.toLowerCase().includes(badge.toLowerCase())))add('status',badge);
 return rel;
};
G.commandAbilityIconHTML=u=>{
 const base=u&&(G.getCharacterById(u.id)||u);if(!base)return uiIcon('star');
 if(base.abilityArt)return `<img class="command-power-image" src="${base.abilityArt}" alt="">`;
 if(base.cardBase?.src)return `<span class="command-power-image">${artHTML({src:base.cardBase.src,size:[1536,2048],bounds:[875,1100,1285,1510]})}</span>`;
 return uiIcon('star');
};
G.commandScoreHTML=s=>`<div class="command-score" aria-label="Vidas das Daly Mãe">${['player','enemy'].map(side=>`<span class="${side}" aria-label="${side==='player'?'Sua Daly Mãe':'Daly Mãe adversária'}: ${s.daly[side].hp}/${s.daly[side].max} vidas"><small>${side==='player'?'Você':'Bot'}</small><strong>${Array.from({length:s.daly[side].max},(_,i)=>'<img src="assets/arena/heart.png" alt="" class="'+(i<s.daly[side].hp?'':'lost')+'">').join('')}</strong><b>${s.daly[side].hp}/${s.daly[side].max}</b></span>`).join('')}</div>`;
G.commandFocusHTML=(s,actor,target,o={})=>{
 const preview=(u,role)=>{
  const label=role==='actor'?(o.busy?'Em ação':u?.team==='enemy'?'Vez do adversário':'Personagem da vez'):o.mode==='heal'?'Aliado escolhido':'Alvo escolhido';
  if(!u)return `<article class="command-card ${role} empty-focus"${o.daly&&role==='target'?' data-focus-daly="'+(o.dalySide||'enemy')+'"':''}><small class="command-role">${role==='actor'?'A batalha aguarda':o.daly?'Daly Mãe exposta':o.area?'Ataque em área':'Escolha um alvo'}</small><div class="command-focus-placeholder">${o.daly&&o.event?'<span class="combat-float command-daly-impact">−1 VIDA</span>':''}${o.daly&&role==='target'?G.arenaArtHTML('daly'):uiIcon(role==='actor'?'cards':o.area?'attack':'target')}<p>${o.daly?'Cada golpe retira 1 vida':o.area?'Adversários da frente':role==='actor'?'Resolva a escolha para continuar':'Escolha um alvo ou toque em uma carta em Campo'}</p>${o.selectable&&role==='target'?'<button class="command-target-open" data-act="command-targets">Escolher alvo</button>':''}</div><div class="command-vitals placeholder-vitals" aria-hidden="true"></div><div class="command-relations"></div></article>`;
  const relations=G.commandRelations(s,u),base=G.getCharacterById(u.id)||u,allImpacts=G.eventImpacts(o.event),hits=(o.event?.sequence?allImpacts:G.compactImpacts(o.event)).filter(h=>h.targetUid===u.uid);
  const floating=hits.map((h,i)=>`<span class="combat-float command-focus-impact ${o.event?.sequence?'sequence-float ':''}${h.type}${h.kind==='reaction'?' reaction':''}" style="top:${o.event?.sequence?48:Math.min(75,35+i*18)}%;--impact-delay:${allImpacts.indexOf(h)*G.CONFIG.pacing.feedback*.4}ms;--impact-time:${Math.max(1,G.CONFIG.pacing.feedback*.4)}ms">${G.impactText(h)}${h.strike?'<small>Golpe '+h.strike+'/'+h.strikeCount+'</small>':h.kind==='reaction'?'<small>Revide</small>':''}</span>`).join('');
  return `<article class="command-card ${role} ${u.team}" data-focus-unit="${u.uid}" data-rarity="${u.rarity||'GOD'}">${role==='target'&&o.selectable?'<button class="command-target-open" data-act="command-targets">Alvo · trocar</button>':'<small class="command-role">'+label+'</small>'}<button class="command-focus-art" data-act="command-inspect-${role}" title="Ver ficha de ${safe(u.name)}" aria-label="Ver ficha de ${safe(u.name)}">${G.cardHTML(u)}${floating}</button><div class="command-vitals"><img src="assets/arena/heart.png" alt="Vida"><i><span style="width:${Math.max(0,Math.min(100,u.hp/u.maxHp*100))}%"></span></i><strong>${u.hp}<small>/${u.maxHp}</small></strong></div><div class="command-card-identity"><b>${safe(u.name)}</b><small>${G.CLASS_LABEL[u.class]} · ${G.rarityLabel(u)}</small></div><div class="command-relations">${relations.slice(0,2).map(r=>'<span data-relation="'+r.type+'">'+uiIcon(r.type==='hunt'?'target':r.type==='guardian'?'shield':'star')+safe(r.text)+'</span>').join('')}${relations.length>2?'<button data-act="command-inspect-'+role+'">+'+(relations.length-2)+' efeitos · ver ficha</button>':''}</div></article>`;
 };
 return `<div class="command-focus" aria-label="Interação atual">${preview(actor,'actor')}<div class="command-versus" aria-hidden="true">${o.mode==='heal'?uiIcon('heal'):o.busy?uiIcon('attack'):G.commandAbilityIconHTML(actor)}</div>${preview(target,'target')}</div>`;
};
})(globalThis.GOGHOS);
