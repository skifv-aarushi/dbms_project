const express = require('express');
const router = express.Router();
const { updateProfile } = require('../controllers/auth.controller');
const { verifyToken } = require('../middleware/auth');

// PUT /api/users/profile
router.put('/profile', verifyToken, updateProfile);

module.exports = router;
