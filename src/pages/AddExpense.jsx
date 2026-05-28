import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { getToday, getYesterday, formatCurrency, formatDateShort } from '../utils/formatters';
import { ArrowLeft, Camera, Trash2, Check, Keyboard, ChevronDown, Clock } from 'lucide-react';
import Numpad from '../components/Numpad';

const VENDOR_COLORS = { labour: '#e17055', material: '#0984e3', service: '#6c5ce7' };

export default function AddExpense() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const categories = useLiveQuery(() => db.categories.toArray());
  const projects = useLiveQuery(() => db.projects.toArray());
  const vendors = useLiveQuery(() => {
    const pid = projects?.[0]?.id;
    return pid != null ? db.vendors.where('projectId').equals(pid).toArray() : [];
  }, [projects]);

  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState(null);
  const [vendorId, setVendorId] = useState(null);
  const [date, setDate] = useState(getToday());
  const [note, setNote] = useState('');
  const [photo, setPhoto] = useState(null);
  const [isPending, setIsPending] = useState(false);
  const [editProjectId, setEditProjectId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [useKeyboard, setUseKeyboard] = useState(false);
  const [showVendorPicker, setShowVendorPicker] = useState(false);
  const fileRef = useRef();
  const kbInputRef = useRef();

  const projectId = isEdit ? editProjectId : (projects?.[0]?.id ?? null);

  useEffect(() => {
    if (isEdit && id) {
      db.expenses.get(Number(id)).then(exp => {
        if (exp) {
          setAmount(String(exp.amount));
          setCategoryId(exp.categoryId);
          setVendorId(exp.vendorId ?? null);
          setDate(exp.date);
          setNote(exp.note || '');
          setPhoto(exp.photo || null);
          setIsPending(exp.isPending || false);
          setEditProjectId(exp.projectId);
        }
      });
    }
  }, [id, isEdit]);

  const handlePhoto = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const img = new Image();
      img.onload = () => {
        const MAX = 800;
        let w = img.width, h = img.height;
        if (w > MAX || h > MAX) {
          if (w > h) { h = (h * MAX) / w; w = MAX; }
          else { w = (w * MAX) / h; h = MAX; }
        }
        const canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        setPhoto(canvas.toDataURL('image/jpeg', 0.7));
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!amount || !categoryId || !projectId) return;
    setSaving(true);
    const data = {
      projectId, categoryId,
      vendorId: vendorId ?? null,
      amount: parseFloat(amount),
      date, note: note.trim(), photo,
      isPending,
      createdAt: new Date().toISOString(),
    };
    try {
      if (isEdit) await db.expenses.update(Number(id), data);
      else await db.expenses.add(data);
      navigate(-1);
    } catch (err) {
      console.error('Save failed:', err);
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Delete this expense? This cannot be undone.')) {
      await db.expenses.delete(Number(id));
      navigate('/expenses');
    }
  };

  if (!categories || !projects) return <div className="page-loading">Loading…</div>;

  const selectedCat = categories.find(c => c.id === categoryId);
  const selectedVendor = vendors?.find(v => v.id === vendorId);
  const isValid = amount && parseFloat(amount) > 0 && categoryId && projectId;

  const today = getToday();
  const yesterday = getYesterday();
  const dateLabel = date === today ? 'Today' : date === yesterday ? 'Yesterday' : formatDateShort(date);

  const displayAmount = amount
    ? Number(amount).toLocaleString('en-IN', { maximumFractionDigits: 2 })
    : '0';

  const toggleKeyboard = () => {
    setUseKeyboard(v => {
      if (!v) setTimeout(() => kbInputRef.current?.focus(), 50);
      return !v;
    });
  };

  return (
    <div className={`page add-expense-page${useKeyboard ? ' mode-keyboard' : ''}`}>
      <header className="page-header">
        <button className="back-btn" onClick={() => navigate(-1)}><ArrowLeft size={20} /></button>
        <span className="page-title">{isEdit ? 'Edit Expense' : 'Add Expense'}</span>
        {isEdit ? (
          <button className="delete-btn" onClick={handleDelete}><Trash2 size={18} /></button>
        ) : <div style={{ width: 38 }} />}
      </header>

      {/* Amount */}
      <div className="amount-area">
        <div className="amount-row">
          <span className="amount-rs">₹</span>
          {useKeyboard ? (
            <input
              ref={kbInputRef}
              type="number"
              className="amount-input-kb"
              placeholder="0"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              inputMode="decimal"
            />
          ) : (
            <span className={`amount-num${amount ? ' filled' : ''}`}>{displayAmount}</span>
          )}
        </div>
        <div className="amount-cat-row">
          {selectedCat ? (
            <div className="amount-chip">{selectedCat.icon} {selectedCat.name}</div>
          ) : (
            <div className="amount-chip-empty">Pick a category ↓</div>
          )}
          <button className={`kb-toggle${useKeyboard ? ' active' : ''}`} onClick={toggleKeyboard} title="Toggle keyboard">
            <Keyboard size={13} />
          </button>
        </div>
      </div>

      {/* Category scroll */}
      <div className="cat-scroll-wrap">
        <div className="cat-scroll">
          {categories.map(cat => (
            <button
              key={cat.id}
              className={`cat-pill${categoryId === cat.id ? ' active' : ''}`}
              onClick={() => setCategoryId(cat.id)}
            >
              <span className="cat-pill-icon">{cat.icon}</span>
              <span>{cat.name.split(' ')[0]}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Vendor + Pending row */}
      <div className="vendor-row">
        <button className="vendor-pick-btn" onClick={() => setShowVendorPicker(true)}>
          {selectedVendor ? (
            <>
              <span style={{ color: VENDOR_COLORS[selectedVendor.type] || 'var(--accent)' }}>●</span>
              <span style={{ fontWeight: 600, fontSize: 13 }}>{selectedVendor.name}</span>
            </>
          ) : (
            <span style={{ color: 'var(--text-3)', fontSize: 13 }}>👷 Assign vendor…</span>
          )}
          <ChevronDown size={14} style={{ marginLeft: 'auto', color: 'var(--text-3)' }} />
        </button>
        <button
          className={`pending-toggle${isPending ? ' active' : ''}`}
          onClick={() => setIsPending(v => !v)}
        >
          <Clock size={13} />
          <span>{isPending ? 'Pending' : 'Paid'}</span>
        </button>
      </div>

      {/* Date + Note + Camera */}
      <div className="options-bar">
        <button className={`date-chip${date === today ? ' active' : ''}`} onClick={() => setDate(today)}>Today</button>
        <button className={`date-chip${date === yesterday ? ' active' : ''}`} onClick={() => setDate(yesterday)}>Yest.</button>
        <div className="date-custom-wrap">
          <button className={`date-chip${date !== today && date !== yesterday ? ' active' : ''}`}>
            {date !== today && date !== yesterday ? dateLabel : '📅'}
          </button>
          <input type="date" className="date-custom-input" value={date} onChange={e => setDate(e.target.value)} />
        </div>
        <input
          type="text" className="note-input" placeholder="Note…"
          value={note} onChange={e => setNote(e.target.value)} maxLength={200}
        />
        <button
          className={`camera-btn${photo ? ' has-photo' : ''}`}
          onClick={() => photo ? setPhoto(null) : fileRef.current?.click()}
        >
          {photo ? <Check size={16} /> : <Camera size={16} />}
          <input ref={fileRef} type="file" accept="image/*" capture="environment" onChange={handlePhoto} className="camera-file" />
        </button>
      </div>

      {/* Numpad */}
      {!useKeyboard && (
        <div className="numpad-wrap">
          <Numpad value={amount} onChange={setAmount} />
        </div>
      )}

      {/* Save */}
      <div className="save-bar">
        <button className="btn btn-primary btn-full btn-lg" onClick={handleSave} disabled={!isValid || saving}
          style={isPending ? { background: 'linear-gradient(145deg, var(--gold), #d97706)' } : {}}
        >
          <Check size={18} />
          {saving ? 'Saving…' : isPending
            ? `Mark Pending — ${formatCurrency(parseFloat(amount) || 0)}`
            : isEdit
              ? `Update — ${formatCurrency(parseFloat(amount) || 0)}`
              : `Save — ${formatCurrency(parseFloat(amount) || 0)}`
          }
        </button>
      </div>

      {/* Vendor picker bottom sheet */}
      {showVendorPicker && (
        <div className="bottom-overlay" onClick={() => setShowVendorPicker(false)}>
          <div className="bottom-sheet" onClick={e => e.stopPropagation()}>
            <div className="sheet-handle" />
            <div className="sheet-title">Assign Vendor</div>
            <div className="sheet-body">
              <button
                className={`vendor-pick-item${!vendorId ? ' active' : ''}`}
                onClick={() => { setVendorId(null); setShowVendorPicker(false); }}
              >
                <span style={{ fontSize: 18 }}>—</span>
                <span>No vendor / Direct payment</span>
              </button>
              {(vendors || []).map(v => (
                <button
                  key={v.id}
                  className={`vendor-pick-item${vendorId === v.id ? ' active' : ''}`}
                  onClick={() => { setVendorId(v.id); setShowVendorPicker(false); }}
                >
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: VENDOR_COLORS[v.type] || '#999', flexShrink: 0 }} />
                  <span style={{ flex: 1, fontWeight: 600 }}>{v.name}</span>
                  <span style={{ fontSize: 11, color: 'var(--text-2)' }}>{v.type}</span>
                </button>
              ))}
              <button
                className="vendor-pick-item"
                style={{ color: 'var(--accent)' }}
                onClick={() => { setShowVendorPicker(false); navigate('/vendors'); }}
              >
                + Add New Vendor
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
