// Monte principal (Apoio, Habilidade Especial, Item, Daly): um monte único e embaralhado por batalha. Toda vez que a hierarquia de velocidade reseta
// (nova rodada), as DUAS equipes compram 1 carta dele (jogador primeiro, depois adversário). Quando o monte acaba, ninguém compra mais.
// Daly comprada é resolvida na hora por G.resolveDalle (js/core/roster.js) e NÃO provoca outra compra. Efeitos de Item/Habilidade ainda não existem: a mão só guarda as cartas.
// Personagens NÃO ficam neste monte: têm 5 montes próprios, um por raridade (roster.js).
(function(G){
const SIDES=['player','enemy'];
G.getResetCard=id=>G.RESET_CARDS.find(c=>c.id===id)||null;
const shuffle=(a,rng)=>{for(let i=a.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};
// Cada carta física no monte é uma instância {iid,id}; 'id' aponta para G.RESET_CARDS. rng injetável (testes).
G.createDeckState=(rng=Math.random)=>{
  const pile=[];let n=0;G.RESET_CARDS.filter(c=>G.CONFIG.mainDeckTypes.includes(c.type)).forEach(c=>{for(let i=0;i<c.copies;i++)pile.push({iid:'c'+n++,id:c.id});});
  return{pile:shuffle(pile,rng),total:pile.length,hands:{player:[],enemy:[]},discard:[],last:null,resets:new Set()};
};
// Compra 1 carta do topo do monte para a mão da equipe. Retorna a instância ou null se o monte acabou.
G.drawCard=(s,side)=>{const d=s.deck;if(!SIDES.includes(side))throw new Error('Equipe inválida.');
  const c=d.pile.pop();if(!c)return null;d.hands[side].push(c);return c;};
// Chamada quando a hierarquia de velocidade reseta (s.round já é o da nova rodada). Ambas as equipes compram.
// Cada rodada só conta UMA vez (d.resets): chamadas repetidas/duplicadas não compram de novo. Partida encerrada não compra.
G.onSpeedReset=s=>{
  if(s.result)return null;
  const d=s.deck;if(d.resets.has(s.round))return d.last;
  d.resets.add(s.round);
  const n=G.CONFIG.resetDraw.perTeam,last={round:s.round,player:[],enemy:[],dalles:[]};
  s.deck.last=last;
  SIDES.forEach(side=>{for(let i=0;i<n;i++){const c=G.drawCard(s,side);if(!c)continue;last[side].push(c);
    if(G.getResetCard(c.id).type==='DALY'){const r=G.resolveDalle(s,side,c);last.dalles.push({side,iid:c.iid,...r});}}});
  s.log.push('Reset de velocidade · '+(last.player.length?'você comprou '+last.player.map(c=>G.getResetCard(c.id).name).join(', '):'você não comprou (monte vazio)')
    +' · adversário comprou '+last.enemy.length+' carta'+(last.enemy.length===1?'':'s'));
  return last;
};
G.getHand=(s,side)=>s.deck.hands[side].map(c=>({...c,card:G.getResetCard(c.id)}));
})(globalThis.GOGHOS);
