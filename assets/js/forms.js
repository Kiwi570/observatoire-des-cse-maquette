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

function fieldError(field, msg) {
  if (!field) return;
  let err = field.querySelector('.field__err');
  if (!err && msg) { err = document.createElement('span'); err.className = 'field__err'; field.appendChild(err); }
  if (!err) return;
  const input = field.querySelector('input, select, textarea');
  if (msg) { err.textContent = msg; err.hidden = false; field.classList.add('is-invalid'); if (input) { if (!err.id) err.id = `${input.id || input.name}-err`; input.setAttribute('aria-invalid', 'true'); input.setAttribute('aria-describedby', err.id); } }
  else { err.hidden = true; field.classList.remove('is-invalid'); if (input) input.setAttribute('aria-invalid', 'false'); }
}

function validate(form) {
  const bads = [];
  let first = null;
  form.querySelectorAll('.field').forEach((f) => {
    const input = f.querySelector('input, select, textarea');
    if (!input) return;
    let msg = '';
    const v = (input.value || '').trim();
    if (input.required && !v) msg = input.dataset.msg || 'Ce champ est obligatoire.';
    else if (input.type === 'email' && v && !EMAIL.test(v)) msg = 'Indiquez une adresse e-mail valide, par exemple prenom.nom@exemple.fr.';
    else if (input.type === 'email' && input.required && !EMAIL.test(v)) msg = 'Indiquez une adresse e-mail valide, par exemple prenom.nom@exemple.fr.';
    fieldError(f, msg);
    if (msg) bads.push(input);
  });
  form.querySelectorAll('[data-group-min]').forEach((g) => {
    const n = g.querySelectorAll('input[type="checkbox"]:checked').length;
    const err = g.querySelector('.field__err');
    const bad = n < +g.dataset.groupMin;
    g.classList.toggle('is-invalid', bad);
    if (err) { err.hidden = !bad; if (!err.id) err.id = `${form.dataset.form}-group-err`; g.setAttribute('aria-describedby', err.id); }
    g.querySelectorAll('input').forEach((i) => i.setAttribute('aria-invalid', bad ? 'true' : 'false'));
    if (bad) bads.push(g.querySelector('input'));
  });
  form.querySelectorAll('.check input[required]').forEach((c) => {
    const box = c.closest('.check'); const bad = !c.checked;
    box.classList.toggle('is-invalid', bad);
    c.setAttribute('aria-invalid', bad ? 'true' : 'false');
    const err = box.nextElementSibling && box.nextElementSibling.classList.contains('field__err') ? box.nextElementSibling : null;
    if (err) { err.hidden = !bad; if (!err.id) err.id = `${c.id}-err`; if (bad) c.setAttribute('aria-describedby', err.id); }
    if (bad) bads.push(c);
  });
  bads.sort((a, b) => (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1));
  first = bads[0] || null;
  return first;
}

function simple(form, gsap) {
  const success = form.parentElement.querySelector('[data-success]');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const bad = validate(form);
    if (bad) { bad.focus(); return; }
    form.hidden = true;
    if (success) { success.hidden = false; success.focus(); if (gsap) gsap.from(success, { y: 20, opacity: 0, duration: 0.7, ease: 'power3.out' }); }
  });
  form.querySelectorAll('input, select, textarea').forEach((i) => i.addEventListener('blur', () => {
    const f = i.closest('.field'); if (!f || !i.value) return;
    if (i.type === 'email') fieldError(f, EMAIL.test(i.value.trim()) ? '' : 'Indiquez une adresse e-mail valide, par exemple prenom.nom@exemple.fr.');
    else if (f.classList.contains('is-invalid')) fieldError(f, '');
  }));
  const reset = form.parentElement.querySelector('[data-form-reset]');
  if (reset) reset.addEventListener('click', () => { form.reset(); form.hidden = false; success.hidden = true; form.querySelector('input, select, textarea')?.focus(); });
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
    const nav = cur.querySelector('.fstep__nav');
    if (nav) { const r = nav.getBoundingClientRect(); if (r.bottom > window.innerHeight - 20) { const y = window.scrollY + r.bottom - window.innerHeight + 40; if (window.__lenis) window.__lenis.scrollTo(y, { duration: 0.8 }); else window.scrollTo({ top: y, behavior: 'smooth' }); } }
    prog(n);
  };
  prog(1);
  const email = form.querySelector('#ins-email'), cert = form.querySelector('#ins-cert'), certErr = form.querySelector('[data-cert-err]');
  if (certErr) { certErr.id = certErr.id || 'ins-cert-err'; }
  const certState = (bad) => { cert.closest('.check').classList.toggle('is-invalid', bad); certErr.hidden = !bad; cert.setAttribute('aria-invalid', bad ? 'true' : 'false'); if (bad) cert.setAttribute('aria-describedby', certErr.id); else cert.removeAttribute('aria-describedby'); };
  form.querySelector('[data-next]').addEventListener('click', () => { if (checkEmail(email)) go(2); else email.focus(); });
  email.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); if (checkEmail(email)) go(2); } });
  form.querySelector('[data-prev]').addEventListener('click', () => go(1));
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!cert.checked) { certState(true); cert.focus(); return; }
    certState(false);
    root.querySelector('[data-echo-email]').textContent = email.value.trim();
    go(3);
  });
  cert.addEventListener('change', () => { if (cert.checked) certState(false); });
  form.querySelector('[data-restart]').addEventListener('click', () => { form.reset(); go(1); });
}

function eligibility(root) {
  const res = root.querySelector('[data-elig-res]');
  const opts = [...root.querySelectorAll('[data-elig-opt]')];
  const pick = (b, focus) => {
    opts.forEach((o) => { const on = o === b; o.setAttribute('aria-checked', on ? 'true' : 'false'); o.tabIndex = on ? 0 : -1; });
    if (focus) b.focus();
    const yes = b.dataset.eligOpt === 'yes';
    res.classList.toggle('is-yes', yes);
    res.innerHTML = yes
      ? `<h3>Oui, vous pouvez répondre.</h3><p>En tant que ${b.dataset.phrase || b.textContent}, vous détenez un mandat\u202f: vous pouvez participer à titre individuel et volontaire.</p><a class="link link--under" href="#inscription" style="align-self:flex-start">Je participe</a>`
      : `<h3>Cette enquête s’adresse aux personnes qui exercent un mandat.</h3><p>Vous pouvez en revanche recevoir les résultats des études de l’Observatoire.</p><a class="link link--under" href="resultats.html#recevoir" style="align-self:flex-start">Recevoir les résultats</a>`;
    const r = res.getBoundingClientRect();
    if (r.bottom > window.innerHeight) { const y = window.scrollY + r.bottom - window.innerHeight + 30; if (window.__lenis) window.__lenis.scrollTo(y, { duration: 0.7 }); else window.scrollTo({ top: y, behavior: 'smooth' }); }
  };
  opts.forEach((b, i) => {
    b.tabIndex = i === 0 ? 0 : -1;
    b.addEventListener('click', () => pick(b, false));
    b.addEventListener('keydown', (e) => {
      const k = e.key; let j = null;
      if (k === 'ArrowRight' || k === 'ArrowDown') j = (i + 1) % opts.length;
      if (k === 'ArrowLeft' || k === 'ArrowUp') j = (i - 1 + opts.length) % opts.length;
      if (j !== null) { e.preventDefault(); pick(opts[j], true); }
      if (k === ' ' || k === 'Enter') { e.preventDefault(); pick(b, false); }
    });
  });
}

export function initForms({ gsap, calm }) {
  document.querySelectorAll('form[data-form="panel"], form[data-form="results"], form[data-form="contact"], form[data-form="avantages"]').forEach((f) => simple(f, gsap));
  const s = document.querySelector('[data-signup]'); if (s) signup(s, gsap, calm);
  const el = document.querySelector('[data-elig]'); if (el) eligibility(el);
}
