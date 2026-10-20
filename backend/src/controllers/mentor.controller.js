const { query } = require('../config/db');

// GET /api/mentor/mentees
async function getAssignedMentees(req, res, next) {
  try {
    const mentorId = req.user.userId;

    const result = await query(
      `SELECT 
        m.MentorshipID,
        m.StartDate,
        m.Status AS MentorshipStatus,
        u.UserID AS MenteeID,
        u.Name AS MenteeName,
        u.Email AS MenteeEmail,
        p.Department,
        p.Year,
        p.CGPA,
        p.Skills,
        p.Phone,
        COUNT(mt.MeetingID) AS TotalMeetings,
        COUNT(CASE WHEN mt.Status = 'Completed' THEN 1 END) AS CompletedMeetings,
        (
          SELECT json_build_object(
            'academicProgress', pr.AcademicProgress,
            'attendancePercentage', pr.AttendancePercentage,
            'remarks', pr.Remarks,
            'updatedDate', pr.UpdatedDate
          )
          FROM PROGRESS_RECORD pr
          WHERE pr.MenteeID = u.UserID
          ORDER BY pr.UpdatedDate DESC, pr.ProgressID DESC
          LIMIT 1
        ) AS LatestProgress,
        (
          SELECT json_build_object(
            'meetingId', next_mt.MeetingID,
            'meetingDate', next_mt.MeetingDate,
            'meetingTime', next_mt.MeetingTime,
            'mode', next_mt.Mode,
            'discussion', next_mt.Discussion
          )
          FROM MEETING next_mt
          WHERE next_mt.MentorshipID = m.MentorshipID
            AND next_mt.Status = 'Scheduled'
            AND next_mt.MeetingDate >= CURRENT_DATE
          ORDER BY next_mt.MeetingDate ASC, next_mt.MeetingTime ASC
          LIMIT 1
        ) AS NextMeeting
      FROM MENTORSHIP m
      JOIN USERS u ON m.MenteeID = u.UserID
      JOIN USER_PROFILES p ON u.UserID = p.UserID
      LEFT JOIN MEETING mt ON m.MentorshipID = mt.MentorshipID
      WHERE m.MentorID = $1 AND m.Status = 'Active'
      GROUP BY m.MentorshipID, m.StartDate, m.Status, u.UserID, u.Name, u.Email, p.Department, p.Year, p.CGPA, p.Skills, p.Phone
      ORDER BY u.Name ASC`,
      [mentorId]
    );

    res.json({ mentees: result.rows });
  } catch (error) {
    next(error);
  }
}

// GET /api/mentor/meetings
async function getMentorMeetings(req, res, next) {
  try {
    const mentorId = req.user.userId;

    const result = await query(
      `SELECT 
        mt.MeetingID,
        mt.MentorshipID,
        mt.MeetingDate,
        mt.MeetingTime,
        mt.Mode,
        mt.Discussion,
        mt.Status,
        mt.MentorRating,
        mt.MentorRemarks,
        mt.MenteeRating,
        mt.MenteeRemarks,
        mt.FeedbackDate,
        u_tee.UserID AS MenteeID,
        u_tee.Name AS MenteeName,
        u_tee.Email AS MenteeEmail,
        p_tee.Department AS MenteeDepartment,
        p_tee.Year AS MenteeYear
      FROM MEETING mt
      JOIN MENTORSHIP m ON mt.MentorshipID = m.MentorshipID
      JOIN USERS u_tee ON m.MenteeID = u_tee.UserID
      JOIN USER_PROFILES p_tee ON u_tee.UserID = p_tee.UserID
      WHERE m.MentorID = $1
      ORDER BY mt.MeetingDate DESC, mt.MeetingTime DESC`,
      [mentorId]
    );

    res.json({ meetings: result.rows });
  } catch (error) {
    next(error);
  }
}

// GET /api/mentor/pairings
async function getAllPairings(req, res, next) {
  try {
    const mentorId = req.user.userId;

    const result = await query(
      `SELECT 
        m.MentorshipID,
        m.StartDate,
        m.EndDate,
        m.Status,
        u.UserID AS MenteeID,
        u.Name AS MenteeName,
        u.Email AS MenteeEmail,
        p.Department,
        p.Year,
        p.CGPA,
        p.Skills
      FROM MENTORSHIP m
      JOIN USERS u ON m.MenteeID = u.UserID
      JOIN USER_PROFILES p ON u.UserID = p.UserID
      WHERE m.MentorID = $1
      ORDER BY m.Status ASC, m.StartDate DESC`,
      [mentorId]
    );

    res.json({ pairings: result.rows });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getAssignedMentees,
  getMentorMeetings,
  getAllPairings,
};
