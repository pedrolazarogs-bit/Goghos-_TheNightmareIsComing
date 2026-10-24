// A mão contém todas as cartas compradas, inclusive as medalhas. Apenas o jogador vê suas cartas.
(function(G){
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const icon=name=>`<img class="choice-icon" src="assets/visual-v0.28/icons/${name}.svg" alt="" aria-hidden="true">`;
const art=c=>{
  if(c.type==='DALY'){
    const m=G.MEDAL_COLORS[c.rarity];
    return `<div class="scard medal-card ${c.rarity.toLowerCase()}" style="--medal:${m.color}"><span class="medal-emblem" aria-hidden="true">${icon('credit')}</span><strong>${c.name}</strong><span>${G.RARITY_LABEL[c.rarity]}<br>Resgate 1 personagem</span></div>`;
  }
  if(c.supportCard||c.type==='PRIMORDIAL')return G.supportArtHTML(c);
  return `<div class="scard placeholder-card"><b>${c.type==='ITEM'?'◇':'✧'}</b><span>${c.name}</span></div>`;
};
const mini=(h,isNew,opts={})=>{
  const c=h.card||G.getResetCard(h.id),t=G.CARD_TYPES[c.type];
  return `<button type="button" class="hcard${isNew?' new':''}${opts.pickable?' pickable':''}${opts.selected?' selected':''}" ${opts.incoming?'data-incoming="1" disabled':`data-hand="${h.iid}"`} data-card-type="${c.type.toLowerCase()}" style="--tc:${c.type==='DALY'?c.color:t.color}" title="${esc(c.name+' · '+t.label)}" aria-label="${esc(c.name)}" aria-pressed="${!!opts.selected}">${art(c)}<em><i aria-hidden="true"></i>${t.label}</em>${isNew?'<span class="hcard-new-badge" aria-hidden="true">Nova</span>':''}</button>`;
};
G.handPanelHTML=(s,selectedIid=null,detail='')=>{
  const d=s.deck;if(!d)return '';
  const choice=d.pendingChoice,mine=G.getHand(s,'player');
  const newIds=new Set(d.last&&d.last.round===s.round?d.last.player.map(c=>c.iid):[]);
  const choiceHtml=choice?`<div class="hand-choice" role="region" aria-label="Escolha de carta para a mão"><span class="hand-choice-kicker">${icon('cards')}Nova compra</span><strong>Mão cheia · ${mine.length}/${d.handLimit}</strong><span>Você comprou <b>${G.getResetCard(choice.incoming.id).name}</b>. Toque em uma das suas cartas para substituí-la ou descarte a nova.</span><div class="incoming-card"><span class="incoming-label">Nova carta</span>${mini(choice.incoming,true,{incoming:true})}</div><button data-act="keep-new"><span>Descartar a nova e manter minha mão</span></button></div>`:'';
  return `${choice?'<div class="hand-backdrop" aria-hidden="true"></div>':''}<aside class="mao${choice?' choose-replacement':''}" aria-label="Sua mão"><header class="hand-header"><h4>${icon('cards')}<span>Sua mão</span></h4><span class="hand-count" aria-label="${mine.length} de ${d.handLimit} cartas">${mine.length}/${d.handLimit}</span></header><p class="mo-info">${choice?'Escolha a carta que vai sair':'Cartas compradas do monte principal'}</p>`
    +(mine.length?`<div class="mo-grid" style="--hand-count:${mine.length}">${mine.map(h=>mini(h,newIds.has(h.iid),{pickable:true,selected:selectedIid===h.iid})).join('')}</div>`:`<p class="mo-info hand-empty">${icon('cards')}<span>A primeira compra acontece no reset da velocidade.</span></p>`)+choiceHtml+(choice?'':detail)+'</aside>';
};
G.resetNoticeHTML=s=>{
  const l=s.deck?.last;if(!l||l.round!==s.round)return '';
  const you=l.player.length?l.player.map(c=>G.getResetCard(c.id).name).join(', '):'nenhuma (monte vazio)';
  return `<p class="reset-note">Reset de velocidade · sua compra: ${you} · adversário: ${l.enemy.length} carta(s). As compras vão para a mão.</p>`;
};
})(globalThis.GOGHOS);
