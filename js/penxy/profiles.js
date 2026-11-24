// Desktop battle rules transcribed from the character sheets. Art is resolved separately.
(function(root){
'use strict';
const rows=[
 ['Zeneerian',"I'm God",'Assassin','immune','Ignora os efeitos das habilidades de outros personagens.'],
 ['Sheriff · roxo','Na Mira','Destroyer','aim','Só personagens com velocidade igual ou menor podem atacá-lo.','Striker'],
 ['Vaglar · preto','Escrita Mortal','Fighter','book','Marca um rival para executá-lo na próxima vez de Vaglar. Se receber dois ataques consecutivos, o livro elimina Vaglar.','Vaglar'],
 ['Linx','Afiação 5','Fighter','sharpen','Bônus contra Assassin +40, Fighter +120, Suporte +140, Tank +170 e Destroyer +0.'],
 ['Draktar','Caça-clisma','Assassin','hunt','Escolha um rival. O ataque contra ele causa 220 de dano enquanto a marca durar. Na fila, Draktar ganha prioridade sobre o alvo marcado.'],
 ['Elish','Def ou Atk?','Suporte','heal','Pode atacar ou gastar a ação para curar um oponente pelo valor do ataque básico.'],
 ['Daztirry','Adrenalina Oni','Fighter','oni','Aliados recebem +20 ATQ e sobrevivem por mais dois turnos corridos ao sofrer dano fatal.'],
 ['Rawlin','Estátua','Fighter','stone','Com 1–3 no dado, petrifica o rival até sua próxima vez. Um aliado pode gastar sua ação para quebrá-la com 1–3 no d6.'],
 ['Sarck','Jumpscare','Assassin','scare','Se sobreviver ao dano inimigo, elimina o agressor com as mandíbulas de aço. A carta não tem iniciativa numérica.'],
 ['Zédia','Imortal','Suporte','immortal','Enquanto Zédia estiver viva, seus aliados não podem ser eliminados.'],
 ['Fomor','Alma Tomada','Suporte','soul','Cada eliminação de aliado ou rival dá +30 de vida atual e máxima. Limite de cinco almas.'],
 ['Rayyb','Soninho','Suporte','sleep','Faz um rival dormir. Na vez dele, desperta com 1 ou 2 no dado.'],
 ['Dashow Only','Player 2','Fighter','switch','Na própria vez, troca de forma. A forma que saiu recupera 15 PV a cada turno corrido.'],
 ['Z-Zus','Meu Herói','Tank','protect','Escolhe um aliado e recebe o dano dele até ser derrotado.'],
 ['P.ULLYS','Ataque Aéreo','Destroyer','air','O míssil atinge o alvo e causa 50 de dano aos vizinhos da mesma equipe.'],
 ['Eletric','3000 W','Tank','electric','Um único golpe atinge toda a equipe adversária.'],
 ['Sam','Mega Combo','Fighter','combo','Até seis golpes com o dano básico da carta. O primeiro 1 no d6 encerra o combo.'],
 ['Endrik','Devorador','Fighter','shark','Ao cair, o tubarão elimina quem derrotou Endrik se o dado mostrar 1 ou 2.'],
 ['Jonh','Rebelde','Fighter','guitar','Crava a guitarra no alvo. Ela causa 40 de dano por turno corrido e impede novos ataques até ser recuperada.'],
 ['Barn','Hipnose','Suporte','hypnosis','Barn e seu alvo ficam impedidos de agir. Barn pode trocar o alvo ou desfazer a hipnose na própria vez.'],
 ['Nully','Corte Preciso','Assassin','katana','Resultados de 1 a 5 causam de 45 a 220 de dano. Com 6, o corte executa o alvo.'],
 ['Chama','Esquentadinho','Destroyer','fire','Ao atacar, incendeia o rival por 6 pulsos de 50. Ao sofrer um ataque, queima o agressor por 3 pulsos de 35.'],
 ['Vaglar · azul','Voadora','Fighter','kick','O segundo ataque causa +40 de dano. Com 1 ou 2 no dado, atordoa por dois turnos corridos.','Stally'],
 ['Petra','Desgaste','Destroyer','wear','Com 180 PV ou mais, tem 7 VEL e 300 ATQ. De 100 a 179, tem 4 VEL e 190 ATQ. Abaixo de 100, tem 2 VEL e 70 ATQ.'],
 ['DD-X','Cardume','Fighter','fish','Ataca com os peixes, usando o dano e o multiplicador da carta original.']
];
const absent={
 'Zédia':{maxHp:650,baseAtk:null,hits:1,speed:5,attackName:'—'},
 'Dashow Only':{maxHp:420,baseAtk:140,hits:1,speed:2,attackName:'Scary Swords'},
 'Petra':{maxHp:220,baseAtk:300,hits:1,speed:7,breath:2,attackName:'Lazer Descharge'}
};
const revised={
 'Petra':{image:'assets/arena/petra.webp'},
 'Chama':{image:'assets/arena/chama.webp',maxHp:190,baseAtk:50,breath:1},
 'Sarck':{image:'assets/arena/sarck.webp',maxHp:260,breath:0,attackName:'Steel Jaw'}
};
function deck(characters){
 const names=['Unicorn','Sam','Sarck','Nully','Mike','Penxy',...rows.map(row=>row[0])];
 return [...new Set(names)].map(source=>{
  const index=characters.findIndex(c=>c.name===source),base=characters[index]||absent[source];
  const [,title,role,skill,description,alias]=rows.find(row=>row[0]===source)||[];
  return {...base,...revised[source],index,name:alias||source,title,role:role||({Unicorn:'Suporte',Mike:'Destroyer',Penxy:'Assassin'})[source],skill,description};
 });
}
if(typeof module!=='undefined'&&module.exports)module.exports=deck;else root.GoghosProfileDeck=deck;
})(globalThis);
