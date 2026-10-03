'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import Image from 'next/image';
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
  HelpCircle,
  LogOut,
  ChevronRight,
  LogIn,
  UserPlus,
} from 'lucide-react';
import { useAuth } from '@/lib/auth/auth-context';
import { getSavedAvatar } from '@/lib/utils/avatar';

interface MobileNavProps {
  siteName: string;
}

export default function MobileNav({ siteName }: MobileNavProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [headerBottom, setHeaderBottom] = useState(64);
  const pathname = usePathname();
  const { user, isAuthenticated, logout, openAuthModal } = useAuth();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Sync avatar if user is authenticated
  useEffect(() => {
    if (user?.id) {
      setAvatarUrl(getSavedAvatar(user.id));
    } else {
      setAvatarUrl(null);
    }
  }, [user]);

  // Close mobile menu on route change
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Measure header bottom to open dropdown cleanly right below navbar
  useEffect(() => {
    if (!isOpen) return;

    const updateHeaderPosition = () => {
      const headerEl = document.querySelector('header');
      if (headerEl) {
        const rect = headerEl.getBoundingClientRect();
        setHeaderBottom(Math.max(0, Math.round(rect.bottom)));
      }
    };

    updateHeaderPosition();
    window.addEventListener('resize', updateHeaderPosition);
    window.addEventListener('scroll', updateHeaderPosition);

    return () => {
      window.removeEventListener('resize', updateHeaderPosition);
      window.removeEventListener('scroll', updateHeaderPosition);
    };
  }, [isOpen]);

  // Prevent background scrolling when menu is open & handle Escape key
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          setIsOpen(false);
        }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => {
        document.body.style.overflow = '';
        window.removeEventListener('keydown', handleKeyDown);
      };
    } else {
      document.body.style.overflow = '';
    }
  }, [isOpen]);

  const navLinks = [
    {
      href: '/search',
      label: 'Find Professors',
      sublabel: 'Universal Directory Across 190+ Countries',
      icon: Search,
      badge: 'Live',
    },
    {
      href: '/dashboard',
      label: 'Student Workspace',
      sublabel: 'Saved Professors & Matched Opportunities',
      icon: LayoutDashboard,
    },
    {
      href: '/campaigns',
      label: 'Outreach Campaigns',
      sublabel: 'Cold Email Sequences & Tracking',
      icon: Send,
    },
    {
      href: '/autopilot',
      label: 'Autonomous AutoPilot',
      sublabel: 'AI-Powered Continuous Faculty Matching',
      icon: Rocket,
      badge: 'New',
    },
    {
      href: '/tracker',
      label: 'Application Tracker',
      sublabel: 'Graduate & PhD Admissions Pipeline',
      icon: GraduationCap,
    },
    {
      href: '/pricing',
      label: 'Academic Plans & Pricing',
      sublabel: 'Transparent Tiers For Students & Labs',
      icon: CreditCard,
    },
    {
      href: '/responsible-outreach',
      label: 'Ethical Outreach Standards',
      sublabel: 'Anti-Spam Grounded Verification Guidelines',
      icon: ShieldCheck,
    },
    {
      href: '/faq',
      label: 'Verification FAQs',
      sublabel: 'Official Faculty Data & Citation Sources',
      icon: HelpCircle,
    },
  ];

  return (
    <div className="md:hidden flex items-center">
      {/* Mobile Toggle Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label={isOpen ? 'Close navigation menu' : 'Open navigation menu'}
        aria-expanded={isOpen}
        className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-lg bg-slate-900/90 border border-slate-800 text-slate-200 hover:text-white hover:border-slate-700 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
      >
        {isOpen ? <X className="w-5 h-5 text-emerald-400" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Downward-opening Dropdown Menu Portal */}
      {mounted &&
        isOpen &&
        createPortal(
          <div
            className="fixed inset-x-0 bottom-0 z-50 md:hidden flex flex-col"
            style={{ top: `${headerBottom}px` }}
            role="dialog"
            aria-modal="true"
            aria-label="Mobile Navigation Menu"
          >
            {/* Dimmed backdrop overlay */}
            <div
              className="fixed inset-0 bg-black/75 backdrop-blur-sm -z-10 transition-opacity"
              onClick={() => setIsOpen(false)}
              aria-hidden="true"
            />

            {/* Downward Dropdown Container */}
            <div
              className="w-full bg-[#080B11]/98 border-b border-slate-800/90 shadow-2xl overflow-y-auto max-h-[calc(100dvh-4.5rem)] p-4 sm:p-5 flex flex-col gap-4 animate-in slide-in-from-top-3 duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Account / Authentication Card */}
              <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
                {isAuthenticated && user ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      {avatarUrl ? (
                        <Image
                          src={avatarUrl}
                          alt={user.full_name || 'Profile'}
                          width={38}
                          height={38}
                          unoptimized
                          className="w-9 h-9 rounded-full object-cover border border-emerald-400/50 shrink-0"
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 text-slate-950 flex items-center justify-center font-bold text-sm shrink-0">
                          {user.full_name?.charAt(0).toUpperCase() || 'U'}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-white truncate">
                            {user.full_name || 'Researcher'}
                          </p>
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                            {user.role === 'ADMIN' ? 'Admin' : (user.tier || 'Free Tier')}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 truncate">{user.email}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-800/70">
                      <Link
                        href={user.role === 'ADMIN' ? '/admin' : '/dashboard'}
                        onClick={() => setIsOpen(false)}
                        className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/25 text-xs font-semibold transition-colors"
                      >
                        <LayoutDashboard className="w-3.5 h-3.5" />
                        <span>Workspace</span>
                      </Link>
                      <button
                        type="button"
                        onClick={() => {
                          setIsOpen(false);
                          logout();
                        }}
                        className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-slate-800/70 border border-slate-700/60 text-slate-300 hover:text-red-400 hover:bg-slate-800 text-xs font-medium transition-colors"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={() => {
                        setIsOpen(false);
                        openAuthModal('Create your researcher account');
                      }}
                      className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 transition-all"
                    >
                      <UserPlus className="w-4 h-4" />
                      <span>Get Started Free</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsOpen(false);
                        openAuthModal('Sign in to access your researcher workspace');
                      }}
                      className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-slate-800/80 hover:bg-slate-800 text-slate-200 border border-slate-700/80 font-semibold text-xs transition-colors"
                    >
                      <LogIn className="w-3.5 h-3.5 text-slate-400" />
                      <span>Sign In to Account</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Navigation Links */}
              <nav aria-label="Mobile Navigation Links" className="space-y-1">
                {navLinks.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsOpen(false)}
                      className={`flex items-center justify-between p-3 rounded-xl transition-all ${
                        isActive
                          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                          : 'text-slate-200 hover:text-white hover:bg-slate-900 border border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                            isActive
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : 'bg-slate-800/80 text-slate-400'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-xs font-semibold leading-tight">{item.label}</span>
                          <span className="text-[10px] text-slate-400 truncate mt-0.5">
                            {item.sublabel}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0 ml-2">
                        {item.badge && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                            {item.badge}
                          </span>
                        )}
                        <ChevronRight className="w-4 h-4 text-slate-500" />
                      </div>
                    </Link>
                  );
                })}
              </nav>

              {/* Footer Trust & Links */}
              <div className="pt-3 border-t border-slate-800/80 space-y-2">
                <div className="flex items-center gap-2 text-[11px] text-slate-400 px-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>100% Verifiable Academic Faculty Data</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-500 px-1 pt-1">
                  <Link
                    href="/privacy"
                    onClick={() => setIsOpen(false)}
                    className="hover:text-emerald-400 transition-colors"
                  >
                    Privacy
                  </Link>
                  <span>&bull;</span>
                  <Link
                    href="/terms"
                    onClick={() => setIsOpen(false)}
                    className="hover:text-emerald-400 transition-colors"
                  >
                    Terms
                  </Link>
                  <span>&bull;</span>
                  <Link
                    href={user?.role === 'ADMIN' ? '/admin' : '/admin/login'}
                    onClick={() => setIsOpen(false)}
                    className="text-amber-400 hover:underline"
                  >
                    Admin Console
                  </Link>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
