// routes/publicPay.js - Public payment page
const express = require('express');
const router = express.Router();
const { Merchant } = require('../models');

// GET /pay/:merchantId - QR scan opens this
router.get('/:merchantId', async (req, res) => {
  try {
    const merchant = await Merchant.findOne({ merchantId: req.params.merchantId, status: 'approved' }).select('name merchantId qrUrl');
    if (!merchant) {
      return res.status(404).send(`
        <!DOCTYPE html><html><head><title>Not Found - StepPays</title></head>
        <body style="display:flex;align-items:center;justify-content:center;height:100vh;font-family:sans-serif;background:#f5f5f5;">
          <div style="text-align:center;padding:40px;background:white;border-radius:16px;box-shadow:0 4px 20px rgba(0,0,0,0.1);">
            <h2>❌ Payment Link Invalid</h2>
            <p>This merchant is not active or does not exist.</p>
          </div>
        </body></html>
      `);
    }
    // Redirect to frontend payment page
    res.redirect(`${process.env.FRONTEND_URL}/pay/${merchant.merchantId}`);
  } catch (err) {
    res.status(500).send('Server error');
  }
});

module.exports = router;