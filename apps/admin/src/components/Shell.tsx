import { NavLink, Navigate, Outlet, useLocation } from 'react-router-dom';
import { getToken } from '../api';

function Icon({ d }: { d: string }) {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
      <path d={d} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const tabs = [
  { to: '/', label: 'Catálogo', icon: 'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z' },
  { to: '/secciones', label: 'Secciones', icon: 'M4 7h16M4 12h16M4 17h10' },
  { to: '/pedidos', label: 'Pedidos', icon: 'M6 3h12v18l-3-2-3 2-3-2-3 2z' },
  { to: '/ajustes', label: 'Ajustes', icon: 'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM4 12h2M18 12h2M12 4v2M12 18v2' },
];

export function Phone() {
  return (
    <div className="phone">
      <Outlet />
    </div>
  );
}

export function RequireAuth() {
  const location = useLocation();
  if (!getToken()) return <Navigate to="/login" replace />;
  const form = location.pathname.startsWith('/producto');
  return (
    <>
      <div className={form ? 'screen screen-form' : 'screen'}>
        <Outlet />
      </div>
      {!form && (
        <nav className="tabs" aria-label="Administración">
          {tabs.map((tab) => (
            <NavLink key={tab.to} to={tab.to} end={tab.to === '/'}>
              <Icon d={tab.icon} />
              {tab.label}
            </NavLink>
          ))}
        </nav>
      )}
    </>
  );
}
