// Corner pinning for a 1600x1000 viewBox drawn with "xMidYMid slice":
// shifts corner groups back into view as the box gets narrower or wider.
const narrow = [[3, 2, 50], [4, 3, 135], [6, 5, 200], [1, 1, 300], [4, 5, 400], [3, 5, 500]]
const wide = [[9, 5, 56], [2, 1, 100], [12, 5, 167], [3, 1, 233]]
export const PIN_CSS =
  '.scene{--dx:0px;--dy:0px}' +
  '.tl{transform:translate(var(--dx),var(--dy))}' +
  '.tr{transform:translate(calc(var(--dx)*-1),var(--dy))}' +
  '.bl{transform:translate(var(--dx),calc(var(--dy)*-1))}' +
  '.br{transform:translate(calc(var(--dx)*-1),calc(var(--dy)*-1))}' +
  '.tl,.tr,.bl,.br{transition:transform .4s ease}' +
  narrow.map(([w, h, d]) => `@media (max-aspect-ratio:${w}/${h}){.scene{--dx:${d}px}}`).join('') +
  wide.map(([w, h, d]) => `@media (min-aspect-ratio:${w}/${h}){.scene{--dy:${d}px}}`).join('')
