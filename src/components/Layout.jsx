import { NavLink, Outlet } from 'react-router-dom';
import { Home, PlusCircle, List, FileText, Settings } from 'lucide-react';

export default function Layout() {
  return (
    <div className="app-layout">
      <main className="app-main">
        <Outlet />
      </main>
      <nav className="bottom-nav">
        <NavLink to="/" end className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
          <Home size={22} />
          <span>Home</span>
        </NavLink>
        <NavLink to="/expenses" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
          <List size={22} />
          <span>Expenses</span>
        </NavLink>
        <div className="nav-fab-wrap">
          <NavLink to="/add" className={({ isActive }) => `nav-fab${isActive ? ' active-route' : ''}`}>
            <PlusCircle size={28} strokeWidth={2.5} />
          </NavLink>
        </div>
        <NavLink to="/report" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
          <FileText size={22} />
          <span>Report</span>
        </NavLink>
        <NavLink to="/settings" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
          <Settings size={22} />
          <span>Settings</span>
        </NavLink>
      </nav>
    </div>
  );
}
