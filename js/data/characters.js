// Dez personagens têm cartas ilustradas; Personagem 02…12 são provisórios.
// Atributos seguem as faixas atuais; os valores oficiais já confirmados são preservados.
// Campos null = ainda sem dado: não são desenhados. Edite somente este arquivo.
// RARIDADES PROVISÓRIAS: char_02…char_08 (Comum) e char_09 (Épico) NÃO são oficiais — foram atribuídas só para o jogo ser jogável (a seleção inicial exige Comuns).
// Troque pelas raridades reais. Opcional por personagem: copies (nº de cópias no monte, padrão 1).
(function(G){
// Vida, dano e cura sobem até o próximo múltiplo de 5; zero continua zero.
G.roundUpToFive=value=>Math.max(0,Math.ceil(value/5)*5);
G.CLASSES=['ASSASSIN','SUPPORT','FIGHTER','TANK','DESTROYER','MAGO'];
G.RARITIES=['COMMON','RARE','EPIC','MYTHIC','LEGENDARY','SECRET'];
G.RARITY_LABEL={COMMON:'Comum',RARE:'Raro',EPIC:'Épico',MYTHIC:'Mítico',LEGENDARY:'Lendário',SECRET:'Secreto'};
G.RARITY_HP={COMMON:{min:130,max:220},RARE:{min:200,max:350},EPIC:{min:320,max:530},MYTHIC:{min:430,max:700},LEGENDARY:{min:550,max:1200},SECRET:{min:605,max:1320}};
G.RARITY_DAMAGE={COMMON:{min:25,max:120},RARE:{min:30,max:150},EPIC:{min:50,max:220},MYTHIC:{min:90,max:430},LEGENDARY:{min:150,max:670},SECRET:{min:165,max:740}};
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
  return {maxHp:G.roundUpToFive(range.min+(range.max-range.min)*hpPosition),damage:G.roundUpToFive(drange.min+(drange.max-drange.min)*damagePosition)};
};
G.MAGE_MAX_MANA=3; // Todo Mago começa com 3 de mana e nunca ultrapassa 3.
G.manaFor=c=>c.class==='MAGO'?G.MAGE_MAX_MANA:0;
G.MAIN_ABILITIES={
 steel_jaw:{name:'Steel Jaw',trigger:'onAttacked',damage:390,instantRarities:['COMMON','RARE','EPIC','MYTHIC'],description:'Recebe o dano primeiro e só reage se continuar vivo: elimina o atacante abaixo de Lendário; contra Lendário ou Secreto, causa 390 de dano. Se o ataque zerar sua Vida, Sark é eliminado sem revidar.'},
 electric_area:{name:'3000W',trigger:'areaAttack',description:'Causa 130 de dano a todos os adversários da linha de frente, sem escolher um alvo individual. Aliados e retaguarda ficam protegidos. Mana e bônus somam dano a cada alvo; Parry é resolvido individualmente.'},
 sharp_guitar:{name:'Sharp Guitar',trigger:'pinAttack',damage:20,description:'Escolha atacar normalmente ou causar 80 e cravar o machado. O alvo fica imobilizado e sofre 20 de dano após cada ação, a partir da próxima. Na vez de John, manter encerra sua ação; retirar libera os dois e permite escolher um novo ataque. Enquanto mantém o machado, John fica vulnerável e não ataca nem usa Parry.'},
 ghost_dimension:{name:'Ghost Claw',trigger:'dimension',description:'Na entrada, escolhe um adversário da frente ou retaguarda para um duelo dimensional. Só os dois podem se atacar até um morrer. Se Penxy sobreviver, poderá escolher outro duelo na sua próxima vez.'},
 knight_armor:{name:'Armadura',trigger:'armor',reduction:.8,description:'Habilidade permanente: bloqueia 80% de todo dano numérico recebido. Recebe apenas 20%, arredondados para cima em múltiplos de 5.'},
 fright:{name:'Claws',trigger:'fright',description:'Ao entrar, rola um d6 por adversário: 1 ou 2 assusta. Ganha +20 de ataque por assustado; se assustar todos, também ganha +1 de velocidade. Os bônus duram até sua eliminação.'},
 healing_shot:{name:'Lazer Gun',trigger:'healingAttack',description:'Na sua vez, escolhe atacar um adversário ou curar um aliado com o valor de seu ataque. A cura usa a ação e respeita a Vida máxima.'},
 four_arms:{name:'Fish',trigger:'doubleAttack',description:'Ataca normalmente com dois braços. Uma única vez enquanto estiver vivo, pode ativar os quatro braços e dobrar o dano do ataque.'},
 death_book:{name:'Charm',trigger:'deathBook',damage:200,description:'Ao entrar, marca um adversário no livro. Na sua vez, elimina o marcado abaixo de Mítico; contra Mítico, Lendário ou Secreto, causa 200 de dano. Após eliminar, escolhe um novo nome. Não tem ataque básico.'}
};
G.getMainAbility=u=>G.MAIN_ABILITIES[u.abilityId]||null;
G.CONFIG={version:'0.20.0 (protótipo)',
  handLimit:5,
  manaDamagePerPoint:10,dodgeDie:6, // PROVISÓRIOS: dano por ponto de mana, lados do dado da esquiva (d6)
  selection:{min:4},   // Todos os Comuns disponíveis; jogador → bot → jogador → bot.
  pacing:{botThink:1800,feedback:2200}, // tempo para ler a ação e conferir o dano antes da próxima jogada
  dalyMaeLives:3,                // vidas de cada Daly Mãe
  // Recuperação quando a Daly Mãe perde uma vida e ainda tem vida: o participante escolhe UMA opção (sem misturar).
  recoveryOptions:[{id:'A',rarity:'COMMON',count:3},{id:'B',rarity:'RARE',count:2},{id:'C',rarity:'EPIC',count:1}]};
const C=(id,name,cls,maxHp,damage,speed,x={})=>({id,name,class:cls,maxHp,damage,speed,art:x.illustrated?'assets/characters/'+id+'.png':null,
  description:'Provisório.',rarity:null,stamina:10,mainAbility:null,tribute:null,...x});
const received=(id,name,cls,rarity,speed,stamina,abilityId)=>C(id,name,cls,0,0,speed,{rarity,stamina,abilityId,mainAbility:G.MAIN_ABILITIES[abilityId].name,illustrated:true,art:'assets/references/characters/'+id+'.png',portraitBanner:{src:'assets/cards/card_base_'+id+'.png',size:[1536,2048],bounds:[620,370,1220,1000]},cardBase:{src:'assets/cards/card_base_'+id+'.png',cleanup:{src:'assets/cards/number_cleanup_'+id+'.png',regions:[[690,95,855,255],[350,835,475,950],...(id==='vaglar'?[]:[[445,1170,685,1315]]),[505,1325,915,1585],...(id==='ddx'?[[630,1265,715,1320],[1060,1275,1155,1390]]:[])]},fields:{speed:{b:[690,95,855,255],s:150,a:'c',c:'#57465e'},stamina:{b:[350,835,475,950],s:80,a:'c'},...(id==='vaglar'?{}:{damage:{b:[460,1160,680,1310],s:145,a:'l'}}),hp:{b:[525,1340,890,1535],s:230,a:'l'}}},description:G.MAIN_ABILITIES[abilityId].description});
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
 C('sarck','Sark','ASSASSIN',530,0,null,{rarity:'LEGENDARY',stamina:5,mainAbility:'Steel Jaw',abilityId:'steel_jaw',passiveOnly:true,knownHp:530,knownDamage:0,illustrated:true,cardBase:{src:'assets/cards/card_base_sark.png',fields:{hp:{b:[470,1310,895,1530],s:265,a:'l'},stamina:{b:[350,656,490,746],s:70,a:'c'}}},portraitBanner:{src:'assets/characters/sark_banner.png',size:[2048,2048],bounds:[21,159,1918,1458]},abilityArt:'assets/abilities/sarck.png',artLayout:{size:[2048,2048],focus:[500,454,1549,1525],target:[440,300,1250,1165]},description:G.MAIN_ABILITIES.steel_jaw.description}),
 received('penxy','Penxy','ASSASSIN','LEGENDARY',7,20,'ghost_dimension'),
 received('cavaleiro','Cavaleiro','FIGHTER','COMMON',3,30,'knight_armor'),
 received('zikssy','Zikssy','ASSASSIN','EPIC',7,20,'fright'),
 received('elysh','Elysh','SUPPORT','EPIC',4,30,'healing_shot'),
 received('ddx','DD-X','FIGHTER','RARE',4,10,'four_arms'),
 {...received('vaglar','Vaglar','FIGHTER','MYTHIC',4,30,'death_book'),abilityOnly:true,knownDamage:0}
].map(Object.freeze);
G.getCharacterById=id=>G.CHARACTERS.find(c=>c.id===id)||null;
G.CHARACTERS=G.CHARACTERS.map(c=>Object.freeze({...c,...G.getCharacterStats(c),
  ...(Number.isFinite(c.knownHp)?{maxHp:G.roundUpToFive(c.knownHp)}:{}),
  ...(Number.isFinite(c.knownDamage)?{damage:G.roundUpToFive(c.knownDamage)}:{})}));
})(globalThis.GOGHOS=globalThis.GOGHOS||{});
