const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const { protect, isFirstSetup } = require('../middleware/auth');

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

// Register first admin (only works once)
router.post('/register', isFirstSetup, async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const admin = await Admin.create({
      name,
      email,
      password,
      isFirstAdmin: true
    });

    res.status(201).json({
      id: admin.id,
      name: admin.name,
      email: admin.email,
      token: generateToken(admin.id)
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Admin login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const admin = await Admin.findOne({ where: { email } });

    if (admin && (await admin.matchPassword(password))) {
      res.json({
        id: admin.id,
        name: admin.name,
        email: admin.email,
        token: generateToken(admin.id)
      });
    } else {
      res.status(401).json({ error: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Check if first admin needs to be created
router.get('/check-setup', async (req, res) => {
  try {
    const adminCount = await Admin.count();
    res.json({ needsSetup: adminCount === 0 });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get admin profile
router.get('/profile', protect, async (req, res) => {
  try {
    const admin = await Admin.findByPk(req.admin.id);
    res.json({
      id: admin.id,
      name: admin.name,
      email: admin.email
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Test email configuration
router.post('/test-email', protect, async (req, res) => {
  try {
    const { sendAssignmentEmail } = require('../utils/email');
    
    await sendAssignmentEmail({
      to: req.admin.email,
      giverName: 'Test User',
      receiverName: 'Test Recipient',
      groupName: 'Test Group',
      participantId: '00000000-0000-0000-0000-000000000000'
    });

    res.json({ message: 'Test email sent successfully' });
  } catch (error) {
    console.error('Email test error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router; 