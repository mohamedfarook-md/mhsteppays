// src/pages/agent/AgentEarnings.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { commissionAPI, agentsAPI } from '../../utils/api';

const fmt = (n) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(n || 0);

export default function AgentEarnings() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [earnings, setEarnings] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([commissionAPI.getByAgent(user.id), agentsAPI.getEarnings(user.id)])
      .then(([c, e]) => { setData(c.data.data); setEarnings(e.data.data); })
      .finally(() => setLoading(false));
  }, [user.id]);

  if (loading) return <div className="loading-spinner" />;

  return (
    <div>
      <div className="page-header"><div><h1 className="page-title">My Earnings</h1><p className="page-subtitle">Track your commission income</p></div></div>

      <div className="stat-grid" style={{ marginBottom: 20 }}>
        {[
          { label: 'Total Earned', value: fmt(earnings?.total), icon: '💰', color: 'green' },
          { label: "Today", value: fmt(earnings?.today), icon: '📅', color: 'blue' },
          { label: 'This Month', value: fmt(earnings?.month), icon: '📆', color: 'purple' },
          { label: 'Total Transactions', value: data?.summary?.totalTxn || 0, icon: '🔢', color: 'amber' },
        ].map((s, i) => (
          <div key={i} className="stat-card">
            <div className={`stat-icon ${s.color}`} style={{ fontSize: 22 }}>{s.icon}</div>
            <div className="stat-info">
              <div className="stat-label">{s.label}</div>
              <div className="stat-value" style={{ fontSize: 20 }}>{s.value}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="card-header"><span className="card-title">Commission History</span></div>
        <div className="table-container">
          <table className="data-table">
            <thead><tr><th>Merchant</th><th>Transaction Amount</th><th>Rate</th><th>Commission</th><th>Date</th></tr></thead>
            <tbody>
              {(data?.transactions || []).map(c => (
                <tr key={c._id}>
                  <td style={{ fontWeight: 500 }}>{c.merchantId?.name || '—'}</td>
                  <td style={{ fontWeight: 600 }}>{fmt(c.txnAmount)}</td>
                  <td><span className="badge badge-info">{c.commissionRate}%</span></td>
                  <td style={{ fontWeight: 700, color: 'var(--success)' }}>{fmt(c.commissionEarned)}</td>
                  <td style={{ fontSize: 12, color: 'var(--gray-500)' }}>{new Date(c.createdAt).toLocaleString('en-IN')}</td>
                </tr>
              ))}
              {(!data?.transactions?.length) && <tr><td colSpan={5}><div className="empty-state"><div className="empty-state-icon">💸</div><div>No earnings yet</div></div></td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}