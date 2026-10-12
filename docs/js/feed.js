// tomoπgraphy — 写真を一列に流し、押すと拡大する。拡大中は右半分で次へ、左半分で前へ。
(() => {
  'use strict';

  const BATCH = 10;               // 一度に足す段の数
  const WIDE = 1.2;               // これ以上横長なら一段まるごと使う
  const COL = 1180;               // site.css の --col と同じ値

  const $ = id => document.getElementById(id);
  const feed = $('feed'), sentinel = $('sentinel');
  const lb = $('lb'), frame = $('lbFrame'), lo = $('lbLo'), hi = $('lbHi');
  const closeBtn = $('lbClose'), counter = $('lbCount'), mark = $('mark');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const EASE = 'cubic-bezier(.2,.7,.1,1)';

  let photos = [];      // 新しい順
  let rows = [];        // [{kind, items:[index...], side}]
  let rendered = 0;     // 描いた段の数
  const rowOf = [];     // 写真の番号 → 段の番号
  const elOf = [];      // 写真の番号 → 列の中の要素

  // ── 画像の選び方 ─────────────────────────────
  const ratio = p => (p.dimensions && p.dimensions.height) ? p.dimensions.width / p.dimensions.height : 1.5;

  function srcset(p) {
    const r = p.responsive || {};
    const parts = Object.keys(r).map(Number).sort((a, b) => a - b).map(w => `${r[w]} ${w}w`);
    if (!parts.length) return '';
    if (p.dimensions && p.dimensions.width) parts.push(`${p.original} ${p.dimensions.width}w`);
    return parts.join(', ');
  }
  const smallSrc = p => (p.responsive && p.responsive['640']) || p.thumbnail || p.original;

  // ── 段組み ───────────────────────────────────
  // 一段に一枚。横長は列の幅いっぱい、縦長と正方形は真ん中に置く(並べると小さくなるので並べない)。
  function layout() {
    for (let i = 0; i < photos.length;) {
      const r = ratio(photos[i]);
      if (r >= WIDE) { rows.push({ kind: 'full', items: [i] }); i += 1; continue; }
      rows.push({ kind: 'single', items: [i], side: 'c' });
      i += 1;
    }
    rows.forEach((row, n) => row.items.forEach(i => { rowOf[i] = n; }));
  }

  function sizesFor(row, i) {
    if (row.kind === 'full') return `(min-width: 1290px) ${COL}px, (max-width: 640px) calc(100vw - 12px), 92vw`;
    if (row.kind === 'single') return `(min-width: 1290px) ${Math.round(COL * .58)}px, (max-width: 640px) calc(100vw - 12px), 54vw`;
    const [a, b] = row.items, f = ratio(photos[i]) / (ratio(photos[a]) + ratio(photos[b]));
    return `(min-width: 1290px) ${Math.round(COL * f)}px, (max-width: 640px) ${Math.round(100 * f)}vw, ${Math.round(92 * f)}vw`;
  }

  function makeItem(row, i, eager) {
    const p = photos[i];
    const a = document.createElement('a');
    a.className = 'ph';
    a.href = '#' + encodeURIComponent(p.id);
    a.dataset.i = i;
    a.style.setProperty('--r', ratio(p).toFixed(4));
    if (p.color) a.style.setProperty('--c', p.color);
    a.setAttribute('aria-label', p.title && !/^(IMG|DSC|tumblr|\d{4}-)/.test(p.title) ? p.title : '写真を拡大する');

    const img = document.createElement('img');
    img.alt = '';
    img.decoding = 'async';
    if (eager) img.fetchPriority = 'high'; else img.loading = 'lazy';
    img.onload = () => img.classList.add('is-in');
    img.onerror = () => { if (img.src !== p.original) { img.removeAttribute('srcset'); img.src = p.original; } };
    const set = srcset(p);
    if (set) { img.sizes = sizesFor(row, i); img.srcset = set; }
    img.src = set ? smallSrc(p) : p.original;
    a.appendChild(img);
    elOf[i] = a;
    return a;
  }

  function renderRows(upto) {
    const frag = document.createDocumentFragment();
    for (; rendered < Math.min(upto, rows.length); rendered++) {
      const row = rows[rendered];
      const div = document.createElement('div');
      div.className = `row ${row.kind}${row.side ? ' ' + row.side : ''}`;
      if (row.kind === 'single') {
        // 縦長でも正方形でも、横長の段と高さが揃って見える幅にする
        const r = ratio(photos[row.items[0]]);
        div.style.setProperty('--single', `${Math.min(72, Math.max(44, r * 66)).toFixed(1)}%`);
      }
      row.items.forEach(i => div.appendChild(makeItem(row, i, rendered < 2)));
      frag.appendChild(div);
    }
    feed.appendChild(frag);
    if (rendered >= rows.length) sentinel.remove();
  }

  // ── 拡大表示 ─────────────────────────────────
  let cur = -1, open = false, pushed = false, busy = false, token = 0;

  function fit(p) {
    const W = innerWidth, H = innerHeight, small = W < 640;
    const padX = small ? 0 : Math.min(56, W * .04);
    const padTop = small ? 60 : Math.min(56, H * .06);
    const padBottom = small ? 60 : Math.min(64, H * .08);
    const r = ratio(p);
    let w = W - padX * 2, h = w / r;
    if (h > H - padTop - padBottom) { h = H - padTop - padBottom; w = h * r; }
    return { x: (W - w) / 2, y: padTop + (H - padTop - padBottom - h) / 2, w, h };
  }

  function place(box) {
    frame.style.left = box.x + 'px';
    frame.style.top = box.y + 'px';
    frame.style.width = box.w + 'px';
    frame.style.height = box.h + 'px';
  }

  function delta(from, to) {
    const s = from.width / to.w;
    return `translate(${from.left - to.x}px, ${from.top - to.y}px) scale(${s})`;
  }

  function loadInto(i) {
    const p = photos[i], my = ++token;
    const feedImg = elOf[i] && elOf[i].querySelector('img');
    lo.src = feedImg && feedImg.complete && feedImg.naturalWidth ? feedImg.currentSrc : smallSrc(p);
    lo.style.background = p.color || '';

    hi.style.transition = 'none';
    hi.classList.remove('is-in');
    void hi.offsetWidth;
    hi.style.transition = '';
    hi.removeAttribute('srcset');
    hi.removeAttribute('src');
    const set = srcset(p);
    hi.onload = () => { if (my === token) hi.classList.add('is-in'); };
    if (set) { hi.sizes = Math.ceil(fit(p).w) + 'px'; hi.srcset = set; }
    hi.src = set ? (p.responsive['1920'] || p.original) : p.original;

    counter.textContent = `${i + 1} / ${photos.length}`;
    // 前後を先に読んでおく
    [i - 1, i + 1].forEach(j => { if (photos[j]) { const im = new Image(); const s = srcset(photos[j]); if (s) { im.sizes = Math.ceil(fit(photos[j]).w) + 'px'; im.srcset = s; } im.src = smallSrc(photos[j]); } });
  }

  function setHash(i, push) {
    const url = '#' + encodeURIComponent(photos[i].id);
    if (push) { history.pushState({ lb: true }, '', url); pushed = true; }
    else history.replaceState(history.state, '', url);
  }

  function openAt(i, { animate = true, push = true } = {}) {
    if (open || busy || !photos[i]) return;
    open = true; cur = i;
    const box = fit(photos[i]);
    place(box);
    loadInto(i);
    lb.hidden = false;
    document.documentElement.classList.add('is-locked');
    if (push) setHash(i, true);

    const src = elOf[i];
    const rect = src && src.getBoundingClientRect();
    const visible = rect && rect.bottom > 0 && rect.top < innerHeight;
    requestAnimationFrame(() => {
      lb.classList.add('is-open');
      if (animate && visible && !reduced) {
        src.classList.add('is-source');
        busy = true;
        frame.animate([{ transform: delta(rect, box) }, { transform: 'none' }], { duration: 560, easing: EASE })
          .finished.then(() => { busy = false; src.classList.remove('is-source'); });
      } else {
        frame.animate([{ opacity: 0 }, { opacity: 1 }], { duration: reduced ? 1 : 260, easing: 'linear' });
      }
    });
    closeBtn.focus({ preventScroll: true, focusVisible: byKey });
  }

  function go(step) {
    const j = cur + step;
    if (!open || busy || !photos[j]) return;
    cur = j;
    const box = fit(photos[j]);
    place(box);
    loadInto(j);
    setHash(j, false);
    frame.animate(
      [{ opacity: 0, transform: `translateX(${step * 18}px)` }, { opacity: 1, transform: 'none' }],
      { duration: reduced ? 1 : 340, easing: EASE });
    updateCursor(lastX);
  }

  // 閉じる。UI から閉じたときは、開くときに積んだ履歴を戻すだけにして popstate 側で畳む
  function requestClose() {
    if (!open || busy) return;
    if (pushed) history.back(); else { history.replaceState(null, '', location.pathname + location.search); finishClose(); }
  }

  function finishClose() {
    if (!open) return;
    pushed = false;
    // 見ていた写真まで列を描き、画面に入っていなければそこまで送る
    renderRows(rowOf[cur] + 1);
    const el = elOf[cur];
    let rect = el.getBoundingClientRect();
    if (rect.bottom < 0 || rect.top > innerHeight) {
      scrollTo({ top: scrollY + rect.top - (innerHeight - rect.height) / 2, behavior: 'instant' });
      rect = el.getBoundingClientRect();
    }
    const box = fit(photos[cur]);
    lb.classList.remove('is-open');
    busy = true;
    const done = () => {
      busy = false; open = false;
      lb.hidden = true;
      el.classList.remove('is-source');
      document.documentElement.classList.remove('is-locked');
      el.focus({ preventScroll: true, focusVisible: byKey });
    };
    if (reduced) { done(); return; }
    el.classList.add('is-source');
    frame.animate([{ transform: 'none' }, { transform: delta(rect, box) }], { duration: 480, easing: EASE, fill: 'forwards' })
      .finished.then(a => { done(); frame.getAnimations().forEach(x => x.cancel()); });
  }

  function idFromHash() {
    const h = decodeURIComponent(location.hash.slice(1));
    return h ? photos.findIndex(p => p.id === h) : -1;
  }

  addEventListener('popstate', () => {
    const i = idFromHash();
    if (open && i < 0) finishClose();
    else if (!open && i >= 0) openAt(i, { push: false, animate: false });
  });

  // ── 拡大表示の操作: 右半分で次、左半分で前、横に払っても送れる。下に払うと閉じる
  let lastX = innerWidth;
  function updateCursor(x) {
    lastX = x;
    const left = x < innerWidth / 2;
    lb.classList.toggle('at-prev', left && cur > 0);
    lb.classList.toggle('at-next', !left && cur < photos.length - 1);
  }

  let down = null;
  lb.addEventListener('pointermove', e => {
    updateCursor(e.clientX);
    if (!down || e.pointerType === 'mouse') return;
    const dx = e.clientX - down.x, dy = e.clientY - down.y;
    if (!busy) frame.style.transform = Math.abs(dx) > Math.abs(dy)
      ? `translateX(${dx * .6}px)` : (dy > 0 ? `translateY(${dy * .6}px)` : '');
    if (dy > 0 && Math.abs(dy) > Math.abs(dx)) lb.style.background = `rgba(10,10,10,${Math.max(.3, 1 - dy / 400)})`;
  });
  lb.addEventListener('pointerdown', e => {
    if (e.target.closest('.lb-close') || e.button !== 0) return;
    down = { x: e.clientX, y: e.clientY, t: performance.now() };
  });
  const release = e => {
    if (!down) return;
    const dx = e.clientX - down.x, dy = e.clientY - down.y;
    down = null;
    frame.style.transform = '';
    lb.style.background = '';
    if (Math.abs(dx) < 10 && Math.abs(dy) < 10) { go(e.clientX < innerWidth / 2 ? -1 : 1); return; }
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) { go(dx < 0 ? 1 : -1); return; }
    if (dy > 90 && dy > Math.abs(dx)) requestClose();
  };
  lb.addEventListener('pointerup', release);
  lb.addEventListener('pointercancel', () => { down = null; frame.style.transform = ''; lb.style.background = ''; });
  lb.addEventListener('contextmenu', e => e.preventDefault());

  // フォーカスの輪はキーボードで操作しているときだけ見せる
  let byKey = false;
  addEventListener('keydown', () => { byKey = true; }, true);
  addEventListener('pointerdown', () => { byKey = false; }, true);

  closeBtn.addEventListener('click', e => { e.stopPropagation(); requestClose(); });

  addEventListener('keydown', e => {
    if (!open) return;
    if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); go(1); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); go(-1); }
    else if (e.key === 'Escape') { e.preventDefault(); requestClose(); }
    else if (e.key === 'Tab') { e.preventDefault(); closeBtn.focus(); }
  });

  addEventListener('resize', () => { if (open && !busy) place(fit(photos[cur])); });

  feed.addEventListener('click', e => {
    const a = e.target.closest('.ph');
    if (!a || e.metaKey || e.ctrlKey || e.shiftKey) return;
    e.preventDefault();
    openAt(+a.dataset.i);
  });

  // ── 題字が流れたら小さな印を出す
  new IntersectionObserver(([en]) => mark.classList.toggle('is-on', !en.isIntersecting))
    .observe(document.querySelector('.wordmark'));
  mark.addEventListener('click', e => { e.preventDefault(); scrollTo({ top: 0, behavior: reduced ? 'instant' : 'smooth' }); });

  // ── 起動
  fetch('data/artworks.json')
    .then(r => r.json())
    .then(data => {
      photos = (data.artworks || [])
        .map((p, k) => ({ p, k }))
        .filter(({ p }) => p && p.id && p.original)
        .sort((a, b) => (b.p.date || '').localeCompare(a.p.date || '') || a.k - b.k)
        .map(({ p }) => p);
      $('count').textContent = `${photos.length} photographs`;
      layout();
      renderRows(BATCH);
      // 足した直後も目印がまだ近くにあれば、交差の変化は起きないので自分で続けて足す
      const fill = () => {
        if (sentinel.isConnected && sentinel.getBoundingClientRect().top < innerHeight + 2400) {
          renderRows(rendered + BATCH);
          requestAnimationFrame(fill);
        }
      };
      new IntersectionObserver(([en]) => { if (en.isIntersecting) fill(); }, { rootMargin: '2400px 0px' }).observe(sentinel);
      const i = idFromHash();
      if (i >= 0) openAt(i, { push: false, animate: false });
    });
})();
