import { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';

let deferredPrompt = null;

// Listen for the beforeinstallprompt event globally
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
  });
}

export default function InstallPrompt() {
  const [show, setShow] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Show after 2nd visit or 30 seconds, whichever comes first
    const visits = parseInt(localStorage.getItem('gk_visits') || '0') + 1;
    localStorage.setItem('gk_visits', String(visits));
    const wasDismissed = localStorage.getItem('gk_install_dismissed');
    const isInstalled = window.matchMedia('(display-mode: standalone)').matches;

    if (isInstalled || wasDismissed) return;

    if (visits >= 2 || deferredPrompt) {
      const timer = setTimeout(() => {
        if (deferredPrompt) setShow(true);
      }, visits >= 2 ? 3000 : 30000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShow(false);
      deferredPrompt = null;
    }
  };

  const handleDismiss = () => {
    setShow(false);
    setDismissed(true);
    localStorage.setItem('gk_install_dismissed', 'true');
  };

  if (!show || dismissed) return null;

  return (
    <div style={{
      position: 'fixed', bottom: 'calc(var(--nav-h) + 12px)', left: 12, right: 12,
      background: 'var(--accent)', color: '#fff', borderRadius: 16,
      padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12,
      boxShadow: '0 8px 30px rgba(124,58,237,0.3)', zIndex: 8500,
      animation: 'slideUp 0.3s ease',
    }}>
      <Download size={20} />
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 14, fontWeight: 700 }}>Install Ghar Kharcha</div>
        <div style={{ fontSize: 12, opacity: 0.85 }}>Add to home screen for quick access</div>
      </div>
      <button onClick={handleInstall} style={{
        background: '#fff', color: 'var(--accent)', border: 'none', borderRadius: 10,
        padding: '8px 16px', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
      }}>
        Install
      </button>
      <button onClick={handleDismiss} style={{
        background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.7)',
        cursor: 'pointer', padding: 4,
      }}>
        <X size={16} />
      </button>
    </div>
  );
}
