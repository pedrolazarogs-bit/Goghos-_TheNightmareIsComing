// As novas artes entram como apresentação; arquivos recebidos permanecem intactos.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..'),assetRoot='assets/visual-v0.28/';
const sha=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
let passed=0;const test=(name,run)=>{run();passed++;console.log('OK  '+name);};

test('logo e selo Beta são os dois WebPs recebidos, sem recomposição ou alteração dos pixels',()=>{
 const expected={
  'logo-without-mercy.webp':['bfcf8b1f2eecf2c99584debf1d639a31f73e11789da2dfe90b602762d8745843',181472],
  'beta.webp':['58ed69eb80714cffb4b21c6cc54167e11dd240001cf215aaea85efae5c6daf0f',23796]
 };
 for(const [file,[digest,size]]of Object.entries(expected)){
  const bytes=fs.readFileSync(path.join(root,assetRoot,file));
  assert.equal(bytes.length,size,file);assert.equal(sha(bytes),digest,file);
  assert.equal(bytes.subarray(0,4).toString(),'RIFF');assert.equal(bytes.subarray(8,12).toString(),'WEBP');
 }
});

test('as três referências de ícones, energia e painel continuam iguais aos anexos',()=>{
 const expected={
  'ui-icons-reference.jpg':'8d5fc2e1ad019c945fc04c64511dcab2a83a0b977fc95d62917e056fca7f7c1b',
  'energy-flame-reference.jpg':'02d8cbc4cd47dd79079f05d46625bc11c8d1f10cae5357c16e0936f708fc0ba2',
  'panel-reference.jpg':'bcb944662b3001250a8f507f120c4ff868ff183d867cc2c6127a4b58980dd266'
 };
 for(const [file,digest]of Object.entries(expected))assert.equal(sha(fs.readFileSync(path.join(root,assetRoot,'references',file))),digest,file);
});

test('ícones e ornamentos são vetores locais sem scripts, imagens remotas ou chamadas externas',()=>{
 for(const dir of ['icons','ornaments']){
  const files=fs.readdirSync(path.join(root,assetRoot,dir)).filter(name=>name.endsWith('.svg'));
  assert(files.length>0,dir+' vazio');
  for(const name of files){
   const file=assetRoot+dir+'/'+name,source=fs.readFileSync(path.join(root,file),'utf8');
   assert.match(source,/<svg\b/);assert.match(source,/\bviewBox\s*=/,file+' não escala');
   assert(!/<(?:script|foreignObject)\b|\bon[a-z]+\s*=/i.test(source),file+' tem conteúdo executável');
   assert(!/(?:href|src)\s*=\s*["'](?:https?:|\/\/|data:)|url\(\s*["']?(?:https?:|\/\/)/i.test(source),file+' depende de conteúdo externo');
  }
 }
});

test('HTML, módulos de apresentação e folhas de estilo carregam somente arquivos locais existentes',()=>{
 const index=fs.readFileSync(path.join(root,'index.html'),'utf8');
 const refs=[...index.matchAll(/<(?:script|link)\b[^>]*\b(?:src|href)=["']([^"']+)["'][^>]*>/gi)].map(m=>m[1]);
 assert(refs.length>0);
 for(const ref of refs){
  assert(!/^(?:https?:|\/\/|data:)/i.test(ref),'recurso remoto no HTML: '+ref);
  const file=path.resolve(root,ref.split(/[?#]/)[0]);assert(file.startsWith(root+path.sep),ref+' sai do projeto');
  assert(fs.statSync(file).isFile(),ref+' ausente');
  if(!/\.(?:css|js)$/.test(file))continue;
  const source=fs.readFileSync(file,'utf8');
  assert(!/\b(?:fetch|XMLHttpRequest|WebSocket)\s*\(|@import\s+(?:url\()?\s*["']?https?:/i.test(source),ref+' inicia uma dependência de rede');
  if(!file.endsWith('.css'))continue;
  for(const match of source.matchAll(/url\(\s*["']?([^\s"')]+)["']?\s*\)/gi)){
   const target=match[1];if(target.startsWith('#')||target.startsWith('data:')||target.includes('${'))continue;
   assert(!/^(?:https?:|\/\/)/i.test(target),ref+' usa URL remota');
   assert(fs.existsSync(path.resolve(path.dirname(file),target.split(/[?#]/)[0])),ref+' referencia '+target+' ausente');
  }
 }
});
console.log(`${passed} testes dos recursos da interface cartoon passaram`);
