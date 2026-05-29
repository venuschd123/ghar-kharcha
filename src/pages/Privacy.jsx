import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Shield, Wifi, Lock, Trash2 } from 'lucide-react';

const POINTS = [
  { icon: Shield, title: '100% Offline', desc: 'All your data is stored locally on your device using IndexedDB. No servers, no cloud, no accounts.' },
  { icon: Wifi, title: 'No Internet Required', desc: 'The app works completely offline. We never transmit any data over the network.' },
  { icon: Lock, title: 'No Tracking', desc: 'We do not collect analytics, cookies, or personal information. Zero telemetry.' },
  { icon: Trash2, title: 'You Control Your Data', desc: 'Export your data anytime as JSON. Delete everything with one tap in Settings.' },
];

export default function Privacy() {
  const navigate = useNavigate();
  return (
    <div className="page" style={{ paddingBottom: 32 }}>
      <header className="page-header">
        <button className="back-btn" onClick={() => navigate(-1)}><ArrowLeft size={20} /></button>
        <span className="page-title">Privacy Policy</span>
        <div style={{ width: 38 }} />
      </header>

      <div style={{ padding: '0 var(--px)' }}>
        <div style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.7, marginBottom: 20 }}>
          <strong>Ghar Kharcha</strong> is built with privacy as a core principle. Your construction expense data belongs to you and stays on your device.
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {POINTS.map(({ icon: Icon, title, desc }, i) => (
            <div key={i} style={{
              background: 'var(--bg-card)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius)', padding: 16,
              display: 'flex', gap: 14, alignItems: 'flex-start',
              boxShadow: 'var(--card-shadow)',
            }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                background: 'var(--green-dim)', color: 'var(--green)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <Icon size={18} />
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>{title}</div>
                <div style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.6 }}>{desc}</div>
              </div>
            </div>
          ))}
        </div>

        <div style={{
          marginTop: 24, padding: 16, borderRadius: 'var(--radius)',
          background: 'var(--surface)', fontSize: 12, color: 'var(--text-2)', lineHeight: 1.7,
        }}>
          <strong style={{ color: 'var(--text)' }}>Data Storage:</strong> Your data is stored in your browser's IndexedDB.
          Clearing browser data or uninstalling the app will delete your data.
          We recommend using the Export feature in Settings to create regular backups.
          <br /><br />
          <strong style={{ color: 'var(--text)' }}>Open Source:</strong> This app's code is publicly available on GitHub for transparency and trust.
          <br /><br />
          <strong style={{ color: 'var(--text)' }}>Contact:</strong> For privacy questions, reach us at ghar.kharcha.app@gmail.com
        </div>

        <div style={{ textAlign: 'center', marginTop: 24, fontSize: 11, color: 'var(--text-3)' }}>
          Last updated: May 2026
        </div>
      </div>
    </div>
  );
}
