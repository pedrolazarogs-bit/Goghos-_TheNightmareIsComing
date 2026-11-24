// Keep combat scenarios reproducible when a test needs particular opponents.
function fixedMatchups(model){
 return {...model,start(state,now,choice){
  if(!state.singlePlayer)return model.start(state,now,choice);
  const cards=Array.from({length:8},(_,i)=>(choice+i)%model.roster.length);
  state.singlePlayer=false;
  try{
   if(!model.start(state,now,{blue:cards.slice(0,4),red:cards.slice(4)}))return false;
  }finally{state.singlePlayer=true;}
  state.playerId='blue-0';
  state.cards.forEach(card=>{card.controller=card.id===state.playerId?'player':'bot';});
  return true;
 }};
}
module.exports=fixedMatchups;
