const { Op } = require('sequelize');
const Group = require('../models/Group');
const User = require('../models/User');
const Payment = require('../models/Payment');
const emailService = require('./emailService');

class PromotionService {
  constructor() {
    this.schedulePromotionalEmails();
  }

  async schedulePromotionalEmails() {
    // Run every 15 minutes
    setInterval(async () => {
      try {
        await this.checkAndSendParticipantViewEmails();
        await this.checkAndSendFullAccessEmails();
      } catch (error) {
        console.error('Error in promotional emails:', error);
      }
    }, 15 * 60 * 1000);
  }

  async checkAndSendParticipantViewEmails() {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    
    // Find groups created about 1 hour ago that haven't received promotional emails
    const groups = await Group.findAll({
      where: {
        createdAt: {
          [Op.between]: [
            new Date(oneHourAgo - 5 * 60 * 1000), // 5 minutes buffer before
            new Date(oneHourAgo + 5 * 60 * 1000)  // 5 minutes buffer after
          ]
        },
        participantViewAccess: false,
        promotionalEmailSent: false
      },
      include: [{
        model: User,
        as: 'owner'
      }]
    });

    for (const group of groups) {
      try {
        await emailService.sendParticipantViewAccessEmail(group.owner, group);
        await group.update({ promotionalEmailSent: true });
      } catch (error) {
        console.error(`Error sending participant view email for group ${group.id}:`, error);
      }
    }
  }

  async checkAndSendFullAccessEmails() {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    // Find completed participant view payments from about 1 day ago
    const payments = await Payment.findAll({
      where: {
        status: 'completed',
        accessTier: 'PARTICIPANTS_VIEW',
        paymentDate: {
          [Op.between]: [
            new Date(oneDayAgo - 15 * 60 * 1000),  // 15 minutes buffer before
            new Date(oneDayAgo + 15 * 60 * 1000)   // 15 minutes buffer after
          ]
        },
        fullAccessEmailSent: false
      },
      include: [{
        model: Group,
        where: {
          wishlistViewAccess: false,
          messageViewAccess: false
        }
      }, {
        model: User
      }]
    });

    for (const payment of payments) {
      try {
        await emailService.sendFullAccessEmail(payment.User, payment.Group);
        await payment.update({ fullAccessEmailSent: true });
      } catch (error) {
        console.error(`Error sending full access email for payment ${payment.id}:`, error);
      }
    }
  }
}

module.exports = new PromotionService(); 