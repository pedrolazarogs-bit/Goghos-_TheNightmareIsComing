// Seleção: um Comum por equipe e um Raro sorteado automaticamente. O catálogo de testes antigos usa a configuração anterior.
(function(G){
const fail=error=>({ok:false,error});
const order=sel=>sel.order||['player','enemy','player','enemy'];
G.createSelection=(opts={})=>{
 const rng=opts.rng||Math.random,cfg=G.CONFIG.selection,pool=G.CHARACTERS.filter(c=>c.rarity==='COMMON'),rares=G.CHARACTERS.filter(c=>c.rarity==='RARE');
 if(pool.length<cfg.min)return fail('Não há personagens Comuns suficientes para iniciar a batalha (mínimo '+cfg.min+', cadastrados '+pool.length+').');
 if(cfg.rareAuto&&rares.length<2)return fail('São necessários dois Raros oficiais para o sorteio inicial.');
 return{ok:true,sel:{offered:pool.map(c=>c.id),picks:{player:[],enemy:[]},step:0,rng,order:cfg.rareAuto?['player','enemy']:['player','enemy','player','enemy'],rareAuto:!!cfg.rareAuto,autoRares:{}}};
};
G.selectionTurn=sel=>order(sel)[sel.step]||null;
G.selectionDone=sel=>sel.step>=order(sel).length;
G.selectionAvailable=sel=>sel.offered.filter(id=>!sel.picks.player.includes(id)&&!sel.picks.enemy.includes(id));
G.selectionPick=(sel,side,id)=>{
 if(G.selectionDone(sel))return fail('A seleção já terminou.');if(G.selectionTurn(sel)!==side)return fail('Não é a sua vez de escolher.');if(!G.selectionAvailable(sel).includes(id))return fail('Personagem indisponível.');
 sel.picks[side].push(id);sel.step++;
 if(G.selectionDone(sel)&&sel.rareAuto){const pool=G.CHARACTERS.filter(c=>c.rarity==='RARE').map(c=>c.id);for(const team of ['player','enemy']){const id=pool.splice(Math.floor(sel.rng()*pool.length),1)[0];sel.picks[team].push(id);sel.autoRares[team]=id;}}
 return{ok:true};
};
G.selectionBotPick=sel=>{const av=G.selectionAvailable(sel);return G.selectionTurn(sel)==='enemy'&&av.length?G.selectionPick(sel,'enemy',av[Math.floor(sel.rng()*av.length)]):fail('Não é a vez do bot.');};
G.selectionTeams=sel=>G.selectionDone(sel)?{player:{front:[...sel.picks.player],rear:[]},enemy:{front:[...sel.picks.enemy],rear:[]}}:null;
})(globalThis.GOGHOS=globalThis.GOGHOS||{});
