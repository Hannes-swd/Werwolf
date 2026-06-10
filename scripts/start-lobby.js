// Öffnet 5 Browser-Fenster, joined automatisch eine Lobby und lässt sie offen zum Spielen.
// Starten: npm run lobby

const { chromium } = require('@playwright/test')

const BASE = 'https://werwolf-mu.vercel.app'
const NAMES = ['Admin', 'Spieler2', 'Spieler3', 'Spieler4', 'Spieler5']

// Bildschirm-Positionen für 5 Fenster nebeneinander (anpassen falls nötig)
const POSITIONS = [
  { x: 0,    y: 0 },
  { x: 410,  y: 0 },
  { x: 820,  y: 0 },
  { x: 0,    y: 500 },
  { x: 410,  y: 500 },
]

// Noise-Filter: diese Strings werden nicht geloggt
const IGNORE = [
  'Download the React DevTools',
  'ReactDOM.render is no longer supported',
  '%c%s',
  'Warning:',
  '[Fast Refresh]',
]

function attachLogger(page, name) {
  page.on('console', msg => {
    const text = msg.text()
    if (IGNORE.some(s => text.includes(s))) return
    const type = msg.type()
    const prefix = type === 'error' ? '🔴' : type === 'warn' ? '🟡' : '  '
    console.log(`${prefix} [${name}] ${text}`)
  })
  page.on('pageerror', err => {
    console.log(`🔴 [${name}] PAGE ERROR: ${err.message}`)
  })
}

async function main() {
  console.log('\n🐺 WERWOLF – Lobby-Setup\n')
  console.log('Starte 5 Browser-Fenster...')

  const browser = await chromium.launch({
    headless: false,
    args: ['--disable-infobars'],
  })

  const contexts = []
  const pages = []

  for (let i = 0; i < 5; i++) {
    const ctx = await browser.newContext({
      viewport: { width: 390, height: 750 },
    })
    const page = await ctx.newPage()
    attachLogger(page, NAMES[i])

    // Fenster positionieren
    await page.evaluate(
      ({ x, y }) => window.moveTo(x, y),
      POSITIONS[i]
    )

    contexts.push(ctx)
    pages.push(page)
  }

  // ── Admin erstellt Lobby ──────────────────────────────────
  console.log(`\n[${NAMES[0]}] Erstelle Lobby...`)
  await pages[0].goto(BASE)
  await pages[0].fill('input[placeholder="Name eingeben..."]', NAMES[0])
  await pages[0].click('button:has-text("Lobby erstellen")')
  await pages[0].waitForURL(/\/lobby\/[A-Z0-9]{6}$/)

  const code = pages[0].url().split('/lobby/')[1]
  console.log(`\n✅ Lobby-Code: ${code}\n`)

  // ── Spieler 2–5 joinen ───────────────────────────────────
  for (let i = 1; i < 5; i++) {
    console.log(`[${NAMES[i]}] Tritt bei...`)
    await pages[i].goto(BASE)
    await pages[i].fill('input[placeholder="Name eingeben..."]', NAMES[i])
    await pages[i].fill('input[placeholder*="Code"]', code)
    await pages[i].click('button:has-text("→")')
    await pages[i].waitForURL(`${BASE}/lobby/${code}`)
    console.log(`✅ ${NAMES[i]} ist in der Lobby`)
  }

  // ── Warten bis Admin alle 5 sieht ───────────────────────
  console.log('\nWarte auf Spieler-Sync...')
  await pages[0].waitForFunction(
    () => document.body.innerText.toUpperCase().includes('SPIELER (5)'),
    { timeout: 20_000 }
  )

  // Hard-reload alle Browser damit sie das neueste Vercel-Deployment laden
  console.log('\n♻️  Lade alle Browser neu (neuestes Deployment)...')
  await Promise.all(pages.map(p => p.reload({ waitUntil: 'domcontentloaded' })))
  // Kurz warten bis alle wieder in der Lobby sind
  await new Promise(r => setTimeout(r, 2000))

  console.log('\n🎮 Alle 5 Spieler sind in der Lobby!')
  console.log('─────────────────────────────────────')
  console.log('Die Browser bleiben offen – du kannst jetzt manuell spielen.')
  console.log(`Fenster 1 (Admin)  = ${NAMES[0]} – kann Spiel starten`)
  for (let i = 1; i < 5; i++) {
    console.log(`Fenster ${i + 1}         = ${NAMES[i]}`)
  }
  console.log('\nKonsolen-Logs der Browser werden hier angezeigt.')
  console.log('Strg+C drücken um alle Browser zu schließen.\n')

  // Offen lassen bis Strg+C ODER alle Fenster manuell geschlossen
  await Promise.race([
    Promise.all(pages.map(p => p.waitForEvent('close').catch(() => {}))),
    new Promise(resolve => process.once('SIGINT', resolve)),
  ])

  console.log('\nSchließe Browser...')
  for (const ctx of contexts) await ctx.close().catch(() => {})
  await browser.close().catch(() => {})
  process.exit(0)
}

main().catch(err => {
  console.error('\nFehler:', err.message)
  process.exit(1)
})
