// src/pages/admin/AdminCommission.jsx
import { useState, useEffect } from 'react';
import { commissionAPI } from '../../utils/api';

const fmt = (n) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(n || 0);

export default function AdminCommission() {
  const [commissions, setCommissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('all');

  useEffect(() => {
    commissionAPI.getAll().then(({ data }) => setCommissions(data.data || [])).finally(() => setLoading(false));
  }, []);

  const total = commissions.reduce((sum, c) => sum + (c.commissionEarned || 0), 0);

  return (
    <div>
      <div className="page-header">
        <div><h1 className="page-title">Commission Panel</h1><p className="page-subtitle">Track all agent commissions</p></div>
        <div style={{ background: 'var(--success-bg)', color: 'var(--success)', padding: '10px 20px', borderRadius: 'var(--radius-md)', fontWeight: 700, fontSize: 18 }}>
          Total: {fmt(total)}
        </div>
      </div>

      <div className="card">
        <div className="table-container">
          {loading ? <div className="loading-spinner" /> : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Agent</th>
                  <th>Merchant</th>
                  <th>Transaction Amount</th>
                  <th>Commission Rate</th>
                  <th>Commission Earned</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {commissions.map(c => (
                  <tr key={c._id}>
                    <td style={{ fontWeight: 500 }}>{c.agentId?.name || '—'}<br /><span style={{ fontSize: 11, color: 'var(--gray-400)', fontFamily: 'var(--font-mono)' }}>{c.agentId?.agentId}</span></td>
                    <td>{c.merchantId?.name || '—'}</td>
                    <td style={{ fontWeight: 600 }}>{fmt(c.txnAmount)}</td>
                    <td><span className="badge badge-info">{c.commissionRate}%</span></td>
                    <td style={{ fontWeight: 700, color: 'var(--success)' }}>{fmt(c.commissionEarned)}</td>
                    <td style={{ fontSize: 12, color: 'var(--gray-500)' }}>{new Date(c.createdAt).toLocaleString('en-IN')}</td>
                  </tr>
                ))}
                {commissions.length === 0 && <tr><td colSpan={6}><div className="empty-state"><div className="empty-state-icon">💰</div><div>No commission data yet</div></div></td></tr>}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}