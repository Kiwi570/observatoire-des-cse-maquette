/* L'anonymiseur : la fiche d'un profil fictif se défait en petits carrés,
   qui s'envolent et deviennent des points parmi des milliers d'autres. */
export function initAnon(section, { calm = false, mobile = false } = {}) {
  const cv = section.querySelector('.anon__canvas');
  const card = section.querySelector('[data-profile]');
  if (!cv || !card) return { setProgress() {}, resample() {} };
  const ctx = cv.getContext('2d');
  let W = 0, H = 0, dpr = 1, field = [], tiles = [], step = 5, progress = calm ? 1 : 0, visible = false, raf = 0;
  const COUNT = mobile ? 900 : 2000;
  const FIELD = [[243, 238, 228], [255, 181, 120], [255, 106, 77]];

  // dessine la fiche telle qu'elle apparaît, pour la découper en carrés de la même couleur
  function snapshot() {
    const r = card.getBoundingClientRect();
    const w = Math.max(1, Math.round(r.width)), h = Math.max(1, Math.round(r.height));
    const off = document.createElement('canvas'); off.width = w; off.height = h;
    const o = off.getContext('2d');
    const cs = getComputedStyle(card);
    const rad = parseFloat(cs.borderTopLeftRadius) || 16;
    o.fillStyle = cs.backgroundColor || '#F3EEE4';
    o.beginPath();
    if (o.roundRect) o.roundRect(0, 0, w, h, rad); else o.rect(0, 0, w, h);
    o.fill();
    o.textBaseline = 'top';
    [...card.children].forEach((ch) => {
      const s = getComputedStyle(ch), cr = ch.getBoundingClientRect();
      o.font = `${s.fontStyle} ${s.fontWeight} ${s.fontSize} ${s.fontFamily}`;
      o.fillStyle = s.color;
      if ('letterSpacing' in o) o.letterSpacing = s.letterSpacing === 'normal' ? '0px' : s.letterSpacing;
      const txt = s.textTransform === 'uppercase' ? ch.textContent.trim().toUpperCase() : ch.textContent.trim();
      const lh = parseFloat(s.lineHeight) || parseFloat(s.fontSize) * 1.3;
      const top = cr.top - r.top + (lh - parseFloat(s.fontSize)) / 2;
      // retour à la ligne simple, comme dans la fiche
      const maxW = cr.width + 1; let line = '', y = top;
      for (const word of txt.split(' ')) {
        const test = line ? `${line} ${word}` : word;
        if (o.measureText(test).width > maxW && line) { o.fillText(line, cr.left - r.left, y); line = word; y += lh; } else line = test;
      }
      if (line) o.fillText(line, cr.left - r.left, y);
    });
    return { off, o, w, h, x: r.left - section.getBoundingClientRect().left, y: r.top - section.getBoundingClientRect().top };
  }

  function setup() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = section.clientWidth; H = section.clientHeight;
    cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    let seed = 12345; const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    field = Array.from({ length: COUNT }, () => ({ x: rnd() * W, y: rnd() * H, s: 0.7 + rnd() * 1.5, p: rnd() * 6.28, c: rnd() < 0.82 ? 0 : rnd() < 0.7 ? 1 : 2, a: 0.25 + rnd() * 0.5 }));
    step = mobile ? 6 : 5;
    const snap = snapshot();
    const data = snap.o.getImageData(0, 0, snap.w, snap.h).data;
    tiles = [];
    for (let yy = 0; yy < snap.h; yy += step) {
      for (let xx = 0; xx < snap.w; xx += step) {
        const px = Math.min(snap.w - 1, xx + (step >> 1)), py = Math.min(snap.h - 1, yy + (step >> 1));
        const k = (py * snap.w + px) * 4;
        if (data[k + 3] < 40) continue;
        const f = field[Math.floor(rnd() * field.length)];
        tiles.push({
          sx: snap.x + xx, sy: snap.y + yy, r: data[k], g: data[k + 1], b: data[k + 2],
          tx: f.x, ty: f.y, d: (xx / snap.w) * 0.42 + rnd() * 0.14, p: rnd() * 6.28, lift: 20 + rnd() * 70,
        });
      }
    }
  }

  const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const clamp01 = (v) => Math.max(0, Math.min(1, v));
  function draw(time) {
    ctx.clearRect(0, 0, W, H);
    const t = calm ? 0 : time;
    for (const f of field) {
      const c = FIELD[f.c];
      ctx.fillStyle = `rgba(${c[0]},${c[1]},${c[2]},${(f.a * (0.75 + 0.25 * Math.sin(t * 0.8 + f.p))).toFixed(3)})`;
      ctx.fillRect(f.x + Math.sin(t * 0.25 + f.p) * 6, f.y + Math.cos(t * 0.21 + f.p) * 6, f.s, f.s);
    }
    if (calm) { card.style.opacity = '1'; return; }
    const pg = clamp01((progress - 0.12) / 0.6);
    if (pg <= 0) { card.style.opacity = '1'; return; }
    card.style.opacity = '0';
    for (const q of tiles) {
      const e = ease(clamp01((pg - q.d) / 0.44));
      const x = q.sx + (q.tx - q.sx) * e + Math.sin(t * 0.25 + q.p) * 6 * e;
      const y = q.sy + (q.ty - q.sy) * e - Math.sin(e * Math.PI) * q.lift;
      const size = step + (1.6 - step) * e;
      const r = q.r + (243 - q.r) * e, g = q.g + (238 - q.g) * e, b = q.b + (228 - q.b) * e;
      ctx.fillStyle = `rgba(${r | 0},${g | 0},${b | 0},${(1 - 0.45 * e).toFixed(3)})`;
      ctx.fillRect(x, y, e < 0.02 ? step + 0.5 : size, e < 0.02 ? step + 0.5 : size);
    }
  }
  function loop(now) { cancelAnimationFrame(raf); if (!visible) return; draw(now / 1000); raf = requestAnimationFrame(loop); }

  const reset = () => { setup(); draw(0); };
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(reset); else reset();
  window.addEventListener('resize', () => { clearTimeout(reset._t); reset._t = setTimeout(reset, 200); });
  if ('IntersectionObserver' in window) new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible && !calm) loop(performance.now()); }).observe(section);

  return {
    setProgress(p) { progress = p; if (calm) draw(0); },
    resample: () => { const o = card.style.opacity; card.style.opacity = '1'; reset(); card.style.opacity = o; },
  };
}
