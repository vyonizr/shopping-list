# Offline Shopping List PWA

An **offline-first shopping list web app** designed for deterministic behavior,
local-only data storage, and frictionless cross-device transfer via copy–paste.

No backend. No accounts. No sync servers.

---

## Core Concept

The app separates **item definition** from **shopping execution**.

- **Page A (Everyday Items)**
  - Define reusable items
  - Assign categories
  - Select items needed for a shopping trip

- **Page B (Shopping Session)**
  - Shows only selected items
  - Tracks whether items are already in the cart
  - Supports plain-text export (e.g. WhatsApp)

Both pages operate on the same local database using different projections.

---

## Features

### Page A: Everyday Items
- Add, edit, delete items with names and categories
- User-defined categories with dropdown + free-form input
- Select items for shopping (checkbox to mark as active)
- Search items by name or category
- Category management (rename, delete entire categories)
- Bulk select/clear all items
- Collapsible category groups
- Backup/restore database (GZIP compressed + Base64 encoded)

### Page B: Shopping Session
- View only selected items grouped by category
- Mark items as "in cart" with checkbox
- Add notes to specific items during shopping
- Copy shopping list to clipboard (formatted for WhatsApp)
- Complete session (clears all selections and notes)
- Progress tracker (items in cart / total items)

### Technical Features
- Offline-first Progressive Web App (PWA)
- Client-only persistence using IndexedDB via Dexie.js
- Mobile-first responsive design with Tailwind CSS
- shadcn/ui components with Radix UI primitives
- Deterministic export/import with versioned format
- Installable on desktop and mobile devices
- Toast notifications for user feedback
- Loading states for async operations

---

## Tech Stack

- React 19 + TypeScript
- Vite (build tool)
- IndexedDB via Dexie.js + dexie-react-hooks
- React Router for client-side routing
- Tailwind CSS 4 + shadcn/ui components
- vite-plugin-pwa for Service Worker
- Sonner for toast notifications
- Lucide React for icons

No backend services are used or required.

---

## Routing

| Route | Description |
|------|------------|
| `/` | Everyday Items (Page A) - Item management & selection |
| `/shop` | Shopping Session (Page B) - Active shopping list |

Routing controls **view selection only**.  
No state is stored in URLs or query parameters.

---

## UI/UX Details

**Category Management:**
- Dropdown with existing categories + ability to create new ones
- Free-form text input for new categories
- Category rename/delete operations
- Items grouped by category with collapsible sections

**Shopping Session:**
- In-memory cart state (not persisted to DB)
- Session notes stored in IndexedDB
- WhatsApp-formatted plain text export
- Visual progress indicator

**Design Approach:**
- Mobile-first responsive design
- Touch-friendly interface (44x44px minimum touch targets)
- Tailwind CSS with serif typography (Georgia, Times)
- shadcn/ui components for consistent UI
- Loading states and optimistic UI updates

---

## Data Model

```typescript
Item {
  id?: number;           // Auto-incremented primary key
  name: string;          // Item name (e.g., "Milk")
  category: string;      // User-defined category
  is_active: boolean;    // Selected for current shopping trip
  created_at: number;    // Unix timestamp
}

Category {
  id?: number;           // Auto-incremented primary key
  name: string;          // Category name
  created_at: number;    // Unix timestamp
}

SessionNote {
  id?: number;           // Auto-incremented primary key
  item_id: number;       // References Item.id
  note: string;          // User note for shopping session
  created_at: number;    // Unix timestamp
}
```

**State Management:**
- `is_active` flag controls which items appear on Shopping Session page
- `inCartIds` stored in React state (session-only, not persisted)
- Session notes persist in IndexedDB until session completion
- Export/import includes items only (not session state)

---

## Export/Import Format

```
SHOPLIST_DB_V1_GZIP:<base64-encoded-gzip-compressed-json>
```

**Export Data Structure:**
```json
{
  "version": "SHOPLIST_DB_V1",
  "timestamp": 1234567890,
  "itemCount": 42,
  "items": [
    {
      "name": "Milk",
      "category": "Dairy",
      "is_active": false,
      "created_at": 1234567890
    }
  ]
}
```

Compression uses browser-native `CompressionStream` API with gzip.

---

## Development

```bash
npm install          # Install dependencies
npm run dev          # Start dev server (http://localhost:5173)
npm run build        # TypeScript check + production build
npm run preview      # Preview production build locally
npm run lint         # ESLint check
```

---

## Project Structure

```
src/
├── db/
│   └── schema.ts              # IndexedDB schema (Dexie.js)
├── pages/
│   ├── EverydayItems.tsx      # Page A: Item management
│   └── ShoppingSession.tsx    # Page B: Shopping session
├── components/
│   ├── Navigation.tsx         # Bottom navigation
│   └── ui/                    # shadcn/ui components
├── utils/
│   └── compression.ts         # GZIP utilities
└── lib/
    └── utils.ts               # Tailwind helpers
```

