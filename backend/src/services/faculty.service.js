const { query } = require('../config/db');

/**
 * Retrieves the comprehensive academic dossier of a faculty mentor.
 * Used by prospective student mentees to review works, citations, papers,
 * and previous session evaluations prior to establishing a mentorship pairing,
 * and by mentors themselves to review their academic profile and advising load.
 *
 * @param {number} mentorId - The UserID of the faculty mentor.
 * @param {boolean} isOwner - Whether the requester is the faculty member themselves.
 */
async function getFacultyDossier(mentorId, isOwner = false) {
  const parsedId = parseInt(mentorId, 10);
  if (isNaN(parsedId)) {
    throw new Error('Valid numeric mentorId is required.');
  }

  // 1. Fetch Mentor Personal & Academic Profile
  const profileRes = await query(
    `SELECT 
      u.UserID,
      u.Name,
      u.Email,
      u.Role,
      p.Department,
      p.Designation,
      p.Phone,
      p.Skills,
      p.Bio,
      p.CitationsCount,
      p.HIndex,
      p.ResearchAreas,
      p.GoogleScholarURL
    FROM USERS u
    JOIN USER_PROFILES p ON u.UserID = p.UserID
    WHERE u.UserID = $1 AND u.Role = 'Mentor'`,
    [parsedId]
  );

  if (profileRes.rows.length === 0) {
    const error = new Error('Faculty mentor profile not found.');
    error.status = 404;
    throw error;
  }

  const profile = profileRes.rows[0];

  // 2. Compute Real-Time Advising Capacity (Institutional Hard Cap = 3)
  const maxCapacity = 3;
  const loadRes = await query(
    `SELECT COUNT(*) AS ActiveCount 
     FROM MENTORSHIP 
     WHERE MentorID = $1 AND Status = 'Active'`,
    [parsedId]
  );
  const activeMenteesCount = parseInt(loadRes.rows[0]?.activecount || 0, 10);
  const isFull = activeMenteesCount >= maxCapacity;
  const slotsRemaining = Math.max(0, maxCapacity - activeMenteesCount);

  // 3. Fetch Refereed Scholarly Publications & Works
  const pubsRes = await query(
    `SELECT 
      PublicationID,
      Title,
      Journal,
      Year,
      Citations,
      PaperURL
    FROM FACULTY_PUBLICATIONS
    WHERE MentorID = $1
    ORDER BY Year DESC, Citations DESC`,
    [parsedId]
  );
  const publications = pubsRes.rows.map((row) => ({
    publicationId: row.publicationid,
    title: row.title,
    journal: row.journal,
    year: row.year,
    citations: row.citations,
    paperUrl: row.paperurl,
  }));

  // 4. Compute Aggregate Mentoring Performance & Session Metrics
  const statsRes = await query(
    `SELECT 
      COUNT(DISTINCT m.MentorshipID) AS TotalPairings,
      COUNT(DISTINCT CASE WHEN m.Status = 'Completed' THEN m.MentorshipID END) AS CompletedPairings,
      COUNT(mt.MeetingID) AS TotalSessionsScheduled,
      COUNT(CASE WHEN mt.Status = 'Completed' THEN mt.MeetingID END) AS CompletedSessions,
      ROUND(AVG(mt.MenteeRating), 2) AS AvgStudentSatisfaction,
      ROUND(AVG(mt.MentorRating), 2) AS AvgMentorRating
    FROM MENTORSHIP m
    LEFT JOIN MEETING mt ON m.MentorshipID = mt.MentorshipID
    WHERE m.MentorID = $1`,
    [parsedId]
  );
  const stats = statsRes.rows[0] || {};

  // 5. Fetch Previous Completed Mentoring Sessions with Student Ratings & Remarks
  const sessionRecordsRes = await query(
    `SELECT 
      mt.MeetingID,
      mt.MeetingDate,
      mt.MeetingTime,
      mt.Mode,
      mt.Discussion,
      mt.MenteeRating,
      mt.MenteeRemarks,
      mt.MentorRating,
      mt.MentorRemarks,
      mt.FeedbackDate,
      u_tee.Name AS MenteeName,
      p_tee.Department AS MenteeDepartment,
      p_tee.Year AS MenteeYear
    FROM MEETING mt
    JOIN MENTORSHIP m ON mt.MentorshipID = m.MentorshipID
    JOIN USERS u_tee ON m.MenteeID = u_tee.UserID
    JOIN USER_PROFILES p_tee ON u_tee.UserID = p_tee.UserID
    WHERE m.MentorID = $1 AND mt.Status = 'Completed'
    ORDER BY mt.MeetingDate DESC, mt.MeetingTime DESC
    LIMIT 12`,
    [parsedId]
  );

  const previousSessions = sessionRecordsRes.rows.map((s) => ({
    meetingId: s.meetingid,
    meetingDate: s.meetingdate,
    meetingTime: s.meetingtime,
    mode: s.mode,
    discussion: s.discussion,
    menteeRating: s.menteerating,
    menteeRemarks: s.menteeremarks,
    mentorRating: s.mentorrating,
    mentorRemarks: s.mentorremarks,
    feedbackDate: s.feedbackdate,
    // Provide first name + initial for prospective mentee privacy, full name for owner
    menteeDisplayName: isOwner ? s.menteename : maskMenteeName(s.menteename),
    menteeDepartment: s.menteedepartment,
    menteeYear: s.menteeyear,
  }));

  // 6. If requester is the mentor themselves, include current active mentees
  let activeMentees = [];
  if (isOwner) {
    const activeRes = await query(
      `SELECT 
        m.MentorshipID,
        m.StartDate,
        u_tee.UserID AS MenteeID,
        u_tee.Name AS MenteeName,
        u_tee.Email AS MenteeEmail,
        p_tee.Department,
        p_tee.Year,
        p_tee.CGPA,
        p_tee.Skills
      FROM MENTORSHIP m
      JOIN USERS u_tee ON m.MenteeID = u_tee.UserID
      JOIN USER_PROFILES p_tee ON u_tee.UserID = p_tee.UserID
      WHERE m.MentorID = $1 AND m.Status = 'Active'
      ORDER BY m.StartDate DESC`,
      [parsedId]
    );
    activeMentees = activeRes.rows.map((row) => ({
      mentorshipId: row.mentorshipid,
      startDate: row.startdate,
      menteeId: row.menteeid,
      menteeName: row.menteename,
      menteeEmail: row.menteeemail,
      department: row.department,
      year: row.year,
      cgpa: row.cgpa,
      skills: row.skills || [],
    }));
  }

  return {
    mentorId: profile.userid,
    name: profile.name,
    email: profile.email,
    department: profile.department,
    designation: profile.designation,
    phone: profile.phone,
    skills: profile.skills || [],
    bio: profile.bio || 'Faculty mentor supporting student academic growth and research scafolding.',
    citationsCount: parseInt(profile.citationscount || 0, 10),
    hIndex: parseInt(profile.hindex || 0, 10),
    researchAreas: Array.isArray(profile.researchareas) ? profile.researchareas : [],
    googleScholarUrl: profile.googlescholarurl,
    capacity: {
      activeMenteesCount,
      maxCapacity,
      slotsRemaining,
      isFull,
      capacityPercentage: Math.round((activeMenteesCount / maxCapacity) * 100),
    },
    publications,
    trackRecord: {
      totalPairings: parseInt(stats.totalpairings || 0, 10),
      completedPairings: parseInt(stats.completedpairings || 0, 10),
      totalSessionsScheduled: parseInt(stats.totalsessionsscheduled || 0, 10),
      completedSessions: parseInt(stats.completedsessions || 0, 10),
      avgStudentSatisfaction: parseFloat(stats.avgstudentsatisfaction || 0),
      avgMentorRating: parseFloat(stats.avgmentorrating || 0),
    },
    previousSessions,
    activeMentees,
  };
}

function maskMenteeName(fullName) {
  if (!fullName) return 'Student Mentee';
  const parts = fullName.trim().split(' ');
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[parts.length - 1][0]}.`;
}

module.exports = {
  getFacultyDossier,
};
