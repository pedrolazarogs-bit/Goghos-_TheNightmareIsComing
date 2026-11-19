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
 let session=null,latestUid=0,toastUid=null,toastTimer=null,swapping=false;
 function render(){
  const state=getState();
  if(session!==state){session=state;latestUid=0;toastUid=null;swapping=false;clearTimeout(toastTimer);}
  const latest=state.supportRewards.at(-1),pending=M.pendingSupportReward(state);
  if(latest&&latest.uid!==latestUid){
   latestUid=latest.uid;swapping=false;clearTimeout(toastTimer);M.seeSupportReward(state,latest.uid);
   toastUid=latest.claimed?latest.uid:null;
   if(toastUid)toastTimer=setTimeout(()=>{if(session!==state)return;toastUid=null;render();},5000);
  }
  if(!pending)swapping=false;
  host.classList.add('support-dock-v051');
  host.innerHTML='<div class="support-hud-label"><span>APOIOS</span><small>'+slots().filter(slot=>slot&&slot.status!=='spent').length+' / 3 NA MÃO</small></div><div class="support-hud-slots">'+slots().map((slot,i)=>{const c=slot&&definition(slot.id),replace=swapping&&pending;return '<button type="button" data-support-slot="'+i+'" class="support-hud-slot '+(slot?.status||'empty')+(replace?' is-replace-target':'')+'" '+(replace&&busy()?'disabled ':'')+'aria-label="'+(replace?'Trocar '+escape(c?.name||'espaço vazio')+' por '+escape(definition(pending.id).name):c?escape(c.name)+' · '+status(slot):'Escolher apoio '+(i+1))+'">'+(c?art(c,'icon'):'<span class="support-empty-art" aria-hidden="true">?</span>')+'<small>'+(replace?'TROCAR':slot?status(slot):'VAZIO')+'</small></button>';}).join('')+'</div><p>'+(state.speedOrder?'Ciclo '+state.speedCycle+' · +1 apoio a cada reset':'1 uso por carta · na sua vez · sem gastar o ataque')+'</p>';
  const reward=pending||state.supportRewards.find(r=>r.uid===toastUid);
  if(reward&&['active','round-end'].includes(state.phase)){
   const c=definition(reward.id);
   host.insertAdjacentHTML('beforeend','<aside class="support-receipt '+(pending?'needs-choice':'')+'" data-offer-uid="'+reward.uid+'" aria-label="Apoio recebido"><div class="support-receipt-top"><button type="button" class="support-receipt-art" data-incoming-info aria-label="Ver carta '+escape(c.name)+'">'+art(c,'icon')+'</button><div role="status" aria-live="polite"><small>'+(pending?'MÃO CHEIA · 3 / 3':'APOIO RECEBIDO')+'</small><strong>'+escape(c.name)+'</strong></div>'+(!pending?'<button type="button" data-dismiss-receipt aria-label="Fechar aviso">×</button>':'')+'</div>'+(pending?'<p>'+(swapping?'Clique no ícone da mão que deseja trocar.':'Troque um apoio da mão ou descarte esta carta.')+'</p><div class="support-receipt-actions"><button type="button" data-reward-swap '+(busy()?'disabled':'')+'>'+(swapping?'Cancelar troca':'Trocar')+'</button><button type="button" data-reward-discard '+(busy()?'disabled':'')+'>Descartar nova</button></div>':'')+'</aside>');
  }
 }
 function openPicker(){
  if(!enabled())return;
  if(getState().phase!=='ready'){if(M.pendingSupportReward(getState())){swapping=true;render();host.querySelector('[data-support-slot]')?.focus();return;}openDialog('support','Apoios da série','<p>A cada reset da hierarquia de velocidade, você recebe uma carta. Os apoios de preparação são escolhidos antes de iniciar a série.</p>',[{label:'Voltar',run:closeDialog}]);return;}
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
 function showIncoming(){
  const reward=M.pendingSupportReward(getState())||getState().supportRewards.find(r=>r.uid===toastUid);if(!reward)return;
  const c=definition(reward.id);
  openDialog('support-card','Carta de apoio · '+c.name,'<div class="support-reveal">'+art(c,'card')+'<div><p>'+escape(effectNote(c))+'</p><p class="support-rule-note">'+(reward.claimed?'Já adicionada à mão.':'Escolha trocar ou descartar no aviso junto aos apoios.')+'</p></div></div>',[{label:'Voltar',run:closeDialog}]);
 }
 function resolveReward(index){
  const reward=M.pendingSupportReward(getState());if(!reward||busy())return;
  const accepted=index===undefined?M.discardSupportReward(getState(),reward.uid,now()):M.claimSupportReward(getState(),reward.uid,now(),index);
  if(accepted){swapping=false;toastUid=null;render();onChange?.();host.querySelector('[data-support-slot="'+(index??0)+'"]')?.focus({preventScroll:true});}
 }
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
 host.addEventListener('click',e=>{
  if(!enabled())return;
  if(e.target.closest('[data-incoming-info]')){showIncoming();return;}
  if(e.target.closest('[data-dismiss-receipt]')){toastUid=null;clearTimeout(toastTimer);render();return;}
  if(e.target.closest('[data-reward-discard]')){resolveReward();return;}
  if(e.target.closest('[data-reward-swap]')){if(busy())return;swapping=!swapping;render();host.querySelector(swapping?'[data-support-slot]':'[data-reward-swap]')?.focus();return;}
  const b=e.target.closest('[data-support-slot]');if(b){if(swapping)resolveReward(Number(b.dataset.supportSlot));else showActivation(Number(b.dataset.supportSlot));}
 },{signal:controller.signal});
 host.addEventListener('keydown',e=>{if(e.key==='Escape'&&swapping){e.preventDefault();swapping=false;render();host.querySelector('[data-reward-swap]')?.focus();}},{signal:controller.signal});
 render();return Object.freeze({render,openPicker,showActivation,destroy(){clearTimeout(toastTimer);controller.abort();host.replaceChildren();}});
}
root.GoghosSupportUI=Object.freeze({mount});
})(globalThis);
