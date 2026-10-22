const assert = require('assert');
let html = '', handler = null, timers = [];
globalThis.document = { getElementById: () => ({ set innerHTML(v){html=v;}, get innerHTML(){return html;}, addEventListener:(t,f)=>{handler=f;}, querySelector:()=>null }) };
globalThis.confirm = () => true; globalThis.alert = m => { throw new Error('unexpected alert: '+m); };
globalThis.setTimeout = f => {timers.push(f);return timers.length;}; globalThis.clearTimeout = () => {timers=[];};
let seed=1701; Math.random=()=>{seed|=0;seed=seed+0x6D2B79F5|0;let x=Math.imul(seed^seed>>>15,1|seed);x=x+Math.imul(x^x>>>7,61|x)^x;return((x^x>>>14)>>>0)/4294967296;};
['data/characters','data/support_cards','data/reset_cards','core/battle','core/deck','core/support','core/roster','core/selection','core/ai','ui/card','ui/support_ui','ui/hand_ui','ui/match_ui','ui/shop','ui/ui'].forEach(f=>require('../js/'+f+'.js'));
const G=globalThis.GOGHOS; let passed=0;
function test(n,f){f();passed++;console.log('OK  '+n);}
function click(selector, data, disabled=false){handler({target:{closest:s=>s===selector?{dataset:data,disabled}:null}});}
const action=a=>{assert(html.includes(`data-act="${a}"`),`missing action ${a}`);const disabled=new RegExp(`data-act="${a}" disabled`).test(html);click('[data-act]',{act:a},disabled);};
const runTimers=()=>{const xs=timers.splice(0);xs.forEach(f=>f());};
const pick=id=>click('.card',{id});
function selectAndFight(){action('play');let ids=[...html.matchAll(/class="card ([^"]*)" data-id="([^"]+)"/g)].filter(m=>!m[1].includes('sel')).map(m=>m[2]);pick(ids[0]);runTimers();ids=[...html.matchAll(/class="card ([^"]*)" data-id="([^"]+)"/g)].filter(m=>!m[1].includes('sel')).map(m=>m[2]);pick(ids[0]);runTimers();assert(html.includes('data-act="fight"'));action('fight');}
test('a tela de batalha tem leque da mão e registro de eventos, sem painel lateral de Apoio',()=>{
  selectAndFight(); assert(html.includes('class="mao')); assert(html.includes('class="event-feed"')); assert(!html.includes('class="apoio"')); assert(html.includes('Registro da batalha'));
});
test('uma carta de Apoio comprada entra no leque, pode ser selecionada e usada',()=>{
  // Recomeça uma luta e faz o primeiro reset comprar uma Na Moloeira para o jogador.
  action('menu'); G.CONFIG.resetDraw.onBattleStart=true;
  const create=G.createDeckState;
  G.createDeckState=(rng)=>{const d=create(rng);const incoming=d.pile.findIndex(c=>c.id==='na_moloeira');const c=d.pile.splice(incoming,1)[0];d.pile.push(c);return d;};
  try{
    action('play');let ids=[...html.matchAll(/class="card ([^"]*)" data-id="([^"]+)"/g)].filter(m=>!m[1].includes('sel')).map(m=>m[2]);pick(ids[0]);runTimers();ids=[...html.matchAll(/class="card ([^"]*)" data-id="([^"]+)"/g)].filter(m=>!m[1].includes('sel')).map(m=>m[2]);pick(ids[0]);runTimers();action('fight');let wait=0;while(!html.includes('data-act="attack"')&&wait++<10)runTimers();
    assert(html.includes('Na Moloeira'));const m=html.match(/class="hcard[^\"]*" data-hand="([^"]+)"[^>]*title="Na Moloeira/);assert(m,'support card in hand');
    click('[data-hand]',{hand:m[1]});assert(html.includes('data-act="usehand"'));action('usehand');assert(html.includes('BÔNUS')||html.includes('próximo ataque causa +20'));
  } finally {G.createDeckState=create;G.CONFIG.resetDraw.onBattleStart=false;}
});
test('a coleção mostra as três cartas ilustradas',()=>{
  action('menu');action('characters');
  assert(html.includes('Sam')&&html.includes('Eletric')&&html.includes('Sarck'));
  assert(html.includes('assets/characters/eletric.png')&&html.includes('assets/characters/sarck.png'));
  action('menu');assert(html.includes('data-act="play"'));
});
console.log(`${passed} testes da interface v0.14.0 passaram`);
