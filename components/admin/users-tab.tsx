'use client';

import React from 'react';
import { Users, Sparkles, Globe, ShieldAlert, Search, X, Zap, Check } from 'lucide-react';
import { UserProfile } from '@/types/database';

export type UserPlanFilterType = 'ALL' | 'PAID' | 'FREE' | 'ADMIN';

export interface AdminUserItem extends UserProfile {
  plan_tier?: string;
  is_paid?: boolean;
  subscription_status?: string;
  subscription_end?: string | null;
  orders_count?: number;
  payments_count?: number;
}

export interface UsersTabProps {
  users: AdminUserItem[];
  userSearchTerm: string;
  setUserSearchTerm: (s: string) => void;
  userPlanFilter: UserPlanFilterType;
  setUserPlanFilter: (f: UserPlanFilterType) => void;
  onUpdateUserPlan: (userId: string, planTier: string) => void;
  onToggleSuspendUser: (userId: string, isSuspended?: boolean) => void;
}

export function UsersTab({
  users,
  userSearchTerm,
  setUserSearchTerm,
  userPlanFilter,
  setUserPlanFilter,
  onUpdateUserPlan,
  onToggleSuspendUser,
}: UsersTabProps) {
  const filteredUsers = users.filter(u => {
    if (userSearchTerm.trim()) {
      const q = userSearchTerm.toLowerCase();
      const matchesName = (u.full_name || '').toLowerCase().includes(q);
      const matchesEmail = u.email.toLowerCase().includes(q);
      if (!matchesName && !matchesEmail) return false;
    }
    if (userPlanFilter === 'PAID') return Boolean(u.is_paid);
    if (userPlanFilter === 'FREE') return !u.is_paid && u.role !== 'ADMIN';
    if (userPlanFilter === 'ADMIN') return u.role === 'ADMIN';
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 bg-slate-900/60">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-semibold">Total Registered Users</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/25 flex items-center justify-center text-indigo-400">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold font-heading text-white mt-2">{users.length}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Persisted in system database</p>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-emerald-500/25 bg-emerald-950/20">
          <div className="flex items-center justify-between">
            <span className="text-xs text-emerald-400 font-semibold">Paid Active Subscribers</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold font-heading text-emerald-300 mt-2">
            {users.filter(u => u.is_paid).length}
          </p>
          <p className="text-[11px] text-emerald-400/80 mt-0.5">Starter, Pro &amp; PhD Elite</p>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-800 bg-slate-900/60">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-semibold">Free Explorer Users</span>
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/25 flex items-center justify-center text-blue-400">
              <Globe className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold font-heading text-white mt-2">
            {users.filter(u => !u.is_paid && u.role !== 'ADMIN').length}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">Preview quota tier</p>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-800 bg-slate-900/60">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-semibold">Platform Administrators</span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-amber-400">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold font-heading text-amber-300 mt-2">
            {users.filter(u => u.role === 'ADMIN').length}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">Full governance rights</p>
        </div>
      </div>

      {/* User Management Panel */}
      <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
        <div className="p-6 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-400" />
              User Profiles &amp; Package Management
            </h2>
            <p className="text-xs text-slate-400">
              Real-time visibility of every registered student and applicant. Change any user&apos;s plan instantly.
            </p>
          </div>

          {/* Search & Filter Toolbar */}
          <div className="flex flex-col sm:flex-row items-center gap-2.5">
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Search name or email..."
                value={userSearchTerm}
                onChange={e => setUserSearchTerm(e.target.value)}
                className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
              {userSearchTerm && (
                <button
                  onClick={() => setUserSearchTerm('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 shrink-0">
              <button
                type="button"
                onClick={() => setUserPlanFilter('ALL')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                  userPlanFilter === 'ALL' ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                All ({users.length})
              </button>
              <button
                type="button"
                onClick={() => setUserPlanFilter('PAID')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                  userPlanFilter === 'PAID' ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                Paid ({users.filter(u => u.is_paid).length})
              </button>
              <button
                type="button"
                onClick={() => setUserPlanFilter('FREE')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                  userPlanFilter === 'FREE' ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                Free ({users.filter(u => !u.is_paid && u.role !== 'ADMIN').length})
              </button>
              <button
                type="button"
                onClick={() => setUserPlanFilter('ADMIN')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                  userPlanFilter === 'ADMIN' ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                Admins ({users.filter(u => u.role === 'ADMIN').length})
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-slate-900/90 border-b border-slate-800 text-slate-400 text-left">
                <th className="px-5 py-3 font-semibold">User</th>
                <th className="px-5 py-3 font-semibold">Current Package</th>
                <th className="px-5 py-3 font-semibold">Subscription Status</th>
                <th className="px-5 py-3 font-semibold">Account Role</th>
                <th className="px-5 py-3 font-semibold">Joined Date</th>
                <th className="px-5 py-3 font-semibold text-right">Assign Plan / Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map(u => {
                const tier = (u.plan_tier || 'FREE').toUpperCase();
                return (
                  <tr key={u.id} className="border-b border-slate-800/60 hover:bg-slate-900/40 transition-colors">
                    <td className="px-5 py-4">
                      <div>
                        <p className="font-semibold text-white">{u.full_name || 'Academic User'}</p>
                        <p className="text-slate-400 text-[11px] font-mono">{u.email}</p>
                        <span className="text-[10px] text-slate-500 font-mono">ID: {u.id}</span>
                      </div>
                    </td>

                    {/* Current Package */}
                    <td className="px-5 py-4">
                      {tier === 'ELITE' ? (
                        <span className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-teal-500/15 text-teal-300 border border-teal-500/30 inline-flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-teal-400" /> PhD Elite (Worldwide)
                        </span>
                      ) : tier === 'PRO' ? (
                        <span className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 inline-flex items-center gap-1">
                          <Zap className="w-3 h-3 text-emerald-400" /> Pro Researcher
                        </span>
                      ) : tier === 'STARTER' ? (
                        <span className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-blue-500/15 text-blue-300 border border-blue-500/30 inline-flex items-center gap-1">
                          Scholar Starter
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-md text-[10px] font-medium bg-slate-800 text-slate-400 border border-slate-700">
                          Free Explorer
                        </span>
                      )}
                    </td>

                    {/* Subscription Status */}
                    <td className="px-5 py-4">
                      <div className="space-y-1">
                        {u.is_paid ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 inline-flex items-center gap-1">
                            <Check className="w-3 h-3" /> Paid Subscriber
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-800/80 text-slate-400">
                            Free User
                          </span>
                        )}
                        {(u.orders_count || 0) > 0 && (
                          <p className="text-[10px] text-slate-400">
                            {u.orders_count} orders • {u.payments_count || 0} payments
                          </p>
                        )}
                      </div>
                    </td>

                    {/* Role */}
                    <td className="px-5 py-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          u.role === 'ADMIN'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>

                    {/* Joined Date */}
                    <td className="px-5 py-4 text-slate-400">
                      {new Date(u.created_at).toLocaleDateString()}
                    </td>

                    {/* Plan Assignment & Actions */}
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* Quick Plan Switch Dropdown */}
                        <select
                          value={u.plan_tier || 'FREE'}
                          onChange={e => onUpdateUserPlan(u.id, e.target.value)}
                          className="bg-slate-950 border border-slate-800 text-slate-200 text-[11px] rounded-lg px-2.5 py-1 focus:outline-none focus:border-emerald-500 cursor-pointer"
                          title="Change user package plan directly"
                        >
                          <option value="FREE">Free Explorer</option>
                          <option value="STARTER">Scholar Starter</option>
                          <option value="PRO">Pro Researcher</option>
                          <option value="ELITE">PhD Elite</option>
                        </select>

                        {/* Suspend Button */}
                        <button
                          onClick={() => onToggleSuspendUser(u.id, (u as any).is_suspended)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-colors ${
                            (u as any).is_suspended
                              ? 'border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10'
                              : 'border-rose-500/30 text-rose-400 hover:bg-rose-500/10'
                          }`}
                        >
                          {(u as any).is_suspended ? 'Reactivate' : 'Suspend'}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-slate-500">
                    No registered users match your search or filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
