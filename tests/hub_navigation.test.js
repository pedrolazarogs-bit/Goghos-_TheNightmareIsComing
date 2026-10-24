// Guarda a economia e os cosméticos da versão publicada antes da reorganização do lobby.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
require('../js/data/characters.js');require('../js/data/gods.js');
const baseline=require('./fixtures/hub_v0271_baseline.json');
const plain=value=>JSON.parse(JSON.stringify(value));
let passed=0;
function test(name,fn){fn();passed++;console.log('OK  '+name);}
function create(store=new Map()){
 const G={CHARACTERS:plain(GOGHOS.CHARACTERS),GODS:plain(GOGHOS.GODS),MAIN_ABILITIES:plain(GOGHOS.MAIN_ABILITIES)};
 G.getMainAbility=c=>G.MAIN_ABILITIES[c.abilityId]||null;G.cardHTML=c=>'<div class="card">'+c.name+'</div>';
 let token=0;const context={GOGHOS:G,URL,document:{baseURI:'https://example.test/goghos/index.html',documentElement:{dataset:{},style:{setProperty(){}}}},crypto:{randomUUID:()=>`token-${++token}`},Math:Object.create(Math),localStorage:{getItem:key=>store.get(key)||null,setItem:(key,value)=>store.set(key,value)}};
 context.Math.random=()=>0;vm.createContext(context);vm.runInContext(fs.readFileSync('js/ui/sanctuary.js','utf8'),context);return{S:G.Sanctuary,G,store};
}
test('o novo lobby preserva preços, recompensa, chave de progresso e metadados exatos dos doze cosméticos',()=>{
 const {S}=create();for(const key of ['price','matchReward','storageKey'])assert.equal(S[key],baseline[key]);assert.deepEqual(plain(S.cosmetics),baseline.cosmetics);assert.deepEqual(plain(S.read()),baseline.initial);
});
test('abrir e equipar um baú mantém as mesmas transações da versão publicada, sem cobrança duplicada',()=>{
 const {S}=create(),first=S.handle('sanctuary-open-chest');assert.deepEqual({ok:first.ok,reward:plain(first.reward),state:plain(S.read())},baseline.firstChest);assert.equal(!S.handle('sanctuary-open-chest').ok,baseline.reopenBlocked);assert.deepEqual(plain(S.read()),baseline.firstChest.state);S.handle('sanctuary-keep');S.handle('sanctuary-equip-'+first.reward.id);assert.deepEqual(plain(S.read()),baseline.afterEquip);
});
test('o progresso antigo carrega e a recompensa de partida não se repete depois de recarregar a loja',()=>{
 const store=new Map([[baseline.storageKey,JSON.stringify(baseline.afterEquip)]]),{S}=create(store),token=S.newMatchToken(),award=S.awardMatch(token,'victory');assert.deepEqual({awarded:award.awarded,coins:award.coins,balance:award.balance,state:plain(S.read())},baseline.reward);const reloaded=create(store).S;assert.deepEqual({awarded:reloaded.awardMatch(token,'victory').awarded,state:plain(reloaded.read())},baseline.replayedAfterReload);
});
test('navegar pelo Santuário e pelas histórias deixa economia e catálogo de combate intactos',()=>{
 const {S,G}=create(),state=plain(S.read()),combat=JSON.stringify(G);for(let round=0;round<3;round++){for(const tab of ['vault','collection','story']){S.render(tab);S.homeBadgeHTML();S.handle('sanctuary-'+tab);}for(const action of ['story-next','story-prev','chapter-2','lore-sam','story-return'])assert(S.handle('sanctuary-'+action).ok);}assert.deepEqual(plain(S.read()),state);assert.equal(JSON.stringify(G),combat);
});
function shell(baseURI){
 const G={CHARACTERS:plain(GOGHOS.CHARACTERS),MAIN_ABILITIES:plain(GOGHOS.MAIN_ABILITIES),CLASS_LABEL:Object.fromEntries(GOGHOS.CHARACTERS.map(c=>[c.class,c.class])),CONFIG:{version:'0.27.1'}};
 G.getCharacterById=id=>G.CHARACTERS.find(c=>c.id===id);G.getMainAbility=c=>G.MAIN_ABILITIES[c.abilityId];G.rarityLabel=c=>c.rarity;
 const context={GOGHOS:G,URL,document:{baseURI}};vm.createContext(context);vm.runInContext(fs.readFileSync('js/ui/visual_shell.js','utf8'),context);return G.VisualShell;
}
test('os quatro modos do lobby apontam somente para as rotas já existentes e recusam escolhas inválidas',()=>{
 const S=shell('https://example.test/goghos/index.html');assert.equal(S.getMode().id,'arena');for(const [id,action] of Object.entries({arena:'play',champions:'new-abilities',support:'support-test',divine:'divine-test'})){assert(S.selectMode(id));assert.equal(S.getMode().id,id);assert.equal(S.getMode().action,action);assert(S.modesHTML().includes('data-act="mode-select-'+id+'" aria-pressed="true"'));}assert.equal(S.selectMode('pvp'),false);assert.equal(S.getMode().id,'divine');
});
test('as cenas do lobby e do seletor resolvem URLs de assets também em subpastas e projetos locais',()=>{
 for(const base of ['https://example.test/goghos/index.html','file:///tmp/Goghos/index.html']){const S=shell(base),html=S.modesHTML();for(const name of ['red-tree-field','crystal-valley','cosmic-rift'])assert(html.includes(new URL('assets/visual-v0.27/backgrounds/'+name+'.png',base).href));assert(S.homeHTML().includes(new URL('assets/visual-v0.27/backgrounds/red-tree-field.png',base).href));}
});
console.log(`${passed} testes de preservação do novo lobby passaram`);
