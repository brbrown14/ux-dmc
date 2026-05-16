# ux-dmc — Dungeon Master's Companion Frontend

Frontend SPA for the Dungeon Master's Companion application. Built with React 19, TypeScript, and Vite.

Backend is hosted in the container: `ghcr.io/brbrown14/dungeon-masters-companion:latest`

## Prerequisites

- Node.js 20.19+ (the project uses Vite 8 which requires this)
- The DMC backend running locally (default port 46119)

## Setup

```bash
npm install
```

## Development

```bash
npm run dev
```

The Vite dev server proxies `/api`, `/login`, `/logout`, and `/monster-images` to `http://localhost:46119`.

## Build

```bash
npm run build
```

Output goes to `dist/`.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server with HMR |
| `npm run build` | Typecheck + production build |
| `npm run preview` | Preview production build |
| `npm run lint` | ESLint check |
| `npm run typecheck` | TypeScript compiler check |
| `npm run test` | Run Vitest unit tests |
| `npm run test:watch` | Vitest in watch mode |
| `npm run test:e2e` | Run Playwright E2E tests |

## Architecture

```
src/
├── api/           # API client modules (one per domain)
│   ├── client.ts  # fetch wrapper (401 → /login redirect)
│   ├── types.ts   # TypeScript interfaces matching OpenAPI spec
│   ├── npcs.ts
│   ├── monsters.ts
│   ├── encounters.ts
│   ├── maps.ts
│   └── story.ts
├── components/
│   ├── Layout/        # App shell: NavBar + ThemeToggle
│   ├── EncounterBuilder/  # Difficulty math, etc.
│   ├── shared/        # Modal, Toast, LoadingSpinner
├── hooks/
│   └── useTheme.ts    # Light/dark toggle, persisted to localStorage
├── pages/             # Route-level page components
├── App.tsx            # BrowserRouter + lazy-loaded routes
├── index.css          # Global theme variables (light + dark)
└── main.tsx           # Entry point
```

## Pages

| Route | Page | Description |
|-------|------|-------------|
| `/login` | LoginPage | Form-based auth (Spring Security) |
| `/` | DashboardPage | Tool card grid |
| `/npcs` | NPCPage | Create/list NPCs, grouped by location |
| `/encounters` | EncounterBuilderPage | Monster browser, party setup, encounter builder |
| `/maps` | MapsPage | Map gallery, upload, detail view with NPC tab |
| `/story` | StoryPlannerPage | Chapter sidebar + editor |

## Themes

- Light/dark mode toggle in the navigation bar
- Preference persisted in `localStorage` (`dmc-theme`)
- Default follows `prefers-color-scheme`

## Testing

### Unit Tests

```bash
npm run test
```

Tests co-located with source files (`*.test.ts`, `*.test.tsx`).

### E2E Tests

```bash
npx playwright install    # first time only
npm run test:e2e
```

E2E tests are in `e2e/specs/` using Playwright.

## Spec

See [spec.md](./spec.md) for the full specification and [implementation_plan.md](./implementation_plan.md) for the implementation plan.
