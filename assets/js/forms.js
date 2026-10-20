/* Formulaires simulés : aucune donnée n'est envoyée. */
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function checkEmail(input) {
  const field = input.closest('.field'), err = field?.querySelector('.field__err');
  const ok = EMAIL.test(input.value.trim());
  field?.classList.toggle('is-invalid', !ok);
  input.setAttribute('aria-invalid', ok ? 'false' : 'true');
  if (err) { err.hidden = ok; if (!err.id) err.id = `${input.id}-err`; input.setAttribute('aria-describedby', err.id); }
  return ok;
}

function simple(form, gsap) {
  const success = form.parentElement.querySelector('[data-success]');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = form.querySelector('input[type="email"]');
    if (email && !checkEmail(email)) { email.focus(); return; }
    form.hidden = true;
    if (success) { success.hidden = false; success.focus(); if (gsap) gsap.from(success, { y: 20, opacity: 0, duration: 0.7, ease: 'power3.out' }); }
  });
  form.querySelectorAll('input[type="email"]').forEach((i) => i.addEventListener('blur', () => { if (i.value) checkEmail(i); }));
}

function signup(root, gsap, calm) {
  const form = root.querySelector('form');
  const steps = [...form.querySelectorAll('[data-fstep]')];
  const label = root.querySelector('[data-progress-label]');
  const path = root.querySelector('[data-progress-path]');
  let len = 0;
  if (path && path.getTotalLength) { len = path.getTotalLength(); path.style.strokeDasharray = len; path.style.strokeDashoffset = len; }
  const prog = (n) => {
    if (label) label.textContent = `Étape ${n} sur 3`;
    if (!path || !len) return;
    const off = len * (1 - n / 3);
    if (gsap && !calm) gsap.to(path, { strokeDashoffset: off, duration: 0.9, ease: 'power3.inOut' }); else path.style.strokeDashoffset = off;
  };
  const go = (n) => {
    steps.forEach((s) => { s.hidden = s.dataset.fstep !== String(n); });
    const cur = steps[n - 1];
    if (gsap && !calm) gsap.from(cur, { x: 24, opacity: 0, duration: 0.6, ease: 'power3.out' });
    (cur.querySelector('input') || cur).focus({ preventScroll: true });
    prog(n);
  };
  prog(1);
  const email = form.querySelector('#ins-email'), cert = form.querySelector('#ins-cert'), certErr = form.querySelector('[data-cert-err]');
  form.querySelector('[data-next]').addEventListener('click', () => { if (checkEmail(email)) go(2); else email.focus(); });
  email.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); if (checkEmail(email)) go(2); } });
  form.querySelector('[data-prev]').addEventListener('click', () => go(1));
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!cert.checked) { cert.closest('.check').classList.add('is-invalid'); certErr.hidden = false; cert.focus(); return; }
    cert.closest('.check').classList.remove('is-invalid'); certErr.hidden = true;
    root.querySelector('[data-echo-email]').textContent = email.value.trim();
    go(3);
  });
  cert.addEventListener('change', () => { if (cert.checked) { cert.closest('.check').classList.remove('is-invalid'); certErr.hidden = true; } });
  form.querySelector('[data-restart]').addEventListener('click', () => { form.reset(); go(1); });
}

function eligibility(root) {
  const res = root.querySelector('[data-elig-res]');
  const opts = root.querySelectorAll('[data-elig-opt]');
  opts.forEach((b) => b.addEventListener('click', () => {
    opts.forEach((o) => o.setAttribute('aria-pressed', o === b ? 'true' : 'false'));
    const yes = b.dataset.eligOpt === 'yes';
    res.classList.toggle('is-yes', yes);
    res.innerHTML = yes
      ? `<h3>Oui, vous pouvez répondre.</h3><p>En tant que ${b.textContent.toLowerCase()}, vous détenez un mandat : vous pouvez participer à titre individuel et volontaire.</p><a class="link link--under" href="#inscription" style="align-self:flex-start">Je participe</a>`
      : `<h3>Cette enquête s’adresse aux personnes qui exercent un mandat.</h3><p>Vous pouvez en revanche recevoir les résultats des études de l’Observatoire.</p><a class="link link--under" href="resultats.html#recevoir" style="align-self:flex-start">Recevoir les résultats</a>`;
  }));
}

export function initForms({ gsap, calm }) {
  document.querySelectorAll('form[data-form="panel"], form[data-form="results"]').forEach((f) => simple(f, gsap));
  const s = document.querySelector('[data-signup]'); if (s) signup(s, gsap, calm);
  const el = document.querySelector('[data-elig]'); if (el) eligibility(el);
}
