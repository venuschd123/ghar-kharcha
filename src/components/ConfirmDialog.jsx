import { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, Trash2, Info } from 'lucide-react';

/**
 * In-app confirmation dialog (replaces window.confirm / window.alert).
 * Renders as a bottom sheet — consistent with the rest of the app.
 *
 * Props:
 *   open        – boolean
 *   title       – string
 *   message     – string | ReactNode
 *   confirmLabel – string (default "Confirm")
 *   cancelLabel  – string (default "Cancel")
 *   danger      – boolean — red confirm button
 *   onConfirm   – () => void
 *   onCancel    – () => void
 */
export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  danger = false,
  onConfirm,
  onCancel,
  icon,
}) {
  // Close on Escape key
  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (e.key === 'Escape') onCancel?.(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onCancel]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="bottom-overlay"
          onClick={onCancel}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
        >
          <motion.div
            className="bottom-sheet"
            onClick={e => e.stopPropagation()}
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="sheet-handle" />
            <div style={{ padding: '8px 20px 28px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Icon + Title */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginTop: 4 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 12, flexShrink: 0,
                  background: danger ? 'rgba(239,68,68,0.12)' : 'var(--accent-dim)',
                  color: danger ? 'var(--danger)' : 'var(--accent)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {icon ?? (danger ? <AlertTriangle size={20} /> : <Info size={20} />)}
                </div>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text)', lineHeight: 1.3 }}>{title}</div>
                  {message && (
                    <div style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.6, marginTop: 4 }}>{message}</div>
                  )}
                </div>
              </div>

              {/* Buttons */}
              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  onClick={onCancel}
                  style={{
                    flex: 1, height: 48, borderRadius: 12, border: '1.5px solid var(--border)',
                    background: 'transparent', color: 'var(--text-2)', fontSize: 14, fontWeight: 700,
                    fontFamily: 'inherit', cursor: 'pointer',
                  }}
                >
                  {cancelLabel}
                </button>
                <button
                  onClick={onConfirm}
                  style={{
                    flex: 1, height: 48, borderRadius: 12, border: 'none', cursor: 'pointer',
                    background: danger ? 'var(--danger)' : 'var(--accent)',
                    color: '#fff', fontSize: 14, fontWeight: 700, fontFamily: 'inherit',
                    boxShadow: danger ? '0 4px 14px rgba(239,68,68,0.3)' : '0 4px 14px var(--accent-glow)',
                  }}
                >
                  {confirmLabel}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
