const express = require('express');
const router = express.Router();
const Group = require('../models/Group');
const Participant = require('../models/Participant');
const { protect } = require('../middleware/auth');
const { sendAssignmentEmail } = require('../utils/email');

// Create a new Secret Santa group (admin only)
router.post('/', protect, async (req, res) => {
  try {
    const group = await Group.create({
      ...req.body,
      adminId: req.admin.id
    });
    res.status(201).json(group);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get all groups (admin only)
router.get('/', protect, async (req, res) => {
  try {
    const groups = await Group.findAll({
      where: { adminId: req.admin.id }
    });
    res.json(groups);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get groups by participant email
router.get('/organizer/:email', async (req, res) => {
  try {
    const participants = await Participant.findAll({
      where: { email: req.params.email },
      include: [{
        model: Group,
        attributes: ['id', 'name', 'description', 'budget', 'currency', 'status', 'drawDate']
      }]
    });

    // Extract unique groups from participants
    const groups = participants.map(p => p.Group).filter(g => g !== null);
    res.json(groups);
  } catch (error) {
    console.error('Error fetching groups:', error);
    res.status(500).json({ error: error.message });
  }
});

// Perform the Secret Santa draw for a group (admin only)
router.post('/:id/draw', protect, async (req, res) => {
  try {
    const group = await Group.findOne({
      where: { 
        id: req.params.id,
        adminId: req.admin.id
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

// Get a specific group with its participants (admin only)
router.get('/:id', protect, async (req, res) => {
  try {
    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(req.params.id)) {
      return res.status(400).json({ error: 'Invalid group ID format' });
    }

    const group = await Group.findOne({
      where: { 
        id: req.params.id,
        adminId: req.admin.id
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

// Update a group (admin only)
router.put('/:id', protect, async (req, res) => {
  try {
    const group = await Group.findOne({
      where: { 
        id: req.params.id,
        adminId: req.admin.id
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

// Delete a group (admin only)
router.delete('/:id', protect, async (req, res) => {
  try {
    const group = await Group.findOne({
      where: { 
        id: req.params.id,
        adminId: req.admin.id
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

// Resend assignment email for a specific participant
router.post('/:groupId/participants/:participantId/resend-email', protect, async (req, res) => {
  try {
    const group = await Group.findOne({
      where: { 
        id: req.params.groupId,
        adminId: req.admin.id
      }
    });

    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    const participant = await Participant.findOne({
      where: { 
        id: req.params.participantId,
        groupId: req.params.groupId
      },
      include: [{ 
        model: Participant, 
        as: 'secretSantaFor' 
      }]
    });

    if (!participant) {
      return res.status(404).json({ error: 'Participant not found' });
    }

    if (!participant.assignedToId) {
      return res.status(400).json({ error: 'This participant has not been assigned yet' });
    }

    // Send the email
    await sendAssignmentEmail({
      to: participant.email,
      giverName: participant.name,
      receiverName: participant.secretSantaFor.name,
      groupName: group.name,
      participantId: participant.id
    });

    res.json({ message: 'Assignment email sent successfully' });
  } catch (error) {
    console.error('Error resending email:', error);
    res.status(500).json({ error: 'Failed to send email' });
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