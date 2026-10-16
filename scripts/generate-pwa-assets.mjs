// One-off generator for PWA icons + iOS splash screens.
// Run: bun run generate:pwa-assets (outputs are committed to public/)
import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'

const BG = '#07080c'
const ACCENT = '#2fd6a7'

/** App glyph: a circular "reset" arrow with a fresh-start dot. */
function glyphSvg(size, { withBg = true, pad = 0.18 } = {}) {
  const s = size
  const c = s / 2
  const r = s * (0.5 - pad)
  const stroke = s * 0.085
  // Arc from 90° sweeping ~300°, arrowhead at the gap, dot at center-top.
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 ${s} ${s}">
  ${withBg ? `<rect width="${s}" height="${s}" fill="${BG}"/>` : ''}
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${ACCENT}"/>
      <stop offset="1" stop-color="#4ea8ff"/>
    </linearGradient>
  </defs>
  <path d="M ${c} ${c - r}
           A ${r} ${r} 0 1 0 ${c + r * Math.cos(-Math.PI / 3)} ${c + r * Math.sin(-Math.PI / 3)}"
        fill="none" stroke="url(#g)" stroke-width="${stroke}" stroke-linecap="round"/>
  <path d="M ${c + r * Math.cos(-Math.PI / 3) - stroke * 1.15} ${c + r * Math.sin(-Math.PI / 3) - stroke * 0.2}
           l ${stroke * 1.9} ${-stroke * 0.55}
           l ${-stroke * 0.4} ${stroke * 1.9} z"
        fill="${ACCENT}"/>
  <circle cx="${c}" cy="${c}" r="${s * 0.055}" fill="${ACCENT}"/>
</svg>`
}

function splashSvg(w, h) {
  const glyphSize = Math.round(Math.min(w, h) * 0.28)
  const x = Math.round((w - glyphSize) / 2)
  const y = Math.round(h * 0.42 - glyphSize / 2)
  const fontSize = Math.round(Math.min(w, h) * 0.05)
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <rect width="${w}" height="${h}" fill="${BG}"/>
  <g transform="translate(${x}, ${y})">${glyphSvg(glyphSize, { withBg: false, pad: 0.05 })
    .replace(/^<svg[^>]*>/, '')
    .replace(/<\/svg>$/, '')}</g>
  <text x="${w / 2}" y="${h * 0.42 + glyphSize}" text-anchor="middle"
        font-family="-apple-system, 'Segoe UI', Roboto, sans-serif"
        font-size="${fontSize}" font-weight="700" fill="#f4f6fb">Reset</text>
</svg>`
}

const outIcons = path.resolve('public/icons')
const outSplash = path.resolve('public/splash')
await mkdir(outIcons, { recursive: true })
await mkdir(outSplash, { recursive: true })

const iconTasks = [
  ['icon-192.png', 192, { pad: 0.16 }],
  ['icon-512.png', 512, { pad: 0.16 }],
  ['icon-maskable-512.png', 512, { pad: 0.26 }], // extra safe zone
  ['apple-touch-icon-180.png', 180, { pad: 0.14 }],
  ['favicon-32.png', 32, { pad: 0.1 }],
]

for (const [name, size, opts] of iconTasks) {
  await sharp(Buffer.from(glyphSvg(size, opts)))
    .png()
    .toFile(path.join(outIcons, name))
  console.log('icon  ', name)
}

const splashSizes = [
  [1290, 2796],
  [1284, 2778],
  [1179, 2556],
  [1170, 2532],
  [1125, 2436],
  [1242, 2688],
  [828, 1792],
  [750, 1334],
]

for (const [w, h] of splashSizes) {
  const name = `apple-splash-${w}x${h}.png`
  await sharp(Buffer.from(splashSvg(w, h)))
    .png()
    .toFile(path.join(outSplash, name))
  console.log('splash', name)
}

console.log('Done.')
