const assert=require('node:assert/strict'),{chromium}=require('playwright');
(async()=>{const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox']});try{
for(const mobile of [false,true]){
 const page=await browser.newPage({viewport:mobile?{width:390,height:844}:{width:1440,height:1000},hasTouch:mobile});const errors=[];page.on('pageerror',e=>errors.push(String(e)));page.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url());});
 await page.goto(process.env.LAB_URL||'http://127.0.0.1:8000/laboratorio.html');await page.evaluate(()=>document.fonts.ready);
 assert(await page.evaluate(()=>document.fonts.check('20px "German Beauty"')));
 const a=page.locator('[data-opponent="a"]'),b=page.locator('[data-opponent="b"]');
 const tap=async locator=>{if(mobile)await locator.tap();else await locator.click();};
 await a.scrollIntoViewIfNeeded();await tap(a);
 await page.locator('.tc-atk').waitFor();assert.equal(await page.locator('.tc-pop').count(),0);
 await tap(a);await page.locator('.tc-pop').waitFor();await page.waitForTimeout(1300);
 assert.equal(await page.locator('.tc-atk').count(),1);assert.equal(await page.locator('.tc-box h3').innerText(),'Ataque vasto');
 assert.equal(await a.locator('.tc-b.nerf').innerText(),'1');assert.equal(await a.locator('.tc-b.buff').innerText(),'2');
 assert((await page.locator('.tc-pop').evaluate(el=>getComputedStyle(el).fontFamily)).includes('German Beauty'));
 assert((await page.locator('.tc-atk').evaluate(el=>getComputedStyle(el).fontFamily)).includes('German Beauty'));
 const bounds=await page.locator('.tc-pop').boundingBox();const size=page.viewportSize();assert(bounds.x>=0&&bounds.y>=0&&bounds.x+bounds.width<=size.width+1&&bounds.y+bounds.height<=size.height+1,'Painel dentro da tela');
 const attackBounds=await page.locator('.tc-atk').boundingBox();assert(attackBounds.x+attackBounds.width<=bounds.x||attackBounds.x>=bounds.x+bounds.width||attackBounds.y+attackBounds.height<=bounds.y||attackBounds.y>=bounds.y+bounds.height,'Botão não deve sobrepor o painel');
 await page.screenshot({path:'/tmp/goghos-opponent-'+(mobile?'mobile':'desktop')+'.png'});
 if(!mobile){await tap(a);await page.waitForFunction(()=>!document.querySelector('.tc-pop,.tc-atk'));await tap(a);} // 3rd click closes; reopen only attack.
 await tap(page.locator('.tc-atk'));assert.equal(await page.evaluate(()=>GoghosOpponentLab.snapshot().cards.a.hp),125);assert.equal(await page.evaluate(()=>GoghosOpponentLab.snapshot().cards.b.hp),90);assert.equal(await page.evaluate(()=>GoghosOpponentLab.snapshot().playerTurn),false);
 await tap(a);await page.locator('.tc-pop').waitFor();assert.equal(await page.locator('.tc-atk').count(),0);await page.keyboard.press('Escape');assert.equal(await page.locator('.tc-pop').count(),0);
 await tap(b);await page.locator('.tc-pop').waitFor();assert.equal(await b.locator('.tc-b.nerf').count(),0);await tap(page.locator('.tc-close'));assert.equal(await page.locator('.tc-pop').count(),0);
 await page.locator('#opponent-swap').click();await a.scrollIntoViewIfNeeded();await a.focus();await page.keyboard.press('Enter');await page.locator('.tc-atk').waitFor();await page.keyboard.press('Space');await page.locator('.tc-pop').waitFor();await page.keyboard.press('Escape');
 await tap(a);await page.locator('.tc-atk').waitFor();await page.setViewportSize(mobile?{width:844,height:390}:{width:1100,height:850});await page.waitForFunction(()=>!document.querySelector('.tc-atk,.tc-pop'));
 await page.locator(await page.locator('#reset').count()?'#reset':'#opponent-reset').click();assert.equal(await page.evaluate(()=>GoghosOpponentLab.snapshot().cards.a.hp),150);
 if(!mobile){
  for(let i=0;i<6;i++){await tap(a);await page.locator('.tc-atk').waitFor();await tap(page.locator('.tc-atk'));await page.locator('#opponent-swap').click();}
  assert.equal(await page.evaluate(()=>GoghosOpponentLab.snapshot().cards.a.hp),0);
  await tap(a);await page.locator('.tc-pop').waitFor();assert.equal(await page.locator('.tc-atk').count(),0);
  await page.locator('#opponent-title').click();assert.equal(await page.locator('.tc-pop').count(),0);
  await page.locator('#opponent-reset').click();assert.equal(await page.evaluate(()=>GoghosOpponentLab.snapshot().cards.a.hp),150);
 }
 assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));assert.deepEqual(errors,[]);
 console.log('PASS oponente '+(mobile?'toque':'desktop')+': fonte, ciclo de cliques, indicadores, alvo correto, vez, teclado, limites do painel e reinício');await page.close();
}
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
