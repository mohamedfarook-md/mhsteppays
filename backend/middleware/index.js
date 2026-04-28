// middleware/index.js - All Middleware

const jwt = require('jsonwebtoken');
const { Admin, Agent } = require('../models');

// ── JWT Auth Middleware ───────────────────────
const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Access token required' });
    }
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Token expired', code: 'TOKEN_EXPIRED' });
    }
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }
};

// ── Admin Middleware ──────────────────────────
const adminMiddleware = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Admin access required' });
  }
  next();
};

// ── Agent Middleware ──────────────────────────
const agentMiddleware = (req, res, next) => {
  if (!req.user || (req.user.role !== 'agent' && req.user.role !== 'admin')) {
    return res.status(403).json({ success: false, message: 'Agent access required' });
  }
  next();
};

// ── Global Error Handler ─────────────────────
const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  
  // Log error to DB (async, don't await)
  const { Log } = require('../models');
  Log.create({
    type: 'error',
    level: 'error',
    message,
    data: { stack: err.stack, path: req.path },
    ip: req.ip
  }).catch(() => {});

  res.status(statusCode).json({
    success: false,
    message: process.env.NODE_ENV === 'production' ? message : message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
};

// ── Rate Limiter Configs ──────────────────────
const rateLimit = require('express-rate-limit');

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, message: 'Too many auth attempts. Try again in 15 minutes.' }
});

module.exports = { authMiddleware, adminMiddleware, agentMiddleware, errorHandler, authLimiter };