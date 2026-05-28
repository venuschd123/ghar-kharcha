# Security Policy — Ghar Kharcha

## Supported Versions

| Version | Supported |
|---------|-----------|
| 1.x     | Yes       |

---

## Security Architecture

Ghar Kharcha is a **fully client-side application** with no server component. This fundamentally limits the attack surface:

- No authentication to bypass
- No API endpoints to exploit
- No database server to attack
- No user data transmitted over the network

### Data Storage

All data is stored in the browser's **IndexedDB**, scoped to the app's origin. It is:
- Inaccessible to other websites (same-origin policy)
- Not synced to any cloud service
- Not included in any network request made by the app

### Content Security

If self-hosting, we recommend the following HTTP response headers on your server:

```
Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; font-src 'self'; img-src 'self' data: blob:; connect-src 'none'; object-src 'none'; frame-ancestors 'none';
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Referrer-Policy: no-referrer
Permissions-Policy: camera=(self), microphone=(), geolocation=(), payment=()
```

The `img-src data: blob:` directive is required to display compressed receipt photos stored as base64 data URIs.

### Photo Handling

Receipt photos are:
1. Read from the device using a standard file picker or camera
2. Resized to a maximum of 800×800px using an HTML canvas element
3. Compressed to JPEG at 70% quality in-browser
4. Stored as a base64 data string in IndexedDB
5. Never uploaded, transmitted, or shared

### Backup Files

The JSON backup export contains all user expense data. Users should treat these files as sensitive personal financial documents and store them securely.

### Dependency Security

Run `npm audit` regularly to check for known vulnerabilities in dependencies:

```bash
npm audit
npm audit fix   # Apply automatic fixes where safe
```

---

## Known Limitations

1. **No encryption at rest**: IndexedDB data is not encrypted by the application. It relies on the device's own storage encryption (e.g., iOS Data Protection, Android Full Disk Encryption). Users on unencrypted devices or shared computers should be aware of this.

2. **Backup file security**: Exported JSON files are not encrypted. If you store backups in cloud services, ensure they are access-controlled.

3. **Browser storage limits**: IndexedDB storage can be cleared by the browser under storage pressure, or by the user clearing site data. Regular backups are recommended.

---

## Reporting a Vulnerability

We take security seriously. If you discover a security vulnerability:

1. **Do not open a public GitHub issue** for security vulnerabilities.
2. Open a **private GitHub Security Advisory** in the repository (Security tab → Report a vulnerability).
3. Include:
   - A clear description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

We will respond within 72 hours and work to release a fix as quickly as possible.

For a client-side-only app, most security issues will relate to:
- XSS vulnerabilities in how user input is rendered
- Insecure handling of backup/import functionality
- Supply chain vulnerabilities in dependencies

---

## Threat Model

| Threat | Mitigation |
|--------|-----------|
| Remote data breach | No server exists — no data to breach remotely |
| XSS | React escapes all rendered user content by default |
| Data exfiltration via network | No outbound connections after initial load |
| Malicious backup import | JSON is parsed safely; no `eval()` or dynamic code execution |
| Dependency supply chain | `npm audit` + pinned lockfile; regular updates |
| Physical device access | Relies on device-level encryption and screen lock |
