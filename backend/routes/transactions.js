// routes/transactions.js
const express = require('express');
const router = express.Router();
const { authMiddleware, adminMiddleware } = require('../middleware/index');
const { Transaction } = require('../models');
const { createObjectCsvWriter } = require('csv-writer');
const path = require('path');
const fs = require('fs');

router.get('/', authMiddleware, async (req, res) => {
  try {
    const { status, merchantId, startDate, endDate, page = 1, limit = 20 } = req.query;
    const query = {};
    if (req.user.role === 'agent') query.agentId = req.user.id;
    if (status) query.status = status;
    if (merchantId) query.merchantId = merchantId;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }
    const total = await Transaction.countDocuments(query);
    const txns = await Transaction.find(query).populate('merchantId', 'name').populate('agentId', 'name agentId').sort({ createdAt: -1 }).skip((page-1)*limit).limit(parseInt(limit));
    res.json({ success: true, data: txns, pagination: { total, page: parseInt(page), pages: Math.ceil(total/limit) } });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.get('/summary', authMiddleware, async (req, res) => {
  try {
    const query = req.user.role === 'agent' ? { agentId: req.user.id } : {};
    const stats = await Transaction.aggregate([
      { $match: query },
      { $group: { _id: '$status', count: { $sum: 1 }, amount: { $sum: '$amount' } } }
    ]);
    res.json({ success: true, data: stats });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.get('/export', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const txns = await Transaction.find({ status: 'success' }).populate('merchantId', 'name').populate('agentId', 'name').lean();
    const exportDir = path.join(__dirname, '../uploads/exports');
    if (!fs.existsSync(exportDir)) fs.mkdirSync(exportDir, { recursive: true });
    const filePath = path.join(exportDir, `transactions_${Date.now()}.csv`);
    const writer = createObjectCsvWriter({
      path: filePath,
      header: [
        { id: 'txnId', title: 'Transaction ID' }, { id: 'amount', title: 'Amount' },
        { id: 'status', title: 'Status' }, { id: 'merchantName', title: 'Merchant' },
        { id: 'agentName', title: 'Agent' }, { id: 'paymentMode', title: 'Mode' },
        { id: 'createdAt', title: 'Date' }
      ]
    });
    await writer.writeRecords(txns.map(t => ({
      txnId: t.txnId, amount: t.amount, status: t.status,
      merchantName: t.merchantId?.name || '', agentName: t.agentId?.name || '',
      paymentMode: t.paymentMode || '', createdAt: new Date(t.createdAt).toLocaleString()
    })));
    res.download(filePath, 'transactions.csv');
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const txn = await Transaction.findById(req.params.id).populate('merchantId', 'name upiId').populate('agentId', 'name agentId');
    if (!txn) return res.status(404).json({ success: false, message: 'Transaction not found' });
    res.json({ success: true, data: txn });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;