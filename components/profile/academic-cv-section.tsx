'use client';

import React from 'react';
import { FileText, Upload, CheckCircle2 } from 'lucide-react';

interface AcademicCvSectionProps {
  cvFile: {
    file_name: string;
    file_size: number;
    uploaded_at: string;
  };
  cvParsedNotice: string | null;
  fileInputRef: React.RefObject<HTMLInputElement>;
  onCvFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function AcademicCvSection({
  cvFile,
  cvParsedNotice,
  fileInputRef,
  onCvFileUpload,
}: AcademicCvSectionProps) {
  return (
    <div className="p-6 sm:p-8 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-purple-400" />
          <h2 className="text-base font-bold text-white">Attached Academic Curriculum Vitae (AI Auto-Parser)</h2>
        </div>
        <label
          htmlFor="cv-file-upload-input"
          className="cursor-pointer px-3.5 py-1.5 rounded-xl bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/30 text-purple-300 text-xs font-semibold flex items-center gap-1.5 transition-all"
        >
          <Upload className="w-3.5 h-3.5" /> Upload &amp; AI Parse CV
        </label>
      </div>

      {cvParsedNotice && (
        <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{cvParsedNotice}</span>
        </div>
      )}

      <input
        id="cv-file-upload-input"
        ref={fileInputRef}
        type="file"
        accept=".pdf,.doc,.docx"
        onChange={onCvFileUpload}
        className="hidden"
      />

      <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-bold text-white">{cvFile.file_name}</p>
            <p className="text-[11px] text-slate-400">
              {Math.round(cvFile.file_size / 1024)} KB &bull; Uploaded {new Date(cvFile.uploaded_at).toLocaleDateString()}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
            Active CV
          </span>
          <label
            htmlFor="cv-file-upload-input"
            className="cursor-pointer p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Upload New File"
          >
            <Upload className="w-4 h-4" />
          </label>
        </div>
      </div>

      {/* Interactive Drag & Drop Upload Zone (Always Available) */}
      <label
        htmlFor="cv-file-upload-input"
        className="block border-2 border-dashed border-slate-800 hover:border-purple-500/50 rounded-xl p-5 text-center cursor-pointer transition-colors bg-slate-950/40 space-y-1.5"
      >
        <Upload className="w-6 h-6 text-purple-400 mx-auto" />
        <p className="text-xs font-semibold text-slate-200">Click to upload or drag &amp; drop your updated CV (PDF, DOCX)</p>
        <p className="text-[10px] text-slate-500">Max file size 15MB &bull; Native upload supported on mobile, laptop &amp; PC</p>
      </label>
    </div>
  );
}
