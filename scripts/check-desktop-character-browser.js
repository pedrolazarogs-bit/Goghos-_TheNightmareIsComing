// Isolated menu checks complement the complete mandatory-opening browser flow.
const assert=require('node:assert/strict'),{chromium}=require('playwright');
const URL=process.env.TEST_URL||'http://127.0.0.1:8000';
async function edges(page){
 return page.evaluate(()=>{
  const image=document.querySelector('.cosmos-favorite-image'),r=image.getBoundingClientRect(),panel=document.querySelector('.cosmos-panel-boundary'),matrix=panel.getScreenCTM().inverse();
  const c=document.createElement('canvas');c.width=image.naturalWidth;c.height=image.naturalHeight;const ctx=c.getContext('2d');ctx.drawImage(image,0,0);const data=ctx.getImageData(0,0,c.width,c.height).data;
  let exposed=0;
  const check=(x,y)=>{if(data[(y*c.width+x)*4+3]<=32)return;const screenX=r.left+(x+.5)*r.width/c.width,screenY=r.top+(y+.5)*r.height/c.height;const p=new DOMPoint(screenX,screenY).matrixTransform(matrix);
   // The panel's 18px stroke covers the outer 9px on each edge.
   if(p.x>10&&p.y>10&&p.y<1070&&p.x<975-565*p.y/1080)exposed++;
  };
  for(let x=0;x<c.width;x++){check(x,0);check(x,c.height-1);}for(let y=1;y<c.height-1;y++){check(0,y);check(c.width-1,y);}
  return exposed;
 });
}
async function motion(page,kind){
 await page.waitForFunction(kind=>document.querySelector('.cosmos-favorite-image').getAnimations().some(a=>a.id==='favorite-'+kind),kind);
 const timing=await page.locator('.cosmos-favorite-image').evaluate(image=>{const a=image.getAnimations()[0];a.pause();return a.effect.getTiming();});
 assert.equal(timing.iterations,1);
 for(const fraction of [0,.25,.5,.75]){
  await page.locator('.cosmos-favorite-image').evaluate((image,fraction)=>{const a=image.getAnimations()[0];a.currentTime=a.effect.getTiming().duration*fraction;},fraction);
  assert.equal(await edges(page),0,'Nenhuma borda original da imagem deve aparecer dentro do painel durante a animação');
 }
 await page.locator('.cosmos-favorite-image').evaluate(image=>image.getAnimations()[0].finish());
 await page.waitForFunction(()=>!document.querySelector('.cosmos-character-layer').getAnimations({subtree:true}).length);
 assert.equal(await edges(page),0);
}
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
 try{
 for(const viewport of [{width:1366,height:768},{width:1024,height:768}]){
  const page=await browser.newPage({viewport});const errors=[];page.on('pageerror',e=>errors.push(String(e)));
  await page.goto(URL);await page.locator('[data-act="shell-start"]:enabled').waitFor();
  // Only this isolated test removes the opening overlay to inspect animation frames.
  await page.evaluate(()=>{document.querySelector('.world-intro').style.display='none';document.getElementById('app').inert=false;GOGHOS.CosmosMenu.mount(document.getElementById('app'));});
  await motion(page,'entry');await page.waitForTimeout(2000);
  const trigger=page.locator('[data-cosmos-favorite]');
  for(const id of ['sam','sarck','nully','mike','unicorn']){
   await trigger.click();await page.locator('[data-favorite-choice="'+id+'"]').click();await motion(page,'choice');
   await page.mouse.move(0,0);await page.waitForTimeout(180);
   if(viewport.width===1366)await page.screenshot({path:'/tmp/goghos-v0401-'+id+'.png'});
  }
  const before=await page.locator('.cosmos-favorite-image').boundingBox();await page.waitForTimeout(1200);
  assert.deepEqual(await page.locator('.cosmos-favorite-image').boundingBox(),before,'Personagem deve ficar em repouso');
  assert.equal(await page.locator('.cosmos-favorite-image').evaluate(image=>image.getAnimations().length),0);
  await trigger.click();await page.locator('.favorite-picker-close').click();
  assert.equal(await page.locator('.cosmos-favorite-image').evaluate(image=>image.getAnimations().length),0,'Fechar sem escolher não repete animação');
  await page.emulateMedia({reducedMotion:'reduce'});
  await trigger.click();await page.locator('[data-favorite-choice="sam"]').click();
  assert.equal(await page.locator('.cosmos-favorite-image').evaluate(image=>image.getAnimations().length),0);
  // Switching layouts during an animation must cancel it instead of affecting mobile.
  await page.emulateMedia({reducedMotion:'no-preference'});
  await trigger.click();await page.locator('[data-favorite-choice="mike"]').click();
  await page.setViewportSize({width:390,height:844});
  await page.waitForFunction(()=>!document.querySelector('.cosmos-menu').hasAttribute('data-desktop-character'));
  assert.equal(await page.locator('.cosmos-favorite-image').evaluate(image=>image.getAnimations().length),0);
  assert.deepEqual(errors,[]);console.log('PASS desktop '+viewport.width+': pivôs, bordas ocultas, entrada/escolha sem loop, repouso e movimento reduzido');await page.close();
 }
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
