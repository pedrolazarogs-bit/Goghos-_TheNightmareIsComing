// Painel da mão Reset (lado direito da batalha): cartas compradas pelo jogador, contagem do monte e da mão adversária.
// Cartas de Apoio usam a arte enviada (mesmo recorte do painel de Apoio); as demais mostram a arte de assets/reset/<id>.png, ou um espaço reservado.
(function(G){
const art=c=>c.supportCard?G.supportArtHTML(c)
  :`<div class="scard"><span>${c.name}</span><img decoding="sync" src="${c.art}" alt="${c.name}" class="fill" onload="this.previousElementSibling.remove()" onerror="this.remove()"></div>`;
const mini=(h,isNew)=>{const c=h.card,t=G.CARD_TYPES[c.type];
  return `<div class="hcard${isNew?' new':''}" data-hand="${h.iid}" style="--tc:${t.color}" title="${c.name} · ${t.label}${c.placeholder?' (provisória)':''}">${art(c)}<em>${t.label}</em></div>`;};
G.handPanelHTML=s=>{
  const d=s.deck;if(!d)return '';
  const newIds=new Set(d.last&&d.last.round===s.round?d.last.player.map(c=>c.iid):[]),mine=G.getHand(s,'player');
  return `<aside class="mao"><h4>Mão</h4><p class="mo-info">Monte: ${d.pile.length}/${d.total}<br>Adversário: ${d.hands.enemy.length} carta${d.hands.enemy.length===1?'':'s'}</p><p class="mo-info piles">${G.pilesLineHTML?G.pilesLineHTML(s):''}</p>`
    +(mine.length?`<div class="mo-grid">${mine.map(h=>mini(h,newIds.has(h.iid))).join('')}</div>`:'<p class="mo-info">Sem cartas ainda</p>')+'</aside>';
};
// Aviso da compra do reset atual (aparece durante toda a rodada em que a compra aconteceu).
G.resetNoticeHTML=s=>{
  const l=s.deck&&s.deck.last;if(!l||l.round!==s.round)return '';
  const you=l.player.length?l.player.map(c=>{const d=G.getResetCard(c.id);return `${d.name} <small>(${G.CARD_TYPES[d.type].label})</small>`;}).join(', '):'nenhuma (monte vazio)';
  const dl=(l.dalles||[]).map(x=>`${x.side==='player'?'você':'adversário'} ${x.obtained?'obteve '+x.name+' <small>('+G.RARITY_LABEL[x.rarity]+')</small>':x.ok?'não achou personagem elegível':'—'}`).join(' · ');
  return `<p class="reset-note">Reset de velocidade — você comprou: ${you} · adversário comprou ${l.enemy.length}${dl?` · Daly: ${dl}`:''}</p>`;
};
})(globalThis.GOGHOS);
