// src/pages/auth/RegisterPage.jsx
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useToast } from '../../context/ToastContext';
import { authAPI } from '../../utils/api';

export default function RegisterPage() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', isStudent: false });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null);
  const toast = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password.length < 8) return toast.show('Password must be at least 8 characters', 'error');
    setLoading(true);
    try {
      const { data } = await authAPI.agentRegister(form);
      setSuccess(data.agentId);
      toast.show('Registration successful!', 'success');
    } catch (err) {
      toast.show(err.response?.data?.message || 'Registration failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (success) return (
    <div className="auth-wrapper">
      <div className="auth-card" style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>🎉</div>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--gray-900)', marginBottom: 8 }}>Registration Successful!</h2>
        <p style={{ color: 'var(--gray-500)', marginBottom: 20, fontSize: 14 }}>
          Your Agent ID is:
        </p>
        <div style={{ background: 'var(--primary-light)', color: 'var(--primary)', padding: '16px 24px', borderRadius: 'var(--radius-lg)', fontFamily: 'var(--font-mono)', fontSize: 22, fontWeight: 700, letterSpacing: 2, marginBottom: 20 }}>
          {success}
        </div>
        <p style={{ fontSize: 13, color: 'var(--gray-500)', marginBottom: 28 }}>
          Check your email for login credentials. Your account is pending admin approval.
        </p>
        <button className="btn btn-primary btn-full" onClick={() => navigate('/login')}>
          Go to Login →
        </button>
      </div>
    </div>
  );

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <div className="auth-logo">
          <div className="auth-logo-icon">SP</div>
          <h1 className="auth-title">Join StepPays</h1>
          <p className="auth-subtitle">Register as a Field Agent</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input className="form-input" type="text" placeholder="Your full name" value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })} required minLength={2} />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Email</label>
              <input className="form-input" type="email" placeholder="you@example.com" value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })} required />
            </div>
            <div className="form-group">
              <label className="form-label">Phone</label>
              <input className="form-input" type="tel" placeholder="10-digit mobile" value={form.phone}
                onChange={e => setForm({ ...form, phone: e.target.value })} required pattern="[6-9]\d{9}" />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input className="form-input" type="password" placeholder="Min 8 chars, 1 uppercase, 1 number" value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })} required minLength={8} />
            <p className="form-hint">Must include uppercase letter and number</p>
          </div>
          <div className="form-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
              <input type="checkbox" checked={form.isStudent} onChange={e => setForm({ ...form, isStudent: e.target.checked })}
                style={{ width: 16, height: 16, accentColor: 'var(--primary)' }} />
              <span style={{ fontSize: 14, color: 'var(--gray-700)', fontWeight: 500 }}>I am a student</span>
            </label>
          </div>

          <button className="btn btn-primary btn-full btn-lg" type="submit" disabled={loading}>
            {loading ? '⏳ Registering...' : 'Create Agent Account'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 14, color: 'var(--gray-500)' }}>
          Already registered?{' '}
          <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 600 }}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}