// src/pages/admin/AdminAnalytics.jsx
import { useState, useEffect } from 'react';
import { analyticsAPI } from '../../utils/api';
import { Line, Doughnut, Bar } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Tooltip, Legend, Filler } from 'chart.js';

ChartJS.register(ArcElement, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Tooltip, Legend, Filler);

const fmt = (n) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n || 0);

export default function AdminAnalytics() {
  const [revenue, setRevenue] = useState([]);
  const [txnModes, setTxnModes] = useState([]);
  const [topMerchants, setTopMerchants] = useState([]);
  const [agentPerf, setAgentPerf] = useState([]);
  const [period, setPeriod] = useState('30');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      analyticsAPI.getRevenue(period),
      analyticsAPI.getTransactions(),
      analyticsAPI.getTopMerchants(),
      analyticsAPI.getAgentPerformance(),
    ]).then(([r, t, m, a]) => {
      setRevenue(r.data.data || []);
      setTxnModes(t.data.data || []);
      setTopMerchants(m.data.data || []);
      setAgentPerf(a.data.data || []);
    }).finally(() => setLoading(false));
  }, [period]);

  const chartOptions = { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } }, scales: { x: { grid: { display: false } }, y: { grid: { color: 'rgba(0,0,0,0.04)' } } } };

  const revenueData = {
    labels: revenue.map(r => new Date(r._id).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })),
    datasets: [{
      label: 'Revenue', data: revenue.map(r => r.revenue),
      fill: true, borderColor: '#2563eb', backgroundColor: 'rgba(37,99,235,0.08)', tension: 0.4
    }]
  };

  const modeData = {
    labels: txnModes.map(m => m._id || 'Unknown'),
    datasets: [{ data: txnModes.map(m => m.amount), backgroundColor: ['#2563eb', '#10b981', '#f59e0b', '#6366f1', '#ef4444'] }]
  };

  const agentData = {
    labels: agentPerf.map(a => a.agentName || a.agentId || 'Agent'),
    datasets: [{
      label: 'Commission Earned (₹)', data: agentPerf.map(a => a.totalEarned),
      backgroundColor: 'rgba(99,102,241,0.75)', borderRadius: 6, borderSkipped: false
    }]
  };

  if (loading) return <div className="loading-spinner" />;

  return (
    <div>
      <div className="page-header">
        <div><h1 className="page-title">Analytics</h1><p className="page-subtitle">Revenue and performance insights</p></div>
        <div className="tabs">
          {['7','14','30','90'].map(d => (
            <button key={d} className={`tab-btn ${period === d ? 'active' : ''}`} onClick={() => setPeriod(d)}>{d}D</button>
          ))}
        </div>
      </div>

      <div className="section-grid" style={{ marginBottom: 20 }}>
        <div className="card">
          <div className="card-header"><span className="card-title">Revenue Trend</span></div>
          <div className="card-body"><div className="chart-container"><Line data={revenueData} options={{ ...chartOptions, plugins: { legend: { display: false } } }} /></div></div>
        </div>
        <div className="card">
          <div className="card-header"><span className="card-title">Payment Modes</span></div>
          <div className="card-body"><div style={{ height: 250 }}><Doughnut data={modeData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }} /></div></div>
        </div>
      </div>

      <div className="section-grid">
        {/* Top Merchants */}
        <div className="card">
          <div className="card-header"><span className="card-title">🏆 Top Merchants</span></div>
          <div className="table-container">
            <table className="data-table">
              <thead><tr><th>Rank</th><th>Merchant</th><th>Transactions</th><th>Revenue</th></tr></thead>
              <tbody>
                {topMerchants.map((m, i) => (
                  <tr key={m._id}>
                    <td style={{ fontWeight: 700, color: i < 3 ? 'var(--warning)' : 'var(--gray-500)' }}>
                      {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i+1}`}
                    </td>
                    <td style={{ fontWeight: 500 }}>{m.name}</td>
                    <td>{m.totalTxn}</td>
                    <td style={{ fontWeight: 700, color: 'var(--success)' }}>{fmt(m.totalAmount)}</td>
                  </tr>
                ))}
                {topMerchants.length === 0 && <tr><td colSpan={4} style={{ textAlign: 'center', padding: 40, color: 'var(--gray-400)' }}>No data</td></tr>}
              </tbody>
            </table>
          </div>
        </div>

        {/* Agent Performance */}
        <div className="card">
          <div className="card-header"><span className="card-title">Agent Performance</span></div>
          <div className="card-body">
            <div className="chart-container">
              {agentPerf.length > 0 ? (
                <Bar data={agentData} options={{ ...chartOptions, plugins: { legend: { display: false } } }} />
              ) : (
                <div className="empty-state"><div className="empty-state-icon">📊</div><div>No data</div></div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}