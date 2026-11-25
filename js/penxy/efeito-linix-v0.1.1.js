/*!
 * Efeito do LINIX v0.1.1 (JS puro, sem áudio externo) — corte de garras estilo anime
 *   Afiação 5 ..... Efeitos.afiacao(cartaLinix, cartaAlvo, opções)   passiva: causa 45% do dano com base na vida TOTAL do alvo
 *
 *   const res = await Efeitos.afiacao(linix, inimigo, { vidaTotal: inimigo.vidaMax, onImpacto: (x) => aplicarDano(x.dano) });
 *   // res = { dano, pct }   → dano = round(vidaTotal × 0.45)
 *
 * Opções: vidaTotal (vida total do alvo, padrão 500) · pct (0.45) · onImpacto({dano, pct}) no instante do dano · onFim() · som (true) · volume (0.8)
 * O dano é calculado aqui só para exibir; aplique o dano real no seu jogo. A intensidade cresce com a vida total do alvo
 * (quanto maior a resistência, maior a destruição), numa faixa de 100 (leve) a 800 (máxima) de vida; a partir de ~550 a tela racha. Durante o efeito as cartas usam translate/scale/rotate CSS.
 * O som só toca depois de um toque/clique do jogador.
 */
(function (global) {
  'use strict';
  const Efeitos = global.Efeitos = global.Efeitos || {};
  const calmo = !!(global.matchMedia && global.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const rnd = (a, b) => a + Math.random() * (b - a), cl = u => Math.max(0, Math.min(1, u)), ease = u => u * u * (3 - 2 * u);
  const pop = u => { const c = 1.70158; return 1 + (c + 1) * Math.pow(u - 1, 3) + c * Math.pow(u - 1, 2); };

  /* ---------------- DESENHO ---------------- */
  function texto(g, s, x, y, tam, rot, fill, stroke) {
    g.save(); g.translate(x, y); g.rotate(rot); g.font = '900 ' + tam + 'px "Arial Black",Impact,sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round';
    g.lineWidth = tam * 0.18; g.strokeStyle = stroke; g.strokeText(s, 0, 0); g.fillStyle = fill; g.fillText(s, 0, 0); g.restore();
  }
  function garra(g, x, y, L, a, off, w, pr, al, cor) {   // um risco de garra: afina nas pontas e cresce de uma ponta à outra (pr 0..1)
    const c = Math.cos(a), s = Math.sin(a), n = 16, cx = x - s * off, cy = y + c * off, pts = [];
    for (let k = 0; k <= n; k++) { const u = k / n * pr, d = (u - 0.5) * L, h = w * Math.pow(Math.sin(Math.PI * u), 0.7), bow = Math.sin(Math.PI * u) * w * 1.6; pts.push([d, h, bow]); }
    g.save(); g.globalAlpha = al; g.fillStyle = cor || '#fffbe6'; g.shadowColor = cor ? 'transparent' : '#ffc233'; g.shadowBlur = cor ? 0 : 16; g.beginPath();
    pts.forEach(q => g.lineTo(cx + c * q[0] - s * (q[1] + q[2]), cy + s * q[0] + c * (q[1] + q[2])));
    pts.reverse().forEach(q => g.lineTo(cx + c * q[0] - s * (q[2] - q[1]), cy + s * q[0] + c * (q[2] - q[1])));
    g.closePath(); g.fill(); g.restore();
  }
  function brilho(g, x, y, r, al) {   // brilho de 4 pontas: a manopla reluzindo
    g.save(); g.globalAlpha = al; g.fillStyle = '#fffbe6'; g.shadowColor = '#ffc233'; g.shadowBlur = 14; g.beginPath();
    for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4 - Math.PI / 2, d = i % 2 ? r * 0.2 : r; g.lineTo(x + Math.cos(a) * d, y + Math.sin(a) * d); }
    g.closePath(); g.fill(); g.restore();
  }
  function foco(g, x, y, W, H, r0, n, sd, cor, al, w) {   // linhas de velocidade de anime: grossas fora, finas no centro
    g.save(); g.fillStyle = cor; g.globalAlpha = al; const R = Math.hypot(W, H);
    for (let i = 0; i < n; i++) {
      const sn = Math.sin((i + 1) * 78.233 + sd * 12.9898) * 43758.5453, f = sn - Math.floor(sn), a = (i + f * 0.9) * 6.2832 / n, l = R * (0.45 + f * 0.55), q = w * (0.5 + f), r = r0 * (0.8 + f * 0.6);
      g.beginPath(); g.moveTo(x + Math.cos(a - q) * l, y + Math.sin(a - q) * l); g.lineTo(x + Math.cos(a + q) * l, y + Math.sin(a + q) * l); g.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); g.closePath(); g.fill();
    }
    g.restore();
  }
  function vinheta(g, W, H, x, y, al, cor) {
    const R = Math.hypot(W, H) * 0.55, gr = g.createRadialGradient(x, y, R * 0.38, x, y, R);
    gr.addColorStop(0, 'rgba(' + cor + ',0)'); gr.addColorStop(1, 'rgba(' + cor + ',' + al + ')'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
  }
  function racha(x, y, L, n) {   // rachaduras: linhas quebradas saindo do impacto
    const out = [];
    for (let i = 0; i < n; i++) {
      let a = (i + rnd(-0.3, 0.3)) * 6.2832 / n, px = x, py = y; const pts = [[px, py]], len = L * rnd(0.5, 1), st = L * 0.09;
      for (let d = 0; d < len; d += st) { a += rnd(-0.5, 0.5); px += Math.cos(a) * st; py += Math.sin(a) * st; pts.push([px, py]); }
      out.push(pts);
    }
    return out;
  }

  /* ---------------- MOTOR ---------------- */
  function executar(origem, alvo, op) {
    op = op || {};
    const pct = op.pct == null ? 0.45 : op.pct, vida = op.vidaTotal > 0 ? op.vidaTotal : 500, dano = Math.round(vida * pct);
    const F = Math.max(0.8, Math.min(2.2, 0.8 + (vida - 100) / 700 * 1.4)), BIG = F >= 1.7;   // vida do jogo: 100 a 800; quanto maior a vida do alvo, maior a destruição
    const tAnt = 380, tCorte = 520, tDano = tCorte + 480, FIM = tDano + (BIG ? 1700 : 1300);

    return new Promise(function (resolve) {
      const ro = origem.getBoundingClientRect(), rt = alvo.getBoundingClientRect(), W = global.innerWidth, H = global.innerHeight;
      const S = { x: ro.left + ro.width / 2, y: ro.top + ro.height / 2 }, T = { x: rt.left + rt.width / 2, y: rt.top + rt.height / 2 };
      const dx = T.x - S.x, dy = T.y - S.y, dist = Math.hypot(dx, dy) || 1, ux = dx / dist, uy = dy / dist;
      const esc = Math.max(0.5, Math.min(1.6, Math.sqrt(rt.width * rt.height) / 260)), trayY = Math.max(30 * esc, Math.min(ro.top, rt.top) - 34 * esc);
      const ang = ux >= 0 ? 0.62 : Math.PI - 0.62, LG = Math.max(rt.width, rt.height) * 1.7, mx = (S.x + T.x) / 2, my = (S.y + T.y) / 2;

      const cv = document.createElement('canvas'), dpr = Math.min(global.devicePixelRatio || 1, 2);
      cv.width = W * dpr; cv.height = H * dpr;
      Object.assign(cv.style, { position: 'fixed', left: 0, top: 0, width: W + 'px', height: H + 'px', pointerEvents: 'none', zIndex: 99999 });
      document.body.appendChild(cv);
      const g = cv.getContext('2d'); g.scale(dpr, dpr);

      const pos0 = origem.style.position, z0 = origem.style.zIndex, f0 = alvo.style.filter;
      if (global.getComputedStyle(origem).position === 'static') origem.style.position = 'relative';
      origem.style.zIndex = 99997;
      if (op.som !== false && audio(op.volume == null ? 0.8 : op.volume)) somLinix(tAnt, tCorte, tDano, F, BIG);

      let t = 0, last = performance.now(), parts = [], cracks = [], rings = [], dmg = null, kb = 0, tremor = 0, cam = 0, fl = 0, crT = 0, on1 = false, on2 = false;
      const jorra = (x, y, n, v, cores, life, gr, sz) => {   // faíscas e estilhaços
        for (let i = 0; i < n; i++) { const a = rnd(0, 6.2832), sp = rnd(0.35, 1) * v; parts.push({ x: x, y: y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - v * 0.25, gr: gr, t0: t, life: life * rnd(0.7, 1.2), c: cores[i % cores.length], s: rnd(0.6, 1) * sz, r: rnd(0, 6.3), vr: rnd(-12, 12) }); }
      };
      const corte = () => { jorra(T.x, T.y, 26, 700 * esc, ['#fffbe6', '#ffd34a', '#ffffff'], 600, 300 * esc, 5 * esc); tremor = 6; cam = 8; };
      const hit = () => {   // o dano "estoura" depois do corte, como no anime
        jorra(T.x, T.y, Math.round(34 * F), 900 * esc * (0.7 + 0.3 * F), ['#fff6c9', '#ffd34a', '#ff7a3d', '#ef4b63'], 900, 1000 * esc, 7 * esc);
        [900, 600].forEach(v => rings.push({ x: T.x, y: T.y, r: 6 * esc, vr: v * esc * F, a: 1 }));
        tremor = 12 + 10 * F; kb = 30 * esc * F; cam = 6 + 6 * F; fl = BIG ? 1.2 : 0.8; dmg = { t0: t };
        if (BIG) { cracks = racha(T.x, T.y, Math.min(W, H) * 0.5, 9); crT = t; jorra(T.x, T.y, 30, 700 * esc, ['#c8bfd0', '#fdf8e8', '#2a1330', '#f3a7c0'], 1300, 1400 * esc, 11 * esc); }
        try { if (op.onImpacto) { const real=op.onImpacto({ dano, pct }); dmg=Number.isFinite(real)?{t0:t,value:real}:null; } } catch (e) { console.error(e); }
      };

      function finish(){
          cv.remove(); origem.style.translate = ''; origem.style.scale = ''; origem.style.zIndex = z0; origem.style.position = pos0;
          alvo.style.translate = ''; alvo.style.rotate = ''; alvo.style.filter = f0;
          try { if (op.onFim) op.onFim(); } catch (e) { console.error(e); }
          resolve({ dano: dano, pct: pct });
      }
      function quadro(now) {
        if(op.signal?.aborted||op.encerrar?.()){finish();return;}
        if(op.pausado?.()){last=now;requestAnimationFrame(quadro);return;}
        const dt = Math.min(0.05, (now - last) / 1000); last = now; t += dt * 1000;
        if (!on1 && t >= tCorte) { on1 = true; corte(); }
        if (!on2 && t >= tDano) { on2 = true; hit(); }
        g.clearRect(0, 0, W, H);

        /* Linix: agacha, investe, finca as garras e recua; o alvo fica "congelado" até o dano estourar */
        const pf = t < tAnt ? -0.16 * ease(t / tAnt) : t < tCorte ? -0.16 + 1.16 * Math.pow((t - tAnt) / (tCorte - tAnt), 2) : t < tDano ? 1 - 0.7 * ease(cl((t - tCorte) / 160)) : 0.3 * (1 - ease(cl((t - tDano) / 450)));
        const sc = t < tAnt ? 1 - 0.06 * ease(t / tAnt) : t < tDano ? 1.08 : 1 + 0.08 * (1 - ease(cl((t - tDano) / 450)));
        cam = Math.max(0, cam - dt * 30); tremor = Math.max(0, tremor - dt * 30); kb *= Math.exp(-dt * 7);
        const cx = calmo ? 0 : rnd(-cam, cam), cy = calmo ? 0 : rnd(-cam, cam), tr = tremor + (t >= tCorte && t < tDano ? 1.6 : 0), sx = S.x + dx * pf, sy = S.y + dy * pf;
        origem.style.translate = (dx * pf + cx) + 'px ' + (dy * pf + cy) + 'px'; origem.style.scale = String(sc);
        alvo.style.translate = (ux * kb + cx + (calmo ? 0 : rnd(-tr, tr))) + 'px ' + (uy * kb + cy + (calmo ? 0 : rnd(-tr, tr))) + 'px';
        alvo.style.rotate = (kb * 0.12 * (ux >= 0 ? 1 : -1)) + 'deg';

        vinheta(g, W, H, mx, my, 0.5 * (t < tCorte ? ease(cl(t / tCorte)) : 1) * cl((FIM - t) / 500), '12,6,34');   // escurece para destacar o golpe
        if (t < tAnt) { const u = t / tAnt; foco(g, sx, sy, W, H, ro.height * 0.6, 36, Math.floor(t / 45), '#ffe9a8', 0.1 + 0.25 * u, 0.02); brilho(g, sx + ro.width * 0.12, sy + ro.height * 0.12, (10 + 40 * u) * esc, 0.4 + 0.6 * u); }
        if (t >= tAnt && t < tCorte + 120) {   // rastro da investida
          const u = cl((t - tAnt) / (tCorte - tAnt));
          g.save(); g.strokeStyle = '#fff'; g.lineCap = 'round'; g.globalAlpha = Math.max(0, t < tCorte ? 0.75 * u : 0.75 * (1 - (t - tCorte) / 120));
          for (let i = 0; i < 14; i++) {
            const o = (i / 13 - 0.5) * ro.height * 0.95 + Math.sin(i * 91.7) * 8 * esc, len = dist * (0.25 + 0.45 * Math.abs(Math.sin(i * 12.9))) * u, bx = sx - ux * ro.width * 0.3 - uy * o, by = sy - uy * ro.width * 0.3 + ux * o;
            g.lineWidth = (1.5 + i % 3) * esc; g.beginPath(); g.moveTo(bx, by); g.lineTo(bx - ux * len, by - uy * len); g.stroke();
          }
          g.restore();
        }
        if (t >= tCorte) {   // os três riscos de garra; quando o dano estoura eles "abrem"
          const u = t - tCorte, wm = (t >= tDano && t < tDano + 160 ? 1 + 2 * (1 - (t - tDano) / 160) : 1) * (0.9 + 0.35 * F), al = cl((FIM - t) / 450);
          for (let i = 0; i < 3; i++) garra(g, T.x, T.y, LG, ang, (i - 1) * rt.width * 0.21, 7 * esc * wm, ease(cl((u - i * 25) / 110)), al);
        }

        parts = parts.filter(q => t - q.t0 < q.life);
        for (const q of parts) { const u = (t - q.t0) / q.life; q.vy += q.gr * dt; q.x += q.vx * dt; q.y += q.vy * dt; q.r += q.vr * dt; g.save(); g.translate(q.x, q.y); g.rotate(q.r); g.globalAlpha = 1 - u * u; g.fillStyle = q.c; g.beginPath(); g.moveTo(-q.s, 0); g.lineTo(q.s, -q.s * 0.45); g.lineTo(q.s * 0.4, q.s * 0.5); g.closePath(); g.fill(); g.restore(); }
        rings = rings.filter(r => r.a > 0);
        for (const r of rings) { r.r += r.vr * dt; r.a -= dt * 2.8; g.save(); g.globalAlpha = Math.max(0, r.a); g.strokeStyle = '#fff'; g.lineWidth = 6 * esc * Math.max(0.2, r.a); g.beginPath(); g.arc(r.x, r.y, r.r, 0, 6.3); g.stroke(); g.restore(); }
        if (cracks.length) {
          const u = (t - crT) / 1500, pr = Math.min(1, (t - crT) / 100);
          if (u < 1) { g.save(); g.globalAlpha = u > 0.6 ? 1 - (u - 0.6) / 0.4 : 1; g.lineCap = 'round'; g.lineJoin = 'round';
            for (const w of [[7, '#1a0a14'], [2.5, '#fff']]) { g.lineWidth = w[0] * esc; g.strokeStyle = w[1]; for (const c of cracks) { g.beginPath(); c.forEach((pt, i) => { if (i <= pr * (c.length - 1)) i ? g.lineTo(pt[0], pt[1]) : g.moveTo(pt[0], pt[1]); }); g.stroke(); } }
            g.restore(); }
        }
        if (t < 1100) { g.globalAlpha = cl((1100 - t) / 200); texto(g, 'AFIAÇÃO 5', mx, trayY, 32 * esc * Math.max(0.2, pop(cl(t / 180))), -0.05, '#ffe9a8', '#3a2250'); g.globalAlpha = 1; }
        if (dmg) {
          const u = (t - dmg.t0) / 1500;
          if (u <= 1) {
            const txt = '-' + (dmg.value ?? dano), tam = Math.min(50 * esc * (0.9 + 0.5 * F), (W - 16) / (txt.length * 0.75)), x = Math.max(tam * txt.length * 0.375 + 8, Math.min(W - tam * txt.length * 0.375 - 8, T.x));
            g.globalAlpha = u > 0.75 ? 1 - (u - 0.75) / 0.25 : 1; const y = T.y - rt.height * 0.12 - 40 * esc * ease(cl(u * 3));
            texto(g, txt, x, y, tam * Math.max(0.3, pop(cl(u * 5))), 0, '#fff', '#d6203a'); texto(g, '' + Math.round(pct*100) + '% DA VIDA TOTAL', x, y + tam * 0.8, 13 * esc, 0, '#ffe9a8', '#3a2250'); g.globalAlpha = 1;
          }
        }
        if (fl > 0) { g.fillStyle = 'rgba(255,255,255,' + Math.min(1, fl) * 0.6 + ')'; g.fillRect(0, 0, W, H); fl = Math.max(0, fl - dt * 6); }
        const ui = (t - tCorte) / 90;   // quadro de impacto: branco e depois preto com os três cortes
        if (ui >= 0 && ui < 1) {
          g.globalAlpha = 1;
          if (ui < 0.35) { g.fillStyle = '#fff'; g.fillRect(0, 0, W, H); }
          else { g.fillStyle = '#0a0412'; g.fillRect(0, 0, W, H); foco(g, T.x, T.y, W, H, 30 * esc, 60, 5, '#fff', 1, 0.03); for (let i = 0; i < 3; i++) garra(g, T.x, T.y, LG, ang, (i - 1) * rt.width * 0.21, 9 * esc, 1, 1, '#fff'); }
        }

        if (t < FIM) requestAnimationFrame(quadro);
        else finish();
      }
      requestAnimationFrame(quadro);
    });
  }
  Efeitos.afiacao = (origem, alvo, op) => executar(origem, alvo, op);

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
  function tom(t, tipo, f0, f1, dur, vol) {
    const o = ac.createOscillator(), g = ac.createGain();
    o.type = tipo; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f1, t + dur);
    env(g, t, 0.005, dur, vol); o.connect(g); g.connect(bus); o.start(t); o.stop(t + dur);
  }
  function somLinix(tAnt, tCorte, tDano, F, BIG) {
    const t = ac.currentTime + 0.01, at = ms => t + ms / 1000;
    sopro(t, 0.38, 1500, 6500, 4, 0.35, 0.9); tom(t, 'sine', 900, 2400, 0.38, 0.12);                          // metal sendo afiado
    sopro(at(tAnt), 0.14, 500, 5000, 1, 0.5, 0.7);                                                              // investida cortando o ar
    for (let i = 0; i < 3; i++) {                                                                               // três garras: shing, shing, shing
      const a = at(tCorte) + 0.028 * i;
      tom(a, 'triangle', 4200 - 300 * i, 2600, 0.16, 0.35); sopro(a, 0.1, 9000, 3000, 1.2, 0.5, 0.03); tom(a, 'sine', 3100 + 400 * i, 3100 + 400 * i, 0.5, 0.1);
    }
    const d = at(tDano);                                                                                        // o dano estoura
    tom(d, 'sine', 130, 26, 0.4 + 0.25 * F, 0.8); sopro(d, 0.35, 3500, 150, 0.7, 0.6, 0.05, 'lowpass'); sopro(d, 0.12, 7000, 2500, 1, 0.5, 0.05);
    tom(d + 0.05, 'sine', 2200, 2200, 0.7, 0.15);
    if (BIG) { tom(d, 'sine', 70, 18, 1.3, 1); sopro(d + 0.04, 1, 2500, 90, 0.7, 0.7, 0.03, 'lowpass'); sopro(d, 0.5, 8000, 2500, 1.5, 0.6, 0.02); }
  }
})(window);
