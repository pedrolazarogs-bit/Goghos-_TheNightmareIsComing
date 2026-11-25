/*!
 * UnicornFX v1.0 — efeitos visuais e sonoros da UNICORN (GOGHOS: The Nightmare Is Coming)
 * Sem dependências. Animação em <canvas> + Web Animations API, sons sintetizados com WebAudio
 * (nenhum arquivo de áudio ou imagem externo é necessário).
 *
 * Uso rápido:
 *   <script src="unicorn-fx.js"> (tag script comum; ou cole este arquivo inteiro dentro de uma tag script)
 *   document.addEventListener('pointerdown', () => UnicornFX.unlock(), { once: true });
 *
 *   await UnicornFX.stardust(cartaUnicorn, cartaAlvo, { damage: 50 });            // ataque Stardust
 *   await UnicornFX.celestialStar(cartaUnicorn, cartaAliado);                      // Estrela Celeste (+90 vida, +35 dano, +1 vel)
 *   await UnicornFX.damage(cartaUnicorn, 120);                                     // UNICORN recebe dano
 *   await UnicornFX.death(cartaUnicorn);                                           // derrota
 *
 * Todos os métodos aceitam um Element, um seletor CSS ou {x, y, w, h} (coordenadas da viewport)
 * e retornam uma Promise que resolve quando a animação termina.
 */
(function (global) {
  'use strict';

  // ---------------------------------------------------------------------------
  // Paleta (tirada da arte da UNICORN)
  // ---------------------------------------------------------------------------
  const C = {
    pink: '#ff8fb8',
    hot: '#ff5fa0',
    lav: '#c9b8ff',
    violet: '#9b7bf0',
    mint: '#7dff8a',
    cyan: '#8ff0ff',
    red: '#ff3b5c',
    gold: '#ffd98a',
    yellow: '#fff3b0',
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

  // notas pentatônicas (C maior) para os brilhos
  const PENTA = [1046.5, 1174.7, 1318.5, 1568, 1760, 2093, 2349, 2637, 3136];

  /** Sino: fundamental + parciais, cauda longa (reverb) — o "tin" mágico. */
  function bell(ctx, f, o) {
    o = o || {};
    [[1, 1], [2.01, 0.35], [3.98, 0.15]].forEach((p) => {
      tone(ctx, { type: 'sine', f0: f * p[0], f1: f * p[0] * 0.998, t: o.t || 0, dur: (o.dur || 1.2) / (p[0] > 1 ? 1.6 : 1),
        gain: (o.gain || 0.25) * p[1], attack: 0.004, wet: o.wet == null ? 0.8 : o.wet });
    });
  }

  const A = { tone, noise, audio, bell };

  // ---------------------------------------------------------------------------
  // Efeitos sonoros (síntese pura — nada para baixar)
  // Leves e brilhantes: sinos, brilhos em escala pentatônica e acordes que abrem.
  // ---------------------------------------------------------------------------
  function glitter(c, n, t0, span, gain) { // cascata de pontinhos de luz
    for (let i = 0; i < n; i++) {
      const f = pick(PENTA) * pick([1, 1, 2]);
      tone(c, { type: 'sine', f0: f, f1: f * 0.99, dur: rand(0.15, 0.5), gain: gain * rand(0.5, 1), attack: 0.002, t: t0 + Math.random() * span, wet: 0.9 });
    }
  }

  const SFX = {
    // Pulinho de animação antes de atacar
    hop() {
      const c = audio(); if (!c) return;
      tone(c, { type: 'sine', f0: 400, f1: 800, dur: 0.14, gain: 0.25, attack: 0.005 });
      tone(c, { type: 'triangle', f0: 800, f1: 600, dur: 0.1, gain: 0.14, attack: 0.005, t: 0.1 });
    },

    // Stardust saindo da mão: sopro de brilho
    stardustCast() {
      const c = audio(); if (!c) return;
      noise(c, { type: 'bandpass', f0: 3000, f1: 9000, q: 1, dur: 0.5, gain: 0.9, attack: 0.05, wet: 0.4 });
      glitter(c, 10, 0.02, 0.45, 0.08);
      tone(c, { type: 'sine', f0: 700, f1: 1500, dur: 0.3, gain: 0.1, attack: 0.05, wet: 0.4 });
    },

    // Stardust chegando (scale 0.3–1.5)
    stardustImpact(scale = 1) {
      const c = audio(); if (!c) return;
      const s = clamp(scale, 0.3, 1.5);
      A.bell(c, 1568, { gain: 0.5 * s, dur: 1 });
      A.bell(c, 2093, { t: 0.06, gain: 0.36 * s, dur: 0.9 });
      glitter(c, 8, 0.02, 0.35, 0.09);
      tone(c, { type: 'sine', f0: 240, f1: 110, dur: 0.16, gain: 0.6 * s, attack: 0.002 });
      noise(c, { type: 'bandpass', f0: 5000, f1: 2500, q: 1, dur: 0.06, gain: 0.9 * s, attack: 0.001 });
    },

    // Estrela Celeste carregando: arpejo subindo + acorde sustentado + brilho crescente
    charge() {
      const c = audio(); if (!c) return;
      for (let i = 0; i < 8; i++) A.bell(c, PENTA[i], { t: i * 0.1, gain: 0.14, dur: 0.7 });
      [262, 330, 392].forEach((f, i) => {
        tone(c, { type: 'triangle', f0: f, f1: f * 1.002, dur: 1.7, gain: 0.1 - i * 0.015, attack: 0.5, wet: 0.6 });
      });
      noise(c, { type: 'bandpass', f0: 1000, f1: 6000, q: 2, dur: 0.9, gain: 0.5, attack: 0.7, wet: 0.5 });
    },

    // A estrela disparada rumo ao aliado
    launch() {
      const c = audio(); if (!c) return;
      noise(c, { type: 'bandpass', f0: 3000, f1: 700, q: 1.2, dur: 0.5, gain: 1.1, attack: 0.02, wet: 0.3 });
      tone(c, { type: 'sine', f0: 1800, f1: 500, dur: 0.5, gain: 0.12, attack: 0.02, wet: 0.4 });
      glitter(c, 8, 0, 0.5, 0.06);
    },

    // A estrela explode sobre o aliado: acorde de sinos + estouro de brilho
    burst() {
      const c = audio(); if (!c) return;
      [1046.5, 1318.5, 1568, 2093].forEach((f, i) => A.bell(c, f, { t: i * 0.03, gain: 0.26, dur: 1.8 }));
      tone(c, { type: 'sine', f0: 130, f1: 55, dur: 0.45, gain: 0.55, attack: 0.003 });
      noise(c, { type: 'bandpass', f0: 7000, f1: 3000, q: 0.8, dur: 0.3, gain: 0.8, attack: 0.005, wet: 0.4 });
      glitter(c, 16, 0.05, 0.8, 0.08);
    },

    // Cada bônus que aparece (vida, dano, velocidade); maxed = velocidade já no máximo
    statUp(i, maxed) {
      const c = audio(); if (!c) return;
      if (maxed) { tone(c, { type: 'triangle', f0: 440, f1: 330, dur: 0.3, gain: 0.1, attack: 0.005, wet: 0.3 }); return; }
      A.bell(c, [1318.5, 1568, 2093][i % 3], { gain: 0.3, dur: 0.9 });
      tone(c, { type: 'sine', f0: 500 + i * 80, f1: 900 + i * 80, dur: 0.1, gain: 0.12, attack: 0.002 });
    },

    // UNICORN recebendo dano: tilintar de cristal + "ai" agudo
    hit(scale = 1) {
      const c = audio(); if (!c) return;
      const s = clamp(scale, 0.3, 1.5);
      noise(c, { type: 'bandpass', f0: 4500, f1: 2000, q: 1, dur: 0.1, gain: 1.6 * s, attack: 0.001 });
      tone(c, { type: 'sine', f0: 900, f1: 400, dur: 0.14, gain: 0.45 * s, attack: 0.002 });
      tone(c, { type: 'sine', f0: 200, f1: 90, dur: 0.2, gain: 0.8 * s, attack: 0.002 });
      glitter(c, 6, 0.02, 0.3, 0.07 * s);
    },

    // Derrota: arpejo descendente, acorde que se apaga e poeira de estrelas subindo
    death() {
      const c = audio(); if (!c) return;
      for (let i = 0; i < 9; i++) A.bell(c, PENTA[8 - i], { t: i * 0.17, gain: 0.2, dur: 1.2 });
      tone(c, { type: 'triangle', f0: 392, f1: 196, dur: 2.4, gain: 0.14, attack: 0.3, wet: 0.7 });
      noise(c, { type: 'bandpass', f0: 6000, f1: 1500, q: 1, dur: 1.8, gain: 0.5, attack: 0.3, wet: 0.6 });
      glitter(c, 24, 0.2, 1.8, 0.06);
      A.bell(c, 1046.5, { t: 1.9, gain: 0.32, dur: 1.6 });
      tone(c, { type: 'sine', f0: 110, f1: 55, dur: 0.6, gain: 0.35, attack: 0.005, t: 2.0, wet: 0.4 });
    }
  };

  // ---------------------------------------------------------------------------
  // Motor visual: um único <canvas> fixo cobrindo a tela + camada DOM para textos
  // ---------------------------------------------------------------------------
  function ensureLayers() {
    if (state.canvas) return;
    const cv = document.createElement('canvas');
    cv.setAttribute('data-unicorn-fx', 'canvas');
    cv.style.cssText = 'position:fixed;left:0;top:0;width:100%;height:100%;pointer-events:none;z-index:' + state.zIndex;
    document.body.appendChild(cv);
    const dom = document.createElement('div');
    dom.setAttribute('data-unicorn-fx', 'dom');
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
    if (typeof t === 'string') { const q = document.querySelector(t); if (!q) console.warn('UnicornFX: elemento não encontrado:', t); t = q; }
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
  // Desenhos reutilizados: estrela brilhante, raios de sol, flare de 4 pontas, glitter
  // ---------------------------------------------------------------------------
  const RAINBOW = ['#ff7aa8', '#ffb36b', '#ffe27a', '#7dff8a', '#7fe6ff', '#b99aff'];
  const ANCH = { hand: { x: 0.4, y: 0.28 }, star: { x: 0.4, y: 0.16 } }; // posições na carta da arte (0–1)
  const pt = (r, a) => ({ x: r.x + r.w * a.x, y: r.y + r.h * a.y });

  function easeOutBack(x) { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); }

  function bez(p0, c, p1, s) {
    const u = 1 - s;
    return { x: u * u * p0.x + 2 * u * s * c.x + s * s * p1.x, y: u * u * p0.y + 2 * u * s * c.y + s * s * p1.y };
  }

  /** Estrela gorducha e luminosa, como as da arte. */
  function bigStar(g, x, y, r, rot, alpha) {
    if (r <= 0.5 || alpha <= 0) return;
    g.save(); g.globalAlpha = alpha;
    g.globalCompositeOperation = 'lighter';
    const gl = g.createRadialGradient(x, y, 0, x, y, r * 2.2);
    gl.addColorStop(0, 'rgba(255,243,176,.7)'); gl.addColorStop(1, 'rgba(255,217,138,0)');
    g.fillStyle = gl; g.fillRect(x - r * 2.2, y - r * 2.2, r * 4.4, r * 4.4);
    g.globalCompositeOperation = 'source-over';
    starPath(g, x, y, r, rot, 0.52);
    const f = g.createRadialGradient(x, y, 0, x, y, r);
    f.addColorStop(0, '#ffffff'); f.addColorStop(0.6, C.yellow); f.addColorStop(1, C.gold);
    g.fillStyle = f; g.fill();
    g.lineJoin = 'round'; g.lineWidth = r * 0.12; g.strokeStyle = C.cream; g.stroke();
    g.restore();
  }

  /** Brilho de 4 pontas (lens flare). */
  function flare4(g, x, y, r, alpha, rot) {
    if (r <= 0.5 || alpha <= 0) return;
    g.save(); g.translate(x, y); g.rotate(rot || 0);
    g.globalCompositeOperation = 'lighter'; g.globalAlpha = alpha; g.fillStyle = '#fff'; g.shadowColor = C.gold; g.shadowBlur = 18;
    for (let k = 0; k < 2; k++) {
      g.save(); g.rotate((k * Math.PI) / 2);
      g.beginPath(); g.moveTo(-r, 0); g.quadraticCurveTo(0, -r * 0.08, r, 0); g.quadraticCurveTo(0, r * 0.08, -r, 0); g.fill();
      g.restore();
    }
    g.restore();
  }

  /** Raios de sol saindo de um ponto (alternando comprimentos). */
  function sunRays(g, x, y, r0, r1, n, rot, alpha, color) {
    if (alpha <= 0 || r1 <= r0) return;
    g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = alpha; g.fillStyle = color;
    for (let i = 0; i < n; i++) {
      const a = rot + (i * 6.2832) / n, w = 0.06, L = i % 2 ? r1 * 0.7 : r1;
      g.beginPath();
      g.moveTo(x + Math.cos(a - w) * r0, y + Math.sin(a - w) * r0);
      g.lineTo(x + Math.cos(a) * L, y + Math.sin(a) * L);
      g.lineTo(x + Math.cos(a + w) * r0, y + Math.sin(a + w) * r0);
      g.closePath(); g.fill();
    }
    g.restore();
  }

  function glitterBurst(x, y, n, o) {
    o = o || {};
    return addItem(particleSystem(burst(x, y, n, {
      min: o.min || 80, max: o.max || 320, drag: 0.93, gravity: o.gravity || 0, lifeMin: 0.45, lifeMax: 1.0, sizeMin: 3, sizeMax: 8,
      colors: o.colors || RAINBOW, shapes: ['star', 'spark', 'dot']
    }), { dur: 1.2 }));
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

  /** Clarão suave de impacto: realça a carta sem apagar a arte. */
  function hitFlash(el, color, ms) {
    return animate(el, [
      { filter: 'brightness(1)' },
      { filter: 'brightness(1.4) saturate(1.2) drop-shadow(0 0 12px ' + color + ')', offset: 0.18 },
      { filter: 'brightness(1)' }
    ], { duration: ms || 280, easing: 'ease-out' });
  }

  /** Flare grande e rápido no ponto do impacto. */
  function flareBurst(x, y, R, dur) {
    return addItem({
      dur: dur || 0.4,
      draw(g) {
        const k = this.t / this.dur, e = easeOut(clamp(k * 1.5, 0, 1));
        flare4(g, x, y, R * (0.4 + 0.6 * e), 1 - k, k * 0.8);
      }
    });
  }

  // ---------------------------------------------------------------------------
  // ATAQUE — "Stardust" (poeira estelar)
  // UNICORN dá um pulinho, pisca e sopra um rio de glitter em arco até o alvo.
  // ---------------------------------------------------------------------------
  function hop(a) {
    if (!a.el || state.reduceMotion) return Promise.resolve();
    return animate(a.el, [
      { translate: '0px 0px', rotate: '0deg', scale: '1' },
      { translate: '0px -16px', rotate: '-4deg', scale: '1.05', offset: 0.45 },
      { translate: '0px 0px', rotate: '0deg', scale: '1' }
    ], { duration: 420, easing: 'cubic-bezier(.3,.7,.4,1)' });
  }

  /** O rio de glitter: uma estrelinha na frente solta faíscas arco-íris pelo caminho. */
  function stardustStream(a, r, o) {
    const origin = o.origin ? pt(a, o.origin) : pt(a, ANCH.hand);
    const tx = r.cx, ty = r.cy, dx = tx - origin.x, dy = ty - origin.y, dist = Math.hypot(dx, dy) || 1;
    const nx = -dy / dist, ny = dx / dist, T = clamp(dist / 900, 0.4, 0.7), size = clamp(a.w * 0.07, 8, 16);
    const parts = [];
    let hx = origin.x, hy = origin.y;
    SFX.stardustCast();
    addItem({
      dur: T + 0.6,
      update(dt) {
        const k = clamp(this.t / T, 0, 1);
        if (this.t < T) {
          const e = easeInOut(k), wave = Math.sin(k * 9) * 18 * (1 - k * 0.3);
          hx = lerp(origin.x, tx, e) + nx * wave; hy = lerp(origin.y, ty, e) + ny * wave;
          const n = Math.ceil(dt * 140);
          for (let i = 0; i < n; i++) {
            parts.push({ x: hx + rand(-6, 6), y: hy + rand(-6, 6), vx: rand(-30, 30), vy: rand(-30, 30), age: 0, life: rand(0.35, 0.7),
              s: rand(2.5, 7), col: pick(RAINBOW), shape: pick(['star', 'spark', 'dot']), rot: rand(0, 6.28), spin: rand(-6, 6) });
          }
        }
        for (let i = parts.length - 1; i >= 0; i--) {
          const p = parts[i]; p.age += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.rot += p.spin * dt;
          if (p.age > p.life) parts.splice(i, 1);
        }
      },
      draw(g) {
        g.globalCompositeOperation = 'lighter';
        for (const p of parts) {
          const k = p.age / p.life; g.globalAlpha = 1 - k; g.fillStyle = p.col;
          const s = p.s * (1 - k * 0.5);
          if (p.shape === 'star') { starPath(g, p.x, p.y, s, p.rot); g.fill(); }
          else if (p.shape === 'spark') { sparkPath(g, p.x, p.y, s * 1.4, p.rot); g.fill(); }
          else { g.beginPath(); g.arc(p.x, p.y, s * 0.6, 0, 6.2832); g.fill(); }
        }
        if (this.t < T) bigStar(g, hx, hy, size, this.t * 6, 1);
      }
    });
    return wait(T * 1000); // o impacto acontece quando o brilho chega; a cauda de glitter termina sozinha
  }

  /** Chegada do brilho no alvo: sino, tremor leve, clarão rosa, glitter e flare. */
  function starHit(r, scale) {
    SFX.stardustImpact(scale);
    shake(r.el, 3 + 5 * scale, 180 + 180 * scale);
    hitFlash(r.el, C.pink, 260);
    glitterBurst(r.cx, r.cy, Math.round(14 + 16 * scale), { min: 90, max: 260 + 200 * scale });
    flareBurst(r.cx, r.cy, Math.max(r.w, r.h) * 0.35, 0.4);
    ring(r.cx, r.cy, Math.max(r.w, r.h) * (0.3 + 0.15 * scale), C.pink, 0.4, 5);
    ring(r.cx, r.cy, Math.max(r.w, r.h) * (0.2 + 0.1 * scale), C.lav, 0.55, 3);
  }

  /**
   * Ataque Stardust.
   * @param from  carta atacante (Element/seletor/{x,y,w,h})
   * @param to    carta alvo
   * @param o     { damage?: número (mostra o dano ao final), origin?: {x,y} (de onde sai o brilho, 0–1 na carta) }
   */
  async function stardust(from, to, o) {
    o = o || {};
    const a = rectOf(from), r = rectOf(to);
    SFX.hop();
    hop(a);
    glitterBurst(a.x + a.w * ANCH.hand.x, a.y + a.h * ANCH.hand.y, 10, { min: 40, max: 160 });
    await wait(260);
    if(o.signal?.aborted)return;
    await stardustStream(a, r, o);
    if(o.beforeImpact && !await o.beforeImpact())return;
    if(o.signal?.aborted)return;
    if(o.onImpact)o.damage=o.onImpact();
    starHit(rectOf(to), 0.6);
    if (o.damage != null) {
      await floatText(rectOf(to), '-' + o.damage, { color: '#fff', glow: C.hot, stroke: '#4a1f5e', size: 50, rise: 80, dy: -r.h * 0.1 });
    } else {
      await wait(500);
    }
  }

  /** Dano recebido por qualquer carta: tilintar de cristal, estilhaços rosa e glitter. */
  function damage(target, amount) {
    const r = rectOf(target), scale = clamp((amount || 100) / 220, 0.35, 1.5);
    SFX.hit(scale);
    shake(r.el, 4 + 8 * scale, 200 + 260 * scale);
    hitFlash(r.el, C.hot, 280);
    addItem(particleSystem(burst(r.cx, r.cy, Math.round(10 + 12 * scale), {
      min: 120, max: 120 + 320 * scale, drag: 0.93, gravity: 500, lifeMin: 0.5, lifeMax: 1.0, sizeMin: 5, sizeMax: 11,
      colors: [C.pink, C.lav, '#fff', C.hot], shapes: ['shard'], fadeFrom: 0.5
    }), { dur: 1.2 }));
    glitterBurst(r.cx, r.cy, 12, { min: 80, max: 240 });
    ring(r.cx, r.cy, Math.max(r.w, r.h) * (0.35 + 0.2 * scale), C.pink, 0.4, 6);
    if (scale > 1) screenFlash('rgba(255,143,184,.25)', 0.5, 220);
    return floatText(r, '-' + (amount == null ? '' : amount), {
      color: '#fff', glow: C.hot, stroke: '#4a1f5e', size: 44 + 14 * scale, rise: 80, dy: -r.h * 0.1
    });
  }

  // ---------------------------------------------------------------------------
  // PODER — "Estrela Celeste"
  // Uma estrela gigante nasce sobre a UNICORN, é lançada em arco até um aliado e
  // explode em luz. O aliado recebe a melhoria geral: +90 vida, +35 dano, +1
  // velocidade (máx. 9), cada bônus aparecendo com seu próprio "ding".
  // ---------------------------------------------------------------------------
  function lift(el) {
    if (!el || state.reduceMotion) return Promise.resolve();
    return animate(el, [
      { translate: '0px 0px', scale: '1', filter: 'brightness(1)' },
      { translate: '0px -10px', scale: '1.05', filter: 'brightness(1.25) drop-shadow(0 0 14px ' + C.gold + ')', offset: 0.5 },
      { translate: '0px 0px', scale: '1', filter: 'brightness(1)' }
    ], { duration: 900, easing: 'ease-in-out' });
  }

  function empower(el) {
    if (!el || state.reduceMotion) return Promise.resolve();
    return animate(el, [
      { scale: '1', filter: 'brightness(1)' },
      { scale: '1.08', filter: 'brightness(1.4) saturate(1.15) drop-shadow(0 0 16px ' + C.gold + ')', offset: 0.3 },
      { scale: '1', filter: 'brightness(1)' }
    ], { duration: 900, easing: 'ease-out' });
  }

  /** Explosão de luz sobre o aliado: raios, flare, anéis, glitter e estrelinhas em órbita. */
  function buffBurst(B) {
    addItem({
      dur: 0.9,
      draw(g) {
        const k = this.t / this.dur, e = easeOut(k);
        sunRays(g, B.cx, B.cy, B.w * 0.15, B.w * (0.3 + 1.4 * e), 16, k * 0.8, 1 - k, C.gold);
        sunRays(g, B.cx, B.cy, B.w * 0.1, B.w * (0.2 + 1.0 * e), 12, -k * 0.5, (1 - k) * 0.6, C.pink);
        flare4(g, B.cx, B.cy, B.w * (0.6 + 0.5 * e), 1 - k, k);
      }
    });
    ring(B.cx, B.cy, B.w * 1.0, C.gold, 0.6, 7);
    setTimeout(() => ring(B.cx, B.cy, B.w * 0.8, C.pink, 0.6, 5), 120);
    setTimeout(() => ring(B.cx, B.cy, B.w * 0.6, C.mint, 0.6, 4), 240);
    glitterBurst(B.cx, B.cy, 36, { min: 100, max: 420 });
    addItem({ // halo de estrelinhas
      dur: 1.2,
      draw(g) {
        const k = this.t / this.dur, a = Math.sin(Math.PI * k);
        g.globalCompositeOperation = 'lighter';
        for (let i = 0; i < 6; i++) {
          const ang = this.t * 4 + i * 1.047, rr = B.w * 0.62 * (1 + 0.15 * Math.sin(this.t * 6 + i));
          g.globalAlpha = a * 0.9; g.fillStyle = RAINBOW[i];
          starPath(g, B.cx + Math.cos(ang) * rr, B.cy + Math.sin(ang) * rr * 1.2, 6, ang); g.fill();
        }
      }
    });
    screenFlash('rgba(255,235,170,.28)', 0.5, 260);
  }

  /**
   * Estrela Celeste: UNICORN melhora um aliado.
   * @param unicorn  carta da UNICORN
   * @param ally     carta do aliado que recebe a melhoria
   * @param o        { life = 90, damage = 35, speed = 1, speedMax = false (velocidade já está no máximo 9: mostra "VEL MÁX"),
   *                   badge = false (deixa uma estrelinha dourada fixa na carta do aliado), star: {x,y} (de onde nasce a estrela, 0–1) }
   * @returns Promise<{ remove() }>  remove() tira a estrelinha fixa (se badge)
   */
  async function celestialStar(unicorn, ally, o) {
    o = o || {};
    const life = o.life == null ? 90 : o.life, dmg = o.damage == null ? 35 : o.damage, spd = o.speed == null ? 1 : o.speed;
    const maxed = !!o.speedMax, anchor = o.star || ANCH.star;
    const A = rectOf(unicorn), B0 = rectOf(ally);

    // 1) a estrela nasce sobre a UNICORN
    SFX.charge();
    floatText(A, 'ESTRELA CELESTE', { color: C.gold, glow: C.pink, stroke: '#4a2a5e', size: 26, rise: 40, dy: -A.h * 0.42, dur: 1300 });
    lift(A.el);
    addItem({
      dur: 0.9,
      draw(g) {
        const P = pt(rectOf(unicorn), anchor), k = this.t / this.dur;
        const R = A.w * 0.2 * easeOutBack(clamp(k / 0.7, 0, 1));
        sunRays(g, P.x, P.y, R * 0.8, R * (1 + 2.6 * clamp(k * 1.4, 0, 1)), 14, this.t * 1.2, 0.55, C.gold);
        bigStar(g, P.x, P.y, R, this.t * 2, 1);
        g.globalCompositeOperation = 'lighter';
        for (let i = 0; i < 5; i++) {
          const ang = this.t * 3 + i * 1.2566;
          g.globalAlpha = 0.8; g.fillStyle = RAINBOW[i];
          sparkPath(g, P.x + Math.cos(ang) * R * 1.8, P.y + Math.sin(ang) * R * 1.8, 5 + 2 * Math.sin(this.t * 8 + i), 0); g.fill();
        }
      }
    });
    await wait(900);

    if(o.signal?.aborted)return;
    // 2) a estrela é lançada em arco até o aliado
    SFX.launch();
    const p0 = pt(rectOf(unicorn), anchor), tgt = { x: B0.cx, y: B0.cy - B0.h * 0.05 };
    const dist = Math.hypot(tgt.x - p0.x, tgt.y - p0.y) || 1, T = clamp(dist / 1000, 0.45, 0.8), size = A.w * 0.2;
    const c = { x: (p0.x + tgt.x) / 2, y: Math.min(p0.y, tgt.y) - Math.max(80, dist * 0.3) };
    const sparks = [];
    await addItem({
      dur: T,
      update(dt) {
        const k = clamp(this.t / T, 0, 1), p = bez(p0, c, tgt, Math.pow(k, 1.6));
        for (let i = 0, n = Math.ceil(dt * 120); i < n; i++) {
          sparks.push({ x: p.x + rand(-8, 8), y: p.y + rand(-8, 8), vx: rand(-40, 40), vy: rand(-40, 40), age: 0, life: rand(0.3, 0.6), s: rand(2.5, 6), col: pick(RAINBOW), rot: rand(0, 6.28) });
        }
        for (let i = sparks.length - 1; i >= 0; i--) {
          const s = sparks[i]; s.age += dt; s.x += s.vx * dt; s.y += s.vy * dt; s.rot += dt * 5;
          if (s.age > s.life) sparks.splice(i, 1);
        }
      },
      draw(g) {
        const k = clamp(this.t / T, 0, 1);
        g.globalCompositeOperation = 'lighter';
        for (const s of sparks) { g.globalAlpha = 1 - s.age / s.life; g.fillStyle = s.col; sparkPath(g, s.x, s.y, s.s * 1.5, s.rot); g.fill(); }
        for (let j = 15; j >= 0; j--) { // rastro arco-íris
          const kk = k - j * 0.025;
          if (kk < 0) continue;
          const p = bez(p0, c, tgt, Math.pow(kk, 1.6));
          g.globalAlpha = (1 - j / 16) * 0.8; g.fillStyle = RAINBOW[j % 6];
          g.beginPath(); g.arc(p.x, p.y, size * 0.45 * (1 - j / 20), 0, 6.2832); g.fill();
        }
        const h = bez(p0, c, tgt, Math.pow(k, 1.6));
        bigStar(g, h.x, h.y, size * (1 - 0.4 * k), this.t * 9, 1);
      }
    });

    if(o.beforeImpact && !await o.beforeImpact())return;
    if(o.signal?.aborted)return;
    o.onImpact?.();
    // 3) chegada: a estrela explode em luz sobre o aliado
    const B = rectOf(ally);
    SFX.burst();
    buffBurst(B);
    empower(B.el);
    await wait(450);

    // 4) os bônus aparecem um a um, cada um com seu "ding"
    const stats = [
      { text: '+' + life + ' VIDA', color: '#ffa8c4', glow: C.red },
      { text: '+' + dmg + ' DANO', color: C.gold, glow: '#ff9a3c' },
      maxed ? { text: 'VEL MÁX', color: C.lav, glow: C.violet, dim: true } : { text: '+' + spd + ' VEL', color: C.cyan, glow: '#3fb8ff' }
    ];
    for (let i = 0; i < stats.length; i++) {
      if(o.signal?.aborted)return;
      SFX.statUp(i, stats[i].dim);
      floatText(B, stats[i].text, { color: stats[i].color, glow: stats[i].glow, stroke: '#2d1b4e', size: 34, rise: 70, dy: -B.h * 0.08 - i * 60, dur: 1500 });
      await wait(280);
    }
    await wait(900);

    // estrelinha fixa opcional: marca que o aliado está melhorado
    let badge = null;
    if (o.badge) {
      badge = {
        dur: Infinity,
        draw(g) {
          const R = rectOf(ally);
          bigStar(g, R.x + R.w * 0.88, R.y + R.h * 0.1, Math.min(R.w, R.h) * (0.06 + 0.008 * Math.sin(this.t * 3)), this.t * 0.8, 1);
        }
      };
      addItem(badge);
    }
    return { remove() { if (badge) badge.dead = true; } };
  }

  // ---------------------------------------------------------------------------
  // DERROTA — a UNICORN vira poeira de estrelas
  // A carta brilha e sobe, depois se dissolve de baixo para cima em estrelinhas
  // arco-íris que flutuam; no fim, uma grande estrela dourada sobe e se apaga.
  // ---------------------------------------------------------------------------
  /**
   * @param target  carta da UNICORN
   * @param o       { hide = true (esconde a carta no fim; restore() desfaz) }
   */
  async function death(target, o) {
    o = o || {};
    const r = rectOf(target), el = r.el;
    const jit = [], parts = [];
    for (let i = 0; i < 14; i++) jit.push(rand(0, 0.22));
    let prog = 0, finalDone = false;
    const bnd = (i) => 1 - clamp(prog * 1.25 - jit[i], 0, 1); // altura (0–1) da borda que sobe

    SFX.death();
    if (el && !state.reduceMotion) {
      animate(el, [
        { translate: '0px 0px', filter: 'brightness(1)' },
        { translate: '0px -8px', filter: 'brightness(1.5) saturate(.8) drop-shadow(0 0 16px ' + C.gold + ')', offset: 0.5 },
        { translate: '0px -22px', filter: 'brightness(1.8) saturate(.5) drop-shadow(0 0 20px ' + C.gold + ')' }
      ], { duration: 2000, easing: 'ease-out', fill: 'forwards' });
    }

    const item = {
      dur: 3.1,
      update(dt) {
        const t = this.t;
        prog = easeInOut(clamp((t - 0.4) / 1.4, 0, 1));
        if (el && t >= 0.4) {
          if (prog >= 1) el.style.clipPath = 'inset(0 0 100% 0)'; // já dissolvida por completo
          else {
            let poly = '0% 0%,100% 0%,';
            for (let i = 13; i >= 0; i--) poly += (i / 13) * 100 + '% ' + bnd(i) * 100 + '%' + (i ? ',' : '');
            el.style.clipPath = 'polygon(' + poly + ')';
          }
        }
        if (prog > 0 && prog < 1 && parts.length < 260) { // estrelinhas saem da borda e sobem
          for (let k = 0, n = Math.ceil(dt * 110 * (0.4 + prog)); k < n; k++) {
            const i = (Math.random() * 14) | 0;
            parts.push({ x: r.x + (i / 13) * r.w + rand(-6, 6), y: r.y + bnd(i) * r.h + rand(-4, 4), vx: rand(-20, 20), vy: rand(-150, -40),
              s: rand(3, 9), col: pick(RAINBOW), shape: pick(['star', 'spark', 'dot']), rot: rand(0, 6.28), spin: rand(-5, 5),
              ph: rand(0, 6.28), age: 0, life: rand(0.8, 1.6) });
          }
        }
        if (t >= 1.3 && !finalDone) { finalDone = true; screenFlash('rgba(255,240,200,.3)', 0.5, 320); }
        for (let i = parts.length - 1; i >= 0; i--) {
          const p = parts[i]; p.age += dt; p.ph += dt * 3; p.x += (p.vx + Math.sin(p.ph) * 20) * dt; p.y += p.vy * dt; p.rot += p.spin * dt;
          if (p.age > p.life) parts.splice(i, 1);
        }
      },
      draw(g) {
        const t = this.t;
        g.globalCompositeOperation = 'lighter';
        for (const p of parts) {
          g.globalAlpha = (1 - p.age / p.life) * (0.65 + 0.35 * Math.sin(p.ph * 3)); g.fillStyle = p.col;
          if (p.shape === 'star') { starPath(g, p.x, p.y, p.s, p.rot); g.fill(); }
          else if (p.shape === 'spark') { sparkPath(g, p.x, p.y, p.s * 1.5, p.rot); g.fill(); }
          else { g.beginPath(); g.arc(p.x, p.y, p.s * 0.55, 0, 6.2832); g.fill(); }
        }
        if (t >= 1.3) { // a grande estrela sobe e se apaga
          const k = clamp((t - 1.3) / 1.4, 0, 1), x = r.cx, y = r.cy - 22 - k * r.h * 0.6;
          const R = r.w * 0.16 * easeOutBack(clamp(k * 3, 0, 1)), a = 1 - clamp((k - 0.7) / 0.3, 0, 1);
          sunRays(g, x, y, R * 0.8, R * 2.4, 12, t, 0.5 * a, C.gold);
          bigStar(g, x, y, R, t * 1.5, a);
          if (k > 0.72) flare4(g, x, y, r.w * 0.5 * (k - 0.72) * 3.5, 1 - (k - 0.72) / 0.28, 0);
        }
      },
      onEnd() {
        if (el) {
          el.style.clipPath = '';
          el.getAnimations().forEach((a) => a.cancel());
          if (o.hide !== false) el.style.visibility = 'hidden';
        }
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

  const UnicornFX = {
    version: '1.0.0',
    colors: C,

    // ataque e dano
    stardust, damage,
    // poder "Estrela Celeste" (melhoria geral num aliado)
    celestialStar,
    // derrota (e desfazer)
    death, restore,

    // sons soltos (UnicornFX.sfx.hit(), …)
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
    /** Interrompe as animações em andamento. */
    clear() {
      cancelAnimationFrame(state.raf);state.raf=0;
      for(const item of state.items){item.onEnd?.();item._res();}
      state.items=[];state.g?.clearRect(0,0,state.w,state.h);state.dom?.replaceChildren();
    }
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = UnicornFX;
  global.UnicornFX = UnicornFX;
})(typeof window !== 'undefined' ? window : globalThis);
