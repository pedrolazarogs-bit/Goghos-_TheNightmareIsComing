// A nova vitrine não define economia ou recompensas antes das regras do usuário.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const source=fs.readFileSync('js/ui/sanctuary.js','utf8');
let passed=0;const test=(name,fn)=>{fn();passed++;console.log('OK  '+name);};
function create(){
 const store=new Map(),G={CHARACTERS:[],GODS:[]},context={GOGHOS:G,Math:Object.create(Math),localStorage:{getItem:key=>store.get(key)||null,setItem:(key,value)=>store.set(key,value)}};
 context.Math.random=()=>0;vm.createContext(context);vm.runInContext(source,context);return G.Sanctuary;
}
test('a loja destaca os quatro baús corretos e mantém os visuais anteriores recolhidos',()=>{
 const S=create(),html=S.render('vault');
 assert.deepEqual(Array.from(S.chestShowcase,c=>c.name),['Comum','Pro','Plus','Plus+']);
 assert.equal((html.match(/class="shop-chest-option"/g)||[]).length,4);
 assert(html.indexOf('shop-chest-showcase')<html.indexOf('shop-featured'));
 assert.match(html,/<details class="shop-cosmetic-vault">/);
 assert.match(html,/<button class="shop-chest-pending" disabled/);
 for(const chest of S.chestShowcase){assert(!('price' in chest));assert(!('reward' in chest));assert(!('drops' in chest));}
});
test('escolher cada prévia troca somente a apresentação e nunca consome moedas ou sorteia recompensas',()=>{
 const S=create(),before=JSON.stringify(S.read());
 for(const chest of S.chestShowcase){
  const r=S.handle('sanctuary-chest-preview-'+chest.id);assert(r.handled&&r.ok);assert.equal(r.reward,null);
  assert(r.html.includes('data-chest-focus="'+chest.id+'"'));
  assert.match(r.html,new RegExp('data-chest="'+chest.id+'"[^>]*aria-pressed="true"'));
  assert.equal(JSON.stringify(S.read()),before);
 }
 for(const id of ['bad','../../open-chest','<script>']){assert.equal(S.handle('sanctuary-chest-preview-'+id).ok,false);assert.equal(JSON.stringify(S.read()),before);}
 assert.equal(S.handle('sanctuary-chest-open-common').handled,false);
 assert.equal(JSON.stringify(S.read()),before);
});
test('os novos baús usam quatro artes diferentes, locais, acessíveis e sem conteúdo executável',()=>{
 const S=create(),files=new Set(),arts=new Set();
 for(const chest of S.chestShowcase){
  const file=path.resolve(chest.art);assert(file.startsWith(path.resolve('assets/night-ui/chests')+path.sep));assert(fs.existsSync(file));
  const art=fs.readFileSync(file,'utf8');assert.match(art,/<svg\b/);assert.match(art,/viewBox="0 0 360 300"/);assert.match(art,/<title\b/);assert.match(art,/<desc\b/);
  assert(!/<(?:script|foreignObject)\b|\bon[a-z]+\s*=/i.test(art));assert(!/(?:href|src)\s*=\s*["'](?:https?:|\/\/|data:)|url\(\s*["']?(?:https?:|\/\/)/i.test(art));
  files.add(file);arts.add(art);
 }
 assert.equal(files.size,4);assert.equal(arts.size,4);
});
test('a expansão dos cosméticos preserva o baú anterior e suas transações',()=>{
 const S=create(),before=S.read();assert.equal(before.coins,180);
 const featured=S.handle('sanctuary-featured');assert.match(featured.html,/<details class="shop-cosmetic-vault" open>/);
 const opened=S.handle('sanctuary-open-chest');assert(opened.ok&&opened.reward);assert.equal(S.read().coins,90);assert.equal(S.read().opened,1);
 assert(!S.handle('sanctuary-open-chest').ok);assert.equal(S.read().coins,90);
 S.handle('sanctuary-keep');const html=S.handle('sanctuary-category-frame').html;assert.match(html,/<details class="shop-cosmetic-vault" open>/);
});
console.log(`${passed} testes da vitrine de baús passaram`);
