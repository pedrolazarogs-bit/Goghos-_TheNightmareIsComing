const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync('js/ui/cartoon_motion.js','utf8');
let passed=0;function test(name,fn){fn();passed++;console.log('OK  '+name);}
function setup(initial={motion:'full'}){
 const raf=new Map(),observers=new Set(),events=new Map(),mediaEvents=new Map(),docEvents=new Map();let id=0,clock=1000;
 const context2d={setTransform(){},clearRect(){},save(){},translate(){},rotate(){},beginPath(){},moveTo(){},lineTo(){},closePath(){},fill(){},restore(){}};
 function eventTarget(map){return{addEventListener(name,fn){if(!map.has(name))map.set(name,new Set());map.get(name).add(fn);},removeEventListener(name,fn){map.get(name)?.delete(fn);}};}
 class Element{
  constructor(tag){this.tagName=tag;this.style={};this.dataset={};this.children=[];this.parentNode=null;this._connected=null;this._registry={};this.className='';this.rect={left:0,top:0,width:900,height:700,right:900,bottom:700};}
  get isConnected(){return this._connected??this.parentNode?.isConnected??false;}
  set isConnected(value){this._connected=value;}
  appendChild(node){node.parentNode=this;this.children.push(node);return node;}
  remove(){if(this.parentNode)this.parentNode.children=this.parentNode.children.filter(x=>x!==this);this.parentNode=null;this._connected=false;}
  setAttribute(name,value){this[name]=value;}
  getBoundingClientRect(){return this.rect;}
  getContext(){return context2d;}
  querySelector(selector){return this._registry[selector]||null;}
  querySelectorAll(selector){return selector==='[data-toon-depth]'?this._depths||[]:[];}
  set innerHTML(_html){this._depths=[];for(const [name,depth] of [['rays-depth',5],['far',9],['mid',18],['near',29]]){const e=this.appendChild(new Element('div'));e.dataset.toonDepth=String(depth);this._registry['.ct-motion-'+name]=e;this._depths.push(e);}const canvas=this.appendChild(new Element('canvas'));this._registry['.ct-motion-canvas']=canvas;}
  animate(){const animation={cancel(){animation.canceled=true;},onfinish:null};return animation;}
 }
 const body=new Element('body');body.isConnected=true;
 const document={body,hidden:false,...eventTarget(docEvents),createElement:tag=>new Element(tag)};
 const media={matches:false,...eventTarget(mediaEvents)};
 const prefs={...initial},G={PresentationFX:{getPreferences:()=>({...prefs})},state:{round:3,units:[{hp:45}],coins:180}};
 const sandbox={GOGHOS:G,document,performance:{now:()=>clock},innerWidth:900,innerHeight:700,devicePixelRatio:2,...eventTarget(events),matchMedia:()=>media,requestAnimationFrame(fn){const key=++id;raf.set(key,fn);return key;},cancelAnimationFrame(key){raf.delete(key);},MutationObserver:class{constructor(fn){this.fn=fn;}observe(){observers.add(this);}disconnect(){observers.delete(this);}}};
 vm.createContext(sandbox);vm.runInContext(source,sandbox);
 function emit(map,name){for(const fn of [...(map.get(name)||[])])fn();}
 function host(){const element=new Element('div');body.appendChild(element);return element;}
 return{M:G.CartoonMotion,G,prefs,document,media,raf,observers,events,mediaEvents,docEvents,host,step(){clock+=16;const pending=[...raf.values()];raf.clear();pending.forEach(fn=>fn(clock));},preference(value){Object.assign(prefs,value);emit(events,'goghos:presentation-preferences');},visibility(value){document.hidden=value;emit(docEvents,'visibilitychange');},disconnect(element){element.remove();for(const o of [...observers])o.fn();},mediaChange(value){media.matches=value;emit(mediaEvents,'change');},listeners(){return[events,docEvents,mediaEvents].reduce((sum,m)=>sum+[...m.values()].reduce((n,s)=>n+s.size,0),0);}};
}
test('ambiente sem DOM pode carregar, consultar e encerrar a ambiência sem tocar regras',()=>{
 const G={state:{round:4}},context={GOGHOS:G};vm.createContext(context);vm.runInContext(source,context);const before=JSON.stringify(G.state);assert.equal(G.CartoonMotion.getDebugState().active,false);assert.equal(typeof G.CartoonMotion.attach(null),'function');G.CartoonMotion.refresh();G.CartoonMotion.detach();assert.equal(G.CartoonMotion.burst(null),false);assert.equal(JSON.stringify(G.state),before);
});
test('movimento reduzido produz uma cena estática sem quadro agendado ou alteração da partida',()=>{
 const q=setup({motion:'reduced'}),host=q.host(),before=JSON.stringify(q.G.state);q.M.attach(host);assert.equal(host.dataset.toonMotion,'reduced');assert.equal(q.raf.size,0);assert(q.M.getDebugState().particles>0);assert.equal(host.children.length,1);assert(q.M.burst(host));assert.equal(q.raf.size,0);assert.equal(q.M.getDebugState().bursts,0);assert.equal(JSON.stringify(q.G.state),before);q.M.detach();assert.equal(q.listeners(),0);assert.equal(q.observers.size,0);
});
test('partículas de clique são limitadas e reduzir movimento cancela o ciclo imediatamente',()=>{
 const q=setup(),host=q.host(),before=JSON.stringify(q.G.state);q.M.attach(host);assert.equal(q.raf.size,1);q.step();assert.equal(q.raf.size,1);for(let n=0;n<10;n++)assert(q.M.burst(host));assert.equal(q.M.getDebugState().bursts,40);q.preference({motion:'reduced'});assert.equal(q.raf.size,0);assert.equal(q.M.getDebugState().bursts,0);assert.equal(host.dataset.toonMotion,'reduced');assert.equal(JSON.stringify(q.G.state),before);
});
test('aba oculta pausa CSS e RAF; retomar não cria loops duplicados e detach limpa recursos',()=>{
 const q=setup(),host=q.host(),cleanup=q.M.attach(host);q.visibility(true);assert.equal(host.dataset.toonMotion,'paused');assert.equal(q.raf.size,0);assert.equal(q.M.burst(host),false);q.visibility(false);assert.equal(host.dataset.toonMotion,'running');assert.equal(q.raf.size,1);q.visibility(false);assert.equal(q.raf.size,1);cleanup();cleanup();assert.equal(q.M.getDebugState().active,false);assert.equal(q.raf.size,0);assert.equal(q.listeners(),0);assert.equal(q.observers.size,0);assert.equal(host.children.length,0);
});
test('remoção do host também limpa a cena reduzida e uma limpeza antiga não remove a cena nova',()=>{
 const q=setup({motion:'reduced'}),a=q.host(),b=q.host(),old=q.M.attach(a);q.M.attach(b);assert.equal(a.children.length,0);old();assert.equal(q.M.getDebugState().active,true);assert.equal(b.children.length,1);q.disconnect(b);assert.equal(q.M.getDebugState().active,false);assert.equal(q.listeners(),0);assert.equal(q.observers.size,0);
});
test('preferência do dispositivo é atualizada ao vivo e escolha completa prevalece sobre ela',()=>{
 const q=setup({motion:'auto'}),host=q.host();q.M.attach(host);q.mediaChange(true);assert.equal(host.dataset.toonMotion,'reduced');assert.equal(q.raf.size,0);q.preference({motion:'full'});assert.equal(host.dataset.toonMotion,'running');assert.equal(q.raf.size,1);q.mediaChange(true);assert.equal(host.dataset.toonMotion,'running');assert.equal(q.raf.size,1);q.M.detach();
});
console.log(`${passed} testes da ambiência cartoon passaram`);
