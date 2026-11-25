/*!
 * Efeitos do SAM v0.1.1 (JS puro, sem áudio externo) — golpes estilo anime; com 6 acertos o último golpe é brutal
 *   Punch ......... Efeitos.soco(cartaSam, cartaAlvo, opções)         ataque básico (50)
 *   Mega Combo .... Efeitos.megaCombo(cartaSam, cartaAlvo, opções)    passiva: sequência de golpes com dado de 6 faces
 *
 * Regra do Mega Combo (ficha do Sam): a cada golpe rola-se um d6. Número que ainda não saiu conta como acerto.
 * Ao sair um número repetido o combo termina e o Sam causa (dano básico × acertos). Máximo: 6 acertos.
 *
 *   const r = Efeitos.megaCombo.rolar();                       // { dados: [3,5,1,5], acertos: 3 }  (sorteia como a regra manda)
 *   const res = await Efeitos.megaCombo(sam, inimigo, { dano: 50, dados: r.dados, onImpacto: (x) => aplicarDano(x.dano) });
 *   // res = { acertos, dano, dados }   → dano = 50 × acertos
 *
 * Opções: dano (50, dano básico: só o número exibido; o cálculo real é do seu jogo) · dados [..] (rolagens prontas; sem isso sorteia)
 *   onGolpe(i, dado, acerto) a cada rolagem · onImpacto({acertos, dano}) no golpe final · onFim() · som (true) · volume (0.8)
 * O Sam avança e as cartas usam as propriedades CSS translate/scale durante o efeito. O som só toca depois de um toque/clique do jogador.
 */
(function (global) {
  'use strict';
  const Efeitos = global.Efeitos = global.Efeitos || {};
  const calmo = !!(global.matchMedia && global.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const rnd = (a, b) => a + Math.random() * (b - a);
  const ease = u => u * u * (3 - 2 * u);
  const pop = u => { const c = 1.70158; return 1 + (c + 1) * Math.pow(u - 1, 3) + c * Math.pow(u - 1, 2); };   // entra com um leve exagero
  const PALAVRAS = ['POW!', 'BAM!', 'WHAM!', 'BOP!', 'SMACK!', 'DON!', 'BAKI!', 'DOGA!'], CARGA = ['#fff6c9', '#ffd34a', '#ff4d2e'];

  /* ---------------- DESENHO ---------------- */
  function texto(g, s, x, y, tam, rot, fill, stroke) {
    g.save(); g.translate(x, y); g.rotate(rot); g.font = '900 ' + tam + 'px "Arial Black",Impact,sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round';
    g.lineWidth = tam * 0.18; g.strokeStyle = stroke; g.strokeText(s, 0, 0); g.fillStyle = fill; g.fillText(s, 0, 0); g.restore();
  }
  function luva(g, x, y, r, ang, alfa) {   // luva de boxe vermelha apontando para a direita (depois girada)
    g.save(); g.translate(x, y); g.rotate(ang); if (Math.cos(ang) < 0) g.scale(1, -1); g.globalAlpha = alfa; g.lineJoin = 'round'; g.lineWidth = r * 0.14;
    g.fillStyle = '#7fa8ff'; g.strokeStyle = '#2b2f66'; g.beginPath(); g.rect(-r * 1.55, -r * 0.55, r * 0.85, r * 1.1); g.fill(); g.stroke();                   // punho da luva
    g.fillStyle = '#ef4b63'; g.strokeStyle = '#4b1630'; g.beginPath(); g.ellipse(0, 0, r, r * 0.88, 0, 0, 6.3); g.fill(); g.stroke();                          // corpo
    g.beginPath(); g.ellipse(-r * 0.05, r * 0.82, r * 0.5, r * 0.3, 0.3, 0, 6.3); g.fill(); g.stroke();                                                      // polegar
    g.strokeStyle = 'rgba(255,255,255,.9)'; g.lineWidth = r * 0.14; g.lineCap = 'round'; g.beginPath(); g.arc(-r * 0.05, -r * 0.05, r * 0.62, 3.6, 4.7); g.stroke();   // brilho
    g.restore();
  }
  function explosao(g, x, y, R, rot, esc) {   // estrela de impacto de quadrinhos
    const n = 12; g.save(); g.lineJoin = 'round'; g.beginPath();
    for (let i = 0; i < n * 2; i++) { const a = rot + i * Math.PI / n, r = i % 2 ? R * 0.58 : R * (0.9 + 0.2 * Math.sin(i * 12.9898)); i ? g.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r) : g.moveTo(x + Math.cos(a) * r, y + Math.sin(a) * r); }
    g.closePath(); g.fillStyle = '#ffe66b'; g.strokeStyle = '#ff4d2e'; g.lineWidth = 6 * esc; g.fill(); g.stroke();
    g.beginPath(); g.arc(x, y, R * 0.4, 0, 6.3); g.fillStyle = '#fff6c9'; g.fill(); g.restore();
  }
  function dado(g, x, y, tam, n, novo) {   // dado que aparece a cada rolagem: dourado = acerto, vermelho = repetido
    g.save(); g.translate(x, y); g.fillStyle = novo ? '#ffd34a' : '#ef3b4f'; g.strokeStyle = '#2a1330'; g.lineWidth = tam * 0.12; g.lineJoin = 'round';
    g.beginPath(); g.rect(-tam / 2, -tam / 2, tam, tam); g.fill(); g.stroke(); g.restore();
    texto(g, String(n), x, y + tam * 0.03, tam * 0.7, 0, novo ? '#2a1330' : '#fff', novo ? '#fff' : '#2a1330');
  }
  function bandeja(g, cx, cy, esc, estado, t) {   // os 6 números: acende o que já saiu
    const r = 15 * esc, gap = 38 * esc, x0 = cx - gap * 2.5;
    for (let i = 0; i < 6; i++) {
      const x = x0 + i * gap, e = estado[i], rr = r * (e ? Math.max(0.6, pop(Math.min(1, (t - e.t0) / 180))) : 1);
      g.beginPath(); g.arc(x, cy, rr, 0, 6.3); g.fillStyle = e ? (e.c === 1 ? '#ffd34a' : '#ef3b4f') : 'rgba(20,12,34,.72)'; g.fill();
      g.lineWidth = 2.5 * esc; g.strokeStyle = e ? '#fff' : 'rgba(255,255,255,.45)'; g.stroke();
      texto(g, String(i + 1), x, cy + 1, r * 1.1, 0, e ? '#2a1330' : 'rgba(255,255,255,.6)', e ? '#fff' : 'rgba(0,0,0,0)');
    }
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
  function raio(g, x, y, L, a, w) {   // corte diagonal de anime, afina nas pontas
    const c = Math.cos(a), s = Math.sin(a); g.save(); g.fillStyle = '#fff'; g.strokeStyle = '#ff4d2e'; g.lineWidth = 3;
    g.beginPath(); g.moveTo(x - c * L, y - s * L); g.lineTo(x - s * w, y + c * w); g.lineTo(x + c * L, y + s * L); g.lineTo(x + s * w, y - c * w); g.closePath(); g.fill(); g.stroke(); g.restore();
  }

  /* ---------------- MOTOR ---------------- */
  function rolar() {   // sorteia como a regra manda: para no primeiro número repetido
    const vistos = new Set(), dados = [];
    for (;;) { const d = 1 + Math.floor(Math.random() * 6); dados.push(d); if (vistos.has(d)) break; vistos.add(d); }
    return { dados: dados, acertos: vistos.size };
  }

  function executar(origem, alvo, op, combo) {
    op = Object.assign({ som: true, volume: 0.8, dano: 50 }, op);
    let dados = [], hits = 1;
    if (combo) {   // normaliza: corta no primeiro repetido; se não houver, força um repetido (máx. 6 acertos)
      dados = (op.dados && op.dados.length ? op.dados : rolar().dados).slice();
      const vistos = new Set(); let k = -1;
      for (let i = 0; i < dados.length; i++) { if (vistos.has(dados[i])) { k = i; break; } vistos.add(dados[i]); }
      if (k < 0) { k = dados.length; dados.push(dados[0]); }
      dados.length = k + 1; hits = k;
    }
    const TV = 70, TF = 110, T0 = 170, ts = [];
    let tt = T0, tFin = T0;
    if (combo) { for (let i = 0; i <= hits; i++) { ts.push(tt); tt += Math.max(130, 260 - 26 * i); } tFin = ts[hits] + 260; }   // cada golpe fica mais rápido; o último rola o repetido
    const BRU = combo && hits >= 6, tCh = tFin;   // 6 acertos: carrega, tela escurece e o último soco é brutal
    if (BRU) tFin += 1250;
    const tImp = tFin + (BRU ? 170 : combo ? TF : 80), FIM = tImp + (BRU ? 1900 : 850), total = op.dano * hits, F = BRU ? 3 : combo ? Math.min(2.1, 1 + hits * 0.18) : 1;

    return new Promise(function (resolve) {
      const ro = origem.getBoundingClientRect(), rt = alvo.getBoundingClientRect(), W = global.innerWidth, H = global.innerHeight;
      const S = { x: ro.left + ro.width / 2, y: ro.top + ro.height / 2 }, T = { x: rt.left + rt.width / 2, y: rt.top + rt.height / 2 };
      const dx = T.x - S.x, dy = T.y - S.y, dist = Math.hypot(dx, dy) || 1, ux = dx / dist, uy = dy / dist, px = -uy, py = ux;
      const esc = Math.max(0.5, Math.min(1.6, Math.sqrt(rt.width * rt.height) / 260)), lx = dx * 0.38, ly = dy * 0.38;
      const trayX = (S.x + T.x) / 2, trayY = Math.max(30 * esc, Math.min(ro.top, rt.top) - 34 * esc);

      const cv = document.createElement('canvas'), dpr = Math.min(global.devicePixelRatio || 1, 2);
      cv.width = W * dpr; cv.height = H * dpr;
      Object.assign(cv.style, { position: 'fixed', left: 0, top: 0, width: W + 'px', height: H + 'px', pointerEvents: 'none', zIndex: 99999 });
      document.body.appendChild(cv);
      const g = cv.getContext('2d'); g.scale(dpr, dpr);

      const pos0 = origem.style.position, z0 = origem.style.zIndex, f0 = alvo.style.filter;
      if (global.getComputedStyle(origem).position === 'static') origem.style.position = 'relative';
      origem.style.zIndex = 99997;

      // linha do tempo de eventos
      const ev = [];
      if (combo) {
        for (let i = 0; i < hits; i++) ev.push({ t: ts[i], k: 'lanca', i: i }, { t: ts[i] + TV, k: 'acerto', i: i });
        ev.push({ t: ts[hits], k: 'repete' });
      }
      if (BRU) ev.push({ t: tCh, k: 'carrega' });
    ev.push({ t: tFin, k: 'lancaFinal' }, { t: tImp, k: 'fim' });
      ev.sort((a, b) => a.t - b.t);

      let t = 0, ult = performance.now(), pi = 0, luvas = [], bursts = [], aneis = [], pops = [], estado = [0, 0, 0, 0, 0, 0], dmg = null;
      let flash = 0, tremor = 0, kb = 0, jit = 0, armar = false;
      let parts = [], cracks = [], focos = [], tits = [], cam = 0, nh = 0, crT = 0, ip = T;
      const jorra = (x, y, n, v, cores, life, gr, sz, ring) => {   // faíscas e estilhaços (ring: nascem num círculo e correm para o centro)
        for (let i = 0; i < n; i++) {
          const a = rnd(0, 6.2832), c = Math.cos(a), s = Math.sin(a), sp = rnd(0.35, 1) * v;
          parts.push(ring ? { x: x + c * ring, y: y + s * ring, vx: -c * sp, vy: -s * sp, gr: 0, t0: t, life: life, c: cores[i % cores.length], s: rnd(0.6, 1) * sz, r: a, vr: 0 }
            : { x: x, y: y, vx: c * sp, vy: s * sp - v * 0.25, gr: gr, t0: t, life: life * rnd(0.7, 1.2), c: cores[i % cores.length], s: rnd(0.6, 1) * sz, r: rnd(0, 6.3), vr: rnd(-12, 12) });
        }
      };
      const lado = i => (i % 2 ? 1 : -1);
      if (op.som && audio(op.volume)) somSam(combo, dados, hits, ts, tFin, tImp, F, tCh);

      function lancar(i, big, ex) {
        const s = ease(Math.min(1, t / 170)), l = big ? 0 : lado(i + (ex || 0)), ox = lx * s, oy = ly * s;
        luvas.push({ t0: t + (ex || 0) * 16, dur: big ? (BRU ? 170 : TF) : TV, big: big, a: ex ? 0.45 : 1, br: big && BRU,
          O: { x: S.x + ox + ux * ro.width * 0.42 + px * l * ro.height * 0.16, y: S.y + oy + uy * ro.width * 0.42 + py * l * ro.height * 0.16 },
          P: { x: T.x - ux * rt.width * 0.22 + px * l * rt.height * 0.14 + rnd(-6, 6), y: T.y - uy * rt.width * 0.22 + py * l * rt.height * 0.14 + rnd(-6, 6) } });
      }
      function tratar(e) {
        if (e.k === 'lanca') { lancar(e.i, false); lancar(e.i, false, 1); lancar(e.i, false, 2); jit = 5; }
        else if (e.k === 'acerto') {
          const f = 0.35 + 0.1 * e.i, l = luvas[luvas.length - 1], p = l ? l.P : T;
          estado[dados[e.i] - 1] = { c: 1, t0: t };
          pops.push({ t0: t, x: T.x + rnd(-0.15, 0.15) * rt.width, y: T.y - rt.height * 0.55, n: dados[e.i], novo: true });
          bursts.push({ x: p.x, y: p.y, R: (36 + 26 * f) * esc, rot: rnd(0, 6.3), t0: t, life: 260, palavra: PALAVRAS[Math.random() * PALAVRAS.length | 0], wrot: rnd(-0.2, 0.2), sl: rnd(-0.5, 0.5) + (e.i % 2 ? 0.6 : -0.6) });
          aneis.push({ x: p.x, y: p.y, r: 6 * esc, vr: 380 * esc * f, a: 0.8 });
          nh++; focos.push({ t0: t, x: p.x, y: p.y, life: 170, n: 40, al: 0.55 }); cam = Math.max(cam, 2 + 0.8 * e.i);
          jorra(p.x, p.y, 8 + 2 * e.i, 300 * esc * (1 + f), ['#fff6c9', '#ffd34a', '#ff7a3d'], 420, 600 * esc, 5 * esc);
          tremor = Math.max(tremor, 4 + 5 * f); kb = Math.max(kb, 8 * esc * (0.5 + f)); flash = Math.max(flash, 0.3 + 0.4 * f);
          if (op.onGolpe) { try { op.onGolpe(e.i, dados[e.i], true); } catch (x) { console.error(x); } }
        } else if (e.k === 'repete') {   // número repetido: o combo vai acabar
          estado[dados[hits] - 1] = { c: 2, t0: t };
          pops.push({ t0: t, x: T.x, y: T.y - rt.height * 0.55, n: dados[hits], novo: false });
          tremor = Math.max(tremor, 7); armar = true;
          if (op.onGolpe) { try { op.onGolpe(hits, dados[hits], false); } catch (x) { console.error(x); } }
        } else if (e.k === 'carrega') { tits.push({ t0: t, life: tFin - tCh, txt: 'MAX COMBO!', x: trayX, y: trayY + 54 * esc, tam: 40, rot: -0.06, fill: '#ffd34a', stroke: '#7a0f1f' }); flash = 0.8; tremor = 9; }
        else if (e.k === 'lancaFinal') { armar = false; lancar(0, true); jit = 8; }
        else if (e.k === 'fim') {   // golpe final: força proporcional aos acertos
          const l = luvas[luvas.length - 1], p = l ? l.P : T;
          bursts.push({ x: p.x, y: p.y, R: (80 + 40 * F) * esc, rot: rnd(0, 6.3), t0: t, life: 520, palavra: combo ? '×' + hits : 'POW!', wrot: rnd(-0.15, 0.15), grande: true });
          aneis.push({ x: p.x, y: p.y, r: 10 * esc, vr: 800 * esc * F, a: 1 }, { x: p.x, y: p.y, r: 4 * esc, vr: 480 * esc * F, a: 0.8 });
          dmg = { t0: t, x: T.x, y: T.y - rt.height * 0.12, txt: '-' + total, g: BRU ? 2.1 : 1 };
          tremor = BRU ? 30 : 10 + 8 * F; kb = 34 * esc * F; flash = BRU ? 2 : 1; cam = BRU ? 26 : 8; ip = p;
          focos.push({ t0: t, x: p.x, y: p.y, life: BRU ? 700 : 280, n: 56, al: 0.9 });
          jorra(p.x, p.y, BRU ? 80 : combo ? 30 : 16, (BRU ? 1000 : 520) * esc, ['#fff6c9', '#ffd34a', '#ff7a3d', '#ef4b63'], BRU ? 1100 : 520, 900 * esc, (BRU ? 9 : 6) * esc);
          if (BRU) {
            cracks = racha(p.x, p.y, Math.min(W, H) * 0.55, 10); crT = t;
            [1500, 1100, 750].forEach(v => aneis.push({ x: p.x, y: p.y, r: 6 * esc, vr: v * esc, a: 1.2 }));
            jorra(p.x, p.y, 40, 800 * esc, ['#c8bfd0', '#fdf8e8', '#2a1330', '#f3a7c0'], 1400, 1500 * esc, 12 * esc);   // estilhaços da carta
            tits.push({ t0: t, life: 1600, txt: 'BRUTAL!!', x: W / 2, y: Math.max(90 * esc, (S.y + T.y) / 2 - rt.height * 0.62), tam: Math.min(92, W / 6.2 / esc), rot: -0.12, fill: '#fff', stroke: '#c0152f' });
          }
          if (op.onImpacto) { try { const real=op.onImpacto({ acertos: hits, dano: total }); if(Number.isFinite(real)) dmg.txt='-'+real; else dmg=null; } catch (x) { console.error(x); } }
        }
      }

      function finish(){
          cv.remove(); origem.style.translate = ''; origem.style.scale = ''; origem.style.zIndex = z0; origem.style.position = pos0; alvo.style.translate = ''; alvo.style.rotate = ''; alvo.style.filter = f0;
          if (op.onFim) { try { op.onFim(); } catch (x) { console.error(x); } }
          resolve({ acertos: hits, dano: total, dados: dados });
      }
      function quadro(agora) {
        if(op.signal?.aborted||op.encerrar?.()){finish();return;}
        if(op.pausado?.()){ult=agora;requestAnimationFrame(quadro);return;}
        const dt = Math.min(0.05, Math.max(0, (agora - ult) / 1000)); ult = agora; t += dt * 1000;
        while (pi < ev.length && t >= ev[pi].t) tratar(ev[pi++]);
        g.clearRect(0, 0, W, H);

        // o Sam avança, balança a cada golpe e recua no fim
        const a = ease(Math.min(1, t / 170)), b = ease(Math.max(0, Math.min(1, (t - (FIM - 380)) / 380))), s = a * (1 - b);
        jit = Math.max(0, jit - dt * 40); cam = Math.max(0, cam - dt * 30);
        const rec = BRU ? ease(Math.max(0, Math.min(1, (t - tCh) / (tFin - 90 - tCh)))) : 0, dash = BRU ? ease(Math.max(0, Math.min(1, (t - tFin + 90) / 110))) : 0;
        const pf = s + (BRU ? (-0.5 * rec * (1 - dash) + 0.25 * dash) * (1 - b) : 0), cx = calmo ? 0 : rnd(-cam, cam), cy = calmo ? 0 : rnd(-cam, cam);
        origem.style.translate = (lx * pf + cx + (calmo ? 0 : rnd(-jit, jit))) + 'px ' + (ly * pf + cy + (calmo ? 0 : rnd(-jit, jit))) + 'px';
        origem.style.scale = String(1 + 0.1 * s - (armar ? 0.06 : 0) + 0.14 * rec);

        const mx = (S.x + T.x) / 2, my = (S.y + T.y) / 2, sx = S.x + lx * pf, sy = S.y + ly * pf, cg = BRU && t >= tCh && t < tFin, uc = cg ? ease(Math.min(1, (t - tCh) / (tFin - tCh))) : 0;
        let va = combo ? 0.07 * nh : 0; if (BRU && t >= tCh) va = 0.45 + 0.4 * uc; va *= Math.min(1, Math.max(0, (FIM - t) / 500));
        if (va > 0.01) vinheta(g, W, H, mx, my, Math.min(0.9, va), BRU && t >= tCh ? '40,0,12' : '12,6,30');
        if (cg) {   // carga do golpe brutal: aura, brilho e faíscas correndo para o SAM
          if (!calmo) { jit = Math.max(jit, 2 + 5 * uc); jorra(sx, sy, 2, 300 * esc, CARGA, 520, 0, 5 * esc, 160 * esc); parts.push({ x: sx + rnd(-0.4, 0.4) * ro.width, y: sy + ro.height * 0.45, vx: rnd(-25, 25), vy: -rnd(180, 380) * esc, gr: -60, t0: t, life: 600, c: '#ff8a3d', s: rnd(4, 8) * esc, r: 0, vr: 0 }); }
          g.save(); g.globalCompositeOperation = 'lighter'; const gl = g.createRadialGradient(sx, sy, 0, sx, sy, ro.height * (0.5 + 0.5 * uc));
          gl.addColorStop(0, 'rgba(255,140,50,' + (0.25 + 0.3 * uc) * (0.85 + 0.15 * Math.sin(t / 55)) + ')'); gl.addColorStop(1, 'rgba(255,80,40,0)'); g.fillStyle = gl; g.fillRect(0, 0, W, H); g.restore();
          foco(g, sx, sy, W, H, ro.height * 0.55, 44, Math.floor(t / 45), 'rgb(255,190,90)', 0.12 + 0.28 * uc, 0.022);
        }
        if (combo) { g.globalAlpha = t > FIM - 300 ? Math.max(0, (FIM - t) / 300) : 1; bandeja(g, trayX, trayY, esc, estado, t); g.globalAlpha = 1; }

        for (const l of luvas) {   // luvas voando, com rastro
          const u = (t - l.t0) / l.dur, uu = Math.min(1, Math.max(0, u)), r = (l.big ? 46 : 32) * esc * (l.br ? 1 + 3 * uu * uu : 1), ang = Math.atan2(l.P.y - l.O.y, l.P.x - l.O.x);
          const alfa = (u > 1 ? Math.max(0, 1 - (u - 1) * 3) : 1) * l.a;
          if (alfa <= 0 || u < 0) continue;
          for (let j = 3; j >= 1; j--) { const v = Math.max(0, uu - j * 0.12), e = v * v; luva(g, l.O.x + (l.P.x - l.O.x) * e, l.O.y + (l.P.y - l.O.y) * e, r, ang, 0.22 * alfa / j); }
          luva(g, l.O.x + (l.P.x - l.O.x) * uu * uu, l.O.y + (l.P.y - l.O.y) * uu * uu, r * (u > 1 ? 1.15 : 1), ang, alfa);
        }
        aneis = aneis.filter(r => r.a > 0);
        for (const r of aneis) { r.r += r.vr * dt; r.a -= dt * 3; g.globalAlpha = Math.max(0, r.a); g.strokeStyle = '#fff'; g.lineWidth = 4 * esc; g.beginPath(); g.arc(r.x, r.y, r.r, 0, 6.3); g.stroke(); }
        g.globalAlpha = 1;
        for (const k of bursts) {   // estrelas de impacto, palavra e linhas de velocidade
          const u = (t - k.t0) / k.life; if (u < 0 || u > 1) continue;
          const sc = pop(Math.min(1, u * 3)), al = u > 0.6 ? 1 - (u - 0.6) / 0.4 : 1;
          g.globalAlpha = al; if (k.sl !== undefined) raio(g, k.x, k.y, k.R * 2.4 * sc, k.sl, k.R * 0.2); explosao(g, k.x, k.y, k.R * sc, k.rot, esc);
          if (k.grande) { g.strokeStyle = '#fff'; g.lineWidth = 3 * esc; for (let i = 0; i < 20; i++) { const an = i * 0.314 + k.rot, r0 = k.R * (1.05 + 0.2 * sc), r1 = k.R * (1.5 + 0.9 * u * (1 + (i % 3) * 0.3)); g.beginPath(); g.moveTo(k.x + Math.cos(an) * r0, k.y + Math.sin(an) * r0); g.lineTo(k.x + Math.cos(an) * r1, k.y + Math.sin(an) * r1); g.stroke(); } }
          texto(g, k.palavra, k.x, k.y, k.R * (k.grande ? 0.6 : 0.5) * sc, k.wrot, '#fff', '#b3122b'); g.globalAlpha = 1;
        }
        parts = parts.filter(q => t - q.t0 < q.life);
        for (const q of parts) { const u = (t - q.t0) / q.life; q.vy += q.gr * dt; q.x += q.vx * dt; q.y += q.vy * dt; q.r += q.vr * dt; g.save(); g.translate(q.x, q.y); g.rotate(q.r); g.globalAlpha = 1 - u * u; g.fillStyle = q.c; g.beginPath(); g.moveTo(-q.s, 0); g.lineTo(q.s, -q.s * 0.45); g.lineTo(q.s * 0.4, q.s * 0.5); g.closePath(); g.fill(); g.restore(); }
        focos = focos.filter(f => t - f.t0 < f.life);
        for (const f of focos) { const u = (t - f.t0) / f.life; foco(g, f.x, f.y, W, H, 60 * esc * (1 + u), f.n, Math.floor(f.t0 % 97) + Math.floor(u * 3), '#fff', f.al * (1 - u), 0.026); }
        if (cracks.length) {
          const u = (t - crT) / 1500, pr = Math.min(1, (t - crT) / 100);
          if (u < 1) { g.save(); g.globalAlpha = u > 0.6 ? 1 - (u - 0.6) / 0.4 : 1; g.lineCap = 'round'; g.lineJoin = 'round';
            for (const w of [[7, '#1a0a14'], [2.5, '#fff']]) { g.lineWidth = w[0] * esc; g.strokeStyle = w[1]; for (const c of cracks) { g.beginPath(); c.forEach((pt, i) => { if (i <= pr * (c.length - 1)) i ? g.lineTo(pt[0], pt[1]) : g.moveTo(pt[0], pt[1]); }); g.stroke(); } }
            g.restore(); }
        }
        tits = tits.filter(k => t - k.t0 < k.life);
        for (const k of tits) { const u = (t - k.t0) / k.life, sh = calmo ? 0 : (1 - u) * 5 * esc; g.globalAlpha = u > 0.75 ? 1 - (u - 0.75) / 0.25 : 1; texto(g, k.txt, k.x + rnd(-sh, sh), k.y + rnd(-sh, sh), k.tam * esc * Math.max(0.2, pop(Math.min(1, u * 5))), k.rot, k.fill, k.stroke); g.globalAlpha = 1; }
        pops = pops.filter(p => t - p.t0 < 700);
        for (const p of pops) { const u = (t - p.t0) / 700; g.globalAlpha = u > 0.7 ? 1 - (u - 0.7) / 0.3 : 1; dado(g, p.x, p.y - 24 * esc * u, 42 * esc * Math.max(0.2, pop(Math.min(1, u * 4))), p.n, p.novo); }
        g.globalAlpha = 1;
        if (dmg) { const u = (t - dmg.t0) / (BRU ? 1500 : 1000); if (u >= 0 && u <= 1) { g.globalAlpha = u > 0.7 ? 1 - (u - 0.7) / 0.3 : 1; texto(g, dmg.txt, dmg.x, dmg.y - 40 * esc * u, 50 * esc * dmg.g * Math.max(0.3, pop(Math.min(1, u * 5))), 0, '#fff', '#c0152f'); g.globalAlpha = 1; } }

        // reação do alvo: leva empurrões na direção do golpe e pisca
        tremor = Math.max(0, tremor - dt * 30); kb *= Math.exp(-dt * (BRU ? 3.5 : 8)); flash = Math.max(0, flash - dt * 5);
        alvo.style.translate = (ux * kb + cx + (calmo ? 0 : rnd(-tremor, tremor))) + 'px ' + (uy * kb + cy + (calmo ? 0 : rnd(-tremor, tremor))) + 'px';
        alvo.style.rotate = (BRU ? kb * 0.16 * (ux >= 0 ? 1 : -1) : 0) + 'deg';
        alvo.style.filter = flash > 0.02 ? 'brightness(' + (1 + flash) + ')' : f0;

        const ui = (t - tImp) / (BRU ? 170 : 70);   // quadro de impacto: branco e depois preto com linhas, como no anime
        if (ui >= 0 && ui < 1) { g.globalAlpha = 1; if (ui < 0.4) { g.fillStyle = '#fff'; g.fillRect(0, 0, W, H); } else { g.fillStyle = '#0a0412'; g.fillRect(0, 0, W, H); foco(g, ip.x, ip.y, W, H, 26 * esc, 60, 7, '#fff', 1, 0.034); g.fillStyle = '#fff'; g.beginPath(); g.arc(ip.x, ip.y, 40 * esc * (1 + 0.3 * F), 0, 6.3); g.fill(); } }
        if (t < FIM) requestAnimationFrame(quadro);
        else finish();
      }
      requestAnimationFrame(quadro);
    });
  }
  Efeitos.soco = (origem, alvo, op) => executar(origem, alvo, op, false);
  Efeitos.megaCombo = (origem, alvo, op) => executar(origem, alvo, op, true);
  Efeitos.megaCombo.rolar = rolar;

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
  function tom(t, tipo, f0, f1, dur, vol, lp) {
    const o = ac.createOscillator(), g = ac.createGain();
    o.type = tipo; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f1, t + dur);
    env(g, t, 0.005, dur, vol); o.connect(g);
    if (lp) { const f = ac.createBiquadFilter(); f.type = 'lowpass'; f.frequency.setValueAtTime(lp[0], t); f.frequency.exponentialRampToValueAtTime(lp[1], t + dur); g.connect(f); f.connect(bus); } else g.connect(bus);
    o.start(t); o.stop(t + dur);
  }
  function sino(t, base, vol) { [1, 2.756, 5.404].forEach(function (m, i) { tom(t, 'sine', base * m, base * m, 1.1 / (1 + i * 0.8), vol / (1 + i * 0.7)); }); }   // sino de ringue
  function somSam(combo, dados, hits, ts, tFin, tImp, F, tCh) {
    const t = ac.currentTime + 0.01;
    if (combo) {
      for (let i = 0; i < hits; i++) {
        const a = t + ts[i] / 1000, f = 0.35 + 0.1 * i, ti = a + 0.07;
        sopro(a, 0.07, 800, 3200, 1.2, 0.35 * f + 0.1, 0.8);                    // soco cortando o ar
        sopro(ti, 0.08, 3500, 700, 0.9, 0.5 * f + 0.15, 0.08);                  // couro estalando
        tom(ti, 'sine', 170, 55, 0.14, 0.6 * f + 0.15);                         // peso do golpe
        const fd = 600 * Math.pow(2, i / 6); tom(ti, 'sine', fd, fd, 0.14, 0.22); tom(ti, 'sine', fd * 2, fd * 2, 0.1, 0.08);   // "ding" do acerto: sobe a cada golpe
      }
      const tr = t + ts[hits] / 1000; tom(tr, 'sawtooth', 140, 110, 0.28, 0.35, [900, 300]); tom(tr, 'square', 90, 70, 0.2, 0.2);   // buzina: número repetido
    }
    const tf = t + tFin / 1000, ti = t + tImp / 1000;
    sopro(tf, combo ? 0.11 : 0.08, 500, 3500, 1, 0.5, 0.8);                      // golpe final no ar
    tom(ti, 'sine', 110, 28, 0.35 + 0.2 * F, 0.7 + 0.2 * F);                     // estrondo
    sopro(ti, 0.3, 3000, 200, 0.7, 0.5 + 0.2 * F, 0.05, 'lowpass');
    sopro(ti, 0.08, 4000, 800, 0.9, 0.7, 0.05);
    if (combo) { sino(ti + 0.05, 1700, 0.25); sino(ti + 0.4, 1700, 0.2); }
    if (combo && hits >= 6) {   // golpe brutal: subida de tensão, batidas graves, soco com graves longos e vidro quebrando
      const ca = t + tCh / 1000, cd = (tFin - tCh) / 1000;
      sopro(ca, cd, 150, 5000, 2, 0.5, 0.95, 'bandpass'); tom(ca, 'sawtooth', 70, 600, cd, 0.2, [300, 4000]);
      [0.15, 0.55, 0.85].forEach(k => tom(ca + cd * k, 'sine', 90, 40, 0.2, 0.7));
      tom(ti, 'sine', 70, 18, 1.4, 1); sopro(ti, 0.5, 8000, 2500, 1.5, 0.7, 0.02); sopro(ti + 0.05, 1.2, 2500, 90, 0.7, 0.7, 0.03, 'lowpass'); sino(ti + 0.7, 1700, 0.3);
    }       // ding-ding de ringue
  }
})(window);
