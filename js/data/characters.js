// "sam" usa os dados da carta de referência enviada pelo criador. Os demais são PROVISÓRIOS (não oficiais).
// Campos null = ainda sem dado: não são desenhados. Edite somente este arquivo.
// RARIDADES PROVISÓRIAS: char_02…char_08 (Comum) e char_09 (Épico) NÃO são oficiais — foram atribuídas só para o jogo ser jogável (a seleção inicial exige Comuns).
// Troque pelas raridades reais. Opcional por personagem: copies (nº de cópias no monte, padrão 1) e color (usado só se uma Daly tiver color).
(function(G){
G.CLASSES=['ASSASSIN','SUPPORT','FIGHTER','TANK','DESTROYER','MAGO'];
G.RARITIES=['COMMON','RARE','EPIC','LEGENDARY','SECRET']; // ordem da frequência: Comum > Raro > Épico > Lendário > Secreto
G.RARITY_LABEL={COMMON:'Comum',RARE:'Raro',EPIC:'Épico',LEGENDARY:'Lendário',SECRET:'Secreto'};
G.RARITY_HP={COMMON:{min:130,max:220},RARE:{min:200,max:350},EPIC:{min:320,max:530},LEGENDARY:{min:430,max:700},SECRET:{min:550,max:1200}};
G.RARITY_DAMAGE={COMMON:{min:25,max:120},RARE:{min:30,max:150},EPIC:{min:50,max:220},LEGENDARY:{min:90,max:430},SECRET:{min:150,max:670}};
G.CLASS_PROFILE={
  MAGO:{hp:'low',damage:'veryHigh'},
  ASSASSIN:{hp:'normal',damage:'medium'},
  FIGHTER:{hp:'medium',damage:'normal'},
  SUPPORT:{hp:'high',damage:'veryLow'},
  TANK:{hp:'veryHigh',damage:'high'},
  DESTROYER:{hp:'veryLow',damage:'veryHigh'}
};
G.getCharacterStats=c=>{
  const range=G.RARITY_HP[c.rarity]||G.RARITY_HP.COMMON,drange=G.RARITY_DAMAGE[c.rarity]||G.RARITY_DAMAGE.COMMON,profile=G.CLASS_PROFILE[c.class]||G.CLASS_PROFILE.FIGHTER;
  const hpPosition={veryLow:.05,low:.2,normal:.5,medium:.55,high:.75,veryHigh:.95}[profile.hp]??.5;
  const damagePosition={veryLow:.05,medium:.4,normal:.5,high:.75,veryHigh:.95}[profile.damage]??.5;
  return {maxHp:Math.round(range.min+(range.max-range.min)*hpPosition),damage:Math.round(drange.min+(drange.max-drange.min)*damagePosition)};
};
G.MAGE_MAX_MANA=3; // Todo Mago começa com 3 de mana e nunca ultrapassa 3.
G.manaFor=c=>c.class==='MAGO'?G.MAGE_MAX_MANA:0;
G.CONFIG={version:'0.14.0 (protótipo)',
  handLimit:5,
  swapStaminaCost:3,manaDamagePerPoint:10,dodgeDie:6, // PROVISÓRIOS: custo da troca (fôlego), dano por ponto de mana, lados do dado da esquiva (d6)
  selection:{offered:5,min:4},   // seleção inicial: sorteia 5 Comuns distintos (4 escolhas: jogador, bot, jogador, bot → 2 para cada, na frente; retaguarda vazia); basta ter 4 para começar
  dalyMaeLives:3,                // vidas de cada Daly Mãe
  // Pesos de raridade ao resolver uma Daly (configuração inicial, único lugar para editar). Raridade sem personagem elegível sai do sorteio e os pesos são recalculados.
  dalleRarityWeights:{COMMON:60,RARE:25,EPIC:10,LEGENDARY:4,SECRET:1},
  // Recuperação quando a Daly Mãe perde uma vida e ainda tem vida: o participante escolhe UMA opção (sem misturar).
  recoveryOptions:[{id:'A',rarity:'COMMON',count:3},{id:'B',rarity:'RARE',count:2},{id:'C',rarity:'EPIC',count:1}]};
const C=(id,name,cls,maxHp,damage,speed,x={})=>({id,name,class:cls,maxHp,damage,speed,art:'assets/characters/'+id+'.png',
  description:'Provisório.',rarity:null,stamina:10,mainAbility:null,tribute:null,...x});
G.CHARACTERS=[
 C('sam','Sam','FIGHTER',1070,70,3,{rarity:'LEGENDARY',stamina:10,mainAbility:'Pounch',tribute:'Parry',description:'Dados da carta de referência.'}),
 C('char_02','Personagem 02','ASSASSIN',800,90,5,{rarity:'COMMON',tribute:'Esquivar'}),C('char_03','Personagem 03','TANK',1500,40,1,{rarity:'COMMON'}),
 C('char_04','Personagem 04','DESTROYER',900,110,2,{rarity:'COMMON'}),C('char_05','Personagem 05','SUPPORT',850,50,5,{rarity:'COMMON'}),
 C('char_06','Personagem 06','FIGHTER',1000,65,3,{rarity:'COMMON'}),C('char_07','Personagem 07','SUPPORT',900,45,4,{rarity:'COMMON'}),
 C('char_08','Personagem 08','TANK',1400,45,1,{rarity:'COMMON'}),C('char_09','Personagem 09','SUPPORT',800,55,2,{rarity:'EPIC'}),
 C('char_10','Personagem 10','MAGO',700,85,6,{rarity:'RARE',tribute:'Mana'}),C('char_11','Personagem 11','MAGO',650,80,3,{rarity:'LEGENDARY',tribute:'Mana'}),
 C('char_12','Personagem 12','ASSASSIN',750,95,4,{rarity:'LEGENDARY',tribute:'Esquivar'})].map(Object.freeze);
G.getCharacterById=id=>G.CHARACTERS.find(c=>c.id===id)||null;
G.CHARACTERS=G.CHARACTERS.map(c=>Object.freeze({...c,...G.getCharacterStats(c)}));
})(globalThis.GOGHOS=globalThis.GOGHOS||{});
