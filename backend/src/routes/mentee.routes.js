const express = require('express');
const router = express.Router();
const {
  getDashboard,
  updateSkills,
  getRecommendedMentors,
  getMentorDossier,
  selectMentor,
  terminateMentorship,
} = require('../controllers/mentee.controller');
const { verifyToken, requireRole } = require('../middleware/auth');

router.use(verifyToken, requireRole('Mentee', 'Admin', 'Mentor'));

router.get('/dashboard', getDashboard);
router.put('/skills', updateSkills);
router.get('/recommended-mentors', getRecommendedMentors);
router.get('/mentor/:mentorId', getMentorDossier);
router.post('/select-mentor', selectMentor);
router.post('/terminate', terminateMentorship);

module.exports = router;
