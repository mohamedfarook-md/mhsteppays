// src/components/agent/AgentLayout.jsx
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useState, useEffect } from 'react';

const navItems = [
  { path: '/agent', label: 'Dashboard', icon: '📊', exact: true },
  { path: '/agent/merchants', label: 'My Merchants', icon: '🏪' },
  { path: '/agent/earnings', label: 'Earnings', icon: '💰' },
  { path: '/agent/notifications', label: 'Notifications', icon: '🔔' },
];

export default function AgentLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isActive = (item) => item.exact ? location.pathname === item.path : location.pathname.startsWith(item.path);
  const currentPage = navItems.find(n => isActive(n))?.label || 'Dashboard';
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  return (
    <div className="app-layout">

      {/* <aside className="sidebar"> */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
    
        <button className="close-btn" onClick={() => setSidebarOpen(false)}>✕</button>
        <div className="sidebar-logo">
          <div className="logo-mark">
            <div className="logo-icon">SP</div>
            <span className="logo-text">Step<span>Pays</span></span>
          </div>
          <div style={{ marginTop: 6, fontSize: 11, color: 'var(--gray-400)', fontWeight: 600, letterSpacing: 1 }}>AGENT PORTAL</div>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section-label">Navigation</div>
          {navItems.map(item => (
            <button key={item.path} className={`nav-item ${isActive(item) ? 'active' : ''}`}
              // onClick={() => navigate(item.path)}>
              onClick={() => {
  navigate(item.path);
  setSidebarOpen(false);
}}>
              <span style={{ fontSize: 16 }}>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div style={{ padding: '10px 0', marginBottom: 10 }}>
            <div style={{ fontSize: 11, color: 'var(--gray-400)', marginBottom: 4 }}>Agent ID</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--primary)', fontSize: 15 }}>{user?.agentId}</div>
          </div>
          <div className="user-info" style={{ marginBottom: 12 }}>
            <div className="avatar">{user?.name?.[0]?.toUpperCase()}</div>
            <div>
              <div className="user-name">{user?.name}</div>
              <div className="user-role">Field Agent</div>
            </div>
          </div>
          <button className="btn btn-ghost btn-full btn-sm" onClick={logout}>← Sign Out</button>
        </div>
      </aside>
         {sidebarOpen && (
  <div className="overlay" onClick={() => setSidebarOpen(false)} />
)}
      {/* <main className="main-content"> */}
      <main className={`main-content ${sidebarOpen ? 'blurred' : ''}`}>
        <header className="top-header">
          {/* <h2 className="header-title">{currentPage}</h2> */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
  <button className="menu-btn" onClick={() => setSidebarOpen(true)}>☰</button>
  <h2 className="header-title">{currentPage}</h2>
</div>
          <div className="user-info">
            <div className="avatar">{user?.name?.[0]?.toUpperCase()}</div>
            <div>
              <div className="user-name" style={{ fontSize: 13 }}>{user?.name}</div>
              <div className="user-role">{user?.agentId}</div>
            </div>
          </div>
        </header>
        <div className="page-body"><Outlet /></div>
      </main>
    </div>
  );
}