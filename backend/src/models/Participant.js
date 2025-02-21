const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Participant = sequelize.define('Participant', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      isEmail: true
    }
  },
  phoneNumber: {
    type: DataTypes.STRING,
    allowNull: true
  },
  groupId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  assignedToId: {
    type: DataTypes.UUID,
    allowNull: true
  },
  wishList: {
    type: DataTypes.TEXT,
    defaultValue: '[]',
    get() {
      const rawValue = this.getDataValue('wishList');
      try {
        return rawValue ? JSON.parse(rawValue) : [];
      } catch (error) {
        console.error('Error parsing wishList:', error);
        return [];
      }
    },
    set(value) {
      try {
        this.setDataValue('wishList', JSON.stringify(value || []));
      } catch (error) {
        console.error('Error setting wishList:', error);
        this.setDataValue('wishList', '[]');
      }
    }
  },
  secretMessage: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  excludeList: {
    type: DataTypes.ARRAY(DataTypes.UUID),
    defaultValue: []
  },
  accessToken: {
    type: DataTypes.STRING,
    allowNull: true
  },
  lastAccessed: {
    type: DataTypes.DATE,
    allowNull: true
  }
});

// Self-referential association for gift assignments
Participant.belongsTo(Participant, { as: 'assignedTo', foreignKey: 'assignedToId' });

module.exports = Participant; 