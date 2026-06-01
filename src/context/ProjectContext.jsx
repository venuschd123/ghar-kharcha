import { createContext, useContext, useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';

const ProjectContext = createContext(null);

export function ProjectProvider({ children }) {
  const projects = useLiveQuery(() => db.projects.orderBy('createdAt').toArray(), [], []);
  const [activeProjectId, setActiveProjectId] = useState(null);

  // Load saved active project from settings
  useEffect(() => {
    db.settings.get('activeProjectId').then(s => {
      if (s?.value) setActiveProjectId(Number(s.value));
    });
  }, []);

  // Auto-select first project if none selected
  useEffect(() => {
    if (projects && projects.length > 0 && !activeProjectId) {
      setActiveProjectId(projects[0].id);
    }
  }, [projects, activeProjectId]);

  const activeProject = projects?.find(p => p.id === activeProjectId) || projects?.[0] || null;

  const switchProject = async (id) => {
    setActiveProjectId(id);
    await db.settings.put({ key: 'activeProjectId', value: String(id) });
  };

  const createProject = async (name, budget = 0, sqft = 0) => {
    const id = await db.projects.add({
      name, budget, sqft,
      createdAt: new Date().toISOString(),
    });
    // Seed default phases for new project
    const { DEFAULT_PHASES } = await import('../db');
    await db.phases.bulkAdd(DEFAULT_PHASES.map(p => ({ ...p, projectId: id })));
    await switchProject(id);
    return id;
  };

  return (
    <ProjectContext.Provider value={{ projects: projects || [], activeProject, activeProjectId, switchProject, createProject }}>
      {children}
    </ProjectContext.Provider>
  );
}

export function useProject() {
  const ctx = useContext(ProjectContext);
  if (!ctx) throw new Error('useProject must be inside ProjectProvider');
  return ctx;
}
