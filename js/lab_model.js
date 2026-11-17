// Independent test state. No game imports, storage, audio or navigation.
(function(root){
'use strict';
const names=['Unicorn','Sam','Sark'];
function create(){return {selected:null,sequence:0,events:[],cards:names.map((name,id)=>({id:String(id),name,hp:100,maxHp:100,zone:'hand'}))};}
function record(state,type,detail){state.events.unshift({sequence:++state.sequence,type,detail});state.events.length=Math.min(state.events.length,100);}
function act(state,type,id,amount){
 const card=state.cards.find(c=>c.id===id);
 if(type==='clear'){state.events=[];return true;}
 if(!card){record(state,'bloqueado','Selecione uma carta.');return false;}
 if(type==='select'){state.selected=state.selected===id?null:id;record(state,'seleção',state.selected?card.name:'Seleção desmarcada');return true;}
 if(type==='inspect'){record(state,'detalhes',card.name);return true;}
 if(type==='move'){
  if(card.hp===0){record(state,'bloqueado',card.name+': cure a carta antes de mover.');return false;}
  card.zone=card.zone==='hand'?'arena':'hand';record(state,'movimento',card.name+' → '+(card.zone==='hand'?'mão':'área de teste'));return true;
 }
 if(type==='damage'||type==='heal'){
  if(!Number.isInteger(amount)||amount<1||amount>100){record(state,'bloqueado','Use uma quantidade inteira de 1 a 100.');return false;}
  const before=card.hp;card.hp=Math.max(0,Math.min(card.maxHp,card.hp+(type==='damage'?-amount:amount)));
  record(state,type==='damage'?'dano':'cura',card.name+': '+before+' → '+card.hp+' PV');return true;
 }
 record(state,'bloqueado','Ação desconhecida.');return false;
}
const api=Object.freeze({create,act,record});if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.GoghosLab=api;
})(globalThis);
