const express = require('express');
const router = express.Router();
const Participant = require('../models/Participant');
const Message = require('../models/Message');
const { protect } = require('../middleware/auth');
const Group = require('../models/Group');
const { DataTypes } = require('sequelize');
const { v4: uuidv4 } = require('uuid');

// Add participant to a group (admin only)
router.post('/', protect, async (req, res) => {
  try {
    const participant = await Participant.create(req.body);
    res.status(201).json(participant);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Bulk add participants to a group (admin only)
router.post('/group/:groupId/bulk', protect, async (req, res) => {
  const { groupId } = req.params;
  const { participants } = req.body;

  try {
    // Validate group exists and admin has access
    const group = await Group.findOne({
      where: { 
        id: groupId,
        adminId: req.admin.id
      }
    });

    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    if (group.status !== 'pending') {
      return res.status(400).json({ error: 'Cannot add participants after draw has been performed' });
    }

    // Validate participants data
    if (!Array.isArray(participants)) {
      return res.status(400).json({ error: 'Participants must be an array' });
    }

    // Add groupId and generate UUID for each participant
    const participantsWithGroup = participants.map(p => ({
      id: uuidv4(),  // Generate UUID for each participant
      ...p,
      groupId
    }));

    // Create all participants in bulk
    const createdParticipants = await Participant.bulkCreate(participantsWithGroup, {
      validate: true
    });

    res.status(201).json({
      message: `Successfully added ${createdParticipants.length} participants`,
      participants: createdParticipants
    });
  } catch (error) {
    console.error('Bulk upload error:', error);
    res.status(400).json({ 
      error: 'Failed to add participants',
      details: error.message
    });
  }
});

// Get all participants in a group (admin only)
router.get('/group/:groupId', protect, async (req, res) => {
  try {
    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(req.params.groupId)) {
      return res.status(400).json({ error: 'Invalid group ID format' });
    }

    const participants = await Participant.findAll({
      where: { groupId: req.params.groupId },
      include: [{ model: Participant, as: 'secretSantaFor' }]
    });
    res.json(participants);
  } catch (error) {
    console.error('Error fetching participants:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get participant details (accessible by participant via direct link)
router.get('/:id', async (req, res) => {
  try {
    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(req.params.id)) {
      return res.status(400).json({ error: 'Invalid participant ID format' });
    }

    const participant = await Participant.findByPk(req.params.id, {
      include: [
        { 
          model: Participant, 
          as: 'assignedTo',
          attributes: ['id', 'name', 'wishList'] // Only include necessary fields
        }
      ],
      attributes: ['id', 'name', 'wishList', 'groupId'] // Only include necessary fields
    });
    
    if (!participant) {
      return res.status(404).json({ error: 'Participant not found' });
    }

    res.json(participant);
  } catch (error) {
    console.error('Error fetching participant:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update wish list
router.put('/:id/wishlist', async (req, res) => {
  try {
    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(req.params.id)) {
      return res.status(400).json({ error: 'Invalid participant ID format' });
    }

    const participant = await Participant.findByPk(req.params.id);
    if (!participant) {
      return res.status(404).json({ error: 'Participant not found' });
    }
    await participant.update({ wishList: req.body.wishList });
    res.json(participant);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Send anonymous message to assigned recipient
router.post('/:id/messages', async (req, res) => {
  try {
    const { content } = req.body;
    if (!content) {
      return res.status(400).json({ error: 'Message content is required' });
    }

    const sender = await Participant.findByPk(req.params.id);
    if (!sender) {
      return res.status(404).json({ error: 'Participant not found' });
    }

    if (!sender.assignedToId) {
      return res.status(400).json({ error: 'No recipient assigned yet' });
    }

    const message = await Message.create({
      content,
      fromParticipantId: sender.id,
      toParticipantId: sender.assignedToId,
      groupId: sender.groupId
    });

    res.status(201).json({
      id: message.id,
      content: message.content,
      createdAt: message.createdAt
    });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get messages received by participant
router.get('/:id/messages', async (req, res) => {
  try {
    const messages = await Message.findAll({
      where: { toParticipantId: req.params.id },
      order: [['createdAt', 'DESC']],
      attributes: ['id', 'content', 'createdAt', 'readAt']
    });

    // Mark messages as read
    await Message.update(
      { readAt: new Date() },
      { 
        where: { 
          toParticipantId: req.params.id,
          readAt: null
        }
      }
    );

    res.json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get all messages sent by a participant (admin only)
router.get('/:id/messages/admin', protect, async (req, res) => {
  try {
    const messages = await Message.findAll({
      where: { fromParticipantId: req.params.id },
      include: [{
        model: Participant,
        as: 'recipient',
        attributes: ['name']
      }],
      order: [['createdAt', 'DESC']]
    });

    // Format messages for response
    const formattedMessages = messages.map(message => ({
      id: message.id,
      content: message.content,
      createdAt: message.createdAt,
      recipientName: message.recipient.name
    }));

    res.json(formattedMessages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update participant details
router.put('/:id', async (req, res) => {
  try {
    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(req.params.id)) {
      return res.status(400).json({ error: 'Invalid participant ID format' });
    }

    const participant = await Participant.findByPk(req.params.id);
    if (!participant) {
      return res.status(404).json({ error: 'Participant not found' });
    }
    await participant.update(req.body);
    res.json(participant);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update exclude list
router.put('/:id/excludelist', async (req, res) => {
  try {
    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(req.params.id)) {
      return res.status(400).json({ error: 'Invalid participant ID format' });
    }

    const participant = await Participant.findByPk(req.params.id);
    if (!participant) {
      return res.status(404).json({ error: 'Participant not found' });
    }
    await participant.update({ excludeList: req.body.excludeList });
    res.json(participant);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Remove participant from group
router.delete('/:id', async (req, res) => {
  try {
    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(req.params.id)) {
      return res.status(400).json({ error: 'Invalid participant ID format' });
    }

    const participant = await Participant.findByPk(req.params.id);
    if (!participant) {
      return res.status(404).json({ error: 'Participant not found' });
    }
    await participant.destroy();
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router; 