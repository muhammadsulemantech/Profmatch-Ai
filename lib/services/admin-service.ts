import { mockDb } from '@/lib/supabase/mock-db';
import { logAuditEvent, LogAuditEventParams } from '@/lib/security/audit';
import type { FeatureFlag, AuditLogItem } from '@/types/database';

export async function getFeatureFlags(): Promise<FeatureFlag[]> {
  mockDb.loadFromDisk();
  return mockDb.featureFlags;
}

export async function updateFeatureFlag(
  flagKey: string,
  isEnabled: boolean,
  adminUser?: { id: string; email: string }
): Promise<FeatureFlag> {
  mockDb.loadFromDisk();
  const flag = mockDb.featureFlags.find((f) => f.flag_key === flagKey);
  if (!flag) {
    throw new Error(`Feature flag "${flagKey}" not found.`);
  }

  flag.is_enabled = isEnabled;
  flag.updated_at = new Date().toISOString();
  mockDb.persist();

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

  return flag;
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
  mockDb.loadFromDisk();
  const allLogs = mockDb.auditLogs;
  const total = allLogs.length;
  const validPage = Math.max(1, page);
  const validSize = Math.max(1, Math.min(100, pageSize));
  const totalPages = Math.ceil(total / validSize) || 1;
  const start = (validPage - 1) * validSize;
  const paginated = allLogs.slice(start, start + validSize);

  return {
    logs: paginated,
    total,
    page: validPage,
    pageSize: validSize,
    totalPages,
  };
}
