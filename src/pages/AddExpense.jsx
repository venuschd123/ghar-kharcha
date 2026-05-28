import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { getToday } from '../utils/formatters';
import { Camera, X, Check, Trash2, ArrowLeft } from 'lucide-react';

export default function AddExpense() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const categories = useLiveQuery(() => db.categories.toArray());
  const projects = useLiveQuery(() => db.projects.toArray());

  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState(null);
  const [date, setDate] = useState(getToday());
  const [note, setNote] = useState('');
  const [photo, setPhoto] = useState(null);
  const [editProjectId, setEditProjectId] = useState(null);
  const [saving, setSaving] = useState(false);

  const projectId = isEdit ? editProjectId : (projects?.[0]?.id ?? null);
  const fileRef = useRef();

  useEffect(() => {
    if (isEdit && id) {
      db.expenses.get(Number(id)).then(exp => {
        if (exp) {
          setAmount(String(exp.amount));
          setCategoryId(exp.categoryId);
          setDate(exp.date);
          setNote(exp.note || '');
          setPhoto(exp.photo || null);
          setEditProjectId(exp.projectId);
        }
      });
    }
  }, [id, isEdit]);

  const handlePhoto = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX = 800;
        let w = img.width, h = img.height;
        if (w > MAX || h > MAX) {
          if (w > h) { h = (h * MAX) / w; w = MAX; }
          else { w = (w * MAX) / h; h = MAX; }
        }
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
      amount: parseFloat(amount),
      date, note: note.trim(), photo,
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

  const isValid = amount && parseFloat(amount) > 0 && categoryId && projectId;

  return (
    <div className="page add-expense">
      <header className="page-header">
        <button className="back-btn" onClick={() => navigate(-1)}>
          <ArrowLeft size={20} />
        </button>
        <h1 className="page-title">{isEdit ? 'Edit Expense' : 'Add Expense'}</h1>
        {isEdit ? (
          <button className="delete-btn" onClick={handleDelete}>
            <Trash2 size={18} />
          </button>
        ) : <div style={{ width: 40 }} />}
      </header>

      {/* Amount */}
      <div className="amount-section">
        <span className="rupee-sign">₹</span>
        <input
          type="number"
          className="amount-input"
          placeholder="0"
          value={amount}
          onChange={e => setAmount(e.target.value)}
          inputMode="numeric"
          autoFocus
        />
      </div>

      {/* Category Tiles */}
      <div className="form-section" style={{ marginTop: 24 }}>
        <label className="form-label">Category</label>
        <div className="category-grid">
          {categories.map(cat => {
            const selected = categoryId === cat.id;
            return (
              <button
                key={cat.id}
                className={`cat-tile ${selected ? 'selected' : ''}`}
                style={{
                  '--cat-color': cat.color,
                  '--cat-bg': cat.color + '18',
                }}
                onClick={() => setCategoryId(cat.id)}
              >
                <span className="cat-tile-icon">{cat.icon}</span>
                <span className="cat-tile-name">{cat.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Date */}
      <div className="form-section">
        <label className="form-label">Date</label>
        <input
          type="date"
          className="form-input"
          value={date}
          onChange={e => setDate(e.target.value)}
        />
      </div>

      {/* Note */}
      <div className="form-section">
        <label className="form-label">Note (optional)</label>
        <input
          type="text"
          className="form-input"
          placeholder="e.g. Paid to Raju Mistri for 2nd floor"
          value={note}
          onChange={e => setNote(e.target.value)}
          maxLength={200}
        />
      </div>

      {/* Photo */}
      <div className="form-section">
        <label className="form-label">Receipt Photo (optional)</label>
        {photo ? (
          <div className="photo-preview">
            <img src={photo} alt="Receipt" />
            <button className="photo-remove" onClick={() => setPhoto(null)}>
              <X size={16} />
            </button>
          </div>
        ) : (
          <button className="photo-btn" onClick={() => fileRef.current?.click()}>
            <Camera size={20} />
            <span>Capture or Upload Receipt</span>
          </button>
        )}
        <input ref={fileRef} type="file" accept="image/*" capture="environment" onChange={handlePhoto} style={{ display: 'none' }} />
      </div>

      {/* Save */}
      <div className="form-actions">
        <button className="btn btn-primary btn-full" onClick={handleSave} disabled={!isValid || saving}>
          <Check size={18} />
          {saving ? 'Saving…' : isEdit ? 'Update Expense' : 'Save Expense'}
        </button>
      </div>
    </div>
  );
}
