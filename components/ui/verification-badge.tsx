import React from 'react';
import { cn } from '@/lib/utils';
import { CheckCircle2, AlertTriangle, HelpCircle, ShieldCheck } from 'lucide-react';
import { VerificationStatus } from '@/types/database';

export interface VerificationBadgeProps {
  status?: VerificationStatus | string;
  confidenceScore?: number;
  className?: string;
  showScore?: boolean;
}

export function VerificationBadge({
  status = 'UNVERIFIED',
  confidenceScore,
  className,
  showScore = false,
}: VerificationBadgeProps) {
  const normalized = (status || 'UNVERIFIED').toUpperCase();

  if (normalized === 'VERIFIED') {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-sm shadow-emerald-500/10',
          className
        )}
      >
        <ShieldCheck className="w-3.5 h-3.5" />
        <span>Verified Faculty</span>
        {showScore && confidenceScore !== undefined && (
          <span className="text-[10px] opacity-75 font-mono">({Math.round(confidenceScore * 100)}%)</span>
        )}
      </span>
    );
  }

  if (normalized === 'PARTIALLY_VERIFIED') {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20',
          className
        )}
      >
        <CheckCircle2 className="w-3.5 h-3.5" />
        <span>Partially Verified</span>
      </span>
    );
  }

  if (normalized === 'PENDING') {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20',
          className
        )}
      >
        <HelpCircle className="w-3.5 h-3.5" />
        <span>Pending Verification</span>
      </span>
    );
  }

  // Default: UNVERIFIED
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg bg-slate-800 text-slate-400 border border-slate-700/60',
        className
      )}
    >
      <AlertTriangle className="w-3.5 h-3.5 text-slate-500" />
      <span>Unverified Record</span>
    </span>
  );
}
