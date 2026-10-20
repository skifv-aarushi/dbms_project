const { Pool } = require('pg');
const { PGlite } = require('@electric-sql/pglite');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

let pool = null;
let pgliteInstance = null;
let activeEngine = 'unknown';

async function connectDB() {
  const mode = process.env.PG_MODE || 'auto';

  // If explicit postgres is requested or in auto mode, try pg.Pool
  if (mode === 'postgres' || mode === 'auto') {
    const config = process.env.DATABASE_URL
      ? { connectionString: process.env.DATABASE_URL, connectionTimeoutMillis: 2000 }
      : {
          host: process.env.PGHOST || 'localhost',
          port: parseInt(process.env.PGPORT || '5432', 10),
          user: process.env.PGUSER || 'postgres',
          password: process.env.PGPASSWORD || 'postgres',
          database: process.env.PGDATABASE || 'mentor_mentee_db',
          connectionTimeoutMillis: 2000,
        };

    try {
      const testPool = new Pool(config);
      const client = await testPool.connect();
      await client.query('SELECT 1');
      client.release();
      pool = testPool;
      activeEngine = 'PostgreSQL (Native/Docker Server)';
      console.log(`[DB] Connected to ${activeEngine} on port ${config.port || 5432}`);
      return;
    } catch (err) {
      if (mode === 'postgres') {
        console.error('[DB] Native PostgreSQL connection failed and PG_MODE=postgres:', err.message);
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
    console.log('[DB] Database tables already exist. Skipping schema initialization.');
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
