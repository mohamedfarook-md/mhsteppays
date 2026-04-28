// routes/upload.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { authMiddleware } = require('../middleware/index');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dest = file.fieldname === 'idCard'
      ? path.join(__dirname, '../uploads/id-cards')
      : path.join(__dirname, '../uploads/logos');
    cb(null, dest);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${req.user.id}_${Date.now()}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowed = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
  if (allowed.includes(file.mimetype)) cb(null, true);
  else cb(new Error('Only images and PDFs are allowed'), false);
};

const upload = multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } });

router.post('/id-card', authMiddleware, upload.single('idCard'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });
    const { Agent } = require('../models');
    await Agent.findByIdAndUpdate(req.user.id, { idCard: `/uploads/id-cards/${req.file.filename}` });
    res.json({ success: true, message: 'ID card uploaded', path: `/uploads/id-cards/${req.file.filename}` });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.post('/logo', authMiddleware, upload.single('logo'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });
    res.json({ success: true, message: 'Logo uploaded', path: `/uploads/logos/${req.file.filename}` });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;