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
    type: DataTypes.JSONB,
    defaultValue: [],
    get() {
      const rawValue = this.getDataValue('wishList');
      return rawValue ? JSON.parse(rawValue) : [];
    },
    set(value) {
      this.setDataValue('wishList', JSON.stringify(value));
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