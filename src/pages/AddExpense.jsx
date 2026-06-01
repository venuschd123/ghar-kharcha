import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { getToday, getYesterday, formatCurrency, formatDateShort } from '../utils/formatters';
import { ArrowLeft, Camera, Trash2, Check, ChevronDown, Clock, Copy, Mic, ScanLine, Plus, HardHat } from 'lucide-react';
import { motion } from 'motion/react';
import Numpad from '../components/Numpad';
import { useToast } from '../components/Toast';
import { isVoiceSupported, startVoiceRecognition, parseSpokenAmount, parseSpokenCategory } from '../utils/voiceInput';
import { useProject } from '../context/ProjectContext';

const VENDOR_COLORS = { labour: '#e17055', material: '#0984e3', service: '#6c5ce7' };

export default function AddExpense() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);
  const showToast = useToast();

  const { activeProject } = useProject();
  const categories = useLiveQuery(() => db.categories.toArray());
  const vendors = useLiveQuery(() => {
    const pid = activeProject?.id;
    return pid != null ? db.vendors.where('projectId').equals(pid).toArray() : [];
  }, [activeProject?.id]);
  const phases = useLiveQuery(() => {
    const pid = activeProject?.id;
    return pid != null ? db.phases.where('projectId').equals(pid).sortBy('order') : [];
  }, [activeProject?.id]);

  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState(null);
  const [vendorId, setVendorId] = useState(null);
  const [phaseId, setPhaseId] = useState(null);
  const [date, setDate] = useState(getToday());
  const [note, setNote] = useState('');
  const [photo, setPhoto] = useState(null);
  const [isPending, setIsPending] = useState(false);
  const [editProjectId, setEditProjectId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [showVendorPicker, setShowVendorPicker] = useState(false);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatIcon, setNewCatIcon] = useState('📌');
  const [listening, setListening] = useState(false);
  const [ocrLoading, setOcrLoading] = useState(false);
  const fileRef = useRef();
  const ocrRef = useRef();
  const kbInputRef = useRef();

  const projectId = isEdit ? editProjectId : (activeProject?.id ?? null);

  useEffect(() => {
    if (isEdit && id) {
      db.expenses.get(Number(id)).then(exp => {
        if (exp) {
          setAmount(String(exp.amount));
          setCategoryId(exp.categoryId);
          setVendorId(exp.vendorId ?? null);
          setPhaseId(exp.phaseId ?? null);
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

  const handleOCR = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setOcrLoading(true);
    showToast('Scanning receipt… this may take 10–20 seconds', 'info');
    try {
      const { createWorker } = await import('tesseract.js');
      const worker = await createWorker('eng');
      const { data: { text } } = await worker.recognize(file);
      await worker.terminate();

      // Extract amount: look for largest number with optional ₹/Rs/Total prefix
      const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
      let bestAmount = null;
      const totalLine = lines.find(l => /total|amount|grand|net|bill/i.test(l));
      const searchLines = totalLine ? [totalLine, ...lines] : lines;
      for (const line of searchLines) {
        const nums = line.match(/(?:rs\.?|₹|inr)?\s*(\d[\d,]*\.?\d{0,2})/gi) || [];
        for (const n of nums) {
          const val = parseFloat(n.replace(/[^\d.]/g, ''));
          if (val > 10 && val < 10000000) {
            if (!bestAmount || val > bestAmount) bestAmount = val;
          }
        }
        if (totalLine && line === totalLine && bestAmount) break;
      }
      if (bestAmount) {
        setAmount(String(bestAmount));
        showToast(`Amount detected: ₹${bestAmount.toLocaleString('en-IN')}`, 'success');
      }

      // Try to extract a note from common receipt patterns
      const noteLine = lines.find(l => l.length > 4 && l.length < 60 && !/^\d/.test(l) && !/total|tax|gst/i.test(l));
      if (noteLine && !note) setNote(noteLine.slice(0, 60));

    } catch (err) {
      console.error('OCR failed:', err);
      showToast('Could not read receipt. Try a clearer photo.', 'error');
    }
    setOcrLoading(false);
  };

  const handleSave = async () => {
    if (!amount || !categoryId || !projectId) return;
    setSaving(true);
    const data = {
      projectId, categoryId,
      vendorId: vendorId ?? null,
      phaseId: phaseId ?? null,
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
    const exp = await db.expenses.get(Number(id));
    if (!exp) return;
    await db.expenses.delete(Number(id));
    navigate('/expenses');
    showToast?.('Expense deleted', {
      undoFn: async () => {
        const { id: _removed, ...rest } = exp;
        await db.expenses.add(rest);
      },
    });
  };

  const handleDuplicate = () => {
    navigate('/add');
    // Pre-fill states are already set — just keep them and change date
    setDate(getToday());
  };

  if (!categories || !activeProject) return <div className="page-loading">Loading…</div>;

  const selectedCat = categories.find(c => c.id === categoryId);
  const selectedVendor = vendors?.find(v => v.id === vendorId);
  const isValid = amount && parseFloat(amount) > 0 && categoryId && projectId;

  const today = getToday();
  const yesterday = getYesterday();
  const dateLabel = date === today ? 'Today' : date === yesterday ? 'Yesterday' : formatDateShort(date);

  const displayAmount = amount
    ? Number(amount).toLocaleString('en-IN', { maximumFractionDigits: 2 })
    : '0';

  const handleVoice = async () => {
    if (listening) return;
    setListening(true);
    try {
      const transcript = await startVoiceRecognition('en-IN');
      const amt = parseSpokenAmount(transcript);
      if (amt && amt > 0) setAmount(String(amt));
      const catId = parseSpokenCategory(transcript, categories);
      if (catId) setCategoryId(catId);
      // Use remaining text as note if it has words beyond amount/category
      const words = transcript.split(/\s+/).filter(w => w.length > 2);
      if (words.length > 1 && !note) setNote(transcript);
      showToast?.(`Heard: "${transcript}"${amt ? ` → ₹${amt.toLocaleString('en-IN')}` : ''}`);
    } catch (err) {
      if (err.message === 'no-speech') {
        showToast?.('No speech detected — tap mic and speak clearly');
      } else if (err.message !== 'aborted') {
        showToast?.(err.message || 'Voice not available in this browser');
      }
    }
    setListening(false);
  };

  return (
    <div className="page add-expense-page">
      <header className="page-header">
        <button className="back-btn" onClick={() => navigate(-1)}><ArrowLeft size={20} /></button>
        <span className="page-title">{isEdit ? 'Edit Expense' : 'Add Expense'}</span>
        {isEdit ? (
          <div style={{ display: 'flex', gap: 4 }}>
            <button className="delete-btn" onClick={handleDuplicate} title="Duplicate"><Copy size={16} /></button>
            <button className="delete-btn" onClick={handleDelete} title="Delete"><Trash2 size={16} /></button>
          </div>
        ) : <div style={{ width: 38 }} />}
      </header>

      {/* Amount — always accepts keyboard + numpad */}
      <div className="amount-area">
        <div className="amount-row" onClick={() => kbInputRef.current?.focus()}>
          <span className="amount-rs">₹</span>
          <span className={`amount-num${amount ? ' filled' : ''}`}>{displayAmount}</span>
          <input
            ref={kbInputRef}
            type="text"
            className="amount-input-hidden"
            value={amount}
            onChange={e => {
              const v = e.target.value.replace(/[^0-9.]/g, '');
              if (v.split('.').length > 2) return;
              if (v.split('.')[1]?.length > 2) return;
              setAmount(v);
            }}
            inputMode="decimal"
            pattern="[0-9]*"
            autoComplete="off"
          />
        </div>
        <div className="amount-cat-row">
          {selectedCat ? (
            <div className="amount-chip">{selectedCat.icon} {selectedCat.name}</div>
          ) : (
            <div className="amount-chip-empty">Pick a category ↓</div>
          )}
          {isVoiceSupported && (
            <button className={`kb-toggle${listening ? ' active' : ''}`} onClick={handleVoice} title="Voice input">
              <Mic size={13} />
            </button>
          )}
        </div>
      </div>

      {/* Category grid — 4-column premium cards */}
      <div className="cat-grid-wrap">
        <div className="cat-grid">
          {categories.map((cat, i) => (
            <motion.button
              key={cat.id}
              className={`cat-card${categoryId === cat.id ? ' active' : ''}`}
              onClick={() => setCategoryId(cat.id)}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.02, duration: 0.22, ease: [0.16,1,0.3,1] }}
              whileTap={{ scale: 0.92 }}
              whileHover={{ y: -3, transition: { duration: 0.15 } }}
              style={categoryId === cat.id ? { boxShadow: `0 0 0 2px ${cat.color}55, 0 4px 12px ${cat.color}22` } : {}}
            >
              <div
                className="cat-card-icon-wrap"
                style={{
                  background: categoryId === cat.id ? cat.color : cat.color + '20',
                  boxShadow: `0 2px 8px ${cat.color}30`,
                }}
              >{cat.icon}</div>
              <span className="cat-card-label">{cat.name.split(' ')[0]}</span>
            </motion.button>
          ))}
          <motion.button
            className="cat-card"
            style={{ borderColor: 'var(--accent-border)', background: 'var(--accent-dim)' }}
            onClick={() => setShowAddCategory(true)}
            whileTap={{ scale: 0.93 }}
          >
            <div className="cat-card-icon-wrap" style={{ background: 'var(--accent)', color: '#fff' }}>
              <Plus size={16} strokeWidth={2.5} />
            </div>
            <span className="cat-card-label" style={{ color: 'var(--accent)' }}>New</span>
          </motion.button>
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
            <span style={{ color: 'var(--text-3)', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}><HardHat size={14} /> Assign vendor…</span>
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

      {/* Phase selector (optional) */}
      {phases && phases.length > 0 && (
        <div style={{ padding: '0 var(--px) 6px' }}>
          <select
            className="form-input"
            value={phaseId || ''}
            onChange={e => setPhaseId(e.target.value ? Number(e.target.value) : null)}
            style={{ padding: '9px 14px', fontSize: 13 }}
          >
            <option value="">Link to phase (optional)</option>
            {phases.map(p => (
              <option key={p.id} value={p.id}>{p.emoji} {p.name}</option>
            ))}
          </select>
        </div>
      )}

      {/* Date + Note + Camera */}
      <div className="options-bar">
        <button className={`date-chip${date === today ? ' active' : ''}`} onClick={() => setDate(today)}>Today</button>
        <button className={`date-chip${date === yesterday ? ' active' : ''}`} onClick={() => setDate(yesterday)}>Yest.</button>
        <div className="date-custom-wrap">
          <button className={`date-chip${date !== today && date !== yesterday ? ' active' : ''}`}>
            {date !== today && date !== yesterday ? dateLabel : 'Date'}
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
        <button
          className="ocr-btn"
          onClick={() => ocrRef.current?.click()}
          disabled={ocrLoading}
          title="Scan receipt to auto-fill amount"
        >
          {ocrLoading ? <span className="ocr-spinner" /> : <ScanLine size={16} />}
          <input ref={ocrRef} type="file" accept="image/*" onChange={handleOCR} className="camera-file" />
        </button>
      </div>

      {/* Photo preview */}
      {photo && (
        <div style={{ padding: '0 var(--px) 8px' }}>
          <div style={{ position: 'relative', borderRadius: 12, overflow: 'hidden', border: '1px solid var(--border)' }}>
            <img src={photo} alt="Receipt" style={{ width: '100%', maxHeight: 160, objectFit: 'cover', display: 'block' }} />
            <button onClick={() => setPhoto(null)} style={{
              position: 'absolute', top: 6, right: 6, width: 28, height: 28, borderRadius: '50%',
              background: 'rgba(0,0,0,0.6)', color: '#fff', border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14,
            }}>✕</button>
          </div>
        </div>
      )}

      {/* Numpad */}
      <div className="numpad-wrap">
        <Numpad value={amount} onChange={setAmount} />
      </div>

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

      {/* Add category bottom sheet */}
      {showAddCategory && (
        <div className="bottom-overlay" onClick={() => setShowAddCategory(false)}>
          <div className="bottom-sheet" onClick={e => e.stopPropagation()}>
            <div className="sheet-handle" />
            <div className="sheet-title">Add Custom Category</div>
            <div className="sheet-body">
              <div className="form-section" style={{ marginBottom: 12 }}>
                <label className="form-label">Category Name</label>
                <input className="form-input" placeholder="e.g. Interior Design" value={newCatName}
                  onChange={e => setNewCatName(e.target.value)} autoFocus maxLength={40} />
              </div>
              <div className="form-section" style={{ marginBottom: 12 }}>
                <label className="form-label">Icon (emoji)</label>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {['📌','🏠','🛠️','🪜','💡','🚰','🪟','🧹','🔌','📋','🏡','🪴'].map(e => (
                    <button key={e} onClick={() => setNewCatIcon(e)}
                      style={{
                        width: 40, height: 40, borderRadius: 10, border: 'none', fontSize: 20,
                        background: newCatIcon === e ? 'var(--accent-dim)' : 'var(--surface)',
                        outline: newCatIcon === e ? '2px solid var(--accent-border)' : 'none',
                        cursor: 'pointer',
                      }}
                    >{e}</button>
                  ))}
                </div>
              </div>
              <button className="btn btn-primary btn-full" disabled={!newCatName.trim()}
                onClick={async () => {
                  const id = await db.categories.add({
                    name: newCatName.trim(), icon: newCatIcon,
                    color: '#' + Math.floor(Math.random()*16777215).toString(16).padStart(6,'0'),
                    isCustom: true,
                  });
                  setCategoryId(id);
                  setShowAddCategory(false);
                  setNewCatName('');
                  setNewCatIcon('📌');
                }}
              >
                Add Category
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
