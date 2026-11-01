// Adapted from the supplied goghos-intro-previa.html.
(function(G){
'use strict';

/*!
 * GOGHOS — Intro / tela de título "The Nightmare is Coming"
 * ---------------------------------------------------------------------------
 * Módulo único, sem dependências, canvas 2D. Usa EXATAMENTE as ilustrações do
 * projeto (fundo, logo em camadas, BETA) e a fonte German Beauty.
 *
 *   import { GoghosIntro } from './goghos-intro.js';
 *   const intro = new GoghosIntro({ baseUrl: './assets/' });
 *   await intro.load();
 *   intro.start();                       // idealmente dentro de um toque/tecla
 *   intro.track(carregarOJogo());        // ou setProgress(0..1) + complete()
 *   await intro.finished;                // resolve quando a saída termina
 *
 * COMO O TEMPO FUNCIONA
 *   Tudo é função do tempo `t` (segundos desde o início da intro), com
 *   aleatoriedade de semente fixa: o mesmo `t` sempre desenha o mesmo quadro.
 *   O golpe (impacto) acontece em t = hitTime. Com música, o relógio é
 *   ancorado no áudio (com correção suave de deriva); sem música, usa o
 *   relógio do navegador.
 */

// ============================================================================
//  Utilidades matemáticas
// ============================================================================
const TAU = Math.PI * 2;
const clamp = (x, a = 0, b = 1) => (x < a ? a : x > b ? b : x);
const lerp = (a, b, t) => a + (b - a) * t;
const prog = (t, a, b) => clamp((t - a) / (b - a));
const smooth = (x) => { x = clamp(x); return x * x * (3 - 2 * x); };
const easeOutCubic = (x) => 1 - Math.pow(1 - clamp(x), 3);
const easeInCubic = (x) => { x = clamp(x); return x * x * x; };
const easeInQuad = (x) => { x = clamp(x); return x * x; };
const easeOutQuad = (x) => { x = clamp(x); return 1 - (1 - x) * (1 - x); };
const easeInOutCubic = (x) => { x = clamp(x); return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
const easeOutBack = (x, s = 1.70158) => { x = clamp(x) - 1; return 1 + (s + 1) * x * x * x + s * x * x; };
const easeInBack = (x, s = 1.70158) => { x = clamp(x); return (s + 1) * x * x * x - s * x * x; };
const easeOutElastic = (x) => {
  x = clamp(x);
  return x === 0 ? 0 : x === 1 ? 1 : Math.pow(2, -10 * x) * Math.sin((x * 10 - 0.75) * (TAU / 3)) + 1;
};

/** Gerador pseudo-aleatório com semente (mulberry32). */
function mulberry32(seed) {
  let a = seed | 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
/** Hash determinístico de inteiro -> [0,1). Usado no "traço tremendo" (8 quadros/s). */
function hash01(n) {
  n = (n ^ 61) ^ (n >>> 16);
  n = (n + (n << 3)) | 0;
  n ^= n >>> 4;
  n = Math.imul(n, 0x27d4eb2d);
  n ^= n >>> 15;
  return (n >>> 0) / 4294967296;
}
/** Ruído suave de soma de senos (tremor de câmera), valor em ~[-1,1]. */
const wob = (x, s) => Math.sin(x + s) * 0.55 + Math.sin(x * 1.73 + s * 3.1) * 0.3 + Math.sin(x * 2.91 + s * 0.7) * 0.15;

const COL = {
  cream: '#ffe9a8', cream2: '#fff3c9', pink: '#ff4fa3', hot: '#ff2e93', cyan: '#5de6ff',
  violet: '#b78cff', mint: '#7cffb2', yellow: '#ffd84d', ink: '#14101c', white: '#ffffff',
};
const CONFETTI_COLORS = [COL.pink, COL.yellow, COL.cyan, COL.white, COL.violet, COL.mint, COL.cream];

// ============================================================================
//  Medidas extraídas da referência 1920x1080 (ver README)
// ============================================================================
const REF = {
  bgScale: 1.3714,                 // escala do fundo (1536x1024) na referência
  bgSunImg: { x: 766, y: 494 },    // centro do sol dentro da imagem de fundo
  sun: { x: 979.3, y: 538.2 },     // onde o sol cai na tela de referência
  logo: { cx: 952.8, cy: 393.1, k: 0.384 },       // centro do conteúdo do logo e escala
  beta: { w: 138, h: 109.2, right: 34.8, top: 23 },
  prompt: { inkW: 467, inkTop: 909, cx: 946 },     // tinta do "Press any key to continue."
  version: { inkW: 117.5, right: 20.2, baseFromBottom: 11.2 },
};
const LOGO_C = { cx: 1028.5, cy: 1017.5, w: 1672, h: 1408 };   // conteúdo do logo.png (2048x2048)
const SPARKS = [   // faíscas pintadas no logo (coordenadas do logo.png) — {x,y,r}
  { x: 565, y: 414, r: 54 }, { x: 1652, y: 428, r: 62 }, { x: 445, y: 681, r: 38 },
  { x: 1025, y: 383, r: 34 }, { x: 1105, y: 610, r: 26 },
];

// ============================================================================
//  Opções padrão
// ============================================================================
const DEFAULTS = {
  container: null,               // elemento onde a tela entra (padrão: document.body, tela cheia)
  baseUrl: './assets/',
  assets: {                      // URLs individuais (aceita data: URI). `camadas` também aceita objeto.
    fundo: 'fundo.jpg', atlas: 'logo_camadas.png', camadas: {"fonte": "logo.png", "logoSize": [2048, 2048], "escalaAtlas": 1.0, "atlas": [2048, 3167], "conteudo": {"x": 193, "y": 314, "w": 1672, "h": 1408, "cx": 1028.5, "cy": 1017.5}, "camadas": [{"id": "placa", "x": 198.0, "y": 289.0, "w": 1662.0, "h": 1427.0, "ax": 0, "ay": 0, "aw": 1662, "ah": 1427}, {"id": "goghos", "x": 349.0, "y": 289.0, "w": 1358.0, "h": 538.0, "ax": 527, "ay": 1431, "aw": 1358, "ah": 538}, {"id": "flor", "x": 387.0, "y": 458.0, "w": 113.0, "h": 113.0, "ax": 0, "ay": 3050, "aw": 113, "ah": 113}, {"id": "the", "x": 851.0, "y": 700.0, "w": 257.0, "h": 209.0, "ax": 1073, "ay": 2586, "aw": 257, "ah": 209}, {"id": "n0", "x": 193.0, "y": 571.0, "w": 321.0, "h": 1151.0, "ax": 0, "ay": 1431, "aw": 321, "ah": 1151}, {"id": "i1", "x": 471.0, "y": 881.0, "w": 119.0, "h": 526.0, "ax": 1889, "ay": 1431, "aw": 119, "ah": 526}, {"id": "g2", "x": 557.0, "y": 899.0, "w": 189.0, "h": 460.0, "ax": 0, "ay": 2586, "aw": 189, "ah": 460}, {"id": "h3", "x": 725.0, "y": 899.0, "w": 207.0, "h": 420.0, "ax": 405, "ay": 2586, "aw": 207, "ah": 420}, {"id": "t4", "x": 900.0, "y": 908.0, "w": 185.0, "h": 383.0, "ax": 884, "ay": 2586, "aw": 185, "ah": 383}, {"id": "m5", "x": 1050.0, "y": 897.0, "w": 264.0, "h": 411.0, "ax": 616, "ay": 2586, "aw": 264, "ah": 411}, {"id": "a6", "x": 1258.0, "y": 897.0, "w": 208.0, "h": 445.0, "ax": 193, "ay": 2586, "aw": 208, "ah": 445}, {"id": "r7", "x": 1432.0, "y": 874.0, "w": 198.0, "h": 541.0, "ax": 325, "ay": 1431, "aw": 198, "ah": 541}, {"id": "e8", "x": 1592.0, "y": 539.0, "w": 274.0, "h": 1173.0, "ax": 1666, "ay": 0, "aw": 274, "ah": 1173}, {"id": "is", "x": 698.0, "y": 1340.0, "w": 141.0, "h": 172.0, "ax": 1794, "ay": 2586, "aw": 141, "ah": 172}, {"id": "coming", "x": 851.0, "y": 1322.0, "w": 456.0, "h": 201.0, "ax": 1334, "ay": 2586, "aw": 456, "ah": 201}]},
    beta: 'beta.png', fonte: 'german_beauty.ttf',
  },
  fontFamily: 'German Beauty',
  music: null,                   // string (URL) ou { src, hitTime, bpm, volume, loop }
  hitTime: 2.6,                  // instante do golpe (s). Com música, use o do 1º golpe da faixa.
  bpm: 100,                      // pulsos por minuto depois do golpe
  sfx: true,                     // efeitos sintetizados discretos (false desliga)
  gate: 'auto',                  // 'auto' | true | false — tela de "toque para começar" antes do áudio
  minDuration: null,             // duração mínima da intro (s); padrão: hitTime + 2.4
  texts: { prompt: 'Press any key to continue.', gate: 'Press any key to start.', version: 'Versão 0.1.0' },
  showBeta: true,
  seed: 1031,
  maxDpr: 2,
  reducedMotion: 'auto',         // 'auto' respeita prefers-reduced-motion; true/false força
  zIndex: 9999,
  onReady: null,                 // chamado quando "Press any key" aparece
  onFinished: null,              // chamado quando a saída termina
};

// ============================================================================
//  Carregamento
// ============================================================================
function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('GoghosIntro: falha ao carregar ' + String(url).slice(0, 80)));
    img.src = url;
  });
}
async function loadFont(family, url) {
  if (typeof FontFace === 'undefined' || !document.fonts) return false;
  try {
    const ff = new FontFace(family, `url("${url}")`);
    await ff.load();
    document.fonts.add(ff);
    return true;
  } catch (e) { return false; }
}
function makeCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.round(w)); c.height = Math.max(1, Math.round(h));
  return c;
}
/** Reduz uma imagem de forma progressiva (metade por vez) para não serrilhar. */
function prescale(src, tw, th) {
  let cur = src, w = src.width, h = src.height;
  tw = Math.max(1, Math.round(tw)); th = Math.max(1, Math.round(th));
  while (w * 0.5 >= tw * 1.1) {
    const nw = Math.ceil(w / 2), nh = Math.ceil(h / 2), c = makeCanvas(nw, nh), x = c.getContext('2d');
    x.imageSmoothingQuality = 'high'; x.drawImage(cur, 0, 0, nw, nh);
    cur = c; w = nw; h = nh;
  }
  if (w !== tw) {
    const c = makeCanvas(tw, th), x = c.getContext('2d');
    x.imageSmoothingQuality = 'high'; x.drawImage(cur, 0, 0, tw, th);
    cur = c;
  }
  return cur;
}

// ============================================================================
//  Estrela de 4 pontas (brilho) — usada em todo lugar
// ============================================================================
function sparkle(ctx, x, y, R, rot, alpha, color, fringe) {
  if (alpha <= 0.004 || R < 0.6) return;
  const body = (dx, dy, col, a, k) => {
    const r = R * k, w = r * 0.13;
    ctx.save(); ctx.translate(x + dx, y + dy); ctx.rotate(rot); ctx.globalAlpha = clamp(a);
    ctx.fillStyle = col; ctx.beginPath();
    ctx.moveTo(0, -r); ctx.quadraticCurveTo(w, -w, r, 0); ctx.quadraticCurveTo(w, w, 0, r);
    ctx.quadraticCurveTo(-w, w, -r, 0); ctx.quadraticCurveTo(-w, -w, 0, -r); ctx.fill();
    ctx.restore();
  };
  if (fringe) {            // franja cromática de lente
    const o = R * 0.05;
    body(-o, 0, '#ff5d8f', alpha * 0.55, 1.0);
    body(o, 0, '#4de3ff', alpha * 0.55, 1.0);
  }
  body(0, 0, color || '#fff', alpha, 1.0);
  const g = ctx.createRadialGradient(x, y, 0, x, y, R * 0.42);
  g.addColorStop(0, 'rgba(255,255,255,' + clamp(alpha * 0.9) + ')');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.save(); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, R * 0.42, 0, TAU); ctx.fill(); ctx.restore();
}

function starPath(ctx, r, points, inner) {
  ctx.beginPath();
  for (let i = 0; i < points * 2; i++) {
    const a = (i / (points * 2)) * TAU - Math.PI / 2, rr = i % 2 ? r * inner : r;
    i ? ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr) : ctx.moveTo(Math.cos(a) * rr, Math.sin(a) * rr);
  }
  ctx.closePath();
}

// ============================================================================
//  A classe principal
// ============================================================================
class GoghosIntro {
  constructor(options = {}) {
    const o = Object.assign({}, DEFAULTS, options);
    o.assets = Object.assign({}, DEFAULTS.assets, options.assets || {});
    o.texts = Object.assign({}, DEFAULTS.texts, options.texts || {});
    if (typeof o.music === 'string') o.music = { src: o.music };
    this.opt = o;
    this.music_ = null;                                    // <audio> (ver getter `music`)
    this.T = (o.music && o.music.hitTime != null) ? o.music.hitTime : o.hitTime;   // instante do golpe
    this.bpm = (o.music && o.music.bpm) || o.bpm;
    this.minTime = o.minDuration != null ? o.minDuration : this.T + 2.4;
    this.state = 'idle';       // idle -> loaded -> gate -> intro -> exit -> done
    this.finished = new Promise((res) => { this._resolveFinished = res; });
    this._loadP = null;
    // progresso (do jogo)
    this._target = 0; this._tracked = 0; this._trackedDone = 0;
    this._progressUsed = false; this._completeCalled = false; this._progDisp = 0;
    this._tReady = null; this._tExit = null;
    this._t0 = 0; this._gateT0 = 0; this._lastTick = 0;
    this._raf = 0; this._dbg = null; this._freeze = false;
    this._reduced = false; this._sfxOn = !!o.sfx;
    this._ctxA = null; this._musicOK = false; this._destroyed = false;
    this._loadProgress = 0;
  }

  /** Elemento <audio> da trilha (null se não houver). Continua tocando depois da tela. */
  get music() { return this.music_; }

  // ------------------------------------------------------------------ API --
  /** Carrega imagens, camadas e fonte. Devolve uma Promise (memoizada). */
  load() {
    if (this._loadP) return this._loadP;
    const o = this.opt, a = o.assets;
    const url = (u) => (/^(data:|blob:|https?:|\/)/.test(u) ? u : o.baseUrl + u);
    let total = 5, done = 0;
    const step = (p) => p.then((v) => { done++; this._loadProgress = done / total; return v; });
    this._loadP = Promise.all([
      step(loadImage(url(a.fundo))),
      step(loadImage(url(a.atlas))),
      step(loadImage(url(a.beta))),
      step(Promise.resolve(a.camadas)),
      step(loadFont(o.fontFamily, url(a.fonte))),
    ]).then(([bg, atlas, beta, meta]) => {
      this.img = { bg, atlas, beta }; this.meta = meta;
      this._prepare();
      if (this.state === 'idle') this.state = 'loaded';
      return this;
    });
    return this._loadP;
  }

  /**
   * Começa a intro. Chame dentro de um toque/tecla para já ter áudio; se o
   * navegador bloquear o áudio, aparece a tela "Press any key to start".
   */
  async start() {
    await this.load();
    if (this._destroyed || this.state === 'gate' || this.state === 'intro' || this.state === 'exit') return this;
    this._reduced = this.opt.reducedMotion === 'auto'
      ? !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches)
      : !!this.opt.reducedMotion;
    this._createCanvas();
    this._warm();
    this._bindInput();
    this._initAudio();
    let needGate = this.opt.gate === true;
    if (this.opt.gate === 'auto' && this._ctxA) {
      // dá uma chance do contexto de áudio já estar liberado (usuário já tocou na página)
      try { this._ctxA.resume(); } catch (e) { /* ignora */ }
      await Promise.race([new Promise((r) => setTimeout(r, 90)), this._ctxA.state === 'running' ? Promise.resolve() : new Promise(() => {})]);
      needGate = this._ctxA.state !== 'running';
    }
    if (this._destroyed) return this;
    this._lastTick = performance.now() / 1000;
    if (needGate) { this.state = 'gate'; this._gateT0 = this._lastTick; }
    else this._beginIntro();
    this._raf = requestAnimationFrame(this._loop);
    return this;
  }

  /** Define o progresso do jogo (0..1). Só avança. */
  setProgress(p) {
    this._progressUsed = true;
    this._target = Math.max(this._target, clamp(p));
    if (p >= 1) this._completeCalled = true;
  }
  /** Acompanha promessas de carregamento: o progresso é (resolvidas / total). */
  track(promises) {
    this._progressUsed = true;
    const list = Array.isArray(promises) ? promises : [promises];
    for (const p of list) {
      this._tracked++;
      Promise.resolve(p).catch(() => {}).then(() => { this._trackedDone++; });
    }
  }
  /** Avisa que o jogo terminou de carregar. */
  complete() { this._progressUsed = true; this._completeCalled = true; this._target = 1; }

  /** Abaixa a música até o silêncio e pausa (ms). */
  fadeOutMusic(ms = 900) {
    const el = this.music_;
    if (!el) return Promise.resolve();
    return new Promise((resolve) => {
      const g = this._musicGain, c = this._ctxA;
      const done = () => { try { el.pause(); } catch (e) { /* ignora */ } resolve(); };
      if (g && c) {
        const now = c.currentTime;
        g.gain.cancelScheduledValues(now); g.gain.setValueAtTime(g.gain.value, now);
        g.gain.linearRampToValueAtTime(0, now + ms / 1000);
        setTimeout(done, ms + 30);
      } else {
        const v0 = el.volume, t0 = performance.now();
        const tick = () => {
          const k = clamp((performance.now() - t0) / ms);
          el.volume = v0 * (1 - k);
          k < 1 ? requestAnimationFrame(tick) : done();
        };
        tick();
      }
    });
  }

  /** Remove a tela. A música continua tocando, a menos que `{stopMusic:true}`. */
  destroy(opts = {}) {
    if (this._destroyed) return;
    this._destroyed = true;
    cancelAnimationFrame(this._raf);
    this._unbindInput();
    if (this.canvas && this.canvas.parentNode) this.canvas.parentNode.removeChild(this.canvas);
    if (opts.stopMusic && this.music_) { try { this.music_.pause(); } catch (e) { /* ignora */ } }
    if (this._ctxA && (opts.stopMusic || !this.music_)) { try { this._ctxA.close(); } catch (e) { /* ignora */ } }
    this.state = 'done';
    this._resolveFinished({ destroyed: true });
  }

  // ------------------------------------------------------------ preparação --
  _prepare() {
    const o = this.opt, rnd = mulberry32(o.seed);
    const T = this.T;
    // camadas do logo (na ordem de empilhamento) + configuração de entrada de cada uma
    this.layers = this.meta.camadas.map((c) => Object.assign({}, c));
    const cfgFor = (id) => {
      const base = { c: 0, S0: 2.3, rot: 0, ox: 0, oy: 0, D: 0.22, sq: 0.12, boil: 1.3 };
      if (id === 'placa') return Object.assign(base, { c: -0.02, S0: 1.7, D: 0.2, sq: 0.05, boil: 0.5 });
      if (id === 'goghos') return Object.assign(base, { c: 0.0, S0: 2.3, rot: -0.09, oy: -340, boil: 1.5 });
      if (id === 'flor') return Object.assign(base, { follow: 'goghos', pop: 0.2, boil: 0 });
      if (id === 'the') return Object.assign(base, { c: 0.05, S0: 2.0, rot: 0.08, oy: -60, sq: 0.14, boil: 1.0 });
      if (id === 'is') return Object.assign(base, { c: 0.09, S0: 2.2, rot: -0.07, oy: 90, boil: 0.9 });
      if (id === 'coming') return Object.assign(base, { c: 0.11, S0: 2.2, rot: 0.06, oy: 90, boil: 0.9 });
      const i = LETTER_IDS.indexOf(id);
      if (i >= 0) {
        const d = Math.abs(i - 4);
        return Object.assign(base, { c: d * 0.016, S0: 2.5, rot: (i % 2 ? 1 : -1) * (0.10 + 0.02 * d), ox: (i - 4) * 90, oy: 130, sq: 0.12, boil: 1.3 });
      }
      return base;
    };
    this._byId = {};
    this.layers.forEach((l, i) => { this._byId[l.id] = l; l.cfg = cfgFor(l.id); l.i = i; l.idx = LETTER_IDS.indexOf(l.id); });

    // partículas da fase de tensão (convergem para o centro do logo)
    this._conv = Array.from({ length: 72 }, () => ({
      ang: rnd() * TAU, r0: 480 + rnd() * 620, d: 0.25 + rnd() * Math.max(T - 0.85, 0.3), life: 0.5 + rnd() * 0.4,
      spin: (rnd() - 0.5) * 2.6, size: 2 + rnd() * 3.6, col: [COL.white, COL.cream, COL.pink, COL.cyan][(rnd() * 4) | 0],
    }));
    this._convLines = Array.from({ length: 26 }, () => ({
      ang: rnd() * TAU, tail: 120 + rnd() * 220, w: 2 + rnd() * 3.2, dl: rnd() * 0.12,
    }));
    // linhas de velocidade do impacto
    this._speed = Array.from({ length: 46 }, (_, i) => ({
      ang: (i / 46) * TAU + (rnd() - 0.5) * 0.12, r0: 200 + rnd() * 300, len: 520 + rnd() * 980,
      w: 3 + rnd() * 9, dl: rnd() * 0.08, col: rnd() < 0.55 ? '#ffffff' : COL.cream2,
    }));
    // explosão de quadrinhos (polígonos com pontas irregulares)
    const burst = (n, a, b) => Array.from({ length: n * 2 }, (_, i) => ({
      a: (i / (n * 2)) * TAU, r: i % 2 ? a * (0.9 + rnd() * 0.1) : b * (0.92 + rnd() * 0.1),
    }));
    this._burstA = burst(15, 0.62, 1.0);
    this._burstB = burst(11, 0.56, 0.8);
    // gotas de tinta
    const inkCols = ['#14101c', '#14101c', '#14101c', COL.hot, COL.cream, '#14101c', COL.cyan];
    this._ink = Array.from({ length: 28 }, () => {
      const a = -Math.PI / 2 + (rnd() - 0.5) * 3.9;
      return { vx: Math.cos(a) * (600 + rnd() * 1250), vy: Math.sin(a) * (600 + rnd() * 1250) - 150, r: 6 + rnd() * 13,
        col: inkCols[(rnd() * inkCols.length) | 0], life: 1.0 + rnd() * 0.7, dl: rnd() * 0.07 };
    });
    // confete com contorno
    this._conf = Array.from({ length: 78 }, () => {
      const a = -Math.PI / 2 + (rnd() - 0.5) * 5.2, sp = 700 + rnd() * 1500;
      return { vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 350, size: 13 + rnd() * 17, shape: (rnd() * 4) | 0,
        col: CONFETTI_COLORS[(rnd() * CONFETTI_COLORS.length) | 0], spin: (rnd() - 0.5) * 16, ph: rnd() * TAU,
        flut: 4 + rnd() * 6, life: 2.2 + rnd() * 1.1, dl: rnd() * 0.12 };
    });
    // poeira brilhante flutuando + estrelas grandes que piscam (posições normalizadas)
    this._motes = Array.from({ length: 40 }, () => ({
      x: rnd(), y: rnd(), sp: 0.015 + rnd() * 0.04, size: 1.5 + rnd() * 4.5, ph: rnd() * TAU, f: 0.8 + rnd() * 2.2,
      col: [COL.white, COL.cream, COL.cyan, COL.pink][(rnd() * 4) | 0], drift: (rnd() - 0.5) * 0.02,
    }));
    this._stars = Array.from({ length: 60 }, () => ({
      x: 0.04 + rnd() * 0.92, y: 0.04 + rnd() * 0.92, R: 11 + rnd() * 21, per: 1.5 + rnd() * 2.2, ph: rnd() * 6, rot: (rnd() - 0.5) * 0.5,
    }));
    // faíscas na hora do golpe
    this._hitStars = Array.from({ length: 9 }, (_, i) => ({
      ang: (i / 9) * TAU + (rnd() - 0.5) * 0.5, rad: 1.0 + rnd() * 0.35, R: 26 + rnd() * 34, dl: rnd() * 0.18, rot: rnd() * 0.8,
    }));
    this._calibrateFont();
  }

  /** Mede a fonte para casar o tamanho com a tinta da referência. */
  _calibrateFont() {
    const c = makeCanvas(8, 8).getContext('2d'), fam = `"${this.opt.fontFamily}", "Comic Sans MS", cursive`;
    this._fam = fam;
    const m = (txt) => { c.font = `100px ${fam}`; const q = c.measureText(txt); return { w: q.actualBoundingBoxLeft + q.actualBoundingBoxRight, l: q.actualBoundingBoxLeft, a: q.actualBoundingBoxAscent }; };
    this._fm = { prompt: m('Press any key to continue.'), version: m('Versão 0.1.0') };
  }

  // ---------------------------------------------------------------- canvas --
  _createCanvas() {
    const o = this.opt;
    this.host = o.container || document.body;
    const full = !o.container || o.container === document.body;
    const c = document.createElement('canvas');
    c.setAttribute('aria-label', 'GOGHOS — The Nightmare is Coming');
    c.style.cssText = `position:${full ? 'fixed' : 'absolute'};inset:0;width:100%;height:100%;display:block;` +
      `touch-action:none;user-select:none;-webkit-user-select:none;z-index:${o.zIndex};background:#120a2a;` +
      `-webkit-tap-highlight-color:transparent;`;
    this.host.appendChild(c);
    this.canvas = c; this.ctx = c.getContext('2d', { alpha: false });
    this._onResize = () => this._resize();
    window.addEventListener('resize', this._onResize);
    if (window.ResizeObserver) { this._ro = new ResizeObserver(this._onResize); this._ro.observe(this.host); }
    this._resize();
  }

  _resize() {
    if (!this.canvas) return;
    const full = !this.opt.container || this.opt.container === document.body;
    const w = full ? window.innerWidth : this.host.clientWidth, h = full ? window.innerHeight : this.host.clientHeight;
    if (!w || !h) return;
    const dpr = Math.min(window.devicePixelRatio || 1, this.opt.maxDpr);
    if (this.L && w === this.cssW && h === this.cssH && dpr === this.dpr) return;   // nada mudou: não apaga o canvas
    this.cssW = w; this.cssH = h; this.dpr = dpr;
    this.canvas.width = Math.round(w * dpr); this.canvas.height = Math.round(h * dpr);
    this._layout();
    this._buildWork();
  }

  /** Posições/tamanhos em px de CSS. Paisagem fiel à referência; retrato com layout próprio. */
  _layout() {
    const w = this.cssW, h = this.cssH, portrait = h > w, L = { w, h, portrait };
    if (!portrait) {
      const u = Math.min(w / 1920, h / 1080), ox = (w - 1920 * u) / 2, oy = (h - 1080 * u) / 2;
      Object.assign(L, { u, ox, oy });
      L.sun = { x: ox + REF.sun.x * u, y: oy + REF.sun.y * u };
      L.logo = { cx: ox + REF.logo.cx * u, cy: oy + REF.logo.cy * u, k: REF.logo.k * u };
      L.bgK0 = REF.bgScale * u;
      L.beta = { w: REF.beta.w * u, h: REF.beta.h * u, x: w - (REF.beta.right + REF.beta.w) * u, y: REF.beta.top * u };
      L.prompt = { cx: ox + REF.prompt.cx * u, inkW: REF.prompt.inkW * u, inkTop: oy + REF.prompt.inkTop * u };
      L.version = { right: w - REF.version.right * u, base: h - REF.version.baseFromBottom * u, inkW: REF.version.inkW * u };
      L.bar = { cx: ox + REF.prompt.cx * u, cy: oy + 930 * u, w: 390 * u, h: 12 * u };
      L.burstR = 520 * u;
    } else {
      const u = Math.min(w / 1080, h / 1920), ox = (w - 1080 * u) / 2, oy = (h - 1920 * u) / 2;
      Object.assign(L, { u, ox, oy });
      L.sun = { x: ox + 540 * u, y: oy + 1010 * u };
      L.logo = { cx: ox + 540 * u, cy: oy + 790 * u, k: (960 / LOGO_C.w) * u };
      L.bgK0 = 0;
      const bw = 150 * u;
      L.beta = { w: bw, h: bw * 455 / 575, x: w - 34 * u - bw, y: Math.max(40 * u, 14) };
      L.prompt = { cx: ox + 540 * u, inkW: 660 * u, inkTop: oy + 1590 * u };
      L.version = { right: w - 30 * u, base: h - Math.max(40 * u, 14), inkW: 195 * u };
      L.bar = { cx: ox + 540 * u, cy: oy + 1630 * u, w: 520 * u, h: 16 * u };
      L.burstR = 560 * u;
    }
    // fundo: cobre a tela inteira ancorado no sol (com folga p/ tremor e deriva)
    const s = L.sun, bs = REF.bgSunImg;
    const m = 28 * L.u;     // folga p/ tremor e deriva
    const cover = Math.max((s.x + m) / bs.x, (w - s.x + m) / (1536 - bs.x), (s.y + m) / bs.y, (h - s.y + m) / (1024 - bs.y));
    L.bgK = Math.max(L.bgK0, cover);
    // gradientes reutilizáveis
    const x = this.ctx;
    L.gVig = x.createRadialGradient(w / 2, h * 0.46, Math.min(w, h) * 0.3, w / 2, h * 0.46, Math.hypot(w, h) * 0.62);
    L.gVig.addColorStop(0, 'rgba(25,5,55,0)'); L.gVig.addColorStop(1, 'rgba(25,5,55,0.42)');
    const R = Math.max(w, h);
    L.gSun = x.createRadialGradient(s.x, s.y, 0, s.x, s.y, R * 0.55);
    L.gSun.addColorStop(0, 'rgba(255,240,205,0.95)'); L.gSun.addColorStop(0.18, 'rgba(255,170,190,0.45)');
    L.gSun.addColorStop(0.5, 'rgba(255,90,170,0.12)'); L.gSun.addColorStop(1, 'rgba(255,90,170,0)');
    L.gRay = x.createRadialGradient(s.x, s.y, 0, s.x, s.y, R * 0.9);
    L.gRay.addColorStop(0, 'rgba(255,236,210,0.5)'); L.gRay.addColorStop(1, 'rgba(255,200,230,0)');
    L.rayR = R * 0.9;
    // posições das estrelas grandes: normalizadas -> tela, evitando logo e UI
    const lb = { x0: L.logo.cx - 860 * L.logo.k, x1: L.logo.cx + 860 * L.logo.k, y0: L.logo.cy - 720 * L.logo.k, y1: L.logo.cy + 760 * L.logo.k };
    L.stars = [];
    for (const st of this._stars) {
      const px = st.x * w, py = st.y * h, m = 40 * L.u;
      const inLogo = px > lb.x0 - m && px < lb.x1 + m && py > lb.y0 - m && py < lb.y1 + m;
      const inUI = (py > L.prompt.inkTop - 40 * L.u && py < L.prompt.inkTop + 100 * L.u && px > L.prompt.cx - L.prompt.inkW * 0.6 && px < L.prompt.cx + L.prompt.inkW * 0.6) ||
        (px > L.beta.x - 30 * L.u && py < L.beta.y + L.beta.h + 30 * L.u) || (px > w - 330 * L.u && py > h - 110 * L.u);
      if (!inLogo && !inUI) L.stars.push({ x: px, y: py, R: st.R * L.u, per: st.per, ph: st.ph, rot: st.rot });
      if (L.stars.length >= 12) break;
    }
    this.L = L;
    // tamanhos de fonte calibrados
    L.fs = { prompt: L.prompt.inkW / this._fm.prompt.w * 100, version: L.version.inkW / this._fm.version.w * 100 };
    // BETA pré-reduzido (evita serrilhado)
    this._betaS = prescale(this.img.beta, L.beta.w * this.dpr * (575 / 575), L.beta.h * this.dpr);
  }

  /** Atlas "de trabalho" reduzido p/ a resolução da tela + máscara do brilho holográfico. */
  _buildWork() {
    const L = this.L, A = this.meta.escalaAtlas, atlas = this.img.atlas;
    const need = (L.logo.k * this.dpr) / A;
    let f = 1, src = atlas;
    if (need < 0.62) {
      while (f * 0.5 >= need * 1.1) {
        const nw = Math.ceil(src.width / 2), nh = Math.ceil(src.height / 2), c = makeCanvas(nw, nh), x = c.getContext('2d');
        x.imageSmoothingQuality = 'high'; x.drawImage(src, 0, 0, nw, nh); src = c; f *= 0.5;
      }
      if (f > need * 1.35) {
        const f2 = need * 1.25, nw = Math.ceil(atlas.width * f2), nh = Math.ceil(atlas.height * f2), c = makeCanvas(nw, nh), x = c.getContext('2d');
        x.imageSmoothingQuality = 'high'; x.drawImage(src, 0, 0, nw, nh); src = c; f = f2;
      }
    }
    this._work = { src, f, need };
    // máscara do brilho: só onde há "tinta clara" (letras/cromado/creme), nunca o preto
    this._mask = null;
    try {
      const mc = makeCanvas(src.width, src.height), mx = mc.getContext('2d', { willReadFrequently: true });
      mx.drawImage(src, 0, 0);
      const id = mx.getImageData(0, 0, mc.width, mc.height), d = id.data;
      for (let i = 0; i < d.length; i += 4) {
        const lum = Math.max(d[i], d[i + 1], d[i + 2]);
        const m = clamp((lum - 70) / 70) * (d[i + 3] / 255);
        d[i] = d[i + 1] = d[i + 2] = 255; d[i + 3] = Math.round(m * 255);
      }
      mx.putImageData(id, 0, 0);
      this._mask = mc;
    } catch (e) { this._mask = null; }     // canvas "tainted": sem brilho mascarado
    // tela auxiliar do brilho (do tamanho do logo na tela)
    const sw = Math.ceil((LOGO_C.w * L.logo.k * 1.12 + 8) * this.dpr), sh = Math.ceil((LOGO_C.h * L.logo.k * 1.12 + 8) * this.dpr);
    this._shine = makeCanvas(sw, sh); this._shineM = makeCanvas(sw, sh);
  }

  // ---------------------------------------------------------------- entrada --
  _bindInput() {
    this._onKey = (e) => {
      if (e.repeat || e.ctrlKey || e.metaKey || e.altKey) return;
      if (['Shift', 'Control', 'Alt', 'Meta', 'CapsLock', 'Tab'].includes(e.key)) return;
      if (this._gesture(e)) { if (e.key === ' ' || e.key.startsWith('Arrow')) e.preventDefault(); }
    };
    this._onPtr = (e) => { this._gesture(e); };
    window.addEventListener('keydown', this._onKey);
    this.canvas.addEventListener('pointerdown', this._onPtr);
  }
  _unbindInput() {
    window.removeEventListener('keydown', this._onKey);
    window.removeEventListener('resize', this._onResize);
    if (this._ro) this._ro.disconnect();
    if (this.canvas) this.canvas.removeEventListener('pointerdown', this._onPtr);
  }
  /** Toque/tecla. Devolve true se consumiu o gesto. */
  _gesture() {
    if (this.state === 'gate') {
      try { this._ctxA && this._ctxA.resume(); } catch (e) { /* ignora */ }
      this._beginIntro();
      return true;
    }
    if (this.opt.autoExit !== true && this.state === 'intro' && this._tReady != null) { this._beginExit(); return true; }
    return false;
  }

  // ------------------------------------------------------------------ áudio --
  _initAudio() {
    const o = this.opt, AC = window.AudioContext || window.webkitAudioContext;
    if (!AC || (!o.sfx && !o.music)) return;
    try { this._ctxA = new AC({ latencyHint: 'interactive' }); } catch (e) { this._ctxA = null; return; }
    const c = this._ctxA;
    // música: <audio> roteado por um ganho (fade funciona também no iOS)
    if (o.music && o.music.src) {
      const el = new Audio(); el.src = o.music.src; el.preload = 'auto'; el.loop = o.music.loop !== false;
      el.playsInline = true; el.crossOrigin = 'anonymous';
      this.music_ = el;
      try {
        const src = c.createMediaElementSource(el); this._musicGain = c.createGain();
        this._musicGain.gain.value = o.music.volume != null ? o.music.volume : 0.9;
        src.connect(this._musicGain); this._musicGain.connect(c.destination);
      } catch (e) { el.volume = o.music.volume != null ? o.music.volume : 0.9; }
    }
    // efeitos: ganho mestre baixo (a música é a protagonista)
    this._sfxGain = c.createGain(); this._sfxGain.gain.value = (this.music_ ? 0.3 : 0.5) * (o.sfxVolume ?? 1); this._sfxGain.connect(c.destination);
    const n = c.sampleRate, buf = c.createBuffer(1, n, n), d = buf.getChannelData(0), r = mulberry32(7);
    for (let i = 0; i < n; i++) d[i] = r() * 2 - 1;
    this._noise = buf;
  }

  _beginIntro() {
    const now = performance.now() / 1000, c = this._ctxA, lead = 0.12;
    const lat = c ? Math.min(c.outputLatency || c.baseLatency || 0, 0.15) : 0;
    this._t0 = now + lead + lat;                // t = 0 da intro (já compensa a latência de saída)
    this._audioT0 = c ? c.currentTime + lead : 0;
    this.state = 'intro';
    if (this.music_) {
      try {
        this.music_.currentTime = 0;
        const p = this.music_.play();
        if (p && p.then) p.then(() => { this._musicOK = true; }).catch(() => { this._musicOK = false; });
        else this._musicOK = true;
      } catch (e) { this._musicOK = false; }
    }
    if (this._sfxOn && c && c.state === 'running') {
      const at = (s) => this._audioT0 + s;
      if (!this.music_) this._sfxRiser(at(0.1), this.T - 0.1);
      this._sfxHit(at(this.T), !!this.music_);
      if (this.opt.showBeta) this._sfxPop(at(this.T + 0.47), 1046);
      for (let k = 0; k < 6; k++) this._sfxGlint(at(this.T + 0.95 + k * SHINE_PERIOD));
    }
  }

  _beginExit() {
    this.fadeOutMusic(EXIT_END * 1000);
    this._tExit = this._now();
    this.state = 'exit';
    if (this._sfxOn && this._ctxA && this._ctxA.state === 'running') this._sfxWhoosh(this._ctxA.currentTime + 0.02);
  }

  /** Relógio da intro (s). Com música, ancora no áudio com correção suave de deriva. */
  _now() {
    let p = performance.now() / 1000 - this._t0;
    const m = this.music_;
    if (m && this._musicOK && !m.paused && m.readyState >= 2) {
      const drift = m.currentTime - p;
      if (Math.abs(drift) > 0.25) this._t0 -= drift;                  // salto grande: realinha
      else if (Math.abs(drift) > 0.004) this._t0 -= drift * 0.06;     // correção suave
      p = performance.now() / 1000 - this._t0;
    }
    return p;
  }

  // ---- efeitos sonoros sintetizados (discretos) ----
  _env(g, at, a, peak, d) {
    g.gain.setValueAtTime(0.0001, at);
    g.gain.exponentialRampToValueAtTime(peak, at + a);
    g.gain.exponentialRampToValueAtTime(0.0001, at + a + d);
  }
  _osc(type, f0, f1, at, dur, peak, a = 0.005) {
    const c = this._ctxA, o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.setValueAtTime(f0, at);
    if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(f1, at + dur);
    this._env(g, at, a, peak, dur); o.connect(g); g.connect(this._sfxGain); o.start(at); o.stop(at + dur + a + 0.05);
  }
  _noiseBurst(at, dur, f0, f1, q, peak, type = 'bandpass', a = 0.005) {
    const c = this._ctxA, s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
    s.buffer = this._noise; s.loop = true; f.type = type; f.Q.value = q;
    f.frequency.setValueAtTime(f0, at); f.frequency.exponentialRampToValueAtTime(f1, at + dur);
    this._env(g, at, a, peak, dur); s.connect(f); f.connect(g); g.connect(this._sfxGain); s.start(at); s.stop(at + dur + a + 0.05);
  }
  _sfxRiser(at, dur) {
    const c = this._ctxA;
    const f = c.createBiquadFilter(), g = c.createGain(), s = c.createBufferSource();
    s.buffer = this._noise; s.loop = true; f.type = 'bandpass'; f.Q.value = 2.5;
    f.frequency.setValueAtTime(260, at); f.frequency.exponentialRampToValueAtTime(5200, at + dur);
    g.gain.setValueAtTime(0.0001, at); g.gain.exponentialRampToValueAtTime(0.16, at + dur * 0.97); g.gain.linearRampToValueAtTime(0, at + dur + 0.02);
    s.connect(f); f.connect(g); g.connect(this._sfxGain); s.start(at); s.stop(at + dur + 0.1);
    const o = c.createOscillator(), og = c.createGain(); o.type = 'sine';
    o.frequency.setValueAtTime(110, at); o.frequency.exponentialRampToValueAtTime(880, at + dur);
    og.gain.setValueAtTime(0.0001, at); og.gain.exponentialRampToValueAtTime(0.07, at + dur * 0.97); og.gain.linearRampToValueAtTime(0, at + dur + 0.02);
    o.connect(og); og.connect(this._sfxGain); o.start(at); o.stop(at + dur + 0.1);
  }
  _sfxHit(at, soft) {
    const k = soft ? 0.5 : 1;
    this._osc('sine', 110, 38, at, 0.55, 0.9 * k, 0.003);                 // pancada grave
    this._noiseBurst(at, 0.16, 7000, 1400, 0.7, 0.55 * k, 'highpass', 0.002);   // estalo
    if (!soft) for (const [f, p] of [[1318.5, 0.07], [1976, 0.05], [2637, 0.035]]) this._osc('sine', f, f, at + 0.01, 0.55, p, 0.004);  // brilho
  }
  _sfxPop(at, f = 880) { this._osc('sine', f * 0.7, f * 1.5, at, 0.11, 0.18, 0.004); }
  _sfxGlint(at) { [2093, 2637, 3136].forEach((f, i) => this._osc('sine', f, f, at + i * 0.05, 0.28, 0.045, 0.004)); }
  _sfxWhoosh(at) { this._noiseBurst(at, 0.55, 500, 4200, 1.4, 0.32, 'bandpass', 0.12); }

  // ----------------------------------------------------------------- laço --
  _loop = () => {
    if (this._destroyed) return;
    this._raf = requestAnimationFrame(this._loop);
    this._tick();
  };

  _tick() {
    const nowP = performance.now() / 1000, dtf = clamp(nowP - this._lastTick, 0, 0.1);
    this._lastTick = nowP;
    if (this.state === 'gate') { this._renderFrame(nowP - this._gateT0, true); return; }
    const t = this._now();
    // progresso suavizado: nunca regride
    let tgt = this._target;
    if (this._tracked) tgt = Math.max(tgt, this._trackedDone / this._tracked);
    if (!this._completeCalled) tgt = Math.min(tgt, 0.97);
    if (this._completeCalled) tgt = 1;
    if (!this._progressUsed) tgt = 1;
    this._progDisp = Math.max(this._progDisp, this._progDisp + (tgt - this._progDisp) * (1 - Math.exp(-dtf * 4.2)));
    if (tgt >= 1 && this._progDisp > 0.995) this._progDisp = 1;
    // pronto?
    if (this.state === 'intro' && this._tReady == null && t >= this.minTime && this._progDisp >= 1) {
      this._tReady = t;
      if (this._sfxOn && this._ctxA && this._ctxA.state === 'running') this._sfxPop(this._ctxA.currentTime + 0.1, 784);
      if (this.opt.autoExit) this._beginExit();
      if (this.opt.onReady) { try { this.opt.onReady(this); } catch (e) { console.error(e); } }
    }
    // fim da saída
    if (this.state === 'exit' && t - this._tExit >= EXIT_END) { this._finish(); return; }
    this._renderFrame(t, false);
  }

  _finish() {
    this.state = 'done';
    cancelAnimationFrame(this._raf);
    this._unbindInput();
    if (this.canvas && this.canvas.parentNode) this.canvas.parentNode.removeChild(this.canvas);
    this._resolveFinished({ destroyed: false });
    if (this.opt.onFinished) { try { this.opt.onFinished(this); } catch (e) { console.error(e); } }
  }

  /** (teste) desenha um quadro específico: t em s; o = { ready, exit, progress, freeze, gate }. */
  async __renderAt(t, o = {}) {
    await this.load();
    if (!this.canvas) { this._reduced = !!o.reduced; this._createCanvas(); }
    this._freeze = !!o.freeze;
    this._tReady = o.ready != null ? o.ready : null;
    this._tExit = o.exit != null ? o.exit : null;
    this._progDisp = o.progress != null ? o.progress : 1;
    this._progressUsed = o.progressUsed != null ? o.progressUsed : this._progressUsed;
    this._renderFrame(t, !!o.gate);
    return true;
  }
}

const SHINE_PERIOD = 3.6, SHINE_DUR = 1.15, EXIT_END = 1.45;
const LETTER_IDS = ['n0', 'i1', 'g2', 'h3', 't4', 'm5', 'a6', 'r7', 'e8'];   // N-I-G-H-T-M-A-R-E

// ============================================================================
//  Desenho de um quadro (tudo é função de `t`)
// ============================================================================
const P = GoghosIntro.prototype;

P._renderFrame = function (t, gate) {
  const ctx = this.ctx, L = this.L, u = L.u, T = this.T, dt = t - T;
  const red = this._reduced, frz = this._freeze;
  const tx = this._tExit, ex = tx != null ? t - tx : -1;       // tempo desde o início da saída
  ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
  ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  ctx.fillStyle = '#120a2a'; ctx.fillRect(0, 0, L.w, L.h);

  // ---------- câmera: zoom de tensão -> soco no golpe -> assenta; tremor ----------
  const kz = red ? 0.3 : 1;
  let zoom, shake = 0;
  if (gate) { zoom = 1 + 0.012 * Math.sin(t * 0.5); }
  else if (t < T) { zoom = 1 + 0.085 * kz * easeInQuad(prog(t, 0, T)); shake = (t > T - 0.55 ? 4.5 * u * easeInQuad(prog(t, T - 0.55, T)) : 0); }
  else {
    zoom = 1 + kz * (0.085 * Math.exp(-dt * 3.2) + 0.04 * Math.exp(-dt * 16));
    shake = 22 * u * Math.exp(-dt * 7.5) * (dt < 1.4 ? 1 : 0);
  }
  if (red) shake *= 0.15;
  if (frz) shake = 0;
  let exZoom = 1;
  if (ex >= 0) { exZoom = 1 + 0.7 * easeInCubic(prog(ex, 0.2, 0.95)); }
  const panx = frz ? 0 : Math.sin(t * 0.31) * 10 * u, pany = frz ? 0 : Math.cos(t * 0.27) * 7 * u;
  const shx = shake * wob(t * 34, 1), shy = shake * wob(t * 31, 7), shr = shake * 0.0007 * wob(t * 27, 3);

  ctx.save();
  ctx.translate(L.w / 2 + shx, L.h / 2 + shy); ctx.rotate(shr); ctx.translate(-L.w / 2, -L.h / 2);

  // ---------- fundo ----------
  const kbg = L.bgK * zoom * exZoom;
  ctx.imageSmoothingQuality = 'low';     // o fundo só é ampliado: bilinear basta
  ctx.drawImage(this.img.bg, L.sun.x + panx - REF.bgSunImg.x * kbg, L.sun.y + pany - REF.bgSunImg.y * kbg, 1536 * kbg, 1024 * kbg);

  const beat = this._beatEnv(t, gate);
  const tension = gate ? 0.15 : t < T ? prog(t, 0.3, T) : 0;

  // tensão: o céu escurece e vai revelando (o brilho do sol é somado DEPOIS, por cima)
  const dark = gate ? 0.52 : t < T ? lerp(0.5, 0.0, easeInQuad(prog(t, 0.15, T))) : 0;
  if (dark > 0.003) { ctx.fillStyle = `rgba(14,6,36,${dark})`; ctx.fillRect(0, 0, L.w, L.h); }

  // brilho do sol + raios (aditivos)
  ctx.globalCompositeOperation = 'lighter';
  const sunA = gate ? 0.25 : t < T ? 0.1 + 0.5 * easeInQuad(tension) + 0.15 * beat * tension : 0.12 + 0.2 * beat + 0.45 * Math.exp(-dt * 3);
  ctx.globalAlpha = clamp(sunA); ctx.fillStyle = L.gSun; ctx.fillRect(0, 0, L.w, L.h);
  if (!gate) this._drawRays(ctx, t, clamp(t < T ? 0.08 * tension : 0.1 + 0.08 * beat + 0.35 * Math.exp(-dt * 2.5)));
  ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;

  // estrelas grandes e poeira brilhante
  this._drawTwinkles(ctx, t, gate);

  if (!gate) {
    // ---------- ATO 1: antecipação ----------
    if (t < T + 0.15) this._drawCharge(ctx, t);
    // ---------- ATO 2: impacto ----------
    if (dt > -0.05) {
      this._drawSpeed(ctx, dt);
      this._drawBurst(ctx, dt);
      this._drawRings(ctx, dt);
    }
    // ---------- logo ----------
    this._drawLogoAll(ctx, t, ex);
    // ---------- partículas do impacto ----------
    if (dt > 0) { this._drawInk(ctx, dt); this._drawConfetti(ctx, dt); this._drawHitStars(ctx, dt); }
  } else {
    this._drawCharge(ctx, t, true);
  }

  // vinheta
  ctx.fillStyle = L.gVig; ctx.fillRect(0, 0, L.w, L.h);
  ctx.restore();

  // ---------- UI (fixa na tela, sem tremor) ----------
  if (gate) { this._drawPrompt(ctx, t, this.opt.texts.gate, 1, 0.55 + 0.45 * (0.5 + 0.5 * Math.sin(t * 3.2))); }
  else this._drawUI(ctx, t, ex);

  // ---------- flash / quadro invertido no golpe ----------
  if (!gate) this._drawFlash(ctx, t, ex);
};

/** Pulso a cada batida (antes do golpe: batimentos que aceleram a tensão). */
/** Pré-aquece as texturas na GPU (evita um engasgo no primeiro quadro em que cada imagem aparece). */
P._warm = function () {
  const ctx = this.ctx;
  ctx.save(); ctx.globalAlpha = 0.01;
  for (const src of [this.img.bg, this.img.atlas, this._work && this._work.src, this._mask, this._betaS, this._shine, this._shineM]) {
    if (src) { try { ctx.drawImage(src, 0, 0, 2, 2); } catch (e) { /* ignora */ } }
  }
  ctx.restore();
  try { ctx.getImageData(0, 0, 1, 1); } catch (e) { /* ignora */ }
};

P._beatEnv = function (t, gate) {
  if (gate) return 0.5 + 0.5 * Math.sin(t * 2.2);
  const bd = 60 / this.bpm;
  let m = (t - this.T) % bd; if (m < 0) m += bd;
  const e = Math.exp(-(m / bd) * 4.6);
  return t < this.T ? e * 0.8 : e;
};

P._drawRays = function (ctx, t, a) {
  const L = this.L, s = L.sun, n = 11, R = L.rayR;
  ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = L.gRay;
  const rot = this._freeze ? 0 : t * 0.045;
  for (let i = 0; i < n; i++) {
    const a0 = rot + (i / n) * TAU, w = (TAU / n) * 0.2 * (0.7 + 0.5 * Math.sin(i * 2.7 + t * 0.6));
    ctx.beginPath(); ctx.moveTo(s.x, s.y); ctx.lineTo(s.x + Math.cos(a0 - w) * R, s.y + Math.sin(a0 - w) * R);
    ctx.lineTo(s.x + Math.cos(a0 + w) * R, s.y + Math.sin(a0 + w) * R); ctx.closePath(); ctx.fill();
  }
  ctx.restore();
};

P._drawTwinkles = function (ctx, t, gate) {
  const L = this.L, u = L.u, fz = this._freeze;
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  // poeira brilhante subindo devagar
  for (const m of this._motes) {
    const y = ((m.y - (fz ? 0 : t * m.sp)) % 1 + 1) % 1, x = ((m.x + (fz ? 0 : t * m.drift)) % 1 + 1) % 1;
    const tw = 0.5 + 0.5 * Math.sin(t * m.f * 2 + m.ph), a = (0.25 + 0.6 * tw) * (gate ? 0.6 : 1);
    ctx.globalAlpha = a; ctx.fillStyle = m.col;
    ctx.beginPath(); ctx.arc(x * L.w, y * L.h, m.size * u * (0.6 + 0.6 * tw), 0, TAU); ctx.fill();
  }
  // estrelas de 4 pontas grandes
  for (const s of L.stars) {
    const ph = ((t + s.ph) / s.per) % 1, k = Math.pow(Math.sin(ph * Math.PI), 6);
    sparkle(ctx, s.x, s.y, s.R * (0.4 + 0.75 * k), s.rot, k * (gate ? 0.55 : 0.8), '#fff2d2', true);
  }
  ctx.restore();
};

/** Orbe de carga + partículas e linhas convergindo (antes do golpe). */
P._drawCharge = function (ctx, t, gate) {
  const L = this.L, u = L.u, T = this.T, cx = L.logo.cx, cy = L.logo.cy, dt = t - T;
  const p = gate ? 0 : prog(t, 0.2, T), e = easeInCubic(p);
  const fade = gate ? 1 : 1 - prog(dt, 0, 0.14);
  if (fade <= 0.003) return;
  const beat = this._beatEnv(t, gate);
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  if (!gate && t > 0.25) {
    // partículas convergindo (com rastro)
    ctx.lineCap = 'round';
    for (const c of this._conv) {
      const q = prog(t, c.d, c.d + c.life); if (q <= 0 || q >= 1) continue;
      const pos = (qq) => { const r = c.r0 * u * (1 - easeInCubic(qq)), a = c.ang + c.spin * qq; return [cx + Math.cos(a) * r, cy + Math.sin(a) * r * 0.82]; };
      const [x1, y1] = pos(q), [x0, y0] = pos(Math.max(q - 0.09, 0));
      const al = smooth(q * 5) * (1 - prog(q, 0.92, 1));
      ctx.globalAlpha = al * 0.9; ctx.strokeStyle = c.col; ctx.lineWidth = c.size * u;
      ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(x1, y1, c.size * u * 0.7, 0, TAU); ctx.fill();
    }
    // linhas de velocidade convergentes (últimos 0,55 s)
    if (t > T - 0.62) {
      for (const l of this._convLines) {
        const q = prog(t, T - 0.58 + l.dl, T - 0.02); if (q <= 0) continue;
        const rh = lerp(1400 * u, 150 * u, easeInCubic(q)), rt = rh + (l.tail * (0.4 + q)) * u;
        ctx.globalAlpha = 0.6 * smooth(q * 3); ctx.strokeStyle = '#fff'; ctx.lineWidth = l.w * u;
        ctx.beginPath(); ctx.moveTo(cx + Math.cos(l.ang) * rt, cy + Math.sin(l.ang) * rt * 0.9); ctx.lineTo(cx + Math.cos(l.ang) * rh, cy + Math.sin(l.ang) * rh * 0.9); ctx.stroke();
      }
    }
  }
  // o orbe
  const R = (gate ? 7 + 2.5 * Math.sin(t * 3) : 10 + 78 * e + 14 * beat * (0.3 + p)) * u;
  const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, R * 3.4);
  g.addColorStop(0, 'rgba(255,250,225,0.95)'); g.addColorStop(0.25, 'rgba(255,160,210,0.5)'); g.addColorStop(1, 'rgba(255,90,190,0)');
  ctx.globalAlpha = fade * (gate ? 0.8 : 0.35 + 0.65 * smooth(prog(t, 0.15, 0.7))); ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(cx, cy, R * 3.4, 0, TAU); ctx.fill();
  sparkle(ctx, cx, cy, R * (gate ? 3.0 : 2.4 + 1.2 * p), this._freeze ? 0 : t * 0.7, fade, '#fff', true);
  ctx.restore();
};

// ---- explosão de quadrinhos, linhas, anéis ----
P._drawBurst = function (ctx, dt) {
  if (dt < -0.02 || dt > 0.7) return;
  const L = this.L, u = L.u, cx = L.logo.cx, cy = L.logo.cy;
  const p = prog(dt, 0, 0.17), grow = easeOutBack(p, 2.4) * lerp(1, 1.22, prog(dt, 0.12, 0.7));
  const alpha = 1 - smooth(prog(dt, 0.2, 0.62));
  if (alpha <= 0.003 || grow <= 0) return;
  const R = L.burstR * grow, rot = dt * 0.12;
  const poly = (pts, r, rotA) => { ctx.beginPath(); pts.forEach((v, i) => { const a = v.a + rotA, x = cx + Math.cos(a) * v.r * r, y = cy + Math.sin(a) * v.r * r * 0.92; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }); ctx.closePath(); };
  ctx.save(); ctx.globalAlpha = alpha; ctx.lineJoin = 'miter'; ctx.miterLimit = 3;
  // sombra deslocada (cartoon)
  ctx.save(); ctx.translate(10 * u, 12 * u); poly(this._burstA, R, rot); ctx.fillStyle = 'rgba(20,16,28,0.55)'; ctx.fill(); ctx.restore();
  poly(this._burstA, R, rot); ctx.fillStyle = COL.pink; ctx.fill(); ctx.lineWidth = 12 * u; ctx.strokeStyle = COL.ink; ctx.stroke();
  poly(this._burstB, R * 0.82, -rot * 1.3); ctx.fillStyle = COL.cream2; ctx.fill(); ctx.lineWidth = 8 * u; ctx.stroke();
  // retícula de meio-tom dentro da explosão menor
  ctx.save(); poly(this._burstB, R * 0.82, -rot * 1.3); ctx.clip();
  ctx.fillStyle = 'rgba(255,79,163,0.55)';
  for (let ring = 0.42; ring < 0.98; ring += 0.075) {
    const n = Math.round(ring * 60), r = R * 0.82 * ring, dot = (ring - 0.34) * 11 * u * (L.portrait ? 1.1 : 1);
    for (let i = 0; i < n; i++) { const a = (i / n) * TAU + ring * 3; ctx.beginPath(); ctx.arc(cx + Math.cos(a) * r, cy + Math.sin(a) * r * 0.92, dot, 0, TAU); ctx.fill(); }
  }
  ctx.restore(); ctx.restore();
};

P._drawSpeed = function (ctx, dt) {
  if (dt < 0 || dt > 0.6) return;
  const L = this.L, u = L.u, cx = L.logo.cx, cy = L.logo.cy;
  ctx.save();
  for (const s of this._speed) {
    const q = prog(dt, s.dl, s.dl + 0.42); if (q <= 0 || q >= 1) continue;
    const head = (s.r0 + s.len * easeOutCubic(q)) * u, tail = Math.max(s.r0 * u * 0.9, head - s.len * 0.62 * u * Math.min(q * 2.2, 1));
    const ca = Math.cos(s.ang), sa = Math.sin(s.ang), nx = -sa, ny = ca, w = s.w * u * (1 - q * 0.5);
    ctx.globalAlpha = Math.pow(1 - q, 0.8) * 0.95; ctx.fillStyle = s.col;
    ctx.beginPath(); ctx.moveTo(cx + ca * head, cy + sa * head * 0.92);
    ctx.lineTo(cx + ca * tail + nx * w, cy + sa * tail * 0.92 + ny * w); ctx.lineTo(cx + ca * tail - nx * w, cy + sa * tail * 0.92 - ny * w);
    ctx.closePath(); ctx.fill();
  }
  ctx.restore();
};

P._drawRings = function (ctx, dt) {
  if (dt < 0 || dt > 0.95) return;
  const L = this.L, u = L.u, cx = L.logo.cx, cy = L.logo.cy, cols = ['#ffffff', COL.pink, COL.cream2];
  ctx.save();
  for (let j = 0; j < 3; j++) {
    const p = prog(dt, j * 0.07, j * 0.07 + 0.72); if (p <= 0 || p >= 1) continue;
    const r = easeOutCubic(p) * Math.max(L.w, L.h) * 0.72, lw = lerp(26, 2, easeOutQuad(p)) * u, a = 1 - p * p;
    ctx.globalAlpha = a * 0.75; ctx.strokeStyle = COL.ink; ctx.lineWidth = lw + 9 * u;
    ctx.beginPath(); ctx.ellipse(cx, cy, r, r * 0.9, 0, 0, TAU); ctx.stroke();
    ctx.globalAlpha = a; ctx.strokeStyle = cols[j]; ctx.lineWidth = lw;
    ctx.beginPath(); ctx.ellipse(cx, cy, r, r * 0.9, 0, 0, TAU); ctx.stroke();
  }
  ctx.restore();
};

// ---- gotas de tinta, confete, faíscas ----
const ballistic = (v0, k, g, dt) => {   // posição com arrasto k e gravidade g (forma fechada)
  const e = (1 - Math.exp(-k * dt)) / k;
  return [v0[0] * e, (v0[1] + g / k) * e - (g / k) * dt];
};
P._drawInk = function (ctx, dt) {
  const L = this.L, u = L.u, cx = L.logo.cx, cy = L.logo.cy;
  ctx.save();
  for (const d of this._ink) {
    const q = dt - d.dl; if (q <= 0 || q > d.life) continue;
    const [px, py] = ballistic([d.vx * u, d.vy * u], 1.0, 2600 * u, q);
    const ramp = smooth(prog(Math.hypot(px, py), 70 * u, 360 * u)); if (ramp <= 0.01) continue;
    const x = cx + px, y = cy + py, vx = d.vx * u * Math.exp(-q), vy = (d.vy * u + 2600 * u) * Math.exp(-q) - 2600 * u;
    const sp = Math.hypot(vx, vy) / u, st = 1 + Math.min(sp / 1500, 1.0), r = d.r * u * (1 - 0.7 * easeInQuad(prog(q, d.life * 0.6, d.life)));
    ctx.save(); ctx.translate(x, y); ctx.rotate(Math.atan2(vy, vx)); ctx.globalAlpha = ramp;
    ctx.beginPath(); ctx.ellipse(0, 0, r * st, r / Math.sqrt(st), 0, 0, TAU);
    ctx.fillStyle = d.col; ctx.fill();
    ctx.lineWidth = Math.max(1.6 * u, 1); ctx.strokeStyle = d.col === COL.ink || d.col === '#14101c' ? 'rgba(255,255,255,0.75)' : COL.ink; ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.85)'; ctx.beginPath(); ctx.ellipse(-r * 0.25 * st, -r * 0.3, r * 0.25, r * 0.15, 0, 0, TAU); ctx.fill();
    ctx.restore();
  }
  ctx.restore();
};

P._drawConfetti = function (ctx, dt) {
  const L = this.L, u = L.u, cx = L.logo.cx, cy = L.logo.cy;
  ctx.save(); ctx.lineJoin = 'round'; ctx.lineWidth = Math.max(2.6 * u, 1.4);
  for (const c of this._conf) {
    const q = dt - c.dl; if (q <= 0 || q > c.life) continue;
    const [px, py] = ballistic([c.vx * u, c.vy * u], 1.7, 1500 * u, q);
    const sway = Math.sin(q * c.flut + c.ph) * 16 * u * Math.min(q, 1);
    const ramp = smooth(prog(Math.hypot(px, py), 70 * u, 360 * u)); if (ramp <= 0.01) continue;
    const x = cx + px + sway, y = cy + py, a = (1 - smooth(prog(q, c.life - 0.45, c.life))) * ramp, s = c.size * u;
    const fl = Math.cos(q * c.flut * 1.7 + c.ph);                       // "virando" no ar
    ctx.save(); ctx.translate(x, y); ctx.rotate(c.ph + q * c.spin); ctx.scale(1, 0.25 + 0.75 * Math.abs(fl)); ctx.globalAlpha = a;
    ctx.fillStyle = c.col; ctx.strokeStyle = COL.ink;
    if (c.shape === 0) { ctx.beginPath(); ctx.rect(-s * 0.6, -s * 0.32, s * 1.2, s * 0.64); }
    else if (c.shape === 1) starPath(ctx, s * 0.78, 5, 0.46);
    else if (c.shape === 2) { ctx.beginPath(); ctx.moveTo(0, -s * 0.7); ctx.lineTo(s * 0.62, s * 0.5); ctx.lineTo(-s * 0.62, s * 0.5); ctx.closePath(); }
    else { ctx.beginPath(); ctx.arc(0, 0, s * 0.42, 0, TAU); }
    ctx.fill(); ctx.stroke(); ctx.restore();
  }
  ctx.restore();
};

P._drawHitStars = function (ctx, dt) {
  if (dt > 0.7) return;
  const L = this.L, u = L.u, k = L.logo.k;
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  for (const s of this._hitStars) {
    const q = prog(dt, s.dl, s.dl + 0.5); if (q <= 0 || q >= 1) continue;
    const grow = 0.9 + 0.2 * easeOutCubic(q), x = L.logo.cx + Math.cos(s.ang) * 860 * k * s.rad * grow, y = L.logo.cy + Math.sin(s.ang) * 720 * k * s.rad * grow;
    const env = Math.sin(q * Math.PI);
    sparkle(ctx, x, y, s.R * u * (0.5 + env), s.rot + q * 1.4, env, '#fff8e4', true);
  }
  ctx.restore();
};

// ============================================================================
//  O logo em camadas
// ============================================================================
/** Pose de uma camada no tempo t (golpe com overshoot, squash & stretch). null = invisível. */
P._pose = function (lay, t) {
  const c = lay.cfg, T = this.T;
  if (c.follow) {                          // flor: acompanha o GOGHOS e dá um pulinho depois do golpe
    const base = this._pose(this._byId[c.follow], t); if (!base) return null;
    const q = t - T - c.pop;
    if (q > 0) { base.ls = 1 + 0.5 * Math.exp(-q * 5.5) * Math.sin(q * 16); base.lr = 0.5 * Math.exp(-q * 5) * Math.sin(q * 14); }
    return base;
  }
  const dt = t - T - c.c;
  if (dt < -c.D) return null;
  if (dt < 0) {                            // aproximação: vem "da câmera" acelerando até o impacto
    const p = (dt + c.D) / c.D, e = easeInCubic(p);
    return { a: smooth(p / 0.38), s: lerp(c.S0, 1, e), rot: c.rot * (1 - e), ox: c.ox * (1 - e), oy: c.oy * (1 - e), sx: 1, sy: 1, ph: 'pre', e };
  }
  const q = Math.exp(-dt * 8) * Math.cos(dt * 28);             // squash no impacto, rebate e assenta
  return {
    a: 1, s: 1 + 0.035 * Math.exp(-dt * 6) * Math.sin(dt * 22),
    rot: c.rot * 0.35 * Math.exp(-dt * 8) * Math.sin(dt * 20), ox: 0, oy: 0, sx: 1 + c.sq * q, sy: 1 - c.sq * q, ph: 'post', q: dt,
  };
};

/** Escala/posição globais do logo: pulso na batida, flutuar leve, saída zoom-through. */
P._logoXf = function (t) {
  const L = this.L, T = this.T, dt = t - T, fz = this._freeze;
  const beat = t < T ? 0 : this._beatEnv(t, false);
  let gs = fz ? 1 : 1 + 0.02 * beat * smooth(prog(dt, 0.3, 0.8));
  let gy = fz ? 0 : Math.sin(t * 1.15) * 2.4 * L.u * smooth(prog(dt, 0.6, 1.4));
  let gx = 0, gAlpha = 1;
  const ex = this._tExit != null ? t - this._tExit : -1;
  if (ex >= 0) {
    gs *= ex < 0.2 ? 1 - 0.07 * easeOutQuad(ex / 0.2) : 0.93 * Math.exp(Math.log(8 / 0.93) * easeInCubic(prog(ex, 0.2, 0.95)));
    gAlpha = 1 - smooth(prog(ex, 0.78, 0.95));
  }
  return { gs, gx, gy, gAlpha };
};

P._drawLogoAll = function (ctx, t, ex) {
  const T = this.T;
  if (t < T - 0.4) return;
  // rastro de movimento na saída (cópias recentes, mais fracas)
  if (ex >= 0.2) {
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (let j = 5; j >= 1; j--) this._drawLogo(ctx, t - j * 0.024, 0.2 * (1 - j / 6), true);
    ctx.restore();
  }
  this._drawLogo(ctx, t, 1, false);
  if (ex < 0.2 && t > T + 0.05) this._drawShine(ctx, t);
  this._drawLogoSparks(ctx, t);
};

P._drawLogo = function (ctx, t, alpha, ghost, mask) {   // mask = { ctx, ox, oy } desenha a máscara do brilho
  const L = this.L, k = L.logo.k, W = this._work, A = this.meta.escalaAtlas, T = this.T;
  const xf = this._logoXf(t), f8 = Math.floor(t * 8), fz = this._freeze;
  const Lx = L.logo.cx + xf.gx, Ly = L.logo.cy + xf.gy, x = mask ? mask.ctx : ctx;
  const ox0 = mask ? mask.ox : 0, oy0 = mask ? mask.oy : 0;
  for (const lay of this.layers) {
    let P_ = this._pose(lay, t); if (!P_) continue;
    const jl = lay.cfg.follow ? this._byId[lay.cfg.follow] : lay, c = jl.cfg, jit = (!fz && P_.ph === 'post' && c.boil) ? c.boil * smooth(prog(t - T - c.c, 0.2, 0.5)) : 0;
    const jx = jit ? (hash01(f8 * 131 + jl.i * 977 + 11) - 0.5) * 2 * jit : 0, jy = jit ? (hash01(f8 * 211 + jl.i * 613 + 5) - 0.5) * 2 * jit : 0;
    const jr = jit ? (hash01(f8 * 97 + jl.i * 389 + 3) - 0.5) * 2 * 0.0032 * jit : 0;
    const s = P_.s * xf.gs, eff = (k * s * this.dpr) / A;
    // atlas: o de trabalho (na resolução da tela) ou o completo quando ampliado demais
    let src, f;
    if (mask) { src = this._mask; f = W.f; }
    else if (eff > W.need * 1.5 && W.f !== 1) { src = this.img.atlas; f = 1; }
    else { src = W.src; f = W.f; }
    if (!src) continue;
    const pcx = (lay.x + lay.w / 2 - LOGO_C.cx) * k, pcy = (lay.y + lay.h - LOGO_C.cy) * k;
    x.save();
    x.globalAlpha = (mask ? 1 : alpha) * clamp(P_.a) * (mask ? 1 : xf.gAlpha);
    x.translate(Lx + (P_.ox + jx) * k - ox0, Ly + (P_.oy + jy) * k - oy0);
    x.rotate(P_.rot + jr); x.scale(s, s);
    if (P_.sx !== 1 || P_.sy !== 1) { x.translate(pcx, pcy); x.scale(P_.sx, P_.sy); x.translate(-pcx, -pcy); }
    if (P_.ls) {   // pulinho local (flor): escala/gira em torno do próprio centro
      const lcx = (lay.x + lay.w / 2 - LOGO_C.cx) * k, lcy = (lay.y + lay.h / 2 - LOGO_C.cy) * k;
      x.translate(lcx, lcy); x.rotate(P_.lr); x.scale(P_.ls, P_.ls); x.translate(-lcx, -lcy);
    }
    const dx = (lay.x - LOGO_C.cx) * k, dy = (lay.y - LOGO_C.cy) * k, dw = lay.w * k, dh = lay.h * k;
    // rastro de aproximação (cópias mais fracas, só enquanto "voa")
    if (!ghost && !mask && P_.ph === 'pre' && P_.e > 0.12) {
      for (let g = 2; g >= 1; g--) {
        const pg = this._pose(lay, t - g * 0.017); if (!pg || pg.ph !== 'pre') continue;
        x.save(); x.globalAlpha *= 0.22 / g; const r = pg.s / P_.s; x.scale(r, r);
        x.drawImage(src, lay.ax * f, lay.ay * f, lay.aw * f, lay.ah * f, dx, dy, dw, dh); x.restore();
      }
    }
    x.drawImage(src, lay.ax * f, lay.ay * f, lay.aw * f, lay.ah * f, dx, dy, dw, dh);
    x.restore();
  }
};

/** Brilho holográfico varrendo SÓ o logo (máscara = tinta clara do próprio logo, nunca o fundo). */
P._drawShine = function (ctx, t) {
  if (!this._mask || !this._shine) return;
  const T = this.T, L = this.L;
  const tt = t - (T + 0.95); if (tt < 0) return;
  const ph = (tt % SHINE_PERIOD) / SHINE_DUR; if (ph >= 1) return;
  const sc = this._shine, sm = this._shineM, sx = sc.getContext('2d'), mx = sm.getContext('2d'), dpr = this.dpr;
  const bw = sc.width / dpr, bh = sc.height / dpr, bx = L.logo.cx - bw / 2, by = L.logo.cy - bh / 2;
  const reset = (c) => { c.setTransform(1, 0, 0, 1, 0, 0); c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1; c.clearRect(0, 0, sc.width, sc.height); c.setTransform(dpr, 0, 0, dpr, 0, 0); };
  // 1) faixas diagonais com arco-íris
  reset(sx);
  const cxp = lerp(-0.25 * bw, 1.25 * bw, easeInOutCubic(ph));
  const band = (off, hw, a) => {
    sx.save(); sx.translate(cxp - off, bh / 2); sx.rotate(0.38);
    const g = sx.createLinearGradient(-hw, 0, hw, 0);
    g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.24, 'rgba(90,225,255,0.5)'); g.addColorStop(0.5, 'rgba(255,248,235,0.62)');
    g.addColorStop(0.76, 'rgba(255,100,215,0.5)'); g.addColorStop(1, 'rgba(255,255,255,0)');
    sx.globalAlpha = a; sx.fillStyle = g; sx.fillRect(-hw, -bh * 1.2, hw * 2, bh * 2.4); sx.restore();
  };
  band(0, bw * 0.13, 1); band(bw * 0.19, bw * 0.04, 0.5);
  // 2) máscara do logo (as camadas na mesma pose do quadro) em outra tela
  reset(mx);
  this._drawLogo(null, t, 1, true, { ctx: mx, ox: bx, oy: by });
  // 3) faixa x máscara: a luz só existe dentro da tinta clara do logo
  sx.setTransform(1, 0, 0, 1, 0, 0); sx.globalCompositeOperation = 'destination-in'; sx.drawImage(sm, 0, 0);
  sx.globalCompositeOperation = 'source-over';
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  ctx.globalAlpha = 0.8 * Math.sqrt(Math.sin(ph * Math.PI)) * this._logoXf(t).gAlpha;
  ctx.drawImage(sc, 0, 0, sc.width, sc.height, bx, by, bw, bh);
  ctx.restore();
};

P._drawLogoSparks = function (ctx, t) {
  const T = this.T, dt = t - T; if (dt < 0.28) return;
  const L = this.L, k = L.logo.k, xf = this._logoXf(t), fz = this._freeze;
  const shine = (() => { const tt = t - (T + 0.95); if (tt < 0) return 0; const ph = (tt % SHINE_PERIOD) / SHINE_DUR; return ph < 1 ? Math.sin(ph * Math.PI) : 0; })();
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  SPARKS.forEach((s, i) => {
    const tw = fz ? 0.55 : 0.5 + 0.5 * Math.sin(t * (1.7 + i * 0.37) + i * 2.1);
    const a = smooth(prog(dt, 0.28 + i * 0.05, 0.6 + i * 0.05)) * (0.18 + 0.82 * Math.pow(tw, 2) + 0.5 * shine) * xf.gAlpha;
    const x = L.logo.cx + (s.x - LOGO_C.cx) * k * xf.gs, y = L.logo.cy + xf.gy + (s.y - LOGO_C.cy) * k * xf.gs;
    sparkle(ctx, x, y, s.r * k * xf.gs * (0.75 + 0.4 * tw + 0.25 * shine), 0, a * 0.9, '#fffbe8', true);
  });
  ctx.restore();
};

// ============================================================================
//  Interface: BETA, versão, barra de progresso, "Press any key"
// ============================================================================
P._drawUI = function (ctx, t, ex) {
  const L = this.L, u = L.u, T = this.T, dt = t - T, o = this.opt, fz = this._freeze;
  const uiA = ex >= 0 ? 1 - smooth(prog(ex, 0, 0.22)) : 1;
  // --- BETA: "tapa" de selo depois do golpe ---
  if (o.showBeta && dt > 0.45) {
    const q = dt - 0.47, p = prog(q, 0, 0.2), post = Math.max(q - 0.2, 0);
    const s = p < 1 ? lerp(2.7, 1, easeInCubic(p)) : 1 + 0.18 * Math.exp(-post * 9) * Math.cos(post * 26);
    const rot = p < 1 ? lerp(-0.26, 0, easeInCubic(p)) : 0.05 * Math.exp(-post * 8) * Math.sin(post * 22);
    const f8 = Math.floor(t * 8), bob = fz ? 0 : Math.sin(t * 1.9) * 1.6 * u, jr = fz ? 0 : (hash01(f8 * 53 + 9) - 0.5) * 0.018;
    const b = L.beta, bcx = b.x + b.w / 2, bcy = b.y + b.h / 2 + bob;
    ctx.save(); ctx.globalAlpha = smooth(p * 2.5) * uiA; ctx.translate(bcx, bcy); ctx.rotate(rot + jr); ctx.scale(s, s);
    ctx.imageSmoothingQuality = 'high'; ctx.drawImage(this._betaS, -b.w / 2, -b.h / 2, b.w, b.h);
    ctx.restore();
    if (q > 0 && q < 0.45) {  // faíscas do selo
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      const e = prog(q, 0.1, 0.45), a = Math.sin(e * Math.PI);
      sparkle(ctx, b.x - 10 * u, b.y + b.h * 0.12, 34 * u * a, e * 2, a, '#fff', true);
      sparkle(ctx, b.x + b.w + 4 * u, b.y + b.h * 0.8, 26 * u * a, -e * 2, a * 0.9, '#fff', true);
      ctx.restore();
    }
  }
  // --- versão ---
  if (dt > 0.9 && o.texts.version) {
    const a = smooth(prog(dt, 0.9, 1.3)) * uiA, v = L.version;
    ctx.save(); ctx.globalAlpha = a; ctx.font = `${L.fs.version}px ${this._fam}`; ctx.textAlign = 'right'; ctx.textBaseline = 'alphabetic';
    ctx.shadowColor = 'rgba(255,255,255,0.55)'; ctx.shadowBlur = 8 * u; ctx.fillStyle = '#fff';
    ctx.fillText(o.texts.version, v.right, v.base + (1 - prog(dt, 0.9, 1.3)) * 10 * u);
    ctx.restore();
  }
  // --- barra de progresso -> "Press any key to continue." ---
  const tr = this._tReady;
  if (dt > 0.85) {
    if (tr == null) { if (this._progressUsed) this._drawBar(ctx, t, uiA); }
    else {
      const q = t - tr, barOut = 1 - prog(q, 0, 0.28);
      if (this._progressUsed && barOut > 0) this._drawBar(ctx, t, uiA * barOut, q);
      const pp = prog(q, 0.2, 0.62), pop = pp < 1 ? easeOutBack(pp, 2.2) : 1;
      if (pp > 0) this._drawPrompt(ctx, t, o.texts.prompt, pop, smooth(pp * 3), ex, q);
    }
  }
};

P._drawBar = function (ctx, t, alpha, q) {
  const L = this.L, u = L.u, b = L.bar, dt = t - this.T;
  const appear = smooth(prog(dt, 0.85, 1.2));
  let w = b.w * easeOutBack(prog(dt, 0.85, 1.25), 1.6);
  if (q != null) w *= 1 - easeInBack(prog(q, 0.05, 0.28), 2);
  if (w <= 1) return;
  const x = b.cx - w / 2, y = b.cy - b.h / 2, r = b.h / 2, p = this._progDisp;
  ctx.save(); ctx.globalAlpha = alpha * appear;
  const rr = (X, Y, W, H, R) => { ctx.beginPath(); ctx.roundRect ? ctx.roundRect(X, Y, W, H, R) : ctx.rect(X, Y, W, H); };
  // contorno preto + trilho
  rr(x - 5 * u, y - 5 * u, w + 10 * u, b.h + 10 * u, r + 5 * u); ctx.fillStyle = COL.ink; ctx.fill();
  rr(x, y, w, b.h, r); ctx.fillStyle = 'rgba(255,255,255,0.22)'; ctx.fill();
  // preenchimento (sobe suave, com brilho)
  const fw = Math.max(w * p, b.h);
  ctx.save(); rr(x, y, w, b.h, r); ctx.clip();
  const g = ctx.createLinearGradient(x, 0, x + w, 0);
  g.addColorStop(0, COL.hot); g.addColorStop(0.55, COL.cream); g.addColorStop(1, '#fff');
  ctx.fillStyle = g; ctx.fillRect(x, y, fw, b.h);
  ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.fillRect(x, y + b.h * 0.12, fw, b.h * 0.22);
  ctx.restore();
  // faísca na ponta
  ctx.globalCompositeOperation = 'lighter';
  const hx = x + Math.min(fw, w), pulse = 0.7 + 0.3 * Math.sin(t * 9);
  sparkle(ctx, hx, b.cy, 30 * u * pulse, t * 2, 1, '#fff', true);
  if (q != null) { const f = Math.sin(clamp(q / 0.28) * Math.PI); ctx.globalAlpha = alpha * f * 0.9; ctx.fillStyle = '#fff'; rr(x, y, w, b.h, r); ctx.fill(); }
  ctx.restore();
};

P._drawPrompt = function (ctx, t, text, scale, alpha, ex, q) {
  const L = this.L, u = L.u, p = L.prompt, fm = this._fm.prompt, fs = L.fs.prompt;
  const beat = this._beatEnv(t, false) * (q != null ? 1 : 0), fz = this._freeze;
  const exitF = ex != null && ex >= 0 ? prog(ex, 0, 0.24) : 0;
  const sc = scale * (1 + 0.025 * beat) * (1 + 0.5 * easeOutCubic(exitF));
  const a = alpha * (1 - smooth(exitF));
  if (a <= 0.003) return;
  ctx.save(); ctx.globalAlpha = clamp(a);
  ctx.font = `${fs}px ${this._fam}`; ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
  const inkW = p.inkW, tw = ctx.measureText(text).width, k = 1;
  // para textos diferentes do padrão, centraliza pela largura medida
  const left = text === this.opt.texts.prompt ? p.cx - inkW / 2 + fm.l * fs / 100 : p.cx - tw / 2;
  const base = p.inkTop + fm.a * fs / 100, cx = p.cx, cy = base - fs * 0.3;
  ctx.translate(cx, cy); ctx.scale(sc * k, sc * k); ctx.translate(-cx, -cy);
  const glow = 0.5 + (fz ? 0 : 0.18 * Math.sin(t * 2.6)) + 0.3 * beat;
  ctx.shadowColor = `rgba(255,255,255,${clamp(glow)})`; ctx.shadowBlur = 26 * u;
  ctx.fillStyle = '#fff'; ctx.fillText(text, left, base);
  ctx.shadowBlur = 8 * u; ctx.fillText(text, left, base);
  ctx.restore();
};

/** Flash do golpe: quadro invertido (1–3 quadros) + clarão; na saída, clarão e fade. */
P._drawFlash = function (ctx, t, ex) {
  const L = this.L, T = this.T, dt = t - T, red = this._reduced;
  if (dt >= 0 && dt < 0.5) {
    if (!red && dt < 0.05) { ctx.save(); ctx.globalCompositeOperation = 'difference'; ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, L.w, L.h); ctx.restore(); }
    else {
      const a = (red ? 0.25 : 0.55) * Math.exp(-(dt - 0.05) * 14);
      if (a > 0.004) { ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.globalAlpha = a; ctx.fillStyle = '#fff4d8'; ctx.fillRect(0, 0, L.w, L.h); ctx.restore(); }
    }
  }
  // aumento de brilho pré-golpe (o céu "acende")
  if (dt > -0.12 && dt < 0) { ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.globalAlpha = 0.25 * prog(dt, -0.12, 0); ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, L.w, L.h); ctx.restore(); }
  if (ex >= 0) {
    const a = smooth(prog(ex, 0.62, 0.9));
    if (a > 0.004) { ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, L.w, L.h); ctx.restore(); }
    // canvas some revelando a tela de baixo
    this.canvas.style.opacity = String(1 - smooth(prog(ex, 1.0, EXIT_END)));
    // linhas radiais na saída
    this._drawExitLines(ctx, ex);
  } else this.canvas.style.opacity = String(smooth(prog(t, 0, this._reduced ? 0.15 : 0.65)));
  if (this.opt.container) this.opt.container.closest('.duel-intro').style.opacity = ex >= 0 ? String(1 - smooth(prog(ex, 1.0, EXIT_END))) : '1';
};

P._drawExitLines = function (ctx, ex) {
  if (ex < 0.2 || ex > 1.0) return;
  const L = this.L, u = L.u, cx = L.logo.cx, cy = L.logo.cy, rnd = mulberry32(99), R = Math.hypot(L.w, L.h);
  ctx.save(); ctx.lineCap = 'round'; ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 36; i++) {
    const ang = rnd() * TAU, w = (2 + rnd() * 5) * u, d = rnd() * 0.15, q = prog(ex, 0.2 + d, 0.9);
    if (q <= 0) continue;
    const r0 = lerp(120 * u, R * 0.6, easeInCubic(q)), r1 = r0 + (200 + rnd() * 500) * u * q;
    ctx.globalAlpha = 0.6 * Math.sin(q * Math.PI); ctx.strokeStyle = i % 3 ? '#fff' : COL.cream2; ctx.lineWidth = w;
    ctx.beginPath(); ctx.moveTo(cx + Math.cos(ang) * r0, cy + Math.sin(ang) * r0); ctx.lineTo(cx + Math.cos(ang) * r1, cy + Math.sin(ang) * r1); ctx.stroke();
  }
  ctx.restore();
};




class IntroPreview {
  constructor(o) {
    this.intro = new GoghosIntro({container:o.parent, baseUrl:'assets/intro-preview/',
      gate:false, autoExit:true, sfx:o.sfx, sfxVolume:o.sfxVolume,
      music:o.music ? {src:o.base+o.assets.music, volume:o.volume, loop:false} : null,
      reducedMotion:o.reducedMotion, zIndex:o.zIndex,
      texts:{version:o.version,prompt:'Pronto para duelar!',gate:'Toque para iniciar'},
      onReady:()=>o.onProgress?.(1,'ready'), onFinished:()=>o.onDone?.()});
    this.o=o;
  }
  load(){return this.intro.load();}
  start(){return this.intro.start();}
  setProgress(p){this.intro.setProgress(p);this.o.onProgress?.(p,'loading');}
  destroy(){this.intro.destroy({stopMusic:true});}
}
G.IntroPreview = IntroPreview;
})(globalThis.GOGHOS);
