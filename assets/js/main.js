/* Observatoire des CSE · maquette « Le Pouls » — chef d'orchestre. */
import { DATES, RESTITUTION, OUVERTURE, MISE_EN_PLACE, PERCEPTION, REUNIONS, SECTEURS } from './data.js?v=20261028';
import { fillMedia } from './media.js?v=20261028';
import { initPulse } from './pulse.js?v=20261028';
import { gauge, vbars, hbars, dumbbell, stacked, radar, trend, spark, cover } from './charts.js?v=20261028';
import { initHeader, initOverlays, initCopy, initCalmToggle, initCursor, initMagnetic, initTilt, initTransitions, initFab, store } from './ui.js?v=20261028';
import { initForms } from './forms.js?v=20261028';
import { initAnon } from './anon.js?v=20261028';

const html = document.documentElement;
const CALM = html.classList.contains('is-calm');
const FINE = window.matchMedia('(pointer: fine)').matches;
const MOBILE = () => window.innerWidth < 760;
const page = document.querySelector('[data-page]')?.dataset.page || 'home';
const gsap = window.gsap || null;
const ST = window.ScrollTrigger || null;
if (gsap) { const plugins = [ST, window.SplitText, window.DrawSVGPlugin].filter(Boolean); gsap.registerPlugin(...plugins); }
if (ST) ST.config({ ignoreMobileResize: true });
const motion = !!gsap && !CALM;

/* ---------- 1. contenus ---------- */
fillMedia();
document.querySelectorAll('[data-cover]').forEach(cover);

const now = new Date();
const dayDiff = (iso) => Math.floor((new Date(`${iso}T00:00:00+01:00`) - now) / 86400000);
document.querySelectorAll('[data-days-to]').forEach((el) => { const d = Math.max(0, dayDiff(el.dataset.daysTo)); el.textContent = el.dataset.daysFmt === 'n' ? d : `J-${d}`; });

function renderMilestones() {
  const ol = document.querySelector('[data-milestones]');
  if (!ol) return;
  const today = now.toISOString().slice(0, 10);
  const items = DATES.map((d, i) => ({ ...d, key: d.date || null, i }));
  // les événements sans date gardent leur place : après le précédent daté
  let lastKey = '0000';
  items.forEach((it) => { if (it.key) lastKey = it.key; else it.key = `${lastKey < today ? today : lastKey}~${it.i}`; });
  items.push({ id: 'today', key: `${today}`, label: 'Aujourd’hui', what: 'Inscriptions ouvertes', note: 'Participez à l’enquête nationale RPS 2026.', now: true });
  items.sort((a, b) => (a.key < b.key ? -1 : a.key > b.key ? 1 : (a.now ? 1 : -1)));
  let next = false;
  ol.innerHTML = items.map((it, i) => {
    const past = !it.now && it.date && (it.end || it.date) < today;
    let cls = past ? 'is-past' : it.now ? 'is-now' : '';
    let badge = past ? (it.pastLabel || 'Passé') : it.now ? 'En ce moment' : 'À venir';
    if (!past && !it.now && !next) { cls += ' is-next'; next = true; }
    return `<li class="ms ${cls}" style="--i:${i}"><span class="ms__dot" data-pulse${it.now ? ' data-pulse-beat' : ''}></span><span class="ms__when">${it.label}<span class="ms__badge">${badge}</span>${it.tbc ? '<span class="tbc">à compléter</span>' : ''}</span><p class="ms__what">${it.what}</p>${it.note ? `<p class="ms__note">${it.note}</p>` : ''}</li>`;
  }).join('');
}
renderMilestones();

function buildStadium() {
  const svg = document.querySelector('[data-stadium-svg]');
  if (!svg) return null;
  const NS = 'http://www.w3.org/2000/svg';
  const rows = [];
  const inner = document.createElementNS(NS, 'ellipse');
  inner.setAttribute('cx', 250); inner.setAttribute('cy', 200); inner.setAttribute('rx', 148); inner.setAttribute('ry', 112);
  inner.setAttribute('class', 'inner'); svg.appendChild(inner);
  for (let k = 0; k < 6; k++) {
    const rx = 152 + k * 15, ry = 114 + k * 11;
    const e = document.createElementNS(NS, 'ellipse');
    e.setAttribute('cx', 250); e.setAttribute('cy', 200); e.setAttribute('rx', rx); e.setAttribute('ry', ry);
    e.setAttribute('class', 'row-ring'); e.style.strokeDasharray = `${2 + k * 0.4} ${4 + k * 0.6}`;
    svg.appendChild(e); rows.push(e);
  }
  const ring = document.createElementNS(NS, 'path');
  ring.setAttribute('d', 'M14 200 A236 182 0 1 1 486 200 A236 182 0 1 1 14 200');
  ring.setAttribute('class', 'main-ring'); svg.appendChild(ring);
  const pitch = document.createElementNS(NS, 'rect');
  pitch.setAttribute('x', 142); pitch.setAttribute('y', 128); pitch.setAttribute('width', 216); pitch.setAttribute('height', 144); pitch.setAttribute('rx', 4);
  pitch.setAttribute('class', 'pitch'); svg.appendChild(pitch);
  return { rows, ring };
}
const stadium = buildStadium();

function countdown() {
  document.querySelectorAll('[data-countdown]').forEach((el) => {
    const end = new Date(el.dataset.countdown || RESTITUTION);
    const tick = () => {
      let s = Math.max(0, Math.floor((end - Date.now()) / 1000));
      const d = Math.floor(s / 86400); s -= d * 86400; const h = Math.floor(s / 3600); s -= h * 3600; const m = Math.floor(s / 60);
      const set = (k, v) => { const b = el.querySelector(`[data-cd="${k}"]`); if (b) b.textContent = v; };
      set('d', d); set('h', String(h).padStart(2, '0')); set('m', String(m).padStart(2, '0'));
      el.setAttribute('aria-label', `${d} jours, ${h} heures et ${m} minutes avant la restitution`);
    };
    tick(); setInterval(tick, 15000);
  });
}
countdown();

function lensTicks() {
  const svg = document.querySelector('[data-lens-ticks]');
  if (!svg) return;
  let out = '';
  for (let i = 0; i < 120; i++) {
    const a = (i / 120) * Math.PI * 2, major = i % 10 === 0, r1 = 96, r2 = major ? 100 : 98.2;
    out += `<line x1="${100 + Math.cos(a) * r1}" y1="${100 + Math.sin(a) * r1}" x2="${100 + Math.cos(a) * r2}" y2="${100 + Math.sin(a) * r2}" style="stroke:currentColor;stroke-width:${major ? 0.5 : 0.25}"/>`;
  }
  out += '<defs><path id="lensArc" d="M100 100 m-91 0 a91 91 0 1 1 182 0 a91 91 0 1 1 -182 0"/></defs><text style="font-family:var(--font-data);font-size:4.2px;letter-spacing:1.6px;fill:currentColor"><textPath href="#lensArc" startOffset="2%">OBSERVATOIRE DES CSE · RELEVÉ 2026 · ÉCOUTER · MESURER · PRÉVENIR ·</textPath></text>';
  svg.innerHTML = out;
}
lensTicks();

/* ---------- 2. graphiques ---------- */
const charts = {};
document.querySelectorAll('[data-gauge]').forEach((el) => { const g = gauge(el, { gsap, calm: !motion }); if (el.hasAttribute('data-ab-gauge')) charts.abGauge = g; });
document.querySelectorAll('[data-chart="ouverture"]').forEach((el) => { const c = vbars(el, OUVERTURE, { gsap, calm: !motion, set: el.dataset.set || 'os' }); if (el.hasAttribute('data-ab-target')) charts.abBars = c; });
document.querySelectorAll('[data-chart="miseenplace"]').forEach((el) => { charts.abH = hbars(el, MISE_EN_PLACE, { gsap, calm: !motion }); });
document.querySelectorAll('[data-chart="perception"]').forEach((el) => dumbbell(el, PERCEPTION, { gsap, calm: !motion }));
document.querySelectorAll('[data-chart="reunions"]').forEach((el) => stacked(el, REUNIONS, { gsap, calm: !motion, colors: ['var(--coral)', 'var(--ink)', '#A9B1C4', 'var(--paper-deep)'], legendEl: document.querySelector('[data-legend="reunions"]') }));
document.querySelectorAll('[data-chart="secteurs"]').forEach((el) => stacked(el, SECTEURS, { gsap, calm: !motion, colors: ['var(--ink)', 'var(--coral)', '#A9B1C4'], legendEl: document.querySelector('[data-legend="secteurs"]') }));

const ab = document.querySelector('[data-ab]');
if (ab) {
  const btns = ab.querySelectorAll('[data-ab-set]'), pill = ab.querySelector('.seg__pill'), filt = ab.querySelector('[data-ab-filter]');
  const place = () => { const on = ab.querySelector('[data-ab-set][aria-pressed="true"]'); if (on && pill) { pill.style.width = `${on.offsetWidth}px`; pill.style.transform = `translateX(${on.offsetLeft - 4}px)`; } };
  btns.forEach((b) => b.addEventListener('click', () => {
    btns.forEach((x) => x.setAttribute('aria-pressed', x === b ? 'true' : 'false')); place();
    const k = b.dataset.abSet;
    filt.textContent = k === 'os' ? 'Filtre appliqué : une ou plusieurs organisations syndicales' : 'Filtre appliqué : aucune organisation syndicale';
    charts.abBars?.set(k);
    charts.abH?.set(k);
    charts.abGauge?.set(OUVERTURE[k][1]);
  }));
  place(); window.addEventListener('resize', place); if (document.fonts) document.fonts.ready.then(place);
}

const demo = document.querySelector('[data-demo]');
if (demo) {
  const r = radar(demo.querySelector('[data-chart="radar"]'), { gsap, calm: !motion });
  trend(demo.querySelector('[data-chart="trend"]'), { gsap, calm: !motion });
  demo.querySelectorAll('[data-spark]').forEach((el) => spark(el, +el.dataset.spark));
  const seeds = { tous: 3, titulaire: 11, suppleant: 17, proximite: 23, ds: 31 };
  const kpis = { n: demo.querySelector('[data-kpi="n"]'), c: demo.querySelector('[data-kpi="c"]'), d: demo.querySelector('[data-kpi="d"]'), e: demo.querySelector('[data-kpi="e"]') };
  const fmt = (v) => Math.round(v).toLocaleString('fr-FR');
  let cur = { n: 0, c: 0, d: 0, e: 0 };
  const apply = (key) => {
    const s = seeds[key] || 3; let x = s * 7919;
    const rnd = () => { x = (x * 9301 + 49297) % 233280; return x / 233280; };
    const tgt = { n: key === 'tous' ? 1248 : 180 + rnd() * 520, c: 70 + rnd() * 22, d: key === 'tous' ? 87 : 30 + rnd() * 50, e: 2.1 + rnd() * 1.4 };
    const put = (o) => { kpis.n.textContent = fmt(o.n); kpis.c.textContent = `${Math.round(o.c)} %`; kpis.d.textContent = fmt(o.d); kpis.e.textContent = `${o.e.toFixed(1).replace('.', ',')} / 4`; };
    if (!motion) { cur = tgt; put(cur); } else { const o = { ...cur }; gsap.to(o, { ...tgt, duration: 1, ease: 'power3.out', onUpdate: () => put(o) }); cur = tgt; }
    r.set(s);
  };
  demo.querySelectorAll('[data-demo-f]').forEach((b) => b.addEventListener('click', () => { demo.querySelectorAll('[data-demo-f]').forEach((x) => x.setAttribute('aria-pressed', x === b ? 'true' : 'false')); apply(b.dataset.demoF); }));
  if (motion && ST) ST.create({ trigger: demo, start: 'top 75%', once: true, onEnter: () => apply('tous') }); else apply('tous');
}

/* ---------- 3. défilement fluide et interface ---------- */
let lenis = null;
if (motion && window.Lenis) {
  lenis = new window.Lenis({ lerp: 0.11, smoothWheel: true, anchors: true, autoRaf: false });
  lenis.on('scroll', ST ? ST.update : () => {});
  gsap.ticker.add((t) => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
  window.__lenis = lenis;
}
initHeader(lenis);
initOverlays({ gsap, lenis, calm: !motion });
initCopy();
initCalmToggle(CALM);
initForms({ gsap, calm: !motion });
initTransitions({ gsap, calm: !motion });
initFab();
if (motion && FINE) { initCursor(); initMagnetic(gsap); initTilt(gsap); }

/* ---------- 4. animations ---------- */
const heroGLp = (async () => {
  const lens = document.querySelector('[data-hero-gl]');
  if (!lens) return null;
  try {
    const { initHeroGL } = await import('./heroGL.js?v=20261028');
    const gl = initHeroGL(lens, { calm: !motion, imgEl: lens.querySelector('img'), lineEl: document.querySelector('[data-pulse-hero]') });
    if (gl) lens.classList.add('has-gl');
    return gl;
  } catch (e) { return null; }
})();

function splitHeads() {
  if (!motion || !window.SplitText) return;
  document.querySelectorAll('[data-split]').forEach((el) => {
    window.SplitText.create(el, {
      type: 'lines', mask: 'lines', linesClass: 'sl', autoSplit: true,
      onSplit: (self) => gsap.from(self.lines, { yPercent: 108, duration: 1.15, ease: 'expo.out', stagger: 0.09, scrollTrigger: { trigger: el, start: 'top 88%', once: true } }),
    });
  });
}

function reveals() {
  if (!motion) return;
  document.querySelectorAll('[data-reveal="clip"]').forEach((el) => {
    const inner = el.querySelector('picture, .ph');
    gsap.timeline({ scrollTrigger: { trigger: el, start: 'top 85%', once: true } })
      .fromTo(el, { clipPath: 'inset(100% 0% 0% 0% round var(--radius))' }, { clipPath: 'inset(0% 0% 0% 0% round var(--radius))', duration: 1.3, ease: 'expo.inOut' })
      .from(inner, { scale: 1.25, duration: 1.8, ease: 'expo.out' }, 0);
  });
  document.querySelectorAll('[data-parallax]').forEach((el) => {
    const inner = el.querySelector('picture, .ph'); if (!inner) return;
    gsap.set(inner, { scale: 1.16 });
    gsap.fromTo(inner, { yPercent: -6 }, { yPercent: 6, ease: 'none', scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true } });
  });
  gsap.utils.toArray('.fact, .gift, .study, .g-item, .cap, .hstep, .ms').forEach((el) => {
    const still = el.matches('.hstep, .ms');
    gsap.from(el, { y: still ? 0 : 36, opacity: 0, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 90%', once: true } });
  });
  document.querySelectorAll('[data-count]').forEach((el) => {
    const v = +el.dataset.count, o = { v: 0 };
    el.textContent = '0';
    ST.create({ trigger: el, start: 'top 88%', once: true, onEnter: () => gsap.to(o, { v, duration: 1.6, ease: 'power3.out', onUpdate: () => { el.textContent = Math.round(o.v); } }) });
  });
  document.querySelectorAll('[data-stamps]').forEach((box) => {
    gsap.from(box.children, { scale: 2.4, opacity: 0, rotation: (i) => [14, -12, 10][i % 3], filter: 'blur(6px)', duration: 0.55, ease: 'back.out(2.2)', stagger: 0.22, scrollTrigger: { trigger: box, start: 'top 85%', once: true } });
  });
  document.querySelectorAll('[data-odo]').forEach((el) => {
    const digits = el.dataset.odo.split('');
    el.innerHTML = digits.map(() => `<span class="odo__col">${'0123456789'.repeat(2).split('').map((d) => `<span>${d}</span>`).join('')}</span>`).join('');
    el.setAttribute('aria-label', el.dataset.odo);
    const cols = el.querySelectorAll('.odo__col');
    gsap.set(cols, { yPercent: 0 });
    ST.create({ trigger: el, start: 'top 90%', once: true, onEnter: () => cols.forEach((c, i) => gsap.to(c, { yPercent: -((10 + +digits[i]) / 20) * 100, duration: 1.6 + i * 0.25, ease: 'expo.out', delay: 0.2 })) });
  });
  document.querySelectorAll('[data-art]').forEach((svg) => {
    const parts = svg.querySelectorAll('.d');
    if (window.DrawSVGPlugin) gsap.from(parts, { drawSVG: '0%', duration: 1.4, ease: 'power2.inOut', stagger: 0.08, scrollTrigger: { trigger: svg, start: 'top 85%', once: true } });
  });
  document.querySelectorAll('.cap svg').forEach((svg) => {
    const m = svg.querySelector('.cap__move'); if (!m) return;
    svg.closest('.cap').addEventListener('pointerenter', () => gsap.fromTo(m, { drawSVG: '0%' }, { drawSVG: '100%', duration: 0.8, ease: 'power2.out' }));
  });
  const fan = document.querySelector('[data-fan]');
  if (fan) {
    const pgs = fan.querySelectorAll('.pg');
    gsap.fromTo(pgs, { rotation: 0, xPercent: (i) => [60, 0, -60][i], y: 40 }, { rotation: (i) => [-10, -2, 7][i], xPercent: 0, y: (i) => [30, 0, 20][i], duration: 1.4, ease: 'expo.out', stagger: 0.08, scrollTrigger: { trigger: fan, start: 'top 75%', once: true } });
  }
}

function aboutSlides() {
  const media = document.querySelector('[data-about-media]');
  if (!media) return;
  const slides = media.querySelectorAll('.slide'), count = media.querySelector('[data-about-count]');
  let cur = 0;
  slides.forEach((s, i) => { s.style.zIndex = i === 0 ? 2 : 1; s.style.clipPath = i === 0 ? 'inset(0 0 0 0)' : 'inset(100% 0 0 0)'; });
  const show = (i) => {
    if (i === cur) return;
    const prev = slides[cur], next = slides[i]; cur = i;
    if (count) count.textContent = `${i + 1} / ${slides.length}`;
    slides.forEach((s) => { s.style.zIndex = 1; }); prev.style.zIndex = 2; next.style.zIndex = 3;
    if (!motion) { next.style.clipPath = 'inset(0 0 0 0)'; return; }
    gsap.fromTo(next, { clipPath: 'inset(100% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.1, ease: 'expo.inOut' });
    const inner = next.querySelector('picture, .ph'); if (inner) gsap.fromTo(inner, { scale: 1.2 }, { scale: 1, duration: 1.6, ease: 'expo.out' });
  };
  if (!ST) return;
  document.querySelectorAll('.beat').forEach((b, i) => ST.create({ trigger: b, start: 'top 62%', end: 'bottom 62%', onToggle: (self) => { if (self.isActive) show(i); } }));
}

function parcours() {
  const sec = document.querySelector('[data-parcours]');
  if (!sec) return;
  const screen = sec.querySelector('[data-phone-screen]');
  if (screen) {
    const fit = () => screen.style.setProperty('--ps-scale', (screen.clientWidth / 276).toFixed(4));
    fit(); if ('ResizeObserver' in window) new ResizeObserver(fit).observe(screen);
  }
  const steps = sec.querySelectorAll('.step'), screens = sec.querySelectorAll('[data-ps]');
  const typed = sec.querySelector('[data-type]'), text = typed?.dataset.type || '';
  const box = sec.querySelector('[data-box="0"] svg'), btn = sec.querySelector('[data-ps-btn]'), notif = sec.querySelector('[data-notif]');
  const dots = sec.querySelectorAll('[data-ps="1"] .ps__scale');
  const gifts = sec.querySelectorAll('[data-ps="2"] .ps__gift');
  const setStep = (i) => steps.forEach((s, k) => s.classList.toggle('is-on', k === i));
  if (!motion || !ST) {
    if (typed) typed.textContent = text;
    screens.forEach((s, i) => { s.style.display = i === 0 ? '' : 'none'; });
    steps.forEach((s) => s.classList.add('is-on'));
    return;
  }
  gsap.set(screens, { xPercent: (i) => (i === 0 ? 0 : 100) });
  gsap.set(box, { scale: 0, transformOrigin: '50% 50%' });
  gsap.set(notif, { yPercent: -160, opacity: 0 });
  gsap.set(gifts, { x: 40, opacity: 0 });
  const o = { n: 0 };
  const tl = gsap.timeline({ defaults: { ease: 'power2.inOut' } });
  tl.to(o, { n: text.length, duration: 1, ease: 'none', onUpdate: () => { typed.textContent = text.slice(0, Math.round(o.n)); } })
    .to(box, { scale: 1, duration: 0.3, ease: 'back.out(3)' }, 1.3)
    .to(btn, { scale: 0.94, duration: 0.15, yoyo: true, repeat: 1 }, 1.75)
    .to(screens[0], { xPercent: -100, duration: 0.6 }, 2.1)
    .to(screens[1], { xPercent: 0, duration: 0.6 }, 2.1)
    .to(notif, { yPercent: 0, opacity: 1, duration: 0.5, ease: 'back.out(1.6)' }, 2.5)
    .to(notif, { yPercent: -160, opacity: 0, duration: 0.4 }, 3.3);
  dots.forEach((d, k) => { const sp = d.querySelectorAll('span'); const pick = [3, 1, 4][k]; tl.call(() => {}, null, 3.4); tl.to(sp[pick], { backgroundColor: 'var(--ink)', duration: 0.2 }, 3.5 + k * 0.35); });
  tl.to(screens[1], { xPercent: -100, duration: 0.6 }, 4.7)
    .to(screens[2], { xPercent: 0, duration: 0.6 }, 4.7)
    .to(gifts, { x: 0, opacity: 1, stagger: 0.18, duration: 0.5, ease: 'power3.out' }, 5.2)
    .to({}, { duration: 0.6 });
  const total = tl.duration();
  ST.create({
    trigger: sec, start: 'top top', end: () => `+=${window.innerHeight * (MOBILE() ? 1.4 : 1.7)}`, pin: true, scrub: 0.7, animation: tl, anticipatePin: 1,
    onUpdate: (self) => { const t = self.progress * total; setStep(t < 1.05 ? 0 : t < 2.15 ? 1 : t < 4.75 ? 2 : 3); },
  });
}

function anonymiser() {
  const sec = document.querySelector('[data-anon]');
  if (!sec) return;
  const a = initAnon(sec, { calm: !motion, mobile: MOBILE() });
  const list = sec.querySelectorAll('.guar');
  if (!motion || !ST) { a.setProgress(1); return; }
  gsap.from(list, { opacity: 0, y: 24, stagger: 0.08, duration: 0.9, ease: 'power3.out', scrollTrigger: { trigger: sec.querySelector('[data-anon-list]'), start: 'top 92%', once: true } });
  if (MOBILE()) {
    // téléphone : pas d'épinglage, la fiche se défait pendant que la section défile
    ST.create({ trigger: sec, start: 'top 55%', end: 'bottom 45%', scrub: 0.6, onUpdate: (self) => a.setProgress(self.progress), onRefresh: () => a.resample() });
  } else {
    ST.create({ trigger: sec, start: 'top top', end: () => `+=${window.innerHeight}`, pin: true, scrub: 0.6, anticipatePin: 1, onUpdate: (self) => a.setProgress(self.progress * 1.1), onRefresh: () => a.resample() });
  }
}

function stadiumAnim() {
  if (!stadium) return;
  if (!motion || !window.DrawSVGPlugin || !ST) { stadium.rows.forEach((r) => r.classList.add('is-lit')); return; }
  gsap.set(stadium.ring, { drawSVG: '0%' });
  const host = document.querySelector('[data-stadium]');
  ST.create({ trigger: host, start: 'top 80%', end: 'center 45%', scrub: 0.6,
    animation: gsap.to(stadium.ring, { drawSVG: '100%', ease: 'none' }),
    onUpdate: (self) => stadium.rows.forEach((r, i) => r.classList.toggle('is-lit', self.progress > (stadium.rows.length - i) / (stadium.rows.length + 1))) });
  gsap.from(host.querySelectorAll('.countdown div'), { y: 30, opacity: 0, stagger: 0.1, duration: 1, ease: 'expo.out', scrollTrigger: { trigger: host, start: 'top 70%', once: true } });
}

function heroIn(pulse, gl) {
  const items = document.querySelectorAll('[data-hero-in]');
  const title = document.querySelector('[data-hero-title]');
  // la CSS masquait le héros en attendant : GSAP prend le relais (pas de flash visible → masqué → animé)
  document.documentElement.classList.add('hero-pret');
  if (!motion) { pulse?.revealHero(null); gl?.reveal(null); return; }
  const lines = title && title.classList.contains('hero-title') ? title.querySelectorAll('.l') : [];
  const firstVisit = page === 'home' && store.get('ocse-intro', 'session') !== '1';
  const startHero = (delay) => {
    if (lines.length) {
      lines.forEach((l) => { const w = document.createElement('span'); w.className = 'l-mask'; w.style.display = 'block'; w.style.overflow = 'hidden'; w.style.paddingBottom = '.08em'; w.style.marginBottom = '-.08em'; l.parentNode.insertBefore(w, l); w.appendChild(l); });
      gsap.from(lines, { yPercent: 110, duration: 1.3, ease: 'expo.out', stagger: 0.1, delay });
    }
    if (items.length) gsap.from(items, { y: 24, opacity: 0, duration: 1.1, ease: 'expo.out', stagger: 0.07, delay: delay + 0.25 });
    pulse?.revealHero(gsap, 1.6, delay + 0.1);
    gl?.reveal(gsap, 1.6, delay + 0.2);
  };
  if (!firstVisit) { startHero(0.15); return; }
  store.set('ocse-intro', '1', 'session');
  const W = window.innerWidth, c = W / 2;
  const el = document.createElement('div'); el.className = 'intro'; el.setAttribute('aria-hidden', 'true');
  const beat = (x) => `H${x - 18}l6-14 7 44 6-50 6 30 5-10`;
  el.innerHTML = `<div class="intro__half intro__half--top"></div><div class="intro__half intro__half--bot"></div>
    <svg class="intro__line" viewBox="0 0 ${W} 140"><path d="M0 70${beat(c - 140)}${beat(c)}${beat(c + 140)}H${W}"/><circle class="intro__dot" cx="${c + 140 + 12}" cy="70" r="0"/></svg>
    <p class="intro__label">Prise de pouls</p>`;
  document.body.appendChild(el);
  lenis?.stop();
  const path = el.querySelector('path'), dot = el.querySelector('circle');
  const tl = gsap.timeline({ onComplete: () => { el.remove(); lenis?.start(); } });
  tl.from(path, { drawSVG: '0%', duration: 1.15, ease: 'power2.inOut' })
    .from(el.querySelector('.intro__label'), { opacity: 0, y: 8, duration: 0.5 }, 0.15)
    .to(dot, { attr: { r: 6 }, duration: 0.25, ease: 'back.out(3)' }, 0.95)
    .to(dot, { attr: { r: 9 }, duration: 0.12, yoyo: true, repeat: 3, ease: 'power1.inOut' }, 1.15)
    .to(el.querySelector('.intro__label'), { opacity: 0, duration: 0.3 }, 1.5)
    .to(el.querySelector('.intro__half--top'), { yPercent: -101, duration: 1.0, ease: 'expo.inOut' }, 1.6)
    .to(el.querySelector('.intro__half--bot'), { yPercent: 101, duration: 1.0, ease: 'expo.inOut' }, 1.6)
    .to(el.querySelector('svg'), { opacity: 0, duration: 0.4 }, 1.75)
    .add(() => startHero(0), 1.75);
}

function heroLife(pulse) {
  const bpm = document.querySelector('[data-bpm]');
  if (bpm) {
    if (!motion) bpm.textContent = '60';
    else {
      let last = 0, timer = 0;
      const tick = () => { const v = Math.round(58 + pulse.energy * 76); if (v !== last) { bpm.textContent = v; last = v; } };
      const on = () => { if (!timer) timer = setInterval(tick, 140); }, off = () => { clearInterval(timer); timer = 0; };
      if ('IntersectionObserver' in window) new IntersectionObserver(([e]) => (e.isIntersecting ? on() : off())).observe(bpm); else on();
    }
  }
  const ticks = document.querySelector('[data-lens-ticks]');
  if (ticks && motion && ST) gsap.to(ticks, { rotation: 140, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 0.8 } });
}

// arrivée sur une ancre (#qui…) ou retour depuis le mode calme : position recalculée après l'ajout des sections épinglées
let landed = false;
function landOnTarget() {
  let id = location.hash && location.hash.length > 1 ? decodeURIComponent(location.hash.slice(1)) : '';
  const back = store.get('ocse-back', 'session');
  if (back) { id = back; setTimeout(() => store.set('ocse-back', '', 'session'), 2500); }
  if (!id) return;
  const el = document.getElementById(id);
  if (!el) return;
  const host = el.parentElement && el.parentElement.classList.contains('pin-spacer') ? el.parentElement : el;
  if (lenis) lenis.scrollTo(host, { immediate: true, force: true }); else host.scrollIntoView();
  landed = true;
}

function boot(gl) {
  splitHeads();
  reveals();
  aboutSlides();
  parcours();
  anonymiser();
  stadiumAnim();
  const pulse = initPulse({ calm: !motion, fine: FINE, getVelocity: () => (lenis ? lenis.velocity : 0) });
  if (ST) ST.addEventListener('refresh', () => pulse.rebuild());
  heroIn(pulse, gl);
  heroLife(pulse);
  if (ST) ST.refresh();
  landOnTarget();
  if (ST) window.addEventListener('load', () => { ST.refresh(); landOnTarget(); }, { once: true });
  html.classList.add('is-ready');
}

heroGLp.then(boot, () => boot(null));
