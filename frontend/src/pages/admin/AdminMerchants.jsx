// src/pages/admin/AdminMerchants.jsx
import { useState, useEffect, useCallback } from 'react';
import { merchantsAPI } from '../../utils/api';
import { useToast } from '../../context/ToastContext';

const StatusBadge = ({ s }) => {
  const map = { approved: 'badge-success', pending: 'badge-warning', rejected: 'badge-danger', inactive: 'badge-gray' };
  return <span className={`badge ${map[s] || 'badge-gray'}`}>{s}</span>;
};

export default function AdminMerchants() {
  const [merchants, setMerchants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});
  const [rejectModal, setRejectModal] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const toast = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await merchantsAPI.getAll({ search, status: filter, page, limit: 15 });
      setMerchants(data.data);
      setPagination(data.pagination);
    } catch (err) {
      toast.show('Failed to load merchants', 'error');
    } finally { setLoading(false); }
  }, [search, filter, page]);

  useEffect(() => { load(); }, [load]);

  const handleApprove = async (id) => {
    try {
      await merchantsAPI.approve(id);
      toast.show('Merchant approved! QR is ready.', 'success');
      load();
    } catch (err) { toast.show(err.response?.data?.message || 'Failed', 'error'); }
  };

  const handleReject = async () => {
    try {
      await merchantsAPI.reject(rejectModal, rejectReason);
      toast.show('Merchant rejected', 'warning');
      setRejectModal(null); setRejectReason('');
      load();
    } catch (err) { toast.show('Failed', 'error'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this merchant? This cannot be undone.')) return;
    try {
      await merchantsAPI.delete(id);
      toast.show('Merchant deleted', 'success');
      load();
    } catch (err) { toast.show('Failed', 'error'); }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Merchant Management</h1>
          <p className="page-subtitle">{pagination.total || 0} total merchants</p>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="filter-bar">
            <input className="search-input" placeholder="Search merchants..." value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }} />
            <select className="form-select" style={{ width: 'auto' }} value={filter}
              onChange={e => { setFilter(e.target.value); setPage(1); }}>
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>

        <div className="table-container">
          {loading ? <div className="loading-spinner" /> : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Merchant</th>
                  <th>UPI ID</th>
                  <th>Agent</th>
                  <th>Total Txn</th>
                  <th>Total Amount</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {merchants.length > 0 ? merchants.map(m => (
                  <tr key={m._id}>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--gray-900)' }}>{m.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--gray-400)', fontFamily: 'var(--font-mono)' }}>{m.merchantId}</div>
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: 13 }}>{m.upiId}</td>
                    <td style={{ color: 'var(--gray-600)' }}>{m.agentId?.name || '—'}</td>
                    <td style={{ fontWeight: 500 }}>{m.totalTxn}</td>
                    <td style={{ fontWeight: 600, color: 'var(--success)' }}>
                      ₹{new Intl.NumberFormat('en-IN').format(m.totalAmount || 0)}
                    </td>
                    <td><StatusBadge s={m.status} /></td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        {m.status === 'pending' && (
                          <>
                            <button className="btn btn-success btn-sm" onClick={() => handleApprove(m._id)}>✓ Approve</button>
                            <button className="btn btn-danger btn-sm" onClick={() => setRejectModal(m._id)}>✕ Reject</button>
                          </>
                        )}
                        {m.status === 'approved' && (
                          <button className="btn btn-ghost btn-sm" onClick={() => window.location.href = `/admin/qr?id=${m.merchantId}`}>🔳 QR</button>
                        )}
                        <button className="btn btn-ghost btn-sm" onClick={() => handleDelete(m._id)} style={{ color: 'var(--danger)' }}>🗑</button>
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr><td colSpan={7}><div className="empty-state"><div className="empty-state-icon">🏪</div><div className="empty-state-text">No merchants found</div></div></td></tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        {pagination.pages > 1 && (
          <div className="pagination">
            <span style={{ fontSize: 13, color: 'var(--gray-500)', marginRight: 8 }}>
              Page {page} of {pagination.pages}
            </span>
            {Array.from({ length: Math.min(pagination.pages, 7) }, (_, i) => i + 1).map(p => (
              <button key={p} className={`page-btn ${p === page ? 'active' : ''}`} onClick={() => setPage(p)}>{p}</button>
            ))}
          </div>
        )}
      </div>

      {/* Reject Modal */}
      {rejectModal && (
        <div className="modal-overlay" onClick={() => setRejectModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">Reject Merchant</span>
              <button style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: 'var(--gray-400)' }} onClick={() => setRejectModal(null)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Rejection Reason (optional)</label>
                <textarea className="form-input" rows={3} placeholder="Reason for rejection..."
                  value={rejectReason} onChange={e => setRejectReason(e.target.value)}
                  style={{ resize: 'vertical' }} />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setRejectModal(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={handleReject}>Confirm Reject</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}