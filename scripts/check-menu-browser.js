// Optional visual-state regression. Requires Playwright and npm run dev.
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium', args: ['--no-sandbox'] });
  try {
    for (const viewport of [{ width: 1366, height: 768 }, { width: 390, height: 844 }]) {
      const page = await browser.newPage({ viewport });
      const errors = [];
      page.on('pageerror', error => errors.push(String(error)));
      await page.goto(process.env.TEST_URL || 'http://127.0.0.1:8000');
      // Isolate menu states; the mandatory intro has its own end-to-end regression.
      await page.evaluate(() => {
        document.querySelector('.duel-intro')?.remove();
        document.querySelector('#app').inert = false;
        GOGHOS.CosmosMenu.mount(document.querySelector('#app'));
      });
      await page.waitForTimeout(2300);
      const buttons = await page.locator('.cosmos-menu button').all();
      assert(buttons.length >= 10);
      for (const button of buttons) {
        for (const state of ['hover', 'active', 'focus']) {
          if (state === 'hover') await button.hover();
          if (state === 'active') await page.mouse.down();
          if (state === 'focus') {
            await page.mouse.move(0, 0);
            await page.mouse.up();
            await page.keyboard.press('Tab');
            await button.focus();
          }
          await page.waitForTimeout(250);
          const style = await button.evaluate(element => {
            const s = getComputedStyle(element);
            return { background: s.backgroundColor, image: s.backgroundImage, shadow: s.boxShadow, border: s.borderWidth, outline: s.outlineStyle };
          });
          assert.deepEqual(style, { background: 'rgba(0, 0, 0, 0)', image: 'none', shadow: 'none', border: '0px', outline: 'none' }, state + ' ' + await button.getAttribute('class'));
        }
      }
      await page.mouse.move(0, 0);
      await page.screenshot({ path: '/tmp/menu-v0362-' + viewport.width + '.png' });
      const previous = await page.locator('.cosmos-favorite-label strong').textContent();
      await page.locator('[data-cosmos-favorite]').click();
      await page.waitForFunction(name => document.querySelector('.cosmos-favorite-label strong').textContent !== name, previous);
      await page.locator('.cosmos-settings').click();
      await page.locator('.settings-page').waitFor();
      assert.deepEqual(errors, []);
      console.log('PASS v0.36.2: ' + buttons.length + ' controls, hover/active/keyboard focus, favorite and settings at ' + viewport.width + 'px');
      await page.close();
    }
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
