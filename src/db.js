import Dexie from 'dexie';

export const db = new Dexie('GharKharchaDB');

db.version(1).stores({
  projects: '++id, name, budget, createdAt',
  expenses: '++id, projectId, categoryId, amount, date, note, photo, createdAt',
  categories: '++id, name, icon, color, isCustom',
  settings: 'key, value'
});

// Default Indian construction categories
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

export async function initDB() {
  const count = await db.categories.count();
  if (count === 0) {
    await db.categories.bulkAdd(
      DEFAULT_CATEGORIES.map(c => ({ ...c, isCustom: false }))
    );
  }

  const hasProject = await db.projects.count();
  if (hasProject === 0) {
    await db.projects.add({
      name: 'My Home Construction',
      budget: 0,
      createdAt: new Date().toISOString(),
    });
  }
}
