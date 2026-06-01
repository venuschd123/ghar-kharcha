import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Shield, Wifi, Lock, Trash2, Camera, Code2, Bell } from 'lucide-react';

const HIGHLIGHTS = [
  { icon: Shield, title: '100% Offline', desc: 'All your data is stored locally on your device using IndexedDB. No servers, no cloud, no accounts — ever.' },
  { icon: Wifi, title: 'No Internet Required', desc: 'The app works completely offline. We never transmit any data over the network.' },
  { icon: Lock, title: 'No Tracking or Analytics', desc: 'We do not use Google Analytics, Firebase, Mixpanel, or any analytics platform. Zero telemetry, zero cookies.' },
  { icon: Camera, title: 'Photos Stay on Device', desc: 'Receipt photos are stored in your browser\'s IndexedDB. OCR scanning runs locally via Tesseract.js — no image ever leaves your device.' },
  { icon: Trash2, title: 'You Control Your Data', desc: 'Export your data anytime as JSON. Delete everything permanently with one tap in Settings → Data Management.' },
  { icon: Code2, title: 'Open Source & Transparent', desc: 'The app\'s source code is publicly available on GitHub. Anyone can verify these privacy claims.' },
];

const DETAIL_SECTIONS = [
  {
    title: 'What data is stored',
    body: `The following is stored locally on your device only:\n\n• Project names, budgets, and area (sqft)\n• Expense records: amount, date, category, note, vendor, phase\n• Receipt photos (JPEG, compressed to ≤ 800px, stored in IndexedDB)\n• Vendor names, types, and phone numbers\n• Construction phase names and statuses\n• Category budgets\n• App settings (theme, currency, unit, PIN hash)\n\nNone of this data is ever sent to any external server.`,
  },
  {
    title: 'Third-party libraries used',
    body: `The app uses the following open-source libraries, all of which operate locally:\n\n• Tesseract.js — OCR receipt scanning (runs on-device, no data sent)\n• jsPDF + AutoTable — PDF report generation (runs on-device)\n• Dexie.js — IndexedDB ORM (local database wrapper)\n• Lucide React — icon set (bundled, no network requests)\n• Framer Motion / motion/react — animations (bundled)\n• Recharts — charts (bundled)\n\nNo third-party library sends any of your data to external services.`,
  },
  {
    title: 'PIN lock security',
    body: `If you enable PIN lock, your PIN is hashed using SHA-256 before storage. The raw PIN is never stored. However, this is a client-side security feature — it is not a substitute for device-level security (biometrics, screen lock).\n\n⚠️ If you forget your PIN, there is no recovery mechanism. Your only option is to clear your browser data (Settings → Clear Site Data in Chrome/Firefox/Safari), which will permanently delete all app data. Export a backup before setting a PIN.`,
  },
  {
    title: 'Data loss risk — important',
    body: `Because data is stored in your browser's IndexedDB:\n\n• Clearing browser data / site data will delete everything\n• Uninstalling the browser or app (PWA) may delete data\n• Browser updates can occasionally reset site storage\n• If your device is lost, stolen, or damaged, data cannot be recovered\n\nWe strongly recommend exporting a JSON backup (Settings → Export Backup) regularly — at least once a week during active construction tracking.`,
  },
  {
    title: 'Children\'s privacy',
    body: `This app is intended for adults (18+) managing home construction projects. We do not knowingly collect or store any information from children under 13. If you believe a child has used this app, simply delete all data in Settings → Delete All Data.`,
  },
  {
    title: 'Changes to this policy',
    body: `We may update this Privacy Policy when new features are added that affect how data is handled. We will update the "Last updated" date below and, for significant changes, notify users within the app on their next launch.`,
  },
  {
    title: 'Contact',
    body: `For privacy questions or data concerns, reach us at:\nghar.kharcha.app@gmail.com`,
  },
];

export default function Privacy() {
  const navigate = useNavigate();
  return (
    <div className="page" style={{ paddingBottom: 40 }}>
      <header className="page-header">
        <button className="back-btn" onClick={() => navigate(-1)}><ArrowLeft size={20} /></button>
        <span className="page-title">Privacy Policy</span>
        <div style={{ width: 38 }} />
      </header>

      <div style={{ padding: '0 var(--px)' }}>
        <div style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.7, marginBottom: 20 }}>
          <strong>Ghar Kharcha</strong> is built with privacy as a core principle. Your construction expense data belongs to you and stays on your device.
        </div>

        {/* Highlight cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
          {HIGHLIGHTS.map(({ icon: Icon, title, desc }) => (
            <div key={title} style={{
              background: 'var(--bg-card)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius)', padding: 14,
              display: 'flex', gap: 14, alignItems: 'flex-start',
              boxShadow: 'var(--card-shadow)',
            }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                background: 'var(--green-dim)', color: 'var(--green)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Icon size={18} />
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 3 }}>{title}</div>
                <div style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.6 }}>{desc}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Detailed sections */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {DETAIL_SECTIONS.map(({ title, body }) => (
            <div key={title} style={{
              background: 'var(--surface)', borderRadius: 12, padding: '12px 14px',
              border: '1px solid var(--border)',
            }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--text)', marginBottom: 6 }}>{title}</div>
              <div style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.75, whiteSpace: 'pre-line' }}>{body}</div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 20, textAlign: 'center', fontSize: 12, color: 'var(--text-3)' }}>
          See also:{' '}
          <Link to="/terms" style={{ color: 'var(--accent)', fontWeight: 600 }}>Terms of Use</Link>
        </div>

        <div style={{ textAlign: 'center', marginTop: 10, fontSize: 11, color: 'var(--text-3)' }}>
          Last updated: June 2026
        </div>
      </div>
    </div>
  );
}
