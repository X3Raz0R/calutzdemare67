(() => {
  'use strict';
  const root = document.documentElement;
  const still = window.matchMedia('(prefers-reduced-motion: reduce)');
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];

  // ---------- theme toggle ----------
  const themeBtn = $('.theme');
  const currentTheme = () => root.dataset.theme || (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
  themeBtn?.addEventListener('click', () => {
    const next = currentTheme() === 'dark' ? 'light' : 'dark';
    root.dataset.theme = next;
    try { localStorage.setItem('theme', next); } catch { /* storage can be blocked */ }
  });

  // ---------- hero name: one span per letter ----------
  for (const h of $$('[data-split]')) {
    let i = 0;
    for (const line of $$('.line', h)) {
      const text = line.textContent;
      line.textContent = '';
      line.setAttribute('aria-hidden', 'true');
      for (const ch of text) {
        const s = document.createElement('span');
        s.className = 'ch';
        s.style.setProperty('--i', i++);
        s.textContent = ch;
        line.append(s);
      }
    }
  }

  // ---------- scroll: progress bar, sticky nav, timeline fill ----------
  const nav = $('.nav');
  const bar = $('.progress');
  const timeline = $('#timeline');
  let ticking = false;
  function onScroll() {
    ticking = false;
    const max = document.documentElement.scrollHeight - innerHeight;
    bar.style.setProperty('--p', max > 0 ? Math.min(1, scrollY / max) : 0);
    nav.classList.toggle('stuck', scrollY > 12);
    if (timeline) {
      const r = timeline.getBoundingClientRect();
      const t = (innerHeight * 0.7 - r.top) / r.height;
      timeline.style.setProperty('--t', Math.max(0, Math.min(1, t)));
    }
  }
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  addEventListener('resize', onScroll);
  onScroll();

  // ---------- reveal on scroll ----------
  const revealIO = new IntersectionObserver((entries) => {
    for (const e of entries) if (e.isIntersecting) { e.target.classList.add('in'); revealIO.unobserve(e.target); }
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
  $$('[data-reveal]').forEach((el) => revealIO.observe(el));

  // ---------- active section in the nav ----------
  const links = new Map($$('.nav li a').map((a) => [a.getAttribute('href').slice(1), a]));
  const spy = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      links.forEach((a) => a.classList.remove('on'));
      links.get(e.target.id)?.classList.add('on');
    }
  }, { rootMargin: '-45% 0px -50% 0px' });
  links.forEach((_, id) => { const s = document.getElementById(id); if (s) spy.observe(s); });

  // ---------- count up ----------
  const fmt = new Intl.NumberFormat('en-US');
  const countIO = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      countIO.unobserve(e.target);
      const el = e.target;
      const to = Number(el.dataset.count);
      if (still.matches || to < 3) { el.textContent = fmt.format(to); continue; }
      const t0 = performance.now();
      const dur = 1400;
      const step = (now) => {
        const k = Math.min(1, (now - t0) / dur);
        el.textContent = fmt.format(Math.round(to * (1 - Math.pow(1 - k, 3))));
        if (k < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    }
  }, { threshold: 0.6 });
  $$('[data-count]').forEach((el) => countIO.observe(el));

  // ---------- tilt and card spotlight (mouse only) ----------
  const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (fine) {
    for (const el of $$('[data-tilt]')) {
      const target = el.classList.contains('shot') ? $('.photo', el) : el;
      el.addEventListener('pointermove', (ev) => {
        if (still.matches) return;
        const r = el.getBoundingClientRect();
        const x = (ev.clientX - r.left) / r.width - 0.5;
        const y = (ev.clientY - r.top) / r.height - 0.5;
        target.style.setProperty('--ry', `${(x * 7).toFixed(2)}deg`);
        target.style.setProperty('--rx', `${(-y * 6).toFixed(2)}deg`);
      });
      el.addEventListener('pointerleave', () => { target.style.setProperty('--ry', '0deg'); target.style.setProperty('--rx', '0deg'); });
    }
    for (const el of $$('[data-spot]')) {
      el.addEventListener('pointermove', (ev) => {
        const r = el.getBoundingClientRect();
        el.style.setProperty('--mx', `${ev.clientX - r.left}px`);
        el.style.setProperty('--my', `${ev.clientY - r.top}px`);
      });
    }
  }

  // ---------- Pandora screens: tabs with auto-advance ----------
  const screens = $('#screens');
  if (screens) {
    const imgs = $$('img', screens);
    const tablist = $('.tabs');
    const tabs = $$('[role="tab"]', tablist);
    const caption = $('#screen-caption');
    let index = 0;
    let timer = 0;
    let visible = false;
    const show = (i) => {
      index = (i + imgs.length) % imgs.length;
      imgs.forEach((im, k) => im.classList.toggle('on', k === index));
      tabs.forEach((t, k) => { t.setAttribute('aria-selected', String(k === index)); t.tabIndex = k === index ? 0 : -1; });
      caption.textContent = imgs[index].dataset.caption || '';
    };
    const stop = () => { clearInterval(timer); timer = 0; };
    const start = () => { stop(); if (!still.matches && visible && tablist.classList.contains('auto')) timer = setInterval(() => show(index + 1), 5000); };
    const manual = (i) => { tablist.classList.remove('auto'); stop(); show(i); };
    tabs.forEach((t, k) => t.addEventListener('click', () => manual(k)));
    tablist.addEventListener('keydown', (ev) => {
      if (ev.key !== 'ArrowRight' && ev.key !== 'ArrowLeft') return;
      ev.preventDefault();
      manual(index + (ev.key === 'ArrowRight' ? 1 : -1));
      tabs[index].focus();
    });
    new IntersectionObserver(([e]) => { visible = e.isIntersecting; visible ? start() : stop(); }, { threshold: 0.4 }).observe(screens);
    $('[data-zoom]', screens).addEventListener('click', () => {
      const set = imgs.map((im) => ({ src: im.getAttribute('src'), caption: im.dataset.caption || '', alt: im.alt }));
      openLightbox(set, index);
    });
    show(0);
  }

  // ---------- lightbox ----------
  const dlg = $('#lightbox');
  const lbImg = $('#lb-img');
  const lbCap = $('#lb-caption');
  const lbCount = $('#lb-count');
  let lbSet = [];
  let lbIndex = 0;
  function lbShow(i) {
    lbIndex = (i + lbSet.length) % lbSet.length;
    const it = lbSet[lbIndex];
    lbImg.style.animation = 'none';
    void lbImg.offsetWidth;
    lbImg.style.animation = '';
    lbImg.src = it.src;
    lbImg.alt = it.alt || '';
    lbCap.textContent = it.caption || '';
    lbCount.textContent = `${lbIndex + 1} / ${lbSet.length}`;
    const many = lbSet.length > 1;
    $('#lb-prev').hidden = !many;
    $('#lb-next').hidden = !many;
  }
  function openLightbox(set, i) {
    lbSet = set;
    lbShow(i);
    if (typeof dlg.showModal === 'function') dlg.showModal();
    else window.open(set[i].src, '_blank');
  }
  const galleryButtons = $$('[data-lightbox]');
  galleryButtons.forEach((b) => b.addEventListener('click', () => {
    const scope = b.closest('.gallery') ? $$('[data-lightbox]', b.closest('.gallery')) : [b];
    const set = scope.map((x) => ({ src: x.dataset.lightbox, caption: x.dataset.caption || '', alt: x.parentElement.querySelector('img')?.alt || '' }));
    openLightbox(set, scope.indexOf(b));
  }));
  $('#lb-close').addEventListener('click', () => dlg.close());
  $('#lb-prev').addEventListener('click', () => lbShow(lbIndex - 1));
  $('#lb-next').addEventListener('click', () => lbShow(lbIndex + 1));
  dlg.addEventListener('click', (ev) => { if (ev.target === dlg || ev.target.classList.contains('lb-stage')) dlg.close(); });
  dlg.addEventListener('keydown', (ev) => {
    if (ev.key === 'ArrowRight') lbShow(lbIndex + 1);
    if (ev.key === 'ArrowLeft') lbShow(lbIndex - 1);
  });

  // ---------- hero dot grid ----------
  const canvas = $('#grid');
  if (canvas) {
    const ctx = canvas.getContext('2d');
    const GAP = 36;
    let w = 0, h = 0, dpr = 1, dots = [], raf = 0, onScreen = true;
    const mouse = { x: -9999, y: -9999 };
    const lamp = [242, 181, 74];
    let base = [58, 73, 85];
    const readBase = () => { base = currentTheme() === 'light' ? [150, 163, 173] : [58, 73, 85]; };
    function resize() {
      const r = canvas.getBoundingClientRect();
      dpr = Math.min(2, devicePixelRatio || 1);
      w = r.width; h = r.height;
      canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      dots = [];
      const cols = Math.ceil(w / GAP) + 1, rows = Math.ceil(h / GAP) + 1;
      const ox = (w - (cols - 1) * GAP) / 2, oy = (h - (rows - 1) * GAP) / 2;
      for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) dots.push({ x: ox + x * GAP, y: oy + y * GAP, e: 0, ph: Math.random() * 6.28 });
      readBase();
      draw(performance.now());
    }
    function draw(now) {
      ctx.clearRect(0, 0, w, h);
      const t = now / 1000;
      for (const d of dots) {
        const dx = d.x - mouse.x, dy = d.y - mouse.y;
        const near = Math.max(0, 1 - Math.hypot(dx, dy) / 190);
        const wave = still.matches ? 0 : Math.max(0, Math.sin(t * 0.7 + d.ph + d.x * 0.004) - 0.965) * 22;
        const target = Math.min(1, near * near + wave);
        d.e += (target - d.e) * 0.12;
        const e = d.e;
        const r = 1.5 + e * 2.6;
        ctx.fillStyle = `rgba(${Math.round(base[0] + (lamp[0] - base[0]) * e)},${Math.round(base[1] + (lamp[1] - base[1]) * e)},${Math.round(base[2] + (lamp[2] - base[2]) * e)},${0.5 + e * 0.5})`;
        ctx.beginPath();
        ctx.arc(d.x, d.y, r, 0, 6.2832);
        ctx.fill();
      }
    }
    function loop(now) {
      draw(now);
      raf = onScreen && !still.matches ? requestAnimationFrame(loop) : 0;
    }
    const kick = () => { if (!raf && onScreen && !still.matches) raf = requestAnimationFrame(loop); };
    addEventListener('pointermove', (ev) => {
      const r = canvas.getBoundingClientRect();
      mouse.x = ev.clientX - r.left; mouse.y = ev.clientY - r.top;
    }, { passive: true });
    new IntersectionObserver(([e]) => { onScreen = e.isIntersecting; kick(); }).observe(canvas);
    new ResizeObserver(resize).observe(canvas);
    themeBtn?.addEventListener('click', () => { readBase(); draw(performance.now()); });
    still.addEventListener?.('change', kick);
    resize();
    kick();
  }
})();
