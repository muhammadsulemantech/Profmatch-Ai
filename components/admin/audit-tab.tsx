'use client';

export interface AuditLog {
  id: string;
  user_email: string;
  action: string;
  resource_type: string;
  created_at: string;
  ip_address: string;
}

export interface AuditTabProps {
  auditLogs: AuditLog[];
}

export function AuditTab({ auditLogs }: AuditTabProps) {
  return (
    <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
      <div className="p-6 border-b border-slate-800">
        <h2 className="text-base font-bold text-white">Immutable Security Audit Logs</h2>
        <p className="text-xs text-slate-400">Verifiable logging of privileged administrative, discovery, and security events.</p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-slate-900/90 border-b border-slate-800 text-slate-400 text-left">
              <th className="px-5 py-3 font-semibold">Timestamp</th>
              <th className="px-5 py-3 font-semibold">User Email</th>
              <th className="px-5 py-3 font-semibold">Action</th>
              <th className="px-5 py-3 font-semibold">Resource</th>
              <th className="px-5 py-3 font-semibold font-mono">IP Address</th>
            </tr>
          </thead>
          <tbody>
            {auditLogs.map(log => (
              <tr key={log.id} className="border-b border-slate-800/60 hover:bg-slate-900/40">
                <td className="px-5 py-3 font-mono text-slate-400">
                  {new Date(log.created_at).toLocaleTimeString()} {new Date(log.created_at).toLocaleDateString()}
                </td>
                <td className="px-5 py-3 text-white font-medium">{log.user_email}</td>
                <td className="px-5 py-3">
                  <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 font-mono text-[10px] font-semibold border border-amber-500/20">
                    {log.action}
                  </span>
                </td>
                <td className="px-5 py-3 text-slate-300">{log.resource_type}</td>
                <td className="px-5 py-3 font-mono text-slate-500">{log.ip_address || '127.0.0.1'}</td>
              </tr>
            ))}
            {auditLogs.length === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-8 text-center text-slate-500">
                  No security audit logs recorded yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
