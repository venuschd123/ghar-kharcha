import { useState } from 'react';
import { X, Zap } from 'lucide-react';
import { activateTrial, activatePro } from '../context/ProContext';

export default function UpgradePrompt({ feature, onClose, onUpgraded }) {
  const [mode, setMode] = useState('prompt'); // 'prompt' | 'code'
  const [code, setCode] = useState('');
  const [error, setError] = useState('');

  const featureNames = {
    multi_project: 'Multiple Projects',
    ocr_scan: 'OCR Receipt Scanning',
    excel_export: 'Excel Export',
    comparison_charts: 'Comparison Analytics',
    pin_lock: 'PIN Lock',
    advanced_pdf: 'Advanced PDF Reports',
  };

  const handleTrial = async () => {
    await activateTrial();
    onUpgraded?.();
    onClose?.();
  };

  const handleCode = async () => {
    const ok = await activatePro(code.trim().toUpperCase());
    if (ok) { onUpgraded?.(); onClose?.(); }
    else setError('Invalid code. Purchase at gharkharchaapp.in');
  };

  return (
    <div className="bottom-overlay" onClick={onClose}>
      <div className="bottom-sheet" onClick={e => e.stopPropagation()} style={{ maxHeight: '80vh' }}>
        <div className="sheet-handle" />
        <div style={{ padding: '16px 20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <div style={{ width: 32, height: 32, borderRadius: 10, background: 'var(--accent-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)' }}>
                  <Zap size={16} />
                </div>
                <span style={{ fontSize: 17, fontWeight: 800, color: 'var(--text)' }}>Upgrade to Pro</span>
              </div>
              {feature && <div style={{ fontSize: 13, color: 'var(--text-2)' }}>{featureNames[feature]} requires Pro</div>}
            </div>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', padding: 4 }}><X size={18} /></button>
          </div>

          {/* Pro features list */}
          <div style={{ background: 'var(--surface)', borderRadius: 14, padding: 14 }}>
            {Object.entries(featureNames).map(([k, label]) => (
              <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0', fontSize: 13 }}>
                <div style={{ width: 18, height: 18, borderRadius: '50%', background: 'var(--green-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ fontSize: 10, color: 'var(--green)', fontWeight: 900 }}>✓</span>
                </div>
                <span style={{ color: 'var(--text)', fontWeight: 600 }}>{label}</span>
              </div>
            ))}
          </div>

          {/* Pricing */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <div style={{ background: 'var(--accent-dim)', borderRadius: 14, padding: 14, border: '2px solid var(--accent-border)' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Annual</div>
              <div style={{ fontSize: 22, fontWeight: 900, color: 'var(--accent)', marginTop: 4 }}>₹499</div>
              <div style={{ fontSize: 11, color: 'var(--text-2)' }}>per year · ₹42/month</div>
            </div>
            <div style={{ background: 'var(--green-dim)', borderRadius: 14, padding: 14, border: '1px solid rgba(5,150,105,0.2)' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--green)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Lifetime</div>
              <div style={{ fontSize: 22, fontWeight: 900, color: 'var(--green)', marginTop: 4 }}>₹999</div>
              <div style={{ fontSize: 11, color: 'var(--text-2)' }}>one-time · forever</div>
            </div>
          </div>

          {mode === 'prompt' ? (
            <>
              <button onClick={handleTrial} style={{ padding: '14px', borderRadius: 14, border: 'none', cursor: 'pointer', background: 'var(--accent)', color: '#fff', fontSize: 15, fontWeight: 700, fontFamily: 'inherit' }}>
                Try Pro Free — 7 Days
              </button>
              <button onClick={() => setMode('code')} style={{ padding: '10px', borderRadius: 12, border: '1px solid var(--border)', cursor: 'pointer', background: 'transparent', color: 'var(--text-2)', fontSize: 13, fontFamily: 'inherit' }}>
                I have a purchase code
              </button>
            </>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <input
                className="form-input"
                placeholder="Enter code (e.g. GK-XXXXX)"
                value={code}
                onChange={e => { setCode(e.target.value); setError(''); }}
                style={{ textTransform: 'uppercase', letterSpacing: '1px' }}
                autoFocus
              />
              {error && <div style={{ fontSize: 12, color: 'var(--danger)' }}>{error}</div>}
              <button onClick={handleCode} style={{ padding: '12px', borderRadius: 12, border: 'none', cursor: 'pointer', background: 'var(--accent)', color: '#fff', fontSize: 14, fontWeight: 700, fontFamily: 'inherit' }}>
                Activate
              </button>
              <button onClick={() => setMode('prompt')} style={{ padding: '10px', borderRadius: 12, border: 'none', cursor: 'pointer', background: 'transparent', color: 'var(--text-3)', fontSize: 12, fontFamily: 'inherit' }}>
                Back
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
