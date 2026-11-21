/* CardTouch v0.1.1
 * Toque na carta em batalha:
 *  - vez de atacar : 1º toque = botão ATACK; 2º toque na carta = abre a aba (botão continua); 3º = fecha
 *  - fora da vez   : 1º toque = só a aba (sem botão); 2º toque = fecha
 * Toque fora, ESC ou resize também fecham.
 */
(function () {
  'use strict';
  const DEF = {
    selector: '[data-tc-card]',
    assets: 'assets/',                 // pasta com star.png, heart.png, sword.png
    labels: { attack: 'ATACK' },
    getCard: null,                     // (el) => dados da carta  (obrigatório)
    isAttackTurn: () => false,         // (card, el) => boolean
    onAttack: () => {}                 // (card, el) => void
  };
  let O = DEF, st = null, down = null, controller = null;
  const frames = new Set();
  const reduced = () => matchMedia('(prefers-reduced-motion:reduce)').matches;
  const html = h => { const t = document.createElement('template'); t.innerHTML = h.trim(); return t.content.firstChild; };
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const count = (c, t) => (c.status || []).filter(s => s.type === t).length;
  const PW = () => Math.min(232, innerWidth - 16);
  const sideOf = r => (innerWidth - r.right - 12 >= PW() ? 'r' : r.left - 12 >= PW() ? 'l' : 'b');

  /* bolinhas vermelha (nerfs) e verde (buffs) na lateral da carta */
  function badges(el) {
    const c = O.getCard(el); if (!c) return;
    const nn = count(c, 'nerf'), nb = count(c, 'buff'), key = nn + '-' + nb;
    el.style.setProperty('--tcb', Math.max(20, el.offsetWidth * .14) + 'px');
    if (el.dataset.tcb === key) return;
    el.dataset.tcb = key;
    const old = el.querySelector(':scope > .tc-badges'); if (old) old.remove();
    if (!nn && !nb) return;
    el.style.setProperty('--tcb', Math.max(20, el.offsetWidth * .14) + 'px');
    el.appendChild(html('<div class="tc-badges">' + (nn ? '<span class="tc-b nerf">' + nn + '</span>' : '') + (nb ? '<span class="tc-b buff">' + nb + '</span>' : '') + '</div>'));
  }

  function tap(el,keyboard) {
    if (st && st.el === el) {                       // segundo toque na mesma carta
      if (st.atk && !st.pan && !st.inline) showPanel(); else close();
      return;
    }
    close(true);
    const c = O.getCard(el); if (!c) return;
    st = { el, c, atk: !!O.isAttackTurn(c, el), rect: el.getBoundingClientRect(), scrollX, scrollY };
    el.classList.add('tc-sel'); el.setAttribute('aria-expanded','true');
    st.atk ? showButton() : showPanel();
    if(keyboard && st.btn && O.inlineDetails)st.btn.focus({preventScroll:true});
  }

  function showButton() {
    const b = html('<button class="tc-atk" type="button">' + esc(O.labels.attack) + '</button>');
    document.body.appendChild(b); st.btn = b;
    const r = st.rect, w = b.offsetWidth, h = b.offsetHeight;
    const top = sideOf(r) === 'b' && r.top > h + 20 ? r.top - h - 12 : Math.min(r.bottom + 12, innerHeight - h - 8);
    b.style.left = Math.min(Math.max(8, r.left + r.width / 2 - w / 2), innerWidth - w - 8) + 'px';
    b.style.top = top + 'px';
    b.addEventListener('click', e => { e.stopPropagation(); attack(); });
  }

  function showPanel() {
    if(O.inlineDetails){st.inline=true;O.inlineDetails(st.c);return;}
    const c = st.c, r = st.rect, w = PW(), s = sideOf(r), a = c.ability || {};
    const hp = Math.max(0, Number(c.hp) || 0), f = Math.max(0, Math.min(1, hp / (c.maxHp || hp || 1)));
    const list = (c.status || []).map((x, i) =>
      '<li style="--i:' + (i + 3) + '"><span class="tc-dot ' + esc(x.type) + '"></span>• ' + esc(x.name) + (x.value ? ' ' + esc(x.value) : '') + '</li>').join('');
    const p = html(
      '<div class="tc-pop" role="dialog" aria-label="' + esc(c.name) + '" style="--tcw:' + w + 'px">' +
        '<div class="tc-box"><button class="tc-close" type="button" aria-label="Fechar detalhes">×</button>' +
          '<div class="tc-star">'+ArenaArt.emblem(c)+'</div>' +
          '<h3 style="--i:1">' + esc(a.name) + '</h3>' +
          '<p style="--i:2">' + esc(a.text) + '</p>' +
          (list ? '<ul>' + list + '</ul>' : '') +
        '</div>' +
        '<div class="tc-stats">' +
          '<div class="tc-hp" style="--f:' + f + '"><i></i><b data-n="' + hp + '">' + hp + '</b><img src="' + O.assets + 'heart.png" alt=""></div>' +
          '<div class="tc-dmg"><b data-n="' + (c.atk || 0) + '">' + (c.atk || 0) + '</b><img src="' + O.assets + 'sword.png" alt=""></div>' +
        '</div>' +
      '</div>');
    p.style.setProperty('--tc-o', s === 'r' ? 'left center' : s === 'l' ? 'right center' : 'bottom center');
    p.style.setProperty('--tc-dx', s === 'r' ? '-34px' : s === 'l' ? '34px' : '0px');
    p.style.setProperty('--tc-dy', s === 'b' ? '34px' : '0px');
    p.style.setProperty('--tc-r', s === 'l' ? '5deg' : '-5deg');
    document.body.appendChild(p); st.pan = p;
    p.querySelector('.tc-close').addEventListener('click', () => close(true));
    if(st.btn && s === 'b') p.style.maxHeight = Math.max(100, innerHeight - 110) + 'px';
    const h = p.offsetHeight, margin = 28;
    if (s === 'b') { p.style.left = (innerWidth - w) / 2 + 'px'; p.style.top = Math.max(margin, innerHeight - h - 8) + 'px'; }
    else { p.style.left = (s === 'r' ? r.right + 12 : r.left - w - 12) + 'px'; p.style.top = Math.min(Math.max(margin, r.top), Math.max(margin, innerHeight - h - 8)) + 'px'; }
    if (st.btn && s === 'b') st.btn.style.top = Math.max(8, parseFloat(p.style.top) + parseFloat(getComputedStyle(p).marginTop) - st.btn.offsetHeight - 12) + 'px';
    if (!reduced()) p.querySelectorAll('b[data-n]').forEach(b => {   // números sobem até o valor
      const to = +b.dataset.n, t0 = performance.now() + 450; b.textContent = 0;
      (function step(t) { const k = Math.min(1, Math.max(0, (t - t0) / 700)); b.textContent = Math.round(to * (1 - Math.pow(1 - k, 3))); if (k < 1 && p.isConnected) { const id = requestAnimationFrame(t => { frames.delete(id); step(t); }); frames.add(id); } })(performance.now());
    });
  }

  function attack() {
    if (!st) return;
    const { el } = st, c = O.getCard(el);
    if (!c || !O.isAttackTurn(c, el)) { close(true); return; }
    close(true);
    el.classList.add('tc-hit'); setTimeout(() => el.classList.remove('tc-hit'), 300);
    O.onAttack(c, el);
  }

  function close(instant) {
    if (!st) return;
    const { el, btn, pan } = st; st = null; el.classList.remove('tc-sel'); el.setAttribute('aria-expanded','false');
    for (const id of frames) cancelAnimationFrame(id); frames.clear();
    if (btn?.contains(document.activeElement) || pan?.contains(document.activeElement)) el.focus({preventScroll:true});
    [btn, pan].forEach(n => { if (!n) return; if (instant) return n.remove(); n.classList.add('out'); setTimeout(() => n.remove(), 220); });
  }

  function listen() {
    controller = new AbortController(); const options = {signal:controller.signal};
    // Native click handles mouse, touch and keyboard once. Reject drag gestures.
    document.addEventListener('pointerdown', e => { down = {id:e.pointerId, x:e.clientX, y:e.clientY, moved:false}; }, options);
    document.addEventListener('pointermove', e => { if(down && down.id===e.pointerId && Math.hypot(e.clientX-down.x,e.clientY-down.y)>10) down.moved=true; }, options);
    document.addEventListener('pointercancel', () => { down=null; }, options);
    document.addEventListener('click', e => {
      const dragged=e.detail>0 && down?.moved; down=null; if(dragged || e.button!==0)return;
      const t=e.target; if(t.closest('.tc-atk,.tc-pop'))return;
      const el=t.closest(O.selector); el ? tap(el,e.detail===0) : close(true);
    }, options);
    document.addEventListener('keydown', e => { if(e.key==='Escape')close(true); }, options);
    addEventListener('resize', () => close(true), options);
    document.addEventListener('scroll', e => { if(!st || e.target.closest?.('.tc-pop'))return; if(e.target===document && scrollX===st.scrollX && scrollY===st.scrollY)return; close(true); }, {...options,capture:true});
  }

  function refresh() {
    if(st && !st.el.isConnected)close(true);
    document.querySelectorAll(O.selector).forEach(el => {
      el.classList.add('tc-card'); if(!O.inlineDetails)el.setAttribute('aria-haspopup','dialog'); el.setAttribute('aria-expanded',String(st?.el===el));
      badges(el);
    });
  }
  function init(o) {
    if (!o || typeof o.getCard !== 'function') throw new Error('CardTouch.init: getCard(el) é obrigatório');
    destroy();
    O = Object.assign({}, DEF, o, { labels: Object.assign({}, DEF.labels, o.labels) });
    refresh(); listen();
  }

  function destroy() { close(true); controller?.abort(); controller=null; down=null; }
  window.CardTouch = { init, refresh, destroy, close: () => close(true) };
})();
