import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import AddExpense from './pages/AddExpense';
import Expenses from './pages/Expenses';
import Report from './pages/Report';
import Settings from './pages/Settings';
import Vendors, { VendorDetail } from './pages/Vendors';
import Phases from './pages/Phases';
import ErrorBoundary from './components/ErrorBoundary';
import Onboarding from './components/Onboarding';
import { ToastProvider } from './components/Toast';
import { db, initDB } from './db';
import './index.css';

function App() {
  const [ready, setReady] = useState(false);
  const [onboarded, setOnboarded] = useState(true);

  useEffect(() => {
    initDB()
      .then(async () => {
        const [onb, themePref] = await Promise.all([
          db.settings.get('onboardingDone'),
          db.settings.get('theme'),
        ]);
        const theme = themePref?.value || 'light';
        if (theme === 'system') {
          const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
          document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
        } else {
          document.documentElement.setAttribute('data-theme', theme);
        }
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
        <div className="splash-icon">🏠</div>
        <div className="splash-wordmark">Ghar Kharcha</div>
        <div className="splash-spinner" />
      </div>
    );
  }

  if (!onboarded) {
    return (
      <ErrorBoundary>
        <Onboarding onDone={() => setOnboarded(true)} />
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <ToastProvider>
      <HashRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/add" element={<AddExpense />} />
            <Route path="/edit/:id" element={<AddExpense />} />
            <Route path="/expenses" element={<Expenses />} />
            <Route path="/report" element={<Report />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/vendors" element={<Vendors />} />
            <Route path="/vendors/:vendorId" element={<VendorDetail />} />
            <Route path="/phases" element={<Phases />} />
          </Route>
        </Routes>
      </HashRouter>
      </ToastProvider>
    </ErrorBoundary>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
