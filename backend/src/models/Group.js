const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Group = sequelize.define('Group', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT
  },
  ownerId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  drawDate: {
    type: DataTypes.DATE
  },
  budget: {
    type: DataTypes.DECIMAL(10, 2)
  },
  currency: {
    type: DataTypes.STRING,
    defaultValue: 'TOMAN'
  },
  status: {
    type: DataTypes.ENUM('pending', 'drawn', 'completed'),
    defaultValue: 'pending'
  },
  paymentStatus: {
    type: DataTypes.ENUM('unpaid', 'pending', 'paid'),
    defaultValue: 'unpaid'
  },
  accessCode: {
    type: DataTypes.STRING,
    allowNull: true
  },
  participantViewAccess: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  messageViewAccess: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  wishlistViewAccess: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  paymentAmount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  promotionalEmailSent: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
});

// Define associations
Group.associate = (models) => {
  Group.belongsTo(models.User, {
    foreignKey: 'ownerId',
    as: 'owner'
  });
};

module.exports = Group; 