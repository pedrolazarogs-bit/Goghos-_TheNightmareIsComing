// Ensaio comparativo de combate; não altera regras ou catálogo salvo. Uso: npm run balance -- [atributos-antigos.json] [resultado.json]
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
['data/characters','data/gods','data/support_cards','data/reset_cards','core/battle','core/character_abilities','core/deck','core/support','core/roster','core/official_abilities','core/support_effects','core/divine','core/selection','core/ai'].forEach(f=>require(path.join(root,'js',f+'.js')));
const G=globalThis.GOGHOS;
if(process.argv[2]&&process.argv[2]!=='current'){
  const before=JSON.parse(fs.readFileSync(process.argv[2],'utf8'));
  G.CHARACTERS=G.CHARACTERS.map(c=>{const old=before.find(x=>x.id===c.id);if(!old)throw Error('Atributos ausentes: '+c.id);return {...c,maxHp:old.hp,damage:old.damage};});
}
const seeded=seed=>()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
const summarize=()=>({matches:0,firstActionEliminations:0,actions:0,draws:0,limits:0});
const result={characters:G.CHARACTERS.map(c=>({id:c.id,name:c.name,hp:c.maxHp,damage:c.damage})),duels:summarize(),teams:summarize()};
function run(player,enemy,seed,totals){
  const s=G.createBattleState({front:player,rear:[]},{front:enemy,rear:[]},[],{rng:seeded(seed)});
  // Isola o combate das equipes iniciais. Compras, resgates e recuperação não fazem parte deste ensaio.
  s.deck.pile=[];s.deck.hands={player:[],enemy:[]};let steps=0,actions=0,firstElimination=false;
  const live=side=>s.units.some(u=>u.team===side&&!G.isCharacterDefeated(u));
  while(!s.result&&live('player')&&live('enemy')&&steps++<250){
    const turn=s.turn;let r;
    if(s.abilityChoices.length)r=G.AI.resolveCharacterAbility(s);
    else {const actor=G.getNextActor(s);if(s.result)break;if(s.abilityChoices.length)continue;if(!actor)break;r=G.AI.takeTurn(s,actor);}
    if(!r?.ok)throw Error(seed+' '+player+'/'+enemy+': '+r?.error+' '+JSON.stringify({order:s.order,acted:s.acted,last:s.log.slice(-12)}));
    actions+=s.turn-turn;
    if(actions===1&&s.eliminated.length)firstElimination=true;
  }
  totals.matches++;totals.actions+=actions;if(firstElimination)totals.firstActionEliminations++;
  if(live('player')&&live('enemy'))totals.draws++;
  if(steps>=250)totals.limits++;
}
const chars=G.CHARACTERS;
for(let a=0;a<chars.length;a++)for(let b=a+1;b<chars.length;b++)for(let n=0;n<4;n++)for(let side=0;side<2;side++){
  const ids=[chars[a].id,chars[b].id];if(side)ids.reverse();
  run([ids[0]],[ids[1]],70000+a*191+b*13+n,result.duels);
}
const tier=c=>G.RARITIES.indexOf(c.rarity);
for(let a=0;a<chars.length;a++)for(let n=0;n<32;n++){
  const rng=seeded(50000+a*997+n),others=chars.filter(c=>c.id!==chars[a].id),ally=others.splice(Math.floor(rng()*others.length),1)[0];
  const options=others.flatMap((x,i)=>others.slice(i+1).map(y=>[x,y])).filter(([x,y])=>Math.abs(tier(chars[a])+tier(ally)-tier(x)-tier(y))<=1);
  if(!options.length)throw Error('Sem formação comparável.');
  const enemies=options[Math.floor(rng()*options.length)],side=n%2,own=[chars[a].id,ally.id],foes=enemies.map(c=>c.id);
  run(side?foes:own,side?own:foes,90000+a*997+n,result.teams);
}
if(process.argv[3])fs.writeFileSync(process.argv[3],JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({duels:result.duels,teams:result.teams},null,2));
