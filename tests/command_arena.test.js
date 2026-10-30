// The existing table is the only battle surface; optional controls stay in its action row.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
['data/characters','data/gods','data/support_cards','data/reset_cards','core/battle','core/character_abilities','core/deck','core/support','core/roster','core/official_abilities','core/support_effects','core/divine','core/selection','core/ai','ui/card','ui/support_ui','ui/hand_ui','ui/match_ui','ui/arena_ui','ui/battle_feedback','ui/shop'].forEach(name=>require('../js/'+name+'.js'));
const G=GOGHOS;let html='',passed=0;const events={};
const app={set innerHTML(v){html=v},get innerHTML(){return html},addEventListener(name,handler){events[name]=handler},querySelector(){return null},querySelectorAll(){return[]}};
globalThis.document={getElementById:()=>app};
vm.runInThisContext(fs.readFileSync(require.resolve('../js/ui/ui.js'),'utf8').replace('G.PresentationFX?.init();','G.__arenaUITest={ui,render};G.PresentationFX?.init();'));
const {ui,render}=G.__arenaUITest,test=(name,fn)=>{fn();passed++;console.log('OK  '+name)};
function battle(front=['ddx','mike'],enemy=['john'],rear=[]){const s=G.createBattleState({front,rear},{front:enemy,rear:[]},[],{rng:()=>.5,roll:()=>6});s.abilityChoices=[];s.openingAbilities=false;return s}
const unit=(s,id)=>s.units.find(u=>u.id===id);
function mount(s,a){s.order=[a.uid,...s.order.filter(uid=>uid!==a.uid)];s.acted={};Object.assign(ui,{mode:'battle',state:s,actor:a,target:null,healTarget:null,busy:false,paused:false,drawer:null,handIid:null,attackMode:'normal',abilityOptions:false,abilityActor:null,inspectUid:null,msg:'',notice:'',move:false});render(a)}
function click(act,extra={}){const b={dataset:{act,...extra},disabled:false};events.click({target:{closest:selector=>selector==='[data-act]'?b:null}})}

test('a arena conserva as formações e laterais originais sem painel novo, vistas ou cartas duplicadas',()=>{
 const s=battle(['ddx','mike'],['john'],['zuri']),a=unit(s,'ddx');mount(s,a);
 for(const cls of ['arena-left','battle-board','arena-right','turn-guide','mao'])assert(html.includes('class="'+cls));
 for(const token of ['command-stage','command-focus','command-tabs','data-field-expanded','command-view','command-deck'])assert(!html.includes(token),token);
 assert.equal((html.match(/class="formation-row /g)||[]).length,4);
 for(const u of s.units){assert.equal((html.match(new RegExp('data-unit="'+u.uid+'"','g'))||[]).length,1);assert.equal((html.match(new RegExp('data-id="'+u.uid+'"','g'))||[]).length,1)}
});
test('a estrela do personagem mostra opções na linha de ações existente sem consumir a vez',()=>{
 const s=battle(),a=unit(s,'ddx');mount(s,a);const before=JSON.stringify(s);
 assert(html.includes('data-act="unit-ability" data-unit-ability="'+a.uid+'"'));assert.equal(ui.abilityOptions,false);
 const next=G.getNextActor;G.getNextActor=()=>{throw Error('A estrela não pode avançar a hierarquia')};try{click('unit-ability',{unitAbility:a.uid})}finally{G.getNextActor=next}assert.equal(ui.abilityOptions,true);assert(html.includes('data-ability-options="true"'));assert(html.includes('data-ability-option="true" class=" mode-button" data-act="mode-double"'));assert.equal(JSON.stringify(s),before);
 ui.attackMode='double';ui.target=unit(s,'john').uid;click('unit-ability',{unitAbility:a.uid});assert.equal(ui.abilityOptions,false);assert.equal(ui.attackMode,'double');assert.equal(ui.target,unit(s,'john').uid);assert.equal(JSON.stringify(s),before);
});
test('a ação principal, passar e mover não são escondidos junto das opções da habilidade',()=>{
 const html=G.arenaActionsHTML('<button data-act="mode-double">Quatro</button><button data-act="attack">Atacar</button><button data-act="status-turn">Estado</button><button data-act="move">Mover</button>');
 assert(html.includes('data-ability-option="true" data-act="mode-double"'));for(const act of ['attack','status-turn','move'])assert(html.includes('<button data-act="'+act+'"'));
});
test('um personagem com habilidade inerente abre sua própria ficha ao tocar na estrela',()=>{
 const s=battle(['sam'],['john']),a=unit(s,'sam');mount(s,a);const before=JSON.stringify(s);assert.equal(ui.hasAbilityOptions,false);
 click('unit-ability',{unitAbility:a.uid});assert.equal(ui.drawer,'card');assert.equal(ui.readerPage,1);assert.equal(ui.inspectUid,a.uid);assert.equal(JSON.stringify(s),before);
});
test('trocar o personagem fecha opções anteriores e preserva a cura necessária da retaguarda',()=>{
 const s=battle(['ddx','mike'],['john'],['elysh']),d=unit(s,'ddx'),m=unit(s,'mike'),e=unit(s,'elysh');mount(s,d);click('unit-ability',{unitAbility:d.uid});assert(ui.abilityOptions);
 ui.actor=m;render(m);assert.equal(ui.abilityOptions,false);m.hp=35;ui.actor=e;render(e);assert.equal(ui.abilityOptions,true);assert.equal(ui.attackMode,'heal');assert(html.includes('data-act="attack"'));
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
test('nenhum identificador de carta da mão adversária é exposto na arena',()=>{
 const s=battle(),a=unit(s,'ddx');for(let i=0;i<5;i++)G.drawCard(s,'enemy');mount(s,a);for(const h of s.deck.hands.enemy)assert(!html.includes('data-hand="'+h.iid+'"'));assert(html.includes('class="rarity-piles"'));
});
delete G.__arenaUITest;console.log(`${passed} testes da arena original com interações locais passaram`);
