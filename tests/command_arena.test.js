// Progressive commands must not spend actions or alter the approved balance.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
['data/characters','data/gods','data/support_cards','data/reset_cards','core/battle','core/character_abilities','core/deck','core/support','core/roster','core/official_abilities','core/support_effects','core/divine','core/selection','core/ai','ui/card','ui/support_ui','ui/hand_ui','ui/match_ui','ui/arena_ui','ui/battle_feedback','ui/shop'].forEach(name=>require('../js/'+name+'.js'));
const G=GOGHOS;let html='',passed=0;const events={};
const app={set innerHTML(v){html=v},get innerHTML(){return html},addEventListener(name,handler){events[name]=handler},querySelector(){return null},querySelectorAll(){return[]}};
globalThis.document={getElementById:()=>app};
vm.runInThisContext(fs.readFileSync(require.resolve('../js/ui/ui.js'),'utf8').replace('G.PresentationFX?.init();','G.__commandUITest={ui,render};G.PresentationFX?.init();'));
const {ui,render}=G.__commandUITest;
const test=(name,fn)=>{fn();passed++;console.log('OK  '+name)};
function battle(front=['ddx','mike'],enemy=['john'],rear=[]){const s=G.createBattleState({front,rear},{front:enemy,rear:[]},[],{rng:()=>.5,roll:()=>6});s.abilityChoices=[];s.openingAbilities=false;s.phase='battle';return s;}
const unit=(s,id)=>s.units.find(u=>u.id===id);
function mount(s,a){s.order=[a.uid,...s.order.filter(uid=>uid!==a.uid)];s.acted={};Object.assign(ui,{mode:'battle',state:s,actor:a,target:null,healTarget:null,busy:false,paused:false,drawer:null,handIid:null,attackMode:'normal',commandTab:'attack',commandActor:null,fieldExpanded:false,inspectUid:null,msg:'',notice:'',move:false});render(a)}
function click(act,extra={}){const b={dataset:{act,...extra},disabled:false};events.click({target:{closest:selector=>selector==='[data-act]'?b:null}})}

test('focus cards preserve live stats and never advance the battle',()=>{
 const s=battle(),a=unit(s,'ddx'),t=unit(s,'john');a.hp=105;t.hp=45;const before=JSON.stringify(s);const markup=G.commandFocusHTML(s,a,t);
 assert.equal(JSON.stringify(s),before);assert(markup.includes('data-focus-unit="'+a.uid+'"'));assert(!markup.includes('data-unit='));assert(markup.includes('>105<'));assert(markup.includes('55×2'));assert(markup.includes('>45<'));assert.equal((markup.match(/command-vitals/g)||[]).length,2);
});
test('relationship labels identify the source of a hunt and protection',()=>{
 const s=battle(['draktar','z_zus'],['john']),a=unit(s,'draktar'),p=unit(s,'z_zus'),t=unit(s,'john');a.huntUid=t.uid;t.guardianUid=p.uid;const before=JSON.stringify(s),r=G.commandRelations(s,t);
 assert(r.some(x=>x.type==='hunt'&&x.text==='Caça de Draktar · dano ×3'));assert(r.some(x=>x.type==='guardian'&&x.text.includes(p.name)));assert.equal(JSON.stringify(s),before);
});
test('command categorization keeps support-independent status and movement controls accessible',()=>{
 const markup=G.commandActionsHTML('<button data-act="mode-double" disabled>Quatro</button><button data-act="attack">Atacar</button><button data-act="status-turn">Estado</button><button data-act="move">Mover</button>');
 assert(markup.includes('data-command-kind="ability" data-act="mode-double" disabled'));for(const a of ['attack','status-turn','move'])assert(markup.includes('data-command-kind="shared" data-act="'+a+'"'));
});
test('tabs expose three distinct choices and accessible keyboard targets',()=>{
 const tabs=G.commandTabsHTML('ability',5);assert.equal((tabs.match(/role="tab"/g)||[]).length,3);assert.equal((tabs.match(/tabindex="0"/g)||[]).length,1);assert(tabs.includes('command-tab-ability"'));assert(tabs.includes('aria-controls="command-action-panel"'));assert(tabs.includes('<b>5</b>'));
});
test('switching tabs never rolls dice, spends an action, changes the hand or resets the character',()=>{
 const s=battle(),a=unit(s,'ddx');mount(s,a);const before=JSON.stringify(s);click('command-tab-ability');assert.equal(ui.commandTab,'ability');render(a);assert.equal(ui.commandTab,'ability');click('command-tab-support');assert.equal(ui.commandTab,'support');assert.equal(JSON.stringify(s),before);assert(html.includes('data-command-tab="support"'));assert(html.includes('data-act="mode-double"'));ui.inspectUid=unit(s,'john').uid;click('command-ability-info',{abilityOwner:a.uid});assert.equal(ui.inspectUid,a.uid);assert.equal(ui.drawer,'card');assert.equal(ui.readerPage,1);assert.equal(JSON.stringify(s),before);
});
test('a new actor returns to attack, while a rear healer opens the appropriate ability panel',()=>{
 const s=battle(['ddx','mike'],['john'],['zuri']),a=unit(s,'ddx'),m=unit(s,'mike'),z=unit(s,'zuri');mount(s,a);click('command-tab-ability');ui.actor=m;render(m);assert.equal(ui.commandTab,'attack');m.hp=35;ui.actor=z;render(z);assert.equal(ui.commandTab,'ability');assert(/data-command-kind="ability"[^>]*data-act="full-heal"/.test(html));assert(!/<div class="battle-actions">[^]*data-act="attack"[^]*<\/div><p class="msg">/.test(html));
});
test('immobilized actor retains support tab, hand and a valid status-turn control',()=>{
 const s=battle(['mike'],['john']),a=unit(s,'mike');a.paralysis=2;G.drawCard(s,'player');mount(s,a);const before=JSON.stringify(s);click('command-tab-support');assert(html.includes('data-hand='));assert(html.includes('command-tab-support'));assert(/data-command-kind="shared"[^>]*data-act="status-turn"/.test(html));assert.equal(JSON.stringify(s),before);
});
test('Daly focus states the one-life hit rule rather than claiming its remaining life',()=>{
 const s=battle(),a=unit(s,'ddx'),markup=G.commandFocusHTML(s,a,null,{daly:true});assert(markup.includes('Daly Mãe exposta'));assert(markup.includes('Cada golpe retira 1 vida'));assert(!markup.includes('Daly Mãe · 1 vida'));
});
test('the action focus does not reveal any enemy hand card',()=>{
 const s=battle(),a=unit(s,'ddx');for(let i=0;i<5;i++)G.drawCard(s,'enemy');mount(s,a);for(const h of s.deck.hands.enemy)assert(!html.includes('data-hand="'+h.iid+'"'));assert(html.includes('data-act="piles-info"'));assert(html.includes('command-focus'));
});
test('field/focus switching changes only the view and completing movement returns to commands',()=>{
 const s=battle(['mike'],['john'],['elysh']),a=unit(s,'mike');mount(s,a);const before=JSON.stringify(s);click('command-view');assert.equal(ui.fieldExpanded,true);assert(html.includes('data-field-expanded="true"'));click('command-view');assert.equal(ui.fieldExpanded,false);click('move');assert.equal(ui.fieldExpanded,true);assert.equal(ui.move,true);click('command-view');assert.equal(ui.fieldExpanded,false);assert.equal(ui.move,false);assert.equal(JSON.stringify(s),before);
});
test('the compact score shows current Daly lives for both sides',()=>{
 const s=battle();s.daly.player.hp=1;s.daly.enemy.hp=2;const markup=G.commandScoreHTML(s);assert(markup.includes('Sua Daly Mãe: 1/3 vidas'));assert(markup.includes('Daly Mãe adversária: 2/3 vidas'));assert.equal((markup.match(/class="lost"/g)||[]).length,3);
});
delete G.__commandUITest;console.log(`${passed} testes da arena de comandos passaram`);
