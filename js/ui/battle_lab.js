(function(){
'use strict';
const M=GoghosBattleLab,$=id=>document.getElementById(id),stage=$('battle-stage'),dialog=$('battle-dialog');
let state=M.create(),selected=null,busy=false,aiTimer=null,finishTimer=null,generation=0,dialogKind='',manualPause=false,hiddenPause=false;
const BOT_THINK_MS=3200;
let reduced=matchMedia('(prefers-reduced-motion:reduce)').matches;
const now=()=>performance.now(),art=c=>'assets/menu-v036/character-'+c.art+'.webp',teamName=t=>t==='blue'?'Azul':'Vermelho';
const alive=t=>state.cards.filter(c=>c.team===t&&c.hp>0),isAutomatic=()=>M.current(state)?.controller==='bot';
const format=ms=>{const seconds=Math.floor(ms/1000);return String(Math.floor(seconds/60)).padStart(2,'0')+':'+String(seconds%60).padStart(2,'0');};
const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function fit(){stage.style.setProperty('--battle-scale',String(Math.min(innerWidth/1600,innerHeight/900)));CardTouch.close();}
function cancelTimers(){clearTimeout(aiTimer);clearTimeout(finishTimer);aiTimer=finishTimer=null;generation++;busy=false;}
function say(text){$('battle-message').textContent=text;}
function closeDialog(){dialog.close();dialogKind='';schedule();}
function openDialog(kind,title,body,actions=[]){
 CardTouch.close();clearTimeout(aiTimer);aiTimer=null;
 dialogKind=kind;$('dialog-title').textContent=title;$('dialog-body').innerHTML=body;$('dialog-actions').replaceChildren();
 $('dialog-close').hidden=kind==='setup'||kind==='result';
 for(const action of actions){const b=document.createElement('button');b.textContent=action.label;b.className=action.primary?'primary':'';b.addEventListener('click',action.run);$('dialog-actions').append(b);}
 if(!dialog.open)dialog.showModal();
}
function showSetup(){
 const choices=M.roster.map((name,i)=>'<option value="'+i+'">'+name+'</option>').join('');
 openDialog('setup','Escolha o seu personagem.', '<p>Você controla <b>somente um personagem</b> da equipe azul. Seus três aliados e os quatro adversários são bots.</p><label class="player-choice">Seu personagem<select id="player-character">'+choices+'</select></label><p>Elimine a equipe adversária para marcar um ponto. A primeira equipe com <b>3 pontos</b> vence.</p><p>Os bots esperam 3,2 segundos antes de agir. Nesta estrutura de teste, todos têm <b>100 PV e 25 de dano</b>. A habilidade principal fica na estrela e só mostra suas informações ao clicar.</p><p class="error" id="setup-error" role="status"></p>',[{label:'Iniciar batalha',primary:true,run:()=>{
  if(!M.start(state,now(),Number($('player-character').value))){$('setup-error').textContent='Escolha um personagem disponível.';return;}
  selected=state.playerId;closeDialog();render();schedule();
 }}]);
}
function cardHTML(c){const active=M.current(state)?.id===c.id&&state.phase==='active';return '<button type="button" class="combat-card '+(active?'is-current ':'')+(selected===c.id?'is-selected ':'')+(c.hp===0?'dead':'')+'" data-controller="'+c.controller+'" data-battle-card="'+c.id+'" aria-label="'+escape(c.name)+', equipe '+teamName(c.team)+', '+c.hp+' de '+c.maxHp+' PV'+(c.controller==='player'?', seu personagem':', bot')+(active?', vez atual':'')+'"><span class="card-rim"></span><span class="slot-gem" aria-hidden="true">?</span><img class="card-illustration" src="'+art(c)+'" alt="" draggable="false"><span class="card-info"><span class="card-name">'+c.name+'</span><span class="card-vitals"><img src="assets/card-touch-v044/heart.png" alt="Vida"><b>'+c.hp+'</b><img src="assets/card-touch-v044/sword.png" alt="Dano"><small>'+c.atk+'</small></span><span class="card-hp"><i style="width:'+c.hp+'%"></i></span></span></button>';}
function render(){
 for(const team of ['blue','red']){$('team-'+team).innerHTML=state.cards.filter(c=>c.team===team).map(cardHTML).join('');$('score-'+team).textContent=state.score[team];$('pips-'+team).innerHTML=Array.from({length:3},(_,i)=>'<i class="'+(i<state.score[team]?'filled':'')+'"></i>').join('');$(team+'-alive').textContent=alive(team).length+' em campo';}
 $('round').textContent='RODADA '+state.round;$('pause').disabled=state.phase!=='active';$('pause').textContent=state.paused?'Retomar':'Pausar';document.body.classList.toggle('paused',state.paused);
 const current=M.current(state),last=state.cards.find(c=>c.id===state.last);
 $('queue').innerHTML=[[M.next(state),'PRÓXIMO','next'],[current,'VEZ ATUAL','current'],[last,'ÚLTIMO ATAQUE','last']].map(([c,label,role])=>'<button class="queue-card '+(c?.team||'')+' '+role+'" '+(c?'data-inspect="'+c.id+'"':'disabled')+'><span><small>'+label+'</small>'+(c?c.name:'—')+'</span>'+(c?'<img src="'+art(c)+'" alt="">':'')+'</button>').join('');
 const owned=M.player(state);$('action-owner').textContent=owned?owned.name.toUpperCase():'SEU PERSONAGEM';$('action-team').textContent=owned?'VOCÊ · EQUIPE AZUL':'';$('player-identity').textContent=owned?'VOCÊ: '+owned.name:'UM JOGADOR · SETE BOTS';$('principal-ability').disabled=!owned;$('principal-ability').setAttribute('aria-label',owned?'Ver habilidade principal de '+owned.name:'Habilidade principal');
 const canAct=M.canPlayerAct(state)&&!busy;$('basic').disabled=!canAct;
 $('action-hint').textContent=state.phase==='finished'?'Série encerrada.':state.paused?'Ações pausadas. O relógio continua.':busy?'Resolvendo ataque…':isAutomatic()?'Aguarde: o bot está pensando.':'Clique no oponente para escolher o alvo.';
 updateInspector();CardTouch.refresh();
 if(state.phase==='active')say(state.paused?'Ações pausadas.':busy?'Ataque em andamento…':(current.controller==='player'?'Sua vez · '+current.name:current.name+' · bot pensando…'));
}
function updateInspector(){const c=M.player(state);if(!c){$('portrait').innerHTML='';$('inspector').innerHTML='<h2>Prepare a equipe</h2>';return;}
 $('portrait').innerHTML='<img src="'+art(c)+'" alt="'+c.name+'">';
 $('inspector').innerHTML='<h2>'+c.name+'<small>VOCÊ · AZUL</small></h2><div class="stat-life"><strong>'+c.hp+'</strong><small>/ '+c.maxHp+'</small><img src="assets/card-touch-v044/heart.png" alt="Vida"></div><div class="stat-detail"><img src="assets/card-touch-v044/sword.png" alt="Dano"><b>'+c.atk+'</b><span>DANO BÁSICO</span><button id="inspect-selected">Detalhes</button></div><p class="stat-note">'+(c.hp>0?'sem efeitos ativos':'eliminado nesta rodada')+'</p>';
 $('inspect-selected').addEventListener('click',()=>inspect(c.id));
 for(const el of document.querySelectorAll('[data-battle-card]'))el.classList.toggle('is-selected',el.dataset.battleCard===c.id);
}
function inspect(id){const c=state.cards.find(c=>c.id===id);if(!c)return;selected=id;updateInspector();openDialog('info',c.name+' · equipe '+teamName(c.team),'<p><b>Vida:</b> '+c.hp+' / '+c.maxHp+' PV<br><b>Dano básico:</b> '+c.atk+'<br><b>Estado:</b> '+(c.hp?'em campo':'eliminado')+'</p><p><b>Habilidade:</b> não definida nesta estrutura.<br><b>Atributos e efeitos:</b> nenhum efeito adicional configurado.</p><p>Os valores de vida e dano são provisórios para testar a arena. Não representam o balanceamento oficial do personagem.</p>',[{label:'Voltar ao campo',run:closeDialog}]);}
function targetHint(){if($('basic').disabled)return;CardTouch.close();const actor=M.current(state);document.querySelectorAll('[data-battle-card]').forEach(el=>{const c=state.cards.find(c=>c.id===el.dataset.battleCard);el.classList.toggle('target-ready',c.team!==actor.team&&c.hp>0);});say('Escolha uma carta da equipe '+teamName(M.opposite(actor.team))+' e clique em ATACAR.');document.querySelector('[data-battle-card="'+alive(M.opposite(actor.team))[0].id+'"]').focus({preventScroll:true});}
function perform(targetId,origin='player'){
 if(busy||state.paused||dialog.open||state.phase!=='active')return false;
 const actor=M.current(state),result=origin==='bot'?M.botAttack(state,actor.id,targetId,now()):M.playerAttack(state,targetId,now());if(!result)return false;
 CardTouch.close();clearTimeout(aiTimer);busy=true;const ticket=++generation;render();
 const target=document.querySelector('[data-battle-card="'+result.target+'"]'),source=document.querySelector('[data-battle-card="'+result.actor+'"]');
 if(!reduced){source?.animate([{transform:'translateY(0)'},{transform:'translateY(-20px) scale(1.06)'},{transform:'translateY(0)'}],{duration:420,easing:'ease-out'});target?.animate([{filter:'brightness(2)'},{filter:'brightness(1)'}],{duration:450});const n=document.createElement('span');n.className='damage-number';n.textContent='−'+result.damage;target?.append(n);setTimeout(()=>n.remove(),850);}
 say((result.defeated?'Eliminado! ':'')+'−'+result.damage+' PV em '+state.cards.find(c=>c.id===targetId).name);
 finishTimer=setTimeout(()=>{if(ticket!==generation)return;busy=false;selected=state.playerId;render();if(state.phase==='round-end'||state.phase==='finished')showResult();else schedule();},reduced?200:650);
 return true;
}
function schedule(){clearTimeout(aiTimer);aiTimer=null;if(state.phase!=='active'||state.paused||busy||dialog.open||document.hidden||!isAutomatic())return;
 const revision=state.revision,ticket=generation;
 aiTimer=setTimeout(()=>{if(ticket!==generation||revision!==state.revision||busy||state.paused||dialog.open||document.hidden)return;const actor=M.current(state),targets=alive(M.opposite(actor.team)).sort((a,b)=>a.hp-b.hp||a.slot-b.slot);if(targets[0])perform(targets[0].id,'bot');},BOT_THINK_MS);
}
function showResult(){const finished=state.phase==='finished',winner=state.roundWinner;openDialog('result',finished?'Equipe '+teamName(winner)+' vence a série!':'Ponto para a equipe '+teamName(winner),'<img class="match-emblem" src="assets/menu-v036/trophy.webp" alt=""><div class="result-score"><b>'+state.score.blue+'</b><span>×</span><b>'+state.score.red+'</b></div><p>'+ (finished?'Três vitórias conquistadas. Tempo final: <b>'+format(M.elapsed(state,now()))+'</b>.':'Os quatro adversários foram eliminados. As duas equipes voltam com vida cheia na próxima rodada; o cronômetro continua.')+'</p>',[{label:finished?'Nova série':'Próxima rodada',primary:true,run:()=>{if(finished){restart();return;}dialog.close();dialogKind='';M.continueRound(state,now());manualPause=hiddenPause=false;selected=state.playerId;render();schedule();}},{label:'Exportar registro',run:exportState}]);say(finished?'Vitória final da equipe '+teamName(winner):'Rodada encerrada.');}
function exportState(){const data={version:'0.46.0',mode:'single-character',botThinkMs:BOT_THINK_MS,elapsedMs:M.elapsed(state,now()),...state};const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='goghos-batalha-0.46.0.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
function restart(){cancelTimers();CardTouch.close();dialog.close();state=M.create();manualPause=hiddenPause=false;selected=null;render();showSetup();}
function setPaused(){const value=manualPause||hiddenPause;if(state.phase==='active'){M.pause(state,value,now());CardTouch.close();clearTimeout(aiTimer);render();schedule();}}
CardTouch.init({selector:'[data-battle-card]',assets:'assets/card-touch-v044/',labels:{attack:'ATACAR'},getCard:el=>{const c=state.cards.find(c=>c.id===el.dataset.battleCard);return c&&{...c,ability:{name:'Sem habilidade definida',text:'Somente ataque básico nesta arena de testes. Nenhuma habilidade especial ou atributo de classe foi criado.'}};},isAttackTurn:c=>M.canPlayerAct(state)&&!busy&&!dialog.open&&c.hp>0&&c.team!==M.player(state)?.team,onAttack:c=>perform(c.id)});
$('battle-field').addEventListener('click',e=>{const el=e.target.closest('[data-battle-card]');if(el){selected=el.dataset.battleCard;updateInspector();}});
$('queue').addEventListener('click',e=>{const el=e.target.closest('[data-inspect]');if(el)inspect(el.dataset.inspect);});
$('basic').addEventListener('click',targetHint);
$('principal-ability').addEventListener('click',()=>{const c=M.player(state);if(!c)return;openDialog('info','Habilidade principal · '+c.name,'<p>A estrela identifica a habilidade principal do seu personagem.</p><p>O nome, a descrição e o efeito ainda não foram definidos. Nenhuma habilidade será inventada ou executada por este botão.</p>',[{label:'Voltar ao campo',run:closeDialog}]);});
document.querySelectorAll('[data-slot]').forEach(el=>el.addEventListener('click',()=>{const support=el.dataset.slot==='support';openDialog('info',support?'Apoio '+el.dataset.index+' de 3':'Espaço de item',support?'<p>Espaço vazio, limitado a três apoios. A silhueta com ? indica que falta o ícone definitivo do apoio.</p><p>Nenhum efeito de apoio foi criado.</p>':'<p>Nenhum item equipado. A silhueta com ? indica que falta o ícone definitivo do item.</p><p>Nenhum efeito foi criado.</p>',[{label:'Voltar ao campo',run:closeDialog}]);}));
const missingArt={scene:['Cenário e piso','Envie o fundo e o piso da arena, preferencialmente em camadas separadas, com a perspectiva da referência.'],score:['Placar das equipes','Envie as faixas azul e vermelha e o emblema central do campeonato, deixando livre a área dos números.'],cards:['Molduras das cartas','Envie a moldura da carta com transparência, com as áreas de nome, vida e dano. As ilustrações dos personagens que já recebemos continuam em uso.'],queue:['Faixas da ordem de ação','Envie as três faixas para próximo, vez atual e último atacante, com espaço para o retrato.'],stats:['Painel do personagem','Envie a moldura do painel e a barra de vida. O retrato, o coração e a espada originais já estão disponíveis.']};
document.querySelectorAll('[data-art-needed]').forEach(el=>el.addEventListener('click',()=>{const [title,description]=missingArt[el.dataset.artNeeded];openDialog('info','Arte pendente · '+title,'<p>'+description+'</p><p>A silhueta com ? é apenas uma marcação para você identificar a peça que falta.</p>',[{label:'Voltar ao campo',run:closeDialog}]);}));
$('pause').addEventListener('click',()=>{manualPause=!manualPause;setPaused();});
$('restart').addEventListener('click',()=>{openDialog('confirm','Reiniciar a série?','<p>O placar, as equipes e o cronômetro desta sessão serão restaurados.</p>',[{label:'Continuar jogando',run:closeDialog},{label:'Reiniciar',primary:true,run:restart}]);});
$('motion').addEventListener('click',()=>{reduced=!reduced;document.body.classList.toggle('reduced',reduced);$('motion').setAttribute('aria-pressed',String(reduced));$('motion').textContent=reduced?'Efeitos reduzidos':'Efeitos';});
$('history').addEventListener('click',()=>openDialog('info','Registro da série','<ul class="dialog-log">'+state.events.map(e=>'<li><small>'+format(e.ms)+' · '+escape(e.type)+'</small>'+escape(e.text)+'</li>').join('')+'</ul>',[{label:'Voltar ao campo',run:closeDialog}]));
$('export-battle').addEventListener('click',exportState);
$('help').addEventListener('click',()=>openDialog('info','Como jogar','<p><b>1.</b> Na sua vez, clique em uma carta inimiga. O primeiro clique mostra ATACAR; o segundo abre os detalhes; o terceiro fecha.</p><p><b>2.</b> ATACAR só fica disponível na vez do seu personagem. Cartas com zero PV saem da ordem de ação.</p><p><b>3.</b> Elimine os quatro inimigos para marcar um ponto. Quem alcançar três pontos vence a série.</p><p>A ordem alterna as equipes e ignora eliminados. A equipe inicial alterna a cada rodada. O relógio mede toda a duração da série, incluindo pausas e intervalos.</p><p>Use Tab/Enter e Escape para navegar. Você controla somente o personagem escolhido. Os outros sete são bots e pensam por 3,2 segundos antes de agir. Se seu personagem for eliminado, seus aliados continuam jogando até a rodada acabar. A estrela fixa abre as informações da habilidade principal.</p>',[{label:'Entendi',run:closeDialog}]));
$('dialog-close').addEventListener('click',closeDialog);dialog.addEventListener('cancel',e=>{if(dialogKind==='setup'||dialogKind==='result')e.preventDefault();});dialog.addEventListener('close',schedule);
document.addEventListener('visibilitychange',()=>{hiddenPause=document.hidden;setPaused();});window.addEventListener('resize',fit);
setInterval(()=>$('clock').textContent=format(M.elapsed(state,now())),200);
window.GoghosBattle=Object.freeze({snapshot:()=>JSON.parse(JSON.stringify({...state,elapsedMs:M.elapsed(state,now()),botThinkMs:BOT_THINK_MS,busy})),destroy(){cancelTimers();CardTouch.destroy();}});
fit();document.body.classList.toggle('reduced',reduced);$('motion').setAttribute('aria-pressed',String(reduced));render();showSetup();
})();
