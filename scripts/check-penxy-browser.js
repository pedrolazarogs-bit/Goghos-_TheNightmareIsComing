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
  // Idle glow must animate, stay attached to the painted PNG, and scale with the arena.
  async function auraFrame(){
   return page.evaluate(()=>{
    const canvas=document.querySelector('[data-penxy-fx=canvas]');
    if(!canvas)return null;
    const art=document.querySelector('[data-controller=player] .original-card > image').getBoundingClientRect();
    const sx=canvas.width/innerWidth, sy=canvas.height/innerHeight;
    const pixels=canvas.getContext('2d').getImageData(0,0,canvas.width,canvas.height).data;
    let lit=0, outside=0, hash=0;
    for(let i=3;i<pixels.length;i+=4){
     if(pixels[i]<22)continue;
     const n=(i-3)/4,x=(n%canvas.width)/sx,y=Math.floor(n/canvas.width)/sy;
     if(x<art.left+.04*art.width||x>art.right-.04*art.width||y<art.top-art.height*.04||y>art.bottom+art.height*.04)outside++;
     lit++;hash=(Math.imul(hash,31)+i+pixels[i])>>>0;
    }
    return {lit,outside,hash};
   });
  }
  await page.waitForTimeout(1700);
  for(const width of [1120,1440]){
   await page.setViewportSize({width,height:900});
   await page.waitForTimeout(250);
   const first=await auraFrame();await page.waitForTimeout(220);const second=await auraFrame();
   assert(first?.lit>80&&second?.lit>80,'A aura precisa aparecer na carta.');
   assert.equal(second.outside,0,'A aura precisa acompanhar a arte após redimensionar.');
   assert.notEqual(first.hash,second.hash,'A aura deve continuar animada.');
  }
  async function enter(){await ability.click();await page.locator('#dialog-actions button').first().click();await ready();assert.equal(await page.evaluate(()=>GoghosBattle.snapshot().haunt.target),'red-0');}
  await page.locator('[data-battle-card=red-0]').click();
  assert.match(await page.locator('#card-info').innerText(),/Linx/);
  await page.locator('.tc-ability').click();await ready();assert.equal(await page.evaluate(()=>GoghosBattle.snapshot().haunt.target),'red-0');
  assert(await page.evaluate(()=>PenxyFX.haunt.active));
  await page.screenshot({path:'/tmp/0601-penxy-mente.png'});
  await ability.click();await ready();assert.equal(await page.evaluate(()=>GoghosBattle.snapshot().haunt),null);
  await enter();await page.locator('[data-battle-card=red-1]').click();assert.equal(await page.locator('.tc-atk').count(),0);
  await page.locator('[data-battle-card=red-0]').click();await page.locator('.tc-atk').click();await ready();
  const s=await page.evaluate(()=>GoghosBattle.snapshot());
  assert.equal(s.haunt.target,'red-0');assert.equal(s.cards.find(c=>c.id==='red-0').hp,520);assert.equal(s.last,s.playerId);
  await page.screenshot({path:'/tmp/0601-penxy.png'});
  await page.locator('summary').click();await page.locator('#pause').click();
  assert.equal(await page.locator('#inspector h2').textContent(),'Penxy');
  await page.locator('summary').click();await page.locator('#restart').click();await page.getByRole('button',{name:'Reiniciar',exact:true}).last().click();
  await page.locator('#owned-character').selectOption({label:'Nully'});await page.getByRole('button',{name:'Iniciar batalha'}).click();
  await page.evaluate(()=>{Math.random=()=>.99;});
  await page.locator('[data-battle-card=red-2]').click();await page.locator('.tc-atk').click();await ready();
  assert(!await page.locator('[data-battle-card=red-2]').isVisible());
  const offset=await page.locator('#team-red').evaluate(row=>{
   const boxes=[...row.querySelectorAll('button:not(.dead)')].map(el=>el.getBoundingClientRect());
   const r=row.getBoundingClientRect();return Math.abs((boxes[0].left+boxes.at(-1).right-r.left-r.right)/2);
  });
  assert(offset<2,'Equipe recentralizada: '+offset);
  const touch=await browser.newPage({isMobile:true,hasTouch:true,viewport:{width:390,height:844}});
  await touch.goto(process.env.ARENA_URL||'http://127.0.0.1:8000/arena-batalha.html');await touch.locator('[data-lineup=blue]').first().waitFor();assert(touch.url().includes('arena-toque.html'));
  assert.deepEqual(errors,[]);console.log('PASS Penxy e Nully com efeitos ativos, seleção de alvo, entrada e saída da mente, eliminação, reinício e arena de toque.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
