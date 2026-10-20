const { initDatabase, query, getActiveEngine } = require('../config/db');

async function run() {
  console.log('--- INITIALIZING DATABASE ---');
  await initDatabase({ force: true });
  console.log(`--- DATABASE INITIALIZATION COMPLETED on ${getActiveEngine()} ---`);

  const userCount = await query('SELECT COUNT(*) FROM USERS');
  const pairingCount = await query('SELECT COUNT(*) FROM MENTORSHIP WHERE Status = $1', ['Active']);
  const meetingCount = await query('SELECT COUNT(*) FROM MEETING');
  const viewCount = await query('SELECT COUNT(*) FROM View_MentorshipPerformance');

  console.log('Statistics:');
  console.log(`- Total Users: ${userCount.rows[0].count}`);
  console.log(`- Active Mentorship Pairings: ${pairingCount.rows[0].count}`);
  console.log(`- Seeded Meetings: ${meetingCount.rows[0].count}`);
  console.log(`- Performance View Rows: ${viewCount.rows[0].count}`);
  process.exit(0);
}

run().catch((err) => {
  console.error('Fatal initialization error:', err);
  process.exit(1);
});
