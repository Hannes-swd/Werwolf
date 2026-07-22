import { readFile, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

// Rasterises the launcher icons so the PNGs never drift from the SVG sources.
const iconsDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'icons')

const targets = [
  { source: 'pwa-icon.svg', output: 'icon-192.png', size: 192 },
  { source: 'pwa-icon.svg', output: 'icon-512.png', size: 512 },
  { source: 'pwa-icon.svg', output: 'apple-touch-icon.png', size: 180 },
  { source: 'maskable-icon.svg', output: 'icon-maskable-512.png', size: 512 },
]

for (const { source, output, size } of targets) {
  const svg = await readFile(join(iconsDir, source))
  const png = await sharp(svg, { density: 512 }).resize(size, size).png({ compressionLevel: 9 }).toBuffer()
  await writeFile(join(iconsDir, output), png)
  console.log(`${output} ${size}x${size} from ${source}`)
}
