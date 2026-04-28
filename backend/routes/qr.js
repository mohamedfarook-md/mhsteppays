// routes/qr.js
const express = require('express');
const router = express.Router();
const QRCode = require('qrcode');
const { createCanvas, loadImage } = require('canvas');
const path = require('path');
const fs = require('fs');
const { authMiddleware, adminMiddleware } = require('../middleware/index');
const { Merchant } = require('../models');

// POST /api/qr/generate/:merchantId
router.post('/generate/:merchantId', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const merchant = await Merchant.findOne({ merchantId: req.params.merchantId });
    if (!merchant) return res.status(404).json({ success: false, message: 'Merchant not found' });
    if (merchant.status !== 'approved') return res.status(400).json({ success: false, message: 'Merchant must be approved first' });

    const paymentUrl = `${process.env.BASE_URL}/pay/${merchant.merchantId}`;
    const qrDir = path.join(__dirname, '../uploads/qr');
    if (!fs.existsSync(qrDir)) fs.mkdirSync(qrDir, { recursive: true });

    const qrPath = path.join(qrDir, `${merchant.merchantId}.png`);
    await QRCode.toFile(qrPath, paymentUrl, {
      errorCorrectionLevel: 'H',
      type: 'png',
      width: 400,
      margin: 2,
      color: { dark: '#1a1a2e', light: '#ffffff' }
    });

    merchant.qrUrl = `/uploads/qr/${merchant.merchantId}.png`;
    merchant.paymentUrl = paymentUrl;
    await merchant.save();

    res.json({ success: true, message: 'QR generated', data: { qrUrl: merchant.qrUrl, paymentUrl } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/qr/:merchantId
router.get('/:merchantId', async (req, res) => {
  try {
    const merchant = await Merchant.findOne({ merchantId: req.params.merchantId });
    if (!merchant || merchant.status !== 'approved') return res.status(404).json({ success: false, message: 'QR not available' });
    res.json({ success: true, data: { qrUrl: merchant.qrUrl, paymentUrl: merchant.paymentUrl, name: merchant.name } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/qr/download/:merchantId
router.get('/download/:merchantId', authMiddleware, async (req, res) => {
  try {
    const merchant = await Merchant.findOne({ merchantId: req.params.merchantId });
    if (!merchant || !merchant.qrUrl) return res.status(404).json({ success: false, message: 'QR not found' });
    const qrPath = path.join(__dirname, '..', merchant.qrUrl);
    res.download(qrPath, `${merchant.name}-QR.png`);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/qr/sticker/:merchantId - Generate branded sticker
router.get('/sticker/:merchantId', authMiddleware, async (req, res) => {
  try {
    const merchant = await Merchant.findOne({ merchantId: req.params.merchantId });
    if (!merchant || merchant.status !== 'approved') return res.status(404).json({ success: false, message: 'Merchant not found' });

    const paymentUrl = merchant.paymentUrl || `${process.env.BASE_URL}/pay/${merchant.merchantId}`;
    
    // Generate QR as data URL
    const qrDataUrl = await QRCode.toDataURL(paymentUrl, {
      errorCorrectionLevel: 'H', width: 300, margin: 1,
      color: { dark: '#1a1a2e', light: '#ffffff' }
    });

    // Return sticker data for frontend rendering
    res.json({
      success: true,
      data: {
        merchantName: merchant.name,
        paymentUrl,
        qrDataUrl,
        brandName: 'MHSTEPPAYS'
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/qr/regenerate/:merchantId
router.post('/regenerate/:merchantId', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const merchant = await Merchant.findOne({ merchantId: req.params.merchantId });
    if (!merchant || merchant.status !== 'approved') return res.status(400).json({ success: false, message: 'Cannot regenerate QR' });

    // Delete old QR
    if (merchant.qrUrl) {
      const oldPath = path.join(__dirname, '..', merchant.qrUrl);
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }

    const paymentUrl = merchant.paymentUrl;
    const qrDir = path.join(__dirname, '../uploads/qr');
    const qrPath = path.join(qrDir, `${merchant.merchantId}.png`);
    await QRCode.toFile(qrPath, paymentUrl, { errorCorrectionLevel: 'H', width: 400, margin: 2 });

    merchant.qrUrl = `/uploads/qr/${merchant.merchantId}.png`;
    await merchant.save();

    res.json({ success: true, message: 'QR regenerated', data: { qrUrl: merchant.qrUrl } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;