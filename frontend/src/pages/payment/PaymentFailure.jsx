// src/pages/payment/PaymentFailure.jsx
import { useSearchParams } from 'react-router-dom';

export default function PaymentFailure() {
  const [params] = useSearchParams();
  const reason = params.get('reason');
  const txn = params.get('txn');

  return (
    <div className="payment-wrapper">
      <div className="payment-card">
        <div style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)', padding: '36px 32px', textAlign: 'center', color: 'white' }}>
          <div style={{ fontSize: 64, marginBottom: 8 }}>❌</div>
          <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 4 }}>Payment Failed</h1>
          <p style={{ fontSize: 14, opacity: 0.85 }}>Something went wrong with your payment</p>
        </div>
        <div style={{ padding: 32 }}>
          <div style={{ background: 'var(--danger-bg)', borderRadius: 'var(--radius-md)', padding: 16, marginBottom: 20 }}>
            <div style={{ fontSize: 12, color: 'var(--danger)', fontWeight: 600, marginBottom: 4 }}>Reason</div>
            <div style={{ fontSize: 14, color: 'var(--gray-800)' }}>
              {reason === 'verification_failed' ? 'Payment verification failed. Please contact support.' :
               reason === 'not_found' ? 'Transaction not found.' :
               reason === 'server_error' ? 'Server error. Please try again.' :
               reason || 'Payment was declined or cancelled.'}
            </div>
          </div>

          {txn && (
            <div style={{ marginBottom: 20, padding: 14, background: 'var(--gray-50)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ fontSize: 11, color: 'var(--gray-500)', marginBottom: 4 }}>Reference ID</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, wordBreak: 'break-all' }}>{txn}</div>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <p style={{ fontSize: 13, color: 'var(--gray-600)', textAlign: 'center' }}>
              No money has been deducted. If you were charged, the amount will be refunded within 5-7 business days.
            </p>
            <button onClick={() => window.history.back()} className="btn btn-primary btn-full">
              ← Try Again
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}