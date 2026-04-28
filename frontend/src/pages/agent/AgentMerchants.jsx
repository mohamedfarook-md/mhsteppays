// src/pages/agent/AgentMerchants.jsx
import { useState, useEffect, useCallback } from 'react';
import { merchantsAPI } from '../../utils/api';
import { useToast } from '../../context/ToastContext';

export default function AgentMerchants() {
  const [merchants, setMerchants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState('');
  const [form, setForm] = useState({ name: '', upiId: '', phone: '', email: '', address: '' });
  const [submitting, setSubmitting] = useState(false);
  const toast = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await merchantsAPI.getAll({ status: filter });
      setMerchants(data.data || []);
    } catch { toast.show('Failed to load', 'error'); }
    finally { setLoading(false); }
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await merchantsAPI.create(form);
      toast.show('Merchant submitted for approval!', 'success');
      setShowForm(false);
      setForm({ name: '', upiId: '', phone: '', email: '', address: '' });
      load();
    } catch (err) { toast.show(err.response?.data?.message || 'Failed', 'error'); }
    finally { setSubmitting(false); }
  };

  const StatusBadge = ({ s }) => {
    const map = { approved: 'badge-success', pending: 'badge-warning', rejected: 'badge-danger' };
    return <span className={`badge ${map[s] || 'badge-gray'}`}>{s}</span>;
  };

  return (
    <div>
      <div className="page-header">
        <div><h1 className="page-title">My Merchants</h1><p className="page-subtitle">{merchants.length} merchants</p></div>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? '✕ Cancel' : '+ Add Merchant'}
        </button>
      </div>

      {showForm && (
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="card-header"><span className="card-title">Add New Merchant</span></div>
          <div className="card-body">
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Business Name *</label>
                  <input className="form-input" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Business name" />
                </div>
                <div className="form-group">
                  <label className="form-label">UPI ID *</label>
                  <input className="form-input" required value={form.upiId} onChange={e => setForm({ ...form, upiId: e.target.value })} placeholder="name@upi or number@bank" />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Phone</label>
                  <input className="form-input" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="Mobile number" />
                </div>
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input className="form-input" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="Business email" />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Address</label>
                <input className="form-input" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} placeholder="Business address" />
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? '⏳ Submitting...' : '📤 Submit for Approval'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-header">
          <div className="tabs">
            {[['','All'],['pending','Pending'],['approved','Approved'],['rejected','Rejected']].map(([v,l]) => (
              <button key={v} className={`tab-btn ${filter === v ? 'active' : ''}`} onClick={() => setFilter(v)}>{l}</button>
            ))}
          </div>
        </div>
        <div className="table-container">
          {loading ? <div className="loading-spinner" /> : (
            <table className="data-table">
              <thead><tr><th>Merchant</th><th>UPI ID</th><th>Transactions</th><th>Status</th><th>Submitted</th></tr></thead>
              <tbody>
                {merchants.map(m => (
                  <tr key={m._id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{m.name}</div>
                      {m.status === 'rejected' && m.rejectionReason && (
                        <div style={{ fontSize: 11, color: 'var(--danger)', marginTop: 2 }}>❌ {m.rejectionReason}</div>
                      )}
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: 13 }}>{m.upiId}</td>
                    <td>{m.totalTxn} txn</td>
                    <td><StatusBadge s={m.status} /></td>
                    <td style={{ fontSize: 12, color: 'var(--gray-500)' }}>{new Date(m.createdAt).toLocaleDateString('en-IN')}</td>
                  </tr>
                ))}
                {merchants.length === 0 && <tr><td colSpan={5}><div className="empty-state"><div className="empty-state-icon">🏪</div><div>No merchants {filter ? `with status: ${filter}` : 'yet'}</div></div></td></tr>}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}