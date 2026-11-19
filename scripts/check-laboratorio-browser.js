const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox']});try{
for(const mobile of [false,true]){
const page=await browser.newPage({viewport:mobile?{width:390,height:844}:{width:1440,height:1000},hasTouch:mobile,acceptDownloads:true}),errors=[];page.on('pageerror',e=>errors.push(String(e)));
await page.goto(process.env.LAB_URL||'http://127.0.0.1:8000/laboratorio.html');
assert.equal(await page.locator('.card').count(),3);assert(await page.locator('#damage').isDisabled());
if(mobile)await page.locator('[data-card="0"]').tap();else await page.locator('[data-card="0"]').click();await page.waitForTimeout(300);assert.equal(await page.locator('[data-card="0"]').getAttribute('aria-pressed'),'true');
await page.locator('#damage').click();assert((await page.locator('#selection').innerText()).includes('75'));
await page.locator('#amount').fill('100');await page.locator('#damage').click();await page.locator('#move').click();assert.equal(await page.locator('#arena .card').count(),0);assert((await page.locator('#status').innerText()).includes('cure'));
await page.locator('#heal').click();await page.locator('#move').click();assert.equal(await page.locator('#arena .card').count(),1);await page.locator('#move').click();assert.equal(await page.locator('#hand .card').count(),3);
await page.locator('#amount').fill('');await page.locator('#damage').click();assert((await page.locator('#status').innerText()).includes('inteira'));
await page.locator('#inspect').click();assert(await page.locator('dialog').isVisible());await page.keyboard.press('Escape');
if(!mobile){await page.locator('[data-card="1"]').dblclick();assert(await page.locator('dialog').isVisible());assert.equal(await page.locator('#detail-title').innerText(),'Sam');await page.locator('#close').click();await page.locator('[data-card="2"]').click({button:'right'});assert.equal(await page.locator('#detail-title').innerText(),'Sark');await page.keyboard.press('Escape');}
await page.locator('[data-card="2"]').focus();await page.keyboard.press('Enter');assert.equal(await page.locator('[data-card="2"]').getAttribute('aria-pressed'),'true');
const downloadPromise=page.waitForEvent('download');await page.locator('#export').click();const download=await downloadPromise;const fs=require('node:fs');const data=JSON.parse(fs.readFileSync(await download.path(),'utf8'));assert.equal(data.version,'0.51.0');assert.equal(data.cards.length,3);assert.equal(data.opponent.cards.a.name,'P.ULLYS · oponente A');assert.equal(data.opponent.damage,25);assert(data.events.length>0);
await page.locator('#reset').click();assert.equal(await page.locator('#hand .card').count(),3);assert(await page.locator('#damage').isDisabled());await page.locator('#clear').click();assert((await page.locator('#events').innerText()).includes('próximos'));
assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));assert.deepEqual(errors,[]);await page.screenshot({path:'/tmp/goghos-lab-'+(mobile?'mobile':'desktop')+'.png',fullPage:true});console.log('PASS laboratório '+(mobile?'toque':'desktop')+': seleção, dano/cura, movimento, detalhes, teclado, exportação e reinício.');await page.close();
}
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
