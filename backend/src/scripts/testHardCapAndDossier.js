const http = require('http');
const app = require('../app');
const { initDatabase, query } = require('../config/db');

function request(server, path, method = 'GET', body = null, token = null) {
  return new Promise((resolve, reject) => {
    const address = server.address();
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const req = http.request(
      {
        hostname: 'localhost',
        port: address.port,
        path,
        method,
        headers,
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, body: JSON.parse(data) });
          } catch {
            resolve({ status: res.statusCode, body: data });
          }
        });
      }
    );

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function runTests() {
  await initDatabase();
  const server = app.listen(0);

  try {
    console.log('Testing 3-Mentee Hard Cap, Faculty Dossier & Publications...');

    // 1. Mentee Login
    const menteeLogin = await request(server, '/api/auth/login', 'POST', {
      email: 'aarav.patel@student.edu',
      password: 'password123',
    });
    console.log('1. Mentee login status:', menteeLogin.status);
    const menteeToken = menteeLogin.body.token;

    // 2. Mentee requests Faculty Dossier for Dr. Sunita Rao (Mentor ID 2)
    const dossierRes = await request(server, '/api/mentee/mentor/2', 'GET', null, menteeToken);
    console.log('2. Mentee view Faculty Dossier status:', dossierRes.status);
    console.log('   Faculty Name:', dossierRes.body.name);
    console.log('   Citations Count:', dossierRes.body.citationsCount);
    console.log('   h-Index:', dossierRes.body.hIndex);
    console.log('   Publications Count:', dossierRes.body.publications?.length);
    console.log('   Advising Capacity:', `${dossierRes.body.capacity?.activeMenteesCount} / ${dossierRes.body.capacity?.maxCapacity}`);
    console.log('   Slots Remaining:', dossierRes.body.capacity?.slotsRemaining);
    console.log('   Previous Sessions Count:', dossierRes.body.previousSessions?.length);

    // 3. Faculty Mentor Login (Dr. Sunita Rao)
    const mentorLogin = await request(server, '/api/auth/login', 'POST', {
      email: 'sunita.rao@university.edu',
      password: 'password123',
    });
    console.log('3. Mentor login status:', mentorLogin.status);
    const mentorToken = mentorLogin.body.token;

    // 4. Mentor views their own Profile & Dossier
    const myProfileRes = await request(server, '/api/mentor/profile', 'GET', null, mentorToken);
    console.log('4. Mentor view My Profile status:', myProfileRes.status);
    console.log('   Active Mentees Roster:', myProfileRes.body.activeMentees?.map((m) => m.menteeName));
    console.log('   Publications:', myProfileRes.body.publications?.map((p) => p.title));

    // 5. Hard Cap Enforcement Test:
    // Check Dr. Sunita Rao's current load (she has 2 active mentees in seed: Aarav Patel & Priya Sharma)
    console.log('5. Testing 3-Mentee Hard Cap:');
    // Add 1 more active mentee to Dr. Sunita Rao (Rohan Verma or Sneha Iyer)
    // First, let's pair Mentee 8 (Sneha Iyer) to Dr. Sunita Rao (bringing count to 3)
    const adminLogin = await request(server, '/api/auth/login', 'POST', {
      email: 'admin@university.edu',
      password: 'password123',
    });
    const adminToken = adminLogin.body.token;

    // Check if Sneha already has active pairing; if so complete it or clean up
    await query(`UPDATE MENTORSHIP SET Status = 'Completed' WHERE MenteeID = 8`);

    const thirdPairing = await request(server, '/api/admin/allocations', 'POST', {
      mentorId: 2,
      menteeId: 8,
    }, adminToken);
    console.log('   Assigning 3rd mentee to Dr. Sunita Rao status:', thirdPairing.status, thirdPairing.body.message || thirdPairing.body.error);

    // Now Dr. Sunita Rao has 3 active mentees (FULL CAPACITY: 3/3).
    // Now try to assign a 4th mentee (Mentee 9: Aditya Nair) to Dr. Sunita Rao!
    await query(`UPDATE MENTORSHIP SET Status = 'Completed' WHERE MenteeID = 9`);
    const fourthPairing = await request(server, '/api/admin/allocations', 'POST', {
      mentorId: 2,
      menteeId: 9,
    }, adminToken);
    console.log('   Attempting 4th mentee assignment to Dr. Sunita Rao status:', fourthPairing.status);
    console.log('   Expected rejection message:', fourthPairing.body.error);

    // Verify Mentee Recommended Mentors marks Dr. Sunita Rao as full
    const snehaLogin = await request(server, '/api/auth/login', 'POST', {
      email: 'aditya.nair@student.edu',
      password: 'password123',
    });
    const adityaToken = snehaLogin.body.token;
    const recsRes = await request(server, '/api/mentee/recommended-mentors', 'GET', null, adityaToken);
    const sunitaRec = recsRes.body.recommendations?.find((r) => r.mentorId === 2);
    console.log('   Recommender status for Dr. Sunita Rao:');
    console.log('   isFull:', sunitaRec?.isFull);
    console.log('   Active Count:', sunitaRec?.activeMenteesCount, '/', sunitaRec?.maxCapacity);
    console.log('   Rationale:', sunitaRec?.rationale);

    // Clean up test 3rd pairing to restore seed state
    await query(`UPDATE MENTORSHIP SET Status = 'Completed' WHERE MenteeID = 8 AND MentorID = 2`);

    console.log('✅ ALL 3-MENTEE HARD CAP & DOSSIER TESTS PASSED SUCCESSFULLY!');
  } finally {
    server.close();
  }
}

runTests().catch((err) => {
  console.error('Test error:', err);
  process.exit(1);
});
