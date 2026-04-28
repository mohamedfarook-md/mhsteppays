// src/pages/admin/AdminDashboard.jsx
import { useState, useEffect } from 'react';
import { adminAPI, analyticsAPI } from '../../utils/api';
import { Line, Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler);

const fmt = (n) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n || 0);
const fmtNum = (n) => new Intl.NumberFormat('en-IN').format(n || 0);

const StatusBadge = ({ s }) => {
  const map = { success: 'badge-success', pending: 'badge-warning', failed: 'badge-danger', approved: 'badge-success', rejected: 'badge-danger' };
  return <span className={`badge ${map[s] || 'badge-gray'}`}>{s}</span>;
};

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [revenue, setRevenue] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([adminAPI.getDashboard(), analyticsAPI.getRevenue('14')])
      .then(([{ data: dash }, { data: rev }]) => {
        setStats(dash.data);
        setRevenue(rev.data || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading-spinner" />;

  const statCards = [
    { label: 'Total Revenue', value: fmt(stats?.stats?.totalRevenue), icon: '₹', color: 'blue' },
    { label: "Today's Revenue", value: fmt(stats?.stats?.todayRevenue), icon: '📅', color: 'green' },
    { label: 'Total Transactions', value: fmtNum(stats?.stats?.totalTxn), icon: '💳', color: 'purple' },
    { label: "Today's Transactions", value: fmtNum(stats?.stats?.todayTxn), icon: '⚡', color: 'amber' },
    { label: 'Active Merchants', value: fmtNum(stats?.stats?.totalMerchants), icon: '🏪', color: 'cyan' },
    { label: 'Active Agents', value: fmtNum(stats?.stats?.totalAgents), icon: '👥', color: 'red' },
  ];

  const chartLabels = revenue.map(r => {
    const d = new Date(r._id);
    return d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
  });

  const chartData = {
    labels: chartLabels,
    datasets: [{
      label: 'Revenue (₹)',
      data: revenue.map(r => r.revenue),
      fill: true,
      borderColor: '#2563eb',
      backgroundColor: 'rgba(37,99,235,0.08)',
      tension: 0.4,
      pointBackgroundColor: '#2563eb',
      pointRadius: 4,
      pointHoverRadius: 6,
    }]
  };

  const txnChartData = {
    labels: chartLabels,
    datasets: [{
      label: 'Transactions',
      data: revenue.map(r => r.count),
      backgroundColor: 'rgba(14,165,233,0.75)',
      borderRadius: 6,
      borderSkipped: false,
    }]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { grid: { display: false }, ticks: { font: { size: 11 } } },
      y: { grid: { color: 'rgba(0,0,0,0.04)' }, ticks: { font: { size: 11 } } }
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard Overview</h1>
          <p className="page-subtitle">Welcome back! Here's what's happening today.</p>
        </div>
        <div style={{ fontSize: 13, color: 'var(--gray-500)', background: 'var(--white)', padding: '8px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--gray-200)' }}>
          📅 {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
      </div>

      {/* Stats */}
      <div className="stat-grid">
        {statCards.map((s, i) => (
          <div key={i} className="stat-card">
            <div className={`stat-icon ${s.color}`} style={{ fontSize: 22 }}>{s.icon}</div>
            <div className="stat-info">
              <div className="stat-label">{s.label}</div>
              <div className="stat-value" style={{ fontSize: 20 }}>{s.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="section-grid" style={{ marginBottom: 24 }}>
        <div className="card">
          <div className="card-header">
            <span className="card-title">Revenue Trend (Last 14 Days)</span>
          </div>
          <div className="card-body">
            <div className="chart-container">
              {revenue.length > 0 ? <Line data={chartData} options={chartOptions} /> : (
                <div className="empty-state"><div className="empty-state-icon">📊</div><div className="empty-state-text">No data yet</div></div>
              )}
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <span className="card-title">Daily Transactions</span>
          </div>
          <div className="card-body">
            <div className="chart-container">
              {revenue.length > 0 ? <Bar data={txnChartData} options={chartOptions} /> : (
                <div className="empty-state"><div className="empty-state-icon">📉</div><div className="empty-state-text">No transactions yet</div></div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">Recent Transactions</span>
          <button className="btn btn-ghost btn-sm" onClick={() => window.location.href = '/admin/transactions'}>View All →</button>
        </div>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Transaction ID</th>
                <th>Merchant</th>
                <th>Agent</th>
                <th>Amount</th>
                <th>Mode</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {stats?.recentTransactions?.length > 0 ? stats.recentTransactions.map(txn => (
                <tr key={txn._id}>
                  <td><span style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{txn.txnId?.slice(-12)}</span></td>
                  <td style={{ fontWeight: 500 }}>{txn.merchantId?.name || '—'}</td>
                  <td style={{ color: 'var(--gray-500)' }}>{txn.agentId?.name || '—'}</td>
                  <td style={{ fontWeight: 600, color: 'var(--success)' }}>{fmt(txn.amount)}</td>
                  <td>{txn.paymentMode || '—'}</td>
                  <td><StatusBadge s={txn.status} /></td>
                  <td style={{ color: 'var(--gray-500)', fontSize: 12 }}>{new Date(txn.createdAt).toLocaleString('en-IN')}</td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: 'var(--gray-400)' }}>
                    No transactions yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}