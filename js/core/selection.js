// Seleção inicial: apresenta todos os Comuns distintos e a escolha segue
// jogador → bot → jogador → bot. No fim cada lado tem 2 personagens, ambos na linha de frente, com a retaguarda vazia.
// Sem lógica de decisão própria, o bot escolhe aleatoriamente entre os que ainda estão disponíveis.
(function(G){
const fail=error=>({ok:false,error});
const ORDER=['player','enemy','player','enemy'];
G.createSelection=(opts={})=>{
  const rng=opts.rng||Math.random,cfg=G.CONFIG.selection,pool=G.CHARACTERS.filter(c=>c.rarity==='COMMON'); // só Comuns reais; nada de outras raridades para completar
  if(pool.length<cfg.min)return fail('Não há personagens Comuns suficientes para iniciar a batalha (mínimo '+cfg.min+', cadastrados '+pool.length+').');
  const offered=pool.map(c=>c.id);
  return{ok:true,sel:{offered,picks:{player:[],enemy:[]},step:0,rng}};
};
G.selectionTurn=sel=>sel.step<ORDER.length?ORDER[sel.step]:null;
G.selectionDone=sel=>sel.step>=ORDER.length;
G.selectionAvailable=sel=>sel.offered.filter(id=>!sel.picks.player.includes(id)&&!sel.picks.enemy.includes(id));
G.selectionPick=(sel,side,id)=>{
  if(G.selectionDone(sel))return fail('A seleção já terminou.');
  if(G.selectionTurn(sel)!==side)return fail('Não é a sua vez de escolher.');
  if(!G.selectionAvailable(sel).includes(id))return fail('Personagem indisponível.'); // escolhido ou fora das opções: nunca de novo
  sel.picks[side].push(id);sel.step++;return{ok:true};
};
G.selectionBotPick=sel=>{const av=G.selectionAvailable(sel);if(G.selectionTurn(sel)!=='enemy'||!av.length)return fail('Não é a vez do bot.');
  return G.selectionPick(sel,'enemy',av[Math.floor(sel.rng()*av.length)]);};
// Equipes iniciais: 2 na frente, retaguarda vazia.
G.selectionTeams=sel=>G.selectionDone(sel)?{player:{front:[...sel.picks.player],rear:[]},enemy:{front:[...sel.picks.enemy],rear:[]}}:null;
})(globalThis.GOGHOS=globalThis.GOGHOS||{});
