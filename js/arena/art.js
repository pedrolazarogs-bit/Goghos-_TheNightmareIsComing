// Positions are measured on the original transparent 1536 × 2048 character cards.
const ArenaArt=(()=>{
 const pieces=[
  ['77_20261023223319','unicorn',[447,1341,343,182],[456,1183,144,120]],
  ['68_20261023101502','sam',[476,1355,358,192],[471,1193,176,110]],
  ['63_20261021225220','sarck',[467,1312,358,191],[487,1223,82,85]],
  ['77_20261023224039','nully',[464,1337,336,186],[473,1189,144,115]],
  ['68_20261023194147','mike',[477,1339,304,193],[441,1190,192,124]]
 ];
 function digits(box,value,life){
  const [x,y,w,h]=box;
  const edge=1212.92+.37794*x-y;
  const background=life?'<path fill="#cabbb5" d="M0 '+edge+' L'+w+' '+(edge+.37794*w)+' V'+h+' H0 Z"/>':'';
  return '<svg x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'"><rect width="100%" height="100%" fill="#fefbeb"/>'+background+
   '<text x="50%" y="50%" text-anchor="middle" dominant-baseline="central" fill="#19131a" font-size="'+h+'" textLength="'+Math.min(w-5,String(value).length*h*.5)+'" lengthAdjust="spacingAndGlyphs">'+value+'</text></svg>';
 }
 function card(c){
  const [file,,hp,attack]=pieces[c.art];
  return '<svg viewBox="0 0 1536 2048" class="original-card" aria-hidden="true"><image width="1536" height="2048" href="assets/characters-v047/Original-Base'+file+'.png"/>'+digits(hp,c.hp,true)+digits(attack,c.atk,false)+'</svg><span class="slot-gem"><b>'+(c.slot+1)+'</b></span>';
 }
 return Object.freeze({card,ribbon:c=>'assets/turn-order-v050/'+pieces[c.art][1]+'.png'});
})();
