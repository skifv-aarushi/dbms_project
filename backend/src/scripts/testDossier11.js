const { initDatabase } = require('../config/db');
const { getFacultyDossier } = require('../services/faculty.service');

async function main() {
  await initDatabase();
  console.log('Testing getFacultyDossier for Mentor 11:');
  const d11 = await getFacultyDossier(11);
  console.log('Dossier 11:', JSON.stringify(d11, null, 2));

  console.log('\nTesting getFacultyDossier for Mentor 2:');
  const d2 = await getFacultyDossier(2);
  console.log('Dossier 2:', JSON.stringify(d2, null, 2));
}

main().catch(console.error);
