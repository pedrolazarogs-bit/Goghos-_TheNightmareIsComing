// Apoios oficiais do KitApoio. Cada id tem uma única definição; artes originais preservadas.
(function(G){
G.CONFIG.supportMax=3; // apenas o painel legado; a mão continua limitada a cinco cartas
G.SUPPORT_CARDS=[
 {"id":"na_moloeira","name":"Na Moloeira","effect":"nextAttackBonus","value":20,"target":"none","uses":2,"copies":2,"art":"assets/support/na_moloeira.png","description":"O próximo ataque causa 20 pontos de dano a mais."},
 {"id":"bandeide","name":"Bandeide","effect":"heal","value":80,"target":"ally","uses":2,"copies":2,"art":"assets/support/bandeide.png","description":"Cure até 80 de Vida de um aliado, sem ultrapassar sua Vida máxima."},
 {"id":"brisa","name":"Brisa","effect":"onAllyDefeatedHeal","value":30,"target":"none","uses":2,"copies":2,"art":"assets/support/brisa.png","description":"Sempre que um aliado é eliminado, outro aliado pode curar +30 pontos de saúde."},
 {"id":"zap","name":"Zap","effect":"discardSupport","value":1,"target":"none","uses":2,"copies":2,"art":"assets/support/zap.png","description":"Faz com que seu oponente perca uma carta de Apoio instantaneamente."},
 {"id":"nao_grita","name":"Não Grita","effect":"silence","value":4,"target":"enemy","uses":2,"copies":2,"art":"assets/support/nao_grita.png","description":"Faz com que um oponente perca sua habilidade por quatro ações."},
 {"id":"sortudo","name":"Sortudo","effect":"lucky","value":1,"target":"none","uses":2,"copies":2,"art":"assets/support/sortudo.png","description":"Garante o melhor resultado para sua equipe no próximo dado que ela rolar."},
 {"id":"folego","name":"Fôlego","effect":"endurance","value":1,"target":"ally","uses":2,"copies":2,"art":"assets/support/folego.png","description":"Após ser atacado, seu aliado recebe invencibilidade por uma ação."},
 {"id":"combokill","name":"Combokill","effect":"comboKill","value":1,"target":"ally","uses":2,"copies":2,"art":"assets/support/combokill.png","description":"Sempre que um golpe do aliado eliminar um oponente, ele pode atacar novamente em seguida."},
 {"id":"papakill","name":"Papakill","effect":"executeLow","value":40,"target":"enemy","uses":2,"copies":2,"art":"assets/support/papakill.png","description":"Se o oponente estiver com menos de 40 pontos de saúde, ele é eliminado instantaneamente."},
 {"id":"eu_denovo","name":"Eu Denovo","effect":"extraAction","value":1,"target":"ally","uses":2,"copies":2,"art":"assets/support/eu_denovo.png","description":"Concede uma única ação extra a um aliado, sem reiniciar a hierarquia."},
 {"id":"furto","name":"Furto","effect":"stealSupport","value":1,"target":"none","uses":2,"copies":2,"art":"assets/support/furto.png","description":"Você pode roubar uma carta de Apoio do seu oponente."},
 {"id":"morto_vivo","name":"Morto Vivo","effect":"revive","value":1,"target":"deadAlly","uses":2,"copies":2,"art":"assets/support/morto_vivo.png","description":"Você pode ressuscitar um aliado com 1 ponto de Vida e sem habilidade."},
 {"id":"recruta","name":"Recruta","effect":"recruit","value":1,"target":"none","uses":2,"copies":2,"art":"assets/support/recruta.png","description":"Agora você pode ter mais um aliado em sua equipe."},
 {"id":"escudo_volatil","name":"Escudo Volátil","effect":"shield","value":80,"target":"ally","uses":2,"copies":2,"art":"assets/support/escudo_volatil.png","description":"Um aliado bloqueia 80 pontos de dano uma única vez."},
 {"id":"poder_adicional","name":"Poder Adicional","effect":"recharge","value":1,"target":"ally","uses":2,"copies":2,"art":"assets/support/poder_adicional.png","description":"Faz com que seu aliado possa usar um poder passivo ou secundário mais uma vez."},
 {"id":"uma_maozinha","name":"Uma Mãozinha","effect":"copyHealth","value":1,"target":"none","uses":2,"copies":2,"art":"assets/support/uma_maozinha.png","description":"Seu aliado mais fraco copia a saúde do personagem mais resistente."},
 {"id":"ultima_chance","name":"Última Chance","effect":"lastChance","value":50,"target":"ally","uses":2,"copies":2,"art":"assets/support/ultima_chance.png","description":"O aliado que estiver abaixo de 100 pontos de Vida causará mais 50 de dano por ataque."},
];
})(globalThis.GOGHOS);
