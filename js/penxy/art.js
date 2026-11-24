// Positions are measured on the original transparent 1536 × 2048 character cards.
const ArenaArt=(()=>{
 const entry=c=>GoghosBattleLab.deck[c.art];
 function emblem(c){
  const source=entry(c).image;
  if(['wear','fire','scare'].includes(c.skill))return '<svg viewBox="260 454 184 132" aria-hidden="true" class="ability-emblem"><image width="480" height="804" href="'+source+'"/></svg>';
  if(!source)return '<b aria-hidden="true">?</b>';
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
  if(!printed.closest('.revised-face'))printed.setAttribute('textLength',Math.min((GoghosCardValues.layoutFor(entry(c).index)?.hp[2]||336)-5,String(c.hp).length*(GoghosCardValues.layoutFor(entry(c).index)?.hp[3]||180)*.5));
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
  const profile=entry(c),layout=GoghosCardValues.layoutFor(profile.index);
  if(['wear','fire','scare'].includes(c.skill)){
   const petra=c.skill==='wear';
   const erase=petra?'':'<rect x="107" y="463" width="89" height="53" fill="#fefcea"/><path fill="#fefcea" d="M100 517H265V601H100Z"/><path fill="#cabbb5" d="M100 534L265 597V601H100Z"/>';
   const speed=petra?'<text x="242" y="76" text-anchor="middle" font-size="66" class="printed-speed">'+c.speed+'</text>':'';
   const face='<svg class="revised-face" x="157" width="1222" height="2048" viewBox="0 0 480 804"><image width="480" height="804" href="'+profile.image+'"/>'+erase+
    '<g fill="#151119">'+speed+'<text x="108" y="507" class="printed-attack" font-size="50">'+(c.atk??'—')+'</text><text x="110" y="590" class="printed-life" font-size="87">'+c.hp+'</text></g></svg>';
   return '<svg viewBox="0 0 1536 '+(withHealth?2230:2048)+'" preserveAspectRatio="xMidYMax meet" class="original-card" aria-hidden="true">'+face+(withHealth?healthRibbon(c):'')+'</svg>';
  }
  const hp=layout?.hp||[447,1341,343,182],attack=layout?.attack||[456,1183,180,120];
  const artwork=profile.image?'<image width="1536" height="2048" href="'+profile.image+'"/>':
   '<path d="M768 60 L1290 365 V1570 L768 1980 L246 1570 V365Z" fill="#241e32" stroke="#a992ae" stroke-width="20"/><text x="768" y="900" text-anchor="middle" fill="#dacddd" font-size="370">?</text><text x="768" y="1090" text-anchor="middle" fill="white" font-size="105">'+c.name+'</text><g fill="#e8d6ae" font-size="85"><text x="768" y="356" text-anchor="middle" class="placeholder-speed">'+c.speed+' VEL</text><text x="690" y="1300">ATQ</text><text x="840" y="1490">PV</text></g>';
  const correctedName=['Striker','Stally'].includes(profile.name)?
   '<path fill="#fffbe9" d="M270 1036H783L678 1145H270Z"/><path fill="#cbbdb7" d="M270 1110L737 1066L661 1145H270Z"/><text x="290" y="1130" font-size="103" textLength="376" lengthAdjust="spacingAndGlyphs" fill="#17131a">'+profile.name+'</text>':'';
  return '<svg viewBox="0 0 1536 '+(withHealth?2230:2048)+'" class="original-card" preserveAspectRatio="xMidYMax meet" aria-hidden="true">'+artwork+correctedName+digits(hp,c.hp,true)+digits(attack,c.atk??'—',false)+(withHealth?healthRibbon(c):'')+'</svg>';
 }
 return Object.freeze({card,emblem,setMeterState,updateHealth,isCritical,missingFraction,printedAttack:c=>entry(c).attackName,ribbon:c=>entry(c).queueArt||entry(c).image});
})();
