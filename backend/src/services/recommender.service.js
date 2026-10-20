const { query } = require('../config/db');

/**
 * Calculates matching compatibility between a mentee and all faculty mentors.
 * Factors:
 * 1. Skills / Expertise Overlap (45% weight)
 * 2. Department Alignment (30% weight)
 * 3. Workload Balance & Capacity (15% weight)
 * 4. Academic Seniority & CGPA Need (10% weight)
 */
async function getRecommendationsForMentee(menteeId) {
  // 1. Fetch Mentee profile
  const menteeRes = await query(
    `SELECT u.UserID, u.Name, u.Email, p.Department, p.Year, p.CGPA, p.Skills
     FROM USERS u
     JOIN USER_PROFILES p ON u.UserID = p.UserID
     WHERE u.UserID = $1 AND u.Role = 'Mentee'`,
    [menteeId]
  );

  if (menteeRes.rows.length === 0) {
    throw new Error(`Mentee with ID ${menteeId} not found.`);
  }

  const mentee = menteeRes.rows[0];
  const menteeSkills = Array.isArray(mentee.skills) ? mentee.skills : [];

  // 2. Fetch all Faculty Mentors with active mentee loads and expertise
  const mentorsRes = await query(
    `SELECT 
      u.UserID,
      u.Name,
      u.Email,
      p.Department,
      p.Designation,
      p.Skills,
      p.Phone,
      COUNT(CASE WHEN m.Status = 'Active' THEN 1 END) AS ActiveMenteesCount
    FROM USERS u
    JOIN USER_PROFILES p ON u.UserID = p.UserID
    LEFT JOIN MENTORSHIP m ON u.UserID = m.MentorID
    WHERE u.Role = 'Mentor'
    GROUP BY u.UserID, u.Name, u.Email, p.Department, p.Designation, p.Skills, p.Phone
    ORDER BY u.Name ASC`
  );

  const mentors = mentorsRes.rows;

  // 3. Compute matching scores
  const recommendations = mentors.map((mentor) => {
    const mentorSkills = Array.isArray(mentor.skills) ? mentor.skills : [];
    const activeCount = parseInt(mentor.activementeescount || 0, 10);

    let skillsScore = 0;
    const matchedSkills = [];
    const missingSkills = [];

    // Clean comparison
    const mentorSkillsLower = mentorSkills.map((s) => s.trim().toLowerCase());
    menteeSkills.forEach((skill) => {
      const sLower = skill.trim().toLowerCase();
      if (mentorSkillsLower.includes(sLower)) {
        matchedSkills.push(skill);
      } else {
        missingSkills.push(skill);
      }
    });

    if (menteeSkills.length > 0) {
      const overlapRatio = matchedSkills.length / menteeSkills.length;
      skillsScore = Math.round(overlapRatio * 45);
    } else {
      skillsScore = 20; // Default baseline if student hasn't added skills yet
    }

    // Department Alignment (30 pts)
    let deptScore = 5;
    let isSameDept = false;
    const menteeDept = (mentee.department || '').toLowerCase();
    const mentorDept = (mentor.department || '').toLowerCase();

    if (menteeDept === mentorDept) {
      deptScore = 30;
      isSameDept = true;
    } else if (
      (menteeDept.includes('computer') && mentorDept.includes('information')) ||
      (menteeDept.includes('information') && mentorDept.includes('computer'))
    ) {
      deptScore = 18;
    }

    // Workload Balance (15 pts)
    let capacityScore = 15;
    if (activeCount === 1) capacityScore = 12;
    else if (activeCount === 2) capacityScore = 8;
    else if (activeCount === 3) capacityScore = 4;
    else if (activeCount > 3) capacityScore = 1;

    // Academic Seniority & Needs Fit (10 pts)
    let academicFitScore = 7;
    const desigLower = (mentor.designation || '').toLowerCase();
    if (mentee.year >= 3 && (desigLower.includes('professor') || desigLower.includes('chair') || desigLower.includes('hod'))) {
      academicFitScore = 10;
    } else if (mentee.cgpa && parseFloat(mentee.cgpa) >= 9.0) {
      academicFitScore = 10;
    }

    const totalScore = Math.min(100, Math.max(0, skillsScore + deptScore + capacityScore + academicFitScore));

    let matchTier = 'Basic Match';
    if (totalScore >= 85) matchTier = 'Exceptional Match';
    else if (totalScore >= 70) matchTier = 'Strong Match';
    else if (totalScore >= 50) matchTier = 'Moderate Match';

    // Human-readable rationale highlights
    const rationale = [];
    if (matchedSkills.length > 0) {
      rationale.push(`Domain expertise matched on ${matchedSkills.slice(0, 3).join(', ')}${matchedSkills.length > 3 ? '...' : ''}`);
    }
    if (isSameDept) {
      rationale.push(`Direct department alignment (${mentor.department})`);
    } else if (deptScore >= 18) {
      rationale.push(`Interdisciplinary computing synergy`);
    }
    if (activeCount === 0) {
      rationale.push(`High availability: 0 active mentees currently assigned`);
    } else {
      rationale.push(`Current student load: ${activeCount} active mentees`);
    }

    return {
      mentorId: mentor.userid || mentor.UserID,
      mentorName: mentor.name || mentor.Name,
      mentorEmail: mentor.email || mentor.Email,
      department: mentor.department || mentor.Department,
      designation: mentor.designation || mentor.Designation,
      activeMenteesCount: activeCount,
      mentorSkills,
      matchScore: totalScore,
      matchTier,
      breakdown: {
        skillsScore,
        deptScore,
        capacityScore,
        academicFitScore,
      },
      matchedSkills,
      missingSkills,
      rationale,
    };
  });

  // Sort by highest match score descending, then lowest workload
  recommendations.sort((a, b) => b.matchScore - a.matchScore || a.activeMenteesCount - b.activeMenteesCount);

  return {
    mentee: {
      menteeId: mentee.userid,
      name: mentee.name,
      department: mentee.department,
      year: mentee.year,
      cgpa: mentee.cgpa,
      skills: menteeSkills,
    },
    recommendations,
  };
}

/**
 * Global Auto-Match Engine for all unassigned student mentees.
 * Uses greedy bipartite matching based on compatibility scores and mentor load limits.
 */
async function autoMatchAllUnassigned({ maxLoadPerMentor = 3 } = {}) {
  // 1. Get all unassigned mentees
  const unassignedRes = await query(`
    SELECT u.UserID, u.Name, u.Email, p.Department, p.Year, p.CGPA, p.Skills
    FROM USERS u
    JOIN USER_PROFILES p ON u.UserID = p.UserID
    WHERE u.Role = 'Mentee'
      AND NOT EXISTS (
        SELECT 1 FROM MENTORSHIP m
        WHERE m.MenteeID = u.UserID AND m.Status = 'Active'
      )
    ORDER BY p.Year DESC, p.CGPA DESC
  `);

  const unassigned = unassignedRes.rows;
  if (unassigned.length === 0) {
    return { matches: [], message: 'No unassigned mentees found.' };
  }

  // 2. Fetch mentor capacities
  const mentorsRes = await query(`
    SELECT u.UserID, u.Name, p.Department, p.Designation, p.Skills,
           COUNT(CASE WHEN m.Status = 'Active' THEN 1 END) AS ActiveCount
    FROM USERS u
    JOIN USER_PROFILES p ON u.UserID = p.UserID
    LEFT JOIN MENTORSHIP m ON u.UserID = m.MentorID
    WHERE u.Role = 'Mentor'
    GROUP BY u.UserID, u.Name, p.Department, p.Designation, p.Skills
  `);

  const mentorLoads = {};
  mentorsRes.rows.forEach((m) => {
    mentorLoads[m.userid] = parseInt(m.activecount || 0, 10);
  });

  const matches = [];

  for (const mentee of unassigned) {
    const recs = await getRecommendationsForMentee(mentee.userid);
    // Find best mentor who has not reached max capacity
    const bestMentor = recs.recommendations.find((rec) => {
      const currentLoad = mentorLoads[rec.mentorId] || 0;
      return currentLoad < maxLoadPerMentor;
    });

    if (bestMentor) {
      mentorLoads[bestMentor.mentorId] = (mentorLoads[bestMentor.mentorId] || 0) + 1;
      matches.push({
        menteeId: mentee.userid,
        menteeName: mentee.name,
        menteeDepartment: mentee.department,
        menteeYear: mentee.year,
        menteeSkills: mentee.skills || [],
        mentorId: bestMentor.mentorId,
        mentorName: bestMentor.mentorName,
        mentorDepartment: bestMentor.department,
        matchScore: bestMentor.matchScore,
        matchTier: bestMentor.matchTier,
        matchedSkills: bestMentor.matchedSkills,
        rationale: bestMentor.rationale,
      });
    }
  }

  return {
    totalUnassigned: unassigned.length,
    matchesCount: matches.length,
    matches,
  };
}

module.exports = {
  getRecommendationsForMentee,
  autoMatchAllUnassigned,
};
