const assert=require('node:assert/strict');
const {chromium}=require('playwright');

(async()=>{
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
 try{
  const page=await browser.newPage({viewport:{width:1280,height:800}});
  const errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  page.on('console',msg=>{if(msg.type()==='warning'&&/combate|ataque/i.test(msg.text()))errors.push(msg.text());});
  const base=process.env.ARENA_URL||'http://127.0.0.1:8000/arena-batalha.html';
  // Arrange opponents and initiative only. Every action still goes through the arena.
  await page.route('**/js/penxy/battle.js',async route=>{
   const file=await route.fetch();
   await route.fulfill({response:file,body:(await file.text())+`
    const model=window.GoghosBattleLab;
    window.GoghosBattleLab={...model,start(s,now,choice){
     const opp=model.roster.indexOf(new URLSearchParams(location.search).get('rival'));
     const fillers=['DD-X','Elish','Mike','Sam','John','Stally','Rayyb','Barn'].map(n=>model.roster.indexOf(n)).filter(i=>i>=0&&i!==choice&&i!==opp);
     s.singlePlayer=false;
     const ok=model.start(s,now,{blue:[choice,...fillers.slice(0,3)],red:[opp,...fillers.slice(3,6)]});
     s.singlePlayer=true;s.playerId='blue-0';
     s.cards.forEach(c=>{c.controller=c.id===s.playerId?'player':'bot';if(c.slot!==0){c.speed=1;c.hp=c.maxHp=1200;}});
     s.order=[s.playerId,...s.cards.slice(4,5).filter(c=>c.speed!==null).map(c=>c.id),...s.order.filter(id=>id!==s.playerId&&id!=='red-0')];
     s.cursor=0;return ok;
    }};
   `});
  });
  async function start(name,rival){
   const url=new URL(base);url.searchParams.set('personagem',name);url.searchParams.set('rival',rival);
   await page.goto(url.href);
   await page.evaluate(()=>{
    window.moves=[];window.fireCues=[];window.contact=[];
    const animate=Element.prototype.animate;
    Element.prototype.animate=function(frames,timing){
     if(this.dataset.battleCard&&Array.isArray(frames)){
      if(timing.duration===420&&frames[1]?.offset===0.3&&frames[2]?.offset===0.5)contact.push(['approach',this.dataset.battleCard,performance.now()]);
      if(frames[0]?.filter==='brightness(1.9)')contact.push(['flinch',this.dataset.battleCard,performance.now()]);
     }
     return animate.call(this,frames,timing);
    };
    const ignite=Efeitos.queimar;
    Efeitos.queimar=Object.assign((el,opts)=>{
     fireCues.push({event:'ignite',time:performance.now(),turns:opts.turnos,card:el.closest('button')?.dataset.battleCard});
     return ignite(el,opts);
    },ignite);
    for(const key of ['laser','bolaDeFogo','jumpscare']){
     const effect=Efeitos[key];
     Efeitos[key]=(actor,target,opts)=>{
      if(key==='bolaDeFogo')fireCues.push({event:'launch',time:performance.now(),turns:opts.queimar,point:opts.ponto,aim:opts.mira});
      moves.push([key,actor.dataset.battleCard,target.dataset.battleCard,opts.nivel||opts.tipo||null]);
      return effect(actor,target,opts);
     };
    }
   });
   await page.getByRole('button',{name:'Iniciar batalha'}).click();
  }
  const attack=async(target='red-0')=>{
   await page.locator('[data-battle-card="'+target+'"]').click();await page.locator('.tc-atk').click();
   await page.waitForFunction(()=>!GoghosBattle.snapshot().busy);
  };
  const snapshot=()=>page.evaluate(()=>GoghosBattle.snapshot());
  await start('Petra','Sarck');
  await page.locator('[data-battle-card="blue-0"] .card-fx-art canvas').waitFor();
  await attack();
  assert((await page.evaluate(()=>moves)).some(m=>m[0]==='laser'&&m[3]===1));
  assert(!(await page.evaluate(()=>moves)).some(m=>m[0]==='jumpscare'));
  assert.equal((await snapshot()).cards[4].hp,0);
  await start('Unicorn','Sarck');await attack();
  assert((await page.evaluate(()=>moves)).some(m=>m[0]==='jumpscare'&&m[1]==='red-0'));
  assert.equal((await snapshot()).cards[0].hp,0);
  await start('Chama','Petra');await attack();
  assert.equal((await snapshot()).cards[4].status.find(e=>e.type==='burn').turns,6);
  assert.equal(await page.locator('[data-battle-card="red-0"] .card-fx-art svg text').textContent(),'6');
  await page.waitForFunction(()=>moves.some(m=>m[0]==='laser'&&m[1]==='red-0'));
  await page.waitForFunction(()=>!GoghosBattle.snapshot().busy);
  assert((await page.evaluate(()=>moves)).some(m=>m[0]==='bolaDeFogo'&&m[3]==='revide'));
  const cues=await page.evaluate(()=>fireCues);
  assert.deepEqual(cues.map(c=>[c.event,c.turns]),[['launch',6],['ignite',6],['launch',3],['ignite',3]]);
  for(const [start,end,travel] of [[cues[0],cues[1],720],[cues[2],cues[3],300]]){
   assert.deepEqual(start.point,{x:0.72,y:0.42});assert.deepEqual(start.aim,{x:0.5,y:0.42});
   assert(end.time-start.time>=travel-2,'A chama deve acender no impacto.');
   assert.equal(end.card,'red-0');
  }
  await start('Mike','Chama');await attack();
  const [approach,flinch]=await page.evaluate(()=>contact);
  assert.equal(approach[1],'blue-0');assert.equal(flinch[1],'red-0');
  assert(flinch[2]-approach[2]>=125);
  assert(await page.evaluate(()=>fireCues[0].time-contact[1][2]>=95));
  await start('Unicorn','Petra');await attack();
  assert.equal(await page.locator('[data-battle-card="red-0"] .printed-speed').textContent(),'4');
  assert.equal(await page.locator('[data-battle-card="red-0"] .printed-attack').textContent(),'190');
  await page.waitForFunction(()=>moves.some(m=>m[0]==='laser'&&m[3]===2));
  await page.screenshot({path:'/tmp/goghos-0614-petra.png'});
  await start('P.ULLYS','Barn');
  const before=(await snapshot()).cards.slice(4).map(c=>c.hp);
  await attack('red-1');
  const after=(await snapshot()).cards.slice(4).map(c=>c.hp);
  assert.deepEqual(before.map((hp,i)=>hp-after[i]),[50,300,50,0]);
  assert.deepEqual(errors,[]);
  console.log('PASS efeitos reais de Petra, Chama e Sarck, desgaste, revide, queimadura e sobrevivência.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
