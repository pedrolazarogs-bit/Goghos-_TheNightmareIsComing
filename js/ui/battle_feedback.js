// Apresentação da batalha: consulta eventos e unidades sem alterar o motor.
(function(G){
const safe=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
G.escapeUI=safe;
G.unitBadges=(s,u)=>{
 if(G.isCharacterDefeated(u))return['Eliminado'];
 const b=[];
 if(u.oniActive)b.push('Oni · '+u.oniRemaining);
 if(u.pinnedBy)b.push('Cravado');if(u.pinning)b.push('Vulnerável');
 if(u.sleep)b.push('Dormindo');if(u.petrifiedBy)b.push('Petrificado');
 if(u.hypnotizedBy)b.push('Hipnotizado');if(u.hypnosisTarget)b.push('Hipnotizando');
 if(u.paralysis)b.push('Paralisia · '+u.paralysis);if(u.duelId)b.push('Duelo');
 if(u.silenceRemaining)b.push('Silenciado · '+u.silenceRemaining);
 if(u.revivedNoAbility)b.push('Sem habilidade');if(u.invulnerable)b.push('Invencível');
 if(u.guardianUid)b.push('Protegido');
 if(s.units.some(k=>k.friendUid===u.uid&&!G.isCharacterDefeated(k)))b.push('Amizade');if(u.shield)b.push('Escudo · '+u.shield);
 if(u.starFrom)b.push('Estrela');if(u.enduranceArmed)b.push('Fôlego');
 if(s.units.some(a=>a.bookTarget===u.uid&&!G.isCharacterDefeated(a)))b.push('Marcado');
 if(u.comboKill)b.push('Combokill');return b;
};
G.compactImpacts=e=>{
 const groups=[];
 for(const h of G.eventImpacts(e)){
  const category=h.type==='heal'?'heal':h.instant?'execution':['hit','defeat'].includes(h.type)?'damage':h.type;
  const key=[h.targetUid,h.sourceUid||h.actorUid||h.actorName,h.kind||'',category].join('|');
  let g=groups.find(x=>x.key===key);
  if(!g){g={...h,key,count:0,total:0,loss:0,healed:0,hits:[]};groups.push(g);}
  g.count++;g.total+=h.amount??h.damage??0;g.loss+=h.damage||0;g.healed+=h.healed||0;
  g.afterHp=h.afterHp;g.hits.push(h);if(h.type==='defeat')g.type='defeat';
 }
 return groups;
};
G.impactText=h=>h.type==='heal'?'+'+(h.healed||0):h.instant?'ELIMINADO':h.type==='daly-hit'?'−1 VIDA':({parry:'DEFENDEU',dodge:'ESQUIVOU',miss:'ERROU','duel-miss':'DUELO PERDIDO',immune:h.ability==='Presence'?'IGNOROU':'INVENCÍVEL',oni:'ONI'})[h.type]||'−'+(h.total??h.amount??h.damage??0);
G.feedbackDuration=e=>Math.max(G.CONFIG.pacing.feedback*(G.eventImpacts(e).length>1?2:1),e?.sequence?G.eventImpacts(e).length*G.CONFIG.pacing.feedback*.4:0);
G.eventTitle=e=>{
 if(!e)return 'A batalha vai começar';
 const titles={summon:'Invocação primordial',support:'Apoio · '+e.ability,ability:e.ability||'Habilidade',fright:'Susto de entrada',heal:(e.actorName||'Personagem')+' curou','pin-keep':'Machado mantido','pin-skip':'Ação impedida','status-skip':'Ação impedida',wait:'Vez passada','full-heal':'Cura total','daly-hit':'Daly Mãe atingida'};
 return titles[e.type]||e.ability||((e.actorName||'Personagem')+' atacou');
};
G.eventBrief=e=>{
 if(!e)return '✦ Escolha sua equipe. Proteja sua Daly Mãe.';
 const hits=G.compactImpacts(e),first=hits[0];if(!first)return G.eventTitle(e);
 const main=(e.actorName||first.actorName)+' → '+first.targetName+' · '+(e.sequence?e.sequence.resolved+' golpe'+(e.sequence.resolved===1?'':'s')+' · ':'')+G.impactText(first);
 const reaction=hits.find(h=>h.kind==='reaction');
 return main+(first.type==='defeat'&&!first.instant?' · eliminado':'')+(reaction?' · Revide: '+reaction.targetName+' '+G.impactText(reaction):hits.length>1?' · +'+(hits.length-1)+' efeito'+(hits.length===2?'':'s'):'');
};
G.eventFeedbackHTML=(s,busy=false)=>{
 const e=s.lastEvent;if(!e)return '<div class="combat-message idle"><span class="moment-icon">✦</span><strong>Acompanhe a batalha</strong><p>Os resultados aparecem aqui.</p></div>';
 // Sequências mostram cada golpe e seu revide na ordem em que aconteceram.
 const rows=(e.sequence?G.eventImpacts(e):G.compactImpacts(e)).map(g=>`<div class="impact-message ${g.kind==='reaction'?'reaction-message':''} ${g.type}"><span><b>${safe(g.targetName)}</b><small>${g.strike?'Golpe '+g.strike+'/'+g.strikeCount:g.kind==='reaction'?'Revide de '+safe(g.sourceName||g.actorName)+(g.afterStrike?' após golpe '+g.afterStrike:''):g.kind==='pin-damage'?'Machado':g.kind==='burn-damage'?'Queimadura':g.count>1?g.count+' impactos':safe(g.protectedName?'Protege '+g.protectedName:'')}${g.beforeHp!==undefined?' · '+g.beforeHp+' → '+g.afterHp:''}${g.type==='defeat'?' · Eliminado':''}</small></span><strong>${G.impactText(g)}</strong></div>`).join('');
 const dice=e.rolls?.length?e.rolls.map(r=>`<i class="die ${r.repeated?'repeat':''}" title="${r.repeated?'Repetido: combo encerrado':'Resultado do dado'}">${r.roll}</i>`).join(''):e.critical?.roll?`<i class="die">${e.critical.roll}</i><span>${e.critical.critical?'Crítico +25%':'Sem crítico'}</span>`:e.type==='fright'?e.results.map(r=>`<i class="die ${r.scared?'success':''}" title="${safe(r.name)}: ${r.scared?'assustado':'resistiu'}">${r.roll}</i>`).join(''):'';
 const note=e.sequence?e.sequence.resolved+' de '+e.sequence.planned+' golpes · defesa e reação por golpe':e.type==='summon'?'3 fragmentos consumidos · Presence e MAX':e.type==='fright'?'+'+e.bonus+' ataque'+(e.speedBonus?' · +1 velocidade':''):e.type==='ability'?'Alvo: '+e.targetName:!rows?s.log.at(-1)||'Ação concluída':'';
 return `<div class="combat-message ${busy?'playing':''}" role="status"><small class="moment-eyebrow">${busy?'Acontecendo agora':'Última ação'}</small><h4>${safe(G.eventTitle(e))}</h4>${dice?'<div class="dice-row">'+dice+'</div>':''}${note?'<p>'+safe(note)+'</p>':''}${rows}</div>`;
};
G.actionPrompt=(s,a,o={})=>{
 if(o.busy)return 'Confira o resultado. A próxima vez já vem.';
 if(o.paused)return 'Batalha pausada.';
 if(s.deck.pendingChoice)return 'Escolha qual carta sai da mão.';
 if(s.recovery)return 'Escolha como recuperar sua equipe.';
 if(s.formation)return 'Escolha quem avança para a frente.';
 if(s.abilityChoices.length)return 'Resolva a habilidade de entrada.';
 if(s.support.pending)return 'Brisa: toque em um aliado ferido.';
 if(o.hand){if(a?.team==='enemy')return 'Use esta carta na vez da sua equipe.';const c=G.getResetCard(o.hand.id);if(c.type==='PRIMORDIAL')return 'Fragmentos '+G.fragmentCount(s,'player')+'/3 · reúna os três para invocar.';if(c.type==='DALY')return 'Resgate o personagem do topo do monte.';const d=G.getSupportCard(c.id);return !d?'Confira a carta na sua mão.':d.target==='none'?'Use '+d.name+' pela mão.':d.target==='deadAlly'?'Escolha um aliado eliminado.':'Escolha o alvo do Apoio na mão ou no campo.';}
 if(!a)return 'Use suas cartas ou avance o ciclo.';
 if(a.team==='enemy')return a.name+' está preparando a jogada…';
 if(a.pinnedBy)return 'Cravado: passe esta vez.';
 if(a.pinning)return 'Mantenha ou solte o machado.';
 if(G.isActionLocked(a))return a.sleep?'Role o dado para tentar acordar.':'Impedido: passe esta vez. Suas cartas continuam disponíveis.';
 if(o.move)return 'Toque em um Suporte para mudar de linha.';
 if(G.canHealFromRear(a))return G.healingTargets(s,a).length?(o.target?'Confirme a cura no aliado.':'Retaguarda: escolha um aliado ferido para curar.'):'Aliados com Vida cheia: passe esta vez ou mova um Suporte.';
 if(o.mode==='heal')return o.target?'Confirme a cura no aliado.':'Toque em um aliado ferido.';
 if(o.mode==='break')return o.target?'Confirme para libertar o aliado.':'Toque no aliado petrificado.';
 if(o.target==='daly_enemy')return 'Daly Mãe exposta: este ataque retira 1 vida.';
 const type=G.getMainAbility(a)?.trigger;
 if(type==='hypnosis'&&a.hypnosisTarget)return 'Mantenha a hipnose para causar 90 ou troque o alvo.';
 if(type==='deathBook')return 'Use o livro contra o nome marcado.';
 if(type==='areaAttack'||type==='swarm'&&o.mode==='area')return (type==='swarm'?'Swarm':'3000W')+' · '+G.previewDamage(s,a,o.mana||0,null,o.mode)+' por alvo na frente.';
 const t=G.getUnit(s,o.target);
 if(!t)return 'Toque em um oponente para escolher o alvo.';
 if(type==='punchCombo')return 'Combo: até 6 socos de '+a.damage+'. Dado repetido encerra. Cada soco tem sua própria defesa, esquiva e reação.';
 if(G.baseAttackCount(a)>1){
  const p=G.previewAttackSequence(s,a,o.mana||0,t,o.mode),same=p.hits.every(h=>h.raw===p.hits[0].raw),reply=G.reactionPreview(a,t,p.hits[0].damage);
  return p.count+' golpes em sequência'+(same?' de '+p.hits[0].raw:': '+p.hits.map(h=>h.raw).join(' + '))+'. Cada golpe tem sua própria defesa e reação.'+(reply?' Revide após o primeiro: '+(reply.instant?'elimina seu atacante.':reply.damage+' de dano.'):'');
 }
 const damage=G.previewDamage(s,a,o.mana||0,t,o.mode),reply=G.reactionPreview(a,t,damage);
 return damage+' de dano previsto.'+(reply?' Revide: '+(reply.instant?'elimina seu atacante.':reply.damage+' de dano.'):!G.isReactionBlocked(t)&&(G.parryInfo(a,t)||G.dodgeInfo(a,t))?' O alvo pode defender ou esquivar.':'');
};
})(globalThis.GOGHOS);
