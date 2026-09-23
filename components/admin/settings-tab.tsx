'use client';

import React from 'react';
import { Save } from 'lucide-react';

export interface SiteSettings {
  siteName: string;
  tagline: string;
  supportEmail: string;
  primaryEmail: string;
  defaultTimezone?: string;
  defaultCountry?: string;
  maintenanceMode: boolean;
  registrationOpen?: boolean;
  globalRateLimitPerHour?: number;
  maxUploadSizeMb?: number;
  announcement?: {
    enabled?: boolean;
    message?: string;
    link?: string;
  };
}

export interface SettingsTabProps {
  settings: SiteSettings;
  setSettings: React.Dispatch<React.SetStateAction<SiteSettings>>;
  saving: boolean;
  onSave: () => void;
}

export function SettingsTab({ settings, setSettings, saving, onSave }: SettingsTabProps) {
  return (
    <div className="bg-white p-6 sm:p-8 rounded border border-[#E5E7EB] shadow-sm space-y-6">
      <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-4">
        <div>
          <h2 className="text-base font-serif font-bold text-[#172033]">General Platform Configuration</h2>
          <p className="text-xs text-[#556070]">Manage public institutional identity, global scope, and primary contact emails.</p>
        </div>
        <button
          onClick={onSave}
          disabled={saving}
          className="px-4 py-2 rounded bg-[#3157A4] hover:bg-[#254587] text-white text-xs font-medium flex items-center gap-1.5 transition-all shadow-sm disabled:opacity-50"
        >
          <Save className="w-3.5 h-3.5" /> {saving ? 'Saving...' : 'Save Configuration'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-xs font-semibold text-[#172033] mb-1.5">Platform Name</label>
          <input
            type="text"
            value={settings.siteName}
            onChange={e => setSettings({ ...settings, siteName: e.target.value })}
            className="w-full px-3.5 py-2.5 bg-white border border-[#E5E7EB] rounded text-xs text-[#172033] focus:outline-none focus:border-[#3157A4] transition-colors"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#172033] mb-1.5">Institutional Support Email</label>
          <input
            type="email"
            value={settings.supportEmail}
            onChange={e => setSettings({ ...settings, supportEmail: e.target.value })}
            className="w-full px-3.5 py-2.5 bg-white border border-[#E5E7EB] rounded text-xs text-[#172033] focus:outline-none focus:border-[#3157A4] transition-colors"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-xs font-semibold text-[#172033] mb-1.5">Editorial Mission Tagline</label>
          <input
            type="text"
            value={settings.tagline}
            onChange={e => setSettings({ ...settings, tagline: e.target.value })}
            className="w-full px-3.5 py-2.5 bg-white border border-[#E5E7EB] rounded text-xs text-[#172033] focus:outline-none focus:border-[#3157A4] transition-colors"
          />
        </div>

        <div className="md:col-span-2 p-4 rounded bg-[#FAF9F5] border border-[#E5E7EB] space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold text-[#172033]">Top Academic Notification Banner</h3>
              <p className="text-[11px] text-[#556070]">Displays institutional updates at the very top of all visitor viewports</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.announcement?.enabled ?? true}
                onChange={e =>
                  setSettings({
                    ...settings,
                    announcement: {
                      enabled: e.target.checked,
                      message: settings.announcement?.message || '',
                      link: settings.announcement?.link || '',
                    },
                  })
                }
                className="sr-only peer"
              />
              <div className="w-10 h-5 bg-[#E5E7EB] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#3157A4]"></div>
            </label>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#172033] mb-1">Banner Announcement Text</label>
            <input
              type="text"
              value={settings.announcement?.message || ''}
              onChange={e =>
                setSettings({
                  ...settings,
                  announcement: {
                    enabled: settings.announcement?.enabled ?? true,
                    message: e.target.value,
                    link: settings.announcement?.link || '',
                  },
                })
              }
              className="w-full px-3.5 py-2 bg-white border border-[#E5E7EB] rounded text-xs text-[#172033] focus:outline-none focus:border-[#3157A4]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#172033] mb-1">Target Destination Link</label>
            <input
              type="text"
              value={settings.announcement?.link || ''}
              onChange={e =>
                setSettings({
                  ...settings,
                  announcement: {
                    enabled: settings.announcement?.enabled ?? true,
                    message: settings.announcement?.message || '',
                    link: e.target.value,
                  },
                })
              }
              placeholder="/search"
              className="w-full px-3.5 py-2 bg-white border border-[#E5E7EB] rounded text-xs text-[#172033] focus:outline-none focus:border-[#3157A4]"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
