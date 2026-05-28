import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { getToday, getYesterday, formatCurrency, formatDateShort } from '../utils/formatters';
import { ArrowLeft, Camera, Trash2, Check, X } from 'lucide-react';
import Numpad from '../components/Numpad';

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
  const fileRef = useRef();

  const projectId = isEdit ? editProjectId : (projects?.[0]?.id ?? null);

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

  const selectedCat = categories.find(c => c.id === categoryId);
  const isValid = amount && parseFloat(amount) > 0 && categoryId && projectId;

  const today = getToday();
  const yesterday = getYesterday();
  const dateLabel = date === today ? 'Today' : date === yesterday ? 'Yesterday' : formatDateShort(date);

  const displayAmount = amount
    ? Number(amount).toLocaleString('en-IN', { maximumFractionDigits: 2 })
    : '0';

  return (
    <div className="page add-expense-page">
      {/* Header */}
      <header className="page-header">
        <button className="back-btn" onClick={() => navigate(-1)}>
          <ArrowLeft size={20} />
        </button>
        <span className="page-title">{isEdit ? 'Edit Expense' : 'Add Expense'}</span>
        {isEdit ? (
          <button className="delete-btn" onClick={handleDelete}>
            <Trash2 size={18} />
          </button>
        ) : <div style={{ width: 38 }} />}
      </header>

      {/* Amount display */}
      <div className="amount-area">
        <div className="amount-row">
          <span className="amount-rs">₹</span>
          <span className={`amount-num${amount ? ' filled' : ''}`}>{displayAmount}</span>
        </div>
        <div className="amount-cat-row">
          {selectedCat ? (
            <div className="amount-chip">
              {selectedCat.icon} {selectedCat.name}
            </div>
          ) : (
            <div className="amount-chip-empty">Pick a category ↓</div>
          )}
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
              style={categoryId === cat.id ? { '--cat-c': cat.color } : {}}
            >
              <span className="cat-pill-icon">{cat.icon}</span>
              <span>{cat.name.split(' ')[0]}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Date + Note + Camera */}
      <div className="options-bar">
        <button
          className={`date-chip${date === today ? ' active' : ''}`}
          onClick={() => setDate(today)}
        >
          Today
        </button>
        <button
          className={`date-chip${date === yesterday ? ' active' : ''}`}
          onClick={() => setDate(yesterday)}
        >
          Yest.
        </button>
        <div className="date-custom-wrap">
          <button className={`date-chip${date !== today && date !== yesterday ? ' active' : ''}`}>
            {date !== today && date !== yesterday ? dateLabel : '📅'}
          </button>
          <input
            type="date"
            className="date-custom-input"
            value={date}
            onChange={e => setDate(e.target.value)}
          />
        </div>
        <input
          type="text"
          className="note-input"
          placeholder="Note…"
          value={note}
          onChange={e => setNote(e.target.value)}
          maxLength={200}
        />
        <button
          className={`camera-btn${photo ? ' has-photo' : ''}`}
          onClick={() => photo ? setPhoto(null) : fileRef.current?.click()}
          title={photo ? 'Remove photo' : 'Add receipt photo'}
        >
          {photo ? <Check size={16} /> : <Camera size={16} />}
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handlePhoto}
            className="camera-file"
          />
        </button>
      </div>

      {/* Numpad */}
      <div className="numpad-wrap">
        <Numpad value={amount} onChange={setAmount} />
      </div>

      {/* Save */}
      <div className="save-bar">
        <button
          className="btn btn-primary btn-full btn-lg"
          onClick={handleSave}
          disabled={!isValid || saving}
        >
          <Check size={18} />
          {saving ? 'Saving…' : isEdit
            ? `Update — ${formatCurrency(parseFloat(amount) || 0)}`
            : `Save — ${formatCurrency(parseFloat(amount) || 0)}`
          }
        </button>
      </div>
    </div>
  );
}
