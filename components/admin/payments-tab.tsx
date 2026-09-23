'use client';

import React from 'react';
import {
  CreditCard,
  Search,
  ExternalLink,
  CheckCircle2,
  X,
  Clock,
} from 'lucide-react';
import { Payment } from '@/types/database';

export interface PaymentsTabProps {
  adminPayments: Payment[];
  selectedPaymentStatus: string;
  setSelectedPaymentStatus: (st: string) => void;
  paymentSearch: string;
  setPaymentSearch: (q: string) => void;
  reviewingPayment: Payment | null;
  setReviewingPayment: (p: Payment | null) => void;
  reviewAction: 'APPROVE' | 'REJECT' | null;
  setReviewAction: (a: 'APPROVE' | 'REJECT' | null) => void;
  reviewNote: string;
  setReviewNote: (n: string) => void;
  saving: boolean;
  onExecutePaymentReview: () => void;
}

export function PaymentsTab({
  adminPayments,
  selectedPaymentStatus,
  setSelectedPaymentStatus,
  paymentSearch,
  setPaymentSearch,
  reviewingPayment,
  setReviewingPayment,
  reviewAction,
  setReviewAction,
  reviewNote,
  setReviewNote,
  saving,
  onExecutePaymentReview,
}: PaymentsTabProps) {
  return (
    <div className="space-y-6">
      <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-slate-800 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-emerald-400" />
              Orders & Manual Payment Review
            </h2>
            <p className="text-xs text-slate-400">
              Verify manual transfer receipts (JazzCash, Bank transfers). Approving an order activates the user&apos;s subscription immediately.
            </p>
          </div>

          {/* Status Filter Pill Bar */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-900 rounded-xl border border-slate-800">
            {['ALL', 'PENDING', 'APPROVED', 'REJECTED'].map(st => (
              <button
                key={st}
                type="button"
                onClick={() => setSelectedPaymentStatus(st)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                  selectedPaymentStatus === st
                    ? 'bg-emerald-500 text-slate-950'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search orders by reference (PM-XXXXXX), TID, user email or student name..."
            value={paymentSearch}
            onChange={e => setPaymentSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        {/* Orders & Payments Table */}
        <div className="overflow-x-auto border border-slate-800 rounded-xl">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900/90 text-[10px] uppercase font-bold tracking-wider text-slate-400 border-b border-slate-800">
              <tr>
                <th className="px-5 py-3">Order Ref</th>
                <th className="px-5 py-3">Student Customer</th>
                <th className="px-5 py-3">Plan / Amount</th>
                <th className="px-5 py-3">Channel / TID</th>
                <th className="px-5 py-3">Proof Receipt</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {adminPayments
                .filter(p => {
                  if (selectedPaymentStatus !== 'ALL' && p.status !== selectedPaymentStatus) return false;
                  if (paymentSearch.trim() !== '') {
                    const q = paymentSearch.toLowerCase();
                    return (
                      p.order_reference.toLowerCase().includes(q) ||
                      p.transaction_id.toLowerCase().includes(q) ||
                      (p.user_email && p.user_email.toLowerCase().includes(q)) ||
                      (p.user_name && p.user_name.toLowerCase().includes(q)) ||
                      p.payment_method_name.toLowerCase().includes(q)
                    );
                  }
                  return true;
                })
                .map(pay => {
                  const isPending = pay.status === 'PENDING' || pay.status === 'UNDER_REVIEW';
                  const isApproved = pay.status === 'APPROVED';
                  const isRejected = pay.status === 'REJECTED';

                  return (
                    <tr key={pay.id} className="hover:bg-slate-900/40 transition-colors">
                      <td className="px-5 py-3.5 font-mono font-bold text-white">
                        {pay.order_reference}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="font-semibold text-white">{pay.user_name || 'Student Applicant'}</div>
                        <div className="text-[11px] text-slate-400">{pay.user_email}</div>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="font-semibold text-emerald-400">{pay.plan_name || 'Graduate Applicant Pro'}</div>
                        <div className="text-[11px] text-slate-300 font-bold">
                          {pay.currency} {pay.amount.toLocaleString()}
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="font-medium text-slate-200">{pay.payment_method_name}</div>
                        <div className="font-mono text-[11px] text-amber-400">TID: {pay.transaction_id}</div>
                      </td>
                      <td className="px-5 py-3.5">
                        {pay.proof_file_url ? (
                          <a
                            href={pay.proof_file_url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-emerald-400 hover:underline text-[11px] font-semibold"
                          >
                            View Receipt <ExternalLink className="w-3 h-3" />
                          </a>
                        ) : (
                          <span className="text-slate-500 text-[11px]">No image attached</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        {isApproved ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                            <CheckCircle2 className="w-3 h-3" /> Approved
                          </span>
                        ) : isRejected ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/30">
                            <X className="w-3 h-3" /> Rejected
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30 animate-pulse">
                            <Clock className="w-3 h-3" /> Pending Review
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        {isPending ? (
                          <div className="inline-flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setReviewingPayment(pay);
                                setReviewAction('APPROVE');
                                setReviewNote('Verified payment receipt against bank statement.');
                              }}
                              className="px-2.5 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold text-[11px] transition-colors"
                            >
                              Approve
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setReviewingPayment(pay);
                                setReviewAction('REJECT');
                                setReviewNote('Transaction ID was not found in bank ledger.');
                              }}
                              className="px-2.5 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 font-bold text-[11px] transition-colors"
                            >
                              Reject
                            </button>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-500 font-mono">
                            Reviewed {pay.reviewed_at ? new Date(pay.reviewed_at).toLocaleDateString() : 'Done'}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Payment Review Confirmation */}
      {reviewingPayment && reviewAction && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-slate-700 max-w-md w-full space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">
                {reviewAction === 'APPROVE' ? 'Confirm Payment Approval' : 'Reject Payment Submission'}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setReviewingPayment(null);
                  setReviewAction(null);
                }}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1.5 font-mono">
                <div className="flex justify-between">
                  <span className="text-slate-500">Order Ref:</span>
                  <span className="text-white font-bold">{reviewingPayment.order_reference}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Amount:</span>
                  <span className="text-emerald-400 font-bold">
                    {reviewingPayment.currency} {reviewingPayment.amount.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Transaction ID:</span>
                  <span className="text-amber-400">{reviewingPayment.transaction_id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Channel:</span>
                  <span className="text-slate-300">{reviewingPayment.payment_method_name}</span>
                </div>
              </div>

              {reviewAction === 'APPROVE' ? (
                <p className="text-slate-300 leading-relaxed text-xs">
                  Approving this payment will mark the order as <strong className="text-emerald-400">APPROVED</strong> and automatically activate the student&apos;s subscription (<span className="text-white font-bold">{reviewingPayment.plan_name}</span>) for the next billing cycle.
                </p>
              ) : (
                <p className="text-slate-300 leading-relaxed text-xs">
                  Rejecting this payment will notify the student and prompt them to re-check their transaction reference number or submit a fresh receipt.
                </p>
              )}

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Admin Verification Note (Recorded in Audit)</label>
                <textarea
                  rows={2}
                  value={reviewNote}
                  onChange={e => setReviewNote(e.target.value)}
                  placeholder="e.g. Verified transaction reference with JazzCash business portal."
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setReviewingPayment(null);
                    setReviewAction(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={onExecutePaymentReview}
                  disabled={saving}
                  className={`px-5 py-2 rounded-xl text-slate-950 text-xs font-bold shadow-md disabled:opacity-50 ${
                    reviewAction === 'APPROVE'
                      ? 'bg-emerald-500 hover:bg-emerald-400 shadow-emerald-500/20'
                      : 'bg-rose-500 hover:bg-rose-400 shadow-rose-500/20'
                  }`}
                >
                  {saving ? 'Processing...' : reviewAction === 'APPROVE' ? 'Confirm Approval' : 'Confirm Rejection'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
