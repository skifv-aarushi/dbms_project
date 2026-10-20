const jwt = require('jsonwebtoken');
const { query } = require('../config/db');

async function verifyToken(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'supersecret_mentor_mentee_jwt_key_2026_institutional_portal');

    // Retrieve user from DB to verify still active and valid
    const userResult = await query(
      'SELECT UserID, Name, Email, Role FROM USERS WHERE UserID = $1',
      [decoded.userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid token: user not found.' });
    }

    const dbUser = userResult.rows[0];
    req.user = {
      userId: dbUser.userid || dbUser.UserID,
      name: dbUser.name || dbUser.Name,
      email: dbUser.email || dbUser.Email,
      role: dbUser.role || dbUser.Role,
    };

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Session expired. Please log in again.' });
    }
    return res.status(401).json({ error: 'Invalid or malformed authentication token.' });
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required.' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Forbidden: Action requires one of [${roles.join(', ')}] roles. Your role is '${req.user.role}'.`,
      });
    }

    next();
  };
}

module.exports = {
  verifyToken,
  requireRole,
};
