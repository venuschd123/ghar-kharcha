import { useState } from 'react';
import { db, DEFAULT_CATEGORIES, DEFAULT_PHASES, seedDemoData } from '../db';

const BUDGET_RANGES = [
  { label: '₹10L – 25L',  value: 1750000 },
  { label: '₹25L – 75L',  value: 5000000 },
  { label: '₹75L – 2Cr', value: 13750000 },
  { label: '₹2Cr+',       value: 25000000 },
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
    try {
      await seedDemoData();
      onDone();
    } catch (err) {
      console.error('Demo seeding failed:', err);
      setLoadingDemo(false);
    }
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
        {/* Slide 0: Welcome */}
        <div className={`ob-slide${slide === 0 ? ' active' : slide > 0 ? ' prev' : ''}`}>
          <div className="ob-illustration">🏠</div>
          <h1 className="ob-title">Welcome to{'\n'}Ghar Kharcha</h1>
          <p className="ob-desc">
            Track every rupee of your home construction — per payment, per contractor, per phase. 100% offline, always private.
          </p>
          <div style={{ marginTop: 32, width: '100%', maxWidth: 320, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <button className="btn btn-primary btn-full btn-lg" onClick={() => setSlide(1)}>
              Start Setup →
            </button>
            <button
              className="btn btn-secondary btn-full"
              onClick={handleDemo}
              disabled={loadingDemo}
              style={{ fontSize: 14 }}
            >
              {loadingDemo ? 'Loading demo…' : '👁️ See a sample project first'}
            </button>
          </div>
        </div>

        {/* Slide 1: Project setup */}
        <div className={`ob-slide${slide === 1 ? ' active' : slide > 1 ? ' prev' : ''}`}>
          <div className="ob-illustration">🏗️</div>
          <h1 className="ob-title">Set up your{'\n'}project</h1>
          <div className="ob-form">
            <div>
              <div className="ob-input-label">Project Name</div>
              <input
                className="ob-input"
                type="text"
                placeholder="e.g. Our Dream Home"
                value={name}
                onChange={e => setName(e.target.value)}
                maxLength={60}
              />
            </div>
            <div>
              <div className="ob-input-label">Budget Range (optional)</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {BUDGET_RANGES.map(r => (
                  <button
                    key={r.value}
                    onClick={() => setBudgetRange(budgetRange === r.value ? null : r.value)}
                    style={{
                      padding: '10px 8px', borderRadius: 12, border: 'none', cursor: 'pointer',
                      fontFamily: 'inherit', fontSize: 13, fontWeight: 700,
                      background: budgetRange === r.value ? 'var(--accent-dim)' : 'var(--surface)',
                      color: budgetRange === r.value ? 'var(--accent)' : 'var(--text-2)',
                      outline: budgetRange === r.value ? '2px solid var(--accent-border)' : 'none',
                    }}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div className="ob-input-label">Total Area (sq. ft.)</div>
              <input
                className="ob-input"
                type="number"
                placeholder="e.g. 1200"
                value={sqft}
                onChange={e => setSqft(e.target.value)}
                inputMode="numeric"
              />
              <div className="ob-input-hint">Used to show your ₹/sqft cost on the dashboard</div>
            </div>
          </div>
        </div>
      </div>

      <div className="ob-footer">
        <div className="ob-dots">
          <div className={`ob-dot${slide === 0 ? ' active' : ''}`} />
          <div className={`ob-dot${slide === 1 ? ' active' : ''}`} />
        </div>
        {slide === 0 ? null : (
          <>
            <button
              className="btn btn-primary btn-full btn-lg"
              onClick={handleFinish}
              disabled={saving}
            >
              {saving ? 'Setting up…' : 'Start Tracking →'}
            </button>
            <button className="ob-back" onClick={() => setSlide(0)}>← Back</button>
          </>
        )}
      </div>
    </div>
  );
}
