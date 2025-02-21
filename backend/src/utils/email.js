const emailService = require('../services/emailService');

// Read frontend URL from environment variables with a fallback
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://xbuddy.smartxdev.com';

const sendAssignmentEmail = async ({ to, giverName, receiverName, groupName, participantId }) => {
  const participantUrl = `${FRONTEND_URL}/participant/${participantId}`;

  const subject = `نتیجه قرعه‌کشی گروه ${groupName}`;
  const html = `
    <div dir="rtl" style="font-family: Arial, sans-serif;">
      <h1>🎉 نتیجه قرعه‌کشی X Buddy</h1>
      <p>سلام ${giverName} عزیز،</p>
      <p>قرعه‌کشی گروه ${groupName} انجام شد و شما باید برای این شخص هدیه تهیه کنید:</p>
      <h2 style="color: #00B100; text-align: center; padding: 20px;">${receiverName}</h2>
      <p>برای مشاهده جزئیات و لیست هدایای مورد علاقه دوست خود، روی لینک زیر کلیک کنید:</p>
      <p style="text-align: center;">
        <a href="${participantUrl}" 
           style="background-color: #00B100; 
                  color: white; 
                  padding: 10px 20px; 
                  text-decoration: none; 
                  border-radius: 5px;">
          مشاهده صفحه X Buddy
        </a>
      </p>
      <p>این لینک را برای دسترسی‌های بعدی ذخیره کنید: <br>
      <a href="${participantUrl}">${participantUrl}</a></p>
      <p>لطفاً این موضوع را محرمانه نگه دارید و به غافلگیری دوستتان کمک کنید!</p>
      <p>با آرزوی لحظات خوش</p>
    </div>
  `;

  try {
    await emailService.sendEmail({ to, subject, html });
  } catch (error) {
    console.error('Error sending assignment email:', error);
    console.log(`Failed to send email to ${to}, but continuing...`);
  }
};

module.exports = {
  sendAssignmentEmail
}; 