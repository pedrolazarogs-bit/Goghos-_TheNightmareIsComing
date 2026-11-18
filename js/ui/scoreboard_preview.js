(function(){
'use strict';
const $=id=>document.getElementById(id),panel=GoghosScoreboard.mount($('preview-scoreboard'));
let score,round,startedAt,endedAt,winner;
const elapsed=()=>startedAt===null?0:(endedAt??performance.now())-startedAt;
function render(){panel.render({score,round,elapsedMs:elapsed(),winner});$('score-start').disabled=startedAt!==null;for(const team of ['blue','red'])$('point-'+team).disabled=startedAt===null||winner!==null;}
function reset(){score={blue:0,red:0};round=1;startedAt=endedAt=winner=null;$('score-preview-status').textContent='Pronto para começar.';render();}
$('score-start').addEventListener('click',()=>{if(startedAt!==null)return;startedAt=performance.now();$('score-preview-status').textContent='Série de teste em andamento.';render();});
for(const team of ['blue','red'])$('point-'+team).addEventListener('click',()=>{
 if(startedAt===null||winner!==null)return;
 score[team]++;const name=team==='blue'?'Azul':'Vermelho';
 if(score[team]===3){winner=team;endedAt=performance.now();$('score-preview-status').textContent='Equipe '+name+' venceu a série. Tempo final: '+GoghosScoreboard.formatTime(elapsed())+'.';}
 else{round++;$('score-preview-status').textContent='Ponto para '+name+'. Rodada '+round+' pronta.';}
 render();
});
$('score-reset').addEventListener('click',reset);
const resize=new ResizeObserver(()=>{const box=$('score-preview-viewport').getBoundingClientRect();$('score-preview-stage').style.setProperty('--score-scale',String(Math.min(box.width/560,box.height/280)));});resize.observe($('score-preview-viewport'));
setInterval(()=>panel.setTime(elapsed()),200);reset();
})();
