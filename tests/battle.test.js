const assert=require('assert');
['data/characters','data/support_cards','data/reset_cards','core/battle','core/deck','core/support','core/roster','core/selection','core/ai','ui/card','ui/support_ui','ui/hand_ui','ui/match_ui'].forEach(f=>require('../js/'+f+'.js'));
const G=globalThis.GOGHOS;let n=0;const t=(m,f)=>{f();n++;console.log('OK  '+m);};
const P={front:['sam','char_02','char_03'],rear:['char_05','char_07']},E={front:['char_04','char_06','char_08'],rear:['char_09','char_05']};
const isD=c=>G.getResetCard(c.id).type==='DALY',dalleLast=s=>{s.deck.pile.sort((a,b)=>isD(b)-isD(a));return s;}; // Daly no fundo do monte: testes que contam a mão não dependem da sorte
const mk=()=>dalleLast(G.createBattleState(P,E)),alive=(s,x)=>s.units.filter(u=>u.team===x&&u.hp>0);
const foe=(s,a)=>s.units.find(u=>u.team!==a.team&&u.row==='front'&&u.hp>0);
const full=s=>{let g=0,seen={};while(!s.result&&g++<1500){if(s.recovery){assert(G.AI.resolveRecovery(s).ok);continue;}const a=G.getNextActor(s);assert(a.hp>0&&a.row==='front','agiu defunto ou retaguarda');
  const k=s.round+a.uid;assert(!seen[k],'duas ações na rodada');seen[k]=1;assert(G.AI.takeTurn(s,a).ok);
  ['player','enemy'].forEach(x=>{if(alive(s,x).length)assert(alive(s,x).some(u=>u.row==='front'),'frente vazia');});}return s;};
t('ordem respeita Velocidade e exclui a retaguarda',()=>{const s=mk(),sp=s.order.map(i=>G.getUnit(s,i).speed);assert.deepStrictEqual(sp,[...sp].sort((a,b)=>b-a));
  assert.strictEqual(s.order.length,6);assert(s.units.filter(u=>u.row==='rear').every(u=>!s.order.includes(u.uid)));});
t('desempate: jogador antes do adversário, depois posição',()=>{assert.deepStrictEqual(mk().order,['player_1','player_0','enemy_1','enemy_0','player_2','enemy_2']);});
t('ataque reduz a Vida pelo Dano do atacante',()=>{const s=mk(),a=G.getNextActor(s),tg=foe(s,a),b=tg.hp;assert(G.performBasicAttack(s,a.uid,tg.uid).ok);assert.strictEqual(tg.hp,Math.max(0,b-a.damage));});
t('retaguarda não pode ser atacada',()=>{const s=mk(),a=G.getNextActor(s),r=s.units.find(u=>u.team!==a.team&&u.row==='rear');
  assert(!G.performBasicAttack(s,a.uid,r.uid).ok);assert.strictEqual(r.hp,r.maxHp);});
t('retaguarda não pode atacar nem entra na ordem',()=>{const s=mk(),r=s.units.find(u=>u.team==='player'&&u.row==='rear');assert(!G.performBasicAttack(s,r.uid,foe(s,r).uid).ok);});
t('formação inválida é recusada (frente vazia, repetido, inexistente); retaguarda aceita qualquer classe e qualquer quantidade',()=>{
  assert.throws(()=>G.createBattleState({front:[],rear:['char_05']},E));
  assert.throws(()=>G.createBattleState({front:['sam','sam'],rear:[]},E));
  assert.throws(()=>G.createBattleState({front:['sam','nao_existe'],rear:[]},E));
  const s=G.createBattleState({front:['sam','char_02'],rear:['char_03','char_04','char_06']},E);assert.strictEqual(s.units.filter(u=>u.team==='player'&&u.row==='rear').length,3);});
t('frente vazia: UM personagem vivo da retaguarda é promovido na hora, sem turno extra; a Daly Mãe continua protegida',()=>{const s=mk();
  s.units.filter(u=>u.team==='enemy'&&u.row==='front').forEach(u=>G.eliminateUnit(s,u));
  const m=s.units.filter(u=>u.team==='enemy'&&u.row==='front'&&u.hp>0);assert.strictEqual(m.length,1);assert.strictEqual(m[0].uid,'enemy_3');assert.strictEqual(s.result,null);
  assert(!s.order.includes(m[0].uid),'promovido só age na rodada seguinte');assert(!G.isDalyExposed(s,'enemy'));
  G.buildTurnOrder(s);assert(s.order.includes(m[0].uid));
  assert(G.canTransit(G.getUnit(s,'enemy_3'))&&!G.canTransit(G.getUnit(s,'player_0')));});
t('alvos inválidos (aliado, derrotado, inexistente) e ação dupla são recusados',()=>{const s=mk(),a=G.getNextActor(s),ally=s.units.find(u=>u.team===a.team&&u!==a),f=foe(s,a);
  assert(!G.performBasicAttack(s,a.uid,ally.uid).ok);assert(!G.performBasicAttack(s,a.uid,'x').ok);
  f.hp=0;assert(!G.performBasicAttack(s,a.uid,f.uid).ok);f.hp=f.maxHp;assert(G.performBasicAttack(s,a.uid,f.uid).ok);assert(!G.performBasicAttack(s,a.uid,f.uid).ok);});
t('IA joga batalha completa; frente nunca vazia; houve avanço; vence quem tem a Daly Mãe viva; Vida entre 0 e máx',()=>{const s=full(mk());
  assert(['victory','defeat'].includes(s.result));assert(s.log.some(l=>l.includes('avançou')));const w=s.result==='victory'?'player':'enemy',l=w==='player'?'enemy':'player';
  assert(s.daly[w].hp>0&&s.daly[l].hp===0&&s.final.winner===w);assert(alive(s,w).length>0);s.units.forEach(u=>assert(u.hp>=0&&u.hp<=u.maxHp));
  const d=s.units.find(u=>u.hp<=0);assert(!G.performBasicAttack(s,d.uid,s.units[0].uid).ok);});
t('reset restaura Vida, posições, rodada, resultado e log',()=>{const r=G.resetBattle(full(mk()));
  assert(r.units.every(u=>u.hp===u.maxHp)&&r.round===1&&r.result===null&&r.log.length===0&&r.units.filter(u=>u.row==='rear').length===4);});
t('tabuleiro: lista os vivos de cada linha (3 na frente + 2 na retaguarda com estas equipes de teste)',()=>{const b=G.getBoard(mk());assert(b.player.front.length===3&&b.player.rear.length===2&&b.enemy.front.length===3&&b.enemy.rear.length===2);});
t('carta Sam traz Vida, Dano, Velocidade, Fôlego, Nome e cor de raridade',()=>{const h=G.cardHTML(G.getCharacterById('sam'));['1070','>70<','>3<','>10<','Sam','Atk','Life','Pounch','linear-gradient'].forEach(x=>assert(h.includes(x),x));});
const P2={front:['char_05','char_02','char_03'],rear:['char_07','char_09']},mk2=()=>G.createBattleState(P2,E);
t('troca voluntária: Suportes trocam retaguarda⇄frente, gastam fôlego de cada um, frente nunca vazia',()=>{
  const s=mk2(),c=G.CONFIG.swapStaminaCost,a=G.getUnit(s,'player_0'),b=G.getUnit(s,'player_3');
  assert.strictEqual(G.getSwapPairs(s,'player').length,2);assert(G.performSwap(s,b.uid,a.uid).ok);
  assert(a.row==='rear'&&b.row==='front'&&a.stamina===10-c&&b.stamina===10-c);
  G.buildTurnOrder(s);assert(s.order.includes(b.uid)&&!s.order.includes(a.uid));assert(alive(s,'player').some(u=>u.row==='front'));});
t('troca recusada: não-Suporte, mesma linha, fôlego insuficiente, derrotado, vez do adversário',()=>{
  let s=mk2();assert(!G.performSwap(s,'player_3','player_1').ok);assert(!G.performSwap(s,'player_3','player_4').ok);
  s=mk2();s.units.find(u=>u.uid==='player_3').stamina=2;assert(!G.performSwap(s,'player_3','player_0').ok);
  s=mk2();s.units.find(u=>u.uid==='player_3').hp=0;assert(!G.performSwap(s,'player_3','player_0').ok);
  s=mk2();['player_0','player_1','player_2'].forEach(i=>s.acted[i]=true);assert(G.getNextActor(s).team==='enemy');assert(!G.performSwap(s,'player_3','player_0').ok);
  s=mk2();assert(!G.performSwap(s,'player_3','enemy_0').ok);});
t('carta mostra o Fôlego atual da unidade após a troca',()=>{const s=mk2();G.performSwap(s,'player_3','player_0');assert(G.cardHTML(G.getUnit(s,'player_3')).includes('>7<'));});
const SUP=['na_moloeira','bandeide','brisa'],mkS=()=>G.createBattleState(P,E,SUP);
const endTurn=s=>{let a=G.getNextActor(s);G.performBasicAttack(s,a.uid,foe(s,a).uid);while(!s.result&&G.getNextActor(s).team==='enemy')G.AI.takeTurn(s,G.getNextActor(s));};
t('Apoio: Na Moloeira dá +20 só no próximo ataque; gasta 1 uso, nenhuma ação e nenhum fôlego',()=>{const s=mkS(),a=G.getNextActor(s),tg=foe(s,a);assert.strictEqual(a.team,'player');
  const st=a.stamina,u0=s.support.slots[0].uses;assert(G.performSupport(s,0).ok);assert.strictEqual(s.support.slots[0].uses,u0-1);assert(!s.acted[a.uid]&&a.stamina===st);
  const b=tg.hp;assert(G.performBasicAttack(s,a.uid,tg.uid).ok);assert.strictEqual(tg.hp,Math.max(0,b-(a.damage+20)));assert.strictEqual(s.support.nextAttackBonus,0);});
t('Apoio: 1 carta por turno (reabre no turno seguinte); esgota; recusa fora da vez',()=>{const s=mkS();
  assert(G.performSupport(s,0).ok);assert(!G.performSupport(s,0).ok);assert(!G.performSupport(s,2).ok);
  endTurn(s);assert(G.performSupport(s,0).ok);assert.strictEqual(s.support.slots[0].uses,0);endTurn(s);assert(!G.performSupport(s,0).ok);
  const z=mkS();['player_0','player_1','player_2'].forEach(i=>z.acted[i]=true);assert.strictEqual(G.getNextActor(z).team,'enemy');assert(!G.performSupport(z,0).ok);});
t('Apoio: Bandeide cura +80 sem passar do máximo; recusa vida cheia, inimigo e derrotado',()=>{
  let s=mkS(),u=G.getUnit(s,'player_0');assert(!G.performSupport(s,1,u.uid).ok);
  u.hp=100;assert(!G.performSupport(s,1,'enemy_0').ok);assert(G.performSupport(s,1,u.uid).ok);assert.strictEqual(u.hp,180);
  s=mkS();u=G.getUnit(s,'player_0');u.hp=u.maxHp-30;assert(G.performSupport(s,1,u.uid).ok);assert.strictEqual(u.hp,u.maxHp);
  s=mkS();u=G.getUnit(s,'player_0');u.hp=0;G.getUnit(s,'player_2').hp=10;assert(!G.performSupport(s,1,u.uid).ok);});
const brisaState=()=>{const s=mkS();assert(G.performSupport(s,2).ok);['player_0','player_1','player_2'].forEach(i=>s.acted[i]=true);
  const vic=G.getUnit(s,'player_0'),hurt=G.getUnit(s,'player_2');vic.hp=1;hurt.hp=hurt.maxHp-50;
  const en=G.getNextActor(s);assert.strictEqual(en.team,'enemy');assert(G.performBasicAttack(s,en.uid,vic.uid).ok);return{s,hurt};};
t('Apoio: Brisa ativa; aliado eliminado abre cura +30 em outro aliado ferido; ações ficam bloqueadas até resolver',()=>{
  const{s,hurt}=brisaState();assert.strictEqual(s.support.brisa,30);assert(!G.performSupport(s,2).ok);
  assert(s.support.pending.candidates.includes('player_2')&&!s.support.pending.candidates.includes('player_0'));
  assert(!G.performBasicAttack(s,G.getNextActor(s).uid,'player_1').ok);assert(!G.resolveBrisa(s,'player_1').ok);
  const b=hurt.hp;assert(G.resolveBrisa(s,'player_2').ok);assert.strictEqual(hurt.hp,b+30);assert.strictEqual(s.support.pending,null);});
t('Apoio: Brisa pode ser dispensada e continua ativa para a próxima eliminação',()=>{const{s}=brisaState();assert(G.resolveBrisa(s,null).ok);assert.strictEqual(s.support.pending,null);assert.strictEqual(s.support.brisa,30);});
t('Apoio: carga inválida (mais de 3 ou inexistente) é recusada; reset devolve os usos',()=>{
  assert.throws(()=>G.createBattleState(P,E,['na_moloeira','bandeide','brisa','x']));assert.throws(()=>G.createBattleState(P,E,['x']));
  const s=mkS();G.performSupport(s,0);const r=G.resetBattle(s);assert(r.support.slots.every(x=>x.uses===x.maxUses)&&r.support.usedTurn===0&&r.turn===1);});
t('Apoio: Brisa sem aliado ferido não abre escolha e avisa no registro',()=>{const s=mkS();assert(G.performSupport(s,2).ok);['player_0','player_1','player_2'].forEach(i=>s.acted[i]=true);
  G.getUnit(s,'player_0').hp=1;const en=G.getNextActor(s);assert(G.performBasicAttack(s,en.uid,'player_0').ok);assert.strictEqual(s.support.pending,null);assert(s.log.some(l=>l.includes('nenhum aliado ferido')));});
const M={front:['char_10','char_02','char_03'],rear:['char_05','char_07']},E2={front:['char_10','char_06','char_08'],rear:['char_09','char_05']};
t('Mago: mana por raridade (Comum 2, Raro 3, Épico 5, Lendário 7); só Mago tem mana',()=>{
  assert.deepStrictEqual(['COMMON','RARE','EPIC','LEGENDARY'].map(r=>G.manaFor({class:'MAGO',rarity:r})),[2,3,5,7]);assert.strictEqual(G.manaFor({class:'FIGHTER',rarity:'LEGENDARY'}),0);
  const s=G.createBattleState({front:['char_10','char_11','char_03'],rear:[]},E);assert.strictEqual(G.getUnit(s,'player_0').mana,3);assert.strictEqual(G.getUnit(s,'player_1').mana,7);assert.strictEqual(G.getUnit(s,'player_2').mana,0);});
t('Mago: cada mana gasta soma dano; mana gasta não volta; recusa excesso, negativo, fracionado e não-Mago',()=>{
  const s=G.createBattleState(M,E),a=G.getNextActor(s),per=G.CONFIG.manaDamagePerPoint,tg=foe(s,a),b=tg.hp;assert.strictEqual(a.uid,'player_0');
  [4,-1,1.5].forEach(x=>assert(!G.performBasicAttack(s,a.uid,tg.uid,x).ok));assert.strictEqual(a.mana,3);
  assert(G.performBasicAttack(s,a.uid,tg.uid,2).ok);assert.strictEqual(tg.hp,Math.max(0,b-(a.damage+2*per)));assert.strictEqual(a.mana,1);
  let g=0;while(G.getNextActor(s).uid!=='player_0'&&g++<20){const x=G.getNextActor(s);if(x.team==='player'){assert(!G.performBasicAttack(s,x.uid,foe(s,x).uid,1).ok);G.performBasicAttack(s,x.uid,foe(s,x).uid);}else G.AI.takeTurn(s,x);}
  assert.strictEqual(a.mana,1);});
t('Mago: mana soma com o bônus da Na Moloeira; prévia de dano confere',()=>{const s=G.createBattleState(M,E,['na_moloeira']),a=G.getNextActor(s),tg=foe(s,a),b=tg.hp;
  assert(G.performSupport(s,0).ok);const d=G.previewDamage(s,a,2);assert.strictEqual(d,a.damage+20+2*G.CONFIG.manaDamagePerPoint);assert(G.performBasicAttack(s,a.uid,tg.uid,2).ok);assert.strictEqual(tg.hp,Math.max(0,b-d));});
t('Mago (IA): gasta o mínimo de mana que elimina o alvo',()=>{const s=G.createBattleState(P,E2),a=G.getNextActor(s);assert.strictEqual(a.uid,'enemy_0');
  const v=G.getUnit(s,'player_1');v.hp=a.damage+2*G.CONFIG.manaDamagePerPoint-5;G.AI.takeTurn(s,a);assert.strictEqual(v.hp,0);assert.strictEqual(a.mana,a.maxMana-2);});
t('Mago: batalha completa de IA com Magos nos dois lados termina; reset devolve a mana',()=>{const s=full(G.createBattleState(M,E2));assert(['victory','defeat'].includes(s.result));
  assert(G.resetBattle(s).units.every(u=>u.mana===u.maxMana));});
t('Mago: carta usa a moldura própria (ícone e orbe já desenhados), mostra a mana e não repete o ícone de classe',()=>{
  const h=G.cardHTML(G.getCharacterById('char_10'));assert(h.includes('card_base_mago.png')&&h.includes('>3<')&&h.includes('baked'));
  const f=G.cardHTML(G.getCharacterById('sam'));assert(f.includes('card_base.png')&&!f.includes('baked'));});
// ---- Monte Reset ----
const seq=()=>{let i=0;return()=>((i++*7919)%1000)/1000;}; // rng determinístico
const deckCards=G.RESET_CARDS.filter(c=>G.CONFIG.mainDeckTypes.includes(c.type)),total=deckCards.reduce((a,c)=>a+c.copies,0),hand=(s,x)=>s.deck.hands[x];
t('Reset: monte principal tem todas as cópias, cobre as 4 categorias e inclui as cartas de Apoio reais',()=>{const s=mk();assert.strictEqual(s.deck.pile.length,total);assert.strictEqual(s.deck.total,total);
  assert.deepStrictEqual(new Set(s.deck.pile.map(c=>G.getResetCard(c.id).type)),new Set(['SUPPORT','ITEM','SPECIAL','DALY']));
  assert(['na_moloeira','bandeide','brisa'].every(id=>s.deck.pile.some(c=>c.id===id)));assert(new Set(s.deck.pile.map(c=>c.iid)).size===total);});
t('Reset: rng injetado embaralha de forma reproduzível e diferente da ordem original',()=>{
  const a=G.createDeckState(seq()),b=G.createDeckState(seq());assert.deepStrictEqual(a.pile,b.pile);
  assert.notDeepStrictEqual(a.pile.map(c=>c.id),deckCards.flatMap(c=>Array(c.copies).fill(c.id)));});
t('Reset: a rodada 1 não compra; ao resetar a hierarquia, AS DUAS equipes compram 1 carta (jogador primeiro)',()=>{
  const s=mk();assert(!hand(s,'player').length&&!hand(s,'enemy').length);
  for(let i=0;i<6;i++){const a=G.getNextActor(s);assert.strictEqual(s.round,1);assert(G.performBasicAttack(s,a.uid,foe(s,a).uid).ok);}
  assert.strictEqual(hand(s,'player').length,0);
  const a=G.getNextActor(s);assert(a);assert.strictEqual(s.round,2);
  assert.strictEqual(hand(s,'player').length,1);assert.strictEqual(hand(s,'enemy').length,1);assert.strictEqual(s.deck.pile.length,total-2);
  assert.strictEqual(s.deck.last.round,2);assert(s.log.some(l=>l.startsWith('Reset de velocidade')));
  G.getNextActor(s);G.getNextActor(s);assert.strictEqual(hand(s,'player').length,1,'chamar de novo não compra de novo');});
t('Reset: a carta comprada é a do topo do monte e sai dele',()=>{const s=mk(),top=s.deck.pile[s.deck.pile.length-1];const c=G.drawCard(s,'player');
  assert.strictEqual(c.iid,top.iid);assert(!s.deck.pile.some(x=>x.iid===c.iid));assert(hand(s,'player')[0]===c);assert.throws(()=>G.drawCard(s,'x'));});
t('Reset: monte vazio não compra nem quebra a batalha',()=>{const s=mk();s.deck.pile.length=0;G.onSpeedReset(s);
  assert.strictEqual(hand(s,'player').length+hand(s,'enemy').length,0);assert(s.log.some(l=>l.includes('monte vazio')));assert.strictEqual(G.drawCard(s,'player'),null);});
t('Reset: batalha completa compra a cada rodada (sem duplicar cartas) e o reset de batalha embaralha um monte novo',()=>{
  const s=full(mk()),n=Math.min(s.round-1,Math.floor(total/2)),mine=s.deck.discard.filter(c=>c.side==='player').length,theirs=s.deck.discard.filter(c=>c.side==='enemy').length; // Daly resolvida vai para o descarte
  assert.strictEqual(hand(s,'player').length+mine,n);assert.strictEqual(hand(s,'enemy').length+theirs,n);
  const all=[...s.deck.pile,...hand(s,'player'),...hand(s,'enemy'),...s.deck.discard];assert.strictEqual(all.length,total);assert.strictEqual(new Set(all.map(c=>c.iid)).size,total);
  const r=G.resetBattle(s);assert.strictEqual(r.deck.pile.length,total);assert(!hand(r,'player').length&&!r.deck.discard.length);});
t('Reset: perTeam configurável e onBattleStart compra já na rodada 1',()=>{const old={...G.CONFIG.resetDraw};
  try{G.CONFIG.resetDraw={perTeam:2,onBattleStart:true};const s=mk();assert.strictEqual(hand(s,'player').length+s.deck.discard.filter(c=>c.side==='player').length,2);assert.strictEqual(hand(s,'enemy').length+s.deck.discard.filter(c=>c.side==='enemy').length,2);}finally{G.CONFIG.resetDraw=old;}});
t('Reset: getHand e interface do painel (monte, mão, tipo; cartas provisórias identificadas)',()=>{const s=mk();G.drawCard(s,'player');G.drawCard(s,'enemy');
  const h=G.getHand(s,'player');assert(h[0].card&&G.CARD_TYPES[h[0].card.type]);const html=G.handPanelHTML(s);
  assert(html.includes('Monte: '+(total-2)+'/'+total)&&html.includes('Adversário: 1 carta<')&&html.includes('data-hand="'+h[0].iid+'"'));
  G.onSpeedReset(s);s.deck.last.round=s.round;assert(G.resetNoticeHTML(s).includes('Reset de velocidade'));s.round++;assert.strictEqual(G.resetNoticeHTML(s),'');});
// ---- Esquivar (Assassin) ----
let R=1;const sD=(p=P,e=E)=>G.createBattleState(p,e,[],{roll:()=>R});
const only=(s,uid)=>{s.units.forEach(u=>{if(u.uid!==uid)s.acted[u.uid]=true;});assert.strictEqual(G.getNextActor(s).uid,uid);return G.getUnit(s,uid);};
const hit=(att,tg,roll)=>{R=roll;const s=sD(),a=only(s,att),v=G.getUnit(s,tg),b=v.hp,r=G.performBasicAttack(s,a.uid,tg);return{s,a,v,b,r};};
t('Esquivar: Assassin mais rápido esquiva com dado de 1 até a diferença (5−3=2: sai 1 ou 2); com 3 ou mais é atingido',()=>{
  [1,2].forEach(x=>{const h=hit('enemy_1','player_1',x);assert(h.r.ok&&h.r.dodged);assert.strictEqual(h.v.hp,h.b);assert(h.s.log.some(l=>l.includes('esquivou')));});
  [3,4,6].forEach(x=>{const h=hit('enemy_1','player_1',x);assert(h.r.ok&&!h.r.dodged);assert.strictEqual(h.v.hp,h.b-h.a.damage);assert(h.s.log.some(l=>l.includes('esquiva falhou')));});});
t('Esquivar: velocidade igual ou maior do atacante não permite esquivar (nem com o melhor dado)',()=>{
  const E3={front:['char_02','char_06','char_08'],rear:['char_09','char_05']};R=1;let s=sD(P,E3),a=only(s,'enemy_0'),v=G.getUnit(s,'player_1'),b=v.hp;   // 5 contra 5
  assert.strictEqual(G.dodgeInfo(a,v),null);assert(G.performBasicAttack(s,a.uid,'player_1').ok);assert.strictEqual(v.hp,b-a.damage);
  s=sD(P,E3);a=only(s,'enemy_0');v=G.getUnit(s,'player_2');v.class='ASSASSIN';v.speed=4;assert.strictEqual(G.dodgeInfo(a,v),null);});   // 4 contra 5
t('Esquivar: Mago sempre acerta, mesmo com o dado favorável',()=>{const Em={front:['char_11','char_06','char_08'],rear:['char_09','char_05']};
  R=1;const s=sD(P,Em),a=only(s,'enemy_0'),v=G.getUnit(s,'player_1'),b=v.hp;assert.strictEqual(a.class,'MAGO');assert(a.speed<v.speed);
  assert.strictEqual(G.dodgeInfo(a,v),null);const r=G.performBasicAttack(s,a.uid,'player_1');assert(r.ok&&!r.dodged);assert.strictEqual(v.hp,b-a.damage);});
t('Esquivar: só Assassin esquiva; ataque esquivado gasta a ação e o turno; chance fica exposta',()=>{
  R=1;const s=sD(),a=only(s,'enemy_1'),turn=s.turn,sam=G.getUnit(s,'player_0');assert.strictEqual(G.dodgeInfo(a,sam),null);
  const i=G.dodgeInfo(a,G.getUnit(s,'player_1'));assert.deepStrictEqual([i.diff,i.sides],[2,G.CONFIG.dodgeDie]);
  assert(G.performBasicAttack(s,a.uid,'player_1').dodged);assert(s.acted[a.uid]);assert.strictEqual(s.turn,turn+1);assert(!G.performBasicAttack(s,a.uid,'player_1').ok);});
t('Esquivar: sem dado injetado o sorteio fica entre 1 e o número de lados',()=>{const s=G.createBattleState(P,E);const v=Array.from({length:300},()=>s.roll(6));assert(v.every(x=>Number.isInteger(x)&&x>=1&&x<=6)&&new Set(v).size===6);});
t('Esquivar: carta do Assassin usa a moldura e a máscara de raridade próprias, com o ícone já desenhado',()=>{
  const h=G.cardHTML(G.getCharacterById('char_12'));assert(h.includes('card_base_assassin.png')&&h.includes('--holes-assassin')&&h.includes('baked')&&h.includes('linear-gradient'));
  assert(!G.cardHTML(G.getCharacterById('char_10')).includes('--holes-assassin'));});
console.log(n+' testes passaram');
