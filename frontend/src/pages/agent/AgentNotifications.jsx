// src/pages/agent/AgentNotifications.jsx
import { useState, useEffect } from 'react';
import { notificationsAPI } from '../../utils/api';
import { useToast } from '../../context/ToastContext';

export default function AgentNotifications() {
  const [notifs, setNotifs] = useState([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  const load = async () => {
    setLoading(true);
    try { const { data } = await notificationsAPI.getAll(); setNotifs(data.data || []); }
    catch {} finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleRead = async (id) => {
    await notificationsAPI.markRead(id);
    setNotifs(n => n.map(x => x._id === id ? { ...x, read: true } : x));
  };

  const typeIcon = { merchant_approved: '✅', merchant_rejected: '❌', commission: '💰', system: '🔔', payment: '💳' };
  const unread = notifs.filter(n => !n.read).length;

  return (
    <div>
      <div className="page-header">
        <div><h1 className="page-title">Notifications</h1><p className="page-subtitle">{unread} unread</p></div>
      </div>
      <div className="card">
        {loading ? <div className="loading-spinner" /> : (
          notifs.length === 0 ? (
            <div className="empty-state" style={{ padding: 60 }}><div className="empty-state-icon">🔔</div><div>No notifications yet</div></div>
          ) : notifs.map(n => (
            <div key={n._id} onClick={() => !n.read && handleRead(n._id)}
              style={{
                padding: '16px 24px', borderBottom: '1px solid var(--gray-100)',
                background: n.read ? 'transparent' : 'var(--primary-light)',
                cursor: n.read ? 'default' : 'pointer', display: 'flex', gap: 14, alignItems: 'flex-start',
                transition: 'background 0.15s'
              }}>
              <span style={{ fontSize: 22 }}>{typeIcon[n.type] || '🔔'}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: n.read ? 500 : 700, color: 'var(--gray-900)', fontSize: 14 }}>{n.title}</div>
                <div style={{ fontSize: 13, color: 'var(--gray-600)', marginTop: 2 }}>{n.message}</div>
                <div style={{ fontSize: 11, color: 'var(--gray-400)', marginTop: 6 }}>{new Date(n.createdAt).toLocaleString('en-IN')}</div>
              </div>
              {!n.read && <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--primary)', marginTop: 6, flexShrink: 0 }} />}
            </div>
          ))
        )}
      </div>
    </div>
  );
}