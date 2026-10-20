const express = require('express');
const router = express.Router();
const {
  getAssignedMentees,
  getMentorMeetings,
  getAllPairings,
} = require('../controllers/mentor.controller');
const { verifyToken, requireRole } = require('../middleware/auth');

router.use(verifyToken, requireRole('Mentor', 'Admin'));

router.get('/mentees', getAssignedMentees);
router.get('/meetings', getMentorMeetings);
router.get('/pairings', getAllPairings);

module.exports = router;
