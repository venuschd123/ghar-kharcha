# Ghar Kharcha — Claude Handoff Summary

## Project Overview
React 19 + Vite 8 PWA for tracking home construction costs in India. 100% offline (IndexedDB via Dexie.js). HashRouter-based SPA deployed to Vercel.

**Live:** https://ghar-kharcha-one.vercel.app/  
**Repo:** https://github.com/venuschd123/ghar-kharcha  
**Local:** `/Users/venusgupta/Downloads/ghar-kharcha/ghar-kharcha/`

## Dev Setup
```bash
export NVM_DIR="$HOME/.nvm" && . "$NVM_DIR/nvm.sh"  # Node 22 via nvm
npm run dev          # port 5174
npm run build        # production build
git push             # SSH key ~/.ssh/github_ghar_kharcha auto-used
```

## Tech Stack
- **React 19** + **Vite 8** (rolldown bundler — manualChunks must be a function, not object)
- **Dexie.js** — IndexedDB ORM, all data local-only
- **motion/react** (Framer Motion) — page/card animations
- **Recharts** — bar/line charts on Report page
- **Workbox PWA** — service worker, offline caching
- **@fontsource/plus-jakarta-sans** — self-hosted font
- **jsPDF + AutoTable** — PDF export
- **HashRouter** — required for Vercel static hosting

## Design System (v2 — Navy + Emerald)
- **Light mode:** bg `#F8FAFC`, card `#FFFFFF`, text `#0F172A`
- **Dark mode:** bg `#080E1A`, card `#0F1829`
- **Accent/green:** `#10B981` (emerald)
- **Gold:** `#D97706`, **Danger:** `#EF4444`, **Purple:** `#8B5CF6`
- **Hero cards** use deep navy gradient `#0F172A → #1a2744` with radial mesh glows
- CSS tokens in `src/index.css` `:root` and `[data-theme="dark"]` blocks

## File Structure
```
src/
├── pages/
│   ├── Dashboard.jsx      — hero ring, stat row, category bars, insights, recent
│   ├── AddExpense.jsx      — numpad, cat grid, vendor picker, camera/OCR
│   ├── Expenses.jsx        — search, date groups, mark-paid, swipe-delete
│   ├── Report.jsx          — period tabs, charts (Recharts), PDF/Excel export
│   ├── Settings.jsx        — project, cat budgets, theme, backup, PIN, Pro card
│   ├── Phases.jsx          — construction phases CRUD
│   ├── Vendors.jsx         — vendor list + detail
│   └── Privacy.jsx
├── components/
│   ├── Layout.jsx          — bottom nav (5 items + FAB)
│   ├── Numpad.jsx          — tactile custom numpad (no system keyboard)
│   ├── Onboarding.jsx      — first-launch flow (3 slides)
│   ├── PinLock.jsx         — PIN lock screen + helpers
│   ├── ProjectSwitcher.jsx — pill switcher in dash header
│   ├── Toast.jsx           — context + bar component
│   ├── UpgradePrompt.jsx   — Pro bottom sheet
│   ├── InstallPrompt.jsx   — PWA install banner
│   └── ErrorBoundary.jsx
├── context/
│   ├── ProjectContext.jsx  — active project, project list
│   └── ProContext.jsx      — isPro, proStatus, feature gates
├── utils/
│   ├── formatters.js       — formatCurrency, formatCompact (Indian: ₹2.5L, ₹1.2Cr)
│   ├── pdfExport.js        — jsPDF report with AutoTable
│   └── excelExport.js      — dynamic import, Pro-gated
├── db.js                   — Dexie schema (expenses, categories, vendors, phases, projects, settings, categoryBudgets)
├── index.css               — all styles, design tokens, dark mode
└── main.jsx                — app shell, lazy routes, splash, pin/onboard gate
```

## Architecture Decisions
- **All routes lazy-loaded** except Dashboard (main.jsx). Each page is a separate chunk.
- **Dashboard eager** because it is always the first screen rendered.
- **manualChunks as function** (Vite 8 / rolldown requirement — object form crashes build).
- **motion/react** used for all significant animations; CSS `transition` only for hover/focus micro-interactions.
- **cat-bar-fill** width animated via framer-motion `animate={{ width }}`, not CSS `transition:width`.
- **Skeleton shimmer** defined in CSS (`.skeleton`, `.skeleton-hero`, `.skeleton-stat`, `.skeleton-row`) shown while Dexie data loads.

## Design Fixes Applied (Design Audit Pass)
All fixes live at the bottom of `src/index.css` under "DESIGN AUDIT FIXES":

| Fix | What changed |
|-----|-------------|
| Hero contrast | `.hero-eyebrow`, `.hero-row-label` raised to `rgba(255,255,255,.58)` |
| Hero row separators | `border-top` between `.hero-row + .hero-row` |
| Category card colors | CSS `--cat-color` custom prop + `color-mix()` tinting |
| Section headers | `font-size:15px`, `font-weight:800`, no uppercase, real color |
| Expense note contrast | `.expense-note` → `var(--text-2)` (was text-3, failed WCAG) |
| Skeleton shimmer | `.skeleton` + `@keyframes shimmer` |
| Date group headers | Sticky, `font-size:13px`, `font-weight:800`, no uppercase |
| Stat icons | `background: var(--surface)` |

## Remaining / Known Issues
- `data-info` class used in Settings.jsx line 404 has no CSS rule (layout works via browser defaults but unstyled)
- `select` element in Settings (Currency) has no custom dark-mode styling — uses browser default appearance
- `form-input` select needs `-webkit-appearance: none` + custom caret for cross-browser consistency
- The `transition:width` on `.cat-bar-fill` (index.css line 409) is a dead CSS rule (framer handles it) — harmless but should be cleaned

## Monetization / Future
- Google Play via TWA (Bubblewrap) — pending
- iOS App Store via Capacitor — pending
- Pro features gated in `ProContext.jsx`: Unlimited projects, Excel export, OCR scan, Comparison analytics

## Vercel Deploy
Push to `main` → Vercel auto-deploys (~2 min). No env vars needed (fully client-side).
