'use strict';
const assert=require('node:assert/strict');
const E=require('../js/core/arena_five.js');
const roster=(ids=[0,1,2,3,4,5,6,7,8,9])=>({teams:[0,1].map(t=>({name:t?'Azul':'Vermelho',players:ids.slice(t*5,t*5+5).map((id,j)=>({charId:id,name:'Bot '+j,human:t===0&&j===0,support:[]}))}))});
const battle=(ids,seed=31)=>{const b=new E.Battle(roster(ids),{seed});b.startRound();return b;};
let count=0;
const test=(name,fn)=>{fn();count++;console.log('OK '+name);};
test('elenco incompleto ou repetido é recusado; Apoios duplicados não se acumulam',()=>{
 assert.throws(()=>new E.Battle({teams:[]}),/5 campeões/);
 assert.throws(()=>new E.Battle(roster([0,0,2,3,4,5,6,7,8,9])),/únicos/);
 const r=roster();r.teams[0].players[0].support=['Foco','Foco','inválido','Cura'];
 assert.deepEqual(new E.Battle(r).units[0].sup,['Foco','Cura']);
});
test('Striker nunca se torna alvo de alguém mais rápido, mesmo quando é o único oponente',()=>{
 const b=battle();const a=b.units[0],target=b.units[1];target.team=1;
 b.units.filter(u=>u.team===1&&u!==target).forEach(u=>{u.alive=false;u.hp=0;});
 assert.equal(b.targets(a).length,0);assert.equal(b.ai(a).a.type,'pass');
 const hp=target.hp;b.act(a,{type:'attack'},target.id);assert.equal(target.hp,hp);
});
test('caça concede velocidade e limpa seu bônus ao eliminar o alvo',()=>{
 const b=battle([5,0,2,3,4,1,6,7,8,9]);const a=b.units[0],target=b.units[6],speed=b.eff(a,'spd');
 b.act(a,{type:'skill'},target.id);assert.equal(b.eff(a,'spd'),speed+1);
 b.kill(target,a,[],0,1);assert.equal(b.eff(a,'spd'),speed);assert.equal(a.st.mark,null);
});
test('Zédia protege inclusive contra execução e liberta os aliados quando cai',()=>{
 const b=battle([14,0,2,3,4,1,6,7,8,9]);const z=b.units[0],ally=b.units[1],foe=b.units[5],events=[];
 ally.hp=0;b.kill(ally,foe,events,0,1);assert(ally.alive);assert.equal(ally.hp,1);assert(events.some(e=>e.t==='immortal'));
 b.kill(z,foe,[],0,1);b.kill(ally,foe,[],0,1);assert.equal(ally.alive,false);
});
test('Estrela Celeste só remove a melhoria concedida pelo Unicorn que saiu',()=>{
 const b=battle([6,0,2,3,4,1,5,7,8,9]);const a=b.units[0],ally=b.units[1],base=ally.max;
 b.act(a,{type:'skill'},ally.id);assert.equal(ally.max,base+50);
 b.kill(a,b.units[5],[],0,1);assert.equal(ally.max,base);assert.equal(ally.buf.some(x=>x.src==='star:'+a.id),false);
});
test('cura é creditada ao curador e uma habilidade de uso único não pode ser repetida',()=>{
 const b=battle([15,0,2,3,4,1,6,7,8,9]);const healer=b.units[0],ally=b.units[1];ally.hp-=50;
 b.act(healer,{type:'skill'},-1);assert.equal(healer.stat.heal,50);assert.equal(ally.stat.heal,0);
 ally.hp-=20;assert.equal(b.act(healer,{type:'skill'},-1).length,0);assert.equal(ally.hp,ally.max-20);
});
test('100 campeonatos completos terminam, mantêm Vida válida e produzem placar e vencedor',()=>{
 for(let seed=1;seed<=100;seed++){
  const ids=Array.from({length:19},(_,i)=>i);let x=seed;
  for(let i=ids.length-1;i>0;i--){x=(x*1664525+1013904223)>>>0;const j=x%(i+1);[ids[i],ids[j]]=[ids[j],ids[i]];}
  const b=new E.Battle(roster(ids.slice(0,10)),{seed,MAX_CYCLES:30});let rounds=0;
  while(!b.over){assert(++rounds<=9);b.startRound();let w=null,turns=0;
   while(w==null&&b.cycle<=b.o.MAX_CYCLES){assert(++turns<400);const u=b.next();if(!u)break;const t=b.beginTurn(u);if(!t.skip&&u.alive){const a=b.ai(u);b.act(u,a.a,a.tid);}b.endTurn(u);b.takeLate();
    for(const unit of b.units){assert(Number.isFinite(unit.hp));assert(unit.hp>=0&&unit.hp<=unit.max);assert.equal(unit.alive,unit.hp>0);}
    w=b.check();
   }
   b.finishRound(w??b.byTime(),w==null?'time':'wipe');
  }
  assert.equal(b.score[b.winner],5);assert.equal(b.history.length,b.round);
 }
});
console.log(count+' testes da Arena 5x5 passaram');
