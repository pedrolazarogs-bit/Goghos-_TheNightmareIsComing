// The existing table is the only battle surface; optional controls stay in its action row.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
['data/characters','data/gods','data/support_cards','data/reset_cards','core/battle','core/character_abilities','core/deck','core/support','core/roster','core/official_abilities','core/support_effects','core/divine','core/selection','core/ai','ui/card','ui/support_ui','ui/hand_ui','ui/match_ui','ui/arena_ui','ui/battle_feedback','ui/shop'].forEach(name=>require('../js/'+name+'.js'));
const G=GOGHOS;let html='',passed=0;const events={};
const app={set innerHTML(v){html=v},get innerHTML(){return html},addEventListener(name,handler){events[name]=handler},querySelector(){return null},querySelectorAll(){return[]}};
globalThis.document={getElementById:()=>app};
vm.runInThisContext(fs.readFileSync(require.resolve('../js/ui/ui.js'),'utf8').replace('G.PresentationFX?.init();','G.__arenaUITest={ui,render};G.PresentationFX?.init();'));
const {ui,render}=G.__arenaUITest,test=(name,fn)=>{fn();passed++;console.log('OK  '+name)};
function battle(front=['ddx','mike'],enemy=['john'],rear=[],enemyRear=[]){const s=G.createBattleState({front,rear},{front:enemy,rear:enemyRear},[],{rng:()=>.5,roll:()=>6});s.abilityChoices=[];s.openingAbilities=false;return s}
const unit=(s,id)=>s.units.find(u=>u.id===id);
function mount(s,a){clearTimeout(ui.timer);s.order=[a.uid,...s.order.filter(uid=>uid!==a.uid)];s.acted={};Object.assign(ui,{mode:'battle',state:s,actor:a,target:null,healTarget:null,busy:false,paused:false,drawer:null,handIid:null,attackMode:'normal',abilityOptions:false,abilityActor:null,inspectUid:null,msg:'',notice:'',move:false,swapPick:null});render(a)}
function click(act,extra={}){const b={dataset:{act,...extra},disabled:false};events.click({target:{closest:selector=>selector==='[data-act]'?b:null}})}

test('a arena conserva as formações e laterais originais sem painel novo, vistas ou cartas duplicadas',()=>{
 const s=battle(['ddx','mike'],['john'],['zuri']),a=unit(s,'ddx');mount(s,a);
 for(const cls of ['arena-left','battle-board','arena-right','turn-guide','mao'])assert(html.includes('class="'+cls));
 for(const token of ['command-stage','command-focus','command-tabs','data-field-expanded','command-view','command-deck'])assert(!html.includes(token),token);
 assert.equal((html.match(/class="formation-row /g)||[]).length,4);
 for(const u of s.units){assert.equal((html.match(new RegExp('data-unit="'+u.uid+'"','g'))||[]).length,1);assert.equal((html.match(new RegExp('data-id="'+u.uid+'"','g'))||[]).length,1)}
});
test('a estrela arma a habilidade diretamente, preserva o alvo válido e não gasta a vez',()=>{
 const s=battle(),a=unit(s,'ddx'),t=unit(s,'john');mount(s,a);ui.target=t.uid;render(a);const before=JSON.stringify(s);
 assert(html.includes('data-act="unit-ability" data-unit-ability="'+a.uid+'"'));assert.equal(ui.abilityOptions,false);
 const next=G.getNextActor;G.getNextActor=()=>{throw Error('A estrela não pode avançar a hierarquia')};
 try{click('unit-ability',{unitAbility:a.uid})}finally{G.getNextActor=next}
 assert.equal(ui.attackMode,'double');assert.equal(ui.target,t.uid);assert.equal(ui.abilityOptions,false);
 assert(html.includes('data-act="ability"'));assert(!html.includes('data-act="mode-double"'));
 assert(html.includes('title="Quatro braços"'));assert.equal(JSON.stringify(s),before);
 click('unit-ability',{unitAbility:a.uid});assert.equal(ui.attackMode,'normal');assert.equal(ui.target,t.uid);assert.equal(JSON.stringify(s),before);
});
test('a ação principal, passar e mover não são escondidos junto das opções da habilidade',()=>{
 const html=G.arenaActionsHTML('<button data-act="mode-double">Quatro</button><button data-act="attack">Atacar</button><button data-act="status-turn">Estado</button><button data-act="move">Mover</button>');
 assert(html.includes('data-ability-option="true" data-act="mode-double"'));for(const act of ['attack','status-turn','move'])assert(html.includes('<button data-act="'+act+'"'));
});
test('um personagem com habilidade inerente abre sua própria ficha ao tocar na estrela',()=>{
 const s=battle(['sam'],['john']),a=unit(s,'sam');mount(s,a);const before=JSON.stringify(s);assert.equal(ui.hasAbilityOptions,false);
 click('unit-ability',{unitAbility:a.uid});assert.equal(ui.drawer,'card');assert.equal(ui.readerPage,1);assert.equal(ui.inspectUid,a.uid);assert.equal(JSON.stringify(s),before);
});
test('trocar o personagem limpa o modo anterior e preserva a cura necessária da retaguarda',()=>{
 const s=battle(['ddx','mike'],['john'],['elysh']),d=unit(s,'ddx'),m=unit(s,'mike'),e=unit(s,'elysh');mount(s,d);click('unit-ability',{unitAbility:d.uid});assert.equal(ui.attackMode,'double');
 ui.actor=m;render(m);assert.equal(ui.abilityOptions,false);assert.equal(ui.attackMode,'normal');
 m.hp=35;ui.actor=e;render(e);assert.equal(ui.attackMode,'heal');assert(html.includes('data-act="attack"'));
});
test('o Apoio permanece no leque durante impedimentos e a resolução do estado continua acessível',()=>{
 const s=battle(['mike'],['john']),a=unit(s,'mike');a.paralysis=2;G.drawCard(s,'player');mount(s,a);const before=JSON.stringify(s);
 assert(html.includes('data-hand='));assert(html.includes('data-act="status-turn"'));assert(!html.includes('data-act="attack"'));assert.equal(JSON.stringify(s),before);
});
test('os vínculos identificam a origem real sem repetir estados genéricos ou alterar a partida',()=>{
 const s=battle(['draktar','z_zus'],['john']),a=unit(s,'draktar'),p=unit(s,'z_zus'),t=unit(s,'john');a.huntUid=t.uid;t.guardianUid=p.uid;const before=JSON.stringify(s),r=G.unitRelations(s,t);
 assert(r.some(x=>x.type==='hunt'&&x.text==='Caça de Draktar'));assert(r.some(x=>x.type==='guardian'&&x.text.includes(p.name)));assert.equal(JSON.stringify(s),before);
 const info=G.actorInfoHTML(s,t);assert(info.includes('actor-relation'));assert(info.includes('Caça de Draktar'));assert.equal(JSON.stringify(s),before);
});
test('redesenhar a arena e consultar habilidades não avança ações, compra cartas nem rola dados',()=>{
 const s=battle(),a=unit(s,'ddx');mount(s,a);const before=JSON.stringify(s);for(let i=0;i<4;i++){render(a);G.unitRelations(s,a);G.unitPowerButtonHTML(a)}assert.equal(JSON.stringify(s),before);assert.equal(ui.abilityOptions,false);
});
test('consultar um monte físico abre a leitura existente sem comprar nem avançar a hierarquia',()=>{
 const s=battle(),a=unit(s,'ddx');mount(s,a);const before=JSON.stringify(s);
 assert.equal((G.characterPilesHTML(s).match(/data-act="piles-info"/g)||[]).length,G.RARITIES.length);
 assert(G.mainPileHTML(s).includes('data-act="piles-info"'));
 click('piles-info');assert.equal(ui.drawer,'piles');assert.equal(ui.readerPage,0);assert.equal(JSON.stringify(s),before);
});
function clickUnit(uid){const c={dataset:{id:uid}};events.click({target:{closest:selector=>selector==='.card'?c:null}})}
function confirmHeal(s,a,t,expected){
 assert.equal(ui.target,t.uid);assert.equal(ui.attackMode,'heal');assert.equal(ui.move,false);
 assert(html.includes('data-act="attack"'));
 assert(!/<button[^>]*data-act="attack"[^>]* disabled/.test(html));
 click('attack');clearTimeout(ui.timer);assert.equal(t.hp,expected);assert.equal(s.lastEvent.type,'heal');assert.equal(s.acted[a.uid],true);
}
test('Elysh seleciona a cura ao tocar no aliado ferido da frente e só cura após confirmar',()=>{
 const s=battle(['elysh','mike'],['john']),a=unit(s,'elysh'),t=unit(s,'mike');t.hp=35;mount(s,a);G.getNextActor(s);const before=JSON.stringify(s);
 clickUnit(t.uid);assert.equal(ui.drawer,null);assert.equal(JSON.stringify(s),before);assert(html.includes('title="Curar"'));
 confirmHeal(s,a,t,115);
});
test('Elysh cura da retaguarda sem oferecer um seletor de cura redundante ou ataque inimigo',()=>{
 const s=battle(['mike'],['john'],['elysh']),a=unit(s,'elysh'),t=unit(s,'mike');t.hp=35;mount(s,a);
 assert.equal(ui.attackMode,'heal');assert(!html.includes('data-act="mode-heal"'));assert(!html.includes('data-act="mode-normal"'));
 clickUnit(t.uid);confirmHeal(s,a,t,115);
});
test('a estrela de cura encerra Mover e limpa a seleção de troca antes de escolher o aliado',()=>{
 const s=battle(['elysh','mike'],['john']),a=unit(s,'elysh'),t=unit(s,'mike');t.hp=35;mount(s,a);
 click('move');ui.swapPick=a.uid;assert(ui.move);click('unit-ability',{unitAbility:a.uid});
 assert.equal(ui.move,false);assert.equal(ui.swapPick,null);assert(html.includes('title="Curar"'));
 clickUnit(t.uid);confirmHeal(s,a,t,115);
});
test('o atalho de cura libera o alvo de um Apoio selecionado sem usar ou descartar a carta da mão',()=>{
 const s=battle(['elysh','mike'],['john']),a=unit(s,'elysh'),t=unit(s,'mike');t.hp=35;
 const hand={iid:'cura-ui-apoio',id:'bandeide'};s.deck.hands.player=[hand];mount(s,a);ui.handIid=hand.iid;ui.healTarget=t.uid;
 click('ability');assert.equal(ui.handIid,null);assert.equal(ui.healTarget,null);
 clickUnit(t.uid);confirmHeal(s,a,t,115);assert.deepEqual(s.deck.hands.player,[hand]);
});
test('a estrela de Elysh na retaguarda mantém a cura e o alvo selecionado, respeitando a Vida máxima',()=>{
 const s=battle(['mike'],['john'],['elysh']),a=unit(s,'elysh'),t=unit(s,'mike');t.hp=100;mount(s,a);
 clickUnit(t.uid);click('unit-ability',{unitAbility:a.uid});assert.equal(ui.target,t.uid);assert.equal(ui.attackMode,'heal');
 confirmHeal(s,a,t,130);assert.equal(s.lastEvent.healed,30);
});
test('a cura direta de Elysh também alcança um aliado ferido da retaguarda',()=>{
 const s=battle(['elysh'],['john'],['zuri']),a=unit(s,'elysh'),t=unit(s,'zuri');t.hp=900;mount(s,a);
 clickUnit(t.uid);confirmHeal(s,a,t,980);assert.equal(t.row,'rear');
});
test('a seleção direta não oferece cura à própria Elysh, a aliados cheios ou em outra dimensão',()=>{
 for(const kind of ['self','full','dimension']){
  const s=battle(['elysh','mike'],['john']),a=unit(s,'elysh'),t=unit(s,'mike');a.hp=100;t.hp=35;if(kind==='full')t.hp=t.maxHp;if(kind==='dimension')t.duelId='outro-mundo';mount(s,a);
  clickUnit(kind==='self'?a.uid:t.uid);assert.equal(ui.target,null);assert.equal(ui.attackMode,'normal');
 }
});
test('o atalho de habilidade e a estrela mantêm a mesma seleção e limpam Mover e Apoio',()=>{
 const s=battle(),a=unit(s,'ddx'),t=unit(s,'john');s.deck.hands.player=[{iid:'apoio-intacto',id:'bandeide'}];mount(s,a);G.getNextActor(s);
 ui.target=t.uid;ui.handIid='apoio-intacto';ui.healTarget=a.uid;ui.move=true;ui.swapPick=a.uid;const before=JSON.stringify(s);
 click('ability');assert.equal(ui.attackMode,'double');assert.equal(ui.target,t.uid);assert.equal(ui.handIid,null);assert.equal(ui.healTarget,null);assert.equal(ui.move,false);assert.equal(ui.swapPick,null);assert.equal(JSON.stringify(s),before);
 click('ability');assert.equal(ui.attackMode,'normal');assert.equal(ui.target,t.uid);assert.equal(JSON.stringify(s),before);
});
test('DD-X confirma quatro golpes separados pelo mesmo botão principal do ataque',()=>{
 const s=battle(['ddx'],['john']),a=unit(s,'ddx'),t=unit(s,'john');mount(s,a);clickUnit(t.uid);const hp=t.hp;
 click('unit-ability',{unitAbility:a.uid});assert.equal(t.hp,hp);assert.equal(a.doubleUsed,false);assert.equal(ui.target,t.uid);
 click('attack');clearTimeout(ui.timer);assert.equal(a.doubleUsed,true);assert.equal(s.lastEvent.sequence.planned,4);assert.equal(s.lastEvent.hits.length,4);assert.equal(s.acted[a.uid],true);
});
test('John e Stally preparam seus golpes especiais sem rolar dados antes da confirmação',()=>{
 for(const [id,mode] of [['john','pin'],['stally','stun']]){
  const s=battle([id],['cavaleiro']),a=unit(s,id),t=unit(s,'cavaleiro');mount(s,a);G.getNextActor(s);let rolls=0;s.roll=()=>{rolls++;return 1};clickUnit(t.uid);const before=JSON.stringify(s);
  click('unit-ability',{unitAbility:a.uid});assert.equal(ui.attackMode,mode);assert.equal(ui.target,t.uid);assert.equal(rolls,0);assert.equal(JSON.stringify(s),before);
  click('attack');clearTimeout(ui.timer);assert(t.hp<t.maxHp);assert.equal(s.acted[a.uid],true);
  if(mode==='pin')assert.equal(a.pinning,t.uid);else assert(t.paralysis>0);
 }
});
test('Swarm em área não pede alvo individual e atinge somente adversários da frente',()=>{
 const s=battle(['alex','mike'],['john','cavaleiro']),a=unit(s,'alex'),m=unit(s,'mike');mount(s,a);const hp=m.hp;
 clickUnit(unit(s,'john').uid);click('unit-ability',{unitAbility:a.uid});assert.equal(ui.attackMode,'area');assert.equal(ui.target,null);assert(!/<button[^>]*data-act="attack"[^>]* disabled/.test(html));
 click('attack');clearTimeout(ui.timer);assert.equal(s.lastEvent.type,'area');assert.equal(s.lastEvent.hits.length,2);assert.equal(m.hp,hp);assert.equal(s.acted[a.uid],true);
});
test('Zuri prepara a cura total sem curar imediatamente e a confirmação gasta uma ação',()=>{
 const s=battle(['mike'],['john'],['zuri']),a=unit(s,'zuri'),t=unit(s,'mike');t.hp=35;a.hp=500;mount(s,a);G.getNextActor(s);const before=JSON.stringify(s);
 click('unit-ability',{unitAbility:a.uid});assert.equal(ui.attackMode,'full-heal');assert.equal(t.hp,35);assert.equal(a.fullHealUsed,false);assert.equal(JSON.stringify(s),before);assert(!/<button[^>]*data-act="attack"[^>]* disabled/.test(html));
 click('attack');clearTimeout(ui.timer);assert.equal(t.hp,t.maxHp);assert.equal(a.hp,500);assert.equal(a.fullHealUsed,true);assert.equal(s.acted[a.uid],true);
});
test('pó mágico seleciona o oponente no campo sem abrir outro painel ou gastar a ação',()=>{
 const s=battle(['rayyb'],['john'],[],['elysh']),a=unit(s,'rayyb'),t=unit(s,'elysh');mount(s,a);G.getNextActor(s);const before=JSON.stringify(s);
 click('unit-ability',{unitAbility:a.uid});assert.equal(ui.attackMode,'power-sleepPowder');assert.equal(s.abilityChoices.length,0);assert(!html.includes('class="choice-overlay"'));assert(!html.includes('class="inspect-backdrop"'));assert.equal(JSON.stringify(s),before);
 clickUnit(t.uid);assert.equal(ui.target,t.uid);assert.equal(ui.drawer,null);assert.equal(JSON.stringify(s),before);
 assert.equal(t.row,'rear');click('attack');clearTimeout(ui.timer);assert.equal(t.sleep,true);assert.equal(a.sleepUsed,true);assert.equal(s.acted[a.uid],undefined);assert.equal(s.abilityChoices.length,0);assert.equal(G.getNextActor(s).uid,a.uid);
});
test('a tentativa de petrificar respeita raridade e não libera a execução na mesma vez',()=>{
 const s=battle(['rayvilin'],['john']),a=unit(s,'rayvilin'),t=unit(s,'john'),higher=G.addCharacterToTeam(s,'enemy',{iid:'teste-deus',id:'zenneriam'});s.roll=()=>1;mount(s,a);G.getNextActor(s);const before=JSON.stringify(s);
 click('unit-ability',{unitAbility:a.uid});assert.equal(ui.attackMode,'power-petrify');assert.equal(JSON.stringify(s),before);
 clickUnit(higher.uid);assert.equal(ui.target,null);assert.equal(higher.petrifiedBy,null);assert.equal(s.abilityChoices.length,0);
 clickUnit(t.uid);assert.equal(ui.target,t.uid);click('attack');clearTimeout(ui.timer);assert.equal(t.petrifiedBy,a.uid);assert.equal(s.acted[a.uid],undefined);assert.equal(s.abilityChoices.length,0);assert.equal(G.canExecutePetrified(s,a,t),false);assert.equal(G.getNextActor(s).uid,a.uid);
});
test('trocar a hipnose não causa os 90 até Burn confirmar Manter na mesma vez',()=>{
 const s=battle(['barn'],['john','cavaleiro']),a=unit(s,'barn'),old=unit(s,'john'),t=unit(s,'cavaleiro');a.hypnosisTarget=old.uid;old.hypnotizedBy=a.uid;mount(s,a);G.getNextActor(s);const before=JSON.stringify(s),hp=t.hp;
 click('unit-ability',{unitAbility:a.uid});assert.equal(ui.attackMode,'power-hypnosis');assert.equal(JSON.stringify(s),before);assert(!html.includes('class="choice-overlay"'));
 clickUnit(t.uid);click('attack');clearTimeout(ui.timer);assert.equal(a.hypnosisTarget,t.uid);assert.equal(old.hypnotizedBy,null);assert.equal(t.hypnotizedBy,a.uid);assert.equal(t.hp,hp);assert.equal(s.acted[a.uid],undefined);assert.equal(G.getNextActor(s).uid,a.uid);
 ui.busy=false;ui.attackMode='normal';render(a);click('hypnosis-keep');clearTimeout(ui.timer);assert(t.hp<hp);assert.equal(s.acted[a.uid],true);
});
test('habilidades já usadas ficam indisponíveis e a estrela não consome outra vez',()=>{
 for(const [id,flag] of [['ddx','doubleUsed'],['rayyb','sleepUsed'],['zuri','fullHealUsed']]){
  const s=battle([id,'mike'],['john']),a=unit(s,id);a[flag]=true;unit(s,'mike').hp=35;mount(s,a);const before=JSON.stringify(s);
  assert(/<button[^>]*data-act="ability"[^>]* disabled/.test(html));click('unit-ability',{unitAbility:a.uid});assert.equal(ui.attackMode,'normal');assert.equal(JSON.stringify(s),before);assert(ui.msg.length>0);
 }
});
test('ativar uma habilidade descarta um alvo que não é permitido pelo novo modo',()=>{
 const s=battle(['elysh','mike'],['john']),a=unit(s,'elysh'),t=unit(s,'mike');t.hp=35;mount(s,a);clickUnit(unit(s,'john').uid);assert(ui.target);
 click('unit-ability',{unitAbility:a.uid});assert.equal(ui.attackMode,'heal');assert.equal(ui.target,null);assert(/<button[^>]*data-act="attack"[^>]* disabled/.test(html));
});
test('a estrela fora da própria vez ou sob impedimento apenas consulta a ficha',()=>{
 for(const kind of ['enemy','paused','locked']){
  const s=battle(['ddx'],['john']),a=unit(s,'ddx'),owner=kind==='enemy'?unit(s,'john'):a;mount(s,a);
  if(kind==='paused')ui.paused=true;if(kind==='locked')a.paralysis=2;render(a);const before=JSON.stringify(s);
  click('unit-ability',{unitAbility:owner.uid});assert.equal(ui.drawer,'card');assert.equal(ui.inspectUid,owner.uid);assert.equal(ui.attackMode,'normal');assert.equal(JSON.stringify(s),before);
 }
});
test('o novo atalho preserva as escolhas obrigatórias de entrada e nunca as resolve sozinho',()=>{
 const s=G.createBattleState({front:['penxy'],rear:[]},{front:['john'],rear:[]},[],{rng:()=>.5,roll:()=>6}),a=unit(s,'penxy');mount(s,a);const before=JSON.stringify(s);
 assert(html.includes('class="choice-overlay"'));assert(html.includes('data-act="resolve-entry"'));assert(!html.includes('data-act="ability"'));
 click('unit-ability',{unitAbility:a.uid});assert.equal(ui.drawer,'card');assert.equal(JSON.stringify(s),before);assert.equal(s.abilityChoices[0].type,'dimension');
});
test('libertar um aliado fica acessível e permite voltar ao ataque mesmo com a habilidade já usada',()=>{
 const s=battle(['ddx','mike'],['rayvilin']),a=unit(s,'ddx'),t=unit(s,'mike');a.doubleUsed=true;t.petrifiedBy=unit(s,'rayvilin').uid;mount(s,a);G.getNextActor(s);const before=JSON.stringify(s);
 assert(html.includes('<button class=" mode-button" data-act="mode-break"'));assert(!html.includes('data-ability-option="true" class=" mode-button" data-act="mode-break"'));
 click('mode-break');assert.equal(ui.attackMode,'break');assert(!/<button[^>]*data-act="ability"[^>]* disabled/.test(html));
 click('ability');assert.equal(ui.attackMode,'normal');assert.equal(JSON.stringify(s),before);
});
test('um personagem com habilidade passiva também pode cancelar Libertar pelo botão visível',()=>{
 const s=battle(['mike','alex'],['rayvilin']),a=unit(s,'mike'),t=unit(s,'alex');t.petrifiedBy=unit(s,'rayvilin').uid;mount(s,a);G.getNextActor(s);const before=JSON.stringify(s);
 click('mode-break');assert.equal(ui.attackMode,'break');assert(!html.includes('data-act="ability"'));
 assert(html.includes('<button class=" mode-button" data-act="mode-normal"'));assert(!html.includes('data-ability-option="true" class=" mode-button" data-act="mode-normal"'));
 click('mode-normal');assert.equal(ui.attackMode,'normal');assert.equal(JSON.stringify(s),before);
});
test('nenhum identificador de carta da mão adversária é exposto na arena',()=>{
 const s=battle(),a=unit(s,'ddx');for(let i=0;i<5;i++)G.drawCard(s,'enemy');mount(s,a);for(const h of s.deck.hands.enemy)assert(!html.includes('data-hand="'+h.iid+'"'));assert(html.includes('class="rarity-piles"'));
});
delete G.__arenaUITest;console.log(`${passed} testes da arena original com interações locais passaram`);
