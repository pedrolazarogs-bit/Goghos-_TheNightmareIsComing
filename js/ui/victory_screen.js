(function(G){

/*!
 * GOGHOS — Tela de Vitória
 * ---------------------------------------------------------------------------
 * Módulo único, sem dependências, canvas 2D. Mesma linguagem de animação da
 * intro (golpe sincronizado com a música, brilho, confete com contorno, traço
 * "tremendo" a 8 quadros/s). Usa as ilustrações do projeto: o fundo, o troféu
 * e a fonte German Beauty.
 *
 *   import { GoghosVictory } from './goghos-vitoria.js';
 *   const v = new GoghosVictory({
 *     baseUrl: './assets/',
 *     music: { src: 'WinMusic.mp3', hitTime: 1.64, bpm: 133.3 },
 *     rewards: [{ id: 'xp', label: 'XP', value: 250 }, { id: 'dalycoin', label: 'Dalycoin', value: 120 }],
 *     onChoice: (c) => console.log(c),            // 'play' | 'menu'
 *   });
 *   await v.load();
 *   v.start();
 *   const { choice } = await v.finished;          // quando a saída termina
 *
 * COMO O TEMPO FUNCIONA
 *   Tudo é função do tempo `t` (s desde o início da música), com semente fixa:
 *   o mesmo `t` sempre desenha o mesmo quadro. O golpe cai em t = hitTime e
 *   as demais entradas caem em batidas (bpm) depois dele. Com música, o
 *   relógio é ancorado no áudio (correção suave de deriva).
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
  plate: '#2a1750', plate2: '#150c2c',
};
const CONFETTI_COLORS = [COL.pink, COL.yellow, COL.cyan, COL.white, COL.violet, COL.mint, COL.cream];

// ============================================================================
//  Medidas do troféu (PNG 2048x2048 enviado; ver tools/medir_trofeu.py)
// ============================================================================
const TRO = { x0: 558, y0: 567, w: 982, h: 828, cx: 1048.5, cy: 980.5 };       // caixa do desenho
const TRO_EYES = [{ x: 974.4, y: 914.1 }, { x: 1122.6, y: 914.1 }];             // centro dos olhos vermelhos
const TRO_BADGE = { x: 1050, y: 1280 };                                         // estrela "#1" da base
const TRO_SPARKS = [                                                            // pontas para as faíscas {x,y,r}
  { x: 1048, y: 590, r: 54 }, { x: 612, y: 632, r: 46 }, { x: 1486, y: 632, r: 46 },
  { x: 848, y: 580, r: 36 }, { x: 1249, y: 580, r: 36 },
];
const PAD = 4;                                                                  // folga ao recortar o troféu

// ============================================================================
//  Opções padrão
// ============================================================================
const DEFAULTS = {
  container: null,               // elemento onde a tela entra (padrão: document.body, tela cheia)
  baseUrl: './assets/',
  assets: {                      // URLs individuais (aceita data: URI). xp/moeda: ícones opcionais (PNG)
    fundo: 'fundo.jpg', trofeu: 'trofeu.png', fonte: 'german_beauty.ttf', xp: null, moeda: null,
  },
  fontFamily: 'German Beauty',
  music: null,                   // string (URL) ou { src, hitTime, bpm, volume, loop }
  hitTime: 1.64,                 // instante do golpe (s) — o 1º golpe da WinMusic.mp3
  bpm: 133.3,                    // batida da WinMusic.mp3 (as entradas caem em batidas)
  sfx: true,                     // efeitos sintetizados discretos (false desliga)
  gate: 'auto',                  // 'auto' | true | false — tela de "toque para começar" se o áudio estiver bloqueado
  rewards: [                     // de 1 a 4; pensado para XP e Dalycoin
    { id: 'xp', label: 'XP', value: 0 },
    { id: 'dalycoin', label: 'Dalycoin', value: 0 },
  ],
  texts: { title: 'VITÓRIA!', menu: 'MENU', play: 'JOGAR', gate: 'Press any key to start.' },
  locale: 'pt-BR',               // formatação dos números (1.250)
  fadeMusicOnExit: 800,          // ms de fade da música ao escolher (0/false = a música segue)
  seed: 1101,
  maxDpr: 2,
  reducedMotion: 'auto',         // 'auto' respeita prefers-reduced-motion; true/false força
  zIndex: 9999,
  onReady: null,                 // chamado quando os botões ficam ativos
  onChoice: null,                // chamado ao escolher: 'play' | 'menu' (a saída começa agora)
  onFinished: null,              // chamado quando a saída termina
};

const EXIT_END = 1.45;           // duração da saída (s)
const SHINE_DUR = 1.15;          // duração de uma varredura de brilho (s)
const TOKENS = 6;                // quantas "peças" voam do troféu para cada recompensa

/** Normaliza a lista de recompensas. */
function normalizeRewards(list) {
  return (Array.isArray(list) ? list : []).slice(0, 4).map((r, i) => ({
    id: r.id || ('r' + i),
    label: r.label != null ? String(r.label) : (r.id === 'xp' ? 'XP' : r.id === 'dalycoin' ? 'Dalycoin' : ''),
    value: Math.max(0, Math.round(+r.value || 0)),
    icon: r.icon || (r.id === 'xp' ? 'star' : 'coin'),          // 'star' | 'coin' | URL de imagem
    prefix: r.prefix != null ? String(r.prefix) : '+',
    bar: r.bar && typeof r.bar === 'object' ? { from: clamp(+r.bar.from || 0), to: clamp(+r.bar.to || 0) } : null,
  }));
}

// ============================================================================
//  Carregamento
// ============================================================================
function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('GoghosVictory: falha ao carregar ' + String(url).slice(0, 80)));
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
//  Estrela de 4 pontas (brilho) e estrela de N pontas
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
/** Caminho do "cartão": retângulo com dois cantos cortados (estilo quadrinhos). */
function platePath(ctx, w, h, cut) {
  ctx.beginPath();
  ctx.moveTo(-w / 2 + cut, -h / 2); ctx.lineTo(w / 2, -h / 2); ctx.lineTo(w / 2, h / 2 - cut);
  ctx.lineTo(w / 2 - cut, h / 2); ctx.lineTo(-w / 2, h / 2); ctx.lineTo(-w / 2, -h / 2 + cut); ctx.closePath();
}
/** Paralelogramo do botão (inclinado para a direita). */
function btnPath(ctx, w, h, sk) {
  ctx.beginPath();
  ctx.moveTo(-w / 2 + sk, -h / 2); ctx.lineTo(w / 2 + sk, -h / 2); ctx.lineTo(w / 2 - sk, h / 2); ctx.lineTo(-w / 2 - sk, h / 2); ctx.closePath();
}

// ============================================================================
//  A classe principal
// ============================================================================
class GoghosVictory {
  constructor(options = {}) {
    const o = Object.assign({}, DEFAULTS, options);
    o.assets = Object.assign({}, DEFAULTS.assets, options.assets || {});
    o.texts = Object.assign({}, DEFAULTS.texts, options.texts || {});
    if (typeof o.music === 'string') o.music = { src: o.music };
    this.opt = o;
    this.rewards = normalizeRewards(o.rewards);
    this.music_ = null;                                    // <audio> (ver getter `music`)
    this.T = (o.music && o.music.hitTime != null) ? o.music.hitTime : o.hitTime;   // instante do golpe
    this.bpm = (o.music && o.music.bpm) || o.bpm;
    this.beat = 60 / this.bpm;
    this._timeline();
    this.state = 'idle';       // idle -> loaded -> gate -> show -> exit -> done
    this.choice = null;
    this.finished = new Promise((res) => { this._resolveFinished = res; });
    this._loadP = null;
    this._t0 = 0; this._gateT0 = 0; this._lastTick = 0; this._skipOff = 0; this._skipT = -9;
    this._raf = 0; this._freeze = false; this._reduced = false; this._sfxOn = !!o.sfx;
    this._ctxA = null; this._musicOK = false; this._destroyed = false; this._lat = 0;
    this._ready = false; this._tExit = null; this._chosen = null;
    this._focus = 'play'; this._hover = null; this._press = null; this._kbd = false;
    this._bs = { menu: { hov: 0, press: 0 }, play: { hov: 0, press: 0 } };
    this._icons = []; this._tw = new Map();
  }

  /** Linha do tempo: o golpe em T e as entradas em batidas depois dele. */
  _timeline() {
    const T = this.T, b = this.beat;
    const TL = {
      title0: T + 0.14, titleStep: 0.055,                 // letras do título
      cards0: T + 2 * b, cardStep: 0.12, cardDur: 0.5,    // cartões de recompensa
      launch0: T + 3 * b, launchGap: b / 2, flight: b,    // peças voando do troféu aos cartões
      count0: T + 4 * b, count1: T + 6.5 * b,             // contagem dos números (chegadas nas batidas)
      btn0: T + 7 * b, btnStep: 0.1, btnDur: 0.45,        // botões
      shine0: T + 2 * b, shinePeriod: 8 * b,              // brilho holográfico a cada 8 batidas
    };
    TL.allIn = TL.btn0 + TL.btnStep + TL.btnDur + 0.02;   // tudo no lugar
    TL.ready = TL.allIn - 0.12;                           // botões ativos
    this.TL = TL;
  }

  /** Elemento <audio> da trilha (null se não houver). Continua tocando depois da tela. */
  get music() { return this.music_; }

  // ------------------------------------------------------------------ API --
  /** Carrega imagens e fonte. Devolve uma Promise (memoizada). */
  load() {
    if (this._loadP) return this._loadP;
    const o = this.opt, a = o.assets;
    const url = (u) => (/^(data:|blob:|https?:|\/)/.test(u) ? u : o.baseUrl + u);
    const iconUrl = (r) => (r.icon && r.icon !== 'star' && r.icon !== 'coin') ? r.icon : (r.id === 'xp' ? a.xp : r.id === 'dalycoin' ? a.moeda : null);
    this._loadP = Promise.all([
      loadImage(url(a.fundo)), loadImage(url(a.trofeu)), loadFont(o.fontFamily, url(a.fonte)),
      ...this.rewards.map((r) => { const u = iconUrl(r); return u ? loadImage(url(u)).catch(() => null) : Promise.resolve(null); }),
    ]).then(([bg, tro, , ...icons]) => {
      this.img = { bg, tro }; this._icons = icons;
      this._prepare();
      if (this.state === 'idle') this.state = 'loaded';
      return this;
    });
    return this._loadP;
  }

  /**
   * Começa a tela. Chame dentro de um toque/tecla para já ter áudio; se o
   * navegador bloquear o áudio, aparece antes a tela "Press any key to start".
   */
  async start() {
    await this.load();
    if (this._destroyed || this.state === 'gate' || this.state === 'show' || this.state === 'exit') return this;
    this._reduced = this.opt.reducedMotion === 'auto'
      ? !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches)
      : !!this.opt.reducedMotion;
    this._createCanvas();
    this._warm();
    this._bindInput();
    this._initAudio();
    let needGate = this.opt.gate === true;
    if (this.opt.gate === 'auto' && this._ctxA) {
      try { this._ctxA.resume(); } catch (e) { /* ignora */ }
      await Promise.race([new Promise((r) => setTimeout(r, 90)), this._ctxA.state === 'running' ? Promise.resolve() : new Promise(() => {})]);
      needGate = this._ctxA.state !== 'running';
    }
    if (this._destroyed) return this;
    this._lastTick = performance.now() / 1000;
    if (needGate) { this.state = 'gate'; this._gateT0 = this._lastTick; }
    else this._beginShow();
    this._raf = requestAnimationFrame(this._loop);
    return this;
  }

  /** Troca as recompensas (use antes de start(); depois, só valores/rótulos). */
  setRewards(list) {
    this.rewards = normalizeRewards(list);
    if (this.img) { this._prepareRewards(); if (this.canvas) this._resize(true); }
  }

  /** Pula a animação de entrada até os botões (ignorado antes do golpe assentar). */
  skip() {
    if (this.state !== 'show' || this._ready) return false;
    const t = this._now(), b = this.beat;
    if (t < this.T + 0.9) return false;
    const d = Math.ceil((this.TL.allIn - t) / b) * b;        // múltiplo de batida: a pulsação continua no ritmo
    if (d <= 0) return false;
    this._skipOff += d; this._skipT = performance.now() / 1000;
    this._evSkipBefore = t + d;
    if (this._sfxOn && this._ctxA && this._ctxA.state === 'running') this._sfxPop(this._ctxA.currentTime + 0.01, 988);
    return true;
  }

  /** Escolhe 'play' ou 'menu' (o mesmo que clicar no botão). */
  select(id) { return this._choose(id); }

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
    if (this._ctxA && !this.music_) { try { this._ctxA.close(); } catch (e) { /* ignora */ } }
    this.state = 'done';
    this._resolveFinished({ choice: this.choice, destroyed: true });
  }

  // ------------------------------------------------------------ preparação --
  _prepare() {
    const o = this.opt, rnd = mulberry32(o.seed), T = this.T;
    // troféu recortado (caixa do desenho + folga) e olhos vermelhos separados
    const spr = makeCanvas(TRO.w + PAD * 2, TRO.h + PAD * 2);
    spr.getContext('2d').drawImage(this.img.tro, -(TRO.x0 - PAD), -(TRO.y0 - PAD));
    this._spr = spr;
    this._eyesFull = null;
    try {
      const ec = makeCanvas(spr.width, spr.height), ex = ec.getContext('2d', { willReadFrequently: true });
      ex.drawImage(spr, 0, 0);
      const id = ex.getImageData(0, 0, ec.width, ec.height), d = id.data;
      for (let i = 0; i < d.length; i += 4) {
        const isRed = d[i] > 170 && d[i + 1] < 90 && d[i + 2] < 120;
        d[i + 3] = isRed ? d[i + 3] : 0;
      }
      ex.putImageData(id, 0, 0);
      this._eyesFull = ec;
    } catch (e) { this._eyesFull = null; }       // canvas "tainted": sem o brilho dos olhos
    // partículas da fase de tensão (convergem para o troféu)
    const t0c = Math.min(0.3, T * 0.25);
    this._conv = Array.from({ length: 72 }, () => {
      const d = t0c + rnd() * Math.max(T - t0c - 0.55, 0.2), life = Math.min(0.45 + rnd() * 0.35, T - d - 0.02);
      return { ang: rnd() * TAU, r0: 480 + rnd() * 620, d, life: Math.max(life, 0.2), spin: (rnd() - 0.5) * 2.6, size: 2 + rnd() * 3.6,
        col: [COL.white, COL.cream, COL.pink, COL.cyan][(rnd() * 4) | 0] };
    });
    this._convLines = Array.from({ length: 26 }, () => ({ ang: rnd() * TAU, tail: 120 + rnd() * 220, w: 2 + rnd() * 3.2, dl: rnd() * 0.12 }));
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
    // confete com contorno (um pouco mais que na intro: é uma comemoração)
    this._conf = Array.from({ length: 92 }, () => {
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
    this._rndTok = Array.from({ length: 4 * TOKENS }, () => ({ arc: 110 + rnd() * 90, side: (rnd() - 0.5) * 90, spin: 6 + rnd() * 6, ph: rnd() * TAU }));
    this._prepareRewards();
    this._calibrateFont();
  }

  /** Peças que voam do troféu para cada cartão + lista de efeitos sonoros (por tempo). */
  _prepareRewards() {
    const TL = this.TL, tokens = [], ev = [];
    this.rewards.forEach((r, i) => {
      for (let k = 0; k < TOKENS; k++) {
        const rn = this._rndTok[i * TOKENS + k], launch = TL.launch0 + k * TL.launchGap + i * 0.04;
        tokens.push({ i, k, launch, arrive: launch + TL.flight, arc: rn.arc, side: rn.side, spin: rn.spin, ph: rn.ph });
        ev.push({ t: launch + TL.flight, fn: 'tick', k, coin: this._kind(i) === 'coin' });
      }
      ev.push({ t: TL.cards0 + i * TL.cardStep + TL.cardDur * 0.5, fn: 'pop', f: 660 + i * 220 });
    });
    ev.push({ t: TL.count1 + 0.02, fn: 'glint' });
    ev.push({ t: TL.btn0 + 0.18, fn: 'pop', f: 784 }, { t: TL.btn0 + TL.btnStep + 0.18, fn: 'pop', f: 988 });
    ev.sort((a, b) => a.t - b.t);
    this._tokens = tokens; this._ev = ev;
  }

  /** 'star' | 'coin' do cartão i. */
  _kind(i) {
    const r = this.rewards[i];
    return r.icon === 'star' || r.icon === 'coin' ? r.icon : (r.id === 'xp' ? 'star' : 'coin');
  }

  /** Mede a fonte do título (posição de cada letra) para casar com a largura desejada. */
  _calibrateFont() {
    const c = makeCanvas(8, 8).getContext('2d'), fam = `"${this.opt.fontFamily}", "Comic Sans MS", cursive`;
    this._fam = fam; c.font = `100px ${fam}`;
    const txt = this.opt.texts.title, q = c.measureText(txt);
    const adv = []; for (let i = 0; i <= txt.length; i++) adv.push(c.measureText(txt.slice(0, i)).width);
    this._fm = { title: { adv, total: q.width, ink: q.actualBoundingBoxLeft + q.actualBoundingBoxRight, l: q.actualBoundingBoxLeft, asc: q.actualBoundingBoxAscent } };
  }

  /** Largura (px de CSS) de um texto na fonte dada, com cache. */
  _width(ctx, text, font) {
    const key = font + '|' + text;
    let w = this._tw.get(key);
    if (w == null) { ctx.save(); ctx.font = font; w = ctx.measureText(text).width; ctx.restore(); this._tw.set(key, w); }
    return w;
  }

  // ---------------------------------------------------------------- canvas --
  _createCanvas() {
    const o = this.opt;
    this.host = o.container || document.body;
    const full = !o.container || o.container === document.body;
    const c = document.createElement('canvas');
    c.setAttribute('aria-label', o.texts.title + ' ' + this.rewards.map((r) => `${r.label} ${r.prefix}${r.value}`).join(', '));
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

  _resize(force) {
    if (!this.canvas) return;
    const full = !this.opt.container || this.opt.container === document.body;
    const w = full ? window.innerWidth : this.host.clientWidth, h = full ? window.innerHeight : this.host.clientHeight;
    if (!w || !h) return;
    const dpr = Math.min(window.devicePixelRatio || 1, this.opt.maxDpr);
    if (!force && this.L && w === this.cssW && h === this.cssH && dpr === this.dpr) return;   // nada mudou: não apaga o canvas
    this.cssW = w; this.cssH = h; this.dpr = dpr;
    this.canvas.width = Math.round(w * dpr); this.canvas.height = Math.round(h * dpr);
    this._layout();
    this._buildWork();
  }

  /** Posições/tamanhos em px de CSS. Paisagem: palco 1920x1080; retrato: palco 1080x1920. */
  _layout() {
    const w = this.cssW, h = this.cssH, portrait = h > w, L = { w, h, portrait }, n = this.rewards.length;
    if (!portrait) {
      const u = Math.min(w / 1920, h / 1080), ox = (w - 1920 * u) / 2, oy = (h - 1080 * u) / 2;
      Object.assign(L, { u, ox, oy });
      const X = (x) => ox + x * u, Y = (y) => oy + y * u;
      L.tro = { cx: X(960), cy: Y(548), k: 0.68 * u };
      L.title = { cx: X(960), base: Y(212), w: 830 * u };
      const cw = 470 * u, ch = 236 * u, gap = 28 * u, half = L.tro.k * TRO.w / 2;
      const cols = [[], []];
      this.rewards.forEach((r, i) => cols[n === 1 ? 1 : i % 2].push(i));
      const xs = [L.tro.cx - half - 44 * u - cw, L.tro.cx + half + 44 * u];
      L.cards = [];
      cols.forEach((col, ci) => {
        const tot = col.length * ch + (col.length - 1) * gap;
        col.forEach((ri, j) => { L.cards[ri] = { x: xs[ci], y: L.tro.cy - tot / 2 + j * (ch + gap), w: cw, h: ch, rot: (ci ? 1 : -1) * 0.035, side: ci ? 1 : -1 }; });
      });
      const bw = 380 * u, bh = 120 * u, bg = 60 * u, by = Y(940);
      L.buttons = [{ id: 'menu', x: X(960) - bg / 2 - bw, y: by - bh / 2, w: bw, h: bh }, { id: 'play', x: X(960) + bg / 2, y: by - bh / 2, w: bw, h: bh }];
      L.burstR = 520 * u;
    } else {
      const u = Math.min(w / 1080, h / 1920), ox = (w - 1080 * u) / 2, oy = (h - 1920 * u) / 2;
      Object.assign(L, { u, ox, oy });
      const X = (x) => ox + x * u, Y = (y) => oy + y * u;
      L.tro = { cx: X(540), cy: Y(735), k: 0.80 * u };
      L.title = { cx: X(540), base: Y(300), w: 900 * u };
      const cw = 780 * u, gap = 24 * u, avail = 470 * u, ch = clamp((avail - (n - 1) * gap) / Math.max(n, 1), 100 * u, 200 * u);
      const tot = n * ch + (n - 1) * gap, top = Y(1110) + Math.max(0, (avail - tot) / 2);
      L.cards = this.rewards.map((r, j) => ({ x: X(540) - cw / 2, y: top + j * (ch + gap), w: cw, h: ch, rot: (j % 2 ? 1 : -1) * 0.02, side: j % 2 ? 1 : -1 }));
      const bw = 440 * u, bh = 130 * u, bg = 44 * u, by = Y(1715);
      L.buttons = [{ id: 'menu', x: X(540) - bg / 2 - bw, y: by - bh / 2, w: bw, h: bh }, { id: 'play', x: X(540) + bg / 2, y: by - bh / 2, w: bw, h: bh }];
      L.burstR = 560 * u;
    }
    L.sun = { x: L.tro.cx, y: L.tro.cy };
    L.bgK0 = portrait ? 0 : 1.3714 * L.u;      // escala do fundo da intro (1536x1024 -> 1920)
    // fundo: cobre a tela inteira ancorado no sol (com folga p/ tremor e deriva)
    const s = L.sun, bs = { x: 766, y: 494 }, m = 28 * L.u;
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
    this.L = L;
    // fonte do título calibrada para a largura do palco
    L.fs = { title: L.title.w / this._fm.title.ink * 100 };
    // estrelas grandes: evitam troféu, título, cartões e botões
    const mg = 36 * L.u, kh = L.tro.k * TRO.h / 2, kw = L.tro.k * TRO.w / 2;
    const avoid = [
      [L.tro.cx - kw, L.tro.cy - kh, L.tro.cx + kw, L.tro.cy + kh],
      [L.title.cx - L.title.w / 2, L.title.base - L.fs.title * 0.9, L.title.cx + L.title.w / 2, L.title.base + 30 * L.u],
      ...L.cards.map((c) => [c.x, c.y, c.x + c.w, c.y + c.h]), ...L.buttons.map((b) => [b.x, b.y, b.x + b.w, b.y + b.h]),
    ];
    L.stars = [];
    for (const st of this._stars) {
      const px = st.x * w, py = st.y * h;
      if (!avoid.some((a) => px > a[0] - mg && px < a[2] + mg && py > a[1] - mg && py < a[3] + mg)) L.stars.push({ x: px, y: py, R: st.R * L.u, per: st.per, ph: st.ph, rot: st.rot });
      if (L.stars.length >= 12) break;
    }
  }

  /** Troféu "de trabalho" na resolução da tela + máscaras do brilho e dos olhos + telas auxiliares. */
  _buildWork() {
    const L = this.L, spr = this._spr, need = L.tro.k * this.dpr;
    let src = spr, f = 1;
    if (need < 0.62) { src = prescale(spr, spr.width * need * 1.25, spr.height * need * 1.25); f = src.width / spr.width; }
    this._troW = { src, f, need };
    // máscara do brilho: só onde há "tinta clara" (creme/branco/laranja), nunca o preto
    this._troMask = null;
    try {
      const mc = makeCanvas(src.width, src.height), mx = mc.getContext('2d', { willReadFrequently: true });
      mx.drawImage(src, 0, 0);
      const id = mx.getImageData(0, 0, mc.width, mc.height), d = id.data;
      for (let i = 0; i < d.length; i += 4) {
        const lum = Math.max(d[i], d[i + 1], d[i + 2]), m = clamp((lum - 70) / 70) * (d[i + 3] / 255);
        d[i] = d[i + 1] = d[i + 2] = 255; d[i + 3] = Math.round(m * 255);
      }
      mx.putImageData(id, 0, 0);
      this._troMask = mc;
    } catch (e) { this._troMask = null; }
    this._eyesW = this._eyesFull ? (f === 1 ? this._eyesFull : prescale(this._eyesFull, src.width, src.height)) : null;
    // letras do título pré-desenhadas (contorno + extrusão + gradiente); a cada quadro só são posicionadas
    this._letters = this._buildLetters();
    this._ht = new Map(); this._pl = new Map();
    // telas auxiliares do brilho (troféu e título): faixa x máscara
    const dpr = this.dpr, mk = (cw, ch) => ({ c: makeCanvas(cw * dpr, ch * dpr), m: makeCanvas(cw * dpr, ch * dpr), w: cw, h: ch });
    this._sh = {
      tro: mk(Math.ceil(spr.width * L.tro.k * 1.3 + 8), Math.ceil(spr.height * L.tro.k * 1.3 + 8)),
      tit: mk(Math.ceil(L.title.w * 1.3 + 8), Math.ceil(L.fs.title * 1.7 + 8)),
    };
  }

  // ---------------------------------------------------------------- entrada --
  _bindInput() {
    this._onKey = (e) => {
      if (e.repeat || e.ctrlKey || e.metaKey || e.altKey) return;
      if (['Shift', 'Control', 'Alt', 'Meta', 'CapsLock'].includes(e.key)) return;
      if (this._key(e)) e.preventDefault();
    };
    this._onDown = (e) => this._pointer('down', e);
    this._onMove = (e) => this._pointer('move', e);
    this._onUp = (e) => this._pointer('up', e);
    this._onOut = () => { this._hover = null; if (this._press) this._press = null; this.canvas.style.cursor = ''; };
    window.addEventListener('keydown', this._onKey);
    const c = this.canvas;
    c.addEventListener('pointerdown', this._onDown); c.addEventListener('pointermove', this._onMove);
    c.addEventListener('pointerup', this._onUp); c.addEventListener('pointerleave', this._onOut); c.addEventListener('pointercancel', this._onOut);
  }
  _unbindInput() {
    window.removeEventListener('keydown', this._onKey);
    window.removeEventListener('resize', this._onResize);
    if (this._ro) this._ro.disconnect();
    const c = this.canvas;
    if (c) {
      c.removeEventListener('pointerdown', this._onDown); c.removeEventListener('pointermove', this._onMove);
      c.removeEventListener('pointerup', this._onUp); c.removeEventListener('pointerleave', this._onOut); c.removeEventListener('pointercancel', this._onOut);
    }
  }
  /** Botão sob o ponteiro (com folga de toque) ou null. */
  _hit(e) {
    const r = this.canvas.getBoundingClientRect(), x = (e.clientX - r.left) * (this.cssW / r.width), y = (e.clientY - r.top) * (this.cssH / r.height), pad = 10 * this.L.u;
    for (const b of this.L.buttons) if (x >= b.x - pad && x <= b.x + b.w + pad && y >= b.y - pad && y <= b.y + b.h + pad) return b.id;
    return null;
  }
  _pointer(kind, e) {
    if (this.state === 'gate') { if (kind === 'down') { try { this._ctxA && this._ctxA.resume(); } catch (er) { /* ignora */ } this._beginShow(); } return; }
    if (this.state !== 'show') return;
    if (!this._ready) { if (kind === 'down') this.skip(); return; }
    const id = this._hit(e);
    if (kind === 'move' || kind === 'down') {
      if (id !== this._hover) {
        this._hover = id; this.canvas.style.cursor = id ? 'pointer' : '';
        if (id) { this._focus = id; this._kbd = false; if (e.pointerType !== 'touch') this._sfxHover(); }
      }
      if (kind === 'down' && id) { this._press = id; try { this.canvas.setPointerCapture(e.pointerId); } catch (er) { /* ignora */ } }
    } else if (kind === 'up') {
      const was = this._press; this._press = null;
      if (was && id === was) this._choose(was);
    }
  }
  /** Teclado. Devolve true se consumiu a tecla. */
  _key(e) {
    if (this.state === 'gate') { try { this._ctxA && this._ctxA.resume(); } catch (er) { /* ignora */ } this._beginShow(); return true; }
    if (this.state !== 'show') return false;
    if (!this._ready) { this.skip(); return true; }
    const k = e.key;
    if (k === 'ArrowLeft' || k === 'ArrowRight' || k === 'ArrowUp' || k === 'ArrowDown' || k === 'Tab' || k === 'a' || k === 'd' || k === 'A' || k === 'D') {
      const toMenu = k === 'ArrowLeft' || k === 'ArrowUp' || k === 'a' || k === 'A';
      const next = k === 'Tab' ? (this._focus === 'play' ? 'menu' : 'play') : (toMenu ? 'menu' : 'play');
      if (next !== this._focus) { this._focus = next; this._sfxHover(); }
      this._kbd = true; return true;
    }
    if (k === 'Enter' || k === ' ') { this._kbd = true; this._press = null; this._choose(this._focus); return true; }
    return false;
  }

  _choose(id) {
    if (this.state !== 'show' || !this._ready || (id !== 'play' && id !== 'menu')) return false;
    this.choice = id; this._chosen = id; this._focus = id;
    this._tExit = this._now(); this.state = 'exit';
    if (this._sfxOn && this._ctxA && this._ctxA.state === 'running') { const c = this._ctxA.currentTime; this._sfxPop(c + 0.005, 1175); this._sfxWhoosh(c + 0.04); }
    const ms = this.opt.fadeMusicOnExit;
    if (ms && this.music_) this.fadeOutMusic(ms);
    if (this.opt.onChoice) { try { this.opt.onChoice(id, this); } catch (er) { console.error(er); } }
    return true;
  }

  // ------------------------------------------------------------------ áudio --
  _initAudio() {
    const o = this.opt, AC = window.AudioContext || window.webkitAudioContext;
    if (!AC || (!o.sfx && !o.music)) return;
    try { this._ctxA = new AC({ latencyHint: 'interactive' }); } catch (e) { this._ctxA = null; return; }
    const c = this._ctxA;
    // música: <audio> roteado por um ganho (fade funciona também no iOS)
    if (o.music && o.music.src) {
      const el = new Audio(); el.src = o.music.src; el.preload = 'auto'; el.loop = o.music.loop === true;
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

  _beginShow() {
    const now = performance.now() / 1000, c = this._ctxA, lead = 0.12;
    this._lat = c ? Math.min(c.outputLatency || c.baseLatency || 0, 0.15) : 0;
    this._t0 = now + lead + this._lat;          // t = 0 (já compensa a latência de saída)
    this._skipOff = 0; this._evI = 0; this._evSkipBefore = -1;
    this.state = 'show';
    if (this.music_) {
      try {
        this.music_.currentTime = 0;
        const p = this.music_.play();
        if (p && p.then) p.then(() => { this._musicOK = true; }).catch(() => { this._musicOK = false; });
        else this._musicOK = true;
      } catch (e) { this._musicOK = false; }
    }
  }

  /** Relógio (s). Com música, ancora no áudio com correção suave de deriva; soma o que foi pulado. */
  _now() {
    let p = performance.now() / 1000 - this._t0;
    const m = this.music_;
    if (m && this._musicOK && !m.paused && m.readyState >= 2) {
      const drift = m.currentTime - p;
      if (Math.abs(drift) > 0.25) this._t0 -= drift;                  // salto grande: realinha
      else if (Math.abs(drift) > 0.004) this._t0 -= drift * 0.06;     // correção suave
      p = performance.now() / 1000 - this._t0;
    }
    return p + this._skipOff;
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
  _sfxOK() { return this._sfxOn && this._ctxA && this._ctxA.state === 'running'; }
  _sfxPop(at, f = 880) { this._osc('sine', f * 0.7, f * 1.5, at, 0.11, 0.18, 0.004); }
  _sfxGlint(at) { [2093, 2637, 3136].forEach((f, i) => this._osc('sine', f, f, at + i * 0.05, 0.28, 0.045, 0.004)); }
  _sfxWhoosh(at) { this._noiseBurst(at, 0.55, 500, 4200, 1.4, 0.32, 'bandpass', 0.12); }
  /** "Tic" de chegada de uma peça (escala pentatônica subindo); moeda tem um "ding" a mais. */
  _sfxTick(at, k, coin) {
    const f = 659.25 * Math.pow(2, [0, 2, 4, 7, 9, 12][k % 6] / 12);
    this._osc(coin ? 'sine' : 'triangle', f, f, at, 0.16, 0.13, 0.003);
    if (coin) this._osc('sine', f * 3, f * 3, at + 0.012, 0.12, 0.04, 0.003);
  }
  _sfxHover() { if (this._sfxOK()) this._osc('sine', 1320, 1760, this._ctxA.currentTime + 0.005, 0.05, 0.07, 0.003); }
  /** Dispara os efeitos cujo instante chegou (compensando a latência de saída). */
  _pumpEvents(t) {
    const ev = this._ev; if (!ev) return;
    while (this._evI < ev.length && ev[this._evI].t <= t + this._lat) {
      const e = ev[this._evI++];
      if (e.t < this._evSkipBefore || !this._sfxOK()) continue;
      const at = this._ctxA.currentTime + 0.005;
      if (e.fn === 'tick') this._sfxTick(at, e.k, e.coin); else if (e.fn === 'pop') this._sfxPop(at, e.f); else if (e.fn === 'glint') this._sfxGlint(at);
    }
  }

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
    this._pumpEvents(t);
    if (this.state === 'show' && !this._ready && t >= this.TL.ready) {
      this._ready = true;
      if (this.opt.onReady) { try { this.opt.onReady(this); } catch (e) { console.error(e); } }
    }
    for (const id of ['menu', 'play']) {                      // suaviza o "hover"/"pressionado" dos botões
      const s = this._bs[id], kk = 1 - Math.exp(-dtf * 16);
      s.hov += ((this._hover === id ? 1 : 0) - s.hov) * kk; s.press += ((this._press === id && this._hover === id ? 1 : 0) - s.press) * kk;
    }
    if (this.state === 'exit' && t - this._tExit >= EXIT_END) { this._finish(); return; }
    this._renderFrame(t, false);
  }

  _finish() {
    this.state = 'done';
    cancelAnimationFrame(this._raf);
    this._unbindInput();
    if (this.canvas && this.canvas.parentNode) this.canvas.parentNode.removeChild(this.canvas);
    this._resolveFinished({ choice: this.choice, destroyed: false });
    if (this.opt.onFinished) { try { this.opt.onFinished(this.choice, this); } catch (e) { console.error(e); } }
  }

  /** (teste) desenha um quadro específico: t em s; o = { ready, exit, chosen, hover, press, focus, freeze, gate, reduced }. */
  async __renderAt(t, o = {}) {
    await this.load();
    if (!this.canvas) { this._reduced = !!o.reduced; this._createCanvas(); }
    this._freeze = !!o.freeze;
    this._tExit = o.exit != null ? o.exit : null; this._chosen = o.chosen || 'play';
    this._hover = o.hover || null; this._press = o.press || null; this._focus = o.focus || 'play';
    this._bs.menu.hov = o.hover === 'menu' ? 1 : 0; this._bs.play.hov = o.hover === 'play' ? 1 : 0;
    this._bs.menu.press = o.press === 'menu' ? 1 : 0; this._bs.play.press = o.press === 'play' ? 1 : 0;
    this._skipT = o.skipT != null ? o.skipT : -9;
    this._renderFrame(t, !!o.gate);
    return true;
  }
}


// ============================================================================
//  Desenho de um quadro (tudo é função de `t`)
// ============================================================================
const P = GoghosVictory.prototype;

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
  if (ex >= 0) exZoom = 1 + 0.7 * easeInCubic(prog(ex, 0.2, 0.95));
  const panx = frz ? 0 : Math.sin(t * 0.31) * 10 * u, pany = frz ? 0 : Math.cos(t * 0.27) * 7 * u;
  const shx = shake * wob(t * 34, 1), shy = shake * wob(t * 31, 7), shr = shake * 0.0007 * wob(t * 27, 3);

  ctx.save();
  ctx.translate(L.w / 2 + shx, L.h / 2 + shy); ctx.rotate(shr); ctx.translate(-L.w / 2, -L.h / 2);

  // ---------- fundo (o sol fica atrás do troféu) ----------
  const kbg = L.bgK * zoom * exZoom;
  ctx.imageSmoothingQuality = 'low';     // o fundo só é ampliado: bilinear basta
  ctx.drawImage(this.img.bg, L.sun.x + panx - 766 * kbg, L.sun.y + pany - 494 * kbg, 1536 * kbg, 1024 * kbg);

  const beat = this._beatEnv(t, gate);
  const tension = gate ? 0.15 : t < T ? prog(t, 0.2, T) : 0;
  // tensão: o céu escurece e vai revelando (o brilho do sol é somado DEPOIS, por cima)
  const dark = gate ? 0.52 : t < T ? lerp(0.5, 0.0, easeInQuad(prog(t, 0.1, T))) : 0;
  if (dark > 0.003) { ctx.fillStyle = `rgba(14,6,36,${dark})`; ctx.fillRect(0, 0, L.w, L.h); }

  // brilho do sol + raios (aditivos)
  ctx.globalCompositeOperation = 'lighter';
  const sunA = gate ? 0.25 : t < T ? 0.1 + 0.5 * easeInQuad(tension) + 0.15 * beat * tension : 0.14 + 0.2 * beat + 0.45 * Math.exp(-dt * 3);
  ctx.globalAlpha = clamp(sunA); ctx.fillStyle = L.gSun; ctx.fillRect(0, 0, L.w, L.h);
  if (!gate) this._drawRays(ctx, t, clamp(t < T ? 0.08 * tension : 0.12 + 0.08 * beat + 0.35 * Math.exp(-dt * 2.5)));
  ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;

  // estrelas grandes e poeira brilhante
  this._drawTwinkles(ctx, t, gate);

  if (!gate) {
    // ---------- ATO 1: antecipação (o "swell" da música) ----------
    if (t < T + 0.15) this._drawCharge(ctx, t);
    // ---------- ATO 2: impacto ----------
    if (dt > -0.05) { this._drawSpeed(ctx, dt); this._drawBurst(ctx, dt); this._drawRings(ctx, dt); }
    // ---------- troféu e título ----------
    this._drawTrophyAll(ctx, t, ex);
    this._drawTitle(ctx, t, ex);
    // ---------- partículas do impacto ----------
    if (dt > 0) { this._drawInk(ctx, dt); this._drawConfetti(ctx, dt); this._drawHitStars(ctx, dt); }
  } else {
    this._drawCharge(ctx, t, true);
  }

  // vinheta
  ctx.fillStyle = L.gVig; ctx.fillRect(0, 0, L.w, L.h);
  ctx.restore();

  // ---------- interface (fixa na tela, sem tremor) ----------
  if (gate) this._drawGate(ctx, t);
  else this._drawUI(ctx, t, ex);

  // ---------- flash / quadro invertido no golpe ----------
  if (!gate) this._drawFlash(ctx, t, ex);
};

/** Pré-aquece as texturas na GPU (evita um engasgo no primeiro quadro em que cada imagem aparece). */
P._warm = function () {
  const ctx = this.ctx;
  ctx.save(); ctx.globalAlpha = 0.01;
  for (const src of [this.img.bg, this._troW && this._troW.src, this._spr, this._troMask, this._eyesW]) {
    if (src) { try { ctx.drawImage(src, 0, 0, 2, 2); } catch (e) { /* ignora */ } }
  }
  ctx.restore();
  try { ctx.getImageData(0, 0, 1, 1); } catch (e) { /* ignora */ }
};

/** Pulso a cada batida (antes do golpe: batimentos que aceleram a tensão). */
P._beatEnv = function (t, gate) {
  if (gate) return 0.5 + 0.5 * Math.sin(t * 2.2);
  const bd = this.beat;
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
  for (const m of this._motes) {                       // poeira brilhante subindo devagar
    const y = ((m.y - (fz ? 0 : t * m.sp)) % 1 + 1) % 1, x = ((m.x + (fz ? 0 : t * m.drift)) % 1 + 1) % 1;
    const tw = 0.5 + 0.5 * Math.sin(t * m.f * 2 + m.ph), a = (0.25 + 0.6 * tw) * (gate ? 0.6 : 1);
    ctx.globalAlpha = a; ctx.fillStyle = m.col;
    ctx.beginPath(); ctx.arc(x * L.w, y * L.h, m.size * u * (0.6 + 0.6 * tw), 0, TAU); ctx.fill();
  }
  for (const s of L.stars) {                           // estrelas de 4 pontas grandes
    const ph = ((t + s.ph) / s.per) % 1, k = Math.pow(Math.sin(ph * Math.PI), 6);
    sparkle(ctx, s.x, s.y, s.R * (0.4 + 0.75 * k), s.rot, k * (gate ? 0.55 : 0.8), '#fff2d2', true);
  }
  ctx.restore();
};

/** Orbe de carga + partículas e linhas convergindo no troféu (antes do golpe). */
P._drawCharge = function (ctx, t, gate) {
  const L = this.L, u = L.u, T = this.T, cx = L.tro.cx, cy = L.tro.cy, dt = t - T;
  const t0 = Math.min(0.3, T * 0.25), p = gate ? 0 : prog(t, t0, T), e = easeInCubic(p);
  const fade = gate ? 1 : 1 - prog(dt, 0, 0.14);
  if (fade <= 0.003) return;
  const beat = this._beatEnv(t, gate);
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  if (!gate && t > t0) {
    ctx.lineCap = 'round';
    for (const c of this._conv) {                      // partículas convergindo (com rastro)
      const q = prog(t, c.d, c.d + c.life); if (q <= 0 || q >= 1) continue;
      const pos = (qq) => { const r = c.r0 * u * (1 - easeInCubic(qq)), a = c.ang + c.spin * qq; return [cx + Math.cos(a) * r, cy + Math.sin(a) * r * 0.82]; };
      const [x1, y1] = pos(q), [x0, y0] = pos(Math.max(q - 0.09, 0));
      const al = smooth(q * 5) * (1 - prog(q, 0.92, 1));
      ctx.globalAlpha = al * 0.9; ctx.strokeStyle = c.col; ctx.lineWidth = c.size * u;
      ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(x1, y1, c.size * u * 0.7, 0, TAU); ctx.fill();
    }
    if (t > T - 0.62) {                                // linhas de velocidade convergentes
      for (const l of this._convLines) {
        const q = prog(t, T - 0.58 + l.dl, T - 0.02); if (q <= 0) continue;
        const rh = lerp(1400 * u, 150 * u, easeInCubic(q)), rt = rh + (l.tail * (0.4 + q)) * u;
        ctx.globalAlpha = 0.6 * smooth(q * 3); ctx.strokeStyle = '#fff'; ctx.lineWidth = l.w * u;
        ctx.beginPath(); ctx.moveTo(cx + Math.cos(l.ang) * rt, cy + Math.sin(l.ang) * rt * 0.9); ctx.lineTo(cx + Math.cos(l.ang) * rh, cy + Math.sin(l.ang) * rh * 0.9); ctx.stroke();
      }
    }
  }
  const R = (gate ? 7 + 2.5 * Math.sin(t * 3) : 10 + 78 * e + 14 * beat * (0.3 + p)) * u;   // o orbe
  const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, R * 3.4);
  g.addColorStop(0, 'rgba(255,250,225,0.95)'); g.addColorStop(0.25, 'rgba(255,160,210,0.5)'); g.addColorStop(1, 'rgba(255,90,190,0)');
  ctx.globalAlpha = fade * (gate ? 0.8 : 0.35 + 0.65 * smooth(prog(t, 0.1, 0.5))); ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(cx, cy, R * 3.4, 0, TAU); ctx.fill();
  sparkle(ctx, cx, cy, R * (gate ? 3.0 : 2.4 + 1.2 * p), this._freeze ? 0 : t * 0.7, fade, '#fff', true);
  ctx.restore();
};

// ---- explosão de quadrinhos, linhas, anéis ----
P._drawBurst = function (ctx, dt) {
  if (dt < -0.02 || dt > 0.7) return;
  const L = this.L, u = L.u, cx = L.tro.cx, cy = L.tro.cy;
  const p = prog(dt, 0, 0.17), grow = easeOutBack(p, 2.4) * lerp(1, 1.22, prog(dt, 0.12, 0.7));
  const alpha = 1 - smooth(prog(dt, 0.2, 0.62));
  if (alpha <= 0.003 || grow <= 0) return;
  const R = L.burstR * grow, rot = dt * 0.12;
  const poly = (pts, r, rotA) => { ctx.beginPath(); pts.forEach((v, i) => { const a = v.a + rotA, x = cx + Math.cos(a) * v.r * r, y = cy + Math.sin(a) * v.r * r * 0.92; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }); ctx.closePath(); };
  ctx.save(); ctx.globalAlpha = alpha; ctx.lineJoin = 'miter'; ctx.miterLimit = 3;
  ctx.save(); ctx.translate(10 * u, 12 * u); poly(this._burstA, R, rot); ctx.fillStyle = 'rgba(20,16,28,0.55)'; ctx.fill(); ctx.restore();   // sombra deslocada
  poly(this._burstA, R, rot); ctx.fillStyle = COL.pink; ctx.fill(); ctx.lineWidth = 12 * u; ctx.strokeStyle = COL.ink; ctx.stroke();
  poly(this._burstB, R * 0.82, -rot * 1.3); ctx.fillStyle = COL.cream2; ctx.fill(); ctx.lineWidth = 8 * u; ctx.stroke();
  ctx.save(); poly(this._burstB, R * 0.82, -rot * 1.3); ctx.clip();                  // retícula de meio-tom
  ctx.fillStyle = 'rgba(255,79,163,0.55)';
  for (let ring = 0.42; ring < 0.98; ring += 0.075) {
    const n = Math.round(ring * 60), r = R * 0.82 * ring, dot = (ring - 0.34) * 11 * u * (L.portrait ? 1.1 : 1);
    for (let i = 0; i < n; i++) { const a = (i / n) * TAU + ring * 3; ctx.beginPath(); ctx.arc(cx + Math.cos(a) * r, cy + Math.sin(a) * r * 0.92, dot, 0, TAU); ctx.fill(); }
  }
  ctx.restore(); ctx.restore();
};

P._drawSpeed = function (ctx, dt) {
  if (dt < 0 || dt > 0.6) return;
  const L = this.L, u = L.u, cx = L.tro.cx, cy = L.tro.cy;
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
  const L = this.L, u = L.u, cx = L.tro.cx, cy = L.tro.cy, cols = ['#ffffff', COL.pink, COL.cream2];
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
  const L = this.L, u = L.u, cx = L.tro.cx, cy = L.tro.cy;
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
    ctx.lineWidth = Math.max(1.6 * u, 1); ctx.strokeStyle = d.col === '#14101c' ? 'rgba(255,255,255,0.75)' : COL.ink; ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.85)'; ctx.beginPath(); ctx.ellipse(-r * 0.25 * st, -r * 0.3, r * 0.25, r * 0.15, 0, 0, TAU); ctx.fill();
    ctx.restore();
  }
  ctx.restore();
};

P._drawConfetti = function (ctx, dt) {
  const L = this.L, u = L.u, cx = L.tro.cx, cy = L.tro.cy;
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

/** Faíscas de 4 pontas em volta do troféu na hora do golpe (fora do desenho, para não cobrir nada). */
P._drawHitStars = function (ctx, dt) {
  if (dt > 0.7) return;
  const L = this.L, u = L.u, k = L.tro.k;
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  for (const s of this._hitStars) {
    const q = prog(dt, s.dl, s.dl + 0.5); if (q <= 0 || q >= 1) continue;
    const grow = 0.9 + 0.2 * easeOutCubic(q), x = L.tro.cx + Math.cos(s.ang) * TRO.w * 0.56 * k * s.rad * grow, y = L.tro.cy + Math.sin(s.ang) * TRO.h * 0.62 * k * s.rad * grow;
    const env = Math.sin(q * Math.PI);
    sparkle(ctx, x, y, s.R * u * (0.5 + env), s.rot + q * 1.4, env, '#fff8e4', true);
  }
  ctx.restore();
};

// ============================================================================
//  O troféu
// ============================================================================
/** Pose do troféu no tempo t: vem "da câmera" até o golpe, achata (squash), rebate e assenta. null = invisível. */
P._troPose = function (t) {
  const T = this.T, u = this.L.u, dt = t - T, D = 0.26;
  if (dt < -D) return null;
  if (dt < 0) {
    const p = (dt + D) / D, e = easeInCubic(p);
    return { a: smooth(p / 0.38), s: lerp(2.6, 1, e), rot: -0.14 * (1 - e), ox: 0, oy: -330 * u * (1 - e), sx: 1, sy: 1, ph: 'pre', e };
  }
  const q = Math.exp(-dt * 8) * Math.cos(dt * 28);
  return { a: 1, s: 1 + 0.045 * Math.exp(-dt * 6) * Math.sin(dt * 22), rot: 0.05 * Math.exp(-dt * 8) * Math.sin(dt * 20), ox: 0, oy: 0, sx: 1 + 0.14 * q, sy: 1 - 0.14 * q, ph: 'post', q: dt };
};

/** Escala/posição globais da saída (zoom através do troféu): { gs, gAlpha }. */
P._exitScale = function (ex) {
  if (ex < 0) return { gs: 1, gAlpha: 1 };
  const gs = ex < 0.2 ? 1 - 0.07 * easeOutQuad(ex / 0.2) : 0.93 * Math.exp(Math.log(8 / 0.93) * easeInCubic(prog(ex, 0.2, 0.95)));
  return { gs, gAlpha: 1 - smooth(prog(ex, 0.78, 0.95)) };
};

/** Escala/posição globais do troféu: pulso na batida, flutuar leve, saída. */
P._troXf = function (t) {
  const L = this.L, T = this.T, dt = t - T, fz = this._freeze;
  const beat = t < T ? 0 : this._beatEnv(t, false);
  let gs = fz ? 1 : 1 + 0.018 * beat * smooth(prog(dt, 0.3, 0.8));
  const gy = fz ? 0 : Math.sin(t * 1.15) * 5 * L.u * smooth(prog(dt, 0.6, 1.4));
  const es = this._exitScale(this._tExit != null ? t - this._tExit : -1);
  return { gs: gs * es.gs, gy, gAlpha: es.gAlpha };
};

/** Traço "tremendo" a 8 quadros/s depois que o troféu assenta (como o logo da intro). */
P._troJit = function (t, pose) {
  if (this._freeze || pose.ph !== 'post') return { x: 0, y: 0, r: 0 };
  const f8 = Math.floor(t * 8), b = smooth(prog(t - this.T, 0.2, 0.5));
  return { x: (hash01(f8 * 131 + 11) - 0.5) * 2 * 1.2 * this.L.u * b, y: (hash01(f8 * 211 + 5) - 0.5) * 2 * 1.2 * this.L.u * b, r: (hash01(f8 * 97 + 3) - 0.5) * 2 * 0.0026 * b };
};

/** Aplica ao contexto a transformação do troféu (origem = centro do desenho; squash a partir da base). */
P._troCtx = function (x, pose, xf, ox0, oy0, jit) {
  const L = this.L, k = L.tro.k, pcy = (TRO.y0 + TRO.h - TRO.cy) * k;
  x.translate(L.tro.cx + pose.ox + jit.x - ox0, L.tro.cy + xf.gy + pose.oy + jit.y - oy0);
  x.rotate(pose.rot + jit.r); x.scale(pose.s * xf.gs, pose.s * xf.gs);
  if (pose.sx !== 1 || pose.sy !== 1) { x.translate(0, pcy); x.scale(pose.sx, pose.sy); x.translate(0, -pcy); }
};

P._troRect = function () {
  const k = this.L.tro.k, spr = this._spr;
  return { dx: (TRO.x0 - PAD - TRO.cx) * k, dy: (TRO.y0 - PAD - TRO.cy) * k, dw: spr.width * k, dh: spr.height * k };
};

P._drawTrophyAll = function (ctx, t, ex) {
  const T = this.T;
  if (t < T - 0.4) return;
  if (ex >= 0.2) {                                   // rastro de movimento na saída (cópias recentes, mais fracas)
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (let j = 5; j >= 1; j--) this._drawTrophy(ctx, t - j * 0.024, 0.2 * (1 - j / 6), true);
    ctx.restore();
  }
  this._drawTrophy(ctx, t, 1, false);
  this._drawEyes(ctx, t);
  if (ex < 0.2 && t > this.TL.shine0) {
    const xf = this._troXf(t), L = this.L;
    this._shine(ctx, t, 'tro', L.tro.cx, L.tro.cy + xf.gy, 0, (mx, bx, by) => this._drawTrophy(null, t, 1, true, { ctx: mx, ox: bx, oy: by }));
  }
  this._drawTroSparks(ctx, t);
};

P._drawTrophy = function (ctx, t, alpha, ghost, mask) {   // mask = { ctx, ox, oy } desenha a máscara do brilho
  const L = this.L, k = L.tro.k, W = this._troW, pose = this._troPose(t); if (!pose) return;
  const xf = this._troXf(t), jit = this._troJit(t, pose), x = mask ? mask.ctx : ctx, spr = this._spr;
  let src = W.src;
  if (mask) src = this._troMask;
  else if (k * pose.s * xf.gs * this.dpr > W.need * 1.5 && W.f !== 1) src = spr;     // ampliado demais: usa o original
  if (!src) return;
  const r = this._troRect();
  x.save();
  x.globalAlpha = (mask ? 1 : alpha) * clamp(pose.a) * (mask ? 1 : xf.gAlpha);
  this._troCtx(x, pose, xf, mask ? mask.ox : 0, mask ? mask.oy : 0, jit);
  if (!ghost && !mask && pose.ph === 'pre' && pose.e > 0.12) {       // rastro de aproximação (cópias mais fracas)
    for (let g = 2; g >= 1; g--) {
      const pg = this._troPose(t - g * 0.017); if (!pg || pg.ph !== 'pre') continue;
      x.save(); x.globalAlpha *= 0.22 / g; const rr = pg.s / pose.s; x.scale(rr, rr);
      x.drawImage(src, r.dx, r.dy, r.dw, r.dh); x.restore();
    }
  }
  x.drawImage(src, r.dx, r.dy, r.dw, r.dh);
  x.restore();
};

/** Olhos vermelhos: pulsam na batida e "acendem" com um clarão no golpe. */
P._drawEyes = function (ctx, t) {
  const T = this.T, dt = t - T; if (dt < 0) return;
  const pose = this._troPose(t); if (!pose || pose.ph !== 'post') return;
  const L = this.L, k = L.tro.k, xf = this._troXf(t); if (xf.gAlpha <= 0.01) return;
  const jit = this._troJit(t, pose), beat = this._beatEnv(t, false), flare = Math.exp(-dt * 2.8) * (this._reduced ? 0.5 : 1), a = xf.gAlpha;
  ctx.save(); this._troCtx(ctx, pose, xf, 0, 0, jit); ctx.globalCompositeOperation = 'lighter';
  if (this._eyesW) { const r = this._troRect(); ctx.globalAlpha = clamp((0.16 + 0.32 * beat + 0.7 * flare) * a); ctx.drawImage(this._eyesW, r.dx, r.dy, r.dw, r.dh); }
  for (const e of TRO_EYES) {
    const ex = (e.x - TRO.cx) * k, ey = (e.y - TRO.cy) * k, R = (120 + 260 * flare) * k, g = ctx.createRadialGradient(ex, ey, 0, ex, ey, R);
    g.addColorStop(0, `rgba(255,60,110,${clamp((0.18 + 0.22 * beat + 0.55 * flare) * a)})`); g.addColorStop(1, 'rgba(255,40,90,0)');
    ctx.globalAlpha = 1; ctx.fillStyle = g; ctx.beginPath(); ctx.arc(ex, ey, R, 0, TAU); ctx.fill();
  }
  ctx.restore();
};

/**
 * Brilho holográfico varrendo SÓ a ilustração (máscara = tinta clara dela, nunca o fundo).
 * `drawMask(ctx, ox, oy)` desenha a máscara na mesma pose do quadro.
 */
P._shine = function (ctx, t, key, cx, cy, delay, drawMask) {
  const S = this._sh && this._sh[key]; if (!S) return;
  if (key === 'tro' && !this._troMask) return;
  const TL = this.TL, tt = t - (TL.shine0 + delay); if (tt < 0) return;
  const ph = (tt % TL.shinePeriod) / SHINE_DUR; if (ph >= 1) return;
  const sc = S.c, sm = S.m, sx = sc.getContext('2d'), mx = sm.getContext('2d'), dpr = this.dpr, bw = S.w, bh = S.h, bx = cx - bw / 2, by = cy - bh / 2;
  const reset = (c) => { c.setTransform(1, 0, 0, 1, 0, 0); c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1; c.clearRect(0, 0, sc.width, sc.height); c.setTransform(dpr, 0, 0, dpr, 0, 0); };
  reset(sx);                                          // 1) faixas diagonais com arco-íris
  const cxp = lerp(-0.25 * bw, 1.25 * bw, easeInOutCubic(ph));
  const band = (off, hw, a) => {
    sx.save(); sx.translate(cxp - off, bh / 2); sx.rotate(0.38);
    const g = sx.createLinearGradient(-hw, 0, hw, 0);
    g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.24, 'rgba(90,225,255,0.5)'); g.addColorStop(0.5, 'rgba(255,248,235,0.62)');
    g.addColorStop(0.76, 'rgba(255,100,215,0.5)'); g.addColorStop(1, 'rgba(255,255,255,0)');
    sx.globalAlpha = a; sx.fillStyle = g; sx.fillRect(-hw, -bh * 1.2, hw * 2, bh * 2.4); sx.restore();
  };
  band(0, bw * 0.13, 1); band(bw * 0.19, bw * 0.04, 0.5);
  reset(mx); drawMask(mx, bx, by);                    // 2) máscara da ilustração (mesma pose do quadro)
  sx.setTransform(1, 0, 0, 1, 0, 0); sx.globalCompositeOperation = 'destination-in'; sx.drawImage(sm, 0, 0);   // 3) faixa x máscara
  sx.globalCompositeOperation = 'source-over';
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  ctx.globalAlpha = 0.8 * Math.sqrt(Math.sin(ph * Math.PI)) * this._exitScale(this._tExit != null ? t - this._tExit : -1).gAlpha;
  ctx.drawImage(sc, 0, 0, sc.width, sc.height, bx, by, bw, bh);
  ctx.restore();
};

/** Faíscas nas pontas do troféu (piscam; mais fortes quando o brilho passa) + faísca na estrela "#1" a cada peça lançada. */
P._drawTroSparks = function (ctx, t) {
  const T = this.T, dt = t - T, TL = this.TL; if (dt < 0.28) return;
  const L = this.L, k = L.tro.k, xf = this._troXf(t), fz = this._freeze, u = L.u;
  const tt = t - TL.shine0, ph = tt < 0 ? 1 : (tt % TL.shinePeriod) / SHINE_DUR, shine = ph < 1 ? Math.sin(ph * Math.PI) : 0;
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  TRO_SPARKS.forEach((s, i) => {
    const tw = fz ? 0.55 : 0.5 + 0.5 * Math.sin(t * (1.7 + i * 0.37) + i * 2.1);
    const a = smooth(prog(dt, 0.28 + i * 0.05, 0.6 + i * 0.05)) * (0.18 + 0.82 * Math.pow(tw, 2) + 0.5 * shine) * xf.gAlpha;
    const x = L.tro.cx + (s.x - TRO.cx) * k * xf.gs, y = L.tro.cy + xf.gy + (s.y - TRO.cy) * k * xf.gs;
    sparkle(ctx, x, y, s.r * k * xf.gs * (0.75 + 0.4 * tw + 0.25 * shine), 0, a * 0.9, '#fffbe8', true);
  });
  // a estrela "#1" faísca a cada peça que sai dela
  const bx = L.tro.cx + (TRO_BADGE.x - TRO.cx) * k * xf.gs, by = L.tro.cy + xf.gy + (TRO_BADGE.y - TRO.cy) * k * xf.gs;
  for (let kk = 0; kk < TOKENS; kk++) {
    const q = (t - (TL.launch0 + kk * TL.launchGap)) / 0.26; if (q <= 0 || q >= 1) continue;
    const env = Math.sin(q * Math.PI);
    sparkle(ctx, bx, by, 58 * u * (0.4 + 0.8 * env), q * 1.6, env * xf.gAlpha, '#fffbe8', true);
  }
  ctx.restore();
};

/** Pinta uma letra do título na origem (linha de base, centro): extrusão rosa + contorno + miolo creme. */
P._paintLetter = function (x, ch, fs, asc, u) {
  x.save(); x.font = `${fs}px ${this._fam}`; x.textAlign = 'center'; x.textBaseline = 'alphabetic'; x.lineJoin = 'round'; x.miterLimit = 2;
  x.save(); x.translate(6 * u, 9 * u); x.lineWidth = 20 * u; x.strokeStyle = COL.ink; x.strokeText(ch, 0, 0); x.fillStyle = COL.hot; x.fillText(ch, 0, 0); x.restore();   // extrusão rosa
  x.lineWidth = 20 * u; x.strokeStyle = COL.ink; x.strokeText(ch, 0, 0);
  const g = x.createLinearGradient(0, -asc, 0, 0); g.addColorStop(0, '#fff8de'); g.addColorStop(0.55, COL.cream); g.addColorStop(1, '#ffb561');
  x.fillStyle = g; x.fillText(ch, 0, 0);
  x.restore();
};

/** Uma tela por letra (com folga para contorno/extrusão), em resolução um pouco acima da tela. */
P._buildLetters = function () {
  const L = this.L, u = L.u, fs = L.fs.title, fm = this._fm.title, txt = this.opt.texts.title, asc = fm.asc * fs / 100, ss = Math.min(this.dpr * 1.4, 3);
  const padT = 26 * u, padB = 34 * u, padS = 32 * u, out = [];
  for (let i = 0; i < txt.length; i++) {
    if (txt[i] === ' ') { out.push(null); continue; }
    const wi = (fm.adv[i + 1] - fm.adv[i]) * fs / 100, cw = Math.ceil(wi + 2 * padS), chh = Math.ceil(asc + padT + padB);
    const c = makeCanvas(cw * ss, chh * ss), x = c.getContext('2d'), bx = cw / 2, by = padT + asc;
    x.scale(c.width / cw, c.height / chh); x.translate(bx, by);
    this._paintLetter(x, txt[i], fs, asc, u);
    out.push({ c, bx, by, cw, chh });
  }
  return out;
};

// ============================================================================
//  O título "VITÓRIA!" (letra por letra: cada uma dá o seu golpe)
// ============================================================================
P._drawTitle = function (ctx, t, ex, mask) {   // mask = { ctx, ox, oy } desenha a máscara do brilho
  const L = this.L, u = L.u, T = this.T, TL = this.TL, txt = this.opt.texts.title, fm = this._fm.title, fs = L.fs.title;
  if (!mask && t < TL.title0 - 0.3) return;
  const x = mask ? mask.ctx : ctx, ox0 = mask ? mask.ox : 0, oy0 = mask ? mask.oy : 0;
  const es = this._exitScale(ex), beat = t < T ? 0 : this._beatEnv(t, false), fz = this._freeze, f8 = Math.floor(t * 8);
  const origin = L.title.cx - fm.ink * fs / 200 + fm.l * fs / 100, asc = fm.asc * fs / 100, n = txt.length;
  x.save();
  x.translate(-ox0, -oy0);
  if (ex >= 0) { x.translate(L.tro.cx, L.tro.cy); x.scale(es.gs, es.gs); x.translate(-L.tro.cx, -L.tro.cy); }
  x.font = `${fs}px ${this._fam}`; x.textAlign = 'center'; x.textBaseline = 'alphabetic'; x.lineJoin = 'round'; x.miterLimit = 2;
  let lastX = 0;
  for (let i = 0; i < n; i++) {
    const ch = txt[i]; if (ch === ' ') continue;
    const dt = t - (TL.title0 + i * TL.titleStep), D = 0.2; if (dt < -D) continue;
    const lx = origin + (fm.adv[i] + (fm.adv[i + 1] - fm.adv[i]) / 2) * fs / 100; lastX = lx;
    let a, s, oy = 0, rot = 0, sx = 1, sy = 1, jx = 0, jy = 0;
    const sgn = i % 2 ? 1 : -1;
    if (dt < 0) {                                       // aproximação: cai "da câmera" acelerando até o golpe
      const p = (dt + D) / D, e = easeInCubic(p);
      a = smooth(p / 0.4); s = lerp(2.6, 1, e); oy = -300 * u * (1 - e); rot = sgn * 0.28 * (1 - e);
    } else {                                            // squash no impacto, rebate e assenta; depois, ondinha + traço tremendo
      const q = Math.exp(-dt * 8) * Math.cos(dt * 28), idle = smooth(prog(t, TL.title0 + 0.7 + i * 0.02, TL.title0 + 1.3));
      a = 1; s = (1 + 0.04 * Math.exp(-dt * 6) * Math.sin(dt * 22)) * (1 + 0.03 * beat * idle); rot = sgn * 0.06 * Math.exp(-dt * 8) * Math.sin(dt * 20);
      sx = 1 + 0.14 * q; sy = 1 - 0.14 * q;
      if (!fz) {
        oy = Math.sin(t * 2.4 + i * 0.55) * 3.2 * u * idle;
        jx = (hash01(f8 * 131 + i * 977 + 11) - 0.5) * 2.2 * u * idle; jy = (hash01(f8 * 211 + i * 613 + 5) - 0.5) * 2.2 * u * idle;
        rot += (hash01(f8 * 97 + i * 389 + 3) - 0.5) * 0.012 * idle;
      }
    }
    x.save();
    x.globalAlpha = mask ? 1 : clamp(a) * es.gAlpha;
    x.translate(lx + jx, L.title.base + oy + jy); x.rotate(rot); x.scale(s * sx, s * sy);
    const lt = this._letters && this._letters[i];
    if (mask) { x.fillStyle = '#fff'; x.fillText(ch, 0, 0); }
    else if (lt) x.drawImage(lt.c, -lt.bx, -lt.by, lt.cw, lt.chh);
    else this._paintLetter(x, ch, fs, asc, u);
    x.restore();
  }
  x.restore();
  if (mask) return;
  // brilho holográfico sobre as letras (um instante depois do troféu) e faísca na última letra
  if (ex < 0.2 && t > TL.shine0 + 0.2) this._shine(ctx, t, 'tit', L.title.cx, L.title.base - asc * 0.45, 0.22, (mx, bx, by) => this._drawTitle(null, t, ex, { ctx: mx, ox: bx, oy: by }));
  const q = t - (TL.title0 + (n - 1) * TL.titleStep + 0.22);
  if (q > 0 && q < 0.55) {
    const env = Math.sin((q / 0.55) * Math.PI);
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    sparkle(ctx, lastX + fs * 0.1, L.title.base - asc * 0.95, 60 * u * (0.4 + env), q * 2, env * es.gAlpha, '#fff8e4', true);
    ctx.restore();
  }
};

// ============================================================================
//  Interface: cartões de recompensa, peças voando, botões, "Press any key"
// ============================================================================
P._drawUI = function (ctx, t, ex) {
  const uiA = ex >= 0 ? 1 - smooth(prog(ex, 0, 0.25)) : 1;
  this.rewards.forEach((r, i) => this._drawCard(ctx, t, i, uiA));
  this._drawTokens(ctx, t, uiA);
  this._drawButtons(ctx, t, ex);
};

/** Progresso da contagem do cartão i (0..1): as peças chegam nas batidas, o número sobe junto. */
P._rewardP = function (i, t) {
  const TL = this.TL, d = i * 0.04, p = prog(t, TL.count0 + d, TL.count1 + d);
  return p < 1 ? 1 - Math.pow(1 - p, 1.5) : 1;
};
/** "Pulinho" do ícone do cartão i a cada peça que chega. */
P._cardPop = function (i, t) {
  let s = 0;
  for (const tk of this._tokens) if (tk.i === i) { const q = t - tk.arrive; if (q > 0 && q < 0.4) s += 0.18 * Math.exp(-q * 9) * Math.cos(q * 26); }
  return s;
};
/** Giro da moeda (uma vez por ciclo de brilho, depois da contagem). */
P._coinFlip = function (t) {
  const TL = this.TL; if (t < TL.count1 + 0.3) return 0;
  const q = ((t - (TL.shine0 + this.beat)) % TL.shinePeriod) / 0.6;
  return q > 0 && q < 1 ? q * TAU : 0;
};

/** Ícone da recompensa i (estrela, moeda ou a imagem enviada), centrado na origem, raio R. */
P._drawIcon = function (ctx, i, R, flip, rot) {
  const kind = this._kind(i), img = this._icons[i];
  ctx.save(); ctx.lineJoin = 'round'; ctx.rotate(rot || 0);
  if (img) {
    const k = (2.1 * R) / Math.max(img.width, img.height); ctx.scale(kind === 'coin' && flip ? Math.max(Math.abs(Math.cos(flip)), 0.1) : 1, 1);
    ctx.drawImage(img, -img.width * k / 2, -img.height * k / 2, img.width * k, img.height * k);
  } else if (kind === 'star') {
    starPath(ctx, R * 1.08, 5, 0.52); ctx.lineWidth = R * 0.2; ctx.strokeStyle = COL.ink; ctx.stroke();
    const g = ctx.createLinearGradient(0, -R, 0, R); g.addColorStop(0, '#ff9bd2'); g.addColorStop(1, COL.hot); ctx.fillStyle = g; ctx.fill();
    starPath(ctx, R * 0.55, 5, 0.52); ctx.fillStyle = 'rgba(255,233,168,0.9)'; ctx.fill(); ctx.lineWidth = R * 0.05; ctx.strokeStyle = 'rgba(20,16,28,0.55)'; ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.85)'; ctx.beginPath(); ctx.ellipse(-R * 0.42, -R * 0.5, R * 0.16, R * 0.08, -0.7, 0, TAU); ctx.fill();
  } else {                                                      // moeda (placeholder do Dalycoin, desenhada em código)
    const sx = flip ? Math.max(Math.abs(Math.cos(flip)), 0.1) : 1;
    ctx.scale(sx, 1);
    ctx.beginPath(); ctx.arc(0, 0, R, 0, TAU); ctx.lineWidth = R * 0.2; ctx.strokeStyle = COL.ink; ctx.stroke();
    const g = ctx.createRadialGradient(-R * 0.3, -R * 0.35, R * 0.1, 0, 0, R * 1.05);
    g.addColorStop(0, '#fff3b0'); g.addColorStop(0.55, '#ffc93a'); g.addColorStop(1, '#e58a26'); ctx.fillStyle = g; ctx.fill();
    ctx.beginPath(); ctx.arc(0, 0, R * 0.74, 0, TAU); ctx.lineWidth = R * 0.08; ctx.strokeStyle = '#c8751c'; ctx.stroke();
    if (sx > 0.45) {                                         // emblema: estrelinha gravada (mesma família da estrela "#1" do troféu)
      starPath(ctx, R * 0.5, 5, 0.5); ctx.lineWidth = R * 0.07; ctx.strokeStyle = '#8f3c14'; ctx.fillStyle = '#fff3c9'; ctx.stroke(); ctx.fill();
      starPath(ctx, R * 0.24, 5, 0.5); ctx.fillStyle = '#e58a26'; ctx.fill();
    }
    ctx.beginPath(); ctx.arc(0, 0, R * 0.58, Math.PI * 1.08, Math.PI * 1.48); ctx.lineWidth = R * 0.09; ctx.lineCap = 'round'; ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.stroke();
  }
  ctx.restore();
};

/** Retícula de meio-tom do cartão, desenhada uma vez e reaproveitada. */
P._halftone = function (w, h, u) {
  const key = Math.round(w) + 'x' + Math.round(h);
  let c = this._ht.get(key);
  if (!c) {
    c = makeCanvas(w * this.dpr, h * this.dpr); const x = c.getContext('2d'); x.scale(this.dpr, this.dpr); x.translate(w / 2, h / 2);
    x.fillStyle = 'rgba(255,79,163,0.16)';
    const sp = 17 * u;
    for (let yy = -h / 2 + sp / 2, row = 0; yy < h / 2; yy += sp * 0.87, row++) {
      for (let xx = -w / 2 + (row % 2 ? sp : sp / 2); xx < w / 2; xx += sp) {
        const k = clamp((xx + w / 2) / w); if (k < 0.45) continue;
        x.beginPath(); x.arc(xx, yy, (k - 0.35) * 6.5 * u, 0, TAU); x.fill();
      }
    }
    this._ht.set(key, c);
  }
  return c;
};

/** Placa do cartão (sombra deslocada, contorno preto, fundo roxo, meio-tom e borda creme), desenhada uma vez. */
P._plate = function (w, h, cut, u, m) {
  const key = Math.round(w) + 'x' + Math.round(h);
  let c = this._pl && this._pl.get(key);
  if (!c) {
    c = makeCanvas((w + 2 * m) * this.dpr, (h + 2 * m) * this.dpr);
    const x = c.getContext('2d'); x.scale(this.dpr, this.dpr); x.translate(w / 2 + m, h / 2 + m); x.lineJoin = 'round';
    x.save(); x.translate(10 * u, 12 * u); platePath(x, w, h, cut); x.fillStyle = 'rgba(20,16,28,0.55)'; x.fill(); x.restore();
    platePath(x, w, h, cut); x.lineWidth = 18 * u; x.strokeStyle = COL.ink; x.stroke();
    const g = x.createLinearGradient(0, -h / 2, 0, h / 2); g.addColorStop(0, '#4b2b8c'); g.addColorStop(1, COL.plate2); x.fillStyle = g; x.fill();
    x.save(); platePath(x, w, h, cut); x.clip();
    x.drawImage(this._halftone(w, h, u), -w / 2, -h / 2, w, h);
    x.lineWidth = 11 * u; x.strokeStyle = 'rgba(255,233,168,0.95)'; platePath(x, w, h, cut); x.stroke();
    x.restore();
    (this._pl = this._pl || new Map()).set(key, c);
  }
  return c;
};

P._drawCard = function (ctx, t, i, uiA) {
  const L = this.L, u = L.u, TL = this.TL, c = L.cards[i], r = this.rewards[i]; if (!c) return;
  const t0 = TL.cards0 + i * TL.cardStep, p = prog(t, t0, t0 + TL.cardDur); if (p <= 0) return;
  const e = easeOutBack(p, 1.5), fz = this._freeze, w = c.w, h = c.h, cut = h * 0.17;
  const dx = c.side * (1 - e) * (L.portrait ? L.w * 0.8 : c.w * 1.4), rot = c.rot + (1 - e) * c.side * 0.25;
  const settle = smooth(prog(t, t0 + 0.5, t0 + 1)), bob = fz ? 0 : Math.sin(t * 1.3 + i * 1.9) * 3 * u * settle, beat = this._beatEnv(t, false) * settle;
  const pr = this._rewardP(i, t), pop = this._cardPop(i, t), done = TL.count1 + i * 0.04, qd = t - done;
  ctx.save(); ctx.globalAlpha = uiA * smooth(p * 3.5);
  ctx.translate(c.x + w / 2 + dx, c.y + h / 2 + bob); ctx.rotate(rot); ctx.scale(1 + 0.012 * beat, 1 + 0.012 * beat);
  ctx.lineJoin = 'round';
  // placa (sombra, contorno, fundo, meio-tom e borda) já pronta; só o brilho de "contagem concluída" é desenhado ao vivo
  const m = 26 * u; ctx.drawImage(this._plate(w, h, cut, u, m), -w / 2 - m, -h / 2 - m, w + 2 * m, h + 2 * m);
  if (qd > 0 && qd < 0.6) {                                             // brilho que cruza o cartão quando a contagem termina
    const q = qd / 0.6; ctx.save(); platePath(ctx, w, h, cut); ctx.clip(); ctx.globalCompositeOperation = 'lighter'; ctx.translate(lerp(-w * 0.7, w * 0.7, easeInOutCubic(q)), 0); ctx.rotate(0.45);
    const gg = ctx.createLinearGradient(-w * 0.09, 0, w * 0.09, 0); gg.addColorStop(0, 'rgba(255,255,255,0)'); gg.addColorStop(0.5, 'rgba(255,255,255,0.55)'); gg.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = gg; ctx.fillRect(-w * 0.09, -h, w * 0.18, h * 2); ctx.restore();
  }
  // ---- conteúdo ----
  const iconR = h * 0.30, ix = -w / 2 + h * 0.52, tx0 = ix + iconR + h * 0.14, avail = w / 2 - tx0 - h * 0.14, hasBar = !!r.bar;
  ctx.save(); ctx.translate(ix, 0); ctx.scale(1 + pop, 1 + pop);
  this._drawIcon(ctx, i, iconR, this._kind(i) === 'coin' ? this._coinFlip(t) : 0, this._kind(i) === 'star' ? -0.1 + 0.08 * Math.sin(t * 1.6 + i) : 0);
  ctx.restore();
  const fam = this._fam, lf = h * 0.2;
  ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
  if (r.label) { ctx.font = `${lf}px ${fam}`; ctx.fillStyle = '#ffc6e6'; ctx.fillText(r.label, tx0, hasBar ? -h * 0.17 : -h * 0.08); }
  // número (conta de 0 até o valor; "pop" quando termina)
  const full = r.prefix + r.value.toLocaleString(this.opt.locale), cur = r.prefix + Math.floor(r.value * pr).toLocaleString(this.opt.locale);
  let nf = h * (hasBar ? 0.36 : 0.42); const fw = this._width(ctx, full, `${nf}px ${fam}`); if (fw > avail) nf *= avail / fw;
  const ny = hasBar ? h * 0.17 : h * 0.28, np = 1 + (qd > 0 ? 0.22 * Math.exp(-qd * 8) * Math.cos(qd * 20) : 0) + (pr > 0 && pr < 1 ? 0.025 * Math.sin(t * 38) : 0);
  ctx.save(); ctx.translate(tx0, ny); ctx.scale(np, np); ctx.font = `${nf}px ${fam}`; ctx.lineJoin = 'round';
  ctx.save(); ctx.translate(3.5 * u, 4.5 * u); ctx.lineWidth = 12 * u; ctx.strokeStyle = COL.ink; ctx.strokeText(cur, 0, 0); ctx.fillStyle = COL.hot; ctx.fillText(cur, 0, 0); ctx.restore();
  ctx.lineWidth = 12 * u; ctx.strokeStyle = COL.ink; ctx.strokeText(cur, 0, 0);
  const ng = ctx.createLinearGradient(0, -nf * 0.7, 0, 0); ng.addColorStop(0, '#fff8de'); ng.addColorStop(1, '#ffd86b'); ctx.fillStyle = ng; ctx.fillText(cur, 0, 0);
  ctx.restore();
  if (hasBar) {                                                         // barra de XP (opcional): de `from` até `to`
    const bh = h * 0.075, by = h * 0.34, bw = avail, v = lerp(r.bar.from, r.bar.to, pr), rr = (X, Y, W, H, R) => { ctx.beginPath(); ctx.roundRect ? ctx.roundRect(X, Y, W, H, R) : ctx.rect(X, Y, W, H); };
    rr(tx0 - 4 * u, by - bh / 2 - 4 * u, bw + 8 * u, bh + 8 * u, bh / 2 + 4 * u); ctx.fillStyle = COL.ink; ctx.fill();
    rr(tx0, by - bh / 2, bw, bh, bh / 2); ctx.fillStyle = 'rgba(255,255,255,0.2)'; ctx.fill();
    ctx.save(); rr(tx0, by - bh / 2, bw, bh, bh / 2); ctx.clip();
    const bg = ctx.createLinearGradient(tx0, 0, tx0 + bw, 0); bg.addColorStop(0, COL.hot); bg.addColorStop(0.6, COL.cream); bg.addColorStop(1, '#fff');
    ctx.fillStyle = bg; ctx.fillRect(tx0, by - bh / 2, Math.max(bw * v, bh * 0.6), bh);
    ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.fillRect(tx0, by - bh / 2 + bh * 0.12, Math.max(bw * v, bh * 0.6), bh * 0.25);
    ctx.restore();
  }
  ctx.restore();
};

/** Peças (estrelas de XP / moedas) que saem da estrela "#1" do troféu e entram nos cartões, nas batidas. */
P._drawTokens = function (ctx, t, uiA) {
  const L = this.L, u = L.u, TL = this.TL, k = L.tro.k, xf = this._troXf(t);
  if (t < TL.launch0 || t > TL.count1 + 0.6) return;
  const p0 = { x: L.tro.cx + (TRO_BADGE.x - TRO.cx) * k * xf.gs, y: L.tro.cy + xf.gy + (TRO_BADGE.y - TRO.cy) * k * xf.gs };
  ctx.save();
  for (const tk of this._tokens) {
    const q = (t - tk.launch) / TL.flight; if (q <= 0 || q >= 1) continue;
    const c = L.cards[tk.i]; if (!c) continue;
    const ixl = -c.w / 2 + c.h * 0.52, p1 = { x: c.x + c.w / 2 + ixl * Math.cos(c.rot), y: c.y + c.h / 2 + ixl * Math.sin(c.rot) };
    const cp = { x: (p0.x + p1.x) / 2 + tk.side * u, y: (p0.y + p1.y) / 2 - tk.arc * u };
    const kind = this._kind(tk.i);
    for (let g = 3; g >= 0; g--) {                         // cabeça + rastro
      const qq = q - g * 0.05; if (qq <= 0) continue;
      const e = easeInOutCubic(qq), a = (1 - e) * (1 - e), b = 2 * (1 - e) * e, cc = e * e;
      const x = a * p0.x + b * cp.x + cc * p1.x, y = a * p0.y + b * cp.y + cc * p1.y;
      const R = (30 + 10 * Math.sin(Math.min(qq, 1) * Math.PI)) * u * (g ? 0.8 : 1) * (1 - 0.25 * easeInQuad(prog(qq, 0.8, 1)));
      ctx.save(); ctx.globalAlpha = uiA * (g ? 0.2 / g : 1) * smooth(qq * 9) * (1 - smooth(prog(qq, 0.9, 1)));
      ctx.translate(x, y); this._drawIcon(ctx, tk.i, R, kind === 'coin' ? tk.spin * qq + tk.ph : 0, kind === 'star' ? tk.spin * qq : 0); ctx.restore();
    }
  }
  ctx.restore();
};

/** Botões MENU e JOGAR (entram nas batidas; hover/foco/clique; JOGAR é o principal). */
P._drawButtons = function (ctx, t, ex) {
  const L = this.L, u = L.u, TL = this.TL, fam = this._fam, interactive = this.state === 'show' && this._ready;
  L.buttons.forEach((b) => {
    const primary = b.id === 'play', order = primary ? 0 : 1, t0 = TL.btn0 + order * TL.btnStep, p = prog(t, t0, t0 + TL.btnDur); if (p <= 0) return;
    const e = easeOutBack(p, 1.8), s = this._bs[b.id], beat = this._beatEnv(t, false);
    let alpha = smooth(p * 4), sc = lerp(0.55, 1, e), oy = (1 - e) * 170 * u;
    if (ex >= 0) {                                         // saída: o escolhido dá um "pop" e some; o outro some rápido
      if (b.id === this._chosen) { sc *= 1 + 0.2 * easeOutQuad(prog(ex, 0, 0.15)); alpha *= 1 - smooth(prog(ex, 0.2, 0.5)); }
      else alpha *= 1 - smooth(prog(ex, 0, 0.2));
    }
    sc *= 1 + 0.07 * s.hov - 0.05 * s.press + (primary ? 0.016 * beat : 0);
    const w = b.w, h = b.h, sk = h * 0.16, cx = b.x + w / 2, cy = b.y + h / 2 + oy, focus = interactive && this._focus === b.id;
    ctx.save(); ctx.globalAlpha = alpha; ctx.translate(cx, cy); ctx.scale(sc, sc); ctx.lineJoin = 'round';
    if (primary) {                                         // halo pulsando na batida
      const hg = ctx.createRadialGradient(0, 0, 0, 0, 0, w * 0.75), ha = 0.14 + 0.22 * beat + 0.2 * s.hov;
      hg.addColorStop(0, `rgba(255,60,160,${ha})`); hg.addColorStop(1, 'rgba(255,60,160,0)');
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = hg; ctx.fillRect(-w, -w, w * 2, w * 2); ctx.restore();
    }
    const dsh = 1 - s.press * 0.7;
    ctx.save(); ctx.translate(8 * u * dsh, 12 * u * dsh); btnPath(ctx, w, h, sk); ctx.fillStyle = 'rgba(20,16,28,0.6)'; ctx.fill(); ctx.restore();
    btnPath(ctx, w, h, sk); ctx.lineWidth = 16 * u; ctx.strokeStyle = COL.ink; ctx.stroke();
    const g = ctx.createLinearGradient(0, -h / 2, 0, h / 2);
    if (primary) { g.addColorStop(0, '#ff7cc6'); g.addColorStop(0.55, COL.hot); g.addColorStop(1, '#c8126a'); }
    else { g.addColorStop(0, '#fff6d6'); g.addColorStop(0.55, COL.cream); g.addColorStop(1, '#f0b95a'); }
    ctx.fillStyle = g; ctx.fill();
    ctx.save(); btnPath(ctx, w, h, sk); ctx.clip();         // brilho de cima + hover
    ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.fillRect(-w, -h / 2, w * 2, h * 0.38);
    if (s.hov > 0.01) { ctx.fillStyle = `rgba(255,255,255,${0.16 * s.hov})`; ctx.fillRect(-w, -h / 2, w * 2, h); }
    ctx.restore();
    if (focus) {                                           // anel de foco (pulsa)
      btnPath(ctx, w + 30 * u, h + 26 * u, sk); ctx.lineWidth = 6 * u; ctx.strokeStyle = `rgba(255,243,201,${0.65 + 0.35 * Math.sin(t * 6)})`; ctx.stroke();
    }
    // rótulo + ícone, inclinados como o botão
    const txt = primary ? this.opt.texts.play : this.opt.texts.menu, fs = h * 0.5;
    ctx.save(); ctx.transform(1, 0, -sk * 2 / h, 1, 0, 0);
    ctx.font = `${fs}px ${fam}`; ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    const tw = ctx.measureText(txt).width, asc = ctx.measureText(txt).actualBoundingBoxAscent, iw = h * 0.3, gap = h * 0.16, x0 = -(iw + gap + tw) / 2, base = asc / 2;
    ctx.lineJoin = 'round';
    if (primary) {                                         // ícone ▶
      ctx.beginPath(); ctx.moveTo(x0, -iw * 0.62); ctx.lineTo(x0 + iw, 0); ctx.lineTo(x0, iw * 0.62); ctx.closePath();
      ctx.lineWidth = 7 * u; ctx.strokeStyle = COL.ink; ctx.stroke(); ctx.fillStyle = '#fff'; ctx.fill();
      ctx.lineWidth = 11 * u; ctx.strokeStyle = COL.ink; ctx.strokeText(txt, x0 + iw + gap, base); ctx.fillStyle = '#fff'; ctx.fillText(txt, x0 + iw + gap, base);
    } else {                                               // ícone ☰
      ctx.fillStyle = '#3a1d63';
      for (let j = -1; j <= 1; j++) { ctx.beginPath(); ctx.roundRect ? ctx.roundRect(x0, j * iw * 0.36 - iw * 0.09, iw, iw * 0.18, iw * 0.09) : ctx.rect(x0, j * iw * 0.36 - iw * 0.09, iw, iw * 0.18); ctx.fill(); }
      ctx.fillText(txt, x0 + iw + gap, base);
    }
    ctx.restore();
    ctx.restore();
  });
};

/** Tela "Press any key to start." (só aparece se o navegador bloqueia o áudio). */
P._drawGate = function (ctx, t) {
  const L = this.L, u = L.u, text = this.opt.texts.gate, b = L.buttons[0], cy = b.y + b.h / 2, fs = 54 * u;
  ctx.save(); ctx.font = `${fs}px ${this._fam}`; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
  const a = 0.55 + 0.45 * (0.5 + 0.5 * Math.sin(t * 3.2));
  ctx.globalAlpha = a; ctx.shadowColor = 'rgba(255,255,255,0.6)'; ctx.shadowBlur = 24 * u; ctx.fillStyle = '#fff';
  ctx.fillText(text, L.w / 2, cy + fs * 0.3); ctx.shadowBlur = 8 * u; ctx.fillText(text, L.w / 2, cy + fs * 0.3);
  ctx.restore();
};

/** Flash do golpe: quadro invertido (1–3 quadros) + clarão; ao pular e na saída, clarão e fade. */
P._drawFlash = function (ctx, t, ex) {
  const L = this.L, T = this.T, dt = t - T, red = this._reduced;
  if (dt >= 0 && dt < 0.5) {
    if (!red && dt < 0.05) { ctx.save(); ctx.globalCompositeOperation = 'difference'; ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, L.w, L.h); ctx.restore(); }
    else {
      const a = (red ? 0.25 : 0.55) * Math.exp(-(dt - 0.05) * 14);
      if (a > 0.004) { ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.globalAlpha = a; ctx.fillStyle = '#fff4d8'; ctx.fillRect(0, 0, L.w, L.h); ctx.restore(); }
    }
  }
  if (dt > -0.12 && dt < 0) { ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.globalAlpha = 0.25 * prog(dt, -0.12, 0); ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, L.w, L.h); ctx.restore(); }
  const sk = performance.now() / 1000 - this._skipT;            // clarão curto ao pular a animação
  if (sk >= 0 && sk < 0.35) { ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.globalAlpha = (red ? 0.2 : 0.4) * Math.exp(-sk * 10); ctx.fillStyle = '#fff4d8'; ctx.fillRect(0, 0, L.w, L.h); ctx.restore(); }
  if (ex >= 0) {
    const a = smooth(prog(ex, 0.62, 0.9));
    if (a > 0.004) { ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, L.w, L.h); ctx.restore(); }
    this.canvas.style.opacity = String(1 - smooth(prog(ex, 1.0, EXIT_END)));       // a tela some revelando a de baixo
    this._drawExitLines(ctx, ex);
  } else if (this.canvas.style.opacity !== '1') this.canvas.style.opacity = '1';
};

P._drawExitLines = function (ctx, ex) {
  if (ex < 0.2 || ex > 1.0) return;
  const L = this.L, u = L.u, cx = L.tro.cx, cy = L.tro.cy, rnd = mulberry32(99), R = Math.hypot(L.w, L.h);
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




G.GoghosVictory=GoghosVictory;
})(globalThis.GOGHOS);
