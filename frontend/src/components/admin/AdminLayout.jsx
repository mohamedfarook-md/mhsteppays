// src/components/admin/AdminLayout.jsx
import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { notificationsAPI } from '../../utils/api';
import { useEffect } from 'react';

const navItems = [
  { path: '/admin', label: 'Dashboard', icon: '📊', exact: true },
  { path: '/admin/merchants', label: 'Merchants', icon: '🏪' },
  { path: '/admin/agents', label: 'Field Agents', icon: '👤' },
  { path: '/admin/transactions', label: 'Transactions', icon: '💳' },
  { path: '/admin/qr', label: 'QR Management', icon: '🔳' },
  { path: '/admin/analytics', label: 'Analytics', icon: '📈' },
  { path: '/admin/commission', label: 'Commission', icon: '💰' },
  { path: '/admin/logs', label: 'System Logs', icon: '🗃' },
  { path: '/admin/settings', label: 'Settings', icon: '⚙️' },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    notificationsAPI.getAll().then(({ data }) => {
      setUnreadCount(data.data?.filter(n => !n.read).length || 0);
    }).catch(() => {});
  }, []);

  const isActive = (item) => item.exact ? location.pathname === item.path : location.pathname.startsWith(item.path);

  const currentPage = navItems.find(n => isActive(n))?.label || 'Dashboard';

  return (
    <div className="app-layout">
      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-logo">
          <div className="logo-mark">
            <div className="logo-icon">SP</div>
            <span className="logo-text">Step<span>Pays</span></span>
          </div>
          <div style={{ marginTop: 6, fontSize: 11, color: 'var(--gray-400)', fontWeight: 600, letterSpacing: 1 }}>
            ADMIN PANEL
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section-label">Main</div>
          {navItems.slice(0, 5).map(item => (
            <button key={item.path} className={`nav-item ${isActive(item) ? 'active' : ''}`}
              onClick={() => { navigate(item.path); setSidebarOpen(false); }}>
              <span style={{ fontSize: 16 }}>{item.icon}</span>
              {item.label}
            </button>
          ))}

          <div className="nav-section-label" style={{ marginTop: 8 }}>Reports</div>
          {navItems.slice(5).map(item => (
            <button key={item.path} className={`nav-item ${isActive(item) ? 'active' : ''}`}
              onClick={() => { navigate(item.path); setSidebarOpen(false); }}>
              <span style={{ fontSize: 16 }}>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-info" style={{ marginBottom: 12 }}>
            <div className="avatar">{user?.name?.[0]?.toUpperCase()}</div>
            <div>
              <div className="user-name">{user?.name}</div>
              <div className="user-role">Administrator</div>
            </div>
          </div>
          <button className="btn btn-ghost btn-full btn-sm" onClick={logout}>
            ← Sign Out
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="main-content">
        <header className="top-header">
          <button style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', display: 'none' }}
            onClick={() => setSidebarOpen(!sidebarOpen)}>☰</button>
          <h2 className="header-title">{currentPage}</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button style={{ background: 'var(--gray-100)', border: 'none', width: 36, height: 36, borderRadius: 'var(--radius-md)', cursor: 'pointer', position: 'relative', fontSize: 16 }}>
              🔔
              {unreadCount > 0 && (
                <span style={{ position: 'absolute', top: -2, right: -2, background: 'var(--danger)', color: 'white', borderRadius: '99px', fontSize: 9, fontWeight: 700, minWidth: 16, height: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 3px' }}>
                  {unreadCount}
                </span>
              )}
            </button>
            <div className="user-info">
              <div className="avatar">{user?.name?.[0]?.toUpperCase()}</div>
              <div>
                <div className="user-name" style={{ fontSize: 13 }}>{user?.name}</div>
                <div className="user-role">Admin</div>
              </div>
            </div>
          </div>
        </header>

        <div className="page-body">
          <Outlet />
        </div>
      </main>

      {sidebarOpen && <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 99 }} onClick={() => setSidebarOpen(false)} />}
    </div>
  );
}