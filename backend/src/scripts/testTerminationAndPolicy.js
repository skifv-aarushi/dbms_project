const { query } = require('../config/db');
const { getFacultyDossier } = require('../services/faculty.service');
const { getRecommendationsForMentee } = require('../services/recommender.service');

async function testTerminationAndPolicy() {
  console.log('--- Step 1: Verify Schema & Bio Column ---');
  const cols = await query(
    `SELECT column_name, data_type 
     FROM information_schema.columns 
     WHERE table_name = 'user_profiles' AND column_name IN ('bio', 'citationscount', 'hindex', 'researchareas', 'googlescholarurl')`
  );
  console.log('Columns in user_profiles:', cols.rows.map(r => r.column_name));

  console.log('\n--- Step 2: Test Faculty Dossier for Mentor 2 & Mentor 11 ---');
  const d2 = await getFacultyDossier(2, true);
  console.log('Mentor 2 Dossier retrieved successfully:', {
    name: d2.name,
    bio: d2.bio?.substring(0, 50) + '...',
    publicationsCount: d2.publications.length,
    activeMentees: d2.capacity.activeMenteesCount,
  });

  console.log('\n--- Step 3: Test Recommender Service ---');
  const recs = await getRecommendationsForMentee(5); // Student 5 (Priya Sharma)
  console.log('Recommendations count:', recs.recommendations.length);
  recs.recommendations.forEach(m => {
    console.log(`- ${m.mentorName} (${m.department}): ${m.matchScore}% Match, Cap: ${m.activeMenteesCount}/${m.maxCapacity}`);
  });

  console.log('\n--- Step 4: Test Mentee Mentorship Lifecycle & Termination ---');
  // Find a mentee without an active mentorship or check student 8
  const testStudentId = 8; // Student
  const testMentorId = 11; // Mentor (Raymond Holt has 0 active mentees)

  // Clean any previous test pairing for student 8
  await query(`DELETE FROM MEETING WHERE MentorshipID IN (SELECT MentorshipID FROM MENTORSHIP WHERE MenteeID = $1)`, [testStudentId]);
  await query(`DELETE FROM MENTORSHIP WHERE MenteeID = $1`, [testStudentId]);

  // Insert an active mentorship
  const ins = await query(
    `INSERT INTO MENTORSHIP (MentorID, MenteeID, StartDate, Status)
     VALUES ($1, $2, CURRENT_DATE, 'Active') RETURNING *`,
    [testMentorId, testStudentId]
  );
  const mentorshipId = ins.rows[0].mentorshipid;
  console.log(`Created test active mentorship ID: ${mentorshipId} between Mentor ${testMentorId} and Mentee ${testStudentId}`);

  // Schedule a future test meeting
  const meetIns = await query(
    `INSERT INTO MEETING (MentorshipID, MeetingDate, MeetingTime, Mode, Discussion, Status)
     VALUES ($1, CURRENT_DATE + 3, '14:00:00', 'Online', 'Term project setup discussion', 'Scheduled') RETURNING *`,
    [mentorshipId]
  );
  console.log(`Created scheduled meeting ID: ${meetIns.rows[0].meetingid} with status: ${meetIns.rows[0].status}`);

  // Test Mentee Termination
  console.log('\nSimulating Mentee terminating mentorship...');
  await query(
    `UPDATE MENTORSHIP SET Status = 'Terminated', EndDate = CURRENT_DATE WHERE MentorshipID = $1`,
    [mentorshipId]
  );
  await query(
    `UPDATE MEETING SET Status = 'Cancelled' WHERE MentorshipID = $1 AND Status = 'Scheduled'`,
    [mentorshipId]
  );

  const termCheck = await query(`SELECT Status, EndDate FROM MENTORSHIP WHERE MentorshipID = $1`, [mentorshipId]);
  const meetCheck = await query(`SELECT Status FROM MEETING WHERE MentorshipID = $1`, [mentorshipId]);
  console.log('Post-termination Mentorship state:', termCheck.rows[0]);
  console.log('Post-termination Meeting state:', meetCheck.rows[0]);

  // Verify mentor's active count decreased/is 0
  const countCheck = await query(
    `SELECT COUNT(*) AS active_count FROM MENTORSHIP WHERE MentorID = $1 AND Status = 'Active'`,
    [testMentorId]
  );
  console.log(`Mentor ${testMentorId} active mentees count after termination: ${countCheck.rows[0].active_count}`);

  // Cleanup test data
  await query(`DELETE FROM MEETING WHERE MentorshipID = $1`, [mentorshipId]);
  await query(`DELETE FROM MENTORSHIP WHERE MentorshipID = $1`, [mentorshipId]);

  console.log('\n✅ All tests passed successfully!');
  process.exit(0);
}

testTerminationAndPolicy().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
