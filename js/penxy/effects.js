/*!
 * PenxyFX v1.0 — efeitos visuais e sonoros do PENXY (GOGHOS: The Nightmare Is Coming)
 * Sem dependências. Animação em <canvas> + Web Animations API, sons sintetizados com WebAudio
 * (nenhum arquivo de áudio ou imagem externo é necessário).
 *
 * Uso rápido:
 *   <script src="penxy-fx.js"> (tag script comum; ou cole este arquivo inteiro dentro de uma tag script)
 *   PenxyFX.attack(cartaAtacante, cartaAlvo);
 *   PenxyFX.damage(cartaAlvo, 140);
 *   const mente = await PenxyFX.haunt.enter(cartaPenxy, cartaOponente);  // Assombração
 *   await mente.exit();                                                   // ao sair da mente
 *
 * Todos os métodos aceitam um Element, um seletor CSS ou {x, y, w, h} (coordenadas da viewport)
 * e retornam uma Promise que resolve quando a animação termina.
 */
(function (global) {
  'use strict';

  // ---------------------------------------------------------------------------
  // Paleta (tirada da arte do PENXY)
  // ---------------------------------------------------------------------------
  const C = {
    cyan: '#7fe6ff',
    blue: '#5a63e0',
    indigo: '#3b2f8f',
    violet: '#a06bff',
    void: '#0b0716',
    red: '#ff3b5c',
    gold: '#ffd98a',
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

  const A = { tone, noise, audio };

  // ---------------------------------------------------------------------------
  // Efeitos sonoros (síntese pura — nada para baixar)
  // ---------------------------------------------------------------------------
  const SFX = {
    // Aparição/avanço fantasmagórico do atacante
    dash() {
      const c = audio(); if (!c) return;
      noise(c, { type: 'bandpass', f0: 300, f1: 2600, q: 0.9, dur: 0.28, gain: 0.8, attack: 0.04, wet: 0.2 });
      tone(c, { type: 'sine', f0: 220, f1: 660, dur: 0.26, gain: 0.22, attack: 0.05, wet: 0.4 });
    },

    // Um corte de garra (i = 0,1,2 muda o tom para soar como golpes em sequência)
    slash(i = 0) {
      const c = audio(); if (!c) return;
      const k = 1 + i * 0.09;
      noise(c, { type: 'bandpass', f0: 5200 * k, f1: 900, q: 1.4, dur: 0.17, gain: 0.8, attack: 0.002 });
      noise(c, { type: 'highpass', f0: 3500, f1: 2000, q: 0.7, dur: 0.1, gain: 0.3, attack: 0.001 });
      tone(c, { type: 'sawtooth', f0: 1900 * k, f1: 420, dur: 0.14, gain: 0.16, attack: 0.002, lp: 5000 });
      tone(c, { type: 'triangle', f0: 3100 * k, f1: 1200, dur: 0.1, gain: 0.1, attack: 0.001, wet: 0.5 });
    },

    // Impacto — scale (0.4–1.4) conforme o dano
    hit(scale = 1) {
      const c = audio(); if (!c) return;
      const s = clamp(scale, 0.3, 1.5);
      tone(c, { type: 'sine', f0: 170, f1: 38, dur: 0.28, gain: 0.72 * s, attack: 0.002 });
      noise(c, { type: 'lowpass', f0: 2600, f1: 220, q: 0.8, dur: 0.2, gain: 0.4 * s, attack: 0.001 });
      tone(c, { type: 'square', f0: 320, f1: 90, dur: 0.1, gain: 0.08 * s, attack: 0.001, lp: 1800 });
    },

    // Entrada na mente de PENXY: suspiro sombrio que "puxa" o oponente
    hauntEnter() {
      const c = audio(); if (!c) return;
      // varredura invertida (swell) subindo
      noise(c, { type: 'bandpass', f0: 150, f1: 3200, q: 2.2, dur: 1.3, gain: 0.3, attack: 1.1, wet: 0.6 });
      // vácuo: tom grave descendo
      tone(c, { type: 'sawtooth', f0: 520, f1: 55, dur: 1.4, gain: 0.12, attack: 0.15, lp: 900, wet: 0.5 });
      tone(c, { type: 'sawtooth', f0: 523, f1: 57, dur: 1.4, gain: 0.1, attack: 0.15, lp: 900, detune: 18, wet: 0.5 });
      // sussurros (ruído "vogal")
      for (let i = 0; i < 5; i++) {
        noise(c, { type: 'bandpass', f0: rand(700, 1500), f1: rand(500, 1100), q: 7, dur: rand(0.25, 0.45),
          gain: 0.07, attack: 0.08, t: 0.15 + i * 0.2, wet: 0.8 });
      }
      // boom final
      tone(c, { type: 'sine', f0: 90, f1: 28, dur: 0.9, gain: 0.6, attack: 0.01, t: 1.25, wet: 0.3 });
      noise(c, { type: 'lowpass', f0: 1200, f1: 80, q: 0.7, dur: 0.7, gain: 0.35, attack: 0.005, t: 1.25, wet: 0.5 });
    },

    // Ambiente contínuo enquanto dentro da mente; devolve {stop()}
    hauntAmbience() {
      const c = audio(); if (!c) return { stop() {} };
      const t0 = c.currentTime;
      const g = c.createGain();
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(0.045, t0 + 1.2);
      const lp = c.createBiquadFilter();
      lp.type = 'lowpass'; lp.frequency.value = 420;
      lp.connect(g);
      out(c, g, 0.5);
      const lfo = c.createOscillator();
      const lfoGain = c.createGain();
      lfo.frequency.value = 0.18; lfoGain.gain.value = 180;
      lfo.connect(lfoGain); lfoGain.connect(lp.frequency);
      lfo.start(t0);
      const oscs = [55, 55.7, 82.4, 110.3].map((f, i) => {
        const o = c.createOscillator();
        o.type = i % 2 ? 'triangle' : 'sawtooth';
        o.frequency.value = f;
        o.connect(lp);
        o.start(t0);
        return o;
      });
      // pings de cristal distantes
      const timer = setInterval(() => {
        if (state.muted) return;
        const f = pick([1318, 1568, 1760, 2093, 2349]);
        tone(c, { type: 'sine', f0: f, f1: f * 0.985, dur: 1.4, gain: 0.025, attack: 0.01, wet: 1 });
      }, 1100);
      let stopped = false;
      return {
        stop() {
          if (stopped) return; stopped = true;
          clearInterval(timer);
          const t = c.currentTime;
          g.gain.cancelScheduledValues(t);
          g.gain.setValueAtTime(Math.max(0.0001, g.gain.value), t);
          g.gain.exponentialRampToValueAtTime(0.0001, t + 0.5);
          oscs.forEach((o) => o.stop(t + 0.6));
          lfo.stop(t + 0.6);
        }
      };
    },

    // Saída da mente: sopro invertido + estilhaço de vidro
    hauntExit() {
      const c = audio(); if (!c) return;
      noise(c, { type: 'bandpass', f0: 4200, f1: 300, q: 1.5, dur: 0.55, gain: 0.55, attack: 0.01, wet: 0.5 });
      tone(c, { type: 'sine', f0: 60, f1: 200, dur: 0.35, gain: 0.45, attack: 0.05 });
      for (let i = 0; i < 7; i++) {
        tone(c, { type: 'triangle', f0: rand(2200, 5200), f1: rand(1200, 2400), dur: rand(0.08, 0.22),
          gain: 0.045, attack: 0.001, t: 0.2 + i * 0.035, wet: 0.5 });
      }
      tone(c, { type: 'sine', f0: 140, f1: 45, dur: 0.4, gain: 0.6, attack: 0.002, t: 0.22 });
    },

    // -1 de velocidade: fita desacelerando + correntes
    slow() {
      const c = audio(); if (!c) return;
      tone(c, { type: 'sawtooth', f0: 640, f1: 90, dur: 0.85, gain: 0.25, attack: 0.01, lp: 1400, wet: 0.35 });
      tone(c, { type: 'sine', f0: 320, f1: 45, dur: 0.85, gain: 0.38, attack: 0.01 });
      for (let i = 0; i < 4; i++) {
        const f = rand(1800, 2600);
        tone(c, { type: 'square', f0: f, f1: f * 0.7, dur: 0.05, gain: 0.1, attack: 0.001, t: 0.05 + i * 0.1, lp: 4000, wet: 0.4 });
        noise(c, { type: 'bandpass', f0: 6000, f1: 3000, q: 4, dur: 0.05, gain: 0.2, attack: 0.001, t: 0.05 + i * 0.1 });
      }
    },

    // Morte "sem rastros": a carta se desfaz em poeira
    death() {
      const c = audio(); if (!c) return;
      tone(c, { type: 'sine', f0: 392, f1: 98, dur: 1.2, gain: 0.2, attack: 0.02, wet: 0.7 });
      tone(c, { type: 'triangle', f0: 466, f1: 110, dur: 1.2, gain: 0.1, attack: 0.02, detune: 12, wet: 0.7 });
      noise(c, { type: 'lowpass', f0: 3000, f1: 100, q: 0.6, dur: 1.1, gain: 0.25, attack: 0.02, wet: 0.5 });
      for (let i = 0; i < 14; i++) {
        tone(c, { type: 'sine', f0: rand(1500, 4200), f1: rand(600, 1500), dur: rand(0.08, 0.25),
          gain: 0.03, attack: 0.002, t: 0.1 + Math.random() * 1, wet: 0.7 });
      }
      tone(c, { type: 'sine', f0: 80, f1: 26, dur: 1, gain: 0.5, attack: 0.01, t: 1.05 });
    },

    // Brilho passivo da estrela (Assombração é passiva no cartão)
    shimmer() {
      const c = audio(); if (!c) return;
      [1568, 2093, 2637].forEach((f, i) => {
        tone(c, { type: 'sine', f0: f, f1: f * 1.01, dur: 0.9, gain: 0.12, attack: 0.02, t: i * 0.07, wet: 0.9 });
      });
    }
  };

  // ---------------------------------------------------------------------------
  // Motor visual: um único <canvas> fixo cobrindo a tela + camada DOM para textos
  // ---------------------------------------------------------------------------
  function ensureLayers() {
    if (state.canvas) return;
    const cv = document.createElement('canvas');
    cv.setAttribute('data-penxy-fx', 'canvas');
    cv.style.cssText = 'position:fixed;left:0;top:0;width:100%;height:100%;pointer-events:none;z-index:' + state.zIndex;
    document.body.appendChild(cv);
    const dom = document.createElement('div');
    dom.setAttribute('data-penxy-fx', 'dom');
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
    if (typeof t === 'string') t = document.querySelector(t);
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

  function animate(el, frames, opts) {
    if (!el || !el.animate) return Promise.resolve();
    const a = el.animate(frames, Object.assign({ fill: 'none' }, opts));
    return a.finished.catch(() => {});
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
  // Sistema de partículas genérico
  // ---------------------------------------------------------------------------
  function particleSystem(list, o) {
    o = o || {};
    const ps = list;
    return {
      dur: o.dur || 2,
      update(dt) {
        for (const p of ps) {
          p.age = (p.age || 0) + dt;
          if (p.age < (p.delay || 0)) continue;
          const d = Math.pow(p.drag == null ? 0.96 : p.drag, dt * 60);
          p.vx *= d; p.vy *= d;
          p.vy += (p.g || 0) * dt;
          p.x += p.vx * dt; p.y += p.vy * dt;
          if (p.spin) p.rot = (p.rot || 0) + p.spin * dt;
        }
      },
      draw(g) {
        g.globalCompositeOperation = o.additive === false ? 'source-over' : 'lighter';
        for (const p of ps) {
          const a = p.age - (p.delay || 0);
          if (a < 0 || a > p.life) continue;
          const k = a / p.life;
          const alpha = (p.fade === false ? 1 : 1 - k) * (p.alpha == null ? 1 : p.alpha);
          const s = p.size * (p.shrink === false ? 1 : 1 - k * 0.7);
          g.globalAlpha = clamp(alpha, 0, 1);
          g.fillStyle = p.color;
          if (p.shape === 'star') { starPath(g, p.x, p.y, s, p.rot || 0); g.fill(); }
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
      list.push({
        x: x + rand(-(o.jitter || 0), o.jitter || 0), y: y + rand(-(o.jitter || 0), o.jitter || 0),
        vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, g: o.gravity || 0, drag: o.drag,
        life: rand(o.lifeMin || 0.35, o.lifeMax || 0.9), size: rand(o.sizeMin || 3, o.sizeMax || 8),
        color: pick(o.colors || [C.cyan, C.violet, C.cream]), shape: pick(o.shapes || ['dot']),
        rot: rand(0, 6.28), spin: rand(-8, 8), delay: o.delay || 0
      });
    }
    return list;
  }

  // ---------------------------------------------------------------------------
  // ATAQUE — "Garra Fantasma" (Phantom Claw)
  // Investida fantasma + 2 golpes cruzados, cada um com 3 marcas de garra.
  // ---------------------------------------------------------------------------
  function bez(p0, c, p1, s) {
    const u = 1 - s;
    return { x: u * u * p0.x + 2 * u * s * c.x + s * s * p1.x, y: u * u * p0.y + 2 * u * s * c.y + s * s * p1.y };
  }

  function clawMark(m, delay) {
    return {
      dur: delay + 0.6,
      draw(g) {
        const t = this.t - delay;
        if (t < 0) return;
        const head = easeOut(clamp(t / 0.13, 0, 1));
        const tail = easeInOut(clamp((t - 0.07) / 0.34, 0, 1));
        const fade = 1 - clamp((t - 0.22) / 0.34, 0, 1);
        if (tail >= head || fade <= 0) return;
        const N = 26, L = [], R = [];
        for (let i = 0; i <= N; i++) {
          const s = lerp(tail, head, i / N);
          const p = bez(m.p0, m.c, m.p1, s);
          const q = bez(m.p0, m.c, m.p1, Math.min(1, s + 0.002));
          let tx = q.x - p.x, ty = q.y - p.y;
          const len = Math.hypot(tx, ty) || 1; tx /= len; ty /= len;
          const w = m.W * Math.pow(Math.sin((Math.PI * i) / N), 0.85);
          L.push([p.x - ty * w, p.y + tx * w]);
          R.push([p.x + ty * w, p.y - tx * w]);
        }
        const poly = (k) => {
          g.beginPath();
          for (let i = 0; i <= N; i++) {
            const c = [lerp(L[i][0], R[i][0], 0.5 - k / 2), lerp(L[i][1], R[i][1], 0.5 - k / 2)];
            i ? g.lineTo(c[0], c[1]) : g.moveTo(c[0], c[1]);
          }
          for (let i = N; i >= 0; i--) {
            const c = [lerp(L[i][0], R[i][0], 0.5 + k / 2), lerp(L[i][1], R[i][1], 0.5 + k / 2)];
            g.lineTo(c[0], c[1]);
          }
          g.closePath();
        };
        g.globalCompositeOperation = 'lighter';
        g.globalAlpha = fade;
        g.shadowColor = C.violet; g.shadowBlur = 26;
        g.fillStyle = C.blue; poly(1); g.fill();
        g.shadowBlur = 10; g.shadowColor = C.cyan;
        g.fillStyle = C.cyan; poly(0.6); g.fill();
        g.shadowBlur = 0;
        g.fillStyle = '#fff'; poly(0.28); g.fill();
      }
    };
  }

  function swipeMarks(r, i, marks) {
    const w = r.w || 160, h = r.h || 220;
    const dir = i % 2 === 0 ? 1 : -1;
    const a = dir > 0 ? { x: r.x - 0.08 * w, y: r.y + 0.02 * h } : { x: r.x + 1.08 * w, y: r.y + 0.06 * h };
    const b = dir > 0 ? { x: r.x + 1.08 * w, y: r.y + 0.98 * h } : { x: r.x - 0.08 * w, y: r.y + 0.94 * h };
    const dx = b.x - a.x, dy = b.y - a.y, len = Math.hypot(dx, dy);
    const nx = -dy / len, ny = dx / len;
    const gap = Math.max(11, w * 0.1);
    const out = [];
    for (let k = 0; k < marks; k++) {
      const off = (k - (marks - 1) / 2) * gap;
      const bulge = len * 0.1 * dir;
      out.push({
        p0: { x: a.x + nx * off, y: a.y + ny * off },
        p1: { x: b.x + nx * off, y: b.y + ny * off },
        c: { x: (a.x + b.x) / 2 + nx * (off + bulge), y: (a.y + b.y) / 2 + ny * (off + bulge) },
        W: Math.max(5, w * 0.045) * (k === 1 ? 1.2 : 0.9)
      });
    }
    return out;
  }

  /** Faixa roxa que liga atacante e alvo durante a investida. */
  function ghostStreak(a, r) {
    return addItem({
      dur: 0.38,
      draw(g) {
        const k = this.t / this.dur;
        const head = easeOut(clamp(k * 1.6, 0, 1));
        const x = lerp(a.cx, r.cx, head), y = lerp(a.cy, r.cy, head);
        const grad = g.createLinearGradient(a.cx, a.cy, x, y);
        grad.addColorStop(0, 'rgba(160,107,255,0)');
        grad.addColorStop(1, 'rgba(127,230,255,0.9)');
        g.globalCompositeOperation = 'lighter';
        g.globalAlpha = 1 - k;
        g.strokeStyle = grad;
        g.lineCap = 'round';
        g.lineWidth = 26 * (1 - k);
        g.shadowColor = C.violet; g.shadowBlur = 22;
        g.beginPath(); g.moveTo(a.cx, a.cy); g.lineTo(x, y); g.stroke();
      }
    });
  }

  /** Investida do atacante usando as propriedades individuais translate/scale (não sobrescreve seu transform). */
  function lunge(a, r) {
    if (!a.el || state.reduceMotion) return Promise.resolve();
    const dx = (r.cx - a.cx) * 0.62, dy = (r.cy - a.cy) * 0.62;
    return animate(a.el, [
      { translate: '0px 0px', scale: '1', filter: 'brightness(1)' },
      { translate: (-dx * 0.06) + 'px ' + (-dy * 0.06) + 'px', scale: '0.94', filter: 'brightness(1)', offset: 0.18 },
      { translate: dx + 'px ' + dy + 'px', scale: '1.14', filter: 'brightness(1.5) drop-shadow(0 0 16px ' + C.cyan + ')', offset: 0.42 },
      { translate: (dx * 0.96) + 'px ' + (dy * 0.96) + 'px', scale: '1.12', filter: 'brightness(1.3)', offset: 0.7 },
      { translate: '0px 0px', scale: '1', filter: 'brightness(1)' }
    ], { duration: 900, easing: 'cubic-bezier(.3,.1,.3,1)' });
  }

  /** Impacto no alvo: som, tremor, clarão e fagulhas. */
  function impact(r, scale, colors, sound = true) {
    if (sound) SFX.hit(scale);
    shake(r.el, 6 + 10 * scale, 160 + 260 * scale);
    flash(r.el, colors ? colors[0] : C.violet, 300);
    addItem(particleSystem(burst(r.cx, r.cy, Math.round(14 + 20 * scale), {
      min: 120, max: 160 + 380 * scale, drag: 0.93, lifeMin: 0.3, lifeMax: 0.75, sizeMin: 3, sizeMax: 9,
      colors: colors || [C.cyan, C.violet, C.cream, C.blue], shapes: ['dot', 'spark', 'shard']
    }), { dur: 1 }));
    if (scale > 0.8) screenFlash('rgba(160,107,255,.35)', 0.5, 220);
  }

  /**
   * Ataque Garra Fantasma.
   * @param from  carta atacante (Element/seletor/{x,y,w,h})
   * @param to    carta alvo
   * @param o     { swipes = 2, damage?: número (mostra o dano ao final), marks = 3 }
   */
  async function attack(from, to, o) {
    o = o || {};
    const a = rectOf(from), r = rectOf(to);
    const swipes = o.swipes || 2, marks = o.marks || 3;
    SFX.dash();
    ghostStreak(a, r);
    lunge(a, r);
    await wait(250);
    for (let i = 0; i < swipes; i++) {
      if (o.signal?.aborted) return;
      const last = i === swipes - 1;
      swipeMarks(r, i, marks).forEach((m, k) => addItem(clawMark(m, k * 0.025)));
      SFX.slash(i);
      await wait(70);
      if (o.signal?.aborted) return;
      if (last && o.beforeImpact) await o.beforeImpact();
      if (o.signal?.aborted) return;
      impact(r, last ? 1 : 0.55);
      if (last && o.onImpact) o.onImpact();
      if (!last) await wait(120);
    }
    if (o.damage != null) {
      await floatText(r, '-' + o.damage, { color: '#fff', glow: C.red, stroke: '#3a0a22', size: 56, rise: 80, dy: -r.h * 0.1 });
    } else {
      await wait(500);
    }
  }

  /** Dano recebido (sem animação de ataque): impacto + número. */
  function damage(target, amount, o) {
    o = o || {};
    const r = rectOf(target);
    const scale = clamp((amount || 100) / 180, 0.35, 1.5);
    impact(r, scale, [C.red, C.violet, C.cream], o.sound !== false);
    return floatText(r, '-' + (amount == null ? '' : amount), {
      color: '#fff', glow: C.red, stroke: '#3a0a22', size: 44 + 14 * scale, rise: 80, dy: -r.h * 0.1
    });
  }

  // ---------------------------------------------------------------------------
  // LENTIDÃO — "-1 de velocidade" (aplicada pela Assombração)
  // Três argolas sombrias descem e prendem a carta; chevrons caem; carta pesa.
  // ---------------------------------------------------------------------------
  function slowRing(r, k) {
    return {
      dur: 1.25 + k * 0.1,
      draw(g) {
        const t = this.t - k * 0.12;
        if (t < 0) return;
        const appear = easeOut(clamp(t / 0.35, 0, 1));
        const out = clamp((t - 0.75) / 0.4, 0, 1);
        const y = lerp(r.y - r.h * 0.25, r.y + r.h * (0.22 + 0.28 * k), appear) + out * r.h * 0.2;
        const rx = lerp(r.w * 1.0, r.w * 0.58, appear);
        const ry = rx * 0.26;
        g.globalCompositeOperation = 'lighter';
        g.globalAlpha = (1 - out) * appear;
        g.lineWidth = 7;
        g.strokeStyle = C.indigo; g.shadowColor = C.violet; g.shadowBlur = 20;
        g.beginPath(); g.ellipse(r.cx, y, rx, ry, 0, 0, 6.2832); g.stroke();
        g.lineWidth = 2.5; g.strokeStyle = C.cyan; g.shadowBlur = 8; g.shadowColor = C.cyan;
        g.beginPath(); g.ellipse(r.cx, y - 1, rx, ry, 0, 0, 6.2832); g.stroke();
      }
    };
  }

  function slowChevrons(r) {
    const list = [];
    for (let i = 0; i < 9; i++) {
      list.push({ x: r.x + r.w * rand(0.12, 0.88), y: r.y + r.h * rand(0.0, 0.3), vx: 0, vy: rand(50, 110), g: 120,
        life: rand(0.7, 1.1), size: rand(8, 14), color: pick([C.cyan, C.violet]), delay: i * 0.05, drag: 1, shape: 'chev' });
    }
    const ps = particleSystem(list, { dur: 1.7 });
    ps.draw = function (g) {
      // chevrons ▼ desenhados à mão
      g.globalCompositeOperation = 'lighter';
      g.lineWidth = 3; g.lineCap = 'round'; g.lineJoin = 'round';
      for (const p of list) {
        const a = p.age - p.delay;
        if (a < 0 || a > p.life) continue;
        g.globalAlpha = Math.sin((a / p.life) * Math.PI);
        g.strokeStyle = p.color; g.shadowColor = p.color; g.shadowBlur = 10;
        g.beginPath(); g.moveTo(p.x - p.size, p.y - p.size * 0.5); g.lineTo(p.x, p.y + p.size * 0.5); g.lineTo(p.x + p.size, p.y - p.size * 0.5); g.stroke();
      }
    };
    return ps;
  }

  /**
   * Aplica "-1 VEL" ao alvo.
   * @param o { text = '-1 VEL', sound = true }
   */
  function slow(target, o) {
    o = o || {};
    const r = rectOf(target);
    if (o.sound !== false) SFX.slow();
    [0, 1, 2].forEach((k) => addItem(slowRing(r, k)));
    addItem(slowChevrons(r));
    // a carta "pesa": escurece e perde saturação por um instante
    if (r.el) {
      animate(r.el, [
        { filter: 'saturate(1) brightness(1)' },
        { filter: 'saturate(.45) brightness(.78) drop-shadow(0 0 10px ' + C.violet + ')', offset: 0.25 },
        { filter: 'saturate(.45) brightness(.78) drop-shadow(0 0 10px ' + C.violet + ')', offset: 0.75 },
        { filter: 'saturate(1) brightness(1)' }
      ], { duration: 1300, easing: 'ease-in-out' });
    }
    return floatText(r, o.text || '-1 VEL', { color: C.cyan, glow: C.violet, stroke: '#1a0f3a', size: 38, rise: 60, dy: -r.h * 0.18, dur: 1400 });
  }

  // ---------------------------------------------------------------------------
  // MORTE — "sem rastros ou misericórdia"
  // Uma linha de luz varre a carta de cima para baixo, desfazendo-a em cinzas
  // (clip-path) enquanto o rostinho XX surge e some. Não sobra nada.
  // ---------------------------------------------------------------------------
  function xxFace(cx, cy, s, alpha) {
    return function (g) {
      g.globalCompositeOperation = 'source-over';
      g.globalAlpha = alpha;
      g.lineCap = 'round';
      g.strokeStyle = '#1a0f3a'; g.lineWidth = s * 0.16;
      const xs = [-1, 1];
      xs.forEach((d) => {
        const x = cx + d * s * 0.9, y = cy - s * 0.35, e = s * 0.45;
        g.beginPath(); g.moveTo(x - e, y - e); g.lineTo(x + e, y + e); g.moveTo(x + e, y - e); g.lineTo(x - e, y + e); g.stroke();
      });
      g.beginPath(); g.arc(cx, cy + s * 1.35, s * 0.7, Math.PI * 1.12, Math.PI * 1.88); g.stroke();
    };
  }

  /**
   * Morte do alvo.
   * @param o { hide = true }  hide: deixa a carta invisível ao final (use PenxyFX.restore(el) para voltar)
   */
  async function death(target, o) {
    o = o || {};
    const r = rectOf(target);
    SFX.death();
    shake(r.el, 9, 420);
    const T = 1.15;
    const ash = [];
    let spawnY = 0;
    const scan = {
      dur: T + 1.1,
      update(dt) {
        const k = clamp((this.t - 0.35) / T, 0, 1);
        const y = r.y + r.h * easeInOut(k);
        if (this.t > 0.35 && this.t < 0.35 + T) {
          const n = Math.ceil(dt * 140);
          for (let i = 0; i < n; i++) {
            ash.push({ x: r.x + Math.random() * r.w, y: y + rand(-6, 6), vx: rand(-30, 30), vy: rand(-140, -40), g: -20, drag: 0.97,
              life: rand(0.6, 1.3), age: 0, size: rand(2, 6), color: pick([C.cyan, C.violet, C.cream, '#2a1f4d']), spin: rand(-6, 6), rot: rand(0, 6.28) });
          }
        }
        spawnY = y;
        for (const p of ash) {
          p.age += dt; p.vx *= Math.pow(p.drag, dt * 60); p.vy *= Math.pow(p.drag, dt * 60); p.vy += p.g * dt;
          p.x += p.vx * dt; p.y += p.vy * dt; p.rot += p.spin * dt;
        }
        for (let i = ash.length - 1; i >= 0; i--) if (ash[i].age > ash[i].life) ash.splice(i, 1);
      },
      draw(g) {
        g.globalCompositeOperation = 'lighter';
        for (const p of ash) {
          g.globalAlpha = clamp(1 - p.age / p.life, 0, 1);
          g.fillStyle = p.color;
          g.save(); g.translate(p.x, p.y); g.rotate(p.rot); g.fillRect(-p.size / 2, -p.size / 2, p.size, p.size); g.restore();
        }
        if (this.t > 0.35 && this.t < 0.35 + T + 0.1) { // linha de varredura
          g.globalAlpha = 0.95; g.shadowColor = C.cyan; g.shadowBlur = 18;
          g.strokeStyle = '#fff'; g.lineWidth = 3;
          g.beginPath(); g.moveTo(r.x - 8, spawnY); g.lineTo(r.x + r.w + 8, spawnY); g.stroke();
        }
        const f = clamp((this.t - 0.1) / 0.5, 0, 1) * (1 - clamp((this.t - 0.9) / 0.5, 0, 1));
        if (f > 0) xxFace(r.cx, r.cy - r.h * 0.05, Math.min(r.w, r.h) * 0.12, f * 0.9)(g);
      }
    };
    addItem(scan);
    if (r.el) {
      await animate(r.el, [
        { clipPath: 'inset(0% 0 0 0)', filter: 'brightness(1) saturate(1)', translate: '0 0' },
        { clipPath: 'inset(0% 0 0 0)', filter: 'brightness(1.5) saturate(.3)', translate: '0 0', offset: 0.3 },
        { clipPath: 'inset(100% 0 0 0)', filter: 'brightness(2) saturate(0)', translate: '0 -14px' }
      ], { duration: (T + 0.35) * 1000, easing: 'linear', fill: 'forwards' }).then(() => {
        if (o.hide !== false) { r.el.style.visibility = 'hidden'; }
        r.el.getAnimations().forEach((a) => a.cancel());
      });
    } else {
      await wait((T + 0.35) * 1000);
    }
    await wait(500);
  }

  /** Desfaz o efeito de morte (mostra a carta de novo). */
  function restore(target) {
    const r = rectOf(target);
    if (r.el) { r.el.style.visibility = ''; r.el.getAnimations().forEach((a) => a.cancel()); }
  }

  // ---------------------------------------------------------------------------
  // PODER — "Assombração"
  // PENXY puxa o oponente para a própria mente: um turbilhão engole a carta, a
  // tela escurece e só as duas cartas ficam visíveis, ligadas por um fio de luz
  // (apenas os dois se veem e se atacam). O oponente recebe -1 VEL enquanto
  // estiver lá dentro. Ao sair, a mente se estilhaça.
  // ---------------------------------------------------------------------------
  let mindCanvas = null;

  /** Estrela sombria com rostinho (o símbolo da passiva), usada de fundo. */
  function starFace(g, cx, cy, R, t, alpha) {
    g.save();
    g.globalAlpha = alpha;
    g.translate(cx, cy);
    g.rotate(Math.sin(t * 0.6) * 0.05);
    starPath(g, 0, 0, R, 0, 0.5);
    g.fillStyle = '#2a1f45'; g.fill();
    g.lineWidth = R * 0.06; g.strokeStyle = '#c99a78'; g.lineJoin = 'round'; g.stroke();
    const blink = (t % 4.2) > 4.05 ? 0.1 : 1;
    g.fillStyle = '#ffe58a';
    [-1, 1].forEach((d) => { g.beginPath(); g.ellipse(d * R * 0.2, -R * 0.06, R * 0.075, R * 0.13 * blink, 0, 0, 6.2832); g.fill(); });
    g.strokeStyle = '#ffe58a'; g.lineWidth = R * 0.045; g.lineCap = 'round'; g.lineJoin = 'round';
    g.beginPath();
    const mw = R * 0.34, my = R * 0.26;
    for (let i = 0; i <= 6; i++) { const x = -mw + (i * 2 * mw) / 6, y = my + (i % 2 ? -R * 0.07 : R * 0.03); i ? g.lineTo(x, y) : g.moveTo(x, y); }
    g.stroke();
    g.restore();
  }

  function roundRectPath(g, x, y, w, h, r) {
    g.beginPath();
    if (w <= 0 || h <= 0) return;
    r = Math.max(0, Math.min(r, w / 2, h / 2));
    g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r);
    g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath();
  }

  function makeMind(penxy, opp, withSlowTag) {
    const motes = [];
    for (let i = 0; i < 38; i++) {
      motes.push({ x: Math.random(), y: Math.random(), vy: rand(0.012, 0.04), vx: rand(-0.01, 0.01), s: rand(2.5, 7), ph: rand(0, 6.28),
        shape: pick(['star', 'spark', 'dot', 'dot']), col: pick([C.violet, C.cyan, C.cream, C.blue]) });
    }
    return {
      dur: Infinity,
      closing: false,
      closeStart: 0,
      update(dt) {
        for (const m of motes) {
          m.y -= m.vy * dt; m.x += m.vx * dt; m.ph += dt * 2;
          if (m.y < -0.05) { m.y = 1.05; m.x = Math.random(); }
        }
      },
      draw(g) {
        const W = state.w, H = state.h, dpr = state.dpr;
        const closeK = this.closing ? clamp((this.t - this.closeStart) / 0.5, 0, 1) : 0;
        const alpha = easeInOut(clamp(this.t / 1.25, 0, 1)) * (1 - closeK);
        if (closeK >= 1) { this.dead = true; return; }
        const A = rectOf(penxy), B = rectOf(opp);

        // --- camada escura (fora da tela principal, para poder "furar" sem apagar outros efeitos)
        if (!mindCanvas) mindCanvas = document.createElement('canvas');
        if (mindCanvas.width !== state.canvas.width || mindCanvas.height !== state.canvas.height) {
          mindCanvas.width = state.canvas.width; mindCanvas.height = state.canvas.height;
        }
        const m = mindCanvas.getContext('2d');
        m.setTransform(dpr, 0, 0, dpr, 0, 0);
        m.globalCompositeOperation = 'source-over';
        m.clearRect(0, 0, W, H);
        const bg = m.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.1, W / 2, H / 2, Math.max(W, H) * 0.8);
        bg.addColorStop(0, 'rgba(24,14,48,.88)'); bg.addColorStop(1, 'rgba(6,3,14,.96)');
        m.fillStyle = bg; m.fillRect(0, 0, W, H);
        starFace(m, W / 2, H * 0.3, Math.min(W, H) * 0.36, this.t, 0.28);
        m.globalCompositeOperation = 'destination-out';
        [A, B].forEach((r) => {
          const R = Math.max(r.w, r.h) * 0.95;
          const hole = m.createRadialGradient(r.cx, r.cy, 0, r.cx, r.cy, R);
          hole.addColorStop(0, 'rgba(0,0,0,1)'); hole.addColorStop(0.62, 'rgba(0,0,0,.95)'); hole.addColorStop(1, 'rgba(0,0,0,0)');
          m.fillStyle = hole; m.fillRect(r.cx - R, r.cy - R, R * 2, R * 2);
        });
        g.globalAlpha = alpha;
        g.drawImage(mindCanvas, 0, 0, W, H);

        // --- elementos luminosos
        g.globalCompositeOperation = 'lighter';
        for (const p of motes) {
          g.globalAlpha = alpha * (0.35 + 0.35 * Math.sin(p.ph));
          g.fillStyle = p.col;
          const x = p.x * W, y = p.y * H;
          if (p.shape === 'star') { starPath(g, x, y, p.s * 1.4, p.ph * 0.3); g.fill(); }
          else if (p.shape === 'spark') { sparkPath(g, x, y, p.s * 1.8, 0); g.fill(); }
          else { g.beginPath(); g.arc(x, y, p.s * 0.6, 0, 6.2832); g.fill(); }
        }
        // fio de luz entre as duas cartas
        g.globalAlpha = alpha * (0.6 + 0.25 * Math.sin(this.t * 4));
        g.strokeStyle = C.violet; g.lineWidth = 3; g.shadowColor = C.violet; g.shadowBlur = 16;
        g.setLineDash([14, 12]); g.lineDashOffset = -this.t * 40;
        g.beginPath(); g.moveTo(A.cx, A.cy); g.lineTo(B.cx, B.cy); g.stroke();
        g.setLineDash([]);
        // contorno pulsante das duas cartas
        [[A, C.gold], [B, C.violet]].forEach(([r, col]) => {
          g.globalAlpha = alpha * (0.5 + 0.3 * Math.sin(this.t * 3 + r.x));
          g.strokeStyle = col; g.lineWidth = 3; g.shadowColor = col; g.shadowBlur = 20;
          roundRectPath(g, r.x - 4, r.y - 4, r.w + 8, r.h + 8, 14); g.stroke();
        });
        g.shadowBlur = 0;
        // marcador -1 VEL sobre o oponente
        if (withSlowTag && this.t > 1.5) {
          g.globalCompositeOperation = 'source-over';
          g.globalAlpha = alpha;
          g.font = '900 15px "Trebuchet MS",Arial,sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
          g.lineWidth = 4; g.strokeStyle = '#1a0f3a'; g.fillStyle = C.cyan;
          g.strokeText('▼ -1 VEL', B.cx, B.y - 16); g.fillText('▼ -1 VEL', B.cx, B.y - 16);
        }

        // --- turbilhão de entrada ao redor do oponente
        if (this.t < 1.25) {
          const k = this.t / 1.25;
          const R0 = Math.max(B.w, B.h) * 1.3 * (1 - easeInOut(k) * 0.8);
          g.globalCompositeOperation = 'lighter';
          g.globalAlpha = Math.sin(Math.PI * k);
          g.lineCap = 'round';
          for (let a = 0; a < 3; a++) {
            g.beginPath();
            for (let j = 0; j <= 34; j++) {
              const s = j / 34, rad = R0 * (1 - s * 0.92), ang = this.t * 8 + a * 2.094 + s * 5.6;
              const x = B.cx + Math.cos(ang) * rad, y = B.cy + Math.sin(ang) * rad * 0.85;
              j ? g.lineTo(x, y) : g.moveTo(x, y);
            }
            g.strokeStyle = a === 1 ? C.cyan : C.violet; g.lineWidth = 7; g.shadowColor = C.violet; g.shadowBlur = 22;
            g.stroke();
          }
        }
      }
    };
  }

  const haunt = {
    current: null,

    /**
     * Penxy leva o oponente para sua mente.
     * @param penxy carta do PENXY
     * @param opp   carta do oponente
     * @param o     { slow = true }  aplica o efeito visual de -1 VEL ao entrar
     * @returns Promise<{exit()}>  (resolve quando o oponente já está dentro da mente)
     */
    async enter(penxy, opp, o) {
      o = o || {};
      if (haunt.current) await haunt.current.exit();
      const A = rectOf(penxy), B = rectOf(opp);
      const withSlow = o.slow !== false;
      SFX.hauntEnter();
      flash(A.el, C.gold, 600);

      // carta do oponente é sugada, gira, some e reaparece "dentro da mente"
      const prevFilter = B.el ? B.el.style.filter : '';
      if (B.el && !state.reduceMotion) {
        const dx = (A.cx - B.cx) * 0.4, dy = (A.cy - B.cy) * 0.4;
        animate(B.el, [
          { scale: '1', rotate: '0deg', opacity: 1, translate: '0px 0px' },
          { scale: '0.15', rotate: '540deg', opacity: 0, translate: dx + 'px ' + dy + 'px', offset: 0.58 },
          { scale: '0.15', rotate: '540deg', opacity: 0, translate: '0px 0px', offset: 0.64 },
          { scale: '1.12', rotate: '0deg', opacity: 1, translate: '0px 0px', offset: 0.88 },
          { scale: '1', rotate: '0deg', opacity: 1, translate: '0px 0px' }
        ], { duration: 1700, easing: 'cubic-bezier(.5,0,.3,1)' });
      }

      const mind = makeMind(penxy, opp, withSlow);
      addItem(mind);
      await wait(1250);
      if (o.signal?.aborted) { mind.stop(); return; }
      const ambience = SFX.hauntAmbience();
      if (B.el) B.el.style.filter = (prevFilter ? prevFilter + ' ' : '') + 'saturate(.7) drop-shadow(0 0 12px ' + C.violet + ')';
      if (withSlow) slow(opp, { sound: false });
      await wait(450);

      if (o.signal?.aborted) {
        ambience.stop(); mind.stop(); if (B.el) B.el.style.filter = prevFilter;
        return;
      }
      let closed = false;
      const handle = {
        active: true,
        async exit(silent = false) {
          if (closed) return;
          closed = true; handle.active = false;
          if (haunt.current === handle) haunt.current = null;
          ambience.stop();
          if (silent) {
            mind.stop(); if (B.el) B.el.style.filter = prevFilter;
            return;
          }
          SFX.hauntExit();
          mind.closing = true; mind.closeStart = mind.t;
          const W = state.w, H = state.h;
          addItem(particleSystem(burst(W / 2, H / 2, 46, {
            min: 220, max: 780, gravity: 700, drag: 0.95, lifeMin: 0.5, lifeMax: 1.1, sizeMin: 8, sizeMax: 18, jitter: 90,
            colors: [C.indigo, C.violet, C.cyan, C.cream], shapes: ['shard']
          }), { dur: 1.3 }));
          screenFlash('rgba(255,247,220,.55)', 0.6, 320);
          const nowB = rectOf(opp);
          if (nowB.el) {
            nowB.el.style.filter = prevFilter;
            animate(nowB.el, [{ scale: '0.92' }, { scale: '1.06', offset: 0.5 }, { scale: '1' }], { duration: 450, easing: 'ease-out' });
          }
          await wait(550);
          // "PENXY pode usar sua habilidade logo após sair de uma": pulso de pronto
          if (o.ready !== false) { SFX.shimmer(); flash(A.el, C.gold, 700); addItem(particleSystem(burst(A.cx, A.cy, 14, {
            min: 60, max: 220, drag: 0.94, lifeMin: 0.5, lifeMax: 1, sizeMin: 4, sizeMax: 9,
            colors: [C.gold, C.cream, C.violet], shapes: ['star', 'spark']
          }), { dur: 1.2 })); }
        }
      };
      haunt.current = handle;
      return handle;
    },

    /** Sai da mente atual (atalho para handle.exit()). */
    exit(silent) { return haunt.current ? haunt.current.exit(silent) : Promise.resolve(); },

    get active() { return !!haunt.current; }
  };

  // ---------------------------------------------------------------------------
  // PASSIVA — estrela "Assombração" (brilho/aura)
  // ---------------------------------------------------------------------------
  /** Pulso único: a passiva disparou (anel que se expande + estrela + fagulhas). */
  function passive(target) {
    const r = rectOf(target);
    SFX.shimmer();
    addItem({
      dur: 1.2,
      draw(g) {
        const k = this.t / this.dur;
        g.globalCompositeOperation = 'lighter';
        for (let i = 0; i < 2; i++) {
          const kk = clamp(k * 1.3 - i * 0.18, 0, 1);
          if (kk <= 0) continue;
          g.globalAlpha = (1 - kk) * 0.9;
          g.lineWidth = 6 * (1 - kk) + 1;
          g.strokeStyle = i ? C.cyan : C.violet; g.shadowColor = C.violet; g.shadowBlur = 20;
          roundRectPath(g, r.x - kk * 26, r.y - kk * 26, r.w + kk * 52, r.h + kk * 52, 14 + kk * 20); g.stroke();
        }
        g.shadowBlur = 0;
        const pop = easeOut(clamp(k * 3, 0, 1)) * (1 - clamp((k - 0.6) / 0.4, 0, 1));
        g.globalCompositeOperation = 'source-over';
        starFace(g, r.cx, r.cy, Math.min(r.w, r.h) * (0.18 + 0.1 * pop), this.t * 3, pop);
      }
    });
    addItem(particleSystem(burst(r.cx, r.cy, 22, {
      min: 60, max: 260, drag: 0.94, lifeMin: 0.5, lifeMax: 1.1, sizeMin: 4, sizeMax: 10,
      colors: [C.gold, C.cream, C.violet, C.cyan], shapes: ['star', 'spark', 'dot']
    }), { dur: 1.3 }));
    return wait(1100);
  }

  /**
   * Aura contínua enquanto o PENXY está em campo: brilho pulsante, partículas subindo
   * e o selo da estrela no canto da carta.  Retorna { stop() }.
   * @param o { sound = true }  toca um brilho curto ao ligar
   */
  function aura(target, o) {
    o = o || {};
    if (o.sound !== false) SFX.shimmer();
    const motes = [];
    let acc = 0;
    const item = {
      dur: Infinity,
      stopAt: null,
      update(dt) {
        const r = rectOf(target);
        if (r.el && !r.el.isConnected) { this.dead = true; return; }
        acc += dt * 16;
        while (acc >= 1 && this.stopAt == null) {
          acc -= 1;
          motes.push({ x: r.x + Math.random() * r.w, y: r.y + r.h * rand(0.5, 1), vx: rand(-8, 8), vy: -rand(22, 60),
            life: rand(0.9, 1.7), age: 0, s: rand(2, 5), col: pick([C.violet, C.cyan, C.cream]), star: Math.random() < 0.35, rot: rand(0, 6.28) });
        }
        for (const m of motes) { m.age += dt; m.x += m.vx * dt; m.y += m.vy * dt; m.rot += dt * 2; }
        for (let i = motes.length - 1; i >= 0; i--) if (motes[i].age > motes[i].life) motes.splice(i, 1);
      },
      draw(g) {
        const out = this.stopAt == null ? 1 : 1 - clamp((this.t - this.stopAt) / 0.4, 0, 1);
        if (out <= 0) { this.dead = true; return; }
        const intro = clamp(this.t / 0.4, 0, 1);
        const a = out * intro;
        const r = rectOf(target);
        g.globalCompositeOperation = 'lighter';
        g.globalAlpha = a * (0.35 + 0.2 * Math.sin(this.t * 2.4));
        g.strokeStyle = C.violet; g.lineWidth = 4; g.shadowColor = C.violet; g.shadowBlur = 22;
        roundRectPath(g, r.x - 3, r.y - 3, r.w + 6, r.h + 6, 14); g.stroke();
        g.globalAlpha = a * (0.25 + 0.15 * Math.sin(this.t * 2.4 + 1.6));
        g.strokeStyle = C.cyan; g.lineWidth = 2; g.shadowColor = C.cyan; g.shadowBlur = 12;
        roundRectPath(g, r.x + 3, r.y + 3, r.w - 6, r.h - 6, 12); g.stroke();
        g.shadowBlur = 0;
        for (const m of motes) {
          g.globalAlpha = a * Math.sin((m.age / m.life) * Math.PI) * 0.8;
          g.fillStyle = m.col;
          if (m.star) { starPath(g, m.x, m.y, m.s * 1.5, m.rot); g.fill(); }
          else { g.beginPath(); g.arc(m.x, m.y, m.s * 0.6, 0, 6.2832); g.fill(); }
        }
        g.globalCompositeOperation = 'source-over';
        const R = Math.min(r.w, r.h) * 0.11;
        starFace(g, r.x + r.w - R * 1.1, r.y + R * 1.1, R * (1 + 0.06 * Math.sin(this.t * 3)), this.t, a * 0.95);
      }
    };
    addItem(item);
    return { stop() { if (item.stopAt == null) item.stopAt = item.t; } };
  }

  // ---------------------------------------------------------------------------
  // API pública
  // ---------------------------------------------------------------------------
  if (global.matchMedia) {
    try { state.reduceMotion = global.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { /* ignore */ }
  }

  const PenxyFX = {
    version: '1.0.0',
    colors: C,

    // efeitos
    attack, damage, slow, death, restore, passive, aura, haunt,

    // sons soltos (SFX.slash(), SFX.hit()…)
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
    /** Interrompe todas as animações em andamento (menos a mente, se ativa — use haunt.exit()). */
    clear() { state.items.forEach((i) => { if (i.dur !== Infinity) i.dead = true; }); }
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = PenxyFX;
  global.PenxyFX = PenxyFX;
})(typeof window !== 'undefined' ? window : globalThis);
