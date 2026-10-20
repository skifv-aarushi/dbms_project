const express = require('express');
const router = express.Router();
const {
  getDashboard,
  updateSkills,
  getRecommendedMentors,
  selectMentor,
} = require('../controllers/mentee.controller');
const { verifyToken, requireRole } = require('../middleware/auth');

router.use(verifyToken, requireRole('Mentee', 'Admin'));

router.get('/dashboard', getDashboard);
router.put('/skills', updateSkills);
router.get('/recommended-mentors', getRecommendedMentors);
router.post('/select-mentor', selectMentor);

module.exports = router;
