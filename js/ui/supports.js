// Shared acquisition and activation UI for the arena and the isolated support bench.
(function(root){
'use strict';
const M=root.GoghosBattleLab,catalog=root.GoghosSupports;
const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function art(c,kind){return c[kind]?'<span class="support-art support-'+kind+'-art"><img src="'+c[kind]+'" alt="'+escape(kind==='card'?'Carta completa de '+c.name:'Ícone de '+c.name)+'" draggable="false"></span>':'<span class="support-card-missing"><b>?</b><span>Carta completa pendente</span></span>';}
function mount(host,options){
 const {getState,openDialog,closeDialog,onChange,onApplied,now}=options,controller=new AbortController();
 const enabled=()=>!options.enabled||options.enabled(),busy=()=>!!options.busy?.();
 const slots=()=>getState().supports.blue,definition=id=>catalog.find(c=>c.id===id);
 const status=slot=>slot.status==='armed'?'Ativado':slot.status==='spent'?'Usado':definition(slot.id).effect?'Pronto':'Pendente';
 function render(){
  host.classList.add('support-dock-v051');
  const waiting=getState().supportRewards.filter(r=>!r.claimed).length;
  host.innerHTML='<div class="support-hud-label"><span>APOIOS</span>'+(waiting?'<button type="button" class="support-rewards-trigger" data-support-rewards aria-label="Ver '+waiting+' apoios recebidos">+'+waiting+' RECEBIDOS</button>':'')+'<small>'+slots().filter(Boolean).length+' / 3 EQUIPADOS</small></div><div class="support-hud-slots">'+slots().map((slot,i)=>{const c=slot&&definition(slot.id);return '<button type="button" data-support-slot="'+i+'" class="support-hud-slot '+(slot?.status||'empty')+'" aria-label="'+(c?escape(c.name)+' · '+status(slot):'Escolher apoio '+(i+1))+'">'+(c?art(c,'icon'):'<span class="support-empty-art" aria-hidden="true">?</span>')+'<small>'+(slot?status(slot):'VAZIO')+'</small></button>';}).join('')+'</div><p>'+(getState().speedOrder?'Ciclo '+getState().speedCycle+' · +1 apoio a cada reset':'1 uso por carta · na sua vez · sem gastar o ataque')+'</p>';
 }
 function openPicker(){
  if(!enabled())return;
  if(getState().phase!=='ready'){if(getState().supportRewards.some(r=>!r.claimed)){openRewards();return;}openDialog('support','Apoios da série','<p>A cada reset da hierarquia de velocidade, você recebe uma carta. Os apoios de preparação são escolhidos antes de iniciar a série.</p>',[{label:'Voltar',run:closeDialog}]);return;}
  openDialog('support','Escolha seus apoios','<p>Até três apoios diferentes. A carta completa aparece ao obter; o ícone menor fica na batalha.</p><div id="support-catalog" class="support-catalog">'+catalog.map(c=>'<button type="button" data-support-choice="'+c.id+'" aria-label="Ver '+escape(c.name)+'">'+art(c,'icon')+'<strong>'+escape(c.name)+'</strong><small>'+(slots().some(s=>s?.id===c.id)?'EQUIPADO':c.effect?'EFEITO DISPONÍVEL':'REGRA PENDENTE')+'</small></button>').join('')+'</div><p class="support-rule-note">Uso único por carta em toda a série, no seu turno, sem consumir o ataque. Efeitos pendentes não podem ser ativados.</p>',[{label:'Concluir',run:closeDialog}]);
  document.getElementById('support-catalog').addEventListener('click',e=>{const b=e.target.closest('[data-support-choice]');if(b)showCard(definition(b.dataset.supportChoice));});
 }
 function showCard(c,obtained=false){
  const index=slots().findIndex(slot=>slot?.id===c.id),full=slots().every(Boolean),actions=[{label:'Outros apoios',run:openPicker}];
  if(index!==-1)actions.push({label:'Remover',run:()=>{if(M.removeSupport(getState(),index)){render();onChange?.();openPicker();}}});
  if(obtained)actions.push({label:'Continuar',primary:true,run:closeDialog});
  else actions.push({label:index!==-1?'Já equipado':full?'Três espaços ocupados':'Obter e equipar',primary:true,disabled:index!==-1||full,run:()=>{if(M.equipSupport(getState(),c.id)){render();onChange?.();showCard(c,true);}}});
  openDialog('support-card',(obtained?'Apoio obtido · ':'Carta de apoio · ')+c.name,'<div class="support-reveal '+(obtained?'is-obtained':'')+'">'+art(c,'card')+'<div><p class="support-card-state">'+(obtained?'ADICIONADO À SUA UI':c.effect?'EFEITO DISPONÍVEL':'REGRA PENDENTE')+'</p><p>'+escape(c.description)+'</p><p>'+escape(c.effect?effectNote(c):c.pending)+'</p>'+(!c.card?'<p>O ícone foi recebido; a carta completa ainda precisa ser enviada.</p>':'')+'<p class="support-rule-note">Preparação do laboratório. Nada é salvo na coleção ou no menu do jogo.</p></div></div>',actions);
 }
 function effectNote(c){return {heal:'Escolha um aliado vivo. Recupera até 70 PV, respeitando a vida máxima; não ressuscita.',boost:'Seu personagem recebe +50 no total do próximo ataque, uma vez, inclusive em ataques com vários golpes.',guard:'Seu personagem bloqueia até 80 de dano no próximo ataque recebido. O bloqueio acaba após esse ataque.',execute:'Escolha um oponente vivo com 1 a 39 PV. A eliminação também conta para encerrar a rodada.'}[c.effect]||c.pending;}
 function showReward(reward){
  if(!reward||reward.claimed)return;M.seeSupportReward(getState(),reward.uid);
  const c=definition(reward.id),reason=M.supportRewardReason(getState(),reward.uid);
  openDialog('support-reward','Apoio recebido · '+c.name,'<div class="support-reveal is-obtained">'+art(c,'card')+'<div><p class="support-card-state">RESET DA HIERARQUIA · +1 APOIO</p><p>Rodada '+reward.round+' · ciclo '+reward.cycle+' concluído.</p><p>'+escape(effectNote(c))+'</p><p>'+escape(reason||'Coloque a nova carta na UI. Ela ocupa um espaço vazio ou substitui uma carta já usada.')+'</p><p class="support-rule-note">Cada cópia recebida tem um uso. Cartas guardadas não são perdidas quando a UI está cheia.</p></div></div>',[{label:'Guardar e continuar',run:closeDialog},{label:'Colocar na UI',primary:true,disabled:!!reason,run:()=>{if(M.claimSupportReward(getState(),reward.uid,now())){render();onChange?.();closeDialog();}else showReward(reward);}}]);
 }
 function openRewards(){
  const waiting=getState().supportRewards.filter(r=>!r.claimed);if(waiting.length===1){showReward(waiting[0]);return;}
  openDialog('support','Apoios recebidos','<p>Cartas ganhas nos resets. Use um apoio para liberar um dos três espaços.</p><div id="support-reward-list" class="support-catalog">'+waiting.map(r=>{const c=definition(r.id);return '<button type="button" data-reward-uid="'+r.uid+'">'+art(c,'icon')+'<strong>'+escape(c.name)+'</strong><small>RODADA '+r.round+' · CICLO '+r.cycle+'</small></button>';}).join('')+'</div>',[{label:'Voltar',run:closeDialog}]);
  document.getElementById('support-reward-list').addEventListener('click',e=>{const b=e.target.closest('[data-reward-uid]');if(b)showReward(getState().supportRewards.find(r=>r.uid===Number(b.dataset.rewardUid)));});
 }
 function notice(){if(!enabled())return false;const reward=getState().supportRewards.find(r=>!r.seen&&!r.claimed);if(!reward)return false;showReward(reward);return true;}
 function showActivation(index){
  const slot=slots()[index];if(!slot){openPicker();return;}
  const c=definition(slot.id),s=getState();if(s.phase==='ready'){showCard(c);return;}
  const targets=M.supportTargets(s,index),choose=['heal','execute'].includes(c.effect);let targetId=targets[0]?.id||'';
  let reason=M.supportReason(s,index,targetId);if(busy())reason='Aguarde o ataque em andamento terminar.';
  const selection=choose&&targets.length?'<label class="support-target-label">Alvo do apoio<select id="support-target">'+targets.map(t=>'<option value="'+t.id+'">'+escape(t.name)+' · '+t.hp+' / '+t.maxHp+' PV</option>').join('')+'</select></label>':c.effect&&targets[0]?'<p>Alvo: <b>'+escape(targets[0].name)+'</b></p>':'';
  openDialog('support','Apoio · '+c.name,'<div class="support-activation">'+art(c,'icon')+'<div><p>'+escape(effectNote(c))+'</p>'+selection+'<p id="support-activation-note" role="status">'+escape(reason||'Pronto para ativar. Seu ataque continuará disponível.')+'</p><p class="support-rule-note">'+(slot.status==='armed'?'Ativado: aguardando o próximo ataque. O efeito continua preparado entre as rodadas até ser acionado.':slot.status==='spent'?'Já utilizado nesta série. O ícone continua aqui para consulta.':'Uma utilização em toda a série, apenas na sua vez.')+'</p></div></div>',[{label:'Voltar',run:closeDialog},{label:slot.status==='armed'?'Já ativado':slot.status==='spent'?'Já usado':c.effect?'Ativar apoio':'Regras pendentes',primary:true,disabled:!!reason,run:()=>{
   if(!enabled()||busy())return;
   const result=M.activateSupport(getState(),index,targetId,now());
   if(!result){showActivation(index);return;}
   closeDialog();render();onApplied?.(result);
  }}]);
  document.getElementById('support-target')?.addEventListener('change',e=>{targetId=e.target.value;});
 }
 host.addEventListener('click',e=>{if(!enabled())return;if(e.target.closest('[data-support-rewards]')){openRewards();return;}const b=e.target.closest('[data-support-slot]');if(b)showActivation(Number(b.dataset.supportSlot));},{signal:controller.signal});
 render();return Object.freeze({render,openPicker,showActivation,notice,destroy(){controller.abort();host.replaceChildren();}});
}
root.GoghosSupportUI=Object.freeze({mount});
})(globalThis);
