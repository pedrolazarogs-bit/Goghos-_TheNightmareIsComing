const assert=require('node:assert/strict');
const M=require('../js/penxy/battle');
const id=name=>M.roster.indexOf(name);
const defs=M.deck.filter(p=>p.skill);
assert.equal(defs.length,25);
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
 const {s,a,t}=fixture(['Linx'],['Z-Zus']);assert.equal(attack(s,a,t).damage,290);
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
 dice(1,()=>assert.equal(attack(s,a,t).damage,0));dice(3,()=>assert.equal(attack(s,a,t).damage,420));
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
console.log('PASS 25 perfis: alvos, área, reações, marcas, cura, imunidade, controle, prioridades e dados.');
