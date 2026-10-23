// Sam, Elétrica, John e Sark têm cartas ilustradas; os demais personagens ainda são provisórios.
// O combate respeita as faixas atuais de atributos e preserva valores conhecidos quando cabem nelas.
// Campos null = ainda sem dado: não são desenhados. Edite somente este arquivo.
// RARIDADES PROVISÓRIAS: char_02…char_08 (Comum) e char_09 (Épico) NÃO são oficiais — foram atribuídas só para o jogo ser jogável (a seleção inicial exige Comuns).
// Troque pelas raridades reais. Opcional por personagem: copies (nº de cópias no monte, padrão 1).
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
G.MAIN_ABILITIES={
 steel_jaw:{name:'Steel Jaw',trigger:'onAttacked',damage:390,instantRarities:['COMMON','RARE','EPIC'],description:'Recebe o dano primeiro e só reage se continuar vivo: elimina o atacante Comum, Raro ou Épico; contra Lendário ou Secreto, causa 390 de dano. Se o ataque zerar sua Vida, Sark é eliminado sem revidar.'},
 electric_area:{name:'3000W',trigger:'areaAttack',description:'Causa 130 de dano a todos os adversários da linha de frente, sem escolher um alvo individual. Aliados e retaguarda ficam protegidos. Mana e bônus somam dano a cada alvo; Parry é resolvido individualmente.'},
 sharp_guitar:{name:'Sharp Guitar',trigger:'pinAttack',damage:20,description:'Escolha atacar normalmente ou causar 80 e cravar o machado. O alvo fica imobilizado e sofre 20 de dano após cada ação, a partir da próxima. Na vez de John, manter encerra sua ação; retirar libera os dois e permite escolher um novo ataque. Enquanto mantém o machado, John fica vulnerável e não ataca nem usa Parry.'}
};
G.getMainAbility=u=>G.MAIN_ABILITIES[u.abilityId]||null;
G.CONFIG={version:'0.19.0 (protótipo)',
  handLimit:5,
  manaDamagePerPoint:10,dodgeDie:6, // PROVISÓRIOS: dano por ponto de mana, lados do dado da esquiva (d6)
  selection:{min:4},   // Todos os Comuns disponíveis; jogador → bot → jogador → bot.
  pacing:{botThink:1800,feedback:2200}, // tempo para ler a ação e conferir o dano antes da próxima jogada
  dalyMaeLives:3,                // vidas de cada Daly Mãe
  // Recuperação quando a Daly Mãe perde uma vida e ainda tem vida: o participante escolhe UMA opção (sem misturar).
  recoveryOptions:[{id:'A',rarity:'COMMON',count:3},{id:'B',rarity:'RARE',count:2},{id:'C',rarity:'EPIC',count:1}]};
const C=(id,name,cls,maxHp,damage,speed,x={})=>({id,name,class:cls,maxHp,damage,speed,art:x.illustrated?'assets/characters/'+id+'.png':null,
  description:'Provisório.',rarity:null,stamina:10,mainAbility:null,tribute:null,...x});
G.CHARACTERS=[
 C('sam','Sam','FIGHTER',1070,70,3,{rarity:'LEGENDARY',stamina:10,mainAbility:'Pounch',tribute:'Parry',illustrated:true,artLayout:{size:[2048,2048],focus:[1000,480,1840,1400],target:[420,330,1230,1100]},description:'Retrato composto com o banner ilustrado recebido; os atributos seguem as faixas atuais.'}),
 C('char_02','Personagem 02','ASSASSIN',800,90,5,{rarity:'COMMON',tribute:'Esquivar'}),C('char_03','Personagem 03','TANK',1500,40,1,{rarity:'COMMON'}),
 C('char_04','Personagem 04','DESTROYER',900,110,2,{rarity:'COMMON'}),C('char_05','Personagem 05','SUPPORT',850,50,5,{rarity:'COMMON'}),
 C('char_06','Personagem 06','FIGHTER',1000,65,3,{rarity:'COMMON'}),C('char_07','Personagem 07','SUPPORT',900,45,4,{rarity:'COMMON'}),
 C('char_08','Personagem 08','TANK',1400,45,1,{rarity:'COMMON'}),C('char_09','Personagem 09','SUPPORT',800,55,2,{rarity:'EPIC'}),
 C('char_10','Personagem 10','MAGO',700,85,6,{rarity:'RARE',tribute:'Mana'}),C('char_11','Personagem 11','MAGO',650,80,3,{rarity:'LEGENDARY',tribute:'Mana'}),
 C('char_12','Personagem 12','ASSASSIN',750,95,4,{rarity:'LEGENDARY',tribute:'Esquivar'}),
 // A arte de Eletric informa 220 de Vida e 130 de Dano; ambos cabem na faixa Rara.
 C('eletric','Elétrica','MAGO',220,130,3,{rarity:'RARE',stamina:4,mainAbility:'3000W',abilityId:'electric_area',knownHp:220,knownDamage:130,illustrated:true,cardBase:{src:'assets/cards/card_base_eletric.png',fields:{hp:{b:[465,1320,885,1530],s:250,a:'l'},damage:{b:[440,1170,640,1310],s:145,a:'l'},speed:{b:[690,95,855,255],s:150,a:'c',c:'#57465e'},stamina:{b:[350,656,490,746],s:70,a:'c'},mana:{b:[352,828,492,968],s:110,a:'c'}}},portraitBanner:{src:'assets/characters/eletric_banner.png',size:[2048,2048],bounds:[21,159,1918,1458]},abilityArt:'assets/abilities/eletric.png',artLayout:{size:[2048,2048],focus:[500,715,1550,1778],target:[440,360,1220,1080]},description:G.MAIN_ABILITIES.electric_area.description}),
 C('john','John','FIGHTER',270,80,2,{rarity:'RARE',stamina:3,mainAbility:'Sharp Guitar',abilityId:'sharp_guitar',parryThreshold:2,tribute:'Parry',knownHp:270,knownDamage:80,illustrated:true,art:'assets/characters/john_banner.png',cardBase:{src:'assets/cards/card_base_john.png',labels:{name:'JOHN'},fields:{hp:{b:[465,1320,885,1530],s:250,a:'l'},damage:{b:[480,1170,645,1310],s:150,a:'l'},speed:{b:[690,95,855,255],s:150,a:'c',c:'#57465e'},stamina:{b:[350,656,490,746],s:70,a:'c'},parry:{b:[350,865,490,960],s:100,a:'c'}}},portraitBanner:{src:'assets/characters/john_banner.png',size:[2048,2048],bounds:[0,127,1945,1484]},abilityArt:'assets/abilities/john.png',artLayout:{size:[2048,2048],focus:[930,350,1840,1240],target:[440,300,1250,1165]},description:G.MAIN_ABILITIES.sharp_guitar.description}),
 // Sark: dados oficiais explicados pelo criador. id legado preservado para referências e partidas.
 C('sarck','Sark','ASSASSIN',530,0,null,{rarity:'LEGENDARY',stamina:5,mainAbility:'Steel Jaw',abilityId:'steel_jaw',passiveOnly:true,knownHp:530,knownDamage:0,illustrated:true,cardBase:{src:'assets/cards/card_base_sark.png',fields:{hp:{b:[470,1310,895,1530],s:265,a:'l'},stamina:{b:[350,656,490,746],s:70,a:'c'}}},portraitBanner:{src:'assets/characters/sark_banner.png',size:[2048,2048],bounds:[21,159,1918,1458]},abilityArt:'assets/abilities/sarck.png',artLayout:{size:[2048,2048],focus:[500,454,1549,1525],target:[440,300,1250,1165]},description:G.MAIN_ABILITIES.steel_jaw.description})].map(Object.freeze);
G.getCharacterById=id=>G.CHARACTERS.find(c=>c.id===id)||null;
G.CHARACTERS=G.CHARACTERS.map(c=>Object.freeze({...c,...G.getCharacterStats(c),
  ...(Number.isFinite(c.knownHp)?{maxHp:c.knownHp}:{}),
  ...(Number.isFinite(c.knownDamage)?{damage:c.knownDamage}:{})}));
})(globalThis.GOGHOS=globalThis.GOGHOS||{});
