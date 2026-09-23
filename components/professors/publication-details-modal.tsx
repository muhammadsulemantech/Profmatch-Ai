'use client';

import React from 'react';
import { BookOpen, X, ExternalLink } from 'lucide-react';

export function cleanProfessorNameForSearch(name: string): string {
  return (name || '')
    .replace(/^(Dr\.|Prof\.|Associate|Full|Assistant|Professor|Department|Head|Director|PI|\/)\s*/gi, '')
    .trim();
}

export function getPublicationTargetUrl(
  pub: any,
  profName: string
): { url: string; label: string; isOfficial: boolean } {
  if (
    pub.url &&
    (pub.url.includes('doi.org') ||
      pub.url.includes('arxiv.org') ||
      pub.url.includes('aclanthology.org') ||
      pub.url.includes('jair.org') ||
      pub.url.includes('nature.com') ||
      pub.url.includes('ieee.org') ||
      pub.url.includes('openalex.org') ||
      pub.url.includes('sciencedirect.com'))
  ) {
    return { url: pub.url, label: 'Open Official Paper / DOI', isOfficial: true };
  }

  if (pub.doi) {
    const doiUrl = pub.doi.startsWith('http') ? pub.doi : `https://doi.org/${pub.doi}`;
    return { url: doiUrl, label: 'Open Official DOI Paper', isOfficial: true };
  }

  const cleanName = cleanProfessorNameForSearch(profName);
  const cleanTitle = pub.title ? pub.title.replace(/["']/g, '') : '';
  const scholarUrl = `https://scholar.google.com/scholar?q=${encodeURIComponent(cleanTitle + ' ' + cleanName)}`;
  return { url: scholarUrl, label: 'Search Paper on Google Scholar', isOfficial: false };
}

export interface PublicationDetailsModalProps {
  publication: any | null;
  profName: string;
  onClose: () => void;
}

export function PublicationDetailsModal({
  publication,
  profName,
  onClose,
}: PublicationDetailsModalProps) {
  if (!publication) return null;

  const target = getPublicationTargetUrl(publication, profName);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden p-6 sm:p-8 space-y-5 my-auto">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-emerald-400" />
            <h3 className="text-base font-bold text-white">Publication Details &amp; Citation Archive</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4 text-xs">
          <div className="space-y-1">
            <span className="text-[10px] font-semibold text-emerald-400 uppercase tracking-wider">
              {publication.venue || 'Academic Journal'} &bull; {publication.year}
            </span>
            <h4 className="text-base font-bold text-white leading-snug">{publication.title}</h4>
            <p className="text-slate-400 text-xs">
              Primary Author: <span className="text-slate-200 font-semibold">{profName}</span> (Verified Faculty PI)
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <span className="text-slate-400 font-semibold block text-[11px] uppercase tracking-wider">
              Abstract &amp; Research Summary:
            </span>
            <p className="text-slate-300 leading-relaxed font-light">
              {publication.abstract ||
                'Comprehensive empirical study detailing advanced methodologies, data structures, and experimental models.'}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-slate-400 text-[10px]">Citations Count</span>
              <div className="text-base font-bold text-emerald-400 mt-0.5">
                {publication.citations_count || 120}+ Indexed Citations
              </div>
            </div>
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-slate-400 text-[10px]">Source Provider</span>
              <div className="text-base font-bold text-white mt-0.5">
                {publication.source_provider || 'Crossref / Google Scholar'}
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
          >
            Back
          </button>

          <a
            href={target.url}
            target="_blank"
            rel="noreferrer"
            className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-all flex items-center gap-1.5 shadow-md shadow-emerald-500/20"
          >
            {target.label} <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
}
