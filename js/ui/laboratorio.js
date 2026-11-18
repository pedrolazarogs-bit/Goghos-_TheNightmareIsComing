(function(){
'use strict';
const model=GoghosLab,$=id=>document.getElementById(id);let state=model.create(),pending=null;
const image=id=>'assets/menu-v036/character-'+id+'.webp';
function flush(){if(pending){clearTimeout(pending.timer);model.act(state,'select',pending.id);pending=null;}}
function cancel(){if(pending){clearTimeout(pending.timer);pending=null;}}
function render(){
 const focused=document.activeElement?.dataset.card;
 for(const zone of ['hand','arena']){
  const cards=state.cards.filter(c=>c.zone===zone);
  $(zone).innerHTML=cards.map(c=>`<button class="card ${state.selected===c.id?'selected':''} ${c.hp===0?'defeated':''}" data-card="${c.id}" aria-pressed="${state.selected===c.id}" aria-label="${c.name}, ${c.hp} de 100 pontos de vida"><span class="card-top">CARTA DE TESTE <i>${c.hp===0?'SEM VIDA':'PRONTA'}</i></span><img src="${image(c.id)}" alt="" draggable="false"><span class="card-name">${c.name}</span><span class="health"><span style="width:${c.hp}%"></span></span><span class="card-bottom">${c.hp} / 100 PV <span>${state.selected===c.id?'SELECIONADA':'SELECIONAR'}</span></span></button>`).join('')||'<p class="empty">Nenhuma carta aqui. Mova uma carta pelo painel de inspeção.</p>';
  $(zone+'-count').textContent=cards.length+' carta'+(cards.length===1?'':'s');
 }
 const c=state.cards.find(c=>c.id===state.selected);
 $('selection').innerHTML=c?`<h3>${c.name}</h3><p><strong>${c.hp}</strong> / ${c.maxHp} PV</p><p>${c.zone==='hand'?'Na mão':'Na área de teste'} · ${c.hp===0?'Sem vida':'Disponível'}</p>`:'<p class="empty">Selecione uma carta para inspecionar e testar suas ações.</p>';
 for(const id of ['inspect','move','damage','heal'])$(id).disabled=!c;
 $('move').textContent=c?.zone==='arena'?'Voltar para a mão':'Mover para a área';
 $('events').replaceChildren(...state.events.map(e=>{const li=document.createElement('li'),tag=document.createElement('b');tag.textContent='#'+e.sequence+' / '+e.type;li.append(tag,document.createTextNode(e.detail));return li;}));
 if(!state.events.length){const li=document.createElement('li');li.textContent='Os próximos eventos aparecerão aqui.';$('events').append(li);}
 if(focused)document.querySelector('[data-card="'+focused+'"]')?.focus({preventScroll:true});
}
function announce(){ $('status').textContent=state.events[0]?.detail||''; }
function inspect(id){cancel();if(!model.act(state,'inspect',id))return;const c=state.cards.find(c=>c.id===id);$('detail-title').textContent=c.name;$('detail-body').innerHTML=`<img src="${image(id)}" alt="${c.name}"><p>Vida: ${c.hp} / ${c.maxHp}</p><p>Local: ${c.zone==='hand'?'mão':'área de teste'}</p><p>Identificador: carta-${c.id}</p>`;render();$('details').showModal();$('close').focus();}
for(const zone of ['hand','arena']){
 $(zone).addEventListener('click',e=>{const card=e.target.closest('[data-card]');if(!card)return;
  if(e.detail===0){cancel();model.act(state,'select',card.dataset.card);render();announce();return;}
  if(e.detail>1)return;flush();const id=card.dataset.card;pending={id,timer:setTimeout(()=>{pending=null;model.act(state,'select',id);render();announce();},250)};
 });
 $(zone).addEventListener('dblclick',e=>{const card=e.target.closest('[data-card]');if(card)inspect(card.dataset.card);});
 $(zone).addEventListener('contextmenu',e=>{const card=e.target.closest('[data-card]');if(card){e.preventDefault();inspect(card.dataset.card);}});
}
for(const type of ['move','damage','heal'])$(type).addEventListener('click',()=>{flush();model.act(state,type,state.selected,Number($('amount').value));render();announce();});
$('inspect').addEventListener('click',()=>{flush();inspect(state.selected);});
$('reset').addEventListener('click',()=>{cancel();$('details').close();state=model.create();$('amount').value='25';model.record(state,'reinício','Mesa restaurada: três cartas com 100 PV.');render();announce();});
$('clear').addEventListener('click',()=>{flush();model.act(state,'clear');render();$('status').textContent='Registro limpo.';});
$('export').addEventListener('click',()=>{flush();render();const blob=new Blob([JSON.stringify({version:'0.48.1',...state,opponent:window.GoghosOpponentLab?.snapshot()},null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='goghos-laboratorio-0.48.1.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);$('status').textContent='Registro exportado.';});
$('close').addEventListener('click',()=>$('details').close());
document.addEventListener('goghos:lab-event',e=>{model.record(state,e.detail.type,e.detail.text);render();});
model.record(state,'início','Laboratório pronto. Nenhuma alteração no jogo.');render();
})();
