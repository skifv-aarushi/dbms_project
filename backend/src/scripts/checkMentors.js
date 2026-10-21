const { initDatabase, query } = require('../config/db');

async function main() {
  await initDatabase();
  const mentors = await query(`
    SELECT u.UserID, u.Name, u.Email, p.Department, p.Bio, p.CitationsCount, p.HIndex 
    FROM USERS u 
    LEFT JOIN USER_PROFILES p ON u.UserID = p.UserID 
    WHERE u.Role = 'Mentor'
    ORDER BY u.UserID ASC
  `);
  console.log('Mentors found:', mentors.rows.length);
  for (const m of mentors.rows) {
    const pubs = await query('SELECT COUNT(*) FROM FACULTY_PUBLICATIONS WHERE MentorID = $1', [m.userid]);
    console.log(`Mentor ${m.userid}: ${m.name} | Citations: ${m.citationscount} | Pubs: ${pubs.rows[0].count} | Bio: ${m.bio ? m.bio.substring(0, 30) + '...' : 'NULL'}`);
  }

  // Also check all publications
  const allPubs = await query('SELECT PublicationID, MentorID, Title, Year FROM FACULTY_PUBLICATIONS ORDER BY PublicationID ASC');
  console.log('\nAll Publications in DB:', allPubs.rows.length);
  for (const p of allPubs.rows) {
    console.log(`Pub ${p.publicationid}: Mentor ${p.mentorid} - ${p.title} (${p.year})`);
  }
}

main().catch(console.error);
