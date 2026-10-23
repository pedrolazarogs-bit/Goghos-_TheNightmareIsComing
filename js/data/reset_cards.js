// Cartas do monte Reset. Edite somente este arquivo para incluir/alterar cartas e a composição do monte.
// Tipos: Apoio, Item, Habilidade Especial, Daly e Fragmento Primordial.
// As cartas de Apoio vêm de js/data/support_cards.js (fonte única). As demais abaixo são PROVISÓRIAS (sem arte/efeito oficial):
// quando o criador enviar a arte, troque o item provisório (placeholder:true) por uma entrada real, com art:'assets/reset/<id>.png'.
(function(G){
G.CARD_TYPES={
  SUPPORT:{label:'Apoio',color:'#4fbf8a'},
  ITEM:{label:'Item',color:'#5b9bd5'},
  SPECIAL:{label:'Habilidade Especial',color:'#a06bd8'},
  DALY:{label:'Medalha Daly',color:'#e0b84f'},
  PRIMORDIAL:{label:'Fragmento Primordial',color:'#d1495b'}};
// Regras do Reset (PROVISÓRIAS, aguardando definição do criador).
// MONTE PRINCIPAL: só estas 4 categorias entram nele (Apoio, Habilidade Especial, Item e Daly). Personagens ficam nos 6 montes por raridade (js/core/roster.js).
// Os Fragmentos Primordiais continuam cadastrados abaixo, mas ficam FORA do monte principal.
// A cor da medalha determina a raridade; o resgate retira o topo do monte correspondente.
G.MEDAL_COLORS={COMMON:{name:'Azul',color:'#54a8ff'},RARE:{name:'Verde',color:'#4fd491'},EPIC:{name:'Roxa',color:'#b98aff'},MYTHIC:{name:'Vermelha',color:'#fa476e'},LEGENDARY:{name:'Holográfica',color:'#f3d58c'},SECRET:{name:'Preta',color:'#25232d'}};
G.MEDAL_ID={COMMON:'daly_01',RARE:'daly_02',EPIC:'daly_03',MYTHIC:'daly_06',LEGENDARY:'daly_04',SECRET:'daly_05'};
G.CONFIG.mainDeckTypes=['SUPPORT','SPECIAL','ITEM','DALY'];
G.CONFIG.resetDraw={
  perTeam:1,          // cartas que CADA equipe compra a cada reset da hierarquia de velocidade
  onBattleStart:false}; // true = também compra ao iniciar a batalha (rodada 1)
const P=(id,type,name,copies=2)=>({id,type,name,copies,art:'assets/reset/'+id+'.png',description:'Carta provisória.',placeholder:true});
G.RESET_CARDS=[
  ...G.SUPPORT_CARDS.map(c=>({id:c.id,type:'SUPPORT',name:c.name,copies:2,art:c.art,description:c.description,supportCard:true})), // copies: quantas cópias no monte (PROVISÓRIO)
  P('item_01','ITEM','Item 01'),P('item_02','ITEM','Item 02'),
  P('habilidade_01','SPECIAL','Habilidade Especial 01'),P('habilidade_02','SPECIAL','Habilidade Especial 02'),
  ...G.RARITIES.map(rarity=>({...P(G.MEDAL_ID[rarity],'DALY','Medalha '+G.MEDAL_COLORS[rarity].name),rarity,color:G.MEDAL_COLORS[rarity].color,description:'Resgate o personagem do topo do monte '+G.RARITY_LABEL[rarity]+'. A medalha só é gasta quando o personagem entra na equipe.'})),
  P('fragmento_01','PRIMORDIAL','Fragmento Primordial 01'),P('fragmento_02','PRIMORDIAL','Fragmento Primordial 02')];
})(globalThis.GOGHOS);
