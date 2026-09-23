import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

test('Task 0.9: Build Error Suppression & Strict Verification Suite', async (t) => {
  await t.test('1. next.config.mjs contains NO ignoreDuringBuilds or ignoreBuildErrors', () => {
    const configPath = path.join(process.cwd(), 'next.config.mjs');
    const content = fs.readFileSync(configPath, 'utf-8');

    assert.ok(!content.includes('ignoreDuringBuilds: true'), 'ignoreDuringBuilds must be removed from next.config.mjs');
    assert.ok(!content.includes('ignoreDuringBuilds'), 'eslint ignore block should not exist');
    assert.ok(!content.includes('ignoreBuildErrors: true'), 'ignoreBuildErrors must be removed from next.config.mjs');
    assert.ok(!content.includes('ignoreBuildErrors'), 'typescript ignore block should not exist');
  });

  await t.test('2. next.config.mjs restricts image remotePatterns without wildcard hostname', () => {
    const configPath = path.join(process.cwd(), 'next.config.mjs');
    const content = fs.readFileSync(configPath, 'utf-8');

    assert.ok(!content.includes('hostname: "**"'), 'Wildcard ** hostname pattern must not be present');
    assert.ok(content.includes('lh3.googleusercontent.com'), 'Safe Google profile domain configured');
    assert.ok(content.includes('avatars.githubusercontent.com'), 'Safe GitHub profile domain configured');
  });
});
