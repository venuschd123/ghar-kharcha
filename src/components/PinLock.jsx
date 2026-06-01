import { useState, useEffect, useRef } from 'react';
import { db } from '../db';
import { Delete } from 'lucide-react';

// Random salt per PIN — prevents precomputed rainbow-table attacks
function generateSalt() {
  const arr = new Uint8Array(16);
  crypto.getRandomValues(arr);
  return Array.from(arr).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function hashPin(pin, salt) {
  const buf = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(pin + salt)
  );
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

export default function PinLock({ onUnlocked }) {
  const [input, setInput] = useState('');
  const [error, setError] = useState('');
  const [attempts, setAttempts] = useState(0);
  const inputRef = useRef();

  useEffect(() => { inputRef.current?.focus(); }, []);

  const handleKey = (k) => {
    if (k === '⌫') { setInput(v => v.slice(0, -1)); setError(''); return; }
    if (input.length >= 6) return;
    const next = input + k;
    setInput(next);
    if (next.length === 6) setTimeout(() => doSubmit(next), 80);
  };

  const doSubmit = async (pin) => {
    const stored = await db.settings.get('pin_hash');
    const saltRec = await db.settings.get('pin_salt');
    if (!stored?.value) { onUnlocked(); return; }
    // Legacy fallback: old installs had a static salt — still works, just less secure
    const salt = saltRec?.value ?? 'gkharcha_salt';
    const hash = await hashPin(pin, salt);
    if (stored.value === hash) {
      onUnlocked();
    } else {
      const next = attempts + 1;
      setAttempts(next);
      setError(next >= 5 ? 'Too many attempts — go to Settings to reset.' : `Wrong PIN (${next}/5)`);
      setInput('');
    }
  };

  const handleSubmit = () => doSubmit(input);

  const KEYS = ['1','2','3','4','5','6','7','8','9','','0','⌫'];

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'var(--navy)', zIndex: 9999,
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', gap: 24,
    }}>
      <div style={{ fontSize: 22, fontWeight: 800, color: '#fff' }}>Ghar Kharcha</div>
      <div style={{ fontSize: 14, color: 'rgba(255,255,255,.45)' }}>Enter your PIN to continue</div>

      <div style={{ display: 'flex', gap: 12 }}>
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} style={{
            width: 12, height: 12, borderRadius: '50%',
            background: i < input.length ? 'var(--accent)' : 'rgba(255,255,255,.15)',
            transition: 'background 0.15s',
          }} />
        ))}
      </div>

      {error && <div style={{ fontSize: 13, color: 'var(--danger)', fontWeight: 600 }}>{error}</div>}

      <input
        ref={inputRef}
        type="password" inputMode="numeric" maxLength={6}
        value={input}
        onChange={e => { setInput(e.target.value.replace(/\D/g, '')); setError(''); }}
        onKeyDown={e => e.key === 'Enter' && handleSubmit()}
        style={{ opacity: 0, position: 'absolute', pointerEvents: 'none' }}
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 72px)', gap: 12 }}>
        {KEYS.map((k, i) => (
          <button key={i} onClick={() => k && handleKey(k)}
            style={{
              height: 72, borderRadius: 18, border: 'none',
              cursor: k ? 'pointer' : 'default',
              background: k ? 'rgba(255,255,255,.08)' : 'transparent',
              fontSize: k === '⌫' ? 18 : 22, fontWeight: 700, color: '#fff',
              fontFamily: 'inherit', visibility: k ? 'visible' : 'hidden',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
            {k === '⌫' ? <Delete size={20} strokeWidth={2} /> : k}
          </button>
        ))}
      </div>

      <button onClick={handleSubmit} style={{
        padding: '14px 52px', borderRadius: 14, border: 'none', cursor: 'pointer',
        background: 'var(--accent)', color: '#fff', fontSize: 15, fontWeight: 700,
        fontFamily: 'inherit', boxShadow: '0 4px 16px var(--accent-glow)',
      }}>
        Unlock
      </button>
    </div>
  );
}

export async function isPinEnabled() {
  const s = await db.settings.get('pin_hash');
  return !!s?.value;
}

export async function setPin(pin) {
  if (!pin || pin.length < 4) throw new Error('PIN must be at least 4 digits');
  const salt = generateSalt();
  const hash = await hashPin(pin, salt);
  await db.settings.put({ key: 'pin_hash', value: hash });
  await db.settings.put({ key: 'pin_salt', value: salt });
}

export async function removePin() {
  await db.settings.delete('pin_hash');
  await db.settings.delete('pin_salt');
}
