// Execute npm run dev antes deste teste; requer Playwright e Chromium.
const assert = require('node:assert/strict');
const { chromium } = require('playwright');

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
      assert.equal(await menu.locator('button,a,[role="button"],[data-act],[data-cosmos-favorite],[tabindex="0"]').count(),0);
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
      await page.screenshot({path:'/tmp/goghos-menu-v0.39.0-'+(mobile?'celular':'desktop')+'.png'});
      // Verify the preserved animation directly; no menu control opens it.
      await page.evaluate(()=>{GOGHOS.VictoryPresenter.open();});
      await page.waitForFunction(()=>GOGHOS.VictoryPresenter.getDebugState().ready,null,{timeout:20000});
      assert.equal(await page.locator('.victory-failed').count(),0);
      assert.equal(await page.locator('.victory-canvas canvas').count(),1);
      await page.screenshot({path:'/tmp/goghos-victory-v0.39.0-'+(mobile?'celular':'desktop')+'.png'});
      await page.locator(mobile?'[data-victory="play"]':'[data-victory="menu"]').click();
      await page.waitForFunction(()=>!GOGHOS.VictoryPresenter.getDebugState().active);
      assert.equal(await menu.count(),1);
      assert.equal(await page.locator('[role="dialog"]').count(),0);
      assert.equal(await page.evaluate(()=>document.getElementById('app').inert),false);
      assert.equal(await page.evaluate(()=>JSON.stringify(localStorage)),baseline.storage);
      await page.waitForFunction(()=>GOGHOS.Soundtrack.getDebugState().activeTrack==='menu'&&GOGHOS.Soundtrack.getDebugState().playing);
      await page.emulateMedia({reducedMotion:'reduce'});
      await page.waitForFunction(()=>document.querySelector('.cosmos-menu').classList.contains('cosmos-reduced'));
      assert.deepEqual(errors, []);
      console.log('PASS '+(mobile?'celular':'desktop')+': abertura obrigatória, música contínua, 10 controles sem acessos e animação de vitória preservada');
      await page.close();
    }
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
