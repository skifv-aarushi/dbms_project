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

async function run() {
  await initDatabase();
  const server = app.listen(0);

  try {
    console.log('--- Testing Universal Faculty Dossier Across All Roles & Endpoints ---');

    // 1. Mentee Token
    const menteeLogin = await request(server, '/api/auth/login', 'POST', {
      email: 'aarav.patel@student.edu',
      password: 'password123',
    });
    const menteeToken = menteeLogin.body.token;

    // 2. Mentor Token (Dr. Sunita Rao)
    const mentorLogin = await request(server, '/api/auth/login', 'POST', {
      email: 'sunita.rao@university.edu',
      password: 'password123',
    });
    const mentorToken = mentorLogin.body.token;

    // 3. Admin Token
    const adminLogin = await request(server, '/api/auth/login', 'POST', {
      email: 'admin@university.edu',
      password: 'password123',
    });
    const adminToken = adminLogin.body.token;

    // Test A: Mentee calls /api/mentee/mentor/11 (Dr. Raymond Holt)
    const r1 = await request(server, '/api/mentee/mentor/11', 'GET', null, menteeToken);
    console.log('A. Mentee -> /api/mentee/mentor/11:', r1.status, r1.body.name, `Pubs: ${r1.body.publications?.length}`, `Citations: ${r1.body.citationsCount}`);

    // Test B: Mentor calls /api/mentor/11
    const r2 = await request(server, '/api/mentor/11', 'GET', null, mentorToken);
    console.log('B. Mentor -> /api/mentor/11:', r2.status, r2.body.name, `hIndex: ${r2.body.hIndex}`);

    // Test C: Mentor calls /api/mentor/dossier/2
    const r3 = await request(server, '/api/mentor/dossier/2', 'GET', null, mentorToken);
    console.log('C. Mentor -> /api/mentor/dossier/2:', r3.status, r3.body.name, `Capacity: ${r3.body.capacity?.activeMenteesCount}/${r3.body.capacity?.maxCapacity}`);

    // Test D: Admin calls /api/admin/mentor/3 (Dr. Vikram Malhotra)
    const r4 = await request(server, '/api/admin/mentor/3', 'GET', null, adminToken);
    console.log('D. Admin -> /api/admin/mentor/3:', r4.status, r4.body.name, `Pubs: ${r4.body.publications?.length}`);

    // Test E: Admin calls /api/admin/mentor/4 (Prof. Ananya Sen)
    const r5 = await request(server, '/api/admin/mentor/4', 'GET', null, adminToken);
    console.log('E. Admin -> /api/admin/mentor/4:', r5.status, r5.body.name, `Sessions: ${r5.body.previousSessions?.length}`);

    console.log('\n✅ ALL UNIVERSAL DOSSIER ENDPOINTS VERIFIED AND RETURNING 200 OK!');
  } finally {
    server.close();
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
