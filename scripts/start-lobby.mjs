import { chromium } from '@playwright/test'

const DEFAULT_BASE_URL = 'http://127.0.0.1:3101'
const PLAYER_NAMES = ['Host', 'Player 2', 'Player 3', 'Player 4', 'Player 5']
const WINDOW_POSITIONS = [
  { x: 0, y: 0 },
  { x: 430, y: 0 },
  { x: 860, y: 0 },
  { x: 0, y: 520 },
  { x: 430, y: 520 },
]
const IGNORED_CONSOLE_MESSAGES = [
  'Download the React DevTools',
  '[Fast Refresh]',
]

function resolveBaseURL() {
  const configured = process.env.PLAYWRIGHT_BASE_URL?.trim() || DEFAULT_BASE_URL
  const url = new URL(configured)
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new Error('PLAYWRIGHT_BASE_URL must use http or https.')
  }
  return url.toString().replace(/\/$/, '')
}

function attachLogger(page, playerName) {
  page.on('console', message => {
    const content = message.text()
    if (IGNORED_CONSOLE_MESSAGES.some(entry => content.includes(entry))) return
    console.log(`[browser:${playerName}:${message.type()}] ${content}`)
  })
  page.on('pageerror', error => {
    console.error(`[browser:${playerName}:page-error] ${error.message}`)
  })
  page.on('framenavigated', frame => {
    if (frame === page.mainFrame()) {
      console.log(`[browser:${playerName}:navigation] ${frame.url()}`)
    }
  })
  page.on('crash', () => {
    console.error(`[browser:${playerName}:crash] Browser page crashed.`)
  })
}

async function assertServerAvailable(baseURL) {
  try {
    const response = await fetch(`${baseURL}/`, { signal: AbortSignal.timeout(5_000) })
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error)
    throw new Error(
      `Could not reach ${baseURL}. Start the local app on port 3101 or set PLAYWRIGHT_BASE_URL. ${detail}`,
    )
  }
}

async function waitForCount(locator, expected, timeout = 20_000) {
  const deadline = Date.now() + timeout
  while (Date.now() < deadline) {
    if (await locator.count() === expected) return
    await new Promise(resolve => setTimeout(resolve, 250))
  }
  throw new Error(`Expected ${expected} matching elements before timeout.`)
}

async function enterPlayerName(page, playerName) {
  const input = page.getByRole('textbox', { name: 'Your name' })
  const deadline = Date.now() + 10_000
  while (Date.now() < deadline) {
    if ((await input.inputValue()).trim()) {
      await input.fill(playerName)
      return
    }
    await new Promise(resolve => setTimeout(resolve, 100))
  }
  throw new Error('The generated player name did not initialize before timeout.')
}

async function closeResources(contexts, browsers) {
  await Promise.allSettled(contexts.map(context => context.close()))
  await Promise.allSettled(browsers.map(browser => browser.close()))
}

async function main() {
  const baseURL = resolveBaseURL()
  await assertServerAvailable(baseURL)

  console.log(`Starting five browser windows against ${baseURL}.`)

  const browsers = []
  const contexts = []
  const pages = []

  try {
    for (let index = 0; index < PLAYER_NAMES.length; index += 1) {
      const position = WINDOW_POSITIONS[index]
      const browser = await chromium.launch({
        headless: false,
        args: [
          '--disable-infobars',
          `--window-position=${position.x},${position.y}`,
          '--window-size=430,820',
        ],
      })
      const context = await browser.newContext({
        baseURL,
        locale: 'en-US',
        serviceWorkers: 'block',
        viewport: null,
      })
      const page = await context.newPage()
      attachLogger(page, PLAYER_NAMES[index])
      browsers.push(browser)
      contexts.push(context)
      pages.push(page)
    }

    console.log(`[${PLAYER_NAMES[0]}] Creating lobby.`)
    await pages[0].goto('/')
    await enterPlayerName(pages[0], PLAYER_NAMES[0])
    await pages[0].getByRole('button', { name: 'Create lobby' }).click()
    await pages[0].waitForURL(/\/lobby\/[A-HJ-NP-Z2-9]{6}$/)

    const code = new URL(pages[0].url()).pathname.split('/').at(-1)
    if (!code) throw new Error('Lobby code was not present in the URL.')
    console.log(`Lobby code: ${code}`)

    for (let index = 1; index < PLAYER_NAMES.length; index += 1) {
      const page = pages[index]
      console.log(`[${PLAYER_NAMES[index]}] Joining lobby.`)
      await page.goto('/')
      await enterPlayerName(page, PLAYER_NAMES[index])
      await page.getByRole('textbox', { name: 'Six-character lobby code' }).fill(code)
      await page.getByRole('button', { name: 'Join', exact: true }).click()
      await page.waitForURL(new URL(`/lobby/${code}`, baseURL).toString())
    }

    const roster = pages[0].getByRole('region', { name: 'Players' })
    await waitForCount(roster.getByRole('listitem'), PLAYER_NAMES.length)
    for (const name of PLAYER_NAMES) {
      const count = await roster.getByText(name, { exact: true }).count()
      if (count !== 1) throw new Error(`Expected one roster entry for ${name}, found ${count}.`)
    }

    console.log('All five players are connected without duplicate roster entries.')
    console.log('The browser windows will remain open. Press Ctrl+C to close them.')

    await new Promise(resolve => {
      let openPages = pages.length
      const finish = () => resolve(undefined)
      for (const page of pages) {
        page.once('close', () => {
          openPages -= 1
          if (openPages === 0) finish()
        })
      }
      process.once('SIGINT', finish)
      process.once('SIGTERM', finish)
    })
  } finally {
    console.log('Closing browser windows.')
    await closeResources(contexts, browsers)
  }
}

main().catch(error => {
  const detail = error instanceof Error ? error.message : String(error)
  console.error(`Lobby setup failed: ${detail}`)
  process.exitCode = 1
})
