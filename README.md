# Werewolf

A polished, mobile-first Werewolf party game built with Next.js, React, Supabase Realtime, and GSAP. One player creates a room, everyone else joins with a six-character code, and each device receives its own role-aware game view.

## Highlights

- Original Apple-inspired interface with restrained glass surfaces, responsive spacing, and custom Lucide-based iconography
- Dark and light appearance driven by a single `color-scheme` switch, dark by default, restored before first paint
- GSAP page, phase, roster, role-reveal, scoreboard, and ambient motion with a complete reduced-motion fallback
- Ten locales with English as the first-visit default: English, German, Spanish, French, Italian, Portuguese, Simplified Chinese, Japanese, Korean, and Arabic
- Right-to-left document layout for Arabic, persisted language choice, and translated accessibility labels
- Full Werewolf flow including Mayor, Amor, Witch, Seer, Hunter, Fool, Girl, and Priest
- Player-specific realtime projections that keep unrelated private role data out of normal broadcasts
- Installable PWA shell, strict validation, safe local persistence, security headers, and deny-by-default database policies

## Requirements

- Node.js 20.9 or newer
- npm 10 or newer
- A Supabase project with Realtime enabled

## Local setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

Set these values in `.env.local`:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-public-anon-key
NEXT_PUBLIC_SITE_URL=https://play.example.com
```

Open [http://localhost:3000](http://localhost:3000). The variables are intentionally public browser credentials; never place a Supabase service-role key in a `NEXT_PUBLIC_` variable.

## Quality gates

```bash
npm run check
npm run test:e2e
npm run test:e2e:local
```

`npm run check` runs ESLint, TypeScript, unit tests, and a production build. The Playwright suite covers the home flow, locale persistence, narrow-screen overflow, reduced motion, a five-player lobby reload, and multiplayer voting. Realtime cases require the Supabase variables above.

`npm run test:e2e:local` runs the same multiplayer flow against a small local Realtime protocol relay. It keeps CI deterministic when a Supabase test project is unavailable; the deployment checklist still includes a smoke test against the real configured project.

For a manual five-window lobby session, first run the app on port 3101 and then use:

```bash
npm run dev -- --hostname 127.0.0.1 --port 3101
npm run lobby
```

## Architecture

- `app/` contains the App Router pages, manifest, and global visual system.
- `components/` contains accessible game UI, custom icons, and scoped GSAP motion.
- `lib/gameEngine.ts` is the validated state-transition engine.
- `lib/broadcast.ts` validates incoming messages and creates player-specific state projections.
- `lib/i18n/` contains the typed translation catalog and locale provider.
- `lib/storage.ts` validates and safely persists local room and game state.
- `supabase/schema.sql` documents the optional database schema with public table access revoked.
- `tests/unit/` covers engine, validation, storage, role assignment, broadcast privacy, and translations.
- `tests/e2e/` contains browser and realtime multiplayer checks.

## Realtime security model

The current game is designed for trusted, in-person groups. It uses browser-to-browser Supabase Broadcast channels and validates payload shape, lobby code, phase, actor, target, and role rules before applying actions. State sent during normal play is tailored per player so clients do not accidentally receive every private role or action.

This is not an adversarial multiplayer authority model: a determined participant with developer tools can still attempt to impersonate another player or listen for targeted broadcast events. For public or competitive deployment, move canonical game state and all action authorization to a server or Supabase Edge Function, require authenticated private channels, and issue server-verified player sessions.

## Deployment checklist

1. Add the two public Supabase variables and the canonical `NEXT_PUBLIC_SITE_URL` to the deployment environment.
2. Enable Realtime for the project and keep database tables private unless a server-owned persistence layer is added.
3. Run `npm ci`, `npm run check`, and `npm run test:e2e` in CI.
4. Deploy the Next.js production build behind HTTPS.
5. Verify the response security headers and complete a real multi-device lobby smoke test.

The Content Security Policy intentionally permits inline styles required by the current Next.js and GSAP client runtime. Development additionally permits evaluation for framework tooling; the production policy does not.
