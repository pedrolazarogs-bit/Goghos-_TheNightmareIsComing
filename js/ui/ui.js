// Interface: apenas desenha o estado e encaminha cliques para as funções de js/core.
(function(G){
const app=document.getElementById('app');
const ui={mode:'menu',msg:'',sel:null,teams:null,state:null,target:null,timer:null,swapMode:false,swapPick:null,sup:null,supTarget:null,mana:0,handIid:null,lastEventShown:0};
const show=h=>{app.innerHTML=h;};
const btn=(act,label,dis,cls)=>`<button${cls?` class="${cls}"`:''} data-act="${act}"${dis?' disabled':''}>${label}</button>`;
const card=G.cardHTML;
// Zera TUDO o que é temporário da partida (seleção, equipes, estado de batalha, alvos, timers) para nada vazar para a próxima.
function wipe(){clearTimeout(ui.timer);Object.assign(ui,{sel:null,teams:null,state:null,target:null,swapMode:false,swapPick:null,sup:null,supTarget:null,handIid:null,lastEventShown:0,mana:0,msg:''});}
function menu(){wipe();ui.mode='menu';
  show(`<section class="center"><div class="logo" aria-hidden="true"><span class="logo-gem"></span></div><h1>GOGHOS</h1><p class="menu-subtitle">The Nightmare Is Coming</p><p class="menu-description">Escolha seus personagens, forme sua equipe e proteja a Daly Mãe.</p>${btn('play','Jogar',0,'big')}${btn('shop','Loja',0,'big')}<p class="ver">Versão ${G.CONFIG.version}</p></section>`);}
// Jogar: sorteia 5 Comuns; escolhas jogador → bot → jogador → bot; só então a batalha pode começar.
function startMatch(){wipe();ui.mode='select';const r=G.createSelection();
  if(!r.ok){show(`<section class="center"><h2>Não foi possível iniciar a batalha</h2><p class="msg">${r.error}</p>${btn('menu','Menu')}</section>`);return;}
  ui.sel=r.sel;selectScreen();}
function selectScreen(){
  ui.mode='select';const sel=ui.sel,turn=G.selectionTurn(sel),who=id=>sel.picks.player.includes(id)?'Você':sel.picks.enemy.includes(id)?'Adversário':'';
  const status=turn==='player'?`Sua vez: escolha 1 personagem (escolha ${sel.step+1} de 4)`:turn==='enemy'?`O adversário está escolhendo… (escolha ${sel.step+1} de 4)`:'Escolhas concluídas';
  show(`<section><h2>Seleção de personagens</h2><p class="sel-info">${status}</p><p class="msg">${ui.msg}</p><div class="row">${sel.offered.map(id=>card(G.getCharacterById(id),who(id)?'sel':'',who(id)||(turn==='player'?'Disponível':''))).join('')}</div>${btn('menu','Menu')}</section>`);}
function selectAdvance(){clearTimeout(ui.timer);const sel=ui.sel;
  if(G.selectionDone(sel)){confirmTeams();return;}
  selectScreen();
  if(G.selectionTurn(sel)==='enemy')ui.timer=setTimeout(()=>{G.selectionBotPick(sel);selectAdvance();},700);}
function pickCharacter(id){const sel=ui.sel;if(!sel||G.selectionTurn(sel)!=='player')return;
  const r=G.selectionPick(sel,'player',id);ui.msg=r.ok?'':r.error;if(r.ok)selectAdvance();else selectScreen();}
function confirmTeams(){
  ui.mode='confirm';ui.teams=G.selectionTeams(ui.sel);
  const r=ids=>`<div class="row pv">${ids.map(i=>card(G.getCharacterById(i))).join('')}</div>`;
  const grp=(t,title)=>`<div class="team"><h2>${title}</h2><p class="lbl">Linha de frente</p>${r(t.front)}<p class="lbl">Retaguarda: vazia</p></div>`;
  show(`<section><div class="teams">${grp(ui.teams.player,'Sua equipe')}${grp(ui.teams.enemy,'Equipe adversária')}</div>${btn('fight','Lutar')}${btn('play','Voltar')}</section>`);}
function render(actor){
  ui.mode='battle';
  const s=ui.state,pd=s.support.pending,rc=s.recovery,hc=s.deck.pendingChoice,free=!s.result&&!pd&&!rc&&!hc,mine=free&&!!actor&&actor.team==='player',mage=mine&&actor.class==='MAGO',B=G.getBoard(s);
  ui.mana=mage?Math.min(ui.mana,actor.mana):0;
  const selDef=ui.sup!=null&&s.support.slots[ui.sup]?G.getSupportCard(s.support.slots[ui.sup].id):null;
  const handInst=ui.handIid?s.deck.hands.player.find(c=>c.iid===ui.handIid):null,handReset=handInst?G.getResetCard(handInst.id):null,handDef=handReset&&handReset.type==='SUPPORT'?G.getSupportCard(handInst.id):null,activeDef=handDef||selDef,needT=!!activeDef&&activeDef.effect==='heal';
  const freshEvent=!!(s.lastEvent&&s.lastEvent.id!==ui.lastEventShown);
  const eventFor=u=>freshEvent&&s.lastEvent.targetUid===u.uid?s.lastEvent:null;
  const healable=u=>u.team==='player'&&u.hp>0&&u.hp<u.maxHp&&((needT&&mine)||(pd&&pd.candidates.includes(u.uid)));
  const cell=u=>{const ev=eventFor(u),fx=ev?`<span class="combat-float ${ev.type}">${ev.type==='dodge'?'ESQUIVA':ev.type==='defeat'?'−'+ev.damage:'−'+ev.damage}</span>`:'';return `<div class="cell ${ev?'event-'+ev.type:''} ${freshEvent&&s.lastEvent.actorUid===u.uid?'event-actor':''}">${card(u,(actor&&u.uid===actor.uid?'active ':'')+(u.uid===ui.target||u.uid===ui.swapPick||u.uid===ui.supTarget?'target ':'')+(ui.swapMode&&u.team==='player'&&u.hp>0&&G.canTransit(u)?'swp ':'')+(mine&&u.team==='enemy'&&u.row==='front'&&u.hp>0?'pick ':'')+(healable(u)?'heal':''),(u.row==='rear'?'Retag. ':'Vida ')+u.hp+'/'+u.maxHp)}${fx}</div>`;};
  const frow=(list,name)=>list.length?`<p class="lbl">${name}</p><div class="frow">${list.map(cell).join('')}</div>`:`<p class="lbl empty-l">${name}: vazia</p>`;
  const daly=side=>{const pick=mine&&side==='enemy'&&G.isDalyExposed(s,'enemy'),hit=freshEvent&&s.lastEvent.targetUid===G.dalyTargetId(side);return `<div class=\"daly-feedback${hit?' event-daly-hit':''}\">${G.dalyHTML(s,side,{pick,target:ui.target===G.dalyTargetId(side)})}${hit?`<span class=\"daly-float\">−1 VIDA</span>`:''}</div>`;};
  // Adversário: retaguarda acima da frente. Jogador: frente acima da retaguarda.
  const side=t=>{const b=B[t];return `<div class="side ${t}">${daly(t)}${t==='enemy'?frow(b.rear,'Retaguarda')+frow(b.front,'Linha de frente'):frow(b.front,'Linha de frente')+frow(b.rear,'Retaguarda')}</div>`;};
  const order=s.order.map(id=>{const u=G.getUnit(s,id);return `<span class="${s.acted[id]?'done':''}">${u.name}</span>`;}).join(' › ');
  const dg=mine&&ui.target&&actor?G.dodgeInfo(actor,G.getUnit(s,ui.target)):null,onDaly=ui.target===G.dalyTargetId('enemy');
  const info=s.result?'Fim da batalha':hc?`Sua mão está cheia (${s.deck.hands.player.length}/${s.deck.handLimit}). Substitua uma carta ou mantenha as atuais.`:rc?(rc.side==='player'?'Sua Daly Mãe perdeu uma vida: escolha a recuperação':'O adversário está escolhendo a recuperação…'):pd?`Brisa: um aliado foi eliminado! Escolha outro aliado ferido para curar +${pd.value}`:mine?(ui.swapMode?'Troca: escolha um Suporte da retaguarda e um da linha de frente':selDef?`Apoio selecionado: ${selDef.name}${needT?' — escolha o aliado a curar':' — pronto para usar'}`:`Vez de ${actor.name}: escolha um alvo${B.enemy.front.length?' da linha de frente':' — a Daly Mãe adversária está exposta'}${mage&&!onDaly?` · Dano previsto: ${G.previewDamage(s,actor,ui.mana)}`:''}${onDaly?' · cada ataque à Daly Mãe tira exatamente 1 vida':''}${dg?` · Esquiva do alvo: tirar 1 a ${dg.diff} no dado (d${dg.sides})`:''}`):actor?`Vez de ${actor.name} (adversário)…`:'…';
  const btns=pd?btn('brisaskip','Pular a cura'):mine?btn('attack','Confirmar ataque',!ui.target||ui.swapMode)+btn('swap',ui.swapMode?'Cancelar troca':`Trocar posição (−${G.CONFIG.swapStaminaCost} fôlego)`,!ui.swapMode&&!G.getSwapPairs(s,'player').length)+(selDef?btn('usesup','Usar '+selDef.name,needT&&!ui.supTarget):'')+(handDef?btn('usehand','Usar '+handDef.name,needT&&!ui.supTarget||s.support.usedTurn===s.turn):'')+(mage&&actor.mana>0&&!onDaly?btn('mana-','−',ui.mana<=0,'sm')+`<span class="manav">Mana ${ui.mana}/${actor.mana}</span>`+btn('mana+','+',ui.mana>=actor.mana,'sm'):''):'';
  const logs=s.log.slice(-5).map(x=>{const low=x.toLowerCase(),kind=low.includes('esquivou')?'dodge':low.includes('eliminado')||low.includes('derrotada')?'defeat':low.includes('recuperou')||low.includes('cura')?'heal':low.includes('mana')?'mana':low.includes('causou')||low.includes('atacou')?'attack':low.includes('obteve')?'obtain':low.includes('exposta')?'danger':'event';const ico={attack:'⚔',dodge:'↗',defeat:'✦',heal:'✚',mana:'✧',obtain:'★',danger:'!',event:'·'}[kind];return `<div class="battle-event ${kind}"><span>${ico}</span><p>${x}</p></div>`;}).join('');
  show(`${G.handPanelHTML(s,ui.handIid)}<section><h3>Adversários</h3>${side('enemy')}<h3>Sua equipe</h3>${side('player')}${G.recoveryHTML(s)}${G.resetNoticeHTML(s)}<p class="info">Rodada ${s.round} · ${info}</p><p class="order">Ordem: ${order}</p><div class="event-feed"><h4>Registro da batalha</h4>${logs||'<p class="event-empty">A batalha ainda não teve ações.</p>'}</div><p class="msg">${ui.msg}</p>${btns}${G.eliminatedHTML(s,freshEvent)}${s.result?'':btn('menu','Sair da batalha',0,'quit')}</section>`);
  if(s.lastEvent)ui.lastEventShown=s.lastEvent.id;}
function resetSel(){ui.mana=0;ui.target=null;ui.swapMode=false;ui.swapPick=null;ui.sup=null;ui.supTarget=null;ui.handIid=null;ui.lastEventShown=0;ui.msg='';}
// Clique numa carta de apoio: seleciona/desmarca (o motivo da recusa vem das regras do núcleo).
function supClick(i){
  const s=ui.state;if(!s||s.result)return;const actor=G.getNextActor(s);
  if(ui.sup===i){ui.sup=null;ui.supTarget=null;ui.msg='';render(actor);return;}
  const why=G.supportBlockReason(s,i);if(why){ui.msg=why;render(actor);return;}
  ui.sup=i;ui.supTarget=null;ui.swapMode=false;ui.swapPick=null;ui.msg='';render(actor);
}
function step(){
  const s=ui.state;clearTimeout(ui.timer);const actor=G.getNextActor(s);render(actor);
  if(s.result)ui.timer=setTimeout(result,1000);
  else if(s.deck.pendingChoice){/* pausa até o jogador substituir ou descartar a carta nova */}
  else if(s.recovery){if(s.recovery.side==='enemy')ui.timer=setTimeout(()=>{G.AI.resolveRecovery(s);step();},800);} // a do jogador espera o clique
  else if(s.support.pending){/* aguardando o jogador escolher a cura da Brisa */}
  else if(actor&&actor.team==='enemy')ui.timer=setTimeout(()=>{G.AI.takeTurn(s,actor);ui.target=null;step();},800);
}
// Resultado: quem venceu, quem perdeu e qual Daly Mãe caiu. "Menu" e "Nova partida" limpam todo o estado temporário.
function result(){ui.mode='result';const f=ui.state.final,w=f.winner==='player',d=f.daly;
  show(`<section class="center"><h1>${w?'VITÓRIA':'DERROTA'}</h1><p>${w?'Você venceu':'O adversário venceu'} · ${f.loser==='player'?'a sua Daly Mãe':'a Daly Mãe adversária'} foi derrotada.</p><p>Daly Mãe — você ${d.player}/${G.CONFIG.dalyMaeLives} · adversário ${d.enemy}/${G.CONFIG.dalyMaeLives}</p>${btn('play','Nova partida')}${btn('menu','Menu')}</section>`);}
function cardOf(t){const c=t.closest('.card');if(c)return c;const sl=t.closest('.slot');return sl?sl.querySelector('.card'):null;} // cartas não recebem o mouse (por causa da lupa): o clique chega no .slot
function swapClick(s,actor,u){
  if(!ui.swapPick){
    if(!G.canTransit(u)||u.hp<=0){ui.msg='Somente Suportes podem trocar de posição.';render(actor);return;}
    ui.swapPick=u.uid;ui.msg='';render(actor);return;}
  if(ui.swapPick===u.uid){ui.swapPick=null;render(actor);return;}
  const r=G.performSwap(s,ui.swapPick,u.uid);ui.swapPick=null;ui.msg=r.ok?'':r.error;
  if(r.ok){ui.swapMode=false;step();}else render(actor);
}
app.addEventListener('click',e=>{
  const b=e.target.closest('[data-act]'),c=cardOf(e.target),sp=e.target.closest('[data-sup]'),dl=e.target.closest('[data-daly]'),handCard=e.target.closest('[data-hand]');
  if(b){if(b.disabled)return;const a=b.dataset.act;
    if(a==='menu'){if(ui.mode==='battle'&&ui.state&&!ui.state.result&&!confirm('Sair da batalha atual? O progresso dela será perdido.'))return;menu();} // menu() limpa o estado temporário
    else if(a==='play')startMatch();
    else if(a==='shop')show(G.shopHTML());
    else if(a==='fight'){const t=ui.teams;ui.state=G.createBattleState(t.player,t.enemy,[]);resetSel();step();}
    else if(a==='swap'){ui.swapMode=!ui.swapMode;ui.swapPick=null;ui.sup=null;ui.supTarget=null;ui.handIid=null;ui.msg='';ui.target=null;render(G.getNextActor(ui.state));}
    else if(a==='attack'){const s=ui.state,actor=G.getNextActor(s),r=G.performBasicAttack(s,actor.uid,ui.target,ui.mana);if(!r.ok)alert(r.error);ui.mana=0;ui.target=null;ui.sup=null;ui.supTarget=null;ui.handIid=null;step();}
    else if(a==='usesup'){const s=ui.state,r=G.performSupport(s,ui.sup,ui.supTarget);ui.msg=r.ok?'':r.error;if(r.ok){ui.sup=null;ui.supTarget=null;}render(G.getNextActor(s));}
    else if(a==='usehand'){const s=ui.state,r=G.performHandSupport(s,ui.handIid,ui.supTarget);ui.msg=r.ok?'':r.error;if(r.ok){ui.handIid=null;ui.supTarget=null;}render(G.getNextActor(s));}
    else if(a==='keep-new'){const s=ui.state,r=G.resolveHandReplacement(s,null);ui.msg=r.ok?'':'Não foi possível descartar a carta nova.';ui.handIid=null;step();}
    else if(a==='brisaskip'){G.resolveBrisa(ui.state,null);step();}
    else if(a.startsWith('recover-')){const s=ui.state,r=G.performRecovery(s,a.slice(8));ui.msg=r.ok?'':r.error;if(r.ok){ui.target=null;step();}else render(G.getNextActor(s));}
    else if(a==='mana+'||a==='mana-'){ui.mana+=a==='mana+'?1:-1;render(G.getNextActor(ui.state));}
    return;}
  if(ui.mode==='select'){if(c)pickCharacter(c.dataset.id);return;}
  if(ui.mode!=='battle')return;
  const s=ui.state;
  if(s.deck.pendingChoice){if(handCard){const r=G.resolveHandReplacement(s,handCard.dataset.hand);ui.msg=r.ok?'':r.error;step();}return;}
  if(sp){supClick(+sp.dataset.sup);return;}
  const actor=G.getNextActor(s),canPick=!s.result&&!s.recovery&&!s.support.pending&&!s.deck.pendingChoice&&actor&&actor.team==='player';
  if(handCard){const inst=s.deck.hands.player.find(x=>x.iid===handCard.dataset.hand),rd=inst&&G.getResetCard(inst.id);if(inst&&rd&&rd.type==='SUPPORT'&&canPick){ui.handIid=ui.handIid===inst.iid?null:inst.iid;ui.sup=null;ui.supTarget=null;ui.swapMode=false;ui.msg='';render(actor);}return;}
  if(dl){ // Daly Mãe adversária: só é alvo quando está exposta
    if(canPick&&!ui.swapMode&&dl.dataset.daly==='enemy'&&G.isDalyExposed(s,'enemy')){ui.target=G.dalyTargetId('enemy');ui.mana=0;ui.msg='';render(actor);}
    return;}
  if(!c)return;const id=c.dataset.id,u=G.getUnit(s,id),pd=s.support.pending;
  if(pd){if(u&&pd.candidates.includes(u.uid)){G.resolveBrisa(s,u.uid);step();}return;}
  const chosenSupport=ui.handIid?(G.getResetCard((s.deck.hands.player.find(x=>x.iid===ui.handIid)||{}).id||'')?.type==='SUPPORT'?G.getSupportCard((s.deck.hands.player.find(x=>x.iid===ui.handIid)||{}).id):null):ui.sup!=null&&s.support.slots[ui.sup]?G.getSupportCard(s.support.slots[ui.sup].id):null;
  if((ui.sup!=null||ui.handIid!=null)&&!ui.swapMode&&chosenSupport&&chosenSupport.effect==='heal'&&u&&u.team==='player'){
    if(u.hp>0&&u.hp<u.maxHp){ui.supTarget=u.uid;ui.msg='';}else ui.msg='Escolha um aliado ferido.';render(actor);return;}
  if(ui.swapMode){if(canPick&&u&&u.team==='player')swapClick(s,actor,u);return;}
  if(canPick&&u&&u.team==='enemy'&&u.row==='front'&&u.hp>0){ui.target=id;render(actor);}
});
menu();
})(globalThis.GOGHOS);
