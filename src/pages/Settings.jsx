import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Link } from 'react-router-dom';
import { db } from '../db';
import { Save, Trash2, Download, Upload, Info, ListChecks, FileText, Sun, Moon, Monitor, Share2, Lock, Unlock, Zap, Target, Building2, ShieldCheck, WifiOff, Flag, ScrollText, Pencil, Plus, Tags } from 'lucide-react';
import { CURRENCIES, UNITS, setCurrency, setUnit } from '../utils/formatters';
import { useProject } from '../context/ProjectContext';
import { usePro } from '../context/ProContext';
import UpgradePrompt from '../components/UpgradePrompt';
import ConfirmDialog from '../components/ConfirmDialog';
import { setPin, removePin, isPinEnabled } from '../components/PinLock';

const THEMES = [
  { key: 'light', label: 'Light', Icon: Sun },
  { key: 'dark', label: 'Dark', Icon: Moon },
  { key: 'system', label: 'Auto', Icon: Monitor },
];

const CAT_COLORS = [
  '#e17055','#d63031','#e84393','#6c5ce7','#a29bfe',
  '#0984e3','#00b894','#00cec9','#fdcb6e','#f39c12',
  '#2d3436','#636e72','#74b9ff','#fd79a8','#55efc4',
];

function EditCategorySheet({ category, onClose }) {
  const [name, setName] = useState(category?.name ?? '');
  const [icon, setIcon] = useState(category?.icon ?? '📦');
  const [color, setColor] = useState(category?.color ?? '#636e72');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    if (category) {
      await db.categories.update(category.id, { name: name.trim(), icon: icon.trim() || '📦', color });
    } else {
      await db.categories.add({ name: name.trim(), icon: icon.trim() || '📦', color, isCustom: true });
    }
    onClose();
  };

  return (
    <div className="bottom-overlay" onClick={onClose}>
      <div className="bottom-sheet" onClick={e => e.stopPropagation()}>
        <div className="sheet-handle" />
        <div className="sheet-title">{category ? 'Edit Category' : 'Add Category'}</div>
        <div className="sheet-body">
          <div className="form-section" style={{ marginBottom: 12 }}>
            <label className="form-label">Name</label>
            <input className="form-input" placeholder="e.g. Solar Panels" value={name} onChange={e => setName(e.target.value)} autoFocus maxLength={40} />
          </div>
          <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
            <div className="form-section" style={{ flex: 1, marginBottom: 0 }}>
              <label className="form-label">Emoji Icon</label>
              <input
                className="form-input"
                placeholder="e.g. ☀️"
                value={icon}
                onChange={e => setIcon(e.target.value)}
                style={{ fontSize: 20, textAlign: 'center' }}
                maxLength={4}
              />
            </div>
            <div style={{ width: 56, height: 56, marginTop: 20, borderRadius: 12, background: color + '22', border: `2px solid ${color}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0 }}>
              {icon || '📦'}
            </div>
          </div>
          <div className="form-section" style={{ marginBottom: 16 }}>
            <label className="form-label">Color</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {CAT_COLORS.map(c => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  style={{
                    width: 32, height: 32, borderRadius: '50%', background: c, border: 'none',
                    cursor: 'pointer', outline: color === c ? `3px solid ${c}` : 'none',
                    outlineOffset: 2, transform: color === c ? 'scale(1.15)' : 'none',
                    transition: 'transform 0.15s',
                  }}
                />
              ))}
            </div>
          </div>
          <button className="btn btn-primary btn-full" onClick={handleSave} disabled={!name.trim() || saving}>
            {saving ? 'Saving…' : category ? 'Save Changes' : 'Add Category'}
          </button>
        </div>
      </div>
    </div>
  );
}

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
  const { activeProject: project, projects } = useProject();
  const { isPro, trialActive, trialExpired, status: proStatus } = usePro();
  const trialDateRec = useLiveQuery(() => db.settings.get('pro_trial_activated_at'));
  const expenseCount = useLiveQuery(() => db.expenses.count(), [], 0);
  const themeSetting = useLiveQuery(() => db.settings.get('theme'));
  const currSetting = useLiveQuery(() => db.settings.get('currency'));
  const unitSetting = useLiveQuery(() => db.settings.get('unit'));
  const pinHashSetting = useLiveQuery(() => db.settings.get('pin_hash'));
  const pinEnabled = !!pinHashSetting?.value;
  const currentTheme = themeSetting?.value || 'light';
  const currentCurrency = currSetting?.value || 'INR';
  const currentUnit = unitSetting?.value || 'sqft';
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [pinMode, setPinMode] = useState(null); // null | 'set' | 'remove'
  const [newPin, setNewPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [confirm, setConfirm] = useState(null); // { title, message, danger, onConfirm }

  const [localName, setLocalName] = useState(null);
  const [localBudget, setLocalBudget] = useState(null);
  const [localSqft, setLocalSqft] = useState(null);
  const [saved, setSaved] = useState(false);
  const [catBudgetEdits, setCatBudgetEdits] = useState({});
  const [editCategory, setEditCategory] = useState(null);  // category object or 'new'
  const [deleteCategory, setDeleteCategory] = useState(null); // category to delete

  const categories = useLiveQuery(() => db.categories.toArray(), [], []);
  const catBudgets = useLiveQuery(
    () => project ? db.categoryBudgets.where('projectId').equals(project.id).toArray() : [],
    [project?.id], []
  );

  const getCatBudget = (catId) => {
    if (catBudgetEdits[catId] !== undefined) return catBudgetEdits[catId];
    const saved = catBudgets?.find(b => b.categoryId === catId);
    return saved?.budget > 0 ? String(saved.budget) : '';
  };

  const handleCatBudgetChange = (catId, val) => {
    setCatBudgetEdits(prev => ({ ...prev, [catId]: val.replace(/[^0-9]/g, '') }));
  };

  const handleSaveCatBudgets = async () => {
    if (!project) return;
    for (const [catId, val] of Object.entries(catBudgetEdits)) {
      const budget = val ? parseInt(val, 10) : 0;
      const existing = catBudgets?.find(b => b.categoryId === Number(catId));
      if (existing) {
        await db.categoryBudgets.update(existing.id, { budget });
      } else {
        await db.categoryBudgets.add({ projectId: project.id, categoryId: Number(catId), budget });
      }
    }
    setCatBudgetEdits({});
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleDeleteCategory = async () => {
    if (!deleteCategory) return;
    const miscCat = categories?.find(c => c.name.includes('Misc'));
    if (miscCat && miscCat.id !== deleteCategory.id) {
      // Reassign all expenses using this category to Misc
      const affected = await db.expenses.where('categoryId').equals(deleteCategory.id).toArray();
      for (const exp of affected) {
        await db.expenses.update(exp.id, { categoryId: miscCat.id });
      }
    }
    // Delete category budget if exists
    const catBudget = await db.categoryBudgets.where('categoryId').equals(deleteCategory.id).first();
    if (catBudget) await db.categoryBudgets.delete(catBudget.id);
    await db.categories.delete(deleteCategory.id);
    setDeleteCategory(null);
  };

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

  const handlePinSave = async () => {
    if (newPin.length < 4) { setPinError('PIN must be at least 4 digits'); return; }
    await setPin(newPin);
    setNewPin('');
    setPinError('');
    setPinMode(null);
  };

  const handlePinRemove = () => {
    setConfirm({
      title: 'Remove PIN Lock?',
      message: 'Anyone with access to this device will be able to open the app.',
      danger: true,
      confirmLabel: 'Remove PIN',
      onConfirm: async () => { await removePin(); setPinMode(null); setConfirm(null); },
    });
  };

  const handleExport = async () => {
    // Export ALL tables — vendors, phases, and categoryBudgets included
    const data = {
      version: 2,
      exportedAt: new Date().toISOString(),
      projects:        await db.projects.toArray(),
      categories:      await db.categories.toArray(),
      expenses:        await db.expenses.toArray(),
      vendors:         await db.vendors.toArray(),
      phases:          await db.phases.toArray(),
      categoryBudgets: await db.categoryBudgets.toArray(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ghar-kharcha-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const doImportRaw = async (raw) => {
    // Allowlist-strip + PRESERVE original IDs so all foreign key references stay valid.
    // Tables are fully cleared before import, so there is no collision risk.
    const safeId = id => (id != null ? Number(id) : undefined);
    const stripProject  = ({ id, name, budget, sqft, createdAt }) =>
      ({ id: safeId(id), name: String(name ?? 'Project'), budget: Number(budget ?? 0), sqft: Number(sqft ?? 0), createdAt: createdAt ?? new Date().toISOString() });
    const stripCategory = ({ id, name, icon, color, isCustom }) =>
      ({ id: safeId(id), name: String(name ?? ''), icon: String(icon ?? ''), color: String(color ?? '#999'), isCustom: !!isCustom });
    const stripExpense  = ({ id, projectId, categoryId, vendorId, phaseId, amount, date, note, photo, isPending, createdAt }) =>
      ({ id: safeId(id), projectId, categoryId, vendorId: vendorId ?? null, phaseId: phaseId ?? null, amount, date, note: note ?? '', photo: photo ?? null, isPending: !!isPending, createdAt: createdAt ?? new Date().toISOString() });
    const stripVendor   = ({ id, projectId, name, type, phone, createdAt }) =>
      ({ id: safeId(id), projectId, name: String(name ?? ''), type: String(type ?? ''), phone: String(phone ?? ''), createdAt: createdAt ?? new Date().toISOString() });
    const stripPhase    = ({ id, projectId, name, emoji, order, status, budget }) =>
      ({ id: safeId(id), projectId, name: String(name ?? ''), emoji: String(emoji ?? ''), order: Number(order ?? 0), status: String(status ?? 'pending'), budget: Number(budget ?? 0) });
    const stripCatBudget = ({ id, projectId, categoryId, budget }) =>
      ({ id: safeId(id), projectId, categoryId, budget: Number(budget ?? 0) });

    await db.expenses.clear();
    await db.vendors.clear();
    await db.phases.clear();
    await db.projects.clear();
    await db.categories.clear();
    await db.categoryBudgets.clear();

    await db.projects.bulkAdd(raw.projects.map(stripProject));
    await db.categories.bulkAdd(raw.categories.map(stripCategory));
    await db.expenses.bulkAdd(raw.expenses.map(stripExpense));
    if (Array.isArray(raw.vendors))         await db.vendors.bulkAdd(raw.vendors.map(stripVendor));
    if (Array.isArray(raw.phases))          await db.phases.bulkAdd(raw.phases.map(stripPhase));
    if (Array.isArray(raw.categoryBudgets)) await db.categoryBudgets.bulkAdd(raw.categoryBudgets.map(stripCatBudget));

    window.location.reload();
  };

  const doImport = async (file) => {
    try {
      // Size guard: reject files > 5MB
      if (file.size > 5 * 1024 * 1024) {
        setConfirm({ title: 'File Too Large', message: 'Backup files must be under 5MB. This file is too large to be a valid Ghar Kharcha backup.', danger: false, confirmLabel: 'OK', onConfirm: () => setConfirm(null) });
        return;
      }

      const raw = JSON.parse(await file.text());

      // Guard against prototype pollution
      if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) {
        throw new Error('Invalid backup structure');
      }

      if (!raw.version || !Array.isArray(raw.expenses) || !Array.isArray(raw.categories)) {
        setConfirm({ title: 'Invalid Backup File', message: 'The selected file is missing required fields. Please choose a valid Ghar Kharcha backup.', danger: false, confirmLabel: 'OK', onConfirm: () => setConfirm(null) });
        return;
      }

      // Sanity check: warn if unusually large
      if (raw.expenses.length > 50000) {
        setConfirm({
          title: 'Unusually Large Backup',
          message: `This backup contains ${raw.expenses.length.toLocaleString()} expenses, which is unusually high. Only import files exported from Ghar Kharcha.`,
          danger: true,
          confirmLabel: 'Import Anyway',
          onConfirm: () => { setConfirm(null); doImportRaw(raw); },
        });
        return;
      }

      await doImportRaw(raw);
    } catch (err) {
      setConfirm({ title: 'Import Failed', message: err.message, danger: false, confirmLabel: 'OK', onConfirm: () => setConfirm(null) });
    }
  };

  const handleImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    // Reset input so the same file can be re-selected if needed
    e.target.value = '';
    setConfirm({
      title: 'Restore Backup?',
      message: 'This will replace ALL current data with the backup file. This cannot be undone. Export a backup first if you want to save current data.',
      danger: true,
      confirmLabel: 'Restore',
      onConfirm: () => { setConfirm(null); doImport(file); },
    });
  };

  const handleClearAll = () => {
    setConfirm({
      title: 'Delete All Data?',
      message: 'Every expense, vendor, phase, and project will be permanently deleted. Export a backup first if you want to keep your data.',
      danger: true,
      confirmLabel: 'Delete Everything',
      onConfirm: async () => {
        setConfirm(null);
        await db.expenses.clear();
        await db.vendors.clear();
        await db.phases.clear();
        await db.projects.clear();
        await db.categories.clear();
        await db.settings.delete('isDemo');
        await db.settings.delete('onboardingDone');
        window.location.reload();
      },
    });
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

      {/* Category Management */}
      {categories && categories.length > 0 && (
        <div className="settings-card">
          <div className="settings-card-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Tags size={16} color="var(--accent)" />
              <div className="settings-card-title">Categories</div>
            </div>
            <button
              onClick={() => setEditCategory('new')}
              style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 10, border: 'none', background: 'var(--accent-dim)', color: 'var(--accent)', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}
            >
              <Plus size={13} /> Add
            </button>
          </div>
          <div className="settings-card-body" style={{ gap: 2, padding: '0 0 8px' }}>
            {categories.map(cat => (
              <div key={cat.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 20px' }}>
                <span style={{
                  width: 34, height: 34, borderRadius: 10, background: cat.color + '22',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0,
                }}>
                  {cat.icon}
                </span>
                <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {cat.name}
                </span>
                <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                  <button
                    onClick={() => setEditCategory(cat)}
                    style={{ width: 32, height: 32, borderRadius: 8, border: 'none', cursor: 'pointer', background: 'var(--surface)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    aria-label={`Edit ${cat.name}`}
                  >
                    <Pencil size={13} />
                  </button>
                  <button
                    onClick={() => setDeleteCategory(cat)}
                    style={{ width: 32, height: 32, borderRadius: 8, border: 'none', cursor: 'pointer', background: 'var(--surface)', color: 'var(--danger)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.7 }}
                    aria-label={`Delete ${cat.name}`}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Category Budgets */}
      {categories && categories.length > 0 && (
        <div className="settings-card">
          <div className="settings-card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Target size={16} color="var(--accent)" />
              <div className="settings-card-title">Category Budgets</div>
            </div>
          </div>
          <div className="settings-card-body">
            <div className="form-hint" style={{ marginBottom: 12 }}>
              Set spending limits per category. Warnings appear on the dashboard when you approach the limit.
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {categories.map(cat => (
                <div key={cat.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 18, width: 28, textAlign: 'center' }}>{cat.icon}</span>
                  <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: 'var(--text)', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {cat.name}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden', background: 'var(--surface)' }}>
                    <span style={{ padding: '8px 8px 8px 10px', fontSize: 13, color: 'var(--text-2)', fontWeight: 700 }}>₹</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="No limit"
                      value={getCatBudget(cat.id)}
                      onChange={e => handleCatBudgetChange(cat.id, e.target.value)}
                      style={{ width: 90, padding: '8px 10px 8px 0', border: 'none', background: 'transparent', fontSize: 13, color: 'var(--text)', fontFamily: 'inherit', outline: 'none' }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <button className="btn btn-primary btn-full" style={{ marginTop: 12 }} onClick={handleSaveCatBudgets}
              disabled={Object.keys(catBudgetEdits).length === 0}>
              <Save size={16} />
              {saved ? '✓ Saved!' : 'Save Budgets'}
            </button>
          </div>
        </div>
      )}

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

      {/* Security */}
      <div className="settings-card">
        <div className="settings-card-header">
          <div className="settings-card-title">Security</div>
        </div>
        <div className="settings-card-body">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {pinEnabled ? <Lock size={16} color="var(--accent)" /> : <Unlock size={16} color="var(--text-3)" />}
              <div>
                <div style={{ fontSize: 14, fontWeight: 700 }}>PIN Lock</div>
                <div style={{ fontSize: 12, color: 'var(--text-2)' }}>{pinEnabled ? 'App is locked on start' : 'No lock set'}</div>
              </div>
            </div>
            <button
              onClick={() => setPinMode(pinEnabled ? 'remove' : 'set')}
              style={{ padding: '8px 16px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
              {pinEnabled ? 'Remove' : 'Set PIN'}
            </button>
          </div>
          {pinMode === 'set' && (
            <div style={{ marginTop: 8 }}>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  type="password" inputMode="numeric" maxLength={6} placeholder="4–6 digit PIN"
                  className="form-input" value={newPin}
                  onChange={e => { setNewPin(e.target.value.replace(/\D/g, '')); setPinError(''); }}
                  style={{ flex: 1 }} autoFocus
                />
                <button onClick={handlePinSave} className="btn btn-primary" style={{ flexShrink: 0 }}>Save</button>
                <button onClick={() => { setPinMode(null); setNewPin(''); setPinError(''); }} style={{ padding: '0 10px', borderRadius: 10, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-2)', cursor: 'pointer', fontFamily: 'inherit', fontSize: 12 }}>Cancel</button>
              </div>
              {pinError && <div style={{ fontSize: 12, color: 'var(--danger)', marginTop: 6, fontWeight: 600 }}>{pinError}</div>}
              <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 6, lineHeight: 1.5 }}>
                ⚠️ If you forget your PIN, export a backup first. The only recovery option is clearing browser data, which will delete all unsaved data.
              </div>
            </div>
          )}
          {pinMode === 'remove' && (
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <button onClick={handlePinRemove} className="btn btn-danger" style={{ flex: 1 }}>Yes, Remove PIN</button>
              <button onClick={() => setPinMode(null)} style={{ padding: '0 14px', borderRadius: 10, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-2)', cursor: 'pointer', fontFamily: 'inherit', fontSize: 12 }}>Cancel</button>
            </div>
          )}
        </div>
      </div>

      {/* Pro upgrade — premium navy card */}
      <div className="mx-px" style={{ marginBottom: 10 }}>
        <div className="pro-hero-card">
          {isPro ? (
            <div style={{ position: 'relative', zIndex: 1, width: '100%' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,.4)', textTransform: 'uppercase', letterSpacing: '.6px', marginBottom: 8 }}>
                Ghar Kharcha Pro
              </div>
              <div className="pro-active-badge" style={{ marginBottom: 10 }}>
                <Zap size={14} /> {proStatus === 'trial' ? 'Trial Active' : 'Pro Active'}
              </div>
              {trialActive && trialDateRec?.value && (() => {
                const daysLeft = Math.max(0, 30 - Math.floor((Date.now() - new Date(trialDateRec.value).getTime()) / 86400000));
                return (
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,.5)', marginBottom: 10 }}>
                    {daysLeft} day{daysLeft !== 1 ? 's' : ''} remaining in trial
                  </div>
                );
              })()}
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,.55)', lineHeight: 1.5 }}>
                All Pro features unlocked: unlimited projects, Excel export, OCR scanning, and priority support.
              </div>
            </div>
          ) : trialExpired ? (
            <div style={{ position: 'relative', zIndex: 1, width: '100%' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,.4)', textTransform: 'uppercase', letterSpacing: '.6px', marginBottom: 6 }}>
                Ghar Kharcha Pro
              </div>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#F87171', marginBottom: 10 }}>Trial Expired</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,.55)', lineHeight: 1.5, marginBottom: 14 }}>
                Your 30-day trial has ended. Upgrade to Pro to continue using Excel export, OCR, and unlimited projects.
              </div>
              <button
                onClick={() => setShowUpgrade(true)}
                style={{ width: '100%', height: 48, borderRadius: 12, border: 'none', cursor: 'pointer', background: 'var(--accent)', color: '#fff', fontSize: 14, fontWeight: 700, fontFamily: 'inherit', boxShadow: '0 4px 16px rgba(16,185,129,.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <Zap size={15} /> Upgrade to Pro — ₹299/year
              </button>
            </div>
          ) : (
            <div style={{ position: 'relative', zIndex: 1, width: '100%' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,.4)', textTransform: 'uppercase', letterSpacing: '.6px', marginBottom: 6 }}>
                Ghar Kharcha Pro
              </div>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#fff', letterSpacing: '-.4px', marginBottom: 16 }}>
                Build smarter. Track better.
              </div>
              {[
                'Unlimited projects',
                'Excel export with full breakdown',
                'OCR receipt scanning',
                'Comparison analytics',
              ].map(f => (
                <div key={f} className="pro-feature-chip">
                  <Zap size={12} />
                  <span>{f}</span>
                </div>
              ))}
              <div style={{ marginBottom: 4 }}>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,.45)', lineHeight: 1.5, marginBottom: 14 }}>
                  Pro is currently in early access. Tap below to try all features free — no payment needed yet.
                </div>
              </div>
              <button
                onClick={() => setShowUpgrade(true)}
                style={{
                  width: '100%', height: 48, borderRadius: 12, border: 'none', cursor: 'pointer',
                  background: 'var(--accent)', color: '#fff', fontSize: 14, fontWeight: 700,
                  fontFamily: 'inherit', boxShadow: '0 4px 16px rgba(16,185,129,.4)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                }}
              >
                <Zap size={15} /> Try Pro Free
              </button>
            </div>
          )}
        </div>
      </div>

      {/* About */}
      <div className="settings-card">
        <div className="settings-card-header">
          <div className="settings-card-title">About</div>
        </div>
        <div className="settings-card-body about-body">
          <div className="about-logo-wrap">
            <Building2 size={28} strokeWidth={1.5} color="var(--accent)" />
          </div>
          <div className="about-title">Ghar Kharcha</div>
          <div style={{ fontSize: 12, color: 'var(--text-3)', fontWeight: 500, marginTop: -2, marginBottom: 4 }}>Home Construction Tracker</div>
          <div className="about-ver">Version 1.0.0</div>
          <div className="about-desc">
            Track every rupee of your home construction or renovation.
            100% offline — your data never leaves your device.
          </div>
          <div className="about-badges">
            <span className="about-badge"><ShieldCheck size={12} /> Privacy First</span>
            <span className="about-badge"><WifiOff size={12} /> Works Offline</span>
            <span className="about-badge"><Flag size={12} /> Made in India</span>
          </div>

          {/* Share App — prominent button */}
          <button
            onClick={() => {
              if (navigator.share) {
                navigator.share({
                  title: 'Ghar Kharcha — Home Construction Tracker',
                  text: 'Track every rupee of your home construction. Labour, materials, contractors, phases — all offline, all free. 🏠',
                  url: 'https://ghar-kharcha-one.vercel.app/',
                });
              }
            }}
            style={{
              width: '100%', padding: '13px 0', borderRadius: 14,
              background: 'var(--accent)', color: '#fff',
              border: 'none', cursor: 'pointer', fontFamily: 'inherit',
              fontSize: 14, fontWeight: 700, marginTop: 12,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              boxShadow: '0 3px 12px var(--accent-glow)',
            }}
          >
            <Share2 size={16} /> Share with someone building their home 🏠
          </button>

          {/* Rate the app + legal links */}
          <div style={{ display: 'flex', gap: 16, marginTop: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <a
              href="https://ghar-kharcha-one.vercel.app/#rate"
              // TODO: replace with Play Store / App Store rating URL when listed
              style={{ fontSize: 13, color: 'var(--text-2)', fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 3 }}
            >
              ⭐ Rate Ghar Kharcha
            </a>
            <Link to="/privacy" style={{ fontSize: 13, color: 'var(--text-2)', fontWeight: 600 }}>
              Privacy Policy
            </Link>
            <Link to="/terms" style={{ fontSize: 13, color: 'var(--text-2)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 3 }}>
              <ScrollText size={12} /> Terms
            </Link>
          </div>
        </div>
      </div>
      {showUpgrade && <UpgradePrompt onClose={() => setShowUpgrade(false)} onUpgraded={() => setShowUpgrade(false)} />}
      <ConfirmDialog
        open={!!confirm}
        title={confirm?.title}
        message={confirm?.message}
        danger={confirm?.danger}
        confirmLabel={confirm?.confirmLabel}
        onConfirm={confirm?.onConfirm}
        onCancel={() => setConfirm(null)}
      />
      <ConfirmDialog
        open={!!deleteCategory}
        title={`Delete "${deleteCategory?.name}"?`}
        message={`All expenses in this category will be moved to Miscellaneous. This cannot be undone.`}
        danger={true}
        confirmLabel="Delete Category"
        onConfirm={handleDeleteCategory}
        onCancel={() => setDeleteCategory(null)}
      />
      {editCategory && (
        <EditCategorySheet
          category={editCategory === 'new' ? null : editCategory}
          onClose={() => setEditCategory(null)}
        />
      )}
    </div>
  );
}
