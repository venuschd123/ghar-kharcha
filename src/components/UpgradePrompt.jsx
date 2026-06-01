import { useState } from 'react';
import { X, Zap, Check, CreditCard, Star } from 'lucide-react';
import { activateTrial, activatePro } from '../context/ProContext';

const FEATURE_NAMES = {
  multi_project:      'Multiple Projects',
  ocr_scan:           'OCR Receipt Scanning',
  excel_export:       'Excel Export',
  comparison_charts:  'Comparison Analytics',
  advanced_pdf:       'Advanced PDF Reports',
};

const PRO_PERKS = [
  'Unlimited projects',
  'Excel export with full breakdown',
  'OCR receipt scanning',
  'Comparison analytics',
  'Priority support',
];

export default function UpgradePrompt({ feature, onClose, onUpgraded }) {
  const [mode, setMode] = useState('prompt'); // 'prompt' | 'code'
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleTrial = async () => {
    setLoading(true);
    await activateTrial();
    setLoading(false);
    onUpgraded?.();
    onClose?.();
  };

  const handleCode = async () => {
    if (!code.trim()) return;
    setLoading(true);
    setError('');
    const result = await activatePro(code.trim().toUpperCase());
    setLoading(false);
    if (result.ok) {
      onUpgraded?.();
      onClose?.();
    } else {
      setError(result.error);
    }
  };

  return (
    <div className="bottom-overlay" onClick={onClose}>
      <div className="bottom-sheet" onClick={e => e.stopPropagation()}>
        <div className="sheet-handle" />

        <div style={{ padding: '16px 20px 28px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div className="upgrade-badge">
                <Zap size={11} /> Pro
              </div>
              <div style={{ fontSize: 19, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.3px' }}>
                Unlock Ghar Kharcha Pro
              </div>
              {feature && FEATURE_NAMES[feature] && (
                <div style={{ fontSize: 13, color: 'var(--text-2)', marginTop: 2 }}>
                  {FEATURE_NAMES[feature]} requires Pro
                </div>
              )}
            </div>
            <button
              onClick={onClose}
              style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--surface)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-3)', flexShrink: 0 }}
              aria-label="Close"
            >
              <X size={16} />
            </button>
          </div>

          {/* Perks list */}
          <div style={{ background: 'var(--surface)', borderRadius: 14, padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {PRO_PERKS.map(perk => (
              <div key={perk} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13 }}>
                <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'var(--accent-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Check size={11} color="var(--accent)" strokeWidth={3} />
                </div>
                <span style={{ color: 'var(--text)', fontWeight: 600 }}>{perk}</span>
              </div>
            ))}
          </div>

          {mode === 'prompt' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {/* Buy Pro — ₹299/year (primary CTA) */}
              <a
                href="#razorpay-not-yet"
                // TODO: replace with Razorpay checkout URL when store listing is live
                onClick={e => e.preventDefault()}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  width: '100%', height: 50, borderRadius: 14, textDecoration: 'none',
                  background: 'linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%)',
                  color: '#fff', fontSize: 15, fontWeight: 700,
                  boxShadow: '0 4px 14px rgba(124,58,237,0.4)',
                }}
              >
                <CreditCard size={17} /> Buy Pro — ₹299/year
              </a>

              {/* Lifetime option */}
              <a
                href="#razorpay-not-yet"
                // TODO: replace with Razorpay lifetime checkout URL when live
                onClick={e => e.preventDefault()}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  width: '100%', height: 46, borderRadius: 12, textDecoration: 'none',
                  background: 'var(--surface)', color: 'var(--text-2)',
                  border: '1.5px solid var(--border-mid)',
                  fontSize: 13, fontWeight: 700,
                }}
              >
                <Star size={14} /> Lifetime Access — ₹999 one-time
              </a>

              {/* Early access note */}
              <div style={{
                background: 'var(--accent-dim)', borderRadius: 10, padding: '8px 12px',
                border: '1px solid var(--accent-border)', fontSize: 12, color: 'var(--text-2)', lineHeight: 1.6,
              }}>
                <strong style={{ color: 'var(--accent)' }}>Early Access:</strong> Try Pro free now. Paid plans activate when store listing goes live.
              </div>

              {/* Try free */}
              <button
                onClick={handleTrial}
                disabled={loading}
                style={{
                  width: '100%', height: 46, borderRadius: 12, border: 'none', cursor: 'pointer',
                  background: 'var(--accent)', color: '#fff', fontSize: 14, fontWeight: 700,
                  fontFamily: 'inherit', boxShadow: '0 3px 10px var(--accent-glow)',
                  opacity: loading ? 0.7 : 1,
                }}
              >
                {loading ? 'Activating...' : 'Try Pro Free — 30 days'}
              </button>

              <button
                onClick={() => setMode('code')}
                style={{
                  width: '100%', height: 40, borderRadius: 12, cursor: 'pointer',
                  background: 'transparent', border: '1.5px solid var(--border-mid)',
                  color: 'var(--text-2)', fontSize: 13, fontWeight: 600, fontFamily: 'inherit',
                }}
              >
                I have a purchase code
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <input
                className="form-input"
                placeholder="Enter code (e.g. GKAB12CD34)"
                value={code}
                onChange={e => { setCode(e.target.value); setError(''); }}
                style={{ textTransform: 'uppercase', letterSpacing: '1.5px', fontWeight: 700 }}
                autoFocus
                onKeyDown={e => e.key === 'Enter' && handleCode()}
              />
              {error && <div style={{ fontSize: 12, color: 'var(--danger)', fontWeight: 600 }}>{error}</div>}
              <button
                onClick={handleCode} disabled={!code.trim() || loading}
                style={{ width: '100%', height: 48, borderRadius: 12, border: 'none', cursor: 'pointer', background: 'var(--accent)', color: '#fff', fontSize: 14, fontWeight: 700, fontFamily: 'inherit', opacity: loading ? 0.7 : 1 }}
              >
                {loading ? 'Checking...' : 'Activate'}
              </button>
              <button
                onClick={() => setMode('prompt')}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', fontSize: 13, fontFamily: 'inherit', padding: '4px 0' }}
              >
                Back
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
