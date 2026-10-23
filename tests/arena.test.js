const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
['data/characters','data/gods','data/support_cards','data/reset_cards','core/battle','core/character_abilities','core/deck','core/support','core/roster','core/official_abilities','core/support_effects','core/divine','ui/card','ui/match_ui','ui/arena_ui'].forEach(f=>require('../js/'+f+'.js'));
require('./fixtures/legacy_catalog.js');
const G=globalThis.GOGHOS;
let passed=0;
const test=(name,run)=>{run();passed++;console.log('OK  '+name);};
const battle=()=>G.createBattleState({front:['char_02','sam'],rear:[]},{front:['char_04','char_03'],rear:[]});

test('desenhar a prévia da vez e os montes não avança a batalha nem compra cartas',()=>{
  const s=battle(),actor=G.getUnit(s,s.order[0]),before=JSON.stringify(s);
  const next=G.getNextActor,reset=G.onSpeedReset;
  G.getNextActor=()=>{throw Error('A prévia não deve avançar a ordem.');};
  G.onSpeedReset=()=>{throw Error('A prévia não deve comprar cartas.');};
  try{
    for(let i=0;i<4;i++){
      G.turnPreview(s,actor);G.turnPanelHTML(s,actor);G.actorInfoHTML(s,actor);
      G.characterPilesHTML(s);G.mainPileHTML(s);G.dalyHTML(s,'player');
    }
    assert.equal(JSON.stringify(s),before);
  }finally{G.getNextActor=next;G.onSpeedReset=reset;}
});

test('a prévia respeita ações já usadas, o atacante durante o feedback e escolhas pendentes',()=>{
  const s=battle(),fast=G.getUnit(s,s.order[0]);
  assert.equal(G.turnPreview(s,fast).upcoming.id,'sam');
  s.acted[s.order[1]]=true;
  assert.equal(G.turnPreview(s,fast).upcoming.id,'char_04');
  s.acted[fast.uid]=true;s.lastEvent={actorUid:fast.uid};
  const hit=G.turnPreview(s,null,true);assert.equal(hit.current.uid,fast.uid);assert.equal(hit.upcoming.id,'char_04');
  s.recovery={side:'enemy'};
  const waiting=G.turnPreview(s,null);assert(waiting.waiting);assert.equal(waiting.upcoming,null);
  assert(G.turnPanelHTML(s,null).includes('Bot escolhendo'));
  s.recovery.side='player';assert(G.turnPanelHTML(s,null).includes('Sua escolha'));
});

test('o painel usa Vida, Ataque e mana reais, em vez dos atributos impressos na referência',()=>{
  const s=G.createBattleState({front:['eletric'],rear:[]},{front:['char_03'],rear:[]});
  const u=G.getBoard(s).player.front[0];u.hp=74;u.damage=88;u.mana=1;
  const html=G.actorInfoHTML(s,u);
  assert(html.includes('<b>74<small>/220</small></b>'));assert(html.includes('<b>88</b>'));assert(html.includes('<b>1/3</b>'));
  assert(html.includes('assets/characters/eletric.png'));assert(!html.includes('assets/references/'));
});

test('as artes da arena existem, os montes são separados e a mão adversária fica oculta',()=>{
  for(const a of Object.values(G.ARENA_ART)){
    assert(fs.existsSync(path.join(__dirname,'..',a.src)));
    const [x,y,right,bottom]=a.bounds;
    assert(x>=0&&y>=0&&right>x&&bottom>y&&right<=a.size[0]&&bottom<=a.size[1]);
  }
  const s=battle();s.deck.hands.enemy.push({iid:'hidden',id:'daly_05'});
  const html=G.pilesHTML(s);
  assert.equal((html.match(/class="deck-pile /g)||[]).length,G.RARITIES.length+1);
  assert(html.includes('Mão adversária <b>1/5</b>'));assert(!html.includes('Medalha Preta'));
  for(const r of G.RARITIES)assert(html.includes(`Monte ${G.RARITY_LABEL[r]}: ${s.piles[r].length} cartas`));
});
console.log(`${passed} testes da apresentação da arena passaram`);
