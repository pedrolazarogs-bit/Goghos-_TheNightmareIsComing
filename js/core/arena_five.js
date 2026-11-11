// 5x5: official character data, one personal ability and one class tribute.
(function(G){
'use strict';
if(!G.getCharacterById&&typeof require==='function')require('../data/characters.js');
const IDS=['nully','striker','mike','vaglar','linx','draktar','unicorn','elysh','daztirry','sam','rayvilin','sarck','zikssy','chama','cavaleiro','zuri','fonior','rayyb','endrik'];
const POWERS=['precise','aim','rear','book','claw','hunt','star','heal','oni','combo','statue','jump','fear','burn','armor','cure','soul','sleep','missile'];
const CFG=Object.freeze({WIN:5,ROUND_SEC:180,TURN_SEC:20,MAX_CYCLES:60});
const rank=u=>({COMMON:0,RARE:1,EPIC:2,MYTHIC:3,LEGENDARY:4,SECRET:5}[u.rarity]??0);
const round=n=>Math.ceil(n/5)*5;
const CHARS=IDS.map((id,i)=>{const c=G.getCharacterById(id);return Object.freeze({id,n:c.name.toUpperCase(),cls:c.class,spd:c.speed||0,def:0,atk:c.damage,hits:c.attackCount||1,life:c.maxHp,pw:POWERS[i],rarity:c.rarity,parry:c.parryThreshold||0,resistance:c.tankResistance||0,abilityId:c.abilityId});});
const SKILL=Object.freeze({star:{n:'Estrela',tg:'ally',once:true},heal:{n:'Curar',tg:'ally'},statue:{n:'Petrificar',tg:'enemy'},book:{n:'Charm',tg:'enemy'},cure:{n:'Cura total',tg:'self',once:true},sleep:{n:'Pó mágico',tg:'enemy',once:true}});
const TRIBUTES=Object.freeze({ASSASSIN:'Esquiva pela diferença de velocidade (d6, máximo 1–5).',FIGHTER:'Parry individual no d6; Destruidores ignoram Parry.',TANK:'Resistência individual a ataques. Armadura é habilidade própria.',SUPPORT:'Pode alternar frente e retaguarda sem gastar ação.',MAGO:'Mana 3/3; +1 após cada ação global. +10 de dano por ponto gasto.',DESTROYER:'Crítico +25% com 1–2 no d6. Ignora Parry.'});
class Battle{
 constructor(res,o={}){
  if(!res?.teams||res.teams.length!==2||res.teams.some(t=>t.players?.length!==5))throw Error('São necessários 5 campeões por equipe.');
  const ids=res.teams.flatMap(t=>t.players.map(p=>p.charId));if(ids.some(id=>!Number.isInteger(id)||!CHARS[id])||new Set(ids).size!==10)throw Error('O elenco deve conter 10 campeões únicos.');
  this.o={...CFG,...o};let seed=(o.seed??Math.random()*4294967296)>>>0;
  this.rnd=()=>{seed=(seed+0x6D2B79F5)>>>0;let t=seed;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296;};this.d6=()=>1+Math.floor(this.rnd()*6);
  this.names=res.teams.map(t=>t.name);this.units=[];
  res.teams.forEach((t,team)=>t.players.forEach((p,slot)=>{const c=CHARS[p.charId];this.units.push({id:this.units.length,ch:p.charId,characterId:c.id,team,slot,owner:p.name,human:!!p.human,name:c.n,cls:c.cls,pw:c.pw,rarity:c.rarity,parry:c.parry,resistance:c.resistance,base:{spd:c.spd,atk:c.atk,def:0},hits:c.hits,max:c.life,hp:c.life,mana:c.cls==='MAGO'?3:0,manaSpend:0,row:'front',sup:[],buf:[],st:{},alive:true,stat:{dmg:0,heal:0,kills:0}});}));
  this.score=[0,0];this.round=0;this.cycle=0;this.action=0;this.over=false;this.winner=null;this.history=[];this.queue=[];this.cur=null;this.timeLeft=this.o.ROUND_SEC;this.late=[];
 }
 alive(team){return this.units.filter(u=>u.alive&&u.team===team);}
 eff(u,key){return Math.max(0,u.base[key]+u.buf.filter(b=>b.k===key).reduce((sum,b)=>sum+(b.flat||0),0));}
 canAct(u){return u.alive&&this.eff(u,'spd')>0&&(u.base.atk>0||!!SKILL[u.pw]||u.pw==='claw');}
 key(u){return this.eff(u,'spd');}
 order(){return this.units.filter(u=>this.canAct(u)).sort((a,b)=>this.key(b)-this.key(a)||a.team-b.team||a.slot-b.slot);}
 preview(cur,n){let out=[cur,...this.queue.filter(u=>u.alive)].filter(Boolean);const next=this.order();while(next.length&&out.length<n)out.push(...next);return out.slice(0,n);}
 targets(a){if(a.row==='rear')return[];return this.alive(1-a.team).filter(t=>t.row==='front'&&!(t.pw==='aim'&&this.eff(a,'spd')>this.eff(t,'spd'))&&!(t.pw==='rear'&&a.cls==='ASSASSIN'));}
 abilityTargets(a){return this.alive(1-a.team).filter(t=>a.pw!=='statue'||rank(t)<=rank(a)&&t.st.pet==null);}
 skill(u){return SKILL[u.pw]||null;}
 skillReady(u){const k=this.skill(u);if(!u.alive||!k||k.once&&u.st.used||u.st.pet!=null||u.st.slp)return false;if(u.row==='rear'&&!['heal','cure','star'].includes(u.pw))return false;
  if(u.pw==='heal'||u.pw==='cure')return this.alive(u.team).some(a=>a!==u&&a.hp<a.max);
  if(u.pw==='statue')return u.st.precision>0&&u.st.petrifyAt!==this.action&&!this.petrifiedBy(u).length&&this.abilityTargets(u).length>0;
  return k.tg!=='enemy'||this.abilityTargets(u).length>0;
 }
 petrifiedBy(u){return this.units.filter(t=>t.alive&&t.st.pet===u.id);}
 breakables(u){return this.alive(u.team).filter(t=>t!==u&&t.st.pet!=null);}
 transit(u){if(u.cls!=='SUPPORT'||!u.alive||u.st.pet!=null||u.st.slp||u.row==='front'&&(this.alive(u.team).filter(t=>t.row==='front').length<=1||this.alive(u.team).filter(t=>t.row==='rear').length>=2))return false;u.row=u.row==='front'?'rear':'front';return true;}
 startRound(){this.round++;this.cycle=0;this.action=0;this.queue=[];this.late=[];this.timeLeft=this.o.ROUND_SEC;const ev=[{t:'round',n:this.round}];
  for(const u of this.units){const c=CHARS[u.ch];u.hp=u.max=c.life;u.base={spd:c.spd,atk:c.atk,def:0};u.buf=[];u.alive=true;u.row='front';u.mana=u.cls==='MAGO'?3:0;u.manaSpend=0;u.st={souls:0,fear:{},precision:3,used:false,oniUsed:false,und:null};}
  for(const u of this.units){if(u.pw==='hunt'){const foes=this.alive(1-u.team);u.st.mark=foes[Math.floor(this.rnd()*foes.length)].id;}
   if(u.pw==='fear'){const foes=this.alive(1-u.team);let scared=0;for(const f of foes)if(this.d6()<=2){u.st.fear[f.id]=1;scared++;ev.push({t:'fear',u:f.id,src:u.id});}u.buf.push({k:'atk',flat:scared*20});if(scared===foes.length)u.buf.push({k:'spd',flat:1});}}
  return ev;
 }
 next(){for(let attempt=0;attempt<2;attempt++){if(!this.queue.length){this.cycle++;this.queue=this.order();if(!this.queue.length)return null;}while(this.queue.length){const u=this.queue.shift();if(this.canAct(u))return u;}}return null;}
 beginTurn(u){this.cur=u;const ev=[];
  if(!u.alive)return{ev,skip:true};
  if(u.st.pet!=null){ev.push({t:'petrified',u:u.id});return{ev,skip:true};}
  if(u.st.slp){if(this.d6()<=2){u.st.slp=false;ev.push({t:'wake',u:u.id});}else{ev.push({t:'asleep',u:u.id});return{ev,skip:true};}}
  if(u.pw==='statue'){const targets=this.petrifiedBy(u);for(const t of targets){ev.push({t:'execute',u:t.id,src:u.id});this.kill(t,u,ev,0,true);}if(targets.length)return{ev,skip:true};}
  return{ev,skip:false};
 }
 endTurn(u){this.action++;const ev=[];
  for(const t of this.units){if(!t.alive)continue;
   for(const b of t.st.burn||[]){if(!t.alive)break;if(b.at<this.action&&b.left>0){this.strike(this.units[b.src],t,{base:b.v,true:1,dot:1},ev);b.left--;}}
   t.st.burn=(t.st.burn||[]).filter(b=>b.left>0);
   if(t.alive&&t.st.und!=null&&t.st.oniAt<this.action){t.st.und--;if(t.st.und<=0){t.st.und=null;t.buf=t.buf.filter(b=>b.src!=='oni');this.kill(t,null,ev,0,true);}}
   if(t.alive&&t.cls==='MAGO')t.mana=Math.min(3,t.mana+1);
  }
  this.late.push(...ev);
 }
 takeLate(){return this.late.splice(0);}
 heal(u,amount,ev,src){if(!u.alive)return 0;const h=Math.max(0,Math.min(amount,u.max-u.hp));if(h){u.hp+=h;(this.cur||u).stat.heal+=h;ev.push({t:'heal',u:u.id,v:h,hp:u.hp,src});}return h;}
 pick(u,id,pool){return pool.find(t=>t.id===id)||null;}
 act(u,a,tid){const ev=[];this.cur=u;if(this.over||!this.canAct(u)||u.st.pet!=null||u.st.slp)return ev;
  if(a.type==='attack'){const t=this.pick(u,tid,this.targets(u));if(t)this.doAttack(u,t,ev);}
  else if(a.type==='skill'&&this.skillReady(u)){this.doSkill(u,tid,ev);if(ev.length&&['sleep','statue','star'].includes(u.pw))ev.free=true;}
  else if(a.type==='break'){const t=this.pick(u,tid,this.breakables(u));if(t){t.st.pet=null;ev.push({t:'act',u:u.id,k:'break',tg:[t.id]},{t:'unpetrify',u:t.id});this.strike(u,t,{base:30,true:1},ev);}}
  else if(a.type==='pass')ev.push({t:'pass',u:u.id});
  return ev;
 }
 hitBase(u,t){if(u.pw==='claw')return round(t.max*.35);let base=this.eff(u,'atk');if(u.pw==='hunt'&&u.st.mark===t.id)base*=3;return base;}
 doAttack(u,t,ev){ev.push({t:'act',u:u.id,k:'attack',tg:[t.id]});let hits=u.pw==='combo'?6:u.hits;const rolled=new Set();let multiplier=1;
  if(u.pw==='precise'){const die=this.d6();ev.push({t:'dice',u:u.id,src:u.id,v:die});if(die===6&&rank(t)<=rank(u)){ev.push({t:'vital',u:t.id,src:u.id});this.kill(t,u,ev,0,true);return;}multiplier=die;}
  const mana=u.cls==='MAGO'?Math.min(u.mana,Math.max(0,u.manaSpend|0)):0;u.mana-=mana;u.manaSpend=0;
  for(let i=0;i<hits&&u.alive&&t.alive;i++){
   if(u.pw==='combo'){const die=this.d6();if(rolled.has(die)){ev.push({t:'miss',u:t.id,src:u.id,k:'combo'});break;}rolled.add(die);}
   const damage=this.strike(u,t,{base:(this.hitBase(u,t)+mana*10)*multiplier,atk:1,multi:hits>1},ev);
   if(u.pw==='burn'&&damage>0&&t.alive)this.burn(u,t,40,5,ev);
   if(u.pw==='missile'&&damage>0)for(const other of this.alive(t.team).filter(x=>x.row===t.row&&Math.abs(x.slot-t.slot)===1))this.strike(u,other,{base:round(damage*.2),true:1,splash:1},ev);
  }
 }
 burn(u,t,value,left,ev){t.st.burn||=[];t.st.burn.push({src:u.id,v:value,left,at:this.action+1});ev.push({t:'status',u:t.id,k:'burn'});}
 doSkill(u,tid,ev){const k=this.skill(u);const allies=this.alive(u.team);const pool=k.tg==='ally'?allies.filter(t=>u.pw==='star'||t!==u&&t.hp<t.max):this.abilityTargets(u);const t=k.tg==='self'?u:this.pick(u,tid,pool);if(!t)return;
  ev.push({t:'act',u:u.id,k:'skill',name:k.n,tg:[t.id]});
  if(k.once)u.st.used=true;
  if(u.pw==='heal')this.heal(t,this.eff(u,'atk'),ev,'skill');
  if(u.pw==='star'){t.max+=150;t.hp+=150;t.buf.push({k:'atk',flat:50,src:'star:'+u.id},{k:'spd',flat:1,src:'star:'+u.id});t.st.starred=u.id+1;ev.push({t:'heal',u:t.id,v:150,hp:t.hp,src:'star'});}
  if(u.pw==='cure')for(const a of allies.filter(a=>a!==u))this.heal(a,a.max-a.hp,ev,'skill');
  if(u.pw==='statue'){u.st.petrifyAt=this.action;const die=this.d6();ev.push({t:'dice',u:t.id,src:u.id,v:die});if(die<=u.st.precision){t.st.pet=u.id;ev.push({t:'petrify',u:t.id,src:u.id});}else{u.st.precision--;ev.push({t:'resist',u:t.id});}}
  if(u.pw==='sleep'){t.st.slp=true;ev.push({t:'sleep',u:t.id,src:u.id});}
  if(u.pw==='book'){if(rank(t)<rank(u)){ev.push({t:'execute',u:t.id,src:u.id});this.kill(t,u,ev,0,true);}else this.strike(u,t,{base:200,true:1},ev);}
 }
 strike(att,tgt,f,ev,depth=0){if(!tgt?.alive)return 0;let critical=false;
  if(f.atk&&!f.splash){
   const blocked=tgt.st.pet!=null||tgt.st.slp;
   if(tgt.cls==='ASSASSIN'&&att.cls!=='MAGO'&&!blocked){const diff=Math.min(5,this.eff(tgt,'spd')-this.eff(att,'spd'));if(diff>0){const die=this.d6();if(die<=diff){ev.push({t:'dodge',u:tgt.id,src:att.id,roll:die});return 0;}}}
   if(tgt.cls==='FIGHTER'&&att.cls!=='DESTROYER'&&!blocked&&tgt.parry){const die=this.d6();if(die<=tgt.parry){ev.push({t:'parry',u:tgt.id,src:att.id,roll:die});return 0;}}
   if(att.cls==='DESTROYER')critical=this.d6()<=2;
  }
  let damage=round(f.base*(critical?1.25:1));if(tgt.pw==='armor')damage=round(damage*.2);if(tgt.cls==='TANK'&&f.atk)damage=round(damage*(1-tgt.resistance));damage=Math.max(0,Math.min(damage,tgt.hp));
  const before=tgt.hp;tgt.hp=Math.max(0,tgt.hp-damage);
  if(tgt.hp===0&&tgt.pw==='oni'&&!tgt.st.oniUsed){tgt.st.oniUsed=true;tgt.st.und=4;tgt.st.oniAt=this.action+1;tgt.hp=1;tgt.buf.push({k:'atk',flat:30,src:'oni'});ev.push({t:'undying',u:tgt.id});}
  else if(tgt.st.und!=null)tgt.hp=Math.max(1,tgt.hp);
  const actual=before-tgt.hp;att.stat.dmg+=Math.max(0,actual);ev.push({t:'dmg',u:tgt.id,src:att.id,v:Math.max(0,actual),hp:tgt.hp,crit:critical,multi:f.multi,dot:f.dot});
  if(tgt.hp<=0)this.kill(tgt,att,ev,depth);
  // Personal reactions only; nothing is copied to the team.
  if(f.atk&&tgt.pw==='burn'&&att.alive)this.burn(tgt,att,35,3,ev);
  if(f.atk&&tgt.pw==='jump'&&tgt.alive&&actual>0&&depth<4){if(rank(att)<4){ev.push({t:'jump',u:att.id,src:tgt.id});this.kill(att,tgt,ev,depth+1,true);}else this.strike(tgt,att,{base:390,true:1},ev,depth+1);}
  return Math.max(0,actual);
 }
 kill(u,by,ev,depth=0,force=false){if(!u.alive)return;
  if(by&&u.pw==='oni'&&!u.st.oniUsed){u.st.oniUsed=true;u.st.und=4;u.st.oniAt=this.action+1;u.hp=1;u.buf.push({k:'atk',flat:30,src:'oni'});ev.push({t:'undying',u:u.id});return;}
  if(u.st.und!=null&&by){u.hp=1;return;}
  u.alive=false;u.hp=0;u.st.und=null;u.buf=u.buf.filter(b=>b.src!=='oni');if(by&&by.team!==u.team)by.stat.kills++;ev.push({t:'die',u:u.id,src:by?.id??-1});
  for(const t of this.units){if(t.st.pet===u.id)t.st.pet=null;if(t.alive&&t.pw==='soul'){t.st.souls++;t.max+=20;ev.push({t:'soul',u:t.id,n:t.st.souls});}}
  // Re-expose the side when its final front defender falls.
  if(!this.alive(u.team).some(t=>t.row==='front'))this.alive(u.team).forEach(t=>t.row='front');
 }
 check(){const n=[this.alive(0).length,this.alive(1).length];return n[0]&&n[1]?null:n[0]?0:n[1]?1:this.cur?.team??0;}
 byTime(){const n=[this.alive(0).length,this.alive(1).length];if(n[0]!==n[1])return n[0]>n[1]?0:1;const hp=[0,1].map(t=>this.alive(t).reduce((s,u)=>s+u.hp,0));return hp[0]!==hp[1]?hp[0]>hp[1]?0:1:this.rnd()<.5?0:1;}
 finishRound(winner,kind){if(this.over)return{w:this.winner,done:true};this.score[winner]++;this.history.push({round:this.round,winner,kind});if(this.score[winner]>=this.o.WIN){this.over=true;this.winner=winner;}return{w:winner,done:this.over};}
 threat(u){return this.eff(u,'atk')/Math.max(1,u.hp)+(u.pw==='statue'?.5:0);}
 bestFoe(u){return this.targets(u).map(t=>({t,v:this.hitBase(u,t)/Math.max(1,t.hp)+(t.pw==='jump'?-2:0)})).sort((a,b)=>b.v-a.v)[0];}
 ai(u){const foes=this.targets(u),allies=this.alive(u.team);if(u.st.pet!=null||u.st.slp)return{a:{type:'pass'},tid:-1};
  const broken=this.breakables(u);if(broken.length)return{a:{type:'break'},tid:broken[0].id};
  if(this.skillReady(u)){
   if(u.pw==='star'){const t=allies.slice().sort((a,b)=>this.eff(b,'atk')-this.eff(a,'atk'))[0];return{a:{type:'skill'},tid:t.id};}
   if(u.pw==='heal'||u.pw==='cure'){const t=allies.filter(t=>t!==u&&t.hp<t.max*.65).sort((a,b)=>a.hp/a.max-b.hp/b.max)[0];if(t)return{a:{type:'skill'},tid:t.id};}
   if(['book','statue','sleep'].includes(u.pw)){const t=this.abilityTargets(u).sort((a,b)=>b.hp-a.hp)[0];if(t)return{a:{type:'skill'},tid:t.id};}
  }
  if(!foes.length)return{a:{type:'pass'},tid:-1};if(u.cls==='MAGO')u.manaSpend=u.mana;return{a:{type:'attack'},tid:this.bestFoe(u).t.id};
 }
}
const api=Object.freeze({Battle,CFG,CHARS,SKILL,TRIBUTES,statsFor:i=>CHARS[i],character:i=>G.getCharacterById(IDS[i])});G.ArenaFiveEngine=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis.GOGHOS=globalThis.GOGHOS||{});
