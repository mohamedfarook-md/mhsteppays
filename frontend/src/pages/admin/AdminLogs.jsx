// src/pages/admin/AdminLogs.jsx
import { useState, useEffect } from 'react';
import { logsAPI } from '../../utils/api';

export default function AdminLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('all');

  const load = async (t) => {
    setLoading(true);
    try {
      let res;
      if (t === 'payments') res = await logsAPI.getPayments();
      else if (t === 'errors') res = await logsAPI.getErrors();
      else res = await logsAPI.getAll();
      setLogs(res.data.data || []);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { load(tab); }, [tab]);

  const levelColor = { info: 'badge-info', warn: 'badge-warning', error: 'badge-danger' };

  return (
    <div>
      <div className="page-header">
        <div><h1 className="page-title">System Logs</h1><p className="page-subtitle">Monitor all system activity</p></div>
      </div>
      <div style={{ marginBottom: 16 }}>
        <div className="tabs">
          {[['all','All Logs'],['payments','Payment Logs'],['errors','Error Logs']].map(([v,l]) => (
            <button key={v} className={`tab-btn ${tab === v ? 'active' : ''}`} onClick={() => setTab(v)}>{l}</button>
          ))}
        </div>
      </div>
      <div className="card">
        <div className="table-container">
          {loading ? <div className="loading-spinner" /> : (
            <table className="data-table">
              <thead><tr><th>Level</th><th>Type</th><th>Message</th><th>IP</th><th>Time</th></tr></thead>
              <tbody>
                {logs.map(l => (
                  <tr key={l._id}>
                    <td><span className={`badge ${levelColor[l.level] || 'badge-gray'}`}>{l.level}</span></td>
                    <td><span className="badge badge-gray">{l.type}</span></td>
                    <td style={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 13 }}>{l.message}</td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--gray-500)' }}>{l.ip || '—'}</td>
                    <td style={{ fontSize: 12, color: 'var(--gray-500)' }}>{new Date(l.createdAt).toLocaleString('en-IN')}</td>
                  </tr>
                ))}
                {logs.length === 0 && <tr><td colSpan={5}><div className="empty-state"><div className="empty-state-icon">🗃</div><div>No logs found</div></div></td></tr>}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}