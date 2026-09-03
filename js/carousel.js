// Kuvaas -- buet 3D hero-karusell (portet fra X-serien / X6).
//
// Systemet: fotavtrykket er en RUND løkke. Kameraet står stille, i vater,
// rett på løkkas front. Front-slotten leser nesten flatt -- det er HERO-bildet.
// Slottene til venstre og høyre er samme sylinderflate som krummer bakover; vi
// ser bare stripen nærmest heroen, resten forsvinner i perspektiv + tåke.
// Løkka er full -- 4 bilder, ett i hver slot -- så det aldri er en glipe når
// man blar. Man blar ved å rotere hele løkka om Y-aksen.
//
// Feiler WebGL (eller JS), gjør initCarousel ingenting -- da blir .hero-fallback
// (statisk <img> + scrim + tekst) stående som en helt vanlig hero.
//
// Alt er parametrisert i CONFIG. Bytt ut bildene ved å redigere SLOTS.

import * as THREE from 'three'

const CONFIG = {
  radius: 3.9,               // løkkas radius
  slotArc: Math.PI / 2,      // 4 slots, 90 grader mellom hvert bildesenter
  panelArc: THREE.MathUtils.degToRad(46), // hvert bilde spenner 46 grader -> front leser nesten flatt
  aspect: 2560 / 1213,       // kildebildets bredde/høyde
  heroWidthFrac: 0.74,       // landskap: front-bildet fyller så mye av lerretsbredden
  heroWidthFracPortrait: 1.35, // portrett: la heroen blø litt ut i bredden -> mer høyde, senter-beskåret
  heroHeightFrac: 0.94,      // heroen skal aldri bli høyere enn så mye av lerretet
  fov: 35,
  cornerRadius: 0.06,        // avrundede hjørner, som andel av panelhøyden (matcher --frame border-radius)
  bg: 0xfdf6ec,              // = --cream (tåke + clear color)
  frameInsetPx: 2,           // krymp DOM-rammen så mange px inn fra panel-omrisset
  swipePx: 45,               // dra så langt (px) for å bla ett steg
  dragGive: 0.0018,          // rad per px "etter" mens man drar under terskelen
  dragGiveMax: 0.06,         // ...men aldri mer enn dette (~3,5°) -- holder glipa lukket
  ease: 0.09,                // hvor raskt render-vinkelen tar igjen mål-vinkelen
}

// Slot-oppsett. angle = senter-theta på sylinderen (0 = front, mot kamera).
// image = null gir tom slot. Full løkke (4 bilder) -> ingen glipe når man blar.
// TODO (Ricky): bytt de tre siste til ekte brede foto av klinikken/brygga.
const SLOTS = [
  { angle: 0,               image: 'Bilder/havn-hero.jpg' }, // front / HERO
  { angle: Math.PI / 2,     image: 'Bilder/havn-hero.jpg' }, // høyre
  { angle: Math.PI,         image: 'Bilder/havn-hero.jpg' }, // bak
  { angle: -Math.PI / 2,    image: 'Bilder/havn-hero.jpg' }, // venstre
]

export function initCarousel(canvas) {
  if (!canvas) return
  const stage = canvas.parentElement
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches

  // ---- Panelmål ----------------------------------------------------------
  // Buelengden på ett panel styrer bredden; høyden følger av bildeforholdet.
  const arcLen = CONFIG.radius * CONFIG.panelArc
  const panelH = arcLen / CONFIG.aspect
  // Front-panelets synlige bredde (korden mellom buens endepunkter).
  const chord = 2 * CONFIG.radius * Math.sin(CONFIG.panelArc / 2)

  // ---- Scene / kamera / renderer ---------------------------------------
  const scene = new THREE.Scene()
  // Tåka biter inn i sidepanelenes bortre halvdel -> perspektiv-splayen løses
  // opp i cream i stedet for å stå og skjære, og løkka får dybde. near/far
  // settes dynamisk i fitCamera (forankret til kamera-avstanden, ikke origo),
  // så heroen alltid ligger foran tåka uansett skjermformat.
  scene.fog = new THREE.Fog(CONFIG.bg, 1, 10)

  const camera = new THREE.PerspectiveCamera(CONFIG.fov, 1, 0.1, 100)

  let renderer
  try {
    renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true })
  } catch (e) {
    console.warn('Hero-karusell: WebGL utilgjengelig, bruker statisk fallback.', e)
    return
  }
  renderer.setClearColor(CONFIG.bg, 0)
  const maxAniso = renderer.capabilities.getMaxAnisotropy()

  // ---- Løkka -----------------------------------------------------------
  const loop = new THREE.Group()
  scene.add(loop)

  // Hjørneradius uttrykt i andel av panelhøyden -> andel av alpha-lerretets høyde.
  const alphaMap = makeRoundedRectAlpha(CONFIG.cornerRadius)
  const loader = new THREE.TextureLoader()
  const panels = []

  for (const slot of SLOTS) {
    if (!slot.image) continue

    const geo = new THREE.CylinderGeometry(
      CONFIG.radius, CONFIG.radius, panelH,
      64, 1, true,
      slot.angle - CONFIG.panelArc / 2, CONFIG.panelArc
    )

    const tex = loader.load(slot.image, () => render())
    tex.colorSpace = THREE.SRGBColorSpace
    tex.anisotropy = maxAniso

    const mat = new THREE.MeshBasicMaterial({
      map: tex,
      alphaMap,
      transparent: true,
      side: THREE.DoubleSide,
      toneMapped: false,
    })

    const mesh = new THREE.Mesh(geo, mat)
    loop.add(mesh)
    panels.push(mesh)
  }

  // Myk kontaktskygge under løkka -- en flat ellipse med radial toning.
  const shadow = new THREE.Mesh(
    new THREE.PlaneGeometry(chord * 1.5, CONFIG.radius * 1.7),
    new THREE.MeshBasicMaterial({
      map: makeRadialShadow(), transparent: true, opacity: 0.22,
      depthWrite: false, color: 0x4a3b2a, toneMapped: false,
    })
  )
  shadow.rotation.x = -Math.PI / 2
  shadow.position.y = -panelH / 2 - 0.05
  shadow.position.z = CONFIG.radius * 0.15
  scene.add(shadow)

  // ---- Fast ramme: projiser front-panelets omriss til stage-piksler ---
  // Den faste "skjermen" er nå et DOM-element (.hero-frame) som bærer
  // gradienten + teksten. Her regner vi ut hvor front-panelet faktisk havner
  // på skjermen og skriver det som CSS-variabler -- så DOM-rammen ankrer seg
  // til den EKTE geometrien, riktig på alle skjermbredder (ingen vw-gjetting).
  const _v = new THREE.Vector3()
  function updateFrameVars() {
    const w = stage.clientWidth, h = stage.clientHeight
    if (!w || !h) return
    camera.updateMatrixWorld()
    const halfArc = CONFIG.panelArc / 2
    const halfH = panelH / 2
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity
    // Sampl topp- og bunnkanten på tvers av bue (fanger "buk"-en ved theta=0).
    for (let i = 0; i <= 8; i++) {
      const th = -halfArc + (i / 8) * CONFIG.panelArc
      const x = CONFIG.radius * Math.sin(th)
      const z = CONFIG.radius * Math.cos(th)
      for (const y of [-halfH, halfH]) {
        _v.set(x, y, z).project(camera)
        const px = (_v.x * 0.5 + 0.5) * w
        const py = (-_v.y * 0.5 + 0.5) * h
        if (px < minX) minX = px
        if (px > maxX) maxX = px
        if (py < minY) minY = py
        if (py > maxY) maxY = py
      }
    }
    const inset = CONFIG.frameInsetPx
    stage.style.setProperty('--frame-x', (minX + inset) + 'px')
    stage.style.setProperty('--frame-y', (minY + inset) + 'px')
    stage.style.setProperty('--frame-w', (maxX - minX - inset * 2) + 'px')
    stage.style.setProperty('--frame-h', (maxY - minY - inset * 2) + 'px')
  }

  // ---- Kamera-avstand ------------------------------------------------
  // Landskap: bredden binder (heroen fyller ~heroWidthFrac av lerretet).
  // Portrett/mobil: høyden binder (heroWidthFrac ville skjøvet kamera så
  // langt bak at heroen forsvant i tåka). Tåka forankres til kamera-
  // avstanden etterpå, så heroen alltid ligger klar av den.
  function fitCamera(viewportAspect) {
    const vFov = THREE.MathUtils.degToRad(CONFIG.fov)
    const hFov = 2 * Math.atan(Math.tan(vFov / 2) * viewportAspect)
    const frontZ = CONFIG.radius * Math.cos(CONFIG.panelArc / 2)

    const wFrac = viewportAspect >= 1 ? CONFIG.heroWidthFrac : CONFIG.heroWidthFracPortrait
    const distW = ((chord / 2) / wFrac) / Math.tan(hFov / 2)
    const distH = ((panelH / 2) / CONFIG.heroHeightFrac) / Math.tan(vFov / 2)
    const dist = Math.max(distW, distH)

    const camZ = frontZ + dist
    camera.position.set(0, 0, camZ)
    camera.lookAt(0, 0, 0)

    // Heroens fremste punkt ligger i z = radius (avstand camZ - radius).
    // near litt foran det, far like bak løkkas senter.
    scene.fog.near = camZ - CONFIG.radius * 0.40
    scene.fog.far = camZ + CONFIG.radius * 0.95
  }

  // ---- Rotasjonstilstand ---------------------------------------------
  let targetAngle = 0
  let renderAngle = reduced ? 0 : 0.32   // liten overrotasjon som "setter seg" ved oppstart
  let opacity = reduced ? 1 : 0
  let idle = true
  let ready = false

  const filledAngles = SLOTS.filter(s => s.image).map(s => -s.angle) // rotation.y som setter slotten front

  function nearestFilled(a) {
    let best = a, bestD = Infinity
    for (const base of filledAngles) {
      // nærmeste ekvivalent modulo 2pi
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
      // land bare på en fylt slot
      const snapped = nearestFilled(a)
      if (Math.abs(snapped - a) < 1e-3) { targetAngle = snapped; wake(); return }
    }
    targetAngle = nearestFilled(a); wake()
  }

  // ---- Interaksjon ---------------------------------------------------
  // Sveip = ett steg (samme overgang som pilene). Fri rotasjon er droppet:
  // panelene spenner smalere enn slot-avstanden, så en fri drag åpner en
  // stor cream-glipe mellom bildene midt i svingen. Under terskelen gir
  // løkka bare et lite "etter" som visuell kvittering, så snapper tilbake.
  let dragging = false, startX = 0, swiped = false

  canvas.addEventListener('pointerdown', e => {
    dragging = true; swiped = false; startX = e.clientX
    canvas.setPointerCapture(e.pointerId)
    canvas.style.cursor = 'grabbing'
  })
  canvas.addEventListener('pointermove', e => {
    if (!dragging || swiped) return
    const dx = e.clientX - startX
    if (Math.abs(dx) >= CONFIG.swipePx) {
      swiped = true
      canvas.style.cursor = 'grab'
      step(dx < 0 ? -1 : 1)          // dra mot venstre = neste bilde
    } else {
      renderAngle = targetAngle +
        THREE.MathUtils.clamp(dx * CONFIG.dragGive, -CONFIG.dragGiveMax, CONFIG.dragGiveMax)
      wake()
    }
  })
  function endDrag() {
    if (!dragging) return
    dragging = false
    canvas.style.cursor = 'grab'
    if (!swiped) wake()              // targetAngle urørt -> ease snapper tilbake
  }
  canvas.addEventListener('pointerup', endDrag)
  canvas.addEventListener('pointercancel', endDrag)

  stage.querySelector('.carousel-nav--prev')?.addEventListener('click', () => step(1))
  stage.querySelector('.carousel-nav--next')?.addEventListener('click', () => step(-1))

  addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft') step(1)
    else if (e.key === 'ArrowRight') step(-1)
  })

  // ---- Render-løkke: kjører bare når noe faktisk beveger seg ---------
  let raf = null
  function wake() { idle = false; if (!raf) raf = requestAnimationFrame(tick) }

  function tick() {
    raf = null
    renderAngle += (targetAngle - renderAngle) * CONFIG.ease
    if (opacity < 1) opacity = Math.min(1, opacity + 0.06)

    const settled = Math.abs(targetAngle - renderAngle) < 0.0004 && opacity >= 1
    if (settled) { renderAngle = targetAngle; idle = true }

    render()
    // Karusellen står nå og maler -> slå av den statiske fallback-en.
    if (!ready && opacity >= 1) { ready = true; stage.classList.add('is-ready') }
    if (!idle || dragging) raf = requestAnimationFrame(tick)
  }

  function render() {
    loop.rotation.y = renderAngle
    for (const p of panels) p.material.opacity = opacity
    shadow.material.opacity = 0.22 * opacity
    renderer.render(scene, camera)
  }

  // ---- Resize -------------------------------------------------------
  function resize() {
    const w = stage.clientWidth
    const h = stage.clientHeight
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2))
    renderer.setSize(w, h, false)
    camera.aspect = w / h
    fitCamera(w / h)
    camera.updateProjectionMatrix()
    updateFrameVars()
    render()
  }
  const ro = new ResizeObserver(resize)
  ro.observe(stage)
  resize()
  wake()

  const api = {
    step, resize,
    _state: () => ({ targetAngle, renderAngle, opacity, idle, dragging, ready, panels: panels.length }),
    _set: (o) => { if (o.opacity != null) opacity = o.opacity; if (o.targetAngle != null) targetAngle = o.targetAngle; if (o.renderAngle != null) renderAngle = o.renderAngle; render() },
    _tick: () => tick(),
    _render: () => render(),
  }
  // Dev-håndtak kun lokalt -- rAF strupes i automatiseringsfaner, så _tick/_render
  // lar QA pumpe animasjonen manuelt. Aldri eksponert i produksjon.
  if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
    window.__cx = api
  }
  return api
}

// Hvit avrundet rektangel på svart -- brukes som alphaMap (grønn kanal).
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

// Radial svart→gjennomsiktig, myk kontaktskygge.
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
