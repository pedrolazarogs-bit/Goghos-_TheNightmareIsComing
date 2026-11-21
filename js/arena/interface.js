(function(){
'use strict';
const M=GoghosBattleLab,$=id=>document.getElementById(id),stage=$('battle-stage'),dialog=$('battle-dialog');
if(new URLSearchParams(location.search).get('from')==='menu'){
 const back=document.querySelector('.lab-back');back.href='index.html';back.textContent='← Menu';
}
const singlePlayer=matchMedia('(pointer:fine)').matches;
let state=M.create(singlePlayer),selected=null,busy=false,aiTimer=null,finishTimer=null,generation=0,dialogKind='',manualPause=false,hiddenPause=false;
const compact=matchMedia('(pointer:fine) and (min-width:900px)').matches;
document.body.classList.toggle('compact-arena',compact);
const tip=$('arena-tip');
let tipOwner=null,dialogOwner=null;
function hideTip(){
 if(tipOwner)tipOwner.removeAttribute('aria-describedby');
 tipOwner=null;tip.hidden=true;
}
function note(owner,text){
 hideTip();
 tip.textContent=text;tip.hidden=false;tipOwner=owner;
 owner.setAttribute('aria-describedby',tip.id);
 const r=owner.getBoundingClientRect(),box=tip.getBoundingClientRect();
 tip.style.left=Math.max(8,Math.min(innerWidth-box.width-8,r.left+(r.width-box.width)/2))+'px';
 tip.style.top=(r.top>=box.height+16?r.top-box.height-8:Math.min(innerHeight-box.height-8,r.bottom+8))+'px';
}
function inform(c){say(c.name+' · '+c.hp+'/'+c.maxHp+' PV · '+c.atk+' de dano'+(c.hp?'':' · eliminado'));}
let control='player',reduced=matchMedia('(prefers-reduced-motion:reduce)').matches;
const now=()=>performance.now(),art=c=>'assets/menu-v036/character-'+c.art+'.webp',teamName=t=>t==='blue'?'Azul':'Vermelho';
if(singlePlayer){
 document.body.classList.add('single-player-arena');
 const label=$('control').closest('label');
 label.replaceChildren(document.createTextNode('SEU PERSONAGEM '));
 const name=document.createElement('strong');name.id='owned-name';name.textContent='—';label.append(name);
}
const player=()=>state.cards.find(c=>c.id===state.playerId);
const alive=t=>state.cards.filter(c=>c.team===t&&c.hp>0),isAutomatic=()=>singlePlayer?M.current(state)?.controller==='bot':control==='auto'||control==='player'&&M.current(state)?.team==='red';
const format=ms=>{const seconds=Math.floor(ms/1000);return String(Math.floor(seconds/60)).padStart(2,'0')+':'+String(seconds%60).padStart(2,'0');};
const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function fit(){hideTip();stage.style.setProperty('--battle-scale',String(Math.min(innerWidth/1600,innerHeight/900)));CardTouch.close();}
function cancelTimers(){clearTimeout(aiTimer);clearTimeout(finishTimer);aiTimer=finishTimer=null;generation++;busy=false;}
function say(text){$('battle-message').textContent=text;}
function closeDialog(){
 dialog.close();dialogKind='';
 if(compact&&dialogOwner?.isConnected)dialogOwner.focus({preventScroll:true});
 dialogOwner=null;schedule();
}
function openDialog(kind,title,body,actions=[]){
 CardTouch.close();clearTimeout(aiTimer);aiTimer=null;
 hideTip();
 dialogOwner=document.activeElement;
 dialog.dataset.kind=kind;
 dialogKind=kind;$('dialog-title').textContent=title;$('dialog-body').innerHTML=body;$('dialog-actions').replaceChildren();
 $('dialog-close').hidden=kind==='setup'||kind==='result';
 for(const action of actions){if(compact&&kind==='info'&&action.run===closeDialog)continue;const b=document.createElement('button');b.textContent=action.label;b.className=action.primary?'primary':'';b.addEventListener('click',action.run);$('dialog-actions').append(b);}
 if(!dialog.open){
  if(compact && kind!=='setup' && kind!=='result')dialog.show();
  else dialog.showModal();
 }
 if(compact && kind==='info')$('dialog-close').focus({preventScroll:true});
}
function showSetup(){
 if(singlePlayer){
  const options=M.roster.map((name,i)=>'<option value="'+i+'">'+escape(name)+'</option>').join('');
  openDialog('setup','Escolha seu personagem','<label class="character-pick">Seu personagem<select id="owned-character">'+options+'</select></label><p>Você joga pela equipe azul. Três aliados e quatro adversários agem por conta própria.</p>',[{label:'Iniciar batalha',primary:true,run:()=>{
   if(!M.start(state,now(),Number($('owned-character').value)))return;
   selected=state.playerId;closeDialog();render();schedule();
  }}]);
  return;
 }
 const choices=team=>Array.from({length:4},(_,i)=>'<label><span>'+(i+1)+'</span><select data-lineup="'+team+'" aria-label="'+teamName(team)+' personagem '+(i+1)+'">'+M.roster.map((name,j)=>'<option value="'+j+'" '+(state.lineups[team][i]===j?'selected':'')+'>'+name+'</option>').join('')+'</select></label>').join('');
 openDialog('setup',compact?'Monte suas equipes':'Nova arena. Quatro contra quatro.', (compact?'':'<p>Derrote os quatro adversários para marcar um ponto. A primeira equipe a conquistar <b>3 pontos</b> vence a série.</p><p>O cronômetro começa ao iniciar e segue entre as rodadas. Nesta primeira estrutura, todos têm <b>100 PV e 25 de dano</b>; só o ataque básico está ativo.</p>')+'<div class="lineups"><div><h3>EQUIPE AZUL</h3>'+choices('blue')+'</div><div><h3>EQUIPE VERMELHA</h3>'+choices('red')+'</div></div><p class="error" id="setup-error" role="status"></p>',[{label:'Iniciar batalha',primary:true,run:()=>{
  const lineups=Object.fromEntries(['blue','red'].map(team=>[team,[...dialog.querySelectorAll('[data-lineup="'+team+'"]')].map(el=>Number(el.value))]));
  if(!M.start(state,now(),lineups)){$('setup-error').textContent='Escolha quatro personagens diferentes em cada equipe.';return;}
  selected=M.current(state).id;closeDialog();render();schedule();
 }}]);
}
function cardHTML(c){const active=M.current(state)?.id===c.id&&state.phase==='active';return '<button type="button" class="combat-card a'+c.art+' '+(active?'is-current ':'')+(selected===c.id?'is-selected ':'')+(c.hp===0?'dead':'')+'" data-controller="'+(c.controller||'')+'" data-battle-card="'+c.id+'" aria-label="'+escape(c.name)+', equipe '+teamName(c.team)+', '+c.hp+' de '+c.maxHp+' PV'+(singlePlayer?(c.id===state.playerId?', seu personagem':', bot'):'')+(active?', vez atual':'')+'">'+ArenaArt.card(c,singlePlayer)+'</button>';}
function renderHand(){
 const hand=state.supports.blue.slice(0,M.SUPPORT_LIMIT).filter(Boolean);
 const slots=$('support-hand');
 $('empty-hand').hidden=hand.length>0;
 slots.hidden=hand.length===0;
 slots.replaceChildren(...hand.map(card=>{
  const icon=document.createElement('img');
  icon.src=card.icon;
  icon.alt=card.name;
  return icon;
 }));
}
function render(){hideTip();
 renderHand();
 for(const team of ['blue','red']){$('team-'+team).innerHTML=state.cards.filter(c=>c.team===team).map(cardHTML).join('');$('score-'+team).textContent=state.score[team];$('pips-'+team).innerHTML=Array.from({length:3},(_,i)=>'<i class="'+(i<state.score[team]?'filled':'')+'"></i>').join('');$(team+'-alive').textContent=alive(team).length+'/4';}
 $('round').textContent='RODADA '+state.round;$('pause').disabled=state.phase!=='active';$('pause').textContent=state.paused?'Retomar':'Pausar';document.body.classList.toggle('paused',state.paused);
 const current=M.current(state),last=state.cards.find(c=>c.id===state.last);
 $('queue').innerHTML=[[M.next(state),'PRÓXIMO','next'],[current,'VEZ ATUAL','current'],[last,'ÚLTIMO ATAQUE','last']].map(([c,label,role])=>'<button class="queue-card '+(c?.team||'')+' '+role+'" '+(c?'data-inspect="'+c.id+'"':'disabled')+'><img class="q-star" src="assets/card-touch-v044/star.png" alt=""><span><small>'+label+'</small>'+(c?c.name:'—')+'</span>'+(c?'<img class="q-art" src="'+ArenaArt.ribbon(c)+'" alt="">':'')+'</button>').join('');
 const owner=singlePlayer?player():current;
 if(singlePlayer)$('owned-name').textContent=owner?.name||'—';
 $('action-owner').textContent=owner?owner.name.toUpperCase():'PERSONAGEM ATIVO';$('action-team').textContent=owner?'EQUIPE '+teamName(owner.team).toUpperCase():'';
 $('action-hint').textContent=state.phase==='finished'?'Série encerrada.':state.paused?'Ações pausadas. O relógio continua.':busy?'Resolvendo ataque…':isAutomatic()?'O computador está escolhendo o alvo.':'Clique no oponente para escolher o alvo.';
 updateInspector();CardTouch.refresh();
 if(state.phase==='active')say(state.paused?'Ações pausadas.':busy?'Ataque em andamento…':(singlePlayer?(current.controller==='bot'?current.name+' · bot da equipe '+teamName(current.team):'Sua vez · '+current.name):current.name+' · vez da equipe '+teamName(current.team)));
}
function updateInspector(){const c=state.cards.find(c=>c.id===selected)||M.current(state);if(!c){$('portrait').innerHTML='';$('inspector').innerHTML='<h2>Prepare a equipe</h2>';return;}
 selected=c.id;$('portrait').innerHTML='<img src="'+art(c)+'" alt="'+c.name+'">';
 $('inspector').innerHTML='<h2>'+c.name+'<small>'+teamName(c.team).toUpperCase()+'</small></h2><div class="stat-life" style="--f:'+(c.hp/c.maxHp)+'"><i></i><strong>'+c.hp+'</strong><small>LIFE</small><img src="assets/player-panel-v048/heart.png" alt="Vida"></div><div class="stat-def" aria-hidden="true"></div><div class="stat-detail"><b>'+c.atk+'</b><img src="assets/player-panel-v048/damage.png" alt="Dano"><span>ATK</span></div><button id="inspect-selected">Detalhes</button><p class="stat-note">Habilidade não definida · '+(c.hp>0?'sem efeitos ativos':'eliminado nesta rodada')+'</p>';
 $('inspect-selected').addEventListener('click',()=>inspect(c.id));
 for(const el of document.querySelectorAll('[data-battle-card]'))el.classList.toggle('is-selected',el.dataset.battleCard===c.id);
}
function inspect(id){const c=state.cards.find(c=>c.id===id);if(!c)return;
 const inspectingPanel=document.activeElement?.id==='inspect-selected';
 selected=id;updateInspector();
 if(compact){
  inform(c);
  if(inspectingPanel){
   const button=$('inspect-selected');button.focus({preventScroll:true});
   note(button,c.hp?'Em campo · sem efeitos ativos':'Eliminado nesta rodada');
  }
  return;
 }
 openDialog('info',c.name+' · equipe '+teamName(c.team),'<p><b>Vida:</b> '+c.hp+' / '+c.maxHp+' PV<br><b>Dano básico:</b> '+c.atk+'<br><b>Estado:</b> '+(c.hp?'em campo':'eliminado')+'</p><p><b>Habilidade:</b> não definida nesta estrutura.<br><b>Atributos e efeitos:</b> nenhum efeito adicional configurado.</p><p>Os valores de vida e dano são provisórios para testar a arena. Não representam o balanceamento oficial do personagem.</p>',[{label:'Voltar ao campo',run:closeDialog}]);}
function perform(targetId,controller='player'){
 if(busy||state.paused||dialog.open||state.phase!=='active')return false;
 const actor=M.current(state),result=M.attack(state,actor.id,targetId,now(),controller);if(!result)return false;
 CardTouch.close();clearTimeout(aiTimer);busy=true;const ticket=++generation;render();
 const target=document.querySelector('[data-battle-card="'+result.target+'"]'),source=document.querySelector('[data-battle-card="'+result.actor+'"]');
 if(!reduced){source?.animate([{transform:'translateY(0)'},{transform:'translateY(-20px) scale(1.06)'},{transform:'translateY(0)'}],{duration:420,easing:'ease-out'});target?.animate([{filter:'brightness(2)'},{filter:'brightness(1)'}],{duration:450});const n=document.createElement('span');n.className='damage-number';n.textContent='−'+result.damage;target?.append(n);setTimeout(()=>n.remove(),850);}
 say((result.defeated?'Eliminado! ':'')+'−'+result.damage+' PV em '+state.cards.find(c=>c.id===targetId).name);
 finishTimer=setTimeout(()=>{if(ticket!==generation)return;busy=false;selected=state.playerId||M.current(state)?.id||selected;render();if(state.phase==='round-end'||state.phase==='finished')showResult();else schedule();},reduced?200:650);
 return true;
}
function schedule(){clearTimeout(aiTimer);aiTimer=null;if(state.phase!=='active'||state.paused||busy||dialog.open||document.hidden||!isAutomatic())return;
 const revision=state.revision,ticket=generation;
 aiTimer=setTimeout(()=>{if(ticket!==generation||revision!==state.revision||busy||state.paused||dialog.open||document.hidden)return;const actor=M.current(state),targets=alive(M.opposite(actor.team)).sort((a,b)=>a.hp-b.hp||a.slot-b.slot);if(targets[0])perform(targets[0].id,'bot');},singlePlayer?3200:1200);
}
function showResult(){const finished=state.phase==='finished',winner=state.roundWinner;openDialog('result',finished?'Equipe '+teamName(winner)+' vence a série!':'Ponto para a equipe '+teamName(winner),'<img class="match-emblem" src="assets/menu-v036/trophy.webp" alt=""><div class="result-score"><b>'+state.score.blue+'</b><span>×</span><b>'+state.score.red+'</b></div><p>'+ (finished?'Três vitórias conquistadas. Tempo final: <b>'+format(M.elapsed(state,now()))+'</b>.':'Os quatro adversários foram eliminados. As duas equipes voltam com vida cheia na próxima rodada; o cronômetro continua.')+'</p>',[{label:finished?'Nova série':'Próxima rodada',primary:true,run:()=>{if(finished){restart();return;}dialog.close();dialogKind='';M.continueRound(state,now());manualPause=hiddenPause=false;selected=state.playerId||M.current(state).id;render();schedule();}},{label:'Exportar registro',run:exportState}]);say(finished?'Vitória final da equipe '+teamName(winner):'Rodada encerrada.');}
function exportState(){const data={version:'0.58.0',mode:singlePlayer?'single-player':control,elapsedMs:M.elapsed(state,now()),...state};const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='goghos-batalha-0.58.0.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
function restart(){cancelTimers();CardTouch.close();dialog.close();state=M.create(singlePlayer);manualPause=hiddenPause=false;selected=null;render();showSetup();}
function setPaused(){const value=manualPause||hiddenPause;if(state.phase==='active'){M.pause(state,value,now());CardTouch.close();clearTimeout(aiTimer);render();schedule();}}
CardTouch.init({inlineDetails:compact?inform:null,selector:'[data-battle-card]',assets:'assets/card-touch-v044/',labels:{attack:'ATACAR'},getCard:el=>{const c=state.cards.find(c=>c.id===el.dataset.battleCard);return c&&{...c,ability:{name:'Sem habilidade definida',text:'Somente ataque básico nesta arena de testes. Nenhuma habilidade especial ou atributo de classe foi criado.'}};},isAttackTurn:c=>state.phase==='active'&&!state.paused&&!busy&&!dialog.open&&!isAutomatic()&&c.hp>0&&c.team!==M.current(state)?.team,onAttack:c=>perform(c.id)});
$('battle-field').addEventListener('click',e=>{const el=e.target.closest('[data-battle-card]');if(el){selected=el.dataset.battleCard;updateInspector();}});
$('queue').addEventListener('click',e=>{const el=e.target.closest('[data-inspect]');if(el)inspect(el.dataset.inspect);});
$('empty-hand').addEventListener('click',()=>{
 const text='Mão vazia. Você pode ter até '+M.SUPPORT_LIMIT+' cartas de apoio.';
 if(compact){note($('empty-hand'),text);return;}
 openDialog('info','Mão de apoios','<p>'+text+'</p>',[{label:'Voltar ao campo',run:closeDialog}]);
});
document.querySelectorAll('[data-slot]').forEach(el=>el.addEventListener('click',()=>{
 const ability=el.dataset.slot==='ability';
 if(compact){note(el,ability?'Habilidade ainda não definida':'Nenhum item equipado');return;}
 openDialog('info',ability?'Habilidade do personagem':'Espaço de item',
  ability?'<p>Habilidade ainda não definida. Para o ataque básico, selecione um oponente e toque em ATACAR.</p>':'<p>Nenhum item equipado. Este espaço ficará reservado para itens que forem definidos e testados no laboratório.</p>',
  [{label:'Voltar ao campo',run:closeDialog}]);
}));
$('pause').addEventListener('click',()=>{manualPause=!manualPause;setPaused();});
$('restart').addEventListener('click',()=>{openDialog('confirm','Reiniciar a série?','<p>O placar, as equipes e o cronômetro desta sessão serão restaurados.</p>',[{label:'Continuar jogando',run:closeDialog},{label:'Reiniciar',primary:true,run:restart}]);});
$('control')?.addEventListener('change',()=>{control=$('control').value;CardTouch.close();render();schedule();});
$('motion').addEventListener('click',()=>{reduced=!reduced;document.body.classList.toggle('reduced',reduced);$('motion').setAttribute('aria-pressed',String(reduced));$('motion').textContent=reduced?'Efeitos reduzidos':'Efeitos';});
$('history').addEventListener('click',()=>openDialog('info','Registro da série','<ul class="dialog-log">'+state.events.map(e=>'<li><small>'+format(e.ms)+' · '+escape(e.type)+'</small>'+escape(e.text)+'</li>').join('')+'</ul>',[{label:'Voltar ao campo',run:closeDialog}]));
$('export-battle').addEventListener('click',exportState);
$('help').addEventListener('click',()=>openDialog('info','Como jogar',singlePlayer?'<p>Na sua vez, selecione um inimigo e use <b>Atacar</b>. Os outros sete personagens são bots. Se o seu personagem for eliminado, seus aliados continuam até o fim da rodada.</p><p>A primeira equipe com três pontos vence.</p>':compact?'<p>Selecione um inimigo e use <b>Atacar</b>. Consulte vida e dano no canto direito.</p><p>Elimine a equipe adversária para marcar um ponto. Três pontos vencem a série.</p>':'<p><b>1.</b> Na sua vez, clique em uma carta inimiga. O primeiro clique mostra ATACAR; o segundo abre os detalhes; o terceiro fecha.</p><p><b>2.</b> ATACAR aplica o dano básico do personagem da vez. Cartas com zero PV saem da ordem de ação.</p><p><b>3.</b> Elimine os quatro inimigos para marcar um ponto. Quem alcançar três pontos vence a série.</p><p>A ordem alterna as equipes e ignora eliminados. A equipe inicial alterna a cada rodada. O relógio mede toda a duração da série, incluindo pausas e intervalos.</p><p>Use Tab/Enter e Escape para navegar. Controle manual permite testar os dois lados; automático permite observar os turnos. O modo Azul × computador deixa você no comando da equipe azul.</p>',[{label:'Entendi',run:closeDialog}]));
if(compact){
 const dismissOutside=e=>{
  if(!tip.hidden&&!tipOwner?.contains(e.target))hideTip();
  if(dialog.open&&!dialog.matches(':modal')&&!dialog.contains(e.target)&&e.target!==dialogOwner)closeDialog();
 };
 document.addEventListener('pointerdown',dismissOutside,true);
 document.addEventListener('click',e=>{if(e.detail===0)dismissOutside(e);},true);
 document.addEventListener('focusin',e=>{
  if(!tip.hidden&&!tipOwner?.contains(e.target))hideTip();
 });
 document.addEventListener('keydown',e=>{
  if(e.key==='Escape'){
   hideTip();
   if(dialog.open&&!dialog.matches(':modal')){e.preventDefault();closeDialog();}
  }
 });
}
$('dialog-close').addEventListener('click',closeDialog);dialog.addEventListener('cancel',e=>{if(dialogKind==='setup'||dialogKind==='result')e.preventDefault();});dialog.addEventListener('close',schedule);
document.addEventListener('visibilitychange',()=>{hiddenPause=document.hidden;setPaused();});window.addEventListener('resize',fit);
setInterval(()=>$('clock').textContent=format(M.elapsed(state,now())),200);
window.GoghosBattle=Object.freeze({snapshot:()=>JSON.parse(JSON.stringify({...state,elapsedMs:M.elapsed(state,now()),control:singlePlayer?'single-player':control,busy})),destroy(){cancelTimers();CardTouch.destroy();}});
fit();document.body.classList.toggle('reduced',reduced);$('motion').setAttribute('aria-pressed',String(reduced));render();showSetup();
})();
