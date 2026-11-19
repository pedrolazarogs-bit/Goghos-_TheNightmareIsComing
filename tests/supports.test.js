const assert=require('node:assert/strict'),M=require('../js/lab/battle');
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const make=(ids,art=0)=>{const s=M.create();ids.forEach(id=>assert(M.equipSupport(s,id)));assert(M.start(s,0,art));return s;};
const card=(s,id)=>s.cards.find(c=>c.id===id);
const turn=(s,id)=>{s.cursor=s.order.indexOf(id);};
const activate=(s,index,target=s.playerId,time=100)=>M.activateSupport(s,index,target,time);
assert.equal(M.supportCards.length,10);assert.equal(M.supportCards.filter(c=>c.card).length,9);assert.equal(M.supportCards.filter(c=>c.effect).length,4);
const manifest=require('../assets/supports-v051/manifest.json');assert.equal(manifest.files.length,19);
for(const f of manifest.files){const data=fs.readFileSync(path.join(__dirname,'../assets/supports-v051',f.file));assert.equal(crypto.createHash('sha256').update(data).digest('hex'),f.sha256);}
const ready=M.create();assert.equal(M.equipSupport(ready,'inventado'),false);
for(const id of ['bandeide','na-moleira','escudo-volatil'])assert(M.equipSupport(ready,id));
assert.equal(M.equipSupport(ready,'papakill'),false);assert.equal(M.equipSupport(ready,'bandeide'),false);
for(const bad of [-1,3,1.5,'1'])assert.equal(M.removeSupport(ready,bad),false);
assert(M.removeSupport(ready,1));assert(M.equipSupport(ready,'papakill'));M.start(ready,0);
assert.equal(M.removeSupport(ready,0),false);assert.equal(M.equipSupport(ready,'sortudo'),false);
const heal=make(['bandeide']);card(heal,'blue-1').hp=500;
assert.equal(activate(heal,0,'red-0'),null);assert.equal(activate(heal,0,heal.playerId),null);
card(heal,'blue-1').hp=0;assert.equal(activate(heal,0,'blue-1'),null);card(heal,'blue-1').hp=500;
M.pause(heal,true,1);assert.equal(activate(heal,0,'blue-1'),null);M.pause(heal,false,2);
turn(heal,'red-0');assert.equal(activate(heal,0,'blue-1'),null);turn(heal,heal.playerId);
const beforeCursor=heal.cursor;assert.equal(activate(heal,0,'blue-1').healed,30);assert.equal(card(heal,'blue-1').hp,530);assert.equal(heal.cursor,beforeCursor);assert.equal(heal.last,null);assert(M.canPlayerAct(heal));
card(heal,'blue-1').hp=400;assert.equal(activate(heal,0,'blue-1'),null);assert.equal(card(heal,'blue-1').hp,400);
const fullHeal=make(['bandeide']);M.player(fullHeal).hp=200;assert.equal(activate(fullHeal,0).healed,70);assert.equal(M.player(fullHeal).hp,270);
const boost=make(['na-moleira'],1);assert.equal(activate(boost,0,'blue-1'),null);assert(activate(boost,0));assert.equal(boost.supports.blue[0].status,'armed');
assert.equal(M.playerAttack(boost,'red-1',200).damage,470,'+50 no ataque completo de Sam, não em cada um dos seis golpes.');assert.equal(boost.supports.blue[0].status,'spent');turn(boost,boost.playerId);assert.equal(M.playerAttack(boost,'red-1',300).damage,420);
const noAttack=make(['na-moleira','escudo-volatil'],2);assert.equal(activate(noAttack,0),null);assert(activate(noAttack,1));
const shield=make(['escudo-volatil']);assert(activate(shield,0));turn(shield,'red-0');let hit=M.botAttack(shield,'red-0',shield.playerId,200);assert.equal(hit.damage,90);assert.equal(hit.blocked,80);assert.equal(M.player(shield).hp,300);assert.equal(shield.supports.blue[0].status,'spent');turn(shield,'red-0');assert.equal(M.botAttack(shield,'red-0',shield.playerId,300).damage,170);
const absorbed=make(['escudo-volatil']);assert(activate(absorbed,0));turn(absorbed,'red-1');hit=M.botAttack(absorbed,'red-1',absorbed.playerId,200);assert.equal(hit.damage,0);assert.equal(M.player(absorbed).hp,390);assert.equal(absorbed.supports.blue[0].status,'spent');
const carry=make(['na-moleira','escudo-volatil']);activate(carry,0);activate(carry,1);carry.phase='round-end';assert(M.continueRound(carry,200));assert(carry.supports.blue.filter(Boolean).every(s=>s.status==='armed'));turn(carry,carry.playerId);assert.equal(M.playerAttack(carry,'red-1',300).damage,110);turn(carry,'red-0');assert.equal(M.botAttack(carry,'red-0',carry.playerId,400).damage,90);assert.equal(activate(carry,0),null);
const kill=make(['papakill']);card(kill,'red-0').hp=40;assert.equal(activate(kill,0,'red-0'),null);card(kill,'blue-1').hp=20;assert.equal(activate(kill,0,'blue-1'),null);card(kill,'red-0').hp=0;assert.equal(activate(kill,0,'red-0'),null);card(kill,'red-0').hp=39;
const execution=activate(kill,0,'red-0');assert.equal(execution.damage,39);assert(execution.defeated);assert.equal(card(kill,'red-0').hp,0);assert.equal(M.current(kill).id,kill.playerId);assert.equal(kill.last,null);assert.equal(M.next(kill).id,'blue-1');assert(M.canPlayerAct(kill));
const final=make(['papakill']);final.score.blue=2;final.cards.filter(c=>c.team==='red').forEach(c=>c.hp=0);card(final,'red-3').hp=1;assert.equal(activate(final,0,'red-3',1234).winner,'blue');assert.equal(final.score.blue,3);assert.equal(final.phase,'finished');assert.equal(activate(final,0,'red-3',1235),null);assert.equal(M.elapsed(final,99999),1234);
const dead=make(['escudo-volatil']);M.player(dead).hp=0;assert.equal(activate(dead,0),null);
for(const invalid of [NaN,Infinity,undefined]){const s=make(['escudo-volatil']);assert.equal(M.activateSupport(s,0,s.playerId,invalid),null);assert.equal(s.supports.blue[0].status,'ready');}
for(const c of M.supportCards.filter(c=>!c.effect)){const s=make([c.id]);const before=JSON.stringify(s);assert.equal(activate(s,0),null);assert.equal(M.supportReason(s,0,s.playerId),c.pending);assert.equal(JSON.stringify(s),before);}
console.log('PASS apoios: 19 PNGs originais, limite de três, preparo antes da série, uso único, vez/pausa/morte, cura sem ressuscitar, bônus único por ataque, escudo, persistência entre rodadas, Papakill <40 e vitória final sem ponto duplicado; seis regras pendentes bloqueadas.');
