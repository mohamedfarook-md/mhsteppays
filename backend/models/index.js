// models/index.js - All Mongoose Models

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// ── Admin Model ───────────────────────────────
const adminSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true, minlength: 8, select: false },
  role: { type: String, default: 'admin' },
  refreshTokens: [{ type: String }],
  lastLogin: Date,
  createdAt: { type: Date, default: Date.now }
});
adminSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});
adminSchema.methods.comparePassword = async function(candidate) {
  return bcrypt.compare(candidate, this.password);
};
const Admin = mongoose.model('Admin', adminSchema);

// ── Agent Model ───────────────────────────────
const agentSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  phone: { type: String, required: true },
  agentId: { type: String, unique: true },
  password: { type: String, required: true, select: false },
  isStudent: { type: Boolean, default: false },
  idCard: { type: String },
  status: { type: String, enum: ['active', 'inactive', 'pending'], default: 'pending' },
    isOnline: {
    type: Boolean,
    default: false
  },
  refreshTokens: [{ type: String }],
  loginTime: Date,
  logoutTime: Date,
  activityLogs: [{
    action: String,
    timestamp: { type: Date, default: Date.now },
    ip: String
  }],
  createdAt: { type: Date, default: Date.now }
});
agentSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});
agentSchema.methods.comparePassword = async function(candidate) {
  return bcrypt.compare(candidate, this.password);
};
const Agent = mongoose.model('Agent', agentSchema);

// ── Merchant Model ────────────────────────────
const merchantSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  upiId: { type: String, required: true },
  phone: { type: String },
  email: { type: String },
  address: { type: String },
  agentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Agent', required: true },
  merchantId: { type: String, unique: true },
  status: { type: String, enum: ['pending', 'approved', 'rejected', 'inactive'], default: 'pending' },
  qrUrl: String,
  paymentUrl: String,
  logo: String,
  totalTxn: { type: Number, default: 0 },
  totalAmount: { type: Number, default: 0 },
  commissionRate: { type: Number, default: 2 },
  rejectionReason: String,
  approvedAt: Date,
  createdAt: { type: Date, default: Date.now }
});
const Merchant = mongoose.model('Merchant', merchantSchema);

// ── Transaction Model ─────────────────────────
const transactionSchema = new mongoose.Schema({
  txnId: { type: String, unique: true, required: true },
  payuTxnId: String,
  merchantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Merchant', required: true },
  agentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Agent' },
  amount: { type: Number, required: true },
  currency: { type: String, default: 'INR' },
  status: { type: String, enum: ['pending', 'success', 'failed', 'refunded'], default: 'pending' },
  paymentMode: String,
  payerName: String,
  payerEmail: String,
  payerPhone: String,
  payuResponse: { type: mongoose.Schema.Types.Mixed },
  hashVerified: { type: Boolean, default: false },
  commissionAmount: { type: Number, default: 0 },
  commissionRate: { type: Number, default: 2 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: Date
});
const Transaction = mongoose.model('Transaction', transactionSchema);

// ── Commission Model ──────────────────────────
const commissionSchema = new mongoose.Schema({
  agentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Agent', required: true },
  merchantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Merchant', required: true },
  transactionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Transaction' },
  txnAmount: Number,
  commissionRate: Number,
  commissionEarned: Number,
  status: { type: String, enum: ['pending', 'paid'], default: 'pending' },
  createdAt: { type: Date, default: Date.now }
});
const Commission = mongoose.model('Commission', commissionSchema);

// ── Notification Model ────────────────────────
const notificationSchema = new mongoose.Schema({
  recipientId: { type: mongoose.Schema.Types.ObjectId, required: true },
  recipientType: { type: String, enum: ['admin', 'agent'] },
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: { type: String, enum: ['merchant_approved', 'merchant_rejected', 'commission', 'system', 'payment'] },
  read: { type: Boolean, default: false },
  data: mongoose.Schema.Types.Mixed,
  createdAt: { type: Date, default: Date.now }
});
const Notification = mongoose.model('Notification', notificationSchema);

// ── Settings Model ────────────────────────────
const settingsSchema = new mongoose.Schema({
  commissionRate: { type: Number, default: 2 },
  payuKey: { type: String, select: false },
  payuSalt: { type: String, select: false },
  baseUrl: { type: String, default: process.env.BASE_URL },
  brandName: { type: String, default: 'StepPays' },
  brandLogo: String,
  supportEmail: String,
  supportPhone: String,
  maintenanceMode: { type: Boolean, default: false },
  updatedAt: { type: Date, default: Date.now }
});
const Settings = mongoose.model('Settings', settingsSchema);

// ── Log Model ─────────────────────────────────
const logSchema = new mongoose.Schema({
  type: { type: String, enum: ['payment', 'error', 'auth', 'system'] },
  level: { type: String, enum: ['info', 'warn', 'error'], default: 'info' },
  message: String,
  data: mongoose.Schema.Types.Mixed,
  userId: mongoose.Schema.Types.ObjectId,
  userType: String,
  ip: String,
  createdAt: { type: Date, default: Date.now }
});
const Log = mongoose.model('Log', logSchema);

module.exports = { Admin, Agent, Merchant, Transaction, Commission, Notification, Settings, Log };