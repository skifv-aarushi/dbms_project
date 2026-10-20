const { query } = require('../config/db');

// POST /api/progress/:menteeId
async function logProgress(req, res, next) {
  try {
    const { menteeId } = req.params;
    const { academicProgress, attendancePercentage, remarks } = req.body;

    if (!academicProgress || attendancePercentage === undefined) {
      return res.status(400).json({ error: 'academicProgress and attendancePercentage are required.' });
    }

    const attendance = parseFloat(attendancePercentage);
    if (isNaN(attendance) || attendance < 0 || attendance > 100) {
      return res.status(400).json({ error: 'attendancePercentage must be between 0.00 and 100.00.' });
    }

    // Verify mentee exists
    const menteeCheck = await query('SELECT UserID, Role, Name FROM USERS WHERE UserID = $1', [menteeId]);
    if (menteeCheck.rows.length === 0 || menteeCheck.rows[0].role !== 'Mentee') {
      return res.status(404).json({ error: 'Mentee not found.' });
    }

    // If caller is Mentor, verify that mentor has an active pairing with this mentee
    if (req.user.role === 'Mentor') {
      const pairCheck = await query(
        'SELECT MentorshipID FROM MENTORSHIP WHERE MentorID = $1 AND MenteeID = $2 AND Status = $3',
        [req.user.userId, menteeId, 'Active']
      );
      if (pairCheck.rows.length === 0) {
        return res.status(403).json({ error: 'You are not assigned as an active mentor for this mentee.' });
      }
    }

    const result = await query(
      `INSERT INTO PROGRESS_RECORD (MenteeID, AcademicProgress, AttendancePercentage, Remarks, UpdatedDate)
       VALUES ($1, $2, $3, $4, CURRENT_DATE)
       RETURNING *`,
      [menteeId, academicProgress, attendance, remarks || '']
    );

    res.status(201).json({
      message: 'Progress record logged successfully.',
      progressRecord: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
}

// GET /api/progress/:menteeId
async function getProgressRecords(req, res, next) {
  try {
    const { menteeId } = req.params;

    // Verify authorization: Mentee can view own; Mentor can view if assigned or Admin
    if (req.user.role === 'Mentee' && req.user.userId !== parseInt(menteeId, 10)) {
      return res.status(403).json({ error: 'Unauthorized to view progress records of other students.' });
    }

    const result = await query(
      `SELECT ProgressID, MenteeID, AcademicProgress, AttendancePercentage, Remarks, UpdatedDate
       FROM PROGRESS_RECORD
       WHERE MenteeID = $1
       ORDER BY UpdatedDate DESC, ProgressID DESC`,
      [menteeId]
    );

    res.json({ progressRecords: result.rows });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  logProgress,
  getProgressRecords,
};
