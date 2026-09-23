'use client';

import React from 'react';
import { Terminal, Clock } from 'lucide-react';
import { EngineStatus } from './campaign-config-panel';

export interface TerminalLog {
  id: string;
  time: string;
  type: 'INFO' | 'SEARCH' | 'AI' | 'SEND' | 'WAIT' | 'SUCCESS' | 'WARN' | 'ERROR';
  message: string;
}

interface CampaignTerminalProps {
  engineStatus: EngineStatus;
  currentProgress: number;
  batchLimit: number;
  remainingCooldown: number;
  isRunning: boolean;
  logs: TerminalLog[];
  logsContainerRef: React.RefObject<HTMLDivElement>;
}

export function CampaignTerminal({
  engineStatus,
  currentProgress,
  batchLimit,
  remainingCooldown,
  isRunning,
  logs,
  logsContainerRef,
}: CampaignTerminalProps) {
  return (
    <div className="space-y-6">
      {/* Live Status & Progress Bar */}
      <div className="glass-panel bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              {isRunning && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              )}
              <span
                className={`relative inline-flex rounded-full h-3 w-3 ${
                  isRunning ? 'bg-emerald-500' : engineStatus === 'PAUSED' ? 'bg-amber-500' : 'bg-slate-600'
                }`}
              />
            </span>
            <h3 className="font-bold text-sm text-white uppercase tracking-wider">
              Engine Status: <span className="text-emerald-400">{engineStatus}</span>
            </h3>
          </div>

          <span className="text-xs font-mono font-bold text-slate-300">
            {currentProgress} / {batchLimit} Drafts Prepared
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500"
            style={{ width: `${(currentProgress / Math.max(batchLimit, 1)) * 100}%` }}
          />
        </div>

        {/* Live Sub-Status Box */}
        {engineStatus === 'COOLDOWN' && remainingCooldown > 0 && (
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300 flex items-center justify-between">
            <span className="flex items-center gap-2 font-medium">
              <Clock className="w-4 h-4 animate-spin text-amber-400" />
              Anti-spam protection active. Holding queue...
            </span>
            <span className="font-mono font-bold text-sm bg-amber-950/60 px-2.5 py-0.5 rounded border border-amber-500/40">
              {remainingCooldown}s remaining
            </span>
          </div>
        )}
      </div>

      {/* Terminal Live Activity Logs */}
      <div className="glass-panel bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
        <div className="px-4 py-2.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2 font-mono">
            <Terminal className="w-4 h-4 text-emerald-400" />
            <span>autonomous_agent.log</span>
          </div>
          <span className="text-[10px] text-slate-500 font-mono">
            {logs.length} events logged
          </span>
        </div>

        <div
          ref={logsContainerRef}
          className="p-4 h-64 overflow-y-auto font-mono text-[11px] leading-relaxed space-y-1.5 scrollbar-thin scrollbar-thumb-slate-800"
        >
          {logs.length === 0 ? (
            <div className="text-slate-600 italic py-10 text-center">
              AutoPilot is in standby mode. Configure campaign parameters on the left and click &quot;Launch Autonomous Campaign&quot; to begin.
            </div>
          ) : (
            logs.map((log) => (
              <div key={log.id} className="flex items-start gap-2">
                <span className="text-slate-600 shrink-0 select-none">[{log.time}]</span>
                <span
                  className={
                    log.type === 'SUCCESS'
                      ? 'text-emerald-400 font-bold'
                      : log.type === 'AI'
                      ? 'text-cyan-400'
                      : log.type === 'SEARCH'
                      ? 'text-amber-400'
                      : log.type === 'WARN'
                      ? 'text-amber-300'
                      : log.type === 'ERROR'
                      ? 'text-rose-400'
                      : 'text-slate-300'
                  }
                >
                  {log.message}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
