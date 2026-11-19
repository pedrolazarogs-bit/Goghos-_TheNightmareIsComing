// Original support cards and HUD icons. Unclear effects remain pending.
(function(root){
'use strict';
const cards=[
  {
    "id": "bandeide",
    "name": "Bandeide",
    "description": "Cure um aliado em um piscar de olhos. +70.",
    "effect": "heal",
    "pending": "",
    "icon": "assets/supports-v051/bandeide-icon.png",
    "card": "assets/supports-v051/bandeide-card.png"
  },
  {
    "id": "na-moleira",
    "name": "Na Moleira",
    "description": "O próximo ataque causa 50 pontos de dano a mais.",
    "effect": "boost",
    "pending": "",
    "icon": "assets/supports-v051/na-moleira-icon.png",
    "card": "assets/supports-v051/na-moleira-card.png"
  },
  {
    "id": "escudo-volatil",
    "name": "Escudo Volátil",
    "description": "O próximo ataque bloqueia 80 pontos de dano.",
    "effect": "guard",
    "pending": "",
    "icon": "assets/supports-v051/escudo-volatil-icon.png",
    "card": "assets/supports-v051/escudo-volatil-card.png"
  },
  {
    "id": "papakill",
    "name": "Papakill",
    "description": "Se o oponente estiver com menos de 40 pontos de saúde, o mesmo é eliminado instantaneamente.",
    "effect": "execute",
    "pending": "",
    "icon": "assets/supports-v051/papakill-icon.png",
    "card": "assets/supports-v051/papakill-card.png"
  },
  {
    "id": "brisa",
    "name": "Brisa",
    "description": "Sempre que um aliado é eliminado, outro aliado pode curar +30 pontos de saúde.",
    "effect": null,
    "pending": "Falta definir a duração do apoio, quem escolhe o aliado curado e se cada eliminação oferece uma nova cura.",
    "icon": "assets/supports-v051/brisa-icon.png",
    "card": "assets/supports-v051/brisa-card.png"
  },
  {
    "id": "sortudo",
    "name": "Sortudo",
    "description": "Nas próximas 2 jogadas você tem prioridade em qualquer rolamento de dado dentro do jogo.",
    "effect": null,
    "pending": "A batalha ainda não tem rolagem de dados. Falta definir como a prioridade altera uma rolagem e o que conta como jogada.",
    "icon": "assets/supports-v051/sortudo-icon.png",
    "card": "assets/supports-v051/sortudo-card.png"
  },
  {
    "id": "uma-maozinha",
    "name": "Uma mãozinha",
    "description": "Seu aliado mais fraco copia a saúde do personagem mais resistente da sua equipe.",
    "effect": null,
    "pending": "Falta confirmar se compara e copia a vida atual ou máxima, como resolver empates e se pode ultrapassar a vida máxima da carta.",
    "icon": "assets/supports-v051/uma-maozinha-icon.png",
    "card": "assets/supports-v051/uma-maozinha-card.png"
  },
  {
    "id": "ultima-chance",
    "name": "Última chance",
    "description": "O aliado que estiver abaixo de 100 pontos de vida causará +50 de dano por ataque.",
    "effect": null,
    "pending": "Falta definir o aliado afetado, a duração e se o bônus termina quando ele volta a 100 pontos de vida.",
    "icon": "assets/supports-v051/ultima-chance-icon.png",
    "card": "assets/supports-v051/ultima-chance-card.png"
  },
  {
    "id": "recruta",
    "name": "Recruta",
    "description": "Agora você pode ter +1 aliado em sua equipe.",
    "effect": null,
    "pending": "A arena atual é 4 contra 4. Falta definir o quinto espaço, o personagem recrutado e sua posição na ordem de turnos.",
    "icon": "assets/supports-v051/recruta-icon.png",
    "card": "assets/supports-v051/recruta-card.png"
  },
  {
    "id": "mascara",
    "name": "Máscara",
    "description": "Carta completa ainda não recebida.",
    "effect": null,
    "pending": "Faltam a carta completa, o nome oficial e as regras deste ícone.",
    "icon": "assets/supports-v051/mascara-icon.png",
    "card": null
  }
];
cards.forEach(Object.freeze);Object.freeze(cards);
if(typeof module!=='undefined'&&module.exports)module.exports=cards;else root.GoghosSupports=cards;
})(globalThis);
