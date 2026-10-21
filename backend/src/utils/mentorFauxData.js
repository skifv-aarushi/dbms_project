/**
 * Utility for generating authentic, realistic faux scholarly research data
 * for faculty mentor profiles without relying on external Google Scholar scraping.
 */

function generateMentorFauxData({
  userId = null,
  name = 'Faculty Mentor',
  department = 'Computer Science and Engineering',
  designation = 'Associate Professor',
  skills = [],
} = {}) {
  const skillsList = Array.isArray(skills)
    ? skills
    : typeof skills === 'string' && skills.trim()
    ? skills.split(',').map((s) => s.trim()).filter(Boolean)
    : [];

  const primarySkill = skillsList[0] || 'Distributed Systems';
  const secondarySkill = skillsList[1] || 'Algorithms & Systems Design';
  const thirdSkill = skillsList[2] || 'Data Architecture';

  const cleanDept = department || 'Computer Science and Engineering';
  const cleanDesig = designation || 'Associate Professor';

  // Deterministic seed based on name / userId
  const seedString = `${name}-${userId || 1}`;
  let hash = 0;
  for (let i = 0; i < seedString.length; i++) {
    hash = (hash << 5) - hash + seedString.charCodeAt(i);
    hash |= 0;
  }
  const posHash = Math.abs(hash);

  // Dynamic Faux Bio
  const bio = `${cleanDesig} in ${cleanDept} with over a decade of teaching and research experience. Directs research focused on ${primarySkill}, ${secondarySkill}, and applied software verification, with emphasis on student academic scaffolding and term project mentorship.`;

  // Dynamic Citations (350 - 750)
  const citationsCount = 380 + (posHash % 370);

  // Dynamic H-Index (10 - 20)
  const hIndex = 11 + (posHash % 9);

  // Dynamic Research Areas
  const researchAreas = [
    primarySkill,
    secondarySkill,
    thirdSkill,
    `${cleanDept.split(' ')[0]} Systems Architecture`,
    'Software Reliability',
  ].filter((v, i, a) => a.indexOf(v) === i);

  // Clean Scholar Slug
  const nameSlug = name
    .toLowerCase()
    .replace(/^(dr\.|prof\.)\s*/i, '')
    .trim()
    .replace(/[^a-z0-9]+/g, '_');
  const googleScholarUrl = `https://scholar.google.com/citations?user=${nameSlug}`;

  // Faux Publications (3 peer-reviewed journal papers)
  const idPrefix = userId || (posHash % 900) + 100;
  const publications = [
    {
      title: `Scalable Paradigms in ${primarySkill} for High-Throughput Cloud Architectures`,
      journal: 'IEEE Transactions on Computers & System Architecture',
      year: 2023,
      citations: 120 + (posHash % 70),
      paperUrl: `https://doi.org/10.1109/TC.2023.${idPrefix}01`,
    },
    {
      title: `Empirical Verification and Latency Scaffolding in Modern ${cleanDept.split(' ')[0]} Workloads`,
      journal: 'ACM Computing Surveys & Systems Review',
      year: 2021,
      citations: 160 + (posHash % 80),
      paperUrl: `https://doi.org/10.1145/3412345.${idPrefix}02`,
    },
    {
      title: `Adaptive Heuristics and Resilient Protocols in ${secondarySkill}`,
      journal: 'Proceedings of the International Conference on Software Engineering',
      year: 2019,
      citations: 95 + (posHash % 60),
      paperUrl: `https://doi.org/10.1109/ICSE.2019.${idPrefix}03`,
    },
  ];

  return {
    bio,
    citationsCount,
    hIndex,
    researchAreas,
    googleScholarUrl,
    publications,
  };
}

module.exports = {
  generateMentorFauxData,
};
