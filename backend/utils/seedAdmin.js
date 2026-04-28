// utils/seedAdmin.js
const { Admin, Settings } = require('../models');

module.exports = async () => {
  try {
    const adminExists = await Admin.findOne({ email: process.env.ADMIN_EMAIL });
    if (!adminExists) {
      await Admin.create({
        name: 'Super Admin',
        email: process.env.ADMIN_EMAIL,
        password: process.env.ADMIN_PASSWORD
      });
      console.log('✅ Admin seeded:', process.env.ADMIN_EMAIL);
    }

    const settingsExist = await Settings.findOne();
    if (!settingsExist) {
      await Settings.create({ commissionRate: parseFloat(process.env.DEFAULT_COMMISSION) || 2 });
      console.log('✅ Default settings created');
    }
  } catch (err) {
    console.error('Seeder error:', err.message);
  }
};