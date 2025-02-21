const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  initiatePayment,
  verifyPayment,
  getPaymentStatus
} = require('../controllers/paymentController');

// Protected routes (require authentication)
router.post('/initiate', protect, initiatePayment);
router.get('/status/:groupId', protect, getPaymentStatus);

// Public route (callback from Zarinpal)
router.get('/verify/:paymentId', verifyPayment);

module.exports = router; 