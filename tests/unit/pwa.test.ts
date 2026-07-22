import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import manifest from '@/app/manifest'

const projectFile = (pathname: string) => resolve(process.cwd(), pathname)

describe('PWA shell', () => {
  it('ships install icons for standard, maskable, and Apple surfaces', () => {
    const icons = manifest().icons ?? []
    expect(icons).toEqual(expect.arrayContaining([
      expect.objectContaining({ src: '/icons/icon-192.png', sizes: '192x192', purpose: 'any' }),
      expect.objectContaining({ src: '/icons/icon-512.png', sizes: '512x512', purpose: 'any' }),
      expect.objectContaining({ src: '/icons/icon-maskable-512.png', sizes: '512x512', purpose: 'maskable' }),
    ]))

    const pngs = [
      ['public/icons/icon-192.png', 192],
      ['public/icons/icon-512.png', 512],
      ['public/icons/icon-maskable-512.png', 512],
      ['public/icons/apple-touch-icon.png', 180],
    ] as const

    for (const [pathname, size] of pngs) {
      const file = readFileSync(projectFile(pathname))
      expect(file.subarray(1, 4).toString()).toBe('PNG')
      expect(file.readUInt32BE(16)).toBe(size)
      expect(file.readUInt32BE(20)).toBe(size)
    }

    const layout = readFileSync(projectFile('app/layout.tsx'), 'utf8')
    expect(layout).toContain("apple: [{ url: '/icons/apple-touch-icon.png'")
  })

  it('gives the maskable icon its own art so launcher masks cannot clip the tile', () => {
    const standard = readFileSync(projectFile('public/icons/icon-512.png'))
    const maskable = readFileSync(projectFile('public/icons/icon-maskable-512.png'))
    expect(maskable.equals(standard)).toBe(false)

    // The tile has to sit inside the safe zone, so the source scales it down.
    const source = readFileSync(projectFile('public/icons/maskable-icon.svg'), 'utf8')
    expect(source).toContain('translate(256 256) scale(0.78) translate(-256 -256)')
  })

  it('keeps private navigation out of the cache and precaches a real offline page', () => {
    const worker = readFileSync(projectFile('public/sw.js'), 'utf8')
    const offlinePage = readFileSync(projectFile('public/offline.html'), 'utf8')
    const navigationStart = worker.indexOf("if (request.mode === 'navigate')")
    const assetStart = worker.indexOf('if (!isCacheableAsset', navigationStart)
    const navigationStrategy = worker.slice(navigationStart, assetStart)

    expect(worker).toMatch(/const CACHE_VERSION = 'v\d+'/)
    expect(worker).toContain("const OFFLINE_URL = '/offline.html'")
    expect(navigationStart).toBeGreaterThanOrEqual(0)
    expect(assetStart).toBeGreaterThan(navigationStart)
    expect(navigationStrategy).toContain('return await fetch(request)')
    expect(navigationStrategy).toContain('offlineResponse()')
    expect(navigationStrategy).not.toContain('cache.put')
    expect(offlinePage).toContain('You’re offline')
    expect(offlinePage).toContain('name="robots" content="noindex, nofollow"')
  })
})
