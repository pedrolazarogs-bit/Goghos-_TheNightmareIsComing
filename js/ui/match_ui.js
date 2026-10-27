// Painéis da partida: Daly Mãe (esmeralda), Personagens Eliminados, escolha de recuperação e contagem dos 5 montes de personagens.
(function(G){
const lbl=r=>G.RARITY_LABEL[r];
const icon=name=>`<img class="choice-icon" src="assets/night-ui/icons/${name}.svg" alt="" aria-hidden="true">`;
const shield=exposed=>`<svg class="daly-state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${exposed?'<path d="M12 3 2 21h20L12 3Z"/><path d="M12 9v5m0 3v.1"/>':'<path d="m12 2 8 3-1 8c-1 4-4 7-7 9-3-2-6-5-7-9L4 5l8-3Z"/><path d="m8 12 3 3 5-6"/>'}</svg>`;
// Daly Mãe de um lado. Exposta e do adversário na vez do jogador → clicável como alvo (data-daly).
G.dalyHTML=(s,side,o={})=>{
  const d=s.daly[side],exp=G.isDalyExposed(s,side),name=side==='player'?'Sua Daly Mãe':'Daly Mãe adversária';
  const hearts=Array.from({length:d.max},(_,i)=>`<i class="daly-life-slot${i<d.hp?' full':' empty'}"><img class="daly-heart${i<d.hp?'':' off'}" src="assets/arena/heart.png" alt=""></i>`).join('');
  const status=d.hp<=0?'Derrotada':exp?'Exposta':'Protegida';
  return `<button type="button" class="daly ${exp?'exposed':'protected'}${o.pick?' pick':''}${o.target?' target':''}" data-daly="${side}"${o.pick?'':' disabled'} aria-label="${name}: ${d.hp}/${d.max} vidas, ${status}" title="${name}: ${d.hp}/${d.max} vidas. Cada ataque válido tira 1 vida."><span class="daly-name">${side==='player'?'Daly Mãe':'Daly Mãe adversária'}</span><span class="daly-emblem">${G.arenaArtHTML('daly')}<span class="daly-lives">${hearts}</span></span><span class="daly-status"><span>${d.hp}/${d.max}</span> ${shield(exp)}<b>${status}</b></span></button>`;
};
// Área "Personagens Eliminados": separada dos montes e dos descartes de cartas.
G.eliminatedHTML=(s,freshEvent=false)=>{
  const chip=e=>{const ev=freshEvent&&G.eventImpacts(s.lastEvent).find(x=>x?.type==='defeat'&&x.targetUid===e.uid);return `<span class="chip${ev?' chip-hit':''}" title="${e.name} · ${e.class} · eliminado na rodada ${e.round}">${e.name} <small>${e.class}</small>${ev?` <b>${ev.instant?'Steel Jaw':'−'+ev.damage}</b>`:''}</span>`;};
  const line=(side,t)=>{const l=G.getEliminated(s,side);return `<p>${t}: ${l.length?l.map(chip).join(' '):'<small>nenhum</small>'}</p>`;};
  return `<details class="elim"><summary>${icon('cards')}<span>Personagens Eliminados</span> <b>${s.eliminated.length}</b></summary><div>${line('player','Seus')}${line('enemy','Adversário')}</div></details>`;
};
// Escolha da recuperação (só aparece para o jogador; o bot escolhe sozinho). Opções exclusivas; indisponível fica desabilitada.
G.recoveryHTML=s=>{
  const r=s.recovery;if(!r||r.side!=='player')return '';
  const plural={COMMON:'Comuns',RARE:'Raros',EPIC:'Épicos'};
  const b=G.recoveryOptions(s).map(o=>`<button data-act="recover-${o.id}"${o.available?'':' disabled'} class="recovery-option" style="--choice-rarity:${G.MEDAL_COLORS?.[o.rarity]?.color||'#bb83f5'}">${icon('cards')}<span class="recovery-label">${o.id} · ${o.drawCount} ${o.drawCount===1?lbl(o.rarity):plural[o.rarity]}</span><small>${o.have===0?'Monte vazio':!o.available?'Sem espaço na formação':`${o.have} no monte · até ${o.count} por recuperação`}</small></button>`).join('');
  const order=s.speedCursor===null?'':`<p>A hierarquia continua da velocidade ${s.speedCursor}. Os resgatados com essa velocidade ou menor entram na sequência desta rodada; os mais rápidos aguardam o próximo reset. Os empates mantêm o desempate da arena.</p>`;
  return `<div class="recov" role="region" aria-labelledby="recovery-title"><div class="choice-emblem">${icon('heart')}</div><span class="choice-kicker">Reforce sua equipe</span><h3 id="recovery-title">Sua Daly Mãe perdeu uma vida</h3><p>Escolha uma raridade. Você recebe cartas do topo desse monte; se restarem menos, recebe as restantes.</p>${order}<div class="recovery-options">${b}</div></div>`;
};
// Linha com os 5 montes de personagens (disponíveis).
G.pilesLineHTML=s=>s.piles?`Personagens: ${G.RARITIES.map(r=>lbl(r)+' '+s.piles[r].length).join(' · ')}`:'';
})(globalThis.GOGHOS);

// Montes compartilhados visíveis, em zonas separadas; cartas eliminadas nunca entram aqui.
(function(G){
G.formationHTML=s=>{
  const p=s.formation;if(!p||p.side!=='player')return '';
  const singles=p.candidates.map(uid=>{const u=G.getUnit(s,uid);return `<button data-act="advance-${uid}" class="formation-single">${G.actorPortraitHTML?.(u,'formation-portrait')||''}<span>Avançar só ${u.name}</span></button>`;}).join('');
  return `<div class="formation-choice"><div class="choice-emblem"><img class="choice-icon" src="assets/night-ui/icons/mode.svg" alt="" aria-hidden="true"></div><span class="choice-kicker">Proteja sua Daly Mãe</span><h3 id="formation-title">A linha de frente precisa de defesa</h3><p>Um Suporte avançou automaticamente. Escolha qual deles ficará na frente, ou avance os dois. A batalha aguarda sua escolha.</p>${singles}<button data-act="advance-all" class="formation-all"><span>Avançar os dois Suportes</span></button></div>`;
};
})(globalThis.GOGHOS);
