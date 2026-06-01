import { useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { formatCurrency, formatDate } from '../utils/formatters';
import { ArrowLeft, Plus, Phone, Trash2, ChevronRight, Pencil } from 'lucide-react';
import { useProject } from '../context/ProjectContext';
import ConfirmDialog from '../components/ConfirmDialog';

const TYPE_META = {
  labour:   { label: 'Labour', color: '#e17055', icon: '👷' },
  material: { label: 'Materials', color: '#0984e3', icon: '🧱' },
  service:  { label: 'Service', color: '#6c5ce7', icon: '🔧' },
};

function AddVendorSheet({ projectId, onClose }) {
  const [name, setName] = useState('');
  const [type, setType] = useState('labour');
  const [phone, setPhone] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    await db.vendors.add({ projectId, name: name.trim(), type, phone: phone.trim(), createdAt: new Date().toISOString() });
    onClose();
  };

  return (
    <div className="bottom-overlay" onClick={onClose}>
      <div className="bottom-sheet" onClick={e => e.stopPropagation()}>
        <div className="sheet-handle" />
        <div className="sheet-title">Add Vendor / Contractor</div>
        <div className="sheet-body">
          <div className="form-section" style={{ marginBottom: 12 }}>
            <label className="form-label">Name</label>
            <input className="form-input" placeholder="e.g. Raju Mistri" value={name} onChange={e => setName(e.target.value)} autoFocus maxLength={60} />
          </div>
          <div className="form-section" style={{ marginBottom: 12 }}>
            <label className="form-label">Type</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {Object.entries(TYPE_META).map(([k, v]) => (
                <button key={k}
                  onClick={() => setType(k)}
                  style={{
                    flex: 1, padding: '10px 0', borderRadius: 12, border: 'none',
                    fontFamily: 'inherit', fontSize: 13, fontWeight: 700, cursor: 'pointer',
                    background: type === k ? v.color + '22' : 'var(--surface)',
                    color: type === k ? v.color : 'var(--text-2)',
                    outline: type === k ? `2px solid ${v.color}44` : 'none',
                  }}
                >
                  {v.icon} {v.label}
                </button>
              ))}
            </div>
          </div>
          <div className="form-section" style={{ marginBottom: 16 }}>
            <label className="form-label">Phone (optional)</label>
            <input className="form-input" placeholder="e.g. 98765 43210" value={phone} onChange={e => setPhone(e.target.value)} inputMode="tel" maxLength={15} />
          </div>
          <button className="btn btn-primary btn-full" onClick={handleSave} disabled={!name.trim() || saving}>
            {saving ? 'Saving…' : 'Add Vendor'}
          </button>
        </div>
      </div>
    </div>
  );
}

function EditVendorSheet({ vendor, onClose }) {
  const [name, setName] = useState(vendor.name);
  const [type, setType] = useState(vendor.type);
  const [phone, setPhone] = useState(vendor.phone || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    await db.vendors.update(vendor.id, { name: name.trim(), type, phone: phone.trim() });
    onClose();
  };

  return (
    <div className="bottom-overlay" onClick={onClose}>
      <div className="bottom-sheet" onClick={e => e.stopPropagation()}>
        <div className="sheet-handle" />
        <div className="sheet-title">Edit Vendor</div>
        <div className="sheet-body">
          <div className="form-section" style={{ marginBottom: 12 }}>
            <label className="form-label">Name</label>
            <input className="form-input" placeholder="e.g. Raju Mistri" value={name} onChange={e => setName(e.target.value)} autoFocus maxLength={60} />
          </div>
          <div className="form-section" style={{ marginBottom: 12 }}>
            <label className="form-label">Type</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {Object.entries(TYPE_META).map(([k, v]) => (
                <button key={k}
                  onClick={() => setType(k)}
                  style={{
                    flex: 1, padding: '10px 0', borderRadius: 12, border: 'none',
                    fontFamily: 'inherit', fontSize: 13, fontWeight: 700, cursor: 'pointer',
                    background: type === k ? v.color + '22' : 'var(--surface)',
                    color: type === k ? v.color : 'var(--text-2)',
                    outline: type === k ? `2px solid ${v.color}44` : 'none',
                  }}
                >
                  {v.icon} {v.label}
                </button>
              ))}
            </div>
          </div>
          <div className="form-section" style={{ marginBottom: 16 }}>
            <label className="form-label">Phone (optional)</label>
            <input className="form-input" placeholder="e.g. 98765 43210" value={phone} onChange={e => setPhone(e.target.value)} inputMode="tel" maxLength={15} />
          </div>
          <button className="btn btn-primary btn-full" onClick={handleSave} disabled={!name.trim() || saving}>
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}

export function VendorDetail() {
  const { vendorId } = useParams();
  const navigate = useNavigate();
  const vid = Number(vendorId);

  const vendor = useLiveQuery(() => db.vendors.get(vid), [vid]);
  const projects = useLiveQuery(() => db.projects.toArray());
  const categories = useLiveQuery(() => db.categories.toArray());
  const expenses = useLiveQuery(
    () => db.expenses.where('vendorId').equals(vid).toArray(),
    [vid], []
  );
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [showEdit, setShowEdit] = useState(false);

  if (!vendor || !categories || !projects) return <div className="page-loading">Loading…</div>;

  const meta = TYPE_META[vendor.type] || TYPE_META.service;
  const paid = expenses.filter(e => !e.isPending).reduce((s, e) => s + e.amount, 0);
  const pending = expenses.filter(e => e.isPending).reduce((s, e) => s + e.amount, 0);
  const sorted = [...expenses].sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id);

  return (
    <div className="page">
      <header className="page-header">
        <button className="back-btn" onClick={() => navigate(-1)}><ArrowLeft size={20} /></button>
        <span className="page-title" style={{ fontSize: 18 }}>{vendor.name}</span>
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            onClick={() => setShowEdit(true)}
            style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--surface)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)' }}
          >
            <Pencil size={16} />
          </button>
          <button className="delete-btn" onClick={() => setConfirmDelete(true)}><Trash2 size={17} /></button>
        </div>
      </header>

      <div style={{ padding: '0 var(--px) 16px' }}>
        <div className="vendor-profile-card">
          <div className="vendor-avatar" style={{ background: meta.color + '22', color: meta.color }}>
            {meta.icon}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.4px' }}>{vendor.name}</div>
            <div style={{ fontSize: 13, color: 'var(--text-2)', marginTop: 2 }}>
              <span style={{ background: meta.color + '22', color: meta.color, padding: '2px 8px', borderRadius: 6, fontWeight: 700, fontSize: 11 }}>
                {meta.label}
              </span>
              {vendor.phone && (
                <a href={`tel:${vendor.phone}`} style={{ marginLeft: 8, color: 'var(--accent)', display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                  <Phone size={12} /> {vendor.phone}
                </a>
              )}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          <div className="stat-card" style={{ flex: 1 }}>
            <div className="stat-value text-green">{formatCurrency(paid)}</div>
            <div className="stat-label">Total Paid</div>
          </div>
          {pending > 0 && (
            <div className="stat-card" style={{ flex: 1 }}>
              <div className="stat-value text-gold">{formatCurrency(pending)}</div>
              <div className="stat-label">Pending</div>
            </div>
          )}
          <div className="stat-card" style={{ flex: 1 }}>
            <div className="stat-value">{expenses.length}</div>
            <div className="stat-label">Entries</div>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        title={`Delete ${vendor.name}?`}
        message="Their payment history will stay, but you won't be able to assign new expenses to this vendor."
        danger={true}
        confirmLabel="Delete Vendor"
        onConfirm={async () => { await db.vendors.delete(vid); navigate(-1); }}
        onCancel={() => setConfirmDelete(false)}
      />
      {showEdit && <EditVendorSheet vendor={vendor} onClose={() => setShowEdit(false)} />}

      <div style={{ padding: '0 var(--px)' }}>
        <div className="section-title" style={{ marginBottom: 10 }}>Payment History</div>
        {sorted.length === 0 ? (
          <div className="empty-state" style={{ paddingTop: 32 }}>
            <div className="empty-icon">💸</div>
            <p>No payments logged yet for this vendor.</p>
          </div>
        ) : (
          <div className="expense-list">
            {sorted.map(exp => {
              const cat = categories.find(c => c.id === exp.categoryId);
              return (
                <Link to={`/edit/${exp.id}`} key={exp.id} className="expense-item">
                  <div className="expense-icon" style={{ background: (cat?.color || '#999') + '22' }}>
                    {cat?.icon || '❓'}
                  </div>
                  <div className="expense-details">
                    <div className="expense-cat">
                      {exp.isPending && <span className="pending-badge">Pending · </span>}
                      {exp.note || cat?.name}
                    </div>
                    <div className="expense-note">{formatDate(exp.date)}</div>
                  </div>
                  <div className="expense-amount" style={{ color: exp.isPending ? 'var(--gold)' : 'var(--text)' }}>
                    {formatCurrency(exp.amount)}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default function Vendors() {
  const navigate = useNavigate();
  const { activeProject } = useProject();
  const projectId = activeProject?.id;
  const vendors = useLiveQuery(
    () => projectId != null ? db.vendors.where('projectId').equals(projectId).toArray() : [],
    [projectId], []
  );
  const expenses = useLiveQuery(
    () => projectId != null ? db.expenses.where('projectId').equals(projectId).toArray() : [],
    [projectId], []
  );
  const [filterType, setFilterType] = useState(null);
  const [showAdd, setShowAdd] = useState(false);

  if (!vendors || !expenses || !activeProject) return <div className="page-loading">Loading…</div>;

  const filtered = filterType ? vendors.filter(v => v.type === filterType) : vendors;

  const vendorStats = (vendorId) => {
    const exps = expenses.filter(e => e.vendorId === vendorId);
    const paid = exps.filter(e => !e.isPending).reduce((s, e) => s + e.amount, 0);
    const pending = exps.filter(e => e.isPending).reduce((s, e) => s + e.amount, 0);
    const last = exps.sort((a, b) => b.date.localeCompare(a.date))[0];
    return { paid, pending, count: exps.length, lastDate: last?.date };
  };

  return (
    <div className="page vendors-page">
      <header className="page-header">
        <h1 className="page-title">Vendors</h1>
        <button className="header-action" onClick={() => setShowAdd(true)}>
          <Plus size={20} />
        </button>
      </header>

      <div style={{ display: 'flex', gap: 6, padding: '0 var(--px) 12px', overflowX: 'auto', scrollbarWidth: 'none' }}>
        {[null, 'labour', 'material', 'service'].map(t => (
          <button key={t ?? 'all'}
            onClick={() => setFilterType(t)}
            style={{
              padding: '6px 14px', borderRadius: 20, border: 'none', cursor: 'pointer',
              fontFamily: 'inherit', fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap', flexShrink: 0,
              background: filterType === t ? 'var(--accent-dim)' : 'var(--surface)',
              color: filterType === t ? 'var(--accent)' : 'var(--text-2)',
            }}
          >
            {t ? `${TYPE_META[t].icon} ${TYPE_META[t].label}` : 'All'}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">👷</div>
          <h3>No vendors yet</h3>
          <p>Add contractors, material suppliers, and service providers to track who you're paying.</p>
          <button className="btn btn-primary" onClick={() => setShowAdd(true)} style={{ marginTop: 8 }}>
            <Plus size={16} /> Add First Vendor
          </button>
        </div>
      ) : (
        <div style={{ padding: '0 var(--px)', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filtered.map(v => {
            const { paid, pending, count, lastDate } = vendorStats(v.id);
            const meta = TYPE_META[v.type] || TYPE_META.service;
            return (
              <button key={v.id} className="vendor-card" onClick={() => navigate(`/vendors/${v.id}`)}>
                <div className="vendor-avatar" style={{ background: meta.color + '22', color: meta.color }}>
                  {meta.icon}
                </div>
                <div style={{ flex: 1, textAlign: 'left' }}>
                  <div style={{ fontSize: 15, fontWeight: 700 }}>{v.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 2 }}>
                    <span style={{ background: meta.color + '22', color: meta.color, padding: '1px 7px', borderRadius: 5, fontWeight: 700, fontSize: 10 }}>
                      {meta.label}
                    </span>
                    {lastDate && <span style={{ marginLeft: 6 }}>· Last: {formatDate(lastDate)}</span>}
                  </div>
                  <div style={{ marginTop: 6, display: 'flex', gap: 12 }}>
                    <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--green)' }}>{formatCurrency(paid)}</span>
                    {pending > 0 && <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--gold)' }}>+ {formatCurrency(pending)} due</span>}
                    <span style={{ fontSize: 12, color: 'var(--text-2)', marginLeft: 'auto' }}>{count} {count === 1 ? 'entry' : 'entries'}</span>
                  </div>
                </div>
                <ChevronRight size={16} color="var(--text-3)" />
              </button>
            );
          })}
        </div>
      )}

      {showAdd && projectId && (
        <AddVendorSheet projectId={projectId} onClose={() => setShowAdd(false)} />
      )}
    </div>
  );
}
