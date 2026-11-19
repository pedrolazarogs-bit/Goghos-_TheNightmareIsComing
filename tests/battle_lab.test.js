const assert=require('node:assert/strict'),M=require('../js/lab/battle');
const choose=name=>M.roster.indexOf(name);
const step=(s,now)=>{const c=M.current(s);if(c.atk===null)return c.controller==='player'?M.playerPass(s,now):M.botPass(s,c.id,now);const target=s.cards.filter(x=>x.team!==c.team&&x.hp>0).sort((a,b)=>a.hp-b.hp||a.slot-b.slot)[0];return c.controller==='player'?M.playerAttack(s,target.id,now):M.botAttack(s,c.id,target.id,now);};
assert.equal(M.characters.length,32);assert.equal(new Set(M.characters.map(c=>c.id)).size,32);
assert.deepEqual(M.characters.map(c=>c.breath),[6,7,5,5,6,3,12,4,7,5,7,10,12,4,6,6,7,3,3,4,12,4,6,4,6,2,6,8,1,3,7,6]);
assert.equal(M.characters.filter(c=>c.baseAtk===null).length,4);
for(const [name,hp,base,hits] of [['Unicorn',390,60,1],['Sam',530,70,6],['Zeneerian',1700,700,1],['Chama',230,55,6],['DD-X',260,45,2],['Draktar',310,90,2],['Sarck',530,null,1],['P.ULLYS',150,300,1]]){const c=M.characters[choose(name)];assert.deepEqual([c.maxHp,c.baseAtk,c.hits],[hp,base,hits]);}
let total=0,deadPlayerObserved=false,allyBotObserved=false;
for(let selected=0;selected<M.characters.length;selected++){
 const s=M.create({speedOrder:false});assert(M.start(s,0,selected));assert.equal(M.player(s).name,M.roster[selected]);assert.equal(s.cards.filter(c=>c.controller==='player').length,1);assert.equal(s.cards.filter(c=>c.controller==='bot').length,7);assert.equal(new Set(s.cards.map(c=>c.characterId)).size,8);
 assert.equal(M.start(s,10),false);let time=0,points=0;
 for(let n=0;n<1500&&!['finished','blocked'].includes(s.phase);n++){
  if(s.phase==='round-end'){points++;const score={...s.score};assert.equal(s.cards.filter(c=>c.team===M.opposite(s.roundWinner)&&c.hp>0).length,0);assert(M.continueRound(s,time+=1000));assert.deepEqual(s.score,score);assert(s.cards.every(c=>c.hp===c.maxHp));assert.equal(M.player(s).art,selected);}
  const actor=M.current(s);assert(actor.hp>0);
  if(actor.team==='blue'&&actor.id!==s.playerId){allyBotObserved=true;assert.equal(M.playerAttack(s,'red-0',time),null);assert.equal(M.playerPass(s,time),false);}
  if(M.player(s).hp===0){deadPlayerObserved=true;assert.equal(M.canPlayerAct(s),false);}
  assert(step(s,time+=4000));total++;for(const c of s.cards){assert(c.hp>=0&&c.hp<=c.maxHp);assert.equal(c.breath,M.characters[c.art].breath,'Sem consumo de fôlego antes das regras oficiais.');assert.equal(c.maxBreath,c.breath);}
 }
 assert(['finished','blocked'].includes(s.phase),'A série não pode ficar num ciclo sem fim: '+M.roster[selected]);
 if(s.phase==='finished'){assert.equal(Math.max(s.score.blue,s.score.red),3);assert.equal(s.score.blue+s.score.red,points+1);assert(s.score.blue+s.score.red<=5);}else assert(s.cards.filter(c=>c.hp>0).every(c=>c.atk===null));
 assert.equal(M.elapsed(s,time+99999),time);assert.equal(M.continueRound(s,time+1),false);assert.equal(M.playerAttack(s,'red-0',time+1),null);
}
assert(deadPlayerObserved);assert(allyBotObserved);
const s=M.create({speedOrder:false});for(const invalid of [-1,32,1.5,NaN,'1'])assert.equal(M.start(s,0,invalid),false);assert.equal(M.elapsed(s,1000),0);assert(M.start(s,0,1));
M.pause(s,true,20);assert.equal(M.playerAttack(s,'red-1',30),null);assert.equal(M.elapsed(s,1000),1000);M.pause(s,false,1000);
assert.equal(M.botAttack(s,s.playerId,'red-0',1100),null);assert.equal(M.playerAttack(s,'blue-1',1100),null);assert.equal(M.playerAttack(s,'missing',1100),null);assert.equal(M.playerPass(s,1100),false);
const hit=M.playerAttack(s,'red-1',1200);assert.equal(hit.damage,420);assert.equal(s.cards.find(c=>c.id==='red-1').hp,1280);assert.equal(M.playerAttack(s,'red-1',1201),null);
const pending=M.create({speedOrder:false});M.start(pending,0,choose('Sarck'));assert.equal(M.player(pending).atk,null);assert.equal(M.playerAttack(pending,'red-0',10),null);assert(M.playerPass(pending,20));assert.equal(pending.last,null);assert.equal(M.current(pending).controller,'bot');assert.equal(M.playerPass(pending,21),false);
// If a future rule leaves only pending attacks, stop without assigning a winner or point.
const blocked=M.create({speedOrder:false});M.start(blocked,0,choose('Fomor'));blocked.cards.forEach(c=>{if(c.atk!==null)c.hp=0;});blocked.cursor=4;
assert(blocked.cards.some(c=>c.team==='blue'&&c.hp>0));assert(blocked.cards.some(c=>c.team==='red'&&c.hp>0));
assert(M.botPass(blocked,M.current(blocked).id,100));assert.equal(blocked.phase,'blocked');assert.deepEqual(blocked.score,{blue:0,red:0});assert.equal(blocked.winner,null);assert.equal(M.elapsed(blocked,9999),100);
console.log('PASS arena: 32 escolhas, atributos impressos, multiplicadores, dano limitado à vida, quatro ataques pendentes, controle único e séries completas ('+total+' ações).');
