// src/pages/payment/PaymentSuccess.jsx
import { useSearchParams } from 'react-router-dom';

export default function PaymentSuccess() {
  const [params] = useSearchParams();
  const txn = params.get('txn');
  const amount = params.get('amount');

  return (
    <div className="payment-wrapper">
      <div className="payment-card">
        <div style={{ background: 'linear-gradient(135deg, #10b981, #059669)', padding: '36px 32px', textAlign: 'center', color: 'white' }}>
          <div style={{ fontSize: 64, marginBottom: 8 }}>✅</div>
          <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 4 }}>Payment Successful!</h1>
          <p style={{ fontSize: 14, opacity: 0.85 }}>Your payment has been processed securely</p>
        </div>
        <div style={{ padding: 32 }}>
          {amount && (
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div style={{ fontSize: 13, color: 'var(--gray-500)', marginBottom: 6 }}>Amount Paid</div>
              <div style={{ fontSize: 42, fontWeight: 800, color: 'var(--gray-900)', fontFamily: 'var(--font-mono)', letterSpacing: -2 }}>
                ₹{parseFloat(amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>
            </div>
          )}
          <div style={{ background: 'var(--success-bg)', borderRadius: 'var(--radius-md)', padding: 16, marginBottom: 20 }}>
            <div style={{ fontSize: 12, color: 'var(--success)', fontWeight: 600, marginBottom: 4 }}>Transaction ID</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--gray-800)', wordBreak: 'break-all' }}>{txn || 'N/A'}</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: 'var(--gray-50)', borderRadius: 'var(--radius-md)' }}>
              <span>🔒</span>
              <span style={{ fontSize: 13, color: 'var(--gray-600)' }}>Hash verified by PayU</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: 'var(--gray-50)', borderRadius: 'var(--radius-md)' }}>
              <span>📧</span>
              <span style={{ fontSize: 13, color: 'var(--gray-600)' }}>Confirmation sent to your email</span>
            </div>
          </div>
          <p style={{ textAlign: 'center', marginTop: 24, fontSize: 13, color: 'var(--gray-400)' }}>
            You can safely close this tab.
          </p>
        </div>
      </div>
    </div>
  );
}