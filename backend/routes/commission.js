// routes/commission.js
const express = require('express');
const router = express.Router();
const { authMiddleware, adminMiddleware } = require('../middleware/index');
const { Commission } = require('../models');
const mongoose = require('mongoose');

router.get('/', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const commissions = await Commission.find().populate('agentId', 'name agentId').populate('merchantId', 'name').sort({ createdAt: -1 }).limit(100);
    res.json({ success: true, data: commissions });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.get('/agent/:agentId', authMiddleware, async (req, res) => {
  try {
    const agentId = req.params.agentId;
    const commissions = await Commission.aggregate([
      { $match: { agentId: new mongoose.Types.ObjectId(agentId) } },
      { $group: { _id: null, totalEarned: { $sum: '$commissionEarned' }, totalTxn: { $sum: 1 } } }
    ]);
    const detail = await Commission.find({ agentId }).populate('merchantId', 'name').sort({ createdAt: -1 }).limit(50);
    res.json({ success: true, data: { summary: commissions[0] || { totalEarned: 0, totalTxn: 0 }, transactions: detail } });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.get('/merchant/:merchantId', authMiddleware, async (req, res) => {
  try {
    const data = await Commission.find({ merchantId: req.params.merchantId }).populate('agentId', 'name').sort({ createdAt: -1 });
    res.json({ success: true, data });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.post('/calculate', authMiddleware, adminMiddleware, async (req, res) => {
  res.json({ success: true, message: 'Commission calculation triggered (runs automatically on payment success)' });
});

module.exports = router;