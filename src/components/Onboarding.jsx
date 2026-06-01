import { useState } from 'react';
import { Building2, HardHat, ArrowRight, Eye } from 'lucide-react';
import { db, DEFAULT_CATEGORIES, DEFAULT_PHASES, seedDemoData } from '../db';

const BUDGET_RANGES = [
  { label: '10L - 25L',  value: 1750000 },
  { label: '25L - 75L',  value: 5000000 },
  { label: '75L - 2Cr',  value: 13750000 },
  { label: '2Cr+',       value: 25000000 },
];

export default function Onboarding({ onDone }) {
  const [slide, setSlide] = useState(0);
  const [name, setName] = useState('');
  const [budgetRange, setBudgetRange] = useState(null);
  const [sqft, setSqft] = useState('');
  const [saving, setSaving] = useState(false);
  const [loadingDemo, setLoadingDemo] = useState(false);

  const handleDemo = async () => {
    setLoadingDemo(true);
    try { await seedDemoData(); onDone(); }
    catch (err) { console.error('Demo failed:', err); setLoadingDemo(false); }
  };

  const handleFinish = async () => {
    setSaving(true);
    try {
      const existing = await db.projects.count();
      if (existing === 0) {
        const projectId = await db.projects.add({
          name: name.trim() || 'My Home Construction',
          budget: budgetRange || 0,
          sqft: sqft ? parseFloat(sqft) : 0,
          createdAt: new Date().toISOString(),
        });
        const catCount = await db.categories.count();
        if (catCount === 0) {
          await db.categories.bulkAdd(DEFAULT_CATEGORIES.map(c => ({ ...c, isCustom: false })));
        }
        await db.phases.bulkAdd(DEFAULT_PHASES.map(p => ({ ...p, projectId })));
      } else {
        const project = await db.projects.toCollection().first();
        if (project) {
          await db.projects.update(project.id, {
            name: name.trim() || project.name,
            budget: budgetRange || project.budget,
            sqft: sqft ? parseFloat(sqft) : project.sqft,
          });
        }
      }
      await db.settings.put({ key: 'onboardingDone', value: 'true' });
      onDone();
    } catch (err) {
      console.error('Onboarding save failed:', err);
      setSaving(false);
    }
  };

  return (
    <div className="onboarding">
      <div className="onboarding-body">

        {/* ─── Slide 0: Welcome ───────────────────────────── */}
        <div className={`ob-slide${slide === 0 ? ' active' : slide > 0 ? ' prev' : ''}`}>
          <div className="ob-hero" style={{ flex: 1, justifyContent: 'center' }}>
            <div className="ob-icon-wrap">
              <Building2 size={38} strokeWidth={1.5} />
            </div>
            <h1 className="ob-title">{"Welcome to\nGhar Kharcha"}</h1>
            <p className="ob-desc">
              Track every rupee of your home construction — per payment, per contractor, per phase. 100% offline, always private.
            </p>
          </div>

          <div className="ob-footer">
            <div style={{ width: '100%', maxWidth: 380, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button className="ob-btn-primary" onClick={() => setSlide(1)}>
                Get Started <ArrowRight size={18} />
              </button>
              <button className="ob-demo-btn" onClick={handleDemo} disabled={loadingDemo}>
                <Eye size={16} />
                {loadingDemo ? 'Loading demo...' : 'View a sample project first'}
              </button>
            </div>
            <div className="ob-dots">
              <div className="ob-dot active" />
              <div className="ob-dot" />
            </div>
          </div>
        </div>

        {/* ─── Slide 1: Project setup ─────────────────────── */}
        <div className={`ob-slide${slide === 1 ? ' active' : ''}`}>
          <div className="ob-hero" style={{ paddingBottom: 16 }}>
            <div className="ob-icon-wrap">
              <HardHat size={38} strokeWidth={1.5} />
            </div>
            <h1 className="ob-title">{"Set up your\nproject"}</h1>
            <p className="ob-desc">You can always change these later in Settings.</p>
          </div>

          <div className="ob-form-body">
            {/* Project name */}
            <div>
              <label className="ob-label">Project Name</label>
              <input
                className="ob-input"
                type="text"
                placeholder="e.g. Our Dream Home"
                value={name}
                onChange={e => setName(e.target.value)}
                maxLength={60}
                autoFocus
              />
            </div>

            {/* Budget range */}
            <div>
              <label className="ob-label">Estimated Budget (optional)</label>
              <div className="ob-budget-grid">
                {BUDGET_RANGES.map(r => (
                  <button
                    key={r.value}
                    className={`ob-budget-pill${budgetRange === r.value ? ' active' : ''}`}
                    onClick={() => setBudgetRange(budgetRange === r.value ? null : r.value)}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Area */}
            <div>
              <label className="ob-label">Total Area (optional)</label>
              <div className="ob-prefix-wrap">
                <span className="ob-prefix"></span>
                <input
                  className="ob-prefix-input"
                  type="number"
                  placeholder="e.g. 1200 sqft"
                  value={sqft}
                  onChange={e => setSqft(e.target.value)}
                  inputMode="numeric"
                />
              </div>
              <div className="ob-input-hint">Used to show cost per sqft on your dashboard</div>
            </div>
          </div>

          <div className="ob-footer">
            <div className="ob-dots">
              <div className="ob-dot" />
              <div className="ob-dot active" />
            </div>
            <button className="ob-btn-primary" onClick={handleFinish} disabled={saving} style={{ width: '100%', maxWidth: 380 }}>
              {saving ? 'Setting up...' : 'Start Tracking'}
              {!saving && <ArrowRight size={18} />}
            </button>
            <button className="ob-btn-ghost" onClick={() => setSlide(0)}>Back</button>
          </div>
        </div>

      </div>
    </div>
  );
}
