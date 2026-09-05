// Kuvaas -- hero-karusell.
//
// DESKTOP: buet 3D-løkke (Three.js). Fotavtrykket er en rund løkke; kameraet
// står stille rett på fronten. Front-slotten leser nesten flatt = HERO-bildet,
// sidepanelene krummer bakover. Man blar ved å rotere løkka om Y-aksen.
//
// MOBIL (<= CONFIG.mobileMaxPx): en helt vanlig scroll-snap-karusell -- nett-
// leseren gjør sveip + fart + snapp nativt. Three.js lastes ikke her.
//
// Krysser man grensa (typ. mobil-rotasjon) bygges karusellen OM live: den ene
// modusen ryddes bort, den andre monteres. Delt tilstand (hvilket bilde, prik-
// kene, bildetekstene) beholdes. Feiler WebGL/JS: .hero-poster blir stående.
//
// Alt er parametrisert i CONFIG. Bytt bildene i SLOTS.

let THREE   // lastes dynamisk kun på desktop, gjenbrukes etterpå

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v))
const DEG = Math.PI / 180

// foo.jpg -> foo-mobile.jpg. The mobile carousel serves a smaller sibling
// file instead of the same full-res image desktop uses (convention shared
// with the poster's <picture><source> in index.html).
const mobileImageSrc = (path) => path.replace(/(\.[a-z0-9]+)$/i, '-mobile$1')

const CONFIG = {
  radius: 3.9,               // løkkas radius
  slotArc: Math.PI / 2,      // 4 slots, 90 grader mellom hvert bildesenter
  panelArc: 38 * DEG,        // hvert bilde spenner 38 grader -> fronten leser flatt
  aspect: 2560 / 1213,       // kildebildets bredde/høyde
  heroMaxWidthPx: 1120,      // "fit": panelet aldri bredere enn dette (som det gamle kortet)
  heroSideMarginPx: 48,      // ...og aldri nærmere lerretskanten enn dette hver side
  heroHeightFrac: 0.94,      // "fill": panelet dekker så mye av stage-høyden
  fov: 35,
  cornerRadius: 0.045,       // avrundede hjørner på bildet, andel av panelhøyden
  bg: 0xfdf6ec,              // = --cream (tåke + clear color)

  // Mørkning bakt inn i HVERT panel-materiale (shader) -- gradienten ER bildet,
  // så den ligger alltid presist på det. Venstretung + ekstra mot bunn.
  shadeColor: [0.09, 0.065, 0.045],
  shadeLeftEnd: 0.92,
  shadeLeftFalloff: 1.15,
  shadeBottomBoost: 0.5,
  shadeMax: 0.90,

  // Kameraets horisontale synsfelt (hFov) er avledet av vFov * aspect --
  // uten tak vokser det ubegrenset på en veldig bred/lav stage, og avdekker
  // stadig mer av løkkas krumme sidepaneler jo bredere vinduet blir (selve
  // fronten holder seg pent innafor heroMaxWidthPx, men "hvor mye av siden
  // du ser" gjorde ikke det). Over dette forholdet render'es scenen inn i en
  // "pillarboxed" (smalere, sentrert) del av canvaset i stedet for full
  // stage-bredde, så sidepanelene aldri tar mer plass enn ved dette
  // forholdet. 2.2 valgt for å matche hvordan det så riktig ut på et vanlig
  // (ikke ultrabredt) skjermvindu -- Ricky 2026-09-04.
  maxViewportAspect: 2.2,

  swipePx: 45,               // desktop: dra så langt for å bla ett steg
  dragGive: 0.0018,
  dragGiveMax: 0.06,
  ease: 0.09,
  captionOutMs: 820,         // ms teksten er ute før den byttes + fades inn

  // >>> GRENSA mobil / desktop. Endre dette tallet for å flytte den. <<<
  // (Hold @media-verdien i css/style.css i sync -- den gjelder bare no-JS.)
  mobileMaxPx: 950,
}
CONFIG.mobileQuery = `(max-width: ${CONFIG.mobileMaxPx}px)`

// Slot-oppsett. caption = teksten som fades inn når slotten er i fokus. Slot 0
// sin caption leses fra .hero-content i HTML (SSR / no-JS).
// TODO (Ricky): bytt bildene til ekte brede foto + skriv ekte captions for 1-3.
const SLOTS = [
  { angle: 0,            image: 'Bilder/havn-hero.jpg', caption: null },
  { angle: Math.PI / 2,  image: 'Bilder/havn-hero.jpg', caption: {
      eyebrow: 'Erfarne tannleger',
      h1: 'Skånsom behandling i hvert steg',
      lead: 'Vi tar oss tid, forklarer underveis og tilpasser alt til deg.' } },
  { angle: Math.PI,      image: 'Bilder/havn-hero.jpg', caption: {
      eyebrow: 'Midt i Holmestrand',
      h1: 'Rett ved brygga, enkelt å komme til',
      lead: 'Havnegaten 7 – kort vei fra tog, buss og parkering.' } },
  { angle: -Math.PI / 2, image: 'Bilder/havn-hero.jpg', caption: {
      eyebrow: 'Hele smilet ditt',
      h1: 'Fra rutinekontroll til større behandlinger',
      lead: 'Alltid med et tydelig kostnadsoverslag før vi starter.' } },
]

export async function initCarousel(canvas) {
  if (!canvas) return
  const stage = canvas.parentElement
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches
  const filled = SLOTS.filter(s => s.image)
  const DEV = location.hostname === 'localhost' || location.hostname === '127.0.0.1'

  // ================= DELT: bildetekster + prikker (lever hele tiden) =========
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
  let capTimer = null
  let goToIndex = () => {}   // settes av aktiv modus

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
    b.addEventListener('click', () => goToIndex(i))
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

  // Fade teksten UT (CSS .is-turning), bytt den mens den er usynlig, fade INN.
  function goCaption(dest) {
    clearTimeout(capTimer)
    if (dest === currentSlot) { stage.classList.remove('is-turning'); return }
    if (reduced) { setCurrentSlot(dest); return }
    stage.classList.add('is-turning')
    capTimer = setTimeout(() => {
      setCurrentSlot(dest)
      stage.classList.remove('is-turning')
    }, CONFIG.captionOutMs)
  }

  // ================= MOBIL: vanlig scroll-snap-karusell =====================
  function mountMobile(myGen) {
    const ac = new AbortController()
    stage.classList.add('is-mobile')

    const strip = document.createElement('div')
    strip.className = 'mobil-karusell'
    const slides = filled.map((s, i) => {
      const im = document.createElement('img')
      // Desktop's own s.image is the full 2560px source (~480KB) -- wasteful
      // over a mobile connection and slow enough to make the poster's
      // loading state noticeable ("blinker" report, 2026-09-05). Mobile gets
      // a pre-generated ~1000px/85KB `-mobile` sibling file instead (same
      // convention the poster's own <picture><source> in index.html uses,
      // so both requests hit the same cached URL). Any future distinct
      // per-slot photo needs its own `-mobile` file alongside it.
      im.src = mobileImageSrc(s.image)
      im.alt = ''
      im.loading = i === 0 ? 'eager' : 'lazy'
      im.decoding = 'async'
      strip.appendChild(im)
      return im
    })
    const scrim = document.createElement('div')
    scrim.className = 'mobil-scrim'
    stage.appendChild(strip)
    stage.appendChild(scrim)

    // Only fade the poster out once the slide actually being shown has
    // loaded -- setting .is-ready synchronously left a blank gap (the fresh
    // <img>s aren't painted yet) before the photo popped in. Routed through
    // markContentReady()/reveal() (not a direct classList.add) so a mode
    // that's about to be replaced never gets to show itself either -- see
    // that function's own comment.
    const markReady = () => markContentReady(myGen)
    const firstImg = slides[currentSlot] ?? slides[0]
    if (!firstImg || firstImg.complete) markReady()
    else {
      firstImg.addEventListener('load', markReady, { once: true, signal: ac.signal })
      firstImg.addEventListener('error', markReady, { once: true, signal: ac.signal })
    }

    // Start på samme bilde som man var på (viktig ved rotasjon).
    let scrollIdx = currentSlot
    requestAnimationFrame(() => { strip.scrollLeft = currentSlot * strip.clientWidth })
    setCurrentSlot(currentSlot)

    goToIndex = (i) => slides[i] && slides[i].scrollIntoView({
      behavior: 'smooth', inline: 'center', block: 'nearest',
    })

    // Nærmeste slide -> aktiv prikk + caption byttes RETT (ingen fade på mobil).
    strip.addEventListener('scroll', () => {
      const i = clamp(Math.round(strip.scrollLeft / strip.clientWidth), 0, slides.length - 1)
      if (i !== scrollIdx) { scrollIdx = i; setCurrentSlot(i) }
    }, { passive: true, signal: ac.signal })

    if (DEV) window.__cx = { mobile: true, goToIndex, slot: () => currentSlot }

    return () => {
      ac.abort()
      strip.remove()
      scrim.remove()
      stage.classList.remove('is-mobile', 'is-ready')
    }
  }

  // ================= DESKTOP: buet 3D-løkke (Three.js) ======================
  async function mountDesktop(isCurrent, myGen) {
    if (!THREE) {
      try { THREE = await import('three') }
      catch (e) {
        console.warn('Hero-karusell: three.js lastet ikke, viser posteren videre.', e)
        stage.classList.add('no-webgl')
        return () => stage.classList.remove('no-webgl')
      }
    }
    if (!isCurrent()) return () => {}

    const ac = new AbortController()
    // Frisk <canvas> hver gang -> ingen WebGL-kontekst-gjenbruksproblemer.
    let cv = stage.querySelector('#carousel-canvas')
    cv.replaceWith(cv = cv.cloneNode(false))

    const arcLen = CONFIG.radius * CONFIG.panelArc
    const panelH = arcLen / CONFIG.aspect
    const chord = 2 * CONFIG.radius * Math.sin(CONFIG.panelArc / 2)

    const scene = new THREE.Scene()
    scene.fog = new THREE.Fog(CONFIG.bg, 1, 10)
    const camera = new THREE.PerspectiveCamera(CONFIG.fov, 1, 0.1, 100)

    let renderer
    try {
      renderer = new THREE.WebGLRenderer({ canvas: cv, alpha: true, antialias: true })
    } catch (e) {
      console.warn('Hero-karusell: WebGL utilgjengelig, viser posteren videre.', e)
      stage.classList.add('no-webgl')
      return () => stage.classList.remove('no-webgl')
    }
    renderer.setClearColor(CONFIG.bg, 0)
    const maxAniso = renderer.capabilities.getMaxAnisotropy()

    const loop = new THREE.Group()
    scene.add(loop)
    const alphaMap = makeRoundedRectAlpha(CONFIG.cornerRadius)
    const loader = new THREE.TextureLoader()
    const panels = []

    for (const slot of SLOTS) {
      if (!slot.image) continue
      const geo = new THREE.CylinderGeometry(
        CONFIG.radius, CONFIG.radius, panelH, 64, 1, true,
        slot.angle - CONFIG.panelArc / 2, CONFIG.panelArc
      )
      const tex = loader.load(slot.image, () => render())
      tex.colorSpace = THREE.SRGBColorSpace
      tex.anisotropy = maxAniso
      const mat = new THREE.MeshBasicMaterial({
        map: tex, alphaMap, transparent: true,
        side: THREE.DoubleSide, toneMapped: false,
      })
      applyPanelShade(mat)
      const mesh = new THREE.Mesh(geo, mat)
      loop.add(mesh)
      panels.push(mesh)
    }

    const shadowTex = makeRadialShadow()
    const shadow = new THREE.Mesh(
      new THREE.PlaneGeometry(chord * 1.5, CONFIG.radius * 1.7),
      new THREE.MeshBasicMaterial({
        map: shadowTex, transparent: true, opacity: 0.22,
        depthWrite: false, color: 0x4a3b2a, toneMapped: false,
      })
    )
    shadow.rotation.x = -Math.PI / 2
    shadow.position.y = -panelH / 2 - 0.05
    shadow.position.z = CONFIG.radius * 0.15
    scene.add(shadow)

    // Actual rendered (possibly pillarboxed, see CONFIG.maxViewportAspect)
    // width and its left offset within the stage -- kept in sync by resize()
    // and used both for the WebGL viewport and for mapping the camera's NDC
    // space back to on-screen pixels (updateTextAnchor), so the HTML overlay
    // (title, buttons, dots...) lines up with the canvas even when it's
    // narrower than the stage.
    let renderW = 0, renderOffsetX = 0

    const _v = new THREE.Vector3()
    function updateTextAnchor() {
      const w = renderW, h = stage.clientHeight
      if (!w || !h) return
      camera.updateMatrixWorld()
      const halfArc = CONFIG.panelArc / 2
      const halfH = panelH / 2
      const px = (x, y, z) => { _v.set(x, y, z).project(camera); return [renderOffsetX + (_v.x * 0.5 + 0.5) * w, (-_v.y * 0.5 + 0.5) * h] }
      const [leftPx] = px(CONFIG.radius * Math.sin(-halfArc), 0, CONFIG.radius * Math.cos(-halfArc))
      const [rightPx] = px(CONFIG.radius * Math.sin(halfArc), 0, CONFIG.radius * Math.cos(halfArc))
      const cx = CONFIG.radius * Math.sin(-halfArc), cz = CONFIG.radius * Math.cos(-halfArc)
      const [, topPy] = px(cx, halfH, cz)
      const [, botPy] = px(cx, -halfH, cz)
      stage.style.setProperty('--panel-left', leftPx + 'px')
      stage.style.setProperty('--panel-w', (rightPx - leftPx) + 'px')
      stage.style.setProperty('--panel-top', topPy + 'px')
      stage.style.setProperty('--panel-h', (botPy - topPy) + 'px')
    }

    function fitCamera(viewportAspect, stageW) {
      const vFov = CONFIG.fov * DEG
      const hFov = 2 * Math.atan(Math.tan(vFov / 2) * viewportAspect)
      const frontZ = CONFIG.radius * Math.cos(CONFIG.panelArc / 2)
      const wFrac = Math.min(CONFIG.heroMaxWidthPx, stageW - CONFIG.heroSideMarginPx) / stageW
      const distFit = ((chord / 2) / wFrac) / Math.tan(hFov / 2)
      const distFill = ((panelH / 2) / CONFIG.heroHeightFrac) / Math.tan(vFov / 2)
      const dist = viewportAspect >= 1 ? Math.min(distFit, distFill) : distFill
      const camZ = frontZ + dist
      camera.position.set(0, 0, camZ)
      camera.lookAt(0, 0, 0)
      scene.fog.near = camZ - CONFIG.radius * 0.40
      scene.fog.far = camZ + CONFIG.radius * 0.95
    }

    // Start på samme bilde man var på (viktig ved rotasjon).
    let targetAngle = -SLOTS[currentSlot].angle
    let renderAngle = targetAngle
    let opacity = reduced ? 1 : 0
    let idle = true
    let ready = false
    let readyArmed = false
    let alive = true

    const filledAngles = SLOTS.filter(s => s.image).map(s => -s.angle)
    const slotAt = (angle) => (((Math.round(-angle / CONFIG.slotArc)) % 4) + 4) % 4

    function nearestFilled(a) {
      let best = a, bestD = Infinity
      for (const base of filledAngles) {
        const k = Math.round((a - base) / (2 * Math.PI))
        const cand = base + k * 2 * Math.PI
        const d = Math.abs(cand - a)
        if (d < bestD) { bestD = d; best = cand }
      }
      return best
    }

    function step(dir) {
      let a = targetAngle
      for (let i = 0; i < 4; i++) {
        a += dir * CONFIG.slotArc
        const snapped = nearestFilled(a)
        if (Math.abs(snapped - a) < 1e-3) { targetAngle = snapped; goCaption(slotAt(targetAngle)); wake(); return }
      }
      targetAngle = nearestFilled(a); goCaption(slotAt(targetAngle)); wake()
    }

    goToIndex = function goToSlot(i) {
      if (i === currentSlot) return
      const base = -SLOTS[i].angle
      targetAngle = base + Math.round((targetAngle - base) / (2 * Math.PI)) * 2 * Math.PI
      goCaption(slotAt(targetAngle))
      wake()
    }

    let dragging = false, startX = 0, swiped = false
    cv.addEventListener('pointerdown', e => {
      dragging = true; swiped = false; startX = e.clientX
      cv.setPointerCapture(e.pointerId)
      cv.style.cursor = 'grabbing'
    }, { signal: ac.signal })
    cv.addEventListener('pointermove', e => {
      if (!dragging || swiped) return
      const dx = e.clientX - startX
      if (Math.abs(dx) >= CONFIG.swipePx) {
        swiped = true
        cv.style.cursor = 'grab'
        step(dx < 0 ? -1 : 1)
      } else {
        renderAngle = targetAngle + clamp(dx * CONFIG.dragGive, -CONFIG.dragGiveMax, CONFIG.dragGiveMax)
        wake()
      }
    }, { signal: ac.signal })
    const endDrag = () => {
      if (!dragging) return
      dragging = false
      cv.style.cursor = 'grab'
      if (!swiped) wake()
    }
    cv.addEventListener('pointerup', endDrag, { signal: ac.signal })
    cv.addEventListener('pointercancel', endDrag, { signal: ac.signal })

    stage.querySelector('.carousel-nav--prev')?.addEventListener('click', () => step(1), { signal: ac.signal })
    stage.querySelector('.carousel-nav--next')?.addEventListener('click', () => step(-1), { signal: ac.signal })
    addEventListener('keydown', e => {
      if (e.key === 'ArrowLeft') step(1)
      else if (e.key === 'ArrowRight') step(-1)
    }, { signal: ac.signal })

    let raf = null
    function wake() { idle = false; if (alive && !raf) raf = requestAnimationFrame(tick) }

    function tick() {
      raf = null
      if (!alive) return
      renderAngle += (targetAngle - renderAngle) * CONFIG.ease
      if (opacity < 1) opacity = Math.min(1, opacity + 0.06)
      const settled = Math.abs(targetAngle - renderAngle) < 0.0004 && opacity >= 1
      if (settled) { renderAngle = targetAngle; idle = true }
      render()
      if (!ready && opacity >= 1) {
        // Routed through markContentReady()/reveal() (see that function's
        // own comment) instead of a direct classList.add -- a desktop mount
        // that's about to be replaced by mobile never gets to show itself.
        if (readyArmed) { ready = true; markContentReady(myGen) }
        else { readyArmed = true }
      }
      if (!idle || dragging || !ready) raf = requestAnimationFrame(tick)
    }

    function render() {
      if (!alive) return
      loop.rotation.y = renderAngle
      for (const p of panels) p.material.opacity = opacity
      shadow.material.opacity = 0.22 * opacity
      renderer.render(scene, camera)
    }

    function resize() {
      const w = stage.clientWidth
      const h = stage.clientHeight
      if (!w || !h) return

      // Pillarbox: past CONFIG.maxViewportAspect, render into a centered,
      // capped-width slice of the canvas rather than the full stage width --
      // extra width just becomes more cream margin (page background) either
      // side, not more revealed side-panel.
      renderW = Math.min(w, h * CONFIG.maxViewportAspect)
      renderOffsetX = (w - renderW) / 2
      cv.style.left  = renderOffsetX + 'px'
      cv.style.width = renderW + 'px'
      cv.style.right = 'auto'

      renderer.setPixelRatio(Math.min(devicePixelRatio, 2))
      renderer.setSize(renderW, h, false)
      camera.aspect = renderW / h
      fitCamera(renderW / h, renderW)
      camera.updateProjectionMatrix()
      updateTextAnchor()
      render()
    }
    const ro = new ResizeObserver(resize)
    ro.observe(stage)
    resize()
    wake()

    if (DEV) {
      window.__cx = {
        step, resize, goToIndex,
        _state: () => ({ targetAngle, renderAngle, opacity, idle, dragging, ready, currentSlot }),
        _set: (o) => { if (o.opacity != null) opacity = o.opacity; if (o.targetAngle != null) targetAngle = o.targetAngle; if (o.renderAngle != null) renderAngle = o.renderAngle; render() },
        _tick: () => tick(),
        _render: () => render(),
      }
    }

    return () => {
      alive = false
      cancelAnimationFrame(raf)
      ac.abort()
      ro.disconnect()
      clearTimeout(capTimer)
      panels.forEach(p => { p.geometry.dispose(); p.material.map && p.material.map.dispose(); p.material.dispose() })
      shadow.geometry.dispose(); shadowTex.dispose(); shadow.material.dispose()
      alphaMap.dispose()
      renderer.dispose()
      renderer.forceContextLoss && renderer.forceContextLoss()
      ;['--panel-left', '--panel-w', '--panel-top', '--panel-h'].forEach(v => stage.style.removeProperty(v))
      stage.classList.remove('is-ready')
    }
  }

  // ================= Modusvelger + rebuild ved grensekryssing ===============
  const mq = matchMedia(CONFIG.mobileQuery)
  let unmount = () => {}
  let curMode = null
  let gen = 0
  let forceMode = null   // dev: overstyr fra konsollen

  // ── Reveal gate (2026-09-05) ────────────────────────────────────────────
  // A guessed settling delay before trusting the first mq.matches read
  // (see the setTimeout below) turned out to still let the WRONG mode's
  // content finish loading and reveal itself before the correction landed
  // -- Ricky caught it live, a slow-motion capture showing the desktop 3D
  // panel + arrows flash in on a phone before swapping to the real mobile
  // layout. No fixed delay can be guaranteed long enough on every device.
  // Structural fix instead: .is-ready is only ever added once the
  // currently-mounted mode's own content has loaded AND that mode STILL
  // agrees with what the viewport wants right this instant. If it doesn't
  // (a correction is landing), reveal() just declines -- the next `change`-
  // triggered apply() (mode switch) or its own early-return branch (mode
  // unchanged, just re-settled) will call reveal() again once things
  // actually match. A mode about to be replaced is structurally never
  // shown, independent of timing.
  let contentReadyGen = -1
  function markContentReady(myGen) { contentReadyGen = myGen; reveal() }
  function reveal(force = false) {
    if (!force) {
      if (contentReadyGen !== gen) return
      // Compare against the SAME decision apply() would make right now, not
      // raw mq.matches -- otherwise a dev forceMode() override (which is
      // deliberately viewport-independent) would never pass this check.
      const want = forceMode || (mq.matches ? 'mobile' : 'desktop')
      if (want !== curMode) return
    }
    stage.classList.add('is-ready')
  }
  // Last-resort fallback: if the agreement check above somehow never
  // converges (unforeseen edge case), don't leave the poster showing
  // forever -- a possibly-still-settling mode beats a permanently stuck one.
  setTimeout(() => reveal(true), 4000)

  async function apply() {
    const want = forceMode || (mq.matches ? 'mobile' : 'desktop')
    if (want === curMode) { reveal(); return }
    const myGen = ++gen
    try { unmount() } catch (e) { /* nothing */ }
    unmount = () => {}
    curMode = want
    // Nullstill en evt. tekst-fade som var i gang -> ny modus starter rent.
    clearTimeout(capTimer)
    stage.classList.remove('is-turning')
    setCurrentSlot(currentSlot)

    if (want === 'mobile') {
      unmount = mountMobile(myGen)
    } else {
      const u = await mountDesktop(() => gen === myGen, myGen)
      if (gen !== myGen) { try { u && u() } catch (e) {} ; return }
      unmount = u || (() => {})
    }
  }

  // Minor politeness, not a correctness fix (the reveal gate above is): on
  // iOS Safari the very first mq.matches read can be transiently wrong
  // (layout viewport not settled yet), so mounting immediately would often
  // mean pointlessly building the heavy desktop 3D scene just to tear it
  // down a beat later. setTimeout, NOT requestAnimationFrame -- rAF only
  // fires while the page is actively compositing and can stall indefinitely
  // otherwise (confirmed live: hung a headless check for 45s), which would
  // mean the carousel never mounts at all if that happens on a real device.
  await new Promise(r => setTimeout(r, 60))
  await apply()
  mq.addEventListener('change', apply)

  if (DEV) window.__cxMode = (m) => { forceMode = m || null; return apply() }
}

// Baker venstretung + bunn-tung mørkning inn i panel-materialet via shader-hook.
function applyPanelShade(mat) {
  const [dr, dg, db] = CONFIG.shadeColor
  const f = (n) => n.toFixed(4)
  mat.customProgramCacheKey = () => 'kuvaas-panel-shade'
  mat.onBeforeCompile = (shader) => {
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <map_fragment>',
      `#include <map_fragment>
      {
        float lx = clamp(vMapUv.x / ${f(CONFIG.shadeLeftEnd)}, 0.0, 1.0);
        float leftDark = ${f(CONFIG.shadeMax)} * pow(1.0 - lx, ${f(CONFIG.shadeLeftFalloff)});
        float botDark = smoothstep(0.58, 0.0, vMapUv.y) * ${f(CONFIG.shadeBottomBoost)};
        float d = min(${f(CONFIG.shadeMax)}, leftDark + botDark);
        diffuseColor.rgb = mix(diffuseColor.rgb, vec3(${f(dr)}, ${f(dg)}, ${f(db)}), d);
      }`
    )
  }
}

// Hvit avrundet rektangel på svart -- alphaMap (grønn kanal).
function makeRoundedRectAlpha(rFrac) {
  const w = 1024, h = 512
  const c = document.createElement('canvas')
  c.width = w; c.height = h
  const g = c.getContext('2d')
  g.fillStyle = '#000'; g.fillRect(0, 0, w, h)
  const r = Math.max(2, rFrac * h)
  g.fillStyle = '#fff'
  g.beginPath()
  g.roundRect(1, 1, w - 2, h - 2, r)
  g.fill()
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.NoColorSpace
  return t
}

// Radial svart->gjennomsiktig, myk kontaktskygge.
function makeRadialShadow() {
  const s = 256
  const c = document.createElement('canvas')
  c.width = s; c.height = s
  const g = c.getContext('2d')
  const grad = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2)
  grad.addColorStop(0, 'rgba(0,0,0,0.9)')
  grad.addColorStop(0.55, 'rgba(0,0,0,0.35)')
  grad.addColorStop(1, 'rgba(0,0,0,0)')
  g.fillStyle = grad
  g.fillRect(0, 0, s, s)
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.NoColorSpace
  return t
}
