// A fixture histórica fica intacta; somente mudanças de regra explicitamente autorizadas são aceitas.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..'),baseline=require('./fixtures/visual_v027_invariants.json'),approved=require('./fixtures/balance_v032_invariants.json');
const sha=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const normalizeVersion=source=>source.replace(/\bversion\s*:\s*(['"])[^'"]+\1/g,"version:'VERSION'");
const walk=dir=>fs.readdirSync(path.join(root,dir),{withFileTypes:true}).flatMap(entry=>entry.isDirectory()?walk(path.join(dir,entry.name)):[path.join(dir,entry.name)]).sort();
let passed=0;const test=(name,run)=>{run();passed++;console.log('OK  '+name);};

test('o motor corresponde ao balanceamento aprovado da v0.32.0, preservando a referência histórica',()=>{
 const sources=walk('js/core').filter(file=>file.endsWith('.js'));assert.deepEqual(sources,Object.keys(approved.core).sort());
 for(const [file,expected]of Object.entries(approved.core))assert.equal(sha(fs.readFileSync(path.join(root,file))),expected,file+' mudou após a revisão do balanceamento');
});
test('fontes dos dados correspondem aos ajustes aprovados, permitindo somente identificação de versão',()=>{
 for(const [file,expected]of Object.entries(approved.dataSource))assert.equal(sha(normalizeVersion(fs.readFileSync(path.join(root,file),'utf8'))),expected,file+' alterou dados além do balanceamento aprovado');
});
function dataSnapshot(){
 for(const name of ['characters','gods','support_cards','reset_cards'])require(path.join(root,'js/data/'+name+'.js'));
 const data=JSON.parse(JSON.stringify(Object.fromEntries(Object.entries(globalThis.GOGHOS).filter(([,value])=>typeof value!=='function'))));delete data.CONFIG.version;return data;
}
test('catálogo, tributos, Apoios e montes reproduzem o balanceamento aprovado da v0.32.0',()=>{
 const current=dataSnapshot();assert.deepEqual(current,approved.data);
 assert.equal(current.CHARACTERS.length,31);assert.equal(current.GODS.length,1);assert.equal(current.SUPPORT_CARDS.length,17);
});
test('Burn e personagens fora da revisão mantêm os valores da referência original',()=>{
 const current=dataSnapshot(),changed=new Set(['ddx','fonior','chama','zuri','daztirry','unicorn','rayvilin','linx','striker']);
 for(const old of baseline.data.CHARACTERS)if(!changed.has(old.id))assert.deepEqual(current.CHARACTERS.find(c=>c.id===old.id),old,old.name+' recebeu alteração não aprovada');
 assert.deepEqual(current.MAIN_ABILITIES.hypnosis,baseline.data.MAIN_ABILITIES.hypnosis);
 assert.deepEqual(current.GODS,baseline.data.GODS);assert.deepEqual(current.SUPPORT_CARDS,baseline.data.SUPPORT_CARDS);assert.deepEqual(current.RESET_CARDS,baseline.data.RESET_CARDS);
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
