// Execute npm run dev antes deste teste; requer Playwright e Chromium.
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const { PNG } = require('pngjs');

async function checkCharacter(page){
  await page.waitForFunction(()=>!document.querySelector('.cosmos-character-layer').getAnimations({subtree:true}).length);
  // Keep hover transitions on other menu icons out of the character-only comparison.
  await page.mouse.move(0,0);
  const captureStyle=await page.addStyleTag({content:'.cosmos-favorite{will-change:opacity}'});
  await page.waitForTimeout(180);
  const geometry=await page.evaluate(()=>{
    const layer=document.querySelector('.cosmos-character-layer'),image=layer.querySelector('img');
    if(layer.getAnimations({subtree:true}).length)throw Error('O personagem deve repousar após a animação pontual');
    const boundary=document.querySelector('.cosmos-panel-boundary'),matrix=boundary.getScreenCTM();
    window.__menuAnimations=document.querySelector('.cosmos-menu').getAnimations({subtree:true});
    window.__menuAnimations.forEach(animation=>animation.pause());
    return {points:Array.from(boundary.points,point=>({x:matrix.a*point.x+matrix.c*point.y+matrix.e,y:matrix.b*point.x+matrix.d*point.y+matrix.f})),rect:JSON.stringify(image.getBoundingClientRect())};
  });
  await page.waitForTimeout(180);
  assert.equal(await page.locator('.cosmos-favorite-image').evaluate(image=>JSON.stringify(image.getBoundingClientRect())),geometry.rect,'O personagem não deve flutuar');
  // Keep the same compositing layers and focus while making the character imperceptible.
  const visible=PNG.sync.read(await page.screenshot());
  await page.locator('.cosmos-favorite').evaluate(element=>element.style.opacity='.0001');
  const hidden=PNG.sync.read(await page.screenshot());
  await page.locator('.cosmos-favorite').evaluate(element=>element.style.removeProperty('opacity'));
  await page.evaluate(()=>{window.__menuAnimations.forEach(animation=>animation.play());delete window.__menuAnimations;});
  await captureStyle.evaluate(element=>element.remove());
  const points=geometry.points;
  const inside=(x,y)=>{
    let result=false;
    for(let i=0,j=points.length-1;i<points.length;j=i++){
      const a=points[i],b=points[j];
      if((a.y>y)!==(b.y>y)&&x<(b.x-a.x)*(y-a.y)/(b.y-a.y)+a.x)result=!result;
    }
    return result;
  };
  let changed=0,outside=0;
  for(let y=0;y<visible.height;y++)for(let x=0;x<visible.width;x++){
    const offset=(y*visible.width+x)*4;
    // Chromium may rasterize paused SVG/particle edges with slightly different colors.
    if(![0,1,2].some(channel=>Math.abs(visible.data[offset+channel]-hidden.data[offset+channel])>16))continue;
    changed++;
    if(!inside(x+.5,y+.5))outside++;
  }
  assert(changed>100,'O personagem deve permanecer visível dentro da divisão');
  if(outside){const fs=require('node:fs');fs.writeFileSync('/tmp/goghos-character-visible.png',PNG.sync.write(visible));fs.writeFileSync('/tmp/goghos-character-hidden.png',PNG.sync.write(hidden));fs.writeFileSync('/tmp/goghos-character-geometry.json',JSON.stringify(geometry));}
  assert.equal(outside,0,'Nenhum pixel do personagem pode ultrapassar a divisão');
}

(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium',
    headless: true, args: ['--no-sandbox']
  });
  try {
    for (const mobile of [false, true]) {
      const page = await browser.newPage({
        viewport: mobile ? { width: 390, height: 844 } : { width: 1366, height: 768 },
        hasTouch: mobile
      });
      const errors = [];
      page.on('pageerror', error => errors.push(String(error)));
      page.on('response', response => {if(response.status()>=400)errors.push(response.status()+' '+response.url());});
      await page.goto(process.env.TEST_URL || 'http://127.0.0.1:8000');
      await page.locator('[data-act="shell-start"]:enabled').waitFor();
      await page.keyboard.press('Escape');
      assert(await page.evaluate(() => GOGHOS.IntroPresenter.isActive()));
      await page.locator('[data-act="shell-start"]').click();
      // The original white loading canvas must precede the cosmic title canvas.
      await page.waitForFunction(() => document.querySelector('.duel-intro-scene canvas'));
      assert.equal(await page.locator('.intro-title').count(), 0);
      await page.keyboard.press('Enter'); // A loading-stage key must not be queued.
      await page.waitForFunction(() => GOGHOS.IntroPresenter.getDebugState().phase === 'title');
      assert(await page.evaluate(() => document.querySelector('#app').inert));
      await page.keyboard.press('Enter'); // An early title key cannot skip its entrance.
      await page.waitForFunction(() => GOGHOS.IntroPresenter.getDebugState().phase === 'title-ready', null, { timeout: 20000 });
      const titleMusic = await page.evaluate(() => GOGHOS.Soundtrack.getDebugState());
      assert.equal(titleMusic.activeTrack, 'menu');
      assert.equal(titleMusic.playing, true);
      await page.waitForTimeout(2200); // Ready must wait indefinitely, with no auto-exit.
      assert(await page.evaluate(() => GOGHOS.IntroPresenter.isActive()));
      assert(await page.evaluate(() => document.querySelector('#app').inert));
      await page.screenshot({ path: '/tmp/goghos-title-' + (mobile ? 'mobile' : 'desktop') + '.png' });
      if (mobile) await page.locator('.intro-title canvas').tap();
      else await page.keyboard.press('a');
      await page.waitForFunction(() => !GOGHOS.IntroPresenter.isActive(), null, { timeout: 10000 });
      assert.equal(await page.evaluate(() => document.querySelector('#app').inert), false);
      const menuMusic = await page.evaluate(() => GOGHOS.Soundtrack.getDebugState());
      assert.equal(menuMusic.activeTrack, 'menu');
      assert.equal(menuMusic.playing, true);
      assert.equal(menuMusic.playCount, titleMusic.playCount);
      assert.equal(menuMusic.tracks.length, 1);
      assert(menuMusic.tracks[0].currentTime > titleMusic.tracks[0].currentTime, 'Menu music must continue without restarting');
      await page.waitForTimeout(2200);
      const menu=page.locator('.cosmos-menu');
      assert.equal(await menu.locator('button').count(),1);
      assert.equal(await menu.locator('[data-cosmos-favorite][aria-haspopup="dialog"]').count(),1);
      assert.equal(await menu.locator('a,[role="button"],[data-act],[tabindex="0"]').count(),0);
      const baseline=await page.evaluate(()=>({html:document.getElementById('app').innerHTML,storage:JSON.stringify(localStorage),url:location.href}));
      const decorations=menu.locator('.cosmos-decor');
      assert.equal(await decorations.count(),10);
      for(let i=0;i<await decorations.count();i++){
        const element=decorations.nth(i),box=await element.boundingBox();
        assert(box&&box.width>0&&box.height>0,'Menu artwork must be visible');
        if(mobile)await element.tap();else await element.click();
      }
      for(const key of ['Enter','Space','Escape','a','Tab'])await page.keyboard.press(key);
      assert.deepEqual(await page.evaluate(()=>({html:document.getElementById('app').innerHTML,storage:JSON.stringify(localStorage),url:location.href})),baseline,'Menu input must not navigate, open panels or modify progress');
      assert.equal(await page.locator('[role="dialog"]').count(),0);
      assert.equal(await page.evaluate(()=>Object.keys(GOGHOS).some(key=>['Battle','ArenaFive','ArenaFiveUI','Shop','Sanctuary','VisualShell'].includes(key))),false);
      assert(await page.evaluate(()=>[...document.querySelectorAll('.cosmos-menu img')].every(img=>img.complete&&img.naturalWidth>0)));
      assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth&&document.documentElement.scrollHeight<=innerHeight));
      assert.equal(await page.evaluate(()=>GOGHOS.Soundtrack.getDebugState().playCount),titleMusic.playCount);
      const trigger=menu.locator('[data-cosmos-favorite]');
      const openPicker=async()=>{if(mobile)await trigger.tap();else await trigger.click();await page.locator('.favorite-picker[open]').waitFor();await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));};
      await trigger.focus();await page.keyboard.press('Enter');
      await page.locator('.favorite-picker[open]').waitFor();
      assert.equal(await page.locator('[data-favorite-choice]').count(),5);
      assert(await page.locator('.favorite-picker').evaluate(dialog=>dialog.scrollWidth<=dialog.clientWidth&&[...dialog.querySelectorAll('.favorite-choice')].every(button=>{
        const art=button.querySelector('.favorite-choice-art').getBoundingClientRect(),image=button.querySelector('img').getBoundingClientRect(),label=button.querySelector('strong').getBoundingClientRect();
        return button.querySelector('img').complete&&button.querySelector('img').naturalWidth>0&&image.bottom<=art.bottom+1&&label.top>=art.bottom&&label.bottom<=button.getBoundingClientRect().bottom;
      })),'Imagens e nomes não devem se sobrepor no seletor');
      assert.equal(await page.locator('[data-favorite-choice="unicorn"]').getAttribute('aria-pressed'),'true');
      for(let i=0;i<7;i++){await page.keyboard.press('Tab');assert(await page.evaluate(()=>!!document.activeElement.closest('.favorite-picker')),'O foco deve permanecer no seletor');}
      await page.keyboard.press('Escape');
      assert.equal(await page.locator('.favorite-picker').count(),0);
      assert.equal(await trigger.evaluate(element=>element===document.activeElement),true);
      assert.equal(await page.evaluate(()=>JSON.stringify(localStorage)),baseline.storage);
      await openPicker();await page.locator('.favorite-picker-close').click();
      assert.equal(await page.locator('.favorite-picker').count(),0);
      await openPicker();await page.mouse.click(5,5);
      assert.equal(await page.locator('.favorite-picker').count(),0);
      const withoutFavorite=()=>page.evaluate(()=>Object.fromEntries(Object.entries(localStorage).filter(([key])=>key!=='goghos.menu-favorite.v036')));
      const progress=await withoutFavorite();
      for(const [id,name,index] of [['unicorn','Unicorn',0],['sam','Sam',1],['sarck','Sark',2],['nully','Nully',3],['mike','Mike',4],['unicorn','Unicorn',0]]){
        await openPicker();
        if(id==='unicorn'&&index===0)await page.screenshot({path:'/tmp/goghos-favorites-v0.40.2-'+(mobile?'celular':'desktop')+'.png'});
        await page.locator('[data-favorite-choice="'+id+'"]').click();
        assert.equal(await page.locator('.favorite-picker').count(),0);
        assert.equal(await trigger.getAttribute('aria-expanded'),'false');
        assert.equal(await page.evaluate(()=>GOGHOS.CosmosMenu.getDebugState().favorite),id);
        assert.equal(await page.evaluate(()=>localStorage.getItem('goghos.menu-favorite.v036')),id);
        assert.equal(await menu.locator('.cosmos-favorite-label strong').textContent(),name);
        assert((await trigger.getAttribute('aria-label')).includes(name));
        assert((await menu.locator('.cosmos-favorite-image').getAttribute('src')).endsWith('character-'+index+'.webp'));
        await menu.locator('.cosmos-favorite-image').evaluate(image=>image.decode());
        await checkCharacter(page);
      }
      assert.deepEqual(await withoutFavorite(),progress,'A seleção não pode alterar moedas, coleção ou preferências de áudio');
      assert.equal(await page.evaluate(()=>GOGHOS.Soundtrack.getDebugState().playCount),titleMusic.playCount);
      const chosenStorage=await page.evaluate(()=>JSON.stringify(localStorage));
      await page.screenshot({path:'/tmp/goghos-menu-v0.40.2-'+(mobile?'celular':'desktop')+'.png'});
      // Verify the preserved animation directly; no menu control opens it.
      await page.evaluate(()=>{GOGHOS.VictoryPresenter.open();});
      await page.waitForFunction(()=>GOGHOS.VictoryPresenter.getDebugState().ready,null,{timeout:20000});
      assert.equal(await page.locator('.victory-failed').count(),0);
      assert.equal(await page.locator('.victory-canvas canvas').count(),1);
      await page.screenshot({path:'/tmp/goghos-victory-v0.40.2-'+(mobile?'celular':'desktop')+'.png'});
      await page.locator(mobile?'[data-victory="play"]':'[data-victory="menu"]').click();
      await page.waitForFunction(()=>!GOGHOS.VictoryPresenter.getDebugState().active);
      assert.equal(await menu.count(),1);
      assert.equal(await page.locator('[role="dialog"]').count(),0);
      assert.equal(await page.evaluate(()=>document.getElementById('app').inert),false);
      assert.equal(await page.evaluate(()=>JSON.stringify(localStorage)),chosenStorage);
      await page.waitForFunction(()=>GOGHOS.Soundtrack.getDebugState().activeTrack==='menu'&&GOGHOS.Soundtrack.getDebugState().playing);
      await page.emulateMedia({reducedMotion:'reduce'});
      await page.waitForFunction(()=>document.querySelector('.cosmos-menu').classList.contains('cosmos-reduced'));
      // Resize and inspect the painted pixels, including the portrait SVG's letterbox.
      await page.setViewportSize(mobile?{width:320,height:568}:{width:1024,height:768});
      await page.waitForTimeout(100);
      await checkCharacter(page);
      await openPicker();await page.locator('[data-favorite-choice="sam"]').click();
      await page.evaluate(()=>{window.__saveFavorite=Storage.prototype.setItem;Storage.prototype.setItem=function(){throw Error('storage unavailable');};});
      await openPicker();await page.locator('[data-favorite-choice="mike"]').click();
      assert.equal(await page.evaluate(()=>GOGHOS.CosmosMenu.getDebugState().favorite),'mike');
      assert.equal(await page.evaluate(()=>localStorage.getItem('goghos.menu-favorite.v036')),'sam');
      assert((await menu.locator('.cosmos-announcement').textContent()).includes('nesta sessão'));
      await page.evaluate(()=>{Storage.prototype.setItem=window.__saveFavorite;delete window.__saveFavorite;});
      await page.reload();
      await page.locator('[data-act="shell-start"]:enabled').waitFor();
      assert.equal(await menu.locator('.cosmos-favorite-label strong').textContent(),'Sam');
      assert.equal(await page.evaluate(()=>document.getElementById('app').inert),true,'A preferência salva não pula a abertura');
      assert.deepEqual(errors, []);
      console.log('PASS '+(mobile?'celular':'desktop')+': abertura obrigatória, música contínua, 10 controles sem acessos, personagem estático dentro da divisão, seletor de 5 favoritos com persistência e animação de vitória preservada');
      await page.close();
    }
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
