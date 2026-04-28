// utils/helpers.js
const nodemailer = require('nodemailer');
const { Agent, Merchant } = require('../models');

const generateAgentId = async () => {
  const prefix = 'AGT';
  let id;
  do {
    id = `${prefix}${Math.floor(100000 + Math.random() * 900000)}`;
  } while (await Agent.findOne({ agentId: id }));
  return id;
};

const generateMerchantId = async () => {
  const prefix = 'MRC';
  let id;
  do {
    id = `${prefix}${Math.floor(100000 + Math.random() * 900000)}`;
  } while (await Merchant.findOne({ merchantId: id }));
  return id;
};

const createTransporter = () => nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT),
  secure: false,
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
});

const sendWelcomeEmail = async (email, name, agentId, password) => {
  try {
    const transporter = createTransporter();
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: email,
      subject: `Welcome to StepPays - Your Agent Credentials`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#f9f9f9;padding:20px;border-radius:12px;">
          <div style="background:linear-gradient(135deg,#667eea,#764ba2);padding:30px;border-radius:8px;text-align:center;color:white;">
            <h1 style="margin:0;">🎉 Welcome to StepPays!</h1>
          </div>
          <div style="background:white;padding:30px;border-radius:8px;margin-top:16px;">
            <h2>Hello ${name},</h2>
            <p>Your agent account has been created. Here are your credentials:</p>
            <div style="background:#f0f4ff;padding:20px;border-radius:8px;border-left:4px solid #667eea;">
              <p><strong>Agent ID:</strong> ${agentId}</p>
              <p><strong>Email:</strong> ${email}</p>
              <p><strong>Temporary Password:</strong> ${password}</p>
            </div>
            <p style="color:#e53e3e;font-size:12px;">⚠️ Please change your password after first login.</p>
            <p>Your account is pending admin approval. You'll be notified once activated.</p>
          </div>
        </div>
      `
    });
  } catch (err) {
    console.error('Email error:', err.message);
  }
};

module.exports = { generateAgentId, generateMerchantId, sendWelcomeEmail };