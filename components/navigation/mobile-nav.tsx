'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Menu,
  X,
  Search,
  LayoutDashboard,
  Send,
  Rocket,
  CreditCard,
  GraduationCap,
  ShieldCheck,
  BookOpen,
  HelpCircle,
  Lock,
} from 'lucide-react';

interface MobileNavProps {
  siteName: string;
}

export default function MobileNav({ siteName }: MobileNavProps) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  // Close mobile drawer on route change
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Prevent background scrolling when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const navLinks = [
    { href: '/search', label: 'Find Professors', icon: Search, highlight: true },
    { href: '/dashboard', label: 'Student Workspace', icon: LayoutDashboard },
    { href: '/campaigns', label: 'Outreach Campaigns', icon: Send },
    { href: '/autopilot', label: 'Autonomous AutoPilot', icon: Rocket, badge: 'New' },
    { href: '/pricing', label: 'Academic Plans & Pricing', icon: CreditCard },
    { href: '/tracker', label: 'Application Tracker', icon: GraduationCap },
    { href: '/responsible-outreach', label: 'Ethical Outreach Standards', icon: ShieldCheck },
    { href: '/faq', label: 'Verification FAQs', icon: HelpCircle },
  ];

  return (
    <div className="md:hidden flex items-center">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label={isOpen ? 'Close navigation menu' : 'Open navigation menu'}
        aria-expanded={isOpen}
        className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
      >
        {isOpen ? <X className="w-5 h-5 text-emerald-400" /> : <Menu className="w-5 h-5" />}
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm transition-opacity"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        >
          <div
            className="fixed inset-y-0 right-0 w-full max-w-xs bg-[#080B11] border-l border-slate-800 p-6 flex flex-col justify-between shadow-2xl overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Mobile Navigation Menu"
          >
            <div className="space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-slate-950 font-bold shadow-md">
                    <GraduationCap className="w-4 h-4 text-slate-950" />
                  </div>
                  <span className="font-heading font-bold text-base text-white">{siteName}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  aria-label="Close navigation menu"
                  className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl bg-slate-900 text-slate-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Navigation Links */}
              <nav aria-label="Mobile Navigation" className="space-y-1.5">
                {navLinks.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-semibold transition-all min-h-[44px] ${
                        isActive
                          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                          : 'text-slate-300 hover:text-white hover:bg-slate-900 border border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                        <span>{item.label}</span>
                      </div>
                      {item.badge && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* Footer Trust & Links */}
            <div className="pt-6 border-t border-slate-800 space-y-3">
              <div className="flex items-center gap-2 text-[11px] text-slate-400">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>100% Verifiable Academic Sources</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-500 pt-1">
                <Link href="/privacy" className="hover:text-emerald-400 transition-colors">
                  Privacy
                </Link>
                <span>&bull;</span>
                <Link href="/terms" className="hover:text-emerald-400 transition-colors">
                  Terms
                </Link>
                <span>&bull;</span>
                <Link href="/admin" className="text-amber-400 hover:underline">
                  Admin
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
