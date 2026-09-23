'use client';

export interface FeatureFlag {
  flag_key: string;
  name: string;
  description: string;
  is_enabled: boolean;
  updated_at: string;
}

export interface FlagsTabProps {
  flags: FeatureFlag[];
  onToggleFlag: (flagKey: string, currentStatus: boolean) => void;
}

export function FlagsTab({ flags, onToggleFlag }: FlagsTabProps) {
  return (
    <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-slate-800 space-y-6">
      <div className="border-b border-slate-800 pb-4">
        <h2 className="text-base font-bold text-white">System Feature Switches</h2>
        <p className="text-xs text-slate-400">Toggle live platform capabilities globally with zero downtime.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {flags.map(flag => (
          <div
            key={flag.flag_key}
            className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between gap-4"
          >
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white">{flag.name}</span>
                <span
                  className={`text-[9px] px-2 py-0.5 rounded font-mono font-semibold uppercase ${
                    flag.is_enabled ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {flag.is_enabled ? 'Active' : 'Disabled'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">{flag.description}</p>
            </div>

            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={flag.is_enabled}
                onChange={() => onToggleFlag(flag.flag_key, flag.is_enabled)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
            </label>
          </div>
        ))}
      </div>
    </div>
  );
}
