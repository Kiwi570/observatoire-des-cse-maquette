/* L'anonymiseur : un profil fictif se dissout en points qui rejoignent des milliers d'autres. */
export function initAnon(section, { calm = false, mobile = false } = {}) {
  const cv = section.querySelector('.anon__canvas');
  const card = section.querySelector('[data-profile]');
  if (!cv || !card) return { setProgress() {} };
  const ctx = cv.getContext('2d');
  let W = 0, H = 0, dpr = 1, field = [], parts = [], progress = calm ? 1 : 0, visible = false, raf = 0;
  const COUNT = mobile ? 900 : 2200;
  const cols = ['rgba(243,238,228,', 'rgba(255,181,120,', 'rgba(255,106,77,'];

  function sampleCard() {
    const sr = section.getBoundingClientRect(), r = card.getBoundingClientRect();
    const off = document.createElement('canvas'); const sc = 0.5;
    off.width = Math.max(1, Math.round(r.width * sc)); off.height = Math.max(1, Math.round(r.height * sc));
    const o = off.getContext('2d');
    o.scale(sc, sc);
    o.fillStyle = '#fff';
    const cs = getComputedStyle(card);
    const pad = parseFloat(cs.paddingLeft) || 18;
    let y = parseFloat(cs.paddingTop) || 16;
    [...card.children].forEach((ch) => {
      const s = getComputedStyle(ch);
      o.font = `${s.fontWeight} ${s.fontSize} ${s.fontFamily}`;
      o.textBaseline = 'top';
      const lh = parseFloat(s.lineHeight) || parseFloat(s.fontSize) * 1.3;
      o.fillText(ch.textContent.trim(), pad, y);
      y += lh + 8;
    });
    const d = o.getImageData(0, 0, off.width, off.height).data, pts = [];
    const step = mobile ? 3 : 2;
    for (let yy = 0; yy < off.height; yy += step) for (let xx = 0; xx < off.width; xx += step) {
      if (d[(yy * off.width + xx) * 4 + 3] > 120) pts.push([r.left - sr.left + xx / sc, r.top - sr.top + yy / sc]);
    }
    // contour de la carte
    for (let i = 0; i < 160; i++) {
      const t = i / 160, per = 2 * (r.width + r.height), p = t * per;
      let x, yv;
      if (p < r.width) { x = p; yv = 0; } else if (p < r.width + r.height) { x = r.width; yv = p - r.width; } else if (p < 2 * r.width + r.height) { x = r.width - (p - r.width - r.height); yv = r.height; } else { x = 0; yv = r.height - (p - 2 * r.width - r.height); }
      pts.push([r.left - sr.left + x, r.top - sr.top + yv]);
    }
    return pts;
  }

  function setup() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = section.clientWidth; H = section.clientHeight;
    cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    let s = 12345; const rnd = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
    field = Array.from({ length: COUNT }, () => ({ x: rnd() * W, y: rnd() * H, s: 0.6 + rnd() * 1.5, p: rnd() * 6.28, c: rnd() < 0.82 ? 0 : rnd() < 0.7 ? 1 : 2, a: 0.25 + rnd() * 0.5 }));
    const src = sampleCard();
    parts = src.map(([x, y], i) => { const f = field[(i * 7) % field.length]; return { sx: x, sy: y, tx: f.x, ty: f.y, d: rnd() * 0.35, p: rnd() * 6.28 }; });
  }

  const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  function draw(time) {
    ctx.clearRect(0, 0, W, H);
    const t = calm ? 0 : time;
    for (let k = 0; k < 3; k++) {
      ctx.fillStyle = cols[k] + '1)';
      for (const f of field) {
        if (f.c !== k) continue;
        ctx.globalAlpha = f.a * (0.75 + 0.25 * Math.sin(t * 0.8 + f.p));
        const x = f.x + Math.sin(t * 0.25 + f.p) * 6, y = f.y + Math.cos(t * 0.21 + f.p) * 6;
        ctx.fillRect(x, y, f.s, f.s);
      }
    }
    ctx.globalAlpha = 1;
    if (calm) return;
    const pg = Math.min(1, Math.max(0, (progress - 0.18) / 0.5));
    card.style.opacity = pg > 0 ? '0' : '1';
    if (pg > 0 && pg < 1.0001) {
      ctx.fillStyle = cols[0] + '1)';
      for (const q of parts) {
        const e = ease(Math.min(1, Math.max(0, (pg - q.d) / (1 - 0.35))));
        const x = q.sx + (q.tx - q.sx) * e + Math.sin(t * 0.25 + q.p) * 6 * e;
        const y = q.sy + (q.ty - q.sy) * e + Math.sin(e * Math.PI) * -40;
        ctx.globalAlpha = 0.95 - e * 0.45;
        ctx.fillRect(x, y, 1.6, 1.6);
      }
      ctx.globalAlpha = 1;
    }
  }
  function loop(now) { cancelAnimationFrame(raf); if (!visible) return; draw(now / 1000); raf = requestAnimationFrame(loop); }

  const reset = () => { setup(); draw(0); };
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(reset); else reset();
  window.addEventListener('resize', () => { clearTimeout(reset._t); reset._t = setTimeout(reset, 200); });
  if ('IntersectionObserver' in window) new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible && !calm) loop(performance.now()); }).observe(section);
  if (calm) { card.style.opacity = '1'; }

  return {
    setProgress(p) { progress = p; if (calm) draw(0); },
    resample: reset,
  };
}
