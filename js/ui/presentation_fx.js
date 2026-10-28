// GOGHOS presentation only: consumes resolved events; never changes battle rules or units.
(function(G){
'use strict';
const PREF_KEY='goghos.presentation.v1';
const DEFAULTS=Object.freeze({muted:false,volume:.38,musicMuted:false,musicVolume:.55,motion:'auto'});
const COLORS=Object.freeze({punch:'#ffe074',slash:'#e9b5ff',electric:'#66e6ff',beam:'#8cf5d9',axe:'#9df4c8',flame:'#ff875f',missile:'#ffc36a',shot:'#fff09a',swarm:'#ffb7ee',dimension:'#b58bff',heal:'#90f4c2',guard:'#9acaff',parry:'#b6f3ff',dodge:'#c9c6ef',miss:'#bdb5cc',immune:'#bca1ff',execution:'#f9aad8',oni:'#d5a2ff',hypnosis:'#ff9de6',soul:'#7ae6d5',star:'#ffe8ac',dice:'#f5d2a8',sleep:'#bda8fa',petrify:'#a9cdbe',book:'#c99ae9',fright:'#e4d4ff',teeth:'#efe2ff',shark:'#9be7ee',heart:'#ffa9c7',dash:'#a2eee5',divine:'#fff3ba',crystal:'#ff91c7',support:'#d7beff'});
const CHARACTER_PROFILE=Object.freeze({eletric:'electric',john:'axe',sarck:'teeth',penxy:'dimension',cavaleiro:'guard',zikssy:'fright',elysh:'beam',ddx:'punch',p_ullys:'missile',stally:'punch',endrik:'shark',striker:'shot',sheriff:'shot',barn:'hypnosis',fonior:'soul',sam:'punch',chama:'flame',zuri:'heal',draktar:'slash',daztirry:'oni',mike:'shot',unicorn:'star',nully:'dice',rayyb:'sleep',rayvilin:'petrify',z_zus:'guard',alex:'swarm',karma:'heart',trucc:'dash',vaglar:'book',linx:'slash',zenneriam:'divine'});
const BASIC_PROFILE=Object.freeze({penxy:'slash',cavaleiro:'slash',zikssy:'slash',zuri:'star',rayyb:'star',rayvilin:'slash',z_zus:'punch'});
const ABILITY_PROFILE=Object.freeze({dimension:'dimension',fright:'fright',hypnosis:'hypnosis',starGift:'star',guardian:'guard',friendship:'heart',petrify:'petrify',sleepPowder:'sleep',hunt:'slash',deathBook:'book',fullHeal:'heal',healingAttack:'heal',presence:'divine'});
// Timbres e saídas são definidos pela arma, não pelo dano ou pela classe.
const CHARACTER_WEAPONS=Object.freeze({eletric:'lightning',john:'guitar-axe',sarck:'jaws',penxy:'spectral-claws',cavaleiro:'steel-blade',zikssy:'claws',elysh:'laser',ddx:'four-fists',p_ullys:'rocket',stally:'kick',endrik:'shark',striker:'rifle',sheriff:'revolver',barn:'hypnosis',fonior:'soul',sam:'boxing',chama:'fire',zuri:'harp-star',draktar:'hunting-blade',daztirry:'oni-blade',mike:'assault-rifle',unicorn:'star',nully:'dice',rayyb:'powder',rayvilin:'stone-blade',z_zus:'guardian',alex:'swarm',karma:'heart',trucc:'speed',vaglar:'grimoire',linx:'energy-blade',zenneriam:'presence'});
const ENTRY_STYLES=Object.freeze({
 COMMON:Object.freeze({rank:0,color:'#8fcae5',tone:293.66,duration:460,particles:4,name:'Comum',motif:'seal'}),
 RARE:Object.freeze({rank:1,color:'#91c49e',tone:329.63,duration:600,particles:7,name:'Raro',motif:'leaves'}),
 EPIC:Object.freeze({rank:2,color:'#ad98d1',tone:349.23,duration:740,particles:10,name:'Épico',motif:'runes'}),
 MYTHIC:Object.freeze({rank:3,color:'#ca9294',tone:392,duration:880,particles:14,name:'Mítico',motif:'flame'}),
 LEGENDARY:Object.freeze({rank:4,color:'#d8bf80',tone:440,duration:1020,particles:18,name:'Lendário',motif:'crown'}),
 SECRET:Object.freeze({rank:5,color:'#c1b0e8',tone:493.88,duration:1160,particles:23,name:'Secreto',motif:'eclipse'}),
 GOD:Object.freeze({rank:6,color:'#eee0b0',tone:523.25,duration:1320,particles:28,name:'Deus',motif:'cosmos'})
});
const DEATH_STYLES=Object.freeze({eletric:'sparks',john:'strings',sarck:'jaws',penxy:'rift',cavaleiro:'armor',zikssy:'shadows',elysh:'beam',ddx:'impact',p_ullys:'rocket',stally:'impact',endrik:'fin',striker:'cartridge',sheriff:'cartridge',barn:'spiral',fonior:'souls',sam:'gloves',chama:'embers',zuri:'petals',draktar:'claws',daztirry:'oni',mike:'cartridge',unicorn:'starfall',nully:'dice',rayyb:'dust',rayvilin:'stone',z_zus:'shield',alex:'swarm',karma:'heart',trucc:'afterimage',vaglar:'pages',linx:'shards',zenneriam:'constellation'});
const own=(obj,key)=>Object.prototype.hasOwnProperty.call(obj,key),clamp=(n,min,max)=>Math.min(max,Math.max(min,n));
function normalizePreferences(value={}){
 const source=value&&typeof value==='object'?value:{};
 const motion=typeof source.motion==='boolean'?(source.motion?'full':'reduced'):['auto','full','reduced'].includes(source.motion)?source.motion:DEFAULTS.motion;
 const volume=Number(source.volume),musicVolume=Number(source.musicVolume);
 return{muted:typeof source.muted==='boolean'?source.muted:DEFAULTS.muted,volume:Number.isFinite(volume)?clamp(volume,0,1):DEFAULTS.volume,musicMuted:typeof source.musicMuted==='boolean'?source.musicMuted:DEFAULTS.musicMuted,musicVolume:Number.isFinite(musicVolume)?clamp(musicVolume,0,1):DEFAULTS.musicVolume,motion};
}
function readPreferences(){try{return normalizePreferences(JSON.parse(globalThis.localStorage?.getItem(PREF_KEY)||'{}'));}catch{return{...DEFAULTS};}}
let prefs=readPreferences(),media=null,initialized=false,layer=null,canvas=null,ctx2d=null,raf=0,lastFrame=0,syntheticSeq=0;
let audio=null,master=null,compressor=null,noiseBuffer=null,unlocked=false,lastInteraction=0,lastProfile=null,playedCount=0,lastEntryRarity=null,lastDeathStyle=null;
const timers=new Set(),nodes=new Set(),announcements=new Set(),particles=[],voices=new Set(),cleanups=new Set(),seen=new WeakMap(),unitScenes=new WeakMap();
const hasDOM=()=>typeof document!=='undefined'&&typeof document.createElement==='function'&&!!document.body?.appendChild;
const reduced=()=>prefs.motion==='reduced'||prefs.motion==='auto'&&!!media?.matches;
const pageHidden=()=>typeof document!=='undefined'&&document.hidden===true;
const now=()=>globalThis.performance?.now?.()||Date.now();
function unit(s,uid){return s?.units?.find(u=>u.uid===uid)||null;}
function actorId(s,e,h={}){return unit(s,h.sourceUid||h.actorUid||e.actorUid)?.id||e.characterId||null;}
function targetUid(s,e,h={}){return h.targetUid||e.targetUid||s?.units?.find(u=>u.name===(h.targetName||e.targetName))?.uid||null;}
function profileFor(s,e,h={}){
 if(h.type==='heal'||e.type==='heal'||e.type==='full-heal')return'heal';
 if(h.type==='parry')return'parry';if(h.type==='dodge')return'dodge';
 if(['miss','duel-miss'].includes(h.type))return'miss';if(h.type==='immune')return'immune';if(h.type==='oni')return'oni';
 if(h.kind==='burn-damage')return'flame';if(h.kind==='pin-damage')return'axe';
 if(h.type==='daly-hit'||e.type==='daly-hit')return'crystal';
 if(e.type==='summon')return'divine';
 if(own(ABILITY_PROFILE,e.presentationAbility||''))return ABILITY_PROFILE[e.presentationAbility];
 if(h.instant){const native=CHARACTER_PROFILE[actorId(s,e,h)];return h.kind==='book'||e.book?'book':['teeth','shark','dice','petrify','shot'].includes(native)?native:'execution';}
 if(e.type==='fright')return'fright';
 if(e.type==='support'){
  const a=String(e.ability||'');if(/Bandeide|Brisa/i.test(a))return'heal';if(/Escudo|Fôlego/i.test(a))return'guard';if(/Sortudo/i.test(a))return'dice';if(/Morto Vivo/i.test(a))return'soul';return'support';
 }
 const id=actorId(s,e,h);return(e.type!=='ability'&&BASIC_PROFILE[id])||CHARACTER_PROFILE[id]||'slash';
}
function impacts(e){
 if(typeof G.eventImpacts==='function')return G.eventImpacts(e)||[];
 return e?.timeline?[...e.timeline,...(e.ticks||[])]:e?[...(e.hits||((e.targetUid||e.type==='daly-hit')?[e]:[])),...(e.reactions||[]),...(e.ticks||[])]:[];
}
function planEvent(s,e,options={}){
 if(!e)return[];
 const skipped=['wait','status-skip','pin-skip'].includes(e.type);
 let list=impacts(e).filter(h=>!skipped||h!==e);if(skipped&&!list.length)return[];
 if(!list.length&&e.type==='fright')list=(e.results||[]).map(r=>({targetUid:r.uid,type:r.scared?'ability':'miss'}));
 if(!list.length)list=[{targetUid:targetUid(s,e)||e.actorUid,type:e.type}];
 const step=Math.max(0,Number(G.CONFIG?.pacing?.feedback??2200)*.4),duration=Number(options.duration);
 const maxDelay=Number.isFinite(duration)?Math.max(0,duration-180):Infinity;
 return list.map((h,i)=>{
  const delayed=e.sequence?i*step:h.kind==='reaction'?240+i*50:h.kind==='pin-damage'||h.kind==='burn-damage'?360+i*60:e.type==='area'?60:i*75;
  const sourceUid=h.sourceUid||h.actorUid||e.actorUid||null;
  const sourceId=actorId(s,e,h),target=targetUid(s,e,h)||sourceUid;
  return Object.freeze({profile:profileFor(s,e,h),weapon:CHARACTER_WEAPONS[sourceId]||'steel-blade',sourceId,sourceUid,targetUid:target,targetId:unit(s,target)?.id||null,defeated:h.type==='defeat',delay:Math.min(delayed,maxDelay),index:i,type:h.type,critical:!!(h.critical?.critical||e.critical?.critical),reaction:h.kind==='reaction',instant:!!h.instant,amount:h.amount??h.damage??h.healed??0});
 });
}
function remember(s,e,replay){
 if(!s||typeof s!=='object')return true;
 let record=seen.get(s);if(!record){record={ids:new Set(),refs:new WeakSet()};seen.set(s,record);}
 if(e.id!==undefined&&e.id!==null){const key=String(e.id);if(!replay&&record.ids.has(key))return false;record.ids.add(key);if(record.ids.size>96)record.ids.delete(record.ids.values().next().value);}
 else if(e&&typeof e==='object'){if(!replay&&record.refs.has(e))return false;record.refs.add(e);}
 return true;
}
function schedule(fn,delay=0){const id=setTimeout(()=>{timers.delete(id);if(!pageHidden())fn();},Math.max(0,delay));timers.add(id);return id;}
function emitPreferences(){try{globalThis.dispatchEvent?.(new CustomEvent('goghos:presentation-preferences',{detail:getPreferences()}));}catch{}}
function applyMotion(){if(hasDOM()){document.documentElement?.classList?.toggle('goghos-motion-reduced',reduced());document.documentElement?.classList?.toggle('goghos-motion-full',prefs.motion==='full');}}
function onMotionChange(){if(reduced())clearVisuals();applyMotion();}
function getPreferences(){return{...prefs,reducedMotion:reduced(),audioUnlocked:unlocked};}
function setPreferences(value={}){
 prefs=normalizePreferences({...prefs,...value});try{globalThis.localStorage?.setItem(PREF_KEY,JSON.stringify(prefs));}catch{}
 if(master&&audio)master.gain.setTargetAtTime(prefs.muted?0:prefs.volume,audio.currentTime,.035);
 if(reduced())clearVisuals();applyMotion();emitPreferences();return getPreferences();
}
function ensureLayer(){
 if(!hasDOM())return false;if(layer?.isConnected)return true;
 layer=document.createElement('div');layer.id='goghos-presentation-layer';layer.className='presentation-fx-layer';layer.setAttribute('aria-hidden','true');
 canvas=document.createElement('canvas');canvas.className='presentation-fx-canvas';layer.appendChild(canvas);document.body.appendChild(layer);
 try{ctx2d=canvas.getContext('2d',{alpha:true});}catch{ctx2d=null;}resize();return true;
}
function resize(){if(!canvas||!ctx2d)return;const ratio=Math.min(2,globalThis.devicePixelRatio||1);canvas.width=Math.max(1,globalThis.innerWidth||1)*ratio;canvas.height=Math.max(1,globalThis.innerHeight||1)*ratio;ctx2d.setTransform(ratio,0,0,ratio,0,0);}
function pointFor(uid){
 if(!hasDOM()||!uid)return null;
 const name=String(uid),daly=name.startsWith('daly_'),side=daly?name.slice(5):null;
 const board=Array.from(document.querySelectorAll(daly?'[data-daly]':'[data-unit]')).filter(el=>daly?el.dataset.daly===side:el.dataset.unit===name);
 const focus=daly?Array.from(document.querySelectorAll('[data-focus-daly]')).filter(el=>el.dataset.focusDaly===side):focusElements(uid);
 // No celular o campo pode estar recolhido; a ação pertence à ficha ampliada visível.
 for(const el of [...board,...focus]){const point=pointFromElement(el);if(point)return point;}
 return null;
}
function centerPoint(){return{x:(globalThis.innerWidth||800)*.5,y:(globalThis.innerHeight||700)*.45,width:160,height:210,element:null};}
function pointFromElement(element){
 if(!element?.getBoundingClientRect)return null;const b=(element.querySelector?.('.card,.daly-emblem')||element).getBoundingClientRect();
 if(b.width<4||b.height<4||b.right<0||b.bottom<0||b.left>(globalThis.innerWidth||0)||b.top>(globalThis.innerHeight||0))return null;
 return{x:b.left+b.width*.5,y:b.top+b.height*.48,width:b.width,height:b.height,element};
}
function focusElements(uid){return hasDOM()?Array.from(document.querySelectorAll('[data-focus-unit]')).filter(el=>el.dataset.focusUnit===String(uid)):[];}
function animateCard(element,frames,duration=360){
 if(reduced()||!element||pageHidden())return false;
 const card=element.querySelector?.('.card')||element;if(typeof card.animate!=='function')return false;
 try{const animation=card.animate(frames,{duration,easing:'cubic-bezier(.2,.75,.25,1)',fill:'none'});
 const clear=()=>{animation.cancel();cleanups.delete(clear);};cleanups.add(clear);animation.onfinish=()=>{cleanups.delete(clear);animation.cancel();};return true;}catch{return false;}
}
function moveForAttack(item,source,target){
 if(!source||!target||source.element===target.element||['heal','oni','support','divine'].includes(item.profile)||item.type==='ability')return;
 const melee=['four-fists','boxing','kick','jaws','claws','spectral-claws','steel-blade','hunting-blade','oni-blade','energy-blade','stone-blade','guardian','speed'].includes(item.weapon);
 const dx=target.x-source.x,dy=target.y-source.y,length=Math.max(1,Math.hypot(dx,dy)),reach=melee?Math.min(length*.22,Math.max(30,source.width*.55),120):Math.min(12,source.width*.12);
 const x=dx/length*reach*(melee?1:-1),y=dy/length*reach*(melee?1:-1),angle=dx>=0?4:-4;
 const frames=[{transform:'translate(0,0) rotate(0)'},{transform:'translate('+(-x*.18)+'px,'+(-y*.18)+'px) rotate('+(-angle)+'deg)',offset:.18},{transform:'translate('+x+'px,'+y+'px) rotate('+angle+'deg) scale(1.04)',offset:.44},{transform:'translate(0,0) rotate(0)'}];
 animateCard(source.element,frames,melee?400:300);
 // A ficha ampliada espelha a ação real, sem disparar outro som ou impacto.
 for(const el of focusElements(item.sourceUid))if(el!==source.element&&pointFromElement(el))animateCard(el,frames,melee?400:300);
}
function rarityStyle(value){
 const key=typeof value==='string'?value:value?.class==='DEUS'?'GOD':value?.rarity||'COMMON';return ENTRY_STYLES[key]||ENTRY_STYLES.COMMON;
}
function entryPlan(value,options={}){
 const style=rarityStyle(value),rarity=Object.keys(ENTRY_STYLES).find(key=>ENTRY_STYLES[key]===style);
 return Object.freeze({rarity,...style,preview:options.kind==='preview',duration:options.kind==='preview'?Math.min(800,style.duration):style.duration});
}
function entrySound(style,preview=false){
 const quiet=preview ? .65 : 1,base=style.tone,rank=style.rank;
 tone(base,.2,{wave:'triangle',to:base*1.01,gain:.04*quiet});
 if(rank>=1)tone(base*1.5,.27,{delay:.055,gain:.026*quiet});
 if(rank>=2){tone(base*2,.3,{delay:.11,gain:.025*quiet});noise(.11,{filter:'highpass',frequency:3500,gain:.018*quiet});}
 if(rank>=3)tone(base*.5,.35,{wave:'triangle',delay:.035,to:base*.55,gain:.04*quiet});
 if(rank>=4)[1.25,1.5,2].forEach((ratio,i)=>tone(base*ratio,.4,{delay:.17+i*.055,gain:.019*quiet}));
 if(rank>=5){tone(87.31,.46,{wave:'triangle',to:130.81,gain:.045*quiet});noise(.28,{filter:'bandpass',frequency:500,gain:.027*quiet});}
 if(rank>=6)[3,4].forEach((ratio,i)=>tone(base*ratio,.52,{delay:.32+i*.05,gain:.018*quiet}));
}
function playEntry(value,element,options={}){
 if(!hasDOM()||pageHidden())return false;init();const point=pointFromElement(element);if(!point&&options.kind!=='announcement')return false;
 const style=entryPlan(value,options);lastEntryRarity=style.rarity;
 if(options.sound!==false)entrySound(style,style.preview||options.kind==='announcement');
 if(!point){
  const node=document.createElement('div'),safe=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  node.className='fx-entry-announcement fx-announcement-'+style.rarity.toLowerCase();node.style.cssText='--entry-color:'+style.color;
  node.innerHTML='<i>✧</i><span><strong>'+safe(typeof value==='object'?value.name||style.name:style.name)+'</strong><small>'+safe(style.name)+' · entrou em campo</small></span>';
  if(announcements.size>=2){const oldest=announcements.values().next().value;oldest.remove();nodes.delete(oldest);announcements.delete(oldest);}
  announcements.add(node);Array.from(announcements).forEach((n,i)=>n.style.setProperty?.('--entry-slot',i));addNode(node,760);return true;
 }
 const node=document.createElement('div');node.className='fx-entry fx-entry-'+style.rarity.toLowerCase()+(reduced()?' is-reduced':'')+(style.preview?' is-preview':'');
 const size=clamp(point.width*1.24,55,style.preview?240:310);
 node.style.cssText='left:'+point.x+'px;top:'+point.y+'px;width:'+size+'px;height:'+(size*1.35)+'px;--entry-color:'+style.color+';--entry-time:'+style.duration+'ms;--entry-rank:'+style.rank;
 node.innerHTML='<i class="fx-entry-seal"></i>'+(style.rank>=1?'<i class="fx-entry-orbit"></i>':'')+(style.rank>=2?'<i class="fx-entry-crown">'+svg(SHAPES[style.rank>=6?'divine':style.rank>=4?'star':style.rank===3?'flame':'crystal'])+'</i>':'')+(style.rank>=3?'<span class="fx-entry-runes">✧ · ◇ · ✧</span>':'')+(style.rank>=5?'<i class="fx-entry-eclipse"></i>':'');
 addNode(node,style.duration+80);
 if(!reduced()){
  burst(point,style.rank>=5?'divine':style.rank>=3?'star':style.rank>=1?'heal':'guard',Math.round(style.particles*(style.preview ? .6 : 1)));
  animateCard(element,[{opacity:0,transform:'translateY('+(10+style.rank*3)+'px) scale(.88)',filter:'brightness(1.6)'},{opacity:1,transform:'translateY(-3px) scale(1.025)',filter:'brightness(1.05)',offset:.65},{opacity:1,transform:'translateY(0) scale(1)',filter:'brightness(1)'}],Math.min(700,style.duration));
 }
 return true;
}
function deathPlan(value){
 const id=typeof value==='string'?value:value?.id,profile=CHARACTER_PROFILE[id]||'soul';
 return Object.freeze({style:DEATH_STYLES[id]||'souls',profile,color:COLORS[profile]||COLORS.soul,duration:['rift','souls','constellation','oni'].includes(DEATH_STYLES[id])?850:640});
}
function deathSound(info){
 const p=info.profile;
 if(['flame','electric','beam'].includes(p)){noise(.18,{filter:'bandpass',frequency:p==='flame'?650:2200,gain:.055});tone(196,.23,{to:49,gain:.04});}
 else if(['guard','axe','shot','petrify'].includes(p)){noise(.12,{filter:'highpass',frequency:1400,gain:.055});tone(220,.26,{wave:'triangle',to:73.42,gain:.045});}
 else if(['star','heal','heart','divine'].includes(p)){[659.25,493.88,329.63].forEach((f,i)=>tone(f,.23,{delay:i*.055,gain:.028}));}
 else{tone(174.61,.32,{wave:'triangle',to:58.27,gain:.055});noise(.18,{filter:'bandpass',frequency:750,gain:.035});}
}
function showDeath(item,point){
 if(!point||pageHidden()||!ensureLayer())return;
 const info=deathPlan(item.targetId);lastDeathStyle=info.style;deathSound(info);
 const node=document.createElement('div'),size=clamp(point.width*1.25,65,245);
 node.className='fx-death fx-death-'+info.style+(reduced()?' is-reduced':'');node.style.cssText='left:'+point.x+'px;top:'+point.y+'px;width:'+size+'px;height:'+(size*1.25)+'px;--death-color:'+info.color+';--death-time:'+info.duration+'ms';
 const shape=['pages','strings','armor','cartridge','stone','shards','dice'].includes(info.style)?info.style==='pages'?'book':info.style==='dice'?'dice':info.style==='armor'?'guard':info.style==='strings'?'axe':'crystal':info.style==='rift'?'dimension':info.style==='spiral'?'hypnosis':info.style==='embers'?'flame':info.style==='fin'?'shark':info.style==='oni'?'oni':info.profile;
 node.innerHTML='<span class="fx-death-sigil">'+svg(SHAPES[shape]||SHAPES.fright)+'</span>'+Array.from({length:reduced()?0:7},(_,i)=>'<i class="fx-death-fragment" style="--fragment:'+i+';--fragment-angle:'+(i*360/7)+'deg"></i>').join('');addNode(node,info.duration+80);
 const frames=[{opacity:1,transform:'translateY(0) scale(1)',filter:'saturate(.7)'},{opacity:.5,transform:'translateY(-8px) scale(.97)',filter:'saturate(0)',offset:.42},{opacity:0,transform:'translateY(18px) scale(.88)',filter:'saturate(0)'}];
 animateCard(point.element,frames,info.duration);
 for(const el of focusElements(item.targetUid))if(el!==point.element&&pointFromElement(el))animateCard(el,frames,info.duration);
 if(!reduced())burst(point,info.profile,16);
}
function syncUnits(s){
 if(!s||typeof s!=='object'||!Array.isArray(s.units)||!hasDOM()||pageHidden())return false;init();
 let scene=unitScenes.get(s);if(!scene){scene=new Map();unitScenes.set(s,scene);}
 let index=0;
 for(const u of s.units){
  const alive=!u.eliminated&&(u.hp>0||u.oniActive),old=scene.get(u.uid),point=alive?pointFor(u.uid):null;
  const firstLife=alive&&!old?.alive,record={alive,row:u.row,slot:u.slot,point:point?{x:point.x,y:point.y}:old?.point,life:(old?.life||0)+(firstLife?1:0),revealed:firstLife?false:!!old?.revealed,entryTimer:firstLife?null:old?.entryTimer};scene.set(u.uid,record);
  if(alive&&!record.revealed&&(!record.entryTimer||!timers.has(record.entryTimer))){
   const generation=record.life,uid=u.uid;
   record.entryTimer=schedule(()=>{
    const current=scene.get(uid);if(!current?.alive||current.life!==generation)return;current.entryTimer=null;
    const visible=pointFor(uid);current.revealed=playEntry(u,visible?.element,{kind:visible?'entry':'announcement'});
   },index++*180);
  }
  else if(alive&&old?.alive&&point&&old.point&&(old.row!==u.row||old.slot!==u.slot)){
   const dx=old.point.x-point.x,dy=old.point.y-point.y;
   animateCard(point.element,[{transform:'translate('+dx+'px,'+dy+'px)',opacity:.6},{transform:'translate(0,0)',opacity:1}],480);
  }
 }
 return true;
}
function addNode(node,lifetime=900){if(!ensureLayer())return null;layer.appendChild(node);nodes.add(node);schedule(()=>{node.remove();nodes.delete(node);announcements.delete(node);},lifetime);return node;}
const svg=(body)=>'<svg viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">'+body+'</svg>';
const SHAPES={
 punch:'<path d="M44 104C24 93 18 77 23 55c6-26 32-32 53-18 22-15 49-9 58 12 10 23-2 44-19 57l-5 34H56l-6-28-6-8Z" fill="currentColor" stroke="#2b0a40" stroke-width="7" stroke-linejoin="round"/><path d="M45 70c-11-14-25-12-28 2-4 15 9 27 30 34l18-15" fill="currentColor" stroke="#2b0a40" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/><path d="m54 113 59-1m-51 16h41M74 51v21m19-20v21m18-18v18" stroke="#9a5d58" stroke-width="5" stroke-linecap="round"/><path d="M44 45c10-10 23-10 31-5m14-1c12-4 24 1 30 12" stroke="#fff8ce" stroke-width="7" stroke-linecap="round"/>',
 slash:'<path d="M18 132C34 68 72 27 144 11 82 44 51 93 18 132Z" fill="currentColor"/><path d="M45 145C59 95 89 62 140 37 101 78 75 114 45 145Z" fill="#fff2dd"/>',
 electric:'<path d="m97 7-54 77 32-5-12 73 57-93-35 9L97 7Z" fill="currentColor" stroke="#25103e" stroke-width="7" stroke-linejoin="round"/><path d="m90 27-32 49 27-5-10 51" stroke="#f5ffff" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/><path d="m24 27 8 25-14 14 15 17m93 14 13 15-12 16 10 17" stroke="currentColor" stroke-width="7" stroke-linecap="round"/>',
 parry:'<path d="m80 12 50 18-5 54c-3 26-20 48-45 64-25-16-42-38-45-64l-5-54 50-18Z" fill="#9ef7d4" stroke="#26103d" stroke-width="7" stroke-linejoin="round"/><path d="m80 26 35 13-4 44c-2 20-14 37-31 49-18-12-29-29-31-49l-4-44 35-13Z" fill="#479a9f"/><path d="m54 77 17 21 37-42" stroke="#fff8c5" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/>',
 guard:'<path d="m80 14 48 17-5 53c-3 26-19 46-43 62-24-16-40-36-43-62l-5-53 48-17Z" fill="#243452" fill-opacity=".6" stroke="currentColor" stroke-width="5"/><path d="M80 34v83m-30-50h60" stroke="currentColor" stroke-width="6"/>',
 heal:'<path d="M65 30h30v35h35v30H95v35H65V95H30V65h35V30Z" fill="currentColor" stroke="#e7fff5" stroke-width="3"/><path d="m21 21 4 11 11 4-11 4-4 11-4-11-11-4 11-4Zm117 83 3 9 9 3-9 3-3 9-3-9-9-3 9-3Z" fill="#fff3cf"/>',
 flame:'<path d="m87 6 9 33 17-12-2 31 24-8-9 35 21 22-31 39-67-6-31-34 25-29-11-20 26 6 5-30 14 12L87 6Z" fill="currentColor" stroke="#3c1045" stroke-width="6" stroke-linejoin="round"/><path d="m83 51 8 25 17-6-11 26 17 13-28 26-34-10-9-22 24-8-2-25 13 9 5-28Z" fill="#fff3a1"/><path d="m41 30-8 17-14-4 10-17Zm82-20 8 17-12 9-5-15Z" fill="#ffb5b7" stroke="#3c1045" stroke-width="4"/>',
 dimension:'<ellipse cx="80" cy="80" rx="40" ry="65" stroke="currentColor" stroke-width="8"/><ellipse cx="80" cy="80" rx="29" ry="53" stroke="#f5c3ff" stroke-width="3" stroke-dasharray="6 9"/><path d="M17 63c33-20 93-21 126 1M16 101c34 19 94 18 129-3" stroke="currentColor" stroke-width="3"/><ellipse cx="80" cy="80" rx="16" ry="43" fill="#201633" fill-opacity=".8"/>',
 axe:'<path d="m51 132 60-111" stroke="#fff0bf" stroke-width="12" stroke-linecap="round"/><path d="m83 24 45 2 19 34-36 24-27-19 13-17Z" fill="currentColor" stroke="#faffed" stroke-width="4"/><path d="m31 116 26 15-11 19-26-15Z" fill="#b8b18b"/>',
 missile:'<path d="m51 94 43-61 26-7 9 25-40 64-38-21Z" fill="#fff2d0" stroke="currentColor" stroke-width="5"/><path d="m50 96-23 1 8 23 20-4m29 0 6 19 15-18-9-18" fill="currentColor"/><path d="m46 119-23 26 35-17Z" fill="#ff9b6d"/>',
 shot:'<path d="M13 80h91" stroke="currentColor" stroke-width="9" stroke-linecap="round"/><path d="m102 50 40 30-40 30 9-30-9-30Z" fill="#fff7d1"/><path d="M16 57h39M25 105h40" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>',
 teeth:'<path d="M19 58c37-26 83-26 123 0-3 50-20 77-62 77S24 108 19 58Z" fill="#251d3e" stroke="currentColor" stroke-width="5"/><path d="m27 58 14 28 11-35 17 31 13-34 13 34 14-31 10 36 16-29" fill="#fff1d6"/><path d="m35 108 17-17 14 27 15-24 13 24 13-27 17 16" fill="#fff1d6"/>',
 shark:'<path d="M16 108c16-30 47-33 63-84l18 51c22 2 38 13 48 33-32-15-90-15-129 0Z" fill="currentColor" stroke="#e9fffb" stroke-width="4"/><path d="m28 112 20-11 16 14 17-15 18 15 18-12 13 8" stroke="#fff3d5" stroke-width="4"/>',
 heart:'<path d="M80 137 25 81C-2 49 41 12 80 49c39-37 82 0 55 32l-55 56Z" fill="currentColor" stroke="#ffe7ef" stroke-width="4"/><path d="M45 49c-14 1-19 12-13 24" stroke="#fff4ef" stroke-width="6" stroke-linecap="round"/>',
 star:'<path d="m80 10 18 44 48 5-36 32 11 47-41-25-41 25 11-47-36-32 48-5 18-44Z" fill="currentColor" stroke="#fff8de" stroke-width="4"/><path d="m61 74 11 10 26-24" stroke="#9e6f83" stroke-width="5" stroke-linecap="round"/>',
 dice:'<rect x="30" y="30" width="100" height="100" rx="20" fill="#382c47" stroke="currentColor" stroke-width="7"/><g fill="#fff2cf"><circle cx="53" cy="53" r="7"/><circle cx="107" cy="53" r="7"/><circle cx="80" cy="80" r="7"/><circle cx="53" cy="107" r="7"/><circle cx="107" cy="107" r="7"/></g>',
 sleep:'<path d="M54 26h55L57 78h52M81 94h38l-38 35h38" stroke="currentColor" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/><path d="M27 38c-19 30-7 75 24 84-37 3-51-13-51-39 0-24 10-36 27-45Z" fill="#ead5ff"/>',
 petrify:'<path d="m51 28 50-9 31 44-9 59-53 22-43-40 5-49 19-27Z" fill="#556c65" stroke="currentColor" stroke-width="5"/><path d="m79 21-14 43 30 9-19 28 11 37m-53-82 31 8m30 9 35-10m-55 38-46 2" stroke="#d0e4d4" stroke-width="4"/>',
 book:'<path d="M80 35C59 17 26 23 16 29v99c17-10 46-10 64 2 18-12 47-12 64-2V29c-10-6-43-12-64 6Z" fill="#2c203f" stroke="currentColor" stroke-width="5"/><path d="M80 36v92M31 49l32 4m-32 16 31 3m37-19 30-4m-29 23 29-3" stroke="#e9d2ff" stroke-width="4"/>',
 crystal:'<path d="m79 10 47 53-29 78-41 5-24-77L79 10Z" fill="currentColor" stroke="#ffdfeb" stroke-width="5"/><path d="m79 10 8 64 39-11M32 69l55 5 10 67" stroke="#ffe6f1" stroke-width="4"/>',
 oni:'<path d="M35 22 21 56l28 22m76-56 14 34-28 22" stroke="currentColor" stroke-width="11" stroke-linejoin="round"/><path d="m42 67 38-21 38 21-10 53-28 23-28-23-10-53Z" fill="#352347" stroke="currentColor" stroke-width="5"/><path d="m54 82 17 7m35-7-17 7m-26 26 17 9 17-9" stroke="#ffe8d9" stroke-width="7"/>',
 fright:'<path d="M29 100c-4-76 105-76 102 0l-1 37-21-16-17 19-20-19-22 17-21-20V100Z" fill="currentColor" fill-opacity=".9"/><path d="m49 73 16 13m46-13L95 86M70 108l11-8 13 8" stroke="#3b2854" stroke-width="8" stroke-linecap="round"/>',
 divine:'<path d="m80 8 12 44 34-30-17 43 44 15-44 12 17 42-34-27-12 45-12-45-36 27 18-42L7 80l43-15-18-43 36 30L80 8Z" fill="currentColor"/><circle cx="80" cy="80" r="23" fill="#fff9dd" stroke="#dcb4e8" stroke-width="5"/>'
};
// Desenhos de impacto próprios: contorno e planos de cor seguem a interface cartoon.
SHAPES.beam='<path d="m81 11 9 45 39-26-25 39 45 10-45 11 25 39-39-25-9 45-12-45-39 25 26-39-45-11 45-10-26-39 39 26 12-45Z" fill="currentColor" stroke="#26103d" stroke-width="5" stroke-linejoin="round"/><circle cx="80" cy="80" r="24" fill="#f6fff1" stroke="#429f9b" stroke-width="5"/><path d="M80 39v15m0 52v15M39 80h15m52 0h15" stroke="#fffef2" stroke-width="5" stroke-linecap="round"/>';

SHAPES.swarm='<g stroke="currentColor" stroke-width="4" fill="#37283f"><path d="m44 18 15 9v18l-15 9-15-9V27Zm69 26 15 9v18l-15 9-15-9V53ZM69 91l15 9v18l-15 9-15-9v-18Z"/></g><g fill="#fff2cf"><ellipse cx="44" cy="34" rx="7" ry="11"/><ellipse cx="113" cy="60" rx="7" ry="11"/><ellipse cx="69" cy="107" rx="7" ry="11"/></g><path d="M22 70 9 91m112 8 21 17M75 37l7-18" stroke="currentColor" stroke-width="5" stroke-linecap="round"/>';
SHAPES.hypnosis='<path d="M10 81c32-49 105-48 140 0-35 49-108 49-140 0Z" stroke="currentColor" stroke-width="6" fill="#332345" fill-opacity=".7"/><path d="M91 54c-35-18-55 37-21 50 27 11 40-30 16-38-18-6-24 19-10 23" stroke="#f6c6ff" stroke-width="6" stroke-linecap="round"/>';
SHAPES.soul=SHAPES.fright;SHAPES.support=SHAPES.star;SHAPES.execution=SHAPES.slash;SHAPES.immune=SHAPES.guard;SHAPES.dash=SHAPES.slash;
function mark(point,profile,critical=false){
 if(!point||!ensureLayer())return;
 const node=document.createElement('div'),size=clamp(point.width*1.4,76,critical?220:180);
 node.className='fx-construct fx-comic fx-'+profile+(critical?' is-critical':'')+(reduced()?' is-reduced':'');
 node.style.cssText='left:'+point.x+'px;top:'+point.y+'px;width:'+size+'px;height:'+size+'px;--fx-color:'+(COLORS[profile]||COLORS.slash);
 const halo='<path d="m80 8 11 37 28-24-4 36 37-4-29 24 28 23-38-2 6 38-29-25-12 39-11-38-30 25 7-38-37 3 28-25-29-23 37 3-5-37 30 25 11-38Z" fill="currentColor"/>';
 node.innerHTML='<span class="fx-impact-halo">'+svg(halo)+'</span><span class="fx-impact-art">'+svg(SHAPES[profile]||SHAPES.slash)+'</span><span class="fx-impact-splinters">'+[-105,-30,35,115,175].map(a=>'<i style="--spoke:'+a+'deg"></i>').join('')+'</span>';addNode(node,reduced()?450:1100);
 if(!reduced())burst(point,profile,critical?22:14);
 pulse(point.element,profile);
}
function pulse(element,profile){
 if(!element?.classList)return;const cls=profile==='heal'?'fx-card-heal':['parry','guard','immune'].includes(profile)?'fx-card-guard':profile==='dodge'?'fx-card-dodge':'fx-card-impact';
 element.classList.remove(cls);void element.offsetWidth;element.classList.add(cls);
 const clear=()=>{element.classList.remove(cls);cleanups.delete(clear);};cleanups.add(clear);schedule(clear,620);
}
function projectile(source,target,profile){
 if(reduced()||!source||!target||source===target||!ensureLayer())return;
 const dx=target.x-source.x,dy=target.y-source.y,distance=Math.hypot(dx,dy);if(distance<30)return;
 const charge=document.createElement('div');charge.className='fx-source-charge fx-source-'+profile;charge.style.cssText='left:'+source.x+'px;top:'+source.y+'px;--fx-color:'+(COLORS[profile]||COLORS.slash);addNode(charge,420);
 if(['punch','slash','dash','flame','teeth'].includes(profile)){
  const streak=document.createElement('div');streak.className='fx-direction-streak fx-streak-'+profile;streak.style.cssText='left:'+source.x+'px;top:'+source.y+'px;width:'+Math.max(20,distance-22)+'px;--fx-color:'+(COLORS[profile]||COLORS.slash)+';--flight-angle:'+(Math.atan2(dy,dx)*180/Math.PI)+'deg';streak.innerHTML='<i></i><i></i><i></i>';addNode(streak,400);return;
 }
 if(['electric','beam','hypnosis'].includes(profile)){
  const p=26,left=Math.min(source.x,target.x)-p,top=Math.min(source.y,target.y)-p,w=Math.abs(dx)+p*2,h=Math.abs(dy)+p*2,sx=source.x-left,sy=source.y-top,tx=target.x-left,ty=target.y-top;
  const path=document.createElement('div');path.className='fx-link fx-link-'+profile;path.style.cssText='left:'+left+'px;top:'+top+'px;width:'+w+'px;height:'+h+'px;--fx-color:'+COLORS[profile];
  const d=profile==='electric'?'M'+sx+' '+sy+' L'+(sx+dx*.3-12)+' '+(sy+dy*.3+9)+' L'+(sx+dx*.52+14)+' '+(sy+dy*.52-12)+' L'+(sx+dx*.74-9)+' '+(sy+dy*.74+8)+' L'+tx+' '+ty:'M'+sx+' '+sy+' Q'+(sx+dx*.5+30)+' '+(sy+dy*.5-30)+' '+tx+' '+ty;
  path.innerHTML='<svg viewBox="0 0 '+w+' '+h+'"><path class="fx-link-ink" d="'+d+'" pathLength="1"/><path d="'+d+'" pathLength="1"/><path class="fx-link-core" d="'+d+'" pathLength="1"/></svg>';addNode(path,550);return;
 }
 if(!['shot','missile','axe','swarm','heart','star','shark'].includes(profile))return;
 const node=document.createElement('div');node.className='fx-projectile fx-projectile-'+profile;node.style.cssText='left:'+source.x+'px;top:'+source.y+'px;--fx-color:'+COLORS[profile]+';--travel-x:'+dx+'px;--travel-y:'+dy+'px;--flight-angle:'+(Math.atan2(dy,dx)*180/Math.PI)+'deg';node.innerHTML='<span class="fx-projectile-tail"></span>'+svg(SHAPES[profile]||SHAPES.star);addNode(node,520);
}
function burst(point,profile,count){
 if(reduced()||!ctx2d)return;const color=COLORS[profile]||COLORS.slash;
 for(let i=0;i<count&&particles.length<160;i++){const angle=Math.random()*Math.PI*2,speed=45+Math.random()*155;particles.push({x:point.x,y:point.y,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,life:.45+Math.random()*.4,total:.85,size:2+Math.random()*4,color,shape:['heal','star','divine','support'].includes(profile)?'star':profile==='flame'?'ember':'spark',angle,spin:(Math.random()-.5)*9});}
 if(!raf){lastFrame=now();raf=requestAnimationFrame(frame);}
}
function drawStar(ctx,x,y,r){ctx.beginPath();for(let i=0;i<8;i++){const a=i*Math.PI/4- Math.PI/2,rad=i%2?r*.35:r;ctx.lineTo(x+Math.cos(a)*rad,y+Math.sin(a)*rad);}ctx.closePath();ctx.fill();}
function frame(t){
 raf=0;if(!ctx2d||pageHidden()||reduced()){particles.length=0;return;}
 const dt=Math.min(.04,Math.max(.001,(t-lastFrame)/1000));lastFrame=t;ctx2d.clearRect(0,0,innerWidth,innerHeight);ctx2d.save();ctx2d.globalCompositeOperation='lighter';
 for(let i=particles.length-1;i>=0;i--){const p=particles[i];p.life-=dt;if(p.life<=0){particles.splice(i,1);continue;}p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=(p.shape==='ember'?-90:90)*dt;p.angle+=p.spin*dt;ctx2d.globalAlpha=Math.min(1,p.life*2);ctx2d.fillStyle=p.color;ctx2d.strokeStyle=p.color;ctx2d.lineWidth=p.size*.55;
  if(p.shape==='star')drawStar(ctx2d,p.x,p.y,p.size);else if(p.shape==='ember'){ctx2d.beginPath();ctx2d.arc(p.x,p.y,p.size*.7,0,Math.PI*2);ctx2d.fill();}else{ctx2d.beginPath();ctx2d.moveTo(p.x,p.y);ctx2d.lineTo(p.x-p.vx*.038,p.y-p.vy*.038);ctx2d.stroke();}
 }
 ctx2d.restore();if(particles.length)raf=requestAnimationFrame(frame);else ctx2d.clearRect(0,0,innerWidth,innerHeight);
}
function createAudio(){
 if(audio)return audio;const Audio=globalThis.AudioContext||globalThis.webkitAudioContext;if(!Audio)return null;
 try{audio=new Audio();master=audio.createGain();master.gain.value=prefs.muted?0:prefs.volume;compressor=audio.createDynamicsCompressor();compressor.threshold.value=-18;compressor.ratio.value=4;master.connect(compressor);compressor.connect(audio.destination);noiseBuffer=audio.createBuffer(1,audio.sampleRate*.45,audio.sampleRate);const channel=noiseBuffer.getChannelData(0);for(let i=0;i<channel.length;i++)channel[i]=(Math.random()*2-1)*(1-i/channel.length);return audio;}catch{audio=null;return null;}
}
function unlockAudio(){
 if(pageHidden())return Promise.resolve(false);const a=createAudio();if(!a)return Promise.resolve(false);
 try{return Promise.resolve(a.state==='suspended'?a.resume():undefined).then(()=>{if(audio!==a)return false;unlocked=a.state==='running';emitPreferences();return unlocked;}).catch(()=>false);}catch{return Promise.resolve(false);}
}
function connectVoice(source,gain,filter){source.connect(filter||gain);if(filter)filter.connect(gain);gain.connect(master);voices.add(source);source.onended=()=>{voices.delete(source);try{source.disconnect();gain.disconnect();filter?.disconnect();}catch{}};}
function tone(frequency,duration=.12,options={}){
 if(!audio||audio.state!=='running'||prefs.muted||prefs.volume===0||pageHidden()||voices.size>32)return;
 try{const start=audio.currentTime+(options.delay||0),osc=audio.createOscillator(),gain=audio.createGain();osc.type=options.wave||'sine';osc.frequency.setValueAtTime(Math.max(20,frequency),start);osc.frequency.exponentialRampToValueAtTime(Math.max(20,options.to||frequency*.75),start+duration);gain.gain.setValueAtTime(.0001,start);gain.gain.exponentialRampToValueAtTime(options.gain||.12,start+.007);gain.gain.exponentialRampToValueAtTime(.0001,start+duration);connectVoice(osc,gain);osc.start(start);osc.stop(start+duration+.02);}catch{}
}
function noise(duration=.12,options={}){
 if(!audio||audio.state!=='running'||!noiseBuffer||prefs.muted||prefs.volume===0||pageHidden()||voices.size>32)return;
 try{const start=audio.currentTime+(options.delay||0),source=audio.createBufferSource(),gain=audio.createGain(),filter=audio.createBiquadFilter();source.buffer=noiseBuffer;filter.type=options.filter||'lowpass';filter.frequency.value=options.frequency||1400;gain.gain.setValueAtTime(.0001,start);gain.gain.exponentialRampToValueAtTime(options.gain||.14,start+.006);gain.gain.exponentialRampToValueAtTime(.0001,start+duration);connectVoice(source,gain,filter);source.start(start);source.stop(start+duration+.01);}catch{}
}
function sound(profile,critical=false){
 const strong=critical?1.2:1;
 if(['parry','guard','immune'].includes(profile)){tone(860,.16,{wave:'triangle',to:500,gain:.08*strong});tone(1320,.09,{gain:.035});return;}
 if(['dodge','dash','miss'].includes(profile)){noise(.16,{filter:'highpass',frequency:2300,gain:.045});tone(270,.1,{to:620,gain:.025});return;}
 if(['heal','star','support','heart'].includes(profile)){[523.25,659.25,783.99].forEach((f,i)=>tone(f,.23,{delay:i*.055,gain:.055}));return;}
 if(['electric','beam'].includes(profile)){noise(.19,{filter:'bandpass',frequency:3000,gain:.08});tone(165,.18,{wave:'sawtooth',to:580,gain:.045});tone(1100,.08,{to:280,gain:.045});return;}
 if(profile==='crystal'){noise(.1,{frequency:1800,gain:.09});tone(880,.3,{to:440,gain:.07});tone(1320,.24,{delay:.035,to:660,gain:.045});return;}
 if(profile==='flame'){noise(.27,{frequency:1100,gain:.13});tone(85,.21,{to:40,gain:.07});return;}
 if(profile==='missile'){noise(.32,{frequency:600,gain:.18*strong});tone(95,.24,{to:32,gain:.13});return;}
 if(['dimension','hypnosis','soul','book'].includes(profile)){tone(174,.4,{wave:'triangle',to:320,gain:.08});tone(261,.45,{to:130,gain:.065});noise(.22,{filter:'bandpass',frequency:700,gain:.045});return;}
 if(['sleep','fright'].includes(profile)){tone(440,.32,{to:294,gain:.055});tone(659,.3,{delay:.075,to:330,gain:.04});return;}
 if(['divine','oni'].includes(profile)){[196,294,392,587].forEach((f,i)=>tone(f,.55,{wave:'triangle',delay:i*.065,to:f*1.5,gain:.055}));noise(.27,{frequency:500,gain:.07});return;}
 if(profile==='petrify'){noise(.24,{frequency:900,gain:.13});tone(170,.16,{wave:'triangle',to:60,gain:.09});return;}
 if(profile==='dice'){[0,.04,.085].forEach((delay,i)=>noise(.035,{delay,filter:'highpass',frequency:1600+i*500,gain:.075}));tone(620,.12,{delay:.1,to:420,gain:.05});return;}
 if(profile==='shot'){noise(.065,{frequency:2400,gain:.14});tone(145,.1,{wave:'triangle',to:55,gain:.07});return;}
 if(profile==='axe'){[110,164.81,220].forEach((f,i)=>tone(f,.23,{wave:'triangle',delay:i*.014,to:f*.94,gain:.055}));noise(.09,{frequency:2200,gain:.1});return;}
 noise(.1,{frequency:profile==='slash'||profile==='axe'?2400:650,gain:.13*strong});tone(profile==='teeth'||profile==='shark'?105:155,.14,{wave:'triangle',to:45,gain:.13*strong});
}
function weaponSound(weapon,profile,critical=false){
 const strong=critical?1.15:1;
 if(['parry','guard','dodge','miss','immune','heal','oni'].includes(profile)){sound(profile,critical);return;}
 if(profile==='shot'){
  if(weapon==='rifle'){noise(.035,{frequency:3800,gain:.12*strong});tone(82,.14,{wave:'triangle',to:32,gain:.1});noise(.085,{delay:.055,filter:'highpass',frequency:1700,gain:.025});return;}
  if(weapon==='revolver'){noise(.05,{frequency:2600,gain:.1*strong});tone(147,.12,{to:55,gain:.08});tone(990,.055,{delay:.13,to:700,gain:.018});return;}
  if(weapon==='assault-rifle'){noise(.045,{filter:'highpass',frequency:2800,gain:.09*strong});tone(165,.085,{wave:'triangle',to:55,gain:.07});noise(.025,{delay:.055,filter:'bandpass',frequency:1900,gain:.028});return;}
 }
 if(profile==='punch'){
  noise(weapon==='kick'?.11:.065,{frequency:weapon==='boxing'?480:760,gain:.1*strong});tone(weapon==='kick'?100:weapon==='four-fists'?180:135,.115,{wave:'triangle',to:42,gain:.11*strong});return;
 }
 if(profile==='slash'&&['spectral-claws','energy-blade','stone-blade','hunting-blade','steel-blade','oni-blade','claws'].includes(weapon)){
  const magical=['spectral-claws','energy-blade','oni-blade'].includes(weapon);
  noise(.14,{filter:'highpass',frequency:weapon==='steel-blade'?3200:1900,gain:.065*strong});
  tone(magical?392:1244,.13,{wave:magical?'sine':'triangle',to:magical?196:830,gain:.038});return;
 }
 if(profile==='swarm'){[0,.04,.09].forEach((delay,i)=>tone(190+i*36,.14,{wave:'sawtooth',delay,to:140,gain:.023}));noise(.13,{filter:'bandpass',frequency:1200,gain:.05});return;}
 if(profile==='teeth'||profile==='shark'){noise(.12,{frequency:850,gain:.08});tone(profile==='shark'?73.42:110,.21,{wave:'triangle',to:36.7,gain:.095});return;}
 sound(profile,critical);
}
function showImpact(item){
 if(!ensureLayer()||pageHidden())return;lastProfile=item.profile;
 const target=pointFor(item.targetUid),source=pointFor(item.sourceUid),point=target||(item.profile==='divine'?source||centerPoint():null);
 weaponSound(item.weapon,item.profile,item.critical);if(!point)return;
 moveForAttack(item,source,target);
 if(source&&target&&!['heal','parry','dodge','immune','miss','oni'].includes(item.profile))projectile(source,target,item.profile);
 if(item.profile==='dimension'&&source)mark(source,'dimension');
 const wait=reduced()?0:['shot','missile','axe','swarm','heart','star','shark'].includes(item.profile)&&source&&target?130:0;
 if(wait)schedule(()=>mark(point,item.profile,item.critical||item.instant),wait);else mark(point,item.profile,item.critical||item.instant);
 for(const el of focusElements(item.targetUid))if(el!==point.element&&pointFromElement(el))pulse(el,item.profile);
 if(item.defeated)schedule(()=>showDeath(item,point),wait+210);
}
function playEvent(s,e,options={}){
 if(!e||!hasDOM()||pageHidden()||!remember(s,e,options.replay))return false;
 init();const plan=planEvent(s,e,options);if(!plan.length)return false;playedCount++;
 for(const item of plan)schedule(()=>showImpact(item),item.delay);return true;
}
function playAbility(s,choice={}){
 const e={id:'presentation-'+(++syntheticSeq),type:'ability',actorUid:choice.actorUid,targetUid:choice.targetUid,presentationAbility:choice.type,ability:choice.ability};
 // Results belong to the engine. Without them, show only the caster's animation.
 if(choice.type==='fright'&&Array.isArray(choice.results)){e.type='fright';e.results=choice.results;}
 return playEvent(s,e,choice);
}
function interaction(kind='click',element=null){
 if(!hasDOM()||pageHidden())return false;const t=now();if(t-lastInteraction<(kind==='hover'?85:30))return false;lastInteraction=t;
 const sounds={click:[470,.055],select:[620,.085],card:[360,.09],confirm:[740,.12],open:[520,.1],navigate:[523,.1],equip:[660,.14],cancel:[300,.08],pause:[330,.08],error:[150,.15],coin:[1040,.13],purchase:[830,.13],shuffle:[270,.06]};
 if(kind==='chest'||kind==='reward'){sound('star');tone(1046,.35,{delay:.12,gain:.07});}else{const data=sounds[kind]||sounds.click;tone(data[0],data[1],{wave:'triangle',to:kind==='cancel'||kind==='error'?data[0]*.6:data[0]*1.3,gain:kind==='hover'?.025:.055});if(kind==='equip')tone(880,.18,{delay:.045,gain:.035});if(kind==='shuffle')noise(.1,{filter:'highpass',frequency:1800,gain:.045});}
 if(element&&['select','coin','reward','chest'].includes(kind)){
  const b=element.getBoundingClientRect?.();
  if(b&&b.width>0&&kind==='select'){
   // Escolher um modo é uma interação pequena, sem uma estrela cobrindo seus comandos.
   const glint=document.createElement('div');glint.className='fx-control-glint';glint.style.cssText='left:'+b.left+'px;top:'+b.top+'px;width:'+b.width+'px;height:'+b.height+'px';addNode(glint,240);
  }else if(b&&b.width>0)mark({x:b.left+b.width*.5,y:b.top+b.height*.5,width:Math.min(b.width,80),height:b.height,element},'support');
 }
 return true;
}
function playResult(result='victory'){
 if(!hasDOM()||pageHidden())return false;init();const victory=result==='victory';
 const notes=victory?[392,493.88,587.33,783.99]:result==='draw'?[392,440,392]:[392,329.63,261.63,196];notes.forEach((f,i)=>tone(f,.44,{delay:i*.12,gain:.075,wave:'triangle'}));
 if(victory){mark(centerPoint(),'divine',true);if(!reduced())for(let i=0;i<4;i++)schedule(()=>burst({x:innerWidth*(.24+i*.17),y:innerHeight*.28},'star',14),i*130);}return true;
}
function clearVisuals(){
 if(raf&&typeof cancelAnimationFrame==='function')cancelAnimationFrame(raf);raf=0;particles.length=0;
 for(const node of nodes)node.remove();nodes.clear();announcements.clear();for(const clear of [...cleanups])clear();
 if(ctx2d&&canvas)ctx2d.clearRect(0,0,canvas.width,canvas.height);
}
function stop(){for(const id of timers)clearTimeout(id);timers.clear();clearVisuals();for(const voice of voices){try{voice.stop();}catch{}}voices.clear();}
function onGesture(event){if(event?.isTrusted===false)return;unlockAudio();}
function onVisibility(){if(pageHidden())stop();}
function init(){
 if(!hasDOM())return false;if(initialized){ensureLayer();return true;}initialized=true;
 try{media=globalThis.matchMedia?.('(prefers-reduced-motion: reduce)')||null;media?.addEventListener?.('change',onMotionChange);}catch{}
 document.addEventListener('pointerdown',onGesture,{capture:true,passive:true});document.addEventListener('keydown',onGesture,{capture:true,passive:true});document.addEventListener('visibilitychange',onVisibility);
 globalThis.addEventListener?.('resize',resize,{passive:true});ensureLayer();applyMotion();return true;
}
function destroy(){
 stop();if(hasDOM()){document.removeEventListener('pointerdown',onGesture,true);document.removeEventListener('keydown',onGesture,true);document.removeEventListener('visibilitychange',onVisibility);}globalThis.removeEventListener?.('resize',resize);media?.removeEventListener?.('change',onMotionChange);layer?.remove();layer=canvas=ctx2d=null;initialized=false;
 if(audio){try{audio.close();}catch{}audio=master=compressor=noiseBuffer=null;}unlocked=false;
}
function getDebugState(){return{initialized,audioUnlocked:unlocked,audioState:audio?.state||'unavailable',activeParticles:particles.length,activeEffects:nodes.size,activeAnnouncements:announcements.size,queuedEffects:timers.size,activeVoices:voices.size,playedEvents:playedCount,lastProfile,lastEntryRarity,lastDeathStyle,reducedMotion:reduced()};}
G.PresentationFX=Object.freeze({init,interaction,playEvent,playAbility,playResult,playEntry,syncUnits,stop,destroy,unlockAudio,getPreferences,setPreferences,getDebugState,planEvent,profileFor,entryPlan,deathPlan,normalizePreferences,CHARACTER_PROFILE,CHARACTER_WEAPONS,ENTRY_STYLES,DEATH_STYLES});
})(globalThis.GOGHOS=globalThis.GOGHOS||{});
