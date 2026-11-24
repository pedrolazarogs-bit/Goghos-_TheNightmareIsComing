const {chromium}=require('playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:900},reducedMotion:'reduce'});
  const failures=[];
  page.on('pageerror',e=>failures.push(String(e)));
  page.on('requestfailed',r=>{
   // Restarting the series or navigating away cancels the current music stream.
   if(r.resourceType()==='media'&&r.failure()?.errorText==='net::ERR_ABORTED')return;
   failures.push(r.url()+' '+r.failure()?.errorText);
  });
  await page.clock.install();
  await page.addInitScript(()=>{Math.random=()=>.01;});
  await page.goto(process.env.ARENA_URL || 'http://127.0.0.1:8000/arena-batalha.html');
  await page.clock.pauseAt(new Date(Date.now()+1000));
  assert.equal(await page.locator('#turn-time').count(),0);
  await page.locator('#owned-character').selectOption('3');
  await page.getByText('Iniciar batalha',{exact:true}).click();
  const snapshot=()=>page.evaluate(()=>GoghosBattle.snapshot());
  async function checkTurnTimer(){
   const state=await snapshot(),timer=page.locator('#turn-time');
   assert.equal(await timer.count(),1);
   assert.equal(await timer.evaluate(el=>el.parentElement.dataset.battleCard),state.order[state.cursor]);
   const above=await timer.evaluate(el=>{
    const t=el.getBoundingClientRect(),c=el.parentElement.getBoundingClientRect();
    return t.bottom<=c.top&&Math.abs(t.left+t.width/2-c.left-c.width/2)<1&&t.top>=0;
   });
   assert(above,'O contador deve ficar centralizado acima da carta da vez');
  }
  await checkTurnTimer();
  assert.equal(await page.locator('#turn-time').textContent(),'25 s');
  assert.equal(await page.locator('[data-controller=player]').count(),1);
  assert.equal(await page.locator('[data-controller=bot]').count(),7);
  assert.equal(await page.locator('#owned-name').textContent(),'Nully');
  assert.equal(await page.locator('.original-card').count(),8);
  await page.locator('[data-battle-card=red-2]').click();
  await page.locator('.tc-atk').click();
  await page.clock.runFor(700);
  assert.equal(await page.locator('[data-battle-card=red-2] svg text').first().textContent(),'615');
  await page.locator('#queue .last').click();
  assert.match(await page.locator('#inspector h2').textContent(),/Nully/);
  assert.equal(await page.locator('dialog[open],.tc-pop').count(),0);
  await page.locator('[data-slot=ability]').focus();
  await page.keyboard.press('Enter');
  assert.match(await page.locator('#arena-tip').innerText(),/Habilidade/);
  await page.keyboard.press('Escape');
  assert.equal(await page.locator('#arena-tip').isVisible(),false);
  await page.locator('summary').click();await page.locator('#history').click();
  assert.equal(await page.locator('dialog:modal').count(),0);
  assert((await page.locator('dialog[open]').boundingBox()).width<=300);
  await page.keyboard.press('Escape');
  assert.equal(await page.evaluate(()=>document.activeElement.tagName),'SUMMARY');
  await page.locator('summary').click();await page.locator('#help').click();
  await page.locator('[data-battle-card=blue-1]').click();
  assert.equal(await page.locator('dialog[open],.tc-pop').count(),0);
  await page.keyboard.press('Escape');
  assert.equal(await page.locator('#control').count(),0);
  assert.equal(await page.locator('.card-health').count(),8);
  assert.equal(await page.locator('[data-battle-card=red-2] .card-health text').textContent(),'615');
  const nextActor=(await snapshot()).order[(await snapshot()).cursor];
  assert((await snapshot()).cards.find(c=>c.id===nextActor).controller==='bot');
  await checkTurnTimer();
  await page.locator('[data-battle-card=red-2]').click();
  assert.equal(await page.locator('.tc-atk').count(),0);
  await page.clock.runFor(7200);
  assert((await snapshot()).events.some(e=>e.type==='ataque'&&e.index>2));
  await page.locator('summary').click();await page.locator('#pause').click();
  assert(await page.evaluate(()=>GoghosBattle.snapshot().paused));
  await page.locator('summary').click();await page.locator('#pause').click();
  assert.equal(await page.locator('#owned-name').textContent(),'Nully');
  const legible=await page.locator('[data-controller=player] .card-health').evaluate(el=>{
   const a=el.getBoundingClientRect();
   return [...document.querySelectorAll('#support-hand button')].every(slot=>{
    const b=slot.getBoundingClientRect();return a.bottom<=b.top||b.right<=a.left||b.left>=a.right;
   });
  });
  assert(legible,'Apoios não devem cobrir a vida do jogador');
  await page.addInitScript(()=>{Math.random=()=>1000/4294967296;});
  await page.reload();await page.locator('#owned-character').selectOption({label:'Zeneerian'});
  await page.getByText('Iniciar batalha',{exact:true}).click();
  await page.clock.runFor(24000);
  assert.equal((await snapshot()).turnNumber,1);
  assert.match(await page.locator('#turn-time.urgent').textContent(),/^[12] s$/);
  await page.clock.runFor(1200);
  assert.equal((await snapshot()).turnNumber,2);
  await checkTurnTimer();
  assert.equal(await page.locator('#turn-time.urgent').count(),0);
  assert.equal((await snapshot()).events.filter(e=>e.type==='tempo').length,1);
  for(let i=0;i<12&&!(await snapshot()).completedCycles;i++)await page.clock.runFor(3200);
  assert.equal((await snapshot()).completedCycles,1);
  for(let i=0;i<12;i++){const s=await snapshot();if(s.order[s.cursor]===s.playerId&&!s.busy)break;await page.clock.runFor(800);}
  const turn=(await snapshot()).turnNumber;
  {const s=await snapshot();assert.equal(s.order[s.cursor],s.playerId,JSON.stringify({cards:s.cards.map(c=>[c.id,c.name,c.hp]),events:s.events.slice(0,14)}));}
  await page.locator('#support-hand button').first().click();
  await page.getByRole('button',{name:'Usar em Zeneerian'}).click();
  assert.equal((await snapshot()).turnNumber,turn);
  assert.equal((await snapshot()).supports.blue[0].status,'armed');
  await page.locator('#team-red button:not(.dead)').first().click();await page.locator('.tc-atk').click();
  await page.clock.runFor(500);
  assert.equal((await snapshot()).last,'blue-0');
  await page.reload();await page.locator('#owned-character').selectOption({label:'Draktar'});
  await page.getByText('Iniciar batalha',{exact:true}).click();
  await page.locator('[data-slot=ability]').click();
  await page.getByRole('button',{name:'Caçar Fomor',exact:true}).click();
  assert.equal((await snapshot()).cards[0].link,'red-1');
  assert.equal(await page.locator('[data-battle-card=red-0] .original-card > image').count(),0);
  assert.match(await page.locator('[data-battle-card=red-0] .original-card').textContent(),/Zédia/);
  await page.reload();await page.locator('#owned-character').selectOption({label:'P.ULLYS'});
  await page.getByText('Iniciar batalha',{exact:true}).click();
  assert.equal((await snapshot()).order[(await snapshot()).cursor],'red-3');
  await page.clock.runFor(4200);
  assert.equal((await snapshot()).last,'red-3');
  assert.equal((await snapshot()).cards[0].hp,0);
  await page.screenshot({path:'/tmp/arena-original-060.png'});
  assert.deepEqual(failures,[]);
  console.log('PASS seleção, dois times, um jogador e sete bots, dano na arte, bot, fila, pausa e arquivos offline.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
