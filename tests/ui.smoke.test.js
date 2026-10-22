// Teste de fumaça da interface com um DOM simulado (NÃO é um navegador real): percorre menu, loja, seleção inicial, batalhas completas
// (Daly Mãe, recuperação, eliminados) e o retorno ao menu. Math.random é fixado por uma semente para o teste ser reproduzível.
const assert=require('assert');
let html='',handler=null,q=[];
globalThis.document={getElementById:()=>({set innerHTML(v){html=v;},get innerHTML(){return html;},addEventListener:(t,f)=>{handler=f;},querySelector:()=>null})};
globalThis.confirm=()=>true;globalThis.alert=m=>{throw new Error('alert: '+m);};
globalThis.setTimeout=f=>{q.push(f);return q.length;};globalThis.clearTimeout=()=>{q.length=0;}; // clearTimeout cancela o que estava agendado (a UI só mantém 1 timer)
let seed=20261021;Math.random=()=>{seed|=0;seed=seed+0x6D2B79F5|0;let x=Math.imul(seed^seed>>>15,1|seed);x=x+Math.imul(x^x>>>7,61|x)^x;return((x^x>>>14)>>>0)/4294967296;};
['data/characters','data/support_cards','data/reset_cards','core/battle','core/deck','core/support','core/roster','core/selection','core/ai','ui/card','ui/support_ui','ui/hand_ui','ui/match_ui','ui/shop','ui/ui'].forEach(f=>require('../js/'+f+'.js'));
const G=globalThis.GOGHOS,REAL=G.CHARACTERS,off=a=>new RegExp(`data-act="${a}" disabled`).test(html);
const act=a=>{assert(html.includes(`data-act="${a}"`),'botão ausente: '+a);handler({target:{closest:s=>s==='[data-act]'?{dataset:{act:a},disabled:off(a)}:null}});};
const sup=i=>handler({target:{closest:s=>s==='[data-sup]'?{dataset:{sup:String(i)}}:null}});
const pick=id=>handler({target:{closest:s=>s==='.card'?{dataset:{id}}:null}});
const daly=side=>handler({target:{closest:s=>s==='[data-daly]'?{dataset:{daly:side}}:null}});
const drain=()=>{const f=q.splice(0);f.forEach(x=>x());};let n=0;const t=(m,f)=>{f();n++;console.log('OK  '+m);};
const offered=()=>[...html.matchAll(/class="card [^"]*" data-id="([^"]+)"/g)].map(m=>m[1]);
const mk=(id,x={})=>Object.freeze({id,name:id,class:'FIGHTER',maxHp:400,damage:60,speed:3,art:'x.png',description:'',rarity:'COMMON',stamina:10,mainAbility:null,tribute:null,...x});
const startSel=()=>{act('play');};
const choose=()=>{ // jogador escolhe o 1º disponível; o bot responde pelo timer
  const cards=[...html.matchAll(/class="card ([^"]*)" data-id="([^"]+)"/g)].filter(m=>!/\bsel\b/.test(m[1])).map(m=>m[2]);pick(cards[0]);drain();};
const toBattle=()=>{startSel();choose();choose();assert(html.includes('Equipe adversária'));act('fight');};
let sawRecov=false,sawExposed=false,sawElim=false;
const playOut=()=>{let g=0;while(!/<h1>(VITÓRIA|DERROTA)<\/h1>/.test(html)&&g++<4000){
  if(html.includes('class="recov"')){sawRecov=true;const m=[...html.matchAll(/data-act="(recover-[ABC])"(?! disabled)/g)];assert(m.length,'recuperação sem opção');act(m[0][1]);assert(!html.includes('class="recov"'));}
  else if(html.includes('data-act="attack"')){
    if(/class="elim"[\s\S]*class="chip"/.test(html))sawElim=true;
    const m=html.match(/class="card [^"]*pick[^"]*" data-id="(enemy_\d+)"/);
    if(m)pick(m[1]);else{assert(html.includes('class="daly exposed pick"'),'sem alvo');sawExposed=true;daly('enemy');}
    act('attack');}
  else drain();}
  assert(g<4000,'a partida não terminou');assert(/<h1>(VITÓRIA|DERROTA)<\/h1>/.test(html));};
t('menu mostra Jogar e Loja',()=>{assert(html.includes('>Jogar<')&&html.includes('>Loja<'));});
t('Loja abre ("Em breve") e volta ao menu',()=>{act('shop');assert(html.includes('Em breve'));act('menu');assert(html.includes('>Jogar<'));});
t('Jogar: sorteia 5 Comuns; jogador escolhe, bot responde, jogador escolhe, bot responde; só então mostra as equipes (2 na frente, retaguarda vazia)',()=>{
  startSel();const five=offered();assert.strictEqual(five.length,5);assert(five.every(id=>G.getCharacterById(id).rarity==='COMMON'));assert(html.includes('Sua vez')&&html.includes('escolha 1 de 4'));
  assert(!html.includes('Equipe adversária'));const first=five[0];pick(first);assert(html.includes('O adversário está escolhendo')&&html.includes('escolha 2 de 4'));
  pick(five[1]);assert(html.includes('O adversário está escolhendo'),'fora da vez nada acontece');drain();assert(html.includes('Sua vez')&&html.includes('escolha 3 de 4'));
  assert.strictEqual((html.match(/class="card sel/g)||[]).length,2);pick(first);assert(html.includes('indisponível')||html.includes('Personagem'));
  const free=[...html.matchAll(/class="card ([^"]*)" data-id="([^"]+)"/g)].filter(m=>!/\bsel\b/.test(m[1])).map(m=>m[2]);pick(free[0]);drain();
  assert(html.includes('Sua equipe')&&html.includes('Equipe adversária'));assert.strictEqual((html.match(/Retaguarda: vazia/g)||[]).length,2);assert.strictEqual((html.match(/class="card/g)||[]).length,4);assert(html.includes('data-act="fight"'));});
t('Jogar com menos de 4 Comuns: mensagem explicativa e a batalha não começa',()=>{
  act('play');act('menu'); // da tela de confirmação: Voltar → nova seleção → Menu
  G.CHARACTERS=[mk('a'),mk('b'),mk('c'),mk('r',{rarity:'RARE'}),mk('e',{rarity:'EPIC'})];try{startSel();assert(html.includes('Não foi possível iniciar')&&html.includes('Comuns suficientes'));assert(!html.includes('data-act="fight"'));}finally{G.CHARACTERS=REAL;}
  act('menu');assert(html.includes('>Jogar<'));});
t('batalha: painéis de Daly Mãe (3 vidas, protegidas), Personagens Eliminados, montes de personagens, Apoio e Mão; Daly protegida não é alvo',()=>{
  act('play');choose();choose();act('fight');let g=0;while(!html.includes('data-act="attack"')&&g++<50)drain();
  assert(html.includes('Sua Daly Mãe · 3/3')&&html.includes('Daly Mãe adversária · 3/3')&&html.includes('protegida'));assert(html.includes('Personagens Eliminados'));
  assert(html.includes('Personagens: Comum')&&html.includes('Secreto 0')&&html.includes('class="mao"')&&html.includes('Retaguarda: vazia'));
  assert((html.match(/Restam 2\/2/g)||[]).length===3);sup(0);assert(html.includes('SELECIONADA'));act('usesup');assert(html.includes('Restam 1/2')&&html.includes('Já usou neste turno'));
  daly('enemy');assert(!html.includes('class="daly protected pick"')&&off('attack'),'Daly protegida não vira alvo');assert(!html.includes('exposed pick'));
  assert(off('swap'),'sem Suporte na retaguarda no começo: troca indisponível');});
t('partidas completas pela interface: Daly Mãe exposta vira alvo, recuperação aparece para o jogador, eliminados listados, resultado correto; "Nova partida" e "Menu" limpam tudo',()=>{
  let matches=0;playOut();matches++;
  while(!(sawRecov&&sawExposed&&sawElim)&&matches<30){assert(/data-act="play"/.test(html));act('play');assert(html.includes('escolha 1 de 4'),'nova partida começa por uma seleção nova');choose();choose();act('fight');playOut();matches++;}
  assert(sawRecov&&sawExposed&&sawElim,`cenários não vistos (recuperação ${sawRecov}, Daly exposta ${sawExposed}, eliminados ${sawElim})`);
  assert(/a (sua|Daly Mãe adversária)|Daly Mãe/.test(html)&&html.includes('foi derrotada')&&html.includes('Daly Mãe — você'));
  act('menu');assert(html.includes('>Jogar<')&&!html.includes('Daly'));act('play');assert(html.includes('escolha 1 de 4')&&!html.includes('Equipe adversária'));act('menu');});
t('Sair da batalha em andamento volta ao menu e limpa a partida',()=>{act('play');choose();choose();act('fight');act('menu');assert(html.includes('>Jogar<'));act('play');assert(html.includes('escolha 1 de 4'));act('menu');});
t('Mago: botões de mana na vez do Mago; o ataque gasta a mana escolhida',()=>{
  G.CHARACTERS=[mk('mg',{class:'MAGO',speed:99,damage:70}),mk('a'),mk('b'),mk('c')];
  try{act('play');const ids=offered();assert.strictEqual(ids.length,4);pick('mg');drain();choose();act('fight');let g=0;while(!html.includes('data-act="attack"')&&g++<50)drain();
    assert(html.includes('Mana 0/2'));assert(off('mana-'));act('mana+');act('mana+');assert(html.includes('Mana 2/2')&&html.includes('Dano previsto'));
    const m=html.match(/class="card [^"]*pick[^"]*" data-id="(enemy_\d+)"/);pick(m[1]);act('attack');assert(html.includes('com 2 de mana'));act('menu');}
  finally{G.CHARACTERS=REAL;}});
console.log(n+' testes de interface passaram');
