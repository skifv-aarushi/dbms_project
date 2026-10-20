const { query } = require('../config/db');

// POST /api/meetings
async function createMeeting(req, res, next) {
  try {
    const mentorId = req.user.userId;
    const { mentorshipId, menteeId, meetingDate, meetingTime, mode, discussion } = req.body;

    if (!meetingDate || !meetingTime || !mode) {
      return res.status(400).json({ error: 'meetingDate, meetingTime, and mode are required.' });
    }

    if (!['Online', 'Offline'].includes(mode)) {
      return res.status(400).json({ error: "Mode must be 'Online' or 'Offline'." });
    }

    let targetMentorshipId = mentorshipId;

    if (!targetMentorshipId && menteeId) {
      const pairRes = await query(
        'SELECT MentorshipID FROM MENTORSHIP WHERE MentorID = $1 AND MenteeID = $2 AND Status = $3',
        [mentorId, menteeId, 'Active']
      );
      if (pairRes.rows.length === 0) {
        return res.status(404).json({ error: 'No active mentorship pairing found for this mentee.' });
      }
      targetMentorshipId = pairRes.rows[0].mentorshipid;
    }

    if (!targetMentorshipId) {
      return res.status(400).json({ error: 'Either mentorshipId or menteeId must be provided.' });
    }

    // Verify ownership
    const checkOwnership = await query(
      'SELECT MentorshipID FROM MENTORSHIP WHERE MentorshipID = $1 AND MentorID = $2',
      [targetMentorshipId, mentorId]
    );

    if (checkOwnership.rows.length === 0 && req.user.role !== 'Admin') {
      return res.status(403).json({ error: 'You are not authorized to schedule meetings for this mentorship.' });
    }

    const result = await query(
      `INSERT INTO MEETING (MentorshipID, MeetingDate, MeetingTime, Mode, Discussion, Status)
       VALUES ($1, $2, $3, $4, $5, 'Scheduled')
       RETURNING *`,
      [targetMentorshipId, meetingDate, meetingTime, mode, discussion || '']
    );

    res.status(201).json({
      message: 'Meeting scheduled successfully.',
      meeting: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
}

// PATCH /api/meetings/:id
async function updateMeeting(req, res, next) {
  try {
    const { id } = req.params;
    const { status, discussion } = req.body;

    if (status && !['Scheduled', 'Completed', 'Cancelled'].includes(status)) {
      return res.status(400).json({ error: "Status must be 'Scheduled', 'Completed', or 'Cancelled'." });
    }

    // Verify caller is part of this mentorship or Admin
    const mtCheck = await query(
      `SELECT mt.MeetingID, m.MentorID, m.MenteeID
       FROM MEETING mt
       JOIN MENTORSHIP m ON mt.MentorshipID = m.MentorshipID
       WHERE mt.MeetingID = $1`,
      [id]
    );

    if (mtCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Meeting not found.' });
    }

    const mt = mtCheck.rows[0];
    if (
      req.user.role !== 'Admin' &&
      req.user.userId !== mt.mentorid &&
      req.user.userId !== mt.menteeid
    ) {
      return res.status(403).json({ error: 'Not authorized to update this meeting.' });
    }

    const result = await query(
      `UPDATE MEETING
       SET Status = COALESCE($1, Status),
           Discussion = COALESCE($2, Discussion)
       WHERE MeetingID = $3
       RETURNING *`,
      [status || null, discussion !== undefined ? discussion : null, id]
    );

    res.json({
      message: 'Meeting updated successfully.',
      meeting: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
}

// POST /api/meetings/:id/feedback
async function submitFeedback(req, res, next) {
  try {
    const { id } = req.params;
    const { rating, remarks } = req.body;
    const numRating = parseInt(rating, 10);

    if (isNaN(numRating) || numRating < 1 || numRating > 5) {
      return res.status(400).json({ error: 'Rating must be an integer between 1 and 5.' });
    }

    // Retrieve meeting & mentorship participants
    const mtCheck = await query(
      `SELECT mt.MeetingID, mt.Status, m.MentorID, m.MenteeID
       FROM MEETING mt
       JOIN MENTORSHIP m ON mt.MentorshipID = m.MentorshipID
       WHERE mt.MeetingID = $1`,
      [id]
    );

    if (mtCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Meeting not found.' });
    }

    const mt = mtCheck.rows[0];
    const userRole = req.user.role;
    const userId = req.user.userId;

    let updateSql = '';
    let params = [];

    if (userRole === 'Mentor' && userId === mt.mentorid) {
      updateSql = `
        UPDATE MEETING
        SET MentorRating = $1,
            MentorRemarks = $2,
            FeedbackDate = CURRENT_DATE,
            Status = 'Completed'
        WHERE MeetingID = $3
        RETURNING *`;
      params = [numRating, remarks || '', id];
    } else if (userRole === 'Mentee' && userId === mt.menteeid) {
      updateSql = `
        UPDATE MEETING
        SET MenteeRating = $1,
            MenteeRemarks = $2,
            FeedbackDate = CURRENT_DATE,
            Status = 'Completed'
        WHERE MeetingID = $3
        RETURNING *`;
      params = [numRating, remarks || '', id];
    } else if (userRole === 'Admin') {
      // Admin can supply either or mentor rating
      updateSql = `
        UPDATE MEETING
        SET MentorRating = COALESCE($1, MentorRating),
            MentorRemarks = COALESCE($2, MentorRemarks),
            FeedbackDate = CURRENT_DATE,
            Status = 'Completed'
        WHERE MeetingID = $3
        RETURNING *`;
      params = [numRating, remarks || '', id];
    } else {
      return res.status(403).json({ error: 'You are not an assigned participant for this meeting.' });
    }

    const result = await query(updateSql, params);

    res.json({
      message: 'Feedback submitted successfully.',
      meeting: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
}

// GET /api/meetings/:id
async function getMeetingById(req, res, next) {
  try {
    const { id } = req.params;

    const result = await query(
      `SELECT 
        mt.*,
        m.MentorID,
        m.MenteeID,
        u_men.Name AS MentorName,
        u_tee.Name AS MenteeName
      FROM MEETING mt
      JOIN MENTORSHIP m ON mt.MentorshipID = m.MentorshipID
      JOIN USERS u_men ON m.MentorID = u_men.UserID
      JOIN USERS u_tee ON m.MenteeID = u_tee.UserID
      WHERE mt.MeetingID = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Meeting not found.' });
    }

    res.json({ meeting: result.rows[0] });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createMeeting,
  updateMeeting,
  submitFeedback,
  getMeetingById,
};
