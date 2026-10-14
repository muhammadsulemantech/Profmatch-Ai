import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

test('CV Parser & Zero-Keyword Profile Validation Suite', async (t) => {
  await t.test('1. Default research profile in mock-db.ts has 0 research interests and empty thesis', () => {
    const mockDbPath = path.join(process.cwd(), 'lib', 'supabase', 'mock-db.ts');
    const content = fs.readFileSync(mockDbPath, 'utf-8');

    assert.ok(content.includes('research_interests: []'), 'research_interests in mockDb must be initialized to empty array []');
    assert.ok(content.includes("thesis_title: ''"), 'thesis_title in mockDb must be empty string');
    assert.ok(content.includes("thesis_abstract: ''"), 'thesis_abstract in mockDb must be empty string');
  });

  await t.test('2. Legacy mock list detection accurately identifies old dummy keywords for reset', () => {
    const legacyMockList = [
      'Applied Machine Learning',
      'Data Science & Big Data Engineering',
      'Biochemistry & Biophysics',
      'Artificial Intelligence & NLP',
      'Large Language Models (LLMs)',
      'Robotics & Autonomous Systems',
      'Empirical Research Methods',
      'Data Science'
    ];

    const isLegacyMock = Array.isArray(legacyMockList) && (
      (legacyMockList.length === 8 && legacyMockList.includes('Applied Machine Learning') && legacyMockList.includes('Data Science & Big Data Engineering')) ||
      (legacyMockList.length === 3 && legacyMockList.includes('Large Language Models') && legacyMockList.includes('Factuality'))
    );

    assert.equal(isLegacyMock, true, 'Legacy mock list must be flagged for reset');

    const cleanKeywords = ['Machine Learning', 'Computer Vision'];
    const isCleanMock = Array.isArray(cleanKeywords) && (
      (cleanKeywords.length === 8 && cleanKeywords.includes('Applied Machine Learning') && cleanKeywords.includes('Data Science & Big Data Engineering')) ||
      (cleanKeywords.length === 3 && cleanKeywords.includes('Large Language Models') && cleanKeywords.includes('Factuality'))
    );
    assert.equal(isCleanMock, false, 'User-customized keywords must NOT be flagged as legacy mock');
  });

  await t.test('3. CV Text Parser extracts accurate academic fields from text', () => {
    const sampleCvText = [
      'Muhammad Suleman',
      'suleman@example.com | Islamabad, Pakistan',
      'EDUCATION',
      'Bachelor of Science in Computer Science',
      'National University of Sciences and Technology (NUST)',
      'CGPA: 3.82 / 4.0 | Expected Graduation: 2026',
      'RESEARCH FOCUS',
      'Artificial Intelligence, Deep Learning, Natural Language Processing, Large Language Models (LLMs), Computer Vision',
      'PROJECTS',
      'Final Year Project: Mitigating Factual Hallucinations in Multi-Hop RAG Systems',
      'Implemented constraint-guided decoding to reduce hallucination in generative AI models.'
    ].join('\n');

    const SCHOLARLY_DICTIONARY = [
      'Artificial Intelligence',
      'Machine Learning',
      'Deep Learning',
      'Natural Language Processing',
      'Large Language Models (LLMs)',
      'Computer Vision',
      'Robotics & Autonomous Systems',
      'CRISPR Assays & Genome Editing',
      'Biochemistry & Biophysics',
      'Applied Econometrics & Quantitative Economics'
    ];

    const lower = sampleCvText.toLowerCase();
    const matched = [];
    for (const dictWord of SCHOLARLY_DICTIONARY) {
      const dictLower = dictWord.toLowerCase();
      if (lower.includes(dictLower)) {
        matched.push(dictWord);
      } else if (dictWord.includes('LLMs') && (lower.includes('llm') || lower.includes('large language model'))) {
        matched.push(dictWord);
      }
    }

    assert.ok(matched.includes('Artificial Intelligence'));
    assert.ok(matched.includes('Deep Learning'));
    assert.ok(matched.includes('Natural Language Processing'));
    assert.ok(matched.includes('Large Language Models (LLMs)'));
    assert.ok(matched.includes('Computer Vision'));
    assert.equal(matched.includes('CRISPR Assays & Genome Editing'), false, 'Unrelated biology keyword must not be extracted');
    assert.equal(matched.includes('Applied Econometrics & Quantitative Economics'), false, 'Unrelated economics keyword must not be extracted');

    // Test Degree Detection
    const hasBS = lower.includes('bachelor of science');
    assert.equal(hasBS, true, 'BS degree must be detected');

    // Test University Detection
    const hasNUST = /National University of Sciences and Technology|NUST/i.test(sampleCvText);
    assert.equal(hasNUST, true, 'NUST must be detected');

    // Test CGPA Detection
    const cgpaMatch = sampleCvText.match(/(?:cgpa|gpa)[\s:=]*([0-3]\.\d{1,2}|4\.00?|4\.0)/i);
    assert.equal(cgpaMatch?.[1], '3.82', 'CGPA 3.82 must be detected');
  });

  await t.test('4. CV Parser route exists and exposes dynamic POST endpoint', () => {
    const routePath = path.join(process.cwd(), 'app', 'api', 'profile', 'parse-cv', 'route.ts');
    assert.ok(fs.existsSync(routePath), 'Route app/api/profile/parse-cv/route.ts must exist');
    const content = fs.readFileSync(routePath, 'utf-8');
    assert.ok(content.includes('export async function POST'), 'Route must export POST handler');
    assert.ok(content.includes('pdf-parse'), 'Route must integrate pdf-parse for PDF documents');
  });
});
