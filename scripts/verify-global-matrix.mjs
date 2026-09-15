// verify-global-matrix.mjs
// Automated verification for ProfMatch AI Global Expansion

const BASE_URL = 'http://localhost:3000';

const testCases = [
  { name: '1. USA + AI', body: { country: 'United States', field: 'Artificial Intelligence' } },
  { name: '2. UK + Business', body: { country: 'United Kingdom', field: 'Business Administration' } },
  { name: '3. Germany + Renewable Energy', body: { country: 'Germany', field: 'Renewable Energy Systems' } },
  { name: '4. Japan + Robotics', body: { country: 'Japan', field: 'Robotics & Autonomous Systems' } },
  { name: '5. Canada + Psychology', body: { country: 'Canada', field: 'Psychology' } },
  { name: '6. Australia + Public Health', body: { country: 'Australia', field: 'Public Health & Epidemiology' } },
  { name: '7. Italy + Architecture', body: { country: 'Italy', field: 'Architecture & Urban Design' } },
  { name: '8. Pakistan + Biotechnology', body: { country: 'Pakistan', field: 'Biotechnology' } },
  { name: '9. Brazil + Economics', body: { country: 'Brazil', field: 'Economics' } },
  { name: '10. Sweden + Sustainable Cities', body: { country: 'Sweden', field: 'Environmental Science' } },
  { name: '11. South Korea + Semiconductor Engineering', body: { country: 'South Korea', field: 'Semiconductor Engineering' } },
  { name: '12. Unknown Field: "Computational Sustainability"', body: { country: 'Germany', customField: 'Computational Sustainability', interdisciplinary: true } },
];

async function run() {
  console.log('='.repeat(70));
  console.log('PROFMATCH AI — GLOBAL TEST MATRIX VERIFICATION');
  console.log('='.repeat(70));

  let totalPassed = 0;
  let totalFailed = 0;
  const results = [];

  for (const tc of testCases) {
    console.log(`\nTesting: [${tc.name}] ...`);
    try {
      const res = await fetch(`${BASE_URL}/api/professors/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tc.body),
      });

      if (!res.ok) {
        throw new Error(`HTTP Error ${res.status}: ${res.statusText}`);
      }

      const json = await res.json();
      const professors = json.professors || json.data || [];
      const count = json.total || professors.length;

      if (count === 0) {
        console.error(`❌ FAILED: 0 professors returned for ${tc.name}`);
        totalFailed++;
        results.push({ name: tc.name, status: 'FAILED', reason: 'No results returned' });
        continue;
      }

      // Check first professor schema
      const p = professors[0];
      const hasUniversity = !!(p.university || p.university_name);
      const hasTitle = !!(p.title || p.real_title);
      const hasEmail = !!p.email;
      const hasEmailStatus = !!(p.email_verification_status || p.emailVerificationStatus);
      const hasResearch = Array.isArray(p.research_interests) && p.research_interests.length > 0;
      const hasProfileUrl = !!p.profile_url;

      const isValid = hasUniversity && hasTitle && hasEmail && hasResearch && hasProfileUrl;

      if (!isValid) {
        console.error(`❌ FAILED: Incomplete fields on professor record:`, {
          hasUniversity,
          hasTitle,
          hasEmail,
          hasEmailStatus,
          hasResearch,
          hasProfileUrl,
          sample: p
        });
        totalFailed++;
        results.push({ name: tc.name, status: 'FAILED', reason: 'Missing required schema fields' });
      } else {
        const uniName = p.university_name || (typeof p.university === 'string' ? p.university : (p.university?.name || 'Unknown'));
        const emailStatus = p.email_verification_status || p.emailVerificationStatus || 'UNVERIFIED';
        const title = p.real_title || p.title;
        console.log(`✅ PASSED (${count} results) — Sample: ${title} ${p.name} | ${uniName} | Email: ${p.email} [${emailStatus}]`);
        totalPassed++;
        results.push({
          name: tc.name,
          status: 'PASSED',
          count,
          sampleProfessor: `${title} ${p.name}`,
          sampleUniversity: uniName,
          emailStatus,
        });
      }
    } catch (err) {
      console.error(`❌ ERROR testing ${tc.name}:`, err.message);
      totalFailed++;
      results.push({ name: tc.name, status: 'ERROR', error: err.message });
    }
  }

  console.log('\n' + '='.repeat(70));
  console.log(`SUMMARY: ${totalPassed}/${testCases.length} PASSED, ${totalFailed} FAILED`);
  console.log('='.repeat(70));

  if (totalFailed > 0) {
    process.exit(1);
  }
}

run();
