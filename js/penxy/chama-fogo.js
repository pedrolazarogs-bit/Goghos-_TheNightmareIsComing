/*!
 * Efeitos do CHAMA (JS puro, sem áudio externo)
 *   Fire Ball ........ Efeitos.bolaDeFogo(cartaOrigem, cartaAlvo, opções)   ataque: 50×6
 *   Esquentadinho .... Efeitos.queimar(carta, opções)                        passiva: dano contínuo por turno
 *
 *   await Efeitos.bolaDeFogo(chama, inimigo, { onImpacto: () => aplicarDano() });        // bola de fogo; acende o alvo por 6 turnos (50×6)
 *   await Efeitos.bolaDeFogo(chama, atacante, { tipo: 'revide' });                       // inimigo atacou o Chama: jato de chamas e queima o atacante por 3 turnos (35×3)
 *   await Efeitos.queimar.tick(carta, { dano: 50 });                                     // passou 1 turno: pulso, número "-50", gasta 1 turno; apaga no último
 *   Efeitos.queimar(carta, { turnos: 6 });  Efeitos.queimar.apagar(carta);               // acender / apagar manualmente
 *
 * bolaDeFogo — opções: tipo 'ataque' | 'revide' · ponto {x,y} de onde sai o fogo na carta de origem, fração 0–1 (padrão 0.7, 0.45)
 *   mira {x,y} onde acerta no alvo (padrão: centro) · queimar nº de turnos que o alvo queima (padrão 6 no ataque, 3 no revide; 0 = não acende)
 *   onImpacto() · onFim() · som (true) · volume (0.8). Retorna Promise resolvida no fim.
 * queimar — opções: turnos (6) · som · volume. tick: dano (número mostrado), numero (true), som. tick retorna Promise<boolean> (true = ainda queimando).
 * Requisitos de queimar: o elemento contém um <img> com a arte da carta (PNG/WebP com fundo transparente) e sem overflow:hidden.
 * O som só toca depois de um toque/clique do jogador.
 */
(function (global) {
  'use strict';
  const Efeitos = global.Efeitos = global.Efeitos || {};
  const calmo = !!(global.matchMedia && global.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const rnd = (a, b) => a + Math.random() * (b - a);
  const tela = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };

  /* ---------------- FOGO (compartilhado) ---------------- */
  let SPR;
  function sprites() {   // bolas de luz pré-desenhadas: amarelo, laranja, vermelho, fumaça
    if (SPR) return SPR;
    SPR = ['255,235,140', '255,130,30', '190,45,20', '44,38,42'].map(function (c) {
      const k = tela(64, 64), g = k.getContext('2d'), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
      gr.addColorStop(0, 'rgba(' + c + ',1)'); gr.addColorStop(0.4, 'rgba(' + c + ',0.55)'); gr.addColorStop(1, 'rgba(' + c + ',0)');
      g.fillStyle = gr; g.fillRect(0, 0, 64, 64); return k;
    });
    return SPR;
  }
  // k: 0 chama (muda de cor com a idade) · 1 brasa · 2 fumaça
  function particulas(g, ps, dt) {
    const S = sprites();
    for (const p of ps) {
      p.x += p.vx * dt; p.y += p.vy * dt; p.vy += p.g * dt; p.v -= dt; p.r += p.vr * dt;
      const r = Math.max(0.5, p.r), u = 1 - p.v / p.m, a = Math.max(0, p.v / p.m);
      if (p.k === 2) { g.globalCompositeOperation = 'source-over'; g.globalAlpha = a * 0.35; g.drawImage(S[3], p.x - r, p.y - r, r * 2, r * 2); }
      else if (p.k === 1) { g.globalCompositeOperation = 'lighter'; g.globalAlpha = a; g.drawImage(S[0], p.x - r, p.y - r, r * 2, r * 2); }
      else { g.globalCompositeOperation = 'lighter'; g.globalAlpha = a * 0.9; g.drawImage(S[u < 0.2 ? 0 : u < 0.55 ? 1 : 2], p.x - r * 0.75, p.y - r * 1.9, r * 1.5, r * 2.6); }   // língua de fogo: esticada para cima
    }
    g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
  }
  const chama = (ps, x, y, vx, vy, v, r) => ps.push({ x: x, y: y, vx: vx, vy: vy, g: 0, v: v, m: v, r: r, vr: -r * 0.8 / v, k: 0 });
  const brasa = (ps, x, y, vx, vy, v, r, g) => ps.push({ x: x, y: y, vx: vx, vy: vy, g: g, v: v, m: v, r: r, vr: 0, k: 1 });
  const fumaca = (ps, x, y, r) => ps.push({ x: x, y: y, vx: rnd(-12, 12), vy: -rnd(30, 70), g: 0, v: 1.1, m: 1.1, r: r, vr: 22, k: 2 });

  function bola(g, x, y, r, ang, t, k) {   // bola de fogo com borda tremulando
    g.save(); g.translate(x, y); g.rotate(ang); g.scale(k, 1); g.globalCompositeOperation = 'lighter';
    [[1.7, '255,70,10', 0.35], [1.25, '255,140,30', 0.6], [0.8, '255,215,100', 0.9], [0.42, '255,255,230', 1]].forEach(function (c, j) {
      g.fillStyle = 'rgba(' + c[1] + ',' + c[2] + ')'; if (j === 0) { g.shadowColor = '#ff6a00'; g.shadowBlur = 24; } else g.shadowBlur = 0;
      g.beginPath();
      for (let i = 0; i <= 24; i++) {
        const th = i / 24 * 6.283, w = 1 + 0.12 * Math.sin(th * 5 + t / 55 + j) + 0.08 * Math.sin(th * 3 - t / 37);
        i ? g.lineTo(Math.cos(th) * r * c[0] * w, Math.sin(th) * r * c[0] * w) : g.moveTo(Math.cos(th) * r * c[0] * w, Math.sin(th) * r * c[0] * w);
      }
      g.fill();
    });
    g.restore();
  }

  /* ---------------- FIRE BALL ---------------- */
  Efeitos.bolaDeFogo = function (origem, alvo, op) {
    op = Object.assign({ tipo: 'ataque', som: true, volume: 0.8, ponto: { x: 0.7, y: 0.45 }, mira: { x: 0.5, y: 0.45 } }, op);
    const rev = op.tipo === 'revide', C = rev ? 110 : 380, V = rev ? 190 : 340, FIM = C + V + (rev ? 600 : 750);
    const acender = op.queimar != null ? op.queimar : (rev ? 3 : 6);

    return new Promise(function (resolve) {
      const ro = (op.arteOrigem || origem).getBoundingClientRect(), rt = (op.arteAlvo || alvo).getBoundingClientRect(), W = global.innerWidth, H = global.innerHeight;
      const O = { x: ro.left + ro.width * op.ponto.x, y: ro.top + ro.height * op.ponto.y };
      const T = { x: rt.left + rt.width * op.mira.x, y: rt.top + rt.height * op.mira.y };
      const dx = T.x - O.x, dy = T.y - O.y, L = Math.hypot(dx, dy) || 1, ang = Math.atan2(dy, dx), esc = Math.max(0.5, Math.min(1.6, Math.sqrt(ro.width * ro.height) / 260));
      const mx = (O.x + T.x) / 2, my = (O.y + T.y) / 2;
      let cx = mx - dy * 0.18, cy = my + dx * 0.18; if (cy > my) { cx = mx + dy * 0.18; cy = my - dx * 0.18; }   // trajetória em arco, curvando para cima
      const pos = u => { const v = 1 - u; return { x: v * v * O.x + 2 * v * u * cx + u * u * T.x, y: v * v * O.y + 2 * v * u * cy + u * u * T.y }; };

      const cv = document.createElement('canvas'), dpr = Math.min(global.devicePixelRatio || 1, 2);
      cv.width = W * dpr; cv.height = H * dpr;
      Object.assign(cv.style, { position: 'fixed', left: 0, top: 0, width: W + 'px', height: H + 'px', pointerEvents: 'none', zIndex: 99999 });
      document.body.appendChild(cv);
      const g = cv.getContext('2d'); g.scale(dpr, dpr);

      const S = sprites(), f0 = alvo.style.filter;
      let t = 0, ult = performance.now(), ps = [], aneis = [], expl = [], bateu = false, flash = 0, tremor = 0;
      if (op.som && audio(op.volume)) somBola(rev);

      function impacto() {
        bateu = true; flash = 1; tremor = rev ? 5 : 11;
        for (let i = 0, n = rev ? 16 : 40; i < n; i++) { const a = rnd(0, 6.3), v = rnd(120, 520) * esc; brasa(ps, T.x, T.y, Math.cos(a) * v, Math.sin(a) * v - 120, rnd(0.4, 0.9), rnd(2, 5) * esc, 700); }
        for (let i = 0, n = rev ? 10 : 26; i < n; i++) { const a = rnd(0, 6.3), v = rnd(80, 300) * esc; chama(ps, T.x, T.y, Math.cos(a) * v, Math.sin(a) * v - 60, rnd(0.35, 0.6), rnd(14, 24) * esc); }
        for (let i = 0, n = rev ? 3 : 7; i < n; i++) fumaca(ps, T.x + rnd(-20, 20) * esc, T.y + rnd(-10, 10) * esc, rnd(14, 26) * esc);
        aneis.push({ r: 6 * esc, vr: 700 * esc * (rev ? 0.6 : 1), a: 1 });
        expl.push({ r: 10 * esc, vr: (rev ? 260 : 380) * esc, a: 1 });
        try {   // coice na carta de origem
          const d = rev ? -6 : -10;
          origem.animate([{ translate: '0px 0px' }, { translate: Math.cos(ang) * d + 'px ' + Math.sin(ang) * d + 'px', offset: 0.25 }, { translate: '0px 0px' }], { duration: 260, easing: 'ease-out' });
        } catch (e) { /* sem suporte: segue sem o coice */ }
        if (acender > 0) Efeitos.queimar(op.alvoQueima ? op.alvoQueima(acender) : alvo, { turnos: acender, som: op.som, volume: op.volume * 0.7 });
        if (op.onImpacto) { try { op.onImpacto(); } catch (e) { console.error(e); } }
      }

      function quadro(agora) {
        if (op.signal?.aborted || op.encerrar?.()) { cv.remove(); alvo.style.translate=''; alvo.style.filter=f0; resolve(); return; }
        if (op.pausado?.()) { ult=agora; requestAnimationFrame(quadro); return; }
        const dt = Math.min(0.05, Math.max(0, (agora - ult) / 1000)); ult = agora; t += dt * 1000;
        g.clearRect(0, 0, W, H); ps = ps.filter(p => p.v > 0);
        const tv = C + V;

        if (t < C) {   // carga: o fogo se concentra na saída
          const c = rev ? t / C : (t / C) * (t / C), r = (rev ? 8 + 12 * c : 6 + 24 * c) * esc;
          bola(g, O.x, O.y, r, 0, t, 1);
          for (let i = 0, n = 1 + (c * 3 | 0); i < n; i++) chama(ps, O.x + rnd(-1, 1) * r, O.y + rnd(-0.5, 0.5) * r, rnd(-20, 20), rnd(-120, -50), 0.4, rnd(7, 14) * esc * (0.5 + c));
          if (!rev && Math.random() < c) { const a = rnd(0, 6.3), d = rnd(50, 90) * esc; brasa(ps, O.x + Math.cos(a) * d, O.y + Math.sin(a) * d, -Math.cos(a) * d / 0.15, -Math.sin(a) * d / 0.15, 0.15, 3 * esc, 0); }
        } else if (t < tv && !rev) {   // voo da bola, deixando rastro de chamas
          const u = (t - C) / V, p = pos(u * u), q = pos(Math.min(1, u * u + 0.02)), a = Math.atan2(q.y - p.y, q.x - p.x);
          bola(g, p.x, p.y, 28 * esc, a, t, 1.5);
          for (let i = 0; i < 3; i++) chama(ps, p.x + rnd(-6, 6) * esc, p.y + rnd(-6, 6) * esc, -Math.cos(a) * rnd(20, 80) + rnd(-30, 30), -Math.sin(a) * rnd(20, 80) + rnd(-30, 30), rnd(0.3, 0.5), rnd(10, 18) * esc);
        } else if (t >= tv && !bateu) impacto();
        if (rev && t >= C && t < tv + 130) for (let i = 0; i < 9; i++) { const sp = rnd(0.8, 1.3) * L / 0.26, pa = ang + rnd(-0.16, 0.16); chama(ps, O.x, O.y, Math.cos(pa) * sp, Math.sin(pa) * sp, rnd(0.22, 0.38), rnd(13, 24) * esc); }   // jato de chamas

        flash = Math.max(0, flash - dt * (rev ? 5 : 3.5));
        g.globalCompositeOperation = 'lighter';
        if (flash > 0) { const r = (rev ? 70 : 140) * esc * (1.2 - flash * 0.3); g.globalAlpha = flash; g.drawImage(S[1], T.x - r * 1.6, T.y - r * 1.6, r * 3.2, r * 3.2); g.drawImage(S[0], T.x - r, T.y - r, r * 2, r * 2); }
        expl = expl.filter(e => e.a > 0);
        for (const e of expl) { e.r += e.vr * dt; e.a -= dt * 2.4; g.globalAlpha = Math.max(0, e.a) * 0.8; g.drawImage(S[1], T.x - e.r, T.y - e.r, e.r * 2, e.r * 2); }
        aneis = aneis.filter(r => r.a > 0);
        for (const r of aneis) { r.r += r.vr * dt; r.a -= dt * 3; g.globalAlpha = Math.max(0, r.a); g.strokeStyle = 'rgb(255,150,50)'; g.lineWidth = (3 + 3 * (rev ? 0.5 : 1)) * esc; g.beginPath(); g.arc(T.x, T.y, r.r, 0, 6.3); g.stroke(); }
        g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
        particulas(g, ps, dt);

        tremor = Math.max(0, tremor - dt * 30);   // reação do alvo: treme e estoura em laranja
        alvo.style.translate = tremor > 0.3 && !calmo ? rnd(-tremor, tremor) + 'px ' + rnd(-tremor, tremor) + 'px' : '';
        alvo.style.filter = flash > 0.02 ? 'brightness(' + (1 + flash * (rev ? 0.7 : 1.4)) + ') saturate(1.4)' : f0;

        if (t < FIM) requestAnimationFrame(quadro);
        else { cv.remove(); alvo.style.translate = ''; alvo.style.filter = f0; if (op.onFim) { try { op.onFim(); } catch (e) { console.error(e); } } resolve(); }
      }
      requestAnimationFrame(quadro);
    });
  };

  /* ---------------- ESQUENTADINHO: QUEIMADURA ---------------- */
  const mapa = new WeakMap();
  const WB = 360;   // largura de trabalho

  function contorno(E) {   // pontos do contorno de onde as chamas nascem, silhueta e halo de calor
    const W = E.W, H = E.H, s = tela(W, H), gs = s.getContext('2d');
    gs.drawImage(E.img, 0, 0, W, H);
    E.topo = []; E.lado = [];
    try {
      const p = gs.getImageData(0, 0, W, H).data, A = (x, y) => p[(y * W + x) * 4 + 3] > 200;
      for (let x = 4; x < W - 4; x += 3) for (let y = 0; y < H; y++) if (A(x, y)) { E.topo.push({ x: x, y: y }); break; }
      for (let y = 4; y < H - 4; y += 4) {
        for (let x = 0; x < W; x++) if (A(x, y)) { E.lado.push({ x: x, y: y }); break; }
        for (let x = W - 1; x >= 0; x--) if (A(x, y)) { E.lado.push({ x: x, y: y }); break; }
      }
    } catch (err) { /* imagem de outra origem (ex.: file://): usa borda reta */ }
    if (!E.topo.length) for (let x = 4; x < W - 4; x += 3) E.topo.push({ x: x, y: 0 });
    gs.globalCompositeOperation = 'source-in'; gs.fillStyle = 'rgb(255,110,30)'; gs.fillRect(0, 0, W, H);
    E.sil = s;
    const h = tela(E.cv.width, E.cv.height), gh = h.getContext('2d');
    gh.shadowColor = 'rgb(255,120,30)'; gh.shadowBlur = 0.09 * E.W; gh.drawImage(s, E.ox, E.oy);
    gh.shadowBlur = 0; gh.globalCompositeOperation = 'destination-out'; gh.drawImage(s, E.ox, E.oy);
    E.halo = h;
  }
  function emblema(E) {   // chama com o número de turnos restantes
    const b = document.createElement('div');
    b.innerHTML = '<svg viewBox="0 0 40 40" width="100%" height="100%"><circle cx="20" cy="20" r="18" fill="#2a1215" stroke="#ff8a1f" stroke-width="2.5"/><path d="M20 5c1 6 8 9 8 17a8 8 0 0 1-16 0c0-4 2-6 4-8 0 3 1 4 2 4 0-5-1-8 2-13z" fill="#ff8a1f"/><text x="20" y="28" text-anchor="middle" font-size="14" font-weight="900" fill="#fff" stroke="#3a0e08" stroke-width="1.6" paint-order="stroke" font-family="Arial Black,Impact,sans-serif">0</text></svg>';
    Object.assign(b.style, { position: 'absolute', right: '-5%', top: '4%', width: '22%', aspectRatio: '1', zIndex: 4, pointerEvents: 'none', display: 'none' });
    E.alvo.appendChild(b); E.badge = b; E.num = b.querySelector('text');
  }
  function parar(E) { E.parou = true; if (E.cv) E.cv.remove(); if (E.badge) E.badge.remove(); mapa.delete(E.alvo); }
  function numero(alvo, texto) {   // número flutuante de dano
    const r = alvo.getBoundingClientRect(), d = document.createElement('div');
    d.textContent = texto;
    d.style.cssText = 'position:fixed;z-index:100000;pointer-events:none;font:900 36px/1 "Arial Black",Impact,sans-serif;color:#ffd27a;-webkit-text-stroke:4px #2a0a05;paint-order:stroke fill;text-shadow:0 0 14px #ff7a1a;left:' + (r.left + r.width / 2) + 'px;top:' + (r.top + r.height * 0.25) + 'px';
    document.body.appendChild(d);
    try { d.animate([{ transform: 'translate(-50%,0) scale(.4)', opacity: 0 }, { transform: 'translate(-50%,-14px) scale(1.25)', opacity: 1, offset: 0.18 }, { transform: 'translate(-50%,-70px) scale(1)', opacity: 0 }], { duration: 950, easing: 'cubic-bezier(.2,.8,.3,1)' }).onfinish = () => d.remove(); }
    catch (e) { setTimeout(() => d.remove(), 950); }
  }

  function quadroQ(E, t) {
    if (E.parou) return;
    requestAnimationFrame(tt => quadroQ(E, tt));
    const dt0 = (t - E.ult) / 1000;
    if (dt0 < 0.028) return;   // ~30 quadros por segundo bastam e poupam bateria
    const dt = Math.min(0.05, dt0); E.ult = t;
    if (!E.alvo.isConnected) { E.fora = (E.fora || 0) + dt; if (E.fora > 5) parar(E); return; }
    E.fora = 0;
    const g = E.g, s = E.s, ni = E.turnos > 0 ? Math.max(0.3, E.turnos / E.total) : 0;   // intensidade cai conforme os turnos acabam
    E.vis += ((E.turnos > 0 ? 1 : 0) - E.vis) * Math.min(1, dt * 4);
    const pf = Math.max(0, 1 - (t - E.pulso) / 300);   // pulso do tick
    g.clearRect(0, 0, E.cv.width, E.cv.height);

    if (E.turnos > 0) {
      const mult = (t - E.pulso < 280 ? 3 : 1) * (t - E.acende < 700 ? 3 : 1) * (calmo ? 0.5 : 1);
      for (let i = 0, n = Math.round((1 + 3 * ni) * mult); i < n; i++) {
        const pt = E.lado.length && Math.random() < 0.35 ? E.lado[Math.random() * E.lado.length | 0] : E.topo[Math.random() * E.topo.length | 0], v = rnd(0.55, 1.0), r = rnd(0.055, 0.1) * E.W * (0.55 + 0.45 * ni);
        E.ps.push({ x: E.ox + pt.x + rnd(-3, 3), y: E.oy + pt.y + 2, vx: rnd(-0.03, 0.03) * E.W, vy: -rnd(0.2, 0.4) * E.H * (0.5 + 0.5 * ni), g: 0, v: v, m: v, r: r, vr: -r * 0.8 / v, k: 0 });
      }
      if (Math.random() < 0.3 * ni * mult) { const pt = E.topo[Math.random() * E.topo.length | 0]; brasa(E.ps, E.ox + pt.x, E.oy + pt.y, rnd(-50, 50), -rnd(150, 320), rnd(1, 1.6), rnd(3, 6), 0); }
    }
    const fl = 0.7 + 0.3 * Math.sin(t / 90) * Math.sin(t / 37 + 1);
    g.globalCompositeOperation = 'lighter';
    g.globalAlpha = Math.min(1, ni * fl * 0.9 * E.vis + pf * 0.6); g.drawImage(E.halo, 0, 0);          // halo de calor
    g.globalAlpha = Math.min(1, (0.12 * ni * fl + 0.3 * pf) * E.vis); g.drawImage(E.sil, E.ox, E.oy);    // carta esquenta
    g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1;
    E.ps = E.ps.filter(p => p.v > 0); particulas(g, E.ps, dt);
    if (E.turnos <= 0 && E.vis < 0.02 && !E.ps.length) parar(E);
  }

  function preparar(alvo) {
    let E = mapa.get(alvo);
    if (E) return E.pronto;
    const img = alvo.querySelector('img');
    if (!img) return Promise.reject(new Error('Efeitos.queimar: o elemento precisa conter um <img> com a arte da carta'));
    E = { alvo: alvo, img: img, ps: [], turnos: 0, total: 1, vis: 0, pulso: -1e9, acende: -1e9, ult: 0 };
    mapa.set(alvo, E);
    E.pronto = new Promise(function (resolve) {
      const montar = function () {
        if (E.parou) { resolve(E); return; }
        const W = WB, H = Math.round(WB * img.naturalHeight / img.naturalWidth), mx = Math.round(W * 0.2), mt = Math.round(H * 0.3), mb = Math.round(H * 0.08);
        Object.assign(E, { W: W, H: H, ox: mx, oy: mt, s: W / 460 });
        E.cv = tela(W + 2 * mx, H + mt + mb); E.g = E.cv.getContext('2d');   // com folga em cima e nos lados para as chamas
        if (global.getComputedStyle(alvo).position === 'static') alvo.style.position = 'relative';
        Object.assign(E.cv.style, { position: 'absolute', left: -mx / W * 100 + '%', top: -mt / H * 100 + '%', width: E.cv.width / W * 100 + '%', height: E.cv.height / H * 100 + '%', pointerEvents: 'none', zIndex: 3 });
        alvo.appendChild(E.cv);
        contorno(E); emblema(E);
        requestAnimationFrame(tt => { E.ult = tt; quadroQ(E, tt); });
        resolve(E);
      };
      img.complete && img.naturalWidth ? montar() : img.addEventListener('load', montar, { once: true });
      img.addEventListener('error', () => { E.parou=true; mapa.delete(alvo); resolve(E); }, {once:true});
    });
    return E.pronto;
  }

  Efeitos.queimar = function (alvo, op) {
    op = Object.assign({ turnos: 6, som: true, volume: 0.8 }, op);
    return preparar(alvo).then(function (E) {
      if (E.parou) return;
      const novo = E.turnos <= 0;
      E.turnos = Math.max(1, op.turnos | 0); E.total = E.turnos; E.acende = performance.now(); E.num.textContent = E.turnos; E.badge.style.display = '';
      if (novo) { try { E.badge.animate([{ transform: 'scale(.3)' }, { transform: 'scale(1.25)', offset: 0.6 }, { transform: 'scale(1)' }], { duration: 320 }); } catch (e) { /* sem animação */ } }
      if (op.som && audio(op.volume)) somQueimar();
    });
  };
  Efeitos.queimar.tick = function (alvo, op) {
    op = Object.assign({ dano: 0, numero: true, som: true, volume: 0.8 }, op);
    const E = mapa.get(alvo);
    if (!E || E.turnos <= 0) return Promise.resolve(false);
    E.turnos--; E.pulso = performance.now(); E.num.textContent = E.turnos;
    if (op.numero && op.dano) numero(alvo, '-' + op.dano);
    if (op.som && audio(op.volume)) somTick();
    if (E.turnos <= 0) {   // acabou: o fogo apaga soltando fumaça
      E.badge.style.display = 'none';
      for (let i = 0; i < 6; i++) { const pt = E.topo[Math.random() * E.topo.length | 0]; fumaca(E.ps, E.ox + pt.x, E.oy + pt.y, rnd(0.04, 0.07) * E.W); }
      if (op.som && ac) somApagar();
    }
    return new Promise(r => setTimeout(() => r(E.turnos > 0), 450));
  };
  Efeitos.queimar.remover = alvo => { const E=mapa.get(alvo); if(E)parar(E); };
  Efeitos.queimar.apagar = function (alvo) { const E = mapa.get(alvo); if (E) { E.turnos = 0; E.badge.style.display = 'none'; } };

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
  function tom(t, tipo, f0, f1, dur, vol, atk) {
    const o = ac.createOscillator(), g = ac.createGain();
    o.type = tipo; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f1, t + dur);
    env(g, t, atk ? dur * atk : 0.01, dur, vol); o.connect(g); g.connect(bus); o.start(t); o.stop(t + dur);
  }
  function estalos(t, dur, n, vol) { for (let k = 0; k < n; k++) sopro(t + rnd(0, dur), 0.015, rnd(1500, 5000), rnd(800, 2500), 1.5, vol * rnd(0.4, 1), 0.1); }   // lenha estalando
  function rugido(t, dur, vol, f0, f1, atk) { sopro(t, dur, f0, f1, 0.7, vol, atk); sopro(t, dur, f0 * 0.5, f1 * 0.5, 0.6, vol * 0.6, atk, 'lowpass'); }   // rugido do fogo
  function explosao(t, f) {
    tom(t, 'sine', 110, 26, 0.8, 0.9 * f + 0.1);                  // estrondo
    sopro(t, 0.55, 2600, 150, 0.7, 0.8 * f + 0.1, 0.08, 'lowpass'); // ronco
    estalos(t, 0.6, 16, 0.35 * f + 0.1);
    sopro(t + 0.1, 0.6, 6000, 3000, 0.8, 0.12 * f, 0.3, 'highpass'); // chiado
  }
  function somBola(rev) {
    const t = ac.currentTime + 0.01;
    if (rev) {   // jato de chamas
      sopro(t + 0.05, 0.4, 500, 3200, 0.8, 0.6, 0.35); tom(t, 'sine', 90, 200, 0.2, 0.35); estalos(t, 0.4, 10, 0.25);
      explosao(t + 0.3, 0.5);
    } else {
      rugido(t, 0.38, 0.35, 250, 1400, 0.9); tom(t, 'sine', 80, 200, 0.38, 0.3, 0.95); estalos(t, 0.38, 10, 0.25);   // carga: fogo se juntando
      const tv = t + 0.38;
      sopro(tv, 0.34, 500, 2600, 1.2, 0.45, 0.5); tom(tv, 'sine', 120, 55, 0.35, 0.6);                              // lançamento
      explosao(tv + 0.34, 1);                                                                                         // impacto
    }
  }
  function somQueimar() { const t = ac.currentTime + 0.01; rugido(t, 0.7, 0.4, 200, 1800, 0.25); estalos(t, 1.0, 22, 0.3); tom(t, 'sine', 70, 150, 0.5, 0.4); }
  function somTick() { const t = ac.currentTime + 0.01; sopro(t, 0.35, 4500, 1500, 0.8, 0.25, 0.1, 'highpass'); estalos(t, 0.3, 6, 0.3); tom(t, 'sine', 160, 60, 0.18, 0.25); }
  function somApagar() { const t = ac.currentTime + 0.01; sopro(t, 0.9, 5000, 2500, 0.6, 0.3, 0.1, 'highpass'); tom(t, 'sine', 90, 40, 0.4, 0.25); }
})(window);
