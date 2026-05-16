# Implementation Plan

## Phase 1 — Foundation
1. Add dependencies: `react-router-dom`, `@playwright/test`, `vitest`, `@testing-library/react`, `jsdom`
2. Set up Vite proxy to backend (`localhost:46119`)
3. Create `src/api/client.ts` (fetch wrapper with 401 handling)
4. Create `src/api/types.ts` (all TypeScript interfaces)
5. Create `src/api/` module files (npcs, monsters, encounters, maps, story)
6. Set up global theme variables in `index.css` (light + dark)
7. Create `useTheme` hook with `localStorage` persistence
8. Create `Layout` component with responsive `NavBar` and `ThemeToggle`

## Phase 2 — Pages
1. `LoginPage` — form submit to `/login`, redirect on success
2. `DashboardPage` — tool card grid with navigation
3. `NPCPage` — create form + location-grouped list
4. `EncounterBuilderPage` — monster browser, party setup, encounter panel, stat block modal, difficulty math
5. `MapsPage` — gallery, upload modal, detail modal with NPC tab
6. `StoryPlannerPage` — chapter sidebar + editor
7. Wire up all routes in `App.tsx` with lazy loading

## Phase 3 — Tests
1. `vitest.config.ts` — configure jsdom environment
2. Unit tests: difficulty math, API client, component smoke tests, form interactions
3. Playwright config — target Chrome + Firefox
4. E2E tests: auth flow, navigation, each tool page CRUD, responsive layout, theme toggle

## Phase 4 — Polish
1. Loading states and error boundaries
2. Responsive pass — verify all breakpoints
3. Accessibility pass — labels, focus, contrast
4. Build verification: `npm run build` passes cleanly
5. Final README updates with setup instructions and architecture notes
