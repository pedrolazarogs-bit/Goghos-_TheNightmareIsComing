// A abertura apresenta recursos reais e nunca lê ou avança a partida.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const sourcePath = path.join(__dirname, '../js/ui/intro_presenter.js');

function deferred() {
  let resolve, reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}

function setup(options = {}) {
  let clock = 0, sequence = 0;
  const timers = new Map(), globalEvents = new Map(), images = [], loaders = [], contexts = [], storage = new Map();
  const add = (map, type, fn) => {
    if (!map.has(type)) map.set(type, new Set());
    map.get(type).add(fn);
  };
  const remove = (map, type, fn) => map.get(type)?.delete(fn);
  const emit = (map, type, event) => { for (const fn of [...(map.get(type) || [])]) fn(event); };
  let document;
  function simpleMatch(node, selector) {
    selector = selector.trim();
    if (!selector) return false;
    if (selector.includes(',')) return selector.split(',').some(part => simpleMatch(node, part));
    const pieces = selector.split(/\s+(?![^[]*\])/);
    if (pieces.length > 1) {
      if (!simpleMatch(node, pieces.pop())) return false;
      let parent = node.parentElement;
      while (parent) { if (simpleMatch(parent, pieces.join(' '))) return true; parent = parent.parentElement; }
      return false;
    }
    let valid = true;
    selector = selector.replace(/:not\(([^)]+)\)/g, (_, inner) => { if (simpleMatch(node, inner)) valid = false; return ''; });
    if (selector.includes(':disabled')) { valid &&= node.disabled; selector = selector.replace(':disabled', ''); }
    const tag = selector.match(/^[a-z][a-z0-9-]*/i)?.[0];
    if (tag && node.tagName !== tag.toUpperCase()) return false;
    for (const id of selector.matchAll(/#([\w-]+)/g)) if (node.id !== id[1]) return false;
    for (const cls of selector.matchAll(/\.([\w-]+)/g)) if (!node.classList.contains(cls[1])) return false;
    for (const attr of selector.matchAll(/\[([^\s=\]]+)(?:\s*=\s*["']?([^"'\]]+)["']?)?\]/g)) {
      if (!node.hasAttribute(attr[1])) return false;
      if (attr[2] !== undefined && node.getAttribute(attr[1]) !== attr[2]) return false;
    }
    return valid;
  }
  class Element {
    constructor(tag = 'div') {
      this.tagName = tag.toUpperCase(); this.children = []; this.parentElement = null;
      this.attributes = new Map(); this.dataset = {}; this.style = { setProperty(name, value) { this[name] = value; }, removeProperty(name) { delete this[name]; } };
      this.events = new Map(); this.hidden = false; this.disabled = false; this.inert = false; this._className = ''; this.textContent = '';
      this.classList = {
        add: (...names) => { this.className = [...new Set([...this.className.split(/\s+/).filter(Boolean), ...names])].join(' '); },
        remove: (...names) => { this.className = this.className.split(/\s+/).filter(name => !names.includes(name)).join(' '); },
        contains: name => this.className.split(/\s+/).includes(name),
        toggle: (name, force) => { const value = force ?? !this.classList.contains(name); this.classList[value ? 'add' : 'remove'](name); return value; }
      };
    }
    get className() { return this._className; }
    set className(value) { this._className = value; this.attributes.set('class', value); }
    get isConnected() { return this === document.body || !!this.parentElement?.isConnected; }
    appendChild(child) { child.parentElement = this; this.children.push(child); return child; }
    append(...children) { children.forEach(child => this.appendChild(child)); }
    remove() { if (this.parentElement) this.parentElement.children = this.parentElement.children.filter(child => child !== this); this.parentElement = null; }
    setAttribute(name, value) {
      this.attributes.set(name, String(value));
      if (name === 'class') this.className = String(value);
      if (name === 'id') this.id = String(value);
      if (name === 'hidden') this.hidden = true;
      if (name === 'disabled') this.disabled = true;
      if (name === 'inert') this.inert = true;
      if (name.startsWith('data-')) this.dataset[name.slice(5).replace(/-([a-z])/g, (_, c) => c.toUpperCase())] = String(value);
    }
    getAttribute(name) { return this.attributes.get(name) ?? null; }
    hasAttribute(name) { return name === 'hidden' ? this.hidden : name === 'disabled' ? this.disabled : name === 'inert' ? this.inert : this.attributes.has(name); }
    removeAttribute(name) { this.attributes.delete(name); if (name === 'hidden') this.hidden = false; if (name === 'disabled') this.disabled = false; if (name === 'inert') this.inert = false; }
    get innerHTML() { return this._html || ''; }
    set innerHTML(html) {
      this._html = html; this.children = [];
      const stack = [this];
      for (const token of html.matchAll(/<\/?[a-z][^>]*>/gi)) {
        const text = token[0];
        if (text.startsWith('</')) { if (stack.length > 1) stack.pop(); continue; }
        const tag = text.match(/^<([a-z][a-z0-9-]*)/i)[1], node = new Element(tag);
        const attrs = text.slice(tag.length + 1, -1);
        for (const match of attrs.matchAll(/([^\s=/>]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g)) node.setAttribute(match[1], match[2] ?? match[3] ?? match[4] ?? '');
        stack.at(-1).appendChild(node);
        if (!/^(img|input|br|meta|link|hr|source)$/i.test(tag) && !text.endsWith('/>')) stack.push(node);
      }
    }
    querySelectorAll(selector) { return this.children.flatMap(child => [...(simpleMatch(child, selector) ? [child] : []), ...child.querySelectorAll(selector)]); }
    querySelector(selector) { return this.querySelectorAll(selector)[0] || null; }
    matches(selector) { return simpleMatch(this, selector); }
    closest(selector) { for (let node = this; node; node = node.parentElement) if (simpleMatch(node, selector)) return node; return null; }
    addEventListener(type, fn) { add(this.events, type, fn); }
    removeEventListener(type, fn) { remove(this.events, type, fn); }
    focus() { document.activeElement = this; }
    click() {
      if (this.disabled) return;
      const event = { target: this, isTrusted: true, preventDefault() {} };
      this.onclick?.(event);
      for (let node = this; node; node = node.parentElement) emit(node.events, 'click', event);
    }
    getBoundingClientRect() { return { x: 0, y: 0, width: 1280, height: 720 }; }
  }
  document = {
    hidden: false, events: new Map(), createElement: tag => new Element(tag),
    addEventListener(type, fn) { add(this.events, type, fn); },
    removeEventListener(type, fn) { remove(this.events, type, fn); },
    querySelector(selector) { return this.body.querySelector(selector); },
    getElementById(id) { return this.body.querySelector('#' + id); }
  };
  document.body = new Element('body'); document.documentElement = new Element('html'); document.activeElement = document.body;
  const app = new Element('div'); app.setAttribute('id', 'app'); app.inert = !!options.inert;
  const play = new Element('button'); play.setAttribute('data-act', 'play'); app.append(play); document.body.append(app);
  class Image {
    constructor() { images.push(this); }
    set src(value) { this._src = value; }
    get src() { return this._src; }
  }
  class LoadingScreen {
    constructor(opts) {
      this.o = opts; this.loading = deferred(); this.completion = deferred(); this.finished = this.completion.promise;
      this.phase = 'idle'; this.starts = 0; this.destroys = 0; this.progress = [];
      this.el = new Element('div'); opts.parent?.append(this.el); loaders.push(this);
    }
    load() { return this.loading.promise; }
    start() { this.starts++; this.phase = 'run'; return this; }
    setProgress(value) { this.progress.push(value); }
    destroy() { if (this.destroyed) return; this.destroyed = true; this.destroys++; this.phase = 'gone'; this.el.remove(); this.completion.resolve(); }
    finish() { this.phase = 'gone'; this.o.onDone?.(this); this.completion.resolve(); }
  }
  const preferences = { muted: false, volume: .4, musicMuted: false, musicVolume: .5, reducedMotion: false, ...options.preferences };
  const G = {
    CONFIG: { version: '0.36.1' }, LoadingScreen,
    battle: { round: 3, units: [{ uid: 'ally', hp: 115 }], hands: { player: ['support-1'] } },
    PresentationFX: { getPreferences: () => ({ ...preferences }), interaction() {}, stop() {} },
    Soundtrack: { setContext(name, flags) { contexts.push({ name, flags }); } },
    getNextActor() { throw Error('A abertura não pode consultar a vez'); },
    drawCard() { throw Error('A abertura não pode comprar cartas'); }
  };
  const context = {
    GOGHOS: G, document, Image, console, performance: { now: () => clock },
    localStorage: { getItem: key => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, String(value)) },
    setTimeout(fn, delay) { const id = ++sequence; timers.set(id, { fn, at: clock + delay }); return id; },
    clearTimeout: id => timers.delete(id),
    addEventListener: (type, fn) => add(globalEvents, type, fn),
    removeEventListener: (type, fn) => remove(globalEvents, type, fn),
    matchMedia: () => ({ matches: false }), Promise
  };
  vm.createContext(context); vm.runInContext(fs.readFileSync(sourcePath, 'utf8'), context);
  return {
    P: G.IntroPresenter, G, document, app, play, images, loaders, contexts, timers, storage, preferences,
    button: act => document.querySelector('[data-act="' + act + '"]'),
    flushAssets() { for (const image of images) image.onload?.(); for (const loader of loaders) loader.loading.resolve(loader); },
    advance(ms) {
      const end = clock + ms;
      for (let iteration = 0; iteration < 10000; iteration++) {
        const next = [...timers].sort((a, b) => a[1].at - b[1].at)[0];
        if (!next || next[1].at > end) { clock = end; return; }
        clock = next[1].at; timers.delete(next[0]); next[1].fn();
      }
      throw Error('Fila de timers sem limite');
    },
    key(target, key, extra = {}) { emit(target.events, 'keydown', { target, key, preventDefault() {}, ...extra }); }
  };
}

const flush = async () => { for (let iteration = 0; iteration < 8; iteration++) await Promise.resolve(); };

let passed = 0;
const test = async (name, run) => { await run(); passed++; console.log('OK  ' + name); };
const ready = async q => { q.flushAssets(); await flush(); };

(async () => {
  await test('carregar o módulo sem DOM não abre nem toca qualquer recurso', async () => {
    const context = { GOGHOS: {} };
    vm.createContext(context); vm.runInContext(fs.readFileSync(sourcePath, 'utf8'), context);
    assert.equal(context.GOGHOS.IntroPresenter.open(), false);
    assert.equal(context.GOGHOS.IntroPresenter.isActive(), false);
    assert.equal(context.GOGHOS.IntroPresenter.close(), false);
  });

  await test('a abertura aguarda recursos reais e gesto, isolando o menu sem iniciar a partida', async () => {
    const q = setup(), before = JSON.stringify(q.G.battle);
    assert.equal(q.P.open(), true);
    assert.equal(q.P.isActive(), true);
    assert.equal(q.app.inert, true);
    assert.equal(q.app.getAttribute('aria-hidden'), 'true');
    assert.equal(q.loaders.length, 1);
    assert.equal(q.images.length, 17);
    assert(q.images.every(image => /^assets\//.test(image.src)));
    assert.equal(q.contexts[0].name, 'silent');
    assert.equal(q.contexts[0].flags.immediate, true);
    assert.equal(q.button('shell-start').disabled, true);
    assert.equal(q.loaders[0].starts, 0);
    q.images[0].onload();
    assert(q.loaders[0].progress[0] > 0 && q.loaders[0].progress[0] < 1);
    for (const image of q.images.slice(1)) image.onload(); q.loaders[0].loading.resolve(q.loaders[0]); await flush();
    assert.equal(q.loaders[0].progress.at(-1), 1);
    assert.equal(q.button('shell-start').disabled, false);
    assert.equal(q.loaders[0].starts, 0, 'Carregar não deve iniciar áudio automaticamente.');
    assert.equal(q.document.activeElement, q.button('shell-start'));
    q.button('shell-start').click(); q.button('shell-start').click();
    assert.equal(q.loaders[0].starts, 1, 'O mesmo gesto não pode iniciar duas animações.');
    assert.equal(q.P.getDebugState().started, true);
    assert.equal(q.P.close(), false, 'Não é possível fechar uma animação em execução.');
    assert.equal(q.P.isActive(), true);
    q.loaders[0].finish(); await flush();
    assert.equal(JSON.stringify(q.G.battle), before);
  });

  await test('a abertura não oferece Pular nem Entrar antecipadamente e Escape não a encerra', async () => {
    const q = setup(); q.P.open();
    const dialog = q.document.querySelector('.duel-intro');
    assert.equal(q.button('shell-skip'), null);
    assert.equal(q.button('shell-enter'), null);
    assert(!/Pular abertura|Entrar no jogo/.test(dialog.innerHTML));
    for (const phase of ['carregando', 'pronta', 'executando']) {
      if (phase === 'pronta') await ready(q);
      if (phase === 'executando') q.button('shell-start').click();
      let prevented = false;
      q.key(dialog, 'Escape', { preventDefault() { prevented = true; } });
      assert.equal(prevented, true);
      assert.equal(q.P.isActive(), true, phase);
      assert.equal(q.app.inert, true, phase);
      assert.equal(q.contexts.filter(item => item.name === 'menu').length, 0, phase);
      assert.equal(q.P.close(), false, phase);
    }
    q.loaders[0].finish(); await flush();
    assert.equal(q.P.isActive(), false);
  });

  await test('o progresso acessível acompanha a animação sem liberar o menu ao chegar em 100%', async () => {
    const q = setup(); q.P.open(); await ready(q); q.button('shell-start').click();
    const loader = q.loaders[0];
    loader.o.onProgress(.46, 'run');
    assert.equal(q.document.querySelector('progress').value, 46);
    assert.equal(q.P.getDebugState().progress, .46);
    loader.o.onProgress(1, 'ready');
    assert.match(q.document.querySelector('.intro-status').textContent, /Pronto para duelar/);
    assert.equal(q.P.getDebugState().phase, 'ready');
    assert.equal(q.P.close(), false);
    assert.equal(q.P.isActive(), true, 'Ainda falta a saída natural da animação.');
    loader.finish(); await flush();
    assert.equal(q.P.isActive(), false);
  });

  await test('a intro obrigatória respeita volume, mute e movimento reduzido', async () => {
    for (const preferences of [
      { muted: false, musicMuted: false, reducedMotion: false },
      { muted: true, musicMuted: false, reducedMotion: true },
      { muted: false, musicMuted: true, reducedMotion: true }
    ]) {
      const q = setup({ preferences }); q.P.open(); const config = q.loaders[0].o;
      assert.equal(config.music, !preferences.muted && !preferences.musicMuted);
      assert.equal(config.sfx, !preferences.muted);
      assert.equal(config.volume, .2);
      assert.equal(config.sfxVolume, .4);
      assert.equal(config.reducedMotion, preferences.reducedMotion);
      assert.equal(config.version, 'Versão 0.36.1');
      assert.equal(config.base, 'assets/intro-v036/');
      assert.equal(q.P.close(), false);
      await ready(q); q.button('shell-start').click(); q.loaders[0].finish(); await flush();
    }
  });

  await test('somente a conclusão natural restaura foco e acessibilidade e libera recursos uma vez', async () => {
    const q = setup(); let closed = 0;
    q.P.open({ onClose: () => closed++ }); await ready(q); q.button('shell-start').click();
    const loader = q.loaders[0]; loader.finish(); await flush();
    assert.equal(q.P.isActive(), false);
    assert.equal(loader.destroys, 1);
    assert.equal(q.app.inert, false);
    assert.equal(q.app.hasAttribute('aria-hidden'), false);
    assert.equal(q.document.activeElement, q.play);
    assert.equal(q.timers.size, 0);
    assert(q.images.every(image => image.onload === null && image.onerror === null));
    assert.equal(q.contexts.filter(item => item.name === 'menu').length, 1);
    assert.equal(closed, 1);
    assert.equal(q.P.close(), false);
    loader.o.onDone?.(loader); await flush();
    assert.equal(closed, 1); assert.equal(loader.destroys, 1);
    assert.equal(q.storage.size, 0, 'Concluir não salva uma dispensa para a próxima abertura.');
  });

  await test('a tela reaparece em toda inicialização, mesmo com flags antigas de abertura vista', async () => {
    const q = setup();
    q.storage.set('goghos-intro-v028', 'seen'); q.storage.set('goghos-intro-v036', 'seen');
    const originalStorage = [...q.storage];
    for (let opening = 0; opening < 2; opening++) {
      assert.equal(q.P.open(), true);
      assert.equal(q.app.inert, true);
      await ready(q); q.button('shell-start').click(); q.loaders.at(-1).finish(); await flush();
      assert.equal(q.P.isActive(), false);
    }
    assert.equal(q.loaders.length, 2);
    assert.deepEqual([...q.storage], originalStorage);
  });

  await test('pedidos repetidos ou force durante a abertura não reiniciam nem cancelam a sessão', async () => {
    const q = setup(); q.P.open();
    const dialog = q.document.querySelector('.duel-intro'), loader = q.loaders[0], session = q.P.getDebugState().session;
    assert.equal(q.P.open(), true); assert.equal(q.P.open({ force: true }), true);
    assert.equal(q.loaders.length, 1); assert.equal(loader.destroys, 0);
    assert.equal(q.document.querySelector('.duel-intro'), dialog); assert.equal(q.P.getDebugState().session, session);
    await ready(q); q.button('shell-start').click(); q.P.open({ force: true });
    assert.equal(q.loaders.length, 1); assert.equal(loader.starts, 1);
    assert.equal(q.app.inert, true);
    loader.finish(); await flush();
  });

  await test('a conclusão preserva inert e aria-hidden que já existiam antes da abertura', async () => {
    const q = setup({ inert: true }); q.app.setAttribute('aria-hidden', 'previous');
    q.P.open(); const dialog = q.document.querySelector('.duel-intro');
    q.key(dialog, 'Escape'); assert.equal(q.P.isActive(), true);
    await ready(q); q.button('shell-start').click(); q.loaders[0].finish(); await flush();
    assert.equal(q.app.inert, true);
    assert.equal(q.app.getAttribute('aria-hidden'), 'previous');
    assert.equal(q.timers.size, 0);
  });

  await test('Tab mantém o foco dentro da abertura antes e durante a animação', async () => {
    const q = setup(); q.P.open(); await ready(q);
    const dialog = q.document.querySelector('.duel-intro'), start = q.button('shell-start');
    for (const shiftKey of [false, true]) {
      q.key(dialog, 'Tab', { target: start, shiftKey });
      assert.equal(q.document.activeElement, start);
    }
    start.click();
    assert(q.document.activeElement.closest('.duel-intro'), 'O foco não pode voltar ao menu inerte.');
    let prevented = false;
    q.key(dialog, 'Tab', { target: q.document.activeElement, preventDefault() { prevented = true; } });
    assert.equal(prevented, true, 'Sem controles visíveis, Tab permanece no diálogo.');
    assert(q.document.activeElement.closest('.duel-intro'));
    q.loaders[0].finish(); await flush();
  });

  await test('falha de arte oferece tentar novamente e mantém o menu bloqueado até recuperar a intro', async () => {
    const q = setup(); q.P.open(); const originalDialog = q.document.querySelector('.duel-intro');
    q.loaders[0].loading.reject(Error('Falha de imagem')); await flush();
    assert.equal(q.P.isActive(), true);
    assert.equal(q.app.inert, true);
    assert.equal(q.button('shell-enter'), null);
    assert.equal(q.button('shell-retry').hidden, false);
    assert.equal(q.loaders[0].starts, 0);
    assert.equal(q.P.close(), false);
    q.button('shell-retry').click();
    assert.equal(q.loaders.length, 2);
    assert.equal(q.document.querySelector('.duel-intro'), originalDialog);
    assert.equal(q.app.inert, true);
    await ready(q); q.button('shell-start').click(); q.loaders[1].finish(); await flush();
    assert.equal(q.P.isActive(), false);
    assert.equal(q.app.inert, false);
  });

  await test('timeout de carregamento só permite tentar novamente e nunca oferece uma saída antecipada', async () => {
    const q = setup(); q.P.open(); q.advance(8000);
    assert.equal(q.P.isActive(), true);
    assert.equal(q.app.inert, true);
    assert.equal(q.button('shell-enter'), null);
    assert.equal(q.button('shell-retry').hidden, false);
    assert.equal(q.loaders[0].starts, 0);
    assert.equal(q.P.close(), false);
    q.advance(120000);
    assert.equal(q.P.isActive(), true);
    q.button('shell-retry').click(); await ready(q);
    q.button('shell-start').click(); q.loaders.at(-1).finish(); await flush();
    assert.equal(q.P.isActive(), false);
  });

  await test('callbacks tardios da tentativa anterior não liberam ou alteram a nova tentativa', async () => {
    const q = setup(); q.P.open();
    const old = q.loaders[0], lateImage = q.images[0].onload;
    q.advance(8000); q.button('shell-retry').click();
    const next = q.loaders[1], debug = q.P.getDebugState().session;
    old.loading.resolve(old); lateImage(); old.o.onProgress(.99, 'ready'); old.o.onDone?.(old); old.completion.resolve(); await flush();
    assert.equal(q.P.isActive(), true);
    assert.equal(q.P.getDebugState().session, debug);
    assert.equal(q.P.getDebugState().loaded, false);
    assert.equal(q.button('shell-start').disabled, true);
    assert.equal(next.starts, 0);
    for (const image of q.images.slice(17)) image.onload?.(); next.loading.resolve(next); await flush();
    assert.equal(q.button('shell-start').disabled, false);
    q.button('shell-start').click(); assert.equal(next.starts, 1);
    next.finish(); await flush();
  });

  await test('conclusão recebida antes do início não permite contornar a tela obrigatória', async () => {
    const q = setup(); q.P.open(); await ready(q);
    q.loaders[0].o.onDone?.(q.loaders[0]); q.loaders[0].completion.resolve(); await flush();
    assert.equal(q.P.isActive(), true);
    assert.equal(q.app.inert, true);
    assert.equal(q.P.close(), false);
    assert.equal(q.contexts.filter(item => item.name === 'menu').length, 0);
  });

  console.log(`${passed} testes da integração da abertura obrigatória passaram`);
})().catch(error => { console.error(error); process.exitCode = 1; });
