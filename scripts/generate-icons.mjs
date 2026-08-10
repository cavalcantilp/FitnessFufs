// Régénère les icônes PNG de la PWA à partir des sources SVG.
// Usage : npm install --no-save sharp && node scripts/generate-icons.mjs
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const out = resolve(root, 'public')

const mark = (stroke) => `
  <circle cx="48" cy="48" r="34" fill="none" stroke="#1e293b" stroke-width="8"/>
  <path d="M48 14a34 34 0 0 1 30 50" fill="none" stroke="#38bdf8" stroke-width="8" stroke-linecap="round"/>
  <path d="M26 50h7l6-14 9 28 8-21 5 7h9" fill="none" stroke="${stroke}" stroke-width="5"
        stroke-linecap="round" stroke-linejoin="round"/>
`

/** Icône classique : coins arrondis, marque plein cadre. */
const standard = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96">
  <rect width="96" height="96" rx="20" fill="#0f172a"/>
  ${mark('#f8fafc')}
</svg>`

/** Icône maskable : la marque tient dans la zone sûre centrale (80 %). */
const maskable = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96">
  <rect width="96" height="96" fill="#0f172a"/>
  <g transform="translate(48 48) scale(0.72) translate(-48 -48)">
    ${mark('#f8fafc')}
  </g>
</svg>`

const targets = [
  { name: 'icon-192.png', size: 192, svg: standard },
  { name: 'icon-512.png', size: 512, svg: standard },
  { name: 'icon-maskable-512.png', size: 512, svg: maskable },
  { name: 'apple-touch-icon.png', size: 180, svg: standard },
]

await mkdir(out, { recursive: true })

for (const target of targets) {
  const buffer = await sharp(Buffer.from(target.svg))
    .resize(target.size, target.size)
    .png({ compressionLevel: 9 })
    .toBuffer()
  await writeFile(resolve(out, target.name), buffer)
  console.log(`${target.name} — ${target.size}px, ${(buffer.length / 1024).toFixed(1)} kB`)
}
