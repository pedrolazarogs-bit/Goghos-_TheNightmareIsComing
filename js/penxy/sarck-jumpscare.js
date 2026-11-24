/*!
 * Efeitos do SARCK (JS puro, sem áudio externo)
 *   Jumpscare ..... Efeitos.jumpscare(cartaSarck, cartaAtacante, opções)   passiva: quem o atacar (e não o matar) é eliminado
 *   Steel Jaw ..... Efeitos.mandibula(cartaSarck, cartaAlvo, opções)       só a mordida de aço, sem o susto
 *
 *   // o inimigo atacou o Sarck e ele sobreviveu ao golpe:
 *   await Efeitos.jumpscare(sarck, atacante, { onImpacto: () => removerCarta(atacante) });
 *
 * Jumpscare: o mundo escurece enquanto ondas de som varrem o campo (ele é cego e ouve tudo), silêncio, e então o Sarck
 * salta na tela com um grito, mandíbulas de aço esmagam o atacante e a carta se despedaça.
 *
 * Opções: onImpacto() no instante da mordida · onFim() · som (true) · volume (0.8)
 *         matar (true): a carta alvo se despedaça e fica oculta · restaurar (false): reexibe a carta alvo no fim (útil em testes)
 * Retorna uma Promise resolvida no fim. O som só toca depois de um toque/clique do jogador.
 * Regra da passiva: se o golpe matar o Sarck, não chame o Jumpscare.
 */
(function (global) {
  'use strict';
  const Efeitos = global.Efeitos = global.Efeitos || {};
  const calmo = !!(global.matchMedia && global.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const rnd = (a, b) => a + Math.random() * (b - a);

  /* ---------------- DESENHO ---------------- */
  // duas fileiras de dentes de aço que se encaixam; D = distância de abertura em px (0 = fechado)
  function mandibulas(g, cx, cy, Wj, hj, D, esc) {
    const n = 7, pw = Wj / n, x0 = cx - Wj / 2;
    [true, false].forEach(function (sup) {
      const dir = sup ? 1 : -1, base = cy - dir * (hj * 0.55 + D), ph = hj * 0.5, py = sup ? base - ph : base;
      const gp = g.createLinearGradient(0, py, 0, py + ph);
      gp.addColorStop(0, sup ? '#7d889a' : '#2a303b'); gp.addColorStop(1, sup ? '#2a303b' : '#7d889a');
      g.fillStyle = gp; g.strokeStyle = '#0f1218'; g.lineWidth = 3 * esc;
      g.beginPath(); g.rect(x0 - pw * 0.3, py, Wj + pw * 0.6, ph); g.fill(); g.stroke();
      g.fillStyle = '#c9d2de';
      for (let i = 0; i <= n; i++) { g.beginPath(); g.arc(x0 + i * pw, py + ph / 2, 3 * esc, 0, 6.3); g.fill(); }   // rebites
      for (let i = 0; i < n; i++) {
        const x = x0 + (sup ? 0 : pw / 2) + i * pw, len = hj * (0.8 + 0.4 * Math.sin(i * 1.7 + (sup ? 0 : 1)));
        const gt = g.createLinearGradient(x, 0, x + pw, 0);
        gt.addColorStop(0, '#f1f5fb'); gt.addColorStop(0.5, '#9aa6b8'); gt.addColorStop(1, '#3b4252');
        g.fillStyle = gt; g.beginPath(); g.moveTo(x, base); g.lineTo(x + pw, base); g.lineTo(x + pw / 2, base + dir * len); g.closePath(); g.fill(); g.stroke();
      }
    });
  }
  function estilhacar(alvo, r) {   // a carta se parte em 8 pedaços que voam
    const pts = [[0, 0], [50, 0], [100, 0], [100, 50], [100, 100], [50, 100], [0, 100], [0, 50]], cx = 50 + rnd(-8, 8), cy = 50 + rnd(-8, 8);
    for (let i = 0; i < 8; i++) {
      const a = pts[i], b = pts[(i + 1) % 8], mx = (cx + a[0] + b[0]) / 3, my = (cy + a[1] + b[1]) / 3;
      const c = alvo.cloneNode(true); c.removeAttribute('id'); c.removeAttribute('data-battle-card'); c.inert=true; c.setAttribute('aria-hidden','true'); c.querySelectorAll('[id]').forEach(el=>el.removeAttribute('id'));
      Object.assign(c.style, { position: 'fixed', left: r.left + 'px', top: r.top + 'px', width: r.width + 'px', height: r.height + 'px', margin: 0, boxSizing: 'border-box', pointerEvents: 'none', zIndex: 99998,
        transition: 'none', visibility: 'visible', transformOrigin: mx + '% ' + my + '%',
        clipPath: 'polygon(' + cx + '% ' + cy + '%,' + a[0] + '% ' + a[1] + '%,' + b[0] + '% ' + b[1] + '%)' });
      document.body.appendChild(c);
      const vx = (mx - 50) / 50 * r.width * 0.7 + rnd(-20, 20), vy = (my - 50) / 50 * r.height * 0.5 + 260;
      try { c.animate([{ translate: '0px 0px', rotate: '0deg', opacity: 1 }, { translate: vx + 'px ' + vy + 'px', rotate: rnd(-300, 300) + 'deg', opacity: 0 }], { duration: 900, easing: 'cubic-bezier(.2,.7,.4,1)', fill: 'forwards' }); } catch (e) { /* sem animação */ }
      setTimeout(() => c.remove(), 950);
    }
  }

  function executar(origem, alvo, op, susto) {
    op = Object.assign({ som: true, volume: 0.8, matar: true, restaurar: false }, op);
    const TJ = susto ? 480 : 90, TI = TJ + 110, FIM = TI + 900;   // TJ: mandíbulas começam a descer · TI: mordida

    return new Promise(function (resolve) {
      const ro = origem.getBoundingClientRect(), rt = alvo.getBoundingClientRect(), W = global.innerWidth, H = global.innerHeight;
      const S = { x: ro.left + ro.width / 2, y: ro.top + ro.height / 2 }, T = { x: rt.left + rt.width / 2, y: rt.top + rt.height / 2 };
      const dx = T.x - S.x, dy = T.y - S.y, dist = Math.hypot(dx, dy) || 1, esc = Math.max(0.5, Math.min(1.6, Math.sqrt(rt.width * rt.height) / 260));
      const Wj = rt.width * 1.3, hj = rt.height * 0.3, D0 = rt.height * 0.8;

      const cv = document.createElement('canvas'), dpr = Math.min(global.devicePixelRatio || 1, 2);
      cv.width = W * dpr; cv.height = H * dpr;
      Object.assign(cv.style, { position: 'fixed', left: 0, top: 0, width: W + 'px', height: H + 'px', pointerEvents: 'none', zIndex: 99999 });
      document.body.appendChild(cv);
      const g = cv.getContext('2d'); g.scale(dpr, dpr);

      const pos0 = origem.style.position, z0 = origem.style.zIndex, vis0 = alvo.style.visibility;
      if (global.getComputedStyle(origem).position === 'static') origem.style.position = 'relative';
      origem.style.zIndex = 99997;   // o Sarck fica na frente de tudo ao saltar
      const cr = susto ? 330 : 10, lg = susto ? 410 : 90, ld = dx * 0.5 + 'px ' + dy * 0.5 + 'px';
      try {
        origem.animate([
          { translate: '0px 0px', scale: '1', offset: 0 },
          { translate: '0px 0px', scale: '0.95', offset: cr / FIM, easing: 'cubic-bezier(.1,.9,.2,1)' },   // agacha e ouve
          { translate: ld, scale: '1.35', offset: lg / FIM },                                            // salta
          { translate: ld, scale: '1.35', offset: (TI + 350) / FIM },
          { translate: '0px 0px', scale: '1', offset: 1 }], { duration: FIM, easing: 'ease-in-out' });
        alvo.animate([{ translate: '0px 0px', scale: '1' }, { translate: dx * 0.06 + 'px ' + dy * 0.06 + 'px', scale: '0.93', offset: 0.3 }, { translate: dx * 0.06 + 'px ' + dy * 0.06 + 'px', scale: '0.93' }], { duration: TI - lg + 20, delay: lg });   // o atacante recua assustado
      } catch (e) { /* sem suporte: segue sem o movimento das cartas */ }

      if (op.som && audio(op.volume)) somSarck(susto, TJ);

      let t = 0, ult = performance.now(), ps = [], bateu = false, tremor = 0, flashI = 0;

      function impacto() {
        bateu = true; tremor = calmo ? 0 : 14; flashI = 1;
        if (op.matar) { estilhacar(alvo, rt); alvo.style.visibility = 'hidden'; }
        for (let i = 0; i < 34; i++) { const a = (Math.random() < 0.5 ? 0 : Math.PI) + rnd(-0.6, 0.6), v = rnd(200, 800) * esc; ps.push({ x: T.x + rnd(-rt.width * 0.5, rt.width * 0.5), y: T.y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 100, g: 600, v: rnd(0.25, 0.6), m: 0.6, k: 0 }); }   // faíscas de aço
        for (let i = 0; i < 9; i++) ps.push({ x: T.x + rnd(-rt.width * 0.5, rt.width * 0.5), y: T.y + rnd(-10, 10), vx: rnd(-60, 60), vy: -rnd(20, 80), g: 0, v: 1, m: 1, r: rnd(14, 28) * esc, k: 1 });   // poeira
        if (op.onImpacto) { try { op.onImpacto(); } catch (e) { console.error(e); } }
      }

      function quadro(agora) {
        if (op.signal?.aborted || op.encerrar?.()) { cv.remove(); origem.style.zIndex=z0; origem.style.position=pos0; alvo.style.visibility=vis0; resolve(); return; }
        if (op.pausado?.()) { ult=agora; requestAnimationFrame(quadro); return; }
        const dt = Math.min(0.05, Math.max(0, (agora - ult) / 1000)); ult = agora; t += dt * 1000;
        g.clearRect(0, 0, W, H);
        tremor = Math.max(0, tremor - dt * 28);
        g.save(); if (tremor > 0.3) g.translate(rnd(-tremor, tremor), rnd(-tremor, tremor));

        if (susto) {   // escurece nas bordas (visão de túnel)
          const dim = 0.7 * Math.min(1, t / 330) * (t < TI + 450 ? 1 : Math.max(0, 1 - (t - TI - 450) / 350));
          if (dim > 0.01) {
            const gr = g.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.25, W / 2, H / 2, Math.hypot(W, H) * 0.55);
            gr.addColorStop(0, 'rgba(5,0,12,0)'); gr.addColorStop(1, 'rgba(5,0,12,' + dim + ')'); g.fillStyle = gr; g.fillRect(-20, -20, W + 40, H + 40);
          }
          if (t < 330) for (let i = 0; i < 3; i++) {   // ondas de som: ele é cego, ouve tudo
            const u = (t - i * 90) / 330; if (u <= 0) continue;
            g.strokeStyle = 'rgba(205,175,255,' + 0.55 * (1 - u) + ')'; g.lineWidth = 2.5 * esc; g.beginPath(); g.arc(S.x, S.y, u * dist * 1.15, 0, 6.3); g.stroke();
          }
          const tf = t - 340;
          if (tf >= 0 && tf < 190) {   // o susto: clarão vermelho e branco, falhas na tela
            if (tf < 150) { g.fillStyle = 'rgba(255,40,50,' + 0.55 * (1 - tf / 150) + ')'; g.fillRect(-20, -20, W + 40, H + 40); }
            if (tf < 60) { g.fillStyle = 'rgba(255,255,255,' + 0.85 * (1 - tf / 60) + ')'; g.fillRect(-20, -20, W + 40, H + 40); }
            for (let i = 0; i < 7; i++) { g.fillStyle = Math.random() < 0.5 ? 'rgba(190,120,255,.5)' : 'rgba(255,255,255,.45)'; g.fillRect(rnd(-20, W * 0.5), rnd(0, H), rnd(W * 0.3, W), rnd(2, 14)); }
          }
        }

        if (t >= TJ) {   // mandíbulas descem, mordem e recuam
          const c = Math.min(1, (t - TJ) / 110), r = Math.max(0, Math.min(1, (t - TI - 260) / 260));
          const D = t < TI + 260 ? (1 - c * c * c) * D0 : r * r * D0;
          if (D < D0 - 1) mandibulas(g, T.x, T.y, Wj, hj, D, esc);
        }
        if (!bateu && t >= TI) impacto();

        flashI = Math.max(0, flashI - dt * 6);
        if (flashI > 0) { const r = 140 * esc, gr = g.createRadialGradient(T.x, T.y, 0, T.x, T.y, r); gr.addColorStop(0, 'rgba(255,255,255,' + flashI + ')'); gr.addColorStop(1, 'rgba(180,200,255,0)'); g.fillStyle = gr; g.fillRect(T.x - r, T.y - r, r * 2, r * 2); }
        ps = ps.filter(p => p.v > 0);
        for (const p of ps) {
          p.x += p.vx * dt; p.y += p.vy * dt; p.vy += p.g * dt; p.v -= dt;
          if (p.k === 1) { p.r += 24 * dt; g.fillStyle = 'rgba(130,120,145,' + 0.3 * Math.max(0, p.v) + ')'; g.beginPath(); g.arc(p.x, p.y, p.r, 0, 6.3); g.fill(); }
          else { g.strokeStyle = Math.random() < 0.5 ? '#fff4c4' : '#c8d6ff'; g.globalAlpha = Math.max(0, p.v / p.m); g.lineWidth = 2 * esc; g.beginPath(); g.moveTo(p.x, p.y); g.lineTo(p.x - p.vx * 0.03, p.y - p.vy * 0.03); g.stroke(); g.globalAlpha = 1; }
        }
        g.restore();

        if (t < FIM) requestAnimationFrame(quadro);
        else {
          cv.remove(); origem.style.zIndex = z0; origem.style.position = pos0;
          if (!op.matar || op.restaurar) alvo.style.visibility = vis0;
          if (op.onFim) { try { op.onFim(); } catch (e) { console.error(e); } }
          resolve();
        }
      }
      requestAnimationFrame(quadro);
    });
  }
  Efeitos.jumpscare = (origem, alvo, op) => executar(origem, alvo, op, true);
  Efeitos.mandibula = (origem, alvo, op) => executar(origem, alvo, op, false);

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
  function tom(t, tipo, f0, f1, dur, vol, atk) {   // atk: fração da duração até o pico (pequena = ataque seco, ~1 = crescendo)
    const o = ac.createOscillator(), g = ac.createGain();
    o.type = tipo; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f1, t + dur);
    env(g, t, atk ? dur * atk : 0.01, dur, vol); o.connect(g); g.connect(bus); o.start(t); o.stop(t + dur);
  }
  function somSarck(susto, TJ) {
    const t = ac.currentTime + 0.01, ti = t + (TJ + 110) / 1000;
    if (susto) {
      [0, 0.09, 0.18].forEach(function (d) { tom(t + d, 'sine', 1500, 1500, 0.3, 0.07); tom(t + d + 0.12, 'sine', 1500, 1500, 0.25, 0.035); });   // ondas de som (sonar) e seus ecos
      tom(t, 'sine', 50, 80, 0.33, 0.2, 0.95);                                                                                              // tensão subindo, depois um instante de silêncio
      const ts = t + 0.34;
      sopro(ts, 0.55, 3000, 1200, 0.5, 0.9, 0.02);                                                                                           // o grito: ruído + tons agudos desafinados
      tom(ts, 'sawtooth', 2000, 1300, 0.5, 0.3, 0.02); tom(ts, 'sawtooth', 2090, 1360, 0.5, 0.3, 0.02); tom(ts, 'square', 3100, 2000, 0.4, 0.15, 0.02);
      tom(ts, 'sine', 70, 28, 0.7, 1.0);                                                                                                     // estrondo grave junto com o grito
    }
    sopro(ti - 0.11, 0.11, 400, 2500, 1, 0.5, 0.8); sopro(ti - 0.12, 0.12, 2000, 6000, 6, 0.3, 0.5);   // mandíbulas descendo
    [1, 2.756, 5.404, 8.933].forEach(function (m, i) { tom(ti, 'sine', 420 * m, 420 * m, 1.2 / (1 + i * 0.7), 0.35 / (1 + i * 0.8)); });   // clangor de aço
    sopro(ti, 0.3, 900, 150, 0.8, 0.8, 0.05, 'lowpass');                                                                                       // esmagando
    tom(ti, 'sine', 100, 28, 0.5, 1.0);
    for (let k = 0; k < 20; k++) sopro(ti + rnd(0, 0.5), 0.015, rnd(1500, 5000), rnd(800, 2500), 1.5, rnd(0.2, 0.5), 0.1);                      // ossos e metal estalando
    for (let k = 0; k < 8; k++) tom(ti + 0.05 + rnd(0, 0.5), 'sine', rnd(2500, 5000), rnd(2500, 5000), 0.06, 0.08);                              // estilhaços tilintando
    sopro(ti + 0.3, 0.25, 3000, 800, 4, 0.2);                                                                                                  // mandíbulas rangendo ao abrir
  }
})(window);
