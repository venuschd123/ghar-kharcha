import { createContext, useContext, useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { usePro } from './ProContext'; // consume once — no duplicate query

const ProjectContext = createContext(null);

export const FREE_PROJECT_LIMIT = 1;

export function ProjectProvider({ children }) {
  const projects = useLiveQuery(() => db.projects.orderBy('createdAt').toArray(), [], []);
  const [activeProjectId, setActiveProjectId] = useState(null);

  // Read isPro from ProContext — do NOT re-query pro_status here (causes double re-render cascade)
  const { isPro } = usePro();

  useEffect(() => {
    db.settings.get('activeProjectId').then(s => {
      if (s?.value) setActiveProjectId(Number(s.value));
    });
  }, []);

  useEffect(() => {
    if (projects && projects.length > 0 && !activeProjectId) {
      setActiveProjectId(projects[0].id);
    }
  }, [projects, activeProjectId]);

  const activeProject = projects?.find(p => p.id === activeProjectId) || projects?.[0] || null;
  const canCreateProject = isPro || (projects?.length ?? 0) < FREE_PROJECT_LIMIT;

  const switchProject = async (id) => {
    setActiveProjectId(id);
    await db.settings.put({ key: 'activeProjectId', value: String(id) });
  };

  const createProject = async (name, budget = 0, sqft = 0) => {
    if (!canCreateProject) throw new Error('UPGRADE_REQUIRED');
    const id = await db.projects.add({
      name, budget, sqft,
      createdAt: new Date().toISOString(),
    });
    const { DEFAULT_PHASES } = await import('../db');
    await db.phases.bulkAdd(DEFAULT_PHASES.map(p => ({ ...p, projectId: id })));
    await switchProject(id);
    return id;
  };

  return (
    <ProjectContext.Provider value={{
      projects: projects || [],
      activeProject,
      activeProjectId,
      isPro,
      canCreateProject,
      switchProject,
      createProject,
    }}>
      {children}
    </ProjectContext.Provider>
  );
}

export function useProject() {
  const ctx = useContext(ProjectContext);
  if (!ctx) throw new Error('useProject must be inside ProjectProvider');
  return ctx;
}
