# Changelog

All notable changes to Ghar Kharcha are documented here.

Format: [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)  
Versioning: [Semantic Versioning](https://semver.org/)

---

## [1.0.0] — 2026-06-01

### Added
- Dashboard with total spent, budget progress bar, category breakdown, weekly/daily/entry stats
- Add Expense form: amount, 15 categories, date, note, receipt photo (camera or upload)
- Edit and delete existing expenses
- Expenses list with full-text search and category filter, grouped by date
- Report page: category breakdown with percentages, monthly bar chart
- PDF export (jsPDF + jsPDF-AutoTable): category summary + itemised expense table
- 15 built-in Indian construction categories with emoji icons and colours
- Settings: project name, total budget, data export/import (JSON), delete all data
- Full PWA support: installable, service worker, offline caching
- Self-hosted Plus Jakarta Sans font (works offline, no Google Fonts dependency)
- Error boundary to catch and recover from unexpected React errors

### Fixed
- Expenses, Dashboard, and Report pages now use `useLiveQuery` — data updates live without page refresh
- Removed unused `sharp` server-side dependency from client bundle
- Fixed `formatDate` to parse YYYY-MM-DD as local midnight (prevents off-by-one-day bug for timezones behind UTC)
- Fixed hardcoded `200px` amount input width — now fluid on 320px phones
- Fixed all ESLint errors including unused imports and setState-in-effect patterns
- Replaced `TrendingDown` icon (wrong semantic) with `ReceiptIndianRupee` for entries count

### Security
- No outbound network requests during normal use
- All data confined to device IndexedDB storage
- Receipt photos compressed client-side, never transmitted
- CSP header recommendations documented in SECURITY.md
