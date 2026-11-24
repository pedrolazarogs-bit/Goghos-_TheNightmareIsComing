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
    return {points:Array.from(boundary.points,point=>({x:matrix.a*point.x+matrix.c*point.y+matrix.e,y:matrix.b*point.x+matrix.d*point.y+matrix.f})),imageBounds:image.getBoundingClientRect().toJSON(),rect:JSON.stringify(image.getBoundingClientRect())};
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
    // Ignore unrelated background rasterization outside the full image bounds.
    // Include a margin for the keyboard focus glow; the panel check stays exact.
    const bounds=geometry.imageBounds;
    if(x<bounds.left-16||x>bounds.right+16||y<bounds.top-16||y>bounds.bottom+16)continue;
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
    for (const mobile of (process.env.MENU_DESKTOP_ONLY ? [false] : [false, true])) {
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
      assert.equal(await menu.locator('button').count(),mobile?0:1);
      if(!mobile){assert(await menu.locator('button.cosmos-play').isVisible());assert.equal(await menu.locator('.cosmos-mode strong').innerText(),'4×4');}
      assert.equal(await menu.locator('[data-cosmos-favorite][aria-haspopup="dialog"]').count(),0);
      assert.equal(await menu.locator('a,[role="button"],[data-act],[tabindex="0"]').count(),0);
      const baseline=await page.evaluate(()=>({html:document.getElementById('app').innerHTML,storage:JSON.stringify(localStorage),url:location.href}));
      const decorations=menu.locator(mobile?'.cosmos-decor':'.cosmos-decor:not(.cosmos-play)');
      assert.equal(await decorations.count(),mobile?10:9);
      for(let i=0;i<await decorations.count();i++){
        const element=decorations.nth(i),box=await element.boundingBox();
        assert(box&&box.width>0&&box.height>0,'Menu artwork must be visible');
        if(mobile)await element.tap();else await element.click();
      }
      await menu.focus();
      for(const key of ['Enter','Space','Escape','a','Tab'])await page.keyboard.press(key);
      assert.deepEqual(await page.evaluate(()=>({html:document.getElementById('app').innerHTML,storage:JSON.stringify(localStorage),url:location.href})),baseline,'Decorative controls must not navigate, open panels or modify progress');
      assert.equal(await page.locator('[role="dialog"]').count(),0);
      assert.equal(await page.evaluate(()=>Object.keys(GOGHOS).some(key=>['Battle','ArenaFive','ArenaFiveUI','Shop','Sanctuary','VisualShell'].includes(key))),false);
      assert(await page.evaluate(()=>[...document.querySelectorAll('.cosmos-menu img')].every(img=>img.complete&&img.naturalWidth>0)));
      assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth&&document.documentElement.scrollHeight<=innerHeight));
      assert.equal(await page.evaluate(()=>GOGHOS.Soundtrack.getDebugState().playCount),titleMusic.playCount);
      await page.mouse.click(mobile?90:280,mobile?300:330);
      await page.keyboard.press('Enter');
      assert.equal(await page.locator('dialog,.favorite-picker').count(),0);
      assert.equal(await page.evaluate(()=>!!GOGHOS.FavoritePicker),false);
      await checkCharacter(page);
      const chosenStorage=await page.evaluate(()=>JSON.stringify(localStorage));
      await page.screenshot({path:'/tmp/goghos-menu-v0.55.0-'+(mobile?'celular':'desktop')+'.png'});
      // Verify the preserved animation directly; no menu control opens it.
      await page.evaluate(()=>{GOGHOS.VictoryPresenter.open();});
      await page.waitForFunction(()=>GOGHOS.VictoryPresenter.getDebugState().ready,null,{timeout:20000});
      assert.equal(await page.locator('.victory-failed').count(),0);
      assert.equal(await page.locator('.victory-canvas canvas').count(),1);
      await page.screenshot({path:'/tmp/goghos-victory-v0.55.0-'+(mobile?'celular':'desktop')+'.png'});
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
      if(!mobile){
        // Both native-button input paths open the same real arena and return to the mandatory intro.
        for(const input of ['keyboard','mouse']){
          const storage=await page.evaluate(()=>JSON.stringify(localStorage));
          const play=menu.locator('button.cosmos-play');
          if(input==='keyboard'){await play.focus();await page.keyboard.press('Enter');}else await play.click();
          await page.waitForURL(/batalha\.html\?from=menu$/);
          assert.equal(await page.locator('#owned-character').count(),1);
          assert.equal(await page.locator('.lab-back').innerText(),'← Menu');
          assert.equal(await page.evaluate(()=>JSON.stringify(localStorage)),storage);
          assert.equal(await page.evaluate(()=>GOGHOS.Soundtrack.getDebugState().tracks.length),0,'A seleção de personagem inicia em silêncio.');
          await page.locator('#owned-character').selectOption({label:'Nully'});
          await page.getByRole('button',{name:'Iniciar batalha',exact:true}).click();
          assert.equal(await page.locator('[data-battle-card]').count(),8);
          assert.equal(await page.locator('[data-controller=bot]').count(),7);
          const target=await page.evaluate(()=>{
            const s=GoghosBattle.snapshot();
            return s.cards.find(c=>GoghosBattleLab.attackTarget(s,s.playerId,c.id,'player')).id;
          });
          await page.locator('[data-battle-card="'+target+'"]').click();await page.locator('.tc-atk').click();
          await page.waitForFunction(()=>GoghosBattle.snapshot().last===GoghosBattle.snapshot().playerId);
          await page.locator('.lab-back').click();await page.locator('[data-act="shell-start"]:enabled').waitFor();
          assert(await page.evaluate(()=>GOGHOS.IntroPresenter.isActive()&&document.getElementById('app').inert));
          assert.equal(await menu.locator('button.cosmos-play').count(),0,'Play só é habilitado após a abertura.');
          if(input==='keyboard'){
            await page.locator('[data-act="shell-start"]').click();await page.waitForFunction(()=>GOGHOS.IntroPresenter.getDebugState().phase==='title-ready',null,{timeout:20000});
            await page.keyboard.press('a');await page.waitForFunction(()=>!GOGHOS.IntroPresenter.isActive());
          }
        }
      }
      await page.evaluate(()=>localStorage.setItem('goghos.menu-favorite.v036','sam'));
      await page.reload();
      await page.locator('[data-act="shell-start"]:enabled').waitFor();
      assert((await menu.locator('.cosmos-favorite-image').getAttribute('src')).endsWith('character-0.webp'));
      assert.equal(await page.evaluate(()=>document.getElementById('app').inert),true,'A preferência salva não pula a abertura');
      assert.deepEqual(errors, []);
      console.log('PASS '+(mobile?'celular':'desktop')+': abertura obrigatória, música contínua, '+(mobile?'10 ícones preservados':'Play por mouse/teclado abre batalha 4×4, retorna ao menu; demais ícones decorativos')+', personagem estático, sem favorito e vitória preservada');
      await page.close();
    }
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
