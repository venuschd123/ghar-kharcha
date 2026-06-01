import { useState } from 'react';
import { Building2, HardHat, ArrowRight, Eye, ReceiptText, Users, BarChart2, X } from 'lucide-react';
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

// Slide 2: Feature tour cards
const FEATURES = [
  { icon: ReceiptText, color: '#10B981', bg: 'rgba(16,185,129,.12)', title: 'Track Expenses', desc: 'Log labour, materials and contractor payments instantly' },
  { icon: Users,       color: '#3B82F6', bg: 'rgba(59,130,246,.12)',  title: 'Manage Vendors', desc: 'Keep contractor contacts and payment history in one place' },
  { icon: BarChart2,   color: '#F59E0B', bg: 'rgba(245,158,11,.12)',  title: 'See Reports',    desc: 'Category breakdowns, budget status and PDF exports' },
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
      // Trigger FAB hint on first dashboard visit
      await db.settings.put({ key: 'show_fab_hint', value: 'true' });
      onDone();
    } catch { setSaving(false); }
  };

  return (
    <div className="onboarding">
      <div className="onboarding-body" style={{ overflow: 'hidden' }}>
        <AnimatePresence mode="wait" initial={false}>
          {/* ── Slide 0: Welcome ── */}
          {slide === 0 && (
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
                <motion.div variants={fadeUp}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,.35)', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: 8, textAlign: 'center' }}>
                    Home Construction Tracker
                  </div>
                  <h1 className="ob-title">{"Every rupee\nmatters."}</h1>
                  <div style={{ textAlign: 'center', marginTop: 4, fontSize: 18, fontWeight: 700, color: 'rgba(255,255,255,.55)', letterSpacing: '-.2px' }}>
                    Track it all.
                  </div>
                </motion.div>
                <motion.p variants={fadeUp} className="ob-desc" style={{ marginTop: 4 }}>
                  Labour • Materials • Contractors • Phases — all offline, all private.
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
                    {loadingDemo ? 'Loading demo...' : 'See a live example →'}
                  </button>
                </motion.div>
                <div className="ob-dots">
                  <div className="ob-dot active" />
                  <div className="ob-dot" />
                  <div className="ob-dot" />
                </div>
              </div>
            </motion.div>
          )}

          {/* ── Slide 1: Feature Tour ── */}
          {slide === 1 && (
            <motion.div
              key="slide1"
              className="ob-slide active"
              variants={slideVariants}
              initial="enter" animate="center" exit="exit"
            >
              {/* Skip */}
              <div style={{ position: 'absolute', top: 16, right: 16, zIndex: 10 }}>
                <button
                  onClick={() => setSlide(2)}
                  style={{ background: 'rgba(255,255,255,.1)', border: 'none', borderRadius: 20, padding: '6px 12px', color: 'rgba(255,255,255,.6)', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontFamily: 'inherit' }}
                >
                  Skip <X size={11} />
                </button>
              </div>

              <motion.div
                className="ob-hero" style={{ justifyContent: 'center', paddingTop: 60 }}
                variants={stagger} initial="hidden" animate="show"
              >
                <motion.h1 variants={fadeUp} className="ob-title" style={{ fontSize: 26 }}>
                  {"Everything you need\nto build smarter."}
                </motion.h1>
              </motion.div>

              <div style={{ padding: '0 var(--px) 20px', display: 'flex', flexDirection: 'column', gap: 10, flex: 1, justifyContent: 'center' }}>
                {FEATURES.map((f, i) => (
                  <motion.div
                    key={f.title}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 + i * 0.1, duration: 0.4, ease: [0.16,1,0.3,1] }}
                    style={{
                      background: 'rgba(255,255,255,.07)',
                      border: '1px solid rgba(255,255,255,.1)',
                      borderRadius: 16, padding: '14px 16px',
                      display: 'flex', alignItems: 'center', gap: 14,
                    }}
                  >
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: f.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <f.icon size={20} color={f.color} />
                    </div>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', marginBottom: 3 }}>{f.title}</div>
                      <div style={{ fontSize: 12, color: 'rgba(255,255,255,.5)', lineHeight: 1.5 }}>{f.desc}</div>
                    </div>
                  </motion.div>
                ))}
              </div>

              <div className="ob-footer">
                <div className="ob-dots">
                  <div className="ob-dot" />
                  <div className="ob-dot active" />
                  <div className="ob-dot" />
                </div>
                <motion.button
                  className="ob-btn-primary"
                  style={{ width: '100%', maxWidth: 380 }}
                  onClick={() => setSlide(2)}
                  initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
                  whileTap={{ scale: 0.97 }}
                >
                  Set Up My Project <ArrowRight size={18} />
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* ── Slide 2: Project Setup ── */}
          {slide === 2 && (
            <motion.div
              key="slide2"
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
                <button className="ob-btn-ghost" onClick={() => setSlide(1)}>Back</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
