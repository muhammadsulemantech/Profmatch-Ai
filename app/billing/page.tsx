'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  CreditCard,
  CheckCircle2,
  Clock,
  XCircle,
  ExternalLink,
  Zap,
  Sparkles,
  RefreshCw,
  Lock,
} from 'lucide-react';
import { useAuth } from '@/lib/auth/auth-context';
import { getPlanConfig } from '@/lib/services/usage-service';
import type { PlanTier, Order, Payment } from '@/types/database';

export default function BillingPage() {
  const { user, isLoading } = useAuth();

  const [activeTier, setActiveTier] = useState<PlanTier>(() => {
    return ((user?.tier || (user as any)?.plan_tier || 'FREE') as PlanTier);
  });
  const [subStatus, setSubStatus] = useState<string>('free');
  const [periodEnd, setPeriodEnd] = useState<string | null>(null);
  const [isExpired, setIsExpired] = useState<boolean>(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const planConfig = getPlanConfig(activeTier);

  const refreshBillingData = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        if (data.authenticated && data.user) {
          const uTier = (data.user.tier || data.user.plan_tier || 'FREE') as PlanTier;
          setActiveTier(uTier);
          setSubStatus(data.user.subscription_status || (uTier !== 'FREE' ? 'active' : 'free'));
          setPeriodEnd(data.user.subscription_end || null);
          setIsExpired(Boolean(data.user.is_expired));

          if (typeof window !== 'undefined' && data.user.id) {
            localStorage.setItem(`profmatch_user_tier_${data.user.id}`, uTier);
          }

          // Populate live orders & payments directly from database session response
          if (Array.isArray(data.user.orders)) {
            setOrders(data.user.orders);
          }
          if (Array.isArray(data.user.payments)) {
            setPayments(data.user.payments);
          }
        }
      }
    } catch {
      // fallback
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    refreshBillingData();
  }, [refreshBillingData, user]);

  const isPaidActive = activeTier !== 'FREE' && !isExpired && subStatus === 'active';

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 mb-2">
            <CreditCard className="w-3.5 h-3.5" /> Billing &amp; Subscription Management
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Academic Plan &amp; Billing History
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Review your active plan entitlements, invoices, and verified payment transactions.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={refreshBillingData}
            disabled={isRefreshing}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 font-semibold text-xs transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} /> Sync Status
          </button>
          <Link
            href="/pricing"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 transition-all"
          >
            Change / Upgrade Plan
          </Link>
        </div>
      </div>

      {/* Current Plan Overview Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4 md:col-span-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Current Subscription</span>
            {isPaidActive ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                <CheckCircle2 className="w-3 h-3" /> ACTIVE ({activeTier})
              </span>
            ) : isExpired ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/40">
                <Clock className="w-3 h-3" /> EXPIRED (FREE)
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700">
                FREE TIER
              </span>
            )}
          </div>

          <div className="flex items-baseline gap-2">
            <h2 className="text-3xl font-extrabold text-white flex items-center gap-2">
              {activeTier === 'PRO' && <Zap className="w-6 h-6 text-emerald-400" />}
              {activeTier === 'ELITE' && <Sparkles className="w-6 h-6 text-teal-400" />}
              {planConfig.name}
            </h2>
          </div>

          <p className="text-xs text-slate-400">
            {activeTier === 'FREE'
              ? 'Free basic tier. Upgrade to unlock full AI outreach, follow-up automations, and priority search.'
              : periodEnd
              ? `Valid until ${new Date(periodEnd).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} (Active 30-day billing cycle).`
              : 'Active 30-day billing cycle.'}
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-800/80 text-xs">
            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-semibold">Global Searches</span>
              <span className="font-bold text-white">
                {planConfig.searchesLimit >= 999999 ? 'Unlimited' : `${planConfig.searchesLimit} searches / mo`}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-semibold">AI Grounded Outreach</span>
              <span className="font-bold text-emerald-400">
                {planConfig.draftsLimit >= 999999 ? 'Unlimited' : `${planConfig.draftsLimit} drafts / mo`}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-semibold">Country Scope</span>
              <span className="font-bold text-white">
                {planConfig.allowedCountries === 'ALL'
                  ? '190+ Countries (Worldwide)'
                  : `${Array.isArray(planConfig.allowedCountries) ? planConfig.allowedCountries.length : 2}+ Countries`}
              </span>
            </div>
          </div>
        </div>

        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4 flex flex-col justify-between">
          <div className="space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Need More Volume?</span>
            <h3 className="text-lg font-bold text-white">
              {activeTier === 'ELITE' ? 'PhD Elite Worldwide' : 'Pro Researcher & Elite'}
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              {activeTier === 'ELITE'
                ? 'You have unrestricted 100% worldwide faculty indexing and high-capacity AutoPilot outreach.'
                : 'Target up to 250+ verified professors with priority indexing, AutoPilot automation, and direct contact details.'}
            </p>
          </div>

          <Link
            href="/pricing"
            className="w-full py-2.5 rounded-xl bg-slate-900 border border-slate-700 hover:bg-slate-800 text-xs font-bold text-white text-center transition-colors block"
          >
            {activeTier === 'ELITE' ? 'Manage Plans →' : 'Upgrade Plan →'}
          </Link>
        </div>
      </div>

      {/* Transaction & Order History Table */}
      <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden space-y-4">
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white">Payment &amp; Order Records</h3>
            <p className="text-xs text-slate-400">Complete immutable record of payments submitted and reviewed.</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900/80 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
              <tr>
                <th className="px-6 py-3">Order Reference</th>
                <th className="px-6 py-3">Plan</th>
                <th className="px-6 py-3">Amount</th>
                <th className="px-6 py-3">Payment Method</th>
                <th className="px-6 py-3">Transaction ID</th>
                <th className="px-6 py-3">Date</th>
                <th className="px-6 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400 font-light">
                    <div className="max-w-md mx-auto space-y-2">
                      <CreditCard className="w-8 h-8 text-slate-600 mx-auto" />
                      <p className="text-sm font-medium text-slate-300">No payment records submitted yet</p>
                      <p className="text-xs text-slate-500">
                        When you submit a payment via JazzCash, EasyPaisa, or Bank transfer in checkout, your transaction proof and real-time approval status will appear here.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                orders.map(ord => {
                  const pay = payments.find(p => p.order_reference === ord.order_reference);
                  const isApproved = ord.status === 'APPROVED';
                  const isRejected = ord.status === 'REJECTED';

                  return (
                    <tr key={ord.id} className="hover:bg-slate-900/40 transition-colors">
                      <td className="px-6 py-4 font-mono font-bold text-white">
                        <Link
                          href={`/checkout/status/${ord.order_reference}`}
                          className="text-emerald-400 hover:underline flex items-center gap-1"
                        >
                          {ord.order_reference} <ExternalLink className="w-3 h-3" />
                        </Link>
                      </td>
                      <td className="px-6 py-4 font-semibold text-white">{ord.plan_name}</td>
                      <td className="px-6 py-4 font-bold text-slate-200">
                        {ord.currency} {ord.amount.toLocaleString()}
                      </td>
                      <td className="px-6 py-4">{ord.payment_method_name}</td>
                      <td className="px-6 py-4 font-mono text-[11px] text-slate-400">
                        {pay?.transaction_id || 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-slate-400">
                        {new Date(ord.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                      <td className="px-6 py-4">
                        {isApproved ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                            <CheckCircle2 className="w-3 h-3" /> Approved
                          </span>
                        ) : isRejected ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/30">
                            <XCircle className="w-3 h-3" /> Rejected
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                            <Clock className="w-3 h-3" /> Pending Review
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
