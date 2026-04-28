// routes/logs.js
const express = require('express');
const router = express.Router();
const { authMiddleware, adminMiddleware } = require('../middleware/index');
const { Log } = require('../models');

router.use(authMiddleware, adminMiddleware);

router.get('/', async (req, res) => {
  try {
    const { type, level, page = 1, limit = 50 } = req.query;
    const query = {};
    if (type) query.type = type;
    if (level) query.level = level;
    const total = await Log.countDocuments(query);
    const logs = await Log.find(query).sort({ createdAt: -1 }).skip((page-1)*limit).limit(parseInt(limit));
    res.json({ success: true, data: logs, pagination: { total } });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.get('/payments', async (req, res) => {
  try {
    const logs = await Log.find({ type: 'payment' }).sort({ createdAt: -1 }).limit(100);
    res.json({ success: true, data: logs });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.get('/errors', async (req, res) => {
  try {
    const logs = await Log.find({ level: 'error' }).sort({ createdAt: -1 }).limit(100);
    res.json({ success: true, data: logs });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;