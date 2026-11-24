/*!
 * Efeitos.laser — ataque "Lazer Descharge" da Petra (JS puro, sem áudio externo)
 *
 *   Efeitos.laser(cartaOrigem, cartaAlvo, { nivel: 1 });
 *   await Efeitos.laser(petra, inimigo, { nivel: Efeitos.desgaste.nivelPorVida(vida), onImpacto: () => aplicarDano() });
 *
 * O laser acompanha o desgaste da Petra:
 *   Nível 1  carga rápida, feixe grosso e estável, explosão forte no alvo   (Atk 300)
 *   Nível 2  carga mais lenta, feixe médio que falha e pisca, impacto médio  (Atk 190)
 *   Nível 3  carga que falha e recomeça, feixe fino e entrecortado, impacto fraco (Atk 70)
 *
 * Opções: nivel (1–3) · ponto {x,y} de onde o laser sai na carta de origem, em fração 0–1 (padrão: centro)
 *         mira {x,y} onde acerta no alvo (padrão: centro) · onImpacto() no instante do acerto · onFim()
 *         som (true) · volume (0.8)
 * Retorna uma Promise resolvida no fim. O som só toca depois de um toque/clique do jogador.
 */
(function (global) {
  'use strict';
  const Efeitos = global.Efeitos = global.Efeitos || {};
  const calmo = !!(global.matchMedia && global.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const rnd = (a, b) => a + Math.random() * (b - a);

  // carga/feixe em ms · larg: espessura · falhas: de 7 blocos de 35 ms, quantos o feixe apaga · forca: intensidade do impacto
  const PERFIL = [null,
    { carga: 320, feixe: 460, larg: 44, falhas: 0, forca: 1,    arcos: 2, tremor: 12 },
    { carga: 440, feixe: 360, larg: 26, falhas: 2, forca: 0.6,  arcos: 1, tremor: 7 },
    { carga: 680, feixe: 260, larg: 14, falhas: 4, forca: 0.25, arcos: 0, tremor: 3 }];
  const COR = [null, ['#ffffff', '#6ff7ec', '#19c9bd'], ['#e6fffb', '#58d9cf', '#128f88'], ['#c7e6e3', '#3fa6a0', '#0d5f5c']];   // núcleo, meio, brilho
  const porta = (P, tt) => P.falhas && ((tt / 35 | 0) * 7919) % 7 < P.falhas ? 0.12 : 1;   // apagões do feixe

  /* ---------------- DESENHO ---------------- */
  function carga(n, u) {   // intensidade da carga de 0 a 1; no nível 3 ela falha no meio e recomeça
    if (n < 3) return u * u;
    return u < 0.4 ? u / 0.4 * 0.7 : u < 0.55 ? 0.7 - (u - 0.4) / 0.15 * 0.55 : 0.15 + (u - 0.55) / 0.45 * 0.85;
  }
  function brilho(g, p, r, a, cor) {
    const gr = g.createRadialGradient(p.x, p.y, 0, p.x, p.y, r);
    gr.addColorStop(0, 'rgba(255,255,255,' + Math.min(1, a) + ')'); gr.addColorStop(0.35, cor + 'aa'); gr.addColorStop(1, 'rgba(0,0,0,0)');
    g.globalAlpha = Math.min(1, a); g.fillStyle = gr; g.fillRect(p.x - r, p.y - r, r * 2, r * 2); g.globalAlpha = 1;
  }
  function faixa(g, O, T, w, t, cor, alfa, blur) {   // um traço do feixe, com borda ondulando
    const n = 30, dx = T.x - O.x, dy = T.y - O.y, L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L, a = [], b = [];
    for (let i = 0; i <= n; i++) {
      const u = i / n, h = w / 2 * Math.min(1, 0.35 + u * 4) * (1 + 0.1 * Math.sin(u * 36 - t / 22)), x = O.x + dx * u, y = O.y + dy * u;
      a.push([x + nx * h, y + ny * h]); b.push([x - nx * h, y - ny * h]);
    }
    g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = alfa; g.fillStyle = cor; g.shadowColor = cor; g.shadowBlur = blur;
    g.beginPath(); a.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]));
    for (let i = n; i >= 0; i--) g.lineTo(b[i][0], b[i][1]);
    g.closePath(); g.fill(); g.restore();
  }
  function arco(g, O, T, amp, cor) {   // faísca elétrica em zigue-zague ao redor do feixe
    const n = 12, dx = T.x - O.x, dy = T.y - O.y, L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L;
    g.save(); g.globalCompositeOperation = 'lighter'; g.strokeStyle = cor; g.lineWidth = 1.5; g.shadowColor = cor; g.shadowBlur = 8; g.globalAlpha = 0.8; g.beginPath();
    for (let i = 0; i <= n; i++) {
      const u = i / n, o = i && i < n ? (Math.random() - 0.5) * amp : 0, x = O.x + dx * u + nx * o, y = O.y + dy * u + ny * o;
      i ? g.lineTo(x, y) : g.moveTo(x, y);
    }
    g.stroke(); g.restore();
  }

  Efeitos.laser = function (origem, alvo, op) {
    op = Object.assign({ nivel: 1, som: true, volume: 0.8, ponto: { x: 0.5, y: 0.5 }, mira: { x: 0.5, y: 0.5 } }, op);
    const nivel = Math.max(1, Math.min(3, Math.round(op.nivel) || 1)), P = PERFIL[nivel], cor = COR[nivel];

    return new Promise(function (resolve) {
      const ro = origem.getBoundingClientRect(), rt = alvo.getBoundingClientRect(), W = global.innerWidth, H = global.innerHeight;
      const O = { x: ro.left + ro.width * op.ponto.x, y: ro.top + ro.height * op.ponto.y };
      const T = { x: rt.left + rt.width * op.mira.x, y: rt.top + rt.height * op.mira.y };
      const ang = Math.atan2(T.y - O.y, T.x - O.x), esc = Math.max(0.5, Math.min(1.6, Math.sqrt(ro.width * ro.height) / 260));
      const tb = P.carga, tf = tb + P.feixe, fim = tf + 400;

      const cv = document.createElement('canvas'), dpr = Math.min(global.devicePixelRatio || 1, 2);
      cv.width = W * dpr; cv.height = H * dpr;
      Object.assign(cv.style, { position: 'fixed', left: 0, top: 0, width: W + 'px', height: H + 'px', pointerEvents: 'none', zIndex: 99999 });
      document.body.appendChild(cv);
      const g = cv.getContext('2d'); g.scale(dpr, dpr);

      const f0 = alvo.style.filter;
      let t = 0, ult = performance.now(), ps = [], aneis = [], bateu = false, fiz = false, flash = 0, tremor = 0;

      if (op.som && audio(op.volume)) somLaser(P, nivel);

      function faiscas(p, n, a0, spread) {
        for (let i = 0; i < n; i++) {
          const a = a0 + (Math.random() - 0.5) * spread * 2, v = rnd(150, 700) * esc, vida = rnd(0.2, 0.55);
          ps.push({ x: p.x, y: p.y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, g: 500, v: vida, m: vida, c: i % 3 ? cor[1] : cor[0] });
        }
      }
      function impacto() {
        bateu = true; flash = 1; tremor = P.tremor * 1.4;
        aneis.push({ r: 8 * esc, vr: 900 * esc * (0.4 + P.forca * 0.6), a: 1 });
        if (nivel < 3) aneis.push({ r: 4 * esc, vr: 520 * esc, a: 0.7 });
        faiscas(T, Math.round(46 * P.forca) + 6, ang + Math.PI, 1.6);
        try {   // coice na carta de origem
          const d = -9 * P.forca;
          origem.animate([{ translate: '0px 0px' }, { translate: Math.cos(ang) * d + 'px ' + Math.sin(ang) * d + 'px', offset: 0.25 }, { translate: '0px 0px' }], { duration: 260, easing: 'ease-out' });
        } catch (e) { /* navegador sem suporte: segue sem o coice */ }
        if (op.onImpacto) { try { op.onImpacto(); } catch (e) { console.error(e); } }
      }

      function quadro(agora) {
        if (op.signal?.aborted || op.encerrar?.()) { cv.remove(); alvo.style.translate=''; alvo.style.filter=f0; resolve(); return; }
        if (op.pausado?.()) { ult=agora; requestAnimationFrame(quadro); return; }
        const dt = Math.min(0.05, Math.max(0, (agora - ult) / 1000)); ult = agora; t += dt * 1000;
        g.clearRect(0, 0, W, H);
        const tt = t - tb; let b = 0;
        g.globalCompositeOperation = 'lighter';

        if (t < tb) {   // carga: anel fecha, partículas são sugadas, energia cresce na saída
          const c = carga(nivel, t / tb);
          g.save(); g.strokeStyle = cor[1]; g.lineWidth = 2 * esc; g.globalAlpha = c;
          g.beginPath(); g.arc(O.x, O.y, (70 - 55 * c) * esc, 0, 6.3); g.stroke(); g.restore();
          brilho(g, O, (8 + 34 * c) * esc, c, cor[1]);
          for (let i = 0, n = 1 + (c * 4 | 0); i < n; i++) {
            const a = Math.random() * 6.3, d = rnd(60, 110) * esc;
            ps.push({ x: O.x + Math.cos(a) * d, y: O.y + Math.sin(a) * d, vx: -Math.cos(a) * d / 0.18, vy: -Math.sin(a) * d / 0.18, g: 0, v: 0.18, m: 0.18, c: cor[1] });
          }
          if (nivel === 3 && !fiz && t / tb > 0.42) { fiz = true; faiscas(O, 14, ang, 3); }   // a carga falha
        } else if (t < tf) {   // feixe
          if (!bateu) impacto();
          b = Math.min(1, tt / 40) * Math.min(1, (P.feixe - tt) / (P.feixe * 0.3)) * porta(P, tt);
          const w = P.larg * esc * b;
          if (w > 0.5) {
            faixa(g, O, T, w * 1.9, t, cor[2], 0.45, 30 * esc);
            faixa(g, O, T, w, t, cor[1], 0.85, 14 * esc);
            faixa(g, O, T, w * 0.42, t, cor[0], 1, 6 * esc);
            for (let i = 0; i < P.arcos; i++) if (Math.random() < 0.8) arco(g, O, T, w * 1.2, cor[1]);
            if (b > 0.5 && Math.random() < 0.3 + P.forca * 0.7) faiscas(T, 2, ang + Math.PI, 1.3);
          }
          brilho(g, O, (34 + 18 * b) * esc, 0.5 + 0.5 * b, cor[1]);
          brilho(g, T, (30 + 60 * P.forca) * b * esc, 0.9 * b, cor[1]);
        }

        flash = Math.max(0, flash - dt * 4);
        if (flash > 0) brilho(g, T, (50 + 130 * P.forca) * esc * flash, flash, cor[1]);
        aneis = aneis.filter(r => r.a > 0);
        for (const r of aneis) { r.r += r.vr * dt; r.a -= dt * 3; g.save(); g.strokeStyle = cor[1]; g.lineWidth = (2 + 5 * P.forca) * esc; g.globalAlpha = Math.max(0, r.a); g.beginPath(); g.arc(T.x, T.y, r.r, 0, 6.3); g.stroke(); g.restore(); }
        ps = ps.filter(p => p.v > 0); g.lineWidth = 1.8 * esc; g.lineCap = 'round';
        for (const p of ps) {
          p.x += p.vx * dt; p.y += p.vy * dt; p.vy += p.g * dt; p.v -= dt;
          g.globalAlpha = Math.max(0, p.v / p.m); g.strokeStyle = p.c;
          g.beginPath(); g.moveTo(p.x, p.y); g.lineTo(p.x - p.vx * 0.035, p.y - p.vy * 0.035); g.stroke();
        }
        g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';

        // reação do alvo: treme e estoura em branco
        tremor = Math.max(0, tremor - dt * 30);
        const k = Math.max(tremor, bateu && t < tf ? P.tremor * 0.5 * b : 0);
        alvo.style.translate = k > 0.3 && !calmo ? rnd(-k, k) + 'px ' + rnd(-k, k) + 'px' : '';
        alvo.style.filter = flash > 0.02 ? 'brightness(' + (1 + flash * 1.4 * P.forca) + ')' : f0;

        if (t < fim) requestAnimationFrame(quadro);
        else { cv.remove(); alvo.style.translate = ''; alvo.style.filter = f0; if (op.onFim) { try { op.onFim(); } catch (e) { console.error(e); } } resolve(); }
      }
      requestAnimationFrame(quadro);
    });
  };

  /* ---------------- SOM (Web Audio, tudo sintetizado) ---------------- */
  let ac, bus;
  function audio(vol) {
    const C = global.AudioContext || global.webkitAudioContext;
    if (!C) return null;
    if (!ac) { ac = new C(); const comp = ac.createDynamicsCompressor(); bus = ac.createGain(); bus.connect(comp); comp.connect(ac.destination); }
    if (ac.state === 'suspended') ac.resume();
    bus.gain.value = vol;
    return ac;
  }
  function env(g, t, atk, dur, vol) { g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + atk); g.gain.exponentialRampToValueAtTime(0.0001, t + dur); }
  function sopro(t, dur, f0, f1, q, vol, atk, tipo) {   // ruído filtrado com varredura
    const n = Math.ceil(ac.sampleRate * dur), b = ac.createBuffer(1, n, ac.sampleRate), d = b.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
    const s = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain();
    s.buffer = b; f.type = tipo || 'bandpass'; f.Q.value = q;
    f.frequency.setValueAtTime(f0, t); f.frequency.exponentialRampToValueAtTime(f1, t + dur);
    env(g, t, Math.max(0.001, dur * (atk || 0.3)), dur, vol);
    s.connect(f); f.connect(g); g.connect(bus); s.start(t); s.stop(t + dur);
  }
  function tom(t, tipo, f0, f1, dur, vol, lp, atk) {   // oscilador com varredura de tom, filtro e ataque opcionais
    const o = ac.createOscillator(), g = ac.createGain();
    o.type = tipo; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f1, t + dur);
    env(g, t, atk ? dur * atk : 0.01, dur, vol); o.connect(g);
    if (lp) { const f = ac.createBiquadFilter(); f.type = 'lowpass'; f.frequency.setValueAtTime(lp[0], t); f.frequency.exponentialRampToValueAtTime(lp[1], t + dur); g.connect(f); f.connect(bus); } else g.connect(bus);
    o.start(t); o.stop(t + dur);
  }
  function zap(t, n, vol) { for (let k = 0; k < n; k++) sopro(t + k * 0.02 + rnd(0, 0.012), 0.014, rnd(2800, 6000), 2500, 1, vol, 0.2, 'highpass'); }

  function somLaser(P, n) {
    const t = ac.currentTime + 0.01, tc = P.carga / 1000, tb = t + tc, dur = P.feixe / 1000, f = P.forca, pf = [0, 1, 0.85, 0.7][n];
    tom(t, 'sawtooth', 180 * pf, 1500 * pf, tc, 0.22, [400, 6000], 0.95);        // carga subindo
    sopro(t, tc, 1800, 9000, 0.9, 0.14, 0.95);                                    // chiado de energia
    if (n === 3) { tom(t + tc * 0.42, 'sawtooth', 700, 90, 0.2, 0.25, [3000, 200]); zap(t + tc * 0.42, 5, 0.35); }   // carga falha e recomeça

    // feixe: zumbido grave com tremolo, apagando junto com as falhas visuais
    const am = ac.createGain(), g = ac.createGain(), lp = ac.createBiquadFilter(), lfo = ac.createOscillator(), lg = ac.createGain(), vol = 0.28 * f + 0.05;
    am.gain.value = 0.6; lfo.frequency.value = 55; lg.gain.value = 0.4; lfo.connect(lg); lg.connect(am.gain);
    lp.type = 'lowpass'; lp.frequency.setValueAtTime(1800, tb); lp.frequency.linearRampToValueAtTime(900, tb + dur);
    g.gain.setValueAtTime(0.0001, tb); g.gain.linearRampToValueAtTime(vol, tb + 0.03);
    for (let k = 0; k * 0.035 < dur - 0.1; k++) g.gain.setValueAtTime(vol * porta(P, k * 35), tb + 0.03 + k * 0.035);
    g.gain.setValueAtTime(vol * 0.5, tb + dur - 0.1); g.gain.linearRampToValueAtTime(0.0001, tb + dur);
    [[110, 'sawtooth'], [113.5, 'sawtooth'], [220, 'square']].forEach(function (a) {
      const o = ac.createOscillator(); o.type = a[1];
      o.frequency.setValueAtTime(a[0] * pf, tb); o.frequency.linearRampToValueAtTime(a[0] * pf * (n === 3 ? 0.6 : 1), tb + dur);
      o.connect(am); o.start(tb); o.stop(tb + dur);
    });
    am.connect(g); g.connect(lp); lp.connect(bus); lfo.start(tb); lfo.stop(tb + dur);
    sopro(tb, dur, 3500, 3000, 0.8, 0.2 * f + 0.03, 0.1, 'highpass');             // fssh do feixe

    tom(tb + 0.02, 'sine', 130, 34, 0.5, 0.8 * f + 0.1);                           // estrondo do impacto
    zap(tb + 0.02, 3 + (6 * f | 0), 0.4 * f + 0.1);                                // estalos
    sopro(tb + 0.02, 0.35, 5000, 1800, 1, 0.3 * f, 0.1);                           // chiado do alvo queimando
    tom(tb + dur, 'sawtooth', 900 * pf, 60, 0.55, 0.2, [3000, 180]);               // descarga: a energia vai embora
    if (n === 3) { zap(tb + dur + 0.1, 3, 0.3); tom(tb + dur + 0.35, 'square', 440, 440, 0.1, 0.1); }   // sobra um estalo e um bipe de bateria
  }
})(window);
