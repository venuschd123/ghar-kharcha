import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Link } from 'react-router-dom';
import { db } from '../db';
import { Save, Trash2, Download, Upload, Info, ListChecks, FileText, Sun, Moon, Monitor, Share2 } from 'lucide-react';
import { CURRENCIES, UNITS, setCurrency, setUnit } from '../utils/formatters';

const THEMES = [
  { key: 'light', label: 'Light', Icon: Sun },
  { key: 'dark', label: 'Dark', Icon: Moon },
  { key: 'system', label: 'Auto', Icon: Monitor },
];

function applyTheme(theme) {
  const root = document.documentElement;
  if (theme === 'system') {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    root.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
  } else {
    root.setAttribute('data-theme', theme);
  }
}

export default function Settings() {
  const projects = useLiveQuery(() => db.projects.toArray());
  const expenseCount = useLiveQuery(() => db.expenses.count(), [], 0);
  const themeSetting = useLiveQuery(() => db.settings.get('theme'));
  const currSetting = useLiveQuery(() => db.settings.get('currency'));
  const unitSetting = useLiveQuery(() => db.settings.get('unit'));
  const currentTheme = themeSetting?.value || 'light';
  const currentCurrency = currSetting?.value || 'INR';
  const currentUnit = unitSetting?.value || 'sqft';
  const project = projects?.[0];

  const [localName, setLocalName] = useState(null);
  const [localBudget, setLocalBudget] = useState(null);
  const [localSqft, setLocalSqft] = useState(null);
  const [saved, setSaved] = useState(false);

  const name = localName ?? project?.name ?? '';
  const budget = localBudget ?? (project?.budget > 0 ? String(project.budget) : '');
  const sqft = localSqft ?? (project?.sqft > 0 ? String(project.sqft) : '');

  const handleSave = async () => {
    if (!project) return;
    await db.projects.update(project.id, {
      name: name.trim() || 'My Home Construction',
      budget: budget ? parseFloat(budget) : 0,
      sqft: sqft ? parseFloat(sqft) : 0,
    });
    setLocalName(null);
    setLocalBudget(null);
    setLocalSqft(null);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleExport = async () => {
    const data = {
      version: 1,
      exportedAt: new Date().toISOString(),
      projects: await db.projects.toArray(),
      categories: await db.categories.toArray(),
      expenses: await db.expenses.toArray(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ghar-kharcha-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const data = JSON.parse(await file.text());
      if (!data.version || !data.expenses || !data.categories) {
        alert('Invalid backup file.');
        return;
      }
      if (!window.confirm(`Replace all data with backup (${data.expenses.length} expenses)?`)) return;
      await db.expenses.clear();
      await db.categories.clear();
      await db.projects.clear();
      await db.projects.bulkAdd(data.projects);
      await db.categories.bulkAdd(data.categories);
      await db.expenses.bulkAdd(data.expenses);
      window.location.reload();
    } catch (err) {
      alert('Import failed: ' + err.message);
    }
  };

  const handleClearAll = async () => {
    if (!window.confirm('⚠️ Delete ALL data? This cannot be undone!')) return;
    if (!window.confirm('Really? All expenses and settings will be permanently deleted.')) return;
    await db.expenses.clear();
    await db.projects.clear();
    await db.categories.clear();
    const { initDB } = await import('../db');
    await initDB();
    window.location.reload();
  };

  if (!projects) return <div className="page-loading">Loading…</div>;

  return (
    <div className="page settings-page">
      <header className="page-header">
        <h1 className="page-title">Settings</h1>
      </header>

      {/* Project */}
      <div className="settings-card">
        <div className="settings-card-header">
          <div className="settings-card-title">Project</div>
        </div>
        <div className="settings-card-body">
          <div className="form-section" style={{ marginBottom: 0 }}>
            <label className="form-label">Project Name</label>
            <input
              type="text"
              className="form-input"
              value={name}
              onChange={e => setLocalName(e.target.value)}
              placeholder="My Home Construction"
              maxLength={60}
            />
          </div>
          <div className="form-section" style={{ marginBottom: 0 }}>
            <label className="form-label">Total Budget (₹)</label>
            <input
              type="number"
              className="form-input"
              value={budget}
              onChange={e => setLocalBudget(e.target.value)}
              placeholder="e.g. 1500000"
              inputMode="numeric"
            />
            <div className="form-hint">Set 0 or leave empty for no budget</div>
          </div>
          <div className="form-section" style={{ marginBottom: 0 }}>
            <label className="form-label">Total Area (sq. ft.)</label>
            <input
              type="number"
              className="form-input"
              value={sqft}
              onChange={e => setLocalSqft(e.target.value)}
              placeholder="e.g. 1200"
              inputMode="numeric"
            />
            <div className="form-hint">Used to calculate ₹/sqft on your dashboard</div>
          </div>
          <button className="btn btn-primary btn-full" onClick={handleSave}>
            <Save size={16} />
            {saved ? '✓ Saved!' : 'Save Settings'}
          </button>
        </div>
      </div>

      {/* Theme */}
      <div className="settings-card">
        <div className="settings-card-header">
          <div className="settings-card-title">Appearance</div>
        </div>
        <div className="settings-card-body">
          <div style={{ display: 'flex', gap: 8 }}>
            {THEMES.map(({ key, label, Icon }) => (
              <button
                key={key}
                onClick={async () => {
                  await db.settings.put({ key: 'theme', value: key });
                  applyTheme(key);
                }}
                style={{
                  flex: 1, padding: '12px 0', borderRadius: 12, border: 'none',
                  cursor: 'pointer', fontFamily: 'inherit', fontSize: 12, fontWeight: 700,
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                  background: currentTheme === key ? 'var(--accent-dim)' : 'var(--surface)',
                  color: currentTheme === key ? 'var(--accent)' : 'var(--text-2)',
                  outline: currentTheme === key ? '2px solid var(--accent-border)' : 'none',
                }}
              >
                <Icon size={18} />
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Regional */}
      <div className="settings-card">
        <div className="settings-card-header">
          <div className="settings-card-title">Regional</div>
        </div>
        <div className="settings-card-body">
          <div className="form-section" style={{ marginBottom: 0 }}>
            <label className="form-label">Currency</label>
            <select
              className="form-input"
              value={currentCurrency}
              onChange={async (e) => {
                await db.settings.put({ key: 'currency', value: e.target.value });
                setCurrency(e.target.value);
                window.location.reload();
              }}
            >
              {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.label}</option>)}
            </select>
          </div>
          <div className="form-section" style={{ marginBottom: 0 }}>
            <label className="form-label">Area Unit</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {UNITS.map(u => (
                <button
                  key={u.key}
                  onClick={async () => {
                    await db.settings.put({ key: 'unit', value: u.key });
                    setUnit(u.key);
                    window.location.reload();
                  }}
                  style={{
                    flex: 1, padding: '10px 0', borderRadius: 12, border: 'none',
                    cursor: 'pointer', fontFamily: 'inherit', fontSize: 12, fontWeight: 700,
                    background: currentUnit === u.key ? 'var(--accent-dim)' : 'var(--surface)',
                    color: currentUnit === u.key ? 'var(--accent)' : 'var(--text-2)',
                    outline: currentUnit === u.key ? '2px solid var(--accent-border)' : 'none',
                  }}
                >
                  {u.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Quick links */}
      <div className="settings-card">
        <div className="settings-card-header">
          <div className="settings-card-title">Tools</div>
        </div>
        <div className="settings-card-body" style={{ gap: 0, padding: 0 }}>
          <Link to="/phases" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 20px', borderBottom: '1px solid var(--border)' }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--accent-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)' }}>
              <ListChecks size={18} />
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700 }}>Construction Phases</div>
              <div style={{ fontSize: 12, color: 'var(--text-2)' }}>Track progress phase by phase</div>
            </div>
            <div style={{ marginLeft: 'auto', color: 'var(--text-3)' }}>›</div>
          </Link>
          <Link to="/report" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 20px' }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--green-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--green)' }}>
              <FileText size={18} />
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700 }}>Full Report & PDF Export</div>
              <div style={{ fontSize: 12, color: 'var(--text-2)' }}>Category breakdown + downloadable PDF</div>
            </div>
            <div style={{ marginLeft: 'auto', color: 'var(--text-3)' }}>›</div>
          </Link>
        </div>
      </div>

      {/* Data */}
      <div className="settings-card">
        <div className="settings-card-header">
          <div className="settings-card-title">Data Management</div>
        </div>
        <div className="settings-card-body">
          <div className="data-info">
            <Info size={15} />
            <span>{expenseCount} expenses stored on this device</span>
          </div>
          <button className="btn btn-secondary btn-full" onClick={handleExport}>
            <Download size={16} />
            Export Backup (JSON)
          </button>
          <label className="btn btn-secondary btn-full" style={{ cursor: 'pointer' }}>
            <Upload size={16} />
            Import Backup
            <input type="file" accept=".json" onChange={handleImport} style={{ display: 'none' }} />
          </label>
          <button className="btn btn-danger btn-full" onClick={handleClearAll}>
            <Trash2 size={16} />
            Delete All Data
          </button>
        </div>
      </div>

      {/* About */}
      <div className="settings-card">
        <div className="settings-card-header">
          <div className="settings-card-title">About</div>
        </div>
        <div className="settings-card-body about-body">
          <div className="about-logo">🏠</div>
          <div className="about-title">Ghar Kharcha</div>
          <div className="about-ver">Version 1.0.0</div>
          <div className="about-desc">
            Track every rupee of your home construction or renovation.
            100% offline — your data never leaves your device.
          </div>
          <div className="about-badges">
            <span className="badge">🔒 Privacy First</span>
            <span className="badge">📴 Works Offline</span>
            <span className="badge">🇮🇳 Made in India</span>
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 12, justifyContent: 'center' }}>
            <Link to="/privacy" style={{ fontSize: 13, color: 'var(--accent)', fontWeight: 600 }}>
              Privacy Policy
            </Link>
            {navigator.share && (
              <button
                onClick={() => navigator.share({ title: 'Ghar Kharcha', text: 'Track every rupee of your home construction. 100% offline, privacy first.', url: window.location.origin })}
                style={{ fontSize: 13, color: 'var(--accent)', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 4 }}
              >
                <Share2 size={13} /> Share App
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
