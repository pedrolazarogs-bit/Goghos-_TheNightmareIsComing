// Enquadramento: mede somente a interface e preserva estado/recursos de observação.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync('js/ui/arena_fit.js','utf8');
let passed=0;const test=(name,fn)=>{fn();passed++;console.log('OK  '+name);};
function load(sandbox={}){sandbox.GOGHOS=sandbox.GOGHOS||{};vm.createContext(sandbox);vm.runInContext(source,sandbox);return sandbox.GOGHOS.ArenaFit;}
function setup({timers=false}={}){
 const raf=new Map(),timeouts=new Map(),events=new Map(),viewportEvents=new Map(),fontCallbacks=[],resizeObservers=new Set(),mutationObservers=new Set();let serial=0;
 function eventTarget(map){return{addEventListener(type,fn){if(!map.has(type))map.set(type,new Set());map.get(type).add(fn);},removeEventListener(type,fn){map.get(type)?.delete(fn);}};}
 const G={battle:{round:4,turn:11,acted:{p1:true},piles:{EPIC:['a','b']},units:[{uid:'p1',hp:45}],hand:['one','two']}};
 const sandbox={GOGHOS:G,innerWidth:1280,...eventTarget(events),visualViewport:eventTarget(viewportEvents),document:{body:{},fonts:{ready:{then(fn){fontCallbacks.push(fn);return{catch(){}};}}}},
  ResizeObserver:class{constructor(fn){this.fn=fn;this.targets=new Set();}observe(target){this.targets.add(target);resizeObservers.add(this);}disconnect(){this.targets.clear();resizeObservers.delete(this);}},
  MutationObserver:class{constructor(fn){this.fn=fn;}observe(){mutationObservers.add(this);}disconnect(){mutationObservers.delete(this);}}
 };
 if(timers){sandbox.setTimeout=fn=>{const id=++serial;timeouts.set(id,fn);return id;};sandbox.clearTimeout=id=>timeouts.delete(id);}else{sandbox.requestAnimationFrame=fn=>{const id=++serial;raf.set(id,fn);return id;};sandbox.cancelAnimationFrame=id=>raf.delete(id);}
 const F=load(sandbox);
 function arena(){const vars=new Map(),sides=[{width:500,height:260},{width:480,height:250}];return{isConnected:true,dataset:{frontcap:'4'},style:{setProperty:(key,value)=>vars.set(key,value)},vars,sides,querySelectorAll(selector){if(selector==='.side')return sides.map(box=>({getBoundingClientRect:()=>box}));return[];},querySelector(selector){return selector==='.rear .cell'?{}:null;},getBoundingClientRect(){return{width:1000,height:700};}};}
 function emit(map,type){for(const fn of [...(map.get(type)||[])])fn();}
 return{F,G,arena,raf,timeouts,fontCallbacks,resizeObservers,mutationObservers,resize(){for(const o of [...resizeObservers])o.fn();emit(events,'resize');emit(viewportEvents,'resize');},fonts(){for(const fn of fontCallbacks)fn();},step(){const pending=[...(timers?timeouts:raf).values()];(timers?timeouts:raf).clear();pending.forEach(fn=>fn());},remove(host){host.isConnected=false;for(const o of [...mutationObservers])o.fn();},listeners(){return[events,viewportEvents].reduce((n,m)=>n+[...m.values()].reduce((a,set)=>a+set.size,0),0);}};
}
test('o tamanho respeita a área disponível e nunca cresce ao acrescentar uma quarta vaga ou Suportes',()=>{
 const F=load();
 for(const options of [{sideWidth:620,sideHeight:315,frontCap:3,hasRear:true},{sideWidth:450,sideHeight:220,frontCap:4,hasRear:true},{sideWidth:340,sideHeight:240,frontCap:3,hasRear:true,portrait:true},{sideWidth:760,sideHeight:170,frontCap:4,hasRear:false}]){
  const before={...options},size=F.computeSizing(Object.freeze(options));assert(size.frontSize>0&&size.frontSize<=156);assert(size.rearSize>0&&size.rearSize<=size.frontSize);assert(size.frontSize*options.frontCap<=options.sideWidth+.1);assert(size.frontSize*1.67<=options.sideHeight+.1);assert.deepEqual(options,before);
  const more=F.computeSizing({...options,sideWidth:options.sideWidth+100,sideHeight:options.sideHeight+100});assert(more.frontSize>=size.frontSize);
 }
 const area={sideWidth:450,sideHeight:280};assert(F.computeSizing({...area,frontCap:4}).frontSize<=F.computeSizing({...area,frontCap:3}).frontSize);assert(F.computeSizing({...area,frontCap:3,hasRear:true}).frontSize<=F.computeSizing({...area,frontCap:3,hasRear:false}).frontSize);
});
test('medidas ausentes ou inválidas têm saída finita, sem NaN ou tamanho negativo',()=>{
 const F=load();for(const options of [undefined,null,false,{}, {sideWidth:NaN,sideHeight:Infinity,frontCap:-2},{sideWidth:-300,sideHeight:'inválido',frontCap:'x'},{sideWidth:Symbol('w'),sideHeight:Symbol('h'),frontCap:Symbol('c')}]){const size=F.computeSizing(options);for(const value of Object.values(size))assert(Number.isFinite(value)&&value>0&&value<=156);}
});
test('a mesa de comandos reserva Suportes maiores sem sobrepor a frente nem sair do quadro',()=>{
 const F=load();
 for(const o of [{sideWidth:670,sideHeight:230,frontCap:4,hasRear:true},{sideWidth:374,sideHeight:135,frontCap:4,hasRear:true,portrait:true},{sideWidth:280,sideHeight:260,frontCap:3,hasRear:true}]){
  const result=F.computeSizing({...o,command:true}),legacy=F.computeSizing(o),gap=o.portrait?4:6;
  assert(result.frontSize*1.67+68<=o.sideHeight+.1);
  assert(result.frontSize*o.frontCap+result.rearSize*2+(o.frontCap-1)*gap+24<=o.sideWidth+.3);
  assert(Math.abs(result.rearSize/result.frontSize-.72)<.02);
  assert(result.rearSize/result.frontSize>legacy.rearSize/legacy.frontSize);
 }
});
test('carregar sem DOM e encerrar uma montagem inválida não acessa ou altera o estado da partida',()=>{
 const G={battle:{round:3,hand:['a'],units:[{hp:1}]}},before=JSON.stringify(G.battle),F=load({GOGHOS:G});assert.equal(typeof F.mount(null),'function');F.refresh();F.detach();assert.equal(F.getDebugState().active,false);assert.equal(JSON.stringify(G.battle),before);
});
test('fontes, resize e observação se agrupam em um quadro e não repetem escrita sem mudança de medida',()=>{
 const q=setup(),host=q.arena(),before=JSON.stringify(q.G.battle);q.F.mount(host);assert.equal(q.F.getDebugState().measurements,1);assert.equal(q.F.getDebugState().writes,1);for(let i=0;i<10;i++){q.resize();q.F.refresh();q.fonts();}assert.equal(q.raf.size,1);q.step();assert.equal(q.F.getDebugState().measurements,2);assert.equal(q.F.getDebugState().writes,1);const old=q.F.getDebugState().frontSize;host.sides.forEach(s=>{s.width+=200;s.height+=100;});q.resize();q.step();assert(q.F.getDebugState().frontSize>old);assert.equal(q.F.getDebugState().writes,2);assert.equal(JSON.stringify(q.G.battle),before);q.F.detach();assert.equal(q.raf.size,0);assert.equal(q.listeners(),0);assert.equal(q.resizeObservers.size+q.mutationObservers.size,0);
});
test('remontar limpa recursos anteriores e uma limpeza ou fonte antiga não encerra a nova montagem',()=>{
 const q=setup(),a=q.arena(),b=q.arena(),old=q.F.mount(a),oldFont=q.fontCallbacks[0];q.F.refresh();assert.equal(q.raf.size,1);q.F.mount(b);assert.equal(q.raf.size,0);assert.equal(q.resizeObservers.size,1);assert.equal(q.mutationObservers.size,1);old();oldFont();assert.equal(q.F.getDebugState().active,true);assert.equal(q.raf.size,0);q.F.refresh();assert.equal(q.raf.size,1);q.F.detach();assert.equal(q.F.getDebugState().active,false);assert.equal(q.raf.size,0);assert.equal(q.listeners(),0);
});
test('remover o campo cancela observadores e o fallback de timer também é cancelado ao sair',()=>{
 const q=setup(),host=q.arena();q.F.mount(host);q.F.refresh();q.remove(host);assert.equal(q.F.getDebugState().active,false);assert.equal(q.raf.size,0);assert.equal(q.resizeObservers.size+q.mutationObservers.size,0);assert.equal(q.listeners(),0);
 const t=setup({timers:true}),other=t.arena(),cleanup=t.F.mount(other);t.F.refresh();t.F.refresh();assert.equal(t.timeouts.size,1);cleanup();assert.equal(t.timeouts.size,0);assert.equal(t.listeners(),0);assert.equal(t.F.getDebugState().active,false);
});
console.log(`${passed} testes de enquadramento da arena passaram`);
