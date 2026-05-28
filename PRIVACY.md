# Privacy Policy — Ghar Kharcha

**Effective Date:** 1 June 2026  
**Last Updated:** 28 May 2026  
**Version:** 1.0

---

## 1. Overview

Ghar Kharcha is a client-side Progressive Web App (PWA). **We do not operate any server, database, or backend service.** This privacy policy explains how the application handles your data, and why the answer is — in almost every case — "it doesn't, because it never sees it."

---

## 2. Data We Do NOT Collect

We collect **none** of the following:

- Your name, email address, phone number, or any identity information
- Your location, IP address, or device identifiers
- Usage data, analytics, or behavioural telemetry
- Crash reports or error logs
- Cookies, tracking pixels, or fingerprinting data
- Any content you enter into the app (expense amounts, notes, photos, project names)

There is no account creation, no login, and no user profile — because there is no server to hold any of it.

---

## 3. Data Stored on Your Device

All data you enter is stored **exclusively on your own device** using the browser's built-in IndexedDB storage. This includes:

| Data Type | Where Stored | Who Can Access |
|-----------|-------------|----------------|
| Expense records (amount, date, category, note) | IndexedDB on your device | Only you, via this app |
| Receipt photos (compressed JPEG, base64) | IndexedDB on your device | Only you, via this app |
| Project name and budget | IndexedDB on your device | Only you, via this app |
| App settings | IndexedDB on your device | Only you, via this app |

This data is **never transmitted** over the internet, never synced to a cloud, and never accessible by anyone other than you.

---

## 4. Backup Files

When you use the "Export Backup" feature, a JSON file is downloaded to your device. This file contains all your expense data. **You are responsible for securing this file.** Treat it as a personal financial document — do not share it publicly or upload it to untrusted services.

---

## 5. PDF Export

When you generate a PDF report, the file is created entirely in your browser using the jsPDF library and downloaded directly to your device. **The PDF is never sent to any server.**

---

## 6. Network Requests

After the app's initial load and service worker installation, **the app makes zero outbound network requests** during normal use. All fonts, scripts, styles, and assets are precached by the Workbox service worker and served from your device's cache.

The only network activity occurs:
- On first load: to fetch app assets (served from your host/CDN)
- On service worker update checks (the browser checks for a new `sw.js` periodically)

No user data is included in either of these requests.

---

## 7. Cookies and Tracking

This application uses **zero cookies**, zero local storage tracking tokens, zero analytics SDKs, zero advertising networks, and zero third-party scripts of any kind.

---

## 8. Third-Party Services

We do not integrate with any third-party services that would receive your data. If you choose to deploy this app on a hosting platform (Vercel, Netlify, Cloudflare, etc.), that platform's own privacy policy governs their server-side logging (e.g., IP-level access logs). We have no access to or control over those logs.

---

## 9. Children's Privacy

This app does not knowingly collect any information from anyone, including children under the age of 13 (COPPA, USA), 16 (GDPR, EU), or 18 (India DPDP Act, 2023 — for sensitive data). Since no data is collected at all, there is no child-specific risk.

---

## 10. Legal Basis and Compliance

### General Data Protection Regulation (GDPR) — European Union / UK

Since no personal data is collected or processed by us, the GDPR's lawful basis requirements do not apply. There is no data controller or data processor relationship established when you use this app.

If you self-host this app and provide it to users in the EU, you are the data controller and should assess your own compliance obligations (e.g., server access logs).

### California Consumer Privacy Act (CCPA) / CPRA — USA

We do not sell, share, or otherwise disclose personal information to third parties, because we do not receive any. California residents have no data to request deletion of on our end.

### Digital Personal Data Protection Act, 2023 (DPDP Act) — India

This app does not constitute a "Data Fiduciary" under the DPDP Act because it processes no personal data on behalf of users — all data remains on the user's device. No consent notice, data audit, or Data Protection Officer is required for this application in its default form.

If you deploy this app and add analytics or server-side components, you must assess your obligations under the DPDP Act independently.

### Personal Data Protection Act (PDPA) — Thailand, Singapore

No personal data is collected, stored, or transferred across borders by this application.

### Lei Geral de Proteção de Dados (LGPD) — Brazil

No personal data is processed by this application within the meaning of the LGPD.

### Australia Privacy Act 1988

No personal information is collected by this application.

### Canada — PIPEDA / Quebec Law 25

No personal information is collected, used, or disclosed by this application.

---

## 11. Data Retention

Since no data is collected by us, there is nothing for us to retain or delete. Your device's data persists until you:
- Use "Delete All Data" in Settings
- Clear your browser's site data / IndexedDB storage
- Uninstall the app

---

## 12. Your Rights

Because we hold no data about you, there is nothing to access, correct, port, or erase on our end. Your data is entirely under your control on your own device.

---

## 13. Security

All data remains on your device, which is protected by your device's own security mechanisms (screen lock, device encryption). We recommend:
- Keeping your device's operating system and browser up to date
- Using device encryption and a secure screen lock
- Securing backup JSON files like any other financial document

See [SECURITY.md](SECURITY.md) for technical security details.

---

## 14. Changes to This Policy

We may update this policy to reflect changes in the app's functionality. The "Last Updated" date at the top of this document will always reflect the most recent revision. Material changes will be noted in [CHANGELOG.md](CHANGELOG.md).

---

## 15. Contact

This is an open-source project. For privacy-related questions, please open an issue on the GitHub repository.

---

*This privacy policy was written to be honest and plain, not to obscure what we do with your data. The honest answer is: nothing. Your data is yours.*
