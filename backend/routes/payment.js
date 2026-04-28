// routes/payment.js - PayU Integration (LIVE)
const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { body, validationResult } = require('express-validator');
const { Merchant, Transaction, Commission, Log } = require('../models');

// ── PayU Hash Generator ───────────────────────
const generatePayUHash = (params) => {
  const key = process.env.PAYU_KEY;
  const salt = process.env.PAYU_SALT;
  const hashString = `${key}|${params.txnid}|${params.amount}|${params.productinfo}|${params.firstname}|${params.email}|||||||||||${salt}`;
  return crypto.createHash('sha512').update(hashString).digest('hex');
};

// ── PayU Response Hash Verifier ───────────────
const verifyPayUHash = (params) => {
  const salt = process.env.PAYU_SALT;
  const key = process.env.PAYU_KEY;
  const hashString = `${salt}|${params.status}|||||||||||${params.email}|${params.firstname}|${params.productinfo}|${params.amount}|${params.txnid}|${key}`;
  const generatedHash = crypto.createHash('sha512').update(hashString).digest('hex');
  return generatedHash === params.hash;
};

// GET /pay/:merchantId - Public payment page (handled by publicPay.js)

// POST /api/payment/initiate - Create PayU payment request
router.post('/initiate', [
  body('merchantId').trim().notEmpty(),
  body('amount').isFloat({ min: 1, max: 500000 }),
  body('customerName').trim().isLength({ min: 2, max: 50 }),
  body('customerEmail').isEmail().normalizeEmail(),
  body('customerPhone').matches(/^[6-9]\d{9}$/),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

  try {
    const { merchantId, amount, customerName, customerEmail, customerPhone } = req.body;

    const merchant = await Merchant.findOne({ merchantId, status: 'approved' });
    if (!merchant) return res.status(404).json({ success: false, message: 'Merchant not found or inactive' });

    // Generate unique transaction ID
    const txnId = `STEPPAYS_${merchant.merchantId}_${Date.now()}_${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

    // Create pending transaction
    const transaction = await Transaction.create({
      txnId,
      merchantId: merchant._id,
      agentId: merchant.agentId,
      amount: parseFloat(amount),
      payerName: customerName,
      payerEmail: customerEmail,
      payerPhone: customerPhone,
      status: 'pending',
      commissionRate: merchant.commissionRate || 2
    });

    const payuParams = {
      key: process.env.PAYU_KEY,
      txnid: txnId,
      amount: parseFloat(amount).toFixed(2),
      productinfo: `Payment to ${merchant.name}`,
      firstname: customerName,
      email: customerEmail,
      phone: customerPhone,
      surl: `${process.env.BASE_URL}/api/payment/success`,
      furl: `${process.env.BASE_URL}/api/payment/failure`,
      udf1: merchant.merchantId,
      udf2: transaction._id.toString(),
    };
    payuParams.hash = generatePayUHash(payuParams);

    await Log.create({ type: 'payment', level: 'info', message: `Payment initiated: ${txnId}`, data: { txnId, amount, merchantId } });

    res.json({
      success: true,
      data: {
        payuUrl: process.env.PAYU_BASE_URL,
        params: payuParams,
        txnId
      }
    });
  } catch (err) {
    await Log.create({ type: 'payment', level: 'error', message: `Payment initiation error: ${err.message}`, ip: req.ip });
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/payment/success - PayU success callback
router.post('/success', async (req, res) => {
  try {
    const payuResponse = req.body;
    
    // CRITICAL: Verify hash - NEVER trust frontend
    const isValid = verifyPayUHash(payuResponse);
    if (!isValid) {
      await Log.create({ type: 'payment', level: 'error', message: 'Hash verification FAILED', data: payuResponse });
      return res.redirect(`${process.env.FRONTEND_URL}/payment/failure?reason=verification_failed`);
    }

    const transaction = await Transaction.findOne({ txnId: payuResponse.txnid });
    if (!transaction) return res.redirect(`${process.env.FRONTEND_URL}/payment/failure?reason=not_found`);

    // Update transaction
    transaction.status = 'success';
    transaction.payuTxnId = payuResponse.mihpayid;
    transaction.paymentMode = payuResponse.mode;
    transaction.payuResponse = payuResponse;
    transaction.hashVerified = true;
    transaction.updatedAt = new Date();
    
    // Calculate commission
    const commissionAmount = (transaction.amount * transaction.commissionRate) / 100;
    transaction.commissionAmount = commissionAmount;
    await transaction.save();

    // Update merchant stats
    await Merchant.findByIdAndUpdate(transaction.merchantId, {
      $inc: { totalTxn: 1, totalAmount: transaction.amount }
    });

    // Create commission record
    await Commission.create({
      agentId: transaction.agentId,
      merchantId: transaction.merchantId,
      transactionId: transaction._id,
      txnAmount: transaction.amount,
      commissionRate: transaction.commissionRate,
      commissionEarned: commissionAmount
    });

    await Log.create({ type: 'payment', level: 'info', message: `Payment SUCCESS: ${payuResponse.txnid}`, data: { txnId: payuResponse.txnid, amount: transaction.amount } });

    res.redirect(`${process.env.FRONTEND_URL}/payment/success?txn=${payuResponse.txnid}&amount=${transaction.amount}`);
  } catch (err) {
    await Log.create({ type: 'payment', level: 'error', message: `Success handler error: ${err.message}` });
    res.redirect(`${process.env.FRONTEND_URL}/payment/failure?reason=server_error`);
  }
});

// POST /api/payment/failure - PayU failure callback
router.post('/failure', async (req, res) => {
  try {
    const payuResponse = req.body;
    
    await Transaction.findOneAndUpdate(
      { txnId: payuResponse.txnid },
      { status: 'failed', payuResponse, updatedAt: new Date() }
    );

    await Log.create({ type: 'payment', level: 'warn', message: `Payment FAILED: ${payuResponse.txnid}`, data: payuResponse });

    res.redirect(`${process.env.FRONTEND_URL}/payment/failure?txn=${payuResponse.txnid}&reason=${payuResponse.error_Message || 'Payment failed'}`);
  } catch (err) {
    res.redirect(`${process.env.FRONTEND_URL}/payment/failure`);
  }
});

// POST /api/payment/webhook - Backup PayU webhook
router.post('/webhook', async (req, res) => {
  try {
    const payuResponse = req.body;
    const isValid = verifyPayUHash(payuResponse);
    
    if (!isValid) {
      await Log.create({ type: 'payment', level: 'error', message: 'Webhook hash verification FAILED' });
      return res.status(400).json({ success: false });
    }

    if (payuResponse.status === 'success') {
      const txn = await Transaction.findOne({ txnId: payuResponse.txnid });
      if (txn && txn.status !== 'success') {
        txn.status = 'success';
        txn.payuTxnId = payuResponse.mihpayid;
        txn.payuResponse = payuResponse;
        txn.hashVerified = true;
        const commissionAmount = (txn.amount * txn.commissionRate) / 100;
        txn.commissionAmount = commissionAmount;
        await txn.save();

        await Merchant.findByIdAndUpdate(txn.merchantId, { $inc: { totalTxn: 1, totalAmount: txn.amount } });
        await Commission.create({ agentId: txn.agentId, merchantId: txn.merchantId, transactionId: txn._id, txnAmount: txn.amount, commissionRate: txn.commissionRate, commissionEarned: commissionAmount });
      }
    }

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false });
  }
});

module.exports = router;