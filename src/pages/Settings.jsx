import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { Save, Trash2, Download, Upload, Info } from 'lucide-react';

export default function Settings() {
  const projects = useLiveQuery(() => db.projects.toArray());
  const expenseCount = useLiveQuery(() => db.expenses.count(), [], 0);
  const project = projects?.[0];

  const [localName, setLocalName] = useState(null);
  const [localBudget, setLocalBudget] = useState(null);
  const [saved, setSaved] = useState(false);

  const name = localName ?? project?.name ?? '';
  const budget = localBudget ?? (project?.budget > 0 ? String(project.budget) : '');

  const handleSave = async () => {
    if (!project) return;
    await db.projects.update(project.id, {
      name: name.trim() || 'My Home Construction',
      budget: budget ? parseFloat(budget) : 0,
    });
    setLocalName(null);
    setLocalBudget(null);
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
          <button className="btn btn-primary btn-full" onClick={handleSave}>
            <Save size={16} />
            {saved ? '✓ Saved!' : 'Save Settings'}
          </button>
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
        </div>
      </div>
    </div>
  );
}
