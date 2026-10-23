// Regras da batalha. O estado (createBattleState) é a única fonte de verdade; a UI só lê e chama estas funções.
// Equipe: linha de frente (luta, pode ser atacada) + retaguarda (personagens vivos da equipe que esperam: não atacam nem são atacados).
// Cada lado começa com 2 na frente e a retaguarda vazia; a equipe cresce por Daly e pela recuperação da Daly Mãe (js/core/roster.js).
// A batalha só termina quando uma Daly Mãe chega a 0 vida; quem tem a Daly Mãe viva vence.
(function(G){
const isCharacterDefeated=u=>u.hp<=0||!!u.eliminated;
const getUnit=(s,uid)=>s.units.find(u=>u.uid===uid)||null;
const canAct=u=>!isCharacterDefeated(u)&&u.row==='front';       // retaguarda não age
const isTargetable=u=>!isCharacterDefeated(u)&&u.row==='front'; // retaguarda não pode ser atacada
const canTransit=u=>u.class==='SUPPORT';                        // troca voluntária (inalterada): somente Suportes
const fail=error=>({ok:false,error});
function validateTeam(team){
  const ids=[...team.front,...team.rear];
  if(!team.front.length)return fail('A linha de frente não pode ficar vazia.');
  if(team.front.length>3)return fail('A linha de frente permite no máximo 3 personagens.');
  if(team.rear.length>2)return fail('A retaguarda permite no máximo 2 personagens.');
  if(team.rear.some(id=>G.getCharacterById(id)?.class!=='SUPPORT'))return fail('Somente personagens da classe SUPPORT podem ficar na retaguarda.');
  if(new Set(ids).size!==ids.length)return fail('Personagem repetido na equipe.');
  if(ids.some(id=>!G.getCharacterById(id)))return fail('Personagem inexistente.');
  return{ok:true};
}
const cp=t=>({front:[...t.front],rear:[...t.rear]});
const nextSlot=(s,side,row)=>1+Math.max(-1,...s.units.filter(u=>u.team===side&&u.row===row&&!isCharacterDefeated(u)).map(u=>u.slot));
// Cria a unidade de uma carta de personagem (instância {iid,id}) na linha indicada. uid = lado_n (n cresce a cada personagem que entra).
function makeUnit(s,side,inst,row){
  const c=G.getCharacterById(inst.id),k=s.uidSeq[side]++;
  const u={uid:side+'_'+k,iid:inst.iid,id:c.id,team:side,row,slot:nextSlot(s,side,row),name:c.name,class:c.class,rarity:c.rarity,maxHp:c.maxHp,hp:c.maxHp,damage:c.damage,speed:c.speed,stamina:c.stamina,mana:G.manaFor(c),maxMana:G.manaFor(c),art:c.art,eliminated:false};
  s.units.push(u);return u;
}
function createBattleState(playerTeam,enemyTeam,supportIds=[],opts={}){
  const rng=opts.rng||Math.random,teams={player:playerTeam,enemy:enemyTeam};
  ['player','enemy'].forEach(side=>{const v=validateTeam(teams[side]);if(!v.ok)throw new Error(side+': '+v.error);});
  const s={config:{playerTeam:cp(playerTeam),enemyTeam:cp(enemyTeam),supportIds:[...supportIds]},units:[],uidSeq:{player:0,enemy:0},round:0,turn:1,phase:'battle',
    support:G.createSupportState(supportIds),order:[],acted:{},speedCursor:null,result:null,final:null,log:[],rng,eventSeq:0,lastEvent:null,
    deck:G.createDeckState(rng),piles:G.createCharacterPiles(rng),eliminated:[],daly:G.createDalyMae(),recovery:null,formation:null,
    roll:opts.roll||(n=>1+Math.floor(rng()*n))}; // roll(n): dado de n lados (injetável nos testes). Tudo aqui é novo a cada partida: nada vaza da anterior.
  ['player','enemy'].forEach(side=>{const t=teams[side];
    t.front.forEach(id=>makeUnit(s,side,G.claimCharacter(s,id),'front'));t.rear.forEach(id=>makeUnit(s,side,G.claimCharacter(s,id),'rear'));});
  buildTurnOrder(s);if(G.CONFIG.resetDraw.onBattleStart)G.onSpeedReset(s);return s;
}
// Ordem: só quem pode agir (frente, vivo), por Velocidade (maior primeiro).
// DESEMPATE: equipe do jogador antes da adversária; depois posição (slot).
// Medalhas e avanços esperam a próxima rodada; recuperação da Daly pode entrar na faixa de velocidade restante.
const compareSpeed=(a,b)=>b.speed-a.speed||(a.team===b.team?0:a.team==='player'?-1:1)||a.slot-b.slot;
function buildTurnOrder(s){
  const list=s.units.filter(canAct);
  list.sort(compareSpeed);
  s.order=list.map(u=>u.uid);s.acted={};s.speedCursor=null;s.round++;return s.order;
}
// Inclui apenas os recuperados cuja velocidade ainda não passou, sem resetar rodada, compras ou ações gastas.
function resumeRecoveryOrder(s,units){
  const eligible=units.filter(u=>canAct(u)&&s.speedCursor!==null&&u.speed<=s.speedCursor&&!s.acted[u.uid]&&!s.order.includes(u.uid));
  const done=s.order.filter(uid=>s.acted[uid]);
  const remaining=s.order.filter(uid=>!s.acted[uid]).map(uid=>getUnit(s,uid)).concat(eligible).sort(compareSpeed);
  s.order=done.concat(remaining.map(u=>u.uid));
  units.forEach(u=>s.log.push(u.name+' · velocidade '+u.speed+' · '+(eligible.includes(u)?'entra na hierarquia desta rodada':'aguarda o próximo reset de velocidade')));
}
function getNextActor(s){
  const paused=()=>s.result||s.recovery||s.formation||s.support.pending||(s.deck&&s.deck.pendingChoice);
  if(paused())return null; // decisões pendentes pausam a ordem, sem avançar a rodada
  const find=()=>s.order.map(id=>getUnit(s,id)).find(u=>u&&canAct(u)&&!s.acted[u.uid]);
  let a=find();if(!a){buildTurnOrder(s);G.onSpeedReset(s);if(paused())return null;a=find();} // a compra pode abrir uma escolha de mão cheia
  return a||null;
}
// Promove um Suporte na hora. Com dois disponíveis, pausa para escolher qual deles (ou ambos) defenderá a frente.
function enforceFrontLine(s,side){
  const mine=s.units.filter(u=>u.team===side&&!isCharacterDefeated(u));
  if(!mine.length||mine.some(u=>u.row==='front'))return[];
  const rear=mine.filter(x=>x.row==='rear').sort((a,b)=>a.slot-b.slot),u=rear[0];if(!u)return[];
  u.row='front';u.slot=nextSlot(s,side,'front');s.log.push(u.name+' avançou para a linha de frente');
  if(rear.length>1)s.formation={side,candidates:rear.map(x=>x.uid)};
  return[u];
}
function resolveFrontLine(s,uids){
  const p=s.formation;if(s.result||!p)return fail('Nenhum avanço pendente.');
  if(!Array.isArray(uids)||!uids.length||new Set(uids).size!==uids.length||uids.some(uid=>!p.candidates.includes(uid)))return fail('Escolha ao menos um dos Suportes disponíveis.');
  const candidates=p.candidates.map(uid=>getUnit(s,uid));
  if(candidates.some(u=>!u||isCharacterDefeated(u)||!canTransit(u)))return fail('Suporte indisponível.');
  candidates.forEach(u=>{u.row=uids.includes(u.uid)?'front':'rear';u.slot=nextSlot(s,p.side,u.row);});
  s.formation=null;s.log.push((p.side==='player'?'Sua defesa':'Defesa adversária')+': '+candidates.filter(u=>u.row==='front').map(u=>u.name).join(' e ')+' na linha de frente');
  return{ok:true};
}
function performTransit(s,uid){
  if(s.result||s.recovery||s.formation||s.support.pending||s.deck.pendingChoice)return fail('Resolva a escolha pendente antes de mover Suportes.');
  const u=getUnit(s,uid);if(!u||isCharacterDefeated(u)||!canTransit(u))return fail('Somente Suportes vivos podem transitar.');
  const actor=getNextActor(s);if(!actor||actor.team!==u.team)return fail('Mova Suportes apenas na vez da sua equipe.');
  const board=getBoard(s)[u.team],to=u.row==='front'?'rear':'front';
  if(u.row==='front'&&board.front.length<=1)return fail('A linha de frente precisa manter pelo menos um personagem.');
  if(board[to].length>=(to==='front'?3:2))return fail('Essa linha está cheia. Escolha um Suporte da outra linha para trocar.');
  u.row=to;u.slot=nextSlot(s,u.team,to);s.log.push(u.name+' foi para '+(to==='front'?'a linha de frente':'a retaguarda'));
  return{ok:true};
}
// Encerra a partida (uma vez só): registra vencedor/perdedor e bloqueia tudo que dependa de a batalha continuar.
function finishMatch(s,loser){
  if(s.result)return s.result;
  const winner=loser==='player'?'enemy':'player';
  s.result=winner==='player'?'victory':'defeat';s.phase='ended';s.recovery=null;s.formation=null;s.support.pending=null;s.order=[];
  s.daly.player.exposed=s.daly.enemy.exposed=false; // nada mais pode ser atacado: a Daly Mãe a 0 aparece como derrotada, não como exposta
  s.final={winner,loser,dalyDefeated:loser,daly:{player:s.daly.player.hp,enemy:s.daly.enemy.hp},round:s.round};
  s.log.push((loser==='player'?'Sua Daly Mãe':'A Daly Mãe adversária')+' chegou a 0 de vida · '+(winner==='player'?'você venceu':'o adversário venceu'));
  return s.result;
}
// Usa os valores reais de vida das duas Daly Mães: vence quem ainda tem a sua viva quando a outra chega a 0.
function checkBattleResult(s){
  if(s.result)return s.result;
  const p=s.daly.player.hp,e=s.daly.enemy.hp;
  if(p<=0&&e>0)finishMatch(s,'player');else if(e<=0&&p>0)finishMatch(s,'enemy');
  return s.result;
}
// Esquivar (Tributo do Assassin): só esquiva quem é MAIS rápido que o atacante; tira-se um dado e esquiva se sair de 1 até a diferença
// de velocidade (ex.: 5 − 3 = 2 → 1 ou 2). Velocidade igual ou maior do atacante: não esquiva. Magos sempre acertam. Esquivar = nenhum dano.
function dodgeInfo(a,t){if(!t||t.class!=='ASSASSIN'||a.class==='MAGO')return null;const diff=t.speed-a.speed;return diff>0?{diff,sides:G.CONFIG.dodgeDie}:null;}
function rollDodge(s,a,t){const i=dodgeInfo(a,t);if(!i)return null;const roll=s.roll(i.sides);return{diff:i.diff,sides:i.sides,roll,dodged:roll<=i.diff};}
// Ataque à Daly Mãe exposta: retira EXATAMENTE 1 vida, qualquer que seja o Dano do atacante (sem excedente, sem esquiva).
// Bônus de apoio e mana não são gastos (não teriam efeito). Cada ataque é processado uma vez (o atacante só age uma vez por rodada).
function regenerateMageMana(s){
  const recovered=[];s.units.forEach(u=>{if(u.class==='MAGO'&&!isCharacterDefeated(u)&&u.mana<(u.maxMana||G.MAGE_MAX_MANA)){u.mana=Math.min(u.maxMana||G.MAGE_MAX_MANA,u.mana+1);recovered.push(u.name+' +1 ('+u.mana+'/'+u.maxMana+')');}});
  if(recovered.length)s.log.push('Mana · '+recovered.join(', '));
}
function event(s,data){s.eventSeq=(s.eventSeq||0)+1;s.lastEvent={id:s.eventSeq,...data};}
function completeAction(s,a){s.acted[a.uid]=true;s.speedCursor=a.speed;s.turn++;}
function attackDaly(s,a,side){
  const d=s.daly[side],before=d.hp;d.hp=Math.max(0,d.hp-1);completeAction(s,a);event(s,{type:'daly-hit',actorUid:a.uid,targetUid:'daly_'+side,damage:before-d.hp});
  Object.assign(s.lastEvent,{actorName:a.name,targetName:side==='player'?'Sua Daly Mãe':'Daly Mãe adversária',beforeHp:before,afterHp:d.hp});
  s.log.push(a.name+' atacou '+(side==='player'?'a sua Daly Mãe':'a Daly Mãe adversária')+' · −1 vida ('+d.hp+'/'+d.max+')');
  regenerateMageMana(s);
  checkBattleResult(s);
  if(!s.result)G.openRecovery(s,side); // ainda tem vida: o dono escolhe a recuperação
  return{ok:true,damage:0,defeated:false,daly:side,dalyHp:d.hp,dalyDefeated:d.hp<=0};
}
function performBasicAttack(s,attackerUid,targetUid,mana=0){
  if(s.result)return fail('Batalha encerrada.');
  if(s.recovery)return fail('Escolha a recuperação antes de continuar.');
  if(s.formation)return fail('Escolha os Suportes que avançam antes de continuar.');
  if(s.support.pending)return fail('Resolva a Brisa antes de continuar.');
  const dSide=typeof targetUid==='string'&&targetUid.startsWith('daly_')?targetUid.slice(5):null; // alvo = Daly Mãe ('daly_player' | 'daly_enemy')
  const a=getUnit(s,attackerUid),t=dSide?null:getUnit(s,targetUid);
  if(!a||(!dSide&&!t))return fail('Personagem inexistente.');
  if(isCharacterDefeated(a))return fail('Atacante derrotado.');
  if(a.row!=='front')return fail('A retaguarda não pode atacar.');
  if(s.acted[a.uid])return fail('Já agiu nesta rodada.');
  const next=getNextActor(s);if(!next||next.uid!==a.uid)return fail('Não é a vez deste personagem.');
  if(dSide){
    if(!s.daly[dSide])return fail('Alvo inválido.');
    if(dSide===a.team)return fail('O alvo deve ser adversário.');
    if(!G.isDalyExposed(s,dSide))return fail('A Daly Mãe está protegida enquanto houver personagens vivos.');
    if(!Number.isInteger(mana)||mana<0)return fail('Quantidade de mana inválida.');
    if(mana>0&&a.class!=='MAGO')return fail('Somente Magos usam mana.');
    if(mana>a.mana)return fail('Mana insuficiente.');
    return attackDaly(s,a,dSide);
  }
  if(a.team===t.team)return fail('O alvo deve ser adversário.');
  if(isCharacterDefeated(t))return fail('Alvo já derrotado.');
  if(t.row!=='front')return fail('A retaguarda não pode ser atacada.');
  if(!Number.isInteger(mana)||mana<0)return fail('Quantidade de mana inválida.');
  if(mana>0&&a.class!=='MAGO')return fail('Somente Magos usam mana.');
  if(mana>a.mana)return fail('Mana insuficiente.');
  const per=G.CONFIG.manaDamagePerPoint,bonus=a.team==='player'?G.takeAttackBonus(s):0,dmg=a.damage+bonus+mana*per; // apoio (Na Moloeira) + mana do Mago
  a.mana-=mana; // Mana gasta é parcialmente recuperada ao fim de cada ação/turno que passa
  const dd=rollDodge(s,a,t); // o bônus de apoio e a mana já foram gastos, mesmo se o ataque for esquivado
  if(dd&&dd.dodged){completeAction(s,a);event(s,{type:'dodge',actorUid:a.uid,targetUid:t.uid,actorName:a.name,targetName:t.name,damage:0,beforeHp:t.hp,afterHp:t.hp,roll:dd.roll});s.log.push(a.name+' atacou '+t.name+', mas '+t.name+' esquivou! (dado '+dd.roll+' ≤ '+dd.diff+')');regenerateMageMana(s);return{ok:true,damage:0,defeated:false,dodged:true,roll:dd.roll,needed:dd.diff};}
  const hpBefore=t.hp;t.hp=Math.min(t.maxHp,Math.max(0,t.hp-dmg));completeAction(s,a);event(s,{type:t.hp<=0?'defeat':'hit',actorUid:a.uid,targetUid:t.uid,actorName:a.name,targetName:t.name,targetTeam:t.team,targetRow:t.row,targetSlot:t.slot,beforeHp:hpBefore,afterHp:t.hp,damage:Math.min(hpBefore,dmg),manaSpent:mana,bonus});
  s.log.push(a.name+' causou '+dmg+(bonus?' (+'+bonus+' de apoio)':'')+(mana?' (+'+mana*per+' com '+mana+' de mana)':'')+' em '+t.name+(t.hp<=0?' (derrotado)':'')+(dd?' [esquiva falhou: dado '+dd.roll+' > '+dd.diff+']':''));
  if(t.hp<=0)G.eliminateUnit(s,t); // eliminação permanente: sai da equipe e da fila, promove a retaguarda, expõe a Daly Mãe se a equipe acabou
  if(!s.result&&t.hp<=0)G.onAllyDefeated(s,t);
  regenerateMageMana(s);
  return{ok:true,damage:dmg,defeated:t.hp<=0};
}
// Troca voluntária (somente na vez da própria equipe): um Suporte da retaguarda e um da linha de frente trocam de lugar.
// Não consome a ação nem dá ataque extra. Quem estava na retaguarda entra na ordem da rodada seguinte.
function performSwap(s,aUid,bUid){
  if(s.result)return fail('Batalha encerrada.');
  if(s.recovery)return fail('Escolha a recuperação antes de continuar.');
  if(s.formation)return fail('Resolva o avanço obrigatório antes de trocar.');
  if(s.support.pending)return fail('Resolva a Brisa antes de continuar.');
  const a=getUnit(s,aUid),b=getUnit(s,bUid);
  if(!a||!b)return fail('Personagem inexistente.');
  if(a.team!==b.team)return fail('A troca é entre aliados.');
  const next=getNextActor(s);if(!next||next.team!==a.team)return fail('Só é possível trocar na vez da sua equipe.');
  if(isCharacterDefeated(a)||isCharacterDefeated(b))return fail('Personagem derrotado.');
  if(!canTransit(a)||!canTransit(b))return fail('Somente Suportes podem trocar de posição.');
  if(a.row===b.row)return fail('A troca é entre retaguarda e linha de frente.');
  [a.row,b.row]=[b.row,a.row];[a.slot,b.slot]=[b.slot,a.slot];
  s.log.push(a.name+' e '+b.name+' trocaram de posição');return{ok:true};
}
function getSwapPairs(s,side){
  const ok=u=>u.team===side&&!isCharacterDefeated(u)&&canTransit(u);
  const rear=s.units.filter(u=>ok(u)&&u.row==='rear'),front=s.units.filter(u=>ok(u)&&u.row==='front');
  return rear.flatMap(r=>front.map(f=>[r.uid,f.uid]));
}
function previewDamage(s,a,mana=0){return a.damage+(a.team==='player'?s.support.nextAttackBonus:0)+mana*G.CONFIG.manaDamagePerPoint;}
const resetBattle=s=>createBattleState(s.config.playerTeam,s.config.enemyTeam,s.config.supportIds); // recomeça com as mesmas equipes iniciais; montes, mãos, Daly Mães e eliminados voltam do zero
// Tabuleiro para a UI: por lado, os vivos de cada linha (ordenados pela posição). Eliminados não aparecem: ficam em s.eliminated.
function getBoard(s){
  const rows=(side,row)=>s.units.filter(u=>u.team===side&&u.row===row&&!isCharacterDefeated(u)).sort((a,b)=>a.slot-b.slot);
  return{player:{front:rows('player','front'),rear:rows('player','rear')},enemy:{front:rows('enemy','front'),rear:rows('enemy','rear')}};
}
Object.assign(G,{isCharacterDefeated,getUnit,canAct,isTargetable,canTransit,validateTeam,makeUnit,createBattleState,buildTurnOrder,resumeRecoveryOrder,getNextActor,enforceFrontLine,resolveFrontLine,performTransit,checkBattleResult,finishMatch,performBasicAttack,performSwap,getSwapPairs,previewDamage,dodgeInfo,resetBattle,getBoard});
})(globalThis.GOGHOS=globalThis.GOGHOS||{});
