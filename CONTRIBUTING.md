# Contributing to Ghar Kharcha

Thank you for considering contributing! This is a small, focused app — contributions should aim to keep it simple, fast, and privacy-respecting.

---

## Ground Rules

1. **No external APIs** — The app must remain fully functional offline. Do not add any fetch calls to external services.
2. **No analytics or tracking** — Do not add any analytics, telemetry, or error reporting services.
3. **No login or accounts** — The app is intentionally account-free.
4. **Mobile-first** — All UI changes must work on 320px–428px screen widths. Test on a real phone or browser DevTools mobile emulation.
5. **Minimal dependencies** — Every new package must justify its inclusion. Prefer using what's already there.

---

## Development Setup

```bash
git clone https://github.com/YOUR_USERNAME/ghar-kharcha.git
cd ghar-kharcha
npm install
npm run dev
```

---

## Making Changes

1. Fork the repository
2. Create a branch: `git checkout -b feature/your-feature-name`
3. Make your changes
4. Run lint: `npm run lint` — must pass with zero errors
5. Run build: `npm run build` — must succeed
6. Test on mobile viewport (375px width) in browser DevTools
7. Commit with a clear message
8. Open a Pull Request with a description of what and why

---

## What We Welcome

- Bug fixes (especially edge cases in date handling, currency formatting, PDF export)
- New construction categories (with appropriate emoji and color)
- Improved mobile UX (touch targets, scroll behaviour, input handling)
- Accessibility improvements (ARIA labels, keyboard navigation, screen reader support)
- Performance improvements (IndexedDB query optimisation, rendering)
- Localisation / i18n support for Indian regional languages
- Better PWA offline behaviour

---

## What We Won't Accept

- Features that require an internet connection during normal use
- Login / user accounts / server backends
- Analytics, crash reporting, or any data collection
- Breaking the existing dark theme without a robust alternative
- Changes that increase the initial JS bundle significantly without clear benefit

---

## Code Style

- Functional React components with hooks
- No TypeScript (this project is plain JavaScript/JSX for accessibility to contributors)
- CSS in the single `index.css` file — no CSS-in-JS, no Tailwind
- Clear variable names; minimal comments (only when the "why" is non-obvious)
- Run `npm run lint` before committing

---

## Reporting Bugs

Please open a GitHub Issue with:
- Steps to reproduce
- Expected vs actual behaviour
- Device / browser / OS
- Screenshots if relevant

For security vulnerabilities, see [SECURITY.md](SECURITY.md).

---

## License

By contributing, you agree that your contributions will be licensed under the [MIT License](LICENSE).
