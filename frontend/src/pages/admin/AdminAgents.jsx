// src/pages/admin/AdminAgents.jsx
import { useState, useEffect, useCallback } from 'react';
import { agentsAPI } from '../../utils/api';
import { useToast } from '../../context/ToastContext';

export default function AdminAgents() {
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('');
  const [selected, setSelected] = useState(null);
  const [perf, setPerf] = useState(null);
  const toast = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await agentsAPI.getAll({ search, status: filter });
      setAgents(data.data);
    } catch { toast.show('Failed to load agents', 'error'); }
    finally { setLoading(false); }
  }, [search, filter]);

  // useEffect(() => { load(); }, [load]);
  useEffect(() => {
  load();

  const interval = setInterval(() => {
    load();
  }, 100000); // 10 sec refresh

  return () => clearInterval(interval);
}, [load]);

  const handleView = async (agent) => {
    setSelected(agent); setPerf(null);
    try {
      const [{ data: p }, { data: e }] = await Promise.all([agentsAPI.getPerformance(agent._id), agentsAPI.getEarnings(agent._id)]);
      setPerf({ ...p.data, earnings: e.data });
    } catch {}
  };

  const handleToggleStatus = async (agent) => {
    const newStatus = agent.status === 'active' ? 'inactive' : 'active';
    try {
      await agentsAPI.update(agent._id, { status: newStatus });
      toast.show(`Agent ${newStatus}`, 'success');
      load();
    } catch { toast.show('Failed', 'error'); }
  };

  const StatusBadge = ({ s }) => {
    const map = { active: 'badge-success', inactive: 'badge-danger', pending: 'badge-warning' };
    return <span className={`badge ${map[s] || 'badge-gray'}`}>{s}</span>;
  };

  return (
    <div>
      <div className="page-header">
        <div><h1 className="page-title">Field Agents</h1><p className="page-subtitle">Manage all registered agents</p></div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 380px' : '1fr', gap: 20 }}>
        <div className="card">
          <div className="card-header">
            <div className="filter-bar">
              <input className="search-input" placeholder="Search agents..." value={search} onChange={e => setSearch(e.target.value)} />
              <select className="form-select" style={{ width: 'auto' }} value={filter} onChange={e => setFilter(e.target.value)}>
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="pending">Pending</option>
              </select>
            </div>
          </div>
          <div className="table-container">
            {loading ? <div className="loading-spinner" /> : (
              <table className="data-table">
                <thead><tr><th>Agent</th><th>Agent ID</th><th>Phone</th><th>Student</th><th>Status</th><th>Actions</th></tr></thead>
                <tbody>
                  {agents.map(a => (
                    <tr key={a._id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div className="avatar" style={{ width: 28, height: 28, fontSize: 11 }}>{a.name[0]}</div>
                          <div>
                            <div style={{ fontWeight: 600 }}>{a.name}</div>
                            <div style={{ fontSize: 11, color: 'var(--gray-400)' }}>{a.email}</div>
                          </div>
                        </div>
                      </td>
                      <td><span style={{ fontFamily: 'var(--font-mono)', fontSize: 13 }}>{a.agentId}</span></td>
                      <td>{a.phone}</td>
                      <td>{a.isStudent ? <span className="badge badge-info">📚 Yes</span> : '—'}</td>
                      {/* <td><StatusBadge s={a.status} /></td> */}
                      <td>
                       {a.isOnline ? (
                       <span className="badge badge-success">🟢 Active</span>
                       ) : (
                       <span className="badge badge-gray">⚫ Inactive</span>
                        )}
                     </td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button className="btn btn-ghost btn-sm" onClick={() => handleView(a)}>View</button>
                          <button className={`btn btn-sm ${a.status === 'active' ? 'btn-danger' : 'btn-success'}`}
                            onClick={() => handleToggleStatus(a)}>
                            {a.status === 'active' ? 'Disable' : 'Enable'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {agents.length === 0 && <tr><td colSpan={6}><div className="empty-state"><div className="empty-state-icon">👤</div><div>No agents found</div></div></td></tr>}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {selected && (
          <div className="card">
            <div className="card-header">
              <span className="card-title">{selected.name}</span>
              <button style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: 'var(--gray-400)' }} onClick={() => setSelected(null)}>×</button>
            </div>
            <div className="card-body">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ padding: 14, background: 'var(--gray-50)', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ fontSize: 11, color: 'var(--gray-400)', marginBottom: 2 }}>Agent ID</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{selected.agentId}</div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  {[
                    { label: 'Total Merchants', value: perf?.merchantCount || 0 },
                    { label: 'Total Earnings', value: `₹${new Intl.NumberFormat('en-IN').format(perf?.earnings?.total || 0)}` },
                    { label: "Today's Earnings", value: `₹${new Intl.NumberFormat('en-IN').format(perf?.earnings?.today || 0)}` },
                    { label: 'Month Earnings', value: `₹${new Intl.NumberFormat('en-IN').format(perf?.earnings?.month || 0)}` },
                  ].map((s, i) => (
                    <div key={i} style={{ padding: 14, background: 'var(--primary-light)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                      <div style={{ fontSize: 11, color: 'var(--primary)', fontWeight: 600, marginBottom: 4 }}>{s.label}</div>
                      <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--gray-900)' }}>{s.value}</div>
                    </div>
                  ))}
                </div>
                {perf?.merchantsByStatus && (
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Merchants by Status</div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {perf.merchantsByStatus.map(s => (
                        <span key={s._id} className="badge badge-gray">{s._id}: {s.count}</span>
                      ))}
                    </div>
                  </div>
                )}
                <div style={{ fontSize: 13, color: 'var(--gray-500)', borderTop: '1px solid var(--gray-100)', paddingTop: 12 }}>
                  <div>📧 {selected.email}</div>
                  <div style={{ marginTop: 4 }}>📱 {selected.phone}</div>
                  {/* {selected.loginTime && <div style={{ marginTop: 4 }}>🕐 Last login: {new Date(selected.loginTime).toLocaleString('en-IN')}</div>} */}
                  {selected.loginTime && (
  <div style={{ marginTop: 4 }}>
    🟢 Login: {new Date(selected.loginTime).toLocaleString('en-IN')}
  </div>
)}

{selected.logoutTime && (
  <div style={{ marginTop: 4 }}>
    🔴 Logout: {new Date(selected.logoutTime).toLocaleString('en-IN')}
  </div>
)}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}