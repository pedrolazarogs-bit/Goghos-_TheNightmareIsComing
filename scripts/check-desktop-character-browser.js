// Isolated menu checks complement the complete mandatory-opening browser flow.
const assert=require('node:assert/strict'),{chromium}=require('playwright'),{PNG}=require('pngjs');
const URL=process.env.TEST_URL||'http://127.0.0.1:8000';
// Approved v0.40.0 dimensions and face anchors: do not hide cuts with zoom.
const FRAMES={unicorn:[.66,.4,1],sam:[.6,.47,1],sarck:[.53,.36,1],nully:[.47,.22,.8],mike:[.41,.4,1]};
async function size(page,settled=false){
 const actual=await page.evaluate(()=>{
  const image=document.querySelector('.cosmos-favorite-image');
  return {id:GOGHOS.CosmosMenu.getDebugState().favorite,image:image.getBoundingClientRect().toJSON(),stage:document.querySelector('.cosmos-stage').getBoundingClientRect().toJSON(),ratio:image.naturalWidth/image.naturalHeight};
 });
 const [faceX,faceY,multiplier]=FRAMES[actual.id],scale=actual.stage.width/1920,height=910*multiplier*scale,width=height*actual.ratio;
 const close=(a,b,label)=>assert(Math.abs(a-b)<.1,label+': '+a+' ≠ '+b);
 close(actual.image.height,height,'Altura aprovada deve permanecer igual, inclusive durante a animação');
 close(actual.image.width,width,'Largura aprovada deve permanecer igual, sem zoom');
 if(settled){close(actual.image.x,actual.stage.x+400*scale-width*faceX,'Enquadramento horizontal aprovado');close(actual.image.y,actual.stage.y+470*scale-height*faceY,'Enquadramento vertical aprovado');}
}
async function edges(page,settled=false){
 // Capture the rendered alpha, including the mask, instead of assuming the
 // original asset edges must be moved out of the panel by enlarging the image.
 const style=await page.addStyleTag({content:'body *{visibility:hidden!important}.cosmos-favorite-image{visibility:visible!important}html,body,#app,.cosmos-menu,.cosmos-stage{background:transparent!important}'});
 let png,r;
 try{r=await page.locator('.cosmos-favorite-image').boundingBox();png=PNG.sync.read(await page.screenshot({omitBackground:true}));}
 finally{await style.evaluate(element=>element.remove());}
 let sampled=0,exposed=0;
 const check=(x,y)=>{x=Math.floor(x);y=Math.floor(y);if(x<0||y<0||x>=png.width||y>=png.height)return;sampled++;if(png.data[(y*png.width+x)*4+3]>32)exposed++;};
 for(let x=r.x+.5;x<r.x+r.width;x++){check(x,r.y+.5);check(x,r.y+r.height-.5);}
 for(let y=r.y+.5;y<r.y+r.height;y++){check(r.x+.5,y);check(r.x+r.width-.5,y);}
 assert(sampled>0,'É necessário verificar extremidades visíveis no quadro');
 assert.equal(exposed,0,'As extremidades devem se dissolver no painel, sem linha opaca (tolerância de antialiasing: 32/255)');
 if(settled){let opaque=0;for(let i=3;i<png.data.length;i+=4)if(png.data[i]>240)opaque++;assert(opaque>1000,'O centro da arte deve continuar visível e opaco');}
}
async function motion(page,kind){
 await page.waitForFunction(kind=>document.querySelector('.cosmos-favorite-image').getAnimations().some(a=>a.id==='favorite-'+kind),kind);
 const timing=await page.locator('.cosmos-favorite-image').evaluate(image=>{const a=image.getAnimations()[0];a.pause();return a.effect.getTiming();});
 assert.equal(timing.iterations,1);
 for(const fraction of [0,.25,.5,.75]){
  await page.locator('.cosmos-favorite-image').evaluate((image,fraction)=>{const a=image.getAnimations()[0];a.currentTime=a.effect.getTiming().duration*fraction;},fraction);
  await size(page);await edges(page);
 }
 await page.locator('.cosmos-favorite-image').evaluate(image=>image.getAnimations()[0].finish());
 await page.waitForFunction(()=>!document.querySelector('.cosmos-character-layer').getAnimations({subtree:true}).length);
 await size(page,true);await edges(page,true);
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
   if(viewport.width===1366)await page.screenshot({path:'/tmp/goghos-v0402-'+id+'.png'});
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
  assert.deepEqual(errors,[]);console.log('PASS desktop '+viewport.width+': tamanho/enquadramento v0.40.0, bordas transparentes, entrada/escolha sem zoom ou loop, repouso e movimento reduzido');await page.close();
 }
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
