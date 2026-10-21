const { query, initDatabase } = require('../config/db');

async function checkDB() {
  await initDatabase();
  const pubs = await query('SELECT * FROM FACULTY_PUBLICATIONS ORDER BY MentorID, Year DESC');
  console.log('FACULTY_PUBLICATIONS count:', pubs.rows.length);
  pubs.rows.forEach(p => console.log('  Pub:', p.publicationid, 'MentorID:', p.mentorid, p.title, p.citations));

  const mentors = await query(
    `SELECT u.UserID, u.Name, u.Email, u.Role, p.Department, p.Designation, p.Bio, p.CitationsCount, p.HIndex, p.ResearchAreas, p.GoogleScholarURL
     FROM USERS u
     LEFT JOIN USER_PROFILES p ON u.UserID = p.UserID
     WHERE u.Role = 'Mentor'
     ORDER BY u.UserID`
  );
  console.log('Mentors count:', mentors.rows.length);
  mentors.rows.forEach(m => console.log('  Mentor:', m.userid, m.name, 'Citations:', m.citationscount, 'hIndex:', m.hindex, 'Bio:', !!m.bio));

  const sessions = await query(
    `SELECT mt.MeetingID, mt.Status, mt.MenteeRating, mt.MenteeRemarks, m.MentorID, u.Name AS MenteeName
     FROM MEETING mt
     JOIN MENTORSHIP m ON mt.MentorshipID = m.MentorshipID
     JOIN USERS u ON m.MenteeID = u.UserID
     WHERE mt.Status = 'Completed'`
  );
  console.log('Completed sessions count:', sessions.rows.length);
  sessions.rows.forEach(s => console.log('  Session:', s.meetingid, 'MentorID:', s.mentorid, 'Rating:', s.menteerating, 'Mentee:', s.menteename));
}

checkDB().then(() => process.exit(0)).catch((err) => {
  console.error(err);
  process.exit(1);
});
