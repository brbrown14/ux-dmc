# Dungeon Master's Companion — Frontend Specification

## 1. Overview

A responsive single-page application (SPA) that replaces the existing server-rendered HTML/JS static frontend. It provides DMs with tools to manage NPCs, build encounters, upload world maps, and plan story chapters. The backend is a Java/Spring Boot application deployed at `ghcr.io/brbrown14/dungeon-masters-companion:latest`.

---

## 2. Technical Stack

| Concern | Choice | Rationale |
|---------|--------|-----------|
| Framework | React 19 + TypeScript | Existing project foundation, strong ecosystem |
| Build tool | Vite 8 | Already configured |
| Routing | React Router v7 | SPA navigation, nested layouts |
| HTTP client | fetch (native) + lightweight wrapper | No added dependency; matches existing pattern |
| Styling | CSS Modules + CSS custom properties | Component-scoped styles, easy theme switching |
| Theme | CSS custom properties with `data-theme` attribute | Simple light/dark toggle |
| Form state | React hooks (`useState`) | Simple enough; no complex forms |
| Icons | SVG sprites / inline SVGs | Lightweight, no icon library dependency |
| Testing (unit) | Vitest + React Testing Library | Vite-native, fast, matches existing config |
| Testing (e2e) | Playwright | Industry standard, cross-browser |
| Linting | ESLint + `typescript-eslint` | Already configured |
| Code gen | OpenAPI -> TypeScript types (via openapi-typescript) | Single source of truth for API types |

---

## 3. API Reference

Base URL from container (proxied via Vite):
- Dev: `http://localhost:46119` (configure Vite proxy for `/api/**`)
- Prod: served as static files from the same origin as the Java backend

### 3.1 Endpoints

#### NPCs
| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/npcs` | List all NPCs for current user |
| `POST` | `/api/npcs` | Create a new NPC |
| `GET` | `/api/npcs/{id}` | Get NPC by ID |
| `GET` | `/api/maps/{mapId}/npcs` | Get NPCs by world map ID |

#### Monsters
| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/monsters` | Search/list all monsters (with query params) |
| `GET` | `/api/monsters/{id}` | Get monster by ID |

#### Encounters
| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/encounters` | List encounters for current user |
| `POST` | `/api/encounters` | Create a new encounter |
| `GET` | `/api/encounters/{id}` | Get encounter + its monsters |
| `DELETE` | `/api/encounters/{id}` | Delete an encounter |
| `POST` | `/api/encounters/{id}/monsters` | Add monster to encounter |
| `PUT` | `/api/encounters/{id}/monsters/{linkId}` | Update monster in encounter (qty, initiative) |
| `DELETE` | `/api/encounters/{id}/monsters/{linkId}` | Remove monster from encounter |

#### World Maps
| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/maps` | List all maps for current user |
| `POST` | `/api/maps` | Upload a new map (multipart: image + title + description) |
| `GET` | `/api/maps/{id}` | Get map by ID |
| `PUT` | `/api/maps/{id}` | Update map title/description |
| `GET` | `/api/maps/image/{filename}` | Serve map image file |

#### Story Chapters
| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/story/chapters` | List all chapters for current user |
| `POST` | `/api/story/chapters` | Create a new chapter |
| `GET` | `/api/story/chapters/{id}` | Get chapter by ID |
| `PUT` | `/api/story/chapters/{id}` | Update a chapter |

#### Authentication
| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/login` | Form-based login (Spring Security) |
| `GET` | `/logout` | Logout |

### 3.2 Domain Models

```typescript
interface NPC {
  id: number;
  name: string;
  location: string;
  occupation: string;
  history: string;
  personality: string;
  worldMapId: number | null;
  ownerUsername: string;
}

interface Monster {
  id: number;
  name: string;
  source: string;
  size: string;
  type: string;
  alignment: string;
  armorClass: number;
  hitPoints: number;
  hitPointsFormula: string;
  speed: string;               // JSON string or raw
  strength: number;
  dexterity: number;
  constitution: number;
  intelligence: number;
  wisdom: number;
  charisma: number;
  skills: string;              // JSON string
  passive: number;
  languages: string;           // JSON string
  challengeRating: string;
  xp: number;
  traits: string;              // JSON array string
  actions: string;             // JSON array string
  legendaryActions: string;    // JSON array string
  reactions: string;           // JSON array string
  damageResistances: string;   // JSON array string
  damageImmunities: string;    // JSON array string
  conditionImmunities: string; // JSON array string
  senses: string;              // JSON object string
  environment: string;
  imagePath: string;
  sourceJson: string;
}

interface Encounter {
  id: number;
  name: string;
  ownerUsername: string;
  createdAt: string;
}

interface EncounterMonster {
  id: number;
  encounterId: number;
  monsterId: number;
  quantity: number;
  initiative: number | null;
}

interface WorldMap {
  id: number;
  title: string;
  description: string;
  imagePath: string;
  imageType: string;
  ownerUsername: string;
}

interface Chapter {
  id: number;
  title: string;
  content: string;
  ownerUsername: string;
}
```

---

## 4. Page Structure & Routes

| Path | Page | Auth Required | Description |
|------|------|---------------|-------------|
| `/login` | LoginPage | No | Username/password form |
| `/` | DashboardPage | Yes | Tool card grid |
| `/npcs` | NPCPage | Yes | List/filter NPCs grouped by location + create form |
| `/encounters` | EncounterBuilderPage | Yes | Monster browser, party setup, encounter builder |
| `/maps` | MapsPage | Yes | Map gallery, upload modal, detail view |
| `/story` | StoryPlannerPage | Yes | Chapter sidebar + editor |

All authenticated pages share a **top navigation bar** containing links to every other page and a theme toggle.

---

## 5. Feature Details

### 5.1 Authentication
- The backend uses Spring Security form-based login.
- Redirect to `/login` on 401 responses; after successful login the session cookie is set by the server.
- LoginPage submits `POST /login` with `application/x-www-form-urlencoded` (standard Spring Security).
- On 401, clear any stored auth state and redirect to `/login`.
- On page load, optionally hit a simple endpoint to check session validity.

### 5.2 Theme (Night Mode)
- CSS custom properties on `:root` define light theme.
- `[data-theme="dark"]` overrides for dark theme.
- A toggle in the nav bar switches the `data-theme` attribute on `<html>`.
- Preference persisted in `localStorage`.

### 5.3 Dashboard
- Same layout as the existing `dashboard.html`: a heading and a responsive grid of tool cards.
- Each card navigates to the corresponding route.
- Add a logout button.

### 5.4 NPC Manager
- **Create form**: name, location (dropdown from map titles + "Unknown"), occupation, history, personality. Same fields as `index.html`.
- **List**: fetched NPCs grouped by location (accordion). Within each location group, NPC cards expand on click to show full detail. Mirror the current `script.js` behavior exactly.
- Loading and empty states.

### 5.5 Encounter Builder
- **Monster Browser** (left panel at desktop, top on mobile):
  - Search by name, filter by type/CR, sortable columns.
  - Click row to see stat block modal.
  - `+` button adds to current encounter.
- **Party Setup** (collapsible):
  - Party size, per-player level inputs.
  - Calculates difficulty using XP thresholds (same formula as existing JS).
  - Shows difficulty bar (easy/medium/hard/deadly) with adjusted XP details.
- **Encounter Panel** (right/center):
  - Name input, Save/New buttons.
  - List of added monsters with quantity controls and remove button.
  - Save creates/updates encounter on backend.
  - Load saved encounters list with Load/Delete buttons.
- All math (XP thresholds, multipliers, party size adjustments) must match the existing `encounter-builder.html` logic exactly.

### 5.6 World Maps
- **Gallery**: Card grid showing map thumbnail, title, description. Mirror `world-map.html`.
- **Upload Modal**: Title, description, file input (image types). Multipart POST.
- **Detail Modal**: Two tabs — Details (image, editable title/description, save) and NPCs (filtered NPCs at this map location).
- Loading and empty states for gallery and NPC list.

### 5.7 Story Planner
- **Sidebar** (left): Chapter list with preview text. Click selects for editing. +New button.
- **Editor** (right): Title input, large content textarea. Save (POST or PUT based on whether editing existing). Clear button.
- Inline status messages (success/error with auto-dismiss).

---

## 6. Non-Functional Requirements

### 6.1 Responsiveness
- Target: mobile (320px+) through desktop.
- Single-column layout on narrow screens; multi-column on wider screens.
- Top nav collapses to hamburger menu below 640px.
- Encounter builder panels stack vertically below 800px (matching existing breakpoint).

### 6.2 Performance
- Lazy route loading for all tool pages.
- Monster list virtualization if dataset is large (500+ monsters).
- Map images use lazy loading (`loading="lazy"`).

### 6.3 Error Handling
- All API calls wrapped in try/catch.
- User-facing toast/alert for failures.
- 401 → redirect to `/login`.
- Network error → "Unable to connect" message.

### 6.4 Accessibility
- Semantic HTML (`<nav>`, `<main>`, `<section>`, `<h1>`-`<h3>`).
- ARIA labels on icon buttons, theme toggle, nav toggle.
- Focus management on modals (trap focus, close on Escape).
- Sufficient color contrast in both themes.

---

## 7. Testing Strategy

### 7.1 Unit Tests (Vitest + React Testing Library)
- **Location**: `src/**/*.test.tsx` (co-located with components).
- **Coverage targets**:
  - API client functions (mocked fetch).
  - Utility functions (CR sort, XP math, clean name, JSON field parsing).
  - Component rendering (smoke tests for every page and shared component).
  - Form interactions (submit, validation, clear).
  - Theme toggle behavior.
- **Config**: `vitest.config.ts` that extends Vite config; jsdom environment.

### 7.2 End-to-End Tests (Playwright)
- **Location**: `e2e/` directory.
- **Fixtures**: Login session setup.
- **Test scenarios**:
  1. Login → Dashboard visible → all tool cards present.
  2. Navigate to each page via top nav menu.
  3. NPC Create + list rendering.
  4. Encounter builder: add monster, adjust quantity, see difficulty update, save, load.
  5. Maps: view gallery, open detail.
  6. Story: create, edit, delete chapter.
  7. Theme toggle persists across navigation.
  8. Responsive: viewport at 375px, verify nav collapses + layout adapts.
- **Config**: `playwright.config.ts` targeting Chrome and Firefox.

### 7.3 CI Commands
```bash
npm run typecheck    # tsc -b
npm run lint         # eslint .
npm run test         # vitest run
npm run test:e2e     # playwright test
npm run build        # tsc -b && vite build
```

---

## 8. Project Directory Structure

```
ux-dmc/
├── e2e/
│   ├── fixtures/
│   │   └── auth.ts
│   ├── pages/
│   │   ├── DashboardPage.ts
│   │   ├── NPCPage.ts
│   │   ├── EncounterPage.ts
│   │   ├── MapsPage.ts
│   │   └── StoryPage.ts
│   ├── specs/
│   │   ├── auth.spec.ts
│   │   ├── navigation.spec.ts
│   │   ├── npc.spec.ts
│   │   ├── encounter.spec.ts
│   │   ├── maps.spec.ts
│   │   └── story.spec.ts
│   └── playwright.config.ts
├── public/
│   ├── favicon.svg
│   └── icons.svg
├── src/
│   ├── api/
│   │   ├── client.ts            # fetch wrapper with error handling
│   │   ├── types.ts             # TypeScript interfaces (from openapi-typescript)
│   │   ├── npcs.ts
│   │   ├── monsters.ts
│   │   ├── encounters.ts
│   │   ├── maps.ts
│   │   └── story.ts
│   ├── components/
│   │   ├── Layout/
│   │   │   ├── Layout.tsx
│   │   │   ├── Layout.module.css
│   │   │   ├── NavBar.tsx
│   │   │   ├── NavBar.module.css
│   │   │   ├── ThemeToggle.tsx
│   │   │   └── ThemeToggle.module.css
│   │   ├── EncounterBuilder/
│   │   │   ├── MonsterBrowser.tsx
│   │   │   ├── MonsterBrowser.module.css
│   │   │   ├── PartySetup.tsx
│   │   │   ├── PartySetup.module.css
│   │   │   ├── EncounterPanel.tsx
│   │   │   ├── EncounterPanel.module.css
│   │   │   ├── StatBlockModal.tsx
│   │   │   ├── StatBlockModal.module.css
│   │   │   ├── difficulty.ts    # XP threshold math (pure functions)
│   │   │   └── difficulty.test.ts
│   │   ├── NPC/
│   │   │   ├── NPCList.tsx
│   │   │   ├── NPCList.module.css
│   │   │   ├── NPCCreateForm.tsx
│   │   │   └── NPCCreateForm.module.css
│   │   ├── Maps/
│   │   │   ├── MapGallery.tsx
│   │   │   ├── MapGallery.module.css
│   │   │   ├── MapUploadModal.tsx
│   │   │   ├── MapUploadModal.module.css
│   │   │   ├── MapDetailModal.tsx
│   │   │   └── MapDetailModal.module.css
│   │   ├── StoryPlanner/
│   │   │   ├── ChapterSidebar.tsx
│   │   │   ├── ChapterSidebar.module.css
│   │   │   ├── ChapterEditor.tsx
│   │   │   └── ChapterEditor.module.css
│   │   └── shared/
│   │       ├── Modal.tsx
│   │       ├── Modal.module.css
│   │       ├── Toast.tsx
│   │       ├── Toast.module.css
│   │       ├── LoadingSpinner.tsx
│   │       └── LoadingSpinner.module.css
│   ├── hooks/
│   │   ├── useTheme.ts
│   │   └── useApi.ts
│   ├── pages/
│   │   ├── LoginPage.tsx
│   │   ├── LoginPage.module.css
│   │   ├── DashboardPage.tsx
│   │   ├── DashboardPage.module.css
│   │   ├── NPCPage.tsx
│   │   ├── EncounterBuilderPage.tsx
│   │   ├── MapsPage.tsx
│   │   └── StoryPlannerPage.tsx
│   ├── App.tsx                  # Router setup
│   ├── App.css
│   ├── index.css                # Global styles + theme variables
│   └── main.tsx
├── vitest.config.ts
├── playwright.config.ts
├── vite.config.ts
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.node.json
├── eslint.config.js
├── package.json
├── spec.md
├── AGENTS.md
└── README.md
```
---
