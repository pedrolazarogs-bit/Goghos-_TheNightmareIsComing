'use strict';
const assert=require('node:assert/strict');
const {chromium}=require('playwright');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
 try{
 for(const viewport of [{width:1366,height:768},{width:390,height:844}]){
  const page=await browser.newPage({viewport});const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(process.env.TEST_URL||'http://127.0.0.1:8000');
  // The mandatory intro has a dedicated real-browser regression. Isolate the new flow here.
  await page.evaluate(()=>{document.querySelector('.duel-intro')?.remove();document.getElementById('app').inert=false;});
  await page.locator('[data-act="play"]').click();
  await page.waitForFunction(()=>GOGHOS.ArenaFive.getDebugState().phase==='ban');
  await page.locator('#draft-next').click();assert.equal(await page.locator('#grid>.cd:visible').count(),6);await page.locator('#draft-prev').click();
  for(const id of ['0','1'])await page.locator('#five-root #grid .cd[data-i="'+id+'"]').click();
  await page.locator('#five-root #ok:not(.off)').click();
  await page.waitForFunction(()=>GOGHOS.ArenaFive.getDebugState().draft?.ht===1,null,{timeout:60000});
  await page.locator('#five-root #grid .cd:not(.bn):not(.pk):visible').first().click();
  await page.locator('#five-root #ok:not(.off)').click();
  await page.waitForFunction(()=>GOGHOS.ArenaFive.getDebugState().phase==='rev',null,{timeout:60000});
  assert.equal(await page.locator('#five-root .chip').count(),0);
  assert(await page.locator('#five-root #sup').textContent().then(s=>s.includes('Somente habilidade própria')));
  await page.screenshot({path:'/tmp/draft-v038-'+viewport.width+'.png'});
  await page.locator('#five-root #rdy').click();
  await page.waitForFunction(()=>GOGHOS.ArenaFive.getDebugState().phase==='battle',null,{timeout:15000});
  assert.equal(await page.locator('#five-root .au').count(),10);
  await page.locator('#five-root #aauto').click();
  await page.waitForTimeout(6000);
  await page.locator('.five-pause').click();
  const before=await page.evaluate(()=>{const b=GOGHOS.ArenaFive.getDebugState().battle;return JSON.stringify([b.timeLeft,b.units.map(u=>u.hp),b.cycle]);});
  await page.waitForTimeout(1800);
  assert.equal(await page.evaluate(()=>{const b=GOGHOS.ArenaFive.getDebugState().battle;return JSON.stringify([b.timeLeft,b.units.map(u=>u.hp),b.cycle]);}),before,'Pause must freeze battle and round clock');
  await page.locator('.five-pause').click();
  await page.screenshot({path:'/tmp/arena-v038-'+viewport.width+'.png'});
  // Deterministic end-of-match boundary fixture: UI consumes the real round/time rules.
  const balance=await page.evaluate(()=>{
   const b=GOGHOS.ArenaFive.getDebugState().battle;b.o.WIN=1;b.timeLeft=0;b.units.filter(u=>u.team===1).forEach((u,i)=>{u.hp=i===0?1:0;u.alive=i===0;});
   return GOGHOS.Sanctuary.read().coins;
  });
  await page.waitForFunction(()=>GOGHOS.VictoryPresenter.getDebugState().ready,null,{timeout:60000});
  assert.equal(await page.evaluate(()=>GOGHOS.Sanctuary.read().coins),balance+50);
  await page.screenshot({path:'/tmp/victory-v038-'+viewport.width+'.png'});
  await page.locator('[data-victory="menu"]').click();
  await page.waitForFunction(()=>!GOGHOS.ArenaFive.getDebugState().active);
  await page.waitForTimeout(600);
  assert.equal(await page.locator('#five-root').count(),0);
  assert.equal(await page.evaluate(()=>document.getElementById('app').inert),false);
  assert.equal(await page.evaluate(()=>GOGHOS.Sanctuary.read().coins),balance+50);
  assert.deepEqual(errors,[]);
  // Restart/exit must be safe even while local bots are being assembled.
  await page.locator('[data-act="play"]').click();await page.evaluate(()=>GOGHOS.ArenaFive.close());
  await page.waitForTimeout(500);assert.equal(await page.locator('#five-root').count(),0);
  console.log('PASS 5x5 draft, bans, unique picks, own ability/class, battle, pause, victory reward and menu at '+viewport.width+'px');
  await page.close();
 }
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
