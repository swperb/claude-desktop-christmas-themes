// Generates the "Snowy Night" scene SVG and writes it as a TS module.
import { writeFileSync } from 'node:fs'
import { PIN_CSS } from './pin.mjs'

const out = process.argv[2]
let seed = 1225
const rnd = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646
const r = (a, b) => a + rnd() * (b - a)
const f = n => Math.round(n * 10) / 10

const W = 1600, H = 1000

// ---------- stars ----------
let stars = ''
for (let i = 0; i < 140; i++) {
  const x = f(r(0, W)), y = f(r(0, 520)), rad = f(r(0.6, 1.9))
  const tw = rnd() < 0.45
  stars += `<circle cx="${x}" cy="${y}" r="${rad}"${tw ? ` class="tw" style="animation-delay:-${f(r(0, 6))}s;animation-duration:${f(r(3, 7))}s"` : ''}/>`
}

// ---------- snow layers (tile duplicated above so a 0→H translate loops) ----------
function snowLayer(count, rmin, rmax, opacity) {
  let c = ''
  for (let i = 0; i < count; i++) {
    const x = f(r(0, W)), y = f(r(0, H)), rad = f(r(rmin, rmax))
    c += `<circle cx="${x}" cy="${y}" r="${rad}"/>`
  }
  return `<g opacity="${opacity}">${c}</g><g opacity="${opacity}" transform="translate(0 -${H})">${c}</g>`
}

// ---------- pine tree ----------
function pine(x, y, s) {
  const p = (w, h, oy) => `M${f(x)} ${f(y - oy - h * s)} L${f(x + w * s)} ${f(y - oy)} L${f(x - w * s)} ${f(y - oy)} Z`
  const snowcap = (w, h, oy) => `M${f(x)} ${f(y - oy - h * s)} L${f(x + w * 0.45 * s)} ${f(y - oy - h * 0.5 * s)} L${f(x + w * 0.15 * s)} ${f(y - oy - h * 0.42 * s)} L${f(x - w * 0.1 * s)} ${f(y - oy - h * 0.52 * s)} L${f(x - w * 0.45 * s)} ${f(y - oy - h * 0.48 * s)} Z`
  return `<g><rect x="${f(x - 5 * s)}" y="${f(y - 12 * s)}" width="${f(10 * s)}" height="${f(14 * s)}" fill="#1a2238"/>` +
    `<path d="${p(46, 60, 10 * s)} ${p(38, 56, 44 * s)} ${p(28, 50, 76 * s)}" fill="#14304a"/>` +
    `<path d="${snowcap(46, 60, 10 * s)} ${snowcap(38, 56, 44 * s)} ${snowcap(28, 50, 76 * s)}" fill="#dfeaf7" opacity=".9"/></g>`
}

// ---------- snowman ----------
function snowman(x, y, s, scarf, hat = true, wave = false) {
  const g = []
  g.push(`<ellipse cx="${x}" cy="${y + 2}" rx="${70 * s}" ry="${12 * s}" fill="#9db3d6" opacity=".55"/>`)
  g.push(`<circle cx="${x}" cy="${y - 48 * s}" r="${54 * s}" fill="url(#snowball)"/>`)
  g.push(`<circle cx="${x}" cy="${y - 128 * s}" r="${40 * s}" fill="url(#snowball)"/>`)
  g.push(`<circle cx="${x}" cy="${y - 190 * s}" r="${29 * s}" fill="url(#snowball)"/>`)
  // arms
  const armR = wave
    ? `M${x + 36 * s} ${y - 132 * s} L${x + 88 * s} ${y - 178 * s} M${x + 72 * s} ${y - 164 * s} L${x + 90 * s} ${y - 158 * s}`
    : `M${x + 36 * s} ${y - 132 * s} L${x + 92 * s} ${y - 112 * s} M${x + 78 * s} ${y - 117 * s} L${x + 90 * s} ${y - 132 * s}`
  g.push(`<path d="M${x - 36 * s} ${y - 132 * s} L${x - 92 * s} ${y - 112 * s} M${x - 78 * s} ${y - 117 * s} L${x - 92 * s} ${y - 130 * s} ${armR}" stroke="#4a3426" stroke-width="${4 * s}" stroke-linecap="round" fill="none"${wave ? ' class="wave"' : ''}/>`)
  // buttons
  for (const dy of [-148, -126, -104]) g.push(`<circle cx="${x}" cy="${y + dy * s}" r="${4.5 * s}" fill="#1b1f2a"/>`)
  // face
  g.push(`<circle cx="${x - 10 * s}" cy="${y - 198 * s}" r="${3.6 * s}" fill="#1b1f2a"/><circle cx="${x + 10 * s}" cy="${y - 198 * s}" r="${3.6 * s}" fill="#1b1f2a"/>`)
  g.push(`<path d="M${x} ${y - 189 * s} L${x + 30 * s} ${y - 184 * s} L${x} ${y - 182 * s} Z" fill="#e8772e"/>`)
  for (const [dx, dy] of [[-12, -176], [-6, -172], [0, -170], [6, -172], [12, -176]]) g.push(`<circle cx="${x + dx * s}" cy="${y + dy * s}" r="${2 * s}" fill="#1b1f2a"/>`)
  // scarf
  g.push(`<path d="M${x - 30 * s} ${y - 168 * s} Q${x} ${y - 156 * s} ${x + 30 * s} ${y - 168 * s} L${x + 30 * s} ${y - 158 * s} Q${x} ${y - 146 * s} ${x - 30 * s} ${y - 158 * s} Z" fill="${scarf}"/>`)
  g.push(`<path d="M${x + 14 * s} ${y - 158 * s} L${x + 24 * s} ${y - 118 * s} L${x + 12 * s} ${y - 116 * s} L${x + 6 * s} ${y - 156 * s} Z" fill="${scarf}" class="scarf"/>`)
  // hat
  if (hat) g.push(`<rect x="${x - 34 * s}" y="${y - 220 * s}" width="${68 * s}" height="${7 * s}" rx="${2 * s}" fill="#151a26"/><rect x="${x - 22 * s}" y="${y - 262 * s}" width="${44 * s}" height="${44 * s}" rx="${3 * s}" fill="#151a26"/><rect x="${x - 22 * s}" y="${y - 228 * s}" width="${44 * s}" height="${7 * s}" fill="${scarf}"/>`)
  else g.push(`<path d="M${x - 28 * s} ${y - 208 * s} Q${x} ${y - 250 * s} ${x + 28 * s} ${y - 208 * s} Z" fill="${scarf}"/><circle cx="${x}" cy="${y - 236 * s}" r="${8 * s}" fill="#f4f8ff"/><rect x="${x - 30 * s}" y="${y - 212 * s}" width="${60 * s}" height="${9 * s}" rx="${4 * s}" fill="#f4f8ff"/>`)
  return g.join('').replace(/(\d+\.\d{2,})/g, m => f(+m))
}

// ---------- reindeer + sleigh silhouette (drawn heading right) ----------
const deer = `<g id="deer"><ellipse cx="0" cy="0" rx="13" ry="5.5"/><path d="M9 -3 L16 -11 L20 -11 L22 -9 L17 -6 L13 -1 Z"/><path d="M16 -11 l-2 -7 m2 7 l4 -8 m-5 2 l-3 -2 m6 -1 l3 -3" stroke-width="1.6" fill="none"/><path d="M-9 2 l-7 7 M-6 3 l-3 9 M7 3 l7 6 M9 2 l3 9 M-12 -2 l-4 -2" stroke-width="2" fill="none"/></g>`
const sleigh =
  `<path d="M-6 -12 L38 -12 L44 -26 L52 -26 L48 -6 Q46 2 36 2 L-4 2 Q-12 2 -14 -6 Z"/>` + // body
  `<path d="M-18 8 L42 8 Q54 8 58 -2" stroke-width="2.5" fill="none"/><path d="M0 2 L0 8 M30 2 L30 8" stroke-width="2"/>` + // runners
  `<circle cx="6" cy="-20" r="7"/><path d="M0 -14 L12 -14 L14 -4 L-2 -4 Z"/><path d="M2 -26 L10 -26 L6 -34 Z"/>` + // santa
  `<path d="M14 -24 Q26 -32 34 -18 L22 -12 Z"/>` + // sack
  `<path d="M56 -16 L176 -16" stroke-width="1" fill="none" opacity=".8"/>`
const team = [72, 104, 136, 168].map((dx, i) =>
  `<use href="#deer" x="${dx + 10}" y="${-16 - i * 1.5}"/><use href="#deer" x="${dx + 4}" y="${-12 - i * 1.5}" opacity=".85"/>`).join('') +
  `<use href="#deer" x="206" y="-22"/><circle cx="228" cy="-31" r="2.6" fill="#ff4b3e" stroke="none" class="nose"/>`

const css = `
.tw{animation:tw 5s ease-in-out infinite}
@keyframes tw{0%,100%{opacity:1}50%{opacity:.25}}
.fall{animation:fall linear infinite}
.f1{animation-duration:46s}.f2{animation-duration:30s}.f3{animation-duration:19s}
@keyframes fall{from{transform:translateY(0)}to{transform:translateY(${H}px)}}
.sway{animation:sway ease-in-out infinite alternate}
.s1{animation-duration:9s}.s2{animation-duration:7s}.s3{animation-duration:5s}
@keyframes sway{from{transform:translateX(-18px)}to{transform:translateX(18px)}}
.glow{animation:glow 4s ease-in-out infinite alternate}
@keyframes glow{from{opacity:.75}to{opacity:1}}
.moonhalo{animation:halo 8s ease-in-out infinite alternate;transform-origin:1310px 190px}
@keyframes halo{from{opacity:.55;transform:scale(1)}to{opacity:.8;transform:scale(1.06)}}
.santa{animation:santa 75s linear infinite;animation-delay:6s;transform:translate(-700px,420px)}
@keyframes santa{
 0%{transform:translate(-700px,420px)}
 20%{transform:translate(2200px,110px)}
 100%{transform:translate(2200px,110px)}}
.bob{animation:bob 1.1s ease-in-out infinite}
@keyframes bob{0%,100%{transform:translateY(0) rotate(-6deg)}50%{transform:translateY(-6px) rotate(-6deg)}}
.nose{animation:nose 1s ease-in-out infinite alternate}
@keyframes nose{from{opacity:.55}to{opacity:1}}
.smoke{animation:smoke 9s ease-out infinite;opacity:0}
@keyframes smoke{0%{opacity:0;transform:translate(0,0) scale(.6)}20%{opacity:.55}100%{opacity:0;transform:translate(40px,-130px) scale(1.8)}}
.wave{animation:wave 2.4s ease-in-out infinite alternate;transform-box:fill-box;transform-origin:0% 100%}
@keyframes wave{from{transform:rotate(-4deg)}to{transform:rotate(10deg)}}
@media (prefers-reduced-motion:reduce){*{animation:none!important}.santa{display:none}}
` .replace(/\n/g, '') + PIN_CSS

const smoke = [0, 3, 6].map(d => `<circle cx="0" cy="0" r="12" class="smoke" style="animation-delay:-${d}s"/>`).join('')

const svg = `<svg xmlns="http://www.w3.org/2000/svg" class="scene" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice">
<style>${css}</style>
<defs>${deer}
<linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#050b1f"/><stop offset=".45" stop-color="#0d1f45"/><stop offset=".78" stop-color="#22457a"/><stop offset="1" stop-color="#4f78ad"/></linearGradient>
<radialGradient id="halo"><stop offset="0" stop-color="#cfe2ff" stop-opacity=".55"/><stop offset=".4" stop-color="#8fb4ec" stop-opacity=".18"/><stop offset="1" stop-color="#8fb4ec" stop-opacity="0"/></radialGradient>
<radialGradient id="moon" cx=".42" cy=".4" r=".7"><stop offset="0" stop-color="#fffdf2"/><stop offset=".75" stop-color="#eef1f6"/><stop offset="1" stop-color="#cfd9ea"/></radialGradient>
<radialGradient id="snowball" cx=".38" cy=".32" r=".75"><stop offset="0" stop-color="#ffffff"/><stop offset=".6" stop-color="#e6eefb"/><stop offset="1" stop-color="#a9bfe0"/></radialGradient>
<linearGradient id="hillFar" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7f9fce"/><stop offset="1" stop-color="#5c7db0"/></linearGradient>
<linearGradient id="hillMid" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#b7cbea"/><stop offset="1" stop-color="#8aa6d2"/></linearGradient>
<linearGradient id="hillNear" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#eef4fd"/><stop offset="1" stop-color="#bfd1ec"/></linearGradient>
<radialGradient id="window"><stop offset="0" stop-color="#ffe7a3"/><stop offset="1" stop-color="#f2a64a"/></radialGradient>
<radialGradient id="winGlow"><stop offset="0" stop-color="#ffcf73" stop-opacity=".45"/><stop offset="1" stop-color="#ffcf73" stop-opacity="0"/></radialGradient>
</defs>
<rect width="${W}" height="${H}" fill="url(#sky)"/>
<g fill="#eaf2ff">${stars}</g>
<g class="tr">
<circle cx="1310" cy="190" r="260" fill="url(#halo)" class="moonhalo"/>
<circle cx="1310" cy="190" r="118" fill="url(#moon)"/>
<g fill="#c9d3e3" opacity=".55"><circle cx="1270" cy="160" r="18"/><circle cx="1345" cy="225" r="24"/><circle cx="1330" cy="145" r="9"/><circle cx="1280" cy="235" r="11"/></g>
<g class="santa"><g transform="scale(1.45)"><g class="bob" fill="#0a1430" stroke="#0a1430">${sleigh}${team}</g></g></g>
</g>
<path d="M0 640 C220 560 380 610 560 590 C760 565 900 520 1100 560 C1280 595 1430 545 1600 575 L1600 ${H} L0 ${H} Z" fill="url(#hillFar)"/>
<g opacity=".9">${pine(140, 640, 0.9)}${pine(205, 628, 0.7)}${pine(940, 548, 0.8)}${pine(1010, 556, 0.6)}${pine(1490, 568, 0.85)}</g>
<path d="M0 760 C180 700 360 735 560 715 C820 690 1000 735 1240 705 C1400 688 1500 705 1600 715 L1600 ${H} L0 ${H} Z" fill="url(#hillMid)"/>
<g class="br">
<ellipse cx="1180" cy="712" rx="120" ry="60" fill="url(#winGlow)" class="glow"/>
<g transform="translate(1100 600)">
<rect x="0" y="40" width="170" height="78" fill="#3a2d3c"/>
<path d="M-18 46 L85 -18 L188 46 Z" fill="#2a2234"/><path d="M-22 46 L85 -24 L192 46 L180 50 L85 -12 L-10 50 Z" fill="#eef4fd"/>
<rect x="128" y="-16" width="18" height="38" fill="#2a2234"/><rect x="125" y="-20" width="24" height="8" fill="#eef4fd"/>
<g transform="translate(137 -24)" fill="#c6d4ea">${smoke}</g>
<rect x="22" y="62" width="34" height="30" fill="url(#window)" class="glow"/><path d="M39 62 V92 M22 77 H56" stroke="#3a2d3c" stroke-width="3"/>
<rect x="108" y="62" width="34" height="30" fill="url(#window)" class="glow"/><path d="M125 62 V92 M108 77 H142" stroke="#3a2d3c" stroke-width="3"/>
<rect x="70" y="70" width="24" height="48" fill="#5b2a2e"/><circle cx="82" cy="78" r="7" fill="none" stroke="#2f6b3a" stroke-width="3"/><circle cx="82" cy="72" r="2" fill="#d6363a"/>
<path d="M-20 118 Q85 104 190 118 L190 128 L-20 128 Z" fill="#dfe9f8"/>
</g>
${pine(1050, 722, 0.75)}${pine(1330, 718, 0.95)}
</g>
<path d="M0 860 C200 805 420 840 640 828 C900 812 1080 860 1300 836 C1450 820 1540 832 1600 840 L1600 ${H} L0 ${H} Z" fill="url(#hillNear)"/>
<g class="bl">
${snowman(190, 880, 0.95, '#c8323a', true, true)}
${snowman(330, 868, 0.62, '#2f7d4a', false)}
</g>
<g class="br">
${snowman(1420, 900, 0.8, '#2f5fa8', true)}
</g>
<g fill="#ffffff">
<g class="sway s1"><g class="fall f1">${snowLayer(150, 0.8, 1.8, 0.55)}</g></g>
<g class="sway s2"><g class="fall f2">${snowLayer(80, 1.8, 3, 0.8)}</g></g>
<g class="sway s3"><g class="fall f3">${snowLayer(28, 3.2, 5.2, 0.92)}</g></g>
</g>
</svg>`.replace(/\n/g, '')

writeFileSync(out.replace(/\.ts$/, '.svg'), svg)
writeFileSync(out, `// Generated scene: Snowy Night. Hand-drawn shapes, no external art.\nexport const SNOWY_NIGHT = ${JSON.stringify(svg)}\n`)
console.log('chars', svg.length)
