const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Payment = sequelize.define('Payment', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  groupId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  currency: {
    type: DataTypes.STRING,
    defaultValue: 'IRR'
  },
  accessTier: {
    type: DataTypes.ENUM('PARTICIPANTS_VIEW', 'FULL_ACCESS'),
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('pending', 'completed', 'failed'),
    defaultValue: 'pending'
  },
  zarinpalAuthority: {
    type: DataTypes.STRING,
    allowNull: true
  },
  zarinpalRefId: {
    type: DataTypes.STRING,
    allowNull: true
  },
  paymentDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  features: {
    type: DataTypes.JSONB,
    defaultValue: {
      participantView: false,
      messageView: false,
      wishlistView: false
    },
    get() {
      const rawValue = this.getDataValue('features');
      return rawValue ? JSON.parse(rawValue) : {
        participantView: false,
        messageView: false,
        wishlistView: false
      };
    },
    set(value) {
      this.setDataValue('features', JSON.stringify(value));
    }
  },
  description: {
    type: DataTypes.STRING,
    allowNull: true
  },
  fullAccessEmailSent: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
});

// Hook to set features based on accessTier
Payment.beforeCreate(async (payment) => {
  if (payment.accessTier === 'PARTICIPANTS_VIEW') {
    payment.features = {
      participantView: true,
      messageView: false,
      wishlistView: false
    };
  } else if (payment.accessTier === 'FULL_ACCESS') {
    payment.features = {
      participantView: true,
      messageView: true,
      wishlistView: true
    };
  }
});

// Define associations
Payment.associate = (models) => {
  Payment.belongsTo(models.Group, {
    foreignKey: 'groupId',
    as: 'Group'
  });
  Payment.belongsTo(models.User, {
    foreignKey: 'userId',
    as: 'User'
  });
};

module.exports = Payment; 