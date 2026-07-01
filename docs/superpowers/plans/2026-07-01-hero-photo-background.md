# Hero Foto-bakgrunn Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Erstatte forsidens tekst/farge-hero med en fullbredde foto-bakgrunn-hero som bruker et ekte havnebilde fra kuvaas.no, med en varm terrakotta/brun overlay i stedet for originalens kalde blå filter.

**Architecture:** Ren CSS-endring på eksisterende `.hero`-klasse (bytt `background` fra gradient til bilde + gradient-overlay via `background-image` med to lag), pluss ett nytt bilde-asset. HTML-strukturen i `index.html` endres ikke — kun CSS og ett nytt bilde.

**Tech Stack:** HTML5, CSS3 (ingen preprosessor), curl for bildehenting.

## Global Constraints

- Ingen build-steg, ingen npm-avhengigheter.
- Bildet må være ekte, hentet direkte fra kuvaas.no (samme foto de selv bruker i sin nåværende hero) — ikke stock/oppdiktet.
- `.eyebrow` og `.lead` er globale klasser brukt med mørk tekst på lys bakgrunn på ALLE andre sider (behandlinger.html, priser.html, om-oss.html, kontakt.html). Denne endringen gjelder KUN forsidens hero — bruk `.hero .eyebrow` / `.hero .lead` som mer spesifikke selектorer, rør aldri de globale `.eyebrow`/`.lead`-reglene.
- Prosjektrot: `/home/ricky/Dokumenter/Koding/Kuvaas`, git-repo allerede live på `rickymoe.github.io/kuvaas`. HEAD ved planens skriving: `3dd6243`.

---

## Task 1: Hent det ekte havnebildet

**Files:**
- Create: `Bilder/havn-hero.jpg`

**Interfaces:**
- Produces: `Bilder/havn-hero.jpg` — bildefilen Task 2 refererer til fra CSS.

- [ ] **Step 1: Last ned bildet**

```bash
cd /home/ricky/Dokumenter/Koding/Kuvaas
UA="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36"
curl -s -A "$UA" "https://kuvaas.no/wp-content/uploads/2020/11/20201029_085200-scaled.jpg" -o Bilder/havn-hero.jpg
```

- [ ] **Step 2: Verifiser at det er et ekte, gyldig bilde (ikke en blokkert-side)**

```bash
cd /home/ricky/Dokumenter/Koding/Kuvaas
file Bilder/havn-hero.jpg
```

Forventet: `Bilder/havn-hero.jpg: JPEG image data ... 2560x1213`. Hvis output i stedet viser "HTML document" eller filstørrelsen er under 10KB, ble forespørselen blokkert — sjekk at User-Agent-headeren faktisk ble sendt.

- [ ] **Step 3: Commit**

```bash
cd /home/ricky/Dokumenter/Koding/Kuvaas
git add Bilder/havn-hero.jpg
git commit -m "Add real Holmestrand harbor photo for homepage hero background"
```

---

## Task 2: Oppdater hero-stilen til fullbredde foto med varm overlay

**Files:**
- Modify: `css/style.css:98-99`

**Interfaces:**
- Consumes: `Bilder/havn-hero.jpg` (Task 1), eksisterende CSS-variabler `--brown: #4A3B2A`, `--cream-deep: #F1DFC7`, `--terracotta: #C6805A` (allerede definert i `css/style.css:1-11`).
- HTML i `index.html` endres IKKE i denne oppgaven — les filen først for å bekrefte strukturen er som beskrevet under, men ikke rediger den.

Nåværende `index.html` (linje 14-24), for referanse — skal IKKE endres:
```html
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
```

Nåværende `css/style.css` (linje 98-100), som Step 1 erstatter:
```css
.hero { padding-top: 100px; padding-bottom: 80px; background: linear-gradient(135deg, var(--cream-deep), var(--cream)); border-bottom: 1px solid var(--line); }
.hero h1 { font-family: var(--serif); font-style: italic; font-weight: 600; font-size: clamp(2rem, 5vw, 3.2rem); color: var(--brown); line-height: 1.15; }
.hero-cta { display: flex; gap: 14px; margin-top: 30px; flex-wrap: wrap; }
```

- [ ] **Step 1: Erstatt de tre linjene med den nye foto-bakgrunn-stilen**

Bytt ut nøyaktig disse tre linjene (`css/style.css:98-100`, sitert over) med:

```css
.hero {
  position: relative;
  min-height: 560px;
  display: flex;
  align-items: center;
  padding-top: 100px;
  padding-bottom: 80px;
  background:
    linear-gradient(100deg, rgba(74,59,42,.88) 0%, rgba(74,59,42,.55) 45%, rgba(74,59,42,.15) 75%),
    url('../Bilder/havn-hero.jpg') center / cover no-repeat;
  border-bottom: 1px solid var(--line);
}
.hero .wrap { max-width: 640px; }
.hero .eyebrow { color: var(--cream-deep); }
.hero .lead { color: rgba(253,246,236,.92); }
.hero h1 { font-family: var(--serif); font-style: italic; font-weight: 600; font-size: clamp(2rem, 5vw, 3.2rem); color: #fff; line-height: 1.15; }
.hero-cta { display: flex; gap: 14px; margin-top: 30px; flex-wrap: wrap; }
.hero-cta .btn-outline { border-color: rgba(255,255,255,.7); color: #fff; }
.hero-cta .btn-outline:hover { background: rgba(255,255,255,.15); }
```

Merk: den globale `.eyebrow`-regelen (`css/style.css:32-35`) har ingen `::before`-pseudo-element — kun `.hero .eyebrow` (tekstfarge) og `.hero .lead` trenger override, ingenting mer.

- [ ] **Step 2: Verifiser CSS er syntaktisk gyldig**

```bash
cd /home/ricky/Dokumenter/Koding/Kuvaas
python3 -c "
content = open('css/style.css').read()
assert content.count('{') == content.count('}'), 'ubalanserte krøllparenteser'
print('OK: balanserte krøllparenteser')
"
grep -c "havn-hero.jpg" css/style.css
```

Forventet: "OK: balanserte krøllparenteser" og at grep finner nøyaktig 1 forekomst av `havn-hero.jpg`.

- [ ] **Step 3: Visuell verifisering i nettleser**

```bash
cd /home/ricky/Dokumenter/Koding/Kuvaas
python3 -m http.server 8030 >/tmp/kuvaas-hero-server.log 2>&1 &
sleep 1
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:8030/Bilder/havn-hero.jpg
```

Forventet: `200`. Åpne deretter `http://localhost:8030/index.html` i nettleseren (bruk claude-in-chrome-verktøyet), ta et skjermbilde, og bekreft:
- Havnebildet vises som bakgrunn i hele hero-seksjonen (ikke bare et smalt felt)
- Teksten (eyebrow, overskrift, ingress, begge knapper) er tydelig lesbar mot bildet — mørkest til venstre der teksten står, bildet synlig til høyre
- Naviger til `behandlinger.html`, `priser.html`, `om-oss.html`, `kontakt.html` og bekreft at deres `.eyebrow`/`.lead`-elementer fortsatt viser mørk tekst som før (ikke påvirket av `.hero`-endringen)
- Sjekk konsollen (`read_console_messages`) for feil ved lasting av bildet

Stopp serveren når verifiseringen er ferdig:

```bash
kill %1
```

- [ ] **Step 4: Commit**

```bash
cd /home/ricky/Dokumenter/Koding/Kuvaas
git add css/style.css
git commit -m "Give homepage hero a full-bleed photo background with warm overlay"
```
