'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  FileText,
  Sparkles,
  Layers,
  ArrowLeft
} from 'lucide-react';
import { mockDb } from '@/lib/supabase/mock-db';
import { Order, Payment } from '@/types/database';

export default function OrderStatusPage() {
  const params = useParams();
  const router = useRouter();
  const reference = params.reference as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [payment, setPayment] = useState<Payment | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStatus = () => {
    setLoading(true);
    // Fetch from mock database
    const ord = mockDb.orders.find((o: Order) => o.order_reference === reference);
    const pay = mockDb.payments.find((p: Payment) => p.order_reference === reference);

    setOrder(ord || null);
    setPayment(pay || null);
    setLoading(false);
  };

  useEffect(() => {
    fetchStatus();
  }, [reference]);

  const status = payment?.status || order?.status || 'PENDING';

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16 space-y-8">
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
          <ShieldCheck className="w-3.5 h-3.5" /> Order Verification System
        </div>
        <h1 className="text-3xl font-black text-white">Payment Submission Status</h1>
        <p className="text-xs text-slate-400">
          Tracking Order Reference: <span className="text-emerald-400 font-mono font-bold">{reference}</span>
        </p>
      </div>

      <div className="glass-panel rounded-2xl p-8 border border-slate-800 space-y-8">
        {/* Status Hero Card */}
        {status === 'APPROVED' ? (
          <div className="text-center space-y-3 p-6 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
            <h3 className="text-xl font-bold text-white">Payment Confirmed & Subscription Active!</h3>
            <p className="text-xs text-slate-300 max-w-md mx-auto">
              Your payment has been verified by the administration team. Your plan entitlements, searches, and AI email generation have been fully unlocked.
            </p>
          </div>
        ) : status === 'REJECTED' ? (
          <div className="text-center space-y-3 p-6 rounded-xl bg-rose-500/10 border border-rose-500/30">
            <XCircle className="w-12 h-12 text-rose-400 mx-auto" />
            <h3 className="text-xl font-bold text-white">Payment Verification Unsuccessful</h3>
            <p className="text-xs text-rose-300 max-w-md mx-auto">
              {payment?.admin_review_note ||
                'The transaction ID or receipt could not be validated against bank records. Please re-submit your proof or contact support.'}
            </p>
          </div>
        ) : (
          <div className="text-center space-y-3 p-6 rounded-xl bg-amber-500/10 border border-amber-500/30">
            <Clock className="w-12 h-12 text-amber-400 mx-auto animate-pulse" />
            <h3 className="text-xl font-bold text-white">Payment Submitted &bull; Pending Verification</h3>
            <p className="text-xs text-slate-300 max-w-md mx-auto">
              We have safely received your transaction proof. Our verification team reviews manual bank & mobile wallet transfers typically within 15&ndash;60 minutes.
            </p>
          </div>
        )}

        {/* Order Details Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-900/80 border border-slate-800 text-xs">
          <div>
            <span className="text-slate-500 block text-[10px] uppercase font-semibold">Order Reference</span>
            <span className="font-mono font-bold text-white">{reference}</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[10px] uppercase font-semibold">Plan Selected</span>
            <span className="font-bold text-white">{order?.plan_name || 'Graduate Applicant Pro'}</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[10px] uppercase font-semibold">Amount</span>
            <span className="font-extrabold text-emerald-400">
              {order ? `${order.currency} ${order.amount.toLocaleString()}` : 'Rs. 5,200'}
            </span>
          </div>
          <div>
            <span className="text-slate-500 block text-[10px] uppercase font-semibold">Channel</span>
            <span className="font-medium text-slate-300">
              {payment?.payment_method_name || order?.payment_method_name || 'JazzCash'}
            </span>
          </div>
        </div>

        {payment && (
          <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Submitted Transaction ID:</span>
              <span className="font-mono font-bold text-slate-200">{payment.transaction_id}</span>
            </div>
            {payment.proof_file_name && (
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Attached Proof:</span>
                <span className="text-emerald-400 font-medium">{payment.proof_file_name}</span>
              </div>
            )}
            {payment.payment_note && (
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Student Remarks:</span>
                <span className="text-slate-300">{payment.payment_note}</span>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-800">
          <button
            onClick={fetchStatus}
            disabled={loading}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 hover:bg-slate-800 text-xs font-semibold text-slate-300 flex items-center justify-center gap-2 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh Status
          </button>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            {status === 'REJECTED' ? (
              <Link
                href="/checkout?plan=student"
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-amber-600 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5"
              >
                Re-submit Payment <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <Link
                href="/dashboard"
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 transition-all flex items-center justify-center gap-1.5"
              >
                Go to Dashboard <ArrowRight className="w-4 h-4" />
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
