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

## Key Components Added
- `src/components/ConfirmDialog.jsx` — reusable in-app confirmation bottom-sheet (replaces all window.confirm/alert)
  - Props: open, title, message, danger, confirmLabel, cancelLabel, onConfirm, onCancel, icon
  - Used in: Dashboard, Settings, Vendors

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

## Legal Pages
- `/privacy` — Privacy Policy (6 highlight cards + 7 detail sections)
- `/terms` — Terms of Use (12 sections: nature of app, data storage, OCR/photos, Pro features, no-warranty, liability, governing law India)
- Both linked from Settings → About section

## Features Added (June 2026 — Session 2)

### Dashboard Overhaul
- **Spending Velocity row** — This Week vs Last Week with trend arrow (green=down, red=up)
- **Top Vendors mini-strip** — scrollable cards with vendor name + total spend
- **Budget at Risk banner** — amber warning when projected weekly burn will exceed budget
- **Health Score badge** — Excellent/On Track/At Risk/Critical, calculated from phases done %, pending dues %, budget remaining %, weekly entries. Tap ? for tooltip.
- **Tappable stat cards** — Today → /expenses filtered for today, This Week → week filter, Entries → all
- **Ring shimmer** — animated highlight on SVG budget ring track (compositor-only: strokeDashoffset)
- **Vendor names in Recent** — shows "Category · Vendor Name" in recent expense list
- **Fresh project empty state** — 3 quick-action buttons (Add Expense, Add Vendor, Set Budget)

### SEO & Discoverability
- `<html lang="en-IN">`, full meta description, keywords, canonical URL
- Open Graph + Twitter Card meta tags with og:url, og:image, og:locale
- JSON-LD `SoftwareApplication` schema with offers (free + ₹299 Pro)
- PWA manifest: lang, categories, screenshots, improved description
- `public/robots.txt` and `public/sitemap.xml`
- **Viral share hook**: after 10th expense, dismissible banner with navigator.share
- Settings → About: large prominent "Share" button, "Rate this app" link, "Home Construction Tracker" subtitle

### Pro Plan Hardening
- **SHA-256 code validation** (`src/utils/proCode.js`): 20 real hashes stored, salt hardcoded (accepted tradeoff for offline)
- **Rate limiting**: 5 wrong attempts in 24h → lockout with support@gharkharcha.app message
- **Trial expiry**: 30 days from activation, shows days remaining, expired state with upgrade CTA
- **Buy Pro ₹299/year** + **Lifetime ₹999** buttons in UpgradePrompt (Razorpay TODO placeholder)
- **PIN_LOCK removed from PRO_FEATURES** — security is now always free
- Settings Pro card shows trial days remaining and expired state

### Security
- CSP `<meta>` tag in index.html
- Backup import: 5MB size limit, 50K entry sanity check, `doImportRaw` extracted (no recursive loop)
- Prototype pollution guard on backup JSON parse
- Zero `dangerouslySetInnerHTML` confirmed (grepped)

### Onboarding
- Slide 0: new headline "Every rupee matters. Track it all." + "Home Construction Tracker" subtitle
- New Slide 1 (feature tour): 3 cards — Track Expenses, Manage Vendors, See Reports
- 3-dot pagination; Skip button on feature tour slide
- Post-onboarding FAB hint: "Tap + to log your first expense" floating tooltip (dismisses on tap or first save)

## Features Added (June 2026)
- **Vendor editing**: pencil button in VendorDetail header → EditVendorSheet (name/phone/type pre-filled)
- **Expenses search**: vendor name now included in search (note, category, vendor, amount)
- **Report MoM%**: always shown regardless of budget or period; calculated from all paid expenses
- **Report Excel**: auto-triggers download immediately after Pro upgrade via UpgradePrompt
- **Excel import fix**: `XLSX = xlsxModule.default ?? xlsxModule` guards CJS/ESM interop
- **Phase editing**: + button to add, pencil to edit (name/emoji picker), trash to delete
- **Category management**: Settings has "Categories" card with edit (name/emoji/color palette) + delete (reassigns to Misc) + add custom category

## Remaining / Known Issues
- The `transition:width` on `.cat-bar-fill` (index.css line 409) is a dead CSS rule (framer handles it) — harmless but should be cleaned
- Deleting a phase leaves `phaseId` FK dangling on any expenses that referenced it (low priority — expenses display fine since phaseId is optional)
- App name "Ghar Kharcha" is confirmed correct and culturally appropriate for Indian market — no change needed

## Monetization / Future
- Google Play via TWA (Bubblewrap) — pending
- iOS App Store via Capacitor — pending
- Pro features gated in `ProContext.jsx`: Unlimited projects, Excel export, OCR scan, Comparison analytics

## Vercel Deploy
Push to `main` → Vercel auto-deploys (~2 min). No env vars needed (fully client-side).
