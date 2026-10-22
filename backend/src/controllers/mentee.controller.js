const { query } = require('../config/db');

// GET /api/mentee/dashboard
async function getDashboard(req, res, next) {
  try {
    const menteeId = req.user.userId;

    // 1. Fetch Mentee Profile
    const profileRes = await query(
      `SELECT u.UserID, u.Name, u.Email, u.Role,
              p.ProfileID, p.Phone, p.Department, p.Year, p.CGPA, p.Skills
       FROM USERS u
       LEFT JOIN USER_PROFILES p ON u.UserID = p.UserID
       WHERE u.UserID = $1`,
      [menteeId]
    );

    const menteeProfile = profileRes.rows[0] || {
      userid: menteeId,
      name: req.user.name || 'Student Mentee',
      email: req.user.email || '',
      role: req.user.role || 'Mentee',
      department: 'General',
      year: 1,
      cgpa: null,
      skills: [],
    };

    // 2. Fetch Active Mentorship & Mentor Info
    const pairingRes = await query(
      `SELECT 
        m.MentorshipID,
        m.StartDate,
        m.Status AS MentorshipStatus,
        u_men.UserID AS MentorID,
        u_men.Name AS MentorName,
        u_men.Email AS MentorEmail,
        p_men.Department AS MentorDepartment,
        p_men.Designation AS MentorDesignation,
        p_men.Phone AS MentorPhone
      FROM MENTORSHIP m
      JOIN USERS u_men ON m.MentorID = u_men.UserID
      LEFT JOIN USER_PROFILES p_men ON u_men.UserID = p_men.UserID
      WHERE m.MenteeID = $1 AND m.Status = 'Active'`,
      [menteeId]
    );

    const activeMentorship = pairingRes.rows[0] || null;

    // 3. Fetch Meetings for this mentee
    let meetings = [];
    if (activeMentorship) {
      const meetingsRes = await query(
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
          mt.FeedbackDate
        FROM MEETING mt
        WHERE mt.MentorshipID = $1
        ORDER BY mt.MeetingDate DESC, mt.MeetingTime DESC`,
        [activeMentorship.mentorshipid]
      );
      meetings = meetingsRes.rows;
    }

    // 4. Fetch Progress Records
    const progressRes = await query(
      `SELECT ProgressID, AcademicProgress, AttendancePercentage, Remarks, UpdatedDate
       FROM PROGRESS_RECORD
       WHERE MenteeID = $1
       ORDER BY UpdatedDate DESC, ProgressID DESC`,
      [menteeId]
    );

    res.json({
      profile: menteeProfile,
      activeMentorship,
      meetings,
      progressRecords: progressRes.rows,
    });
  } catch (error) {
    next(error);
  }
}

// PUT /api/mentee/skills
async function updateSkills(req, res, next) {
  try {
    const menteeId = req.user.userId;
    const { skills } = req.body;

    let skillsArray = [];
    if (Array.isArray(skills)) {
      skillsArray = skills;
    } else if (typeof skills === 'string') {
      skillsArray = skills.split(',').map((s) => s.trim()).filter(Boolean);
    }

    const result = await query(
      `UPDATE USER_PROFILES
       SET Skills = $1
       WHERE UserID = $2
       RETURNING Skills`,
      [skillsArray, menteeId]
    );

    res.json({
      message: 'Skills updated successfully.',
      skills: result.rows[0]?.skills || [],
    });
  } catch (error) {
    next(error);
  }
}

// GET /api/mentee/recommended-mentors
async function getRecommendedMentors(req, res, next) {
  try {
    const { getRecommendationsForMentee } = require('../services/recommender.service');
    const menteeId = req.user.userId;
    const recommendationsData = await getRecommendationsForMentee(menteeId);
    res.json(recommendationsData);
  } catch (error) {
    next(error);
  }
}

// GET /api/mentee/mentor/:mentorId
async function getMentorDossier(req, res, next) {
  try {
    const { getFacultyDossier } = require('../services/faculty.service');
    const { mentorId } = req.params;
    const dossier = await getFacultyDossier(mentorId, false);
    res.json(dossier);
  } catch (error) {
    next(error);
  }
}

// POST /api/mentee/select-mentor
async function selectMentor(req, res, next) {
  try {
    const menteeId = req.user.userId;
    const { mentorId } = req.body;

    const parsedMentorId = parseInt(mentorId, 10);
    if (isNaN(parsedMentorId)) {
      return res.status(400).json({ error: 'Valid numeric mentorId is required.' });
    }

    // Check if mentee already has an active mentorship
    const activeCheck = await query(
      `SELECT m.MentorshipID, u.Name AS MentorName 
       FROM MENTORSHIP m
       JOIN USERS u ON m.MentorID = u.UserID
       WHERE m.MenteeID = $1 AND m.Status = 'Active'`,
      [menteeId]
    );
    if (activeCheck.rows.length > 0) {
      return res.status(400).json({
        error: `You already have an active faculty mentor assigned (${activeCheck.rows[0].mentorname}). Database constraints prohibit multiple active mentors.`,
      });
    }

    // Verify mentor exists and has Role = 'Mentor'
    const mentorCheck = await query(
      `SELECT u.UserID, u.Name FROM USERS u WHERE u.UserID = $1 AND u.Role = 'Mentor'`,
      [parsedMentorId]
    );
    if (mentorCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Faculty mentor not found.' });
    }

    // Verify mentor has not reached the institutional 3-mentee hard cap
    const mentorLoadRes = await query(
      `SELECT COUNT(*) AS ActiveCount FROM MENTORSHIP WHERE MentorID = $1 AND Status = 'Active'`,
      [parsedMentorId]
    );
    const activeMenteesCount = parseInt(mentorLoadRes.rows[0]?.activecount || 0, 10);
    if (activeMenteesCount >= 3) {
      return res.status(400).json({
        error: `Faculty Mentor ${mentorCheck.rows[0].name} has reached maximum institutional capacity of 3 active mentees. Pairings are currently closed for this faculty member.`,
      });
    }

    // Insert new pairing with StartDate = CURRENT_DATE, Status = 'Active'
    // The PostgreSQL trigger enforce_mentorship_constraints() protects integrity at DBMS level
    const insertRes = await query(
      `INSERT INTO MENTORSHIP (MentorID, MenteeID, StartDate, Status)
       VALUES ($1, $2, CURRENT_DATE, 'Active')
       RETURNING *`,
      [parsedMentorId, menteeId]
    );

    res.status(201).json({
      message: `Mentorship pairing established with ${mentorCheck.rows[0].name}! Note: This pairing is committed for the current semester.`,
      mentorName: mentorCheck.rows[0].name,
      mentorship: insertRes.rows[0],
    });
  } catch (error) {
    next(error);
  }
}

// POST /api/mentee/terminate
async function terminateMentorship(req, res, next) {
  try {
    const menteeId = req.user.userId;

    const activeRes = await query(
      `SELECT m.MentorshipID, m.MentorID, u.Name AS MentorName
       FROM MENTORSHIP m
       JOIN USERS u ON m.MentorID = u.UserID
       WHERE m.MenteeID = $1 AND m.Status = 'Active'`,
      [menteeId]
    );

    if (activeRes.rows.length === 0) {
      return res.status(400).json({ error: 'No active mentorship pairing found to terminate.' });
    }

    const mentorshipId = activeRes.rows[0].mentorshipid;
    const mentorName = activeRes.rows[0].mentorname || 'your faculty mentor';

    // Update status to 'Terminated' and set EndDate (ensuring EndDate >= StartDate)
    await query(
      `UPDATE MENTORSHIP SET Status = 'Terminated', EndDate = GREATEST(StartDate, CURRENT_DATE) WHERE MentorshipID = $1`,
      [mentorshipId]
    );

    // Cancel upcoming scheduled meetings
    await query(
      `UPDATE MEETING SET Status = 'Cancelled' WHERE MentorshipID = $1 AND Status = 'Scheduled' AND MeetingDate >= CURRENT_DATE`,
      [mentorshipId]
    );

    res.json({
      message: `Mentorship pairing with ${mentorName} has been officially terminated. You are now eligible to establish a new mentorship pairing.`,
      mentorshipId,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getDashboard,
  updateSkills,
  getRecommendedMentors,
  getMentorDossier,
  selectMentor,
  terminateMentorship,
};
