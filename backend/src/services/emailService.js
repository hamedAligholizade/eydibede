const nodemailer = require('nodemailer');
const Queue = require('better-queue');

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      },
      tls: {
        rejectUnauthorized: false // During development, if using self-signed certificates
      }
    });

    // Since we're using our own SMTP server, we can be more generous with the rate limit
    // Let's set it to 100 emails per minute (still being conservative)
    const RATE_LIMIT_MS = 600; // 0.6 seconds between emails

    this.emailQueue = new Queue(async (task, cb) => {
      try {
        await this.transporter.sendMail(task);
        cb(null);
      } catch (error) {
        console.error('Email sending error:', error);
        cb(error);
      }
    }, {
      concurrent: 2, // Allow 2 concurrent email sends
      afterProcessDelay: RATE_LIMIT_MS
    });
  }

  async sendEmail(options) {
    return new Promise((resolve, reject) => {
      this.emailQueue.push({
        from: `"عیدی بده" <${process.env.SMTP_USER}>`,
        ...options
      }, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  async sendParticipantViewAccessEmail(organizer, group) {
    const subject = `دسترسی ویژه برای گروه ${group.name}`;
    const html = `
      <div dir="rtl" style="font-family: Tahoma, Arial; line-height: 1.6;">
        <h2>سلام ${organizer.name}!</h2>
        <p>امیدواریم که از استفاده از عیدی بده لذت می‌برید.</p>
        <p>آیا می‌خواهید بدانید چه کسانی در گروه ${group.name} شرکت کرده‌اند؟</p>
        <p>با خرید اشتراک دسترسی به لیست شرکت‌کنندگان، می‌توانید:</p>
        <ul>
          <li>مشاهده لیست کامل شرکت‌کنندگان</li>
          <li>مدیریت بهتر گروه</li>
          <li>اطمینان از حضور همه دوستان</li>
        </ul>
        <p>
          <a href="${process.env.FRONTEND_URL}/groups/${group.id}/upgrade?tier=PARTICIPANTS_VIEW" 
             style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
            خرید دسترسی به لیست شرکت‌کنندگان
          </a>
        </p>
        <p>قیمت: فقط ۲۹,۰۰۰ تومان</p>
      </div>
    `;

    await this.sendEmail({
      to: organizer.email,
      subject,
      html
    });
  }

  async sendFullAccessEmail(organizer, group) {
    const subject = `دسترسی کامل برای گروه ${group.name}`;
    const html = `
      <div dir="rtl" style="font-family: Tahoma, Arial; line-height: 1.6;">
        <h2>سلام ${organizer.name}!</h2>
        <p>ممنون که به عیدی بده اعتماد کردید.</p>
        <p>می‌خواهید تجربه کامل‌تری از گروه ${group.name} داشته باشید؟</p>
        <p>با خرید اشتراک دسترسی کامل، علاوه بر مشاهده لیست شرکت‌کنندگان می‌توانید:</p>
        <ul>
          <li>مشاهده لیست آرزوهای همه شرکت‌کنندگان</li>
          <li>خواندن پیام‌های محرمانه</li>
          <li>مدیریت حرفه‌ای گروه</li>
        </ul>
        <p>
          <a href="${process.env.FRONTEND_URL}/groups/${group.id}/upgrade?tier=FULL_ACCESS" 
             style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
            ارتقا به دسترسی کامل
          </a>
        </p>
        <p>قیمت: فقط ۴۹,۰۰۰ تومان</p>
      </div>
    `;

    await this.sendEmail({
      to: organizer.email,
      subject,
      html
    });
  }
}

module.exports = new EmailService(); 