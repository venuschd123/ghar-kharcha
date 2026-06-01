import React, { useState, useEffect, Suspense, lazy } from 'react';
import ReactDOM from 'react-dom/client';
import { Building2 } from 'lucide-react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import ErrorBoundary from './components/ErrorBoundary';
import Onboarding from './components/Onboarding';
import { ToastProvider } from './components/Toast';
import { ProjectProvider } from './context/ProjectContext';
import { ProProvider } from './context/ProContext';
import PinLock, { isPinEnabled } from './components/PinLock';
import { db, initDB } from './db';
import { setCurrency, setUnit } from './utils/formatters';
import './index.css';

// Lazy-load all heavy pages — each becomes a separate chunk
// Dashboard is kept eager because it's always the first screen
import Dashboard from './pages/Dashboard';
const AddExpense = lazy(() => import('./pages/AddExpense'));
const Expenses   = lazy(() => import('./pages/Expenses'));
const Report     = lazy(() => import('./pages/Report'));
const Settings   = lazy(() => import('./pages/Settings'));
const Vendors    = lazy(() => import('./pages/Vendors').then(m => ({ default: m.default })));
const VendorDetail = lazy(() => import('./pages/Vendors').then(m => ({ default: m.VendorDetail })));
const Phases     = lazy(() => import('./pages/Phases'));
const Privacy    = lazy(() => import('./pages/Privacy'));

// Minimal skeleton shown while a lazy chunk loads
function PageFallback() {
  return (
    <div className="page dashboard">
      <div style={{ padding: '20px 20px 12px', display: 'flex', justifyContent: 'space-between' }}>
        <div className="skeleton" style={{ height: 24, width: 140, borderRadius: 6 }} />
        <div className="skeleton" style={{ width: 40, height: 40, borderRadius: 10 }} />
      </div>
      <div className="skeleton skeleton-hero" />
      <div style={{ display: 'flex', gap: 10, padding: '0 20px 12px' }}>
        <div className="skeleton skeleton-stat" />
        <div className="skeleton skeleton-stat" />
        <div className="skeleton skeleton-stat" />
      </div>
      <div className="skeleton skeleton-row" />
      <div className="skeleton skeleton-row" />
      <div className="skeleton skeleton-row" />
    </div>
  );
}

function App() {
  const [ready, setReady] = useState(false);
  const [onboarded, setOnboarded] = useState(true);
  const [locked, setLocked] = useState(false);

  useEffect(() => {
    initDB()
      .then(async () => {
        const [onb, themePref, currPref, unitPref] = await Promise.all([
          db.settings.get('onboardingDone'),
          db.settings.get('theme'),
          db.settings.get('currency'),
          db.settings.get('unit'),
        ]);
        if (currPref?.value) setCurrency(currPref.value);
        if (unitPref?.value) setUnit(unitPref.value);

        const theme = themePref?.value || 'light';
        if (theme === 'system') {
          const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
          document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
        } else {
          document.documentElement.setAttribute('data-theme', theme);
        }

        const pinOn = await isPinEnabled();
        setLocked(pinOn);
        setOnboarded(onb?.value === 'true');
        setReady(true);
      })
      .catch(err => {
        console.error('DB init failed:', err);
        setReady(true);
      });
  }, []);

  if (!ready) {
    return (
      <div className="app-splash">
        <div className="splash-icon"><Building2 size={52} strokeWidth={1.5} /></div>
        <div className="splash-wordmark">Ghar Kharcha</div>
        <div className="splash-sub">Construction Cost Tracker</div>
        <div className="splash-spinner" />
      </div>
    );
  }

  if (locked) return <PinLock onUnlocked={() => setLocked(false)} />;

  if (!onboarded) {
    return (
      <ErrorBoundary>
        <Onboarding onDone={() => setOnboarded(true)} />
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <ProProvider>
        <ProjectProvider>
          <ToastProvider>
            <HashRouter>
              <Suspense fallback={<PageFallback />}>
                <Routes>
                  <Route element={<Layout />}>
                    <Route path="/"                   element={<Dashboard />} />
                    <Route path="/add"                element={<AddExpense />} />
                    <Route path="/edit/:id"           element={<AddExpense />} />
                    <Route path="/expenses"           element={<Expenses />} />
                    <Route path="/report"             element={<Report />} />
                    <Route path="/settings"           element={<Settings />} />
                    <Route path="/vendors"            element={<Vendors />} />
                    <Route path="/vendors/:vendorId"  element={<VendorDetail />} />
                    <Route path="/phases"             element={<Phases />} />
                    <Route path="/privacy"            element={<Privacy />} />
                  </Route>
                </Routes>
              </Suspense>
            </HashRouter>
          </ToastProvider>
        </ProjectProvider>
      </ProProvider>
    </ErrorBoundary>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
