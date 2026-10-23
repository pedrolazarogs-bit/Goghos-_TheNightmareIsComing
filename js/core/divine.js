// Invocação e tributos compartilhados. Nenhuma compra ou ação extra é criada pela invocação.
(function(G){
const alive=u=>u&&!G.isCharacterDefeated(u),fail=error=>({ok:false,error});
G.isPresence=u=>G.isGod(u)&&G.getMainAbility(u)?.trigger==='presence';
G.attackBaseDamage=(a,t)=>Math.max(0,a.damage-(G.isPresence(t)?(a.starFrom?50:0)+(a.frightBonus||0)+(a.oniActive?30:0):0));
G.criticalDamage=(s,a,raw)=>{
 if(!G.CONFIG.classTributes||!G.hasClass(a,'DESTROYER'))return{damage:G.roundUpToFive(raw),critical:false};
 const roll=G.rollDie(s,{side:a.team,best:1,reason:'Crítico de Destroyer'}),critical=roll<=2,damage=G.roundUpToFive(raw*(critical?1.25:1));
 s.log.push(a.name+' · crítico · d6='+roll+(critical?' · +25% de dano':' · ataque normal'));return{damage,critical,roll};
};
G.fragmentCount=(s,side)=>s.deck.hands[side].filter(c=>G.getResetCard(c.id)?.type==='PRIMORDIAL').length;
G.summonBlockReason=(s,side)=>{
 if(s.result)return 'Batalha encerrada.';
 if(!G.CONFIG.allowSummon)return 'Invocação indisponível nesta partida histórica.';
 if(!s.divineReserve?.some(c=>c.id==='zenneriam'))return 'Zeenneriam já foi invocado nesta partida.';
 if(G.fragmentCount(s,side)!==3)return 'Reúna os três Fragmentos Primordiais na sua mão.';
 const b=G.getBoard(s)[side];if(b.front.length>=G.frontLimit(s,side)&&b.rear.length>=2)return 'Libere uma vaga na formação para invocar Zeenneriam.';
 return '';
};
G.canSummonFromHand=(s,side)=>!G.summonBlockReason(s,side);
G.performSummon=(s,side='player')=>{
 const why=G.summonBlockReason(s,side);if(why)return fail(why);
 if(!G.canUseHand(s,side))return fail('Invoque na vez da sua equipe, após resolver as escolhas pendentes.');
 const inst=s.divineReserve.find(c=>c.id==='zenneriam'),u=G.addCharacterToTeam(s,side,inst);if(!u)return fail('Não há vaga na formação.');
 s.divineReserve.splice(s.divineReserve.indexOf(inst),1);
 const hand=s.deck.hands[side],used=hand.filter(c=>G.getResetCard(c.id).type==='PRIMORDIAL');
 for(const c of used){hand.splice(hand.indexOf(c),1);s.deck.discard.push({...c,side,reason:'primordial-summon'});}
 s.log.push('INVOCAÇÃO · '+u.name+' · três Fragmentos Primordiais consumidos · Presence · MAX');
 G.recordBattleEvent(s,{type:'summon',actorUid:u.uid,actorName:u.name,ability:'Invocação primordial',hits:[],fragments:used.map(c=>c.iid)});
 return{ok:true,obtained:u.uid,showFeedback:true};
};
G.createDivineTestState=()=>{
 const s=G.createBattleState({front:['ddx','mike'],rear:[]},{front:['cavaleiro','sam','trucc'],rear:[]});
 for(let n=0;n<3;n++){const i=s.deck.pile.findIndex(c=>G.getResetCard(c.id).type==='PRIMORDIAL');s.deck.hands.player.push(s.deck.pile.splice(i,1)[0]);}
 s.log.push('Teste da invocação · reúna os três fragmentos da mão e confirme a invocação');return s;
};
G.hasIdleHandResources=(s,side)=>s.deck.hands[side].some(c=>c.id==='morto_vivo')&&G.supportTargets(s,side,G.getSupportCard('morto_vivo')).some(t=>{const c=G.getCharacterById(t.id);if(!c.damage||c.passiveOnly||c.abilityOnly)return false;const b=G.getBoard(s)[side];return b.front.length<G.frontLimit(s,side)||G.canTransit(t)&&b.rear.length<2;});
G.resolveIdleAI=(s,side)=>{
 if(!G.isIdleBattle(s)||!G.canUseHand(s,side))return null;
 if(G.canSummonFromHand(s,side))return G.performSummon(s,side);
 if(!G.hasIdleHandResources(s,side))return null;
 const c=s.deck.hands[side].find(c=>c.id==='morto_vivo'),t=G.supportTargets(s,side,G.getSupportCard('morto_vivo')).find(u=>G.getCharacterById(u.id).damage>0&&!G.handSupportBlockReason(s,side,c,u.uid));
 return c&&t&&!G.handSupportBlockReason(s,side,c,t.uid)?G.performHandSupport(s,c.iid,t.uid,side):null;
};
const oldStatus=G.officialStatus;
G.officialStatus=(s,u)=>[oldStatus(s,u),G.isGod(u)?'MAX':'',G.isPresence(u)?'Presence · ignora habilidades de personagens':''].filter(Boolean).join(' · ');
const oldTargets=G.abilityTargets;
G.abilityTargets=(s,a,type)=>oldTargets(s,a,type).filter(t=>!G.isPresence(t));
const oldHealing=G.healingTargets;
G.healingTargets=(s,a)=>oldHealing(s,a).filter(t=>!G.isPresence(t));
const oldAttackTargets=G.attackTargets;
G.attackTargets=(s,a)=>G.isPresence(a)?s.units.filter(t=>alive(t)&&t.team!==a.team&&(t.row==='front'||t.duelId)):oldAttackTargets(s,a);
const oldCanAttack=G.canAttackCharacter;
G.canAttackCharacter=(s,a,t)=>G.isPresence(a)||oldCanAttack(s,a,t);
const oldDamage=G.dealCharacterDamage;
G.dealCharacterDamage=(s,source,t,raw,options={})=>{
 const blocked=G.isPresence(t)&&source&&source.uid!==t.uid&&(options.area||options.followup||['book','reaction','burn-damage','pin-damage'].includes(options.kind)||['Duelo','Hipnose','Execução da petrificação'].includes(options.ability));
 if(blocked){s.log.push('Presence · '+t.name+' ignorou '+(options.ability||'a habilidade'));return{type:'immune',actorUid:source.uid,actorName:source.name,targetUid:t.uid,targetName:t.name,targetTeam:t.team,targetRow:t.row,targetSlot:t.slot,beforeHp:t.hp,afterHp:t.hp,damage:0,amount:0,ability:'Presence',instant:false};}
 return oldDamage(s,source,t,raw,{...options,ignoreMainAbilities:G.isPresence(source)});
};
const oldRefresh=G.refreshAbilityAvailability;
G.refreshAbilityAvailability=s=>{
 oldRefresh(s);
 for(const u of s.units.filter(t=>alive(t)&&G.isPresence(t))){
  if(u.pinnedBy||u.pinning)G.releasePinLink(s,u);if(u.duelId)G.releaseDimension(s,u);
  if(u.hypnotizedBy){const a=G.getUnit(s,u.hypnotizedBy);if(a)G.releaseHypnosis(s,a);}
  u.petrifiedBy=null;u.sleep=false;u.paralysis=0;
  if(s.burns)s.burns=s.burns.filter(b=>b.targetUid!==u.uid);
 }
};
})(globalThis.GOGHOS);
