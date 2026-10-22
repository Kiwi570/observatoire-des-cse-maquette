/* Graphiques : vraies données de la 1re étude (data.js) et démonstration fictive RPS 2026. */
const NS = 'http://www.w3.org/2000/svg';
function S(tag, attrs = {}, parent) {
  const e = document.createElementNS(NS, tag);
  for (const k in attrs) e.setAttribute(k, attrs[k]);
  if (parent) parent.appendChild(e);
  return e;
}
const pct = (v) => `${String(v).replace('.', ',')} %`;
const css = (n) => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
// le texte des SVG garde une taille lisible quand le graphique rétrécit sur téléphone
const fitText = (svg, vbW) => {
  const f = () => { const w = svg.getBoundingClientRect().width; if (w) svg.style.setProperty('--fs', Math.min(1.75, Math.max(1, vbW / w)).toFixed(3)); };
  f(); if ('ResizeObserver' in window) new ResizeObserver(f).observe(svg); else window.addEventListener('resize', f);
};
const fs = (px) => `font-size:calc(${px}px * var(--fs, 1))`;
const onEnter = (el, fn, gsap, calm, start = 'top 82%') => {
  if (calm || !gsap || !window.ScrollTrigger) { fn(true); return; }
  window.ScrollTrigger.create({ trigger: el, start, once: true, onEnter: () => fn(false) });
};

/* ---------- baromètre ---------- */
export function gauge(el, { gsap, calm }) {
  const value = parseFloat(el.dataset.gauge), cap = el.dataset.gaugeCap || '';
  const cx = 200, cy = 206, R = 168;
  const svg = S('svg', { viewBox: '-20 -6 440 226', 'aria-hidden': 'true' }, el);
  const ticks = S('g', {}, svg);
  for (let v = 0; v <= 100; v += 2.5) {
    const a = Math.PI * (1 - v / 100), major = v % 25 === 0, mid = v % 5 === 0;
    const r1 = R + 6, r2 = R + (major ? 22 : mid ? 15 : 10);
    S('line', { x1: cx + Math.cos(a) * r1, y1: cy - Math.sin(a) * r1, x2: cx + Math.cos(a) * r2, y2: cy - Math.sin(a) * r2, style: `stroke:var(--ink);stroke-width:${major ? 1.6 : 1};opacity:${major ? 1 : 0.45}` }, ticks);
    if (major) { const t = S('text', { x: cx + Math.cos(a) * (R + 38), y: cy - Math.sin(a) * (R + 38) + 4, 'text-anchor': 'middle', style: `font-family:var(--font-data);${fs(12)};fill:var(--ink-soft)` }, ticks); t.textContent = v; }
  }
  const arcR = R - 14, len = Math.PI * arcR;
  const d = `M${cx - arcR} ${cy} A${arcR} ${arcR} 0 0 1 ${cx + arcR} ${cy}`;
  S('path', { d, style: 'fill:none;stroke:var(--paper-deep);stroke-width:14;stroke-linecap:round' }, svg);
  S('path', { d, style: 'fill:none;stroke:var(--rule);stroke-width:1' }, svg);
  const val = S('path', { d, style: `fill:none;stroke:var(--coral);stroke-width:14;stroke-linecap:round;stroke-dasharray:${len};stroke-dashoffset:${len}` }, svg);
  const needle = S('g', {}, svg);
  S('line', { x1: cx, y1: cy, x2: cx, y2: cy - (R - 34), style: 'stroke:var(--ink);stroke-width:2.2;stroke-linecap:round' }, needle);
  S('circle', { cx, cy: cy - (R - 34), r: 4, style: 'fill:var(--coral)' }, needle);
  S('circle', { cx, cy, r: 10, style: 'fill:var(--ink)' }, svg);
  S('circle', { cx, cy, r: 3.5, style: 'fill:var(--paper)' }, svg);
  fitText(svg, 440);
  const box = document.createElement('div'); box.className = 'gauge__value';
  box.innerHTML = `<span class="gauge__n num"><span data-gn>0</span><small style="font-size:.5em">&nbsp;%</small></span><span class="gauge__cap">${cap}</span>`;
  el.appendChild(box);
  el.setAttribute('role', 'img');
  const nEl = box.querySelector('[data-gn]');
  let cur = 0;
  const apply = (v, instant) => {
    el.setAttribute('aria-label', `${pct(v)} ${cap}`);
    const ang = -90 + v * 1.8;
    if (instant || !gsap) {
      needle.setAttribute('transform', `rotate(${ang} ${cx} ${cy})`);
      val.style.strokeDashoffset = len * (1 - v / 100); nEl.textContent = v; cur = v; return;
    }
    gsap.to(needle, { rotation: ang, svgOrigin: `${cx} ${cy}`, duration: 2.4, ease: 'elastic.out(1, 0.32)' });
    gsap.to(val, { strokeDashoffset: len * (1 - v / 100), duration: 1.4, ease: 'power3.out' });
    const o = { v: cur }; gsap.to(o, { v, duration: 1.4, ease: 'power3.out', onUpdate: () => { nEl.textContent = Math.round(o.v); } }); cur = v;
  };
  if (gsap) gsap.set(needle, { rotation: -90, svgOrigin: `${cx} ${cy}` });
  onEnter(el, (instant) => apply(value, instant), gsap, calm);
  return { set: (v) => apply(v, calm) };
}

/* ---------- barres verticales ; un point qui bat sur la réponse majoritaire ---------- */
export function vbars(el, data, { gsap, calm, set = 'os' }) {
  const W = 560, H = 330, base = 250, maxV = 75, plotH = 172, bw = 82;
  const n = data.cats.length, x0 = 24, gap = (W - 2 * x0 - n * bw) / (n - 1);
  const svg = S('svg', { viewBox: `0 0 ${W} ${H}`, role: 'img' }, el);
  const grid = S('g', { class: 'grid' }, svg);
  [0, 25, 50, 75].forEach((v) => {
    const y = base - (v / maxV) * plotH;
    S('line', { x1: 0, x2: W, y1: y, y2: y, style: `stroke:var(--rule);stroke-dasharray:${v ? '2 4' : 'none'}` }, grid);
    const t = S('text', { x: W, y: y - 6, 'text-anchor': 'end' }, grid); t.textContent = v ? `${v} %` : '';
  });
  const cx = (i) => x0 + i * (bw + gap) + bw / 2;
  const bars = data.cats.map((c, i) => S('rect', { x: cx(i) - bw / 2, width: bw, y: base, height: 0, rx: 3, style: `fill:var(${i === 1 ? '--coral' : '--ink'})` }, svg));
  const dot = S('circle', { class: 'vb-dot', r: 5, cx: cx(0), cy: base }, svg);
  const vals = [];
  data.cats.forEach((c, i) => {
    const tv = S('text', { x: cx(i), y: base - 12, 'text-anchor': 'middle', class: `vb-val ${i === 1 ? 't-big' : 't-strong'}`, style: i === 1 ? '' : fs(14) }, svg);
    const words = c.split(' '); const tl = S('text', { x: cx(i), y: base + 12, 'text-anchor': 'middle', 'dominant-baseline': 'hanging', style: fs(12.5) }, svg);
    if (words.length > 1 && c.length > 10) { const a = S('tspan', { x: cx(i) }, tl); a.textContent = words[0]; const b = S('tspan', { x: cx(i), dy: '1.25em' }, tl); b.textContent = words.slice(1).join(' '); }
    else tl.textContent = c;
    vals.push(tv);
  });
  fitText(svg, W);
  const hOf = (v) => (v / maxV) * plotH;
  const hp = data.cats.map(() => ({ h: 0, v: 0 }));
  const draw = () => {
    hp.forEach((p, i) => {
      bars[i].setAttribute('y', base - p.h); bars[i].setAttribute('height', p.h);
      vals[i].setAttribute('y', base - p.h - 12);
      vals[i].textContent = p.h > 0.5 ? pct(Math.round(p.v)) : '';
    });
    let m = 0; hp.forEach((p, i) => { if (p.h > hp[m].h) m = i; });
    dot.setAttribute('cx', cx(m)); dot.setAttribute('cy', base - hp[m].h);
    dot.style.opacity = hp[m].h > 0.5 ? '1' : '0';
  };
  let current = data[set].slice();
  const apply = (arr, instant, onDone) => {
    svg.setAttribute('aria-label', data.cats.map((c, i) => `${c} ${pct(arr[i])}`).join(', '));
    if (instant || !gsap) { hp.forEach((p, i) => { p.h = hOf(arr[i]); p.v = arr[i]; }); draw(); }
    else hp.forEach((p, i) => gsap.to(p, { h: hOf(arr[i]), v: arr[i], duration: 1.1, ease: 'power3.out', delay: i * 0.08, onUpdate: draw }));
    current = arr.slice();
    if (onDone) { if (instant || !gsap) onDone(); else gsap.delayedCall(1.4, onDone); }
  };
  draw();
  onEnter(el, (instant) => apply(current, instant), gsap, calm, 'top 78%');
  return { set: (name, done) => apply(data[name], calm, done) };
}

/* ---------- barres horizontales ---------- */
export function hbars(el, data, { gsap, calm, set = 'os' }) {
  el.innerHTML = data.cats.map((c, i) => `<div class="hb__row"><span class="hb__label">${c}</span><span class="hb__track"><span class="hb__fill${i === 0 ? ' hb__fill--hi' : ''}"></span></span><span class="hb__v num">0 %</span></div>`).join('');
  const fills = [...el.querySelectorAll('.hb__fill')], vs = [...el.querySelectorAll('.hb__v')];
  let cur = data.cats.map(() => 0);
  const apply = (arr, instant) => {
    fills.forEach((f, i) => {
      if (instant || !gsap) { f.style.transform = `scaleX(${arr[i] / 100})`; vs[i].textContent = pct(arr[i]); return; }
      gsap.to(f, { scaleX: arr[i] / 100, duration: 1.1, ease: 'power3.out', delay: i * 0.06 });
      const o = { v: cur[i] }; gsap.to(o, { v: arr[i], duration: 1.1, delay: i * 0.06, onUpdate: () => { vs[i].textContent = pct(Math.round(o.v)); } });
    });
    cur = arr.slice();
  };
  onEnter(el, (instant) => apply(data[set], instant), gsap, calm);
  return { set: (name) => apply(data[name], calm) };
}

/* ---------- haltères : deux populations sur une même proposition ---------- */
export function dumbbell(el, data, { gsap, calm }) {
  const max = 20;
  const ticks = [0, 5, 10, 15, 20];
  el.innerHTML = `<div class="db__axis" aria-hidden="true"><span></span><span class="db__ticks">${ticks.map((t) => `<i style="left:${(t / max) * 100}%">${t} %</i>`).join('')}</span></div>` +
    data.items.map(([label, a, b]) => {
      const lo = Math.min(a, b), hi = Math.max(a, b), close = hi - lo < 3;
      return `<div class="db__row${close ? ' is-close' : ''}" tabindex="0">
        <span class="db__label">${label}<span class="sr-only"> : ${pct(a)} avec présence syndicale, ${pct(b)} sans organisation syndicale</span></span>
        <span class="db__track" aria-hidden="true"><span class="db__bar" style="left:${(lo / max) * 100}%;width:${((hi - lo) / max) * 100}%"></span>
        <span class="db__dot db__dot--a" style="left:${(a / max) * 100}%"><b>${pct(a)}</b></span>
        <span class="db__dot db__dot--b" style="left:${(b / max) * 100}%"><b>${pct(b)}</b></span></span></div>`;
    }).join('');
  if (!calm && gsap) {
    const rows = el.querySelectorAll('.db__row');
    gsap.set(el.querySelectorAll('.db__dot'), { scale: 0 }); gsap.set(el.querySelectorAll('.db__bar'), { scaleX: 0 });
    onEnter(el, () => {
      gsap.to(el.querySelectorAll('.db__bar'), { scaleX: 1, duration: 0.9, ease: 'power3.out', stagger: 0.05 });
      gsap.to(el.querySelectorAll('.db__dot'), { scale: 1, duration: 0.6, ease: 'back.out(2.4)', stagger: 0.04, delay: 0.2 });
      gsap.from(rows, { opacity: 0, y: 16, duration: 0.8, stagger: 0.05, ease: 'power3.out' });
    }, gsap, calm);
  }
}

/* ---------- barres empilées à 100 % ---------- */
const SERIES_COLORS = ['var(--ink)', 'var(--coral)', '#A9B1C4', 'var(--paper-deep)'];
export function stacked(el, data, { gsap, calm, colors = SERIES_COLORS, legendEl = null }) {
  if (legendEl) legendEl.innerHTML = data.series.map((s, i) => `<li><i style="background:${colors[i]};${i === 3 ? 'box-shadow:inset 0 0 0 1px var(--rule)' : ''}"></i>${s}</li>`).join('');
  el.innerHTML = data.rows.map(([label, vals]) => `<div class="st__row"><span class="st__label">${label}</span><span class="st__bar" role="img" aria-label="${label} : ${vals.map((v, i) => `${data.series[i]} ${pct(v)}`).join(', ')}">${vals.map((v, i) => v ? `<span class="st__seg" style="flex-grow:${v};background:${colors[i]};color:${/--ink|--night/.test(colors[i]) ? 'var(--paper)' : 'var(--ink)'}">${v >= 9 ? `<b>${v}</b>` : ''}</span>` : '').join('')}</span></div>`).join('');
  if (!calm && gsap) {
    const bars = el.querySelectorAll('.st__bar');
    gsap.set(bars, { clipPath: 'inset(0 100% 0 0)' });
    onEnter(el, () => gsap.to(bars, { clipPath: 'inset(0 0% 0 0)', duration: 1.2, ease: 'power3.inOut', stagger: 0.1 }), gsap, calm);
  }
}

/* ---------- démonstration fictive ---------- */
function seeded(seed) { let s = seed * 9301 + 49297; return () => { s = (s * 9301 + 49297) % 233280; return s / 233280; }; }
export const DEMO_AXES = ['Intensité et temps de travail', 'Exigences émotionnelles', 'Autonomie', 'Rapports sociaux', 'Conflits de valeurs', 'Insécurité de la situation'];

export function radar(el, { gsap, calm }) {
  const W = 520, H = 400, cx = 260, cy = 205, R = 130, n = DEMO_AXES.length;
  const svg = S('svg', { viewBox: `0 0 ${W} ${H}`, role: 'img', 'aria-label': 'Radar fictif d’exposition par axe d’exemple' }, el);
  for (let k = 1; k <= 4; k++) {
    const pts = []; for (let i = 0; i < n; i++) { const a = -Math.PI / 2 + (i / n) * Math.PI * 2; pts.push(`${cx + Math.cos(a) * R * k / 4},${cy + Math.sin(a) * R * k / 4}`); }
    S('polygon', { points: pts.join(' '), style: 'fill:none;stroke:var(--rule-night);stroke-width:1' }, svg);
  }
  DEMO_AXES.forEach((lab, i) => {
    const a = -Math.PI / 2 + (i / n) * Math.PI * 2;
    S('line', { x1: cx, y1: cy, x2: cx + Math.cos(a) * R, y2: cy + Math.sin(a) * R, style: 'stroke:var(--rule-night)' }, svg);
    const tx = cx + Math.cos(a) * (R + 22), ty = cy + Math.sin(a) * (R + 22);
    const anchor = Math.abs(Math.cos(a)) < 0.2 ? 'middle' : Math.cos(a) > 0 ? 'start' : 'end';
    const t = S('text', { x: tx, y: ty + 4, 'text-anchor': anchor, class: 't-strong', style: fs(12) }, svg);
    const words = lab.split(' ');
    if (lab.length > 16) { const half = Math.ceil(words.length / 2); const a1 = S('tspan', { x: tx }, t); a1.textContent = words.slice(0, half).join(' '); const a2 = S('tspan', { x: tx, dy: '1.25em' }, t); a2.textContent = words.slice(half).join(' '); }
    else t.textContent = lab;
  });
  const poly = S('polygon', { points: '', style: 'fill:rgba(255,106,77,.22);stroke:var(--coral);stroke-width:2;stroke-linejoin:round' }, svg);
  const dots = DEMO_AXES.map(() => S('circle', { r: 4, style: 'fill:var(--coral)' }, svg));
  fitText(svg, W);
  // sur téléphone, le radar devient une liste de barres
  const list = document.createElement('ul'); list.className = 'radar-list'; list.setAttribute('aria-hidden', 'true');
  list.innerHTML = DEMO_AXES.map((lab) => `<li><span>${lab}</span><i><b></b></i></li>`).join('');
  el.appendChild(list);
  const fills = list.querySelectorAll('b');
  let cur = DEMO_AXES.map(() => 0);
  const draw = (vals) => {
    const pts = vals.map((v, i) => { const a = -Math.PI / 2 + (i / n) * Math.PI * 2; return [cx + Math.cos(a) * R * v, cy + Math.sin(a) * R * v]; });
    poly.setAttribute('points', pts.map((p) => p.join(',')).join(' '));
    pts.forEach((p, i) => { dots[i].setAttribute('cx', p[0]); dots[i].setAttribute('cy', p[1]); });
    vals.forEach((v, i) => { fills[i].style.transform = `scaleX(${v})`; });
  };
  const set = (seed) => {
    const r = seeded(seed); const target = DEMO_AXES.map(() => 0.35 + r() * 0.55);
    if (calm || !gsap) { cur = target; draw(cur); return; }
    const o = { t: 0 }, from = cur.slice();
    gsap.to(o, { t: 1, duration: 0.9, ease: 'power3.inOut', onUpdate: () => { cur = from.map((f, i) => f + (target[i] - f) * o.t); draw(cur); } });
  };
  draw(cur);
  return { set };
}

export function trend(el, { gsap, calm }) {
  const W = 520, H = 230, x0 = 30, x1 = 490, base = 180, years = [2026, 2027, 2028, 2029];
  const svg = S('svg', { viewBox: `0 0 ${W} ${H}`, role: 'img', 'aria-label': 'Évolution fictive d’une édition à l’autre : seule l’édition 2026 est renseignée' }, el);
  S('line', { x1: x0, x2: x1, y1: base, y2: base, style: 'stroke:var(--rule-night)' }, svg);
  fitText(svg, W);
  const xs = years.map((y, i) => x0 + (i / (years.length - 1)) * (x1 - x0));
  const path = S('path', { d: `M${xs[0]} 92 C ${xs[1] - 60} 92, ${xs[1] - 40} 120, ${xs[1]} 118 S ${xs[2]} 104, ${xs[2]} 104 S ${xs[3] - 40} 130, ${xs[3]} 126`, style: 'fill:none;stroke:var(--on-night-soft);stroke-width:1.5;stroke-dasharray:4 6' }, svg);
  years.forEach((y, i) => {
    const t = S('text', { x: xs[i], y: base + 26, 'text-anchor': 'middle', class: i === 0 ? 't-strong' : '' }, svg); t.textContent = y;
    if (i === 0) { S('circle', { cx: xs[i], cy: 92, r: 7, style: 'fill:var(--coral)' }, svg); const v = S('text', { x: xs[i] + 14, y: 80, class: 't-strong' }, svg); v.textContent = '1re édition'; }
    else { S('circle', { cx: xs[i], cy: [0, 118, 104, 126][i], r: 6, style: 'fill:var(--night-soft);stroke:var(--on-night-soft);stroke-width:1.5;stroke-dasharray:2 3' }, svg); const v = S('text', { x: xs[i], y: [0, 118, 104, 126][i] - 16, 'text-anchor': 'middle' }, svg); v.textContent = 'à venir'; }
  });
  if (!calm && gsap && window.DrawSVGPlugin) { gsap.set(path, { drawSVG: '0%' }); onEnter(el, () => gsap.to(path, { drawSVG: '100%', duration: 2, ease: 'power2.inOut' }), gsap, calm); }
}

export function spark(el, seed) {
  const r = seeded(seed + 3), pts = []; let v = 0.3;
  for (let i = 0; i < 24; i++) { v = Math.min(0.95, Math.max(0.08, v + (r() - 0.35) * 0.18)); pts.push(v); }
  const W = 200, H = 30;
  const d = pts.map((p, i) => `${i ? 'L' : 'M'}${(i / 23) * W} ${H - p * H}`).join(' ');
  el.innerHTML = `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" aria-hidden="true"><path d="${d} L${W} ${H} L0 ${H}Z" style="fill:rgba(255,106,77,.16)"/><path d="${d}" style="fill:none;stroke:var(--coral);stroke-width:1.5" vector-effect="non-scaling-stroke"/></svg>`;
}

export function cover(el) {
  const k = el.dataset.cover;
  if (k === 'bars') el.innerHTML = `<svg viewBox="0 0 320 200" preserveAspectRatio="xMidYMid slice"><rect width="320" height="200" style="fill:var(--paper-deep)"/>${[5, 68, 23, 3].map((v, i) => `<rect x="${44 + i * 62}" y="${170 - v * 1.9}" width="40" height="${v * 1.9}" rx="2" style="fill:var(${i === 1 ? '--coral' : '--ink'})"/>`).join('')}<path d="M20 170h280" style="stroke:var(--ink)"/></svg>`;
  else if (k === 'pulse') el.innerHTML = `<svg viewBox="0 0 320 200" preserveAspectRatio="xMidYMid slice"><rect width="320" height="200" style="fill:var(--night)"/><path d="M0 110h96l10-30 14 62 12-48 8 16h40l10-30 14 62 12-48 8 16h96" style="fill:none;stroke:var(--coral);stroke-width:2.4;stroke-linejoin:round;stroke-linecap:round"/><circle cx="300" cy="110" r="5" style="fill:var(--coral)"/></svg>`;
  else el.innerHTML = `<svg viewBox="0 0 320 200" preserveAspectRatio="xMidYMid slice"><rect width="320" height="200" style="fill:var(--paper)"/><rect x="24" y="24" width="272" height="152" rx="10" style="fill:none;stroke:var(--coral-ink);stroke-dasharray:5 6"/><text x="160" y="106" text-anchor="middle" style="font-family:var(--font-data);font-size:13px;fill:var(--coral-ink);letter-spacing:2px">CONTENU À FOURNIR</text></svg>`;
}
