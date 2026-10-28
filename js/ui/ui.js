// Interface: mostra o estado e encaminha as interações para as regras do núcleo.
(function(G){
const app=document.getElementById('app');
let dockObserver=null;
const ui={mode:'menu',state:null,sel:null,timer:null,target:null,handIid:null,healTarget:null,mana:0,attackMode:'normal',abilityTarget:null,move:false,swapPick:null,msg:'',notice:'',busy:false,paused:false,actor:null,inspectUid:null,drawer:null,readerPage:0,abilityOptions:false,abilityActor:null,hasAbilityOptions:false,panels:{history:false,ability:false,order:false},matchToken:null};
const show=html=>{G.CartoonMotion?.detach();G.ArenaFit?.detach();app.innerHTML=html;G.VisualShell?.mount?.();G.CartoonMotion?.mountInterface?.(app);G.Soundtrack?.setContext(ui.mode==='battle'?'combat':ui.mode==='result'?(ui.state?.result==='draw'?'menu':ui.state?.final?.winner==='player'?'victory':'defeat'):'menu',{paused:ui.mode==='battle'&&ui.paused});};
const btn=(act,label,disabled=false,cls='')=>{
  const short={ 'mode-normal':'Normal','mode-pin':'Cravar','mode-heal':'Curar','mode-double':'Quatro braços','mode-stun':'Paralisar','mode-area':'Em área','mode-break':'Libertar aliado','power-sleepPowder':'Pó mágico','power-petrify':'Petrificar','power-hypnosis':'Trocar alvo','full-heal':'Cura total','hypnosis-keep':'Manter · 90','pin-keep':'Manter machado','pin-release':'Soltar machado','pinned-wait':'Passar vez','wait':'Passar vez','move':ui.move?'Concluir':'Mover','attack':ui.attackMode==='heal'?'Curar':ui.attackMode==='break'?'Libertar':label==='Confirmar ataque'?'Atacar':label};
  const text=ui.mode==='battle'?(short[act]||label):label;
  const iconAct=act==='pause'&&ui.paused?'play':act==='attack'&&ui.attackMode==='heal'?'mode-heal':act;
  return `<button class="${cls}${act.startsWith('mode-')?' mode-button':''}" data-act="${act}"${disabled?' disabled':''} title="${G.escapeUI(label)}">${G.VisualShell?.actionIcon(iconAct)||''}<span>${text}</span></button>`;
};
const card=G.cardHTML;
const toTop=()=>globalThis.scrollTo?.({top:0,behavior:'instant'});
const screenIcon=name=>G.VisualShell?.artIcon?.(name)||G.VisualShell?.icon?.(name)||'';
const screenHeader=(title,kicker,picture,count='')=>`<header class="fg-screen-header">${btn('menu','Voltar ao menu',false,'fg-screen-back')}<span class="fg-screen-icon" aria-hidden="true">${screenIcon(picture)}</span><div class="fg-screen-heading"><small>${G.escapeUI(kicker)}</small><h1>${G.escapeUI(title)}</h1></div>${count?'<span class="fg-screen-count">'+count+'</span>':''}</header>`;
const characterMeta=c=>`<div class="fg-item-meta"><span>${G.rarityLabel(c)}</span><span>${G.CLASS_LABEL[c.class]}</span></div>`;
const archiveStyle=c=>`--archive-accent:${G.MEDAL_COLORS[c.rarity]?.color||'#ffe67b'}`;
const clearPick=()=>{ui.target=null;ui.handIid=null;ui.healTarget=null;ui.mana=0;ui.attackMode='normal';ui.abilityTarget=null;ui.move=false;ui.swapPick=null;ui.abilityOptions=false;};
function wipe(){G.PresentationFX?.stop();clearTimeout(ui.timer);dockObserver?.disconnect();clearPick();Object.assign(ui,{state:null,sel:null,msg:'',notice:'',busy:false,paused:false,actor:null,inspectUid:null,drawer:null,readerPage:0,abilityOptions:false,abilityActor:null,hasAbilityOptions:false,panels:{history:false,ability:false,order:false},matchToken:null});}
function syncDockHeight(){
  const arena=app.querySelector('.arena'),dock=app.querySelector('.mao');
  if(arena&&dock){const h=Math.ceil(dock.getBoundingClientRect().height+24)+'px';if(arena.style.getPropertyValue('--hand-height')!==h)arena.style.setProperty('--hand-height',h);}
}
function menu(){wipe();ui.mode='menu';G.Sanctuary?.applyCosmetics();if(G.VisualShell){show(G.VisualShell.homeHTML());toTop();return;}show(`<section class="center home"><div class="home-spark" aria-hidden="true">✦</div><div class="logo"><img src="assets/logo/logo.png" alt="GOGHOS — The Nightmare Is Coming"></div><p class="menu-description">Escolha sua equipe.<br>Proteja sua Daly Mãe.</p><div class="home-actions">${btn('play','Jogar',false,'big primary')}${btn('characters','Personagens',false,'big')}</div><details class="training-menu"><summary>Treinar e testar <span>+</span></summary><div class="training-grid">${btn('new-abilities','Personagens')}${btn('support-test','Cartas de Apoio')}${btn('divine-test','Invocação de Zeenneriam')}${btn('sark-test','Sark')}${btn('ability-test','Elétrica e John')}${btn('shop','Loja')}</div></details><p class="ver">v${G.CONFIG.version} · The Nightmare Is Coming</p></section>`);toTop();}
function characters(){
 ui.mode='characters';const roster=[...G.CHARACTERS,...G.GODS].filter(c=>c.illustrated);
 show(`<section class="collection fg-screen">${screenHeader('Personagens','Arquivo dos campeões','cards',roster.length+' cartas')}<div class="fg-archive-toolbar"><p>Conheça cada campeão e descubra sua habilidade.</p><label class="character-search">Buscar personagem <input data-character-search aria-label="Buscar personagem" placeholder="Quem você está procurando?"></label></div><div class="collection-grid">${roster.map(c=>`<article class="fg-archive-item" data-character-name="${c.name.toLowerCase()}" data-rarity="${c.rarity||'GOD'}" style="${archiveStyle(c)}"><div class="fg-card-stage">${card(c).replace('class="frame"','class="frame" loading="lazy"')}</div><div class="fg-item-copy">${characterMeta(c)}<h2>${c.name}</h2><details class="fg-ability-copy"><summary>${G.escapeUI(G.getMainAbility(c)?.name||'Habilidade')}</summary><p class="collection-ability">${G.getMainAbility(c)?.description||'Habilidade em desenvolvimento.'}</p></details></div></article>`).join('')}</div></section>`);toTop();
}
function abilityTest(ids=['eletric','john']){
 wipe();ui.mode='ability-test';show(`<section class="ability-tests fg-screen">${screenHeader('Treino de campeões','Experimente cada habilidade','mode',ids.length+' treinos')}<div class="fg-archive-toolbar"><p>Escolha um personagem para conhecer sua jogada no campo.</p><label class="character-search">Buscar personagem <input data-character-search aria-label="Buscar personagem" placeholder="Nome do personagem"></label></div><div class="ability-tests-grid">${ids.map(id=>{const c=G.getCharacterById(id);return `<article class="fg-archive-item" data-character-name="${c.name.toLowerCase()}" data-rarity="${c.rarity||'GOD'}" style="${archiveStyle(c)}"><div class="fg-card-stage">${card(c).replace('class="frame"','class="frame" loading="lazy"')}</div><div class="fg-item-copy">${characterMeta(c)}<h2>${c.name}</h2><p>${G.getMainAbility(c).description}</p>${id==='john'?'<p>Parry: dado de 6 lados, defende com 1 ou 2. Não funciona enquanto John mantém o machado cravado.</p>':''}${btn('lab-'+id,'Testar '+c.name,false,'fg-test-button')}</div></article>`;}).join('')}</div></section>`);toTop();
}
function supportTest(){
 wipe();ui.mode='support-test';show(`<section class="support-tests fg-screen">${screenHeader('Mesa de Apoios','Uma boa carta muda a jogada','hand',G.SUPPORT_CARDS.length+' cartas')}<p class="fg-screen-intro">Escolha uma carta para testar. Apoios são usados da mão, inclusive durante impedimentos.</p><div class="support-tests-grid">${G.SUPPORT_CARDS.map(c=>`<article class="fg-archive-item"><div class="fg-card-stage">${G.supportArtHTML(c)}</div><div class="fg-item-copy"><div class="fg-item-meta"><span>Apoio</span></div><h2>${c.name}</h2><p>${c.description}</p>${btn('supportlab-'+c.id,'Testar '+c.name,false,'fg-test-button')}</div></article>`).join('')}</div></section>`);toTop();
}
function sarkTest(){
 wipe();ui.mode='sark-test';const c=G.getCharacterById('sarck');
 show(`<section class="ability-lab fg-screen">${screenHeader('Steel Jaw','Treino do Sark','shield')}<div class="ability-lab-content"><div class="fg-card-stage">${card(c)}</div><article class="fg-item-copy">${G.actorPortraitHTML(c)}<h2>${c.name} · ${G.rarityLabel(c)}</h2><p>${G.CLASS_LABEL[c.class]}</p><p>${G.getMainAbility(c).description}</p><p>Sem ataque básico ou velocidade. Escolha se quer atacar o Sark ou observar a defesa dele contra um Raro, um Lendário e um Comum.</p>${btn('sark-enemy','Eu ataco o Sark')}${btn('sark-player','Sark na minha equipe')}</article></div></section>`);toTop();
}
function startMatch(){wipe();ui.mode='select';const r=G.createSelection();if(!r.ok){show(`<section><p>${r.error}</p>${btn('menu','Menu')}</section>`);return;}ui.sel=r.sel;selectionScreen();toTop();}
function selectionScreen(){
  const sel=ui.sel,turn=G.selectionTurn(sel);
  const displayed=[...sel.offered,...Object.values(sel.autoRares||{})];
  const cards=displayed.map(id=>{
    const side=sel.picks.player.includes(id)?'player':sel.picks.enemy.includes(id)?'enemy':null;
    const label=side&&Object.values(sel.autoRares||{}).includes(id)?`${side==='player'?'Você':'Bot'} · Raro sorteado`:side?`${side==='player'?'Você':'Bot'} · ${sel.picks[side].indexOf(id)+1}ª escolha`:turn==='player'?'Sua vez · escolher':turn==='enemy'?'Bot escolhendo…':'Disponível';
    return `<div class="selection-pick ${side||''}" role="button" tabindex="${turn==='player'&&!side?0:-1}" data-character="${id}" aria-label="${G.getCharacterById(id).name}: ${label}" aria-disabled="${!!side||turn!=='player'}">${card(G.getCharacterById(id),side?'sel chosen-'+side:'',label)}</div>`;
  }).join('');
  show(`<section class="selection fg-selection" aria-label="${sel.rareAuto?'Escolha um Comum; cada equipe recebe um Raro sorteado':'Escolha dois Comuns por equipe, alternando com o bot'}">${btn('menu','Voltar ao menu')}<div class="row fg-selection-stage">${cards}</div>${G.selectionDone(sel)?btn('fight','Play · começar batalha',false,'start-battle'):''}</section>`);
}
function selectAdvance(){clearTimeout(ui.timer);selectionScreen();if(G.selectionTurn(ui.sel)==='enemy')ui.timer=setTimeout(()=>{G.selectionBotPick(ui.sel);selectAdvance();},1000);}
function pickCharacter(id){if(!ui.sel||G.selectionTurn(ui.sel)!=='player')return;const r=G.selectionPick(ui.sel,'player',id);if(r.ok)selectAdvance();}
function selectedHand(){return ui.state?.deck.hands.player.find(c=>c.iid===ui.handIid)||null;}
function handDetail(mine,page=0){
  const inst=selectedHand();if(!inst)return '';
  const s=ui.state,def=G.getResetCard(inst.id);
  let detail=`<div class="hand-detail"><strong>${def.name}</strong><p>${def.description}</p>`;
  if(def.type==='DALY'){
    const why=G.medalBlockReason(s,'player',inst);
    detail+=`${why?`<p class="msg">${why}</p>`:''}${btn('redeem','Resgatar personagem '+G.RARITY_LABEL[def.rarity],!mine||!!why)}`;
  }else if(def.type==='SUPPORT'){
    const support=G.getSupportCard(def.id),targets=G.supportTargets(s,'player',support),needsTarget=support.target!=='none';
    const selected=targets.some(u=>u.uid===ui.healTarget),why=G.handSupportBlockReason(s,'player',inst,ui.healTarget);
    if(needsTarget)detail+=`<p>${support.target==='deadAlly'?'Escolha um aliado eliminado':support.target==='enemy'?'Escolha um oponente':'Escolha um aliado'}:</p><div class="support-targets">${targets.slice(page*4,page*4+4).map(u=>`<button data-support-target="${u.uid}" class="${ui.healTarget===u.uid?'on':''}">${u.name} · ${u.eliminated?'eliminado':u.hp+' de Vida'}</button>`).join('')||'<small>Nenhum alvo disponível.</small>'}</div>`;
    detail+=`${why&&(!needsTarget||selected)?'<p class="msg">'+why+'</p>':''}${btn('usehand','Usar '+def.name,!mine||!!why)}`;
  }else if(def.type==='PRIMORDIAL'){const why=G.summonBlockReason(s,'player');detail+=`<p>Fragmentos reunidos: ${G.fragmentCount(s,'player')}/3</p>${why?'<p>'+why+'</p>':''}${btn('summon','Invocar Zeenneriam',!mine||!!why)}`;}else detail+='<p>O efeito desta carta ainda está em desenvolvimento. Ela pode ser substituída quando a mão encher.</p>';
  if(!mine)detail+='<small>Você pode usar cartas na vez da sua equipe.</small>';
  return detail+'</div>';
}
function impactLabel(x,compact=false){
  if(x.type==='immune'&&x.ability==='Presence')return 'PRESENCE · IGNOROU';
  if(x.type==='heal')return '+'+x.healed+(compact?'':' DE VIDA');
  if(x.instant)return compact?'ELIMINADO':'ELIMINAÇÃO INSTANTÂNEA';
  const label={parry:'PARRY · DEFENDEU',dodge:'ESQUIVOU',miss:'ERROU', 'duel-miss':'FALHOU NO DUELO',immune:'INVENCÍVEL',oni:'ESTADO ONI'}[x.type];
  return label||'−'+(x.amount??x.damage)+(compact?'':x.type==='daly-hit'?' VIDA DA DALY MÃE':' DE VIDA');
}
function combatMessage(s){return G.eventFeedbackHTML(s,ui.busy);}
function render(actor){
  dockObserver?.disconnect();
  const scroll=app.querySelector('.arena')?.scrollTop||0,boardScroll=app.querySelector('.battle-board')?.scrollTop||0;
  const rowScroll={};app.querySelectorAll?.('[data-formation]')?.forEach(r=>{rowScroll[r.dataset.formation]=r.querySelector('.frow').scrollLeft;});
  app.querySelectorAll?.('[data-ui-panel]')?.forEach(p=>ui.panels[p.dataset.uiPanel]=p.open);
  const excludedOpen=app.querySelector('.elim')?.open||false;
  const logScroll=app.querySelector('.log-list')?.scrollTop||0;
  ui.mode='battle';const s=ui.state,choice=s.deck.pendingChoice,pd=s.support.pending;
  const entry=G.pendingCharacterAbility(s),free=!s.result&&!s.recovery&&!s.formation&&!choice&&!pd&&!entry&&!ui.busy&&!ui.paused;
  const idle=G.isIdleBattle(s),playerTurn=free&&actor?.team==='player',handUsable=free&&(playerTurn||idle),pinned=playerTurn&&actor.pinnedBy,holding=playerTurn&&actor.pinning,locked=playerTurn&&G.isActionLocked?.(actor),mine=free&&((actor?.team==='player'&&!pinned&&!holding&&!locked)||idle),mage=mine&&actor&&G.hasClass(actor,'MAGO')&&!actor.abilityOnly&&G.getMainAbility(actor)?.trigger!=='hypnosis',area=mine&&(G.getMainAbility(actor||{})?.trigger==='areaAttack'||G.getMainAbility(actor||{})?.trigger==='swarm'&&ui.attackMode==='area'),pinAttack=mine&&G.getMainAbility(actor||{})?.trigger==='pinAttack';
  ui.mana=mage?Math.min(ui.mana,actor.mana):0;
  const rearHealer=mine&&actor&&G.canHealFromRear(actor),rearAbility=mine&&actor&&G.canUseRearAbility?.(actor);
  if(ui.abilityActor!==actor?.uid&&!ui.busy){ui.abilityActor=actor?.uid;ui.abilityOptions=!!(rearHealer||rearAbility||holding||G.getMainAbility(actor||{})?.trigger==='hypnosis'&&actor?.hypnosisTarget);}
  if(rearHealer&&ui.attackMode!=='heal'){ui.attackMode='heal';ui.target=null;}
  const inst=selectedHand(),support=inst&&G.getResetCard(inst.id).type==='SUPPORT'?G.getSupportCard(inst.id):null;
  const e=ui.busy?s.lastEvent:null,B=G.getBoard(s),impacts=G.eventImpacts(e);
  const cell=u=>{
    const hits=impacts.filter(x=>x.targetUid===u.uid),supportPick=handUsable&&support&&G.supportTargets(s,'player',support).includes(u),status=hits.at(-1),acting=e?.actorUid===u.uid,heal=u.team==='player'&&u.hp>0&&u.hp<u.maxHp&&((handUsable&&support?.effect==='heal')||(mine&&ui.attackMode==='heal'&&G.healingTargets(s,actor).includes(u))||pd?.candidates.includes(u.uid));
    const cls=(actor?.uid===u.uid&&!ui.busy?'active ':'')+([ui.target,ui.healTarget,ui.swapPick].includes(u.uid)?'target ':'')+(mine&&actor&&!area&&ui.attackMode!=='heal'&&!actor.abilityOnly&&G.attackTargets(s,actor).includes(u)?'pick ':'')+(area&&G.attackTargets(s,actor).includes(u)?'area-target ':'')+(supportPick?'support-pick ':'')+(heal?'heal ':'')+(mine&&ui.attackMode==='break'&&G.breakCurseTargets(s,actor).includes(u)?'pick ':'')+(mine&&ui.move&&u.team==='player'&&G.canTransit(u)?'swp':'');
    const grouped=G.compactImpacts(e).filter(x=>x.targetUid===u.uid),badges=G.unitBadges(s,u);
    const fx=(e?.sequence?hits:grouped).map((x,i)=>`<span class="combat-float ${e?.sequence?'sequence-float ':''}${x.kind==='reaction'?'reaction ':''}${x.type}" style="${e?.sequence?'top:38%;--impact-delay:'+impacts.indexOf(x)*G.CONFIG.pacing.feedback*.4+'ms;--impact-time:'+Math.max(1,G.CONFIG.pacing.feedback*.4)+'ms':'top:'+(28+i*24)+'%'}">${G.impactText(x)}${x.strike?'<small>Golpe '+x.strike+'/'+x.strikeCount+'</small>':x.afterStrike?'<small>Revide</small>':x.count>1?'<small>'+x.count+' impactos</small>':''}</span>`).join('');
    const chosen=[ui.target,ui.healTarget].includes(u.uid),current=actor?.uid===u.uid&&!ui.busy;
    const relations=G.unitRelations(s,u),relation=(current||chosen)&&relations[0],power=current&&G.getMainAbility(u)?G.unitPowerButtonHTML(u,ui.abilityOptions):'';
    const relationHTML=relation?`<button class="unit-relation" aria-label="${G.escapeUI(relations.map(r=>r.text).join(' · '))}" data-act="unit-info" data-unit-info="${u.uid}" title="${G.escapeUI(relations.map(r=>r.text).join(' · '))}">${G.VisualShell?.icon(relation.type==='hunt'?'target':relation.type==='guardian'?'eye':'star')||''}<span>${G.escapeUI(relation.text)}</span></button>`:'';
    return `<div class="cell ${status?'event-'+status.type:''} ${acting?'event-actor':''} ${current?'is-current':''} ${chosen?'is-target':''}" data-unit="${u.uid}" role="button" tabindex="0" aria-label="${G.escapeUI(u.name)} · Vida ${u.hp}/${u.maxHp}${chosen?' · alvo selecionado':''}" aria-pressed="${chosen}">${current?'<span class="unit-turn">VEZ</span>':chosen?'<span class="unit-turn selected">ALVO</span>':''}${card(u,cls)}${power}${fx}<div class="unit-nameplate"><span class="unit-class" title="${G.CLASS_LABEL[u.class]}" aria-label="${G.CLASS_LABEL[u.class]}">${G.VisualShell?.icon(({ASSASSIN:'assassin',FIGHTER:'sword',TANK:'bolt',SUPPORT:'plus',MAGO:'moon',DESTROYER:'target',DEUS:'star'})[u.class])||''}</span><strong>${G.escapeUI(u.name)}</strong><span class="unit-speed" title="Velocidade">» ${u.speed??'—'}</span></div><div class="unit-vitals"><span><b>${u.hp}</b><small>/${u.maxHp}</small></span><i class="hp-track" aria-hidden="true"><i style="--before:${(hits[0]?.beforeHp??u.hp)/u.maxHp*100}%;width:${Math.max(0,u.hp/u.maxHp*100)}%"></i></i></div>${relationHTML}${badges.length&&!relation?'<button class="unit-status" data-act="unit-info" data-unit-info="'+u.uid+'" title="'+G.escapeUI(badges.join(' · '))+'" aria-label="'+G.escapeUI(u.name+' · '+badges.join(' · '))+'">'+(G.VisualShell?.icon('star')||'✧')+'<small>'+badges.length+'</small></button>':''}</div>`;
  };
  const row=(side,where)=>{
    const live=B[side][where],list=[...live],max=where==='front'?G.frontLimit(s,side):2;
    const ghosts=impacts.filter(x=>x.type==='defeat'&&x.targetTeam===side&&x.targetRow===where).map(x=>G.getUnit(s,x.targetUid)).filter(Boolean);
    const unique=[...new Set(ghosts)];if(unique.length){list.splice(0,list.length,...unique,...live.filter(u=>!unique.includes(u)).slice(0,max-unique.length));list.sort((a,b)=>a.slot-b.slot);}
    const caption=where==='front'?`Linha de frente · ${live.length}/${max}`:`Retaguarda · ${live.length}/2 · só Suportes`;
    return `<div class="formation-row ${where}" data-formation="${side}-${where}"><p class="lbl">${caption}</p><div class="frow">${list.map(cell).join('')}${Array.from({length:Math.max(0,max-list.length)},()=>G.emptyCardHTML('Vaga da '+(where==='front'?'linha de frente':'retaguarda'),where==='front'?'Defesa':'Suporte')).join('')}</div></div>`;
  };
  const side=t=>{
    const hit=e?.targetUid===G.dalyTargetId(t);
    return `<div class="side ${t}${G.frontLimit(s,t)>3?' recruited':''}"><h3 class="team-label">${t==='player'?'Sua equipe':'Adversário'}</h3>${row(t,'front')}${row(t,'rear')}<div class="daly-feedback ${hit?'event-daly-hit':''}">${G.dalyHTML(s,t,{pick:mine&&G.canAttackFrom(actor)&&!actor?.duelId&&!actor?.abilityOnly&&t==='enemy'&&G.isDalyExposed(s,t),target:ui.target===G.dalyTargetId(t)})}${hit?'<span class="daly-float">−1 VIDA</span>':''}<p class="rear-count">Retaguarda ${B[t].rear.length}/2</p></div></div>`;
  };
  const selectedTarget=G.getUnit(s,ui.target),executionReady=mine&&actor&&G.getMainAbility(actor)?.trigger==='petrify'&&selectedTarget?.petrifiedBy===actor.uid&&G.canExecutePetrified?.(s,actor,selectedTarget);
  let info=ui.busy?'Confira o resultado da ação e as reações no registro da batalha. A próxima ação começa em instantes.':ui.paused?'Batalha pausada. Continue quando estiver pronto.':choice?'Mão cheia: escolha uma carta para substituir ou descarte a nova.':s.formation?'Escolha os Suportes que vão defender a linha de frente.':s.recovery?'A batalha aguarda a recuperação da Daly Mãe.':pd?`Brisa: escolha um aliado ferido para curar +${pd.value} de Vida.`:idle?'Não há personagens capazes de atacar. Use suas medalhas ou avance o ciclo para ambas as equipes comprarem uma carta.':mine?ui.move?'Toque em um Suporte para mudar de linha. Se a linha estiver cheia, escolha outro Suporte para trocar.':`Vez de ${actor.name}. Escolha um alvo e confirme o ataque.`:actor?`${actor.name}, do adversário, está preparando a jogada…`:'Aguardando…';
  let actions=pd&&!ui.busy?btn('brisaskip','Dispensar cura da Brisa'):mine?idle?btn('idle-cycle',s.deck.pile.length?'Avançar ciclo · comprar cartas':'Avançar ciclo · resolver efeitos',s.deck.pile.length===0&&!G.hasTimedEffects?.(s)&&!G.hasIdleHandResources?.(s,'player')&&!G.hasIdleHandResources?.(s,'enemy')):btn('attack',executionReady?'Executar petrificado':'Confirmar ataque',!ui.target||ui.move)+btn('move',ui.move?'Concluir posições':'Mover Suportes',!B.player.front.concat(B.player.rear).some(G.canTransit)):'';
  if(idle&&s.deck.pile.length===0)info+=' O monte principal acabou; as medalhas na mão ainda podem ser resgatadas.';
  if(pinned){info=actor.name+' está cravado e não pode atacar ou se mover. Passe a vez para continuar a batalha.';actions=btn('pinned-wait','Passar vez · imobilizado');}
  if(holding){info='John mantém o machado em '+G.getUnit(s,actor.pinning)?.name+'. Manter encerra sua ação; retirar libera os dois e permite atacar novamente.';actions=btn('pin-keep','Manter machado')+btn('pin-release','Retirar e escolher ataque');}
  const areaDaly=area&&!actor.duelId&&G.isDalyExposed(s,'enemy');
  if(area){info=areaDaly?'A Daly Mãe está exposta: este ataque retira exatamente 1 vida, sem gastar mana.':'3000W atinge todos os adversários da linha de frente. Aliados e retaguarda ficam protegidos. Dano por alvo: '+G.previewDamage(s,actor,ui.mana,null,ui.attackMode)+'.';actions=btn('attack',areaDaly?'Atacar Daly Mãe · 1 vida':'Atacar em área · 3000W');}
  if(pinAttack){actions=btn('mode-normal','Ataque normal · 80',false,ui.attackMode==='normal'?'on':'')+btn('mode-pin','Cravar machado · 80 + 20 por ação',ui.target==='daly_enemy',ui.attackMode==='pin'?'on':'')+actions;info+=' Modo: '+(ui.attackMode==='pin'?'cravar o machado se o golpe acertar e ambos sobreviverem.':'ataque normal.');}
  if(mine&&actor&&G.getMainAbility(actor)?.trigger==='healingAttack'){
    actions=(rearHealer?'':btn('mode-normal','Atacar',false,ui.attackMode==='normal'?'on':''))+btn('mode-heal','Curar aliado · '+actor.damage,false,ui.attackMode==='heal'?'on':'')+actions;
    if(ui.attackMode==='heal')info='Escolha outro aliado ferido na mesma dimensão para curar até '+actor.damage+' de Vida. A cura usa a ação de Elysh.';
  }
  if(mine&&actor&&G.getMainAbility(actor)?.trigger==='doubleAttack'){
    actions=btn('mode-normal','Dois braços · '+(G.baseAttackCount(actor)>1?'2 golpes de '+actor.damage:actor.damage),false,ui.attackMode==='normal'?'on':'')+btn('mode-double',actor.doubleUsed?'Quatro braços · já usados':'Quatro braços · '+(G.baseAttackCount(actor)>1?'4 golpes de '+actor.damage:'dano dobrado'),actor.doubleUsed||ui.target==='daly_enemy',ui.attackMode==='double'?'on':'')+actions;
    info+=' Quatro braços: '+(actor.doubleUsed?'já usados nesta partida.':'uma única ativação disponível.');
  }
  if(mine&&actor?.abilityOnly){const target=G.getUnit(s,actor.bookTarget);info='Livro marcado: '+(target?.name||'aguardando nome')+'. A habilidade elimina abaixo de '+G.RARITY_LABEL[actor.rarity]+'; nas demais raridades, causa '+G.getMainAbility(actor).damage+'.';actions=btn('attack','Usar livro · '+(target?.name||'sem alvo'),!target);}
  if(mine&&actor&&!G.hasActionTarget(s,actor)){info='Não há alvo acessível nesta dimensão. Passe a vez para continuar a hierarquia.';actions=btn('wait','Sem alvo · passar vez')+(rearHealer?btn('move',ui.move?'Concluir posições':'Mover Suportes'): '');}
  if(mine&&actor&&G.officialStatus){
    const type=G.getMainAbility(actor)?.trigger;
    if(type==='paralyzingKick')actions=btn('mode-normal','Ataque normal',false,ui.attackMode==='normal'?'on':'')+btn('mode-stun','Golpe paralisante · +30% · d6 1–3',false,ui.attackMode==='stun'?'on':'')+actions;
    if(type==='swarm')actions=btn('mode-normal','Concentrar · '+actor.damage,false,ui.attackMode==='normal'?'on':'')+btn('mode-area','Dividir Swarm na frente',false,ui.attackMode==='area'?'on':'')+actions;
    if(type==='swarm'&&area){info='Swarm divide '+actor.damage+' igualmente entre os adversários da frente. Cada parcela sobe para múltiplo de 5. Por alvo: '+G.previewDamage(s,actor,ui.mana,null,'area')+'.';actions=btn('mode-normal','Concentrar · '+actor.damage)+btn('mode-area','Dividir Swarm',false,'on')+btn('attack',areaDaly?'Atacar Daly Mãe · 1 vida':'Confirmar Swarm em área');}
    if(type==='sleepPowder')actions=btn('power-sleepPowder',actor.sleepUsed?'Pó mágico · já usado':'Adormecer oponente · uso único',actor.sleepUsed)+actions;
    if(type==='petrify')actions=btn('power-petrify',actor.petrifyPrecision?'Petrificar · d6 1–'+actor.petrifyPrecision:'Petrificação esgotada',actor.petrifyPrecision<=0||actor.petrifyAttemptRound===s.round||s.units.some(t=>!G.isCharacterDefeated(t)&&t.petrifiedBy===actor.uid))+actions;
    if(type==='fullHeal')actions=btn('full-heal',actor.fullHealUsed?'Cura total · já usada':'Cura total dos outros aliados · usa ação',actor.fullHealUsed||!G.healingTargets(s,actor).length)+actions;
    if(type==='hypnosis'&&actor.hypnosisTarget){info='Hipnose: '+(G.getUnit(s,actor.hypnosisTarget)?.name||'sem alvo')+'. Manter ou trocar: 90 de dano ao alvo na sua vez.';actions=btn('hypnosis-keep','Manter · causar 90',!actor.hypnosisTarget)+btn('power-hypnosis','Trocar alvo e depois causar 90',actor.hypnosisChangeRound===s.round);}
    if(G.breakCurseTargets(s,actor).length&&type!=='hypnosis')actions=btn('mode-break','Libertar aliado petrificado · dano 30',false,ui.attackMode==='break'?'on':'')+actions;
    if(ui.attackMode==='break'){info='Escolha um aliado petrificado. Libertá-lo usa sua ação e causa somente 30, substituindo o ataque normal.';actions=btn('mode-normal','Voltar ao ataque')+btn('attack','Quebrar maldição · dano 30',!G.breakCurseTargets(s,actor).some(t=>t.uid===ui.target));}
    if(type==='punchCombo')info+=' Combo: um d6 por soco, até seis. Repetir encerra. Cada soco tem defesa e reação.';
    if(type==='diceExecution')info+=' D6 multiplica o básico de '+actor.damage+'; 6 executa até a própria raridade e causa '+(actor.damage*6)+' nas superiores.';
    if(type==='duelist')info='Duelo: d6 1–3 elimina até a própria raridade ou causa 200 nas superiores. 4–6 falha e você recebe o dano do alvo.';
  }
  if(rearAbility){
    info=G.healingTargets(s,actor).length?'Retaguarda: Zuri pode curar todos os outros aliados uma única vez. A cura usa a ação.':'Aliados com Vida cheia: passe esta vez ou mova um Suporte.';
    actions=btn('full-heal','Cura total dos outros aliados · usa ação',actor.fullHealUsed||!G.healingTargets(s,actor).length)+btn('wait','Passar vez')+btn('move',ui.move?'Concluir posições':'Mover Suportes');
  }
  if(locked){info=G.officialStatus(s,actor)+'. Resolva o impedimento para continuar a hierarquia.';actions=btn('status-turn',actor.sleep?'Rolar d6 para acordar · 1–2':'Passar vez · impedimento');}
  if(handUsable&&!mine)info+=' As cartas da mão continuam disponíveis.';
  if(entry)info='Pré-batalha · '+G.getUnit(s,entry.actorUid)?.name+' está resolvendo a habilidade de entrada.';
  if(ui.busy&&e?.type==='area')info=(e.ability||'3000W')+' · '+impacts.map(x=>x.targetName+': '+(x.type==='parry'?'defendeu no Parry':x.type==='dodge'?'esquivou':x.ability==='Presence'?'ignorou com Presence':x.instant?'eliminado':'−'+(x.amount??x.damage))).join(' · ');
  if(ui.busy&&e?.ticks?.length&&e.type!=='area')info=(e.type==='pin-keep'?'John manteve o machado. ':e.type==='pin-skip'?e.actorName+' passou a vez imobilizado. ':'')+e.ticks.map(x=>x.targetName+' recebeu '+x.amount+' de '+(x.ability||'efeito')+(x.type==='defeat'?' e foi eliminado':'')+'.').join(' ');
  if(ui.busy&&(e?.reaction||e?.reactions?.length)&&e.type!=='area')info=impacts.map(x=>(x.sourceName||x.actorName)+' → '+x.targetName+': '+(x.type==='parry'?'Parry':x.type==='dodge'?'esquiva':x.type==='duel-miss'?'falhou no duelo':x.type==='miss'?'errou':x.instant?'eliminação instantânea':x.type==='immune'?'invencível':x.type==='heal'?'+'+x.healed+' de Vida':'−'+(x.amount??x.damage)+' de Vida')+(x.ability?' · '+x.ability:'')).join(' | ');
  if(mage&&!areaDaly&&ui.target!=='daly_enemy')actions+=btn('mana-','− Mana',ui.mana<=0)+`<span>Mana no ataque: ${ui.mana}/${actor.mana}</span>`+btn('mana+','+ Mana',ui.mana>=actor.mana);
  if(mine&&actor&&ui.target&&!['heal','break'].includes(ui.attackMode)&&G.getMainAbility(actor)?.trigger!=='duelist'){const target=G.getUnit(s,ui.target),dodge=target&&G.dodgeInfo(actor,target),damage=G.previewDamage(s,actor,ui.mana,target,ui.attackMode),reply=target&&G.reactionPreview(actor,target,damage);info+=ui.target==='daly_enemy'?' A Daly Mãe perderá exatamente 1 vida.':` Dano previsto: ${damage}.${dodge?' O alvo pode esquivar.':''}${reply?` ${target.name} sobrevive e reage com ${reply.ability}: ${reply.instant?'seu atacante será eliminado instantaneamente':reply.damage+' de dano no seu atacante'}.`:target&&G.getMainAbility(target)?.trigger==='onAttacked'?(G.isPresence(actor)?` Presence impede o revide de ${target.name}.`:` Golpe fatal: ${target.name} será eliminado sem revidar.`):''}`;}
  if(mine&&actor&&ui.target){const parry=G.parryInfo(actor,G.getUnit(s,ui.target));if(parry)info+=' Parry do alvo: defende com 1–'+parry.threshold+' no dado de 6.';}
  info=G.actionPrompt(s,actor,{busy:ui.busy,paused:ui.paused,move:ui.move,mode:ui.attackMode,target:ui.target,mana:ui.mana,hand:inst});
  const optionalActions=G.hasArenaAbilityOptions(actions);ui.hasAbilityOptions=optionalActions;if(optionalActions&&!ui.abilityOptions&&!ui.target&&!ui.move&&mine&&actor&&ui.attackMode==='normal')info='Escolha o alvo ou toque na estrela para usar a habilidade.';
  actions=G.arenaActionsHTML(actions);
  const logs=s.log.slice().reverse().map((line,i)=>`<div class="battle-event${i===0?' latest':''}"><span>✧</span><p>${G.escapeUI(line)}</p></div>`).join('');
  const pendingPanel=!ui.busy&&(s.recovery?.side==='player'?G.recoveryHTML(s):s.formation?.side==='player'?G.formationHTML(s):'');
  const entryModal=!ui.busy&&!ui.paused&&!pendingPanel&&!s.recovery&&!s.formation&&!choice&&!pd?G.characterAbilityChoiceHTML(s,ui.abilityTarget):'';
  const modal=pendingPanel?`<div class="choice-overlay"><section class="choice-dialog" role="dialog" aria-modal="true" aria-labelledby="${s.recovery?'recovery-title':'formation-title'}">${pendingPanel}${ui.msg?`<p class="msg">${ui.msg}</p>`:''}</section></div>`:'';
  const displayActor=ui.busy&&['support','summon'].includes(s.lastEvent?.type)?ui.actor:actor;
  const inspected=G.getUnit(s,ui.inspectUid)||displayActor;
  const eventBrief=G.eventBrief(s.lastEvent);
  const handDef=selectedHand()?G.getResetCard(selectedHand().id):null;
  const handPages=handDef?.type==='SUPPORT'?Math.max(1,Math.ceil(G.supportTargets(s,'player',G.getSupportCard(handDef.id)).length/4)):1;
  const reader=ui.drawer&&G.ArenaReaders?.render({type:ui.drawer,state:s,unit:inspected,actor:displayActor,page:ui.readerPage,handPages,handDetailHTML:handDetail(handUsable,ui.readerPage),handArtHTML:handDef?G.handArtHTML?.(handDef):'',settingsHTML:G.VisualShell?.settingsHTML()||''});
  if(reader)ui.readerPage=reader.page;
  const inspectHTML=reader?.html||(ui.drawer==='hand'?handDetail(handUsable):ui.drawer==='settings'?G.VisualShell?.settingsHTML()||'':ui.drawer==='card'&&inspected?`<div class="inspect-content"><div class="inspect-card">${card(inspected)}</div>${G.actorInfoHTML(s,inspected).replace('data-ui-panel="ability"','')}</div>`:ui.drawer==='history'?`${combatMessage(s)}<div class="log-list full-history">${logs}</div>`:'');
  const drawer=ui.drawer?`<div class="inspect-backdrop"><section class="inspect-sheet fg-inspect${reader?' fit-reader':''}" data-reader="${ui.drawer}" role="dialog" aria-modal="true" aria-labelledby="inspect-title"><header><h3 id="inspect-title">${G.escapeUI(reader?.title||'Consulta da batalha')}</h3>${btn('close-drawer','Voltar à batalha')}</header>${inspectHTML}${reader?.navigation||''}</section></div>`:'';
  const turnHTML=G.turnPanelHTML(s,displayActor,ui.busy).replace(/<details class="speed-order"[\s\S]*?<\/details>/,'<button class="speed-order fit-read-button" data-act="order-info">Ordem de velocidade</button>');
  const actorHTML=G.actorInfoHTML(s,inspected,ui.busy).replace(/<details class="ability-details"[\s\S]*?<\/details>/,'<button class="ability-details fit-read-button" data-act="card-info">Habilidade e tributos</button>');
  show(`<main class="arena fg-arena fit-arena inplace-arena" data-ability-options="${ui.abilityOptions}" data-frontcap="${Math.max(G.frontLimit(s,'player'),G.frontLimit(s,'enemy'))}" data-busy="${ui.busy}" data-paused="${ui.paused}"><header class="arena-header"><div class="arena-brand"><img src="assets/logo/logo.png" alt="GOGHOS — The Nightmare Is Coming"><small>The Nightmare Is Coming</small></div><div class="arena-round">${G.arenaArtHTML('trophy')}<span>Rodada <b>${s.round}</b></span></div><nav aria-label="Controles da batalha"><button data-act="sound-toggle" class="battle-sound${G.VisualShell?.prefs().muted?' is-muted':''}" title="${G.VisualShell?.prefs().muted?'Ativar som':'Silenciar'}" aria-label="${G.VisualShell?.prefs().muted?'Ativar som':'Silenciar'}" aria-pressed="${!G.VisualShell?.prefs().muted}">${G.VisualShell?.icon(G.VisualShell.prefs().muted?'mute':'sound')||'♪'}</button>${btn('settings','Áudio')}${btn('card-info','Ficha',!!(choice||pd||s.recovery||s.formation||entry))}${btn('pause',ui.paused?'Continuar':'Pausar')}${btn('menu','Menu')}</nav></header><aside class="arena-left">${G.characterPilesHTML(s)}<div class="history-panel"><div class="event-feed">${combatMessage(s)}</div><button class="log-drawer fit-read-button" data-act="event-log">Registro da batalha <b>${s.log.length}</b></button><button class="elim fit-read-button" data-act="eliminated-info">Personagens eliminados <b>${s.eliminated?.length||0}</b></button></div>${G.handPanelHTML(s,ui.handIid,G.ArenaReaders?'':handDetail(handUsable))}</aside><section class="battle-board" aria-label="Campo de batalha">${turnHTML}${side('enemy')}<div class="arena-divider" aria-label="Última ação"><i></i><button class="event-brief" data-act="event-log"${choice||pd||s.recovery||s.formation||entry?' disabled':''} title="Ver o registro da batalha">${G.escapeUI(eventBrief)} <small aria-hidden="true">${G.VisualShell?.icon('back')||''}</small></button><i></i></div>${side('player')}<div class="turn-guide"><p class="info" role="status">${info}</p><div class="battle-actions">${actions}</div><p class="msg">${ui.msg}</p><p class="notice" role="status">${ui.notice&&ui.notice!==G.eventBrief(s.lastEvent)?G.escapeUI(ui.notice):''}</p></div></section><aside class="arena-right">${actorHTML}${G.mainPileHTML(s)}</aside>${modal}${entryModal}${drawer}</main>`);
  app.querySelectorAll?.('[data-ui-panel]')?.forEach(p=>{p.open=!!ui.panels[p.dataset.uiPanel];});
  const expanded=app.querySelector('.inspect-sheet .ability-details');if(expanded)expanded.open=true;
  const arena=app.querySelector('.arena'),dock=app.querySelector('.mao');
  syncDockHeight();G.ArenaFit?.mount(arena);if(!ui.drawer&&!ui.paused&&!choice&&!entry&&!s.recovery&&!s.formation&&!pd)G.PresentationFX?.syncUnits?.(s);
  if(arena)arena.scrollTop=scroll;const board=app.querySelector('.battle-board');if(board)board.scrollTop=boardScroll;
  app.querySelectorAll?.('[data-formation]')?.forEach(r=>{r.querySelector('.frow').scrollLeft=rowScroll[r.dataset.formation]||0;});
  if(dock&&typeof ResizeObserver!=='undefined'){dockObserver=new ResizeObserver(syncDockHeight);dockObserver.observe(dock);}
  const excluded=app.querySelector('.elim'),log=app.querySelector('.log-list');
  if(excluded)excluded.open=excludedOpen||impacts.some(x=>x.type==='defeat');
  if(log)log.scrollTop=logScroll;
}
function openDrawer(type,page=0){G.PresentationFX?.stop();clearTimeout(ui.timer);ui.drawer=type;ui.readerPage=page;render(ui.busy?null:ui.actor);app.querySelector('[data-act=close-drawer]')?.focus();}
function closeDrawer(){ui.drawer=null;if(ui.paused){ui.busy=false;render(ui.actor);}else if(ui.busy)feedback();else step();app.querySelector('[data-act=card-info]')?.focus({preventScroll:true});}
function feedback(){
  ui.drawer=null;clearTimeout(ui.timer);ui.busy=true;ui.notice='';clearPick();render(null);G.PresentationFX?.playEvent(ui.state,ui.state.lastEvent,{duration:G.feedbackDuration(ui.state.lastEvent)});
  ui.timer=setTimeout(()=>{ui.busy=false;step();},G.feedbackDuration(ui.state.lastEvent));
}
function step(){
  clearTimeout(ui.timer);const s=ui.state;if(!s)return;
  let actor=G.getNextActor(s);
  if(!ui.paused&&G.isIdleBattle(s)&&G.canManageTeam(s,'enemy')){G.AI.redeemMedals(s,'enemy');const played=G.resolveIdleAI(s,'enemy');if(played?.ok){feedback();return;}actor=G.getNextActor(s);}
  ui.actor=actor;render(actor);
  if(s.result){ui.timer=setTimeout(result,G.CONFIG.pacing.feedback);return;}
  if(ui.paused)return;
  if(s.deck.pendingChoice)return;
  if(s.formation){if(s.formation.side==='enemy')ui.timer=setTimeout(()=>{G.AI.resolveFormation(s);step();},G.CONFIG.pacing.botThink);return;}
  if(s.recovery){if(s.recovery.side==='enemy')ui.timer=setTimeout(()=>{G.AI.resolveRecovery(s);step();},G.CONFIG.pacing.botThink);return;}
  if(s.support.pending)return;
  if(s.abilityChoices.length){if(s.abilityChoices[0].side==='enemy')ui.timer=setTimeout(()=>{const p=s.abilityChoices[0],r=G.AI.resolveCharacterAbility(s);if(r.ok&&(p.type==='fright'||r.free))feedback();else{finishChoice(r);if(r.ok){const a=G.getUnit(s,p.actorUid),d=s.duels.filter(x=>x.sourceUid===p.actorUid&&x.active).at(-1),targetUid=d?.targetUid||a?.bookTarget||a?.hypnosisTarget||a?.protectedUid||a?.friendUid;G.PresentationFX?.playAbility(s,{type:p.type,actorUid:p.actorUid,targetUid});}}},G.CONFIG.pacing.botThink);return;}
  if(actor?.team==='enemy')ui.timer=setTimeout(()=>{
    const redeemed=G.AI.redeemMedals(s,'enemy');
    const attack=()=>{const r=G.AI.takeTurn(s,actor);if(r.pending){step();return;}if(r.ok){ui.msg='';feedback();}else{ui.msg=r.error;render(actor);}};
    if(s.abilityChoices.length){step();return;}
    if(redeemed.length){ui.notice='O adversário resgatou '+redeemed.map(r=>r.name).join(', ')+'.';render(actor);ui.timer=setTimeout(attack,G.CONFIG.pacing.botThink);}else attack();
  },G.CONFIG.pacing.botThink);
}
function result(){
  G.PresentationFX?.stop();ui.mode='result';const f=ui.state.final,draw=ui.state.result==='draw',kind=draw?'draw':f.winner==='player'?'victory':'defeat';
  const reward=G.Sanctuary?.awardMatch(ui.matchToken,ui.state.result);
  show(`<section class="result-screen fg-screen ${kind}"><div class="fg-result-card"><img class="result-emblem" src="assets/visual-v0.27/ui/champion-emblem.png" alt=""><span class="eyebrow">Mais uma história no campo</span><h1>${draw?'EMPATE':f.winner==='player'?'VITÓRIA':'DERROTA'}</h1><p>${draw?'Nenhuma equipe pode continuar atacando com os recursos restantes.':(f.loser==='player'?'Sua Daly Mãe':'A Daly Mãe adversária')+' perdeu todas as vidas.'}</p><div class="result-score"><span><small>Você</small>${f.daly.player}<small>/3 vidas</small></span><span><small>Bot</small>${f.daly.enemy}<small>/3 vidas</small></span></div>${reward?.html?'<div class="result-reward">'+reward.html+'</div>':''}<div class="result-actions">${btn('play','Nova partida')}${btn('menu','Voltar ao menu')}</div></div></section>`);G.PresentationFX?.playResult(kind);toTop();
}
function settingsPage(){ui.mode='settings';show(`<section class="settings-page fg-screen">${screenHeader('Configurações','Seu jogo, seu ritmo','settings')}${G.VisualShell?.settingsHTML()||''}</section>`);toTop();}

function cardOf(t){const c=t.closest('.card');if(c)return c;return t.closest('.slot')?.querySelector('.card')||t.closest('[data-unit]')?.querySelector('.card')||null;}
function finishChoice(r){ui.msg=r.ok?'':r.error;ui.notice=r.ok?ui.state.log.at(-1):'';if(r.ok){ui.drawer=null;clearPick();}step();}
app.addEventListener('click',event=>{
  const t=event.target,b=t.closest('[data-act]'),hand=t.closest('[data-hand]'),c=cardOf(t),daly=t.closest('[data-daly]');
  if(b){
    if(b.disabled)return;let a=b.dataset.act;G.PresentationFX?.interaction(a==='attack'?'confirm':a==='pause'?'pause':a.startsWith('mode-')?'select':'click',b);
    if(a==='shell-intro'){G.VisualShell?.boot(true);return;}
    if(a==='settings'){if(ui.mode==='battle')openDrawer('settings');else settingsPage();return;}
    if(a==='sound-toggle'){G.VisualShell?.handleSetting('fx-toggle-sound');render(ui.busy?null:ui.actor);return;}
    if(a.startsWith('fx-')&&G.VisualShell?.handleSetting(a)){if(ui.mode==='battle')render(ui.busy?null:ui.actor);else settingsPage();app.querySelector('[data-act="'+a+'"]')?.focus?.({preventScroll:true});return;}
    if(a.startsWith('sanctuary-')&&G.Sanctuary){if(ui.mode==='battle')return;G.PresentationFX?.stop();ui.mode='sanctuary';if(a==='sanctuary-open'||a==='sanctuary-lore'){show(a==='sanctuary-lore'?G.Sanctuary.render('story'):G.Sanctuary.render('vault'));toTop();return;}const detailId=app.querySelector('.shop-card.is-selected')?.dataset.cosmetic,r=G.Sanctuary.handle(a);if(r.handled){show(r.html);if(a.startsWith('sanctuary-preview-')&&a!=='sanctuary-preview-close'){app.querySelector('#shop-cosmetic-detail')?.scrollIntoView({block:'center',behavior:'instant'});app.querySelector('.shop-detail-close')?.focus({preventScroll:true});}else if(a==='sanctuary-preview-close'&&detailId)app.querySelector('[data-act="sanctuary-preview-'+detailId+'"]')?.focus({preventScroll:true});else if(a.startsWith('sanctuary-category-'))app.querySelector('[data-act="'+a+'"]')?.focus({preventScroll:true});else if(a==='sanctuary-featured'){toTop();app.querySelector('.shop-chest-buy')?.focus({preventScroll:true});}else if(a==='sanctuary-open-chest'&&r.ok){app.querySelector('.sanctuary-reveal')?.scrollIntoView({block:'start',behavior:'instant'});app.querySelector('.sanctuary-reveal-actions button')?.focus({preventScroll:true});}if(a.startsWith('sanctuary-chest-preview-'))app.querySelector('[data-act="'+a+'"]')?.focus({preventScroll:true});if(r.sound)G.PresentationFX?.interaction(r.sound);}return;}
    if(a==='menu'){if(ui.mode==='battle'&&!ui.state.result&&!confirm('Sair da batalha atual? O progresso será perdido.'))return;menu();return;}
    if(a==='mode-open'&&ui.mode==='menu'&&G.VisualShell){ui.mode='modes';show(G.VisualShell.modesHTML());toTop();app.querySelector('[aria-pressed=true]')?.focus({preventScroll:true});return;}
    if(a.startsWith('mode-select-')&&ui.mode==='modes'&&G.VisualShell?.selectMode(a.slice(12))){menu();app.querySelector('[data-act=mode-open]')?.focus({preventScroll:true});return;}
    if(a==='play'&&ui.mode==='menu')a=G.VisualShell?.getMode().action||'play';
    if(a==='play'){startMatch();return;}
    if(a==='divine-test'){wipe();ui.state=G.createDivineTestState();step();toTop();return;}
    if(a==='support-test'){supportTest();return;}
    if(a.startsWith('supportlab-')){wipe();ui.state=G.createSupportTestState(a.slice(11));step();toTop();return;}
    if(a==='sark-test'){sarkTest();return;}
    if(a==='ability-test'){abilityTest();return;}
    if(a==='new-abilities'){abilityTest(G.CHARACTERS.map(c=>c.id));return;}
    if(a.startsWith('lab-')&&G.getCharacterById(a.slice(4))){wipe();ui.state=G.createAbilityTestState(a.slice(4));step();toTop();return;}
    if(a==='sark-enemy'||a==='sark-player'){wipe();ui.state=G.createSarkTestState(a==='sark-player'?'player':'enemy');step();toTop();return;}
    if(a==='characters'){characters();return;}
    if(a==='shop'){if(G.Sanctuary){ui.mode='sanctuary';show(G.Sanctuary.render('vault'));}else show(G.shopHTML());return;}
    if(a==='fight'){const teams=G.selectionTeams(ui.sel);if(!teams)return;ui.state=G.createBattleState(teams.player,teams.enemy);ui.matchToken=G.Sanctuary?.newMatchToken()||null;clearPick();step();toTop();return;}
    if(ui.mode!=='battle')return;const s=ui.state;
    if(['card-info','event-log','order-info','eliminated-info'].includes(a)){openDrawer({'card-info':'card','event-log':'history','order-info':'order','eliminated-info':'eliminated'}[a]);return;}
    if(a==='unit-info'){ui.inspectUid=b.dataset.unitInfo;openDrawer('card',0);return;}
    if(a==='unit-ability'){const owner=G.getUnit(s,b.dataset.unitAbility);if(!owner)return;ui.inspectUid=owner.uid;if(owner.uid===ui.actor?.uid&&owner.team==='player'&&!ui.busy&&!ui.paused&&!s.result&&!s.recovery&&!s.formation&&!s.deck.pendingChoice&&!s.support.pending&&!s.abilityChoices.length&&!owner.pinnedBy&&!owner.pinning&&!G.isActionLocked?.(owner)&&ui.hasAbilityOptions){ui.abilityOptions=!ui.abilityOptions;render(ui.actor);}else openDrawer('card',1);return;}
    if(a==='reader-prev'||a==='reader-next'){ui.readerPage=Math.max(0,ui.readerPage+(a==='reader-next'?1:-1));render(ui.busy?null:ui.actor);return;}
    if(a==='close-drawer'){closeDrawer();return;}
    if(a==='pause'){G.PresentationFX?.stop();clearTimeout(ui.timer);ui.paused=!ui.paused;if(ui.paused)render(ui.busy?null:ui.actor);else if(ui.busy)feedback();else step();return;}
    if(ui.busy)return;
    if(a==='cancel-entry'){finishChoice(G.cancelCharacterAbility(s));return;}
    if(a==='resolve-entry'){if(ui.paused)return;const p=G.pendingCharacterAbility(s);if(p?.side!=='player')return;const fxTarget=ui.abilityTarget,r=G.resolveCharacterAbility(s,p.actorUid,ui.abilityTarget);if(r.ok&&(p.type==='fright'||r.free))feedback();else{ui.abilityTarget=null;finishChoice(r);if(r.ok)G.PresentationFX?.playAbility(s,{type:p.type,actorUid:p.actorUid,targetUid:fxTarget});}return;}
    if(a==='keep-new'){finishChoice(G.resolveHandReplacement(s,null));return;}
    if(a.startsWith('recover-')){if(s.recovery?.side==='player')finishChoice(G.performRecovery(s,a.slice(8)));return;}
    if(a.startsWith('advance-')){if(s.formation?.side==='player')finishChoice(G.resolveFrontLine(s,a==='advance-all'?[...s.formation.candidates]:[a.slice(8)]));return;}
    if(a==='brisaskip'){finishChoice(G.resolveBrisa(s,null));return;}
    if(['pin-keep','pin-release','pinned-wait'].includes(a)){
      const actor=G.getNextActor(s);if(ui.paused||actor?.team!=='player')return;
      const r=a==='pin-keep'?G.keepPin(s,actor.uid):a==='pin-release'?G.withdrawPin(s,actor.uid):G.performPinnedTurn(s,actor.uid);
      if(r.ok&&a!=='pin-release'){ui.msg='';feedback();}else finishChoice(r);return;
    }
    if(a==='status-turn'){const actor=G.getNextActor(s);if(ui.paused||actor?.team!=='player')return;const r=G.performStatusTurn(s,actor.uid);if(r.ok&&r.spent)feedback();else finishChoice(r);return;}
    const actor=G.getNextActor(s);if(ui.paused)return;
    if(a==='summon'){const r=G.performSummon(s);if(r.ok)feedback();else finishChoice(r);return;}
    if(a==='redeem'||a==='usehand'){
      if(!G.canUseHand(s,'player'))return;
      if(a==='redeem'){const inst=selectedHand();if(inst)finishChoice(G.resolveDalle(s,'player',inst));}
      else {const r=G.performHandSupport(s,ui.handIid,ui.healTarget);if(r.ok&&r.showFeedback){ui.msg='';feedback();}else finishChoice(r);}
      return;
    }
    if(!G.canManageTeam(s,'player'))return;
    if(a.startsWith('power-')){finishChoice(G.requestOfficialChoice(s,actor.uid,a.slice(6)));return;}
    if(a==='full-heal'||a==='hypnosis-keep'){const r=a==='full-heal'?G.performFullHeal(s,actor.uid):G.performHypnosisTurn(s,actor.uid);if(r.ok)feedback();else finishChoice(r);return;}
    if(a==='idle-cycle'){finishChoice(G.advanceIdleCycle(s));return;}
    if(a==='attack'&&!actor)return;
    if(['mode-normal','mode-pin','mode-heal','mode-double','mode-stun','mode-area','mode-break'].includes(a)){ui.attackMode=a.slice(5);ui.target=null;render(actor);return;}
    if(a==='wait'){const r=G.performWait(s,actor.uid);if(r.ok)feedback();else finishChoice(r);return;}
    if(a==='attack'){const r=ui.attackMode==='break'?G.performBreakCurse(s,actor.uid,ui.target):ui.attackMode==='heal'?G.performHealingAttack(s,actor.uid,ui.target):G.performBasicAttack(s,actor.uid,ui.target,ui.mana,ui.attackMode);if(r.ok){ui.msg='';feedback();}else{ui.msg=r.error;render(actor);}return;}
    if(a==='move'){ui.move=!ui.move;ui.target=null;ui.handIid=null;ui.healTarget=null;ui.swapPick=null;ui.msg='';render(actor);return;}
    if(a==='mana+'||a==='mana-'){ui.mana=Math.max(0,Math.min(actor.mana,ui.mana+(a==='mana+'?1:-1)));render(actor);return;}
    return;
  }
  if(ui.mode==='select'){if(c){G.PresentationFX?.interaction('select');pickCharacter(c.dataset.id);}return;}
  if(ui.mode!=='battle')return;const s=ui.state;
  if(c&&!hand){ui.inspectUid=c.dataset.id;if(ui.busy||ui.paused){openDrawer('card');return;}}
  if(ui.busy)return;
  const supportTarget=t.closest('[data-support-target]');if(supportTarget&&!ui.paused&&G.canUseHand(s,'player')){ui.healTarget=supportTarget.dataset.supportTarget;render(G.getNextActor(s));return;}
  const abilityTarget=t.closest('[data-ability-target]');if(abilityTarget&&!ui.paused&&G.pendingCharacterAbility(s)?.side==='player'){G.PresentationFX?.interaction('select');ui.abilityTarget=abilityTarget.dataset.abilityTarget;render(null);return;}
  if(!c&&!hand&&!daly)return;
  if(s.deck.pendingChoice){if(hand)finishChoice(G.resolveHandReplacement(s,hand.dataset.hand));return;}
  const actor=G.getNextActor(s),mine=!ui.paused&&G.canManageTeam(s,'player'),handUsable=!ui.paused&&G.canUseHand(s,'player');
  if(hand){G.PresentationFX?.interaction('card');ui.handIid=ui.handIid===hand.dataset.hand?null:hand.dataset.hand;ui.healTarget=null;ui.move=false;ui.msg='';if(ui.handIid)openDrawer('hand');else{ui.drawer=null;render(actor);}return;}
  const u=c?G.getUnit(s,c.dataset.id):null;
  if(s.support.pending){if(u&&s.support.pending.candidates.includes(u.uid))finishChoice(G.resolveBrisa(s,u.uid));return;}
  const inst=selectedHand(),support=inst&&G.getResetCard(inst.id).type==='SUPPORT'?G.getSupportCard(inst.id):null;
  if(handUsable&&support&&u&&G.supportTargets(s,'player',support).includes(u)){
    ui.healTarget=u.uid;ui.msg='';render(actor);return;
  }
  if(!mine){if(c)openDrawer('card');return;}
  if(daly&&daly.dataset.daly==='enemy'&&G.canAttackFrom(actor)&&G.isDalyExposed(s,'enemy')){ui.target='daly_enemy';ui.mana=0;ui.attackMode='normal';ui.move=false;render(actor);return;}
  if(!u)return;
  if(ui.attackMode==='break'&&G.breakCurseTargets(s,actor).includes(u)){ui.target=u.uid;render(actor);return;}
  if(ui.attackMode==='heal'&&G.healingTargets(s,actor).includes(u)){ui.target=u.uid;render(actor);return;}
  if(ui.move&&u.team==='player'){
    const r=ui.swapPick&&ui.swapPick!==u.uid?G.performSwap(s,ui.swapPick,u.uid):G.performTransit(s,u.uid);
    ui.msg=r.ok?'':r.error;
    if(r.ok){ui.swapPick=null;ui.notice=s.log.at(-1);step();}else{ui.swapPick=G.canTransit(u)?u.uid:null;render(actor);}return;
  }
  if(G.attackTargets(s,actor).includes(u)&&ui.attackMode!=='heal'&&!actor.abilityOnly&&G.getMainAbility(actor)?.trigger!=='areaAttack'){ui.target=u.uid;render(actor);}else openDrawer('card');
});
app.addEventListener('keydown',event=>{if(ui.mode==='menu'&&['ArrowDown','ArrowUp','Home','End'].includes(event.key)&&event.target.closest?.('.toon-menu')){event.preventDefault();const bs=Array.from(app.querySelectorAll('.toon-menu .toon-button')),i=bs.indexOf(event.target.closest('button'));bs[event.key==='Home'?0:event.key==='End'?bs.length-1:(i+(event.key==='ArrowDown'?1:-1)+bs.length)%bs.length]?.focus();return;}if(ui.mode==='sanctuary'&&event.key==='Escape'&&app.querySelector('.shop-detail-close')){event.preventDefault();app.querySelector('.shop-detail-close').click();return;}if(ui.mode==='modes'&&event.key==='Escape'){event.preventDefault();menu();app.querySelector('[data-act=mode-open]')?.focus({preventScroll:true});return;}if(ui.drawer&&event.key==='Escape'){event.preventDefault();closeDrawer();return;}if(ui.drawer&&event.key==='Tab'){const dialog=app.querySelector('.inspect-sheet'),items=dialog?.querySelectorAll('button:not(:disabled),summary');if(items?.length){const first=items[0],last=items[items.length-1];if(event.shiftKey&&event.target===first){event.preventDefault();last.focus();}else if(!event.shiftKey&&event.target===last){event.preventDefault();first.focus();}}}if(ui.mode==='battle'&&(event.key==='Enter'||event.key===' ')){const u=event.target.closest('[data-unit]');if(u&&!event.target.closest('[data-act]')){event.preventDefault();u.click();if(!ui.drawer)app.querySelector(ui.handIid?'[data-act=usehand]:not(:disabled)':'[data-act=attack]:not(:disabled)')?.focus();return;}}if(ui.mode==='select'&&(event.key==='Enter'||event.key===' ')){const c=event.target.closest('[data-character]');if(c){event.preventDefault();pickCharacter(c.dataset.character);}}});
app.addEventListener('input',event=>{if(event.target.matches?.('[data-character-search]')){const q=event.target.value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');app.querySelectorAll('[data-character-name]').forEach(a=>{a.hidden=!a.dataset.characterName.normalize('NFD').replace(/[\u0300-\u036f]/g,'').includes(q);});}});
G.PresentationFX?.init();G.Soundtrack?.init();G.Sanctuary?.applyCosmetics();menu();G.VisualShell?.boot();
})(globalThis.GOGHOS);
