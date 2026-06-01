import { useState, useEffect, useRef } from 'react';
import { db } from '../db';

async function hashPin(pin) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(pin + 'gkharcha_salt'));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

export default function PinLock({ onUnlocked }) {
  const [input, setInput] = useState('');
  const [error, setError] = useState('');
  const [attempts, setAttempts] = useState(0);
  const inputRef = useRef();

  useEffect(() => { inputRef.current?.focus(); }, []);

  const handleSubmit = async () => {
    if (input.length < 4) { setError('PIN must be at least 4 digits'); return; }
    const hash = await hashPin(input);
    const stored = await db.settings.get('pin_hash');
    if (stored?.value === hash) {
      onUnlocked();
    } else {
      setAttempts(a => a + 1);
      setError(`Wrong PIN. ${attempts >= 4 ? 'Hint: go to Settings to reset.' : `Attempt ${attempts + 1}/5`}`);
      setInput('');
    }
  };

  const dots = Array.from({ length: 6 }, (_, i) => (
    <div key={i} style={{
      width: 12, height: 12, borderRadius: '50%',
      background: i < input.length ? 'var(--accent)' : 'var(--border-mid)',
      transition: 'background 0.15s',
    }} />
  ));

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'var(--bg)', zIndex: 9999,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 24,
    }}>
      <div style={{ fontSize: 40 }}>🔐</div>
      <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)' }}>Ghar Kharcha</div>
      <div style={{ fontSize: 14, color: 'var(--text-2)' }}>Enter your PIN to continue</div>
      <div style={{ display: 'flex', gap: 12 }}>{dots}</div>
      {error && <div style={{ fontSize: 13, color: 'var(--danger)', fontWeight: 600 }}>{error}</div>}
      <input
        ref={inputRef}
        type="password"
        inputMode="numeric"
        maxLength={6}
        value={input}
        onChange={e => { setInput(e.target.value.replace(/\D/g, '')); setError(''); }}
        onKeyDown={e => e.key === 'Enter' && handleSubmit()}
        style={{ opacity: 0, position: 'absolute', pointerEvents: 'none' }}
      />
      {/* Visual numpad for PIN entry */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 64px)', gap: 12 }}>
        {[1,2,3,4,5,6,7,8,9,'','0','⌫'].map((k, i) => (
          <button key={i} onClick={() => {
            if (k === '⌫') setInput(v => v.slice(0, -1));
            else if (k !== '' && input.length < 6) setInput(v => v + k);
          }} style={{
            height: 64, borderRadius: 16, border: 'none', cursor: k === '' ? 'default' : 'pointer',
            background: k === '' ? 'transparent' : 'var(--bg-card)',
            boxShadow: k === '' ? 'none' : 'var(--card-shadow)',
            fontSize: 20, fontWeight: 700, color: 'var(--text)',
            fontFamily: 'inherit',
            visibility: k === '' ? 'hidden' : 'visible',
          }}>
            {k}
          </button>
        ))}
      </div>
      <button onClick={handleSubmit} style={{
        padding: '14px 48px', borderRadius: 14, border: 'none', cursor: 'pointer',
        background: 'var(--accent)', color: '#fff', fontSize: 15, fontWeight: 700,
        fontFamily: 'inherit', marginTop: 8,
      }}>
        Unlock
      </button>
    </div>
  );
}

// Setup/Change PIN helpers
export async function isPinEnabled() {
  const s = await db.settings.get('pin_hash');
  return !!s?.value;
}

export async function setPin(pin) {
  if (!pin || pin.length < 4) throw new Error('PIN must be at least 4 digits');
  const hash = await hashPin(pin);
  await db.settings.put({ key: 'pin_hash', value: hash });
}

export async function removePin() {
  await db.settings.delete('pin_hash');
}
