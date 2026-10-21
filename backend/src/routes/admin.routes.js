const express = require('express');
const router = express.Router();
const {
  createAllocation,
  getAllAllocations,
  updateAllocationStatus,
  getUnassignedMentees,
  getMentorsLoad,
  getReports,
  getAllUsers,
  createUser,
  deleteUser,
  getMenteeRecommendations,
  getAutoMatchPreview,
  applyAutoMatch,
  reseedDatabase,
  getMentorDossier,
} = require('../controllers/admin.controller');
const { verifyToken, requireRole } = require('../middleware/auth');

// All Admin routes require authentication and 'Admin' role
router.use(verifyToken, requireRole('Admin'));

router.post('/allocations', createAllocation);
router.get('/allocations', getAllAllocations);
router.patch('/allocations/:id', updateAllocationStatus);
router.get('/unassigned-mentees', getUnassignedMentees);
router.get('/mentors-load', getMentorsLoad);
router.get('/reports', getReports);
router.get('/users', getAllUsers);
router.post('/users', createUser);
router.delete('/users/:id', deleteUser);
router.get('/recommendations/:menteeId', getMenteeRecommendations);
router.get('/auto-match', getAutoMatchPreview);
router.post('/auto-match/apply', applyAutoMatch);
router.post('/reseed', reseedDatabase);
router.get('/mentor/:mentorId', getMentorDossier);

module.exports = router;
