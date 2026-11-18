const assert=require('node:assert/strict'),{chromium}=require('playwright');
const URL=process.env.PANEL_URL||'http://127.0.0.1:8000/painel.html';
(async()=>{const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox']});try{
 const page=await browser.newPage({viewport:{width:1440,height:900}}),errors=[];
 page.on('pageerror',e=>errors.push(String(e)));page.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url());});
 await page.goto(URL);await page.evaluate(()=>document.fonts.ready);
 const text=id=>page.locator('#'+id).innerText();
 assert.equal(await page.locator('#preview-character option').count(),32);
 assert.equal(await text('hud-hp'),'530');assert.equal(await text('hud-damage'),'—');assert.equal(await text('hud-breath'),'5');
 for(const [selector,src] of [['.hud-base','panel-base.png'],['.hud-life-fill','health-bar.png'],['.hud-heart img','heart.png'],['.hud-damage-icon img','damage.png']])assert.equal(await page.locator(selector).getAttribute('src'),'assets/player-panel-v048/'+src);
 assert.equal(await page.locator('#player-breath img').getAttribute('src'),'assets/menu-v036/star.webp');
 const star=await page.locator('#principal-ability').boundingBox();await page.locator('#principal-ability').hover();assert.deepEqual(await page.locator('#principal-ability').boundingBox(),star);assert.equal(await page.locator('#principal-ability').evaluate(e=>e.getAnimations({subtree:true}).length),0);
 await page.locator('#preview-damage').click();assert.equal(await text('hud-hp'),'470');assert.equal(await page.locator('.stat-life').getAttribute('aria-valuenow'),'470');assert.equal(await page.locator('.stat-life').evaluate(e=>Number(e.style.getPropertyValue('--health'))),470/530);
 await page.locator('#preview-amount').fill('9999');await page.locator('#preview-damage').click();assert.equal(await text('hud-hp'),'0');assert(await page.locator('#player-panel').evaluate(e=>e.classList.contains('is-defeated')));await page.waitForTimeout(300);assert.equal(await page.locator('.hud-life-fill').evaluate(e=>getComputedStyle(e).clipPath),'inset(0px 100% 0px 0px)');
 await page.locator('#preview-heal').click();assert.equal(await text('hud-hp'),'530');assert.equal(await page.locator('#player-panel').evaluate(e=>e.classList.contains('is-defeated')),false);
 await page.locator('#preview-amount').fill('-5');await page.locator('#preview-damage').click();assert.equal(await text('hud-hp'),'530');assert((await text('preview-status')).includes('valor inteiro'));
 for(let i=0;i<8;i++)await page.locator('#preview-breath-down').click();assert.equal(await text('hud-breath'),'0');for(let i=0;i<8;i++)await page.locator('#preview-breath-up').click();assert.equal(await text('hud-breath'),'5');assert.equal(await page.evaluate(()=>GoghosCharacters[2].breath),5);
 await page.locator('#preview-damage').click();await page.locator('#preview-reset').click();assert.equal(await text('hud-hp'),'530');
 for(const [selector,title] of [['#principal-ability','Habilidade principal · Sarck'],['#player-breath','Fôlego · Sarck'],['#inspect-selected','Sarck'],['.hud-damage-icon','Sarck']]){await page.locator(selector).focus();await page.keyboard.press('Enter');assert.equal(await text('panel-dialog-title'),title);await page.keyboard.press('Escape');assert.equal(await page.locator('#panel-dialog').isVisible(),false);assert.equal(await page.locator(selector).evaluate(e=>e===document.activeElement),true);}
 await page.screenshot({path:'/tmp/goghos0491-panel.png'});
 await page.locator('#preview-character').selectOption('1');assert.equal(await text('hud-damage'),'70 × 6');assert.equal(await text('hud-breath'),'7');
 await page.locator('#preview-character').selectOption('6');assert.equal(await text('hud-hp'),'1700');assert.equal(await text('hud-damage'),'700');assert.equal(await text('hud-breath'),'12');
 const number=await page.locator('#hud-hp').boundingBox(),heart=await page.locator('#inspect-selected').boundingBox();assert(number.x+number.width<=heart.x,'Vida de quatro dígitos não pode encobrir o coração.');
 await page.screenshot({path:'/tmp/goghos0491-panel-large-values.png'});
 for(let i=0;i<32;i++){await page.locator('#preview-character').selectOption(String(i));assert(await page.locator('#portrait img').evaluate(img=>new Promise(resolve=>{if(img.complete)return resolve(img.naturalWidth>0);img.addEventListener('load',()=>resolve(img.naturalWidth>0),{once:true});img.addEventListener('error',()=>resolve(false),{once:true});})));}
 await page.locator('#preview-character').selectOption('2');await page.locator('#preview-amount').fill('60');await page.locator('#preview-damage').click();await page.waitForTimeout(300);await page.screenshot({path:'/tmp/goghos0491-panel-damage.png'});
 for(const [width,height] of [[1024,768],[430,850]]){await page.setViewportSize({width,height});await page.waitForTimeout(100);assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));const b=await page.locator('#player-panel').boundingBox(),v=await page.locator('#panel-preview-viewport').boundingBox();assert(b.x>=v.x&&b.x+b.width<=v.x+v.width+1);await page.locator('#player-breath').click();assert((await text('panel-dialog-body')).includes('5 de 5'));await page.locator('#panel-dialog-close').click();}
 assert.deepEqual(errors,[]);console.log('PASS painel: artes originais, 32 personagens, vida zero/máxima, cura, dano pendente e multiplicadores, fôlego limitado só na simulação, quatro ícones clicáveis, teclado, estrela fixa e enquadramento.');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
