// Shared presentation only: scoring and elapsed time belong to the caller.
(function(root){
'use strict';
const formatTime=ms=>{const seconds=Math.max(0,Math.floor(ms/1000));return String(Math.floor(seconds/60)).padStart(2,'0')+':'+String(seconds%60).padStart(2,'0');};
function mount(host){
 host.classList.add('game-scoreboard');
 host.innerHTML='<div class="scoreboard-art" aria-hidden="true"><img src="assets/scoreboard-v049/scoreboard.png" alt="" draggable="false"></div>'+
  '<strong class="scoreboard-number scoreboard-blue" data-score-team="blue" aria-label="Equipe azul: 0 vitórias">0</strong>'+
  '<strong class="scoreboard-number scoreboard-red" data-score-team="red" aria-label="Equipe vermelha: 0 vitórias">0</strong>'+
  '<div class="scoreboard-clock"><span data-score-round>RODADA 1</span><time data-score-time datetime="PT0S" aria-label="Duração da série">00:00</time><small>PRIMEIRO A<br>3 VITÓRIAS</small></div>'+
  '<p class="scoreboard-announcement" data-score-announcement role="status" aria-live="polite" aria-atomic="true"></p>';
 const find=s=>host.querySelector(s),numbers={blue:find('[data-score-team="blue"]'),red:find('[data-score-team="red"]')},clock=find('[data-score-time]'),round=find('[data-score-round]'),announcement=find('[data-score-announcement]');
 let previous=null,lastSecond=-1;
 function setTime(ms){const seconds=Math.max(0,Math.floor(ms/1000));if(seconds===lastSecond)return;lastSecond=seconds;clock.textContent=formatTime(ms);clock.dateTime='PT'+seconds+'S';}
 function render({score,round:roundNumber,elapsedMs,winner=null}){
  for(const team of ['blue','red']){
   const element=numbers[team],value=score[team];element.textContent=String(value);element.setAttribute('aria-label','Equipe '+(team==='blue'?'azul':'vermelha')+': '+value+' vitórias');
   if(previous&&value!==previous[team])element.getAnimations().forEach(a=>a.cancel());
   if(previous&&value>previous[team]&&!document.body.classList.contains('reduced')&&!matchMedia('(prefers-reduced-motion:reduce)').matches){element.animate([{transform:'translateY(0) scale(1)'},{transform:'translateY(-4px) scale(1.12)'},{transform:'translateY(0) scale(1)'}],{duration:360,easing:'ease-out'});}
  }
  round.textContent=winner?'SÉRIE ENCERRADA':'RODADA '+roundNumber;
  host.dataset.winner=winner||'';
  if(!previous||score.blue!==previous.blue||score.red!==previous.red)announcement.textContent=winner?'Equipe '+(winner==='blue'?'azul':'vermelha')+' vence a série. '+score.blue+' a '+score.red+'.':'Placar: azul '+score.blue+', vermelho '+score.red+'.';
  previous={...score};setTime(elapsedMs);
 }
 return Object.freeze({render,setTime,destroy(){Object.values(numbers).forEach(e=>e.getAnimations().forEach(a=>a.cancel()));host.replaceChildren();}});
}
root.GoghosScoreboard=Object.freeze({mount,formatTime});
})(globalThis);
