// routes/notifications.js
const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/index');
const { Notification } = require('../models');

router.get('/', authMiddleware, async (req, res) => {
  try {
    const notifs = await Notification.find({ recipientId: req.user.id }).sort({ createdAt: -1 }).limit(50);
    res.json({ success: true, data: notifs });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.post('/', authMiddleware, async (req, res) => {
  try {
    const notif = await Notification.create({ ...req.body });
    res.status(201).json({ success: true, data: notif });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.patch('/read/:id', authMiddleware, async (req, res) => {
  try {
    await Notification.findByIdAndUpdate(req.params.id, { read: true });
    res.json({ success: true, message: 'Marked as read' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;