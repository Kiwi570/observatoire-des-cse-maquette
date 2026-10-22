/* La ligne de pouls : un seul trait qui traverse la page.
   Agité en haut, il s'apaise au fil du défilement ; ses points de passage sont les éléments [data-pulse]. */

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
// battement : onde P, complexe QRS, onde T
function qrs(u) {
  return 0.16 * Math.exp(-((u + 2.6) ** 2) / 0.35) - 0.28 * Math.exp(-((u + 0.55) ** 2) / 0.035)
    + 1.0 * Math.exp(-(u * u) / 0.045) - 0.4 * Math.exp(-((u - 0.55) ** 2) / 0.05) + 0.3 * Math.exp(-((u - 2.3) ** 2) / 0.45);
}
function lerpP(a, b, t) { return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t }; }
function centripetal(p0, p1, p2, p3, t) {
  const d = (a, b) => Math.max(Math.pow(Math.hypot(b.x - a.x, b.y - a.y), 0.5), 1e-3);
  const t0 = 0, t1 = t0 + d(p0, p1), t2 = t1 + d(p1, p2), t3 = t2 + d(p2, p3);
  const tt = t1 + (t2 - t1) * t;
  const A1 = lerpP(p0, p1, (tt - t0) / (t1 - t0)), A2 = lerpP(p1, p2, (tt - t1) / (t2 - t1)), A3 = lerpP(p2, p3, (tt - t2) / (t3 - t2));
  const B1 = lerpP(A1, A2, (tt - t0) / (t2 - t0)), B2 = lerpP(A2, A3, (tt - t1) / (t3 - t1));
  return lerpP(B1, B2, (tt - t1) / (t2 - t1));
}
function upper(arr, n, v) { let lo = 0, hi = n; while (lo < hi) { const m = (lo + hi) >> 1; if (arr[m] <= v) lo = m + 1; else hi = m; } return lo; }
function lower(arr, n, v) { let lo = 0, hi = n; while (lo < hi) { const m = (lo + hi) >> 1; if (arr[m] < v) lo = m + 1; else hi = m; } return lo; }

export function initPulse({ calm = false, fine = true, getVelocity = () => 0 } = {}) {
  const cv = document.createElement('canvas');
  cv.className = 'pulse-canvas'; cv.setAttribute('aria-hidden', 'true');
  document.body.appendChild(cv);
  const ctx = cv.getContext('2d');
  const css = getComputedStyle(document.documentElement);
  const INK = css.getPropertyValue('--ink').trim() || '#13203A';
  const CORAL = css.getPropertyValue('--coral').trim() || '#FF6A4D';
  const PAPER = css.getPropertyValue('--paper').trim() || '#F3EEE4';
  let nights = [];

  let W = 0, H = 0, dpr = 1, N = 0, total = 0;
  let X = new Float32Array(0), Y = new Float32Array(0), L = new Float32Array(0), RM = new Float32Array(0);
  let shown = 0, heroReveal = calm ? 1 : 0, hero = null, mobile = false;
  let energy = 0.12, target = 0.12, lastX = null, lastY = null, lastT = 0;
  const heroEl = document.querySelector('[data-pulse-hero]');

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth; H = window.innerHeight; mobile = W < 760;
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function anchors() {
    const sy = window.scrollY, out = [];
    document.querySelectorAll('[data-pulse]').forEach((el) => {
      if (!el.offsetParent) return;
      const r = el.getBoundingClientRect();
      out.push({
        x: r.left + r.width / 2, y: r.top + sy + r.height / 2,
        amp: el.dataset.pulseAmp != null ? parseFloat(el.dataset.pulseAmp) : null,
        beat: el.hasAttribute('data-pulse-beat'),
      });
    });
    return out;
  }

  function nightRanges() {
    const sy = window.scrollY;
    return [...document.querySelectorAll('.night')].map((el) => {
      const host = el.parentElement && el.parentElement.classList.contains('pin-spacer') ? el.parentElement : el;
      const r = host.getBoundingClientRect();
      return [r.top + sy, r.bottom + sy];
    });
  }
  const isNight = (y) => { for (const [a, b] of nights) if (y >= a && y <= b) return true; return false; };

  function build() {
    resize();
    nights = nightRanges();
    const A0 = anchors();
    // segments longs : points intermédiaires pour garder un tracé droit et éviter les dépassements
    const A = [];
    A0.forEach((p, i) => {
      A.push(p);
      const q = A0[i + 1]; if (!q) return;
      const L = Math.hypot(q.x - p.x, q.y - p.y);
      if (L > 180) {
        const k = Math.min(0.45, 70 / L);
        const mk = (t) => ({ x: p.x + (q.x - p.x) * t, y: p.y + (q.y - p.y) * t, amp: null, beat: false, synth: true });
        A.push(mk(k), mk(1 - k));
      }
    });
    if (heroEl && heroEl.offsetParent) {
      const r = heroEl.getBoundingClientRect();
      const a0 = A[0];
      hero = { y: r.top + window.scrollY + r.height / 2, x1: a0 && a0.x > W / 2 && Math.abs(a0.y - (r.top + window.scrollY + r.height / 2)) < 40 ? a0.x : W };
    } else hero = null;
    if (A.length < 2) { N = 0; return; }
    const P = [], beats = [];
    for (let i = 0; i < A.length - 1; i++) {
      const p0 = A[i - 1] || A[i], p1 = A[i], p2 = A[i + 1], p3 = A[i + 2] || A[i + 1];
      const n = Math.max(2, Math.ceil(Math.hypot(p2.x - p1.x, p2.y - p1.y) / 2.2));
      if (p1.beat) beats.push(P.length);
      for (let k = 0; k < n; k++) {
        const t = k / n, q = centripetal(p0, p1, p2, p3, t);
        const a = p1.amp != null && p2.amp != null ? lerp(p1.amp, p2.amp, t) : (p1.amp != null && t < 0.5 ? lerp(p1.amp, -1, t * 2) : (p2.amp != null && t > 0.5 ? lerp(-1, p2.amp, (t - 0.5) * 2) : -1));
        P.push({ x: q.x, y: q.y, a });
      }
    }
    const last = A[A.length - 1]; P.push({ x: last.x, y: last.y, a: last.amp != null ? last.amp : -1 });
    if (last.beat) beats.push(P.length - 1);
    N = P.length;
    X = new Float32Array(N); Y = new Float32Array(N); L = new Float32Array(N); RM = new Float32Array(N);
    let s = 0;
    for (let i = 1; i < N; i++) { s += Math.hypot(P[i].x - P[i - 1].x, P[i].y - P[i - 1].y); L[i] = s; }
    total = s;
    const beatS = beats.map((i) => L[i]);
    // pages sans vague d'ouverture : ligne calme dès le départ (pas de gribouillis vertical)
    const agitK = hero ? 1 : 0.25;
    const ampTop = (mobile ? 3.5 : 12) * (hero ? 1 : 0.6), ampEnd = mobile ? 2.2 : 5;
    let rm = -Infinity;
    for (let i = 0; i < N; i++) {
      const a = P[Math.max(0, i - 1)], b = P[Math.min(N - 1, i + 1)];
      let tx = b.x - a.x, ty = b.y - a.y; const tl = Math.hypot(tx, ty) || 1; tx /= tl; ty /= tl;
      const nx = -ty, ny = tx;
      const t = L[i] / (total || 1), sp = L[i];
      const agit = (1 - smooth(0, 0.42, t)) * agitK;
      let amp = lerp(ampTop, ampEnd, smooth(0, 0.62, t));
      if (P[i].a >= 0) amp = Math.min(amp, P[i].a);
      const burst = 0.55 + 0.45 * Math.sin(sp / 70 + 1.1);
      let f = agit * burst * (0.6 * Math.sin(sp / 10.5) + 0.35 * Math.sin(sp / 4.9 + 1.3) + 0.2 * Math.sin(sp / 2.7 + 0.4))
        + (1 - agit) * 0.75 * Math.sin(sp / 30);
      let beatF = 0;
      for (const bs of beatS) { const u = (sp - bs) / 13; if (u > -4 && u < 4) beatF += qrs(u); }
      const bAmp = mobile ? 5 : 22;
      const dx = nx * (amp * f + bAmp * beatF), dy = ny * (amp * f + bAmp * beatF);
      X[i] = P[i].x + dx; Y[i] = P[i].y + dy;
      rm = Math.max(rm, Y[i]); RM[i] = rm;
    }
    shown = calm ? total : Math.min(shown, total);
  }

  function heroWave(sy, time) {
    if (!hero) return;
    const yv = hero.y - sy;
    if (yv < -160 || yv > H + 160) return;
    const x1 = hero.x1, reveal = x1 * heroReveal;
    const amp = (mobile ? 12 : 18) + energy * (mobile ? 18 : 34);
    const period = lerp(1.05, 0.62, energy);
    const ph = calm ? 0.35 : (time / period) % 1;
    const travel = -60 + ph * (x1 + 120);
    ctx.beginPath();
    for (let x = 0; x <= reveal; x += 3) {
      const env = 1 - smooth(x1 - 180, x1, x);
      const t = calm ? 0 : time;
      let f = (1 - energy) * 0.35 * Math.sin(x / 46 - t * 1.4)
        + energy * (0.55 * Math.sin(x / 13 - t * 7.5) + 0.35 * Math.sin(x / 6.3 + t * 5.1) + 0.2 * Math.sin(x / 3.1 - t * 11));
      f += qrs((x - travel) / (mobile ? 9 : 12)) * (0.9 + energy * 0.6);
      const y = yv + amp * f * env;
      x ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
    }
    ctx.strokeStyle = INK; ctx.lineWidth = mobile ? 1.4 : 1.7; ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.stroke();
  }

  function draw(time) {
    const sy = window.scrollY;
    ctx.clearRect(0, 0, W, H);
    heroWave(sy, time);
    if (!N) return;
    const maxS = Math.max(0, document.documentElement.scrollHeight - H);
    const near = maxS > 0 ? clamp((sy - (maxS - H * 0.7)) / (H * 0.7), 0, 1) : 1;
    const ty = sy + H * (0.64 + 0.36 * near);
    const idx = upper(RM, N, ty) - 1;
    const tLen = idx >= 0 ? L[idx] : 0;
    if (calm) shown = total; else shown += (tLen - shown) * 0.12;
    const end = Math.min(N - 1, lower(L, N, shown));
    const start = Math.max(0, lower(RM, N, sy - 80) - 1);
    if (end <= start) return;
    // tracé principal : encre sur le papier, craie sur les sections de nuit
    ctx.lineWidth = mobile ? 1.3 : 1.6; ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.globalAlpha = 0.92;
    let night = isNight(Y[start]);
    ctx.beginPath(); ctx.moveTo(X[start], Y[start] - sy);
    for (let i = start + 1; i <= end; i++) {
      const n = nights.length ? isNight(Y[i]) : false;
      ctx.lineTo(X[i], Y[i] - sy);
      if (n !== night) { ctx.strokeStyle = night ? PAPER : INK; ctx.stroke(); ctx.beginPath(); ctx.moveTo(X[i], Y[i] - sy); night = n; }
    }
    ctx.strokeStyle = night ? PAPER : INK; ctx.stroke(); ctx.globalAlpha = 1;
    if (calm) return;
    // traîne corail
    const tail = Math.max(start, lower(L, N, shown - 120));
    ctx.beginPath(); ctx.moveTo(X[tail], Y[tail] - sy);
    for (let i = tail + 1; i <= end; i++) ctx.lineTo(X[i], Y[i] - sy);
    ctx.strokeStyle = CORAL; ctx.lineWidth = mobile ? 1.8 : 2.2; ctx.stroke();
    // point qui bat
    const tx = X[end], tyv = Y[end] - sy;
    if (tyv > -20 && tyv < H + 20) {
      const prog = shown / (total || 1);
      const period = 60 / lerp(84, 56, prog);
      const ph = (time % period) / period;
      const kick = ph < 0.14 ? Math.sin((ph / 0.14) * Math.PI) : 0;
      ctx.fillStyle = CORAL; ctx.beginPath(); ctx.arc(tx, tyv, 4 + kick * 2.2, 0, 7); ctx.fill();
      ctx.strokeStyle = CORAL; ctx.globalAlpha = 0.4 * (1 - ph); ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.arc(tx, tyv, 5 + ph * 18, 0, 7); ctx.stroke(); ctx.globalAlpha = 1;
    }
  }

  let raf = 0, running = false;
  function loop(t) {
    energy += (target - energy) * 0.07;
    target = Math.max(0.1, target * 0.965);
    if (!fine) target = Math.max(target, clamp(Math.abs(getVelocity()) / 45, 0.1, 1));
    draw(t / 1000);
    raf = requestAnimationFrame(loop);
  }
  function start() { if (running) return; running = true; raf = requestAnimationFrame(loop); }

  window.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse') return;
    const now = performance.now();
    if (lastX != null) {
      const dt = Math.max(8, now - lastT);
      const v = Math.hypot(e.clientX - lastX, e.clientY - lastY) / dt * 1000;
      target = clamp(Math.max(target, v / 1700), 0.1, 1);
    }
    lastX = e.clientX; lastY = e.clientY; lastT = now;
  }, { passive: true });

  let rt = 0;
  const rebuild = () => { clearTimeout(rt); rt = setTimeout(() => { build(); if (calm) draw(0); }, 120); };
  window.addEventListener('resize', rebuild);
  window.addEventListener('pulse:rebuild', rebuild);
  window.addEventListener('load', rebuild);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(rebuild);
  if ('ResizeObserver' in window) { let lastH = 0; new ResizeObserver(() => { const h = document.documentElement.scrollHeight; if (Math.abs(h - lastH) > 4) { lastH = h; rebuild(); } }).observe(document.body); }

  build();
  if (calm) { draw(0); window.addEventListener('scroll', () => draw(0), { passive: true }); }
  else start();

  return {
    rebuild: () => { build(); if (calm) draw(0); },
    revealHero(gsap, duration = 1.4, delay = 0) {
      if (calm || !gsap) { heroReveal = 1; return; }
      const o = { v: 0 }; heroReveal = 0;
      gsap.to(o, { v: 1, duration, delay, ease: 'power2.inOut', onUpdate: () => { heroReveal = o.v; } });
    },
    kick(v = 1) { target = clamp(v, 0.1, 1); },
    get energy() { return energy; },
  };
}
