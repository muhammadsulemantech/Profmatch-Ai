'use client';

import React from 'react';
import { Cpu, Sparkles, CheckCircle2, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function CoreCapabilitiesSection() {
  return (
    <section id="features" className="py-24 bg-[#080B11] border-b border-slate-800/80 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-emerald-500/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[500px] h-[300px] bg-cyan-500/5 blur-[100px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="max-w-3xl mb-16 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-semibold tracking-wide">
            <Cpu className="w-3.5 h-3.5 text-emerald-400" />
            <span>CORE ARCHITECTURE &amp; CAPABILITIES</span>
          </div>
          <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold text-white tracking-tight leading-tight">
            A serious research platform built for graduate candidates.
          </h2>
          <p className="text-sm sm:text-base text-slate-400 leading-relaxed max-w-2xl">
            Engineered with verifiable institutional registries, direct publication mining, and rigorous academic protocols at every stage.
          </p>
        </div>

        {/* 6 High-Fidelity Custom Capability Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          
          {/* 1. Worldwide Institutional Coverage */}
          <div className="rounded-2xl bg-gradient-to-b from-slate-900/90 to-slate-950/80 border border-slate-800 hover:border-emerald-500/40 transition-all duration-300 p-6 flex flex-col justify-between group shadow-lg hover:shadow-emerald-500/5">
            <div>
              {/* Custom Organic Illustration: Layered Global Radar Graphic */}
              <div className="relative h-36 w-full rounded-xl bg-slate-950/80 border border-slate-800/80 overflow-hidden mb-6 flex items-center justify-center p-3">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-emerald-500/15 via-transparent to-transparent opacity-80" />
                
                {/* SVG Bespoke Globe & Geo Nodes */}
                <svg className="w-full h-full max-w-[200px]" viewBox="0 0 200 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                  {/* Outer Orbit & Grid */}
                  <ellipse cx="100" cy="60" rx="80" ry="48" stroke="#334155" strokeWidth="1" strokeDasharray="3 3" />
                  <ellipse cx="100" cy="60" rx="60" ry="36" stroke="#10b981" strokeWidth="1" strokeOpacity="0.4" />
                  <ellipse cx="100" cy="60" rx="35" ry="22" stroke="#059669" strokeWidth="1.2" strokeOpacity="0.6" />
                  <line x1="20" y1="60" x2="180" y2="60" stroke="#334155" strokeWidth="1" strokeOpacity="0.5" />
                  <line x1="100" y1="12" x2="100" y2="108" stroke="#334155" strokeWidth="1" strokeOpacity="0.5" />
                  
                  {/* Geographic Cluster Points */}
                  <circle cx="68" cy="42" r="4" fill="#10b981" className="animate-pulse" />
                  <circle cx="68" cy="42" r="9" stroke="#10b981" strokeWidth="0.8" strokeOpacity="0.4" />
                  
                  <circle cx="128" cy="48" r="3.5" fill="#34d399" />
                  <circle cx="128" cy="48" r="8" stroke="#34d399" strokeWidth="0.8" strokeOpacity="0.3" />
                  
                  <circle cx="145" cy="72" r="3" fill="#059669" />
                  <circle cx="85" cy="78" r="3" fill="#10b981" />
                  <circle cx="105" cy="38" r="3" fill="#34d399" />
                  
                  {/* Coordinates connection laser */}
                  <path d="M68 42 L105 38 L128 48 L145 72" stroke="#10b981" strokeWidth="1.2" strokeOpacity="0.6" strokeDasharray="2 2" />
                </svg>

                {/* Floating Meta Badge */}
                <div className="absolute top-3 left-3 bg-slate-900/90 backdrop-blur-md px-2.5 py-1 rounded-md border border-emerald-500/30 text-[10px] font-mono text-emerald-400 flex items-center gap-1.5 shadow-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  <span>190+ NATIONS INDEXED</span>
                </div>
                <div className="absolute bottom-2.5 right-3 text-[9px] font-mono text-slate-500">
                  GEO: 42.36°N, 71.09°W
                </div>
              </div>

              {/* Title & Description */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-400">
                  <span>Global Faculty Directory</span>
                </div>
                <h3 className="text-lg font-bold text-white group-hover:text-emerald-300 transition-colors">
                  Worldwide Institutional Coverage
                </h3>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                  Index accredited faculty appointments across 190+ countries and territories without regional blind spots or paywalled directories.
                </p>
              </div>
            </div>

            {/* Footer Tag */}
            <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
              <span className="text-emerald-400/90 font-medium flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Continuous Sync
              </span>
              <span className="font-mono text-slate-500">Tier-1 &amp; R1 Labs</span>
            </div>
          </div>

          {/* 2. All Academic Fields & Subfields */}
          <div className="rounded-2xl bg-gradient-to-b from-slate-900/90 to-slate-950/80 border border-slate-800 hover:border-cyan-500/40 transition-all duration-300 p-6 flex flex-col justify-between group shadow-lg hover:shadow-cyan-500/5">
            <div>
              {/* Custom Organic Illustration: Scholarly Taxonomy Graph */}
              <div className="relative h-36 w-full rounded-xl bg-slate-950/80 border border-slate-800/80 overflow-hidden mb-6 flex items-center justify-center p-3">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-cyan-500/15 via-transparent to-transparent opacity-80" />
                
                {/* SVG Knowledge Graph */}
                <svg className="w-full h-full max-w-[220px]" viewBox="0 0 220 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                  {/* Connecting Synaptic Edges */}
                  <line x1="110" y1="60" x2="45" y2="35" stroke="#0284c7" strokeWidth="1.2" strokeOpacity="0.5" />
                  <line x1="110" y1="60" x2="175" y2="35" stroke="#06b6d4" strokeWidth="1.2" strokeOpacity="0.5" />
                  <line x1="110" y1="60" x2="60" y2="95" stroke="#0ea5e9" strokeWidth="1.2" strokeOpacity="0.5" />
                  <line x1="110" y1="60" x2="160" y2="95" stroke="#38bdf8" strokeWidth="1.2" strokeOpacity="0.5" />
                  <line x1="110" y1="60" x2="110" y2="18" stroke="#06b6d4" strokeWidth="1.2" strokeOpacity="0.4" />

                  {/* Central Academic Core */}
                  <circle cx="110" cy="60" r="16" fill="#082f49" stroke="#06b6d4" strokeWidth="2" />
                  <circle cx="110" cy="60" r="6" fill="#38bdf8" />
                  
                  {/* Discipline Outer Nodes */}
                  <g>
                    <circle cx="45" cy="35" r="11" fill="#0c4a6e" stroke="#0284c7" strokeWidth="1.5" />
                    <text x="45" y="38" textAnchor="middle" fill="#7dd3fc" fontSize="8" fontFamily="monospace" fontWeight="bold">AI</text>
                  </g>
                  <g>
                    <circle cx="175" cy="35" r="11" fill="#0c4a6e" stroke="#06b6d4" strokeWidth="1.5" />
                    <text x="175" y="38" textAnchor="middle" fill="#67e8f9" fontSize="8" fontFamily="monospace" fontWeight="bold">BIO</text>
                  </g>
                  <g>
                    <circle cx="60" cy="95" r="10" fill="#0c4a6e" stroke="#0ea5e9" strokeWidth="1.5" />
                    <text x="60" y="98" textAnchor="middle" fill="#7dd3fc" fontSize="7" fontFamily="monospace" fontWeight="bold">ENG</text>
                  </g>
                  <g>
                    <circle cx="160" cy="95" r="10" fill="#0c4a6e" stroke="#38bdf8" strokeWidth="1.5" />
                    <text x="160" y="98" textAnchor="middle" fill="#bae6fd" fontSize="7" fontFamily="monospace" fontWeight="bold">SCI</text>
                  </g>
                  <g>
                    <circle cx="110" cy="18" r="8" fill="#0c4a6e" stroke="#06b6d4" strokeWidth="1.2" />
                    <text x="110" y="21" textAnchor="middle" fill="#67e8f9" fontSize="6" fontFamily="monospace">MED</text>
                  </g>
                </svg>

                {/* Floating Meta Badge */}
                <div className="absolute top-3 left-3 bg-slate-900/90 backdrop-blur-md px-2.5 py-1 rounded-md border border-cyan-500/30 text-[10px] font-mono text-cyan-400 flex items-center gap-1.5 shadow-sm">
                  <Sparkles className="w-3 h-3 text-cyan-400" />
                  <span>14,000+ SCHOLARLY TOPICS</span>
                </div>
                <div className="absolute bottom-2.5 right-3 text-[9px] font-mono text-slate-500">
                  CROSSREF / OPENALEX
                </div>
              </div>

              {/* Title & Description */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-cyan-400">
                  <span>Taxonomy &amp; Classification</span>
                </div>
                <h3 className="text-lg font-bold text-white group-hover:text-cyan-300 transition-colors">
                  All Academic Fields &amp; Subfields
                </h3>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                  From computational sustainability and robotics to public health, quantitative economics, materials science, and architecture.
                </p>
              </div>
            </div>

            {/* Footer Tag */}
            <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
              <span className="text-cyan-400/90 font-medium flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Concept Level Search
              </span>
              <span className="font-mono text-slate-500">Granular Tree</span>
            </div>
          </div>

          {/* 3. Verified .edu & .ac Emails Only */}
          <div className="rounded-2xl bg-gradient-to-b from-slate-900/90 to-slate-950/80 border border-slate-800 hover:border-emerald-500/40 transition-all duration-300 p-6 flex flex-col justify-between group shadow-lg hover:shadow-emerald-500/5">
            <div>
              {/* Custom Organic Illustration: Cryptographic Institutional Verification Seal */}
              <div className="relative h-36 w-full rounded-xl bg-slate-950/80 border border-slate-800/80 overflow-hidden mb-6 flex items-center justify-center p-3">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-emerald-500/15 via-transparent to-transparent opacity-80" />
                
                {/* SVG Institutional Seal */}
                <svg className="w-full h-full max-w-[200px]" viewBox="0 0 200 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                  {/* Concentric Verification Rings */}
                  <circle cx="100" cy="56" r="42" stroke="#10b981" strokeWidth="1" strokeOpacity="0.3" strokeDasharray="4 3" />
                  <circle cx="100" cy="56" r="34" stroke="#059669" strokeWidth="1.5" strokeOpacity="0.6" />
                  <circle cx="100" cy="56" r="28" fill="#064e3b" fillOpacity="0.4" />
                  
                  {/* Shield Check Emblem */}
                  <path d="M100 38 L114 44 V58 C114 68 100 75 100 75 C100 75 86 68 86 58 V44 L100 38 Z" fill="#047857" stroke="#34d399" strokeWidth="1.5" />
                  <path d="M94 56 L98 60 L107 51" stroke="#ecfdf5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  
                  {/* Decorative Academic Ribbon */}
                  <path d="M72 90 L100 84 L128 90 L120 78 L100 82 L80 78 Z" fill="#065f46" stroke="#10b981" strokeWidth="1" />
                </svg>

                {/* Floating Meta Badge */}
                <div className="absolute top-3 left-3 bg-slate-900/90 backdrop-blur-md px-2.5 py-1 rounded-md border border-emerald-500/30 text-[10px] font-mono text-emerald-400 flex items-center gap-1.5 shadow-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span>RFC-5322 &amp; DNS CHECKED</span>
                </div>
                <div className="absolute bottom-2.5 right-3 text-[9px] font-mono text-slate-500">
                  @*.edu · @*.ac.* ONLY
                </div>
              </div>

              {/* Title & Description */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-400">
                  <span>Official Inboxes</span>
                </div>
                <h3 className="text-lg font-bold text-white group-hover:text-emerald-300 transition-colors">
                  Verified .edu &amp; .ac Emails Only
                </h3>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                  Every faculty contact is verified against institutional faculty pages and active publication registries, discarding dead accounts.
                </p>
              </div>
            </div>

            {/* Footer Tag */}
            <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
              <span className="text-emerald-400/90 font-medium flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Zero Bounce Guarantee
              </span>
              <span className="font-mono text-slate-500">Active MX Records</span>
            </div>
          </div>

          {/* 4. Interdisciplinary Lab Pairing */}
          <div className="rounded-2xl bg-gradient-to-b from-slate-900/90 to-slate-950/80 border border-slate-800 hover:border-purple-500/40 transition-all duration-300 p-6 flex flex-col justify-between group shadow-lg hover:shadow-purple-500/5">
            <div>
              {/* Custom Organic Illustration: Dual-Orbital Interdisciplinary Fusion */}
              <div className="relative h-36 w-full rounded-xl bg-slate-950/80 border border-slate-800/80 overflow-hidden mb-6 flex items-center justify-center p-3">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-purple-500/15 via-transparent to-transparent opacity-80" />
                
                {/* SVG Orbital Fusion */}
                <svg className="w-full h-full max-w-[220px]" viewBox="0 0 220 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                  {/* Left Orbital: Engineering */}
                  <ellipse cx="85" cy="60" rx="45" ry="32" stroke="#a855f7" strokeWidth="1.2" strokeOpacity="0.5" strokeDasharray="4 2" transform="rotate(-15 85 60)" />
                  <circle cx="55" cy="50" r="5" fill="#9333ea" />
                  <text x="55" y="40" textAnchor="middle" fill="#d8b4fe" fontSize="7" fontFamily="monospace">DEPT A</text>

                  {/* Right Orbital: Life Sciences */}
                  <ellipse cx="135" cy="60" rx="45" ry="32" stroke="#c084fc" strokeWidth="1.2" strokeOpacity="0.5" strokeDasharray="4 2" transform="rotate(15 135 60)" />
                  <circle cx="165" cy="70" r="5" fill="#a855f7" />
                  <text x="165" y="86" textAnchor="middle" fill="#e9d5ff" fontSize="7" fontFamily="monospace">DEPT B</text>

                  {/* Central Intersection Fusion Core */}
                  <circle cx="110" cy="60" r="14" fill="#3b0764" stroke="#c084fc" strokeWidth="1.8" />
                  <circle cx="110" cy="60" r="5" fill="#f3e8ff" className="animate-pulse" />
                  <path d="M100 60 H120 M110 50 V70" stroke="#a855f7" strokeWidth="1.5" strokeOpacity="0.8" />
                </svg>

                {/* Floating Meta Badge */}
                <div className="absolute top-3 left-3 bg-slate-900/90 backdrop-blur-md px-2.5 py-1 rounded-md border border-purple-500/30 text-[10px] font-mono text-purple-300 flex items-center gap-1.5 shadow-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                  <span>CROSS-DEPARTMENT FUSION</span>
                </div>
                <div className="absolute bottom-2.5 right-3 text-[9px] font-mono text-slate-500">
                  CS ⟷ BIO-MED ⟷ ENG
                </div>
              </div>

              {/* Title & Description */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-purple-400">
                  <span>Boundary-Free Matching</span>
                </div>
                <h3 className="text-lg font-bold text-white group-hover:text-purple-300 transition-colors">
                  Interdisciplinary Lab Pairing
                </h3>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                  Bridge rigid faculty silos by matching research methodologies across computer science, engineering, and life sciences.
                </p>
              </div>
            </div>

            {/* Footer Tag */}
            <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
              <span className="text-purple-400/90 font-medium flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Joint Appointments
              </span>
              <span className="font-mono text-slate-500">Co-PI Detection</span>
            </div>
          </div>

          {/* 5. Fact-Grounded Outreach Drafts */}
          <div className="rounded-2xl bg-gradient-to-b from-slate-900/90 to-slate-950/80 border border-slate-800 hover:border-amber-500/40 transition-all duration-300 p-6 flex flex-col justify-between group shadow-lg hover:shadow-amber-500/5">
            <div>
              {/* Custom Organic Illustration: Scholarly Manuscript & Citation Card */}
              <div className="relative h-36 w-full rounded-xl bg-slate-950/80 border border-slate-800/80 overflow-hidden mb-6 flex items-center justify-center p-3">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-amber-500/15 via-transparent to-transparent opacity-80" />
                
                {/* Paper Mockup with Authentic Citations */}
                <div className="w-[190px] bg-slate-900 border border-amber-500/30 rounded-lg p-2.5 shadow-md space-y-1.5 relative">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-1">
                    <span className="text-[8px] font-mono text-amber-400 font-semibold">[DOI: 10.1038/s41586]</span>
                    <span className="text-[7px] font-mono text-slate-500">PEER-REVIEWED</span>
                  </div>
                  <div className="space-y-1">
                    <div className="h-1.5 w-11/12 bg-slate-700 rounded-sm" />
                    <div className="h-1.5 w-4/5 bg-slate-800 rounded-sm" />
                    <div className="h-1.5 w-full bg-amber-500/20 border-l border-amber-400 pl-1 rounded-sm flex items-center">
                      <span className="text-[7px] font-mono text-amber-300">Method: Transformer RAG v4</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-[7px] text-slate-400 pt-0.5">
                    <span className="w-1 h-1 rounded-full bg-emerald-400" />
                    <span>Matched candidate thesis synergy</span>
                  </div>
                </div>

                {/* Floating Meta Badge */}
                <div className="absolute top-3 left-3 bg-slate-900/90 backdrop-blur-md px-2.5 py-1 rounded-md border border-amber-500/30 text-[10px] font-mono text-amber-400 flex items-center gap-1.5 shadow-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  <span>FACT-GROUNDED CITATIONS</span>
                </div>
                <div className="absolute bottom-2.5 right-3 text-[9px] font-mono text-slate-500">
                  ZERO AI HALLUCINATIONS
                </div>
              </div>

              {/* Title & Description */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-400">
                  <span>Academic Correspondence</span>
                </div>
                <h3 className="text-lg font-bold text-white group-hover:text-amber-300 transition-colors">
                  Fact-Grounded Outreach Drafts
                </h3>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                  Draft scholarly correspondence citing specific recent papers and datasets, completely avoiding generic bot templates.
                </p>
              </div>
            </div>

            {/* Footer Tag */}
            <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
              <span className="text-amber-400/90 font-medium flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Paper-Specific Proofs
              </span>
              <span className="font-mono text-slate-500">Full Audit Log</span>
            </div>
          </div>

          {/* 6. Unified Application Tracker */}
          <div className="rounded-2xl bg-gradient-to-b from-slate-900/90 to-slate-950/80 border border-slate-800 hover:border-teal-500/40 transition-all duration-300 p-6 flex flex-col justify-between group shadow-lg hover:shadow-teal-500/5">
            <div>
              {/* Custom Organic Illustration: Academic Kanban Board Micro-Interface */}
              <div className="relative h-36 w-full rounded-xl bg-slate-950/80 border border-slate-800/80 overflow-hidden mb-6 flex items-center justify-center p-3">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-teal-500/15 via-transparent to-transparent opacity-80" />
                
                {/* 3 Pipeline Stage Columns */}
                <div className="flex items-center gap-2 w-full max-w-[210px]">
                  {/* Column 1: Shortlist */}
                  <div className="flex-1 bg-slate-900/90 border border-slate-800 rounded-md p-1.5 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[7px] font-mono text-slate-400 font-bold">SAVED</span>
                      <span className="text-[7px] font-mono text-slate-400 bg-slate-800 px-1 rounded">12</span>
                    </div>
                    <div className="h-5 bg-slate-950/90 rounded border border-slate-800 p-1 flex items-center">
                      <span className="text-[6px] text-slate-300 truncate">Prof. Martinez</span>
                    </div>
                    <div className="h-5 bg-slate-950/90 rounded border border-slate-800 p-1 flex items-center">
                      <span className="text-[6px] text-slate-300 truncate">Dr. Schmidt</span>
                    </div>
                  </div>

                  {/* Column 2: Contacted */}
                  <div className="flex-1 bg-slate-900/90 border border-teal-500/30 rounded-md p-1.5 space-y-1 shadow-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-[7px] font-mono text-teal-300 font-bold">SENT</span>
                      <span className="text-[7px] font-mono text-teal-400 bg-teal-500/20 px-1 rounded">5</span>
                    </div>
                    <div className="h-5 bg-teal-950/40 rounded border border-teal-500/40 p-1 flex items-center justify-between">
                      <span className="text-[6px] text-teal-200 truncate">MIT CSAIL</span>
                      <span className="w-1.5 h-1.5 rounded-full bg-teal-400" />
                    </div>
                    <div className="h-5 bg-slate-950/90 rounded border border-slate-800 p-1 flex items-center">
                      <span className="text-[6px] text-slate-300 truncate">Oxford Lab</span>
                    </div>
                  </div>

                  {/* Column 3: Interview */}
                  <div className="flex-1 bg-slate-900/90 border border-emerald-500/40 rounded-md p-1.5 space-y-1 shadow-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-[7px] font-mono text-emerald-300 font-bold">OFFER</span>
                      <span className="text-[7px] font-mono text-emerald-400 bg-emerald-500/20 px-1 rounded">2</span>
                    </div>
                    <div className="h-5 bg-emerald-950/50 rounded border border-emerald-500/50 p-1 flex items-center justify-between">
                      <span className="text-[6px] text-emerald-200 truncate">PhD Funded</span>
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    </div>
                  </div>
                </div>

                {/* Floating Meta Badge */}
                <div className="absolute top-3 left-3 bg-slate-900/90 backdrop-blur-md px-2.5 py-1 rounded-md border border-teal-500/30 text-[10px] font-mono text-teal-300 flex items-center gap-1.5 shadow-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-400" />
                  <span>UNIFIED ADMISSIONS CRM</span>
                </div>
                <div className="absolute bottom-2.5 right-3 text-[9px] font-mono text-slate-500">
                  REAL-TIME PIPELINE
                </div>
              </div>

              {/* Title & Description */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-teal-400">
                  <span>Application Pipeline</span>
                </div>
                <h3 className="text-lg font-bold text-white group-hover:text-teal-300 transition-colors">
                  Unified Application Tracker
                </h3>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                  Track faculty replies, prospective advisor interviews, and graduate school deadlines in one organized personal workspace.
                </p>
              </div>
            </div>

            {/* Footer Tag */}
            <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
              <span className="text-teal-400/90 font-medium flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Automated Sync
              </span>
              <span className="font-mono text-slate-500">Interview Kanban</span>
            </div>
          </div>

        </div>

        {/* Bottom CTA Banner inside section */}
        <div className="mt-16 p-6 sm:p-8 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900/90 to-slate-950 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-1.5 text-center sm:text-left">
            <h4 className="text-base sm:text-lg font-bold text-white">
              Ready to explore verified research labs across the globe?
            </h4>
            <p className="text-xs sm:text-sm text-slate-400">
              Start with free grounded searches and see instant publication overlap with faculty in your field.
            </p>
          </div>
          <Link
            href="/search"
            className="shrink-0 px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-xs sm:text-sm flex items-center gap-2 transition-all shadow-lg shadow-emerald-500/10 hover:shadow-emerald-500/20"
          >
            <span>Launch Faculty Discovery</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}

