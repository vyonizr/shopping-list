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

- Offline-first (PWA)
- Client-only persistence using IndexedDB
- Mobile-first responsive design
- User-defined categories with dropdown autocomplete
- SQL-like querying via abstraction layer
- Deterministic export/import via Base64 hash
- Plain-text shopping list copy
- Installable on desktop and mobile

---

## Tech Stack

- React + TypeScript
- Vite
- IndexedDB (Dexie.js)
- Service Worker (PWA)

No backend services are used or required.

---

## Routing

| Route | Description |
|------|------------|
| `/` | Everyday Items (Page A) |
| `/shop` | Shopping Session (Page B) |

Routing controls **view selection only**.  
No state is stored in URLs.

---

## UI/UX Details

**Category Selection:**
- Dropdown list populated from existing categories
- Allows free-form text input to create new categories
- Uses HTML5 `<datalist>` for autocomplete functionality

**Design Approach:**
- Mobile-first responsive design
- Touch-friendly interface (44x44px minimum touch targets)
- Tailwind CSS for styling

---

## Data Model (Simplified)

```text
Item
- id
- name
- category
- is_active

ShoppingSession
- id
- created_at

ShoppingItem
- session_id
- item_id
- is_in_cart
