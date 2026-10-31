// The interface reads the approved balance changes without executing a turn.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
['data/characters','data/gods','data/support_cards','data/reset_cards','core/battle','core/character_abilities','core/deck','core/support','core/roster','core/official_abilities','core/support_effects','core/divine','core/selection','core/ai','ui/card','ui/support_ui','ui/hand_ui','ui/match_ui','ui/arena_ui','ui/battle_feedback','ui/shop'].forEach(name=>require('../js/'+name+'.js'));
const G=GOGHOS;
let html='',passed=0;
const app={set innerHTML(value){html=value;},get innerHTML(){return html;},addEventListener(){},querySelector(){return null;},querySelectorAll(){return[];}};
globalThis.document={getElementById:()=>app};
vm.runInThisContext(fs.readFileSync(require.resolve('../js/ui/ui.js'),'utf8').replace('G.PresentationFX?.init();','G.__balanceUITest={ui,render};G.PresentationFX?.init();'));
const test=(name,fn)=>{fn();passed++;console.log('OK  '+name);};
const unit=(s,id)=>s.units.find(u=>u.id===id);
function battle(p=['mike'],e=['john'],rear=[]){const s=G.createBattleState({front:p,rear},{front:e,rear:[]},[],{rng:()=>.5,roll:()=>6});s.abilityChoices=[];s.openingAbilities=false;s.phase='battle';return s;}
function render(s,actor,target=null){Object.assign(G.__balanceUITest.ui,{state:s,actor,target,abilityActor:actor.uid,mode:'battle',busy:false,paused:false,drawer:null,handIid:null,attackMode:'normal',abilityTarget:null,move:false,msg:'',notice:''});s.order=[actor.uid,...s.order.filter(uid=>uid!==actor.uid)];s.acted={};const before=JSON.stringify(s);G.__balanceUITest.render(actor);assert.equal(JSON.stringify(s),before,'redesenhar não deve avançar ações ou alterar a partida');return html.match(/<div class="battle-actions">([\s\S]*?)<\/div><p class="msg">/)?.[1]||'';}

test('cartas mostram DD-X55×2, Fonior320 e ataque inicial55 de Chama sem o antigo ×6',()=>{
 for(const [id,field,value]of [['ddx','damage','55×2'],['fonior','hp','320'],['chama','damage','55']]){const c=G.getCharacterById(id),card=G.cardHTML(c);assert.match(card,new RegExp('data-value="'+field+'"[^>]*>'+value+'<'));if(id==='chama')assert(!/55×6/.test(card));}
});
test('a ficha de Linx deriva os35% da habilidade ativa',()=>{
 const s=battle(['linx']),a=unit(s,'linx'),before=JSON.stringify(s),info=G.actorInfoHTML(s,a);assert(info.includes('<b>35%</b>'));assert(!info.includes('<b>30%</b>'));assert.equal(JSON.stringify(s),before);
});
test('Zuri na retaguarda oferece cura única, passar e mover, sem ataque básico ou modos ofensivos',()=>{
 const s=battle(['mike'],['john'],['zuri']),a=unit(s,'zuri');unit(s,'mike').hp=35;
 const controls=render(s,a),acts=[...controls.matchAll(/data-act="([^"]+)"/g)].map(x=>x[1]);assert.deepEqual(acts,['ability','wait','move']);assert(!/data-act="ability"[^>]* disabled/.test(controls));assert(html.includes('Retaguarda: cura total dos outros aliados'));assert(!/data-daly="enemy"(?! disabled)/.test(html));
});
test('com aliados cheios Zuri ainda pode passar ou mover sem habilitar uma cura inútil',()=>{
 const s=battle(['mike'],['john'],['zuri']),controls=render(s,unit(s,'zuri'));assert(/data-act="ability"[^>]* disabled/.test(controls));assert(controls.includes('data-act="wait"'));assert(controls.includes('data-act="move"'));assert(html.includes('Aliados com Vida cheia'));
});
test('um impedimento na retaguarda mostra a resolução do estado, sem permitir cura',()=>{
 const s=battle(['mike'],['john'],['zuri']),a=unit(s,'zuri');a.sleep=true;unit(s,'mike').hp=35;const controls=render(s,a);assert(controls.includes('data-act="status-turn"'));assert(!controls.includes('data-act="full-heal"'));assert(!controls.includes('data-act="attack"'));
});
test('Rayvilin diferencia ataque normal na vez da petrificação e execução após a espera',()=>{
 const s=battle(['rayvilin'],['cavaleiro']),a=unit(s,'rayvilin'),t=unit(s,'cavaleiro');a.actionsTaken=0;t.petrifiedBy=a.uid;t.petrifiedAtActionCount=0;
 let controls=render(s,a,t.uid);assert(!controls.includes('Executar petrificado'));assert(html.includes('execução só fica disponível na próxima vez'));assert(!G.actionPrompt(s,a,{target:t.uid}).includes('confirme para executar'));
 a.actionsTaken=1;controls=render(s,a,t.uid);assert(controls.includes('Executar petrificado'));assert(html.includes('Petrificação pronta: confirme para executar'));
});
test('escolhas explicam estrela+1velocidade e a janela de libertar o petrificado',()=>{
 const s=battle(['unicorn'],['john']),a=unit(s,'unicorn');s.abilityChoices=[{type:'starGift',actorUid:a.uid,side:'player',reason:'entry'}];assert(G.characterAbilityChoiceHTML(s).includes('+1 de velocidade'));assert(!G.characterAbilityChoiceHTML(s).includes('+2 de velocidade'));
 const r=battle(['rayvilin'],['cavaleiro']),v=unit(r,'rayvilin');r.abilityChoices=[{type:'petrify',actorUid:v.uid,side:'player',reason:'turn'}];assert(G.characterAbilityChoiceHTML(r).includes('execução fica disponível somente na próxima vez'));
});
test('a ficha distingue o teto natural de5/6 e a esquiva especial de Trucc',()=>{
 const s=battle(['penxy','trucc'],['john']);assert(G.actorInfoHTML(s,unit(s,'penxy')).includes('até 1–5 no d6 · 6 permite o acerto'));const special=G.actorInfoHTML(s,unit(s,'trucc'));assert(special.includes('Esquiva especial: acerta com 1–1'));assert(!special.includes('até 1–5 no d6'));
});
delete G.__balanceUITest;
console.log(`${passed} testes de apresentação do balanceamento v0.32 passaram`);
