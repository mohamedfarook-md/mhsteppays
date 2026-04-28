// src/pages/admin/AdminTransactions.jsx
import { useState, useEffect, useCallback } from 'react';
import { transactionsAPI } from '../../utils/api';
import { useToast } from '../../context/ToastContext';

const StatusBadge = ({ s }) => {
  const map = { success: 'badge-success', pending: 'badge-warning', failed: 'badge-danger', refunded: 'badge-info' };
  return <span className={`badge ${map[s] || 'badge-gray'}`}>{s}</span>;
};

const fmt = (n) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(n || 0);

export default function AdminTransactions() {
  const [txns, setTxns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ status: '', startDate: '', endDate: '', page: 1 });
  const [pagination, setPagination] = useState({});
  const toast = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await transactionsAPI.getAll({ ...filters, limit: 20 });
      setTxns(data.data);
      setPagination(data.pagination);
    } catch { toast.show('Failed to load transactions', 'error'); }
    finally { setLoading(false); }
  }, [filters]);

  useEffect(() => { load(); }, [load]);

  const handleExport = () => {
    window.open(transactionsAPI.exportCSV(), '_blank');
  };

  return (
    <div>
      <div className="page-header">
        <div><h1 className="page-title">Transactions</h1><p className="page-subtitle">{pagination.total || 0} total transactions</p></div>
        <button className="btn btn-primary" onClick={handleExport}>⬇ Export CSV</button>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="filter-bar">
            <select className="form-select" style={{ width: 'auto' }} value={filters.status}
              onChange={e => setFilters({ ...filters, status: e.target.value, page: 1 })}>
              <option value="">All Status</option>
              <option value="success">Success</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
            </select>
            <input type="date" className="form-input" style={{ width: 'auto' }} value={filters.startDate}
              onChange={e => setFilters({ ...filters, startDate: e.target.value, page: 1 })} />
            <input type="date" className="form-input" style={{ width: 'auto' }} value={filters.endDate}
              onChange={e => setFilters({ ...filters, endDate: e.target.value, page: 1 })} />
            <button className="btn btn-ghost btn-sm" onClick={() => setFilters({ status: '', startDate: '', endDate: '', page: 1 })}>
              ✕ Clear
            </button>
          </div>
        </div>

        <div className="table-container">
          {loading ? <div className="loading-spinner" /> : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>TXN ID</th>
                  <th>Merchant</th>
                  <th>Agent</th>
                  <th>Payer</th>
                  <th>Amount</th>
                  <th>Commission</th>
                  <th>Mode</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {txns.map(t => (
                  <tr key={t._id}>
                    <td><span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--gray-600)' }}>{t.txnId?.slice(-14)}</span></td>
                    <td style={{ fontWeight: 500 }}>{t.merchantId?.name || '—'}</td>
                    <td style={{ color: 'var(--gray-500)', fontSize: 13 }}>{t.agentId?.name || '—'}</td>
                    <td>
                      <div style={{ fontSize: 13 }}>{t.payerName || '—'}</div>
                      <div style={{ fontSize: 11, color: 'var(--gray-400)' }}>{t.payerPhone}</div>
                    </td>
                    <td style={{ fontWeight: 700, color: 'var(--success)' }}>{fmt(t.amount)}</td>
                    <td style={{ fontSize: 13, color: 'var(--info)' }}>{fmt(t.commissionAmount)}</td>
                    <td style={{ fontSize: 12 }}>{t.paymentMode || '—'}</td>
                    <td><StatusBadge s={t.status} /></td>
                    <td style={{ fontSize: 12, color: 'var(--gray-500)' }}>{new Date(t.createdAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</td>
                  </tr>
                ))}
                {txns.length === 0 && (
                  <tr><td colSpan={9}><div className="empty-state"><div className="empty-state-icon">💳</div><div>No transactions found</div></div></td></tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        {pagination.pages > 1 && (
          <div className="pagination">
            <span style={{ fontSize: 13, color: 'var(--gray-500)' }}>Page {filters.page} of {pagination.pages}</span>
            {Array.from({ length: Math.min(pagination.pages, 5) }, (_, i) => i + 1).map(p => (
              <button key={p} className={`page-btn ${p === filters.page ? 'active' : ''}`}
                onClick={() => setFilters({ ...filters, page: p })}>{p}</button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}