import { useState, useEffect } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { LayoutDashboard, Plus, BarChart2, PieChart, Settings, WifiOff } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import ErrorBoundary from './ErrorBoundary';
import InstallPrompt from './InstallPrompt';

const pageVariants = {
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.2, ease: [0.16, 1, 0.3, 1] } },
  exit:    { opacity: 0, y: -4, transition: { duration: 0.12, ease: 'easeIn' } },
};

function AnimatedOutlet() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={location.pathname}
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
      >
        {/* Scoped ErrorBoundary per route — DB failure on one page doesn't kill the app */}
        <ErrorBoundary key={location.pathname}>
          <Outlet />
        </ErrorBoundary>
      </motion.div>
    </AnimatePresence>
  );
}

export default function Layout() {
  const [offline, setOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const on  = () => setOffline(false);
    const off = () => setOffline(true);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
    };
  }, []);

  return (
    <div className="app-layout">
      {offline && (
        <div className="offline-banner">
          <WifiOff size={13} /> Offline — your data is saved locally
        </div>
      )}
      <main className="app-main">
        <AnimatedOutlet />
      </main>
      <nav className="bottom-nav">
        <NavLink to="/" end className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
          <LayoutDashboard size={21} strokeWidth={2} />
          <span>Home</span>
        </NavLink>
        <NavLink to="/expenses" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
          <BarChart2 size={21} strokeWidth={2} />
          <span>Expenses</span>
        </NavLink>
        <div className="nav-fab-wrap">
          <NavLink to="/add" className={({ isActive }) => `nav-fab${isActive ? ' active-route' : ''}`}>
            <Plus size={26} strokeWidth={2.5} />
          </NavLink>
        </div>
        <NavLink to="/report" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
          <PieChart size={21} strokeWidth={2} />
          <span>Report</span>
        </NavLink>
        <NavLink to="/settings" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
          <Settings size={21} strokeWidth={2} />
          <span>Settings</span>
        </NavLink>
      </nav>
      <InstallPrompt />
    </div>
  );
}
