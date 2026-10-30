// Catálogo oficial: 31 personagens. Petra fica reservada para uma atualização futura.
// Atributos seguem as faixas atuais; os valores oficiais já confirmados são preservados.
// Campos null = ainda sem dado: não são desenhados. Edite somente este arquivo.
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
 electric_area:{name:'3000W',trigger:'areaAttack',description:'Causa o dano básico a todos os adversários da linha de frente, sem escolher um alvo individual. Aliados e retaguarda ficam protegidos. Mana e bônus somam dano a cada alvo; Parry é resolvido individualmente.'},
 sharp_guitar:{name:'Sharp Guitar',trigger:'pinAttack',damage:20,description:'Escolha atacar normalmente ou causar 80 e cravar o machado. O alvo fica imobilizado e sofre 20 de dano após cada ação, a partir da próxima. Na vez de John, manter encerra sua ação; retirar libera os dois e permite escolher um novo ataque. Enquanto mantém o machado, John fica vulnerável e não ataca nem usa Parry.'},
 ghost_dimension:{name:'Ghost Claw',trigger:'dimension',description:'Na entrada, escolhe um adversário da frente ou retaguarda para um duelo dimensional. Só os dois podem se atacar até um morrer. Striker não pode ser escolhido enquanto sua proteção estiver ativa e Penxy for mais rápido. Sem alvo permitido, aguarda a próxima oportunidade sem travar a pré-batalha. Se Penxy sobreviver, poderá escolher outro duelo na sua próxima vez.'},
 knight_armor:{name:'Armadura',trigger:'armor',reduction:.8,description:'Habilidade permanente: bloqueia 80% de todo dano numérico recebido. Recebe apenas 20%, arredondados para cima em múltiplos de 5.'},
 fright:{name:'Claws',trigger:'fright',description:'Ao entrar, rola um d6 por adversário: 1 ou 2 assusta. Ganha +20 de ataque por assustado; se assustar todos, também ganha +1 de velocidade. Os bônus duram até sua eliminação.'},
 healing_shot:{name:'Lazer Gun',trigger:'healingAttack',description:'Na sua vez, escolhe atacar um adversário ou curar um aliado com o valor de seu ataque. Elysh também pode curar da retaguarda, sem atacar de lá. A cura usa a ação e respeita a Vida máxima.'},
 four_arms:{name:'Fish',trigger:'doubleAttack',description:'Ataca normalmente com dois braços. Uma única vez enquanto estiver vivo, pode ativar os quatro braços e dobrar a quantidade de golpes. Cada golpe tem sua própria defesa e reação.'},
 death_book:{name:'Charm',trigger:'deathBook',damage:200,description:'Ao entrar, marca um adversário no livro. Na sua vez, elimina o marcado de raridade inferior à sua; nas demais, causa 200 de dano. Após eliminar, escolhe um novo nome. Não tem ataque básico.'}
};
Object.assign(G.MAIN_ABILITIES,{
 "missile":{"name":"Míssil","description":"Escolhe um adversário: dano inteiro no alvo e 20% do dano recebido em cada vizinho da mesma linha.","trigger":"missile"},
 "paralyzingKick":{"name":"Paralisia","description":"Escolhe ataque normal ou +30% de dano com d6: 1–3 acerta e paralisa por duas ações de qualquer personagem.","trigger":"paralyzingKick"},
 "deathShark":{"name":"Tubarão","description":"Ao morrer, tenta eliminar quem o matou: d6 1–2, somente se o atacante tiver raridade inferior.","trigger":"deathShark"},
 "speedWard":{"name":"Proteção de velocidade","description":"Adversários mais rápidos que Striker não podem atacá-lo. Essa proteção também impede que Penxy mais rápido o leve para o duelo dimensional.","trigger":"speedWard"},
 "duelist":{"name":"Duelo","description":"Ao atacar ou ser atacado, duela no d6: 1–3 acerta. O perdedor recebe a resposta: eliminação até a raridade do Xerife, 200 contra raridade superior. Ao errar seu ataque, Xerife recebe o dano do alvo.","trigger":"duelist"},
 "hypnosis":{"name":"Hipnose","description":"Na entrada, hipnotiza um adversário: os dois não atacam, o alvo fica sem reações. Na vez de Burn, mantém ou troca o alvo e causa 90. Sua morte libera o hipnotizado.","trigger":"hypnosis"},
 "souls":{"name":"Almas","description":"Cada aliado ou adversário eliminado dá uma alma: +20 somente à Vida máxima, sem limite.","trigger":"souls"},
 "punchCombo":{"name":"Combo de socos","description":"Até seis socos individuais com o dano básico no mesmo alvo, em uma ação. Rola um d6 por tentativa: o primeiro número repetido encerra o combo. Cada soco tem sua própria defesa e reação.","trigger":"punchCombo"},
 "flames":{"name":"Fogo persistente","description":"Ataca pelo dano básico e aplica 40 de queimadura por cinco ações globais. Quem o ataca recebe 35 nas três ações seguintes, mesmo que o golpe mate Chama.","trigger":"flames"},
 "fullHeal":{"name":"Cura total","description":"Uma única vez na própria vez, gasta sua ação para curar todos os outros aliados em campo até 100% da Vida máxima, inclusive quando Zuri está na retaguarda. Não cura a si mesma.","trigger":"fullHeal"},
 "hunt":{"name":"Caça","description":"Recebe uma caça sorteada na entrada. Sempre que ataca essa caça, causa dano básico +200% (triplo). Pode atacar outros alvos normalmente.","trigger":"hunt"},
 "oni":{"name":"Estado Oni","duration":4,"description":"Ao zerar a Vida, fica imortal por quatro ações de qualquer personagem, com +30 de dano. Depois é eliminado.","trigger":"oni"},
 "assassinWard":{"name":"Proteção contra Assassinos","description":"Nenhum adversário da classe Assassino pode atacar Mike.","trigger":"assassinWard"},
 "starGift":{"name":"Estrela","speedBonus":1,"description":"Na entrada, fortalece um aliado ou a si mesma: +150 de Vida máxima e atual, +50 de dano e +1 de velocidade. Uso único em um personagem; dura enquanto o beneficiado viver.","trigger":"starGift"},
 "diceExecution":{"name":"Decapitação","description":"Rola d6 ao atacar. 1–5 multiplica o dano básico atual. 6 elimina raridade igual ou inferior; contra superior, causa seis vezes o básico.","trigger":"diceExecution"},
 "sleepPowder":{"name":"Pó mágico","description":"Uma única vez na própria vez, sem gastar ação, faz um adversário dormir. Na vez do alvo, d6 1–2 acorda e permite agir; 3–6 perde a ação e tenta na próxima vez.","trigger":"sleepPowder"},
 "petrify":{"name":"Petrificação","description":"Na entrada e na própria vez, tenta petrificar raridade igual ou inferior: d6 1–3. Cada erro reduz para 1–2, depois 1, depois esgota. Aliado liberta o petrificado com um ataque de 30. Após petrificar na própria vez, Rayvilin só pode executar o alvo a partir da sua próxima vez. Se petrificar na entrada, poderá executar na primeira vez dela. Antes disso, ainda pode atacar normalmente.","trigger":"petrify"},
 "guardian":{"name":"Sacrifício","description":"Na entrada, escolhe um aliado fixo. Recebe o dano direcionado e as eliminações instantâneas em seu lugar até morrer. Dano em área atinge o protegido normalmente.","trigger":"guardian"},
 "swarm":{"name":"Swarm","description":"Escolhe concentrar o dano básico em um adversário ou dividi-lo igualmente entre os adversários da frente, com cada parcela arredondada para cima em múltiplos de 5.","trigger":"swarm"},
 "friendship":{"name":"Melhor amigo","description":"Na entrada escolhe um amigo. Revida com seu dano contra quem o atacar, mesmo se o amigo esquivar, defender ou morrer. O revide permite defesa e esquiva.","trigger":"friendship"},
 "fadingDodge":{"name":"Esquiva veloz","description":"Começa exigindo 1 no d6 para acertá-lo. Cada acerto sofrido amplia a faixa em 1 e reduz sua Velocidade em 1. Até 1–6. Magos ignoram esse teste.","trigger":"fadingDodge"}
});
G.getMainAbility=u=>G.MAIN_ABILITIES[u.abilityId]||null;
G.CONFIG={version:'0.34.0',
  handLimit:5,
  aiSupport:true,
  classTributes:true,
  allowSummon:true,
  manaDamagePerPoint:10,dodgeDie:6,dodgeMaxFaces:5, // PROVISÓRIOS: dano por ponto de mana, lados do dado da esquiva (d6)
  selection:{min:4,rareAuto:false}, // Duas escolhas de Comum por equipe, alternadas e sem Raros automáticos.
  pacing:{botThink:1800,feedback:2200}, // tempo para ler a ação e conferir o dano antes da próxima jogada
  dalyMaeLives:3,                // vidas de cada Daly Mãe
  // Recuperação quando a Daly Mãe perde uma vida e ainda tem vida: o participante escolhe UMA opção (sem misturar).
  recoveryOptions:[{id:'A',rarity:'EPIC',count:2},{id:'B',rarity:'RARE',count:3}]};
const C=(id,name,cls,maxHp,damage,speed,x={})=>({id,name,class:cls,maxHp,damage,speed,art:x.illustrated?'assets/characters/'+id+'.png':null,
  description:'Provisório.',rarity:null,stamina:10,mainAbility:null,tribute:null,...x});
const received=(id,name,cls,rarity,speed,stamina,abilityId)=>C(id,name,cls,0,0,speed,{rarity,stamina,abilityId,mainAbility:G.MAIN_ABILITIES[abilityId].name,illustrated:true,art:'assets/references/characters/'+id+'.png',portraitBanner:{src:'assets/cards/card_base_'+id+'.png',size:[1536,2048],bounds:[620,370,1220,1000]},cardBase:{src:'assets/cards/card_base_'+id+'.png',cleanup:{src:'assets/cards/number_cleanup_'+id+'.png',regions:[[690,95,855,255],[350,835,475,950],...(id==='vaglar'?[]:[[445,1170,685,1315]]),[505,1325,915,1585],...(id==='ddx'?[[630,1265,715,1320],[1060,1275,1155,1390]]:[])]},fields:{speed:{b:[690,95,855,255],s:150,a:'c',c:'#57465e'},stamina:{b:[350,835,475,950],s:80,a:'c'},...(id==='vaglar'?{}:{damage:{b:[460,1160,680,1310],s:145,a:'l'}}),hp:{b:[525,1340,890,1535],s:230,a:'l'}}},description:G.MAIN_ABILITIES[abilityId].description});
// Novas cartas completas: o PNG recebido fica intacto; somente campos variáveis e o nome corrigido usam camadas.
const upgraded=(id,name,cls,rarity,speed,stamina,abilityId,assetKey=id,extra={})=>({...received(id,name,cls,rarity,speed,stamina,abilityId),manualBalance:true,
 art:'assets/rebalance/kit-master-upgrade/'+assetKey+'.png',
 portraitBanner:{src:'assets/rebalance/kit-master-upgrade/'+assetKey+'.png',size:[1536,2048],bounds:[620,370,1220,1000]},
 cardBase:{src:'assets/rebalance/kit-master-upgrade/'+assetKey+'.png',cleanup:{src:'assets/cards/card_base.png',regions:[[690,95,855,255],[440,1170,690,1325],[450,1330,840,1550],...(extra.rename?[[280,1030,800,1155]]:[])]},
 fields:{speed:{b:[690,95,855,255],s:150,a:'c',c:'#57465e'},damage:{b:[440,1170,680,1325],s:150,a:'l'},hp:{b:[460,1330,840,1550],s:225,a:'l'}},...(extra.rename?{labels:{name:name.toUpperCase()}}:{})},...extra});
G.CHARACTERS=[
 // A arte de Eletric informa 220 de Vida e 130 de Dano; ambos cabem na faixa Rara.
 C('eletric','Elétrica','MAGO',220,130,3,{rarity:'RARE',stamina:4,mainAbility:'3000W',abilityId:'electric_area',knownHp:220,knownDamage:130,illustrated:true,cardBase:{src:'assets/cards/card_base_eletric.png',fields:{hp:{b:[465,1320,885,1530],s:250,a:'l'},damage:{b:[440,1170,640,1310],s:145,a:'l'},speed:{b:[690,95,855,255],s:150,a:'c',c:'#57465e'},stamina:{b:[350,656,490,746],s:70,a:'c'},mana:{b:[352,828,492,968],s:110,a:'c'}}},portraitBanner:{src:'assets/characters/eletric_banner.png',size:[2048,2048],bounds:[21,159,1918,1458]},abilityArt:'assets/abilities/eletric.png',artLayout:{size:[2048,2048],focus:[500,715,1550,1778],target:[440,360,1220,1080]},description:G.MAIN_ABILITIES.electric_area.description}),
 C('john','John','FIGHTER',270,80,2,{rarity:'RARE',stamina:3,mainAbility:'Sharp Guitar',abilityId:'sharp_guitar',parryThreshold:2,tribute:'Parry',knownHp:270,knownDamage:80,illustrated:true,art:'assets/characters/john_banner.png',cardBase:{src:'assets/cards/card_base_john.png',labels:{name:'JOHN'},fields:{hp:{b:[465,1320,885,1530],s:250,a:'l'},damage:{b:[480,1170,645,1310],s:150,a:'l'},speed:{b:[690,95,855,255],s:150,a:'c',c:'#57465e'},stamina:{b:[350,656,490,746],s:70,a:'c'},parry:{b:[350,865,490,960],s:100,a:'c'}}},portraitBanner:{src:'assets/characters/john_banner.png',size:[2048,2048],bounds:[0,127,1945,1484]},abilityArt:'assets/abilities/john.png',artLayout:{size:[2048,2048],focus:[930,350,1840,1240],target:[440,300,1250,1165]},description:G.MAIN_ABILITIES.sharp_guitar.description}),
 // Sark: dados oficiais explicados pelo criador. id legado preservado para referências e partidas.
 C('sarck','Sark','ASSASSIN',530,0,null,{rarity:'LEGENDARY',stamina:5,mainAbility:'Steel Jaw',abilityId:'steel_jaw',passiveOnly:true,knownHp:530,knownDamage:0,illustrated:true,cardBase:{src:'assets/cards/card_base_sark.png',fields:{hp:{b:[470,1310,895,1530],s:265,a:'l'},stamina:{b:[350,656,490,746],s:70,a:'c'}}},portraitBanner:{src:'assets/characters/sark_banner.png',size:[2048,2048],bounds:[21,159,1918,1458]},abilityArt:'assets/abilities/sarck.png',artLayout:{size:[2048,2048],focus:[500,454,1549,1525],target:[440,300,1250,1165]},description:G.MAIN_ABILITIES.steel_jaw.description}),
 received('penxy','Penxy','ASSASSIN','LEGENDARY',7,20,'ghost_dimension'),
 upgraded('cavaleiro','Cavaleiro','TANK','LEGENDARY',2,8,'knight_armor','cavaleiro',{tankResistance:0}),
 received('zikssy','Zikssy','ASSASSIN','EPIC',7,20,'fright'),
 upgraded('elysh','Elysh','SUPPORT','COMMON',4,3,'healing_shot','elysh',{rearHealing:true}),
 received('ddx','DD-X','FIGHTER','RARE',4,10,'four_arms'),

 {...received("p_ullys","P. Ullys","DESTROYER","LEGENDARY",4,20,"missile"),official:true},
 upgraded('stally','Stally','FIGHTER','COMMON',2,4,'paralyzingKick','vaglar_epic',{parryThreshold:5,rename:true}),
 {...received("endrik","Endrik","DESTROYER","LEGENDARY",4,20,"deathShark"),official:true},
 {...received("striker","Striker","DESTROYER","MYTHIC",4,10,"speedWard"),official:true},
 {...received("sheriff","Xerife","ASSASSIN","MYTHIC",6,30,"duelist"),official:true,knownDamage:0},
 {...received("barn","Burn","FIGHTER","LEGENDARY",4,20,"hypnosis"),official:true},
 {...received("fonior","Fonior","SUPPORT","EPIC",3,25,"souls"),official:true},
 {...received("sam","Sam","FIGHTER","LEGENDARY",3,5,"punchCombo"),official:true,knownDamage:100},
 {...received("chama","Chama","DESTROYER","MYTHIC",4,10,"flames"),official:true,knownDamage:65},
 {...received("zuri","Zuri","SUPPORT","SECRET",3,30,"fullHeal"),official:true},
 {...received("draktar","Draktar","ASSASSIN","SECRET",6,20,"hunt"),official:true},
 {...received("daztirry","Daztirry","FIGHTER","SECRET",4,35,"oni"),official:true},
 upgraded('mike','Mike','DESTROYER','COMMON',5,6,'assassinWard'),
 {...received("unicorn","Unicorn","SUPPORT","RARE",3,20,"starGift"),official:true},
 {...received("nully","Nully","ASSASSIN","MYTHIC",7,30,"diceExecution"),official:true,knownDamage:55},
 {...received("rayyb","Rayyb","SUPPORT","LEGENDARY",4,20,"sleepPowder"),official:true},
 {...received("rayvilin","Rayvilin","SUPPORT","LEGENDARY",5,20,"petrify"),official:true},
 {...received("z_zus","Z-Zus","TANK","LEGENDARY",1,10,"guardian"),official:true},
 upgraded('alex','Alex','FIGHTER','COMMON',3,2,'swarm','alex',{parryThreshold:1}),
 {...received("karma","Karma","ASSASSIN","LEGENDARY",6,10,"friendship"),official:true},
 {...received("trucc","Trucc","ASSASSIN","EPIC",8,20,"fadingDodge"),official:true},
 {...received('vaglar','Vaglar','FIGHTER','MYTHIC',4,30,'death_book'),abilityOnly:true,knownDamage:0}
].map(c=>{
 if(!c.official)return Object.freeze({...c,official:true,copies:c.copies||1});
 const cleanup=c.cardBase.cleanup;cleanup.src='assets/cards/number_cleanup_cavaleiro.png';
 cleanup.regions=cleanup.regions.filter(b=>b[1]!==835).map(b=>b[1]===1325?[450,1325,920,1585]:b[1]===1170?[440,1170,685,1350]:b);delete c.cardBase.fields.stamina;
 // Os números da Vida e ataque são atualizados sobre a base recebida. Os demais símbolos ficam intactos.
 if(c.id==='sheriff'){delete c.cardBase.fields.damage;cleanup.regions=cleanup.regions.filter(b=>b[1]!==1170);}
 if(['draktar','alex'].includes(c.id))cleanup.regions.push([630,1265,745,1350]);
 c.cardBase.outline=true;return Object.freeze(c);
});
G.getCharacterById=id=>G.CHARACTERS.find(c=>c.id===id)||null;
// Ajustes por habilidade sobre as faixas e perfis. Valores iniciais; bônus em batalha continuam livres.
G.CHARACTER_BALANCE={
 "eletric":{"maxHp":220,"damage":130,"reason":"Área e mana já compensadas pela Vida baixa; manter os valores de referência."},
 "john":{"maxHp":250,"damage":80,"reason":"Parry e imobilização justificam reduzir a resistência; preservar 80 inicial e 20 periódico."},
 "sarck":{"maxHp":530,"damage":0,"reason":"Manter a exceção oficial: reativo, sem velocidade; precisa sobreviver para revidar."},
 "penxy":{"maxHp":875,"damage":360,"reason":"O duelo isola os dois lados e não multiplica dano; manter o perfil de Assassino."},
 "cavaleiro":{"maxHp":920,"damage":130,"reason":"KitMasterUpgrade: Tank Lendário com Armadura de 80%, sem o tributo natural; valores manuais reconfirmados."},
 "zikssy":{"maxHp":390,"damage":110,"reason":"Reservar parte do poder básico para os bônus permanentes de susto."},
 "elysh":{"maxHp":240,"damage":80,"reason":"KitMasterUpgrade e habilidade reconfirmada: Comum, ataque ou cura de 80, inclusive cura da retaguarda."},
 "ddx":{"maxHp":285,"damage":90,"reason":"O dano dobrado é único; o perfil atual de Fighter já o comporta."},
 "p_ullys":{"maxHp":585,"damage":450,"reason":"Reservar dano para a explosão: até 630 no conjunto, antes de defesas."},
 "stally":{"maxHp":230,"damage":90,"reason":"KitMasterUpgrade: corrigida de Vaglar para Stally Comum; golpe paralisante e Parry 1–5 reconfirmados."},
 "endrik":{"maxHp":585,"damage":560,"reason":"Dano alto de Destroyer, com desconto pela tentativa de execução após morrer."},
 "striker":{"maxHp":445,"damage":350,"reason":"A proteção contra rápidos pede menos dano que outro Destroyer da mesma faixa."},
 "sheriff":{"maxHp":450,"damage":0,"reason":"Execução ofensiva e defensiva exigem fragilidade; manter duelo e dano fixo de 200."},
 "barn":{"maxHp":780,"damage":90,"reason":"Controle contínuo é seu poder; a carta deve mostrar os 90 realmente usados na hipnose."},
 "fonior":{"maxHp":480,"damage":60,"reason":"As almas só aumentam o máximo, sem cura imediata; manter o perfil de Suporte."},
 "sam":{"maxHp":1050,"damage":100,"reason":"Combo médio de 2,77 socos: cerca de 277 antes de defesas, máximo 600; aumentar a Vida."},
 "chama":{"maxHp":445,"damage":65,"reason":"65 inicial mais cinco queimaduras já somam 390; preservar o dano periódico e o revide."},
 "zuri":{"maxHp":1000,"damage":165,"reason":"A cura coletiva total é forte mesmo sendo única; reduzir resistência e ataque."},
 "draktar":{"maxHp":850,"damage":265,"reason":"Contra a caça, o básico triplica para 795; reduzir os dois atributos."},
 "daztirry":{"maxHp":930,"damage":420,"reason":"Oni acrescenta uma janela imortal e +30; descontar parte dos atributos iniciais."},
 "mike":{"maxHp":130,"damage":170,"reason":"KitMasterUpgrade: valores manuais, proteção contra Assassinos reconfirmada e crítico de Destroyer mantido."},
 "unicorn":{"maxHp":270,"damage":35,"reason":"A estrela já concede +150 de Vida, +50 de dano e +2 de velocidade; reduzir a base."},
 "nully":{"maxHp":480,"damage":55,"reason":"Multiplicação, execução e velocidade alta justificam menos Vida; preservar os 55 por dado."},
 "rayyb":{"maxHp":875,"damage":150,"reason":"Sono gratuito e potencialmente longo exige desconto na Vida e no dano básicos."},
 "rayvilin":{"maxHp":700,"damage":150,"reason":"Petrificar e executar na mesma vez é forte; reduzir resistência e dano, sem mudar o d6."},
 "z_zus":{"maxHp":1040,"damage":150,"reason":"Preservar 1040/150 até o balanceamento manual; Tank confirmado pelo raio da base."},
 "alex":{"maxHp":200,"damage":170,"reason":"KitMasterUpgrade: valores manuais e Swarm de 170 reconfirmados, com Parry 1."},
 "karma":{"maxHp":650,"damage":230,"reason":"O ataque se repete como reação aos golpes no amigo; reduzir resistência e básico."},
 "trucc":{"maxHp":340,"damage":90,"reason":"Esquiva inicial de cinco faces e velocidade 8 exigem Vida e dano básicos menores."},
 "vaglar":{"maxHp":520,"damage":0,"reason":"O livro ignora esquiva e Parry, executa abaixo de Mítico e aplica 200 acima; reduzir Vida."}
};
G.CHARACTERS=G.CHARACTERS.map(c=>Object.freeze({...c,...G.getCharacterStats(c),
  ...(Number.isFinite(c.knownHp)?{maxHp:G.roundUpToFive(c.knownHp)}:{}),
  ...(Number.isFinite(c.knownDamage)?{damage:G.roundUpToFive(c.knownDamage)}:{}),
  ...G.CHARACTER_BALANCE[c.id]}));

// Aplicação integral dos kits: números manuais prevalecem; mecânicas existentes são preservadas.
G.MASTER_UPGRADE=[
 {"id":"fonior","assetKey":"fonior","rarity":"MYTHIC","class":"MAGO","maxHp":320,"damage":220,"speed":4,"stamina":7},
 {"id":"zuri","assetKey":"zuri","rarity":"SECRET","class":"SUPPORT","maxHp":1050,"damage":160,"speed":1,"stamina":12},
 {"id":"trucc","assetKey":"trucc","rarity":"MYTHIC","class":"ASSASSIN","maxHp":430,"damage":120,"speed":9,"stamina":4},
 {"id":"daztirry","assetKey":"daztirry","rarity":"SECRET","class":"FIGHTER","maxHp":1250,"damage":240,"speed":6,"stamina":10,"parryThreshold":3},
 {"id":"eletric","assetKey":"eletric","rarity":"RARE","class":"MAGO","maxHp":220,"damage":100,"speed":3,"stamina":4},
 {"id":"chama","assetKey":"chama","rarity":"MYTHIC","class":"MAGO","maxHp":230,"damage":55,"speed":5,"stamina":7,"damageDisplaySuffix":"","burnDamage":40},
 {"id":"sam","assetKey":"sam","rarity":"LEGENDARY","class":"FIGHTER","maxHp":530,"damage":70,"speed":7,"stamina":7,"parryThreshold":5,"damageDisplaySuffix":"×6","classPatch":{"src":"assets/cards/card_base_sam.png","bounds":[695,1700,845,1895]}},
 {"id":"barn","assetKey":"barn","rarity":"MYTHIC","class":"MAGO","maxHp":330,"damage":120,"speed":3,"stamina":6},
 {"id":"elysh","assetKey":"elysh","rarity":"COMMON","class":"SUPPORT","maxHp":240,"damage":80,"speed":4,"stamina":3,"rearHealing":true},
 {"id":"unicorn","assetKey":"unicorn","rarity":"RARE","class":"SUPPORT","maxHp":390,"damage":60,"speed":4,"stamina":6},
 {"id":"rayvilin","assetKey":"rayvlin","rarity":"SECRET","class":"FIGHTER","maxHp":860,"damage":180,"speed":6,"stamina":6,"parryThreshold":2},
 {"id":"z_zus","assetKey":"z_zus","rarity":"LEGENDARY","class":"TANK","maxHp":1200,"damage":300,"speed":3,"stamina":5,"tankResistance":0.2},
 {"id":"mike","assetKey":"mike","rarity":"COMMON","class":"DESTROYER","maxHp":130,"damage":170,"speed":5,"stamina":6},
 {"id":"nully","assetKey":"nully","rarity":"LEGENDARY","class":"ASSASSIN","maxHp":370,"damage":80,"speed":9,"stamina":5},
 {"id":"alex","assetKey":"alex","rarity":"COMMON","class":"FIGHTER","maxHp":200,"damage":170,"speed":3,"stamina":2,"parryThreshold":1},
 {"id":"endrik","assetKey":"endrik","rarity":"EPIC","class":"DESTROYER","maxHp":160,"damage":250,"speed":4,"stamina":6},
 {"id":"p_ullys","assetKey":"p_ullys","rarity":"EPIC","class":"DESTROYER","maxHp":150,"damage":300,"speed":6,"stamina":6},
 {"id":"stally","assetKey":"vaglar_epic","rarity":"COMMON","class":"FIGHTER","maxHp":230,"damage":90,"speed":2,"stamina":4,"parryThreshold":5,"rename":true},
 {"id":"ddx","assetKey":"ddx","rarity":"RARE","class":"FIGHTER","maxHp":260,"damage":55,"speed":3,"stamina":6,"parryThreshold":3,"attackCount":2,"damageDisplaySuffix":"×2"},
 {"id":"sheriff","assetKey":"sheriff_rare","rarity":"RARE","class":"ASSASSIN","maxHp":190,"damage":0,"speed":5,"stamina":3,"damageDash":true},
 {"id":"zikssy","assetKey":"zikssy","rarity":"RARE","class":"ASSASSIN","maxHp":160,"damage":120,"speed":5,"stamina":1},
 {"id":"vaglar","assetKey":"vaglar_secret","rarity":"SECRET","class":"MAGO","maxHp":590,"damage":0,"speed":5,"stamina":12,"damageDash":true},
 {"id":"cavaleiro","assetKey":"cavaleiro","rarity":"LEGENDARY","class":"TANK","maxHp":920,"damage":130,"speed":2,"stamina":8,"tankResistance":0},
 {"id":"karma","assetKey":"karma","rarity":"MYTHIC","class":"DESTROYER","maxHp":320,"damage":120,"speed":6,"stamina":7},
 {"id":"penxy","assetKey":"penxy","rarity":"LEGENDARY","class":"ASSASSIN","maxHp":500,"damage":140,"speed":9,"stamina":7},
 {"id":"draktar","assetKey":"draktar","rarity":"MYTHIC","class":"ASSASSIN","maxHp":310,"damage":90,"speed":7,"stamina":6,"attackCount":2,"damageDisplaySuffix":"×2"},
 {"id":"rayyb","assetKey":"rayyb","rarity":"EPIC","class":"SUPPORT","maxHp":240,"damage":90,"speed":5,"stamina":4},
 {"id":"striker","assetKey":"sheriff_epic","rarity":"EPIC","class":"DESTROYER","maxHp":210,"damage":220,"speed":3,"stamina":4,"rename":true},
 {"id":"linx","assetKey":"linx","rarity":"LEGENDARY","class":"FIGHTER","maxHp":660,"damage":0,"speed":4,"stamina":3,"parryThreshold":1,"damageDash":true}
];
G.MAIN_ABILITIES.max_hp_strike={name:'Prototype',trigger:'maxHpStrike',ratio:.35,description:'Ataca um adversário por 35% da Vida máxima dele, arredondando para cima em múltiplos de 5. O ataque respeita defesa, esquiva e proteção.'};
G.CHARACTERS.push(received('linx','Linx','FIGHTER','LEGENDARY',4,3,'max_hp_strike'));
G.CHARACTERS=G.CHARACTERS.map(c=>{
 const spec=G.MASTER_UPGRADE.find(x=>x.id===c.id);if(!spec)return c;
 const {id,assetKey,maxHp,damage,...extra}=spec;
 const next=upgraded(id,c.name,spec.class,spec.rarity,spec.speed,spec.stamina,c.abilityId,assetKey,{...extra,abilityOnly:!!c.abilityOnly,passiveOnly:!!c.passiveOnly});
 next.official=true;next.copies=1;next.maxHp=maxHp;next.damage=damage;next.reason='Balanceamento manual do KitMasterUpgrade; habilidade atual preservada até revisão.';
 next.cardBase.outline=true;next.cardBase.cleanup.src='assets/cards/card_base_eletric.png';
 if(spec.rename){next.cardBase.cleanup.regions=next.cardBase.cleanup.regions.filter(b=>b[1]!==1030);(next.cardBase.patches??=[]).push({src:'assets/cards/card_base.png',bounds:[280,1030,800,1155],role:'name'});}
 next.cardBase.damageDisplayDivisor=spec.damageDisplayDivisor||1;next.cardBase.damageDisplaySuffix=spec.damageDisplaySuffix||'';next.cardBase.damageDash=!!spec.damageDash;
 if(maxHp>=1000){next.cardBase.cleanup.regions=next.cardBase.cleanup.regions.filter(b=>b[1]!==1330);next.cardBase.cleanup.regions.push([420,1330,870,1545]);next.cardBase.fields.hp={b:[430,1330,870,1545],s:225,a:'l'};}
 if(spec.classPatch)next.cardBase.patches=[{...spec.classPatch,role:'class'}];
 if(spec.class==='MAGO'&&id!=='chama'){next.cardBase.fields.mana={b:[365,840,475,950],s:90,a:'c'};(next.cardBase.patches??=[]).push({src:'assets/cards/card_base_eletric.png',bounds:[378,855,460,935],role:'mana'});}
 G.CHARACTER_BALANCE[id]={maxHp,damage,reason:next.reason};return Object.freeze(next);
});
})(globalThis.GOGHOS=globalThis.GOGHOS||{});
