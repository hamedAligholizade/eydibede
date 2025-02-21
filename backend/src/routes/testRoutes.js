const express = require('express');
const router = express.Router();
const emailService = require('../services/emailService');

router.post('/send-test-email', async (req, res) => {
  try {
    const testHtml = `
      <div dir="rtl" style="font-family: Tahoma, Arial; line-height: 1.6;">
        <h2>تست ایمیل عیدی بده</h2>
        <p>این یک ایمیل تست است.</p>
        <p>اگر این ایمیل را دریافت کرده‌اید، سیستم ایمیل به درستی کار می‌کند.</p>
        <p>زمان ارسال: ${new Date().toLocaleString('fa-IR')}</p>
      </div>
    `;

    await emailService.sendEmail({
      to: req.body.email,
      subject: 'تست ایمیل عیدی بده',
      html: testHtml
    });

    res.json({ success: true, message: 'Test email sent successfully' });
  } catch (error) {
    console.error('Test email error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to send test email',
      error: error.message 
    });
  }
});

module.exports = router; 