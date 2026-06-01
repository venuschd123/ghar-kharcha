import { Delete } from 'lucide-react';
import { motion } from 'motion/react';

const KEYS = ['1','2','3','4','5','6','7','8','9','.','0','⌫'];

export default function Numpad({ value, onChange }) {
  const handle = (key) => {
    navigator.vibrate?.(8);
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
    <div className="numpad-v2">
      {KEYS.map(key => (
        <motion.button
          key={key}
          className={`numpad-key-v2${key === '.' ? ' action' : ''}${key === '⌫' ? ' delete-key' : ''}`}
          onPointerDown={e => { e.preventDefault(); handle(key); }}
          whileTap={{ scale: 0.92, backgroundColor: 'var(--surface-2)' }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        >
          {key === '⌫' ? <Delete size={20} strokeWidth={2} /> : key}
        </motion.button>
      ))}
    </div>
  );
}
