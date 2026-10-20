const express = require('express');
const router = express.Router();
const { logProgress, getProgressRecords } = require('../controllers/progress.controller');
const { verifyToken, requireRole } = require('../middleware/auth');

router.use(verifyToken);

// Log progress record (Mentor or Admin)
router.post('/:menteeId', requireRole('Mentor', 'Admin'), logProgress);

// View progress records (Mentee, Mentor, Admin)
router.get('/:menteeId', getProgressRecords);

module.exports = router;
