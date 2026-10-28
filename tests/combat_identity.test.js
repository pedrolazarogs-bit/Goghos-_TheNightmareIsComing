const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
['data/characters','data/gods','data/support_cards','data/reset_cards','core/battle','core/character_abilities','core/deck','core/support','core/roster','core/official_abilities','core/support_effects','core/divine','core/selection','core/ai','ui/battle_feedback','ui/presentation_fx'].forEach(f=>require('../js/'+f+'.js'));
const G=globalThis.GOGHOS,F=G.PresentationFX;let passed=0;const test=(name,fn)=>{fn();passed++;console.log('OK  '+name);};
const source=fs.readFileSync(require.resolve('../js/ui/presentation_fx.js'),'utf8');
function stage(){
 let time=10000,serial=0;const jobs=new Map(),animations=[],voices=[],units=[],focus=[],dalyFocus=[];
 class Element{
  constructor(tag='div'){this.tagName=tag;this.children=[];this.dataset={};this.style={};this.isConnected=true;this.classList={add(){},remove(){},toggle(){}};}
  appendChild(n){this.children.push(n);n.parent=this;return n;}remove(){this.isConnected=false;if(this.parent)this.parent.children=this.parent.children.filter(x=>x!==this);}
  setAttribute(){}getContext(){return null;}getBoundingClientRect(){return this.rect||{left:100,top:100,width:100,height:140,right:200,bottom:240};}
  querySelector(q){return q.includes('.card')?this.card||null:null;}
  animate(frames,options){const a={frames,options,cancelled:false,cancel(){this.cancelled=true;}};animations.push(a);return a;}
 }
 const parameter=()=>({value:0,setValueAtTime(){},exponentialRampToValueAtTime(){},setTargetAtTime(){}});
 class Audio{
  constructor(){this.state='running';this.currentTime=0;this.sampleRate=100;this.destination={};}
  node(){return{connect(){},disconnect(){}};}createGain(){return{...this.node(),gain:parameter()};}
  createDynamicsCompressor(){return{...this.node(),threshold:parameter(),ratio:parameter()};}
  createBuffer(){return{getChannelData:()=>new Float32Array(45)};}
  createBiquadFilter(){return{...this.node(),frequency:parameter()};}
  createOscillator(){const n={...this.node(),frequency:parameter(),start(){voices.push(n);},stop(){this.onended?.();}};return n;}
  createBufferSource(){const n={...this.node(),start(){voices.push(n);},stop(){this.onended?.();}};return n;}
  resume(){return Promise.resolve();}close(){}
 }
 const document={hidden:false,body:new Element('body'),documentElement:new Element('html'),createElement:tag=>new Element(tag),addEventListener(){},removeEventListener(){},querySelectorAll:q=>q==='[data-unit]'?units:q==='[data-focus-unit]'?focus:q==='[data-focus-daly]'?dalyFocus:[]};
 const context={GOGHOS:{CONFIG:{pacing:{feedback:2200}}},document,innerWidth:1280,innerHeight:720,AudioContext:Audio,performance:{now:()=>time},setTimeout(fn,delay){const id=++serial;jobs.set(id,{fn,at:time+delay});return id;},clearTimeout:id=>jobs.delete(id),matchMedia:()=>({matches:false,addEventListener(){},removeEventListener(){}}),addEventListener(){},removeEventListener(){},dispatchEvent(){},CustomEvent:class{},Math,Date};
 vm.createContext(context);vm.runInContext(source,context);
 const add=(uid,x=100,y=100)=>{const el=new Element();el.dataset.unit=uid;el.card=new Element();el.card.rect={left:x,top:y,width:100,height:140,right:x+100,bottom:y+140};units.push(el);return el;};
 const run=delta=>{const end=time+delta;for(let i=0;i<1000;i++){const next=[...jobs].filter(([,v])=>v.at<=end).sort((a,b)=>a[1].at-b[1].at)[0];if(!next)break;jobs.delete(next[0]);time=next[1].at;next[1].fn();}time=end;};
 return{F:context.GOGHOS.PresentationFX,document,Element,add,run,jobs,animations,voices,focus,dalyFocus};
}
test('cada campeão oficial tem arma e despedida; seis raridades e Deus crescem sem tocar atributos',()=>{
 const before=JSON.stringify([...G.CHARACTERS,...G.GODS]);
 for(const u of [...G.CHARACTERS,...G.GODS]){assert(F.CHARACTER_WEAPONS[u.id],u.id);assert(F.DEATH_STYLES[u.id],u.id);}
 const plans=[...G.RARITIES,'GOD'].map(r=>F.entryPlan(r));
 assert.equal(new Set(plans.map(p=>p.motif)).size,7);assert.equal(new Set(plans.map(p=>p.tone)).size,7);
 for(let i=1;i<plans.length;i++){assert(plans[i].duration>plans[i-1].duration);assert(plans[i].particles>plans[i-1].particles);assert.equal(plans[i].rank,i);}
 assert.equal(F.entryPlan({class:'DEUS'}).rarity,'GOD');assert.equal(JSON.stringify([...G.CHARACTERS,...G.GODS]),before);
});
test('tiros de sniper, revólver e fuzil automático conservam perfis de arma diferentes',()=>{
 const s={units:[{uid:'a',id:'striker'},{uid:'b',id:'sheriff'},{uid:'c',id:'mike'}]};
 const plans=s.units.map(u=>F.planEvent(s,{type:'attack',actorUid:u.uid,targetUid:'t',damage:55})[0]);
 assert.deepEqual(plans.map(p=>p.weapon),['rifle','revolver','assault-rifle']);assert(plans.every(p=>p.profile==='shot'));
});
test('a despedida é ligada à eliminação resolvida, sem confundir Oni com morte',()=>{
 const s={units:[{uid:'a',id:'sam'},{uid:'t',id:'chama'}]},e={type:'attack',actorUid:'a',hits:[{type:'oni',targetUid:'t'},{type:'defeat',targetUid:'t'}]};
 const plan=F.planEvent(s,e);assert.equal(plan[0].defeated,false);assert.equal(plan[1].defeated,true);assert.equal(plan[1].targetId,'chama');assert.equal(F.deathPlan('chama').style,'embers');assert.equal(F.deathPlan('penxy').style,'rift');assert.equal(F.deathPlan('sarck').style,'jaws');
});
test('queimadura continua visível e audível também depois de passar ou perder uma ação',()=>{
 const plan=F.planEvent({units:[]},{type:'status-skip',actorUid:'a',ticks:[{type:'hit',kind:'burn-damage',targetUid:'b',damage:40}]});
 assert.equal(plan.length,1);assert.equal(plan[0].profile,'flame');assert.deepEqual(F.planEvent({}, {type:'wait'}),[]);
});
test('entradas ocorrem uma vez por vida, sem repetir na troca de alvo ou na renderização',()=>{
 const q=stage(),a=q.add('a'),s={units:[{uid:'a',id:'sam',rarity:'RARE',hp:200,row:'front',slot:0}]},before=JSON.stringify(s);
 assert(q.F.syncUnits(s));q.run(1);assert.equal(q.F.getDebugState().lastEntryRarity,'RARE');const n=q.animations.length;
 q.F.syncUnits(s);q.run(200);assert.equal(q.animations.length,n);assert.equal(JSON.stringify(s),before);
 s.units[0].hp=0;s.units[0].eliminated=true;q.F.syncUnits(s);s.units[0].hp=1;s.units[0].eliminated=false;q.F.syncUnits(s);q.run(1);assert.equal(q.animations.length,n+1);assert(a.isConnected);q.F.stop();
});
test('transição entre linhas move a carta da posição anterior sem alterar a formação',()=>{
 const q=stage(),a=q.add('a'),s={units:[{uid:'a',id:'zuri',rarity:'EPIC',hp:200,row:'rear',slot:0}]};q.F.syncUnits(s);q.run(1);q.F.stop();
 s.units[0].row='front';a.card.rect={left:200,top:80,width:100,height:140,right:300,bottom:220};const before=JSON.stringify(s);q.F.syncUnits(s);
 assert(q.animations.at(-1).frames[0].transform.includes('-100px,20px'));assert.equal(JSON.stringify(s),before);q.F.stop();
});
test('golpe desloca a carta e o espelho ampliado, mas som e morte são disparados uma vez',()=>{
 const q=stage(),a=q.add('a',100,400);q.F.unlockAudio();q.add('t',500,100);const mirror=new q.Element();mirror.dataset.focusUnit='a';mirror.card=new q.Element();q.focus.push(mirror);
 const s={units:[{uid:'a',id:'sam'},{uid:'t',id:'chama'}]},e={id:1,type:'attack',actorUid:'a',hits:[{type:'defeat',targetUid:'t',damage:70}]};
 assert(q.F.playEvent(s,e));q.run(1);assert(q.animations.length>=2);assert.equal(q.F.getDebugState().playedEvents,1);assert.equal(q.F.playEvent(s,e),false);
 q.run(250);assert.equal(q.F.getDebugState().lastDeathStyle,'embers');assert(q.voices.length>0);q.F.stop();assert.equal(q.jobs.size,0);assert.equal(q.F.getDebugState().activeEffects,0);assert(q.animations.every(x=>x.cancelled));assert(a.isConnected);
});
test('movimento reduzido mantém a assinatura sem mover cartas; ocultar e encerrar limpam tarefas',()=>{
 const q=stage(),a=q.add('a');q.F.setPreferences({motion:'reduced',muted:true});assert(q.F.playEntry('SECRET',a));assert.equal(q.animations.length,0);assert.equal(q.voices.length,0);
 q.document.hidden=true;assert.equal(q.F.playEntry('GOD',a),false);assert.equal(q.F.syncUnits({units:[]}),false);q.F.stop();assert.equal(q.jobs.size,0);assert.equal(q.F.getDebugState().activeEffects,0);
});
test('no celular com campo recolhido, golpe e morte usam fichas ampliadas sem animação duplicada',()=>{
 const q=stage();for(const uid of ['a','t'])q.add(uid).card.rect={left:0,top:0,width:0,height:0,right:0,bottom:0};
 for(const [uid,left] of [['a',50],['t',250]]){const el=new q.Element();el.dataset.focusUnit=uid;el.card=new q.Element();el.card.rect={left,top:200,width:100,height:140,right:left+100,bottom:340};q.focus.push(el);}
 const s={units:[{uid:'a',id:'sam'},{uid:'t',id:'chama'}]},e={id:'phone',type:'attack',actorUid:'a',hits:[{type:'defeat',targetUid:'t',damage:70}]};
 q.F.playEvent(s,e);q.run(1);assert.equal(q.animations.length,1,'somente um deslocamento do atacante visível');
 const effects=q.document.body.children.flatMap(n=>n.children);assert(effects.some(n=>String(n.className).includes('fx-punch')&&n.style.cssText.includes('left:300px;top:267.2px')));
 q.run(250);assert.equal(q.animations.length,2,'somente uma despedida do alvo visível');assert.equal(q.F.getDebugState().lastDeathStyle,'embers');q.F.stop();
});
test('Daly Mãe ampliada recebe o impacto quando a formação está escondida',()=>{
 const q=stage();q.add('a');const daly=new q.Element();daly.dataset.focusDaly='enemy';daly.rect={left:500,top:150,width:100,height:140,right:600,bottom:290};q.dalyFocus.push(daly);
 q.F.playEvent({units:[{uid:'a',id:'mike'}]},{id:'daly',type:'daly-hit',actorUid:'a',targetUid:'daly_enemy',damage:1});q.run(1);
 assert.equal(q.F.getDebugState().lastProfile,'crystal');assert(q.document.body.children.flatMap(n=>n.children).some(n=>String(n.className).includes('fx-crystal')&&n.style.cssText.includes('left:550px')));q.F.stop();
});
test('entrantes fora do foco anunciam nome e raridade em no máximo dois avisos, sem repetir ao abrir Campo',()=>{
 const q=stage(),s={units:[]};q.F.unlockAudio();
 for(let i=0;i<4;i++){q.add('u'+i).card.rect={left:0,top:0,width:0,height:0,right:0,bottom:0};s.units.push({uid:'u'+i,id:'sam',name:'Sam '+i,rarity:'RARE',hp:100,row:'front',slot:i});}
 const before=JSON.stringify(s);q.F.syncUnits(s);q.run(600);assert.equal(q.F.getDebugState().activeAnnouncements,2);assert(q.voices.length>0);assert.equal(q.animations.length,0);assert.equal(JSON.stringify(s),before);
 for(let i=0;i<4;i++)q.document.querySelectorAll('[data-unit]')[i].card.rect={left:100+i*120,top:200,width:100,height:140,right:200+i*120,bottom:340};
 const sounds=q.voices.length;q.F.syncUnits(s);q.run(50);assert.equal(q.voices.length,sounds);assert.equal(q.animations.length,0);q.F.stop();assert.equal(q.F.getDebugState().activeAnnouncements,0);
});
test('cancelar uma entrada agendada não perde a apresentação em uma renderização seguinte',()=>{
 const q=stage(),s={units:[{uid:'a',id:'sam',rarity:'RARE',hp:100,row:'front',slot:0}]};q.add('a');q.F.syncUnits(s);q.F.stop();q.F.syncUnits(s);q.run(1);assert.equal(q.animations.length,1);q.F.stop();
});
console.log(`${passed} testes de identidade audiovisual passaram`);
