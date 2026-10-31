// Música é apresentação: renderizar telas não pode duplicar faixas nem alterar a partida.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path'),crypto=require('node:crypto');
const source=fs.readFileSync(require('node:path').join(__dirname,'../js/ui/soundtrack.js'),'utf8');
function setup(options={}){
 let time=0,seq=0;const timers=new Map(),docEvents=new Map(),windowEvents=new Map(),audios=[],plays=[];
 const add=(map,type,fn)=>{if(!map.has(type))map.set(type,new Set());map.get(type).add(fn);};
 const remove=(map,type,fn)=>map.get(type)?.delete(fn);
 const emit=(map,type,event={})=>{for(const fn of [...(map.get(type)||[])])fn(event);};
 const document={hidden:false,addEventListener:(...a)=>add(docEvents,...a),removeEventListener:(...a)=>remove(docEvents,...a)};
 class Audio{
  constructor(){this.currentTime=0;this.paused=true;this.volume=1;this.loop=false;this.calls=0;audios.push(this);}
  play(){this.calls++;this.paused=false;plays.push(this);if(options.play)return options.play(this);return Promise.resolve();}
  pause(){this.paused=true;}
  removeAttribute(name){if(name==='src')this.src='';}
  load(){}
 }
 const battle={round:5,units:[{uid:'x',hp:50}],order:['x']};
 const G={battle,PresentationFX:{getPreferences:()=>({muted:false,volume:.4,musicMuted:false,musicVolume:.5})},getNextActor(){throw Error('Music must not read or advance the battle');}};
 const c={GOGHOS:G,Audio,document,performance:{now:()=>time},setTimeout(fn,ms){const id=++seq;timers.set(id,{fn,at:time+ms});return id;},clearTimeout:id=>timers.delete(id),addEventListener:(...a)=>add(windowEvents,...a),removeEventListener:(...a)=>remove(windowEvents,...a)};
 vm.createContext(c);vm.runInContext(source,c);const S=G.Soundtrack;
 return{S,G,audios,plays,timers,document,context:c,gesture:trusted=>emit(docEvents,'pointerdown',{isTrusted:trusted}),prefs:p=>emit(windowEvents,'goghos:presentation-preferences',{detail:p}),visible:yes=>{document.hidden=!yes;emit(docEvents,'visibilitychange');},listeners:()=>[...docEvents.values(),...windowEvents.values()].reduce((n,s)=>n+s.size,0),advance(ms){const end=time+ms;for(let i=0;i<10000;i++){const next=[...timers].sort((a,b)=>a[1].at-b[1].at)[0];if(!next||next[1].at>end){time=end;return;}time=next[1].at;timers.delete(next[0]);next[1].fn();}throw Error('Unbounded timer queue');}};
}
const flush=async()=>{await Promise.resolve();await Promise.resolve();};
let passed=0;const test=async(name,run)=>{await run();passed++;console.log('OK  '+name);};
(async()=>{
 await test('as músicas de batalha, derrota e vitória conservam os bytes e a identificação dos anexos recebidos',async()=>{
  const base=path.join(__dirname,'../assets/music-v0361'),manifest=JSON.parse(fs.readFileSync(path.join(base,'manifest.json'),'utf8'));
  const expected={combat:{source:'BattleMusic.mp3',bytes:4373381,sha:'823150dcf2de51c184d70ccb8c5400ca15e6d97122bde37ecb80c70326731f9a'},defeat:{source:'DefeatMusicc.mp3',bytes:1453100,sha:'45b86807d11aab1ee553d1f53afc05aa5d02ac5f7bf8585d14dbc1424d902527'},victory:{source:'WinMusic.mp3',bytes:1507017,sha:'d99e7421e8d9addb025e70bb43050b7093a532dd9b1c16d290ee57576c5bd65a'}};
  assert.equal(manifest.schema,1);assert.equal(manifest.files.length,3);assert.deepEqual(manifest.files.map(file=>file.role).sort(),Object.keys(expected).sort());
  for(const file of manifest.files){
   const wanted=expected[file.role],bytes=fs.readFileSync(path.join(base,file.file));
   assert.equal(file.file,file.role+'.mp3');assert.equal(file.source_file,wanted.source);assert.equal(file.bytes,wanted.bytes);assert.equal(bytes.length,wanted.bytes);
   assert.equal(file.sha256,wanted.sha);assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),wanted.sha);assert.equal(bytes.subarray(0,3).toString(),'ID3');
   assert.equal(file.codec,'mp3');assert.equal(file.channels,2);assert.equal(file.sample_rate,44100);assert.equal(file.loop,file.role==='combat');assert(file.duration_seconds>50);
  }
 });
 await test('cada contexto toca o anexo correto: combate em laço, vitória e derrota uma vez por resultado',async()=>{
  for(const role of ['combat','victory','defeat']){
   const q=setup(),before=JSON.stringify(q.G.battle);q.S.init();q.S.setContext(role);q.gesture(true);await flush();q.advance(1500);
   const audio=q.audios[0];assert.equal(audio.src,'assets/music-v0361/'+role+'.mp3');assert.equal(audio.loop,role==='combat');assert.equal(audio.calls,1);audio.currentTime=15;
   for(let i=0;i<10;i++)q.S.setContext(role);assert.equal(q.audios.length,1);assert.equal(audio.calls,1);assert.equal(audio.currentTime,15);
   if(role!=='combat'){audio.onended();for(let i=0;i<10;i++)q.S.setContext(role);assert.equal(audio.calls,1);assert.equal(q.S.getDebugState().ended,true);}
   assert.equal(JSON.stringify(q.G.battle),before);q.S.destroy();
  }
 });
 await test('carrega sem DOM ou suporte de áudio e mantém o estado da partida intacto',async()=>{
  const c={GOGHOS:{}};vm.createContext(c);vm.runInContext(source,c);assert.equal(c.GOGHOS.Soundtrack.init(),false);c.GOGHOS.Soundtrack.setContext('menu');c.GOGHOS.Soundtrack.setPreferences({volume:2});c.GOGHOS.Soundtrack.destroy();
  const q=setup(),before=JSON.stringify(q.G.battle);q.S.init();q.S.setContext('combat');q.gesture(true);await flush();q.advance(2000);assert.equal(JSON.stringify(q.G.battle),before);q.S.destroy();
 });
 await test('aguarda gesto real e redesenhar a mesma tela não reinicia a trilha ou sua posição',async()=>{
  const q=setup();assert(q.S.init());assert(q.S.init());assert.equal(q.listeners(),4);q.S.setContext('menu');assert.equal(q.audios.length,0);q.gesture(false);assert.equal(q.audios.length,0);q.gesture(true);await flush();q.advance(1500);
  const a=q.audios[0];assert.equal(a.src,'assets/menu-v036/menu.mp3');assert.equal(a.loop,true);assert.equal(a.calls,1);a.currentTime=23;
  for(let i=0;i<50;i++)q.S.setContext('menu');assert.equal(q.audios.length,1);assert.equal(a.calls,1);assert.equal(a.currentTime,23);assert.equal(q.S.getDebugState().targetVolume,.2);q.S.destroy();
 });
 await test('combate faz transição limitada a duas faixas e resultado toca uma vez sem reiniciar',async()=>{
  const q=setup();q.S.init();q.S.setContext('menu');q.gesture(true);await flush();q.advance(1500);q.S.setContext('combat');await flush();assert.equal(q.S.getDebugState().tracks.length,2);q.advance(600);assert(q.S.getDebugState().tracks.every(r=>r.volume>=0&&r.volume<=.2));q.advance(700);assert.equal(q.S.getDebugState().tracks.length,1);assert.equal(q.audios[0].paused,true);
  q.S.setContext('victory');await flush();q.advance(650);assert.equal(q.S.getDebugState().tracks.length,1);const win=q.audios.at(-1);assert.equal(win.loop,false);win.onended();for(let i=0;i<10;i++)q.S.setContext('victory');assert.equal(win.calls,1);assert(q.S.getDebugState().ended);q.S.destroy();
 });
 await test('navegação rápida descarta trilhas obsoletas inclusive uma promessa tardia de play',async()=>{
  const pending=[];const q=setup({play:a=>new Promise(resolve=>pending.push({a,resolve}))});q.S.init();q.S.setContext('menu');q.gesture(true);q.S.setContext('combat');q.S.setContext('victory');assert(q.S.getDebugState().tracks.length<=2);
  for(const p of pending)p.resolve();await flush();q.advance(2000);assert.equal(q.S.getDebugState().activeTrack,'victory');assert.equal(q.S.getDebugState().tracks.length,1);assert(q.audios.slice(0,-1).every(a=>a.paused));assert.equal(q.audios.at(-1).paused,false);q.S.destroy();
 });
 await test('mute geral e música são independentes e o volume respeita o mestre e a pausa',async()=>{
  const q=setup();q.S.init();q.S.setContext('combat');q.gesture(true);await flush();q.advance(1500);const a=q.audios[0];a.currentTime=12;
  q.prefs({musicMuted:true});assert(a.paused);assert.equal(q.S.getDebugState().preferences.muted,false);assert.equal(q.S.getDebugState().targetVolume,0);
  q.prefs({musicMuted:false});await flush();q.advance(500);assert.equal(a.currentTime,12);assert.equal(a.paused,false);
  q.S.setContext('combat',{paused:true});q.advance(500);assert(Math.abs(a.volume-.06)<.00001);
  q.prefs({muted:true});assert(a.paused);assert.equal(a.volume,0);q.S.setPreferences({muted:false,volume:4,musicVolume:-1});assert.equal(q.S.getDebugState().targetVolume,0);assert.equal(q.S.getDebugState().preferences.volume,1);assert.equal(q.S.getDebugState().preferences.musicVolume,0);q.S.destroy();
 });
 await test('falha de autoplay é tratada sem insistir a cada render e um novo gesto pode tentar novamente',async()=>{
  let rejected=true;const q=setup({play:()=>rejected?Promise.reject(Error('NotAllowedError')):Promise.resolve()});q.S.init();q.S.setContext('menu');q.gesture(true);await flush();assert(q.S.getDebugState().lastError);for(let i=0;i<20;i++)q.S.setContext('menu');assert.equal(q.audios[0].calls,1);rejected=false;q.gesture(true);await flush();assert(q.S.getDebugState().playing);assert.equal(q.audios[0].calls,2);q.S.destroy();
 });
 await test('aba oculta suspende áudio e ao voltar só o contexto atual retoma',async()=>{
  const q=setup();q.S.init();q.S.setContext('menu');q.gesture(true);await flush();q.advance(1000);q.visible(false);assert(q.audios.every(a=>a.paused));assert.equal(q.timers.size,0);
  q.S.setContext('combat');q.S.setContext('defeat');assert.equal(q.audios.length,1);q.visible(true);await flush();q.advance(1500);assert.equal(q.audios.length,2);assert.equal(q.S.getDebugState().activeTrack,'defeat');assert.equal(q.audios[0].paused,true);assert.equal(q.audios[1].loop,false);q.S.destroy();
 });
 await test('destruir e remontar limpa listeners, timers e fontes sem acumular tocadores',async()=>{
  const q=setup();q.S.init();q.S.setContext('menu');q.gesture(true);await flush();q.S.setContext('combat');q.S.destroy();await flush();assert.equal(q.listeners(),0);assert.equal(q.timers.size,0);assert.equal(q.S.getDebugState().tracks.length,0);assert(q.audios.every(a=>a.paused&&a.src===''));q.S.init();assert.equal(q.listeners(),4);q.S.destroy();assert.equal(q.listeners(),0);
 });
 await test('a abertura silencia imediatamente o menu e permite retomá-lo sem sobrepor duas músicas',async()=>{
  const q=setup();q.S.init();q.S.setContext('menu');q.gesture(true);await flush();q.advance(1500);
  const previous=q.audios[0];assert.equal(previous.paused,false);
  q.S.setContext('silent',{immediate:true});assert.equal(previous.paused,true);assert.equal(previous.src,'');assert.equal(q.S.getDebugState().tracks.length,0);assert.equal(q.timers.size,0);
  q.S.setContext('menu');await flush();q.advance(1500);assert.equal(q.S.getDebugState().tracks.length,1);assert.equal(q.S.getDebugState().playing,true);assert.equal(q.audios.at(-1).src,'assets/menu-v036/menu.mp3');q.S.destroy();
 });
 console.log(`${passed} testes da trilha instrumental passaram`);
})().catch(e=>{console.error(e);process.exitCode=1;});
