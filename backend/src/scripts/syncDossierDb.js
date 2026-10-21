const { initDatabase, query } = require('../config/db');

async function sync() {
  await initDatabase();
  console.log('[Sync] Synchronizing all faculty profiles and publications...');

  const commands = [
    `ALTER TABLE USER_PROFILES ADD COLUMN IF NOT EXISTS Bio TEXT`,
    `ALTER TABLE USER_PROFILES ADD COLUMN IF NOT EXISTS CitationsCount INT DEFAULT 0`,
    `ALTER TABLE USER_PROFILES ADD COLUMN IF NOT EXISTS HIndex INT DEFAULT 0`,
    `ALTER TABLE USER_PROFILES ADD COLUMN IF NOT EXISTS ResearchAreas TEXT[] DEFAULT '{}'`,
    `ALTER TABLE USER_PROFILES ADD COLUMN IF NOT EXISTS GoogleScholarURL VARCHAR(255)`,

    `CREATE TABLE IF NOT EXISTS FACULTY_PUBLICATIONS (
      PublicationID SERIAL PRIMARY KEY,
      MentorID INT NOT NULL REFERENCES USERS(UserID) ON DELETE CASCADE,
      Title VARCHAR(255) NOT NULL,
      Journal VARCHAR(200) NOT NULL,
      Year INT NOT NULL,
      Citations INT DEFAULT 0 NOT NULL,
      PaperURL VARCHAR(255)
    )`,

    `CREATE INDEX IF NOT EXISTS idx_fac_pub_mentor ON FACULTY_PUBLICATIONS(MentorID, Year)`,

    `UPDATE USER_PROFILES 
     SET Bio = 'Associate Professor in CSE with 14+ years of academic research in distributed databases, consensus protocols, and query optimization. Leads the Systems & Data Architecture Lab.',
         CitationsCount = 485,
         HIndex = 12,
         ResearchAreas = ARRAY['Distributed Databases', 'Query Optimization', 'Cloud Storage Systems', 'Data Consistency'],
         GoogleScholarURL = 'https://scholar.google.com/citations?user=sunita_rao'
     WHERE UserID = 2`,

    `UPDATE USER_PROFILES 
     SET Bio = 'Professor & Head of Department in Information Technology. Research focus on resilient cloud architectures, container orchestration, high-throughput microservices, and ACID compliance in distributed storage.',
         CitationsCount = 820,
         HIndex = 16,
         ResearchAreas = ARRAY['Cloud Native Architectures', 'Distributed Transactions', 'Microservices', 'Kubernetes Orchestration'],
         GoogleScholarURL = 'https://scholar.google.com/citations?user=vikram_malhotra'
     WHERE UserID = 3`,

    `UPDATE USER_PROFILES 
     SET Bio = 'Assistant Professor in Electronics & Communication. Research encompasses low-power IoT telemetry, edge intelligence algorithms, and fault-tolerant embedded sensor networks.',
         CitationsCount = 310,
         HIndex = 9,
         ResearchAreas = ARRAY['Embedded Systems', 'IoT Edge Intelligence', 'Ultra-Low Power Telemetry', 'Digital Signal Processing'],
         GoogleScholarURL = 'https://scholar.google.com/citations?user=ananya_sen'
     WHERE UserID = 4`,

    `UPDATE USER_PROFILES 
     SET Bio = 'Professor & Department Chair in Computer Science. Dedicated to academic excellence, distributed computing verification, and mentoring graduate and undergraduate researchers.',
         CitationsCount = 540,
         HIndex = 14,
         ResearchAreas = ARRAY['Systems Security', 'Algorithmic Efficiency', 'Academic Leadership', 'Distributed Consensus'],
         GoogleScholarURL = 'https://scholar.google.com/citations?user=raymond_holt'
     WHERE UserID = 11`,

    `UPDATE USER_PROFILES p
     SET Bio = COALESCE(NULLIF(p.Bio, ''), 'Distinguished Faculty Mentor dedicated to academic rigorousness, student leadership scaffolding, and advanced systems design.'),
         CitationsCount = CASE WHEN p.CitationsCount IS NULL OR p.CitationsCount = 0 THEN 350 ELSE p.CitationsCount END,
         HIndex = CASE WHEN p.HIndex IS NULL OR p.HIndex = 0 THEN 10 ELSE p.HIndex END,
         ResearchAreas = CASE WHEN p.ResearchAreas IS NULL OR p.ResearchAreas = '{}' THEN ARRAY['Advanced Computing', 'Software Engineering', 'Applied Research'] ELSE p.ResearchAreas END,
         GoogleScholarURL = COALESCE(p.GoogleScholarURL, 'https://scholar.google.com/citations?view_op=search_authors')
     FROM USERS u
     WHERE u.UserID = p.UserID AND u.Role = 'Mentor' AND (p.Bio IS NULL OR p.CitationsCount IS NULL OR p.CitationsCount = 0)`,

    `INSERT INTO FACULTY_PUBLICATIONS (PublicationID, MentorID, Title, Journal, Year, Citations, PaperURL) VALUES
     (10, 11, 'Protocol Verification in Mission-Critical Distributed Systems', 'IEEE Security & Privacy', 2022, 210, 'https://doi.org/10.1109/SP.2022.1001')
     ON CONFLICT (PublicationID) DO NOTHING`,

    `INSERT INTO FACULTY_PUBLICATIONS (PublicationID, MentorID, Title, Journal, Year, Citations, PaperURL) VALUES
     (11, 11, 'Organizational Structure and Efficiency in Collaborative Academic Labs', 'Journal of Higher Education Leadership', 2020, 180, 'https://doi.org/10.1080/00221546.2020.1002')
     ON CONFLICT (PublicationID) DO NOTHING`,

    `INSERT INTO FACULTY_PUBLICATIONS (PublicationID, MentorID, Title, Journal, Year, Citations, PaperURL) VALUES
     (12, 11, 'Algorithmic Accountability in Automated Evaluation Platforms', 'Communications of the ACM', 2019, 150, 'https://doi.org/10.1145/3300000')
     ON CONFLICT (PublicationID) DO NOTHING`,

    `ALTER SEQUENCE faculty_publications_publicationid_seq RESTART WITH 13`,
  ];

  for (const cmd of commands) {
    await query(cmd);
  }

  console.log('[Sync] All commands executed successfully!');
}

sync().catch(console.error);
