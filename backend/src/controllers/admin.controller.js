const { query } = require('../config/db');

// POST /api/admin/allocations
async function createAllocation(req, res, next) {
  try {
    const { mentorId, menteeId, startDate } = req.body;

    const parsedMentorId = parseInt(mentorId, 10);
    const parsedMenteeId = parseInt(menteeId, 10);

    if (isNaN(parsedMentorId) || isNaN(parsedMenteeId)) {
      return res.status(400).json({ error: 'Valid numeric mentorId and menteeId are required.' });
    }

    // Verify Mentor existence & role
    const mentorCheck = await query('SELECT UserID, Role, Name FROM USERS WHERE UserID = $1', [parsedMentorId]);
    if (mentorCheck.rows.length === 0 || mentorCheck.rows[0].role !== 'Mentor') {
      return res.status(400).json({ error: 'Invalid mentorId: User does not exist or is not a Faculty Mentor.' });
    }

    // Verify Mentee existence & role
    const menteeCheck = await query('SELECT UserID, Role, Name FROM USERS WHERE UserID = $1', [parsedMenteeId]);
    if (menteeCheck.rows.length === 0 || menteeCheck.rows[0].role !== 'Mentee') {
      return res.status(400).json({ error: 'Invalid menteeId: User does not exist or is not a Student Mentee.' });
    }

    // Check if student already has an active mentorship
    const existingActive = await query(
      `SELECT m.MentorshipID, u.Name AS MentorName
       FROM MENTORSHIP m
       JOIN USERS u ON m.MentorID = u.UserID
       WHERE m.MenteeID = $1 AND m.Status = 'Active'`,
      [parsedMenteeId]
    );
    if (existingActive.rows.length > 0) {
      return res.status(409).json({
        error: `${menteeCheck.rows[0].name} already has an active mentor assigned (${existingActive.rows[0].mentorname}). You must mark the existing pairing as Completed or Terminated first.`,
      });
    }

    // Verify mentor has not reached the 3-mentee hard cap
    const mentorLoadRes = await query(
      `SELECT COUNT(*) AS ActiveCount FROM MENTORSHIP WHERE MentorID = $1 AND Status = 'Active'`,
      [parsedMentorId]
    );
    const activeMenteesCount = parseInt(mentorLoadRes.rows[0]?.activecount || 0, 10);
    if (activeMenteesCount >= 3) {
      return res.status(400).json({
        error: `Faculty Mentor ${mentorCheck.rows[0].name} has reached the maximum capacity of 3 active mentees.`,
      });
    }

    // Insert into MENTORSHIP (Will trigger enforce_mentorship_constraints() in PostgreSQL)
    const result = await query(
      `INSERT INTO MENTORSHIP (MentorID, MenteeID, StartDate, Status)
       VALUES ($1, $2, COALESCE($3::DATE, CURRENT_DATE), 'Active')
       RETURNING MentorshipID, MentorID, MenteeID, StartDate, Status`,
      [parsedMentorId, parsedMenteeId, startDate || null]
    );

    const newPairing = result.rows[0];

    res.status(201).json({
      message: `Successfully allocated student ${menteeCheck.rows[0].name} to mentor ${mentorCheck.rows[0].name}.`,
      mentorName: mentorCheck.rows[0].name,
      menteeName: menteeCheck.rows[0].name,
      allocation: newPairing,
    });
  } catch (error) {
    next(error);
  }
}

// GET /api/admin/allocations
async function getAllAllocations(req, res, next) {
  try {
    const { status } = req.query;

    let sql = `
      SELECT 
        m.MentorshipID,
        m.MentorID,
        m.MenteeID,
        m.StartDate,
        m.EndDate,
        m.Status,
        u_men.Name AS MentorName,
        u_men.Email AS MentorEmail,
        p_men.Department AS MentorDepartment,
        p_men.Designation AS MentorDesignation,
        u_tee.Name AS MenteeName,
        u_tee.Email AS MenteeEmail,
        p_tee.Department AS MenteeDepartment,
        p_tee.Year AS MenteeYear,
        p_tee.CGPA AS MenteeCGPA,
        p_tee.Skills AS MenteeSkills,
        COUNT(mt.MeetingID) AS TotalMeetings,
        COUNT(CASE WHEN mt.Status = 'Completed' THEN 1 END) AS CompletedMeetings
      FROM MENTORSHIP m
      JOIN USERS u_men ON m.MentorID = u_men.UserID
      LEFT JOIN USER_PROFILES p_men ON u_men.UserID = p_men.UserID
      JOIN USERS u_tee ON m.MenteeID = u_tee.UserID
      LEFT JOIN USER_PROFILES p_tee ON u_tee.UserID = p_tee.UserID
      LEFT JOIN MEETING mt ON m.MentorshipID = mt.MentorshipID
    `;

    const params = [];
    if (status) {
      sql += ' WHERE m.Status = $1';
      params.push(status);
    }

    sql += `
      GROUP BY 
        m.MentorshipID, m.MentorID, m.MenteeID, m.StartDate, m.EndDate, m.Status,
        u_men.Name, u_men.Email, p_men.Department, p_men.Designation,
        u_tee.Name, u_tee.Email, p_tee.Department, p_tee.Year, p_tee.CGPA, p_tee.Skills
      ORDER BY m.StartDate DESC, m.MentorshipID DESC
    `;

    const result = await query(sql, params);
    res.json({ allocations: result.rows });
  } catch (error) {
    next(error);
  }
}

// PATCH /api/admin/allocations/:id
async function updateAllocationStatus(req, res, next) {
  try {
    const { id } = req.params;
    const { status, endDate } = req.body;

    if (!['Active', 'Completed', 'Terminated'].includes(status)) {
      return res.status(400).json({ error: "Status must be 'Active', 'Completed', or 'Terminated'." });
    }

    const result = await query(
      `UPDATE MENTORSHIP
       SET Status = $1,
           EndDate = CASE 
             WHEN $1 IN ('Completed', 'Terminated') THEN COALESCE($2::DATE, CURRENT_DATE)
             ELSE NULL 
           END
       WHERE MentorshipID = $3
       RETURNING *`,
      [status, endDate || null, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Mentorship allocation not found.' });
    }

    res.json({
      message: `Mentorship pairing status updated to ${status}.`,
      allocation: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
}

// GET /api/admin/unassigned-mentees
async function getUnassignedMentees(req, res, next) {
  try {
    const result = await query(`
      SELECT 
        u.UserID,
        u.Name,
        u.Email,
        p.Department,
        p.Year,
        p.CGPA,
        p.Skills,
        p.Phone
      FROM USERS u
      LEFT JOIN USER_PROFILES p ON u.UserID = p.UserID
      WHERE u.Role = 'Mentee'
        AND NOT EXISTS (
          SELECT 1 FROM MENTORSHIP m
          WHERE m.MenteeID = u.UserID AND m.Status = 'Active'
        )
      ORDER BY p.Department, p.Year DESC, u.Name ASC
    `);

    res.json({ unassignedMentees: result.rows });
  } catch (error) {
    next(error);
  }
}

// GET /api/admin/mentors-load
async function getMentorsLoad(req, res, next) {
  try {
    const result = await query(`
      SELECT 
        u.UserID,
        u.Name,
        u.Email,
        p.Department,
        p.Designation,
        p.Phone,
        COUNT(CASE WHEN m.Status = 'Active' THEN 1 END) AS ActiveMenteesCount
      FROM USERS u
      LEFT JOIN USER_PROFILES p ON u.UserID = p.UserID
      LEFT JOIN MENTORSHIP m ON u.UserID = m.MentorID
      WHERE u.Role = 'Mentor'
      GROUP BY u.UserID, u.Name, u.Email, p.Department, p.Designation, p.Phone
      ORDER BY ActiveMenteesCount ASC, u.Name ASC
    `);

    const mentorsWithCapacity = result.rows.map((row) => {
      const activeCount = parseInt(row.activementeescount || 0, 10);
      return {
        ...row,
        activeMenteesCount: activeCount,
        maxCapacity: 3,
        slotsRemaining: Math.max(0, 3 - activeCount),
        isFull: activeCount >= 3,
      };
    });

    res.json({ mentors: mentorsWithCapacity });
  } catch (error) {
    next(error);
  }
}

// GET /api/admin/reports
async function getReports(req, res, next) {
  try {
    // 1. Query analytical relational view View_MentorshipPerformance
    const viewResult = await query(`
      SELECT * FROM View_MentorshipPerformance
      ORDER BY MentorshipID DESC
    `);

    // 2. Query high-level institutional summary metrics
    const statsResult = await query(`
      SELECT
        (SELECT COUNT(*) FROM USERS WHERE Role = 'Mentor') AS TotalMentors,
        (SELECT COUNT(*) FROM USERS WHERE Role = 'Mentee') AS TotalMentees,
        (SELECT COUNT(*) FROM MENTORSHIP WHERE Status = 'Active') AS ActiveMentorships,
        (SELECT COUNT(*) FROM MENTORSHIP WHERE Status = 'Completed') AS CompletedMentorships,
        (SELECT COUNT(*) FROM MEETING) AS TotalMeetings,
        (SELECT COUNT(*) FROM MEETING WHERE Status = 'Completed') AS CompletedMeetings,
        ROUND((SELECT AVG(MenteeRating) FROM MEETING WHERE MenteeRating IS NOT NULL), 2) AS AvgSatisfactionScore,
        ROUND((SELECT AVG(MentorRating) FROM MEETING WHERE MentorRating IS NOT NULL), 2) AS AvgMentorRating
    `);

    // 3. Department breakdown
    const deptResult = await query(`
      SELECT 
        p.Department,
        COUNT(DISTINCT u.UserID) FILTER (WHERE u.Role = 'Mentee') AS MenteesCount,
        COUNT(DISTINCT u.UserID) FILTER (WHERE u.Role = 'Mentor') AS MentorsCount,
        COUNT(DISTINCT m.MentorshipID) FILTER (WHERE m.Status = 'Active') AS ActivePairings
      FROM USER_PROFILES p
      JOIN USERS u ON p.UserID = u.UserID
      LEFT JOIN MENTORSHIP m ON (u.UserID = m.MenteeID OR u.UserID = m.MentorID)
      GROUP BY p.Department
      ORDER BY p.Department
    `);

    res.json({
      summary: statsResult.rows[0],
      performanceView: viewResult.rows,
      departmentStats: deptResult.rows,
    });
  } catch (error) {
    next(error);
  }
}

// GET /api/admin/users
async function getAllUsers(req, res, next) {
  try {
    const { role, department, search } = req.query;

    let sql = `
      SELECT 
        u.UserID,
        u.Name,
        u.Email,
        u.Role,
        u.CreatedAt,
        p.Phone,
        p.Department,
        p.Designation,
        p.Year,
        p.CGPA,
        p.Skills
      FROM USERS u
      JOIN USER_PROFILES p ON u.UserID = p.UserID
      WHERE 1=1
    `;

    const params = [];
    let paramIndex = 1;

    if (role) {
      sql += ` AND u.Role = $${paramIndex++}`;
      params.push(role);
    }

    if (department) {
      sql += ` AND p.Department ILIKE $${paramIndex++}`;
      params.push(`%${department}%`);
    }

    if (search) {
      sql += ` AND (u.Name ILIKE $${paramIndex} OR u.Email ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    sql += ' ORDER BY u.Role, u.Name ASC';

    const result = await query(sql, params);
    res.json({ users: result.rows });
  } catch (error) {
    next(error);
  }
}

// GET /api/admin/recommendations/:menteeId
async function getMenteeRecommendations(req, res, next) {
  try {
    const { menteeId } = req.params;
    const { getRecommendationsForMentee } = require('../services/recommender.service');
    const result = await getRecommendationsForMentee(menteeId);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

// GET /api/admin/auto-match
async function getAutoMatchPreview(req, res, next) {
  try {
    const { autoMatchAllUnassigned } = require('../services/recommender.service');
    const result = await autoMatchAllUnassigned();
    res.json(result);
  } catch (error) {
    next(error);
  }
}

// POST /api/admin/auto-match/apply
async function applyAutoMatch(req, res, next) {
  try {
    const { autoMatchAllUnassigned } = require('../services/recommender.service');
    const preview = await autoMatchAllUnassigned();
    const createdPairings = [];

    for (const match of preview.matches) {
      const insertRes = await query(
        `INSERT INTO MENTORSHIP (MentorID, MenteeID, StartDate, Status)
         VALUES ($1, $2, CURRENT_DATE, 'Active')
         RETURNING *`,
        [match.mentorId, match.menteeId]
      );
      createdPairings.push(insertRes.rows[0]);
    }

    res.json({
      message: `Successfully created ${createdPairings.length} rule-recommended mentorship pairings.`,
      pairings: createdPairings,
    });
  } catch (error) {
    next(error);
  }
}

// POST /api/admin/users
async function createUser(req, res, next) {
  try {
    const bcrypt = require('bcryptjs');
    const {
      name,
      email,
      password = 'password123',
      role,
      phone,
      department,
      designation,
      year,
      cgpa,
      skills,
    } = req.body;

    if (!name || !email || !role) {
      return res.status(400).json({ error: 'Name, email, and role are required.' });
    }

    if (!['Admin', 'Mentor', 'Mentee'].includes(role)) {
      return res.status(400).json({ error: "Role must be 'Admin', 'Mentor', or 'Mentee'." });
    }

    // Check if user already exists
    const existing = await query('SELECT UserID FROM USERS WHERE LOWER(Email) = LOWER($1)', [email.trim()]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'A user with this email address already exists.' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password || 'password123', salt);

    // Insert into USERS
    const userRes = await query(
      `INSERT INTO USERS (Name, Email, PasswordHash, Role)
       VALUES ($1, $2, $3, $4)
       RETURNING UserID, Name, Email, Role, CreatedAt`,
      [name.trim(), email.trim().toLowerCase(), passwordHash, role]
    );

    const newUser = userRes.rows[0];
    const userId = newUser.userid || newUser.UserID;

    // Format skills array for PostgreSQL
    let skillsArray = [];
    if (Array.isArray(skills)) {
      skillsArray = skills.map((s) => s.trim()).filter(Boolean);
    } else if (typeof skills === 'string' && skills.trim()) {
      skillsArray = skills.split(',').map((s) => s.trim()).filter(Boolean);
    }

    // Determine profile fields
    const parsedYear = role === 'Mentee' && year ? parseInt(year, 10) : (role === 'Mentee' ? 1 : null);
    const parsedCgpa = role === 'Mentee' && cgpa ? parseFloat(cgpa) : (role === 'Mentee' ? 8.00 : null);
    const resolvedDesignation = role === 'Mentor' ? (designation || 'Faculty Mentor') : null;

    // Insert into USER_PROFILES
    const profileRes = await query(
      `INSERT INTO USER_PROFILES (UserID, Phone, Department, Designation, Year, CGPA, Skills)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING ProfileID, Phone, Department, Designation, Year, CGPA, Skills`,
      [
        userId,
        phone || null,
        department || 'Computer Science and Engineering',
        resolvedDesignation,
        parsedYear,
        parsedCgpa,
        skillsArray,
      ]
    );

    res.status(201).json({
      message: `${role} "${newUser.name || newUser.Name}" registered successfully!`,
      user: {
        userId,
        name: newUser.name || newUser.Name,
        email: newUser.email || newUser.Email,
        role: newUser.role || newUser.Role,
        profile: profileRes.rows[0],
      },
    });
  } catch (error) {
    next(error);
  }
}

// DELETE /api/admin/users/:id
async function deleteUser(req, res, next) {
  try {
    const { id } = req.params;
    const targetId = parseInt(id, 10);

    if (req.user && req.user.userId === targetId) {
      return res.status(400).json({ error: 'Cannot delete your own administrative account.' });
    }

    const check = await query('SELECT UserID, Name, Role FROM USERS WHERE UserID = $1', [targetId]);
    if (check.rows.length === 0) {
      return res.status(404).json({ error: 'User not found.' });
    }

    await query('DELETE FROM USERS WHERE UserID = $1', [targetId]);
    res.json({ message: `${check.rows[0].role} "${check.rows[0].name}" removed from the platform.` });
  } catch (error) {
    next(error);
  }
}

// POST /api/admin/reseed
async function reseedDatabase(req, res, next) {
  try {
    const { initDatabase } = require('../config/db');
    await initDatabase({ force: true });
    res.json({ message: 'Database successfully re-seeded with updated sample records.' });
  } catch (error) {
    next(error);
  }
}

module.exports = {
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
};
