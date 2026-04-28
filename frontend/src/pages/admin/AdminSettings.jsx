// src/pages/admin/AdminSettings.jsx
import { useState, useEffect } from 'react';
import { settingsAPI } from '../../utils/api';
import { useToast } from '../../context/ToastContext';

export default function AdminSettings() {
  const [form, setForm] = useState({ commissionRate: 2, baseUrl: '', brandName: 'StepPays', supportEmail: '', supportPhone: '', maintenanceMode: false });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  useEffect(() => {
    settingsAPI.get().then(({ data }) => {
      if (data.data) setForm(f => ({ ...f, ...data.data }));
    }).finally(() => setLoading(false));
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await settingsAPI.update(form);
      toast.show('Settings saved!', 'success');
    } catch { toast.show('Failed to save', 'error'); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="loading-spinner" />;

  const Section = ({ title, children }) => (
    <div className="card" style={{ marginBottom: 20 }}>
      <div className="card-header"><span className="card-title">{title}</span></div>
      <div className="card-body">{children}</div>
    </div>
  );

  return (
    <div>
      <div className="page-header">
        <div><h1 className="page-title">Settings</h1><p className="page-subtitle">Configure system-wide settings</p></div>
      </div>
      <form onSubmit={handleSave}>
        <Section title="💰 Commission Settings">
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Default Commission Rate (%)</label>
              <input className="form-input" type="number" min="0" max="100" step="0.1" value={form.commissionRate}
                onChange={e => setForm({ ...form, commissionRate: parseFloat(e.target.value) })} />
              <p className="form-hint">Applied to all new merchants unless overridden</p>
            </div>
          </div>
        </Section>

        <Section title="🌐 System Configuration">
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Base URL</label>
              <input className="form-input" type="url" placeholder="https://yourdomain.com" value={form.baseUrl}
                onChange={e => setForm({ ...form, baseUrl: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Brand Name</label>
              <input className="form-input" type="text" value={form.brandName}
                onChange={e => setForm({ ...form, brandName: e.target.value })} />
            </div>
          </div>
          <div className="form-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
              <input type="checkbox" checked={form.maintenanceMode} onChange={e => setForm({ ...form, maintenanceMode: e.target.checked })}
                style={{ width: 18, height: 18, accentColor: 'var(--danger)' }} />
              <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--danger)' }}>⚠️ Maintenance Mode (disables all payments)</span>
            </label>
          </div>
        </Section>

        <Section title="📞 Support Info">
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Support Email</label>
              <input className="form-input" type="email" placeholder="support@yourdomain.com" value={form.supportEmail}
                onChange={e => setForm({ ...form, supportEmail: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Support Phone</label>
              <input className="form-input" type="tel" placeholder="Phone number" value={form.supportPhone}
                onChange={e => setForm({ ...form, supportPhone: e.target.value })} />
            </div>
          </div>
        </Section>

        <Section title="🔑 PayU Keys">
          <div style={{ padding: 16, background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 'var(--radius-md)', marginBottom: 16 }}>
            <p style={{ fontSize: 13, color: '#c2410c', fontWeight: 600 }}>
              ⚠️ PayU keys are stored securely in environment variables on the server. Do not paste them here. Configure them in your .env file.
            </p>
          </div>
          <div style={{ padding: 16, background: 'var(--gray-50)', borderRadius: 'var(--radius-md)' }}>
            <p style={{ fontSize: 13, color: 'var(--gray-600)' }}>
              Configure in backend <code style={{ background: 'var(--gray-200)', padding: '2px 6px', borderRadius: 4 }}>.env</code>:
            </p>
            <pre style={{ fontSize: 12, color: 'var(--gray-700)', marginTop: 8, fontFamily: 'var(--font-mono)' }}>
{`PAYU_KEY=your_live_key
PAYU_SALT=your_live_salt
PAYU_BASE_URL=https://secure.payu.in/_payment`}
            </pre>
          </div>
        </Section>

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button className="btn btn-primary btn-lg" type="submit" disabled={saving}>
            {saving ? '⏳ Saving...' : '💾 Save Settings'}
          </button>
        </div>
      </form>
    </div>
  );
}