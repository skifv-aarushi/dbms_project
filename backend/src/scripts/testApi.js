const http = require('http');
const app = require('../app');
const { initDatabase } = require('../config/db');

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
    console.log('Testing Backend API Endpoints...');

    // 1. Health
    const health = await request(server, '/api/health');
    console.log('1. Health check status:', health.status, health.body.databaseEngine);

    // 2. Admin Login
    const adminLogin = await request(server, '/api/auth/login', 'POST', {
      email: 'admin@university.edu',
      password: 'password123',
    });
    console.log('2. Admin login status:', adminLogin.status, 'User:', adminLogin.body.user?.name);
    const adminToken = adminLogin.body.token;

    // 3. Admin Reports
    const reports = await request(server, '/api/admin/reports', 'GET', null, adminToken);
    console.log('3. Admin reports status:', reports.status);
    console.log('   Active mentorships:', reports.body.summary?.activementorships);
    console.log('   Performance view rows:', reports.body.performanceView?.length);

    // 4. Mentor Login
    const mentorLogin = await request(server, '/api/auth/login', 'POST', {
      email: 'elena.rostova@university.edu',
      password: 'password123',
    });
    console.log('4. Mentor login status:', mentorLogin.status, 'User:', mentorLogin.body.user?.name);
    const mentorToken = mentorLogin.body.token;

    // 5. Mentor Mentees Roster
    const mentorMentees = await request(server, '/api/mentor/mentees', 'GET', null, mentorToken);
    console.log('5. Mentor mentees count:', mentorMentees.body.mentees?.length);

    // 6. Mentee Login
    const menteeLogin = await request(server, '/api/auth/login', 'POST', {
      email: 'alex.rivera@student.edu',
      password: 'password123',
    });
    console.log('6. Mentee login status:', menteeLogin.status, 'User:', menteeLogin.body.user?.name);
    const menteeToken = menteeLogin.body.token;

    // 7. Mentee Dashboard
    const menteeDash = await request(server, '/api/mentee/dashboard', 'GET', null, menteeToken);
    console.log('7. Mentee dashboard mentor:', menteeDash.body.activeMentorship?.mentorname);
    console.log('   Mentee meetings count:', menteeDash.body.meetings?.length);

    // 9. Mentee Recommended Mentors (Maya Patel - Unassigned mentee)
    const mayaLogin = await request(server, '/api/auth/login', 'POST', {
      email: 'maya.patel@student.edu',
      password: 'password123',
    });
    const mayaToken = mayaLogin.body.token;
    const mayaRecs = await request(server, '/api/mentee/recommended-mentors', 'GET', null, mayaToken);
    console.log('9. Mentee-Side Matcher for Maya Patel:');
    console.log('   Top Match:', mayaRecs.body.recommendations?.[0]?.mentorName);
    console.log('   Score:', mayaRecs.body.recommendations?.[0]?.matchScore, '%');
    console.log('   Matched Skills:', mayaRecs.body.recommendations?.[0]?.matchedSkills);

    // 10. Mentee Select Mentor (Alex Rivera already paired -> should reject)
    const alexSelect = await request(server, '/api/mentee/select-mentor', 'POST', { mentorId: 3 }, menteeToken);
    console.log('10. Alex Rivera (already paired) select-mentor status:', alexSelect.status, '(Expected 400 rejection)');

    // 11. Maya Patel (unassigned) selects Dr. Marcus Vance
    const mayaSelect = await request(server, '/api/mentee/select-mentor', 'POST', { mentorId: 3 }, mayaToken);
    console.log('11. Maya Patel select-mentor status:', mayaSelect.status, mayaSelect.body.message);

    // 12. Admin creates a new Faculty Mentor
    const newMentor = await request(server, '/api/admin/users', 'POST', {
      name: 'Dr. Raymond Holt',
      email: 'raymond.holt@university.edu',
      role: 'Mentor',
      department: 'Computer Science and Engineering',
      designation: 'Professor & Department Chair',
      skills: ['Distributed Systems', 'Security Architecture', 'Cloud Computing'],
    }, adminToken);
    console.log('12. Admin create Mentor status:', newMentor.status, newMentor.body.message);

    // 13. Admin creates a new Student Mentee
    const newMentee = await request(server, '/api/admin/users', 'POST', {
      name: 'Priya Sharma',
      email: 'priya.sharma@student.edu',
      role: 'Mentee',
      department: 'Computer Science and Engineering',
      year: 2,
      cgpa: 9.10,
      skills: ['Python', 'Distributed Systems', 'Databases'],
    }, adminToken);
    console.log('13. Admin create Mentee status:', newMentee.status, newMentee.body.message);

    // 14. Non-admin user creation attempt (should be 403)
    const unauthorizedCreate = await request(server, '/api/admin/users', 'POST', {
      name: 'Hacker User',
      email: 'hacker@test.edu',
      role: 'Mentor',
    }, menteeToken);
    console.log('14. Unauthorized user creation status:', unauthorizedCreate.status, '(Expected 403)');

    console.log('✅ ALL API & RECOMMENDER TESTS COMPLETED SUCCESSFULLY!');
  } finally {
    server.close();
  }
}

runTests().catch((err) => {
  console.error('Test error:', err);
  process.exit(1);
});
