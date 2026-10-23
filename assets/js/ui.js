/* Interface : en-tête, menu, tiroirs, copie, mode calme, curseur, boutons magnétiques, inclinaison 3D, transitions. */
const store = {
  get(k, s = 'local') { try { return (s === 'local' ? localStorage : sessionStorage).getItem(k); } catch (e) { return null; } },
  set(k, v, s = 'local') { try { (s === 'local' ? localStorage : sessionStorage).setItem(k, v); } catch (e) { /* stockage indisponible */ } },
};
export { store };

export function initHeader(lenis) {
  const h = document.querySelector('[data-header]');
  if (!h) return;
  const onScroll = (y) => { h.classList.toggle('is-solid', y > 30); };
  if (lenis) lenis.on('scroll', ({ scroll }) => onScroll(scroll));
  else window.addEventListener('scroll', () => onScroll(window.scrollY), { passive: true });
  onScroll(window.scrollY);
}

function trapFocus(container, e) {
  const f = [...container.querySelectorAll('a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])')].filter((x) => x.offsetParent);
  if (!f.length) return;
  const first = f[0], last = f[f.length - 1];
  if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
  else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
}

export function initOverlays({ gsap, lenis, calm }) {
  let opener = null;
  const openLayer = (el, focusSel) => {
    opener = document.activeElement;
    el.setAttribute('data-lenis-prevent', ''); // Lenis arrêté bloque la molette et le doigt partout ailleurs
    el.hidden = false; document.documentElement.style.overflow = 'hidden'; lenis?.stop();
    if (gsap && !calm) {
      if (el.classList.contains('drawer')) { gsap.fromTo(el.querySelector('.drawer__panel'), { xPercent: 100 }, { xPercent: 0, duration: 0.7, ease: 'expo.out' }); gsap.fromTo(el.querySelector('.drawer__scrim'), { opacity: 0 }, { opacity: 1, duration: 0.4 }); }
      else { gsap.fromTo(el, { clipPath: 'circle(0% at 100% 0%)' }, { clipPath: 'circle(150% at 100% 0%)', duration: 0.9, ease: 'expo.inOut' }); gsap.from(el.querySelectorAll('.menu__list li'), { yPercent: 60, opacity: 0, duration: 0.8, ease: 'expo.out', stagger: 0.06, delay: 0.25 }); }
    }
    (el.querySelector(focusSel) || el.querySelector('button, a, input'))?.focus();
  };
  const closeLayer = (el) => {
    const done = () => { el.hidden = true; document.documentElement.style.overflow = ''; lenis?.start(); opener?.focus?.(); };
    if (gsap && !calm && el.classList.contains('drawer')) { gsap.to(el.querySelector('.drawer__panel'), { xPercent: 100, duration: 0.45, ease: 'power3.in', onComplete: done }); gsap.to(el.querySelector('.drawer__scrim'), { opacity: 0, duration: 0.4 }); }
    else done();
  };
  const menu = document.getElementById('menu');
  const menuBtn = document.querySelector('[data-menu-open]');
  const closeMenu = (focusBack = true) => {
    if (!menu || menu.hidden) return;
    menuBtn?.setAttribute('aria-expanded', 'false');
    menu.hidden = true; document.documentElement.style.overflow = ''; lenis?.start();
    if (focusBack) menuBtn?.focus();
  };
  menuBtn?.addEventListener('click', () => { menuBtn.setAttribute('aria-expanded', 'true'); openLayer(menu, '.menu__close'); });
  menu?.querySelectorAll('[data-menu-close]').forEach((b) => b.addEventListener('click', () => closeMenu(true)));
  menu?.querySelectorAll('.menu__list a').forEach((b) => b.addEventListener('click', () => closeMenu(false)));
  document.querySelectorAll('[data-drawer-open]').forEach((b) => b.addEventListener('click', () => {
    const d = document.querySelector(`[data-drawer="${b.dataset.drawerOpen}"]`);
    const fromMenu = menu && !menu.hidden && menu.contains(b);
    if (fromMenu) closeMenu(false);
    if (d) { openLayer(d, 'input, textarea'); if (fromMenu) opener = menuBtn; }
  }));
  document.querySelectorAll('[data-drawer]').forEach((d) => d.querySelectorAll('[data-drawer-close]').forEach((b) => b.addEventListener('click', () => closeLayer(d))));
  document.addEventListener('keydown', (e) => {
    const open = [...document.querySelectorAll('[data-drawer]'), menu].find((x) => x && !x.hidden);
    if (!open) return;
    if (e.key === 'Escape') { if (open === menu) closeMenu(true); else closeLayer(open); }
    if (e.key === 'Tab') trapFocus(open, e);
  });
}

export function initCopy() {
  document.querySelectorAll('[data-copy]').forEach((b) => b.addEventListener('click', () => {
    const txt = b.dataset.copy, label = b.textContent;
    const live = document.querySelector('[data-live]');
    const say = (t) => { if (live) { live.textContent = ''; setTimeout(() => { live.textContent = t; }, 30); } };
    const ok = () => { b.textContent = 'Copié'; say('Adresse copiée'); setTimeout(() => { b.textContent = label; }, 1600); };
    const fallback = () => { const t = b.parentElement.querySelector('.copy__text'); if (t) { const r = document.createRange(); r.selectNodeContents(t); const s = getSelection(); s.removeAllRanges(); s.addRange(r); } b.textContent = 'Sélectionné'; setTimeout(() => { b.textContent = label; }, 1600); };
    try { navigator.clipboard.writeText(txt).then(ok, fallback); } catch (e) { fallback(); }
  }));
}

export function initCalmToggle(calm) {
  document.querySelectorAll('[data-calm]').forEach((b) => {
    b.setAttribute('aria-pressed', calm ? 'true' : 'false');
    b.addEventListener('click', () => {
      store.set('ocse-calm', calm ? '0' : '1');
      // revenir à la même section après le rechargement
      const y = window.innerHeight * 0.35;
      const sec = [...document.querySelectorAll('main section[id], main > section')].find((el) => { const r = el.getBoundingClientRect(); return r.top <= y && r.bottom > y; });
      if (sec && sec.id) store.set('ocse-back', sec.id, 'session');
      const u = new URL(location.href); u.searchParams.delete('calme');
      location.replace(u.pathname + u.search);
    });
  });
}

export function initCursor() {
  const dot = document.createElement('div'); dot.className = 'cursor'; dot.setAttribute('aria-hidden', 'true');
  const ring = document.createElement('div'); ring.className = 'cursor-ring'; ring.setAttribute('aria-hidden', 'true');
  ring.innerHTML = '<span class="cursor-ring__label"></span>';
  document.body.append(dot, ring);
  document.documentElement.classList.add('has-cursor');
  const label = ring.firstChild;
  let x = innerWidth / 2, y = innerHeight / 2, rx = x, ry = y, shown = false;
  window.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse') return;
    x = e.clientX; y = e.clientY;
    if (!shown) { shown = true; rx = x; ry = y; dot.style.opacity = ring.style.opacity = '1'; }
    const t = e.target.closest?.('a, button, label, [data-cursor], input, select, textarea');
    const lab = t?.closest('[data-cursor]')?.dataset.cursor;
    ring.classList.toggle('is-label', !!lab); label.textContent = lab || '';
    ring.classList.toggle('is-link', !!t && !lab);
    ring.classList.toggle('on-night', !!e.target.closest?.('.night'));
  }, { passive: true });
  document.addEventListener('pointerleave', () => { dot.style.opacity = ring.style.opacity = '0'; shown = false; });
  dot.style.opacity = ring.style.opacity = '0';
  const tick = () => {
    rx += (x - rx) * 0.16; ry += (y - ry) * 0.16;
    dot.style.transform = `translate3d(${x}px,${y}px,0)`;
    ring.style.transform = `translate3d(${rx}px,${ry}px,0)`;
    requestAnimationFrame(tick);
  };
  tick();
}

export function initMagnetic(gsap) {
  document.querySelectorAll('[data-magnetic]').forEach((el) => {
    const inner = el.querySelector('.btn__label');
    const xTo = gsap.quickTo(el, 'x', { duration: 0.6, ease: 'power3.out' }), yTo = gsap.quickTo(el, 'y', { duration: 0.6, ease: 'power3.out' });
    const ix = inner ? gsap.quickTo(inner, 'x', { duration: 0.6, ease: 'power3.out' }) : null, iy = inner ? gsap.quickTo(inner, 'y', { duration: 0.6, ease: 'power3.out' }) : null;
    el.addEventListener('pointermove', (e) => {
      if (e.pointerType !== 'mouse') return;
      const r = el.getBoundingClientRect(), dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
      xTo(dx * 0.32); yTo(dy * 0.42); if (ix) { ix(dx * 0.12); iy(dy * 0.16); }
    });
    el.addEventListener('pointerleave', () => {
      gsap.to(el, { x: 0, y: 0, duration: 1, ease: 'elastic.out(1, 0.35)' });
      if (inner) gsap.to(inner, { x: 0, y: 0, duration: 1, ease: 'elastic.out(1, 0.35)' });
    });
  });
}

export function initTilt(gsap) {
  document.querySelectorAll('[data-tilt]').forEach((el) => {
    gsap.set(el, { transformPerspective: 900 });
    const rx = gsap.quickTo(el, 'rotationX', { duration: 0.6, ease: 'power3.out' }), ry = gsap.quickTo(el, 'rotationY', { duration: 0.6, ease: 'power3.out' });
    el.addEventListener('pointermove', (e) => {
      if (e.pointerType !== 'mouse') return;
      const r = el.getBoundingClientRect(), px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
      ry((px - 0.5) * 12); rx((0.5 - py) * 10);
      el.style.setProperty('--gx', `${px * 100}%`); el.style.setProperty('--gy', `${py * 100}%`);
    });
    el.addEventListener('pointerleave', () => { rx(0); ry(0); });
  });
}

/* transitions de page : feuille de papier + un battement */
const BEAT = (w) => { const c = w / 2; return `M0 40H${c - 70}l10-22 12 44 10-32 8 10H${w}`; };
export function initTransitions({ gsap, calm }) {
  const html = document.documentElement;
  const pt = document.createElement('div'); pt.className = 'pt'; pt.setAttribute('aria-hidden', 'true');
  pt.innerHTML = `<svg viewBox="0 0 520 80"><path d="${BEAT(520)}"/></svg>`;
  document.body.appendChild(pt);
  const path = pt.querySelector('path');
  if (gsap) gsap.set(pt, { yPercent: 100 });
  if (html.classList.contains('pt-enter')) {
    store.set('ocse-pt', '0', 'session');
    if (gsap && !calm) {
      gsap.set(pt, { yPercent: 0 }); pt.classList.add('is-on'); html.classList.remove('pt-enter');
      gsap.to(pt, { yPercent: -100, duration: 0.85, ease: 'expo.inOut', delay: 0.05, onComplete: () => { pt.classList.remove('is-on'); gsap.set(pt, { yPercent: 100 }); } });
    } else html.classList.remove('pt-enter');
  }
  if (calm || !gsap) return;
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href]');
    if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || a.target === '_blank' || a.hasAttribute('download')) return;
    const url = new URL(a.href, location.href);
    if (url.origin !== location.origin) return;
    const samePage = url.pathname.replace(/(index)?(\.html)?$/, '') === location.pathname.replace(/(index)?(\.html)?$/, '');
    if (samePage) {
      const id = url.hash ? decodeURIComponent(url.hash.slice(1)) : '';
      const el = id && document.getElementById(id);
      if (!el) return;
      e.preventDefault();
      const host = el.parentElement && el.parentElement.classList.contains('pin-spacer') ? el.parentElement : el;
      if (window.__lenis) window.__lenis.scrollTo(host, { duration: 1.4 }); else host.scrollIntoView({ behavior: 'smooth' });
      // le focus suit la cible (lien d'évitement, « Je participe »…)
      if (!el.hasAttribute('tabindex')) el.setAttribute('tabindex', '-1');
      el.focus({ preventScroll: true });
      history.replaceState(null, '', url.hash);
      return;
    }
    e.preventDefault();
    store.set('ocse-pt', '1', 'session');
    pt.classList.add('is-on');
    gsap.set(path, { drawSVG: '0%' });
    gsap.timeline({ onComplete: () => { location.href = url.href; } })
      .fromTo(pt, { yPercent: 100 }, { yPercent: 0, duration: 0.6, ease: 'expo.inOut' })
      .to(path, { drawSVG: '100%', duration: 0.45, ease: 'power2.inOut' }, '-=0.2');
  });
  window.addEventListener('pageshow', (e) => { if (e.persisted) { pt.classList.remove('is-on'); gsap.set(pt, { yPercent: 100 }); } });
}

/* bouton « Je participe » flottant sur téléphone, masqué quand un autre appel à participer est visible */
export function initFab() {
  const fab = document.querySelector('[data-fab]');
  if (!fab || !('IntersectionObserver' in window)) return;
  const watch = [...document.querySelectorAll('[data-cta-watch], #inscription, .footer, .final')];
  const vis = new Set();
  const update = () => {
    const menuOpen = !document.getElementById('menu')?.hidden;
    const show = vis.size === 0 && !menuOpen;
    fab.classList.toggle('is-on', show);
    fab.setAttribute('aria-hidden', show ? 'false' : 'true');
    fab.tabIndex = show ? 0 : -1;
  };
  const io = new IntersectionObserver((entries) => { entries.forEach((e) => (e.isIntersecting ? vis.add(e.target) : vis.delete(e.target))); update(); }, { rootMargin: '0px 0px -8% 0px' });
  watch.forEach((w) => io.observe(w));
  update();
}
