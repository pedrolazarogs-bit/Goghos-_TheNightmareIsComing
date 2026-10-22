const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
['data/characters','data/support_cards','data/reset_cards','core/battle','core/deck','core/support','core/roster','core/selection','core/ai','ui/card'].forEach(f=>require('../js/'+f+'.js'));
const G=globalThis.GOGHOS;
let passed=0;
const test=(name,run)=>{run();passed++;console.log('OK  '+name);};

test('Sam, Eletric e Sarck usam as artes recebidas e continuam dentro das faixas de raridade',()=>{
  const expected={sam:['LEGENDARY','FIGHTER'],eletric:['RARE','MAGO'],sarck:['EPIC','TANK']};
  for(const [id,[rarity,cls]] of Object.entries(expected)){
    const c=G.getCharacterById(id);
    assert(c);assert.equal(c.rarity,rarity);assert.equal(c.class,cls);
    assert(c.fullCardArt);assert(fs.existsSync(path.join(__dirname,'..',c.art)));
    assert(G.cardHTML(c).includes(c.art));
    assert(c.maxHp>=G.RARITY_HP[rarity].min&&c.maxHp<=G.RARITY_HP[rarity].max);
    assert(c.damage>=G.RARITY_DAMAGE[rarity].min&&c.damage<=G.RARITY_DAMAGE[rarity].max);
  }
  assert.equal(G.getCharacterById('eletric').maxHp,220);
  assert.equal(G.getCharacterById('eletric').damage,130);
  assert.equal(G.getCharacterById('sarck').maxHp,530);
  for(const c of G.SUPPORT_CARDS)assert(fs.existsSync(path.join(__dirname,'..',c.art)));
  assert(fs.existsSync(path.join(__dirname,'..','assets/logo/logo.png')));
});

test('Eletric e Sarck podem entrar na equipe por uma Daly quando houver espaço',()=>{
  for(const id of ['eletric','sarck']){
    const rarity=G.getCharacterById(id).rarity;
    const s=G.createBattleState({front:['char_02','char_03'],rear:[]},{front:['char_04','char_05'],rear:[]});
    for(const r of G.RARITIES)s.piles[r]=[];
    s.piles[rarity]=[{iid:'character-'+id,id}];
    const card={iid:'daly-'+id,id:'daly_01'};s.deck.hands.player.push(card);
    const result=G.resolveDalle(s,'player',card);
    assert(result.ok,result.error);assert(result.obtained);
    const unit=G.getUnit(s,result.obtained);
    assert.equal(unit.id,id);assert.equal(unit.row,'front');
    assert.equal(s.piles[rarity].length,0);
  }
});
console.log(`${passed} testes do catálogo passaram`);
