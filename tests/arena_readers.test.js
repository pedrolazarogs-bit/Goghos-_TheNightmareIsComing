const assert=require('node:assert/strict');
['data/characters','data/gods','data/support_cards','data/reset_cards','core/battle','core/character_abilities','core/deck','core/support','core/roster','core/official_abilities','core/support_effects','core/divine','ui/card','ui/support_ui','ui/hand_ui','ui/match_ui','ui/arena_ui'].forEach(name=>require('../js/'+name+'.js')); require('../js/ui/arena_readers.js');
const G=globalThis.GOGHOS;
const s=G.createBattleState({front:['mike','alex'],rear:['elysh']},{front:['john','stally'],rear:[]});
s.log=Array.from({length:40},(_,i)=>'Evento '+i+' <script> '+('Mensagem longa de batalha. '.repeat(20)));
const unit=s.units[0],before=JSON.stringify(s),old=G.getNextActor;
G.getNextActor=()=>{throw Error('Consultar a arena não pode avançar a batalha');};
try{
 for(const type of ['card','history','order','eliminated','hand','settings']){
  const first=G.ArenaReaders.render({type,state:s,unit,handPages:3});
  assert(first.pages>=1);assert.equal(first.page,0);
  for(let page=0;page<first.pages;page++){
   const r=G.ArenaReaders.render({type,state:s,unit,page,handPages:3});
   assert.equal(r.page,page);assert(r.html.includes('fit-reader-body'));
   assert(!r.html.includes('<script>'));
  }
  assert.equal(G.ArenaReaders.render({type,state:s,unit,page:999,handPages:3}).page,first.pages-1);
 }
 assert.equal(JSON.stringify(s),before);
}finally{G.getNextActor=old;}
console.log('OK  consultas completas são paginadas, escapam texto e preservam a partida e a fila');
