# GitHub Copilot Instructions

This repository contains an **offline-first shopping list Progressive Web App**.
All guidance below is mandatory.

## Architectural Constraints (Hard Rules)

- Client-only application. No backend. No server assumptions.
- IndexedDB is the **single source of truth**.
- In-memory state is a cache, never authoritative.
- The app must function with **zero network connectivity** after first load.

Violations of these rules are considered bugs.

---

## Tech Stack (Fixed)

- React + TypeScript
- Vite
- IndexedDB
  - Prefer Dexie.js for DB access
- PWA (Service Worker + Manifest)
- Minimal dependencies only

Do NOT introduce:
- Redux, Zustand, MobX, or similar
- Backend APIs
- Authentication systems
- Analytics or telemetry

---

## Routing Rules

- Two routes only:
  - `/` → Everyday Items (Page A)
  - `/shop` → Shopping Session (Page B)
- Routes select **views**, not state.
- No state in URL params or query strings.

---

## State Management Rules

- Do NOT introduce global state libraries.
- Persist changes immediately to IndexedDB.
- UI must re-render from DB reads.
- Derived data must be computed, not stored.

Example:
- Page B list is derived from `Item.is_active === true`
- WhatsApp export text is derived at render-time

---

## Data Modeling Rules

- Normalize data.
- Separate:
  - Item definition
  - Selection intent
  - Shopping progress
- Never overload a boolean to represent multiple meanings.

---

## Export / Import Rules

- Export format must be:
  - Deterministic
  - Versioned
  - Copy–paste friendly
- Use Base64 encoding.
- Include a version prefix (e.g. `SHOPLIST_V1:`).

---

## Code Quality Expectations

- Prefer pure functions.
- Avoid side effects in render paths.
- Explicit naming over cleverness.
- No silent fallbacks.
- No magic constants.

If a decision is ambiguous, choose:
> simpler + more explicit + easier to reason about offline.

End of instructions.
