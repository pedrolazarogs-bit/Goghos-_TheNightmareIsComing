// Trilha instrumental local: apresentação independente do estado e das regras da partida.
(function(G){
'use strict';
const TRACKS=Object.freeze({menu:{src:'assets/menu-v036/menu.mp3',loop:true},combat:{src:'assets/music/combat.mp3',loop:true},victory:{src:'assets/music/victory.mp3',loop:false},defeat:{src:'assets/music/defeat.mp3',loop:false}});
const DEFAULTS=Object.freeze({muted:false,volume:.38,musicMuted:false,musicVolume:.55});
const clamp=(value,fallback)=>{const n=Number(value);return Number.isFinite(n)?Math.min(1,Math.max(0,n)):fallback;};
const normalize=(value={})=>({muted:typeof value.muted==='boolean'?value.muted:DEFAULTS.muted,volume:clamp(value.volume,DEFAULTS.volume),musicMuted:typeof value.musicMuted==='boolean'?value.musicMuted:DEFAULTS.musicMuted,musicVolume:clamp(value.musicVolume,DEFAULTS.musicVolume)});
let initialized=false,unlocked=false,context='silent',battlePaused=false,prefs={...DEFAULTS},current=null,timer=null,lastError=null,playCount=0;
const records=new Set();
const hidden=()=>typeof document!=='undefined'&&document.hidden===true;
const clock=()=>globalThis.performance?.now?.()??Date.now();
const level=()=>prefs.muted||prefs.musicMuted?0:prefs.volume*prefs.musicVolume*(context==='combat'&&battlePaused ? .3 : 1);
const allowed=()=>initialized&&unlocked&&!hidden()&&level()>0;
function volume(record,value){record.volume=clamp(value,0);try{record.audio.volume=record.volume;}catch{}}
function cancelTimer(){if(timer!==null){clearTimeout(timer);timer=null;}}
function pause(record){record.token++;record.pending=false;record.playing=false;try{record.audio.pause();}catch{}}
function release(record){
 if(!record||!records.has(record))return;
 pause(record);record.audio.onended=null;record.audio.onerror=null;
 try{record.audio.removeAttribute?.('src');record.audio.load?.();}catch{}
 records.delete(record);if(current===record)current=null;
}
function tick(){
 timer=null;const time=clock();let moving=false;
 for(const record of [...records]){
  if(!record.fade)continue;
  const f=record.fade,p=Math.min(1,Math.max(0,(time-f.at)/f.duration));
  volume(record,f.from+(f.to-f.from)*p);
  if(p<1)moving=true;else{record.fade=null;if(record!==current&&f.to===0)release(record);}
 }
 if(moving)timer=setTimeout(tick,30);
}
function fade(record,target,duration=400){
 if(!records.has(record))return;
 target=clamp(target,0);
 if(record.fade?.to===target)return;
 if(Math.abs(record.volume-target)<.00001){record.fade=null;if(record!==current&&target===0)release(record);return;}
 record.fade={from:record.volume,to:target,at:clock(),duration:Math.max(1,duration)};
 if(timer===null)timer=setTimeout(tick,30);
}
function create(track){
 if(typeof globalThis.Audio!=='function')return null;
 try{
  const audio=new globalThis.Audio(),record={track,audio,volume:0,fade:null,playing:false,pending:false,ended:false,failed:false,token:0};
  audio.preload='auto';audio.loop=TRACKS[track].loop;audio.src=TRACKS[track].src;audio.volume=0;
  audio.onended=()=>{if(!records.has(record)||audio.loop)return;record.ended=true;record.playing=false;record.fade=null;volume(record,0);};
  audio.onerror=()=>{if(!records.has(record))return;record.failed=true;record.pending=false;record.playing=false;record.fade=null;volume(record,0);lastError='Não foi possível carregar a trilha '+track+'.';};
  records.add(record);return record;
 }catch{lastError='Áudio indisponível neste navegador.';return null;}
}
function play(record,retry,duration){
 if(!record||!records.has(record)||record!==current||record.playing||record.pending||record.ended||record.failed&&!retry||!allowed())return;
 record.pending=true;record.failed=false;const token=++record.token;
 const success=()=>{
  if(!records.has(record)){try{record.audio.pause();}catch{}return;}
  if(record.token!==token){if(!allowed()||record!==current){try{record.audio.pause();}catch{}}return;}
  record.pending=false;
  if(record!==current||!allowed()){pause(record);return;}
  record.playing=true;playCount++;lastError=null;fade(record,level(),duration);
 };
 const failure=()=>{if(!records.has(record)||record.token!==token)return;record.pending=false;record.playing=false;record.failed=true;record.fade=null;volume(record,0);lastError='A reprodução aguarda uma interação ou a disponibilidade do áudio.';};
 try{Promise.resolve(record.audio.play()).then(success,failure);}catch{failure();}
}
function sync(retry=false,duration=400){
 if(!initialized)return;
 if(!allowed()){
  cancelTimer();for(const record of [...records]){record.fade=null;volume(record,0);pause(record);if(record!==current)release(record);}return;
 }
 if(context==='silent')return;
 if(!current||current.track!==context){current=create(context);}
 if(current){play(current,retry,duration);if(current.playing)fade(current,level(),duration);}
}
function setContext(value,options={}){
 const next=Object.prototype.hasOwnProperty.call(TRACKS,value)?value:'silent',paused=options.paused===true;
 if(options.immediate){for(const record of [...records])release(record);cancelTimer();context=next;battlePaused=paused;if(next!=='silent')sync(true,400);return getDebugState();}
 if(context===next){if(battlePaused!==paused){battlePaused=paused;sync(false,450);}return getDebugState();}
 context=next;battlePaused=paused;
 // A rapid navigation discards obsolete retirees; there are never more than two tracks.
 for(const record of [...records])if(record!==current)release(record);
 const previous=current;current=null;
 if(previous){if(allowed())fade(previous,0,next==='victory'||next==='defeat'?600:1200);else release(previous);}
 if(next!=='silent')sync(true,next==='victory'||next==='defeat'?600:1200);
 return getDebugState();
}
function setPreferences(value={}){
 const next=normalize({...prefs,...value}),changed=Object.keys(next).some(key=>next[key]!==prefs[key]);prefs=next;
 if(changed)sync(true,250);return{...prefs};
}
function onPreferences(event){setPreferences(event?.detail||G.PresentationFX?.getPreferences?.()||{});}
function onGesture(event){if(event?.isTrusted===false)return;unlocked=true;sync(true,500);}
function onVisibility(){sync(true,500);}
function init(){
 if(initialized)return true;
 if(typeof document==='undefined'||!document.addEventListener)return false;
 initialized=true;prefs=normalize(G.PresentationFX?.getPreferences?.()||prefs);
 document.addEventListener('pointerdown',onGesture,{capture:true,passive:true});document.addEventListener('keydown',onGesture,{capture:true,passive:true});document.addEventListener('visibilitychange',onVisibility);
 globalThis.addEventListener?.('goghos:presentation-preferences',onPreferences);
 return true;
}
function destroy(){
 cancelTimer();for(const record of [...records])release(record);
 if(initialized){document.removeEventListener('pointerdown',onGesture,true);document.removeEventListener('keydown',onGesture,true);document.removeEventListener('visibilitychange',onVisibility);globalThis.removeEventListener?.('goghos:presentation-preferences',onPreferences);}
 initialized=false;unlocked=false;context='silent';battlePaused=false;lastError=null;playCount=0;
}
function getDebugState(){return{initialized,unlocked,context,paused:battlePaused,hidden:hidden(),targetVolume:level(),activeTrack:current?.track||null,playing:!!current?.playing,ended:!!current?.ended,pending:!!current?.pending,tracks:[...records].map(r=>({track:r.track,playing:r.playing,pending:r.pending,volume:r.volume,loop:r.audio.loop,currentTime:r.audio.currentTime||0})),queuedFade:timer!==null,playCount,lastError,preferences:{...prefs}};}
G.Soundtrack=Object.freeze({init,setContext,setPreferences,destroy,getDebugState});
})(globalThis.GOGHOS);
