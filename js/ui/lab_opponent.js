// CardTouch reference adapted to targeting an opponent, only inside the lab.
(function(){
'use strict';
const $=id=>document.getElementById(id);
let playerTurn=true,cards;
const fixture=()=>({
 a:{name:'P.ULLYS · oponente A',atk:300,hp:150,maxHp:150,ability:{name:'Ataque vasto',text:'O ataque de P.ULLYS também causa 50 pontos de dano nos oponentes ao lado do alvo.'},status:[{type:'nerf',name:'Envenenado'},{type:'buff',name:'Fortalecido'},{type:'buff',name:'Escudo',value:'5%'}]},
 b:{name:'P.ULLYS · oponente B',atk:300,hp:90,maxHp:150,ability:{name:'Ataque vasto',text:'O ataque de P.ULLYS também causa 50 pontos de dano nos oponentes ao lado do alvo.'},status:[{type:'buff',name:'Escudo',value:'5%'}]}
});
function report(text){$('opponent-result').textContent=text;document.dispatchEvent(new CustomEvent('goghos:lab-event',{detail:{type:'oponente',text}}));}
function update(){
 $('opponent-turn').textContent=playerTurn?'Sua vez de atacar':'Vez do oponente';
 $('opponent-swap').textContent=playerTurn?'Testar fora da sua vez':'Liberar sua vez';
 for(const el of document.querySelectorAll('[data-tc-card]')){const c=cards[el.dataset.opponent];el.setAttribute('aria-label',c.name+', '+c.hp+' de '+c.maxHp+' PV. Clique para interagir.');el.querySelector('.opponent-name').textContent='Oponente '+el.dataset.opponent.toUpperCase()+' · '+c.hp+' PV';}
 CardTouch.refresh();
}
function reset(){CardTouch.close();playerTurn=true;cards=fixture();update();$('opponent-result').textContent='Clique em uma carta do oponente para começar.';}
cards=fixture();
CardTouch.init({selector:'[data-tc-card]',assets:'assets/card-touch-v044/',labels:{attack:'ATACAR'},getCard:el=>cards[el.dataset.opponent],isAttackTurn:c=>playerTurn&&c.hp>0,onAttack:(c,el)=>{
 // The selected card is the TARGET. Its printed attack value is not outgoing damage.
 const before=c.hp;c.hp=Math.max(0,c.hp-25);playerTurn=false;update();
 report('Ataque de teste no oponente '+el.dataset.opponent.toUpperCase()+': '+before+' → '+c.hp+' PV. Vez encerrada.');
}});
$('opponent-swap').addEventListener('click',()=>{CardTouch.close();playerTurn=!playerTurn;update();report(playerTurn?'Sua vez liberada para teste.':'Fora da sua vez: apenas informações.');});
$('opponent-reset').addEventListener('click',()=>{reset();report('Teste do oponente reiniciado.');});
$('reset')?.addEventListener('click',reset);
window.GoghosOpponentLab=Object.freeze({snapshot:()=>JSON.parse(JSON.stringify({playerTurn,damage:25,cards}))});
reset();
})();
