const express = require('express');
const router = express.Router();
const Group = require('../models/Group');
const Participant = require('../models/Participant');
const { protect } = require('../middleware/auth');
const { sendAssignmentEmail } = require('../utils/email');

// Create a new group
router.post('/', protect, async (req, res) => {
  try {
    const group = await Group.create({
      ...req.body,
      ownerId: req.user.id
    });
    res.status(201).json(group);
  } catch (error) {
    console.error('Group creation error:', error);
    res.status(400).json({ error: error.message });
  }
});

// Get user's groups
router.get('/my-groups', protect, async (req, res) => {
  try {
    const groups = await Group.findAll({
      where: { ownerId: req.user.id },
      order: [['createdAt', 'DESC']]
    });
    res.json(groups);
  } catch (error) {
    console.error('Error fetching groups:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get a specific group with its participants
router.get('/:id', protect, async (req, res) => {
  try {
    const group = await Group.findOne({
      where: { 
        id: req.params.id,
        ownerId: req.user.id
      },
      include: [{
        model: Participant,
        include: [{ model: Participant, as: 'secretSantaFor' }]
      }]
    });
    
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }
    res.json(group);
  } catch (error) {
    console.error('Error fetching group:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update a group
router.put('/:id', protect, async (req, res) => {
  try {
    const group = await Group.findOne({
      where: { 
        id: req.params.id,
        ownerId: req.user.id
      }
    });
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }
    await group.update(req.body);
    res.json(group);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete a group
router.delete('/:id', protect, async (req, res) => {
  try {
    const group = await Group.findOne({
      where: { 
        id: req.params.id,
        ownerId: req.user.id
      }
    });
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }
    await group.destroy();
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Perform the Secret Santa draw for a group
router.post('/:id/draw', protect, async (req, res) => {
  try {
    const group = await Group.findOne({
      where: { 
        id: req.params.id,
        ownerId: req.user.id
      },
      include: [{ model: Participant }]
    });
    
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    if (group.status !== 'pending') {
      return res.status(400).json({ error: 'Draw has already been performed' });
    }

    const participants = await Participant.findAll({
      where: { groupId: group.id }
    });

    // Perform the draw
    const assignments = performSecretSantaDraw(participants);
    
    // Save assignments first
    for (const [giver, receiver] of assignments) {
      await Participant.update(
        { assignedToId: receiver.id },
        { where: { id: giver.id } }
      );
    }

    // Update group status
    await group.update({ status: 'drawn' });

    // Send emails in the background
    const emailPromises = assignments.map(([giver, receiver]) => 
      sendAssignmentEmail({
        to: giver.email,
        giverName: giver.name,
        receiverName: receiver.name,
        groupName: group.name,
        participantId: giver.id
      }).catch(error => {
        console.error(`Failed to send email to ${giver.email}:`, error);
        return null; // Continue with other emails even if one fails
      })
    );

    // Start sending emails but don't wait for them
    Promise.all(emailPromises).catch(error => {
      console.error('Error in email sending batch:', error);
    });

    // Return the assignments in the response
    const assignmentDetails = assignments.map(([giver, receiver]) => ({
      giver: { id: giver.id, name: giver.name, email: giver.email },
      receiver: { id: receiver.id, name: receiver.name }
    }));

    res.json({ 
      message: 'Draw completed successfully',
      note: 'Emails are being sent in the background. Some participants may receive their assignments with a slight delay.',
      assignments: assignmentDetails
    });
  } catch (error) {
    console.error('Draw error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Helper function to perform the Secret Santa draw
function performSecretSantaDraw(participants) {
  const maxAttempts = 100; // Prevent infinite loops
  
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const assignments = new Map();
      const available = [...participants];
      const givers = [...participants];
      
      // Shuffle givers for more randomness
      for (let i = givers.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [givers[i], givers[j]] = [givers[j], givers[i]];
      }

      for (const giver of givers) {
        // Filter out invalid receivers
        const possibleReceivers = available.filter(p => 
          p.id !== giver.id && 
          !giver.excludeList.includes(p.id)
        );

        if (possibleReceivers.length === 0) {
          // No valid receiver found, try again
          throw new Error('No valid receiver found');
        }

        // Pick a random receiver
        const receiverIndex = Math.floor(Math.random() * possibleReceivers.length);
        const receiver = possibleReceivers[receiverIndex];
        
        assignments.set(giver, receiver);
        available.splice(available.indexOf(receiver), 1);
      }

      // Verify the assignments
      for (const [giver, receiver] of assignments) {
        if (giver.id === receiver.id || giver.excludeList.includes(receiver.id)) {
          throw new Error('Invalid assignment found');
        }
      }

      // If we get here, we have valid assignments
      return Array.from(assignments.entries());
    } catch (error) {
      // If this was the last attempt, throw an error
      if (attempt === maxAttempts - 1) {
        throw new Error('Could not generate valid Secret Santa assignments. Please check exclude lists and try again.');
      }
      // Otherwise, continue to next attempt
      continue;
    }
  }
}

module.exports = router; 