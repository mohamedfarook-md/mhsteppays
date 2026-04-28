// routes/settings.js
const express = require('express');
const router = express.Router();
const { authMiddleware, adminMiddleware } = require('../middleware/index');
const { Settings } = require('../models');

router.get('/', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) settings = await Settings.create({});
    res.json({ success: true, data: settings });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.put('/', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const allowed = ['commissionRate', 'baseUrl', 'brandName', 'brandLogo', 'supportEmail', 'supportPhone', 'maintenanceMode'];
    const update = {};
    allowed.forEach(k => { if (req.body[k] !== undefined) update[k] = req.body[k]; });
    update.updatedAt = new Date();
    
    let settings = await Settings.findOneAndUpdate({}, update, { new: true, upsert: true });
    res.json({ success: true, data: settings, message: 'Settings updated' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;