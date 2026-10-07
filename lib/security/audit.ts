import { mockDb } from '../supabase/mock-db.ts';
import { createAdminClient } from '../supabase/admin.ts';


export interface LogAuditEventParams {
  userId?: string;
  userEmail?: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
}

export async function logAuditEvent(params: LogAuditEventParams): Promise<void> {
  const timestamp = new Date().toISOString();
  const entry = {
    id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    user_id: params.userId,
    user_email: params.userEmail,
    action: params.action,
    resource_type: params.resourceType,
    resource_id: params.resourceId,
    metadata: params.metadata || {},
    ip_address: params.ipAddress || 'internal',
    created_at: timestamp,
  };

  // 1. Write to mock in-memory database store
  mockDb.auditLogs.unshift(entry);
  if (mockDb.auditLogs.length > 500) {
    mockDb.auditLogs.pop();
  }
  mockDb.persist();

  // 2. If Supabase is connected, write to PostgreSQL
  const supabase = createAdminClient();
  if (supabase) {
    try {
      await supabase.from('audit_logs').insert([
        {
          user_id: params.userId,
          user_email: params.userEmail,
          action: params.action,
          resource_type: params.resourceType,
          resource_id: params.resourceId,
          metadata: params.metadata,
          ip_address: params.ipAddress,
        },
      ]);
    } catch (err) {
      console.error('[AUDIT LOG ERROR]', err);
    }
  }
}
