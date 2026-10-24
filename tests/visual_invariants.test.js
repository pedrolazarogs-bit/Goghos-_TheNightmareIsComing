// A renovação visual não altera o jogo: a fixture é uma referência, nunca substitui os dados vivos.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..'),baseline=require('./fixtures/visual_v027_invariants.json');
const sha=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const normalizeVersion=source=>source.replace(/\bversion\s*:\s*(['"])[^'"]+\1/g,"version:'VERSION'");
const walk=dir=>fs.readdirSync(path.join(root,dir),{withFileTypes:true}).flatMap(entry=>entry.isDirectory()?walk(path.join(dir,entry.name)):[path.join(dir,entry.name)]).sort();
let passed=0;const test=(name,run)=>{run();passed++;console.log('OK  '+name);};

test('os dez arquivos do motor de batalha permanecem idênticos à versão antes da renovação visual',()=>{
 const sources=walk('js/core').filter(file=>file.endsWith('.js'));assert.deepEqual(sources,Object.keys(baseline.core).sort());
 for(const [file,expected]of Object.entries(baseline.core))assert.equal(sha(fs.readFileSync(path.join(root,file))),expected,file+' alterou regras de combate');
});
test('fontes de dados preservam números, efeitos e funções, permitindo somente a identificação da versão',()=>{
 for(const [file,expected]of Object.entries(baseline.dataSource))assert.equal(sha(normalizeVersion(fs.readFileSync(path.join(root,file),'utf8'))),expected,file+' alterou dados além da versão');
});

test('catálogo vivo, tributos, Apoios, montes e configuração mantêm exatamente o balanceamento anterior',()=>{
 for(const name of ['characters','gods','support_cards','reset_cards'])require(path.join(root,'js/data/'+name+'.js'));
 const current=JSON.parse(JSON.stringify(Object.fromEntries(Object.entries(globalThis.GOGHOS).filter(([,value])=>typeof value!=='function'))));delete current.CONFIG.version;
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
