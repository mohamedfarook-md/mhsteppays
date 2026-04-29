// src/pages/payment/PaymentPage.jsx
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { merchantsAPI, paymentAPI } from '../../utils/api';

export default function PaymentPage() {
  const { merchantId } = useParams();
  const [merchant, setMerchant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [form, setForm] = useState({ amount: '', customerName: '', customerEmail: '', customerPhone: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

 useEffect(() => {
  fetch(`https://apisteppays.in/api/merchants/public/${merchantId}`)
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        setMerchant(data.data);
      } else {
        setNotFound(true);
      }
    })
    .catch(() => setNotFound(true))
    .finally(() => setLoading(false));
}, [merchantId]);

  const handlePay = async (e) => {
    e.preventDefault();
    setError('');
    if (parseFloat(form.amount) < 1) return setError('Minimum amount is ₹1');
    if (parseFloat(form.amount) > 500000) return setError('Maximum amount is ₹5,00,000');
    setSubmitting(true);
    try {
      const { data } = await paymentAPI.initiate({ merchantId, ...form });
      // Create and submit PayU form
      const payuForm = document.createElement('form');
      payuForm.method = 'POST';
      payuForm.action = data.data.payuUrl;
      Object.entries(data.data.params).forEach(([key, value]) => {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = key;
        input.value = value;
        payuForm.appendChild(input);
      });
      document.body.appendChild(payuForm);
      payuForm.submit();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to initiate payment. Please try again.');
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div className="payment-wrapper">
      <div style={{ textAlign: 'center' }}>
        <div className="loading-spinner" />
        <p style={{ color: 'var(--gray-500)', marginTop: 12 }}>Loading payment page...</p>
      </div>
    </div>
  );

  if (notFound) return (
    <div className="payment-wrapper">
      <div className="payment-card">
        <div style={{ padding: 60, textAlign: 'center' }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>❌</div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--gray-900)', marginBottom: 8 }}>Payment Link Invalid</h2>
          <p style={{ color: 'var(--gray-500)', fontSize: 14 }}>This merchant is not active or the link is invalid.</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="payment-wrapper">
      <div className="payment-card">
        <div className="payment-header">
          <div style={{ fontSize: 36, marginBottom: 10 }}>🏪</div>
          <div className="payment-merchant-name">{merchant.name}</div>
          <div className="payment-tagline">Fast • Secure • Instant UPI Payment</div>
        </div>

        <div className="payment-body">
          <form onSubmit={handlePay}>
            <div className="form-group">
              <label className="form-label">Amount (₹)</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 18, fontWeight: 600, color: 'var(--gray-500)' }}>₹</span>
                <input
                  className="form-input"
                  type="number"
                  placeholder="0.00"
                  min="1"
                  max="500000"
                  step="0.01"
                  required
                  value={form.amount}
                  onChange={e => setForm({ ...form, amount: e.target.value })}
                  style={{ paddingLeft: 32, fontSize: 24, fontWeight: 700, textAlign: 'right', fontFamily: 'var(--font-mono)' }}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Your Name</label>
              <input className="form-input" type="text" placeholder="Full name" required value={form.customerName}
                onChange={e => setForm({ ...form, customerName: e.target.value })} minLength={2} maxLength={50} />
            </div>

            <div className="form-group">
              <label className="form-label">Email</label>
              <input className="form-input" type="email" placeholder="your@email.com" required value={form.customerEmail}
                onChange={e => setForm({ ...form, customerEmail: e.target.value })} />
            </div>

            <div className="form-group">
              <label className="form-label">Mobile Number</label>
              <input className="form-input" type="tel" placeholder="10-digit mobile" required value={form.customerPhone}
                onChange={e => setForm({ ...form, customerPhone: e.target.value })} pattern="[6-9]\d{9}" />
            </div>

            {error && (
              <div style={{ padding: '10px 14px', background: 'var(--danger-bg)', border: '1px solid #fca5a5', borderRadius: 'var(--radius-md)', color: 'var(--danger)', fontSize: 13, marginBottom: 14 }}>
                ⚠️ {error}
              </div>
            )}

            <button type="submit" className="pay-button" disabled={submitting}>
              {submitting ? (
                <>⏳ Redirecting to PayU...</>
              ) : (
                <>💳 PAY NOW {form.amount ? `₹${parseFloat(form.amount).toLocaleString('en-IN')}` : ''}</>
              )}
            </button>
          </form>

          <div className="payment-security">
            <span>🔒</span>
            <span>Secured by PayU · 256-bit SSL Encryption</span>
          </div>

          <div style={{ marginTop: 20, padding: '12px 16px', background: 'var(--gray-50)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 20 }}>🏦</span>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--gray-700)' }}>UPI · Cards · NetBanking</div>
              <div style={{ fontSize: 11, color: 'var(--gray-400)' }}>All payment methods accepted</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}