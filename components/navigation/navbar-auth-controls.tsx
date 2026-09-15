'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth/auth-context';
import { Lock, LogOut, User, Sparkles } from 'lucide-react';

export default function NavbarAuthControls() {
  const { user, isAuthenticated, logout, openAuthModal } = useAuth();

  return (
    <div className="flex items-center gap-2.5">
      <Link
        href="/admin"
        className="hidden sm:inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg border border-slate-700/80 text-slate-300 hover:text-white hover:border-slate-600 bg-slate-900/60 transition-colors"
      >
        <Lock className="w-3.5 h-3.5 text-amber-400" />
        Admin
      </Link>

      {isAuthenticated && user ? (
        <div className="flex items-center gap-2">
          {/* User status pill */}
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900/80 border border-slate-800 hover:border-emerald-500/30 text-xs font-medium text-slate-200 transition-colors"
          >
            <div className="w-5 h-5 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 text-slate-950 flex items-center justify-center font-bold text-[10px]">
              {user.full_name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <span className="max-w-[120px] truncate hidden sm:inline">{user.full_name}</span>
          </Link>

          {/* Logout Button */}
          <button
            type="button"
            onClick={() => logout()}
            className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-900/80 border border-transparent hover:border-slate-800 transition-colors text-xs inline-flex items-center gap-1"
            title="Log Out"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden md:inline text-xs">Sign Out</span>
          </button>
        </div>
      ) : (
        <>
          <button
            type="button"
            onClick={() => openAuthModal('Sign in to access your researcher workspace')}
            className="text-sm font-medium text-slate-300 hover:text-white px-3 py-1.5 transition-colors"
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => openAuthModal('Create your researcher account')}
            className="inline-flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-semibold shadow-lg shadow-emerald-500/20 transition-all"
          >
            Get Started
          </button>
        </>
      )}
    </div>
  );
}
