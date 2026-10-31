/*!
 * GOGHOS Loading Screen  v0.1.0
 * Tela de carregamento em canvas 2D, sem dependências.
 * Veja o README.md para integrar ao resto do jogo.
 */
(function (root) {
'use strict';

/* Caixas (em pixels do arquivo) das duas camadas do logo: t = "GOGHOS" (topo), b = "THE NIGHTMARE IS COMING", u = união */
const META = {"u": [132, 215, 1143, 962], "t": [237, 213, 930, 354], "b": [131, 198, 1146, 980]};

const PI = Math.PI;
const cl = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a, b, t) => a + (b - a) * t;
const ss = (a, b, t) => cl((t - a) / (b - a));                 // progresso 0..1 entre a e b
const eo = t => 1 - Math.pow(1 - cl(t), 3);                    // ease-out
const ei = t => cl(t) * cl(t);                                 // ease-in
const eb = t => { t = cl(t); return 1 + 2.2 * Math.pow(t - 1, 3) + 1.2 * Math.pow(t - 1, 2); };  // overshoot leve
const ebo = u => { u = cl(u); return 1 + 2.7 * Math.pow(u - 1, 3) + 1.7 * Math.pow(u - 1, 2); }; // overshoot forte
const rng = seed => () => (seed = seed * 16807 % 2147483647) / 2147483647;

const READY_T = 1.1;   // tempo (s) mostrando "Ready to duel!" antes de sair
const OUT_T = 0.85;    // duração (s) da animação de saída

const DEFAULTS = {
  parent: null,                 // elemento onde a tela é montada (padrão: document.body)
  base: 'assets/',              // pasta dos arquivos
  assets: {
    bg: 'bg.webp', logoTop: 'logo_top.webp', logoBottom: 'logo_bottom.webp',
    font: 'german_beauty.ttf', music: 'ready_to_duel.mp3'
  },
  version: 'Versão 0.1.0',
  text: 'Loading...',
  readyText: 'Ready to duel!',
  background: '#ffffff',
  minDuration: 6,               // segundos mínimos de barra, para a intro aparecer inteira
  music: true,                  // toca a música (precisa de um toque/clique do usuário antes)
  volume: 0.9,
  sfx: true,                    // efeitos sonoros sintetizados, bem discretos
  bpm: 120,                     // andamento da música
  hit: 2.095,                   // segundo em que cai o primeiro golpe da música (o logo bate aqui)
  zIndex: 9999,
  reducedMotion: false,
  sfxVolume: 0.45,
  onProgress: null,
  onError: null,
  onDone: null
};

class LoadingScreen {
  constructor(opts = {}) {
    const o = this.o = Object.assign({}, DEFAULTS, opts);
    o.assets = Object.assign({}, DEFAULTS.assets, opts.assets || {});
    this.parent = o.parent || document.body;
    this.real = 0; this.shown = 0; this.phase = 'idle';
    this.t = 0; this.tReady = 0; this.tOut = 0;
    this.finished = new Promise(r => { this._resolve = r; });
    this._timers = new Set(); this._loadAborts = new Set();
    this._destroyed = false; this._fading = false; this._sfxStarted = false;

    const el = this.el = document.createElement('div');
    el.style.cssText = `position:fixed;inset:0;z-index:${o.zIndex};background:${o.background};visibility:hidden;overflow:hidden;touch-action:none`;
    const cv = this.cv = document.createElement('canvas');
    cv.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block';
    el.appendChild(cv); this.parent.appendChild(el);
    this.g = cv.getContext('2d');
    this.mask = document.createElement('canvas');                       // logo inteiro (máscara do brilho)
    this.fx = document.createElement('canvas'); this.fxg = this.fx.getContext('2d');
    this.mbuf = document.createElement('canvas');                       // monstro recortado (retrato)
    this._onResize = () => { if (this.img) this._layout(); };
    addEventListener('resize', this._onResize);
    this._onVisibility = () => {
      if (this._destroyed || this.phase === 'idle' || this.phase === 'gone') return;
      if (document.hidden) {
        if (this._hiddenAt != null) return;
        this._hiddenAt = performance.now();
        this._resumeMusic = !!this.music && !this.music.paused;
        this.music?.pause(); this.ax?.suspend?.()?.catch?.(() => {});
        cancelAnimationFrame(this._raf); this._raf = 0;
      } else if (this._hiddenAt != null) {
        this._t0 += performance.now() - this._hiddenAt;
        this._hiddenAt = null; this._last = 0; this._lastMediaAdvance = performance.now();
        if (this._resumeMusic && this.music) this.music.play()?.catch?.(() => this._musicFallback());
        this.ax?.resume?.()?.catch?.(() => {});
        this._raf = requestAnimationFrame(this._loop);
      }
    };
    document.addEventListener('visibilitychange', this._onVisibility);

    // tabelas pseudo-aleatórias fixas (a animação é determinística)
    const R = rng(7);
    this.P = Array.from({ length: 30 }, () => ({ a: R() * 6.283, v: 320 + R() * 620, r: 7 + R() * 14, star: R() < .35, c: ['#ffdc6a', '#ff8fc0', '#8fe6ff', '#c9a7ff'][R() * 4 | 0], s: (R() - .5) * 8 }));
    this.SL = Array.from({ length: 64 }, () => ({ a: R() * 6.283, l: R(), w: .006 + R() * .022 }));
    this.AM = Array.from({ length: 18 }, () => ({ x: R(), y: R(), r: 2 + R() * 7, s: .5 + R(), p: R() * 6.3 }));
    this.JT = Array.from({ length: 4 }, () => ({ dx: (R() - .5) * 5, dy: (R() - .5) * 5, r: (R() - .5) * .006 }));
  }

  /* ---------------------------------------------------------------- API pública */

  /** Carrega imagens, fonte e música da própria tela. Retorna uma Promise. */
  load() {
    if (this._p) return this._p;
    const a = this.o.assets;
    const img = u => new Promise((ok, no) => {
      const i = new Image();
      const clean = () => { i.onload = i.onerror = null; this._loadAborts.delete(abort); };
      const abort = () => { clean(); i.src = ''; ok(null); };
      this._loadAborts.add(abort);
      i.onload = () => { clean(); ok(i); };
      i.onerror = () => { clean(); no(new Error('Falha ao carregar ' + u.slice(0, 60))); };
      i.src = u;
    });
    const font = (async () => {
      try { const f = new FontFace('GoghosHand', `url("${this._url(a.font)}")`); await f.load(); if (!this._destroyed) { this._fontFace = f; document.fonts.add(f); } }
      catch (e) { console.warn('[LoadingScreen] fonte não carregou:', e); }
    })();
    this._p = Promise.all([img(this._url(a.bg)), img(this._url(a.logoTop)), img(this._url(a.logoBottom)), font]).then(([bg, lt, lb]) => {
      if (this._destroyed) return this;
      this.img = { bg, lt, lb };
      if (this.o.music) { const m = this.music = new Audio(this._url(a.music)); m.preload = 'auto'; m.loop = true; m.volume = 0; }
      this._layout();
      return this;
    }).catch(error => { this.o.onError?.(error); throw error; });
    return this._p;
  }

  /** Inicia animação + música. Chame dentro de um clique/toque do usuário (regra dos navegadores para áudio). */
  start() {
    if (this._destroyed) return this;
    if (!this.img) return this.load().then(() => this.start());
    if (this.phase !== 'idle') return this;
    this.phase = 'run'; this.el.style.visibility = 'visible';
    const m = this.music;
    if (!this.o.reducedMotion) this._sfxInit();
    this._t0 = performance.now(); this._aok = true;
    if (m) {
      m.currentTime = 0; m.volume = 0; this._playingObserved = false;
      this._onPlaying = () => {
        if (this._destroyed || this.music !== m) return;
        this._playingObserved = true;
        this._clearTimer(this._audioWait); this._t0 = performance.now() - m.currentTime * 1000;
        this._aok = true; this._sfxStart();
      };
      this._onAudioError = () => this._musicFallback();
      m.addEventListener('playing', this._onPlaying, { once: true });
      m.addEventListener('error', this._onAudioError, { once: true });
      this._audioWait = this._later(() => { if (!this._playingObserved) this._musicFallback(); }, 1500);
      const p = m.play();
      if (p && p.catch) p.catch(() => this._musicFallback());
    } else this._sfxStart();
    this._last = 0; this._report(); this._raf = requestAnimationFrame(this._loop);
    return this;
  }

  /** Informa o progresso REAL do carregamento do jogo (0 a 1). */
  setProgress(p) { this.real = Math.max(this.real, cl(p)); }

  /** Atalho: recebe uma lista de Promises e atualiza o progresso conforme elas terminam. */
  track(promises) {
    let n = 0; const total = promises.length || 1;
    if (!promises.length) this.setProgress(1);
    return Promise.all(promises.map(p => Promise.resolve(p).then(value => {
      this.setProgress(++n / total); return value;
    }, error => { this.setProgress(++n / total); throw error; })));
  }

  /** Marca como 100% e devolve a Promise que resolve quando a tela terminou de sair. */
  complete() { this.setProgress(1); return this.finished; }

  /** Baixa o volume da música até parar (a música NÃO para sozinha quando a tela sai). */
  fadeOutMusic(sec = 1.5) {
    const m = this.music; if (!m) return; const v0 = m.volume, t0 = performance.now();
    cancelAnimationFrame(this._fadeRAF);
    const step = () => { if (this._destroyed) return; const k = sec <= 0 ? 1 : (performance.now() - t0) / (sec * 1000); if (k >= 1) { m.pause(); return; } m.volume = v0 * (1 - k); this._fadeRAF = requestAnimationFrame(step); };
    this._fading = true; step();
  }

  destroy() {
    if (this._destroyed) return;
    this._destroyed = true;
    cancelAnimationFrame(this._raf); cancelAnimationFrame(this._fadeRAF);
    for (const id of this._timers) clearTimeout(id); this._timers.clear();
    for (const abort of [...this._loadAborts]) abort();
    removeEventListener('resize', this._onResize);
    document.removeEventListener('visibilitychange', this._onVisibility);
    if (this._fontFace) { document.fonts.delete(this._fontFace); this._fontFace = null; }
    this._releaseMusic();
    this.ax?.close?.()?.catch?.(() => {}); this.ax = null;
    this.el.remove(); this.phase = 'gone'; this._report(); this._resolve();
  }

  _later(fn, ms) { const id = setTimeout(() => { this._timers.delete(id); if (!this._destroyed) fn(); }, ms); this._timers.add(id); return id; }
  _clearTimer(id) { clearTimeout(id); this._timers.delete(id); }
  _releaseMusic() {
    const m = this.music; if (!m) return;
    m.removeEventListener('playing', this._onPlaying); m.removeEventListener('error', this._onAudioError);
    m.pause(); m.removeAttribute('src'); m.load(); this.music = null;
  }
  _musicFallback() {
    if (this._destroyed) return;
    this._clearTimer(this._audioWait); this._releaseMusic(); this._aok = true; this._sfxStart();
  }
  _report() {
    const key = Math.round(this.shown * 100) + ':' + this.phase;
    if (key === this._reported) return;
    this._reported = key; this.o.onProgress?.(this.shown, this.phase);
  }

  /** Para testes/capturas: desenha o estado em um instante t (s), com progresso p e fase. */
  renderAt(t, p = 0, phase = 'run', tReady = 0) {
    this.shown = p; this.phase = phase; this.tReady = tReady; this.tOut = tReady + READY_T; this._draw(t);
  }

  /* ---------------------------------------------------------------- internos */

  _url(n) { return /^(data:|blob:|https?:|\/)/.test(n) ? n : this.o.base + n; }

  _layout() {
    const r = this.cv.getBoundingClientRect(), W = this.W = r.width || innerWidth, H = this.H = r.height || innerHeight, D = this.D = Math.min(devicePixelRatio || 1, 2);
    this.cv.width = W * D | 0; this.cv.height = H * D | 0;
    const port = this.port = W < H * 0.95, L = this.L = {};
    if (!port) {
      // paisagem: layout da referência (1920x1080), monstro colado à esquerda e UI colada à direita
      const s = Math.min(W / 1920, H / 1080), ox = W - 1920 * s, oy = (H - 1080 * s) / 2;
      L.s = s;
      L.mon = { x: 0, y: oy, w: 1920 * s, h: 1080 * s };
      L.logo = { cx: ox + 1428 * s, cy: oy + 432 * s, w: 535 * s };
      L.bar = { x: ox + 1107 * s, y: oy + 697 * s, w: 658 * s, h: 96 * s };
      L.txt = { cx: ox + 1442 * s, cy: oy + 880 * s, size: 53 * s };
      L.ver = { x: ox + 1903 * s, y: oy + 1056 * s, size: Math.max(11, 19 * s) };
    } else {
      // retrato (celular em pé): monstro em cima, logo no meio, barra embaixo
      const mh = H * .52, mw = Math.min(mh * 900 / 1080, W * 1.02), bw = W * .78;
      L.s = W / 1080;
      L.mon = { x: 0, y: 0, w: mw, h: mh };
      L.logo = { cx: W / 2, cy: H * .6, w: W * .84 };
      L.bar = { x: W * .11, y: H * .765, w: bw, h: bw * 96 / 658 };
      L.txt = { cx: W / 2, cy: H * .875, size: W * .1 };
      L.ver = { x: W - 14, y: H - 16, size: Math.max(11, W * .034) };
      // recorte do monstro com a base esmaecendo para o fundo
      const mb = this.mbuf; mb.width = Math.ceil(mw * D); mb.height = Math.ceil(mh * D);
      const b = mb.getContext('2d'); b.setTransform(1, 0, 0, 1, 0, 0); b.clearRect(0, 0, mb.width, mb.height);
      b.drawImage(this.img.bg, 0, 0, 900, 1080, 0, 0, mb.width, mb.height);
      b.globalCompositeOperation = 'destination-out';
      const f = b.createLinearGradient(0, mb.height * .68, 0, mb.height); f.addColorStop(0, 'rgba(0,0,0,0)'); f.addColorStop(1, 'rgba(0,0,0,1)');
      b.fillStyle = f; b.fillRect(0, 0, mb.width, mb.height); b.globalCompositeOperation = 'source-over';
    }
    // logo: escala, posição e máscara do logo completo (usada no brilho holográfico)
    const u = META.u, k = L.logo.w / u[2];
    L.logo.k = k; L.logo.lw = u[2] * k; L.logo.lh = u[3] * k; L.logo.x0 = L.logo.cx - L.logo.lw / 2; L.logo.y0 = L.logo.cy - L.logo.lh / 2;
    const w = Math.ceil(L.logo.lw * D), h = Math.ceil(L.logo.lh * D);
    this.mask.width = this.fx.width = w; this.mask.height = this.fx.height = h;
    const mg = this.mask.getContext('2d');
    [[this.img.lb, META.b], [this.img.lt, META.t]].forEach(([im, bb]) => mg.drawImage(im, (bb[0] - u[0]) * k * D, (bb[1] - u[1]) * k * D, bb[2] * k * D, bb[3] * k * D));
  }

  _beat(t) { const ph = (t - this.o.hit) / (60 / this.o.bpm), n = Math.floor(ph); return { n, f: ph - n, ph }; }

  _clock(now) {
    let t = Math.max(0, (now - this._t0) / 1000); const m = this.music;
    if (this._aok && m && !m.paused && t < (m.duration || 60) - 1) {          // corrige deriva suavemente
      if (m.currentTime !== this._lastMediaTime) { this._lastMediaTime = m.currentTime; this._lastMediaAdvance = now; }
      if (now - this._lastMediaAdvance > 1500) { this._musicFallback(); return t; }
      const d = m.currentTime - t;
      if (Math.abs(d) > .12) { this._t0 = now - m.currentTime * 1000; t = m.currentTime; } else this._t0 -= d * 50;
    }
    return this._aok ? Math.max(0, t) : 0;
  }

  _loop = (now) => {
    if (this.phase === 'gone') return;
    const dt = Math.min(.05, this._last ? (now - this._last) / 1000 : .016); this._last = now;
    const t = this.t = this._clock(now);
    this._update(t, dt); this._report(); if (this.phase === 'gone') return; this._draw(t);
    if (this.music && !this._fading) { const k = ss(0, .5, t); this.music.volume = this.o.volume * k; }
    if (this.phase !== 'gone') this._raf = requestAnimationFrame(this._loop);
  };

  _update(t, dt) {
    if (this.o.reducedMotion) {
      this.shown = this.real;
      if (this.phase === 'run' && this.real >= 1 && t >= .2) { this.phase = 'ready'; this.tReady = t; }
      else if (this.phase === 'ready' && t >= this.tReady + .15) { this.phase = 'outro'; this.tOut = t; }
      else if (this.phase === 'outro' && t >= this.tOut + .15) { this.phase = 'gone'; this._finish(); }
      return;
    }
    const hit = this.o.hit;
    if (this.phase === 'run') {
      const x = ss(hit + .15, hit + .15 + this.o.minDuration, t), minP = x * x * (3 - 2 * x);   // curva mínima de tempo
      const target = Math.min(this.real, minP);
      this.shown += (target - this.shown) * (1 - Math.exp(-dt * 5));
      if (this.real >= 1 && minP >= 1 && this.shown > .995) { this.shown = 1; this.phase = 'ready'; this.tReady = t; this._ding(); }
    } else if (this.phase === 'ready' && t > this.tReady + READY_T) {
      this.phase = 'outro'; this.tOut = t; this._whoosh();
    } else if (this.phase === 'outro' && t > this.tOut + OUT_T) {
      this.phase = 'gone'; this._finish();
    }
  }

  _finish() {
    cancelAnimationFrame(this._raf);
    const done = () => { this.destroy(); this.o.onDone?.(this); };
    if (this.o.reducedMotion) { done(); return; }
    this.el.style.transition = 'opacity .3s'; this.el.style.opacity = 0;
    this._later(done, 320);
  }

  /* ---------------------------------------------------------------- desenho */

  _draw(t) {
    const g = this.g, { W, H, D, L, o } = this, hit = o.hit;
    g.setTransform(D, 0, 0, D, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
    g.fillStyle = o.background; g.fillRect(0, 0, W, H);
    if (o.reducedMotion) {
      // Mesmo enquadramento e arte final; só o progresso muda, sem impactos ou partículas.
      const still = o.hit + 2;
      this._monster(still, 0); this._logo(still, 0); this._bar(still, 0);
      this._text(still, 0); this._version(still, 0); return;
    }
    let sh = 0; [[hit, 18], [hit + .5, 9]].forEach(([k, a]) => { const u = t - k; if (u > 0) sh += Math.exp(-u * 9) * a * L.s; });   // tremor de câmera
    g.save(); g.translate(Math.sin(t * 97) * sh, Math.cos(t * 83) * sh * .8);
    const out = this.phase === 'outro' ? cl((t - this.tOut) / OUT_T) : 0;
    this._monster(t, out); this._anticipation(t); this._impact(t); this._logo(t, out); this._particles(t, out);
    this._bar(t, out); this._text(t, out); this._version(t, out);
    g.restore();
    if (t >= hit && t < hit + .066) {                    // frame de impacto invertido (estilo anime)
      g.globalCompositeOperation = 'difference'; g.fillStyle = '#fff'; g.fillRect(0, 0, W, H); g.globalCompositeOperation = 'source-over';
    }
  }

  _monster(t, out) {
    const g = this.g, L = this.L, m = L.mon, hit = this.o.hit, S = this.port ? this.mbuf : this.img.bg;
    const p = ss(.15, 1.5, t), e = eo(p), v = (p > 0 && p < 1) ? Math.pow(1 - p, 2) : 0;
    const j = this.JT[((Math.floor(t * 8) % 4) + 4) % 4];                            // "tremida" do traço, 8 quadros/s (= semicolcheia a 120 BPM)
    const bt = this._beat(t), bump = t >= hit ? Math.exp(-bt.f * 7) : 0;
    const sc = 1 + .008 * Math.sin(t * 1.6) + .012 * bump + (t >= hit ? .035 * Math.exp(-(t - hit) * 10) : 0);
    const slide = -(1 - e) * m.w * .6 - ei(out) * m.w * 1.05;
    const draw = (dx, a) => { g.save(); g.globalAlpha = a; g.translate(m.x + dx + j.dx * L.s, m.y + m.h / 2 + j.dy * L.s); g.rotate(j.r); g.scale(sc, sc); g.drawImage(S, 0, -m.h / 2, m.w, m.h); g.restore(); };
    const sp = Math.max(v, out > 0 ? out : 0), dir = out > 0 ? 1 : -1;
    if (sp > .02) for (let i = 5; i >= 1; i--) draw(slide + dir * i * sp * m.w * .05, .13 * sp);   // rastro de movimento
    draw(slide, 1);
    // pontinhos de tinta flutuando da fumaça
    const aa = ss(1.6, 2.4, t) * (1 - out);
    if (aa > 0) this.AM.forEach(a => {
      const ph = (t * .08 * a.s + a.p) % 1, x = m.x + m.w * (.34 + .25 * a.x) + ph * m.w * .35, y = m.y + m.h * (.12 + .76 * a.y) - ph * m.h * .18;
      g.fillStyle = `rgba(0,0,0,${Math.sin(PI * ph) * .5 * aa})`; g.beginPath(); g.arc(x, y, a.r * L.s * (.6 + .7 * ph), 0, 7); g.fill();
    });
  }

  _anticipation(t) {                                      // antes do golpe: anel que encolhe + tinta sugada para o logo
    const hit = this.o.hit; if (t < 1.1 || t >= hit) return;
    const g = this.g, L = this.L, c = L.logo, u = ss(1.1, hit, t), big = Math.max(this.W, this.H);
    g.strokeStyle = `rgba(0,0,0,${.2 + .6 * u})`; g.lineWidth = (2 + 10 * u) * L.s;
    g.beginPath(); g.arc(c.cx, c.cy, big * .55 * (1 - eo(u)) + c.w * .52, 0, 7); g.stroke();
    g.fillStyle = '#000';
    this.P.slice(0, 14).forEach((q, i) => { const r = (1 - eo(u)) * big * .5 * (.5 + (i % 3) * .25) + c.w * .1; g.beginPath(); g.arc(c.cx + Math.cos(q.a) * r, c.cy + Math.sin(q.a) * r, (3 + u * 4) * L.s, 0, 7); g.fill(); });
  }

  _comic(cx, cy, R, rot, fill) {                          // explosão "POW" de quadrinhos
    const g = this.g, n = 16; g.beginPath();
    for (let i = 0; i < n * 2; i++) { const a = rot + i * PI / n, r = i % 2 ? R * .66 : R * (1 + .08 * ((i * 7) % 3)); g.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r); }
    g.closePath(); g.fillStyle = fill; g.fill(); g.lineWidth = 8 * this.L.s; g.lineJoin = 'round'; g.strokeStyle = '#000'; g.stroke();
  }

  _impact(t) {                                            // atrás do logo: anéis, linhas de velocidade e explosão amarela
    const g = this.g, L = this.L, hit = this.o.hit, c = L.logo, big = Math.max(this.W, this.H);
    [[hit, 1], [hit + .5, .5]].forEach(([k, s], i) => {
      const u = t - k; if (u < 0 || u > 1) return;
      if (u < .75) { const e = eo(u / .75); g.strokeStyle = `rgba(0,0,0,${(1 - u / .75) * .9})`; g.lineWidth = (30 * (1 - e) + 2) * L.s * s; g.beginPath(); g.arc(c.cx, c.cy, e * big * .6 * s + c.w * .2, 0, 7); g.stroke(); }
      if (i === 0 && u < .5) {
        g.fillStyle = `rgba(0,0,0,${1 - u / .5})`;
        this.SL.forEach(l => { const r0 = c.w * .4 + big * .15 * eo(u / .5), r1 = big * (.8 + .5 * l.l); g.beginPath(); g.moveTo(c.cx + Math.cos(l.a) * r0, c.cy + Math.sin(l.a) * r0); g.lineTo(c.cx + Math.cos(l.a - l.w) * r1, c.cy + Math.sin(l.a - l.w) * r1); g.lineTo(c.cx + Math.cos(l.a + l.w) * r1, c.cy + Math.sin(l.a + l.w) * r1); g.fill(); });
      }
      if (i === 0 && u < .6) { g.save(); g.globalAlpha = 1 - ss(.3, .6, u); this._comic(c.cx, c.cy, c.w * .78 * ebo(u / .2), u * .6, '#ffdc6a'); g.restore(); }
    });
  }

  _layer(im, b, q) {                                      // desenha uma camada do logo com pivô e transformação própria
    const g = this.g, c = this.L.logo, u = META.u, k = c.k, w = b[2] * k, h = b[3] * k, x = c.x0 + (b[0] - u[0]) * k, y = c.y0 + (b[1] - u[1]) * k;
    g.save(); g.globalAlpha *= q.a; g.translate(x + w * q.px + (q.x || 0), y + h * q.py + (q.y || 0)); g.rotate(q.r || 0); g.scale(q.sx, q.sy); g.drawImage(im, -w * q.px, -h * q.py, w, h); g.restore();
  }

  _logo(t, out) {
    const g = this.g, L = this.L, hit = this.o.hit, c = L.logo, bt = this._beat(t);
    const bump = t > hit + .55 ? Math.exp(-bt.f * 6) * .028 : 0, fl = t > hit + .7 ? Math.sin(t * 1.8) * L.s * 4 : 0;
    const zoom = (1 + ei(out) * 1.8) * (1 + bump), alpha = 1 - ss(.3, 1, out);
    g.save(); g.globalAlpha = alpha; g.translate(c.cx, c.cy + fl); g.scale(zoom, zoom); g.translate(-c.cx, -c.cy);
    // THE NIGHTMARE IS COMING: bate na tela exatamente no golpe da música
    const pn = ss(hit - .23, hit + .17, t);
    if (pn > 0) {
      const s = lerp(2.6, 1, eb(pn)), a = ss(hit - .23, hit - .15, t);
      if (pn < .6) for (let i = 5; i > 0; i--) this._layer(this.img.lb, META.b, { sx: s * (1 + .1 * i), sy: s * (1 + .1 * i), a: .13 * (1 - pn / .6), px: .5, py: .5 });
      this._layer(this.img.lb, META.b, { sx: s, sy: s, a, px: .5, py: .5 });
    }
    // GOGHOS: cai de cima e pousa na 2ª batida, com squash & stretch
    const tl = hit + .5;
    if (t > tl - .26) {
      let y = 0, sx = 1, sy = 1, r = 0;
      if (t < tl) { const v = ei((t - (tl - .26)) / .26); y = -this.H * (1 - v); sy = 1 + .4 * v; sx = 1 - .16 * v; }
      else { const u = t - tl, s = Math.exp(-u * 8) * Math.cos(u * 24); sy = 1 - .36 * s; sx = 1 + .26 * s; y = -this.H * .05 * Math.exp(-u * 6) * Math.abs(Math.sin(u * 13)); r = .05 * Math.exp(-u * 6) * Math.sin(u * 20); }
      this._layer(this.img.lt, META.t, { y, sx, sy, a: 1, r, px: .5, py: 1 });
    }
    this._shine(t, out);
    g.restore();
  }

  _shine(t, out) {                                        // brilho holográfico varrendo o logo + estrelinhas
    const g = this.g, c = this.L.logo, hit = this.o.hit, D = this.D;
    if (t < hit + .9 || out > .4) return;
    const per = 4, first = hit + .9, n = Math.floor((t - first) / per), u = (t - first - n * per) / .95, sweeping = u < 1;
    const ph = Math.atan(.45), cp = Math.cos(ph), sp = Math.sin(ph), S = c.lw * cp + c.lh * sp, bw = S * .22, pos = lerp(-bw, S + bw, u * u * (3 - 2 * u));
    if (sweeping) {
      const f = this.fxg; f.setTransform(D, 0, 0, D, 0, 0); f.globalCompositeOperation = 'source-over'; f.clearRect(0, 0, c.lw + 2, c.lh + 2);
      const gr = f.createLinearGradient(0, 0, S * cp, S * sp);
      [[-1, 'rgba(255,255,255,0)'], [-.5, 'rgba(255,120,200,.8)'], [0, 'rgba(255,255,255,1)'], [.5, 'rgba(110,230,255,.8)'], [1, 'rgba(255,255,255,0)']].forEach(([d, col]) => gr.addColorStop(cl((pos + bw * d) / S), col));
      f.fillStyle = gr; f.fillRect(0, 0, c.lw + 2, c.lh + 2);
      f.globalCompositeOperation = 'destination-in'; f.drawImage(this.mask, 0, 0, c.lw, c.lh);       // só a faixa, recortada no formato do logo
      g.save(); g.globalCompositeOperation = 'lighter'; g.drawImage(this.fx, c.x0, c.y0, c.lw, c.lh); g.restore();
    }
    [[.29, .14], [.83, .12], [.08, .5], [.62, .47], [.93, .55]].forEach(([gx, gy], i) => {
      const pr = gx * c.lw * cp + gy * c.lh * sp;
      const a = sweeping ? Math.max(0, 1 - Math.abs(pos - pr) / (bw * .8)) : Math.pow(Math.max(0, Math.sin(t * 2.3 + i * 2.1)), 6) * .8;
      this._glint(c.x0 + gx * c.lw, c.y0 + gy * c.lh, c.lw * .075 * (.5 + .7 * a), a, t * .5 + i);
    });
  }

  _glint(x, y, r, a, rot) {                               // estrela de brilho de 4 pontas
    if (a < .02) return; const g = this.g;
    g.save(); g.translate(x, y); g.rotate(rot); g.globalCompositeOperation = 'lighter'; g.globalAlpha = Math.min(1, a);
    const gr = g.createRadialGradient(0, 0, 0, 0, 0, r * .55); gr.addColorStop(0, '#fff'); gr.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gr; g.beginPath(); g.arc(0, 0, r * .55, 0, 7); g.fill();
    g.fillStyle = '#fff'; const c = r * .07; g.beginPath(); g.moveTo(0, -r); g.quadraticCurveTo(c, -c, r, 0); g.quadraticCurveTo(c, c, 0, r); g.quadraticCurveTo(-c, c, -r, 0); g.quadraticCurveTo(-c, -c, 0, -r); g.fill();
    g.restore();
  }

  _particles(t, out) {                                    // gotas de tinta + confete cartoon nos dois impactos
    if (out > .5) return; const L = this.L, hit = this.o.hit, c = L.logo;
    this._burst(hit, c.cx, c.cy, t, 1, 30);
    this._burst(hit + .5, c.cx, c.y0 + c.lh * .22, t, .7, 16);
  }

  _burst(t0, x0, y0, t, sk, n) {
    const u = t - t0; if (u <= 0 || u > 1.6) return; const g = this.g, Z = this.L.s * sk;
    g.save(); g.globalAlpha = 1 - ss(1, 1.6, u); g.lineJoin = 'round';
    this.P.slice(0, n).forEach(q => {
      const x = x0 + Math.cos(q.a) * q.v * u * Z, y = y0 + (Math.sin(q.a) * q.v * u + 620 * u * u) * Z, r = q.r * Z * (1 - u / 1.6 * .5);
      if (q.star) {
        g.beginPath(); for (let i = 0; i < 10; i++) { const a = q.s * u + i * PI / 5 - PI / 2, rr = i % 2 ? r * .45 : r; g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } g.closePath();
        g.fillStyle = q.c; g.fill(); g.lineWidth = 2.5 * Z + .8; g.strokeStyle = '#000'; g.stroke();
      } else { g.fillStyle = '#000'; g.beginPath(); g.ellipse(x, y, r * 1.5, r * .8, Math.atan2(Math.sin(q.a) * q.v * u + 1240 * u * u, Math.cos(q.a) * q.v * u), 0, 7); g.fill(); }
    });
    g.restore();
  }

  _bar(t, out) {
    const g = this.g, b = this.L.bar, hit = this.o.hit, u = ss(.9, 1.7, t); if (u <= 0) return;
    const bt = this._beat(t), ready = this.phase === 'ready' || this.phase === 'outro', rf = ready && !this.o.reducedMotion ? Math.exp(-(t - this.tReady) * 4) : 0;
    const w = b.w, h = b.h, p = this.shown;
    g.save(); g.globalAlpha = cl(u * 3) * (1 - out);
    g.translate(b.x + (1 - ebo(u)) * this.W * .4 + ei(out) * this.W * .5, b.y + ei(out) * this.H * .2);
    const s = 1 + .06 * rf; g.translate(w / 2, h / 2); g.scale(s, s); g.translate(-w / 2, -h / 2);
    const track = () => { g.beginPath(); g.moveTo(0, h * .47); g.lineTo(w, 0); g.lineTo(w * .894, h); g.lineTo(0, h); g.closePath(); };
    track(); g.fillStyle = '#000'; g.fill();
    if (p > .002) {
      const xb = lerp(0, w * .894, p), xt = xb + w * (.061 + .045 * p);
      g.save(); track(); g.clip();
      g.beginPath(); g.moveTo(0, 0); g.lineTo(xt, 0); g.lineTo(xb, h); g.lineTo(0, h); g.closePath(); g.clip();
      g.fillStyle = '#ffdc6a'; g.fillRect(0, 0, w, h);
      g.fillStyle = 'rgba(255,160,30,.22)';                                            // listras andando
      for (let x = -h * 2 + (t * w * .12) % (h * 2); x < w; x += h * 2) { g.beginPath(); g.moveTo(x, h); g.lineTo(x + h * .7, 0); g.lineTo(x + h * 1.3, 0); g.lineTo(x + h * .6, h); g.fill(); }
      const hl = g.createLinearGradient(0, 0, 0, h); hl.addColorStop(0, 'rgba(255,255,255,.45)'); hl.addColorStop(.45, 'rgba(255,255,255,0)'); g.fillStyle = hl; g.fillRect(0, 0, w, h);
      const sx = ((t - hit) / ((60 / this.o.bpm) * 4) % 1) * (xt + h * 2) - h;           // reflexo que varre a cada 2 compassos
      g.fillStyle = 'rgba(255,255,255,.5)'; g.beginPath(); g.moveTo(sx, h); g.lineTo(sx + h * .5, 0); g.lineTo(sx + h * .9, 0); g.lineTo(sx + h * .4, h); g.fill();
      if (rf > .02) { g.fillStyle = `rgba(255,255,255,${rf * .8})`; g.fillRect(0, 0, w, h); }
      g.restore();
      const pulse = t >= hit ? Math.exp(-bt.f * 5) : 0;                                  // brilho na ponta a cada batida
      this._glint((xb + xt) / 2, h * .38, h * (1 + .9 * pulse + rf), Math.max(.25 + .75 * pulse, rf), t);
    }
    g.restore();
  }

  _text(t, out) {
    const g = this.g, T = this.L.txt, ready = this.phase === 'ready' || this.phase === 'outro';
    const str = ready ? this.o.readyText : this.o.text, base = ready ? str : str.replace(/\.+$/, ''), t0 = ready ? this.o.reducedMotion ? 0 : this.tReady : 1.3;
    g.save(); g.translate(T.cx, T.cy + ei(out) * this.H * .15); g.rotate(-.052); g.globalAlpha = 1 - out;
    g.font = `${T.size}px GoghosHand,"Comic Sans MS",cursive`; g.textBaseline = 'middle'; g.textAlign = 'center'; g.fillStyle = '#000';
    const chars = [...str], ws = chars.map(c => g.measureText(c).width), bt = this._beat(t);
    const hopIdx = Math.floor(bt.ph * 2) % 3, hopF = (bt.ph * 2) % 1;                    // um ponto pula a cada colcheia
    let x = -ws.reduce((p, q) => p + q, 0) / 2;
    chars.forEach((c, i) => {
      const u = (t - t0 - i * .045) / .35, w = ws[i];
      if (u > 0 && c !== ' ') {
        const dot = !ready && i >= base.length, hop = dot && t >= this.o.hit && (i - base.length) === hopIdx ? Math.sin(PI * hopF) * T.size * .3 : 0;
        const wig = ready ? Math.sin(t * 6 + i) * T.size * .03 : 0;
        g.save(); g.translate(x + w / 2, (1 - eo(u)) * T.size * .6 - hop + wig); g.scale(ebo(u), ebo(u)); g.rotate((1 - eo(u)) * (i % 2 ? .5 : -.5)); g.globalAlpha *= cl(u * 4); g.fillText(c, 0, 0); g.restore();
      }
      x += w;
    });
    g.restore();
  }

  _version(t, out) {
    const g = this.g, V = this.L.ver, a = ss(1.6, 2.0, t) * (1 - out); if (a <= 0) return;
    g.save(); g.globalAlpha = a; g.font = `${V.size}px GoghosHand,"Comic Sans MS",cursive`; g.textAlign = 'right'; g.textBaseline = 'middle'; g.fillStyle = '#000'; g.fillText(this.o.version, V.x, V.y); g.restore();
  }

  /* ---------------------------------------------------------------- efeitos sonoros (opcionais, bem baixos) */

  _sfxInit() {
    const A = root.AudioContext || root.webkitAudioContext; if (!A || !this.o.sfx) return;
    let ax; try { ax = this.ax = new A(); } catch { return; }
    this.sg = ax.createGain(); this.sg.gain.value = cl(this.o.sfxVolume); this.sg.connect(ax.destination);
    const nb = this.nb = ax.createBuffer(1, ax.sampleRate, ax.sampleRate), d = nb.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    ax.resume()?.catch?.(() => {});
  }
  _tone(f, t, d, type, v, f2) {
    const ax = this.ax, o = ax.createOscillator(), g = ax.createGain(); o.type = type; o.frequency.setValueAtTime(f, t); if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + d);
    g.gain.setValueAtTime(1e-4, t); g.gain.exponentialRampToValueAtTime(v, t + .01); g.gain.exponentialRampToValueAtTime(1e-4, t + d); o.connect(g); g.connect(this.sg); o.start(t); o.stop(t + d + .05);
  }
  _noise(t, d, f1, f2, v) {
    const ax = this.ax, s = ax.createBufferSource(), f = ax.createBiquadFilter(), g = ax.createGain(); s.buffer = this.nb; s.loop = true; f.type = 'bandpass'; f.Q.value = 1;
    f.frequency.setValueAtTime(f1, t); f.frequency.exponentialRampToValueAtTime(f2, t + d); g.gain.setValueAtTime(1e-4, t); g.gain.exponentialRampToValueAtTime(v, t + d * .6); g.gain.exponentialRampToValueAtTime(1e-4, t + d);
    s.connect(f); f.connect(g); g.connect(this.sg); s.start(t); s.stop(t + d + .05);
  }
  _sfxStart() {                                           // sobe a tensão no silêncio inicial da música e "pop" no pouso do GOGHOS
    if (!this.ax || this._sfxStarted) return; this._sfxStarted = true; const b = this.ax.currentTime + .03, h = this.o.hit;
    this._noise(b + .1, h - .15, 200, 5200, .18); this._tone(110, b + .1, h - .15, 'sine', .08, 900);
    const l = b + h + .5; this._tone(240, l, .3, 'sine', .35, 70); [2093, 2637, 3136].forEach((f, i) => this._tone(f, l + .03 + i * .05, .4, 'sine', .05));
  }
  _ding() { if (!this.ax) return; const n = this.ax.currentTime; [1568, 2093, 2637].forEach((f, i) => this._tone(f, n + i * .07, .8, 'sine', .12)); }
  _whoosh() { if (!this.ax) return; const n = this.ax.currentTime; this._noise(n, .8, 400, 5000, .3); }
}

root.GOGHOS = root.GOGHOS || {};
root.GOGHOS.LoadingScreen = LoadingScreen;
if (typeof module !== 'undefined') module.exports = LoadingScreen;
})(typeof window !== 'undefined' ? window : this);
