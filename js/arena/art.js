// Positions are measured on the original transparent 1536 × 2048 character cards.
const ArenaArt=(()=>{
 const pieces=[
  ['77_20261023223319','unicorn',[447,1341,343,182],[456,1183,144,120]],
  ['68_20261023101502','sam',[476,1355,358,192],[471,1193,176,110]],
  ['63_20261021225220','sarck',[467,1312,358,191],[487,1223,82,85]],
  ['77_20261023224039','nully',[464,1337,336,186],[473,1189,144,115]],
  ['68_20261023194147','mike',[477,1339,304,193],[441,1190,192,124]]
 ];
 const printedAttacks=['Stardust','Steel Jaw','Steal Jaw','Katana','AK-47'];
 function emblem(c){
  const source='assets/characters-v047/Original-Base'+pieces[c.art][0]+'.png';
  return '<svg viewBox="15 30 218 192" aria-hidden="true" class="ability-emblem"><g clip-path="url(#ability-emblem)"><image href="'+source+'" x="-390" y="-505" width="768" height="1024"/></g></svg>';
 }
 function digits(box,value,life){
  const [x,y,w,h]=box;
  const edge=1212.92+.37794*x-y;
  const background=life?'<path fill="#cabbb5" d="M0 '+edge+' L'+w+' '+(edge+.37794*w)+' V'+h+' H0 Z"/>':'';
  return '<svg x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'"><rect width="100%" height="100%" fill="#fefbeb"/>'+background+
   '<text x="50%" y="50%" text-anchor="middle" dominant-baseline="central" fill="#19131a" font-size="'+h+'" textLength="'+Math.min(w-5,String(value).length*h*.5)+'" lengthAdjust="spacingAndGlyphs">'+value+'</text></svg>';
 }
 function healthRibbon(c){
  const fraction=Math.max(0,Math.min(1,c.hp/c.maxHp));
  // Coordinates are relative to the card tip. Both faces share the same live fill.
  const clip='hp-fill-'+c.id;
  const face='M0 0 L654 58 L654 144 L94 150 Z';
  return '<g class="card-health" data-health="'+c.hp+'" transform="translate(410 2048)" aria-hidden="true">'+
   '<path d="'+face+'" fill="#422436"/>'+
   '<defs><clipPath id="'+clip+'"><rect width="'+(654*fraction)+'" height="150"/></clipPath></defs>'+
   '<g clip-path="url(#'+clip+')">'+
    '<path d="'+face+'" fill="#a0145f"/>'+
    '<path d="M0 0 L654 58 L654 125 L55 89 Z" fill="#ff0055"/>'+
   '</g>'+
   '<text x="537" y="145" text-anchor="end" fill="white" font-size="160">'+c.hp+'</text>'+
   '<image href="assets/player-panel-v048/heart.png" x="562" y="27" width="162" height="154"/></g>';
 }
 function card(c,withHealth=false){
  const [file,,hp,attack]=pieces[c.art];
  const viewHeight=withHealth?2230:2048;
  return '<svg viewBox="0 0 1536 '+viewHeight+'" class="original-card" preserveAspectRatio="xMidYMax meet" aria-hidden="true"><image width="1536" height="2048" href="assets/characters-v047/Original-Base'+file+'.png"/>'+digits(hp,c.hp,true)+digits(attack,c.atk,false)+(withHealth?healthRibbon(c):'')+'</svg>'+(withHealth?'':'<span class="slot-gem"><b>'+(c.slot+1)+'</b></span>');
 }
 return Object.freeze({card,emblem,printedAttack:c=>printedAttacks[c.art],ribbon:c=>'assets/turn-order-v050/'+pieces[c.art][1]+'.png'});
})();
