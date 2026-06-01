import { useState } from 'react';
import { Building2, HardHat, ArrowRight, Eye } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { db, DEFAULT_CATEGORIES, DEFAULT_PHASES, seedDemoData } from '../db';

const BUDGET_RANGES = [
  { label: '10L - 25L',  value: 1750000 },
  { label: '25L - 75L',  value: 5000000 },
  { label: '75L - 2Cr',  value: 13750000 },
  { label: '2Cr+',       value: 25000000 },
];

const slideVariants = {
  enter:  { opacity: 0, x: 40 },
  center: { opacity: 1, x: 0,  transition: { duration: 0.35, ease: [0.16,1,0.3,1] } },
  exit:   { opacity: 0, x: -30, transition: { duration: 0.2,  ease: 'easeIn' } },
};

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.15 } },
};
const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16,1,0.3,1] } },
};

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
    catch { setLoadingDemo(false); }
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
        if (project) await db.projects.update(project.id, {
          name: name.trim() || project.name,
          budget: budgetRange || project.budget,
          sqft: sqft ? parseFloat(sqft) : project.sqft,
        });
      }
      await db.settings.put({ key: 'onboardingDone', value: 'true' });
      onDone();
    } catch { setSaving(false); }
  };

  return (
    <div className="onboarding">
      <div className="onboarding-body" style={{ overflow: 'hidden' }}>
        <AnimatePresence mode="wait" initial={false}>
          {slide === 0 ? (
            <motion.div
              key="slide0"
              className="ob-slide active"
              variants={slideVariants}
              initial="enter" animate="center" exit="exit"
            >
              <motion.div
                className="ob-hero" style={{ flex: 1, justifyContent: 'center' }}
                variants={stagger} initial="hidden" animate="show"
              >
                <motion.div variants={fadeUp} className="ob-icon-wrap">
                  <Building2 size={40} strokeWidth={1.5} />
                </motion.div>
                <motion.h1 variants={fadeUp} className="ob-title">{"Welcome to\nGhar Kharcha"}</motion.h1>
                <motion.p variants={fadeUp} className="ob-desc">
                  Track every rupee of your home construction. Per payment, per contractor, per phase. 100% offline and private.
                </motion.p>
              </motion.div>

              <div className="ob-footer">
                <motion.div
                  style={{ width: '100%', maxWidth: 380, display: 'flex', flexDirection: 'column', gap: 10 }}
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 0.4 }}
                >
                  <button className="ob-btn-primary" onClick={() => setSlide(1)}>
                    Get Started <ArrowRight size={18} />
                  </button>
                  <button className="ob-demo-btn" onClick={handleDemo} disabled={loadingDemo}>
                    <Eye size={16} />
                    {loadingDemo ? 'Loading demo...' : 'View a sample project first'}
                  </button>
                </motion.div>
                <div className="ob-dots">
                  <div className="ob-dot active" />
                  <div className="ob-dot" />
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="slide1"
              className="ob-slide active"
              variants={slideVariants}
              initial="enter" animate="center" exit="exit"
            >
              <motion.div
                className="ob-hero" style={{ paddingBottom: 16 }}
                variants={stagger} initial="hidden" animate="show"
              >
                <motion.div variants={fadeUp} className="ob-icon-wrap">
                  <HardHat size={40} strokeWidth={1.5} />
                </motion.div>
                <motion.h1 variants={fadeUp} className="ob-title">{"Set up your\nproject"}</motion.h1>
                <motion.p variants={fadeUp} className="ob-desc">You can change these any time in Settings.</motion.p>
              </motion.div>

              <motion.div
                className="ob-form-body"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }}
              >
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
                  <div className="ob-input-hint">Shows cost per sqft on your dashboard</div>
                </div>
              </motion.div>

              <div className="ob-footer">
                <div className="ob-dots">
                  <div className="ob-dot" />
                  <div className="ob-dot active" />
                </div>
                <motion.button
                  className="ob-btn-primary"
                  style={{ width: '100%', maxWidth: 380 }}
                  onClick={handleFinish}
                  disabled={saving}
                  whileTap={{ scale: 0.97 }}
                >
                  {saving ? 'Setting up...' : 'Start Tracking'}
                  {!saving && <ArrowRight size={18} />}
                </motion.button>
                <button className="ob-btn-ghost" onClick={() => setSlide(0)}>Back</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
