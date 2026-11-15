const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..');
const read=file=>fs.readFileSync(path.join(root,file),'utf8');
const context={GOGHOS:{},localStorage:{getItem:()=>null,setItem(){throw Error('O menu não pode alterar o progresso');}}};
vm.createContext(context);
for(const file of ['js/config.js','js/ui/cosmos_menu.js','js/ui/presentation_fx.js'])vm.runInContext(read(file),context);
const G=context.GOGHOS,html=G.CosmosMenu.html(),index=read('index.html');
assert.equal(G.CONFIG.version,JSON.parse(read('package.json')).version);
assert.doesNotMatch(html,/<button\b|<a\b|data-act=|data-cosmos-favorite|role="button"|tabindex="0"/);
for(const label of ['Loja','Deck','Ranked','Play','GOGHOS'])assert(html.includes(label));
for(const file of ['js/core/battle.js','js/core/arena_five.js','js/ui/arena_five.js','js/ui/shop.js','js/ui/visual_shell.js','js/ui/sanctuary.js','js/ui/ui.js','js/data/characters.js'])assert(!fs.existsSync(path.join(root,file)),file+' não deve acompanhar esta edição');
for(const match of index.matchAll(/(?:src|href)="([^"]+)"/g))assert(fs.existsSync(path.join(root,match[1])),match[1]);
assert.doesNotMatch(read('js/ui/menu_shell.js'),/data-act|location\.|pushState|VictoryPresenter|addEventListener/);
console.log('OK menu sem acessos e pacote sem telas ou motores de jogo');
const assets=JSON.parse(read('tests/fixtures/presentation-assets.json'));
for(const asset of assets){
 const bytes=fs.readFileSync(path.join(root,asset.path));
 assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),asset.sha256,asset.path+' deve preservar o recurso original');
}
assert.equal(assets.filter(asset=>asset.path.endsWith('.mp3')).length,11);
console.log('OK todos os áudios e recursos originais de abertura, menu e vitória preservados');
const prefs=G.PresentationFX.normalizePreferences({volume:5,musicVolume:-3,motion:'reduced'});
assert.equal(prefs.volume,1);assert.equal(prefs.musicVolume,0);assert.equal(prefs.motion,'reduced');
assert.equal(G.PresentationFX.normalizePreferences({motion:false}).motion,'reduced');
assert.equal(G.PresentationFX.normalizePreferences(null).volume,.38);
assert.equal(G.PresentationFX.interaction(),false);
console.log('OK preferências e áudio funcionam sem dependências de partida');
