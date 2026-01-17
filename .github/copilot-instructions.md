# GitHub Copilot Instructions

This repository contains an **offline-first shopping list Progressive Web App**.
All guidance below is mandatory.

## Project Status

- **Architecture**: Fully implemented and operational
- **Implementation**: All core features complete
  - Page A (Everyday Items): Item CRUD, categories, search, bulk operations, backup/restore
  - Page B (Shopping Session): Cart tracking, session notes, WhatsApp export
- **Database**: IndexedDB with Dexie.js, 3 tables (items, categories, sessionNotes)
- **PWA**: Configured with vite-plugin-pwa, service worker active
- **Design**: Mobile-first responsive UI with Tailwind CSS 4 and shadcn/ui components
- **Typography**: Serif fonts (ui-serif, Georgia, Times) applied globally

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
- **UI Components**: shadcn/ui with Radix UI primitives
  - Button, Checkbox, Input, Label, Select components in `src/components/ui/`
  - Utility functions in `src/lib/utils.ts`
  - Path aliases configured (`@/*` → `./src/*`)
- **Typography**: Serif fonts (ui-serif, Georgia, Times) configured in Tailwind

Do NOT introduce:
- Redux, Zustand, MobX, or similar global state libraries
- Backend APIs, authentication, or server dependencies
- Analytics or telemetry
- Other component libraries (Material-UI, Ant Design, etc.)

---

## Development Workflow

```bash
npm run dev      # Start dev server (http://localhost:5173)
npm run build    # TypeScript check + production build
npm run preview  # Preview production build locally
npm run lint     # ESLint check
npm test         # Run tests with Vitest
npm run test:ui  # Run tests with Vitest UI
```

## Testing Strategy

- **Test Runner**: Vitest
- **Component Testing**: `@testing-library/react` with React 19 support
- **IndexedDB Mocking**: Use `fake-indexeddb` for unit tests
- **Test Coverage**:
  - IndexedDB operations: DB schema, CRUD operations, query projections
  - Offline scenarios: Verify app loads and functions without network
  - Export/import: Test deterministic output, compression, and version compatibility
  - Category handling: User-defined categories must persist and display correctly
  - Component behavior: User interactions, state updates, error handling
- **Installation** (when needed):
  ```bash
  npm install -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event fake-indexeddb jsdom
  ```
- **Configuration**: Add `vitest.config.ts` with jsdom environment and path aliases
- **Test File Naming**: `*.test.ts`, `*.test.tsx` co-located with source files or in `__tests__` directories

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

**Actual Schema** (implemented in src/db/schema.ts):
```typescript
interface Item {
  id?: number;         // Auto-incremented by Dexie
  name: string;
  category: string;    // User-defined, free-form text
  is_active: boolean;  // Selected for current shopping trip
  created_at: number;  // Unix timestamp
}

interface Category {
  id?: number;         // Auto-incremented by Dexie
  name: string;        // User creates categories on-the-fly
  created_at: number;  // Unix timestamp
}

interface SessionNote {
  id?: number;         // Auto-incremented by Dexie
  item_id: number;     // Foreign key to Item.id
  note: string;        // User note during shopping session
  created_at: number;  // Unix timestamp
}

// Database version 1: items, categories
// Database version 2: added sessionNotes
```

**Category Rules**:
- Categories are **user-defined**, not hardcoded
- Use a **dropdown/datalist** showing existing categories with ability to type new category
- Users can create new categories on-the-fly when adding/editing items
- Derive category list from existing items OR maintain separate Category table
- Display items grouped by category on both pages

## UI/UX Requirements

- **Mobile-first design**: Optimize for small screens, then enhance for larger displays
- **Touch-friendly**: Minimum 44x44px touch targets for buttons and checkboxes
- **Responsive layouts**: Use Tailwind's responsive utilities (sm:, md:, lg:)
- **Category input**: Dropdown with existing categories + free-form text input for new ones

---

## Export / Import Rules

- **Implemented format**: `SHOPLIST_DB_V1_GZIP:<base64>`
- Export process:
  1. Serialize items to JSON
  2. Compress using browser-native `CompressionStream` (gzip)
  3. Base64 encode compressed data
  4. Prepend version prefix
- Import process:
  1. Parse version prefix and validate
  2. Base64 decode
  3. Decompress using `DecompressionStream`
  4. Parse JSON and validate structure
  5. Clear existing items and import new ones
- Version prefix enables future format compatibility
- Compression utilities in `src/utils/compression.ts`
- Export includes: version, timestamp, itemCount, items array
- Session state (is_active, session notes) is NOT exported

---

## File Organization

- `src/db/schema.ts` - IndexedDB schema with Dexie.js (3 tables)
- `src/pages/EverydayItems.tsx` - Page A: Item management, categories, search, backup/restore
- `src/pages/ShoppingSession.tsx` - Page B: Active shopping list, cart, notes, export
- `src/components/Navigation.tsx` - Bottom navigation bar
- `src/components/ui/` - shadcn/ui components (button, checkbox, input, label, select, alert-dialog, sonner)
- `src/utils/compression.ts` - GZIP compression/decompression utilities
- `src/lib/utils.ts` - Tailwind class merging utilities
- `public/` - Static assets (icons, manifest)

---

## Implemented Features Reference

### Page A: Everyday Items
1. **Item Management**: Add, edit, delete items with duplicate detection
2. **Categories**: User-defined categories with dropdown + free-form input
3. **Selection**: Checkbox to mark items for shopping (`is_active` flag)
4. **Search**: Real-time filter by item name or category
5. **Bulk Operations**: Select All / Clear All buttons
6. **Category Management**: Rename or delete entire categories
7. **Collapsible Groups**: Expand/collapse categories with chevron icons
8. **Backup/Restore**: Export/import database with GZIP compression
9. **Toast Notifications**: User feedback for all operations
10. **Loading States**: Spinners for async operations

### Page B: Shopping Session
1. **Active Items Only**: Displays items where `is_active = true`
2. **In-Cart Tracking**: In-memory Set (not persisted to DB)
3. **Session Notes**: Per-item notes stored in `sessionNotes` table
4. **Progress Indicator**: "X / Y in cart" badge
5. **WhatsApp Export**: Formatted plain text with emojis and categories
6. **Complete Session**: Clears all `is_active` flags and session notes
7. **Category Grouping**: Same collapsible UI as Page A

### Technical Implementation
- **IndexedDB**: 3 tables (items, categories, sessionNotes) via Dexie.js
- **Live Queries**: `useLiveQuery` hook for reactive UI updates
- **Optimistic UI**: Instant feedback with async DB writes
- **Error Handling**: Try/catch blocks with toast error messages
- **TypeScript**: Full type safety with Dexie EntityTable types
- **Accessibility**: Semantic HTML, ARIA labels, keyboard navigation

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
