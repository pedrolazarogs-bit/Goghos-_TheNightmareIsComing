const {chromium}=require('playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:900},reducedMotion:'reduce'});
  const failures=[];
  page.on('pageerror',e=>failures.push(String(e)));
  page.on('requestfailed',r=>failures.push(r.url()));
  await page.goto(process.env.ARENA_URL || 'http://127.0.0.1:8000/arena-batalha.html');
  await page.locator('[data-lineup=blue]').first().selectOption('1');
  await page.getByText('Iniciar batalha',{exact:true}).click();
  assert.match(await page.locator('#setup-error').textContent(),/diferentes/);
  await page.locator('[data-lineup=blue]').first().selectOption('0');
  await page.getByText('Iniciar batalha',{exact:true}).click();
  await page.locator('#control').selectOption('manual');
  assert.equal(await page.locator('.original-card').count(),8);
  await page.locator('[data-battle-card=red-0]').click();
  await page.locator('.tc-atk').click();
  await page.waitForFunction(()=>!GoghosBattle.snapshot().busy);
  assert.equal(await page.locator('[data-battle-card=red-0] svg text').first().textContent(),'75');
  await page.locator('#queue .last').click();
  assert.match(await page.locator('#dialog-title').textContent(),/Unicorn/);
  await page.keyboard.press('Escape');
  await page.locator('#control').selectOption('auto');
  await page.waitForFunction(()=>GoghosBattle.snapshot().cards.some(c=>c.team==='blue'&&c.hp===75));
  await page.locator('#pause').click();
  assert(await page.evaluate(()=>GoghosBattle.snapshot().paused));
  await page.locator('#pause').click();
  await page.locator('#control').selectOption('player');
  await page.screenshot({path:'/tmp/arena-original-056.png'});
  assert.deepEqual(failures,[]);
  console.log('PASS seleção, dois times, três controles, dano na arte, bot, fila, pausa e arquivos offline.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
