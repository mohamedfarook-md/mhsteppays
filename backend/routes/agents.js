// routes/agents.js
const express = require('express');
const router = express.Router();
const { authMiddleware, adminMiddleware } = require('../middleware/index');
const { Agent, Merchant, Transaction, Commission } = require('../models');

// GET /api/agents
router.get('/', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { status, search, page = 1, limit = 20 } = req.query;
    const query = {};
    if (status) query.status = status;
    if (search) query.$or = [{ name: { $regex: search, $options: 'i' } }, { agentId: { $regex: search, $options: 'i' } }];

    const total = await Agent.countDocuments(query);
    const agents = await Agent.find(query).sort({ createdAt: -1 }).skip((page-1)*limit).limit(parseInt(limit));
    res.json({ success: true, data: agents, pagination: { total, page: parseInt(page), pages: Math.ceil(total/limit) } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/agents/:id
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const agent = await Agent.findById(req.params.id);
    if (!agent) return res.status(404).json({ success: false, message: 'Agent not found' });
    res.json({ success: true, data: agent });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/agents/:id
router.put('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { name, phone, status } = req.body;
    const agent = await Agent.findByIdAndUpdate(req.params.id, { name, phone, status }, { new: true });
    if (!agent) return res.status(404).json({ success: false, message: 'Agent not found' });
    res.json({ success: true, data: agent });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/agents/:id
router.delete('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    await Agent.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Agent deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/agents/:id/performance
router.get('/:id/performance', authMiddleware, async (req, res) => {
  try {
    const agentId = req.params.id;
    const [merchantCount, merchantsByStatus, txnStats] = await Promise.all([
      Merchant.countDocuments({ agentId }),
      Merchant.aggregate([{ $match: { agentId: require('mongoose').Types.ObjectId(agentId) } }, { $group: { _id: '$status', count: { $sum: 1 } } }]),
      Transaction.aggregate([{ $match: { agentId: require('mongoose').Types.ObjectId(agentId), status: 'success' } }, { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }])
    ]);
    res.json({ success: true, data: { merchantCount, merchantsByStatus, transactions: txnStats[0] || { total: 0, count: 0 } } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/agents/:id/earnings
router.get('/:id/earnings', authMiddleware, async (req, res) => {
  try {
    const agentId = req.params.id;
    const today = new Date(); today.setHours(0,0,0,0);
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    const [total, todayEarnings, monthEarnings] = await Promise.all([
      Commission.aggregate([{ $match: { agentId: require('mongoose').Types.ObjectId(agentId) } }, { $group: { _id: null, total: { $sum: '$commissionEarned' } } }]),
      Commission.aggregate([{ $match: { agentId: require('mongoose').Types.ObjectId(agentId), createdAt: { $gte: today } } }, { $group: { _id: null, total: { $sum: '$commissionEarned' } } }]),
      Commission.aggregate([{ $match: { agentId: require('mongoose').Types.ObjectId(agentId), createdAt: { $gte: monthStart } } }, { $group: { _id: null, total: { $sum: '$commissionEarned' } } }])
    ]);

    res.json({ success: true, data: { total: total[0]?.total || 0, today: todayEarnings[0]?.total || 0, month: monthEarnings[0]?.total || 0 } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/agents/:id/activity
router.get('/:id/activity', authMiddleware, async (req, res) => {
  try {
    const agent = await Agent.findById(req.params.id).select('activityLogs loginTime logoutTime');
    if (!agent) return res.status(404).json({ success: false, message: 'Agent not found' });
    res.json({ success: true, data: { activityLogs: agent.activityLogs, loginTime: agent.loginTime, logoutTime: agent.logoutTime } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;