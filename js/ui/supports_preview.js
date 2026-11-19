(function(){
'use strict';
const M=GoghosBattleLab,$=id=>document.getElementById(id),dialog=$('support-dialog'),now=()=>performance.now();
let state=M.create(),enemyId='red-0';
const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function openDialog(kind,title,body,actions){dialog.dataset.kind=kind;$('support-dialog-title').textContent=title;$('support-dialog-body').innerHTML=body;$('support-dialog-actions').replaceChildren();for(const a of actions){const b=document.createElement('button');b.textContent=a.label;b.disabled=!!a.disabled;b.className=a.primary?'primary':'';b.addEventListener('click',a.run);$('support-dialog-actions').append(b);}if(!dialog.open)dialog.showModal();}
function say(text){$('support-test-status').textContent=text;}
const dock=GoghosSupportUI.mount($('preview-supports'),{getState:()=>state,openDialog,closeDialog:()=>dialog.close(),onChange:render,onApplied:r=>{render();say(r.text);},now});
function render(){
 dock.render();$('choose-supports').disabled=state.phase!=='ready';$('start-support-test').disabled=state.phase!=='ready';
 $('support-test-phase').textContent=state.phase==='ready'?'Prepare seus apoios':state.phase==='finished'?'Série encerrada · '+state.score.blue+' × '+state.score.red:state.phase==='round-end'?'Rodada encerrada · '+state.score.blue+' × '+state.score.red:state.phase==='blocked'?'Aguardando regras de ataque':'Seu personagem: '+M.player(state).name+' · rodada '+state.round;
 for(const team of ['blue','red'])$('support-'+team+'-team').innerHTML=state.cards.filter(c=>c.team===team).map(c=>'<div class="support-test-character"><strong>'+escape(c.name)+(c.id===state.playerId?' · você':'')+'</strong><label>PV <input type="number" min="0" max="'+c.maxHp+'" step="1" value="'+c.hp+'" data-test-hp="'+c.id+'" aria-label="Vida de '+escape(c.name)+'" '+(state.phase==='active'?'':'disabled')+'> / '+c.maxHp+'</label><small>Dano impresso: '+(c.baseAtk===null?'—':c.baseAtk+(c.hits>1?' × '+c.hits:''))+'</small><span class="health-track"><i style="width:'+(100*c.hp/c.maxHp)+'%"></i></span></div>').join('');
 const enemies=state.cards.filter(c=>c.team==='red'&&c.hp>0);if(!enemies.some(c=>c.id===enemyId))enemyId=enemies[0]?.id||'';
 $('support-test-enemy').innerHTML=enemies.map(c=>'<option value="'+c.id+'">'+escape(c.name)+' · '+c.hp+' PV</option>').join('');$('support-test-enemy').value=enemyId;$('support-test-enemy').disabled=state.phase!=='active';
 $('support-test-attack').disabled=!M.canPlayerAct(state)||!enemyId;
 const enemy=state.cards.find(c=>c.id===enemyId);$('support-test-enemy-attack').disabled=state.phase!=='active'||!M.player(state)?.hp||!enemy||enemy.atk===null;
 $('support-next-round').hidden=state.phase!=='round-end';$('support-test-log').innerHTML=state.events.slice(0,12).map(e=>'<li>'+escape(e.text)+'</li>').join('');
}
// Manual controls belong exclusively to this bench; the real arena keeps its normal turn order.
function returnToPlayer(){if(state.phase==='active')state.cursor=state.order.indexOf(state.playerId);}
$('choose-supports').addEventListener('click',dock.openPicker);
$('start-support-test').addEventListener('click',()=>{if(M.start(state,now(),0)){render();say('Ajuste a vida para testar cura ou Papakill. Clique nos ícones para ativar os apoios.');}});
$('reset-support-test').addEventListener('click',()=>{dialog.close();state=M.create();enemyId='red-0';render();say('Nova série de teste. Obtenha seus apoios novamente.');});
$('support-test-enemy').addEventListener('change',e=>{enemyId=e.target.value;render();});
document.querySelector('.support-teams').addEventListener('change',e=>{if(!e.target.matches('[data-test-hp]')||state.phase!=='active')return;const c=state.cards.find(c=>c.id===e.target.dataset.testHp),value=e.target.valueAsNumber;if(!c||!Number.isInteger(value)||value<0||value>c.maxHp){render();say('Informe uma vida inteira entre zero e o máximo da carta.');return;}c.hp=value;state.revision++;render();say(c.name+': vida ajustada para '+value+' PV nesta bancada.');});
$('support-test-attack').addEventListener('click',()=>{const r=M.playerAttack(state,enemyId,now());if(r){returnToPlayer();render();say('Seu ataque: '+r.damage+' de dano'+(r.bonus?' · +'+r.bonus+' do apoio':'')+'.');}});
$('support-test-enemy-attack').addEventListener('click',()=>{if(state.phase!=='active'||!M.player(state)?.hp)return;const saved=state.cursor;state.cursor=state.order.indexOf(enemyId);const r=M.botAttack(state,enemyId,state.playerId,now());if(!r){state.cursor=saved;return;}returnToPlayer();render();say('Ataque recebido: '+r.damage+' de dano'+(r.blocked?' · '+r.blocked+' bloqueados pelo escudo':'')+'.');});
$('support-next-round').addEventListener('click',()=>{if(M.continueRound(state,now())){returnToPlayer();render();say('Vida restaurada. Apoios usados não recarregam; os preparados aguardam o próximo ataque.');}});
$('support-dialog-close').addEventListener('click',()=>dialog.close());
window.GoghosSupportBench=Object.freeze({snapshot:()=>JSON.parse(JSON.stringify(state))});render();
})();
