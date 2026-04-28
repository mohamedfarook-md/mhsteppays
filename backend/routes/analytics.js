// routes/analytics.js
const express = require('express');
const router = express.Router();
const { authMiddleware, adminMiddleware } = require('../middleware/index');
const { Transaction, Merchant, Agent, Commission } = require('../models');

router.use(authMiddleware, adminMiddleware);

router.get('/overview', async (req, res) => {
  try {
    const [txnStats, merchantCount, agentCount, commissionStats] = await Promise.all([
      Transaction.aggregate([{ $group: { _id: '$status', count: { $sum: 1 }, amount: { $sum: '$amount' } } }]),
      Merchant.countDocuments({ status: 'approved' }),
      Agent.countDocuments({ status: 'active' }),
      Commission.aggregate([{ $group: { _id: null, total: { $sum: '$commissionEarned' } } }])
    ]);
    res.json({ success: true, data: { transactions: txnStats, merchantCount, agentCount, totalCommission: commissionStats[0]?.total || 0 } });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.get('/revenue', async (req, res) => {
  try {
    const { period = '30' } = req.query;
    const days = parseInt(period);
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const revenue = await Transaction.aggregate([
      { $match: { status: 'success', createdAt: { $gte: startDate } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, revenue: { $sum: '$amount' }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);
    res.json({ success: true, data: revenue });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.get('/transactions', async (req, res) => {
  try {
    const byMode = await Transaction.aggregate([
      { $match: { status: 'success' } },
      { $group: { _id: '$paymentMode', count: { $sum: 1 }, amount: { $sum: '$amount' } } }
    ]);
    res.json({ success: true, data: byMode });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.get('/top-merchants', async (req, res) => {
  try {
    const merchants = await Merchant.find({ status: 'approved' }).sort({ totalAmount: -1 }).limit(10).populate('agentId', 'name');
    res.json({ success: true, data: merchants });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.get('/agent-performance', async (req, res) => {
  try {
    const performance = await Commission.aggregate([
      { $group: { _id: '$agentId', totalEarned: { $sum: '$commissionEarned' }, totalTxn: { $sum: 1 } } },
      { $lookup: { from: 'agents', localField: '_id', foreignField: '_id', as: 'agent' } },
      { $unwind: '$agent' },
      { $project: { agentName: '$agent.name', agentId: '$agent.agentId', totalEarned: 1, totalTxn: 1 } },
      { $sort: { totalEarned: -1 } },
      { $limit: 10 }
    ]);
    res.json({ success: true, data: performance });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;