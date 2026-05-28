import { useState } from 'react';
import { db } from '../db';
import { DEFAULT_CATEGORIES } from '../db';

export default function Onboarding({ onDone }) {
  const [slide, setSlide] = useState(0);
  const [name, setName] = useState('');
  const [budget, setBudget] = useState('');
  const [saving, setSaving] = useState(false);

  const handleFinish = async () => {
    setSaving(true);
    try {
      const existing = await db.projects.count();
      if (existing === 0) {
        await db.projects.add({
          name: name.trim() || 'My Home Construction',
          budget: budget ? parseFloat(budget) : 0,
          createdAt: new Date().toISOString(),
        });
        const catCount = await db.categories.count();
        if (catCount === 0) {
          await db.categories.bulkAdd(DEFAULT_CATEGORIES.map(c => ({ ...c, isCustom: false })));
        }
      } else {
        const project = await db.projects.toCollection().first();
        if (project) {
          await db.projects.update(project.id, {
            name: name.trim() || project.name,
            budget: budget ? parseFloat(budget) : project.budget,
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

  const slides = [
    {
      icon: '🏠',
      title: 'Welcome to\nGhar Kharcha',
      desc: 'Track every rupee of your home construction or renovation — 100% offline, always private.',
      action: 'Get Started',
      onAction: () => setSlide(1),
    },
    {
      icon: '🏗️',
      title: "Let's set up\nyour project",
      desc: 'Give your project a name and optionally set a budget to track spending.',
      action: saving ? 'Setting up…' : 'Start Tracking',
      onAction: handleFinish,
      form: true,
    },
  ];

  const current = slides[slide];

  return (
    <div className="onboarding">
      <div className="onboarding-body">
        {slides.map((s, i) => (
          <div
            key={i}
            className={`ob-slide ${i === slide ? 'active' : i < slide ? 'prev' : ''}`}
          >
            <div className="ob-illustration">{s.icon}</div>
            <h1 className="ob-title">{s.title}</h1>
            <p className="ob-desc">{s.desc}</p>

            {s.form && (
              <div className="ob-form">
                <div>
                  <div className="ob-input-label">Project Name</div>
                  <input
                    className="ob-input"
                    type="text"
                    placeholder="e.g. My Home Construction"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    maxLength={60}
                  />
                </div>
                <div>
                  <div className="ob-input-label">Total Budget (optional)</div>
                  <div className="ob-input-prefix-wrap">
                    <span className="ob-input-prefix">₹</span>
                    <input
                      className="ob-input ob-input-prefixed"
                      type="number"
                      placeholder="e.g. 1500000"
                      value={budget}
                      onChange={e => setBudget(e.target.value)}
                      inputMode="numeric"
                    />
                  </div>
                  <div className="ob-input-hint">You can change this later in Settings</div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="ob-footer">
        <div className="ob-dots">
          {slides.map((_, i) => (
            <div key={i} className={`ob-dot ${i === slide ? 'active' : ''}`} />
          ))}
        </div>
        <button
          className="btn btn-primary btn-full btn-lg"
          onClick={current.onAction}
          disabled={saving}
        >
          {current.action}
        </button>
        {slide > 0 && (
          <button className="ob-back" onClick={() => setSlide(s => s - 1)}>
            ← Back
          </button>
        )}
      </div>
    </div>
  );
}
