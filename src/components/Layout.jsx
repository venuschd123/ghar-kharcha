import { useState, useEffect } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { Home, PlusCircle, Users, ListChecks, Settings, WifiOff } from 'lucide-react';

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
          <WifiOff size={13} /> Offline — your data is saved locally
        </div>
      )}
      <main className="app-main">
        <Outlet />
      </main>
      <nav className="bottom-nav">
        <NavLink to="/" end className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
          <Home size={22} />
          <span>Home</span>
        </NavLink>
        <NavLink to="/vendors" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
          <Users size={22} />
          <span>Vendors</span>
        </NavLink>
        <div className="nav-fab-wrap">
          <NavLink to="/add" className={({ isActive }) => `nav-fab${isActive ? ' active-route' : ''}`}>
            <PlusCircle size={28} strokeWidth={2.5} />
          </NavLink>
        </div>
        <NavLink to="/phases" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
          <ListChecks size={22} />
          <span>Phases</span>
        </NavLink>
        <NavLink to="/settings" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
          <Settings size={22} />
          <span>Settings</span>
        </NavLink>
      </nav>
    </div>
  );
}
