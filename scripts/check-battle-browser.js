const assert=require('node:assert/strict'),{chromium}=require('playwright');
const URL=process.env.BATTLE_URL||'http://127.0.0.1:8000/batalha.html';
(async()=>{const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox']});try{
 const page=await browser.newPage({viewport:{width:1440,height:900},acceptDownloads:true}),errors=[];
 page.on('pageerror',e=>errors.push(String(e)));page.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url());});
 await page.clock.install();await page.goto(URL);await page.evaluate(()=>document.fonts.ready);
 await page.locator('[data-lineup="blue"]').nth(1).selectOption('0');await page.getByRole('button',{name:'Iniciar batalha',exact:true}).click();assert((await page.locator('#setup-error').innerText()).includes('diferentes'));await page.locator('[data-lineup="blue"]').nth(1).selectOption('1');await page.getByRole('button',{name:'Iniciar batalha',exact:true}).click();
 await page.locator('#control').selectOption('manual');assert.equal(await page.locator('[data-battle-card]').count(),8);assert.equal(await page.locator('.support-slots button').count(),3);
 const snap=()=>page.evaluate(()=>GoghosBattle.snapshot());const initial=await snap();assert.equal(initial.order[initial.cursor],'blue-0');assert.equal(await page.locator('.queue-card.current').getAttribute('data-inspect'),'blue-0');assert.equal(await page.locator('.queue-card.next').getAttribute('data-inspect'),'red-0');
 await page.clock.runFor(2300);assert((await snap()).elapsedMs>=2300);
 await page.locator('[data-battle-card="red-0"]').click();await page.clock.runFor(500);await page.locator('.tc-atk').waitFor();assert.equal(await page.locator('.tc-pop').count(),0);
 await page.locator('[data-battle-card="red-0"]').click();await page.clock.runFor(1300);await page.locator('.tc-pop').waitFor();assert((await page.locator('.tc-pop').innerText()).includes('Sem habilidade definida'));
 await page.screenshot({path:'/tmp/goghos-battle-target-desktop.png'});
 await page.locator('.tc-atk').click();await page.clock.runFor(900);let s=await snap();assert.equal(s.cards.find(c=>c.id==='red-0').hp,75);assert.equal(s.last,'blue-0');assert.equal(s.order[s.cursor],'red-0');assert.equal(await page.locator('.queue-card.last').getAttribute('data-inspect'),'blue-0');
 await page.locator('#pause').click();const hp=s.cards.map(c=>c.hp);await page.clock.runFor(2500);assert.deepEqual((await snap()).cards.map(c=>c.hp),hp);assert((await snap()).elapsedMs>s.elapsedMs);await page.locator('[data-battle-card="blue-0"]').click();assert.equal(await page.locator('.tc-atk').count(),0);await page.keyboard.press('Escape');await page.locator('#pause').click();
 await page.locator('[data-slot="support"]').first().click();assert((await page.locator('#dialog-body').innerText()).includes('três apoios'));await page.getByRole('button',{name:'Voltar ao campo',exact:true}).click();
 await page.locator('[data-slot="ability"]').click();assert((await page.locator('#dialog-body').innerText()).includes('Nenhuma habilidade'));await page.keyboard.press('Escape');
 await page.locator('[data-slot="item"]').click();assert((await page.locator('#dialog-body').innerText()).includes('Nenhum item'));await page.keyboard.press('Escape');
 await page.locator('#motion').click();assert.equal(await page.locator('body').getAttribute('class'),'reduced');
 await page.screenshot({path:'/tmp/goghos-battle-desktop.png'});
 await page.locator('#control').selectOption('auto');let rounds=0;for(let i=0;i<220;i++){
  await page.clock.runFor(2000);s=await snap();
  if(s.phase==='finished'){await page.clock.runFor(1000);break;}
  if(s.phase==='round-end'){const score=s.score.blue+s.score.red;await page.getByRole('button',{name:'Próxima rodada',exact:true}).click();const n=await snap();assert.equal(n.score.blue+n.score.red,score);assert(n.cards.every(c=>c.hp===100));assert(n.elapsedMs>=s.elapsedMs);rounds++;}
 }
 s=await snap();assert.equal(s.phase,'finished');assert.equal(Math.max(s.score.blue,s.score.red),3);assert.equal(s.score.blue+s.score.red,rounds+1);const time=s.elapsedMs;await page.clock.runFor(10000);assert.equal((await snap()).elapsedMs,time);assert((await page.locator('#dialog-title').innerText()).includes('vence a série'));
 await page.screenshot({path:'/tmp/goghos-battle-result.png'});
 const promise=page.waitForEvent('download');await page.getByRole('button',{name:'Exportar registro',exact:true}).click();const d=await promise;const data=JSON.parse(require('node:fs').readFileSync(await d.path(),'utf8'));assert.equal(data.version,'0.45.0');assert.equal(data.phase,'finished');assert.equal(data.elapsedMs,time);
 await page.getByRole('button',{name:'Nova série',exact:true}).click();assert.equal((await snap()).phase,'ready');assert.equal((await snap()).elapsedMs,0);
 await page.getByRole('button',{name:'Iniciar batalha',exact:true}).click();await page.locator('#control').selectOption('manual');await page.setViewportSize({width:1024,height:768});await page.clock.runFor(200);
 assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 await page.locator('[data-battle-card="red-1"]').focus();await page.keyboard.press('Enter');await page.clock.runFor(500);assert.equal(await page.locator('.tc-atk').count(),1);await page.keyboard.press('Escape');
 assert.deepEqual(errors,[]);console.log('PASS arena desktop: equipe, CardTouch, ações, pausa, apoios/itens sem efeitos, ordem, série completa, placar até 3, relógio final, exportação e nova série.');await page.close();
 const touch=await browser.newPage({viewport:{width:844,height:390},hasTouch:true});await touch.goto(URL);await touch.getByRole('button',{name:'Iniciar batalha',exact:true}).tap();await touch.locator('[data-battle-card="red-0"]').tap();await touch.locator('.tc-atk').waitFor();await touch.locator('.tc-atk').tap();await touch.waitForTimeout(800);assert.equal(await touch.evaluate(()=>GoghosBattle.snapshot().cards.find(c=>c.id==='red-0').hp),75);assert(await touch.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));console.log('PASS arena em paisagem com toque: alvo e ataque funcionam sem rolagem horizontal.');await touch.close();
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
