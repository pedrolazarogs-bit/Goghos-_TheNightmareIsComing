// Positions are measured on the original transparent 1536 × 2048 character cards.
const ArenaArt=(()=>{
 const pieces=[
  ['77_20261023223319','unicorn',[447,1341,343,182],[456,1183,144,120]],
  ['68_20261023101502','sam',[476,1355,358,192],[471,1193,176,110]],
  ['63_20261021225220','sarck',[467,1312,358,191],[487,1223,82,85]],
  ['77_20261023224039','nully',[464,1337,336,186],[473,1189,144,115]],
  ['68_20261023194147','mike',[477,1339,304,193],[441,1190,192,124]],
  ['68_20261023181416','penxy',[474,1342,354,192],[453,1189,192,126]]
 ];
 const printedAttacks=['Stardust','Steel Jaw','Steal Jaw','Katana','AK-47','Garra Fantasma'];
 function emblem(c){
  const source=('assets/characters-v047/Original-Base'+pieces[c.art][0]+'.png');
  return '<svg viewBox="15 30 218 192" aria-hidden="true" class="ability-emblem"><g clip-path="url(#ability-emblem)"><image href="'+source+'" x="-390" y="-505" width="768" height="1024"/></g></svg>';
 }
 function digits(box,value,life){
  const [x,y,w,h]=box;
  const edge=1212.92+.37794*x-y;
  const background=life?'<path fill="#cabbb5" d="M0 '+edge+' L'+w+' '+(edge+.37794*w)+' V'+h+' H0 Z"/>':'';
  return '<svg x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'"><rect width="100%" height="100%" fill="#fefbeb"/>'+background+
   '<text'+(life?' class="printed-life"':' class="printed-attack"')+' x="50%" y="50%" text-anchor="middle" dominant-baseline="central" fill="#19131a" font-size="'+h+'" textLength="'+Math.min(w-5,String(value).length*h*.5)+'" lengthAdjust="spacingAndGlyphs">'+value+'</text></svg>';
 }
 function isCritical(c){return c.hp>0 && c.hp*100<c.maxHp*15;}
 function missingFraction(c){return 1-Math.max(0,Math.min(1,c.hp/c.maxHp));}
 // End the live segment at the near edge of the heart so even 1% is visible.
 const meterWidth=562;
 function setMeterState(meter,c){
  if(meter.dataset.health===String(c.hp)&&meter.dataset.max===String(c.maxHp))return false;
  const lost=meter.dataset.max===String(c.maxHp)&&c.hp<Number(meter.dataset.health);
  meter.classList.toggle('took-damage',lost);
  meter.classList.toggle('life-critical',isCritical(c));
  meter.dataset.health=c.hp;
  meter.dataset.max=c.maxHp;
  return true;
 }
 function updateHealth(element,c){
  const ribbon=element.querySelector('.card-health');
  if(!setMeterState(ribbon,c))return;
  const edge=meterWidth*missingFraction(c);
  for(const mask of ribbon.querySelectorAll('clipPath rect'))mask.setAttribute('x',edge);
  ribbon.querySelector('text').textContent=String(c.hp);
  const printed=element.querySelector('.printed-life');
  printed.textContent=String(c.hp);
  printed.setAttribute('textLength',Math.min(pieces[c.art][2][2]-5,String(c.hp).length*pieces[c.art][2][3]*.5));
 }
 function healthRibbon(c){
  // Coordinates are relative to the card tip. Both faces share the same live fill.
  const clip='hp-fill-'+c.id;
  const face='M0 0 L562 50 L562 145 L94 150 Z';
  const mask='<rect x="'+(meterWidth*missingFraction(c))+'" width="'+meterWidth+'" height="150"/>';
  return '<g class="card-health'+(isCritical(c)?' life-critical':'')+'" data-health="'+c.hp+'" data-max="'+c.maxHp+'" transform="translate(410 2048)" aria-hidden="true">'+
   '<path class="life-track" d="'+face+'" fill="#422436"/>'+
   '<defs><clipPath id="'+clip+'">'+mask+'</clipPath><clipPath class="trail-mask" id="'+clip+'-trail">'+mask+'</clipPath></defs>'+
   '<path class="damage-trail" clip-path="url(#'+clip+'-trail)" d="'+face+'" fill="#ff9a39"/>'+
   '<g class="life-fill" clip-path="url(#'+clip+')">'+
    '<path d="'+face+'" fill="#a0145f"/>'+
    '<path d="M0 0 L562 50 L562 119 L55 89 Z" fill="#ff0055"/>'+
   '</g>'+
   '<text x="537" y="145" text-anchor="end" fill="white" font-size="160">'+c.hp+'</text>'+
   '<image href="'+('assets/player-panel-v048/heart.png')+'" x="562" y="27" width="162" height="154"/></g>';
 }
 function card(c,withHealth=false){
  const [file,,hp,attack]=pieces[c.art];
  const viewHeight=withHealth?2230:2048;
  return '<svg viewBox="0 0 1536 '+viewHeight+'" class="original-card" preserveAspectRatio="xMidYMax meet" aria-hidden="true"><image width="1536" height="2048" href="'+('assets/characters-v047/Original-Base'+file+'.png')+'"/>'+digits(hp,c.hp,true)+digits(attack,c.atk,false)+(withHealth?healthRibbon(c):'')+'</svg>'+(withHealth?'':'<span class="slot-gem"><b>'+(c.slot+1)+'</b></span>');
 }
 return Object.freeze({card,emblem,setMeterState,updateHealth,isCritical,missingFraction,printedAttack:c=>printedAttacks[c.art],ribbon:c=>('assets/turn-order-v050/'+pieces[c.art][1]+'.png')});
})();
