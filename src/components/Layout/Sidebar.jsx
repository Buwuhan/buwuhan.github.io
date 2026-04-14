import { NavLink, useLocation } from 'react-router-dom';
import { useCloud } from '../../context/CloudContext.jsx';
import SyncStatus from '../UI/SyncStatus.jsx';

const NAV_ITEMS = [
  { to: '/', icon: '📊', label: 'Dashboard' },
  { to: '/catat', icon: '✍️', label: 'Catat' },
  { to: '/tamu', icon: '👥', label: 'Buku Tamu' },
  { to: '/acara', icon: '🎊', label: 'Acara' },
  { to: '/pengaturan', icon: '⚙️', label: 'Pengaturan' },
];

export default function Sidebar() {
  const { user, syncStatus, login, logout, clientIdMissing } = useCloud();
  const location = useLocation();

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="logo-name">🎋 Buwuhan</div>
        <div className="logo-sub">Pencatat Sumbangan Hajatan</div>
      </div>

      <nav className="sidebar-nav">
        {NAV_ITEMS.map(({ to, icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
          >
            <span className="nav-icon">{icon}</span>
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <SyncStatus status={syncStatus} />

        {!clientIdMissing && (
          user ? (
            <div>
              <div className="user-card">
                <img src={user.picture} alt={user.name} />
                <div className="user-info">
                  <div className="user-name">{user.name}</div>
                  <div className="user-email">{user.email}</div>
                </div>
              </div>
              <button
                className="btn btn-secondary btn-sm w-full mt-8"
                onClick={logout}
                style={{ justifyContent: 'center' }}
              >
                Keluar Akun
              </button>
            </div>
          ) : (
            <button className="btn btn-google" onClick={login}>
              <svg width="16" height="16" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Masuk dengan Google
            </button>
          )
        )}


        {clientIdMissing && (
          <div className="sync-badge offline">
            <span className="sync-dot"></span>
            <span>Sinkronisasi Google Drive belum dikonfigurasi</span>
          </div>
        )}

        <div className="legal-footer">
          <div style={{ display: 'flex', flexWrap: 'wrap' }}>
            <a href="/privacy.html" target="_blank" className="legal-link">Kebijakan Privasi</a>
            <span className="legal-divider">•</span>
            <a href="/terms.html" target="_blank" className="legal-link">Syarat Ketentuan</a>
          </div>
          <div className="legal-link" style={{ opacity: 0.5 }}>v1.2.0 • Buwuhan Tracker</div>
        </div>
      </div>
    </aside>
  );
}

// Mobile Bottom Navigation
export function MobileNav() {
  return (
    <nav className="mobile-nav">
      {NAV_ITEMS.map(({ to, icon, label }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          className={({ isActive }) => `mobile-nav-item${isActive ? ' active' : ''}`}
        >
          <span className="mobile-icon">{icon}</span>
          {label}
        </NavLink>
      ))}
    </nav>
  );
}
