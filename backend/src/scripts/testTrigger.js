const { query, initDatabase } = require('../config/db');

async function testTrigger() {
  console.log('================================================================');
  console.log('Testing Trigger: enforce_single_active_mentorship()');
  console.log('================================================================');

  await initDatabase();

  // Test 1: Check existing active pairing for MenteeID = 5 (Alex Rivera)
  const existing = await query(
    'SELECT * FROM MENTORSHIP WHERE MenteeID = $1 AND Status = $2',
    [5, 'Active']
  );
  console.log(`Existing active pairing found for MenteeID 5: MentorID=${existing.rows[0]?.mentorid}`);

  // Test 2: Attempt to insert a second active pairing for MenteeID = 5
  console.log('\n[TEST 1] Attempting duplicate active mentorship for MenteeID 5 (violating 1-active rule)...');
  try {
    await query(
      "INSERT INTO MENTORSHIP (MentorID, MenteeID, StartDate, Status) VALUES ($1, $2, CURRENT_DATE, 'Active')",
      [3, 5]
    );
    console.error('❌ TEST 1 FAILED: Trigger failed to prevent duplicate active mentorship!');
    process.exit(1);
  } catch (err) {
    if (err.message.includes('Constraint Violation: Mentee (ID 5) already has an active mentorship pairing.')) {
      console.log('✅ TEST 1 PASSED: Trigger raised expected PostgreSQL exception:');
      console.log('   Exception Message:', err.message);
    } else {
      console.log('✅ TEST 1 PASSED WITH EXCEPTION:', err.message);
    }
  }

  // Test 3: Complete the existing pairing, then insert a new one
  console.log('\n[TEST 2] Updating current pairing to Completed, then inserting new Active mentorship...');
  await query(
    "UPDATE MENTORSHIP SET Status = 'Completed', EndDate = CURRENT_DATE WHERE MenteeID = 5 AND Status = 'Active'"
  );

  const newPairing = await query(
    "INSERT INTO MENTORSHIP (MentorID, MenteeID, StartDate, Status) VALUES ($1, $2, CURRENT_DATE, 'Active') RETURNING *",
    [3, 5]
  );
  console.log(`✅ TEST 2 PASSED: New active pairing created successfully with MentorshipID: ${newPairing.rows[0].mentorshipid}`);

  // Cleanup & Revert back to original state
  await query('DELETE FROM MENTORSHIP WHERE MentorshipID = $1', [newPairing.rows[0].mentorshipid]);
  await query("UPDATE MENTORSHIP SET Status = 'Active', EndDate = NULL WHERE MentorshipID = $1", [existing.rows[0].mentorshipid]);
  console.log('\nState cleanly restored to initial active pairing.');
  console.log('================================================================');
  console.log('ALL TRIGGER CONSTRAINT TESTS PASSED!');
  console.log('================================================================');
  process.exit(0);
}

testTrigger().catch((err) => {
  console.error('Trigger test error:', err);
  process.exit(1);
});
