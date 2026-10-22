const express = require('express');
const router = express.Router();
const {
  getAssignedMentees,
  getMentorMeetings,
  getAllPairings,
  getMyProfile,
  getMentorDossier,
  terminateMentorship,
} = require('../controllers/mentor.controller');
const { verifyToken, requireRole } = require('../middleware/auth');

router.use(verifyToken, requireRole('Mentor', 'Admin', 'Mentee'));

router.get('/mentees', getAssignedMentees);
router.get('/meetings', getMentorMeetings);
router.get('/pairings', getAllPairings);
router.get('/profile', getMyProfile);
router.get('/dossier/:mentorId', getMentorDossier);
router.post('/terminate', terminateMentorship);
router.get('/:mentorId', getMentorDossier);

module.exports = router;

