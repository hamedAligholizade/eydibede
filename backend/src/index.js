const express = require('express');
const cors = require('cors');
const { sequelize } = require('./config/database');
const adminRoutes = require('./routes/adminRoutes');
const groupRoutes = require('./routes/groupRoutes');
const participantRoutes = require('./routes/participantRoutes');
require('./services/promotionService'); // This will initialize the promotion service

const app = express();
const port = process.env.PORT || 4000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/admin', adminRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/participants', participantRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Database connection and model associations
async function initializeDatabase() {
  try {
    // Import models
    const Admin = require('./models/Admin');
    const Group = require('./models/Group');
    const Participant = require('./models/Participant');
    const Message = require('./models/Message');

    // Define associations
    Admin.hasMany(Group, { foreignKey: 'adminId' });
    Group.belongsTo(Admin, { foreignKey: 'adminId' });
    
    Group.hasMany(Participant, { foreignKey: 'groupId' });
    Participant.belongsTo(Group, { foreignKey: 'groupId' });
    
    // Secret Santa assignment association
    Participant.belongsTo(Participant, { 
      as: 'secretSantaFor',  // Changed from 'assignedTo'
      foreignKey: 'assignedToId' 
    });
    
    // Message associations with different aliases
    Message.belongsTo(Participant, { 
      as: 'sender',
      foreignKey: 'fromParticipantId'
    });
    Message.belongsTo(Participant, { 
      as: 'recipient',  // Changed from 'receiver'
      foreignKey: 'toParticipantId'
    });
    Message.belongsTo(Group, { foreignKey: 'groupId' });

    // Sync database
    await sequelize.sync();
    console.log('Database synchronized successfully');
  } catch (error) {
    console.error('Unable to initialize database:', error);
    process.exit(1);
  }
}

// Initialize database and start server
initializeDatabase().then(() => {
  app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
}); 