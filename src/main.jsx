import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import AddExpense from './pages/AddExpense';
import Expenses from './pages/Expenses';
import Report from './pages/Report';
import Settings from './pages/Settings';
import ErrorBoundary from './components/ErrorBoundary';
import Onboarding from './components/Onboarding';
import { db, initDB } from './db';
import './index.css';

function App() {
  const [ready, setReady] = useState(false);
  const [onboarded, setOnboarded] = useState(true);

  useEffect(() => {
    initDB()
      .then(() => db.settings.get('onboardingDone'))
      .then(s => {
        setOnboarded(s?.value === 'true');
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
      <HashRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/add" element={<AddExpense />} />
            <Route path="/edit/:id" element={<AddExpense />} />
            <Route path="/expenses" element={<Expenses />} />
            <Route path="/report" element={<Report />} />
            <Route path="/settings" element={<Settings />} />
          </Route>
        </Routes>
      </HashRouter>
    </ErrorBoundary>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
