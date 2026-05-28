import { NavLink, Outlet } from 'react-router-dom';
import { Home, PlusCircle, List, FileText, Settings } from 'lucide-react';

const navItems = [
  { to: '/', icon: Home, label: 'Home' },
  { to: '/expenses', icon: List, label: 'Expenses' },
  { to: '/add', icon: PlusCircle, label: 'Add', isMain: true },
  { to: '/report', icon: FileText, label: 'Report' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

export default function Layout() {
  return (
    <div className="app-layout">
      <main className="app-main">
        <Outlet />
      </main>
      <nav className="bottom-nav">
        {navItems.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `nav-item ${isActive ? 'active' : ''} ${item.isMain ? 'nav-main' : ''}`
            }
            end={item.to === '/'}
          >
            {item.isMain ? (
              <div className="nav-main-btn">
                <item.icon size={28} strokeWidth={2.5} />
              </div>
            ) : (
              <>
                <item.icon size={22} strokeWidth={item.to === '/' ? 2.5 : 2} />
                <span>{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
