// routes/merchants.js
const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { authMiddleware, adminMiddleware, agentMiddleware } = require('../middleware/index');
const { Merchant, Notification } = require('../models');
const { generateMerchantId } = require('../utils/helpers');

// POST /api/merchants - Agent creates merchant
router.post('/', authMiddleware, agentMiddleware, [
  body('name').trim().isLength({ min: 2 }),
  body('upiId').trim().isLength({ min: 5 }),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

  try {
    const { name, upiId, phone, email, address } = req.body;
    const agentId = req.user.id;
    const merchantId = await generateMerchantId();

    const merchant = await Merchant.create({ name, upiId, phone, email, address, agentId, merchantId, status: 'pending' });

    // Notify admin
    await Notification.create({
      recipientId: agentId,
      recipientType: 'admin',
      title: 'New Merchant Pending',
      message: `Agent submitted merchant: ${name}`,
      type: 'system',
      data: { merchantId: merchant._id }
    });

    res.status(201).json({ success: true, message: 'Merchant submitted for approval', data: merchant });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/merchants
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { status, search, page = 1, limit = 20 } = req.query;
    const query = {};

    if (req.user.role === 'agent') query.agentId = req.user.id;
    if (status) query.status = status;
    if (search) query.name = { $regex: search, $options: 'i' };

    const total = await Merchant.countDocuments(query);
    const merchants = await Merchant.find(query)
      .populate('agentId', 'name agentId email')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json({ success: true, data: merchants, pagination: { total, page: parseInt(page), pages: Math.ceil(total / limit) } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/merchants/:id
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const merchant = await Merchant.findById(req.params.id).populate('agentId', 'name agentId email phone');
    if (!merchant) return res.status(404).json({ success: false, message: 'Merchant not found' });
    res.json({ success: true, data: merchant });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/merchants/:id
router.put('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const merchant = await Merchant.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!merchant) return res.status(404).json({ success: false, message: 'Merchant not found' });
    res.json({ success: true, data: merchant });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/merchants/:id
router.delete('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    await Merchant.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Merchant deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PATCH /api/merchants/:id/approve
router.patch('/:id/approve', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const merchant = await Merchant.findById(req.params.id);
    if (!merchant) return res.status(404).json({ success: false, message: 'Merchant not found' });

    merchant.status = 'approved';
    merchant.approvedAt = new Date();
    merchant.paymentUrl = `${process.env.BASE_URL}/pay/${merchant.merchantId}`;
    await merchant.save();

    // Notify agent
    await Notification.create({
      recipientId: merchant.agentId,
      recipientType: 'agent',
      title: 'Merchant Approved! 🎉',
      message: `Your merchant "${merchant.name}" has been approved. QR code is ready.`,
      type: 'merchant_approved',
      data: { merchantId: merchant._id }
    });

    res.json({ success: true, message: 'Merchant approved', data: merchant });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PATCH /api/merchants/:id/reject
router.patch('/:id/reject', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { reason } = req.body;
    const merchant = await Merchant.findByIdAndUpdate(req.params.id,
      { status: 'rejected', rejectionReason: reason },
      { new: true }
    );
    if (!merchant) return res.status(404).json({ success: false, message: 'Merchant not found' });

    await Notification.create({
      recipientId: merchant.agentId,
      recipientType: 'agent',
      title: 'Merchant Rejected',
      message: `Merchant "${merchant.name}" was rejected. Reason: ${reason || 'Not specified'}`,
      type: 'merchant_rejected',
      data: { merchantId: merchant._id }
    });

    res.json({ success: true, message: 'Merchant rejected', data: merchant });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;