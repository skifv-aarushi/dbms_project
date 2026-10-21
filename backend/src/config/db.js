const { Pool } = require('pg');
const { PGlite } = require('@electric-sql/pglite');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

let pool = null;
let pgliteInstance = null;
let activeEngine = 'unknown';

async function connectDB() {
  if (pool || pgliteInstance) {
    return;
  }

  const mode = process.env.PG_MODE || 'auto';

  // Check if running in a serverless environment like Vercel
  const isServerless = !!process.env.VERCEL || process.env.NODE_ENV === 'production';

  if (process.env.VERCEL && !process.env.DATABASE_URL) {
    throw new Error(
      'Vercel serverless deployment requires a DATABASE_URL environment variable pointing to a hosted PostgreSQL instance (e.g. Neon, Supabase, or Aiven).'
    );
  }

  // If explicit postgres is requested, DATABASE_URL is present, or in auto mode, try pg.Pool
  if (process.env.DATABASE_URL || mode === 'postgres' || mode === 'auto') {
    const config = process.env.DATABASE_URL
      ? {
          connectionString: process.env.DATABASE_URL,
          ssl: process.env.PG_SSL === 'false' ? false : { rejectUnauthorized: false },
          connectionTimeoutMillis: 10000,
          max: parseInt(process.env.PG_MAX_CLIENTS || '10', 10),
        }
      : {
          host: process.env.PGHOST || 'localhost',
          port: parseInt(process.env.PGPORT || '5432', 10),
          user: process.env.PGUSER || 'postgres',
          password: process.env.PGPASSWORD || 'postgres',
          database: process.env.PGDATABASE || 'mentor_mentee_db',
          connectionTimeoutMillis: 5000,
        };

    try {
      const testPool = new Pool(config);
      const client = await testPool.connect();
      await client.query('SELECT 1');
      client.release();
      pool = testPool;
      activeEngine = 'PostgreSQL (Cloud / Native Server)';
      console.log(`[DB] Connected to ${activeEngine}`);
      return;
    } catch (err) {
      if (mode === 'postgres' || isServerless) {
        console.error('[DB] PostgreSQL connection failed:', err.message);
        throw err;
      }
      console.log(`[DB] Native PostgreSQL server not detected (${err.message}). Using persistent PGlite PostgreSQL WASM engine.`);
    }
  }

  // Fallback to persistent PGlite (Real PostgreSQL WASM engine)
  const dataDir = path.resolve(__dirname, '../../pgdata');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  // Remove stale postmaster.pid or lock files if previous process was abruptly terminated
  const pidFile = path.join(dataDir, 'postmaster.pid');
  if (fs.existsSync(pidFile)) {
    try {
      fs.unlinkSync(pidFile);
    } catch (_) {}
  }

  pgliteInstance = new PGlite(dataDir);
  await pgliteInstance.waitReady;
  activeEngine = 'PostgreSQL (PGlite Persistent WASM Engine)';
  console.log(`[DB] Initialized ${activeEngine} at ${dataDir}`);
}

async function query(text, params = []) {
  if (!pool && !pgliteInstance) {
    await connectDB();
  }

  try {
    if (pool) {
      const res = await pool.query(text, params);
      return res;
    } else {
      const res = await pgliteInstance.query(text, params);
      return res;
    }
  } catch (error) {
    console.error(`[DB Query Error] Query: "${text.substring(0, 100)}..." ->`, error.message);
    throw error;
  }
}

async function initDatabase({ force = false } = {}) {
  if (!pool && !pgliteInstance) {
    await connectDB();
  }

  // Check if tables already exist
  const checkTableQuery = `
    SELECT EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_name = 'users'
    );
  `;
  const tableCheck = await query(checkTableQuery);
  const usersExist = tableCheck.rows[0]?.exists;

  if (usersExist && !force) {
    console.log('[DB] Database tables exist. Verifying schema extensions...');
    try {
      console.log('[DB] Synchronizing schema: verifying FACULTY_PUBLICATIONS, profile extensions, and 3-mentee hard cap trigger...');
      
      // 1. Ensure columns exist on USER_PROFILES
      await query(`ALTER TABLE USER_PROFILES ADD COLUMN IF NOT EXISTS Bio TEXT`);
      await query(`ALTER TABLE USER_PROFILES ADD COLUMN IF NOT EXISTS CitationsCount INT DEFAULT 0`);
      await query(`ALTER TABLE USER_PROFILES ADD COLUMN IF NOT EXISTS HIndex INT DEFAULT 0`);
      await query(`ALTER TABLE USER_PROFILES ADD COLUMN IF NOT EXISTS ResearchAreas TEXT[] DEFAULT '{}'`);
      await query(`ALTER TABLE USER_PROFILES ADD COLUMN IF NOT EXISTS GoogleScholarURL VARCHAR(255)`);

      // 2. Ensure FACULTY_PUBLICATIONS table exists
      await query(`
        CREATE TABLE IF NOT EXISTS FACULTY_PUBLICATIONS (
          PublicationID SERIAL PRIMARY KEY,
          MentorID INT NOT NULL REFERENCES USERS(UserID) ON DELETE CASCADE,
          Title VARCHAR(255) NOT NULL,
          Journal VARCHAR(200) NOT NULL,
          Year INT NOT NULL,
          Citations INT DEFAULT 0 NOT NULL,
          PaperURL VARCHAR(255)
        )
      `);
      await query(`CREATE INDEX IF NOT EXISTS idx_fac_pub_mentor ON FACULTY_PUBLICATIONS(MentorID, Year)`);

      // 3. Ensure institutional 3-mentee hard cap trigger exists
      try {
        await query(`
          CREATE OR REPLACE FUNCTION enforce_mentorship_constraints()
          RETURNS TRIGGER AS $$
          BEGIN
            IF NEW.Status = 'Active' THEN
              IF EXISTS (
                SELECT 1 FROM MENTORSHIP 
                WHERE MenteeID = NEW.MenteeID 
                  AND Status = 'Active' 
                  AND MentorshipID <> COALESCE(NEW.MentorshipID, -1)
              ) THEN
                RAISE EXCEPTION 'Constraint Violation: Mentee (ID %) already has an active mentorship pairing.', NEW.MenteeID;
              END IF;

              IF (
                SELECT COUNT(*) FROM MENTORSHIP 
                WHERE MentorID = NEW.MentorID 
                  AND Status = 'Active' 
                  AND MentorshipID <> COALESCE(NEW.MentorshipID, -1)
              ) >= 3 THEN
                RAISE EXCEPTION 'Constraint Violation: Faculty Mentor (ID %) has reached maximum capacity of 3 active mentees.', NEW.MentorID;
              END IF;
            END IF;
            RETURN NEW;
          END;
          $$ LANGUAGE plpgsql;
        `);
        await query(`DROP TRIGGER IF EXISTS trg_mentorship_constraints ON MENTORSHIP CASCADE`);
        await query(`
          CREATE TRIGGER trg_mentorship_constraints
          BEFORE INSERT OR UPDATE ON MENTORSHIP
          FOR EACH ROW EXECUTE FUNCTION enforce_mentorship_constraints()
        `);
      } catch (trigErr) {
        console.warn('[DB Trigger Notice]', trigErr.message);
      }

      // 4. Populate faux data for any mentors missing bio or publications
      try {
        const { generateMentorFauxData } = require('../utils/mentorFauxData');
        const mentorsRes = await query(`
          SELECT u.UserID, u.Name, u.Email, p.Department, p.Designation, p.Skills, p.Bio, p.CitationsCount
          FROM USERS u
          JOIN USER_PROFILES p ON u.UserID = p.UserID
          WHERE u.Role = 'Mentor'
        `);

        for (const m of mentorsRes.rows) {
          const faux = generateMentorFauxData({
            userId: m.userid,
            name: m.name,
            department: m.department,
            designation: m.designation,
            skills: m.skills,
          });

          // Update profile if bio or citations missing
          if (!m.bio || !m.citationscount || parseInt(m.citationscount, 10) === 0) {
            await query(
              `UPDATE USER_PROFILES 
               SET Bio = COALESCE(NULLIF(Bio, ''), $1),
                   CitationsCount = CASE WHEN CitationsCount IS NULL OR CitationsCount = 0 THEN $2 ELSE CitationsCount END,
                   HIndex = CASE WHEN HIndex IS NULL OR HIndex = 0 THEN $3 ELSE HIndex END,
                   ResearchAreas = CASE WHEN ResearchAreas IS NULL OR ResearchAreas = '{}' THEN $4 ELSE ResearchAreas END,
                   GoogleScholarURL = COALESCE(GoogleScholarURL, $5)
               WHERE UserID = $6`,
              [faux.bio, faux.citationsCount, faux.hIndex, faux.researchAreas, faux.googleScholarUrl, m.userid]
            );
          }

          // Check if mentor has publications, if not insert 3 faux publications
          const pCountRes = await query(`SELECT COUNT(*) AS count FROM FACULTY_PUBLICATIONS WHERE MentorID = $1`, [m.userid]);
          if (parseInt(pCountRes.rows[0]?.count || 0, 10) === 0) {
            for (const pub of faux.publications) {
              await query(
                `INSERT INTO FACULTY_PUBLICATIONS (MentorID, Title, Journal, Year, Citations, PaperURL)
                 VALUES ($1, $2, $3, $4, $5, $6)`,
                [m.userid, pub.title, pub.journal, pub.year, pub.citations, pub.paperUrl]
              );
            }
          }
        }
      } catch (fauxErr) {
        console.warn('[DB Faux Data Notice]', fauxErr.message);
      }

      console.log('[DB] Schema, faculty publications, and profile extensions synchronized successfully.');
    } catch (syncErr) {
      console.error('[DB Sync Error]', syncErr.message);
    }
    return;
  }

  console.log('[DB] Initializing database schema & seed data...');
  const schemaPath = path.resolve(__dirname, '../../../database/schema.sql');
  const seedPath = path.resolve(__dirname, '../../../database/seed.sql');

  const schemaSql = fs.readFileSync(schemaPath, 'utf8');
  const seedSql = fs.readFileSync(seedPath, 'utf8');

  if (pool) {
    await pool.query(schemaSql);
    console.log('[DB] Schema executed successfully.');
    await pool.query(seedSql);
    console.log('[DB] Seed data populated successfully.');
  } else {
    await pgliteInstance.exec(schemaSql);
    console.log('[DB] Schema executed successfully on PGlite.');
    await pgliteInstance.exec(seedSql);
    console.log('[DB] Seed data populated successfully on PGlite.');
  }
}

module.exports = {
  query,
  initDatabase,
  connectDB,
  getActiveEngine: () => activeEngine
};
