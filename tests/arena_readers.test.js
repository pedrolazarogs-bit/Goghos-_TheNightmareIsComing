const assert=require('node:assert/strict');
['data/characters','data/gods','data/support_cards','data/reset_cards','core/battle','core/character_abilities','core/deck','core/support','core/roster','core/official_abilities','core/support_effects','core/divine','ui/card','ui/support_ui','ui/hand_ui','ui/match_ui','ui/arena_ui'].forEach(name=>require('../js/'+name+'.js')); require('../js/ui/arena_readers.js');
const G=globalThis.GOGHOS;
const s=G.createBattleState({front:['mike','alex'],rear:['elysh']},{front:['john','stally'],rear:[]});
s.log=Array.from({length:40},(_,i)=>'Evento '+i+' <script> '+('Mensagem longa de batalha. '.repeat(20)));
const unit=s.units[0],before=JSON.stringify(s),old=G.getNextActor;
G.getNextActor=()=>{throw Error('Consultar a arena não pode avançar a batalha');};
try{
 for(const type of ['card','history','order','eliminated','hand','settings','piles']){
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
const piles=G.ArenaReaders.render({type:'piles',state:s});
assert.equal(piles.title,'Montes da partida');assert.equal(piles.pages,2);assert(piles.html.includes('Monte principal'));
const rarities=G.ArenaReaders.render({type:'piles',state:s,page:1});
for(const r of G.RARITIES)assert(rarities.html.includes(G.RARITY_LABEL[r]));
assert(rarities.html.includes('reader-rarity-pile'));assert.equal(JSON.stringify(s),before);
console.log('OK  montes separados ficam numa consulta dedicada sem revelar ou consumir cartas');
const offered=s.units.filter(u=>u.team==='enemy'),targetBefore=JSON.stringify(s);
const targetReader=G.ArenaReaders.render({type:'targets',state:s,targets:offered,selectedUid:offered[0].uid,dalyTarget:true});
assert(targetReader.html.includes('data-command-target="'+offered[0].uid+'"'));
assert(targetReader.html.includes('aria-pressed="true"'));assert(targetReader.html.includes('data-command-target="daly_enemy"'));
assert(!targetReader.html.includes('data-command-target="'+unit.uid+'"'));assert.equal(JSON.stringify(s),targetBefore);
const emptyTargets=G.ArenaReaders.render({type:'targets',state:s,targets:[]});assert(emptyTargets.html.includes('Nenhum alvo disponível'));
console.log('OK  escolha de alvos apresenta somente opções recebidas, inclui Daly exposta e não altera a partida');
