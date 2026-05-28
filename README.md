# Ghar Kharcha — Home Construction Cost Tracker

**Track every rupee of your home construction or renovation.**  
100% offline · Privacy-first · Installable PWA · Made in India

---

## What is Ghar Kharcha?

Ghar Kharcha ("House Expenses" in Hindi/Urdu) is a free, open-source Progressive Web App for Indian homeowners to track construction and renovation costs — no subscription, no login, no internet. All data is stored **on your device only** and never transmitted anywhere.

---

## Features

| Feature | Detail |
|---------|--------|
| Dashboard | Total spent, budget progress, category breakdown, quick stats |
| Add Expense | Amount, category, date, note, receipt photo (camera or upload) |
| 15 Built-in Categories | Labour/Mistri, Cement, Steel/Sariya, Bricks, Sand, Plumbing, Electrical, Paint, Carpenter, Tiles, Doors & Windows, Kitchen/Bath, Architect, Transport, Miscellaneous |
| Expenses List | Search by note/category/amount, filter by category, grouped by date |
| Reports | Category breakdown with percentages, monthly spending bar chart |
| PDF Export | Professional multi-page PDF — category summary + itemised expenses |
| Receipt Photos | Camera capture or upload; auto-compressed, stored locally |
| Backup & Restore | Export all data as JSON; import on any device |
| Budget Tracking | Set total project budget; see remaining/over-budget indicators |
| Offline-First | Works with zero internet — fonts and assets fully precached |
| Installable PWA | Add to home screen on Android or iOS |

---

## Quick Start

### Local Development (Node.js 18+)

```bash
git clone https://github.com/YOUR_USERNAME/ghar-kharcha.git
cd ghar-kharcha
npm install
npm run dev
# Open http://localhost:5173
```

### Production Build

```bash
npm run build      # Output in dist/
npm run preview    # Preview production build locally
```

### Docker

```bash
docker build -t ghar-kharcha .
docker run -d -p 3000:80 ghar-kharcha
```

---

## Deploy (Free Options)

- **Vercel:** Import repo → Framework: Vite → Deploy
- **Netlify:** Build command `npm run build` · Publish dir `dist`
- **Cloudflare Pages:** Same settings as Netlify
- **GitHub Pages:** See `.github/workflows/deploy.yml`

---

## Install as Native App (PWA)

**Android (Chrome):** Tap "Add to Home Screen" banner or ⋮ menu → "Install app"  
**iPhone (Safari):** Share button → "Add to Home Screen"

---

## Security & Privacy

- No server, no backend, no database — nothing to breach remotely
- All data in your browser's IndexedDB storage
- Zero analytics, zero tracking, zero cookies, zero ads
- Receipt photos stored locally, never uploaded

See [SECURITY.md](SECURITY.md) and [PRIVACY.md](PRIVACY.md) for full policies.

---

## Tech Stack

React 19 · Vite 8 · Dexie.js (IndexedDB) · React Router 7 · Lucide React · jsPDF · Workbox PWA · Plus Jakarta Sans (self-hosted font)

---

## Project Structure

```
src/
├── components/
│   ├── Layout.jsx          Bottom nav + route outlet
│   └── ErrorBoundary.jsx   Global React error handler
├── pages/
│   ├── Dashboard.jsx       Live stats and recent expenses
│   ├── AddExpense.jsx      Add / edit expense form
│   ├── Expenses.jsx        Full list — search, filter, group
│   ├── Report.jsx          Charts and PDF export
│   └── Settings.jsx        Project settings, backup/restore
├── utils/
│   ├── formatters.js       Currency, date, grouping utilities
│   └── pdfExport.js        PDF generation with jsPDF
├── db.js                   Dexie schema + default categories
├── main.jsx                App entry point + error boundary
└── index.css               Complete design system styles
```

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for how to get involved.

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for version history.

## License

[MIT](LICENSE) — free to use, modify, and distribute.
