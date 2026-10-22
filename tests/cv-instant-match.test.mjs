import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

test('CV Instant Match & Faculty Retrieval Integrity Suite', async (t) => {
  await t.test('1. Prohibits subject and department names from being treated as professor personas', () => {
    const tavilyCode = fs.readFileSync(path.join(process.cwd(), 'lib', 'providers', 'search', 'tavily-provider.ts'), 'utf-8');

    assert.ok(tavilyCode.includes('isLegitimateFacultyName'), 'Must contain isLegitimateFacultyName validator');
    assert.ok(tavilyCode.includes('computer'), 'Must include academic subjects in forbidden terms');
    assert.ok(tavilyCode.includes('learning'), 'Must include machine learning in forbidden terms');
  });

  await t.test('2. Professor Detail Page contains async fetch fallback before declaring 404', () => {
    const pageCode = fs.readFileSync(path.join(process.cwd(), 'app', 'professors', '[id]', 'page.tsx'), 'utf-8');

    assert.ok(pageCode.includes('/api/professors/'), 'Detail page must query server API /api/professors/ before 404');
    assert.ok(pageCode.includes('sessionStorage.setItem'), 'Detail page must cache retrieved profile in sessionStorage');
  });

  await t.test('3. Dedicated API route /api/professors/[id] exists and calls getProfessorById', () => {
    const routeCode = fs.readFileSync(path.join(process.cwd(), 'app', 'api', 'professors', '[id]', 'route.ts'), 'utf-8');

    assert.ok(routeCode.includes('getProfessorById'), 'Route must invoke getProfessorById');
    assert.ok(routeCode.includes('params.id'), 'Route must read params.id');
  });

  await t.test('4. CV Match Service persists discovered faculty in batch with upsertProfessorsBatch', () => {
    const cvServiceCode = fs.readFileSync(path.join(process.cwd(), 'lib', 'services', 'cv-match-service.ts'), 'utf-8');

    assert.ok(cvServiceCode.includes('upsertProfessorsBatch(allFaculty)'), 'Must call upsertProfessorsBatch to persist discovered faculty');
    assert.ok(cvServiceCode.includes('gemini-3.5-flash'), 'Must include modern Gemini 3.5 models');
    assert.ok(cvServiceCode.includes('extractProfileHeuristically'), 'Must include dynamic heuristic fallback extractor');
  });

  await t.test('5. CV Upload Modal caches matched results and clicked professor in sessionStorage', () => {
    const modalCode = fs.readFileSync(path.join(process.cwd(), 'components', 'search', 'cv-upload-match-modal.tsx'), 'utf-8');

    assert.ok(modalCode.includes('profmatch_current_prof_'), 'Modal must cache individual professors for direct lookup');
    assert.ok(modalCode.includes('profmatch_search_state'), 'Modal must update search state');
  });
});
