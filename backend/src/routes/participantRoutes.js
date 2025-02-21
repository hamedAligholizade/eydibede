const express = require('express');
const router = express.Router();
const Participant = require('../models/Participant');
const Message = require('../models/Message');
const { protect } = require('../middleware/auth');
const Group = require('../models/Group');
const { v4: uuidv4 } = require('uuid');

// Add participant to a group (admin only)
router.post('/', protect, async (req, res) => {
  try {
    console.log('Received request body:', req.body); // Add logging
    const { groupId, name, email } = req.body;

    if (!groupId || !name || !email) {
      return res.status(400).json({ 
        message: 'Missing required fields',
        details: 'groupId, name, and email are required'
      });
    }

    // Validate group exists and user has access
    const group = await Group.findOne({
      where: { 
        id: groupId,
        ownerId: req.user.id
      }
    });

    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    if (group.status !== 'pending') {
      return res.status(400).json({ message: 'Cannot add participants after draw has been performed' });
    }

    const participant = await Participant.create({
      id: uuidv4(),
      name,
      email,
      groupId,
      wishList: '[]', // Initialize with empty array as string
      excludeList: [] // Initialize with empty array
    });

    // Format the response to avoid JSON parsing issues
    const formattedParticipant = {
      id: participant.id,
      name: participant.name,
      email: participant.email,
      groupId: participant.groupId,
      wishList: [],
      excludeList: []
    };

    res.status(201).json(formattedParticipant);
  } catch (error) {
    console.error('Add participant error:', error);
    res.status(400).json({ 
      message: 'Error adding participant',
      details: error.message 
    });
  }
});

// Bulk add participants to a group (admin only)
router.post('/group/:groupId/bulk', protect, async (req, res) => {
  try {
    console.log('Received bulk request body:', req.body);
    const { groupId } = req.params;
    const { participants } = req.body;

    if (!groupId) {
      return res.status(400).json({ 
        message: 'Missing group ID',
        details: 'Group ID is required in the URL'
      });
    }

    if (!participants || !Array.isArray(participants)) {
      return res.status(400).json({ 
        message: 'Invalid participants data',
        details: 'Participants must be provided as an array'
      });
    }

    // Validate group exists and user has access
    const group = await Group.findOne({
      where: { 
        id: groupId,
        ownerId: req.user.id
      }
    });

    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    if (group.status !== 'pending') {
      return res.status(400).json({ message: 'Cannot add participants after draw has been performed' });
    }

    // Validate each participant has required fields
    for (const p of participants) {
      if (!p.name || !p.email) {
        return res.status(400).json({ 
          message: 'Invalid participant data',
          details: 'Each participant must have a name and email'
        });
      }
    }

    // Add groupId and generate UUID for each participant
    const participantsWithGroup = participants.map(p => ({
      id: uuidv4(),
      ...p,
      groupId,
      wishList: '[]', // Initialize with empty array as string
      excludeList: []
    }));

    // Create all participants in bulk
    const createdParticipants = await Participant.bulkCreate(participantsWithGroup, {
      validate: true
    });

    // Format the response to avoid JSON parsing issues
    const formattedParticipants = createdParticipants.map(p => ({
      id: p.id,
      name: p.name,
      email: p.email,
      groupId: p.groupId,
      wishList: [],
      excludeList: []
    }));

    res.status(201).json({
      message: `Successfully added ${formattedParticipants.length} participants`,
      participants: formattedParticipants
    });
  } catch (error) {
    console.error('Bulk upload error:', error);
    res.status(400).json({ 
      message: 'Failed to add participants',
      details: error.message
    });
  }
});

// Get all participants in a group (admin only)
router.get('/group/:groupId', protect, async (req, res) => {
  try {
    const participants = await Participant.findAll({
      where: { groupId: req.params.groupId },
      include: [{ model: Participant, as: 'secretSantaFor' }]
    });
    res.json(participants);
  } catch (error) {
    console.error('Error fetching participants:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get participant details (accessible by participant via direct link)
router.get('/:id', async (req, res) => {
  try {
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
      return res.status(404).json({ message: 'Participant not found' });
    }

    res.json(participant);
  } catch (error) {
    console.error('Error fetching participant:', error);
    res.status(500).json({ message: error.message });
  }
});

// Update wish list
router.put('/:id/wishlist', async (req, res) => {
  try {
    const participant = await Participant.findByPk(req.params.id);
    if (!participant) {
      return res.status(404).json({ message: 'Participant not found' });
    }
    await participant.update({ wishList: req.body.wishList });
    res.json(participant);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Send anonymous message to assigned recipient
router.post('/:id/messages', async (req, res) => {
  try {
    const { content } = req.body;
    if (!content) {
      return res.status(400).json({ message: 'Message content is required' });
    }

    const sender = await Participant.findByPk(req.params.id);
    if (!sender) {
      return res.status(404).json({ message: 'Participant not found' });
    }

    if (!sender.assignedToId) {
      return res.status(400).json({ message: 'No recipient assigned yet' });
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
    res.status(500).json({ message: error.message });
  }
});

// Get all messages for a participant
router.get('/:id/messages', async (req, res) => {
  try {
    const messages = await Message.findAll({
      where: { toParticipantId: req.params.id },
      order: [['createdAt', 'DESC']]
    });
    res.json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ message: error.message });
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
    res.status(500).json({ message: error.message });
  }
});

// Update participant details
router.put('/:id', async (req, res) => {
  try {
    const participant = await Participant.findByPk(req.params.id);
    if (!participant) {
      return res.status(404).json({ message: 'Participant not found' });
    }
    await participant.update(req.body);
    res.json(participant);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update exclude list
router.put('/:id/excludelist', async (req, res) => {
  try {
    const participant = await Participant.findByPk(req.params.id);
    if (!participant) {
      return res.status(404).json({ message: 'Participant not found' });
    }
    await participant.update({ excludeList: req.body.excludeList });
    res.json(participant);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Remove participant from group
router.delete('/:id', async (req, res) => {
  try {
    const participant = await Participant.findByPk(req.params.id);
    if (!participant) {
      return res.status(404).json({ message: 'Participant not found' });
    }
    await participant.destroy();
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router; 