import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const schemaPath = path.resolve('database/schema.sql');
const migrationPath = path.resolve('database/migrations/20260923_reconcile_schema.sql');

test('Schema Reconciliation: database/schema.sql and migration file integrity', async (t) => {
  assert.ok(fs.existsSync(schemaPath), 'database/schema.sql must exist');
  assert.ok(fs.existsSync(migrationPath), 'migration script 20260923_reconcile_schema.sql must exist');

  const schemaSql = fs.readFileSync(schemaPath, 'utf8');
  const migrationSql = fs.readFileSync(migrationPath, 'utf8');

  await t.test('plan_tier enum includes STARTER and ELITE', () => {
    assert.match(schemaSql, /CREATE TYPE (public\.)?plan_tier AS ENUM\s*\([^)]*'STARTER'[^)]*'ELITE'[^)]*\)/i);
    assert.match(migrationSql, /'STARTER'/);
    assert.match(migrationSql, /'ELITE'/);
  });

  await t.test('verification_status enum includes PARTIALLY_VERIFIED, SOURCE_UNAVAILABLE, STALE', () => {
    assert.match(schemaSql, /PARTIALLY_VERIFIED/);
    assert.match(schemaSql, /SOURCE_UNAVAILABLE/);
    assert.match(schemaSql, /STALE/);
    assert.match(migrationSql, /PARTIALLY_VERIFIED/);
    assert.match(migrationSql, /SOURCE_UNAVAILABLE/);
    assert.match(migrationSql, /STALE/);
  });

  await t.test('recruiting_status enum is defined', () => {
    assert.match(schemaSql, /CREATE TYPE (public\.)?recruiting_status AS ENUM/i);
    assert.match(schemaSql, /ACTIVELY_RECRUITING/);
    assert.match(schemaSql, /NOT_RECRUITING/);
  });

  await t.test('connected_email_accounts table exists with RLS and required columns', () => {
    assert.match(schemaSql, /CREATE TABLE IF NOT EXISTS (public\.)?connected_email_accounts/i);
    assert.match(schemaSql, /access_token\s+TEXT/i);
    assert.match(schemaSql, /refresh_token\s+TEXT/i);
    assert.match(schemaSql, /token_expires_at\s+BIGINT/i);
    assert.match(schemaSql, /ALTER TABLE (public\.)?connected_email_accounts ENABLE ROW LEVEL SECURITY/i);
    assert.match(schemaSql, /CREATE POLICY.*ON (public\.)?connected_email_accounts/i);
  });

  await t.test('is_admin() sets search_path = \'\' to prevent privilege escalation', () => {
    assert.match(schemaSql, /CREATE OR REPLACE FUNCTION (public\.)?is_admin\(\)\s*RETURNS\s+BOOLEAN[\s\S]*SET search_path = ''/i);
    assert.match(migrationSql, /SET search_path = ''/);
  });

  await t.test('handle_new_user() trigger creates public.profiles row automatically', () => {
    assert.match(schemaSql, /CREATE OR REPLACE FUNCTION (public\.)?handle_new_user\(\)/i);
    assert.match(schemaSql, /INSERT INTO public\.profiles/i);
    assert.match(schemaSql, /CREATE TRIGGER on_auth_user_created\s*AFTER INSERT ON auth\.users/i);
  });

  await t.test('Performance indexes exist for payments, orders, and connected accounts', () => {
    assert.match(schemaSql, /CREATE INDEX IF NOT EXISTS idx_payments_user_status/i);
    assert.match(schemaSql, /CREATE INDEX IF NOT EXISTS idx_orders_user/i);
    assert.match(schemaSql, /CREATE INDEX IF NOT EXISTS idx_subscriptions_user_status/i);
    assert.match(schemaSql, /CREATE INDEX IF NOT EXISTS idx_connected_email_accounts_user/i);
  });

  await t.test('updated_at trigger function and attachments exist', () => {
    assert.match(schemaSql, /CREATE OR REPLACE FUNCTION (public\.)?update_updated_at_column\(\)/i);
    assert.match(schemaSql, /update_profiles_updated_at/i);
    assert.match(schemaSql, /update_subscriptions_updated_at/i);
    assert.match(schemaSql, /update_connected_emails_updated_at/i);
  });
});
