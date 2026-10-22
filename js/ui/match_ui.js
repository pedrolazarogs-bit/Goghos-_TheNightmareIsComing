// Painéis da partida: Daly Mãe (esmeralda), Personagens Eliminados, escolha de recuperação e contagem dos 5 montes de personagens.
(function(G){
const lbl=r=>G.RARITY_LABEL[r];
// Daly Mãe de um lado. Exposta e do adversário na vez do jogador → clicável como alvo (data-daly).
G.dalyHTML=(s,side,o={})=>{
  const d=s.daly[side],exp=G.isDalyExposed(s,side),name=side==='player'?'Sua Daly Mãe':'Daly Mãe adversária';
  const gems=Array.from({length:d.max},(_,i)=>`<i class="gem${i<d.hp?'':' off'}"></i>`).join('');
  const st=d.hp<=0?'DERROTADA':exp?'EXPOSTA':'protegida';
  return `<div class="daly ${exp?'exposed':'protected'}${o.pick?' pick':''}${o.target?' target':''}" data-daly="${side}" title="${name}: ${d.hp}/${d.max} vidas. Cada ataque válido tira 1 vida.">${gems}<span>${name} · ${d.hp}/${d.max} · <b>${st}</b></span></div>`;
};
// Área "Personagens Eliminados": separada dos montes e dos descartes de cartas.
G.eliminatedHTML=(s,freshEvent=false)=>{
  const chip=e=>{const ev=freshEvent&&s.lastEvent&&s.lastEvent.type==='defeat'&&s.lastEvent.targetUid===e.uid;return `<span class="chip${ev?' chip-hit':''}" title="${e.name} · ${e.class} · eliminado na rodada ${e.round}">${e.name} <small>${e.class}</small>${ev?` <b>−${s.lastEvent.damage}</b>`:''}</span>`;};
  const line=(side,t)=>{const l=G.getEliminated(s,side);return `<p>${t}: ${l.length?l.map(chip).join(' '):'<small>nenhum</small>'}</p>`;};
  return `<div class="elim"><h4>Personagens Eliminados</h4>${line('player','Seus')}${line('enemy','Adversário')}</div>`;
};
// Escolha da recuperação (só aparece para o jogador; o bot escolhe sozinho). Opções exclusivas; indisponível fica desabilitada.
G.recoveryHTML=s=>{
  const r=s.recovery;if(!r||r.side!=='player')return '';
  const nm={A:'3 Comuns',B:'2 Raros',C:'1 Épico'};
  const b=G.recoveryOptions(s).map(o=>`<button data-act="recover-${o.id}"${o.available?'':' disabled'} title="${o.available?'':`Indisponível: restam ${o.have} no monte ${lbl(o.rarity)}`}">${o.id} · ${nm[o.id]||o.count+' '+lbl(o.rarity)}${o.available?'':` <small>(indisponível · restam ${o.have})</small>`}</button>`).join('');
  return `<div class="recov"><h3>Sua Daly Mãe perdeu uma vida</h3><p>Escolha UMA recuperação (não dá para combinar):</p>${b}</div>`;
};
// Linha com os 5 montes de personagens (disponíveis).
G.pilesLineHTML=s=>s.piles?`Personagens: ${G.RARITIES.map(r=>lbl(r)+' '+s.piles[r].length).join(' · ')}`:'';
})(globalThis.GOGHOS);
