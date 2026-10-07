import { mockDb } from '../supabase/mock-db.ts';
import { createAdminClient } from '../supabase/admin.ts';
import { logAuditEvent } from '../security/audit.ts';
import type { LogAuditEventParams } from '../security/audit.ts';

import type { FeatureFlag, AuditLogItem } from '../../types/database.ts';


export async function getFeatureFlags(): Promise<FeatureFlag[]> {
  const supabase = createAdminClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('feature_flags')
        .select('*')
        .order('created_at', { ascending: true });
      if (!error && data && data.length > 0) {
        mockDb.featureFlags = data;
        return data as FeatureFlag[];
      }
    } catch {
      // fallback to mockDb
    }
  }
  mockDb.loadFromDisk();
  return mockDb.featureFlags;
}

export async function updateFeatureFlag(
  flagKey: string,
  isEnabled: boolean,
  adminUser?: { id: string; email: string }
): Promise<FeatureFlag> {
  const supabase = createAdminClient();
  let updatedFlag: FeatureFlag | null = null;
  const now = new Date().toISOString();

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('feature_flags')
        .update({ is_enabled: isEnabled, updated_at: now })
        .eq('flag_key', flagKey)
        .select()
        .single();
      if (!error && data) {
        updatedFlag = data as FeatureFlag;
      }
    } catch {
      // fallback
    }
  }

  mockDb.loadFromDisk();
  const flag = mockDb.featureFlags.find((f) => f.flag_key === flagKey);
  if (flag) {
    flag.is_enabled = isEnabled;
    flag.updated_at = now;
    mockDb.persist();
  }

  if (adminUser) {
    await logAuditEvent({
      action: 'FEATURE_FLAG_TOGGLED',
      resourceType: 'FEATURE_FLAG',
      resourceId: flagKey,
      metadata: { isEnabled },
      userId: adminUser.id,
      userEmail: adminUser.email,
    });
  }

  if (updatedFlag) return updatedFlag;
  if (flag) return flag;
  throw new Error(`Feature flag "${flagKey}" not found.`);
}

export async function getAuditLogs(
  page: number = 1,
  pageSize: number = 50
): Promise<{
  logs: AuditLogItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}> {
  const validPage = Math.max(1, page);
  const validSize = Math.max(1, Math.min(100, pageSize));
  const start = (validPage - 1) * validSize;
  const end = start + validSize - 1;

  const supabase = createAdminClient();
  if (supabase) {
    try {
      const { data, count, error } = await supabase
        .from('audit_logs')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(start, end);

      if (!error && data) {
        const total = count ?? data.length;
        const totalPages = Math.ceil(total / validSize) || 1;
        return {
          logs: data as AuditLogItem[],
          total,
          page: validPage,
          pageSize: validSize,
          totalPages,
        };
      }
    } catch {
      // fallback
    }
  }

  mockDb.loadFromDisk();
  const allLogs = mockDb.auditLogs;
  const total = allLogs.length;
  const totalPages = Math.ceil(total / validSize) || 1;
  const paginated = allLogs.slice(start, start + validSize);

  return {
    logs: paginated,
    total,
    page: validPage,
    pageSize: validSize,
    totalPages,
  };
}

