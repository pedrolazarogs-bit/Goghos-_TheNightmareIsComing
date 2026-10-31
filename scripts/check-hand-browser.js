'use strict';

// Regressão opcional de navegador: usa cliques reais para detectar sobreposições
// que os testes de HTML não enxergam. Não altera os arquivos servidos do jogo.
// Requer Playwright disponível no ambiente; não é uma dependência do jogo.
// Inicie `npm run dev` e execute `node scripts/check-hand-browser.js`.
// TEST_URL escolhe outro servidor; CHROMIUM_PATH escolhe um Chromium local.
// Sem CHROMIUM_PATH, usa o navegador instalado pelo próprio Playwright.
const assert = require('node:assert/strict');

let chromium;
try {
  ({ chromium } = require('playwright'));
} catch (error) {
  if (error.code !== 'MODULE_NOT_FOUND') throw error;
  console.error('Este teste opcional precisa do Playwright disponível no ambiente. O jogo e npm test funcionam sem ele.');
  process.exit(1);
}

const baseURL = process.env.TEST_URL || 'http://127.0.0.1:8000';
const viewports = [
  { width: 1280, height: 720 },
  { width: 1024, height: 768 },
  { width: 390, height: 844 }
];

async function fixture(page, options = {}) {
  return page.evaluate(options => {
    const G = globalThis.GOGHOS;
    const test = G.__handBrowserTest;
    test.wipe();
    const actorId = options.actor || 'ddx';
    const state = G.createBattleState(
      { front: [actorId, 'mike'], rear: [] },
      { front: ['john'], rear: [] },
      [],
      { rng: () => 0.5, roll: () => 6 }
    );
    state.abilityChoices = [];
    state.openingAbilities = false;
    state.acted = {};
    const actor = state.units.find(unit => unit.id === actorId);
    if (options.paralyzed) actor.paralysis = 2;
    state.order = [actor.uid, ...state.order.filter(uid => uid !== actor.uid)];
    state.deck.hands.player = [];
    if (options.support) {
      const index = state.deck.pile.findIndex(card => card.id === options.support);
      if (index < 0) throw new Error('Apoio ausente no monte: ' + options.support);
      state.deck.hands.player.push(state.deck.pile.splice(index, 1)[0]);
    } else {
      for (let index = 0; index < 5; index++) G.drawCard(state, 'player');
    }
    if (options.replacement) {
      state.deck.pendingChoice = {
        side: 'player', incoming: state.deck.pile.pop(), round: state.round
      };
    }
    Object.assign(test.ui, {
      state, actor, busy: false, paused: false, drawer: null,
      target: null, healTarget: null, handIid: null, attackMode: 'normal',
      abilityOptions: false, abilityActor: null, move: false, swapPick: null
    });
    test.render(actor);
    return {
      actorUid: actor.uid,
      hand: state.deck.hands.player.map(card => card.iid),
      incoming: state.deck.pendingChoice?.incoming.iid
    };
  }, options);
}

async function snapshot(page) {
  return page.evaluate(() => {
    const G = globalThis.GOGHOS;
    const { ui } = G.__handBrowserTest;
    const state = ui.state;
    return {
      drawer: ui.drawer,
      selected: ui.handIid,
      hand: state.deck.hands.player.map(card => card.iid),
      pending: !!state.deck.pendingChoice,
      discarded: state.deck.discard.map(card => card.iid),
      lucky: G.teamSupport(state, 'player').lucky,
      paralysis: ui.actor?.paralysis,
      acted: !!state.acted[ui.actor?.uid]
    };
  });
}

async function activate(locator, input) {
  if (input === 'mouse') return locator.click();
  if (input === 'touch') return locator.tap();
  await locator.focus();
  return locator.press('Enter');
}

async function checkViewport(browser, viewport) {
  const context = await browser.newContext({
    viewport, hasTouch: true, reducedMotion: 'reduce'
  });
  const errors = [];
  let checks = 0;
  try {
    await context.addInitScript(() => {
      localStorage.setItem('goghos.presentation.v1', JSON.stringify({
        muted: true, musicMuted: true, motion: 'reduced'
      }));
    });
    // Expõe o controlador somente na resposta interceptada deste navegador de QA.
    await context.route('**/js/ui/ui.js', async route => {
      const response = await route.fetch();
      const source = await response.text();
      const marker = 'G.PresentationFX?.init();';
      assert.ok(source.includes(marker), 'O ponto de instrumentação da interface mudou.');
      await route.fulfill({
        response,
        body: source.replace(marker, 'G.__handBrowserTest={ui,render,wipe};' + marker)
      });
    });
    const page = await context.newPage();
    page.setDefaultTimeout(5000);
    page.on('pageerror', error => errors.push(error.message));
    page.on('response', response => {
      if (response.status() >= 400) errors.push(response.status() + ' ' + response.url());
    });
    await page.goto(baseURL, { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);
    // A abertura é obrigatória também na QA: aguarda a conclusão em movimento reduzido.
    await page.locator('[data-act="shell-start"]').click();
    await page.locator('.duel-intro').waitFor({ state: 'detached' });

    // O Fighter possui habilidade selecionável; a Maga também tem controles de
    // Mana. Os espaços transparentes desses comandos devem deixar a mão acessível.
    for (const actor of ['ddx', 'eletric']) {
      for (const input of ['mouse', 'touch', 'keyboard']) {
        const initial = await fixture(page, { actor });
        for (let index = 0; index < initial.hand.length; index++) {
          const card = page.locator('[data-hand]').nth(index);
          await activate(card, input);
          const current = await snapshot(page);
          assert.equal(current.drawer, 'hand', actor + '/' + input + ': a carta precisa abrir.');
          assert.equal(current.selected, initial.hand[index]);
          assert.equal(current.acted, false, 'Consultar a mão não deve gastar a ação.');
          await page.locator('[data-act="close-drawer"]').click();
          checks++;
        }
      }
    }

    // Apoios continuam utilizáveis quando o personagem da vez está imobilizado.
    await fixture(page, { paralyzed: true, support: 'sortudo' });
    await page.locator('[data-hand]').click();
    assert.equal(await page.locator('[data-act="usehand"]').isEnabled(), true);
    await page.locator('[data-act="usehand"]').click();
    const used = await snapshot(page);
    assert.equal(used.lucky, 1);
    assert.equal(used.hand.length, 0);
    assert.equal(used.paralysis, 2, 'O Apoio não pode remover a paralisia.');
    checks++;

    // Cada carta antiga deve poder ser escolhida, inclusive a última do leque.
    for (let index = 0; index < 5; index++) {
      const initial = await fixture(page, { replacement: true });
      await page.locator('[data-hand]').nth(index).click();
      const current = await snapshot(page);
      assert.equal(current.pending, false);
      assert.equal(current.hand.length, 5);
      assert.ok(current.hand.includes(initial.incoming));
      assert.ok(!current.hand.includes(initial.hand[index]));
      assert.ok(current.discarded.includes(initial.hand[index]));
      checks++;
    }
    const initial = await fixture(page, { replacement: true });
    await page.locator('[data-act="keep-new"]').click();
    const kept = await snapshot(page);
    assert.equal(kept.pending, false);
    assert.deepEqual(kept.hand, initial.hand);
    assert.ok(kept.discarded.includes(initial.incoming));
    checks++;

    assert.deepEqual(errors, [], 'Não deve haver erros de JavaScript ou carregamento.');
    console.log('OK ' + viewport.width + '×' + viewport.height + ': ' + checks + ' cenários.');
    return checks;
  } finally {
    await context.close();
  }
}

async function main() {
  const launch = { headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage'] };
  if (process.env.CHROMIUM_PATH) launch.executablePath = process.env.CHROMIUM_PATH;
  const browser = await chromium.launch(launch);
  let total = 0;
  try {
    for (const viewport of viewports) total += await checkViewport(browser, viewport);
    console.log('Mão validada: ' + total + ' cenários com mouse, toque e teclado.');
  } finally {
    await browser.close();
  }
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
