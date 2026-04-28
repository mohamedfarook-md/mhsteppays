// routes/admin.js
const express = require('express');
const router = express.Router();
const { authMiddleware, adminMiddleware } = require('../middleware/index');
const { Admin, Agent, Merchant, Transaction, Commission, Log } = require('../models');

router.use(authMiddleware, adminMiddleware);

// GET /api/admin/dashboard
router.get('/dashboard', async (req, res) => {
  try {
    const today = new Date(); today.setHours(0,0,0,0);

    const [
      totalMerchants, totalAgents,
      totalTxn, todayTxn,
      totalRevenue, todayRevenue,
      recentTxns, dailyRevenue
    ] = await Promise.all([
      Merchant.countDocuments({ status: 'approved' }),
      Agent.countDocuments({ status: 'active' }),
      Transaction.countDocuments({ status: 'success' }),
      Transaction.countDocuments({ status: 'success', createdAt: { $gte: today } }),
      Transaction.aggregate([{ $match: { status: 'success' } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
      Transaction.aggregate([{ $match: { status: 'success', createdAt: { $gte: today } } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
      Transaction.find({ status: 'success' }).sort({ createdAt: -1 }).limit(10).populate('merchantId', 'name').populate('agentId', 'name'),
      Transaction.aggregate([
        { $match: { status: 'success', createdAt: { $gte: new Date(Date.now() - 30*24*60*60*1000) } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, revenue: { $sum: '$amount' }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } }
      ])
    ]);

    res.json({
      success: true,
      data: {
        stats: {
          totalMerchants,
          totalAgents,
          totalTxn,
          todayTxn,
          totalRevenue: totalRevenue[0]?.total || 0,
          todayRevenue: todayRevenue[0]?.total || 0
        },
        recentTransactions: recentTxns,
        dailyRevenue
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;