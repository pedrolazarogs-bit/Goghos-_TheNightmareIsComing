// Testes das regras da v0.12.0: seleção inicial, montes por raridade, Daly, eliminação, Daly Mãe, recuperação e encerramento.
// Rodar: node tests/match.test.js  (usa catálogos de teste injetados em G.CHARACTERS quando precisa controlar raridades/cores)
const assert=require('assert');
['data/characters','data/support_cards','data/reset_cards','core/battle','core/deck','core/support','core/roster','core/selection','core/ai'].forEach(f=>require('../js/'+f+'.js'));
const G=globalThis.GOGHOS;let n=0;const t=(m,f)=>{f();n++;console.log('OK  '+m);};
const REAL=G.CHARACTERS;
// ---- ferramentas de teste ----
const seeded=seed=>()=>{seed|=0;seed=seed+0x6D2B79F5|0;let x=Math.imul(seed^seed>>>15,1|seed);x=x+Math.imul(x^x>>>7,61|x)^x;return((x^x>>>14)>>>0)/4294967296;};
const mkC=(id,rarity,x={})=>Object.freeze({id,name:id,class:'FIGHTER',maxHp:300,damage:50,speed:3,art:'x.png',description:'',rarity,stamina:10,mainAbility:null,tribute:null,...x});
const many=(p,r,k,x={})=>Array.from({length:k},(_,i)=>mkC(p+i,r,x));
const BIG=()=>[...many('c','COMMON',8),...many('r','RARE',4),...many('e','EPIC',3),...many('l','LEGENDARY',2),...many('s','SECRET',1)];
const withCatalog=(list,f)=>{const old=G.CHARACTERS;G.CHARACTERS=list;try{return f();}finally{G.CHARACTERS=old;}};
const TP={front:['c0','c1'],rear:[]},TE={front:['c2','c3'],rear:[]};
const mkS=(o={})=>{const s=G.createBattleState(TP,TE,[],o);s.deck.pile.sort((a,b)=>(G.getResetCard(b.id).type==='DALY')-(G.getResetCard(a.id).type==='DALY'));return s;}; // Daly no fundo: nenhum reset muda a equipe sem querer
const live=(s,x)=>s.units.filter(u=>u.team===x&&u.hp>0&&!u.eliminated);
const kill=(s,x)=>s.units.filter(u=>u.team===x&&u.hp>0).forEach(u=>G.eliminateUnit(s,u));
const only=(s,uid)=>{s.units.forEach(u=>{if(u.uid!==uid)s.acted[u.uid]=true;});assert.strictEqual(G.getNextActor(s).uid,uid);return G.getUnit(s,uid);};
const newRound=s=>{s.units.forEach(u=>{s.acted[u.uid]=true;});return G.getNextActor(s);};
const snap=s=>JSON.stringify([s.piles,s.deck.pile.map(c=>c.iid),s.deck.hands,s.deck.discard,s.units.map(u=>[u.uid,u.row,u.hp])]);
const daleCard=(s,side,id='daly_01',iid='t_'+Math.random())=>{const c={iid,id};s.deck.hands[side].push(c);return c;};
const withDalle=(def,f)=>{G.RESET_CARDS.push(def);try{return f();}finally{G.RESET_CARDS.pop();}};

// ================= TESTE A — Seleção inicial =================
t('A: sorteia 5 personagens Comuns distintos (só Comuns, só os reais do catálogo)',()=>{
  const commons=new Set(G.CHARACTERS.filter(c=>c.rarity==='COMMON').map(c=>c.id));assert(commons.size>=5);const seen=new Set();
  for(let i=0;i<200;i++){const r=G.createSelection();assert(r.ok&&r.sel.offered.length===5&&new Set(r.sel.offered).size===5);assert(r.sel.offered.every(id=>commons.has(id)));seen.add(r.sel.offered.join());}
  assert(seen.size>20,'o sorteio varia');});
t('A: ordem das escolhas jogador → bot → jogador → bot; vez errada, repetido e fora das opções são recusados',()=>{
  const sel=G.createSelection({rng:seeded(1)}).sel,[a,b,c,d,e]=sel.offered;
  assert.strictEqual(G.selectionTurn(sel),'player');assert(!G.selectionPick(sel,'enemy',a).ok);assert(!G.selectionPick(sel,'player','sam').ok);assert(!G.selectionBotPick(sel).ok);
  assert(G.selectionPick(sel,'player',a).ok);assert.strictEqual(G.selectionTurn(sel),'enemy');assert(!G.selectionPick(sel,'player',b).ok);
  assert(G.selectionBotPick(sel).ok);const botFirst=sel.picks.enemy[0];assert(botFirst!==a&&sel.offered.includes(botFirst));
  assert.strictEqual(G.selectionAvailable(sel).length,3);assert(!G.selectionPick(sel,'player',a).ok&&!G.selectionPick(sel,'player',botFirst).ok,'quem já foi escolhido não volta');
  const third=G.selectionAvailable(sel)[0];assert(G.selectionPick(sel,'player',third).ok);assert.strictEqual(G.selectionTurn(sel),'enemy');assert.strictEqual(G.selectionAvailable(sel).length,2);
  assert(G.selectionBotPick(sel).ok);assert(G.selectionDone(sel)&&G.selectionTurn(sel)===null);assert(!G.selectionPick(sel,'player',e).ok);assert.strictEqual(G.selectionAvailable(sel).length,1);});
t('A: no fim cada lado tem 2 personagens na frente e a retaguarda vazia; o 5º continua sem dono; a batalha só vem depois das 4 escolhas',()=>{
  const sel=G.createSelection({rng:seeded(2)}).sel;assert.strictEqual(G.selectionTeams(sel),null);
  while(!G.selectionDone(sel)){if(G.selectionTurn(sel)==='player')G.selectionPick(sel,'player',G.selectionAvailable(sel)[0]);else G.selectionBotPick(sel);}
  const tm=G.selectionTeams(sel);assert(tm.player.front.length===2&&tm.enemy.front.length===2&&!tm.player.rear.length&&!tm.enemy.rear.length);
  assert.strictEqual(new Set([...tm.player.front,...tm.enemy.front]).size,4);
  const s=G.createBattleState(tm.player,tm.enemy,[]);
  ['player','enemy'].forEach(x=>{assert.strictEqual(s.units.filter(u=>u.team===x&&u.row==='front').length,2);assert.strictEqual(s.units.filter(u=>u.team===x&&u.row==='rear').length,0);});
  assert(s.units.every(u=>u.hp===u.maxHp)&&s.round===1&&s.order.length===4&&s.result===null&&s.phase==='battle');
  assert.strictEqual(s.deck.hands.player.length+s.deck.hands.enemy.length,0,'a seleção não distribui cartas do monte principal');});
t('A: com exatamente 4 Comuns a seleção segue; com menos de 4 recusa com mensagem; nunca completa com outras raridades',()=>{
  withCatalog([...many('c','COMMON',4),...many('r','RARE',9),...many('e','EPIC',3)],()=>{const r=G.createSelection({rng:seeded(3)});assert(r.ok);assert.strictEqual(r.sel.offered.length,4);
    assert(r.sel.offered.every(id=>id.startsWith('c')));const sel=r.sel;while(!G.selectionDone(sel)){if(G.selectionTurn(sel)==='player')G.selectionPick(sel,'player',G.selectionAvailable(sel)[0]);else assert(G.selectionBotPick(sel).ok);}
    assert.strictEqual(G.selectionAvailable(sel).length,0);});
  withCatalog([...many('c','COMMON',3),...many('r','RARE',9)],()=>{const r=G.createSelection();assert(!r.ok&&/Comuns suficientes/.test(r.error));});});
t('A: os 4 escolhidos saem do monte Comum; o personagem não escolhido continua disponível nele',()=>{
  const sel=G.createSelection({rng:seeded(4)}).sel;while(!G.selectionDone(sel)){if(G.selectionTurn(sel)==='player')G.selectionPick(sel,'player',G.selectionAvailable(sel)[0]);else G.selectionBotPick(sel);}
  const tm=G.selectionTeams(sel),s=G.createBattleState(tm.player,tm.enemy,[]),left=G.selectionAvailable(sel)[0],total=G.CHARACTERS.filter(c=>c.rarity==='COMMON').length;
  assert.strictEqual(s.piles.COMMON.length,total-4);assert(s.piles.COMMON.some(i=>i.id===left));[...tm.player.front,...tm.enemy.front].forEach(id=>assert(!s.piles.COMMON.some(i=>i.id===id)));});

// ================= TESTE B — Montes =================
t('B: cinco montes separados por raridade, só com personagens da raridade real; independentes entre si e do monte principal',()=>{
  const s=G.createBattleState({front:['sam','char_02'],rear:[]},{front:['char_03','char_04'],rear:[]},[]);
  assert.deepStrictEqual(Object.keys(s.piles),['COMMON','RARE','EPIC','LEGENDARY','SECRET']);
  G.RARITIES.forEach(r=>s.piles[r].forEach(i=>assert.strictEqual(G.getCharacterById(i.id).rarity,r)));
  const all=G.RARITIES.flatMap(r=>s.piles[r]);assert.strictEqual(new Set(all.map(i=>i.iid)).size,all.length);
  assert(s.piles.COMMON!==s.piles.RARE&&s.piles!==s.deck.pile);assert.deepStrictEqual(G.pileCounts(s),Object.fromEntries(G.RARITIES.map(r=>[r,s.piles[r].length])));});
t('B: o monte principal só tem Apoio, Habilidade Especial, Item e Daly — nenhum personagem, nenhum Fragmento',()=>{
  const s=G.createBattleState({front:['sam','char_02'],rear:[]},{front:['char_03','char_04'],rear:[]},[]);
  const types=new Set(s.deck.pile.map(c=>G.getResetCard(c.id).type));assert.deepStrictEqual(types,new Set(['SUPPORT','SPECIAL','ITEM','DALY']));
  assert(!s.deck.pile.some(c=>G.getCharacterById(c.id)),'nenhum personagem no monte principal');assert.deepStrictEqual(G.CONFIG.mainDeckTypes,['SUPPORT','SPECIAL','ITEM','DALY']);});
t('B: retirar uma carta atualiza a disponibilidade; cópias legítimas têm iid próprio e não se confundem',()=>{
  withCatalog([...many('c','COMMON',6),mkC('r0','RARE',{copies:2}),mkC('r1','RARE')],()=>{const s=G.createBattleState({front:['c0','c1'],rear:[]},{front:['c2','c3'],rear:[]},[]);
    assert.strictEqual(s.piles.RARE.length,3);const cp=s.piles.RARE.filter(i=>i.id==='r0');assert(cp.length===2&&cp[0].iid!==cp[1].iid);
    const got=G.claimCharacter(s,'r0');assert.strictEqual(s.piles.RARE.length,2);assert(!s.piles.RARE.some(i=>i.iid===got.iid)&&s.piles.RARE.some(i=>i.id==='r0'));
    assert.strictEqual(s.piles.COMMON.length,2);});});
t('B: personagem eliminado não volta ao monte durante a partida; nova partida recompõe os montes sem tocar no catálogo',()=>{
  withCatalog(BIG(),()=>{const s=mkS(),victim=G.getUnit(s,'enemy_0'),before=G.pileCounts(s);G.eliminateUnit(s,victim);
    assert.deepStrictEqual(G.pileCounts(s),before);G.RARITIES.forEach(r=>assert(!s.piles[r].some(i=>i.iid===victim.iid||i.id===victim.id)));
    const s2=mkS();assert(s2.piles!==s.piles&&s2.piles.COMMON.length===4&&s2.eliminated.length===0);assert.strictEqual(G.CHARACTERS.length,BIG().length);});
  assert.strictEqual(G.CHARACTERS,REAL);assert.strictEqual(REAL.length,12);});

// ================= TESTE C — Compras por reset =================
t('C: cada reset real gera 1 compra para cada participante, uma única vez; chamadas repetidas não compram de novo',()=>{
  withCatalog(BIG(),()=>{const s=mkS(),pile=s.deck.pile.length;for(let i=0;i<4;i++){const a=G.getNextActor(s);assert.strictEqual(s.round,1);assert(G.performBasicAttack(s,a.uid,G.AI.chooseTarget(s,a).uid).ok);}
    assert.strictEqual(s.deck.hands.player.length+s.deck.hands.enemy.length,0);
    const a=G.getNextActor(s);assert(a&&s.round===2);assert.strictEqual(s.deck.hands.player.length,1);assert.strictEqual(s.deck.hands.enemy.length,1);assert.strictEqual(s.deck.pile.length,pile-2);
    const q=[...s.order];G.onSpeedReset(s);G.onSpeedReset(s);G.getNextActor(s);G.getNextActor(s);assert.strictEqual(s.deck.pile.length,pile-2,'mesmo reset não compra duas vezes');assert.deepStrictEqual(s.order,q,'a fila não é reiniciada pela compra');
    assert.strictEqual(Object.keys(s.acted).filter(k=>s.acted[k]).length,0,'a compra não gasta nem concede ações');});});
t('C: só o reset da hierarquia compra — mudar velocidade, resolver Daly ou recuperar não compra',()=>{
  withCatalog(BIG(),()=>{const s=mkS(),pile=s.deck.pile.length;s.units.forEach(u=>{u.speed+=1;});G.buildTurnOrder(s);G.getNextActor(s);assert.strictEqual(s.deck.pile.length,pile);
    daleCard(s,'player','daly_01','dx');G.resolveDalle(s,'player',{iid:'dx',id:'daly_01'});assert.strictEqual(s.deck.pile.length,pile,'resolver Daly não compra do monte principal');});});
t('C: Daly comprada é resolvida na hora e não provoca outra compra (2 compras por reset, mesmo se as duas forem Daly)',()=>{
  withCatalog(BIG(),()=>{const s=G.createBattleState(TP,TE,[]),dl=s.deck.pile.filter(c=>c.id.startsWith('daly'));s.deck.pile=s.deck.pile.filter(c=>!c.id.startsWith('daly')).concat(dl.slice(0,2)); // as 2 do topo são Daly
    const pile=s.deck.pile.length;s.units.forEach(u=>{s.acted[u.uid]=true;});G.getNextActor(s);
    assert.strictEqual(s.deck.pile.length,pile-2);assert.strictEqual(s.deck.discard.length,2);assert.strictEqual(s.deck.hands.player.length+s.deck.hands.enemy.length,0);
    assert.strictEqual(live(s,'player').length,3);assert.strictEqual(live(s,'enemy').length,3);assert(s.deck.last.dalles.length===2&&s.deck.last.dalles.every(d=>d.obtained));});});
t('C: monte vazio não gera carta fictícia; a batalha segue',()=>{withCatalog(BIG(),()=>{const s=mkS();s.deck.pile.length=0;s.units.forEach(u=>{s.acted[u.uid]=true;});assert(G.getNextActor(s));
  assert.strictEqual(s.deck.hands.player.length+s.deck.hands.enemy.length,0);assert(s.log.some(l=>l.includes('monte vazio')));});});

// ================= TESTE D — Daly (obter personagens) =================
t('D: pesos de raridade centralizados somam 100 e seguem Comum > Raro > Épico > Lendário > Secreto',()=>{
  const w=G.CONFIG.dalleRarityWeights;assert.deepStrictEqual(w,{COMMON:60,RARE:25,EPIC:10,LEGENDARY:4,SECRET:1});assert.strictEqual(Object.values(w).reduce((a,b)=>a+b,0),100);
  const v=G.RARITIES.map(r=>w[r]);assert.deepStrictEqual(v,[...v].sort((a,b)=>b-a));});
t('D: o sorteio respeita os pesos (60/25/10/4/1) e não depende de quantos personagens há em cada monte',()=>{
  const rng=seeded(7),cnt={};for(let i=0;i<40000;i++){const r=G.pickDalleRarity(G.CONFIG.dalleRarityWeights,G.RARITIES,rng);cnt[r]=(cnt[r]||0)+1;}
  Object.entries(G.CONFIG.dalleRarityWeights).forEach(([r,p])=>assert(Math.abs(cnt[r]/400-p)<1.2,r+' '+cnt[r]/400));
  // fluxo real, com 1 Comum e 20 Secretos disponíveis: a frequência continua sendo a dos pesos
  const cat=[...many('c','COMMON',5),...many('r','RARE',1),...many('e','EPIC',1),...many('l','LEGENDARY',10),...many('s','SECRET',20)];
  withCatalog(cat,()=>{const r2=seeded(11),c2={};for(let i=0;i<4000;i++){const s=G.createBattleState(TP,TE,[],{rng:r2}),d=daleCard(s,'player'),x=G.resolveDalle(s,'player',d);assert(x.ok&&x.obtained);c2[x.rarity]=(c2[x.rarity]||0)+1;}
    assert(Math.abs(c2.COMMON/40-60)<3&&Math.abs(c2.RARE/40-25)<3&&Math.abs(c2.EPIC/40-10)<2&&(c2.SECRET||0)/40<2.5);});});
t('D: raridade sem personagem elegível sai do sorteio e os pesos são recalculados; sem nenhuma, não trava',()=>{
  const rng=seeded(5);assert.strictEqual(G.pickDalleRarity(G.CONFIG.dalleRarityWeights,[],rng),null);assert.strictEqual(G.pickDalleRarity(G.CONFIG.dalleRarityWeights,['SECRET'],rng),'SECRET');
  const c={};for(let i=0;i<20000;i++){const r=G.pickDalleRarity(G.CONFIG.dalleRarityWeights,['RARE','EPIC'],rng);c[r]=(c[r]||0)+1;}
  assert(!c.COMMON&&!c.SECRET);assert(Math.abs(c.RARE/200-25/35*100)<2,'25:10 proporcional');});
t('D: a cor da Daly define quem é elegível (Azul só Azul, Verde só Verde, sem cor = qualquer disponível); personagem sem cor não entra numa Daly colorida',()=>{
  const cat=[...many('c','COMMON',4),mkC('az1','COMMON',{color:'AZUL'}),mkC('az2','RARE',{color:'AZUL'}),mkC('vd1','COMMON',{color:'VERDE'}),mkC('vd2','EPIC',{color:'VERDE'}),mkC('nc','COMMON')];
  withCatalog(cat,()=>{const defs={AZUL:{id:'daly_az',type:'DALY',name:'Daly Azul',copies:1,color:'AZUL'},VERDE:{id:'daly_vd',type:'DALY',name:'Daly Verde',copies:1,color:'VERDE'}},seen={};
    for(const col of ['AZUL','VERDE'])withDalle(defs[col],()=>{for(let i=0;i<150;i++){const s=G.createBattleState(TP,TE,[],{rng:seeded(i+(col==='AZUL'?0:999))});const d=daleCard(s,'player',defs[col].id),x=G.resolveDalle(s,'player',d);
      assert(x.ok&&x.obtained);const ch=G.getCharacterById(G.getUnit(s,x.obtained).id);assert.strictEqual(ch.color,col);seen[ch.id]=1;}});
    assert(seen.az1&&seen.az2&&seen.vd1&&seen.vd2&&!seen.nc);
    const anyDef={id:'daly_any',type:'DALY',name:'Daly',copies:1};withDalle(anyDef,()=>{const got=new Set();for(let i=0;i<200;i++){const s=G.createBattleState(TP,TE,[],{rng:seeded(i)});const x=G.resolveDalle(s,'player',daleCard(s,'player','daly_any'));got.add(G.getUnit(s,x.obtained).id);}assert(got.has('nc')&&got.has('az1'));});});});
t('D: sem personagem elegível → nada é inventado, o estado fica igual e a Daly continua na mão; raridade sem elegível é ignorada',()=>{
  const cat=[...many('c','COMMON',4),mkC('az1','COMMON',{color:'AZUL'}),mkC('az2','COMMON',{color:'AZUL'}),mkC('vd1','RARE',{color:'VERDE'}),mkC('vd2','SECRET',{color:'VERDE'})];
  withCatalog(cat,()=>{withDalle({id:'daly_roxo',type:'DALY',name:'Daly Roxo',copies:1,color:'ROXO'},()=>{const s=mkS(),d=daleCard(s,'player','daly_roxo','dr'),b=snap(s);
      const r=G.resolveDalle(s,'player',d);assert(r.ok&&r.obtained===null&&r.reason==='none');assert.strictEqual(snap(s),b);assert(s.log.some(l=>l.includes('nenhum personagem elegível')));});
    withDalle({id:'daly_az',type:'DALY',name:'Daly Azul',copies:1,color:'AZUL'},()=>{for(let i=0;i<100;i++){const s=G.createBattleState(TP,TE,[],{rng:seeded(i)}),x=G.resolveDalle(s,'player',daleCard(s,'player','daly_az'));assert.strictEqual(x.rarity,'COMMON');}});});});
t('D: o personagem sai do monte de origem, entra na equipe certa (retaguarda se a frente tem vivo; frente se a equipe acabou) e não age nem muda a ordem na rodada',()=>{
  withCatalog(BIG(),()=>{const s=mkS(),order=[...s.order],counts=G.pileCounts(s),d=daleCard(s,'player'),r=G.resolveDalle(s,'player',d);assert(r.ok&&r.obtained);
    const u=G.getUnit(s,r.obtained);assert.strictEqual(u.row,'rear');assert.strictEqual(u.team,'player');assert.strictEqual(G.pileCounts(s)[r.rarity],counts[r.rarity]-1);assert(!s.piles[r.rarity].some(i=>i.iid===u.iid));
    assert.deepStrictEqual(s.order,order);assert(!s.acted[u.uid]);assert(!s.deck.hands.player.some(c=>c.iid===d.iid)&&s.deck.discard.some(c=>c.iid===d.iid));
    assert(!G.resolveDalle(s,'player',d).ok,'não resolve a mesma Daly duas vezes');assert(!s.eliminated.length,'Daly não vai para os eliminados');
    kill(s,'enemy');assert(G.isDalyExposed(s,'enemy'));const r2=G.resolveDalle(s,'enemy',daleCard(s,'enemy'));assert.strictEqual(G.getUnit(s,r2.obtained).row,'front');assert(!G.isDalyExposed(s,'enemy'));});});

// ================= TESTE E — Eliminação e posicionamento =================
const withRear=()=>G.createBattleState({front:['c0','c1'],rear:['c4','c5']},{front:['c2','c3'],rear:['c6']},[]);
t('E: personagem eliminado deixa a equipe e a fila, aparece em Personagens Eliminados com o dono e nunca age, é alvo ou volta ao monte',()=>{
  withCatalog(BIG(),()=>{const s=withRear(),v=G.getUnit(s,'enemy_0');v.hp=0;assert(G.eliminateUnit(s,v));
    assert(v.eliminated&&v.row===null&&!s.order.includes(v.uid));assert(!G.getBoard(s).enemy.front.includes(v)&&!G.getBoard(s).enemy.rear.includes(v));
    const e=s.eliminated.find(x=>x.uid===v.uid);assert(e&&e.team==='enemy'&&e.iid===v.iid&&e.id==='c2');assert.deepStrictEqual(G.getEliminated(s,'player'),[]);
    assert(!G.eliminateUnit(s,v)&&s.eliminated.length===1,'idempotente');
    assert(!G.performBasicAttack(s,v.uid,'player_0').ok);const a=only(s,'player_0');assert(!G.performBasicAttack(s,a.uid,v.uid).ok);
    G.buildTurnOrder(s);assert(!s.order.includes(v.uid));assert(!G.RARITIES.some(r=>s.piles[r].some(i=>i.iid===v.iid)));assert(!s.deck.discard.some(c=>c.id===v.id));});});
t('E: a frente é promovida na hora (só 1, sem turno extra) enquanto houver vivo na retaguarda — a Daly Mãe continua protegida',()=>{
  withCatalog(BIG(),()=>{const s=withRear(),f=s.units.filter(u=>u.team==='player'&&u.row==='front');f.forEach(u=>G.eliminateUnit(s,u));
    const now=s.units.filter(u=>u.team==='player'&&u.row==='front'&&u.hp>0);assert.strictEqual(now.length,1);assert.strictEqual(now[0].id,'c4');assert(!s.order.includes(now[0].uid));
    assert(s.daly.player.exposed===false&&!G.isDalyExposed(s,'player')&&s.daly.player.hp===3);G.eliminateUnit(s,now[0]);assert.strictEqual(live(s,'player').filter(u=>u.row==='front').length,1);
    G.eliminateUnit(s,live(s,'player')[0]);assert.strictEqual(live(s,'player').length,0);assert(G.isDalyExposed(s,'player')&&s.daly.player.exposed);});});
t('E: eliminação via ataque encerra a linha sem travar e o registro guarda quem foi eliminado e quando',()=>{
  withCatalog(BIG(),()=>{const s=mkS(),a=G.getNextActor(s),tg=G.AI.chooseTarget(s,a);tg.hp=1;assert(G.performBasicAttack(s,a.uid,tg.uid).ok);
    assert(tg.eliminated&&s.eliminated[0].round===1&&s.log.some(l=>l.includes('foi eliminado')));assert.strictEqual(s.result,null,'eliminar personagens não encerra a partida');});});

// ================= TESTE F — Daly Mãe =================
t('F: cada lado tem a sua Daly Mãe, independente, com 3 vidas; não é personagem nem está nos montes',()=>{
  withCatalog(BIG(),()=>{const s=mkS();assert.deepStrictEqual([s.daly.player.hp,s.daly.enemy.hp,s.daly.player.max],[3,3,3]);assert(s.daly.player!==s.daly.enemy);
    assert(!s.units.some(u=>String(u.id).includes('daly'))&&!G.RARITIES.some(r=>s.piles[r].some(i=>String(i.id).includes('daly'))));});});
t('F: protegida enquanto houver QUALQUER vivo (frente ou retaguarda); só fica exposta com a equipe inteira eliminada; ataque a protegida é recusado',()=>{
  withCatalog(BIG(),()=>{const s=withRear(),a=only(s,'player_0');assert(!G.isDalyExposed(s,'enemy'));assert(!G.performBasicAttack(s,a.uid,G.dalyTargetId('enemy')).ok);assert.strictEqual(s.daly.enemy.hp,3);
    s.units.filter(u=>u.team==='enemy'&&u.row==='front').forEach(u=>G.eliminateUnit(s,u));assert(!G.isDalyExposed(s,'enemy'),'sobrou um na retaguarda → promovido');
    kill(s,'enemy');assert(G.isDalyExposed(s,'enemy')&&G.isDalyExposed(s,'enemy'));assert(!G.isDalyExposed(s,'player'));});});
t('F: cada ataque válido tira exatamente 1 vida (mesmo com dano alto, Mago com mana ou apoio); repetição não tira outra; recuperação só abre se ainda houver vida',()=>{
  withCatalog([...BIG(),mkC('big','COMMON',{damage:9999,speed:9})],()=>{const s=G.createBattleState({front:['big','c1'],rear:[]},TE,['na_moloeira'],{rng:seeded(1)});kill(s,'enemy');
    const a=only(s,'player_0');assert(G.performSupport(s,0).ok);const r=G.performBasicAttack(s,a.uid,G.dalyTargetId('enemy'),0);assert(r.ok&&r.daly==='enemy');
    assert.strictEqual(s.daly.enemy.hp,2);assert.strictEqual(s.support.nextAttackBonus,20,'bônus de apoio não é gasto contra a Daly Mãe');
    assert(!G.performBasicAttack(s,a.uid,G.dalyTargetId('enemy')).ok);assert.strictEqual(s.daly.enemy.hp,2,'o mesmo ataque não conta duas vezes');
    assert(s.recovery&&s.recovery.side==='enemy'&&s.phase==='recovery'&&s.result===null);});
  withCatalog([...BIG(),mkC('mg','COMMON',{class:'MAGO',damage:500,speed:9})],()=>{const s=G.createBattleState({front:['mg','c1'],rear:[]},TE,[],{rng:seeded(1)});kill(s,'enemy');
    const a=only(s,'player_0');assert(a.mana===2);assert(G.performBasicAttack(s,a.uid,G.dalyTargetId('enemy'),2).ok);assert.strictEqual(s.daly.enemy.hp,2);assert.strictEqual(a.mana,2,'mana não é gasta e não aumenta o dano');});});
t('F: a Daly Mãe própria não é alvo; alvo inexistente é recusado',()=>{withCatalog(BIG(),()=>{const s=mkS();kill(s,'player');const a=only(s,'enemy_0');
  assert(!G.performBasicAttack(s,a.uid,G.dalyTargetId('enemy')).ok);assert(!G.performBasicAttack(s,a.uid,'daly_xyz').ok);assert(G.performBasicAttack(s,a.uid,G.dalyTargetId('player')).ok);});});
t('F: IA ataca a Daly Mãe exposta pelo ataque normal, sem ação especial',()=>{withCatalog(BIG(),()=>{const s=mkS();kill(s,'player');const a=G.getNextActor(s);assert.strictEqual(a.team,'enemy');
  assert.strictEqual(G.AI.chooseTarget(s,a),null);assert(G.AI.takeTurn(s,a).ok);assert.strictEqual(s.daly.player.hp,2);});});

// ================= TESTE G — Recuperação =================
t('G: três opções exclusivas: A=3 Comuns, B=2 Raros, C=1 Épico (não existe 3 Épicos nem mistura)',()=>{
  const o=G.CONFIG.recoveryOptions;assert.deepStrictEqual(o,[{id:'A',rarity:'COMMON',count:3},{id:'B',rarity:'RARE',count:2},{id:'C',rarity:'EPIC',count:1}]);
  assert(!o.some(x=>x.rarity==='EPIC'&&x.count>1)&&!o.some(x=>x.rarity==='LEGENDARY'||x.rarity==='SECRET'));});
const hitDaly=(s,uid='player_0')=>{const a=only(s,uid);const r=G.performBasicAttack(s,a.uid,G.dalyTargetId('enemy'));assert(r.ok);return r;};
const setup=()=>{const s=mkS({rng:seeded(21)});kill(s,'enemy');hitDaly(s);return s;};
t('G: cada opção entrega exatamente a quantidade e a raridade certas, retiradas do monte de origem',()=>{
  withCatalog(BIG(),()=>{[['A','COMMON',3],['B','RARE',2],['C','EPIC',1]].forEach(([id,rar,k])=>{const s=setup(),before=G.pileCounts(s);assert(s.recovery.options.every(x=>x.available));
    const r=G.performRecovery(s,id);assert(r.ok&&r.units.length===k);assert(r.units.every(u=>G.getUnit(s,u).rarity===rar&&G.getUnit(s,u).team==='enemy'));
    G.RARITIES.forEach(x=>assert.strictEqual(G.pileCounts(s)[x],before[x]-(x===rar?k:0)));assert.strictEqual(new Set(r.units.map(u=>G.getUnit(s,u).iid)).size,k);});});});
t('G: opção inválida/mistura é recusada; recuperação não repete; ações ficam bloqueadas e nada reseta enquanto ela está pendente',()=>{
  withCatalog(BIG(),()=>{const s=setup(),b=snap(s);['D','A+C','','a'].forEach(x=>assert(!G.performRecovery(s,x).ok));assert.strictEqual(snap(s),b);
    assert.strictEqual(G.getNextActor(s),null);const pile=s.deck.pile.length;for(let i=0;i<5;i++)G.getNextActor(s);assert.strictEqual(s.deck.pile.length,pile,'sem reset/compra com recuperação pendente');
    const act=live(s,'player')[0];assert(!G.performBasicAttack(s,act.uid,G.dalyTargetId('enemy')).ok);assert(!G.performSwap(s,'player_0','player_1').ok);
    assert(G.performRecovery(s,'A').ok);assert(!G.performRecovery(s,'A').ok,'não processa duas vezes');assert.strictEqual(s.recovery,null);assert.strictEqual(s.phase,'battle');});});
t('G: conjunto incompleto não é entregue: opção indisponível aparece marcada, é recusada e não altera nenhum monte (sem parcial, sem substituir raridade)',()=>{
  withCatalog([...many('c','COMMON',6),...many('r','RARE',1),...many('e','EPIC',2)],()=>{const s=setup();const o=Object.fromEntries(s.recovery.options.map(x=>[x.id,x]));
    assert(!o.A.available&&o.A.have===2&&!o.B.available&&o.B.have===1&&o.C.available);const b=snap(s);
    assert(!G.performRecovery(s,'A').ok&&!G.performRecovery(s,'B').ok);assert.strictEqual(snap(s),b);assert(s.recovery.status==='open');assert(G.performRecovery(s,'C').ok);});});
t('G: sem nenhuma opção possível o jogo segue estável, a Daly Mãe fica com as vidas e continua exposta',()=>{
  withCatalog(many('c','COMMON',4),()=>{const s=mkS({rng:seeded(2)});kill(s,'enemy');hitDaly(s);assert.strictEqual(s.recovery,null);assert.strictEqual(s.phase,'battle');assert.strictEqual(s.daly.enemy.hp,2);
    assert(s.log.some(l=>l.includes('nenhuma recuperação')));assert(G.isDalyExposed(s,'enemy'));assert(newRound(s));const a=G.getNextActor(s);assert(a&&G.AI.takeTurn(s,a).ok);assert.strictEqual(s.daly.enemy.hp,1);});});
t('G: posicionamento — equipe sem vivos: 1º na frente, os demais na retaguarda; com vivo na frente: todos na retaguarda; eliminados continuam eliminados; sem ataque, turno ou compra extra; vidas da Daly Mãe não voltam',()=>{
  withCatalog(BIG(),()=>{const s=setup(),elim=s.eliminated.length,order=[...s.order],pile=s.deck.pile.length,acted=Object.keys(s.acted).filter(k=>s.acted[k]).length;
    const r=G.performRecovery(s,'A'),us=r.units.map(u=>G.getUnit(s,u));assert.deepStrictEqual(us.map(u=>u.row),['front','rear','rear']);assert(!G.isDalyExposed(s,'enemy')&&!s.daly.enemy.exposed);
    assert.strictEqual(s.daly.enemy.hp,2);assert.strictEqual(s.eliminated.length,elim);assert(us.every(u=>!s.eliminated.some(e=>e.iid===u.iid)));
    assert.deepStrictEqual(s.order,order);assert(us.every(u=>!s.order.includes(u.uid)));assert.strictEqual(s.deck.pile.length,pile);assert.strictEqual(Object.keys(s.acted).filter(k=>s.acted[k]).length,acted);
    const s2=mkS({rng:seeded(5)});s2.units.filter(u=>u.team==='enemy'&&u.row==='front'&&u.id==='c2').forEach(u=>G.eliminateUnit(s2,u));
    s2.daly.enemy.hp=2;G.openRecovery(s2,'enemy');assert(s2.recovery);const r2=G.performRecovery(s2,'B');assert(r2.units.every(u=>G.getUnit(s2,u).row==='rear'));assert.strictEqual(live(s2,'enemy').filter(u=>u.row==='front').length,1);});});
t('G: o bot escolhe sozinho uma opção que pode ser completada',()=>{withCatalog(BIG(),()=>{for(let i=0;i<30;i++){const s=mkS({rng:seeded(i)});kill(s,'enemy');hitDaly(s);const r=G.AI.resolveRecovery(s);assert(r.ok&&['A','B','C'].includes(r.option)&&s.recovery===null);}});
  withCatalog([...many('c','COMMON',6),...many('e','EPIC',1)],()=>{const s=mkS({rng:seeded(1)});kill(s,'enemy');hitDaly(s);assert.strictEqual(G.AI.resolveRecovery(s).option,'C');});});

// ================= TESTE H — Vitória e encerramento =================
t('H: 3 ataques válidos levam a Daly Mãe de 3 a 0 (com recuperação entre eles); no 3º a partida acaba na hora, sem recuperação',()=>{
  withCatalog(BIG(),()=>{const s=mkS({rng:seeded(9)});kill(s,'enemy');const hp=[];
    for(let i=0;i<3;i++){if(i)newRound(s);const a=G.getNextActor(s);assert.strictEqual(a.team,'player');const r=G.performBasicAttack(s,a.uid,G.dalyTargetId('enemy'));assert(r.ok);hp.push(s.daly.enemy.hp);
      if(i<2){assert(s.recovery&&!s.result);G.AI.resolveRecovery(s);kill(s,'enemy');assert(G.isDalyExposed(s,'enemy'));}}
    assert.deepStrictEqual(hp,[2,1,0]);assert.strictEqual(s.result,'victory');assert.strictEqual(s.phase,'ended');assert.strictEqual(s.recovery,null);
    assert.deepStrictEqual([s.final.winner,s.final.loser,s.final.dalyDefeated,s.final.daly.enemy,s.final.daly.player],['player','enemy','enemy',0,3]);});});
t('H: vence quem tem a Daly Mãe viva, mesmo com 1 personagem; derrota quando a sua chega a 0',()=>{
  withCatalog(BIG(),()=>{const s=mkS();s.units.filter(u=>u.team==='player'&&u.id==='c1').forEach(u=>G.eliminateUnit(s,u));kill(s,'enemy');s.daly.enemy.hp=1;assert.strictEqual(live(s,'player').length,1);
    hitDaly(s);assert.strictEqual(s.result,'victory');assert.strictEqual(s.final.winner,'player');
    const d=mkS();kill(d,'player');d.daly.player.hp=1;const a=G.getNextActor(d);assert.strictEqual(a.team,'enemy');G.performBasicAttack(d,a.uid,G.dalyTargetId('player'));
    assert.strictEqual(d.result,'defeat');assert.deepStrictEqual([d.final.winner,d.final.loser],['enemy','player']);assert.strictEqual(d.recovery,null);});});
t('H: depois do encerramento nada muda: sem ações, compras, Daly, recuperação, apoio, troca ou ataque à Daly Mãe; eventos duplicados são ignorados',()=>{
  withCatalog(BIG(),()=>{const s=mkS();kill(s,'enemy');s.daly.enemy.hp=1;hitDaly(s);assert.strictEqual(s.result,'victory');const b=snap(s),res=s.final;
    assert.strictEqual(G.getNextActor(s),null);assert.strictEqual(s.order.length,0);assert.strictEqual(G.onSpeedReset(s),null);G.onSpeedReset(s);
    const u=live(s,'player')[0];assert(!G.performBasicAttack(s,u.uid,G.dalyTargetId('enemy')).ok);assert(!G.performBasicAttack(s,u.uid,G.dalyTargetId('player')).ok);
    assert(!G.resolveDalle(s,'player',daleCard(s,'player','daly_01','late')).ok);assert.strictEqual(G.openRecovery(s,'enemy'),null);assert(!G.performRecovery(s,'A').ok);
    assert(!G.performSwap(s,'player_0','player_1').ok);assert(!G.performSupport(s,0).ok);assert(!G.AI.takeTurn(s,u).ok);
    G.finishMatch(s,'player');G.checkBattleResult(s);assert.strictEqual(s.result,'victory');assert.strictEqual(s.final,res);
    assert.strictEqual(JSON.stringify(s.piles),JSON.stringify(JSON.parse(b)[0]));assert.deepStrictEqual(s.daly,{player:{hp:3,max:3,exposed:false},enemy:{hp:0,max:3,exposed:false}});});});
t('H: partida nova não herda nada da anterior (montes, mãos, eliminados, Daly Mães, recuperação, resultado, fila); o catálogo fica intacto',()=>{
  const s1=G.createBattleState({front:['sam','char_02'],rear:[]},{front:['char_03','char_04'],rear:[]},G.defaultSupportLoadout());
  let g=0;while(!s1.result&&g++<2000){if(s1.recovery){G.AI.resolveRecovery(s1);continue;}G.AI.takeTurn(s1,G.getNextActor(s1));}assert(s1.result&&s1.eliminated.length&&s1.deck.hands.player.length+s1.deck.discard.length);
  const s2=G.createBattleState({front:['sam','char_02'],rear:[]},{front:['char_03','char_04'],rear:[]},G.defaultSupportLoadout());
  assert(s2.piles!==s1.piles&&s2.daly!==s1.daly&&s2.deck!==s1.deck&&s2.eliminated!==s1.eliminated&&s2.units!==s1.units);
  assert.deepStrictEqual([s2.daly.player.hp,s2.daly.enemy.hp,s2.eliminated.length,s2.recovery,s2.result,s2.final,s2.round,s2.phase],[3,3,0,null,null,null,1,'battle']);
  assert(s2.deck.hands.player.length===0&&s2.deck.discard.length===0&&s2.deck.resets.size===0&&s2.deck.pile.length===s2.deck.total);
  assert.strictEqual(G.CHARACTERS,REAL);assert.strictEqual(REAL.length,12);assert(REAL.every(c=>Object.isFrozen(c)));
  assert.strictEqual(G.pileCounts(s2).COMMON,G.CHARACTERS.filter(c=>c.rarity==='COMMON').length-3,'sam é Lendário; 3 Comuns iniciais saem do monte');});
t('H: resetBattle recomeça com as mesmas equipes iniciais e tudo limpo',()=>{withCatalog(BIG(),()=>{const s=mkS({rng:seeded(3)});kill(s,'enemy');hitDaly(s);G.AI.resolveRecovery(s);const r=G.resetBattle(s);
  assert(r.recovery===null&&r.eliminated.length===0&&r.daly.enemy.hp===3&&live(r,'enemy').length===2&&r.piles.COMMON.length===4);});});

// ================= TESTE I — Regressão e integridade (300 partidas completas de IA contra IA) =================
t('I: 300 partidas completas mantêm todas as invariantes (vida da Daly Mãe, frente nunca vazia, conservação de cartas, 1 vida por ataque, sem ação de eliminado)',()=>{
  const wins={victory:0,defeat:0};
  for(let k=0;k<300;k++){
    const sel=G.createSelection({rng:seeded(1000+k)}).sel;while(!G.selectionDone(sel)){if(G.selectionTurn(sel)==='player')G.selectionPick(sel,'player',G.selectionAvailable(sel)[Math.floor(k/7)%G.selectionAvailable(sel).length]);else G.selectionBotPick(sel);}
    const tm=G.selectionTeams(sel),s=G.createBattleState(tm.player,tm.enemy,G.defaultSupportLoadout(),{rng:seeded(5000+k)});let g=0;const pool=12;
    while(!s.result&&g++<3000){
      if(s.recovery){assert(G.AI.resolveRecovery(s).ok);}else{
        const a=G.getNextActor(s);assert(a&&a.hp>0&&a.row==='front'&&!a.eliminated,'ator inválido');
        const hp0={player:s.daly.player.hp,enemy:s.daly.enemy.hp},r=G.AI.takeTurn(s,a);assert(r.ok,r.error);
        ['player','enemy'].forEach(x=>assert(hp0[x]-s.daly[x].hp<=1,'mais de 1 vida por ataque'));}
      ['player','enemy'].forEach(x=>{const l=live(s,x);if(l.length)assert(l.some(u=>u.row==='front'),'frente vazia com vivos');
        assert.strictEqual(s.daly[x].exposed,!s.result&&s.daly[x].hp>0&&l.length===0,'exposição incoerente');assert(s.daly[x].hp>=0&&s.daly[x].hp<=3);});
      s.units.forEach(u=>{assert(!(u.eliminated&&u.hp>0));if(u.eliminated)assert(!s.order.includes(u.uid)&&u.row===null);});
    }
    assert(s.result,'travou');assert(g<3000);wins[s.result]++;
    const loser=s.final.loser,winner=s.final.winner;assert(s.daly[loser].hp===0&&s.daly[winner].hp>0);
    const ids=[...G.RARITIES.flatMap(r=>s.piles[r]),...s.units].map(x=>x.iid);assert.strictEqual(new Set(ids).size,ids.length,'carta duplicada');assert.strictEqual(ids.length,pool,'carta perdida ou inventada');
    assert.strictEqual(new Set(s.eliminated.map(e=>e.iid)).size,s.eliminated.length);
    const dh=[...s.deck.pile,...s.deck.hands.player,...s.deck.hands.enemy,...s.deck.discard];assert.strictEqual(dh.length,s.deck.total);assert.strictEqual(new Set(dh.map(c=>c.iid)).size,s.deck.total);
  }
  assert(wins.victory>50&&wins.defeat>50,JSON.stringify(wins));});
t('I: a IA continua escolhendo alvo válido (menor Vida na frente) e o ataque comum segue causando o Dano do atacante',()=>{
  withCatalog(BIG(),()=>{const s=mkS(),a=G.getNextActor(s),tg=G.AI.chooseTarget(s,a),b=tg.hp;assert(tg.row==='front'&&tg.team!==a.team);G.performBasicAttack(s,a.uid,tg.uid);assert.strictEqual(tg.hp,b-a.damage);});});
console.log(n+' testes de regras da v0.12.0 passaram');
