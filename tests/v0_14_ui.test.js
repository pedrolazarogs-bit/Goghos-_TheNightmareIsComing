const assert = require('assert');
let html = '', handler = null, timers = [];
globalThis.document = { getElementById: () => ({ set innerHTML(v){html=v;}, get innerHTML(){return html;}, addEventListener:(t,f)=>{if(t==='click')handler=f;}, querySelector:()=>null }) };
globalThis.confirm = () => true; globalThis.alert = m => { throw new Error('unexpected alert: '+m); };
globalThis.setTimeout = f => {timers.push(f);return timers.length;}; globalThis.clearTimeout = () => {timers=[];};
let seed=1701; Math.random=()=>{seed|=0;seed=seed+0x6D2B79F5|0;let x=Math.imul(seed^seed>>>15,1|seed);x=x+Math.imul(x^x>>>7,61|x)^x;return((x^x>>>14)>>>0)/4294967296;};
['data/characters','data/gods','data/support_cards','data/reset_cards','core/battle','core/character_abilities','core/deck','core/support','core/roster','core/official_abilities','core/support_effects','core/divine','core/selection','core/ai','ui/card','ui/support_ui','ui/hand_ui','ui/match_ui','ui/arena_ui','ui/arena_readers','ui/battle_feedback','ui/shop','ui/ui'].forEach(f=>require('../js/'+f+'.js'));
require('./fixtures/legacy_catalog.js');
const G=globalThis.GOGHOS; let passed=0;
function test(n,f){f();passed++;console.log('OK  '+n);}
function click(selector, data, disabled=false){handler({target:{closest:s=>s===selector?{dataset:data,disabled}:null}});}
const action=a=>{assert(html.includes(`data-act="${a}"`),`missing action ${a}`);const disabled=new RegExp(`data-act="${a}" disabled`).test(html);click('[data-act]',{act:a},disabled);};
const runTimers=()=>{const xs=timers.splice(0);xs.forEach(f=>f());};
const pick=id=>click('.card',{id});
function selectAndFight(){action('play');let ids=[...html.matchAll(/class="card ([^"]*)" data-id="([^"]+)"/g)].filter(m=>!m[1].includes('sel')).map(m=>m[2]);pick(ids[0]);runTimers();ids=[...html.matchAll(/class="card ([^"]*)" data-id="([^"]+)"/g)].filter(m=>!m[1].includes('sel')).map(m=>m[2]);pick(ids[0]);runTimers();assert(html.includes('data-act="fight"'));action('fight');}
test('a seleção mostra todos os Comuns, somente menu, cartas e Play após quatro escolhas',()=>{
  action('play');
  assert.equal((html.match(/class="card /g)||[]).length,G.CHARACTERS.filter(c=>c.rarity==='COMMON').length);
  assert(!html.includes('class="mao')&&!html.includes('deck-pile')&&!html.includes('data-act="fight"'));
  assert.deepEqual([...html.matchAll(/data-act="([^"]+)"/g)].map(m=>m[1]),['menu']);
  let ids=[...html.matchAll(/class="card ([^"]*)" data-id="([^"]+)"/g)].filter(m=>!m[1].includes('sel')).map(m=>m[2]);
  pick(ids[0]);runTimers();ids=[...html.matchAll(/class="card ([^"]*)" data-id="([^"]+)"/g)].filter(m=>!m[1].includes('sel')).map(m=>m[2]);pick(ids[0]);runTimers();
  assert.equal((html.match(/chosen-player/g)||[]).length,2);assert.equal((html.match(/chosen-enemy/g)||[]).length,2);
  assert.deepEqual([...html.matchAll(/data-act="([^"]+)"/g)].map(m=>m[1]),['menu','fight']);
  action('menu');
});
test('a batalha mantém o campo existente, mão, montes e registro sem uma segunda área de cartas',()=>{
  selectAndFight();assert(html.includes('class="mao'));assert(html.includes('inplace-arena'));assert(!html.includes('command-focus'));assert(!html.includes('command-stage'));assert(!html.includes('class="apoio"'));
  assert.equal((html.match(/class="formation-row /g)||[]).length,4);assert.equal((html.match(/class="deck-pile /g)||[]).length,G.RARITIES.length+1);
  assert(html.includes('class="event-feed"'));action('event-log');assert(html.includes('Registro da batalha'));action('close-drawer');
});
test('uma carta de Apoio comprada entra no leque, pode ser selecionada e usada',()=>{
  // Recomeça uma luta e faz o primeiro reset comprar uma Na Moloeira para o jogador.
  action('menu'); G.CONFIG.resetDraw.onBattleStart=true;
  const create=G.createDeckState,createBattle=G.createBattleState;let supportState;
  G.createBattleState=(...args)=>(supportState=createBattle(...args));
  G.createDeckState=(rng)=>{const d=create(rng);const incoming=d.pile.findIndex(c=>c.id==='na_moloeira');const c=d.pile.splice(incoming,1)[0];d.pile.push(c);return d;};
  try{
    action('play');let ids=[...html.matchAll(/class="card ([^"]*)" data-id="([^"]+)"/g)].filter(m=>!m[1].includes('sel')).map(m=>m[2]);pick(ids[0]);runTimers();ids=[...html.matchAll(/class="card ([^"]*)" data-id="([^"]+)"/g)].filter(m=>!m[1].includes('sel')).map(m=>m[2]);pick(ids[0]);runTimers();action('fight');let wait=0;while(!html.includes('data-act="attack"')&&wait++<10)runTimers();
    assert(html.includes('Na Moloeira'));const m=html.match(/class="hcard[^\"]*" data-hand="([^"]+)"[^>]*title="Na Moloeira/);assert(m,'support card in hand');
    click('[data-hand]',{hand:m[1]});assert(html.includes('data-act="usehand"'));action('usehand');assert.equal(G.teamSupport(supportState,'player').nextAttackBonus,20);assert(!supportState.deck.hands.player.some(c=>c.iid===m[1]));
  } finally {G.createDeckState=create;G.createBattleState=createBattle;G.CONFIG.resetDraw.onBattleStart=false;}
});
test('a coleção mostra todos os personagens ilustrados',()=>{
  action('menu');action('characters');
  assert(html.includes('Sam')&&html.includes('Elétrica')&&html.includes('Sark')&&html.includes('John'));
  for(const c of G.CHARACTERS.filter(c=>c.illustrated))assert(html.includes(c.cardBase?.src||c.art));
  action('menu');assert(html.includes('data-act="play"'));
});
test('o clique de recuperação entrega as cartas restantes e retoma a batalha',()=>{
  const create=G.createBattleState;let state;
  G.createBattleState=(...args)=>{
    const s=state=create(...args);
    s.units.filter(u=>u.team==='player').forEach(u=>G.eliminateUnit(s,u));
    s.piles.COMMON=s.piles.COMMON.slice(0,2);s.piles.RARE=s.piles.RARE.slice(0,1);s.piles.EPIC=[];
    s.deck.pile=[];
    const a=G.getNextActor(s);assert(G.performBasicAttack(s,a.uid,'daly_player').ok);
    return s;
  };
  try{
    for(const [option,count] of [['A',2],['B',1]]){
      selectAndFight();
      assert(html.includes('A · 2 Comuns'));assert(html.includes('B · 1 Raro'));
      action('recover-C');assert(state.recovery,'monte vazio não pode encerrar a escolha');
      action('recover-'+option);assert(!state.recovery);
      assert.equal(G.getBoard(state).player.front.length,count);
      assert(!html.includes('data-act="recover-'));
      let wait=0;while(!html.includes('data-act="attack"')&&wait++<20)runTimers();
      assert(html.includes('data-act="attack"'),'partida deve voltar à vez do jogador');
      assert.equal(state.daly.player.hp,2);action('menu');
    }
  }finally{G.createBattleState=create;}
});
console.log(`${passed} testes da interface v0.14.0 passaram`);
