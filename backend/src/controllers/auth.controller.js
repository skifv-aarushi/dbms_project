const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query } = require('../config/db');

const JWT_SECRET = process.env.JWT_SECRET || 'supersecret_mentor_mentee_jwt_key_2026_institutional_portal';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

async function register(req, res, next) {
  try {
    const { name, email, password, role, phone, department, designation, year, cgpa, skills } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: 'Name, email, password, and role are required.' });
    }

    if (!['Admin', 'Mentor', 'Mentee'].includes(role)) {
      return res.status(400).json({ error: "Role must be 'Admin', 'Mentor', or 'Mentee'." });
    }

    // Check if user already exists
    const existing = await query('SELECT UserID FROM USERS WHERE Email = $1', [email.trim().toLowerCase()]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'A user with this email address already exists.' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

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
      skillsArray = skills;
    } else if (typeof skills === 'string' && skills.trim()) {
      skillsArray = skills.split(',').map((s) => s.trim()).filter(Boolean);
    }

    let fauxData = null;
    if (role === 'Mentor') {
      const { generateMentorFauxData } = require('../utils/mentorFauxData');
      fauxData = generateMentorFauxData({
        userId,
        name: name.trim(),
        department: department || 'General',
        designation: designation || 'Faculty Mentor',
        skills: skillsArray,
      });
    }

    // Insert into USER_PROFILES (including faux fields for mentors)
    let profileRes;
    try {
      profileRes = await query(
        `INSERT INTO USER_PROFILES (UserID, Phone, Department, Designation, Year, CGPA, Skills, Bio, CitationsCount, HIndex, ResearchAreas, GoogleScholarURL)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
         RETURNING ProfileID, Phone, Department, Designation, Year, CGPA, Skills, Bio, CitationsCount, HIndex, ResearchAreas, GoogleScholarURL`,
        [
          userId,
          phone || null,
          department || 'General',
          role === 'Mentor' ? (designation || 'Faculty Mentor') : null,
          role === 'Mentee' && year ? parseInt(year, 10) : null,
          role === 'Mentee' && cgpa ? parseFloat(cgpa) : null,
          skillsArray,
          fauxData ? fauxData.bio : null,
          fauxData ? fauxData.citationsCount : 0,
          fauxData ? fauxData.hIndex : 0,
          fauxData ? fauxData.researchAreas : [],
          fauxData ? fauxData.googleScholarUrl : null,
        ]
      );
    } catch (insertErr) {
      // Fallback if schema does not yet include extended columns
      profileRes = await query(
        `INSERT INTO USER_PROFILES (UserID, Phone, Department, Designation, Year, CGPA, Skills)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING ProfileID, Phone, Department, Designation, Year, CGPA, Skills`,
        [
          userId,
          phone || null,
          department || 'General',
          role === 'Mentor' ? (designation || 'Faculty Mentor') : null,
          role === 'Mentee' && year ? parseInt(year, 10) : null,
          role === 'Mentee' && cgpa ? parseFloat(cgpa) : null,
          skillsArray,
        ]
      );
    }

    // Insert faux publications for newly created mentor
    if (role === 'Mentor' && fauxData?.publications) {
      for (const pub of fauxData.publications) {
        try {
          await query(
            `INSERT INTO FACULTY_PUBLICATIONS (MentorID, Title, Journal, Year, Citations, PaperURL)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [userId, pub.title, pub.journal, pub.year, pub.citations, pub.paperUrl]
          );
        } catch (_) {}
      }
    }

    const profile = profileRes.rows[0];

    // Generate JWT
    const token = jwt.sign(
      {
        userId,
        role: newUser.role || newUser.Role,
        name: newUser.name || newUser.Name,
        email: newUser.email || newUser.Email,
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.status(201).json({
      message: 'User registered successfully.',
      token,
      user: {
        userId,
        name: newUser.name || newUser.Name,
        email: newUser.email || newUser.Email,
        role: newUser.role || newUser.Role,
        profile,
      },
    });
  } catch (error) {
    next(error);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const userRes = await query(
      `SELECT u.UserID, u.Name, u.Email, u.PasswordHash, u.Role,
              p.ProfileID, p.Phone, p.Department, p.Designation, p.Year, p.CGPA, p.Skills
       FROM USERS u
       LEFT JOIN USER_PROFILES p ON u.UserID = p.UserID
       WHERE LOWER(u.Email) = LOWER($1)`,
      [email.trim()]
    );

    if (userRes.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password credentials.' });
    }

    const user = userRes.rows[0];
    const isMatch = await bcrypt.compare(password, user.passwordhash || user.PasswordHash);

    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password credentials.' });
    }

    const userId = user.userid || user.UserID;
    const role = user.role || user.Role;
    const name = user.name || user.Name;
    const userEmail = user.email || user.Email;

    const token = jwt.sign(
      { userId, role, name, email: userEmail },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.json({
      message: 'Login successful.',
      token,
      user: {
        userId,
        name,
        email: userEmail,
        role,
        profile: {
          profileId: user.profileid || user.ProfileID,
          phone: user.phone || user.Phone,
          department: user.department || user.Department,
          designation: user.designation || user.Designation,
          year: user.year || user.Year,
          cgpa: user.cgpa || user.CGPA,
          skills: user.skills || user.Skills || [],
        },
      },
    });
  } catch (error) {
    next(error);
  }
}

async function getMe(req, res, next) {
  try {
    const userId = req.user.userId;

    const userRes = await query(
      `SELECT u.UserID, u.Name, u.Email, u.Role, u.CreatedAt,
              p.ProfileID, p.Phone, p.Department, p.Designation, p.Year, p.CGPA, p.Skills
       FROM USERS u
       LEFT JOIN USER_PROFILES p ON u.UserID = p.UserID
       WHERE u.UserID = $1`,
      [userId]
    );

    if (userRes.rows.length === 0) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const user = userRes.rows[0];

    res.json({
      user: {
        userId: user.userid || user.UserID,
        name: user.name || user.Name,
        email: user.email || user.Email,
        role: user.role || user.Role,
        createdAt: user.createdat || user.CreatedAt,
        profile: {
          profileId: user.profileid || user.ProfileID,
          phone: user.phone || user.Phone,
          department: user.department || user.Department,
          designation: user.designation || user.Designation,
          year: user.year || user.Year,
          cgpa: user.cgpa || user.CGPA,
          skills: user.skills || user.Skills || [],
        },
      },
    });
  } catch (error) {
    next(error);
  }
}

async function updateProfile(req, res, next) {
  try {
    const userId = req.user.userId;
    const { phone, department, designation, year, cgpa, skills } = req.body;

    let skillsArray = skills;
    if (typeof skills === 'string') {
      skillsArray = skills.split(',').map((s) => s.trim()).filter(Boolean);
    }

    const updated = await query(
      `UPDATE USER_PROFILES
       SET Phone = COALESCE($1, Phone),
           Department = COALESCE($2, Department),
           Designation = COALESCE($3, Designation),
           Year = COALESCE($4, Year),
           CGPA = COALESCE($5, CGPA),
           Skills = COALESCE($6, Skills)
       WHERE UserID = $7
       RETURNING *`,
      [
        phone !== undefined ? phone : null,
        department !== undefined ? department : null,
        designation !== undefined ? designation : null,
        year !== undefined && year !== null ? parseInt(year, 10) : null,
        cgpa !== undefined && cgpa !== null ? parseFloat(cgpa) : null,
        skillsArray !== undefined ? skillsArray : null,
        userId,
      ]
    );

    res.json({
      message: 'Profile updated successfully.',
      profile: updated.rows[0],
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  register,
  login,
  getMe,
  updateProfile,
};
