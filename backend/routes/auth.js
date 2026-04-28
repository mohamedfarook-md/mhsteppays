// routes/auth.js
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { Admin, Agent, Log } = require('../models');
const { authLimiter } = require('../middleware/index');
const { generateAgentId, sendWelcomeEmail } = require('../utils/helpers');

const generateTokens = (payload) => {
  const accessToken = jwt.sign(payload, process.env.JWT_ACCESS_SECRET, {
    expiresIn: process.env.JWT_ACCESS_EXPIRES || '15m'
  });
  const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES || '7d'
  });
  return { accessToken, refreshToken };
};

// POST /api/auth/admin/login
router.post('/admin/login', authLimiter, [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 })
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

  try {
    const { email, password } = req.body;
    const admin = await Admin.findOne({ email }).select('+password');
    if (!admin || !(await admin.comparePassword(password))) {
      await Log.create({ type: 'auth', level: 'warn', message: `Failed admin login: ${email}`, ip: req.ip });
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const payload = { id: admin._id, role: 'admin', email: admin.email };
    const { accessToken, refreshToken } = generateTokens(payload);

    admin.refreshTokens.push(refreshToken);
    admin.lastLogin = new Date();
    await admin.save();

    await Log.create({ type: 'auth', level: 'info', message: `Admin login: ${email}`, ip: req.ip });

    res.json({
      success: true,
      message: 'Login successful',
      accessToken,
      refreshToken,
      user: { id: admin._id, name: admin.name, email: admin.email, role: 'admin' }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/auth/agent/login
router.post('/agent/login', authLimiter, [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 })
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

  try {
    const { email, password } = req.body;
    const agent = await Agent.findOne({ email }).select('+password');
    if (!agent || !(await agent.comparePassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    if (agent.status === 'pending') {
      return res.status(403).json({ success: false, message: 'Account pending approval' });
    }
    if (agent.status === 'inactive') {
      return res.status(403).json({ success: false, message: 'Account deactivated' });
    }

    const payload = { id: agent._id, role: 'agent', email: agent.email, agentId: agent.agentId };
    const { accessToken, refreshToken } = generateTokens(payload);

    // agent.refreshTokens.push(refreshToken);
    // agent.loginTime = new Date();
    // agent.activityLogs.push({ action: 'login', ip: req.ip });
    agent.refreshTokens.push(refreshToken);
    agent.loginTime = new Date();
    agent.logoutTime = null; // reset
    agent.isOnline = true;   // 🔥 MAIN LINE
    agent.activityLogs.push({ action: 'login', ip: req.ip });
    await agent.save();

    res.json({
      success: true,
      message: 'Login successful',
      accessToken,
      refreshToken,
      user: { id: agent._id, name: agent.name, email: agent.email, agentId: agent.agentId, role: 'agent' }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/auth/agent/register
router.post('/agent/register', authLimiter, [
  body('name').trim().isLength({ min: 2, max: 50 }),
  body('email').isEmail().normalizeEmail(),
  body('phone').matches(/^[6-9]\d{9}$/),
  body('password').isLength({ min: 8 }).matches(/^(?=.*[A-Z])(?=.*[0-9])/)
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

  try {
    const { name, email, phone, password, isStudent } = req.body;
    const exists = await Agent.findOne({ email });
    if (exists) return res.status(409).json({ success: false, message: 'Email already registered' });

    const agentId = await generateAgentId();
    const agent = await Agent.create({ name, email, phone, password, isStudent: isStudent || false, agentId, status: 'pending' });

    await sendWelcomeEmail(email, name, agentId, password);

    res.status(201).json({
      success: true,
      message: 'Registration successful. Your account is pending approval.',
      agentId
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/auth/refresh-token
router.post('/refresh-token', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(401).json({ success: false, message: 'Refresh token required' });

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    
    let user;
    if (decoded.role === 'admin') {
      user = await Admin.findById(decoded.id);
    } else {
      user = await Agent.findById(decoded.id);
    }

    if (!user || !user.refreshTokens.includes(refreshToken)) {
      return res.status(401).json({ success: false, message: 'Invalid refresh token' });
    }

    const payload = { id: user._id, role: decoded.role, email: user.email };
    if (decoded.role === 'agent') payload.agentId = user.agentId;
    
    const { accessToken, refreshToken: newRefreshToken } = generateTokens(payload);
    
    user.refreshTokens = user.refreshTokens.filter(t => t !== refreshToken);
    user.refreshTokens.push(newRefreshToken);
    await user.save();

    res.json({ success: true, accessToken, refreshToken: newRefreshToken });
  } catch (err) {
    res.status(401).json({ success: false, message: 'Invalid or expired refresh token' });
  }
});

// POST /api/auth/logout
router.post('/logout', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (refreshToken) {
      const decoded = jwt.decode(refreshToken);
      if (decoded) {
        const Model = decoded.role === 'admin' ? Admin : Agent;
        const user = await Model.findById(decoded.id);
        if (user) {
          user.refreshTokens = user.refreshTokens.filter(t => t !== refreshToken);
          // if (decoded.role === 'agent') {
          //   user.logoutTime = new Date();
          //   user.activityLogs.push({ action: 'logout' });
          // }
          if (decoded.role === 'agent') {
            user.logoutTime = new Date();
            user.isOnline = false; // 🔥 MAIN LINE
            user.activityLogs.push({ action: 'logout' });
          }
          await user.save();
        }
      }
    }
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (err) {
    res.json({ success: true, message: 'Logged out' });
  }
});

module.exports = router;