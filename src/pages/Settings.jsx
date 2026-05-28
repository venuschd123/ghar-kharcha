import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { Save, Trash2, Download, Upload, Info } from 'lucide-react';

export default function Settings() {
  const projects = useLiveQuery(() => db.projects.toArray());
  const expenseCount = useLiveQuery(() => db.expenses.count(), [], 0);
  const project = projects?.[0];

  // Local overrides: null means "use project value"
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
    // Reset local overrides so the form stays in sync with saved values
    setLocalName(null);
    setLocalBudget(null);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleExportData = async () => {
    const allExpenses = await db.expenses.toArray();
    const allCategories = await db.categories.toArray();
    const allProjects = await db.projects.toArray();

    const data = {
      version: 1,
      exportedAt: new Date().toISOString(),
      projects: allProjects,
      categories: allCategories,
      expenses: allExpenses,
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ghar-kharcha-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportData = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const text = await file.text();
      const data = JSON.parse(text);

      if (!data.version || !data.expenses || !data.categories) {
        alert('Invalid backup file format.');
        return;
      }

      if (!window.confirm(`This will replace ALL your current data with the backup (${data.expenses.length} expenses). Continue?`)) {
        return;
      }

      await db.expenses.clear();
      await db.categories.clear();
      await db.projects.clear();

      await db.projects.bulkAdd(data.projects);
      await db.categories.bulkAdd(data.categories);
      await db.expenses.bulkAdd(data.expenses);

      window.location.reload();
    } catch (err) {
      alert('Failed to import: ' + err.message);
    }
  };

  const handleClearAll = async () => {
    if (!window.confirm('⚠️ DELETE ALL DATA? This cannot be undone!')) return;
    if (!window.confirm('Are you REALLY sure? All expenses, photos, and settings will be permanently deleted.')) return;

    await db.expenses.clear();
    await db.projects.clear();
    await db.categories.clear();

    // Re-initialize
    const { initDB } = await import('../db');
    await initDB();
    window.location.reload();
  };

  if (!projects) return <div className="page-loading">Loading...</div>;

  return (
    <div className="page settings-page">
      <header className="page-header">
        <h1 className="page-title">Settings</h1>
      </header>

      {/* Project Settings */}
      <section className="settings-section">
        <h2 className="settings-section-title">Project</h2>
        <div className="form-section">
          <label className="form-label">Project Name</label>
          <input
            type="text"
            className="form-input"
            value={name}
            onChange={e => setLocalName(e.target.value)}
            placeholder="My Home Construction"
          />
        </div>
        <div className="form-section">
          <label className="form-label">Total Budget (₹)</label>
          <input
            type="number"
            className="form-input"
            value={budget}
            onChange={e => setLocalBudget(e.target.value)}
            placeholder="e.g. 1500000"
            inputMode="numeric"
          />
          <div className="form-hint">Set 0 or leave empty for no budget tracking</div>
        </div>
        <button className="btn btn-primary btn-full" onClick={handleSave}>
          <Save size={16} />
          {saved ? 'Saved!' : 'Save Settings'}
        </button>
      </section>

      {/* Data Management */}
      <section className="settings-section">
        <h2 className="settings-section-title">Data Management</h2>
        <div className="data-info">
          <Info size={16} />
          <span>{expenseCount} expenses stored on this device</span>
        </div>

        <button className="btn btn-secondary btn-full" onClick={handleExportData}>
          <Download size={16} />
          Export Backup (JSON)
        </button>

        <label className="btn btn-secondary btn-full" style={{ cursor: 'pointer' }}>
          <Upload size={16} />
          Import Backup
          <input
            type="file"
            accept=".json"
            onChange={handleImportData}
            style={{ display: 'none' }}
          />
        </label>

        <button className="btn btn-danger btn-full" onClick={handleClearAll}>
          <Trash2 size={16} />
          Delete All Data
        </button>
      </section>

      {/* About */}
      <section className="settings-section about-section">
        <h2 className="settings-section-title">About</h2>
        <div className="about-content">
          <div className="about-logo">🏠</div>
          <h3>Ghar Kharcha</h3>
          <p>Version 1.0.0</p>
          <p className="about-desc">
            Track every rupee of your home construction or renovation.
            100% offline. Your data never leaves your device.
          </p>
          <div className="about-badges">
            <span className="badge">🔒 Privacy First</span>
            <span className="badge">📴 Works Offline</span>
            <span className="badge">🇮🇳 Made in India</span>
          </div>
        </div>
      </section>
    </div>
  );
}
