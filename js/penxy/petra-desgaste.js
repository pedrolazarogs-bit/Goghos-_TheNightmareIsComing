/*!
 * Efeitos.desgaste — passiva "Desgaste" da Petra: a carta se deteriora conforme o nível (JS puro, sem áudio externo)
 *
 *   Efeitos.desgaste(carta, 1);                                   // instala na carta já no nível 1 (sem animação)
 *   Efeitos.desgaste(carta, Efeitos.desgaste.nivelPorVida(vida)); // muda de nível: anima a degradação (ou o reparo)
 *   Efeitos.desgaste.golpe(carta);                                // reação curta a um golpe recebido (faísca + tremor)
 *   Efeitos.desgaste.remover(carta);                              // tira o efeito
 *
 * Níveis (tabela da Petra): Lv1 vida ≥ 180 · Lv2 vida 100–179 · Lv3 vida ≤ 99
 *   Lv1  carta intacta, ciano pulsando com energia plena
 *   Lv2  arranhões, sujeira, lascas, uma rachadura; cores apagadas; energia falhando; faíscas ocasionais
 *   Lv3  rachaduras vazando energia, ferrugem, fuligem, quase sem energia; faíscas e fumaça frequentes
 *
 * Requisitos: o elemento contém um <img> com a arte da carta (PNG/WebP com fundo transparente) e não deve ter
 * overflow:hidden (as faíscas saem um pouco da carta). Opções: { som: true, volume: 0.8 }.
 * Retorna Promises; a de mudança de nível resolve quando a animação termina.
 */
(function (global) {
  'use strict';
  const Efeitos = global.Efeitos = global.Efeitos || {};
  const calmo = !!(global.matchMedia && global.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const rnd = (a, b) => a + Math.random() * (b - a);
  const tela = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
  const mapa = new WeakMap();
  const WT = 480;   // largura de trabalho das texturas

  const FILTRO = [null, 'none',
    'saturate(.78) brightness(.92) contrast(1.04) sepia(.12)',
    'saturate(.5) brightness(.78) contrast(1.1) sepia(.28)'];
  // base: energia média do ciano · falha: intervalo entre apagões (ms) · fa: intervalo entre faíscas · n: faíscas · fumo: intervalo da fumaça
  const NV = [null,
    { base: 1 },
    { base: 0.55, falha: [1500, 4000], fa: [4000, 7000], n: 5 },
    { base: 0.2, falha: [450, 1400], fa: [1400, 3000], n: 9, fumo: 700 }];
  // marcas acumuladas por nível [Lv1, Lv2, Lv3]: o Lv3 contém tudo do Lv2 e mais
  const QT = { arranhao: [0, 28, 70], mancha: [0, 6, 14], ferrugem: [0, 3, 14], lasca: [0, 8, 20], rachadura: [0, 1, 4], queimado: [0, 0, 3], vinheta: [0, 0.18, 0.36] };
  const D8 = [[-10, 0], [10, 0], [0, -10], [0, 10], [-7, -7], [7, 7], [-7, 7], [7, -7]];

  function semente(a) {   // gerador pseudoaleatório fixo: o desgaste é sempre o mesmo para a mesma carta
    return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  }

  /* ---------------- GEOMETRIA ---------------- */
  function borda(E, r) {   // ponto sorteado perto do contorno da carta
    const a = E.alfa, w = E.W, h = E.H;
    if (!a) return { x: r() * w, y: r() * h };
    for (let i = 0; i < 120; i++) {
      const x = r() * w | 0, y = r() * h | 0;
      if (a[y * w + x] < 200) continue;
      for (const d of D8) { const xx = x + d[0], yy = y + d[1]; if (xx < 0 || yy < 0 || xx >= w || yy >= h || a[yy * w + xx] < 20) return { x: x, y: y }; }
    }
    return { x: w / 2, y: h / 2 };
  }
  function rachar(r, p, a, n, s, out, prof) {   // rachadura com ramificações
    const l = [p];
    for (let j = 0; j < n; j++) {
      a += (r() - 0.5) * 1.1;
      p = { x: p.x + Math.cos(a) * (7 + r() * 10) * s, y: p.y + Math.sin(a) * (7 + r() * 10) * s }; l.push(p);
      if (prof < 2 && j > 1 && r() < 0.2) rachar(r, p, a + (r() < 0.5 ? 1 : -1) * (0.5 + r() * 0.7), Math.max(3, n - j - 2), s, out, prof + 1);
    }
    out.push(l);
  }

  /* ---------------- TEXTURAS ---------------- */
  function textura(E, nv) {
    const W = E.W, H = E.H, c = tela(W, H), g = c.getContext('2d'), s = E.s, q = k => QT[k][nv - 1], R = k => semente(1000 + k * 77);
    const nuvem = (p, rad, rgb, a) => {
      const gr = g.createRadialGradient(p.x, p.y, 0, p.x, p.y, rad);
      gr.addColorStop(0, 'rgba(' + rgb + ',' + a + ')'); gr.addColorStop(1, 'rgba(' + rgb + ',0)');
      g.fillStyle = gr; g.fillRect(p.x - rad, p.y - rad, rad * 2, rad * 2);
    };
    let r = R(1), i, p;
    for (i = 0; i < q('mancha'); i++) nuvem(i % 3 ? borda(E, r) : { x: r() * W, y: r() * H }, (18 + r() * 34) * s, '28,20,14', 0.22 + r() * 0.18);   // sujeira
    r = R(6);
    for (i = 0; i < q('queimado'); i++) nuvem({ x: (0.15 + r() * 0.7) * W, y: (0.1 + r() * 0.75) * H }, (30 + r() * 25) * s, '6,4,6', 0.6);          // fuligem
    r = R(2);
    for (i = 0; i < q('ferrugem'); i++) {   // ferrugem nas bordas
      p = borda(E, r);
      for (let j = 0; j < 14; j++) {
        g.fillStyle = 'rgba(' + (120 + r() * 60 | 0) + ',' + (55 + r() * 30 | 0) + ',22,' + (0.25 + r() * 0.3) + ')';
        g.beginPath(); g.arc(p.x + (r() - 0.5) * 26 * s, p.y + (r() - 0.5) * 26 * s, (1 + r() * 4) * s, 0, 6.3); g.fill();
      }
    }
    r = R(3);
    for (i = 0; i < q('arranhao'); i++) {   // arranhões claros e escuros
      const x = r() * W, y = r() * H, a = -0.45 + (r() - 0.5) * 1.3 + (r() < 0.15 ? 1.6 : 0), l = (14 + r() * 50) * s;
      g.strokeStyle = r() < 0.5 ? 'rgba(255,255,255,.5)' : 'rgba(18,14,22,.55)'; g.lineWidth = (0.6 + r() * 0.8) * s;
      g.beginPath(); g.moveTo(x, y);
      g.quadraticCurveTo(x + Math.cos(a) * l * 0.5 + (r() - 0.5) * 4, y + Math.sin(a) * l * 0.5 + (r() - 0.5) * 4, x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke();
    }
    r = R(4);
    for (i = 0; i < q('lasca'); i++) {   // lascas no contorno
      p = borda(E, r); const a = r() * 6.3, t = (3 + r() * 7) * s;
      g.fillStyle = 'rgba(24,20,30,.85)'; g.beginPath(); g.moveTo(p.x, p.y);
      g.lineTo(p.x + Math.cos(a) * t, p.y + Math.sin(a) * t); g.lineTo(p.x + Math.cos(a + 1.9) * t * 0.8, p.y + Math.sin(a + 1.9) * t * 0.8); g.closePath(); g.fill();
    }
    r = R(5); const rach = [];
    for (i = 0; i < q('rachadura'); i++) rachar(r, { x: (0.12 + r() * 0.76) * W, y: (0.08 + r() * 0.8) * H }, r() * 6.3, 9 + (r() * 8 | 0), s, rach, 0);
    E.rach[nv] = rach; g.lineJoin = 'round';
    for (const l of rach) {
      const trilha = d => { g.beginPath(); l.forEach((pt, j) => j ? g.lineTo(pt.x + d, pt.y + d) : g.moveTo(pt.x + d, pt.y + d)); };
      trilha(1.2 * s); g.strokeStyle = 'rgba(255,255,255,.35)'; g.lineWidth = 0.8 * s; g.stroke();
      trilha(0); g.strokeStyle = 'rgba(8,6,12,.92)'; g.lineWidth = 2.3 * s; g.stroke();
    }
    const gv = g.createRadialGradient(W / 2, H / 2, H * 0.25, W / 2, H / 2, H * 0.65);   // escurecimento nas bordas
    gv.addColorStop(0, 'rgba(12,8,14,0)'); gv.addColorStop(1, 'rgba(12,8,14,' + q('vinheta') + ')');
    g.fillStyle = gv; g.fillRect(0, 0, W, H);
    g.globalCompositeOperation = 'destination-in'; g.drawImage(E.img, 0, 0, W, H);   // só fica o que está sobre a carta
    return c;
  }
  const tex = (E, n) => E.tex[n] || (E.tex[n] = textura(E, n));

  // isola os pixels ciano da arte (linhas de energia e olhos) para poder apagá-los e fazê-los brilhar
  function energia(E) {
    const W = E.W, H = E.H, c = tela(W, H), g = c.getContext('2d');
    g.drawImage(E.img, 0, 0, W, H);
    const d = g.getImageData(0, 0, W, H), p = d.data, a = new Uint8Array(W * H);
    for (let i = 0, k = 0; i < p.length; i += 4, k++) {
      a[k] = p[i + 3];
      if (p[i + 3] > 200 && p[i + 1] > 190 && p[i + 2] > 190 && p[i + 1] - p[i] > 45 && Math.abs(p[i + 1] - p[i + 2]) < 40) { p[i] = 150; p[i + 1] = 255; p[i + 2] = 248; p[i + 3] = 255; } else p[i + 3] = 0;
    }
    g.putImageData(d, 0, 0);
    const m = tela(W / 3 | 0, H / 3 | 0), b = tela(W / 6 | 0, H / 6 | 0), es = tela(W, H), ge = es.getContext('2d');
    m.getContext('2d').drawImage(c, 0, 0, m.width, m.height);
    b.getContext('2d').drawImage(m, 0, 0, b.width, b.height);
    ge.drawImage(c, 0, 0); ge.globalCompositeOperation = 'source-in'; ge.fillStyle = 'rgb(26,34,42)'; ge.fillRect(0, 0, W, H);
    E.alfa = a; E.en = c; E.bri = b; E.es = es;   // en: ciano · bri: brilho suave · es: ciano apagado
  }

  /* ---------------- PARTÍCULAS ---------------- */
  function ponto(E) {
    const r = E.rach[E.nivel];
    if (r && r.length && Math.random() < 0.5) { const l = r[Math.random() * r.length | 0]; return l[Math.random() * l.length | 0]; }
    return borda(E, Math.random);
  }
  function faiscar(E, n) {
    const p = ponto(E);
    for (let i = 0; i < n; i++) {
      const a = Math.random() * 6.3, v = rnd(80, 380), vida = rnd(0.25, 0.6);
      E.ps.push({ x: E.ox + p.x, y: E.oy + p.y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 120, v: vida, m: vida, c: ['#fff3b0', '#ffb347', '#9ffcf3'][i % 3] });
    }
  }
  function fumar(E, n) {
    for (let i = 0; i < n; i++) { const p = ponto(E); E.fum.push({ x: E.ox + p.x, y: E.oy + p.y, vx: rnd(-8, 8), vy: rnd(-45, -25), r: rnd(6, 10), vr: rnd(14, 22), v: 1.8, m: 1.8 }); }
  }

  /* ---------------- QUADRO ---------------- */
  function quadro(E, t) {
    if (E.parou) return;
    requestAnimationFrame(tt => quadro(E, tt));
    const dt0 = (t - E.ult) / 1000;
    if (dt0 < 0.028) return;   // ~30 quadros por segundo bastam e poupam bateria
    const dt = Math.min(0.05, dt0); E.ult = t;
    if (!E.alvo.isConnected) { E.fora = (E.fora || 0) + dt; if (E.fora > 5) remover(E.alvo); return; }
    E.fora = 0;
    if (!E.nivel) return;

    const N = NV[E.nivel], g = E.g, ox = E.ox, oy = E.oy, tr = t - E.tr;
    if (N.fa) {
      if (!E.faisca) E.faisca = t + rnd(N.fa[0], N.fa[1]);
      if (t > E.faisca) { faiscar(E, N.n); E.faisca = t + rnd(N.fa[0], N.fa[1]); }
    }
    if (N.fumo && t > E.fumar) { fumar(E, 1); E.fumar = t + N.fumo + Math.random() * 600; }

    // energia do ciano: pulsa no Lv1, falha cada vez mais nos níveis seguintes
    let e = N.base + (E.nivel === 1 ? 0.12 * Math.sin(t / 350) : 0);
    if (!calmo) {
      if (N.falha) {
        if (!E.prox) E.prox = t + rnd(N.falha[0], N.falha[1]);
        if (t > E.prox) { E.falhaAte = t + rnd(150, 400); E.prox = E.falhaAte + rnd(N.falha[0], N.falha[1]); }
        if (t < E.falhaAte) e = ((t / 45 | 0) * 7919) % 5 < 2 ? 0.04 : N.base * 1.6;
      }
      if (tr < 130) e = 1.8;                                    // sobrecarga
      else if (tr < 400) e = 0.02;                              // apagão
      else if (tr < 750) e = ((t / 40 | 0) * 7919) % 5 < 2 ? 0.03 : 1.1;   // tenta religar
      if (t - E.rep < 600) e = 1 + 0.8 * (1 - (t - E.rep) / 600);          // reparo: energia volta
    }

    g.clearRect(0, 0, E.cv.width, E.cv.height); g.globalAlpha = 1;
    E.a2 += (E.v2 - E.a2) * Math.min(1, dt * 3.5); E.a3 += (E.v3 - E.a3) * Math.min(1, dt * 3.5);
    if (E.a2 > 0.01) { g.globalAlpha = E.a2; g.drawImage(tex(E, 2), ox, oy); }
    if (E.a3 > 0.01) { g.globalAlpha = E.a3; g.drawImage(tex(E, 3), ox, oy); }
    if (E.en) {
      g.globalAlpha = Math.max(0, Math.min(0.92, (1 - e) * 1.25)); g.drawImage(E.es, ox, oy);   // ciano apagado
      g.globalCompositeOperation = 'lighter';
      g.globalAlpha = Math.min(1, e * 0.6); g.drawImage(E.bri, ox, oy, E.W, E.H);               // brilho
      g.globalAlpha = Math.min(1, e * 0.3); g.drawImage(E.en, ox, oy);
      const rc = E.rach[E.nivel];
      if (rc && E.nivel > 1) {   // energia vazando pelas rachaduras
        g.save(); g.translate(ox, oy); g.strokeStyle = 'rgb(150,255,248)'; g.lineWidth = 1.6 * E.s; g.globalAlpha = Math.min(1, e * 0.9) * (E.nivel === 3 ? E.a3 : E.a2);
        for (const l of rc) { g.beginPath(); l.forEach((pt, j) => j ? g.lineTo(pt.x, pt.y) : g.moveTo(pt.x, pt.y)); g.stroke(); }
        g.restore();
      }
      g.globalCompositeOperation = 'source-over';
    }
    E.fum = E.fum.filter(p => p.v > 0);
    for (const p of E.fum) {
      p.v -= dt; p.x += p.vx * dt; p.y += p.vy * dt; p.r += p.vr * dt;
      const gr = g.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r), a = Math.max(0, p.v / p.m) * 0.4;
      gr.addColorStop(0, 'rgba(70,66,76,' + a + ')'); gr.addColorStop(1, 'rgba(70,66,76,0)');
      g.globalAlpha = 1; g.fillStyle = gr; g.fillRect(p.x - p.r, p.y - p.r, p.r * 2, p.r * 2);
    }
    E.ps = E.ps.filter(p => p.v > 0);
    g.globalCompositeOperation = 'lighter'; g.lineWidth = 1.6 * E.s; g.lineCap = 'round';
    for (const p of E.ps) {
      p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 900 * dt; p.v -= dt;
      g.globalAlpha = Math.max(0, p.v / p.m); g.strokeStyle = p.c;
      g.beginPath(); g.moveTo(p.x, p.y); g.lineTo(p.x - p.vx * 0.03, p.y - p.vy * 0.03); g.stroke();
    }
    g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1;

    if (E.tremor > 0) {
      E.tremor = Math.max(0, E.tremor - dt * 30);
      E.alvo.style.translate = E.tremor > 0.3 && !calmo ? rnd(-1, 1) * E.tremor + 'px ' + rnd(-1, 1) * E.tremor + 'px' : '';
    }
  }

  /* ---------------- MONTAGEM ---------------- */
  function preparar(alvo) {
    let E = mapa.get(alvo);
    if (E) return E.pronto;
    const img = alvo.querySelector('img');
    if (!img) return Promise.reject(new Error('Efeitos.desgaste: o elemento precisa conter um <img> com a arte da carta'));
    E = { alvo: alvo, img: img, face: alvo.closest('button').querySelector('.original-card image'), nivel: 0, a2: 0, a3: 0, v2: 0, v3: 0, ps: [], fum: [], rach: {}, tex: {}, tr: -1e9, rep: -1e9, falhaAte: 0, prox: 0, faisca: 0, fumar: 0, tremor: 0, ult: 0 };
    mapa.set(alvo, E);
    E.pronto = new Promise(function (resolve) {
      const montar = function () {
        if (E.parou) { resolve(E); return; }
        E.W = WT; E.H = Math.round(WT * img.naturalHeight / img.naturalWidth); E.s = E.W / 460;
        E.ox = Math.round(E.W * 0.15); E.oy = Math.round(E.H * 0.15);
        try { energia(E); } catch (err) { E.en = null; }   // imagem de outra origem (ex.: file://): sem brilho, mas as marcas funcionam
        E.cv = tela(E.W + 2 * E.ox, E.H + 2 * E.oy); E.g = E.cv.getContext('2d');
        if (global.getComputedStyle(alvo).position === 'static') alvo.style.position = 'relative';
        Object.assign(E.cv.style, { position: 'absolute', left: -E.ox / E.W * 100 + '%', top: -E.oy / E.H * 100 + '%', width: E.cv.width / E.W * 100 + '%', height: E.cv.height / E.H * 100 + '%', pointerEvents: 'none', zIndex: 2 });
        alvo.appendChild(E.cv);
        requestAnimationFrame(tt => { E.ult = tt; quadro(E, tt); });
        resolve(E);
      };
      img.complete && img.naturalWidth ? montar() : img.addEventListener('load', montar, { once: true });
      img.addEventListener('error', () => { E.parou=true; mapa.delete(alvo); resolve(E); }, {once:true});
    });
    return E.pronto;
  }
  function definir(E, nivel, seco) {
    E.nivel = nivel; E.v2 = nivel >= 2 ? 1 : 0; E.v3 = nivel >= 3 ? 1 : 0; E.prox = 0; E.faisca = 0;
    if (nivel >= 2) tex(E, 2);
    if (nivel >= 3) tex(E, 3);
    if (seco) { E.a2 = E.v2; E.a3 = E.v3; E.face.style.transition = 'none'; }
    E.face.style.filter = FILTRO[nivel];
    if (seco) { void E.img.offsetWidth; }
    E.face.style.transition = 'filter .9s ease';
  }
  function remover(alvo) {
    const E = mapa.get(alvo);
    if (!E) return;
    E.parou = true; E.cv?.remove(); E.face.style.filter = ''; E.face.style.transition = ''; alvo.style.translate = ''; mapa.delete(alvo);
  }

  /* ---------------- SOM ---------------- */
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
  function tom(t, tipo, f0, f1, dur, vol, lp) {   // oscilador com queda de tom e filtro opcional
    const o = ac.createOscillator(), g = ac.createGain();
    o.type = tipo; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f1, t + dur);
    env(g, t, 0.01, dur, vol); o.connect(g);
    if (lp) { const f = ac.createBiquadFilter(); f.type = 'lowpass'; f.frequency.setValueAtTime(lp[0], t); f.frequency.exponentialRampToValueAtTime(lp[1], t + dur); g.connect(f); f.connect(bus); } else g.connect(bus);
    o.start(t); o.stop(t + dur);
  }
  function zap(t, n, vol) { for (let k = 0; k < n; k++) sopro(t + k * 0.02 + rnd(0, 0.012), 0.014, rnd(2800, 6000), 2500, 1, vol, 0.2, 'highpass'); }   // estalos elétricos
  function somDegradar(n) {
    const t = ac.currentTime + 0.01, i = n === 3 ? 1 : 0.7;
    zap(t, 8, 0.5 * i);                                                  // sobrecarga elétrica
    tom(t, 'sawtooth', 700, 55, 0.9 + 0.4 * i, 0.3 * i, [2600, 160]);    // máquina perdendo energia
    tom(t + 0.13, 'sine', 140, 40, n === 3 ? 0.9 : 0.4, 0.8 * i);        // baque grave do desarme
    sopro(t + 0.13, 0.012, 2500, 2500, 2, 0.6, 0.2);                     // clique do relé
    tom(t + 0.3, 'square', 420, 70, 0.6, 0.07 * i);                      // motor perdendo rotação
    sopro(t + 0.35, 0.5 + 0.3 * i, 800, 200, 14, 0.25 * i, 0.4);         // ranger de metal
    tom(t + 0.62, 'square', 880, 880, 0.07, 0.1); tom(t + 0.74, 'square', 440, 440, 0.1, 0.1);   // bipes de bateria fraca
    if (n === 3) for (let k = 0; k < 6; k++) zap(t + 0.4 + k * 0.17 + rnd(0, 0.1), 3, 0.3);      // faíscas residuais
  }
  function somGolpe() {
    const t = ac.currentTime + 0.01;
    zap(t, 4, 0.35); tom(t, 'sine', 1200, 1200, 0.25, 0.1); tom(t, 'sine', 3300, 3300, 0.15, 0.05); tom(t, 'triangle', 160, 60, 0.1, 0.3);
  }
  function somReparo() {
    const t = ac.currentTime + 0.01;
    tom(t, 'sine', 160, 1000, 0.45, 0.25); tom(t + 0.05, 'triangle', 320, 2000, 0.45, 0.1); tom(t + 0.45, 'sine', 1320, 1320, 0.12, 0.12);
  }

  /* ---------------- API ---------------- */
  Efeitos.desgaste = function (alvo, nivel, op) {
    op = Object.assign({ som: true, volume: 0.8 }, op);
    nivel = Math.max(1, Math.min(3, Math.round(nivel) || 1));
    return preparar(alvo).then(function (E) {
      if (E.parou) return;
      if (E.nivel === nivel) return;
      const de = E.nivel; definir(E, nivel, !de);
      if (!de) return;   // primeira vez: só instala, sem animação
      if (nivel > de) {
        E.tr = performance.now(); E.tremor = 6 + 5 * nivel;
        faiscar(E, 10 + 8 * nivel); faiscar(E, 8); fumar(E, nivel === 3 ? 5 : 2);
        if (op.som && audio(op.volume)) somDegradar(nivel);
      } else {
        E.rep = performance.now();
        if (op.som && audio(op.volume)) somReparo();
      }
      return new Promise(function (r) { setTimeout(r, 1100); });
    });
  };
  Efeitos.desgaste.nivelPorVida = function (vida) { return vida >= 180 ? 1 : vida >= 100 ? 2 : 3; };
  Efeitos.desgaste.golpe = function (alvo, op) {
    op = Object.assign({ som: true, volume: 0.8 }, op);
    return preparar(alvo).then(function (E) {
      if (E.parou) return;
      E.tremor = Math.max(E.tremor, 5); faiscar(E, E.nivel > 1 ? 7 : 4);
      if (op.som && audio(op.volume)) somGolpe();
    });
  };
  Efeitos.desgaste.remover = remover;
})(window);
