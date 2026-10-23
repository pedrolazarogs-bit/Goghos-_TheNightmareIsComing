// Interface: mostra o estado e encaminha as interações para as regras do núcleo.
(function(G){
const app=document.getElementById('app');
let dockObserver=null;
const ui={mode:'menu',state:null,sel:null,timer:null,target:null,handIid:null,healTarget:null,mana:0,move:false,swapPick:null,msg:'',notice:'',busy:false,paused:false,actor:null};
const show=html=>{app.innerHTML=html;};
const btn=(act,label,disabled=false,cls='')=>`<button class="${cls}" data-act="${act}"${disabled?' disabled':''}>${label}</button>`;
const card=G.cardHTML;
const toTop=()=>globalThis.scrollTo?.({top:0,behavior:'instant'});
const clearPick=()=>{ui.target=null;ui.handIid=null;ui.healTarget=null;ui.mana=0;ui.move=false;ui.swapPick=null;};
function wipe(){clearTimeout(ui.timer);dockObserver?.disconnect();clearPick();Object.assign(ui,{state:null,sel:null,msg:'',notice:'',busy:false,paused:false,actor:null});}
function syncDockHeight(){
  const arena=app.querySelector('.arena'),dock=app.querySelector('.mao');
  if(arena&&dock){const h=Math.ceil(dock.getBoundingClientRect().height+24)+'px';if(arena.style.getPropertyValue('--hand-height')!==h)arena.style.setProperty('--hand-height',h);}
}
function menu(){wipe();ui.mode='menu';show(`<section class="center"><div class="logo"><img src="assets/logo/logo.png" alt="GOGHOS — The Nightmare Is Coming"></div><p class="menu-description">Escolha seus personagens, forme sua equipe e proteja a Daly Mãe.</p>${btn('play','Jogar',false,'big')}${btn('sark-test','Testar Sark',false,'big')}${btn('characters','Personagens',false,'big')}${btn('shop','Loja',false,'big')}<p class="ver">Versão ${G.CONFIG.version}</p></section>`);toTop();}
function characters(){ui.mode='characters';show(`<section class="collection"><h1>Personagens</h1><p>Cartas montadas com as ilustrações recebidas. Steel Jaw, do Sark, já está ativa.</p><div class="collection-grid">${G.CHARACTERS.filter(c=>c.illustrated).map(c=>`<article>${card(c)}<h2>${c.name}</h2><p>${G.RARITY_LABEL[c.rarity]} · ${G.CLASS_LABEL[c.class]}</p><p class="collection-ability">${G.getMainAbility(c)?.description||'Habilidade em desenvolvimento.'}</p></article>`).join('')}</div>${btn('menu','Voltar')}</section>`);}
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
  const outcome=e.type==='dodge'?'ESQUIVOU':`−${e.damage} ${e.type==='daly-hit'?'VIDA DA DALY MÃE':'DE VIDA'}`;
  const r=e.reaction,reply=r?`<div class="reaction-message"><span>${r.sourceName} <b>↩</b> ${r.targetName} · ${r.ability}</span><strong>${r.instant?'ELIMINAÇÃO INSTANTÂNEA':'−'+r.amount+' DE VIDA'}</strong><small>${r.beforeHp} → ${r.afterHp}${r.type==='defeat'?' · eliminado permanentemente':''}</small></div>`:'';
  return `<div class="combat-message ${ui.busy?'playing':''}" role="status"><span>${e.actorName} <b>→</b> ${e.targetName}</span><strong>${outcome}</strong><small>${e.beforeHp} → ${e.afterHp}${e.type==='defeat'?' · eliminado permanentemente':''}</small>${reply}</div>`;
}
function render(actor){
  dockObserver?.disconnect();
  const scroll=app.querySelector('.arena')?.scrollTop||0;
  const excludedOpen=app.querySelector('.elim')?.open||false;
  const logScroll=app.querySelector('.log-list')?.scrollTop||0;
  ui.mode='battle';const s=ui.state,choice=s.deck.pendingChoice,pd=s.support.pending;
  const free=!s.result&&!s.recovery&&!s.formation&&!choice&&!pd&&!ui.busy&&!ui.paused;
  const idle=G.isIdleBattle(s),mine=free&&(actor?.team==='player'||idle),mage=mine&&actor?.class==='MAGO';
  ui.mana=mage?Math.min(ui.mana,actor.mana):0;
  const inst=selectedHand(),support=inst&&G.getResetCard(inst.id).type==='SUPPORT'?G.getSupportCard(inst.id):null;
  const e=ui.busy?s.lastEvent:null,B=G.getBoard(s);
  const cell=u=>{
    const reply=e?.reaction?.targetUid===u.uid?e.reaction:null,hit=e?.targetUid===u.uid,acting=e?.actorUid===u.uid,heal=u.team==='player'&&u.hp>0&&u.hp<u.maxHp&&((mine&&support?.effect==='heal')||pd?.candidates.includes(u.uid));
    const cls=(actor?.uid===u.uid&&!ui.busy?'active ':'')+([ui.target,ui.healTarget,ui.swapPick].includes(u.uid)?'target ':'')+(mine&&actor&&u.team==='enemy'&&u.row==='front'?'pick ':'')+(heal?'heal ':'')+(mine&&ui.move&&u.team==='player'&&G.canTransit(u)?'swp':'');
    const fx=reply?`<span class="combat-float reaction ${reply.type}">${reply.instant?'ELIMINADO':'−'+reply.amount}<small>${reply.ability}</small></span>`:hit?`<span class="combat-float ${e.type}">${e.type==='dodge'?'ESQUIVA':'−'+e.damage}</span>`:'';
    const status=reply|| (hit?e:null);
    return `<div class="cell ${status?'event-'+status.type:''} ${acting?'event-actor':''}">${card(u,cls,`Vida ${u.hp}/${u.maxHp} · ${u.passiveOnly?'Reativo':'V'+u.speed}`)}${fx}<div class="hp-track" aria-hidden="true"><i style="--before:${(status?status.beforeHp:u.hp)/u.maxHp*100}%;width:${Math.max(0,u.hp/u.maxHp*100)}%"></i></div></div>`;
  };
  const row=(side,where)=>{
    const live=B[side][where],list=[...live],max=where==='front'?3:2;
    for(const event of [e,e?.reaction])if(event?.type==='defeat'&&event.targetTeam===side&&event.targetRow===where){const ghost=G.getUnit(s,event.targetUid);if(ghost&&!list.includes(ghost))list.push(ghost);}
    const caption=where==='front'?`Linha de frente · ${live.length}/3`:`Retaguarda · ${live.length}/2 · só Suportes`;
    return `<div class="formation-row ${where}"><p class="lbl">${caption}</p><div class="frow">${list.map(cell).join('')}${Array.from({length:Math.max(0,max-list.length)},()=>G.emptyCardHTML('Vaga da '+(where==='front'?'linha de frente':'retaguarda'),where==='front'?'Defesa':'Suporte')).join('')}</div></div>`;
  };
  const side=t=>{
    const hit=e?.targetUid===G.dalyTargetId(t);
    return `<div class="side ${t}"><h3 class="team-label">${t==='player'?'Sua equipe':'Adversário'}</h3>${row(t,'front')}${row(t,'rear')}<div class="daly-feedback ${hit?'event-daly-hit':''}">${G.dalyHTML(s,t,{pick:mine&&t==='enemy'&&G.isDalyExposed(s,t),target:ui.target===G.dalyTargetId(t)})}${hit?'<span class="daly-float">−1 VIDA</span>':''}<p class="rear-count">Retaguarda · ${B[t].rear.length}/2 · Suportes</p></div></div>`;
  };
  let info=ui.busy?(e?.reaction?'Confira o ataque e a resposta automática de Steel Jaw.':'Confira o resultado do ataque. A próxima ação começa em instantes.'):ui.paused?'Batalha pausada. Continue quando estiver pronto.':choice?'Mão cheia: escolha uma carta para substituir ou descarte a nova.':s.formation?'Escolha os Suportes que vão defender a linha de frente.':s.recovery?'A batalha aguarda a recuperação da Daly Mãe.':pd?`Brisa: escolha um aliado ferido para curar +${pd.value} de Vida.`:idle?'Não há personagens capazes de atacar. Use suas medalhas ou avance o ciclo para ambas as equipes comprarem uma carta.':mine?ui.move?'Toque em um Suporte para mudar de linha. Se a linha estiver cheia, escolha outro Suporte para trocar.':`Vez de ${actor.name}. Escolha um alvo e confirme o ataque.`:actor?`${actor.name}, do adversário, está preparando a jogada…`:'Aguardando…';
  let actions=pd&&!ui.busy?btn('brisaskip','Dispensar cura da Brisa'):mine?idle?btn('idle-cycle','Avançar ciclo · comprar cartas',s.deck.pile.length===0):btn('attack','Confirmar ataque',!ui.target||ui.move)+btn('move',ui.move?'Concluir posições':'Mover Suportes',!B.player.front.concat(B.player.rear).some(G.canTransit)):'';
  if(idle&&s.deck.pile.length===0)info+=' O monte principal acabou; as medalhas na mão ainda podem ser resgatadas.';
  if(ui.busy&&e?.reaction){const r=e.reaction;info=`${e.actorName} causou ${e.damage} de dano em ${e.targetName}. ${r.sourceName} reagiu com ${r.ability}: ${r.instant?r.targetName+' foi eliminado instantaneamente':r.targetName+' recebeu '+r.amount+' de dano'+(r.type==='defeat'?' e foi eliminado':'')}.`;}
  if(mage&&ui.target!=='daly_enemy')actions+=btn('mana-','− Mana',ui.mana<=0)+`<span>Mana no ataque: ${ui.mana}/${actor.mana}</span>`+btn('mana+','+ Mana',ui.mana>=actor.mana);
  if(mine&&actor&&ui.target){const target=G.getUnit(s,ui.target),dodge=target&&G.dodgeInfo(actor,target),damage=G.previewDamage(s,actor,ui.mana),reply=target&&G.reactionPreview(actor,target,damage);info+=ui.target==='daly_enemy'?' A Daly Mãe perderá exatamente 1 vida.':` Dano previsto: ${damage}.${dodge?' O alvo pode esquivar.':''}${reply?` ${target.name} sobrevive e reage com ${reply.ability}: ${reply.instant?'seu atacante será eliminado instantaneamente':reply.damage+' de dano no seu atacante'}.`:target&&G.getMainAbility(target)?.trigger==='onAttacked'?` Golpe fatal: ${target.name} será eliminado sem revidar.`:''}`;}
  const logs=s.log.slice(-12).reverse().map((line,i)=>`<div class="battle-event${i===0?' latest':''}"><span>✧</span><p>${line}</p></div>`).join('');
  const pendingPanel=!ui.busy&&(s.recovery?.side==='player'?G.recoveryHTML(s):s.formation?.side==='player'?G.formationHTML(s):'');
  const modal=pendingPanel?`<div class="choice-overlay"><section class="choice-dialog" role="dialog" aria-modal="true" aria-labelledby="${s.recovery?'recovery-title':'formation-title'}">${pendingPanel}${ui.msg?`<p class="msg">${ui.msg}</p>`:''}</section></div>`:'';
  show(`<main class="arena"><header class="arena-header"><div class="arena-brand"><span>GOGHOS</span><small>The Nightmare Is Coming</small></div><div class="arena-round">${G.arenaArtHTML('trophy')}<span>Rodada <b>${s.round}</b></span></div><nav aria-label="Controles da batalha">${btn('pause',ui.paused?'Continuar':'Pausar')}${btn('menu','Menu')}</nav></header><aside class="arena-left">${G.characterPilesHTML(s)}<div class="history-panel"><div class="event-feed"><h4>Registro da batalha</h4>${combatMessage(s)}<div class="log-list">${logs||'<p class="history-empty">Escolha seu primeiro alvo. Cada ação da batalha aparece aqui.</p>'}</div></div>${G.eliminatedHTML(s,!!e)}</div>${G.handPanelHTML(s,ui.handIid,handDetail(mine))}</aside><section class="battle-board" aria-label="Campo de batalha">${side('enemy')}<div class="arena-divider" aria-hidden="true"><i></i><span>✦</span><i></i></div>${side('player')}<div class="turn-guide"><p class="info" role="status">${info}</p><div class="battle-actions">${actions}</div><p class="msg">${ui.msg}</p><p class="notice" role="status">${ui.notice}</p></div></section><aside class="arena-right">${G.turnPanelHTML(s,actor,ui.busy)}${G.mainPileHTML(s)}${G.actorInfoHTML(s,actor,ui.busy)}</aside>${modal}</main>`);
  const arena=app.querySelector('.arena'),dock=app.querySelector('.mao');
  syncDockHeight();
  if(arena)arena.scrollTop=scroll;
  if(dock&&typeof ResizeObserver!=='undefined'){dockObserver=new ResizeObserver(syncDockHeight);dockObserver.observe(dock);}
  const excluded=app.querySelector('.elim'),log=app.querySelector('.log-list');
  if(excluded)excluded.open=excludedOpen||e?.type==='defeat'||e?.reaction?.type==='defeat';
  if(log)log.scrollTop=logScroll;
}
function feedback(){
  clearTimeout(ui.timer);ui.busy=true;ui.notice='';clearPick();render(null);
  ui.timer=setTimeout(()=>{ui.busy=false;step();},G.CONFIG.pacing.feedback*(ui.state.lastEvent?.reaction?2:1));
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
  if(actor?.team==='enemy')ui.timer=setTimeout(()=>{
    const redeemed=G.AI.redeemMedals(s,'enemy');
    const attack=()=>{const r=G.AI.takeTurn(s,actor);if(r.ok){ui.msg='';feedback();}else{ui.msg=r.error;render(actor);}};
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
    if(a==='sark-enemy'||a==='sark-player'){wipe();ui.state=G.createSarkTestState(a==='sark-player'?'player':'enemy');step();toTop();return;}
    if(a==='characters'){characters();return;}
    if(a==='shop'){show(G.shopHTML());return;}
    if(a==='fight'){const teams=G.selectionTeams(ui.sel);if(!teams)return;ui.state=G.createBattleState(teams.player,teams.enemy);clearPick();step();toTop();return;}
    if(ui.mode!=='battle')return;const s=ui.state;
    if(a==='pause'){ui.paused=!ui.paused;if(ui.busy)render(null);else step();return;}
    if(ui.busy)return;
    if(a==='keep-new'){finishChoice(G.resolveHandReplacement(s,null));return;}
    if(a.startsWith('recover-')){if(s.recovery?.side==='player')finishChoice(G.performRecovery(s,a.slice(8)));return;}
    if(a.startsWith('advance-')){if(s.formation?.side==='player')finishChoice(G.resolveFrontLine(s,a==='advance-all'?[...s.formation.candidates]:[a.slice(8)]));return;}
    if(a==='brisaskip'){finishChoice(G.resolveBrisa(s,null));return;}
    const actor=G.getNextActor(s);if(ui.paused||!G.canManageTeam(s,'player'))return;
    if(a==='idle-cycle'){finishChoice(G.advanceIdleCycle(s));return;}
    if(a==='attack'&&!actor)return;
    if(a==='attack'){const r=G.performBasicAttack(s,actor.uid,ui.target,ui.mana);if(r.ok){ui.msg='';feedback();}else{ui.msg=r.error;render(actor);}return;}
    if(a==='move'){ui.move=!ui.move;ui.target=null;ui.handIid=null;ui.healTarget=null;ui.swapPick=null;ui.msg='';render(actor);return;}
    if(a==='redeem'){const inst=selectedHand();if(inst)finishChoice(G.resolveDalle(s,'player',inst));return;}
    if(a==='usehand'){finishChoice(G.performHandSupport(s,ui.handIid,ui.healTarget));return;}
    if(a==='mana+'||a==='mana-'){ui.mana=Math.max(0,Math.min(actor.mana,ui.mana+(a==='mana+'?1:-1)));render(actor);return;}
    return;
  }
  if(ui.mode==='select'){if(c)pickCharacter(c.dataset.id);return;}
  if(ui.mode!=='battle')return;const s=ui.state;
  if(ui.busy)return;
  if(s.deck.pendingChoice){if(hand)finishChoice(G.resolveHandReplacement(s,hand.dataset.hand));return;}
  const actor=G.getNextActor(s),mine=!ui.paused&&G.canManageTeam(s,'player');
  if(hand){ui.handIid=ui.handIid===hand.dataset.hand?null:hand.dataset.hand;ui.healTarget=null;ui.move=false;ui.msg='';render(actor);return;}
  const u=c?G.getUnit(s,c.dataset.id):null;
  if(s.support.pending){if(u&&s.support.pending.candidates.includes(u.uid))finishChoice(G.resolveBrisa(s,u.uid));return;}
  if(!mine)return;
  if(daly&&daly.dataset.daly==='enemy'&&G.isDalyExposed(s,'enemy')){ui.target='daly_enemy';ui.mana=0;ui.move=false;render(actor);return;}
  if(!u)return;
  const inst=selectedHand(),support=inst&&G.getResetCard(inst.id).type==='SUPPORT'?G.getSupportCard(inst.id):null;
  if(support?.effect==='heal'&&u.team==='player'){
    ui.healTarget=u.hp>0&&u.hp<u.maxHp?u.uid:null;ui.msg=ui.healTarget?'':'Escolha um aliado ferido.';render(actor);return;
  }
  if(ui.move&&u.team==='player'){
    const r=ui.swapPick&&ui.swapPick!==u.uid?G.performSwap(s,ui.swapPick,u.uid):G.performTransit(s,u.uid);
    ui.msg=r.ok?'':r.error;
    if(r.ok){ui.swapPick=null;ui.notice=s.log.at(-1);step();}else{ui.swapPick=G.canTransit(u)?u.uid:null;render(actor);}return;
  }
  if(u.team==='enemy'&&u.row==='front'&&u.hp>0){ui.target=u.uid;render(actor);}
});
app.addEventListener('keydown',event=>{if(ui.mode==='select'&&(event.key==='Enter'||event.key===' ')){const c=event.target.closest('[data-character]');if(c){event.preventDefault();pickCharacter(c.dataset.character);}}});
menu();
})(globalThis.GOGHOS);
