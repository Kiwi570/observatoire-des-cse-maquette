/* Images réelles (manifeste data.js) et visuels provisoires dessinés en code. */
import { IMAGES, IMG_PATH } from './data.js';

const C = { paper: '#F3EEE4', deep: '#E7DFCF', ink: '#13203A', soft: '#46506A', coral: '#FF6A4D', night: '#0D1629', warm: '#FFDDB0' };

function rng(seed) {
  let s = 7;
  for (const ch of seed) s = (s * 31 + ch.charCodeAt(0)) | 0;
  return () => { s = (s * 1664525 + 1013904223) | 0; return ((s >>> 0) % 100000) / 100000; };
}
function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(x, y, w, h, r);
  else { ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }
}
let noise = null;
function grain(ctx, w, h, a = 0.08) {
  if (!noise) {
    noise = document.createElement('canvas'); noise.width = noise.height = 128;
    const x = noise.getContext('2d'), d = x.createImageData(128, 128);
    for (let i = 0; i < d.data.length; i += 4) { const v = Math.random() * 255; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 255; }
    x.putImageData(d, 0, 0);
  }
  ctx.save(); ctx.globalAlpha = a; ctx.globalCompositeOperation = 'overlay'; ctx.fillStyle = ctx.createPattern(noise, 'repeat'); ctx.fillRect(0, 0, w, h); ctx.restore();
}
function vignette(ctx, w, h, a = 0.35) {
  const g = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.35, w / 2, h / 2, Math.max(w, h) * 0.75);
  g.addColorStop(0, 'rgba(13,22,41,0)'); g.addColorStop(1, `rgba(13,22,41,${a})`);
  ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
}
const blur = (ctx, px) => { if ('filter' in ctx) ctx.filter = px ? `blur(${px}px)` : 'none'; };

const painters = {
  room(ctx, w, h, r) {
    let g = ctx.createLinearGradient(0, 0, w, h); g.addColorStop(0, '#EFE6D6'); g.addColorStop(1, '#D8CBB6');
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    g = ctx.createRadialGradient(w * 0.85, h * 0.08, 0, w * 0.85, h * 0.08, w * 0.95);
    g.addColorStop(0, 'rgba(255,221,176,.95)'); g.addColorStop(1, 'rgba(255,221,176,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    ctx.save(); blur(ctx, w * 0.004); ctx.translate(w * 0.25, -h * 0.1); ctx.rotate(-0.55);
    for (let i = 0; i < 22; i++) { ctx.fillStyle = 'rgba(255,238,210,.38)'; ctx.fillRect(-w, i * h * 0.062, w * 3, h * 0.022); }
    ctx.restore(); blur(ctx, 0);
    const ty = h * (0.6 + r() * 0.06);
    g = ctx.createLinearGradient(0, ty, 0, h); g.addColorStop(0, '#CFB28C'); g.addColorStop(1, '#B4906A'); ctx.fillStyle = g;
    ctx.beginPath(); ctx.moveTo(0, ty + h * 0.05); ctx.lineTo(w, ty - h * 0.03); ctx.lineTo(w, h); ctx.lineTo(0, h); ctx.fill();
    ctx.fillStyle = C.ink; rr(ctx, w * 0.6, ty - h * 0.22, w * 0.15, h * 0.24, w * 0.03); ctx.fill();
    ctx.globalAlpha = 0.85; rr(ctx, w * 0.8, ty - h * 0.24, w * 0.13, h * 0.22, w * 0.03); ctx.fill(); ctx.globalAlpha = 1;
    ctx.save(); ctx.translate(w * 0.32, ty + h * 0.14); ctx.rotate(-0.1);
    ctx.fillStyle = '#F7F2E8'; ctx.fillRect(-w * 0.13, -h * 0.045, w * 0.26, h * 0.09);
    ctx.strokeStyle = 'rgba(19,32,58,.25)'; ctx.lineWidth = 1; for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.moveTo(-w * 0.1, -h * 0.02 + i * h * 0.014); ctx.lineTo(w * 0.1, -h * 0.02 + i * h * 0.014); ctx.stroke(); }
    ctx.fillStyle = C.coral; ctx.fillRect(w * 0.15, -h * 0.04, w * 0.15, h * 0.08); ctx.restore();
    ctx.fillStyle = '#F7F2E8'; ctx.beginPath(); ctx.ellipse(w * 0.13, ty + h * 0.1, w * 0.04, h * 0.02, 0, 0, 7); ctx.fill();
    vignette(ctx, w, h, 0.28);
  },
  paper(ctx, w, h, r) {
    ctx.fillStyle = '#E9E1D2'; ctx.fillRect(0, 0, w, h);
    const sheets = 3;
    for (let i = 0; i < sheets; i++) {
      ctx.save(); ctx.translate(w * (0.42 + i * 0.08), h * (0.46 + i * 0.05)); ctx.rotate((r() - 0.5) * 0.4);
      ctx.shadowColor = 'rgba(13,22,41,.18)'; ctx.shadowBlur = w * 0.04; ctx.shadowOffsetY = w * 0.01;
      ctx.fillStyle = '#FBF8F2'; ctx.fillRect(-w * 0.3, -h * 0.3, w * 0.6, h * 0.6); ctx.shadowColor = 'transparent';
      if (i === sheets - 1) {
        const bw = w * 0.05;
        for (let k = 0; k < 7; k++) { const bh = h * (0.08 + r() * 0.22); ctx.fillStyle = k % 3 === 1 ? C.coral : C.ink; ctx.fillRect(-w * 0.22 + k * bw * 1.35, h * 0.16 - bh, bw, bh); }
        ctx.strokeStyle = C.ink; ctx.lineWidth = Math.max(1, w * 0.004); ctx.beginPath();
        for (let k = 0; k <= 20; k++) { const x = -w * 0.24 + k * w * 0.024, y = -h * 0.18 + Math.sin(k * 0.5 + r()) * h * 0.04; k ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
        ctx.stroke();
        ctx.fillStyle = 'rgba(19,32,58,.25)'; for (let k = 0; k < 3; k++) ctx.fillRect(-w * 0.24, h * 0.2 + k * h * 0.025, w * (0.3 + r() * 0.15), h * 0.008);
      }
      ctx.restore();
    }
    ctx.save(); ctx.translate(w * 0.18, h * 0.82); ctx.rotate(-0.7); ctx.fillStyle = '#C9A06E'; ctx.fillRect(0, 0, w * 0.3, h * 0.014); ctx.fillStyle = C.ink; ctx.fillRect(w * 0.3, 0, w * 0.03, h * 0.014); ctx.restore();
    vignette(ctx, w, h, 0.18);
  },
  crowd(ctx, w, h, r) {
    let g = ctx.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#1C2A48'); g.addColorStop(0.55, '#3A3F52'); g.addColorStop(1, '#0D1629');
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    g = ctx.createRadialGradient(w * 0.5, h * 0.42, 0, w * 0.5, h * 0.42, w * 0.6); g.addColorStop(0, 'rgba(255,230,195,.85)'); g.addColorStop(1, 'rgba(255,230,195,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    blur(ctx, w * 0.012);
    for (let i = 0; i < 9; i++) {
      const x = w * (0.12 + r() * 0.76), y = h * (0.5 + r() * 0.12), s = h * (0.24 + r() * 0.12);
      ctx.fillStyle = `rgba(13,22,41,${0.6 + r() * 0.35})`; rr(ctx, x - s * 0.12, y - s * 0.5, s * 0.24, s, s * 0.12); ctx.fill();
      ctx.beginPath(); ctx.arc(x, y - s * 0.62, s * 0.09, 0, 7); ctx.fill();
    }
    for (let i = 0; i < 26; i++) { ctx.fillStyle = `rgba(255,${180 + r() * 60},${120 + r() * 60},${0.15 + r() * 0.3})`; ctx.fillRect(r() * w, h * (0.55 + r() * 0.4), w * (0.08 + r() * 0.2), h * 0.008); }
    blur(ctx, 0); vignette(ctx, w, h, 0.5);
  },
  arcs(ctx, w, h, r) {
    let g = ctx.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#3B4E78'); g.addColorStop(1, '#0D1629'); ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    blur(ctx, w * 0.006);
    for (let i = 0; i < 14; i++) { ctx.strokeStyle = `rgba(243,238,228,${0.12 + i * 0.03})`; ctx.lineWidth = h * 0.018; ctx.beginPath(); ctx.ellipse(w * 0.5, h * 1.3, w * (0.4 + i * 0.07), h * (0.5 + i * 0.07), 0, Math.PI * 1.05, Math.PI * 1.95); ctx.stroke(); }
    for (let i = 0; i < 12; i++) { ctx.fillStyle = `rgba(255,221,176,${0.25 + r() * 0.4})`; ctx.beginPath(); ctx.arc(r() * w, h * (0.1 + r() * 0.25), w * (0.01 + r() * 0.02), 0, 7); ctx.fill(); }
    blur(ctx, 0); vignette(ctx, w, h, 0.4);
  },
  notes(ctx, w, h, r) {
    ctx.fillStyle = '#ECE5D8'; ctx.fillRect(0, 0, w, h);
    ctx.shadowColor = 'rgba(13,22,41,.15)'; ctx.shadowBlur = w * 0.03; ctx.fillStyle = '#FBF8F2'; ctx.fillRect(w * 0.28, h * 0.2, w * 0.44, h * 0.6); ctx.shadowColor = 'transparent';
    const cols = [C.coral, '#F7E7B5', '#BFD6E6'];
    for (let i = 0; i < 12; i++) { ctx.save(); ctx.translate(w * (0.1 + r() * 0.8), h * (0.1 + r() * 0.8)); ctx.rotate((r() - 0.5) * 0.6); ctx.fillStyle = cols[i % 3]; const s = w * 0.07; ctx.fillRect(-s / 2, -s / 2, s, s); ctx.restore(); }
    ctx.fillStyle = C.ink; ctx.beginPath(); ctx.arc(w * 0.15, h * 0.22, w * 0.05, 0, 7); ctx.fill(); ctx.fillStyle = '#6B4A2E'; ctx.beginPath(); ctx.arc(w * 0.15, h * 0.22, w * 0.03, 0, 7); ctx.fill();
    vignette(ctx, w, h, 0.15);
  },
  window(ctx, w, h, r) {
    let g = ctx.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#F6E2CF'); g.addColorStop(0.55, '#F7B9A0'); g.addColorStop(1, '#E59A82'); ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#9A6E62';
    ctx.beginPath(); ctx.moveTo(0, h * 0.72); for (let x = 0; x <= w; x += w / 18) ctx.lineTo(x, h * (0.66 + r() * 0.06)); ctx.lineTo(w, h); ctx.lineTo(0, h); ctx.fill();
    ctx.fillStyle = C.ink; ctx.fillRect(0, h * 0.82, w, h * 0.18); ctx.fillRect(w * 0.62, 0, w * 0.03, h * 0.82);
    ctx.fillStyle = '#F7F2E8'; ctx.save(); ctx.translate(w * 0.32, h * 0.88); ctx.rotate(-0.06); ctx.fillRect(-w * 0.12, -h * 0.03, w * 0.24, h * 0.06); ctx.restore();
    vignette(ctx, w, h, 0.25);
  },
  portrait(ctx, w, h) {
    ctx.fillStyle = C.deep; ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = C.soft; ctx.setLineDash([w * 0.02, w * 0.02]); ctx.lineWidth = Math.max(1.5, w * 0.008);
    ctx.beginPath(); ctx.arc(w * 0.5, h * 0.38, w * 0.17, 0, 7); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(w * 0.16, h * 0.95); ctx.bezierCurveTo(w * 0.2, h * 0.62, w * 0.8, h * 0.62, w * 0.84, h * 0.95); ctx.stroke(); ctx.setLineDash([]);
  },
};

export function paintPlaceholder(el, kind, name, label) {
  const wrap = document.createElement('div'); wrap.className = 'ph'; wrap.setAttribute('aria-hidden', 'true');
  const cv = document.createElement('canvas');
  const rect = el.getBoundingClientRect();
  const ar = rect.width > 0 && rect.height > 0 ? rect.width / rect.height : 0.8;
  const W = 720, H = Math.round(W / Math.min(Math.max(ar, 0.4), 2.6));
  cv.width = W; cv.height = H;
  const ctx = cv.getContext('2d');
  (painters[kind] || painters.room)(ctx, W, H, rng(name || kind));
  grain(ctx, W, H);
  wrap.appendChild(cv);
  el.appendChild(wrap);
  const tag = document.createElement('span'); tag.className = 'ph-tag';
  tag.innerHTML = label ? `<b>${label}</b>` : `<b>Visuel provisoire</b> ${name || ''}`;
  el.appendChild(tag);
}

function srcset(name, info) { return info.w.map((w) => `${IMG_PATH}${name}-${w}.webp ${w}w`).join(', '); }

export function imageFor(name) {
  const info = IMAGES[name];
  if (!info) return null;
  return { src: `${IMG_PATH}${name}-${info.w[info.w.length - 1]}.webp`, srcset: srcset(name, info), alt: info.alt, w: info.w[info.w.length - 1], r: info.r };
}

export function fillMedia(root = document) {
  root.querySelectorAll('[data-img]').forEach((el) => {
    if (el.dataset.filled) return;
    el.dataset.filled = '1';
    const name = el.dataset.img, m = el.dataset.imgM;
    const info = IMAGES[name];
    if (!info) { paintPlaceholder(el, el.dataset.ph || 'room', name, el.dataset.phLabel); return; }
    const deco = el.closest('[aria-hidden="true"]') || el.classList.contains('slide');
    const pic = document.createElement('picture');
    if (m && IMAGES[m]) {
      const s = document.createElement('source'); s.media = '(max-width: 759px)'; s.srcset = srcset(m, IMAGES[m]); s.sizes = '100vw'; pic.appendChild(s);
    }
    const img = document.createElement('img');
    img.srcset = srcset(name, info);
    img.src = `${IMG_PATH}${name}-${info.w[Math.min(1, info.w.length - 1)]}.webp`;
    img.sizes = el.dataset.sizes || '(max-width: 899px) 100vw, 50vw';
    img.alt = deco ? '' : info.alt;
    img.decoding = 'async';
    if (!el.closest('.hero, .phero')) img.loading = 'lazy';
    img.width = info.w[info.w.length - 1]; img.height = Math.round(img.width / info.r);
    pic.appendChild(img);
    el.appendChild(pic);
  });
}
