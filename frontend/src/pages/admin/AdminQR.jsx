// src/pages/admin/AdminQR.jsx
import { useState, useEffect, useRef } from 'react';
import { merchantsAPI, qrAPI } from '../../utils/api';
import { useToast } from '../../context/ToastContext';
import html2canvas from 'html2canvas';
export default function AdminQR() {
  const [merchants, setMerchants] = useState([]);
  const [selected, setSelected] = useState(null);
  const [stickerData, setStickerData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const stickerRef = useRef(null);
  const toast = useToast();

  useEffect(() => {
    merchantsAPI.getAll({ status: 'approved', limit: 100 })
      .then(({ data }) => setMerchants(data.data))
      .catch(() => toast.show('Failed to load merchants', 'error'));
  }, []);

  const handleSelect = async (merchant) => {
    setSelected(merchant);
    setStickerData(null);
    if (merchant.qrUrl) {
      try {
        const { data } = await qrAPI.getSticker(merchant.merchantId);
        setStickerData(data.data);
      } catch {}
    }
  };

  const handleGenerate = async () => {
    if (!selected) return;
    setGenerating(true);
    try {
      await qrAPI.generate(selected.merchantId);
      const { data } = await qrAPI.getSticker(selected.merchantId);
      setStickerData(data.data);
      toast.show('QR Code generated!', 'success');
      // Refresh merchants
      const { data: ms } = await merchantsAPI.getAll({ status: 'approved', limit: 100 });
      setMerchants(ms.data);
      setSelected(ms.data.find(m => m._id === selected._id));
    } catch (err) {
      toast.show(err.response?.data?.message || 'Failed to generate QR', 'error');
    } finally { setGenerating(false); }
  };

  const handleRegenerate = async () => {
    if (!selected) return;
    setGenerating(true);
    try {
      await qrAPI.regenerate(selected.merchantId);
      const { data } = await qrAPI.getSticker(selected.merchantId);
      setStickerData(data.data);
      toast.show('QR regenerated!', 'success');
    } catch (err) {
      toast.show('Failed', 'error');
    } finally { setGenerating(false); }
  };

  const handleCopyLink = () => {
    if (selected?.paymentUrl) {
      navigator.clipboard.writeText(selected.paymentUrl);
      toast.show('Payment link copied!', 'success');
    }
  };

  // const handleDownloadQR = () => {
  //   if (!selected) return;
  //   window.open(qrAPI.downloadUrl(selected.merchantId), '_blank');
  // };

const handleDownloadQR = async () => {
  if (!selected) return;

  try {
    const res = await qrAPI.download(selected.merchantId);

    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${selected.name}-qr.png`);
    document.body.appendChild(link);
    link.click();

    window.URL.revokeObjectURL(url);

    toast.show('QR downloaded!', 'success');
  } catch (err) {
    toast.show('Download failed', 'error');
  }
};

  // const handleDownloadSticker = () => {
  //   if (!stickerRef.current) return;
  //   import('html2canvas').then(() => {
  //     toast.show('Use browser print to save sticker as image', 'warning');
  //   }).catch(() => {
  //     toast.show('Right-click the sticker and save as image', 'warning');
  //   });
  // };

const handleDownloadSticker = async () => {
  if (!stickerRef.current) return;

  try {
    const canvas = await html2canvas(stickerRef.current, {
      scale: 2, // better quality
      useCORS: true
    });

    const image = canvas.toDataURL('image/png');

    const link = document.createElement('a');
    link.href = image;
    link.download = `${selected.name}-sticker.png`;

    document.body.appendChild(link);
    link.click();

    toast.show('Sticker downloaded!', 'success');
  } catch (err) {
    toast.show('Download failed', 'error');
  }
};


  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">QR Management</h1>
          <p className="page-subtitle">Generate and manage payment QR codes</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Merchant List */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Approved Merchants</span>
            <span className="badge badge-success">{merchants.length} total</span>
          </div>
          <div style={{ maxHeight: 500, overflowY: 'auto' }}>
            {merchants.length === 0 ? (
              <div className="empty-state"><div className="empty-state-icon">🏪</div><div className="empty-state-text">No approved merchants</div></div>
            ) : merchants.map(m => (
              <div key={m._id}
                onClick={() => handleSelect(m)}
                style={{
                  padding: '14px 20px', cursor: 'pointer', borderBottom: '1px solid var(--gray-100)',
                  background: selected?._id === m._id ? 'var(--primary-light)' : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  transition: 'background 0.15s'
                }}>
                <div>
                  <div style={{ fontWeight: 600, color: selected?._id === m._id ? 'var(--primary)' : 'var(--gray-900)', fontSize: 14 }}>{m.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--gray-400)', marginTop: 2 }}>{m.merchantId}</div>
                </div>
                <span className={`badge ${m.qrUrl ? 'badge-success' : 'badge-warning'}`}>
                  {m.qrUrl ? '✓ QR Ready' : 'No QR'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* QR Preview & Actions */}
        <div>
          {selected ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Actions Card */}
              <div className="card">
                <div className="card-header">
                  <span className="card-title">{selected.name}</span>
                </div>
                <div className="card-body">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {!selected.qrUrl ? (
                      <button className="btn btn-primary btn-full" onClick={handleGenerate} disabled={generating}>
                        {generating ? '⏳ Generating...' : '🔳 Generate QR Code'}
                      </button>
                    ) : (
                      <>
                        <button className="btn btn-primary btn-full" onClick={handleDownloadQR}>
                          ⬇ Download QR PNG
                        </button>
                        <button className="btn btn-secondary btn-full" onClick={handleDownloadSticker}>
                          🖼 Download Sticker
                        </button>
                        <button className="btn btn-ghost btn-full" onClick={handleCopyLink}>
                          🔗 Copy Payment Link
                        </button>
                        <button className="btn btn-ghost btn-full" onClick={handleRegenerate} disabled={generating}
                          style={{ color: 'var(--warning)', borderColor: 'var(--warning)' }}>
                          {generating ? '⏳...' : '🔄 Regenerate QR'}
                        </button>
                      </>
                    )}
                  </div>
                  {selected.paymentUrl && (
                    <div style={{ marginTop: 14, padding: 12, background: 'var(--gray-50)', borderRadius: 'var(--radius-md)', border: '1px solid var(--gray-200)' }}>
                      <div style={{ fontSize: 11, color: 'var(--gray-500)', marginBottom: 4 }}>Payment URL</div>
                      <div style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--primary)', wordBreak: 'break-all' }}>
                        {selected.paymentUrl}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Sticker Preview */}
              {stickerData && (
  <div className="card">
    <div className="card-header">
      <span className="card-title">QR Sticker Preview</span>
    </div>

    <div
      className="card-body"
      style={{ display: 'flex', justifyContent: 'center' }}
    >
      <div ref={stickerRef} className="sticker-container">
        <div className="sticker-inner">

          <div className="scan-text">SCAN & PAY</div>

          <div className="brand">
            MH<span>STEPPAYS</span>
          </div>

          <div className="subtitle">
            Fast • Secure • Instant UPI Payment
          </div>

          <div className="qr-box">
            <img src={stickerData.qrDataUrl} alt="QR Code" />
          </div>

          <div className="merchant-name">
            {stickerData.merchantName}
          </div>

          <div className="powered">
            🔒 Powered by PAYU
          </div>

          <div className="footer">
            Open any UPI app and scan to pay instantly
          </div>

        </div>
      </div>
    </div>
  </div>
)}
            </div>
          ) : (
            <div className="card" style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div className="empty-state">
                <div className="empty-state-icon">🔳</div>
                <div className="empty-state-text">Select a merchant to manage QR</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}