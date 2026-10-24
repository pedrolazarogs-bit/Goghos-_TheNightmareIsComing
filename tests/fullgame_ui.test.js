// A renovação visual deve consultar o estado atual, inclusive durante decisões,
// sem comprar cartas, avançar a vez ou consumir dados ao reapresentar os painéis.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
['data/characters','data/gods','data/support_cards','data/reset_cards','core/battle','core/character_abilities','core/deck','core/support','core/roster','core/official_abilities','core/support_effects','core/divine','core/ai','ui/card','ui/support_ui','ui/hand_ui','ui/match_ui','ui/arena_ui','ui/visual_shell'].forEach(name=>require('../js/'+name+'.js'));
const G=GOGHOS;
let passed=0;const test=(name,run)=>{run();passed++;console.log('OK  '+name);};
const battle=(p=['mike','alex'],e=['john','stally'],rear=[])=>G.createBattleState({front:p,rear},{front:e,rear:[]},[],{rng:()=>.5,roll:()=>6});
function readOnly(s,render){
 const before=JSON.stringify(s),roll=s.roll,rng=s.rng,originals={};
 for(const name of ['getNextActor','onSpeedReset','drawCard','claimCharacter']){originals[name]=G[name];G[name]=()=>{throw Error('A apresentação não pode executar '+name);};}
 try{for(let n=0;n<4;n++)render();assert.equal(JSON.stringify(s),before);assert.equal(s.roll,roll);assert.equal(s.rng,rng);}finally{Object.assign(G,originals);}
}
const actions=html=>[...html.matchAll(/data-act="([^"]+)"/g)].map(m=>m[1]);

test('mão cheia e os componentes da arena podem ser redesenhados sem resolver a compra nem tocar na partida',()=>{
 const s=battle();for(let n=0;n<5;n++)G.drawCard(s,'player');G.onSpeedReset(s);assert(s.deck.pendingChoice);assert.equal(s.deck.hands.player.length,5);
 const actor=s.units.find(u=>u.id==='mike');
 readOnly(s,()=>{
  const html=G.handPanelHTML(s,s.deck.hands.player[0].iid,'');
  assert.equal((html.match(/data-hand=/g)||[]).length,5);assert.equal((html.match(/data-incoming=/g)||[]).length,1);assert(actions(html).includes('keep-new'));
  assert(!html.includes('data-hand="'+s.deck.pendingChoice.incoming.iid+'"'));
  G.characterPilesHTML(s);G.mainPileHTML(s);G.turnPanelHTML(s,actor);G.actorInfoHTML(s,actor);G.dalyHTML(s,'player');G.eliminatedHTML(s);
 });
});

test('a recuperação reapresenta somente as escolhas existentes e conserva a velocidade, o monte e os eliminados',()=>{
 const s=battle(['cavaleiro'],['sam','john']);G.eliminateUnit(s,s.units.find(u=>u.id==='cavaleiro'));const a=G.getNextActor(s);assert(G.performBasicAttack(s,a.uid,'daly_player').ok);assert(s.recovery);
 const options=G.recoveryOptions(s);
 readOnly(s,()=>{
  const html=G.recoveryHTML(s);assert.deepEqual(actions(html),options.map(o=>'recover-'+o.id));
  for(const o of options){const button=html.match(new RegExp('<button[^>]*data-act="recover-'+o.id+'"[^>]*>'))?.[0];assert(button,'opção de recuperação ausente');assert.equal(/\bdisabled\b/.test(button),!o.available);}
  G.eliminatedHTML(s);G.dalyHTML(s,'player');G.characterPilesHTML(s);
 });
});

test('a decisão de avanço mantém os mesmos alvos e os controles de ambas as alternativas sem mover Suportes',()=>{
 const s=battle(['mike'],['john'],['elysh','unicorn']);while(s.abilityChoices.length)G.AI.resolveCharacterAbility(s);G.eliminateUnit(s,s.units.find(u=>u.id==='mike'));assert(s.formation);assert.equal(s.formation.candidates.length,2);
 readOnly(s,()=>{
  assert.deepEqual(actions(G.formationHTML(s)),[...s.formation.candidates.map(uid=>'advance-'+uid),'advance-all']);
  G.handPanelHTML(s);G.dalyHTML(s,'player');G.turnPanelHTML(s,null);G.actorInfoHTML(s,null);
 });
});
test('os ícones novos de ações e decisões são locais, íntegros e escaláveis, sem conteúdo executável',()=>{
 const base=path.resolve(__dirname,'../assets/visual-v0.29'),manifest=JSON.parse(fs.readFileSync(path.join(base,'manifest.json'),'utf8'));
 assert.equal(manifest.schema,1);assert.equal(manifest.version,'0.29.0');assert.equal(manifest.files.length,10);
 assert.deepEqual(manifest.files.map(f=>f.path).sort(),['attack','pause','move','dice','heal','mana','history','hand','speed','shield'].map(name=>'icons/'+name+'.svg').sort());
 for(const f of manifest.files){const file=path.resolve(base,f.path);assert(file.startsWith(base+path.sep));const bytes=fs.readFileSync(file),source=bytes.toString('utf8');assert.equal(bytes.length,f.bytes,f.path);assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),f.sha256,f.path);assert.match(source,/<svg\b/);assert.match(source,/\bviewBox\s*=/);assert(!/<(?:script|foreignObject)\b|\bon[a-z]+\s*=/i.test(source));assert(!/(?:href|src)\s*=\s*["'](?:https?:|\/\/|data:)|url\(\s*["']?(?:https?:|\/\/)/i.test(source));}
});
console.log(`${passed} testes da interface completa passaram`);
