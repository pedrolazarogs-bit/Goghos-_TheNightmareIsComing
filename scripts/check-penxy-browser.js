const {chromium}=require('playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:900}}),errors=[];
  page.on('pageerror',e=>errors.push(String(e)));page.on('requestfailed',r=>errors.push(r.url()));page.on('response',r=>{if(r.status()>=400)errors.push(r.url());});
  await page.goto(process.env.ARENA_URL||'http://127.0.0.1:8000/arena-batalha.html');
  await page.locator('#owned-character').selectOption({label:'Penxy'});
  await page.getByRole('button',{name:'Iniciar batalha'}).click();
  const ability=page.locator('[data-slot=ability]');
  const ready=()=>page.waitForFunction(()=>!GoghosBattle.snapshot().busy);
  assert.equal(await page.locator('#portrait img').getAttribute('src'),'assets/arena/penxy.webp');
  assert.equal(await page.locator('#support-free').textContent(),'3/3');
  assert.equal(await page.locator('#support-hand button').count(),3);
  assert.equal(await page.locator('[data-controller=player] .card-health text').textContent(),'500');
  async function enter(){await ability.click();await page.locator('#dialog-actions button').first().click();await ready();assert.equal(await page.evaluate(()=>GoghosBattle.snapshot().haunt.target),'red-0');}
  await page.locator('[data-battle-card=red-0]').click();
  assert.match(await page.locator('#card-info').innerText(),/Unicorn/);
  await page.locator('.tc-ability').click();await ready();assert.equal(await page.evaluate(()=>GoghosBattle.snapshot().haunt.target),'red-0');
  await ability.click();await ready();assert.equal(await page.evaluate(()=>GoghosBattle.snapshot().haunt),null);
  await enter();await page.locator('[data-battle-card=red-1]').click();assert.equal(await page.locator('.tc-atk').count(),0);
  await page.locator('[data-battle-card=red-0]').click();await page.locator('.tc-atk').click();await ready();
  const s=await page.evaluate(()=>GoghosBattle.snapshot());assert.equal(s.haunt,null);assert.equal(s.cards.find(c=>c.id==='red-0').hp,0);assert.equal(s.last,s.playerId);
  assert(!await page.locator('[data-battle-card=red-0]').isVisible());
  const offset=await page.locator('#team-red').evaluate(row=>{
   const boxes=[...row.querySelectorAll('button:not(.dead)')].map(el=>el.getBoundingClientRect());
   const r=row.getBoundingClientRect();return Math.abs((boxes[0].left+boxes.at(-1).right-r.left-r.right)/2);
  });
  assert(offset<2,'Equipe recentralizada: '+offset);
  await page.screenshot({path:'/tmp/060-penxy.png'});
  await page.locator('summary').click();await page.locator('#pause').click();
  assert.equal(await page.locator('#inspector h2').textContent(),'Penxy');
  await page.locator('summary').click();await page.locator('#restart').click();await page.getByRole('button',{name:'Reiniciar',exact:true}).last().click();
  await page.locator('#owned-character').selectOption({label:'Nully'});await page.getByRole('button',{name:'Iniciar batalha'}).click();
  await page.locator('[data-battle-card=red-0]').click();await page.locator('.tc-atk').click();await ready();
  assert.equal(await page.locator('[data-battle-card=red-0] .card-health text').textContent(),'75');
  const touch=await browser.newPage({isMobile:true,hasTouch:true,viewport:{width:390,height:844}});
  await touch.goto(process.env.ARENA_URL||'http://127.0.0.1:8000/arena-batalha.html');await touch.locator('[data-lineup=blue]').first().waitFor();assert(touch.url().includes('arena-toque.html'));
  assert.deepEqual(errors,[]);console.log('PASS Penxy e Nully com efeitos ativos, seleção de alvo, entrada e saída da mente, eliminação, reinício e arena de toque.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
