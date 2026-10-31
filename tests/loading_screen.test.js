// A abertura recebida apresenta o carregamento; ela nunca participa do combate.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const crypto = require('node:crypto');
const source = fs.readFileSync(path.join(__dirname, '../js/ui/loading_screen.js'), 'utf8');
let passed = 0;
const test = async (name, fn) => { await fn(); passed++; console.log('OK  ' + name); };

function stage(options = {}) {
  let now = 1000, serial = 0;
  const frames = new Map(), timers = new Map(), trace = [], media = [], audio = [], pendingImages = [];
  class Target {
    constructor() { this.listeners = new Map(); }
    addEventListener(type, fn) { if (!this.listeners.has(type)) this.listeners.set(type, new Set()); this.listeners.get(type).add(fn); }
    removeEventListener(type, fn) { this.listeners.get(type)?.delete(fn); }
    emit(type) { for (const fn of [...(this.listeners.get(type) || [])]) fn({ type }); }
    listenerCount() { return [...this.listeners.values()].reduce((n, set) => n + set.size, 0); }
  }
  const gradient = { addColorStop() {} };
  const graphics = () => new Proxy({}, {
    get(object, key) {
      if (key === 'measureText') return text => ({ width: text.length * 12 });
      if (String(key).startsWith('create')) return () => gradient;
      if (key in object) return object[key];
      return (...args) => trace.push([key, ...args.map(v => typeof v === 'object' ? 'object' : v)]);
    },
    set(object, key, value) { object[key] = value; trace.push(['set', key, value]); return true; }
  });
  class Element extends Target {
    constructor() { super(); this.style = {}; this.children = []; this.isConnected = false; this.g = graphics(); }
    appendChild(child) { this.children.push(child); child.parent = this; child.isConnected = true; }
    remove() { this.isConnected = false; if (this.parent) this.parent.children = this.parent.children.filter(c => c !== this); }
    getContext() { return this.g; }
    getBoundingClientRect() { return { width: 1280, height: 720 }; }
  }
  class Image {
    set src(value) { this._src = value; if (!value) return; const finish = () => value.includes('bad') ? this.onerror?.() : this.onload?.(); if (options.deferImages) pendingImages.push(finish); else Promise.resolve().then(finish); }
    get src() { return this._src; }
  }
  class FontFace { async load() { return this; } }
  class Audio extends Target {
    constructor(src) { super(); Object.assign(this, { src, currentTime: 0, volume: 0, paused: true, readyState: 4, duration: 60, released: false }); media.push(this); }
    play() {
      if (options.refuseAudio) return Promise.reject(Error('Autoplay bloqueado'));
      this.paused = false;
      if (options.stallAudio) return new Promise(() => {});
      Promise.resolve().then(() => this.emit('playing')); return Promise.resolve();
    }
    pause() { this.paused = true; }
    removeAttribute(name) { if (name === 'src') this.src = ''; }
    load() { this.released = true; }
  }
  const param = () => ({ value: 0, setValueAtTime() {}, exponentialRampToValueAtTime() {} });
  class AudioContext {
    constructor() { this.destination = {}; this.sampleRate = 10; this.closed = false; this.suspended = false; audio.push(this); }
    get currentTime() { return now / 1000; }
    createGain() { return { gain: param(), connect() {} }; }
    createBuffer() { return { getChannelData: () => new Float32Array(10) }; }
    createOscillator() { return { frequency: param(), connect() {}, start() {}, stop() {} }; }
    createBufferSource() { return { connect() {}, start() {}, stop() {} }; }
    createBiquadFilter() { return { frequency: param(), Q: {}, connect() {} }; }
    resume() { this.suspended = false; return Promise.resolve(); }
    suspend() { this.suspended = true; return Promise.resolve(); }
    close() { this.closed = true; return Promise.resolve(); }
  }
  const document = Object.assign(new Target(), { hidden: false, body: new Element(), fonts: new Set(), createElement: () => new Element() });
  const root = Object.assign(new Target(), {
    document, Image, FontFace, Audio, AudioContext, innerWidth: 1280, innerHeight: 720, devicePixelRatio: 1,
    performance: { now: () => now }, console, Math, Promise,
    requestAnimationFrame(fn) { const id = ++serial; frames.set(id, fn); return id; },
    cancelAnimationFrame(id) { frames.delete(id); },
    setTimeout(fn, delay) { const id = ++serial; timers.set(id, { fn, at: now + delay }); return id; },
    clearTimeout(id) { timers.delete(id); }
  });
  root.addEventListener = root.addEventListener.bind(root); root.removeEventListener = root.removeEventListener.bind(root);
  root.window = root; vm.createContext(root); vm.runInContext(source, root);
  const make = opts => new root.GOGHOS.LoadingScreen({ base: 'assets/intro-v036/', music: false, sfx: false, ...opts });
  async function advance(ms) {
    const end = now + ms;
    while (now < end) {
      const step = Math.min(16, end - now); now += step;
      for (const m of media) if (!m.paused && !options.stallAudio) m.currentTime += step / 1000;
      for (const [id, task] of [...timers]) if (task.at <= now) { timers.delete(id); task.fn(); }
      const jobs = [...frames]; frames.clear(); for (const [, fn] of jobs) fn(now);
      await Promise.resolve();
    }
  }
  return { make, root, document, frames, timers, trace, media, audio, pendingImages, advance, now: () => now };
}

(async () => {
  await test('as cinco artes, fonte e música extraídas correspondem ao manifesto do arquivo recebido', () => {
    const folder = path.join(__dirname, '../assets/intro-v036');
    const manifest = JSON.parse(fs.readFileSync(path.join(folder, 'manifest.json')));
    assert.match(manifest.source_sha256, /^[a-f0-9]{64}$/); assert.equal(manifest.assets.length, 5);
    for (const entry of manifest.assets) { const bytes = fs.readFileSync(path.join(folder, entry.file)); assert.equal(bytes.length, entry.bytes); assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'), entry.sha256); }
    assert.deepEqual(fs.readFileSync(path.join(folder, 'german_beauty.ttf')), fs.readFileSync(path.join(__dirname, '../assets/fonts/german_beauty.ttf')));
  });
  await test('o primeiro quadro pode preceder start sem tempo negativo, exceção ou tela branca', async () => {
    const s = stage(), c = s.make(); await c.load(); c.start();
    const jobs = [...s.frames.values()]; s.frames.clear(); for (const draw of jobs) draw(s.now() - 12);
    assert.equal(c.t, 0); assert(s.trace.some(t => t[0] === 'drawImage')); assert.equal(c.phase, 'run'); c.destroy();
  });
  await test('destruir durante o carregamento cancela imagens, resolve finished e não inicia áudio ou onDone', async () => {
    const s = stage({ deferImages: true }); let done = 0; const c = s.make({ music: true, onDone: () => done++ });
    const loading = c.load(); c.destroy(); c.destroy(); await loading; await c.finished;
    assert.equal(s.media.length, 0); assert.equal(done, 0); assert.equal(c.el.isConnected, false); assert.equal(s.root.listenerCount(), 0); assert.equal(s.document.listenerCount(), 0); assert.equal(s.document.fonts.size, 0);
  });
  await test('cancelar uma intro ativa encerra música, contexto de som, RAF, timers e ouvintes uma única vez', async () => {
    const s = stage(); let done = 0; const c = s.make({ music: true, sfx: true, onDone: () => done++ }); await c.load(); c.start(); await Promise.resolve(); c.fadeOutMusic();
    c.destroy(); c.destroy(); await c.finished;
    assert.equal(s.media[0].paused, true); assert.equal(s.media[0].released, true); assert.equal(s.media[0].listenerCount(), 0); assert.equal(s.audio[0].closed, true); assert.equal(s.frames.size, 0); assert.equal(s.timers.size, 0); assert.equal(s.root.listenerCount(), 0); assert.equal(s.document.listenerCount(), 0); assert.equal(s.document.fonts.size, 0); assert.equal(done, 0);
  });
  await test('a conclusão natural preserva a duração normal e limpa recursos antes de avisar o menu', async () => {
    const s = stage(), progress = []; let done = 0;
    const c = s.make({ music: true, sfx: true, onProgress: (p, phase) => progress.push([p, phase]), onDone: () => { done++; assert.equal(c.el.isConnected, false); assert.equal(s.media[0].paused, true); assert.equal(s.audio[0].closed, true); } });
    await c.load(); c.start(); c.complete(); await s.advance(9000); assert.notEqual(c.phase, 'gone'); await s.advance(5000); await c.finished;
    assert.equal(done, 1); assert.deepEqual(progress.at(-1), [1, 'gone']); assert.equal(s.frames.size, 0); assert.equal(s.timers.size, 0); c.destroy(); assert.equal(done, 1);
  });
  await test('movimento reduzido conserva uma imagem estática e termina em menos de um segundo sem impactos', async () => {
    const s = stage(), c = s.make({ reducedMotion: true, sfx: true }); await c.load(); c.setProgress(.5); c.start();
    s.trace.length = 0; c.renderAt(2.1, .5); const first = JSON.stringify(s.trace); s.trace.length = 0; c.renderAt(5, .5); assert.equal(JSON.stringify(s.trace), first);
    assert.equal(s.trace.some(t => t[0] === 'set' && t[1] === 'globalCompositeOperation' && t[2] === 'difference'), false); assert.equal(s.audio.length, 0);
    c.complete(); await s.advance(900); assert.equal(c.phase, 'gone'); assert.equal(s.frames.size, 0);
  });
  await test('áudio recusado ou sem reprodução não prende o relógio nem a conclusão da abertura', async () => {
    for (const options of [{ refuseAudio: true }, { stallAudio: true }]) {
      const s = stage(options), c = s.make({ music: true, hit: 0, minDuration: 0 }); await c.load(); c.start(); c.complete(); await Promise.resolve(); await s.advance(7000); await c.finished;
      assert.equal(c.phase, 'gone'); assert.equal(s.media[0].paused, true); assert.equal(s.frames.size, 0); assert.equal(s.timers.size, 0);
    }
  });
  await test('ocultar a página pausa áudio e relógio e voltar não pula o tempo da animação', async () => {
    const s = stage(), c = s.make({ music: true, sfx: true }); await c.load(); c.start(); await Promise.resolve(); await s.advance(300); const before = c.t;
    s.document.hidden = true; s.document.emit('visibilitychange'); await s.advance(2000);
    assert.equal(c.t, before); assert.equal(s.media[0].paused, true); assert.equal(s.audio[0].suspended, true);
    s.document.hidden = false; s.document.emit('visibilitychange'); await s.advance(64);
    assert(c.t >= before && c.t - before < .12); assert.equal(s.media[0].paused, false); assert.equal(s.audio[0].suspended, false); c.destroy();
  });
  await test('falhas de imagem e de promessas rastreadas são devolvidas sem criar rejeições destacadas', async () => {
    const s = stage(), errors = []; const c = s.make({ assets: { bg: 'bad.webp' }, onError: error => errors.push(error.message) });
    await assert.rejects(c.load(), /Falha ao carregar/); assert.equal(errors.length, 1); c.destroy();
    const other = s.make(); await assert.rejects(other.track([Promise.reject(Error('recurso indisponível'))]), /recurso indisponível/); assert.equal(other.real, 1); other.destroy();
  });
  console.log(`${passed} testes da abertura enviada passaram`);
})().catch(error => { console.error(error); process.exitCode = 1; });
