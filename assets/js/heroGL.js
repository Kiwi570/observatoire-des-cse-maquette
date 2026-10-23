/* Lentille du héros en WebGL (OGL) : la photo ondule doucement à chaque battement et au survol.
   Sans photo, une scène de lumière du matin est générée. Repli : la photo seule. */
import { Renderer } from '../vendor/ogl/core/Renderer.js';
import { Program } from '../vendor/ogl/core/Program.js';
import { Mesh } from '../vendor/ogl/core/Mesh.js';
import { Texture } from '../vendor/ogl/core/Texture.js';
import { Triangle } from '../vendor/ogl/extras/Triangle.js';

const vertex = /* glsl */`
attribute vec2 uv; attribute vec2 position; varying vec2 vUv;
void main() { vUv = uv; gl_Position = vec4(position, 0.0, 1.0); }`;

const fragment = /* glsl */`
precision highp float;
uniform float uTime, uBeat, uMouseAmt, uHasTex, uReveal, uLineY;
uniform vec2 uRes, uMouse, uTexRes;
uniform sampler2D uTex;
varying vec2 vUv;
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
vec3 scene(vec2 uv) {
  vec3 col = mix(vec3(0.85, 0.80, 0.72), vec3(0.95, 0.92, 0.87), uv.y);
  float glow = smoothstep(1.0, 0.0, distance(uv, vec2(0.85, 0.95)));
  col = mix(col, vec3(1.0, 0.87, 0.70), glow * 0.6);
  float k = uv.x * 0.9 + uv.y * 0.55;
  float s = fract(k * 11.0 - uTime * 0.012);
  float stripes = smoothstep(0.30, 0.42, s) * smoothstep(0.80, 0.62, s);
  col += vec3(1.0, 0.9, 0.75) * stripes * smoothstep(0.1, 0.9, uv.x + uv.y * 0.4) * 0.22;
  float table = smoothstep(0.355, 0.345, uv.y - uv.x * 0.04);
  col = mix(col, mix(vec3(0.74, 0.60, 0.45), vec3(0.84, 0.72, 0.57), uv.x) + stripes * 0.08, table);
  vec2 c1 = abs(uv - vec2(0.66, 0.45)) - vec2(0.075, 0.12);
  float chair = step(max(c1.x, c1.y), 0.0) * step(0.34, uv.y);
  col = mix(col, vec3(0.075, 0.125, 0.227), chair);
  vec2 n1 = abs(uv - vec2(0.32, 0.22)) - vec2(0.11, 0.035);
  col = mix(col, vec3(0.97, 0.95, 0.91), step(max(n1.x, n1.y), 0.0));
  vec2 f1 = abs(uv - vec2(0.52, 0.215)) - vec2(0.065, 0.032);
  col = mix(col, vec3(1.0, 0.416, 0.302), step(max(f1.x, f1.y), 0.0));
  return col;
}
void main() {
  vec2 uv = vUv;
  float dl = abs(uv.y - uLineY);
  vec2 off = vec2(0.0);
  off.y += sin(uv.x * 16.0 - uTime * 2.2) * 0.006 * uBeat * exp(-dl * 7.0);
  off.x += sin(uv.y * 22.0 + uTime * 1.3) * 0.0025 * uBeat;
  vec2 dm = uv - uMouse; float d = length(dm);
  off += (d > 0.0001 ? dm / d : vec2(0.0)) * sin(d * 40.0 - uTime * 6.0) * 0.007 * uMouseAmt * exp(-d * 5.0);
  vec2 p = uv + off;
  vec3 col;
  if (uHasTex > 0.5) {
    vec2 r = vec2(min((uRes.x / uRes.y) / (uTexRes.x / uTexRes.y), 1.0), min((uRes.y / uRes.x) / (uTexRes.y / uTexRes.x), 1.0));
    vec2 tuv = vec2(p.x * r.x + (1.0 - r.x) * 0.5, p.y * r.y + (1.0 - r.y) * 0.5);
    col = texture2D(uTex, tuv).rgb;
    col = mix(col, col * vec3(1.03, 1.0, 0.95), 0.5);
  } else {
    col = scene(p);
  }
  col += (hash(uv * uRes + uTime) - 0.5) * 0.035;
  float mask = smoothstep(uReveal * 0.75, uReveal * 0.75 - 0.03, dl);
  col = mix(vec3(0.953, 0.933, 0.894), col, mask);
  gl_FragColor = vec4(col, 1.0);
}`;

export function initHeroGL(el, { calm = false, imgEl = null, lineEl = null } = {}) {
  let renderer;
  try {
    if (/[?&]nowebgl=1/.test(location.search)) return null;
    // pas de WebGL : repli sans erreur console d'OGL
    const essai = document.createElement('canvas'); if (!(essai.getContext('webgl') || essai.getContext('experimental-webgl'))) return null;
    renderer = new Renderer({ dpr: Math.min(window.devicePixelRatio || 1, 1.5), alpha: false, antialias: false, powerPreference: 'low-power' });
    if (!renderer.gl) return null;
  } catch (e) { return null; }
  const gl = renderer.gl;
  gl.clearColor(0.953, 0.933, 0.894, 1);
  gl.canvas.setAttribute('aria-hidden', 'true');
  gl.canvas.style.position = 'absolute'; gl.canvas.style.inset = '0'; gl.canvas.style.width = '100%'; gl.canvas.style.height = '100%';
  const texture = new Texture(gl, { generateMipmaps: false, minFilter: gl.LINEAR });
  const program = new Program(gl, {
    vertex, fragment,
    uniforms: {
      uTime: { value: 0 }, uBeat: { value: 0 }, uMouseAmt: { value: 0 }, uHasTex: { value: 0 }, uReveal: { value: calm ? 1.4 : 0 },
      uLineY: { value: 0.4 }, uRes: { value: [1, 1] }, uMouse: { value: [0.5, 0.5] }, uTexRes: { value: [1, 1] }, uTex: { value: texture },
    },
  });
  const mesh = new Mesh(gl, { geometry: new Triangle(gl), program });
  el.appendChild(gl.canvas);
  if (imgEl) {
    // même image que la balise <img> déjà chargée : aucun second téléchargement
    const use = () => { if (!imgEl.naturalWidth) return; texture.image = imgEl; program.uniforms.uTexRes.value = [imgEl.naturalWidth, imgEl.naturalHeight]; program.uniforms.uHasTex.value = 1; if (calm) setTimeout(() => render(0), 0); el.classList.add('gl-ready'); };
    if (imgEl.complete && imgEl.naturalWidth) use(); else imgEl.addEventListener('load', use, { once: true });
  }
  const resize = () => {
    const r = el.getBoundingClientRect();
    renderer.setSize(Math.max(1, r.width), Math.max(1, r.height));
    program.uniforms.uRes.value = [r.width, r.height];
    if (lineEl) { const l = lineEl.getBoundingClientRect(); program.uniforms.uLineY.value = Math.min(1, Math.max(0, 1 - ((l.top + l.height / 2) - r.top) / r.height)); }
  };
  resize();
  if ('ResizeObserver' in window) new ResizeObserver(resize).observe(el); else window.addEventListener('resize', resize);
  window.addEventListener('resize', resize);

  let mx = 0.5, my = 0.5, amt = 0, tAmt = 0, visible = true, raf = 0;
  el.addEventListener('pointermove', (e) => { const r = el.getBoundingClientRect(); mx = (e.clientX - r.left) / r.width; my = 1 - (e.clientY - r.top) / r.height; tAmt = 1; });
  el.addEventListener('pointerleave', () => { tAmt = 0; });
  if ('IntersectionObserver' in window) new IntersectionObserver(([en]) => { visible = en.isIntersecting; if (visible && !calm) loop(performance.now()); }).observe(el);

  const render = (t) => {
    const u = program.uniforms;
    u.uTime.value = calm ? 0 : t;
    const period = 1.0, ph = (t % period) / period;
    u.uBeat.value = calm ? 0 : Math.exp(-ph * 5.0) * 0.9 + 0.1;
    amt += (tAmt - amt) * 0.06; u.uMouseAmt.value = calm ? 0 : amt;
    const m = u.uMouse.value; m[0] += (mx - m[0]) * 0.1; m[1] += (my - m[1]) * 0.1;
    renderer.render({ scene: mesh });
  };
  function loop(now) {
    cancelAnimationFrame(raf);
    if (!visible) return;
    render(now / 1000);
    raf = requestAnimationFrame(loop);
  }
  if (calm) { setTimeout(() => render(0), 50); }
  else loop(performance.now());

  return {
    canvas: gl.canvas,
    reveal(gsap, duration = 1.4, delay = 0) {
      const u = program.uniforms.uReveal;
      if (calm || !gsap) { u.value = 1.4; render(0); return; }
      u.value = 0; gsap.to(u, { value: 1.4, duration, delay, ease: 'power3.inOut' });
    },
  };
}
