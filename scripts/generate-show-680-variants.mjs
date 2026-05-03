/**
 * Poster widths between 480 and 768 for ~662px cards (680 ≥ displayed width at 1x).
 * Stronger WebP compression than prior 720 pass for Lighthouse byte savings.
 * Run: node scripts/generate-show-680-variants.mjs
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const dir = path.join(root, 'public', 'images', 'shows')

const slugs = [
  'design-system',
  'salesforce',
  'google',
  'bfa-theater',
  'hamilton',
  'phantom',
  'wicked',
  'les-miserables',
  'lion-king',
]

for (const name of slugs) {
  const from1200 = path.join(dir, `${name}-1200.jpg`)
  const from768 = path.join(dir, `${name}-768.jpg`)
  const input = fs.existsSync(from1200) ? from1200 : from768
  if (!input || !fs.existsSync(input)) {
    console.warn(`skip ${name}: no 1200/768 jpg source`)
    continue
  }
  const outJpg = path.join(dir, `${name}-680.jpg`)
  const outWebp = path.join(dir, `${name}-680.webp`)
  const img = sharp(input)
  await img
    .clone()
    .resize({ width: 680, withoutEnlargement: true })
    .jpeg({ quality: 82, mozjpeg: true })
    .toFile(outJpg)
  await img
    .clone()
    .resize({ width: 680, withoutEnlargement: true })
    .webp({ quality: 78, effort: 6 })
    .toFile(outWebp)
  console.log('wrote', path.basename(outJpg), path.basename(outWebp))
}
