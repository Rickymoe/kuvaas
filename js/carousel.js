// Kuvaas -- hero-karusell (native scroll-snap, alle skjermbredder).
//
// Var tidligere dobbel: buet 3D-løkke (three.js) på desktop + scroll-snap på
// mobil, med live modusbytte ved grensekryssing. 3D-varianten sto for en lang
// serie modusbytte-bugs (2026-09-05) og er flyttet til X6-prosjektet
// (`js/carousel-b.js`). Her er nå bare den native scroll-snap-karusellen --
// nettleseren gjør sveip + fart + snapp -- på alle bredder.
//
// Bytt bildene i SLOTS. caption = hero-teksten som byttes når slotten er i
// fokus (slot 0 sin leses fra .hero-content i HTML for SSR / no-JS).

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v))

// foo.jpg -> foo-mobile.jpg -- karusellen serverer en mindre søskenfil i stedet
// for fulloppløsningsbildet (samme konvensjon som posterens <picture><source>).
const mobileImageSrc = (path) => path.replace(/(\.[a-z0-9]+)$/i, '-mobile$1')

// caption = teksten som byttes når slotten er i fokus. Slot 0 sin caption
// leses fra .hero-content i HTML (SSR / no-JS).
// TODO (Ricky): bytt bildene til ekte brede foto + skriv ekte captions for 1-3.
const SLOTS = [
  { image: 'Bilder/havn-hero.jpg', caption: null },
  { image: 'Bilder/havn-hero.jpg', caption: {
      eyebrow: 'Erfarne tannleger',
      h1: 'Skånsom behandling i hvert steg',
      lead: 'Vi tar oss tid, forklarer underveis og tilpasser alt til deg.' } },
  { image: 'Bilder/havn-hero.jpg', caption: {
      eyebrow: 'Midt i Holmestrand',
      h1: 'Rett ved brygga, enkelt å komme til',
      lead: 'Havnegaten 7 – kort vei fra tog, buss og parkering.' } },
  { image: 'Bilder/havn-hero.jpg', caption: {
      eyebrow: 'Hele smilet ditt',
      h1: 'Fra rutinekontroll til større behandlinger',
      lead: 'Alltid med et tydelig kostnadsoverslag før vi starter.' } },
]

export function initCarousel(stage) {
  if (!stage) return
  const filled = SLOTS.filter(s => s.image)
  const DEV = location.hostname === 'localhost' || location.hostname === '127.0.0.1'

  // ================= Bildetekster + prikker =================================
  const capEls = {
    eyebrow: stage.querySelector('.hero-content .eyebrow'),
    h1: stage.querySelector('.hero-content h1'),
    lead: stage.querySelector('.hero-content .lead'),
  }
  const captions = SLOTS.map((s, i) => s.caption || (i === 0 ? {
    eyebrow: capEls.eyebrow && capEls.eyebrow.textContent,
    h1: capEls.h1 && capEls.h1.textContent,
    lead: capEls.lead && capEls.lead.textContent,
  } : null))
  let currentSlot = 0

  function applyCaption(i) {
    const c = captions[i]
    if (!c) return
    if (capEls.eyebrow && c.eyebrow != null) capEls.eyebrow.textContent = c.eyebrow
    if (capEls.h1 && c.h1 != null) capEls.h1.textContent = c.h1
    if (capEls.lead && c.lead != null) capEls.lead.textContent = c.lead
  }

  const dotWrap = document.createElement('div')
  dotWrap.className = 'carousel-dots'
  const dots = SLOTS.map((s, i) => {
    if (!s.image) return null
    const b = document.createElement('button')
    b.type = 'button'
    b.className = 'carousel-dot'
    b.setAttribute('aria-label', `Bilde ${i + 1}`)
    dotWrap.appendChild(b)
    return b
  })
  if (filled.length > 1) stage.appendChild(dotWrap)

  function setCurrentSlot(i) {
    currentSlot = i
    applyCaption(i)
    dots.forEach((d, k) => {
      if (!d) return
      d.classList.toggle('is-active', k === i)
      if (k === i) d.setAttribute('aria-current', 'true')
      else d.removeAttribute('aria-current')
    })
  }

  // ================= Scroll-snap-karusellen =================================
  const ac = new AbortController()

  const strip = document.createElement('div')
  strip.className = 'mobil-karusell'
  const slides = filled.map((s, i) => {
    const im = document.createElement('img')
    im.src = mobileImageSrc(s.image)
    im.alt = ''
    im.loading = i === 0 ? 'eager' : 'lazy'
    // Det synlige bildet: sync-dekoding -> nettleseren maler det ferdig FØR det
    // vises, i stedet for å vise en tegnet-men-udekodet ramme. Resten async.
    im.decoding = i === 0 ? 'sync' : 'async'
    strip.appendChild(im)
    return im
  })
  stage.appendChild(strip)

  // Posteren ligger bak stripen og viser samme foto (css: html.js .hero-poster).
  // .is-ready fader den ut når det synlige bildet er DEKODET (ikke bare `load`
  // -- iOS Safari fyrer `load` litt før rasterisering). Se
  // reference_opaque_poster_covers_cached_content i minnet. Fallback fordi
  // img.decode() kan stalle i en ikke-komposittende fane (som rAF).
  const markReady = () => stage.classList.add('is-ready')
  const firstImg = slides[0]
  if (!firstImg) {
    markReady()
  } else if (firstImg.decode) {
    firstImg.decode().then(markReady, markReady)
  } else if (firstImg.complete) {
    markReady()
  } else {
    firstImg.addEventListener('load', markReady, { once: true, signal: ac.signal })
    firstImg.addEventListener('error', markReady, { once: true, signal: ac.signal })
  }
  setTimeout(markReady, 4000)

  setCurrentSlot(0)

  const goToIndex = (i) => slides[i] && slides[i].scrollIntoView({
    behavior: 'smooth', inline: 'center', block: 'nearest',
  })
  dots.forEach((d, i) => d && d.addEventListener('click', () => goToIndex(i)))

  // Pil-knapper + piltaster -- leser faktisk scroll-posisjon (ikke currentSlot,
  // som kan henge etter en smooth-scroll), wrapper rundt endene.
  const nav = (delta) => {
    const cur = clamp(Math.round(strip.scrollLeft / strip.clientWidth), 0, slides.length - 1)
    goToIndex((cur + delta + slides.length) % slides.length)
  }
  stage.querySelector('.carousel-nav--prev')?.addEventListener('click', () => nav(-1))
  stage.querySelector('.carousel-nav--next')?.addEventListener('click', () => nav(1))
  addEventListener('keydown', (e) => {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return
    // ikke kapre piltastene når karusellen er scrollet ut av syne
    const r = stage.getBoundingClientRect()
    if (r.bottom < 0 || r.top > innerHeight) return
    nav(e.key === 'ArrowLeft' ? -1 : 1)
  }, { signal: ac.signal })

  // Nærmeste slide -> aktiv prikk + caption byttes rett (ingen fade her).
  let scrollIdx = 0
  strip.addEventListener('scroll', () => {
    const i = clamp(Math.round(strip.scrollLeft / strip.clientWidth), 0, slides.length - 1)
    if (i !== scrollIdx) { scrollIdx = i; setCurrentSlot(i) }
  }, { passive: true, signal: ac.signal })

  if (DEV) window.__cx = { goToIndex, slot: () => currentSlot }
}
