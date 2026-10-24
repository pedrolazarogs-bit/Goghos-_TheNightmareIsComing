const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
require('../js/data/characters.js');require('../js/data/gods.js');
const source=fs.readFileSync('js/ui/sanctuary.js','utf8'),catalog=GOGHOS;
let passed=0;const test=(name,fn)=>{fn();passed++;console.log('OK  '+name);},plain=x=>JSON.parse(JSON.stringify(x));
function create(store=new Map(),blocked=false,baseURI=null){
 const props={},G={CHARACTERS:plain(catalog.CHARACTERS),GODS:plain(catalog.GODS),MAIN_ABILITIES:plain(catalog.MAIN_ABILITIES)};G.getMainAbility=c=>G.MAIN_ABILITIES[c.abilityId]||null;G.cardHTML=c=>'<div class="card">'+c.name+'</div>';
 let counter=0;const context={GOGHOS:G,URL,document:{baseURI,documentElement:{dataset:{},style:{setProperty:(k,v)=>props[k]=v}}},crypto:{randomUUID:()=>String(++counter)+'-'+Math.random()},Math:Object.create(Math)};context.Math.random=()=>0;
 if(blocked)Object.defineProperty(context,'localStorage',{get(){throw Error('storage disabled');}});else context.localStorage={getItem:key=>store.get(key)||null,setItem:(key,value)=>store.set(key,value)};
 vm.createContext(context);vm.runInContext(source,context);return{S:G.Sanctuary,G,store,props,document:context.document};
}
test('primeira visita tem 180 moedas, três visuais iniciais e renderizar não concede novas recompensas',()=>{
 const {S}=create();const before=plain(S.read());assert.equal(before.coins,180);assert.equal(before.owned.length,3);for(let n=0;n<6;n++){assert(S.render().includes('Santuário da noite'));S.homeBadgeHTML();S.render('collection');S.render('story');}assert.deepEqual(plain(S.read()),before);
});
test('baú entrega um cosmético e bloqueia abertura duplicada até guardar a descoberta',()=>{
 const {S}=create(),r=S.handle('sanctuary-open-chest');assert(r.ok&&r.reward);assert.equal(r.reward.kind,'frame');assert.equal(S.read().coins,90);assert.equal(S.read().owned.length,4);const before=plain(S.read());assert(!S.handle('sanctuary-open-chest').ok);assert.deepEqual(plain(S.read()),before);assert(S.handle('sanctuary-keep').ok);assert(S.handle('sanctuary-open-chest').ok);assert.equal(S.read().coins,0);assert.equal(S.read().owned.length,5);S.handle('sanctuary-keep');const empty=plain(S.read());assert(!S.handle('sanctuary-open-chest').ok);assert.deepEqual(plain(S.read()),empty);
});
test('equipar exige posse e aplica somente dados e variáveis visuais do perfil',()=>{
 const {S,props,document}=create();const before=plain(S.read());assert(!S.handle('sanctuary-equip-title-rift').ok);assert.deepEqual(plain(S.read()),before);const reward=S.handle('sanctuary-open-chest').reward;assert(S.handle('sanctuary-equip-'+reward.id).ok);assert.equal(S.read().equipped.frame,reward.id);assert.equal(document.documentElement.dataset.goghosFrame,reward.id);assert.equal(props['--cosmetic-trim'],reward.color);assert.equal(S.read().coins,90);
});
test('fundos cosméticos e das crônicas resolvem a URL a partir do documento, também em file://',()=>{
 for(const base of ['https://example.test/goghos/index.html','file:///tmp/Goghos/index.html']){const {S,props}=create(new Map(),false,base);S.applyCosmetics();assert.equal(props['--cosmetic-background'],'url('+JSON.stringify(new URL('assets/visual-v0.27/backgrounds/cosmic-rift.png',base).href)+')');const html=S.render('story');assert(html.includes(new URL('assets/visual-v0.27/backgrounds/crystal-valley.png',base).href));assert(!html.includes('css/assets/'));}
});
test('cada partida emitida concede 50 moedas uma só vez, inclusive após recarregar o módulo',()=>{
 const {S,store}=create(),token=S.newMatchToken();assert.equal(S.read().coins,180);const first=S.awardMatch(token,'victory');assert(first.awarded);assert.equal(first.coins,50);assert.equal(first.balance,230);for(let n=0;n<5;n++)assert(!S.awardMatch(token,'victory').awarded);assert.equal(S.read().coins,230);assert.equal(S.read().matches,1);const reload=create(store).S,replayed=reload.awardMatch(token,'victory');assert(!replayed.awarded&&replayed.already);assert.equal(reload.read().coins,230);assert(replayed.html.includes('+50 moedas'));
});
test('laboratórios sem token e resultados incompletos não concedem moedas',()=>{
 const {S}=create();for(const result of ['victory','defeat','draw'])assert(!S.awardMatch('laboratorio',result).awarded);const token=S.newMatchToken();for(const result of [null,undefined,'battle','ended',''])assert(!S.awardMatch(token,result).awarded);assert.equal(S.read().coins,180);assert(S.awardMatch(token,'draw').awarded);assert.equal(S.read().coins,230);
});
test('vitória, derrota e empate concluídos têm a mesma recompensa cosmética',()=>{
 const {S}=create();for(const result of ['victory','defeat','draw']){const token=S.newMatchToken();assert.equal(S.awardMatch(token,result).coins,50);}assert.equal(S.read().coins,330);assert.equal(S.read().matches,3);
});
test('coleção completa transforma repetidos em 30 moedas sem criar novas peças',()=>{
 const setup=create(),state=plain(setup.S.read());state.coins=1000;setup.store.set(setup.S.storageKey,JSON.stringify(state));const {S}=create(setup.store),seen=new Set();for(let n=0;n<9;n++){const r=S.handle('sanctuary-open-chest');assert(r.ok&&r.reward);assert(!seen.has(r.reward.id));seen.add(r.reward.id);assert(['frame','mood','title'].includes(r.reward.kind));S.handle('sanctuary-keep');}assert.equal(S.read().owned.length,12);const before=S.read().coins,r=S.handle('sanctuary-open-chest');assert(r.ok);assert.equal(r.reward,null);assert.equal(S.read().coins,before-60);assert.equal(S.read().owned.length,12);assert.equal(S.read().opened,10);assert(r.html.includes('+30 moedas'));
});
test('dados salvos inválidos são normalizados e não podem injetar visuais ou títulos',()=>{
 const setup=create(),key=setup.S.storageKey;setup.store.set(key,JSON.stringify({schema:1,coins:-20,owned:['bad','title-rift','title-rift'],equipped:{frame:'<bad>',mood:'mood-ember',title:'title-rift'},issued:['known',null,5,'known'],claimed:[],matches:-1,opened:'oops'}));const {S}=create(setup.store),s=plain(S.read());assert.equal(s.coins,0);assert.equal(s.owned.length,4);assert.equal(s.equipped.frame,'frame-ink');assert.equal(s.equipped.mood,'mood-void');assert.equal(s.equipped.title,'title-rift');assert.deepEqual(s.issued,['known']);assert.equal(s.matches,0);assert.equal(s.opened,0);assert(!S.render('collection').includes('<bad>'));
});
test('JSON corrompido ou armazenamento bloqueado mantém a interface e o progresso da sessão',()=>{
 const setup=create();setup.store.set(setup.S.storageKey,'{ broken');const corrupted=create(setup.store).S;assert.equal(corrupted.read().coins,180);assert(corrupted.render().includes('Santuário'));const {S}=create(new Map(),true);assert(S.handle('sanctuary-open-chest').ok);assert.equal(S.read().coins,90);assert(S.render().includes('Progresso desta sessão'));S.handle('sanctuary-keep');const token=S.newMatchToken();assert(S.awardMatch(token,'defeat').awarded);assert.equal(S.read().coins,140);assert(!S.awardMatch(token,'defeat').awarded);
});
test('crônicas usam somente o elenco oficial e não alteram personagens, regras ou atributos',()=>{
 const {S,G}=create(),before=JSON.stringify({chars:G.CHARACTERS,gods:G.GODS,abilities:G.MAIN_ABILITIES});for(let n=0;n<7;n++){const html=S.handle('sanctuary-story-next').html;assert(html.includes('Crônicas do protótipo'));assert(!/undefined|NaN/.test(html));}for(const c of [...G.CHARACTERS,...G.GODS]){const r=S.handle('sanctuary-lore-'+c.id);assert(r.ok);assert(r.html.includes(c.name));}assert(!S.handle('sanctuary-lore-petra').ok);assert(!S.handle('sanctuary-chapter--1').ok);assert.equal(S.handle('not-sanctuary').handled,false);S.handle('sanctuary-open-chest');const token=S.newMatchToken();S.awardMatch(token,'victory');assert.equal(JSON.stringify({chars:G.CHARACTERS,gods:G.GODS,abilities:G.MAIN_ABILITIES}),before);
});
console.log(`${passed} testes do Santuário passaram`);
