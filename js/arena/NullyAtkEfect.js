/*!
 * Efeitos.katana — corte de katana para jogo de cartas (JS puro, sem dependências, sem arquivos de áudio)
 *
 *   Efeitos.katana(elemento, { tipo: 'normal' })   // corte ágil e limpo
 *   Efeitos.katana(elemento, { tipo: 'brutal' })   // decapitação: mira, hit-stop, cabeça voa, sangue
 *
 * Opções (todas opcionais)
 *   onImpacto()  chamado no instante exato do golpe (aplique o dano aqui)
 *   onFim()      chamado quando tudo termina
 *   volume       0 a 1 (padrão 0.8)        som        false para silenciar
 *   inverter     true espelha a direção     restaurar  false mantém o alvo oculto no fim (se a carta morre)
 *
 * Retorna uma Promise:  await Efeitos.katana(carta, { tipo: 'brutal' });
 * Observação: o navegador só libera o som após um toque/clique; chame a partir de uma ação do jogador.
 */
(function (global) {
  'use strict';
  const Efeitos = global.Efeitos = global.Efeitos || {};
  const calmo = !!(global.matchMedia && global.matchMedia('(prefers-reduced-motion: reduce)').matches);

  // tempos em ms: ant = antecipação, golpe = duração do traço, fade = dissolução, total = duração do efeito
  const PERFIL = {
    normal: { ant: 0,   golpe: 120, fade: 260, total: 560,  larg: 15, glow: '#5cc8ff', nucleo: '#ffffff', faiscas: 18, sangue: 0,  tremor: 5,  brilho: 1.2 },
    brutal: { ant: 190, golpe: 90,  fade: 380, total: 1500, larg: 30, glow: '#ff1f3d', nucleo: '#fff1ee', faiscas: 36, sangue: 34, tremor: 16, brilho: 2.4, parada: 80 }
  };

  /* ---------------- SOM (Web Audio, tudo sintetizado) ---------------- */
  let ac, bus;
  const rnd = (a, b) => a + Math.random() * (b - a);
  function audio(vol) {
    const C = global.AudioContext || global.webkitAudioContext;
    if (!C) return null;
    if (!ac) {
      ac = new C();
      const comp = ac.createDynamicsCompressor(), conv = ac.createConvolver(), wet = ac.createGain();
      // eco curto de sala estéreo: dá corpo e realismo ao corte
      const n = Math.floor(ac.sampleRate * 0.7), ir = ac.createBuffer(2, n, ac.sampleRate);
      for (let c = 0; c < 2; c++) { const d = ir.getChannelData(c); for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 3.5); }
      conv.buffer = ir; wet.gain.value = 0.18;
      bus = ac.createGain();
      bus.connect(comp); bus.connect(conv); conv.connect(wet); wet.connect(comp); comp.connect(ac.destination);
    }
    if (ac.state === 'suspended') ac.resume().catch(() => {});
    bus.gain.value = vol;
    return ac;
  }
  function ruido(dur) {
    const n = Math.ceil(ac.sampleRate * dur), b = ac.createBuffer(1, n, ac.sampleRate), d = b.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
    return b;
  }
  function env(g, t, atk, dur, vol) {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + atk);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  }
  // ruído filtrado com varredura de frequência (atk = fração da duração até o pico)
  function sopro(t, dur, f0, f1, q, vol, atk, tipo) {
    const s = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain();
    s.buffer = ruido(dur); f.type = tipo || 'bandpass'; f.Q.value = q;
    f.frequency.setValueAtTime(f0, t); f.frequency.exponentialRampToValueAtTime(f1, t + dur);
    env(g, t, Math.max(0.001, dur * (atk || 0.3)), dur, vol);
    s.connect(f); f.connect(g); g.connect(bus); s.start(t); s.stop(t + dur);
  }
  // lâmina cortando o ar: o tom sobe até a passagem (pk) e cai logo depois (efeito Doppler)
  function passagem(t, dur, fa, fp, fb, q, vol, pk) {
    const s = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain();
    s.buffer = ruido(dur); f.type = 'bandpass'; f.Q.value = q;
    f.frequency.setValueAtTime(fa, t);
    f.frequency.exponentialRampToValueAtTime(fp, t + dur * pk);
    f.frequency.exponentialRampToValueAtTime(fb, t + dur);
    env(g, t, dur * pk, dur, vol);
    s.connect(f); f.connect(g); g.connect(bus); s.start(t); s.stop(t + dur);
  }
  // oscilador com queda de tom: peso do impacto
  function tom(t, tipo, f0, f1, dur, vol) {
    const o = ac.createOscillator(), g = ac.createGain();
    o.type = tipo; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f1, t + dur);
    env(g, t, 0.003, dur, vol);
    o.connect(g); g.connect(bus); o.start(t); o.stop(t + dur);
  }
  // vibração do aço: parciais de uma barra metálica, cada um com um par levemente desafinado
  function tinido(t, base, dur, vol) {
    [1, 2.756, 5.404, 8.933].forEach((m, i) => {
      const f = base * m; if (f > 15000) return;
      const d = dur / (1 + i * 0.9), a = vol / (1 + i * 0.7);
      tom(t, 'sine', f, f, d, a); tom(t, 'sine', f * 1.004, f * 1.004, d, a * 0.6);
    });
  }
  // lâmina raspando na bainha: ruído estreito e agudo com rugosidade (modulação)
  function saque(t) {
    const dur = 0.18, s = ac.createBufferSource(), f = ac.createBiquadFilter(), am = ac.createGain(), g = ac.createGain(), lfo = ac.createOscillator(), lg = ac.createGain();
    s.buffer = ruido(dur); f.type = 'bandpass'; f.Q.value = 12;
    f.frequency.setValueAtTime(2600, t); f.frequency.exponentialRampToValueAtTime(7500, t + dur);
    am.gain.value = 0.55; lfo.frequency.value = 85; lg.gain.value = 0.45; lfo.connect(lg); lg.connect(am.gain);
    env(g, t, dur * 0.5, dur, 0.22);
    s.connect(f); f.connect(am); am.connect(g); g.connect(bus);
    s.start(t); s.stop(t + dur); lfo.start(t); lfo.stop(t + dur);
    tinido(t + dur - 0.02, 2600, 0.45, 0.06);   // lâmina livre da bainha
  }
  function somNormal() {
    const t = ac.currentTime + 0.01, ti = t + 0.06, v = rnd(0.94, 1.06);   // v: variação para não soar repetido
    passagem(t, 0.1, 1800 * v, 5200 * v, 2200 * v, 5, 0.5, 0.6);    // fiu agudo e fino
    passagem(t, 0.1, 500 * v, 1100 * v, 450 * v, 1.2, 0.3, 0.6);    // corpo do vento
    sopro(ti, 0.006, 5000, 5000, 0.7, 0.45, 0.2, 'highpass');         // transiente do fio
    sopro(ti, 0.1, 6000, 900, 0.9, 0.6, 0.08);                         // shk: lâmina atravessando
    tom(ti, 'sine', 170 * v, 60, 0.13, 0.3);                           // peso do golpe
    tinido(ti, 1700 * v, 1.0, 0.09);                                   // aço vibrando
  }
  function somBrutal() {
    const t = ac.currentTime + 0.01, ts = t + 0.19, ti = ts + 0.045, v = rnd(0.94, 1.06);
    saque(t);                                                           // shiiing
    passagem(ts, 0.09, 1400 * v, 4600 * v, 1800 * v, 4, 0.6, 0.5);   // swish rápido
    passagem(ts, 0.1, 350 * v, 900 * v, 300 * v, 1, 0.45, 0.5);      // vento pesado
    sopro(ti, 0.006, 4000, 4000, 0.7, 0.55, 0.2, 'highpass');         // fio da lâmina
    sopro(ti, 0.13, 5500, 600, 0.8, 0.75, 0.06);                       // corte fundo
    sopro(ti + 0.01, 0.025, 1800, 1500, 4, 0.55, 0.1);                 // osso estalando
    sopro(ti + 0.01, 0.22, 450, 140, 2, 0.5, 0.15);                    // carne cedendo
    sopro(ti + 0.03, 0.45, 3000, 1400, 0.6, 0.13, 0.15, 'highpass');   // sangue esguichando
    tom(ti, 'sine', 130 * v, 30, 0.5, 0.75);                           // impacto grave
    tom(ti, 'triangle', 260 * v, 70, 0.1, 0.3);                        // corpo do golpe
    tinido(ti, 1300 * v, 1.3, 0.14);                                   // aço vibrando
    passagem(ti + 0.1, 0.5, 1000 * v, 1100 * v, 350 * v, 0.8, 0.18, 0.2); // cabeça girando e se afastando
  }

  /* ---------------- DESENHO ---------------- */
  function bez(A, C, B, t) {
    const u = 1 - t;
    return { x: u * u * A.x + 2 * u * t * C.x + t * t * B.x, y: u * u * A.y + 2 * u * t * C.y + t * t * B.y };
  }
  // traço de lâmina: fino na cauda, ponta afiada na frente
  function lamina(g, A, C, B, cab, cau, larg, glow, cor, alfa) {
    const n = 24, c = [], e = [], d = [];
    for (let i = 0; i <= n; i++) c.push(bez(A, C, B, cau + (cab - cau) * i / n));
    for (let i = 0; i <= n; i++) {
      const a = c[Math.max(0, i - 1)], b = c[Math.min(n, i + 1)];
      let dx = b.x - a.x, dy = b.y - a.y; const l = Math.hypot(dx, dy) || 1; dx /= l; dy /= l;
      const u = i / n, w = larg * Math.pow(u, 0.7) * (1 - Math.pow(u, 10));
      e.push({ x: c[i].x - dy * w, y: c[i].y + dx * w });
      d.push({ x: c[i].x + dy * w, y: c[i].y - dx * w });
    }
    g.save();
    g.globalAlpha = alfa; g.shadowColor = glow; g.shadowBlur = 22; g.fillStyle = cor;
    g.beginPath(); g.moveTo(e[0].x, e[0].y);
    for (let i = 1; i <= n; i++) g.lineTo(e[i].x, e[i].y);
    for (let i = n; i >= 0; i--) g.lineTo(d[i].x, d[i].y);
    g.closePath(); g.fill(); g.restore();
  }

  // Unlock the mobile audio context during the player's start gesture, including for bot attacks.
  Efeitos.prepararSom = function () {
    try { audio(0.8); } catch (_) { /* O efeito visual funciona sem áudio. */ }
  };

  Efeitos.katana = function (alvo, op) {
    op = Object.assign({ tipo: 'normal', som: true, volume: 0.8, inverter: false, restaurar: true }, op);
    const brutal = op.tipo === 'brutal', P = brutal ? PERFIL.brutal : PERFIL.normal;

    return new Promise(function (resolve) {
      if (op.signal && op.signal.aborted) { resolve(); return; }
      const r = alvo.getBoundingClientRect(), w = r.width, h = r.height;
      const W = global.innerWidth, H = global.innerHeight;

      // trajetória do golpe A -> B (com leve curva no corte normal; reto na decapitação)
      let A, B;
      if (brutal) { A = { x: r.left - 0.35 * w, y: r.top + 0.35 * h }; B = { x: r.right + 0.35 * w, y: r.top + 0.28 * h }; }
      else        { A = { x: r.right + 0.3 * w,  y: r.top - 0.2 * h };  B = { x: r.left - 0.3 * w,  y: r.bottom + 0.2 * h }; }
      if (op.inverter) { const cx = r.left + w / 2; A.x = 2 * cx - A.x; B.x = 2 * cx - B.x; }
      const arco = brutal ? 0 : 0.14, dx = B.x - A.x, dy = B.y - A.y;
      const C = { x: (A.x + B.x) / 2 - dy * arco, y: (A.y + B.y) / 2 + dx * arco };
      const ang = Math.atan2(dy, dx), dirx = dx >= 0 ? 1 : -1;
      const cutY = x => A.y + dy * (x - A.x) / dx;

      const cv = document.createElement('canvas'), dpr = Math.min(global.devicePixelRatio || 1, 2);
      cv.width = W * dpr; cv.height = H * dpr;
      Object.assign(cv.style, { position: 'fixed', left: 0, top: 0, width: W + 'px', height: H + 'px', pointerEvents: 'none', zIndex: 99999 });
      const g = cv.getContext('2d');
      if (!g || !w || !h) { if (op.onImpacto) op.onImpacto(); resolve(); return; }
      g.scale(dpr, dpr);
      cv.setAttribute('aria-hidden','true');
      document.body.appendChild(cv);

      let topo, base, frame, ps = [];
      const fl0 = alvo.style.filter, vis0 = alvo.style.visibility;
      const cab = { x: 0, y: 0, vx: w * 1.1 * dirx, vy: -h * 1.8, r: 0, vr: 260 * dirx };
      let vt = 0, tImp = 0, congela = 0, bateu = false, flash = 0, tremor = 0;

      try {
        if (op.som !== false && audio(op.volume)) (brutal ? somBrutal : somNormal)();
      } catch (_) { /* Continue com as partículas quando o som estiver indisponível. */ }

      function ponto() {
        if (brutal) { const x = r.left + Math.random() * w; return { x: x, y: cutY(x) }; }
        const m = bez(A, C, B, 0.5);
        return { x: m.x + (Math.random() - 0.5) * w * 0.3, y: m.y + (Math.random() - 0.5) * h * 0.3 };
      }
      function fatia(clip) {
        const c = document.createElement('div');
        c.setAttribute('aria-hidden','true');
        const original = alvo.querySelector('.original-card');
        if (original) {
          const copia = original.cloneNode(true);
          copia.querySelector('.card-health')?.remove();
          c.appendChild(copia);
        } else {
          c.textContent = alvo.textContent;
        }
        Object.assign(c.style, { position: 'fixed', left: r.left + 'px', top: r.top + 'px', width: w + 'px', height: h + 'px',
          margin: 0, boxSizing: 'border-box', pointerEvents: 'none', zIndex: 99998, transition: 'none', clipPath: clip });
        document.body.appendChild(c);
        return c;
      }

      function impacto() {
        bateu = true; tImp = vt; flash = 1; tremor = calmo ? 0 : P.tremor; congela = P.parada || 0;
        if (op.onImpacto) { try { op.onImpacto(); } catch (e) { console.error(e); } }
        if (brutal) {   // divide a carta em duas peças seguindo a linha do corte
          const pc = x => ((cutY(x) - r.top) / h * 100).toFixed(2), c1 = pc(r.left), c2 = pc(r.right);
          topo = fatia('polygon(0 0,100% 0,100% ' + c2 + '%,0 ' + c1 + '%)');
          base = fatia('polygon(0 ' + c1 + '%,100% ' + c2 + '%,100% 100%,0 100%)');
          topo.style.transformOrigin = '50% 15%';
          alvo.style.visibility = 'hidden';
          alvo.classList.add('katana-split');
        }
        for (let i = 0; i < P.faiscas; i++) {
          const a = ang + (Math.random() - 0.5) * 1.8 + (Math.random() < 0.25 ? Math.PI : 0), v = 250 + Math.random() * 650, vida = 0.25 + Math.random() * 0.25, o = ponto();
          ps.push({ x: o.x, y: o.y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, g: 400, v: vida, m: vida, c: Math.random() < 0.5 ? P.nucleo : P.glow });
        }
        for (let i = 0; i < P.sangue; i++) {
          const a = ang + (Math.random() - 0.5) * 2 - 0.35 * dirx, v = 150 + Math.random() * 500, vida = 0.6 + Math.random() * 0.6, o = ponto();
          ps.push({ x: o.x, y: o.y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, g: 1500, v: vida, m: vida, r: 1.5 + Math.random() * 3.5,
            c: ['#b3121f', '#7d0b14', '#d62839'][i % 3] });
        }
      }

      let ult = performance.now();
      function quadro(agora) {
        if (op.pausado && op.pausado()) { ult = agora; frame = requestAnimationFrame(quadro); return; }
        let dt = Math.max(0, Math.min(0.04, (agora - ult) / 1000)); ult = agora;
        if (congela > 0) { congela -= dt * 1000; dt = 0; }   // hit-stop: congela o efeito por instantes
        vt += dt * 1000;
        g.clearRect(0, 0, W, H);
        const pos = vt - P.ant;

        if (brutal) {   // escurece a tela durante a mira e dissolve depois
          const dim = pos < 0 ? 0.45 * vt / P.ant : Math.max(0, 0.45 * (1 - pos / 450));
          g.fillStyle = 'rgba(8,4,10,' + dim + ')'; g.fillRect(0, 0, W, H);
          if (pos < 0) {   // linha de mira cresce do centro
            const k = vt / P.ant, mx = (A.x + B.x) / 2, my = (A.y + B.y) / 2;
            g.strokeStyle = 'rgba(255,235,230,' + (0.15 + 0.6 * k) + ')'; g.lineWidth = 1.5;
            g.beginPath(); g.moveTo(mx + (A.x - mx) * k, my + (A.y - my) * k); g.lineTo(mx + (B.x - mx) * k, my + (B.y - my) * k); g.stroke();
          }
        }

        if (pos >= 0) {
          let ch, ca, al = 1;
          if (pos < P.golpe) { const x = pos / P.golpe, p = x * x * (3 - 2 * x); ch = p; ca = Math.max(0, p - 0.55); }
          else { const x = Math.min(1, (pos - P.golpe) / P.fade); ch = 1; ca = 0.45 + 0.55 * x * x; al = 1 - x; }
          if (ca < 1) {
            lamina(g, A, C, B, ch, ca, P.larg * 1.9, P.glow, P.glow, 0.55 * al);
            lamina(g, A, C, B, ch, ca, P.larg * 0.6, P.glow, P.nucleo, al);
          }
          if (!bateu && pos >= P.golpe * 0.5) impacto();
        }

        if (bateu) {
          tremor = Math.max(0, tremor - dt * P.tremor * 5);
          flash = Math.max(0, flash - dt * 5);
          const sx = (Math.random() - 0.5) * 2 * tremor, sy = (Math.random() - 0.5) * 2 * tremor;
          const fl = flash > 0.02 ? 'brightness(' + (1 + flash * P.brilho) + ')' : fl0;
          if (brutal) {
            const s = vt - tImp;
            cab.x += cab.vx * dt; cab.y += cab.vy * dt; cab.vy += h * 7 * dt; cab.r += cab.vr * dt;
            topo.style.translate = cab.x + 'px ' + cab.y + 'px'; topo.style.rotate = cab.r + 'deg';
            topo.style.opacity = Math.max(0, 1 - Math.max(0, s - 500) / 500);
            base.style.translate = sx + 'px ' + (sy + Math.min(4, s / 40)) + 'px';
            topo.style.filter = base.style.filter = fl;
            if (flash) { g.fillStyle = 'rgba(255,255,255,' + flash * 0.5 + ')'; g.fillRect(0, 0, W, H); }
          } else {
            alvo.style.translate = sx + 'px ' + sy + 'px'; alvo.style.filter = fl;
          }
        }

        ps = ps.filter(p => p.v > 0);
        for (const p of ps) {
          p.x += p.vx * dt; p.y += p.vy * dt; p.vy += p.g * dt; p.v -= dt;
          g.globalAlpha = Math.max(0, p.v / p.m);
          if (p.r) { g.fillStyle = p.c; g.beginPath(); g.arc(p.x, p.y, p.r, 0, 6.3); g.fill(); }
          else { g.strokeStyle = p.c; g.lineWidth = 2; g.beginPath(); g.moveTo(p.x, p.y); g.lineTo(p.x - p.vx * 0.035, p.y - p.vy * 0.035); g.stroke(); }
        }
        g.globalAlpha = 1;

        if (vt < P.total) frame = requestAnimationFrame(quadro); else fim();
      }

      function fim() {
        cancelAnimationFrame(frame);
        if (op.signal) op.signal.removeEventListener('abort', fim);
        alvo.classList.remove('katana-split');
        cv.remove(); if (topo) topo.remove(); if (base) base.remove();
        alvo.style.translate = ''; alvo.style.rotate = ''; alvo.style.filter = fl0;
        if (op.restaurar) alvo.style.visibility = vis0;
        if (op.onFim) { try { op.onFim(); } catch (e) { console.error(e); } }
        resolve();
      }

      if (op.signal) op.signal.addEventListener('abort', fim, {once:true});
      frame = requestAnimationFrame(quadro);
    });
  };
})(window);
