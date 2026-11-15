// Preferências e sons da apresentação; sem dependências de combate ou navegação.
(function(G){
'use strict';
const KEY='goghos.presentation.v1';
const DEFAULTS=Object.freeze({muted:false,volume:.38,musicMuted:false,musicVolume:.55,motion:'auto'});
const clamp=value=>Math.min(1,Math.max(0,value));
function normalizePreferences(value={}){
 const source=value&&typeof value==='object'?value:{};
 const motion=typeof source.motion==='boolean'?(source.motion?'full':'reduced'):['auto','full','reduced'].includes(source.motion)?source.motion:'auto';
 return {muted:typeof source.muted==='boolean'?source.muted:DEFAULTS.muted,volume:Number.isFinite(Number(source.volume))?clamp(Number(source.volume)):DEFAULTS.volume,musicMuted:typeof source.musicMuted==='boolean'?source.musicMuted:DEFAULTS.musicMuted,musicVolume:Number.isFinite(Number(source.musicVolume))?clamp(Number(source.musicVolume)):DEFAULTS.musicVolume,motion};
}
let prefs;try{prefs=normalizePreferences(JSON.parse(globalThis.localStorage?.getItem(KEY)||'{}'));}catch{prefs={...DEFAULTS};}
let media=null,initialized=false,audio=null,master=null,unlocked=false,lastInteraction=-Infinity;
const voices=new Set();
const reduced=()=>prefs.motion==='reduced'||prefs.motion==='auto'&&!!media?.matches;
const hidden=()=>!!globalThis.document?.hidden;
function getPreferences(){return {...prefs,reducedMotion:reduced(),audioUnlocked:unlocked};}
function applyMotion(){
 document.documentElement.classList.toggle('goghos-motion-reduced',reduced());
 document.documentElement.classList.toggle('goghos-motion-full',prefs.motion==='full');
}
function notify(){globalThis.dispatchEvent(new CustomEvent('goghos:presentation-preferences',{detail:getPreferences()}));}
function setPreferences(value={}){
 prefs=normalizePreferences({...prefs,...value});
 try{globalThis.localStorage?.setItem(KEY,JSON.stringify(prefs));}catch{}
 master?.gain.setTargetAtTime(prefs.muted?0:prefs.volume,audio.currentTime,.035);
 if(initialized){applyMotion();notify();}
 return getPreferences();
}
function unlockAudio(event){
 if(!event?.isTrusted||hidden())return;
 try{
  if(!audio){const Constructor=globalThis.AudioContext||globalThis.webkitAudioContext;if(!Constructor)return;audio=new Constructor();master=audio.createGain();master.gain.value=prefs.muted?0:prefs.volume;master.connect(audio.destination);}
  unlocked=true;
  if(audio.state==='suspended')audio.resume()?.catch(()=>{});
 }catch{unlocked=false;}
}
function interaction(kind='click'){
 if(!unlocked||!audio||audio.state!=='running'||prefs.muted||hidden())return false;
 const time=globalThis.performance.now();if(time-lastInteraction<(kind==='hover'?85:30))return false;lastInteraction=time;
 const hover=kind==='hover',start=audio.currentTime,duration=.055;
 const oscillator=audio.createOscillator(),gain=audio.createGain();
 oscillator.type='triangle';oscillator.frequency.setValueAtTime(470,start);oscillator.frequency.exponentialRampToValueAtTime(611,start+duration);
 gain.gain.setValueAtTime(hover?.025:.055,start);gain.gain.exponentialRampToValueAtTime(.0001,start+duration);
 oscillator.connect(gain);gain.connect(master);voices.add(oscillator);
 oscillator.onended=()=>{voices.delete(oscillator);oscillator.disconnect();gain.disconnect();};
 oscillator.start(start);oscillator.stop(start+duration);return true;
}
function onVisibility(){if(hidden())audio?.suspend()?.catch(()=>{});else if(unlocked)audio?.resume()?.catch(()=>{});}
function onMotion(){applyMotion();notify();}
function init(){
 if(initialized)return true;if(!globalThis.document?.body)return false;initialized=true;
 media=globalThis.matchMedia?.('(prefers-reduced-motion: reduce)')||null;media?.addEventListener?.('change',onMotion);
 document.addEventListener('pointerdown',unlockAudio,{capture:true,passive:true});document.addEventListener('keydown',unlockAudio,{capture:true,passive:true});document.addEventListener('visibilitychange',onVisibility);
 applyMotion();return true;
}
function destroy(){
 if(!initialized)return;initialized=false;
 document.removeEventListener('pointerdown',unlockAudio,true);document.removeEventListener('keydown',unlockAudio,true);document.removeEventListener('visibilitychange',onVisibility);media?.removeEventListener?.('change',onMotion);
 for(const voice of voices){try{voice.stop();}catch{}}voices.clear();audio?.close()?.catch(()=>{});audio=master=media=null;unlocked=false;
}
G.PresentationFX=Object.freeze({init,destroy,interaction,getPreferences,setPreferences,normalizePreferences,getDebugState:()=>({initialized,audioUnlocked:unlocked,audioState:audio?.state||'unavailable',activeVoices:voices.size,reducedMotion:reduced()})});
})(globalThis.GOGHOS);
