'use strict';
const assert=require('node:assert/strict'),E=require('../js/core/arena_five.js');
const roster=(ids=[0,1,2,3,4,5,6,7,8,9])=>({teams:[0,1].map(t=>({name:t?'Azul':'Vermelho',players:ids.slice(t*5,t*5+5).map((id,j)=>({charId:id,name:'Bot '+j,human:t===0&&j===0,support:[]}))}))});
const battle=(ids,seed=31)=>{const b=new E.Battle(roster(ids),{seed});b.startRound();return b;};
let count=0;const test=(name,fn)=>{fn();count++;console.log('OK '+name);};
test('equipes incompletas ou repetidas são recusadas e nenhum poder extra é equipado',()=>{
 assert.throws(()=>new E.Battle({teams:[]}),/5 campeões/);assert.throws(()=>new E.Battle(roster([0,0,2,3,4,5,6,7,8,9])),/únicos/);
 const r=roster();r.teams[0].players[0].support=['Cura','Sorte','Escudo'];const b=new E.Battle(r);b.startRound();const u=b.units[0];assert.deepEqual(u.sup,[]);u.hp-=30;const hp=u.hp;b.beginTurn(u);assert.equal(u.hp,hp);
});
test('19 campeões usam atributos oficiais e apenas sua habilidade e classe',()=>{
 assert.equal(E.CHARS.length,19);assert.equal(new Set(E.CHARS.map(c=>c.id)).size,19);
 for(let i=0;i<19;i++){const c=E.CHARS[i],base=E.character(i);assert.equal(c.life,base.maxHp);assert.equal(c.atk,base.damage);assert.equal(c.cls,base.class);assert.equal(c.abilityId,base.abilityId);assert(E.TRIBUTES[c.cls]);}
 assert.equal(E.CHARS[14].id,'cavaleiro');assert.equal(E.CHARS[18].id,'endrik');assert(!E.CHARS.some(c=>c.pw==='immortal'||c.pw==='p2'));
});
test('uma fila terminando em eliminado inicia outro ciclo, sem restaurar Vida nem encerrar a rodada',()=>{
 const b=battle();const dead=b.units[9];b.kill(dead,b.units[0],[],0,true);b.queue=[dead];b.units[2].hp=35;const round=b.round,score=[...b.score];assert(b.next());assert.equal(b.round,round);assert.deepEqual(b.score,score);assert.equal(b.units[2].hp,35);assert.equal(dead.alive,false);
});
test('Oni pertence somente a Daztirry e termina após quatro ações globais, mesmo petrificado',()=>{
 const b=battle([8,7,1,2,4,3,5,6,9,13]),d=b.units[0],ally=b.units[1],foe=b.units[5];
 b.strike(foe,ally,{base:9999,true:1},[]);assert.equal(ally.alive,false);assert.equal(ally.st.und,null);
 b.strike(foe,d,{base:9999,true:1},[]);assert.equal(d.hp,1);assert.equal(d.st.und,4);assert.equal(d.base.atk+30,b.eff(d,'atk'));
 b.endTurn(foe);assert.equal(d.st.und,4);d.st.pet=foe.id;
 for(let i=0;i<3;i++){b.endTurn(foe);assert(d.alive);}
 b.endTurn(foe);assert.equal(d.alive,false);assert.equal(d.hp,0);assert.equal(d.st.und,null);assert.equal(b.eff(d,'atk'),d.base.atk);
 b.strike(foe,d,{base:9999,true:1},[]);assert.equal(d.alive,false);
});
test('execução só aciona o Oni próprio uma vez; não revive aliados e não volta após esgotar',()=>{
 const b=battle([8,0,2,3,4,1,6,7,9,13]),d=b.units[0],foe=b.units[5];b.kill(d,foe,[],0,true);assert(d.alive);assert.equal(d.st.und,4);
 for(let i=0;i<5;i++)b.endTurn(foe);assert.equal(d.alive,false);b.kill(d,foe,[],0,true);assert.equal(d.alive,false);
});
test('Assassino tem esquiva, Fighter tem Parry e Destruidor ignora Parry com crítico próprio',()=>{
 const b=battle([9,7,0,3,4,1,2,5,6,10]);const fighter=b.units[0],support=b.units[1],assassin=b.units[2],destroyer=b.units[5];b.d6=()=>1;
 let ev=[];b.strike(support,fighter,{base:20,atk:1},ev);assert(ev.some(e=>e.t==='parry'));
 ev=[];b.strike(support,assassin,{base:20,atk:1},ev);assert(ev.some(e=>e.t==='dodge'));
 ev=[];b.strike(destroyer,fighter,{base:20,atk:1},ev);assert(!ev.some(e=>e.t==='parry'));assert.equal(ev.find(e=>e.t==='dmg').v,25);
 ev=[];b.strike(fighter,support,{base:20,atk:1},ev);assert(!ev.some(e=>['parry','dodge'].includes(e.t)));
});
test('Mago tem mana e ignora esquiva, sem herdar Parry ou crítico de outra classe',()=>{
 const b=battle([16,0,2,3,4,1,6,7,8,9]),mage=b.units[0],assassin=b.units[9];assassin.cls='ASSASSIN';assassin.base.spd=15;b.d6=()=>1;mage.manaSpend=2;const ev=b.act(mage,{type:'attack'},assassin.id);assert(!ev.some(e=>e.t==='dodge'||e.crit));assert.equal(mage.mana,1);b.endTurn(mage);assert.equal(mage.mana,2);assert.equal(b.units[1].mana,0);
});
test('a armadura é só do Cavaleiro e a transição é só de Suportes',()=>{
 const b=battle([14,7,0,3,4,1,2,5,8,9]),knight=b.units[0],support=b.units[1],foe=b.units[5];const hp=knight.hp;b.strike(foe,knight,{base:100,true:1},[]);assert.equal(knight.hp,hp-20);
 assert(b.transit(support));assert.equal(support.row,'rear');assert(!b.transit(knight));assert(!b.targets(foe).includes(support));assert(b.transit(support));assert(b.targets(foe).includes(support));
});
test('Sam usa dados sem repetição; os outros Lutadores não recebem o combo',()=>{
 const b=battle([9,8,2,3,4,1,16,7,6,5]);const sam=b.units[0],daz=b.units[1],target=b.units[6];target.hp=target.max=5000;let dice=[1,2,1];b.d6=()=>dice.shift()??6;let ev=b.act(sam,{type:'attack'},target.id);assert.equal(ev.filter(e=>e.t==='dmg').length,2);assert(ev.some(e=>e.k==='combo'));
 b.d6=()=>6;ev=b.act(daz,{type:'attack'},target.id);assert.equal(ev.filter(e=>e.t==='dmg').length,1);
});
test('Striker e Mike mantêm apenas suas próprias proteções de alvo',()=>{
 const b=battle([0,7,3,4,8,1,2,5,6,9]);const assassin=b.units[0],striker=b.units[5],mike=b.units[6],sam=b.units[9];assert(!b.targets(assassin).includes(striker));assert(!b.targets(assassin).includes(mike));assert(b.targets(assassin).includes(sam));
});
test('almas aumentam só o máximo; cura total não cura Zuri e não se repete',()=>{
 const b=battle([16,15,0,3,4,1,2,5,6,9]),fonior=b.units[0],zuri=b.units[1],ally=b.units[2];const hp=fonior.hp,max=fonior.max;b.kill(b.units[5],ally,[],0,true);assert.equal(fonior.max,max+20);assert.equal(fonior.hp,hp);
 zuri.hp-=20;ally.hp-=30;b.act(zuri,{type:'skill'},zuri.id);assert.equal(zuri.hp,zuri.max-20);assert.equal(ally.hp,ally.max);assert.equal(zuri.stat.heal,50);assert.equal(b.act(zuri,{type:'skill'},zuri.id).length,0);
});
test('pó mágico e petrificação não gastam ataque; execução ocupa a vez seguinte',()=>{
 const b=battle([10,17,0,3,4,1,2,5,6,9]),ray=b.units[0],sleep=b.units[1],target=b.units[9];b.d6=()=>1;
 let ev=b.act(ray,{type:'skill'},target.id);assert.equal(ev.free,true);assert.equal(b.action,0);assert.equal(b.act(ray,{type:'skill'},b.units[8].id).length,0);
 assert(b.act(ray,{type:'attack'},target.id).some(e=>e.t==='dmg'));b.endTurn(ray);
 const next=b.beginTurn(ray);assert.equal(next.skip,true);assert.equal(target.alive,false);
 ev=b.act(sleep,{type:'skill'},b.units[8].id);assert.equal(ev.free,true);assert.equal(b.act(sleep,{type:'skill'},b.units[8].id).length,0);
});
test('100 campeonatos terminam com Vida válida, sem reset prematuro e sem imortalidade espalhada',()=>{
 let wipes=0,rounds=0;
 for(let seed=1;seed<=100;seed++){
  const ids=Array.from({length:19},(_,i)=>i);let x=seed;for(let i=ids.length-1;i>0;i--){x=(x*1664525+1013904223)>>>0;const j=x%(i+1);[ids[i],ids[j]]=[ids[j],ids[i]];}
  const b=new E.Battle(roster(ids.slice(0,10)),{seed});let n=0;
  while(!b.over){assert(++n<=9);rounds++;b.startRound();let w=null,turns=0;while(w==null&&b.cycle<=b.o.MAX_CYCLES){assert(++turns<650);const u=b.next();if(!u)break;const before=b.beginTurn(u);if(!before.skip&&u.alive){let free=true;for(let i=0;i<4&&free&&u.alive;i++){const a=b.ai(u);free=b.act(u,a.a,a.tid).free===true;}}b.endTurn(u);b.takeLate();for(const t of b.units){assert(t.hp>=0&&t.hp<=t.max);assert.equal(t.alive,t.hp>0);if(t.pw!=='oni')assert.equal(t.st.und,null);}w=b.check();}
   if(w!=null)wipes++;b.finishRound(w??b.byTime(),w==null?'time':'wipe');
  }
  assert.equal(b.score[b.winner],5);assert.equal(b.history.length,b.round);
 }
 assert(wipes>rounds*.7,'A maioria das rodadas precisa terminar por eliminação real.');console.log('  '+wipes+'/'+rounds+' rodadas encerradas por eliminações reais');
});
console.log(count+' testes da Arena 5x5 passaram');
