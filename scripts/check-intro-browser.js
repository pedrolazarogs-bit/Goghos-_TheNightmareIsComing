// Optional regression: start npm run dev, then run this with Playwright installed.
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
      assert.deepEqual(errors, []);
      console.log('PASS loading -> title -> ' + (mobile ? 'touch' : 'key') + ' -> menu');
      await page.close();
    }
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
