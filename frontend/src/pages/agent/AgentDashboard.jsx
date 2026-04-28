// src/pages/agent/AgentDashboard.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { agentsAPI, merchantsAPI } from '../../utils/api';

const fmt = (n) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n || 0);

export default function AgentDashboard() {
  const { user } = useAuth();
  const [earnings, setEarnings] = useState(null);
  const [performance, setPerformance] = useState(null);
  const [merchants, setMerchants] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      agentsAPI.getEarnings(user.id),
      agentsAPI.getPerformance(user.id),
      merchantsAPI.getAll({ limit: 5 })
    ]).then(([e, p, m]) => {
      setEarnings(e.data.data);
      setPerformance(p.data.data);
      setMerchants(m.data.data || []);
    }).finally(() => setLoading(false));
  }, [user.id]);

  if (loading) return <div className="loading-spinner" />;

  const stats = [
    { label: 'Total Earnings', value: fmt(earnings?.total), icon: '💰', color: 'green' },
    { label: "Today's Earnings", value: fmt(earnings?.today), icon: '📅', color: 'blue' },
    { label: 'This Month', value: fmt(earnings?.month), icon: '📆', color: 'purple' },
    { label: 'Total Merchants', value: performance?.merchantCount || 0, icon: '🏪', color: 'amber' },
  ];

  const StatusBadge = ({ s }) => {
    const map = { approved: 'badge-success', pending: 'badge-warning', rejected: 'badge-danger' };
    return <span className={`badge ${map[s] || 'badge-gray'}`}>{s}</span>;
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Welcome, {user.name}! 👋</h1>
          <p className="page-subtitle">Agent ID: <strong style={{ fontFamily: 'var(--font-mono)', color: 'var(--primary)' }}>{user.agentId}</strong></p>
        </div>
      </div>

      <div className="stat-grid">
        {stats.map((s, i) => (
          <div key={i} className="stat-card">
            <div className={`stat-icon ${s.color}`} style={{ fontSize: 22 }}>{s.icon}</div>
            <div className="stat-info">
              <div className="stat-label">{s.label}</div>
              <div className="stat-value" style={{ fontSize: 20 }}>{s.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Merchant Status Summary */}
      {performance?.merchantsByStatus?.length > 0 && (
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="card-header"><span className="card-title">Merchant Status Overview</span></div>
          <div className="card-body" style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            {performance.merchantsByStatus.map(s => (
              <div key={s._id} style={{ padding: '12px 20px', background: 'var(--gray-50)', borderRadius: 'var(--radius-md)', textAlign: 'center', minWidth: 100 }}>
                <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--gray-900)' }}>{s.count}</div>
                <div style={{ fontSize: 12, color: 'var(--gray-500)', textTransform: 'capitalize', marginTop: 2 }}>{s._id}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Merchants */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">Recent Merchants</span>
          <button className="btn btn-ghost btn-sm" onClick={() => window.location.href = '/agent/merchants'}>View All →</button>
        </div>
        <div className="table-container">
          <table className="data-table">
            <thead><tr><th>Merchant</th><th>UPI ID</th><th>Status</th><th>Submitted</th></tr></thead>
            <tbody>
              {merchants.map(m => (
                <tr key={m._id}>
                  <td style={{ fontWeight: 500 }}>{m.name}</td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: 13 }}>{m.upiId}</td>
                  <td><StatusBadge s={m.status} /></td>
                  <td style={{ fontSize: 12, color: 'var(--gray-500)' }}>{new Date(m.createdAt).toLocaleDateString('en-IN')}</td>
                </tr>
              ))}
              {merchants.length === 0 && <tr><td colSpan={4} style={{ textAlign: 'center', padding: 40, color: 'var(--gray-400)' }}>No merchants yet. Add your first merchant!</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}