// Os movimentos de controles não podem interferir nas animações ou regras de combate.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync(require.resolve('../js/ui/duel_motion.js'),'utf8');
let passed=0;
const test=(name,run)=>{run();passed++;console.log('OK  '+name);};

function setup(prefs={motion:'full'}){
 const animations=[],maps=[];
 function emitter(){
  const listeners=new Map();maps.push(listeners);
  return {listeners,addEventListener(type,fn){if(!listeners.has(type))listeners.set(type,new Set());listeners.get(type).add(fn);},removeEventListener(type,fn){listeners.get(type)?.delete(fn);},emit(type,event={}){for(const fn of [...(listeners.get(type)||[])])fn({type,...event});}};
 }
 class Element{
  constructor(){Object.assign(this,emitter());this.isConnected=true;this.dataset={};this.children=[];this.className='';this.classList={add(){},remove(){}};this.rect={width:100,height:80,left:20,top:30};}
  getBoundingClientRect(){return{...this.rect};}
  querySelector(){return this.icon||null;}
  querySelectorAll(selector){return selector.includes('.cell.is-target')?this.targets||[]:this.entrants||[];}
  contains(element){return element===this||this.children.includes(element);}
  getAttribute(){return null;}
  matches(selector){return selector==='.cell'&&this.isCell;}
  closest(selector){if(selector==='button,[role="button"]')return this;if(selector==='[data-act]')return this.isAction?this:null;if(selector==='.cell[data-unit]')return this.isCell?this:null;return null;}
  appendChild(element){element.parent=this;this.children.push(element);}
  setAttribute(){}
  remove(){this.isConnected=false;if(this.parent)this.parent.children=this.parent.children.filter(element=>element!==this);}
  animate(frames,options){const animation={element:this,frames,options,cancelled:false,cancel(){this.cancelled=true;}};animations.push(animation);return animation;}
 }
 const root=new Element(),document={...emitter(),hidden:false,createElement:()=>new Element()},globalEvents=emitter(),media={...emitter(),matches:false};
 const state={turn:3,hp:130},G={PresentationFX:{getPreferences:()=>prefs}};
 Object.defineProperty(G,'state',{get(){throw Error('Movimentos de controles não devem consultar a partida.');}});
 for(const name of ['getNextActor','drawCard','rollDie'])G[name]=()=>{throw Error('Movimentos não devem executar '+name);};
 const environment={GOGHOS:G,document,performance:{now:()=>1000},matchMedia:()=>media,...globalEvents};
 vm.createContext(environment);vm.runInContext(source,environment);
 return {M:G.DuelMotion,root,document,environment,media,prefs,state,animations,Element,
  button(){const element=new Element();element.isAction=true;element.icon=new Element();root.children.push(element);return element;},
  finish(){for(const animation of animations)if(!animation.cancelled)animation.onfinish?.();},
  listeners(){return maps.reduce((sum,map)=>sum+[...map.values()].reduce((n,set)=>n+set.size,0),0);}};
}

test('a apresentação pode carregar e encerrar sem DOM ou acesso à partida',()=>{
 const environment={GOGHOS:{}};vm.createContext(environment);vm.runInContext(source,environment);const motion=environment.GOGHOS.DuelMotion;
 motion.mount(null);motion.detach();motion.destroy();assert.equal(motion.getDebugState().active,false);
});
test('a entrada da arena anima somente os controles uma vez; redesenhar não repete a entrada',()=>{
 const q=setup(),button=q.button(),before=JSON.stringify(q.state),rect={...button.rect};q.root.entrants=[button];
 q.M.mount(q.root,{mode:'battle',changed:true});assert.equal(q.M.getDebugState().animations,1);
 assert.equal(JSON.stringify(q.animations[0].frames),'[{"opacity":0},{"opacity":1}]');
 q.finish();assert.equal(q.M.getDebugState().animations,0);q.M.mount(q.root,{mode:'battle',changed:false});
 assert.equal(q.M.getDebugState().animations,0);assert.deepEqual(button.rect,rect);assert.equal(JSON.stringify(q.state),before);
 q.M.detach();assert.equal(q.listeners(),0);
});
test('a pressão e o assentamento usam escala individual sem substituir a rotação do controle',()=>{
 const q=setup(),button=q.button();q.M.mount(q.root,{mode:'menu',changed:false});q.root.emit('pointerdown',{target:button});
 assert(q.M.getDebugState().pressed);assert.equal(q.animations[0].element,button.icon);assert.equal(q.animations[0].frames[1].scale,'.92 .88');
 assert(q.animations[0].frames.every(frame=>!frame.transform));q.environment.emit('pointerup',{target:button});
 assert(!q.M.getDebugState().pressed);assert(q.animations[0].cancelled);assert.equal(q.animations[1].frames.at(-1).scale,'1');
 q.M.detach();assert(q.animations.every(animation=>animation.cancelled));assert.equal(q.listeners(),0);
});
test('uma pressão longa permanece registrada e é realmente cancelada antes do assentamento',()=>{
 const q=setup(),button=q.button();q.M.mount(q.root,{mode:'menu',changed:false});q.root.emit('pointerdown',{target:button});q.finish();
 assert.equal(q.M.getDebugState().animations,1);assert(q.M.getDebugState().pressed);
 q.environment.emit('pointerup',{target:button});assert(q.animations[0].cancelled);q.finish();assert.equal(q.M.getDebugState().animations,0);
 q.M.destroy();assert.equal(q.listeners(),0);
});
test('selecionar o alvo real cria dois brilhos curtos e remove a decoração ao terminar',()=>{
 const q=setup(),cell=new q.Element();cell.isCell=true;cell.dataset.unit='player_1';q.root.children.push(cell);
 q.M.mount(q.root,{mode:'battle',changed:false});q.root.emit('click',{target:cell});q.root.targets=[cell];
 q.M.mount(q.root,{mode:'battle',changed:false});assert.equal(cell.children.length,2);assert.equal(q.M.getDebugState().animations,2);
 q.finish();assert.equal(cell.children.length,0);assert.equal(q.M.getDebugState().animations,0);q.M.destroy();assert.equal(q.listeners(),0);
});
test('movimento reduzido não cria entrada, pressão animada ou ciclos de atualização',()=>{
 const q=setup({motion:'reduced'}),button=q.button();q.root.entrants=[button];q.M.mount(q.root,{mode:'menu',changed:true});q.root.emit('pointerdown',{target:button});
 assert.equal(q.animations.length,0);assert.equal(q.root.dataset.duelMotion,'reduced');
 q.prefs.motion='full';q.environment.emit('goghos:presentation-preferences');q.root.emit('pointerdown',{target:button});assert.equal(q.M.getDebugState().animations,1);
 q.prefs.motion='reduced';q.environment.emit('goghos:presentation-preferences');assert.equal(q.M.getDebugState().animations,0);assert.equal(q.M.getDebugState().pressed,false);
 q.M.destroy();assert.equal(q.listeners(),0);
});
test('ocultar a página cancela os efeitos e voltar à aba não os reapresenta',()=>{
 const q=setup(),button=q.button();q.M.mount(q.root,{mode:'menu',changed:false});q.root.emit('pointerdown',{target:button});
 q.document.hidden=true;q.document.emit('visibilitychange');assert.equal(q.M.getDebugState().animations,0);assert.equal(q.root.dataset.duelMotion,'paused');
 q.document.hidden=false;q.document.emit('visibilitychange');assert.equal(q.M.getDebugState().animations,0);assert.equal(q.root.dataset.duelMotion,'ready');
 q.M.destroy();assert.equal(q.listeners(),0);
});
test('a escolha completa prevalece sobre a preferência reduzida do dispositivo',()=>{
 const q=setup({motion:'auto'});q.media.matches=true;q.M.mount(q.root,{mode:'select',changed:true});assert.equal(q.M.getDebugState().reducedMotion,true);
 q.prefs.motion='full';q.environment.emit('goghos:presentation-preferences');assert.equal(q.M.getDebugState().reducedMotion,false);
 q.M.destroy();assert.equal(q.listeners(),0);
});
test('remontagens limpam ouvintes anteriores e uma limpeza antiga não remove a tela nova',()=>{
 const q=setup(),first=q.M.mount(q.root,{mode:'menu',changed:false}),count=q.listeners();q.M.mount(q.root,{mode:'characters',changed:false});
 assert.equal(q.listeners(),count);first();assert.equal(q.M.getDebugState().active,true);assert.equal(q.M.getDebugState().mode,'characters');
 q.M.destroy();q.M.destroy();assert.equal(q.listeners(),0);assert.equal(q.M.getDebugState().active,false);
});

console.log(`${passed} testes dos movimentos de controles passaram`);
