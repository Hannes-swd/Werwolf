import {
  expect,
  test,
  type Browser,
  type BrowserContext,
  type Locator,
  type Page,
} from '@playwright/test'
import type { GameState, LocalPlayer } from '../../lib/storage'

const PLAYER_NAMES = ['Host', 'Bruno', 'Clara', 'David', 'Target'] as const
const LOCAL_REALTIME_ENV = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() &&
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim(),
)
const REALTIME_AVAILABLE = Boolean(process.env.PLAYWRIGHT_BASE_URL?.trim()) || LOCAL_REALTIME_ENV
const REALTIME_SKIP_REASON =
  'Local realtime tests require NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.'

type TestSession = {
  contexts: BrowserContext[]
  pages: Page[]
}

function generateLobbyCode() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  return Array.from(
    { length: 6 },
    () => alphabet[Math.floor(Math.random() * alphabet.length)],
  ).join('')
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function makeGameState(code: string, players: LocalPlayer[]): GameState {
  return {
    code,
    status: 'day_vote',
    phase: null,
    round: 1,
    config: {
      werewolf: 1,
      witch: 0,
      seer: 0,
      hunter: 0,
      amor: 0,
      fool: 0,
      girl: 0,
      priest: 0,
      villager: 4,
    },
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
      tiedCandidateIds: [],
      tieBreakType: null,
      winner: null,
    },
    winner: null,
    pendingResolution: null,
  }
}

async function createSession(browser: Browser, baseURL: string, count: number): Promise<TestSession> {
  const contexts: BrowserContext[] = []
  const pages: Page[] = []

  for (let index = 0; index < count; index += 1) {
    const context = await browser.newContext({
      baseURL,
      locale: 'en-US',
      serviceWorkers: 'block',
    })
    contexts.push(context)
    pages.push(await context.newPage())
  }

  return { contexts, pages }
}

async function closeSession(session: TestSession) {
  await Promise.allSettled(session.contexts.map(context => context.close()))
}

async function enterPlayerName(page: Page, name: string) {
  await page.goto('/')
  const input = page.getByRole('textbox', { name: 'Your name' })
  await expect(input).toHaveValue(/\S+/)
  await input.fill(name)
}

async function expectRoster(page: Page, names: readonly string[]) {
  const roster = page.getByRole('region', { name: 'Players' })
  await expect(roster).toBeVisible()
  await expect(roster.getByRole('listitem')).toHaveCount(names.length, { timeout: 20_000 })

  for (const name of names) {
    await expect(roster.getByText(name, { exact: true })).toHaveCount(1)
  }
}

async function revealAndConfirmRole(page: Page) {
  const confirmation = page.getByRole('button', { name: 'I understand my role' })
  await expect(confirmation).toBeVisible()
  await expect(confirmation).toBeDisabled()
  await page.getByRole('button', { name: 'Reveal secret role' }).click()
  await expect(confirmation).toBeEnabled()
  await confirmation.click()
  await expect(page.getByText('Day · Vote', { exact: true })).toBeVisible()
}

async function expectInsideHorizontalViewport(page: Page, control: Locator) {
  const box = await control.boundingBox()
  const viewport = page.viewportSize()
  if (!box || !viewport) throw new Error('Control bounds or viewport were unavailable.')

  expect(box.x).toBeGreaterThanOrEqual(0)
  expect(box.x + box.width).toBeLessThanOrEqual(viewport.width + 0.5)
}

async function voteFor(page: Page, playerName: string) {
  const accessibleName = new RegExp(`^${escapeRegExp(playerName)}(?:\\s|$)`)
  const candidate = page.getByRole('button', { name: accessibleName })
  await expect(candidate).toBeEnabled()
  await candidate.click()
}

async function storedGameSnapshot(page: Page, code: string) {
  return page.evaluate((lobbyCode) => {
    const raw = localStorage.getItem(`werwolf_game_${lobbyCode}`)
    if (!raw) return null
    const state = JSON.parse(raw) as GameState
    return {
      status: state.status,
      voteCount: state.currentRound.votes.length,
      players: state.players.map(player => ({ name: player.name, isAlive: player.isAlive })),
    }
  }, code)
}

test.describe('home and language', () => {
  test('validates the compact home form with accessible controls', async ({ page }) => {
    await page.goto('/')

    await expect(page).toHaveTitle('Werewolf')
    await expect(page.getByRole('heading', { level: 1, name: 'Werewolf' })).toBeVisible()
    await expect(page.getByRole('region', { name: 'Start playing' })).toBeVisible()

    const nameInput = page.getByRole('textbox', { name: 'Your name' })
    const codeInput = page.getByRole('textbox', { name: 'Six-character lobby code' })
    const createButton = page.getByRole('button', { name: 'Create lobby' })
    const joinButton = page.getByRole('button', { name: 'Join', exact: true })

    await expect(nameInput).toHaveValue(/\S+/)
    await nameInput.fill('')
    await expect(createButton).toBeDisabled()
    await expect(joinButton).toBeDisabled()

    await nameInput.fill('Browser Tester')
    await codeInput.fill('ABC10O')
    await expect(codeInput).toHaveAttribute('aria-invalid', 'true')
    await expect(page.getByText('Enter a valid six-character lobby code.', { exact: true })).toBeVisible()
    await expect(joinButton).toBeDisabled()

    await codeInput.fill('ABC234')
    await expect(codeInput).toHaveAttribute('aria-invalid', 'false')
    await expect(createButton).toBeEnabled()
    await expect(joinButton).toBeEnabled()
  })

  test('persists Arabic and restores the document direction', async ({ page }) => {
    await page.goto('/')

    const language = page.getByRole('combobox', { name: 'Choose language' })
    await language.selectOption('ar')
    await expect(page.locator('html')).toHaveAttribute('lang', 'ar')
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl')
    await expect.poll(() => page.evaluate(() => localStorage.getItem('werwolf_locale'))).toBe('ar')

    await page.reload()
    await expect(page.getByRole('combobox')).toHaveValue('ar')
    await expect(page.locator('html')).toHaveAttribute('lang', 'ar')
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl')
  })

  test('opens in dark, switches to light, and remembers the choice', async ({ page }) => {
    const consoleErrors: string[] = []
    page.on('console', message => {
      if (message.type() === 'error') consoleErrors.push(message.text())
    })

    await page.goto('/')

    const html = page.locator('html')
    await expect(html).toHaveAttribute('data-theme', 'dark')
    await expect.poll(() => page.evaluate(() => getComputedStyle(document.documentElement).colorScheme)).toBe('dark')

    const toggle = page.getByRole('switch').first()
    await expect(toggle).toHaveAttribute('aria-checked', 'true')
    await toggle.click()

    await expect(html).toHaveAttribute('data-theme', 'light')
    await expect(toggle).toHaveAttribute('aria-checked', 'false')
    await expect.poll(() => page.evaluate(() => getComputedStyle(document.documentElement).colorScheme)).toBe('light')
    await expect.poll(() => page.evaluate(() => localStorage.getItem('werwolf_theme'))).toBe('light')
    await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute('content', '#f6f7f9')

    // The bootstrap script has to restore light before paint, without a hydration warning.
    await page.reload()
    await expect(html).toHaveAttribute('data-theme', 'light')
    await expect(page.getByRole('switch').first()).toHaveAttribute('aria-checked', 'false')
    expect(consoleErrors.filter(text => text.includes('hydrat'))).toEqual([])
  })
})

test.describe('mobile accessibility', () => {
  test.use({
    viewport: { width: 320, height: 700 },
    contextOptions: { reducedMotion: 'reduce' },
  })

  test('avoids horizontal overflow and persistent motion', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('heading', { level: 1, name: 'Werewolf' })).toBeVisible()

    await expect.poll(() => page.evaluate(() => (
      Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) <= window.innerWidth
    ))).toBe(true)
    await expect.poll(() => page.evaluate(() => (
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ))).toBe(true)

    const motionOrbs = page.locator('[data-motion-orb]')
    await expect(motionOrbs).toHaveCount(4)
    const initialMotion = await motionOrbs.evaluateAll(elements => elements.map(element => {
      const style = getComputedStyle(element)
      return { opacity: style.opacity, transform: style.transform }
    }))
    await page.waitForTimeout(300)
    const settledMotion = await motionOrbs.evaluateAll(elements => elements.map(element => {
      const style = getComputedStyle(element)
      return { opacity: style.opacity, transform: style.transform }
    }))
    expect(settledMotion).toEqual(initialMotion)

    const controls = [
      page.getByRole('combobox', { name: 'Choose language' }),
      page.getByRole('textbox', { name: 'Your name' }),
      page.getByRole('button', { name: 'Create lobby' }),
      page.getByRole('textbox', { name: 'Six-character lobby code' }),
      page.getByRole('button', { name: 'Join', exact: true }),
    ]
    for (const control of controls) await expectInsideHorizontalViewport(page, control)
  })
})

test.describe('realtime multiplayer', () => {
  test.skip(!REALTIME_AVAILABLE, REALTIME_SKIP_REASON)

  test('keeps a five-player lobby duplicate-free after a reload', async ({ browser, baseURL }) => {
    if (!baseURL) throw new Error('Playwright baseURL is required.')
    const session = await createSession(browser, baseURL, PLAYER_NAMES.length)

    try {
      await enterPlayerName(session.pages[0], PLAYER_NAMES[0])
      await session.pages[0].getByRole('button', { name: 'Create lobby' }).click()
      await session.pages[0].waitForURL(/\/lobby\/[A-HJ-NP-Z2-9]{6}$/)
      await expect(session.pages[0].getByText('Lobby is open', { exact: true })).toBeVisible()

      const code = new URL(session.pages[0].url()).pathname.split('/').at(-1)
      if (!code) throw new Error('Lobby code was not present in the URL.')

      for (let index = 1; index < PLAYER_NAMES.length; index += 1) {
        const page = session.pages[index]
        await enterPlayerName(page, PLAYER_NAMES[index])
        await page.getByRole('textbox', { name: 'Six-character lobby code' }).fill(code)
        await page.getByRole('button', { name: 'Join', exact: true }).click()
        await page.waitForURL(new URL(`/lobby/${code}`, baseURL).toString())
      }

      for (const page of session.pages) await expectRoster(page, PLAYER_NAMES)

      await session.pages[2].reload()
      for (const page of session.pages) await expectRoster(page, PLAYER_NAMES)
    } finally {
      await closeSession(session)
    }
  })

  test('counts five votes and eliminates the selected player', async ({ browser, baseURL }) => {
    if (!baseURL) throw new Error('Playwright baseURL is required.')
    const code = generateLobbyCode()
    const playerDefinitions = [
      { id: 'p1', name: PLAYER_NAMES[0], role: 'werewolf', isAdmin: true },
      { id: 'p2', name: PLAYER_NAMES[1], role: 'villager', isAdmin: false },
      { id: 'p3', name: PLAYER_NAMES[2], role: 'villager', isAdmin: false },
      { id: 'p4', name: PLAYER_NAMES[3], role: 'villager', isAdmin: false },
      { id: 'p5', name: PLAYER_NAMES[4], role: 'villager', isAdmin: false },
    ] as const
    const players: LocalPlayer[] = playerDefinitions.map(player => ({
      ...player,
      isAlive: true,
      isMayor: false,
      canVote: true,
      loverId: null,
      priestBlessed: false,
    }))
    const gameState = makeGameState(code, players)
    const session = await createSession(browser, baseURL, PLAYER_NAMES.length)

    try {
      for (let index = 0; index < session.pages.length; index += 1) {
        const page = session.pages[index]
        const player = playerDefinitions[index]
        await page.goto('/')
        await page.evaluate(({ lobbyCode, playerInfo, state }) => {
          localStorage.setItem(`werwolf_player_${lobbyCode}`, JSON.stringify(playerInfo))
          localStorage.setItem(`werwolf_game_${lobbyCode}`, JSON.stringify(state))
        }, {
          lobbyCode: code,
          playerInfo: { id: player.id, name: player.name, isAdmin: player.isAdmin },
          state: gameState,
        })
      }

      await Promise.all(session.pages.map(page => page.goto(`/game/${code}`)))
      await Promise.all(session.pages.map(page => revealAndConfirmRole(page)))

      await voteFor(session.pages[0], PLAYER_NAMES[4])
      for (const page of session.pages) {
        await expect.poll(async () => (
          (await storedGameSnapshot(page, code))?.voteCount
        ), { timeout: 20_000 }).toBe(1)
      }

      const votes = [
        { page: session.pages[1], target: PLAYER_NAMES[4] },
        { page: session.pages[2], target: PLAYER_NAMES[4] },
        { page: session.pages[3], target: PLAYER_NAMES[4] },
        { page: session.pages[4], target: PLAYER_NAMES[0] },
      ]

      for (let index = 0; index < votes.length; index += 1) {
        await voteFor(votes[index].page, votes[index].target)
        if (index < votes.length - 1) {
          await expect.poll(async () => (
            (await storedGameSnapshot(session.pages[0], code))?.voteCount
          )).toBe(index + 2)
        }
      }

      await expect.poll(async () => (
        (await storedGameSnapshot(session.pages[0], code))?.status
      ), { timeout: 20_000 }).not.toBe('day_vote')

      for (const page of session.pages) {
        await expect.poll(async () => {
          const snapshot = await storedGameSnapshot(page, code)
          return snapshot?.players.find(player => player.name === PLAYER_NAMES[4])?.isAlive
        }, { timeout: 20_000 }).toBe(false)
      }

      const hostSnapshot = await storedGameSnapshot(session.pages[0], code)
      expect(hostSnapshot?.players.find(player => player.name === PLAYER_NAMES[0])?.isAlive).toBe(true)
      await expect(session.pages[0].getByText('Day · Vote', { exact: true })).not.toBeVisible()
      await expect(session.pages[0].getByRole('region', { name: 'Village' })).toContainText(PLAYER_NAMES[4])
    } finally {
      await closeSession(session)
    }
  })
})
