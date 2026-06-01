import { Delete } from 'lucide-react';

const KEYS = ['1','2','3','4','5','6','7','8','9','.','0','⌫'];

export default function Numpad({ value, onChange }) {
  const handle = (key) => {
    if (key === '⌫') { onChange(value.slice(0, -1)); return; }
    if (key === '.' && value.includes('.')) return;
    if (key === '.' && value === '') { onChange('0.'); return; }
    const next = value === '0' ? key : value + key;
    const parts = next.split('.');
    if (parts[1] && parts[1].length > 2) return;
    if (parts[0].length > 9) return;
    onChange(next);
  };

  return (
    <div className="numpad">
      {KEYS.map(key => (
        <button
          key={key}
          className={`numpad-key${key === '.' ? ' numpad-action' : ''}${key === '⌫' ? ' numpad-delete' : ''}`}
          onPointerDown={e => { e.preventDefault(); navigator.vibrate?.(8); handle(key); }}
        >
          {key === '⌫' ? <Delete size={20} strokeWidth={2} /> : key}
        </button>
      ))}
    </div>
  );
}
