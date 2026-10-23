// Deuses não pertencem a uma raridade e nunca entram nos montes de personagens.
(function(G){
G.MAIN_ABILITIES.presence={name:'Presence',trigger:'presence',description:'Ignora habilidades de personagens: controles, execuções, defesas e reações. Seus ataques atravessam essas proteções. Cartas de Apoio continuam válidas. MAX reúne os tributos de classe já definidos.'};
G.GODS=[Object.freeze({id:'zenneriam',name:'Zeenneriam',class:'DEUS',rarity:null,summonOnly:true,official:true,illustrated:true,copies:1,maxHp:1700,damage:700,speed:7,stamina:12,parryThreshold:2,tribute:'MAX',abilityId:'presence',mainAbility:'Presence',description:G.MAIN_ABILITIES.presence.description,art:'assets/characters/zenneriam_banner.png',
 portraitBanner:{src:'assets/characters/zenneriam_banner.png',size:[2048,2048],bounds:[0,127,1945,1484]},
 cardBase:{src:'assets/cards/card_base_zenneriam.png',fields:{speed:{b:[690,95,855,255],s:150,a:'c',c:'#57465e'},damage:{b:[440,1170,690,1320],s:160,a:'l'},hp:{b:[450,1330,885,1535],s:250,a:'l'}}}})];
const oldLookup=G.getCharacterById;
G.getCharacterById=id=>oldLookup(id)||G.GODS.find(c=>c.id===id)||null;
G.isGod=u=>!!u&&(u.class==='DEUS'||!!G.GODS.find(c=>c.id===u.id));
G.hasClass=(u,cls)=>u?.class===cls||G.isGod(u)&&G.CLASSES.includes(cls);
G.manaFor=c=>G.hasClass(c,'MAGO')?G.MAGE_MAX_MANA:0;
G.createGodReserve=()=>G.GODS.map(c=>({iid:'divine_'+c.id,id:c.id}));
G.rarityLabel=c=>G.isGod(c)?'Deus · sem raridade':G.RARITY_LABEL[c.rarity];
})(globalThis.GOGHOS);
