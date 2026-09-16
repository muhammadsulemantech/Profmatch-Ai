'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  CreditCard,
  ShieldCheck,
  Building2,
  Wallet,
  CheckCircle2,
  AlertCircle,
  Upload,
  ArrowLeft,
  Sparkles,
  Lock,
  Globe,
  HelpCircle,
  FileCheck2,
  Loader2,
  Copy,
  Check
} from 'lucide-react';
import { PaymentMethod } from '@/types/database';
import { getAllCountries } from '@/lib/geography/global-geography';

function CheckoutContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const planParam = searchParams.get('plan') || 'student';
  const isPro = planParam.toLowerCase() === 'pro';

  // Plan Details (Dynamically computed based on currency/tier)
  const planInfo = useMemo(() => {
    if (isPro) {
      return {
        tier: 'PRO' as const,
        name: 'Research Lab & Scholar Pro',
        priceUsd: 49,
        pricePkr: 13500,
        period: 'month',
        features: [
          'Unlimited Global Professor Searches across 190+ Countries',
          '250 AI Grounded Discipline-Aware Emails / month',
          'Priority Faculty Verification Queue & Phone/Office Indexing',
          'Automated Multi-Stage Polite Follow-up Engine',
          'Comprehensive Portal Application Deadlines & Status Tracker',
        ],
      };
    }
    return {
      tier: 'STUDENT' as const,
      name: 'Graduate Applicant Pro',
      priceUsd: 19,
      pricePkr: 5200,
      period: 'month',
      features: [
        'Unlimited Global Professor Searches across 190+ Countries',
        '75 AI Grounded Discipline-Aware Emails / month',
        'Interdisciplinary Cross-Department Matching',
        'Automated Polite Follow-up Scheduler',
        'Application Tracker & Portal Deadlines',
        'Email Deliverability & Spam Safeguards',
      ],
    };
  }, [isPro]);

  // States
  const allCountries = useMemo(() => getAllCountries(), []);
  const [selectedCountry, setSelectedCountry] = useState<string>('Pakistan');
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [selectedMethodId, setSelectedMethodId] = useState<string>('');
  const [loadingMethods, setLoadingMethods] = useState<boolean>(true);

  // Form Inputs
  const [transactionId, setTransactionId] = useState('');
  const [paymentNote, setPaymentNote] = useState('');
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofPreviewUrl, setProofPreviewUrl] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Fetch Payment Methods for selected country
  useEffect(() => {
    let isMounted = true;
    async function loadMethods() {
      setLoadingMethods(true);
      try {
        const res = await fetch(`/api/payments/methods?country=${encodeURIComponent(selectedCountry)}`);
        const data = await res.json();
        if (isMounted && data.success) {
          setPaymentMethods(data.methods || []);
          if (data.methods && data.methods.length > 0) {
            setSelectedMethodId(data.methods[0].id);
          } else {
            setSelectedMethodId('');
          }
        }
      } catch (err) {
        console.error('Failed to load payment methods:', err);
      } finally {
        if (isMounted) setLoadingMethods(false);
      }
    }
    loadMethods();
    return () => {
      isMounted = false;
    };
  }, [selectedCountry]);

  // Selected payment method object
  const activeMethod = useMemo(() => {
    return paymentMethods.find(m => m.id === selectedMethodId);
  }, [paymentMethods, selectedMethodId]);

  // Current amount & currency according to selected method
  const currentCurrency = activeMethod?.currency || (selectedCountry === 'Pakistan' ? 'PKR' : 'USD');
  const currentAmount = currentCurrency === 'PKR' ? planInfo.pricePkr : planInfo.priceUsd;

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) {
        setErrorMessage('File size exceeds 5MB limit.');
        return;
      }
      setProofFile(file);
      setErrorMessage(null);

      // Create local preview
      const reader = new FileReader();
      reader.onload = () => {
        setProofPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeMethod) {
      setErrorMessage('Please select an active payment method.');
      return;
    }

    if (!transactionId.trim()) {
      setErrorMessage('Please provide a Transaction ID or payment reference number.');
      return;
    }

    setSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/checkout/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planTier: planInfo.tier,
          planName: planInfo.name,
          amount: currentAmount,
          currency: currentCurrency,
          billingInterval: 'monthly',
          paymentMethodId: activeMethod.id,
          paymentMethodName: activeMethod.name,
          transactionId: transactionId.trim(),
          paymentNote: paymentNote.trim(),
          proofFileName: proofFile?.name || 'payment_receipt.png',
          proofFileUrl: proofPreviewUrl || undefined,
          userEmail: 'student@example.com',
          userName: 'Alex Vance',
        }),
      });

      const data = await res.json();
      if (data.success && data.orderReference) {
        router.push(`/checkout/status/${data.orderReference}`);
      } else {
        setErrorMessage(data.error || 'Failed to submit payment details.');
      }
    } catch {
      setErrorMessage('An unexpected error occurred while communicating with the server.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#080B11] text-slate-100 py-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Back button & Breadcrumb */}
        <div className="flex items-center justify-between">
          <Link
            href="/pricing"
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Subscription Plans
          </Link>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            <Lock className="w-3 h-3 text-emerald-400" /> Secure SSL Verified Checkout
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Plan Summary (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="glass-panel bg-slate-900/60 rounded-2xl p-6 sm:p-8 border border-slate-800 shadow-xl space-y-6">
              <div className="space-y-1.5">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-400">
                  Subscription Order
                </span>
                <h1 className="text-2xl font-bold text-white tracking-tight">{planInfo.name}</h1>
                <p className="text-xs text-slate-400 font-light">
                  Billed monthly. Upgrade, pause, or cancel anytime from your student profile.
                </p>
              </div>

              <div className="bg-slate-950/80 rounded-xl p-4 border border-slate-800 flex items-baseline justify-between">
                <div>
                  <span className="text-xs text-slate-400">Total Due Today</span>
                  <div className="text-3xl font-extrabold text-white">
                    {currentCurrency === 'PKR' ? `Rs. ${currentAmount.toLocaleString()}` : `$${currentAmount}`}
                  </div>
                </div>
                <span className="text-xs text-slate-400">/ {planInfo.period}</span>
              </div>

              {/* Feature checklist */}
              <div className="space-y-3">
                <h4 className="text-xs font-semibold text-white uppercase tracking-wider">What is Included:</h4>
                <ul className="space-y-2.5 text-xs text-slate-300 font-light">
                  {planInfo.features.map((f, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span className="text-slate-200">{f}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 text-[11px] text-slate-400 leading-relaxed flex items-start gap-2 font-light">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  Payments are reviewed by our operations team. Once verified, your researcher account is unlocked immediately and all search quotas update.
                </span>
              </div>
            </div>
          </div>

          {/* Right Column: Country & Payment Method (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            {/* Step 1: Billing Country */}
            <div className="glass-panel bg-slate-900/60 rounded-2xl p-6 border border-slate-800 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
                  <Globe className="w-4 h-4 text-emerald-400" /> 1. Select Billing Country
                </label>
                <span className="text-[11px] text-slate-400">190+ Countries Supported</span>
              </div>

              <select
                value={selectedCountry}
                onChange={e => setSelectedCountry(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-emerald-500 transition-colors"
              >
                {allCountries.map(c => (
                  <option key={c.code} value={c.name} className="bg-slate-900 text-slate-100">
                    {c.name} ({c.regionLabel})
                  </option>
                ))}
              </select>
            </div>

            {/* Step 2: Payment Method Selection */}
            <div className="glass-panel bg-slate-900/60 rounded-2xl p-6 border border-slate-800 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
                  <Wallet className="w-4 h-4 text-emerald-400" /> 2. Choose Payment Channel
                </label>
                <span className="text-[11px] text-slate-400">
                  {paymentMethods.length} options available for {selectedCountry}
                </span>
              </div>

              {loadingMethods ? (
                <div className="flex items-center justify-center py-8 text-xs text-slate-400 gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
                  Loading payment channels...
                </div>
              ) : paymentMethods.length === 0 ? (
                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs">
                  No local payment channel is currently configured for {selectedCountry}. Please select another country or contact support.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {paymentMethods.map(m => {
                    const isSelected = m.id === selectedMethodId;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setSelectedMethodId(m.id)}
                        className={`p-4 rounded-xl border text-left transition-all relative ${
                          isSelected
                            ? 'border-emerald-500 bg-emerald-500/10 text-white ring-1 ring-emerald-500/30'
                            : 'border-slate-800 bg-slate-900/80 text-slate-400 hover:border-slate-700 hover:bg-slate-800/80'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-bold text-white">{m.name}</span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                            {m.currency}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 truncate">
                          {m.account_name || 'Official Account'}
                        </p>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Step 3: Payment Details & Instructions */}
            {activeMethod && (
              <div className="glass-panel bg-slate-900/60 rounded-2xl p-6 border border-slate-800 shadow-xl space-y-6">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-emerald-400" /> 3. Payment Instructions & Details
                  </span>
                  <span className="text-[11px] font-medium text-emerald-400">
                    {activeMethod.name}
                  </span>
                </div>

                {/* Account Info Display */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                      Account Title / Beneficiary
                    </span>
                    <div className="flex items-center justify-between text-xs font-bold text-white">
                      <span>{activeMethod.account_name}</span>
                      <button
                        type="button"
                        onClick={() => handleCopy(activeMethod.account_name, 'name')}
                        className="text-slate-400 hover:text-white p-1"
                        title="Copy Name"
                      >
                        {copiedKey === 'name' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                      Account Number / Wallet
                    </span>
                    <div className="flex items-center justify-between text-xs font-bold text-emerald-400 font-mono">
                      <span>{activeMethod.account_number}</span>
                      <button
                        type="button"
                        onClick={() => handleCopy(activeMethod.account_number, 'number')}
                        className="text-slate-400 hover:text-white p-1"
                        title="Copy Account Number"
                      >
                        {copiedKey === 'number' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>

                {activeMethod.account_identifier && (
                  <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                      IBAN / Account Identifier
                    </span>
                    <div className="flex items-center justify-between text-xs font-bold text-white font-mono">
                      <span>{activeMethod.account_identifier}</span>
                      <button
                        type="button"
                        onClick={() => handleCopy(activeMethod.account_identifier!, 'iban')}
                        className="text-slate-400 hover:text-white p-1"
                      >
                        {copiedKey === 'iban' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                )}

                {/* Instructions text */}
                <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1.5">
                  <span className="text-[11px] font-bold text-white">Transfer Instructions:</span>
                  <p className="text-xs text-slate-300 leading-relaxed font-light">
                    {activeMethod.instructions}
                  </p>
                </div>

                {/* Submission Form */}
                <form onSubmit={handleSubmit} className="space-y-4 pt-2 border-t border-slate-800">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-white flex items-center justify-between">
                      <span>Transaction Reference / Slip ID *</span>
                      <span className="text-[10px] text-slate-400">e.g. TID from JazzCash or Bank transfer receipt</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Enter Transaction ID (e.g. 0322984120)"
                      value={transactionId}
                      onChange={e => setTransactionId(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors font-mono"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-white">
                      Upload Receipt Screenshot (Optional)
                    </label>
                    <div className="flex items-center gap-3">
                      <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-950 border border-slate-800 hover:bg-slate-800 text-xs font-medium text-slate-200 transition-colors shadow-sm">
                        <Upload className="w-3.5 h-3.5 text-emerald-400" />
                        <span>{proofFile ? proofFile.name : 'Choose Image / Document'}</span>
                        <input
                          type="file"
                          accept="image/*,application/pdf"
                          onChange={handleFileChange}
                          className="hidden"
                        />
                      </label>
                      {proofFile && (
                        <span className="text-[11px] text-emerald-400 flex items-center gap-1 font-medium">
                          <Check className="w-3.5 h-3.5" /> Attached ({(proofFile.size / 1024).toFixed(0)} KB)
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-white">
                      Remarks / Student Email (Optional)
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Any relevant transfer remarks..."
                      value={paymentNote}
                      onChange={e => setPaymentNote(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
                    />
                  </div>

                  {errorMessage && (
                    <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{errorMessage}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" /> Submitting Confirmation...
                      </>
                    ) : (
                      <>
                        <FileCheck2 className="w-4 h-4" /> Submit Payment for Verification
                      </>
                    )}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-6xl mx-auto px-4 py-20 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin text-emerald-400" /> Loading Checkout Portal...
        </div>
      }
    >
      <CheckoutContent />
    </Suspense>
  );
}
