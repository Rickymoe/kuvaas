# Kuvaas Nettside-redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bygge en varm, moderne statisk redesign av kuvaas.no (Tannklinikken Jack Kuvaas AS) — 5 sider, ekte innhold/bilder gjenbrukt fra originalsiden — som del av en gratis pitch-strategi overfor klinikken.

**Architecture:** Ren statisk HTML/CSS/JS, ingen build-steg, ingen rammeverk. Delt header/footer/navigasjon lastes inn på hver side via en liten `fetch()`-basert JS-loader (`js/main.js`) som henter `partials/header.html` og `partials/footer.html` inn i faste `<div>`-plassholdere. Samme designmønster som referanseprosjektet HUT (`/home/ricky/Dokumenter/Koding/HUT`), men med delt include i stedet for duplisert markup per side.

**Tech Stack:** HTML5, CSS3 (CSS custom properties, ingen preprosessor), vanilla JavaScript (ingen npm-avhengigheter), Formspree for kontaktskjema, Python `http.server` for lokal verifisering.

## Global Constraints

- Ingen build-steg, ingen npm/node-avhengigheter, ingen JS-rammeverk — kun statiske filer som kan åpnes direkte av en nettleser via en enkel HTTP-server.
- Alt UI-tekst er på norsk bokmål, i samme tone som kuvaas.no.
- Alt tekstinnhold og alle bilder er ekte, hentet direkte fra kuvaas.no (bekreftet med `curl` + nettleser-User-Agent 2026-07-01) — ingen oppdiktet innhold, ingen "lorem ipsum".
- Fargepalett: `--cream:#FDF6EC`, `--cream-deep:#F1DFC7`, `--terracotta:#C6805A`, `--terracotta-dark:#A6653F`, `--brown:#4A3B2A`, `--brown-soft:#6b5842`. Serif-overskrifter: `Georgia, 'Times New Roman', serif`. Sans-serif brødtekst: systemfont-stack (ingen ekstern Google Fonts-avhengighet).
- Naviger ALDRI med bar `padding: 0 ...`-shorthand på et element med klassen `.wrap` eller en `.wrap`-etterkommer — det nullstiller den horisontale mobil-paddingen (kjent bug fra HUT-prosjektet). Bruk `padding-top`/`padding-bottom` når vertikal spacing skal justeres på et `.wrap`-element.
- `git push` til GitHub skjer KUN i Task 11, og kun etter eksplisitt bekreftelse fra brukeren i chatten — ikke automatiser dette steget.
- Formspree-skjema-ID finnes ikke ved planens skriving — Task 9 inneholder et eksplisitt steg for å innhente denne fra brukeren før koden kan fullføres.

---

## Task 1: Prosjektoppsett, mappestruktur og git init

**Files:**
- Create: `/home/ricky/Dokumenter/Koding/Kuvaas/.gitignore`
- Create (empty dirs via placeholder structure): `css/`, `js/`, `partials/`, `Bilder/`, `Bilder/team/`

**Interfaces:**
- Produces: prosjektrot `/home/ricky/Dokumenter/Koding/Kuvaas` som et initialisert git-repo med riktig mappestruktur, klar for at senere tasks kan legge til filer.

- [ ] **Step 1: Opprett mappestruktur**

```bash
cd /home/ricky/Dokumenter/Koding/Kuvaas
mkdir -p css js partials Bilder/team docs/superpowers/plans
```

- [ ] **Step 2: Skriv .gitignore**

```
.superpowers/
.DS_Store
Thumbs.db
```

Lagre som `/home/ricky/Dokumenter/Koding/Kuvaas/.gitignore`.

- [ ] **Step 3: git init og første commit**

```bash
cd /home/ricky/Dokumenter/Koding/Kuvaas
git init
git add .gitignore docs/superpowers/plans/2026-07-01-kuvaas-redesign.md
git commit -m "Initial project scaffold and implementation plan"
```

- [ ] **Step 4: Verifiser**

```bash
git -C /home/ricky/Dokumenter/Koding/Kuvaas status
git -C /home/ricky/Dokumenter/Koding/Kuvaas log --oneline
ls -la /home/ricky/Dokumenter/Koding/Kuvaas
```

Forventet: `git status` viser "nothing to commit, working tree clean" (bortsett fra de tomme mappene som git ikke sporer ennå), log viser én commit, og `css/ js/ partials/ Bilder/ Bilder/team/` finnes.

---

## Task 2: CSS-designsystem (css/style.css)

**Files:**
- Create: `css/style.css`

**Interfaces:**
- Produces: CSS custom properties (`--cream`, `--cream-deep`, `--terracotta`, `--terracotta-dark`, `--brown`, `--brown-soft`, `--line`, `--serif`, `--sans`) og gjenbrukbare klasser (`.wrap`, `.nav`, `.nav-links`, `.nav-cta`, `.nav-hamburger`, `.hero`, `.eyebrow`, `.lead`, `.btn`, `.btn-terracotta`, `.btn-outline`, `.section`, `.section-head`, `.link-all`, `.service-row`, `.service-card`, `.about-grid`, `.about-photo`, `.about-text`, `.price-teaser-grid`, `.price-row`, `.price-cat`, `.price-list`, `.treatment-block`, `.team-grid`, `.team-card`, `.page-hero`, `.footer`, `.footer-grid`, `.form-card`, `.form-group`, `.form-row`, `.kontakt-grid`, `.kontakt-info`, `.kinfo-box`, `.reveal`) som alle senere page-tasks konsumerer.
- Consumes: ingenting (første stilark).

- [ ] **Step 1: Skriv css/style.css**

```css
:root {
  --cream: #FDF6EC;
  --cream-deep: #F1DFC7;
  --terracotta: #C6805A;
  --terracotta-soft: #D89572;
  --terracotta-dark: #A6653F;
  --brown: #4A3B2A;
  --brown-soft: #6b5842;
  --line: rgba(74,59,42,.16);
  --serif: Georgia, 'Times New Roman', serif;
  --sans: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
}
*, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }
html { scroll-behavior: smooth; }
body {
  background: var(--cream);
  color: var(--brown);
  font-family: var(--sans);
  line-height: 1.6;
  -webkit-font-smoothing: antialiased;
  overflow-x: hidden;
}
a { text-decoration: none; color: inherit; }
img { max-width: 100%; display: block; }

/* Layout */
.wrap { max-width: 1180px; margin: 0 auto; padding: 0 32px; }
@media (max-width: 640px) {
  .wrap { padding: 0 20px; }
}

.eyebrow {
  font-size: 12px; font-weight: 600; letter-spacing: .18em; text-transform: uppercase;
  color: var(--terracotta-dark); display: inline-block; margin-bottom: 10px;
}
.lead { font-size: 1.05rem; color: var(--brown-soft); max-width: 560px; margin-top: 14px; }

/* Buttons */
.btn {
  display: inline-block; font-size: 14px; font-weight: 600; padding: 14px 26px;
  border-radius: 100px; cursor: pointer; border: 1px solid transparent;
  transition: transform .2s, background .2s, color .2s; text-align: center;
}
.btn:hover { transform: translateY(-2px); }
.btn-terracotta { background: var(--terracotta); color: #fff; }
.btn-terracotta:hover { background: var(--terracotta-dark); }
.btn-outline { background: transparent; border-color: var(--terracotta); color: var(--terracotta-dark); }
.btn-outline:hover { background: var(--cream-deep); }

/* Sections */
.section { padding-top: 70px; padding-bottom: 70px; border-top: 1px solid var(--line); }
.section-head { display: flex; align-items: baseline; justify-content: space-between; flex-wrap: wrap; gap: 12px; margin-bottom: 40px; }
.section-head h2 { font-family: var(--serif); font-weight: 600; font-size: clamp(1.6rem, 3vw, 2.2rem); }
.link-all { font-size: 14px; font-weight: 600; color: var(--terracotta-dark); display: inline-flex; align-items: center; gap: 6px; transition: gap .2s; }
.link-all:hover { gap: 10px; }
.section-note { margin-top: 20px; font-size: 14px; color: var(--brown-soft); }

/* Reveal-animasjon */
.reveal { opacity: 0; transform: translateY(40px); transition: opacity .8s cubic-bezier(.2,.7,.2,1), transform .8s cubic-bezier(.2,.7,.2,1); }
.reveal.visible { opacity: 1; transform: none; }

/* ===== Nav ===== */
.nav {
  position: sticky; top: 0; z-index: 50;
  background: rgba(253,246,236,.92); backdrop-filter: blur(14px);
  border-bottom: 1px solid var(--line);
}
.nav .wrap { display: flex; align-items: center; justify-content: space-between; height: 80px; gap: 24px; }
.nav-logo img { height: 40px; }
.nav-links { list-style: none; display: flex; gap: 28px; align-items: center; }
.nav-links a {
  font-size: 14px; font-weight: 600; color: var(--brown); padding: 6px 0;
  border-bottom: 2px solid transparent; transition: border-color .2s;
}
.nav-links a:hover, .nav-links a.active { border-color: var(--terracotta); }
.nav-cta {
  background: var(--terracotta); color: #fff !important; padding: 10px 22px;
  border-radius: 100px; font-size: 14px; font-weight: 600; transition: background .2s;
}
.nav-cta:hover, .nav-cta.active { background: var(--terracotta-dark); }
.nav-hamburger {
  display: none; flex-direction: column; gap: 5px; background: none; border: none;
  cursor: pointer; padding: 8px;
}
.nav-hamburger span { width: 22px; height: 2px; background: var(--brown); display: block; }

@media (max-width: 900px) {
  .nav-links {
    position: fixed; top: 80px; left: 0; right: 0; background: var(--cream);
    flex-direction: column; align-items: flex-start; padding: 24px 32px; gap: 18px;
    border-bottom: 1px solid var(--line); display: none;
  }
  .nav-links.open { display: flex; }
  .nav-hamburger { display: flex; }
}

/* ===== Hero ===== */
.hero { padding-top: 100px; padding-bottom: 80px; background: linear-gradient(135deg, var(--cream-deep), var(--cream)); border-bottom: 1px solid var(--line); }
.hero h1 { font-family: var(--serif); font-style: italic; font-weight: 600; font-size: clamp(2rem, 5vw, 3.2rem); color: var(--brown); line-height: 1.15; }
.hero-cta { display: flex; gap: 14px; margin-top: 30px; flex-wrap: wrap; }

.page-hero { padding-top: 60px; padding-bottom: 40px; }
.page-hero h1 { font-family: var(--serif); font-style: italic; font-weight: 600; font-size: clamp(1.8rem, 4vw, 2.6rem); color: var(--brown); }

/* ===== Service row (forside) ===== */
.service-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; }
.service-card { background: #fff; border: 1px solid var(--line); border-radius: 16px; padding: 30px; }
.service-card .num { font-family: var(--serif); font-style: italic; color: var(--terracotta-dark); font-size: 14px; margin-bottom: 14px; }
.service-card h3 { font-family: var(--serif); font-size: 1.2rem; margin-bottom: 10px; }
.service-card p { font-size: 14px; color: var(--brown-soft); line-height: 1.65; }
@media (max-width: 860px) { .service-row { grid-template-columns: 1fr; } }

/* ===== About/trust grid (forside) ===== */
.about-grid { display: grid; grid-template-columns: 380px 1fr; gap: 48px; align-items: center; }
.about-photo { width: 100%; border-radius: 20px; object-fit: cover; aspect-ratio: 4/3; }
.about-text h2 { font-family: var(--serif); font-weight: 600; font-size: clamp(1.6rem, 3vw, 2.2rem); margin: 8px 0 18px; }
.about-text p { margin-bottom: 14px; color: var(--brown-soft); line-height: 1.75; }
@media (max-width: 860px) { .about-grid { grid-template-columns: 1fr; } }

/* ===== Priser ===== */
.price-teaser-grid, .price-list { display: flex; flex-direction: column; gap: 2px; background: var(--line); border-radius: 12px; overflow: hidden; }
.price-row { display: flex; justify-content: space-between; gap: 16px; background: #fff; padding: 16px 22px; font-size: 15px; }
.price-row strong { color: var(--terracotta-dark); white-space: nowrap; }
.price-cat { margin-bottom: 36px; }
.price-cat h3 { font-family: var(--serif); font-size: 1.3rem; margin-bottom: 14px; color: var(--terracotta-dark); }

/* ===== Behandlinger ===== */
.treatment-block { padding: 28px 0; border-bottom: 1px solid var(--line); }
.treatment-block:last-child { border-bottom: none; }
.treatment-block h3 { font-family: var(--serif); font-size: 1.25rem; margin-bottom: 10px; }
.treatment-block p { color: var(--brown-soft); line-height: 1.75; margin-bottom: 10px; }
.treatment-block p:last-child { margin-bottom: 0; }

/* ===== Team (om oss) ===== */
.team-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 24px; margin-top: 20px; }
.team-card { background: #fff; border: 1px solid var(--line); border-radius: 16px; overflow: hidden; text-align: center; }
.team-card img { width: 100%; aspect-ratio: 1/1; object-fit: cover; }
.team-card .team-body { padding: 18px; }
.team-card .role { font-size: 11px; text-transform: uppercase; letter-spacing: .08em; color: var(--terracotta-dark); margin-bottom: 6px; }
.team-card h3 { font-family: var(--serif); font-size: 1.05rem; }
.team-card .badge { font-size: 12px; color: var(--brown-soft); margin-top: 6px; }
.team-group-title { font-family: var(--serif); font-size: 1.3rem; margin: 40px 0 4px; color: var(--terracotta-dark); }
.team-group-title:first-of-type { margin-top: 10px; }

/* ===== Footer ===== */
.footer { background: var(--brown); color: var(--cream); padding: 60px 0 26px; }
.footer-grid { display: grid; grid-template-columns: 1.4fr 1fr 1fr; gap: 40px; margin-bottom: 36px; }
.footer h4 { font-size: 12px; letter-spacing: .14em; text-transform: uppercase; color: var(--terracotta-soft); margin-bottom: 14px; }
.footer ul { list-style: none; display: flex; flex-direction: column; gap: 8px; }
.footer a { color: var(--cream); opacity: .85; }
.footer a:hover { opacity: 1; text-decoration: underline; }
.footer-logo img { height: 40px; margin-bottom: 14px; filter: brightness(0) invert(1); }
.footer-brand p { font-size: 14px; opacity: .8; max-width: 320px; }
.footer-bottom { display: flex; justify-content: space-between; flex-wrap: wrap; gap: 10px; padding-top: 22px; border-top: 1px solid rgba(253,246,236,.15); font-size: 13px; opacity: .75; }
@media (max-width: 760px) { .footer-grid { grid-template-columns: 1fr; } }

/* ===== Kontaktskjema ===== */
.kontakt-grid { display: grid; grid-template-columns: 1fr 380px; gap: 48px; align-items: start; }
.form-card { background: #fff; border: 1px solid var(--line); border-radius: 20px; padding: 40px; }
.form-card h2 { font-family: var(--serif); font-weight: 600; font-size: 1.5rem; margin-bottom: 26px; }
.form-group { margin-bottom: 18px; }
.form-group label { display: block; font-size: 13px; font-weight: 600; color: var(--brown-soft); margin-bottom: 8px; letter-spacing: .03em; }
.form-group input, .form-group select, .form-group textarea {
  width: 100%; padding: 13px 16px; border: 1px solid var(--line); border-radius: 10px;
  font-family: var(--sans); font-size: 15px; color: var(--brown); background: var(--cream);
  outline: none; appearance: none; transition: border-color .2s, box-shadow .2s;
}
.form-group input:focus, .form-group select:focus, .form-group textarea:focus {
  border-color: var(--terracotta); box-shadow: 0 0 0 3px rgba(198,128,90,.18);
}
.form-group textarea { resize: vertical; min-height: 120px; }
.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.form-submit { width: 100%; margin-top: 6px; }
.form-note { font-size: 12px; color: var(--brown-soft); margin-top: 12px; text-align: center; }
.form-error { display: none; background: #fdeee8; border: 1px solid #e8b79c; border-radius: 10px; padding: 12px 16px; font-size: 14px; color: #8a3d1f; margin-bottom: 20px; }
.form-error.visible { display: block; }
button:disabled { opacity: .6; cursor: not-allowed; }
.form-success { display: none; text-align: center; padding: 30px 0; }
.form-success .check { width: 54px; height: 54px; background: var(--cream-deep); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px; }
.form-success .check svg { width: 26px; height: 26px; fill: var(--terracotta-dark); }
.form-success h3 { font-family: var(--serif); font-size: 1.3rem; margin-bottom: 8px; }
.form-success p { font-size: 14px; color: var(--brown-soft); }

.kontakt-info { display: flex; flex-direction: column; gap: 20px; }
.kinfo-box { background: #fff; border: 1px solid var(--line); border-radius: 16px; padding: 24px; }
.kinfo-box h4 { font-size: 12px; font-weight: 600; letter-spacing: .14em; text-transform: uppercase; color: var(--brown-soft); margin-bottom: 12px; }
.kinfo-row { display: flex; align-items: flex-start; gap: 10px; margin-bottom: 10px; }
.kinfo-row:last-child { margin-bottom: 0; }
.kinfo-row span { font-size: 15px; line-height: 1.5; }
.kinfo-row a { color: var(--terracotta-dark); font-weight: 600; }

@media (max-width: 860px) {
  .kontakt-grid { grid-template-columns: 1fr; gap: 32px; }
  .kontakt-info { order: -1; }
}
@media (max-width: 500px) {
  .form-row { grid-template-columns: 1fr; }
  .form-card { padding: 26px 20px; }
}
```

- [ ] **Step 2: Verifiser at filen er komplett og gyldig**

```bash
cd /home/ricky/Dokumenter/Koding/Kuvaas
grep -c "^" css/style.css
grep -E -- "--terracotta:|--cream:|--brown:" css/style.css
python3 -c "
content = open('css/style.css').read()
assert content.count('{') == content.count('}'), 'ubalanserte krøllparenteser'
print('OK: balanserte krøllparenteser,', content.count('{'), 'regler')
"
```

Forventet: ingen feil, script printer "OK: balanserte krøllparenteser, N regler".

- [ ] **Step 3: Commit**

```bash
cd /home/ricky/Dokumenter/Koding/Kuvaas
git add css/style.css
git commit -m "Add warm/reassuring CSS design system"
```

---

## Task 3: Hent ekte bilder fra kuvaas.no

**Files:**
- Create: `Bilder/logo.png`, `Bilder/tillit-linda.jpg`, `Bilder/team/charlotte-damler.jpg`, `Bilder/team/amanda-andresen.jpg`, `Bilder/team/arsalan-qayoom.jpg`, `Bilder/team/jannike-lillemo-diesen.jpg`, `Bilder/team/tone-fredriksen.jpg`, `Bilder/team/frida-fevang.jpg`, `Bilder/team/linda-hallingrod.jpg`, `Bilder/team/celine-hansen.jpg`, `Bilder/team/emilie-larsen.jpg`

**Interfaces:**
- Produces: bildefiler som Task 5 (forside), Task 8 (om oss) og Task 4 (header/footer-logo) refererer til med disse eksakte relative stiene.

Disse URL-ene er verifisert å returnere ekte JPEG/PNG-innhold 2026-07-01 (krever en nettleser-lik User-Agent — kuvaas.no blokkerer forespørsler med curl sin standard User-Agent).

- [ ] **Step 1: Last ned logo og forsidebilde**

```bash
cd /home/ricky/Dokumenter/Koding/Kuvaas
UA="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36"
curl -s -A "$UA" "https://kuvaas.no/wp-content/uploads/2020/11/Tannklinikken-Jack-Kuvaas-Logo-300x96.png" -o Bilder/logo.png
curl -s -A "$UA" "https://kuvaas.no/wp-content/uploads/2025/07/Linda-Hjerte-1024x768.jpg" -o Bilder/tillit-linda.jpg
```

- [ ] **Step 2: Last ned de 9 ekte teamportrettene**

```bash
cd /home/ricky/Dokumenter/Koding/Kuvaas
UA="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36"
curl -s -A "$UA" "https://kuvaas.no/wp-content/uploads/2026/01/IMG_3940-1-scaled.jpeg" -o Bilder/team/charlotte-damler.jpg
curl -s -A "$UA" "https://kuvaas.no/wp-content/uploads/2026/01/IMG_7741-scaled.jpeg" -o Bilder/team/amanda-andresen.jpg
curl -s -A "$UA" "https://kuvaas.no/wp-content/uploads/2026/01/A1AC0FB8-DAB7-44D6-9B1C-5B9173CBBBBF.jpeg" -o Bilder/team/arsalan-qayoom.jpg
curl -s -A "$UA" "https://kuvaas.no/wp-content/uploads/2025/07/Jannike-scaled.jpg" -o Bilder/team/jannike-lillemo-diesen.jpg
curl -s -A "$UA" "https://kuvaas.no/wp-content/uploads/2026/01/BD92E38F-B991-42E5-BB7A-B9B5662A41FA.jpeg" -o Bilder/team/tone-fredriksen.jpg
curl -s -A "$UA" "https://kuvaas.no/wp-content/uploads/2026/01/4114CD1D-6721-48ED-BC7B-5AC064A78F3F.jpeg" -o Bilder/team/frida-fevang.jpg
curl -s -A "$UA" "https://kuvaas.no/wp-content/uploads/2026/01/971E45A8-2311-4114-877D-61AC6F253A61.jpeg" -o Bilder/team/linda-hallingrod.jpg
curl -s -A "$UA" "https://kuvaas.no/wp-content/uploads/2026/01/6D26497C-49AB-49F2-9364-D72F9E3D4037.jpeg" -o Bilder/team/celine-hansen.jpg
curl -s -A "$UA" "https://kuvaas.no/wp-content/uploads/2026/01/FullSizeRender.jpeg" -o Bilder/team/emilie-larsen.jpg
```

- [ ] **Step 3: Verifiser at alle filene er gyldige bilder (ikke tomme/feilsider)**

```bash
cd /home/ricky/Dokumenter/Koding/Kuvaas
for f in Bilder/logo.png Bilder/tillit-linda.jpg Bilder/team/*.jpg; do
  file "$f"
done
find Bilder -type f -size -1k
```

Forventet: `file` rapporterer "PNG image data" for logo.png og "JPEG image data" for alle .jpg-filene. Den siste kommandoen (finn filer under 1KB — tegn på en feilside i stedet for et bilde) skal ikke gi noen treff.

- [ ] **Step 4: Commit**

```bash
cd /home/ricky/Dokumenter/Koding/Kuvaas
git add Bilder/
git commit -m "Add real logo, trust photo, and team portraits from kuvaas.no"
```

---

## Task 4: Delt header/footer og include-mekanisme

**Files:**
- Create: `partials/header.html`
- Create: `partials/footer.html`
- Create: `js/main.js`

**Interfaces:**
- Consumes: `Bilder/logo.png` (fra Task 3), CSS-klasser `.nav`, `.nav-links`, `.nav-cta`, `.nav-hamburger`, `.footer`, `.footer-grid`, `.reveal` (fra Task 2).
- Produces: `loadPartial(url, targetId)`, `initNav()`, `initReveal()` — JS-funksjoner i `js/main.js`. Hver side (Task 5–9) MÅ inneholde `<div id="site-header"></div>` og `<div id="site-footer"></div>` som mål for injeksjonen, et `<body data-page="X">`-attributt der `X` er én av `hjem|behandlinger|priser|om-oss|kontakt`, og et `<script src="js/main.js"></script>` rett før `</body>`.

- [ ] **Step 1: Skriv partials/header.html**

```html
<nav class="nav">
  <div class="wrap">
    <a href="index.html" class="nav-logo"><img src="Bilder/logo.png" alt="Tannklinikken Jack Kuvaas AS"></a>
    <ul class="nav-links">
      <li><a href="index.html" data-page="hjem">Hjem</a></li>
      <li><a href="behandlinger.html" data-page="behandlinger">Behandlinger</a></li>
      <li><a href="priser.html" data-page="priser">Priser</a></li>
      <li><a href="om-oss.html" data-page="om-oss">Om oss</a></li>
    </ul>
    <a href="kontakt.html" class="nav-cta" data-page="kontakt">Kontakt</a>
    <button class="nav-hamburger" aria-label="Meny" aria-expanded="false"><span></span><span></span><span></span></button>
  </div>
</nav>
```

- [ ] **Step 2: Skriv partials/footer.html**

```html
<footer class="footer">
  <div class="wrap">
    <div class="footer-grid">
      <div class="footer-brand">
        <div class="footer-logo"><img src="Bilder/logo.png" alt="Tannklinikken Jack Kuvaas AS"></div>
        <p>Din tannlege på bryggen i Holmestrand – trygg, skånsom behandling og personlig oppfølging.</p>
      </div>
      <div class="footer-col">
        <h4>Utforsk</h4>
        <ul>
          <li><a href="behandlinger.html">Behandlinger</a></li>
          <li><a href="priser.html">Priser</a></li>
          <li><a href="om-oss.html">Om oss</a></li>
          <li><a href="kontakt.html">Kontakt</a></li>
        </ul>
      </div>
      <div class="footer-col">
        <h4>Kontakt</h4>
        <ul>
          <li><a href="tel:+4733052350">33 05 23 50</a></li>
          <li><a href="mailto:tannlege@kuvaas.no">tannlege@kuvaas.no</a></li>
          <li>Havnegaten 7, 3080 Holmestrand</li>
          <li><a href="https://www.facebook.com/TannklinikkenJackKuvaas" target="_blank" rel="noopener">Facebook</a></li>
        </ul>
      </div>
    </div>
    <div class="footer-bottom">
      <small>© 2026 Tannklinikken Jack Kuvaas AS</small>
      <small>Man–Fre 08:00–15:30</small>
    </div>
  </div>
</footer>
```

- [ ] **Step 3: Skriv js/main.js**

```javascript
document.addEventListener('DOMContentLoaded', async () => {
  await Promise.all([
    loadPartial('partials/header.html', 'site-header'),
    loadPartial('partials/footer.html', 'site-footer')
  ]);
  initNav();
  initReveal();
});

async function loadPartial(url, targetId) {
  const target = document.getElementById(targetId);
  if (!target) return;
  try {
    const res = await fetch(url);
    target.innerHTML = await res.text();
  } catch (err) {
    console.error('Kunne ikke laste ' + url, err);
  }
}

function initNav() {
  const currentPage = document.body.dataset.page;
  document.querySelectorAll('#site-header a[data-page]').forEach(link => {
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
  const io = new IntersectionObserver(entries => {
    entries.forEach((entry, i) => {
      if (entry.isIntersecting) {
        setTimeout(() => entry.target.classList.add('visible'), i * 60);
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08 });
  document.querySelectorAll('.reveal').forEach(el => io.observe(el));
}
```

- [ ] **Step 4: Verifiser med et minimalt testoppsett**

Lag en midlertidig testfil for å bekrefte at include-mekanismen faktisk fungerer i en nettleser før noen ordentlig side finnes:

```bash
cd /home/ricky/Dokumenter/Koding/Kuvaas
cat > /tmp/test-include.html <<'EOF'
<!DOCTYPE html>
<html lang="nb">
<head><meta charset="UTF-8"><link rel="stylesheet" href="css/style.css"></head>
<body data-page="hjem">
<div id="site-header"></div>
<p style="padding:40px">Testinnhold</p>
<div id="site-footer"></div>
<script src="js/main.js"></script>
</body>
</html>
EOF
cp /tmp/test-include.html test-include.html
python3 -m http.server 8010 >/tmp/kuvaas-server.log 2>&1 &
sleep 1
curl -s http://localhost:8010/test-include.html | grep -q "site-header" && echo "OK: rå HTML har plassholder"
curl -s http://localhost:8010/partials/header.html | grep -q "Tannklinikken Jack Kuvaas" && echo "OK: header.html serveres og inneholder logo-alt-tekst"
curl -s http://localhost:8010/partials/footer.html | grep -q "33 05 23 50" && echo "OK: footer.html serveres og inneholder telefonnummer"
```

Åpne deretter `http://localhost:8010/test-include.html` i en nettleser (bruk claude-in-chrome-verktøyet) og ta et skjermbilde — bekreft at navigasjonsmenyen og footeren faktisk vises injisert på siden (ikke bare tomme div-er), og at mobilmenyen (endre vindusbredde til <900px) åpner/lukker ved klikk på hamburger-knappen.

Rydd opp testfilen etterpå:

```bash
kill %1 2>/dev/null
rm /home/ricky/Dokumenter/Koding/Kuvaas/test-include.html /tmp/test-include.html
```

- [ ] **Step 5: Commit**

```bash
cd /home/ricky/Dokumenter/Koding/Kuvaas
git add partials/ js/main.js
git commit -m "Add shared header/footer partials and fetch-based include mechanism"
```

---

## Task 5: Forside (index.html)

**Files:**
- Create: `index.html`

**Interfaces:**
- Consumes: `css/style.css` (Task 2), `js/main.js` + `#site-header`/`#site-footer`-mønster (Task 4), `Bilder/tillit-linda.jpg` (Task 3).

- [ ] **Step 1: Skriv index.html**

```html
<!DOCTYPE html>
<html lang="nb">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Tannlege Holmestrand – Tannklinikken Jack Kuvaas AS</title>
<meta name="description" content="Din tannlege på bryggen i Holmestrand. Moderne tannklinikk med trygg og omsorgsfull behandling.">
<link rel="stylesheet" href="css/style.css">
</head>
<body data-page="hjem">

<div id="site-header"></div>

<section class="hero">
  <div class="wrap">
    <div class="eyebrow reveal">Tannklinikken Jack Kuvaas AS</div>
    <h1 class="reveal" style="transition-delay:.08s">Din tannlege på bryggen i Holmestrand</h1>
    <p class="lead reveal" style="transition-delay:.16s">Moderne tannklinikk med trygg og omsorgsfull behandling. Bestill tannlegetime hos oss i dag!</p>
    <div class="hero-cta reveal" style="transition-delay:.24s">
      <a href="tel:+4733052350" class="btn btn-terracotta">Bestill time – 33 05 23 50</a>
      <a href="behandlinger.html" class="btn btn-outline">Se behandlinger</a>
    </div>
  </div>
</section>

<section class="section wrap">
  <div class="section-head">
    <h2>Behandlinger vi tilbyr</h2>
    <a href="behandlinger.html" class="link-all">Se alle behandlinger →</a>
  </div>
  <p style="max-width:640px;color:var(--brown-soft);margin-bottom:32px">Vi legger stor vekt på at du skal få et behagelig besøk hos tannlegen. Vi har moderne utstyr og legger til rette for deg som har tannskrekk.</p>
  <div class="service-row">
    <div class="service-card reveal">
      <div class="num">01</div>
      <h3>Undersøkelse &amp; rens</h3>
      <p>Regelmessig kontroll med to røntgenbilder, kontroll av tenner og tannkjøtt, fjerning av tannstein, pussing og polering.</p>
    </div>
    <div class="service-card reveal" style="transition-delay:.08s">
      <div class="num">02</div>
      <h3>Tannfylling</h3>
      <p>Tannfarget fylling ved hull, frakturer eller nedslitte tenner. Du får alltid tilbud om lokalbedøvelse dersom du ønsker det.</p>
    </div>
    <div class="service-card reveal" style="transition-delay:.16s">
      <div class="num">03</div>
      <h3>Tannbleking</h3>
      <p>Hjemmebleking med skinner perfekt tilpasset dine tenner, for et friskere smil du kan friske opp igjen senere.</p>
    </div>
  </div>
</section>

<section class="section wrap section-about">
  <div class="about-grid">
    <img src="Bilder/tillit-linda.jpg" alt="Ansatt hos Tannklinikken Jack Kuvaas smiler og former et hjerte med hendene" class="about-photo reveal">
    <div class="about-text reveal" style="transition-delay:.1s">
      <div class="eyebrow">Trygghet i sentrum</div>
      <h2>En tannlege med omtanke for dine tenner</h2>
      <p>Hos oss møter du erfarne tannleger og omsorgsfulle assistenter som setter trygghet, skånsom behandling og personlig oppfølging i sentrum. Vi er i dag tre tannleger, én tannpleier og tre tannlegeassistenter som holder hus i Havnegaten i Holmestrand.</p>
      <p>Vi er stolte av å være medlem av Den Norske Tannlegeforening, og legger stor vekt på at du skal få et behagelig besøk – også om du har tannlegeskrekk.</p>
      <a href="om-oss.html" class="link-all">Møt teamet vårt →</a>
    </div>
  </div>
</section>

<section class="section wrap">
  <div class="section-head">
    <h2>Forutsigbare priser</h2>
    <a href="priser.html" class="link-all">Se full prisliste →</a>
  </div>
  <div class="price-teaser-grid">
    <div class="price-row reveal"><span>Undersøkelse inkl. 2 bilder og enkel rens</span><strong>kr 1.690,-</strong></div>
    <div class="price-row reveal" style="transition-delay:.06s"><span>Tannfarget fylling, 1 flate</span><strong>fra kr 1.290,-</strong></div>
    <div class="price-row reveal" style="transition-delay:.12s"><span>Rotfylling, 1 kanal</span><strong>kr 5.795,-</strong></div>
  </div>
  <p class="section-note">Vi gir alltid et tydelig og uforpliktende kostnadsoverslag før vi starter en behandling.</p>
</section>

<div id="site-footer"></div>
<script src="js/main.js"></script>
</body>
</html>
```

- [ ] **Step 2: Verifiser statisk innhold med lokal server**

```bash
cd /home/ricky/Dokumenter/Koding/Kuvaas
python3 -m http.server 8010 >/tmp/kuvaas-server.log 2>&1 &
sleep 1
curl -s http://localhost:8010/index.html | grep -q "Din tannlege på bryggen i Holmestrand" && echo "OK: hero-tekst"
curl -s http://localhost:8010/index.html | grep -q "33 05 23 50" && echo "OK: telefonnummer i CTA"
curl -s http://localhost:8010/index.html | grep -q "kr 1.690" && echo "OK: pris-teaser"
curl -s http://localhost:8010/index.html | grep -qE 'data-page="hjem"' && echo "OK: body data-page satt"
kill %1
```

Forventet: alle fire "OK"-linjer skrives ut.

- [ ] **Step 3: Commit**

```bash
cd /home/ricky/Dokumenter/Koding/Kuvaas
git add index.html
git commit -m "Add homepage with hero, services, trust section, and price teaser"
```

---

## Task 6: Behandlinger (behandlinger.html)

**Files:**
- Create: `behandlinger.html`

**Interfaces:**
- Consumes: samme som Task 5 (CSS, main.js, header/footer-mønster). Ingen bilder.

- [ ] **Step 1: Skriv behandlinger.html**

```html
<!DOCTYPE html>
<html lang="nb">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Behandlinger – Tannklinikken Jack Kuvaas AS</title>
<meta name="description" content="Behandlingsinformasjon fra Tannklinikken Jack Kuvaas AS i Holmestrand: undersøkelse, fylling, rotfylling, krone og bro, tannbleking, protese, tannregulering og mer.">
<link rel="stylesheet" href="css/style.css">
</head>
<body data-page="behandlinger">

<div id="site-header"></div>

<div class="page-hero wrap">
  <div class="eyebrow reveal">Behandlingsinformasjon</div>
  <h1 class="reveal" style="transition-delay:.08s">Trygg behandling, uansett hva du trenger</h1>
  <p class="lead reveal" style="transition-delay:.16s">Det er viktig å ta vare på tennene sine, men mange gruer seg likevel for et besøk til tannlegen. Hos oss møter du dyktige tannleger og -assistenter med kompetanse, erfaring og omtanke for sitt fag og deg som kunde. Vi ønsker du skal gå herfra med et smil.</p>
</div>

<section class="section wrap" style="padding-top:0;border-top:none">
  <div class="treatment-block reveal">
    <h3>Undersøkelse og rens</h3>
    <p>Det anbefales regelmessige kontroller av tenner og munnhule hos tannlege. Intervallene mellom hver kontroll avtales ut i fra dine behov og ønsker i samråd med tannlege. Ved en ordinær kontroll tar vi to røntgenbilder, kontrollerer tenner og tannkjøtt, fjerner tannstein, pusser og polerer tennene.</p>
  </div>
  <div class="treatment-block reveal">
    <h3>Tannfylling</h3>
    <p>Ved hull i tennene (karies), frakturer eller nedslitte tenner så legger vi ofte en tannfylling. Prisen varierer etter størrelse på fyllingen og tidsbruk. Pasienten har alltid tilbud om lokalbedøvelse dersom de ønsker det.</p>
  </div>
  <div class="treatment-block reveal">
    <h3>Rotfylling</h3>
    <p>Er nerven i tannen infisert eller skadet, må tannen rotfylles. Ved en rotfylling fjerner man det skadde nervevevet og erstatter det med et rotfyllingsmateriale. Pasienten får alltid tilbud om lokalbedøvelse.</p>
  </div>
  <div class="treatment-block reveal">
    <h3>Krone og bro</h3>
    <p>Er det lite tannsubstans igjen, og det er vanskelig eller umulig å bygge opp tannen på en tilfredsstillende og holdbar måte med et fyllingsmateriale, så er krone et godt alternativ. Man vil preparere tannen slik at den får en korrekt utforming, og deretter ta et avtrykk som sendes til en tanntekniker. Kronen plasseres som en hylse utenpå din egen tann med en sterk sement, og fremstår som din egen tann, både i form og farge.</p>
    <p>Mangler du en tann eller flere tenner som du ønsker å erstatte, og har en tann av god kvalitet både i forkant og bakkant av hulrommet, så kan det fremstilles en bro. Broen vil da hvile på tennene i hver ende av den manglende tannen (pilartenner) og ha kunstige utformede tenner mellom dem (mellomledd).</p>
  </div>
  <div class="treatment-block reveal">
    <h3>Tannbleking</h3>
    <p>Dersom dine tenner er misfarget og har godt med emalje igjen så kan disse blekes. Hos oss benytter vi oss av hjemmebleking. Det tas et avstøp av dine tenner på tannklinikken, og det fremstilles skinner som er perfekt tilpasset dine tenner. Skinnene er utformet slik at blekemiddelet holder seg der det skal – på tennene og ikke på tannkjøttet. Hjemmeblekingens varighet avhenger av det aktuelle tilfellet, men som regel blekes det i 3 timer av gangen i 3–5 dager. Skinnene har du for alltid, og du kan friske opp fargen på tennene ved en senere anledning ved å kjøpe blekemiddel hos oss.</p>
  </div>
  <div class="treatment-block reveal">
    <h3>Protese</h3>
    <p>Mangler du flere eller alle tennene kan det være aktuelt med en hel- eller delprotese. Protesen fremstilles over flere besøk for å sikre best mulig tilpasning til akkurat deg. En protese er avtakbar, og tas derfor av for rengjøring.</p>
  </div>
  <div class="treatment-block reveal">
    <h3>Usynlig tannregulering</h3>
    <p>Vi benytter oss av tannregulering ved hjelp av Dentilign-skinnesystemet på klinikken. Ved hjelp av transparente skinner kan man regulere mindre tannstillings- og bittavvik som for eksempel trangstillinger, mellomrom mellom tennene eller overbitt. Ved en konsultasjon tas det avtrykk av tennene som sendes til tanntekniker som deretter gir et uforpliktende behandlingsforslag som gjennomgås med tannlege. Prisen for behandlingen avhenger av antall skinner som går med for å oppnå det ønskede resultatet.</p>
  </div>
  <div class="treatment-block reveal">
    <h3>Tannlegeangst</h3>
    <p>Mange kvier seg for å besøke tannlegen, og for noen er det svært utfordrende å komme til behandling. Vi ønsker å gjøre opplevelsen så god som mulig og starter alltid med en god samtale for å definere hva den enkelte er engstelig for og hvordan dette kan bemøtes på best mulig måte. Pasienten skal alltid møtes med forståelse, empati og tid. I alvorlige tilfeller kan vi tilby beroligende medikamenter etter samtale med tannlege. Opplys gjerne tannhelsesekretæren om tannlegeskrekken når du bestiller time, så er vi godt forberedt og setter av god tid for å utføre behandlingen i ditt eget tempo.</p>
  </div>
  <div class="treatment-block reveal">
    <h3>Tanntrekking</h3>
    <p>Tanntrekking er et alternativ når tenner er så skadet at det ikke er mulig eller ønskelig å reparere den, eller når det for eksempel ikke er plass til en visdomstann som står uheldig til i munnen. Det benyttes alltid lokalbedøvelse og behandlingen er smertefri.</p>
  </div>
  <div class="treatment-block reveal">
    <h3>Periodontitt</h3>
    <p>Tannløsningssykdom (kronisk periodontitt / pyrea) starter med betennelse i tannkjøttet som utvikler seg i dybden og over tid fører til at tennenes feste og kjevebeinet angripes. Står sykdommen ubehandlet over lang tid vil det bidra til at tennene mister festet sitt og løsner.</p>
    <p>Profesjonell behandling av periodontitt foregår ved gjentatte omganger med grundig og dyp tannrens på tannklinikken og ved egeninnsats hjemme for å holde tannoverflaten fri for bakterier og plakk. Tannlegen vil gi deg grundig instruksjon i hvordan du selv skal rengjøre tennene for å behandle sykdommen.</p>
  </div>
  <div class="treatment-block reveal">
    <h3>Behandling av ansiktsmuskel- og kjeveleddslidelse (TMD)</h3>
    <p>Mange sliter med smerter i ansiktsmuskulatur og/eller kjeveledd, hodepine og gapeproblemer. Dette kan stamme fra kjeveleddet eller overbelastede muskler som følge av gnissing eller pressing av tenner. Målrettede og tilpassede avlastningsøvelser og en bittskinne fremstilt hos tanntekniker kan behandle dette.</p>
  </div>
  <div class="treatment-block reveal">
    <h3>HELFO</h3>
    <p>Det gis HELFO-refusjon dersom du faller innunder en av de medisinske tilstandene som HELFO har lovfestet gir rett på dette. Vi har direkte oppgjørsavtale med HELFO slik at du selv ikke behøver foreta noe av kommunikasjonen med HELFO.</p>
  </div>
</section>

<div id="site-footer"></div>
<script src="js/main.js"></script>
</body>
</html>
```

- [ ] **Step 2: Verifiser**

```bash
cd /home/ricky/Dokumenter/Koding/Kuvaas
python3 -m http.server 8010 >/tmp/kuvaas-server.log 2>&1 &
sleep 1
curl -s http://localhost:8010/behandlinger.html | grep -q "Usynlig tannregulering" && echo "OK: behandlingsnavn finnes"
curl -s http://localhost:8010/behandlinger.html | grep -q "HELFO-refusjon" && echo "OK: HELFO-tekst finnes"
curl -s http://localhost:8010/behandlinger.html | grep -c "treatment-block" | grep -q "^12$" && echo "OK: nøyaktig 12 behandlingsblokker"
kill %1
```

- [ ] **Step 3: Commit**

```bash
cd /home/ricky/Dokumenter/Koding/Kuvaas
git add behandlinger.html
git commit -m "Add treatments page with full real treatment descriptions"
```

---

## Task 7: Priser (priser.html)

**Files:**
- Create: `priser.html`

**Interfaces:**
- Consumes: samme som Task 5.

- [ ] **Step 1: Skriv priser.html**

```html
<!DOCTYPE html>
<html lang="nb">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Priser – Tannklinikken Jack Kuvaas AS</title>
<meta name="description" content="Prisliste for Tannklinikken Jack Kuvaas AS i Holmestrand – trygg tannbehandling med forutsigbare priser.">
<link rel="stylesheet" href="css/style.css">
</head>
<body data-page="priser">

<div id="site-header"></div>

<div class="page-hero wrap">
  <div class="eyebrow reveal">Prisliste</div>
  <h1 class="reveal" style="transition-delay:.08s">Trygg tannbehandling – med forutsigbare priser</h1>
  <p class="lead reveal" style="transition-delay:.16s">Hos oss skal du alltid føle deg trygg på både behandlingen og kostnadene. Vi gir alltid et tydelig og uforpliktende kostnadsoverslag før vi starter en behandling, slik at du vet hva du kan forvente.</p>
</div>

<section class="section wrap" style="padding-top:0;border-top:none">
  <div class="price-cat reveal">
    <h3>Undersøkelse / rens</h3>
    <div class="price-list">
      <div class="price-row"><span>Undersøkelse inkl. 2 bilder og enkel tannstensrens/puss</span><strong>kr 1.690,-</strong></div>
      <div class="price-row"><span>Grundig tannstensrens/Air-flow</span><strong>kr 930,-</strong></div>
      <div class="price-row"><span>Akuttkonsultasjon</span><strong>fra kr 830,-</strong></div>
    </div>
  </div>

  <div class="price-cat reveal">
    <h3>Fyllingsterapi</h3>
    <div class="price-list">
      <div class="price-row"><span>Tannfarget fylling, 1 flate</span><strong>fra kr 1.290,-</strong></div>
      <div class="price-row"><span>Tannfarget fylling, 2 flater</span><strong>fra kr 1.820,-</strong></div>
      <div class="price-row"><span>Tannfarget fylling, 3–4 flater</span><strong>kr 2.190,-</strong></div>
      <div class="price-row"><span>Oppbygging av hel tann</span><strong>fra kr 3.190,-</strong></div>
    </div>
  </div>

  <div class="price-cat reveal">
    <h3>Krone, bro &amp; protese</h3>
    <div class="price-list">
      <div class="price-row"><span>Fullkrone porselen (inkl. tannteknikerhonorar)</span><strong>kr 7.700,-</strong></div>
      <div class="price-row"><span>Bro, porselen pr ledd (inkl. tannteknikerhonorar)</span><strong>kr 7.700,-</strong></div>
      <div class="price-row"><span>Helprotese, en kjeve (inkl. tannteknikerhonorar)</span><strong>kr 18.720,-</strong></div>
      <div class="price-row"><span>Delprotese, en kjeve (inkl. tannteknikerhonorar)</span><strong>kr 18.720,-</strong></div>
    </div>
  </div>

  <div class="price-cat reveal">
    <h3>Rotfyllinger</h3>
    <div class="price-list">
      <div class="price-row"><span>Rotfylling, 1 kanal</span><strong>kr 5.795,-</strong></div>
      <div class="price-row"><span>Rotfylling, 2 kanaler</span><strong>kr 6.395,-</strong></div>
      <div class="price-row"><span>Rotfylling, 3–4 kanaler</span><strong>kr 7.695,-</strong></div>
    </div>
  </div>

  <div class="price-cat reveal">
    <h3>Tanntrekking</h3>
    <div class="price-list">
      <div class="price-row"><span>Uttrekking av tann eller rot (ukomplisert)</span><strong>fra kr 1.495,-</strong></div>
      <div class="price-row"><span>Uttrekking av tann eller rot (komplisert)</span><strong>fra kr 2.970,-</strong></div>
    </div>
  </div>

  <div class="price-cat reveal">
    <h3>Tannbleking</h3>
    <div class="price-list">
      <div class="price-row"><span>Bleking av tenner, én kjeve (inkl. blekeskinner, tannkrem og blekesprøyter)</span><strong>kr 2.795,-</strong></div>
      <div class="price-row"><span>Bleking av tenner, begge kjever (inkl. blekeskinner, tannkrem og blekesprøyter)</span><strong>kr 5.190,-</strong></div>
      <div class="price-row"><span>Bleking med fabrikkproduserte engangsskinner (Opalescence Go)</span><strong>kr 3.700,-</strong></div>
    </div>
  </div>

  <div class="price-cat reveal">
    <h3>Annet</h3>
    <div class="price-list">
      <div class="price-row"><span>Premedikasjon (beroligende)</span><strong>kr 590,-</strong></div>
      <div class="price-row"><span>Lokalbedøvelse</span><strong>kr 230,-</strong></div>
      <div class="price-row"><span>Intraoralt røntgenbilde (pr. bilde)</span><strong>kr 200,-</strong></div>
      <div class="price-row"><span>Panoramarøntgen (OPG)</span><strong>kr 780,-</strong></div>
    </div>
  </div>

  <p class="section-note">Våre priser er konkurransedyktige, og vi legger vekt på å tilby tannbehandling av høy kvalitet til en fornuftig pris. Det gis HELFO-refusjon der du faller innunder en lovfestet rett til dette — <a href="behandlinger.html" class="link-all" style="display:inline">les mer om HELFO</a>.</p>
</section>

<div id="site-footer"></div>
<script src="js/main.js"></script>
</body>
</html>
```

- [ ] **Step 2: Verifiser**

```bash
cd /home/ricky/Dokumenter/Koding/Kuvaas
python3 -m http.server 8010 >/tmp/kuvaas-server.log 2>&1 &
sleep 1
curl -s http://localhost:8010/priser.html | grep -q "kr 18.720" && echo "OK: proteseprisen finnes"
curl -s http://localhost:8010/priser.html | grep -q "kr 5.795" && echo "OK: rotfyllingsprisen finnes"
curl -s http://localhost:8010/priser.html | grep -c "price-row" | grep -q "^23$" && echo "OK: nøyaktig 23 pris-rader"
kill %1
```

Forventet: alle tre "OK"-linjer (23 = 3+4+4+3+2+3+4 pris-rader fordelt over de 7 kategoriene).

- [ ] **Step 3: Commit**

```bash
cd /home/ricky/Dokumenter/Koding/Kuvaas
git add priser.html
git commit -m "Add pricing page with full real price list"
```

---

## Task 8: Om oss (om-oss.html)

**Files:**
- Create: `om-oss.html`

**Interfaces:**
- Consumes: samme som Task 5, pluss alle 9 bildene i `Bilder/team/` (Task 3).

- [ ] **Step 1: Skriv om-oss.html**

```html
<!DOCTYPE html>
<html lang="nb">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Om oss – Tannklinikken Jack Kuvaas AS</title>
<meta name="description" content="Møt teamet bak Tannklinikken Jack Kuvaas AS i Holmestrand.">
<link rel="stylesheet" href="css/style.css">
</head>
<body data-page="om-oss">

<div id="site-header"></div>

<div class="page-hero wrap">
  <div class="eyebrow reveal">Om oss</div>
  <h1 class="reveal" style="transition-delay:.08s">God tannhelse og en frisk munn er viktig for alle</h1>
  <p class="lead reveal" style="transition-delay:.16s">Hos oss møter du dyktige tannleger og assistenter med fokus på trygg, smertefri og omsorgsfull behandling. Vi har kompetanse, erfaring og omtanke for vårt fag og deg som kunde.</p>
</div>

<section class="section wrap" style="padding-top:0;border-top:none">
  <p style="max-width:720px;color:var(--brown-soft);margin-bottom:14px;line-height:1.75">Vi har stort fokus på god yrkesetikk med hensyn til våre kunders forskjellige behandlingsbehov. Vi vil så langt det er mulig presentere ulike behandlingsalternativ med ulik kostnadsprofil slik at du selv kan ta et valg som passer deg, din lommebok og din munnhelse.</p>
  <p style="max-width:720px;color:var(--brown-soft);margin-bottom:40px;line-height:1.75">Vi ønsker at du skal gå herfra med et smil. Både på grunn av skånsom behandling, og med trygghet om at dine tenner er i de beste hender. Du finner oss i Havnegata 7 i Holmestrand sentrum.</p>

  <h2 class="team-group-title reveal">Tannleger</h2>
  <div class="team-grid">
    <div class="team-card reveal">
      <img src="Bilder/team/charlotte-damler.jpg" alt="Charlotte Damler">
      <div class="team-body">
        <div class="role">Tannlege</div>
        <h3>Charlotte Damler</h3>
        <div class="badge">Medlem Den Norske Tannlegeforening</div>
      </div>
    </div>
    <div class="team-card reveal">
      <img src="Bilder/team/amanda-andresen.jpg" alt="Amanda Andresen">
      <div class="team-body">
        <div class="role">Tannlege</div>
        <h3>Amanda Andresen</h3>
        <div class="badge">Medlem Den Norske Tannlegeforeningen</div>
      </div>
    </div>
    <div class="team-card reveal">
      <img src="Bilder/team/arsalan-qayoom.jpg" alt="Arsalan Qayoom">
      <div class="team-body">
        <div class="role">Tannlege</div>
        <h3>Arsalan Qayoom</h3>
        <div class="badge">Medlem Den Norske Tannlegeforening</div>
      </div>
    </div>
    <div class="team-card reveal">
      <img src="Bilder/team/jannike-lillemo-diesen.jpg" alt="Jannike Lillemo Diesen">
      <div class="team-body">
        <div class="role">Tannlege</div>
        <h3>Jannike Lillemo Diesen</h3>
        <div class="badge">Medlem Den Norske Tannlegeforening</div>
      </div>
    </div>
  </div>

  <h2 class="team-group-title reveal">Tannpleier</h2>
  <div class="team-grid">
    <div class="team-card reveal">
      <img src="Bilder/team/tone-fredriksen.jpg" alt="Tone Fredriksen">
      <div class="team-body">
        <div class="role">Tannpleier</div>
        <h3>Tone Fredriksen</h3>
        <div class="badge">Medlem Norsk TannPLEIERFORENING (NTPF)</div>
      </div>
    </div>
  </div>

  <h2 class="team-group-title reveal">Tannlegeassistenter</h2>
  <div class="team-grid">
    <div class="team-card reveal">
      <img src="Bilder/team/frida-fevang.jpg" alt="Frida Fevang">
      <div class="team-body">
        <div class="role">Tannlegeassistent</div>
        <h3>Frida Fevang</h3>
      </div>
    </div>
    <div class="team-card reveal">
      <img src="Bilder/team/linda-hallingrod.jpg" alt="Linda Hallingrød">
      <div class="team-body">
        <div class="role">Tannlegeassistent</div>
        <h3>Linda Hallingrød</h3>
      </div>
    </div>
    <div class="team-card reveal">
      <img src="Bilder/team/celine-hansen.jpg" alt="Celine Hansen">
      <div class="team-body">
        <div class="role">Tannlegeassistent</div>
        <h3>Celine Hansen</h3>
      </div>
    </div>
    <div class="team-card reveal">
      <img src="Bilder/team/emilie-larsen.jpg" alt="Emilie Larsen">
      <div class="team-body">
        <div class="role">Tannlegeassistent</div>
        <h3>Emilie Larsen</h3>
      </div>
    </div>
  </div>
</section>

<div id="site-footer"></div>
<script src="js/main.js"></script>
</body>
</html>
```

- [ ] **Step 2: Verifiser**

```bash
cd /home/ricky/Dokumenter/Koding/Kuvaas
python3 -m http.server 8010 >/tmp/kuvaas-server.log 2>&1 &
sleep 1
curl -s http://localhost:8010/om-oss.html | grep -q "Charlotte Damler" && echo "OK: tannlege finnes"
curl -s http://localhost:8010/om-oss.html | grep -q "Linda Hallingrød" && echo "OK: assistent finnes"
curl -s http://localhost:8010/om-oss.html | grep -c 'team-card reveal' | grep -q "^9$" && echo "OK: nøyaktig 9 teammedlemmer"
for f in charlotte-damler amanda-andresen arsalan-qayoom jannike-lillemo-diesen tone-fredriksen frida-fevang linda-hallingrod celine-hansen emilie-larsen; do
  curl -s -o /dev/null -w "%{http_code} Bilder/team/$f.jpg\n" "http://localhost:8010/Bilder/team/$f.jpg"
done
kill %1
```

Forventet: alle tre "OK"-linjer, og alle 9 bildeforespørslene returnerer HTTP 200.

- [ ] **Step 3: Commit**

```bash
cd /home/ricky/Dokumenter/Koding/Kuvaas
git add om-oss.html
git commit -m "Add about page with real team portraits and trust messaging"
```

---

## Task 9: Informasjon/Kontakt (kontakt.html)

**Files:**
- Create: `kontakt.html`

**Interfaces:**
- Consumes: samme som Task 5. Krever et Formspree-skjema-ID som IKKE finnes ved planens skriving — se Step 2.

- [ ] **Step 1: Skriv kontakt.html med skjemaet pekende mot Formspree, men uten gyldig ID ennå**

```html
<!DOCTYPE html>
<html lang="nb">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Kontakt og informasjon – Tannklinikken Jack Kuvaas AS</title>
<meta name="description" content="Kontaktinformasjon, åpningstider og avbestillingsregler for Tannklinikken Jack Kuvaas AS i Holmestrand.">
<link rel="stylesheet" href="css/style.css">
</head>
<body data-page="kontakt">

<div id="site-header"></div>

<div class="page-hero wrap">
  <div class="eyebrow reveal">Informasjon &amp; kontakt</div>
  <h1 class="reveal" style="transition-delay:.08s">Vi hører gjerne fra deg</h1>
  <p class="lead reveal" style="transition-delay:.16s">Spørsmål om behandling, timebestilling eller avbestilling? Ring oss, send e-post, eller bruk skjemaet under.</p>
</div>

<section class="section wrap" style="padding-top:0;border-top:none">
  <div class="kontakt-grid">
    <div class="form-card reveal" id="form-card">
      <h2>Avbestillinger</h2>
      <p style="color:var(--brown-soft);margin-bottom:28px;line-height:1.7">Avbestillinger må skje minst 24 timer før din time. Avbestillingen meldes på telefon 33 05 23 50 eller e-post <a href="mailto:tannlege@kuvaas.no" style="color:var(--terracotta-dark);font-weight:600">tannlege@kuvaas.no</a>. Avbestillinger skal ikke skje over Facebook eller andre kanaler.</p>

      <h2>Send en melding</h2>
      <div class="form-error" id="form-error">Noe gikk galt. Prøv igjen, eller send e-post direkte til <a href="mailto:tannlege@kuvaas.no">tannlege@kuvaas.no</a>.</div>
      <form id="kontakt-form" onsubmit="sendForm(event)">
        <div class="form-row">
          <div class="form-group">
            <label for="navn">Navn</label>
            <input type="text" id="navn" name="navn" placeholder="Ditt navn" required>
          </div>
          <div class="form-group">
            <label for="epost">E-post</label>
            <input type="email" id="epost" name="email" placeholder="din@epost.no" required>
          </div>
        </div>
        <div class="form-group">
          <label for="tlf">Telefon (valgfritt)</label>
          <input type="tel" id="tlf" name="tlf" placeholder="+47 000 00 000">
        </div>
        <div class="form-group">
          <label for="emne">Gjelder</label>
          <select id="emne" name="emne">
            <option value="">Velg kategori</option>
            <option value="timebestilling">Timebestilling</option>
            <option value="avbestilling">Avbestilling</option>
            <option value="behandling">Spørsmål om behandling</option>
            <option value="annet">Annet</option>
          </select>
        </div>
        <div class="form-group">
          <label for="melding">Melding</label>
          <textarea id="melding" name="melding" placeholder="Beskriv hva du lurer på..." required></textarea>
        </div>
        <button type="submit" class="btn btn-terracotta form-submit">Send melding</button>
        <p class="form-note">Vi svarer som regel innen én arbeidsdag.</p>
      </form>
      <div class="form-success" id="form-success">
        <div class="check">
          <svg viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
        </div>
        <h3>Takk for meldingen!</h3>
        <p>Vi tar kontakt snart.</p>
      </div>
    </div>

    <div class="kontakt-info reveal" style="transition-delay:.1s">
      <div class="kinfo-box">
        <h4>Finn oss</h4>
        <div class="kinfo-row"><span>Havnegaten 7<br>3080 Holmestrand</span></div>
      </div>
      <div class="kinfo-box">
        <h4>Kontaktinfo</h4>
        <div class="kinfo-row"><span><a href="mailto:tannlege@kuvaas.no">tannlege@kuvaas.no</a></span></div>
        <div class="kinfo-row"><span><a href="tel:+4733052350">33 05 23 50</a></span></div>
        <div class="kinfo-row"><span><a href="https://www.facebook.com/TannklinikkenJackKuvaas" target="_blank" rel="noopener">Facebook</a></span></div>
      </div>
      <div class="kinfo-box">
        <h4>Åpningstider</h4>
        <div class="kinfo-row"><span>Mandag–fredag<br>08:00–15:30<br><small style="color:var(--brown-soft)">Lunsjstengt 12:00–13:00. Telefonen stenger kl. 14:00 på fredager.</small></span></div>
      </div>
    </div>
  </div>
</section>

<div id="site-footer"></div>
<script>
  async function sendForm(e) {
    e.preventDefault();
    const form = document.getElementById('kontakt-form');
    const btn = form.querySelector('button[type="submit"]');
    const errorBox = document.getElementById('form-error');

    btn.disabled = true;
    btn.textContent = 'Sender…';
    errorBox.classList.remove('visible');

    try {
      const res = await fetch('https://formspree.io/f/FORMSPREE_ID', {
        method: 'POST',
        body: new FormData(form),
        headers: { 'Accept': 'application/json' }
      });

      if (res.ok) {
        form.style.display = 'none';
        errorBox.style.display = 'none';
        document.getElementById('form-success').style.display = 'block';
      } else {
        throw new Error('server');
      }
    } catch {
      btn.disabled = false;
      btn.textContent = 'Send melding';
      errorBox.classList.add('visible');
    }
  }
</script>
<script src="js/main.js"></script>
</body>
</html>
```

- [ ] **Step 2: MENNESKELIG KONTROLLPUNKT — innhent ekte Formspree-ID før du går videre**

`https://formspree.io/f/FORMSPREE_ID` i koden over er ikke et gyldig endepunkt — det finnes ingen Formspree-skjema for Kuvaas ennå. Dette steget kan ikke fullføres automatisk. Gjør følgende:

1. Spør brukeren (Ricky) i chatten: "Kan du opprette et nytt skjema på https://formspree.io (samme konto som brukes til HUT) for Kuvaas-kontaktskjemaet, og oppgi skjema-ID-en (formatet er 8 tegn, f.eks. `xykqpono` — se HUT sin `kontakt.html:241` for eksempel på hvordan URL-en ser ut)?"
2. Ikke gjenbruk HUT sin ID (`xykqpono`) — det ville sendt Kuvaas-henvendelser til samme innboks/skjema som HUT, og blande sammen to forskjellige prosjekter.
3. Vent på svar fra brukeren før du går til Step 3.

- [ ] **Step 3: Sett inn den ekte Formspree-ID-en**

Når du har fått en ekte ID fra brukeren (kall den `<ECHTE_ID>` i det følgende), erstatt placeholderen:

```bash
cd /home/ricky/Dokumenter/Koding/Kuvaas
sed -i "s|https://formspree.io/f/FORMSPREE_ID|https://formspree.io/f/<ECHTE_ID>|" kontakt.html
grep "formspree.io/f/" kontakt.html
```

Bekreft at output viser den ekte ID-en, ikke `FORMSPREE_ID`.

- [ ] **Step 4: Verifiser statisk innhold**

```bash
cd /home/ricky/Dokumenter/Koding/Kuvaas
python3 -m http.server 8010 >/tmp/kuvaas-server.log 2>&1 &
sleep 1
curl -s http://localhost:8010/kontakt.html | grep -q "Avbestillinger må skje minst 24 timer" && echo "OK: avbestillingstekst"
curl -s http://localhost:8010/kontakt.html | grep -q "Havnegaten 7" && echo "OK: adresse"
curl -s http://localhost:8010/kontakt.html | grep -qE "formspree.io/f/[a-zA-Z0-9]+\"" && echo "OK: Formspree-URL satt (ikke placeholder)"
kill %1
```

- [ ] **Step 5: Commit**

```bash
cd /home/ricky/Dokumenter/Koding/Kuvaas
git add kontakt.html
git commit -m "Add contact/information page with Formspree-wired contact form"
```

---

## Task 10: Full-site kryss-side QA

**Files:**
- Ingen nye filer — kun verifisering på tvers av alle 5 sider.

**Interfaces:**
- Consumes: alle filer produsert i Task 1–9.

- [ ] **Step 1: Start lokal server**

```bash
cd /home/ricky/Dokumenter/Koding/Kuvaas
python3 -m http.server 8010 >/tmp/kuvaas-server.log 2>&1 &
sleep 1
```

- [ ] **Step 2: Sjekk at alle 5 sider returnerer HTTP 200 og har korrekt data-page**

```bash
for pair in "index.html:hjem" "behandlinger.html:behandlinger" "priser.html:priser" "om-oss.html:om-oss" "kontakt.html:kontakt"; do
  page="${pair%%:*}"; expected="${pair##*:}"
  code=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:8010/$page")
  found=$(curl -s "http://localhost:8010/$page" | grep -oE 'data-page="[a-z-]+"' | head -1)
  echo "$page: HTTP $code, $found (forventet data-page=\"$expected\")"
done
```

Forventet: HTTP 200 og korrekt `data-page` for alle 5.

- [ ] **Step 3: Åpne hver side i nettleseren og skjermbilde (desktop + mobil)**

Bruk claude-in-chrome-verktøyet:
1. Naviger til `http://localhost:8010/index.html`, ta skjermbilde. Bekreft: navigasjon og footer er injisert (ikke tomme), hero-tekst og CTA vises, "Kontakt"-lenken i navigasjonen er IKKE uthevet som aktiv (siden vi er på forsiden), fargepaletten er krem/terrakotta (ikke hvit/blå).
2. Gjenta for `behandlinger.html`, `priser.html`, `om-oss.html`, `kontakt.html` — bekreft at riktig nav-lenke er uthevet som aktiv på hver side (klassen `.active` skal ligge på lenken som matcher siden).
3. Endre nettleservinduet til mobilbredde (< 900px, f.eks. 380x800) på minst to av sidene — bekreft at hamburger-knappen vises, navigasjonslenkene er skjult som standard, og et klikk på hamburger-knappen åpner menyen.
4. Sjekk konsollen (`read_console_messages`) på hver side for JavaScript-feil — spesielt at `fetch('partials/header.html')` og `fetch('partials/footer.html')` ikke feiler (404/CORS).
5. Klikk gjennom minst 3 interne lenker (f.eks. "Se alle behandlinger" på forsiden, "Møt teamet vårt", en footer-lenke) og bekreft at de navigerer til riktig side.

- [ ] **Step 4: Stopp serveren**

```bash
kill %1
```

- [ ] **Step 5: Rapporter funn**

Hvis alt er OK: bekreft i chatten at alle 5 sider er verifisert i nettleseren, ingen konsollfeil, navigasjon og mobilmeny fungerer. Hvis noe avviker: fiks det i den relevante tidligere task-filen, commit fiksen separat (ikke amend), og gjenta Step 1–4.

---

## Task 11: GitHub-repo og publisering (krever eksplisitt bekreftelse)

> **STOPP:** Ikke utfør noen av stegene under før brukeren eksplisitt har bekreftet i chatten at repoet skal opprettes og pushes. Dette er en handling som er synlig for andre (offentlig GitHub-repo) og skal ALDRI skje automatisk som en naturlig fortsettelse av tidligere tasks.

**Files:**
- Ingen nye kodefiler — kun git/GitHub-operasjoner.

- [ ] **Step 1: Spør brukeren eksplisitt**

Spør i chatten: "Alle 5 sider er bygget og verifisert lokalt. Skal jeg opprette et nytt offentlig GitHub-repo (`Rickymoe/kuvaas`) og pushe koden, slik at den blir tilgjengelig på `rickymoe.github.io/kuvaas` — klar til å vises fram for klinikken?" Vent på et eksplisitt "ja" før du fortsetter.

- [ ] **Step 2: Opprett GitHub-repo (kun etter bekreftelse)**

```bash
cd /home/ricky/Dokumenter/Koding/Kuvaas
gh repo create Rickymoe/kuvaas --public --source=. --remote=origin --description "Redesign-forslag for Tannklinikken Jack Kuvaas AS (kuvaas.no)"
```

- [ ] **Step 3: Push til main**

```bash
cd /home/ricky/Dokumenter/Koding/Kuvaas
git branch -M main
git push -u origin main
```

- [ ] **Step 4: Aktiver GitHub Pages**

```bash
gh api repos/Rickymoe/kuvaas/pages -X POST -f "source[branch]=main" -f "source[path]=/" 2>&1 || \
  echo "Kunne ikke aktivere Pages via API — gjør det manuelt i repoets Settings → Pages, velg branch 'main' og mappe '/'"
```

- [ ] **Step 5: Verifiser at siden er live**

```bash
sleep 20
curl -s -o /dev/null -w "%{http_code}\n" https://rickymoe.github.io/kuvaas/
```

Vent gjerne 1–2 minutter og prøv igjen om det ikke er 200 med én gang (GitHub Pages-bygg tar litt tid). Rapporter URL-en til brukeren når den svarer 200.

- [ ] **Step 6: Oppdater prosjektminnet**

Noter i memory (`project_kuvaas.md`) at repoet nå er live på `rickymoe.github.io/kuvaas`, og at det er provisorisk inntil klinikken har fått sett det og svart — jf. [[project_redesign_outreach_strategy]].
