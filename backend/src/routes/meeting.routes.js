const express = require('express');
const router = express.Router();
const {
  createMeeting,
  updateMeeting,
  submitFeedback,
  getMeetingById,
} = require('../controllers/meeting.controller');
const { verifyToken, requireRole } = require('../middleware/auth');

router.use(verifyToken);

// Schedule a meeting (Mentor or Admin)
router.post('/', requireRole('Mentor', 'Admin'), createMeeting);

// Update status / discussion notes (Participants or Admin)
router.patch('/:id', updateMeeting);

// Submit bilateral feedback (Participants or Admin)
router.post('/:id/feedback', submitFeedback);

// Get meeting details
router.get('/:id', getMeetingById);

module.exports = router;
