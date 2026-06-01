import { useState, useEffect } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { LayoutDashboard, Plus, Users, ListChecks, Settings, WifiOff, BarChart2 } from 'lucide-react';
import InstallPrompt from './InstallPrompt';

export default function Layout() {
  const [offline, setOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const goOff = () => setOffline(true);
    const goOn = () => setOffline(false);
    window.addEventListener('offline', goOff);
    window.addEventListener('online', goOn);
    return () => { window.removeEventListener('offline', goOff); window.removeEventListener('online', goOn); };
  }, []);

  return (
    <div className="app-layout">
      {offline && (
        <div className="offline-banner">
          <WifiOff size={13} /> Offline - your data is saved locally
        </div>
      )}
      <main className="app-main">
        <Outlet />
      </main>
      <nav className="bottom-nav">
        <NavLink to="/" end className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
          <LayoutDashboard size={21} strokeWidth={isActive => isActive ? 2.5 : 2} />
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
        <NavLink to="/vendors" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
          <Users size={21} strokeWidth={2} />
          <span>Vendors</span>
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
