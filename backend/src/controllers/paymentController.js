const Payment = require('../models/Payment');
const Group = require('../models/Group');
const User = require('../models/User');
const zarinpalService = require('../services/zarinpalService');

const TIER_PRICES = {
  PARTICIPANTS_VIEW: 29000, // 29,000 Toman
  FULL_ACCESS: 49000 // 49,000 Toman
};

exports.initiatePayment = async (req, res) => {
  try {
    const { groupId, accessTier } = req.body;
    const userId = req.user.id;

    // Validate group exists and user has permission
    const group = await Group.findOne({ where: { id: groupId } });
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    // Check if user already has access
    const existingPayment = await Payment.findOne({
      where: {
        groupId,
        userId,
        status: 'completed',
        accessTier
      }
    });

    if (existingPayment) {
      return res.status(400).json({ message: 'You already have this access tier' });
    }

    const amount = TIER_PRICES[accessTier];
    if (!amount) {
      return res.status(400).json({ message: 'Invalid access tier' });
    }

    const user = await User.findByPk(userId);
    const description = `عیدی بده - ${accessTier === 'PARTICIPANTS_VIEW' ? 'دسترسی به لیست شرکت‌کنندگان' : 'دسترسی کامل'} برای گروه ${group.name}`;

    // Create pending payment record
    const payment = await Payment.create({
      groupId,
      userId,
      amount,
      accessTier,
      status: 'pending',
      description
    });

    // Initialize Zarinpal payment
    const callbackUrl = `${process.env.APP_URL}/api/payments/verify/${payment.id}`;
    const zarinpalResponse = await zarinpalService.requestPayment({
      amount,
      callbackUrl,
      description,
      email: user.email,
      mobile: user.phoneNumber
    });

    if (!zarinpalResponse.success) {
      await payment.update({ status: 'failed' });
      return res.status(400).json({ message: zarinpalResponse.error });
    }

    // Update payment with Zarinpal authority
    await payment.update({ zarinpalAuthority: zarinpalResponse.authority });

    res.json({
      paymentId: payment.id,
      gatewayUrl: zarinpalResponse.gatewayUrl
    });
  } catch (error) {
    console.error('Payment initiation error:', error);
    res.status(500).json({ message: 'Error initiating payment' });
  }
};

exports.verifyPayment = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const { Authority, Status } = req.query;

    const payment = await Payment.findByPk(paymentId);
    if (!payment || payment.status !== 'pending') {
      return res.status(404).json({ message: 'Invalid payment' });
    }

    if (Status !== 'OK') {
      await payment.update({ status: 'failed' });
      return res.redirect(`${process.env.FRONTEND_URL}/payment/failed`);
    }

    // Verify payment with Zarinpal
    const verificationResult = await zarinpalService.verifyPayment({
      amount: payment.amount,
      authority: Authority
    });

    if (!verificationResult.success) {
      await payment.update({ status: 'failed' });
      return res.redirect(`${process.env.FRONTEND_URL}/payment/failed`);
    }

    // Update payment status and group access
    await payment.update({
      status: 'completed',
      zarinpalRefId: verificationResult.refId,
      paymentDate: new Date()
    });

    // Update group access based on payment tier
    const group = await Group.findByPk(payment.groupId);
    if (payment.accessTier === 'PARTICIPANTS_VIEW') {
      await group.update({ participantViewAccess: true });
    } else if (payment.accessTier === 'FULL_ACCESS') {
      await group.update({
        participantViewAccess: true,
        messageViewAccess: true,
        wishlistViewAccess: true
      });
    }

    res.redirect(`${process.env.FRONTEND_URL}/payment/success`);
  } catch (error) {
    console.error('Payment verification error:', error);
    res.redirect(`${process.env.FRONTEND_URL}/payment/error`);
  }
};

exports.getPaymentStatus = async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user.id;

    const payments = await Payment.findAll({
      where: {
        groupId,
        userId,
        status: 'completed'
      }
    });

    const access = {
      participantView: false,
      messageView: false,
      wishlistView: false
    };

    payments.forEach(payment => {
      const features = payment.features;
      access.participantView = access.participantView || features.participantView;
      access.messageView = access.messageView || features.messageView;
      access.wishlistView = access.wishlistView || features.wishlistView;
    });

    res.json(access);
  } catch (error) {
    console.error('Get payment status error:', error);
    res.status(500).json({ message: 'Error getting payment status' });
  }
}; 