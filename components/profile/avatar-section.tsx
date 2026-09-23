'use client';

import React from 'react';
import { User, Camera, Loader2 } from 'lucide-react';

interface AvatarSectionProps {
  avatarUrl: string | null;
  userName?: string;
  isUploadingAvatar: boolean;
  onAvatarUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveAvatar: () => void;
  profileAvatarInputRef: React.RefObject<HTMLInputElement>;
}

export function AvatarSection({
  avatarUrl,
  userName,
  isUploadingAvatar,
  onAvatarUpload,
  onRemoveAvatar,
  profileAvatarInputRef,
}: AvatarSectionProps) {
  return (
    <div className="p-6 sm:p-8 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
        <User className="w-5 h-5 text-emerald-400" />
        <h2 className="text-base font-bold text-white">Researcher Profile Photo &amp; Avatar</h2>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-6 pt-2">
        <div className="relative group shrink-0">
          <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-emerald-500/40 bg-slate-950 flex items-center justify-center shadow-xl relative">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={userName || 'Researcher'}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-emerald-500 to-teal-500 text-slate-950 flex items-center justify-center font-black text-2xl">
                {userName?.charAt(0).toUpperCase() || 'K'}
              </div>
            )}

            {isUploadingAvatar && (
              <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                <Loader2 className="w-6 h-6 text-emerald-400 animate-spin" />
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => profileAvatarInputRef.current?.click()}
            title="Change Photo"
            className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 flex items-center justify-center shadow-md transition-transform hover:scale-110 cursor-pointer"
          >
            <Camera className="w-3.5 h-3.5" />
          </button>

          <input
            type="file"
            ref={profileAvatarInputRef}
            onChange={onAvatarUpload}
            accept="image/*"
            className="hidden"
          />
        </div>

        <div className="space-y-1.5 text-center sm:text-left flex-1">
          <h3 className="text-sm font-bold text-white">
            {userName || 'Academic Researcher'}
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed max-w-md">
            Upload your picture from your PC, laptop, or mobile device. It will appear on your workspace dashboard and header navigation pill.
          </p>
          <div className="flex items-center justify-center sm:justify-start gap-3 pt-1">
            <button
              type="button"
              onClick={() => profileAvatarInputRef.current?.click()}
              className="px-3.5 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Camera className="w-3.5 h-3.5" />
              {avatarUrl ? 'Upload New Picture' : 'Upload Profile Picture'}
            </button>
            {avatarUrl && (
              <button
                type="button"
                onClick={onRemoveAvatar}
                className="px-3 py-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800 text-xs font-medium transition-colors"
              >
                Remove Photo
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
