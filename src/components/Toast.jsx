import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { Undo2 } from 'lucide-react';

const ToastContext = createContext(null);

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null);
  const [visible, setVisible] = useState(false);

  const show = useCallback((message, { undoFn, duration = 4000 } = {}) => {
    setToast({ message, undoFn, duration });
    setVisible(true);
  }, []);

  const dismiss = useCallback(() => {
    setVisible(false);
    setTimeout(() => setToast(null), 300);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(dismiss, toast.duration);
    return () => clearTimeout(timer);
  }, [toast, dismiss]);

  return (
    <ToastContext.Provider value={show}>
      {children}
      {toast && (
        <div className={`toast-bar${visible ? ' show' : ''}`}>
          <span className="toast-msg">{toast.message}</span>
          {toast.undoFn && (
            <button className="toast-undo" onClick={() => { toast.undoFn(); dismiss(); }}>
              <Undo2 size={13} /> Undo
            </button>
          )}
        </div>
      )}
    </ToastContext.Provider>
  );
}
