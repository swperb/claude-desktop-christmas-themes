// Generates the "Cozy Fireplace" scene SVG and writes it as a TS module.
import { writeFileSync } from 'node:fs'
import { PIN_CSS } from './pin.mjs'

const out = process.argv[2]
let seed = 2412
const rnd = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646
const r = (a, b) => a + rnd() * (b - a)
const f = n => Math.round(n * 10) / 10
const W = 1600, H = 1000

// ---------- flames ----------
const flameD = (w, h) =>
  `M${-w} 0 C${f(-w * 1.25)} ${f(-h * .3)} ${f(-w * .5)} ${f(-h * .45)} ${f(-w * .45)} ${f(-h * .68)} C${f(-w * .15)} ${f(-h * .55)} 0 ${f(-h * .8)} ${f(w * .1)} ${-h} C${f(w * .35)} ${f(-h * .74)} ${f(w * .75)} ${f(-h * .6)} ${f(w * .65)} ${f(-h * .4)} C${f(w * 1)} ${f(-h * .47)} ${f(w * 1.1)} ${f(-h * .2)} ${w} 0 Z`
function flame(x, y, s, dur, delay) {
  return `<g transform="translate(${x} ${y}) scale(${s})"><g class="fl" style="animation-duration:${dur}s;animation-delay:-${delay}s">` +
    `<path d="${flameD(44, 170)}" fill="url(#fOuter)"/>` +
    `<path d="${flameD(30, 120)}" fill="url(#fMid)"/>` +
    `<path d="${flameD(16, 70)}" fill="#fff4c2"/></g></g>`
}
let flames = ''
const fl = [[-80, .7], [-40, .95], [0, 1.15], [42, .9], [82, .7], [-15, .6], [25, .55]]
fl.forEach(([dx, s], i) => { flames += flame(370 + dx, 818, s, f(r(.9, 1.6)), f(r(0, 2))) })

let sparks = ''
for (let i = 0; i < 14; i++) {
  sparks += `<circle cx="${f(370 + r(-70, 70))}" cy="${f(r(700, 760))}" r="${f(r(1.2, 2.6))}" class="spark" style="animation-delay:-${f(r(0, 4))}s;animation-duration:${f(r(2.5, 4.5))}s"/>`
}

// ---------- stockings ----------
function stocking(x, y, body, cuff, s = 1, swing = 0) {
  return `<g transform="translate(${x} ${y}) scale(${s})"><g class="swing" style="animation-delay:-${swing}s">` +
    `<path d="M-2 0 V8" stroke="#d9c39a" stroke-width="2"/>` +
    `<path d="M-20 18 H22 V92 C22 104 30 110 44 114 C64 120 64 150 40 150 C8 150 -16 136 -20 112 Z" fill="${body}"/>` +
    `<path d="M-20 106 C-16 132 4 146 32 148" stroke="${cuff}" stroke-width="3" fill="none" opacity=".5" stroke-dasharray="6 6"/>` +
    `<rect x="-24" y="6" width="50" height="22" rx="6" fill="${cuff}"/></g></g>`
}

// ---------- garland lights ----------
const lightColors = ['#ff5a4f', '#ffd25a', '#59d48a', '#6fb7ff', '#ff8fd0']
let garland = '', garlandLights = ''
garland = `<path d="M110 462 Q190 500 265 470 Q340 500 415 470 Q490 500 565 470 Q600 486 630 462" stroke="#1f4a2c" stroke-width="16" fill="none" stroke-linecap="round"/>` +
  `<path d="M110 462 Q190 500 265 470 Q340 500 415 470 Q490 500 565 470 Q600 486 630 462" stroke="#2f6b3e" stroke-width="7" fill="none" stroke-dasharray="3 7" stroke-linecap="round"/>`
for (let i = 0; i < 16; i++) {
  const t = i / 15, x = 115 + t * 510
  const seg = ((x - 115) % 150) / 150
  const y = 466 + Math.sin(seg * Math.PI) * 22
  const c = lightColors[i % lightColors.length]
  garlandLights += `<circle cx="${f(x)}" cy="${f(y)}" r="5" fill="${c}" class="blink" style="animation-delay:-${f(r(0, 3))}s"/>`
}

// ---------- christmas tree ----------
function tree(cx, base, h) {
  const tiers = [[0, .42, .30], [.22, .36, .30], [.42, .28, .30], [.6, .19, .28]]
  let g = `<rect x="${cx - 16}" y="${base - 40}" width="32" height="44" fill="#4b2e1c"/>`
  for (const [o, w, th] of tiers) {
    const yb = base - 30 - o * h, yt = yb - th * h * 1.25
    g += `<path d="M${cx} ${f(yt)} L${f(cx + w * h)} ${f(yb)} Q${cx} ${f(yb + 22)} ${f(cx - w * h)} ${f(yb)} Z" fill="url(#treeG)"/>`
  }
  // lights along diagonal swoops
  let lights = ''
  for (let row = 0; row < 6; row++) {
    const y0 = base - 70 - row * h * .13
    const half = (0.4 - row * .055) * h
    for (let k = 0; k < 7 - Math.floor(row / 1.5); k++) {
      const t = (k + .5) / (7 - Math.floor(row / 1.5))
      const x = cx - half + t * half * 2
      const y = y0 - t * 26 + Math.sin(t * Math.PI) * 10
      lights += `<circle cx="${f(x)}" cy="${f(y)}" r="4.5" fill="${lightColors[(row + k) % 5]}" class="blink" style="animation-delay:-${f(r(0, 3))}s"/>`
    }
  }
  let orn = ''
  const ornColors = ['#c8323a', '#d9a63c', '#3c6fc8', '#c8323a', '#e8e1d0']
  for (let i = 0; i < 12; i++) {
    const lvl = r(.08, .78), half = (.4 - lvl * .44) * h * .85
    const x = cx + r(-half, half), y = base - 50 - lvl * h
    orn += `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r(7, 10))}" fill="${ornColors[i % 5]}"/><circle cx="${f(x - 3)}" cy="${f(y - 3)}" r="2.5" fill="#fff" opacity=".6"/>`
  }
  const sy = base - 30 - .6 * h - .28 * h * 1.25 - 6
  const star = Array.from({ length: 10 }, (_, i) => {
    const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? 11 : 26
    return `${f(cx + Math.cos(a) * rr)} ${f(sy + Math.sin(a) * rr)}`
  }).join(' L')
  g += orn + lights +
    `<circle cx="${cx}" cy="${f(sy)}" r="60" fill="url(#starGlow)" class="glowp"/><path d="M${star} Z" fill="#ffd96a" stroke="#fff3c4" stroke-width="2"/>`
  return g
}

function present(x, y, w, h, box, ribbon) {
  return `<rect x="${x}" y="${y - h}" width="${w}" height="${h}" rx="3" fill="${box}"/>` +
    `<rect x="${x + w / 2 - 5}" y="${y - h}" width="10" height="${h}" fill="${ribbon}"/>` +
    `<rect x="${x}" y="${y - h * .6 - 5}" width="${w}" height="10" fill="${ribbon}" opacity=".9"/>` +
    `<path d="M${x + w / 2} ${y - h} c-18 -16 -26 -2 -12 2 Z M${x + w / 2} ${y - h} c18 -16 26 -2 12 2 Z" fill="${ribbon}"/>`
}

// ---------- window snow ----------
let wsnow = ''
for (let i = 0; i < 60; i++) wsnow += `<circle cx="${f(r(1100, 1440))}" cy="${f(r(120, 470))}" r="${f(r(1, 3))}"/>`
const winSnow = `<g>${wsnow}</g><g transform="translate(0 -350)">${wsnow}</g>`

// ---------- wallpaper ----------
const css = `
.fl{transform-box:fill-box;transform-origin:50% 100%;animation:fl 1.3s ease-in-out infinite alternate}
@keyframes fl{0%{transform:scale(1,1) skewX(0)}30%{transform:scale(.93,1.1) skewX(3deg)}60%{transform:scale(1.05,.92) skewX(-3deg)}100%{transform:scale(.97,1.06) skewX(2deg)}}
.spark{fill:#ffc35a;animation:spark 3s linear infinite}
@keyframes spark{0%{transform:translate(0,0);opacity:0}10%{opacity:1}100%{transform:translate(18px,-170px);opacity:0}}
.room{animation:room 2.6s ease-in-out infinite alternate}
@keyframes room{0%{opacity:.75}40%{opacity:.95}70%{opacity:.82}100%{opacity:1}}
.ember{animation:ember 2s ease-in-out infinite alternate}
@keyframes ember{from{opacity:.55}to{opacity:1}}
.blink{animation:blink 2.4s ease-in-out infinite}
@keyframes blink{0%,100%{opacity:1}50%{opacity:.35}}
.glowp{animation:ember 3s ease-in-out infinite alternate}
.swing{transform-box:fill-box;transform-origin:50% 0;animation:swing 6s ease-in-out infinite alternate}
@keyframes swing{from{transform:rotate(-1.5deg)}to{transform:rotate(1.5deg)}}
.wfall{animation:wfall 14s linear infinite}
@keyframes wfall{from{transform:translateY(0)}to{transform:translateY(350px)}}
.candle{transform-box:fill-box;transform-origin:50% 100%;animation:fl .9s ease-in-out infinite alternate}
.breathe{transform-box:fill-box;transform-origin:50% 100%;animation:breathe 4s ease-in-out infinite}
@keyframes breathe{0%,100%{transform:scaleY(1)}50%{transform:scaleY(1.04)}}
.tail{transform-box:fill-box;transform-origin:0% 50%;animation:tail 5s ease-in-out infinite}
@keyframes tail{0%,80%,100%{transform:rotate(0)}88%{transform:rotate(-8deg)}}
@media (prefers-reduced-motion:reduce){*{animation:none!important}.spark{display:none}}
` .replace(/\n/g, '') + PIN_CSS

const svg = `<svg xmlns="http://www.w3.org/2000/svg" class="scene" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice">
<style>${css}</style>
<defs>
<linearGradient id="wall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1d1013"/><stop offset=".7" stop-color="#2e1a17"/><stop offset="1" stop-color="#3a2219"/></linearGradient>
<pattern id="paper" width="80" height="80" patternUnits="userSpaceOnUse"><rect width="80" height="80" fill="none"/><path d="M0 0 V80" stroke="#3b1f22" stroke-width="10" opacity=".55"/><path d="M40 28 l6 12 l-6 12 l-6 -12 Z" fill="#4a2a24" opacity=".6"/></pattern>
<linearGradient id="floor" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4a2b1a"/><stop offset="1" stop-color="#2a170e"/></linearGradient>
<radialGradient id="roomGlow" cx="370" cy="760" r="900" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#ff9a3c" stop-opacity=".55"/><stop offset=".35" stop-color="#e0662a" stop-opacity=".22"/><stop offset="1" stop-color="#e0662a" stop-opacity="0"/></radialGradient>
<linearGradient id="fOuter" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#e2461c"/><stop offset=".6" stop-color="#f27a1e"/><stop offset="1" stop-color="#ff9d2e" stop-opacity=".3"/></linearGradient>
<linearGradient id="fMid" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#ffb02e"/><stop offset="1" stop-color="#ffd35c" stop-opacity=".5"/></linearGradient>
<radialGradient id="firebox" cx=".5" cy=".85" r=".8"><stop offset="0" stop-color="#6a2410"/><stop offset=".5" stop-color="#2a0e08"/><stop offset="1" stop-color="#120605"/></radialGradient>
<pattern id="brick" width="60" height="36" patternUnits="userSpaceOnUse"><rect width="60" height="36" fill="#7a3a2a"/><path d="M0 0 H60 M0 18 H60 M30 0 V18 M0 18 V36 M60 18 V36" stroke="#4a221a" stroke-width="3"/></pattern>
<linearGradient id="mantel" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6b4227"/><stop offset="1" stop-color="#3f2414"/></linearGradient>
<linearGradient id="treeG" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#2f7046"/><stop offset="1" stop-color="#173d27"/></linearGradient>
<radialGradient id="starGlow"><stop offset="0" stop-color="#ffe08a" stop-opacity=".7"/><stop offset="1" stop-color="#ffe08a" stop-opacity="0"/></radialGradient>
<linearGradient id="night" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0a1633"/><stop offset="1" stop-color="#2a4a7c"/></linearGradient>
<radialGradient id="candleGlow"><stop offset="0" stop-color="#ffd27a" stop-opacity=".6"/><stop offset="1" stop-color="#ffd27a" stop-opacity="0"/></radialGradient>
<clipPath id="winClip"><rect x="1100" y="120" width="340" height="350"/></clipPath>
</defs>
<rect width="${W}" height="${H}" fill="url(#wall)"/>
<rect width="${W}" height="${H}" fill="url(#paper)"/>
<rect x="0" y="690" width="${W}" height="10" fill="#4a2c1d"/>
<rect x="0" y="700" width="${W}" height="170" fill="#2b1813"/>
<g stroke="#3d241a" stroke-width="4" fill="none">${Array.from({ length: 12 }, (_, i) => `<rect x="${i * 140 + 20}" y="720" width="110" height="128" rx="4"/>`).join('')}</g>
<rect x="0" y="866" width="${W}" height="${H - 866}" fill="url(#floor)"/>
<g stroke="#2a170e" stroke-width="2" opacity=".6">${Array.from({ length: 8 }, (_, i) => `<path d="M0 ${880 + i * 17} H${W}"/>`).join('')}</g>

<g class="tr"><g transform="translate(-150 0)">
<rect x="1084" y="104" width="372" height="382" rx="6" fill="#3f2414"/>
<rect x="1100" y="120" width="340" height="350" fill="url(#night)"/>
<g clip-path="url(#winClip)">
<circle cx="1360" cy="190" r="34" fill="#f4f1e4" opacity=".9"/>
<path d="M1100 420 C1180 395 1260 410 1340 398 C1400 390 1430 400 1440 404 V470 H1100 Z" fill="#c9d8ef"/>
<path d="M1160 410 l18 -48 l18 48 Z M1380 404 l14 -38 l14 38 Z" fill="#1d3a52"/>
<g fill="#fff" opacity=".9" class="wfall">${winSnow}</g>
</g>
<path d="M1270 120 V470 M1100 295 H1440" stroke="#3f2414" stroke-width="12"/>
<path d="M1096 470 H1446 Q1440 456 1420 458 Q1350 452 1270 460 Q1180 452 1110 460 Z" fill="#eef4fd"/>
<rect x="1070" y="470" width="400" height="18" rx="4" fill="#5a3520"/>
<path d="M1060 90 Q1130 160 1110 480 L1060 480 Z M1480 90 Q1410 160 1430 480 L1480 480 Z" fill="#7a1f26"/>
<path d="M1060 90 Q1130 160 1110 480 M1480 90 Q1410 160 1430 480" stroke="#5a141a" stroke-width="5" fill="none"/>
<rect x="1050" y="80" width="440" height="16" rx="8" fill="#3a2316"/>
<g transform="translate(1270 108)"><circle r="26" fill="none" stroke="#2f6b3e" stroke-width="12"/><circle r="26" fill="none" stroke="#3f8a52" stroke-width="5" stroke-dasharray="4 6"/><circle cx="-8" cy="20" r="4" fill="#d6363a"/><circle cx="3" cy="24" r="4" fill="#d6363a"/><path d="M-10 -26 l10 6 l10 -6 l-4 12 h-12 Z" fill="#c8323a"/></g></g>
</g>

<g class="bl">
<rect width="${W}" height="${H}" fill="url(#roomGlow)" class="room"/>
<ellipse cx="380" cy="935" rx="300" ry="42" fill="#7a1f26"/>
<ellipse cx="380" cy="935" rx="270" ry="32" fill="none" stroke="#d9b36a" stroke-width="4" stroke-dasharray="10 8"/>
<rect x="120" y="470" width="500" height="400" fill="url(#brick)"/>
<path d="M230 866 V650 Q230 600 280 600 H460 Q510 600 510 650 V866 Z" fill="url(#firebox)"/>
<path d="M230 866 V650 Q230 600 280 600 H460 Q510 600 510 650 V866" stroke="#3a1a12" stroke-width="10" fill="none"/>
<g><path d="M280 836 L460 806 L466 826 L286 856 Z" fill="#5a3320"/><path d="M290 812 L452 844 L446 862 L284 830 Z" fill="#6b3d24"/>
<path d="M300 828 L340 822 M380 838 L420 828 M310 846 L350 840" stroke="#ff7a2a" stroke-width="3" class="ember"/></g>
<g>${flames}</g>
<g>${sparks}</g>
<rect x="200" y="855" width="340" height="14" fill="#2a1410" opacity=".9"/>
<rect x="96" y="438" width="548" height="34" rx="4" fill="url(#mantel)"/>
<rect x="86" y="430" width="568" height="12" rx="4" fill="#7a4d2e"/>
<g transform="translate(190 430)"><rect x="-10" y="-70" width="20" height="70" rx="3" fill="#f2ead8"/><ellipse cy="-70" rx="10" ry="3" fill="#e2d7c0"/><circle cy="-92" r="40" fill="url(#candleGlow)" class="glowp"/><path d="M0 -70 C-7 -78 -4 -88 0 -96 C4 -88 7 -78 0 -70 Z" fill="#ffcc55" class="candle"/></g>
<g transform="translate(560 430)"><rect x="-10" y="-50" width="20" height="50" rx="3" fill="#f2ead8"/><ellipse cy="-50" rx="10" ry="3" fill="#e2d7c0"/><circle cy="-72" r="36" fill="url(#candleGlow)" class="glowp"/><path d="M0 -50 C-7 -58 -4 -68 0 -76 C4 -68 7 -58 0 -50 Z" fill="#ffcc55" class="candle" style="animation-delay:-.4s"/></g>
<g transform="translate(370 430)"><rect x="-34" y="-74" width="68" height="74" rx="8" fill="#4a2c1b"/><circle cy="-40" r="24" fill="#efe4c8"/><path d="M0 -40 V-56 M0 -40 L12 -34" stroke="#2a1a10" stroke-width="3" stroke-linecap="round"/></g>
${garland}
<g>${garlandLights}</g>
${stocking(215, 470, '#c8323a', '#f4efe4', 1, 0)}
${stocking(370, 470, '#2f7d4a', '#f4efe4', 1, 2)}
${stocking(525, 470, '#d9a63c', '#f4efe4', 1, 4)}
<g transform="translate(470 905)">
<g class="breathe"><path d="M-60 0 C-62 -36 -30 -52 8 -50 C40 -48 62 -30 58 0 Z" fill="#c67a3a"/>
<path d="M-40 -30 C-20 -44 0 -46 10 -46 M-30 -12 C-10 -24 20 -26 40 -20" stroke="#9a5a26" stroke-width="5" fill="none" stroke-linecap="round"/></g>
<path d="M52 -6 C78 -4 86 -22 72 -32" stroke="#c67a3a" stroke-width="12" fill="none" stroke-linecap="round" class="tail"/>
<circle cx="-56" cy="-18" r="20" fill="#d08544"/><path d="M-70 -32 l-2 -16 l12 10 Z M-48 -36 l6 -14 l4 16 Z" fill="#d08544"/>
<path d="M-66 -18 q4 3 8 0 M-54 -18 q4 3 8 0" stroke="#3a2010" stroke-width="2" fill="none"/>
</g>
</g>

<g class="br">
${tree(1450, 900, 440)}
${present(1320, 910, 70, 56, '#2f5fa8', '#e8c35a')}${present(1370, 922, 54, 40, '#c8323a', '#f4efe4')}${present(1470, 914, 80, 48, '#2f7d4a', '#c8323a')}${present(1540, 924, 46, 34, '#d9a63c', '#7a1f26')}
</g>
</svg>`.replace(/\n/g, '')

writeFileSync(out.replace(/\.ts$/, '.svg'), svg)
writeFileSync(out, `// Generated scene: Cozy Fireplace. Hand-drawn shapes, no external art.\nexport const COZY_FIREPLACE = ${JSON.stringify(svg)}\n`)
console.log('chars', svg.length)
