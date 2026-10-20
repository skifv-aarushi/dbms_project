require('dotenv').config();
const app = require('./app');
const { initDatabase, getActiveEngine } = require('./config/db');

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    console.log('[Server] Connecting to database and checking tables...');
    await initDatabase();
    console.log(`[Server] Database ready using ${getActiveEngine()}.`);

    app.listen(PORT, () => {
      console.log(`========================================================`);
      console.log(` Mentor & Mentee Management Platform Backend API`);
      console.log(` Server running on http://localhost:${PORT}`);
      console.log(` Database: ${getActiveEngine()}`);
      console.log(` Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`========================================================`);
    });
  } catch (error) {
    console.error('[Server Error] Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
