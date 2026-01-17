# GitHub Copilot Instructions

This repository contains an **offline-first shopping list Progressive Web App**.
All guidance below is mandatory.

## Project Status

- **Architecture**: Fully specified (see README.md)
- **Implementation**: Bootstrap phase - Vite template in place, core features TBD
- **Dependencies**: Add `dexie` when implementing IndexedDB layer

## Architectural Constraints (Hard Rules)

- Client-only application. No backend. No server assumptions.
- IndexedDB is the **single source of truth**.
- In-memory state is a cache, never authoritative.
- The app must function with **zero network connectivity** after first load.

Violations of these rules are considered bugs.

---

## Tech Stack (Fixed)

- React 19 + TypeScript
- Vite (build tool)
- IndexedDB via **Dexie.js** (install when needed: `npm install dexie`)
- PWA: Use `vite-plugin-pwa` (install: `npm install -D vite-plugin-pwa`)
  - Configure in `vite.config.ts` with `registerType: 'autoUpdate'`
  - Generate manifest.json with app name, icons, theme colors
  - Service Worker must cache all app assets for offline use
- Routing: Use `react-router-dom` (install when needed)

Do NOT introduce:
- Redux, Zustand, MobX, or similar global state libraries
- Backend APIs, authentication, or server dependencies
- Analytics or telemetry

---

## Development Workflow

```bash
npm run dev      # Start dev server (http://localhost:5173)
npm run build    # TypeScript check + production build
npm run preview  # Preview production build locally
npm run lint     # ESLint check
```

## Testing Strategy

- **IndexedDB operations**: Test DB schema, CRUD operations, and query projections
- **Offline scenarios**: Verify app loads and functions without network
- **Export/import**: Test deterministic output and version compatibility
- **Category handling**: User-defined categories must persist and display correctly
- Use `@testing-library/react` for component tests
- Mock IndexedDB with `fake-indexeddb` for unit tests

## Routing Rules

- Two routes only:
  - `/` → Everyday Items (Page A) - item management + selection
  - `/shop` → Shopping Session (Page B) - active shopping list view
- Routes control **view selection only**, not state.
- Never store state in URL params or query strings.

---

## State Management Rules

- Do NOT introduce global state libraries.
- Persist changes **immediately** to IndexedDB on every mutation.
- UI must re-render from DB reads (treat IndexedDB as reactive source).
- Derived data must be **computed at render time**, never stored.

**Examples**:
- Shopping list (Page B) = `SELECT * FROM items WHERE is_active = true`
- WhatsApp export text = computed from current DB state in render

---

## Data Modeling Rules

- Normalize data. Separate concerns:
  - **Item definition** (id, name, category)
  - **Selection intent** (is_active flag)
  - **Shopping progress** (is_in_cart status in session)
- Never overload a boolean to represent multiple meanings.
- Use explicit field names (`is_active`, `is_in_cart`) over generic flags.

**Schema Pattern** (when implementing):
```typescript
// src/db/schema.ts
interface Item {
  id: string;
  name: string;
  category: string;  // User-defined, free-form text
  is_active: boolean;  // Selected for current shopping trip
  created_at: number;
}

interface Category {
  id: string;
  name: string;  // User creates categories on-the-fly
  created_at: number;
}
```

**Category Rules**:
- Categories are **user-defined**, not hardcoded
- Users can create new categories when adding/editing items
- Derive category list from existing items OR maintain separate Category table
- Display items grouped by category on both pages

---

## Export / Import Rules

- Export format must be:
  - **Deterministic** (same input = same output)
  - **Versioned** (e.g., `SHOPLIST_V1:<base64>`)
  - **Copy–paste friendly** (plain text, no special chars)
- Use Base64 encoding for structured data export.
- Implement version prefix for future compatibility.

---

## File Organization

- `src/db/` - IndexedDB schema + Dexie setup
- `src/components/` - Reusable React components
- `src/pages/` - Route-level page components
- `src/hooks/` - Custom hooks for DB queries
- `public/` - Static assets (PWA manifest, icons)

---

## Code Quality Expectations

- **Pure functions** preferred over stateful logic.
- **No side effects in render paths** (use useEffect for DB writes).
- **Explicit naming** over cleverness (`handleMarkItemInCart` vs `toggle`).
- **No silent fallbacks** - fail loudly in dev, gracefully in prod.
- **No magic constants** - define named constants for DB keys, event types.

**Decision Heuristic**: When ambiguous, choose:
> Simpler + more explicit + easier to reason about offline

End of instructions.
