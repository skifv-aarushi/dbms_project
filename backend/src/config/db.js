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
      const pubCheck = await query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = 'faculty_publications'
        );
      `);
      const publicationsExist = pubCheck.rows[0]?.exists;
      if (!publicationsExist) {
        console.log('[DB] Synchronizing schema: creating FACULTY_PUBLICATIONS, profile extensions, and 3-mentee hard cap trigger...');
        const migrationSql = `
          ALTER TABLE USER_PROFILES ADD COLUMN IF NOT EXISTS Bio TEXT;
          ALTER TABLE USER_PROFILES ADD COLUMN IF NOT EXISTS CitationsCount INT DEFAULT 0;
          ALTER TABLE USER_PROFILES ADD COLUMN IF NOT EXISTS HIndex INT DEFAULT 0;
          ALTER TABLE USER_PROFILES ADD COLUMN IF NOT EXISTS ResearchAreas TEXT[] DEFAULT '{}';
          ALTER TABLE USER_PROFILES ADD COLUMN IF NOT EXISTS GoogleScholarURL VARCHAR(255);

          CREATE TABLE IF NOT EXISTS FACULTY_PUBLICATIONS (
            PublicationID SERIAL PRIMARY KEY,
            MentorID INT NOT NULL REFERENCES USERS(UserID) ON DELETE CASCADE,
            Title VARCHAR(255) NOT NULL,
            Journal VARCHAR(200) NOT NULL,
            Year INT NOT NULL,
            Citations INT DEFAULT 0 NOT NULL,
            PaperURL VARCHAR(255)
          );
          CREATE INDEX IF NOT EXISTS idx_fac_pub_mentor ON FACULTY_PUBLICATIONS(MentorID, Year);

          CREATE OR REPLACE FUNCTION enforce_mentorship_constraints()
          RETURNS TRIGGER AS $$
          BEGIN
            IF NEW.Status = 'Active' THEN
              -- Rule 1: Single active mentorship per student mentee
              IF EXISTS (
                SELECT 1 FROM MENTORSHIP 
                WHERE MenteeID = NEW.MenteeID 
                  AND Status = 'Active' 
                  AND MentorshipID <> COALESCE(NEW.MentorshipID, -1)
              ) THEN
                RAISE EXCEPTION 'Constraint Violation: Mentee (ID %) already has an active mentorship pairing.', NEW.MenteeID;
              END IF;

              -- Rule 2: Hard Cap: Maximum 3 active mentees per faculty mentor
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

          DROP TRIGGER IF EXISTS trg_single_active_mentorship ON MENTORSHIP CASCADE;
          DROP TRIGGER IF EXISTS trg_mentorship_constraints ON MENTORSHIP CASCADE;

          CREATE TRIGGER trg_mentorship_constraints
          BEFORE INSERT OR UPDATE ON MENTORSHIP
          FOR EACH ROW EXECUTE FUNCTION enforce_mentorship_constraints();

          UPDATE USER_PROFILES 
          SET Bio = 'Associate Professor in CSE with 14+ years of academic research in distributed databases, consensus protocols, and query optimization. Leads the Systems & Data Architecture Lab.',
              CitationsCount = 485,
              HIndex = 12,
              ResearchAreas = ARRAY['Distributed Databases', 'Query Optimization', 'Cloud Storage Systems', 'Data Consistency'],
              GoogleScholarURL = 'https://scholar.google.com/citations?user=sunita_rao'
          WHERE UserID = 2;

          UPDATE USER_PROFILES 
          SET Bio = 'Professor & Head of Department in Information Technology. Research focus on resilient cloud architectures, container orchestration, high-throughput microservices, and ACID compliance in distributed storage.',
              CitationsCount = 820,
              HIndex = 16,
              ResearchAreas = ARRAY['Cloud Native Architectures', 'Distributed Transactions', 'Microservices', 'Kubernetes Orchestration'],
              GoogleScholarURL = 'https://scholar.google.com/citations?user=vikram_malhotra'
          WHERE UserID = 3;

          UPDATE USER_PROFILES 
          SET Bio = 'Assistant Professor in Electronics & Communication. Research encompasses low-power IoT telemetry, edge intelligence algorithms, and fault-tolerant embedded sensor networks.',
              CitationsCount = 310,
              HIndex = 9,
              ResearchAreas = ARRAY['Embedded Systems', 'IoT Edge Intelligence', 'Ultra-Low Power Telemetry', 'Digital Signal Processing'],
              GoogleScholarURL = 'https://scholar.google.com/citations?user=ananya_sen'
          WHERE UserID = 4;

          INSERT INTO FACULTY_PUBLICATIONS (PublicationID, MentorID, Title, Journal, Year, Citations, PaperURL) VALUES
          (1, 2, 'Scalable Query Optimization in Distributed Cloud Databases', 'IEEE Transactions on Knowledge and Data Engineering (TKDE)', 2023, 142, 'https://doi.org/10.1109/TKDE.2023.1002'),
          (2, 2, 'Fault-Tolerant Consensus Protocols for Decentralized Data Networks', 'ACM Computing Surveys', 2021, 198, 'https://doi.org/10.1145/3412345'),
          (3, 2, 'Adaptive Indexing Strategies for Hybrid Transactional/Analytical Workloads', 'Proceedings of the VLDB Endowment', 2019, 145, 'https://doi.org/10.14778/3345678'),

          (4, 3, 'Zero-Downtime Migration Protocols for Cloud-Native Relational Databases', 'IEEE Transactions on Cloud Computing', 2022, 310, 'https://doi.org/10.1109/TCC.2022.9876'),
          (5, 3, 'Latency-Aware Resource Allocation in Multi-Tenant Kubernetes Clusters', 'Journal of Systems and Software', 2020, 260, 'https://doi.org/10.1016/j.jss.2020.110'),
          (6, 3, 'Automated Partitioning and Sharding in Distributed PostgreSQL Engines', 'ACM SIGMOD Record', 2018, 250, 'https://doi.org/10.1145/3299869'),

          (7, 4, 'Ultra-Low Power Edge Inference for Distributed Sensor Networks', 'IEEE Internet of Things Journal', 2023, 115, 'https://doi.org/10.1109/JIOT.2023.7744'),
          (8, 4, 'Energy-Harvesting Protocols for Autonomous Industrial IoT Nodes', 'IEEE Sensors Journal', 2021, 125, 'https://doi.org/10.1109/JSEN.2021.5512'),
          (9, 4, 'Real-Time Embedded Telemetry for Smart Campus Infrastructures', 'Microprocessors and Microsystems', 2020, 70, 'https://doi.org/10.1016/j.micpro.2020.103')
          ON CONFLICT (PublicationID) DO NOTHING;

          ALTER SEQUENCE faculty_publications_publicationid_seq RESTART WITH 10;
        `;

        if (pool) {
          await pool.query(migrationSql);
        } else {
          await pgliteInstance.exec(migrationSql);
        }
        console.log('[DB] Schema and publications synchronized successfully.');
      } else {
        console.log('[DB] Database schema and publications already up-to-date.');
      }
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
