// O menu recebido usa seus recursos originais e os acessos reais do projeto.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),vm=require('node:vm');
const project=path.resolve(__dirname,'..'),assets=path.join(project,'assets/menu-v036');
const manifest=JSON.parse(fs.readFileSync(path.join(assets,'manifest.json'),'utf8'));
const hash=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
let passed=0;const test=(name,run)=>{run();passed++;console.log('OK  '+name);};
const expected={
 'bg.jpg':'05c67bf4b8bd0f68317c71d3bea312d0ecf15d347f3d85e833993b87a60f1474',
 'logo.webp':'e1cba60435436f86a9c6a6b121723904ececc3001a74d2b8c8a0f8d6b34ab11e',
 'coins.webp':'43bad28541ef1d4713370ba7af3ef8d5613e8fff7edccfbcbf74ed7bd056d2ba',
 'deck.webp':'b29b81c200064fc2627e157f71d3ec314d69ec7e00b5d80943f24c0c0da84b18',
 'shop.webp':'f449241f0f21b45a5a54fa5f260b559a2f9d3832d443ad8f535a6b1e849036df',
 'star.webp':'1f0d6a4e1f42e0bba480bb2c1c2d8f9dc3ad8f403f2af425c9ba0636da3f8cd8',
 'frame.webp':'8953e31bddaff01085c146d4d42b7c0cb734a6f3862fa058565fdd890c73b7a0',
 'trophy.webp':'2b1701abd1e2a48b79488a1b6f6f0c70a83c51f3c63b6485facb2376a6f25f14',
 'dots.webp':'2ac9e614be0d5654069db31fa870b4b02f3025d84067758dc435db0a0b851fcf',
 'play.webp':'71b3b1375f36c435284511fbd771f9bc10dfb4a8659760fef6ee7f6636e85634',
 'character-0.webp':'9213575b89dc6afa8832e0529a16362f598bc2deaf6cb80597b7a0ddd241bd53',
 'character-1.webp':'7843f40df2917b15ab3b957211d60f91743d7ea5968a69ec15e979b6ce0da2e0',
 'character-2.webp':'929ce63727166f1555f261db975d3af53d13325039f3e389fcdd7f9864315e21',
 'character-3.webp':'fd81b509f21635042a3ad5ca607bf945f8f25d13cb038716c0a8fde355c1cd91',
 'character-4.webp':'b79d940db1d0aa6816e36665c63b71e8941b157d4a36d42a017d552d6bfbf395',
 'menu.mp3':'b46a3b537f9ff2c2f82ac8c58df5a27d5b60fd1a7ea9886ab9e1627179e917fe',
 'german_beauty.ttf':'62ea1b27212ba4f86ed983664a4d62b43c143d2c8e0e445c23aa21e6b141497f'
};

test('os dezessete recursos conservam os bytes recebidos no menu e a origem identificada',()=>{
 assert.equal(manifest.source.fileName,'Cosmos — Menu Principal.html');assert.equal(manifest.source.bytes,5260432);
 assert.equal(manifest.source.sha256,'b45f1d2d7aa7a5563f95f155688375fdf3514a07fab8571ae4a356615c7212c8');
 assert.deepEqual(manifest.files.map(file=>file.path).sort(),Object.keys(expected).sort());
 for(const file of manifest.files){
  const target=path.resolve(assets,file.path);assert(target.startsWith(assets+path.sep));
  const bytes=fs.readFileSync(target);assert.equal(bytes.length,file.bytes,file.path);assert.equal(hash(bytes),expected[file.path],file.path);assert.equal(file.sha256,expected[file.path],file.path);
 }
});
test('as extensões correspondem ao JPEG, aos WebPs, ao MP3 e à fonte realmente enviados',()=>{
 for(const file of manifest.files){
  const bytes=fs.readFileSync(path.join(assets,file.path));
  if(file.path.endsWith('.webp')){assert.equal(file.mimeType,'image/webp');assert.equal(bytes.subarray(0,4).toString(),'RIFF');assert.equal(bytes.subarray(8,12).toString(),'WEBP');}
  else if(file.path.endsWith('.jpg')){assert.equal(file.mimeType,'image/jpeg');assert.equal(bytes.readUInt16BE(0),0xffd8);}
  else if(file.path.endsWith('.mp3')){assert.equal(file.mimeType,'audio/mpeg');assert.equal(bytes.subarray(0,3).toString(),'ID3');}
  else{assert.equal(file.path,'german_beauty.ttf');assert.equal(file.mimeType,'font/ttf');assert.equal(bytes.readUInt32BE(0),0x00010000);}
 }
});
test('a fonte original é a mesma da intro e o catálogo dos favoritos identifica Nully corretamente',()=>{
 const font=fs.readFileSync(path.join(assets,'german_beauty.ttf'));
 assert.equal(hash(font),hash(fs.readFileSync(path.join(project,'assets/intro-v036/german_beauty.ttf'))));
 assert.deepEqual(manifest.characters.map(character=>[character.index,character.id,character.name]),[[0,'unicorn','Unicorn'],[1,'sam','Sam'],[2,'sarck','Sark'],[3,'nully','Nully'],[4,'mike','Mike']]);
 for(const character of manifest.characters)assert.equal(character.path,'character-'+character.index+'.webp');
 assert.equal(manifest.music.title,'Ace Beneath the Sleeve');assert.equal(manifest.music.path,'menu.mp3');assert.equal(manifest.music.channels,2);assert.equal(manifest.music.sampleRate,44100);
});

const menuSource=fs.readFileSync(path.join(project,'js/ui/cosmos_menu.js'),'utf8');
function setup(options={}){
 const state={coins:4321,matches:17,owned:['frame-ink','mood-void','title-watch'],equipped:{title:'title-watch'}},mode={name:'Arena',tag:'Você × Bot',action:'play'};
 const preferences={motion:'full',reducedMotion:false,muted:false,musicMuted:false,volume:.38,musicVolume:.55};
 const store=new Map(options.store||[]),writes=[],interactions=[],animations=[],observers=new Set(),frames=new Map(),eventMaps=[];let serial=0;
 function events(){
  const handlers=new Map();eventMaps.push(handlers);
  return {addEventListener(type,fn){if(!handlers.has(type))handlers.set(type,new Set());handlers.get(type).add(fn);},removeEventListener(type,fn){handlers.get(type)?.delete(fn);},emit(type,event={}){for(const fn of [...(handlers.get(type)||[])])fn({type,...event});}};
 }
 class Element{
  constructor(){Object.assign(this,events());this.dataset={};this.attributes={};this.styles={};this.classes=new Set();this.isConnected=true;this.rect={width:1280,height:720};this.selectors={};this.classList={add:name=>this.classes.add(name),remove:name=>this.classes.delete(name),toggle:(name,on)=>on?this.classes.add(name):this.classes.delete(name)};this.style={setProperty:(name,value)=>{this.styles[name]=value;}};}
  matches(selector){return selector==='.cosmos-menu'&&this.isMenu;}
  querySelector(selector){return this.selectors[selector]||null;}
  closest(selector){return selector==='[data-cosmos-favorite]'&&this.isFavorite?this:null;}
  getBoundingClientRect(){return{...this.rect};}
  setAttribute(name,value){this.attributes[name]=value;}
  animate(keyframes,config){const animation={keyframes,config,paused:false,completed:false,cancelled:false,pause(){this.paused=true;},play(){this.paused=false;},cancel(){this.cancelled=true;this.oncancel?.();}};animations.push(animation);return animation;}
 }
 const menu=new Element(),image=new Element(),label=new Element(),favoriteButton=new Element(),announcement=new Element();menu.isMenu=true;favoriteButton.isFavorite=true;
 Object.assign(menu.selectors,{'.cosmos-favorite-image':image,'.cosmos-favorite-label strong':label,'[data-cosmos-favorite]':favoriteButton,'.cosmos-announcement':announcement});
 const document={...events(),hidden:false},globalEvents=events();
 const G={CONFIG:{version:'0.36.0'},Sanctuary:{read:()=>JSON.parse(JSON.stringify(state)),cosmetics:[{id:'title-watch',name:'Vigilante'}]},VisualShell:{getMode:()=>mode},PresentationFX:{getPreferences:()=>({...preferences}),interaction:(...args)=>interactions.push(args)}};
 Object.defineProperty(G,'state',{get(){throw Error('O menu não deve consultar a batalha.');}});
 for(const name of ['getNextActor','drawCard','rollDie','awardMatch','performBasicAttack'])G[name]=()=>{throw Error('O menu não deve executar '+name);};
 const context={GOGHOS:G,document,innerWidth:1280,innerHeight:720,...globalEvents,localStorage:{getItem:key=>store.get(key)||null,setItem(key,value){writes.push([key,value]);store.set(key,value);}},requestAnimationFrame(fn){const id=++serial;frames.set(id,fn);return id;},cancelAnimationFrame:id=>frames.delete(id),ResizeObserver:class{constructor(fn){this.fn=fn;}observe(){observers.add(this);}disconnect(){observers.delete(this);}}};
 vm.createContext(context);vm.runInContext(menuSource,context);
 return {M:G.CosmosMenu,G,state,mode,preferences,store,writes,interactions,animations,observers,frames,document,context,menu,image,label,favoriteButton,announcement,
  favorite(){menu.emit('click',{target:favoriteButton});},
  finish(){const next=animations.find(animation=>!animation.completed&&!animation.cancelled);assert(next,'animação esperada');next.completed=true;next.onfinish?.();},
  frame(){const pending=[...frames.values()];frames.clear();for(const fn of pending)fn();},
  resize(width,height){menu.rect={width,height};for(const observer of observers)observer.fn();},
  listeners(){return eventMaps.reduce((sum,map)=>sum+[...map.values()].reduce((n,set)=>n+set.size,0),0);}};
}

test('redesenhar o menu mostra moedas, partidas, coleção e título reais sem alterar o progresso',()=>{
 const q=setup(),before=JSON.stringify(q.state);
 for(let i=0;i<4;i++){
  const html=q.M.html();assert(html.includes('aria-label="4321 moedas. Abrir loja"'));assert(html.includes('>4.321</b>'));
  assert(html.includes('aria-label="17 partidas concluídas"'));assert(html.includes('aria-label="3 visuais na coleção"'));assert(html.includes('Coleção e perfil: Vigilante'));
  assert(!/>Player<|>350<|>1000<|>50<|>Level</.test(html));
 }
 assert.equal(JSON.stringify(q.state),before);assert.deepEqual(q.writes,[]);assert.deepEqual(q.interactions,[]);
 q.state.coins=765;q.state.matches=2;const html=q.M.html();assert(html.includes('aria-label="765 moedas. Abrir loja"'));assert(html.includes('aria-label="2 partidas concluídas"'));
});
test('os botões usam rotas reais e exibem o modo escolhido, sem implementar regras fictícias de 5x5',()=>{
 const q=setup();q.mode.name='Treino de campeões';q.mode.tag='Laboratório';q.mode.action='new-abilities';const html=q.M.html();
 const actions=new Set([...html.matchAll(/data-act="([^"]+)"/g)].map(match=>match[1]));
 assert.deepEqual([...actions].sort(),['sanctuary-collection','shop','settings','characters','ranked-preview','mode-open','play','sanctuary-lore','shell-intro'].sort());
 for(const action of actions)assert(new RegExp('<button\\b[^>]*data-act="'+action+'"').test(html),action+' precisa de botão nativo');
 assert(html.includes('aria-label="Jogar Treino de campeões"'));assert(html.includes('>Laboratório</small>'));assert(!html.includes('>5x5<'));
 assert(html.includes('alt="GOGHOS — The Nightmare Is Coming"'));assert(!html.includes('alt="Cosmos'));
 assert(html.includes('src="assets/menu-v036/bg.jpg"'));assert(html.includes('src="assets/menu-v036/logo.webp"'));
});
test('rótulos são escapados e um favorito salvo inválido não injeta URLs ou personagens',()=>{
 const q=setup({store:[['goghos.menu-favorite.v036','../../outro']]});q.G.Sanctuary.cosmetics[0].name='<script>perfil</script>';q.mode.name='Arena "especial" <img>';
 const html=q.M.html();assert(html.includes('&lt;script&gt;perfil&lt;/script&gt;'));assert(html.includes('Arena &quot;especial&quot; &lt;img&gt;'));
 assert(!html.includes('<script>'));assert(!html.includes('src="../../outro'));assert(html.includes('src="assets/menu-v036/character-0.webp"'));assert(html.includes('Atual: Unicorn'));
});
test('trocar favorito percorre os cinco personagens e salva somente a preferência local',()=>{
 const q=setup(),before=JSON.stringify(q.state);q.M.mount(q.menu);q.frame();
 for(const [id,name,index]of [['sam','Sam',1],['sarck','Sark',2],['nully','Nully',3],['mike','Mike',4],['unicorn','Unicorn',0]]){
  q.favorite();assert.equal(q.M.getDebugState().animations,1);q.finish();assert.equal(q.image.src,'assets/menu-v036/character-'+index+'.webp');assert.equal(q.label.textContent,name);
  q.finish();assert.equal(q.M.getDebugState().favorite,id);assert.equal(q.M.getDebugState().animations,0);assert.equal(q.store.get('goghos.menu-favorite.v036'),id);
 }
 assert.equal(JSON.stringify(q.state),before);assert(q.writes.every(([key])=>key==='goghos.menu-favorite.v036'));assert.equal(q.writes.length,5);
 q.M.detach();assert.equal(q.listeners(),0);assert.equal(q.observers.size,0);
 const reloaded=setup({store:[['goghos.menu-favorite.v036','nully']]});assert(reloaded.M.html().includes('src="assets/menu-v036/character-3.webp"'));assert(reloaded.M.html().includes('Atual: Nully'));
});
test('montar novamente o mesmo menu não duplica controles e o retrato é dimensionado sem girar a tela',()=>{
 const q=setup();assert.equal(q.M.mount(q.menu),true);const listeners=q.listeners();assert.equal(q.observers.size,1);assert.equal(q.frames.size,1);
 assert.equal(q.M.mount(q.menu),true);assert.equal(q.listeners(),listeners);assert.equal(q.observers.size,1);assert.equal(q.frames.size,1);
 q.resize(390,844);assert.equal(q.M.getDebugState().layout,'portrait');assert.equal(q.menu.dataset.layout,'portrait');assert.equal(Number(q.menu.styles['--cosmos-scale']),390/1920);
 q.resize(1920,1080);assert.equal(q.menu.dataset.layout,'landscape');assert.equal(q.menu.styles['--cosmos-scale'],'1');
 q.M.detach();assert.equal(q.frames.size,0);assert.equal(q.observers.size,0);assert.equal(q.listeners(),0);
});
test('o menu usa a preferência real de movimento e a mudança durante a troca cancela o efeito',()=>{
 const q=setup();q.preferences.motion='reduced';q.preferences.reducedMotion=true;q.M.mount(q.menu);q.favorite();
 assert.equal(q.M.getDebugState().favorite,'sam');assert.equal(q.M.getDebugState().animations,0);assert(q.menu.classes.has('cosmos-reduced'));
 q.preferences.motion='full';q.preferences.reducedMotion=false;q.context.emit('goghos:presentation-preferences');q.favorite();assert.equal(q.M.getDebugState().animations,1);
 q.preferences.motion='reduced';q.preferences.reducedMotion=true;q.context.emit('goghos:presentation-preferences');assert.equal(q.M.getDebugState().animations,0);assert(q.animations.every(animation=>animation.cancelled));
 q.favorite();assert.equal(q.M.getDebugState().favorite,'sarck');q.M.detach();assert.equal(q.listeners(),0);
});
test('ocultar a página pausa a troca e sair limpa animações, ouvintes e observadores',()=>{
 const q=setup();q.M.mount(q.menu);q.favorite();const animation=q.animations[0];
 q.document.hidden=true;q.document.emit('visibilitychange');assert(animation.paused);assert(q.menu.classes.has('cosmos-paused'));
 q.document.hidden=false;q.document.emit('visibilitychange');assert(!animation.paused);assert(!q.menu.classes.has('cosmos-paused'));
 q.M.detach();q.M.detach();assert(animation.cancelled);assert.equal(q.M.getDebugState().active,false);assert.equal(q.frames.size,0);assert.equal(q.listeners(),0);assert.equal(q.observers.size,0);
 animation.onfinish?.();assert.equal(q.writes.length,0,'um efeito antigo não deve trocar o favorito depois de sair');
});
test('o módulo funciona sem DOM, recursos remotos ou estilos que alterem as outras telas',()=>{
 const environment={GOGHOS:{CONFIG:{version:'0.36.0'}}};vm.createContext(environment);vm.runInContext(menuSource,environment);
 assert(environment.GOGHOS.CosmosMenu.html().includes('Menu principal de GOGHOS'));assert.equal(environment.GOGHOS.CosmosMenu.mount(null),false);environment.GOGHOS.CosmosMenu.detach();
 assert(!/\b(?:fetch|XMLHttpRequest|WebSocket)\s*\(|https?:\/\//i.test(menuSource));
 const css=fs.readFileSync(path.join(project,'css/cosmos_menu.css'),'utf8');
 assert(!/@import\b|https?:\/\//i.test(css));
 for(const [,ref]of css.matchAll(/url\(['"]?([^)'"\s]+)['"]?\)/g))assert(fs.existsSync(path.resolve(project,'css',ref)),ref+' ausente');
 // Remove os corpos de keyframes antes de conferir o escopo dos seletores.
 let scoped=css;
 for(let start=scoped.indexOf('@keyframes');start>=0;start=scoped.indexOf('@keyframes')){
  const brace=scoped.indexOf('{',start);let depth=1,end=brace+1;
  while(depth&&end<scoped.length){if(scoped[end]==='{')depth++;if(scoped[end]==='}')depth--;end++;}
  scoped=scoped.slice(0,start)+scoped.slice(end);
 }
 scoped=scoped.replace(/\/\*[\s\S]*?\*\//g,'');
 for(const [,selector]of scoped.matchAll(/([^{}]+)\{/g)){
  if(selector.trim().startsWith('@'))continue;
  let depth=0,part='';const selectors=[];
  for(const char of selector){
   if(char==='('||char==='[')depth++;
   if(char===')'||char===']')depth--;
   if(char===','&&depth===0){selectors.push(part);part='';}else part+=char;
  }
  selectors.push(part);
  for(const part of selectors)assert(part.includes('.cosmos-menu'),'seletor fora do menu: '+part.trim());
 }
});

test('a prévia Ranked usa a arte de troféu existente em vez de uma URL ausente',()=>{
 const context={GOGHOS:{}};vm.createContext(context);vm.runInContext(fs.readFileSync(path.join(project,'js/ui/visual_shell.js'),'utf8'),context);
 const html=context.GOGHOS.VisualShell.artIcon('trophy');
 const src=html.match(/src="([^"]+)"/)[1];assert.equal(src,'assets/menu-v036/trophy.webp');assert(fs.statSync(path.join(project,src)).isFile());
});

console.log(`${passed} testes do menu principal recebido passaram`);
