/**
 * Compressed WebP portrait for /director (display ~220px; 440w covers 2× DPR).
 * Run: node scripts/generate-director-portrait.mjs
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const input = path.join(root, 'public', 'images', 'director-starley.png')
const outDir = path.join(root, 'public', 'images')

if (!fs.existsSync(input)) {
  console.error('Missing source:', input)
  process.exit(1)
}

const widths = [220, 440]

for (const width of widths) {
  const out = path.join(outDir, `director-starley-${width}.webp`)
  await sharp(input)
    .resize({ width, withoutEnlargement: true })
    .webp({ quality: 82, effort: 6 })
    .toFile(out)
  const { size } = fs.statSync(out)
  console.log('wrote', path.basename(out), `(${Math.round(size / 1024)} KB)`)
}

// Default asset path used in markup (440w master).
const defaultOut = path.join(outDir, 'director-starley.webp')
await sharp(input)
  .resize({ width: 440, withoutEnlargement: true })
  .webp({ quality: 82, effort: 6 })
  .toFile(defaultOut)
console.log('wrote', path.basename(defaultOut), `(${Math.round(fs.statSync(defaultOut).size / 1024)} KB)`)
