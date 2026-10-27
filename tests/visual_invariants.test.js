// A fixture histórica fica intacta; somente mudanças de regra explicitamente autorizadas são aceitas.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..'),baseline=require('./fixtures/visual_v027_invariants.json');
const sha=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const normalizeVersion=source=>source.replace(/\bversion\s*:\s*(['"])[^'"]+\1/g,"version:'VERSION'");
const walk=dir=>fs.readdirSync(path.join(root,dir),{withFileTypes:true}).flatMap(entry=>entry.isDirectory()?walk(path.join(dir,entry.name)):[path.join(dir,entry.name)]).sort();
let passed=0;const test=(name,run)=>{run();passed++;console.log('OK  '+name);};

test('o motor preserva a referência visual, exceto o bloqueio de Parry contra Destruidores solicitado pelo criador',()=>{
 const sources=walk('js/core').filter(file=>file.endsWith('.js'));assert.deepEqual(sources,Object.keys(baseline.core).sort());
 for(const [file,expected]of Object.entries(baseline.core)){
  let source=fs.readFileSync(path.join(root,file),'utf8');
  if(file==='js/core/battle.js'){
   const approved="function parryInfo(a,t){\n  if(G.hasClass(a,'DESTROYER')||G.isReactionBlocked?.(t))return null;";
   assert(source.includes(approved),'A exceção autorizada deve existir somente em parryInfo.');
   source=source.replace(approved,"function parryInfo(a,t){\n  if(G.isReactionBlocked?.(t))return null;");
  }
  assert.equal(sha(source),expected,file+' alterou regras além da exceção autorizada de Parry');
 }

});
test('dados preservam a referência, exceto a versão e a Velocidade 3 de Striker autorizada pelo criador',()=>{
 for(const [file,expected]of Object.entries(baseline.dataSource)){
  let source=normalizeVersion(fs.readFileSync(path.join(root,file),'utf8'));
  if(file==='js/data/characters.js'){
   const approved='{"id":"striker","assetKey":"sheriff_epic","rarity":"EPIC","class":"DESTROYER","maxHp":210,"damage":220,"speed":3,"stamina":4,"rename":true}';
   assert.equal(source.split(approved).length-1,1,'A exceção de Striker deve alterar somente seu registro oficial.');
   source=source.replace(approved,approved.replace('"speed":3','"speed":2'));
  }
  assert.equal(sha(source),expected,file+' alterou dados além da versão e do ajuste autorizado de Striker');
 }
});

test('catálogo, tributos, Apoios e montes preservam o balanceamento, exceto Striker de Velocidade 2 para 3',()=>{
 for(const name of ['characters','gods','support_cards','reset_cards'])require(path.join(root,'js/data/'+name+'.js'));
 const current=JSON.parse(JSON.stringify(Object.fromEntries(Object.entries(globalThis.GOGHOS).filter(([,value])=>typeof value!=='function'))));delete current.CONFIG.version;
 // O snapshot original permanece intacto; somente os dois registros vivos aprovados são normalizados.
 for(const records of [current.CHARACTERS,current.MASTER_UPGRADE]){
  const striker=records.find(c=>c.id==='striker');assert.equal(striker.speed,3);striker.speed=2;
 }
 assert.deepEqual(current,baseline.data);
 assert.equal(current.CHARACTERS.length,31);assert.equal(current.GODS.length,1);assert.equal(current.SUPPORT_CARDS.length,17);
});
test('as 71 imagens originais de cartas continuam intactas, sem mudanças de ilustração ou números impressos',()=>{
 for(const [file,expected]of Object.entries(baseline.originalCards))assert.equal(sha(fs.readFileSync(path.join(root,file))),expected,file+' foi alterado');
});
test('os 106 arquivos recebidos têm origem registrada, tamanho e SHA-256 corretos no projeto',()=>{
 const catalog=JSON.parse(fs.readFileSync(path.join(root,'assets/visual-v0.27/manifest.json'),'utf8'));
 assert.equal(catalog.sourceFiles,106);assert.equal(catalog.assets.length,106);assert.equal(new Set(catalog.assets.map(a=>a.archive+'/'+a.source)).size,106);
 assert.equal(catalog.assets.filter(a=>a.action==='import-original').length,85);assert.equal(catalog.assets.filter(a=>a.action==='reuse-existing').length,21);
 for(const asset of catalog.assets){
  assert(['import-original','reuse-existing'].includes(asset.action));assert.match(asset.sha256,/^[a-f0-9]{64}$/);assert(asset.size>0);
  const file=path.resolve(root,asset.asset);assert(file.startsWith(root+path.sep),asset.asset+' sai do projeto');const bytes=fs.readFileSync(file);
  assert.equal(bytes.length,asset.size,asset.asset+' tem tamanho incorreto');assert.equal(sha(bytes),asset.sha256,asset.asset+' difere do arquivo recebido');
  if(asset.asset.endsWith('.png')){assert.equal(bytes.readUInt32BE(16),asset.width,asset.asset+' largura');assert.equal(bytes.readUInt32BE(20),asset.height,asset.asset+' altura');}
 }
});
console.log(`${passed} testes de preservação das regras e cartas passaram`);
