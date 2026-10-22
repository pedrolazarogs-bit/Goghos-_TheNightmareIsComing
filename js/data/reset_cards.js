// Cartas do monte Reset. Edite somente este arquivo para incluir/alterar cartas e a composição do monte.
// Tipos: Apoio, Item, Habilidade Especial, Daly e Fragmento Primordial.
// As cartas de Apoio vêm de js/data/support_cards.js (fonte única). As demais abaixo são PROVISÓRIAS (sem arte/efeito oficial):
// quando o criador enviar a arte, troque o item provisório (placeholder:true) por uma entrada real, com art:'assets/reset/<id>.png'.
(function(G){
G.CARD_TYPES={
  SUPPORT:{label:'Apoio',color:'#4fbf8a'},
  ITEM:{label:'Item',color:'#5b9bd5'},
  SPECIAL:{label:'Habilidade Especial',color:'#a06bd8'},
  DALY:{label:'Daly',color:'#e0b84f'},
  PRIMORDIAL:{label:'Fragmento Primordial',color:'#d1495b'}};
// Regras do Reset (PROVISÓRIAS, aguardando definição do criador).
// MONTE PRINCIPAL: só estas 4 categorias entram nele (Apoio, Habilidade Especial, Item e Daly). Personagens ficam nos 5 montes por raridade (js/core/roster.js).
// Os Fragmentos Primordiais continuam cadastrados abaixo, mas ficam FORA do monte principal.
// Opcional em uma carta Daly: color:'<cor>' — se existir, só personagens com o mesmo color são elegíveis; sem color, todos os disponíveis são elegíveis.
G.CONFIG.mainDeckTypes=['SUPPORT','SPECIAL','ITEM','DALY'];
G.CONFIG.resetDraw={
  perTeam:1,          // cartas que CADA equipe compra a cada reset da hierarquia de velocidade
  onBattleStart:false}; // true = também compra ao iniciar a batalha (rodada 1)
const P=(id,type,name,copies=2)=>({id,type,name,copies,art:'assets/reset/'+id+'.png',description:'Carta provisória.',placeholder:true});
G.RESET_CARDS=[
  ...G.SUPPORT_CARDS.map(c=>({id:c.id,type:'SUPPORT',name:c.name,copies:2,art:c.art,description:c.description,supportCard:true})), // copies: quantas cópias no monte (PROVISÓRIO)
  P('item_01','ITEM','Item 01'),P('item_02','ITEM','Item 02'),
  P('habilidade_01','SPECIAL','Habilidade Especial 01'),P('habilidade_02','SPECIAL','Habilidade Especial 02'),
  P('daly_01','DALY','Daly 01'),P('daly_02','DALY','Daly 02'),
  P('fragmento_01','PRIMORDIAL','Fragmento Primordial 01'),P('fragmento_02','PRIMORDIAL','Fragmento Primordial 02')];
})(globalThis.GOGHOS);
