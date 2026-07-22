import { expect, test, type Locator, type Page } from '@playwright/test'
import type { GameState, LocalPlayer } from '../../lib/storage'

const MOBILE_VIEWPORTS = [
  { name: 'small phone', viewport: { width: 320, height: 568 } },
  { name: 'phone', viewport: { width: 390, height: 844 } },
  { name: 'tablet', viewport: { width: 768, height: 1024 } },
  { name: 'landscape phone', viewport: { width: 844, height: 390 } },
] as const

const HOST_NAME = 'Alexandria Moonvale'

const GAME_PLAYERS: LocalPlayer[] = [
  {
    id: 'mobile-host',
    name: HOST_NAME,
    role: 'werewolf',
    isAlive: true,
    isAdmin: true,
    isMayor: false,
    canVote: true,
    loverId: null,
    priestBlessed: false,
  },
  ...['Avery', 'Blake', 'Casey', 'Devon'].map((name, index): LocalPlayer => ({
    id: `mobile-player-${index + 1}`,
    name,
    role: 'villager',
    isAlive: true,
    isAdmin: false,
    isMayor: false,
    canVote: true,
    loverId: null,
    priestBlessed: false,
  })),
]

function makeGameState(code: string): GameState {
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
    players: GAME_PLAYERS,
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

async function expectNoHorizontalOverflow(page: Page) {
  await expect.poll(() => page.evaluate(() => {
    const documentWidth = Math.max(
      document.documentElement.scrollWidth,
      document.body.scrollWidth,
    )
    return documentWidth <= window.innerWidth
  })).toBe(true)
}

async function expectInsideViewport(page: Page, target: Locator) {
  await expect(target).toBeVisible()
  const box = await target.boundingBox()
  const viewport = page.viewportSize()
  if (!box || !viewport) throw new Error('Target bounds or viewport were unavailable.')

  const label = (await target.getAttribute('aria-label'))
    ?? (await target.textContent())?.trim()
    ?? 'Target'

  expect.soft(box.x, `${label} starts outside the viewport`).toBeGreaterThanOrEqual(-0.5)
  expect.soft(box.x + box.width, `${label} ends outside the viewport`).toBeLessThanOrEqual(viewport.width + 0.5)
}

async function expectTouchTarget(target: Locator) {
  await expect(target).toBeVisible()
  await target.scrollIntoViewIfNeeded()
  const box = await target.boundingBox()
  if (!box) throw new Error('Touch target bounds were unavailable.')

  expect(box.width).toBeGreaterThanOrEqual(44)
  expect(box.height).toBeGreaterThanOrEqual(44)
}

async function seedGame(page: Page, code: string) {
  await page.evaluate(({ lobbyCode, gameState, playerName }) => {
    localStorage.setItem(`werwolf_player_${lobbyCode}`, JSON.stringify({
      id: 'mobile-host',
      name: playerName,
      isAdmin: true,
    }))
    localStorage.setItem(`werwolf_game_${lobbyCode}`, JSON.stringify(gameState))
  }, { lobbyCode: code, gameState: makeGameState(code), playerName: HOST_NAME })
}

for (const device of MOBILE_VIEWPORTS) {
  test.describe(`mobile device coverage: ${device.name}`, () => {
    test.use({
      viewport: device.viewport,
      hasTouch: true,
      contextOptions: { reducedMotion: 'reduce' },
    })

    test('keeps home, lobby, and game controls usable', async ({ page }) => {
      await page.goto('/')
      await expect(page.getByRole('heading', { level: 1, name: 'Werewolf' })).toBeVisible()
      await expect.poll(() => page.evaluate(() => (
        window.matchMedia('(prefers-reduced-motion: reduce)').matches
      ))).toBe(true)
      await expectNoHorizontalOverflow(page)

      const language = page.getByRole('combobox')
      const nameInput = page.getByRole('textbox', { name: 'Your name' })
      const createButton = page.getByRole('button', { name: 'Create lobby' })
      const codeInput = page.getByRole('textbox', { name: 'Six-character lobby code' })
      const joinButton = page.getByRole('button', { name: 'Join', exact: true })

      for (const control of [language, nameInput, createButton, codeInput, joinButton]) {
        await expectInsideViewport(page, control)
        await expectTouchTarget(control)
      }

      await language.selectOption('fr')
      await expect(page.getByRole('heading', { level: 1, name: 'Loup-Garou' })).toBeVisible()
      const frenchCreate = page.getByRole('button', { name: 'Créer un salon' })
      const frenchJoin = page.getByRole('button', { name: 'Rejoindre' })
      for (const control of [frenchCreate, frenchJoin]) {
        await expectInsideViewport(page, control)
        await expectTouchTarget(control)
      }
      await expectNoHorizontalOverflow(page)
      await expect(language).toBeEnabled()
      await language.selectOption('en')
      await expect(page.getByRole('heading', { level: 1, name: 'Werewolf' })).toBeVisible()

      await nameInput.fill(HOST_NAME)
      await createButton.click()
      await page.waitForURL(/\/lobby\/[A-HJ-NP-Z2-9]{6}$/)
      await expect(page.getByText('Lobby is open', { exact: true })).toBeVisible()
      await expectNoHorizontalOverflow(page)

      const code = new URL(page.url()).pathname.split('/').at(-1)
      if (!code) throw new Error('Lobby code was not present in the URL.')

      const roster = page.getByRole('region', { name: 'Players' })
      await expect(roster.getByText(HOST_NAME, { exact: true })).toBeVisible()

      const copyCode = page.getByRole('button', { name: `Copy lobby code ${code}` })
      const shareInvite = page.getByRole('button', { name: 'Share invite' })
      const startGame = page.getByRole('button', { name: 'Start game' })
      const closeLobby = page.getByRole('button', { name: 'Close lobby' })

      for (const control of [copyCode, shareInvite, startGame, closeLobby]) {
        await expectInsideViewport(page, control)
        await expectTouchTarget(control)
      }

      await seedGame(page, code)
      await page.goto(`/game/${code}`)

      const revealRole = page.getByRole('button', { name: 'Reveal secret role' })
      const confirmRole = page.getByRole('button', { name: 'I understand my role' })
      await expectNoHorizontalOverflow(page)
      await expectInsideViewport(page, revealRole)
      await expectTouchTarget(revealRole)
      await revealRole.click()
      await expect(confirmRole).toBeEnabled()
      await expectNoHorizontalOverflow(page)
      await expectInsideViewport(page, confirmRole)
      await expectTouchTarget(confirmRole)
      await confirmRole.click()

      const gameHeader = page.locator('.ww-game-header')
      await expect(gameHeader.getByText('Day · Vote', { exact: true })).toBeVisible()
      await expectNoHorizontalOverflow(page)
      await expectInsideViewport(page, gameHeader)

      const candidate = page.getByRole('button', { name: /^Avery(?:\s|$)/ })
      await expectTouchTarget(candidate)

      await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight))
      await expect.poll(async () => {
        const box = await gameHeader.boundingBox()
        const viewport = page.viewportSize()
        if (!box || !viewport) return false
        return box.y >= -0.5 && box.y + box.height <= viewport.height + 0.5
      }).toBe(true)
      await expect(gameHeader).toHaveCSS('position', 'sticky')
      await expect(gameHeader.getByText('Round 1', { exact: true })).toBeVisible()
    })
  })
}
