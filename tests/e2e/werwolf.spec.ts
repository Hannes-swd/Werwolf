import { test, expect, BrowserContext, Page } from '@playwright/test'

const NAMES = ['Admin', 'Bruno', 'Clara', 'David', 'Opfer']

function genCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

function makeGameState(code: string, players: object[]) {
  return {
    code,
    status: 'day_vote',
    phase: null,
    round: 1,
    config: { werewolf: 1, witch: 0, seer: 0, hunter: 0, amor: 0, fool: 0, girl: 0, priest: 0, villager: 4 },
    settings: { votesVisible: true, mayorEnabled: false, autoConfig: false },
    players,
    witchHealUsed: false,
    witchPoisonUsed: false,
    priestUsed: false,
    currentRound: {
      code,
      round: 1,
      timestamp: new Date().toISOString(),
      nightActions: [],
      votes: [],
      wolfTarget: null,
      wolfTargetName: null,
      priestProtected: false,
      deaths: [],
      deathNames: [],
      healed: false,
      poisonTarget: null,
      poisonTargetName: null,
      eliminated: null,
      eliminatedName: null,
      eliminatedRole: null,
      foolRevealed: false,
      mayorElected: null,
      mayorElectedName: null,
      winner: null,
    },
    winner: null,
  }
}

// ────────────────────────────────────────────────────────────────
// Test 1: Lobby-Join – keine Duplikate in der Spielerliste
// ────────────────────────────────────────────────────────────────
test('Lobby: 5 Spieler joinen – keine Duplikate', async ({ browser }) => {
  const contexts: BrowserContext[] = []
  const pages: Page[] = []

  for (let i = 0; i < 5; i++) {
    const ctx = await browser.newContext()
    contexts.push(ctx)
    pages.push(await ctx.newPage())
  }

  try {
    // Admin erstellt Lobby
    await pages[0].goto('/')
    await pages[0].fill('input[placeholder="Name eingeben..."]', NAMES[0])
    await pages[0].click('button:has-text("Lobby erstellen")')
    await pages[0].waitForURL(/\/lobby\/[A-Z0-9]{6}$/)

    const code = pages[0].url().split('/lobby/')[1]
    console.log(`\n  Lobby-Code: ${code}`)

    // Spieler 2–5 joinen
    for (let i = 1; i < 5; i++) {
      await pages[i].goto('/')
      await pages[i].fill('input[placeholder="Name eingeben..."]', NAMES[i])
      await pages[i].fill('input[placeholder*="Code"]', code)
      await pages[i].click('button:has-text("→")')
      await pages[i].waitForURL(`/lobby/${code}`)
      console.log(`  ${NAMES[i]} ist beigetreten`)
    }

    // Admin soll alle 5 Spieler sehen (CSS uppercase → "SPIELER (5)")
    await pages[0].waitForFunction(
      () => document.body.innerText.toUpperCase().includes('SPIELER (5)'),
      { timeout: 20_000 }
    )
    console.log('  Admin sieht 5 Spieler ✓')

    // Check: jeder Name erscheint GENAU 1x in der Admin-Spielerliste (kein Duplikat)
    for (const name of NAMES) {
      const count = await pages[0].locator('li').filter({ hasText: name }).count()
      expect(count, `Admin: "${name}" sollte genau 1x erscheinen, war aber ${count}x`).toBe(1)
    }
    console.log('  Keine Duplikate (Admin) ✓')

    // Jeder Nicht-Admin sieht ebenfalls alle 5 Spieler genau 1x
    for (let i = 1; i < 5; i++) {
      // Warten bis Seite aktualisiert ist
      await pages[i].waitForFunction(
        () => document.body.innerText.toUpperCase().includes('SPIELER (5)'),
        { timeout: 10_000 }
      )
      for (const name of NAMES) {
        const count = await pages[i].locator('li').filter({ hasText: name }).count()
        expect(count, `${NAMES[i]}-Seite: "${name}" sollte genau 1x erscheinen, war aber ${count}x`).toBe(1)
      }
    }
    console.log('  Alle Spieler sehen 5 Einträge ohne Duplikate ✓')

  } finally {
    for (const ctx of contexts) await ctx.close()
  }
})

// ────────────────────────────────────────────────────────────────
// Test 2: Spieler tritt zweimal bei (Duplikat-Bug)
// ────────────────────────────────────────────────────────────────
test('Lobby: Doppeltes Beitreten erzeugt keine Duplikate', async ({ browser }) => {
  const contexts: BrowserContext[] = []
  const pages: Page[] = []

  for (let i = 0; i < 3; i++) {
    const ctx = await browser.newContext()
    contexts.push(ctx)
    pages.push(await ctx.newPage())
  }

  try {
    // Admin erstellt Lobby
    await pages[0].goto('/')
    await pages[0].fill('input[placeholder="Name eingeben..."]', 'Admin')
    await pages[0].click('button:has-text("Lobby erstellen")')
    await pages[0].waitForURL(/\/lobby\/[A-Z0-9]{6}$/)
    const code = pages[0].url().split('/lobby/')[1]

    // Spieler 2 tritt bei
    await pages[1].goto('/')
    await pages[1].fill('input[placeholder="Name eingeben..."]', 'Spieler2')
    await pages[1].fill('input[placeholder*="Code"]', code)
    await pages[1].click('button:has-text("→")')
    await pages[1].waitForURL(`/lobby/${code}`)

    // Admin sieht 2 Spieler (CSS uppercase)
    await pages[0].waitForFunction(
      () => document.body.innerText.toUpperCase().includes('SPIELER (2)'),
      { timeout: 10_000 }
    )

    // Spieler 2 lädt die Seite neu (simuliert Page-Refresh)
    await pages[1].reload()
    await pages[1].waitForURL(`/lobby/${code}`)

    // 1 Sekunde warten damit alle Sync-Nachrichten ankommen
    await pages[1].waitForTimeout(2_000)

    // Admin sollte immer noch nur 2 Spieler sehen (kein Duplikat nach Reload)
    const playerCount = await pages[0].locator('ul').last().locator('li').count()
    expect(playerCount, `Nach Reload sollte Admin 2 Spieler sehen, sieht aber ${playerCount}`).toBe(2)
    console.log('  Kein Duplikat nach Reload ✓')

  } finally {
    for (const ctx of contexts) await ctx.close()
  }
})

// ────────────────────────────────────────────────────────────────
// Test 3: Abstimmung – alle Stimmen werden gezählt
// ────────────────────────────────────────────────────────────────
test('Voting: Alle 5 Stimmen werden gezählt, Opfer wird eliminiert', async ({ browser }) => {
  const code = genCode()
  console.log(`\n  Test-Code: ${code}`)

  const playerDefs = [
    { id: 'p1', name: 'Admin', role: 'werewolf', isAdmin: true },
    { id: 'p2', name: 'Bruno', role: 'villager', isAdmin: false },
    { id: 'p3', name: 'Clara', role: 'villager', isAdmin: false },
    { id: 'p4', name: 'David', role: 'villager', isAdmin: false },
    { id: 'p5', name: 'Opfer', role: 'villager', isAdmin: false },
  ]

  const players = playerDefs.map(p => ({
    id: p.id, name: p.name, role: p.role,
    isAlive: true, isAdmin: p.isAdmin,
    isMayor: false, canVote: true, loverId: null, priestBlessed: false,
  }))

  const gameState = makeGameState(code, players)

  const contexts: BrowserContext[] = []
  const pages: Page[] = []

  for (let i = 0; i < 5; i++) {
    const ctx = await browser.newContext()
    contexts.push(ctx)
    pages.push(await ctx.newPage())
  }

  try {
    // Spielzustand per localStorage injizieren
    for (let i = 0; i < 5; i++) {
      await pages[i].goto('/')
      const playerInfo = { id: playerDefs[i].id, name: playerDefs[i].name, isAdmin: playerDefs[i].isAdmin }
      await pages[i].evaluate(
        ({ code, playerInfo, gameState }) => {
          localStorage.setItem(`werwolf_player_${code}`, JSON.stringify(playerInfo))
          localStorage.setItem(`werwolf_game_${code}`, JSON.stringify(gameState))
        },
        { code, playerInfo, gameState }
      )
    }

    // Alle zur Spielseite navigieren
    await Promise.all(pages.map(p => p.goto(`/game/${code}`)))

    // Alle Rollen bestätigen ("Verstanden →")
    await Promise.all(
      pages.map(p =>
        p.waitForSelector('button:has-text("Verstanden")', { timeout: 10_000 })
          .then(btn => btn.click())
      )
    )
    console.log('  Rollen bestätigt ✓')

    // Supabase-Subscriptions Zeit geben sich zu verbinden
    await pages[0].waitForTimeout(2_000)

    // Admin: Abstimmungs-Panel sichtbar (h3 ohne uppercase)
    await expect(pages[0].locator('h3').filter({ hasText: 'Abstimmung' })).toBeVisible({ timeout: 10_000 })

    // Hilfsfunktion: stimmt ab und wartet, bis admin den neuen Zählstand empfangen hat
    async function voteAndWaitForCount(voterPage: Page, targetName: string, expectedCount: number) {
      await voterPage.locator('button:not([disabled])').filter({ hasText: targetName }).click()
      // Admin soll den neuen Zählstand sehen ("X / 5")
      await pages[0].waitForFunction(
        (n: number) => document.body.innerText.includes(`${n} / 5`),
        expectedCount,
        { timeout: 10_000 }
      )
    }

    // Alle 5 Stimmen sequenziell abgeben und auf Bestätigung warten
    await voteAndWaitForCount(pages[0], 'Opfer', 1)
    console.log('  Admin hat für Opfer gestimmt (1/5)')

    await voteAndWaitForCount(pages[1], 'Opfer', 2)
    console.log('  Bruno hat für Opfer gestimmt (2/5)')

    await voteAndWaitForCount(pages[2], 'Opfer', 3)
    console.log('  Clara hat für Opfer gestimmt (3/5)')

    await voteAndWaitForCount(pages[3], 'Opfer', 4)
    console.log('  David hat für Opfer gestimmt (4/5)')

    // Letzter Vote → löst Abstimmung auf
    await pages[4].locator('button:not([disabled])').filter({ hasText: 'Admin' }).click()
    console.log('  Opfer hat für Admin gestimmt (5/5)')

    // Nach Auflösung: VotePanel verschwindet (status wechselt von day_vote)
    // Das h3 "Abstimmung" sollte weg sein
    await expect(pages[0].locator('h3').filter({ hasText: 'Abstimmung' })).not.toBeVisible({ timeout: 15_000 })
    console.log('  Abstimmung aufgelöst ✓')

    // Alle anderen sehen den Status-Wechsel ebenfalls
    for (let i = 1; i < 5; i++) {
      await expect(pages[i].locator('h3').filter({ hasText: 'Abstimmung' })).not.toBeVisible({ timeout: 10_000 })
    }
    console.log('  Alle Spieler sehen Status-Wechsel ✓')

    // Opfer ist in der Spielerliste als tot markiert (opacity-40 CSS-Klasse auf dem Button)
    // .first() weil GameLog-<li> "💀 Opfer wurde eliminiert" ebenfalls matcht
    const opferBtn = pages[0].locator('li').filter({ hasText: 'Opfer' }).first().locator('button')
    await expect(opferBtn).toHaveClass(/opacity-40/, { timeout: 5_000 })
    console.log('  Opfer ist tot markiert (opacity-40) ✓')

    // Admin hat nur 1 Stimme bekommen – ist noch am Leben (kein opacity-40)
    const adminBtn = pages[0].locator('li').filter({ hasText: 'Admin' }).first().locator('button')
    await expect(adminBtn).not.toHaveClass(/opacity-40/)
    console.log('  Admin lebt noch ✓')

  } finally {
    for (const ctx of contexts) await ctx.close()
  }
})
