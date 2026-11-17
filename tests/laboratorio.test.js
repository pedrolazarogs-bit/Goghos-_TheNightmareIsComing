const assert=require('node:assert/strict'),M=require('../js/lab_model');
const s=M.create();assert.equal(s.cards.length,3);assert.equal(M.act(s,'damage',null,25),false);
M.act(s,'select','0');assert.equal(s.selected,'0');M.act(s,'select','0');assert.equal(s.selected,null);
M.act(s,'damage','0',100);assert.equal(s.cards[0].hp,0);assert.equal(M.act(s,'move','0'),false);assert.equal(s.cards[0].zone,'hand');
M.act(s,'damage','0',50);assert.equal(s.cards[0].hp,0);M.act(s,'heal','0',100);M.act(s,'heal','0',50);assert.equal(s.cards[0].hp,100);
for(const n of [NaN,Infinity,-2,0,1.5,101])assert.equal(M.act(s,'damage','0',n),false);
assert.equal(s.cards[0].hp,100);M.act(s,'move','0');assert.equal(s.cards[0].zone,'arena');M.act(s,'move','0');assert.equal(s.cards[0].zone,'hand');
for(let i=0;i<120;i++)M.act(s,'inspect','1');assert.equal(s.events.length,100);assert(s.events[0].sequence>s.events[99].sequence);M.act(s,'clear');assert.equal(s.events.length,0);assert.equal(M.create().selected,null);
console.log('PASS laboratório: seleção, limites de vida, ações inválidas, bloqueio sem vida, movimentos e registro limitado.');
