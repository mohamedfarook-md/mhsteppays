// src/pages/auth/LoginPage.jsx
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { authAPI } from '../../utils/api';

export default function LoginPage() {
  const [role, setRole] = useState('admin');
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const { login } = useAuth();
  const toast = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const fn = role === 'admin' ? authAPI.adminLogin : authAPI.agentLogin;
      const { data } = await fn(form);
      login(data.user, data.accessToken, data.refreshToken);
      toast.show(`Welcome back, ${data.user.name}!`, 'success');
    } catch (err) {
      toast.show(err.response?.data?.message || 'Login failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <div className="auth-logo">
          <div className="auth-logo-icon">SP</div>
          <h1 className="auth-title">StepPays</h1>
          <p className="auth-subtitle">Secure Payment Dashboard</p>
        </div>

        <div className="auth-tabs">
          <button className={`auth-tab ${role === 'admin' ? 'active' : ''}`} onClick={() => setRole('admin')}>
            🛡 Admin
          </button>
          <button className={`auth-tab ${role === 'agent' ? 'active' : ''}`} onClick={() => setRole('agent')}>
            👤 Field Agent
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              className="form-input"
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              required
              autoComplete="email"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <div style={{ position: 'relative' }}>
              <input
                className="form-input"
                type={showPass ? 'text' : 'password'}
                placeholder="Enter your password"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                required
                style={{ paddingRight: 44 }}
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: 'var(--gray-400)' }}
              >
                {showPass ? '🙈' : '👁'}
              </button>
            </div>
          </div>

          <button className="btn btn-primary btn-full btn-lg" type="submit" disabled={loading}>
            {loading ? '⏳ Signing in...' : `Sign in as ${role === 'admin' ? 'Admin' : 'Agent'}`}
          </button>
        </form>

        {role === 'agent' && (
          <p style={{ textAlign: 'center', marginTop: 20, fontSize: 14, color: 'var(--gray-500)' }}>
            New agent?{' '}
            <Link to="/register" style={{ color: 'var(--primary)', fontWeight: 600 }}>
              Register here
            </Link>
          </p>
        )}

        <div style={{ marginTop: 28, padding: '16px', background: 'var(--gray-50)', borderRadius: 'var(--radius-md)', display: 'flex', gap: 8, alignItems: 'flex-start' }}>
          <span style={{ fontSize: 16 }}>🔒</span>
          <p style={{ fontSize: 12, color: 'var(--gray-500)', lineHeight: 1.5 }}>
            This is a secure system. All transactions are protected with end-to-end encryption and PayU hash verification.
          </p>
        </div>
      </div>
    </div>
  );
}