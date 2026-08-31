document.addEventListener('DOMContentLoaded', async () => {
  await Promise.all([
    loadPartial('partials/header.html', 'site-header'),
    loadPartial('partials/footer.html', 'site-footer')
  ]);
  initNav();
  initNavScroll();
  initReveal();
  initRating();
});

// Nav "setter seg" (solid bakgrunn + skygge) når man har scrollet forbi toppen.
function initNavScroll() {
  const nav = document.querySelector('.nav');
  if (!nav) return;
  let ticking = false;
  const update = () => {
    nav.classList.toggle('nav--scrolled', window.scrollY > 64);
    ticking = false;
  };
  update();
  window.addEventListener('scroll', () => {
    if (!ticking) { requestAnimationFrame(update); ticking = true; }
  }, { passive: true });
}

// Rating-badgen: stjernene fylles og tallene teller opp når badgen scrolles inn.
function initRating() {
  const badge = document.querySelector('.rating-badge');
  const valEl = document.getElementById('rating-value');
  const cntEl = document.getElementById('rating-count');
  if (!badge || !valEl || !cntEl) return;

  const rating = parseFloat(valEl.textContent.replace(',', '.')) || 0;
  const count = parseInt(cntEl.textContent.replace(/\D/g, ''), 10) || 0;
  badge.setAttribute('aria-label',
    `Google-vurdering: ${valEl.textContent} av ${cntEl.textContent} anmeldelser`);

  const fyll = Math.max(0, Math.min(100, rating / 5 * 100));
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const settFinal = () => {
    const stars = badge.querySelector('.rating-stars');
    if (stars) stars.style.setProperty('--fyll', fyll + '%');
    valEl.textContent = rating.toLocaleString('nb-NO', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
    cntEl.textContent = String(count);
  };

  if (reduced || !('IntersectionObserver' in window)) { settFinal(); return; }

  valEl.textContent = '0,0';
  cntEl.textContent = '0';

  const animer = () => {
    const stars = badge.querySelector('.rating-stars');
    if (stars) stars.style.setProperty('--fyll', fyll + '%');   // CSS-transition gjør resten
    const dur = 1100, t0 = performance.now();
    const step = (now) => {
      const p = Math.min(1, (now - t0) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      valEl.textContent = (rating * eased).toLocaleString('nb-NO', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
      cntEl.textContent = String(Math.round(count * eased));
      if (p < 1) requestAnimationFrame(step);
      else settFinal();
    };
    requestAnimationFrame(step);
  };

  const io = new IntersectionObserver((entries) => {
    if (entries.some(e => e.isIntersecting)) { animer(); io.disconnect(); }
  }, { threshold: 0.35 });
  io.observe(badge);
}

// Cacher header/footer i sessionStorage. Første sidevisning i en økt henter
// og lagrer; alle senere navigasjoner injiserer synkront fra cache, så
// headeren rekker ikke å blinke tomt før fetch-en fyller den. Cachen
// revalideres i bakgrunnen (ny versjon vises ved neste navigasjon).
// outerHTML (not innerHTML) so the placeholder div doesn't wrap the result —
// a wrapper exactly the height of .nav leaves position:sticky with no room to
// stick, so .nav must become a direct child of body.
function loadPartial(url, targetId) {
  const target = document.getElementById(targetId);
  if (!target) return Promise.resolve();
  const key = 'kuvaas-partial:' + url;

  let cached = null;
  try { cached = sessionStorage.getItem(key); } catch (e) {}

  const fetchAndStore = () => fetch(url)
    .then(res => {
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return res.text();
    })
    .then(html => {
      try { sessionStorage.setItem(key, html); } catch (e) {}
      return html;
    });

  if (cached) {
    target.outerHTML = cached;
    fetchAndStore().catch(() => {});
    return Promise.resolve();
  }

  return fetchAndStore()
    .then(html => {
      const t = document.getElementById(targetId);
      if (t) t.outerHTML = html;
    })
    .catch(err => console.error('Kunne ikke laste ' + url, err));
}

function initNav() {
  const currentPage = document.body.dataset.page;
  document.querySelectorAll('.nav a[data-page]').forEach(link => {
    if (link.dataset.page === currentPage) link.classList.add('active');
  });
  const hamburger = document.querySelector('.nav-hamburger');
  const links = document.querySelector('.nav-links');
  if (hamburger && links) {
    hamburger.addEventListener('click', () => {
      const isOpen = links.classList.toggle('open');
      hamburger.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });
  }
}

function initReveal() {
  // Flagg til head-scriptets failsafe: reveal-oppsettet kjørte, så det trenger
  // ikke tvinge alt synlig etter load.
  window.__revealReady = true;

  if (!('IntersectionObserver' in window)) {
    document.querySelectorAll('.reveal').forEach(el => el.classList.add('visible'));
    return;
  }
  // Stagger settes med transition-delay i markup der det er ønsket -- ikke via
  // setTimeout (den gamle i*60-varianten staggeret aldri på mobil, der
  // elementene entrer ett og ett).
  const io = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08 });
  document.querySelectorAll('.reveal').forEach(el => io.observe(el));
}
