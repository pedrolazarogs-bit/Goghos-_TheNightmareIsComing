const assert=require('node:assert/strict');
const M=require('../js/penxy/battle');
const id=name=>M.roster.indexOf(name);
const defs=M.deck.filter(p=>p.skill);
assert.equal(defs.length,26);
assert.deepEqual(defs.filter(p=>!p.image).map(p=>p.name).sort(),['Dashow Only','Zédia']);
function fixture(blue,red){
 const team=names=>[...new Set([...names,'Unicorn','Mike','DD-X','Elish'])].slice(0,4).map(id);
 const s=M.create(false);assert(M.start(s,0,{blue:team(blue),red:team(red)}));
 return {s,a:s.cards[0],t:s.cards[4]};
}
function turn(s,c){s.cursor=s.order.indexOf(c.id);s.blockedTurn='';assert.equal(M.current(s),c);}
function attack(s,a,t){turn(s,a);const r=M.attack(s,a.id,t.id,1);assert(r);return r;}
function use(s,a,action,t){turn(s,a);assert(M.useSkill(s,a.id,action,t.id,1));}
function waitUntil(s,test){
 for(let i=0;i<32&&!test();i++){assert.equal(s.phase,'active');assert(M.pass(s,i+1));}
 assert(test());
}
function dice(n,run){const rand=Math.random;try{Math.random=()=>((n-.5)/6);run();}finally{Math.random=rand;}}
{
 const {s,a,t}=fixture(['Rawlin'],['Zeneerian']);turn(s,a);
 assert(!M.options(s,a).some(o=>o.target===t.id));
 const aim=fixture(['Nully'],['Striker']);turn(aim.s,aim.a);
 assert(!M.attackTarget(aim.s,aim.a.id,aim.t.id));
 aim.a.speed=aim.t.speed;assert(M.attackTarget(aim.s,aim.a.id,aim.t.id));
}
{
 const {s,a,t}=fixture(['Vaglar'],['Mike']);use(s,a,'book',t);
 waitUntil(s,()=>!t.hp);
 const cursed=fixture(['Mike'],['Vaglar']);attack(cursed.s,cursed.a,cursed.t);attack(cursed.s,cursed.a,cursed.t);assert.equal(cursed.t.hp,0);
}
{
 const {s,a,t}=fixture(['Linix'],['Z-Zus']);assert.equal(attack(s,a,t).damage,Math.round(t.maxHp*.45));
 const hunt=fixture(['Draktar'],['Nully']);use(hunt.s,hunt.a,'hunt',hunt.t);
 assert(hunt.s.order.indexOf(hunt.a.id)<hunt.s.order.indexOf(hunt.t.id));
 assert.equal(attack(hunt.s,hunt.a,hunt.t).damage,220);
}
{
 const {s,a,t}=fixture(['Elish'],['Z-Zus']);t.hp=300;use(s,a,'heal',t);assert.equal(t.hp,380);
 const oni=fixture(['Unicorn'],['Mike','Daztirry']);oni.t.hp=10;
 assert.equal(M.attackPower(oni.s,oni.t),oni.t.atk+20);attack(oni.s,oni.a,oni.t);assert.equal(oni.t.hp,1);
 waitUntil(oni.s,()=>!oni.t.hp);
}
{
 const {s,a,t}=fixture(['Rawlin'],['Mike']);dice(2,()=>use(s,a,'stone',t));
 assert(t.status.some(e=>e.type==='stone'));
 dice(2,()=>use(s,s.cards[5],'rescue',t));
 assert(!t.status.some(e=>e.type==='stone'));
 dice(3,()=>use(s,a,'stone',t));waitUntil(s,()=>!t.hp);
}
{
 const {s,a,t}=fixture(['Unicorn'],['Sarck']);assert.equal(t.hp,260);attack(s,a,t);assert.equal(a.hp,0);
 const lethal=fixture(['Petra'],['Sarck']);attack(lethal.s,lethal.a,lethal.t);assert.equal(lethal.t.hp,0);assert.equal(lethal.a.hp,220);
 const immortal=fixture(['Mike'],['Unicorn','Zédia']);immortal.t.hp=20;
 attack(immortal.s,immortal.a,immortal.t);assert.equal(immortal.t.hp,1);
}
{
 const {s,a,t}=fixture(['Mike','Fomor'],['Unicorn']);const soul=s.cards[1],before=soul.maxHp;t.hp=5;
 attack(s,a,t);assert.equal(soul.maxHp,before+30);assert.equal(soul.souls,1);
 const sleep=fixture(['Rayyb'],['Mike']);dice(6,()=>{use(sleep.s,sleep.a,'sleep',sleep.t);waitUntil(sleep.s,()=>M.current(sleep.s)===sleep.t);});
 assert.equal(sleep.s.blockedTurn,'Dormindo');M.pass(sleep.s,2);
 dice(1,()=>waitUntil(sleep.s,()=>M.current(sleep.s)===sleep.t));assert(!sleep.s.blockedTurn);
}
{
 const {s,a}=fixture(['Dashow Only'],['Mike']);a.hp=100;use(s,a,'switch',a);assert.equal(a.hp,100);assert.equal(a.reserveHp,115);use(s,a,'switch',a);assert.equal(a.hp,115);
 const guard=fixture(['Z-Zus','Unicorn'],['Mike']);const ally=guard.s.cards[1];
 use(guard.s,guard.a,'protect',ally);attack(guard.s,guard.t,ally);
 assert.equal(ally.hp,ally.maxHp);assert.equal(guard.a.hp,guard.a.maxHp-guard.t.atk);
}
{
 const {s,a}=fixture(['P.ULLYS'],['Z-Zus','Unicorn','Mike','DD-X']);attack(s,a,s.cards[5]);
 assert.deepEqual(s.cards.slice(4).map(c=>c.maxHp-c.hp),[50,300,50,0]);
 const all=fixture(['Eletric'],['Z-Zus']);attack(all.s,all.a,all.t);
 assert(all.s.cards.slice(4).every(c=>c.maxHp-c.hp===100));
}
{
 const {s,a,t}=fixture(['Sam'],['Z-Zus']);
 dice(1,()=>assert.equal(attack(s,a,t).damage,50));
 const faces=[1,2,3,4,5,6,1],original=Math.random;
 try{
  let i=0;Math.random=()=>(faces[i++]-.5)/6;
  const plan=M.prepareCombo(a,t);assert.deepEqual(plan,faces);turn(s,a);
  assert.equal(M.attack(s,a.id,t.id,1,'player',null,plan).damage,300);
  assert.equal(i,7);
 }finally{Math.random=original;}
 const shark=fixture(['Mike'],['Endrik']);shark.t.hp=20;dice(2,()=>attack(shark.s,shark.a,shark.t));assert.equal(shark.a.hp,0);
}
{
 const {s,a,t}=fixture(['Jonh'],['Z-Zus']);use(s,a,'guitar',t);assert.equal(t.maxHp-t.hp,40);
 turn(s,a);assert(!M.attackTarget(s,a.id,t.id));use(s,a,'release',a);assert(!t.status.some(e=>e.type==='guitar'));
 const barn=fixture(['Barn'],['Mike']);use(barn.s,barn.a,'hypnosis',barn.t);turn(barn.s,barn.a);assert(!M.attackTarget(barn.s,barn.a.id,barn.t.id));use(barn.s,barn.a,'release',barn.a);assert(!barn.t.status.length);
}
{
 const {s,a,t}=fixture(['Nully'],['Z-Zus']);dice(1,()=>assert.equal(attack(s,a,t).damage,45));dice(6,()=>assert(attack(s,a,t).defeated));
 const fire=fixture(['Chama'],['Z-Zus']);attack(fire.s,fire.a,fire.t);assert.equal(fire.t.maxHp-fire.t.hp,0);
 for(let i=0;i<6;i++)M.pass(fire.s,i);assert.equal(fire.t.maxHp-fire.t.hp,300);assert(!fire.t.status.some(e=>e.type==='burn'));
 const counter=fixture(['Unicorn'],['Chama']);attack(counter.s,counter.a,counter.t);
 for(let i=0;i<3;i++)M.pass(counter.s,i);assert.equal(counter.a.maxHp-counter.a.hp,105);
 const kick=fixture(['Stally'],['Z-Zus']);dice(1,()=>use(kick.s,kick.a,'kick',kick.t));
 assert(kick.t.status.some(e=>e.type==='stun'));assert.equal(kick.t.maxHp-kick.t.hp,kick.a.atk+40);
}
{
 const {s,a,t}=fixture(['Unicorn'],['Petra']);assert.equal(t.speed,7);attack(s,a,t);assert.equal(t.atk,190);assert.equal(t.speed,4);
 assert.equal(M.wearLevel(100),2);t.hp=150;attack(s,a,t);assert.equal(t.atk,70);assert.equal(t.speed,2);
 const fish=fixture(['DD-X'],['Z-Zus']);use(fish.s,fish.a,'fish',fish.t);assert.equal(fish.t.maxHp-fish.t.hp,90);
}
console.log('PASS 26 perfis: alvos, área, reações, marcas, cura, imunidade, controle, prioridades e dados.');

// A single die controls both the katana animation and damage at impact.
for(const controller of ['bot','player']){
 for(let face=1;face<=6;face++){
  const {s,a,t}=fixture(['Nully'],['Mike']);
  turn(s,a);s.singlePlayer=true;a.controller=controller;
  t.hp=face===2?10:300;
  let plan;
  dice(face,()=>{plan=M.prepareKatana(s,a,t);});
  assert.equal(plan.brutal,face===6);
  const before=t.hp;
  dice(face===6?1:6,()=>assert(M.attack(s,a.id,t.id,3,controller,plan)));
  assert.equal(s.events.filter(e=>e.type==='dado').length,1);
  assert.equal(before-t.hp,face===6?before:Math.min(before,Math.round(45+(face-1)*175/4)));
 }
}
for(const guard of ['Zédia','Daztirry','Z-Zus']){
 const {s,a,t}=fixture(['Nully'],['Mike',guard]);
 const protector=s.cards[5];if(guard==='Z-Zus')use(s,protector,'protect',t);
 turn(s,a);
 dice(6,()=>{
  const plan=M.prepareKatana(s,a,t);
  assert.equal(plan.brutal,guard==='Z-Zus');
  assert.equal(plan.recipient,guard==='Z-Zus'?protector.id:t.id);
  M.attack(s,a.id,t.id,3,'player',plan);
  if(guard==='Z-Zus'){assert.equal(t.hp,t.maxHp);assert.equal(protector.hp,0);}
  else assert.equal(t.hp,1);
 });
}
{
 const {s,a,t}=fixture(['Nully'],['Zeneerian']);
 assert.equal(M.prepareKatana(s,a,t),null);
 dice(6,()=>assert.equal(attack(s,a,t).damage,a.baseAtk));
 assert(!s.events.some(e=>e.type==='dado'));
}
{
 const {s,a,t}=fixture(['Rawlin'],['Striker']);turn(s,a);
 assert(!M.options(s,a).some(o=>o.target===t.id));
 assert(!M.useSkill(s,a.id,'stone',t.id,1));
 a.speed=t.speed;assert(M.options(s,a).some(o=>o.target===t.id));
}
{
 const {s,a,t}=fixture(['Stally','DD-X'],['Vaglar','Z-Zus']);
 t.hp=t.maxHp=600;
 dice(6,()=>use(s,a,'kick',t));use(s,s.cards[1],'fish',t);assert.equal(t.hp,0);
 const guard=fixture(['Mike'],['Vaglar','Z-Zus']);
 use(guard.s,guard.s.cards[5],'protect',guard.t);
 attack(guard.s,guard.a,guard.t);attack(guard.s,guard.a,guard.t);
 assert.equal(guard.t.hp,guard.t.maxHp);
 const missed=fixture(['Mike','Sam'],['Vaglar']);
 attack(missed.s,missed.a,missed.t);
 dice(1,()=>attack(missed.s,missed.s.cards[1],missed.t));
 assert.equal(missed.t.hp,0);
}
{
 const {s,a,t}=fixture(['Jonh','Mike'],['Z-Zus']);use(s,a,'guitar',t);
 assert.equal(attack(s,s.cards[1],t).damage,s.cards[1].atk);
 assert.equal(t.maxHp-t.hp,80+s.cards[1].atk);
}
{
 const {s,a,t}=fixture(['Barn'],['Mike','Sam']);use(s,a,'hypnosis',t);
 use(s,a,'hypnosis',s.cards[5]);
 assert(!t.status.some(e=>e.type==='hypnosis'));assert(s.cards[5].status.some(e=>e.type==='hypnosis'));
}
{
 const {s,a}=fixture(['Fomor','Mike','Elish','DD-X'],['Unicorn','Rayyb','Sam','Linix']);
 const base=a.maxHp;
 for(const victim of s.cards.filter(c=>c!==a&&c.art!==id('Mike'))){
  const hitter=s.cards.find(c=>c.hp&&c!==a&&c.speed!==null&&c.team!==victim.team&&c.atk>0)||a;
  victim.hp=1;attack(s,hitter,victim);
 }
 assert.equal(a.souls,5);assert.equal(a.maxHp,base+150);
}
console.log('PASS revisão: seis faces da katana para jogador e bot, proteções, alvo imune, mira, Cardume, Voadora, livro, Hipnose, guitarra e limite de almas.');

// Exercise each active choice through the same authorization and turn path for both sides.
const activeCases=[
 ['Vaglar','book'],['Draktar','hunt'],['Elish','heal'],['Rawlin','stone'],['Rayyb','sleep'],
 ['Dashow Only','switch'],['Z-Zus','protect'],['Jonh','guitar'],['Barn','hypnosis'],
 ['Stally','kick'],['DD-X','fish']
];
for(const [name,action] of activeCases){
 for(const controller of ['player','bot']){
  const {s,a,t}=fixture([name],['Mike']);
  s.singlePlayer=true;s.playerId=controller==='player'?a.id:s.cards[1].id;
  for(const c of s.cards)c.controller=c.id===s.playerId?'player':'bot';
  const target=action==='switch'?a:action==='protect'?s.cards[1]:t;
  if(action==='heal')target.hp-=100;
  turn(s,a);
  const wrong=controller==='bot'?'player':'bot',before=s.turnNumber;
  assert.deepEqual(M.options(s,a,wrong),[]);
  assert.equal(M.useSkill(s,a.id,action,target.id,1,wrong),false);
  assert(M.options(s,a,controller).some(o=>o.action===action&&o.target===target.id));
  dice(2,()=>assert(M.useSkill(s,a.id,action,target.id,1,controller)));
  assert.equal(s.turnNumber,before+1,name+' · '+controller);
 }
}
console.log('PASS 11 ações das fichas em ambos os controles, autorização e consumo de um turno por uso.');

{
 const {s,a,t}=fixture(['Unicorn','Sam','Zeneerian','Sarck'],['Mike']);
 const ally=s.cards[1],hp=ally.maxHp;turn(s,a);
 assert(!M.options(s,a).some(o=>o.target===s.cards[2].id||o.target===a.id));
 use(s,a,'celestial',ally);assert.equal(ally.hp,hp+90);assert.equal(ally.maxHp,hp+90);
 assert.equal(M.effectiveSpeed(ally),8);assert.equal(M.attackPower(s,ally),335);
 dice(2,()=>assert.equal(attack(s,ally,t).damage,85));
 use(s,a,'celestial',ally);use(s,a,'celestial',ally);assert.equal(M.effectiveSpeed(ally),9);
 use(s,a,'celestial',s.cards[3]);assert.equal(M.effectiveSpeed(s.cards[3]),null);
 s.phase='round-end';M.continueRound(s,4);assert.equal(s.cards[1].maxHp,hp);assert.equal(M.effectiveSpeed(s.cards[1]),7);
 const immune=fixture(['Sam'],['Zeneerian']);assert.equal(attack(immune.s,immune.a,immune.t).damage,50);
 const claws=fixture(['Linix'],['Mike']);claws.t.maxHp=501;claws.t.hp=320;
 assert.equal(attack(claws.s,claws.a,claws.t).damage,Math.round(claws.t.maxHp*.45));
}
console.log('PASS Mega Combo, Punch, Afiação 5 e Estrela Celeste com bônus, imunidade e reinício de rodada.');
