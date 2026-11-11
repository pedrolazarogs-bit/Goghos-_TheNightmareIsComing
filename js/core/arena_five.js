// Independent 5x5 rules from the supplied official-roster preview.
(function(G){
const BattleEngine=(()=>{
const CFG={WIN:5,ROUND_SEC:180,TURN_SEC:20,CRIT:.10,CRIT_X:1.5,VAR:.06,MAX_CYCLES:60};
/* [{"n": "NULLY", "cls": "ASSASSIN", "spd": 7, "def": 30, "atk": 45, "hits": 1, "life": 190, "pw": "precise"}, {"n": "STRIKER", "cls": "DESTROYER", "spd": 4, "def": 10, "atk": 250, "hits": 1, "life": 140, "pw": "aim"}, {"n": "MIKE", "cls": "DESTROYER", "spd": 3, "def": 20, "atk": 200, "hits": 1, "life": 200, "pw": "rear"}, {"n": "VAGLAR", "cls": "FIGHTER", "spd": 4, "def": 30, "atk": 0, "hits": 1, "life": 270, "pw": "book"}, {"n": "LINIX", "cls": "FIGHTER", "spd": 4, "def": 20, "atk": 120, "hits": 1, "life": 280, "pw": "claw"}, {"n": "DRAKTAR", "cls": "ASSASSIN", "spd": 6, "def": 20, "atk": 70, "hits": 2, "life": 190, "pw": "hunt"}, {"n": "UNICORN", "cls": "SUPORTT", "spd": 3, "def": 20, "atk": 100, "hits": 1, "life": 320, "pw": "star"}, {"n": "ELYSH", "cls": "SUPORTT", "spd": 4, "def": 30, "atk": 100, "hits": 1, "life": 260, "pw": "heal"}, {"n": "DAZTIRRY", "cls": "FIGHTER", "spd": 4, "def": 35, "atk": 130, "hits": 1, "life": 320, "pw": "oni"}, {"n": "SAM", "cls": "FIGHTER", "spd": 5, "def": 20, "atk": 50, "hits": 6, "life": 250, "pw": "combo"}, {"n": "RAYVILIN", "cls": "FIGHTER", "spd": 5, "def": 20, "atk": 120, "hits": 1, "life": 280, "pw": "statue"}, {"n": "SARCK", "cls": "ASSASSIN", "spd": 0, "def": 10, "atk": 0, "hits": 1, "life": 220, "pw": "jump"}, {"n": "ZIKSSY", "cls": "ASSASSIN", "spd": 7, "def": 20, "atk": 120, "hits": 1, "life": 190, "pw": "fear"}, {"n": "CHAMA", "cls": "DESTROYER", "spd": 4, "def": 10, "atk": 35, "hits": 6, "life": 140, "pw": "burn"}, {"n": "ZÉDIA", "cls": "SUPORTT", "spd": 5, "def": 50, "atk": 0, "hits": 1, "life": 650, "pw": "immortal"}, {"n": "ZURI", "cls": "SUPORTT", "spd": 3, "def": 30, "atk": 100, "hits": 1, "life": 300, "pw": "cure"}, {"n": "FONIOR", "cls": "SUPORTT", "spd": 3, "def": 25, "atk": 110, "hits": 1, "life": 270, "pw": "soul"}, {"n": "RAYYB", "cls": "SUPORTT", "spd": 4, "def": 20, "atk": 110, "hits": 1, "life": 300, "pw": "sleep"}, {"n": "DASHOW ONLY", "cls": "FIGHTER", "spd": 2, "def": 30, "atk": 140, "hits": 1, "life": 420, "pw": "p2"}] : spd, def, atk (por golpe), hits (golpes por ataque), life, cls, pw (poder) */
const CHARS=[{"n": "NULLY", "cls": "ASSASSIN", "spd": 7, "def": 30, "atk": 45, "hits": 1, "life": 190, "pw": "precise"}, {"n": "STRIKER", "cls": "DESTROYER", "spd": 4, "def": 10, "atk": 250, "hits": 1, "life": 140, "pw": "aim"}, {"n": "MIKE", "cls": "DESTROYER", "spd": 3, "def": 20, "atk": 200, "hits": 1, "life": 200, "pw": "rear"}, {"n": "VAGLAR", "cls": "FIGHTER", "spd": 4, "def": 30, "atk": 0, "hits": 1, "life": 270, "pw": "book"}, {"n": "LINIX", "cls": "FIGHTER", "spd": 4, "def": 20, "atk": 120, "hits": 1, "life": 280, "pw": "claw"}, {"n": "DRAKTAR", "cls": "ASSASSIN", "spd": 6, "def": 20, "atk": 70, "hits": 2, "life": 190, "pw": "hunt"}, {"n": "UNICORN", "cls": "SUPORTT", "spd": 3, "def": 20, "atk": 100, "hits": 1, "life": 320, "pw": "star"}, {"n": "ELYSH", "cls": "SUPORTT", "spd": 4, "def": 30, "atk": 100, "hits": 1, "life": 260, "pw": "heal"}, {"n": "DAZTIRRY", "cls": "FIGHTER", "spd": 4, "def": 35, "atk": 130, "hits": 1, "life": 320, "pw": "oni"}, {"n": "SAM", "cls": "FIGHTER", "spd": 5, "def": 20, "atk": 50, "hits": 6, "life": 250, "pw": "combo"}, {"n": "RAYVILIN", "cls": "FIGHTER", "spd": 5, "def": 20, "atk": 120, "hits": 1, "life": 280, "pw": "statue"}, {"n": "SARCK", "cls": "ASSASSIN", "spd": 0, "def": 10, "atk": 0, "hits": 1, "life": 220, "pw": "jump"}, {"n": "ZIKSSY", "cls": "ASSASSIN", "spd": 7, "def": 20, "atk": 120, "hits": 1, "life": 190, "pw": "fear"}, {"n": "CHAMA", "cls": "DESTROYER", "spd": 4, "def": 10, "atk": 35, "hits": 6, "life": 140, "pw": "burn"}, {"n": "ZÉDIA", "cls": "SUPORTT", "spd": 5, "def": 50, "atk": 0, "hits": 1, "life": 650, "pw": "immortal"}, {"n": "ZURI", "cls": "SUPORTT", "spd": 3, "def": 30, "atk": 100, "hits": 1, "life": 300, "pw": "cure"}, {"n": "FONIOR", "cls": "SUPORTT", "spd": 3, "def": 25, "atk": 110, "hits": 1, "life": 270, "pw": "soul"}, {"n": "RAYYB", "cls": "SUPORTT", "spd": 4, "def": 20, "atk": 110, "hits": 1, "life": 300, "pw": "sleep"}, {"n": "DASHOW ONLY", "cls": "FIGHTER", "spd": 2, "def": 30, "atk": 140, "hits": 1, "life": 420, "pw": "p2"}];
/* poderes ATIVOS (botão no turno). tg: enemy | ally | self */
const SKILL={hunt:{n:'Caça-Clisma',tg:'enemy'},star:{n:'Estrela Celeste',tg:'ally',once:1},heal:{n:'Curar',tg:'ally'},statue:{n:'Maldição',tg:'enemy'},
 book:{n:'Escrever',tg:'enemy'},cure:{n:'Cura Vitalícia',tg:'self',once:1},p2:{n:'Player 2',tg:'self'}};
const CLB={ASSASSIN:40,FIGHTER:120,SUPORTT:140,TANK:170,DESTROYER:0}; /* Linix: dano extra por classe */
const statsFor=i=>CHARS[i]||CHARS[0];

class Battle{
 constructor(res,o={}){
  if(!res||!Array.isArray(res.teams)||res.teams.length!==2||res.teams.some(t=>!Array.isArray(t.players)||t.players.length!==5))throw Error('São necessários 5 campeões por equipe.');
  const ids=res.teams.flatMap(t=>t.players.map(p=>p.charId));if(ids.some(id=>!Number.isInteger(id)||!CHARS[id])||new Set(ids).size!==10)throw Error('O elenco deve conter 10 campeões únicos.');
  this.o=Object.assign({},CFG,o);let s=((o.seed!=null?o.seed:Math.random()*4294967296)>>>0);
  this.rnd=()=>{s=(s+0x6D2B79F5)>>>0;let t=s;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296};
  this.d6=()=>1+Math.floor(this.rnd()*6);
  this.names=res.teams.map(t=>t.name);this.units=[];
  res.teams.forEach((t,k)=>t.players.forEach((p,j)=>{const c=statsFor(p.charId);
   this.units.push({id:this.units.length,team:k,slot:j,owner:p.name,human:!!p.human,ch:p.charId,name:c.n||p.char,cls:c.cls,pw:c.pw,base:{spd:c.spd,def:c.def,atk:c.atk},hits:c.hits||1,max:c.life,hp:c.life,
    buf:[],sup:[...new Set(p.support||[])].filter(s=>['Escudo','Cura','Velocidade','Foco','Vingança','Sorte'].includes(s)).slice(0,2),alive:true,tb:0,st:{},stat:{dmg:0,heal:0,kills:0}})}));
  this.score=[0,0];this.round=0;this.over=false;this.winner=null;this.history=[];this.queue=[];this.cycle=0;this.timeLeft=this.o.ROUND_SEC;this.cur=null;this.lastAtk=-1}

 /* ---------- consultas ---------- */
 alive(t){return this.units.filter(u=>u.team===t&&u.alive)}
 eff(u,s){let f=0,m=1;for(const b of u.buf)if(b.k===s){f+=b.flat||0;m+=b.v||0}return(u.base[s]+f)*Math.max(.1,m)}
 canAct(u){return u.alive&&(u.base.atk>0||!!SKILL[u.pw])&&u.base.spd>0}
 key(u){return this.eff(u,'spd')+(u.sup.includes('Velocidade')?.5:0)+u.tb}
 order(){return this.units.filter(u=>this.canAct(u)).sort((a,b)=>this.key(b)-this.key(a))}
 preview(cur,n){let out=[cur].concat(this.queue.filter(u=>u.alive));const nx=this.order();while(nx.length&&out.length<n)out=out.concat(nx);return out.slice(0,n)}
 /* alvos válidos de um ataque: "Na Mira" (STRIKER) só pode ser alvo de quem não é mais rápido; sem opção, vale qualquer um */
 targets(a){const f=this.units.filter(t=>t.alive&&t.team!==a.team),ok=f.filter(t=>!(t.pw==='aim'&&this.eff(a,'spd')>this.eff(t,'spd')));return ok}
 skill(u){return SKILL[u.pw]||null}
 skillReady(u){const k=this.skill(u);if(!k)return false;if(k.once&&u.st.used)return false;
  if(k.tg==='ally'&&!this.alive(u.team).some(a=>a!==u||u.pw==='heal'))return false;
  if(k.tg==='ally'&&u.pw==='heal'&&!this.alive(u.team).some(a=>a.hp<a.max))return false;
  if(u.pw==='p2'&&!(u.st.alt&&u.st.alt.hp>0))return false;if(u.pw==='statue'&&this.petrifiedBy(u).length)return false;if(k.tg==='enemy'&&!this.targets(u).length)return false;return true}
 petrifiedBy(u){return this.units.filter(t=>t.alive&&t.st.pet===u.id)}
 breakables(u){return this.units.filter(t=>t.alive&&t.team===u.team&&t!==u&&t.st.pet!=null)}

 /* ---------- rodada / ciclo / turno ---------- */
 startRound(){
  this.round++;this.cycle=0;this.queue=[];this.timeLeft=this.o.ROUND_SEC;this.lastAtk=-1;const ev=[{t:'round',n:this.round}];
  for(const u of this.units){const c=statsFor(u.ch);u.hp=u.max=c.life;u.buf=[];u.alive=true;u.tb=this.rnd()*.4;u.base={spd:c.spd,def:c.def,atk:c.atk};u.st={souls:0,fear:{}};
   if(u.pw==='p2')u.st.alt={hp:c.life,max:c.life}}
  for(const u of this.units)if(u.sup.includes('Escudo')){u.buf.push({k:'def',v:.10,turns:999});ev.push({t:'sup',u:u.id,name:'Escudo'})}
  for(const z of this.units.filter(u=>u.pw==='fear')){const foes=this.alive(1-z.team);let all=true;
   foes.forEach(f=>{if(this.d6()<=2){z.st.fear[f.id]=1;ev.push({t:'fear',u:f.id,src:z.id})}else all=false});
   if(all&&foes.length){z.buf.push({k:'spd',flat:1,turns:999});ev.push({t:'status',u:z.id,k:'spd+'})}}
  return ev}
 next(){for(let g=0;g<999;g++){if(!this.queue.length){this.cycle++;this.queue=this.order();
   this.units.forEach(u=>{if(u.st.alt&&u.alive)u.st.alt.hp=Math.min(u.st.alt.max,u.st.alt.hp+15)});if(!this.queue.length)return null}
  const u=this.queue.shift();if(u&&this.canAct(u))return u}return null}
 beginTurn(u){const ev=[];this.cur=u;
  if(u.sup.includes('Cura')){const t=[];const h=this.heal(u,Math.round(u.max*.06),t,'Cura');if(h>0){ev.push({t:'sup',u:u.id,name:'Cura'});ev.push(...t)}}
  /* queimadura: dano verdadeiro no início do turno */
  if(u.st.burn&&u.st.burn.length){for(const b of u.st.burn.slice()){if(!u.alive)break;const src=this.units[b.src];this.strike(src,u,{base:b.v,true:1,dot:1},ev);b.t--}u.st.burn=u.st.burn.filter(b=>b.t>0)}
  if(!u.alive)return{ev,skip:true};
  /* RAYVILIN: executa quem continua petrificado */
  if(u.pw==='statue')for(const t of this.petrifiedBy(u)){ev.push({t:'execute',u:t.id,src:u.id});t.hp=0;this.kill(t,u,ev,0,1)}
  if(!u.alive)return{ev,skip:true};
  if(u.st.pet!=null){ev.push({t:'petrified',u:u.id});return{ev,skip:true}}
  if(u.st.slp){if(this.d6()<=2){u.st.slp=0;ev.push({t:'wake',u:u.id})}else{ev.push({t:'asleep',u:u.id});return{ev,skip:true}}}
  return{ev,skip:false}}
 endTurn(u){u.buf=u.buf.filter(b=>--b.turns>0);
  if(u.alive&&u.st.und!=null){u.st.und--;if(u.st.und<=0){const ev=[];u.st.und=null;u.hp=0;this.kill(u,null,ev,0);this.late=(this.late||[]).concat(ev)}}}
 takeLate(){const l=this.late||[];this.late=[];return l}

 /* ---------- ações ---------- */
 actions(u){const a=[];if(u.base.atk>0)a.push({type:'attack'});if(this.skill(u))a.push({type:'skill',ok:this.skillReady(u)});
  if(this.breakables(u).length)a.push({type:'break'});a.push({type:'pass'});return a}
 heal(u,amount,ev,src){const h=Math.max(0,Math.min(amount,u.max-u.hp));if(h>0){u.hp+=h;(src==='skill'&&this.cur?this.cur:u).stat.heal+=h;ev.push({t:'heal',u:u.id,v:h,hp:u.hp,src})}return h}
 pick(u,tid,pool){let t=this.units[tid];if(!t||!t.alive||!pool.includes(t)){t=pool[Math.floor(this.rnd()*pool.length)]}return t}
 act(u,a,tid){
  const ev=[];this.cur=u;
  if(!this.canAct(u))return ev;
  if(a.type==='attack'){const t=this.pick(u,tid,this.targets(u));if(!t)return ev;this.doAttack(u,t,ev);
   if(u.alive&&u.sup.includes('Sorte')&&this.rnd()<.25){const t2=this.pick(u,tid,this.targets(u));if(t2){ev.push({t:'sup',u:u.id,name:'Sorte'});this.doAttack(u,t2,ev,1)}}}
  else if(a.type==='skill'){if(!this.skillReady(u))return ev;this.doSkill(u,tid,ev);
   if(u.alive&&u.sup.includes('Sorte')&&this.rnd()<.25&&u.pw!=='p2'&&u.pw!=='cure'&&u.pw!=='star'){ev.push({t:'sup',u:u.id,name:'Sorte'});this.doSkill(u,tid,ev,1)}}
  else if(a.type==='break'){const b=this.units[tid]&&this.breakables(u).includes(this.units[tid])?this.units[tid]:this.breakables(u)[0];
   if(b){ev.push({t:'act',u:u.id,k:'break',tg:[b.id]});if(this.rnd()<.5){b.st.pet=null;ev.push({t:'unpetrify',u:b.id})}else ev.push({t:'resist',u:b.id})}}
  else ev.push({t:'pass',u:u.id});
  return ev}
 /* dano base de UM golpe do ataque básico */
 hitBase(u,t){let b=this.eff(u,'atk');
  if(u.pw==='precise')b=45+Math.floor(this.rnd()*176);                       // 45~220
  if(u.pw==='claw')b+=CLB[t.cls]||0;
  if(u.pw==='fear'&&u.st.fear[t.id])b+=20;
  if(u.pw==='hunt'&&u.st.mark===t.id)b=110;
  return b}
 doAttack(u,t,ev,again){
  ev.push({t:'act',u:u.id,k:'attack',tg:[t.id],again:again?1:0});
  /* VAGLAR: atacado 2 vezes seguidas, o livro o elimina */
  if(this.lastAtk===t.id)t.st.row=(t.st.row||1)+1;else t.st.row=1;this.lastAtk=t.id;
  const hits=u.hits;
  for(let i=0;i<hits&&t.alive&&u.alive;i++){
   if(u.pw==='combo'&&this.rnd()>=.85){ev.push({t:'miss',u:t.id,src:u.id,k:'combo'});break}                       // errou: combo quebrado
   if(u.pw==='burn'){this.strike(u,t,{base:this.eff(u,'atk'),mult:1,true:1,burn:1},ev);this.burn(u,t,ev);break}
   if(u.pw==='precise'&&this.rnd()<.10){ev.push({t:'vital',u:t.id,src:u.id});t.hp=0;this.kill(t,u,ev,0,1);break}
   this.strike(u,t,{base:this.hitBase(u,t),atk:1,multi:hits>1},ev)}
  if(u.pw==='sleep'&&t.alive&&!t.st.slp){t.st.slp=1;ev.push({t:'sleep',u:t.id,src:u.id})}
  if(t.alive&&t.pw==='book'&&t.st.row>=2){ev.push({t:'book',u:t.id});t.hp=0;this.kill(t,u,ev,0,1)}}
 burn(u,t,ev){const v=this.eff(u,'atk'),n=5;t.st.burn=(t.st.burn||[]);t.st.burn.push({v,t:n,src:u.id});ev.push({t:'status',u:t.id,k:'burn'})}
 doSkill(u,tid,ev,again){const k=SKILL[u.pw],g=again?1:0;
  if(k.tg==='self'){ev.push({t:'act',u:u.id,k:'skill',name:k.n,tg:[u.id],again:g});
   if(u.pw==='cure'){u.st.used=1;for(const a of this.alive(u.team))this.heal(a,a.max-a.hp,ev,'skill')}
   if(u.pw==='p2'){const alt=u.st.alt,h=u.hp;u.hp=alt.hp;alt.hp=h;ev.push({t:'swap',u:u.id,hp:u.hp})}
   return}
  if(k.tg==='ally'){const pool=this.alive(u.team).filter(a=>u.pw==='heal'?a.hp<a.max:a!==u),t=this.pick(u,tid,pool.length?pool:[u]);
   ev.push({t:'act',u:u.id,k:'skill',name:k.n,tg:[t.id],again:g});
   if(u.pw==='heal')this.heal(t,Math.round(this.eff(u,'atk')),ev,'skill');
   if(u.pw==='star'){u.st.used=1;t.buf.push({k:'atk',flat:20,turns:999,src:'star:'+u.id},{k:'spd',flat:1,turns:999,src:'star:'+u.id});t.max+=50;t.hp+=50;t.st.starred=u.id+1;ev.push({t:'status',u:t.id,k:'star'});ev.push({t:'heal',u:t.id,v:50,hp:t.hp,src:'star:'+u.id})}
   return}
  const t=this.pick(u,tid,this.targets(u));if(!t)return;ev.push({t:'act',u:u.id,k:'skill',name:k.n,tg:[t.id],again:g});
  if(u.pw==='hunt'){u.st.mark=t.id;u.buf=u.buf.filter(b=>b.src!=='hunt');u.buf.push({k:'spd',flat:1,turns:999,src:'hunt'});ev.push({t:'status',u:t.id,k:'mark'})}
  if(u.pw==='statue'){const r=this.d6();ev.push({t:'dice',u:t.id,v:r,src:u.id});if(r<=3){t.st.pet=u.id;ev.push({t:'petrify',u:t.id,src:u.id})}else ev.push({t:'resist',u:t.id})}
  if(u.pw==='book'){const prev=this.units.find(x=>x.alive&&x.team!==u.team&&u.st.mark===x.id);
   if(prev){ev.push({t:'execute',u:prev.id,src:u.id});prev.hp=0;this.kill(prev,u,ev,0,1)}
   if(t.alive){u.st.mark=t.id;ev.push({t:'status',u:t.id,k:'mark'})}}}

 /* ---------- dano ---------- */
 crit(a){return this.rnd()<this.o.CRIT+(a.sup.includes('Foco')?.1:0)}
 strike(att,tgt,f,ev,depth=0){
  if(!tgt.alive)return 0;
  /* MIKE (Retaguarda): ataques de ASSASSIN contra ele são anulados */
  if(tgt.pw==='rear'&&att.cls==='ASSASSIN'&&!f.true){ev.push({t:'block',u:tgt.id,src:att.id});return 0}
  let d,crit=false;
  if(f.true)d=Math.max(1,Math.round(f.base));
  else{d=f.base*100/(100+this.eff(tgt,'def')*(1-(f.pierce||0)));
   crit=!f.noCrit&&this.crit(att);if(crit)d*=this.o.CRIT_X;d*=1+(this.rnd()*2-1)*this.o.VAR;d=Math.max(1,Math.round(d))}
  d=Math.min(d,tgt.hp);this.applyDmg(tgt,d,att,ev,depth,{crit,multi:f.multi,dot:f.dot});
  att.stat.dmg+=d;
  /* SARCK (Jumpscare): quem o fizer receber dano morre; CHAMA queima quem o ataca */
  if(tgt.pw==='jump'&&att.alive&&att.team!==tgt.team){ev.push({t:'jump',u:att.id,src:tgt.id});att.hp=0;this.kill(att,tgt,ev,depth,1)}
  else if(f.atk&&tgt.pw==='burn'&&att.alive&&att.team!==tgt.team&&!(att.st.burn||[]).some(b=>b.src===tgt.id&&b.v===20)){att.st.burn=att.st.burn||[];att.st.burn.push({v:20,t:3,src:tgt.id});ev.push({t:'status',u:att.id,k:'burn'})}
  return d}
 applyDmg(t,d,src,ev,depth,x){
  let hp=t.hp-d;
  if(hp<=0&&t.pw!=='immortal'&&this.alive(t.team).some(z=>z.pw==='immortal'&&z!==t)){hp=1;ev.push({t:'dmg',u:t.id,src:src.id,v:t.hp-1,hp:1,crit:x.crit,multi:x.multi});ev.push({t:'immortal',u:t.id});t.hp=1;return}
  if(hp<=0&&t.st.und==null&&t.pw!=='oni'&&this.alive(t.team).some(z=>z.pw==='oni'&&z!==t)&&!t.st.usedOni){
   t.st.und=2;t.st.usedOni=1;t.buf.push({k:'atk',flat:20,turns:3,src:'oni'});ev.push({t:'dmg',u:t.id,src:src.id,v:t.hp-1,hp:1,crit:x.crit,multi:x.multi});ev.push({t:'undying',u:t.id});t.hp=1;return}
  if(t.st.und!=null){/* já "morto-vivo": fica em 1 */ ev.push({t:'dmg',u:t.id,src:src.id,v:Math.max(0,t.hp-1),hp:1,crit:x.crit,multi:x.multi});t.hp=1;return}
  t.hp=Math.max(0,hp);ev.push({t:'dmg',u:t.id,src:src.id,v:d,hp:t.hp,crit:x.crit,multi:x.multi,dot:x.dot});
  if(t.hp<=0)this.kill(t,src,ev,depth)}
 kill(u,by,ev,depth,force){
  if(!u.alive)return;
  if(u.pw!=='immortal'&&this.alive(u.team).some(z=>z.pw==='immortal'&&z!==u)){u.hp=1;ev.push({t:'immortal',u:u.id});return;}
  for(const h of this.units)if(h.st.mark===u.id&&h.pw==='hunt'){h.st.mark=null;h.buf=h.buf.filter(b=>b.src!=='hunt');}
  /* DASHOW ONLY: a outra versão assume se tiver vida */
  if(!force&&u.st.alt&&u.st.alt.hp>0){u.hp=u.st.alt.hp;u.st.alt.hp=0;ev.push({t:'swap',u:u.id,hp:u.hp,auto:1});return}
  u.alive=false;u.hp=0;if(by&&by.team!==u.team)by.stat.kills++;ev.push({t:'die',u:u.id,src:by?by.id:-1});
  for(const t of this.units)if(t.st.pet===u.id)t.st.pet=null;
  if(u.pw==='star')for(const t of this.units)if(t.st.starred===u.id+1){t.buf=t.buf.filter(b=>b.src!=='star:'+u.id);t.max-=50;t.hp=Math.min(t.hp,t.max);t.st.starred=0}
  for(const f of this.units)if(f.alive&&f.pw==='soul'&&f!==u&&f.st.souls<5){f.st.souls++;f.max+=30;f.hp+=30;ev.push({t:'soul',u:f.id,n:f.st.souls});ev.push({t:'heal',u:f.id,v:30,hp:f.hp,src:'soul'})}
  if(u.sup.includes('Vingança')&&depth<8){let tg=by&&by.alive&&by.team!==u.team?by:null;
   if(!tg){const f=this.alive(1-u.team);tg=f[Math.floor(this.rnd()*f.length)]}
   if(tg){ev.push({t:'sup',u:u.id,name:'Vingança'});this.strike(u,tg,{base:Math.max(50,u.base.atk),true:1,rev:1},ev,depth+1)}}}

 /* ---------- fim de rodada / partida ---------- */
 check(){const a=[this.alive(0).length,this.alive(1).length];if(a[0]&&a[1])return null;return!a[0]&&!a[1]?(this.cur?this.cur.team:0):(a[0]?0:1)}
 byTime(){const hp=t=>this.units.filter(u=>u.team===t).reduce((s,u)=>s+u.hp,0),n=[this.alive(0).length,this.alive(1).length];
  if(n[0]!==n[1])return n[0]>n[1]?0:1;const h=[hp(0),hp(1)];if(h[0]!==h[1])return h[0]>h[1]?0:1;return this.rnd()<.5?0:1}
 finishRound(w,kind){this.score[w]++;this.history.push({round:this.round,winner:w,kind});
  if(this.score[w]>=this.o.WIN){this.over=true;this.winner=w}return{w,done:this.over}}

 /* ---------- IA (bots e modo AUTO) ---------- */
 threat(t){return this.eff(t,'atk')*(t.hits||1)/Math.max(1,t.hp)+(t.pw==='immortal'?.6:0)+(t.pw==='statue'||t.pw==='book'?.4:0)}
 val(u,t){const tg=this.targets(u);let d=this.hitBase(u,t)*(u.hits>1&&u.pw!=='combo'?u.hits:1)*100/(100+this.eff(t,'def'));let v=d/t.hp;if(d>=t.hp)v+=1.2;v+=this.threat(t)*.15;
  if(t.pw==='immortal')v+=.7;if(t.pw==='jump'&&tg.length>1)v-=5;if(t.pw==='rear'&&u.cls==='ASSASSIN'&&tg.length>1)v-=5;
  if(u.pw==='sleep'&&!t.st.slp)v+=.2;return v}
 bestFoe(u){const tg=this.targets(u);return tg.map(t=>({t,v:this.val(u,t)})).sort((a,b)=>b.v-a.v)[0]}
 ai(u){
  const foes=this.targets(u),al=this.alive(u.team);
  if(!foes.length)return{a:{type:'pass'},tid:-1};
  const att=()=>{const b=this.bestFoe(u);return{a:{type:'attack'},tid:b.t.id}};
  /* quebrar maldição de aliado petrificado */
  const br=this.breakables(u);if(br.length&&this.rnd()<.75)return{a:{type:'break'},tid:br[0].id};
  if(u.base.atk<=0&&!this.skill(u))return{a:{type:'pass'},tid:-1};
  const rdy=this.skillReady(u);
  switch(u.pw){
   case'book':{const c=foes.sort((a,b)=>this.threat(b)-this.threat(a))[0];return{a:{type:'skill'},tid:c.id}}
   case'statue':{if(rdy&&this.rnd()<.8){const c=foes.filter(t=>t.st.pet==null).sort((a,b)=>this.threat(b)-this.threat(a))[0];if(c)return{a:{type:'skill'},tid:c.id}}return att()}
   case'hunt':{if(u.st.mark==null||!this.units[u.st.mark].alive){const c=foes.slice().sort((a,b)=>b.hp-a.hp)[0];return{a:{type:'skill'},tid:c.id}}return{a:{type:'attack'},tid:u.st.mark}}
   case'star':{if(rdy){const c=al.filter(a=>a!==u).sort((a,b)=>this.eff(b,'atk')*(b.hits||1)-this.eff(a,'atk')*(a.hits||1))[0];if(c)return{a:{type:'skill'},tid:c.id}}return att()}
   case'heal':{const w=al.filter(a=>a.hp<a.max*.55).sort((a,b)=>a.hp/a.max-b.hp/b.max)[0];if(w)return{a:{type:'skill'},tid:w.id};return att()}
   case'cure':{if(rdy){const miss=al.reduce((s,a)=>s+(a.max-a.hp),0),tot=al.reduce((s,a)=>s+a.max,0);if(miss>tot*.35||al.some(a=>a.hp<a.max*.3))return{a:{type:'skill'},tid:-1}}return att()}
   case'p2':{if(u.hp<u.max*.35&&u.st.alt&&u.st.alt.hp>u.hp+40)return{a:{type:'skill'},tid:-1};return att()}}
  return att()}
}
return{Battle,CFG,CHARS,SKILL,statsFor}})();



G.ArenaFiveEngine=BattleEngine;
if(typeof module!=='undefined')module.exports=BattleEngine;
})(globalThis.GOGHOS=globalThis.GOGHOS||{});
