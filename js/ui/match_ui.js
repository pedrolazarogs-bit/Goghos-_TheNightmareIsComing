// Painéis da partida: Daly Mãe (esmeralda), Personagens Eliminados, escolha de recuperação e contagem dos 5 montes de personagens.
(function(G){
const lbl=r=>G.RARITY_LABEL[r];
// Daly Mãe de um lado. Exposta e do adversário na vez do jogador → clicável como alvo (data-daly).
G.dalyHTML=(s,side,o={})=>{
  const d=s.daly[side],exp=G.isDalyExposed(s,side),name=side==='player'?'Sua Daly Mãe':'Daly Mãe adversária';
  const hearts=Array.from({length:d.max},(_,i)=>`<img class="daly-heart${i<d.hp?'':' off'}" src="assets/arena/heart.png" alt="">`).join('');
  const status=d.hp<=0?'Derrotada':exp?'Exposta':'Protegida';
  return `<button type="button" class="daly ${exp?'exposed':'protected'}${o.pick?' pick':''}${o.target?' target':''}" data-daly="${side}"${o.pick?'':' disabled'} aria-label="${name}: ${d.hp}/${d.max} vidas, ${status}" title="${name}: ${d.hp}/${d.max} vidas. Cada ataque válido tira 1 vida."><span class="daly-name">${side==='player'?'Daly Mãe':'Daly Mãe adversária'}</span><span class="daly-emblem">${G.arenaArtHTML('daly')}<span class="daly-lives">${hearts}</span></span><span class="daly-status">${d.hp}/${d.max} <b>${status}</b></span></button>`;
};
// Área "Personagens Eliminados": separada dos montes e dos descartes de cartas.
G.eliminatedHTML=(s,freshEvent=false)=>{
  const chip=e=>{const ev=freshEvent&&s.lastEvent&&s.lastEvent.type==='defeat'&&s.lastEvent.targetUid===e.uid;return `<span class="chip${ev?' chip-hit':''}" title="${e.name} · ${e.class} · eliminado na rodada ${e.round}">${e.name} <small>${e.class}</small>${ev?` <b>−${s.lastEvent.damage}</b>`:''}</span>`;};
  const line=(side,t)=>{const l=G.getEliminated(s,side);return `<p>${t}: ${l.length?l.map(chip).join(' '):'<small>nenhum</small>'}</p>`;};
  return `<details class="elim"><summary>Personagens Eliminados <b>${s.eliminated.length}</b></summary><div>${line('player','Seus')}${line('enemy','Adversário')}</div></details>`;
};
// Escolha da recuperação (só aparece para o jogador; o bot escolhe sozinho). Opções exclusivas; indisponível fica desabilitada.
G.recoveryHTML=s=>{
  const r=s.recovery;if(!r||r.side!=='player')return '';
  const plural={COMMON:'Comuns',RARE:'Raros',EPIC:'Épicos'};
  const b=G.recoveryOptions(s).map(o=>`<button data-act="recover-${o.id}"${o.available?'':' disabled'}>${o.id} · ${o.drawCount} ${o.drawCount===1?lbl(o.rarity):plural[o.rarity]}<small>${o.have===0?'Monte vazio':!o.available?'Sem espaço na formação':`${o.have} no monte · até ${o.count} por recuperação`}</small></button>`).join('');
  const order=s.speedCursor===null?'':`<p>A hierarquia continua da velocidade ${s.speedCursor}. Os resgatados com essa velocidade ou menor entram na sequência desta rodada; os mais rápidos aguardam o próximo reset. Os empates mantêm o desempate da arena.</p>`;
  return `<div class="recov" role="region" aria-labelledby="recovery-title"><h3 id="recovery-title">Sua Daly Mãe perdeu uma vida</h3><p>Escolha uma raridade. Você recebe cartas do topo desse monte; se restarem menos, recebe as restantes.</p>${order}<div class="recovery-options">${b}</div></div>`;
};
// Linha com os 5 montes de personagens (disponíveis).
G.pilesLineHTML=s=>s.piles?`Personagens: ${G.RARITIES.map(r=>lbl(r)+' '+s.piles[r].length).join(' · ')}`:'';
})(globalThis.GOGHOS);

// Montes compartilhados visíveis, em zonas separadas; cartas eliminadas nunca entram aqui.
(function(G){
G.formationHTML=s=>{
  const p=s.formation;if(!p||p.side!=='player')return '';
  const singles=p.candidates.map(uid=>`<button data-act="advance-${uid}">Avançar só ${G.getUnit(s,uid).name}</button>`).join('');
  return `<div class="formation-choice"><h3 id="formation-title">A linha de frente precisa de defesa</h3><p>Um Suporte avançou automaticamente. Escolha qual deles ficará na frente, ou avance os dois. A batalha aguarda sua escolha.</p>${singles}<button data-act="advance-all">Avançar os dois Suportes</button></div>`;
};
})(globalThis.GOGHOS);
