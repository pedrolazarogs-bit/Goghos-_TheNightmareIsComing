// Cartas de Apoio. Nome/texto/valor vêm da arte enviada pelo criador. "uses" (quantidade por batalha) é PROVISÓRIO.
(function(G){
G.CONFIG.supportMax=3; // máximo de cartas de apoio por batalha, por enquanto
G.SUPPORT_CARDS=[
 {id:'na_moloeira',name:'Na Moloeira',effect:'nextAttackBonus',value:20,uses:2,art:'assets/support/na_moloeira.png',description:'O próximo ataque causa 20 pontos de dano a mais.'},
 {id:'bandeide',name:'Bandeide',effect:'heal',value:80,uses:2,art:'assets/support/bandeide.png',description:'Cure um aliado em um piscar de olhos.'},
 {id:'brisa',name:'Brisa',effect:'onAllyDefeatedHeal',value:30,uses:2,art:'assets/support/brisa.png',description:'Sempre que um aliado é eliminado, outro aliado pode curar +30 pontos de saúde.'}];
})(globalThis.GOGHOS);
