// Interface: mostra o estado e encaminha as interações para as regras do núcleo.
(function(G){
const app=document.getElementById('app');
let dockObserver=null;
const ui={mode:'menu',state:null,sel:null,timer:null,target:null,handIid:null,healTarget:null,mana:0,attackMode:'normal',abilityTarget:null,move:false,swapPick:null,msg:'',notice:'',busy:false,paused:false,actor:null};
const show=html=>{app.innerHTML=html;};
const btn=(act,label,disabled=false,cls='')=>`<button class="${cls}" data-act="${act}"${disabled?' disabled':''}>${label}</button>`;
const card=G.cardHTML;
const toTop=()=>globalThis.scrollTo?.({top:0,behavior:'instant'});
const clearPick=()=>{ui.target=null;ui.handIid=null;ui.healTarget=null;ui.mana=0;ui.attackMode='normal';ui.abilityTarget=null;ui.move=false;ui.swapPick=null;};
function wipe(){clearTimeout(ui.timer);dockObserver?.disconnect();clearPick();Object.assign(ui,{state:null,sel:null,msg:'',notice:'',busy:false,paused:false,actor:null});}
function syncDockHeight(){
  const arena=app.querySelector('.arena'),dock=app.querySelector('.mao');
  if(arena&&dock){const h=Math.ceil(dock.getBoundingClientRect().height+24)+'px';if(arena.style.getPropertyValue('--hand-height')!==h)arena.style.setProperty('--hand-height',h);}
}
function menu(){wipe();ui.mode='menu';show(`<section class="center"><div class="logo"><img src="assets/logo/logo.png" alt="GOGHOS — The Nightmare Is Coming"></div><p class="menu-description">Escolha seus personagens, forme sua equipe e proteja a Daly Mãe.</p>${btn('play','Jogar',false,'big')}${btn('ability-test','Testar Elétrica e John',false,'big')}${btn('new-abilities','Testar novos personagens',false,'big')}${btn('sark-test','Testar Sark',false,'big')}${btn('characters','Personagens',false,'big')}${btn('shop','Loja',false,'big')}<p class="ver">Versão ${G.CONFIG.version}</p></section>`);toTop();}
function characters(){ui.mode='characters';show(`<section class="collection"><h1>Personagens</h1><p>Confira as habilidades já implementadas e as bases recebidas para cada personagem.</p><div class="collection-grid">${G.CHARACTERS.filter(c=>c.illustrated).map(c=>`<article>${card(c)}<h2>${c.name}</h2><p>${G.RARITY_LABEL[c.rarity]} · ${G.CLASS_LABEL[c.class]}</p><p class="collection-ability">${G.getMainAbility(c)?.description||'Habilidade em desenvolvimento.'}</p></article>`).join('')}</div>${btn('menu','Voltar')}</section>`);}
function abilityTest(ids=['eletric','john']){
  wipe();ui.mode='ability-test';show(`<section class="ability-tests">${btn('menu','Voltar ao menu')}<h1>Teste de habilidades</h1><div class="ability-tests-grid">${ids.map(id=>{const c=G.getCharacterById(id);return `<article>${card(c)}<h2>${c.name}</h2><p>${G.getMainAbility(c).description}</p>${id==='john'?'<p>Parry: dado de 6 lados, defende com 1 ou 2. Não funciona enquanto John mantém o machado cravado.</p>':''}${btn('lab-'+id,'Testar '+c.name)}</article>`;}).join('')}</div></section>`);toTop();
}
function sarkTest(){
  wipe();ui.mode='sark-test';const c=G.getCharacterById('sarck');
  show(`<section class="ability-lab">${btn('menu','Voltar ao menu')}<h1>Steel Jaw</h1><div class="ability-lab-content"><div>${card(c)}</div><article>${G.actorPortraitHTML(c)}<h2>Sark · Lendário</h2><p>Assassino · 530 de Vida · 5 de fôlego</p><p>${G.getMainAbility(c).description}</p><p>Sem ataque básico ou velocidade. Escolha se quer atacar o Sark ou observar a defesa dele contra um Raro, um Lendário e um Comum.</p>${btn('sark-enemy','Eu ataco o Sark')}${btn('sark-player','Sark na minha equipe')}</article></div></section>`);toTop();
}
function startMatch(){wipe();ui.mode='select';const r=G.createSelection();if(!r.ok){show(`<section><p>${r.error}</p>${btn('menu','Menu')}</section>`);return;}ui.sel=r.sel;selectionScreen();toTop();}
function selectionScreen(){
  const sel=ui.sel,turn=G.selectionTurn(sel);
  const cards=sel.offered.map(id=>{
    const side=sel.picks.player.includes(id)?'player':sel.picks.enemy.includes(id)?'enemy':null;
    const label=side?`${side==='player'?'Você':'Bot'} · ${sel.picks[side].indexOf(id)+1}ª escolha`:turn==='player'?'Sua vez · escolher':turn==='enemy'?'Bot escolhendo…':'Disponível';
    return `<div class="selection-pick ${side||''}" role="button" tabindex="${turn==='player'&&!side?0:-1}" data-character="${id}" aria-label="${G.getCharacterById(id).name}: ${label}" aria-disabled="${!!side||turn!=='player'}">${card(G.getCharacterById(id),side?'sel chosen-'+side:'',label)}</div>`;
  }).join('');
  show(`<section class="selection" aria-label="Seleção alternada de personagens Comuns">${btn('menu','Voltar ao menu')}<div class="row">${cards}</div>${G.selectionDone(sel)?btn('fight','Play · começar batalha',false,'start-battle'):''}</section>`);
}
function selectAdvance(){clearTimeout(ui.timer);selectionScreen();if(G.selectionTurn(ui.sel)==='enemy')ui.timer=setTimeout(()=>{G.selectionBotPick(ui.sel);selectAdvance();},1000);}
function pickCharacter(id){if(!ui.sel||G.selectionTurn(ui.sel)!=='player')return;const r=G.selectionPick(ui.sel,'player',id);if(r.ok)selectAdvance();}
function selectedHand(){return ui.state?.deck.hands.player.find(c=>c.iid===ui.handIid)||null;}
function handDetail(mine){
  const inst=selectedHand();if(!inst)return '';
  const s=ui.state,def=G.getResetCard(inst.id);
  let detail=`<div class="hand-detail"><strong>${def.name}</strong><p>${def.description}</p>`;
  if(def.type==='DALY'){
    const why=G.medalBlockReason(s,'player',inst);
    detail+=`${why?`<p class="msg">${why}</p>`:''}${btn('redeem','Resgatar personagem '+G.RARITY_LABEL[def.rarity],!mine||!!why)}`;
  }else if(def.type==='SUPPORT'){
    const support=G.getSupportCard(def.id),heal=support.effect==='heal';
    detail+=`${heal?'<p>Escolha uma carta aliada ferida na arena.</p>':''}${btn('usehand','Usar '+def.name,!mine||(heal&&!ui.healTarget)||s.support.usedTurn===s.turn)}`;
  }else detail+='<p>O efeito desta carta ainda está em desenvolvimento. Ela pode ser substituída quando a mão encher.</p>';
  if(!mine)detail+='<small>Você pode usar cartas na vez da sua equipe.</small>';
  return detail+'</div>';
}
function combatMessage(s){
  const e=s.lastEvent;if(!e)return '<div class="combat-message idle">Os personagens mais rápidos agem primeiro.</div>';
  const lines=G.eventImpacts(e).map((x,i)=>`<div class="${x.ability==='Steel Jaw'?'reaction-message':'impact-message'}"><span>${x.sourceName||x.actorName} <b>→</b> ${x.targetName}${x.kind==='pin-damage'?' · machado cravado':''}</span><strong>${x.type==='heal'?'+'+x.healed+' DE VIDA':x.instant?'ELIMINAÇÃO INSTANTÂNEA':x.type==='parry'?'PARRY · DEFENDEU':x.type==='dodge'?'ESQUIVOU':'−'+(x.amount??x.damage)+(x.type==='daly-hit'?' VIDA DA DALY MÃE':' DE VIDA')}</strong><small>${x.beforeHp} → ${x.afterHp}${x.parry?' · dado '+x.parry.roll+'/6':''}${x.armor?' · armadura: '+x.armor.incoming+' → '+x.armor.damage:''}${x.type==='defeat'?' · eliminado permanentemente':''}</small></div>`).join('');
  return `<div class="combat-message ${ui.busy?'playing':''}" role="status">${e.type==='fright'?'<b>Susto · '+e.actorName+'</b><p>'+e.results.map(r=>r.name+': dado '+r.roll+' · '+(r.scared?'assustado':'resistiu')).join('<br>')+'</p><strong>+'+e.bonus+' ataque · +'+e.speedBonus+' velocidade</strong>':e.type==='wait'?'<b>'+e.actorName+' passou a vez: sem alvo acessível</b>':e.type==='area'?'<b>3000W · ataque em área</b>':e.type==='pin-keep'?'<b>John manteve o machado</b>':e.type==='pin-skip'?'<b>'+e.actorName+' passou a vez: imobilizado</b>':''}${lines}</div>`;
}
function render(actor){
  dockObserver?.disconnect();
  const scroll=app.querySelector('.arena')?.scrollTop||0;
  const excludedOpen=app.querySelector('.elim')?.open||false;
  const logScroll=app.querySelector('.log-list')?.scrollTop||0;
  ui.mode='battle';const s=ui.state,choice=s.deck.pendingChoice,pd=s.support.pending;
  const entry=G.pendingCharacterAbility(s),free=!s.result&&!s.recovery&&!s.formation&&!choice&&!pd&&!entry&&!ui.busy&&!ui.paused;
  const idle=G.isIdleBattle(s),playerTurn=free&&actor?.team==='player',pinned=playerTurn&&actor.pinnedBy,holding=playerTurn&&actor.pinning,mine=free&&((actor?.team==='player'&&!pinned&&!holding)||idle),mage=mine&&actor?.class==='MAGO',area=mine&&G.getMainAbility(actor||{})?.trigger==='areaAttack',pinAttack=mine&&G.getMainAbility(actor||{})?.trigger==='pinAttack';
  ui.mana=mage?Math.min(ui.mana,actor.mana):0;
  const inst=selectedHand(),support=inst&&G.getResetCard(inst.id).type==='SUPPORT'?G.getSupportCard(inst.id):null;
  const e=ui.busy?s.lastEvent:null,B=G.getBoard(s),impacts=G.eventImpacts(e);
  const cell=u=>{
    const hits=impacts.filter(x=>x.targetUid===u.uid),status=hits.at(-1),acting=e?.actorUid===u.uid,heal=u.team==='player'&&u.hp>0&&u.hp<u.maxHp&&((mine&&support?.effect==='heal')||(mine&&ui.attackMode==='heal'&&G.healingTargets(s,actor).includes(u))||pd?.candidates.includes(u.uid));
    const cls=(actor?.uid===u.uid&&!ui.busy?'active ':'')+([ui.target,ui.healTarget,ui.swapPick].includes(u.uid)?'target ':'')+(mine&&actor&&!area&&ui.attackMode!=='heal'&&!actor.abilityOnly&&G.attackTargets(s,actor).includes(u)?'pick ':'')+(area&&G.attackTargets(s,actor).includes(u)?'area-target ':'')+(heal?'heal ':'')+(mine&&ui.move&&u.team==='player'&&G.canTransit(u)?'swp':'');
    const fx=hits.map((x,i)=>`<span class="combat-float ${x.ability==='Steel Jaw'?'reaction ':''}${x.type}" style="top:${18+i*27}%">${x.type==='heal'?'+'+x.healed:x.instant?'ELIMINADO':x.type==='parry'?'PARRY':x.type==='dodge'?'ESQUIVA':'−'+(x.amount??x.damage)}${x.ability?`<small>${x.ability}</small>`:''}</span>`).join('');
    const link=u.pinnedBy?`<span class="pin-status" title="Cravado por ${G.getUnit(s,u.pinnedBy)?.name} · sem ação · −20 de Vida após cada ação">Imobilizado</span>`:u.pinning?`<span class="pin-status holding" title="Mantendo machado em ${G.getUnit(s,u.pinning)?.name} · sem Parry">Vulnerável</span>`:'';
    return `<div class="cell ${status?'event-'+status.type:''} ${acting?'event-actor':''}">${card(u,cls,`Vida ${u.hp}/${u.maxHp} · ${u.passiveOnly?'Reativo':'V'+u.speed}`)}${fx}<div class="hp-track" aria-hidden="true"><i style="--before:${(hits[0]?.beforeHp??u.hp)/u.maxHp*100}%;width:${Math.max(0,u.hp/u.maxHp*100)}%"></i></div>${link}${u.duelId?'<span class="dimension-status">Duelo dimensional</span>':''}${s.units.some(a=>a.bookTarget===u.uid&&a.hp>0)?'<span class="book-status">Nome no livro</span>':''}</div>`;
  };
  const row=(side,where)=>{
    const live=B[side][where],list=[...live],max=where==='front'?3:2;
    const ghosts=impacts.filter(x=>x.type==='defeat'&&x.targetTeam===side&&x.targetRow===where).map(x=>G.getUnit(s,x.targetUid)).filter(Boolean);
    const unique=[...new Set(ghosts)];if(unique.length){list.splice(0,list.length,...unique,...live.filter(u=>!unique.includes(u)).slice(0,max-unique.length));list.sort((a,b)=>a.slot-b.slot);}
    const caption=where==='front'?`Linha de frente · ${live.length}/3`:`Retaguarda · ${live.length}/2 · só Suportes`;
    return `<div class="formation-row ${where}"><p class="lbl">${caption}</p><div class="frow">${list.map(cell).join('')}${Array.from({length:Math.max(0,max-list.length)},()=>G.emptyCardHTML('Vaga da '+(where==='front'?'linha de frente':'retaguarda'),where==='front'?'Defesa':'Suporte')).join('')}</div></div>`;
  };
  const side=t=>{
    const hit=e?.targetUid===G.dalyTargetId(t);
    return `<div class="side ${t}"><h3 class="team-label">${t==='player'?'Sua equipe':'Adversário'}</h3>${row(t,'front')}${row(t,'rear')}<div class="daly-feedback ${hit?'event-daly-hit':''}">${G.dalyHTML(s,t,{pick:mine&&!actor?.duelId&&!actor?.abilityOnly&&t==='enemy'&&G.isDalyExposed(s,t),target:ui.target===G.dalyTargetId(t)})}${hit?'<span class="daly-float">−1 VIDA</span>':''}<p class="rear-count">Retaguarda · ${B[t].rear.length}/2 · Suportes</p></div></div>`;
  };
  let info=ui.busy?(e?.reaction?'Confira o ataque e a resposta automática de Steel Jaw.':'Confira o resultado do ataque. A próxima ação começa em instantes.'):ui.paused?'Batalha pausada. Continue quando estiver pronto.':choice?'Mão cheia: escolha uma carta para substituir ou descarte a nova.':s.formation?'Escolha os Suportes que vão defender a linha de frente.':s.recovery?'A batalha aguarda a recuperação da Daly Mãe.':pd?`Brisa: escolha um aliado ferido para curar +${pd.value} de Vida.`:idle?'Não há personagens capazes de atacar. Use suas medalhas ou avance o ciclo para ambas as equipes comprarem uma carta.':mine?ui.move?'Toque em um Suporte para mudar de linha. Se a linha estiver cheia, escolha outro Suporte para trocar.':`Vez de ${actor.name}. Escolha um alvo e confirme o ataque.`:actor?`${actor.name}, do adversário, está preparando a jogada…`:'Aguardando…';
  let actions=pd&&!ui.busy?btn('brisaskip','Dispensar cura da Brisa'):mine?idle?btn('idle-cycle','Avançar ciclo · comprar cartas',s.deck.pile.length===0):btn('attack','Confirmar ataque',!ui.target||ui.move)+btn('move',ui.move?'Concluir posições':'Mover Suportes',!B.player.front.concat(B.player.rear).some(G.canTransit)):'';
  if(idle&&s.deck.pile.length===0)info+=' O monte principal acabou; as medalhas na mão ainda podem ser resgatadas.';
  if(pinned){info=actor.name+' está cravado e não pode atacar, mover ou usar cartas. Passe a vez para continuar a batalha.';actions=btn('pinned-wait','Passar vez · imobilizado');}
  if(holding){info='John mantém o machado em '+G.getUnit(s,actor.pinning)?.name+'. Manter encerra sua ação; retirar libera os dois e permite atacar novamente.';actions=btn('pin-keep','Manter machado')+btn('pin-release','Retirar e escolher ataque');}
  const areaDaly=area&&!actor.duelId&&G.isDalyExposed(s,'enemy');
  if(area){info=areaDaly?'A Daly Mãe está exposta: este ataque retira exatamente 1 vida, sem gastar mana.':'3000W atinge todos os adversários da linha de frente. Aliados e retaguarda ficam protegidos. Dano por alvo: '+G.previewDamage(s,actor,ui.mana,null,ui.attackMode)+'.';actions=btn('attack',areaDaly?'Atacar Daly Mãe · 1 vida':'Atacar em área · 3000W');}
  if(pinAttack){actions=btn('mode-normal','Ataque normal · 80',false,ui.attackMode==='normal'?'on':'')+btn('mode-pin','Cravar machado · 80 + 20 por ação',ui.target==='daly_enemy',ui.attackMode==='pin'?'on':'')+actions;info+=' Modo: '+(ui.attackMode==='pin'?'cravar o machado se o golpe acertar e ambos sobreviverem.':'ataque normal.');}
  if(mine&&actor&&G.getMainAbility(actor)?.trigger==='healingAttack'){
    actions=btn('mode-normal','Atacar',false,ui.attackMode==='normal'?'on':'')+btn('mode-heal','Curar aliado · '+actor.damage,false,ui.attackMode==='heal'?'on':'')+actions;
    if(ui.attackMode==='heal')info='Escolha outro aliado ferido na mesma dimensão para curar até '+actor.damage+' de Vida. A cura usa a ação de Elysh.';
  }
  if(mine&&actor&&G.getMainAbility(actor)?.trigger==='doubleAttack'){
    actions=btn('mode-normal','Dois braços',false,ui.attackMode==='normal'?'on':'')+btn('mode-double',actor.doubleUsed?'Quatro braços · já usados':'Quatro braços · dano dobrado',actor.doubleUsed||ui.target==='daly_enemy',ui.attackMode==='double'?'on':'')+actions;
    info+=' Quatro braços: '+(actor.doubleUsed?'já usados nesta partida.':'uma única ativação disponível.');
  }
  if(mine&&actor?.abilityOnly){const target=G.getUnit(s,actor.bookTarget);info='Livro marcado: '+(target?.name||'aguardando nome')+'. A habilidade elimina abaixo de Mítico; nas demais raridades, causa 200.';actions=btn('attack','Usar livro · '+(target?.name||'sem alvo'),!target);}
  if(mine&&actor&&!G.hasActionTarget(s,actor)){info='Não há alvo acessível nesta dimensão. Passe a vez para continuar a hierarquia.';actions=btn('wait','Sem alvo · passar vez');}
  if(entry)info='Pré-batalha · '+G.getUnit(s,entry.actorUid)?.name+' está resolvendo a habilidade de entrada.';
  if(ui.busy&&e?.type==='area')info='3000W · '+impacts.map(x=>x.targetName+': '+(x.type==='parry'?'defendeu no Parry':x.instant?'eliminado':'−'+(x.amount??x.damage))).join(' · ');
  if(ui.busy&&e?.ticks?.length&&e.type!=='area')info=(e.type==='pin-keep'?'John manteve o machado. ':e.type==='pin-skip'?e.actorName+' passou a vez imobilizado. ':'')+e.ticks.map(x=>x.targetName+' recebeu '+x.amount+' de dano do machado'+(x.type==='defeat'?' e foi eliminado':'')+'.').join(' ');
  if(ui.busy&&e?.reaction&&e.type!=='area'){const r=e.reaction;info=`${e.actorName} causou ${e.damage} de dano em ${e.targetName}. ${r.sourceName} reagiu com ${r.ability}: ${r.instant?r.targetName+' foi eliminado instantaneamente':r.targetName+' recebeu '+r.amount+' de dano'+(r.type==='defeat'?' e foi eliminado':'')}.`;}
  if(mage&&!areaDaly&&ui.target!=='daly_enemy')actions+=btn('mana-','− Mana',ui.mana<=0)+`<span>Mana no ataque: ${ui.mana}/${actor.mana}</span>`+btn('mana+','+ Mana',ui.mana>=actor.mana);
  if(mine&&actor&&ui.target&&ui.attackMode!=='heal'){const target=G.getUnit(s,ui.target),dodge=target&&G.dodgeInfo(actor,target),damage=G.previewDamage(s,actor,ui.mana,target,ui.attackMode),reply=target&&G.reactionPreview(actor,target,damage);info+=ui.target==='daly_enemy'?' A Daly Mãe perderá exatamente 1 vida.':` Dano previsto: ${damage}.${dodge?' O alvo pode esquivar.':''}${reply?` ${target.name} sobrevive e reage com ${reply.ability}: ${reply.instant?'seu atacante será eliminado instantaneamente':reply.damage+' de dano no seu atacante'}.`:target&&G.getMainAbility(target)?.trigger==='onAttacked'?` Golpe fatal: ${target.name} será eliminado sem revidar.`:''}`;}
  if(mine&&actor&&ui.target){const parry=G.parryInfo(actor,G.getUnit(s,ui.target));if(parry)info+=' Parry do alvo: defende com 1–'+parry.threshold+' no dado de 6.';}
  const logs=s.log.slice(-12).reverse().map((line,i)=>`<div class="battle-event${i===0?' latest':''}"><span>✧</span><p>${line}</p></div>`).join('');
  const pendingPanel=!ui.busy&&(s.recovery?.side==='player'?G.recoveryHTML(s):s.formation?.side==='player'?G.formationHTML(s):'');
  const entryModal=!ui.busy&&!ui.paused&&!pendingPanel&&!s.recovery&&!s.formation&&!choice&&!pd?G.characterAbilityChoiceHTML(s,ui.abilityTarget):'';
  const modal=pendingPanel?`<div class="choice-overlay"><section class="choice-dialog" role="dialog" aria-modal="true" aria-labelledby="${s.recovery?'recovery-title':'formation-title'}">${pendingPanel}${ui.msg?`<p class="msg">${ui.msg}</p>`:''}</section></div>`:'';
  show(`<main class="arena"><header class="arena-header"><div class="arena-brand"><span>GOGHOS</span><small>The Nightmare Is Coming</small></div><div class="arena-round">${G.arenaArtHTML('trophy')}<span>Rodada <b>${s.round}</b></span></div><nav aria-label="Controles da batalha">${btn('pause',ui.paused?'Continuar':'Pausar')}${btn('menu','Menu')}</nav></header><aside class="arena-left">${G.characterPilesHTML(s)}<div class="history-panel"><div class="event-feed"><h4>Registro da batalha</h4>${combatMessage(s)}<div class="log-list">${logs||'<p class="history-empty">Escolha seu primeiro alvo. Cada ação da batalha aparece aqui.</p>'}</div></div>${G.eliminatedHTML(s,!!e)}</div>${G.handPanelHTML(s,ui.handIid,handDetail(mine))}</aside><section class="battle-board" aria-label="Campo de batalha">${side('enemy')}<div class="arena-divider" aria-hidden="true"><i></i><span>✦</span><i></i></div>${side('player')}<div class="turn-guide"><p class="info" role="status">${info}</p><div class="battle-actions">${actions}</div><p class="msg">${ui.msg}</p><p class="notice" role="status">${ui.notice}</p></div></section><aside class="arena-right">${G.turnPanelHTML(s,actor,ui.busy)}${G.mainPileHTML(s)}${G.actorInfoHTML(s,actor,ui.busy)}</aside>${modal}${entryModal}</main>`);
  const arena=app.querySelector('.arena'),dock=app.querySelector('.mao');
  syncDockHeight();
  if(arena)arena.scrollTop=scroll;
  if(dock&&typeof ResizeObserver!=='undefined'){dockObserver=new ResizeObserver(syncDockHeight);dockObserver.observe(dock);}
  const excluded=app.querySelector('.elim'),log=app.querySelector('.log-list');
  if(excluded)excluded.open=excludedOpen||impacts.some(x=>x.type==='defeat');
  if(log)log.scrollTop=logScroll;
}
function feedback(){
  clearTimeout(ui.timer);ui.busy=true;ui.notice='';clearPick();render(null);
  ui.timer=setTimeout(()=>{ui.busy=false;step();},G.CONFIG.pacing.feedback*(G.eventImpacts(ui.state.lastEvent).length>1?2:1));
}
function step(){
  clearTimeout(ui.timer);const s=ui.state;if(!s)return;
  let actor=G.getNextActor(s);
  if(!ui.paused&&G.isIdleBattle(s)&&G.canManageTeam(s,'enemy')){G.AI.redeemMedals(s,'enemy');actor=G.getNextActor(s);}
  ui.actor=actor;render(actor);
  if(s.result){ui.timer=setTimeout(result,G.CONFIG.pacing.feedback);return;}
  if(ui.paused)return;
  if(s.deck.pendingChoice)return;
  if(s.formation){if(s.formation.side==='enemy')ui.timer=setTimeout(()=>{G.AI.resolveFormation(s);step();},G.CONFIG.pacing.botThink);return;}
  if(s.recovery){if(s.recovery.side==='enemy')ui.timer=setTimeout(()=>{G.AI.resolveRecovery(s);step();},G.CONFIG.pacing.botThink);return;}
  if(s.support.pending)return;
  if(s.abilityChoices.length){if(s.abilityChoices[0].side==='enemy')ui.timer=setTimeout(()=>{const p=s.abilityChoices[0],r=G.AI.resolveCharacterAbility(s);if(r.ok&&p.type==='fright')feedback();else finishChoice(r);},G.CONFIG.pacing.botThink);return;}
  if(actor?.team==='enemy')ui.timer=setTimeout(()=>{
    const redeemed=G.AI.redeemMedals(s,'enemy');
    const attack=()=>{const r=G.AI.takeTurn(s,actor);if(r.pending){step();return;}if(r.ok){ui.msg='';feedback();}else{ui.msg=r.error;render(actor);}};
    if(s.abilityChoices.length){step();return;}
    if(redeemed.length){ui.notice='O adversário resgatou '+redeemed.map(r=>r.name).join(', ')+'.';render(actor);ui.timer=setTimeout(attack,G.CONFIG.pacing.botThink);}else attack();
  },G.CONFIG.pacing.botThink);
}
function result(){ui.mode='result';const f=ui.state.final,draw=ui.state.result==='draw';show(`<section class="center"><h1>${draw?'EMPATE':f.winner==='player'?'VITÓRIA':'DERROTA'}</h1><p>${draw?'Não há personagens capazes de atacar, o monte principal acabou e nenhuma equipe tem medalhas utilizáveis.':(f.loser==='player'?'Sua Daly Mãe':'A Daly Mãe adversária')+' perdeu todas as vidas.'}</p><p>Você: ${f.daly.player}/3 · adversário: ${f.daly.enemy}/3</p>${btn('play','Nova partida')}${btn('menu','Voltar ao menu')}</section>`);}
function cardOf(t){const c=t.closest('.card');if(c)return c;return t.closest('.slot')?.querySelector('.card')||null;}
function finishChoice(r){ui.msg=r.ok?'':r.error;ui.notice=r.ok?ui.state.log.at(-1):'';if(r.ok)clearPick();step();}
app.addEventListener('click',event=>{
  const t=event.target,b=t.closest('[data-act]'),hand=t.closest('[data-hand]'),c=cardOf(t),daly=t.closest('[data-daly]');
  if(b){
    if(b.disabled)return;const a=b.dataset.act;
    if(a==='menu'){if(ui.mode==='battle'&&!ui.state.result&&!confirm('Sair da batalha atual? O progresso será perdido.'))return;menu();return;}
    if(a==='play'){startMatch();return;}
    if(a==='sark-test'){sarkTest();return;}
    if(a==='ability-test'){abilityTest();return;}
    if(a==='new-abilities'){abilityTest(['penxy','cavaleiro','zikssy','elysh','ddx','vaglar']);return;}
    if(a.startsWith('lab-')&&['eletric','john','penxy','cavaleiro','zikssy','elysh','ddx','vaglar'].includes(a.slice(4))){wipe();ui.state=G.createAbilityTestState(a.slice(4));step();toTop();return;}
    if(a==='sark-enemy'||a==='sark-player'){wipe();ui.state=G.createSarkTestState(a==='sark-player'?'player':'enemy');step();toTop();return;}
    if(a==='characters'){characters();return;}
    if(a==='shop'){show(G.shopHTML());return;}
    if(a==='fight'){const teams=G.selectionTeams(ui.sel);if(!teams)return;ui.state=G.createBattleState(teams.player,teams.enemy);clearPick();step();toTop();return;}
    if(ui.mode!=='battle')return;const s=ui.state;
    if(a==='pause'){ui.paused=!ui.paused;if(ui.busy)render(null);else step();return;}
    if(ui.busy)return;
    if(a==='resolve-entry'){if(ui.paused)return;const p=G.pendingCharacterAbility(s);if(p?.side!=='player')return;const r=G.resolveCharacterAbility(s,p.actorUid,ui.abilityTarget);if(r.ok&&p.type==='fright')feedback();else{ui.abilityTarget=null;finishChoice(r);}return;}
    if(a==='keep-new'){finishChoice(G.resolveHandReplacement(s,null));return;}
    if(a.startsWith('recover-')){if(s.recovery?.side==='player')finishChoice(G.performRecovery(s,a.slice(8)));return;}
    if(a.startsWith('advance-')){if(s.formation?.side==='player')finishChoice(G.resolveFrontLine(s,a==='advance-all'?[...s.formation.candidates]:[a.slice(8)]));return;}
    if(a==='brisaskip'){finishChoice(G.resolveBrisa(s,null));return;}
    if(['pin-keep','pin-release','pinned-wait'].includes(a)){
      const actor=G.getNextActor(s);if(ui.paused||actor?.team!=='player')return;
      const r=a==='pin-keep'?G.keepPin(s,actor.uid):a==='pin-release'?G.withdrawPin(s,actor.uid):G.performPinnedTurn(s,actor.uid);
      if(r.ok&&a!=='pin-release'){ui.msg='';feedback();}else finishChoice(r);return;
    }
    const actor=G.getNextActor(s);if(ui.paused||!G.canManageTeam(s,'player'))return;
    if(a==='idle-cycle'){finishChoice(G.advanceIdleCycle(s));return;}
    if(a==='attack'&&!actor)return;
    if(['mode-normal','mode-pin','mode-heal','mode-double'].includes(a)){ui.attackMode=a.slice(5);ui.target=null;render(actor);return;}
    if(a==='wait'){const r=G.performWait(s,actor.uid);if(r.ok)feedback();else finishChoice(r);return;}
    if(a==='attack'){const r=ui.attackMode==='heal'?G.performHealingAttack(s,actor.uid,ui.target):G.performBasicAttack(s,actor.uid,ui.target,ui.mana,ui.attackMode);if(r.ok){ui.msg='';feedback();}else{ui.msg=r.error;render(actor);}return;}
    if(a==='move'){ui.move=!ui.move;ui.target=null;ui.handIid=null;ui.healTarget=null;ui.swapPick=null;ui.msg='';render(actor);return;}
    if(a==='redeem'){const inst=selectedHand();if(inst)finishChoice(G.resolveDalle(s,'player',inst));return;}
    if(a==='usehand'){finishChoice(G.performHandSupport(s,ui.handIid,ui.healTarget));return;}
    if(a==='mana+'||a==='mana-'){ui.mana=Math.max(0,Math.min(actor.mana,ui.mana+(a==='mana+'?1:-1)));render(actor);return;}
    return;
  }
  if(ui.mode==='select'){if(c)pickCharacter(c.dataset.id);return;}
  if(ui.mode!=='battle')return;const s=ui.state;
  if(ui.busy)return;
  const abilityTarget=t.closest('[data-ability-target]');if(abilityTarget&&!ui.paused&&G.pendingCharacterAbility(s)?.side==='player'){ui.abilityTarget=abilityTarget.dataset.abilityTarget;render(null);return;}
  if(s.deck.pendingChoice){if(hand)finishChoice(G.resolveHandReplacement(s,hand.dataset.hand));return;}
  const actor=G.getNextActor(s),mine=!ui.paused&&G.canManageTeam(s,'player');
  if(hand){ui.handIid=ui.handIid===hand.dataset.hand?null:hand.dataset.hand;ui.healTarget=null;ui.move=false;ui.msg='';render(actor);return;}
  const u=c?G.getUnit(s,c.dataset.id):null;
  if(s.support.pending){if(u&&s.support.pending.candidates.includes(u.uid))finishChoice(G.resolveBrisa(s,u.uid));return;}
  if(!mine)return;
  if(daly&&daly.dataset.daly==='enemy'&&G.isDalyExposed(s,'enemy')){ui.target='daly_enemy';ui.mana=0;ui.attackMode='normal';ui.move=false;render(actor);return;}
  if(!u)return;
  if(ui.attackMode==='heal'&&G.healingTargets(s,actor).includes(u)){ui.target=u.uid;render(actor);return;}
  const inst=selectedHand(),support=inst&&G.getResetCard(inst.id).type==='SUPPORT'?G.getSupportCard(inst.id):null;
  if(support?.effect==='heal'&&u.team==='player'){
    ui.healTarget=u.hp>0&&u.hp<u.maxHp?u.uid:null;ui.msg=ui.healTarget?'':'Escolha um aliado ferido.';render(actor);return;
  }
  if(ui.move&&u.team==='player'){
    const r=ui.swapPick&&ui.swapPick!==u.uid?G.performSwap(s,ui.swapPick,u.uid):G.performTransit(s,u.uid);
    ui.msg=r.ok?'':r.error;
    if(r.ok){ui.swapPick=null;ui.notice=s.log.at(-1);step();}else{ui.swapPick=G.canTransit(u)?u.uid:null;render(actor);}return;
  }
  if(G.attackTargets(s,actor).includes(u)&&ui.attackMode!=='heal'&&!actor.abilityOnly&&G.getMainAbility(actor)?.trigger!=='areaAttack'){ui.target=u.uid;render(actor);}
});
app.addEventListener('keydown',event=>{if(ui.mode==='select'&&(event.key==='Enter'||event.key===' ')){const c=event.target.closest('[data-character]');if(c){event.preventDefault();pickCharacter(c.dataset.character);}}});
menu();
})(globalThis.GOGHOS);
