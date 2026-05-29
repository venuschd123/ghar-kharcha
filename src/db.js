import Dexie from 'dexie';

export const db = new Dexie('GharKharchaDB');

db.version(1).stores({
  projects: '++id, name, budget, createdAt',
  expenses: '++id, projectId, categoryId, amount, date, note, photo, createdAt',
  categories: '++id, name, icon, color, isCustom',
  settings: 'key, value'
});

db.version(2).stores({
  projects: '++id, name, budget, sqft, createdAt',
  expenses: '++id, projectId, categoryId, vendorId, amount, date, note, photo, isPending, createdAt',
  vendors: '++id, projectId, name, type, createdAt',
  phases: '++id, projectId, status',
});

export const DEFAULT_CATEGORIES = [
  { name: 'Labour / Mistri', icon: '👷', color: '#e17055' },
  { name: 'Cement & Concrete', icon: '🧱', color: '#636e72' },
  { name: 'Steel / Sariya', icon: '🔩', color: '#2d3436' },
  { name: 'Bricks & Blocks', icon: '🏗️', color: '#d63031' },
  { name: 'Sand & Gravel (Bajri)', icon: '⛱️', color: '#fdcb6e' },
  { name: 'Plumbing', icon: '🔧', color: '#0984e3' },
  { name: 'Electrical', icon: '⚡', color: '#f39c12' },
  { name: 'Paint & Finish', icon: '🎨', color: '#6c5ce7' },
  { name: 'Wood / Carpenter', icon: '🪵', color: '#e17055' },
  { name: 'Tiles & Flooring', icon: '🔲', color: '#00b894' },
  { name: 'Doors & Windows', icon: '🚪', color: '#00cec9' },
  { name: 'Kitchen & Bath Fittings', icon: '🚿', color: '#74b9ff' },
  { name: 'Architect / Engineer', icon: '📐', color: '#a29bfe' },
  { name: 'Transport / Delivery', icon: '🚛', color: '#fab1a0' },
  { name: 'Miscellaneous', icon: '📦', color: '#b2bec3' },
];

export const DEFAULT_PHASES = [
  { name: 'Site Preparation', emoji: '🏗️', order: 1, status: 'pending' },
  { name: 'Foundation & PCC', emoji: '⛏️', order: 2, status: 'pending' },
  { name: 'Columns & Beams', emoji: '🏛️', order: 3, status: 'pending' },
  { name: 'Slab & Roof', emoji: '🪨', order: 4, status: 'pending' },
  { name: 'Brick Walls', emoji: '🧱', order: 5, status: 'pending' },
  { name: 'Plaster & Putty', emoji: '🪣', order: 6, status: 'pending' },
  { name: 'Flooring', emoji: '🔲', order: 7, status: 'pending' },
  { name: 'Electrical Wiring', emoji: '⚡', order: 8, status: 'pending' },
  { name: 'Plumbing', emoji: '🔧', order: 9, status: 'pending' },
  { name: 'Doors & Windows', emoji: '🚪', order: 10, status: 'pending' },
  { name: 'Painting', emoji: '🎨', order: 11, status: 'pending' },
  { name: 'Final & Interior', emoji: '✨', order: 12, status: 'pending' },
];

async function ensurePhases(projectId) {
  const count = await db.phases.where('projectId').equals(projectId).count();
  if (count === 0) {
    await db.phases.bulkAdd(DEFAULT_PHASES.map(p => ({ ...p, projectId })));
  }
}

export async function checkStorageQuota() {
  try {
    if (navigator.storage?.estimate) {
      const { usage, quota } = await navigator.storage.estimate();
      const pct = quota > 0 ? (usage / quota) * 100 : 0;
      if (pct > 80) return { warning: true, pct: Math.round(pct), usageMB: Math.round(usage / 1024 / 1024) };
    }
  } catch (e) { /* ignore */ }
  return { warning: false };
}

async function fixOrphanedExpenses() {
  try {
    const cats = await db.categories.toArray();
    const catIds = new Set(cats.map(c => c.id));
    const expenses = await db.expenses.toArray();
    const miscCat = cats.find(c => c.name.includes('Misc'));
    if (!miscCat) return;
    for (const exp of expenses) {
      if (exp.categoryId && !catIds.has(exp.categoryId)) {
        await db.expenses.update(exp.id, { categoryId: miscCat.id });
      }
    }
  } catch (e) { console.error('Orphan fix failed:', e); }
}

export async function initDB() {
  const catCount = await db.categories.count();
  if (catCount === 0) {
    await db.categories.bulkAdd(DEFAULT_CATEGORIES.map(c => ({ ...c, isCustom: false })));
  }

  const projectCount = await db.projects.count();
  if (projectCount === 0) {
    const projectId = await db.projects.add({
      name: 'My Home Construction',
      budget: 0,
      sqft: 0,
      createdAt: new Date().toISOString(),
    });
    await ensurePhases(projectId);
  } else {
    const projects = await db.projects.toArray();
    for (const p of projects) {
      await ensurePhases(p.id);
    }
  }

  // Background integrity checks
  fixOrphanedExpenses().catch(() => {});
}

export async function seedDemoData() {
  await db.expenses.clear();
  await db.vendors.clear();
  await db.phases.clear();
  await db.projects.clear();
  await db.categories.clear();

  await db.categories.bulkAdd(DEFAULT_CATEGORIES.map(c => ({ ...c, isCustom: false })));
  const cats = await db.categories.toArray();
  const cat = name => cats.find(c => c.name.includes(name))?.id;

  const projectId = await db.projects.add({
    name: "Sharma Ji's Dream Home",
    budget: 4500000,
    sqft: 1200,
    createdAt: '2026-03-01T00:00:00.000Z',
  });

  const rajuId = await db.vendors.add({ projectId, name: 'Raju & Sons', type: 'labour', phone: '98765 43210', createdAt: '2026-03-01T00:00:00.000Z' });
  const shivId  = await db.vendors.add({ projectId, name: 'Shiv Materials', type: 'material', phone: '99887 76655', createdAt: '2026-03-01T00:00:00.000Z' });
  const pradeepId = await db.vendors.add({ projectId, name: 'Pradeep Electricals', type: 'service', phone: '91234 56789', createdAt: '2026-04-15T00:00:00.000Z' });

  const phaseRows = DEFAULT_PHASES.map((p, i) => ({
    ...p, projectId,
    status: i < 4 ? 'done' : i === 4 ? 'active' : 'pending',
  }));
  await db.phases.bulkAdd(phaseRows);

  const exp = (categoryId, vendorId, amount, date, note, isPending = false) => ({
    projectId, categoryId, vendorId, amount, date, note,
    isPending, photo: null, createdAt: new Date().toISOString(),
  });

  await db.expenses.bulkAdd([
    exp(cat('Labour'),    rajuId,    25000, '2026-03-05', 'Site clearance and leveling'),
    exp(cat('Misc'),      null,       8500, '2026-03-06', 'Soil test report'),
    exp(cat('Cement'),    shivId,    32500, '2026-03-12', '50 bags cement @ ₹650'),
    exp(cat('Sand'),      shivId,    18000, '2026-03-13', '3 brass sand for PCC'),
    exp(cat('Labour'),    rajuId,    45000, '2026-03-18', 'Excavation + foundation labour'),
    exp(cat('Misc'),      null,      12000, '2026-03-20', 'Waterproofing material'),
    exp(cat('Steel'),     shivId,   125000, '2026-04-02', '2.5 MT Fe500 steel @ ₹50K/MT'),
    exp(cat('Cement'),    shivId,    39000, '2026-04-05', '60 bags cement for columns'),
    exp(cat('Labour'),    rajuId,    55000, '2026-04-10', 'Column shuttering + pouring'),
    exp(cat('Labour'),    rajuId,    30000, '2026-04-15', 'Beam casting labour'),
    exp(cat('Steel'),     shivId,   145000, '2026-04-22', '2.9 MT slab steel'),
    exp(cat('Cement'),    shivId,    52000, '2026-04-25', '80 bags for slab'),
    exp(cat('Labour'),    rajuId,    75000, '2026-05-01', 'Slab shuttering + casting + curing'),
    exp(cat('Misc'),      null,      28000, '2026-05-03', 'Concrete pump charges'),
    exp(cat('Bricks'),    shivId,    68000, '2026-05-10', '8500 bricks @ ₹8 each'),
    exp(cat('Sand'),      shivId,    14000, '2026-05-12', '2 brass river sand for masonry'),
    exp(cat('Cement'),    shivId,    19500, '2026-05-14', '30 bags for masonry'),
    exp(cat('Labour'),    rajuId,    45000, '2026-05-20', 'Wall masonry — 1st floor advance'),
    exp(cat('Labour'),    rajuId,    35000, '2026-05-25', '2nd payment — wall progress'),
    exp(cat('Electric'),  pradeepId, 25000, '2026-06-01', 'Conduit laying — agreed price', true),
    exp(cat('Labour'),    rajuId,    40000, '2026-06-05', 'Remaining wall balance due', true),
  ]);

  await db.settings.put({ key: 'onboardingDone', value: 'true' });
  await db.settings.put({ key: 'isDemo', value: 'true' });
}
