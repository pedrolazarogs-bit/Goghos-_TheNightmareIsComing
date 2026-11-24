/*!
 * ZzusFX v1.0 — efeitos visuais e sonoros do Z-ZUS (GOGHOS: The Nightmare Is Coming)
 * Sem dependências. Animação em <canvas> + Web Animations API, sons sintetizados com WebAudio
 * (nenhum arquivo de áudio ou imagem externo é necessário).
 *
 * Uso rápido:
 *   <script src="zzus-fx.js"> (tag script comum; ou cole este arquivo inteiro dentro de uma tag script)
 *   document.addEventListener('pointerdown', () => ZzusFX.unlock(), { once: true });
 *
 *   await ZzusFX.pebble(cartaZzus, cartaAlvo, { damage: 190 });   // ataque Pedrinha
 *   const heroi = await ZzusFX.hero.bind(cartaZzus, cartaAliado); // passiva Meu Herói
 *   await heroi.protect(120);                                     // dano do aliado vai para o Z-ZUS
 *   await ZzusFX.damage(cartaZzus, 190);                          // Z-ZUS recebe dano
 *   await ZzusFX.death(cartaZzus);                                // desaba e a proteção acaba
 *
 * Todos os métodos aceitam um Element, um seletor CSS ou {x, y, w, h} (coordenadas da viewport)
 * e retornam uma Promise que resolve quando a animação termina.
 */
(function (global) {
  'use strict';

  // ---------------------------------------------------------------------------
  // Paleta (tirada da arte do Z-ZUS)
  // ---------------------------------------------------------------------------
  const C = {
    stone: '#5a5a68',
    stoneDark: '#2b2b35',
    stoneLight: '#8a8a99',
    violet: '#a56bff',
    glow: '#c9a2ff',
    lav: '#e3d4ff',
    green: '#7fdc9a',
    pink: '#ff8fb5',
    red: '#ff3b5c',
    gold: '#ffd98a',
    goldDark: '#c98f4a',
    cream: '#fff7dc'
  };

  const state = {
    volume: 0.8,
    muted: false,
    reduceMotion: false,
    zIndex: 9999,
    ctx: null,
    master: null,
    verb: null,
    canvas: null,
    g: null,
    items: [],
    raf: 0,
    last: 0,
    w: 0,
    h: 0,
    dpr: 1
  };

  const rand = (a, b) => a + Math.random() * (b - a);
  const pick = (arr) => arr[(Math.random() * arr.length) | 0];
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const easeOut = (t) => 1 - Math.pow(1 - t, 3);
  const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));

  // ---------------------------------------------------------------------------
  // Áudio — motor mínimo com WebAudio
  // ---------------------------------------------------------------------------
  function makeReverb(ctx, seconds, decay) {
    const len = Math.floor(ctx.sampleRate * seconds);
    const buf = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const d = buf.getChannelData(ch);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
    }
    const conv = ctx.createConvolver();
    conv.buffer = buf;
    return conv;
  }

  function audio() {
    if (state.muted) return null;
    if (!state.ctx) {
      const AC = global.AudioContext || global.webkitAudioContext;
      if (!AC) return null;
      const ctx = new AC();
      const master = ctx.createGain();
      master.gain.value = state.volume;
      // limitador suave (tanh): segura picos sem engolir os golpes curtos
      // (o DynamicsCompressor do navegador atenuava demais os transientes)
      const lim = ctx.createWaveShaper();
      const curve = new Float32Array(2048);
      for (let i = 0; i < curve.length; i++) curve[i] = Math.tanh((i / (curve.length - 1)) * 2 - 1);
      lim.curve = curve;
      lim.oversample = '2x';
      master.connect(lim);
      lim.connect(ctx.destination);
      const verb = makeReverb(ctx, 1.8, 2.6);
      const verbGain = ctx.createGain();
      verbGain.gain.value = 0.28;
      verb.connect(verbGain);
      verbGain.connect(master);
      state.ctx = ctx;
      state.master = master;
      state.verb = verb;
    }
    if (state.ctx.state === 'suspended') state.ctx.resume();
    return state.ctx;
  }

  let noiseBuf = null;
  function noiseBuffer(ctx) {
    if (noiseBuf && noiseBuf.sampleRate === ctx.sampleRate) return noiseBuf;
    const len = ctx.sampleRate * 2;
    noiseBuf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    return noiseBuf;
  }

  // Liga um nó ao master (e opcionalmente ao reverb)
  function out(ctx, node, wet) {
    node.connect(state.master);
    if (wet) {
      const send = ctx.createGain();
      send.gain.value = wet;
      node.connect(send);
      send.connect(state.verb);
    }
  }

  /**
   * Tom com envelope.  o = { type, f0, f1, t, dur, gain, attack, detune, wet, lp }
   * f0 -> f1 faz um glissando exponencial durante a duração.
   */
  function tone(ctx, o) {
    const t0 = ctx.currentTime + (o.t || 0);
    const dur = o.dur || 0.3;
    const osc = ctx.createOscillator();
    osc.type = o.type || 'sine';
    osc.frequency.setValueAtTime(o.f0, t0);
    if (o.f1) osc.frequency.exponentialRampToValueAtTime(Math.max(1, o.f1), t0 + dur);
    if (o.detune) osc.detune.value = o.detune;
    const g = ctx.createGain();
    const peak = o.gain == null ? 0.3 : o.gain;
    const atk = o.attack == null ? 0.005 : o.attack;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(peak, t0 + atk);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    let node = osc;
    if (o.lp) {
      const f = ctx.createBiquadFilter();
      f.type = 'lowpass';
      f.frequency.value = o.lp;
      osc.connect(f);
      node = f;
    }
    node.connect(g);
    out(ctx, g, o.wet);
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
    return osc;
  }

  /**
   * Ruído filtrado com varredura.  o = { t, dur, gain, attack, type, f0, f1, q, wet }
   */
  function noise(ctx, o) {
    const t0 = ctx.currentTime + (o.t || 0);
    const dur = o.dur || 0.3;
    const src = ctx.createBufferSource();
    src.buffer = noiseBuffer(ctx);
    src.loop = true;
    const f = ctx.createBiquadFilter();
    f.type = o.type || 'bandpass';
    f.Q.value = o.q == null ? 1 : o.q;
    f.frequency.setValueAtTime(o.f0 || 1000, t0);
    if (o.f1) f.frequency.exponentialRampToValueAtTime(Math.max(20, o.f1), t0 + dur);
    const g = ctx.createGain();
    const peak = o.gain == null ? 0.3 : o.gain;
    const atk = o.attack == null ? 0.005 : o.attack;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(peak, t0 + atk);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(f);
    f.connect(g);
    out(ctx, g, o.wet);
    src.start(t0, Math.random());
    src.stop(t0 + dur + 0.05);
    return src;
  }

  /** Som metálico (escudo): parciais inarmônicos com decaimento rápido. */
  function metal(ctx, f, o) {
    o = o || {};
    [1, 2.76, 5.4, 8.93].forEach((m, i) => {
      tone(ctx, { type: i % 2 ? 'sine' : 'triangle', f0: f * m, f1: f * m * 0.995, t: o.t || 0, dur: (o.dur || 0.7) / (1 + i * 0.7),
        gain: (o.gain || 0.4) / (1 + i * 0.9), attack: 0.001, wet: o.wet == null ? 0.35 : o.wet });
    });
  }

  const A = { tone, noise, audio, metal };

  // ---------------------------------------------------------------------------
  // Efeitos sonoros (síntese pura — nada para baixar)
  // Graves e secos: o Z-ZUS é uma rocha enorme, então tudo tem peso.
  // ---------------------------------------------------------------------------
  function gravel(c, n, t0, span, gain) { // pedregulho caindo: vários estalos curtos
    for (let i = 0; i < n; i++) {
      const t = t0 + Math.random() * span;
      noise(c, { type: 'bandpass', f0: rand(700, 2800), f1: rand(300, 900), q: 3, dur: rand(0.04, 0.1), gain: gain * rand(0.5, 1), attack: 0.001, t });
      tone(c, { type: 'sine', f0: rand(160, 420), f1: 70, dur: 0.07, gain: gain * 0.35, attack: 0.001, t });
    }
  }

  const SFX = {
    // Preparar o arremesso: esforço grave + deslocamento de ar
    windup() {
      const c = audio(); if (!c) return;
      tone(c, { type: 'sine', f0: 150, f1: 85, dur: 0.3, gain: 0.3, attack: 0.05, wet: 0.2 });
      noise(c, { type: 'bandpass', f0: 250, f1: 900, q: 1, dur: 0.3, gain: 0.6, attack: 0.08 });
      noise(c, { type: 'lowpass', f0: 500, f1: 150, q: 0.7, dur: 0.18, gain: 0.35, attack: 0.002, t: 0.4 }); // pisada
    },

    // A pedrinha cortando o ar
    throwPebble() {
      const c = audio(); if (!c) return;
      noise(c, { type: 'bandpass', f0: 900, f1: 3400, q: 1.3, dur: 0.24, gain: 1.3, attack: 0.03 });
      tone(c, { type: 'sine', f0: 520, f1: 980, dur: 0.22, gain: 0.1, attack: 0.04, wet: 0.2 });
    },

    // Pedra batendo no alvo (scale 0.3–1.5 conforme o dano)
    pebbleImpact(scale = 1) {
      const c = audio(); if (!c) return;
      const s = clamp(scale, 0.3, 1.5);
      tone(c, { type: 'sine', f0: 150, f1: 45, dur: 0.26, gain: 0.7 * s, attack: 0.002 });
      noise(c, { type: 'bandpass', f0: 1700, f1: 500, q: 0.9, dur: 0.12, gain: 0.9 * s, attack: 0.001 });
      noise(c, { type: 'highpass', f0: 3500, f1: 2500, q: 0.7, dur: 0.06, gain: 0.3 * s, attack: 0.001 });
      tone(c, { type: 'triangle', f0: 950, f1: 300, dur: 0.09, gain: 0.12 * s, attack: 0.001 });
      gravel(c, 6, 0.04, 0.3, 0.22 * s);
    },

    // Z-ZUS recebendo dano: golpe pesado, estalo de rocha e cascalho
    stoneHit(scale = 1) {
      const c = audio(); if (!c) return;
      const s = clamp(scale, 0.3, 1.5);
      tone(c, { type: 'sine', f0: 115, f1: 32, dur: 0.42, gain: 0.85 * s, attack: 0.002, wet: 0.15 });
      noise(c, { type: 'lowpass', f0: 1900, f1: 120, q: 0.8, dur: 0.32, gain: 0.7 * s, attack: 0.001 });
      noise(c, { type: 'bandpass', f0: 2600, f1: 900, q: 1.1, dur: 0.09, gain: 0.8 * s, attack: 0.001 }); // estalo
      tone(c, { type: 'triangle', f0: 340, f1: 110, dur: 0.12, gain: 0.14 * s, attack: 0.001 });
      gravel(c, 9, 0.05, 0.45, 0.24 * s);
    },

    // Meu Herói: pedra antiga despertando, cristal que ressoa, escudo que fecha
    bind() {
      const c = audio(); if (!c) return;
      tone(c, { type: 'triangle', f0: 110, f1: 110.6, dur: 1.7, gain: 0.2, attack: 0.6, wet: 0.5 });
      tone(c, { type: 'sine', f0: 165, f1: 165.5, dur: 1.7, gain: 0.14, attack: 0.7, wet: 0.5 });
      tone(c, { type: 'sine', f0: 220, f1: 220.8, dur: 1.7, gain: 0.1, attack: 0.8, wet: 0.5 });
      noise(c, { type: 'lowpass', f0: 320, f1: 110, q: 0.8, dur: 1.1, gain: 0.5, attack: 0.3, wet: 0.2 }); // rumor de pedra
      [660, 990, 1320, 1980].forEach((f, i) => {
        tone(c, { type: 'sine', f0: f, f1: f * 1.002, dur: 1.3, gain: 0.09, attack: 0.01, t: 0.2 + i * 0.12, wet: 1 });
      });
    },

    // O fio de proteção se estendendo até o aliado
    tether() {
      const c = audio(); if (!c) return;
      noise(c, { type: 'bandpass', f0: 800, f1: 2800, q: 5, dur: 0.7, gain: 0.85, attack: 0.25, wet: 0.5 });
      tone(c, { type: 'sine', f0: 440, f1: 880, dur: 0.7, gain: 0.08, attack: 0.25, wet: 0.5 });
    },

    // Escudo fechando / bloqueando
    shieldClang() {
      const c = audio(); if (!c) return;
      A.metal(c, 520, { dur: 0.9, gain: 0.5 });
      noise(c, { type: 'bandpass', f0: 4200, f1: 2000, q: 1.5, dur: 0.06, gain: 0.5, attack: 0.001 });
      tone(c, { type: 'sine', f0: 130, f1: 60, dur: 0.2, gain: 0.3, attack: 0.002 });
    },

    // O dano do aliado sendo puxado pelo fio até o Z-ZUS
    redirect() {
      const c = audio(); if (!c) return;
      noise(c, { type: 'bandpass', f0: 2800, f1: 500, q: 2, dur: 0.36, gain: 0.8, attack: 0.01, wet: 0.3 });
      tone(c, { type: 'sawtooth', f0: 700, f1: 120, dur: 0.36, gain: 0.14, attack: 0.01, lp: 1500 });
    },

    // Desabamento: rachaduras, estrondo, rochas caindo, queda final e cristal estilhaçando
    crumble() {
      const c = audio(); if (!c) return;
      [0, 0.13, 0.31, 0.52].forEach((t, i) => {
        noise(c, { type: 'bandpass', f0: 3000 - i * 300, f1: 1200, q: 2, dur: 0.07, gain: 0.9, attack: 0.001, t });
        tone(c, { type: 'sine', f0: 200, f1: 60, dur: 0.12, gain: 0.35, attack: 0.001, t });
      });
      noise(c, { type: 'lowpass', f0: 700, f1: 60, q: 0.7, dur: 1.9, gain: 0.9, attack: 0.15, t: 0.3, wet: 0.4 });
      tone(c, { type: 'sine', f0: 70, f1: 28, dur: 1.9, gain: 0.5, attack: 0.2, t: 0.3 });
      gravel(c, 22, 0.8, 1.2, 0.3);
      for (let i = 0; i < 8; i++) { // cristal do peito estilhaçando
        tone(c, { type: 'triangle', f0: rand(2500, 5000), f1: rand(1200, 2400), dur: rand(0.1, 0.28), gain: 0.07, attack: 0.001, t: 0.78 + i * 0.03, wet: 0.7 });
      }
      tone(c, { type: 'sine', f0: 85, f1: 24, dur: 0.9, gain: 0.9, attack: 0.005, t: 2.0, wet: 0.3 });
      noise(c, { type: 'lowpass', f0: 900, f1: 80, q: 0.7, dur: 0.6, gain: 0.7, attack: 0.005, t: 2.0, wet: 0.5 });
    },

    // O vínculo se rompendo: fio que estala, escudo que se estilhaça, nota triste
    bondBreak() {
      const c = audio(); if (!c) return;
      tone(c, { type: 'sawtooth', f0: 600, f1: 70, dur: 0.3, gain: 0.25, attack: 0.002, lp: 2500 });
      noise(c, { type: 'bandpass', f0: 5000, f1: 1500, q: 1.2, dur: 0.14, gain: 0.8, attack: 0.001 });
      for (let i = 0; i < 8; i++) {
        tone(c, { type: 'triangle', f0: rand(2000, 5200), f1: rand(1000, 2200), dur: rand(0.1, 0.25), gain: 0.08, attack: 0.001, t: 0.05 + i * 0.04, wet: 0.6 });
      }
      tone(c, { type: 'sine', f0: 330, f1: 165, dur: 1.1, gain: 0.14, attack: 0.05, t: 0.15, wet: 0.7 });
    }
  };

  // ---------------------------------------------------------------------------
  // Motor visual: um único <canvas> fixo cobrindo a tela + camada DOM para textos
  // ---------------------------------------------------------------------------
  function ensureLayers() {
    if (state.canvas) return;
    const cv = document.createElement('canvas');
    cv.setAttribute('data-zzus-fx', 'canvas');
    cv.style.cssText = 'position:fixed;left:0;top:0;width:100%;height:100%;pointer-events:none;z-index:' + state.zIndex;
    document.body.appendChild(cv);
    const dom = document.createElement('div');
    dom.setAttribute('data-zzus-fx', 'dom');
    dom.style.cssText = 'position:fixed;left:0;top:0;width:100%;height:100%;pointer-events:none;overflow:hidden;z-index:' + (state.zIndex + 1);
    document.body.appendChild(dom);
    state.canvas = cv;
    state.dom = dom;
    state.g = cv.getContext('2d');
    resize();
    global.addEventListener('resize', resize);
  }

  function resize() {
    if (!state.canvas) return;
    state.dpr = Math.min(global.devicePixelRatio || 1, 2);
    state.w = global.innerWidth;
    state.h = global.innerHeight;
    state.canvas.width = Math.round(state.w * state.dpr);
    state.canvas.height = Math.round(state.h * state.dpr);
  }

  /**
   * Registra um item animado.
   * item = { dur (s, ou Infinity), update?(dt), draw(g), onEnd?() }
   * Devolve uma Promise que resolve quando o item termina; item.stop() encerra antes.
   */
  function addItem(item) {
    ensureLayers();
    item.t = 0;
    item.dead = false;
    const p = new Promise((res) => { item._res = res; });
    item.stop = () => { item.dead = true; };
    state.items.push(item);
    if (!state.raf) {
      state.last = performance.now();
      state.raf = requestAnimationFrame(frame);
    }
    return p;
  }

  function frame(now) {
    const dt = Math.min(0.05, (now - state.last) / 1000);
    state.last = now;
    const g = state.g;
    g.setTransform(state.dpr, 0, 0, state.dpr, 0, 0);
    g.clearRect(0, 0, state.w, state.h);
    const alive = [];
    for (const it of state.items) {
      it.t += dt;
      if (it.update) it.update(dt);
      g.save();
      it.draw(g);
      g.restore();
      if (it.dead || it.t >= it.dur) {
        if (it.onEnd) it.onEnd();
        it._res();
      } else {
        alive.push(it);
      }
    }
    state.items = alive;
    state.raf = alive.length ? requestAnimationFrame(frame) : 0;
    if (!alive.length) g.clearRect(0, 0, state.w, state.h);
  }

  // ---------------------------------------------------------------------------
  // Utilitários
  // ---------------------------------------------------------------------------
  /** Aceita Element, seletor CSS ou {x,y,w,h} (canto superior esquerdo, px da viewport). */
  function rectOf(t) {
    if (typeof t === 'string') { const q = document.querySelector(t); if (!q) console.warn('ZzusFX: elemento não encontrado:', t); t = q; }
    if (t && t.getBoundingClientRect) {
      const r = t.getBoundingClientRect();
      return { x: r.left, y: r.top, w: r.width, h: r.height, cx: r.left + r.width / 2, cy: r.top + r.height / 2, el: t };
    }
    if (t && typeof t === 'object') {
      const w = t.w || 0, h = t.h || 0;
      return { x: t.x, y: t.y, w, h, cx: t.x + w / 2, cy: t.y + h / 2, el: null };
    }
    const w = 160, h = 220;
    return { x: state.w / 2 - w / 2, y: state.h / 2 - h / 2, w, h, cx: (state.w || global.innerWidth) / 2, cy: (state.h || global.innerHeight) / 2, el: null };
  }

  let epoch = 0;
  const animations = new Set();
  function animate(el, frames, opts) {
    if (!el || !el.animate) return Promise.resolve();
    const a = el.animate(frames, Object.assign({ fill: 'none' }, opts));
    animations.add(a);
    return a.finished.catch(() => {}).finally(() => animations.delete(a));
  }

  /** Texto flutuante (dano, cura, "-1 VEL"…) */
  function floatText(r, text, o) {
    ensureLayers();
    o = o || {};
    const el = document.createElement('div');
    el.textContent = text;
    const size = o.size || 44;
    el.style.cssText = 'position:absolute;left:' + (r.cx + (o.dx || 0)) + 'px;top:' + (r.cy + (o.dy || 0)) +
      'px;transform:translate(-50%,-50%);font:900 ' + size + 'px/1 "Trebuchet MS","Arial Black",Impact,sans-serif;' +
      'color:' + (o.color || '#fff') + ';letter-spacing:1px;white-space:nowrap;' +
      '-webkit-text-stroke:' + Math.max(3, size / 9) + 'px ' + (o.stroke || '#1a0f3a') + ';paint-order:stroke fill;' +
      'text-shadow:0 4px 0 ' + (o.stroke || '#1a0f3a') + ',0 0 18px ' + (o.glow || o.color || '#fff') + ';will-change:transform,opacity';
    state.dom.appendChild(el);
    const rise = o.rise == null ? 70 : o.rise;
    return animate(el, [
      { transform: 'translate(-50%,-50%) scale(.3)', opacity: 0 },
      { transform: 'translate(-50%,-50%) scale(1.35)', opacity: 1, offset: 0.18 },
      { transform: 'translate(-50%,-' + (50 + rise * 0.35) + 'px) scale(1)', opacity: 1, offset: 0.6 },
      { transform: 'translate(-50%,calc(-50% - ' + rise + 'px)) scale(.95)', opacity: 0 }
    ], { duration: o.dur || 1100, easing: 'cubic-bezier(.2,.8,.3,1)' }).then(() => el.remove());
  }

  /** Tremor de carta (WAAPI). */
  function shake(el, power, ms) {
    if (!el || state.reduceMotion) return Promise.resolve();
    power = power || 10;
    const f = [];
    const n = 10;
    for (let i = 0; i <= n; i++) {
      const k = 1 - i / n;
      // propriedades individuais (translate/rotate): não sobrescrevem o transform da sua carta
      f.push(i === n ? { translate: '0px 0px', rotate: '0deg' } :
        { translate: rand(-power, power) * k + 'px ' + rand(-power, power) * k * 0.6 + 'px', rotate: rand(-3, 3) * k + 'deg' });
    }
    return animate(el, f, { duration: ms || 380, easing: 'linear' });
  }

  /** Clarão colorido por cima da carta (brightness + drop-shadow). */
  function flash(el, color, ms) {
    if (!el) return Promise.resolve();
    return animate(el, [
      { filter: 'brightness(1)' },
      { filter: 'brightness(2.4) saturate(1.4) drop-shadow(0 0 14px ' + color + ')', offset: 0.18 },
      { filter: 'brightness(1)' }
    ], { duration: ms || 320, easing: 'ease-out' });
  }

  /** Cobre a tela inteira com uma cor que some (hit-stop visual). */
  function screenFlash(color, alpha, ms) {
    ensureLayers();
    const el = document.createElement('div');
    el.style.cssText = 'position:absolute;left:0;top:0;width:100%;height:100%;background:' + color;
    state.dom.appendChild(el);
    return animate(el, [{ opacity: state.reduceMotion ? alpha * 0.4 : alpha }, { opacity: 0 }], { duration: ms || 260, easing: 'ease-out' })
      .then(() => el.remove());
  }

  // ---------------------------------------------------------------------------
  // Desenho de formas
  // ---------------------------------------------------------------------------
  function starPath(g, x, y, r, rot, inner) {
    const ir = r * (inner || 0.5);
    g.beginPath();
    for (let i = 0; i < 10; i++) {
      const a = rot + (i * Math.PI) / 5 - Math.PI / 2;
      const rr = i % 2 ? ir : r;
      const px = x + Math.cos(a) * rr, py = y + Math.sin(a) * rr;
      i ? g.lineTo(px, py) : g.moveTo(px, py);
    }
    g.closePath();
  }

  function sparkPath(g, x, y, r, rot) { // brilho de 4 pontas
    g.beginPath();
    for (let i = 0; i < 8; i++) {
      const a = rot + (i * Math.PI) / 4;
      const rr = i % 2 ? r * 0.22 : r;
      const px = x + Math.cos(a) * rr, py = y + Math.sin(a) * rr;
      i ? g.lineTo(px, py) : g.moveTo(px, py);
    }
    g.closePath();
  }

  // ---------------------------------------------------------------------------
  // Partículas (pedra, poeira, fagulhas) — cada partícula escolhe seu modo de mistura
  // ---------------------------------------------------------------------------
  function chipPoly() { // polígono irregular = pedaço de rocha
    const n = 5 + ((Math.random() * 3) | 0), pts = [];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * 6.2832 + rand(-0.3, 0.3), r = rand(0.55, 1);
      pts.push([Math.cos(a) * r, Math.sin(a) * r * 0.8]);
    }
    return pts;
  }

  function drawChip(g, x, y, s, rot, pts, fill, edge) {
    g.save(); g.translate(x, y); g.rotate(rot);
    g.beginPath();
    pts.forEach((p, i) => (i ? g.lineTo(p[0] * s, p[1] * s) : g.moveTo(p[0] * s, p[1] * s)));
    g.closePath();
    g.fillStyle = fill; g.fill();
    g.lineWidth = Math.max(1, s * 0.2); g.lineJoin = 'round'; g.strokeStyle = edge || '#17131f'; g.stroke();
    g.restore();
  }

  function particleSystem(list, o) {
    o = o || {};
    return {
      dur: o.dur || 2,
      update(dt) {
        for (const p of list) {
          p.age = (p.age || 0) + dt;
          if (p.age < (p.delay || 0)) continue;
          const d = Math.pow(p.drag == null ? 0.96 : p.drag, dt * 60);
          p.vx *= d; p.vy *= d;
          p.vy += (p.g || 0) * dt;
          p.x += p.vx * dt; p.y += p.vy * dt;
          if (p.floor != null && p.y > p.floor) { // quica no chão e assenta
            p.y = p.floor; p.vy *= -(p.bounce == null ? 0.3 : p.bounce); p.vx *= 0.7;
            if (Math.abs(p.vy) < 25) { p.vy = 0; p.g = 0; p.spin = 0; p.vx = 0; }
          }
          if (p.spin) p.rot = (p.rot || 0) + p.spin * dt;
        }
      },
      draw(g) {
        for (const p of list) {
          const a = p.age - (p.delay || 0);
          if (a < 0 || a > p.life) continue;
          const k = a / p.life;
          const fadeK = p.fadeFrom ? (k < p.fadeFrom ? 1 : 1 - (k - p.fadeFrom) / (1 - p.fadeFrom)) : 1 - k;
          g.globalAlpha = clamp((p.fade === false ? 1 : fadeK) * (p.alpha == null ? 1 : p.alpha), 0, 1);
          const s = p.grow ? p.size * (1 + k * p.grow) : p.size * (p.shrink === false ? 1 : 1 - k * 0.7);
          g.globalCompositeOperation = p.add === false ? 'source-over' : 'lighter';
          g.fillStyle = p.color;
          if (p.shape === 'chip') drawChip(g, p.x, p.y, s, p.rot || 0, p.poly, p.color, p.edge);
          else if (p.shape === 'star') { starPath(g, p.x, p.y, s, p.rot || 0); g.fill(); }
          else if (p.shape === 'spark') { sparkPath(g, p.x, p.y, s, p.rot || 0); g.fill(); }
          else if (p.shape === 'shard') {
            g.save(); g.translate(p.x, p.y); g.rotate(p.rot || 0);
            g.beginPath(); g.moveTo(-s, 0); g.lineTo(0, -s * 0.35); g.lineTo(s, 0); g.lineTo(0, s * 0.35); g.closePath(); g.fill();
            g.restore();
          } else { g.beginPath(); g.arc(p.x, p.y, Math.max(0.1, s), 0, 6.2832); g.fill(); }
        }
      }
    };
  }

  function burst(x, y, n, o) {
    const list = [];
    for (let i = 0; i < n; i++) {
      const a = o.angle == null ? rand(0, 6.2832) : o.angle + rand(-o.spread, o.spread);
      const sp = rand(o.min || 80, o.max || 380);
      const shape = pick(o.shapes || ['dot']);
      list.push({
        x: x + rand(-(o.jitter || 0), o.jitter || 0), y: y + rand(-(o.jitter || 0), o.jitter || 0),
        vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, g: o.gravity || 0, drag: o.drag,
        life: rand(o.lifeMin || 0.35, o.lifeMax || 0.9), size: rand(o.sizeMin || 3, o.sizeMax || 8),
        color: pick(o.colors || [C.glow, C.violet, C.cream]), shape,
        poly: shape === 'chip' ? chipPoly() : null, edge: o.edge,
        add: o.add, grow: o.grow, shrink: o.shrink, alpha: o.alpha, fadeFrom: o.fadeFrom, floor: o.floor, bounce: o.bounce,
        rot: rand(0, 6.28), spin: rand(-8, 8), delay: o.delay || 0
      });
    }
    return list;
  }

  // ---------------------------------------------------------------------------
  // Desenhos reutilizados: escudo, lua, estrela-coração (ícone da passiva), rachaduras
  // ---------------------------------------------------------------------------
  const STONES = ['#5a5a68', '#3d3d49', '#8a8a99', '#2b2b35'];
  const DUST = ['#b9b0c4', '#9c94a8', '#cfc7d8'];

  function easeOutBack(x) { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); }

  function bez(p0, c, p1, s) {
    const u = 1 - s;
    return { x: u * u * p0.x + 2 * u * s * c.x + s * s * p1.x, y: u * u * p0.y + 2 * u * s * c.y + s * s * p1.y };
  }

  function roundRectPath(g, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    g.beginPath();
    g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r);
    g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath();
  }

  function heartPath(g, x, y, s) {
    g.beginPath();
    g.moveTo(x, y + s * 0.9);
    g.bezierCurveTo(x - s * 1.3, y + s * 0.1, x - s * 0.9, y - s * 0.9, x, y - s * 0.35);
    g.bezierCurveTo(x + s * 0.9, y - s * 0.9, x + s * 1.3, y + s * 0.1, x, y + s * 0.9);
    g.closePath();
  }

  /** Ícone da passiva (estrela escura com coração dourado rachado). */
  function starHeart(g, cx, cy, R, alpha) {
    g.save(); g.globalAlpha = alpha; g.globalCompositeOperation = 'source-over'; g.translate(cx, cy);
    starPath(g, 0, 0, R, 0, 0.5);
    g.fillStyle = '#2c2438'; g.fill();
    g.lineWidth = R * 0.07; g.strokeStyle = '#c99a78'; g.lineJoin = 'round'; g.stroke();
    heartPath(g, 0, R * 0.02, R * 0.3);
    g.fillStyle = C.gold; g.fill();
    g.strokeStyle = '#2c2438'; g.lineWidth = R * 0.035; g.lineCap = 'round';
    g.beginPath(); g.moveTo(-R * 0.04, -R * 0.2); g.lineTo(R * 0.03, 0); g.lineTo(-R * 0.05, R * 0.1); g.lineTo(R * 0.02, R * 0.28); g.stroke();
    g.restore();
  }

  function shieldPath(g, s) {
    g.beginPath();
    g.moveTo(-s, -s * 0.85); g.lineTo(s, -s * 0.85); g.lineTo(s, s * 0.15);
    g.quadraticCurveTo(s, s * 0.72, 0, s * 1.08); g.quadraticCurveTo(-s, s * 0.72, -s, s * 0.15);
    g.closePath();
  }

  /** Escudo dourado com o redutor de dano (ex.: "-20%"), como na arte da carta. */
  function drawShield(g, x, y, s, alpha, text, flashK) {
    if (s <= 0.5) return;
    g.save(); g.translate(x, y); g.globalAlpha = alpha; g.globalCompositeOperation = 'source-over';
    g.shadowColor = C.violet; g.shadowBlur = 14 + 22 * (flashK || 0);
    shieldPath(g, s); g.fillStyle = C.goldDark; g.fill();
    g.shadowBlur = 0; g.lineWidth = s * 0.12; g.strokeStyle = '#3a2512'; g.lineJoin = 'round'; g.stroke();
    g.save(); g.scale(0.78, 0.78); shieldPath(g, s); g.fillStyle = '#2a2233'; g.fill(); g.restore();
    g.font = '900 ' + s * 0.62 + 'px "Trebuchet MS",Arial,sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.lineWidth = s * 0.14; g.strokeStyle = '#1a1226'; g.fillStyle = '#fff';
    g.strokeText(text, 0, -s * 0.08); g.fillText(text, 0, -s * 0.08);
    if (flashK > 0) { g.globalCompositeOperation = 'lighter'; g.globalAlpha = alpha * flashK * 0.7; shieldPath(g, s); g.fillStyle = C.gold; g.fill(); }
    g.restore();
  }

  /** Símbolo da lua da testa do Z-ZUS. */
  function moonSigil(g, x, y, r, alpha) {
    g.save(); g.globalAlpha = alpha; g.globalCompositeOperation = 'lighter';
    g.strokeStyle = C.lav; g.fillStyle = C.lav; g.lineCap = 'round'; g.shadowColor = C.violet; g.shadowBlur = 16;
    g.lineWidth = r * 0.28;
    g.beginPath(); g.arc(x, y - r * 0.1, r, Math.PI * 0.12, Math.PI * 0.88); g.stroke();
    g.beginPath(); g.arc(x, y - r * 0.2, r * 0.22, 0, 6.2832); g.fill();
    g.restore();
  }

  /** Rachaduras partindo de um ponto (o cristal do peito). */
  function makeCracks(r, ox, oy, n, len) {
    const lines = [];
    for (let i = 0; i < n; i++) {
      let a = rand(0, 6.2832), x = ox, y = oy;
      const pts = [[x, y]], segs = 5 + ((Math.random() * 4) | 0), L = len * rand(0.6, 1);
      for (let j = 0; j < segs; j++) {
        a += rand(-0.6, 0.6);
        const d = (L / segs) * rand(0.7, 1.3);
        x = clamp(x + Math.cos(a) * d, r.x, r.x + r.w); y = clamp(y + Math.sin(a) * d, r.y, r.y + r.h);
        pts.push([x, y]);
      }
      lines.push(pts);
    }
    return lines;
  }

  function drawCracks(g, lines, prog, alpha) {
    if (alpha <= 0) return;
    g.lineCap = 'round'; g.lineJoin = 'round';
    for (const pts of lines) {
      const m = pts.length - 1, total = prog * m;
      g.beginPath(); g.moveTo(pts[0][0], pts[0][1]);
      for (let j = 1; j <= m; j++) {
        if (total >= j) g.lineTo(pts[j][0], pts[j][1]);
        else if (total > j - 1) { const f = total - (j - 1); g.lineTo(lerp(pts[j - 1][0], pts[j][0], f), lerp(pts[j - 1][1], pts[j][1], f)); break; }
        else break;
      }
      g.globalCompositeOperation = 'source-over'; g.globalAlpha = alpha; g.strokeStyle = '#14101c'; g.lineWidth = 4; g.stroke();
      g.globalCompositeOperation = 'lighter'; g.globalAlpha = alpha * 0.9; g.strokeStyle = C.glow; g.lineWidth = 1.6; g.shadowColor = C.violet; g.shadowBlur = 10; g.stroke();
      g.shadowBlur = 0;
    }
  }

  function crackFlash(r, x, y, n, len) {
    const lines = makeCracks(r, x, y, n, len);
    return addItem({
      dur: 0.75,
      draw(g) {
        const k = this.t / this.dur;
        drawCracks(g, lines, easeOut(clamp(k / 0.25, 0, 1)), 1 - clamp((k - 0.35) / 0.65, 0, 1));
      }
    });
  }

  function ring(x, y, R, color, dur, w) {
    return addItem({
      dur,
      draw(g) {
        const k = easeOut(this.t / dur);
        g.globalCompositeOperation = 'lighter'; g.globalAlpha = 1 - k;
        g.lineWidth = (w || 6) * (1 - k) + 1; g.strokeStyle = color;
        g.beginPath(); g.arc(x, y, R * (0.25 + 0.75 * k), 0, 6.2832); g.stroke();
      }
    });
  }

  function dustPuffs(x, y, n, spread) {
    return addItem(particleSystem(burst(x, y, n, {
      min: 15, max: spread || 110, drag: 0.9, lifeMin: 0.5, lifeMax: 0.95, sizeMin: 9, sizeMax: 18,
      colors: DUST, shapes: ['dot'], add: false, grow: 1.6, alpha: 0.55
    }), { dur: 1.1 }));
  }

  /** Clarão suave de impacto (não apaga a arte da carta como um branco total). */
  function hitFlash(el, color, ms) {
    return animate(el, [
      { filter: 'brightness(1)' },
      { filter: 'brightness(1.45) saturate(1.2) drop-shadow(0 0 12px ' + color + ')', offset: 0.18 },
      { filter: 'brightness(1)' }
    ], { duration: ms || 280, easing: 'ease-out' });
  }

  // ---------------------------------------------------------------------------
  // Impacto de pedra: som, tremor, clarão, lascas, poeira, fagulhas do cristal e rachaduras
  // ---------------------------------------------------------------------------
  function stoneImpact(r, scale, o) {
    o = o || {};
    const x = o.x == null ? r.cx : o.x, y = o.y == null ? r.cy : o.y;
    if (o.heavy) SFX.stoneHit(scale); else SFX.pebbleImpact(scale);
    shake(r.el, 4 + 8 * scale, 200 + 260 * scale);
    hitFlash(r.el, C.violet, 280);
    addItem(particleSystem(burst(x, y, Math.round(10 + 14 * scale), {
      min: 120, max: 120 + 330 * scale, drag: 0.93, gravity: 900, lifeMin: 0.5, lifeMax: 1.0, sizeMin: 3, sizeMax: 8.5,
      colors: STONES, shapes: ['chip'], add: false, edge: '#17131f', fadeFrom: 0.6
    }), { dur: 1.2 }));
    dustPuffs(x, y, 7, 110);
    addItem(particleSystem(burst(x, y, 8, {
      min: 80, max: 240, drag: 0.93, lifeMin: 0.25, lifeMax: 0.55, sizeMin: 2, sizeMax: 5, colors: [C.glow, C.violet], shapes: ['spark', 'dot']
    }), { dur: 0.8 }));
    ring(x, y, Math.max(r.w, r.h) * (0.35 + 0.2 * scale), '#d8cfe6', 0.35, 6);
    if (scale > 0.5) crackFlash(r, x, y, Math.round(3 + 3 * scale), Math.max(r.w, r.h) * 0.45);
    if (scale > 1) screenFlash('rgba(120,90,190,.28)', 0.5, 220);
  }

  // ---------------------------------------------------------------------------
  // ATAQUE — "Pedrinha" (Pebble)
  // O Z-ZUS recua o corpo pesado, planta o pé e arremessa uma pedra em arco.
  // ---------------------------------------------------------------------------
  function heavyThrow(a, r) {
    if (!a.el || state.reduceMotion) return Promise.resolve();
    const dx = r.cx - a.cx, dy = r.cy - a.cy, L = Math.hypot(dx, dy) || 1, ux = dx / L, uy = dy / L;
    const dir = dx >= 0 ? 1 : -1;
    return animate(a.el, [
      { translate: '0px 0px', scale: '1', rotate: '0deg' },
      { translate: (-ux * 10) + 'px ' + (-uy * 10) + 'px', scale: '0.95', rotate: (-3 * dir) + 'deg', offset: 0.5 },
      { translate: (ux * 22) + 'px ' + (uy * 22) + 'px', scale: '1.05', rotate: (4 * dir) + 'deg', offset: 0.66 },
      { translate: '0px 0px', scale: '1', rotate: '0deg' }
    ], { duration: 780, easing: 'cubic-bezier(.4,0,.2,1)' });
  }

  function throwOne(a, r) {
    const dx = r.cx - a.cx, dy = r.cy - a.cy, dist = Math.hypot(dx, dy) || 1;
    const sx = a.cx + (dx / dist) * a.w * 0.35, sy = a.cy + (dy / dist) * a.h * 0.28 - a.h * 0.1;
    const tx = r.cx + rand(-r.w * 0.08, r.w * 0.08), ty = r.cy + rand(-r.h * 0.08, r.h * 0.08);
    const peak = clamp(dist * 0.28, 50, 190), T = clamp(dist / 1100, 0.3, 0.6), size = clamp(a.w * 0.085, 7, 16);
    const poly = chipPoly();
    SFX.throwPebble();
    return addItem({
      dur: T,
      draw(g) {
        const at = (k) => ({ x: lerp(sx, tx, k), y: lerp(sy, ty, k) - Math.sin(Math.PI * k) * peak });
        const k = clamp(this.t / T, 0, 1), p = at(k);
        for (let j = 1; j <= 6; j++) { // rastro de poeira
          const kk = k - j * 0.035;
          if (kk < 0) continue;
          const q = at(kk);
          g.globalCompositeOperation = 'source-over'; g.globalAlpha = 0.4 * (1 - j / 7);
          g.fillStyle = DUST[j % 3]; g.beginPath(); g.arc(q.x, q.y, size * (0.9 - j * 0.1), 0, 6.2832); g.fill();
        }
        g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1;
        g.shadowColor = C.violet; g.shadowBlur = 10;
        drawChip(g, p.x, p.y, size * 1.3, this.t * 12, poly, C.stone, '#17131f');
        g.shadowBlur = 0;
        drawChip(g, p.x - size * 0.25, p.y - size * 0.3, size * 0.5, this.t * 12, poly, C.stoneLight, 'rgba(0,0,0,0)');
      }
    });
  }

  /**
   * Ataque Pedrinha.
   * @param from  carta atacante (Element/seletor/{x,y,w,h})
   * @param to    carta alvo
   * @param o     { count = 1, damage?: número (mostra o dano ao final) }
   */
  async function pebble(from, to, o) {
    o = o || {};
    const revision = epoch;
    const a = rectOf(from), r = rectOf(to), count = o.count || 1;
    for (let i = 0; i < count; i++) {
      SFX.windup();
      heavyThrow(a, r);
      await wait(500);
      if (revision !== epoch || o.signal?.aborted) return;
      dustPuffs(a.cx, a.y + a.h * 0.95, 6, 90); // pisada
      await throwOne(a, r);
      if (o.beforeImpact && !await o.beforeImpact()) return;
      if (revision !== epoch || o.signal?.aborted) return;
      stoneImpact(rectOf(to), 0.9);
      if (o.onImpact) o.damage = o.onImpact();
      if (i < count - 1) await wait(350);
    }
    if (o.damage != null) {
      await floatText(rectOf(to), '-' + o.damage, { color: '#fff', glow: C.violet, stroke: '#1d1230', size: 56, rise: 80, dy: -r.h * 0.1 });
    } else {
      await wait(500);
    }
  }

  /** Dano recebido por qualquer carta (impacto de pedra + número). */
  function damage(target, amount) {
    const r = rectOf(target);
    const scale = clamp((amount || 100) / 220, 0.35, 1.5);
    stoneImpact(r, scale, { heavy: true });
    return floatText(r, '-' + (amount == null ? '' : amount), {
      color: '#fff', glow: C.violet, stroke: '#1d1230', size: 44 + 14 * scale, rise: 80, dy: -r.h * 0.1
    });
  }

  // ---------------------------------------------------------------------------
  // PASSIVA — "Meu Herói"
  // Z-ZUS escolhe um aliado para proteger com a própria vida. O cristal do peito
  // acende, um fio de luz liga os dois e um escudo "-20%" fecha sobre o aliado.
  // Quando o aliado seria ferido, o escudo bloqueia e o dano corre pelo fio até
  // o Z-ZUS. A proteção só acaba quando ele é derrotado (ver death()).
  // ---------------------------------------------------------------------------
  const ANCH = { crystal: { x: 0.66, y: 0.44 }, shield: { x: 0.2, y: 0.3 } };
  const pt = (r, a) => ({ x: r.x + r.w * a.x, y: r.y + r.h * a.y });

  function bondGeometry(opt) {
    const A = rectOf(opt.zzus), B = rectOf(opt.ally);
    const p0 = pt(A, opt.crystal), p1 = pt(B, opt.shield);
    const dx = p1.x - p0.x, dy = p1.y - p0.y, L = Math.hypot(dx, dy) || 1;
    const c = { x: (p0.x + p1.x) / 2 - (dy / L) * L * 0.16, y: (p0.y + p1.y) / 2 + (dx / L) * L * 0.16 - 50 };
    return { A, B, p0, p1, c, L };
  }

  /** Brilho do cristal do Z-ZUS + anéis que se expandem (início da passiva). */
  function crystalGlow(opt) {
    return addItem({
      dur: 1.8,
      draw(g) {
        const A = rectOf(opt.zzus), p = pt(A, opt.crystal), k = clamp(this.t / this.dur, 0, 1);
        const env = Math.sin(Math.PI * k);
        const R = A.w * (0.35 + 0.25 * Math.sin(this.t * 7));
        const gr = g.createRadialGradient(p.x, p.y, 0, p.x, p.y, R);
        gr.addColorStop(0, 'rgba(227,212,255,.95)'); gr.addColorStop(0.4, 'rgba(165,107,255,.55)'); gr.addColorStop(1, 'rgba(165,107,255,0)');
        g.globalCompositeOperation = 'lighter'; g.globalAlpha = env; g.fillStyle = gr;
        g.fillRect(p.x - R, p.y - R, R * 2, R * 2);
        for (let i = 0; i < 3; i++) {
          const kk = clamp((this.t - i * 0.3) / 0.9, 0, 1);
          if (kk <= 0 || kk >= 1) continue;
          g.globalAlpha = (1 - kk) * 0.8; g.lineWidth = 3; g.strokeStyle = C.glow;
          g.beginPath(); g.arc(p.x, p.y, A.w * (0.2 + 0.8 * kk), 0, 6.2832); g.stroke();
        }
      }
    });
  }

  /** Ícone da passiva (estrela com coração) surgindo sobre a carta + lua da testa. */
  function iconPop(A) {
    return addItem({
      dur: 1.4,
      draw(g) {
        const k = this.t / this.dur;
        const pop = easeOut(clamp(k * 3, 0, 1)) * (1 - clamp((k - 0.6) / 0.4, 0, 1));
        starHeart(g, A.cx, A.cy - A.h * 0.05, Math.min(A.w, A.h) * (0.16 + 0.1 * pop), pop);
        moonSigil(g, A.x + A.w * 0.63, A.y + A.h * 0.2, A.w * 0.07, pop);
      }
    });
  }

  function swell(el) {
    if (!el || state.reduceMotion) return Promise.resolve();
    return animate(el, [
      { scale: '1', filter: 'brightness(1)' },
      { scale: '1.06', filter: 'brightness(1.35) drop-shadow(0 0 14px ' + C.violet + ')', offset: 0.45 },
      { scale: '1', filter: 'brightness(1)' }
    ], { duration: 850, easing: 'ease-in-out' });
  }

  /** O vínculo em si: fio de luz, escudo e brilho no cristal. Vive até ser rompido. */
  function bondItem(opt) {
    return {
      dur: Infinity, closing: false, closeAt: 0, flash: 0,
      geom() { return bondGeometry(opt); },
      update(dt) { this.flash = Math.max(0, this.flash - dt * 2.5); },
      draw(g) {
        const t = this.t, G = this.geom();
        const outK = this.closing ? clamp((t - this.closeAt) / 0.3, 0, 1) : 0;
        if (outK >= 1) { this.dead = true; return; }
        const alpha = 1 - outK, grow = easeInOut(clamp(t / 0.7, 0, 1)), fl = this.flash;
        const pts = [], N = 36;
        for (let i = 0; i <= N; i++) pts.push(bez(G.p0, G.c, G.p1, (i / N) * grow));
        const line = (w, col, a, blur) => {
          g.beginPath(); pts.forEach((p, i) => (i ? g.lineTo(p.x, p.y) : g.moveTo(p.x, p.y)));
          g.lineWidth = w; g.strokeStyle = col; g.globalAlpha = a * alpha; g.shadowColor = col; g.shadowBlur = blur; g.stroke();
        };
        g.globalCompositeOperation = 'lighter'; g.lineCap = 'round'; g.lineJoin = 'round';
        // moldura pulsante no aliado e brilho no cristal do Z-ZUS
        g.globalAlpha = alpha * (0.25 + 0.15 * Math.sin(t * 2.6)); g.strokeStyle = C.violet; g.lineWidth = 4; g.shadowColor = C.violet; g.shadowBlur = 20;
        roundRectPath(g, G.B.x - 3, G.B.y - 3, G.B.w + 6, G.B.h + 6, 14); g.stroke();
        const R = G.A.w * 0.3, gr = g.createRadialGradient(G.p0.x, G.p0.y, 0, G.p0.x, G.p0.y, R);
        gr.addColorStop(0, 'rgba(201,162,255,.8)'); gr.addColorStop(1, 'rgba(165,107,255,0)');
        g.shadowBlur = 0; g.globalAlpha = alpha * (0.3 + 0.2 * Math.sin(t * 3)); g.fillStyle = gr; g.fillRect(G.p0.x - R, G.p0.y - R, R * 2, R * 2);
        // o fio
        line(12, C.violet, 0.25 + fl * 0.3, 18);
        line(4, C.glow, 0.85, 10);
        g.setLineDash([2, 16]); g.lineDashOffset = -t * 50; line(3, C.green, 0.9, 8); g.setLineDash([]);
        if (fl > 0) line(9, '#fff', fl * 0.8, 20);
        // pulsos de energia correndo do Z-ZUS ao aliado
        for (let i = 0; i < 3; i++) {
          const p = bez(G.p0, G.c, G.p1, ((t * 0.6 + i / 3) % 1) * grow);
          g.globalAlpha = alpha * 0.9; g.fillStyle = C.lav; g.shadowColor = C.violet; g.shadowBlur = 14;
          g.beginPath(); g.arc(p.x, p.y, 4, 0, 6.2832); g.fill();
        }
        g.shadowBlur = 0;
        // escudo sobre o aliado
        const sp = easeOutBack(clamp((t - 0.7) / 0.45, 0, 1));
        if (sp > 0) {
          const sz = clamp(G.B.w * 0.13, 16, 30);
          drawShield(g, G.p1.x, G.p1.y + Math.sin(t * 2.2) * 2.5, sz * sp * (1 + fl * 0.18), alpha, opt.text, fl);
        }
      }
    };
  }

  const hero = {
    current: null,

    /**
     * Z-ZUS escolhe o aliado que vai proteger.
     * @param zzus  carta do Z-ZUS
     * @param ally  carta do aliado
     * @param o     { reduction = 20 (texto do escudo "-20%"), crystal:{x,y}, shield:{x,y} (posições em 0–1 na carta) }
     * @returns Promise<{ protect(dano), release(), active }>  (resolve quando o escudo já fechou)
     */
    async bind(zzus, ally, o) {
      o = o || {};
      const revision = epoch;
      if (hero.current) await hero.current.release({ silent: true });
      if (revision !== epoch) return;
      const opt = {
        zzus, ally, crystal: o.crystal || ANCH.crystal, shield: o.shield || ANCH.shield,
        text: o.label ?? ('-' + (o.reduction == null ? 20 : o.reduction) + '%')
      };
      const A = rectOf(zzus), B = rectOf(ally);
      const item = bondItem(opt);
      if (!o.instant) {
        SFX.bind();
        floatText(A, 'MEU HERÓI', { color: C.gold, glow: C.violet, stroke: '#2a1a3a', size: 30, rise: 50, dy: -A.h * 0.34, dur: 1500 });
        crystalGlow(opt); iconPop(A); swell(A.el);
        await wait(600);
        if (revision !== epoch) return;
      }
      addItem(item);
      if (o.instant) item.t = 1;
      else {
        SFX.tether();
        await wait(700);
        if (revision !== epoch) return;
        SFX.shieldClang();
        const G = item.geom();
        hitFlash(B.el, C.gold, 400);
        ring(G.p1.x, G.p1.y, 70, C.gold, 0.5, 5);
        addItem(particleSystem(burst(G.p1.x, G.p1.y, 18, {
          min: 60, max: 240, drag: 0.93, lifeMin: 0.4, lifeMax: 0.9, sizeMin: 3, sizeMax: 7, colors: [C.gold, C.lav, C.green], shapes: ['star', 'spark', 'dot']
        }), { dur: 1 }));
        await wait(450);
        if (revision !== epoch) return;
      }

      let closed = false;
      const handle = {
        active: true, zzusEl: A.el, allyEl: B.el,

        /** O aliado seria ferido: o escudo bloqueia e o dano corre pelo fio até o Z-ZUS. */
        async protect(amount) {
          if (closed) return;
          const G1 = item.geom();
          // 1) o golpe chega ao aliado
          addItem(particleSystem(burst(G1.B.cx, G1.B.cy, 14, {
            min: 100, max: 320, drag: 0.92, lifeMin: 0.2, lifeMax: 0.5, sizeMin: 2.5, sizeMax: 6, colors: [C.red, '#fff', C.cream], shapes: ['spark', 'dot']
          }), { dur: 0.7 }));
          hitFlash(G1.B.el, C.red, 220); shake(G1.B.el, 4, 200);
          await wait(90);
          if (closed || revision !== epoch) return;
          // 2) o escudo segura
          item.flash = 1; SFX.shieldClang();
          ring(G1.p1.x, G1.p1.y, 80, C.gold, 0.45, 6);
          floatText(G1.B, 'PROTEGIDO', { color: C.gold, glow: C.violet, stroke: '#2a1a3a', size: 28, rise: 55, dy: -G1.B.h * 0.28, dur: 1100 });
          await wait(160);
          if (closed || revision !== epoch) return;
          // 3) o dano corre pelo fio até o Z-ZUS
          SFX.redirect();
          await addItem({
            dur: 0.4,
            draw(g2) {
              const GG = item.geom(), k = this.t / this.dur;
              g2.globalCompositeOperation = 'lighter'; g2.lineCap = 'round';
              for (let j = 0; j < 9; j++) {
                const kk = k - j * 0.03;
                if (kk < 0) continue;
                const p = bez(GG.p0, GG.c, GG.p1, 1 - easeInOut(clamp(kk, 0, 1)));
                g2.globalAlpha = (1 - j / 9) * 0.85; g2.fillStyle = j < 3 ? '#fff' : C.violet;
                g2.shadowColor = C.red; g2.shadowBlur = 16;
                g2.beginPath(); g2.arc(p.x, p.y, 9 - j * 0.8, 0, 6.2832); g2.fill();
              }
            }
          });
          // 4) o Z-ZUS recebe o golpe
          if (closed || revision !== epoch) return;
          const G2 = item.geom();
          stoneImpact(G2.A, clamp((amount || 100) / 220, 0.35, 1.5), { heavy: true, x: G2.p0.x, y: G2.p0.y });
          await floatText(G2.A, '-' + (amount == null ? '' : amount), { color: '#fff', glow: C.violet, stroke: '#1d1230', size: 50, rise: 80, dy: -G2.A.h * 0.1 });
        },

        /** Encerra a proteção (death() chama isto sozinho). */
        async release(o2) {
          if (closed) return;
          closed = true; handle.active = false;
          if (hero.current === handle) hero.current = null;
          const silent = o2 && o2.silent, G3 = item.geom();
          if (!silent) {
            SFX.bondBreak();
            const m = bez(G3.p0, G3.c, G3.p1, 0.5);
            addItem(particleSystem(burst(m.x, m.y, 26, {
              min: 80, max: 320, drag: 0.92, lifeMin: 0.3, lifeMax: 0.8, sizeMin: 2.5, sizeMax: 6, colors: [C.glow, C.lav, C.green], shapes: ['spark', 'dot']
            }), { dur: 1 }));
            addItem(particleSystem(burst(G3.p1.x, G3.p1.y, 22, { // o escudo se estilhaça
              min: 90, max: 330, gravity: 800, drag: 0.94, lifeMin: 0.5, lifeMax: 1.1, sizeMin: 5, sizeMax: 11,
              colors: [C.gold, C.goldDark, '#2a2233'], shapes: ['shard'], add: false, fadeFrom: 0.5
            }), { dur: 1.3 }));
            floatText(G3.B, 'PROTEÇÃO ENCERRADA', { color: C.lav, glow: C.violet, stroke: '#1d1230', size: 24, rise: 50, dy: -G3.B.h * 0.28, dur: 1500 });
          }
          item.closing = true; item.closeAt = item.t;
          await wait(silent ? 50 : 500);
        }
      };
      hero.current = handle;
      return handle;
    },

    /** hero.protect(120) usa o vínculo atual; hero.protect(vinculo, 120) usa um específico. */
    protect(a, b) {
      const h = typeof a === 'number' ? hero.current : a, n = typeof a === 'number' ? a : b;
      if (!h) { console.warn('ZzusFX: não há proteção ativa (use hero.bind primeiro).'); return Promise.resolve(); }
      return h.protect(n);
    },

    release(h) { const x = h || hero.current; return x ? x.release() : Promise.resolve(); },

    get active() { return !!hero.current; }
  };

  // ---------------------------------------------------------------------------
  // DERROTA — o Z-ZUS desaba
  // O cristal do peito racha e brilha, a rocha se desfaz de cima para baixo em
  // pedaços que caem e quicam no chão, pétalas da flor flutuam, e a proteção
  // sobre o aliado se quebra (é a única forma dela acabar).
  // ---------------------------------------------------------------------------
  /**
   * @param target  carta do Z-ZUS
   * @param o       { hide = true (esconde a carta no fim; restore() desfaz), bond (padrão: a proteção ativa dele) }
   */
  async function death(target, o) {
    o = o || {};
    const r = rectOf(target), el = r.el;
    const bond = o.bond || (hero.current && hero.current.zzusEl === el ? hero.current : null);
    const origin = pt(r, ANCH.crystal);
    const lines = makeCracks(r, origin.x, origin.y, 9, Math.max(r.w, r.h) * 0.8);
    const jit = [];
    for (let i = 0; i < 14; i++) jit.push(rand(0, 0.22));
    const chunks = [], puffs = [], petals = [];
    let prog = 0, burstDone = false;

    SFX.crumble();
    shake(el, 6, 1900);

    const floorY = r.y + r.h;
    const bnd = (i) => clamp(prog * 1.25 - jit[i], 0, 1);

    const item = {
      dur: 0.8 + 1.4 + 1.8,
      update(dt) {
        const t = this.t;
        prog = easeInOut(clamp((t - 0.8) / 1.3, 0, 1));
        if (t >= 0.8 && !burstDone) { // o cristal estoura e a proteção se quebra
          burstDone = true;
          addItem(particleSystem(burst(origin.x, origin.y, 30, {
            min: 120, max: 460, gravity: 500, drag: 0.94, lifeMin: 0.5, lifeMax: 1.2, sizeMin: 5, sizeMax: 12,
            colors: [C.lav, C.glow, C.violet], shapes: ['shard'], fadeFrom: 0.5
          }), { dur: 1.4 }));
          ring(origin.x, origin.y, r.w * 0.9, C.glow, 0.6, 7);
          screenFlash('rgba(201,162,255,.5)', 0.6, 350);
          for (let i = 0; i < 16; i++) { // pétalas da flor da cabeça
            petals.push({ x: r.x + r.w * rand(0.72, 0.9), y: r.y + r.h * rand(0.12, 0.24), vx: rand(-25, 25), vy: rand(10, 40),
              ph: rand(0, 6.28), rot: rand(0, 6.28), spin: rand(-3, 3), s: rand(4, 8), age: 0, life: rand(2, 3.2) });
          }
          if (bond) bond.release();
        }
        if (el && t >= 0.8) { // a rocha se desfaz de cima para baixo (borda irregular)
          if (prog >= 1) el.style.clipPath = 'inset(100% 0 0 0)'; // já desfeita por completo
          else {
            let poly = '';
            for (let i = 0; i < 14; i++) poly += (i / 13) * 100 + '% ' + bnd(i) * 100 + '%,';
            el.style.clipPath = 'polygon(' + poly + '100% 100%,0% 100%)';
          }
        }
        if (prog > 0 && prog < 1 && chunks.length < 240) { // pedaços saem da borda
          const n = Math.ceil(dt * 110 * (0.4 + prog));
          for (let k = 0; k < n; k++) {
            const i = (Math.random() * 14) | 0;
            chunks.push({
              x: r.x + (i / 13) * r.w + rand(-6, 6), y: r.y + bnd(i) * r.h, vx: rand(-70, 70), vy: rand(-30, 80),
              s: rand(4, 15), rot: rand(0, 6.28), spin: rand(-7, 7), poly: chipPoly(), col: pick(STONES),
              floor: floorY + rand(-2, 10), age: 0, life: rand(1.3, 2.1), hit: false
            });
          }
        }
        for (const c of chunks) {
          c.age += dt; c.vy += 1000 * dt; c.x += c.vx * dt; c.y += c.vy * dt; c.rot += c.spin * dt;
          if (c.y > c.floor) {
            c.y = c.floor; c.vy *= -0.32; c.vx *= 0.7;
            if (!c.hit) { c.hit = true; if (c.s > 9) puffs.push({ x: c.x, y: c.y, s: rand(10, 18), age: 0, life: 0.7 }); }
            if (Math.abs(c.vy) < 40) { c.vy = 0; c.vx = 0; c.spin = 0; }
          }
        }
        for (const p of petals) { p.age += dt; p.ph += dt * 2.2; p.x += (p.vx + Math.sin(p.ph) * 30) * dt; p.y = Math.min(floorY, p.y + p.vy * dt); p.rot += p.spin * dt; }
        for (const p of puffs) p.age += dt;
      },
      draw(g) {
        const t = this.t;
        const kc = clamp(t / 0.8, 0, 1);
        drawCracks(g, lines, easeOut(kc), t < 0.8 ? 1 : 1 - clamp((t - 0.8) / 0.5, 0, 1));
        g.globalCompositeOperation = 'source-over';
        for (const p of puffs) {
          const k = p.age / p.life;
          if (k >= 1) continue;
          g.globalAlpha = 0.5 * (1 - k); g.fillStyle = DUST[1];
          g.beginPath(); g.arc(p.x, p.y - 4, p.s * (1 + k * 1.6), 0, 6.2832); g.fill();
        }
        for (const c of chunks) {
          g.globalAlpha = c.age > c.life * 0.65 ? clamp(1 - (c.age - c.life * 0.65) / (c.life * 0.35), 0, 1) : 1;
          if (g.globalAlpha > 0) drawChip(g, c.x, c.y, c.s, c.rot, c.poly, c.col, '#17131f');
        }
        for (const p of petals) {
          const k = p.age / p.life;
          if (k >= 1) continue;
          g.globalAlpha = k > 0.7 ? 1 - (k - 0.7) / 0.3 : 1; g.fillStyle = C.pink;
          g.save(); g.translate(p.x, p.y); g.rotate(p.rot);
          g.beginPath(); g.ellipse(0, 0, p.s, p.s * 0.55, 0, 0, 6.2832); g.fill(); g.restore();
        }
      },
      onEnd() {
        if (el) { el.style.clipPath = ''; if (o.hide !== false) el.style.visibility = 'hidden'; }
      }
    };
    await addItem(item);
    await wait(250);
  }

  /** Desfaz o efeito de derrota (mostra a carta de novo). */
  function restore(target) {
    const r = rectOf(target);
    if (r.el) { r.el.style.visibility = ''; r.el.style.clipPath = ''; r.el.getAnimations().forEach((a) => a.cancel()); }
  }

  // ---------------------------------------------------------------------------
  // API pública
  // ---------------------------------------------------------------------------
  if (global.matchMedia) {
    try { state.reduceMotion = global.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { /* ignore */ }
  }

  const ZzusFX = {
    version: '1.0.0',
    colors: C,

    // ataque e dano
    pebble, damage,
    // passiva "Meu Herói": hero.bind / hero.protect / hero.release
    hero,
    // derrota (e desfazer)
    death, restore,

    // sons soltos (ZzusFX.sfx.stoneHit(), …)
    sfx: SFX,

    /** Chame uma vez dentro de um clique/toque para liberar o áudio no navegador. */
    unlock() { audio(); },
    setVolume(v) {
      state.volume = clamp(v, 0, 1);
      if (state.master && !state.muted) state.master.gain.value = state.volume;
    },
    mute(m) {
      state.muted = m !== false;
      if (state.master) state.master.gain.value = state.muted ? 0 : state.volume;
    },
    setReducedMotion(b) { state.reduceMotion = !!b; },
    /** Interrompe as animações em andamento (o vínculo ativo continua; use hero.release()). */
    clear() {
      epoch++;
      hero.current?.release({silent:true});
      cancelAnimationFrame(state.raf); state.raf = 0;
      for (const item of state.items) item._res();
      state.items.length = 0;
      for (const animation of animations) animation.cancel();
      state.dom?.replaceChildren();
      if (state.g) state.g.clearRect(0, 0, state.w, state.h);
    }
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = ZzusFX;
  global.ZzusFX = ZzusFX;
})(typeof window !== 'undefined' ? window : globalThis);
